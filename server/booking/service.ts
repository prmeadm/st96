// Запись на встречу: создание заявки, решение администратора, публичная доступность слотов.
import { normalizePhone, normalizeTelegram } from '../leads/parse'
import type { ClientRow, Repo } from '../repo'
import { BOOK_ORIGIN, bookingUrl, FORMAT_KEYS, SERVICE_KEYS, addDays, dayInfo, defaultSchedule, isDate, isTime, minskNow, normalizeSchedule, slotAvailable, tm, toInstant, toLocal, type DayBooking, type DayInfo, type FormatKey, type Schedule, type ServiceKey } from './schedule'
import type { BookingRow } from './types'

export const SCHEDULE_SETTING = 'booking_schedule'

export async function loadSchedule(repo: Repo): Promise<Schedule> {
  const raw = await repo.getSetting(SCHEDULE_SETTING).catch(() => null)
  try {
    return raw ? normalizeSchedule(JSON.parse(raw)) : defaultSchedule()
  } catch {
    return defaultSchedule()
  }
}
export async function saveSchedule(repo: Repo, raw: unknown): Promise<Schedule> {
  const s = normalizeSchedule(raw)
  await repo.setSetting(SCHEDULE_SETTING, JSON.stringify(s))
  return s
}

const toDay = (b: BookingRow): DayBooking & { date: string } => {
  const a = toLocal(b.starts_at)
  const e = toLocal(b.ends_at)
  return { date: a.date, startMin: a.min, endMin: e.date > a.date ? 1440 : e.min }
}
const byDate = (rows: BookingRow[]) => {
  const m = new Map<string, DayBooking[]>()
  for (const b of rows) { const d = toDay(b); m.set(d.date, [...(m.get(d.date) ?? []), { startMin: d.startMin, endMin: d.endMin }]) }
  return m
}

/** Границы месяца: первый и последний день */
const monthRange = (month: string): { first: string; last: string } | null => {
  const first = `${month}-01`
  if (!isDate(first)) return null
  const next = new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 1)).toISOString().slice(0, 10)
  return { first, last: addDays(next, -1) }
}

/** Свободные слоты месяца по уже загруженным заявкам (расчёт без обращений к базе) */
export function monthFrom(S: Schedule, rows: BookingRow[], month: string, format: FormatKey | null, now: Date): Record<string, { free: number; why?: string }> {
  const r = monthRange(month)
  if (!r) return {}
  const booked = byDate(rows)
  const out: Record<string, { free: number; why?: string }> = {}
  for (let d = r.first; d <= r.last; d = addDays(d, 1)) {
    const i = dayInfo(d, S, booked.get(d) ?? [], format, now)
    out[d] = i.closed ? { free: 0, why: i.why } : { free: i.free }
  }
  return out
}

/** Расписание и заявки месяца запрашиваются одновременно: ответ ждёт самый долгий запрос, а не сумму двух */
export async function loadMonth(repo: Repo, month: string, format: FormatKey | null, now: Date): Promise<{ S: Schedule; days: Record<string, { free: number; why?: string }> }> {
  const r = monthRange(month)
  const [S, rows] = await Promise.all([loadSchedule(repo), r ? repo.listActiveBookings(r.first, r.last) : Promise.resolve([])])
  return { S, days: monthFrom(S, rows, month, format, now) }
}

/** Свободные слоты за месяц: для календаря клиента и админки (одно обращение к базе). */
export async function monthAvailability(repo: Repo, S: Schedule, month: string, format: FormatKey | null, now: Date): Promise<Record<string, { free: number; why?: string }>> {
  const r = monthRange(month)
  return r ? monthFrom(S, await repo.listActiveBookings(r.first, r.last), month, format, now) : {}
}

export async function daySlots(repo: Repo, S: Schedule, date: string, format: FormatKey | null, now: Date): Promise<DayInfo> {
  const booked = byDate(await repo.listActiveBookings(date, date)).get(date) ?? []
  return dayInfo(date, S, booked, format, now)
}

/** День: расписание и заявки дня запрашиваются одновременно */
export async function loadDay(repo: Repo, date: string, format: FormatKey | null, now: Date): Promise<DayInfo> {
  const [S, rows] = await Promise.all([loadSchedule(repo), repo.listActiveBookings(date, date)])
  return dayInfo(date, S, byDate(rows).get(date) ?? [], format, now)
}

export type BookingInput = {
  service: unknown; format: unknown; date: unknown; time: unknown
  name?: unknown; company?: unknown; telegram?: unknown; phone?: unknown; goal?: unknown; comment?: unknown
  clientId?: unknown; runId?: string | null; runNode?: string | null; source?: string
}
export type Result<T> = ({ ok: true } & T) | { ok: false; error: string; status: number }
const txt = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '')

async function clientFor(repo: Repo, ref: unknown, name: string, phone: string | null, tg: string | null, company: string): Promise<ClientRow> {
  if (typeof ref === 'string' && ref) {
    const c = await repo.findClientById(ref).catch(() => null)
    if (c) return c
  }
  const found = (phone ? await repo.findClient({ phone }) : null) ?? (tg ? await repo.findClient({ username: tg }) : null)
  if (found) return found
  return repo.insertClient({ name, phone, tg_username: tg, company: company || null, language: 'ru', source: 'booking' })
}

export async function createBooking(repo: Repo, input: BookingInput, now = new Date()): Promise<Result<{ booking: BookingRow; client: ClientRow }>> {
  const service = input.service as ServiceKey
  const format = input.format as FormatKey
  if (!SERVICE_KEYS.includes(service)) return { ok: false, error: 'Выберите услугу', status: 422 }
  if (!FORMAT_KEYS.includes(format)) return { ok: false, error: 'Выберите формат встречи', status: 422 }
  if (!isDate(input.date) || !isTime(input.time)) return { ok: false, error: 'Выберите дату и время', status: 422 }
  const name = txt(input.name, 80)
  const phone = txt(input.phone, 40) ? normalizePhone(txt(input.phone, 40)) : null
  const telegram = txt(input.telegram, 40) ? normalizeTelegram(txt(input.telegram, 40)) : null
  if (!name) return { ok: false, error: 'Укажите имя', status: 422 }
  if (!phone && !telegram) return { ok: false, error: 'Укажите телефон или Telegram, чтобы мы могли подтвердить время', status: 422 }
  const date = input.date
  const time = input.time

  const recent = await repo.countRecentBookings({ phone, telegram }, new Date(now.getTime() - 3600_000).toISOString())
  if (recent >= 3) return { ok: false, error: 'Слишком много заявок за час. Подождите или напишите нам в Telegram', status: 429 }

  const S = await loadSchedule(repo)
  const booked = byDate(await repo.listActiveBookings(date, date)).get(date) ?? []
  const check = slotAvailable(date, time, S, booked, format, now)
  if (!check.ok) return { ok: false, error: 'Это время недоступно. Выберите другое', status: 409 }

  const dur = S.rules.duration
  const starts = toInstant(date, time)
  const client = await clientFor(repo, input.clientId, name, phone, telegram ? telegram.replace(/^@/, '') : null, txt(input.company, 80))
  const res = await repo.insertBooking({
    client_id: client.id, run_id: input.runId ?? null, run_node: input.runNode ?? null, service, format,
    starts_at: starts.toISOString(), ends_at: new Date(starts.getTime() + dur * 60_000).toISOString(),
    name, company: txt(input.company, 80) || null, telegram, phone, goal: txt(input.goal, 300) || null, comment: txt(input.comment, 500) || null,
    source: input.source ?? 'site',
  })
  if (!res.ok) return { ok: false, error: 'Это время только что заняли. Выберите другое', status: 409 }
  return { ok: true, booking: res.booking, client }
}

/** Решение администратора. Подтверждённую можно позже отменить. Возвращает обновлённую заявку. */
/** Контакты клиента для формы записи: из карточки, а чего не хватает (ник Telegram, телефон, имя, компания), берём из его последних заявок */
export async function clientContacts(repo: Repo, id: string): Promise<{ name: string; company: string; phone: string; telegram: string } | null> {
  const c = await repo.findClientById(id).catch(() => null)
  if (!c) return null
  const leads = await repo.leadContacts(c.id).catch(() => [])
  const pick = (own: string | null | undefined, from: (l: (typeof leads)[number]) => string | null) => (own?.trim() ? own.trim() : (leads.map(from).find((v) => v && v.trim()) ?? '').trim())
  const tg = pick(c.tg_username ? `@${c.tg_username.replace(/^@/, '')}` : '', (l) => l.telegram)
  return { name: pick(c.name, (l) => l.name), company: pick(c.company, (l) => l.company), phone: pick(c.phone, (l) => l.phone), telegram: tg && !tg.startsWith('@') ? `@${tg}` : tg }
}

export const DIRECT_ADMINS_SETTING = 'booking_direct_admins'
export const DEFAULT_DIRECT_ADMINS = ['studia96']
const cleanNick = (v: string) => v.trim().replace(/^@/, '').toLowerCase()
export const parseNicks = (raw: string | null): string[] => [...new Set((raw ?? '').split(/[\s,;]+/).map(cleanNick).filter((x) => /^[a-z][a-z0-9_]{4,31}$/.test(x)))]
/** Администраторы, которым заявка на встречу приходит лично в Telegram (ники; по умолчанию @studia96). Они должны хотя бы раз запустить бота. */
export async function loadDirectAdmins(repo: Repo): Promise<string[]> {
  const raw = await repo.getSetting(DIRECT_ADMINS_SETTING).catch(() => null)
  return raw === null ? DEFAULT_DIRECT_ADMINS : parseNicks(raw)
}
export async function saveDirectAdmins(repo: Repo, raw: string): Promise<Result<{ nicks: string[] }>> {
  const nicks = parseNicks(raw)
  await repo.setSetting(DIRECT_ADMINS_SETTING, nicks.join(', '))
  return { ok: true, nicks }
}

export const MEET_SETTING = 'booking_meet_default'
const isHttps = (u: string) => /^https:\/\/[^\s]+$/.test(u)
/** Ссылка на видеозвонок по умолчанию (постоянная комната Google Meet): подставляется в видеозвонки при подтверждении */
export async function loadMeetDefault(repo: Repo): Promise<string> {
  const v = ((await repo.getSetting(MEET_SETTING).catch(() => null)) ?? '').trim()
  return isHttps(v) ? v : ''
}
export async function saveMeetDefault(repo: Repo, url: string): Promise<Result<{ url: string }>> {
  const u = url.trim()
  if (u && !isHttps(u)) return { ok: false, error: 'Ссылка должна начинаться с https://', status: 422 }
  await repo.setSetting(MEET_SETTING, u)
  return { ok: true, url: u }
}

export async function decideBooking(repo: Repo, id: string, decision: 'confirm' | 'reject' | 'cancel', meetUrl?: string): Promise<Result<{ booking: BookingRow }>> {
  const b = await repo.getBooking(id)
  if (!b) return { ok: false, error: 'Заявка не найдена', status: 404 }
  const from: Record<typeof decision, BookingRow['status'][]> = { confirm: ['pending'], reject: ['pending'], cancel: ['confirmed', 'pending'] }
  if (!from[decision].includes(b.status)) return { ok: false, error: 'Эту заявку уже обработали', status: 409 }
  let url = (meetUrl ?? '').trim()
  if (url && !isHttps(url)) return { ok: false, error: 'Ссылка на встречу должна начинаться с https://', status: 422 }
  // Видеозвонок без своей ссылки получает общую: клиент увидит её в сообщении и в файле календаря
  if (decision === 'confirm' && b.format === 'video' && !url && !b.meet_url) url = await loadMeetDefault(repo)
  const status = decision === 'confirm' ? 'confirmed' : decision === 'reject' ? 'rejected' : 'canceled'
  await repo.updateBooking(id, { status, decided_at: new Date().toISOString(), ...(decision === 'confirm' && url ? { meet_url: url } : {}) })
  // Воронка, ждавшая записи, продолжается по выходу «подтвердил» или «отклонил»
  if (b.run_id && decision !== 'cancel') await repo.enqueueJob('booking_resume', new Date(), { runId: b.run_id, handle: decision === 'confirm' ? 'confirmed' : 'declined', bookingId: id })
  return { ok: true, booking: { ...b, status, meet_url: url || b.meet_url } }
}

export async function setMeetUrl(repo: Repo, id: string, meetUrl: string): Promise<Result<{ booking: BookingRow }>> {
  const b = await repo.getBooking(id)
  if (!b) return { ok: false, error: 'Заявка не найдена', status: 404 }
  const url = meetUrl.trim()
  if (url && !/^https:\/\/[^\s]+$/.test(url)) return { ok: false, error: 'Ссылка на встречу должна начинаться с https://', status: 422 }
  await repo.updateBooking(id, { meet_url: url || null })
  return { ok: true, booking: { ...b, meet_url: url || null } }
}

export { BOOK_ORIGIN, bookingUrl, minskNow, tm }

/** Есть ли хоть один свободный слот в ближайшее время (для условия воронки «Есть свободные слоты»). */
export async function hasFreeSlots(repo: Repo, now: Date): Promise<boolean> {
  const S = await loadSchedule(repo)
  const today = minskNow(now).date
  for (const month of [today.slice(0, 7), addDays(today, 31).slice(0, 7)]) {
    const days = await monthAvailability(repo, S, month, null, now)
    if (Object.values(days).some((d) => d.free > 0)) return true
  }
  return false
}

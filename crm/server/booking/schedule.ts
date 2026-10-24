// Расчёт свободных слотов: правила -> закрытые дни -> блоки -> существующие заявки -> лимиты.
// Часовой пояс Минск (UTC+3, без перехода на летнее время): даты и время считаем строками «ГГГГ-ММ-ДД» и минутами от полуночи.
import { SERVICE_SLUGS, SITE_SERVICES } from '../catalog'

export const TZ_OFFSET_MIN = 180
// Услуги берутся только с сайта (server/catalog.ts ← src/data/services.ts)
export const SERVICE_KEYS: readonly string[] = SERVICE_SLUGS
export type ServiceKey = string
export const SERVICE_LABEL: Record<ServiceKey, { ru: string; en: string }> = Object.fromEntries(SITE_SERVICES.map((s) => [s.key, { ru: s.ru, en: s.en }]))
export const FORMAT_KEYS = ['call', 'video', 'offline'] as const
export type FormatKey = (typeof FORMAT_KEYS)[number]
export const FORMAT_LABEL: Record<FormatKey, { ru: string; en: string }> = {
  call: { ru: 'Телефонный звонок', en: 'Phone call' },
  video: { ru: 'Видеозвонок', en: 'Video call' },
  offline: { ru: 'Офлайн встреча', en: 'In-person meeting' },
}
export const DOW = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

export type Win = { from: string; to: string }
export type Block = Win & { reason?: string }
export type Override = { closed?: boolean; open?: boolean; reason?: string; windows?: Win[]; blocks?: Block[] }
export type Rules = { step: number; buffer: number; minNotice: number; horizon: number; maxPerDay: number; /** длительность встречи, мин: общая для всех услуг */ duration: number; offlineDays: number[] }
export type Schedule = { week: Record<number, { on: boolean; windows: Win[] }>; overrides: Record<string, Override>; rules: Rules }
/** Занятое время дня в минутах от полуночи */
export type DayBooking = { startMin: number; endMin: number }
export type SlotInfo = { t: string; free: boolean; why?: string }
export type DayInfo = { closed: boolean; why?: string; past?: boolean; far?: boolean; slots: SlotInfo[]; free: number; wins?: Win[] }

export function defaultSchedule(): Schedule {
  const week: Schedule['week'] = {}
  for (let i = 0; i < 5; i++) week[i] = { on: true, windows: [{ from: '10:00', to: '13:00' }, { from: '14:00', to: '18:00' }] }
  week[5] = { on: true, windows: [{ from: '11:00', to: '15:00' }] }
  week[6] = { on: false, windows: [{ from: '11:00', to: '15:00' }] }
  return {
    week, overrides: {},
    rules: { step: 30, buffer: 15, minNotice: 3, horizon: 45, maxPerDay: 5, duration: 60, offlineDays: [1, 3] },
  }
}

// ───────── даты и время ─────────
export const pad = (n: number) => String(n).padStart(2, '0')
const dayNum = (d: string) => { const [y, m, dd] = d.split('-').map(Number); return Math.floor(Date.UTC(y!, m! - 1, dd!) / 86_400_000) }
export const fromDayNum = (n: number) => new Date(n * 86_400_000).toISOString().slice(0, 10)
export const addDays = (d: string, n: number) => fromDayNum(dayNum(d) + n)
export const dowOf = (d: string) => (new Date(dayNum(d) * 86_400_000).getUTCDay() + 6) % 7
export const tm = (s: string) => { const [h, m] = s.split(':').map(Number); return h! * 60 + m! }
export const hm = (n: number) => `${pad(Math.floor(n / 60))}:${pad(n % 60)}`
export const isDate = (s: unknown): s is string => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && fromDayNum(dayNum(s)) === s
export const isTime = (s: unknown): s is string => typeof s === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(s)

/** «Сейчас» по Минску: дата и минуты от полуночи */
export function minskNow(now: Date): { date: string; min: number } {
  const local = new Date(now.getTime() + TZ_OFFSET_MIN * 60_000)
  return { date: local.toISOString().slice(0, 10), min: local.getUTCHours() * 60 + local.getUTCMinutes() }
}
/** Момент встречи (UTC) по дате и времени Минска */
export const toInstant = (date: string, time: string) => new Date(`${date}T${time}:00+03:00`)
/** Дата и минуты по Минску из момента времени */
export function toLocal(iso: string | Date): { date: string; min: number } {
  const d = typeof iso === 'string' ? new Date(iso) : iso
  return minskNow(d)
}

// ───────── проверка и нормализация расписания (то, что пришло из админки или базы) ─────────
const clampInt = (v: unknown, lo: number, hi: number, dflt: number) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(hi, Math.max(lo, Math.round(v))) : dflt)
const cleanWin = (w: unknown): Win | null => {
  const x = w as Win
  return x && isTime(x.from) && isTime(x.to) && tm(x.to) > tm(x.from) ? { from: x.from, to: x.to } : null
}
const cleanWins = (v: unknown): Win[] => (Array.isArray(v) ? v.map(cleanWin).filter((x): x is Win => !!x).slice(0, 6) : [])

export function normalizeSchedule(raw: unknown): Schedule {
  const base = defaultSchedule()
  const r = raw as Partial<Schedule> | null
  if (!r || typeof r !== 'object') return base
  const week: Schedule['week'] = {}
  for (let i = 0; i < 7; i++) {
    const w = (r.week as Schedule['week'] | undefined)?.[i]
    const wins = cleanWins(w?.windows)
    week[i] = { on: typeof w?.on === 'boolean' ? w.on : base.week[i]!.on, windows: wins.length ? wins : base.week[i]!.windows }
  }
  const overrides: Schedule['overrides'] = {}
  for (const [k, o] of Object.entries((r.overrides ?? {}) as Record<string, Override>).slice(0, 800)) {
    if (!isDate(k) || !o || typeof o !== 'object') continue
    const ov: Override = {}
    if (o.closed) ov.closed = true
    if (o.open) ov.open = true
    if (typeof o.reason === 'string') ov.reason = o.reason.slice(0, 80)
    const wins = cleanWins(o.windows)
    if (wins.length) ov.windows = wins
    const blocks: Block[] = []
    for (const b of Array.isArray(o.blocks) ? o.blocks.slice(0, 12) : []) {
      const w = cleanWin(b)
      if (w) blocks.push({ ...w, reason: typeof (b as Block).reason === 'string' ? (b as Block).reason!.slice(0, 80) : undefined })
    }
    if (blocks.length) ov.blocks = blocks
    if (Object.keys(ov).length) overrides[k] = ov
  }
  const rr = (r.rules ?? {}) as Partial<Rules>
  const rules: Rules = {
    step: [15, 30, 60].includes(rr.step as number) ? (rr.step as number) : base.rules.step,
    buffer: clampInt(rr.buffer, 0, 120, base.rules.buffer),
    minNotice: clampInt(rr.minNotice, 0, 720, base.rules.minNotice),
    horizon: clampInt(rr.horizon, 1, 365, base.rules.horizon),
    maxPerDay: clampInt(rr.maxPerDay, 1, 50, base.rules.maxPerDay),
    duration: clampInt(rr.duration, 10, 240, base.rules.duration),
    offlineDays: Array.isArray(rr.offlineDays) ? [...new Set(rr.offlineDays.filter((x): x is number => Number.isInteger(x) && x >= 0 && x <= 6))] : base.rules.offlineDays,
  }
  return { week, overrides, rules }
}

// ───────── слоты дня ─────────
// Расписание общее для всех услуг: услуга влияет только на подпись встречи, не на слоты
export function dayInfo(date: string, S: Schedule, booked: DayBooking[], format: FormatKey | null, now: Date): DayInfo {
  const R = S.rules
  const today = minskNow(now)
  if (date < today.date) return { closed: true, why: 'Прошедший день', slots: [], free: 0, past: true }
  if (dayNum(date) > dayNum(today.date) + R.horizon) return { closed: true, why: 'За пределами горизонта записи', slots: [], free: 0, far: true }
  const ov = S.overrides[date] ?? {}
  if (ov.closed) return { closed: true, why: ov.reason || 'Закрыт вручную', slots: [], free: 0 }
  const dow = dowOf(date)
  if (format === 'offline' && !R.offlineDays.includes(dow)) return { closed: true, why: 'Офлайн-встречи в этот день не проводятся', slots: [], free: 0 }
  const wins = ov.windows?.length ? ov.windows : ov.open ? [{ from: '10:00', to: '18:00' }] : S.week[dow]?.on ? S.week[dow]!.windows : []
  if (!wins.length) return { closed: true, why: 'Выходной по расписанию', slots: [], free: 0 }
  const dur = R.duration
  const busy: [number, number, string][] = []
  for (const b of ov.blocks ?? []) busy.push([tm(b.from), tm(b.to), b.reason || 'Закрыто вручную'])
  for (const b of booked) busy.push([b.startMin - R.buffer, b.endMin + R.buffer, 'Уже есть заявка'])
  const limit = booked.length >= R.maxPerDay
  const nowAbs = dayNum(today.date) * 1440 + today.min + R.minNotice * 60
  const slots: SlotInfo[] = []
  for (const w of wins) {
    for (let s = tm(w.from); s + dur <= tm(w.to); s += R.step) {
      let why = ''
      if (dayNum(date) * 1440 + s < nowAbs) why = 'Слишком скоро'
      else if (limit) why = 'Лимит встреч на день'
      else { const c = busy.find(([a, b]) => s < b && s + dur > a); if (c) why = c[2] }
      slots.push(why ? { t: hm(s), free: false, why } : { t: hm(s), free: true })
    }
  }
  return { closed: false, slots, wins, free: slots.filter((x) => x.free).length }
}

/** Свободно ли конкретное время (проверка перед записью на сервере) */
export function slotAvailable(date: string, time: string, S: Schedule, booked: DayBooking[], format: FormatKey | null, now: Date): { ok: true } | { ok: false; why: string } {
  const info = dayInfo(date, S, booked, format, now)
  if (info.closed) return { ok: false, why: info.why ?? 'День закрыт' }
  const s = info.slots.find((x) => x.t === time)
  if (!s) return { ok: false, why: 'Такого времени нет в расписании' }
  return s.free ? { ok: true } : { ok: false, why: s.why ?? 'Время занято' }
}

export const HOLIDAYS_BY: [number, number, string][] = [[0, 1, 'Новый год'], [0, 7, 'Рождество'], [2, 8, '8 Марта'], [4, 1, 'Праздник труда'], [4, 9, 'День Победы'], [6, 3, 'День Независимости'], [10, 7, 'Октябрьская революция'], [11, 25, 'Католическое Рождество']]

const MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря']
const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DOW_RU = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс']
const DOW_EN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

/** Дата и время встречи по Минску отдельно: «25 октября, сб» и «15:00 (Минск)». */
export function whenParts(iso: string, lang: 'ru' | 'en' = 'ru'): { date: string; time: string } {
  const { date, min } = toLocal(iso)
  const [y, m, d] = date.split('-').map(Number)
  const dow = (new Date(Date.UTC(y!, m! - 1, d!)).getUTCDay() + 6) % 7
  const t = `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`
  return lang === 'en'
    ? { date: `${DOW_EN[dow]}, ${MONTHS_EN[m! - 1]} ${d}`, time: `${t} (Minsk)` }
    : { date: `${d} ${MONTHS[m! - 1]}, ${DOW_RU[dow]}`, time: `${t} (Минск)` }
}

export function whenLabel(iso: string, lang: 'ru' | 'en' = 'ru'): string {
  const p = whenParts(iso, lang)
  return `${p.date}, ${p.time}`
}

export const BOOK_ORIGIN = 'https://st96.by'

/** Личная ссылка на запись: клиент, пришедший по ней, привязывается к своей карточке. */
export function bookingUrl(clientId?: string | null, opts: { service?: ServiceKey; format?: FormatKey; run?: string; node?: string } = {}): string {
  const q = new URLSearchParams()
  if (clientId) q.set('c', clientId)
  if (opts.service) q.set('s', opts.service)
  if (opts.format) q.set('f', opts.format)
  if (opts.run) q.set('r', opts.run)
  if (opts.node) q.set('n', opts.node)
  const s = q.toString()
  return `${BOOK_ORIGIN}/book${s ? `?${s}` : ''}`
}

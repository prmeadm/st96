// Заявка «вручную»: администратор копирует текст из Telegram (или любого чата), поля раскладываются сами.
// Работает с любым текстом: с метками («Имя: …», «Телефон: …»), без меток, с шапкой пересланного сообщения.
import { UNKNOWN_SERVICE, detectServiceInText, serviceByLabel, serviceLabel } from '../catalog'
import type { Repo } from '../repo'
import { ingestLead, upsertClientFromLead } from './ingest'
import { normalizePhone, normalizeTelegram, parseLead, type ParsedLead } from './parse'

export type LeadFields = {
  service_key: string
  name: string
  phone: string
  telegram: string
  email: string
  company: string
  comment: string
  status?: 'new' | 'in_progress' | 'won' | 'lost' | 'spam'
}

type Key = 'name' | 'phone' | 'telegram' | 'email' | 'company' | 'interest' | 'comment'
const LABELS: Record<string, Key> = {
  имя: 'name', name: 'name', фио: 'name', клиент: 'name', 'контактное лицо': 'name',
  телефон: 'phone', тел: 'phone', phone: 'phone', номер: 'phone', whatsapp: 'phone', viber: 'phone', контакт: 'phone', контакты: 'phone',
  telegram: 'telegram', телеграм: 'telegram', телеграмм: 'telegram', тг: 'telegram', tg: 'telegram', username: 'telegram', ник: 'telegram',
  email: 'email', 'e-mail': 'email', почта: 'email', 'эл. почта': 'email',
  компания: 'company', company: 'company', организация: 'company', бизнес: 'company',
  услуга: 'interest', интересует: 'interest', service: 'interest', сервис: 'interest', тема: 'interest', заявка: 'interest',
  комментарий: 'comment', сообщение: 'comment', задача: 'comment', запрос: 'comment', описание: 'comment', примечание: 'comment', comment: 'comment', message: 'comment',
}
const LABEL_RE = /^\s*([^:\n]{2,30}?)\s*:\s*(.*)$/
const EMAIL_RE = /[^\s@<>()]+@[^\s@<>()]+\.[A-Za-z]{2,}/
const HANDLE_RE = /(?:https?:\/\/)?(?:t\.me|telegram\.me)\/[A-Za-z]\w{3,31}|(?<![\w.])@[A-Za-z][A-Za-z0-9_]{4,31}/
const PHONE_RE = /\+?\d[\d\s()\-]{8,}\d/
// Шапка пересланного/скопированного сообщения Telegram: «Имя Фамилия, [20.10.2026 09:15]», «Имя, 20.10.2026 9:15»
const HEAD_RE = /^(.{1,60}?)[,\s]+\[?\d{1,2}[./]\d{1,2}[./]\d{2,4}[,\s]+\d{1,2}:\d{2}(?::\d{2})?\]?\s*$/

/** Чистый разбор текста в поля заявки. Ничего не сохраняет. */
export function parseManualText(raw: string): { fields: LeadFields; warnings: string[] } {
  const text = raw.replace(/\r/g, '').trim()
  const warnings: string[] = []
  // Текст в формате заявок группы/сайта разбирается проверенным разборщиком
  const known = parseLead(text)
  if (known.isLead) {
    return { fields: { service_key: known.service, name: known.name, phone: known.phone, telegram: known.telegram, email: known.email, company: known.company, comment: known.comment }, warnings: known.warnings }
  }

  const got: Partial<Record<Key, string>> = {}
  const free: string[] = []
  let headName = ''
  let cur: Key | null = null
  for (const line of text.split('\n')) {
    const l = line.trim()
    if (!l) { cur = null; continue }
    const h = l.match(HEAD_RE)
    if (h && !headName) { headName = h[1]!.trim().replace(/[:,]$/, ''); cur = null; continue }
    const m = l.match(LABEL_RE)
    const key = m ? LABELS[m[1]!.toLowerCase()] : undefined
    if (key) { cur = key; got[key] = ((got[key] ? got[key] + '\n' : '') + m![2]!.trim()).trim(); continue }
    if (cur === 'comment') got.comment = (got.comment ?? '') + '\n' + l
    else free.push(l)
  }

  // Контакты ищем по виду значения: где бы они ни стояли (в метке, строке или тексте)
  const pool = [got.name, got.phone, got.telegram, got.email, got.company, ...free, got.comment].filter(Boolean) as string[]
  const strip = (s: string, re: RegExp) => s.replace(new RegExp(re.source, re.flags.replace('g', '') + 'g'), ' ')
  let email = ''
  let telegram = ''
  let phone = ''
  const rest: string[] = []
  for (const piece of pool) {
    let t = piece
    const e = t.match(EMAIL_RE)
    if (e) { email ||= e[0].toLowerCase(); t = strip(t, EMAIL_RE) }
    const h = t.match(HANDLE_RE)
    if (h) { telegram ||= normalizeTelegram(h[0]) ?? ''; t = strip(t, HANDLE_RE) }
    const pm = t.match(PHONE_RE)
    if (pm) {
      const p = normalizePhone(pm[0])
      if (p) { phone ||= p; t = strip(t, PHONE_RE) } else warnings.push('phone_unrecognized')
    }
    rest.push(t)
  }
  // Ник без @ в поле Telegram («Telegram: Sirmshir»)
  if (!telegram && got.telegram) telegram = normalizeTelegram(got.telegram) ?? ''

  const cleaned = (s: string) => s.replace(/[\s,;|]+/g, ' ').replace(/^[\s\-–—:,.]+|[\s\-–—:,]+$/g, '').trim()
  const looksName = (s: string) => /^[\p{L}][\p{L}'.\- ]{1,39}$/u.test(s) && s.split(/\s+/).length <= 4 && !/[.!?]$/.test(s)
  let name = got.name ? cleaned(strip(strip(strip(got.name, EMAIL_RE), HANDLE_RE), PHONE_RE)) : ''
  if (!name && headName) name = headName
  const light = (f: string) => strip(strip(strip(f, EMAIL_RE), HANDLE_RE), PHONE_RE).replace(/[ \t]+/g, ' ').replace(/^[\s,;|\-–—:]+|[\s,;|\-–—:]+$/g, '')
  const lines = free.map(light)
  if (!name) {
    const i = lines.findIndex((l) => looksName(cleaned(l)) && !serviceByLabel(cleaned(l)) && detectServiceInText(l) === UNKNOWN_SERVICE)
    if (i >= 0) { name = cleaned(lines[i]!); lines.splice(i, 1) }
  }
  const company = got.company ? cleaned(strip(strip(strip(got.company, EMAIL_RE), HANDLE_RE), PHONE_RE)) : ''
  if (got.name && !name) warnings.push('no_name')

  const commentParts = [...lines.filter(Boolean), got.comment ? strip(strip(strip(got.comment, EMAIL_RE), HANDLE_RE), PHONE_RE).split('\n').map((x) => x.replace(/[ \t]+/g, ' ').trim()).filter(Boolean).join('\n') : '']
  const comment = commentParts.filter(Boolean).join('\n')
  const service = got.interest ? (serviceByLabel(got.interest) ?? detectServiceInText(got.interest)) : detectServiceInText(text)
  if (!name) warnings.push('no_name')
  if (!phone && !telegram && !email) warnings.push('no_contact')
  return { fields: { service_key: service, name, phone, telegram, email, company, comment }, warnings: [...new Set(warnings)] }
}

const clean = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '')

/** Поля из формы администратора: проверка и приведение телефона и ника к единому виду */
export function cleanFields(f: Partial<LeadFields>): { fields: LeadFields; warnings: string[] } {
  const warnings: string[] = []
  const phoneRaw = clean(f.phone, 40)
  const phone = phoneRaw ? (normalizePhone(phoneRaw) ?? '') : ''
  if (phoneRaw && !phone) warnings.push('phone_unrecognized')
  const tgRaw = clean(f.telegram, 60)
  const telegram = tgRaw ? (normalizeTelegram(tgRaw) ?? '') : ''
  if (tgRaw && !telegram) warnings.push('telegram_unrecognized')
  const email = clean(f.email, 120).toLowerCase()
  const name = clean(f.name, 120)
  if (!name) warnings.push('no_name')
  if (!phone && !telegram && !email) warnings.push('no_contact')
  const status = f.status && ['new', 'in_progress', 'won', 'lost', 'spam'].includes(f.status) ? f.status : undefined
  return {
    fields: { service_key: clean(f.service_key, 40) || UNKNOWN_SERVICE, name, phone, telegram, email, company: clean(f.company, 120), comment: clean(f.comment, 4000), status },
    warnings,
  }
}

const asParsed = (f: LeadFields, warnings: string[]): ParsedLead => ({
  isLead: true, origin: 'unknown', title: serviceLabel(f.service_key), topic: '', service: f.service_key, name: f.name, phone: f.phone, telegram: f.telegram,
  email: f.email, company: f.company, comment: f.comment, interest: '', lang: '', landing: '', warnings,
})

type Result = { ok: true; leadId: string; clientId: string | null; clientCreated: boolean; leadsOfClient: number } | { ok: false; error: string }

/** Создание заявки из формы: клиент ищется по телефону, затем по нику, иначе создаётся. У клиента заявок сколько угодно. */
export async function createManualLead(repo: Repo, input: Partial<LeadFields>, rawText: string): Promise<Result> {
  const { fields, warnings } = cleanFields(input)
  if (!fields.phone && !fields.telegram && !fields.email && !fields.name && !fields.comment) return { ok: false, error: 'Пустая заявка: добавьте имя, контакт или текст' }
  const before = (fields.phone && (await repo.findClient({ phone: fields.phone }))) || (fields.telegram && (await repo.findClient({ username: fields.telegram })))
  const r = await ingestLead(repo, asParsed(fields, warnings), { source: 'manual', rawText })
  if (fields.status && fields.status !== 'new') await repo.updateLead(r.leadId, { status: fields.status })
  const leadsOfClient = r.clientId ? (await repo.countLeads(r.clientId)) : 1
  return { ok: true, leadId: r.leadId, clientId: r.clientId, clientCreated: !before && !!r.clientId, leadsOfClient }
}

/** Правка заявки. Если изменились телефон или ник, заявка переезжает к нужному клиенту (находится или создаётся). */
export async function updateManualLead(repo: Repo, id: string, input: Partial<LeadFields>): Promise<Result> {
  const lead = await repo.getLead(id)
  if (!lead) return { ok: false, error: 'Заявка не найдена' }
  const { fields, warnings } = cleanFields(input)
  const contactChanged = (lead.phone ?? '') !== fields.phone || (lead.telegram ?? '') !== fields.telegram || (lead.email ?? '') !== fields.email
  let clientId = lead.client_id
  let clientCreated = false
  if (contactChanged || !clientId) {
    const before = (fields.phone && (await repo.findClient({ phone: fields.phone }))) || (fields.telegram && (await repo.findClient({ username: fields.telegram })))
    const c = await upsertClientFromLead(repo, asParsed(fields, warnings), 'manual')
    if (c) { clientId = c.id; clientCreated = !before }
  }
  await repo.updateLead(id, {
    client_id: clientId, service_key: fields.service_key, title: serviceLabel(fields.service_key), name: fields.name || null, phone: fields.phone || null,
    telegram: fields.telegram || null, email: fields.email || null, company: fields.company || null, comment: fields.comment || null, warnings,
    ...(fields.status ? { status: fields.status } : {}),
  })
  return { ok: true, leadId: id, clientId, clientCreated, leadsOfClient: clientId ? await repo.countLeads(clientId) : 1 }
}

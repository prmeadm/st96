// Разбор текста заявки из группы «Лиды ST96» в структуру.
// Формат задают api/lead.ts (сайт) и форма памятки стенда. Сотрудники иногда путают поля:
// в «Имя» попадает телефон, имени нет, ник в Telegram без @. Парсер сначала читает поля
// как есть, потом определяет тип каждого значения и раскладывает его правильно.

export type LeadOrigin = 'site' | 'stand' | 'unknown'
export type ServiceKey = 'neurophoto' | 'retouch' | 'digital_office' | 'production' | 'other'

export type ParsedLead = {
  isLead: boolean
  origin: LeadOrigin
  title: string
  topic: string
  service: ServiceKey
  name: string
  phone: string
  telegram: string
  email: string
  company: string
  comment: string
  interest: string
  lang: 'ru' | 'en' | ''
  landing: string
  warnings: string[]
}

type FieldKey = 'name' | 'phone' | 'contact' | 'telegram' | 'company' | 'comment' | 'interest' | 'source' | 'lang' | 'landing' | 'skip'

const LABELS: Record<string, FieldKey> = {
  имя: 'name',
  телефон: 'phone',
  контакт: 'contact',
  telegram: 'telegram',
  телеграм: 'telegram',
  компания: 'company',
  комментарий: 'comment',
  сообщение: 'comment',
  интересует: 'interest',
  источник: 'source',
  'язык сайта': 'lang',
  'страница входа': 'landing',
  'согласие на обработку пд': 'skip',
  'согласие на рекламу и передачу данных в рекламных целях': 'skip',
}

const LABEL_RE = /^\s*([^:\n]{2,60}?)\s*:\s*(.*)$/

export function normalizePhone(raw: string): string | null {
  let d = raw.replace(/\D/g, '')
  if (!d) return null
  if (d.startsWith('00')) d = d.slice(2)
  if (d.length === 11 && d.startsWith('80') && /^(25|29|33|44)/.test(d.slice(2))) d = '375' + d.slice(2)
  else if (d.length === 11 && d.startsWith('8')) d = '7' + d.slice(1)
  else if (d.length === 9 && /^(25|29|33|44)/.test(d)) d = '375' + d
  else if (d.length === 10 && d.startsWith('9')) d = '7' + d
  if (d.length < 9 || d.length > 15) return null
  return '+' + d
}

export function normalizeTelegram(raw: string): string | null {
  const v = raw.trim()
  const link = v.match(/(?:https?:\/\/)?(?:t\.me|telegram\.me)\/(\w+)/i)
  const handle = (link ? link[1] : v.replace(/^@/, '').replace(/[\s.,;]+$/, '')) ?? ''
  return /^[A-Za-z][A-Za-z0-9_]{4,31}$/.test(handle) ? '@' + handle : null
}

const looksPhone = (v: string) => {
  const s = v.replace(/\s/g, '')
  const digits = s.replace(/\D/g, '')
  return digits.length >= 9 && digits.length / s.length >= 0.7
}
const looksEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim())
const looksHandle = (v: string) => /^@[A-Za-z][A-Za-z0-9_]{4,31}$/.test(v.trim()) || /(?:t\.me|telegram\.me)\//i.test(v)

function detectService(title: string): ServiceKey {
  const t = title.toLowerCase()
  if (/нейрофото|neuro/.test(t)) return 'neurophoto'
  if (/ретуш|retouch/.test(t)) return 'retouch'
  if (/цифров.* офис|supaoffice|digital office/.test(t)) return 'digital_office'
  if (/продакшн|продакшен|production|ролик/.test(t)) return 'production'
  return 'other'
}

export function parseLead(raw: string): ParsedLead {
  const out: ParsedLead = {
    isLead: false, origin: 'unknown', title: '', topic: '', service: 'other', name: '', phone: '', telegram: '', email: '',
    company: '', comment: '', interest: '', lang: '', landing: '', warnings: [],
  }
  const lines = raw.replace(/\r/g, '').split('\n')

  // Заголовок: «🆕 Заявка: Нейрофотосессия» или «🆕 Новая заявка с сайта ST96»
  const clean = (l: string) => l.replace(/^[^\p{L}\p{N}@]+/u, '').trim()
  const first = lines.findIndex((l) => /заявк/i.test(clean(l)))
  if (first < 0) return out
  const head = clean(lines[first])
  const site = /новая заявка с сайта/i.test(head)
  const hm = head.match(/^заявка\s*:\s*(.+)$/i)
  if (!site && !hm) return out
  out.isLead = true
  out.title = site ? 'Сайт ST96' : hm![1].trim()
  const [svc, ...rest] = out.title.split(/\s*:\s*/)
  out.topic = rest.join(': ')
  out.service = detectService(svc)
  if (site) out.origin = 'site'

  // Поля: строка вида «Метка: значение» начинает поле, остальные строки дописываются к предыдущему
  const raws: Partial<Record<FieldKey, string>> = {}
  let cur: FieldKey | null = null
  for (const line of lines.slice(first + 1)) {
    const m = line.match(LABEL_RE)
    const key = m ? LABELS[m[1].toLowerCase()] : undefined
    if (key) {
      cur = key
      raws[key] = (raws[key] ? raws[key] + '\n' : '') + m![2].trim()
    } else if (cur) {
      raws[cur] = (raws[cur] ?? '') + '\n' + line.trim()
    }
  }
  const val = (k: FieldKey) => (raws[k] ?? '').trim()
  if (!site && /стенд/i.test(val('source'))) out.origin = 'stand'
  if (/english|\ben\b/i.test(val('lang'))) out.lang = 'en'
  else if (/рус|\bru\b/i.test(val('lang'))) out.lang = 'ru'
  out.landing = val('landing')
  out.interest = val('interest')
  if (site && out.interest) out.service = detectService(out.interest)
  out.comment = val('comment')

  // Раскладываем значения по типу, а не по названию поля
  const slots = { phone: '', telegram: '', email: '', name: '', company: '' }
  const place = (v: string, from: 'name' | 'phone' | 'contact' | 'telegram' | 'company') => {
    v = v.trim()
    if (!v) return
    if (looksEmail(v)) { slots.email ||= v.toLowerCase(); return }
    if (looksHandle(v)) {
      const h = normalizeTelegram(v)
      if (h) { slots.telegram ||= h; if (from !== 'telegram') out.warnings.push(`telegram_in_${from}`); return }
    }
    if (looksPhone(v)) {
      const p = normalizePhone(v)
      if (p) { slots.phone ||= p; if (from !== 'phone' && from !== 'contact') out.warnings.push(`phone_in_${from}`); return }
      out.warnings.push('phone_unrecognized')
      return
    }
    if (from === 'telegram') {
      const h = normalizeTelegram(v)
      if (h) { slots.telegram ||= h; return }
      out.warnings.push('telegram_unrecognized')
      return
    }
    if (from === 'name') slots.name ||= v
    else if (from === 'company') slots.company ||= v
    else if (from === 'phone') out.warnings.push('phone_unrecognized')
  }
  place(val('name'), 'name')
  place(val('phone'), 'phone')
  place(val('contact'), 'contact')
  place(val('telegram'), 'telegram')
  place(val('company'), 'company')

  // Контакт мог остаться только в комментарии
  if (!slots.phone) {
    const pm = out.comment.match(/\+?\d[\d\s()\-]{8,}\d/)
    const p = pm ? normalizePhone(pm[0]) : null
    if (p) { slots.phone = p; out.warnings.push('phone_from_comment') }
  }
  if (!slots.telegram) {
    const tm = out.comment.match(/@[A-Za-z][A-Za-z0-9_]{4,31}/)
    if (tm) { slots.telegram = tm[0]; out.warnings.push('telegram_from_comment') }
  }

  out.name = slots.name
  out.phone = slots.phone
  out.telegram = slots.telegram
  out.email = slots.email
  out.company = slots.company
  if (!out.name) out.warnings.push('no_name')
  if (!out.phone && !out.telegram && !out.email) out.warnings.push('no_contact')
  out.warnings = [...new Set(out.warnings)]
  return out
}

/** Ключ для поиска дубля клиента: телефон, иначе ник, иначе почта. */
export const clientKey = (l: Pick<ParsedLead, 'phone' | 'telegram' | 'email'>) =>
  l.phone ? `p:${l.phone}` : l.telegram ? `t:${l.telegram.toLowerCase()}` : l.email ? `e:${l.email}` : ''

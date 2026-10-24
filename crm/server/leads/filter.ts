// Фильтр списков «Заявки» и «Клиенты» в админке (окно в духе Битрикс24).
// Страница превращает каждую запись в плоский набор «ключ → значение» (колонки, utm.*, vars.*, теги, ответы воронок),
// а список полей фильтра и их тип выводятся из самих данных: новый ключ появляется в фильтре без правки кода.

export type FlatValue = string | number | boolean | null | undefined | string[]
export type Flat = Record<string, FlatValue>

export type FieldKind = 'text' | 'enum' | 'number' | 'date' | 'bool'
export type Option = { value: string; label: string }
export type FieldDef = { key: string; label: string; kind: FieldKind; group: string; options?: Option[] }

/** Что страница знает о поле заранее: подпись, группа, тип или полный список вариантов */
export type KnownField = { label: string; group?: string; kind?: FieldKind; options?: Record<string, string> }

/** Период: фиксированные даты (ГГГГ-ММ-ДД) или относительный («за 7 дней» остаётся таким и в сохранённом наборе) */
export type Period = 'today' | 'yesterday' | '7d' | '30d' | 'month' | 'prev_month' | 'range'
export type Range = { from?: string; to?: string }
export type DateValue = Range & { period?: Period }
export type CondValue = string | string[] | Range | DateValue | boolean
export type Cond = { field: string; value: CondValue }

export const PERIODS: Record<Period, string> = {
  today: 'Сегодня', yesterday: 'Вчера', '7d': 'За 7 дней', '30d': 'За 30 дней', month: 'Этот месяц', prev_month: 'Прошлый месяц', range: 'Диапазон',
}

/** Больше стольких разных значений — уже не список выбора, а «содержит» */
export const ENUM_MAX = 15
const DATE_RE = /^\d{4}-\d{2}-\d{2}([T ]\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}(:?\d{2})?)?)?$/
const NUM_RE = /^-?\d+([.,]\d+)?$/

const present = (v: FlatValue): boolean => v !== null && v !== undefined && v !== '' && !(Array.isArray(v) && v.length === 0)

/** Ключ из jsonb в подпись: utm_source → «utm source», firstName → «first name» */
export const humanize = (k: string) => k.replace(/([a-zа-я])([A-ZА-Я])/g, '$1 $2').replace(/[_.]+/g, ' ').trim()

/**
 * Поля фильтра по загруженным записям. Тип выбирается сам:
 * список значений → выбор нескольких; да/нет → переключатель; даты → период; числа → от/до;
 * мало разных коротких значений → выбор из списка; остальное → «содержит».
 * prefixes задаёт группу и подпись для динамических ключей, например { 'utm.': 'UTM' }.
 */
export function inferFields(rows: Flat[], known: Record<string, KnownField>, prefixes: Record<string, string> = {}): FieldDef[] {
  const seen = new Map<string, FlatValue[]>()
  for (const k of Object.keys(known)) seen.set(k, [])
  for (const r of rows) for (const [k, v] of Object.entries(r)) {
    if (k.startsWith('__') || (!known[k] && !Object.keys(prefixes).some((p) => k.startsWith(p)))) continue
    const list = seen.get(k) ?? []
    if (present(v)) list.push(v)
    seen.set(k, list)
  }
  const out: FieldDef[] = []
  for (const [key, vals] of seen) {
    const kn = known[key]
    const prefix = Object.keys(prefixes).find((p) => key.startsWith(p))
    if (!kn && !vals.length) continue
    const label = kn?.label ?? humanize(key.slice(prefix?.length ?? 0))
    const group = kn?.group ?? (prefix ? prefixes[prefix] : 'Другое')
    if (kn?.options) {
      out.push({ key, label, group, kind: 'enum', options: Object.entries(kn.options).map(([value, l]) => ({ value, label: l })) })
      continue
    }
    const kind = kn?.kind ?? guessKind(vals)
    const f: FieldDef = { key, label, group, kind }
    if (kind === 'enum') f.options = optionsOf(vals)
    out.push(f)
  }
  return out
}

function guessKind(vals: FlatValue[]): FieldKind {
  if (!vals.length) return 'text'
  if (vals.some(Array.isArray)) return 'enum'
  if (vals.every((v) => typeof v === 'boolean')) return 'bool'
  const strs = vals.map(String)
  if (vals.every((v) => typeof v === 'string' && DATE_RE.test(v))) return 'date'
  const distinct = new Set(strs.map((s) => s.trim().toLowerCase())).size
  const numeric = vals.every((v) => typeof v === 'number' || NUM_RE.test(String(v).trim()))
  if (numeric && (typeof vals[0] === 'number' || distinct > ENUM_MAX)) return 'number'
  // Мало разных коротких значений, и они повторяются (или их совсем немного) — выбор из списка
  if (distinct <= ENUM_MAX && strs.every((s) => s.length <= 40) && (distinct <= 3 || distinct * 2 <= vals.length)) return 'enum'
  return 'text'
}

function optionsOf(vals: FlatValue[]): Option[] {
  const count = new Map<string, number>()
  for (const v of vals.flatMap((x) => (Array.isArray(x) ? x : [String(x)]))) count.set(v, (count.get(v) ?? 0) + 1)
  return [...count.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'ru')).map(([value]) => ({ value, label: value }))
}

const pad = (n: number) => String(n).padStart(2, '0')
const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
/** День записи по местному времени; голая дата ГГГГ-ММ-ДД остаётся как есть */
export const localDay = (v: string) => (/^\d{4}-\d{2}-\d{2}$/.test(v) ? v : ymd(new Date(v)))

/** Относительный период в даты от/до (включительно) на момент now */
export function resolveRange(v: DateValue, now = new Date()): Range {
  const d = (shift: number) => { const x = new Date(now); x.setDate(x.getDate() + shift); return ymd(x) }
  switch (v.period) {
    case 'today': return { from: d(0), to: d(0) }
    case 'yesterday': return { from: d(-1), to: d(-1) }
    case '7d': return { from: d(-6), to: d(0) }
    case '30d': return { from: d(-29), to: d(0) }
    case 'month': return { from: ymd(new Date(now.getFullYear(), now.getMonth(), 1)), to: d(0) }
    case 'prev_month': return { from: ymd(new Date(now.getFullYear(), now.getMonth() - 1, 1)), to: ymd(new Date(now.getFullYear(), now.getMonth(), 0)) }
    default: return { from: v.from || undefined, to: v.to || undefined }
  }
}

const num = (v: unknown) => (typeof v === 'number' ? v : Number(String(v).trim().replace(',', '.')))

/** Пустое условие ничего не отсекает и в чипы не попадает */
export function isEmptyCond(c: Cond): boolean {
  const v = c.value
  if (typeof v === 'boolean') return false
  if (typeof v === 'string') return !v.trim()
  if (Array.isArray(v)) return v.length === 0
  const dv = v as DateValue
  return !(dv.period && dv.period !== 'range') && !dv.from && !dv.to
}

export function matchCond(row: Flat, c: Cond, fields: Map<string, FieldDef>, now = new Date()): boolean {
  if (isEmptyCond(c)) return true
  const f = fields.get(c.field)
  const v = row[c.field]
  switch (f?.kind ?? 'text') {
    case 'bool': return !!v === c.value
    case 'enum': {
      const want = new Set(c.value as string[])
      return (Array.isArray(v) ? v : present(v) ? [String(v)] : []).some((x) => want.has(x))
    }
    case 'number': {
      const r = c.value as Range
      if (!present(v) || Number.isNaN(num(v))) return false
      return (r.from === undefined || r.from === '' || num(v) >= num(r.from)) && (r.to === undefined || r.to === '' || num(v) <= num(r.to))
    }
    case 'date': {
      if (typeof v !== 'string' || !v) return false
      const r = resolveRange(c.value as DateValue, now)
      const day = localDay(v)
      return (!r.from || day >= r.from) && (!r.to || day <= r.to)
    }
    default: {
      const t = String(c.value).trim().toLowerCase()
      return present(v) && (Array.isArray(v) ? v.join(' ') : String(v)).toLowerCase().includes(t)
    }
  }
}

/** Быстрый поиск из строки: часть текста в любом поле записи, без учёта регистра и @ */
export function matchText(row: Flat, q: string): boolean {
  const t = q.trim().toLowerCase().replace(/^@/, '')
  if (!t) return true
  return Object.values(row).some((v) => typeof v !== 'boolean' && present(v) && (Array.isArray(v) ? v.join(' ') : String(v)).toLowerCase().includes(t))
}

export function applyFilter<T>(items: T[], flat: (x: T) => Flat, conds: Cond[], q: string, fields: FieldDef[], now = new Date()): T[] {
  const byKey = new Map(fields.map((f) => [f.key, f]))
  const active = conds.filter((c) => !isEmptyCond(c))
  return items.filter((x) => {
    const r = flat(x)
    return matchText(r, q) && active.every((c) => matchCond(r, c, byKey, now))
  })
}

const ruDay = (s: string) => s.split('-').reverse().join('.')

/** Подпись чипа в строке поиска: «Статус: Новая, В работе», «Создана: 01.10.2026 – 15.10.2026» */
export function condLabel(c: Cond, f: FieldDef | undefined): string {
  const name = f?.label ?? c.field
  const v = c.value
  if (typeof v === 'boolean') return `${name}: ${v ? 'да' : 'нет'}`
  if (typeof v === 'string') return `${name}: ${v}`
  if (Array.isArray(v)) return `${name}: ${v.map((x) => f?.options?.find((o) => o.value === x)?.label ?? x).join(', ')}`
  const dv = v as DateValue
  if (dv.period && dv.period !== 'range') return `${name}: ${PERIODS[dv.period].toLowerCase()}`
  const fmt = (s?: string) => (s ? (f?.kind === 'date' ? ruDay(s) : s) : '')
  if (dv.from && dv.to) return `${name}: ${fmt(dv.from)} – ${fmt(dv.to)}`
  return dv.from ? `${name}: от ${fmt(dv.from)}` : `${name}: до ${fmt(dv.to)}`
}

/** Значение jsonb (utm, vars, ответы воронок) в плоские ключи с префиксом; вложенные объекты пропускаем */
export function flattenJson(prefix: string, obj: unknown, into: Flat = {}): Flat {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return into
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    if (k.startsWith('__')) continue
    if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') into[prefix + k] = v
    else if (Array.isArray(v) && v.every((x) => typeof x === 'string' || typeof x === 'number')) into[prefix + k] = v.map(String)
  }
  return into
}

/** Условия из адресной строки (?f=…); мусор в адресе даёт пустой фильтр, а не ошибку */
export function parseConds(s: string | null): Cond[] {
  if (!s) return []
  try {
    const v = JSON.parse(s) as unknown
    return Array.isArray(v) ? v.filter((c): c is Cond => !!c && typeof c === 'object' && typeof (c as Cond).field === 'string' && 'value' in c) : []
  } catch {
    return []
  }
}

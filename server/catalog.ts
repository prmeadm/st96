// Единственный источник услуг для всей платформы: данные сайта (src/data/services.ts и content.en.ts).
// Названия и описания нигде больше не задаются вручную: правка на сайте сразу меняет запись, шаблоны, воронки, агента и бота.
import { servicesEn } from '../src/data/content.en'
import { services } from '../src/data/services'

export type SiteService = { key: string; ru: string; en: string; infoRu: string; infoEn: string; url: string; urlEn: string; keywords: string[] }

export const SITE_SERVICES: SiteService[] = services.map((s) => {
  const en = servicesEn[s.slug]
  return {
    key: s.slug,
    ru: s.navLabel,
    en: en?.navLabel ?? s.navLabel,
    infoRu: `${s.heroNote}. ${s.tagline}`.trim(),
    infoEn: en ? `${en.heroNote}. ${en.tagline}`.trim() : `${s.heroNote}. ${s.tagline}`.trim(),
    url: `https://st96.by/${s.slug}`,
    urlEn: `https://st96.by/en/${s.slug}`,
    keywords: [s.navLabel, s.kicker, ...(en ? [en.navLabel, en.kicker] : []), ...s.keywords],
  }
})

export const SERVICE_SLUGS: string[] = SITE_SERVICES.map((s) => s.key)
/** Служебный ключ: услуга не определена (не показывается как выбор) */
export const UNKNOWN_SERVICE = 'other'

export function serviceLabel(key: string | null | undefined, lang: 'ru' | 'en' = 'ru'): string {
  const s = SITE_SERVICES.find((x) => x.key === key)
  return s ? s[lang] : lang === 'en' ? 'Not specified' : 'Не указана'
}

/** Ключ услуги по названию (русскому или английскому) или по ключу сайта */
export function serviceByLabel(label: string): string | undefined {
  const t = label.trim().toLowerCase()
  return SITE_SERVICES.find((s) => s.key === t || s.ru.toLowerCase() === t || s.en.toLowerCase() === t)?.key
}

/** Определение услуги по тексту заявки: точное название, затем ключевые слова с сайта */
export function detectServiceKey(text: string): string {
  const t = text.toLowerCase()
  if (!t.trim()) return UNKNOWN_SERVICE
  const exact = serviceByLabel(text)
  if (exact) return exact
  for (const s of SITE_SERVICES) if ([s.ru, s.en].some((w) => t.includes(w.toLowerCase()))) return s.key // ключ («ai») подстрокой не ищем: он есть в обычных словах
  for (const s of SITE_SERVICES) if (s.keywords.some((w) => w.length >= 4 && t.includes(w.toLowerCase()))) return s.key
  return UNKNOWN_SERVICE
}

/** Краткая справка об услугах для подсказок модели: только то, что написано на сайте */
export function servicesBrief(lang: 'ru' | 'en' = 'ru'): string {
  return SITE_SERVICES.map((s) => `${s[lang]} (${lang === 'en' ? s.urlEn : s.url}): ${lang === 'en' ? s.infoEn : s.infoRu}`).join('\n')
}

const STOP_WORDS = new Set(['разработка', 'коммерческий', 'commercial', 'development'])
/** Услуга по свободному тексту (сообщение клиента): название услуги с сайта, его основа или несколько ключевых слов одной услуги. Иначе «не указана». */
export function detectServiceInText(text: string): string {
  const t = text.toLowerCase()
  if (!t.trim()) return UNKNOWN_SERVICE
  for (const s of SITE_SERVICES) if ([s.ru, s.en].some((w) => t.includes(w.toLowerCase())) || new RegExp(`(^|[^\\p{L}])${s.key}([^\\p{L}]|$)`, 'u').test(t)) return s.key
  for (const s of SITE_SERVICES) {
    const stems = [s.ru, s.en].flatMap((n) => n.toLowerCase().split(/[\s-]+/)).filter((w) => w.length >= 7 && !STOP_WORDS.has(w)).map((w) => w.slice(0, w.length - 2))
    if (stems.some((st) => t.includes(st))) return s.key
  }
  let best = UNKNOWN_SERVICE
  let bestN = 1
  for (const s of SITE_SERVICES) {
    const own = new Set(s.keywords.slice(4).map((w) => w.toLowerCase()))
    const n = [...own].filter((w) => w.length >= 5 && t.includes(w.toLowerCase())).length
    if (n > bestN) { best = s.key; bestN = n }
  }
  return best
}

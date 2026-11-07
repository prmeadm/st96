// Единственный источник услуг для всей платформы: данные сайта (src/data/services.ts и content.en.ts).
// Названия и описания нигде больше не задаются вручную: правка на сайте сразу меняет запись, шаблоны, воронки, агента и бота.
import { servicesEn } from '../../shared/data/content.en'
import { services } from '../../shared/data/services'

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

/** Направление внутри услуги: показывается на сайте и выбирается в каталоге CRM */
export type SiteOffer = { key: string; ru: string; en: string; infoRu: string; infoEn: string; parent: string; parentRu: string; parentEn: string }

export const SITE_OFFERS: SiteOffer[] = services.flatMap((s) => {
  const en = servicesEn[s.slug]
  const enOffers = en?.offers ?? []
  return (s.offers ?? []).map((o, i) => {
    const e = enOffers.find((x) => x.key === o.key) ?? enOffers[i]
    return {
      key: o.key,
      ru: o.title,
      en: e?.title ?? o.title,
      infoRu: o.text,
      infoEn: e?.text ?? o.text,
      parent: s.slug,
      parentRu: s.navLabel,
      parentEn: en?.navLabel ?? s.navLabel,
    }
  })
})

/** Категории и направления: всё, что можно указать как услугу в заявке */
const CATALOG: { key: string; ru: string; en: string }[] = [...SITE_SERVICES, ...SITE_OFFERS]

/** Служебный ключ: услуга не определена (не показывается как выбор) */
export const UNKNOWN_SERVICE = 'other'

export function serviceLabel(key: string | null | undefined, lang: 'ru' | 'en' = 'ru'): string {
  const s = CATALOG.find((x) => x.key === key)
  return s ? s[lang] : lang === 'en' ? 'Not specified' : 'Не указана'
}

/** Ключ услуги по названию (русскому или английскому) или по ключу сайта */
export function serviceByLabel(label: string): string | undefined {
  const t = label.trim().toLowerCase()
  return CATALOG.find((s) => s.key === t || s.ru.toLowerCase() === t || s.en.toLowerCase() === t)?.key
}

/** Слова, которые есть в названиях многих направлений и потому ничего не различают */
const OFFER_STOP = new Set(['разработка', 'продюсирование', 'развития', 'development', 'producing'])

/** Направление по смыслу: в тексте совпало минимум два значимых слова названия («игровые механики», «креативные стратегии»). */
function offerByWords(t: string, o: SiteOffer): boolean {
  const words = [...o.ru.toLowerCase().split(/[^\p{L}]+/u), ...o.en.toLowerCase().split(/[^\p{L}]+/u)]
    .filter((w) => w.length >= 5 && !OFFER_STOP.has(w))
    .map((w) => w.slice(0, Math.min(w.length, 6)))
  return new Set(words).size > 0 && [...new Set(words)].filter((w) => t.includes(w)).length >= 2
}

/** Определение услуги по тексту заявки: точное название, направления, затем ключевые слова с сайта */
export function detectServiceKey(text: string): string {
  const t = text.toLowerCase()
  if (!t.trim()) return UNKNOWN_SERVICE
  const exact = serviceByLabel(text)
  if (exact) return exact
  // направление конкретнее категории: «продюсирование сценариев» важнее, чем «продюсирование»
  for (const o of SITE_OFFERS) if ([o.ru, o.en].some((w) => t.includes(w.toLowerCase())) || offerByWords(t, o)) return o.key
  for (const s of SITE_SERVICES) if ([s.ru, s.en].some((w) => t.includes(w.toLowerCase()))) return s.key // ключ («ai») подстрокой не ищем: он есть в обычных словах
  for (const s of SITE_SERVICES) if (s.keywords.some((w) => w.length >= 4 && t.includes(w.toLowerCase()))) return s.key
  return UNKNOWN_SERVICE
}

/** Краткая справка об услугах для подсказок модели: только то, что написано на сайте */
export function servicesBrief(lang: 'ru' | 'en' = 'ru'): string {
  return SITE_SERVICES.map((s) => {
    const head = `${s[lang]} (${lang === 'en' ? s.urlEn : s.url}): ${lang === 'en' ? s.infoEn : s.infoRu}`
    const offers = SITE_OFFERS.filter((o) => o.parent === s.key)
    return offers.length
      ? `${head}\n${offers.map((o) => `  — ${o[lang]}: ${lang === 'en' ? o.infoEn : o.infoRu}`).join('\n')}`
      : head
  }).join('\n')
}

const STOP_WORDS = new Set(['разработка', 'коммерческий', 'commercial', 'development'])
/** Услуга по свободному тексту (сообщение клиента): название услуги с сайта, его основа или несколько ключевых слов одной услуги. Иначе «не указана». */
export function detectServiceInText(text: string): string {
  const t = text.toLowerCase()
  if (!t.trim()) return UNKNOWN_SERVICE
  for (const o of SITE_OFFERS) if ([o.ru, o.en].some((w) => t.includes(w.toLowerCase())) || offerByWords(t, o)) return o.key
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

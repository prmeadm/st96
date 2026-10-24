// Расход токенов ИИ и популярность шаблонов: общие правила для сервера и раздела «Аналитика» (без зависимостей).
export type Price = { in: number; out: number; estimate?: boolean }
export const PRICE_SETTING = 'llm_prices'

/** Цена за 1 млн токенов в долларах. Источник: ai.google.dev/gemini-api/docs/pricing (см. server/agent/models.ts). У 3.1 Flash-Lite цена на странице не указана: взята как у 3.5 Flash-Lite, помечена оценкой. Свои цены задаются в «Аналитике». */
export const DEFAULT_PRICES: Record<string, Price> = {
  'gemini-3.8-flash': { in: 0.75, out: 3.75 },
  'gemini-3.6-flash': { in: 0.75, out: 3.75 },
  'gemini-3.5-flash-lite': { in: 0.3, out: 2.5 },
  'gemini-3.1-flash-lite': { in: 0.3, out: 2.5, estimate: true },
}

export function parsePrices(raw: string | null | undefined): Record<string, Price> {
  try {
    const v = JSON.parse(raw ?? '{}') as Record<string, Partial<Price>>
    const out: Record<string, Price> = {}
    for (const [k, p] of Object.entries(v)) if (p && Number.isFinite(p.in) && Number.isFinite(p.out) && p.in! >= 0 && p.out! >= 0) out[k] = { in: p.in!, out: p.out! }
    return out
  } catch { return {} }
}

/** Цена модели: заданная вручную, иначе из каталога, иначе неизвестна (расход показывается без суммы) */
export const priceOf = (model: string, custom: Record<string, Price> = {}): Price | null => custom[model] ?? DEFAULT_PRICES[model] ?? null
export const costUsd = (model: string, promptTokens: number, completionTokens: number, custom?: Record<string, Price>): number | null => {
  const p = priceOf(model, custom)
  return p ? (promptTokens / 1e6) * p.in + (completionTokens / 1e6) * p.out : null
}

export const FEATURE_LABELS: Record<string, string> = {
  'agent:plan': 'Агент: план задания',
  'agent:report': 'Агент: итоговый отчёт',
  'agent:draft_text': 'Агент: черновик текста',
  'agent:save_template': 'Агент: создание шаблона',
  'agent:draft_broadcast': 'Агент: черновик рассылки',
  'agent:import_group_export': 'Агент: импорт клиентов из группы',
  'agent:notify_admins': 'Агент: уведомление администраторам',
  translate: 'Перевод на английский',
}
export const featureLabel = (f: string) => FEATURE_LABELS[f] ?? (f.startsWith('agent:') ? `Агент: ${f.slice(6)}` : f)

export const TEMPLATE_EVENT_LABEL = { view: 'Просмотры', use: 'Отправки', funnel: 'В воронки', broadcast: 'В рассылки' } as const
export type TemplateStat = { views: number; uses: number; funnels: number; broadcasts: number }
const WEIGHT = { views: 1, uses: 5, funnels: 3, broadcasts: 3 }
/** Очки популярности: отправка клиенту весит больше всего, просмотр меньше всего */
export const popularityScore = (s: TemplateStat) => s.views * WEIGHT.views + s.uses * WEIGHT.uses + s.funnels * WEIGHT.funnels + s.broadcasts * WEIGHT.broadcasts
/** Рейтинг 0-100 относительно самого популярного шаблона и 0-5 звёзд для значка */
export function ratings(scores: number[]): { pct: number; stars: number }[] {
  const max = Math.max(0, ...scores)
  return scores.map((s) => {
    const pct = max > 0 ? Math.round((s / max) * 100) : 0
    return { pct, stars: s > 0 ? Math.max(1, Math.round(pct / 20)) : 0 }
  })
}

/** Начало периода «последние N дней» включая сегодня, по Минску (UTC+3) */
export function periodStart(days: number, now = new Date()): string {
  const m = new Date(now.getTime() + 3 * 3600_000)
  m.setUTCHours(0, 0, 0, 0)
  m.setUTCDate(m.getUTCDate() - (days - 1))
  return new Date(m.getTime() - 3 * 3600_000).toISOString()
}

// Каталог моделей, которые можно выбрать для агента и перевода. Все работают через один ключ LLM_API_KEY (Google AI Studio).
// Цены и бесплатный доступ: https://ai.google.dev/gemini-api/docs/pricing (на 2026-10-20). Описания возможностей общие, по семейству модели.
export type ModelInfo = {
  id: string
  name: string
  family: 'Flash' | 'Flash-Lite'
  recommended?: boolean
  blurb: string
  strengths: string[]
  tradeoffs: string[]
  price: string
}

export const AUTO_MODEL = 'auto'

const FLASH_PRICE = 'Бесплатно в пределах лимитов Google. Платно: $0,75 за 1 млн входных и $3,75 за 1 млн выходных токенов до конца 2026 года, затем $1,50 и $7,50.'

export const MODELS: ModelInfo[] = [
  {
    id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash', family: 'Flash', recommended: true,
    blurb: 'Новейшая быстрая модель Google, которую сама компания рекомендует для новых проектов. Лучший выбор по качеству среди доступных бесплатно.',
    strengths: ['Составляет планы заданий из нескольких шагов', 'Точный перевод с сохранением переменных и ссылок', 'Пишет тексты в нужном тоне на русском и английском', 'Надёжно отвечает строгим JSON'],
    tradeoffs: ['Чуть медленнее и дороже Flash-Lite при платном тарифе'],
    price: FLASH_PRICE,
  },
  {
    id: 'gemini-3.6-flash', name: 'Gemini 3.6 Flash', family: 'Flash',
    blurb: 'Предыдущая стабильная версия Flash. Запасной вариант, если новейшая недоступна или упёрлась в лимиты.',
    strengths: ['Планы, тексты и перевод на уровне семейства Flash', 'Стабильное поведение на длинных заданиях'],
    tradeoffs: ['Не самая новая версия'],
    price: FLASH_PRICE,
  },
  {
    id: 'gemini-3.5-flash-lite', name: 'Gemini 3.5 Flash-Lite', family: 'Flash-Lite',
    blurb: 'Облегчённая модель: быстрее и заметно дешевле. Подходит для перевода и простых заданий.',
    strengths: ['Самая быстрая из каталога', 'Дешевле всего при платном тарифе', 'Хорошо справляется с переводом и короткими текстами'],
    tradeoffs: ['Сложные планы и длинные тексты может строить хуже, чем Flash', 'Чаще требует правки результата'],
    price: 'Бесплатно в пределах лимитов Google. Платно: $0,30 за 1 млн входных и $2,50 за 1 млн выходных токенов.',
  },
  {
    id: 'gemini-3.1-flash-lite', name: 'Gemini 3.1 Flash-Lite', family: 'Flash-Lite',
    blurb: 'Прошлое поколение облегчённой модели. Запасной вариант на случай, если остальные недоступны.',
    strengths: ['Быстрая и лёгкая', 'Годится для перевода и простых заданий'],
    tradeoffs: ['Старее 3.5 Flash-Lite', 'Платные цены смотрите на странице Google'],
    price: 'Бесплатно в пределах лимитов Google. Платные цены: ai.google.dev/gemini-api/docs/pricing.',
  },
]

export const MODEL_IDS = MODELS.map((m) => m.id)
export const isKnownModel = (v: unknown): v is string => typeof v === 'string' && (v === AUTO_MODEL || MODEL_IDS.includes(v))

/** Порядок попыток: сначала выбранная модель, затем остальные (бесплатные модели Google иногда исчезают для новых ключей). */
export function modelChain(selected: string | null | undefined, envModel?: string): string[] {
  const first = selected && selected !== AUTO_MODEL ? selected : envModel || null
  return first ? [first, ...MODEL_IDS.filter((m) => m !== first)] : [...MODEL_IDS]
}

// ───────── Свои модели: любой OpenAI-совместимый сервис (Groq, OpenRouter, свой сервер) ─────────
// Ключ в базе не хранится: у модели записано только имя переменной окружения в Vercel (LLM_API_KEY или LLM_KEY_<ИМЯ>).
export type CustomModel = { id: string; name: string; baseUrl: string; model: string; keyEnv: string }
export const CUSTOM_PREFIX = 'custom:'
export const CUSTOM_SETTING = 'llm_custom_models'
export const MAX_CUSTOM_MODELS = 12

export const PRESETS = [
  { key: 'google', label: 'Google AI Studio', baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai', keyEnv: 'LLM_API_KEY', modelHint: 'gemini-…' },
  { key: 'groq', label: 'Groq', baseUrl: 'https://api.groq.com/openai/v1', keyEnv: 'LLM_KEY_GROQ', modelHint: 'например, llama-3.3-70b-versatile' },
  { key: 'openrouter', label: 'OpenRouter', baseUrl: 'https://openrouter.ai/api/v1', keyEnv: 'LLM_KEY_OPENROUTER', modelHint: 'идентификатор модели с openrouter.ai, бесплатные оканчиваются на :free' },
  { key: 'other', label: 'Другой сервис', baseUrl: '', keyEnv: 'LLM_KEY_CUSTOM', modelHint: 'идентификатор модели у провайдера' },
] as const

export function parseCustom(raw: string | null): CustomModel[] {
  try {
    const v = JSON.parse(raw ?? '[]') as unknown
    return Array.isArray(v) ? v.filter((m): m is CustomModel => !!m && typeof m === 'object' && typeof (m as CustomModel).id === 'string' && typeof (m as CustomModel).baseUrl === 'string') : []
  } catch {
    return []
  }
}

const PRIVATE_HOST = /^(localhost|.*\.local|.*\.internal|0\.0\.0\.0|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.|\[.*\])/i

/** Проверка введённой модели: только https и публичный адрес, ключ только из разрешённых переменных. */
export function validateCustom(input: { name?: unknown; baseUrl?: unknown; model?: unknown; keyEnv?: unknown }): { ok: true; value: Omit<CustomModel, 'id'> } | { ok: false; error: string } {
  const name = typeof input.name === 'string' ? input.name.trim() : ''
  const model = typeof input.model === 'string' ? input.model.trim() : ''
  const keyEnv = typeof input.keyEnv === 'string' ? input.keyEnv.trim() : ''
  if (!name || name.length > 40) return { ok: false, error: 'Название от 1 до 40 знаков' }
  if (!/^[A-Za-z0-9._:/@-]{1,100}$/.test(model)) return { ok: false, error: 'Идентификатор модели: латиница, цифры и знаки . _ : / - (до 100 знаков)' }
  if (!/^LLM_(API_KEY|KEY_[A-Z0-9_]{1,40})$/.test(keyEnv)) return { ok: false, error: 'Имя переменной ключа: LLM_API_KEY или LLM_KEY_ИМЯ (заглавные буквы, цифры и _)' }
  let u: URL
  try {
    u = new URL(String(input.baseUrl ?? '').trim())
  } catch {
    return { ok: false, error: 'Адрес API указан неверно' }
  }
  if (u.protocol !== 'https:' || u.username || u.password) return { ok: false, error: 'Адрес должен начинаться с https:// и без логина и пароля' }
  if (PRIVATE_HOST.test(u.hostname)) return { ok: false, error: 'Внутренние адреса запрещены' }
  return { ok: true, value: { name, model, keyEnv, baseUrl: u.origin + u.pathname.replace(/\/$/, '') } }
}

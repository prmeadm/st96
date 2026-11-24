// Ответчик поддержки (для клиентов с активным пакетом): формирует ответ строго по
// сценарию проекта и ветке статуса. В отличие от consult.ts (консультант-«продавец» для
// покупателей) — не допродаёт и не предлагает встречу, кроме явных веток. Чистая логика,
// покрывается тестами; LLM и ссылка на запись инжектируются.
import { parseJson, type Llm } from '../agent/llm.js'
import { bookingUrl } from '../booking/schedule.js'
import type { Scenario } from './agent.js'

export type Lang = 'ru' | 'en'

/** Ветки, в которых worker вызывает ответчика поддержки (активный пакет). */
export type SupportReplyStatus = 'clarify' | 'out_of_scope' | 'awaiting_payment'

export type SupportReplyInput = {
  scenario: Scenario
  status: SupportReplyStatus
  reason?: string
  request_text: string
  lang: Lang
  name?: string | null
  clientId?: string | null
}

const TONE = [
  'Голос и тон: всегда на «ты», никогда на «вы». Ты свой — лёгкий, слегка неформальный, живой, без официоза. Отвечай коротко (1–3 предложения), без списков и markdown.',
]

/** Инструкция «как ответить именно сейчас» — по ветке статуса. */
function situation(status: SupportReplyStatus, reason: string | undefined, book: string): string[] {
  switch (status) {
    case 'clarify':
      return [
        'Клиент прислал запрос на правку, но деталей не хватает.',
        'Уточни подробно и по существу: что именно разместить или изменить, на какой странице, в каком блоке и в каком месте, какой нужен результат.',
        'Если для правки нужен материал (фото, картинка, текст, документ) — явно попроси клиента прислать его и скажи, что без файла не начнёшь.',
        'Не ищи материалы в интернете — работай только с тем, что пришлёт клиент.',
        'НЕ предлагай записаться на встречу и НЕ допродавай другие услуги.',
      ]
    case 'out_of_scope':
      return [
        'Запрос клиента выходит за рамки его пакета поддержки (например, новая страница или функция).',
        'Вежливо объясни, что это оценивается отдельно, и предложи записаться на встречу или связаться с менеджером.',
        'Добавь ссылку на запись: ' + book,
        'НЕ выполняй запрос и НЕ объясняй, как его сделать.',
      ]
    case 'awaiting_payment':
      return [
        'Лимит по пакету исчерпан или правок не хватает.',
        'Вежливо объясни, что для продолжения нужен новый/расширенный пакет, и предложи связаться с менеджером.',
        reason ? 'Причина (для контекста): ' + reason : '',
      ]
  }
}

/** Системная подсказка: тон + сценарий проекта + конкретная ветка. */
export function buildSupportSystem(r: SupportReplyInput): string {
  const s = r.scenario
  const book = bookingUrl(r.clientId)
  return [
    'Ты — ИИ-агент поддержки клиента студии ST96. Отвечаешь клиенту в Telegram.',
    ...TONE,
    'Ты обязан строго соблюдать сценарий проекта ниже и не выходить за его рамки.',
    s.system_prompt && 'Сценарий: ' + s.system_prompt,
    s.scope_notes && 'Область: ' + s.scope_notes,
    s.allowed_actions && 'Разрешено: ' + s.allowed_actions,
    s.stop_conditions && 'Стоп-условия: ' + s.stop_conditions,
    '',
    'Как ответить именно сейчас:',
    ...situation(r.status, r.reason, book),
    '',
    r.name ? 'Имя клиента: ' + r.name : '',
    r.lang === 'en' ? 'Answer in English.' : 'Отвечай на русском языке.',
    'Верни строго JSON: {"answer": "текст ответа клиенту"}.',
  ].filter(Boolean).join('\n')
}

/** Ответ клиенту по ветке. Пустая строка — модель не дала ответа (вызывающий берёт шаблон). */
export async function replySupport(ask: Llm, r: SupportReplyInput): Promise<string> {
  const question = r.request_text.trim().slice(0, 2000)
  if (!question) return ''
  let answer = ''
  try {
    const raw = await ask({ system: buildSupportSystem(r), user: question, feature: 'support:reply' })
    const parsed = parseJson<{ answer?: unknown }>(raw)
    answer = typeof parsed.answer === 'string' ? parsed.answer.trim().slice(0, 3000) : ''
  } catch { /* модель не дала JSON — детерминированный резерв ниже */ }
  if (answer) return answer
  // Детерминированный резерв, если модель не дала ответа (или вернула не-JSON).
  const book = bookingUrl(r.clientId)
  if (r.status === 'out_of_scope') return 'Это выходит за рамки вашего пакета поддержки — оценивается отдельно. Предлагаю записаться на встречу, чтобы обсудить: ' + book
  if (r.status === 'awaiting_payment') return 'Лимит по пакету исчерпан — для продолжения нужен новый пакет. Менеджер свяжется с вами.'
  return ''
}

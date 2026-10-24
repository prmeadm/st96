// Перевод сообщений с русского на английский. Работает на той же бесплатной модели, что и агент (LLM_API_KEY).
// Точность обеспечивают жёсткие правила в запросе и проверка кодом: переменные, ссылки и команды должны дойти без изменений.
import { LlmError, parseJson, type Llm } from './agent/llm'
import { SITE_SERVICES } from './catalog'

export const MAX_TRANSLATE_CHARS = 3500

const SYSTEM = `Ты профессиональный переводчик с русского на английский для студии ST96.
Услуги студии и их официальные английские названия (с сайта st96.by), используй их без вариаций:
${SITE_SERVICES.map((s) => `${s.ru} → ${s.en}`).join('\n')}
Правила:
1. Переводи точно по смыслу, естественным деловым английским, в том же тоне (дружелюбно-профессиональном). Не добавляй и не пропускай ничего.
2. Без изменений оставь: плейсхолдеры в фигурных скобках ({имя}, {компания}, {ник}, {var.x} и любые другие), ссылки, команды вроде /stop и /start, эмодзи, цифры, названия ST96 и Retouch Studio.
3. Сохрани переносы строк и структуру списков.
4. Не пиши пояснений. Верни только JSON: {"text": "перевод"}.`

const tokens = (s: string) => s.match(/\{[^}]+\}|https?:\/\/[^\s)]+|\/[a-z]{3,}\b/gi) ?? []
const count = (list: string[]) => list.reduce<Record<string, number>>((m, t) => ((m[t] = (m[t] ?? 0) + 1), m), {})

/** Что из защищённого (переменные, ссылки, команды) потерялось или изменилось в переводе. */
export function missingTokens(source: string, translated: string): string[] {
  const want = count(tokens(source))
  const got = count(tokens(translated))
  return Object.entries(want).filter(([t, n]) => (got[t] ?? 0) < n).map(([t]) => t)
}

export async function translateToEnglish(llm: Llm, text: string): Promise<string> {
  const src = text.trim()
  if (!src) throw new LlmError('Нечего переводить: русский текст пуст')
  if (src.length > MAX_TRANSLATE_CHARS) throw new LlmError(`Текст длиннее ${MAX_TRANSLATE_CHARS} знаков`)
  let hint = ''
  for (let attempt = 0; attempt < 2; attempt++) {
    const raw = await llm({ feature: 'translate', system: SYSTEM, user: `Текст для перевода:\n${src}${hint}` })
    const out = (parseJson<{ text?: unknown }>(raw).text ?? '') as string
    const t = typeof out === 'string' ? out.trim() : ''
    if (!t) { hint = '\n\nВ прошлый раз ответ был пустым. Верни JSON с полем text.'; continue }
    const lost = missingTokens(src, t)
    if (!lost.length) return t
    hint = `\n\nВ прошлом переводе потерялись элементы, которые нужно оставить как есть: ${lost.join(', ')}. Верни полный перевод, сохранив их дословно.`
  }
  throw new LlmError('Не удалось перевести без потери переменных или ссылок. Попробуйте ещё раз или переведите вручную.')
}

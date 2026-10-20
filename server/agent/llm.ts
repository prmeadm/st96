// Тонкий слой над любой моделью с OpenAI-совместимым API. По умолчанию Google Gemini Flash (бесплатный ключ из AI Studio).
// Заменить модель можно переменными окружения LLM_BASE_URL, LLM_MODEL, LLM_API_KEY, код менять не нужно.
export type Llm = (req: { system: string; user: string }) => Promise<string>

export const DEFAULT_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/openai'
export const DEFAULT_MODEL = 'gemini-2.5-flash'

export class LlmError extends Error {}

export function openAiCompatible(cfg: { apiKey: string; baseUrl?: string; model?: string }): Llm {
  const base = (cfg.baseUrl || DEFAULT_BASE_URL).replace(/\/$/, '')
  return async ({ system, user }) => {
    let lastErr = ''
    for (let attempt = 0; attempt < 2; attempt++) {
      const r = await fetch(`${base}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cfg.apiKey}` },
        body: JSON.stringify({
          model: cfg.model || DEFAULT_MODEL,
          temperature: 0.3,
          response_format: { type: 'json_object' },
          messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
        }),
        signal: AbortSignal.timeout(25_000),
      }).catch((e: unknown) => ({ ok: false, status: 0, text: async () => (e instanceof Error ? e.message : String(e)) }) as Response)
      if (r.ok) {
        const data = (await r.json()) as { choices?: { message?: { content?: string } }[] }
        const text = data.choices?.[0]?.message?.content
        if (text) return text
        lastErr = 'пустой ответ модели'
      } else {
        lastErr = `${r.status} ${(await r.text()).slice(0, 160)}`
        if (r.status === 401 || r.status === 403) throw new LlmError('Ключ LLM_API_KEY не подходит или у него нет доступа')
        if (r.status === 429) throw new LlmError('Достигнут лимит бесплатного тарифа модели, повторите позже')
      }
    }
    throw new LlmError(`Модель недоступна: ${lastErr}`)
  }
}

/** Достаёт JSON из ответа (модели иногда оборачивают его в ```). */
export function parseJson<T = unknown>(raw: string): T {
  const s = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
  try {
    return JSON.parse(s) as T
  } catch {
    const a = s.indexOf('{')
    const b = s.lastIndexOf('}')
    if (a >= 0 && b > a) return JSON.parse(s.slice(a, b + 1)) as T
    throw new LlmError('Модель вернула не JSON')
  }
}

// Тонкий слой над любой моделью с OpenAI-совместимым API. По умолчанию Google Gemini Flash (бесплатный ключ из AI Studio).
// Заменить модель можно переменными окружения LLM_BASE_URL, LLM_MODEL, LLM_API_KEY, код менять не нужно.
/** feature: для какой функции платформы вызов (учёт токенов в «Аналитике») */
export type Llm = (req: { system: string; user: string; feature?: string }) => Promise<string>
export type UsageRow = { model: string; feature: string; prompt_tokens: number; completion_tokens: number; total_tokens: number; estimated: boolean }

export const DEFAULT_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/openai'
/** Бесплатные модели Google меняются: пробуем по порядку, пока не найдётся доступная. Жёстко задать можно через LLM_MODEL. */
export const DEFAULT_MODELS = ['gemini-3.8-flash', 'gemini-3.5-flash-lite', 'gemini-3.6-flash', 'gemini-3.1-flash-lite']

export class LlmError extends Error {}

/** Учёт токенов: берём usage ответа; если провайдер его не вернул, оцениваем по длине текста (~4 знака на токен). Сбой учёта вызов не ломает. */
async function record(onUsage: ((u: UsageRow) => Promise<void> | void) | undefined, a: { model: string; feature: string; system: string; user: string; text: string; usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } }) {
  if (!onUsage) return
  try {
    const u = a.usage
    const has = !!u && (u.total_tokens || u.prompt_tokens || u.completion_tokens)
    const prompt = has ? (u!.prompt_tokens ?? 0) : Math.ceil((a.system.length + a.user.length) / 4)
    // у моделей с «размышлением» total больше суммы: разницу считаем выходными токенами
    const total = has ? (u!.total_tokens ?? prompt + (u!.completion_tokens ?? 0)) : prompt + Math.ceil(a.text.length / 4)
    const completion = has ? Math.max(u!.completion_tokens ?? 0, total - prompt) : total - prompt
    await onUsage({ model: a.model, feature: a.feature, prompt_tokens: prompt, completion_tokens: completion, total_tokens: total, estimated: !has })
  } catch { /* учёт необязателен */ }
}

export function openAiCompatible(cfg: { apiKey: string; baseUrl?: string; model?: string; models?: string[]; onUsage?: (u: UsageRow) => Promise<void> | void }): Llm {
  const base = (cfg.baseUrl || DEFAULT_BASE_URL).replace(/\/$/, '')
  const models = cfg.models?.length ? cfg.models : cfg.model ? [cfg.model] : DEFAULT_MODELS
  const call = (model: string, system: string, user: string) =>
    fetch(`${base}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cfg.apiKey}` },
      body: JSON.stringify({ model, temperature: 0.3, response_format: { type: 'json_object' }, messages: [{ role: 'system', content: system }, { role: 'user', content: user }] }),
      signal: AbortSignal.timeout(25_000),
    }).catch((e: unknown) => ({ ok: false, status: 0, text: async () => (e instanceof Error ? e.message : String(e)) }) as Response)

  return async ({ system, user, feature }) => {
    let lastErr = ''
    for (const model of models) {
      const r = await call(model, system, user)
      if (r.ok) {
        const data = (await r.json()) as { choices?: { message?: { content?: string } }[]; usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } }
        const text = data.choices?.[0]?.message?.content
        if (text) {
          await record(cfg.onUsage, { model, feature: feature ?? 'other', system, user, text, usage: data.usage })
          return text
        }
        lastErr = `${model}: пустой ответ модели`
        continue
      }
      if (r.status === 401 || r.status === 403) throw new LlmError('Ключ LLM_API_KEY не подходит или у него нет доступа')
      if (r.status === 429) throw new LlmError('Достигнут лимит бесплатного тарифа модели, повторите позже')
      lastErr = `${model}: ${r.status} ${(await r.text()).replace(/\s+/g, ' ').slice(0, 120)}`
      // 404 (модель недоступна) и 400 (модель не поддерживает запрос): пробуем следующую; прочие сбои дают одну повторную попытку ниже
      if (r.status !== 404 && r.status !== 400 && r.status !== 0 && r.status < 500) break
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

/** Проверка одной модели строго: отвечает ли она на этот ключ. Возвращает время ответа или понятную причину. */
export async function testModel(cfg: { apiKey: string; baseUrl?: string }, model: string): Promise<{ ok: true; ms: number } | { ok: false; error: string }> {
  const t0 = Date.now()
  try {
    await openAiCompatible({ ...cfg, model })({ system: 'Верни JSON {"ok": true}', user: 'проверка связи' })
    return { ok: true, ms: Date.now() - t0 }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return { ok: false, error: /404/.test(msg) ? 'Недоступна для вашего ключа' : msg.replace(/^Модель недоступна: /, '').slice(0, 140) }
  }
}

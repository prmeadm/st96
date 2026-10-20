import type { Api } from 'grammy'
import type { Repo } from '../repo'
import type { AgentDeps } from './engine'
import { LlmError, openAiCompatible, type Llm } from './llm'
import { CUSTOM_PREFIX, CUSTOM_SETTING, modelChain, parseCustom } from './models'

export const MODEL_SETTING = 'llm_model'

const fail = (msg: string): Llm => async () => { throw new LlmError(msg) }

/** Модель по выбору из настроек: своя (строго, без тихого перехода на Google) или Google с запасными. */
export async function resolveLlm(repo: Repo, env: Record<string, string | undefined>): Promise<Llm> {
  const selected = await repo.getSetting(MODEL_SETTING).catch(() => null)
  if (selected?.startsWith(CUSTOM_PREFIX)) {
    const custom = parseCustom(await repo.getSetting(CUSTOM_SETTING).catch(() => null)).find((m) => m.id === selected)
    if (!custom) return fail('Выбранная модель удалена. Выберите другую на вкладке «Модель».')
    const key = env[custom.keyEnv]
    if (!key) return fail(`Не задан ключ ${custom.keyEnv} в настройках Vercel (после добавления нужен новый деплой)`)
    return openAiCompatible({ apiKey: key, baseUrl: custom.baseUrl, model: custom.model, onUsage: (u) => repo.insertLlmUsage(u) })
  }
  const key = env.LLM_API_KEY
  if (!key) return fail('Не задан ключ LLM_API_KEY в настройках Vercel')
  return openAiCompatible({ apiKey: key, baseUrl: env.LLM_BASE_URL, models: modelChain(selected, env.LLM_MODEL), onUsage: (u) => repo.insertLlmUsage(u) })
}

export async function agentDeps(repo: Repo, api: Api | null, env: Record<string, string | undefined>): Promise<AgentDeps> {
  return { repo, api, groupChatId: env.TELEGRAM_CHAT_ID ? Number(env.TELEGRAM_CHAT_ID) : null, llm: await resolveLlm(repo, env) }
}

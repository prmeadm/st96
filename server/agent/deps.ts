import type { Api } from 'grammy'
import type { Repo } from '../repo'
import type { AgentDeps } from './engine'
import { LlmError, openAiCompatible } from './llm'

/** Зависимости агента из переменных окружения. Без ключа задания не падают, а получают понятную ошибку. */
export function agentDeps(repo: Repo, api: Api | null, env: Record<string, string | undefined>): AgentDeps {
  const key = env.LLM_API_KEY
  return {
    repo, api,
    groupChatId: env.TELEGRAM_CHAT_ID ? Number(env.TELEGRAM_CHAT_ID) : null,
    llm: key ? openAiCompatible({ apiKey: key, baseUrl: env.LLM_BASE_URL, model: env.LLM_MODEL }) : async () => { throw new LlmError('Не задан ключ LLM_API_KEY в настройках Vercel') },
  }
}

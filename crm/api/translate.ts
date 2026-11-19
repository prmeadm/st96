import { Api } from 'grammy'
import { requireAdmin, json } from '../server/adminAuth'
import { agentDeps } from '../server/agent/deps'
import { LlmError } from '../server/agent/llm'
import { supabaseRepo } from '../server/repo'
import { translateToEnglish } from '../server/translate'

export const config = { runtime: 'edge' }

// Перевод русского текста на английский для английских полей шаблонов, рассылок и воронок. Только администраторы.
export default async function handler(req: Request) {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)
  const token = process.env.TELEGRAM_BOT_TOKEN
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!token || !url || !key) return json({ error: 'Server not configured' }, 500)
  const denied = await requireAdmin(req, url, key)
  if (denied) return denied

  let body: { text?: string }
  try {
    body = (await req.json()) as typeof body
  } catch {
    return json({ error: 'Invalid JSON' }, 400)
  }
  const deps = await agentDeps(supabaseRepo(url, key), new Api(token), process.env)
  try {
    return json({ text: await translateToEnglish(deps.llm, body.text ?? '') })
  } catch (e) {
    return json({ error: e instanceof LlmError ? e.message : 'Не удалось выполнить перевод' }, e instanceof LlmError ? 422 : 502)
  }
}

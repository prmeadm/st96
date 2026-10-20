import { requireAdmin, json } from '../server/adminAuth'
import { CUSTOM_SETTING, parseCustom } from '../server/agent/models'
import { supabaseRepo } from '../server/repo'

export const config = { runtime: 'edge' }

// Состояние подключений для раздела «Настройки»: что задано в Vercel и как чувствует себя вебхук Telegram. Значения ключей не отдаются.
export default async function handler(req: Request) {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return json({ error: 'Server not configured' }, 500)
  const denied = await requireAdmin(req, url, key)
  if (denied) return denied

  const token = process.env.TELEGRAM_BOT_TOKEN
  let webhook: { url: string; pending: number; lastError: string | null } | null = null
  if (token) {
    const r = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`, { signal: AbortSignal.timeout(6000) }).catch(() => null)
    const j = r && r.ok ? ((await r.json()) as { result?: { url?: string; pending_update_count?: number; last_error_message?: string } }) : null
    if (j?.result) webhook = { url: j.result.url ?? '', pending: j.result.pending_update_count ?? 0, lastError: j.result.last_error_message ?? null }
  }
  const custom = parseCustom(await supabaseRepo(url, key).getSetting(CUSTOM_SETTING).catch(() => null))
  return json({
    telegram: { token: !!token, group: !!process.env.TELEGRAM_CHAT_ID, webhook },
    llm: { key: !!process.env.LLM_API_KEY, baseUrl: process.env.LLM_BASE_URL ?? null, model: process.env.LLM_MODEL ?? null },
    custom: custom.map((m) => ({ id: m.id, name: m.name, keyEnv: m.keyEnv, set: !!process.env[m.keyEnv] })),
  })
}

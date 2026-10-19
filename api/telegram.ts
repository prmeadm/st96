import { webhookCallback } from 'grammy'
import { createBot } from '../server/bot/bot'
import { supabaseRepo, tracedRepo } from '../server/repo'

export const config = { runtime: 'edge' }

// Вебхук Telegram-бота.
//   POST — апдейты от Telegram (проверка секрета TELEGRAM_WEBHOOK_SECRET).
//   GET ?setup=1 с заголовком x-ingest-secret — подключает вебхук и показывает состояние бота.
export default async function handler(req: Request) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  const missing = Object.entries({ TELEGRAM_BOT_TOKEN: token, TELEGRAM_WEBHOOK_SECRET: secret, SUPABASE_URL: url, SUPABASE_SERVICE_ROLE_KEY: key })
    .filter(([, v]) => !v)
    .map(([k]) => k)

  if (req.method === 'GET') {
    const reqUrl = new URL(req.url)
    if (reqUrl.searchParams.get('setup') !== '1') return new Response('ok')
    const admin = process.env.INGEST_SECRET
    if (!admin || req.headers.get('x-ingest-secret') !== admin) return new Response('Forbidden', { status: 403 })
    if (missing.length) return json({ error: 'Server not configured', missing }, 500)
    const api = (method: string, body?: unknown) =>
      fetch(`https://api.telegram.org/bot${token}/${method}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body ?? {}),
      }).then((r) => r.json() as Promise<{ ok: boolean; result?: Record<string, unknown>; description?: string }>)
    const set = await api('setWebhook', {
      url: `${reqUrl.origin}/api/telegram`, secret_token: secret, allowed_updates: ['message', 'callback_query'], drop_pending_updates: false,
    })
    const info = await api('getWebhookInfo')
    const me = await api('getMe')
    const chatId = process.env.TELEGRAM_CHAT_ID
    const chat = chatId ? await api('getChat', { chat_id: chatId }) : null
    const member = chatId && me.result?.id ? await api('getChatMember', { chat_id: chatId, user_id: me.result.id }) : null
    return json({
      setWebhook: set.ok ? 'ok' : set.description,
      webhook: { url: info.result?.url, pending: info.result?.pending_update_count, lastError: info.result?.last_error_message ?? null },
      bot: { username: me.result?.username, canReadAllGroupMessages: me.result?.can_read_all_group_messages },
      group: chat ? { ok: chat.ok, title: chat.result?.title, type: chat.result?.type, error: chat.description ?? null, botStatus: member?.result?.status ?? member?.description ?? null, isForum: chat.result?.is_forum ?? false, canManageTopics: member?.result?.can_manage_topics ?? null } : null,
    }, 200)
  }

  if (req.method !== 'POST') return new Response('ok')
  // Без секрета вебхук не принимает ничего: иначе любой мог бы слать фальшивые апдейты
  if (missing.length) return new Response(`Server not configured: ${missing.join(', ')}`, { status: 500 })

  const bot = createBot(token!, tracedRepo(supabaseRepo(url!, key!)), { groupChatId: process.env.TELEGRAM_CHAT_ID ? Number(process.env.TELEGRAM_CHAT_ID) : null })
  if (!bot.isInited()) await bot.init()
  return webhookCallback(bot, 'std/http', { secretToken: secret! })(req)
}

function json(data: unknown, status: number) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })
}

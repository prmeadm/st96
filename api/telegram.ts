import { webhookCallback } from 'grammy'
import { createBot } from '../server/bot/bot.ts'
import { supabaseRepo } from '../server/repo.ts'

export const config = { runtime: 'edge' }

// Вебхук Telegram-бота. Подключается командой setWebhook с секретом TELEGRAM_WEBHOOK_SECRET.
export default async function handler(req: Request) {
  if (req.method !== 'POST') return new Response('ok')

  const token = process.env.TELEGRAM_BOT_TOKEN
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  // Без секрета вебхук не принимает ничего: иначе любой мог бы слать фальшивые апдейты
  if (!token || !secret || !url || !key) return new Response('Server not configured', { status: 500 })

  const bot = createBot(token, supabaseRepo(url, key), { groupChatId: process.env.TELEGRAM_CHAT_ID ? Number(process.env.TELEGRAM_CHAT_ID) : null })
  if (!bot.isInited()) await bot.init()
  return webhookCallback(bot, 'std/http', { secretToken: secret })(req)
}

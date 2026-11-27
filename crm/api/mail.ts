/// <reference types="node" />
import { createClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'
import { Bot } from 'grammy'
import { dbSchema } from '../server/env.js'

export const config = { runtime: 'nodejs' }

// Vercel Node-runtime функции не поддерживают web-сигнатуру Request/Response:
// обработчик должен быть классическим (req, res).
type NodeReq = { method?: string; headers: Record<string, string | string[] | undefined> }
type NodeRes = { status: (code: number) => { json: (body: unknown) => void } }

const send = (res: NodeRes, status: number, body: unknown) => res.status(status).json(body)

type OutboxRow = {
  id: number
  to_email: string | null
  template: string
  payload: Record<string, unknown>
  attempts: number
}

const subjectFor = (template: string, payload: Record<string, unknown>) => {
  const n = typeof payload.order_number === 'string' ? payload.order_number : ''
  if (template === 'order_created') return 'Заявка ' + n + ' создана — ST96'
  if (template === 'invoice_ready') return 'Счёт по заявке ' + n + ' готов — ST96'
  if (template === 'paid') return 'Оплата по заявке ' + n + ' подтверждена — ST96'
  if (template === 'docs_ready') return 'Документы по заявке ' + n + ' готовы — ST96'
  if (template === 'renewal_soon') return 'Пакет продлится автоматически — ST96'
  if (template === 'expired') return 'Заявка ' + n + ' отменена — ST96'
  return 'ST96 — уведомление'
}

const textFor = (template: string, payload: Record<string, unknown>) => {
  const n = typeof payload.order_number === 'string' ? payload.order_number : ''
  const amount = payload.amount != null ? String(payload.amount) + ' ' + String(payload.currency || 'BYN') : ''
  if (template === 'order_created') {
    return 'Здравствуйте!\n\nЗаявка ' + n + ' создана на сумму ' + amount + '.\nСчёт и документы появятся в личном кабинете: /cabinet → «Документы».\n\nST96'
  }
  if (template === 'invoice_ready') return 'Счёт по заявке ' + n + ' готов. Откройте личный кабинет: /cabinet → «Документы».\n\nST96'
  if (template === 'paid') return 'Оплата по заявке ' + n + ' подтверждена, пакет активирован.\n\nST96'
  if (template === 'docs_ready') return 'Акт и закрывающие документы по заявке ' + n + ' готовы в кабинете.\n\nST96'
  if (template === 'renewal_soon') return 'Пакет продлится автоматически, заявка и счёт уже в кабинете.\n\nST96'
  if (template === 'expired') return 'Заявка ' + n + ' отменена: срок оплаты истёк. Пакет не продлён, документы аннулированы.\n\nST96'
  return 'Откройте личный кабинет ST96: /cabinet'
}

export default async function handler(req: NodeReq, res: NodeRes) {
  if (req.method !== 'GET' && req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' })
  // Vercel Cron передаёт Authorization: Bearer <CRON_SECRET>; вручную можно слать MAIL_WORKER_SECRET.
  const secret = process.env.MAIL_WORKER_SECRET || process.env.CRON_SECRET
  if (!secret) return send(res, 503, { error: 'Mail worker is not configured' })
  const rawAuth = req.headers['authorization']
  const authHeader = Array.isArray(rawAuth) ? rawAuth[0] : rawAuth || ''
  const auth = authHeader.replace(/^Bearer\s+/i, '')
  if (auth !== secret) return send(res, 401, { error: 'Unauthorized' })

  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  const user = process.env.MAILRU_SMTP_USER
  const pass = process.env.MAILRU_SMTP_PASSWORD
  if (!url || !key || !user || !pass) return send(res, 503, { error: 'Mail is not configured' })

  const db = createClient(url, key, { db: { schema: dbSchema() }, auth: { persistSession: false, autoRefreshToken: false } })
  const { data: rows } = await db
    .from('email_outbox')
    .select('id, to_email, template, payload, attempts')
    .in('status', ['queued', 'failed'])
    .lt('attempts', 5)
    .order('created_at', { ascending: true })
    .limit(20)

  const transporter = nodemailer.createTransport({
    host: 'smtp.mail.ru',
    port: 465,
    secure: true,
    auth: { user, pass },
  })
  const from = process.env.MAIL_FROM || user
  let sent = 0
  let failed = 0

  for (const row of (rows ?? []) as OutboxRow[]) {
    if (!row.to_email) {
      await db.from('email_outbox').update({ status: 'skipped' }).eq('id', row.id)
      continue
    }
    try {
      await transporter.sendMail({
        from: 'ST96 <' + from + '>',
        to: row.to_email,
        subject: subjectFor(row.template, row.payload),
        text: textFor(row.template, row.payload),
      })
      await db.from('email_outbox').update({ status: 'sent', sent_at: new Date().toISOString(), attempts: row.attempts + 1 }).eq('id', row.id)
      sent += 1
    } catch (e) {
      const message = e instanceof Error ? e.message.slice(0, 500) : 'send failed'
      const attempts = row.attempts + 1
      await db.from('email_outbox').update({ status: attempts >= 5 ? 'failed' : 'queued', attempts, last_error: message }).eq('id', row.id)
      failed += 1
    }
  }

  // Telegram-уведомления из той же очереди (renewal_soon / expired).
  let tgSent = 0
  let tgFailed = 0
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  if (botToken) {
    const { data: tgRows } = await db
      .from('telegram_outbox')
      .select('id, tg_user_id, template, payload, attempts')
      .eq('status', 'queued')
      .lt('attempts', 5)
      .order('created_at', { ascending: true })
      .limit(20)
    if (tgRows?.length) {
      const bot = new Bot(botToken)
      for (const row of tgRows as { id: string; tg_user_id: number; template: string; payload: Record<string, unknown>; attempts: number }[]) {
        const n = typeof row.payload.order_number === 'string' ? row.payload.order_number : ''
        const text = row.template === 'expired'
          ? 'Заявка ' + n + ' отменена: срок оплаты истёк. Пакет не продлён. Документы аннулированы.\n\nST96'
          : row.template === 'paid'
            ? 'Оплата по заявке ' + n + ' подтверждена, пакет активирован. Документы в кабинете ST96.'
            : 'Пакет продлится автоматически. Заявка и счёт уже в кабинете ST96.'
        try {
          await bot.api.sendMessage(row.tg_user_id, text)
          await db.from('telegram_outbox').update({ status: 'sent', sent_at: new Date().toISOString(), attempts: row.attempts + 1 }).eq('id', row.id)
          tgSent += 1
        } catch (e) {
          const message = e instanceof Error ? e.message.slice(0, 500) : 'send failed'
          const attempts = row.attempts + 1
          await db.from('telegram_outbox').update({ status: attempts >= 5 ? 'failed' : 'queued', attempts, last_error: message }).eq('id', row.id)
          tgFailed += 1
        }
      }
    }
  }
  return send(res, 200, { sent, failed, tg_sent: tgSent, tg_failed: tgFailed })
}

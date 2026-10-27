import { ingestLead } from '../crm/server/leads/ingest'
import { clickablePhone, parseLead } from '../crm/server/leads/parse'
import { supabaseRepo, tracedRepo } from '../crm/server/repo'
import { Api } from 'grammy'
import { botWroteNow, startFromSiteLogin } from '../crm/server/bot/bot'
import { verifyTelegramLogin, withDeadline, type EdgeCtx } from '../crm/server/bot/telegramLogin'
import { issueSiteRef } from '../crm/server/bot/siteRef'

export const config = { runtime: 'edge' }

type Attribution = {
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_content?: string
  utm_term?: string
  landing?: string
  referrer?: string
}

type LeadPayload = {
  name?: string
  contact?: string
  interest?: string
  message?: string
  consent?: boolean
  policyVersion?: string
  attribution?: Attribution
  eventId?: string
  internal?: boolean
  lang?: string
  pageUrl?: string
  ads?: { fbp?: string; fbc?: string; ttp?: string; ttclid?: string }
  /** Объект Telegram Login Widget (data-request-access="write") как есть: id, first_name, last_name?, username?, photo_url?, auth_date, hash */
  tg?: unknown
}

/** Сколько форма ждёт запуска воронки в Telegram; дольше воронка дорабатывает в фоне. */
const TG_START_WAIT_MS = 4000

export default async function handler(req: Request, ctx?: EdgeCtx) {
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  let body: LeadPayload
  try {
    body = (await req.json()) as LeadPayload
  } catch {
    return json({ error: 'Invalid JSON' }, 400)
  }

  const name = body.name?.trim()
  const contact = body.contact?.trim()
  if (!name || !contact) {
    return json({ error: 'Missing fields' }, 400)
  }

  if (body.consent !== true) {
    return json({ error: 'Consent required' }, 400)
  }

  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  if (!token || !chatId) {
    return json({ error: 'Server not configured' }, 500)
  }

  const a = body.attribution ?? {}
  const t = (v?: string) => (typeof v === 'string' ? v.trim().slice(0, 100) : '')
  const utm = [a.utm_source, a.utm_medium, a.utm_campaign, a.utm_content, a.utm_term].map(t).filter(Boolean)
  const source = utm.length ? utm.join(' / ') : t(a.referrer) ? `переход с ${t(a.referrer)}` : 'прямой заход'

  const text = [
    '\u{1F195} Новая заявка с сайта ST96',
    `Имя: ${name}`,
    `Контакт: ${contact.includes('@') ? contact : clickablePhone(contact)}`,
    body.interest?.trim() && `Интересует: ${body.interest.trim()}`,
    body.message?.trim() && `Сообщение: ${body.message.trim()}`,
    `Язык сайта: ${body.lang === 'en' ? 'English (EN)' : 'Русский (RU)'}`,
    `Источник: ${body.internal === true ? 'внутренний тест (не в рекламные события)' : source}`,
    t(a.landing) && `Страница входа: ${t(a.landing)}`,
    `Согласие на обработку ПД: да (политика от ${(body.policyVersion ?? 'н/д').slice(0, 20)}, ${new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Minsk' })} МСК)`,
    `Согласие на рекламу и передачу данных в рекламных целях: да`,
  ]
    .filter(Boolean)
    .join('\n')

  const tgRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text }),
  })

  // Если группа недоступна (бота убрали, сменился чат), заявка не должна пропасть: сохраняем её в базу
  let messageId: number | null = null
  if (tgRes.ok) {
    messageId = ((await tgRes.json()) as { result?: { message_id?: number } }).result?.message_id ?? null
  } else {
    console.error('telegram delivery failed', tgRes.status, (await tgRes.text().catch(() => '')).slice(0, 200))
  }

  let saved = false
  let clientId: string | null = null
  let clientCreated = false
  /** Подписанный токен для /start site_ в ответе форме; только если эта заявка создала карточку */
  let ref: string | null = null
  if (body.internal !== true) {
    try {
      const url = process.env.SUPABASE_URL
      const key = process.env.SUPABASE_SERVICE_ROLE_KEY
      if (url && key) {
        const utmObj = Object.fromEntries(
          Object.entries({ source: a.utm_source, medium: a.utm_medium, campaign: a.utm_campaign, content: a.utm_content, term: a.utm_term, referrer: a.referrer })
            .map(([k, v]) => [k, t(v)])
            .filter(([, v]) => v),
        )
        const ingested = await ingestLead(supabaseRepo(url, key), parseLead(text), {
          source: 'site_form',
          consent: true, // согласие дано в форме (обязательная галочка), отдельный запрос в боте не нужен
          tgChatId: messageId ? Number(chatId) : null,
          tgMessageId: messageId,
          rawText: text,
          utm: Object.keys(utmObj).length ? (utmObj as Record<string, string>) : null,
        })
        saved = true
        clientId = ingested.clientId
        clientCreated = ingested.clientCreated
        ref = await issueSiteRef(ingested, token).catch(() => null)
      }
    } catch (e) {
      console.error('lead db save failed', e instanceof Error ? e.message : e)
    }
  }
  if (!tgRes.ok && !saved) return json({ error: 'Telegram delivery failed' }, 502)

  // Вход через Telegram в форме: бот пишет первым и запускает воронку сайта. Любая ошибка здесь заявку не роняет.
  const tgStarted = body.tg ? await withDeadline(startTelegram(body.tg, token, Number(chatId), clientId, clientCreated, body.lang), TG_START_WAIT_MS, ctx) : false

  if (body.internal !== true) await sendAdEvents(req, body, contact)

  return json({ ok: true, ref, tgStarted }, 200)
}

async function startTelegram(raw: unknown, token: string, groupChatId: number, clientId: string | null, clientCreated: boolean, lang?: string): Promise<boolean> {
  try {
    const user = await verifyTelegramLogin(raw, token)
    if (!user) {
      console.warn('telegram login rejected: bad signature or expired')
      return false
    }
    const url = process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) return false
    const r = await startFromSiteLogin(new Api(token), tracedRepo(supabaseRepo(url, key)), Number.isFinite(groupChatId) ? groupChatId : null, user, {
      clientId, clientCreated, lang: lang === 'en' ? 'en' : 'ru',
    })
    return botWroteNow(r)
  } catch (e) {
    // Например, человек не дал боту права писать (403 bot can't initiate conversation) или Telegram недоступен
    console.error('telegram site start failed', e instanceof Error ? e.message : e)
    return false
  }
}

function json(data: unknown, status: number) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

const clip = (v?: string, n = 200) => (typeof v === 'string' ? v.trim().slice(0, n) : undefined) || undefined

async function sha256(value: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

function splitContact(contact: string) {
  if (contact.includes('@')) return { email: contact.trim().toLowerCase(), phone: undefined }
  let digits = contact.replace(/\D/g, '')
  if (digits.length === 9) digits = `375${digits}`
  return { email: undefined, phone: digits.length >= 10 ? digits : undefined }
}

async function sendAdEvents(req: Request, body: LeadPayload, contact: string) {
  const metaId = process.env.META_PIXEL_ID
  const metaToken = process.env.META_CAPI_TOKEN
  const ttId = process.env.TIKTOK_PIXEL_ID
  const ttToken = process.env.TIKTOK_ACCESS_TOKEN
  if (!(metaId && metaToken) && !(ttId && ttToken)) return

  const { email, phone } = splitContact(contact)
  const hEmail = email ? await sha256(email) : undefined
  const hPhone = phone ? await sha256(phone) : undefined
  const eventId = clip(body.eventId, 64) ?? crypto.randomUUID()
  const url = clip(body.pageUrl, 500)
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  const ua = req.headers.get('user-agent') ?? undefined
  const ads = body.ads ?? {}
  const time = Math.floor(Date.now() / 1000)
  const post = (target: string, init: RequestInit) =>
    fetch(target, { ...init, signal: AbortSignal.timeout(4000) }).catch(() => undefined)

  const jobs: Promise<unknown>[] = []

  if (metaId && metaToken) {
    const payload: Record<string, unknown> = {
      data: [
        {
          event_name: 'Lead',
          event_time: time,
          event_id: eventId,
          action_source: 'website',
          event_source_url: url,
          user_data: {
            em: hEmail ? [hEmail] : undefined,
            ph: hPhone ? [hPhone] : undefined,
            client_ip_address: ip,
            client_user_agent: ua,
            fbp: clip(ads.fbp),
            fbc: clip(ads.fbc),
          },
          custom_data: { content_name: clip(body.interest) },
        },
      ],
    }
    if (process.env.META_TEST_EVENT_CODE) payload.test_event_code = process.env.META_TEST_EVENT_CODE
    jobs.push(
      post(`https://graph.facebook.com/v21.0/${metaId}/events?access_token=${encodeURIComponent(metaToken)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }),
    )
  }

  if (ttId && ttToken) {
    const payload: Record<string, unknown> = {
      event_source: 'web',
      event_source_id: ttId,
      data: [
        {
          event: 'SubmitForm',
          event_time: time,
          event_id: eventId,
          user: {
            email: hEmail,
            phone: hPhone ? await sha256(`+${phone}`) : undefined,
            ip,
            user_agent: ua,
            ttp: clip(ads.ttp),
            ttclid: clip(ads.ttclid),
          },
          page: { url },
        },
      ],
    }
    if (process.env.TIKTOK_TEST_EVENT_CODE) payload.test_event_code = process.env.TIKTOK_TEST_EVENT_CODE
    jobs.push(
      post('https://business-api.tiktok.com/open_api/v1.3/event/track/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Access-Token': ttToken },
        body: JSON.stringify(payload),
      }),
    )
  }

  await Promise.allSettled(jobs)
}

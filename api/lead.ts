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
  pageUrl?: string
  ads?: { fbp?: string; fbc?: string; ttp?: string; ttclid?: string }
}

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  let body: LeadPayload
  try {
    body = await req.json()
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
    `Контакт: ${contact}`,
    body.interest?.trim() && `Интересует: ${body.interest.trim()}`,
    body.message?.trim() && `Сообщение: ${body.message.trim()}`,
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

  if (!tgRes.ok) {
    return json({ error: 'Telegram delivery failed' }, 502)
  }

  if (body.internal !== true) await sendAdEvents(req, body, contact)

  return json({ ok: true }, 200)
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

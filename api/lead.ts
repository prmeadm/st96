export const config = { runtime: 'edge' }

type LeadPayload = {
  name?: string
  contact?: string
  interest?: string
  message?: string
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

  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  if (!token || !chatId) {
    return json({ error: 'Server not configured' }, 500)
  }

  const text = [
    '\u{1F195} Новая заявка с сайта ST96',
    `Имя: ${name}`,
    `Контакт: ${contact}`,
    body.interest?.trim() && `Интересует: ${body.interest.trim()}`,
    body.message?.trim() && `Сообщение: ${body.message.trim()}`,
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

  return json({ ok: true }, 200)
}

function json(data: unknown, status: number) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

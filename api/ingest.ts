import { ingestLead } from '../server/leads/ingest.ts'
import { parseLead } from '../server/leads/parse.ts'
import { supabaseRepo } from '../server/repo.ts'

export const config = { runtime: 'edge' }

// Приём заявок от других наших проектов (памятка стенда). Они сами шлют сообщение в группу
// и присылают сюда его текст и id, чтобы заявка попала в базу и потом связалась с ответами сотрудников.
export default async function handler(req: Request) {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const secret = process.env.INGEST_SECRET
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!secret || !url || !key) return json({ error: 'Server not configured' }, 500)
  if (req.headers.get('x-ingest-secret') !== secret) return json({ error: 'Forbidden' }, 403)

  let body: { text?: unknown; tgChatId?: unknown; tgMessageId?: unknown }
  try {
    body = (await req.json()) as typeof body
  } catch {
    return json({ error: 'Invalid JSON' }, 400)
  }
  const text = typeof body.text === 'string' ? body.text.slice(0, 4000) : ''
  const parsed = parseLead(text)
  if (!parsed.isLead) return json({ error: 'Not a lead' }, 400)

  const chat = Number(body.tgChatId)
  const msg = Number(body.tgMessageId)
  const r = await ingestLead(supabaseRepo(url, key), parsed, {
    tgChatId: Number.isFinite(chat) ? chat : null,
    tgMessageId: Number.isFinite(msg) ? msg : null,
    rawText: text,
  })
  return json({ ok: true, created: r.created }, 200)
}

function json(data: unknown, status: number) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })
}

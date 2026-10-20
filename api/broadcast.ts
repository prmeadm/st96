import { Api } from 'grammy'
import { requireAdmin, json } from '../server/adminAuth'
import { inAudience, startBroadcast, type Segment } from '../server/broadcasts'
import { supabaseRepo } from '../server/repo'

export const config = { runtime: 'edge' }

// Рассылки из админки (только администраторы):
//   count  — сколько клиентов попадёт в сегмент;
//   start  — зафиксировать получателей и запустить (сразу или по расписанию из черновика);
//   cancel — остановить.
export default async function handler(req: Request) {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)
  const token = process.env.TELEGRAM_BOT_TOKEN
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!token || !url || !key) return json({ error: 'Server not configured' }, 500)
  const denied = await requireAdmin(req, url, key)
  if (denied) return denied

  let body: { action?: string; segment?: Segment; id?: string }
  try {
    body = (await req.json()) as typeof body
  } catch {
    return json({ error: 'Invalid JSON' }, 400)
  }
  const repo = supabaseRepo(url, key)

  if (body.action === 'count') {
    const audience = await repo.listAudience()
    return json({ count: audience.filter((c) => inAudience(c, body.segment ?? {})).length, reachable: audience.length })
  }

  const b = body.id ? await repo.getBroadcast(body.id) : null
  if (!b) return json({ error: 'Рассылка не найдена' }, 404)

  if (body.action === 'cancel') {
    if (b.status !== 'scheduled' && b.status !== 'sending') return json({ error: 'Отменить можно запланированную или идущую рассылку' }, 409)
    await repo.updateBroadcast(b.id, { status: 'canceled', finished_at: new Date().toISOString() })
    return json({ ok: true })
  }

  if (body.action === 'start') {
    const r = await startBroadcast(repo, new Api(token), b.id)
    return r.ok ? json({ ok: true, total: r.total }) : json({ error: r.error }, r.status)
  }
  return json({ error: 'Unknown action' }, 400)
}

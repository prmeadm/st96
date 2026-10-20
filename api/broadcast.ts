import { Api } from 'grammy'
import { requireAdmin, json } from '../server/adminAuth'
import { inAudience, tickBroadcasts, validateBroadcast, type Segment } from '../server/broadcasts'
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
    if (b.status !== 'draft') return json({ error: 'Запустить можно только черновик' }, 409)
    const problem = validateBroadcast(b)
    if (problem) return json({ error: problem }, 422)
    const ids = (await repo.listAudience()).filter((c) => inAudience(c, b.segment)).map((c) => c.id)
    if (!ids.length) return json({ error: 'В выбранном сегменте нет клиентов с согласием на рассылки' }, 422)
    await repo.insertRecipients(b.id, ids)
    await repo.updateBroadcast(b.id, { status: 'scheduled', total: ids.length })
    // Если время уже пришло, первая пачка уходит сразу, остальное доберёт расписание (раз в минуту)
    if (!b.scheduled_at || Date.parse(b.scheduled_at) <= Date.now()) await tickBroadcasts({ repo, api: new Api(token) }, 50)
    return json({ ok: true, total: ids.length })
  }
  return json({ error: 'Unknown action' }, 400)
}

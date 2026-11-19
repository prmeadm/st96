import { Api } from 'grammy'
import { requireAdmin, json } from '../server/adminAuth'
import { notifyClientDecision } from '../server/booking/notify'
import { createBooking, decideBooking, saveDirectAdmins, saveMeetDefault, saveSchedule, setMeetUrl } from '../server/booking/service'
import { supabaseRepo } from '../server/repo'

export const config = { runtime: 'edge' }

// Запись для администраторов: забронировать время за клиента (сразу подтверждено), сохранить расписание, подтвердить / отклонить / отменить заявку, задать ссылку на встречу.
export default async function handler(req: Request) {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!url || !key) return json({ error: 'Server not configured' }, 500)
  const denied = await requireAdmin(req, url, key)
  if (denied) return denied

  let b: { url?: string; action?: string; schedule?: unknown; id?: string; decision?: 'confirm' | 'reject' | 'cancel'; meetUrl?: string; booking?: Record<string, unknown> }
  try {
    b = (await req.json()) as typeof b
  } catch {
    return json({ error: 'Invalid JSON' }, 400)
  }
  const repo = supabaseRepo(url, key)
  if (b.action === 'save_schedule') return json({ ok: true, schedule: await saveSchedule(repo, b.schedule) })
  if (b.action === 'create' && b.booking) {
    const x = b.booking
    const r = await createBooking(repo, {
      service: x.service, format: x.format, date: x.date, time: x.time, name: x.name, phone: x.phone, telegram: x.telegram, comment: x.comment, source: 'admin',
    })
    if (!r.ok) return json({ error: r.error }, r.status)
    const d = await decideBooking(repo, r.booking.id, 'confirm', typeof x.meetUrl === 'string' ? x.meetUrl : undefined)
    if (!d.ok) return json({ error: d.error }, d.status)
    const notified = token ? await notifyClientDecision(new Api(token), repo, d.booking).catch(() => false) : false
    return json({ ok: true, id: d.booking.id, notified })
  }
  if (b.action === 'decide' && b.id && b.decision) {
    const r = await decideBooking(repo, b.id, b.decision, b.meetUrl)
    if (!r.ok) return json({ error: r.error }, r.status)
    const notified = token ? await notifyClientDecision(new Api(token), repo, r.booking).catch(() => false) : false
    return json({ ok: true, status: r.booking.status, notified })
  }
  if (b.action === 'save_direct_admins') {
    const r = await saveDirectAdmins(repo, typeof b.url === 'string' ? b.url : '')
    return r.ok ? json({ ok: true, nicks: r.nicks }) : json({ error: 'Не удалось сохранить' }, 500)
  }
  if (b.action === 'save_meet_default') {
    const r = await saveMeetDefault(repo, b.url ?? '')
    return r.ok ? json({ ok: true, url: r.url }) : json({ error: r.error }, r.status)
  }
  if (b.action === 'set_meet' && b.id) {
    const r = await setMeetUrl(repo, b.id, b.meetUrl ?? '')
    if (!r.ok) return json({ error: r.error }, r.status)
    return json({ ok: true })
  }
  return json({ error: 'Unknown action' }, 400)
}

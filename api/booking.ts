import { Api } from 'grammy'
import { json } from '../server/adminAuth'
import { buildIcs } from '../server/booking/ics'
import { notifyAdminsNewBooking } from '../server/booking/notify'
import { FORMAT_KEYS, FORMAT_LABEL, SERVICE_KEYS, isDate, minskNow, type FormatKey, type ServiceKey } from '../server/booking/schedule'
import { SITE_SERVICES } from '../server/catalog'
import { createBooking, daySlots, loadSchedule, monthAvailability } from '../server/booking/service'
import { supabaseRepo } from '../server/repo'

export const config = { runtime: 'edge' }

// Публичная запись на встречу (страница st96.by/book). Данные клиентов наружу не отдаются: только свободные слоты.
//   GET  ?ics=<id>     файл календаря подтверждённой встречи
//   POST config|month|day|create
export default async function handler(req: Request) {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return json({ error: 'Server not configured' }, 500)
  const repo = supabaseRepo(url, key)

  if (req.method === 'GET') {
    const id = new URL(req.url).searchParams.get('ics') ?? ''
    const b = /^[0-9a-f-]{36}$/.test(id) ? await repo.getBooking(id) : null
    if (!b || b.status !== 'confirmed') return new Response('Not found', { status: 404 })
    return new Response(buildIcs(b), { headers: { 'Content-Type': 'text/calendar; charset=utf-8', 'Content-Disposition': 'attachment; filename="st96-meeting.ics"', 'Cache-Control': 'no-store' } })
  }
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  let b: Record<string, unknown>
  try {
    b = (await req.json()) as Record<string, unknown>
  } catch {
    return json({ error: 'Invalid JSON' }, 400)
  }
  const now = new Date()
  const S = await loadSchedule(repo)
  const service = SERVICE_KEYS.includes(b.service as ServiceKey) ? (b.service as ServiceKey) : null
  const format = FORMAT_KEYS.includes(b.format as FormatKey) ? (b.format as FormatKey) : null

  if (b.action === 'config') {
    return json({
      services: SITE_SERVICES.map((x) => ({ key: x.key, ru: x.ru, en: x.en, infoRu: x.infoRu, infoEn: x.infoEn, url: x.url, urlEn: x.urlEn, minutes: S.rules.duration })),
      formats: FORMAT_KEYS.map((k) => ({ key: k, ru: FORMAT_LABEL[k].ru, en: FORMAT_LABEL[k].en })),
      offlineDays: S.rules.offlineDays, today: minskNow(now).date, horizon: S.rules.horizon,
    })
  }
  if (b.action === 'month') {
    if (!service || typeof b.month !== 'string' || !/^\d{4}-\d{2}$/.test(b.month)) return json({ error: 'Неверный запрос' }, 400)
    return json({ days: await monthAvailability(repo, S, b.month, format, now) })
  }
  if (b.action === 'day') {
    if (!service || !isDate(b.date)) return json({ error: 'Неверный запрос' }, 400)
    const d = await daySlots(repo, S, b.date, format, now)
    return json({ closed: d.closed, why: d.why, slots: d.slots.map((s) => ({ t: s.t, free: s.free })) })
  }
  if (b.action === 'create') {
    if (typeof b.website === 'string' && b.website) return json({ ok: true }) // ловушка для ботов: скрытое поле
    const r = await createBooking(repo, {
      service: b.service, format: b.format, date: b.date, time: b.time, name: b.name, company: b.company, telegram: b.telegram, phone: b.phone,
      goal: b.goal, comment: b.comment, clientId: b.clientId, runId: typeof b.runId === 'string' ? b.runId : null, runNode: typeof b.runNode === 'string' ? b.runNode : null,
      source: typeof b.runId === 'string' ? 'funnel' : typeof b.clientId === 'string' ? 'link' : 'site',
    }, now)
    if (!r.ok) return json({ error: r.error }, r.status)
    const token = process.env.TELEGRAM_BOT_TOKEN
    if (token) await notifyAdminsNewBooking(new Api(token), process.env.TELEGRAM_CHAT_ID ? Number(process.env.TELEGRAM_CHAT_ID) : null, r.booking).catch((e) => console.error('booking notify failed', e instanceof Error ? e.message : e))
    return json({ ok: true, id: r.booking.id, starts_at: r.booking.starts_at, ref: r.client.id })
  }
  return json({ error: 'Unknown action' }, 400)
}

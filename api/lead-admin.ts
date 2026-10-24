import { requireAdmin, json } from '../crm/server/adminAuth'
import { createManualLead, parseManualText, updateManualLead, type LeadFields } from '../crm/server/leads/manual'
import { supabaseRepo } from '../crm/server/repo'

export const config = { runtime: 'edge' }

// Заявки вручную (только админ):
//   parse   текст из Telegram -> поля (ничего не сохраняет)
//   create  поля из формы -> заявка + клиент по телефону или нику
//   update  правка заявки (карандаш); при смене контактов заявка переезжает к нужному клиенту
export default async function handler(req: Request) {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return json({ error: 'Server not configured' }, 500)
  const denied = await requireAdmin(req, url, key)
  if (denied) return denied

  let b: { action?: string; text?: string; id?: string; fields?: Partial<LeadFields> }
  try {
    b = (await req.json()) as typeof b
  } catch {
    return json({ error: 'Invalid JSON' }, 400)
  }
  if (b.action === 'parse') {
    const text = typeof b.text === 'string' ? b.text.slice(0, 8000) : ''
    if (!text.trim()) return json({ error: 'Вставьте текст заявки' }, 422)
    return json({ ok: true, ...parseManualText(text) })
  }
  const repo = supabaseRepo(url, key)
  if (b.action === 'create' && b.fields) {
    const r = await createManualLead(repo, b.fields, typeof b.text === 'string' ? b.text.slice(0, 8000) : '')
    return r.ok ? json(r) : json({ error: r.error }, 422)
  }
  if (b.action === 'update' && b.id && b.fields) {
    const r = await updateManualLead(repo, b.id, b.fields)
    return r.ok ? json(r) : json({ error: r.error }, 404)
  }
  return json({ error: 'Unknown action' }, 400)
}

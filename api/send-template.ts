import { Api } from 'grammy'
import { createClient } from '@supabase/supabase-js'
import { sendTemplate } from '../server/bot/dialog'
import { supabaseRepo } from '../server/repo'

export const config = { runtime: 'edge' }

const json = (data: unknown, status: number) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } })

// Отправка шаблона клиенту из админки. Вызывающий должен быть админом (токен входа проверяется по таблице admins).
export default async function handler(req: Request) {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)
  const token = process.env.TELEGRAM_BOT_TOKEN
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!token || !url || !key) return json({ error: 'Server not configured' }, 500)

  const jwt = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '')
  if (!jwt) return json({ error: 'Unauthorized' }, 401)
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data: u, error: authErr } = await db.auth.getUser(jwt)
  if (authErr || !u.user) return json({ error: 'Unauthorized' }, 401)
  const { data: adm } = await db.from('admins').select('user_id').eq('user_id', u.user.id).maybeSingle()
  if (!adm) return json({ error: 'Forbidden' }, 403)

  let body: { clientId?: string; templateId?: string }
  try {
    body = (await req.json()) as typeof body
  } catch {
    return json({ error: 'Invalid JSON' }, 400)
  }
  if (!body.clientId || !body.templateId) return json({ error: 'Missing fields' }, 400)

  const repo = supabaseRepo(url, key)
  const [client, tpl] = await Promise.all([repo.findClientById(body.clientId), repo.getTemplate(body.templateId)])
  if (!client || !tpl) return json({ error: 'Not found' }, 404)
  if (!client.tg_user_id) return json({ error: 'У клиента нет Telegram: отправить некуда' }, 422)
  try {
    await sendTemplate(new Api(token), repo, client, tpl)
  } catch (e) {
    const why = e instanceof Error ? e.message : String(e)
    return json({ error: /blocked|deactivated|chat not found/i.test(why) ? 'Клиент заблокировал бота или удалил чат' : why.slice(0, 200) }, 502)
  }
  return json({ ok: true }, 200)
}

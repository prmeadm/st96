import { Api } from 'grammy'
import { requireAdmin, json } from '../crm/server/adminAuth'
import { sendTemplate } from '../crm/server/bot/dialog'
import { supabaseRepo } from '../crm/server/repo'

export const config = { runtime: 'edge' }

// Отправка шаблона клиенту из админки. Вызывающий должен быть админом.
export default async function handler(req: Request) {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)
  const token = process.env.TELEGRAM_BOT_TOKEN
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!token || !url || !key) return json({ error: 'Server not configured' }, 500)
  const denied = await requireAdmin(req, url, key)
  if (denied) return denied

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
  return json({ ok: true })
}

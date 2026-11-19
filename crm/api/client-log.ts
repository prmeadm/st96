import { requireAdmin, json } from '../server/adminAuth'

export const config = { runtime: 'edge' }

// Шаги админки с телефона в логи Vercel (поиск «client-log»): так видно, где ломается то, что нельзя повторить на компьютере.
// Только администраторы, до 4 КБ на запись.
export default async function handler(req: Request) {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return json({ error: 'Server not configured' }, 500)
  const denied = await requireAdmin(req, url, key)
  if (denied) return denied
  const text = (await req.text()).slice(0, 4096)
  console.log('client-log', req.headers.get('user-agent')?.slice(0, 160) ?? '', text)
  return json({ ok: true })
}

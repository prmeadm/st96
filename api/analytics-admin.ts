import { requireAdmin, json } from '../crm/server/adminAuth'
import { PRICE_SETTING, parsePrices } from '../crm/server/usage'
import { supabaseRepo } from '../crm/server/repo'

export const config = { runtime: 'edge' }

// Аналитика, запись для админа: цены токенов по моделям (доллары за 1 млн), чтобы «эквивалент в деньгах» считался по вашим тарифам.
export default async function handler(req: Request) {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return json({ error: 'Server not configured' }, 500)
  const denied = await requireAdmin(req, url, key)
  if (denied) return denied
  let b: { action?: string; prices?: Record<string, { in?: unknown; out?: unknown }> }
  try { b = (await req.json()) as typeof b } catch { return json({ error: 'Invalid JSON' }, 400) }
  if (b.action === 'save_prices' && b.prices && typeof b.prices === 'object') {
    const clean = parsePrices(JSON.stringify(Object.fromEntries(Object.entries(b.prices).slice(0, 40).map(([m, p]) => [m.slice(0, 80), { in: Number(p.in), out: Number(p.out) }]))))
    await supabaseRepo(url, key).setSetting(PRICE_SETTING, JSON.stringify(clean))
    return json({ ok: true, prices: clean })
  }
  return json({ error: 'Unknown action' }, 400)
}

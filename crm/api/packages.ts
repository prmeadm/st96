/// <reference types="node" />
import { createClient } from '@supabase/supabase-js'
import { dbSchema } from '../server/env.js'

export const config = { runtime: 'edge' }

type PublicPackage = { code: string; title: string; credits: number | null; price: number | null; currency: string | null }

export default async function handler(req: Request) {
  if (req.method !== 'GET') return json({ error: 'Method not allowed' }, 405)
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return json({ packages: [] }, 200)
  try {
    const db = createClient(url, key, { db: { schema: dbSchema() }, auth: { persistSession: false, autoRefreshToken: false } })
    const { data } = await db.from('packages').select('code, title, credits, price, currency').eq('is_active', true).order('sort_order')
    const { data: rateRow } = await db.from('app_settings').select('value').eq('key', 'support.topup_rate').maybeSingle()
    const rawRate = (rateRow as { value?: unknown } | null)?.value
    const topupRate = Number(typeof rawRate === 'string' ? rawRate.replace(/"/g, '') : rawRate)
    return json({ topup_rate: Number.isFinite(topupRate) && topupRate > 0 ? topupRate : 0.3, packages: ((data ?? []) as PublicPackage[]).map((p) => ({ code: p.code, title: p.title, credits: p.credits == null ? null : Number(p.credits), price: p.price == null ? null : Number(p.price), currency: p.currency || 'BYN' })) }, 200)
  } catch {
    return json({ packages: [] }, 200)
  }
}

function json(d: unknown, s: number) {
  return new Response(JSON.stringify(d), { status: s, headers: { 'Content-Type': 'application/json' } })
}

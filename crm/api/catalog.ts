/// <reference types="node" />
import { createClient } from '@supabase/supabase-js'
import { dbSchema } from '../server/env.js'

export const config = { runtime: 'edge' }

type CatalogButton = { label: string; action: 'cart' | 'discuss' | 'link'; href?: string }
type CatalogItem = {
  id: string
  kind: 'service' | 'product'
  slug: string
  title: string
  description: string | null
  price: number | null
  currency: string
  buttons: CatalogButton[]
  media_type: 'photo' | 'video' | null
  media_url: string | null
  page: string
  sort: number
}

/** Каталог услуг и продуктов компании: публичный список для страниц сайта. */
export default async function handler(req: Request) {
  if (req.method !== 'GET') return json({ error: 'Method not allowed' }, 405)
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return json({ items: [] }, 200)
  try {
    const params = new URL(req.url).searchParams
    const page = params.get('page') ?? ''
    const kind = params.get('kind') ?? ''
    const db = createClient(url, key, { db: { schema: dbSchema() }, auth: { persistSession: false, autoRefreshToken: false } })
    let q = db.from('catalog_items').select('id, kind, slug, title, description, price, currency, buttons, media_type, media_url, page, sort').eq('active', true).order('sort', { ascending: true }).order('created_at', { ascending: true })
    if (page) q = q.eq('page', page)
    if (kind === 'service' || kind === 'product') q = q.eq('kind', kind)
    const { data } = await q
    const rows = ((data ?? []) as Record<string, unknown>[]).map((r) => normalize(r))
    return json({ items: rows }, 200)
  } catch {
    return json({ items: [] }, 200)
  }
}

function normalize(r: Record<string, unknown>): CatalogItem {
  let buttons: CatalogButton[] = []
  if (Array.isArray(r.buttons)) {
    buttons = r.buttons
      .map((b) => {
        const o = b as Record<string, unknown>
        const raw = o.action
        const action: CatalogButton['action'] =
          raw === 'cart' || raw === 'discuss' || raw === 'link' ? raw : 'cart'
        return { label: typeof o.label === 'string' ? o.label : '', action, href: typeof o.href === 'string' ? o.href : undefined }
      })
      .filter((b) => b.label)
  }
  return {
    id: String(r.id ?? ''),
    kind: r.kind === 'product' ? 'product' : 'service',
    slug: String(r.slug ?? ''),
    title: String(r.title ?? ''),
    description: typeof r.description === 'string' ? r.description : null,
    price: r.price == null ? null : Number(r.price),
    currency: typeof r.currency === 'string' && r.currency ? r.currency : 'BYN',
    buttons,
    media_type: r.media_type === 'photo' || r.media_type === 'video' ? r.media_type : null,
    media_url: typeof r.media_url === 'string' ? r.media_url : null,
    page: String(r.page ?? ''),
    sort: Number(r.sort ?? 0),
  }
}

function json(d: unknown, s: number) {
  return new Response(JSON.stringify(d), { status: s, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } })
}

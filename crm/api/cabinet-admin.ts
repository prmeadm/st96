/// <reference types="node" />
import { createClient } from '@supabase/supabase-js'
import { dbSchema } from '../server/env.js'
import { requireAdmin, json } from '../server/adminAuth.js'

export const config = { runtime: 'edge' }

type Db = any
type OrderRow = {
  id: string
  number: string
  client_id: string
  project_id: string | null
  kind: string
  payer_type: string
  status: string
  amount: number
  currency: string
  buyer: Record<string, unknown> | null
  meta: Record<string, unknown> | null
  invoice_id: string | null
  period_id: string | null
  created_at: string
  expires_at: string
}

export default async function handler(req: Request) {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return json({ error: 'Server not configured' }, 503)
  const denied = await requireAdmin(req, url, key)
  if (denied) return denied
  const db: Db = createClient(url, key, { db: { schema: dbSchema() }, auth: { persistSession: false, autoRefreshToken: false } })
  const action = new URL(req.url).searchParams.get('action') || 'orders'

  if (action === 'orders') {
    if (req.method !== 'GET') return json({ error: 'Method not allowed' }, 405)
    const { data, error } = await db
      .from('orders')
      .select('id, number, client_id, project_id, kind, payer_type, status, amount, currency, created_at, expires_at, clients(name, email, company), client_projects(title, domain)')
      .order('created_at', { ascending: false })
      .limit(100)
    if (error) return json({ error: 'orders_failed' }, 500)
    return json({ items: data ?? [] })
  }

  if (action === 'order') {
    if (req.method !== 'GET') return json({ error: 'Method not allowed' }, 405)
    const id = new URL(req.url).searchParams.get('id') || ''
    if (!id) return json({ error: 'id is required' }, 400)
    const { data: order } = await db.from('orders').select('*, clients(name, email, company, legal_name, unp), client_projects(title, domain)').eq('id', id).maybeSingle()
    if (!order) return json({ error: 'Not found' }, 404)
    const [{ data: items }, { data: docs }, { data: invoice }] = await Promise.all([
      db.from('order_items').select('*').eq('order_id', id),
      db.from('billing_documents').select('*').eq('order_id', id).order('created_at'),
      order.invoice_id ? db.from('invoices').select('*').eq('id', order.invoice_id).maybeSingle() : Promise.resolve({ data: null }),
    ])
    return json({ order, items: items ?? [], documents: docs ?? [], invoice: invoice ?? null })
  }

  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)
  let body: Record<string, unknown>
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    return json({ error: 'Invalid JSON' }, 400)
  }

  if (action === 'attach_project') {
    const orderId = typeof body.order_id === 'string' ? body.order_id : ''
    const projectId = typeof body.project_id === 'string' ? body.project_id : ''
    const projectTitle = typeof body.project_title === 'string' ? body.project_title.trim().slice(0, 200) : ''
    const domain = typeof body.domain === 'string' ? body.domain.trim().slice(0, 300) : ''
    if (!orderId || (!projectId && !projectTitle)) return json({ error: 'order_id and project_id or project_title are required' }, 400)
    const { data: orderRaw } = await db.from('orders').select('*').eq('id', orderId).maybeSingle()
    const order = orderRaw as OrderRow | null
    if (!order) return json({ error: 'Not found' }, 404)
    if (!['pending_payment', 'paid'].includes(order.status)) return json({ error: 'Only pending or paid orders can be linked' }, 409)

    let targetId = projectId
    let createdProjectId: string | null = null
    if (!targetId) {
      const { data: items } = await db.from('order_items').select('package_id').eq('order_id', order.id).eq('kind', 'package').maybeSingle()
      const packageId = (items as { package_id: string | null } | null)?.package_id ?? null
      const created = await db
        .from('client_projects')
        .insert({ client_id: order.client_id, title: projectTitle, domain: domain || null, package_id: packageId, status: 'active' })
        .select('id')
        .single()
      if (created.error || !created.data) return json({ error: 'Could not create project' }, 500)
      targetId = (created.data as { id: string }).id
      createdProjectId = targetId
    } else {
      const { data: project } = await db.from('client_projects').select('id, client_id').eq('id', targetId).maybeSingle()
      if (!project || (project as { client_id: string }).client_id !== order.client_id) {
        return json({ error: 'Project does not belong to the client' }, 422)
      }
    }
    const upd = await db.from('orders').update({ project_id: targetId }).eq('id', orderId).in('status', ['pending_payment', 'paid']).select('id').maybeSingle()
    if (upd.error || !upd.data) {
      if (createdProjectId) await db.from('client_projects').delete().eq('id', createdProjectId)
      return json({ error: 'Could not attach project' }, 409)
    }
    if (order.invoice_id) {
      const inv = await db.from('invoices').update({ project_id: targetId }).eq('id', order.invoice_id)
      if (inv.error) return json({ error: 'Could not attach project to invoice' }, 500)
    }
    return json({ ok: true, project_id: targetId })
  }

  if (action === 'confirm_payment' || action === 'void_order') {
    const orderId = typeof body.order_id === 'string' ? body.order_id : ''
    if (!orderId) return json({ error: 'order_id is required' }, 400)
    const jwt = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '')
    const { data: authUser } = await db.auth.getUser(jwt)
    const adminId = authUser?.user?.id ?? null
    const fn = action === 'confirm_payment' ? 'cabinet_confirm_payment' : 'cabinet_void_order'
    const { data, error } = await db.rpc(fn, { p_order_id: orderId, p_admin: adminId })
    if (error) return json({ error: 'transaction_failed' }, 500)
    const result = (data ?? {}) as { ok?: boolean; error?: string; idempotent?: boolean }
    if (result.error) {
      const status =
        result.error === 'not_found' ? 404
          : result.error === 'project_required' || result.error === 'package_not_found' ? 422
            : 409
      return json({ error: result.error }, status)
    }
    return json(result)
  }

  return json({ error: 'Unknown action' }, 404)
}
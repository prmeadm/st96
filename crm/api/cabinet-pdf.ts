/// <reference types="node" />
import { createClient } from '@supabase/supabase-js'
import { dbSchema } from '../server/env.js'
import { renderPdf, type PdfKind } from '../server/cabinet/pdf.js'

export const config = { runtime: 'nodejs' }

// Vercel Node-runtime функции не поддерживают web-сигнатуру Request/Response:
// обработчик должен быть классическим (req, res).
type NodeReq = { method?: string; url?: string; headers: Record<string, string | string[] | undefined> }
type NodeRes = { status: (code: number) => { json: (body: unknown) => void } }

const send = (res: NodeRes, status: number, body: unknown) => res.status(status).json(body)

const PKG_EN: Record<string, string> = { 'Базовый': 'Basic', 'Стандартный': 'Standard', 'Профессиональный': 'Professional', 'Ультимейт': 'Ultimate' }
const localizeTitle = (title: string, lang: string) => {
  if (lang === 'en') {
    if (PKG_EN[title]) return PKG_EN[title]
    const topup = title.match(/^Докупка (\d+) кредитов$/)
    if (topup) return 'Top-up ' + topup[1] + ' credits'
    if (title === 'Покупка пакета') return 'Package purchase'
    if (title === 'Докупка кредитов') return 'Credit top-up'
    if (title === 'Покупка пакета и кредитов') return 'Package and credits'
  }
  return title
}

export default async function handler(req: NodeReq, res: NodeRes) {
  if (req.method !== 'GET' && req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' })
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  const anon =
    process.env.SUPABASE_ANON_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key || !anon) return send(res, 503, { error: 'Server not configured' })
  const rawAuth = req.headers['authorization']
  const authHeader = Array.isArray(rawAuth) ? rawAuth[0] : rawAuth || ''
  const auth = authHeader.replace(/^Bearer\s+/i, '')
  if (!auth) return send(res, 401, { error: 'Unauthorized' })

  const userClient = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data: userData } = await userClient.auth.getUser(auth)
  if (!userData.user) return send(res, 401, { error: 'Unauthorized' })

  const db = createClient(url, key, { db: { schema: dbSchema() }, auth: { persistSession: false, autoRefreshToken: false } })
  const reqUrl = new URL(req.url || '', 'https://st96.by')
  const id = reqUrl.searchParams.get('id') || ''
  const queryLang = reqUrl.searchParams.get('lang')
  if (!id) return send(res, 400, { error: 'id is required' })

  const { data: acc } = await db.from('client_accounts').select('client_id').eq('user_id', userData.user.id).maybeSingle()
  if (!acc) return send(res, 403, { error: 'Not registered' })
  const clientId = (acc as { client_id: string }).client_id

  const { data: docRaw } = await db
    .from('billing_documents')
    .select('id, kind, number, status, amount, currency, file_path, order_id, issued_at')
    .eq('id', id)
    .eq('client_id', clientId)
    .maybeSingle()
  const doc = docRaw as { id: string; kind: PdfKind; number: string; status: string; amount: number; currency: string; file_path: string | null; order_id: string | null; issued_at: string | null } | null
  if (!doc) return send(res, 404, { error: 'Not found' })
  if (doc.status === 'void') return send(res, 409, { error: 'Document is void' })

  const bucket = 'documents'
  // Явный ?lang= требует перерисовки в нужном языке: не отдаём кэш, если язык задан.
  if (doc.file_path && doc.status === 'issued' && !queryLang) {
    const { data: signed } = await db.storage.from(bucket).createSignedUrl(doc.file_path, 60)
    if (signed) return send(res, 200, { url: signed.signedUrl, expires_in: 60 })
  }

  const [{ data: orderRaw }, { data: clientRaw }] = await Promise.all([
    doc.order_id
      ? db.from('orders').select('id, number, kind, payer_type, buyer, created_at, expires_at').eq('id', doc.order_id).maybeSingle()
      : Promise.resolve({ data: null }),
    db.from('clients').select('name, company, email, phone, legal_name, unp, legal_address, bank_details, language').eq('id', clientId).maybeSingle(),
  ])
  const order = orderRaw as {
    id: string
    number: string
    kind: string
    payer_type: 'individual' | 'legal'
    buyer: Record<string, unknown> | null
    created_at: string
    expires_at: string | null
  } | null
  const client = (clientRaw || {}) as {
    name: string | null
    company: string | null
    email: string | null
    phone: string | null
    legal_name: string | null
    unp: string | null
    legal_address: string | null
    bank_details: string | null
    language?: string | null
  }

  const language = queryLang === 'en' || queryLang === 'ru' ? queryLang : client.language === 'en' ? 'en' : 'ru'
  const rawItems = order
    ? ((await db.from('order_items').select('title, quantity, amount').eq('order_id', order.id)).data ?? []) as { title: string; quantity: number; amount: number }[]
    : [{ title: language === 'en' ? 'ST96 support services' : 'Услуги поддержки ST96', quantity: 1, amount: Number(doc.amount) }]
  const items = rawItems.map((i) => ({ ...i, title: localizeTitle(i.title, language) }))

  if (items.length > 10) return send(res, 409, { error: 'too_many_items', message: 'Document supports at most 10 items' })

  const bytes = await renderPdf({
    kind: doc.kind,
    number: doc.number,
    date: doc.issued_at ? new Date(doc.issued_at) : new Date(),
    orderNumber: order?.number || '—',
    amount: Number(doc.amount),
    currency: doc.currency || 'BYN',
    payerType: order?.payer_type || 'individual',
    buyer: (order?.buyer || {}) as Record<string, unknown>,
    client,
    items,
    expiresAt: order?.expires_at || null,
    language: language as 'ru' | 'en',
  })

  const path = 'clients/' + clientId + '/' + new Date().getFullYear() + '/' + doc.kind + '-' + doc.id + '.pdf'
  const { error: uploadError } = await db.storage.from(bucket).upload(path, bytes, { contentType: 'application/pdf', upsert: true })
  if (uploadError) return send(res, 500, { error: 'Could not store PDF' })
  await db
    .from('billing_documents')
    .update({ status: 'issued', file_path: path, issued_at: doc.issued_at || new Date().toISOString() })
    .eq('id', doc.id)
  const { data: signed } = await db.storage.from(bucket).createSignedUrl(path, 60)
  return send(res, 200, { url: signed?.signedUrl || null, expires_in: 60, number: doc.number })
}
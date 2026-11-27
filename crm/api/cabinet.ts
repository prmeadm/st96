/// <reference types="node" />
import { createClient } from '@supabase/supabase-js'
import { dbSchema } from '../server/env.js'
import type {
  CabinetBootstrap,
  CabinetDocument,
  CabinetOrder,
  CabinetProfile,
  CabinetProject,
  CabinetSummary,
  CabinetTask,
} from '../shared/cabinet.js'

export const config = { runtime: 'edge' }

const json = (d: unknown, s = 200) =>
  new Response(JSON.stringify(d), {
    status: s,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  })

// Supabase-клиент без сгенерированных типов БД: проект использует untyped-схему.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = any

const adminDb = (): Db | null => {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, {
    db: { schema: dbSchema() },
    auth: { persistSession: false, autoRefreshToken: false },
  } as any)
}

type AuthUser = { id: string; email?: string; user_metadata?: Record<string, unknown> }

async function getUser(req: Request): Promise<AuthUser | null> {
  const auth = req.headers.get('authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : ''
  if (!token) return null
  const url = process.env.SUPABASE_URL
  const anon =
    process.env.SUPABASE_ANON_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !anon) return null
  const client = createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data } = await client.auth.getUser(token)
  return (data.user as AuthUser | null) ?? null
}

type AccountRow = {
  user_id: string
  client_id: string
  email: string | null
  full_name: string | null
  avatar_url: string | null
  telegram_username: string | null
  telegram_linked_at: string | null
  onboarding_status: 'telegram_required' | 'complete'
}

type ClientRow = {
  id: string
  name: string | null
  phone: string | null
  company: string | null
  email: string | null
  language: 'ru' | 'en'
}

const toProfile = (acc: AccountRow, client: ClientRow): CabinetProfile => ({
  client_id: client.id,
  email: acc.email || client.email,
  full_name: acc.full_name,
  avatar_url: acc.avatar_url,
  name: client.name,
  phone: client.phone,
  company: client.company,
  language: client.language,
  telegram_username: acc.telegram_username,
  telegram_linked_at: acc.telegram_linked_at,
  onboarding_status: acc.onboarding_status,
})

async function loadAccount(db: Db, userId: string): Promise<AccountRow | null> {
  const { data } = await db.from('client_accounts').select('*').eq('user_id', userId).maybeSingle()
  return (data as AccountRow | null) ?? null
}

async function loadClient(db: Db, clientId: string): Promise<ClientRow | null> {
  const { data } = await db
    .from('clients')
    .select('id, name, phone, company, email, language')
    .eq('id', clientId)
    .maybeSingle()
  return (data as ClientRow | null) ?? null
}

async function bootstrap(db: Db, user: AuthUser): Promise<CabinetBootstrap> {
  const meta = user.user_metadata || {}
  const email = (user.email || '').toLowerCase() || null
  const fullName = (typeof meta.full_name === 'string' && meta.full_name) || (typeof meta.name === 'string' && meta.name) || null
  const avatar = typeof meta.avatar_url === 'string' ? meta.avatar_url : null

  let acc = await loadAccount(db, user.id)
  let created = false
  let linkedExisting = false

  if (!acc) {
    let client: ClientRow | null = null
    if (email) {
      // Точное сравнение lower(email): % и _ экранируем, иначе ILIKE — wildcard-инъекция.
      const pattern = email.replace(/[\\%_]/g, '\\$&')
      const { data: found } = await db
        .from('clients')
        .select('id, name, phone, company, email, language, created_at')
        .ilike('email', pattern)
      const candidates = ((found ?? []) as (ClientRow & { created_at?: string })[]).filter(
        (c) => (c.email ?? '').toLowerCase() === email,
      )
      if (candidates.length) {
        // Несколько карточек с одним email: выбираем с активными проектами, остальные — в client_merges.
        const ids = candidates.map((c) => c.id)
        const { data: projectsRaw } = await db
          .from('client_projects')
          .select('client_id')
          .in('client_id', ids)
          .eq('status', 'active')
        const active = new Map<string, number>()
        for (const p of (projectsRaw ?? []) as { client_id: string }[]) {
          active.set(p.client_id, (active.get(p.client_id) || 0) + 1)
        }
        candidates.sort((a, b) => {
          const byProjects = (active.get(b.id) || 0) - (active.get(a.id) || 0)
          if (byProjects) return byProjects
          return String(a.created_at || '').localeCompare(String(b.created_at || ''))
        })
        client = candidates[0]
        linkedExisting = true
        if (candidates.length > 1) {
          const merges = candidates.slice(1).map((c) => ({
            from_client_id: c.id,
            to_client_id: candidates[0].id,
            reason: 'email_duplicate',
            payload: { email, source: 'cabinet_bootstrap' },
          }))
          await db.from('client_merges').insert(merges)
        }
      }
    }
    if (!client) {
      const { data: inserted, error } = await db
        .from('clients')
        .insert({
          name: fullName || email,
          email,
          source: 'cabinet',
          language: 'ru',
          consent_at: new Date().toISOString(),
        })
        .select('id, name, phone, company, email, language')
        .single()
      if (error || !inserted) throw new Error('client_create_failed')
      client = inserted as ClientRow
      created = true
    }
    const { error: accError } = await db.from('client_accounts').insert({
      user_id: user.id,
      client_id: client.id,
      email,
      full_name: fullName,
      avatar_url: avatar,
      onboarding_status: 'telegram_required',
    })
    if (accError) throw new Error('account_create_failed')
    await db.from('clients').update({ last_seen_at: new Date().toISOString() }).eq('id', client.id)
    acc = (await loadAccount(db, user.id)) as AccountRow
    return {
      profile: toProfile(acc, client),
      created,
      linked_existing: linkedExisting,
    }
  }

  await db
    .from('client_accounts')
    .update({
      email: email || acc.email,
      full_name: fullName || acc.full_name,
      avatar_url: avatar || acc.avatar_url,
      last_login_at: new Date().toISOString(),
    })
    .eq('user_id', user.id)
  await db.from('clients').update({ last_seen_at: new Date().toISOString() }).eq('id', acc.client_id)
  const client = await loadClient(db, acc.client_id)
  if (!client) throw new Error('client_not_found')
  return { profile: toProfile(acc, client), created, linked_existing: linkedExisting }
}

async function loadProfile(db: Db, userId: string): Promise<CabinetProfile | null> {
  const acc = await loadAccount(db, userId)
  if (!acc) return null
  const client = await loadClient(db, acc.client_id)
  return client ? toProfile(acc, client) : null
}

type ProjectRow = {
  id: string
  title: string | null
  domain: string | null
  platform: string | null
  public_url: string | null
  package_id: string | null
}

type PeriodRow = {
  project_id: string
  package_id: string | null
  period_end: string
  credits_limit: number | null
  credits_used: number | null
}

async function summary(db: Db, profile: CabinetProfile): Promise<CabinetSummary> {
  const clientId = profile.client_id

  const { data: projectsRaw } = await db
    .from('client_projects')
    .select('id, title, domain, platform, public_url, package_id')
    .eq('client_id', clientId)
    .eq('status', 'active')
    .order('created_at', { ascending: true })
  const projects = (projectsRaw ?? []) as ProjectRow[]

  const { data: periodsRaw } = projects.length
    ? await db
        .from('package_periods')
        .select('project_id, package_id, period_end, credits_limit, credits_used')
        .in('project_id', projects.map((p) => p.id))
        .eq('status', 'active')
    : { data: [] as PeriodRow[] }
  const periods = (periodsRaw ?? []) as PeriodRow[]
  const periodByProject = new Map<string, PeriodRow>()
  for (const p of periods) if (!periodByProject.has(p.project_id)) periodByProject.set(p.project_id, p)

  const packageIds = Array.from(
    new Set([
      ...projects.map((p) => p.package_id).filter(Boolean),
      ...periods.map((p) => p.package_id).filter(Boolean),
    ] as string[]),
  )
  const { data: packagesRaw } = packageIds.length
    ? await db.from('packages').select('id, code, title').in('id', packageIds)
    : { data: [] as { id: string; code: string; title: string }[] }
  const packages = new Map(
    ((packagesRaw ?? []) as { id: string; code: string; title: string }[]).map((p) => [p.id, p]),
  )

  const projectItems: CabinetProject[] = projects.map((p) => {
    const period = periodByProject.get(p.id)
    const pkg = packages.get((period?.package_id || p.package_id) || '')
    return {
      id: p.id,
      title: p.title,
      domain: p.domain,
      platform: p.platform,
      public_url: p.public_url,
      package_code: pkg?.code ?? null,
      package_title: pkg?.title ?? null,
      period_end: period?.period_end ?? null,
      credits_left: Math.max(0, Number(period?.credits_limit ?? 0) - Number(period?.credits_used ?? 0)),
    }
  })

  const { data: topupsRaw } = await db
    .from('client_credit_topups')
    .select('credits, credits_used')
    .eq('client_id', clientId)
  const topupLeft = ((topupsRaw ?? []) as { credits: number; credits_used: number }[]).reduce(
    (sum, t) => sum + Math.max(0, Number(t.credits) - Number(t.credits_used)),
    0,
  )
  const periodLimit = periods.reduce((sum, p) => sum + Number(p.credits_limit ?? 0), 0)
  const periodLeft = projectItems.reduce((sum, p) => sum + p.credits_left, 0)
  const nearestEnd = projectItems
    .map((p) => p.period_end)
    .filter((d): d is string => !!d)
    .sort()[0] ?? null

  const { data: tasksRaw } = await db
    .from('support_jobs')
    .select('id, project_id, request_text, status, st_credits, created_at')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .limit(5)
  const titleById = new Map(projects.map((p) => [p.id, p.title]))
  const tasks: CabinetTask[] = ((tasksRaw ?? []) as {
    id: string
    project_id: string | null
    request_text: string
    status: string
    st_credits: number | null
    created_at: string
  }[]).map((t) => ({
    id: t.id,
    project_id: t.project_id,
    project_title: t.project_id ? titleById.get(t.project_id) ?? null : null,
    request_text: t.request_text,
    status: t.status,
    st_credits: Number(t.st_credits ?? 0),
    created_at: t.created_at,
  }))

  const { data: ordersRaw } = await db
    .from('orders')
    .select('id, number, kind, status, amount, currency, payer_type, created_at, project_id')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .limit(5)
  const orderRows = (ordersRaw ?? []) as {
    id: string
    number: string
    kind: string
    status: string
    amount: number
    currency: string
    payer_type: string
    created_at: string
    project_id: string | null
  }[]
  const orderIds = orderRows.map((o) => o.id)
  const { data: docCountsRaw } = orderIds.length
    ? await db.from('billing_documents').select('order_id').in('order_id', orderIds)
    : { data: [] as { order_id: string | null }[] }
  const docCounts = new Map<string, number>()
  for (const d of (docCountsRaw ?? []) as { order_id: string | null }[]) {
    if (d.order_id) docCounts.set(d.order_id, (docCounts.get(d.order_id) || 0) + 1)
  }
  const projectTitleById = new Map(projects.map((p) => [p.id, p.title]))
  const orders: CabinetOrder[] = orderRows.map((o) => ({
    id: o.id,
    number: o.number,
    kind: o.kind,
    status: o.status,
    amount: Number(o.amount),
    currency: o.currency,
    payer_type: o.payer_type,
    created_at: o.created_at,
    project_title: o.project_id ? projectTitleById.get(o.project_id) ?? null : null,
    documents_count: docCounts.get(o.id) || 0,
  }))

  const { data: docsRaw } = await db
    .from('billing_documents')
    .select('id, kind, number, status, amount, currency, issued_at, order_id, file_path, meta')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .limit(5)
  const docs: CabinetDocument[] = ((docsRaw ?? []) as {
    id: string
    kind: CabinetDocument['kind']
    number: string
    status: CabinetDocument['status']
    amount: number
    currency: string
    issued_at: string | null
    order_id: string | null
    file_path: string | null
    meta: Record<string, unknown> | null
  }[]).map((d) => ({
    id: d.id,
    kind: d.kind,
    number: d.number,
    status: d.status,
    amount: Number(d.amount),
    currency: d.currency,
    issued_at: d.issued_at,
    order_id: d.order_id,
    order_number: orderRows.find((o) => o.id === d.order_id)?.number ?? null,
    file_available: d.status !== 'void',
    source: d.meta?.legacy ? 'legacy' : 'document',
  }))

  const { count: cartCount } = await db
    .from('cart_items')
    .select('id', { count: 'exact', head: true })
    .eq('client_id', clientId)

  const alerts: string[] = []
  if (profile.onboarding_status !== 'complete') alerts.push('telegram_required')
  if (!projectItems.some((p) => !!p.period_end)) alerts.push('no_package')
  if (periodLimit > 0 && periodLeft < periodLimit * 0.2) alerts.push('low_credits')
  if (orders.some((o) => o.status === 'pending_payment')) alerts.push('pending_payment')

  return {
    profile,
    projects: projectItems,
    credits: {
      period_left: periodLeft,
      topup_left: topupLeft,
      total_left: periodLeft + topupLeft,
      period_end: nearestEnd,
    },
    tasks_recent: tasks,
    orders_recent: orders,
    documents_recent: docs,
    cart_count: cartCount ?? 0,
    alerts,
  }
}


type CartRow = {
  id: string
  kind: 'package' | 'topup' | 'service'
  package_id: string | null
  catalog_item_id: string | null
  credits: number | null
  project_id: string | null
  title: string
  unit_price: number
  currency: string
  quantity: number
}

type CartView = {
  items: (CartRow & { amount: number; project_title: string | null })[]
  total: number
  currency: string
}

async function cartView(db: Db, clientId: string): Promise<CartView> {
  const { data } = await db
    .from('cart_items')
    .select('id, kind, package_id, catalog_item_id, credits, project_id, title, unit_price, currency, quantity')
    .eq('client_id', clientId)
    .order('created_at', { ascending: true })
  const rows = (data ?? []) as CartRow[]
  const projectIds = Array.from(new Set(rows.map((r) => r.project_id).filter((id): id is string => !!id)))
  const { data: projects } = projectIds.length
    ? await db.from('client_projects').select('id, title').in('id', projectIds)
    : { data: [] as { id: string; title: string | null }[] }
  const titles = new Map(((projects ?? []) as { id: string; title: string | null }[]).map((p) => [p.id, p.title]))
  const items = rows.map((r) => ({
    ...r,
    unit_price: Number(r.unit_price),
    amount: Number(r.unit_price) * Number(r.quantity),
    project_title: r.project_id ? titles.get(r.project_id) ?? null : null,
  }))
  return { items, total: items.reduce((s, i) => s + i.amount, 0), currency: items[0]?.currency || 'BYN' }
}


async function syncCartPrices(db: Db, clientId: string): Promise<CartView> {
  const view = await cartView(db, clientId)
  const rate = await topupRate(db)
  for (const item of view.items) {
    let expected = item.unit_price
    if (item.kind === 'package' && item.package_id) {
      const { data: pkg } = await db.from('packages').select('price').eq('id', item.package_id).maybeSingle()
      const price = Number((pkg as { price?: number | null } | null)?.price)
      if (Number.isFinite(price)) expected = price
    } else if (item.kind === 'topup' && item.credits) {
      expected = Math.round(Number(item.credits) * rate * 100) / 100
    } else if (item.kind === 'service' && item.catalog_item_id) {
      const { data: cat } = await db.from('catalog_items').select('price').eq('id', item.catalog_item_id).maybeSingle()
      const price = Number((cat as { price?: number | null } | null)?.price)
      if (Number.isFinite(price)) expected = price
    }
    if (expected !== item.unit_price) {
      await db.from('cart_items').update({ unit_price: expected }).eq('id', item.id)
    }
  }
  return cartView(db, clientId)
}

async function topupRate(db: Db): Promise<number> {
  const { data } = await db.from('app_settings').select('value').eq('key', 'support.topup_rate').maybeSingle()
  const raw = (data as { value?: unknown } | null)?.value
  const n = Number(typeof raw === 'string' ? raw.replace(/"/g, '') : raw)
  return Number.isFinite(n) && n > 0 ? n : 0.3
}

async function clientHasProjects(db: Db, clientId: string): Promise<boolean> {
  const { count } = await db
    .from('client_projects')
    .select('id', { count: 'exact', head: true })
    .eq('client_id', clientId)
    .eq('status', 'active')
  return (count ?? 0) > 0
}

async function assertProject(db: Db, clientId: string, projectId: string): Promise<boolean> {
  const { data } = await db
    .from('client_projects')
    .select('id')
    .eq('id', projectId)
    .eq('client_id', clientId)
    .maybeSingle()
  return !!data
}

export default async function handler(req: Request) {
  const url = new URL(req.url)
  const action = url.searchParams.get('action') || 'bootstrap'
  const readActions = new Set(['bootstrap', 'summary', 'profile', 'tasks', 'projects', 'orders', 'order', 'documents', 'document_url', 'cart', 'telegram_status'])
  if (readActions.has(action)) {
    if (req.method !== 'GET' && req.method !== 'POST') return json({ error: { code: 'method_not_allowed', message: 'Method not allowed' } }, 405)
  } else if (req.method !== 'POST') {
    return json({ error: { code: 'method_not_allowed', message: 'Method not allowed' } }, 405)
  }

  const db = adminDb()
  if (!db) return json({ error: { code: 'not_configured', message: 'Supabase is not configured' } }, 503)

  try {
    const user = await getUser(req)
    if (!user) return json({ error: { code: 'auth_required', message: 'Sign in with Google' } }, 401)

    if (action === 'bootstrap') return json(await bootstrap(db, user))

    if (action === 'summary') {
      const profile = await loadProfile(db, user.id)
      if (!profile) return json({ error: { code: 'not_registered', message: 'Call bootstrap first' } }, 409)
      return json(await summary(db, profile))
    }

    if (action === 'profile') {
      const profile = await loadProfile(db, user.id)
      if (!profile) return json({ error: { code: 'not_registered', message: 'Call bootstrap first' } }, 409)
      return json({ profile })
    }



    if (action === 'tasks') {
      const profile = await loadProfile(db, user.id)
      if (!profile) return json({ error: { code: 'not_registered', message: 'Call bootstrap first' } }, 409)
      const projectId = url.searchParams.get('project_id')
      const status = url.searchParams.get('status')
      const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit') || 20)))
      const offset = Math.max(0, Number(url.searchParams.get('offset') || 0))
      let q = db
        .from('support_jobs')
        .select('id, project_id, request_text, status, st_credits, created_at, finished_at', { count: 'exact' })
        .eq('client_id', profile.client_id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)
      if (projectId) q = q.eq('project_id', projectId)
      if (status) q = q.eq('status', status)
      const { data, count } = await q
      const rows = (data ?? []) as { id: string; project_id: string | null; request_text: string; status: string; st_credits: number; created_at: string; finished_at: string | null }[]
      const ids = Array.from(new Set(rows.map((r) => r.project_id).filter((id): id is string => !!id)))
      const { data: projects } = ids.length ? await db.from('client_projects').select('id, title').in('id', ids) : { data: [] as { id: string; title: string | null }[] }
      const titles = new Map(((projects ?? []) as { id: string; title: string | null }[]).map((p) => [p.id, p.title]))
      return json({
        items: rows.map((r) => ({
          ...r,
          st_credits: Number(r.st_credits ?? 0),
          project_title: r.project_id ? titles.get(r.project_id) ?? null : null,
        })),
        total: count ?? rows.length,
      })
    }

    if (action === 'projects') {
      const profile = await loadProfile(db, user.id)
      if (!profile) return json({ error: { code: 'not_registered', message: 'Call bootstrap first' } }, 409)
      const { data: rows } = await db
        .from('client_projects')
        .select('id, title, domain, platform, public_url, status, package_id, auto_renew, created_at')
        .eq('client_id', profile.client_id)
        .order('created_at', { ascending: true })
      const projects = (rows ?? []) as { id: string; title: string | null; domain: string | null; platform: string | null; public_url: string | null; status: string; package_id: string | null; auto_renew: boolean; created_at: string }[]
      const projectIds = projects.map((p) => p.id)
      const { data: periods } = projectIds.length
        ? await db.from('package_periods').select('project_id, period_end, credits_limit, credits_used, status, package_id').in('project_id', projectIds).eq('status', 'active')
        : { data: [] as { project_id: string; period_end: string; credits_limit: number | null; credits_used: number | null; status: string; package_id: string | null }[] }
      const periodRows = (periods ?? []) as { project_id: string; period_end: string; credits_limit: number | null; credits_used: number | null; status: string; package_id: string | null }[]
      const packageIds = Array.from(new Set([...projects.map((p) => p.package_id), ...periodRows.map((p) => p.package_id)].filter((id): id is string => !!id)))
      const { data: pkgs } = packageIds.length ? await db.from('packages').select('id, code, title').in('id', packageIds) : { data: [] as { id: string; code: string; title: string }[] }
      const pkgMap = new Map(((pkgs ?? []) as { id: string; code: string; title: string }[]).map((p) => [p.id, p]))
      const periodMap = new Map(periodRows.map((p) => [p.project_id, p]))
      return json({
        items: projects.map((p) => {
          const period = periodMap.get(p.id)
          const pkg = pkgMap.get(period?.package_id || p.package_id || '')
          return {
            ...p,
            package_code: pkg?.code ?? null,
            package_title: pkg?.title ?? null,
            period_end: period?.period_end ?? null,
            credits_left: Math.max(0, Number(period?.credits_limit ?? 0) - Number(period?.credits_used ?? 0)),
            credits_limit: Number(period?.credits_limit ?? 0),
          }
        }),
      })
    }

    if (action === 'orders') {
      const profile = await loadProfile(db, user.id)
      if (!profile) return json({ error: { code: 'not_registered', message: 'Call bootstrap first' } }, 409)
      const status = url.searchParams.get('status')
      let q = db
        .from('orders')
        .select('id, number, kind, status, amount, currency, payer_type, created_at, expires_at, project_id')
        .eq('client_id', profile.client_id)
        .order('created_at', { ascending: false })
      if (status) q = q.eq('status', status)
      const { data } = await q
      const rows = (data ?? []) as { id: string; number: string; kind: string; status: string; amount: number; currency: string; payer_type: string; created_at: string; expires_at: string; project_id: string | null }[]
      const ids = rows.map((o) => o.id)
      const { data: docs } = ids.length ? await db.from('billing_documents').select('order_id').in('order_id', ids) : { data: [] as { order_id: string | null }[] }
      const counts = new Map<string, number>()
      for (const d of (docs ?? []) as { order_id: string | null }[]) if (d.order_id) counts.set(d.order_id, (counts.get(d.order_id) || 0) + 1)
      const projectIds = Array.from(new Set(rows.map((o) => o.project_id).filter((id): id is string => !!id)))
      const { data: projects } = projectIds.length ? await db.from('client_projects').select('id, title').in('id', projectIds) : { data: [] as { id: string; title: string | null }[] }
      const titles = new Map(((projects ?? []) as { id: string; title: string | null }[]).map((p) => [p.id, p.title]))
      return json({
        items: rows.map((o) => ({
          ...o,
          amount: Number(o.amount),
          project_title: o.project_id ? titles.get(o.project_id) ?? null : null,
          documents_count: counts.get(o.id) || 0,
        })),
      })
    }

    if (action === 'order') {
      const profile = await loadProfile(db, user.id)
      if (!profile) return json({ error: { code: 'not_registered', message: 'Call bootstrap first' } }, 409)
      const id = url.searchParams.get('id') || ''
      const { data: order } = await db
        .from('orders')
        .select('id, number, kind, status, amount, currency, payer_type, buyer, created_at, expires_at, paid_at, project_id')
        .eq('id', id)
        .eq('client_id', profile.client_id)
        .maybeSingle()
      if (!order) return json({ error: { code: 'not_found', message: 'Order not found' } }, 404)
      const { data: items } = await db.from('order_items').select('id, kind, title, unit_price, quantity, amount, credits').eq('order_id', id)
      const { data: documents } = await db.from('billing_documents').select('id, kind, number, status, amount, currency, issued_at').eq('order_id', id)
      return json({ order, items: items ?? [], documents: documents ?? [] })
    }

    if (action === 'documents') {
      const profile = await loadProfile(db, user.id)
      if (!profile) return json({ error: { code: 'not_registered', message: 'Call bootstrap first' } }, 409)
      const kind = url.searchParams.get('kind')
      const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit') || 50)))
      const offset = Math.max(0, Number(url.searchParams.get('offset') || 0))
      let q = db
        .from('billing_documents')
        .select('id, kind, number, status, amount, currency, issued_at, order_id, file_path, meta, created_at', { count: 'exact' })
        .eq('client_id', profile.client_id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)
      if (kind) q = q.eq('kind', kind)
      const { data, count } = await q
      const rows = (data ?? []) as { id: string; kind: 'invoice' | 'act' | 'receipt'; number: string; status: 'draft' | 'issued' | 'void'; amount: number; currency: string; issued_at: string | null; order_id: string | null; file_path: string | null; meta: Record<string, unknown> | null; created_at: string }[]
      const orderIds = Array.from(new Set(rows.map((d) => d.order_id).filter((id): id is string => !!id)))
      const { data: orders } = orderIds.length ? await db.from('orders').select('id, number').in('id', orderIds) : { data: [] as { id: string; number: string }[] }
      const orderNumbers = new Map(((orders ?? []) as { id: string; number: string }[]).map((o) => [o.id, o.number]))
      return json({
        items: rows.map((d) => ({
          id: d.id,
          kind: d.kind,
          number: d.number,
          status: d.status,
          amount: Number(d.amount),
          currency: d.currency,
          issued_at: d.issued_at,
          order_id: d.order_id,
          order_number: d.order_id ? orderNumbers.get(d.order_id) ?? null : null,
          file_available: d.status !== 'void',
          source: d.meta?.legacy ? 'legacy' : 'document',
        })),
        total: count ?? rows.length,
      })
    }

    if (action === 'document_url') {
      const profile = await loadProfile(db, user.id)
      if (!profile) return json({ error: { code: 'not_registered', message: 'Call bootstrap first' } }, 409)
      const id = url.searchParams.get('id') || ''
      const { data: doc } = await db
        .from('billing_documents')
        .select('id, file_path, meta')
        .eq('id', id)
        .eq('client_id', profile.client_id)
        .maybeSingle()
      if (!doc) return json({ error: { code: 'not_found', message: 'Document not found' } }, 404)
      const d = doc as { file_path: string | null; meta: Record<string, unknown> | null }
      if (d.file_path) {
        const { data: signed, error } = await db.storage.from('documents').createSignedUrl(d.file_path, 60)
        if (error || !signed) return json({ error: { code: 'storage_failed', message: 'Could not sign document' } }, 500)
        return json({ url: signed.signedUrl, expires_in: 60 })
      }
      const legacy = typeof d.meta?.legacy_url === 'string' ? d.meta.legacy_url : null
      if (legacy) return json({ url: legacy, expires_in: 0 })
      return json({ error: { code: 'file_pending', message: 'Document file is not ready yet' } }, 409)
    }

    if (action === 'cart') {
      const profile = await loadProfile(db, user.id)
      if (!profile) return json({ error: { code: 'not_registered', message: 'Call bootstrap first' } }, 409)
      return json(await syncCartPrices(db, profile.client_id))
    }

    if (action === 'cart_add' || action === 'cart_update' || action === 'cart_remove') {
      const profile = await loadProfile(db, user.id)
      if (!profile) return json({ error: { code: 'not_registered', message: 'Call bootstrap first' } }, 409)
      const body = (await req.json().catch(() => ({}))) as Record<string, unknown>
      const clientId = profile.client_id

      if (action === 'cart_remove') {
        const id = typeof body.id === 'string' ? body.id : ''
        if (!id) return json({ error: { code: 'bad_request', message: 'id is required' } }, 400)
        await db.from('cart_items').delete().eq('id', id).eq('client_id', clientId)
        return json(await cartView(db, clientId))
      }

      if (action === 'cart_update') {
        const id = typeof body.id === 'string' ? body.id : ''
        const quantity = Number(body.quantity)
        if (!id || !Number.isInteger(quantity) || quantity < 1 || quantity > 10) {
          return json({ error: { code: 'bad_request', message: 'id and quantity 1..10 are required' } }, 400)
        }
        const { data: item } = await db
          .from('cart_items')
          .select('id, kind')
          .eq('id', id)
          .eq('client_id', clientId)
          .maybeSingle()
        if (!item) return json({ error: { code: 'not_found', message: 'Cart item not found' } }, 404)
        const next = (item as { kind: string }).kind === 'package' ? 1 : quantity
        await db.from('cart_items').update({ quantity: next }).eq('id', id).eq('client_id', clientId)
        return json(await cartView(db, clientId))
      }

      // cart_add
      const kind = body.kind === 'topup' ? 'topup' : body.kind === 'package' ? 'package' : body.kind === 'service' ? 'service' : null
      if (!kind) return json({ error: { code: 'bad_request', message: 'kind must be package, topup or service' } }, 400)
      const projectId = typeof body.project_id === 'string' && body.project_id ? body.project_id : null
      if (projectId && !(await assertProject(db, clientId, projectId))) {
        return json({ error: { code: 'project_forbidden', message: 'Project does not belong to the client' } }, 403)
      }

      if (kind === 'package') {
        const code = typeof body.package_code === 'string' ? body.package_code : ''
        const { data: pkg } = await db
          .from('packages')
          .select('id, code, title, credits, price, currency, is_active')
          .eq('code', code)
          .maybeSingle()
        const p = pkg as { id: string; title: string; price: number | null; currency: string; is_active: boolean } | null
        if (!p || !p.is_active) return json({ error: { code: 'not_found', message: 'Package not found' } }, 404)
        if (p.price == null) return json({ error: { code: 'price_missing', message: 'Package has no price' } }, 409)
        if ((await clientHasProjects(db, clientId)) && !projectId) {
          return json({ error: { code: 'project_required', message: 'Choose a project for the package' } }, 409)
        }
        // один пакет в корзине: новый заменяет прежний
        await db.from('cart_items').delete().eq('client_id', clientId).eq('kind', 'package')
        const { error } = await db.from('cart_items').insert({
          client_id: clientId,
          kind: 'package',
          package_id: p.id,
          project_id: projectId,
          title: p.title,
          unit_price: Number(p.price),
          currency: p.currency || 'BYN',
          quantity: 1,
        })
        if (error) return json({ error: { code: 'cart_failed', message: 'Could not add package' } }, 500)
        return json(await cartView(db, clientId))
      }

      if (kind === 'service') {
        const slug = typeof body.slug === 'string' ? body.slug.trim().slice(0, 100) : ''
        const fallbackTitle = typeof body.title === 'string' ? body.title.trim().slice(0, 200) : ''
        let title = fallbackTitle
        let price = 0
        let catalogItemId: string | null = null
        if (slug) {
          const { data: cat } = await db
            .from('catalog_items')
            .select('id, title, price, currency')
            .eq('slug', slug)
            .eq('active', true)
            .maybeSingle()
          if (cat) {
            const c = cat as { id: string; title: string | null; price: number | null; currency: string | null }
            catalogItemId = c.id
            title = c.title || fallbackTitle
            price = c.price == null ? 0 : Number(c.price)
          }
        }
        if (!title) return json({ error: { code: 'bad_request', message: 'slug or title is required' } }, 400)
        if (catalogItemId) {
          await db.from('cart_items').delete().eq('client_id', clientId).eq('kind', 'service').eq('catalog_item_id', catalogItemId)
        } else {
          await db.from('cart_items').delete().eq('client_id', clientId).eq('kind', 'service').eq('title', title).is('catalog_item_id', null)
        }
        const { error } = await db.from('cart_items').insert({
          client_id: clientId,
          kind: 'service',
          catalog_item_id: catalogItemId,
          project_id: null,
          title,
          unit_price: price,
          currency: 'BYN',
          quantity: 1,
        })
        if (error) return json({ error: { code: 'cart_failed', message: 'Could not add service' } }, 500)
        return json(await cartView(db, clientId))
      }

      const creditsCount = Number(body.credits)
      if (!Number.isInteger(creditsCount) || creditsCount < 100 || creditsCount > 10000) {
        return json({ error: { code: 'bad_request', message: 'credits must be an integer between 100 and 10000' } }, 400)
      }
      const rate = await topupRate(db)
      const { error } = await db.from('cart_items').insert({
        client_id: clientId,
        kind: 'topup',
        credits: creditsCount,
        project_id: projectId,
        title: 'Докупка ' + creditsCount + ' кредитов',
        unit_price: Math.round(creditsCount * rate * 100) / 100,
        currency: 'BYN',
        quantity: 1,
      })
      if (error) return json({ error: { code: 'cart_failed', message: 'Could not add credits' } }, 500)
      return json(await cartView(db, clientId))
    }


    if (action === 'checkout') {
      const profile = await loadProfile(db, user.id)
      if (!profile) return json({ error: { code: 'not_registered', message: 'Call bootstrap first' } }, 409)
      const body = (await req.json().catch(() => ({}))) as Record<string, unknown>
      const rawKey = typeof body.idempotency_key === 'string' ? body.idempotency_key.trim().slice(0, 100) : ''
      // Повтор после успешного заказа: корзина уже пуста, поэтому ключ проверяем до всех проверок корзины.
      if (rawKey) {
        const { data: existingOrder } = await db
          .from('orders')
          .select('id, number, amount, currency, status, expires_at, created_at')
          .eq('client_id', profile.client_id)
          .eq('idempotency_key', rawKey)
          .maybeSingle()
        if (existingOrder) return json({ order: existingOrder, idempotent: true })
      }
      if (profile.onboarding_status !== 'complete') {
        return json({ error: { code: 'telegram_required', message: 'Link Telegram before checkout' } }, 403)
      }
      const payerType = body.payer_type === 'legal' ? 'legal' : body.payer_type === 'individual' ? 'individual' : null
      if (!payerType) return json({ error: { code: 'bad_request', message: 'payer_type must be individual or legal' } }, 400)
      const cart = await cartView(db, profile.client_id)
      if (!cart.items.length) return json({ error: { code: 'cart_empty', message: 'Cart is empty' } }, 409)
      if (cart.items.length > 10) {
        return json({ error: { code: 'too_many_items', message: 'A document supports at most 10 order items' } }, 409)
      }

      const packageItem = cart.items.find((i) => i.kind === 'package')
      const topupItems = cart.items.filter((i) => i.kind === 'topup')
      const serviceItems = cart.items.filter((i) => i.kind === 'service')
      const projectId = packageItem?.project_id || (typeof body.project_id === 'string' ? body.project_id : null)

      if (projectId && !(await assertProject(db, profile.client_id, projectId))) {
        return json({ error: { code: 'project_forbidden', message: 'Project does not belong to the client' } }, 403)
      }
      if (packageItem && !projectId && (await clientHasProjects(db, profile.client_id))) {
        return json({ error: { code: 'project_required', message: 'Choose a project for the package' } }, 409)
      }
      // Все позиции с проектом должны относиться к одному проекту.
      const projectIds = Array.from(new Set(cart.items.map((i) => i.project_id).filter((id): id is string => !!id)))
      if (projectIds.length > 1 || (projectIds.length === 1 && projectId && projectIds[0] !== projectId)) {
        return json({ error: { code: 'project_mismatch', message: 'All cart items must belong to one project' } }, 409)
      }

      // Пересчёт по актуальным ценам: старые цены в корзине не оплачиваем.
      const priceChanges: { title: string; old_price: number; new_price: number }[] = []
      for (const item of cart.items) {
        let expected = item.unit_price
        if (item.kind === 'package' && item.package_id) {
          const { data: pkg } = await db.from('packages').select('price').eq('id', item.package_id).maybeSingle()
          const price = Number((pkg as { price?: number | null } | null)?.price)
          if (Number.isFinite(price) && price !== item.unit_price) expected = price
        } else if (item.kind === 'topup' && item.credits) {
          expected = Math.round(Number(item.credits) * (await topupRate(db)) * 100) / 100
        } else if (item.kind === 'service' && item.catalog_item_id) {
          const { data: cat } = await db.from('catalog_items').select('price').eq('id', item.catalog_item_id).maybeSingle()
          const price = Number((cat as { price?: number | null } | null)?.price)
          if (Number.isFinite(price) && price !== item.unit_price) expected = price
        }
        if (expected !== item.unit_price) {
          priceChanges.push({ title: item.title, old_price: item.unit_price, new_price: expected })
        }
      }
      if (priceChanges.length) {
        return json({ error: { code: 'price_changed', message: 'Prices changed, refresh the cart', items: priceChanges } }, 409)
      }

      const total = cart.items.reduce((s, i) => s + Number(i.unit_price) * Number(i.quantity), 0)

      if (projectId) {
        const { count: openCount } = await db
          .from('orders')
          .select('id', { count: 'exact', head: true })
          .eq('client_id', profile.client_id)
          .eq('project_id', projectId)
          .eq('status', 'pending_payment')
        if ((openCount ?? 0) > 0) {
          return json({ error: { code: 'order_exists', message: 'There is already an open order for this project' } }, 409)
        }
      }

      const buyer = (typeof body.buyer === 'object' && body.buyer ? body.buyer : {}) as Record<string, unknown>
      const maxLen = (v: unknown, n: number) => typeof v === 'string' ? v.trim().slice(0, n) : ''
      if (payerType === 'legal') {
        const { data: clientRaw } = await db
          .from('clients')
          .select('legal_name, unp, legal_address, bank_details')
          .eq('id', profile.client_id)
          .maybeSingle()
        const c = (clientRaw || {}) as Record<string, unknown>
        const legalName = maxLen(buyer.legal_name || c.legal_name, 200)
        const unp = maxLen(buyer.unp || c.unp, 9)
        const address = maxLen(buyer.legal_address || c.legal_address, 500)
        const bank = maxLen(buyer.bank_details || c.bank_details, 500)
        if (!legalName || !/^\d{9}$/.test(unp) || !address || !bank) {
          return json({ error: { code: 'legal_requisites_required', message: 'Fill legal name, UNP, address and bank details' } }, 422)
        }
        buyer.legal_name = legalName
        buyer.unp = unp
        buyer.legal_address = address
        buyer.bank_details = bank
        const legalRes = await db
          .from('clients')
          .update({ client_kind: 'legal', legal_name: legalName, unp, legal_address: address, bank_details: bank })
          .eq('id', profile.client_id)
        if (legalRes.error) return json({ error: { code: 'profile_save_failed', message: 'Could not save legal requisites' } }, 500)
      }

      const kind = packageItem && (topupItems.length || serviceItems.length) ? 'mixed' : packageItem ? 'package' : topupItems.length && serviceItems.length ? 'mixed' : topupItems.length ? 'topup' : 'service'
      const idempotencyKey = rawKey || crypto.randomUUID()
      const { data: deadlineRaw } = await db.from('app_settings').select('value').eq('key', 'support.payment_deadline_days').maybeSingle()
      const deadlineValue = Number(String((deadlineRaw as { value?: unknown } | null)?.value || '5').replace(/"/g, ''))
      const deadlineDays = Number.isFinite(deadlineValue) ? Math.min(30, Math.max(1, deadlineValue)) : 5
      const expiresAt = new Date(Date.now() + deadlineDays * 24 * 3600 * 1000).toISOString()

      const { data: created, error: orderError } = await db
        .from('orders')
        .insert({
          client_id: profile.client_id,
          project_id: projectId,
          kind,
          payer_type: payerType,
          status: 'pending_payment',
          amount: total,
          currency: cart.currency,
          buyer,
          meta: {
            source: 'cabinet',
            cart: cart.items.map((i) => ({
              kind: i.kind,
              title: i.title,
              amount: i.amount,
              credits: i.credits,
              package_id: i.package_id,
            })),
          },
          idempotency_key: idempotencyKey,
          expires_at: expiresAt,
        })
        .select('id, number, amount, currency, status, expires_at, created_at')
        .single()

      if (orderError) {
        if (orderError.code === '23505') {
          const { data: existing } = await db
            .from('orders')
            .select('id, number, amount, currency, status, expires_at, created_at')
            .eq('client_id', profile.client_id)
            .eq('idempotency_key', idempotencyKey)
            .maybeSingle()
          if (existing) return json({ order: existing, idempotent: true })
        }
        return json({ error: { code: 'order_exists', message: 'There is already an open order for this project' } }, 409)
      }

      const order = created as { id: string; number: string; amount: number; currency: string; status: string; expires_at: string; created_at: string }
      let invoiceId: string | null = null
      let leadId: string | null = null
      let emailId: string | null = null
      let oldAutoRenew: boolean | null = null
      if (projectId) {
        const { data: pr } = await db.from('client_projects').select('auto_renew').eq('id', projectId).eq('client_id', profile.client_id).maybeSingle()
        oldAutoRenew = (pr as { auto_renew?: boolean } | null)?.auto_renew ?? null
      }

      // Компенсация: Supabase Edge не даёт транзакцию через REST, поэтому каждый шаг проверяем и откатываем заказ.
      const rollback = async () => {
        await db.from('billing_documents').delete().eq('order_id', order.id)
        if (emailId) await db.from('email_outbox').delete().eq('id', emailId)
        if (leadId) await db.from('leads').delete().eq('id', leadId)
        if (invoiceId) await db.from('invoices').delete().eq('id', invoiceId)
        await db.from('orders').delete().eq('id', order.id)
        if (projectId && oldAutoRenew !== null) {
          await db.from('client_projects').update({ auto_renew: oldAutoRenew }).eq('id', projectId).eq('client_id', profile.client_id)
        }
      }

      try {
        const itemsRes = await db.from('order_items').insert(
          cart.items.map((i) => ({
            order_id: order.id,
            kind: i.kind,
            package_id: i.package_id,
            catalog_item_id: i.catalog_item_id,
            credits: i.credits,
            title: i.title,
            unit_price: i.unit_price,
            quantity: i.quantity,
            amount: i.amount,
            meta: { project_id: i.project_id },
          })),
        )
        if (itemsRes.error) throw new Error('items_failed')

        const invoiceKind = packageItem ? 'period' : 'feature'
        const { data: invoiceRaw, error: invoiceError } = await db
          .from('invoices')
          .insert({
            client_id: profile.client_id,
            project_id: projectId,
            kind: invoiceKind,
            amount: order.amount,
            currency: order.currency,
            status: 'sent',
            link_or_file: 'cabinet:' + order.number,
          })
          .select('id')
          .single()
        if (invoiceError || !invoiceRaw) throw new Error('invoice_failed')
        invoiceId = (invoiceRaw as { id: string }).id
        const invoice = { id: invoiceId }

        const isLegal = payerType === 'legal'
        const prefix = isLegal ? 'СЧ' : 'ЧЕК'
        const { data: numberRaw } = await db.rpc('next_document_number', { p_prefix: prefix })
        const number = typeof numberRaw === 'string' ? numberRaw : prefix + '-' + new Date().getFullYear() + '-' + Date.now().toString().slice(-6)
        const docRes = await db.from('billing_documents').insert({
          client_id: profile.client_id,
          order_id: order.id,
          invoice_id: invoice.id,
          kind: isLegal ? 'invoice' : 'receipt',
          number,
          amount: order.amount,
          currency: order.currency,
          status: 'draft',
          meta: { payer_type: payerType, generated: 'auto' },
        })
        if (docRes.error) throw new Error('document_failed')

        const invOrderRes = await db.from('orders').update({ invoice_id: invoice.id }).eq('id', order.id)
        if (invOrderRes.error) throw new Error('invoice_link_failed')

        // Покупка из кабинета — заявка в CRM (source='cabinet').
        const leadRes = await db
          .from('leads')
          .insert({
            client_id: profile.client_id,
            source: 'cabinet',
            title: kind === 'service' ? 'Заказ услуги' : kind === 'mixed' && serviceItems.length ? 'Заказ услуг и кредитов' : kind === 'package' ? 'Покупка пакета' : kind === 'topup' ? 'Докупка кредитов' : 'Покупка пакета и кредитов',
            status: 'new',
            name: profile.name,
            phone: profile.phone,
            email: profile.email,
            company: profile.company,
            client_kind: payerType,
            comment: 'Заказ ' + order.number + ' на ' + order.amount + ' ' + order.currency,
            raw_text: 'cabinet: ' + order.number,
          })
          .select('id')
          .single()
        if (leadRes.error) throw new Error('lead_failed')
        leadId = (leadRes.data as { id: string }).id
        const leadOrderRes = await db.from('orders').update({ lead_id: leadId }).eq('id', order.id)
        if (leadOrderRes.error) throw new Error('lead_link_failed')

        const emailRes = await db.from('email_outbox').insert({
          client_id: profile.client_id,
          to_email: profile.email,
          template: 'order_created',
          status: profile.email ? 'queued' : 'skipped',
          payload: { order_id: order.id, order_number: order.number, amount: order.amount, currency: order.currency },
        }).select('id').single()
        if (emailRes.error || !emailRes.data) throw new Error('email_failed')
        emailId = (emailRes.data as { id: string }).id

        if (typeof body.auto_renew === 'boolean' && projectId) {
          const renewRes = await db
            .from('client_projects')
            .update({ auto_renew: body.auto_renew, auto_renew_changed_at: new Date().toISOString() })
            .eq('id', projectId)
            .eq('client_id', profile.client_id)
          if (renewRes.error) throw new Error('auto_renew_failed')
        }

        const cartRes = await db.from('cart_items').delete().eq('client_id', profile.client_id)
        if (cartRes.error) throw new Error('cart_clear_failed')
      } catch {
        await rollback()
        return json({ error: { code: 'order_failed', message: 'Could not complete order, try again' } }, 500)
      }

      return json({ order })
    }


    if (action === 'project_auto_renew') {
      const profile = await loadProfile(db, user.id)
      if (!profile) return json({ error: { code: 'not_registered', message: 'Call bootstrap first' } }, 409)
      const body = (await req.json().catch(() => ({}))) as Record<string, unknown>
      const projectId = typeof body.project_id === 'string' ? body.project_id : ''
      if (!projectId || typeof body.enabled !== 'boolean') {
        return json({ error: { code: 'bad_request', message: 'project_id and enabled are required' } }, 400)
      }
      if (!(await assertProject(db, profile.client_id, projectId))) {
        return json({ error: { code: 'project_forbidden', message: 'Project does not belong to the client' } }, 403)
      }
      if (!body.enabled) {
        const { data: open } = await db
          .from('orders')
          .select('id')
          .eq('project_id', projectId)
          .eq('client_id', profile.client_id)
          .eq('kind', 'renewal')
          .in('status', ['pending_payment', 'paid'])
          .maybeSingle()
        if (open) {
          const orderId = (open as { id: string }).id
          await db.from('orders').update({ status: 'cancelled', cancelled_at: new Date().toISOString() }).eq('id', orderId)
          await db.from('billing_documents').update({ status: 'void' }).eq('order_id', orderId)
          const { data: inv } = await db.from('orders').select('invoice_id').eq('id', orderId).maybeSingle()
          const invoiceId = (inv as { invoice_id: string | null } | null)?.invoice_id
          if (invoiceId) await db.from('invoices').update({ status: 'cancelled' }).eq('id', invoiceId)
          await db.from('email_outbox').delete().eq('template', 'renewal_soon').contains('payload', { order_id: orderId })
          await db.from('telegram_outbox').delete().eq('template', 'renewal_soon').contains('payload', { order_id: orderId })
        }
      }
      await db
        .from('client_projects')
        .update({ auto_renew: body.enabled, auto_renew_changed_at: new Date().toISOString() })
        .eq('id', projectId)
        .eq('client_id', profile.client_id)
      return json({ project_id: projectId, auto_renew: body.enabled })
    }

    if (action === 'telegram_start') {
      const profile = await loadProfile(db, user.id)
      if (!profile) return json({ error: { code: 'not_registered', message: 'Call bootstrap first' } }, 409)
      const token = Array.from(crypto.getRandomValues(new Uint8Array(18)))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString()
      await db.from('client_link_tokens').delete().lt('expires_at', new Date().toISOString())
      await db.from('client_link_tokens').delete().eq('user_id', user.id).is('used_at', null)
      const { error } = await db.from('client_link_tokens').insert({
        token,
        user_id: user.id,
        client_id: profile.client_id,
        kind: 'telegram',
        expires_at: expiresAt,
      })
      if (error) return json({ error: { code: 'token_failed', message: 'Could not create Telegram link' } }, 500)
      return json({
        deep_link: 'https://t.me/st96_leads_bot?start=cab_' + token,
        expires_at: expiresAt,
      })
    }

    if (action === 'telegram_status') {
      const profile = await loadProfile(db, user.id)
      if (!profile) return json({ error: { code: 'not_registered', message: 'Call bootstrap first' } }, 409)
      return json({
        linked: profile.onboarding_status === 'complete',
        telegram_username: profile.telegram_username,
        onboarding_status: profile.onboarding_status,
      })
    }

    if (action === 'profile_save') {
      const profile = await loadProfile(db, user.id)
      if (!profile) return json({ error: { code: 'not_registered', message: 'Call bootstrap first' } }, 409)
      const body = (await req.json().catch(() => ({}))) as Record<string, unknown>
      const patch: Record<string, unknown> = {}
      for (const key of ['name', 'phone', 'company'] as const) {
        if (typeof body[key] === 'string') patch[key] = body[key].trim().slice(0, 200)
      }
      if (body.language === 'ru' || body.language === 'en') patch.language = body.language

      // Юридические данные — в собственных колонках clients (0016_support.sql): их читает CRM и checkout.
      if (body.client_kind === 'individual' || body.client_kind === 'legal') {
        patch.client_kind = body.client_kind
      }
      const legalPatch: Record<string, string> = {}
      for (const key of ['legal_name', 'unp', 'legal_address', 'bank_details'] as const) {
        if (typeof body[key] === 'string') legalPatch[key] = body[key].trim().slice(0, 500)
      }
      if (legalPatch.unp && !/^\d{9}$/.test(legalPatch.unp)) {
        return json({ error: { code: 'invalid_unp', message: 'УНП должен состоять из 9 цифр' } }, 422)
      }
      Object.assign(patch, legalPatch)

      if (Object.keys(patch).length) {
        const { error } = await db.from('clients').update(patch).eq('id', profile.client_id)
        if (error) return json({ error: { code: 'save_failed', message: 'Could not save profile' } }, 500)
      }
      const next = await loadProfile(db, user.id)
      return json({ profile: next })
    }

    return json({ error: { code: 'unknown_action', message: 'Unknown action' } }, 400)
  } catch (e) {
    const code = e instanceof Error ? e.message : 'server_error'
    return json({ error: { code, message: 'Cabinet request failed' } }, 500)
  }
}
// Доступ к данным. Логика (server/leads, server/bot) работает через интерфейс Repo:
// в проде это Supabase, в тестах — память.
import { createClient } from '@supabase/supabase-js'
import type { Funnel, JobRow, RunRow } from './funnels/types'
import type { TemplateRow } from './templates'
import type { AudienceClient, BroadcastRow, Segment } from './broadcasts'
import type { AgentStats, AgentTask } from './agent/types'
import type { TemplateKind } from './templates'

export type ClientRow = {
  id: string
  tg_user_id: number | null
  tg_username: string | null
  name: string | null
  phone: string | null
  email: string | null
  company: string | null
  language: 'ru' | 'en'
  source: string | null
  consent_at: string | null
  opted_out_at: string | null
  last_seen_at: string | null
  admin_topic_id: number | null
  dialog_closed_at: string | null
  human_until: string | null
}

export type LeadInsert = {
  client_id: string | null
  source: 'site_form' | 'stand_form' | 'tg_group' | 'bot' | 'manual'
  service_key: string | null
  title: string | null
  topic: string | null
  name: string | null
  phone: string | null
  telegram: string | null
  email: string | null
  company: string | null
  comment: string | null
  interest: string | null
  lang: string | null
  landing: string | null
  utm: Record<string, string> | null
  warnings: string[]
  raw_text: string | null
  tg_chat_id: number | null
  tg_message_id: number | null
}

export type NoteInsert = {
  lead_id: string | null
  client_id: string | null
  author_name: string | null
  author_tg_id: number | null
  text: string
  source: 'group_reply' | 'group_message' | 'admin'
  tg_chat_id: number | null
  tg_message_id: number | null
  reply_to_message_id: number | null
}

export type MessageInsert = {
  client_id: string
  direction: 'in' | 'out' | 'admin'
  kind: 'text' | 'photo' | 'video' | 'audio' | 'voice' | 'file' | 'other'
  text: string | null
  tg_chat_id: number | null
  tg_message_id: number | null
}

export interface Repo {
  /** false — апдейт уже обработан (Telegram повторил доставку) */
  claimUpdate(updateId: number): Promise<boolean>
  findClient(by: { tgUserId?: number; phone?: string; username?: string; topicId?: number }): Promise<ClientRow | null>
  findClientById(id: string): Promise<ClientRow | null>
  insertClient(c: Partial<ClientRow>): Promise<ClientRow>
  updateClient(id: string, patch: Partial<ClientRow>): Promise<void>
  /** Вставка заявки; если заявка с этим сообщением Telegram уже есть, вернёт её */
  insertLead(l: LeadInsert): Promise<{ id: string; client_id: string | null; created: boolean }>
  findLeadByMessage(chatId: number, messageId: number): Promise<{ id: string; client_id: string | null } | null>
  findLeadByContact(by: { phone?: string; username?: string }): Promise<{ id: string; client_id: string | null } | null>
  insertNote(n: NoteInsert): Promise<void>
  insertMessage(m: MessageInsert): Promise<void>
  /** Последние заявки клиента для карточки в теме */
  listLeads(clientId: string): Promise<{ service_key: string | null; company: string | null; comment: string | null; source: string; created_at: string }[]>
  /** Записывает тему, если у клиента её ещё нет; возвращает действующий номер темы */
  setTopicIfEmpty(clientId: string, topicId: number): Promise<number>

  // воронки
  listPublishedFunnels(): Promise<Funnel[]>
  getFunnel(id: string): Promise<Funnel | null>
  getRun(id: string): Promise<RunRow | null>
  findActiveRun(clientId: string): Promise<RunRow | null>
  insertRun(r: { funnel_id: string; client_id: string; version: number; current_node: string | null; vars: Record<string, unknown> }): Promise<RunRow>
  updateRun(id: string, patch: Partial<Pick<RunRow, 'current_node' | 'status' | 'vars' | 'wake_at'>> & { finished_at?: string | null }): Promise<void>
  hasRun(clientId: string, funnelId: string): Promise<boolean>
  insertEvent(e: { run_id: string; funnel_id: string; client_id: string; node_id: string; event: string; data?: Record<string, unknown> }): Promise<void>
  // теги
  addTag(clientId: string, name: string): Promise<void>
  removeTag(clientId: string, name: string): Promise<void>
  listTags(clientId: string): Promise<string[]>
  // шаблоны сообщений
  listTemplates(): Promise<TemplateRow[]>
  getTemplate(id: string): Promise<TemplateRow | null>
  bumpTemplateUsed(id: string): Promise<void>
  // рассылки
  listAudience(): Promise<AudienceClient[]>
  getBroadcast(id: string): Promise<BroadcastRow | null>
  listActiveBroadcasts(): Promise<BroadcastRow[]>
  updateBroadcast(id: string, patch: Partial<Pick<BroadcastRow, 'status' | 'sent' | 'failed' | 'total' | 'finished_at'>>): Promise<void>
  insertRecipients(broadcastId: string, clientIds: string[]): Promise<void>
  claimRecipients(broadcastId: string, limit: number): Promise<ClientRow[]>
  finishRecipient(broadcastId: string, clientId: string, status: 'sent' | 'failed' | 'pending', error?: string): Promise<void>
  recipientCounts(broadcastId: string): Promise<{ pending: number; sending: number; sent: number; failed: number }>
  // задания агента
  insertAgentTask(t: { title: string; text: string; attach: string[] }): Promise<AgentTask>
  getAgentTask(id: string): Promise<AgentTask | null>
  updateAgentTask(id: string, patch: Partial<Pick<AgentTask, 'status' | 'rev' | 'plan' | 'log' | 'report' | 'error' | 'llm_calls'>>): Promise<void>
  listRunningAgentTasks(): Promise<AgentTask[]>
  /** Берёт задание в работу; null, если им уже занят другой запуск (замок на 2 минуты) */
  claimAgentTask(id: string): Promise<AgentTask | null>
  releaseAgentTask(id: string): Promise<void>
  deleteAgentTask(id: string): Promise<void>
  agentStats(): Promise<AgentStats>
  insertTemplate(t: { title: string; kind: TemplateKind; body: string; task: string; goal: string; services: string[] }): Promise<{ id: string }>
  insertBroadcastDraft(b: { title: string; body: string; segment: Segment }): Promise<{ id: string }>
  // настройки платформы
  getSetting(key: string): Promise<string | null>
  setSetting(key: string, value: string): Promise<void>
  // очередь отложенных шагов
  enqueueJob(kind: string, runAt: Date, payload: Record<string, unknown>): Promise<void>
  claimJobs(limit: number): Promise<JobRow[]>
  finishJob(id: number, error?: string): Promise<void>
}

const cleanUser = (u: string) => u.replace(/^@/, '')

export function supabaseRepo(url: string, key: string): Repo {
  // Таймаут на каждый запрос: зависший запрос превращается в понятную ошибку вместо тихого ожидания
  const timedFetch: typeof fetch = (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(6000) })
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: timedFetch } })
  const ok = <T>(r: { data: T; error: { message: string; code?: string } | null }, what: string): T => {
    if (r.error) throw new Error(`${what}: ${r.error.message}`)
    return r.data
  }
  return {
    async claimUpdate(updateId) {
      const { error } = await db.from('processed_updates').insert({ update_id: updateId })
      if (!error) return true
      if (error.code === '23505') return false
      throw new Error(`claimUpdate: ${error.message}`)
    },
    async findClient({ tgUserId, phone, username, topicId }) {
      let q = db.from('clients').select('*')
      if (topicId) q = q.eq('admin_topic_id', topicId)
      else if (tgUserId) q = q.eq('tg_user_id', tgUserId)
      else if (phone) q = q.eq('phone', phone)
      else if (username) q = q.ilike('tg_username', cleanUser(username).replace(/[%_]/g, '\\$&'))
      else return null
      return ok(await q.limit(1).maybeSingle(), 'findClient') as ClientRow | null
    },
    async findClientById(id) {
      return ok(await db.from('clients').select('*').eq('id', id).maybeSingle(), 'findClientById') as ClientRow | null
    },
    async insertClient(c) {
      return ok(await db.from('clients').insert(c).select('*').single(), 'insertClient') as ClientRow
    },
    async updateClient(id, patch) {
      ok(await db.from('clients').update(patch).eq('id', id), 'updateClient')
    },
    async insertLead(l) {
      const r = await db.from('leads').insert(l).select('id, client_id').single()
      if (r.error?.code === '23505' && l.tg_chat_id && l.tg_message_id) {
        const ex = await this.findLeadByMessage(l.tg_chat_id, l.tg_message_id)
        if (ex) return { ...ex, created: false }
      }
      const d = ok(r, 'insertLead') as { id: string; client_id: string | null }
      return { ...d, created: true }
    },
    async findLeadByMessage(chatId, messageId) {
      return ok(await db.from('leads').select('id, client_id').eq('tg_chat_id', chatId).eq('tg_message_id', messageId).limit(1).maybeSingle(), 'findLeadByMessage')
    },
    async findLeadByContact({ phone, username }) {
      let q = db.from('leads').select('id, client_id').order('created_at', { ascending: false }).limit(1)
      if (phone) q = q.eq('phone', phone)
      else if (username) q = q.ilike('telegram', '@' + cleanUser(username).replace(/[%_]/g, '\\$&'))
      else return null
      return ok(await q.maybeSingle(), 'findLeadByContact')
    },
    async insertNote(n) {
      ok(await db.from('lead_notes').insert(n), 'insertNote')
    },
    async insertMessage(m) {
      ok(await db.from('messages').insert(m), 'insertMessage')
    },
    async listLeads(clientId) {
      return ok(await db.from('leads').select('service_key, company, comment, source, created_at').eq('client_id', clientId).order('created_at', { ascending: false }).limit(5), 'listLeads') ?? []
    },
    async listPublishedFunnels() {
      return (ok(await db.from('funnels').select('id, name, status, graph, ai_enabled, version').eq('status', 'published'), 'listPublishedFunnels') ?? []) as Funnel[]
    },
    async getFunnel(id) {
      return ok(await db.from('funnels').select('id, name, status, graph, ai_enabled, version').eq('id', id).maybeSingle(), 'getFunnel') as Funnel | null
    },
    async getRun(id) {
      return ok(await db.from('funnel_runs').select('*').eq('id', id).maybeSingle(), 'getRun') as RunRow | null
    },
    async findActiveRun(clientId) {
      return ok(await db.from('funnel_runs').select('*').eq('client_id', clientId).in('status', ['running', 'waiting']).order('started_at', { ascending: false }).limit(1).maybeSingle(), 'findActiveRun') as RunRow | null
    },
    async insertRun(r) {
      return ok(await db.from('funnel_runs').insert(r).select('*').single(), 'insertRun') as RunRow
    },
    async updateRun(id, patch) {
      ok(await db.from('funnel_runs').update(patch).eq('id', id), 'updateRun')
    },
    async hasRun(clientId, funnelId) {
      const { count, error } = await db.from('funnel_runs').select('id', { count: 'exact', head: true }).eq('client_id', clientId).eq('funnel_id', funnelId)
      if (error) throw new Error(`hasRun: ${error.message}`)
      return (count ?? 0) > 0
    },
    async insertEvent(e) {
      ok(await db.from('run_events').insert(e), 'insertEvent')
    },
    async addTag(clientId, name) {
      const t = ok(await db.from('tags').upsert({ name }, { onConflict: 'name' }).select('id').single(), 'addTag tag') as { id: string }
      ok(await db.from('client_tags').upsert({ client_id: clientId, tag_id: t.id }, { onConflict: 'client_id,tag_id', ignoreDuplicates: true }), 'addTag link')
    },
    async removeTag(clientId, name) {
      const t = ok(await db.from('tags').select('id').eq('name', name).maybeSingle(), 'removeTag tag') as { id: string } | null
      if (t) ok(await db.from('client_tags').delete().eq('client_id', clientId).eq('tag_id', t.id), 'removeTag link')
    },
    async listTags(clientId) {
      const rows = (ok(await db.from('client_tags').select('tags(name)').eq('client_id', clientId), 'listTags') ?? []) as unknown as { tags: { name: string } | null }[]
      return rows.map((r) => r.tags?.name).filter((x): x is string => !!x)
    },
    async listTemplates() {
      return (ok(await db.from('templates').select('*').order('fav', { ascending: false }).order('used', { ascending: false }).limit(200), 'listTemplates') ?? []) as TemplateRow[]
    },
    async getTemplate(id) {
      return (ok(await db.from('templates').select('*').eq('id', id).maybeSingle(), 'getTemplate') as TemplateRow | null) ?? null
    },
    async bumpTemplateUsed(id) {
      const t = ok(await db.from('templates').select('used').eq('id', id).maybeSingle(), 'bumpTemplateUsed read') as { used: number } | null
      if (t) ok(await db.from('templates').update({ used: t.used + 1 }).eq('id', id), 'bumpTemplateUsed')
    },
    async listAudience() {
      const rows = (ok(await db.from('clients').select('*, leads(service_key), client_tags(tags(name))').not('tg_user_id', 'is', null).not('consent_at', 'is', null).is('opted_out_at', null).limit(5000), 'listAudience') ?? []) as unknown as (ClientRow & { leads: { service_key: string | null }[]; client_tags: { tags: { name: string } | null }[] })[]
      return rows.map(({ leads, client_tags, ...c }) => ({
        ...c,
        services: [...new Set(leads.map((l) => l.service_key).filter((x): x is string => !!x))],
        tags: client_tags.map((t) => t.tags?.name).filter((x): x is string => !!x),
      }))
    },
    async getBroadcast(id) {
      return (ok(await db.from('broadcasts').select('*').eq('id', id).maybeSingle(), 'getBroadcast') as BroadcastRow | null) ?? null
    },
    async listActiveBroadcasts() {
      return (ok(await db.from('broadcasts').select('*').in('status', ['scheduled', 'sending']).order('created_at'), 'listActiveBroadcasts') ?? []) as BroadcastRow[]
    },
    async updateBroadcast(id, patch) {
      ok(await db.from('broadcasts').update(patch).eq('id', id), 'updateBroadcast')
    },
    async insertRecipients(broadcastId, clientIds) {
      for (let i = 0; i < clientIds.length; i += 500) {
        ok(await db.from('broadcast_recipients').upsert(clientIds.slice(i, i + 500).map((client_id) => ({ broadcast_id: broadcastId, client_id })), { onConflict: 'broadcast_id,client_id', ignoreDuplicates: true }), 'insertRecipients')
      }
    },
    async claimRecipients(broadcastId, limit) {
      const rec = (ok(await db.rpc('claim_broadcast_recipients', { p_broadcast: broadcastId, p_limit: limit }), 'claimRecipients') ?? []) as { client_id: string }[]
      if (!rec.length) return []
      return (ok(await db.from('clients').select('*').in('id', rec.map((r) => r.client_id)), 'claimRecipients clients') ?? []) as ClientRow[]
    },
    async finishRecipient(broadcastId, clientId, status, error) {
      const patch = status === 'pending' ? { status, claimed_at: null } : { status, error: error ?? null, sent_at: status === 'sent' ? new Date().toISOString() : null }
      ok(await db.from('broadcast_recipients').update(patch).eq('broadcast_id', broadcastId).eq('client_id', clientId), 'finishRecipient')
    },
    async recipientCounts(broadcastId) {
      const out = { pending: 0, sending: 0, sent: 0, failed: 0 }
      for (const k of Object.keys(out) as (keyof typeof out)[]) {
        const r = await db.from('broadcast_recipients').select('client_id', { count: 'exact', head: true }).eq('broadcast_id', broadcastId).eq('status', k)
        if (r.error) throw new Error(`recipientCounts: ${r.error.message}`)
        out[k] = r.count ?? 0
      }
      return out
    },
    async insertAgentTask(t) {
      return ok(await db.from('agent_tasks').insert(t).select('*').single(), 'insertAgentTask') as AgentTask
    },
    async getAgentTask(id) {
      return (ok(await db.from('agent_tasks').select('*').eq('id', id).maybeSingle(), 'getAgentTask') as AgentTask | null) ?? null
    },
    async updateAgentTask(id, patch) {
      ok(await db.from('agent_tasks').update(patch).eq('id', id), 'updateAgentTask')
    },
    async listRunningAgentTasks() {
      return (ok(await db.from('agent_tasks').select('*').eq('status', 'running').order('created_at'), 'listRunningAgentTasks') ?? []) as AgentTask[]
    },
    async claimAgentTask(id) {
      const lim = new Date(Date.now() - 2 * 60_000).toISOString()
      const rows = ok(await db.from('agent_tasks').update({ locked_at: new Date().toISOString() }).eq('id', id).or(`locked_at.is.null,locked_at.lt.${lim}`).select('*'), 'claimAgentTask') as AgentTask[] | null
      return rows?.[0] ?? null
    },
    async deleteAgentTask(id) {
      ok(await db.from('agent_tasks').delete().eq('id', id), 'deleteAgentTask')
    },
    async releaseAgentTask(id) {
      ok(await db.from('agent_tasks').update({ locked_at: null }).eq('id', id), 'releaseAgentTask')
    },
    async agentStats() {
      const count = async (q: PromiseLike<{ count: number | null; error: { message: string } | null }>, what: string) => {
        const r = await q
        if (r.error) throw new Error(`agentStats ${what}: ${r.error.message}`)
        return r.count ?? 0
      }
      const head = { count: 'exact' as const, head: true }
      const since30 = new Date(Date.now() - 30 * 86400_000).toISOString()
      const since7 = new Date(Date.now() - 7 * 86400_000).toISOString()
      const leads = (ok(await db.from('leads').select('service_key, status').gte('created_at', since30).limit(5000), 'agentStats leads') ?? []) as { service_key: string | null; status: string }[]
      const leads30: Record<string, number> = {}
      const leadStatus: Record<string, number> = {}
      for (const l of leads) {
        leads30[l.service_key ?? 'other'] = (leads30[l.service_key ?? 'other'] ?? 0) + 1
        leadStatus[l.status] = (leadStatus[l.status] ?? 0) + 1
      }
      return {
        clients: await count(db.from('clients').select('id', head), 'clients'),
        consented: await count(db.from('clients').select('id', head).not('consent_at', 'is', null).is('opted_out_at', null), 'consented'),
        optedOut: await count(db.from('clients').select('id', head).not('opted_out_at', 'is', null), 'optedOut'),
        leads30, leadStatus,
        newLeads7: await count(db.from('leads').select('id', head).gte('created_at', since7), 'newLeads7'),
        funnels: await count(db.from('funnels').select('id', head), 'funnels'),
        publishedFunnels: await count(db.from('funnels').select('id', head).eq('status', 'published'), 'publishedFunnels'),
        templates: await count(db.from('templates').select('id', head), 'templates'),
        broadcasts: await count(db.from('broadcasts').select('id', head), 'broadcasts'),
      }
    },
    async insertTemplate(t) {
      return ok(await db.from('templates').insert(t).select('id').single(), 'insertTemplate') as { id: string }
    },
    async insertBroadcastDraft(b) {
      return ok(await db.from('broadcasts').insert(b).select('id').single(), 'insertBroadcastDraft') as { id: string }
    },
    async getSetting(key) {
      const r = ok(await db.from('app_settings').select('value').eq('key', key).maybeSingle(), 'getSetting') as { value: unknown } | null
      return typeof r?.value === 'string' ? r.value : null
    },
    async setSetting(key, value) {
      ok(await db.from('app_settings').upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' }), 'setSetting')
    },
    async enqueueJob(kind, runAt, payload) {
      ok(await db.from('jobs').insert({ kind, run_at: runAt.toISOString(), payload }), 'enqueueJob')
    },
    async claimJobs(limit) {
      return (ok(await db.rpc('claim_jobs', { p_limit: limit }), 'claimJobs') ?? []) as JobRow[]
    },
    async finishJob(id, error) {
      ok(await db.from('jobs').update(error ? { last_error: error.slice(0, 500) } : { done_at: new Date().toISOString() }).eq('id', id), 'finishJob')
    },
    async setTopicIfEmpty(clientId, topicId) {
      const rows = ok(await db.from('clients').update({ admin_topic_id: topicId }).eq('id', clientId).is('admin_topic_id', null).select('admin_topic_id'), 'setTopicIfEmpty')
      if (rows && rows.length) return topicId
      const cur = ok(await db.from('clients').select('admin_topic_id').eq('id', clientId).single(), 'setTopicIfEmpty read')
      return cur?.admin_topic_id ?? topicId
    },
  }
}

/** Обёртка для отладки: пишет в журнал время каждого обращения к базе. */
export function tracedRepo(repo: Repo): Repo {
  return new Proxy(repo, {
    get(target, prop, receiver) {
      const fn = Reflect.get(target, prop, receiver)
      if (typeof fn !== 'function') return fn
      return async (...args: unknown[]) => {
        const t0 = Date.now()
        try {
          const r = await fn.apply(target, args)
          console.log('repo', String(prop), `${Date.now() - t0}ms`)
          return r
        } catch (e) {
          console.error('repo', String(prop), 'failed', `${Date.now() - t0}ms`, e instanceof Error ? e.message : e)
          throw e
        }
      }
    },
  })
}

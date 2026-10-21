// Репозиторий в памяти: для тестов логики без базы.
import type { ClientRow, LeadInsert, MessageInsert, NoteInsert, Repo } from './repo'
import type { Funnel, JobRow, RunRow } from './funnels/types'
import type { TemplateRow } from './templates'
import type { AudienceClient, BroadcastRow } from './broadcasts'
import type { AgentStats, AgentTask } from './agent/types'
import type { BookingInsert, BookingRow } from './booking/types'

export type MemoryRepo = Repo & {
  clients: ClientRow[]
  leads: (LeadInsert & { id: string })[]
  notes: NoteInsert[]
  messages: MessageInsert[]
  funnels: Funnel[]
  runs: RunRow[]
  events: { run_id: string; node_id: string; event: string; data?: Record<string, unknown> }[]
  tags: Map<string, Set<string>>
  templates: TemplateRow[]
  templateEvents: { template_id: string; kind: string }[]
  llmUsage: { model: string; feature: string; prompt_tokens: number; completion_tokens: number; total_tokens: number; estimated: boolean }[]
  broadcasts: BroadcastRow[]
  agentTasks: (AgentTask & { locked: boolean })[]
  settings: Map<string, string>
  bookings: BookingRow[]
  /** часы для тестов: время создания заявок */
  clock: () => Date
  recipients: { broadcast_id: string; client_id: string; status: 'pending' | 'sending' | 'sent' | 'failed'; error?: string }[]
  jobs: (JobRow & { run_at: Date; done: boolean; error?: string })[]
}

export function memoryRepo(): MemoryRepo {
  let seq = 0
  const id = (p: string) => `${p}${++seq}`
  const seen = new Set<number>()
  const r: MemoryRepo = {
    clients: [], leads: [], notes: [], messages: [], funnels: [], runs: [], events: [], tags: new Map(), templates: [], templateEvents: [], llmUsage: [], broadcasts: [], agentTasks: [], settings: new Map(), bookings: [], clock: () => new Date(), recipients: [], jobs: [],
    async claimUpdate(u) { if (seen.has(u)) return false; seen.add(u); return true },
    async findClient({ tgUserId, phone, username, topicId }) {
      if (topicId) return r.clients.find((c) => c.admin_topic_id === topicId) ?? null
      if (tgUserId) return r.clients.find((c) => c.tg_user_id === tgUserId) ?? null
      if (phone) return r.clients.find((c) => c.phone === phone) ?? null
      if (username) return r.clients.find((c) => c.tg_username?.toLowerCase() === username.replace(/^@/, '').toLowerCase()) ?? null
      return null
    },
    async findClientById(cid) { return r.clients.find((c) => c.id === cid) ?? null },
    async insertClient(c) {
      const row: ClientRow = {
        id: id('c'), tg_user_id: null, tg_username: null, name: null, phone: null, email: null, company: null,
        language: 'ru', source: null, consent_at: null, opted_out_at: null, last_seen_at: null, admin_topic_id: null, dialog_closed_at: null, human_until: null, ...c,
      }
      r.clients.push(row)
      return row
    },
    async updateClient(cid, patch) { Object.assign(r.clients.find((c) => c.id === cid)!, patch) },
    async insertLead(l) {
      if (l.tg_chat_id && l.tg_message_id) {
        const ex = r.leads.find((x) => x.tg_chat_id === l.tg_chat_id && x.tg_message_id === l.tg_message_id)
        if (ex) return { id: ex.id, client_id: ex.client_id, created: false }
      }
      const row = { ...l, id: id('l') }
      r.leads.push(row)
      return { id: row.id, client_id: row.client_id, created: true }
    },
    async leadContacts(cid) { return r.leads.filter((l) => l.client_id === cid).reverse().map((l) => ({ name: l.name, phone: l.phone, telegram: l.telegram, company: l.company })) },
    async countLeads(cid) { return r.leads.filter((l) => l.client_id === cid).length },
    async getLead(lid) { return r.leads.find((l) => l.id === lid) ?? null },
    async updateLead(lid, patch) { Object.assign(r.leads.find((l) => l.id === lid)!, patch) },
    async findLeadByMessage(chat, msg) {
      const x = r.leads.find((l) => l.tg_chat_id === chat && l.tg_message_id === msg)
      return x ? { id: x.id, client_id: x.client_id } : null
    },
    async findLeadByContact({ phone, username }) {
      const list = [...r.leads].reverse()
      const x = phone ? list.find((l) => l.phone === phone) : username ? list.find((l) => l.telegram?.toLowerCase() === '@' + username.replace(/^@/, '').toLowerCase()) : undefined
      return x ? { id: x.id, client_id: x.client_id } : null
    },
    async insertNote(n) { r.notes.push(n) },
    async insertMessage(m) { r.messages.push(m) },
    async listLeads(clientId) {
      return r.leads.filter((l) => l.client_id === clientId).map((l) => ({ service_key: l.service_key, company: l.company, comment: l.comment, source: l.source, created_at: '' }))
    },
    async listPublishedFunnels() { return r.funnels.filter((f) => f.status === 'published') },
    async getFunnel(fid) { return r.funnels.find((f) => f.id === fid) ?? null },
    async getRun(rid) { return r.runs.find((x) => x.id === rid) ?? null },
    async findActiveRun(cid) { return [...r.runs].reverse().find((x) => x.client_id === cid && (x.status === 'running' || x.status === 'waiting')) ?? null },
    async insertRun(row) {
      const run: RunRow = { id: crypto.randomUUID(), status: 'running', wake_at: null, ...row }
      r.runs.push(run)
      return run
    },
    async updateRun(rid, patch) { Object.assign(r.runs.find((x) => x.id === rid)!, patch) },
    async hasRun(cid, fid) { return r.runs.some((x) => x.client_id === cid && x.funnel_id === fid) },
    async insertEvent(e) { r.events.push(e) },
    async addTag(cid, name) { (r.tags.get(cid) ?? r.tags.set(cid, new Set()).get(cid)!).add(name) },
    async removeTag(cid, name) { r.tags.get(cid)?.delete(name) },
    async listTags(cid) { return [...(r.tags.get(cid) ?? [])] },
    async listTemplates() { return [...r.templates] },
    async getTemplate(tid) { return r.templates.find((t) => t.id === tid) ?? null },
    async bumpTemplateUsed(tid) { const t = r.templates.find((x) => x.id === tid); if (t) { t.used++; r.templateEvents.push({ template_id: tid, kind: 'use' }) } },
    async recordTemplateEvent(tid, kind) { r.templateEvents.push({ template_id: tid, kind }) },
    async insertLlmUsage(u) { r.llmUsage.push(u) },
    async listAudience() {
      return r.clients.filter((c) => c.tg_user_id && c.consent_at && !c.opted_out_at).map((c): AudienceClient => ({
        ...c,
        services: [...new Set(r.leads.filter((l) => l.client_id === c.id && l.service_key).map((l) => l.service_key!))],
        tags: [...(r.tags.get(c.id) ?? [])],
      }))
    },
    async getBroadcast(bid) { return r.broadcasts.find((b) => b.id === bid) ?? null },
    async listActiveBroadcasts() { return r.broadcasts.filter((b) => b.status === 'scheduled' || b.status === 'sending') },
    async updateBroadcast(bid, patch) { Object.assign(r.broadcasts.find((b) => b.id === bid)!, patch) },
    async insertRecipients(bid, ids) { for (const cid of ids) if (!r.recipients.some((x) => x.broadcast_id === bid && x.client_id === cid)) r.recipients.push({ broadcast_id: bid, client_id: cid, status: 'pending' }) },
    async claimRecipients(bid, limit) {
      const pick = r.recipients.filter((x) => x.broadcast_id === bid && x.status === 'pending').slice(0, limit)
      pick.forEach((x) => { x.status = 'sending' })
      return pick.map((x) => r.clients.find((c) => c.id === x.client_id)!)
    },
    async finishRecipient(bid, cid, status, error) {
      const x = r.recipients.find((y) => y.broadcast_id === bid && y.client_id === cid)!
      x.status = status
      x.error = error
    },
    async recipientCounts(bid) {
      const l = r.recipients.filter((x) => x.broadcast_id === bid)
      const n = (s: string) => l.filter((x) => x.status === s).length
      return { pending: n('pending'), sending: n('sending'), sent: n('sent'), failed: n('failed') }
    },
    async insertAgentTask(t) {
      const row = { id: id('at'), title: t.title, text: t.text, attach: t.attach, status: 'planning' as const, rev: 1, plan: [], log: [], report: null, error: null, llm_calls: 0, created_at: new Date().toISOString(), locked: false }
      r.agentTasks.push(row)
      return row
    },
    async getAgentTask(tid) { return r.agentTasks.find((x) => x.id === tid) ?? null },
    async updateAgentTask(tid, patch) { Object.assign(r.agentTasks.find((x) => x.id === tid)!, patch) },
    async listRunningAgentTasks() { return r.agentTasks.filter((x) => x.status === 'running') },
    async claimAgentTask(tid) {
      const x = r.agentTasks.find((y) => y.id === tid)
      if (!x || x.locked) return null
      x.locked = true
      return x
    },
    async deleteAgentTask(tid) { r.agentTasks = r.agentTasks.filter((x) => x.id !== tid) },
    async releaseAgentTask(tid) { const x = r.agentTasks.find((y) => y.id === tid); if (x) x.locked = false },
    async agentStats(): Promise<AgentStats> {
      const leads30: Record<string, number> = {}
      const leadStatus: Record<string, number> = {}
      for (const l of r.leads) { leads30[l.service_key ?? 'other'] = (leads30[l.service_key ?? 'other'] ?? 0) + 1 }
      return {
        clients: r.clients.length, consented: r.clients.filter((c) => c.consent_at && !c.opted_out_at).length, optedOut: r.clients.filter((c) => c.opted_out_at).length,
        leads30, leadStatus, newLeads7: r.leads.length, funnels: r.funnels.length, publishedFunnels: r.funnels.filter((f) => f.status === 'published').length,
        templates: r.templates.length, broadcasts: r.broadcasts.length,
      }
    },
    async insertTemplate(t) {
      const row = { id: id('tpl'), fav: false, used: 0, body_en: null, media_url: null, updated_at: '', ...t }
      r.templates.push(row)
      return { id: row.id }
    },
    async insertBroadcastDraft(b) {
      const row: BroadcastRow = { id: id('bc'), title: b.title, kind: 'text', body: b.body, body_en: null, media_url: null, segment: b.segment, status: 'draft', scheduled_at: null, total: 0, sent: 0, failed: 0, created_at: '', finished_at: null }
      r.broadcasts.push(row)
      return { id: row.id }
    },
    async insertBooking(b: BookingInsert) {
      const overlap = r.bookings.some((x) => (x.status === 'pending' || x.status === 'confirmed') && Date.parse(b.starts_at) < Date.parse(x.ends_at) && Date.parse(b.ends_at) > Date.parse(x.starts_at))
      if (overlap) return { ok: false as const, conflict: true as const }
      const row: BookingRow = { ...b, id: id('bk'), status: 'pending', meet_url: null, reminded_at: null, decided_at: null, created_at: r.clock().toISOString() }
      r.bookings.push(row)
      return { ok: true as const, booking: row }
    },
    async getBooking(bid) { return r.bookings.find((x) => x.id === bid) ?? null },
    async updateBooking(bid, patch) { Object.assign(r.bookings.find((x) => x.id === bid)!, patch) },
    async listActiveBookings(fromDate, toDate) {
      const from = Date.parse(`${fromDate}T00:00:00+03:00`)
      const to = Date.parse(`${toDate}T00:00:00+03:00`) + 86_400_000
      return r.bookings.filter((x) => (x.status === 'pending' || x.status === 'confirmed') && Date.parse(x.starts_at) >= from && Date.parse(x.starts_at) < to)
    },
    async countUpcomingBookings(cid, from) { return r.bookings.filter((x) => x.client_id === cid && (x.status === 'pending' || x.status === 'confirmed') && x.starts_at >= from).length },
    async countRecentBookings(c, since) {
      return r.bookings.filter((x) => x.created_at >= since && ((c.phone && x.phone === c.phone) || (c.telegram && x.telegram === c.telegram))).length
    },
    async listDueReminders(from, to) {
      return r.bookings.filter((x) => x.status === 'confirmed' && !x.reminded_at && x.starts_at >= from && x.starts_at < to)
    },
    async getSetting(key) { return r.settings.get(key) ?? null },
    async setSetting(key, value) { r.settings.set(key, value) },
    async enqueueJob(kind, runAt, payload) { r.jobs.push({ id: ++seq, kind, payload, attempts: 0, run_at: runAt, done: false }) },
    async claimJobs(limit) {
      const due = r.jobs.filter((j) => !j.done && j.run_at.getTime() <= Date.now()).slice(0, limit)
      due.forEach((j) => { j.attempts++ })
      return due.map(({ id: jid, kind, payload, attempts }) => ({ id: jid, kind, payload, attempts }))
    },
    async finishJob(jid, error) {
      const j = r.jobs.find((x) => x.id === jid)!
      if (error) j.error = error
      else j.done = true
    },
    async setTopicIfEmpty(clientId, topicId) {
      const c = r.clients.find((x) => x.id === clientId)!
      if (c.admin_topic_id == null) c.admin_topic_id = topicId
      return c.admin_topic_id
    },
  }
  return r
}

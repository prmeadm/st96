// Репозиторий в памяти: для тестов логики без базы.
import type { ClientRow, LeadInsert, MessageInsert, NoteInsert, Repo } from './repo'
import type { Funnel, JobRow, RunRow } from './funnels/types'
import type { TemplateRow } from './templates'

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
  jobs: (JobRow & { run_at: Date; done: boolean; error?: string })[]
}

export function memoryRepo(): MemoryRepo {
  let seq = 0
  const id = (p: string) => `${p}${++seq}`
  const seen = new Set<number>()
  const r: MemoryRepo = {
    clients: [], leads: [], notes: [], messages: [], funnels: [], runs: [], events: [], tags: new Map(), templates: [], jobs: [],
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
    async bumpTemplateUsed(tid) { const t = r.templates.find((x) => x.id === tid); if (t) t.used++ },
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

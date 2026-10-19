// Репозиторий в памяти: для тестов логики без базы.
import type { ClientRow, LeadInsert, MessageInsert, NoteInsert, Repo } from './repo'

export type MemoryRepo = Repo & {
  clients: ClientRow[]
  leads: (LeadInsert & { id: string })[]
  notes: NoteInsert[]
  messages: MessageInsert[]
}

export function memoryRepo(): MemoryRepo {
  let seq = 0
  const id = (p: string) => `${p}${++seq}`
  const seen = new Set<number>()
  const r: MemoryRepo = {
    clients: [], leads: [], notes: [], messages: [],
    async claimUpdate(u) { if (seen.has(u)) return false; seen.add(u); return true },
    async findClient({ tgUserId, phone, username }) {
      if (tgUserId) return r.clients.find((c) => c.tg_user_id === tgUserId) ?? null
      if (phone) return r.clients.find((c) => c.phone === phone) ?? null
      if (username) return r.clients.find((c) => c.tg_username?.toLowerCase() === username.replace(/^@/, '').toLowerCase()) ?? null
      return null
    },
    async insertClient(c) {
      const row: ClientRow = {
        id: id('c'), tg_user_id: null, tg_username: null, name: null, phone: null, email: null, company: null,
        language: 'ru', source: null, consent_at: null, opted_out_at: null, last_seen_at: null, ...c,
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
  }
  return r
}

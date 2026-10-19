// Доступ к данным. Логика (server/leads, server/bot) работает через интерфейс Repo:
// в проде это Supabase, в тестах — память.
import { createClient } from '@supabase/supabase-js'

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
  findClient(by: { tgUserId?: number; phone?: string; username?: string }): Promise<ClientRow | null>
  insertClient(c: Partial<ClientRow>): Promise<ClientRow>
  updateClient(id: string, patch: Partial<ClientRow>): Promise<void>
  /** Вставка заявки; если заявка с этим сообщением Telegram уже есть, вернёт её */
  insertLead(l: LeadInsert): Promise<{ id: string; client_id: string | null; created: boolean }>
  findLeadByMessage(chatId: number, messageId: number): Promise<{ id: string; client_id: string | null } | null>
  findLeadByContact(by: { phone?: string; username?: string }): Promise<{ id: string; client_id: string | null } | null>
  insertNote(n: NoteInsert): Promise<void>
  insertMessage(m: MessageInsert): Promise<void>
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
    async findClient({ tgUserId, phone, username }) {
      let q = db.from('clients').select('*')
      if (tgUserId) q = q.eq('tg_user_id', tgUserId)
      else if (phone) q = q.eq('phone', phone)
      else if (username) q = q.ilike('tg_username', cleanUser(username).replace(/[%_]/g, '\\$&'))
      else return null
      return ok(await q.limit(1).maybeSingle(), 'findClient') as ClientRow | null
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

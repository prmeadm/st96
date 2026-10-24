// Сохранение заявок и заметок сотрудников в базу.
import type { ClientRow, LeadInsert, Repo } from '../repo'
import { normalizePhone, parseLead, type ParsedLead } from './parse'

export type IngestCtx = {
  source?: LeadInsert['source']
  tgChatId?: number | null
  tgMessageId?: number | null
  rawText?: string
  utm?: Record<string, string> | null
  /** Человек сам отправил форму с согласием (форма сайта): это согласие и на рассылки */
  consent?: boolean
}

const stripAt = (t: string) => t.replace(/^@/, '')
const originSource = (p: ParsedLead): LeadInsert['source'] => (p.origin === 'stand' ? 'stand_form' : p.origin === 'site' ? 'site_form' : 'tg_group')

/** Находит клиента по телефону, затем по нику; иначе создаёт. Недостающие поля дополняет. */
export async function upsertClientFromLead(repo: Repo, p: ParsedLead, sourceTag: string): Promise<ClientRow | null> {
  let client: ClientRow | null = null
  if (p.phone) client = await repo.findClient({ phone: p.phone })
  if (!client && p.telegram) client = await repo.findClient({ username: p.telegram })
  if (!client) {
    if (!p.phone && !p.telegram && !p.email) return null
    return repo.insertClient({
      name: p.name || null, phone: p.phone || null, tg_username: p.telegram ? stripAt(p.telegram) : null,
      email: p.email || null, company: p.company || null, language: p.lang === 'en' ? 'en' : 'ru', source: sourceTag,
    })
  }
  const patch: Partial<ClientRow> = {}
  if (!client.name && p.name) patch.name = p.name
  if (!client.company && p.company) patch.company = p.company
  if (!client.email && p.email) patch.email = p.email
  if (!client.phone && p.phone) {
    const other = await repo.findClient({ phone: p.phone })
    if (!other) patch.phone = p.phone
  }
  if (!client.tg_username && p.telegram) {
    const other = await repo.findClient({ username: p.telegram })
    if (!other) patch.tg_username = stripAt(p.telegram)
  }
  if (Object.keys(patch).length) {
    await repo.updateClient(client.id, patch)
    client = { ...client, ...patch }
  }
  return client
}

export async function ingestLead(repo: Repo, p: ParsedLead, ctx: IngestCtx = {}) {
  const source = ctx.source ?? originSource(p)
  // Повтор того же сообщения группы не создаёт вторую заявку
  if (ctx.tgChatId && ctx.tgMessageId) {
    const ex = await repo.findLeadByMessage(ctx.tgChatId, ctx.tgMessageId)
    if (ex) return { leadId: ex.id, clientId: ex.client_id, created: false }
  }
  const client = await upsertClientFromLead(repo, p, p.origin === 'unknown' ? source : p.origin)
  if (ctx.consent && client && !client.consent_at && !client.opted_out_at) await repo.updateClient(client.id, { consent_at: new Date().toISOString() })
  const lead = await repo.insertLead({
    client_id: client?.id ?? null, source, service_key: p.service, title: p.title || null, topic: p.topic || null,
    name: p.name || null, phone: p.phone || null, telegram: p.telegram || null, email: p.email || null, company: p.company || null,
    comment: p.comment || null, interest: p.interest || null, lang: p.lang || null, landing: p.landing || null,
    utm: ctx.utm ?? null, warnings: p.warnings, raw_text: ctx.rawText ?? null,
    tg_chat_id: ctx.tgChatId ?? null, tg_message_id: ctx.tgMessageId ?? null,
  })
  return { leadId: lead.id, clientId: lead.client_id, created: lead.created }
}

export type GroupMessage = {
  chatId: number
  messageId: number
  text: string
  fromId: number | null
  fromName: string
  fromIsBot: boolean
  reply: { messageId: number; text: string } | null
}

export type GroupResult = { kind: 'skipped' | 'lead' | 'note' | 'unassigned_note'; leadId?: string | null }

/** Сообщение сотрудника в группе «Лиды»: новая заявка, заметка-ответ или заметка по контакту. */
export async function ingestGroupMessage(repo: Repo, m: GroupMessage): Promise<GroupResult> {
  const text = m.text.trim()
  if (m.fromIsBot || !text || text.startsWith('/')) return { kind: 'skipped' }

  const own = parseLead(text)
  if (own.isLead) {
    const r = await ingestLead(repo, own, { tgChatId: m.chatId, tgMessageId: m.messageId, rawText: text })
    return { kind: 'lead', leadId: r.leadId }
  }

  const note = (lead: { id: string; client_id: string | null } | null, source: 'group_reply' | 'group_message') =>
    repo.insertNote({
      lead_id: lead?.id ?? null, client_id: lead?.client_id ?? null, author_name: m.fromName || null, author_tg_id: m.fromId,
      text, source, tg_chat_id: m.chatId, tg_message_id: m.messageId, reply_to_message_id: m.reply?.messageId ?? null,
    })

  if (m.reply) {
    let lead = await repo.findLeadByMessage(m.chatId, m.reply.messageId)
    if (!lead && m.reply.text) {
      // Заявка пришла до подключения базы: достаём её из текста сообщения, на которое ответили
      const rp = parseLead(m.reply.text)
      if (rp.isLead) {
        const r = await ingestLead(repo, rp, { tgChatId: m.chatId, tgMessageId: m.reply.messageId, rawText: m.reply.text })
        lead = { id: r.leadId, client_id: r.clientId }
      }
    }
    if (lead) {
      await note(lead, 'group_reply')
      return { kind: 'note', leadId: lead.id }
    }
  }

  // Без ответа: ищем заявку по телефону или нику в тексте
  const pm = text.match(/\+?\d[\d\s()\-]{8,}\d/)
  const phone = pm ? normalizePhone(pm[0]) : null
  const username = text.match(/@[A-Za-z][A-Za-z0-9_]{4,31}/)?.[0]
  if (phone || username) {
    const lead = await repo.findLeadByContact({ phone: phone || undefined, username })
    if (lead) {
      await note(lead, 'group_message')
      return { kind: 'note', leadId: lead.id }
    }
  }
  if (text.length >= 25) {
    await note(null, 'group_message')
    return { kind: 'unassigned_note', leadId: null }
  }
  return { kind: 'skipped' }
}

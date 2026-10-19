// Передача диалога человеку: у каждого клиента своя тема в админ-группе.
//   клиент пишет боту        -> сообщение копируется в его тему;
//   сотрудник пишет в теме   -> бот отправляет клиенту (то же сообщение, включая фото и голосовые);
//   «//текст» в теме         -> внутренняя заметка, клиенту не уходит;
//   «/close» в теме          -> диалог закрыт, тема закрывается.
import type { Api } from 'grammy'
import type { ClientRow, Repo } from '../repo'

const SERVICE_NAMES: Record<string, string> = {
  neurophoto: 'Нейрофотосессия', retouch: 'Retouch Studio', digital_office: 'Цифровой офис', production: 'Продакшн', other: 'Другое',
}

const threadGone = (e: unknown) => /message thread not found|TOPIC_DELETED|TOPIC_ID_INVALID|TOPIC_NOT_MODIFIED/i.test(e instanceof Error ? e.message : String(e))

export function topicTitle(c: Pick<ClientRow, 'id' | 'name' | 'tg_username'>) {
  const base = c.name || (c.tg_username ? '' : `Клиент ${c.id.slice(0, 6)}`)
  return `${base}${c.tg_username ? ` (@${c.tg_username})` : ''}`.trim().slice(0, 120) || 'Клиент'
}

export async function cardText(repo: Repo, c: ClientRow) {
  const leads = await repo.listLeads(c.id)
  const lines = [
    `Клиент: ${c.name ?? '—'}${c.tg_username ? ` (@${c.tg_username})` : ''}`,
    c.phone && `Телефон: ${c.phone}`,
    c.company && `Компания: ${c.company}`,
    `Язык: ${c.language === 'en' ? 'English' : 'Русский'} · источник: ${c.source ?? '—'}`,
    `Рассылки: ${c.opted_out_at ? 'отписан' : c.consent_at ? 'согласен' : 'согласия нет'}`,
    leads.length ? '\nЗаявки:' : '\nЗаявок пока нет.',
    ...leads.map((l) => `• ${SERVICE_NAMES[l.service_key ?? ''] ?? l.service_key ?? 'заявка'}${l.company ? `, ${l.company}` : ''}${l.comment ? `: ${l.comment.slice(0, 160)}` : ''}`),
    '\nПишите в этой теме, и клиент получит сообщение от студии. Строка с «//» в начале останется внутренней заметкой. /close закрывает диалог.',
  ]
  return lines.filter(Boolean).join('\n')
}

async function ensureTopic(api: Api, repo: Repo, groupChatId: number, client: ClientRow): Promise<number> {
  const t = await api.createForumTopic(groupChatId, topicTitle(client))
  const effective = await repo.setTopicIfEmpty(client.id, t.message_thread_id)
  if (effective !== t.message_thread_id) {
    // Параллельное сообщение уже создало тему (например, альбом из нескольких фото): лишнюю удаляем
    await api.deleteForumTopic(groupChatId, t.message_thread_id).catch(() => undefined)
    return effective
  }
  const card = await api.sendMessage(groupChatId, await cardText(repo, client), { message_thread_id: effective })
  await api.pinChatMessage(groupChatId, card.message_id).catch(() => undefined)
  return effective
}

/** Сообщение клиента -> тема клиента в админ-группе. */
export async function relayToAdmins(api: Api, repo: Repo, groupChatId: number, client: ClientRow, fromChatId: number, messageId: number) {
  let topic = client.admin_topic_id ?? (await ensureTopic(api, repo, groupChatId, client))
  if (client.dialog_closed_at) {
    await api.reopenForumTopic(groupChatId, topic).catch(() => undefined)
    await repo.updateClient(client.id, { dialog_closed_at: null })
  }
  try {
    await api.copyMessage(groupChatId, fromChatId, messageId, { message_thread_id: topic })
  } catch (e) {
    if (!threadGone(e)) throw e
    // Тему удалили вручную: создаём новую и повторяем
    await repo.updateClient(client.id, { admin_topic_id: null })
    topic = await ensureTopic(api, repo, groupChatId, { ...client, admin_topic_id: null })
    await api.copyMessage(groupChatId, fromChatId, messageId, { message_thread_id: topic })
  }
}

export type TopicMessage = {
  threadId: number
  messageId: number
  text: string
  hasContent: boolean
  fromId: number | null
  fromName: string
  fromIsBot: boolean
}

/** Сообщение сотрудника в теме клиента. Возвращает, что с ним сделали. */
export async function handleTopicMessage(api: Api, repo: Repo, groupChatId: number, m: TopicMessage): Promise<'ignored' | 'sent' | 'note' | 'closed' | 'failed'> {
  if (m.fromIsBot || !m.hasContent) return 'ignored'
  const client = await repo.findClient({ topicId: m.threadId })
  if (!client) return 'ignored'
  const text = m.text.trim()
  const react = (emoji: string) => api.setMessageReaction(groupChatId, m.messageId, [{ type: 'emoji', emoji } as never]).catch(() => undefined)

  if (/^\/close(@\w+)?$/i.test(text)) {
    await repo.updateClient(client.id, { dialog_closed_at: new Date().toISOString() })
    await api.closeForumTopic(groupChatId, m.threadId).catch(() => undefined)
    return 'closed'
  }
  if (text.startsWith('//')) {
    const note = text.replace(/^\/\/\s*/, '')
    if (note) {
      await repo.insertNote({ lead_id: null, client_id: client.id, author_name: m.fromName || null, author_tg_id: m.fromId, text: note, source: 'admin', tg_chat_id: groupChatId, tg_message_id: m.messageId, reply_to_message_id: null })
      await react('✍')
    }
    return 'note'
  }
  if (text.startsWith('/')) return 'ignored'
  if (!client.tg_user_id) return 'ignored'

  try {
    await api.copyMessage(client.tg_user_id, groupChatId, m.messageId)
  } catch (e) {
    const why = e instanceof Error ? e.message : String(e)
    await api.sendMessage(groupChatId, `Не доставлено клиенту: ${/blocked|deactivated|chat not found/i.test(why) ? 'клиент заблокировал бота или удалил чат' : why.slice(0, 200)}`, { message_thread_id: m.threadId, reply_parameters: { message_id: m.messageId } }).catch(() => undefined)
    return 'failed'
  }
  await repo.insertMessage({ client_id: client.id, direction: 'admin', kind: 'text', text: text || null, tg_chat_id: client.tg_user_id, tg_message_id: null })
  await react('👍')
  return 'sent'
}

// Передача диалога человеку: у каждого клиента своя тема в админ-группе.
//   клиент пишет боту        -> сообщение копируется в его тему;
//   сотрудник пишет в теме   -> бот отправляет клиенту (то же сообщение, включая фото и голосовые);
//   «//текст» в теме         -> внутренняя заметка, клиенту не уходит;
//   «/close» в теме          -> диалог закрыт, тема закрывается.
import { InlineKeyboard, type Api } from 'grammy'
import { UNKNOWN_SERVICE, serviceLabel } from '../catalog'
import { bookingUrl } from '../booking/schedule'
import { clickablePhone } from '../leads/parse'
import { CAPTION_LIMIT, NOT_A_FILE_ERROR, canonicalVideoUrl, errorText, isVideoPageUrl, splitText, youtubeId, youtubeThumb } from '../media'
import type { ClientRow, Repo } from '../repo'
import { TPL_KINDS, fillTemplate, type TemplateKind, type TemplateRow } from '../templates'


const threadGone = (e: unknown) => /message thread not found|TOPIC_DELETED|TOPIC_ID_INVALID|TOPIC_NOT_MODIFIED/i.test(e instanceof Error ? e.message : String(e))

export function topicTitle(c: Pick<ClientRow, 'id' | 'name' | 'tg_username'>) {
  const base = c.name || (c.tg_username ? '' : `Клиент ${c.id.slice(0, 6)}`)
  return `${base}${c.tg_username ? ` (@${c.tg_username})` : ''}`.trim().slice(0, 120) || 'Клиент'
}

export async function cardText(repo: Repo, c: ClientRow) {
  const leads = await repo.listLeads(c.id)
  const lines = [
    `Клиент: ${c.name ?? '—'}${c.tg_username ? ` (@${c.tg_username})` : ''}`,
    c.phone && `Телефон: ${clickablePhone(c.phone)}`,
    c.company && `Компания: ${c.company}`,
    `Язык: ${c.language === 'en' ? 'English' : 'Русский'} · источник: ${c.source ?? '—'}`,
    `Рассылки: ${c.opted_out_at ? 'отписан' : c.consent_at ? 'согласен' : 'согласия нет'}`,
    leads.length ? '\nЗаявки:' : '\nЗаявок пока нет.',
    ...leads.map((l) => `• ${l.service_key && l.service_key !== UNKNOWN_SERVICE ? serviceLabel(l.service_key) : 'заявка'}${l.company ? `, ${l.company}` : ''}${l.comment ? `: ${l.comment.slice(0, 160)}` : ''}`),
    '\nПишите в этой теме, и клиент получит сообщение от студии. Строка с «//» в начале останется внутренней заметкой. /shablon открывает шаблоны, /book отправляет клиенту ссылку на запись, /close закрывает диалог.',
  ]
  return lines.filter(Boolean).join('\n')
}

export async function ensureTopic(api: Api, repo: Repo, groupChatId: number, client: ClientRow): Promise<number> {
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
  if (/^\/book(@\w+)?$/i.test(text)) {
    // личная ссылка на запись: клиенту уходит приглашение, в теме остаётся ссылка (её можно скопировать)
    const url = bookingUrl(client.id)
    if (!client.tg_user_id) {
      await api.sendMessage(groupChatId, `Клиент не писал боту, отправить ему нечего. Личная ссылка на запись:\n${url}`, { message_thread_id: m.threadId, link_preview_options: { is_disabled: true } })
      return 'ignored'
    }
    const en = client.language === 'en'
    const invite = en ? `Pick a convenient time for a meeting with the ST96 studio: ${url}` : `Выберите удобное время для встречи со студией ST96: ${url}`
    try {
      await api.sendMessage(client.tg_user_id, invite, { link_preview_options: { is_disabled: true } })
    } catch (e) {
      const why = e instanceof Error ? e.message : String(e)
      await api.sendMessage(groupChatId, `Не доставлено клиенту: ${/blocked|deactivated|chat not found/i.test(why) ? 'клиент заблокировал бота или удалил чат' : why.slice(0, 200)}\nЛичная ссылка на запись:\n${url}`, { message_thread_id: m.threadId, link_preview_options: { is_disabled: true } }).catch(() => undefined)
      return 'failed'
    }
    await repo.insertMessage({ client_id: client.id, direction: 'admin', kind: 'text', text: invite, tg_chat_id: client.tg_user_id, tg_message_id: null })
    await react('👍')
    await api.sendMessage(groupChatId, `Ссылка на запись отправлена клиенту:\n${url}`, { message_thread_id: m.threadId, link_preview_options: { is_disabled: true } }).catch(() => undefined)
    return 'sent'
  }
  if (/^\/shablon(@\w+)?$/i.test(text)) {
    await showTemplateMenu(api, repo, groupChatId, m.threadId)
    return 'ignored'
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

/** Сообщение сотрудникам в тему клиента (при сбое тем: в общую ленту группы). */
export async function notifyTopic(api: Api, repo: Repo, groupChatId: number, client: ClientRow, text: string) {
  try {
    const topic = client.admin_topic_id ?? (await ensureTopic(api, repo, groupChatId, client))
    await api.sendMessage(groupChatId, text, { message_thread_id: topic })
  } catch (e) {
    console.error('notify failed', e instanceof Error ? e.message : e)
    await api.sendMessage(groupChatId, `${client.name ?? 'Клиент'}${client.tg_username ? ` (@${client.tg_username})` : ''}: ${text}`).catch(() => undefined)
  }
}

const TEMPLATE_MENU_LIMIT = 30

/** /shablon в теме клиента: список шаблонов кнопками (сначала избранные и частые). */
export async function showTemplateMenu(api: Api, repo: Repo, groupChatId: number, threadId: number) {
  const list = (await repo.listTemplates()).slice(0, TEMPLATE_MENU_LIMIT)
  if (!list.length) {
    await api.sendMessage(groupChatId, 'Шаблонов пока нет. Создайте их в админке: раздел «Шаблоны».', { message_thread_id: threadId })
    return
  }
  const kb = new InlineKeyboard()
  for (const t of list) kb.text(`${t.fav ? '★ ' : ''}${t.kind === 'text' ? '' : `[${TPL_KINDS[t.kind]}] `}${t.title}`.slice(0, 60), `tpl:${t.id}`).row()
  await api.sendMessage(groupChatId, 'Какой шаблон отправить клиенту?', { message_thread_id: threadId, reply_markup: kb })
}

export type Content = { kind: TemplateKind; body: string; body_en: string | null; media_url: string | null }

/** Отправка содержимого клиенту с подстановкой переменных; язык клиента учитывается. Возвращает отправленный текст. */
export async function sendContent(api: Api, client: ClientRow, c: Content, footer = ''): Promise<string> {
  if (!client.tg_user_id) throw new Error('у клиента нет Telegram')
  const chat = client.tg_user_id
  const raw = client.language === 'en' && c.body_en ? c.body_en : c.body
  const text = (fillTemplate(raw, client).trim() + footer).trim()
  const sendLong = async (t: string) => { for (const part of splitText(t)) await api.sendMessage(chat, part, { link_preview_options: { is_disabled: true } }) }
  if (c.kind === 'text') {
    await sendLong(text)
    return text
  }
  if (!c.media_url) throw new Error('нет ссылки на файл')
  const url = c.media_url
  // подпись к файлу Telegram ограничивает 1024 символами: длинный текст уходит отдельным сообщением перед файлом
  const caption = text && text.length <= CAPTION_LIMIT ? text : undefined
  if (text && !caption) await sendLong(text)
  const link = canonicalVideoUrl(url)
  const yt = isVideoPageUrl(url) ? youtubeId(link) : null
  const asLink = () => api.sendMessage(chat, [caption, link].filter(Boolean).join('\n'), { link_preview_options: yt ? { is_disabled: true } : { url: link, prefer_large_media: true } })
  if (yt) {
    // YouTube: обложка ролика и кнопка «Смотреть видео» (предпросмотр ссылки медленный и часто упирается в 429)
    try {
      await api.sendPhoto(chat, youtubeThumb(yt), { caption, reply_markup: new InlineKeyboard().url('▶️ Смотреть видео', link) })
    } catch (e) {
      if ((e as { error_code?: number }).error_code === 429) throw e
      await asLink()
    }
  } else if (isVideoPageUrl(url)) await asLink()
  else {
    const extra = { caption }
    try {
      if (c.kind === 'photo') await api.sendPhoto(chat, url, extra)
      else if (c.kind === 'video') await api.sendVideo(chat, url, extra)
      else if (c.kind === 'voice') await api.sendVoice(chat, url, extra)
      else if (c.kind === 'audio') await api.sendAudio(chat, url, extra)
      else await api.sendDocument(chat, url, extra)
    } catch (e) {
      if (!NOT_A_FILE_ERROR.test(errorText(e))) throw e
      await asLink()
    }
  }
  return text
}

/** Отправка шаблона клиенту из темы или с карточки. */
export async function sendTemplate(api: Api, repo: Repo, client: ClientRow, t: TemplateRow): Promise<void> {
  const text = await sendContent(api, client, t)
  await repo.insertMessage({ client_id: client.id, direction: 'admin', kind: t.kind === 'text' ? 'text' : t.kind, text: text || null, tg_chat_id: client.tg_user_id, tg_message_id: null })
  await repo.bumpTemplateUsed(t.id)
}

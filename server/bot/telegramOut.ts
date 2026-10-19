import { InlineKeyboard, type Api } from 'grammy'
import type { Out } from '../funnels/engine'
import type { Repo } from '../repo'
import { notifyTopic } from './dialog'

const keyboard = (buttons?: { text: string; callback_data?: string; url?: string }[][]) => {
  if (!buttons?.length) return undefined
  const kb = new InlineKeyboard()
  for (const row of buttons) {
    for (const b of row) (b.url ? kb.url(b.text, b.url) : kb.text(b.text, b.callback_data ?? ''))
    kb.row()
  }
  return kb
}

/** Отправка из воронок через Telegram. */
export function telegramOut(api: Api, repo: Repo, groupChatId: number | null): Out {
  return {
    async sendText(chatId, text, buttons) {
      await api.sendMessage(chatId, text, { reply_markup: keyboard(buttons), link_preview_options: { is_disabled: true } })
    },
    async sendMedia(chatId, kind, url, caption, buttons) {
      const extra = { caption, reply_markup: keyboard(buttons) }
      if (kind === 'image') await api.sendPhoto(chatId, url, extra)
      else if (kind === 'video') await api.sendVideo(chatId, url, extra)
      else if (kind === 'audio') await api.sendAudio(chatId, url, extra)
      else await api.sendDocument(chatId, url, extra)
    },
    async notifyAdmins(client, text) {
      if (groupChatId) await notifyTopic(api, repo, groupChatId, client, text)
    },
  }
}

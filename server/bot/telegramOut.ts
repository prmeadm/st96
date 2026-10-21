import { InlineKeyboard, type Api } from 'grammy'
import type { Out } from '../funnels/engine'
import type { Repo } from '../repo'
import { NOT_A_FILE_ERROR, errorText, isVideoPageUrl } from '../media'
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
      // страница YouTube и подобных сервисов: файл по ней не получить, отправляем ссылкой с предпросмотром плеера
      const asLink = () => api.sendMessage(chatId, [caption, url].filter(Boolean).join('\n'), { reply_markup: keyboard(buttons), link_preview_options: { url, prefer_large_media: true } }).then(() => undefined)
      if (isVideoPageUrl(url)) return asLink()
      const extra = { caption, reply_markup: keyboard(buttons) }
      try {
        if (kind === 'image') await api.sendPhoto(chatId, url, extra)
        else if (kind === 'video') await api.sendVideo(chatId, url, extra)
        else if (kind === 'audio') await api.sendAudio(chatId, url, extra)
        else await api.sendDocument(chatId, url, extra)
      } catch (e) {
        if (!NOT_A_FILE_ERROR.test(errorText(e))) throw e
        await asLink() // по ссылке не файл: клиент всё равно получает материал
      }
    },
    async notifyAdmins(client, text) {
      if (groupChatId) await notifyTopic(api, repo, groupChatId, client, text)
    },
  }
}

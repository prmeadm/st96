import { InlineKeyboard, type Api } from 'grammy'
import type { Out } from '../funnels/engine'
import type { Repo } from '../repo'
import { NOT_A_FILE_ERROR, errorText, isVideoPageUrl } from '../media'
import { notifyTopic } from './dialog'

const keyboard = (buttons?: { text: string; callback_data?: string; url?: string }[][]) => {
  if (!buttons?.length) return undefined
  const kb = new InlineKeyboard()
  let n = 0
  for (const row of buttons) {
    // кнопка без адреса и без данных Telegram отвергает вместе со всем сообщением («Text buttons are not allowed»): такие пропускаем
    const ok = row.filter((b) => b.text.trim() && (b.url || b.callback_data))
    for (const b of ok) { if (b.url) kb.url(b.text, b.url); else kb.text(b.text, b.callback_data!); n++ }
    if (ok.length) kb.row()
  }
  return n ? kb : undefined
}

/** Если Telegram не принял клавиатуру (кривая кнопка), сообщение всё равно уходит клиенту, без кнопок. */
const KEYBOARD_ERROR = /can't parse (InlineKeyboardButton|reply markup)|BUTTON_[A-Z_]+_INVALID|Text buttons are not allowed|reply markup/i
async function withKeyboardFallback(send: (markup: ReturnType<typeof keyboard>) => Promise<unknown>, markup: ReturnType<typeof keyboard>) {
  try {
    await send(markup)
  } catch (e) {
    if (!markup || !KEYBOARD_ERROR.test(errorText(e))) throw e
    console.error('keyboard rejected, resending without buttons:', errorText(e).slice(0, 160))
    await send(undefined)
  }
}

/** Отправка из воронок через Telegram. */
export function telegramOut(api: Api, repo: Repo, groupChatId: number | null): Out {
  return {
    async sendText(chatId, text, buttons) {
      await withKeyboardFallback((markup) => api.sendMessage(chatId, text, { reply_markup: markup, link_preview_options: { is_disabled: true } }), keyboard(buttons))
    },
    async sendMedia(chatId, kind, url, caption, buttons) {
      const kb = keyboard(buttons)
      // страница YouTube и подобных сервисов: файл по ней не получить, отправляем ссылкой с предпросмотром плеера
      const asLink = () => withKeyboardFallback((markup) => api.sendMessage(chatId, [caption, url].filter(Boolean).join('\n'), { reply_markup: markup, link_preview_options: { url, prefer_large_media: true } }), kb)
      if (isVideoPageUrl(url)) return asLink()
      try {
        await withKeyboardFallback((markup) => {
          const extra = { caption, reply_markup: markup }
          if (kind === 'image') return api.sendPhoto(chatId, url, extra)
          if (kind === 'video') return api.sendVideo(chatId, url, extra)
          if (kind === 'audio') return api.sendAudio(chatId, url, extra)
          return api.sendDocument(chatId, url, extra)
        }, kb)
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

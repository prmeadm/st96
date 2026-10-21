import { InlineKeyboard, type Api } from 'grammy'
import type { Out } from '../funnels/engine'
import type { Repo } from '../repo'
import { NOT_A_FILE_ERROR, canonicalVideoUrl, errorText, firstVideoUrl, isVideoPageUrl } from '../media'
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

const realSleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))
const MIN_GAP_MS = 800 // Telegram: около одного сообщения в секунду в один чат, иначе 429
const MAX_WAIT_MS = 9000 // дольше ждать нельзя: вебхук должен ответить за 25 с

/** Отправка из воронок через Telegram. */
export function telegramOut(api: Api, repo: Repo, groupChatId: number | null, opts: { sleep?: (ms: number) => Promise<void> } = {}): Out {
  const sleep = opts.sleep ?? realSleep
  const last = new Map<number, number>()
  // Не чаще раза в 0,8 с в один чат; на 429 («подождите N секунд») ждём и повторяем, иначе сообщение терялось бы насовсем
  const paced = async <T>(chatId: number, send: () => Promise<T>): Promise<T> => {
    for (let attempt = 0; ; attempt++) {
      const wait = (last.get(chatId) ?? 0) + MIN_GAP_MS - Date.now()
      if (wait > 0) await sleep(wait)
      try {
        const r = await send()
        last.set(chatId, Date.now())
        return r
      } catch (e) {
        const retry = (e as { error_code?: number; parameters?: { retry_after?: number } })
        if (retry.error_code !== 429 || attempt >= 2) throw e
        const ms = Math.min(((retry.parameters?.retry_after ?? 3) + 0.5) * 1000, MAX_WAIT_MS)
        console.error(`telegram 429, waiting ${ms} ms before retry`)
        await sleep(ms)
        last.set(chatId, Date.now())
      }
    }
  }
  return {
    async sendText(chatId, text, buttons) {
      // ссылка на видео прямо в тексте: показываем плеер (для остальных ссылок предпросмотр отключён)
      const video = firstVideoUrl(text)
      const preview = video ? { url: canonicalVideoUrl(video), prefer_large_media: true } : { is_disabled: true }
      await paced(chatId, () => withKeyboardFallback((markup) => api.sendMessage(chatId, text, { reply_markup: markup, link_preview_options: preview }), keyboard(buttons)))
    },
    async sendMedia(chatId, kind, url, caption, buttons) {
      const kb = keyboard(buttons)
      // страница YouTube и подобных сервисов: файл по ней не получить, отправляем ссылкой с предпросмотром плеера
      const link = canonicalVideoUrl(url)
      const asLink = () => paced(chatId, () => withKeyboardFallback((markup) => api.sendMessage(chatId, [caption, link].filter(Boolean).join('\n'), { reply_markup: markup, link_preview_options: { url: link, prefer_large_media: true } }), kb))
      if (isVideoPageUrl(url)) return asLink()
      try {
        await paced(chatId, () => withKeyboardFallback((markup) => {
          const extra = { caption, reply_markup: markup }
          if (kind === 'image') return api.sendPhoto(chatId, url, extra)
          if (kind === 'video') return api.sendVideo(chatId, url, extra)
          if (kind === 'audio') return api.sendAudio(chatId, url, extra)
          return api.sendDocument(chatId, url, extra)
        }, kb))
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

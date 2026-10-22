import { InlineKeyboard, type Api } from 'grammy'
import type { Btn, Out } from '../funnels/engine'
import { RetryLaterError } from '../funnels/retry'
import type { Repo } from '../repo'
import { CAPTION_LIMIT, NOT_A_FILE_ERROR, canonicalVideoUrl, errorText, firstVideoUrl, isVideoPageUrl, splitText, youtubeId, youtubeThumb } from '../media'
import { notifyTopic } from './dialog'

type Markup = InlineKeyboard | undefined

export const keyboard = (buttons?: Btn[][]): Markup => {
  if (!buttons?.length) return undefined
  const kb = new InlineKeyboard()
  let n = 0
  for (const row of buttons) {
    // кнопка без адреса и без данных Telegram отвергает вместе со всем сообщением («Text buttons are not allowed»): такие пропускаем
    const ok = row.filter((b) => b.text.trim() && (b.url || b.callback_data))
    for (const b of ok) { if (b.url) kb.url(b.text.slice(0, 64), b.url); else kb.text(b.text.slice(0, 64), b.callback_data!); n++ }
    if (ok.length) kb.row()
  }
  return n ? kb : undefined
}

/** Если Telegram не принял клавиатуру (кривая кнопка), сообщение всё равно уходит клиенту, без кнопок. */
const KEYBOARD_ERROR = /can't parse (InlineKeyboardButton|reply markup)|BUTTON_[A-Z_]+_INVALID|Text buttons are not allowed|reply markup/i
async function withKeyboardFallback(send: (markup: Markup) => Promise<unknown>, markup: Markup) {
  try {
    await send(markup)
  } catch (e) {
    if (!markup || !KEYBOARD_ERROR.test(errorText(e))) throw e
    console.error('keyboard rejected, resending without buttons:', errorText(e).slice(0, 160))
    await send(undefined)
  }
}

const realSleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))
const MIN_GAP_MS = 800 // Telegram: около одного сообщения в секунду в один чат
const BUDGET_MS = 15_000 // сколько этот запрос может ждать Telegram; дальше воронка продолжится по расписанию
const is429 = (e: unknown) => (e as { error_code?: number }).error_code === 429
const retryAfterMs = (e: unknown) => (((e as { parameters?: { retry_after?: number } }).parameters?.retry_after ?? 5) + 0.5) * 1000

/** Отправка из воронок через Telegram. */
export function telegramOut(api: Api, repo: Repo, groupChatId: number | null, opts: { sleep?: (ms: number) => Promise<void>; budgetMs?: number } = {}): Out {
  const sleep = opts.sleep ?? realSleep
  const deadline = Date.now() + (opts.budgetMs ?? BUDGET_MS)
  const last = new Map<number, number>()

  // Не чаще раза в 0,8 с в один чат. На 429 ждём, если укладываемся в бюджет запроса, иначе RetryLaterError:
  // движок сохранит место в воронке и продолжит позже, сообщение не теряется.
  const paced = async <T>(chatId: number, send: () => Promise<T>): Promise<T> => {
    for (let attempt = 0; ; attempt++) {
      const wait = (last.get(chatId) ?? 0) + MIN_GAP_MS - Date.now()
      if (wait > 0) await sleep(wait)
      try {
        const r = await send()
        last.set(chatId, Date.now())
        return r
      } catch (e) {
        if (!is429(e)) throw e
        const ms = retryAfterMs(e)
        if (attempt >= 1 || Date.now() + ms > deadline) throw new RetryLaterError(ms, errorText(e))
        console.error(`telegram 429, waiting ${ms} ms before retry`)
        await sleep(ms)
        last.set(chatId, Date.now())
      }
    }
  }

  const sendPlain = async (chatId: number, text: string, kb: Markup, preview: { url: string; prefer_large_media: true } | { is_disabled: true }) => {
    const chunks = splitText(text)
    for (let i = 0; i < chunks.length; i++) {
      const last = i === chunks.length - 1
      await paced(chatId, () => withKeyboardFallback((markup) => api.sendMessage(chatId, chunks[i]!, { reply_markup: last ? markup : undefined, link_preview_options: last ? preview : { is_disabled: true } }), last ? kb : undefined))
    }
  }

  type Preview = { url: string; prefer_large_media: true; show_above_text: true }
  /**
   * Текст длиннее подписи (1024): одно сообщение, где картинка стоит над текстом (предпросмотр ссылки на файл, до 4096 знаков).
   * Если Telegram не построит предпросмотр, отправляем файл, а сразу под ним текст: порядок «медиа сверху» сохраняется.
   */
  const sendAbove = async (chatId: number, previewUrl: string, text: string, kb: Markup, sendFile: () => Promise<unknown>) => {
    if (text.length <= 4096) {
      try {
        const preview: Preview = { url: previewUrl, prefer_large_media: true, show_above_text: true }
        await paced(chatId, () => withKeyboardFallback((markup) => api.sendMessage(chatId, text, { reply_markup: markup, link_preview_options: preview }), kb))
        return
      } catch (e) {
        if (e instanceof RetryLaterError) throw e
        console.error('media-above-text preview failed, sending file then text:', errorText(e).slice(0, 160))
      }
    }
    await paced(chatId, sendFile)
    await sendPlain(chatId, text, kb, { is_disabled: true })
  }

  /** Ссылка на видео (YouTube, Vimeo, Rutube...): файл по ней получить нельзя. */
  const sendVideoLink = async (chatId: number, url: string, caption: string | undefined, kb: Markup) => {
    const link = canonicalVideoUrl(url)
    const yt = youtubeId(link)
    if (yt) {
      // YouTube: обложка ролика (подпись — текст блока) и кнопка «Смотреть видео». Предпросмотр ссылки YouTube Telegram строит
      // долго и часто отвечает 429, а у роликов с запретом встраивания плеера в Telegram всё равно нет.
      const watch = new InlineKeyboard().url('▶️ Смотреть видео', link).row()
      const merged = kb ? InlineKeyboard.from([...watch.inline_keyboard, ...kb.inline_keyboard]) : watch
      const cover = youtubeThumb(yt)
      if (caption && caption.length > CAPTION_LIMIT) return sendAbove(chatId, cover, caption, merged, () => api.sendPhoto(chatId, cover))
      try {
        await paced(chatId, () => withKeyboardFallback((markup) => api.sendPhoto(chatId, cover, { caption, reply_markup: markup }), merged))
        return
      } catch (e) {
        if (e instanceof RetryLaterError) throw e
        console.error('youtube cover failed, sending plain link:', errorText(e).slice(0, 160))
      }
      await sendPlain(chatId, [caption, `▶️ ${link}`].filter(Boolean).join('\n'), merged, { is_disabled: true })
      return
    }
    try {
      await sendPlain(chatId, [caption, link].filter(Boolean).join('\n'), kb, { url: link, prefer_large_media: true })
    } catch (e) {
      if (!(e instanceof RetryLaterError)) throw e
      // предпросмотр не построился вовремя: та же ссылка без предпросмотра
      console.error('video link preview throttled, sending without preview')
      await sendPlain(chatId, [caption, link].filter(Boolean).join('\n'), kb, { is_disabled: true })
    }
  }

  return {
    async sendText(chatId, text, buttons) {
      if (!text.trim()) return
      const video = firstVideoUrl(text)
      const kb = keyboard(buttons)
      if (video && !youtubeId(video)) {
        try {
          await sendPlain(chatId, text, kb, { url: canonicalVideoUrl(video), prefer_large_media: true })
          return
        } catch (e) {
          if (!(e instanceof RetryLaterError)) throw e
        }
      }
      // ссылки на YouTube в тексте остаются кликабельными; предпросмотр выключен (он медленный и часто упирается в 429)
      await sendPlain(chatId, text, kb, { is_disabled: true })
    },
    async sendMedia(chatId, kind, url, caption, buttons) {
      const kb = keyboard(buttons)
      if (isVideoPageUrl(url)) return sendVideoLink(chatId, url, caption, kb)
      const file = (cap: string | undefined, markup: Markup) => {
        const extra = { caption: cap, reply_markup: markup }
        if (kind === 'image') return api.sendPhoto(chatId, url, extra)
        if (kind === 'video') return api.sendVideo(chatId, url, extra)
        if (kind === 'audio') return api.sendAudio(chatId, url, extra)
        return api.sendDocument(chatId, url, extra)
      }
      try {
        // фото и видео над текстом в одном сообщении: текст идёт подписью (Telegram даёт подписи до 1024 знаков)
        if (caption && caption.length > CAPTION_LIMIT) return await sendAbove(chatId, url, caption, kb, () => file(undefined, undefined))
        await paced(chatId, () => withKeyboardFallback((markup) => file(caption, markup), kb))
      } catch (e) {
        if (!NOT_A_FILE_ERROR.test(errorText(e))) throw e
        await sendVideoLink(chatId, url, caption, kb) // по ссылке не файл: клиент всё равно получает материал ссылкой
      }
    },
    async notifyAdmins(client, text) {
      if (groupChatId) await notifyTopic(api, repo, groupChatId, client, text)
    },
  }
}

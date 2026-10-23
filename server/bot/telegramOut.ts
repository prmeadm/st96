import { InlineKeyboard, InputFile, type Api } from 'grammy'
import type { Btn, Out } from '../funnels/engine'
import { RetryLaterError } from '../funnels/retry'
import type { Repo } from '../repo'
import { CAPTION_LIMIT, NOT_A_FILE_ERROR, canonicalVideoUrl, mp4Info, youtubeEmbeddable, errorText, firstVideoUrl, isVideoPageUrl, splitText, youtubeId, youtubeThumb } from '../media'
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
async function withKeyboardFallback<T>(send: (markup: Markup) => Promise<T>, markup: Markup): Promise<T> {
  try {
    return await send(markup)
  } catch (e) {
    if (!markup || !KEYBOARD_ERROR.test(errorText(e))) throw e
    console.error('keyboard rejected, resending without buttons:', errorText(e).slice(0, 160))
    return await send(undefined)
  }
}

const realSleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))
const MIN_GAP_MS = 800 // Telegram: около одного сообщения в секунду в один чат
const VIDEO_NOTE_MAX_BYTES = 12 * 1024 * 1024
const BUDGET_MS = 15_000 // сколько этот запрос может ждать Telegram; дальше воронка продолжится по расписанию
const is429 = (e: unknown) => (e as { error_code?: number }).error_code === 429
const retryAfterMs = (e: unknown) => (((e as { parameters?: { retry_after?: number } }).parameters?.retry_after ?? 5) + 0.5) * 1000

/** Отправка из воронок через Telegram. */
/** Наш плеер YouTube для мини-приложения Telegram (public/yt.html), с временем старта из ссылки, если оно есть. */
function watchPage(link: string, id: string): string {
  const t = new URL(link).searchParams.get('t')?.replace(/s$/, '')
  return `https://st96.by/yt.html?v=${id}${t && /^\d+$/.test(t) ? `&t=${t}` : ''}`
}

async function downloadFile(url: string): Promise<Uint8Array> {
  const r = await fetch(url)
  if (!r.ok) throw new Error(`video note download failed: ${r.status}`)
  return new Uint8Array(await r.arrayBuffer())
}

export function telegramOut(api: Api, repo: Repo, groupChatId: number | null, opts: { sleep?: (ms: number) => Promise<void>; budgetMs?: number; embeddable?: (youtubeId: string) => Promise<boolean>; download?: (url: string) => Promise<Uint8Array> } = {}): Out {
  const embeddable = opts.embeddable ?? youtubeEmbeddable
  const download = opts.download ?? downloadFile
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
    if (yt && (await embeddable(yt))) {
      // Встраивание разрешено: одно сообщение, плеер YouTube над текстом, видео играет прямо в Telegram (текст до 4096 знаков).
      // Ссылка стоит и в самом тексте (невидимый символ со ссылкой в начале). Одна попытка со ссылкой watch: если Telegram
      // не может построить плеер, он отвечает 429, и мы это видим. Другие виды ссылки (youtu.be) не пробуем: на них Telegram
      // молча отправлял сообщение вовсе без видео (так было с закрытым по ссылке Shorts 4d_aLiguxss). Тогда уходит обложка,
      // её кнопка открывает ролик внутри Telegram.
      const body = caption?.trim() ? caption : link
      if (body.length < 4096) {
        const text = `\u2060${body}`
        const gap = (last.get(chatId) ?? 0) + MIN_GAP_MS - Date.now()
        if (gap > 0) await sleep(gap)
        try {
          await withKeyboardFallback((markup) => api.sendMessage(chatId, text, { entities: [{ type: 'text_link', offset: 0, length: 1, url: link }], reply_markup: markup, link_preview_options: { url: link, prefer_large_media: true, show_above_text: true } }), kb)
          last.set(chatId, Date.now())
          return
        } catch (e) {
          last.set(chatId, Date.now())
          console.error('youtube player preview failed, sending cover:', errorText(e).slice(0, 160))
        }
      }
    }
    if (yt) {
      // Обложка ролика и кнопка «Смотреть видео». Если встраивание разрешено, кнопка открывает наш плеер st96.by/yt.html
      // как мини-приложение Telegram: ролик играет внутри Telegram. Иначе остаётся только ссылка на YouTube.
      const watch = (await embeddable(yt) ? new InlineKeyboard().webApp('▶️ Смотреть видео', watchPage(link, yt)) : new InlineKeyboard().url('▶️ Смотреть видео', link)).row()
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
      if (kind === 'videonote') {
        // Кружок Telegram принимает только загруженным файлом (по ссылке нельзя): бот скачивает его и загружает сам.
        // Диаметр и длительность передаём явно: без них Telegram показывает запись из браузера обычным квадратным видео.
        // Подписи у кружка нет, поэтому текст (если он есть) уходит следующим сообщением под кружком, вместе с кнопками.
        try {
          const bytes = await download(url)
          // Telegram принимает кружки до 12 МБ (ошибка «too big for a video note»): тяжёлый файл сразу уходит обычным видео
          if (bytes.byteLength > VIDEO_NOTE_MAX_BYTES) throw new Error(`video note file is ${bytes.byteLength} bytes, Telegram limit is ${VIDEO_NOTE_MAX_BYTES}`)
          const info = mp4Info(bytes)
          const extra = {
            length: info ? Math.min(info.width, info.height) : 480,
            ...(info && info.duration > 0 ? { duration: Math.min(60, Math.round(info.duration)) } : {}),
          }
          const sent = await paced(chatId, () => withKeyboardFallback((markup) => api.sendVideoNote(chatId, new InputFile(bytes, 'videonote.mp4'), { ...extra, reply_markup: caption ? undefined : markup }), kb))
          if (sent && typeof sent === 'object' && !('video_note' in sent)) console.error('video note delivered as a regular video:', JSON.stringify({ url, info }))
        } catch (e) {
          if (e instanceof RetryLaterError) throw e
          // не квадрат, не MP4 или файл недоступен: клиент всё равно получает видео, обычным сообщением
          console.error('video note rejected, sending as a regular video:', errorText(e).slice(0, 160))
          await paced(chatId, () => withKeyboardFallback((markup) => api.sendVideo(chatId, url, { reply_markup: caption ? undefined : markup }), kb))
        }
        if (caption) await sendPlain(chatId, caption, kb, { is_disabled: true })
        return
      }
      const file = (cap: string | undefined, markup: Markup): Promise<unknown> => {
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

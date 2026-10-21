/** Страницы видеосервисов нельзя отправить как видеофайл: Telegram принимает только прямую ссылку на файл. Их отправляем ссылкой, Telegram сам покажет плеер. */
const VIDEO_HOSTS = /^(?:www\.|m\.|music\.)?(?:youtube\.com|youtu\.be|youtube-nocookie\.com|vimeo\.com|player\.vimeo\.com|rutube\.ru|vkvideo\.ru|dailymotion\.com|dai\.ly|twitch\.tv)$/i

export function isVideoPageUrl(raw: string): boolean {
  try {
    const u = new URL(raw.trim())
    if (!/^https?:$/.test(u.protocol)) return false
    if (VIDEO_HOSTS.test(u.hostname)) return true
    return /^(?:www\.|m\.)?(?:vk\.com|vk\.ru|ok\.ru)$/i.test(u.hostname) && /\/video/i.test(u.pathname)
  } catch {
    return false
  }
}

/** Ошибки Telegram, когда по ссылке лежит не файл нужного вида (страница сайта, закрытый доступ и т.п.). */
export const NOT_A_FILE_ERROR = /wrong type of the web page content|failed to get HTTP URL content|wrong file identifier|wrong HTTP URL|wrong remote file identifier|IMAGE_PROCESS_FAILED/i

export const errorText = (e: unknown) => (e instanceof Error ? e.message : String(e))

/** Первая ссылка на видеосервис внутри текста (для предпросмотра плеера). */
export function firstVideoUrl(text: string): string | null {
  for (const m of text.matchAll(/https?:\/\/[^\s<>"']+/gi)) {
    const url = m[0].replace(/[.,;:!?)\]]+$/, '')
    if (isVideoPageUrl(url)) return url
  }
  return null
}

/** Ссылка YouTube без лишнего (si=, feature=, utm_*): остаются видео и время старта. Остальные адреса не меняем. */
export function canonicalVideoUrl(raw: string): string {
  try {
    const u = new URL(raw.trim())
    const host = u.hostname.replace(/^(www\.|m\.|music\.)/i, '').toLowerCase()
    let id = ''
    if (host === 'youtu.be') id = u.pathname.split('/')[1] ?? ''
    else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
      if (u.pathname === '/watch') id = u.searchParams.get('v') ?? ''
      else {
        const m = u.pathname.match(/^\/(shorts|embed|live|v)\/([\w-]{11})/)
        if (m) id = m[2]!
      }
    }
    if (!/^[\w-]{11}$/.test(id)) return raw.trim()
    const t = u.searchParams.get('t') ?? u.searchParams.get('start')
    return `https://www.youtube.com/watch?v=${id}${t && /^\d+s?$/.test(t) ? `&t=${t}` : ''}`
  } catch {
    return raw.trim()
  }
}

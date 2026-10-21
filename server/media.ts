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

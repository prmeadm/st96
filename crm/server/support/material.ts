// Материалы для правок: нужен ли от клиента файл (фото/документ) и текст-запрос.
// Агент не двигается дальше, пока клиент не пришлёт материал, и не ищет его в интернете.
import type { SupportAttachment } from './types'

const ACTION = /размест|добав|встав|загру|постав|помест|замен|обнов|внедр|прикрут|кинь|кида|подстав|вмонтир|сгенерир/
const OBJECT = /фото|фотограф|фотк|картинк|картиночк|изображени|логотип|лого|котик|кошк|файл|документ|видео|ролик|баннер|иконк|пикч|картин/

/** Нужен ли от клиента материал (фото/файл), которого нет в обращении. */
export function needsMaterial(text: string, attachments: SupportAttachment[]): boolean {
  const t = (text ?? '').toLowerCase()
  if (!t) return false
  if (attachments.length > 0) return false // материал уже прислан
  return ACTION.test(t) && OBJECT.test(t)
}

/** Детерминированный запрос материала у клиента. */
export function materialAskText(): string {
  return 'Чтобы внести правку, мне нужны материалы от тебя. Пришли, пожалуйста:\n— что именно и куда разместить (страница, блок, место);\n— сам файл: фото, картинку, текст или документ.\n\nБез файла я не начну — ничего искать в интернете не буду, работаю только с тем, что ты пришлёшь.'
}

const MIME_EXT: Record<string, string> = {
  'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif',
  'application/pdf': '.pdf', 'application/msword': '.doc', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'text/plain': '.txt',
}

/** Имя файла вложения для сохранения в workspace (по имени или mime). */
export function attachmentFileName(a: SupportAttachment, index: number): string {
  if (a.file_name) return a.file_name
  const ext = a.mime_type ? MIME_EXT[a.mime_type] ?? '' : ''
  return 'material-' + (index + 1) + ext
}

/** Текст обращения, даже если оно было голосовым (расшифровка лежит в result_json). */
export function effectiveRequestText(job: { request_text: string; result_json: Record<string, unknown> | null }): string {
  const rj = job.result_json
  const fromJson = typeof rj?.request_text === 'string' ? rj.request_text : (typeof rj?.transcript === 'string' ? rj.transcript : '')
  return (fromJson || job.request_text || '').trim()
}

/** Краткое описание вложений (для промпта/аудита). */
export function attachmentsSummary(attachments: SupportAttachment[]): string {
  return attachments.map((a, i) => (i + 1) + '. ' + (a.kind === 'photo' ? 'фото' : 'документ') + (a.file_name ? ' («' + a.file_name + '»)' : '') + (a.caption ? ' — подпись: ' + a.caption : '')).join('\n')
}

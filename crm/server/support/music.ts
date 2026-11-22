import type { SupportAttachment } from './types'

/** Ответ эмодзи, когда клиент прислал музыку. */
export const MUSIC_REPLY = '\u{1F64C} \u{1F57A} \u{1F483} \u{1F646} \u{1F645}\u{200D}\u{2640}\u{FE0F} \u{1F481} \u{1F481}\u{200D}\u{2642}\u{FE0F} \u{1F916} \u{1F973} \u{1F494}'

/** Есть ли среди вложений аудио (музыка). */
export function hasAudioAttachment(attachments: SupportAttachment[] | null | undefined): boolean {
  return (attachments ?? []).some((a) => a && a.kind === 'audio')
}

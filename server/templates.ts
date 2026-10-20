import { bookingUrl } from './booking/schedule'
import { SITE_SERVICES } from './catalog'
// Шаблоны сообщений: общие типы и константы для админки и бота.
export type TemplateKind = 'text' | 'photo' | 'video' | 'voice' | 'audio' | 'file'
export type TemplateRow = {
  id: string
  kind: TemplateKind
  title: string
  body: string
  body_en: string | null
  media_url: string | null
  task: string
  goal: string
  services: string[]
  fav: boolean
  used: number
  updated_at: string
}

export const TPL_KINDS: Record<TemplateKind, string> = { text: 'Текст', photo: 'Фото', video: 'Видео', voice: 'Голос', audio: 'Аудио', file: 'Файл' }
export const TPL_TASKS = ['Первое касание', 'Напоминание', 'Дожим', 'После встречи', 'Ответ на вопрос', 'Рассылка']
export const TPL_GOALS = ['Привлечь заявку', 'Прогреть', 'Записать на встречу', 'Вернуть клиента', 'Собрать отзыв', 'Информировать']
/** «Общее» — для любой услуги; остальные названия услуг берутся с сайта */
export const TPL_GENERAL = 'Общее'
export const TPL_SERVICES = [TPL_GENERAL, ...SITE_SERVICES.map((s) => s.ru)]
export const TPL_VARS = ['{имя}', '{компания}', '{ник}', '{запись}']

/** Подстановка переменных клиента; та же, что в воронках */
export const fillTemplate = (text: string, c: { id?: string; name: string | null; tg_username: string | null; company: string | null }) =>
  text
    .replace(/\{имя\}|\{name\}/gi, c.name || c.tg_username || '')
    .replace(/\{компания\}|\{company\}/gi, c.company ?? '')
    .replace(/\{ник\}/gi, c.tg_username ? `@${c.tg_username}` : '')
    .replace(/\{запись\}|\{booking\}/gi, bookingUrl(c.id))

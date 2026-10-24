import { SITE_SERVICES } from '../../server/catalog'
import type { InterestKey } from '../../server/leads/interests'

export { INTERESTS } from '../../server/leads/interests'

export type Client = {
  id: string
  tg_user_id: number | null
  tg_username: string | null
  name: string | null
  phone: string | null
  email: string | null
  company: string | null
  language: 'ru' | 'en'
  source: string | null
  consent_at: string | null
  opted_out_at: string | null
  admin_topic_id: number | null
  created_at: string
  last_seen_at: string | null
}

export type Lead = {
  id: string
  client_id: string | null
  source: string
  service_key: string | null
  title: string | null
  topic: string | null
  status: 'new' | 'in_progress' | 'won' | 'lost' | 'spam'
  interests: InterestKey[]
  name: string | null
  phone: string | null
  telegram: string | null
  email: string | null
  company: string | null
  comment: string | null
  warnings: string[]
  created_at: string
}

export type Note = {
  id: string
  client_id: string | null
  lead_id: string | null
  text: string
  author_name: string | null
  source: string
  created_at: string
}

export type Msg = { id: number; direction: 'in' | 'out' | 'admin'; kind: string; text: string | null; created_at: string }

/** Услуги только с сайта (src/data/services.ts): ключ → название */
export const SERVICES: Record<string, string> = Object.fromEntries(SITE_SERVICES.map((s) => [s.key, s.ru]))
export const STATUSES: Record<Lead['status'], string> = { new: 'Новая', in_progress: 'В работе', won: 'Выиграна', lost: 'Проиграна', spam: 'Спам' }
export const SOURCES: Record<string, string> = { site_form: 'Сайт', stand_form: 'Стенд', tg_group: 'Группа', bot: 'Бот', manual: 'Вручную' }
export const WARNINGS: Record<string, string> = {
  phone_in_name: 'телефон был в поле «Имя»', phone_in_company: 'телефон был в поле «Компания»', phone_in_telegram: 'телефон был в поле Telegram',
  telegram_in_name: 'ник был в поле «Имя»', telegram_in_phone: 'ник был в поле «Телефон»', telegram_in_company: 'ник был в поле «Компания»',
  phone_from_comment: 'телефон взят из комментария', telegram_from_comment: 'ник взят из комментария',
  phone_unrecognized: 'телефон не распознан', telegram_unrecognized: 'ник не распознан', no_name: 'нет имени', no_contact: 'нет контактов',
}

export const fmtDate = (s: string | null) =>
  s ? new Date(s).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'

export const clientTitle = (c: Pick<Client, 'name' | 'tg_username' | 'phone' | 'email'>) =>
  c.name || (c.tg_username ? `@${c.tg_username}` : c.phone || c.email || 'Без имени')

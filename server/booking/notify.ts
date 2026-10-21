// Уведомления о записи: администраторам (с кнопками решения) и клиенту (подтверждение с файлом календаря, напоминание).
import { clickablePhone } from '../leads/parse'
import { InlineKeyboard, InputFile, type Api } from 'grammy'
import { serviceLabel } from '../catalog'
import type { ClientRow, Repo } from '../repo'
import { buildIcs } from './ics'
import { FORMAT_LABEL, bookingUrl, whenLabel } from './schedule'
import { loadDirectAdmins } from './service'
import type { BookingRow } from './types'

export { whenLabel }
const minutes = (b: BookingRow) => Math.round((Date.parse(b.ends_at) - Date.parse(b.starts_at)) / 60_000)

export function adminText(b: BookingRow): string {
  return [
    '📅 Новая заявка на встречу',
    `Когда: ${whenLabel(b.starts_at)}, ${minutes(b)} мин`,
    `Услуга: ${serviceLabel(b.service, 'ru')} · ${FORMAT_LABEL[b.format].ru}`,
    `Клиент: ${b.name}${b.company ? `, ${b.company}` : ''}`,
    `Контакты: ${[b.telegram, b.phone && clickablePhone(b.phone)].filter(Boolean).join(' · ') || '—'}`,
    b.goal && `Цель: ${b.goal}`,
    b.comment && `Комментарий: ${b.comment}`,
  ].filter(Boolean).join('\n')
}

/** Заявка на встречу: в рабочую группу и лично администраторам из настроек (по нику; им нужно один раз запустить бота). Возвращает, кому не удалось отправить. */
export async function notifyAdminsNewBooking(api: Api, groupChatId: number | null, b: BookingRow, repo?: Repo): Promise<{ failed: string[] }> {
  const kb = new InlineKeyboard().text('✅ Подтвердить', `bk:ok:${b.id}`).text('✖ Отклонить', `bk:no:${b.id}`)
  const failed: string[] = []
  if (groupChatId) await api.sendMessage(groupChatId, adminText(b), { reply_markup: kb })
  if (repo) {
    for (const nick of await loadDirectAdmins(repo)) {
      const admin = await repo.findClient({ username: nick }).catch(() => null)
      if (!admin?.tg_user_id) { failed.push(`@${nick}`); continue }
      await api.sendMessage(admin.tg_user_id, adminText(b), { reply_markup: kb }).catch(() => { failed.push(`@${nick}`) })
    }
  }
  return { failed }
}

async function chatOf(repo: Repo, b: BookingRow): Promise<{ client: ClientRow; chat: number } | null> {
  if (!b.client_id) return null
  const client = await repo.findClientById(b.client_id)
  return client?.tg_user_id ? { client, chat: client.tg_user_id } : null
}

/** Клиенту: подтверждение (с файлом календаря) или вежливый отказ с ссылкой выбрать другое время. */
export async function notifyClientDecision(api: Api, repo: Repo, b: BookingRow): Promise<boolean> {
  const c = await chatOf(repo, b)
  if (!c) return false
  const lang = c.client.language === 'en' ? 'en' : 'ru'
  const when = whenLabel(b.starts_at, lang)
  if (b.status === 'confirmed') {
    const meet = b.meet_url ? (lang === 'en' ? `\nLink: ${b.meet_url}` : `\nСсылка на встречу: ${b.meet_url}`) : b.format === 'video' ? (lang === 'en' ? '\nWe will send the video call link separately.' : '\nСсылку на видеозвонок пришлём отдельно.') : ''
    await api.sendMessage(c.chat, lang === 'en'
      ? `✅ Your meeting is confirmed: ${when}.\n${serviceLabel(b.service, 'en')} · ${FORMAT_LABEL[b.format].en}${meet}\nThe calendar file is attached. Please don't be late!`
      : `✅ Встреча подтверждена: ${when}.\n${serviceLabel(b.service, 'ru')} · ${FORMAT_LABEL[b.format].ru}${meet}\nФайл для календаря во вложении. Просим не опаздывать!`, { link_preview_options: { is_disabled: true } })
    await api.sendDocument(c.chat, new InputFile(new TextEncoder().encode(buildIcs(b, lang)), 'st96-meeting.ics'))
    return true
  }
  if (b.status === 'rejected' || b.status === 'canceled') {
    const again = bookingUrl(c.client.id)
    await api.sendMessage(c.chat, lang === 'en'
      ? `Unfortunately ${when} is not available. Pick another time: ${again}\nOr just reply here and a manager will help.`
      : `К сожалению, время ${when} недоступно. Выберите другое: ${again}\nИли просто ответьте здесь, и менеджер поможет.`, { link_preview_options: { is_disabled: true } })
    return true
  }
  return false
}

/** Напоминание за час: раз в минуту берём подтверждённые встречи, которым осталось 50-70 минут. */
export async function tickBookingReminders(deps: { repo: Repo; api: Api; now?: Date }): Promise<number> {
  const now = deps.now ?? new Date()
  const due = await deps.repo.listDueReminders(new Date(now.getTime() + 50 * 60_000).toISOString(), new Date(now.getTime() + 70 * 60_000).toISOString())
  let sent = 0
  for (const b of due) {
    await deps.repo.updateBooking(b.id, { reminded_at: now.toISOString() })
    const c = await chatOf(deps.repo, b)
    if (!c) continue
    const lang = c.client.language === 'en' ? 'en' : 'ru'
    await deps.api.sendMessage(c.chat, lang === 'en' ? `⏰ Reminder: your meeting with ST96 is in an hour (${whenLabel(b.starts_at, 'en')}).${b.meet_url ? `\nLink: ${b.meet_url}` : ''}` : `⏰ Напоминаем: через час встреча со студией ST96 (${whenLabel(b.starts_at)}).${b.meet_url ? `\nСсылка: ${b.meet_url}` : ''}`, { link_preview_options: { is_disabled: true } }).then(() => { sent++ }).catch(() => undefined)
  }
  return sent
}

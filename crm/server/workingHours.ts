import { str, type Funnel } from './funnels/types.js'

// Рабочие часы студии по Минску: Пн–Чт 10:00–18:00, Пт 10:00–16:00, Сб–Вс — выходные.
// Нужны блоку «Передать человеку»: вне этих часов клиент получает отдельное сообщение,
// которое редактируется в конструкторе воронки (поле «Вне рабочего времени»).

export const WORKING_HOURS_LABEL = 'Пн–Чт 10:00–18:00, Пт 10:00–16:00, Сб–Вс — выходные (Минск)'

/** Текст по умолчанию для обращений вне рабочих часов. В админке его можно изменить в блоке «Передать человеку». */
export const OFFHOURS_MESSAGE = {
  ru: [
    'Спасибо за ваше обращение!',
    'Все заявки обрабатываются нашими специалистами:',
    'Понедельник – Четверг: с 10:00 до 18:00,',
    'Пятница: с 10:00 до 16:00!',
    'Суббота – Воскресенье: выходные дни, работает только поддержка клиентов пакета «Премиум»!',
    '',
    'Ваш запрос будет передан в рабочее время первому освободившемуся специалисту в порядке очереди.',
    '',
    'Хорошего вечера!',
  ].join('\n'),
  en: [
    'Thank you for reaching out!',
    'Our specialists process all requests:',
    'Monday – Thursday: 10:00–18:00,',
    'Friday: 10:00–16:00!',
    'Saturday – Sunday: days off; only support for clients on the Premium package is available!',
    '',
    'Your request will be passed to the first available specialist during working hours, in order of arrival.',
    '',
    'Have a good evening!',
  ].join('\n'),
} as const

/** Время и день недели по Минску (UTC+3, без перехода на летнее время). */
export function minskNow(d: Date) {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Minsk', hour: '2-digit', minute: '2-digit', weekday: 'short', year: 'numeric', month: '2-digit', day: '2-digit', hour12: false }).formatToParts(d)
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? ''
  const dow = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(get('weekday'))
  return { minutes: (parseInt(get('hour'), 10) % 24) * 60 + parseInt(get('minute'), 10), dow, iso: `${get('year')}-${get('month')}-${get('day')}` }
}

/** Рабочее ли сейчас время: Пн–Чт 10:00–18:00, Пт 10:00–16:00, выходные — нет. */
export function isWorkingTime(d: Date): boolean {
  const { minutes, dow } = minskNow(d)
  if (dow < 0 || dow > 4) return false // суббота и воскресенье
  if (minutes < 10 * 60) return false
  return dow === 4 ? minutes < 16 * 60 : minutes < 18 * 60
}

/** Текст вне рабочего времени из блока «Передать человеку»; пусто — стандартный. */
export function offhoursMessage(data: Record<string, unknown>, lang: 'ru' | 'en'): string {
  const own = str(lang === 'en' && str(data.offhoursEn).trim() ? data.offhoursEn : data.offhours).trim()
  return own || (lang === 'en' ? OFFHOURS_MESSAGE.en : OFFHOURS_MESSAGE.ru)
}

/** Текст вне рабочего времени из опубликованных воронок (что сохранили в админке); иначе стандартный. */
export function offhoursTextFromFunnels(funnels: Funnel[], lang: 'ru' | 'en'): string {
  for (const f of funnels) {
    for (const n of f.graph.nodes) {
      const own = n.type === 'handoff'
        ? str(lang === 'en' && str(n.data.offhoursEn).trim() ? n.data.offhoursEn : n.data.offhours).trim()
        : n.type === 'offhours'
          ? str(lang === 'en' && str(n.data.messageEn).trim() ? n.data.messageEn : n.data.message).trim()
          : ''
      if (own) return own
    }
  }
  return lang === 'en' ? OFFHOURS_MESSAGE.en : OFFHOURS_MESSAGE.ru
}

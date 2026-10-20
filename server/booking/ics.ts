import { FORMAT_LABEL, SERVICE_LABEL } from './schedule'
import type { BookingRow } from './types'

const esc = (t: string) => t.replace(/\\/g, '\\\\').replace(/([,;])/g, '\\$1').replace(/\r?\n/g, '\\n')
const utc = (d: Date) => d.toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z'

/** Файл календаря .ics для клиента (время в UTC, поэтому открывается правильно в любом часовом поясе). */
export function buildIcs(b: BookingRow, lang: 'ru' | 'en' = 'ru'): string {
  const svc = SERVICE_LABEL[b.service][lang]
  const fmt = FORMAT_LABEL[b.format][lang]
  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//ST96//Booking//RU', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'BEGIN:VEVENT',
    `UID:${b.id}@st96.by`, `DTSTAMP:${utc(new Date())}`, `DTSTART:${utc(new Date(b.starts_at))}`, `DTEND:${utc(new Date(b.ends_at))}`,
    `SUMMARY:${esc(lang === 'en' ? `Meeting with ST96: ${svc}` : `Встреча со студией ST96: ${svc}`)}`,
    `DESCRIPTION:${esc(`${lang === 'en' ? 'Format' : 'Формат'}: ${fmt}${b.goal ? `\n${lang === 'en' ? 'Goal' : 'Цель'}: ${b.goal}` : ''}${b.meet_url ? `\n${b.meet_url}` : ''}`)}`,
    b.meet_url ? `URL:${b.meet_url}` : '', b.format === 'offline' ? `LOCATION:${esc(lang === 'en' ? 'ST96 studio' : 'Студия ST96')}` : '',
    'BEGIN:VALARM', 'TRIGGER:-PT1H', 'ACTION:DISPLAY', `DESCRIPTION:${esc(lang === 'en' ? 'Meeting with ST96 in one hour' : 'Через час встреча со студией ST96')}`, 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR',
  ]
  return lines.filter(Boolean).join('\r\n')
}

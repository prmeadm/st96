import { test } from 'node:test'
import assert from 'node:assert/strict'
import { Api } from 'grammy'
import { memoryRepo } from '../memoryRepo'
import { buildIcs } from './ics'
import { notifyAdminsNewBooking, notifyClientDecision, tickBookingReminders, whenLabel } from './notify'
import { dayInfo, defaultSchedule, normalizeSchedule, slotAvailable, toInstant, type DayBooking } from './schedule'
import { createBooking, decideBooking, monthAvailability, saveSchedule, loadSchedule } from './service'

const NOW = new Date('2026-10-20T06:00:00Z') // вторник 09:00 по Минску
const S = defaultSchedule()
const times = (d: ReturnType<typeof dayInfo>) => d.slots.filter((s) => s.free).map((s) => s.t)

test('обычный рабочий день: окна с перерывом, шаг 30 минут', () => {
  const d = dayInfo('2026-10-21', S, [], 'retouch', null, NOW) // среда
  assert.equal(d.free, 14)
  assert.deepEqual(times(d).slice(0, 2), ['10:00', '10:30'])
  assert.ok(!times(d).includes('13:00'), 'перерыв 13-14 закрыт')
  assert.equal(dayInfo('2026-10-21', S, [], 'neurophoto', null, NOW).free, 12, 'для часовой услуги слотов меньше')
})

test('сегодня: запись не раньше чем за 3 часа; прошедшие, выходные и дальние дни закрыты', () => {
  const today = dayInfo('2026-10-20', S, [], 'retouch', null, NOW)
  assert.equal(today.slots.find((s) => s.t === '11:30')?.why, 'Слишком скоро')
  assert.equal(today.slots.find((s) => s.t === '12:00')?.free, true)
  assert.equal(dayInfo('2026-10-19', S, [], 'retouch', null, NOW).past, true)
  assert.equal(dayInfo('2026-10-25', S, [], 'retouch', null, NOW).why, 'Выходной по расписанию') // воскресенье
  assert.equal(dayInfo('2026-12-30', S, [], 'retouch', null, NOW).far, true)
})

test('исключения: закрытый день, особые окна и закрытая часть дня', () => {
  const s = normalizeSchedule({ ...S, overrides: { '2026-10-21': { closed: true, reason: 'Отпуск' }, '2026-10-22': { blocks: [{ from: '14:00', to: '16:00', reason: 'Съёмка' }] }, '2026-10-25': { open: true } } })
  assert.equal(dayInfo('2026-10-21', s, [], 'retouch', null, NOW).why, 'Отпуск')
  const thu = dayInfo('2026-10-22', s, [], 'retouch', null, NOW)
  assert.equal(thu.slots.find((x) => x.t === '14:30')?.why, 'Съёмка')
  assert.equal(thu.slots.find((x) => x.t === '16:00')?.free, true)
  assert.ok(dayInfo('2026-10-25', s, [], 'retouch', null, NOW).free > 0, 'воскресенье открыли вручную')
})

test('офлайн-встречи только в заданные дни', () => {
  assert.equal(dayInfo('2026-10-21', S, [], 'retouch', 'offline', NOW).closed, true) // среда
  assert.equal(dayInfo('2026-10-22', S, [], 'retouch', 'offline', NOW).closed, false) // четверг
  assert.equal(dayInfo('2026-10-21', S, [], 'retouch', 'video', NOW).closed, false)
})

test('буфер между встречами и лимит встреч в день', () => {
  const booked: DayBooking[] = [{ startMin: 14 * 60, endMin: 14 * 60 + 30 }]
  const d = dayInfo('2026-10-21', S, booked, 'retouch', null, NOW)
  assert.deepEqual(['12:30', '14:00', '14:30', '15:00'].map((t) => d.slots.find((s) => s.t === t)!.free), [true, false, false, true], 'буфер 15 мин с обеих сторон занятого времени')
    const five = Array.from({ length: 5 }, (_, i) => ({ startMin: 600 + i * 60, endMin: 630 + i * 60 }))
  assert.equal(dayInfo('2026-10-21', S, five, 'retouch', null, NOW).free, 0)
  assert.equal(slotAvailable('2026-10-21', '12:00', S, five, 'retouch', null, NOW).ok, false)
})

test('нормализация расписания отбрасывает мусор и держится в границах', () => {
  const s = normalizeSchedule({ week: { 0: { on: true, windows: [{ from: '18:00', to: '10:00' }, { from: 'x', to: '12:00' }] } }, overrides: { 'не дата': { closed: true }, '2026-11-01': { closed: true, reason: 'x'.repeat(200) } }, rules: { step: 7, buffer: 9999, horizon: -5, durations: { retouch: 5 }, offlineDays: [1, 9, 'a'] } })
  assert.deepEqual(s.week[0]!.windows, defaultSchedule().week[0]!.windows, 'неверные окна заменены умолчанием')
  assert.deepEqual(Object.keys(s.overrides), ['2026-11-01'])
  assert.equal(s.overrides['2026-11-01']!.reason!.length, 80)
  assert.equal(s.rules.step, 30)
  assert.equal(s.rules.buffer, 120)
  assert.equal(s.rules.horizon, 1)
  assert.equal(s.rules.durations.retouch, 10)
  assert.deepEqual(s.rules.offlineDays, [1])
})

const input = { service: 'retouch', format: 'video', date: '2026-10-21', time: '11:00', name: 'Анна', phone: '+375 29 111-22-33', telegram: '@anna_photo', goal: 'Обсудить ретушь' }

test('запись: создаётся клиент и заявка, время занимается, второй клиент на то же время получает отказ', async () => {
  const repo = memoryRepo()
  const r = await createBooking(repo, input, NOW)
  assert.ok(r.ok)
  if (!r.ok) return
  assert.equal(r.booking.status, 'pending')
  assert.equal(r.booking.starts_at, '2026-10-21T08:00:00.000Z', '11:00 Минск = 08:00 UTC')
  assert.equal(Date.parse(r.booking.ends_at) - Date.parse(r.booking.starts_at), 30 * 60_000)
  assert.equal(repo.clients.length, 1)
  assert.equal(repo.clients[0]!.phone, '+375291112233')
  const second = await createBooking(repo, { ...input, name: 'Игорь', phone: '+375 33 555-44-33', telegram: undefined }, NOW)
  assert.equal(second.ok, false)
  if (!second.ok) assert.equal(second.status, 409)
  assert.equal(repo.bookings.length, 1)
  // тот же человек привязывается к тому же клиенту
  const again = await createBooking(repo, { ...input, time: '15:00' }, NOW)
  assert.ok(again.ok && repo.clients.length === 1)
})

test('запись: обязательные поля, свой клиент по ссылке и защита от потока заявок', async () => {
  const repo = memoryRepo()
  repo.clock = () => NOW
  assert.equal((await createBooking(repo, { ...input, name: '' }, NOW)).ok, false)
  assert.equal((await createBooking(repo, { ...input, phone: '', telegram: '' }, NOW)).ok, false)
  assert.equal((await createBooking(repo, { ...input, service: 'hack' }, NOW)).ok, false)
  assert.equal((await createBooking(repo, { ...input, date: '2026-13-40' }, NOW)).ok, false)
  assert.equal((await createBooking(repo, { ...input, time: '11:10' }, NOW)).ok, false, 'времени нет в сетке')
  const c = await repo.insertClient({ name: 'Из бота', tg_user_id: 7, source: 'bot' })
  const ok = await createBooking(repo, { ...input, clientId: c.id, time: '12:00' }, NOW)
  assert.ok(ok.ok && ok.booking.client_id === c.id && repo.clients.length === 1)
  await createBooking(repo, { ...input, clientId: c.id, time: '15:00' }, NOW)
  await createBooking(repo, { ...input, clientId: c.id, time: '16:00' }, NOW)
  const spam = await createBooking(repo, { ...input, clientId: c.id, time: '17:00' }, NOW)
  assert.equal(spam.ok, false)
  if (!spam.ok) assert.equal(spam.status, 429)
})

test('решение: подтверждение, повтор запрещён, воронка продолжается по выходу', async () => {
  const repo = memoryRepo()
  const r = await createBooking(repo, { ...input, runId: 'run1', runNode: 'b1' }, NOW)
  assert.ok(r.ok)
  if (!r.ok) return
  assert.equal((await decideBooking(repo, r.booking.id, 'confirm', 'http://meet.example')).ok, false, 'только https')
  const ok = await decideBooking(repo, r.booking.id, 'confirm', 'https://meet.google.com/abc-defg-hij')
  assert.ok(ok.ok)
  assert.equal(repo.bookings[0]!.status, 'confirmed')
  assert.equal(repo.bookings[0]!.meet_url, 'https://meet.google.com/abc-defg-hij')
  assert.equal(repo.jobs.at(-1)!.kind, 'booking_resume')
  assert.deepEqual(repo.jobs.at(-1)!.payload, { runId: 'run1', handle: 'confirmed', bookingId: r.booking.id })
  assert.equal((await decideBooking(repo, r.booking.id, 'reject')).ok, false, 'повторно решить нельзя')
  assert.ok((await decideBooking(repo, r.booking.id, 'cancel')).ok, 'подтверждённую можно отменить')
  // отклонённая заявка освобождает время
  const r2 = await createBooking(repo, { ...input, time: '15:30', phone: '+375 29 555-66-77', telegram: undefined }, NOW)
  assert.ok(r2.ok)
})

function fakeApi() {
  const calls: { method: string; payload: Record<string, unknown> }[] = []
  const api = new Api('1:T')
  api.config.use(async (_p, method, payload) => { calls.push({ method, payload: payload as Record<string, unknown> }); return { ok: true, result: { message_id: 1 } } as never })
  return { api, calls }
}

test('уведомления: администраторам с кнопками, клиенту с файлом календаря, напоминание за час один раз', async () => {
  const repo = memoryRepo()
  const c = await repo.insertClient({ name: 'Анна', tg_user_id: 55, language: 'ru', source: 'bot' })
  const r = await createBooking(repo, { ...input, clientId: c.id }, NOW)
  assert.ok(r.ok)
  if (!r.ok) return
  const { api, calls } = fakeApi()
  await notifyAdminsNewBooking(api, -100, r.booking)
  assert.match(JSON.stringify(calls[0]!.payload.reply_markup), new RegExp(`bk:ok:${r.booking.id}`))
  assert.match(String(calls[0]!.payload.text), /Новая заявка на встречу/)

  await decideBooking(repo, r.booking.id, 'confirm')
  const sent = await notifyClientDecision(api, repo, repo.bookings[0]!)
  assert.ok(sent)
  assert.deepEqual(calls.slice(1).map((x) => x.method), ['sendMessage', 'sendDocument'])
  assert.match(String(calls[1]!.payload.text), /Встреча подтверждена: 21 октября, ср, 11:00 \(Минск\)/)

  const bare = await repo.insertClient({ name: 'Без бота', source: 'site' })
  const b2 = await createBooking(repo, { ...input, time: '15:00', clientId: bare.id }, NOW)
  assert.ok(b2.ok)
  if (b2.ok) assert.equal(await notifyClientDecision(api, repo, { ...b2.booking, status: 'confirmed' }), false, 'некому писать: Telegram не привязан')

  const soon = new Date(Date.parse(repo.bookings[0]!.starts_at) - 60 * 60_000)
  assert.equal(await tickBookingReminders({ repo, api, now: soon }), 1)
  assert.equal(await tickBookingReminders({ repo, api, now: soon }), 0, 'второй раз не напоминает')
})

test('файл календаря: время в UTC, название и описание', () => {
  const b = { id: 'x', service: 'retouch', format: 'video', starts_at: toInstant('2026-10-21', '14:00').toISOString(), ends_at: toInstant('2026-10-21', '14:30').toISOString(), goal: 'Цель, важная; да', meet_url: 'https://meet.example/a' } as never
  const ics = buildIcs(b)
  assert.match(ics, /DTSTART:20261021T110000Z/)
  assert.match(ics, /DTEND:20261021T113000Z/)
  assert.match(ics, /SUMMARY:Встреча со студией ST96: Ретушь/)
  assert.ok(ics.includes(String.raw`Цель: Цель\, важная\; да`), 'запятая и точка с запятой экранированы')
  assert.equal(whenLabel('2026-10-21T11:00:00Z', 'en'), 'Wed, Oct 21, 14:00 (Minsk)')
})

test('расписание хранится в настройках, месяц считает свободные слоты и учитывает заявки', async () => {
  const repo = memoryRepo()
  assert.equal((await loadSchedule(repo)).rules.step, 30)
  await saveSchedule(repo, { ...S, rules: { ...S.rules, step: 60 } })
  const s = await loadSchedule(repo)
  assert.equal(s.rules.step, 60)
  await createBooking(repo, input, NOW)
  const m = await monthAvailability(repo, s, '2026-10', 'retouch', null, NOW)
  assert.equal(Object.keys(m).length, 31)
  assert.equal(m['2026-10-25']!.free, 0)
  assert.ok(m['2026-10-21']!.free > 0 && m['2026-10-21']!.free < dayInfo('2026-10-21', s, [], 'retouch', null, NOW).free)
  assert.equal(m['2026-10-19']!.why, 'Прошедший день')
})

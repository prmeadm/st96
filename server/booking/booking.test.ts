import { test } from 'node:test'
import assert from 'node:assert/strict'
import { Api } from 'grammy'
import { memoryRepo } from '../memoryRepo'
import { buildIcs } from './ics'
import { notifyAdminsNewBooking, notifyClientDecision, tickBookingReminders, whenLabel } from './notify'
import { dayInfo, defaultSchedule, normalizeSchedule, slotAvailable, toInstant, type DayBooking } from './schedule'
import { MEET_SETTING, clientContacts, loadDirectAdmins, parseNicks, saveDirectAdmins, createBooking, decideBooking, loadMeetDefault, monthAvailability, saveMeetDefault, saveSchedule, loadSchedule } from './service'

const NOW = new Date('2026-10-20T06:00:00Z') // вторник 09:00 по Минску
const S = defaultSchedule()
const S30 = { ...S, rules: { ...S.rules, duration: 30 } }
const times = (d: ReturnType<typeof dayInfo>) => d.slots.filter((s) => s.free).map((s) => s.t)

test('обычный рабочий день: окна с перерывом, шаг 30 минут', () => {
  const d = dayInfo('2026-10-21', S30, [], null, NOW) // среда
  assert.equal(d.free, 14)
  assert.deepEqual(times(d).slice(0, 2), ['10:00', '10:30'])
  assert.ok(!times(d).includes('13:00'), 'перерыв 13-14 закрыт')
  assert.equal(dayInfo('2026-10-21', S, [], null, NOW).free, 12, 'при часовой встрече слотов меньше')
})

test('сегодня: запись не раньше чем за 3 часа; прошедшие, выходные и дальние дни закрыты', () => {
  const today = dayInfo('2026-10-20', S, [], null, NOW)
  assert.equal(today.slots.find((s) => s.t === '11:30')?.why, 'Слишком скоро')
  assert.equal(today.slots.find((s) => s.t === '12:00')?.free, true)
  assert.equal(dayInfo('2026-10-19', S, [], null, NOW).past, true)
  assert.equal(dayInfo('2026-10-25', S, [], null, NOW).why, 'Выходной по расписанию') // воскресенье
  assert.equal(dayInfo('2026-12-30', S, [], null, NOW).far, true)
})

test('исключения: закрытый день, особые окна и закрытая часть дня', () => {
  const s = normalizeSchedule({ ...S, overrides: { '2026-10-21': { closed: true, reason: 'Отпуск' }, '2026-10-22': { blocks: [{ from: '14:00', to: '16:00', reason: 'Съёмка' }] }, '2026-10-25': { open: true } } })
  assert.equal(dayInfo('2026-10-21', s, [], null, NOW).why, 'Отпуск')
  const thu = dayInfo('2026-10-22', s, [], null, NOW)
  assert.equal(thu.slots.find((x) => x.t === '14:30')?.why, 'Съёмка')
  assert.equal(thu.slots.find((x) => x.t === '16:00')?.free, true)
  assert.ok(dayInfo('2026-10-25', s, [], null, NOW).free > 0, 'воскресенье открыли вручную')
})

test('офлайн-встречи только в заданные дни', () => {
  assert.equal(dayInfo('2026-10-21', S, [], 'offline', NOW).closed, true) // среда
  assert.equal(dayInfo('2026-10-22', S, [], 'offline', NOW).closed, false) // четверг
  assert.equal(dayInfo('2026-10-21', S, [], 'video', NOW).closed, false)
})

test('буфер между встречами и лимит встреч в день', () => {
  const booked: DayBooking[] = [{ startMin: 14 * 60, endMin: 14 * 60 + 30 }]
  const d = dayInfo('2026-10-21', S30, booked, null, NOW)
  assert.deepEqual(['12:30', '14:00', '14:30', '15:00'].map((t) => d.slots.find((s) => s.t === t)!.free), [true, false, false, true], 'буфер 15 мин с обеих сторон занятого времени')
    const five = Array.from({ length: 5 }, (_, i) => ({ startMin: 600 + i * 60, endMin: 630 + i * 60 }))
  assert.equal(dayInfo('2026-10-21', S, five, null, NOW).free, 0)
  assert.equal(slotAvailable('2026-10-21', '12:00', S, five, null, NOW).ok, false)
})

test('нормализация расписания отбрасывает мусор и держится в границах', () => {
  const s = normalizeSchedule({ week: { 0: { on: true, windows: [{ from: '18:00', to: '10:00' }, { from: 'x', to: '12:00' }] } }, overrides: { 'не дата': { closed: true }, '2026-11-01': { closed: true, reason: 'x'.repeat(200) } }, rules: { step: 7, buffer: 9999, horizon: -5, duration: 5, offlineDays: [1, 9, 'a'] } })
  assert.deepEqual(s.week[0]!.windows, defaultSchedule().week[0]!.windows, 'неверные окна заменены умолчанием')
  assert.deepEqual(Object.keys(s.overrides), ['2026-11-01'])
  assert.equal(s.overrides['2026-11-01']!.reason!.length, 80)
  assert.equal(s.rules.step, 30)
  assert.equal(s.rules.buffer, 120)
  assert.equal(s.rules.horizon, 1)
  assert.equal(s.rules.duration, 10)
  assert.deepEqual(s.rules.offlineDays, [1])
})

const input = { service: 'production', format: 'video', date: '2026-10-21', time: '11:00', name: 'Анна', phone: '+375 29 111-22-33', telegram: '@anna_photo', goal: 'Обсудить съёмку' }

test('запись: создаётся клиент и заявка, время занимается, второй клиент на то же время получает отказ', async () => {
  const repo = memoryRepo()
  const r = await createBooking(repo, input, NOW)
  assert.ok(r.ok)
  if (!r.ok) return
  assert.equal(r.booking.status, 'pending')
  assert.equal(r.booking.starts_at, '2026-10-21T08:00:00.000Z', '11:00 Минск = 08:00 UTC')
  assert.equal(Date.parse(r.booking.ends_at) - Date.parse(r.booking.starts_at), 60 * 60_000, 'длительность общая для всех услуг')
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
  await createBooking(repo, { ...input, clientId: c.id, time: '14:00' }, NOW)
  await createBooking(repo, { ...input, clientId: c.id, time: '15:30' }, NOW)
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
  const msg = String(calls[1]!.payload.text)
  assert.match(msg, /Встреча подтверждена/)
  assert.match(msg, /Дата: 21 октября, ср/)
  assert.match(msg, /Время: 11:00 \(Минск\)/)
  assert.match(msg, /Услуга: /)
  assert.match(msg, /Тип связи: /)
  assert.match(String(calls[2]!.payload.caption), /Добавьте задачу в свой календарь, чтобы не пропустить это важное событие!/)
  const ics = buildIcs(repo.bookings[0]!, 'ru')
  assert.equal(ics.split('BEGIN:VALARM').length - 1, 2, 'два напоминания')
  assert.match(ics, /TRIGGER:-PT1H/)
  assert.match(ics, /TRIGGER:-PT15M/)

  const bare = await repo.insertClient({ name: 'Без бота', source: 'site' })
  const b2 = await createBooking(repo, { ...input, time: '15:00', clientId: bare.id }, NOW)
  assert.ok(b2.ok)
  if (b2.ok) assert.equal(await notifyClientDecision(api, repo, { ...b2.booking, status: 'confirmed' }), false, 'некому писать: Telegram не привязан')

  const soon = new Date(Date.parse(repo.bookings[0]!.starts_at) - 60 * 60_000)
  assert.equal(await tickBookingReminders({ repo, api, now: soon }), 1)
  assert.equal(await tickBookingReminders({ repo, api, now: soon }), 0, 'второй раз не напоминает')
})

test('файл календаря: время в UTC, название и описание', () => {
  const b = { id: 'x', service: 'production', format: 'video', starts_at: toInstant('2026-10-21', '14:00').toISOString(), ends_at: toInstant('2026-10-21', '14:30').toISOString(), goal: 'Цель, важная; да', meet_url: 'https://meet.example/a' } as never
  const ics = buildIcs(b)
  assert.match(ics, /DTSTART:20261021T110000Z/)
  assert.match(ics, /DTEND:20261021T113000Z/)
  assert.match(ics, /SUMMARY:Встреча со студией ST96: Продакшн/)
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
  const m = await monthAvailability(repo, s, '2026-10', null, NOW)
  assert.equal(Object.keys(m).length, 31)
  assert.equal(m['2026-10-25']!.free, 0)
  assert.ok(m['2026-10-21']!.free > 0 && m['2026-10-21']!.free < dayInfo('2026-10-21', s, [], null, NOW).free)
  assert.equal(m['2026-10-19']!.why, 'Прошедший день')
})

test('кнопки в группе: подтверждение через бота уведомляет клиента, чужие чаты игнорируются', async () => {
  const { createBot } = await import('../bot/bot')
  const repo = memoryRepo()
  repo.clock = () => NOW
  const c = await repo.insertClient({ name: 'Анна', tg_user_id: 77, source: 'bot' })
  const r = await createBooking(repo, { ...input, clientId: c.id }, NOW)
  assert.ok(r.ok)
  if (!r.ok) return
  const bot = createBot('123:TEST', repo, { groupChatId: -1001 })
  bot.botInfo = { id: 123, is_bot: true, first_name: 'ST96', username: 'st96_bot', can_join_groups: true, can_read_all_group_messages: true, supports_inline_queries: false, can_connect_to_business: false, has_main_web_app: false } as never
  const calls: { method: string; payload: Record<string, unknown> }[] = []
  bot.api.config.use(async (_p, method, payload) => { calls.push({ method, payload: payload as Record<string, unknown> }); return { ok: true, result: true } as never })
  const press = (chat: number, data: string, uid: number) => bot.handleUpdate({ update_id: uid, callback_query: { id: String(uid), from: { id: 9, is_bot: false, first_name: 'Карина' }, chat_instance: 'x', data, message: { message_id: 5, date: 1, chat: { id: chat, type: 'supergroup', title: 'Лиды' }, text: 'Новая заявка' } } } as never)
  await press(-777, `bk:ok:${r.booking.id}`, 1)
  assert.equal(repo.bookings[0]!.status, 'pending', 'из чужого чата решение не принимается')
  await press(-1001, `bk:ok:${r.booking.id}`, 2)
  assert.equal(repo.bookings[0]!.status, 'confirmed')
  assert.ok(calls.some((x) => x.method === 'sendMessage' && x.payload.chat_id === 77 && /Встреча подтверждена/.test(String(x.payload.text))))
  assert.ok(calls.some((x) => x.method === 'sendDocument' && x.payload.chat_id === 77))
  await press(-1001, `bk:no:${r.booking.id}`, 3)
  assert.equal(repo.bookings[0]!.status, 'confirmed', 'повторное решение не меняет заявку')
})

test('видеозвонок получает общую ссылку Meet при подтверждении; офлайн и свою ссылку она не трогает', async () => {
  const repo = memoryRepo()
  assert.equal((await saveMeetDefault(repo, 'http://meet')).ok, false, 'только https')
  assert.ok((await saveMeetDefault(repo, 'https://meet.google.com/abc-defg-hij')).ok)
  assert.equal(await loadMeetDefault(repo), 'https://meet.google.com/abc-defg-hij')
  const a = await createBooking(repo, { ...input, format: 'video', time: '11:00' }, NOW)
  assert.ok(a.ok)
  if (!a.ok) return
  const d = await decideBooking(repo, a.booking.id, 'confirm')
  assert.ok(d.ok && d.booking.meet_url === 'https://meet.google.com/abc-defg-hij')
  assert.equal(repo.bookings[0]!.meet_url, 'https://meet.google.com/abc-defg-hij')
  const b = await createBooking(repo, { ...input, format: 'call', time: '15:00', phone: '+375 33 555-44-33', telegram: undefined, name: 'Игорь' }, NOW)
  assert.ok(b.ok)
  if (!b.ok) return
  const d2 = await decideBooking(repo, b.booking.id, 'confirm')
  assert.ok(d2.ok && d2.booking.meet_url === null, 'звонок по телефону без ссылки')
  const c = await createBooking(repo, { ...input, format: 'video', time: '16:30', phone: '+375 25 111-00-00', telegram: undefined, name: 'Олег' }, NOW)
  assert.ok(c.ok)
  if (!c.ok) return
  const d3 = await decideBooking(repo, c.booking.id, 'confirm', 'https://meet.example/own')
  assert.ok(d3.ok && d3.booking.meet_url === 'https://meet.example/own', 'своя ссылка сильнее общей')
  assert.equal(MEET_SETTING, 'booking_meet_default')
})

test('форма записи по личной ссылке: ник, телефон и имя берутся из карточки, а недостающее из заявок клиента', async () => {
  const repo = memoryRepo()
  const c = await repo.insertClient({ name: null, phone: '+375291112233', source: 'site' })
  await repo.insertLead({ client_id: c.id, source: 'site_form', service_key: 'ai', title: null, topic: null, name: 'Анна', phone: '+375291112233', telegram: '@anna_photo', email: null, company: 'Студия', comment: null, interest: null, lang: null, landing: null, utm: null, warnings: [], raw_text: null, tg_chat_id: null, tg_message_id: null })
  assert.deepEqual(await clientContacts(repo, c.id), { name: 'Анна', company: 'Студия', phone: '+375291112233', telegram: '@anna_photo' })
  await repo.updateClient(c.id, { tg_username: 'anna_real', name: 'Анна П.' })
  const c2 = await clientContacts(repo, c.id)
  assert.equal(c2?.telegram, '@anna_real', 'карточка главнее заявки')
  assert.equal(c2?.name, 'Анна П.')
  assert.equal(await clientContacts(repo, 'нет-такого'), null)
})

test('заявка приходит лично администратору по нику (по умолчанию studia96), если он запускал бота; иначе сообщаем, что не дошло', async () => {
  const repo = memoryRepo()
  assert.deepEqual(await loadDirectAdmins(repo), ['studia96'], 'по умолчанию')
  const r = await createBooking(repo, input, NOW)
  assert.ok(r.ok)
  if (!r.ok) return
  const a = fakeApi()
  const none = await notifyAdminsNewBooking(a.api, -100, r.booking, repo)
  assert.deepEqual(none.failed, ['@studia96'], 'администратор ещё не запускал бота')
  assert.equal(a.calls.length, 1, 'только группа')
  await repo.insertClient({ name: 'Студия', tg_username: 'Studia96', tg_user_id: 777, source: 'bot' })
  const b = fakeApi()
  const ok = await notifyAdminsNewBooking(b.api, -100, r.booking, repo)
  assert.deepEqual(ok.failed, [])
  assert.deepEqual(b.calls.map((c) => c.payload.chat_id), [-100, 777], 'группа и личный чат')
  assert.match(JSON.stringify(b.calls[1]!.payload.reply_markup), new RegExp(`bk:no:${r.booking.id}`))
  assert.deepEqual(parseNicks('@Studia96, other_admin;  bad, @x'), ['studia96', 'other_admin'])
  assert.deepEqual((await saveDirectAdmins(repo, '@one_admin, two_admin')).ok && (await loadDirectAdmins(repo)), ['one_admin', 'two_admin'])
  assert.deepEqual(await (async () => { await saveDirectAdmins(repo, ''); return loadDirectAdmins(repo) })(), [], 'пустой список = только группа')
})

test('выбранные пункты услуги попадают в начало комментария; чужие пункты и повторы отбрасываются', async () => {
  const repo = memoryRepo()
  const r = await createBooking(repo, { ...input, service: 'ai', topics: ['Сайт с AI', 'Личный AI-агент', 'Сайт с AI', 'Нейрофотосессия', 42], comment: 'Бюджет до 5000' }, NOW)
  assert.ok(r.ok)
  assert.equal(repo.bookings[0]!.comment, 'Интересует: Сайт с AI, Личный AI-агент\nБюджет до 5000', 'Нейрофотосессия относится к продакшну, не к AI')
  const r2 = await createBooking(repo, { ...input, service: 'production', time: '15:00', phone: '+375 33 555-44-33', telegram: undefined, name: 'Игорь', topics: ['Нейрофотосессия'] }, NOW)
  assert.ok(r2.ok)
  assert.equal(repo.bookings[1]!.comment, 'Интересует: Нейрофотосессия')
  const r3 = await createBooking(repo, { ...input, service: 'promotion', time: '16:30', phone: '+375 25 111-00-00', telegram: undefined, name: 'Олег' }, NOW)
  assert.ok(r3.ok)
  assert.equal(repo.bookings[2]!.comment, null, 'без пунктов и комментария пусто')
})

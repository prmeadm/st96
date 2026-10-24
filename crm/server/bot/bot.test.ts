import { test } from 'node:test'
import assert from 'node:assert/strict'
import type { Update } from 'grammy/types'
import { memoryRepo } from '../memoryRepo'
import { createBot } from './bot'
import { demoGraph } from '../funnels/demo'
import { TRIGGER } from '../funnels/types'

const GROUP = -1001

function setup() {
  const repo = memoryRepo()
  const bot = createBot('123:TEST', repo, { groupChatId: GROUP })
  bot.botInfo = { id: 123, is_bot: true, first_name: 'ST96', username: 'st96_bot', can_join_groups: true, can_read_all_group_messages: true, supports_inline_queries: false, can_connect_to_business: false, has_main_web_app: false } as never
  const calls: { method: string; payload: Record<string, unknown> }[] = []
  const failures = new Set<string>()
  let seq = 100
  bot.api.config.use(async (_prev, method, payload) => {
    calls.push({ method, payload: payload as Record<string, unknown> })
    if (failures.has(method)) {
      failures.delete(method)
      return { ok: false, error_code: 400, description: 'Bad Request: message thread not found' } as never
    }
    const result = method === 'createForumTopic' ? { message_thread_id: ++seq, name: 'x' } : method === 'sendMessage' || method === 'copyMessage' ? { message_id: ++seq, message_thread_id: undefined } : true
    return { ok: true, result } as never
  })
  let id = 0
  const send = (u: Omit<Update, 'update_id'>) => bot.handleUpdate({ update_id: ++id, ...u } as Update)
  return { repo, calls, failures, send, replay: (n: number, u: Omit<Update, 'update_id'>) => bot.handleUpdate({ update_id: n, ...u } as Update) }
}

const user = { id: 555, is_bot: false, first_name: 'Мария', username: 'maria_photo', language_code: 'ru' }
const priv = { id: 555, type: 'private' as const, first_name: 'Мария' }
const msg = (text: string, extra: object = {}) => ({ message: { message_id: 1, date: 1, chat: priv, from: user, text, ...extra } })

test('/start создаёт клиента и пишет приветствие без запроса согласия', async () => {
  const { repo, calls, send } = setup()
  await send(msg('/start stand', { entities: [{ type: 'bot_command', offset: 0, length: 6 }] }))
  assert.equal(repo.clients.length, 1)
  assert.equal(repo.clients[0].tg_user_id, 555)
  assert.equal(repo.clients[0].source, 'bot:stand')
  const reply = calls.find((c) => c.method === 'sendMessage')!
  assert.match(String(reply.payload.text), /ST96/)
  assert.doesNotMatch(JSON.stringify(reply.payload.reply_markup ?? ''), /consent/)
  assert.doesNotMatch(String(reply.payload.text), /согласие|Политика/)
})

test('/Start, /START, /старт и слово «старт» запускают бота так же, как /start', async () => {
  for (const text of ['/Start', '/START', '/старт', 'старт', 'Start']) {
    const { repo, calls, send } = setup()
    publish(repo)
    await send(msg(text, text.startsWith('/') ? { entities: [{ type: 'bot_command', offset: 0, length: text.length }] } : {}))
    assert.equal(repo.runs.length, 1, `${text}: воронка запущена`)
    assert.ok(calls.some((c) => c.method === 'sendMessage' && c.payload.chat_id === 555 && /Здравствуйте, Мария!/.test(String(c.payload.text))), `${text}: приветствие отправлено`)
  }
})

test('/start привязывает к клиенту из заявки по нику', async () => {
  const { repo, send } = setup()
  await repo.insertClient({ tg_username: 'Maria_Photo', phone: '+375291112233', source: 'stand' })
  await send(msg('/start', { entities: [{ type: 'bot_command', offset: 0, length: 6 }] }))
  assert.equal(repo.clients.length, 1)
  assert.equal(repo.clients[0].tg_user_id, 555)
  assert.equal(repo.clients[0].phone, '+375291112233')
})

test('согласие и /stop меняют статус рассылок', async () => {
  const { repo, send } = setup()
  await send(msg('/start', { entities: [{ type: 'bot_command', offset: 0, length: 6 }] }))
  await send({ callback_query: { id: 'q', from: user, chat_instance: 'x', data: 'consent:yes', message: { message_id: 9, date: 1, chat: priv } } })
  assert.ok(repo.clients[0].consent_at)
  await send(msg('/stop', { entities: [{ type: 'bot_command', offset: 0, length: 5 }] }))
  assert.ok(repo.clients[0].opted_out_at)
  await send({ callback_query: { id: 'q2', from: user, chat_instance: 'x', data: 'consent:yes', message: { message_id: 9, date: 1, chat: priv } } })
  assert.equal(repo.clients[0].opted_out_at, null)
})

test('сообщение клиента логируется, подтверждение не чаще раза в 12 часов', async () => {
  const { repo, calls, send } = setup()
  await send(msg('Сколько стоит ретушь?'))
  await send(msg('И сроки?'))
  assert.equal(repo.messages.length, 2)
  assert.equal(calls.filter((c) => c.method === 'sendMessage' && c.payload.chat_id === 555).length, 1)
})

test('английский язык по language_code', async () => {
  const { repo, calls, send } = setup()
  const en = { ...user, id: 777, username: undefined, language_code: 'en' }
  await send({ message: { message_id: 1, date: 1, chat: { id: 777, type: 'private', first_name: 'Tom' }, from: en, text: 'Hello' } })
  assert.equal(repo.clients[0].language, 'en')
  assert.match(String(calls.find((c) => c.method === 'sendMessage' && c.payload.chat_id === 777)!.payload.text), /administrator/)
})

test('повторная доставка того же update не обрабатывается дважды', async () => {
  const { repo, replay } = setup()
  await replay(42, msg('Привет'))
  await replay(42, msg('Привет'))
  assert.equal(repo.messages.length, 1)
})

test('группа: ответ сотрудника на заявку становится заметкой, чужие группы игнорируются', async () => {
  const { repo, send } = setup()
  const staff = { id: 9, is_bot: false, first_name: 'Сергей' }
  const lead = '\u{1F195} Заявка: Нейрофотосессия\nИмя: Александра\nTelegram: @Alex_Balashova\nИсточник: стенд, форма в памятке сотрудника'
  await send({
    message: {
      message_id: 60, date: 1, chat: { id: GROUP, type: 'supergroup', title: 'Лиды ST96' }, from: staff, text: 'Интересует франшиза',
      reply_to_message: { message_id: 10, date: 1, chat: { id: GROUP, type: 'supergroup', title: 'Лиды ST96' }, from: { id: 123, is_bot: true, first_name: 'Studia 96' }, text: lead } as never,
    },
  })
  assert.equal(repo.leads.length, 1)
  assert.equal(repo.notes.length, 1)
  assert.equal(repo.notes[0].author_name, 'Сергей')
  await send({ message: { message_id: 61, date: 1, chat: { id: -999, type: 'supergroup', title: 'Другая' }, from: staff, text: 'Заметка в чужой группе, должна игнорироваться' } })
  assert.equal(repo.notes.length, 1)
})

const staff = { id: 9, is_bot: false, first_name: 'Сергей' }
const topicMsg = (thread: number, text: string, id = 1, extra: object = {}): never => ({
  message: { message_id: id, date: 1, chat: { id: GROUP, type: 'supergroup' as const, title: 'Лиды ST96', is_forum: true }, from: staff, text, is_topic_message: true, message_thread_id: thread, ...extra },
}) as never

test('диалог: первое сообщение клиента создаёт тему с карточкой, следующие идут в ту же тему', async () => {
  const { repo, calls, send } = setup()
  await send(msg('Здравствуйте, нужна ретушь'))
  const created = calls.filter((c) => c.method === 'createForumTopic')
  assert.equal(created.length, 1)
  assert.match(String(created[0].payload.name), /@maria_photo/)
  const topic = repo.clients[0].admin_topic_id!
  assert.ok(topic)
  assert.ok(calls.some((c) => c.method === 'pinChatMessage'))
  const card = calls.find((c) => c.method === 'sendMessage' && c.payload.chat_id === GROUP)!
  assert.match(String(card.payload.text), /Мария/)
  assert.equal(calls.filter((c) => c.method === 'copyMessage' && c.payload.chat_id === GROUP && c.payload.message_thread_id === topic).length, 1)
  await send(msg('Ещё вопрос', { message_id: 2 }))
  assert.equal(calls.filter((c) => c.method === 'createForumTopic').length, 1)
  assert.equal(calls.filter((c) => c.method === 'copyMessage' && c.payload.chat_id === GROUP).length, 2)
})

test('диалог: ответ сотрудника в теме уходит клиенту, «//» остаётся заметкой, /close закрывает', async () => {
  const { repo, calls, send } = setup()
  await send(msg('Привет'))
  const topic = repo.clients[0].admin_topic_id!
  await send(topicMsg(topic, 'Добрый день! Чем помочь?', 5))
  const toClient = calls.filter((c) => c.method === 'copyMessage' && c.payload.chat_id === 555)
  assert.equal(toClient.length, 1)
  assert.equal(repo.messages.filter((x) => x.direction === 'admin').length, 1)
  assert.ok(calls.some((c) => c.method === 'setMessageReaction'))

  await send(topicMsg(topic, '// просил скидку, перезвонить во вторник', 6))
  assert.equal(calls.filter((c) => c.method === 'copyMessage' && c.payload.chat_id === 555).length, 1)
  assert.equal(repo.notes.length, 1)
  assert.equal(repo.notes[0].source, 'admin')
  assert.equal(repo.notes[0].client_id, repo.clients[0].id)
  assert.match(repo.notes[0].text, /^просил скидку/)

  await send(topicMsg(topic, '/close', 7))
  assert.ok(repo.clients[0].dialog_closed_at)
  assert.ok(calls.some((c) => c.method === 'closeForumTopic'))
  await send(msg('А ещё вопрос', { message_id: 3 }))
  assert.ok(calls.some((c) => c.method === 'reopenForumTopic'))
  assert.equal(repo.clients[0].dialog_closed_at, null)
})

test('диалог: тему удалили вручную, бот создаёт новую и повторяет доставку', async () => {
  const { repo, calls, failures, send } = setup()
  await send(msg('Привет'))
  const first = repo.clients[0].admin_topic_id!
  failures.add('copyMessage')
  await send(msg('Вы здесь?', { message_id: 2 }))
  assert.equal(calls.filter((c) => c.method === 'createForumTopic').length, 2)
  assert.notEqual(repo.clients[0].admin_topic_id, first)
})

test('диалог: служебные сообщения и чужие темы игнорируются', async () => {
  const { repo, calls, send } = setup()
  await send(msg('Привет'))
  const before = calls.length
  await send(topicMsg(repo.clients[0].admin_topic_id!, '', 8, { text: undefined, forum_topic_created: { name: 'x', icon_color: 1 } }))
  await send(topicMsg(9999, 'сообщение в неизвестной теме', 9))
  assert.equal(calls.length, before)
})

const publish = (repo: ReturnType<typeof setup>['repo'], graph = demoGraph) =>
  repo.funnels.push({ id: 'f1', name: 'Демо', status: 'published', graph, ai_enabled: false, version: 1 })
const START_ENT = { entities: [{ type: 'bot_command', offset: 0, length: 6 }] }

test('воронка: /start присылает только приветствие воронки с кнопками, без запроса согласия', async () => {
  const { repo, calls, send } = setup()
  publish(repo)
  await send(msg('/start', START_ENT))
  const toClient = calls.filter((c) => c.method === 'sendMessage' && c.payload.chat_id === 555)
  assert.equal(toClient.length, 1)
  assert.match(String(toClient[0].payload.text), /Здравствуйте, Мария!/)
  assert.doesNotMatch(String(toClient[0].payload.text), /согласие/)
  assert.match(JSON.stringify(toClient[0].payload.reply_markup), /fb:[0-9a-f-]{36}:q1/)
  assert.equal(repo.runs[0].status, 'waiting')
})

test('воронка: кнопка «Связаться с админом» передаёт диалог, бот дальше молчит', async () => {
  const { repo, calls, send } = setup()
  publish(repo)
  await send(msg('/start', START_ENT))
  await send({ callback_query: { id: 'c1', from: user, chat_instance: 'x', data: `fb:${repo.runs[0].id}:q4`, message: { message_id: 9, date: 1, chat: priv } } })
  assert.equal(repo.runs[0].status, 'stopped')
  assert.ok(repo.clients[0].human_until)
  assert.ok(calls.some((c) => c.method === 'sendMessage' && /администратору/.test(String(c.payload.text))))
  // сообщение клиента попадает сотрудникам, но бот не отвечает ни воронкой, ни подтверждением
  const before = calls.filter((c) => c.method === 'sendMessage' && c.payload.chat_id === 555).length
  await send(msg('Жду ответа', { message_id: 20 }))
  assert.equal(calls.filter((c) => c.method === 'sendMessage' && c.payload.chat_id === 555).length, before)
  assert.ok(calls.some((c) => c.method === 'copyMessage' && c.payload.chat_id === GROUP))
})

test('воронка: чужая кнопка и старый запуск не срабатывают', async () => {
  const { repo, calls, send } = setup()
  publish(repo)
  await send(msg('/start', START_ENT))
  const other = { ...user, id: 999, username: 'other' }
  await send({ callback_query: { id: 'c2', from: other, chat_instance: 'x', data: `fb:${repo.runs[0].id}:q1`, message: { message_id: 9, date: 1, chat: { id: 999, type: 'private', first_name: 'X' } } } })
  assert.equal(repo.runs[0].status, 'waiting')
  assert.ok(calls.some((c) => c.method === 'answerCallbackQuery' && /больше не работает/.test(String(c.payload.text))))
})

test('воронка по ключевому слову запускается на сообщение', async () => {
  const { repo, calls, send } = setup()
  const kw = JSON.parse(JSON.stringify(demoGraph))
  kw.nodes[0].data = { triggers: [TRIGGER.keyword], keyword: 'цена, прайс' }
  publish(repo, kw)
  await send(msg('Какая цена у ретуши?'))
  assert.equal(repo.runs.length, 1)
  assert.ok(calls.some((c) => c.method === 'sendMessage' && /Здравствуйте, Мария/.test(String(c.payload.text))))
  assert.ok(!calls.some((c) => /Передали администратору/.test(String(c.payload.text ?? ''))))
})

test('/shablon в теме показывает шаблоны, кнопка отправляет клиенту с подстановкой имени', async () => {
  const { repo, calls, send } = setup()
  await send(msg('Здравствуйте'))
  const client = repo.clients[0]
  const topic = client.admin_topic_id!
  repo.templates.push({ id: '11111111-1111-1111-1111-111111111111', kind: 'text', title: 'Привет', body: 'Здравствуйте, {имя}!', body_en: 'Hello, {имя}!', media_url: null, task: 'Первое касание', goal: 'Привлечь заявку', services: ['Общее'], fav: true, used: 0, updated_at: '' })
  await send(topicMsg(topic, '/shablon', 20))
  const menu = calls.filter((c) => c.method === 'sendMessage' && JSON.stringify(c.payload.reply_markup ?? '').includes('tpl:1111'))
  assert.equal(menu.length, 1)
  await send({ callback_query: { id: 'c1', from: staff, chat_instance: 'x', data: 'tpl:11111111-1111-1111-1111-111111111111', message: { message_id: 50, date: 1, chat: { id: GROUP, type: 'supergroup', title: 'Лиды ST96', is_forum: true }, is_topic_message: true, message_thread_id: topic } } } as never)
  const out = calls.filter((c) => c.method === 'sendMessage' && c.payload.chat_id === 555).pop()!
  assert.match(String(out.payload.text), /Здравствуйте, Мария!/)
  assert.equal(repo.templates[0].used, 1)
})

test('/shablon без шаблонов подсказывает, где их создать', async () => {
  const { repo, calls, send } = setup()
  await send(msg('Привет'))
  await send(topicMsg(repo.clients[0].admin_topic_id!, '/shablon', 21))
  assert.ok(calls.some((c) => c.method === 'sendMessage' && /Шаблонов пока нет/.test(String(c.payload.text))))
})

test('/book в теме отправляет клиенту личную ссылку на запись и оставляет её в теме', async () => {
  const { repo, calls, send } = setup()
  await send(msg('Здравствуйте'))
  const client = repo.clients[0]
  await send(topicMsg(client.admin_topic_id!, '/book', 22))
  const toClient = calls.filter((c) => c.method === 'sendMessage' && c.payload.chat_id === 555).pop()!
  assert.match(String(toClient.payload.text), new RegExp(`Выберите удобное время.*https://st96\\.by/book\\?c=${client.id}`))
  const inTopic = calls.filter((c) => c.method === 'sendMessage' && c.payload.chat_id === GROUP).pop()!
  assert.match(String(inTopic.payload.text), /Ссылка на запись отправлена клиенту/)
  assert.ok(repo.messages.some((m) => m.direction === 'admin' && /book\?c=/.test(String(m.text))))
})

test('/start site_<id> привязывает Telegram к клиенту из заявки с сайта без дубля', async () => {
  const { repo, send } = setup()
  const lead = await repo.insertClient({ name: 'Анна', phone: '+375291112233', source: 'site' })
  await send(msg(`/start site_${lead.id}`, { entities: [{ type: 'bot_command', offset: 0, length: 6 }] }))
  assert.equal(repo.clients.length, 1, 'новый клиент не создан')
  assert.equal(repo.clients[0].id, lead.id)
  assert.equal(repo.clients[0].tg_user_id, 555)
  assert.equal(repo.clients[0].phone, '+375291112233')
  // повторный переход с чужой ссылкой не перетирает уже привязанного
  await send(msg(`/start site_${lead.id}`, { entities: [{ type: 'bot_command', offset: 0, length: 6 }] }))
  assert.equal(repo.clients.length, 1)
})

test('/start bk_<токен> из страницы записи: ник сохраняется под токеном, клиент и воронка не создаются', async () => {
  const { repo, calls, send } = setup()
  const token = 'a1b2c3d4e5f60718'
  await send(msg(`/start bk_${token}`, { entities: [{ type: 'bot_command', offset: 0, length: 6 }] }))
  assert.deepEqual(await repo.getTgLink(token), { username: 'maria_photo', first_name: 'Мария' })
  assert.equal(repo.clients.length, 0, 'клиент не создаётся: человек только подтягивает ник в форму')
  const replies = calls.filter((c) => c.method === 'sendMessage')
  assert.equal(replies.length, 1)
  assert.match(String(replies[0]!.payload.text), /@maria_photo/)
  assert.doesNotMatch(JSON.stringify(replies[0]!.payload.reply_markup ?? ''), /consent/)
  assert.equal(await repo.getTgLink('ffffffffffffffff'), null)
})

test('/start bk_<токен> без публичного ника: просим задать его, ник пустой', async () => {
  const { repo, calls, send } = setup()
  const token = '0123456789abcdef'
  const noName = { ...user, username: undefined }
  await send({ message: { message_id: 1, date: 1, chat: priv, from: noName, text: `/start bk_${token}`, entities: [{ type: 'bot_command', offset: 0, length: 6 }] } })
  assert.equal((await repo.getTgLink(token))?.username, null)
  assert.match(String(calls.find((c) => c.method === 'sendMessage')!.payload.text), /нет публичного ника/)
})

test('кнопки заявки на встречу работают в личном чате администратора из настроек, у остальных нет', async () => {
  const { repo, calls, send } = setup()
  const { createBooking } = await import('../booking/service')
  const NOW = new Date('2026-10-20T06:00:00Z')
  const r = await createBooking(repo, { service: 'production', format: 'call', date: '2026-10-21', time: '11:00', name: 'Анна', phone: '+375 29 111-22-33' }, NOW)
  assert.ok(r.ok)
  if (!r.ok) return
  const btn = (from: typeof user, chatId: number) => ({ callback_query: { id: 'q', from, chat_instance: 'x', data: `bk:ok:${r.booking.id}`, message: { message_id: 9, date: 1, chat: { id: chatId, type: 'private' as const, first_name: 'x' }, text: 'Новая заявка на встречу' } } })
  // обычный пользователь: ничего не происходит
  await send(btn({ ...user, username: 'random_person' }, 555))
  assert.equal(repo.bookings[0]!.status, 'pending')
  // администратор из настроек (по умолчанию studia96): заявка подтверждается
  await send(btn({ ...user, id: 777, username: 'Studia96' }, 777))
  assert.equal(repo.bookings[0]!.status, 'confirmed')
  assert.ok(calls.some((c) => c.method === 'answerCallbackQuery'))
})

test('нажатие кнопки воронки: кнопки ответов убираются, кнопки-ссылки остаются; во время диалога с человеком старые кнопки не перезапускают бота', async () => {
  const { repo, calls, send } = setup()
  publish(repo)
  await send(msg('/start', START_ENT))
  const run = repo.runs[0]!
  const markup = { inline_keyboard: [[{ text: 'Услуги и цены', callback_data: `fb:${run.id}:q1:m1` }], [{ text: 'Сайт', url: 'https://st96.by' }]] }
  const cb = (id: string, data: string) => ({ callback_query: { id, from: user, chat_instance: 'x', data, message: { message_id: 9, date: 1, chat: priv, text: 'x', reply_markup: markup } } })
  await send(cb('c1', `fb:${run.id}:q1:m1`) as never)
  const edit = calls.find((c) => c.method === 'editMessageReplyMarkup')!
  assert.deepEqual(edit.payload.reply_markup, { inline_keyboard: [[{ text: 'Сайт', url: 'https://st96.by' }]] })
  assert.ok(repo.events.some((e) => e.event === 'click'))

  await repo.updateClient(repo.clients[0]!.id, { human_until: new Date(Date.now() + 3600_000).toISOString() })
  const clicks = repo.events.filter((e) => e.event === 'click').length
  await send(cb('c2', `fb:${run.id}:q2:m1`) as never)
  assert.equal(repo.events.filter((e) => e.event === 'click').length, clicks, 'пока отвечает человек, нажатие не запускает воронку')
  assert.ok(calls.some((c) => c.method === 'answerCallbackQuery' && /администратор/.test(String(c.payload.text))))
})

import { test } from 'node:test'
import assert from 'node:assert/strict'
import type { Update } from 'grammy/types'
import { memoryRepo } from '../memoryRepo'
import { createBot } from './bot'

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

test('/start создаёт клиента, пишет приветствие с кнопками согласия', async () => {
  const { repo, calls, send } = setup()
  await send(msg('/start stand', { entities: [{ type: 'bot_command', offset: 0, length: 6 }] }))
  assert.equal(repo.clients.length, 1)
  assert.equal(repo.clients[0].tg_user_id, 555)
  assert.equal(repo.clients[0].source, 'bot:stand')
  const reply = calls.find((c) => c.method === 'sendMessage')!
  assert.match(String(reply.payload.text), /ST96/)
  assert.match(JSON.stringify(reply.payload.reply_markup), /consent:yes/)
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

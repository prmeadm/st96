import { test } from 'node:test'
import assert from 'node:assert/strict'
import { memoryRepo } from '../memoryRepo'
import { ingestGroupMessage, ingestLead, type GroupMessage } from './ingest'
import { parseLead } from './parse'

const LEAD = [
  '\u{1F195} Заявка: Продакшн', 'Имя: Александра', 'Telegram: @Alex_Balashova', 'Компания: Фотограф/Видеограф',
  'Комментарий: возможно сервис по ретуши', 'Источник: стенд, форма в памятке сотрудника',
].join('\n')

const msg = (over: Partial<GroupMessage>): GroupMessage => ({
  chatId: -100, messageId: 1, text: '', fromId: 7, fromName: 'Сергей', fromIsBot: false, reply: null, ...over,
})

test('заявка создаёт клиента и заявку, повтор по телефону не плодит клиентов', async () => {
  const repo = memoryRepo()
  const a = await ingestLead(repo, parseLead(LEAD.replace('Имя: Александра', 'Имя: Александра\nТелефон: +375291234567')))
  const b = await ingestLead(repo, parseLead('\u{1F195} Заявка: Продакшн\nИмя: Саша\nТелефон: 8 029 123-45-67\nИсточник: стенд, форма в памятке сотрудника'))
  assert.equal(repo.clients.length, 1)
  assert.equal(repo.leads.length, 2)
  assert.equal(a.clientId, b.clientId)
  assert.equal(repo.clients[0].tg_username, 'Alex_Balashova')
  assert.equal(repo.leads[0].source, 'stand_form')
  assert.equal(repo.leads[0].service_key, 'production')
})

test('клиент находится по нику, пустые поля дополняются', async () => {
  const repo = memoryRepo()
  await ingestLead(repo, parseLead('\u{1F195} Заявка: Продакшн\nTelegram: @hoegaarden1693\nКомментарий: промо'))
  await ingestLead(repo, parseLead('\u{1F195} Заявка: Продакшн\nИмя: Хуго\nТелефон: +375291112233\nTelegram: hoegaarden1693'))
  assert.equal(repo.clients.length, 1)
  assert.equal(repo.clients[0].name, 'Хуго')
  assert.equal(repo.clients[0].phone, '+375291112233')
})

test('заявка без контактов сохраняется без клиента', async () => {
  const repo = memoryRepo()
  const r = await ingestLead(repo, parseLead('\u{1F195} Заявка: Продакшн\nИмя: Аноним\nКомментарий: звонил'))
  assert.equal(r.clientId, null)
  assert.equal(repo.leads.length, 1)
  assert.ok(repo.leads[0].warnings.includes('no_contact'))
})

test('ответ на старую заявку: заявка достаётся из текста и получает заметку', async () => {
  const repo = memoryRepo()
  const r = await ingestGroupMessage(repo, msg({ messageId: 50, text: 'Интересует франшиза - хочет запускать печатный центр', reply: { messageId: 10, text: LEAD } }))
  assert.equal(r.kind, 'note')
  assert.equal(repo.leads.length, 1)
  assert.equal(repo.leads[0].tg_message_id, 10)
  assert.equal(repo.notes.length, 1)
  assert.equal(repo.notes[0].source, 'group_reply')
  assert.equal(repo.notes[0].client_id, repo.clients[0].id)
  // второй ответ на то же сообщение не создаёт заявку заново
  await ingestGroupMessage(repo, msg({ messageId: 51, text: 'Перезвонить во вторник после обеда', reply: { messageId: 10, text: LEAD } }))
  assert.equal(repo.leads.length, 1)
  assert.equal(repo.notes.length, 2)
})

test('заметка без ответа привязывается по нику или телефону', async () => {
  const repo = memoryRepo()
  await ingestLead(repo, parseLead(LEAD), { tgChatId: -100, tgMessageId: 10 })
  const r = await ingestGroupMessage(repo, msg({ text: '@Alex_Balashova просила прислать примеры' }))
  assert.equal(r.kind, 'note')
  assert.equal(repo.notes[0].source, 'group_message')
  assert.ok(repo.notes[0].lead_id)
})

test('болтовня пропускается, длинное сообщение без привязки идёт в очередь', async () => {
  const repo = memoryRepo()
  assert.equal((await ingestGroupMessage(repo, msg({ text: 'ок' }))).kind, 'skipped')
  assert.equal((await ingestGroupMessage(repo, msg({ text: '/start' }))).kind, 'skipped')
  assert.equal((await ingestGroupMessage(repo, msg({ text: LEAD, fromIsBot: true }))).kind, 'skipped')
  const r = await ingestGroupMessage(repo, msg({ text: 'Клиент со стенда просил вернуться к вопросу после праздников' }))
  assert.equal(r.kind, 'unassigned_note')
  assert.equal(repo.notes[0].lead_id, null)
})

test('сотрудник вставил заявку вручную в группу', async () => {
  const repo = memoryRepo()
  const r = await ingestGroupMessage(repo, msg({ messageId: 77, text: LEAD }))
  assert.equal(r.kind, 'lead')
  assert.equal(repo.leads[0].tg_message_id, 77)
})

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { memoryRepo } from '../memoryRepo'
import { createManualLead, parseManualText, updateManualLead } from './manual'

test('текст без меток: имя, телефон, ник, услуга и комментарий встают на места', () => {
  const { fields } = parseManualText('Анна Петрова\n8 029 111-22-33\n@anna_photo\nНужен продакшн для ролика о студии, бюджет обсудим')
  assert.equal(fields.name, 'Анна Петрова')
  assert.equal(fields.phone, '+375291112233')
  assert.equal(fields.telegram, '@anna_photo')
  assert.equal(fields.service_key, 'production')
  assert.equal(fields.comment, 'Нужен продакшн для ролика о студии, бюджет обсудим')
})

test('текст с метками и шапкой пересланного сообщения', () => {
  const t = 'Игорь Смирнов, [20.10.2026 09:15]\nТелефон: +375 33 555-44-33\nКомпания: Ромашка\nИнтересует: Коммерческий промоушн\nСообщение: Хотим запустить кампанию.\nЕщё нужен креатив'
  const { fields } = parseManualText(t)
  assert.equal(fields.name, 'Игорь Смирнов')
  assert.equal(fields.phone, '+375335554433')
  assert.equal(fields.company, 'Ромашка')
  assert.equal(fields.service_key, 'promotion')
  assert.equal(fields.comment, 'Хотим запустить кампанию.\nЕщё нужен креатив')
})

test('контакты в одной строке и почта; ник не путается с почтой', () => {
  const { fields, warnings } = parseManualText('Мария, mariya@example.com, t.me/maria_k, +375 25 000-11-22. Интересует AI-разработка: чат-бот')
  assert.equal(fields.email, 'mariya@example.com')
  assert.equal(fields.telegram, '@maria_k')
  assert.equal(fields.phone, '+375250001122')
  assert.equal(fields.service_key, 'ai')
  assert.ok(!warnings.includes('no_contact'))
})

test('имя Светлана не даёт услугу по ключевому слову; без контактов предупреждение', () => {
  const { fields, warnings } = parseManualText('Светлана\nхочет уточнить условия')
  assert.equal(fields.name, 'Светлана')
  assert.equal(fields.service_key, 'other')
  assert.ok(warnings.includes('no_contact'))
})

test('формат заявок группы тоже понимается', () => {
  const { fields } = parseManualText('🆕 Заявка: Продакшн: ролики\nИмя: Олег\nТелефон: +375291112233\nКомментарий: Нужен ролик')
  assert.equal(fields.service_key, 'production')
  assert.equal(fields.name, 'Олег')
})

test('заявка создаёт клиента; вторая заявка того же человека идёт тому же клиенту; заявок может быть много', async () => {
  const repo = memoryRepo()
  const a = await createManualLead(repo, { name: 'Анна', phone: '8 029 111-22-33', service_key: 'production', comment: 'первая' }, 'raw')
  assert.ok(a.ok && a.clientCreated && a.leadsOfClient === 1)
  const b = await createManualLead(repo, { name: 'Анна П.', telegram: 't.me/anna_photo', phone: '+375291112233', service_key: 'ai', comment: 'вторая' }, 'raw')
  assert.ok(b.ok && !b.clientCreated && b.clientId === (a.ok && a.clientId) && b.leadsOfClient === 2)
  const c = await createManualLead(repo, { telegram: '@anna_photo', service_key: 'ai', comment: 'третья' }, '')
  assert.ok(c.ok && c.clientId === (a.ok && a.clientId) && c.leadsOfClient === 3, 'по нику находится тот же клиент')
  assert.equal(repo.clients.length, 1)
  assert.equal(repo.clients[0]!.tg_username, 'anna_photo', 'ник дополнил карточку клиента')
  assert.equal(repo.leads.length, 3)
  assert.equal(repo.leads[0]!.source, 'manual')
})

test('пустая заявка не создаётся', async () => {
  const r = await createManualLead(memoryRepo(), {}, '')
  assert.equal(r.ok, false)
})

test('правка заявки: поля меняются, при смене телефона заявка переезжает к другому клиенту', async () => {
  const repo = memoryRepo()
  const a = await createManualLead(repo, { name: 'Анна', phone: '+375291112233', service_key: 'production' }, '')
  const b = await createManualLead(repo, { name: 'Игорь', phone: '+375335554433', service_key: 'ai' }, '')
  assert.ok(a.ok && b.ok)
  if (!a.ok || !b.ok) return
  const e1 = await updateManualLead(repo, a.leadId, { name: 'Анна Петрова', phone: '+375291112233', service_key: 'promotion', comment: 'уточнили', status: 'in_progress' })
  assert.ok(e1.ok && e1.clientId === a.clientId)
  assert.equal(repo.leads.find((l) => l.id === a.leadId)!.service_key, 'promotion')
  assert.equal((repo.leads.find((l) => l.id === a.leadId) as { status?: string }).status, 'in_progress')
  const e2 = await updateManualLead(repo, a.leadId, { name: 'Анна', phone: '8 033 555-44-33', service_key: 'promotion' })
  assert.ok(e2.ok && e2.clientId === b.clientId && e2.leadsOfClient === 2, 'телефон Игоря: заявка у его клиента')
  const e3 = await updateManualLead(repo, a.leadId, { name: 'Новая', telegram: '@new_person', service_key: 'promotion' })
  assert.ok(e3.ok && e3.clientCreated && e3.clientId !== a.clientId && e3.clientId !== b.clientId)
  assert.equal((await updateManualLead(repo, 'нет', { name: 'x' })).ok, false)
})

test('фраза без заглавных слов не становится именем', () => {
  const { fields } = parseManualText('Тест: Продюсирование\nhttps://t.me/test_zayavka_96\nХотим обсудить релиз альбома')
  assert.equal(fields.name, '')
  assert.equal(fields.telegram, '@test_zayavka_96')
  assert.equal(fields.service_key, 'producing')
  assert.match(fields.comment, /Хотим обсудить релиз альбома/)
})

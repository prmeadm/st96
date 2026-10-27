import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createHash, createHmac } from 'node:crypto'
import { dataCheckString, signLoginData, verifyTelegramLogin, withDeadline } from './telegramLogin'

const TOKEN = '123456:TEST-token'
const NOW = 1_800_000_000

// Эталон по документации Telegram, посчитанный node:crypto, чтобы не проверять функцию ею же самой
function refHash(data: Record<string, unknown>, token = TOKEN) {
  const dcs = Object.keys(data).filter((k) => k !== 'hash').sort().map((k) => `${k}=${data[k]}`).join('\n')
  return createHmac('sha256', createHash('sha256').update(token).digest()).update(dcs).digest('hex')
}

const base = { id: 555, first_name: 'Мария', last_name: 'Иванова', username: 'maria_photo', photo_url: 'https://t.me/i/userpic/320/x.jpg', auth_date: NOW - 60 }
const signed = (d: Record<string, unknown> = base) => ({ ...d, hash: refHash(d) })

test('data-check-string: поля по алфавиту через \\n, без hash', () => {
  assert.equal(dataCheckString({ hash: 'x', username: 'u', id: 1, auth_date: 2 }), 'auth_date=2\nid=1\nusername=u')
})

test('верная подпись: возвращает данные пользователя', async () => {
  const r = await verifyTelegramLogin(signed(), TOKEN, NOW)
  assert.ok(r)
  assert.equal(r.id, 555)
  assert.equal(r.username, 'maria_photo')
  assert.equal(r.first_name, 'Мария')
})

test('подпись совпадает с эталонной формулой Telegram', async () => {
  assert.equal(await signLoginData(base, TOKEN), refHash(base))
})

test('без необязательных полей (нет ника, фамилии, фото) подпись тоже проходит', async () => {
  const d = { id: 777, first_name: 'Ivan', auth_date: NOW - 10 }
  assert.equal((await verifyTelegramLogin(signed(d), TOKEN, NOW))?.id, 777)
})

test('id и auth_date строками (из query-строки виджета) принимаются', async () => {
  const d = { id: '555', first_name: 'Мария', auth_date: String(NOW - 5) }
  const r = await verifyTelegramLogin({ ...d, hash: refHash(d) }, TOKEN, NOW)
  assert.equal(r?.id, 555)
  assert.equal(r?.auth_date, NOW - 5)
})

test('подделка любого поля, чужой токен, битый hash: отказ', async () => {
  const s = signed()
  assert.equal(await verifyTelegramLogin({ ...s, id: 556 }, TOKEN, NOW), null)
  assert.equal(await verifyTelegramLogin({ ...s, username: 'other' }, TOKEN, NOW), null)
  assert.equal(await verifyTelegramLogin({ ...s, extra: '1' }, TOKEN, NOW), null, 'лишнее поле ломает подпись')
  assert.equal(await verifyTelegramLogin(s, '999:OTHER', NOW), null)
  assert.equal(await verifyTelegramLogin({ ...s, hash: s.hash.slice(0, 62) }, TOKEN, NOW), null)
  assert.equal(await verifyTelegramLogin({ ...s, hash: 'z'.repeat(64) }, TOKEN, NOW), null)
  const { hash: _h, ...noHash } = s
  assert.equal(await verifyTelegramLogin(noHash, TOKEN, NOW), null)
})

test('auth_date старше суток или из будущего: отказ; ровно сутки ещё можно', async () => {
  assert.equal(await verifyTelegramLogin(signed({ ...base, auth_date: NOW - 86_401 }), TOKEN, NOW), null)
  assert.ok(await verifyTelegramLogin(signed({ ...base, auth_date: NOW - 86_400 }), TOKEN, NOW))
  assert.equal(await verifyTelegramLogin(signed({ ...base, auth_date: NOW + 3600 }), TOKEN, NOW), null)
})

test('мусор вместо объекта, пустой токен, вложенные объекты: отказ без исключения', async () => {
  for (const raw of [null, undefined, 'str', 42, [], {}]) assert.equal(await verifyTelegramLogin(raw, TOKEN, NOW), null)
  assert.equal(await verifyTelegramLogin(signed(), '', NOW), null)
  assert.equal(await verifyTelegramLogin({ ...signed(), first_name: { a: 1 } }, TOKEN, NOW), null)
  assert.equal(await verifyTelegramLogin(signed({ ...base, id: -5 }), TOKEN, NOW), null)
})

test('withDeadline: быстрый результат возвращается, долгий — false и дорабатывает в фоне через waitUntil', async () => {
  assert.equal(await withDeadline(Promise.resolve(true), 50), true)
  const bg: Promise<unknown>[] = []
  let done = false
  const slow = new Promise<boolean>((r) => setTimeout(() => { done = true; r(true) }, 80))
  const t0 = Date.now()
  assert.equal(await withDeadline(slow, 20, { waitUntil: (p) => bg.push(p) }), false)
  assert.ok(Date.now() - t0 < 70, 'ответ не ждал задачу')
  assert.equal(bg.length, 1)
  await bg[0]
  assert.equal(done, true)
})

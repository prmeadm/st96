import { test } from 'node:test'
import assert from 'node:assert/strict'
import { missingTokens, translateToEnglish } from './translate'
import type { Llm } from './agent/llm'

const reply = (text: string): Llm => async () => JSON.stringify({ text })

test('переводит и возвращает чистый текст', async () => {
  assert.equal(await translateToEnglish(reply('  Hello, {имя}! See you.  '), 'Здравствуйте, {имя}! До встречи.'), 'Hello, {имя}! See you.')
})

test('переменные, ссылки и команды должны сохраниться: при потере повторяет запрос с подсказкой', async () => {
  const seen: string[] = []
  let n = 0
  const llm: Llm = async ({ user }) => {
    seen.push(user)
    return JSON.stringify({ text: n++ === 0 ? 'Hello, Anna! https://st96.by' : 'Hello, {имя}! https://st96.by Unsubscribe: /stop' })
  }
  const out = await translateToEnglish(llm, 'Здравствуйте, {имя}! https://st96.by Отписаться: /stop')
  assert.equal(out, 'Hello, {имя}! https://st96.by Unsubscribe: /stop')
  assert.equal(seen.length, 2)
  assert.match(seen[1]!, /\{имя\}/)
})

test('если и со второй попытки токены потеряны, даёт понятную ошибку', async () => {
  await assert.rejects(translateToEnglish(reply('Hello, Anna!'), 'Привет, {имя}!'), /переменных или ссылок/)
})

test('пустой и слишком длинный текст отклоняются', async () => {
  await assert.rejects(translateToEnglish(reply('x'), '   '), /пуст/)
  await assert.rejects(translateToEnglish(reply('x'), 'я'.repeat(4000)), /длиннее/)
})

test('missingTokens учитывает количество вхождений', () => {
  assert.deepEqual(missingTokens('{имя} и {имя}', 'Anna and {имя}'), ['{имя}'])
  assert.deepEqual(missingTokens('без токенов', 'no tokens'), [])
})

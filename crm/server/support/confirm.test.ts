import { test } from 'node:test'
import assert from 'node:assert/strict'
import { isConfirmation, isRejection } from './confirm'

test('isConfirmation: распознаёт «Да» и другие кириллические подтверждения', () => {
  for (const s of ['Да', 'да', 'ок', 'ОК', 'ага', 'конечно', 'подтверждаю', 'согласен', 'согласна', 'верно', 'давай', 'поехали', 'вперёд', 'старт', 'yes', 'ok', 'go']) assert.ok(isConfirmation(s), s)
  for (const s of ['дай', 'нет', 'стоп', 'сделай правку', 'окна']) assert.ok(!isConfirmation(s), 'не ' + s)
})

test('isRejection: распознаёт «Нет», «отмена», «стоп»', () => {
  for (const s of ['Нет', 'нет', 'не надо', 'отмена', 'отмени', 'стоп', 'cancel', 'no']) assert.ok(isRejection(s), s)
  for (const s of ['не', 'да', 'ок', 'давай']) assert.ok(!isRejection(s), 'не ' + s)
})

test('короткое и длинное сообщения не считаются подтверждением', () => {
  assert.ok(!isConfirmation(''))
  assert.ok(!isConfirmation('x'.repeat(81)))
})

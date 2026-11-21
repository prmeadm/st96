import { test } from 'node:test'
import assert from 'node:assert/strict'
import { toSpeechText } from './voice'

test('toSpeechText: убирает ссылки и эмодзи, схлопывает пробелы', () => {
  assert.equal(toSpeechText('Привет 🤗 https://st96.by'), 'Привет')
  assert.equal(toSpeechText('Текст\n\n  ещё   текст'), 'Текст ещё текст')
  assert.equal(toSpeechText('Спасибо!'), 'Спасибо!')
})

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { isCreatorQuestion, CREATOR_ANSWER } from './creator'

test('isCreatorQuestion: ловит варианты про создателя/хозяина', () => {
  for (const q of [
    'кто тебя создал?',
    'кто тебя разработал',
    'кто твой разработчик',
    'кто твой хозяин',
    'кто твой владелец',
    'кто твой создатель',
    'кому ты служишь',
    'на кого ты работаешь',
    'чей ты бот',
    'чей ты агент',
  ]) assert.ok(isCreatorQuestion(q), 'должен сматчиться: ' + q)
})

test('isCreatorQuestion: не путает с обычными запросами', () => {
  for (const q of ['поменяй заголовок', 'какие у меня проекты', 'размести котика', 'спасибо', 'сколько стоит пакет']) {
    assert.equal(isCreatorQuestion(q), false, 'не должен сматчиться: ' + q)
  }
})

test('CREATOR_ANSWER: содержит инстаграм-ссылку', () => {
  assert.ok(CREATOR_ANSWER.includes('https://www.instagram.com/dzmitry_st96/'))
  assert.ok(CREATOR_ANSWER.includes('Гений, миллиардер, плейбой, филантроп'))
})

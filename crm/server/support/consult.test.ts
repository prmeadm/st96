import { test } from 'node:test'
import assert from 'node:assert/strict'
import type { Llm } from '../agent/llm'
import { buildConsultSystem, consultAnswer } from './consult'

test('консультант: рабочие часы, запись, тон на «ты», допродажа и честный отказ', () => {
  const s = buildConsultSystem({ question: 'Когда со мной свяжется менеджер?', lang: 'ru' })
  assert.match(s, /Пн–Чт 10:00–18:00, Пт 10:00–16:00/)
  assert.match(s, /https:\/\/st96\.by\/book/)
  assert.match(s, /всегда на «ты», никогда на «вы»/)
  assert.match(s, /допродавай/)
  assert.match(s, /Слушай, Давай запишу тебя на встречу к коженным/)
  assert.match(s, /правки выполняются в рамках оплаченного пакета/)
  assert.match(s, /НЕ предлагай встречу/)
})

test('консультант: ответ модели разбирается как JSON, пустой вопрос — без обращения к модели', async () => {
  const seen: string[] = []
  const ask: Llm = async ({ user }) => { seen.push(user); return JSON.stringify({ answer: 'Менеджер на связи Пн–Чт 10:00–18:00.' }) }
  assert.equal(await consultAnswer(ask, { question: 'Когда менеджер?', lang: 'ru' }), 'Менеджер на связи Пн–Чт 10:00–18:00.')
  assert.equal(await consultAnswer(ask, { question: '  ', lang: 'ru' }), '')
  assert.equal(seen.length, 1)
})

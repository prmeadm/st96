import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildSupportSystem, replySupport } from './reply'
import type { Llm } from '../agent/llm'
import type { Scenario } from './agent'

const scenario: Scenario = {
  system_prompt: 'Роль: агент поддержки сайта «Музыкальное лото». Только правки текста и контента.',
  scope_notes: null,
  stop_conditions: 'неоднозначный запрос — уточни; вне рамок — вежливо откажи.',
  allowed_actions: null,
}

const base = {
  scenario,
  request_text: 'хочу поправить заголовок',
  lang: 'ru' as const,
  status: 'clarify' as const,
  name: 'Дмитрий',
  clientId: 'c1',
}

test('система ответчика: содержит сценарий, тон «на ты» и ветку', () => {
  const s = buildSupportSystem({ ...base, status: 'clarify' })
  assert.match(s, /Музыкальное лото/)
  assert.match(s, /всегда на «ты», никогда на «вы»/)
  assert.match(s, /соблюдать сценарий проекта/)
})

test('clarify: просит детали и НЕ предлагает встречу', () => {
  const s = buildSupportSystem({ ...base, status: 'clarify' })
  assert.match(s, /Уточни подробно/)
  assert.match(s, /НЕ предлагай записаться на встречу/)
  assert.doesNotMatch(s, /https:\/\/st96\.by\/book/)
})

test('out_of_scope: «оценивается отдельно» + ссылка на встречу', () => {
  const s = buildSupportSystem({ ...base, status: 'out_of_scope' })
  assert.match(s, /оценивается отдельно/)
  assert.match(s, /предложи записаться на встречу/)
  assert.match(s, /https:\/\/st96\.by\/book/)
})

test('awaiting_payment: новый пакет + менеджер', () => {
  const s = buildSupportSystem({ ...base, status: 'awaiting_payment', reason: 'лимит функций исчерпан' })
  assert.match(s, /нужен новый\/расширенный пакет/)
  assert.match(s, /лимит функций исчерпан/)
})

test('replySupport: разбирает JSON-ответ модели', async () => {
  const ask: Llm = async ({ system }) => {
    assert.match(system, /Музыкальное лото/)
    return JSON.stringify({ answer: 'Что именно поправить?' })
  }
  const a = await replySupport(ask, { ...base, status: 'clarify' })
  assert.equal(a, 'Что именно поправить?')
})

test('replySupport: out_of_scope при пустом ответе — детерминированный резерв со ссылкой', async () => {
  const ask: Llm = async () => 'not json'
  const a = await replySupport(ask, { ...base, status: 'out_of_scope' })
  assert.match(a, /оценивается отдельно/)
  assert.match(a, /https:\/\/st96\.by\/book/)
})

test('replySupport: пустой вопрос — без обращения к модели', async () => {
  let called = false
  const ask: Llm = async () => { called = true; return '{}' }
  const a = await replySupport(ask, { ...base, request_text: '   ' })
  assert.equal(a, '')
  assert.equal(called, false)
})

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildPrompt, decide, isGratitude, remainingCorrections, type AgentInput, type Classification, type Classify, type Limits, type Scenario } from './agent'

const scenario: Scenario = { system_prompt: 'Только правки текста в проекте', scope_notes: 'Сайт st96.by', stop_conditions: 'Не трогать оплату', allowed_actions: 'edit,deploy' }
const limits = (over: Partial<Limits> = {}): Limits => ({ corrections_limit: 5, corrections_used: 2, features_limit: 0, features_used: 0, requests_limit: null, requests_used: 0, ...over })
const input = (request: string, over: Partial<Limits> = {}, hasActivePeriod = true): AgentInput => ({ request_text: request, scenario, limits: limits(over), hasActivePeriod })
const cls = (c: Classification): Classify => async () => c

test('остаток правок: лимит минус использованное, null = без лимита', () => {
  assert.equal(remainingCorrections(limits()), 3)
  assert.equal(remainingCorrections(limits({ corrections_limit: null })), null)
  assert.equal(remainingCorrections(limits({ corrections_used: 5 })), 0)
})

test('нужно уточнение → clarify', async () => {
  const d = await decide(input('поменяйте'), cls({ kind: 'clarify', reason: 'Что именно менять?' }))
  assert.equal(d.status, 'clarify')
  assert.deepEqual(d.audit.map((a) => a.action), ['clarify'])
})

test('вне рамок → out_of_scope', async () => {
  const d = await decide(input('сделайте интеграцию с банком'), cls({ kind: 'out_of_scope', reason: 'за рамками пакета' }))
  assert.equal(d.status, 'out_of_scope')
  assert.equal(d.audit[0].actor, 'ai')
})

test('штатная правка в пределах остатка → ready', async () => {
  const d = await decide(input('поменяйте заголовок'), cls({ kind: 'edits', edits: ['заголовок'], is_feature: false }))
  assert.equal(d.status, 'ready')
  assert.equal(d.edits_count, 1)
  assert.equal(d.remaining_after, 2)
  assert.deepEqual(d.audit.map((a) => a.action), ['planned'])
})

test('правок больше остатка → awaiting_payment', async () => {
  const d = await decide(input('сделайте 10 правок'), cls({ kind: 'edits', edits: ['1', '2', '3', '4', '5', '6'], is_feature: false }))
  assert.equal(d.status, 'awaiting_payment')
  assert.equal(d.edits_count, 6)
  assert.equal(d.audit[0].action, 'awaiting_payment')
})

test('новые функции при исчерпанном лимите → awaiting_payment', async () => {
  const d = await decide(input('добавьте страницу'), cls({ kind: 'edits', edits: ['страница'], is_feature: true }))
  assert.equal(d.status, 'awaiting_payment')
  assert.equal(d.is_feature, true)
})

test('новая функция при безлимите функций → ready', async () => {
  const d2 = await decide(input('добавьте страницу', { features_limit: null }), cls({ kind: 'edits', edits: ['страница'], is_feature: true }))
  assert.equal(d2.status, 'ready')
  assert.equal(d2.is_feature, true)
})

test('isGratitude: чистая благодарность vs с просьбой', () => {
  assert.equal(isGratitude('Спасибо!'), true)
  assert.equal(isGratitude('благодарю вас'), true)
  assert.equal(isGratitude('Спасибо, но поменяйте заголовок'), false)
  assert.equal(isGratitude('нужно поменять текст'), false)
})

test('благодарность распознаётся детерминированно (без LLM) → thanks', async () => {
  const d = await decide(input('Спасибо большое!', {}, false), cls({ kind: 'clarify', reason: 'x' }))
  assert.equal(d.status, 'thanks')
})

test('благодарность → thanks, даже без активного периода', async () => {
  const d = await decide(input('спасибо большое', {}, false), cls({ kind: 'thanks', reason: 'благодарность' }))
  assert.equal(d.status, 'thanks')
  assert.equal(d.audit[0].action, 'thanks')
})

test('нет активного оплаченного периода → awaiting_payment (гейт Фазы 5)', async () => {
  const d = await decide(input('поменяйте заголовок', {}, false), cls({ kind: 'edits', edits: ['заголовок'], is_feature: false }))
  assert.equal(d.status, 'awaiting_payment')
  assert.equal(d.audit[0].payload?.reason, 'no_active_period')
})

test('промпт включает рамки, лимиты и обращение', () => {
  const p = buildPrompt(input('поменяйте заголовок'))
  assert.match(p, /Только правки текста/)
  assert.match(p, /Остаток правок: 3/)
  assert.match(p, /поменяйте заголовок/)
})

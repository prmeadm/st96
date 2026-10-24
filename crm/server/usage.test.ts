import { test } from 'node:test'
import assert from 'node:assert/strict'
import { openAiCompatible, type UsageRow } from './agent/llm'
import { memoryRepo } from './memoryRepo'
import { translateToEnglish } from './translate'
import { costUsd, featureLabel, parsePrices, periodStart, popularityScore, priceOf, ratings } from './usage'

const withFetch = async (reply: unknown, fn: () => Promise<void>) => {
  const orig = globalThis.fetch
  globalThis.fetch = (async () => new Response(JSON.stringify(reply), { status: 200 })) as typeof fetch
  try { await fn() } finally { globalThis.fetch = orig }
}

test('стоимость: вход и выход по ценам модели, своя цена перекрывает каталог, неизвестная модель без суммы', () => {
  assert.ok(Math.abs(costUsd('gemini-3.8-flash', 1_000_000, 1_000_000)! - 4.5) < 1e-9)
  assert.ok(Math.abs(costUsd('gemini-3.5-flash-lite', 2000, 500)! - (0.0006 + 0.00125)) < 1e-9)
  assert.equal(costUsd('gemini-3.8-flash', 1e6, 0, { 'gemini-3.8-flash': { in: 2, out: 9 } }), 2)
  assert.equal(costUsd('my-model', 100, 100), null)
  assert.equal(priceOf('gemini-3.1-flash-lite')!.estimate, true, 'цена 3.1 Flash-Lite помечена оценкой')
  assert.deepEqual(parsePrices('{"a":{"in":1,"out":2},"b":{"in":"x","out":1},"c":{"in":-1,"out":1}}'), { a: { in: 1, out: 2 } })
  assert.deepEqual(parsePrices('мусор'), {})
})

test('функции получают понятные названия', () => {
  assert.equal(featureLabel('translate'), 'Перевод на английский')
  assert.equal(featureLabel('agent:plan'), 'Агент: план задания')
  assert.equal(featureLabel('agent:новый'), 'Агент: новый')
  assert.equal(featureLabel('other'), 'other')
})

test('рейтинг популярности: отправка весит больше просмотра, лидер = 100, без активности = 0', () => {
  const s = { views: 10, uses: 1, funnels: 0, broadcasts: 0 }
  assert.equal(popularityScore(s), 15)
  assert.equal(popularityScore({ views: 0, uses: 2, funnels: 1, broadcasts: 1 }), 16)
  const r = ratings([16, 8, 0])
  assert.deepEqual(r.map((x) => x.pct), [100, 50, 0])
  assert.deepEqual(r.map((x) => x.stars), [5, 3, 0])
  assert.deepEqual(ratings([0, 0]).map((x) => x.pct), [0, 0])
})

test('период «последние N дней» начинается с полуночи по Минску', () => {
  const now = new Date('2026-10-20T10:00:00Z') // 13:00 по Минску
  assert.equal(periodStart(1, now), '2026-10-19T21:00:00.000Z')
  assert.equal(periodStart(7, now), '2026-10-13T21:00:00.000Z')
})

test('вызов модели записывает токены, модель и функцию; «размышления» считаются выходом', async () => {
  const rows: UsageRow[] = []
  await withFetch({ choices: [{ message: { content: '{"text":"ok"}' } }], usage: { prompt_tokens: 100, completion_tokens: 20, total_tokens: 180 } }, async () => {
    const llm = openAiCompatible({ apiKey: 'k', model: 'gemini-3.8-flash', onUsage: (u) => { rows.push(u) } })
    assert.equal(await llm({ system: 's', user: 'u', feature: 'agent:plan' }), '{"text":"ok"}')
  })
  assert.deepEqual(rows, [{ model: 'gemini-3.8-flash', feature: 'agent:plan', prompt_tokens: 100, completion_tokens: 80, total_tokens: 180, estimated: false }])
})

test('нет usage в ответе: токены оцениваются по длине и помечаются; сбой учёта не ломает вызов', async () => {
  const rows: UsageRow[] = []
  await withFetch({ choices: [{ message: { content: 'x'.repeat(40) } }] }, async () => {
    const llm = openAiCompatible({ apiKey: 'k', model: 'm', onUsage: (u) => { rows.push(u) } })
    await llm({ system: 'a'.repeat(40), user: 'b'.repeat(40) })
  })
  assert.equal(rows[0]!.estimated, true)
  assert.equal(rows[0]!.prompt_tokens, 20)
  assert.equal(rows[0]!.completion_tokens, 10)
  assert.equal(rows[0]!.feature, 'other')
  await withFetch({ choices: [{ message: { content: 'ok' } }], usage: { total_tokens: 5 } }, async () => {
    const llm = openAiCompatible({ apiKey: 'k', model: 'm', onUsage: () => { throw new Error('база недоступна') } })
    assert.equal(await llm({ system: 's', user: 'u' }), 'ok')
  })
})

test('перевод передаёт функцию «translate»; события шаблонов копятся в репозитории', async () => {
  const seen: (string | undefined)[] = []
  await translateToEnglish(async (r) => { seen.push(r.feature); return JSON.stringify({ text: 'Hello, {имя}' }) }, 'Привет, {имя}')
  assert.deepEqual(seen, ['translate'])
  const repo = memoryRepo()
  const t = await repo.insertTemplate({ title: 'T', kind: 'text', body: 'b', task: 'Первое касание', goal: 'Прогреть', services: ['Общее'] })
  await repo.bumpTemplateUsed(t.id)
  await repo.recordTemplateEvent(t.id, 'view')
  assert.deepEqual(repo.templateEvents.map((e) => e.kind), ['use', 'view'])
})

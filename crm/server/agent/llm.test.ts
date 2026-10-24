import assert from 'node:assert/strict'
import { test } from 'node:test'
import { LlmError, openAiCompatible } from './llm'

test('общий срок обращений к модели: зависший ответ даёт понятную ошибку, а не долгое ожидание', async () => {
  const real = globalThis.fetch
  let calls = 0
  const keepAlive = setInterval(() => undefined, 50) // таймер AbortSignal.timeout не держит цикл событий
  globalThis.fetch = ((_: unknown, init?: RequestInit) => {
    calls++
    return new Promise((_res, rej) => init?.signal?.addEventListener('abort', () => rej(new Error('aborted'))))
  }) as typeof fetch
  try {
    const llm = openAiCompatible({ apiKey: 'k', models: ['a', 'b', 'c'], deadlineMs: 1700 })
    const t0 = Date.now()
    await assert.rejects(llm({ system: 's', user: 'u' }), LlmError)
    assert.ok(Date.now() - t0 < 4000, 'должно уложиться в общий срок')
    assert.equal(calls, 1, 'после исчерпания срока новые обращения не начинаются')
  } finally {
    globalThis.fetch = real
    clearInterval(keepAlive)
  }
})

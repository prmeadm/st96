import { test } from 'node:test'
import assert from 'node:assert/strict'
import { memoryRepo } from '../memoryRepo'
import type { Llm } from '../agent/llm'
import { LlmError } from '../agent/llm'
import { handleFreeText, startFunnel, type Env, type Out } from './engine'
import { buildConsultSystem, consult, graphKnowledge } from './consultant'
import { TRIGGER, type Funnel, type Graph } from './types'

type Call = { kind: 'text' | 'notify'; text?: string }

function setup(graph: Graph, llm?: Llm) {
  const repo = memoryRepo()
  const calls: Call[] = []
  const out: Out = {
    async sendText(_c, text) { calls.push({ kind: 'text', text }) },
    async sendMedia() {},
    async notifyAdmins(_cl, text) { calls.push({ kind: 'notify', text }) },
  }
  const now = new Date('2026-11-23T09:00:00Z') // понедельник, 12:00 по Минску, рабочее время
  const env: Env = { repo, out, now: () => now, ask: llm }
  const funnel: Funnel = { id: 'f1', name: 'Тест', status: 'published', graph, ai_enabled: true, version: 1 }
  repo.funnels.push(funnel)
  const clientP = repo.insertClient({ tg_user_id: 555, name: 'Мария', language: 'ru', consent_at: '2026-10-01T00:00:00Z' })
  return { repo, calls, env, funnel, clientP }
}
const only = (c: Call[], k: Call['kind']) => c.filter((x) => x.kind === k)
const g = (nodes: Graph['nodes'], edges: Graph['edges']): Graph => ({ nodes, edges })
const startNode = { id: 'start', type: 'start' as const, data: { triggers: [TRIGGER.start], keyword: '' } }
const msg = (id: string, text: string, quick: { id: string; label: string }[] = []) => ({ id, type: 'message' as const, data: { parts: [{ id: 'p', kind: 'text' as const, text }], quick, links: [] } })

/** Модель-заглушка: возвращает JSON {"answer": ...} и запоминает, что у неё спросили. */
function fakeLlm(answer: string | (() => string)) {
  const seen: { system: string; user: string }[] = []
  const llm: Llm = async (req) => {
    seen.push({ system: req.system, user: req.user })
    const text = typeof answer === 'function' ? answer() : answer
    return JSON.stringify({ answer: text })
  }
  return { llm, seen }
}

test('подсказка консультанта: рабочие часы, ссылка на запись, услуги сайта и запрет выдумывать', () => {
  const s = buildConsultSystem({ lang: 'ru', question: 'Когда со мной свяжется менеджер?' })
  assert.match(s, /Пн–Чт 10:00–18:00, Пт 10:00–16:00, Сб–Вс — выходные/)
  assert.match(s, /https:\/\/st96\.by\/book/)
  assert.match(s, /Не придумывай/)
  assert.match(s, /услуги|Услуги/)
  assert.match(s, /JSON/)
})

test('подсказка консультанта: тон на «ты», допродажа и честный отказ', () => {
  const s = buildConsultSystem({ lang: 'ru', question: 'Сколько стоит ролик?' })
  assert.match(s, /всегда на «ты», никогда на «вы»/)
  assert.match(s, /допродавай/)
  assert.match(s, /WOW/)
  assert.match(s, /Слушай, Давай запишу тебя на встречу к коженным/)
})

test('подсказка консультанта: английский клиент — английские правила и язык ответа', () => {
  const s = buildConsultSystem({ lang: 'en', question: 'When can a manager call me?' })
  assert.match(s, /Mon–Thu 10:00–18:00, Fri 10:00–16:00/)
  assert.match(s, /Answer in English/)
})

test('база знаний из графа: тексты сообщений, кнопки и ссылки воронки', () => {
  const graph = g(
    [
      { id: 's', type: 'start', data: { triggers: [TRIGGER.start] } },
      { id: 'm', type: 'message', data: { parts: [{ id: 'p', kind: 'text', text: 'Мы делаем AI-видео' }], quick: [{ id: 'q', label: 'Видео продакшн' }], links: [{ id: 'l', label: 'Записаться', url: 'https://st96.by/book' }] } },
      { id: 'h', type: 'handoff', data: { message: 'Передаю администратору' } },
    ],
    [],
  )
  const k = graphKnowledge(graph, 'ru')
  assert.match(k, /Мы делаем AI-видео/)
  assert.match(k, /Видео продакшн/)
  assert.match(k, /https:\/\/st96\.by\/book/)
})

test('ответ модели разбирается как JSON; пустой вопрос — без обращения к модели', async () => {
  const { llm, seen } = fakeLlm('Менеджер свяжется с вами в рабочее время.')
  assert.equal(await consult(llm, { lang: 'ru', question: 'Когда менеджер?' }), 'Менеджер свяжется с вами в рабочее время.')
  assert.equal(seen.length, 1)
  assert.equal(await consult(llm, { lang: 'ru', question: '   ' }), '')
  assert.equal(seen.length, 1)
})

test('вопрос в воронке: сначала отвечает консультант, затем шаг воронки (ограничения прежние)', async () => {
  const graph = g(
    [startNode, msg('w', 'Напишите ваш вопрос', [{ id: 'q1', label: 'Услуги' }]), { id: 'h', type: 'handoff', data: { message: 'Передаю администратору', notify: false } }],
    [{ source: 'start', sourceHandle: 'out', target: 'w' }, { source: 'w', sourceHandle: 'out', target: 'h' }],
  )
  const { llm, seen } = fakeLlm('Менеджер на связи Пн–Чт 10:00–18:00. Записаться: https://st96.by/book')
  const { repo, calls, env, funnel, clientP } = setup(graph, llm)
  const client = await clientP
  await startFunnel(env, funnel, client)
  const run = repo.runs[0]!
  assert.equal(await handleFreeText(env, client, run, 'А когда со мной может связаться менеджер?'), true)
  assert.equal(seen.length, 1)
  assert.equal(seen[0]!.user, 'А когда со мной может связаться менеджер?')
  const texts = only(calls, 'text').map((c) => c.text!)
  assert.ok(texts.some((t) => /Пн–Чт 10:00–18:00/.test(t)), 'консультант ответил про рабочие часы')
  assert.ok(texts.some((t) => /Передаю администратору/.test(t)), 'передача человеку осталась как была')
  assert.ok(repo.messages.some((m) => m.direction === 'out' && /Пн–Чт/.test(m.text ?? '')), 'ответ записан в переписку')
})

test('вопрос в воронке: модель упала — прежнее поведение без ошибки', async () => {
  const graph = g(
    [startNode, msg('w', 'Напишите ваш вопрос', [{ id: 'q1', label: 'Услуги' }]), { id: 'h', type: 'handoff', data: { message: 'Передаю администратору', notify: false } }],
    [{ source: 'start', sourceHandle: 'out', target: 'w' }, { source: 'w', sourceHandle: 'out', target: 'h' }],
  )
  const llm: Llm = async () => { throw new LlmError('нет ключа') }
  const { calls, env, funnel, clientP } = setup(graph, llm)
  const client = await clientP
  await startFunnel(env, funnel, client)
  const run = (await env.repo.findActiveRun(client.id))!
  assert.equal(await handleFreeText(env, client, run, 'Сколько стоит?'), true)
  assert.ok(only(calls, 'text').some((c) => /Передаю администратору/.test(c.text!)))
})

test('блок «ИИ-ответ»: отвечает по графу, затем идёт дальше', async () => {
  const graph = g(
    [startNode, msg('w', 'Напишите вопрос', [{ id: 'q1', label: 'Услуги' }]), { id: 'a', type: 'ai', data: { goal: 'записать на встречу', offerBooking: true } }, msg('m2', 'Спасибо!')],
    [{ source: 'start', sourceHandle: 'out', target: 'w' }, { source: 'w', sourceHandle: 'out', target: 'a' }, { source: 'a', sourceHandle: 'out', target: 'm2' }],
  )
  const { llm, seen } = fakeLlm('Запишитесь на встречу: https://st96.by/book')
  const { calls, env, funnel, clientP } = setup(graph, llm)
  const client = await clientP
  await startFunnel(env, funnel, client)
  const run = (await env.repo.findActiveRun(client.id))!
  await handleFreeText(env, client, run, 'Когда можно поговорить?')
  assert.equal(seen.length, 1, 'вопрос ушёл в модель')
  assert.match(seen[0]!.system, /записать на встречу/, 'цель блока попала в подсказку')
  assert.match(seen[0]!.system, /Мы делаем|Напишите вопрос/, 'в подсказке тексты графа')
  const texts = only(calls, 'text').map((c) => c.text!)
  assert.ok(texts.some((t) => /Запишитесь на встречу/.test(t)))
  assert.ok(texts.some((t) => /Спасибо!/.test(t)), 'воронка продолжилась')
})

test('блок «ИИ-ответ»: модель молчит — отправляется запасное сообщение блока', async () => {
  const graph = g(
    [startNode, msg('w', 'Напишите вопрос', [{ id: 'q1', label: 'Услуги' }]), { id: 'a', type: 'ai', data: { goal: '', fallback: 'Уточню у менеджера и вернусь с ответом.' } }],
    [{ source: 'start', sourceHandle: 'out', target: 'w' }, { source: 'w', sourceHandle: 'out', target: 'a' }],
  )
  const llm: Llm = async () => { throw new LlmError('лимит') }
  const { calls, env, funnel, clientP } = setup(graph, llm)
  const client = await clientP
  await startFunnel(env, funnel, client)
  const run = (await env.repo.findActiveRun(client.id))!
  await handleFreeText(env, client, run, 'Есть ли скидки?')
  const texts = only(calls, 'text').map((c) => c.text!)
  assert.ok(texts.some((t) => /Уточню у менеджера/.test(t)))
})

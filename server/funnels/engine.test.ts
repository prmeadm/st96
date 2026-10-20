import { test } from 'node:test'
import assert from 'node:assert/strict'
import { memoryRepo } from '../memoryRepo'
import type { ClientRow } from '../repo'
import { handleClick, handleFreeText, resumeBooking, resumeRun, startFunnel, type Env, type Out } from './engine'
import { demoGraph } from './demo'
import { pickFunnel } from './triggers'
import { TRIGGER, type Funnel, type Graph } from './types'
import { validateGraph } from './validate'

type Call = { kind: 'text' | 'media' | 'notify'; text?: string; buttons?: unknown }

function setup(graph: Graph = demoGraph, client: Partial<ClientRow> = {}) {
  const repo = memoryRepo()
  const calls: Call[] = []
  const out: Out = {
    async sendText(_c, text, buttons) { calls.push({ kind: 'text', text, buttons }) },
    async sendMedia(_c, kind, url, _cap, buttons) { calls.push({ kind: 'media', text: `${kind}:${url}`, buttons }) },
    async notifyAdmins(_cl, text) { calls.push({ kind: 'notify', text }) },
  }
  let now = new Date('2026-10-20T10:00:00Z')
  const env: Env = { repo, out, now: () => now }
  const funnel: Funnel = { id: 'f1', name: 'Тест', status: 'published', graph, ai_enabled: false, version: 1 }
  repo.funnels.push(funnel)
  const clientP = repo.insertClient({ tg_user_id: 555, name: 'Мария', language: 'ru', consent_at: '2026-10-01T00:00:00Z', ...client })
  return { repo, calls, env, funnel, clientP, setNow: (d: Date) => { now = d } }
}
const only = (c: Call[], k: Call['kind']) => c.filter((x) => x.kind === k)
const g = (nodes: Graph['nodes'], edges: Graph['edges']): Graph => ({ nodes, edges })
const E = (s: string, h: string, t: string) => ({ source: s, sourceHandle: h, target: t })
const msg = (id: string, text: string, extra: object = {}) => ({ id, type: 'message' as const, data: { parts: [{ id: 'p', kind: 'text', text }], quick: [], links: [], ...extra } })
const start = (triggers: string[] = [TRIGGER.start], extra: object = {}) => ({ id: 'start', type: 'start' as const, data: { triggers, keyword: '', ...extra } })

test('старт: приветствие с кнопками, подстановка имени, воронка ждёт нажатия', async () => {
  const { repo, calls, env, funnel, clientP } = setup()
  const client = await clientP
  const r = await startFunnel(env, funnel, client)
  assert.equal(r, 'waiting_input')
  const t = only(calls, 'text')
  assert.equal(t.length, 1)
  assert.match(t[0].text!, /Здравствуйте, Мария!/)
  assert.equal((t[0].buttons as unknown[][]).length, 4)
  assert.match(JSON.stringify(t[0].buttons), /fb:[0-9a-f-]{36}:q1/)
  assert.equal(repo.runs[0].status, 'waiting')
  assert.equal(repo.runs[0].current_node, 'm1')
  assert.ok(repo.messages.some((m) => m.direction === 'out'))
})

test('кнопка «Услуги»: ответ со ссылкой, затем блок записи даёт личную ссылку и ждёт решения', async () => {
  const { repo, calls, env, funnel, clientP } = setup()
  const client = await clientP
  await startFunnel(env, funnel, client)
  const run = repo.runs[0]
  assert.equal(await handleClick(env, client, run, 'q1'), 'ok')
  assert.ok(only(calls, 'text').some((c) => /Наши услуги/.test(c.text!) && JSON.stringify(c.buttons).includes('st96.by')))
  const link = only(calls, 'text').find((c) => /Выберите удобное время/.test(c.text!))!
  assert.ok(link, 'клиент получил сообщение с выбором времени')
  assert.match(JSON.stringify(link.buttons), new RegExp(`https://st96.by/book\\?c=${client.id}&(?:s=[a-z_]+&)?r=${run.id}&n=b1`))
  assert.equal(repo.runs[0].status, 'waiting')
  assert.equal(repo.runs[0].vars.__wait, 'booking')
  assert.ok(!repo.clients[0].human_until, 'бот не замолкает: ждём запись, а не человека')
  assert.ok(repo.events.some((e) => e.event === 'click' && e.data?.quick === 'q1'))
})

test('кнопка «Связаться с админом»: передача человеку', async () => {
  const { repo, calls, env, funnel, clientP } = setup()
  const client = await clientP
  await startFunnel(env, funnel, client)
  await handleClick(env, client, repo.runs[0], 'q4')
  assert.ok(only(calls, 'text').some((c) => /администратору/.test(c.text!)))
  assert.ok(only(calls, 'notify').some((c) => /просит человека/.test(c.text!)))
  assert.equal(repo.runs[0].status, 'stopped')
})

test('устаревшая и неизвестная кнопки игнорируются, текст без выхода «другое» тоже', async () => {
  const { repo, env, funnel, clientP } = setup()
  const client = await clientP
  await startFunnel(env, funnel, client)
  assert.equal(await handleClick(env, client, repo.runs[0], 'zzz'), 'stale')
  assert.equal(await handleFreeText(env, client, repo.runs[0]), false)
  await handleClick(env, client, repo.runs[0], 'q4')
  assert.equal(await handleClick(env, client, repo.runs[0], 'q4'), 'stale')
})

test('текст клиента идёт по выходу «Если клиент написал другое»', async () => {
  const graph = g([start(), msg('m1', 'Выберите', { quick: [{ id: 'q1', label: 'Да' }] }), msg('m2', 'Принято: любой текст')], [E('start', 'out', 'm1'), E('m1', 'out', 'm2')])
  const { repo, calls, env, funnel, clientP } = setup(graph)
  const client = await clientP
  await startFunnel(env, funnel, client)
  assert.equal(await handleFreeText(env, client, repo.runs[0]), true)
  assert.ok(only(calls, 'text').some((c) => c.text === 'Принято: любой текст'))
  assert.equal(repo.runs[0].status, 'done')
})

test('условие по тегу, действие: тег, переменная и пауза, продолжение после паузы', async () => {
  const graph = g(
    [
      start(),
      { id: 'c1', type: 'condition', data: { mode: 'all', rules: [{ id: 'r', kind: 'tag', value: 'vip' }] } },
      msg('vip', 'Вы наш VIP'),
      { id: 'a1', type: 'action', data: { items: [{ id: 'x1', kind: 'addtag', value: 'новый, холодный' }, { id: 'x2', kind: 'setvar', value: 'шаг = 1' }, { id: 'x3', kind: 'delay', value: '2 часа' }, { id: 'x4', kind: 'notify', value: 'Прошло 2 часа' }] } },
      msg('late', 'Напоминаем о себе, {имя}'),
    ],
    [E('start', 'out', 'c1'), E('c1', 'yes', 'vip'), E('c1', 'no', 'a1'), E('a1', 'out', 'late')],
  )
  const { repo, calls, env, funnel, clientP, setNow } = setup(graph)
  const client = await clientP
  assert.equal(await startFunnel(env, funnel, client), 'waiting_timer')
  assert.deepEqual([...(await repo.listTags(client.id))].sort(), ['новый', 'холодный'])
  assert.equal(repo.jobs.length, 1)
  assert.equal(repo.jobs[0].run_at.toISOString(), '2026-10-20T12:00:00.000Z')
  assert.equal(only(calls, 'text').length, 0)
  assert.equal(only(calls, 'notify').length, 0)

  setNow(new Date('2026-10-20T12:00:01Z'))
  assert.equal(await resumeRun(env, repo.runs[0].id), 'resumed')
  assert.deepEqual(only(calls, 'notify').map((c) => c.text), ['Прошло 2 часа'])
  assert.deepEqual(only(calls, 'text').map((c) => c.text), ['Напоминаем о себе, Мария'])
  assert.equal(repo.runs[0].status, 'done')
  assert.equal(repo.runs[0].vars.шаг, '1')
  assert.equal(await resumeRun(env, repo.runs[0].id), 'skipped')

  // клиент с тегом vip идёт по ветке «да»
  const second = await repo.insertClient({ tg_user_id: 556, name: 'Пётр', consent_at: '2026-10-01T00:00:00Z' })
  await repo.addTag(second.id, 'VIP')
  await startFunnel(env, funnel, second)
  assert.ok(only(calls, 'text').some((c) => c.text === 'Вы наш VIP'))
})

test('после паузы сообщение не уходит клиенту без согласия или отписанному', async () => {
  const graph = g([start(), { id: 'a1', type: 'action', data: { items: [{ id: 'x', kind: 'delay', value: '1 час' }] } }, msg('m', 'Акция только сегодня')], [E('start', 'out', 'a1'), E('a1', 'out', 'm')])
  for (const patch of [{ consent_at: null }, { opted_out_at: '2026-10-10T00:00:00Z' }]) {
    const { repo, calls, env, funnel, clientP } = setup(graph, patch)
    const client = await clientP
    await startFunnel(env, funnel, client)
    await resumeRun(env, repo.runs[0].id)
    assert.equal(only(calls, 'text').length, 0)
    assert.ok(repo.events.some((e) => e.event === 'skipped_no_consent'))
  }
})

test('ответ на действие клиента уходит даже без согласия на рассылки', async () => {
  const { calls, env, funnel, clientP } = setup(demoGraph, { consent_at: null })
  await startFunnel(env, funnel, await clientP)
  assert.equal(only(calls, 'text').length, 1)
})

test('зацикленная схема останавливается', async () => {
  const graph = g([start(), msg('a', 'раз'), msg('b', 'два')], [E('start', 'out', 'a'), E('a', 'out', 'b'), E('b', 'out', 'a')])
  const { repo, calls, env, funnel, clientP } = setup(graph)
  await startFunnel(env, funnel, await clientP)
  assert.ok(only(calls, 'text').length <= 10)
  assert.ok(repo.events.some((e) => e.event === 'loop_guard'))
  assert.equal(repo.runs[0].status, 'done')
})

test('английский клиент получает английский текст и кнопки', async () => {
  const { calls, env, funnel, clientP } = setup(demoGraph, { language: 'en' })
  await startFunnel(env, funnel, await clientP)
  assert.match(only(calls, 'text')[0].text!, /^Hello, Мария!/)
  assert.match(JSON.stringify(only(calls, 'text')[0].buttons), /Services and prices/)
})

test('условия по времени, дню и полю контакта', async () => {
  const graph = g(
    [
      start(),
      { id: 'c', type: 'condition', data: { mode: 'all', rules: [{ id: '1', kind: 'time', value: 'С 09:00 до 18:00' }, { id: '2', kind: 'day', value: 'Вт' }, { id: '3', kind: 'field', value: 'компания = *' }] } },
      msg('y', 'рабочее время'), msg('n', 'нерабочее время'),
    ],
    [E('start', 'out', 'c'), E('c', 'yes', 'y'), E('c', 'no', 'n')],
  )
  // 2026-10-20 вторник, 10:00 UTC = 13:00 по Минску
  let s = setup(graph, { company: 'Лето' })
  await startFunnel(s.env, s.funnel, await s.clientP)
  assert.deepEqual(only(s.calls, 'text').map((c) => c.text), ['рабочее время'])
  s = setup(graph, { company: 'Лето' })
  s.setNow(new Date('2026-10-20T20:00:00Z')) // 23:00 по Минску
  await startFunnel(s.env, s.funnel, await s.clientP)
  assert.deepEqual(only(s.calls, 'text').map((c) => c.text), ['нерабочее время'])
  s = setup(graph, {})
  await startFunnel(s.env, s.funnel, await s.clientP)
  assert.deepEqual(only(s.calls, 'text').map((c) => c.text), ['нерабочее время'])
})

test('«запускать один раз»: повторный запуск не происходит', async () => {
  const graph = g([start([TRIGGER.start], { once: true }), msg('m', 'привет')], [E('start', 'out', 'm')])
  const { calls, env, funnel, clientP } = setup(graph)
  const client = await clientP
  await startFunnel(env, funnel, client)
  assert.equal(await startFunnel(env, funnel, client), null)
  assert.equal(only(calls, 'text').length, 1)
})

test('выбор воронки по триггеру', () => {
  const f = (id: string, triggers: string[], keyword = ''): Funnel => ({ id, name: id, status: 'published', ai_enabled: false, version: 1, graph: g([start(triggers, { keyword })], []) })
  const all = [f('any', [TRIGGER.any]), f('kw', [TRIGGER.keyword], 'цена, прайс'), f('site', [TRIGGER.site]), f('st', [TRIGGER.start])]
  assert.equal(pickFunnel(all, { kind: 'start' })?.id, 'st')
  assert.equal(pickFunnel(all, { kind: 'start', payload: 'site' })?.id, 'site')
  assert.equal(pickFunnel(all, { kind: 'text', text: 'Подскажите ЦЕНУ?' })?.id, 'any')
  assert.equal(pickFunnel(all, { kind: 'text', text: 'Какой у вас прайс' })?.id, 'kw')
  assert.equal(pickFunnel(all.filter((x) => x.id !== 'any'), { kind: 'text', text: 'привет' }), null)
})

test('проверка схемы: демо без ошибок, битая схема с ошибками', () => {
  const ok = validateGraph(demoGraph)
  assert.equal(ok.errors.length, 0)
  assert.ok(ok.warnings.every((w) => !/блока записи/.test(w.text)), 'у демо выходы записи подключены')
  assert.ok(validateGraph(g([start(), { id: 'b', type: 'booking', data: { services: [], formats: [] } }], [E('start', 'out', 'b')])).warnings.some((w) => /блока записи/.test(w.text)))
  const bad = validateGraph(g([start([]), { id: 'm', type: 'message', data: { parts: [{ id: 'p', kind: 'text', text: ' ' }] } }, { id: 'a', type: 'action', data: { items: [{ id: 'x', kind: 'delay', value: 'скоро' }] } }], [E('start', 'out', 'zzz')]))
  const texts = bad.errors.map((e) => e.text).join(' | ')
  assert.match(texts, /триггер/)
  assert.match(texts, /Пустое сообщение/)
  assert.match(texts, /задержку/)
  assert.match(texts, /несуществующий/)
})


test('запись из воронки: подтверждение продолжает по выходу «подтвердил», отклонение передаёт человеку', async () => {
  const graph = g([start(), { id: 'b', type: 'booking', data: { services: ['Продакшн'], formats: ['Видеозвонок'], message: 'Запишитесь, {имя}' } }, msg('ok', 'Ждём вас!'), msg('no', 'Подберём другое время')], [E('start', 'out', 'b'), E('b', 'confirmed', 'ok'), E('b', 'declined', 'no')])
  const a = setup(graph)
  const client = await a.clientP
  assert.equal(await startFunnel(a.env, a.funnel, client), 'waiting_input')
  const first = only(a.calls, 'text')[0]!
  assert.match(first.text!, /Запишитесь, Мария/)
  assert.match(JSON.stringify(first.buttons), /s=production&f=video&r=/, 'одна услуга и один формат попадают в ссылку')
  const runId = a.repo.runs[0].id
  assert.equal(await resumeBooking(a.env, runId, 'confirmed'), 'resumed')
  assert.ok(only(a.calls, 'text').some((c) => /Ждём вас/.test(c.text!)))
  assert.equal(a.repo.runs[0].status, 'done')
  assert.equal(await resumeBooking(a.env, runId, 'confirmed'), 'skipped', 'повторное решение игнорируется')

  const b = setup(graph)
  await startFunnel(b.env, b.funnel, await b.clientP)
  await resumeBooking(b.env, b.repo.runs[0].id, 'declined')
  assert.ok(only(b.calls, 'text').some((c) => /другое время/.test(c.text!)))
})

test('условия записи: «есть свободные слоты» и «клиент уже записан»; {запись} подставляет личную ссылку', async () => {
  const graph = g([
    start(),
    { id: 'c', type: 'condition', data: { mode: 'all', rules: [{ id: 'r1', kind: 'slot', value: '' }, { id: 'r2', kind: 'booked', value: '' }] } },
    msg('yes', 'Вы уже записаны'), msg('no', 'Запишитесь: {запись}'),
  ], [E('start', 'out', 'c'), E('c', 'yes', 'yes'), E('c', 'no', 'no')])
  const a = setup(graph)
  a.setNow(new Date('2026-10-20T06:00:00Z'))
  const client = await a.clientP
  await startFunnel(a.env, a.funnel, client)
  assert.match(only(a.calls, 'text')[0]!.text!, new RegExp(`Запишитесь: https://st96.by/book\\?c=${client.id}`))
  // записываем клиента: условие «записан» становится истинным
  a.repo.bookings.push({ id: 'b1', client_id: client.id, run_id: null, run_node: null, service: 'production', format: 'call', starts_at: '2026-10-22T08:00:00.000Z', ends_at: '2026-10-22T08:30:00.000Z', name: 'М', company: null, telegram: null, phone: null, goal: null, comment: null, status: 'pending', meet_url: null, source: 'site', reminded_at: null, created_at: '', decided_at: null })
  a.calls.length = 0
  const f2: Funnel = { ...a.funnel, id: 'f2' }
  await startFunnel(a.env, f2, client)
  assert.match(only(a.calls, 'text')[0]!.text!, /Вы уже записаны/)
})

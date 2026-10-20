import { test } from 'node:test'
import assert from 'node:assert/strict'
import { Api } from 'grammy'
import { memoryRepo } from '../memoryRepo'
import { agentDeps } from './deps'
import { approveTask, confirmStep, createTask, deleteTask, normalizePlan, rejectTask, reviseTask, tickAgentTasks, type AgentDeps } from './engine'
import { formatStats } from './tools'
import type { Llm } from './llm'

const plan = (...tools: string[]) => JSON.stringify({ steps: tools.map((t) => ({ text: `шаг ${t}`, tool: t })) })

/** Мок модели: на планировщик отвечает заданным планом, на шаги: по форме запрошенного JSON. */
function mockLlm(planJson: string): Llm {
  return async ({ system, user }) => {
    if (system.includes('планировщик')) return planJson
    if (user.includes('"report"')) return JSON.stringify({ report: 'Всё сделано.' })
    if (user.includes('"body": "текст сообщения клиенту')) return JSON.stringify({ title: 'Напоминание', body: 'Здравствуйте, {имя}! Ждём вас.', task: 'Напоминание', goal: 'Информировать', services: ['Ретушь', 'Неизвестная'] })
    if (user.includes('ключи услуг')) return JSON.stringify({ title: 'Акция', body: 'Скидка на ретушь!', services: ['retouch', 'bogus'], language: 'ru' })
    if (user.includes('сообщение администраторам')) return JSON.stringify({ text: 'Готово' })
    return JSON.stringify({ text: 'Вариант 1. Привет!' })
  }
}

function setup(planJson: string, llm?: Llm) {
  const repo = memoryRepo()
  const sent: { chat: number; text: string }[] = []
  const api = new Api('1:T')
  api.config.use(async (_p, _m, payload) => {
    const p = payload as { chat_id: number; text?: string; caption?: string }
    sent.push({ chat: p.chat_id, text: p.text ?? p.caption ?? '' })
    return { ok: true, result: { message_id: 1 } } as never
  })
  const deps: AgentDeps = { repo, api, groupChatId: -100, llm: llm ?? mockLlm(planJson) }
  return { repo, deps, sent }
}
const input = { title: 'Тест', text: 'Сделай что-нибудь полезное для студии', attach: [] }

test('план нормализуется: чужие инструменты отброшены, риск задаёт код, отчёт всегда последний, максимум 7 шагов', () => {
  const steps = normalizePlan({ steps: [{ text: 'a', tool: 'drop_database' }, { text: 'b', tool: 'start_broadcast', risk: 'read' } as never, { text: '', tool: 'read_stats' }, { text: 'c', tool: 'report' }] })
  assert.deepEqual(steps.map((s) => s.tool), ['start_broadcast', 'report'])
  assert.equal(steps[0]!.risk, 'danger')
  assert.equal(normalizePlan({ steps: [] }).length, 0)
  const many = normalizePlan({ steps: Array.from({ length: 12 }, (_, i) => ({ text: `s${i}`, tool: 'read_stats' })) })
  assert.equal(many.length, 8)
  assert.equal(many.at(-1)!.tool, 'report')
})

test('задание: план ждёт согласования, после утверждения выполняется и даёт отчёт', async () => {
  const { repo, deps } = setup(plan('read_stats', 'write_text', 'save_template'))
  await repo.insertClient({ tg_user_id: 1, name: 'Секретное Имя', consent_at: 'x' })
  const created = await createTask(deps, input)
  assert.ok(created.ok)
  assert.equal(repo.agentTasks[0]!.status, 'approval')
  assert.equal(repo.agentTasks[0]!.plan.length, 4)
  await approveTask(deps, repo.agentTasks[0]!.id, {})
  assert.equal(repo.agentTasks[0]!.status, 'running')
  await tickAgentTasks(deps, { maxSteps: 10 })
  const t = repo.agentTasks[0]!
  assert.equal(t.status, 'done')
  assert.equal(t.report, 'Всё сделано.')
  assert.equal(repo.templates[0]!.title, '[Агент] Напоминание')
  assert.deepEqual(repo.templates[0]!.services, ['Ретушь'])
  assert.ok(!JSON.stringify(t.plan).includes('Секретное Имя'), 'имена клиентов не попадают в результаты')
})

test('отключённые шаги пропускаются, без включённых шагов утвердить нельзя', async () => {
  const { repo, deps } = setup(plan('read_stats', 'read_templates'))
  await createTask(deps, input)
  const t = repo.agentTasks[0]!
  const [a, b] = t.plan
  const none = await approveTask(deps, t.id, { [a!.id]: false, [b!.id]: false })
  assert.equal(none.ok, false)
  await approveTask(deps, t.id, { [a!.id]: false })
  await tickAgentTasks(deps, { maxSteps: 10 })
  assert.equal(repo.agentTasks[0]!.plan[0]!.state, 'skipped')
  assert.equal(repo.agentTasks[0]!.plan[1]!.state, 'done')
  assert.equal(repo.agentTasks[0]!.status, 'done')
})

test('запуск рассылки ждёт подтверждения и без него не выполняется', async () => {
  const { repo, deps, sent } = setup(plan('draft_broadcast', 'start_broadcast'))
  const anna = await repo.insertClient({ tg_user_id: 7, name: 'Анна', language: 'ru', consent_at: 'x' })
  await repo.insertLead({ client_id: anna.id, source: 'bot', service_key: 'retouch', title: null, topic: null, name: null, phone: null, telegram: null, email: null, company: null, comment: null, interest: null, lang: null, landing: null, utm: null, warnings: [], raw_text: null, tg_chat_id: null, tg_message_id: null })
  await createTask(deps, input)
  await approveTask(deps, repo.agentTasks[0]!.id, {})
  await tickAgentTasks(deps, { maxSteps: 10 })
  assert.equal(repo.agentTasks[0]!.status, 'paused')
  assert.equal(repo.broadcasts.length, 1)
  assert.equal(repo.broadcasts[0]!.status, 'draft')
  assert.equal(sent.length, 0)
  assert.deepEqual(repo.broadcasts[0]!.segment, { services: ['retouch'], language: 'ru' })

  const wrong = await confirmStep(deps, repo.agentTasks[0]!.id, 'нет-такого')
  assert.equal(wrong.ok, false)
  const stepId = repo.agentTasks[0]!.plan.find((s) => s.tool === 'start_broadcast')!.id
  await confirmStep(deps, repo.agentTasks[0]!.id, stepId)
  await tickAgentTasks(deps, { maxSteps: 10 })
  assert.equal(repo.agentTasks[0]!.status, 'done')
  assert.notEqual(repo.broadcasts[0]!.status, 'draft')
  assert.equal(sent.filter((x) => x.chat === 7).length, 1, 'клиент с согласием получил рассылку')
})

test('start_broadcast без черновика падает с понятной ошибкой, задание получает статус failed', async () => {
  const { repo, deps } = setup(plan('start_broadcast'))
  await createTask(deps, input)
  await approveTask(deps, repo.agentTasks[0]!.id, {})
  await tickAgentTasks(deps)
  const stepId = repo.agentTasks[0]!.plan[0]!.id
  await confirmStep(deps, repo.agentTasks[0]!.id, stepId)
  await tickAgentTasks(deps)
  assert.equal(repo.agentTasks[0]!.status, 'failed')
  assert.match(repo.agentTasks[0]!.error ?? '', /draft_broadcast/)
})

test('сбой модели при планировании: статус failed, повтор с замечанием строит новый план', async () => {
  let calls = 0
  const llm: Llm = async (req) => {
    calls++
    if (calls <= 1) throw new Error('Модель недоступна')
    return mockLlm(plan('read_stats'))(req)
  }
  const { repo, deps } = setup('', llm)
  await createTask(deps, input)
  assert.equal(repo.agentTasks[0]!.status, 'failed')
  assert.match(repo.agentTasks[0]!.error ?? '', /недоступна/)
  await reviseTask(deps, repo.agentTasks[0]!.id, 'Добавь только сводку')
  assert.equal(repo.agentTasks[0]!.status, 'approval')
  assert.equal(repo.agentTasks[0]!.rev, 2)
})

test('без ключа LLM_API_KEY задание не падает, а получает понятную ошибку', async () => {
  const repo = memoryRepo()
  await createTask(await agentDeps(repo, null, {}), input)
  assert.equal(repo.agentTasks[0]!.status, 'failed')
  assert.match(repo.agentTasks[0]!.error ?? '', /LLM_API_KEY/)
})

test('отклонение останавливает задание; выполненное нельзя отклонить', async () => {
  const { repo, deps } = setup(plan('read_stats'))
  await createTask(deps, input)
  const id = repo.agentTasks[0]!.id
  assert.ok((await rejectTask(deps, id)).ok)
  assert.equal(repo.agentTasks[0]!.status, 'rejected')
  assert.equal((await rejectTask(deps, id)).ok, false)
  assert.equal((await approveTask(deps, id, {})).ok, false)
})

test('сводка для агента не содержит персональных данных', async () => {
  const repo = memoryRepo()
  await repo.insertClient({ tg_user_id: 1, name: 'Иван Петров', phone: '+375291112233', tg_username: 'ivan', consent_at: 'x' })
  const text = formatStats(await repo.agentStats())
  assert.match(text, /Клиентов 1/)
  assert.ok(!/Иван|375291112233|ivan/.test(text))
})

test('слой модели: недоступную модель (404) пропускает и берёт следующую, на 429 и неверный ключ даёт понятные ошибки', async () => {
  const { openAiCompatible } = await import('./llm')
  const real = globalThis.fetch
  const seen: string[] = []
  const reply = (status: number, body: unknown) => new Response(JSON.stringify(body), { status })
  try {
    globalThis.fetch = (async (_u: unknown, init: { body: string }) => {
      const model = JSON.parse(init.body).model as string
      seen.push(model)
      return model === 'gemini-3.8-flash' ? reply(404, { error: 'gone' }) : reply(200, { choices: [{ message: { content: '{"ok":1}' } }] })
    }) as never
    assert.equal(await openAiCompatible({ apiKey: 'k' })({ system: 's', user: 'u' }), '{"ok":1}')
    assert.deepEqual(seen, ['gemini-3.8-flash', 'gemini-3.5-flash-lite'])

    globalThis.fetch = (async () => reply(429, {})) as never
    await assert.rejects(openAiCompatible({ apiKey: 'k' })({ system: 's', user: 'u' }), /лимит/)
    globalThis.fetch = (async () => reply(403, {})) as never
    await assert.rejects(openAiCompatible({ apiKey: 'k' })({ system: 's', user: 'u' }), /LLM_API_KEY/)
    seen.length = 0
    globalThis.fetch = (async (_u: unknown, init: { body: string }) => { seen.push(JSON.parse(init.body).model); return reply(404, {}) }) as never
    await assert.rejects(openAiCompatible({ apiKey: 'k', model: 'my-model' })({ system: 's', user: 'u' }), /недоступна/)
    assert.deepEqual(seen, ['my-model'], 'заданная LLM_MODEL не подменяется')
  } finally {
    globalThis.fetch = real
  }
})

test('удаление: нельзя удалить идущее задание, остальные удаляются', async () => {
  const { repo, deps } = setup(plan('read_stats'))
  await createTask(deps, input)
  const id = repo.agentTasks[0]!.id
  await approveTask(deps, id, {})
  assert.equal((await deleteTask(deps, id)).ok, false)
  assert.equal(repo.agentTasks.length, 1)
  await rejectTask(deps, id)
  assert.ok((await deleteTask(deps, id)).ok)
  assert.equal(repo.agentTasks.length, 0)
  assert.equal((await deleteTask(deps, id)).ok, false)
})

test('каталог моделей и цепочка запасных', async () => {
  const { MODEL_IDS, modelChain, isKnownModel } = await import('./models')
  assert.ok(MODEL_IDS.length >= 3)
  assert.deepEqual(modelChain('auto'), MODEL_IDS)
  const chain = modelChain('gemini-3.5-flash-lite')
  assert.equal(chain[0], 'gemini-3.5-flash-lite')
  assert.equal(new Set(chain).size, MODEL_IDS.length, 'без повторов, остальные идут запасными')
  assert.equal(modelChain(null, 'my-env-model')[0], 'my-env-model')
  assert.ok(isKnownModel('auto') && isKnownModel(MODEL_IDS[0]) && !isKnownModel('gpt-x'))
})

test('своя модель: проверка адреса, ключа и идентификатора', async () => {
  const { validateCustom } = await import('./models')
  const base = { name: 'Groq Llama', baseUrl: 'https://api.groq.com/openai/v1/', model: 'llama-3.3-70b-versatile', keyEnv: 'LLM_KEY_GROQ' }
  const ok = validateCustom(base)
  assert.ok(ok.ok && ok.value.baseUrl === 'https://api.groq.com/openai/v1')
  for (const bad of [
    { ...base, baseUrl: 'http://api.groq.com/v1' },
    { ...base, baseUrl: 'https://localhost/v1' },
    { ...base, baseUrl: 'https://192.168.1.5/v1' },
    { ...base, baseUrl: 'https://user:pw@api.groq.com/v1' },
    { ...base, keyEnv: 'SUPABASE_SERVICE_ROLE_KEY' },
    { ...base, keyEnv: 'llm_key_groq' },
    { ...base, model: 'bad model; rm' },
    { ...base, name: '' },
  ]) assert.equal(validateCustom(bad).ok, false, JSON.stringify(bad))
})

test('выбор модели: своя работает строго, без перехода на Google, и без ключа даёт понятную ошибку', async () => {
  const { resolveLlm, MODEL_SETTING } = await import('./deps')
  const { CUSTOM_SETTING } = await import('./models')
  const repo = memoryRepo()
  await repo.setSetting(CUSTOM_SETTING, JSON.stringify([{ id: 'custom:abc', name: 'G', baseUrl: 'https://api.groq.com/openai/v1', model: 'm1', keyEnv: 'LLM_KEY_GROQ' }]))
  await repo.setSetting(MODEL_SETTING, 'custom:abc')
  await assert.rejects((await resolveLlm(repo, { LLM_API_KEY: 'google' }))({ system: 's', user: 'u' }), /LLM_KEY_GROQ/)
  await repo.setSetting(MODEL_SETTING, 'custom:gone')
  await assert.rejects((await resolveLlm(repo, { LLM_KEY_GROQ: 'k' }))({ system: 's', user: 'u' }), /удалена/)
})

const leadText = (name: string, phone: string, extra = '') => `🆕 Новая заявка с сайта ST96\nИмя: ${name}\nКонтакт: ${phone}\nИнтересует: Ретушь\nСообщение: Хочу ретушь портретов${extra}\nЯзык сайта: Русский (RU)\nИсточник: прямой заход`
const exportJson = (extra: object[] = []) => ({
  name: 'Лиды ST96', type: 'private_supergroup', id: 1001,
  messages: [
    { id: 10, type: 'message', from: 'ST96 bot', text: leadText('Анна Иванова', '+375 29 111 22 33') },
    { id: 11, type: 'message', from: 'ST96 bot', text: [{ type: 'plain', text: leadText('Тест', '+375 29 000 00 01', '\nИсточник тест') }] },
    { id: 12, type: 'message', from: 'ST96 bot', text: leadText('Анна И.', '+375291112233') },
    { id: 13, type: 'message', from: 'Карина', text: 'Позвонила, ждёт коммерческое предложение до пятницы', reply_to_message_id: 10 },
    { id: 14, type: 'service', text: 'Группа создана' },
    { id: 15, type: 'message', from: 'Карина', text: 'ок' },
    { id: 16, type: 'message', from: 'ST96 bot', text: leadText('Тестов Олег', '+375 33 555 44 33') },
    ...extra,
  ],
})

function withFetch<T>(body: unknown, fn: () => Promise<T>) {
  const real = globalThis.fetch
  globalThis.fetch = (async () => new Response(JSON.stringify(body), { status: 200 })) as never
  return fn().finally(() => { globalThis.fetch = real })
}

test('импорт из экспорта группы: заявки, тестовые пропущены, дубли клиентов не создаются, повтор безопасен', async () => {
  const { repo, deps } = setup(plan('import_group_export'))
  repo.clients.length = 0
  await createTask(deps, { ...input, attach: ['https://example.com/agent/result.json'] })
  const id = repo.agentTasks[0]!.id
  await approveTask(deps, id, {})
  await withFetch(exportJson(), () => tickAgentTasks(deps, { maxSteps: 10 }))
  const t = repo.agentTasks[0]!
  assert.equal(t.status, 'done', t.error ?? '')
  assert.equal(repo.leads.length, 3, 'две заявки Анны и «Тестов Олег» (фамилия, а не тест)')
  assert.equal(repo.clients.length, 2, 'у Анны один клиент на две заявки')
  assert.ok(repo.leads.every((l) => !/Тест$/.test(l.name ?? '')) && !repo.leads.some((l) => l.name === 'Тест'))
  assert.equal(repo.notes.length, 1, 'ответ сотрудника привязан к заявке')
  assert.ok([...repo.tags.values()].every((s) => s.has('импорт из группы')))
  const res = t.plan[0]!.result!
  assert.match(res, /новых 3/)
  assert.match(res, /тестовых пропущено 1/)

  // повторный запуск того же файла не создаёт ничего нового
  const t2 = await repo.insertAgentTask({ title: 'Повтор', text: 'Повторить импорт группы', attach: ['https://example.com/agent/result.json'] })
  await repo.updateAgentTask(t2.id, { plan: normalizePlan({ steps: [{ text: 'импорт', tool: 'import_group_export' }] }), status: 'running' })
  await withFetch(exportJson(), () => tickAgentTasks(deps, { maxSteps: 10 }))
  assert.equal(repo.leads.length, 3)
  assert.equal(repo.clients.length, 2)
  assert.match(repo.agentTasks[1]!.plan[0]!.result!, /уже были в базе 3/)
})

test('импорт без приложенного файла падает с понятной инструкцией, а не молча', async () => {
  const { repo, deps } = setup(plan('import_group_export'))
  await createTask(deps, input)
  await approveTask(deps, repo.agentTasks[0]!.id, {})
  await tickAgentTasks(deps, { maxSteps: 10 })
  assert.equal(repo.agentTasks[0]!.status, 'failed')
  assert.match(repo.agentTasks[0]!.error ?? '', /экспорта группы/)
})

test('планировщик честно отказывается, если инструмента нет, и не подставляет чужой', async () => {
  const { repo, deps } = setup('{"steps": [], "reason": "Бот не читает историю группы: приложите файл экспорта"}')
  await createTask(deps, input)
  assert.equal(repo.agentTasks[0]!.status, 'failed')
  assert.match(repo.agentTasks[0]!.error ?? '', /Агент не может выполнить это задание: Бот не читает историю/)
})

test('не экспорт чата: понятная ошибка', async () => {
  const { repo, deps } = setup(plan('import_group_export'))
  await createTask(deps, { ...input, attach: ['https://example.com/x.json'] })
  await approveTask(deps, repo.agentTasks[0]!.id, {})
  await withFetch({ hello: 1 }, () => tickAgentTasks(deps, { maxSteps: 10 }))
  assert.match(repo.agentTasks[0]!.error ?? '', /не экспорт чата/i)
})

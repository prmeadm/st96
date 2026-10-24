// Регрессия на живой воронке «Запись на консультацию - все услуги» (схема из базы 2026-10-22, тексты укорочены):
// раньше блок nd6vr88 (текст + видео YouTube Shorts + кнопки) падал на 429, запуск зависал и дальше ничего не работало.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import type { Api } from 'grammy'
import { memoryRepo } from '../memoryRepo'
import { telegramOut } from '../bot/telegramOut'
import { handleClick, resumeRun, startFunnel, type Env } from './engine'
import type { Funnel, Graph } from './types'

const T = (id: string, text: string) => ({ id, kind: 'text', text })
const graph: Graph = {
  nodes: [
    { id: 'start', type: 'start', data: { once: false, keyword: '', triggers: ['Команда /start', 'Кнопка «Написать в Telegram» на сайте'] } },
    { id: 'm1', type: 'message', data: { links: [], parts: [T('p1', 'Здравствуйте, {имя}! Вас приветствует команда ST96.'), { id: 'p24dzch', kind: 'image', url: 'https://ljatihrxiuouukakbdtb.supabase.co/storage/v1/object/public/media/templates/1792611938901-jtq7rb.jpeg', text: '' }], quick: [{ id: 'q1', label: 'Услуги и цены' }, { id: 'q2', label: 'Записаться на встречу' }, { id: 'q3', label: 'Задать вопрос' }, { id: 'q4', label: 'Связаться с админом' }] } },
    { id: 'm2', type: 'message', data: { links: [{ id: 'l1', url: 'https://st96.by/book', label: 'Записаться на встречу' }], parts: [T('p1', 'Разработка бизнес решений на базе AI')], quick: [{ id: 'q01yim6', label: 'Видео продакшн на базе AI' }, { id: 'qxymttb', label: 'Коммерческий промоушн' }] } },
    { id: 'b1', type: 'booking', data: { meet: true, formats: ['Телефонный звонок', 'Видеозвонок', 'Офлайн встреча'], message: '', services: ['Ретушь', 'Продюсирование', 'AI-разработка'], messageEn: '' } },
    { id: 'a2', type: 'action', data: { items: [{ id: 'x1', kind: 'addtag', value: 'задал вопрос' }, { id: 'x2', kind: 'notify', value: 'Клиент {имя} задал вопрос в боте' }] } },
    { id: 'm5', type: 'message', data: { links: [], parts: [T('p1', 'Напишите ваш вопрос одним сообщением, администратор ответит здесь.')], quick: [] } },
    { id: 'h1', type: 'handoff', data: { notify: true, message: 'Передаю ваш вопрос администратору, он ответит в ближайшее время.' } },
    { id: 'nfopzvo', type: 'message', data: { links: [], parts: [T('phlkqn6', 'Мы приняли ваш запрос.')], quick: [] } },
    { id: 'n0j76wg', type: 'message', data: { links: [{ id: 'ltazokp', url: 'https://st96.by/book', label: 'Выбрать другое время' }], parts: [T('pwblyz5', 'К сожалению на это время не сможем.')], quick: [] } },
    { id: 'n8bbig6', type: 'message', data: { links: [{ id: 'lxxql73', url: 'https://st96.by/book', label: 'Записаться на встречу' }], parts: [T('p63n35h', 'Коммерческий промоушн')], quick: [] } },
    { id: 'nd6vr88', type: 'message', data: { links: [{ id: 'lfnyxaj', url: 'https://st96.by/book', label: 'Обсудим проект?' }], parts: [T('ps96762', '🎬 Видео продакшн на базе AI ' + 'текст '.repeat(180)), { id: 'pzzicns', url: 'https://youtube.com/shorts/O3M6Ox3-Mhs?feature=share', kind: 'video', text: '' }], quick: [{ id: 'q6epmur', label: 'Коммерческий промоушн' }] } },
    { id: 'nto3rtb', type: 'message', data: { links: [{ id: 'lqmt775', url: 'https://st96.by/book', label: 'Вернемся со сметой за 48 часов' }], parts: [T('ppcwpsc', 'Продюсирование')], quick: [{ id: 'qu78t5b', label: 'AI-разработка' }, { id: 'quz25fc', label: 'Видео продакшн на базе AI' }, { id: 'qaw0rkx', label: 'Коммерческий промоушн' }] } },
    { id: 'ns5lib6', type: 'action', data: { items: [{ id: 'adrfh5i', kind: 'delay', value: '1 день' }] } },
    { id: 'ndigvm8', type: 'booking', data: { meet: true, formats: ['Телефонный звонок', 'Видеозвонок', 'Офлайн встреча'], message: 'Добрый день! А может быть на чашечку кофе? 👍', services: ['Продюсирование', 'Коммерческий промоушн', 'Продакшн', 'AI-разработка'], messageEn: '' } },
  ],
  edges: [
    ['start', 'out', 'm1'], ['m1', 'qr-q2', 'b1'], ['m1', 'qr-q3', 'a2'], ['m1', 'qr-q4', 'h1'], ['a2', 'out', 'm5'], ['b1', 'confirmed', 'nfopzvo'], ['b1', 'declined', 'n0j76wg'],
    ['m1', 'qr-q1', 'nto3rtb'], ['nto3rtb', 'qr-qu78t5b', 'm2'], ['m2', 'qr-q01yim6', 'nd6vr88'], ['nto3rtb', 'qr-quz25fc', 'nd6vr88'], ['m2', 'qr-qxymttb', 'n8bbig6'],
    ['nto3rtb', 'qr-qaw0rkx', 'n8bbig6'], ['nd6vr88', 'qr-q6epmur', 'n8bbig6'], ['nto3rtb', 'out', 'h1'], ['m2', 'out', 'h1'], ['nd6vr88', 'out', 'h1'], ['n8bbig6', 'out', 'ns5lib6'],
    ['ns5lib6', 'out', 'ndigvm8'], ['ndigvm8', 'confirmed', 'nfopzvo'], ['ndigvm8', 'declined', 'n0j76wg'], ['m1', 'out', 'h1'],
  ].map(([source, sourceHandle, target]) => ({ source: source!, sourceHandle, target: target! })),
}

type Sent = { method: string; chat: unknown; body: unknown; extra: { reply_markup?: { inline_keyboard: { text: string; url?: string; callback_data?: string }[][] }; link_preview_options?: unknown; caption?: string } }

/** Имитация Telegram: записывает вызовы, по желанию отвечает 429 на выбранные отправки. */
function fakeTelegram(fail: (method: string, n: number) => number | null = () => null) {
  const sent: Sent[] = []
  let n = 0
  const call = (method: string) => async (chat: unknown, body: unknown, extra: Sent['extra'] = {}) => {
    const retry = fail(method, ++n)
    if (retry !== null) throw Object.assign(new Error(`Call to '${method}' failed! (429: Too Many Requests: retry after ${retry})`), { error_code: 429, parameters: { retry_after: retry } })
    sent.push({ method, chat, body, extra })
    return { message_id: n }
  }
  const api = { sendMessage: call('sendMessage'), sendPhoto: call('sendPhoto'), sendVideo: call('sendVideo'), sendAudio: call('sendAudio'), sendDocument: call('sendDocument') } as unknown as Api
  return { api, sent }
}

async function setup(fail?: (method: string, n: number) => number | null, embeddable = false) {
  const repo = memoryRepo()
  const tg = fakeTelegram(fail)
  let now = new Date('2026-10-22T08:00:00Z')
  const env: Env = { repo, out: telegramOut(tg.api, repo, null, { sleep: async () => undefined, embeddable: async () => embeddable }), now: () => now }
  const funnel: Funnel = { id: 'f-real', name: 'Запись на консультацию - все услуги.', status: 'published', graph, ai_enabled: false, version: 72 }
  repo.funnels.push(funnel)
  // клиент пришёл в бота сам: согласия на рассылки нет, после /start воронка всё равно должна идти до конца
  const client = await repo.insertClient({ tg_user_id: 777, name: 'Дмитрий', language: 'ru', consent_at: null })
  return { repo, tg, env, funnel, client, later: (ms: number) => { now = new Date(now.getTime() + ms) } }
}
const buttons = (s: Sent) => (s.extra.reply_markup?.inline_keyboard ?? []).flat().map((b) => b.text)
const lastRun = (repo: ReturnType<typeof memoryRepo>) => repo.runs[repo.runs.length - 1]!

const preview = (s: Sent) => s.extra.link_preview_options as { url?: string; show_above_text?: boolean } | undefined

test('живая воронка: путь «Услуги → Видео продакшн» доходит до видео, кнопок и записи через сутки', async () => {
  const { repo, tg, env, funnel, client, later } = await setup()
  assert.equal(await startFunnel(env, funnel, client), 'waiting_input')
  assert.deepEqual(tg.sent.map((s) => s.method), ['sendPhoto'], 'приветствие: одно сообщение, фото сверху, текст подписью')
  assert.match(String(tg.sent[0]!.extra.caption), /Здравствуйте, Дмитрий!/)
  assert.deepEqual(buttons(tg.sent[0]!), ['Услуги и цены', 'Записаться на встречу', 'Задать вопрос', 'Связаться с админом'])

  assert.equal(await handleClick(env, client, lastRun(repo), 'q1', 'm1'), 'ok')
  assert.deepEqual(buttons(tg.sent.at(-1)!), ['AI-разработка', 'Видео продакшн на базе AI', 'Коммерческий промоушн', 'Вернемся со сметой за 48 часов'])

  const before = tg.sent.length
  assert.equal(await handleClick(env, client, lastRun(repo), 'quz25fc', 'nto3rtb'), 'ok')
  const block = tg.sent.slice(before)
  // текст блока длиннее подписи (1024): одно сообщение, обложка ролика над текстом (предпросмотр), кнопки под ним
  assert.deepEqual(block.map((s) => s.method), ['sendMessage'])
  assert.match(String(block[0]!.body), /Видео продакшн на базе AI/)
  assert.match(String(preview(block[0]!)?.url), /^https:\/\/i\.ytimg\.com\/vi\/O3M6Ox3-Mhs\//)
  assert.equal(preview(block[0]!)?.show_above_text, true)
  const kb = block[0]!.extra.reply_markup!.inline_keyboard.flat()
  assert.equal(kb[0]!.text, '▶️ Смотреть видео')
  assert.equal(kb[0]!.url, 'https://www.youtube.com/watch?v=O3M6Ox3-Mhs')
  assert.deepEqual(kb.slice(1).map((b) => b.text), ['Коммерческий промоушн', 'Обсудим проект?'])
  assert.equal(lastRun(repo).status, 'waiting')

  assert.equal(await handleClick(env, client, lastRun(repo), 'q6epmur', 'nd6vr88'), 'ok')
  assert.match(String(tg.sent.at(-1)!.body), /Коммерческий промоушн/)
  assert.equal(lastRun(repo).status, 'waiting', 'пауза «1 день»')
  assert.equal(repo.jobs.length, 1)

  later(24 * 3600_000 + 1000)
  assert.equal(await resumeRun(env, lastRun(repo).id), 'resumed')
  const booking = tg.sent.at(-1)!
  assert.match(String(booking.body), /на чашечку кофе/, 'через сутки клиент без согласия на рассылки всё равно получает шаг воронки')
  assert.match(booking.extra.reply_markup!.inline_keyboard[0]![0]!.url!, /^https:\/\/st96\.by\/book\?/)
})

test('живая воронка: короткий текст с видео YouTube — обложка с подписью одним сообщением', async () => {
  const { repo, tg, env, funnel, client } = await setup()
  const short = JSON.parse(JSON.stringify(funnel)) as Funnel
  short.graph.nodes.find((n) => n.id === 'nd6vr88')!.data.parts = [{ id: 'a', kind: 'text', text: 'Наш ролик' }, { id: 'b', kind: 'video', url: 'https://youtu.be/O3M6Ox3-Mhs' }]
  repo.funnels[0] = short
  await startFunnel(env, short, client)
  await handleClick(env, client, lastRun(repo), 'q1', 'm1')
  const before = tg.sent.length
  await handleClick(env, client, lastRun(repo), 'quz25fc', 'nto3rtb')
  const block = tg.sent.slice(before)
  assert.deepEqual(block.map((s) => s.method), ['sendPhoto'])
  assert.equal(block[0]!.extra.caption, 'Наш ролик')
})

test('живая воронка: 429 на видео-блоке не теряет сообщение, воронка продолжается с того же места', async () => {
  let fail = true
  const { repo, tg, env, funnel, client } = await setup((method) => (method === 'sendMessage' && fail && tg.sent.some((s) => buttons(s).includes('Вернемся со сметой за 48 часов')) ? 30 : null))
  await startFunnel(env, funnel, client)
  await handleClick(env, client, lastRun(repo), 'q1', 'm1')
  const before = tg.sent.length
  await handleClick(env, client, lastRun(repo), 'quz25fc', 'nto3rtb')
  assert.equal(tg.sent.length, before, 'Telegram ответил 429 и просил ждать 30 с: в этом запросе не ждём')
  const run = lastRun(repo)
  assert.equal(run.status, 'waiting')
  assert.equal(run.vars.__wait, 'timer')
  assert.deepEqual(run.vars.__resume, { node: 'nd6vr88', item: 0, retry: true })
  assert.ok(repo.jobs.some((j) => j.kind === 'resume_run' && !j.done))

  fail = false
  assert.equal(await resumeRun(env, run.id), 'resumed')
  const after = tg.sent.slice(before)
  assert.equal(after.length, 1, 'повтор отправляет блок один раз')
  assert.ok(buttons(after[0]!).includes('Коммерческий промоушн'))
  assert.equal(await handleClick(env, client, lastRun(repo), 'q6epmur', 'nd6vr88'), 'ok', 'кнопки после повтора работают')
})

test('части блока: медиа склеивается с соседним текстом, лишний текст идёт отдельно', async () => {
  const { groupParts } = await import('./engine')
  const P = (id: string, kind: string) => ({ id, kind } as never)
  const shape = (u: ReturnType<typeof groupParts>) => u.map((x) => `${x.media?.id ?? '-'}+${x.text?.id ?? '-'}`)
  assert.deepEqual(shape(groupParts([P('t1', 'text'), P('i1', 'image')])), ['i1+t1'])
  assert.deepEqual(shape(groupParts([P('i1', 'image'), P('t1', 'text')])), ['i1+t1'])
  assert.deepEqual(shape(groupParts([P('t1', 'text'), P('v1', 'video'), P('t2', 'text')])), ['v1+t1', '-+t2'])
  assert.deepEqual(shape(groupParts([P('i1', 'image'), P('i2', 'image')])), ['i1+-', 'i2+-'])
})

test('живая воронка: кнопка старого сообщения ведёт по своей ветке, текущий запуск не мешает', async () => {
  const { repo, tg, env, funnel, client } = await setup()
  await startFunnel(env, funnel, client)
  await handleClick(env, client, lastRun(repo), 'q1', 'm1')
  await handleClick(env, client, lastRun(repo), 'quz25fc', 'nto3rtb')
  // клиент вернулся к сообщению «Продюсирование» и нажал «AI-разработка»
  assert.equal(await handleClick(env, client, lastRun(repo), 'qu78t5b', 'nto3rtb'), 'ok')
  assert.match(String(tg.sent.at(-1)!.body), /Разработка бизнес решений на базе AI/)
  assert.deepEqual(buttons(tg.sent.at(-1)!), ['Видео продакшн на базе AI', 'Коммерческий промоушн', 'Записаться на встречу'])
})

test('живая воронка: окончательная ошибка Telegram не вешает запуск, сотрудники получают уведомление', async () => {
  const repo = memoryRepo()
  const notes: string[] = []
  const api = {
    sendMessage: async () => { throw Object.assign(new Error("Call to 'sendMessage' failed! (400: Bad Request: message is too long)"), { error_code: 400 }) },
  } as unknown as Api
  const base = telegramOut(api, repo, null, { sleep: async () => undefined })
  const env: Env = { repo, out: { ...base, notifyAdmins: async (_c, t) => { notes.push(t) } } }
  const funnel: Funnel = { id: 'f-real', name: 'Тест', status: 'published', graph, ai_enabled: false, version: 1 }
  repo.funnels.push(funnel)
  const client = await repo.insertClient({ tg_user_id: 1, name: 'А', language: 'ru' })
  assert.equal(await startFunnel(env, funnel, client), 'done')
  assert.equal(repo.runs[0]!.status, 'failed')
  assert.match(notes[0]!, /не смогла отправить клиенту блок m1/)
})

test('живая воронка: ролик с разрешённым встраиванием — плеер YouTube над текстом одним сообщением', async () => {
  const { repo, tg, env, funnel, client } = await setup(undefined, true)
  await startFunnel(env, funnel, client)
  await handleClick(env, client, lastRun(repo), 'q1', 'm1')
  const before = tg.sent.length
  await handleClick(env, client, lastRun(repo), 'quz25fc', 'nto3rtb')
  const block = tg.sent.slice(before)
  assert.deepEqual(block.map((s) => s.method), ['sendMessage'])
  assert.match(String(block[0]!.body), /Видео продакшн на базе AI/, 'длинный текст (больше 1024) целиком в том же сообщении')
  assert.deepEqual(preview(block[0]!), { url: 'https://www.youtube.com/watch?v=O3M6Ox3-Mhs', prefer_large_media: true, show_above_text: true })
  assert.deepEqual(buttons(block[0]!), ['Коммерческий промоушн', 'Обсудим проект?'])
})

test('живая воронка: ссылка на ролик стоит в тексте сообщения (невидимый символ), не только в предпросмотре', async () => {
  const { repo, tg, env, funnel, client } = await setup(undefined, true)
  await startFunnel(env, funnel, client)
  await handleClick(env, client, lastRun(repo), 'q1', 'm1')
  const before = tg.sent.length
  await handleClick(env, client, lastRun(repo), 'quz25fc', 'nto3rtb')
  const msg = tg.sent.slice(before)[0]!
  assert.ok(String(msg.body).startsWith('\u2060'))
  assert.deepEqual((msg.extra as { entities?: unknown }).entities, [{ type: 'text_link', offset: 0, length: 1, url: 'https://www.youtube.com/watch?v=O3M6Ox3-Mhs' }])
})

test('живая воронка: если Telegram не построил плеер (429), сразу уходит обложка без других видов ссылки, кнопка открывает ролик внутри Telegram', async () => {
  let lastPreview: string | undefined
  const { repo, tg, env, funnel, client } = await setup((method) => (method === 'sendMessage' && /youtu/.test(lastPreview ?? '') ? 8 : null), true)
  const orig = tg.api.sendMessage.bind(tg.api)
  ;(tg.api as unknown as { sendMessage: unknown }).sendMessage = (chat: unknown, body: unknown, extra?: { link_preview_options?: { url?: string } }) => { lastPreview = extra?.link_preview_options?.url; return orig(chat as number, body as string, extra as never) }
  await startFunnel(env, funnel, client)
  await handleClick(env, client, lastRun(repo), 'q1', 'm1')
  const before = tg.sent.length
  await handleClick(env, client, lastRun(repo), 'quz25fc', 'nto3rtb')
  const block = tg.sent.slice(before)
  assert.equal(block.length, 1, 'одно сообщение, без дубля и без повторов плеера')
  assert.match(String(preview(block[0]!)?.url), /i\.ytimg\.com/)
  const watch = block[0]!.extra.reply_markup!.inline_keyboard[0]![0]! as { text: string; web_app?: { url: string } }
  assert.equal(watch.text, '▶️ Смотреть видео')
  assert.equal(watch.web_app?.url, 'https://st96.by/yt.html?v=O3M6Ox3-Mhs', 'мини-приложение: ролик играет внутри Telegram')
})

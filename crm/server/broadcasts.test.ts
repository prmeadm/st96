import { test } from 'node:test'
import assert from 'node:assert/strict'
import { Api } from 'grammy'
import { memoryRepo } from './memoryRepo'
import { inAudience, tickBroadcasts, validateBroadcast, type BroadcastRow } from './broadcasts'

const base = (over: Partial<BroadcastRow> = {}): BroadcastRow => ({
  id: 'b1', title: 'Акция', kind: 'text', body: 'Привет, {имя}!', body_en: 'Hi, {имя}!', media_url: null, segment: {}, status: 'scheduled',
  scheduled_at: null, total: 0, sent: 0, failed: 0, created_at: '', finished_at: null, ...over,
})

function fakeApi(fail: Record<number, string> = {}) {
  const calls: { method: string; chat: number; text: string }[] = []
  const api = new Api('1:T')
  api.config.use(async (_p, method, payload) => {
    const p = payload as { chat_id: number; text?: string; caption?: string }
    const f = fail[p.chat_id]
    if (f) return { ok: false, error_code: f.startsWith('429') ? 429 : 403, description: f } as never
    calls.push({ method, chat: p.chat_id, text: p.text ?? p.caption ?? '' })
    return { ok: true, result: { message_id: 1 } } as never
  })
  return { api, calls }
}

async function seed() {
  const repo = memoryRepo()
  const mk = (n: number, over = {}) => repo.insertClient({ tg_user_id: n, name: `К${n}`, language: 'ru', consent_at: 'x', ...over })
  await mk(1)
  await mk(2, { language: 'en' })
  await mk(3, { consent_at: null })
  await mk(4, { opted_out_at: 'x' })
  await mk(5, { tg_user_id: null })
  return repo
}

test('в аудиторию попадают только согласившиеся, не отписанные и с Telegram', async () => {
  const repo = await seed()
  const all = await repo.listAudience()
  assert.deepEqual(all.map((c) => c.tg_user_id).sort(), [1, 2])
  assert.equal(all.filter((c) => inAudience(c, { language: 'en' })).length, 1)
  assert.equal(all.filter((c) => inAudience(c, { tags: ['VIP'] })).length, 0)
  assert.equal(inAudience({ ...repo.clients[2], services: [], interests: [], tags: [] }, {}), false)
})

test('сегмент по интересам: клиент попадает, если у любой его заявки есть любой из выбранных интересов', async () => {
  const repo = await seed()
  const [c1, c2] = repo.clients
  const { id } = await repo.insertLead({ client_id: c1.id, source: 'manual', service_key: null, title: null, topic: null, name: null, phone: null, telegram: null, email: null, company: null, comment: null, interest: null, lang: null, landing: null, utm: null, raw_text: null, warnings: [], tg_chat_id: null, tg_message_id: null } as never)
  await repo.updateLead(id, { interests: ['neuro_photo', 'ai'] })
  const all = await repo.listAudience()
  const ids = (seg: Parameters<typeof inAudience>[1]) => all.filter((c) => inAudience(c, seg)).map((c) => c.id)
  assert.deepEqual(ids({ interests: ['ai'] }), [c1.id])
  assert.deepEqual(ids({ interests: ['producing', 'neuro_photo'] }), [c1.id])
  assert.deepEqual(ids({ interests: ['crm_supaoffice'] }), [])
  assert.equal(ids({}).includes(c2.id), true)
})

test('рассылка уходит с подстановкой имени, языком клиента и ссылкой отписки', async () => {
  const repo = await seed()
  const b = base()
  repo.broadcasts.push(b)
  await repo.insertRecipients(b.id, (await repo.listAudience()).map((c) => c.id))
  const { api, calls } = fakeApi()
  const r = await tickBroadcasts({ repo, api })
  assert.equal(r.sent, 2)
  assert.match(calls.find((c) => c.chat === 1)!.text, /Привет, К1!\n\nОтписаться: \/stop/)
  assert.match(calls.find((c) => c.chat === 2)!.text, /Hi, К2!\n\nUnsubscribe: \/stop/)
  assert.equal(repo.broadcasts[0].status, 'done')
  assert.equal(repo.broadcasts[0].sent, 2)
  assert.equal(repo.messages.length, 2)
})

test('заблокировавший бота считается ошибкой, остальные получают; 429 останавливает пачку без потерь', async () => {
  const repo = await seed()
  const b = base()
  repo.broadcasts.push(b)
  await repo.insertRecipients(b.id, (await repo.listAudience()).map((c) => c.id))
  const blocked = fakeApi({ 1: 'Forbidden: bot was blocked by the user' })
  await tickBroadcasts({ repo, api: blocked.api })
  assert.equal(repo.broadcasts[0].failed, 1)
  assert.equal(repo.broadcasts[0].sent, 1)

  const repo2 = await seed()
  repo2.broadcasts.push(base())
  await repo2.insertRecipients('b1', (await repo2.listAudience()).map((c) => c.id))
  const limited = fakeApi({ 1: '429 Too Many Requests: retry after 5' })
  await tickBroadcasts({ repo: repo2, api: limited.api })
  assert.equal(repo2.recipients.filter((x) => x.status === 'pending').length, 2)
  assert.equal(repo2.broadcasts[0].status, 'sending')
})

test('запланированная на будущее рассылка ждёт, отменённая не уходит', async () => {
  const repo = await seed()
  repo.broadcasts.push(base({ scheduled_at: new Date(Date.now() + 3600_000).toISOString() }))
  await repo.insertRecipients('b1', (await repo.listAudience()).map((c) => c.id))
  const { api, calls } = fakeApi()
  await tickBroadcasts({ repo, api })
  assert.equal(calls.length, 0)
  repo.broadcasts[0].status = 'canceled'
  await tickBroadcasts({ repo, api, now: new Date(Date.now() + 7200_000) })
  assert.equal(calls.length, 0)
})

test('проверка черновика', () => {
  assert.match(validateBroadcast({ title: '', kind: 'text', body: 'x', body_en: null, media_url: null }), /название/i)
  assert.match(validateBroadcast({ title: 'a', kind: 'text', body: ' ', body_en: null, media_url: null }), /текст/i)
  assert.match(validateBroadcast({ title: 'a', kind: 'photo', body: '', body_en: null, media_url: '' }), /файл/i)
  assert.equal(validateBroadcast({ title: 'a', kind: 'photo', body: 'x', body_en: null, media_url: 'https://x/y.jpg' }), '')
})

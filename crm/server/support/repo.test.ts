import { test } from 'node:test'
import assert from 'node:assert/strict'
import { memoryRepo } from '../memoryRepo'

const c = () => memoryRepo()

test('клиент: тип и реквизиты юрлица сохраняются', async () => {
  const r = c()
  const cl = await r.insertClient({ name: 'ООО Ромашка', client_kind: 'legal', legal_name: 'ООО «Ромашка»', unp: '193000000', legal_address: 'Минск', bank_details: 'р/с …' })
  assert.equal(cl.client_kind, 'legal')
  assert.equal(cl.unp, '193000000')
  const got = await r.findClientById(cl.id)
  assert.equal(got?.legal_name, 'ООО «Ромашка»')
})

test('пакеты: создание, сортировка, правка', async () => {
  const r = c()
  await r.insertPackage({ code: 'premium', title: 'Премиум', sort_order: 3, features_limit: null })
  await r.insertPackage({ code: 'basic', title: 'Базовый', sort_order: 1, corrections_limit: 2 })
  await r.insertPackage({ code: 'standard', title: 'Стандартный', sort_order: 2, features_limit: 2 })
  const list = await r.listPackages()
  assert.deepEqual(list.map((p) => p.code), ['basic', 'standard', 'premium'])
  const p = list[0]
  assert.equal(p.corrections_limit, 2)
  await r.updatePackage(p.id, { corrections_limit: 5, is_active: false })
  const upd = await r.getPackage(p.id)
  assert.equal(upd?.corrections_limit, 5)
  assert.equal(upd?.is_active, false)
})

test('проект: привязка к клиенту и смена статуса', async () => {
  const r = c()
  const cl = await r.insertClient({})
  const pr = await r.insertProject({ client_id: cl.id, workspace_path: '/home/dsh/work/foo', repo_url: 'https://github.com/prmeadm/foo', deploy_cmd: 'npm run deploy' })
  assert.equal(pr.status, 'active')
  assert.equal(pr.default_branch, 'main')
  const byClient = await r.findProjectByClient(cl.id)
  assert.equal(byClient?.workspace_path, '/home/dsh/work/foo')
  await r.updateProject(pr.id, { status: 'paused' })
  assert.equal((await r.findProject(pr.id))?.status, 'paused')
})

test('сценарий: привязка к проекту', async () => {
  const r = c()
  const cl = await r.insertClient({})
  const pr = await r.insertProject({ client_id: cl.id })
  const sc = await r.upsertScenario({ client_id: cl.id, project_id: pr.id, system_prompt: 'Только правки в рамках пакета', allowed_actions: 'edit,deploy' })
  assert.equal(sc.version, 1)
  const found = await r.findScenarioByProject(pr.id)
  assert.equal(found?.system_prompt, 'Только правки в рамках пакета')
})

test('период: pending_payment → active, currentPeriod берёт активный (pending рядом не мешает)', async () => {
  const r = c()
  const cl = await r.insertClient({})
  const pr = await r.insertProject({ client_id: cl.id })
  const p1 = await r.insertPeriod({ project_id: pr.id, period_start: '2026-11-01T00:00:00Z', period_end: '2026-12-01T00:00:00Z' })
  assert.equal(p1.status, 'pending_payment')
  assert.equal(p1.corrections_used, 0)
  const cur = await r.currentPeriod(pr.id)
  assert.equal(cur?.id, p1.id)
  await r.updatePeriod(p1.id, { status: 'active', corrections_limit: 5, features_limit: 2 })
  assert.equal((await r.getPeriod(p1.id))?.status, 'active')
  await r.insertPeriod({ project_id: pr.id, period_start: '2026-12-01T00:00:00Z', period_end: '2027-01-01T00:00:00Z' })
  assert.equal((await r.currentPeriod(pr.id))?.id, p1.id, 'активный предпочтительнее pending')
  assert.equal((await r.listPeriods(pr.id)).length, 2)
})

test('обращение: очередь → claim → deploy', async () => {
  const r = c()
  const cl = await r.insertClient({})
  const pr = await r.insertProject({ client_id: cl.id })
  const j = await r.insertSupportJob({ client_id: cl.id, project_id: pr.id, request_text: 'Поменять заголовок' })
  assert.equal(j.status, 'queued')
  const claimed = await r.claimSupportJob(j.id)
  assert.equal(claimed?.status, 'running')
  assert.ok(claimed?.started_at)
  // повторный claim не проходит
  assert.equal(await r.claimSupportJob(j.id), null)
  await r.updateSupportJob(j.id, { status: 'deployed', edits_count: 1, finished_at: new Date().toISOString() })
  const done = await r.getSupportJob(j.id)
  assert.equal(done?.status, 'deployed')
  assert.equal(done?.edits_count, 1)
  assert.equal((await r.listSupportJobs(pr.id)).length, 1)
})

test('счёт: черновик → подтверждение оплаты', async () => {
  const r = c()
  const cl = await r.insertClient({})
  const pr = await r.insertProject({ client_id: cl.id })
  const inv = await r.insertInvoice({ client_id: cl.id, project_id: pr.id, kind: 'period', amount: 120 })
  assert.equal(inv.status, 'draft')
  assert.equal(inv.amount, 120)
  await r.updateInvoice(inv.id, { status: 'paid_confirmed', confirmed_by: 'admin-1', confirmed_at: '2026-11-20T10:00:00Z' })
  const got = await r.getInvoice(inv.id)
  assert.equal(got?.status, 'paid_confirmed')
  assert.equal(got?.confirmed_by, 'admin-1')
  assert.equal((await r.listInvoices(cl.id)).length, 1)
})

test('журнал: действие агента сохраняется и читается по проекту', async () => {
  const r = c()
  const cl = await r.insertClient({})
  const pr = await r.insertProject({ client_id: cl.id })
  await r.insertAudit({ client_id: cl.id, project_id: pr.id, actor: 'ai', action: 'deploy', payload: { edits: 1 } })
  const log = await r.listAudit(pr.id)
  assert.equal(log.length, 1)
  assert.equal(log[0].actor, 'ai')
  assert.equal(log[0].action, 'deploy')
})

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { memoryRepo } from '../memoryRepo'
import { activatePeriod, confirmInvoice, monthRange, spendCorrections, spendFeatures, startPeriod } from './period'
import { calcUpgrade } from './upgrade'

test('monthRange: период ровно месяц от даты подтверждения', () => {
  const { start, end } = monthRange('2026-11-20T10:00:00Z')
  assert.equal(start, '2026-11-20T10:00:00.000Z')
  assert.equal(end, '2026-12-20T10:00:00.000Z')
})

test('startPeriod создаёт pending_payment со снимком лимитов пакета', async () => {
  const repo = memoryRepo()
  const cl = await repo.insertClient({ name: 'Мария' })
  const pr = await repo.insertProject({ client_id: cl.id, status: 'active' })
  const pkg = await repo.insertPackage({ code: 'standard', title: 'Стандарт', corrections_limit: 5, features_limit: 2 })
  const period = await startPeriod(repo, pr.id, pkg, '2026-11-20T10:00:00Z')
  assert.equal(period.status, 'pending_payment')
  assert.equal(period.corrections_limit, 5)
  assert.equal(period.features_limit, 2)
  assert.equal(period.corrections_used, 0)
})

test('activatePeriod: период активен, прочие открытые закрыты', async () => {
  const repo = memoryRepo()
  const cl = await repo.insertClient({ name: 'Мария' })
  const pr = await repo.insertProject({ client_id: cl.id })
  const pkg = await repo.insertPackage({ code: 'basic', title: 'Базовый' })
  const p1 = await startPeriod(repo, pr.id, pkg, '2026-11-01T00:00:00Z')
  const p2 = await startPeriod(repo, pr.id, pkg, '2026-11-20T00:00:00Z')
  await activatePeriod(repo, p2.id)
  assert.equal((await repo.getPeriod(p2.id))!.status, 'active')
  assert.equal((await repo.getPeriod(p1.id))!.status, 'expired')
})

test('confirmInvoice: paid_confirmed + активация связанного периода', async () => {
  const repo = memoryRepo()
  const cl = await repo.insertClient({ name: 'Мария' })
  const pr = await repo.insertProject({ client_id: cl.id })
  const pkg = await repo.insertPackage({ code: 'basic', title: 'Базовый' })
  const period = await startPeriod(repo, pr.id, pkg)
  const inv = await repo.insertInvoice({ client_id: cl.id, kind: 'period', amount: 100, period_id: period.id })
  await confirmInvoice(repo, inv.id, 'admin-1')
  assert.equal((await repo.getInvoice(inv.id))!.status, 'paid_confirmed')
  assert.equal((await repo.getInvoice(inv.id))!.confirmed_by, 'admin-1')
  assert.equal((await repo.getPeriod(period.id))!.status, 'active')
})

test('spendCorrections: списывает правки и требует активного периода', async () => {
  const repo = memoryRepo()
  const cl = await repo.insertClient({ name: 'Мария' })
  const pr = await repo.insertProject({ client_id: cl.id })
  const pkg = await repo.insertPackage({ code: 'standard', title: 'Стандарт', corrections_limit: 5 })
  const period = await startPeriod(repo, pr.id, pkg)
  await activatePeriod(repo, period.id)
  await spendCorrections(repo, pr.id, 2)
  assert.equal((await repo.getPeriod(period.id))!.corrections_used, 2)
  const pr2 = await repo.insertProject({ client_id: cl.id })
  await assert.rejects(spendCorrections(repo, pr2.id, 1), /активного/)
})

test('spendFeatures: списывает функции', async () => {
  const repo = memoryRepo()
  const cl = await repo.insertClient({ name: 'Мария' })
  const pr = await repo.insertProject({ client_id: cl.id })
  const pkg = await repo.insertPackage({ code: 'premium', title: 'Премиум', features_limit: 10 })
  const period = await startPeriod(repo, pr.id, pkg)
  await activatePeriod(repo, period.id)
  await spendFeatures(repo, pr.id, 1)
  assert.equal((await repo.getPeriod(period.id))!.features_used, 1)
})

test('calcUpgrade: остаток дней зачитывается, при исчерпании лимитов — нет', () => {
  const base = { period_start: '2026-11-01T00:00:00Z', period_end: '2026-12-01T00:00:00Z' }
  const mid = calcUpgrade({ ...base, corrections_limit: 5, corrections_used: 2 }, 100, 200, '2026-11-15T00:00:00Z')
  assert.equal(mid.totalDays, 30)
  assert.equal(mid.remainingDays, 16)
  assert.equal(mid.credit, 53.33)
  assert.equal(mid.toPay, 146.67)
  const exhausted = calcUpgrade({ ...base, corrections_limit: 5, corrections_used: 5 }, 100, 200, '2026-11-15T00:00:00Z')
  assert.equal(exhausted.credit, 0)
  assert.equal(exhausted.toPay, 200)
})

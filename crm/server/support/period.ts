// Периоды и оплата (Фаза 5): старт/активация периода, подтверждение оплаты, списание счётчиков.
// Логика через Repo (в тестах — memory), чистая и проверяемая.
import type { SupportRepo } from './pgRepo.js'
import type { PackageRow } from './types.js'

/** Границы месяца от даты подтверждения оплаты (вариант B из ТЗ). День клампится в целевом месяце (31.01 → 28.02). */
export function monthRange(startIso: string): { start: string; end: string } {
  const start = new Date(startIso)
  const end = new Date(start)
  const day = end.getDate()
  end.setMonth(end.getMonth() + 1)
  if (end.getDate() !== day) end.setDate(0) // переполнение дня → последний день целевого месяца
  return { start: start.toISOString(), end: end.toISOString() }
}

/** Новый период со снимком лимитов пакета; статус pending_payment (оплата не подтверждена). */
export async function startPeriod(repo: SupportRepo, projectId: string, pkg: PackageRow, startIso = new Date().toISOString()) {
  const { start, end } = monthRange(startIso)
  return repo.insertPeriod({
    project_id: projectId, package_id: pkg.id, period_start: start, period_end: end, status: 'pending_payment',
    corrections_limit: pkg.corrections_limit, features_limit: pkg.features_limit, requests_limit: pkg.requests_limit,
    credits_limit: pkg.credits,
  })
}

/** Подтверждение оплаты → период активен; прочие открытые периоды проекта закрываются. */
export async function activatePeriod(repo: SupportRepo, periodId: string): Promise<void> {
  const period = await repo.getPeriod(periodId)
  if (!period) throw new Error('period not found')
  const others = (await repo.listPeriods(period.project_id)).filter((p) => p.id !== periodId && (p.status === 'active' || p.status === 'pending_payment'))
  for (const p of others) await repo.updatePeriod(p.id, { status: 'expired' })
  await repo.updatePeriod(periodId, { status: 'active' })
}

/** Подтверждение оплаты счёта: paid_confirmed + активация связанного периода. */
export async function confirmInvoice(repo: SupportRepo, invoiceId: string, adminUserId: string | null): Promise<void> {
  const inv = await repo.getInvoice(invoiceId)
  if (!inv) throw new Error('invoice not found')
  await repo.updateInvoice(invoiceId, { status: 'paid_confirmed', confirmed_by: adminUserId, confirmed_at: new Date().toISOString() })
  if (inv.period_id) await activatePeriod(repo, inv.period_id)
}

/** Списание правок после успешного деплоя (1 обращение = 1+ правок). Требует активного периода. */
export async function spendCorrections(repo: SupportRepo, projectId: string, count = 1): Promise<void> {
  const period = await repo.currentPeriod(projectId)
  if (!period || period.status !== 'active') throw new Error('нет активного оплаченного периода')
  await repo.updatePeriod(period.id, { corrections_used: period.corrections_used + count })
}

export async function spendFeatures(repo: SupportRepo, projectId: string, count = 1): Promise<void> {
  const period = await repo.currentPeriod(projectId)
  if (!period || period.status !== 'active') throw new Error('нет активного оплаченного периода')
  await repo.updatePeriod(period.id, { features_used: period.features_used + count })
}

/** Списание кредитов ST после успешного деплоя (итог creditCost). Требует активного периода. */
export async function spendCredits(repo: SupportRepo, projectId: string, count: number): Promise<void> {
  const period = await repo.currentPeriod(projectId)
  if (!period || period.status !== 'active') throw new Error('нет активного оплаченного периода')
  await repo.updatePeriod(period.id, { credits_used: period.credits_used + count })
}

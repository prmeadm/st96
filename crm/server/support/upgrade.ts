// Пересчёт смены пакета в середине периода (ТЗ §5.5): остаток дней зачитывается в новый пакет.
// Чистая функция, без IO.
export type UpgradeCalc = { remainingDays: number; totalDays: number; credit: number; toPay: number }

export type PeriodForUpgrade = {
  period_start: string
  period_end: string
  corrections_limit: number | null
  corrections_used: number
}

/**
 * credit — сколько засчитывается из оплаченного месяца; toPay — доплата за новый пакет.
 * Лимиты исчерпаны (правки израсходованы) → остаток дней не зачитывается, новый пакет оплачивается полностью.
 */
export function calcUpgrade(p: PeriodForUpgrade, oldPrice: number, newPrice: number, nowIso: string): UpgradeCalc {
  const start = Date.parse(p.period_start)
  const end = Date.parse(p.period_end)
  const now = Date.parse(nowIso)
  const totalDays = Math.max(1, Math.round((end - start) / 86400_000))
  const remainingDays = Math.max(0, Math.round((end - now) / 86400_000))
  const exhausted = p.corrections_limit != null && p.corrections_used >= p.corrections_limit
  const credit = exhausted ? 0 : Math.round((remainingDays / totalDays) * oldPrice * 100) / 100
  const toPay = Math.max(0, Math.round((newPrice - credit) * 100) / 100)
  return { remainingDays, totalDays, credit, toPay }
}

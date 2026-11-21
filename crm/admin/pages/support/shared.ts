import { useEffect, useState } from 'react'
import { supabase } from '../../supabase'

export const JOB_STATUSES: Record<string, string> = {
  queued: 'В очереди', running: 'Выполняется', clarify: 'Уточнение', ready: 'Готово к деплою',
  awaiting_confirmation: 'Ожидает подтверждения',
  deployed: 'Развёрнуто', split: 'Частично', out_of_scope: 'Вне пакета', awaiting_payment: 'Ждёт оплаты', failed: 'Ошибка',
}
export const PERIOD_STATUSES: Record<string, string> = {
  pending_payment: 'Ждёт оплаты', active: 'Активен', expired: 'Истёк', blocked: 'Заблокирован',
}
export const INVOICE_STATUSES: Record<string, string> = {
  draft: 'Черновик', sent: 'Отправлен', paid_confirmed: 'Оплачен', cancelled: 'Отменён',
}
export const INVOICE_KINDS: Record<string, string> = { period: 'Период', feature: 'Функция', upgrade: 'Апгрейд' }
export const PROJECT_STATUSES: Record<string, string> = { active: 'Активен', paused: 'На паузе', closed: 'Закрыт' }

export const limitLabel = (n: number | null) => (n == null ? '∞' : String(n))
export const money = (n: number | null) => (n == null ? '—' : n + ' BYN')
export const fmtDate = (s: string | null) => (s ? new Date(s).toLocaleString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' }) : '—')

/** Простая загрузка таблицы через supabase (service-agnostic). */
export function useTable<T>(table: string, order?: string, limit = 500, select = '*') {
  const [rows, setRows] = useState<T[] | null>(null)
  const [error, setError] = useState('')
  const [tick, setTick] = useState(0)
  useEffect(() => {
    let q = supabase.from(table).select(select).limit(limit)
    if (order) q = q.order(order)
    q.then(({ data, error: e }) => { if (e) setError('Не удалось загрузить') ; else setRows((data ?? []) as T[]) })
  }, [table, order, limit, select, tick])
  return { rows, error, reload: () => setTick((x) => x + 1) }
}

/** Число из строки: пусто → null. */
export const num = (s: string): number | null => (s.trim() === '' ? null : Number(s))

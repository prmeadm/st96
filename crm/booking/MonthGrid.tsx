import { addDays, dowOf, fromDayNum } from '../server/booking/schedule'

export type CellInfo = { disabled?: boolean; cls?: string; badge?: number | null; dot?: boolean; title?: string; marks?: { color: string; n: number; label: string }[] }
const MONTHS = { ru: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'], en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'] }
const DOWS = { ru: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'], en: ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'] }

export const shiftMonth = (month: string, delta: number) => {
  const [y, m] = month.split('-').map(Number)
  const d = new Date(Date.UTC(y!, m! - 1 + delta, 1))
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}

/** Календарь месяца (неделя с понедельника). Даты строками «ГГГГ-ММ-ДД», без привязки к часовому поясу браузера. */
export function MonthGrid({ month, onMonth, selected, cell, onPick, lang = 'ru' }: { month: string; onMonth: (m: string) => void; selected?: string; cell: (date: string) => CellInfo; onPick: (date: string) => void; lang?: 'ru' | 'en' }) {
  const first = `${month}-01`
  const start = addDays(first, -dowOf(first))
  const days = Array.from({ length: 42 }, (_, i) => addDays(start, i)).filter((_, i, a) => i < 35 || a[35]!.slice(0, 7) === month)
  const [y, m] = month.split('-').map(Number)
  return (
    <div className="mg">
      <div className="mg-head">
        <button type="button" className="mg-nav" onClick={() => onMonth(shiftMonth(month, -1))} aria-label={lang === 'en' ? 'Previous month' : 'Предыдущий месяц'}>‹</button>
        <b>{MONTHS[lang][m! - 1]} {y}</b>
        <button type="button" className="mg-nav" onClick={() => onMonth(shiftMonth(month, 1))} aria-label={lang === 'en' ? 'Next month' : 'Следующий месяц'}>›</button>
      </div>
      <div className="mg-row">{DOWS[lang].map((x, i) => <div className={`mg-dn ${i >= 5 ? 'we' : ''}`} key={x}>{x}</div>)}</div>
      <div className="mg-grid">
        {days.map((d) => {
          const c = cell(d)
          return (
            <button key={d} type="button" disabled={c.disabled} onClick={() => onPick(d)} title={c.title}
              className={`mg-cell ${c.cls ?? ''} ${dowOf(d) >= 5 ? 'we' : ''} ${d.slice(0, 7) !== month ? 'out' : ''} ${selected === d ? 'sel' : ''}`} aria-pressed={selected === d}>
              <span>{Number(d.slice(8))}</span>
              {c.badge != null && c.badge > 0 && <i className="mg-bdg">{c.badge}</i>}
              {c.dot && <i className="mg-dot" />}
              {!!c.marks?.length && <span className="mg-marks" aria-label={c.marks.map((x) => `${x.label}: ${x.n}`).join(', ')}>{c.marks.map((x) => <i key={x.label} style={{ background: x.color }}>{x.n}</i>)}</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}
export { fromDayNum }

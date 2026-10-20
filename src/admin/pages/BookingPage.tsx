import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabase'
import { callApi } from '../api'
import { fmtDate } from '../types'
import { Icon } from '../ui/Icon'
import { Seg } from '../ui/Seg'
import { MonthGrid, type CellInfo } from '../../booking/MonthGrid'
import '../../booking/monthgrid.css'
import {
  DOW, FORMAT_KEYS, FORMAT_LABEL, HOLIDAYS_BY, SERVICE_KEYS, SERVICE_LABEL, addDays, dayInfo, defaultSchedule, dowOf, minskNow, normalizeSchedule, pad, toLocal, whenLabel,
  type DayBooking, type FormatKey, type Override, type Schedule, type ServiceKey, type Win,
} from '../../../server/booking/schedule'
import { BOOKING_STATUS, type BookingRow, type BookingStatus } from '../../../server/booking/types'
import { UNKNOWN_SERVICE, serviceLabel } from '../../../server/catalog'
import './booking.css'

const CHIP: Record<BookingStatus, string> = { pending: 'amber', confirmed: 'green', rejected: 'red', canceled: '' }
/** Цвет услуги на календаре: дополнительные цвета бренда ST96 по порядку услуг на сайте */
const SVC_COLORS = ['#8b6bff', '#ff5fa8', '#1fbfa5', '#4d7bff', '#ff8a3d']
// Встречи со старой услугой (её больше нет на сайте) — серым
const svcColor = (k: string) => (SERVICE_KEYS.includes(k) ? SVC_COLORS[SERVICE_KEYS.indexOf(k) % SVC_COLORS.length]! : '#8a8a93')
const hhmm = (m: number) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`
const active = (b: BookingRow) => b.status === 'pending' || b.status === 'confirmed'
type Tab = 'requests' | 'schedule' | 'link'

export default function BookingPage() {
  const [tab, setTab] = useState<Tab>('requests')
  const [rows, setRows] = useState<BookingRow[] | null>(null)
  const [sched, setSched] = useState<Schedule | null>(null)
  const [meetDefault, setMeetDefault] = useState('')
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    const [b, s, m] = await Promise.all([
      supabase.from('bookings').select('*').order('starts_at', { ascending: false }).limit(300),
      supabase.from('app_settings').select('value').eq('key', 'booking_schedule').maybeSingle(),
      supabase.from('app_settings').select('value').eq('key', 'booking_meet_default').maybeSingle(),
    ])
    setMeetDefault(typeof m.data?.value === 'string' ? m.data.value : '')
    if (b.error) return setError('Не удалось загрузить заявки на встречи')
    setRows((b.data ?? []) as BookingRow[])
    let parsed: unknown = null
    try { parsed = typeof s.data?.value === 'string' ? JSON.parse(s.data.value) : null } catch { /* повреждённые настройки: берём умолчания */ }
    setSched(parsed ? normalizeSchedule(parsed) : defaultSchedule())
  }, [])
  useEffect(() => { void load() }, [load])
  const pending = rows?.filter((r) => r.status === 'pending').length ?? 0

  return (
    <div className="wrap bkadm">
      <h1 className="h1">Запись на встречу {pending > 0 && <span className="chip amber">{pending} ждут ответа</span>}</h1>
      <Seg label="Раздел" value={tab} onChange={setTab} options={[{ value: 'requests', label: 'Заявки', icon: 'notes' }, { value: 'schedule', label: 'Расписание', icon: 'clock' }, { value: 'link', label: 'Ссылка', icon: 'external' }]} />
      {error && <div className="err" role="alert">{error}</div>}
      {tab === 'requests' && <Requests rows={rows} reload={load} />}
      {tab === 'schedule' && sched && <ScheduleTab initial={sched} rows={rows ?? []} onSaved={setSched} onBooked={load} />}
      {tab === 'link' && <LinkTab meetDefault={meetDefault} onMeet={setMeetDefault} />}
    </div>
  )
}

// ───────────────────────── заявки ─────────────────────────
function Requests({ rows, reload }: { rows: BookingRow[] | null; reload: () => Promise<void> }) {
  const [filter, setFilter] = useState<'all' | BookingStatus>('all')
  const [meet, setMeet] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState('')
  const [msg, setMsg] = useState('')
  const list = (rows ?? []).filter((r) => filter === 'all' || r.status === filter).sort((a, b) => (filter === 'confirmed' || filter === 'pending' ? a.starts_at.localeCompare(b.starts_at) : b.starts_at.localeCompare(a.starts_at)))

  const decide = async (b: BookingRow, decision: 'confirm' | 'reject' | 'cancel') => {
    if (decision !== 'confirm' && !confirm(decision === 'reject' ? 'Отклонить заявку? Клиенту уйдёт сообщение с предложением выбрать другое время.' : 'Отменить подтверждённую встречу? Клиенту уйдёт сообщение.')) return
    setBusy(b.id)
    const r = await callApi<{ notified: boolean }>('/api/booking-admin', { action: 'decide', id: b.id, decision, meetUrl: meet[b.id] ?? '' })
    setBusy('')
    setMsg(r.ok ? (r.data.notified ? 'Готово, клиенту отправлено сообщение в Telegram.' : 'Готово. Клиент не в Telegram: свяжитесь с ним вручную.') : r.error)
    await reload()
  }
  const saveMeet = async (b: BookingRow) => {
    const r = await callApi('/api/booking-admin', { action: 'set_meet', id: b.id, meetUrl: meet[b.id] ?? '' })
    setMsg(r.ok ? 'Ссылка сохранена. Клиент получит её в напоминании за час.' : r.error)
    await reload()
  }

  return (
    <>
      <div className="chips">
        {([['all', 'Все'], ['pending', 'На рассмотрении'], ['confirmed', 'Подтверждённые'], ['rejected', 'Отклонённые'], ['canceled', 'Отменённые']] as const).map(([k, l]) => (
          <button key={k} type="button" className={filter === k ? 'on' : ''} aria-pressed={filter === k} onClick={() => setFilter(k)}>{l}</button>
        ))}
      </div>
      {msg && <div className="hint" role="status">{msg}</div>}
      {rows === null && <div className="empty">Загрузка…</div>}
      {rows && list.length === 0 && <div className="empty">Заявок нет. Ссылка для клиентов на вкладке «Ссылка».</div>}
      {list.map((b) => (
        <div className="card brow" key={b.id}>
          <div className="row">
            <b className="bwhen">{whenLabel(b.starts_at)}</b>
            <span className={`chip ${CHIP[b.status]}`}>{BOOKING_STATUS[b.status]}</span>
            <span className="sp" />
            {b.status === 'pending' && <>
              <button type="button" className="btn" disabled={busy === b.id} onClick={() => decide(b, 'reject')}>Отклонить</button>
              <button type="button" className="btn primary" disabled={busy === b.id} onClick={() => decide(b, 'confirm')}>Подтвердить</button>
            </>}
            {b.status === 'confirmed' && <>
              <a className="btn" href={`/api/booking?ics=${b.id}`}><Icon name="upload" size={16} />.ics</a>
              <button type="button" className="btn danger" disabled={busy === b.id} onClick={() => decide(b, 'cancel')}>Отменить</button>
            </>}
          </div>
          <dl className="kv">
            <dt>Услуга</dt><dd>{serviceLabel(b.service, 'ru')} · {Math.round((Date.parse(b.ends_at) - Date.parse(b.starts_at)) / 60000)} мин</dd>
            <dt>Формат</dt><dd>{FORMAT_LABEL[b.format].ru}</dd>
            <dt>Клиент</dt><dd>{b.client_id ? <Link to={`/clients/${b.client_id}`}>{b.name}</Link> : b.name}{b.company ? `, ${b.company}` : ''}</dd>
            <dt>Контакты</dt><dd>{[b.telegram, b.phone].filter(Boolean).join(' · ') || '—'}</dd>
            {b.goal && <><dt>Цель</dt><dd>{b.goal}</dd></>}
            {b.comment && <><dt>Комментарий</dt><dd>{b.comment}</dd></>}
            <dt>Источник</dt><dd>{{ site: 'Сайт', funnel: 'Воронка', link: 'Личная ссылка', admin: 'Админка' }[b.source] ?? b.source} · создана {fmtDate(b.created_at)}</dd>
          </dl>
          {b.format === 'video' && (b.status === 'pending' || b.status === 'confirmed') && (
            <div className="meetrow">
              <input type="url" placeholder="Ссылка на видеозвонок https://…" value={meet[b.id] ?? b.meet_url ?? ''} onChange={(e) => setMeet({ ...meet, [b.id]: e.target.value })} aria-label="Ссылка на видеозвонок" />
              {b.status === 'confirmed' && <button type="button" className="btn" onClick={() => saveMeet(b)}>Сохранить ссылку</button>}
            </div>
          )}
        </div>
      ))}
    </>
  )
}

// ───────────────────────── расписание ─────────────────────────
const TimeRange = ({ w, onChange, onDel }: { w: Win; onChange: (w: Win) => void; onDel?: (() => void) | null }) => (
  <div className="trange">
    <input type="time" value={w.from} onChange={(e) => onChange({ ...w, from: e.target.value })} aria-label="С" />
    <span>—</span>
    <input type="time" value={w.to} onChange={(e) => onChange({ ...w, to: e.target.value })} aria-label="До" />
    {onDel && <button type="button" className="x" onClick={onDel} aria-label="Удалить окно"><Icon name="close" size={16} /></button>}
  </div>
)

function ScheduleTab({ initial, rows, onSaved, onBooked }: { initial: Schedule; rows: BookingRow[]; onSaved: (s: Schedule) => void; onBooked: () => void }) {
  const [S, setS] = useState(initial)
  const [dirty, setDirty] = useState(false)
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const now = useMemo(() => new Date(), [])
  const today = minskNow(now).date
  const [month, setMonth] = useState(today.slice(0, 7))
  const [sel, setSel] = useState(today)
  const [pick, setPick] = useState('')
  const [nb, setNb] = useState({ service: SERVICE_KEYS[0]!, format: 'call' as FormatKey, name: '', phone: '', telegram: '', comment: '' })
  const [range, setRange] = useState({ from: '', to: '', reason: 'Отпуск' })
  const [blk, setBlk] = useState<Win>({ from: '14:00', to: '16:00' })
  const R = S.rules
  const edit = (next: Schedule) => { setS(next); setDirty(true); setMsg('') }
  const upW = (i: number, p: Partial<Schedule['week'][number]>) => edit({ ...S, week: { ...S.week, [i]: { ...S.week[i]!, ...p } } })
  const upR = (p: Partial<Schedule['rules']>) => edit({ ...S, rules: { ...R, ...p } })
  const setOv = (key: string, p: Partial<Override>) => {
    const ov: Override = { ...(S.overrides[key] ?? {}), ...p }
    if (!ov.closed) delete ov.closed
    if (!ov.open) delete ov.open
    if (!ov.windows?.length) delete ov.windows
    if (!ov.blocks?.length) delete ov.blocks
    const o = { ...S.overrides }
    if (Object.keys(ov).length) o[key] = ov
    else delete o[key]
    edit({ ...S, overrides: o })
  }

  const bookedBy = useMemo(() => {
    const m = new Map<string, DayBooking[]>()
    for (const b of rows) {
      if (!active(b)) continue
      const a = toLocal(b.starts_at)
      const e = toLocal(b.ends_at)
      m.set(a.date, [...(m.get(a.date) ?? []), { startMin: a.min, endMin: e.date > a.date ? 1440 : e.min }])
    }
    return m
  }, [rows])
  // Встречи по дням и услугам: видно на календаре, сколько встреч и по каким услугам назначено
  const meetingsBy = useMemo(() => {
    const m = new Map<string, BookingRow[]>()
    for (const b of rows) if (active(b)) { const d = toLocal(b.starts_at).date; m.set(d, [...(m.get(d) ?? []), b]) }
    for (const list of m.values()) list.sort((a, b) => a.starts_at.localeCompare(b.starts_at))
    return m
  }, [rows])
  const info = (d: string) => dayInfo(d, S, bookedBy.get(d) ?? [], null, now)
  const cell = (d: string): CellInfo => {
    const i = info(d)
    const list = meetingsBy.get(d) ?? []
    const per = [...SERVICE_KEYS, UNKNOWN_SERVICE].map((k) => ({ k, n: list.filter((b) => (SERVICE_KEYS.includes(b.service) ? b.service : UNKNOWN_SERVICE) === k).length })).filter((x) => x.n)
    const marks = per.map((x) => ({ color: svcColor(x.k), n: x.n, label: serviceLabel(x.k) }))
    const what = marks.map((x) => `${x.label}: ${x.n}`).join(', ')
    return { cls: i.past || i.far ? 'dis' : i.closed ? 'closed' : 'open', dot: !!S.overrides[d], marks, title: [i.closed ? i.why : `Свободно слотов: ${i.free}`, what && `Встречи: ${what}`].filter(Boolean).join('. ') }
  }
  const book = async () => {
    if (!nb.name.trim() || (!nb.phone.trim() && !nb.telegram.trim())) return setMsg('Укажите имя клиента и телефон или Telegram')
    setBusy(true)
    const r = await callApi<{ notified: boolean }>('/api/booking-admin', { action: 'create', booking: { ...nb, date: sel, time: pick } })
    setBusy(false)
    if (!r.ok) return setMsg(r.error)
    setMsg(`Встреча ${pick} забронирована и подтверждена${r.data.notified ? ', клиенту отправлено сообщение' : ''}.`)
    setPick(''); setNb({ ...nb, name: '', phone: '', telegram: '', comment: '' }); onBooked()
  }
  const di = info(sel)
  const ov = S.overrides[sel] ?? {}
  const defOpen = S.week[dowOf(sel)]!.on
  const isOpen = !di.closed
  const toggleDay = (v: boolean) => setOv(sel, v === defOpen ? { closed: false, open: false } : v ? { closed: false, open: true } : { closed: true, open: false })

  const closeRange = () => {
    if (!range.from || !range.to || range.to < range.from) return setMsg('Укажите даты: «с» не позже «по»')
    const o = { ...S.overrides }
    let n = 0
    for (let d = range.from; d <= range.to && n < 400; d = addDays(d, 1)) { o[d] = { ...(o[d] ?? {}), closed: true, reason: range.reason }; n++ }
    edit({ ...S, overrides: o })
    setMsg(`Закрыто дней: ${n}. Не забудьте сохранить.`)
  }
  const holidays = () => {
    const y = Number(today.slice(0, 4))
    const o = { ...S.overrides }
    let n = 0
    for (const yy of [y, y + 1]) for (const [m, d, reason] of HOLIDAYS_BY) {
      const key = `${yy}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      if (key >= today) { o[key] = { ...(o[key] ?? {}), closed: true, reason }; n++ }
    }
    edit({ ...S, overrides: o })
    setMsg(`Закрыто праздничных дней: ${n}. Переносные даты проверьте вручную.`)
  }
  const save = async () => {
    setBusy(true)
    const r = await callApi<{ schedule: Schedule }>('/api/booking-admin', { action: 'save_schedule', schedule: S })
    setBusy(false)
    if (!r.ok) return setMsg(r.error)
    setS(r.data.schedule); onSaved(r.data.schedule); setDirty(false); setMsg('Расписание сохранено. Клиенты видят новые слоты сразу.')
  }

  return (
    <>
      <div className="savebar">
        <span className="hint" role="status">{msg || (dirty ? 'Есть несохранённые изменения' : 'Все изменения сохранены')}</span><span className="sp" />
        <button type="button" className="btn primary" disabled={!dirty || busy} onClick={save}>{busy ? 'Сохраняю…' : 'Сохранить расписание'}</button>
      </div>
      <div className="two">
        <div className="col">
          <div className="card">
            <h3>Рабочие часы по дням недели</h3>
            {DOW.map((n, i) => (
              <div className="wrow" key={i}>
                <label className="dayname"><input type="checkbox" checked={S.week[i]!.on} onChange={(e) => upW(i, { on: e.target.checked })} aria-label={`${n}: рабочий день`} /><b>{n}</b></label>
                <div className="wins">
                  {S.week[i]!.on ? (
                    <>
                      {S.week[i]!.windows.map((w, k) => <TimeRange key={k} w={w} onChange={(nw) => upW(i, { windows: S.week[i]!.windows.map((x, j) => (j === k ? nw : x)) })} onDel={S.week[i]!.windows.length > 1 ? () => upW(i, { windows: S.week[i]!.windows.filter((_, j) => j !== k) }) : null} />)}
                      <button type="button" className="lnk" onClick={() => upW(i, { windows: [...S.week[i]!.windows, { from: '14:00', to: '18:00' }] })}><Icon name="plus" size={14} />окно (перерыв между окнами)</button>
                    </>
                  ) : <span className="hint">Выходной</span>}
                </div>
              </div>
            ))}
          </div>
          <div className="card">
            <h3>Правила слотов</h3>
            <div className="fgrid">
              <div className="fld"><label>Шаг сетки</label><select value={R.step} onChange={(e) => upR({ step: +e.target.value })}>{[15, 30, 60].map((x) => <option key={x} value={x}>{x} мин</option>)}</select></div>
              <div className="fld"><label>Буфер между встречами</label><select value={R.buffer} onChange={(e) => upR({ buffer: +e.target.value })}>{[0, 5, 10, 15, 30].map((x) => <option key={x} value={x}>{x} мин</option>)}</select></div>
              <div className="fld"><label>Записаться не раньше чем за, ч</label><input type="number" min={0} value={R.minNotice} onChange={(e) => upR({ minNotice: +e.target.value })} /></div>
              <div className="fld"><label>Горизонт записи, дней</label><input type="number" min={1} max={365} value={R.horizon} onChange={(e) => upR({ horizon: +e.target.value })} /></div>
              <div className="fld"><label>Длительность встречи</label><select value={R.duration} onChange={(e) => upR({ duration: +e.target.value })}>{[15, 30, 45, 60, 90, 120].map((x) => <option key={x} value={x}>{x} мин</option>)}</select></div>
              <div className="fld"><label>Максимум встреч в день</label><input type="number" min={1} value={R.maxPerDay} onChange={(e) => upR({ maxPerDay: +e.target.value })} /></div>
            </div>
            <div className="hint">Расписание и слоты общие для всех услуг. Услугу указывают при бронировании.</div>
          </div>
          <div className="card">
            <h3>Офлайн-встречи</h3>
            <div className="chips">{DOW.map((n, i) => <button type="button" key={i} className={R.offlineDays.includes(i) ? 'on' : ''} aria-pressed={R.offlineDays.includes(i)} onClick={() => upR({ offlineDays: R.offlineDays.includes(i) ? R.offlineDays.filter((x) => x !== i) : [...R.offlineDays, i].sort() })}>{n}</button>)}</div>
            <div className="hint">Звонок и видеозвонок доступны в любой рабочий день. Время считается по Минску.</div>
          </div>
        </div>

        <div className="col">
          <div className="card">
            <h3>Календарь встреч</h3>
            <div className="legend"><span><i className="sw open" />открыт</span><span><i className="sw closed" />закрыт</span><span><i className="sw we" />суббота, воскресенье</span><span><i className="mg-dot lg" />исключение</span></div>
            <div className="legend">{SERVICE_KEYS.map((k) => <span key={k}><i className="svcdot" style={{ background: svcColor(k) }} />{SERVICE_LABEL[k]!.ru}</span>)}{rows.some((b) => active(b) && !SERVICE_KEYS.includes(b.service)) && <span><i className="svcdot" style={{ background: svcColor(UNKNOWN_SERVICE) }} />{serviceLabel(UNKNOWN_SERVICE)}</span>}</div>
            <MonthGrid month={month} onMonth={setMonth} selected={sel} cell={cell} onPick={(d) => { setSel(d); setPick(''); if (d.slice(0, 7) !== month) setMonth(d.slice(0, 7)) }} />
            <div className="rangebox">
              <div className="h2">Закрыть период</div>
              <div className="rangerow">
                <div className="fld"><label>с</label><input type="date" value={range.from} onChange={(e) => setRange({ ...range, from: e.target.value })} /></div>
                <div className="fld"><label>по</label><input type="date" value={range.to} onChange={(e) => setRange({ ...range, to: e.target.value })} /></div>
                <div className="fld grow"><label>Причина</label><input value={range.reason} onChange={(e) => setRange({ ...range, reason: e.target.value })} /></div>
                <button type="button" className="btn" onClick={closeRange}>Закрыть</button>
              </div>
              <div className="row">
                <button type="button" className="btn" onClick={holidays}>Закрыть праздники РБ</button>
                <button type="button" className="btn" onClick={() => { edit({ ...S, overrides: {} }); setMsg('Все исключения сброшены. Не забудьте сохранить.') }}>Сбросить исключения</button>
              </div>
            </div>
          </div>

          <div className="card">
            <h3>{whenLabel(`${sel}T09:00:00Z`).split(',').slice(0, 2).join(',')}</h3>
            {di.past ? <div className="hint">Прошедший день: изменить нельзя.</div> : (
              <>
                <label className="swrow"><input type="checkbox" checked={isOpen && !di.far} onChange={(e) => toggleDay(e.target.checked)} /><span>{isOpen ? 'Принимаем записи в этот день' : 'День закрыт для записи'}</span></label>
                {di.closed && <div className="hint">Причина: {di.why}</div>}
                {ov.closed && <div className="fld"><label>Причина для себя</label><input value={ov.reason ?? ''} onChange={(e) => setOv(sel, { reason: e.target.value })} placeholder="Отпуск, съёмка…" /></div>}
                {isOpen && (
                  <>
                    <div className="h2">Часы приёма в этот день</div>
                    {ov.windows ? (
                      <div className="wins">
                        {ov.windows.map((w, k) => <TimeRange key={k} w={w} onChange={(nw) => setOv(sel, { windows: ov.windows!.map((x, j) => (j === k ? nw : x)) })} onDel={() => setOv(sel, { windows: ov.windows!.filter((_, j) => j !== k) })} />)}
                        <div className="row"><button type="button" className="lnk" onClick={() => setOv(sel, { windows: [...ov.windows!, { from: '14:00', to: '18:00' }] })}><Icon name="plus" size={14} />окно</button>
                          <button type="button" className="lnk" onClick={() => setOv(sel, { windows: [] })}>вернуть по умолчанию</button></div>
                      </div>
                    ) : <div className="hint">{di.wins?.map((w) => `${w.from}–${w.to}`).join(', ')} <button type="button" className="lnk" onClick={() => setOv(sel, { windows: di.wins!.map((w) => ({ ...w })) })}>изменить только на этот день</button></div>}
                    <div className="h2">Закрыть часть дня</div>
                    {(ov.blocks ?? []).map((b, k) => <div className="blockrow" key={k}><span>{b.from}–{b.to}{b.reason && <span className="hint"> · {b.reason}</span>}</span><button type="button" className="x" aria-label="Убрать" onClick={() => setOv(sel, { blocks: ov.blocks!.filter((_, j) => j !== k) })}><Icon name="close" size={16} /></button></div>)}
                    <div className="row"><TimeRange w={blk} onChange={setBlk} />
                      <button type="button" className="btn" onClick={() => blk.to > blk.from ? setOv(sel, { blocks: [...(ov.blocks ?? []), { ...blk, reason: 'Закрыто вручную' }] }) : setMsg('Время «до» должно быть позже «с»')}>Закрыть</button></div>
                    <div className="h2">Встречи дня</div>
                    {(meetingsBy.get(sel) ?? []).map((b) => <div className="meetrow" key={b.id}><i className="svcdot" style={{ background: svcColor(b.service) }} /><b>{hhmm(toLocal(b.starts_at).min)}</b><span>{serviceLabel(b.service)}</span><span className="hint">{b.name}</span><span className={`chip ${CHIP[b.status]}`}>{BOOKING_STATUS[b.status]}</span></div>)}
                    {!meetingsBy.get(sel)?.length && <div className="hint">Встреч пока нет.</div>}
                    <div className="h2">Свободное время</div>
                    <div className="slotsrow">
                      {di.slots.map((s) => s.free
                        ? <button type="button" key={s.t} className={`slotchip ${pick === s.t ? 'on' : ''}`} aria-pressed={pick === s.t} onClick={() => setPick(pick === s.t ? '' : s.t)}>{s.t}</button>
                        : <span key={s.t} className="slotchip off" title={s.why}>{s.t}</span>)}
                      {!di.slots.length && <span className="hint">Нет слотов</span>}
                    </div>
                    {pick ? (
                      <div className="bookform">
                        <div className="h2">Забронировать {pick} на {R.duration} мин</div>
                        <div className="fgrid">
                          <div className="fld"><label>Услуга</label><select value={nb.service} onChange={(e) => setNb({ ...nb, service: e.target.value })}>{SERVICE_KEYS.map((k) => <option key={k} value={k}>{SERVICE_LABEL[k]!.ru}</option>)}</select></div>
                          <div className="fld"><label>Формат</label><select value={nb.format} onChange={(e) => setNb({ ...nb, format: e.target.value as FormatKey })}>{FORMAT_KEYS.map((k) => <option key={k} value={k}>{FORMAT_LABEL[k].ru}</option>)}</select></div>
                          <div className="fld"><label>Имя клиента</label><input value={nb.name} onChange={(e) => setNb({ ...nb, name: e.target.value })} /></div>
                          <div className="fld"><label>Телефон</label><input type="tel" value={nb.phone} onChange={(e) => setNb({ ...nb, phone: e.target.value })} /></div>
                          <div className="fld"><label>Telegram</label><input value={nb.telegram} onChange={(e) => setNb({ ...nb, telegram: e.target.value })} placeholder="@ник" /></div>
                          <div className="fld"><label>Комментарий</label><input value={nb.comment} onChange={(e) => setNb({ ...nb, comment: e.target.value })} /></div>
                        </div>
                        <div className="row"><button type="button" className="btn primary" disabled={busy} onClick={book}>{busy ? 'Бронирую…' : 'Забронировать'}</button><button type="button" className="btn" onClick={() => setPick('')}>Отмена</button></div>
                      </div>
                    ) : <div className="hint">Нажмите на свободное время, чтобы забронировать встречу и выбрать услугу. Серые слоты заняты или закрыты: наведите, чтобы увидеть причину.</div>}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

// ───────────────────────── ссылка ─────────────────────────
function LinkTab({ meetDefault, onMeet }: { meetDefault: string; onMeet: (u: string) => void }) {
  const [service, setService] = useState<'' | ServiceKey>('')
  const [format, setFormat] = useState<'' | FormatKey>('')
  const [copied, setCopied] = useState('')
  const url = `https://st96.by/book${service || format ? `?${[service && `s=${service}`, format && `f=${format}`].filter(Boolean).join('&')}` : ''}`
  const copy = async (text: string) => { try { await navigator.clipboard.writeText(text); setCopied(text); setTimeout(() => setCopied(''), 1800) } catch { setCopied('') } }
  const [mu, setMu] = useState(meetDefault)
  const [mmsg, setMmsg] = useState('')
  useEffect(() => setMu(meetDefault), [meetDefault])
  const saveMeet = async () => {
    const r = await callApi<{ url: string }>('/api/booking-admin', { action: 'save_meet_default', url: mu })
    if (!r.ok) return setMmsg(r.error)
    onMeet(r.data.url); setMmsg(r.data.url ? 'Сохранено: теперь она прикрепляется ко всем видеозвонкам' : 'Ссылка убрана')
  }
  return (
    <>
    <div className="card">
      <h3>Ссылка на видеозвонок (Google Meet)</h3>
      <div className="hint">Одна постоянная комната: при подтверждении видеозвонка (в админке или кнопкой в Telegram) ссылка сама попадёт в сообщение клиенту, напоминание за час и файл календаря. Создайте комнату в Google Meet (кнопка «Новая встреча» → «Создать встречу на потом») и вставьте ссылку. Для отдельной встречи ссылку можно заменить в её карточке.</div>
      <div className="fld"><label>Ссылка</label><input type="url" value={mu} onChange={(e) => setMu(e.target.value)} placeholder="https://meet.google.com/abc-defg-hij" /></div>
      <div className="row"><button type="button" className="btn primary" onClick={saveMeet} disabled={mu.trim() === meetDefault}>Сохранить ссылку</button>{mmsg && <span className="hint" role="status">{mmsg}</span>}</div>
    </div>
    <div className="card">
      <h3>Ссылка на запись для клиентов</h3>
      <div className="hint">Страница отдельная, в брендовом стиле сайта, на русском и английском. Свободное время считается по вашему расписанию.</div>
      <div className="fld"><label>Услуга (необязательно, будет выбрана заранее)</label>
        <select value={service} onChange={(e) => setService(e.target.value as '' | ServiceKey)}><option value="">Клиент выберет сам</option>{SERVICE_KEYS.map((k) => <option key={k} value={k}>{SERVICE_LABEL[k].ru}</option>)}</select></div>
      <div className="fld"><label>Формат (необязательно)</label>
        <select value={format} onChange={(e) => setFormat(e.target.value as '' | FormatKey)}><option value="">Клиент выберет сам</option>{FORMAT_KEYS.map((k) => <option key={k} value={k}>{FORMAT_LABEL[k].ru}</option>)}</select></div>
      <div className="linkbox"><code>{url}</code><button type="button" className="btn primary" onClick={() => copy(url)}><Icon name={copied === url ? 'check' : 'external'} size={16} />{copied === url ? 'Скопировано' : 'Копировать'}</button></div>
      <a className="btn" href={url} target="_blank" rel="noreferrer"><Icon name="external" size={16} />Открыть как клиент</a>
      <div className="h2">Как использовать</div>
      <ul className="howlist">
        <li><b>В шаблонах, рассылках и воронках</b> вставляйте переменную <code>{'{запись}'}</code>: каждому клиенту подставится его личная ссылка, а заявка сама привяжется к его карточке.</li>
        <li><b>В воронке</b> блок «Запись на встречу» отправит клиенту кнопку выбора времени и дождётся вашего решения: «подтвердил» или «отклонил».</li>
        <li><b>Решение по заявке</b> можно принять здесь или кнопками в рабочей группе Telegram. Клиент получит сообщение и файл календаря, за час до встречи придёт напоминание.</li>
      </ul>
    </div>
    </>
  )
}

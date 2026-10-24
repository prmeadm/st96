import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { supabase } from '../supabase'
import { INTERESTS, SERVICES, SOURCES, STATUSES, WARNINGS, fmtDate, type Lead } from '../types'
import { Icon } from '../ui/Icon'
import { RowActions } from '../ui/RowActions'
import { ContactLinks } from '../ui/ContactLinks'
import { LeadEditor } from './LeadEditor'
import { FilterBar } from './FilterBar'
import { applyFilter, flattenJson, inferFields, parseConds, type Cond, type Flat, type KnownField } from '../../server/leads/filter'
import './leads.css'

type Row = Lead & {
  interest: string | null; lang: string | null; landing: string | null; utm: Record<string, unknown> | null; raw_text: string | null; updated_at: string
  clients: { id: string; name: string | null; tg_username: string | null; client_tags: { tags: { name: string } | null }[] } | null
}

// Поля фильтра, которые знаем заранее; остальное (utm.*) фильтр находит в данных сам
const KNOWN: Record<string, KnownField> = {
  status: { label: 'Статус', group: 'Заявка', options: STATUSES },
  source: { label: 'Источник', group: 'Заявка', options: SOURCES },
  service_key: { label: 'Услуга', group: 'Заявка', options: SERVICES },
  interests: { label: 'Интересы', group: 'Заявка', options: INTERESTS },
  created_at: { label: 'Создана', group: 'Заявка', kind: 'date' },
  updated_at: { label: 'Изменена', group: 'Заявка', kind: 'date' },
  name: { label: 'Имя', group: 'Контакты', kind: 'text' },
  phone: { label: 'Телефон', group: 'Контакты', kind: 'text' },
  telegram: { label: 'Telegram', group: 'Контакты', kind: 'text' },
  email: { label: 'Email', group: 'Контакты', kind: 'text' },
  company: { label: 'Компания', group: 'Контакты', kind: 'text' },
  title: { label: 'Заголовок', group: 'Заявка', kind: 'text' },
  topic: { label: 'Тема', group: 'Заявка', kind: 'text' },
  comment: { label: 'Комментарий', group: 'Заявка', kind: 'text' },
  interest: { label: 'Интерес', group: 'Заявка' },
  lang: { label: 'Язык', group: 'Заявка' },
  landing: { label: 'Страница входа', group: 'Заявка' },
  warnings: { label: 'Предупреждения разбора', group: 'Заявка', options: WARNINGS },
  'client.name': { label: 'Клиент', group: 'Клиент', kind: 'text' },
  'client.found': { label: 'Клиент определён', group: 'Клиент', kind: 'bool' },
  'client.tags': { label: 'Теги клиента', group: 'Клиент', kind: 'enum' },
}
const DEFAULTS = ['status', 'source', 'service_key', 'created_at', 'name', 'phone']

const flat = (l: Row): Flat => ({
  status: l.status, source: l.source, service_key: l.service_key, interests: l.interests ?? [], created_at: l.created_at, updated_at: l.updated_at,
  name: l.name, phone: l.phone, telegram: l.telegram, email: l.email, company: l.company, title: l.title, topic: l.topic, comment: l.comment,
  interest: l.interest, lang: l.lang, landing: l.landing, warnings: l.warnings, raw_text: l.raw_text,
  'client.name': l.clients ? [l.clients.name, l.clients.tg_username].filter(Boolean).join(' @') : null,
  'client.found': !!l.clients,
  'client.tags': (l.clients?.client_tags ?? []).map((t) => t.tags?.name).filter(Boolean) as string[],
  ...flattenJson('utm.', l.utm),
})

export default function LeadsPage() {
  const [rows, setRows] = useState<Row[] | null>(null)
  const [sp, setSp] = useSearchParams()
  const q = sp.get('q') ?? ''
  const conds = useMemo(() => parseConds(sp.get('f')), [sp])
  const [error, setError] = useState('')
  const [edit, setEdit] = useState<Lead | 'new' | null>(null)
  const [info, setInfo] = useState('')
  const [pickFor, setPickFor] = useState<string | null>(null) // у какой заявки открыт выбор интересов

  const load = () =>
    supabase.from('leads').select('*, clients(id, name, tg_username, client_tags(tags(name)))').order('created_at', { ascending: false }).limit(500)
      .then(({ data, error: e }) => (e ? setError('Не удалось загрузить заявки') : setRows((data ?? []) as unknown as Row[])))
  useEffect(() => { void load() }, [])

  const remove = async (l: Lead) => {
    if (!window.confirm('Удалить заявку? Клиент останется в базе.')) return
    const { error: e } = await supabase.from('leads').delete().eq('id', l.id)
    if (e) setError('Не удалось удалить заявку')
    else { setError(''); setRows((r) => r && r.filter((x) => x.id !== l.id)) }
  }

  const setLeadStatus = async (id: string, s: Lead['status']) => {
    const prev = rows
    setRows((r) => r && r.map((x) => (x.id === id ? { ...x, status: s } : x)))
    const { error: e } = await supabase.from('leads').update({ status: s }).eq('id', id)
    if (e) { setRows(prev); setError('Не удалось сменить статус') } else setError('')
  }
  const toggleInterest = async (l: Lead, k: Lead['interests'][number]) => {
    const prev = rows
    const cur = l.interests ?? []
    const next = (Object.keys(INTERESTS) as Lead['interests']).filter((x) => (x === k ? !cur.includes(k) : cur.includes(x)))
    setRows((r) => r && r.map((x) => (x.id === l.id ? { ...x, interests: next } : x)))
    const { error: e } = await supabase.from('leads').update({ interests: next }).eq('id', l.id)
    if (e) { setRows(prev); setError('Не удалось сохранить интересы') } else setError('')
  }

  const setFilter = (c: Cond[], text: string) => {
    const next = new URLSearchParams(sp)
    if (c.length) next.set('f', JSON.stringify(c)); else next.delete('f')
    if (text) next.set('q', text); else next.delete('q')
    setSp(next, { replace: true })
  }
  const flats = useMemo(() => (rows ?? []).map(flat), [rows])
  const fields = useMemo(() => inferFields(flats, KNOWN, { 'utm.': 'UTM-метки' }), [flats])
  const list = useMemo(() => applyFilter(rows ?? [], flat, conds, q, fields), [rows, conds, q, fields])
  // Быстрые вкладки статусов — то же условие «Статус», что и в окне фильтра
  const statusCond = conds.find((c) => c.field === 'status')
  const oneStatus = Array.isArray(statusCond?.value) && statusCond.value.length === 1 ? statusCond.value[0] : ''
  const pickStatus = (k: string) => setFilter([...conds.filter((c) => c.field !== 'status'), ...(k ? [{ field: 'status', value: [k] }] : [])], q)
  // Быстрый выбор интересов — условие «Интересы» (любой из выбранных), как группа для рассылки
  const intCond = conds.find((c) => c.field === 'interests')
  const intOn = Array.isArray(intCond?.value) ? intCond.value : []
  const pickInterest = (k: string) => {
    const v = k ? (intOn.includes(k) ? intOn.filter((x) => x !== k) : [...intOn, k]) : []
    setFilter([...conds.filter((c) => c.field !== 'interests'), ...(v.length ? [{ field: 'interests', value: v }] : [])], q)
  }
  const tone = (s: Lead['status']) => (s === 'won' ? 'green' : s === 'lost' || s === 'spam' ? 'red' : s === 'in_progress' ? 'amber' : 'blue')

  return (
    <div className="wrap">
      <h1 className="h1">Заявки <span className="chip">{rows ? list.length : '…'}{rows && list.length !== rows.length ? ` из ${rows.length}` : ''}</span><span className="sp" /><button type="button" className="btn primary" onClick={() => setEdit('new')}><Icon name="plus" size={18} />Добавить заявку</button></h1>
      {info && <div className="hint" role="status">{info}</div>}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <FilterBar page="leads" fields={fields} defaults={DEFAULTS} conds={conds} q={q} onChange={setFilter} placeholder="Поиск: имя, телефон, ник, комментарий" />
        <div className="chips">
          <button className={!statusCond ? 'on' : ''} onClick={() => pickStatus('')}>Все</button>
          {Object.entries(STATUSES).map(([k, v]) => <button key={k} className={oneStatus === k ? 'on' : ''} onClick={() => pickStatus(k)}>{v}</button>)}
        </div>
        <div className="chips" aria-label="Интересы">
          <button className={!intOn.length ? 'on' : ''} onClick={() => pickInterest('')}>Все интересы</button>
          {Object.entries(INTERESTS).map(([k, v]) => <button key={k} className={intOn.includes(k) ? 'on' : ''} aria-pressed={intOn.includes(k)} onClick={() => pickInterest(k)}>{v}</button>)}
        </div>
      </div>
      {error && <div className="err" role="alert">{error}</div>}
      {rows === null && !error && <div className="empty">Загрузка…</div>}
      {rows && list.length === 0 && <div className="empty">{rows.length ? 'Ничего не найдено' : 'Заявок нет'}</div>}
      {list.map((l) => (
        <div key={l.id} className="item">
          <div className="lead-top">
            <b>{SERVICES[l.service_key ?? ''] ?? l.title ?? 'Заявка'}{l.topic ? `: ${l.topic}` : ''}</b>
            <span className="chip">{SOURCES[l.source] ?? l.source}</span>
            <span className="sp" />
            <span className="hint">{fmtDate(l.created_at)}</span>
            <RowActions onEdit={() => setEdit(l)} onDelete={() => remove(l)} />
          </div>
          <div style={{ marginTop: 6 }}>
            {l.clients ? <Link to={`/clients/${l.clients.id}`}>{l.clients.name || (l.clients.tg_username ? `@${l.clients.tg_username}` : 'Клиент')}</Link> : <span className="muted">клиент не определён</span>}
            <span className="hint"> · <ContactLinks before={[l.company ?? '']} telegram={l.telegram} phone={l.phone} email={l.email} /></span>
          </div>
          {l.comment && <div className="note" style={{ marginTop: 8 }}>{l.comment}</div>}
          {l.warnings.length > 0 && <div className="chips" style={{ marginTop: 8 }}>{l.warnings.map((w) => <span key={w} className="chip amber">{WARNINGS[w] ?? w}</span>)}</div>}
          <div className="row" style={{ marginTop: 10 }}>
            <span className={`chip ${tone(l.status)}`}>{STATUSES[l.status]}</span>
            {(l.interests ?? []).map((k) => <span key={k} className="chip">{INTERESTS[k] ?? k}</span>)}
            <button type="button" className="btn" aria-expanded={pickFor === l.id} onClick={() => setPickFor(pickFor === l.id ? null : l.id)}>{l.interests?.length ? 'Интересы' : '+ Интерес'}</button>
            <span className="sp" />
            <select style={{ width: 'auto' }} value={l.status} onChange={(e) => setLeadStatus(l.id, e.target.value as Lead['status'])} aria-label="Статус заявки">
              {Object.entries(STATUSES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          {pickFor === l.id && (
            <div className="chips" style={{ marginTop: 8 }} aria-label="Интересы заявки">
              {(Object.entries(INTERESTS) as [Lead['interests'][number], string][]).map(([k, v]) => {
                const on = (l.interests ?? []).includes(k)
                return <button type="button" key={k} className={on ? 'on' : ''} aria-pressed={on} onClick={() => toggleInterest(l, k)}>{v}</button>
              })}
            </div>
          )}
        </div>
      ))}
      {edit && (
        <LeadEditor lead={edit === 'new' ? null : edit} onClose={() => setEdit(null)}
          onSaved={(r, edited) => {
            setEdit(null)
            setInfo(`${edited ? 'Заявка сохранена' : 'Заявка создана'}. ${r.clientId ? `${r.clientCreated ? 'Создан новый клиент' : 'Клиент найден'}, заявок у клиента: ${r.leadsOfClient}.` : 'Контактов нет, клиент не создан.'}`)
            void load()
          }} />
      )}
    </div>
  )
}

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabase'
import { SERVICES, SOURCES, STATUSES, WARNINGS, fmtDate, type Lead } from '../types'

type Row = Lead & { clients: { id: string; name: string | null; tg_username: string | null } | null }

export default function LeadsPage() {
  const [rows, setRows] = useState<Row[] | null>(null)
  const [status, setStatus] = useState('')
  const [source, setSource] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.from('leads').select('*, clients(id, name, tg_username)').order('created_at', { ascending: false }).limit(500)
      .then(({ data, error: e }) => (e ? setError('Не удалось загрузить заявки') : setRows((data ?? []) as unknown as Row[])))
  }, [])

  const setLeadStatus = async (id: string, s: Lead['status']) => {
    const prev = rows
    setRows((r) => r && r.map((x) => (x.id === id ? { ...x, status: s } : x)))
    const { error: e } = await supabase.from('leads').update({ status: s }).eq('id', id)
    if (e) { setRows(prev); setError('Не удалось сменить статус') } else setError('')
  }

  const list = (rows ?? []).filter((l) => (!status || l.status === status) && (!source || l.source === source))
  const tone = (s: Lead['status']) => (s === 'won' ? 'green' : s === 'lost' || s === 'spam' ? 'red' : s === 'in_progress' ? 'amber' : 'blue')

  return (
    <div className="wrap">
      <h1 className="h1">Заявки <span className="chip">{rows ? list.length : '…'}</span></h1>
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div className="chips">
          <button className={!status ? 'on' : ''} onClick={() => setStatus('')}>Все</button>
          {Object.entries(STATUSES).map(([k, v]) => <button key={k} className={status === k ? 'on' : ''} onClick={() => setStatus(k)}>{v}</button>)}
        </div>
        <div className="chips">
          <button className={!source ? 'on' : ''} onClick={() => setSource('')}>Все источники</button>
          {Object.entries(SOURCES).filter(([k]) => k !== 'bot' && k !== 'manual').map(([k, v]) => <button key={k} className={source === k ? 'on' : ''} onClick={() => setSource(k)}>{v}</button>)}
        </div>
      </div>
      {error && <div className="err" role="alert">{error}</div>}
      {rows === null && !error && <div className="empty">Загрузка…</div>}
      {rows && list.length === 0 && <div className="empty">Заявок нет</div>}
      {list.map((l) => (
        <div key={l.id} className="item">
          <div className="row">
            <b>{SERVICES[l.service_key ?? ''] ?? l.title ?? 'Заявка'}{l.topic ? `: ${l.topic}` : ''}</b>
            <span className="chip">{SOURCES[l.source] ?? l.source}</span>
            <span className="sp" />
            <span className="hint">{fmtDate(l.created_at)}</span>
          </div>
          <div style={{ marginTop: 6 }}>
            {l.clients ? <Link to={`/clients/${l.clients.id}`}>{l.clients.name || (l.clients.tg_username ? `@${l.clients.tg_username}` : 'Клиент')}</Link> : <span className="muted">клиент не определён</span>}
            <span className="hint"> · {[l.company, l.phone, l.telegram, l.email].filter(Boolean).join(' · ') || 'контактов нет'}</span>
          </div>
          {l.comment && <div className="note" style={{ marginTop: 8 }}>{l.comment}</div>}
          {l.warnings.length > 0 && <div className="chips" style={{ marginTop: 8 }}>{l.warnings.map((w) => <span key={w} className="chip amber">{WARNINGS[w] ?? w}</span>)}</div>}
          <div className="row" style={{ marginTop: 10 }}>
            <span className={`chip ${tone(l.status)}`}>{STATUSES[l.status]}</span>
            <span className="sp" />
            <select style={{ width: 'auto' }} value={l.status} onChange={(e) => setLeadStatus(l.id, e.target.value as Lead['status'])} aria-label="Статус заявки">
              {Object.entries(STATUSES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
        </div>
      ))}
    </div>
  )
}

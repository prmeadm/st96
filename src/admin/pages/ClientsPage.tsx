import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { supabase } from '../supabase'
import { SERVICES, clientTitle, fmtDate, type Client } from '../types'

type Row = Client & { leads: { service_key: string | null; company: string | null; created_at: string }[] }

const words = (s: string | null) => (s ?? '').split(',').map((x) => x.trim()).filter(Boolean)

export default function ClientsPage() {
  const [sp, setSp] = useSearchParams()
  const q = sp.get('q') ?? ''
  const svc = sp.get('svc') ?? ''
  const consent = sp.get('consent') ?? ''
  const anyW = sp.get('any') ?? ''
  const allW = sp.get('all') ?? ''
  const noneW = sp.get('none') ?? ''

  const [rows, setRows] = useState<Row[] | null>(null)
  const [error, setError] = useState('')
  const [ids, setIds] = useState<Set<string> | null>(null)
  const [open, setOpen] = useState(!!(anyW || allW || noneW))
  // Поля слов правим локально и переносим в адрес с задержкой
  const [draft, setDraft] = useState({ any: anyW, all: allW, none: noneW })

  const patch = (p: Record<string, string>) => {
    const next = new URLSearchParams(sp)
    for (const [k, v] of Object.entries(p)) v ? next.set(k, v) : next.delete(k)
    setSp(next, { replace: true })
  }

  useEffect(() => {
    supabase
      .from('clients')
      .select('*, leads(service_key, company, created_at)')
      .order('created_at', { ascending: false })
      .limit(1000)
      .then(({ data, error: e }) => (e ? setError('Не удалось загрузить клиентов') : setRows((data ?? []) as Row[])))
  }, [])

  useEffect(() => {
    const t = setTimeout(() => {
      if (draft.any !== anyW || draft.all !== allW || draft.none !== noneW) patch({ any: draft.any.trim(), all: draft.all.trim(), none: draft.none.trim() })
    }, 450)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft])

  useEffect(() => {
    const a = words(anyW), l = words(allW), n = words(noneW)
    if (!a.length && !l.length && !n.length) {
      setIds(null)
      return
    }
    let alive = true
    supabase.rpc('clients_by_note_words', { p_any: a, p_all: l, p_none: n }).then(({ data, error: e }) => {
      if (!alive) return
      if (e) setError('Не удалось применить фильтр по словам')
      else setIds(new Set((data ?? []) as string[]))
    })
    return () => { alive = false }
  }, [anyW, allW, noneW])

  const list = useMemo(() => {
    const t = q.trim().toLowerCase().replace(/^@/, '')
    return (rows ?? []).filter((c) => {
      if (ids && !ids.has(c.id)) return false
      if (svc && !c.leads.some((l) => l.service_key === svc)) return false
      if (consent === 'yes' && !(c.consent_at && !c.opted_out_at)) return false
      if (consent === 'no' && c.consent_at && !c.opted_out_at) return false
      if (!t) return true
      return [c.name, c.tg_username, c.phone, c.email, c.company, ...c.leads.map((l) => l.company)].some((v) => v?.toLowerCase().includes(t))
    })
  }, [rows, ids, q, svc, consent])

  const hl = [...words(anyW), ...words(allW)].join(',')
  const filtersOn = !!(anyW || allW || noneW)
  const reset = () => { setDraft({ any: '', all: '', none: '' }); setSp(new URLSearchParams(), { replace: true }) }

  return (
    <div className="wrap">
      <h1 className="h1">Клиенты <span className="chip">{rows ? list.length : '…'}{rows && list.length !== rows.length ? ` из ${rows.length}` : ''}</span></h1>
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <input type="search" placeholder="Поиск: имя, @ник, телефон, компания" value={q} onChange={(e) => patch({ q: e.target.value })} aria-label="Поиск клиентов" />
        <div className="row">
          <select value={svc} onChange={(e) => patch({ svc: e.target.value })} aria-label="Услуга" style={{ flex: 1, minWidth: 150 }}>
            <option value="">Любая услуга</option>
            {Object.entries(SERVICES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select value={consent} onChange={(e) => patch({ consent: e.target.value })} aria-label="Рассылки" style={{ flex: 1, minWidth: 150 }}>
            <option value="">Рассылки: любые</option>
            <option value="yes">Согласны на рассылки</option>
            <option value="no">Нет согласия или отписаны</option>
          </select>
          <button className={`btn${filtersOn ? ' primary' : ''}`} onClick={() => setOpen(!open)}>Слова в заметках{filtersOn && <i className="dot" aria-label="фильтр включён" />}</button>
        </div>
        {open && (
          <div className="grid3">
            <div className="fld"><label>Содержит любое из</label><input value={draft.any} onChange={(e) => setDraft({ ...draft, any: e.target.value })} placeholder="дорого, подумает" /></div>
            <div className="fld"><label>Содержит все</label><input value={draft.all} onChange={(e) => setDraft({ ...draft, all: e.target.value })} placeholder="франшиза, печать" /></div>
            <div className="fld"><label>Не содержит</label><input value={draft.none} onChange={(e) => setDraft({ ...draft, none: e.target.value })} placeholder="не интересно" /></div>
            <div className="hint" style={{ gridColumn: '1 / -1' }}>Слова через запятую. Ищется часть слова без учёта регистра, «дорог» найдёт «дорого» и «дорогой». «Не содержит»: ни в одной заметке клиента нет этих слов.</div>
          </div>
        )}
        {(filtersOn || q || svc || consent) && <div><button className="btn" onClick={reset}>Сбросить фильтры</button></div>}
      </div>
      {error && <div className="err" role="alert">{error}</div>}
      {rows === null && !error && <div className="empty">Загрузка…</div>}
      {rows && list.length === 0 && <div className="empty">Никого не найдено</div>}
      {list.map((c) => {
        const svcs = [...new Set(c.leads.map((l) => l.service_key).filter(Boolean))] as string[]
        return (
          <Link key={c.id} className="item" to={`/clients/${c.id}${hl ? `?hl=${encodeURIComponent(hl)}` : ''}`}>
            <div className="row">
              <b>{clientTitle(c)}</b>
              {c.tg_username && c.name && <span className="muted">@{c.tg_username}</span>}
              <span className="sp" />
              <span className="hint">{fmtDate(c.last_seen_at ?? c.created_at)}</span>
            </div>
            <div className="hint" style={{ marginTop: 4 }}>{[c.company, c.phone].filter(Boolean).join(' · ') || '—'}</div>
            <div className="chips" style={{ marginTop: 8 }}>
              {svcs.map((s) => <span key={s} className="chip blue">{SERVICES[s] ?? s}</span>)}
              {c.consent_at && !c.opted_out_at && <span className="chip green">рассылки: да</span>}
              {c.opted_out_at && <span className="chip red">отписан</span>}
              {c.tg_user_id && <span className="chip">пишет боту</span>}
              <span className="chip">{c.language.toUpperCase()}</span>
            </div>
          </Link>
        )
      })}
    </div>
  )
}

import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../supabase'
import { deleteClient } from '../clientDelete'
import { SERVICES, SOURCES, STATUSES, clientTitle, fmtDate, type Client, type Lead } from '../types'
import { RowActions } from '../ui/RowActions'
import { FilterBar } from './FilterBar'
import { applyFilter, flattenJson, inferFields, parseConds, type Cond, type Flat, type KnownField } from '../../server/leads/filter'
import './leads.css'

type Row = Client & {
  vars: Record<string, unknown> | null; dialog_closed_at: string | null
  leads: { service_key: string | null; source: string; status: Lead['status']; company: string | null; created_at: string }[]
  client_tags: { tags: { name: string } | null }[]
}

// Поля фильтра, которые знаем заранее; vars.* и ответы воронок (ans.*) фильтр находит в данных сам
const KNOWN: Record<string, KnownField> = {
  name: { label: 'Имя', group: 'Клиент', kind: 'text' },
  tg_username: { label: 'Ник в Telegram', group: 'Клиент', kind: 'text' },
  phone: { label: 'Телефон', group: 'Клиент', kind: 'text' },
  email: { label: 'Email', group: 'Клиент', kind: 'text' },
  company: { label: 'Компания', group: 'Клиент', kind: 'text' },
  language: { label: 'Язык', group: 'Клиент', options: { ru: 'Русский', en: 'English' } },
  source: { label: 'Откуда пришёл', group: 'Клиент' },
  tags: { label: 'Теги', group: 'Клиент', kind: 'enum' },
  consent: { label: 'Согласен на рассылки', group: 'Клиент', kind: 'bool' },
  opted_out: { label: 'Отписан от рассылок', group: 'Клиент', kind: 'bool' },
  bot: { label: 'Пишет боту', group: 'Клиент', kind: 'bool' },
  created_at: { label: 'Добавлен', group: 'Клиент', kind: 'date' },
  last_seen_at: { label: 'Последняя активность', group: 'Клиент', kind: 'date' },
  dialog_closed_at: { label: 'Диалог закрыт', group: 'Клиент', kind: 'date' },
  'lead.service': { label: 'Услуга в заявках', group: 'Заявки клиента', options: SERVICES },
  'lead.source': { label: 'Источник заявок', group: 'Заявки клиента', options: SOURCES },
  'lead.status': { label: 'Статус заявок', group: 'Заявки клиента', options: STATUSES },
  'lead.count': { label: 'Число заявок', group: 'Заявки клиента', kind: 'number' },
  'lead.last': { label: 'Последняя заявка', group: 'Заявки клиента', kind: 'date' },
  'lead.company': { label: 'Компания в заявках', group: 'Заявки клиента', kind: 'text' },
}
const DEFAULTS = ['tags', 'lead.service', 'consent', 'created_at', 'name', 'phone']
const uniq = <T,>(a: (T | null)[]) => [...new Set(a.filter((x): x is T => x !== null && x !== ''))]

const flatOf = (answers: Map<string, Flat>) => (c: Row): Flat => ({
  name: c.name, tg_username: c.tg_username, phone: c.phone, email: c.email, company: c.company, language: c.language, source: c.source,
  tags: uniq(c.client_tags.map((t) => t.tags?.name ?? null)),
  consent: !!(c.consent_at && !c.opted_out_at), opted_out: !!c.opted_out_at, bot: !!c.tg_user_id,
  created_at: c.created_at, last_seen_at: c.last_seen_at, dialog_closed_at: c.dialog_closed_at,
  'lead.service': uniq(c.leads.map((l) => l.service_key)), 'lead.source': uniq(c.leads.map((l) => l.source)), 'lead.status': uniq(c.leads.map((l) => l.status)),
  'lead.count': c.leads.length, 'lead.last': c.leads.map((l) => l.created_at).sort().at(-1) ?? null, 'lead.company': uniq(c.leads.map((l) => l.company)),
  ...flattenJson('vars.', c.vars),
  ...answers.get(c.id),
})

const words = (s: string | null) => (s ?? '').split(',').map((x) => x.trim()).filter(Boolean)

export default function ClientsPage() {
  const [sp, setSp] = useSearchParams()
  const nav = useNavigate()
  const q = sp.get('q') ?? ''
  const conds = useMemo(() => parseConds(sp.get('f')), [sp])
  const anyW = sp.get('any') ?? ''
  const allW = sp.get('all') ?? ''
  const noneW = sp.get('none') ?? ''

  const [rows, setRows] = useState<Row[] | null>(null)
  // Ответы из воронок («Сохранить в переменную») по клиенту: последний ответ на ключ побеждает
  const [answers, setAnswers] = useState<Map<string, Flat>>(new Map())
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
      .select('*, leads(service_key, source, status, company, created_at), client_tags(tags(name))')
      .order('created_at', { ascending: false })
      .limit(1000)
      .then(({ data, error: e }) => (e ? setError('Не удалось загрузить клиентов') : setRows((data ?? []) as unknown as Row[])))
    supabase.from('funnel_runs').select('client_id, vars').order('created_at').limit(5000).then(({ data }) => {
      const m = new Map<string, Flat>()
      for (const r of (data ?? []) as { client_id: string; vars: unknown }[]) m.set(r.client_id, flattenJson('ans.', r.vars, m.get(r.client_id) ?? {}))
      setAnswers(m)
    })
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

  const flat = useMemo(() => flatOf(answers), [answers])
  const fields = useMemo(() => inferFields((rows ?? []).map(flat), KNOWN, { 'vars.': 'Доп. поля клиента', 'ans.': 'Ответы в воронках' }), [rows, flat])
  const list = useMemo(() => applyFilter((rows ?? []).filter((c) => !ids || ids.has(c.id)), flat, conds, q, fields), [rows, ids, flat, conds, q, fields])
  const setFilter = (c: Cond[], text: string) => patch({ f: c.length ? JSON.stringify(c) : '', q: text })

  const hl = [...words(anyW), ...words(allW)].join(',')
  const filtersOn = !!(anyW || allW || noneW)
  const reset = () => { setDraft({ any: '', all: '', none: '' }); patch({ any: '', all: '', none: '' }) }

  return (
    <div className="wrap">
      <h1 className="h1">Клиенты <span className="chip">{rows ? list.length : '…'}{rows && list.length !== rows.length ? ` из ${rows.length}` : ''}</span></h1>
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <FilterBar page="clients" fields={fields} defaults={DEFAULTS} conds={conds} q={q} onChange={setFilter} placeholder="Поиск: имя, @ник, телефон, компания" />
        <div className="row">
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
        {filtersOn && <div><button className="btn" onClick={reset}>Сбросить слова</button></div>}
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
              <RowActions onEdit={() => nav(`/clients/${c.id}`)} onDelete={async () => {
                const r = await deleteClient(c)
                if (r === 'deleted') { setError(''); setRows((x) => x && x.filter((y) => y.id !== c.id)) } else if (r === 'error') setError('Не удалось удалить клиента')
              }} />
            </div>
            <div className="hint" style={{ marginTop: 4 }}>{[c.company, c.phone].filter(Boolean).join(' · ') || '—'}</div>
            <div className="chips" style={{ marginTop: 8 }}>
              {svcs.filter((s) => SERVICES[s]).map((s) => <span key={s} className="chip blue">{SERVICES[s]}</span>)}
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

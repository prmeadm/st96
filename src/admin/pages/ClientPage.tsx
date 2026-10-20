import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useAuth } from '../auth'
import { Highlight } from '../highlight'
import { GROUP_LINK_ID, supabase } from '../supabase'
import { deleteClient } from '../clientDelete'
import { BackLink } from '../ui/BackLink'
import { Icon } from '../ui/Icon'
import { TPL_KINDS, fillTemplate, type TemplateRow } from '../../../server/templates'
import { SERVICES, SOURCES, STATUSES, WARNINGS, clientTitle, fmtDate, type Client, type Lead, type Msg, type Note } from '../types'

function SendTemplate({ client, onSent }: { client: Client; onSent: () => void }) {
  const [open, setOpen] = useState(false)
  const [rows, setRows] = useState<TemplateRow[] | null>(null)
  const [pick, setPick] = useState<TemplateRow | null>(null)
  const [q, setQ] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  const toggle = () => {
    setOpen(!open)
    setPick(null)
    if (!open && !rows) supabase.from('templates').select('*').order('fav', { ascending: false }).order('used', { ascending: false })
      .then(({ data, error: e }) => (e ? setMsg('Не удалось загрузить шаблоны') : setRows((data ?? []) as TemplateRow[])))
  }
  const send = async () => {
    if (!pick) return
    setBusy(true)
    setMsg('')
    const { data: s } = await supabase.auth.getSession()
    const r = await fetch('/api/send-template', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${s.session?.access_token ?? ''}` },
      body: JSON.stringify({ clientId: client.id, templateId: pick.id }),
    }).catch(() => null)
    setBusy(false)
    if (r?.ok) { setMsg(`Отправлено: ${pick.title}`); setPick(null); setOpen(false); onSent() }
    else setMsg(`Не отправлено: ${((await r?.json().catch(() => null)) as { error?: string } | null)?.error ?? 'нет связи с сервером'}`)
  }
  const list = (rows ?? []).filter((t) => !q.trim() || `${t.title} ${t.body}`.toLowerCase().includes(q.trim().toLowerCase()))
  const raw = pick ? (client.language === 'en' && pick.body_en ? pick.body_en : pick.body) : ''

  return (
    <div className="card">
      <div className="row"><h3 style={{ margin: 0 }}>Отправить шаблон</h3><span className="sp" />
        <button className="btn" onClick={toggle} disabled={!client.tg_user_id} title={client.tg_user_id ? '' : 'Клиент ещё не писал боту'}>{open ? 'Закрыть' : 'Выбрать шаблон'}</button></div>
      {!client.tg_user_id && <div className="hint" style={{ marginTop: 6 }}>Клиент ещё не писал боту, отправить некуда.</div>}
      {msg && <div className="hint" role="status" style={{ marginTop: 6 }}>{msg}</div>}
      {open && !pick && (
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Поиск шаблонов" />
          {rows === null && <div className="hint">Загрузка…</div>}
          {rows && list.length === 0 && <div className="hint">Шаблонов нет. Создайте их в разделе «Шаблоны».</div>}
          <div style={{ maxHeight: 280, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {list.map((t) => (
              <button key={t.id} className="btn" style={{ justifyContent: 'flex-start', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left' }} onClick={() => setPick(t)}>
                <b>{t.fav && <Icon name="star" size={14} fill />} {t.title} <span className="hint">· {TPL_KINDS[t.kind]}</span></b>
                <span className="hint" style={{ whiteSpace: 'normal' }}>{t.body.slice(0, 90)}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      {open && pick && (
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div className="hint">Клиент получит ({TPL_KINDS[pick.kind]}):</div>
          <div className="note">{fillTemplate(raw, client) || '…'}</div>
          <div className="row"><button className="btn primary" disabled={busy} onClick={send}>{busy ? 'Отправляю…' : 'Отправить клиенту'}</button><button className="btn" onClick={() => setPick(null)}>Назад</button></div>
        </div>
      )}
    </div>
  )
}

export default function ClientPage() {
  const { id } = useParams()
  const nav = useNavigate()
  const [sp] = useSearchParams()
  const { email } = useAuth()
  const words = (sp.get('hl') ?? '').split(',').filter(Boolean)

  const [client, setClient] = useState<Client | null>(null)
  const [leads, setLeads] = useState<Lead[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: '', phone: '', email: '', company: '' })
  const [saved, setSaved] = useState('')
  const [noteText, setNoteText] = useState('')

  const load = useCallback(async () => {
    if (!id) return
    const [c, l, n, m] = await Promise.all([
      supabase.from('clients').select('*').eq('id', id).maybeSingle(),
      supabase.from('leads').select('*').eq('client_id', id).order('created_at', { ascending: false }),
      supabase.from('client_notes').select('*').eq('client_id', id).order('created_at', { ascending: false }),
      supabase.from('messages').select('id, direction, kind, text, created_at').eq('client_id', id).order('created_at', { ascending: true }).limit(300),
    ])
    if (c.error || !c.data) return setError('Клиент не найден')
    const cl = c.data as Client
    setClient(cl)
    setForm({ name: cl.name ?? '', phone: cl.phone ?? '', email: cl.email ?? '', company: cl.company ?? '' })
    setLeads((l.data ?? []) as Lead[])
    setNotes((n.data ?? []) as Note[])
    setMsgs((m.data ?? []) as Msg[])
  }, [id])

  useEffect(() => { load() }, [load])

  const save = async (e: FormEvent) => {
    e.preventDefault()
    if (!client) return
    setSaved('')
    const patch = { name: form.name.trim() || null, phone: form.phone.trim() || null, email: form.email.trim() || null, company: form.company.trim() || null }
    const { error: err } = await supabase.from('clients').update(patch).eq('id', client.id)
    if (err) setSaved(err.code === '23505' ? 'Такой телефон уже есть у другого клиента' : 'Не удалось сохранить')
    else { setSaved('Сохранено'); setClient({ ...client, ...patch }) }
  }

  const addNote = async (e: FormEvent) => {
    e.preventDefault()
    if (!client || !noteText.trim()) return
    const { error: err } = await supabase.from('lead_notes').insert({ client_id: client.id, text: noteText.trim(), source: 'admin', author_name: email })
    if (err) return setError('Не удалось сохранить заметку')
    setNoteText('')
    setError('')
    load()
  }

  const setLeadStatus = async (lid: string, status: Lead['status']) => {
    await supabase.from('leads').update({ status }).eq('id', lid)
    setLeads((ls) => ls.map((x) => (x.id === lid ? { ...x, status } : x)))
  }

  if (error && !client) return <div className="wrap"><BackLink to="/clients">Клиенты</BackLink><div className="err">{error}</div></div>
  if (!client) return <div className="empty">Загрузка…</div>

  const topicUrl = client.admin_topic_id && GROUP_LINK_ID ? `https://t.me/c/${GROUP_LINK_ID}/${client.admin_topic_id}` : ''
  const tg = client.tg_username ? `https://t.me/${client.tg_username}` : ''

  return (
    <div className="wrap">
      <BackLink to="/clients">Клиенты</BackLink>
      <h1 className="h1">{clientTitle(client)}
        {client.consent_at && !client.opted_out_at && <span className="chip green">рассылки: да</span>}
        {client.opted_out_at && <span className="chip red">отписан</span>}
        {client.tg_user_id && <span className="chip">пишет боту</span>}
        <span className="sp" />
        <button type="button" className="ibtn danger" title="Удалить клиента" aria-label="Удалить клиента" onClick={async () => {
          const r = await deleteClient(client)
          if (r === 'deleted') nav('/clients'); else if (r === 'error') setError('Не удалось удалить клиента')
        }}><Icon name="trash" size={20} /></button>
      </h1>
      <div className="row hint">
        {tg && <a href={tg} target="_blank" rel="noreferrer">@{client.tg_username}</a>}
        {topicUrl && <a href={topicUrl} target="_blank" rel="noreferrer">Тема диалога в Telegram</a>}
        <span>Источник: {client.source ?? '—'} · язык {client.language.toUpperCase()} · создан {fmtDate(client.created_at)}</span>
      </div>
      {error && <div className="err" role="alert">{error}</div>}

      <form className="card" onSubmit={save}>
        <h3>Контакты</h3>
        <div className="grid2">
          <div className="fld"><label>Имя</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div className="fld"><label>Компания</label><input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} /></div>
          <div className="fld"><label>Телефон</label><input inputMode="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+375291234567" /></div>
          <div className="fld"><label>Почта</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
        </div>
        <div className="row" style={{ marginTop: 10 }}><button className="btn primary">Сохранить</button>{saved && <span className="hint" role="status">{saved}</span>}</div>
      </form>

      <SendTemplate client={client} onSent={load} />

      <div className="card">
        <h3>Заметки ({notes.length})</h3>
        <form onSubmit={addNote} className="row" style={{ alignItems: 'stretch' }}>
          <textarea style={{ flex: 1, minHeight: 60 }} value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Что обсуждали, что пообещали" />
          <button className="btn primary" disabled={!noteText.trim()}>Добавить</button>
        </form>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
          {notes.length === 0 && <div className="hint">Заметок пока нет.</div>}
          {notes.map((n) => (
            <div key={n.id}>
              <div className="hint">{fmtDate(n.created_at)} · {n.author_name ?? (n.source === 'form_comment' ? 'из формы' : '—')}</div>
              <div className="note"><Highlight text={n.text} words={words} /></div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h3>Заявки ({leads.length})</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {leads.length === 0 && <div className="hint">Заявок нет.</div>}
          {leads.map((l) => (
            <div key={l.id} className="item" style={{ boxShadow: 'none' }}>
              <div className="row"><b>{SERVICES[l.service_key ?? ''] ?? 'Заявка'}</b><span className="chip">{SOURCES[l.source] ?? l.source}</span><span className="sp" /><span className="hint">{fmtDate(l.created_at)}</span></div>
              {l.company && <div className="hint">{l.company}</div>}
              {l.comment && <div className="note" style={{ marginTop: 6 }}><Highlight text={l.comment} words={words} /></div>}
              {l.warnings.length > 0 && <div className="chips" style={{ marginTop: 6 }}>{l.warnings.map((w) => <span key={w} className="chip amber">{WARNINGS[w] ?? w}</span>)}</div>}
              <div style={{ marginTop: 8 }}>
                <select value={l.status} onChange={(e) => setLeadStatus(l.id, e.target.value as Lead['status'])} aria-label="Статус заявки">
                  {Object.entries(STATUSES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h3>Переписка с ботом ({msgs.length})</h3>
        {msgs.length === 0 ? <div className="hint">Клиент ещё не писал боту.</div> : (
          <div className="chat">
            {msgs.map((m) => (
              <div key={m.id} className={`msg ${m.direction === 'in' ? '' : 'admin'}`}>
                <div className="hint">{m.direction === 'in' ? 'Клиент' : 'Студия'} · {fmtDate(m.created_at)}</div>
                {m.text ?? `[${m.kind}]`}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

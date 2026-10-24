import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { clientTitle, fmtDate, type Client, type Note } from '../types'

type Found = Pick<Client, 'id' | 'name' | 'tg_username' | 'phone' | 'email'>

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[] | null>(null)
  const [error, setError] = useState('')

  const load = () =>
    supabase.from('lead_notes').select('*').is('lead_id', null).is('client_id', null).order('created_at', { ascending: false }).limit(200)
      .then(({ data, error: e }) => (e ? setError('Не удалось загрузить заметки') : setNotes((data ?? []) as Note[])))
  useEffect(() => { load() }, [])

  return (
    <div className="wrap">
      <h1 className="h1">Не привязано <span className="chip">{notes ? notes.length : '…'}</span></h1>
      <div className="hint">Заметки сотрудников из группы, которые бот не смог связать с заявкой. Найдите клиента и привяжите заметку.</div>
      {error && <div className="err" role="alert">{error}</div>}
      {notes === null && !error && <div className="empty">Загрузка…</div>}
      {notes && notes.length === 0 && <div className="empty">Всё привязано</div>}
      {notes?.map((n) => <Unassigned key={n.id} note={n} onDone={load} />)}
    </div>
  )
}

function Unassigned({ note, onDone }: { note: Note; onDone: () => void }) {
  const [q, setQ] = useState('')
  const [found, setFound] = useState<Found[]>([])
  const [err, setErr] = useState('')

  useEffect(() => {
    const t = q.trim().replace(/^@/, '').replace(/[%,()]/g, '')
    if (t.length < 2) { setFound([]); return }
    const timer = setTimeout(() => {
      supabase.from('clients').select('id, name, tg_username, phone, email')
        .or(`name.ilike.%${t}%,tg_username.ilike.%${t}%,phone.ilike.%${t}%,company.ilike.%${t}%`).limit(6)
        .then(({ data }) => setFound((data ?? []) as Found[]))
    }, 300)
    return () => clearTimeout(timer)
  }, [q])

  const attach = async (clientId: string) => {
    const { error } = await supabase.from('lead_notes').update({ client_id: clientId }).eq('id', note.id)
    if (error) setErr('Не удалось привязать')
    else onDone()
  }

  return (
    <div className="item">
      <div className="hint">{fmtDate(note.created_at)} · {note.author_name ?? '—'}</div>
      <div className="note" style={{ margin: '6px 0 10px' }}>{note.text}</div>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Найти клиента: имя, @ник, телефон" aria-label="Поиск клиента" />
      {err && <div className="err">{err}</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
        {found.map((c) => (
          <div className="row" key={c.id}>
            <span>{clientTitle(c)} <span className="hint">{c.phone ?? ''}</span></span>
            <span className="sp" />
            <button className="btn" onClick={() => attach(c.id)}>Привязать</button>
          </div>
        ))}
      </div>
    </div>
  )
}

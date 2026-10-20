import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { blankGraph, demoGraph } from '../../../server/funnels/demo'
import { supabase } from '../supabase'
import { fmtDate } from '../types'

type Row = { id: string; name: string; status: 'draft' | 'published' | 'archived'; updated_at: string; graph: { nodes?: unknown[] } }
export const FUNNEL_STATUS = { draft: 'Черновик', published: 'Опубликована', archived: 'В архиве' } as const

export default function FunnelsPage() {
  const [rows, setRows] = useState<Row[] | null>(null)
  const [error, setError] = useState('')
  const nav = useNavigate()

  useEffect(() => {
    supabase.from('funnels').select('id, name, status, updated_at, graph').order('updated_at', { ascending: false })
      .then(({ data, error: e }) => (e ? setError('Не удалось загрузить воронки') : setRows((data ?? []) as Row[])))
  }, [])

  const create = async (name: string, graph: typeof blankGraph) => {
    const { data, error: e } = await supabase.from('funnels').insert({ name, graph, status: 'draft' }).select('id').single()
    if (e || !data) return setError('Не удалось создать воронку')
    nav(`/funnels/${data.id}`)
  }

  return (
    <div className="wrap">
      <h1 className="h1">Воронки <span className="chip">{rows?.length ?? '…'}</span><span className="sp" /><button className="btn" onClick={() => create('Пример: запись на консультацию', demoGraph)}>Взять пример</button><button className="btn primary" onClick={() => create('Новая воронка', blankGraph)}>+ Добавить воронку</button></h1>
      <div className="hint">Воронка ведёт клиента в Telegram-боте: сообщения с кнопками, условия, действия, паузы и передача человеку. Опубликованная воронка начинает работать сразу. Схема собирается из блоков в конструкторе; точная правка доступна на вкладке «JSON».</div>
      {error && <div className="err" role="alert">{error}</div>}
      {rows === null && !error && <div className="empty">Загрузка…</div>}
      {rows?.length === 0 && <div className="empty">Воронок пока нет. Нажмите «+ Добавить воронку» или «Взять пример».</div>}
      {rows?.map((f) => (
        <Link key={f.id} className="item" to={`/funnels/${f.id}`}>
          <div className="row"><b>{f.name}</b><span className={`chip ${f.status === 'published' ? 'green' : ''}`}>{FUNNEL_STATUS[f.status]}</span><span className="sp" /><span className="hint">{fmtDate(f.updated_at)}</span></div>
          <div className="hint" style={{ marginTop: 4 }}>Блоков: {f.graph?.nodes?.length ?? 0}</div>
        </Link>
      ))}
    </div>
  )
}

import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { fmtDate } from '../types'
import { RowActions } from '../ui/RowActions'
import { BROADCAST_STATUS, type BroadcastRow } from '../../../server/broadcasts'

export const STATUS_CHIP: Record<BroadcastRow['status'], string> = { draft: '', scheduled: 'amber', sending: 'blue', done: 'green', canceled: 'red' }

export default function BroadcastsPage() {
  const [rows, setRows] = useState<BroadcastRow[] | null>(null)
  const [error, setError] = useState('')
  const nav = useNavigate()

  useEffect(() => {
    supabase.from('broadcasts').select('*').order('created_at', { ascending: false })
      .then(({ data, error: e }) => (e ? setError('Не удалось загрузить рассылки') : setRows((data ?? []) as BroadcastRow[])))
  }, [])

  const remove = async (b: BroadcastRow) => {
    if (!confirm(`Удалить рассылку «${b.title}»?`)) return
    const { error: e } = await supabase.from('broadcasts').delete().eq('id', b.id)
    if (e) return setError('Не удалось удалить рассылку')
    setRows((r) => r && r.filter((x) => x.id !== b.id))
  }

  const create = async () => {
    const { data, error: e } = await supabase.from('broadcasts').insert({ title: 'Новая рассылка' }).select('id').single()
    if (e || !data) return setError('Не удалось создать рассылку')
    nav(`/broadcasts/${data.id}`)
  }

  return (
    <div className="wrap">
      <h1 className="h1">Рассылки <span className="chip">{rows?.length ?? '…'}</span><span className="sp" /><button className="btn primary" onClick={create}>+ Новая рассылка</button></h1>
      <div className="hint">Сообщение сразу многим клиентам в Telegram. Получают только те, кто дал согласие на рассылки и не отписался. В конце каждого сообщения автоматически добавляется «Отписаться: /stop».</div>
      {error && <div className="err" role="alert">{error}</div>}
      {rows === null && !error && <div className="empty">Загрузка…</div>}
      {rows?.length === 0 && <div className="empty">Рассылок пока нет. Нажмите «+ Новая рассылка».</div>}
      {rows?.map((b) => (
        <div key={b.id} className="irow">
          <Link className="item-main" to={`/broadcasts/${b.id}`}>
            <div className="row"><b>{b.title}</b><span className={`chip ${STATUS_CHIP[b.status]}`}>{BROADCAST_STATUS[b.status]}</span><span className="sp" /><span className="hint">{fmtDate(b.created_at)}</span></div>
            <div className="hint">
              {b.status === 'draft' ? 'Не запущена' : `Отправлено ${b.sent} из ${b.total}${b.failed ? `, не доставлено ${b.failed}` : ''}`}
              {b.scheduled_at && b.status === 'scheduled' ? ` · на ${fmtDate(b.scheduled_at)}` : ''}
            </div>
          </Link>
          <RowActions editTo={`/broadcasts/${b.id}`} onDelete={() => remove(b)} deleteDisabled={b.status === 'scheduled' || b.status === 'sending'} deleteTitle={b.status === 'scheduled' || b.status === 'sending' ? 'Сначала остановите рассылку' : 'Удалить'} />
        </div>
      ))}
    </div>
  )
}

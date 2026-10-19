import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { validateGraph } from '../../../server/funnels/validate'
import { supabase } from '../supabase'
import { FUNNEL_STATUS } from './FunnelsPage'

type Funnel = { id: string; name: string; status: keyof typeof FUNNEL_STATUS; graph: unknown; version: number }
type Stat = { node: string; enter: number; click: number }

export default function FunnelPage() {
  const { id } = useParams()
  const nav = useNavigate()
  const [f, setF] = useState<Funnel | null>(null)
  const [name, setName] = useState('')
  const [status, setStatus] = useState<Funnel['status']>('draft')
  const [json, setJson] = useState('')
  const [msg, setMsg] = useState('')
  const [stats, setStats] = useState<Stat[]>([])

  useEffect(() => {
    if (!id) return
    supabase.from('funnels').select('id, name, status, graph, version').eq('id', id).maybeSingle().then(({ data }) => {
      if (!data) return setMsg('Воронка не найдена')
      const row = data as Funnel
      setF(row); setName(row.name); setStatus(row.status); setJson(JSON.stringify(row.graph, null, 2))
    })
    supabase.from('run_events').select('node_id, event').eq('funnel_id', id).in('event', ['enter', 'click']).limit(20000).then(({ data }) => {
      const m = new Map<string, Stat>()
      for (const e of (data ?? []) as { node_id: string; event: string }[]) {
        const s = m.get(e.node_id) ?? { node: e.node_id, enter: 0, click: 0 }
        if (e.event === 'enter') s.enter++
        else s.click++
        m.set(e.node_id, s)
      }
      setStats([...m.values()])
    })
  }, [id])

  const parsed = useMemo(() => {
    try { return { graph: JSON.parse(json) as unknown, error: '' } } catch (e) { return { graph: null, error: e instanceof Error ? e.message : 'Ошибка JSON' } }
  }, [json])
  const check = useMemo(() => (parsed.graph ? validateGraph(parsed.graph) : { errors: [], warnings: [] }), [parsed])
  const invalid = !!parsed.error || check.errors.length > 0

  const save = async (nextStatus: Funnel['status']) => {
    if (!f || !parsed.graph) return
    if (nextStatus === 'published' && invalid) return setMsg('Опубликовать нельзя: исправьте ошибки схемы')
    setMsg('')
    const { error } = await supabase.from('funnels').update({ name: name.trim() || f.name, graph: parsed.graph, status: nextStatus, version: f.version + 1 }).eq('id', f.id)
    if (error) return setMsg('Не удалось сохранить')
    setStatus(nextStatus)
    setF({ ...f, version: f.version + 1 })
    setMsg(nextStatus === 'published' ? 'Сохранено и опубликовано: воронка работает' : 'Сохранено')
  }

  const remove = async () => {
    if (!f || !confirm(`Удалить воронку «${f.name}» вместе с историей запусков?`)) return
    const { error } = await supabase.from('funnels').delete().eq('id', f.id)
    if (error) setMsg('Не удалось удалить')
    else nav('/funnels')
  }

  if (!f) return <div className="wrap"><Link to="/funnels">← Воронки</Link><div className={msg ? 'err' : 'empty'}>{msg || 'Загрузка…'}</div></div>

  return (
    <div className="wrap">
      <Link to="/funnels">← Воронки</Link>
      <h1 className="h1">{name || 'Воронка'} <span className={`chip ${status === 'published' ? 'green' : ''}`}>{FUNNEL_STATUS[status]}</span></h1>
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div className="fld"><label>Название</label><input value={name} onChange={(e) => setName(e.target.value)} /></div>
        <div className="fld"><label>Схема (JSON: блоки nodes и связи edges)</label><textarea className="code" rows={22} spellCheck={false} value={json} onChange={(e) => setJson(e.target.value)} /></div>
        {parsed.error && <div className="err" role="alert">JSON: {parsed.error}</div>}
        {check.errors.map((e, i) => <div key={i} className="err">Ошибка{e.node ? ` (блок ${e.node})` : ''}: {e.text}</div>)}
        {check.warnings.map((e, i) => <div key={i} className="hint">Внимание{e.node ? ` (блок ${e.node})` : ''}: {e.text}</div>)}
        {!invalid && <div className="hint">Схема корректна.</div>}
        <div className="row">
          <button className="btn" disabled={!!parsed.error} onClick={() => save(status === 'published' ? 'published' : 'draft')}>Сохранить</button>
          {status !== 'published'
            ? <button className="btn primary" disabled={invalid} onClick={() => save('published')}>Сохранить и опубликовать</button>
            : <button className="btn" onClick={() => save('draft')}>Снять с публикации</button>}
          <span className="sp" />
          <button className="btn" style={{ color: 'var(--red)' }} onClick={remove}>Удалить</button>
        </div>
        {msg && <div className="hint" role="status">{msg}</div>}
      </div>
      <div className="card">
        <h3>Как писать</h3>
        <div className="hint" style={{ lineHeight: 1.6 }}>
          Запуск: в блоке <code>start</code> в <code>triggers</code> перечислите «Команда /start», «Кнопка «Написать в Telegram» на сайте», «Ключевое слово» (слова в <code>keyword</code> через запятую, лучше основы: «цен», «прайс») или «Любое сообщение».<br />
          Сообщение: <code>parts</code> (текст, для английского клиента поле <code>en</code>), <code>quick</code> (кнопки, у каждой своя связь <code>qr-&lt;id&gt;</code>), <code>links</code>. В тексте: {'{имя}'}, {'{компания}'}.<br />
          Условие: выходы <code>yes</code> и <code>no</code>; правила: tag, service, field, var, time, day, date. Действие: delay («30 мин», «2 часа», «1 день»), notify, addtag, deltag, setvar («ключ = значение»).
          Сообщения после паузы получают только клиенты с согласием на рассылки.
        </div>
      </div>
      <div className="card">
        <h3>Статистика по блокам</h3>
        {stats.length === 0 ? <div className="hint">Данных пока нет: воронка ещё не запускалась.</div> : (
          <table className="tbl"><thead><tr><th>Блок</th><th>Вошли</th><th>Нажатий кнопок</th></tr></thead>
            <tbody>{stats.sort((a, b) => b.enter - a.enter).map((s) => <tr key={s.node}><td>{s.node}</td><td>{s.enter}</td><td>{s.click}</td></tr>)}</tbody></table>
        )}
      </div>
    </div>
  )
}

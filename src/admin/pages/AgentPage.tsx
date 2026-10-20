import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../supabase'
import { callApi } from '../api'
import { fmtDate } from '../types'
import { RISK_LABEL, TASK_STATUS, type AgentTask, type Step, type TaskStatus } from '../../../server/agent/types'
import { BackLink } from '../ui/BackLink'
import { Icon } from '../ui/Icon'
import { RowActions } from '../ui/RowActions'
import { MediaField } from '../ui/MediaField'
import './agent.css'

const STATUS_CHIP: Record<TaskStatus, string> = { planning: 'violet', approval: 'amber', running: 'blue', paused: 'red', done: 'green', rejected: '', failed: 'red' }
const RISK_CHIP: Record<Step['risk'], string> = { read: 'green', write: 'blue', send: 'amber', danger: 'red' }
const STATE_ICON: Record<Step['state'], 'circle' | 'clock' | 'check' | 'minus' | 'close'> = { todo: 'circle', running: 'clock', done: 'check', skipped: 'minus', failed: 'close' }
const LIVE: TaskStatus[] = ['planning', 'running', 'paused']

export default function AgentPage() {
  const { id } = useParams()
  const nav = useNavigate()
  const [tasks, setTasks] = useState<AgentTask[] | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [form, setForm] = useState({ title: '', text: '', links: '', file: '' })
  const [showForm, setShowForm] = useState(false)
  const [note, setNote] = useState('')
  const [on, setOn] = useState<Record<string, boolean>>({})

  const load = useCallback(async () => {
    const { data, error: e } = await supabase.from('agent_tasks').select('*').order('created_at', { ascending: false }).limit(100)
    if (e) return setError('Не удалось загрузить задания')
    setTasks((data ?? []) as AgentTask[])
  }, [])
  useEffect(() => { void load() }, [load])

  const task = tasks?.find((t) => t.id === id) ?? null
  const live = !!tasks?.some((t) => LIVE.includes(t.status))
  useEffect(() => {
    if (!live) return
    const t = window.setInterval(() => { void load() }, 4000)
    return () => window.clearInterval(t)
  }, [live, load])
  // Новый план: все шаги снова включены
  useEffect(() => { setOn({}); setNote('') }, [id, task?.rev, task?.status])

  const act = async (body: Record<string, unknown>) => {
    setBusy(true)
    setError('')
    const r = await callApi<{ id: string }>('/api/agent', body)
    setBusy(false)
    if (!r.ok) return setError(r.error)
    await load()
    return r.data
  }

  const removeTask = async (t: AgentTask) => {
    if (!confirm(`Удалить задание «${t.title}»?`)) return
    const r = await act({ action: 'delete', id: t.id })
    if (r && id === t.id) nav('/agent')
  }

  const create = async () => {
    const d = await act({ action: 'create', title: form.title, text: form.text, attach: [form.file, ...form.links.split('\n')].map((x) => x.trim()).filter(Boolean) })
    if (d) { setForm({ title: '', text: '', links: '', file: '' }); setShowForm(false); nav(`/agent/${d.id}`) }
  }
  const isOn = (s: Step) => on[s.id] ?? s.on

  return (
    <div className={`wrap agent ${id ? 'has-id' : ''}`}>
      <h1 className="h1">Задания агента <span className="chip">{tasks?.length ?? '…'}</span><span className="sp" /><button className="btn primary" onClick={() => { setShowForm(true); nav('/agent') }}><Icon name="plus" size={18} />Новое задание</button></h1>
      <div className="hint">Опишите задачу обычным текстом. Агент составит план, вы его утвердите или поправите, и только потом он начнёт выполнять. Рассылки и другие опасные шаги запускаются только после вашего отдельного подтверждения. Модель ИИ выбирается в <Link to="/settings">Настройках</Link>.</div>
      {error && <div className="err" role="alert">{error}</div>}

      <div className="split">
        <div className="list-col">
          {showForm && (
            <div className="card" style={{ marginBottom: 8 }}>
              <h3>Новое задание</h3>
              <div className="fld"><label htmlFor="at-title">Название</label><input id="at-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Тексты для напоминаний" /></div>
              <div className="fld"><label htmlFor="at-text">Что нужно сделать</label><textarea id="at-text" rows={4} value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} placeholder="Подготовь 3 варианта напоминания за час до встречи и сохрани лучший как шаблон" /></div>
              <div className="fld"><label>Файл к заданию <small>например, экспорт группы</small></label><MediaField kind="file" folder="agent" maxMB={25} value={form.file} onChange={(u) => setForm({ ...form, file: u })} /></div>
              <details className="howto"><summary>Как собрать клиентов из группы</summary>
                <ol>
                  <li>В Telegram Desktop откройте группу, меню ⋮, «Экспорт истории чата».</li>
                  <li>Уберите все галочки с медиа, формат выберите JSON, нажмите «Экспортировать».</li>
                  <li>Загрузите файл result.json выше и напишите задание, например: «Добавь клиентов из заявок группы, кроме тестовых».</li>
                </ol>
                <div className="hint">Бот Telegram не умеет читать историю группы по ссылке-приглашению. Новые заявки он сохраняет сам, экспорт нужен только для старых.</div>
              </details>
              <div className="fld"><label htmlFor="at-links">Ссылки на материалы <small>необязательно</small></label><textarea id="at-links" rows={2} value={form.links} onChange={(e) => setForm({ ...form, links: e.target.value })} placeholder="По одной ссылке в строке" /></div>
              <div className="row formbtns"><button className="btn primary" onClick={create} disabled={busy || !form.title.trim() || form.text.trim().length < 5}>{busy ? 'Агент думает…' : 'Поставить задание'}</button><button className="btn" onClick={() => setShowForm(false)} disabled={busy}>Отмена</button></div>
              <div className="hint formnote">План появится через несколько секунд.</div>
            </div>
          )}
          <div className="list">
            {tasks === null && !error && <div className="empty">Загрузка…</div>}
            {tasks?.length === 0 && !showForm && <div className="empty">Заданий пока нет. Нажмите «+ Новое задание».</div>}
            {tasks?.map((t) => (
              <div key={t.id} className={`irow ${t.id === id ? 'on' : ''}`}>
                <Link to={`/agent/${t.id}`} className="item-main">
                  <b>{t.title}</b>
                  <div className="row"><span className={`chip ${STATUS_CHIP[t.status]}`}>{TASK_STATUS[t.status]}</span><span className="sp" /><span className="hint">{fmtDate(t.created_at)}</span></div>
                </Link>
                <RowActions editTo={`/agent/${t.id}`} onDelete={() => removeTask(t)} deleteDisabled={t.status === 'running' || t.status === 'planning'} deleteTitle={t.status === 'running' || t.status === 'planning' ? 'Сначала остановите задание' : 'Удалить'} />
              </div>
            ))}
          </div>
        </div>

        <div className="detail-col">
          {!task && id && tasks && <div className="empty">Задание не найдено</div>}
          {!task && !id && <div className="empty">Выберите задание слева или создайте новое.</div>}
          {task && (
            <div className="card">
              <BackLink className="back" to="/agent">Все задания</BackLink>
              <div className="row" style={{ marginTop: 6 }}><h3 style={{ margin: 0 }}>{task.title}</h3><span className={`chip ${STATUS_CHIP[task.status]}`}>{TASK_STATUS[task.status]}</span>{task.rev > 1 && <span className="chip">версия плана {task.rev}</span>}</div>
              <p style={{ whiteSpace: 'pre-wrap' }}>{task.text}</p>
              {task.attach.length > 0 && <div className="hint">{task.attach.map((a) => <div key={a}><a href={a} target="_blank" rel="noreferrer">{a}</a></div>)}</div>}

              {task.status === 'planning' && <div className="hint" role="status">Агент составляет план…</div>}
              {task.error && <div className="warn" role="alert">{task.error}</div>}

              {task.plan.length > 0 && (
                <>
                  <h3 style={{ marginTop: 14 }}>План</h3>
                  <ol className="steps">
                    {task.plan.map((s) => (
                      <li key={s.id} className={`step ${task.status === 'approval' && !isOn(s) ? 'off' : ''}`}>
                        <label>
                          {task.status === 'approval' && s.tool !== 'report'
                            ? <input type="checkbox" checked={isOn(s)} onChange={(e) => setOn({ ...on, [s.id]: e.target.checked })} aria-label={`Выполнять шаг: ${s.text}`} />
                            : <span className={`smark ${s.state}`} aria-hidden="true"><Icon name={STATE_ICON[s.state]} size={16} /></span>}
                          <span>{s.text}</span>
                        </label>
                        <div className="row"><span className={`chip ${RISK_CHIP[s.risk]}`}>{RISK_LABEL[s.risk]}</span>{task.status !== 'approval' && <span className="hint">{s.state === 'todo' ? 'в очереди' : s.state === 'running' ? 'выполняется' : s.state === 'done' ? 'готово' : s.state === 'skipped' ? 'пропущен' : 'ошибка'}</span>}</div>
                        {s.cursor != null && s.state === 'todo' && s.result && <div className="res">{s.result}</div>}
                        {s.result && s.tool !== 'report' && s.cursor == null && <details><summary className="hint">Результат шага</summary><div className="res">{s.result}</div></details>}
                        {s.error && <div className="res bad">{s.error}</div>}
                      </li>
                    ))}
                  </ol>
                </>
              )}

              {task.status === 'approval' && (
                <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div className="fld"><label>Замечание к плану (необязательно)</label><textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Например: без отправки в группу, добавь два варианта текста" /></div>
                  <div className="row">
                    <button className="btn primary" disabled={busy} onClick={() => act({ action: 'approve', id: task.id, on })}>Утвердить и выполнить</button>
                    <button className="btn" disabled={busy || !note.trim()} onClick={() => act({ action: 'revise', id: task.id, note })}>{busy ? 'Агент думает…' : 'Обновить план'}</button>
                    <span className="sp" /><button className="btn danger" disabled={busy} onClick={() => act({ action: 'reject', id: task.id })}>Отклонить</button>
                  </div>
                </div>
              )}
              {task.status === 'paused' && (() => {
                const step = task.plan.find((s) => s.state === 'todo' && s.risk === 'danger')
                return step ? (
                  <div className="warn" style={{ marginTop: 12 }}>
                    <b>Нужно ваше подтверждение:</b> {step.text}
                    <div className="row" style={{ marginTop: 8 }}>
                      <button className="btn primary" disabled={busy} onClick={() => { if (confirm(`Выполнить шаг «${step.text}»? Отменить его потом нельзя.`)) void act({ action: 'confirm', id: task.id, stepId: step.id }) }}>Подтвердить и продолжить</button>
                      <button className="btn danger" disabled={busy} onClick={() => act({ action: 'reject', id: task.id })}>Остановить задание</button>
                    </div>
                  </div>
                ) : null
              })()}
              {task.status === 'running' && <div className="row" style={{ marginTop: 12 }}><span className="hint" role="status">Выполняется, шаги идут раз в минуту.</span><span className="sp" /><button className="btn danger" disabled={busy} onClick={() => act({ action: 'reject', id: task.id })}>Остановить</button></div>}
              {task.status === 'failed' && (
                <div className="row" style={{ marginTop: 12 }}>
                  <button className="btn primary" disabled={busy} onClick={() => act({ action: 'revise', id: task.id, note: '' })}>{busy ? 'Агент думает…' : 'Составить план заново'}</button>
                  <button className="btn danger" disabled={busy} onClick={() => act({ action: 'reject', id: task.id })}>Закрыть задание</button>
                </div>
              )}

              {task.report && <><h3 style={{ marginTop: 14 }}>Отчёт</h3><div className="report">{task.report}</div></>}
              {task.log.length > 0 && <><h3 style={{ marginTop: 14 }}>Журнал</h3><ul className="log">{[...task.log].reverse().map((l, i) => <li key={i}>{fmtDate(l.at)} · {l.text}</li>)}</ul></>}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

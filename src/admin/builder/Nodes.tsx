/* eslint-disable @typescript-eslint/no-explicit-any */
import { createContext, useContext, useEffect, type ReactNode } from 'react'
import { Handle, Position, useUpdateNodeInternals } from '@xyflow/react'
import { P, TYPES, actText, condText, problems, type D } from './catalog'

export const CountsCtx = createContext<Record<string, number>>({})
/** Действия над блоком прямо на схеме: открыть настройки и удалить */
export const NodeActionsCtx = createContext<{ edit: (id: string) => void; remove: (id: string) => void }>({ edit: () => undefined, remove: () => undefined })

function NodeActions({ id, removable = true }: { id: string; removable?: boolean }) {
  const { edit, remove } = useContext(NodeActionsCtx)
  const stop = (e: React.SyntheticEvent) => e.stopPropagation()
  return (
    <span className="nacts nodrag nopan">
      <button type="button" className="nbtn" title="Настройки блока" aria-label="Настройки блока" onClick={(e) => { stop(e); edit(id) }}><Ic d={P.edit} size={15} /></button>
      {removable && <button type="button" className="nbtn danger" title="Удалить блок" aria-label="Удалить блок" onClick={(e) => { stop(e); remove(id) }}><Ic d={P.trash} size={15} /></button>}
    </span>
  )
}

export const Ic = ({ d, size = 16, sw = 1.8 }: { d: string; size?: number; sw?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
)

function Shell({ id, type, selected, data, children }: { id: string; type: string; selected?: boolean; data: D; children: ReactNode }) {
  const counts = useContext(CountsCtx)
  const t = TYPES[type]
  const errs = problems(type, data)
  const upd = useUpdateNodeInternals()
  const sig = JSON.stringify(data)
  useEffect(() => { upd(id) }, [sig, id, upd])
  const count = counts[id]
  return (
    <div className={`node ${selected ? 'sel' : ''} ${errs.length ? 'bad' : ''} ${type === 'ai' ? 'ghost' : ''}`}>
      {type !== 'start' && <Handle id="in" type="target" position={Position.Left} style={{ top: 22 }} />}
      <div className="hd">
        <span className="ic" style={{ background: t.soft, color: t.color }}><Ic d={t.icon} size={14} /></span>
        <span>{t.name}</span>
        <span className="sp" />
        {count != null && <span className="cnt" title="Вошли в блок"><Ic d={P.user} size={12} />{count}</span>}
        <NodeActions id={id} removable={type !== 'start'} />
      </div>
      <div className="bd">
        {type === 'ai' && <div className="warn">ИИ пока не подключён, шаг пропускается</div>}
        {children}
        {type !== 'condition' && errs.map((e, i) => <div className="errline" key={i}>● {e}</div>)}
      </div>
    </div>
  )
}

const OutHandle = ({ id, label, cls }: { id: string; label: string; cls?: string }) => (
  <div className={`outl ${cls || ''}`}>{label}<Handle id={id} type="source" position={Position.Right} style={{ top: '50%' }} /></div>
)
const MEDIA: Record<string, [string, string]> = { image: [P.img, 'Фото'], video: [P.vid, 'Видео'], audio: [P.aud, 'Аудио'], file: [P.file, 'Файл'] }

function StartNode({ id, data, selected }: any) {
  return (
    <div className="startnode">
      <div className="tag"><Ic d={P.flag} size={13} /> Начало</div>
      <Shell id={id} type="start" selected={selected} data={data}>
        {data.triggers.length === 0 && <div className="dash">Выберите триггер</div>}
        {data.triggers.map((t: string) => <div className="rw" key={t}><span>{t}</span></div>)}
        {data.keyword && <div className="media">Ключевые слова: {data.keyword}</div>}
        <OutHandle id="out" label="" />
      </Shell>
    </div>
  )
}
function MessageNode({ id, data, selected }: any) {
  return (
    <Shell id={id} type="message" selected={selected} data={data}>
      {data.parts.map((p: D) => p.kind === 'text'
        ? (String(p.text ?? '').trim() ? <div className="bubble" key={p.id}>{p.text}</div> : <div className="dash" key={p.id}>Введите текст</div>)
        : <div className="media" key={p.id}><Ic d={(MEDIA[p.kind] ?? MEDIA.file)[0]} size={14} />{p.name || (p.url ? (MEDIA[p.kind] ?? MEDIA.file)[1] : `${(MEDIA[p.kind] ?? MEDIA.file)[1]}: нет ссылки`)}</div>)}
      {data.links.map((l: D) => <div className="rw link" key={l.id}><span>↗ {l.label || 'Кнопка-ссылка'}</span></div>)}
      {data.quick.map((q: D) => (
        <div className={`rw ${String(q.label ?? '').trim() ? '' : 'err'}`} key={q.id}>
          <span>{q.label || 'Введите название'}</span><small>ответ</small>
          <Handle id={`qr-${q.id}`} type="source" position={Position.Right} />
        </div>
      ))}
      <OutHandle id="out" label={data.quick.length ? 'Если клиент написал другое' : 'Дальше'} />
    </Shell>
  )
}
function ConditionNode({ id, data, selected }: any) {
  return (
    <Shell id={id} type="condition" selected={selected} data={data}>
      {data.rules.length === 0 && <div className="rw err"><span>Условие не задано</span></div>}
      {data.rules.length > 0 && <div className="hint" style={{ padding: '0 2px' }}>Соответствует {data.mode === 'all' ? 'всем' : 'любому из'} условий</div>}
      {data.rules.map((r: D) => <div className="rw" key={r.id}><span>{condText(r)}</span></div>)}
      <OutHandle id="yes" label="Соответствует" cls="yes" />
      <OutHandle id="no" label="Не соответствует" cls="no" />
    </Shell>
  )
}
function ActionNode({ id, data, selected }: any) {
  return (
    <Shell id={id} type="action" selected={selected} data={data}>
      {data.items.length === 0 && <div className="dash">Добавить действие</div>}
      {data.items.map((a: D) => <div className="rw" key={a.id}><span>{actText(a)}</span></div>)}
      <OutHandle id="out" label="Дальше" />
    </Shell>
  )
}
function BookingNode({ id, data, selected }: any) {
  return (
    <Shell id={id} type="booking" selected={selected} data={data}>
      <div className="bubble">Услуги: {data.services.join(', ') || '—'}</div>
      <div className="media">{data.formats.join(' · ') || 'Форматы не выбраны'}</div>
      <div className="warn">Пока передаёт диалог администратору</div>
      <OutHandle id="confirmed" label="Админ подтвердил" cls="yes" />
      <OutHandle id="declined" label="Админ отклонил / другое время" cls="no" />
    </Shell>
  )
}
function HandoffNode({ id, data, selected }: any) {
  return (
    <Shell id={id} type="handoff" selected={selected} data={data}>
      <div className="bubble">{data.message || 'Сообщение клиенту не задано'}</div>
      {data.notify && <div className="media">Уведомление админу в Telegram</div>}
    </Shell>
  )
}
function AiNode({ id, data, selected }: any) {
  return (
    <Shell id={id} type="ai" selected={selected} data={data}>
      <div className="bubble">{data.goal ? `Цель: ${data.goal}` : 'ИИ-ответ'}</div>
      <OutHandle id="out" label="Дальше" />
    </Shell>
  )
}
function NoteNode({ id, data, selected }: any) {
  return (
    <div className={`fnote ${selected ? 'sel' : ''} ${data.text ? '' : 'empty'}`}>
      <div className="nhead"><NodeActions id={id} /></div>
      {data.text || 'Введите заметку'}
    </div>
  )
}

export const nodeTypes = { start: StartNode, message: MessageNode, condition: ConditionNode, action: ActionNode, booking: BookingNode, handoff: HandoffNode, ai: AiNode, note: NoteNode }

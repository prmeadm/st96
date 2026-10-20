/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from 'react'
import type { Edge, Node } from '@xyflow/react'
import { P, actText, condText, type D } from './catalog'
import { Ic } from './Nodes'

type Item = { k: 'bot'; parts: D[]; links: D[] } | { k: 'sys'; t: string } | { k: 'me'; t: string }
type Choice = { label: string; target?: string }

export function Preview({ nodes, edges, onClose }: { nodes: Node[]; edges: Edge[]; onClose: () => void }) {
  const [log, setLog] = useState<Item[]>([])
  const [opts, setOpts] = useState<Choice[]>([])
  const endRef = useRef<HTMLDivElement>(null)
  const byId = (id: string) => nodes.find((n) => n.id === id)
  const next = (id: string, h: string) => edges.find((e) => e.source === id && (e.sourceHandle || 'out') === h)?.target

  const advance = (startId: string | undefined) => {
    const items: Item[] = []
    let choices: Choice[] = []
    let id = startId
    let guard = 0
    let handed = false
    while (id && guard++ < 60) {
      const n = byId(id)
      if (!n) break
      const d: D = n.data
      if (n.type === 'start') { id = next(id, 'out'); continue }
      if (n.type === 'message') {
        items.push({ k: 'bot', parts: d.parts, links: d.links })
        if (d.quick.length) { choices = d.quick.map((q: D) => ({ label: q.label || '…', target: next(n.id, 'qr-' + q.id) })); break }
        id = next(id, 'out'); continue
      }
      if (n.type === 'condition') {
        items.push({ k: 'sys', t: 'Проверка: ' + (d.rules.map(condText).join(d.mode === 'all' ? ' И ' : ' ИЛИ ') || 'условие не задано') })
        choices = [{ label: 'Условие выполнено (демо)', target: next(n.id, 'yes') }, { label: 'Не выполнено (демо)', target: next(n.id, 'no') }]; break
      }
      if (n.type === 'action') { d.items.forEach((a: D) => items.push({ k: 'sys', t: 'Действие: ' + actText(a) })); id = next(id, 'out'); continue }
      if (n.type === 'booking') {
        items.push({ k: 'bot', parts: [{ id: 'bk', kind: 'text', text: d.message || 'Выберите удобное время для встречи:' }], links: [{ id: 'bl', label: 'Выбрать время', url: '#' }] })
        choices = [{ label: 'Админ подтвердил (демо)', target: next(n.id, 'confirmed') }, { label: 'Админ отклонил (демо)', target: next(n.id, 'declined') }]
        break
      }
      if (n.type === 'handoff') { items.push({ k: 'bot', parts: [{ id: 'h', kind: 'text', text: d.message }], links: [] }); items.push({ k: 'sys', t: 'Диалог передан администратору' }); handed = true; break }
      if (n.type === 'ai') { items.push({ k: 'sys', t: 'ИИ пока не подключён: шаг пропущен' }); id = next(id, 'out'); continue }
      break
    }
    if (!choices.length && !handed) items.push({ k: 'sys', t: 'Конец воронки' })
    return { items, choices }
  }

  const start = () => { const r = advance('start'); setLog(r.items); setOpts(r.choices) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(start, [])
  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end' }) }, [log, opts])

  const pick = (o: Choice) => {
    const mine: Item[] = [{ k: 'me', t: o.label }]
    if (!o.target) { setLog((l) => [...l, ...mine, { k: 'sys', t: 'Ветка не подключена к следующему блоку' }]); setOpts([]); return }
    const r = advance(o.target)
    setLog((l) => [...l, ...mine, ...r.items]); setOpts(r.choices)
  }

  return (
    <div className="ov" onClick={onClose}>
      <div className="phone" onClick={(e) => e.stopPropagation()}>
        <div className="ph"><span className="av">ST96</span><div>ST96 Bot<div className="pill">предпросмотр воронки</div></div><span style={{ flex: 1 }} />
          <button type="button" className="btn" onClick={start}>Заново</button><button type="button" className="btn icon" onClick={onClose} aria-label="Закрыть" title="Закрыть"><Ic d={P.close} size={16} /></button></div>
        <div className="pchat">
          {log.map((m, i) => m.k === 'sys' ? <div className="sys" key={i}>{m.t}</div>
            : m.k === 'me' ? <div className="pmsg me" key={i}>{m.t}</div>
              : (
                <div className="pmsg" key={i}>
                  {m.parts.map((p) => p.kind === 'text' ? <div key={p.id}>{p.text || '…'}</div> : <div key={p.id} className="hint">[{p.kind}: {p.url || 'нет ссылки'}]</div>)}
                  {m.links.map((l) => <span className="plnk" key={l.id}>{l.label || 'Ссылка'}</span>)}
                </div>))}
          <div ref={endRef} />
        </div>
        {opts.length > 0 && <div className="opts">{opts.map((o, i) => <button type="button" key={i} onClick={() => pick(o)}>{o.label}</button>)}</div>}
      </div>
    </div>
  )
}

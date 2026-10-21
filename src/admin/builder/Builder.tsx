/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Background, Controls, MiniMap, ReactFlow, ReactFlowProvider, addEdge, applyEdgeChanges, applyNodeChanges, useNodesInitialized, useReactFlow,
  type Connection, type Edge, type EdgeChange, type Node, type NodeChange,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import './builder.css'
import type { Graph } from '../../../server/funnels/types'
import { MENU, TYPES, autoLayout, edgeStyle, fromFlow, newData, problems, toFlow, uid } from './catalog'
import { SaveButton } from '../ui/SaveButton'
import { Editor } from './Editor'
import { edgeTypes } from './Edges'
import { CountsCtx, Ic, NodeActionsCtx, nodeTypes } from './Nodes'
import { Preview } from './Preview'
import { P } from './catalog'

const isMobile = () => typeof window !== 'undefined' && window.matchMedia('(max-width:720px)').matches
type Snap = { nodes: Node[]; edges: Edge[] }

type Props = { graph: Graph; onChange: (g: Graph) => void; counts: Record<string, number>; onSave?: () => Promise<boolean | void> | boolean | void; saveDisabled?: boolean; saveMsg?: string }

function Inner({ graph, onChange, counts, full, setFull, onSave, saveDisabled, saveMsg }: Props & { full: boolean; setFull: (v: boolean) => void }) {
  const init = useMemo(() => toFlow(graph), []) // eslint-disable-line react-hooks/exhaustive-deps
  const [nodes, setNodes] = useState<Node[]>(init.nodes)
  const [edges, setEdges] = useState<Edge[]>(init.edges)
  const [menu, setMenu] = useState(false)
  const [preview, setPreview] = useState(false)
  const [toast, setToast] = useState('')
  const [past, setPast] = useState<Snap[]>([])
  const [future, setFuture] = useState<Snap[]>([])
  const wrap = useRef<HTMLDivElement>(null)
  const rf = useReactFlow()
  const cur = useRef<Snap>({ nodes, edges })
  cur.current = { nodes, edges }
  const lastCommit = useRef(0)
  const first = useRef(true)

  // Во весь экран: холст меняет размер, схему вписываем заново; Esc выходит из полноэкранного режима
  const firstFull = useRef(true)
  useEffect(() => {
    if (firstFull.current) { firstFull.current = false; return }
    const t = setTimeout(() => rf.fitView({ padding: 0.15, minZoom: 0.2, duration: 250 }), 120)
    return () => clearTimeout(t)
  }, [full]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!full) return
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape' && !preview) setFull(false) }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [full, preview]) // eslint-disable-line react-hooks/exhaustive-deps

  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(''), 2200) }
  const commit = (force?: boolean) => {
    const now = Date.now()
    if (!force && now - lastCommit.current < 900) return
    lastCommit.current = now
    setPast((p) => [...p.slice(-60), { nodes: cur.current.nodes, edges: cur.current.edges }])
    setFuture([])
  }
  const undo = () => {
    if (!past.length) return
    const p = past[past.length - 1]
    setFuture((f) => [{ nodes, edges }, ...f]); setPast(past.slice(0, -1)); setNodes(p.nodes); setEdges(p.edges)
  }
  const redo = () => {
    if (!future.length) return
    const f = future[0]
    setPast((p) => [...p, { nodes, edges }]); setFuture(future.slice(1)); setNodes(f.nodes); setEdges(f.edges)
  }

  // Каждое изменение схемы уходит наверх (там JSON, проверка и сохранение)
  useEffect(() => {
    if (first.current) { first.current = false; return }
    onChange(fromFlow(nodes, edges))
  }, [nodes, edges]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const tag = ((e.target as HTMLElement)?.tagName || '').toLowerCase()
      if (['input', 'textarea', 'select'].includes(tag)) return
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); if (e.shiftKey) redo(); else undo() }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  })

  const onNodesChange = useCallback((ch: NodeChange[]) => {
    if (ch.some((c) => c.type === 'remove')) commit(true)
    setNodes((ns) => applyNodeChanges(ch, ns))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  const onEdgesChange = useCallback((ch: EdgeChange[]) => {
    if (ch.some((c) => c.type === 'remove')) commit(true)
    setEdges((es) => applyEdgeChanges(ch, es))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  const onConnect = useCallback((c: Connection) => {
    commit(true)
    // у каждого выхода ровно одна связь
    setEdges((es) => addEdge({ ...c, ...edgeStyle }, es.filter((e) => !(e.source === c.source && (e.sourceHandle || 'out') === (c.sourceHandle || 'out')))))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const patch = (id: string, p: any) => { commit(); setNodes((ns) => ns.map((n) => n.id === id ? { ...n, data: { ...n.data, ...p } } : n)) }
  const remove = (id: string) => { commit(true); setEditId((e) => (e === id ? null : e)); setNodes((ns) => ns.filter((n) => n.id !== id)); setEdges((es) => es.filter((e) => e.source !== id && e.target !== id)) }
  // Настройки блока открываются только карандашом на самом блоке; обычный клик по блоку лишь выделяет его
  const [editId, setEditId] = useState<string | null>(null)
  const editNode = (id: string) => { setEditId(id); setNodes((ns) => ns.map((n): Node => ({ ...n, selected: n.id === id }))) }
  const duplicate = (id: string) => {
    const n = nodes.find((x) => x.id === id)
    if (!n) return
    commit(true)
    const c: Node = JSON.parse(JSON.stringify(n))
    c.id = uid('n'); c.position = { x: n.position.x + 40, y: n.position.y + 60 }; c.selected = true
    setNodes((ns) => [...ns.map((x): Node => ({ ...x, selected: false })), c])
  }
  const add = (type: string) => {
    commit(true); setMenu(false)
    const r = wrap.current!.getBoundingClientRect()
    const pos = rf.screenToFlowPosition({ x: r.left + r.width / 2 - 135, y: r.top + r.height / 2 - 100 })
    const n: Node = { id: uid('n'), type, position: pos, data: newData(type), selected: true }
    setNodes((ns) => [...ns.map((x): Node => ({ ...x, selected: false })), n])
  }
  const layout = () => { commit(true); setNodes((ns) => autoLayout(ns, edges)); setTimeout(() => rf.fitView({ padding: 0.2, duration: 400 }), 50); flash('Блоки упорядочены') }

  // блоки измеряются уже после первого кадра: вписываем всю схему, когда размеры известны
  const needsLayout = useRef(graph.nodes.some((n) => !n.position))
  const ready = useNodesInitialized()
  useEffect(() => {
    if (!ready) return
    // схема без сохранённых позиций: раскладываем по реальным высотам блоков, потом вписываем в экран
    if (needsLayout.current) { needsLayout.current = false; setNodes((ns) => autoLayout(ns, cur.current.edges)) }
    const t = setTimeout(() => {
      // на телефоне вся схема нечитаема: показываем старт крупно, «Вся схема» есть на кнопке
      const st = cur.current.nodes.find((n) => n.type === 'start')
      if (isMobile() && st) rf.setCenter(st.position.x + 135, st.position.y + 120, { zoom: 0.8 })
      else rf.fitView({ padding: 0.15, minZoom: 0.2, duration: 200 })
    }, 80)
    return () => clearTimeout(t)
  }, [ready]) // eslint-disable-line react-hooks/exhaustive-deps

  const editing = editId ? nodes.find((n) => n.id === editId) ?? null : null
  // на телефоне шторка закрывает нижнюю часть: поднимаем редактируемый блок в верхнюю четверть
  useEffect(() => {
    if (!editing || !isMobile() || !wrap.current) return
    const z = 0.85, h = wrap.current.clientHeight
    rf.setCenter(editing.position.x + 135, editing.position.y + (h / 2 - 14) / z, { zoom: z, duration: 250 })
  }, [editing?.id]) // eslint-disable-line react-hooks/exhaustive-deps
  const allProblems = nodes.filter((n) => n.type !== 'note').reduce((a, n) => a + problems(n.type as string, n.data).length, 0)

  return (
    <CountsCtx.Provider value={counts}>
      <NodeActionsCtx.Provider value={{ edit: editNode, remove: (id) => { remove(id); flash('Блок удалён. Вернуть можно кнопкой «Отменить»') } }}>
      <div className="bar">
        <button type="button" className="btn icon" onClick={undo} disabled={!past.length} title="Отменить (⌘Z)" aria-label="Отменить"><Ic d={P.undo} /></button>
        <button type="button" className="btn icon" onClick={redo} disabled={!future.length} title="Повторить (⌘⇧Z)" aria-label="Повторить"><Ic d={P.redo} /></button>
        <button type="button" className="btn" onClick={layout}><Ic d={P.grid} /><span className="hide-s"> Упорядочить</span></button>
        <button type="button" className="btn" onClick={() => setPreview(true)}><Ic d={P.play} size={14} /><span className="hide-s"> Превью</span></button>
        {allProblems > 0 && <span className="warn" style={{ color: 'var(--red)', background: 'var(--red-soft)' }}>Не заполнено: {allProblems}</span>}
        <span className="sp" />
        {full && saveMsg && <span className="hint" role="status">{saveMsg}</span>}
        {full && onSave && <SaveButton className="primary" disabled={saveDisabled} onSave={onSave}>Сохранить</SaveButton>}
        <button type="button" className="btn" onClick={() => setFull(!full)} aria-pressed={full} title={full ? 'Свернуть (Esc)' : 'Развернуть на весь экран'} aria-label={full ? 'Свернуть' : 'Развернуть на весь экран'}>
          <Ic d={full ? P.shrink : P.expand} size={16} /><span className="hide-s"> {full ? 'Свернуть' : 'На весь экран'}</span>
        </button>
      </div>
      <div className="stage" ref={wrap}>
        <ReactFlow
          nodes={nodes} edges={edges} nodeTypes={nodeTypes} edgeTypes={edgeTypes} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect}
          onNodeDragStart={() => commit(true)}
          onPaneClick={() => { setMenu(false); setEditId(null); setNodes((ns) => ns.some((n) => n.selected) ? ns.map((n) => ({ ...n, selected: false })) : ns) }}
          fitView fitViewOptions={{ padding: 0.2 }} minZoom={0.2} maxZoom={1.6}
          defaultEdgeOptions={edgeStyle} deleteKeyCode={['Backspace', 'Delete']} proOptions={{ hideAttribution: true }}>
          <Background gap={22} size={1.4} />
          <Controls showInteractive={false} position="bottom-left" />
          {!editing && <MiniMap pannable zoomable position="bottom-right" style={{ width: 150, height: 96 }} />}
        </ReactFlow>
        <div className={`dock ${editing ? 'hid' : ''}`}>
          <button type="button" className="btn primary" onClick={() => setMenu(!menu)} style={{ borderRadius: 999, padding: '10px 18px' }}><Ic d={P.plus} size={16} /> Добавить блок</button>
          <button type="button" className="btn show-s" onClick={() => rf.fitView({ padding: 0.15, duration: 300 })} style={{ borderRadius: 999, boxShadow: 'var(--shadow)' }}>Вся схема</button>
          {menu && (
            <div className="menu">
              {MENU.map((m, i) => {
                if (typeof m !== 'string') return <div className="sep" key={i}>{m.sep}</div>
                const t = TYPES[m]
                return (
                  <button type="button" key={m} onClick={() => add(m)}>
                    <span className="ic" style={{ background: t.soft, color: t.color }}><Ic d={t.icon} size={15} /></span>
                    <span><b>{t.name}</b><span className="d">{t.d}</span></span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
        {editing && <Editor node={editing} patch={patch} remove={remove} duplicate={duplicate} close={() => { setEditId(null); setNodes((ns) => ns.map((n) => ({ ...n, selected: false }))) }} />}
        {toast && <div className="toast">{toast}</div>}
      </div>
      {preview && <Preview nodes={nodes} edges={edges} onClose={() => setPreview(false)} />}
      </NodeActionsCtx.Provider>
    </CountsCtx.Provider>
  )
}

export function Builder(props: Props) {
  const [full, setFull] = useState(false)
  return <div className={`fb${full ? ' full' : ''}`}><ReactFlowProvider><Inner {...props} full={full} setFull={setFull} /></ReactFlowProvider></div>
}

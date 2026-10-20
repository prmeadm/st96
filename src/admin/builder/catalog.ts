/* eslint-disable @typescript-eslint/no-explicit-any */
import { MarkerType, type Edge, type Node } from '@xyflow/react'
import { TRIGGER, type Graph } from '../../../server/funnels/types'

export type D = any
export const uid = (p = 'id') => p + Math.random().toString(36).slice(2, 8)

export const P = {
  msg: 'M21 12a8 8 0 0 1-11.6 7.1L3 21l1.9-6.4A8 8 0 1 1 21 12z',
  filter: 'M3 4h18l-7 8v7l-4 2v-9z',
  bolt: 'M13 2L4 14h7l-1 8 9-12h-7z',
  note: 'M4 4h16v12l-4 4H4zM16 20v-4h4',
  ai: 'M12 3l1.8 4.7L18.5 9.5 13.8 11.3 12 16l-1.8-4.7L5.5 9.5l4.7-1.8zM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z',
  cal2: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4M9 15l2 2 4-4',
  hand: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
  play: 'M6 4l14 8-14 8z',
  undo: 'M9 14L4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3',
  redo: 'M15 14l5-5-5-5M20 9H10a6 6 0 0 0 0 12h3',
  grid: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z',
  plus: 'M12 5v14M5 12h14',
  trash: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13',
  edit: 'M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4',
  close: 'M6 6l12 12M18 6L6 18',
  copy: 'M9 9h11v11H9zM5 15V4h11',
  img: 'M4 5h16v14H4zM4 16l5-5 4 4 3-3 4 4',
  vid: 'M3 6h13v12H3zM16 10l5-3v10l-5-3z',
  aud: 'M9 18V6l10-2v12M9 18a3 3 0 1 1-3-3 3 3 0 0 1 3 3zM19 16a3 3 0 1 1-3-3 3 3 0 0 1 3 3z',
  file: 'M6 3h8l4 4v14H6zM14 3v4h4',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
  flag: 'M5 21V4M5 4h12l-2 4 2 4H5',
}

export const TYPES: Record<string, { name: string; color: string; soft: string; icon: string; d?: string }> = {
  start: { name: 'Старт', color: 'var(--ink)', soft: 'var(--bg)', icon: P.flag },
  message: { name: 'Сообщение', color: 'var(--blue)', soft: 'var(--blue-soft)', icon: P.msg, d: 'Текст, фото, видео, аудио, файл, кнопки и быстрые ответы' },
  condition: { name: 'Условие', color: 'var(--green)', soft: 'var(--green-soft)', icon: P.filter, d: 'Ветвление по тегам, услуге, времени, данным клиента' },
  action: { name: 'Действие', color: 'var(--amber)', soft: 'var(--amber-soft)', icon: P.bolt, d: 'Задержка, теги, переменные, уведомление админу' },
  booking: { name: 'Запись на встречу', color: 'var(--teal)', soft: 'var(--teal-soft)', icon: P.cal2, d: 'Клиент получает личную ссылку на календарь и выбирает время; воронка ждёт решения администратора' },
  handoff: { name: 'Передать человеку', color: 'var(--red)', soft: 'var(--red-soft)', icon: P.hand, d: 'Остановить бота и уведомить администратора' },
  ai: { name: 'ИИ-ответ', color: 'var(--violet)', soft: 'var(--violet-soft)', icon: P.ai },
  note: { name: 'Заметка', color: 'var(--violet)', soft: 'var(--violet-soft)', icon: P.note, d: 'Комментарий на схеме, клиент его не видит' },
}
export const MENU: (string | { sep: string })[] = [{ sep: 'Основные' }, 'message', 'condition', 'action', 'handoff', { sep: 'Дополнительно' }, 'booking', 'note']

// Только то, что движок умеет выполнять
export const COND_TYPES = [
  { k: 'tag', n: 'Назначенные теги', g: 'Клиент' },
  { k: 'service', n: 'Выбранная услуга', g: 'Клиент' },
  { k: 'field', n: 'Данные контакта', g: 'Клиент' },
  { k: 'var', n: 'Значение переменной', g: 'Клиент' },
  { k: 'time', n: 'Время (Минск)', g: 'Время' },
  { k: 'day', n: 'День недели', g: 'Время' },
  { k: 'date', n: 'Дата', g: 'Время' },
  { k: 'slot', n: 'Есть свободные слоты записи', g: 'Запись' },
  { k: 'booked', n: 'Клиент уже записан на встречу', g: 'Запись' },
]
export const ACT_TYPES = [
  { k: 'delay', n: 'Задержка', g: 'Популярные' },
  { k: 'notify', n: 'Уведомление админу в Telegram', g: 'Популярные' },
  { k: 'addtag', n: 'Добавить теги', g: 'Теги' },
  { k: 'deltag', n: 'Удалить теги', g: 'Теги' },
  { k: 'segment', n: 'Добавить в сегмент рассылки', g: 'Теги' },
  { k: 'setvar', n: 'Установить переменную', g: 'Данные' },
  { k: 'conv', n: 'Записать конверсию', g: 'Данные' },
]
export const SERVICES = ['Ретушь', 'Нейрофотосессия', 'Цифровой офис', 'Продакшн', 'Другое']
export const FORMATS = ['Телефонный звонок', 'Видеозвонок', 'Офлайн встреча']
export const DAYS = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс']
export const TRIGGERS = [TRIGGER.start, TRIGGER.site, TRIGGER.keyword, TRIGGER.any] as string[]

export const condText = (c: D) => {
  const t = COND_TYPES.find((x) => x.k === c.kind)?.n || 'Условие'
  return c.value ? `${t}: ${c.value}` : t
}
export const actText = (a: D) => {
  const t = ACT_TYPES.find((x) => x.k === a.kind)?.n || 'Действие'
  return a.value ? `${t}: ${a.value}` : t
}

export function problems(type: string, d: D): string[] {
  const p: string[] = []
  if (type === 'start' && !(d.triggers ?? []).length) p.push('Не выбран триггер запуска')
  if (type === 'start' && (d.triggers ?? []).includes(TRIGGER.keyword) && !String(d.keyword ?? '').trim()) p.push('Не заданы ключевые слова')
  if (type === 'message') {
    if (!(d.parts ?? []).some((x: D) => (x.kind === 'text' ? String(x.text ?? '').trim() : x.url))) p.push('Пустое сообщение')
    if ((d.quick ?? []).some((q: D) => !String(q.label ?? '').trim())) p.push('У быстрого ответа нет названия')
  }
  if (type === 'condition' && !(d.rules ?? []).length) p.push('Условие не задано')
  if (type === 'action' && !(d.items ?? []).length) p.push('Действие не задано')
  return p
}

export const edgeStyle = { type: 'default', markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--edge)', width: 16, height: 16 } }

export function newData(type: string): D {
  return ({
    message: { parts: [{ id: uid('p'), kind: 'text', text: '' }], quick: [], links: [] },
    condition: { mode: 'all', rules: [] },
    action: { items: [] },
    booking: { services: SERVICES.slice(0, 3), formats: FORMATS, meet: true, message: '', messageEn: '' },
    handoff: { message: 'Передаю ваш вопрос администратору, он ответит в ближайшее время.', notify: true },
    note: { text: '' },
  } as Record<string, D>)[type] ?? {}
}

/** Схема из JSON может прийти без нужных массивов: дополняем значениями по умолчанию. */
export function normalizeData(type: string, d: D): D {
  const base = type === 'start' ? { triggers: [], keyword: '', once: false } : newData(type)
  const out = { ...base, ...(d ?? {}) }
  for (const k of ['parts', 'quick', 'links', 'rules', 'items', 'triggers', 'services', 'formats']) if (k in base && !Array.isArray(out[k])) out[k] = base[k]
  return out
}

const estHeight = (n: Node) => {
  const d: D = n.data
  return 90 + (d.parts?.length ?? 0) * 50 + (d.quick?.length ?? 0) * 40 + (d.links?.length ?? 0) * 36 + (d.rules?.length ?? 0) * 40 + (d.items?.length ?? 0) * 40 + (n.type === 'condition' || n.type === 'booking' ? 60 : 0)
}

export function autoLayout(nodes: Node[], edges: Edge[]): Node[] {
  const start = nodes.find((n) => n.type === 'start')
  const layer: Record<string, number> = {}
  const q: string[] = []
  if (start) { layer[start.id] = 0; q.push(start.id) }
  while (q.length) {
    const id = q.shift()!
    edges.filter((e) => e.source === id).forEach((e) => { if (layer[e.target] == null) { layer[e.target] = layer[id] + 1; q.push(e.target) } })
  }
  const extra = Math.max(0, ...Object.values(layer)) + 1
  const cols: Record<number, Node[]> = {}
  nodes.forEach((n) => { (cols[layer[n.id] ?? extra] ||= []).push(n) })
  const pos: Record<string, { x: number; y: number }> = {}
  Object.entries(cols).forEach(([l, arr]) => {
    let y = 0
    arr.forEach((n) => { pos[n.id] = { x: +l * 380, y }; y += (n.measured?.height || estHeight(n)) + 40 })
  })
  return nodes.map((n) => ({ ...n, position: pos[n.id] || n.position }))
}

export const edgeId = (e: { source: string; sourceHandle?: string | null; target: string }) => `${e.source}-${e.sourceHandle || 'out'}-${e.target}`

export function toFlow(g: Graph): { nodes: Node[]; edges: Edge[] } {
  const needsLayout = g.nodes.some((n) => !n.position)
  const nodes: Node[] = g.nodes.map((n) => ({
    id: n.id, type: n.type, position: n.position ?? { x: 0, y: 0 }, data: normalizeData(n.type, n.data), deletable: n.type !== 'start',
  }))
  const edges: Edge[] = g.edges.map((e) => ({ id: edgeId(e), source: e.source, sourceHandle: e.sourceHandle || 'out', target: e.target, targetHandle: 'in', ...edgeStyle }))
  return { nodes: needsLayout ? autoLayout(nodes, edges) : nodes, edges }
}

export function fromFlow(nodes: Node[], edges: Edge[]): Graph {
  return {
    nodes: nodes.map((n) => ({ id: n.id, type: n.type as never, data: n.data as Record<string, unknown>, position: { x: Math.round(n.position.x), y: Math.round(n.position.y) } })),
    edges: edges.map((e) => ({ source: e.source, sourceHandle: e.sourceHandle || 'out', target: e.target })),
  }
}

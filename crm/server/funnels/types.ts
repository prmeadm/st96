// Формат схемы воронки совпадает с конструктором (узлы и связи).
export type Part = { id: string; kind: 'text' | 'image' | 'video' | 'videonote' | 'audio' | 'file'; text?: string; en?: string; url?: string; name?: string }
export type Quick = { id: string; label: string; en?: string }
export type Link = { id: string; label: string; url: string }
export type Rule = { id: string; kind: string; value: string }
export type ActionItem = { id: string; kind: string; value: string }

export type FNode = { id: string; type: 'start' | 'message' | 'condition' | 'action' | 'booking' | 'handoff' | 'ai' | 'note'; data: Record<string, unknown>; position?: { x: number; y: number } }
export type FEdge = { source: string; sourceHandle?: string | null; target: string }
export type Graph = { nodes: FNode[]; edges: FEdge[] }

export type Funnel = { id: string; name: string; status: 'draft' | 'published' | 'archived'; graph: Graph; ai_enabled: boolean; version: number }

export type RunRow = {
  id: string
  funnel_id: string
  client_id: string
  version: number
  current_node: string | null
  status: 'running' | 'waiting' | 'done' | 'stopped' | 'failed'
  vars: Record<string, unknown>
  wake_at: string | null
}

export type JobRow = { id: number; kind: string; payload: Record<string, unknown>; attempts: number }

export const TRIGGER = {
  start: 'Команда /start',
  site: 'Кнопка «Написать в Telegram» на сайте',
  group: 'Новая заявка из группы',
  keyword: 'Ключевое слово',
  any: 'Любое сообщение',
} as const

export const asArray = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : [])
export const str = (v: unknown) => (typeof v === 'string' ? v : '')

export const nextOf = (g: Graph, nodeId: string, handle = 'out') => g.edges.find((e) => e.source === nodeId && (e.sourceHandle || 'out') === handle)?.target ?? null

/** «2 часа», «30 мин», «1 день», «45 сек» -> миллисекунды; null, если не распознано */
export function parseDelay(s: string): number | null {
  const m = s.trim().toLowerCase().match(/^(\d+(?:[.,]\d+)?)\s*([a-zа-яё]*)$/i)
  if (!m) return null
  const n = parseFloat(m[1].replace(',', '.'))
  const u = m[2]
  const unit = /^(с|сек)/.test(u) ? 1000 : /^(м|мин)/.test(u) ? 60_000 : /^(ч|час)/.test(u) || u === 'h' ? 3_600_000 : /^(д|дн|ден|дне)/.test(u) || u === 'd' ? 86_400_000 : u === '' ? 60_000 : 0
  return unit ? Math.round(n * unit) : null
}

/** «поле = значение» */
export function parsePair(s: string): [string, string] | null {
  const i = s.indexOf('=')
  if (i < 1) return null
  const k = s.slice(0, i).trim()
  return k ? [k, s.slice(i + 1).trim()] : null
}

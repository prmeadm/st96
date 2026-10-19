import { TRIGGER, asArray, parseDelay, str, type Graph, type Part } from './types'

export type Issue = { node?: string; text: string }

/** Проверка схемы перед публикацией. Ошибки блокируют публикацию, предупреждения нет. */
export function validateGraph(g: unknown): { errors: Issue[]; warnings: Issue[] } {
  const errors: Issue[] = []
  const warnings: Issue[] = []
  const graph = g as Graph
  if (!graph || !Array.isArray(graph.nodes) || !Array.isArray(graph.edges)) return { errors: [{ text: 'Схема должна содержать списки nodes и edges' }], warnings }
  const ids = new Set<string>()
  for (const n of graph.nodes) {
    if (!n.id || ids.has(n.id)) errors.push({ node: n.id, text: 'Повторяющийся или пустой id блока' })
    ids.add(n.id)
  }
  const starts = graph.nodes.filter((n) => n.type === 'start')
  if (starts.length !== 1) errors.push({ text: 'В воронке должен быть ровно один блок «Старт»' })
  for (const e of graph.edges) {
    if (!ids.has(e.source) || !ids.has(e.target)) errors.push({ text: `Связь ${e.source} → ${e.target} ведёт в несуществующий блок` })
  }
  for (const n of graph.nodes) {
    const d = n.data ?? {}
    if (n.type === 'start') {
      const t = asArray<string>(d.triggers)
      if (!t.length) errors.push({ node: n.id, text: 'Не выбран триггер запуска' })
      if (t.includes(TRIGGER.keyword) && !str(d.keyword).trim()) errors.push({ node: n.id, text: 'Не заданы ключевые слова' })
      if (!graph.edges.some((e) => e.source === n.id)) errors.push({ node: n.id, text: 'Старт не подключён к следующему блоку' })
    }
    if (n.type === 'message') {
      const parts = asArray<Part>(d.parts)
      if (!parts.some((p) => (p.kind === 'text' ? str(p.text).trim() : p.url))) errors.push({ node: n.id, text: 'Пустое сообщение' })
      for (const p of parts) if (p.kind !== 'text' && !p.url) warnings.push({ node: n.id, text: `Вложение «${p.name ?? p.kind}» без ссылки на файл будет пропущено` })
      if (asArray<{ label: string }>(d.quick).some((q) => !str(q.label).trim())) errors.push({ node: n.id, text: 'У быстрого ответа нет названия' })
    }
    if (n.type === 'condition' && !asArray(d.rules).length) errors.push({ node: n.id, text: 'Условие не задано' })
    if (n.type === 'action') {
      const items = asArray<{ kind: string; value: string }>(d.items)
      if (!items.length) errors.push({ node: n.id, text: 'Действие не задано' })
      for (const a of items) {
        if (a.kind === 'delay' && parseDelay(str(a.value)) === null) errors.push({ node: n.id, text: `Не понимаю задержку «${a.value}». Пример: 30 мин, 2 часа, 1 день` })
        if (['http', 'goto', 'task', 'collect'].includes(a.kind)) warnings.push({ node: n.id, text: `Действие «${a.kind}» пока не выполняется и будет пропущено` })
      }
    }
    if (n.type === 'booking') warnings.push({ node: n.id, text: 'Запись на встречу пока передаёт диалог администратору (календарь будет позже)' })
    if (n.type === 'ai') warnings.push({ node: n.id, text: 'ИИ-ответ пока пропускается' })
  }
  return { errors, warnings }
}

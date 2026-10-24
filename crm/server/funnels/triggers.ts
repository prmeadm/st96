import { TRIGGER, asArray, str, type Funnel } from './types'

export type Incoming = { kind: 'start'; payload?: string } | { kind: 'text'; text: string }

const norm = (s: string) => s.toLowerCase().replace(/ё/g, 'е')

/** Какая воронка запускается на событие. Сначала точные триггеры (ключевое слово, метка ссылки), потом общие. */
export function pickFunnel(funnels: Funnel[], ev: Incoming): Funnel | null {
  const triggersOf = (f: Funnel) => {
    const start = f.graph.nodes.find((n) => n.type === 'start')
    return { t: asArray<string>(start?.data.triggers), keyword: str(start?.data.keyword) }
  }
  if (ev.kind === 'start') {
    const specific = funnels.find((f) => ev.payload === 'site' && triggersOf(f).t.includes(TRIGGER.site))
    return specific ?? funnels.find((f) => triggersOf(f).t.includes(TRIGGER.start)) ?? null
  }
  const text = norm(ev.text)
  const byKeyword = funnels.find((f) => {
    const { t, keyword } = triggersOf(f)
    return t.includes(TRIGGER.keyword) && keyword.split(',').map((k) => norm(k.trim())).filter(Boolean).some((k) => text.includes(k))
  })
  return byKeyword ?? funnels.find((f) => triggersOf(f).t.includes(TRIGGER.any)) ?? null
}

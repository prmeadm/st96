// Сбор клиентов и заявок из истории группы по файлу экспорта Telegram Desktop (result.json).
// Бот Telegram не может читать старые сообщения группы, поэтому историю берём из экспорта. Разбор строгий (код, а не модель):
// быстро, точно, без выдумок; повторный запуск не создаёт дублей (заявки находятся по номеру сообщения Telegram).
import type { Repo } from '../repo'
import { ingestGroupMessage, ingestLead } from '../leads/ingest'
import { clientKey, parseLead, type ParsedLead } from '../leads/parse'

export type ExportMsg = { id: number; text: string; from: string; replyTo: number | null }
export type ImportStats = { leads: number; created: number; existing: number; excluded: number; noContact: number; notes: number; skippedOther: number }
export const emptyStats = (): ImportStats => ({ leads: 0, created: 0, existing: 0, excluded: 0, noContact: 0, notes: 0, skippedOther: 0 })

export const IMPORT_TAG = 'импорт из группы'
export const MAX_EXPORT_BYTES = 25 * 1024 * 1024

/** В экспорте текст бывает строкой или массивом кусков со ссылками и форматированием. */
export function flattenText(t: unknown): string {
  if (typeof t === 'string') return t
  if (Array.isArray(t)) return t.map((x) => (typeof x === 'string' ? x : x && typeof x === 'object' && typeof (x as { text?: unknown }).text === 'string' ? (x as { text: string }).text : '')).join('')
  return ''
}

export function parseExport(json: unknown): { chatName: string; messages: ExportMsg[] } {
  const root = json as { name?: unknown; messages?: unknown }
  if (!root || !Array.isArray(root.messages)) throw new Error('Это не экспорт чата Telegram: в файле нет списка messages. Экспортируйте группу в Telegram Desktop в формате JSON.')
  const messages: ExportMsg[] = []
  for (const m of root.messages as Record<string, unknown>[]) {
    if (!m || m.type !== 'message' || typeof m.id !== 'number') continue
    const text = flattenText(m.text).trim()
    if (!text) continue
    messages.push({ id: m.id, text, from: typeof m.from === 'string' ? m.from : '', replyTo: typeof m.reply_to_message_id === 'number' ? m.reply_to_message_id : null })
  }
  return { chatName: typeof root.name === 'string' ? root.name : '', messages }
}

// Слова-признаки тестовых заявок. Совпадает только целое слово: фамилия «Тестов» или компания «Тестера» не попадают.
const TEST_WORDS = /(^|[^\p{L}])(тест|тестов(?:ый|ая|ое|ые|ого|ому|ую|ой|ых)|тестирование|test|testing|тестер)(?=$|[^\p{L}])/iu

/** Причина, по которой сообщение тестовое, или null. */
export function testReason(text: string, extraWords: string[] = []): string | null {
  const m = text.match(TEST_WORDS)
  if (m) return `слово «${m[2]}»`
  const low = text.toLowerCase()
  for (const w of extraWords) if (w.length >= 3 && new RegExp(`(^|[^\\p{L}])${w.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'u').test(low)) return `слово «${w}»`
  return null
}

export type ImportPlan = { leads: { msg: ExportMsg; parsed: ParsedLead }[]; others: ExportMsg[] }
export function planImport(messages: ExportMsg[]): ImportPlan {
  const leads: ImportPlan['leads'] = []
  const others: ExportMsg[] = []
  for (const msg of messages) {
    const parsed = parseLead(msg.text)
    if (parsed.isLead) leads.push({ msg, parsed })
    else others.push(msg)
  }
  return { leads, others }
}
export const totalOf = (p: ImportPlan) => p.leads.length + p.others.length

async function pool<T>(items: T[], size: number, fn: (x: T) => Promise<void>) {
  let i = 0
  await Promise.all(Array.from({ length: Math.min(size, items.length) }, async () => { while (i < items.length) await fn(items[i++]!) }))
}

/** Обрабатывает следующую часть, пока не кончится бюджет времени. Возвращает новую позицию. Заявки идут сначала (по разным клиентам параллельно), потом ответы сотрудников. */
export async function importSlice(
  repo: Repo, chatId: number, plan: ImportPlan, cursor: number, stats: ImportStats,
  opts: { extraWords: string[]; budgetMs: number; samples: string[] },
): Promise<number> {
  const started = Date.now()
  const nLeads = plan.leads.length
  while (cursor < totalOf(plan) && Date.now() - started < opts.budgetMs) {
    if (cursor < nLeads) {
      const slice = plan.leads.slice(cursor, Math.min(nLeads, cursor + 36))
      const byClient = new Map<string, typeof slice>()
      slice.forEach((x, i) => {
        const k = clientKey(x.parsed) || `anon:${cursor + i}`
        byClient.set(k, [...(byClient.get(k) ?? []), x])
      })
      await pool([...byClient.values()], 6, async (group) => {
        for (const { msg, parsed } of group) {
          const why = testReason(msg.text, opts.extraWords)
          if (why) {
            stats.excluded++
            if (opts.samples.length < 8) opts.samples.push(`${msg.text.replace(/\s+/g, ' ').slice(0, 90)} (${why})`)
            continue
          }
          stats.leads++
          const r = await ingestLead(repo, parsed, { tgChatId: chatId, tgMessageId: msg.id, rawText: msg.text })
          if (r.created) {
            stats.created++
            if (r.clientId) await repo.addTag(r.clientId, IMPORT_TAG)
          } else stats.existing++
          if (!r.clientId) stats.noContact++
        }
      })
      cursor += slice.length
    } else {
      const msg = plan.others[cursor - nLeads]!
      if (testReason(msg.text, opts.extraWords)) stats.excluded++
      else {
        const r = await ingestGroupMessage(repo, { chatId, messageId: msg.id, text: msg.text, fromId: null, fromName: msg.from, fromIsBot: false, reply: msg.replyTo ? { messageId: msg.replyTo, text: '' } : null })
        if (r.kind === 'note' || r.kind === 'unassigned_note') stats.notes++
        else stats.skippedOther++
      }
      cursor++
    }
  }
  return cursor
}

export function summarize(stats: ImportStats, done: number, total: number, clientsBefore: number, clientsNow: number, reachable?: number): string {
  const head = done >= total ? `Готово: разобрано ${total} сообщений.` : `Идёт: разобрано ${done} из ${total} сообщений.`
  const lines = [
    head,
    `Заявок: новых ${stats.created}, уже были в базе ${stats.existing}, тестовых пропущено ${stats.excluded}${stats.noContact ? `, без контактов (клиент не создан) ${stats.noContact}` : ''}.`,
    `Заметок сотрудников сохранено: ${stats.notes}.`,
    `Клиентов в базе: было ${clientsBefore}, стало ${clientsNow} (добавлено ${Math.max(0, clientsNow - clientsBefore)}); все новые помечены тегом «${IMPORT_TAG}».`,
  ]
  if (reachable != null) lines.push(`Могут получать рассылки и воронки (запускали бота и дали согласие): ${reachable}. Остальным бот не сможет написать первым: Telegram разрешает писать только тем, кто сам нажал /start.`)
  return lines.join('\n')
}

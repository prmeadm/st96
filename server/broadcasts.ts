// Рассылки: кому можно писать, сборка текста и отправка пачками (по расписанию из api/jobs).
import type { Api } from 'grammy'
import { sendContent } from './bot/dialog'
import type { ClientRow, Repo } from './repo'
import type { TemplateKind } from './templates'

export type Segment = { services?: string[]; tags?: string[]; language?: '' | 'ru' | 'en' }
export type BroadcastStatus = 'draft' | 'scheduled' | 'sending' | 'done' | 'canceled'
export type BroadcastRow = {
  id: string
  title: string
  kind: TemplateKind
  body: string
  body_en: string | null
  media_url: string | null
  segment: Segment
  status: BroadcastStatus
  scheduled_at: string | null
  total: number
  sent: number
  failed: number
  created_at: string
  finished_at: string | null
}
export type AudienceClient = ClientRow & { services: string[]; tags: string[] }

export const BROADCAST_STATUS: Record<BroadcastStatus, string> = { draft: 'Черновик', scheduled: 'Запланирована', sending: 'Отправляется', done: 'Отправлена', canceled: 'Отменена' }
const FOOTER = { ru: '\n\nОтписаться: /stop', en: '\n\nUnsubscribe: /stop' }
export const MEDIA_CAPTION_LIMIT = 900

/** Писать можно только тем, кто в Telegram, дал согласие и не отписался. */
export const canReceive = (c: ClientRow) => !!c.tg_user_id && !!c.consent_at && !c.opted_out_at

export function inAudience(c: AudienceClient, seg: Segment): boolean {
  if (!canReceive(c)) return false
  if (seg.language && c.language !== seg.language) return false
  if (seg.services?.length && !seg.services.some((s) => c.services.includes(s))) return false
  if (seg.tags?.length && !seg.tags.some((t) => c.tags.includes(t))) return false
  return true
}

/** Что не так с рассылкой перед запуском (пустая строка = всё хорошо). */
export function validateBroadcast(b: Pick<BroadcastRow, 'title' | 'kind' | 'body' | 'body_en' | 'media_url'>): string {
  if (!b.title.trim()) return 'Укажите название'
  if (b.kind === 'text' && !b.body.trim()) return 'Введите текст сообщения'
  if (b.kind !== 'text' && !b.media_url?.trim()) return 'Укажите ссылку на файл'
  if (b.kind !== 'text' && (b.body.length > MEDIA_CAPTION_LIMIT || (b.body_en?.length ?? 0) > MEDIA_CAPTION_LIMIT)) return `Подпись к файлу не длиннее ${MEDIA_CAPTION_LIMIT} знаков`
  return ''
}

const SEND_PAUSE_MS = 40 // ~25 сообщений в секунду: в пределах лимитов Telegram
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
const isRateLimit = (e: unknown) => /\b429\b|Too Many Requests/i.test(e instanceof Error ? e.message : String(e))

/** Отправляет очередную пачку по всем рассылкам, которым пора. Возвращает, сколько ушло и сколько не доставлено. */
export async function tickBroadcasts(deps: { repo: Repo; api: Api; now?: Date }, limit = 100): Promise<{ sent: number; failed: number }> {
  const { repo, api } = deps
  const now = deps.now ?? new Date()
  let budget = limit
  let sent = 0
  let failed = 0
  for (const b of await repo.listActiveBroadcasts()) {
    if (budget <= 0) break
    if (b.scheduled_at && Date.parse(b.scheduled_at) > now.getTime()) continue
    if (b.status === 'scheduled') await repo.updateBroadcast(b.id, { status: 'sending' })
    const batch = await repo.claimRecipients(b.id, budget)
    let stop = false
    for (const client of batch) {
      if (stop) {
        await repo.finishRecipient(b.id, client.id, 'pending')
        continue
      }
      try {
        const lang = client.language === 'en' ? 'en' : 'ru'
        const text = await sendContent(api, client, b, FOOTER[lang])
        await repo.insertMessage({ client_id: client.id, direction: 'admin', kind: b.kind === 'text' ? 'text' : b.kind, text: text || null, tg_chat_id: client.tg_user_id, tg_message_id: null })
        await repo.finishRecipient(b.id, client.id, 'sent')
        sent++
      } catch (e) {
        if (isRateLimit(e)) {
          await repo.finishRecipient(b.id, client.id, 'pending')
          stop = true
          continue
        }
        const why = e instanceof Error ? e.message : String(e)
        await repo.finishRecipient(b.id, client.id, 'failed', /blocked|deactivated|chat not found/i.test(why) ? 'клиент заблокировал бота или удалил чат' : why.slice(0, 200))
        failed++
      }
      budget--
      await sleep(SEND_PAUSE_MS)
    }
    const c = await repo.recipientCounts(b.id)
    const finished = c.pending === 0 && c.sending === 0
    await repo.updateBroadcast(b.id, { sent: c.sent, failed: c.failed, ...(finished ? { status: 'done' as const, finished_at: new Date().toISOString() } : {}) })
    if (stop) break
  }
  return { sent, failed }
}

/** Фиксирует получателей и ставит рассылку в очередь. Общая логика для админки и для агента. */
export async function startBroadcast(repo: Repo, api: Api, id: string): Promise<{ ok: true; total: number } | { ok: false; error: string; status: number }> {
  const b = await repo.getBroadcast(id)
  if (!b) return { ok: false, error: 'Рассылка не найдена', status: 404 }
  if (b.status !== 'draft') return { ok: false, error: 'Запустить можно только черновик', status: 409 }
  const problem = validateBroadcast(b)
  if (problem) return { ok: false, error: problem, status: 422 }
  const ids = (await repo.listAudience()).filter((c) => inAudience(c, b.segment)).map((c) => c.id)
  if (!ids.length) return { ok: false, error: 'В выбранном сегменте нет клиентов с согласием на рассылки', status: 422 }
  await repo.insertRecipients(b.id, ids)
  await repo.updateBroadcast(b.id, { status: 'scheduled', total: ids.length })
  // Если время уже пришло, первая пачка уходит сразу, остальное доберёт расписание (раз в минуту)
  if (!b.scheduled_at || Date.parse(b.scheduled_at) <= Date.now()) await tickBroadcasts({ repo, api }, 50)
  return { ok: true, total: ids.length }
}

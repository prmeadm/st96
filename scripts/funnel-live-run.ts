/**
 * Живой прогон воронки без Telegram: демо-воронка «Запись на консультацию» проигрывается
 * целиком на настоящем движке (crm/server/funnels/engine.ts) и настоящем telegramOut,
 * только вместо Telegram — запись отправок. Печатает то, что увидел бы клиент.
 *
 * Запуск: npx tsx scripts/funnel-live-run.ts
 */
import type { Api } from 'grammy'
import { memoryRepo } from '../crm/server/memoryRepo'
import { telegramOut } from '../crm/server/bot/telegramOut'
import { startFunnel, handleClick, handleFreeText, resumeBooking, type Env } from '../crm/server/funnels/engine'
import { demoGraph } from '../crm/server/funnels/demo'
import type { Funnel } from '../crm/server/funnels/types'
import type { ClientRow } from '../crm/server/repo'

type Sent = {
  method: string
  body: unknown
  caption?: string
  buttons?: { text: string; url?: string; data?: string }[]
  to: unknown
}

function fakeTelegram() {
  const sent: Sent[] = []
  let n = 0
  const call = (method: string) => async (_chat: unknown, body: unknown, extra: Record<string, unknown> = {}) => {
    const kb = (extra.reply_markup as { inline_keyboard?: { text: string; url?: string; callback_data?: string }[][] } | undefined)?.inline_keyboard ?? []
    sent.push({
      method,
      body,
      caption: extra.caption as string | undefined,
      buttons: kb.flat().map((b) => ({ text: b.text, url: b.url, data: b.callback_data })),
      to: _chat,
    })
    return { message_id: ++n }
  }
  const api = {
    sendMessage: call('sendMessage'),
    sendPhoto: call('sendPhoto'),
    sendVideo: call('sendVideo'),
    sendAudio: call('sendAudio'),
    sendDocument: call('sendDocument'),
  } as unknown as Api
  return { api, sent }
}

const show = (s: Sent, who = 'бот → клиенту') => {
  console.log(`\n  ${who}  [${s.method}]`)
  const text = s.caption ?? (typeof s.body === 'string' ? s.body : (s.body as { text?: string })?.text) ?? ''
  console.log('   ', text.replace(/\n/g, '\n    '))
  if (s.buttons?.length) console.log('    кнопки:', s.buttons.map((b) => b.text).join(' | '))
}

async function main() {
  const repo = memoryRepo()
  const tg = fakeTelegram()
  let now = new Date()
  const env: Env = {
    repo,
    out: telegramOut(tg.api, repo, null, { sleep: async () => undefined, embeddable: async () => false }),
    now: () => now,
  }
  const funnel: Funnel = { id: 'f-demo', name: 'Демо: запись на консультацию', status: 'published', graph: demoGraph, ai_enabled: false, version: 1 }
  repo.funnels.push(funnel)
  const client = await repo.insertClient({ tg_user_id: 100200300, name: 'Дмитрий', language: 'ru', consent_at: null, source: 'live-run' })
  const lastRun = () => repo.runs[repo.runs.length - 1]!
  const drain = () => { const s = tg.sent.splice(0); s.forEach((x) => show(x)); return s }

  console.log('=== 1. Клиент нажал /start ===')
  console.log('  outcome:', await startFunnel(env, funnel, client as ClientRow))
  drain()

  console.log('\n=== 2. Клиент нажал «Услуги и цены» ===')
  console.log('  click:', await handleClick(env, client as ClientRow, lastRun(), 'q1', 'm1'))
  drain()

  console.log('\n=== 3. Клиент нажал «Записаться на встречу» (ветка m2 → запись) ===')
  console.log('  click:', await handleClick(env, client as ClientRow, lastRun(), 'q2', 'm1'))
  drain()

  console.log('\n=== 4. Администратор подтвердил запись (resumeBooking confirmed) ===')
  console.log('  resume:', await resumeBooking(env, lastRun().id, 'confirmed'))
  drain()
  console.log('  статус запуска:', lastRun().status)
  console.log('  теги клиента:', await repo.listTags(client.id))

  console.log('\n=== 5. Ветка «Задать вопрос»: текст клиента воронка не перехватывает (он уходит в диалог) ===')
  const c2 = await repo.insertClient({ tg_user_id: 100200301, name: 'Анна', language: 'ru', consent_at: null, source: 'live-run' })
  await startFunnel(env, funnel, c2 as ClientRow)
  tg.sent.splice(0)
  await handleClick(env, c2 as ClientRow, lastRun(), 'q3', 'm1')
  drain()
  const run2 = lastRun()
  await repo.updateRun(run2.id, { status: 'waiting', vars: { ...run2.vars, __wait: 'input' } })
  const r2 = { ...(await repo.getRun(run2.id))! }
  console.log('  воронка забрала текст себе:', await handleFreeText(env, c2 as ClientRow, r2), '(ожидаемо false — текстом занимается диалог с администратором)')
  drain()

  console.log('\n=== 6. Четвёртая кнопка: «Связаться с админом» → handoff ===')
  const c3 = await repo.insertClient({ tg_user_id: 100200302, name: 'Игорь', language: 'ru', consent_at: null, source: 'live-run' })
  await startFunnel(env, funnel, c3 as ClientRow)
  tg.sent.splice(0)
  await handleClick(env, c3 as ClientRow, lastRun(), 'q4', 'm1')
  drain()
  console.log('  статус запуска:', lastRun().status)

  console.log('\n=== Итог ===')
  console.log('  запусков:', repo.runs.length, '| событий:', repo.events.length, '| сообщений клиентам:', repo.messages.length)
  console.log('  статусы:', repo.runs.map((r: { status: string }) => r.status).join(', '))
}

main().catch((e) => {
  console.error('прогон упал:', e)
  process.exit(1)
})

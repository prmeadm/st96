import { Bot, InlineKeyboard, type Context } from 'grammy'
import type { ClientRow, MessageInsert, Repo } from '../repo'
import { ingestGroupMessage } from '../leads/ingest'
import { handleTopicMessage, relayToAdmins } from './dialog'
import { handleClick, handleFreeText, startFunnel, type Env } from '../funnels/engine'
import { pickFunnel } from '../funnels/triggers'
import { telegramOut } from './telegramOut'
import { T, type Lang } from './texts'

const ACK_EVERY_MS = 12 * 3600 * 1000

type From = NonNullable<Context['from']>

const langOf = (from: From): Lang => (from.language_code?.toLowerCase().startsWith('en') ? 'en' : 'ru')
const fullName = (f: From) => [f.first_name, f.last_name].filter(Boolean).join(' ')

/** Клиент по Telegram id; если заявка со стенда или сайта уже есть с таким ником, привязываем к ней. */
export async function ensureClient(repo: Repo, from: From, source?: string): Promise<{ client: ClientRow; isNew: boolean; prevSeen: string | null }> {
  let client = await repo.findClient({ tgUserId: from.id })
  let isNew = false
  if (!client && from.username) {
    const byName = await repo.findClient({ username: from.username })
    if (byName && !byName.tg_user_id) {
      await repo.updateClient(byName.id, { tg_user_id: from.id })
      client = { ...byName, tg_user_id: from.id }
    }
  }
  if (!client) {
    client = await repo.insertClient({
      tg_user_id: from.id, tg_username: from.username ?? null, name: fullName(from) || null, language: langOf(from), source: source ?? 'bot',
    })
    isNew = true
  }
  const prevSeen = client.last_seen_at ?? null
  const patch: Partial<ClientRow> & { last_seen_at: string } = { last_seen_at: new Date().toISOString() }
  if (from.username && !client.tg_username) patch.tg_username = from.username
  if (!client.name && fullName(from)) patch.name = fullName(from)
  await repo.updateClient(client.id, patch)
  return { client: { ...client, ...patch }, isNew, prevSeen }
}

function messageKind(m: NonNullable<Context['message']>): MessageInsert['kind'] {
  if (m.text) return 'text'
  if (m.photo) return 'photo'
  if (m.video || m.video_note) return 'video'
  if (m.voice) return 'voice'
  if (m.audio) return 'audio'
  if (m.document) return 'file'
  return 'other'
}

export function createBot(token: string, repo: Repo, opts: { groupChatId: number | null }) {
  const bot = new Bot(token)
  const envFor = (api: Bot['api']): Env => ({ repo, out: telegramOut(api, repo, opts.groupChatId) })
  const isMuted = (c: ClientRow) => !!c.human_until && Date.parse(c.human_until) > Date.now()

  // Telegram может повторить доставку: один update обрабатываем один раз
  bot.use(async (ctx, next) => {
    const t0 = Date.now()
    console.log('update', ctx.update.update_id, Object.keys(ctx.update).filter((k) => k !== 'update_id').join(','), ctx.chat?.type ?? '')
    if (!(await repo.claimUpdate(ctx.update.update_id))) {
      console.log('update duplicate', ctx.update.update_id)
      return
    }
    try {
      await next()
      console.log('update handled', ctx.update.update_id, `${Date.now() - t0}ms`)
    } catch (e) {
      console.error('update failed', ctx.update.update_id, e instanceof Error ? e.stack : e)
      throw e
    }
  })

  bot.command('start', async (ctx) => {
    if (ctx.chat.type !== 'private' || !ctx.from) return
    const payload = ctx.match?.trim().slice(0, 64) || undefined
    const { client } = await ensureClient(repo, ctx.from, payload ? `bot:${payload}` : 'bot')
    const t = T[client.language]
    await repo.insertMessage({ client_id: client.id, direction: 'in', kind: 'text', text: ctx.message?.text ?? '/start', tg_chat_id: ctx.chat.id, tg_message_id: ctx.message?.message_id ?? null })
    const kb = new InlineKeyboard().text(t.agree, 'consent:yes').text(t.decline, 'consent:no')
    // Явный /start начинает всё заново: диалог у человека и прежняя воронка закрываются
    if (isMuted(client)) await repo.updateClient(client.id, { human_until: null })
    const active = await repo.findActiveRun(client.id)
    if (active) await repo.updateRun(active.id, { status: 'stopped', finished_at: new Date().toISOString() })
    const funnel = pickFunnel(await repo.listPublishedFunnels(), { kind: 'start', payload })
    if (funnel) {
      // Приветствие даёт воронка, поэтому сначала короткий запрос согласия, затем воронка
      await ctx.reply(t.consentAsk, { reply_markup: kb, link_preview_options: { is_disabled: true } })
      await startFunnel(envFor(ctx.api), funnel, { ...client, human_until: null })
    } else {
      await ctx.reply(t.welcome, { reply_markup: kb, link_preview_options: { is_disabled: true } })
    }
  })

  // Кнопки быстрых ответов из воронок: fb:<run>:<кнопка>
  bot.callbackQuery(/^fb:([0-9a-f-]{36}):(\w+)$/, async (ctx) => {
    const { client } = await ensureClient(repo, ctx.from)
    const run = await repo.getRun(ctx.match[1])
    if (!run || run.client_id !== client.id) return void (await ctx.answerCallbackQuery({ text: 'Кнопка устарела' }))
    await ctx.answerCallbackQuery()
    const r = await handleClick(envFor(ctx.api), client, run, ctx.match[2])
    if (r === 'ok') await ctx.editMessageReplyMarkup({ reply_markup: undefined }).catch(() => undefined)
  })

  bot.command('stop', async (ctx) => {
    if (ctx.chat.type !== 'private' || !ctx.from) return
    const { client } = await ensureClient(repo, ctx.from)
    await repo.updateClient(client.id, { opted_out_at: new Date().toISOString() })
    await ctx.reply(T[client.language].stopped)
  })

  bot.callbackQuery(/^consent:(yes|no)$/, async (ctx) => {
    const { client } = await ensureClient(repo, ctx.from)
    const t = T[client.language]
    if (ctx.match[1] === 'yes') {
      await repo.updateClient(client.id, { consent_at: new Date().toISOString(), opted_out_at: null })
      await ctx.answerCallbackQuery()
      await ctx.editMessageReplyMarkup({ reply_markup: undefined }).catch(() => undefined)
      await ctx.reply(t.agreed)
    } else {
      await ctx.answerCallbackQuery()
      await ctx.editMessageReplyMarkup({ reply_markup: undefined }).catch(() => undefined)
      await ctx.reply(t.declined)
    }
  })

  bot.on('message', async (ctx) => {
    const m = ctx.message
    if (ctx.chat.type === 'private') {
      if (!ctx.from) return
      const { client, prevSeen } = await ensureClient(repo, ctx.from)
      await repo.insertMessage({
        client_id: client.id, direction: 'in', kind: messageKind(m), text: m.text ?? m.caption ?? null,
        tg_chat_id: ctx.chat.id, tg_message_id: m.message_id,
      })
      if (opts.groupChatId) {
        try {
          await relayToAdmins(ctx.api, repo, opts.groupChatId, client, ctx.chat.id, m.message_id)
        } catch (e) {
          // Тема не создалась (нет прав, темы выключены): сообщение не должно потеряться
          console.error('relay failed', e instanceof Error ? e.message : e)
          await ctx.api
            .sendMessage(opts.groupChatId, `Сообщение от ${client.name ?? 'клиента'}${client.tg_username ? ` (@${client.tg_username})` : ''}: ${m.text ?? m.caption ?? '[вложение]'}`)
            .catch(() => undefined)
        }
      }
      // Воронки: идущая ждёт текст, иначе ищем воронку по ключевому слову или «любое сообщение».
      // Пока диалог у человека, бот молчит.
      let handled = false
      const muted = isMuted(client)
      if (!muted && m.text) {
        const run = await repo.findActiveRun(client.id)
        if (run) handled = await handleFreeText(envFor(ctx.api), client, run)
        else {
          const funnel = pickFunnel(await repo.listPublishedFunnels(), { kind: 'text', text: m.text })
          if (funnel) handled = (await startFunnel(envFor(ctx.api), funnel, client)) !== null
        }
      }
      // Подтверждаем получение не чаще раза в 12 часов
      if (!handled && !muted && (!prevSeen || Date.now() - Date.parse(prevSeen) > ACK_EVERY_MS)) await ctx.reply(T[client.language].ack)
      return
    }
    if (ctx.chat.type === 'group' || ctx.chat.type === 'supergroup') {
      if (opts.groupChatId !== ctx.chat.id) console.log('group message ignored: chat', ctx.chat.id, ctx.chat.title, 'expected', opts.groupChatId)
    }
    if ((ctx.chat.type === 'group' || ctx.chat.type === 'supergroup') && opts.groupChatId === ctx.chat.id) {
      const text = m.text ?? m.caption ?? ''
      if (m.is_topic_message && m.message_thread_id) {
        const hasContent = !!(m.text || m.photo || m.video || m.video_note || m.voice || m.audio || m.document || m.sticker || m.animation)
        await handleTopicMessage(ctx.api, repo, opts.groupChatId, {
          threadId: m.message_thread_id, messageId: m.message_id, text, hasContent, fromId: ctx.from?.id ?? null,
          fromName: ctx.from ? fullName(ctx.from) : '', fromIsBot: ctx.from?.is_bot ?? false,
        })
        return
      }
      const rep = m.reply_to_message
      await ingestGroupMessage(repo, {
        chatId: ctx.chat.id, messageId: m.message_id, text, fromId: ctx.from?.id ?? null,
        fromName: ctx.from ? fullName(ctx.from) : '', fromIsBot: ctx.from?.is_bot ?? false,
        reply: rep ? { messageId: rep.message_id, text: rep.text ?? rep.caption ?? '' } : null,
      })
    }
  })

  bot.catch((err) => console.error('bot error', err.error instanceof Error ? err.error.message : err.error))
  return bot
}

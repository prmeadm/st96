import { Bot, type Context } from 'grammy'
import type { ClientRow, MessageInsert, Repo } from '../repo'
import { ingestGroupMessage } from '../leads/ingest'
import { handleTopicMessage, relayToAdmins, sendTemplate } from './dialog'
import { handleClick, handleFreeText, startFunnel, type Env } from '../funnels/engine'
import { pickFunnel } from '../funnels/triggers'
import { telegramOut } from './telegramOut'
import { notifyClientDecision } from '../booking/notify'
import { decideBooking, loadDirectAdmins } from '../booking/service'
import { T, type Lang } from './texts'
import { verifySiteRef } from './siteRef'

const ACK_EVERY_MS = 12 * 3600 * 1000

type From = NonNullable<Context['from']>

const langOf = (from: From): Lang => (from.language_code?.toLowerCase().startsWith('en') ? 'en' : 'ru')
const fullName = (f: From) => [f.first_name, f.last_name].filter(Boolean).join(' ')

/** Переход из формы сайта (/start site_<токен>, см. siteRef): привязываем Telegram к клиенту, созданному заявкой, чтобы не плодить дубль. */
export async function linkLeadClient(repo: Repo, from: From, clientId: string) {
  const c = await repo.findClientById(clientId)
  if (!c || c.tg_user_id) return
  if (await repo.findClient({ tgUserId: from.id })) return
  const byName = !c.tg_username && from.username ? await repo.findClient({ username: from.username }) : null
  await repo.updateClient(c.id, { tg_user_id: from.id, ...(c.tg_username || byName || !from.username ? {} : { tg_username: from.username }) })
}

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

/** Окно, в котором повторный старт с сайта (/start site_ повторно) воронку не перезапускает. */
export const SITE_START_LOCK_MS = 10 * 60 * 1000

/** /start site_<token>: не перезапускаем воронку, если она стартовала только что (повторное нажатие ссылки) */
export type StartGuard = 'link'

/**
 * Общий вход в стартовую воронку: /start в боте.
 * Привязка к клиенту из заявки, клиент, сброс диалога с человеком и прежней воронки, запуск воронки по payload.
 */
export async function beginStart(
  repo: Repo, env: Env, from: From,
  opts: { payload?: string; leadRef?: string; guard?: StartGuard; logIn?: { chatId: number; text: string; messageId: number | null } },
): Promise<{ client: ClientRow; hasFunnel: boolean; started: boolean; skipped?: 'recent' }> {
  if (opts.leadRef) await linkLeadClient(repo, from, opts.leadRef)
  const { client } = await ensureClient(repo, from, opts.payload ? `bot:${opts.payload}` : 'bot')
  if (opts.logIn) await repo.insertMessage({ client_id: client.id, direction: 'in', kind: 'text', text: opts.logIn.text, tg_chat_id: opts.logIn.chatId, tg_message_id: opts.logIn.messageId })
  const muted = !!client.human_until && Date.parse(client.human_until) > Date.now()
  if (opts.guard) {
    const last = await repo.lastRunStartedAt(client.id)
    if (last && Date.now() - Date.parse(last) < SITE_START_LOCK_MS) return { client, hasFunnel: true, started: false, skipped: 'recent' }
  }
  const active = await repo.findActiveRun(client.id)
  // Явный /start начинает всё заново: диалог у человека и прежняя воронка закрываются
  if (muted) await repo.updateClient(client.id, { human_until: null })
  if (active) await repo.updateRun(active.id, { status: 'stopped', finished_at: new Date().toISOString() })
  const funnel = pickFunnel(await repo.listPublishedFunnels(), { kind: 'start', payload: opts.payload })
  // Согласие на рассылки клиент уже дал в форме заявки на сайте, отдельный запрос в боте не нужен
  const started = funnel ? (await startFunnel(env, funnel, { ...client, human_until: null })) !== null : false
  return { client: { ...client, human_until: null }, hasFunnel: !!funnel, started }
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

  // Команды в любом регистре и с опечаткой раскладки: iOS ставит заглавную («/Start»), русская раскладка даёт «/старт».
  // Библиотека различает регистр, и такое сообщение уходило бы как обычный текст, а воронка не запускалась.
  bot.use(async (ctx, next) => {
    const m = ctx.message
    if (m?.text && ctx.chat?.type === 'private') {
      const t = m.text.trim()
      const sl = t.match(/^\/(start|stop|старт|стоп)(@\w+)?(\s[\s\S]*)?$/i)
      const bare = /^(start|старт)$/i.test(t) // слово без слэша тоже считаем запуском
      const cmd = sl ? (/^(start|старт)$/i.test(sl[1]!) ? 'start' : 'stop') : bare ? 'start' : null
      if (cmd) {
        m.text = `/${cmd}${sl?.[3] ?? ''}`
        m.entities = [{ type: 'bot_command', offset: 0, length: cmd.length + 1 }]
      }
    }
    await next()
  })

  bot.command('start', async (ctx) => {
    if (ctx.chat.type !== 'private' || !ctx.from) return
    const rawPayload = ctx.match?.trim().slice(0, 64) || undefined
    // Кнопка «Из Telegram» на странице записи: запоминаем ник под одноразовым токеном и сразу сообщаем человеку, без воронки и запроса согласия
    const bk = rawPayload?.match(/^bk_([a-f0-9]{16,32})$/)?.[1]
    if (bk) {
      const en = langOf(ctx.from) === 'en'
      await repo.saveTgLink(bk, { tg_user_id: ctx.from.id, username: ctx.from.username ?? null, first_name: ctx.from.first_name ?? null })
      await ctx.reply(ctx.from.username
        ? (en ? `✅ Done: @${ctx.from.username}. Go back to the booking page, your Telegram username will be filled in automatically.` : `✅ Готово: @${ctx.from.username}. Вернитесь на страницу записи, ник подставится сам.`)
        : (en ? 'You have no public Telegram username. Set one in Telegram: Settings → Username, then tap the button on the booking page again. Or enter your phone number.' : 'У вас в Telegram нет публичного ника. Задайте его в Telegram: Настройки → Имя пользователя, затем снова нажмите кнопку на странице записи. Или укажите телефон.'))
      return
    }
    // site_<токен>: токен выдаётся только заявке, создавшей карточку. Битый, просроченный или старый с голым id:
    // воронка сайта запускается, но без привязки к карточке
    const siteRef = rawPayload?.match(/^site_([A-Za-z0-9_-]{1,59})$/)?.[1]
    const leadRef = siteRef ? (await verifySiteRef(siteRef, token)) ?? undefined : undefined
    const payload = siteRef ? 'site' : rawPayload
    const { client, hasFunnel, skipped } = await beginStart(repo, envFor(ctx.api), ctx.from, {
      payload, leadRef, guard: siteRef ? 'link' : undefined, logIn: { chatId: ctx.chat.id, text: ctx.message?.text ?? '/start', messageId: ctx.message?.message_id ?? null },
    })
    // Воронки нет или она только что запущена входом на сайте (не перезапускаем): человек всё равно получает ответ
    if (!hasFunnel || skipped) await ctx.reply(T[client.language].welcome, { link_preview_options: { is_disabled: true } })
  })

  // Кнопки быстрых ответов из воронок: fb:<запуск>:<кнопка>[:<блок>]
  bot.callbackQuery(/^fb:([0-9a-f-]{36}):(\w+)(?::([\w-]{1,24}))?$/, async (ctx) => {
    const { client } = await ensureClient(repo, ctx.from)
    const t = T[client.language]
    const run = await repo.getRun(ctx.match[1]!)
    if (!run || run.client_id !== client.id) return void (await ctx.answerCallbackQuery({ text: t.staleButton, show_alert: true }))
    if (isMuted(client)) return void (await ctx.answerCallbackQuery({ text: t.humanOn, show_alert: true }))
    await ctx.answerCallbackQuery()
    // Сразу убираем кнопки ответов у нажатого сообщения (повторное нажатие не запустит ветку дважды), кнопки-ссылки оставляем
    const rows = (ctx.callbackQuery.message?.reply_markup?.inline_keyboard ?? []).map((r) => r.filter((b) => 'url' in b)).filter((r) => r.length)
    await ctx.editMessageReplyMarkup({ reply_markup: rows.length ? { inline_keyboard: rows } : undefined }).catch(() => undefined)
    const r = await handleClick(envFor(ctx.api), client, run, ctx.match[2]!, ctx.match[3])
    if (r === 'stale') await ctx.reply(t.staleButton).catch(() => undefined)
  })

  // Кнопка шаблона в теме клиента (после /shablon): отправляем шаблон тому, чья это тема
  bot.callbackQuery(/^tpl:([0-9a-f-]{36})$/, async (ctx) => {
    const msg = ctx.callbackQuery.message
    if (!opts.groupChatId || !msg || msg.chat.id !== opts.groupChatId || !msg.message_thread_id) return void (await ctx.answerCallbackQuery())
    const client = await repo.findClient({ topicId: msg.message_thread_id })
    const tpl = await repo.getTemplate(ctx.match[1]!)
    if (!client || !tpl) return void (await ctx.answerCallbackQuery({ text: 'Шаблон или клиент не найден' }))
    try {
      await sendTemplate(ctx.api, repo, client, tpl)
      await ctx.answerCallbackQuery({ text: `Отправлено: ${tpl.title}`.slice(0, 190) })
    } catch (e) {
      const why = e instanceof Error ? e.message : String(e)
      await ctx.answerCallbackQuery({ text: `Не доставлено: ${/blocked|deactivated|chat not found/i.test(why) ? 'клиент заблокировал бота' : why}`.slice(0, 190), show_alert: true })
    }
  })

  // Кнопки решения по заявке на встречу в группе администраторов: bk:ok:<id> / bk:no:<id>
  bot.callbackQuery(/^bk:(ok|no):([A-Za-z0-9-]{1,40})$/, async (ctx) => {
    const msg = ctx.callbackQuery.message
    // Решать можно в рабочей группе и в личном чате администратора, которому заявка пришла лично
    const inGroup = !!opts.groupChatId && msg?.chat.id === opts.groupChatId
    const direct = !!msg && msg.chat.type === 'private' && !!ctx.from.username && (await loadDirectAdmins(repo)).includes(ctx.from.username.toLowerCase())
    if (!msg || (!inGroup && !direct)) return void (await ctx.answerCallbackQuery())
    const ok = ctx.match[1] === 'ok'
    const r = await decideBooking(repo, ctx.match[2]!, ok ? 'confirm' : 'reject')
    if (!r.ok) return void (await ctx.answerCallbackQuery({ text: r.error, show_alert: true }))
    const who = [ctx.from.first_name, ctx.from.last_name].filter(Boolean).join(' ')
    const sent = await notifyClientDecision(ctx.api, repo, r.booking).catch(() => false)
    await ctx.answerCallbackQuery({ text: ok ? 'Подтверждено' : 'Отклонено' })
    const text = `${msg.text ?? ''}\n\n${ok ? '✅ Подтвердил' : '✖ Отклонил'}: ${who}${sent ? '. Клиенту отправлено сообщение.' : '. Клиент не в Telegram: свяжитесь вручную.'}`
    await ctx.editMessageText(text, { reply_markup: undefined }).catch(() => undefined)
  })

  bot.command('stop', async (ctx) => {
    if (ctx.chat.type !== 'private' || !ctx.from) return
    const { client } = await ensureClient(repo, ctx.from)
    await repo.updateClient(client.id, { opted_out_at: new Date().toISOString() })
    await ctx.reply(T[client.language].stopped)
  })

  // Кнопки согласия из старых сообщений бота (теперь бот их не присылает) продолжают работать
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

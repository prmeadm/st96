// Исполнитель воронок: проводит клиента по схеме. Логика повторяет предпросмотр в конструкторе.
import { bookingUrl, FORMAT_KEYS, type FormatKey, type ServiceKey } from '../booking/schedule'
import { serviceByLabel } from '../catalog'
import { hasFreeSlots } from '../booking/service'
import type { ClientRow, Repo } from '../repo'
import { isBlockedError, retryDelay } from './retry'
import {
  asArray, nextOf, parseDelay, parsePair, str,
  type ActionItem, type Funnel, type Graph, type Link, type Part, type Quick, type Rule, type RunRow,
} from './types'

export type Btn = { text: string; callback_data?: string; url?: string }

/** Отправка клиенту и сотрудникам. В проде это Telegram, в тестах запись вызовов. */
export interface Out {
  sendText(chatId: number, text: string, buttons?: Btn[][]): Promise<void>
  sendMedia(chatId: number, kind: 'image' | 'video' | 'videonote' | 'audio' | 'file', url: string, caption?: string, buttons?: Btn[][]): Promise<void>
  notifyAdmins(client: ClientRow, text: string): Promise<void>
}

export type Env = { repo: Repo; out: Out; now?: () => Date }

export type Outcome = 'waiting_input' | 'waiting_timer' | 'done' | 'handoff'

const MAX_STEPS = 60
const HUMAN_MUTE_MS = 12 * 3600_000
const nowOf = (env: Env) => (env.now ? env.now() : new Date())

/** Время и день недели по Минску */
function minskNow(d: Date) {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Minsk', hour: '2-digit', minute: '2-digit', weekday: 'short', year: 'numeric', month: '2-digit', day: '2-digit', hour12: false }).formatToParts(d)
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? ''
  const dow = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(get('weekday'))
  return { minutes: (parseInt(get('hour'), 10) % 24) * 60 + parseInt(get('minute'), 10), dow, iso: `${get('year')}-${get('month')}-${get('day')}` }
}
const DOW = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс']
const hm = (s: string) => {
  const m = s.match(/(\d{1,2}):(\d{2})/)
  return m ? parseInt(m[1], 10) * 60 + parseInt(m[2], 10) : null
}

type CondCtx = { client: ClientRow; tags: string[]; services: string[]; vars: Record<string, unknown>; now: Date; slotFree: boolean; booked: boolean }

const FORMAT_BY_LABEL: Record<string, FormatKey> = { 'телефонный звонок': 'call', видеозвонок: 'video', 'офлайн встреча': 'offline' }
// Услуга в блоке и условии: название с сайта (рус/англ) или его ключ
const serviceKeyOf = (label: string): ServiceKey | undefined => serviceByLabel(label)
const formatKeyOf = (label: string): FormatKey | undefined => FORMAT_BY_LABEL[label.toLowerCase()] ?? ((FORMAT_KEYS as readonly string[]).includes(label) ? (label as FormatKey) : undefined)

function evalRule(r: Rule, c: CondCtx): boolean {
  const v = str(r.value).trim()
  switch (r.kind) {
    case 'tag': return !!v && c.tags.some((t) => t.toLowerCase() === v.toLowerCase())
    case 'service': {
      const key = serviceKeyOf(v) ?? v.toLowerCase()
      return c.services.includes(key) || str(c.vars.service).toLowerCase() === v.toLowerCase()
    }
    case 'field': {
      const p = parsePair(v)
      if (!p) return false
      const map: Record<string, string | null> = {
        имя: c.client.name, name: c.client.name, телефон: c.client.phone, phone: c.client.phone, компания: c.client.company, company: c.client.company,
        email: c.client.email, почта: c.client.email, язык: c.client.language, language: c.client.language, ник: c.client.tg_username, telegram: c.client.tg_username, источник: c.client.source,
      }
      const val = map[p[0].toLowerCase()]
      return p[1] === '*' ? !!val : (val ?? '').toLowerCase() === p[1].toLowerCase()
    }
    case 'var': {
      const p = parsePair(v)
      if (!p) return false
      const val = c.vars[p[0]]
      return p[1] === '*' ? val != null && val !== '' : String(val ?? '').toLowerCase() === p[1].toLowerCase()
    }
    case 'time': {
      const m = v.match(/(\d{1,2}:\d{2}).*?(\d{1,2}:\d{2})/)
      if (!m) return false
      const from = hm(m[1])!, to = hm(m[2])!, cur = minskNow(c.now).minutes
      return from <= to ? cur >= from && cur < to : cur >= from || cur < to
    }
    case 'day': return v.toLowerCase().split(/[,\s]+/).includes(DOW[minskNow(c.now).dow])
    case 'date': {
      const iso = v.match(/\d{4}-\d{2}-\d{2}/g) ?? []
      const today = minskNow(c.now).iso
      return iso.length === 1 ? iso[0] === today : iso.length >= 2 ? today >= iso[0]! && today <= iso[1]! : false
    }
    case 'slot': return c.slotFree
    case 'booked': return c.booked
    default: return false
  }
}

const fill = (text: string, client: ClientRow, vars: Record<string, unknown>) =>
  text
    .replace(/\{имя\}|\{name\}/gi, client.name || client.tg_username || '')
    .replace(/\{компания\}|\{company\}/gi, client.company ?? '')
    .replace(/\{ник\}/gi, client.tg_username ? `@${client.tg_username}` : '')
    .replace(/\{запись\}|\{booking\}/gi, bookingUrl(client.id))
    .replace(/\{var\.([^}]+)\}/g, (_m, k: string) => String(vars[k] ?? ''))

export async function startFunnel(env: Env, funnel: Funnel, client: ClientRow): Promise<Outcome | null> {
  const g = funnel.graph
  const start = g.nodes.find((n) => n.type === 'start')
  if (!start) return null
  if (start.data.once === true && (await env.repo.hasRun(client.id, funnel.id))) return null
  const run = await env.repo.insertRun({ funnel_id: funnel.id, client_id: client.id, version: funnel.version, current_node: start.id, vars: {} })
  await env.repo.insertEvent({ run_id: run.id, funnel_id: funnel.id, client_id: client.id, node_id: start.id, event: 'start' })
  return advance(env, funnel, client, run, nextOf(g, start.id), {})
}

/** callback_data кнопки: fb:<запуск>:<кнопка>[:<блок>] (Telegram ограничивает 64 байтами, блок добавляем, если помещается). */
export function quickData(runId: string, quickId: string, nodeId: string): string {
  const withNode = `fb:${runId}:${quickId}:${nodeId}`
  return /^[\w-]{1,24}$/.test(nodeId) && new TextEncoder().encode(withNode).length <= 64 ? withNode : `fb:${runId}:${quickId}`
}

/**
 * Нажатие кнопки быстрого ответа. Работает и для кнопок старых сообщений: клиент может вернуться к любой ветке,
 * воронка продолжится с неё (другой идущий запуск этого клиента останавливается).
 */
export async function handleClick(env: Env, client: ClientRow, run: RunRow, quickId: string, nodeHint?: string): Promise<'ok' | 'stale'> {
  const funnel = await env.repo.getFunnel(run.funnel_id)
  if (!funnel) return 'stale'
  const nodes = funnel.graph.nodes
  const holds = (n?: (typeof nodes)[number]) => !!n && n.type === 'message' && asArray<Quick>(n.data.quick).some((x) => x.id === quickId)
  const node = [nodeHint, run.current_node].map((id) => nodes.find((n) => n.id === id)).find(holds) ?? nodes.find(holds)
  if (!node) return 'stale'
  const q = asArray<Quick>(node.data.quick).find((x) => x.id === quickId)!
  const active = await env.repo.findActiveRun(client.id)
  if (active && active.id !== run.id) await env.repo.updateRun(active.id, { status: 'stopped', finished_at: new Date().toISOString() })
  await env.repo.insertEvent({ run_id: run.id, funnel_id: run.funnel_id, client_id: client.id, node_id: node.id, event: 'click', data: { quick: q.id, label: q.label } })
  await env.repo.insertMessage({ client_id: client.id, direction: 'in', kind: 'text', text: q.label, tg_chat_id: client.tg_user_id, tg_message_id: null })
  const target = nextOf(funnel.graph, node.id, `qr-${q.id}`)
  const vars = { ...run.vars, __wait: null, __resume: null, __retries: 0 }
  await env.repo.updateRun(run.id, { status: 'running', current_node: node.id, wake_at: null, finished_at: null, vars })
  await advance(env, funnel, client, { ...run, status: 'running', vars }, target, {})
  return 'ok'
}

/** Клиент написал текст, пока воронка ждёт кнопку: идём по выходу «Если клиент написал другое». */
export async function handleFreeText(env: Env, client: ClientRow, run: RunRow): Promise<boolean> {
  const funnel = await env.repo.getFunnel(run.funnel_id)
  if (!funnel || run.status !== 'waiting' || run.vars.__wait !== 'input' || !run.current_node) return false
  const target = nextOf(funnel.graph, run.current_node, 'out')
  if (!target) return false
  await env.repo.updateRun(run.id, { status: 'running', vars: { ...run.vars, __wait: null } })
  await advance(env, funnel, client, { ...run, status: 'running' }, target, {})
  return true
}

/** Продолжение после паузы. */
export async function resumeRun(env: Env, runId: string): Promise<'resumed' | 'skipped'> {
  const run = await env.repo.getRun(runId)
  if (!run || run.status !== 'waiting' || run.vars.__wait !== 'timer') return 'skipped'
  const funnel = await env.repo.getFunnel(run.funnel_id)
  const client = await env.repo.findClientById(run.client_id)
  const r = run.vars.__resume as { node: string; item: number; retry?: boolean } | undefined
  if (!funnel || !client || !r) {
    await env.repo.updateRun(run.id, { status: 'failed' })
    return 'skipped'
  }
  await env.repo.updateRun(run.id, { status: 'running', wake_at: null, vars: { ...run.vars, __wait: null, __resume: null } })
  await advance(env, funnel, client, { ...run, status: 'running' }, r.node, { itemIndex: r.item, proactive: !r.retry })
  return 'resumed'
}

/** Продолжение воронки после решения по записи: выход «confirmed» (подтвердили) или «declined» (отклонили / другое время). */
export async function resumeBooking(env: Env, runId: string, handle: 'confirmed' | 'declined'): Promise<'resumed' | 'skipped'> {
  const run = await env.repo.getRun(runId)
  if (!run || run.status !== 'waiting' || run.vars.__wait !== 'booking') return 'skipped'
  const funnel = await env.repo.getFunnel(run.funnel_id)
  const client = await env.repo.findClientById(run.client_id)
  const r = run.vars.__resume as { node: string } | undefined
  if (!funnel || !client || !r) {
    await env.repo.updateRun(run.id, { status: 'failed' })
    return 'skipped'
  }
  await env.repo.insertEvent({ run_id: run.id, funnel_id: funnel.id, client_id: client.id, node_id: r.node, event: handle === 'confirmed' ? 'booking_confirmed' : 'booking_declined' })
  const vars = { ...run.vars, __wait: null, __resume: null }
  const next = nextOf(funnel.graph, r.node, handle)
  if (!next) {
    await env.repo.updateRun(run.id, { status: 'done', vars, finished_at: new Date().toISOString() })
    return 'resumed'
  }
  await env.repo.updateRun(run.id, { status: 'running', wake_at: null, vars })
  await advance(env, funnel, client, { ...run, status: 'running', vars }, next, { proactive: true })
  return 'resumed'
}

/**
 * Сообщения блока: каждое фото, видео, аудио или файл уходит одним сообщением с соседним текстом
 * (текст перед медиа считается его подписью, иначе берётся текст после). Остальной текст идёт отдельно.
 */
export function groupParts(parts: Part[]): { media?: Part; text?: Part }[] {
  const used = new Set<number>()
  const units: { order: number; media?: Part; text?: Part }[] = []
  parts.forEach((p, i) => {
    if (p.kind === 'text') return
    // у кружка подписи нет: соседний текст уходит следующим сообщением прямо под кружком (это делает отправка)
    const free = (j: number) => parts[j]?.kind === 'text' && !used.has(j)
    const t = free(i - 1) ? i - 1 : free(i + 1) ? i + 1 : -1
    if (t >= 0) used.add(t)
    units.push({ order: t >= 0 ? Math.min(i, t) : i, media: p, text: t >= 0 ? parts[t] : undefined })
  })
  parts.forEach((p, i) => { if (p.kind === 'text' && !used.has(i)) units.push({ order: i, text: p }) })
  return units.sort((a, b) => a.order - b.order).map(({ media, text }) => ({ media, text }))
}

type Opts = { itemIndex?: number; proactive?: boolean }

export async function advance(env: Env, funnel: Funnel, client: ClientRow, run: RunRow, from: string | null, opts: Opts): Promise<Outcome> {
  const g: Graph = funnel.graph
  const repo = env.repo
  const vars: Record<string, unknown> = { ...run.vars }
  let id = from
  let firstItem = opts.itemIndex ?? 0
  const chat = client.tg_user_id
  const lang = client.language
  // Воронка — диалог, который клиент начал сам, поэтому её шаги (и после паузы) уходят всем, кроме отписавшихся (/stop).
  // Согласие на рассылки (consent_at) нужно только для массовых рассылок.
  const mayPush = !opts.proactive || !client.opted_out_at
  const event = (node: string, ev: string, data?: Record<string, unknown>) => repo.insertEvent({ run_id: run.id, funnel_id: funnel.id, client_id: client.id, node_id: node, event: ev, data })
  const finish = async (status: 'done' | 'stopped'): Promise<Outcome> => {
    await repo.updateRun(run.id, { status, current_node: id, vars, finished_at: new Date().toISOString() })
    return status === 'stopped' ? 'handoff' : 'done'
  }

  let guard = 0
  let sends = 0
  let pos = 0 // какая часть сообщения или какое действие блока сейчас выполняется (для продолжения после сбоя)
  while (id && guard++ < MAX_STEPS) {
    const node = g.nodes.find((n) => n.id === id)
    if (!node) break
    const d = node.data
    try {
    if (firstItem === 0) await event(node.id, 'enter')

    if (node.type === 'message') {
      const parts = asArray<Part>(d.parts)
      const quick = asArray<Quick>(d.quick)
      const links = asArray<Link>(d.links)
      const kb: Btn[][] = [
        ...quick.filter((q) => str(lang === 'en' && q.en ? q.en : q.label).trim()).map((q) => [{ text: lang === 'en' && q.en ? q.en : q.label, callback_data: quickData(run.id, q.id, node.id) }]),
        ...links.filter((l) => str(l.label).trim() && /^(https?:\/\/|tg:\/\/)\S+$/i.test(str(l.url).trim())).map((l) => [{ text: l.label, url: l.url.trim() }]),
      ]
      const sendable = parts.filter((p) => (p.kind === 'text' ? !!str(lang === 'en' && p.en ? p.en : p.text).trim() : !!p.url))
      if (chat && sendable.length && mayPush) {
        // Защита от зацикленной схемы: не больше 10 сообщений за один проход
        if (++sends > 10) {
          await event(node.id, 'loop_guard')
          return finish('done')
        }
        // Фото и видео уходят одним сообщением с соседним текстом (медиа сверху, текст подписью), как при отправке из Telegram
        const units = groupParts(sendable)
        for (let i = Math.min(firstItem, units.length - 1); i < units.length; i++) {
          pos = i
          const u = units[i]!
          const buttons = i === units.length - 1 && kb.length ? kb : undefined
          const text = u.text ? fill(str(lang === 'en' && u.text.en ? u.text.en : u.text.text), client, vars) : ''
          if (!u.media) {
            await env.out.sendText(chat, text, buttons)
            await repo.insertMessage({ client_id: client.id, direction: 'out', kind: 'text', text, tg_chat_id: chat, tg_message_id: null })
          } else {
            await env.out.sendMedia(chat, u.media.kind as 'image' | 'video' | 'videonote' | 'audio' | 'file', u.media.url!, text || undefined, buttons)
            await repo.insertMessage({ client_id: client.id, direction: 'out', kind: u.media.kind === 'image' ? 'photo' : u.media.kind === 'file' ? 'file' : u.media.kind === 'videonote' ? 'video' : (u.media.kind as 'video' | 'audio'), text: text || null, tg_chat_id: chat, tg_message_id: null })
          }
        }
      } else if (!mayPush) {
        await event(node.id, 'skipped_no_consent')
        if (quick.length) return finish('done')
      }
      firstItem = 0
      if (quick.length && chat && mayPush) {
        await repo.updateRun(run.id, { status: 'waiting', current_node: node.id, vars: { ...vars, __wait: 'input', __retries: 0 } })
        return 'waiting_input'
      }
      id = nextOf(g, node.id)
      continue
    }

    if (node.type === 'condition') {
      const rules = asArray<Rule>(d.rules)
      const ctx: CondCtx = {
        client, vars, now: nowOf(env), tags: await repo.listTags(client.id),
        services: (await repo.listLeads(client.id)).map((l) => l.service_key).filter((x): x is string => !!x),
        slotFree: rules.some((r) => r.kind === 'slot') ? await hasFreeSlots(repo, nowOf(env)) : false,
        booked: rules.some((r) => r.kind === 'booked') ? (await repo.countUpcomingBookings(client.id, nowOf(env).toISOString())) > 0 : false,
      }
      const results = rules.map((r) => evalRule(r, ctx))
      const ok = rules.length > 0 && (d.mode === 'any' ? results.some(Boolean) : results.every(Boolean))
      await event(node.id, ok ? 'yes' : 'no')
      id = nextOf(g, node.id, ok ? 'yes' : 'no')
      continue
    }

    if (node.type === 'action') {
      const items = asArray<ActionItem>(d.items)
      for (let i = firstItem; i < items.length; i++) {
        pos = i
        const a = items[i]
        const v = str(a.value).trim()
        if (a.kind === 'delay') {
          const ms = parseDelay(v)
          if (ms === null) { await event(node.id, 'bad_delay', { value: v }); continue }
          const at = new Date(nowOf(env).getTime() + ms)
          await repo.updateRun(run.id, { status: 'waiting', current_node: node.id, wake_at: at.toISOString(), vars: { ...vars, __wait: 'timer', __resume: { node: node.id, item: i + 1 } } })
          await repo.enqueueJob('resume_run', at, { runId: run.id })
          return 'waiting_timer'
        }
        if (a.kind === 'notify') await env.out.notifyAdmins(client, fill(v, client, vars))
        else if (a.kind === 'addtag' || a.kind === 'deltag') {
          for (const t of v.split(',').map((x) => x.trim()).filter(Boolean)) await (a.kind === 'addtag' ? repo.addTag(client.id, t) : repo.removeTag(client.id, t))
        } else if (a.kind === 'segment' && v) await repo.addTag(client.id, `сегмент:${v}`)
        else if (a.kind === 'setvar') {
          const p = parsePair(v)
          if (p) vars[p[0]] = p[1]
        } else if (a.kind === 'conv') await event(node.id, 'conversion', { value: v })
        else await event(node.id, 'unsupported_action', { kind: a.kind })
      }
      firstItem = 0
      id = nextOf(g, node.id)
      continue
    }

    if (node.type === 'handoff') {
      const text = fill(str(d.message), client, vars)
      if (chat && text.trim() && mayPush) await env.out.sendText(chat, text)
      if (d.notify !== false) await env.out.notifyAdmins(client, 'Клиент просит человека: воронка передала диалог.')
      await repo.updateClient(client.id, { human_until: new Date(nowOf(env).getTime() + HUMAN_MUTE_MS).toISOString() })
      await event(node.id, 'handoff')
      return finish('stopped')
    }

    if (node.type === 'booking') {
      // Клиент выбирает время на странице записи по личной ссылке; воронка ждёт решения администратора
      if (!chat || !mayPush) {
        await event(node.id, 'booking_skipped_no_consent')
        return finish('done')
      }
      const sv = asArray<string>(d.services).map(serviceKeyOf).filter((x): x is ServiceKey => !!x)
      const fm = asArray<string>(d.formats).map(formatKeyOf).filter((x): x is FormatKey => !!x)
      const url = bookingUrl(client.id, { service: sv.length === 1 ? sv[0] : undefined, format: fm.length === 1 ? fm[0] : undefined, run: run.id, node: node.id })
      const text = fill(str(lang === 'en' && d.messageEn ? d.messageEn : d.message) || (lang === 'en' ? 'Pick a convenient time for the meeting:' : 'Выберите удобное время для встречи:'), client, vars)
      await env.out.sendText(chat, text, [[{ text: lang === 'en' ? 'Choose a time' : 'Выбрать время', url }]])
      await repo.insertMessage({ client_id: client.id, direction: 'out', kind: 'text', text, tg_chat_id: chat, tg_message_id: null })
      await repo.updateRun(run.id, { status: 'waiting', current_node: node.id, vars: { ...vars, __wait: 'booking', __resume: { node: node.id } } })
      await event(node.id, 'booking_link')
      return 'waiting_input'
    }

    if (node.type === 'ai') {
      await event(node.id, 'ai_skipped')
      id = nextOf(g, node.id)
      continue
    }

    // start, note и неизвестные блоки: идём дальше
    id = node.type === 'start' ? nextOf(g, node.id) : null
    } catch (e) {
      // Сбой отправки не должен останавливать воронку: временный (429, сеть, 5xx) повторяем по расписанию с того же места,
      // окончательный (клиент заблокировал бота, неверный запрос) записываем и сообщаем сотрудникам в тему клиента.
      const msg = e instanceof Error ? e.message : String(e)
      const tries = Number(vars.__retries ?? 0)
      const delay = retryDelay(e)
      console.error('funnel step failed', run.id, node.id, msg)
      await event(node.id, 'send_failed', { error: msg.slice(0, 300), tries }).catch(() => undefined)
      if (delay !== null && tries < 5) {
        const at = new Date(nowOf(env).getTime() + Math.max(delay, 3000))
        await repo.updateRun(run.id, { status: 'waiting', current_node: node.id, wake_at: at.toISOString(), vars: { ...vars, __wait: 'timer', __retries: tries + 1, __resume: { node: node.id, item: pos, retry: !opts.proactive } } })
        await repo.enqueueJob('resume_run', at, { runId: run.id })
        return 'waiting_timer'
      }
      await repo.updateRun(run.id, { status: 'failed', current_node: node.id, vars, finished_at: new Date().toISOString() }).catch(() => undefined)
      if (!isBlockedError(e)) await env.out.notifyAdmins(client, `⚠️ Воронка «${funnel.name}» не смогла отправить клиенту блок ${node.id}: ${msg.slice(0, 200)}`).catch(() => undefined)
      return 'done'
    }
  }

  if (guard >= MAX_STEPS) await event(from ?? 'unknown', 'loop_guard')
  return finish('done')
}

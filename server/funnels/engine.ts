// Исполнитель воронок: проводит клиента по схеме. Логика повторяет предпросмотр в конструкторе.
import { bookingUrl, FORMAT_KEYS, type FormatKey, type ServiceKey } from '../booking/schedule'
import { serviceByLabel } from '../catalog'
import { hasFreeSlots } from '../booking/service'
import type { ClientRow, Repo } from '../repo'
import {
  asArray, nextOf, parseDelay, parsePair, str,
  type ActionItem, type Funnel, type Graph, type Link, type Part, type Quick, type Rule, type RunRow,
} from './types'

export type Btn = { text: string; callback_data?: string; url?: string }

/** Отправка клиенту и сотрудникам. В проде это Telegram, в тестах запись вызовов. */
export interface Out {
  sendText(chatId: number, text: string, buttons?: Btn[][]): Promise<void>
  sendMedia(chatId: number, kind: 'image' | 'video' | 'audio' | 'file', url: string, caption?: string, buttons?: Btn[][]): Promise<void>
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

/** Нажатие кнопки быстрого ответа. */
export async function handleClick(env: Env, client: ClientRow, run: RunRow, quickId: string): Promise<'ok' | 'stale'> {
  const funnel = await env.repo.getFunnel(run.funnel_id)
  if (!funnel || run.status !== 'waiting' || run.vars.__wait !== 'input' || !run.current_node) return 'stale'
  const node = funnel.graph.nodes.find((n) => n.id === run.current_node)
  const q = asArray<Quick>(node?.data.quick).find((x) => x.id === quickId)
  if (!node || !q) return 'stale'
  await env.repo.insertEvent({ run_id: run.id, funnel_id: run.funnel_id, client_id: client.id, node_id: node.id, event: 'click', data: { quick: q.id, label: q.label } })
  await env.repo.insertMessage({ client_id: client.id, direction: 'in', kind: 'text', text: q.label, tg_chat_id: client.tg_user_id, tg_message_id: null })
  const target = nextOf(funnel.graph, node.id, `qr-${q.id}`)
  await env.repo.updateRun(run.id, { status: 'running', vars: { ...run.vars, __wait: null } })
  await advance(env, funnel, client, { ...run, status: 'running' }, target, {})
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
  const r = run.vars.__resume as { node: string; item: number } | undefined
  if (!funnel || !client || !r) {
    await env.repo.updateRun(run.id, { status: 'failed' })
    return 'skipped'
  }
  await env.repo.updateRun(run.id, { status: 'running', wake_at: null, vars: { ...run.vars, __wait: null, __resume: null } })
  await advance(env, funnel, client, { ...run, status: 'running' }, r.node, { itemIndex: r.item, proactive: true })
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

type Opts = { itemIndex?: number; proactive?: boolean }

export async function advance(env: Env, funnel: Funnel, client: ClientRow, run: RunRow, from: string | null, opts: Opts): Promise<Outcome> {
  const g: Graph = funnel.graph
  const repo = env.repo
  const vars: Record<string, unknown> = { ...run.vars }
  let id = from
  let firstItem = opts.itemIndex ?? 0
  const chat = client.tg_user_id
  const lang = client.language
  // Отложенные сообщения (после паузы) уходят только тем, кто согласился на рассылки
  const mayPush = !opts.proactive || (!!client.consent_at && !client.opted_out_at)
  const event = (node: string, ev: string, data?: Record<string, unknown>) => repo.insertEvent({ run_id: run.id, funnel_id: funnel.id, client_id: client.id, node_id: node, event: ev, data })
  const finish = async (status: 'done' | 'stopped'): Promise<Outcome> => {
    await repo.updateRun(run.id, { status, current_node: id, vars, finished_at: new Date().toISOString() })
    return status === 'stopped' ? 'handoff' : 'done'
  }

  let guard = 0
  let sends = 0
  while (id && guard++ < MAX_STEPS) {
    const node = g.nodes.find((n) => n.id === id)
    if (!node) break
    const d = node.data
    await event(node.id, 'enter')

    if (node.type === 'message') {
      const parts = asArray<Part>(d.parts)
      const quick = asArray<Quick>(d.quick)
      const links = asArray<Link>(d.links)
      const kb: Btn[][] = [
        ...quick.map((q) => [{ text: lang === 'en' && q.en ? q.en : q.label, callback_data: `fb:${run.id}:${q.id}` }]),
        ...links.map((l) => [{ text: l.label, url: l.url }]),
      ]
      const sendable = parts.filter((p) => (p.kind === 'text' ? !!str(lang === 'en' && p.en ? p.en : p.text).trim() : !!p.url))
      if (chat && sendable.length && mayPush) {
        // Защита от зацикленной схемы: не больше 10 сообщений за один проход
        if (++sends > 10) {
          await event(node.id, 'loop_guard')
          return finish('done')
        }
        for (let i = 0; i < sendable.length; i++) {
          const p = sendable[i]
          const buttons = i === sendable.length - 1 && kb.length ? kb : undefined
          if (p.kind === 'text') {
            const text = fill(str(lang === 'en' && p.en ? p.en : p.text), client, vars)
            await env.out.sendText(chat, text, buttons)
            await repo.insertMessage({ client_id: client.id, direction: 'out', kind: 'text', text, tg_chat_id: chat, tg_message_id: null })
          } else {
            await env.out.sendMedia(chat, p.kind, p.url!, undefined, buttons)
            await repo.insertMessage({ client_id: client.id, direction: 'out', kind: p.kind === 'image' ? 'photo' : p.kind === 'file' ? 'file' : p.kind, text: null, tg_chat_id: chat, tg_message_id: null })
          }
        }
      } else if (!mayPush) {
        await event(node.id, 'skipped_no_consent')
        if (quick.length) return finish('done')
      }
      if (quick.length && chat && mayPush) {
        await repo.updateRun(run.id, { status: 'waiting', current_node: node.id, vars: { ...vars, __wait: 'input' } })
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
  }

  if (guard >= MAX_STEPS) await event(from ?? 'unknown', 'loop_guard')
  return finish('done')
}

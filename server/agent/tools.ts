// Единственное, что умеет агент. Уровень риска задаёт код, а не модель: модель только выбирает инструмент из списка.
import type { Api } from 'grammy'
import { startBroadcast, type Segment } from '../broadcasts'
import type { Repo } from '../repo'
import { TPL_GOALS, TPL_SERVICES, TPL_TASKS } from '../templates'
import { parseJson, type Llm } from './llm'
import type { AgentStats, AgentTask, Risk, Step } from './types'

export type ToolCtx = {
  repo: Repo
  api: Api | null
  groupChatId: number | null
  task: AgentTask
  /** вызов модели со счётчиком (лимит на задание) */
  ask: Llm
  /** результаты уже выполненных шагов и id черновика рассылки из них */
  done: Step[]
}
export type ToolResult = { text: string; ref?: string }
export type Tool = { name: string; risk: Risk; describe: string; run: (ctx: ToolCtx, step: Step) => Promise<ToolResult> }

const SERVICE_KEYS: Record<string, string> = { neurophoto: 'Нейрофотосессия', retouch: 'Ретушь (Retouch Studio)', digital_office: 'Цифровой офис', production: 'Продакшн', other: 'Другое' }
const SYSTEM = 'Ты помощник студии ST96 (ретушь, нейрофотосессия, съёмка, цифровой офис, продакшн). Пишешь по-русски, коротко и по делу, без выдуманных фактов, цен и сроков. Отвечай только JSON без пояснений.'

const history = (ctx: ToolCtx) => ctx.done.filter((s) => s.result).map((s) => `• ${s.text}: ${s.result!.slice(0, 1200)}`).join('\n') || '(ещё ничего не сделано)'
const prompt = (ctx: ToolCtx, step: Step, shape: string) =>
  `Задание: ${ctx.task.text}\nТекущий шаг: ${step.text}\nУже сделано:\n${history(ctx)}\n\nВерни JSON вида ${shape}`

async function askJson<T>(ctx: ToolCtx, step: Step, shape: string): Promise<T> {
  return parseJson<T>(await ctx.ask({ system: SYSTEM, user: prompt(ctx, step, shape) }))
}
const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '')

export function formatStats(s: AgentStats): string {
  const byService = Object.entries(s.leads30).map(([k, n]) => `${SERVICE_KEYS[k] ?? k}: ${n}`).join(', ') || 'нет заявок'
  const byStatus = Object.entries(s.leadStatus).map(([k, n]) => `${k}: ${n}`).join(', ') || 'нет'
  return `Клиентов ${s.clients}, согласны на рассылки ${s.consented}, отписались ${s.optedOut}. Заявок за 30 дней по услугам: ${byService}; по статусам: ${byStatus}; за 7 дней: ${s.newLeads7}. Воронок ${s.funnels} (опубликовано ${s.publishedFunnels}), шаблонов ${s.templates}, рассылок ${s.broadcasts}.`
}

export const TOOLS: Tool[] = [
  {
    name: 'read_stats', risk: 'read', describe: 'Сводка без имён: сколько клиентов, согласий, заявок по услугам и статусам, воронок, шаблонов, рассылок',
    run: async (ctx) => ({ text: formatStats(await ctx.repo.agentStats()) }),
  },
  {
    name: 'read_templates', risk: 'read', describe: 'Прочитать существующие шаблоны сообщений (названия и начало текста)',
    run: async (ctx) => {
      const list = (await ctx.repo.listTemplates()).slice(0, 20)
      return { text: list.length ? list.map((t) => `«${t.title}» (${t.task}): ${t.body.slice(0, 160)}`).join('\n') : 'Шаблонов пока нет' }
    },
  },
  {
    name: 'write_text', risk: 'write', describe: 'Придумать текст или варианты текстов под задачу (ничего не сохраняет и не отправляет)',
    run: async (ctx, step) => {
      const r = await askJson<{ text?: string }>(ctx, step, '{"text": "готовый текст или несколько пронумерованных вариантов"}')
      const text = str(r.text, 4000)
      if (!text) throw new Error('Модель не вернула текст')
      return { text }
    },
  },
  {
    name: 'save_template', risk: 'write', describe: 'Сохранить один текст в библиотеку шаблонов (название получит пометку «[Агент]»)',
    run: async (ctx, step) => {
      const r = await askJson<{ title?: string; body?: string; task?: string; goal?: string; services?: string[] }>(
        ctx, step, `{"title": "короткое название", "body": "текст сообщения клиенту, можно {имя}", "task": "одно из: ${TPL_TASKS.join(' | ')}", "goal": "одно из: ${TPL_GOALS.join(' | ')}", "services": ["из: ${TPL_SERVICES.join(', ')}"]}`)
      const title = str(r.title, 80)
      const body = str(r.body, 3500)
      if (!title || !body) throw new Error('Модель не дала название или текст шаблона')
      const services = (Array.isArray(r.services) ? r.services : []).filter((x) => TPL_SERVICES.includes(x))
      const t = await ctx.repo.insertTemplate({
        title: `[Агент] ${title}`, kind: 'text', body,
        task: TPL_TASKS.includes(r.task ?? '') ? r.task! : TPL_TASKS[0]!, goal: TPL_GOALS.includes(r.goal ?? '') ? r.goal! : TPL_GOALS[0]!, services: services.length ? services : ['Общее'],
      })
      return { text: `Сохранён шаблон «[Агент] ${title}»`, ref: t.id }
    },
  },
  {
    name: 'draft_broadcast', risk: 'write', describe: 'Создать черновик рассылки с текстом и сегментом (не запускает её)',
    run: async (ctx, step) => {
      const r = await askJson<{ title?: string; body?: string; services?: string[]; language?: string }>(
        ctx, step, `{"title": "название для себя", "body": "текст рассылки, можно {имя}", "services": ["ключи услуг из: ${Object.keys(SERVICE_KEYS).join(', ')}, либо пусто для всех"], "language": "ru | en | пусто для всех"}`)
      const title = str(r.title, 80)
      const body = str(r.body, 3500)
      if (!title || !body) throw new Error('Модель не дала название или текст рассылки')
      const segment: Segment = {}
      const services = (Array.isArray(r.services) ? r.services : []).filter((x) => x in SERVICE_KEYS)
      if (services.length) segment.services = services
      if (r.language === 'ru' || r.language === 'en') segment.language = r.language
      const b = await ctx.repo.insertBroadcastDraft({ title: `[Агент] ${title}`, body, segment })
      return { text: `Создан черновик рассылки «[Агент] ${title}». Его можно открыть в разделе «Рассылки»`, ref: b.id }
    },
  },
  {
    name: 'notify_admin', risk: 'send', describe: 'Отправить короткое сообщение в рабочую группу администраторов (например, тест или итог)',
    run: async (ctx, step) => {
      if (!ctx.api || !ctx.groupChatId) throw new Error('Группа администраторов не настроена')
      const r = await askJson<{ text?: string }>(ctx, step, '{"text": "сообщение администраторам, до 500 знаков"}')
      const text = str(r.text, 500)
      if (!text) throw new Error('Модель не дала текст сообщения')
      await ctx.api.sendMessage(ctx.groupChatId, `🤖 Агент: ${text}`)
      return { text: 'Сообщение отправлено в группу администраторов' }
    },
  },
  {
    name: 'start_broadcast', risk: 'danger', describe: 'ЗАПУСТИТЬ рассылку клиентам (черновик из предыдущего шага draft_broadcast). Выполняется только после вашего подтверждения',
    run: async (ctx) => {
      const ref = [...ctx.done].reverse().find((s) => s.tool === 'draft_broadcast' && s.ref)?.ref
      if (!ref) throw new Error('Нет черновика рассылки: перед запуском нужен шаг draft_broadcast')
      if (!ctx.api) throw new Error('Telegram не настроен')
      const r = await startBroadcast(ctx.repo, ctx.api, ref)
      if (!r.ok) throw new Error(r.error)
      return { text: `Рассылка запущена, получателей: ${r.total}` }
    },
  },
  {
    name: 'report', risk: 'write', describe: 'Составить итоговый отчёт (добавляется последним шагом автоматически)',
    run: async (ctx, step) => {
      const r = await askJson<{ report?: string }>(ctx, step, '{"report": "итоговый отчёт на 3-8 строк: что сделано, что получилось, что осталось сделать человеку"}')
      const report = str(r.report, 3000)
      if (!report) throw new Error('Модель не составила отчёт')
      return { text: report }
    },
  },
]

export const TOOL_BY_NAME = new Map(TOOLS.map((t) => [t.name, t]))
export const PLANNABLE = TOOLS.filter((t) => t.name !== 'report')

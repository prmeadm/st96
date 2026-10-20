// Единственное, что умеет агент. Уровень риска задаёт код, а не модель: модель только выбирает инструмент из списка.
import type { Api } from 'grammy'
import { startBroadcast, type Segment } from '../broadcasts'
import type { Repo } from '../repo'
import { SITE_SERVICES, UNKNOWN_SERVICE, servicesBrief } from '../catalog'
import { TPL_GENERAL, TPL_GOALS, TPL_SERVICES, TPL_TASKS } from '../templates'
import { emptyStats, importSlice, MAX_EXPORT_BYTES, parseExport, planImport, summarize, totalOf, type ImportStats } from './groupImport'
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
/** partial: шаг не закончен, продолжится на следующем запуске с этого места */
export type ToolResult = { text: string; ref?: string; partial?: { cursor: number; carry: Record<string, unknown> } }
export type Tool = { name: string; risk: Risk; describe: string; run: (ctx: ToolCtx, step: Step) => Promise<ToolResult> }

// Услуги и их описание только с сайта (server/catalog.ts)
const SERVICE_KEYS: Record<string, string> = Object.fromEntries(SITE_SERVICES.map((s) => [s.key, s.ru]))
const SYSTEM = `Ты помощник студии ST96 (st96.by). Услуги студии — только эти, с описанием с сайта:
${servicesBrief('ru')}
Не придумывай другие услуги, цены, сроки и факты, которых нет выше. Пишешь по-русски, коротко и по делу. Отвечай только JSON без пояснений.`

const history = (ctx: ToolCtx) => ctx.done.filter((s) => s.result).map((s) => `• ${s.text}: ${s.result!.slice(0, 1200)}`).join('\n') || '(ещё ничего не сделано)'
const prompt = (ctx: ToolCtx, step: Step, shape: string) =>
  `Задание: ${ctx.task.text}\nТекущий шаг: ${step.text}\nУже сделано:\n${history(ctx)}\n\nВерни JSON вида ${shape}`

async function askJson<T>(ctx: ToolCtx, step: Step, shape: string): Promise<T> {
  return parseJson<T>(await ctx.ask({ system: SYSTEM, user: prompt(ctx, step, shape) }))
}
const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '')

export function formatStats(s: AgentStats): string {
  const byService = Object.entries(s.leads30).map(([k, n]) => `${SERVICE_KEYS[k] ?? (k === UNKNOWN_SERVICE ? 'не указана' : k)}: ${n}`).join(', ') || 'нет заявок'
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
        task: TPL_TASKS.includes(r.task ?? '') ? r.task! : TPL_TASKS[0]!, goal: TPL_GOALS.includes(r.goal ?? '') ? r.goal! : TPL_GOALS[0]!, services: services.length ? services : [TPL_GENERAL],
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
    name: 'import_group_export', risk: 'write',
    describe: 'Собрать клиентов и заявки из ИСТОРИИ группы по ПРИЛОЖЕННОМУ к заданию файлу экспорта чата Telegram (result.json): создаёт клиентов и заявки, пропускает тестовые и уже загруженные, помечает новых тегом. Бот сам историю группы читать не умеет, поэтому без приложенного .json этот шаг невозможен',
    run: async (ctx, step) => {
      if (!ctx.groupChatId) throw new Error('Не задан TELEGRAM_CHAT_ID: неизвестно, какая это группа')
      const url = ctx.task.attach.find((a) => /\.json(\?|#|$)/i.test(a))
      if (!url) throw new Error('К заданию не приложен файл экспорта группы (.json). Как получить: Telegram Desktop, открыть группу, меню ⋮, «Экспорт истории чата», формат JSON, без медиа. Загрузите result.json в форме задания.')
      const res = await fetch(url, { signal: AbortSignal.timeout(25_000) }).catch(() => null)
      if (!res || !res.ok) throw new Error('Не удалось скачать приложенный файл экспорта')
      const len = Number(res.headers.get('content-length') ?? 0)
      if (len > MAX_EXPORT_BYTES) throw new Error('Файл экспорта больше 25 МБ: выгрузите без медиа или за более короткий период')
      let parsed: ReturnType<typeof parseExport>
      try {
        parsed = parseExport(JSON.parse(await res.text()))
      } catch (e) {
        throw new Error(e instanceof SyntaxError ? 'Файл не читается как JSON' : (e as Error).message)
      }
      const plan = planImport(parsed.messages)
      const total = totalOf(plan)
      const carry = step.carry ?? {}
      let extra = Array.isArray(carry.extra) ? (carry.extra as string[]) : null
      if (!extra) {
        // Слова-признаки тестовых заявок из текста задания (например «кроме тестовых» или «без ТЕСТ-УДАЛИТЬ»); база шаблонных слов зашита в код
        extra = await askJson<{ exclude?: string[] }>(ctx, step, '{"exclude": ["слова из задания, по которым нужно считать заявку тестовой; пусто, если таких нет"]}').then((r) => (Array.isArray(r.exclude) ? r.exclude.filter((x) => typeof x === 'string' && x.trim().length >= 3).map((x) => x.trim()).slice(0, 10) : [])).catch(() => [])
      }
      const clients0 = typeof carry.clients0 === 'number' ? carry.clients0 : (await ctx.repo.agentStats()).clients
      const stats: ImportStats = (carry.stats as ImportStats | undefined) ?? emptyStats()
      const samples: string[] = Array.isArray(carry.samples) ? (carry.samples as string[]) : []
      const from = step.cursor ?? 0
      const next = await importSlice(ctx.repo, ctx.groupChatId, plan, from, stats, { extraWords: extra, budgetMs: 15_000, samples })
      if (next <= from && from < total) throw new Error('Импорт не продвигается, остановлен')
      const clientsNow = (await ctx.repo.agentStats()).clients
      const done = next >= total
      const reachable = done ? (await ctx.repo.listAudience()).length : undefined
      let text = summarize(stats, next, total, clients0, clientsNow, reachable)
      if (done && samples.length) text += `\nПропущено как тестовые (примеры): ${samples.join(' | ')}`
      return done ? { text } : { text, partial: { cursor: next, carry: { extra, clients0, stats, samples } } }
    },
  },
  {
    name: 'notify_admin', risk: 'send', describe: 'Только уведомить людей короткой запиской в рабочую группу администраторов. Это НЕ способ выполнить работу: ничего не собирает, не загружает и не считает',
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

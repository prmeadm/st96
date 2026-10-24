// Жизненный цикл задания: план -> согласование -> выполнение -> отчёт. Опасные шаги ждут отдельного подтверждения.
import type { Api } from 'grammy'
import type { Repo } from '../repo'
import { LlmError, parseJson, type Llm } from './llm'
import { PLANNABLE, TOOL_BY_NAME, TOOLS } from './tools'
import type { AgentTask, LogLine, Step } from './types'

export type AgentDeps = { repo: Repo; llm: Llm; api: Api | null; groupChatId: number | null }
export type EngineResult = { ok: true; task: AgentTask } | { ok: false; error: string; status: number }

export const MAX_STEPS = 7
export const MAX_LLM_CALLS = 25
const uid = () => Math.random().toString(36).slice(2, 9)
const line = (text: string): LogLine => ({ at: new Date().toISOString(), text })
const reload = async (repo: Repo, id: string) => (await repo.getAgentTask(id))!

/** Модель с учётом лимита вызовов на задание: счётчик хранится в самом задании. */
function counted(deps: AgentDeps, task: AgentTask): Llm {
  return async (req) => {
    if (task.llm_calls >= MAX_LLM_CALLS) throw new LlmError('Достигнут лимит обращений к модели для этого задания')
    task.llm_calls++
    await deps.repo.updateAgentTask(task.id, { llm_calls: task.llm_calls })
    return deps.llm(req)
  }
}

const catalog = () => PLANNABLE.map((t) => `- ${t.name} (${t.risk}): ${t.describe}`).join('\n')

type RawPlan = { steps?: { text?: unknown; tool?: unknown }[]; reason?: unknown }

/** Повтор записи в базу при сбое: результат уже выполненного шага нельзя терять из-за таймаута. */
async function retry<T>(fn: () => Promise<T>, tries = 3): Promise<T> {
  let last: unknown
  for (let i = 0; i < tries; i++) {
    try {
      return await fn()
    } catch (e) {
      last = e
      await new Promise((r) => setTimeout(r, 500 * (i + 1)))
    }
  }
  throw last
}

/** Приводит ответ модели к безопасному плану: только известные инструменты, риск берётся из кода, отчёт всегда последний. */
export function normalizePlan(raw: RawPlan): Step[] {
  const steps: Step[] = []
  for (const s of raw.steps ?? []) {
    const tool = typeof s.tool === 'string' ? TOOL_BY_NAME.get(s.tool) : undefined
    const text = typeof s.text === 'string' ? s.text.trim().slice(0, 200) : ''
    if (!tool || tool.name === 'report' || !text || steps.length >= MAX_STEPS) continue
    steps.push({ id: uid(), text, tool: tool.name, risk: tool.risk, on: true, state: 'todo' })
  }
  if (steps.length) steps.push({ id: uid(), text: 'Составить отчёт о выполнении', tool: 'report', risk: 'write', on: true, state: 'todo' })
  return steps
}

async function makePlan(deps: AgentDeps, task: AgentTask, note?: string): Promise<EngineResult> {
  const ask = counted(deps, task)
  const prev = task.plan.length && note ? `\nПредыдущий план:\n${task.plan.filter((s) => s.tool !== 'report').map((s, i) => `${i + 1}. [${s.tool}] ${s.text}${s.on ? '' : ' (отключён)'}`).join('\n')}\nЗамечание владельца: ${note}\nУчти замечание и пересобери план.` : ''
  const user = `Задание: ${task.text}${task.attach.length ? `\nМатериалы: ${task.attach.join(', ')}` : ''}${prev}\n\nСоставь план из 1-${MAX_STEPS} шагов. Каждый шаг использует ровно один инструмент из списка. Не добавляй шагов, которых не просили; запуск рассылки или отправку добавляй, только если задание прямо об этом.\nЕсли задание нельзя выполнить доступными инструментами, НЕ подставляй другие инструменты: верни {"steps":[],"reason":"по-русски: чего не хватает и что сделать владельцу"}.\nИначе верни JSON: {"steps":[{"text":"что сделать, одной фразой","tool":"имя_инструмента"}]}`
  try {
    let plan: Step[] = []
    for (let attempt = 0; attempt < 2 && !plan.length; attempt++) {
      const raw = parseJson<RawPlan>(await ask({ feature: 'agent:plan', system: `Ты планировщик заданий для студии ST96. Доступные инструменты:\n${catalog()}\nНичего, кроме этих инструментов, ты делать не умеешь. Отвечай только JSON.`, user }))
      plan = normalizePlan(raw)
      if (!plan.length && typeof raw.reason === 'string' && raw.reason.trim()) throw new LlmError(`Агент не может выполнить это задание: ${raw.reason.trim().slice(0, 600)}`)
    }
    if (!plan.length) throw new LlmError('Агент не смог составить план из доступных инструментов. Уточните задание.')
    await deps.repo.updateAgentTask(task.id, { plan, status: 'approval', error: null, log: [...task.log, line(note ? `План обновлён по замечанию (версия ${task.rev})` : 'Агент составил план, ждёт согласования')] })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    await deps.repo.updateAgentTask(task.id, { status: 'failed', error: msg, log: [...task.log, line(`Не удалось составить план: ${msg}`)] })
  }
  return { ok: true, task: await reload(deps.repo, task.id) }
}

export async function createTask(deps: AgentDeps, input: { title: string; text: string; attach: string[] }): Promise<EngineResult> {
  const title = input.title.trim().slice(0, 120)
  const text = input.text.trim()
  if (!title || text.length < 5) return { ok: false, error: 'Укажите название и опишите задание подробнее', status: 422 }
  if (text.length > 4000) return { ok: false, error: 'Задание длиннее 4000 знаков', status: 422 }
  const task = await deps.repo.insertAgentTask({ title, text, attach: input.attach.slice(0, 10).map((a) => a.trim().slice(0, 300)).filter(Boolean) })
  await deps.repo.updateAgentTask(task.id, { log: [line('Задание создано')] })
  return makePlan(deps, await reload(deps.repo, task.id))
}

export async function reviseTask(deps: AgentDeps, id: string, note: string): Promise<EngineResult> {
  const task = await deps.repo.getAgentTask(id)
  if (!task) return { ok: false, error: 'Задание не найдено', status: 404 }
  if (task.status !== 'approval' && task.status !== 'failed') return { ok: false, error: 'План можно менять, пока он ждёт согласования', status: 409 }
  const n = note.trim().slice(0, 1000)
  const rev = task.rev + 1
  await deps.repo.updateAgentTask(id, { status: 'planning', rev, log: [...task.log, line(n ? `Замечание к плану: «${n}»` : 'Повторная попытка составить план')] })
  return makePlan(deps, await reload(deps.repo, id), n || undefined)
}

export async function approveTask(deps: AgentDeps, id: string, on: Record<string, boolean>): Promise<EngineResult> {
  const task = await deps.repo.getAgentTask(id)
  if (!task) return { ok: false, error: 'Задание не найдено', status: 404 }
  if (task.status !== 'approval') return { ok: false, error: 'Утвердить можно только план, который ждёт согласования', status: 409 }
  const plan = task.plan.map((s) => (s.tool === 'report' ? s : on[s.id] === false ? { ...s, on: false, state: 'skipped' as const } : s))
  if (!plan.some((s) => s.on && s.tool !== 'report')) return { ok: false, error: 'Включите хотя бы один шаг', status: 422 }
  await deps.repo.updateAgentTask(id, { plan, status: 'running', log: [...task.log, line('План утверждён, агент приступает')] })
  return { ok: true, task: await reload(deps.repo, id) }
}

export async function confirmStep(deps: AgentDeps, id: string, stepId: string): Promise<EngineResult> {
  const task = await deps.repo.getAgentTask(id)
  if (!task) return { ok: false, error: 'Задание не найдено', status: 404 }
  const step = task.plan.find((s) => s.id === stepId)
  if (task.status !== 'paused' || !step || step.state !== 'todo' || step.risk !== 'danger') return { ok: false, error: 'Подтверждать нечего', status: 409 }
  const plan = task.plan.map((s) => (s.id === stepId ? { ...s, confirmed: true } : s))
  await deps.repo.updateAgentTask(id, { plan, status: 'running', log: [...task.log, line(`Подтверждён шаг: ${step.text}`)] })
  return { ok: true, task: await reload(deps.repo, id) }
}

export async function rejectTask(deps: AgentDeps, id: string): Promise<EngineResult> {
  const task = await deps.repo.getAgentTask(id)
  if (!task) return { ok: false, error: 'Задание не найдено', status: 404 }
  if (!['approval', 'paused', 'running', 'failed'].includes(task.status)) return { ok: false, error: 'Это задание уже завершено', status: 409 }
  await deps.repo.updateAgentTask(id, { status: 'rejected', log: [...task.log, line(task.status === 'approval' ? 'Задание отклонено, ничего не выполнялось' : 'Задание остановлено')] })
  return { ok: true, task: await reload(deps.repo, id) }
}

export async function deleteTask(deps: AgentDeps, id: string): Promise<EngineResult> {
  const task = await deps.repo.getAgentTask(id)
  if (!task) return { ok: false, error: 'Задание не найдено', status: 404 }
  if (task.status === 'planning' || task.status === 'running') return { ok: false, error: 'Сначала остановите задание', status: 409 }
  await deps.repo.deleteAgentTask(id)
  return { ok: true, task }
}

/** Выполняет следующие шаги утверждённых заданий (вызывается расписанием раз в минуту). */
export async function tickAgentTasks(deps: AgentDeps, opts: { maxSteps?: number; budgetMs?: number } = {}): Promise<{ ran: number }> {
  const started = Date.now()
  const budgetMs = opts.budgetMs ?? 20_000
  let left = opts.maxSteps ?? 3
  let ran = 0
  for (const t of await deps.repo.listRunningAgentTasks()) {
    if (left <= 0 || Date.now() - started > budgetMs) break
    const claimed = await deps.repo.claimAgentTask(t.id)
    if (!claimed) continue
    try {
      let task = await reload(deps.repo, t.id)
      while (task.status === 'running' && left > 0 && Date.now() - started <= budgetMs) {
        const idx = task.plan.findIndex((s) => s.state === 'todo')
        if (idx < 0) {
          const report = [...task.plan].reverse().find((s) => s.tool === 'report' && s.state === 'done')?.result ?? null
          await deps.repo.updateAgentTask(task.id, { status: 'done', report, log: [...task.log, line('Задание выполнено')] })
          break
        }
        const step = task.plan[idx]!
        const tool = TOOL_BY_NAME.get(step.tool)
        if (!tool || !step.on) {
          task.plan[idx] = { ...step, state: 'skipped' }
          await deps.repo.updateAgentTask(task.id, { plan: task.plan })
          continue
        }
        if (tool.risk === 'danger' && !step.confirmed) {
          await deps.repo.updateAgentTask(task.id, { status: 'paused', log: [...task.log, line(`Нужно ваше подтверждение: ${step.text}`)] })
          break
        }
        task.plan[idx] = { ...step, state: 'running' }
        await retry(() => deps.repo.updateAgentTask(task.id, { plan: task.plan }))
        left--
        ran++
        let res: Awaited<ReturnType<typeof tool.run>>
        try {
          res = await tool.run({ repo: deps.repo, api: deps.api, groupChatId: deps.groupChatId, task, ask: counted(deps, task), done: task.plan.filter((s) => s.state === 'done') }, step)
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e)
          task.plan[idx] = { ...step, state: 'failed', error: msg }
          await retry(() => deps.repo.updateAgentTask(task.id, { plan: task.plan, status: 'failed', error: msg, log: [...task.log, line(`Шаг не выполнен («${step.text}»): ${msg}`)] }))
          break
        }
        // Шаг выполнен: результат нужно сохранить, даже если база отвечает медленно (иначе выполненный шаг выглядел бы ошибочным)
        if (res.partial) {
          task.plan[idx] = { ...step, state: 'todo', cursor: res.partial.cursor, carry: res.partial.carry, result: res.text }
          task.log = [...task.log, line(`${step.text}: ${res.text.split('\n')[0]}`)]
          await retry(() => deps.repo.updateAgentTask(task.id, { plan: task.plan, log: task.log }))
          break // продолжение на следующем запуске по расписанию
        }
        task.plan[idx] = { ...step, state: 'done', result: res.text, ref: res.ref, cursor: undefined, carry: undefined }
        task.log = [...task.log, line(`Готово: ${step.text}`)]
        await retry(() => deps.repo.updateAgentTask(task.id, { plan: task.plan, log: task.log }))
        task = await reload(deps.repo, task.id)
      }
    } finally {
      await deps.repo.releaseAgentTask(t.id)
    }
  }
  return { ran }
}

export const TOOL_NAMES = TOOLS.map((t) => t.name)

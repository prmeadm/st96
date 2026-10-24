// Задания агента: план из шагов, каждый шаг = один разрешённый инструмент с фиксированным уровнем риска.
export type Risk = 'read' | 'write' | 'send' | 'danger'
export type StepState = 'todo' | 'running' | 'done' | 'skipped' | 'failed'
export type Step = { id: string; text: string; tool: string; risk: Risk; on: boolean; state: StepState; confirmed?: boolean; result?: string; ref?: string; error?: string; cursor?: number; carry?: Record<string, unknown> }
export type TaskStatus = 'planning' | 'approval' | 'running' | 'paused' | 'done' | 'rejected' | 'failed'
export type LogLine = { at: string; text: string }
export type AgentTask = {
  id: string
  title: string
  text: string
  attach: string[]
  status: TaskStatus
  rev: number
  plan: Step[]
  log: LogLine[]
  report: string | null
  error: string | null
  llm_calls: number
  created_at: string
}
export type AgentStats = {
  clients: number
  consented: number
  optedOut: number
  leads30: Record<string, number>
  leadStatus: Record<string, number>
  newLeads7: number
  funnels: number
  publishedFunnels: number
  templates: number
  broadcasts: number
}

export const RISK_LABEL: Record<Risk, string> = { read: 'Чтение', write: 'Подготовка', send: 'Отправка', danger: 'Только с вашим подтверждением' }
export const TASK_STATUS: Record<TaskStatus, string> = {
  planning: 'Составляет план', approval: 'Ждёт согласования', running: 'Выполняется', paused: 'Ждёт подтверждения шага', done: 'Готово', rejected: 'Отклонено', failed: 'Ошибка',
}

// Типы раздела «Поддержка»: пакеты, проекты, сценарии, периоды, обращения, счета, журнал.
// Хранятся в схеме crm (миграция 0016). Строки совпадают с колонками таблиц.

export type PackageRow = {
  id: string
  code: string
  title: string
  description: string | null
  price: number | null
  currency: string
  period: 'month'
  corrections_limit: number | null
  features_limit: number | null
  requests_limit: number | null
  features_allowed: string | null
  sla_note: string | null
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export type PackageInsert = Pick<PackageRow, 'code' | 'title'> & Partial<Omit<PackageRow, 'id' | 'code' | 'title' | 'created_at' | 'updated_at'>>

export type ClientProjectRow = {
  id: string
  client_id: string
  package_id: string | null
  workspace_path: string | null
  repo_url: string | null
  deploy_target: string | null
  default_branch: string
  deploy_cmd: string | null
  status: 'active' | 'paused' | 'closed'
  agent_scenario_id: string | null
  created_at: string
  updated_at: string
}

export type ProjectInsert = Pick<ClientProjectRow, 'client_id'> & Partial<Omit<ClientProjectRow, 'id' | 'client_id' | 'created_at' | 'updated_at'>>

export type AgentScenarioRow = {
  id: string
  client_id: string
  project_id: string | null
  system_prompt: string
  scope_notes: string | null
  stop_conditions: string | null
  allowed_actions: string | null
  version: number
  created_at: string
  updated_at: string
}

export type ScenarioInsert = Pick<AgentScenarioRow, 'client_id'> & Partial<Omit<AgentScenarioRow, 'id' | 'client_id' | 'version' | 'created_at' | 'updated_at'>> & { project_id?: string | null }

export type PackagePeriodRow = {
  id: string
  project_id: string
  period_start: string
  period_end: string
  status: 'pending_payment' | 'active' | 'expired' | 'blocked'
  payment_id: string | null
  corrections_limit: number | null
  features_limit: number | null
  requests_limit: number | null
  corrections_used: number
  features_used: number
  requests_used: number
  created_at: string
}

export type PeriodInsert = Pick<PackagePeriodRow, 'project_id' | 'period_start' | 'period_end'> & Partial<Omit<PackagePeriodRow, 'id' | 'project_id' | 'period_start' | 'period_end' | 'created_at'>>

/** Вложение клиента к обращению (фото/документ) — материал для правок. */
export type SupportAttachment = {
  kind: 'photo' | 'document' | 'audio'
  file_id: string
  file_name?: string | null
  mime_type?: string | null
  caption?: string | null
}

export type SupportJobRow = {
  id: string
  client_id: string
  project_id: string | null
  message_id: number | null
  voice_file_id: string | null
  attachments_json: SupportAttachment[] | null
  request_text: string
  status: 'queued' | 'running' | 'clarify' | 'ready' | 'deployed' | 'split' | 'out_of_scope' | 'awaiting_payment' | 'failed' | 'thanks' | 'awaiting_confirmation'
  edits_json: unknown[]
  edits_count: number
  result_json: Record<string, unknown> | null
  tokens_used: number
  started_at: string | null
  finished_at: string | null
  created_at: string
}

export type SupportJobInsert = Pick<SupportJobRow, 'client_id' | 'request_text'> & Partial<Omit<SupportJobRow, 'id' | 'client_id' | 'request_text' | 'created_at'>>

export type InvoiceRow = {
  id: string
  client_id: string
  project_id: string | null
  period_id: string | null
  kind: 'period' | 'feature' | 'upgrade'
  amount: number
  currency: string
  status: 'draft' | 'sent' | 'paid_confirmed' | 'cancelled'
  link_or_file: string | null
  confirmed_by: string | null
  confirmed_at: string | null
  created_at: string
  updated_at: string
}

export type InvoiceInsert = Pick<InvoiceRow, 'client_id' | 'kind' | 'amount'> & Partial<Omit<InvoiceRow, 'id' | 'client_id' | 'kind' | 'amount' | 'created_at' | 'updated_at'>>

export type AgentAuditRow = {
  id: number
  client_id: string | null
  project_id: string | null
  job_id: string | null
  actor: 'ai' | 'human' | 'admin'
  action: string
  payload: Record<string, unknown> | null
  created_at: string
}

export type AuditInsert = Pick<AgentAuditRow, 'actor' | 'action'> & Partial<Pick<AgentAuditRow, 'client_id' | 'project_id' | 'job_id' | 'payload'>>

// ───────── Индекс workspace-папок на сервере ─────────
// Worker поддержки (единственный, кто видит файловую систему сервера) раз в тик сверяет реальные
// папки с этим индексом и пишет его в crm.app_settings[WORKSPACE_FOLDERS_KEY]; админка читает
// индекс оттуда и показывает в выпадающем списке «Workspace» модалки проекта.
// Константа и типы лежат здесь (файл без зависимостей от node:fs), чтобы их мог импортировать и
// серверный worker, и клиентская админка.
export const WORKSPACE_FOLDERS_KEY = 'support.workspace_folders'

export type WorkspaceFolder = {
  /** Имя папки без пути */
  name: string
  /** Абсолютный путь с завершающим слэшем */
  path: string
  /** В папке есть .git (похоже на репозиторий проекта) */
  has_git: boolean
  /** mtime папки в ISO; только для подсказки, в подписи индекса не участвует */
  modified_at: string
}

export type WorkspaceRoot = {
  /** Корень, в котором искали папки (без завершающего слэша) */
  root: string
  /** false — корня нет на этом сервере */
  exists: boolean
  folders: WorkspaceFolder[]
}

export type WorkspaceFolderIndex = {
  /** Когда worker последний раз смотрел на диск */
  scanned_at: string
  roots: WorkspaceRoot[]
  /** Папки проектов вне корней индекса (например, легаси-путь /home/dsh/work/music-loto):
   *  воркер проверяет их по client_projects.workspace_path и добавляет, только если папка есть. */
  extra?: WorkspaceFolder[]
}

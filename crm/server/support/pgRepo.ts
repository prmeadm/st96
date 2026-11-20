// Прямое подключение к Postgres (через пулер, IPv4) — реализация поддержки без service_role.
// Нужна только worker-у поддержки на сервере: опрос очереди, сценарий, период, аудит, списание.
import pg from 'pg'
import type { Repo } from '../repo'
import type { AgentScenarioRow, ClientProjectRow, InvoiceRow, PackagePeriodRow, SupportJobRow } from './types'

// Методы, которые нужны worker-у и period.ts. memoryRepo/supabaseRepo их тоже удовлетворяют (Pick из Repo).
export type SupportRepo = Pick<Repo,
  | 'findProject' | 'getScenario' | 'currentPeriod' | 'getPeriod' | 'listPeriods' | 'insertPeriod' | 'updatePeriod'
  | 'getInvoice' | 'updateInvoice' | 'insertAudit' | 'updateSupportJob' | 'listQueuedSupportJobs' | 'claimSupportJob'
>

// timestamptz/timestamp/date → строки (совпадает с типами строк support/types.ts)
pg.types.setTypeParser(1114, (s: string) => s)
pg.types.setTypeParser(1184, (s: string) => s)
pg.types.setTypeParser(1082, (s: string) => s)

const j = (v: unknown): string | null => (v == null ? null : JSON.stringify(v))

export function pgRepo(connectionString: string): SupportRepo {
  const pool = new pg.Pool({ connectionString, ssl: { rejectUnauthorized: false }, max: 3 })

  const one = async <T>(sql: string, params: unknown[] = []): Promise<T | null> => {
    const r = await pool.query(sql, params)
    return (r.rows[0] as T | undefined) ?? null
  }
  const many = async <T>(sql: string, params: unknown[] = []): Promise<T[]> => (await pool.query(sql, params)).rows as T[]

  // update crm.<table> set k=$2, … where id=$1
  const update = async (table: string, id: string, patch: Record<string, unknown>): Promise<void> => {
    const keys = Object.keys(patch)
    if (!keys.length) return
    const sets = keys.map((k, i) => `${k} = $${i + 2}`)
    await pool.query(`update crm.${table} set ${sets.join(', ')} where id = $1`, [id, ...keys.map((k) => patch[k])])
  }

  return {
    async findProject(id) { return one<ClientProjectRow>('select * from crm.client_projects where id = $1', [id]) },
    async getScenario(id) { return one<AgentScenarioRow>('select * from crm.agent_scenarios where id = $1', [id]) },
    async getPeriod(id) { return one<PackagePeriodRow>('select * from crm.package_periods where id = $1', [id]) },
    async currentPeriod(projectId) {
      const active = await one<PackagePeriodRow>("select * from crm.package_periods where project_id = $1 and status = 'active' order by period_start desc limit 1", [projectId])
      if (active) return active
      return one<PackagePeriodRow>("select * from crm.package_periods where project_id = $1 and status = 'pending_payment' order by period_start desc limit 1", [projectId])
    },
    async listPeriods(projectId) { return many<PackagePeriodRow>('select * from crm.package_periods where project_id = $1 order by period_start desc limit 50', [projectId]) },
    async insertPeriod(p) {
      return (await one<PackagePeriodRow>(
        `insert into crm.package_periods (project_id, period_start, period_end, status, corrections_limit, features_limit, requests_limit)
         values ($1,$2,$3,$4,$5,$6,$7) returning *`,
        [p.project_id, p.period_start, p.period_end, p.status ?? 'pending_payment', p.corrections_limit ?? null, p.features_limit ?? null, p.requests_limit ?? null],
      ))!
    },
    async updatePeriod(id, patch) { await update('package_periods', id, patch as Record<string, unknown>) },
    async getInvoice(id) { return one<InvoiceRow>('select * from crm.invoices where id = $1', [id]) },
    async updateInvoice(id, patch) { await update('invoices', id, patch as Record<string, unknown>) },
    async insertAudit(a) {
      await pool.query(
        'insert into crm.agent_audit_log (actor, action, client_id, project_id, job_id, payload) values ($1,$2,$3,$4,$5,$6)',
        [a.actor, a.action, a.client_id ?? null, a.project_id ?? null, a.job_id ?? null, j(a.payload ?? null)],
      )
    },
    async listQueuedSupportJobs(limit = 10) {
      return many<SupportJobRow>("select * from crm.support_jobs where status = 'queued' order by created_at limit $1", [limit])
    },
    async claimSupportJob(id) {
      return one<SupportJobRow>("update crm.support_jobs set status = 'running', started_at = now() where id = $1 and status = 'queued' returning *", [id])
    },
    async updateSupportJob(id, patch) {
      const p: Record<string, unknown> = { ...patch }
      if ('edits_json' in p && p.edits_json != null) p.edits_json = j(p.edits_json)
      if ('result_json' in p && p.result_json != null) p.result_json = j(p.result_json)
      await update('support_jobs', id, p)
    },
  }
}

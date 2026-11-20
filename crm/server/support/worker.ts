// Worker поддержки: опрашивает support_jobs, классифицирует обращение, при «ready» запускает
// агента (dsh --profile acp) в workspace проекта и пишет результат + аудит. Без Telegram.
// Запуск (по образцу systemd-сервиса ST96/bot):
//   SUPABASE_DB_URL=… DEEPSEEK_API_KEY=… npx tsx crm/server/support/worker.ts

import { execFile } from 'node:child_process'
import { pgRepo, type SupportRepo } from './pgRepo'
import { buildPrompt, decide, type AgentInput, type Classification, type Classify } from './agent'
import { spendCorrections, spendFeatures } from './period'
import type { SupportJobRow } from './types'

const dbUrl = process.env.SUPABASE_DB_URL ?? ''

/** Классификация обращения через DeepSeek (строгий JSON). */
export const classifyWithDeepSeek: Classify = async (input) => {
  const res = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + process.env.DEEPSEEK_API_KEY },
    body: JSON.stringify({
      model: process.env.DEEPSEEK_MODEL ?? 'deepseek-flash',
      messages: [
        { role: 'system', content: 'Классифицируй обращение клиента поддержки. Ответ строго JSON, без пояснений: {"kind":"clarify","reason":"…"} — не хватает деталей; {"kind":"out_of_scope","reason":"…"} — вне рамок сценария; {"kind":"edits","edits":["…"],"is_feature":false} — список конкретных правок (is_feature=true для новой функции).' },
        { role: 'user', content: buildPrompt(input) },
      ],
      temperature: 0,
      response_format: { type: 'json_object' },
    }),
  })
  if (!res.ok) throw new Error('DeepSeek ' + res.status + ': ' + (await res.text().catch(() => '')).slice(0, 200))
  const j = (await res.json()) as { choices: { message: { content: string } }[] }
  return JSON.parse(j.choices[0]!.message.content) as Classification
}

/** Запуск агента в workspace проекта. Агент видит только эту папку (cwd), не чужие проекты и не ~/.dsh. */
function runInWorkspace(workspacePath: string, prompt: string): Promise<{ ok: boolean; output: string }> {
  return new Promise((resolve) => {
    // dsh headless "<задача>" — одноразовый прогон агента: печатает результат и выходит.
    execFile('dsh', ['headless', prompt], { cwd: workspacePath, timeout: 15 * 60_000, maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
      const output = (stdout || stderr || '').slice(-4000)
      const failed = !!err || /\berror\b/i.test(stderr || '')
      resolve({ ok: !failed, output })
    })
  })
}

async function processJob(repo: SupportRepo, job: SupportJobRow) {
  const project = job.project_id ? await repo.findProject(job.project_id) : null
  if (!project) {
    await repo.updateSupportJob(job.id, { status: 'failed', result_json: { error: 'нет проекта' }, finished_at: new Date().toISOString() })
    await repo.insertAudit({ actor: 'ai', action: 'failed', client_id: job.client_id, project_id: job.project_id, job_id: job.id, payload: { error: 'no_project' } })
    return
  }
  const scenario = project.agent_scenario_id ? await repo.getScenario(project.agent_scenario_id) : null
  const period = await repo.currentPeriod(project.id)
  const input: AgentInput = {
    request_text: job.request_text,
    scenario: {
      system_prompt: scenario?.system_prompt ?? 'Работать в рамках проекта, не выходить за пределы задачи.',
      scope_notes: scenario?.scope_notes ?? null,
      stop_conditions: scenario?.stop_conditions ?? null,
      allowed_actions: scenario?.allowed_actions ?? null,
    },
    limits: {
      corrections_limit: period?.corrections_limit ?? null,
      corrections_used: period?.corrections_used ?? 0,
      features_limit: period?.features_limit ?? null,
      features_used: period?.features_used ?? 0,
      requests_limit: period?.requests_limit ?? null,
      requests_used: period?.requests_used ?? 0,
    },
    hasActivePeriod: period?.status === 'active',
  }
  const d = await decide(input, classifyWithDeepSeek)
  for (const a of d.audit) await repo.insertAudit({ ...a, client_id: job.client_id, project_id: job.project_id, job_id: job.id })
  if (d.status === 'ready') {
    const r = project.workspace_path ? await runInWorkspace(project.workspace_path, buildPrompt(input)) : { ok: false, output: 'не указан workspace_path' }
    const status = r.ok ? 'deployed' : 'failed'
    if (r.ok) {
      // Списание счётчиков после успешного деплоя (Фаза 5)
      try {
        if (d.is_feature) await spendFeatures(repo, project.id, d.edits_count)
        else await spendCorrections(repo, project.id, d.edits_count)
      } catch (e) {
        console.error('spend counters failed', e)
      }
    }
    await repo.updateSupportJob(job.id, {
      status, edits_json: d.edits, edits_count: d.edits_count,
      result_json: { output: r.output }, finished_at: new Date().toISOString(),
    })
    await repo.insertAudit({ actor: 'ai', action: status, client_id: job.client_id, project_id: job.project_id, job_id: job.id, payload: { edits_count: d.edits_count } })
  } else {
    await repo.updateSupportJob(job.id, {
      status: d.status, edits_json: 'edits' in d ? d.edits : [], edits_count: 'edits_count' in d ? d.edits_count : 0,
      result_json: { reason: d.reason }, finished_at: new Date().toISOString(),
    })
  }
}

async function poll() {
  if (!dbUrl) throw new Error('SUPABASE_DB_URL не задан')
  const repo = pgRepo(dbUrl)
  const jobs = await repo.listQueuedSupportJobs()
  for (const j of jobs) {
    const claimed = await repo.claimSupportJob(j.id)
    if (!claimed) continue
    try {
      await processJob(repo, claimed)
    } catch (e) {
      await repo.updateSupportJob(claimed.id, { status: 'failed', result_json: { error: e instanceof Error ? e.message : 'error' }, finished_at: new Date().toISOString() })
    }
  }
}

if (process.argv[1]?.endsWith('worker.ts')) {
  const loop = async () => { for (;;) { try { await poll() } catch (e) { console.error('poll failed', e) } await new Promise((r) => setTimeout(r, 15_000)) } }
  loop()
}

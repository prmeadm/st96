// Worker поддержки: опрашивает support_jobs, классифицирует обращение, при «ready» запускает
// агента (dsh headless "<задача>") в workspace проекта, пишет результат + аудит и отвечает клиенту в Telegram.
// Запуск (по образцу systemd-сервиса ST96/bot):
//   SUPABASE_DB_URL=… DEEPSEEK_API_KEY=… LEADS_BOT_TOKEN=… ADMIN_GROUP_ID=… npx tsx crm/server/support/worker.ts

import { execFile } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { pgRepo, type SupportRepo } from './pgRepo'
import { buildPrompt, decide, type AgentInput, type Classification, type Classify } from './agent'
import { spendCorrections, spendFeatures } from './period'
import type { SupportJobRow } from './types'
import { downloadTelegramVoice, sendTelegramVoice, synthesizeVoice, transcribeAudio } from './voice'

const dbUrl = process.env.SUPABASE_DB_URL ?? ''
const leadsBotToken = process.env.LEADS_BOT_TOKEN ?? ''
const adminGroupId = process.env.ADMIN_GROUP_ID ?? ''

/** Классификация обращения через DeepSeek (строгий JSON). */
export const classifyWithDeepSeek: Classify = async (input) => {
  const res = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + process.env.DEEPSEEK_API_KEY },
    body: JSON.stringify({
      model: process.env.DEEPSEEK_MODEL ?? 'deepseek-flash',
      messages: [
        { role: 'system', content: 'Классифицируй обращение клиента поддержки. Ответ строго JSON, без пояснений: {"kind":"clarify","reason":"…"} — не хватает деталей; {"kind":"out_of_scope","reason":"…"} — вне рамок сценария; {"kind":"thanks","reason":"…"} — клиент благодарит (спасибо, благодарю и т.п.), новых правок нет; {"kind":"edits","edits":["…"],"is_feature":false} — список конкретных правок (is_feature=true для новой функции).' },
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
    // Папка проекта могла быть только что создана из админки — убедимся, что она есть.
    try { mkdirSync(workspacePath, { recursive: true }) } catch { /* execFile вернёт понятную ошибку ниже */ }
    // dsh headless "<задача>" — одноразовый прогон агента: печатает результат и выходит.
    execFile('dsh', ['headless', prompt], { cwd: workspacePath, timeout: 15 * 60_000, maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
      const output = (stdout || stderr || '').slice(-4000)
      const failed = !!err
      resolve({ ok: !failed, output })
    })
  })
}

/** Прощание по времени суток: день до 17:00, вечер с 17:00. */
function timeFarewell(now = new Date()): string {
  return now.getHours() >= 17 ? 'Хорошего вам вечера' : 'Хорошего вам дня'
}

/** Текст ответа клиенту по финальному статусу задачи. */
function notifyMessage(status: string, reason?: string): string {
  switch (status) {
    case 'thanks': return 'И вам спасибо за то, что с нами 🤗 ' + timeFarewell() + '!!!\n\nНе забывайте следить за нашими новыми услугами, продуктами и обновлениями на сайте: https://st96.by'
    case 'deployed': return 'Готово — правки внесены и опубликованы на сайте.'
    case 'failed': return 'Не удалось внести правки автоматически. Передаю специалисту — он свяжется с вами.'
    case 'clarify': return 'Уточните, пожалуйста: ' + (reason ?? '')
    case 'out_of_scope': return 'К сожалению, этот запрос вне рамок вашего пакета поддержки.' + (reason ? ' ' + reason : '')
    case 'awaiting_payment':
      if (reason === 'нет активного оплаченного периода') return 'Для внесения правок нужен активный пакет поддержки. Менеджер свяжется с вами по оплате.'
      if (reason?.includes('исчерпан') || reason?.includes('нужно')) return 'Лимит правок по пакету исчерпан — для продолжения нужен новый пакет. Менеджер свяжется с вами.'
      return 'Для продолжения нужен оплаченный пакет поддержки.'
    default: return ''
  }
}

/** Отправка результата клиенту в Telegram (бот @st96_leads_bot) + зеркало «Ассистент: …» в группу админов. Ошибки не роняют worker. */
async function notifyClient(repo: SupportRepo, clientId: string, status: string, reason?: string, opts: { voice?: boolean } = {}) {
  const text = notifyMessage(status, reason)
  if (!text || !leadsBotToken) return
  try {
    const client = await repo.findClientById(clientId)
    if (!client) return
    // клиенту (личный чат)
    if (client.tg_user_id != null) {
      const res = await fetch(`https://api.telegram.org/bot${leadsBotToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: String(client.tg_user_id), text }),
      })
      if (!res.ok) console.error('notifyClient (клиент) failed', res.status, (await res.text().catch(() => '')).slice(0, 200))
    }
    // голосом — если обращение было голосовым
    if (opts.voice && client.tg_user_id != null) {
      try {
        const ogg = await synthesizeVoice(text)
        await sendTelegramVoice(leadsBotToken, String(client.tg_user_id), ogg)
      } catch (e) {
        console.error('notifyClient (голос) failed', e instanceof Error ? e.message : e)
      }
    }
    // в группу админов (тема клиента)
    if (adminGroupId && client.admin_topic_id != null) {
      const res = await fetch(`https://api.telegram.org/bot${leadsBotToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: adminGroupId, message_thread_id: Number(client.admin_topic_id), text: 'Ассистент: ' + text }),
      })
      if (!res.ok) console.error('notifyClient (группа) failed', res.status, (await res.text().catch(() => '')).slice(0, 200))
    }
  } catch (e) {
    console.error('notifyClient error', e)
  }
}

async function processJob(repo: SupportRepo, job: SupportJobRow) {
  // Голосовое обращение: скачать и распознать в текст.
  let requestText = job.request_text
  let wasVoice = false
  if (job.voice_file_id) {
    wasVoice = true
    try {
      const audio = await downloadTelegramVoice(leadsBotToken, job.voice_file_id)
      const transcript = await transcribeAudio(audio)
      if (transcript) requestText = transcript
    } catch (e) {
      console.error('voice transcribe failed', e instanceof Error ? e.message : e)
    }
  }
  const project = job.project_id ? await repo.findProject(job.project_id) : null
  if (!project) {
    await repo.updateSupportJob(job.id, { status: 'failed', result_json: { error: 'нет проекта' }, finished_at: new Date().toISOString() })
    await repo.insertAudit({ actor: 'ai', action: 'failed', client_id: job.client_id, project_id: job.project_id, job_id: job.id, payload: { error: 'no_project' } })
    await notifyClient(repo, job.client_id, 'failed', undefined, { voice: wasVoice })
    return
  }
  const scenario = project.agent_scenario_id ? await repo.getScenario(project.agent_scenario_id) : null
  const period = await repo.currentPeriod(project.id)
  const input: AgentInput = {
    request_text: requestText,
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
  let status: NonNullable<SupportJobRow['status']>
  let reason: string | undefined
  if (d.status === 'ready') {
    const r = project.workspace_path ? await runInWorkspace(project.workspace_path, buildPrompt(input)) : { ok: false, output: 'не указан workspace_path' }
    status = r.ok ? 'deployed' : 'failed'
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
    status = d.status
    reason = d.reason
    await repo.updateSupportJob(job.id, {
      status: d.status, edits_json: 'edits' in d ? d.edits : [], edits_count: 'edits_count' in d ? d.edits_count : 0,
      result_json: { reason: d.reason }, finished_at: new Date().toISOString(),
    })
  }
  await notifyClient(repo, job.client_id, status, reason, { voice: wasVoice })
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

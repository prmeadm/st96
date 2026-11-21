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
import { consultAnswer } from './consult'
import type { Llm } from '../agent/llm'

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

/** Модель для консультанта: тот же DeepSeek, строгий JSON {"answer": "…"}. */
const askDeepSeek: Llm = async ({ system, user }) => {
  const res = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + process.env.DEEPSEEK_API_KEY },
    body: JSON.stringify({
      model: process.env.DEEPSEEK_MODEL ?? 'deepseek-flash',
      messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
      temperature: 0.5,
      response_format: { type: 'json_object' },
    }),
  })
  if (!res.ok) throw new Error('DeepSeek ' + res.status + ': ' + (await res.text().catch(() => '')).slice(0, 200))
  const j = (await res.json()) as { choices: { message: { content: string } }[] }
  return j.choices[0]!.message.content
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
    case 'clarify':
      if (reason === 'voice_not_recognized') return 'Не удалось распознать голосовое сообщение — напишите, пожалуйста, текстом.'
      return 'Уточните, пожалуйста: ' + (reason ?? '')
    case 'out_of_scope': return 'К сожалению, этот запрос вне рамок вашего пакета поддержки.' + (reason ? ' ' + reason : '')
    case 'awaiting_payment':
      if (reason === 'нет активного оплаченного периода') return 'Для внесения правок нужен активный пакет поддержки. Менеджер свяжется с вами по оплате.'
      if (reason?.includes('исчерпан') || reason?.includes('нужно')) return 'Лимит правок по пакету исчерпан — для продолжения нужен новый пакет. Менеджер свяжется с вами.'
      return 'Для продолжения нужен оплаченный пакет поддержки.'
    default: return ''
  }
}

/** Отправка результата клиенту в Telegram (бот @st96_leads_bot) + зеркало «Ассистент: …» в группу админов. Ошибки не роняют worker. */
async function notifyClient(repo: SupportRepo, clientId: string, status: string, reason?: string, opts: { voice?: boolean; answer?: string } = {}) {
  const text = (opts.answer ?? '').trim() || notifyMessage(status, reason)
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

/** Клиент подтверждает план правок: «да», «ок», «подтверждаю» и т.п. */
function isConfirmation(text: string): boolean {
  const t = (text ?? '').toLowerCase().trim()
  if (!t || t.length > 80) return false
  return /^(да|ок|окей|ага|конечно|подтвержда|согласен|согласна|верно|давай|поехали|вперёд|старт|yes|ok|go)\b/i.test(t)
}

/** Клиент отменил план: «нет», «отмена», «стоп». */
function isRejection(text: string): boolean {
  const t = (text ?? '').toLowerCase().trim()
  return /^(нет|не надо|отмена|отмени|стоп|cancel|no)\b/i.test(t)
}

/** Выполнить ранее подтверждённый клиентом план правок. */
async function executePlan(repo: SupportRepo, plan: SupportJobRow, confirmJob: SupportJobRow) {
  const project = plan.project_id ? await repo.findProject(plan.project_id) : null
  if (!project) {
    const finished = new Date().toISOString()
    await repo.updateSupportJob(plan.id, { status: 'failed', result_json: { error: 'нет проекта' }, finished_at: finished })
    await repo.updateSupportJob(confirmJob.id, { status: 'failed', result_json: { error: 'нет проекта' }, finished_at: finished })
    return
  }
  const scenario = project.agent_scenario_id ? await repo.getScenario(project.agent_scenario_id) : null
  const period = await repo.currentPeriod(project.id)
  const data = (plan.result_json ?? {}) as { plan?: { edits?: string[]; edits_count?: number; is_feature?: boolean }; request_text?: string }
  const input: AgentInput = {
    request_text: data.request_text ?? plan.request_text,
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
  const r = project.workspace_path ? await runInWorkspace(project.workspace_path, buildPrompt(input)) : { ok: false, output: 'не указан workspace_path' }
  const status: 'deployed' | 'failed' = r.ok ? 'deployed' : 'failed'
  let spent = 0
  if (r.ok) {
    try {
      if (data.plan?.is_feature) await spendFeatures(repo, project.id, plan.edits_count)
      else await spendCorrections(repo, project.id, plan.edits_count)
      spent = plan.edits_count
    } catch (e) {
      console.error('spend counters failed', e)
    }
  }
  const finished = new Date().toISOString()
  await repo.updateSupportJob(plan.id, { status, result_json: { ...(plan.result_json ?? {}), output: r.output, confirmed_at: finished }, finished_at: finished })
  await repo.updateSupportJob(confirmJob.id, { status, result_json: { confirmed_job: plan.id }, finished_at: finished })
  await repo.insertAudit({ actor: 'ai', action: status, client_id: plan.client_id, project_id: plan.project_id, job_id: plan.id, payload: { edits_count: plan.edits_count } })
  const after = await repo.currentPeriod(project.id)
  const left = after?.corrections_limit == null ? 'без лимита' : `${after.corrections_limit - after.corrections_used} из ${after.corrections_limit}`
  const text = r.ok
    ? `Готово — правки внесены и опубликованы.\n\nСписано: ${spent} ${data.plan?.is_feature ? 'функц.' : 'правк.'}. Остаток правок: ${left}.`
    : 'Не удалось внести правки автоматически. Передаю специалисту — он свяжется с вами.'
  await notifyClient(repo, plan.client_id, status, undefined, { answer: text })
}

async function processJob(repo: SupportRepo, job: SupportJobRow) {
  // Клиент подтвердил ранее показанный план — выполняем его; отказал — отменяем.
  if (isConfirmation(job.request_text) || isRejection(job.request_text)) {
    const pending = await repo.findAwaitingConfirmationJob(job.client_id)
    if (pending) {
      if (isRejection(job.request_text)) {
        const finished = new Date().toISOString()
        await repo.updateSupportJob(pending.id, { status: 'clarify', result_json: { reason: 'клиент отменил план' }, finished_at: finished })
        await repo.updateSupportJob(job.id, { status: 'clarify', result_json: { cancelled_job: pending.id }, finished_at: finished })
        await notifyClient(repo, job.client_id, 'clarify', undefined, { answer: 'Хорошо, отменил. Если что — пишите, на связи.' })
        return
      }
      await executePlan(repo, pending, job)
      return
    }
  }
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
    if (!requestText.trim()) {
      await repo.updateSupportJob(job.id, { status: 'clarify', result_json: { reason: 'voice_not_recognized' }, finished_at: new Date().toISOString() })
      await repo.insertAudit({ actor: 'ai', action: 'clarify', client_id: job.client_id, project_id: job.project_id, job_id: job.id, payload: { reason: 'voice_not_recognized' } })
      await notifyClient(repo, job.client_id, 'clarify', 'voice_not_recognized', { voice: false })
      return
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
    // Не выполняем сразу: показываем план и сколько спишется, ждём финальное «да» клиента.
    const kind = d.is_feature ? 'функц.' : 'правк.'
    await repo.updateSupportJob(job.id, {
      status: 'awaiting_confirmation', edits_json: d.edits, edits_count: d.edits_count,
      result_json: { plan: { edits: d.edits, edits_count: d.edits_count, is_feature: d.is_feature, remaining_after: d.remaining_after }, request_text: requestText },
    })
    await repo.insertAudit({ actor: 'ai', action: 'awaiting_confirmation', client_id: job.client_id, project_id: job.project_id, job_id: job.id, payload: { edits_count: d.edits_count } })
    const planText = [
      'Проверил пакет — активен.',
      d.edits.length ? 'Планирую:\n' + d.edits.map((e, i) => `${i + 1}. ${e}`).join('\n') : '',
      `Спишется: ${d.edits_count} ${kind}. Останется: ${d.remaining_after == null ? 'без лимита' : String(d.remaining_after)}.`,
      'Подтверждаете? Напишите «да» — и я приступлю.',
    ].filter(Boolean).join('\n\n')
    await notifyClient(repo, job.client_id, 'awaiting_confirmation', undefined, { answer: planText, voice: wasVoice })
    return
  } else {
    status = d.status
    reason = d.reason
    await repo.updateSupportJob(job.id, {
      status: d.status, edits_json: 'edits' in d ? d.edits : [], edits_count: 'edits_count' in d ? d.edits_count : 0,
      result_json: { reason: d.reason }, finished_at: new Date().toISOString(),
    })
  }
  // На вопросы отвечает консультант: вместо шаблонного «нужен пакет» / «вне рамок» человек получает
  // ответ по сайту, рабочим часам и записи на встречу. Сбой модели — прежний шаблон ниже.
  let answer: string | undefined
  const isEditRequest = d.status === 'awaiting_payment' && d.request_kind === 'edits'
  if (d.status !== 'thanks' && !isEditRequest && requestText.trim()) {
    try {
      const client = await repo.findClientById(job.client_id)
      answer = await consultAnswer(askDeepSeek, {
        question: requestText, lang: client?.language ?? 'ru', name: client?.name ?? null, clientId: job.client_id,
      })
    } catch (e) {
      console.error('consult answer failed', e instanceof Error ? e.message : e)
    }
  }
  await notifyClient(repo, job.client_id, status, reason, { voice: wasVoice, answer })
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

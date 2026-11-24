// Worker поддержки: опрашивает support_jobs, классифицирует обращение, при «ready» запускает
// агента (dsh headless "<задача>") в workspace проекта, пишет результат + аудит и отвечает клиенту в Telegram.
// Запуск (по образцу systemd-сервиса ST96/bot):
//   SUPABASE_DB_URL=… DEEPSEEK_API_KEY=… LEADS_BOT_TOKEN=… ADMIN_GROUP_ID=… npx tsx crm/server/support/worker.ts

import { execFile } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { pgRepo, type SupportRepo } from './pgRepo.js'
import { buildPrompt, decide, type AgentInput, type Classification, type Classify } from './agent.js'
import { spendCorrections, spendFeatures } from './period.js'
import type { SupportAttachment, SupportJobRow } from './types.js'
import { downloadTelegramFile, downloadTelegramVoice, sendTelegramVoice, synthesizeVoice, transcribeAudio } from './voice.js'
import { consultAnswer } from './consult.js'
import { replySupport } from './reply.js'
import { isProjectsQuestion, pickProject, projectLabel, projectsListText } from './projects.js'
import { isConfirmation, isRejection } from './confirm.js'
import { CREATOR_ANSWER, isCreatorQuestion } from './creator.js'
import { hasAudioAttachment, musicReplyText } from './music.js'
import { attachmentFileName, effectiveRequestText, materialAskText, needsMaterial } from './material.js'
import { resultLink } from './link.js'
import type { Llm } from '../agent/llm.js'

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
function runInWorkspace(workspacePath: string, prompt: string): Promise<{ ok: boolean; output: string; tokens: number }> {
  return new Promise((resolve) => {
    // Папка проекта могла быть только что создана из админки — убедимся, что она есть.
    try { mkdirSync(workspacePath, { recursive: true }) } catch { /* execFile вернёт понятную ошибку ниже */ }
    // dsh headless --json — одноразовый прогон агента: события NDJSON (включая usage) + финальный текст.
    execFile('dsh', ['headless', '--json', prompt], { cwd: workspacePath, timeout: 15 * 60_000, maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
      let tokens = 0
      let finalText = ''
      for (const line of (stdout || '').split('\n')) {
        const s = line.trim()
        if (!s) continue
        try {
          const ev = JSON.parse(s) as { type?: string; phase?: string; usage?: { totalTokens?: number }; text?: string }
          if (ev.type === 'status' && ev.phase === 'step_end' && ev.usage?.totalTokens) tokens += ev.usage.totalTokens
          if (ev.type === 'final' && typeof ev.text === 'string') finalText = ev.text
        } catch { /* не JSON — пропускаем */ }
      }
      const output = (finalText || stdout || stderr || '').slice(-4000)
      resolve({ ok: !err, output, tokens })
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


/** Скачивает вложения клиента в workspace проекта и возвращает секцию промпта с путями. */
async function stageMaterials(workspacePath: string, plan: SupportJobRow, attachments: SupportAttachment[]): Promise<string> {
  if (!workspacePath || !attachments.length) return ''
  const dir = join(workspacePath, '.client-materials', plan.id)
  const lines: string[] = []
  for (let i = 0; i < attachments.length; i++) {
    const a = attachments[i]
    const name = attachmentFileName(a, i)
    const target = join(dir, name)
    try {
      await mkdir(dir, { recursive: true })
      const buf = await downloadTelegramFile(leadsBotToken, a.file_id)
      await writeFile(target, buf)
      lines.push(`${i + 1}. ${target}`)
    } catch (e) {
      console.error('material download failed', e instanceof Error ? e.message : e)
    }
  }
  return lines.length ? '\n\nМатериалы клиента (используй ТОЛЬКО эти файлы, не ищи материалы в интернете):\n' + lines.join('\n') : ''
}

/** Выполнить ранее подтверждённый клиентом план правок. */
async function executePlan(repo: SupportRepo, plan: SupportJobRow, confirmJob: SupportJobRow) {
  const data = (plan.result_json ?? {}) as { plan?: { edits?: string[]; edits_count?: number; is_feature?: boolean; project_id?: string }; request_text?: string }
  const projectId = data.plan?.project_id ?? plan.project_id
  const project = projectId ? await repo.findProject(projectId) : null
  if (!project) {
    const finished = new Date().toISOString()
    await repo.updateSupportJob(plan.id, { status: 'failed', result_json: { error: 'нет проекта' }, finished_at: finished })
    await repo.updateSupportJob(confirmJob.id, { status: 'failed', result_json: { error: 'нет проекта' }, finished_at: finished })
    return
  }
  const scenario = project.agent_scenario_id ? await repo.getScenario(project.agent_scenario_id) : null
  const period = await repo.currentPeriod(project.id)
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
  const materials = await stageMaterials(project.workspace_path ?? '', plan, plan.attachments_json ?? [])
  const execPrompt = buildPrompt(input) + materials + '\n\nВ конце обязательно укажи публичную ссылку (URL), по которой можно посмотреть результат. Если публичного URL нет — честно напиши это и укажи, как/где посмотреть результат.'
  // Живой ответ: агент берёт задачу и в конце пришлёт результат + ссылку.
  await notifyClient(repo, plan.client_id, 'deployed', undefined, { answer: 'Принял, приступаю к правкам. Как будет готово — сразу пришлю результат и ссылку.' })
  const r = project.workspace_path ? await runInWorkspace(project.workspace_path, execPrompt) : { ok: false, output: 'не указан workspace_path', tokens: 0 }
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
  await repo.updateSupportJob(plan.id, { status, tokens_used: r.tokens, result_json: { ...(plan.result_json ?? {}), output: r.output, confirmed_at: finished }, finished_at: finished })
  await repo.updateSupportJob(confirmJob.id, { status, result_json: { confirmed_job: plan.id }, finished_at: finished })
  await repo.insertAudit({ actor: 'ai', action: status, client_id: plan.client_id, project_id: plan.project_id, job_id: plan.id, payload: { edits_count: plan.edits_count } })
  const after = await repo.currentPeriod(project.id)
  const left = after?.corrections_limit == null ? 'без лимита' : `${after.corrections_limit - after.corrections_used} из ${after.corrections_limit}`
  const link = resultLink(project, r.output)
  const linkLine = link
    ? `\n\nСсылка на результат: ${link}`
    : '\n\nПубличной ссылки на результат нет — правки внесены, но проект не публикуется по URL.'
  const text = r.ok
    ? `Готово — правки внесены и опубликованы.\n\nСписано: ${spent} ${data.plan?.is_feature ? 'функц.' : 'правк.'}. Остаток правок: ${left}.${linkLine}`
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
  // Вопрос «кто тебя создал/разработал/хозяин/на кого работаешь» — фиксированный ответ, независимо от пакета.
  if (requestText.trim() && isCreatorQuestion(requestText)) {
    const finished = new Date().toISOString()
    await repo.updateSupportJob(job.id, { status: 'clarify', result_json: { reason: 'creator_question', answer: CREATOR_ANSWER }, finished_at: finished })
    await repo.insertAudit({ actor: 'ai', action: 'creator_question', client_id: job.client_id, project_id: job.project_id, job_id: job.id })
    await notifyClient(repo, job.client_id, 'clarify', undefined, { answer: CREATOR_ANSWER, voice: wasVoice })
    return
  }
  // Клиент прислал музыку — отвечаем эмодзи + репликой-«танцем».
  if (hasAudioAttachment(job.attachments_json)) {
    const reply = musicReplyText()
    const finished = new Date().toISOString()
    await repo.updateSupportJob(job.id, { status: 'clarify', result_json: { reason: 'music_sent', answer: reply }, finished_at: finished })
    await repo.insertAudit({ actor: 'ai', action: 'music_sent', client_id: job.client_id, project_id: job.project_id, job_id: job.id })
    await notifyClient(repo, job.client_id, 'clarify', undefined, { answer: reply, voice: false })
    return
  }
  // Активные проекты клиента: один — работаем с ним; несколько — уточняем, в какой вносить правку.
  const activeProjects = (await repo.listProjectsByClient(job.client_id)).filter((p) => p.status === 'active')

  // Вопрос «какие у меня проекты» — отвечаем списком детерминированно (без LLM).
  if (requestText.trim() && isProjectsQuestion(requestText)) {
    const text = activeProjects.length === 0
      ? 'У тебя пока нет активных проектов на поддержке.'
      : activeProjects.length === 1
        ? 'Вижу один твой проект: ' + projectLabel(activeProjects[0]) + '. В него и внесу правки — что поправить?'
        : projectsListText(activeProjects)
    await repo.updateSupportJob(job.id, { status: 'clarify', result_json: { reason: 'projects_list', projects: activeProjects.map(projectLabel) }, finished_at: new Date().toISOString() })
    await repo.insertAudit({ actor: 'ai', action: 'projects_list', client_id: job.client_id, project_id: job.project_id, job_id: job.id, payload: { count: activeProjects.length } })
    await notifyClient(repo, job.client_id, 'clarify', undefined, { answer: text, voice: wasVoice })
    return
  }

  let project = job.project_id ? await repo.findProject(job.project_id) : null
  if (activeProjects.length === 1) {
    project = activeProjects[0]
  } else if (activeProjects.length > 1) {
    project = pickProject(requestText, activeProjects) ?? activeProjects.find((p) => p.id === job.project_id) ?? null
    if (!project) {
      await repo.updateSupportJob(job.id, { status: 'clarify', result_json: { reason: 'several_projects', projects: activeProjects.map(projectLabel) }, finished_at: new Date().toISOString() })
      await repo.insertAudit({ actor: 'ai', action: 'clarify', client_id: job.client_id, project_id: null, job_id: job.id, payload: { reason: 'several_projects' } })
      await notifyClient(repo, job.client_id, 'clarify', undefined, { answer: projectsListText(activeProjects), voice: wasVoice })
      return
    }
  }
  if (!project) {
    // Нет активного проекта: консультант продаёт услуги студии (без классификации правок и сценария проекта).
    const finished = new Date().toISOString()
    let answer = ''
    if (requestText.trim()) {
      try {
        const client = await repo.findClientById(job.client_id)
        answer = (await consultAnswer(askDeepSeek, { question: requestText, lang: client?.language ?? 'ru', name: client?.name ?? null, clientId: job.client_id })).trim()
      } catch (e) {
        console.error('consult (no project) failed', e instanceof Error ? e.message : e)
      }
    }
    await repo.updateSupportJob(job.id, { status: 'clarify', result_json: { reason: 'consult', answer }, finished_at: finished })
    await repo.insertAudit({ actor: 'ai', action: 'consult', client_id: job.client_id, project_id: null, job_id: job.id })
    if (answer) await notifyClient(repo, job.client_id, 'clarify', undefined, { answer, voice: wasVoice })
    return
  }

  // Материалы для правок: агент не двигается дальше, пока клиент не пришлёт нужный файл.
  const attachments = (job.attachments_json ?? []).filter((a) => a && a.file_id)

  // Клиент прислал материал (вложение) — объединяем с последним обращением, ожидавшим материал.
  if (attachments.length > 0) {
    const waitMat = await repo.findWaitingMaterialJob(job.client_id)
    if (waitMat && waitMat.id !== job.id) requestText = [effectiveRequestText(waitMat), requestText].filter((t) => t.trim()).join('\n')
  }

  // Нужен материал, но его нет — просим прислать и НЕ двигаемся дальше.
  if (needsMaterial(requestText, attachments)) {
    await repo.updateSupportJob(job.id, { status: 'clarify', result_json: { reason: 'need_material', waiting_material: true, request_text: requestText }, finished_at: new Date().toISOString() })
    await repo.insertAudit({ actor: 'ai', action: 'need_material', client_id: job.client_id, project_id: project.id, job_id: job.id, payload: { request_text: requestText } })
    await notifyClient(repo, job.client_id, 'clarify', undefined, { answer: materialAskText(), voice: wasVoice })
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
  for (const a of d.audit) await repo.insertAudit({ ...a, client_id: job.client_id, project_id: project.id, job_id: job.id })
  let status: NonNullable<SupportJobRow['status']>
  let reason: string | undefined
  if (d.status === 'ready') {
    // Не выполняем сразу: показываем план и сколько спишется, ждём финальное «да» клиента.
    const kind = d.is_feature ? 'функц.' : 'правк.'
    await repo.updateSupportJob(job.id, {
      status: 'awaiting_confirmation', edits_json: d.edits, edits_count: d.edits_count,
      result_json: { plan: { edits: d.edits, edits_count: d.edits_count, is_feature: d.is_feature, remaining_after: d.remaining_after, project_id: project.id }, request_text: requestText },
    })
    await repo.insertAudit({ actor: 'ai', action: 'awaiting_confirmation', client_id: job.client_id, project_id: project.id, job_id: job.id, payload: { edits_count: d.edits_count } })
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
      result_json: { reason: d.reason, ...(wasVoice ? { transcript: requestText } : {}) }, finished_at: new Date().toISOString(),
    })
  }
  // Ответ клиенту по ветке:
  // - активный пакет → ответчик поддержки (соблюдает сценарий проекта, без встречи и допродажи,
  //   кроме out_of_scope — «оценивается отдельно» + предложение встречи);
  // - нет активного пакета → консультант-«продавец» (сайт, часы, запись; по правкам — про пакет + встреча).
  // Сбой модели — детерминированный шаблон notifyMessage ниже.
  let answer: string | undefined
  if (d.status !== 'thanks' && requestText.trim()) {
    try {
      const client = await repo.findClientById(job.client_id)
      if (period?.status === 'active') {
        answer = await replySupport(askDeepSeek, {
          scenario: input.scenario,
          status: d.status,
          reason: d.reason,
          request_text: requestText,
          lang: client?.language ?? 'ru',
          name: client?.name ?? null,
          clientId: job.client_id,
        })
      } else {
        answer = await consultAnswer(askDeepSeek, {
          question: requestText, lang: client?.language ?? 'ru', name: client?.name ?? null, clientId: job.client_id,
        })
      }
    } catch (e) {
      console.error('support reply failed', e instanceof Error ? e.message : e)
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

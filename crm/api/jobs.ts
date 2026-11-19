import { Api } from 'grammy'
import { resumeBooking, resumeRun } from '../server/funnels/engine'
import { telegramOut } from '../server/bot/telegramOut'
import { supabaseRepo } from '../server/repo'
import { tickBroadcasts } from '../server/broadcasts'
import { tickBookingReminders } from '../server/booking/notify'
import { agentDeps } from '../server/agent/deps'
import { tickAgentTasks } from '../server/agent/engine'

export const config = { runtime: 'edge' }

// Выполняет отложенные шаги воронок. Вызывается каждую минуту расписанием в базе (pg_cron).
// Эндпоинт безопасно открыт: он только доводит до конца уже запланированные задачи и ничего не принимает на вход.
export default async function handler(req: Request) {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })
  const token = process.env.TELEGRAM_BOT_TOKEN
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!token || !url || !key) return new Response('Server not configured', { status: 500 })

  // Работа (рассылка, шаги агента с вызовами модели) может занять больше 25 с, а edge-функция обязана начать ответ раньше:
  // отдаём ответ сразу, пробел в начале JSON допустим, результат дописываем по окончании.
  const enc = new TextEncoder()
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      controller.enqueue(enc.encode(' '))
      try {
        controller.enqueue(enc.encode(JSON.stringify(await runTick(token, url, key))))
      } catch (e) {
        console.error('jobs tick failed', e instanceof Error ? e.message : e)
        controller.enqueue(enc.encode(JSON.stringify({ error: 'tick failed' })))
      }
      controller.close()
    },
  })
  return new Response(stream, { headers: { 'Content-Type': 'application/json' } })
}

async function runTick(token: string, url: string, key: string) {
  const repo = supabaseRepo(url, key)
  const env = { repo, out: telegramOut(new Api(token), repo, process.env.TELEGRAM_CHAT_ID ? Number(process.env.TELEGRAM_CHAT_ID) : null) }
  const jobs = await repo.claimJobs(20)
  let done = 0
  let failed = 0
  for (const job of jobs) {
    try {
      if (job.kind === 'resume_run') await resumeRun(env, String(job.payload.runId))
      if (job.kind === 'booking_resume') await resumeBooking(env, String(job.payload.runId), job.payload.handle === 'confirmed' ? 'confirmed' : 'declined')
      await repo.finishJob(job.id)
      done++
    } catch (e) {
      console.error('job failed', job.id, e instanceof Error ? e.message : e)
      await repo.finishJob(job.id, e instanceof Error ? e.message : String(e)).catch(() => undefined)
      failed++
    }
  }
  let broadcast = { sent: 0, failed: 0 }
  try {
    broadcast = await tickBroadcasts({ repo, api: new Api(token) }, 100)
  } catch (e) {
    console.error('broadcast tick failed', e instanceof Error ? e.message : e)
  }
  let reminders = 0
  try {
    reminders = await tickBookingReminders({ repo, api: new Api(token) })
  } catch (e) {
    console.error('reminders failed', e instanceof Error ? e.message : e)
  }
  let agent = { ran: 0 }
  try {
    agent = await tickAgentTasks(await agentDeps(repo, new Api(token), process.env))
  } catch (e) {
    console.error('agent tick failed', e instanceof Error ? e.message : e)
  }
  return { claimed: jobs.length, done, failed, broadcast, agent, reminders }
}

import { Api } from 'grammy'
import { requireAdmin, json } from '../server/adminAuth'
import { agentDeps } from '../server/agent/deps'
import { approveTask, confirmStep, createTask, deleteTask, rejectTask, reviseTask } from '../server/agent/engine'
import { supabaseRepo } from '../server/repo'

export const config = { runtime: 'edge' }

// Задания агента из админки (только администраторы): create, revise, approve, confirm, reject, delete.
// Выполнение утверждённых шагов идёт в api/jobs раз в минуту.
export default async function handler(req: Request) {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)
  const token = process.env.TELEGRAM_BOT_TOKEN
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!token || !url || !key) return json({ error: 'Server not configured' }, 500)
  const denied = await requireAdmin(req, url, key)
  if (denied) return denied

  let b: { action?: string; id?: string; title?: string; text?: string; attach?: string[]; note?: string; on?: Record<string, boolean>; stepId?: string }
  try {
    b = (await req.json()) as typeof b
  } catch {
    return json({ error: 'Invalid JSON' }, 400)
  }
  const deps = agentDeps(supabaseRepo(url, key), new Api(token), process.env)
  const id = b.id ?? ''
  const r =
    b.action === 'create' ? await createTask(deps, { title: b.title ?? '', text: b.text ?? '', attach: Array.isArray(b.attach) ? b.attach.filter((x) => typeof x === 'string') : [] })
    : b.action === 'revise' ? await reviseTask(deps, id, b.note ?? '')
    : b.action === 'approve' ? await approveTask(deps, id, b.on ?? {})
    : b.action === 'confirm' ? await confirmStep(deps, id, b.stepId ?? '')
    : b.action === 'reject' ? await rejectTask(deps, id)
    : b.action === 'delete' ? await deleteTask(deps, id)
    : null
  if (!r) return json({ error: 'Unknown action' }, 400)
  return r.ok ? json({ ok: true, id: r.task.id, status: r.task.status }) : json({ error: r.error }, r.status)
}

import { requireAdmin, json } from '../server/adminAuth'
import { MODEL_SETTING } from '../server/agent/deps'
import { testModel } from '../server/agent/llm'
import { AUTO_MODEL, CUSTOM_PREFIX, CUSTOM_SETTING, MAX_CUSTOM_MODELS, isKnownModel, parseCustom, validateCustom } from '../server/agent/models'
import { supabaseRepo } from '../server/repo'

export const config = { runtime: 'edge' }

// Выбор модели ИИ (для агента и перевода): select, add, remove, test. Только администраторы.
export default async function handler(req: Request) {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return json({ error: 'Server not configured' }, 500)
  const denied = await requireAdmin(req, url, key)
  if (denied) return denied

  let b: { action?: string; model?: string; id?: string; name?: string; baseUrl?: string; keyEnv?: string }
  try {
    b = (await req.json()) as typeof b
  } catch {
    return json({ error: 'Invalid JSON' }, 400)
  }
  const repo = supabaseRepo(url, key)
  const custom = parseCustom(await repo.getSetting(CUSTOM_SETTING))

  if (b.action === 'select') {
    const ok = isKnownModel(b.model) || (typeof b.model === 'string' && custom.some((m) => m.id === b.model))
    if (!ok) return json({ error: 'Такой модели нет в списке' }, 422)
    await repo.setSetting(MODEL_SETTING, b.model!)
    return json({ ok: true })
  }

  if (b.action === 'add') {
    if (custom.length >= MAX_CUSTOM_MODELS) return json({ error: `Можно добавить не больше ${MAX_CUSTOM_MODELS} моделей` }, 422)
    const v = validateCustom({ name: b.name, baseUrl: b.baseUrl, model: b.model, keyEnv: b.keyEnv })
    if (!v.ok) return json({ error: v.error }, 422)
    const id = `${CUSTOM_PREFIX}${Math.random().toString(36).slice(2, 9)}`
    await repo.setSetting(CUSTOM_SETTING, JSON.stringify([...custom, { id, ...v.value }]))
    return json({ ok: true, id })
  }

  if (b.action === 'remove') {
    if (!custom.some((m) => m.id === b.id)) return json({ error: 'Модель не найдена' }, 404)
    await repo.setSetting(CUSTOM_SETTING, JSON.stringify(custom.filter((m) => m.id !== b.id)))
    if ((await repo.getSetting(MODEL_SETTING)) === b.id) await repo.setSetting(MODEL_SETTING, AUTO_MODEL)
    return json({ ok: true })
  }

  if (b.action === 'test') {
    const c = custom.find((m) => m.id === b.id)
    if (c) {
      const k = process.env[c.keyEnv]
      if (!k) return json({ ok: false, error: `Не задан ключ ${c.keyEnv} в Vercel (после добавления нужен новый деплой)` })
      return json(await testModel({ apiKey: k, baseUrl: c.baseUrl }, c.model))
    }
    if (typeof b.id === 'string' && isKnownModel(b.id) && b.id !== AUTO_MODEL) {
      const k = process.env.LLM_API_KEY
      if (!k) return json({ ok: false, error: 'Не задан ключ LLM_API_KEY в Vercel' })
      return json(await testModel({ apiKey: k, baseUrl: process.env.LLM_BASE_URL }, b.id))
    }
    return json({ error: 'Такой модели нет в списке' }, 422)
  }
  return json({ error: 'Unknown action' }, 400)
}

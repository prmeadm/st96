import { supabase } from './supabase'

/** Вызов защищённого API сайта от имени вошедшего админа. */
export async function callApi<T = Record<string, unknown>>(path: string, body: unknown): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  const { data: s } = await supabase.auth.getSession()
  const r = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${s.session?.access_token ?? ''}` }, body: JSON.stringify(body) }).catch(() => null)
  if (!r) return { ok: false, error: 'нет связи с сервером' }
  const data = (await r.json().catch(() => ({}))) as T & { error?: string }
  return r.ok ? { ok: true, data } : { ok: false, error: data.error ?? `ошибка ${r.status}` }
}

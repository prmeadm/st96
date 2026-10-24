import { createClient } from '@supabase/supabase-js'

export const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } })

/** Пускает только администраторов: токен входа из заголовка проверяется по таблице admins. null = можно, иначе готовый ответ с ошибкой. */
export async function requireAdmin(req: Request, url: string, key: string): Promise<Response | null> {
  const jwt = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '')
  if (!jwt) return json({ error: 'Unauthorized' }, 401)
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data: u, error } = await db.auth.getUser(jwt)
  if (error || !u.user) return json({ error: 'Unauthorized' }, 401)
  const { data: adm } = await db.from('admins').select('user_id').eq('user_id', u.user.id).maybeSingle()
  return adm ? null : json({ error: 'Forbidden' }, 403)
}

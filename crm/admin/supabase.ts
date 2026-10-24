import { createClient } from '@supabase/supabase-js'

// Публичные значения: доступ к данным ограничен правилами базы (RLS) и таблицей admins.
export const supabase = createClient(import.meta.env.VITE_SUPABASE_URL as string, import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string, {
  auth: { persistSession: true, autoRefreshToken: true },
})

/** Номер группы для ссылок на темы t.me/c/<id>/<тема> (без префикса -100) */
export const GROUP_LINK_ID = ((import.meta.env.VITE_TG_GROUP_ID as string | undefined) ?? '').replace(/^-100/, '')

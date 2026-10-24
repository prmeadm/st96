-- Настройки платформы (например, выбранная модель ИИ). Админы только читают; пишет сервер.
create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.app_settings enable row level security;
drop policy if exists "admins read" on public.app_settings;
create policy "admins read" on public.app_settings for select to authenticated using (public.is_admin());

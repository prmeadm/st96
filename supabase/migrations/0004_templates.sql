-- Библиотека шаблонов: готовые сообщения для клиентов (воронки, темы диалога).
create table if not exists public.templates (
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'text' check (kind in ('text','photo','video','audio','file')),
  title text not null,
  body text not null default '',
  body_en text,
  media_url text,
  task text not null default 'Первое касание',
  goal text not null default 'Привлечь заявку',
  services text[] not null default '{}',
  fav boolean not null default false,
  used int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.templates enable row level security;
drop policy if exists "admins full access" on public.templates;
create policy "admins full access" on public.templates for all to authenticated using (public.is_admin()) with check (public.is_admin());

create or replace function public.touch_templates() returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;
drop trigger if exists templates_touch on public.templates;
create trigger templates_touch before update on public.templates for each row execute function public.touch_templates();

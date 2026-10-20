-- Задания агента: текст задания, план (шаги с рисками), журнал, отчёт.
-- Админы только читают; все изменения идут через сервер (api/agent), чтобы нельзя было подменить план в обход проверок.
create table if not exists public.agent_tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  text text not null,
  attach jsonb not null default '[]'::jsonb,
  status text not null default 'planning' check (status in ('planning','approval','running','paused','done','rejected','failed')),
  rev int not null default 1,
  plan jsonb not null default '[]'::jsonb,
  log jsonb not null default '[]'::jsonb,
  report text,
  error text,
  llm_calls int not null default 0,
  locked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists agent_tasks_status on public.agent_tasks (status, created_at desc);

alter table public.agent_tasks enable row level security;
drop policy if exists "admins read" on public.agent_tasks;
create policy "admins read" on public.agent_tasks for select to authenticated using (public.is_admin());

drop trigger if exists agent_tasks_touch on public.agent_tasks;
create trigger agent_tasks_touch before update on public.agent_tasks for each row execute function public.touch_templates();

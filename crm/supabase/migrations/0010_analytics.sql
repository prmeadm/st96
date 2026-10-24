-- Аналитика: события шаблонов (просмотр, отправка, добавление в воронку и рассылку) и расход токенов ИИ.

create table if not exists public.template_events (
  id bigint generated always as identity primary key,
  template_id uuid not null references public.templates(id) on delete cascade,
  kind text not null check (kind in ('view', 'use', 'funnel', 'broadcast')),
  created_at timestamptz not null default now()
);
create index if not exists template_events_tpl on public.template_events (template_id, created_at);
create index if not exists template_events_at on public.template_events (created_at);

create table if not exists public.llm_usage (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  model text not null,
  feature text not null,                       -- функция: agent:plan, agent:draft_broadcast, translate ...
  prompt_tokens int not null default 0,
  completion_tokens int not null default 0,    -- включая «размышления» модели
  total_tokens int not null default 0,
  estimated boolean not null default false     -- провайдер не вернул usage: токены оценены по длине текста
);
create index if not exists llm_usage_at on public.llm_usage (created_at);

alter table public.template_events enable row level security;
alter table public.llm_usage enable row level security;
drop policy if exists "admins full access" on public.template_events;
create policy "admins full access" on public.template_events for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admins read" on public.llm_usage;
create policy "admins read" on public.llm_usage for select to authenticated using (public.is_admin());

-- Свод по шаблонам за период (null = без границы). Работает от имени вошедшего админа, RLS действует.
create or replace function public.analytics_templates(p_from timestamptz default null, p_to timestamptz default null)
returns table (template_id uuid, views bigint, uses bigint, funnels bigint, broadcasts bigint)
language sql stable as $$
  select e.template_id,
    count(*) filter (where e.kind = 'view'),
    count(*) filter (where e.kind = 'use'),
    count(*) filter (where e.kind = 'funnel'),
    count(*) filter (where e.kind = 'broadcast')
  from public.template_events e
  where (p_from is null or e.created_at >= p_from) and (p_to is null or e.created_at < p_to)
  group by e.template_id
$$;

-- Свод по токенам: модель x функция за период
create or replace function public.analytics_llm(p_from timestamptz default null, p_to timestamptz default null)
returns table (model text, feature text, calls bigint, prompt_tokens bigint, completion_tokens bigint, total_tokens bigint, estimated_calls bigint)
language sql stable as $$
  select u.model, u.feature, count(*), sum(u.prompt_tokens)::bigint, sum(u.completion_tokens)::bigint, sum(u.total_tokens)::bigint, count(*) filter (where u.estimated)
  from public.llm_usage u
  where (p_from is null or u.created_at >= p_from) and (p_to is null or u.created_at < p_to)
  group by u.model, u.feature
$$;

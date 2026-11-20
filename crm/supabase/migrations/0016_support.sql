-- 0016: поддержка клиентов (ИИ-агент).
-- Пакеты с лимитами, проекты клиентов (workspace), сценарии агента, периоды с оплатой,
-- очередь обращений, счета и журнал действий агента.
-- Схема crm (после миграции 0015 все таблицы платформы там). Применяется в SQL-редакторе Supabase.

begin;

-- ───────── клиенты: тип и реквизиты ─────────
alter table crm.clients add column if not exists client_kind text check (client_kind in ('individual','legal'));
alter table crm.clients add column if not exists legal_name text;
alter table crm.clients add column if not exists unp text;
alter table crm.clients add column if not exists legal_address text;
alter table crm.clients add column if not exists bank_details text;

-- ───────── заявки: «вы обращаетесь как» ─────────
alter table crm.leads add column if not exists client_kind text check (client_kind in ('individual','legal'));

-- ───────── пакеты поддержки ─────────
create table if not exists crm.packages (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  title text not null,
  description text,
  price numeric(12,2),
  currency text not null default 'BYN',
  period text not null default 'month' check (period in ('month')),
  corrections_limit int,
  features_limit int,
  requests_limit int,
  features_allowed text,
  sla_note text,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
drop trigger if exists packages_updated on crm.packages;
create trigger packages_updated before update on crm.packages for each row execute function crm.set_updated_at();

-- ───────── проекты клиентов ─────────
create table if not exists crm.client_projects (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references crm.clients(id) on delete cascade,
  package_id uuid references crm.packages(id) on delete set null,
  workspace_path text,
  repo_url text,
  deploy_target text,
  default_branch text not null default 'main',
  deploy_cmd text,
  status text not null default 'active' check (status in ('active','paused','closed')),
  agent_scenario_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists client_projects_client_idx on crm.client_projects (client_id);
drop trigger if exists client_projects_updated on crm.client_projects;
create trigger client_projects_updated before update on crm.client_projects for each row execute function crm.set_updated_at();

-- ───────── сценарии агента ─────────
create table if not exists crm.agent_scenarios (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references crm.clients(id) on delete cascade,
  project_id uuid references crm.client_projects(id) on delete cascade,
  system_prompt text not null default '',
  scope_notes text,
  stop_conditions text,
  allowed_actions text,
  version int not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists agent_scenarios_project_idx on crm.agent_scenarios (project_id);
drop trigger if exists agent_scenarios_updated on crm.agent_scenarios;
create trigger agent_scenarios_updated before update on crm.agent_scenarios for each row execute function crm.set_updated_at();

-- ───────── периоды с оплатой ─────────
create table if not exists crm.package_periods (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references crm.client_projects(id) on delete cascade,
  period_start timestamptz not null,
  period_end timestamptz not null,
  status text not null default 'pending_payment' check (status in ('pending_payment','active','expired','blocked')),
  payment_id uuid,
  corrections_limit int,
  features_limit int,
  requests_limit int,
  corrections_used int not null default 0,
  features_used int not null default 0,
  requests_used int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists package_periods_project_idx on crm.package_periods (project_id, period_start desc);
create index if not exists package_periods_open_idx on crm.package_periods (project_id) where status in ('pending_payment','active');

-- ───────── очередь обращений ─────────
create table if not exists crm.support_jobs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references crm.clients(id) on delete cascade,
  project_id uuid references crm.client_projects(id) on delete set null,
  message_id bigint,
  request_text text not null,
  status text not null default 'queued' check (status in ('queued','running','clarify','ready','deployed','split','out_of_scope','awaiting_payment','failed')),
  edits_json jsonb not null default '[]'::jsonb,
  edits_count int not null default 0,
  result_json jsonb,
  tokens_used int not null default 0,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists support_jobs_project_idx on crm.support_jobs (project_id, created_at desc);
create index if not exists support_jobs_status_idx on crm.support_jobs (status) where status in ('queued','running');

-- ───────── счета и ссылки на оплату ─────────
create table if not exists crm.invoices (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references crm.clients(id) on delete cascade,
  project_id uuid references crm.client_projects(id) on delete set null,
  period_id uuid references crm.package_periods(id) on delete set null,
  kind text not null check (kind in ('period','feature','upgrade')),
  amount numeric(12,2) not null,
  currency text not null default 'BYN',
  status text not null default 'draft' check (status in ('draft','sent','paid_confirmed','cancelled')),
  link_or_file text,
  confirmed_by uuid references crm.admins(user_id) on delete set null,
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists invoices_client_idx on crm.invoices (client_id, created_at desc);
drop trigger if exists invoices_updated on crm.invoices;
create trigger invoices_updated before update on crm.invoices for each row execute function crm.set_updated_at();

-- ───────── журнал действий агента ─────────
create table if not exists crm.agent_audit_log (
  id bigint generated always as identity primary key,
  client_id uuid references crm.clients(id) on delete set null,
  project_id uuid references crm.client_projects(id) on delete set null,
  job_id uuid references crm.support_jobs(id) on delete set null,
  actor text not null check (actor in ('ai','human','admin')),
  action text not null,
  payload jsonb,
  created_at timestamptz not null default now()
);
create index if not exists agent_audit_project_idx on crm.agent_audit_log (project_id, created_at desc);
create index if not exists agent_audit_client_idx on crm.agent_audit_log (client_id, created_at desc);

-- ───────── права: админы видят и правят всё; сервер/бот — через service-key ─────────
do $$
declare t text;
begin
  foreach t in array array['packages','client_projects','agent_scenarios','package_periods','support_jobs','invoices','agent_audit_log']
  loop
    execute format('alter table crm.%I enable row level security', t);
    execute format('drop policy if exists "admins full access" on crm.%I', t);
    execute format('create policy "admins full access" on crm.%I for all to authenticated using (crm.is_admin()) with check (crm.is_admin())', t);
  end loop;
end $$;

-- ───────── стартовые пакеты (админ меняет в админке) ─────────
insert into crm.packages (code, title, description, corrections_limit, features_limit, requests_limit, sort_order) values
  ('basic',    'Базовый',     'Минимальная поддержка',  2,  0,   10, 1),
  ('standard', 'Стандартный', 'Стандартная поддержка', 5,  2,   30, 2),
  ('premium',  'Премиум',     'Максимальная поддержка', 10, null, null, 3)
on conflict (code) do nothing;

commit;

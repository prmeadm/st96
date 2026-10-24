-- ST96: ядро (этап 1). Клиенты, заявки, заметки сотрудников, переписка, воронки, очередь.
-- Бронирование, рассылки, задания агента и шаблоны добавим отдельными миграциями.

create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

-- ───────── утилиты ─────────
create or replace function public.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

-- Приведение текста для поиска: нижний регистр, ё = е
create or replace function public.norm(t text) returns text language sql immutable as $$
  select translate(lower(coalesce(t, '')), 'ё', 'е')
$$;

-- ───────── администраторы ─────────
create table public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'manager' check (role in ('owner', 'manager')),
  tg_user_id bigint,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin() returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid())
$$;

-- ───────── клиенты ─────────
create table public.clients (
  id uuid primary key default gen_random_uuid(),
  tg_user_id bigint unique,
  tg_username text,
  name text,
  phone text,
  email text,
  company text,
  language text not null default 'ru' check (language in ('ru', 'en')),
  source text,
  consent_at timestamptz,
  opted_out_at timestamptz,
  vars jsonb not null default '{}',
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- Дубли ищем по телефону и по нику без учёта регистра
create unique index clients_phone_key on public.clients (phone) where phone is not null;
create unique index clients_username_key on public.clients (lower(tg_username)) where tg_username is not null;
create trigger clients_updated before update on public.clients for each row execute function public.set_updated_at();

create table public.tags (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  color text
);
create table public.client_tags (
  client_id uuid not null references public.clients(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (client_id, tag_id)
);

-- ───────── услуги ─────────
create table public.services (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name_ru text not null,
  name_en text not null,
  description_ru text,
  description_en text,
  price_from numeric,
  currency text not null default 'BYN',
  active boolean not null default true,
  sort int not null default 0
);
insert into public.services (key, name_ru, name_en, sort) values
  ('neurophoto', 'Нейрофотосессия', 'AI Photoshoot', 1),
  ('retouch', 'Retouch Studio', 'Retouch Studio', 2),
  ('digital_office', 'Цифровой офис (SupaOffice)', 'Digital Office (SupaOffice)', 3),
  ('production', 'Продакшн', 'Production', 4),
  ('other', 'Другое', 'Other', 9);

-- ───────── заявки ─────────
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete set null,
  source text not null check (source in ('site_form', 'stand_form', 'tg_group', 'bot', 'manual')),
  service_key text references public.services(key),
  title text,
  topic text,
  status text not null default 'new' check (status in ('new', 'in_progress', 'won', 'lost', 'spam')),
  name text,
  phone text,
  telegram text,
  email text,
  company text,
  comment text,
  interest text,
  lang text,
  landing text,
  utm jsonb,
  warnings text[] not null default '{}',   -- что парсер исправил или не смог определить
  raw_text text,
  tg_chat_id bigint,
  tg_message_id bigint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index leads_tg_message_key on public.leads (tg_chat_id, tg_message_id) where tg_message_id is not null;
create index leads_client_idx on public.leads (client_id);
create index leads_created_idx on public.leads (created_at desc);
create trigger leads_updated before update on public.leads for each row execute function public.set_updated_at();

-- ───────── заметки сотрудников ─────────
create table public.lead_notes (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads(id) on delete cascade,
  client_id uuid references public.clients(id) on delete cascade,
  author_name text,
  author_tg_id bigint,
  text text not null,
  text_norm text generated always as (public.norm(text)) stored,
  source text not null check (source in ('form_comment', 'group_reply', 'group_message', 'admin')),
  tg_chat_id bigint,
  tg_message_id bigint,
  reply_to_message_id bigint,
  created_at timestamptz not null default now()
);
create index lead_notes_trgm on public.lead_notes using gin (text_norm gin_trgm_ops);
create index lead_notes_lead_idx on public.lead_notes (lead_id);
create index lead_notes_client_idx on public.lead_notes (client_id);
-- Заметки без заявки и клиента — очередь «Не привязано»
create index lead_notes_unassigned_idx on public.lead_notes (created_at desc) where lead_id is null and client_id is null;

-- Комментарий из формы тоже становится заметкой, чтобы попадать в поиск
create or replace function public.lead_comment_to_note() returns trigger language plpgsql as $$
begin
  if coalesce(btrim(new.comment), '') <> '' then
    insert into public.lead_notes (lead_id, client_id, text, source) values (new.id, new.client_id, new.comment, 'form_comment');
  end if;
  return new;
end $$;
create trigger leads_comment_note after insert on public.leads for each row execute function public.lead_comment_to_note();

-- Заметки с привязкой к клиенту напрямую или через заявку
create view public.client_notes with (security_invoker = true) as
  select n.id, coalesce(n.client_id, l.client_id) as client_id, n.lead_id, n.text, n.text_norm, n.author_name, n.source, n.created_at
  from public.lead_notes n left join public.leads l on l.id = n.lead_id;

-- Отбор клиентов по словам в заметках.
--   p_any  — есть хотя бы одно из слов («содержит любое»)
--   p_all  — есть каждое из слов, возможно в разных заметках («содержит все»)
--   p_none — ни в одной заметке нет ни одного из слов («не содержит»)
-- Слово ищется как часть слова без учёта регистра и ё/е: «дорог» найдёт «дорого», «дорогой».
create or replace function public.clients_by_note_words(
  p_any text[] default '{}', p_all text[] default '{}', p_none text[] default '{}', p_since timestamptz default null
) returns setof uuid language sql stable as $$
  with cn as (
    select client_id, text_norm from public.client_notes
    where client_id is not null and (p_since is null or created_at >= p_since)
  )
  select c.id from public.clients c
  where (cardinality(p_any) = 0 or exists (
          select 1 from cn, unnest(p_any) w where cn.client_id = c.id and strpos(cn.text_norm, public.norm(w)) > 0))
    and (cardinality(p_all) = 0 or not exists (
          select 1 from unnest(p_all) w where not exists (
            select 1 from cn where cn.client_id = c.id and strpos(cn.text_norm, public.norm(w)) > 0)))
    and (cardinality(p_none) = 0 or not exists (
          select 1 from cn, unnest(p_none) w where cn.client_id = c.id and strpos(cn.text_norm, public.norm(w)) > 0))
$$;

-- ───────── переписка ─────────
create table public.messages (
  id bigint generated always as identity primary key,
  client_id uuid not null references public.clients(id) on delete cascade,
  direction text not null check (direction in ('in', 'out', 'admin')),
  kind text not null default 'text' check (kind in ('text', 'photo', 'video', 'audio', 'voice', 'file', 'other')),
  text text,
  media jsonb,
  tg_chat_id bigint,
  tg_message_id bigint,
  run_id uuid,
  created_at timestamptz not null default now()
);
create index messages_client_idx on public.messages (client_id, created_at desc);

-- ───────── воронки ─────────
create table public.funnels (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  graph jsonb not null default '{"nodes":[],"edges":[]}',
  triggers jsonb not null default '[]',
  ai_enabled boolean not null default false,
  version int not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger funnels_updated before update on public.funnels for each row execute function public.set_updated_at();

create table public.funnel_runs (
  id uuid primary key default gen_random_uuid(),
  funnel_id uuid not null references public.funnels(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  version int not null,
  current_node text,
  status text not null default 'running' check (status in ('running', 'waiting', 'done', 'stopped', 'failed')),
  vars jsonb not null default '{}',
  wake_at timestamptz,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);
create index funnel_runs_client_idx on public.funnel_runs (client_id, status);
create index funnel_runs_wake_idx on public.funnel_runs (wake_at) where status = 'waiting';

create table public.run_events (
  id bigint generated always as identity primary key,
  run_id uuid not null references public.funnel_runs(id) on delete cascade,
  funnel_id uuid not null,
  client_id uuid not null,
  node_id text not null,
  event text not null,            -- enter, click, error ...
  data jsonb,
  created_at timestamptz not null default now()
);
create index run_events_node_idx on public.run_events (funnel_id, node_id, event);

-- ───────── очередь отложенных шагов ─────────
create table public.jobs (
  id bigint generated always as identity primary key,
  kind text not null,
  run_at timestamptz not null default now(),
  payload jsonb not null default '{}',
  locked_at timestamptz,
  attempts int not null default 0,
  last_error text,
  done_at timestamptz,
  created_at timestamptz not null default now()
);
create index jobs_due_idx on public.jobs (run_at) where done_at is null;

-- Забирает до p_limit готовых задач; параллельные воркеры не пересекаются
create or replace function public.claim_jobs(p_limit int default 20) returns setof public.jobs language sql as $$
  update public.jobs j set locked_at = now(), attempts = attempts + 1
  where j.id in (
    select id from public.jobs
    where done_at is null and run_at <= now() and (locked_at is null or locked_at < now() - interval '5 minutes') and attempts < 5
    order by run_at limit p_limit for update skip locked)
  returning j.*
$$;

-- ───────── служебное ─────────
create table public.processed_updates (
  update_id bigint primary key,
  received_at timestamptz not null default now()
);
create table public.audit_log (
  id bigint generated always as identity primary key,
  admin_id uuid references public.admins(user_id) on delete set null,
  action text not null,
  entity text,
  entity_id text,
  data jsonb,
  created_at timestamptz not null default now()
);

-- ───────── права ─────────
-- Бот и серверные функции работают с service-key (RLS их не ограничивает).
-- Админка работает под входом и видит всё только если пользователь есть в public.admins.
do $$
declare t text;
begin
  foreach t in array array['admins', 'clients', 'tags', 'client_tags', 'services', 'leads', 'lead_notes', 'messages', 'funnels', 'funnel_runs', 'run_events', 'jobs', 'processed_updates', 'audit_log']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "admins full access" on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end $$;

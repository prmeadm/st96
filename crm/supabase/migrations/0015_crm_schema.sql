-- 0015: порядок в базе — внутренние данные платформы переезжают в схему crm.
-- ПРИМЕНЕНО 2026-11-05 на проде (ref ljatihrxiuouukakbdtb): public = 0 таблиц, crm = 24 таблицы
-- + представление client_notes, 23 политики RLS, 16 внешних ключей, cron-задачи пересозданы.
-- Exposed schemas: public, graphql_public, crm. Vercel: SUPABASE_SCHEMA=crm, VITE_SUPABASE_SCHEMA=crm.
--
-- Что и почему:
--   * схема public остаётся «входной дверью» Supabase (её видят PostgREST и клиенты
--     по умолчанию), в ней не должно лежать ничего, кроме расширений;
--   * все таблицы платформы (клиенты, заявки, диалоги, воронки, рассылки, шаблоны,
--     агент, запись, аналитика, настройки) — в схеме crm;
--   * сайт своих таблиц не имеет: он пишет только через api/*-функции с service-key,
--     поэтому «сайт отдельно» = отдельная схема не нужна, граница проходит по API.
--
-- Как применять (порядок важен):
--   1. Сделать бэкап: Supabase → Database → Backups (или pg_dump).
--   2. Выполнить этот файл в SQL-редакторе Supabase целиком (он в одной транзакции).
--   3. Supabase → Settings → API → Exposed schemas: добавить `crm`
--      (иначе PostgREST не пустит ни админку, ни бота: ошибка «schema must be one of...»).
--   4. В Vercel выставить SUPABASE_SCHEMA=crm и VITE_SUPABASE_SCHEMA=crm, сделать redeploy.
--   5. Проверить: /admin открывается, заявка с сайта создаётся, /book показывает слоты.
--
-- Откат (если что-то пошло не так): прогнать тот же файл в обратную сторону —
--   alter table crm.<таблица> set schema public; и вернуть функции/крон-задачи.
--   Проще: восстановить бэкап из шага 1.

begin;

create schema if not exists crm;

-- ───────── 1. Таблицы и представление ─────────
alter table public.admins set schema crm;
alter table public.clients set schema crm;
alter table public.tags set schema crm;
alter table public.client_tags set schema crm;
alter table public.services set schema crm;
alter table public.leads set schema crm;
alter table public.lead_notes set schema crm;
alter table public.messages set schema crm;
alter table public.funnels set schema crm;
alter table public.funnel_runs set schema crm;
alter table public.run_events set schema crm;
alter table public.jobs set schema crm;
alter table public.processed_updates set schema crm;
alter table public.audit_log set schema crm;
alter table public.templates set schema crm;
alter table public.template_events set schema crm;
alter table public.broadcasts set schema crm;
alter table public.broadcast_recipients set schema crm;
alter table public.agent_tasks set schema crm;
alter table public.app_settings set schema crm;
alter table public.bookings set schema crm;
alter table public.llm_usage set schema crm;
alter table public.tg_links set schema crm;
alter table public.filter_presets set schema crm;

alter view public.client_notes set schema crm;

-- ───────── 2. Функции: перенос сохраняет OID (политики и триггеры не рвутся) ─────────
alter function public.set_updated_at() set schema crm;
alter function public.norm(text) set schema crm;
alter function public.is_admin() set schema crm;
alter function public.lead_comment_to_note() set schema crm;
alter function public.touch_templates() set schema crm;
alter function public.clients_by_note_words(text[], text[], text[], timestamptz) set schema crm;
alter function public.claim_jobs(int) set schema crm;
alter function public.claim_broadcast_recipients(uuid, int) set schema crm;
alter function public.analytics_templates(timestamptz, timestamptz) set schema crm;
alter function public.analytics_llm(timestamptz, timestamptz) set schema crm;

-- ───────── 3. Тела функций: public.* → crm.* (текст тела не переписывается при переносе) ─────────
create or replace function crm.is_admin() returns boolean
language sql stable security definer set search_path = crm, public as $$
  select exists (select 1 from crm.admins where user_id = auth.uid())
$$;

create or replace function crm.lead_comment_to_note() returns trigger language plpgsql as $$
begin
  if coalesce(btrim(new.comment), '') <> '' then
    insert into crm.lead_notes (lead_id, client_id, text, source) values (new.id, new.client_id, new.comment, 'form_comment');
  end if;
  return new;
end $$;

create or replace function crm.clients_by_note_words(
  p_any text[] default '{}', p_all text[] default '{}', p_none text[] default '{}', p_since timestamptz default null
) returns setof uuid language sql stable as $$
  with cn as (
    select client_id, text_norm from crm.client_notes
    where client_id is not null and (p_since is null or created_at >= p_since)
  )
  select c.id from crm.clients c
  where (cardinality(p_any) = 0 or exists (
          select 1 from cn, unnest(p_any) w where cn.client_id = c.id and strpos(cn.text_norm, crm.norm(w)) > 0))
    and (cardinality(p_all) = 0 or not exists (
          select 1 from unnest(p_all) w where not exists (
            select 1 from cn where cn.client_id = c.id and strpos(cn.text_norm, crm.norm(w)) > 0)))
    and (cardinality(p_none) = 0 or not exists (
          select 1 from cn, unnest(p_none) w where cn.client_id = c.id and strpos(cn.text_norm, crm.norm(w)) > 0))
$$;

create or replace function crm.claim_jobs(p_limit int default 20) returns setof crm.jobs language sql as $$
  update crm.jobs j set locked_at = now(), attempts = attempts + 1
  where j.id in (
    select id from crm.jobs
    where done_at is null and run_at <= now() and (locked_at is null or locked_at < now() - interval '5 minutes') and attempts < 5
    order by run_at limit p_limit for update skip locked)
  returning j.*
$$;

create or replace function crm.claim_broadcast_recipients(p_broadcast uuid, p_limit int default 50)
returns setof crm.broadcast_recipients language sql security definer set search_path = crm, public as $$
  update crm.broadcast_recipients set status = 'pending', claimed_at = null
    where broadcast_id = p_broadcast and status = 'sending' and claimed_at < now() - interval '5 minutes';
  update crm.broadcast_recipients r set status = 'sending', claimed_at = now()
    where (r.broadcast_id, r.client_id) in (
      select broadcast_id, client_id from crm.broadcast_recipients
      where broadcast_id = p_broadcast and status = 'pending' limit p_limit for update skip locked)
    returning r.*
$$;
revoke all on function crm.claim_broadcast_recipients(uuid, int) from public, anon, authenticated;
grant execute on function crm.claim_broadcast_recipients(uuid, int) to service_role;

create or replace function crm.analytics_templates(p_from timestamptz default null, p_to timestamptz default null)
returns table (template_id uuid, views bigint, uses bigint, funnels bigint, broadcasts bigint)
language sql stable as $$
  select e.template_id,
    count(*) filter (where e.kind = 'view'),
    count(*) filter (where e.kind = 'use'),
    count(*) filter (where e.kind = 'funnel'),
    count(*) filter (where e.kind = 'broadcast')
  from crm.template_events e
  where (p_from is null or e.created_at >= p_from) and (p_to is null or e.created_at < p_to)
  group by e.template_id
$$;

create or replace function crm.analytics_llm(p_from timestamptz default null, p_to timestamptz default null)
returns table (model text, feature text, calls bigint, prompt_tokens bigint, completion_tokens bigint, total_tokens bigint, estimated_calls bigint)
language sql stable as $$
  select u.model, u.feature, count(*), sum(u.prompt_tokens)::bigint, sum(u.completion_tokens)::bigint, sum(u.total_tokens)::bigint, count(*) filter (where u.estimated)
  from crm.llm_usage u
  where (p_from is null or u.created_at >= p_from) and (p_to is null or u.created_at < p_to)
  group by u.model, u.feature
$$;

-- search_path для остальных функций и триггерных тел
alter function crm.norm(text) set search_path = crm, public;
alter function crm.set_updated_at() set search_path = crm, public;
alter function crm.touch_templates() set search_path = crm, public;
alter function crm.clients_by_note_words(text[], text[], text[], timestamptz) set search_path = crm, public;
alter function crm.claim_jobs(int) set search_path = crm, public;
alter function crm.analytics_templates(timestamptz, timestamptz) set search_path = crm, public;
alter function crm.analytics_llm(timestamptz, timestamptz) set search_path = crm, public;
alter function crm.lead_comment_to_note() set search_path = crm, public;

-- ───────── 4. Права на схему (RLS остаётся на таблицах, ограничения не ослабляем) ─────────
grant usage on schema crm to anon, authenticated, service_role;
grant all on all tables in schema crm to anon, authenticated, service_role;
grant all on all sequences in schema crm to anon, authenticated, service_role;
grant execute on all functions in schema crm to anon, authenticated, service_role;
alter default privileges in schema crm grant all on tables to anon, authenticated, service_role;
alter default privileges in schema crm grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema crm grant execute on functions to anon, authenticated, service_role;

-- ───────── 5. Расписание pg_cron: команды пишутся текстом, старые ссылаются на public ─────────
select cron.unschedule('st96-run-jobs') where exists (select 1 from cron.job where jobname = 'st96-run-jobs');
select cron.unschedule('st96-clean-updates') where exists (select 1 from cron.job where jobname = 'st96-clean-updates');

select cron.schedule(
  'st96-run-jobs',
  '* * * * *',
  $$select net.http_post(url := 'https://st96.by/api/jobs', headers := '{"Content-Type":"application/json"}'::jsonb, body := '{}'::jsonb)$$
);

select cron.schedule('st96-clean-updates', '17 3 * * *', $$delete from crm.processed_updates where received_at < now() - interval '7 days'$$);

-- ───────── 6. Проверка после применения ─────────
-- select count(*) from pg_tables where schemaname = 'public';   -- ожидаем 0 (кроме расширений)
-- select count(*) from pg_tables where schemaname = 'crm';      -- ожидаем 24
-- select * from cron.job;                                        -- обе задачи с crm.*
-- Подсказка PostgREST о новой схеме: notify pgrst, 'reload config';

commit;

-- 0024: личный кабинет клиента — аккаунты, корзина, заказы, документы, докупка кредитов.
begin;

-- ───────── 1. Аккаунт кабинета (Google через Supabase Auth) ─────────
create table if not exists crm.client_accounts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  client_id uuid not null references crm.clients(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  telegram_user_id bigint,
  telegram_username text,
  telegram_linked_at timestamptz,
  onboarding_status text not null default 'telegram_required'
    check (onboarding_status in ('telegram_required', 'complete')),
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists client_accounts_client_uidx on crm.client_accounts (client_id);
create unique index if not exists client_accounts_tg_uidx on crm.client_accounts (telegram_user_id) where telegram_user_id is not null;
create index if not exists client_accounts_email_idx on crm.client_accounts (lower(email));
drop trigger if exists client_accounts_updated on crm.client_accounts;
create trigger client_accounts_updated before update on crm.client_accounts
  for each row execute function crm.set_updated_at();

-- ───────── 2. Одноразовые токены привязки Telegram ─────────
create table if not exists crm.client_link_tokens (
  token text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid not null references crm.clients(id) on delete cascade,
  kind text not null default 'telegram' check (kind in ('telegram')),
  expires_at timestamptz not null default now() + interval '15 minutes',
  used_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists client_link_tokens_user_idx on crm.client_link_tokens (user_id, kind, created_at desc);

-- ───────── 3. Корзина ─────────
create table if not exists crm.cart_items (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references crm.clients(id) on delete cascade,
  kind text not null check (kind in ('package', 'topup')),
  package_id uuid references crm.packages(id) on delete set null,
  credits int check (credits is null or credits > 0),
  project_id uuid references crm.client_projects(id) on delete set null,
  title text not null,
  unit_price numeric(12,2) not null check (unit_price >= 0),
  currency text not null default 'BYN',
  quantity int not null default 1 check (quantity > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cart_items_shape check (
    (kind = 'package' and package_id is not null and credits is null) or
    (kind = 'topup'   and package_id is null and credits is not null)
  )
);
create unique index if not exists cart_items_package_uidx on crm.cart_items (client_id, package_id) where kind = 'package';
create unique index if not exists cart_items_topup_uidx on crm.cart_items (client_id, credits) where kind = 'topup';
drop trigger if exists cart_items_updated on crm.cart_items;
create trigger cart_items_updated before update on crm.cart_items
  for each row execute function crm.set_updated_at();

-- ───────── 4. Заказы (все покупки = заявки) ─────────
create sequence if not exists crm.order_number_seq;
create table if not exists crm.orders (
  id uuid primary key default gen_random_uuid(),
  number text not null unique default (
    'ST-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('crm.order_number_seq')::text, 6, '0')
  ),
  client_id uuid not null references crm.clients(id) on delete restrict,
  project_id uuid references crm.client_projects(id) on delete set null,
  kind text not null check (kind in ('package', 'topup', 'upgrade', 'mixed', 'renewal')),
  payer_type text not null check (payer_type in ('individual', 'legal')),
  status text not null default 'pending_payment'
    check (status in ('pending_payment', 'paid', 'fulfilled', 'cancelled', 'expired')),
  amount numeric(12,2) not null check (amount >= 0),
  currency text not null default 'BYN',
  buyer jsonb not null default '{}'::jsonb,
  meta jsonb not null default '{}'::jsonb,
  invoice_id uuid references crm.invoices(id) on delete set null,
  period_id uuid references crm.package_periods(id) on delete set null,
  lead_id uuid references crm.leads(id) on delete set null,
  payment_link text,
  idempotency_key text,
  paid_at timestamptz,
  fulfilled_at timestamptz,
  cancelled_at timestamptz,
  expires_at timestamptz not null default now() + interval '5 days',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (client_id, idempotency_key)
);
create index if not exists orders_client_idx on crm.orders (client_id, created_at desc);
create index if not exists orders_status_idx on crm.orders (status) where status in ('pending_payment', 'paid');
create unique index if not exists orders_one_open_project_idx on crm.orders (project_id)
  where status = 'pending_payment' and project_id is not null;
drop trigger if exists orders_updated on crm.orders;
create trigger orders_updated before update on crm.orders
  for each row execute function crm.set_updated_at();

-- ───────── 5. Позиции заказа ─────────
create table if not exists crm.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references crm.orders(id) on delete cascade,
  kind text not null check (kind in ('package', 'topup')),
  package_id uuid references crm.packages(id) on delete set null,
  credits int,
  title text not null,
  unit_price numeric(12,2) not null,
  quantity int not null default 1 check (quantity > 0),
  amount numeric(12,2) not null,
  meta jsonb not null default '{}'::jsonb
);
create index if not exists order_items_order_idx on crm.order_items (order_id);

-- ───────── 6. Документы: счёт, акт, чек ─────────
create table if not exists crm.billing_documents (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references crm.clients(id) on delete cascade,
  order_id uuid references crm.orders(id) on delete set null,
  invoice_id uuid references crm.invoices(id) on delete set null,
  period_id uuid references crm.package_periods(id) on delete set null,
  kind text not null check (kind in ('invoice', 'act', 'receipt')),
  number text not null,
  issued_at timestamptz,                 -- заполняется при выпуске (не при создании)
  amount numeric(12,2) not null check (amount >= 0),
  currency text not null default 'BYN',
  file_path text,
  status text not null default 'draft' check (status in ('draft', 'issued', 'void')),
  meta jsonb not null default '{}'::jsonb,
  created_by uuid references crm.admins(user_id) on delete set null,
  created_at timestamptz not null default now(),
  unique (kind, number)
);
create index if not exists billing_documents_client_idx on crm.billing_documents (client_id, issued_at desc);
create unique index if not exists billing_documents_order_kind_uidx on crm.billing_documents (order_id, kind)
  where order_id is not null;
create index if not exists billing_documents_order_idx on crm.billing_documents (order_id);

-- ───────── 7. Докупленные кредиты (баланс, не сгорает) ─────────
create table if not exists crm.client_credit_topups (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references crm.clients(id) on delete cascade,
  project_id uuid references crm.client_projects(id) on delete set null,
  order_id uuid references crm.orders(id) on delete set null,
  credits int not null check (credits > 0),
  credits_used int not null default 0 check (credits_used >= 0 and credits_used <= credits),
  created_at timestamptz not null default now()
);
create index if not exists client_credit_topups_balance_idx
  on crm.client_credit_topups (client_id, project_id) where credits_used < credits;

-- ───────── 8. Журнал слияний карточек клиента ─────────
create table if not exists crm.client_merges (
  id bigint generated always as identity primary key,
  from_client_id uuid not null,
  to_client_id uuid not null,
  reason text,
  payload jsonb,
  created_by uuid,
  created_at timestamptz not null default now()
);

-- ───────── 9. Публичные поля проекта ─────────
alter table crm.client_projects add column if not exists title text;
alter table crm.client_projects add column if not exists domain text;
alter table crm.client_projects add column if not exists public_url text;
alter table crm.client_projects add column if not exists platform text;  -- Tilda / свой код / другое (для карточки в кабинете)
alter table crm.client_projects add column if not exists auto_renew boolean not null default false;
alter table crm.client_projects add column if not exists auto_renew_changed_at timestamptz;

-- Период хранит пакет, по которому он открыт: кабинет показывает пакет и лимиты периода.
alter table crm.package_periods add column if not exists package_id uuid references crm.packages(id) on delete set null;
update crm.package_periods pr
set package_id = cp.package_id
from crm.client_projects cp
where pr.project_id = cp.id and pr.package_id is null;

-- ───────── 10. Отложенная активация периода (продление, §10) ─────────
alter table crm.package_periods drop constraint if exists package_periods_status_check;
alter table crm.package_periods add constraint package_periods_status_check
  check (status in ('pending_payment', 'pending_activation', 'active', 'expired', 'blocked'));

-- ───────── 11. Согласование с существующим кодом и данными ─────────
-- 11.1 leads: источник «кабинет» (CHECK из 0001 и LeadInsert.source не знают 'cabinet')
alter table crm.leads drop constraint if exists leads_source_check;
alter table crm.leads add constraint leads_source_check
  check (source in ('site_form', 'stand_form', 'tg_group', 'bot', 'manual', 'cabinet'));

-- 11.2 цены пакетов: в 0016/0022 price не заполнялась, а checkout считает по packages.price
update crm.packages p set price = v.price, currency = 'BYN'
from (values ('basic', 320), ('standard', 560), ('professional', 720), ('ultimate', 1025)) as v(code, price)
where p.code = v.code and p.price is null;

-- 11.3 credits_limit существующих периодов: startPeriod его не копировал из пакета
update crm.package_periods pr
set credits_limit = pk.credits
from crm.client_projects cp
join crm.packages pk on pk.id = cp.package_id
where pr.project_id = cp.id and pr.credits_limit is null;

-- 11.4 архивные счета → документы: у действующих клиентов «Документы» не должны быть пустыми
insert into crm.billing_documents
  (client_id, invoice_id, kind, number, issued_at, amount, currency, file_path, status, meta)
select
  i.client_id,
  i.id,
  'invoice',
  'АРХ-' || to_char(i.created_at, 'YYYY') || '-' || lpad(
    (row_number() over (order by i.created_at))::text, 5, '0'),
  -- issued_at только если документ реально доступен (есть внешняя ссылка)
  case when i.status <> 'cancelled' and i.link_or_file ~ '^https?://'
       then coalesce(i.confirmed_at, i.created_at) end,
  i.amount,
  i.currency,
  null,  -- file_path: только ключ Storage, внешние ссылки туда не пишем
  case
    when i.status = 'cancelled' then 'void'
    when i.link_or_file ~ '^https?://' then 'issued'
    else 'draft'
  end,
  jsonb_build_object(
    'legacy', true,
    'legacy_url', case when i.link_or_file ~ '^https?://' then i.link_or_file end,
    'link_or_file', i.link_or_file,
    'invoice_kind', i.kind)
from crm.invoices i
where not exists (select 1 from crm.billing_documents d where d.invoice_id = i.id)
on conflict (kind, number) do nothing;

-- ───────── 12. Нумерация документов и очередь писем ─────────
create table if not exists crm.document_sequences (
  prefix text not null,          -- 'СЧ', 'АКТ', 'ЧЕК'
  year int not null,
  last_no int not null default 0,
  primary key (prefix, year)
);

create or replace function crm.next_document_number(p_prefix text)
returns text
language plpgsql security definer set search_path = crm, public as $$
declare
  v_year int := extract(year from now())::int;
  v_no int;
begin
  insert into crm.document_sequences (prefix, year, last_no)
  values (p_prefix, v_year, 1)
  on conflict (prefix, year) do update
    set last_no = crm.document_sequences.last_no + 1
  returning last_no into v_no;
  return p_prefix || '-' || v_year::text || '-' || lpad(v_no::text, 6, '0');
end $$;

-- Нумерация — только серверу: анонимный RPC не должен двигать последовательность.
revoke all on function crm.next_document_number(text) from public, anon, authenticated;
grant execute on function crm.next_document_number(text) to service_role;


create table if not exists crm.telegram_outbox (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references crm.clients(id) on delete set null,
  tg_user_id bigint not null,
  template text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'queued' check (status in ('queued', 'sent', 'failed')),
  attempts int not null default 0,
  last_error text,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);
create index if not exists telegram_outbox_queue_idx on crm.telegram_outbox (status, created_at);

create table if not exists crm.email_outbox (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references crm.clients(id) on delete set null,
  to_email text,             -- nullable: при отсутствии email строка skipped
  template text not null,        -- order_created, invoice_ready, paid, docs_ready, renewal, expired
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'queued' check (status in ('queued', 'sent', 'failed', 'skipped')),
  attempts int not null default 0,
  last_error text,
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  check (to_email is not null or status = 'skipped')
);
create index if not exists email_outbox_queue_idx on crm.email_outbox (status, created_at);

-- одна открытая renewal-заявка на проект
create unique index if not exists orders_one_open_renewal_idx
  on crm.orders (project_id)
  where kind = 'renewal' and status in ('pending_payment', 'paid');

-- ───────── RLS: админы — всё; клиентские политики — только безопасные таблицы ─────────
do $$
declare t text;
begin
  foreach t in array array[
    'client_accounts', 'client_link_tokens', 'cart_items', 'orders',
    'order_items', 'billing_documents', 'client_credit_topups', 'client_merges',
    'document_sequences', 'email_outbox', 'telegram_outbox'
  ] loop
    execute format('alter table crm.%I enable row level security', t);
    execute format('drop policy if exists "admins full access" on crm.%I', t);
    execute format(
      'create policy "admins full access" on crm.%I for all to authenticated '
      'using (crm.is_admin()) with check (crm.is_admin())', t);
  end loop;
end $$;

-- Чтение своих данных (защита в глубину; запись — только через API с service-role)
create policy "client read own account" on crm.client_accounts
  for select to authenticated using (user_id = auth.uid());
create policy "client read own cart" on crm.cart_items
  for select to authenticated using (exists (
    select 1 from crm.client_accounts a where a.user_id = auth.uid() and a.client_id = cart_items.client_id));
create policy "client read own orders" on crm.orders
  for select to authenticated using (exists (
    select 1 from crm.client_accounts a where a.user_id = auth.uid() and a.client_id = orders.client_id));
create policy "client read own order items" on crm.order_items
  for select to authenticated using (exists (
    select 1 from crm.orders o join crm.client_accounts a on a.client_id = o.client_id
    where o.id = order_items.order_id and a.user_id = auth.uid()));
create policy "client read own documents" on crm.billing_documents
  for select to authenticated using (exists (
    select 1 from crm.client_accounts a where a.user_id = auth.uid() and a.client_id = billing_documents.client_id));
create policy "client read own topups" on crm.client_credit_topups
  for select to authenticated using (exists (
    select 1 from crm.client_accounts a where a.user_id = auth.uid() and a.client_id = client_credit_topups.client_id));

-- ВАЖНО: client_projects / package_periods / support_jobs / invoices НЕ получают клиентских
-- политик: в них есть внутренние поля (workspace_path, repo_url, deploy_cmd, result_json,
-- tokens_used, usd_cost, payment_id). Кабинет читает их только через API (service-role),
-- который отдаёт безопасный набор полей. Прямой PostgREST-доступ клиента к ним запрещён.

-- ───────── Storage: приватный бакет документов ─────────
insert into storage.buckets (id, name, public) values ('documents', 'documents', false)
  on conflict (id) do nothing;
-- Клиент не читает бакет напрямую: API отдаёт подписанные ссылки (TTL 60 с).

-- ───────── Настройки (значения пишет админ/сервер) ─────────
insert into crm.app_settings (key, value) values
  ('support.topup_rate', to_jsonb('0.30'::text)),
  ('support.payment_deadline_days', to_jsonb('5'::text)),
  ('support.documents_bucket', to_jsonb('documents'::text))
on conflict (key) do nothing;


-- ───────── 13. Автопродление: ежедневная заявка за 7 дней до конца периода ─────────
create or replace function crm.create_renewal_orders()
returns int
language plpgsql security definer set search_path = crm, public as $$
declare
  r record;
  v_order uuid;
  v_invoice uuid;
  v_count int := 0;
  v_number text;
begin
  for r in
    select cp.id as project_id, cp.client_id, cp.package_id, pk.title, pk.price, pk.currency,
           c.client_kind, p.period_end
    from crm.client_projects cp
    join crm.clients c on c.id = cp.client_id
    join crm.packages pk on pk.id = cp.package_id
    join lateral (
      select period_end from crm.package_periods
      where project_id = cp.id and status = 'active'
      order by period_end desc limit 1
    ) p on true
    where cp.auto_renew = true
      and cp.status = 'active'
      and pk.price is not null
      and p.period_end between now() + interval '7 days' and now() + interval '8 days'
      and not exists (
        select 1 from crm.orders o
        where o.project_id = cp.id
          and (o.status = 'pending_payment' or (o.kind = 'renewal' and o.status = 'paid'))
      )
  loop
    insert into crm.orders (client_id, project_id, kind, payer_type, amount, currency, buyer, meta, expires_at)
    values (
      r.client_id, r.project_id, 'renewal', coalesce(r.client_kind, 'individual'),
      r.price, r.currency, '{}'::jsonb,
      jsonb_build_object('source', 'auto_renew', 'renewal', true, 'period_end', r.period_end),
      now() + make_interval(days => coalesce((select nullif(trim(both '"' from value::text), '')::int
        from crm.app_settings where key = 'support.payment_deadline_days'), 5))
    )
    returning id into v_order;

    insert into crm.order_items (order_id, kind, package_id, title, unit_price, quantity, amount, meta)
    values (v_order, 'package', r.package_id, r.title, r.price, 1, r.price, '{}'::jsonb);

    insert into crm.invoices (client_id, project_id, kind, amount, currency, status, link_or_file)
    values (r.client_id, r.project_id, 'period', r.price, r.currency, 'sent', 'auto-renewal')
    returning id into v_invoice;

    update crm.orders set invoice_id = v_invoice where id = v_order;

    -- Счёт для юрлица — сразу; PDF выпустит воркер/админ.
    if r.client_kind = 'legal' then
      v_number := crm.next_document_number('СЧ');
      insert into crm.billing_documents (client_id, order_id, invoice_id, kind, number, amount, currency, status, meta)
      values (r.client_id, v_order, v_invoice, 'invoice', v_number, r.price, r.currency, 'draft', jsonb_build_object('generated', 'auto_renew'));
    end if;

    insert into crm.email_outbox (client_id, to_email, template, status, payload)
    select r.client_id, c.email, 'renewal_soon',
           case when c.email is null then 'skipped' else 'queued' end,
           jsonb_build_object('order_id', v_order, 'project_id', r.project_id, 'amount', r.price)
    from crm.clients c where c.id = r.client_id;

    insert into crm.telegram_outbox (client_id, tg_user_id, template, payload)
    select r.client_id, c.tg_user_id, 'renewal_soon',
           jsonb_build_object('order_id', v_order, 'project_id', r.project_id, 'amount', r.price)
    from crm.clients c
    where c.id = r.client_id and c.tg_user_id is not null;

    v_count := v_count + 1;
  end loop;
  return v_count;
end $$;

revoke all on function crm.create_renewal_orders() from public, anon, authenticated;
grant execute on function crm.create_renewal_orders() to service_role;

select cron.unschedule('st96-renewals') where exists (select 1 from cron.job where jobname = 'st96-renewals');
select cron.schedule('st96-renewals', '15 3 * * *', $$select crm.create_renewal_orders()$$);

-- Неоплаченные заявки: expired, счёт отменяется, документы аннулируются, клиенту — письмо.
create or replace function crm.expire_cabinet_orders()
returns int
language plpgsql security definer set search_path = crm, public as $$
declare
  v_count int;
begin
  with expired as (
    update crm.orders
    set status = 'expired', cancelled_at = now()
    where status = 'pending_payment' and expires_at < now()
    returning id, client_id, invoice_id, project_id, number, amount
  ),
  inv as (
    update crm.invoices set status = 'cancelled'
    where id in (select invoice_id from expired where invoice_id is not null)
    returning id
  ),
  docs as (
    update crm.billing_documents set status = 'void'
    where order_id in (select id from expired) and status <> 'void'
    returning id
  ),
  periods as (
    update crm.package_periods set status = 'expired'
    where status in ('active', 'pending_payment') and period_end < now()
      and project_id in (select project_id from expired where project_id is not null)
    returning id
  ),
  mail as (
    insert into crm.email_outbox (client_id, to_email, template, status, payload)
    select e.client_id, c.email, 'expired',
           case when c.email is null then 'skipped' else 'queued' end,
           jsonb_build_object('order_id', e.id, 'order_number', e.number, 'amount', e.amount)
    from expired e join crm.clients c on c.id = e.client_id
    returning id
  ),
  tg as (
    insert into crm.telegram_outbox (client_id, tg_user_id, template, payload)
    select e.client_id, c.tg_user_id, 'expired',
           jsonb_build_object('order_id', e.id, 'order_number', e.number, 'amount', e.amount)
    from expired e join crm.clients c on c.id = e.client_id
    where c.tg_user_id is not null
    returning id
  )
  select count(*) into v_count from expired;
  return coalesce(v_count, 0);
end $$;

revoke all on function crm.expire_cabinet_orders() from public, anon, authenticated;
grant execute on function crm.expire_cabinet_orders() to service_role;

select cron.unschedule('st96-expire-orders') where exists (select 1 from cron.job where jobname = 'st96-expire-orders');
select cron.schedule('st96-expire-orders', '45 3 * * *', $$select crm.expire_cabinet_orders()$$);

-- Очередной оплаченный период (renewal/пакет при активном периоде) включается в дату начала.
create or replace function crm.activate_pending_periods()
returns int
language plpgsql security definer set search_path = crm, public as $$
declare r record; v_count int := 0;
begin
  for r in
    select id, project_id from crm.package_periods
    where status = 'pending_activation' and period_start <= now()
  loop
    update crm.package_periods set status = 'expired'
    where project_id = r.project_id and status = 'active' and id <> r.id;
    update crm.package_periods set status = 'active' where id = r.id;
    v_count := v_count + 1;
  end loop;
  return v_count;
end $$;

revoke all on function crm.activate_pending_periods() from public, anon, authenticated;
grant execute on function crm.activate_pending_periods() to service_role;

select cron.unschedule('st96-activate-periods') where exists (select 1 from cron.job where jobname = 'st96-activate-periods');
select cron.schedule('st96-activate-periods', '5 * * * *', $$select crm.activate_pending_periods()$$);




-- Подтверждение оплаты одной транзакцией: блокировка заказа, CAS, все артефакты идемпотентно.
create or replace function crm.cabinet_confirm_payment(p_order_id uuid, p_admin uuid default null)
returns jsonb
language plpgsql security definer set search_path = crm, public as $$
declare
  v_order crm.orders%rowtype;
  v_pkg crm.packages%rowtype;
  v_item record;
  v_client crm.clients%rowtype;
  v_period uuid;
  v_current_end timestamptz;
  v_start timestamptz;
  v_end timestamptz;
  v_number text;
  v_exists int;
  v_items int;
  v_has_package boolean := false;
begin
  select * into v_order from crm.orders where id = p_order_id for update;
  if not found then return jsonb_build_object('error', 'not_found'); end if;
  if v_order.status = 'fulfilled' then return jsonb_build_object('ok', true, 'idempotent', true); end if;
  if v_order.status not in ('pending_payment', 'paid') then
    return jsonb_build_object('error', 'order_cannot_be_confirmed');
  end if;

  -- Preconditions до любых записей.
  if v_order.invoice_id is null then return jsonb_build_object('error', 'invoice_missing'); end if;
  select count(*) into v_items from crm.order_items where order_id = v_order.id;
  if v_items = 0 then return jsonb_build_object('error', 'items_missing'); end if;

  select * into v_item from crm.order_items
  where order_id = v_order.id and kind = 'package' limit 1;
  if found then
    v_has_package := true;
    if v_order.project_id is null then return jsonb_build_object('error', 'project_required'); end if;
    select * into v_pkg from crm.packages where id = v_item.package_id;
    if not found then return jsonb_build_object('error', 'package_not_found'); end if;
    if v_order.period_id is null then
      select max(period_end) into v_current_end from crm.package_periods
      where project_id = v_order.project_id and status = 'active';
    end if;
  end if;

  update crm.orders set status = 'paid', paid_at = now() where id = v_order.id;

  if v_has_package and v_order.period_id is null then
    v_start := coalesce(v_current_end, now());
    v_end := v_start + interval '1 month';
    insert into crm.package_periods (
      project_id, package_id, period_start, period_end, status,
      credits_limit, corrections_limit, features_limit, requests_limit
    ) values (
      v_order.project_id, v_item.package_id, v_start, v_end,
      case when v_current_end is not null and v_current_end > now() then 'pending_activation' else 'active' end,
      v_pkg.credits, v_pkg.corrections_limit, v_pkg.features_limit, v_pkg.requests_limit
    ) returning id into v_period;
    update crm.orders set period_id = v_period where id = v_order.id;
    update crm.client_projects set package_id = v_item.package_id where id = v_order.project_id;
  else
    v_period := v_order.period_id;
  end if;

  for v_item in select * from crm.order_items where order_id = v_order.id and kind = 'topup' loop
    if v_item.credits is not null and v_item.credits > 0 then
      select count(*) into v_exists from crm.client_credit_topups
      where order_id = v_order.id and credits = v_item.credits
        and project_id is not distinct from coalesce(v_item.meta->>'project_id', v_order.project_id)::uuid;
      if v_exists = 0 then
        insert into crm.client_credit_topups (client_id, project_id, order_id, credits)
        values (v_order.client_id, coalesce(v_item.meta->>'project_id', v_order.project_id)::uuid, v_order.id, v_item.credits);
      end if;
    end if;
  end loop;

  update crm.invoices
  set status = 'paid_confirmed', confirmed_at = now(), confirmed_by = p_admin, period_id = v_period
  where id = v_order.invoice_id;

  if v_order.payer_type = 'legal' then
    if not exists (select 1 from crm.billing_documents where order_id = v_order.id and kind = 'act') then
      v_number := crm.next_document_number('АКТ');
      insert into crm.billing_documents (
        client_id, order_id, invoice_id, period_id, kind, number, amount, currency, status, created_by, meta
      ) values (
        v_order.client_id, v_order.id, v_order.invoice_id, v_period, 'act', v_number,
        v_order.amount, v_order.currency, 'draft', p_admin,
        jsonb_build_object('payer_type', 'legal', 'generated', 'payment_confirm')
      );
    end if;
  end if;

  select * into v_client from crm.clients where id = v_order.client_id;
  if not exists (
    select 1 from crm.email_outbox
    where template = 'paid' and payload->>'order_id' = v_order.id::text
  ) then
    insert into crm.email_outbox (client_id, to_email, template, status, payload)
    values (
      v_order.client_id, v_client.email, 'paid',
      case when v_client.email is null then 'skipped' else 'queued' end,
      jsonb_build_object('order_id', v_order.id, 'order_number', v_order.number, 'amount', v_order.amount, 'currency', v_order.currency)
    );
  end if;
  if v_client.tg_user_id is not null and not exists (
    select 1 from crm.telegram_outbox
    where template = 'paid' and payload->>'order_id' = v_order.id::text
  ) then
    insert into crm.telegram_outbox (client_id, tg_user_id, template, payload)
    values (v_order.client_id, v_client.tg_user_id, 'paid',
      jsonb_build_object('order_id', v_order.id, 'order_number', v_order.number, 'amount', v_order.amount, 'currency', v_order.currency));
  end if;

  update crm.orders set status = 'fulfilled', fulfilled_at = now() where id = v_order.id;

  insert into crm.audit_log (admin_id, action, entity, entity_id, data)
  values (p_admin, 'cabinet.confirm_payment', 'order', v_order.id::text,
    jsonb_build_object('number', v_order.number, 'amount', v_order.amount, 'period_id', v_period));

  return jsonb_build_object('ok', true);
end $$;

-- Аннулирование: блокировка, откат артефактов, идемпотентная очистка.
create or replace function crm.cabinet_void_order(p_order_id uuid, p_admin uuid default null)
returns jsonb
language plpgsql security definer set search_path = crm, public as $$
declare
  v_order crm.orders%rowtype;
  v_period crm.package_periods%rowtype;
begin
  select * into v_order from crm.orders where id = p_order_id for update;
  if not found then return jsonb_build_object('error', 'not_found'); end if;
  if v_order.status = 'fulfilled' then return jsonb_build_object('error', 'fulfilled_order'); end if;

  update crm.orders set status = 'cancelled', cancelled_at = coalesce(cancelled_at, now()) where id = v_order.id;

  delete from crm.client_credit_topups where order_id = v_order.id;

  if v_order.period_id is not null then
    select * into v_period from crm.package_periods where id = v_order.period_id;
    if found then
      if v_period.status = 'pending_activation' then
        delete from crm.package_periods where id = v_period.id;
      else
        update crm.package_periods set status = 'expired' where id = v_period.id;
      end if;
    end if;
    update crm.orders set period_id = null where id = v_order.id;
  end if;

  update crm.billing_documents set status = 'void' where order_id = v_order.id;
  if v_order.invoice_id is not null then
    update crm.invoices set status = 'cancelled' where id = v_order.invoice_id;
  end if;
  delete from crm.email_outbox where payload->>'order_id' = v_order.id::text;
  delete from crm.telegram_outbox where payload->>'order_id' = v_order.id::text;

  insert into crm.audit_log (admin_id, action, entity, entity_id, data)
  values (p_admin, 'cabinet.void_order', 'order', v_order.id::text,
    jsonb_build_object('number', v_order.number, 'amount', v_order.amount));

  return jsonb_build_object('ok', true);
end $$;

revoke all on function crm.cabinet_confirm_payment(uuid, uuid) from public, anon, authenticated;
revoke all on function crm.cabinet_void_order(uuid, uuid) from public, anon, authenticated;
grant execute on function crm.cabinet_confirm_payment(uuid, uuid) to service_role;
grant execute on function crm.cabinet_void_order(uuid, uuid) to service_role;

commit;

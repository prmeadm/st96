# Личный кабинет клиента ST96 — данные, миграция, API

Статус: проект решения (не реализовано). Дата: 2026-11-26.
Связанные документы: [CABINET-SPEC.md](../CABINET-SPEC.md), [screens-flows.md](screens-flows.md), [SUPPORT-SPEC.md](../SUPPORT-SPEC.md), [DATABASE.md](../DATABASE.md).

Документ фиксирует: новые таблицы и миграцию `0024_cabinet.sql`, RLS, вход через Google (Supabase Auth),
привязку Telegram, API кабинета, правила слияния карточки клиента, оформление заказов
(физлицо/юрлицо), активацию периода и кредитов, генерацию и хранение счетов/актов/чеков.

---

## 1. Контекст и границы

Уже есть (не переделываем):

| Сущность | Таблица `crm.*` | Что даёт кабинету |
| --- | --- | --- |
| Клиент | `clients` | карточка: имя, телефон, email, telegram, тип, реквизиты |
| Проект | `client_projects` | проекты клиента, привязка пакета |
| Пакет | `packages` | название, цена, кредиты, лимиты |
| Период | `package_periods` | `credits_limit` / `credits_used`, даты, статус |
| Задачи | `support_jobs` | `request_text`, `status`, `st_credits`, даты |
| Счета | `invoices` | сумма, статус, подтверждение админом |
| Настройки | `app_settings` | `support.payment_link`, `support.studio_requisites`, `support.credit_prices` |

Добавляем: аккаунты кабинета, корзину, заказы (покупки), позиции заказов, документы
(счёт/акт/чек), баланс докупленных кредитов, журнал слияний карточек.

Границы первой версии: оплата подтверждается вручную администратором (как сейчас);
автоматический эквайринг с колбэком, возвраты, мультивалютность — не входят; email-письма
(mail.ru) и автоматические PDF — входят (см. §12, §16–17).

---

## 2. Схема (ER)

~~~mermaid
erDiagram
  auth_users ||--o| client_accounts : "google"
  clients ||--o| client_accounts : "1 Google-аккаунт"
  clients ||--o{ client_projects : "проекты"
  clients ||--o{ cart_items : "корзина"
  clients ||--o{ orders : "покупки"
  clients ||--o{ billing_documents : "документы"
  clients ||--o{ client_credit_topups : "купленные кредиты"
  client_projects ||--o{ package_periods : "периоды"
  orders ||--o{ order_items : "позиции"
  orders ||--o| package_periods : "оплаченный период"
  orders ||--o| invoices : "счёт"
  orders ||--o{ billing_documents : "счёт/акт/чек"
  orders ||--o| leads : "заявка в CRM (crm.leads)"
  packages ||--o{ cart_items : "товар"
  packages ||--o{ order_items : "товар"
~~~

Один Google-аккаунт — одна карточка клиента (`client_accounts.client_id unique`).
Один заказ — один проект (для пакета/докупки) и один плательщик.

---

## 3. Миграция `crm/supabase/migrations/0024_cabinet.sql`

Черновик DDL (применяется в SQL-редакторе Supabase вручную, как `0016`–`0023`).

~~~sql
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

-- период хранит пакет, по которому открыт (кабинет показывает пакет/лимиты)
alter table crm.package_periods add column if not exists package_id uuid references crm.packages(id) on delete set null;
update crm.package_periods pr set package_id = cp.package_id
from crm.client_projects cp where pr.project_id = cp.id and pr.package_id is null;

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
    'document_sequences', 'email_outbox'
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

commit;
~~~

Проверить после применения: `crm.client_accounts`, `crm.orders`, `crm.billing_documents` существуют;
RLS включён; `storage.buckets` содержит `documents`; на прод-ключе `anon` клиент видит только свою строку.

---

## 4. Расширение существующих таблиц

| Таблица | Изменение | Зачем |
| --- | --- | --- |
| `client_projects` | `title`, `domain`, `public_url`, `platform` | показывать проекты клиенту без `workspace_path`/`repo_url` |
| `clients` | без изменений; используются `email`, `tg_user_id`, `tg_username`, `client_kind`, реквизиты | карточка создаётся/сливается |
| `invoices` | без изменения схемы; заказ ссылается на неё (`orders.invoice_id`) | существующая админка подтверждения |
| `app_settings` | `support.topup_rate`, `support.payment_deadline_days`, `support.documents_bucket` | цена докупки и сроки |
| `tg_links` | не трогаем (это привязка для `/book`) | отдельный `client_link_tokens` |

Правило: внутренние поля проекта (`workspace_path`, `repo_url`, `deploy_target`, `deploy_cmd`,
`agent_scenario_id`) в клиентский API не попадают никогда.

---

## 5. RLS и доступ

- Браузер кабинета **не ходит в Supabase-таблицы напрямую**: все чтения/записи — через
  `crm/api/cabinet.ts` с service-role после проверки JWT. Политики «client read own» есть только
  у безопасных таблиц (аккаунт, корзина, заказы, позиции, документы, топ-апы); проекты, периоды,
  задачи и счета доступны клиенту только через API — в них есть внутренние поля.
- Запись клиента — только API (service-role) с проверкой `client_accounts.user_id = auth.uid()`.
- Админ — существующая политика `crm.is_admin()`; подтверждение оплаты и документы — админские
  действия, не клиентские.
- Storage `documents` — private; ссылки подписываются на 60 секунд по запросу владельца документа.
- Наружу не отдаём: токены, `file_path` без подписи, внутренние поля проектов, чужие `client_id`.

---

## 6. Вход через Google (Supabase Auth)

1. Google Cloud Console → OAuth client (Web): redirect URI
   `https://<project-ref>.supabase.co/auth/v1/callback`.
2. Supabase Dashboard → Authentication → Providers → Google: вставить Client ID/Secret.
3. Authentication → URL Configuration: Site URL `https://st96.by`;
   Redirect URLs: `https://st96.by/cabinet`, `https://st96.by/cabinet/*`,
   `http://localhost:5173/cabinet*`, превью-домены Vercel (`https://*.vercel.app/cabinet*`).
4. Переменные Vercel: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` (браузер);
   на сервер добавить `SUPABASE_ANON_KEY` (то же значение, для проверки JWT).
5. Клиент: `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: '<origin>/cabinet' } })`.
6. Сервер: `const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: 'Bearer ' + jwt } } }); const { data } = await db.auth.getUser()`.
   Если пользователь не найден → 401. Затем service-role клиент для данных.

Первый вход: `POST /api/cabinet action=bootstrap` — создаёт/находит карточку клиента и `client_accounts`,
возвращает профиль, `onboarding_status`, корзину и активный заказ.

---

## 7. Идентификация и слияние карточки клиента

Порядок при `bootstrap` (сервер, service-role):

1. `auth.users.id` уже в `client_accounts` → взять `client_id`, обновить `last_login_at`, email/имя/аватар из Google.
2. Иначе искать `clients` по `lower(email) = lower(google_email)`:
   - найдено ровно одно → привязать аккаунт к нему (`client_accounts.client_id`);
   - найдено несколько → привязать к карточке с активным проектом/периодом; остальные не трогать,
     конфликт записать в `client_merges` для разбора админом.
3. Не найдено → создать `clients` (`source='cabinet'`, `email`, `name`, `language='ru'`, `consent_at=now()`)
   и `client_accounts`; `onboarding_status='telegram_required'`.

При привязке Telegram (из бота, после `cab_<token>`):

1. Найти `client_accounts` по токену, взять текущий `client_id`.
2. Искать `clients` по `tg_user_id` или `lower(tg_username)`.
3. Если найден другой клиент:
   - если текущая карточка пустая (нет `client_projects`, `support_jobs`, `orders`,
     `invoices`) → перенести аккаунт на найденную карточку, пустую удалить/пометить;
   - если у обеих есть история → **слияние**: выбрать «главную» (больше проектов/задач/заказов; при равенстве —
     найденную по Telegram, там история бота), перенести `client_projects`, `cart_items`, `orders`,
     `billing_documents`, `support_jobs`, `invoices`, `leads` (по `client_id`), затем обновить
     `client_accounts.client_id`; запись в `client_merges` (from/to/reason/payload) + `audit_log`;
     уникальные поля (`phone`, `lower(tg_username)`) переносить аккуратно: сначала очистить у некритичной карточки.
4. Записать `telegram_user_id`, `telegram_username`, `telegram_linked_at` в `client_accounts` и
   `clients.tg_user_id/tg_username`; `onboarding_status='complete'`.

Если Telegram уже привязан к другому `client_accounts` (`client_accounts_tg_uidx`) — привязку отклонить:
«Этот Telegram уже привязан к другому кабинету, напишите в поддержку» (без автослияния аккаунтов).

Телефон/имя не используются для автоматического слияния (риск ложных совпадений); только email и Telegram.

---

## 8. Привязка Telegram через бота

1. Кабинет: `POST /api/cabinet action=telegram_start` → сервер создаёт
   `client_link_tokens` (`token` = 24 символа base64url, TTL 15 минут) и возвращает
   `https://t.me/st96_leads_bot?start=cab_<token>`.
2. Клиент открывает ссылку; бот (`crm/server/bot/bot.ts`) в обработчике `/start`:

~~~ts
// псевдокод ветки, до обычной логики согласия/воронок
const payload = ctx.match?.trim() ?? ''
if (payload.startsWith('cab_')) {
  const token = payload.slice(4)
  const link = await repo.getClientLinkToken(token) // только неиспользованный и не истёкший
  if (!link) return ctx.reply('Ссылка устарела. Откройте кабинет и нажмите «Привязать Telegram» ещё раз.')
  const result = await linkCabinetTelegram(repo, link, ctx.from) // §7: найти/слить/записать
  return ctx.reply(result.ok
    ? 'Telegram привязан. Вернитесь в личный кабинет — регистрация завершена.'
    : result.message)
}
~~~

3. Кабинет опрашивает `GET /api/cabinet?action=telegram_status` (раз в 2 с, максимум 90 с) и
   показывает «Telegram привязан».
4. Повторная привязка из профиля — тем же действием; старые токены инвалидируются.
5. Транзакционные сообщения (заказ, оплата, документы) бот отправляет на `clients.tg_user_id`
   независимо от маркетингового согласия; рассылки по-прежнему только при `consent_at`.

---

## 9. API кабинета

Файл `crm/api/cabinet.ts`, Edge runtime, один обработчик с `action` (по образцу `crm/api/booking.ts`).
Аутентификация: `Authorization: Bearer <supabase access token>`; сопоставление
`auth.uid() → client_accounts.client_id`; без токена — 401. Клиентские данные не кэшировать
(`Cache-Control: no-store`).

| action | метод | вход | ответ |
| --- | --- | --- | --- |
| `bootstrap` | POST | `{}` (JWT) | `{ profile, onboarding_status, cart, pending_order, telegram }` — создаёт/находит карточку |
| `summary` | GET | — | `{ profile, onboarding_status, package, projects[], credits, tasks_recent[], documents_recent[], orders_recent[], cart_count, alerts[] }` |
| `tasks` | GET | `project_id?`, `status?`, `limit=20`, `offset=0` | `{ items[], total }` |
| `projects` | GET | — | `{ items[{id,title,domain,public_url,platform,status,package,period,credits}] }` |
| `orders` | GET | `status?` | `{ items[{id,number,created_at,kind,status,payer_type,amount,currency,project,documents_count,source:'order'\|'legacy_invoice'}] }` — архивные счета без заказа показываются read-only |
| `order` | GET | `id` | заказ + позиции + документы + таймлайн |
| `documents` | GET | `kind?`, `limit/offset` | `{ items[{id,kind,number,issued_at,amount,currency,order_number,status,source:'document'\|'legacy',file_available}] }` |
| `document_url` | GET | `id` | `{ url, expires_in: 60 }` — подписанная ссылка Storage |
| `cart` | GET | — | `{ items[], total, currency }` |
| `cart_add` | POST | `{kind:'package', package_code}` или `{kind:'topup', credits}`, `project_id?` | `{ cart, added }` |
| `cart_update` | POST | `{id, quantity}` | `{ cart }` |
| `cart_remove` | POST | `{id}` | `{ cart }` |
| `checkout` | POST | `{payer_type, project_id, buyer, auto_renew?, idempotency_key}` | `{ order }` — `auto_renew` сохраняется в `client_projects.auto_renew` |
| `profile` | GET | — | `{ profile, client }` |
| `profile_save` | POST | `{name?, phone?, company?, language?, client_kind?, legal_name?, unp?, legal_address?, bank_details?}` | `{ profile }` |
| `project_auto_renew` | POST | `{project_id, enabled}` | `{ project }` — включает/выключает автопродление; после создания renewal-заявки возвращает 409 `renewal_exists` с `order_id` |
| `telegram_start` | POST | — | `{ deep_link, token, expires_at }` |
| `telegram_status` | GET | — | `{ linked, username }` |

`checkout`: `project_id` обязателен для пакета, если у клиента уже есть проекты; при 0 проектов
пакет можно оформить без проекта (`project_id=null`) — админ привязывает/создаёт проект до
подтверждения оплаты (`order_attach_project`). Для чистой докупки проект необязателен (баланс
клиента); если в корзине есть пакет, докупка идёт на проект пакета. `buyer` обязателен при
`payer_type='legal'`.

Ошибки: `{ error: { code, message } }` + HTTP 400/401/403/404/409/422/429/500.
Коды: `auth_required`, `telegram_required`, `cart_empty`, `project_required`, `project_forbidden`,
`legal_requisites_required`, `price_changed`, `order_exists`, `renewal_exists`, `rate_limited`, `not_found`.

Публичный `crm/api/packages.ts` расширить: `{ code, title, credits, price, currency, features_allowed, sort_order }`
(цены уже не секрет — они на сайте).

**Оформление заказа (`checkout`)** — одна транзакция (последовательно, с компенсацией):
1. Проверить: Telegram привязан; корзина не пуста; все позиции одного проекта (если в корзине есть
   пакет); `project_id` обязателен для пакета, когда у клиента уже есть проекты, и может быть `null`
   при 0 проектов (проект привяжет админ до оплаты); чистая докупка может быть без проекта;
   проект принадлежит клиенту; для юрлица заполнены `legal_name`, `unp`,
   `legal_address`, `bank_details` (валидация УНП: 9 цифр).
2. Пересчитать цены по актуальным `packages.price` / `support.topup_rate`; если расходятся с корзиной —
   `price_changed` (фронт показывает новые цены и просит подтвердить).
3. Создать `orders` (status `pending_payment`, `expires_at` по `support.payment_deadline_days`),
   `order_items` (снимок названий/цен), `invoices` (`kind`: пакет → `period`, докупка → `feature`,
   апгрейд → `upgrade`; для смешанной корзины `orders.kind='mixed'`, а `invoices.kind` =
   `period`, если в заказе есть пакет, иначе `feature`; `amount` = сумма заказа, `status='sent'`),
   обновить `orders.invoice_id`; создать `billing_documents(kind='invoice', status='draft')`
   для юрлица и поставить рендер в очередь — PDF-воркер сам ставит `issued` и `file_path`
   (админ вмешивается только при ошибке: перезапуск/загрузка файла).
4. Создать заявку: `ingestLead(repo, parsedLead, { source: 'cabinet', consent: true, rawText })`,
   `service='support'`, `client_kind`, комментарий «Покупка: … Заказ ST-…»; `orders.lead_id`.
   Уведомление в группу «Лиды ST96» — вынести общий `sendLeadNotification` из `api/lead.ts`
   в `crm/server/leads/notify.ts` и вызвать здесь.
5. Очистить корзину клиента; вернуть заказ с платёжной инструкцией и документами.
6. Повтор с тем же `idempotency_key` → вернуть существующий заказ (не создавать второй).
   Открытый `pending_payment` заказ у клиента — не более одного на проект.

**Подтверждение оплаты** — админское действие `POST /api/cabinet-admin action=confirm_payment`:
1. Заказ `pending_payment` (иначе 409).
2. `invoices.status='paid_confirmed'`, `confirmed_by`, `confirmed_at`.
3. Пакет/апгрейд: если `orders.project_id is null` (0 проектов) — 409 `project_required`, админ
   сначала вызывает `order_attach_project`; затем `startPeriod` (`crm/server/support/period.ts`) →
   `activatePeriod` / отложенная активация (см. §10), `orders.period_id`; докупка: запись в
   `client_credit_topups` (баланс, не сгорает); кредиты периода не трогаем.
4. Документы: юрлицо — акт, физлицо — чек; оба создаются автоматически (`draft` → PDF-воркер →
   `issued` + файл в Storage). До провайдера чек внутренний (пометка «не фискальный»), после —
   файл провайдера заменяет внутренний. Ручная загрузка — только fallback.
5. `orders.status='paid'` → `fulfilled`; `paid_at`, `fulfilled_at`; уведомление клиенту в Telegram.
6. `audit_log` (actor=admin), идемпотентность: повторный вызов на `fulfilled` — no-op.

Админский API `crm/api/cabinet-admin.ts` (JWT админа + `crm.is_admin()`):
`orders_list`, `order_confirm_payment`, `order_cancel`, `order_issue_invoice`, `order_attach_project`
(создать `client_project` или привязать существующий к заказу, `package_id` — из позиции заказа),
`document_upload_url`, `document_create`, `document_void`, `client_link_info` (для карточки клиента).

---

## 10. Пакеты, периоды и кредиты

- Пакет/период привязаны к проекту клиента (`client_projects` + `package_periods`).
- Покупка пакета:
  - нет активного периода проекта → период начинается с даты подтверждения оплаты (как сейчас);
  - есть активный период → новый период встаёт в очередь: `period_start = current.period_end`,
    статус `pending_payment` до оплаты; после подтверждения — `pending_activation`,
    активация задачей `api/jobs` при наступлении даты (не «съедаем» остаток текущего периода).
    `activateQueuedPeriod` ставит `active` только целевому периоду, а предыдущий переводит в
    `expired` в дату старта; старый `activatePeriod` остаётся для первого периода.
  - `startPeriod` обязан копировать `packages.credits` в `package_periods.credits_limit`
    (сейчас не копирует — см. §20), иначе дашборд покажет пустой остаток.
- Докупка кредитов — отдельный баланс, который **не сгорает** (как обещает сайт):
  - каждая покупка → строка `client_credit_topups` (`client_id`, `project_id` или
    `null` для любого проекта, `credits`, `credits_used=0`);
  - тратятся **после** кредитов периода: сначала `package_periods.credits_used`, затем
    `client_credit_topups.credits_used` (от старых к новым); топ-ап без проекта годится
    для любого проекта клиента;
  - `spendCredits` (`crm/server/support/period.ts`) расширяется: если остатка периода
    не хватает — списывать из баланса топ-апов; проверка «исчерпан лимит» учитывает оба источника;
  - в конце периода сгорают только кредиты пакета; докупленные переносятся между периодами;
  - при смене пакета/периода баланс сохраняется.
- Остаток в кабинете: `Σ(credits_limit - credits_used)` по активным периодам +
  `Σ(topup.credits - topup.credits_used)`.
- Апгрейд/даунгрейд — из кабинета ведёт на страницу «Поддержка»/к менеджеру; в первой версии
  `orders.kind='upgrade'` зарезервирован, но UI — фаза 2.
- **Автопродление** (`client_projects.auto_renew`):
  - в БД флаг по умолчанию `false`; при покупке пакета чекбокс «Продлевать автоматически» отмечен;
  - job раз в сутки: активный период заканчивается ≤ 7 дней, `auto_renew=true`, открытой
    `renewal`-заявки нет → создать `orders(kind='renewal', status='pending_payment')`, счёт
    (`billing_documents` draft → авто-рендер), письмо и сообщение в Telegram со ссылкой на заявку;
  - отключение до создания заявки — снять флаг; после — `order_cancel` (счёт аннулируется);
  - оплата подтверждена → новый период `pending_activation` со стартом `current.period_end`;
  - не оплачено к дате — заявка `expired`, период `expired`, уведомление клиенту;
  - автосписание картой — только после подключения провайдера; до него автопродление =
    автовыставление заявки/счёта и напоминания;
  - `auto_renew_changed_at` — для аудита; админ видит `renewal`-заявки и может отменить.

---

## 11. Документы: счёт, акт, чек

| Тип | Кому | Когда | Кто создаёт | Нумерация |
| --- | --- | --- | --- | --- |
| `invoice` | юрлицо | при оформлении заказа | **авто** (PDF-воркер); ручная загрузка — запасной путь | `СЧ-YYYY-NNNNNN` |
| `act` | юрлицо | при подтверждении оплаты | **авто** (PDF-воркер) | `АКТ-YYYY-NNNNNN` |
| `receipt` | физлицо | после оплаты | **авто** (внутренний PDF); после провайдера — файл провайдера | `ЧЕК-YYYY-NNNNNN` |

- Файлы: `documents/clients/<client_id>/<YYYY>/<kind>-<number>.pdf` в приватном бакете
  `documents`; `billing_documents.file_path`.
- Скачивание: `document_url` → `createSignedUrl(path, 60)`; просмотр в кабинете.
- Если файла ещё нет — строка `draft`/`file_path=null`/`issued_at=null`, в кабинете «Готовится».
- Автоматика: checkout создаёт `invoice` draft и ставит рендер в очередь; «Подтвердить оплату»
  создаёт `act` (юрлицо) или `receipt` (физлицо) draft и рендерит. PDF-воркер ставит `issued`,
  `issued_at=now()`, `file_path`.
- Админ: может перезапустить рендер, загрузить файл вручную (override) или аннулировать документ;
  ошибки рендера видны в админке.
- `document_url`: `file_path` → `createSignedUrl(…, 60)`; иначе `meta.legacy_url` → внешняя ссылка
  (архивный счёт); иначе 409 `document_not_ready`. Внешние ссылки в `file_path` не попадают.

**Автогенерация PDF (без админа).**

- Шаблоны: `crm/server/docs/templates.ts` (invoice / act / receipt), рендер `pdf-lib`; шрифт —
  **добавить** `site/public/fonts/pdf/Inter-Regular.ttf` и `Inter-Bold.ttf` (лицензия OFL;
  сейчас в репозитории только woff2, pdf-lib их не встраивает), A4, кириллица, шапка, позиции, итог.
- Номер: `crm.next_document_number('СЧ'|'АКТ'|'ЧЕК')` (атомарно, по годам).
- Очередь: checkout и `confirm_payment` создают `billing_documents(status='draft')`; `api/jobs`
  вызывает Node-функцию `api/render-docs` (секрет в env) для draft с `meta.render_attempts < 3`.
- Рендер → PDF в Storage `documents/clients/<client_id>/<YYYY>/<kind>-<number>.pdf` →
  `status='issued'`, `issued_at=now()`; ошибка → `meta.render_error`, статус остаётся draft,
  админ видит «Готовится» и ошибку.
- Данные документа — снимок: реквизиты студии из `app_settings`, покупатель из `orders.buyer`,
  позиции из `order_items`; пересчёт по текущим данным не делается.
- Чек физлицу до провайдера — внутренний PDF с пометкой «не фискальный чек»; после подключения
  провайдера его файл заменяет внутренний (`meta.provider_receipt=true`).
- Идемпотентность: `issued` не перерендеривается; повторный вызов worker для draft безопасен.
  Архивные (`meta.legacy`) документы не рендерятся.
- Шаблон счёта/акта: реквизиты студии — `app_settings['support.studio_requisites']`,
  реквизиты клиента — снимок `orders.buyer` (не текущая карточка: документ не должен меняться).
- Архив: существующие `invoices` переносятся в `billing_documents` миграцией (§3 п.11.4) со статусом
  `draft`/`issued`/`void` и `meta.legacy=true`; API дополнительно объединяет неперенесённые счета
  (защита от пропусков). Так у действующих клиентов «Документы» не пустые.
- Существующая вкладка «Счета» в `/admin/support` продолжает работать; новые заказы создают
  `invoices` и связаны с `billing_documents`.

---

## 12. Уведомления

| Событие | Telegram | Email | Кому |
| --- | --- | --- | --- |
| Заказ оформлен | группа «Лиды ST96» (`sendLeadNotification`) + бот клиенту | `order_created` | админ + клиент |
| Счёт готов | бот клиенту | `invoice_ready` (PDF во вложении или ссылка) | клиент |
| Оплата подтверждена | бот клиенту, `audit_log` | `paid` | клиент |
| Документы готовы (акт/чек) | бот клиенту | `docs_ready` | клиент |
| Заказ просрочен (5 дней) | `api/jobs`: `expired` + бот клиенту | `expired` | клиент |
| Автопродление: за 7 дней | бот клиенту | `renewal_soon` (заявка и счёт) | клиент |
| Автопродление: не оплачено | бот клиенту | `renewal_failed` | клиент |
| Остаток кредитов < 20% | бот клиенту (`reply.ts`), 1 раз за период | `low_credits` | клиент |

**Email через mail.ru.** Очередь `crm.email_outbox` (создаётся в той же транзакции, что и событие);
отправка — Node-функция `api/mail.ts` (SMTP `smtp.mail.ru:465`, SSL), которую вызывает `api/jobs`
или cron; секреты — `MAILRU_SMTP_USER`, `MAILRU_SMTP_PASSWORD`, `MAIL_FROM` в env Vercel (не в БД).
Шаблоны — `crm/server/mail/templates.ts`, данные только по id (order/document), без лишних ПДн в payload.
Повторы: `attempts < 5` с задержкой, затем `failed` + запись в лог; письма транзакционные, рассылки —
только по согласию. Если email нет — канал пропускается (`skipped`).

---

## 13. Безопасность

- JWT проверяется на каждом запросе; `client_id` никогда не приходит из тела запроса — только из токена.
- Проверка владения: заказ/документ/проект/задача → `client_id` из аккаунта.
- Цены и кредиты пересчитываются на сервере; корзина хранит снимок, но checkout сверяет.
- Идемпотентность checkout и confirm_payment; запрет двух открытых заказов на проект.
- Валидация: УНП (9 цифр), email, телефон; лимит длины полей; экранирование — React.
- Rate limit: 30 запросов/мин на аккаунт (таблица `client_rate_limits` или Vercel WAF; MVP — WAF).
- Подписанные ссылки 60 с, `no-store`; в логах не пишем токены/реквизиты.
- Приватность: согласие при регистрации (`consent_at`, версия политики), удаление данных — по запросу
  через поддержку (фаза 2).

---

## 14. Тесты

Юнит/интеграционные (по образцу `crm/server/support/*.test.ts`, MemoryRepo):

1. `bootstrap`: новый email → создаётся `clients` + `client_accounts`; существующий email → привязка.
2. Слияние: email-карточка + telegram-карточка с проектом → проект и задачи на «главной», аккаунт перепривязан.
3. Telegram занят другим аккаунтом → отказ, ничего не изменено.
4. Корзина: добавление пакета/докупки, объединение дублей, пересчёт цены, лимит 1 пакет.
5. checkout: пустая корзина, юрлицо без УНП, чужой проект, повтор с idempotency_key, цена изменилась.
6. confirm_payment: пакет → период активен; докупка → баланс `client_credit_topups` растёт и не сгорает; списание идёт после кредитов периода.
7. Документы: счёт создаётся для юрлица, чек для физлица; `document_url` чужого документа → 403.
8. RLS: authenticated-клиент видит только свои строки (test на SQL-уровне — вручную в Supabase).
9. Просрочка заказа через `api/jobs` → `expired`, корзина не восстанавливается автоматически.
10. `leads.source='cabinet'` проходит CHECK; расширенный `LeadInsert.source`; checkout создаёт заявку.
11. Продление: `startPeriod` пишет `credits_limit`, `activateQueuedPeriod` не гасит текущий активный
    период, `pending_activation → active` по дате через `api/jobs`.
12. Негативный RLS-тест: под JWT клиента прямой select `client_projects.workspace_path`,
    `support_jobs.usd_cost`, `package_periods.payment_id` → отказ/0 строк.
13. Архивный счёт без файла виден в «Документах» как «Готовится»; цена пакета не NULL; смешанный
    заказ (пакет + докупка) проходит CHECK и создаёт `orders.kind='mixed'`.
14. 0 проектов: checkout пакета без проекта → `order_attach_project` → `order_confirm_payment` →
    `package_periods` активен с `credits_limit`; без привязки confirm → 409 `project_required`.
15. Автопродление: job за 7 дней создаёт `renewal`-заказ и счёт один раз; отключение флага до job
    ничего не создаёт; оплата → период `pending_activation`; неоплата → `expired`.
16. PDF: счёт рендерится и становится `issued` с файлом в Storage; повторный worker не дублирует;
    чек до провайдера помечен как нефискальный.
17. Email: outbox `queued` → `sent` при успешной отправке mail.ru; ошибка → `attempts++` и `failed`
    после 5 попыток; отсутствие email → `skipped`.
18. EN: `/en/cabinet` отдаёт те же данные, подписи из словаря; документы и юридические тексты
    остаются на языке выпуска.

---

## 15. Фазы и приёмка

| Фаза | Что | Приёмка |
| --- | --- | --- |
| 0 | Миграция `0024`, типы/Repo, настройки | DDL применяется; `npx tsc -b`; RLS-проверка в Supabase |
| 1 | Auth: Google, bootstrap, карточка клиента | вход/выход; новая карточка; существующая привязывается |
| 2 | Telegram-привязка (бот + API) | `cab_` токен → привязка; повтор/просрочка; слияние по §7 |
| 3 | Корзина + /support CTA | кнопки на /support кладут товар; гость → Google; счётчик корзины |
| 4 | checkout + заказ + заявка в CRM | заказ/lead создаются; идемпотентность; уведомление в группу |
| 5 | Кабинет: дашборд, задачи, проекты | данные из БД; пустые состояния; пакет/кредиты |
| 6 | Оплата + документы + админка | confirm_payment активирует период; счёт/акт/чек в кабинете |
| 7 | Уведомления, просрочка, полировка | бот-сообщения; `expired`; чек-лист доступности |
| 8 | Автоматические PDF | счёт/акт/чек рендерятся и появляются без админа; ретраи; архив |
| 9 | Email mail.ru | очередь и отправка; письма о заявке/оплате/документах/автопродлении |
| 10 | EN-версия | `/en/cabinet/*`, словари, переключатель; документы на языке выпуска |
| 11 | Автопродление | job создаёт renewal-заявку за 7 дней; отключение/отмена/неоплата |

---

## 16. Автоматические PDF: реализация

| Что | Где |
| --- | --- |
| Шаблоны счёта/акта/чека | `crm/server/docs/templates.ts` — чистые функции: данные → HTML/структура для `pdf-lib` |
| Рендер | `crm/server/docs/render.ts` — `pdf-lib` + TTF Inter (`site/public/fonts/pdf/Inter-Regular.ttf`, `Inter-Bold.ttf`; добавить в фазе 8, OFL) |
| Очередь | `api/jobs.ts` раз в минуту зовёт `api/render-docs.ts` (Node runtime, заголовок `x-worker-secret`) |
| Хранилище | `documents/clients/<client_id>/<YYYY>/<kind>-<number>.pdf`, приватный бакет `documents` |
| Нумерация | `crm.next_document_number('СЧ'|'АКТ'|'ЧЕК')` |
| Статусы | `draft` → рендер → `issued` + `issued_at`; ошибка → `meta.render_error`, до 3 попыток |

Триггеры: checkout создаёт draft-счёт; `order_confirm_payment` — draft-акт (юрлицо) или draft-чек
(физлицо). Рендер не блокирует ответ API: клиент сразу видит заявку, документ появляется в кабинете
после воркера (обычно секунды).

Ассеты: TTF-файлы Inter (OFL) кладём в `site/public/fonts/pdf/` и в деплой; woff2 не подходят.
Env: `RENDER_WORKER_SECRET`. Библиотека `pdf-lib` добавляется в зависимости;
Node-функция нужна, потому что Edge не тянет встраивание TTF и память PDF.

Ограничения: не рендерим архивные (`meta.legacy`) и `void`; не пересчитываем суммы —
только снимок заказа; PDF не хранит лишние ПДн (только реквизиты плательщика из `orders.buyer`).

---

## 17. Email через mail.ru: реализация

- Очередь: `crm.email_outbox`; событие и запись создаются в одной транзакции.
- Воркер: `api/mail.ts` (Node runtime, `nodemailer`), SMTP `smtp.mail.ru:465` (SSL),
  логин — полный адрес mail.ru, пароль приложения. Секреты: `MAILRU_SMTP_USER`,
  `MAILRU_SMTP_PASSWORD`, `MAIL_FROM` (env Vercel; в БД не хранить).
- Запуск: тот же cron, что `api/jobs`, либо отдельный Vercel Cron; батч до 50 писем за вызов,
  `status='queued'` и `attempts < 5`.
- Шаблоны: `crm/server/mail/templates.ts` — тема/текст/кнопка «Открыть кабинет»; в письме
  `order_id`/`document_id`, без полного состава заказа.
- Ошибки: `attempts++`, `last_error`, экспоненциальная задержка; после 5 — `failed`
  и запись в `audit_log`; админ видит счётчик.
- Ответы на письма: адрес `MAIL_FROM` → ящик студии; autoreply не настраиваем.
- Согласие: транзакционные письма — по договору; маркетинговые — только с `opted_out_at is null`.

---

## 18. EN-версия кабинета

- Маршруты: `/cabinet/*` (RU) и `/en/cabinet/*` (EN), как у сайта (`localePath`,
  `useLang`). Переключатель — в шапке и профиле, выбор сохраняется в `clients.language`.
- Словари: `site/src/cabinet/i18n.ts` (ru/en), ключи для навигации, статусов, кнопок, ошибок;
  сервер отдаёт коды/данные, подписи маппит UI.
- Форматы: даты `dd.mm.yyyy` (RU) / `d mmm yyyy` (EN), валюта BYN, кредиты с пробелом.
- Документы и юридические тексты — на языке клиента: оферта и акт переводятся на EN (решение
  владельца 2026-11-26), счет/чек — по языку клиента; PDF-шаблоны RU/EN. Политика EN уже есть
  (`/en/privacy`), оферта EN добавляется.
- API: заголовок `Accept-Language` не обязателен (подписи в UI), но `profile.language`
  сохраняется и используется в письмах/боте (шаблоны RU/EN).
- Прототип показывает переключатель RU/EN визуально; полноценные словари — в реализации.

---

## 19. Автопродление: реализация

- Поле `client_projects.auto_renew` (+ `auto_renew_changed_at`); чекбокс при покупке
  пакета отмечен, тумблер в карточке пакета и профиле.
- Ежедневный job (в `api/jobs.ts`): для проектов с активным периодом и `period_end <= now()+7d`,
  `invoices.kind='period'` для renewal-заказа (как у пакета),
  `auto_renew=true` и без открытой `renewal`-заявки — создать заказ, счёт, письма и
  сообщение в бот. `orders.meta.renewal=true`, `orders.kind='renewal'`.
- Отключение: до создания заявки — снять флаг; после — `order_cancel` (счёт `void`).
- Оплата: `order_confirm_payment` создаёт период `pending_activation` со стартом
  `current.period_end` (см. §10), акт/чек — автоматически.
- Неоплата к дате: заявка `expired`, период `expired`, письмо/бот; повторная покупка —
  обычным путём.
- Автосписание картой — только после провайдера; до этого никаких списаний без действия клиента.
- Идемпотентность: уникальный частичный индекс `orders(project_id) where kind='renewal' and
  status in ('pending_payment','paid')` — заявка не дублируется.
- Админ: `renewal`-заявки в общей очереди, бейдж «автопродление», отмена.

---

## 20. Изменения в существующем коде (до реализации)

| Файл | Что изменить | Зачем |
| --- | --- | --- |
| `crm/server/repo.ts`, `crm/server/leads/parse.ts` | `LeadInsert.source` / `Origin`: добавить `'cabinet'` | иначе checkout упадёт на CHECK `leads_source_check` (п. 11.1) |
| `crm/server/support/period.ts` | `startPeriod`: `credits_limit: pkg.credits`; новый `activateQueuedPeriod`; `spendCredits`: списание из баланса топ-апов | остаток кредитов, продление без потери периода |
| `crm/server/support/pgRepo.ts` (+ memory-repo в тестах) | `insertPeriod` с `credits_limit`; методы orders/cart/documents/topups/merges; выборки для API | новые таблицы 0024 |
| `crm/api/packages.ts` | отдавать `price`, `currency`, `sort_order` | корзина и сайт считают по серверу |
| `crm/server/bot/bot.ts` | ветка `cab_<token>` → `linkCabinetTelegram` | завершение регистрации |
| `crm/api/jobs.ts` | sweep `pending_activation → active`; `pending_payment → expired`; автопродление за 7 дней; постановка писем/рендера в очередь | периоды, заказы, автопродление |
| `crm/server/docs/templates.ts`, `crm/server/docs/render.ts`, `api/render-docs.ts` | шаблоны и PDF-рендер, загрузка в Storage, статус `issued` | автоматические счёт/акт/чек |
| `crm/server/mail/templates.ts`, `crm/server/mail/outbox.ts`, `api/mail.ts` | очередь и отправка писем через mail.ru SMTP | email-уведомления |
| `site/src/pages/Privacy.tsx`, `PrivacyEn.tsx`, новые `Offer.tsx`/`OfferEn.tsx`, `Footer.tsx` | правки политики и оферта, ссылки в футере | юридические тексты |
| `site/src/cabinet/i18n.ts`, `site/src/App.tsx`, `site/src/components/layout/Header.tsx` | словари RU/EN, маршруты `/en/cabinet/*`, переключатель языка | EN-версия |
| `crm/api/cabinet-admin.ts` | `order_attach_project`: создать/привязать `client_project`, выставить `orders.project_id`; `order_confirm_payment` требует проект для пакета | покупка пакета при 0 проектов |
| `crm/admin/pages/support/SupportPage.tsx` | вкладки «Заказы», «Документы»; блок «Личный кабинет» в карточке клиента; поля проекта `title/domain/public_url/platform` | работа админа |
| `site/src/App.tsx`, `site/src/lib/auth.ts`, `site/src/lib/cabinetApi.ts`, `site/src/components/sections/Pricing.tsx`, шапка | маршруты `/cabinet/*`, Supabase Auth Google, CTA «в корзину», чип кредитов | клиентская часть |
| `crm/api/lead.ts` → `crm/server/leads/notify.ts` | вынести `sendLeadNotification`, использовать в checkout | уведомление в группу без внутреннего HTTP |

---

## 21. Решения и оставшиеся технические вопросы

Решено 2026-11-26: PDF — автоматически (`pdf-lib` + Node-воркер); email — mail.ru; EN — да;
автопродление — да; юридические тексты — доработать существующие на сайте; провайдер оплаты — позже.

Осталось получить/уточнить:

1. **Доступы mail.ru** (`MAILRU_SMTP_USER`, `MAILRU_SMTP_PASSWORD`, `MAIL_FROM`) и лимиты писем.
2. **Платёжный провайдер:** per-order ссылка, вебхук, фискальный чек; до этого — ручное подтверждение
   и внутренний PDF-чек с пометкой.
3. **Юрист:** формулировка акта (за период), порядок возвратов, текст оферты и автопродления.
4. **EN-документы:** решено — оферта и акт переводятся на английский; PDF-шаблоны RU/EN, язык — из
   `clients.language`.
5. **Один счёт на несколько проектов:** MVP — один заказ = один проект; расширение отдельной фазой.
6. **Согласие на ПД:** хранить `policy_version` и дату согласия в `clients` / `client_accounts`.

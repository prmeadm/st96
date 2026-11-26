-- 0022: кредиты поддержки — внутренняя валюта ST.
-- Пакеты продают месячный объём кредитов (packages.credits), периоды списывают
-- (package_periods.credits_limit/credits_used), обращение пишет расход по задаче
-- (support_jobs.st_credits / expendable_credits / usd_cost), а внутренний прайс
-- «тип работы → кредиты ST» лежит в app_settings (support.credit_prices).
-- Применяется в SQL-редакторе Supabase целиком (одна транзакция).

begin;

-- ───────── пакеты: месячный объём кредитов ─────────
alter table crm.packages add column if not exists credits int;

-- ───────── периоды: лимит и списание кредитов ─────────
alter table crm.package_periods add column if not exists credits_limit int;
alter table crm.package_periods add column if not exists credits_used int not null default 0;

-- ───────── обращение: расход по задаче ─────────
-- st_credits  — сколько кредитов ST списано у клиента (по внутреннему прайсу);
-- usd_cost    — себестоимость в USD (токены × цена модели из llm_prices);
--               «расходные кредиты» = support_jobs.tokens_used (токены провайдера).
alter table crm.support_jobs add column if not exists st_credits int not null default 0;
alter table crm.support_jobs add column if not exists usd_cost numeric(16,6) not null default 0;

-- ───────── внутренний прайс в кредитах ST (правится во вкладке «Кредиты») ─────────
insert into crm.app_settings (key, value) values
  ('support.credit_prices', to_jsonb('{"request":5,"edit":20,"feature":100}'))
on conflict (key) do nothing;

-- ───────── админы могут писать в настройки (прайс кредитов) ─────────
drop policy if exists "admins write" on crm.app_settings;
create policy "admins write" on crm.app_settings for insert to authenticated with check (crm.is_admin());
create policy "admins update" on crm.app_settings for update to authenticated using (crm.is_admin()) with check (crm.is_admin());

-- ───────── стартовые кредиты пакетов (правится в «Пакетах», тянется на сайт) ─────────
update crm.packages set title = 'Базовый', credits = 1070 where code = 'basic';
update crm.packages set title = 'Стандартный', credits = 2240 where code = 'standard';
update crm.packages set code = 'professional', title = 'Профессиональный', credits = 3600 where code = 'premium';
insert into crm.packages (code, title, description, credits, sort_order) values
  ('ultimate', 'Ультимейт', 'Максимальная поддержка', 6830, 4)
on conflict (code) do nothing;

commit;

-- 0025: каталог услуг и продуктов компании (раздел «Каталог» в админке).
-- Услуги/продукты редактируются в админке, выводятся на страницах сайта и добавляются в корзину кабинета.
begin;

-- ───────── 1. Каталог ─────────
create table if not exists crm.catalog_items (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('service', 'product')),
  slug text not null,
  title text not null,
  description text,
  price numeric(12,2),                       -- null => цена не выводится на сайте
  currency text not null default 'BYN',
  buttons jsonb not null default '[]'::jsonb, -- [{label, action: cart|discuss|link, href}]
  media_type text check (media_type in ('photo', 'video')),
  media_url text,
  page text not null default 'home',          -- страница вывода: home | producing | promotion | production | ai | support
  sort int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists catalog_items_slug_uidx on crm.catalog_items (slug);
create index if not exists catalog_items_page_idx on crm.catalog_items (page, kind) where active;
drop trigger if exists catalog_items_updated on crm.catalog_items;
create trigger catalog_items_updated before update on crm.catalog_items
  for each row execute function crm.set_updated_at();

drop policy if exists "admins full access" on crm.catalog_items;
create policy "admins full access" on crm.catalog_items for all to authenticated
  using (crm.is_admin()) with check (crm.is_admin());

-- ───────── 2. Корзина и заказы: новый вид «service» ─────────
alter table crm.cart_items drop constraint if exists cart_items_kind_check;
alter table crm.cart_items add constraint cart_items_kind_check
  check (kind in ('package', 'topup', 'service'));
alter table crm.cart_items add column if not exists catalog_item_id uuid references crm.catalog_items(id) on delete set null;

alter table crm.cart_items drop constraint if exists cart_items_shape;
alter table crm.cart_items add constraint cart_items_shape check (
  (kind = 'package' and package_id is not null and credits is null and catalog_item_id is null) or
  (kind = 'topup'   and package_id is null and credits is not null and catalog_item_id is null) or
  (kind = 'service' and package_id is null and credits is null)
);

alter table crm.order_items drop constraint if exists order_items_kind_check;
alter table crm.order_items add constraint order_items_kind_check
  check (kind in ('package', 'topup', 'service'));
alter table crm.order_items add column if not exists catalog_item_id uuid references crm.catalog_items(id) on delete set null;

alter table crm.orders drop constraint if exists orders_kind_check;
alter table crm.orders add constraint orders_kind_check
  check (kind in ('package', 'topup', 'service', 'upgrade', 'mixed', 'renewal'));

-- ───────── 3. Стартовый набор: основные услуги сайта ─────────
insert into crm.catalog_items (kind, slug, title, description, price, currency, page, sort, active) values
  ('service', 'producing', 'Продюсирование', 'Берём на себя весь путь creative-проекта — от смысла и концепции до релиза и первых денег. Артисты, медиапроекты, коллаборации, шоу.', null, 'BYN', 'home', 1, true),
  ('service', 'promotion', 'Коммерческий промоушн', 'Строим промо-кампании, которые двигают бизнес-показатели, а не только охваты. Стратегия, креатив и медиазакупка — в одних руках.', null, 'BYN', 'home', 2, true),
  ('service', 'production', 'Продакшн', 'Видео, фото и контент полного цикла: сценарий, съёмка, монтаж, графика. Одна команда — от брифа до финального файла.', null, 'BYN', 'home', 3, true),
  ('service', 'ai', 'AI-разработка', 'Проектируем и разрабатываем программные решения на базе искусственного интеллекта: от автоматизации процессов до собственных AI-продуктов.', null, 'BYN', 'home', 4, true)
on conflict (slug) do update set
  title = excluded.title,
  description = excluded.description,
  page = excluded.page,
  sort = excluded.sort,
  active = true;

commit;

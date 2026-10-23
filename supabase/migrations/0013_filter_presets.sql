-- Сохранённые наборы фильтров на страницах «Заявки» и «Клиенты» (окно «Фильтр» в админке).
-- conds: список условий [{ field, op, value }], общий для всех админов.
create table if not exists public.filter_presets (
  id uuid primary key default gen_random_uuid(),
  page text not null check (page in ('leads', 'clients')),
  name text not null,
  conds jsonb not null default '[]'::jsonb,
  sort int not null default 0,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now()
);
create index if not exists filter_presets_page_idx on public.filter_presets (page, sort);
alter table public.filter_presets enable row level security;
drop policy if exists "admins full access" on public.filter_presets;
create policy "admins full access" on public.filter_presets for all to authenticated using (public.is_admin()) with check (public.is_admin());

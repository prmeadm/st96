-- Запись на встречу: заявки клиентов. Расписание хранится в app_settings (ключ booking_schedule).
-- Читают админы; всё остальное делает сервер (публичная страница записи идёт через api/booking).
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete set null,
  run_id uuid references public.funnel_runs(id) on delete set null,
  run_node text,
  service text not null,
  format text not null check (format in ('call', 'video', 'offline')),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  name text not null,
  company text,
  telegram text,
  phone text,
  goal text,
  comment text,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'rejected', 'canceled')),
  meet_url text,
  source text not null default 'site',
  reminded_at timestamptz,
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  constraint bookings_ends_after_start check (ends_at > starts_at)
);
create index if not exists bookings_starts on public.bookings (starts_at);
create index if not exists bookings_status on public.bookings (status, starts_at);
create index if not exists bookings_client on public.bookings (client_id);
-- Защита от двойной записи на одно время даже при одновременных заявках
alter table public.bookings drop constraint if exists bookings_no_overlap;
alter table public.bookings add constraint bookings_no_overlap exclude using gist (tstzrange(starts_at, ends_at, '[)') with &&) where (status in ('pending', 'confirmed'));

alter table public.bookings enable row level security;
drop policy if exists "admins read" on public.bookings;
create policy "admins read" on public.bookings for select to authenticated using (public.is_admin());

-- Рассылки: сообщение + сегмент клиентов + расписание. Получатели фиксируются в момент запуска.
create table if not exists public.broadcasts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  kind text not null default 'text' check (kind in ('text','photo','video','audio','file')),
  body text not null default '',
  body_en text,
  media_url text,
  segment jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check (status in ('draft','scheduled','sending','done','canceled')),
  scheduled_at timestamptz,
  total int not null default 0,
  sent int not null default 0,
  failed int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  finished_at timestamptz
);

create table if not exists public.broadcast_recipients (
  broadcast_id uuid not null references public.broadcasts(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','sending','sent','failed')),
  error text,
  claimed_at timestamptz,
  sent_at timestamptz,
  primary key (broadcast_id, client_id)
);
create index if not exists broadcast_recipients_pending on public.broadcast_recipients (broadcast_id, status);

alter table public.broadcasts enable row level security;
alter table public.broadcast_recipients enable row level security;
drop policy if exists "admins full access" on public.broadcasts;
create policy "admins full access" on public.broadcasts for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admins full access" on public.broadcast_recipients;
create policy "admins full access" on public.broadcast_recipients for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop trigger if exists broadcasts_touch on public.broadcasts;
create trigger broadcasts_touch before update on public.broadcasts for each row execute function public.touch_templates();

-- Берёт очередную пачку получателей; зависшие больше 5 минут возвращает в очередь. Вызывается только сервером.
create or replace function public.claim_broadcast_recipients(p_broadcast uuid, p_limit int default 50)
returns setof public.broadcast_recipients language sql security definer set search_path = public as $$
  update public.broadcast_recipients set status = 'pending', claimed_at = null
    where broadcast_id = p_broadcast and status = 'sending' and claimed_at < now() - interval '5 minutes';
  update public.broadcast_recipients r set status = 'sending', claimed_at = now()
    where (r.broadcast_id, r.client_id) in (
      select broadcast_id, client_id from public.broadcast_recipients
      where broadcast_id = p_broadcast and status = 'pending' limit p_limit for update skip locked)
    returning r.*
$$;
revoke all on function public.claim_broadcast_recipients(uuid, int) from public, anon, authenticated;
grant execute on function public.claim_broadcast_recipients(uuid, int) to service_role;

-- Голосовые сообщения в шаблонах
alter table public.templates drop constraint if exists templates_kind_check;
alter table public.templates add constraint templates_kind_check check (kind in ('text','photo','video','voice','audio','file'));

-- Хранилище файлов для шаблонов и рассылок: читать может любой по ссылке (её получает Telegram), писать только админы
insert into storage.buckets (id, name, public, file_size_limit)
values ('media', 'media', true, 52428800)
on conflict (id) do update set public = true, file_size_limit = 52428800;
drop policy if exists "admins write media" on storage.objects;
create policy "admins write media" on storage.objects for insert to authenticated with check (bucket_id = 'media' and public.is_admin());
drop policy if exists "admins update media" on storage.objects;
create policy "admins update media" on storage.objects for update to authenticated using (bucket_id = 'media' and public.is_admin());
drop policy if exists "admins delete media" on storage.objects;
create policy "admins delete media" on storage.objects for delete to authenticated using (bucket_id = 'media' and public.is_admin());

-- Передача диалога человеку: у клиента есть тема в админ-группе.
alter table public.clients
  add column if not exists admin_topic_id bigint,
  add column if not exists dialog_closed_at timestamptz;

create unique index if not exists clients_admin_topic_key on public.clients (admin_topic_id) where admin_topic_id is not null;

-- Интересы заявки (несколько направлений): группы клиентов для рассылок.
-- Ключи и подписи: server/leads/interests.ts.
alter table public.leads add column if not exists interests text[] not null default '{}';
create index if not exists leads_interests_idx on public.leads using gin (interests);

-- Воронки: молчание бота, пока диалог у человека, и расписание отложенных шагов.
alter table public.clients add column if not exists human_until timestamptz;

create extension if not exists pg_net;
create extension if not exists pg_cron;

-- Раз в минуту просим сайт довести до конца запланированные шаги воронок
select cron.schedule(
  'st96-run-jobs',
  '* * * * *',
  $$select net.http_post(url := 'https://st96.by/api/jobs', headers := '{"Content-Type":"application/json"}'::jsonb, body := '{}'::jsonb)$$
);

-- Раз в сутки чистим журнал обработанных апдейтов Telegram
select cron.schedule('st96-clean-updates', '17 3 * * *', $$delete from public.processed_updates where received_at < now() - interval '7 days'$$);

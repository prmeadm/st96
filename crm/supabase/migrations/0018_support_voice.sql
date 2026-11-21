-- 0018: голосовое обращение клиента (file_id голосового в Telegram)
alter table crm.support_jobs add column if not exists voice_file_id text;

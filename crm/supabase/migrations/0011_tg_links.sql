-- Подтягивание ника Telegram в форму записи: страница создаёт одноразовый токен, человек нажимает «Запустить» в боте
-- (/start bk_<токен>), бот записывает сюда ник, страница забирает. Записи живут сутки, читает и пишет только сервер.
create table if not exists public.tg_links (
  token text primary key,
  tg_user_id bigint not null,
  username text,
  first_name text,
  created_at timestamptz not null default now()
);
alter table public.tg_links enable row level security;

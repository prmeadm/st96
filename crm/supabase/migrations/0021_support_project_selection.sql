-- Поддержка: клиент с несколькими активными проектами выбирает один (номером или названием),
-- выбор запоминается, чтобы агент вёл его по этому проекту и не переспрашивал «в какой проект».
-- Колонка БЕЗ внешнего ключа: двусторонний FK clients<->client_projects ломает PostgREST-отношение
-- «clients» во вложенном select админки (раздел «Поддержка» → «Проекты клиентов» не грузится).
alter table crm.clients add column if not exists selected_project_id uuid;
-- Если ранняя версия миграции уже создала FK — убираем его (иначе ломает админку).
alter table crm.clients drop constraint if exists clients_selected_project_id_fkey;

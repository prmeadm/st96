-- Поддержка: клиент с несколькими активными проектами выбирает один (номером или названием),
-- выбор запоминается, чтобы агент вёл его по этому проекту и не переспрашивал «в какой проект».
alter table crm.clients add column if not exists selected_project_id uuid references crm.client_projects(id) on delete set null;

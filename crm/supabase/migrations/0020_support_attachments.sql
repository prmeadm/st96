-- Поддержка: вложения клиента (фото/документ) к обращению — материал для правок.
-- Хранится как jsonb: [{ "kind": "photo"|"document", "file_id", "file_name", "mime_type", "caption" }].
alter table crm.support_jobs add column if not exists attachments_json jsonb;

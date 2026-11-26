-- 0023_app_settings_support_write.sql
--
-- Админка /admin/support → «Настройки» (и «Кредиты») сохраняет значения прямо из браузера
-- в crm.app_settings. На таблице была только SELECT-политика «admins read», поэтому
-- upsert падал с ошибкой → в интерфейсе «Не удалось сохранить».
--
-- Даём администраторам запись ТОЛЬКО для ключей support.* (настройки поддержки: ссылка на оплату,
-- реквизиты студии, разовая цена, цены в кредитах). Остальные настройки платформы
-- (llm_model, booking_*, прайс аналитики и т. п.) по-прежнему пишет только сервер
-- с service-role — браузер их менять не может.
--
-- Применять: SQL-редактор Supabase, целиком (владелец проекта). Повторный запуск безопасен.

alter table crm.app_settings enable row level security;

drop policy if exists "admins insert support settings" on crm.app_settings;
drop policy if exists "admins update support settings" on crm.app_settings;

create policy "admins insert support settings" on crm.app_settings
  for insert to authenticated
  with check (crm.is_admin() and key like 'support.%');

create policy "admins update support settings" on crm.app_settings
  for update to authenticated
  using (crm.is_admin() and key like 'support.%')
  with check (crm.is_admin() and key like 'support.%');

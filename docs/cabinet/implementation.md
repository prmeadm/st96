# Кабинет: статус реализации

Обновлено: 2026-11-26. Дизайн — [CABINET-SPEC.md](../CABINET-SPEC.md), детали — [data-api.md](data-api.md).

## Сделано

| Фаза | Что | Файлы |
| --- | --- | --- |
| 0–1 | Миграция, типы, API `bootstrap/summary/profile`, Google-вход, страница кабинета | [0024_cabinet.sql](../../crm/supabase/migrations/0024_cabinet.sql), [cabinet.ts](../../crm/api/cabinet.ts), [Cabinet.tsx](../../site/src/pages/Cabinet.tsx) |
| 2 | Telegram-онбординг: `cab_<token>`, одноразовая привязка в боте, опрос статуса в кабинете | bot.ts, repo.ts, API `telegram_start/telegram_status` |
| 3 | Серверная корзина, checkout, заказ и позиции, счёт/чек-draft, email-очередь; страница `/support` с пакетами и докупкой | API `cart_add/update/remove/checkout`, [Support.tsx](../../site/src/pages/Support.tsx) |
| 4 | Задачи, проекты, заявки, документы в кабинете | API `tasks/projects/orders/order/documents/document_url`, вкладки Cabinet.tsx |
| 6 | Автоматический PDF счёта/акта/чека (pdf-lib + Inter TTF), загрузка в Storage, подписанная ссылка | [pdf.ts](../../crm/server/cabinet/pdf.ts), [cabinet-pdf.ts](../../crm/api/cabinet-pdf.ts) |
| 7 | Очередь писем `email_outbox` + воркер mail.ru SMTP | [mail.ts](../../crm/api/mail.ts) |
| 5 | Админ-вкладка «Заказы»: подтверждение оплаты, привязка проекта, аннулирование; при оплате активируется период, начисляются кредиты, создаётся акт для юрлица | [cabinet-admin.ts](../../crm/api/cabinet-admin.ts), SupportPage.tsx |
| 6 | Акт создаётся автоматически при подтверждении оплаты; PDF счёта/акта/чека выпускается при открытии | cabinet-admin.ts, pdf.ts |
| 8 | Автопродление: SQL-функция `create_renewal_orders()`, pg_cron ежедневно, заявка за 7 дней; `expire_cabinet_orders()` закрывает неоплаченные | 0024_cabinet.sql §13 |
| 9 | EN-интерфейс кабинета и `/support` (`lang` prop + словарь), EN-маршруты `/en/cabinet` `/en/support` | [Cabinet.tsx](../../site/src/pages/Cabinet.tsx), [Support.tsx](../../site/src/pages/Support.tsx), App.tsx |
| 10 | EN-счёт/акт/чек (локализация `pdf.ts` по `clients.language`), оферта RU/EN (`/offer`, `/en/offer`), ссылка в футере, обязательное принятие оферты в корзине, доп. раздел политики о кабинете | [pdf.ts](../../crm/server/cabinet/pdf.ts), [Offer.tsx](../../site/src/pages/Offer.tsx), [OfferEn.tsx](../../site/src/pages/OfferEn.tsx), Privacy.tsx/PrivacyEn.tsx |

Проверено: `npx tsc -b`, `npx vite build`, `npm run test:server` (250 тестов) — OK.

Миграция `0024_cabinet.sql` применена в Supabase 2026-11-26 (вместе с `0022_credits.sql` и
`0023_app_settings_support_write.sql`, которые тоже были не применены). Проверено на живой БД:
таблицы кабинета, `packages.credits/price` (4 пакета), `package_periods.credits_*`, функции
`cabinet_confirm_payment`/`cabinet_void_order`/`create_renewal_orders`/`expire_cabinet_orders`/
`activate_pending_periods`, cron-задания `st96-renewals`/`st96-expire-orders`/`st96-activate-periods`.

## Как включить

1. Применить `0024_cabinet.sql` — уже сделано (см. выше).
2. Vercel → Environment Variables:
   - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` — уже есть;
   - `SUPABASE_SCHEMA=crm`;
   - `SUPABASE_ANON_KEY` (или `SUPABASE_PUBLISHABLE_KEY`);
   - `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`;
   - `MAIL_WORKER_SECRET` — секрет для `/api/mail`;
   - `MAILRU_SMTP_USER`, `MAILRU_SMTP_PASSWORD`, `MAIL_FROM` — когда будут доступы mail.ru.
3. Supabase → Authentication → Providers → Google: включить, Client ID/Secret.
4. Supabase → URL Configuration: Site URL `https://st96.by`; Redirect URLs `/cabinet`, `/en/cabinet`.
5. Redeploy. Проверить `/support` → «Добавить в корзину» → `/cabinet` → Google → Telegram → checkout.

Письма: `POST /api/mail` с `Authorization: Bearer <MAIL_WORKER_SECRET>` (или cron раз в минуту). PDF: `/api/cabinet-pdf?id=<document_id>` с JWT клиента.

## Осталось

- Фаза 5–6: сделано; ограничение PDF — не более 10 позиций в заказе (checkout и `/api/cabinet-pdf` возвращают `too_many_items`, длинные названия усекаются).
- Фаза 7: реальные доступы mail.ru и cron/воркер (очередь `telegram_outbox` уже обрабатывается `/api/mail`).
- Фаза 8: функции и cron созданы; осталось прогнать реальный цикл автопродления/истечения на тестовом клиенте.
- Telegram-merge карточек: если Telegram уже привязан к другой карточке, бот отказывает с просьбой написать в поддержку; автоматическое слияние/перенос истории — вне объёма этой итерации (зафиксировано сознательно).
- Фаза 9–10: сделано (EN-интерфейс, EN-документы, оферта RU/EN, принятие оферты в корзине, раздел политики о кабинете). Финальную редакцию юридических текстов проверяет юрист.
- Фаза 11: приёмка и нагрузочные проверки — блокируется действиями владельца: деплой (push/commit), включение Google OAuth и redirect `/cabinet`+`/en/cabinet`, доступы mail.ru (`MAILRU_SMTP_USER/PASSWORD`, `MAIL_FROM`, `MAIL_WORKER_SECRET`). После этого — сквозной прогон: `/support` → корзина → Google → Telegram → checkout → оплата/подтверждение в админке → акт/чек → автопродление.

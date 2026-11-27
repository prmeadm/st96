# Разделы проекта ST96: карта для коротких сессий

Одна задача = один раздел = одна сессия. Новая сессия читает `CLAUDE.md`, этот файл и справку только своего раздела, а код открывает по графу раздела. Так контекст остаётся маленьким и лимиты не сгорают.

| Раздел | Что внутри | Узлов | Файлов | Справка |
|---|---|---|---|---|
| Воронки | Движок воронок | 189 | 22 | [`funnels.md`](funnels.md) |
| Бот и диалоги | Вебхук Telegram | 55 | 7 | [`bot.md`](bot.md) |
| Заявки и клиенты | Приём заявок | 122 | 19 | [`leads.md`](leads.md) |
| Запись на встречу | Расписание и слоты | 141 | 15 | [`booking.md`](booking.md) |
| Рассылки | Массовые рассылки по сегментам | 30 | 5 | [`broadcasts.md`](broadcasts.md) |
| Шаблоны и медиа | Библиотека шаблонов | 33 | 5 | [`templates.md`](templates.md) |
| Агент, ИИ и аналитика | Задания агента | 160 | 23 | [`agent.md`](agent.md) |
| Данные и инфраструктура | Доступ к базе | 297 | 32 | [`core.md`](core.md) |
| Оболочка админки | Каркас /admin: вход | 113 | 18 | [`admin.md`](admin.md) |
| Сайт st96.by | Публичный сайт | 308 | 89 | [`site.md`](site.md) |

## Как начать сессию по разделу

Первое сообщение в новой сессии, например:

> Раздел «Воронки». Прочитай CLAUDE.md и graphify-out/sections/funnels.md, дальше работай только в этом разделе. Задача: …

Обновить граф и справки после изменений в коде: `graphify update . && python3 scripts/graph-sections.py`.

## Файлы вне разделов (не продуктовый код или конфиги)

- `docs/PLATFORM.md`
- `package.json`
- ``
- `docs/cabinet/screens-flows.md`
- `docs/TOOLING.md`
- `crm/server/support/types.ts`
- `docs/SUPPORT-SPEC.md`
- `crm/api/cabinet.ts`
- `docs/CABINET-SPEC.md`
- `docs/cabinet/data-api.md`
- `HANDOFF.md`
- `docs/VISUAL-GUIDE.md`
- `tsconfig.app.json`
- `tsconfig.node.json`
- `docs/DATABASE.md`
- `crm/server/support/voice.ts`
- `README.md`
- `crm/server/support/agent.ts`
- `crm/server/support/worker.ts`
- `docs/AUDIT-2026-10-31.md`
- `crm/server/support/workspaceFolders.ts`
- `crm/docs/design-is-2026-10-20/05-redesign-plan.md`
- `crm/VISUAL-GUIDE.md`
- `crm/api/lead.ts`
- `site/VISUAL-GUIDE.md`

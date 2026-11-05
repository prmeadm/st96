# Разделы проекта ST96: карта для коротких сессий

Одна задача = один раздел = одна сессия. Новая сессия читает `CLAUDE.md`, этот файл и справку только своего раздела, а код открывает по графу раздела. Так контекст остаётся маленьким и лимиты не сгорают.

| Раздел | Что внутри | Узлов | Файлов | Справка |
|---|---|---|---|---|
| Воронки | Движок воронок | 190 | 22 | [`funnels.md`](funnels.md) |
| Бот и диалоги | Вебхук Telegram | 51 | 6 | [`bot.md`](bot.md) |
| Заявки и клиенты | Приём заявок | 132 | 19 | [`leads.md`](leads.md) |
| Запись на встречу | Расписание и слоты | 143 | 15 | [`booking.md`](booking.md) |
| Рассылки | Массовые рассылки по сегментам | 31 | 5 | [`broadcasts.md`](broadcasts.md) |
| Шаблоны и медиа | Библиотека шаблонов | 34 | 5 | [`templates.md`](templates.md) |
| Агент, ИИ и аналитика | Задания агента | 165 | 23 | [`agent.md`](agent.md) |
| Данные и инфраструктура | Доступ к базе | 189 | 22 | [`core.md`](core.md) |
| Оболочка админки | Каркас /admin: вход | 61 | 15 | [`admin.md`](admin.md) |
| Сайт st96.by | Публичный сайт | 241 | 79 | [`site.md`](site.md) |

## Как начать сессию по разделу

Первое сообщение в новой сессии, например:

> Раздел «Воронки». Прочитай CLAUDE.md и graphify-out/sections/funnels.md, дальше работай только в этом разделе. Задача: …

Обновить граф и справки после изменений в коде: `graphify update . && python3 scripts/graph-sections.py`.

## Файлы вне разделов (не продуктовый код или конфиги)

- `docs/PLATFORM.md`
- `package.json`
- ``
- `docs/TOOLING.md`
- `HANDOFF.md`
- `docs/VISUAL-GUIDE.md`
- `tsconfig.app.json`
- `tsconfig.node.json`
- `README.md`
- `docs/DATABASE.md`
- `docs/AUDIT-2026-10-31.md`
- `crm/docs/design-is-2026-10-20/05-redesign-plan.md`
- `crm/VISUAL-GUIDE.md`
- `site/VISUAL-GUIDE.md`
- `CLAUDE.md`
- `crm/docs/design-is-2026-10-20/01-evidence.md`
- `vite.config.ts`
- `.oxlintrc.json`
- `scripts/funnel-live-run.ts`
- `docs/STRUCTURE.md`
- `scripts/graph-sections.py`
- `api/client-log.ts`
- `crm/server/env.ts`
- `tsconfig.json`
- `vercel.json`

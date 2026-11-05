# Разделы проекта ST96: карта для коротких сессий

Одна задача = один раздел = одна сессия. Новая сессия читает `CLAUDE.md`, этот файл и справку только своего раздела, а код открывает по графу раздела. Так контекст остаётся маленьким и лимиты не сгорают.

| Раздел | Что внутри | Узлов | Файлов | Справка |
|---|---|---|---|---|
| Воронки | Движок воронок | 190 | 22 | [`funnels.md`](funnels.md) |
| Бот и диалоги | Вебхук Telegram | 51 | 6 | [`bot.md`](bot.md) |
| Заявки и клиенты | Приём заявок | 132 | 19 | [`leads.md`](leads.md) |
| Запись на встречу | Расписание и слоты | 142 | 15 | [`booking.md`](booking.md) |
| Рассылки | Массовые рассылки по сегментам | 31 | 5 | [`broadcasts.md`](broadcasts.md) |
| Шаблоны и медиа | Библиотека шаблонов | 34 | 5 | [`templates.md`](templates.md) |
| Агент, ИИ и аналитика | Задания агента | 165 | 23 | [`agent.md`](agent.md) |
| Данные и инфраструктура | Доступ к базе | 178 | 20 | [`core.md`](core.md) |
| Оболочка админки | Каркас /admin: вход | 61 | 15 | [`admin.md`](admin.md) |
| Сайт st96.by | Публичный сайт | 240 | 79 | [`site.md`](site.md) |

## Как начать сессию по разделу

Первое сообщение в новой сессии, например:

> Раздел «Воронки». Прочитай CLAUDE.md и graphify-out/sections/funnels.md, дальше работай только в этом разделе. Задача: …

Обновить граф и справки после изменений в коде: `graphify update . && python3 scripts/graph-sections.py`.

## Файлы вне разделов (не продуктовый код или конфиги)

- `crm/admin-prototype/index.html`
- `docs/PLATFORM.md`
- `package.json`
- `DESIGN-IS-2026-10-20/05-redesign-plan.md`
- `DESIGN-IS-2026-10-20/02-scorecard.md`
- `docs/TOOLING.md`
- ``
- `DESIGN-IS-2026-10-20/01-evidence.md`
- `HANDOFF.md`
- `docs/VISUAL-GUIDE.md`
- `tsconfig.app.json`
- `tsconfig.node.json`
- `README.md`
- `docs/AUDIT-2026-10-31.md`
- `DESIGN-IS-2026-10-14/01-evidence.md`
- `DESIGN-IS-2026-10-20/00-scope.md`
- `DESIGN-IS-2026-10-14/03-verdict.md`
- `CLAUDE.md`
- `PRINT ST96/brand/avatar/build.mjs`
- `DESIGN-IS-2026-10-14/04-handoff-prompt.md`
- `DESIGN-IS-2026-10-20/04-handoff-prompt.md`
- `DESIGN-IS-2026-10-14/00-scope.md`
- `DESIGN-IS-2026-10-20/03-verdict.md`
- `vite.config.ts`
- `.oxlintrc.json`

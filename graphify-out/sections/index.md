# Разделы проекта ST96: карта для коротких сессий

Одна задача = один раздел = одна сессия. Новая сессия читает `CLAUDE.md`, этот файл и справку только своего раздела, а код открывает по графу раздела. Так контекст остаётся маленьким и лимиты не сгорают.

| Раздел | Что внутри | Узлов | Файлов | Справка |
|---|---|---|---|---|
| Воронки | Движок воронок | 190 | 22 | [`funnels.md`](funnels.md) |
| Бот и диалоги | Вебхук Telegram | 37 | 5 | [`bot.md`](bot.md) |
| Заявки и клиенты | Приём заявок | 131 | 19 | [`leads.md`](leads.md) |
| Запись на встречу | Расписание и слоты | 137 | 14 | [`booking.md`](booking.md) |
| Рассылки | Массовые рассылки по сегментам | 31 | 5 | [`broadcasts.md`](broadcasts.md) |
| Шаблоны и медиа | Библиотека шаблонов | 34 | 5 | [`templates.md`](templates.md) |
| Агент, ИИ и аналитика | Задания агента | 165 | 23 | [`agent.md`](agent.md) |
| Данные и инфраструктура | Доступ к базе | 177 | 20 | [`core.md`](core.md) |
| Оболочка админки | Каркас /admin: вход | 60 | 14 | [`admin.md`](admin.md) |
| Сайт st96.by | Публичный сайт | 204 | 48 | [`site.md`](site.md) |

## Как начать сессию по разделу

Первое сообщение в новой сессии, например:

> Раздел «Воронки». Прочитай CLAUDE.md и graphify-out/sections/funnels.md, дальше работай только в этом разделе. Задача: …

Обновить граф и справки после изменений в коде: `graphify update . && python3 scripts/graph-sections.py`.

## Файлы вне разделов (не продуктовый код или конфиги)

- `package.json`
- ``
- `tsconfig.app.json`
- `tsconfig.node.json`
- `docs/PLATFORM.md`
- `HANDOFF.md`
- `README.md`
- `vite.config.ts`
- `.oxlintrc.json`
- `CLAUDE.md`
- `scripts/graph-sections.py`
- `api/client-log.ts`
- `tsconfig.json`
- `vercel.json`
- `@breezystack/lamejs`
- `libphonenumber-js`

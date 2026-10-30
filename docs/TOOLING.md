# Инструменты и скиллы проекта: что использовалось и что доступно сейчас

> Составлено 2026-10-31. Источники фактов: `.claude/settings.json`, `.claude/CLAUDE.md`,
> `.claude/skills/graphify/`, `DESIGN-IS-2026-10-14/`, `DESIGN-IS-2026-10-20/`,
> история коммитов (`git log`), `package.json`, `docs/PLATFORM.md`.
> «Видно» = подтверждено файлом в репозитории, а не догадка.

## Таблица

| Инструмент / скилл | Что им делали в проекте | Где видно | Статус у меня | Как поставить / включить |
| --- | --- | --- | --- | --- |
| `graphify` (скилл + CLI) | Граф кода `graphify-out/`, `query/path/explain` вместо чтения файлов, обновление графа после правок | `.claude/skills/graphify/SKILL.md`, `graphify-out/*`, `scripts/graph-sections.py` | **Есть** — глобальный `graphify-ds` (`/usr/local/bin/graphify-ds`) и скилл в `~/.dsh/skills/graphify` | Ничего не нужно |
| Хуки graphify в Claude Code | `PreToolUse`-гварды: сначала граф, потом `grep`/`read` | `.claude/settings.json` (hooks `graphify hook-guard search/read`) | **Нет** — у меня нет хуков Claude, правило соблюдаю вручную | Только для Claude Code; в DSH-сессиях аналога нет |
| `DESIGN-IS` (дизайн-аудит по шаблону) | Два аудита интерфейса админки: scope → evidence → scorecard → verdict → handoff-prompt → план редизайна | `DESIGN-IS-2026-10-14/`, `DESIGN-IS-2026-10-20/` | **Частично** — публичного пакета не нашёл, но методика зафиксирована в репозитории и воспроизводима | Ничего не ставить: работать по файлам `00-scope…05-plan` |
| Playwright MCP | Живая проверка интерфейса в браузере (скриншоты, клики), логи в `.playwright-mcp/` | коммит `ce5476e` («ignore Playwright MCP logs») | **Нет** | `npx @playwright/mcp@latest` + `npx playwright install chromium` (≈300 МБ) |
| Плагин `hyperframes@hyperframes` | Кадры/видео-сцены (по названию), сейчас выключен | `.claude/settings.json` → `enabledPlugins: false` | **Нет** | Ставится из маркетплейса плагинов Claude Code; в DSH не переносится |
| Vercel CLI | Деплой, проекты, переменные окружения | все четыре проекта в команде `prmeadm` | **Есть** — `vercel@65.8.0`, вход выполнен, токен в `~/.local/share/com.vercel.cli/auth.json` | Ничего не нужно |
| Supabase (SQL-редактор) | Миграции `0001`–`0011`, данные, RLS | `crm/supabase/`, `docs/PLATFORM.md` | **Нет** — вход делает только владелец | Нужен доступ владельца либо `SUPABASE_SERVICE_ROLE_KEY` для API |
| `ffmpeg` | Видео для hero, сжатие роликов | `site/public/video`, скрипты | **Есть** `/usr/bin/ffmpeg` | Ничего не нужно |
| Node / npm / Vite / TypeScript | Сборка сайта и админки, `tsc -b` | `package.json`, `vite.config.ts` | **Есть** — node 24.22.2, npm 11.19.1 | Ничего не нужно |
| `tsx` / `node --test` | 117 серверных тестов (`booking`, `agent`, `funnels`, `leads`, …) | `crm/server/**/*.test.ts` | **Есть** (через devDependencies) | `npm install`, затем `npx tsx --test <файл>` |
| `team-orchestration` | Декомпозиция крупных работ на роли | — (мой глобальный скилл) | **Есть** | Ничего не нужно |
| Google/Gemini API (LLM агента, ретушь) | Агент на бесплатной модели, переводы, ретушь фото | `api/agent.ts`, `api/translate.ts`, `retouch-studio/src/api/_lib/gemini.ts` | **Ключа нет** (ключи только в Vercel) | Владелец добавляет `LLM_API_KEY`/`GEMINI_API_KEY` в Vercel |

## Что это значит для работы

1. Граф есть и у меня, и в репозитории — вопросы по коду решаем через него,
   а не чтением файлов целиком (`CLAUDE.md` проекта).
2. Аудит интерфейса делаем по той же методике `DESIGN-IS`: сначала
   `00-scope`, потом доказательства из кода/сборки, потом оценка и план.
   Шаблон уже лежит в репозитории — не изобретаем новый.
3. Браузерной автоматизации (Playwright) у меня нет: живые проверки делаю
   запросами к проду (`curl`, Lighthouse через API невозможен) и по коду;
   если нужна настоящая проверка в браузере — ставим Playwright MCP
   отдельным решением и по согласованию (≈300 МБ и запуск Chromium).
4. Секреты живут только в Vercel/Supabase; я их не ввожу и в код не кладу.

## Отдельно: найденный риск

В исходниках деплоя `retouch-studio` на Vercel лежит файл `.env` с живыми
значениями: `GEMINI_API_KEY`, `ADMIN_PASSWORD`, `AUTH_SECRET`, `ACCESS_CODE`,
`BLOB_READ_WRITE_TOKEN`. Публично он не отдаётся (404), но любой, у кого есть
доступ к исходникам деплоя, видит ключи целиком. Рекомендация: перевыпустить
ключи, `.env` держать только в Vercel Environment Variables и добавить в
`.gitignore`/`.vercelignore` (проверить, что файл не попадает в загрузку).

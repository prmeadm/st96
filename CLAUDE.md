## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- When graphify-out/graph.json exists, run `graphify query "<question>"` before your first grep, search or source-file read for a codebase question, and put this rule in every subagent prompt that explores code. Read raw files only for lines the graph or an earlier read already located. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update . && python3 scripts/graph-sections.py` to keep the graph and the per-section maps current (AST-only, no API cost).
- A committed graphify-out/graph.json is rewritten whole on every build, so a large diff to it in a pull request is expected. Do not flag it as churn or suggest skipping the graph rebuild or its hooks.

## Раскладка папок
`site/` сайт, `crm/` админка, запись, сервер, supabase, `shared/` общее, `api/` функции Vercel (в корне). Одна сборка Vite (`vite.config.ts`).

## Platform handoff
Before any work on the bot, leads, admin or funnels, look up the relevant part of `docs/PLATFORM.md` (architecture, status, next steps; search it, do not read it whole). Update it after each finished step.

## Короткие сессии по разделам (экономия лимитов)
Проект нарезан на разделы: карта в `graphify-out/sections/index.md` (Воронки, Бот и диалоги, Заявки и клиенты, Запись на встречу, Рассылки, Шаблоны и медиа, Агент и аналитика, Данные и инфраструктура, Оболочка админки, Сайт).
- Одна задача = один раздел = одна сессия. В начале сессии читать `CLAUDE.md`, `graphify-out/sections/index.md` и справку только своего раздела `graphify-out/sections/<раздел>.md`; `docs/PLATFORM.md` и `HANDOFF.md` целиком не читать, искать в них нужное место.
- Код искать по графу раздела: `graphify explain "<имя>" --graph graphify-out/sections/<раздел>/graph.json`, `graphify path "A" "B" --graph ...`; открывать только показанные файлы и строки.
- Тесты раздела указаны в его справке; весь набор (`npm run test:server`) только перед пушем.
- Если задача задевает несколько разделов, делить её: по разделу за сессию, начиная с того, от которого зависят остальные. Следующую часть предлагать отдельной сессией (start_session) с коротким заданием: раздел, файлы, критерий готовности.

# Агент, ИИ и аналитика

Задания агента (план, согласование, шаги), модель Gemini и свои модели, перевод на английский, учёт токенов, разделы «Агент», «Настройки», «Аналитика».

Граф раздела: `graphify-out/sections/agent/graph.json` (165 узлов, 367 внутренних связей).

## С чего начать сессию

1. Прочитать этот файл (и только его, не весь проект).
2. Найти нужное место в графе раздела: `graphify explain "<имя>" --graph graphify-out/sections/agent/graph.json` или путь между узлами: `graphify path "A" "B" --graph graphify-out/sections/agent/graph.json`.
3. Открывать только файлы и строки, которые показал граф.
4. Проверка: `npx tsx --test server/agent/*.test.ts server/translate.test.ts server/usage.test.ts`.

## Файлы

- `server/agent/engine.ts` — 22 узл.
- `server/agent/groupImport.ts` — 15 узл.
- `server/usage.ts` — 15 узл.
- `server/agent/models.ts` — 14 узл.
- `server/agent/tools.ts` — 13 узл.
- `src/admin/pages/AnalyticsPage.tsx` — 12 узл.
- `server/agent/llm.ts` — 10 узл.
- `server/agent/types.ts` — 10 узл.
- `server/agent/agent.test.ts` — 8 узл.
- `src/admin/pages/AgentPage.tsx` — 6 узл.
- `server/translate.ts` — 6 узл.
- `server/agent/deps.ts` — 5 узл.
- `src/admin/pages/SettingsPage.tsx` — 4 узл.
- `src/admin/pages/ModelPicker.tsx` — 3 узл.
- `api/agent.ts` — 3 узл.
- `api/translate.ts` — 3 узл.
- `api/analytics-admin.ts` — 3 узл.
- `api/agent-model.ts` — 3 узл.
- `api/status.ts` — 3 узл.
- `server/usage.test.ts` — 2 узл.
- `src/admin/ui/TranslateButton.tsx` — 2 узл.
- `server/translate.test.ts` — 2 узл.
- `server/agent/llm.test.ts` — 1 узл.

## Главные узлы (больше всего связей)

- `AnalyticsPage()` (src/admin/pages/AnalyticsPage.tsx:L22)
- `LlmError` (server/agent/llm.ts:L11)
- `handler()` (api/agent.ts:L11)
- `AgentTask` (server/agent/types.ts:L7)
- `makePlan()` (server/agent/engine.ts:L58)
- `parseCustom()` (server/agent/models.ts:L72)
- `resolveLlm()` (server/agent/deps.ts:L12)
- `importSlice()` (server/agent/groupImport.ts:L66)
- `agentDeps()` (server/agent/deps.ts:L26)
- `reload()` (server/agent/engine.ts:L15)
- `openAiCompatible()` (server/agent/llm.ts:L27)
- `line()` (server/agent/engine.ts:L14)

## От чего зависит (вызовы в другие разделы)

- **Данные и инфраструктура** (63): `.addTag()`, `.getAgentTask()`, `.getSetting()`, `.insertLlmUsage()`, `Repo`, `SITE_SERVICES`
- **Оболочка админки** (44): `BackLink()`, `BackLink.tsx`, `Icon()`, `Icon.tsx`, `KIND_OPTIONS`, `RowActions()`
- **Заявки и клиенты** (11): `ParsedLead`, `clientKey()`, `ingestGroupMessage()`, `ingestLead()`, `leads/ingest.ts`, `parse.ts`
- **Шаблоны и медиа** (11): `MediaField()`, `MediaField.tsx`, `TPL_GENERAL`, `TPL_GOALS`, `TPL_KINDS`, `TPL_SERVICES`
- **Рассылки** (3): `Segment`, `broadcasts.ts`, `startBroadcast()`

## Кто зависит от раздела (менять осторожно)

- **Данные и инфраструктура** (18): `AgentStats`, `AgentTask`, `agent/engine.ts`, `agent/types.ts`, `agentDeps()`, `deps.ts`
- **Оболочка админки** (9): `AgentPage()`, `AgentPage.tsx`, `AnalyticsPage()`, `AnalyticsPage.tsx`, `SettingsPage()`, `SettingsPage.tsx`
- **Шаблоны и медиа** (9): `TemplateStat`, `TranslateButton()`, `TranslateButton.tsx`, `popularityScore()`, `ratings()`, `usage.ts`
- **Воронки** (3): `TranslateButton()`, `TranslateButton.tsx`
- **Рассылки** (3): `TranslateButton()`, `TranslateButton.tsx`

## Типичные задачи этого раздела

- новый инструмент агента
- выбор модели
- перевод
- аналитика расходов

Если задача задевает несколько разделов, вести её по одному разделу за сессию: сначала тот, от которого зависят остальные (см. «Кто зависит от раздела»).

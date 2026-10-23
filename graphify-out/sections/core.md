# Данные и инфраструктура

Доступ к базе (Repo, Supabase, тестовая память), каталог услуг сайта, задания по расписанию /api/jobs, миграции Supabase, вход в админку.

Граф раздела: `graphify-out/sections/core/graph.json` (175 узлов, 220 внутренних связей).

## С чего начать сессию

1. Прочитать этот файл (и только его, не весь проект).
2. Найти нужное место в графе раздела: `graphify explain "<имя>" --graph graphify-out/sections/core/graph.json` или путь между узлами: `graphify path "A" "B" --graph graphify-out/sections/core/graph.json`.
3. Открывать только файлы и строки, которые показал граф.
4. Проверка: `npm run test:server`.

## Файлы

- `server/repo.ts` — 73 узл.
- `supabase/migrations/0001_core.sql` — 40 узл.
- `server/catalog.ts` — 11 узл.
- `supabase/migrations/0010_analytics.sql` — 8 узл.
- `supabase/migrations/0005_broadcasts.sql` — 6 узл.
- `supabase/migrations/0008_booking.sql` — 5 узл.
- `supabase/migrations/0006_agent.sql` — 4 узл.
- `api/jobs.ts` — 4 узл.
- `supabase/migrations/0004_templates.sql` — 4 узл.
- `supabase/migrations/0013_filter_presets.sql` — 3 узл.
- `api/geo.ts` — 3 узл.
- `server/adminAuth.ts` — 3 узл.
- `server/memoryRepo.ts` — 2 узл.
- `supabase/migrations/0011_tg_links.sql` — 2 узл.
- `supabase/migrations/0007_settings.sql` — 2 узл.
- `supabase/migrations/0002_dialogs.sql` — 2 узл.
- `supabase/migrations/0009_site_services.sql` — 1 узл.
- `supabase/migrations/0003_funnels_runtime.sql` — 1 узл.
- `supabase/migrations/0012_site_consent.sql` — 1 узл.

## Главные узлы (больше всего связей)

- `Repo` (server/repo.ts:L72)
- `supabaseRepo()` (server/repo.ts:L159)
- `json()` (server/adminAuth.ts:L3)
- `requireAdmin()` (server/adminAuth.ts:L6)
- `memoryRepo` (server/memoryRepo.ts:L32)
- `serviceLabel()` (server/catalog.ts:L26)
- `ClientRow` (server/repo.ts:L11)
- `public.clients` (supabase/migrations/0001_core.sql:L29)
- `public.leads` (supabase/migrations/0001_core.sql:L84)
- `SITE_SERVICES` (server/catalog.ts:L8)
- `.findClient()` (server/repo.ts:L75)
- `runTick()` (api/jobs.ts:L39)

## От чего зависит (вызовы в другие разделы)

- **Воронки** (23): `Funnel`, `JobRow`, `RunRow`, `funnels/engine.ts`, `funnels/types.ts`, `resumeBooking()`
- **Агент, ИИ и аналитика** (18): `AgentStats`, `AgentTask`, `agent/engine.ts`, `agent/types.ts`, `agentDeps()`, `deps.ts`
- **Запись на встречу** (15): `BookingInsert`, `BookingRow`, `booking/types.ts`, `notify.ts`, `tickBookingReminders()`
- **Рассылки** (14): `AudienceClient`, `BroadcastRow`, `Segment`, `broadcasts.ts`, `tickBroadcasts()`
- **Шаблоны и медиа** (8): `TemplateKind`, `TemplateRow`, `templates.ts`
- **Сайт st96.by** (4): `content.en.ts`, `services`, `services.ts`, `servicesEn`

## Кто зависит от раздела (менять осторожно)

- **Запись на встречу** (66): `.countRecentBookings()`, `.enqueueJob()`, `.findClient()`, `.findClientById()`, `.getBooking()`, `.getSetting()`
- **Агент, ИИ и аналитика** (63): `.addTag()`, `.getAgentTask()`, `.getSetting()`, `.insertLlmUsage()`, `Repo`, `SITE_SERVICES`
- **Заявки и клиенты** (54): `.countLeads()`, `.findClient()`, `.findLeadByContact()`, `.findLeadByMessage()`, `.getLead()`, `.insertClient()`
- **Бот и диалоги** (45): `.bumpTemplateUsed()`, `.claimUpdate()`, `.findActiveRun()`, `.findClient()`, `.findClientById()`, `.getRun()`
- **Воронки** (28): `ClientRow`, `Repo`, `SITE_SERVICES`, `memoryRepo`, `memoryRepo.ts`, `repo.ts`
- **Рассылки** (24): `.claimRecipients()`, `.finishRecipient()`, `.getBroadcast()`, `.insertMessage()`, `.insertRecipients()`, `.listActiveBroadcasts()`
- **Шаблоны и медиа** (10): `SITE_SERVICES`, `adminAuth.ts`, `json()`, `repo.ts`, `requireAdmin()`, `server/catalog.ts`
- **Оболочка админки** (2): `SITE_SERVICES`, `server/catalog.ts`

## Типичные задачи этого раздела

- новая таблица или миграция
- метод Repo
- расписание задач

Если задача задевает несколько разделов, вести её по одному разделу за сессию: сначала тот, от которого зависят остальные (см. «Кто зависит от раздела»).

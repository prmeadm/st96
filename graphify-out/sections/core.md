# Данные и инфраструктура

Доступ к базе (Repo, Supabase, тестовая память), каталог услуг сайта, задания по расписанию /api/jobs, миграции Supabase, вход в админку.

Граф раздела: `graphify-out/sections/core/graph.json` (297 узлов, 406 внутренних связей).

## С чего начать сессию

1. Прочитать этот файл (и только его, не весь проект).
2. Найти нужное место в графе раздела: `graphify explain "<имя>" --graph graphify-out/sections/core/graph.json` или путь между узлами: `graphify path "A" "B" --graph graphify-out/sections/core/graph.json`.
3. Открывать только файлы и строки, которые показал граф.
4. Проверка: `npm run test:server`.

## Файлы

- `crm/server/repo.ts` — 109 узл.
- `crm/supabase/migrations/0001_core.sql` — 40 узл.
- `crm/supabase/migrations/0024_cabinet.sql` — 38 узл.
- `crm/supabase/migrations/0016_support.sql` — 21 узл.
- `crm/server/catalog.ts` — 16 узл.
- `crm/supabase/migrations/0010_analytics.sql` — 8 узл.
- `crm/supabase/migrations/0015_crm_schema.sql` — 8 узл.
- `crm/supabase/migrations/0005_broadcasts.sql` — 6 узл.
- `crm/supabase/migrations/0008_booking.sql` — 5 узл.
- `crm/supabase/migrations/0025_catalog.sql` — 5 узл.
- `crm/supabase/migrations/0004_templates.sql` — 4 узл.
- `crm/supabase/migrations/0006_agent.sql` — 4 узл.
- `crm/server/memoryRepo.ts` — 3 узл.
- `crm/server/adminAuth.ts` — 3 узл.
- `crm/supabase/migrations/0013_filter_presets.sql` — 3 узл.
- `crm/supabase/migrations/0007_settings.sql` — 2 узл.
- `crm/supabase/migrations/0002_dialogs.sql` — 2 узл.
- `crm/supabase/migrations/0011_tg_links.sql` — 2 узл.
- `api/geo.ts` — 2 узл.
- `crm/supabase/migrations/0014_lead_interests.sql` — 2 узл.
- `crm/supabase/planned/README.md` — 2 узл.
- `api/jobs.ts` — 2 узл.
- `crm/supabase/migrations/0019_support_confirmation.sql` — 1 узл.
- `crm/supabase/migrations/0017_support_thanks.sql` — 1 узл.
- `crm/supabase/migrations/0023_app_settings_support_write.sql` — 1 узл.
- `crm/supabase/migrations/0009_site_services.sql` — 1 узл.
- `crm/supabase/migrations/0003_funnels_runtime.sql` — 1 узл.
- `crm/supabase/migrations/0018_support_voice.sql` — 1 узл.
- `crm/supabase/migrations/0021_support_project_selection.sql` — 1 узл.
- `crm/supabase/migrations/0022_credits.sql` — 1 узл.
- `crm/supabase/migrations/0020_support_attachments.sql` — 1 узл.
- `crm/supabase/migrations/0012_site_consent.sql` — 1 узл.

## Главные узлы (больше всего связей)

- `Repo` (crm/server/repo.ts:L81)
- `supabaseRepo()` (crm/server/repo.ts:L211)
- `json()` (crm/server/adminAuth.ts:L4)
- `requireAdmin()` (crm/server/adminAuth.ts:L7)
- `memoryRepo()` (crm/server/memoryRepo.ts:L44)
- `crm.orders` (crm/supabase/migrations/0024_cabinet.sql:L66)
- `ClientRow` (crm/server/repo.ts:L13)
- `crm.client_projects` (crm/supabase/migrations/0016_support.sql:L41)
- `serviceLabel()` (crm/server/catalog.ts:L51)
- `MemoryRepo` (crm/server/memoryRepo.ts:L10)
- `public.clients` (crm/supabase/migrations/0001_core.sql:L29)
- `crm.package_periods` (crm/supabase/migrations/0016_support.sql:L77)

## От чего зависит (вызовы в другие разделы)

- **Воронки** (15): `Funnel`, `JobRow`, `RunRow`, `funnels/types.ts`
- **Агент, ИИ и аналитика** (12): `AgentStats`, `AgentTask`, `agent/types.ts`
- **Запись на встречу** (12): `BookingInsert`, `BookingRow`, `booking/types.ts`
- **Рассылки** (11): `AudienceClient`, `BroadcastRow`, `Segment`, `broadcasts.ts`
- **Шаблоны и медиа** (8): `TemplateKind`, `TemplateRow`, `templates.ts`
- **Сайт st96.by** (4): `content.en.ts`, `services`, `services.ts`, `servicesEn`

## Кто зависит от раздела (менять осторожно)

- **Бот и диалоги** (59): `.bumpTemplateUsed()`, `.claimUpdate()`, `.findActiveRun()`, `.findClient()`, `.findClientById()`, `.findProjectByClient()`
- **Запись на встречу** (51): `.countRecentBookings()`, `.enqueueJob()`, `.findClient()`, `.findClientById()`, `.getBooking()`, `.getSetting()`
- **Заявки и клиенты** (43): `.countLeads()`, `.findClient()`, `.findLeadByContact()`, `.findLeadByMessage()`, `.getLead()`, `.insertClient()`
- **Воронки** (30): `ClientRow`, `MemoryRepo`, `Repo`, `SITE_SERVICES`, `memoryRepo()`, `memoryRepo.ts`
- **Агент, ИИ и аналитика** (25): `.addTag()`, `.getAgentTask()`, `.getSetting()`, `.insertLlmUsage()`, `MemoryRepo`, `Repo`
- **Рассылки** (17): `.claimRecipients()`, `.finishRecipient()`, `.getBroadcast()`, `.insertMessage()`, `.insertRecipients()`, `.listActiveBroadcasts()`
- **Оболочка админки** (3): `SITE_OFFERS`, `SITE_SERVICES`, `server/catalog.ts`
- **Шаблоны и медиа** (2): `SITE_SERVICES`, `server/catalog.ts`

## Типичные задачи этого раздела

- новая таблица или миграция
- метод Repo
- расписание задач

Если задача задевает несколько разделов, вести её по одному разделу за сессию: сначала тот, от которого зависят остальные (см. «Кто зависит от раздела»).

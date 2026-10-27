# Оболочка админки

Каркас /admin: вход, навигация, общие UI-компоненты, стили, уведомление о новой версии.

Граф раздела: `graphify-out/sections/admin/graph.json` (60 узлов, 91 внутренних связей).

## С чего начать сессию

1. Прочитать этот файл (и только его, не весь проект).
2. Найти нужное место в графе раздела: `graphify explain "<имя>" --graph graphify-out/sections/admin/graph.json` или путь между узлами: `graphify path "A" "B" --graph graphify-out/sections/admin/graph.json`.
3. Открывать только файлы и строки, которые показал граф.
4. Проверка: `npx tsc -b && npm run build`.

## Файлы

- `crm/admin/types.ts` — 11 узл.
- `crm/admin/auth.tsx` — 7 узл.
- `crm/admin/ui/QuickNav.tsx` — 6 узл.
- `crm/admin/ui/Seg.tsx` — 6 узл.
- `crm/admin/AdminApp.tsx` — 5 узл.
- `crm/admin/pages/FilterBar.tsx` — 5 узл.
- `crm/admin/ui/Icon.tsx` — 4 узл.
- `crm/admin/highlight.tsx` — 3 узл.
- `crm/admin/supabase.ts` — 3 узл.
- `crm/admin/ui/SaveButton.tsx` — 3 узл.
- `crm/admin/api.ts` — 2 узл.
- `crm/admin/ui/BackLink.tsx` — 2 узл.
- `crm/admin/ui/RowActions.tsx` — 2 узл.
- `crm/admin/main.tsx` — 1 узл.

## Главные узлы (больше всего связей)

- `Icon()` (crm/admin/ui/Icon.tsx:L45)
- `fmtDate()` (crm/admin/types.ts:L65)
- `supabase` (crm/admin/supabase.ts:L4)
- `Shell()` (crm/admin/AdminApp.tsx:L47)
- `callApi()` (crm/admin/api.ts:L4)
- `RowActions()` (crm/admin/ui/RowActions.tsx:L5)
- `clientTitle()` (crm/admin/types.ts:L68)
- `BackLink()` (crm/admin/ui/BackLink.tsx:L6)
- `FilterBar()` (crm/admin/pages/FilterBar.tsx:L12)
- `Seg()` (crm/admin/ui/Seg.tsx:L6)
- `pickKind()` (crm/admin/ui/Seg.tsx:L31)
- `SERVICES` (crm/admin/types.ts:L55)

## От чего зависит (вызовы в другие разделы)

- **Заявки и клиенты** (28): `ClientPage()`, `ClientPage.tsx`, `ClientsPage()`, `ClientsPage.tsx`, `Cond`, `CondValue`
- **Агент, ИИ и аналитика** (9): `AgentPage()`, `AgentPage.tsx`, `AnalyticsPage()`, `AnalyticsPage.tsx`, `SettingsPage()`, `SettingsPage.tsx`
- **Воронки** (6): `FunnelPage()`, `FunnelPage.tsx`, `FunnelsPage()`, `FunnelsPage.tsx`
- **Рассылки** (6): `BroadcastPage()`, `BroadcastPage.tsx`, `BroadcastsPage()`, `BroadcastsPage.tsx`
- **Запись на встречу** (3): `BookingPage()`, `BookingPage.tsx`
- **Шаблоны и медиа** (3): `TemplatesPage()`, `TemplatesPage.tsx`
- **Данные и инфраструктура** (2): `SITE_SERVICES`, `server/catalog.ts`
- **Сайт st96.by** (2): `services`, `services.ts`

## Кто зависит от раздела (менять осторожно)

- **Заявки и клиенты** (91): `BackLink()`, `BackLink.tsx`, `Client`, `FilterBar()`, `FilterBar.tsx`, `GROUP_LINK_ID`
- **Агент, ИИ и аналитика** (44): `BackLink()`, `BackLink.tsx`, `Icon()`, `Icon.tsx`, `KIND_OPTIONS`, `RowActions()`
- **Воронки** (32): `BackLink()`, `BackLink.tsx`, `Icon()`, `Icon.tsx`, `RowActions()`, `RowActions.tsx`
- **Рассылки** (31): `BackLink()`, `BackLink.tsx`, `Icon()`, `Icon.tsx`, `PICK_KINDS`, `RowActions()`
- **Шаблоны и медиа** (26): `Icon()`, `Icon.tsx`, `IconName`, `KIND_OPTIONS`, `PICK_KINDS`, `Seg()`
- **Запись на встречу** (17): `Icon()`, `Icon.tsx`, `Seg()`, `Seg.tsx`, `admin/types.ts`, `api.ts`

## Типичные задачи этого раздела

- навигация
- общие компоненты
- стили админки

Если задача задевает несколько разделов, вести её по одному разделу за сессию: сначала тот, от которого зависят остальные (см. «Кто зависит от раздела»).

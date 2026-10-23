# Оболочка админки

Каркас /admin: вход, навигация, общие UI-компоненты, стили, уведомление о новой версии.

Граф раздела: `graphify-out/sections/admin/graph.json` (55 узлов, 78 внутренних связей).

## С чего начать сессию

1. Прочитать этот файл (и только его, не весь проект).
2. Найти нужное место в графе раздела: `graphify explain "<имя>" --graph graphify-out/sections/admin/graph.json` или путь между узлами: `graphify path "A" "B" --graph graphify-out/sections/admin/graph.json`.
3. Открывать только файлы и строки, которые показал граф.
4. Проверка: `npx tsc -b && npm run build`.

## Файлы

- `src/admin/types.ts` — 11 узл.
- `src/admin/auth.tsx` — 7 узл.
- `src/admin/ui/Seg.tsx` — 6 узл.
- `src/admin/ui/QuickNav.tsx` — 6 узл.
- `src/admin/AdminApp.tsx` — 5 узл.
- `src/admin/ui/Icon.tsx` — 4 узл.
- `src/admin/ui/SaveButton.tsx` — 3 узл.
- `src/admin/supabase.ts` — 3 узл.
- `src/admin/highlight.tsx` — 3 узл.
- `src/admin/ui/BackLink.tsx` — 2 узл.
- `src/admin/ui/RowActions.tsx` — 2 узл.
- `src/admin/api.ts` — 2 узл.
- `src/admin/main.tsx` — 1 узл.

## Главные узлы (больше всего связей)

- `Icon()` (src/admin/ui/Icon.tsx:L43)
- `fmtDate()` (src/admin/types.ts:L61)
- `supabase` (src/admin/supabase.ts:L4)
- `Shell()` (src/admin/AdminApp.tsx:L47)
- `callApi()` (src/admin/api.ts:L4)
- `RowActions()` (src/admin/ui/RowActions.tsx:L5)
- `clientTitle()` (src/admin/types.ts:L64)
- `BackLink()` (src/admin/ui/BackLink.tsx:L6)
- `Seg()` (src/admin/ui/Seg.tsx:L6)
- `pickKind()` (src/admin/ui/Seg.tsx:L31)
- `SERVICES` (src/admin/types.ts:L51)
- `useAuth()` (src/admin/auth.tsx:L7)

## От чего зависит (вызовы в другие разделы)

- **Заявки и клиенты** (12): `ClientPage()`, `ClientPage.tsx`, `ClientsPage()`, `ClientsPage.tsx`, `LeadsPage()`, `LeadsPage.tsx`
- **Агент, ИИ и аналитика** (9): `AgentPage()`, `AgentPage.tsx`, `AnalyticsPage()`, `AnalyticsPage.tsx`, `SettingsPage()`, `SettingsPage.tsx`
- **Воронки** (6): `FunnelPage()`, `FunnelPage.tsx`, `FunnelsPage()`, `FunnelsPage.tsx`
- **Рассылки** (6): `BroadcastPage()`, `BroadcastPage.tsx`, `BroadcastsPage()`, `BroadcastsPage.tsx`
- **Запись на встречу** (3): `BookingPage()`, `BookingPage.tsx`
- **Шаблоны и медиа** (3): `TemplatesPage()`, `TemplatesPage.tsx`
- **Данные и инфраструктура** (2): `SITE_SERVICES`, `server/catalog.ts`
- **Сайт st96.by** (2): `services`, `services.ts`

## Кто зависит от раздела (менять осторожно)

- **Заявки и клиенты** (82): `BackLink()`, `BackLink.tsx`, `Client`, `GROUP_LINK_ID`, `Highlight()`, `Icon()`
- **Агент, ИИ и аналитика** (44): `BackLink()`, `BackLink.tsx`, `Icon()`, `Icon.tsx`, `KIND_OPTIONS`, `RowActions()`
- **Рассылки** (31): `BackLink()`, `BackLink.tsx`, `Icon()`, `Icon.tsx`, `PICK_KINDS`, `RowActions()`
- **Воронки** (29): `BackLink()`, `BackLink.tsx`, `Icon()`, `Icon.tsx`, `RowActions()`, `RowActions.tsx`
- **Шаблоны и медиа** (26): `Icon()`, `Icon.tsx`, `IconName`, `KIND_OPTIONS`, `PICK_KINDS`, `Seg()`
- **Запись на встречу** (17): `Icon()`, `Icon.tsx`, `Seg()`, `Seg.tsx`, `admin/types.ts`, `api.ts`

## Типичные задачи этого раздела

- навигация
- общие компоненты
- стили админки

Если задача задевает несколько разделов, вести её по одному разделу за сессию: сначала тот, от которого зависят остальные (см. «Кто зависит от раздела»).

# Рассылки

Массовые рассылки по сегментам (только с согласием), пачки, паузы на 429, прогресс в админке.

Граф раздела: `graphify-out/sections/broadcasts/graph.json` (31 узлов, 57 внутренних связей).

## С чего начать сессию

1. Прочитать этот файл (и только его, не весь проект).
2. Найти нужное место в графе раздела: `graphify explain "<имя>" --graph graphify-out/sections/broadcasts/graph.json` или путь между узлами: `graphify path "A" "B" --graph graphify-out/sections/broadcasts/graph.json`.
3. Открывать только файлы и строки, которые показал граф.
4. Проверка: `npx tsx --test server/broadcasts.test.ts`.

## Файлы

- `server/broadcasts.ts` — 15 узл.
- `src/admin/pages/BroadcastPage.tsx` — 6 узл.
- `server/broadcasts.test.ts` — 4 узл.
- `src/admin/pages/BroadcastsPage.tsx` — 3 узл.
- `api/broadcast.ts` — 3 узл.

## Главные узлы (больше всего связей)

- `tickBroadcasts()` (server/broadcasts.ts:L56)
- `BroadcastPage()` (src/admin/pages/BroadcastPage.tsx:L19)
- `startBroadcast()` (server/broadcasts.ts:L101)
- `BroadcastRow` (server/broadcasts.ts:L9)
- `Segment` (server/broadcasts.ts:L7)
- `handler()` (api/broadcast.ts:L12)
- `inAudience()` (server/broadcasts.ts:L34)
- `BroadcastsPage()` (src/admin/pages/BroadcastsPage.tsx:L11)
- `validateBroadcast()` (server/broadcasts.ts:L43)
- `AudienceClient` (server/broadcasts.ts:L25)
- `BROADCAST_STATUS` (server/broadcasts.ts:L27)
- `fromRow()` (src/admin/pages/BroadcastPage.tsx:L16)

## От чего зависит (вызовы в другие разделы)

- **Оболочка админки** (31): `BackLink()`, `BackLink.tsx`, `Icon()`, `Icon.tsx`, `PICK_KINDS`, `RowActions()`
- **Данные и инфраструктура** (24): `.claimRecipients()`, `.finishRecipient()`, `.getBroadcast()`, `.insertMessage()`, `.insertRecipients()`, `.listActiveBroadcasts()`
- **Шаблоны и медиа** (11): `MediaField()`, `MediaField.tsx`, `TPL_VARS`, `TemplateKind`, `TemplateRow`, `fillTemplate()`
- **Бот и диалоги** (3): `dialog.ts`, `sendContent()`
- **Агент, ИИ и аналитика** (3): `TranslateButton()`, `TranslateButton.tsx`

## Кто зависит от раздела (менять осторожно)

- **Данные и инфраструктура** (14): `AudienceClient`, `BroadcastRow`, `Segment`, `broadcasts.ts`, `tickBroadcasts()`
- **Оболочка админки** (6): `BroadcastPage()`, `BroadcastPage.tsx`, `BroadcastsPage()`, `BroadcastsPage.tsx`
- **Агент, ИИ и аналитика** (3): `Segment`, `broadcasts.ts`, `startBroadcast()`

## Типичные задачи этого раздела

- сегменты
- расписание рассылки
- медиа в рассылке

Если задача задевает несколько разделов, вести её по одному разделу за сессию: сначала тот, от которого зависят остальные (см. «Кто зависит от раздела»).

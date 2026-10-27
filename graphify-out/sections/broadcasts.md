# Рассылки

Массовые рассылки по сегментам (только с согласием), пачки, паузы на 429, прогресс в админке.

Граф раздела: `graphify-out/sections/broadcasts/graph.json` (31 узлов, 57 внутренних связей).

## С чего начать сессию

1. Прочитать этот файл (и только его, не весь проект).
2. Найти нужное место в графе раздела: `graphify explain "<имя>" --graph graphify-out/sections/broadcasts/graph.json` или путь между узлами: `graphify path "A" "B" --graph graphify-out/sections/broadcasts/graph.json`.
3. Открывать только файлы и строки, которые показал граф.
4. Проверка: `npx tsx --test crm/server/broadcasts.test.ts`.

## Файлы

- `crm/server/broadcasts.ts` — 15 узл.
- `crm/admin/pages/BroadcastPage.tsx` — 6 узл.
- `crm/server/broadcasts.test.ts` — 4 узл.
- `api/broadcast.ts` — 3 узл.
- `crm/admin/pages/BroadcastsPage.tsx` — 3 узл.

## Главные узлы (больше всего связей)

- `tickBroadcasts()` (crm/server/broadcasts.ts:L57)
- `BroadcastPage()` (crm/admin/pages/BroadcastPage.tsx:L19)
- `startBroadcast()` (crm/server/broadcasts.ts:L102)
- `BroadcastRow` (crm/server/broadcasts.ts:L9)
- `inAudience()` (crm/server/broadcasts.ts:L34)
- `Segment` (crm/server/broadcasts.ts:L7)
- `handler()` (api/broadcast.ts:L12)
- `BroadcastsPage()` (crm/admin/pages/BroadcastsPage.tsx:L11)
- `validateBroadcast()` (crm/server/broadcasts.ts:L44)
- `AudienceClient` (crm/server/broadcasts.ts:L25)
- `BROADCAST_STATUS` (crm/server/broadcasts.ts:L27)
- `fromRow()` (crm/admin/pages/BroadcastPage.tsx:L16)

## От чего зависит (вызовы в другие разделы)

- **Оболочка админки** (31): `BackLink()`, `BackLink.tsx`, `Icon()`, `Icon.tsx`, `PICK_KINDS`, `RowActions()`
- **Данные и инфраструктура** (24): `.claimRecipients()`, `.finishRecipient()`, `.getBroadcast()`, `.insertMessage()`, `.insertRecipients()`, `.listActiveBroadcasts()`
- **Шаблоны и медиа** (11): `MediaField()`, `MediaField.tsx`, `TPL_VARS`, `TemplateKind`, `TemplateRow`, `fillTemplate()`
- **Агент, ИИ и аналитика** (3): `TranslateButton()`, `TranslateButton.tsx`
- **Бот и диалоги** (3): `dialog.ts`, `sendContent()`
- **Заявки и клиенты** (1): `INTERESTS`

## Кто зависит от раздела (менять осторожно)

- **Данные и инфраструктура** (14): `AudienceClient`, `BroadcastRow`, `Segment`, `broadcasts.ts`, `tickBroadcasts()`
- **Оболочка админки** (6): `BroadcastPage()`, `BroadcastPage.tsx`, `BroadcastsPage()`, `BroadcastsPage.tsx`
- **Агент, ИИ и аналитика** (3): `Segment`, `broadcasts.ts`, `startBroadcast()`

## Типичные задачи этого раздела

- сегменты
- расписание рассылки
- медиа в рассылке

Если задача задевает несколько разделов, вести её по одному разделу за сессию: сначала тот, от которого зависят остальные (см. «Кто зависит от раздела»).

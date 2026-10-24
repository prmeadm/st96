# Воронки

Движок воронок (запуск, кнопки, условия, действия, паузы, запись из воронки, повторы при сбоях), отправка в Telegram (медиа с подписью, YouTube, кружки, 429), конструктор в админке.

Граф раздела: `graphify-out/sections/funnels/graph.json` (190 узлов, 447 внутренних связей).

## С чего начать сессию

1. Прочитать этот файл (и только его, не весь проект).
2. Найти нужное место в графе раздела: `graphify explain "<имя>" --graph graphify-out/sections/funnels/graph.json` или путь между узлами: `graphify path "A" "B" --graph graphify-out/sections/funnels/graph.json`.
3. Открывать только файлы и строки, которые показал граф.
4. Проверка: `npx tsx --test crm/server/funnels/*.test.ts crm/server/media.test.ts crm/server/bot/keyboard.test.ts crm/server/bot/videonote.test.ts`.

## Файлы

- `crm/server/funnels/engine.ts` — 27 узл.
- `crm/admin/builder/catalog.ts` — 23 узл.
- `crm/server/funnels/types.ts` — 18 узл.
- `crm/admin/builder/Nodes.tsx` — 17 узл.
- `crm/server/media.ts` — 14 узл.
- `crm/admin/builder/Editor.tsx` — 12 узл.
- `crm/server/bot/telegramOut.ts` — 10 узл.
- `crm/server/funnels/realFunnel.test.ts` — 9 узл.
- `crm/server/funnels/engine.test.ts` — 8 узл.
- `crm/admin/ui/VideoNoteField.tsx` — 8 узл.
- `crm/server/funnels/retry.ts` — 6 узл.
- `crm/admin/builder/Builder.tsx` — 6 узл.
- `crm/server/funnels/triggers.ts` — 4 узл.
- `crm/admin/pages/FunnelPage.tsx` — 4 узл.
- `crm/admin/pages/FunnelsPage.tsx` — 4 узл.
- `crm/admin/builder/Preview.tsx` — 4 узл.
- `crm/server/funnels/demo.ts` — 3 узл.
- `crm/server/funnels/validate.ts` — 3 узл.
- `crm/server/bot/videonote.test.ts` — 3 узл.
- `crm/admin/builder/Edges.tsx` — 3 узл.
- `crm/server/media.test.ts` — 2 узл.
- `crm/server/bot/keyboard.test.ts` — 2 узл.

## Главные узлы (больше всего связей)

- `advance()` (crm/server/funnels/engine.ts:L209)
- `telegramOut()` (crm/server/bot/telegramOut.ts:L55)
- `Ic()` (crm/admin/builder/Nodes.tsx:L21)
- `Editor()` (crm/admin/builder/Editor.tsx:L118)
- `Inner()` (crm/admin/builder/Builder.tsx:L23)
- `Shell()` (crm/admin/builder/Nodes.tsx:L25)
- `Graph` (crm/server/funnels/types.ts:L10)
- `VideoNoteField()` (crm/admin/ui/VideoNoteField.tsx:L70)
- `Funnel` (crm/server/funnels/types.ts:L12)
- `asArray()` (crm/server/funnels/types.ts:L35)
- `RunRow` (crm/server/funnels/types.ts:L14)
- `validateGraph()` (crm/server/funnels/validate.ts:L6)

## От чего зависит (вызовы в другие разделы)

- **Оболочка админки** (32): `BackLink()`, `BackLink.tsx`, `Icon()`, `Icon.tsx`, `RowActions()`, `RowActions.tsx`
- **Данные и инфраструктура** (28): `ClientRow`, `Repo`, `SITE_SERVICES`, `memoryRepo`, `memoryRepo.ts`, `repo.ts`
- **Запись на встречу** (10): `FORMAT_KEYS`, `FormatKey`, `ServiceKey`, `bookingUrl()`, `hasFreeSlots()`, `schedule.ts`
- **Шаблоны и медиа** (6): `MediaField()`, `MediaField.tsx`, `TPL_KINDS`, `TemplateRow`, `templates.ts`
- **Бот и диалоги** (5): `dialog.ts`, `notifyTopic()`, `sendContent()`
- **Агент, ИИ и аналитика** (3): `TranslateButton()`, `TranslateButton.tsx`

## Кто зависит от раздела (менять осторожно)

- **Бот и диалоги** (35): `CAPTION_LIMIT`, `Env`, `NOT_A_FILE_ERROR`, `TRIGGER`, `canonicalVideoUrl()`, `demo.ts`
- **Данные и инфраструктура** (23): `Funnel`, `JobRow`, `RunRow`, `funnels/engine.ts`, `funnels/types.ts`, `resumeBooking()`
- **Оболочка админки** (6): `FunnelPage()`, `FunnelPage.tsx`, `FunnelsPage()`, `FunnelsPage.tsx`

## Типичные задачи этого раздела

- новый тип блока или действия
- поведение кнопок и веток
- как выглядит сообщение в Telegram
- статистика воронок
- блок «ИИ-ответ»

Если задача задевает несколько разделов, вести её по одному разделу за сессию: сначала тот, от которого зависят остальные (см. «Кто зависит от раздела»).

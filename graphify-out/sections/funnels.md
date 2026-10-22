# Воронки

Движок воронок (запуск, кнопки, условия, действия, паузы, запись из воронки, повторы при сбоях), отправка в Telegram (медиа с подписью, YouTube, кружки, 429), конструктор в админке.

Граф раздела: `graphify-out/sections/funnels/graph.json` (182 узлов, 432 внутренних связей).

## С чего начать сессию

1. Прочитать этот файл (и только его, не весь проект).
2. Найти нужное место в графе раздела: `graphify explain "<имя>" --graph graphify-out/sections/funnels/graph.json` или путь между узлами: `graphify path "A" "B" --graph graphify-out/sections/funnels/graph.json`.
3. Открывать только файлы и строки, которые показал граф.
4. Проверка: `npx tsx --test server/funnels/*.test.ts server/media.test.ts server/bot/keyboard.test.ts server/bot/videonote.test.ts`.

## Файлы

- `server/funnels/engine.ts` — 27 узл.
- `src/admin/builder/catalog.ts` — 23 узл.
- `server/funnels/types.ts` — 18 узл.
- `src/admin/builder/Nodes.tsx` — 17 узл.
- `server/media.ts` — 13 узл.
- `src/admin/builder/Editor.tsx` — 11 узл.
- `server/funnels/realFunnel.test.ts` — 10 узл.
- `server/bot/telegramOut.ts` — 8 узл.
- `server/funnels/engine.test.ts` — 8 узл.
- `server/funnels/retry.ts` — 6 узл.
- `src/admin/builder/Builder.tsx` — 6 узл.
- `src/admin/pages/FunnelPage.tsx` — 4 узл.
- `server/funnels/triggers.ts` — 4 узл.
- `src/admin/pages/FunnelsPage.tsx` — 4 узл.
- `src/admin/builder/Preview.tsx` — 4 узл.
- `src/admin/ui/VideoNoteField.tsx` — 4 узл.
- `server/funnels/validate.ts` — 3 узл.
- `server/funnels/demo.ts` — 3 узл.
- `src/admin/builder/Edges.tsx` — 3 узл.
- `server/bot/keyboard.test.ts` — 2 узл.
- `server/bot/videonote.test.ts` — 2 узл.
- `server/media.test.ts` — 2 узл.

## Главные узлы (больше всего связей)

- `advance()` (server/funnels/engine.ts:L210)
- `telegramOut()` (server/bot/telegramOut.ts:L42)
- `Ic()` (src/admin/builder/Nodes.tsx:L21)
- `Inner()` (src/admin/builder/Builder.tsx:L23)
- `Editor()` (src/admin/builder/Editor.tsx:L86)
- `Shell()` (src/admin/builder/Nodes.tsx:L25)
- `Funnel` (server/funnels/types.ts:L12)
- `Graph` (server/funnels/types.ts:L10)
- `validateGraph()` (server/funnels/validate.ts:L6)
- `RunRow` (server/funnels/types.ts:L14)
- `TRIGGER` (server/funnels/types.ts:L27)
- `asArray()` (server/funnels/types.ts:L35)

## От чего зависит (вызовы в другие разделы)

- **Оболочка админки** (29): `BackLink()`, `BackLink.tsx`, `Icon()`, `Icon.tsx`, `RowActions()`, `RowActions.tsx`
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

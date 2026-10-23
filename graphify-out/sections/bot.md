# Бот и диалоги

Вебхук Telegram, /start и /stop, темы клиентов в группе «Лиды ST96», команды сотрудников (/shablon, /book, //заметка, /close), пересылка диалога человеку.

Граф раздела: `graphify-out/sections/bot/graph.json` (37 узлов, 63 внутренних связей).

## С чего начать сессию

1. Прочитать этот файл (и только его, не весь проект).
2. Найти нужное место в графе раздела: `graphify explain "<имя>" --graph graphify-out/sections/bot/graph.json` или путь между узлами: `graphify path "A" "B" --graph graphify-out/sections/bot/graph.json`.
3. Открывать только файлы и строки, которые показал граф.
4. Проверка: `npx tsx --test server/bot/bot.test.ts`.

## Файлы

- `server/bot/dialog.ts` — 13 узл.
- `server/bot/bot.test.ts` — 9 узл.
- `server/bot/bot.ts` — 8 узл.
- `api/telegram.ts` — 4 узл.
- `server/bot/texts.ts` — 3 узл.

## Главные узлы (больше всего связей)

- `createBot()` (server/bot/bot.ts:L63)
- `sendContent()` (server/bot/dialog.ts:L167)
- `handleTopicMessage()` (server/bot/dialog.ts:L79)
- `sendTemplate()` (server/bot/dialog.ts:L233)
- `ensureClient()` (server/bot/bot.ts:L29)
- `relayToAdmins()` (server/bot/dialog.ts:L51)
- `ensureTopic()` (server/bot/dialog.ts:L37)
- `cardText()` (server/bot/dialog.ts:L22)
- `linkLeadClient()` (server/bot/bot.ts:L20)
- `handler()` (api/telegram.ts:L10)
- `notifyTopic()` (server/bot/dialog.ts:L140)
- `showTemplateMenu()` (server/bot/dialog.ts:L153)

## От чего зависит (вызовы в другие разделы)

- **Данные и инфраструктура** (45): `.bumpTemplateUsed()`, `.claimUpdate()`, `.findActiveRun()`, `.findClient()`, `.findClientById()`, `.getRun()`
- **Воронки** (35): `CAPTION_LIMIT`, `Env`, `NOT_A_FILE_ERROR`, `TRIGGER`, `canonicalVideoUrl()`, `demo.ts`
- **Запись на встречу** (13): `bookingUrl()`, `createBooking()`, `decideBooking()`, `loadDirectAdmins()`, `notify.ts`, `notifyClientDecision()`
- **Заявки и клиенты** (6): `clickablePhone()`, `ingestGroupMessage()`, `leads/ingest.ts`, `parse.ts`
- **Шаблоны и медиа** (6): `TPL_KINDS`, `TemplateKind`, `TemplateRow`, `fillTemplate()`, `templates.ts`

## Кто зависит от раздела (менять осторожно)

- **Воронки** (5): `dialog.ts`, `notifyTopic()`, `sendContent()`
- **Шаблоны и медиа** (3): `dialog.ts`, `sendTemplate()`
- **Рассылки** (3): `dialog.ts`, `sendContent()`
- **Запись на встречу** (2): `bot.ts`, `createBot()`

## Типичные задачи этого раздела

- новая команда в теме
- тексты бота RU/EN
- поведение /start
- передача диалога человеку

Если задача задевает несколько разделов, вести её по одному разделу за сессию: сначала тот, от которого зависят остальные (см. «Кто зависит от раздела»).

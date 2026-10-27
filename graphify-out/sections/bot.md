# Бот и диалоги

Вебхук Telegram, /start и /stop, темы клиентов в группе «Лиды ST96», команды сотрудников (/shablon, /book, //заметка, /close), пересылка диалога человеку.

Граф раздела: `graphify-out/sections/bot/graph.json` (51 узлов, 93 внутренних связей).

## С чего начать сессию

1. Прочитать этот файл (и только его, не весь проект).
2. Найти нужное место в графе раздела: `graphify explain "<имя>" --graph graphify-out/sections/bot/graph.json` или путь между узлами: `graphify path "A" "B" --graph graphify-out/sections/bot/graph.json`.
3. Открывать только файлы и строки, которые показал граф.
4. Проверка: `npx tsx --test crm/server/bot/bot.test.ts`.

## Файлы

- `crm/server/bot/dialog.ts` — 13 узл.
- `crm/server/bot/bot.ts` — 11 узл.
- `crm/server/bot/siteRef.ts` — 11 узл.
- `crm/server/bot/bot.test.ts` — 9 узл.
- `api/telegram.ts` — 4 узл.
- `crm/server/bot/texts.ts` — 3 узл.

## Главные узлы (больше всего связей)

- `createBot()` (crm/server/bot/bot.ts:L96)
- `beginStart()` (crm/server/bot/bot.ts:L64)
- `sendContent()` (crm/server/bot/dialog.ts:L167)
- `sendTemplate()` (crm/server/bot/dialog.ts:L233)
- `handleTopicMessage()` (crm/server/bot/dialog.ts:L79)
- `ensureClient()` (crm/server/bot/bot.ts:L30)
- `relayToAdmins()` (crm/server/bot/dialog.ts:L51)
- `ensureTopic()` (crm/server/bot/dialog.ts:L37)
- `verifySiteRef()` (crm/server/bot/siteRef.ts:L41)
- `linkLeadClient()` (crm/server/bot/bot.ts:L21)
- `handler()` (api/telegram.ts:L10)
- `issueSiteRef()` (crm/server/bot/siteRef.ts:L60)

## От чего зависит (вызовы в другие разделы)

- **Данные и инфраструктура** (50): `.bumpTemplateUsed()`, `.claimUpdate()`, `.findActiveRun()`, `.findClient()`, `.findClientById()`, `.getRun()`
- **Воронки** (37): `CAPTION_LIMIT`, `Env`, `NOT_A_FILE_ERROR`, `TRIGGER`, `canonicalVideoUrl()`, `demo.ts`
- **Запись на встречу** (13): `bookingUrl()`, `createBooking()`, `decideBooking()`, `loadDirectAdmins()`, `notify.ts`, `notifyClientDecision()`
- **Заявки и клиенты** (10): `clickablePhone()`, `ingestGroupMessage()`, `ingestLead()`, `leads/ingest.ts`, `parse.ts`, `parseLead()`
- **Шаблоны и медиа** (6): `TPL_KINDS`, `TemplateKind`, `TemplateRow`, `fillTemplate()`, `templates.ts`

## Кто зависит от раздела (менять осторожно)

- **Воронки** (5): `dialog.ts`, `notifyTopic()`, `sendContent()`
- **Заявки и клиенты** (3): `issueSiteRef()`, `siteRef.ts`
- **Шаблоны и медиа** (3): `dialog.ts`, `sendTemplate()`
- **Рассылки** (3): `dialog.ts`, `sendContent()`
- **Запись на встречу** (2): `bot.ts`, `createBot()`

## Типичные задачи этого раздела

- новая команда в теме
- тексты бота RU/EN
- поведение /start
- передача диалога человеку

Если задача задевает несколько разделов, вести её по одному разделу за сессию: сначала тот, от которого зависят остальные (см. «Кто зависит от раздела»).

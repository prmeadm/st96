# Заявки и клиенты

Приём заявок (форма сайта, стенд, группа, вручную), разбор полей, клиенты, заметки сотрудников, страницы «Клиенты», «Заявки», «Заметки» в админке.

Граф раздела: `graphify-out/sections/leads/graph.json` (127 узлов, 265 внутренних связей).

## С чего начать сессию

1. Прочитать этот файл (и только его, не весь проект).
2. Найти нужное место в графе раздела: `graphify explain "<имя>" --graph graphify-out/sections/leads/graph.json` или путь между узлами: `graphify path "A" "B" --graph graphify-out/sections/leads/graph.json`.
3. Открывать только файлы и строки, которые показал граф.
4. Проверка: `npx tsx --test server/leads/*.test.ts`.

## Файлы

- `server/leads/filter.ts` — 32 узл.
- `server/leads/parse.ts` — 15 узл.
- `server/leads/manual.ts` — 11 узл.
- `api/lead.ts` — 10 узл.
- `server/leads/ingest.ts` — 9 узл.
- `src/admin/pages/ClientsPage.tsx` — 8 узл.
- `src/admin/pages/LeadEditor.tsx` — 6 узл.
- `src/admin/pages/LeadsPage.tsx` — 6 узл.
- `server/leads/filter.test.ts` — 5 узл.
- `src/admin/pages/NotesPage.tsx` — 4 узл.
- `api/ingest.ts` — 4 узл.
- `api/lead-admin.ts` — 3 узл.
- `src/admin/pages/ClientPage.tsx` — 3 узл.
- `src/admin/ui/ContactLinks.tsx` — 3 узл.
- `server/leads/ingest.test.ts` — 3 узл.
- `src/admin/clientDelete.ts` — 2 узл.
- `server/leads/parse.test.ts` — 2 узл.
- `server/leads/manual.test.ts` — 1 узл.

## Главные узлы (больше всего связей)

- `parseLead()` (server/leads/parse.ts:L86)
- `ingestLead()` (server/leads/ingest.ts:L49)
- `ClientsPage()` (src/admin/pages/ClientsPage.tsx:L56)
- `ClientPage()` (src/admin/pages/ClientPage.tsx:L78)
- `LeadsPage()` (src/admin/pages/LeadsPage.tsx:L53)
- `updateManualLead()` (server/leads/manual.ts:L148)
- `ingestGroupMessage()` (server/leads/ingest.ts:L81)
- `normalizePhone()` (server/leads/parse.ts:L51)
- `createManualLead()` (server/leads/manual.ts:L137)
- `inferFields()` (server/leads/filter.ts:L42)
- `parseManualText()` (server/leads/manual.ts:L37)
- `clickablePhone()` (server/leads/parse.ts:L64)

## От чего зависит (вызовы в другие разделы)

- **Оболочка админки** (91): `BackLink()`, `BackLink.tsx`, `Client`, `FilterBar()`, `FilterBar.tsx`, `GROUP_LINK_ID`
- **Данные и инфраструктура** (54): `.countLeads()`, `.findClient()`, `.findLeadByContact()`, `.findLeadByMessage()`, `.getLead()`, `.insertClient()`
- **Сайт st96.by** (6): `PhoneField()`, `PhoneField.tsx`
- **Шаблоны и медиа** (5): `TPL_KINDS`, `TemplateRow`, `fillTemplate()`, `templates.ts`

## Кто зависит от раздела (менять осторожно)

- **Оболочка админки** (25): `ClientPage()`, `ClientPage.tsx`, `ClientsPage()`, `ClientsPage.tsx`, `Cond`, `CondValue`
- **Агент, ИИ и аналитика** (11): `ParsedLead`, `clientKey()`, `ingestGroupMessage()`, `ingestLead()`, `leads/ingest.ts`, `parse.ts`
- **Запись на встречу** (11): `ContactLinks()`, `ContactLinks.tsx`, `clickablePhone()`, `normalizePhone()`, `normalizeTelegram()`, `parse.ts`
- **Бот и диалоги** (6): `clickablePhone()`, `ingestGroupMessage()`, `leads/ingest.ts`, `parse.ts`

## Типичные задачи этого раздела

- разбор заявки
- поиск и фильтры клиентов
- карточка клиента
- форма заявки на сайте (вместе с разделом «Сайт»)

Если задача задевает несколько разделов, вести её по одному разделу за сессию: сначала тот, от которого зависят остальные (см. «Кто зависит от раздела»).

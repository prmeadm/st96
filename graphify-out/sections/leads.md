# Заявки и клиенты

Приём заявок (форма сайта, стенд, группа, вручную), разбор полей, клиенты, заметки сотрудников, страницы «Клиенты», «Заявки», «Заметки» в админке.

Граф раздела: `graphify-out/sections/leads/graph.json` (131 узлов, 274 внутренних связей).

## С чего начать сессию

1. Прочитать этот файл (и только его, не весь проект).
2. Найти нужное место в графе раздела: `graphify explain "<имя>" --graph graphify-out/sections/leads/graph.json` или путь между узлами: `graphify path "A" "B" --graph graphify-out/sections/leads/graph.json`.
3. Открывать только файлы и строки, которые показал граф.
4. Проверка: `npx tsx --test crm/server/leads/*.test.ts`.

## Файлы

- `crm/server/leads/filter.ts` — 32 узл.
- `crm/server/leads/parse.ts` — 15 узл.
- `crm/server/leads/manual.ts` — 11 узл.
- `api/lead.ts` — 10 узл.
- `crm/server/leads/ingest.ts` — 9 узл.
- `crm/admin/pages/ClientsPage.tsx` — 8 узл.
- `crm/admin/pages/LeadsPage.tsx` — 6 узл.
- `crm/admin/pages/LeadEditor.tsx` — 6 узл.
- `crm/server/leads/filter.test.ts` — 5 узл.
- `crm/admin/pages/NotesPage.tsx` — 4 узл.
- `crm/server/leads/interests.ts` — 4 узл.
- `api/ingest.ts` — 4 узл.
- `crm/server/leads/ingest.test.ts` — 3 узл.
- `api/lead-admin.ts` — 3 узл.
- `crm/admin/ui/ContactLinks.tsx` — 3 узл.
- `crm/admin/pages/ClientPage.tsx` — 3 узл.
- `crm/server/leads/parse.test.ts` — 2 узл.
- `crm/admin/clientDelete.ts` — 2 узл.
- `crm/server/leads/manual.test.ts` — 1 узл.

## Главные узлы (больше всего связей)

- `parseLead()` (crm/server/leads/parse.ts:L86)
- `ingestLead()` (crm/server/leads/ingest.ts:L49)
- `ClientsPage()` (crm/admin/pages/ClientsPage.tsx:L56)
- `ClientPage()` (crm/admin/pages/ClientPage.tsx:L78)
- `LeadsPage()` (crm/admin/pages/LeadsPage.tsx:L54)
- `ingestGroupMessage()` (crm/server/leads/ingest.ts:L81)
- `updateManualLead()` (crm/server/leads/manual.ts:L151)
- `normalizePhone()` (crm/server/leads/parse.ts:L51)
- `parseManualText()` (crm/server/leads/manual.ts:L39)
- `createManualLead()` (crm/server/leads/manual.ts:L139)
- `inferFields()` (crm/server/leads/filter.ts:L42)
- `applyFilter()` (crm/server/leads/filter.ts:L156)

## От чего зависит (вызовы в другие разделы)

- **Оболочка админки** (91): `BackLink()`, `BackLink.tsx`, `Client`, `FilterBar()`, `FilterBar.tsx`, `GROUP_LINK_ID`
- **Данные и инфраструктура** (54): `.countLeads()`, `.findClient()`, `.findLeadByContact()`, `.findLeadByMessage()`, `.getLead()`, `.insertClient()`
- **Сайт st96.by** (6): `PhoneField()`, `PhoneField.tsx`
- **Шаблоны и медиа** (5): `TPL_KINDS`, `TemplateRow`, `fillTemplate()`, `templates.ts`

## Кто зависит от раздела (менять осторожно)

- **Оболочка админки** (28): `ClientPage()`, `ClientPage.tsx`, `ClientsPage()`, `ClientsPage.tsx`, `Cond`, `CondValue`
- **Запись на встречу** (11): `ContactLinks()`, `ContactLinks.tsx`, `clickablePhone()`, `normalizePhone()`, `normalizeTelegram()`, `parse.ts`
- **Агент, ИИ и аналитика** (11): `ParsedLead`, `clientKey()`, `ingestGroupMessage()`, `ingestLead()`, `leads/ingest.ts`, `parse.ts`
- **Бот и диалоги** (6): `clickablePhone()`, `ingestGroupMessage()`, `leads/ingest.ts`, `parse.ts`
- **Рассылки** (1): `INTERESTS`

## Типичные задачи этого раздела

- разбор заявки
- поиск и фильтры клиентов
- карточка клиента
- форма заявки на сайте (вместе с разделом «Сайт»)

Если задача задевает несколько разделов, вести её по одному разделу за сессию: сначала тот, от которого зависят остальные (см. «Кто зависит от раздела»).

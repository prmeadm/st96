# Шаблоны и медиа

Библиотека шаблонов, отправка шаблона клиенту, загрузка и съёмка медиа (фото, видео, голос, файл).

Граф раздела: `graphify-out/sections/templates/graph.json` (34 узлов, 53 внутренних связей).

## С чего начать сессию

1. Прочитать этот файл (и только его, не весь проект).
2. Найти нужное место в графе раздела: `graphify explain "<имя>" --graph graphify-out/sections/templates/graph.json` или путь между узлами: `graphify path "A" "B" --graph graphify-out/sections/templates/graph.json`.
3. Открывать только файлы и строки, которые показал граф.
4. Проверка: `npx tsx --test server/bot/bot.test.ts  # шаблоны в темах`.

## Файлы

- `server/templates.ts` — 10 узл.
- `src/admin/pages/TemplatesPage.tsx` — 8 узл.
- `src/admin/ui/MediaField.tsx` — 7 узл.
- `src/admin/ui/CameraCapture.tsx` — 6 узл.
- `api/send-template.ts` — 3 узл.

## Главные узлы (больше всего связей)

- `MediaField()` (src/admin/ui/MediaField.tsx:L48)
- `TemplatesPage()` (src/admin/pages/TemplatesPage.tsx:L18)
- `TemplateRow` (server/templates.ts:L5)
- `TemplateKind` (server/templates.ts:L4)
- `fillTemplate()` (server/templates.ts:L29)
- `Editor()` (src/admin/pages/TemplatesPage.tsx:L150)
- `CameraCapture()` (src/admin/ui/CameraCapture.tsx:L12)
- `TPL_KINDS` (server/templates.ts:L20)
- `handler()` (api/send-template.ts:L9)
- `TPL_GOALS` (server/templates.ts:L22)
- `TPL_VARS` (server/templates.ts:L26)
- `toVoiceFile()` (src/admin/ui/MediaField.tsx:L28)

## От чего зависит (вызовы в другие разделы)

- **Оболочка админки** (26): `Icon()`, `Icon.tsx`, `IconName`, `KIND_OPTIONS`, `PICK_KINDS`, `Seg()`
- **Данные и инфраструктура** (10): `SITE_SERVICES`, `adminAuth.ts`, `json()`, `repo.ts`, `requireAdmin()`, `server/catalog.ts`
- **Агент, ИИ и аналитика** (9): `TemplateStat`, `TranslateButton()`, `TranslateButton.tsx`, `popularityScore()`, `ratings()`, `usage.ts`
- **Бот и диалоги** (3): `dialog.ts`, `sendTemplate()`
- **Запись на встречу** (3): `bookingUrl()`, `schedule.ts`

## Кто зависит от раздела (менять осторожно)

- **Агент, ИИ и аналитика** (11): `MediaField()`, `MediaField.tsx`, `TPL_GENERAL`, `TPL_GOALS`, `TPL_KINDS`, `TPL_SERVICES`
- **Рассылки** (11): `MediaField()`, `MediaField.tsx`, `TPL_VARS`, `TemplateKind`, `TemplateRow`, `fillTemplate()`
- **Данные и инфраструктура** (8): `TemplateKind`, `TemplateRow`, `templates.ts`
- **Бот и диалоги** (6): `TPL_KINDS`, `TemplateKind`, `TemplateRow`, `fillTemplate()`, `templates.ts`
- **Воронки** (6): `MediaField()`, `MediaField.tsx`, `TPL_KINDS`, `TemplateRow`, `templates.ts`
- **Заявки и клиенты** (5): `TPL_KINDS`, `TemplateRow`, `fillTemplate()`, `templates.ts`
- **Оболочка админки** (3): `TemplatesPage()`, `TemplatesPage.tsx`

## Типичные задачи этого раздела

- поля шаблона
- фильтры и рейтинг
- камера и запись голоса

Если задача задевает несколько разделов, вести её по одному разделу за сессию: сначала тот, от которого зависят остальные (см. «Кто зависит от раздела»).

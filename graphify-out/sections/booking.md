# Запись на встречу

Расписание и слоты, заявки на встречу, подтверждение кнопками, уведомления и .ics, напоминания, страница /book, раздел «Запись» в админке.

Граф раздела: `graphify-out/sections/booking/graph.json` (141 узлов, 340 внутренних связей).

## С чего начать сессию

1. Прочитать этот файл (и только его, не весь проект).
2. Найти нужное место в графе раздела: `graphify explain "<имя>" --graph graphify-out/sections/booking/graph.json` или путь между узлами: `graphify path "A" "B" --graph graphify-out/sections/booking/graph.json`.
3. Открывать только файлы и строки, которые показал граф.
4. Проверка: `npx tsx --test crm/server/booking/*.test.ts`.

## Файлы

- `crm/server/booking/schedule.ts` — 45 узл.
- `crm/server/booking/service.ts` — 31 узл.
- `crm/admin/pages/BookingPage.tsx` — 12 узл.
- `crm/book/BookPage.tsx` — 8 узл.
- `crm/server/booking/notify.ts` — 7 узл.
- `crm/server/booking/booking.test.ts` — 7 узл.
- `crm/booking/MonthGrid.tsx` — 6 узл.
- `crm/book/index.html` — 5 узл.
- `crm/server/booking/types.ts` — 5 узл.
- `crm/shared/data/serviceOptions.ts` — 4 узл.
- `crm/server/booking/ics.ts` — 4 узл.
- `crm/shared/data/bookingGoals.ts` — 2 узл.
- `api/booking.ts` — 2 узл.
- `api/booking-admin.ts` — 2 узл.
- `crm/book/main.tsx` — 1 узл.

## Главные узлы (больше всего связей)

- `createBooking()` (crm/server/booking/service.ts:L98)
- `ScheduleTab()` (crm/admin/pages/BookingPage.tsx:L146)
- `dayInfo()` (crm/server/booking/schedule.ts:L114)
- `notifyClientDecision()` (crm/server/booking/notify.ts:L48)
- `BookingRow` (crm/server/booking/types.ts:L4)
- `normalizeSchedule()` (crm/server/booking/schedule.ts:L72)
- `bookingUrl()` (crm/server/booking/schedule.ts:L179)
- `decideBooking()` (crm/server/booking/service.ts:L174)
- `addDays()` (crm/server/booking/schedule.ts:L44)
- `whenLabel()` (crm/server/booking/schedule.ts:L171)
- `BookingPage()` (crm/admin/pages/BookingPage.tsx:L30)
- `buildIcs()` (crm/server/booking/ics.ts:L9)

## От чего зависит (вызовы в другие разделы)

- **Данные и инфраструктура** (51): `.countRecentBookings()`, `.enqueueJob()`, `.findClient()`, `.findClientById()`, `.getBooking()`, `.getSetting()`
- **Оболочка админки** (17): `Icon()`, `Icon.tsx`, `Seg()`, `Seg.tsx`, `admin/types.ts`, `api.ts`
- **Заявки и клиенты** (11): `ContactLinks()`, `ContactLinks.tsx`, `clickablePhone()`, `normalizePhone()`, `normalizeTelegram()`, `parse.ts`
- **Сайт st96.by** (8): `POLICY_PATH`, `PhoneField()`, `PhoneField.tsx`, `privacy.ts`
- **Бот и диалоги** (2): `bot.ts`, `createBot()`

## Кто зависит от раздела (менять осторожно)

- **Бот и диалоги** (13): `bookingUrl()`, `createBooking()`, `decideBooking()`, `loadDirectAdmins()`, `notify.ts`, `notifyClientDecision()`
- **Данные и инфраструктура** (12): `BookingInsert`, `BookingRow`, `booking/types.ts`
- **Воронки** (10): `FORMAT_KEYS`, `FormatKey`, `ServiceKey`, `bookingUrl()`, `hasFreeSlots()`, `schedule.ts`
- **Оболочка админки** (3): `BookingPage()`, `BookingPage.tsx`
- **Шаблоны и медиа** (3): `bookingUrl()`, `schedule.ts`

## Типичные задачи этого раздела

- расписание и исключения
- страница /book
- уведомления о встрече
- Google Meet и календарь

Если задача задевает несколько разделов, вести её по одному разделу за сессию: сначала тот, от которого зависят остальные (см. «Кто зависит от раздела»).

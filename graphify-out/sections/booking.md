# Запись на встречу

Расписание и слоты, заявки на встречу, подтверждение кнопками, уведомления и .ics, напоминания, страница /book, раздел «Запись» в админке.

Граф раздела: `graphify-out/sections/booking/graph.json` (137 узлов, 372 внутренних связей).

## С чего начать сессию

1. Прочитать этот файл (и только его, не весь проект).
2. Найти нужное место в графе раздела: `graphify explain "<имя>" --graph graphify-out/sections/booking/graph.json` или путь между узлами: `graphify path "A" "B" --graph graphify-out/sections/booking/graph.json`.
3. Открывать только файлы и строки, которые показал граф.
4. Проверка: `npx tsx --test server/booking/*.test.ts`.

## Файлы

- `server/booking/schedule.ts` — 44 узл.
- `server/booking/service.ts` — 31 узл.
- `src/admin/pages/BookingPage.tsx` — 12 узл.
- `src/book/BookPage.tsx` — 8 узл.
- `server/booking/booking.test.ts` — 7 узл.
- `server/booking/notify.ts` — 7 узл.
- `src/booking/MonthGrid.tsx` — 6 узл.
- `server/booking/types.ts` — 5 узл.
- `src/data/serviceOptions.ts` — 4 узл.
- `server/booking/ics.ts` — 4 узл.
- `api/booking.ts` — 3 узл.
- `api/booking-admin.ts` — 3 узл.
- `src/data/bookingGoals.ts` — 2 узл.
- `src/book/main.tsx` — 1 узл.

## Главные узлы (больше всего связей)

- `createBooking()` (server/booking/service.ts:L98)
- `ScheduleTab()` (src/admin/pages/BookingPage.tsx:L146)
- `dayInfo` (server/booking/schedule.ts:L114)
- `BookingRow` (server/booking/types.ts:L4)
- `notifyClientDecision()` (server/booking/notify.ts:L48)
- `normalizeSchedule()` (server/booking/schedule.ts:L72)
- `bookingUrl()` (server/booking/schedule.ts:L179)
- `addDays()` (server/booking/schedule.ts:L44)
- `handler()` (api/booking.ts:L15)
- `decideBooking()` (server/booking/service.ts:L174)
- `handler()` (api/booking-admin.ts:L10)
- `whenLabel()` (server/booking/schedule.ts:L171)

## От чего зависит (вызовы в другие разделы)

- **Данные и инфраструктура** (66): `.countRecentBookings()`, `.enqueueJob()`, `.findClient()`, `.findClientById()`, `.getBooking()`, `.getSetting()`
- **Оболочка админки** (17): `Icon()`, `Icon.tsx`, `Seg()`, `Seg.tsx`, `admin/types.ts`, `api.ts`
- **Заявки и клиенты** (11): `ContactLinks()`, `ContactLinks.tsx`, `clickablePhone()`, `normalizePhone()`, `normalizeTelegram()`, `parse.ts`
- **Сайт st96.by** (8): `POLICY_PATH`, `PhoneField()`, `PhoneField.tsx`, `privacy.ts`
- **Бот и диалоги** (2): `bot.ts`, `createBot()`

## Кто зависит от раздела (менять осторожно)

- **Данные и инфраструктура** (15): `BookingInsert`, `BookingRow`, `booking/types.ts`, `notify.ts`, `tickBookingReminders()`
- **Бот и диалоги** (13): `bookingUrl()`, `createBooking()`, `decideBooking()`, `loadDirectAdmins()`, `notify.ts`, `notifyClientDecision()`
- **Воронки** (10): `FORMAT_KEYS`, `FormatKey`, `ServiceKey`, `bookingUrl()`, `hasFreeSlots()`, `schedule.ts`
- **Шаблоны и медиа** (3): `bookingUrl()`, `schedule.ts`
- **Оболочка админки** (3): `BookingPage()`, `BookingPage.tsx`

## Типичные задачи этого раздела

- расписание и исключения
- страница /book
- уведомления о встрече
- Google Meet и календарь

Если задача задевает несколько разделов, вести её по одному разделу за сессию: сначала тот, от которого зависят остальные (см. «Кто зависит от раздела»).

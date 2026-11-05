# Evidence
## Структура
- 1644 строк в 11 файлах + CSS: pages/ClientPage.tsx 217, builder/Editor.tsx 201, TemplatesPage.tsx 164.
- 59 инлайн-стилей `style={{` в src/admin (grep): ClientPage.tsx, builder/Editor.tsx и др.
- Три похожих выбора шаблона: `TemplatePicker` (builder/Editor.tsx:~12), `SendTemplate` (pages/ClientPage.tsx:~9), список в TemplatesPage.tsx.
- Две копии стилей модалки/сегмента: builder/builder.css (`.fb .ov`, `.fb .seg`) и pages/templates.css (`.tpl .ov`, `.tpl .seg`).
## Визуал
- Шкала шрифтов: 10, 11, 11.5, 12, 12.5, 13, 14, 15, 16, 18, 20 px (11 значений, admin.css + builder.css + templates.css).
- Захардкоженные цвета вне токенов: #fff, #aab1c0, rgba(10,12,18,.55), rgba(0,0,0,.12/.25/.35/.4).
- Контраст (расчёт): --mute на --bg светлой темы 4.47 (<4.5), белый на --blue тёмной темы 3.07, --amber на белом 2.62, фокус-кольцо (admin.css:23, --blue-soft на белом) 1.14.
- `:focus-visible` в src/admin: 0 совпадений. `prefers-reduced-motion`: 0 (анимаций тоже нет).
- Состояния: загрузка («Загрузка…»), пусто, ошибка есть на всех 7 страницах; успех — по-разному (текст «Сохранено», сообщение, закрытие окна). Модальные окна без role="dialog", Escape и фокус-ловушки (TemplatesPage.tsx Editor).
## Тексты
- pages/FunnelsPage.tsx:29: «Визуальный конструктор появится в следующем обновлении, пока схема правится как JSON» — конструктор уже выложен (коммит 2539041). Ложное утверждение.
- Вкладка «JSON» и «handoff»-терминология видны сотруднику; навигация: эмодзи вместо иконок (AdminApp.tsx).
## Вес
- Админка: admin-*.js 479 805 Б + общий jsx-runtime 260 322 Б ≈ 740 КБ сырого JS (React Flow внутри), CSS 34 КБ. Тёмная тема поддержана. Анимаций на простое нет.
## Бренд (сверка админки с сайтом)
- Сайт: Unbounded + Inter, тёмная палитра ink/paper, акцент acid #d8ff3f (src/index.css:4-18).
- Админка: только Inter/system, нейтральный серо-синий (--blue #2f5bff, --bg #f5f6f8, admin.css:2-5); acid, paper и Unbounded не используются вообще. Админка не узнаётся как часть ST96.

# ST96 — сайт креативной студии

Мультистраничный сайт на React + TypeScript + Vite, построенный по методологии AIDA: каждая страница
ведёт посетителя от оффера в первом экране к заявке в секции лидогенерации.

## Стек

- Vite + React 19 + TypeScript
- Tailwind CSS v4 (токены темы — в `site/src/index.css`)
- Framer Motion — анимации, переходы между страницами, интерактивные элементы
- React Router — навигация между главной и страницами услуг

## Структура

Раскладка папок и правила размещения файлов — `docs/STRUCTURE.md`; визуальные гиды —
`site/VISUAL-GUIDE.md`, `crm/VISUAL-GUIDE.md`, общая основа — `docs/VISUAL-GUIDE.md`.

- `site/` — сайт `st96.by` (`index.html`, `src/`, `public/`)
- `crm/` — админка `/admin`, запись `/book`, сервер (бот, заявки, воронки, рассылки, агент), `crm/supabase/` миграции
- `shared/` — общее для сайта и CRM: `data/services.ts` (услуги и акцентные цвета), `data/`, `ui/`
- `api/` — функции Vercel, `brand/` — бренд и печать, `docs/` — платформа, база, аудит

- `shared/data/services.ts` — контент и акцентные цвета каждой услуги (продюсирование, промоушн,
  продакшн, AI-разработка)
- `site/src/data/home.ts` — контент главной страницы
- `site/src/components/sections/*` — блоки страниц (герой, преимущества, табы процесса, результаты,
  захват лида)
- `site/src/pages/Home.tsx` — главная страница
- `site/src/pages/ServicePage.tsx` — общий шаблон страницы услуги, наполняется данными по slug из URL

## Запуск

```bash
npm install
npm run dev
```

Откройте `http://localhost:5173`.

## Сборка

```bash
npm run build
```

## Заявки с сайта

Форма заявки (`site/src/components/sections/LeadCapture.tsx`) отправляет данные на серверную функцию
`api/lead.ts`: заявка и клиент пишутся в Supabase (платформа CRM), а в Telegram-группу «Лиды ST96»
уходит уведомление бота `@st96_leads_bot`. Секреты (`TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`,
`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`) задаются в переменных окружения Vercel
(**Settings → Environment Variables**), после изменения нужен redeploy.

Архитектура, статус и подробности платформы — `docs/PLATFORM.md`; таблицы базы — `docs/DATABASE.md`.

Контакты (email, телефон, Telegram) заданы в `site/src/components/layout/Footer.tsx` в объекте
`CONTACTS` — там же их удобно поменять при необходимости.

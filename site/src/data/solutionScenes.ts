// Minimal typographic scenes for the AI-solution cards: 3 beats (what / where / benefit),
// one big word + one short caption per beat, one quiet geometric motif behind.

export type Motif = 'bubble' | 'squares' | 'steps' | 'frame' | 'cards' | 'phone' | 'layers' | 'bars' | 'shield'

type Beat = { word: string; cap: string }
type Beats = [Beat, Beat, Beat]

export type SolutionScene = {
  motif: Motif
  ru: Beats
  en: Beats
}

export const solutionScenes: Record<string, SolutionScene> = {
  'ai-assistants': {
    motif: 'bubble',
    ru: [
      { word: 'Помощник', cap: 'Почта, календарь и задачи — в одном чате' },
      { word: 'Руководителям', cap: 'Встречи, письма и отчёты всегда под рукой' },
      { word: 'Время', cap: 'Часы в неделю — на главные задачи' },
    ],
    en: [
      { word: 'Assistant', cap: 'Email, calendar and tasks in one chat' },
      { word: 'For leaders', cap: 'Meetings, emails and reports at hand' },
      { word: 'Time', cap: 'Hours every week for what matters' },
    ],
  },
  'custom-solutions': {
    motif: 'squares',
    ru: [
      { word: 'Под вас', cap: 'Решение под ваш процесс и ваши данные' },
      { word: 'Ваши системы', cap: 'Встраиваем в то, что уже работает' },
      { word: 'Точно', cap: 'Без лишних функций — только нужное' },
    ],
    en: [
      { word: 'Made for you', cap: 'A solution for your process and your data' },
      { word: 'Your systems', cap: 'Built into what already works' },
      { word: 'Exactly', cap: 'No extras — only what you need' },
    ],
  },
  automation: {
    motif: 'steps',
    ru: [
      { word: 'Автопилот', cap: 'ИИ берёт на себя повторяющиеся операции' },
      { word: 'Документы', cap: 'Разбор, ввод данных, маршрутизация' },
      { word: 'Без ошибок', cap: 'Быстрее процессы, ниже издержки' },
    ],
    en: [
      { word: 'Autopilot', cap: 'AI takes over repetitive operations' },
      { word: 'Documents', cap: 'Parsing, data entry, routing' },
      { word: 'Fewer errors', cap: 'Faster processes, lower costs' },
    ],
  },
  'ai-websites': {
    motif: 'frame',
    ru: [
      { word: 'Сайт', cap: 'Сам консультирует и подбирает решение' },
      { word: 'Заявки', cap: 'Квалифицирует обращения круглосуточно' },
      { word: 'Больше', cap: 'Обращений без роста команды' },
    ],
    en: [
      { word: 'Website', cap: 'Consults and suggests a solution on its own' },
      { word: 'Leads', cap: 'Qualifies inquiries around the clock' },
      { word: 'More', cap: 'Inquiries without growing the team' },
    ],
  },
  'ai-shops': {
    motif: 'cards',
    ru: [
      { word: 'Подбор', cap: 'Умные рекомендации товаров' },
      { word: 'Поиск', cap: 'По смыслу, а не по ключевым словам' },
      { word: 'Выручка', cap: 'Выше конверсия и средний чек' },
    ],
    en: [
      { word: 'Picks', cap: 'Smart product recommendations' },
      { word: 'Search', cap: 'By meaning, not by keywords' },
      { word: 'Revenue', cap: 'Higher conversion and order value' },
    ],
  },
  'telegram-mini-app': {
    motif: 'phone',
    ru: [
      { word: 'В Telegram', cap: 'Приложение прямо в мессенджере' },
      { word: 'Всё сразу', cap: 'Каталог, запись, оплата и чат' },
      { word: 'Одно касание', cap: 'Без установки — клиент уже там' },
    ],
    en: [
      { word: 'In Telegram', cap: 'An app right inside the messenger' },
      { word: 'All in one', cap: 'Catalog, booking, payment and chat' },
      { word: 'One tap', cap: 'No install — customers are already there' },
    ],
  },
  'web-apps': {
    motif: 'frame',
    ru: [
      { word: 'Web-app', cap: 'Кабинеты, CRM и внутренние сервисы' },
      { word: 'Любой экран', cap: 'Работает в браузере на любом устройстве' },
      { word: 'Ваш процесс', cap: 'Под ваши задачи, а не шаблон' },
    ],
    en: [
      { word: 'Web app', cap: 'Portals, CRMs and internal services' },
      { word: 'Any screen', cap: 'Runs in the browser on any device' },
      { word: 'Your process', cap: 'Built for your tasks, not a template' },
    ],
  },
  saas: {
    motif: 'layers',
    ru: [
      { word: 'SaaS', cap: 'Ваш сервис по подписке с нуля' },
      { word: 'Тарифы', cap: 'Мультиарендность, оплата, аналитика' },
      { word: 'Масштаб', cap: 'Повторяющаяся выручка без роста затрат' },
    ],
    en: [
      { word: 'SaaS', cap: 'Your subscription service from scratch' },
      { word: 'Plans', cap: 'Multi-tenancy, billing, analytics' },
      { word: 'Scale', cap: 'Recurring revenue without cost growth' },
    ],
  },
  plugins: {
    motif: 'squares',
    ru: [
      { word: 'Плагин', cap: 'ИИ внутри программ, где вы работаете' },
      { word: 'Open-source', cap: 'Расширения и утилиты для команд' },
      { word: 'Без смены', cap: 'Привычные инструменты, тот же процесс' },
    ],
    en: [
      { word: 'Plugin', cap: 'AI inside the tools you already use' },
      { word: 'Open source', cap: 'Extensions and utilities for teams' },
      { word: 'No switch', cap: 'Familiar tools, same process' },
    ],
  },
  dashboards: {
    motif: 'bars',
    ru: [
      { word: 'Данные', cap: 'Живая аналитика на одном экране' },
      { word: 'Инсайты', cap: 'ИИ объясняет цифры и находит аномалии' },
      { word: 'Решения', cap: 'По данным, а не по ощущениям' },
    ],
    en: [
      { word: 'Data', cap: 'Live analytics on a single screen' },
      { word: 'Insights', cap: 'AI explains numbers and spots anomalies' },
      { word: 'Decisions', cap: 'From data, not from gut feeling' },
    ],
  },
  'ai-servers': {
    motif: 'shield',
    ru: [
      { word: 'Сервер', cap: 'Инфраструктура под ваши модели' },
      { word: 'Приватно', cap: 'Локальные модели, API и интеграции' },
      { word: 'Контроль', cap: 'Данные у вас, затраты предсказуемы' },
    ],
    en: [
      { word: 'Servers', cap: 'Infrastructure for your models' },
      { word: 'Private', cap: 'Local models, APIs and integrations' },
      { word: 'Control', cap: 'Your data stays yours, costs stay predictable' },
    ],
  },
}

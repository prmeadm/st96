export type AiServiceItem = {
  slug: string
  title: { ru: string; en: string }
  text: { ru: string; en: string }
}

export const aiServiceItems: AiServiceItem[] = [
  {
    slug: "ai-agents",
    title: { ru: "AI-агенты для бизнеса", en: "AI agents for business" },
    text: {
      ru: "Цифровой сотрудник: сам ведёт диалог, принимает решения и выполняет задачи в ваших системах.",
      en: "A digital employee that holds conversations, makes decisions and performs tasks inside your systems.",
    },
  },
  {
    slug: "ai-assistants",
    title: { ru: "Личные AI-ассистенты", en: "Personal AI assistants" },
    text: {
      ru: "Персональный помощник: почта, календарь, задачи и поиск информации — в одном чате.",
      en: "A personal helper: email, calendar, tasks and information search in a single chat.",
    },
  },
  {
    slug: "custom-solutions",
    title: { ru: "Индивидуальные AI-решения", en: "Custom AI solutions" },
    text: {
      ru: "Решение под ваш процесс и ваши данные: не коробка, а система, собранная под задачу.",
      en: "A solution built around your process and your data: not a boxed product but a system made for the task.",
    },
  },
  {
    slug: "automation",
    title: { ru: "Автоматизация процессов с AI", en: "Process automation with AI" },
    text: {
      ru: "ИИ берёт на себя повторяющиеся операции: разбор документов, ввод данных, маршрутизацию.",
      en: "AI takes over repetitive operations: document parsing, data entry, routing.",
    },
  },
  {
    slug: "ai-websites",
    title: { ru: "Сайты с AI", en: "Websites with AI" },
    text: {
      ru: "Сайт, который сам консультирует посетителей, подбирает решение и собирает заявки.",
      en: "A website that consults visitors on its own, suggests a solution and collects leads.",
    },
  },
  {
    slug: "ai-shops",
    title: { ru: "Интернет-магазины с AI", en: "Online stores with AI" },
    text: {
      ru: "Магазин с умным подбором товаров, поиском по смыслу и помощником покупателя.",
      en: "A store with smart product picks, search by meaning and a shopping assistant.",
    },
  },
  {
    slug: "telegram-mini-app",
    title: { ru: "Mini-app для Telegram", en: "Telegram mini-apps" },
    text: {
      ru: "Приложение прямо внутри Telegram: каталог, запись, оплата и чат — без установки.",
      en: "An app right inside Telegram: catalog, booking, payment and chat — no installation.",
    },
  },
  {
    slug: "web-apps",
    title: { ru: "Web-приложения", en: "Web applications" },
    text: {
      ru: "Полноценные веб-приложения под ваши процессы: кабинеты, CRM, внутренние сервисы.",
      en: "Full-featured web apps for your processes: portals, CRMs, internal services.",
    },
  },
  {
    slug: "saas",
    title: { ru: "Разработка SaaS", en: "SaaS development" },
    text: {
      ru: "Ваш сервис по подписке: мультиарендность, тарифы, оплата и аналитика — с нуля.",
      en: "Your subscription service: multi-tenancy, plans, billing and analytics — built from scratch.",
    },
  },
  {
    slug: "plugins",
    title: { ru: "Плагины и утилиты на базе AI", en: "AI-powered plugins and tools" },
    text: {
      ru: "Расширения для open-source и других программ: добавляют ИИ туда, где вы уже работаете.",
      en: "Extensions for open-source and other software: they bring AI to where you already work.",
    },
  },
  {
    slug: "dashboards",
    title: { ru: "AI-дашборды", en: "AI dashboards" },
    text: {
      ru: "Живая аналитика, где ИИ объясняет цифры, находит аномалии и подсказывает действия.",
      en: "Live analytics where AI explains the numbers, spots anomalies and suggests actions.",
    },
  },
  {
    slug: "ai-servers",
    title: { ru: "Серверное окружение для AI", en: "Server environment for AI" },
    text: {
      ru: "Инфраструктура под модели: развёртывание, API, безопасность и контроль затрат.",
      en: "Infrastructure for models: deployment, API, security and cost control.",
    },
  },
]

export const aiServicesIntro = {
  ru: {
    emoji: '🧑‍💻➕🤖',
    kicker: 'Вторая сильная компетенция',
    title: 'Разработка бизнес-решений на базе AI',
    lead: 'AI только усиливает и ускоряет реальные навыки, накопленную годами экспертизу и опыт. Без этого — это просто умный бот.',
    sub: 'С нами в вашем распоряжении 10 лет опыта, высокая квалификация и экспертиза, которые могут превратиться в ваши:',
    cta: 'Обсудить проект',
  },
  en: {
    emoji: '🧑‍💻➕🤖',
    kicker: 'Our second core competence',
    title: 'Business solutions built on AI',
    lead: 'AI only amplifies and speeds up real skills — expertise and experience built over the years. Without them, it is just a clever bot.',
    sub: 'With us you get 10 years of experience, high qualification and expertise that can turn into your own:',
    cta: 'Discuss a project',
  },
} as const

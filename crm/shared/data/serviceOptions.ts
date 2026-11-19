// Конкретные направления внутри услуги для страницы записи (множественный выбор). Ключ услуги = slug на сайте.
// В заявке сохраняются русские названия, английские нужны только для английской страницы.
export type ServiceOption = { ru: string; en: string }

export const SERVICE_OPTIONS: Record<string, ServiceOption[]> = {
  producing: [
    { ru: 'Маркетинговая стратегия', en: 'Marketing strategy' },
    { ru: 'Визуальная концепция', en: 'Visual concept' },
    { ru: 'Бренд-бук', en: 'Brand book' },
    { ru: 'Бизнес-проект', en: 'Business project' },
    { ru: 'Медиапроект', en: 'Media project' },
    { ru: 'Клиентский сервис', en: 'Customer service' },
    { ru: 'Воронки продаж', en: 'Sales funnels' },
  ],
  ai: [
    { ru: 'AI-агент для бизнеса', en: 'AI agent for business' },
    { ru: 'Личный AI-агент', en: 'Personal AI agent' },
    { ru: 'Индивидуальное решение для бизнеса', en: 'Custom business solution' },
    { ru: 'Автоматизация процесса с внедрением AI', en: 'Process automation with AI' },
    { ru: 'Сайт с AI', en: 'Website with AI' },
    { ru: 'Интернет-магазин с AI', en: 'Online store with AI' },
    { ru: 'Разработка mini-app', en: 'Mini-app development' },
    { ru: 'Разработка app', en: 'App development' },
    { ru: 'Разработка SaaS', en: 'SaaS development' },
    { ru: 'Разработка плагинов и утилит на базе AI', en: 'AI-based plugins and utilities' },
    { ru: 'Разработка AI-дашбордов', en: 'AI dashboards' },
    { ru: 'Разработка серверного окружения для работы с AI', en: 'Server environment for AI workloads' },
  ],
  production: [
    { ru: 'Рекламное видео на базе AI', en: 'AI-based commercial video' },
    { ru: 'Серия Reels в одной концепции', en: 'A series of Reels in one concept' },
    { ru: 'Серия сторис в одной концепции', en: 'A series of Stories in one concept' },
    { ru: 'Гибридный монтаж', en: 'Hybrid editing' },
    { ru: 'Нейрофотосессия', en: 'AI photoshoot' },
  ],
  promotion: [
    { ru: 'Концепция монетизации', en: 'Monetization concept' },
    { ru: 'Лидген', en: 'Lead generation' },
    { ru: 'Посев', en: 'Seeding' },
    { ru: 'Продакт-плейсмент', en: 'Product placement' },
    { ru: 'Таргет', en: 'Targeted ads' },
    { ru: 'Промо', en: 'Promo' },
    { ru: 'Арбитраж', en: 'Traffic arbitrage' },
  ],
}

/** Оставляет только допустимые для услуги пункты (русские названия), без повторов */
export const cleanTopics = (service: string, raw: unknown): string[] => {
  const allowed = new Set((SERVICE_OPTIONS[service] ?? []).map((o) => o.ru))
  return [...new Set(Array.isArray(raw) ? raw.filter((x): x is string => typeof x === 'string' && allowed.has(x)) : [])]
}

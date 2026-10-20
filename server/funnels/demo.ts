import { TRIGGER, type Graph } from './types'

/** Демо-воронка из прототипа «Запись на консультацию». Загружается в админке как черновик. */
export const demoGraph: Graph = {
  nodes: [
    { id: 'start', type: 'start', data: { triggers: [TRIGGER.start, TRIGGER.site], keyword: '', once: false } },
    {
      id: 'm1', type: 'message',
      data: {
        parts: [{ id: 'p1', kind: 'text', text: 'Здравствуйте, {имя}! Это студия ST96. Чем могу помочь?', en: 'Hello, {имя}! This is the ST96 studio. How can we help?' }],
        quick: [
          { id: 'q1', label: 'Услуги и цены', en: 'Services and prices' },
          { id: 'q2', label: 'Записаться на встречу', en: 'Book a meeting' },
          { id: 'q3', label: 'Задать вопрос', en: 'Ask a question' },
          { id: 'q4', label: 'Связаться с админом', en: 'Talk to a human' },
        ],
        links: [],
      },
    },
    {
      id: 'm2', type: 'message',
      data: {
        parts: [{ id: 'p1', kind: 'text', text: 'Наши услуги: ретушь, нейрофотосессия, съёмка, цветокоррекция, цифровой офис и продакшн.', en: 'Our services: retouching, AI photoshoot, shooting, color grading, digital office and production.' }],
        quick: [], links: [{ id: 'l1', label: 'Открыть st96.by', url: 'https://st96.by' }],
      },
    },
    { id: 'b1', type: 'booking', data: { services: ['Ретушь', 'Нейрофотосессия', 'Съёмка'], formats: ['Телефонный звонок', 'Видеозвонок', 'Офлайн встреча'], meet: true } },
    { id: 'a3', type: 'action', data: { items: [{ id: 'x3', kind: 'addtag', value: 'записан на встречу' }] } },
    { id: 'a2', type: 'action', data: { items: [{ id: 'x1', kind: 'addtag', value: 'задал вопрос' }, { id: 'x2', kind: 'notify', value: 'Клиент {имя} задал вопрос в боте' }] } },
    { id: 'm5', type: 'message', data: { parts: [{ id: 'p1', kind: 'text', text: 'Напишите ваш вопрос одним сообщением, администратор ответит здесь.', en: 'Write your question in one message, our administrator will reply here.' }], quick: [], links: [] } },
    { id: 'h1', type: 'handoff', data: { message: 'Передаю ваш вопрос администратору, он ответит в ближайшее время.', notify: true } },
  ],
  edges: [
    { source: 'start', sourceHandle: 'out', target: 'm1' },
    { source: 'm1', sourceHandle: 'qr-q1', target: 'm2' },
    { source: 'm1', sourceHandle: 'qr-q2', target: 'b1' },
    { source: 'm1', sourceHandle: 'qr-q3', target: 'a2' },
    { source: 'm1', sourceHandle: 'qr-q4', target: 'h1' },
    { source: 'm2', sourceHandle: 'out', target: 'b1' },
    { source: 'a2', sourceHandle: 'out', target: 'm5' },
    { source: 'b1', sourceHandle: 'confirmed', target: 'a3' },
    { source: 'b1', sourceHandle: 'declined', target: 'h1' },
  ],
}

/** Новая воронка: запуск по /start и одно приветствие. Остальное добавляется в конструкторе. */
export const blankGraph: Graph = {
  nodes: [
    { id: 'start', type: 'start', data: { triggers: [TRIGGER.start], keyword: '', once: false } },
    { id: 'm1', type: 'message', data: { parts: [{ id: 'p1', kind: 'text', text: 'Здравствуйте, {имя}!', en: 'Hello, {имя}!' }], quick: [], links: [] } },
  ],
  edges: [{ source: 'start', target: 'm1' }],
}

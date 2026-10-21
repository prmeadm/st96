export type Lang = 'ru' | 'en'

export const T = {
  ru: {
    welcome: 'Здравствуйте! Это студия ST96. Напишите, что вас интересует: передадим администратору, он ответит здесь.',
    agreed: 'Спасибо! Если захотите отписаться, отправьте /stop.',
    declined: 'Хорошо, без рассылок. Администратор всё равно ответит на ваши сообщения.',
    stopped: 'Вы отписались от рассылок. Вернуть подписку можно командой /start.',
    ack: 'Спасибо! Передали администратору, он ответит здесь в ближайшее время.',
  },
  en: {
    welcome: "Hello! This is the ST96 studio. Tell us what you're interested in: we'll pass it to the administrator, who will reply here.",
    agreed: 'Thank you! To unsubscribe at any time, send /stop.',
    declined: 'Okay, no mailings. The administrator will still reply to your messages.',
    stopped: 'You have unsubscribed from mailings. Send /start to subscribe again.',
    ack: "Thank you! We've passed this to the administrator, who will reply here soon.",
  },
} as const

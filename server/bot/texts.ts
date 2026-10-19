export type Lang = 'ru' | 'en'

export const T = {
  ru: {
    welcome:
      'Здравствуйте! Это студия ST96. Напишите, что вас интересует: передадим администратору, он ответит здесь.\n\n' +
      'Иногда мы можем присылать полезные материалы и предложения. Для этого нужно ваше согласие. ' +
      'Отписаться можно в любой момент командой /stop. Политика конфиденциальности: https://st96.by/privacy',
    consentAsk: 'Иногда мы можем присылать полезные материалы и предложения. Для этого нужно ваше согласие, отписаться можно командой /stop. Политика конфиденциальности: https://st96.by/privacy',
    agree: 'Согласен получать рассылку',
    decline: 'Не сейчас',
    agreed: 'Спасибо! Если захотите отписаться, отправьте /stop.',
    declined: 'Хорошо, без рассылок. Администратор всё равно ответит на ваши сообщения.',
    stopped: 'Вы отписались от рассылок. Вернуть подписку можно командой /start.',
    ack: 'Спасибо! Передали администратору, он ответит здесь в ближайшее время.',
  },
  en: {
    welcome:
      "Hello! This is the ST96 studio. Tell us what you're interested in: we'll pass it to the administrator, who will reply here.\n\n" +
      'From time to time we may send useful materials and offers. That needs your consent, and you can opt out at any time with /stop. ' +
      'Privacy policy: https://st96.by/en/privacy',
    consentAsk: 'From time to time we may send useful materials and offers. That needs your consent, and you can opt out with /stop. Privacy policy: https://st96.by/en/privacy',
    agree: 'I agree to receive updates',
    decline: 'Not now',
    agreed: 'Thank you! To unsubscribe at any time, send /stop.',
    declined: 'Okay, no mailings. The administrator will still reply to your messages.',
    stopped: 'You have unsubscribed from mailings. Send /start to subscribe again.',
    ack: "Thank you! We've passed this to the administrator, who will reply here soon.",
  },
} as const

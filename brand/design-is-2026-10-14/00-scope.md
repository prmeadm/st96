# Scope — ST96 business cards

- **Audited:** односторонние визитки 90×50 мм (+2 мм вылет), 2 сотрудника.
  - Источник: `print/business-cards/cards.src.html`, `print/business-cards/build.mjs`
  - Результат: `ST96_card_Dmitriy_90x50_bleed2mm.pdf`, `ST96_card_Karina_90x50_bleed2mm.pdf`, `preview.png`
- **Primary user:** получатель визитки (клиент/партнёр после встречи).
- **Primary task:** опознать человека и студию → связаться (телефон, Telegram, почта, сайт).
- **Constraints:** брендбук ST96 (тёмный фон, acid #d8ff3f, violet, Unbounded + Inter, «аврора»); офсет/цифра; рез ±0,5–1 мм.
- **References:** листовка A6 `print/flyer-a6/` (тот же бренд и пайплайн).
- **Adaptation note:** веб-метрики skill'а (JS bytes, focus, loading states) переведены на печатные эквиваленты: вес PDF, растр/вектор, цветовое пространство, вылет/безопасная зона, расход краски.

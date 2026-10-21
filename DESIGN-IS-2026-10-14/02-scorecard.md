# Scorecard — total 20/30

1. Good design is innovative — Score: 1/3
   Evidence: классическая раскладка лого↑ / имя / контакты↓ (`build.mjs:22-32`).
   Justification: аккуратная, но типовая тёмная визитка; улучшения шаблона не вносит, поэтому не 2.
2. Good design makes a product useful — Score: 3/3
   Evidence: все 4 канала связи, 7.4pt, контраст ≥8.2:1.
   Justification: задача «связаться» решается сразу, лишних элементов на пути нет.
3. Good design is aesthetic — Score: 2/3
   Evidence: 7pt vs 7.4pt почти-дубль; базовые линии лого и роли не совпадают (`cards.src.html:62-63,69`).
   Justification: система видна, но 2 мелкие несостыковки — не 3.
4. Good design makes a product understandable — Score: 3/3
   Evidence: телефон/почта/сайт самоочевидны, Telegram подписан.
   Justification: каждый элемент опознаётся без подсказки; смешение языков не мешает пониманию.
5. Good design is unobtrusive — Score: 2/3
   Evidence: два glow в правой половине (`build.mjs:11-15`).
   Justification: декор тихий, но заметный — «chrome visible but quiet».
6. Good design is honest — Score: 3/3
   Evidence: ни одного преувеличения в строках; общие контакты не выдаются за личные.
   Justification: всё, что написано, соответствует действительности.
7. Good design is long-lasting — Score: 1/3
   Evidence: «аврора»-glow и acid→violet градиент — два трендовых маркера 2020-х.
   Justification: 2 маркера = 1 по шкале; они брендовые, но всё равно датируют макет.
8. Good design is thorough down to the last detail — Score: 1/3
   Evidence: растр glow ≈40–70 dpi и линии ≈72 dpi; только DeviceRGB; ложный комментарий о векторе (`cards.src.html:56`).
   Justification: два производственных «состояния» не проработаны (разрешение, цвет) — 1, не 2.
9. Good design is environmentally friendly — Score: 2/3
   Evidence: 77 КБ, односторонняя, но 100% заливка тёмным с неконтролируемым TAC.
   Justification: расход краски максимален и не ограничен — не 3.
10. Good design is as little design as possible — Score: 2/3
   Evidence: glow ×2 убираются без потери функции; градиентная линия несёт брендовый акцент.
   Justification: ≤2 удаляемых элемента.

**Total: 20/30. Нулей нет.**

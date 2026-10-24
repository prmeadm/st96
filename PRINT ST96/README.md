# PRINT ST96

Отдельный подпроект: печатная продукция и фирменные материалы ST96. Никак не связан с сайтом и CRM: не входит в сборку, не деплоится.

- `brand/` фирменные аватары ST96 (SVG, PNG) и скрипт сборки `brand/avatar/build.mjs`. В git.
- `print/` визитки (`business-cards/`) и флаер A6 (`flyer-a6/`), PDF для печати. Не в git (тяжёлые, ~45 МБ), хранить копию на Google Диске.
- `screens-b-leasing/` скриншоты экранов стороннего проекта. Не в git (~20 МБ).

Сборка визиток: `cd "PRINT ST96/print/business-cards" && npm run build` (нужен Google Chrome).
Скрипт аватаров берёт шрифт и зависимости из `../../print/business-cards`, поэтому `brand/` и `print/` должны лежать рядом.

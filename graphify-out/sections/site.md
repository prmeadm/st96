# Сайт st96.by

Публичный сайт (RU/EN): страницы услуг, форма заявки, аналитика и согласие на cookie.

Граф раздела: `graphify-out/sections/site/graph.json` (204 узлов, 607 внутренних связей).

## С чего начать сессию

1. Прочитать этот файл (и только его, не весь проект).
2. Найти нужное место в графе раздела: `graphify explain "<имя>" --graph graphify-out/sections/site/graph.json` или путь между узлами: `graphify path "A" "B" --graph graphify-out/sections/site/graph.json`.
3. Открывать только файлы и строки, которые показал граф.
4. Проверка: `npx tsc -b && npm run build`.

## Файлы

- `site/src/components/ui/AgentScene.tsx` — 16 узл.
- `site/src/components/ui/SolutionScene.tsx` — 14 узл.
- `site/src/lib/attribution.ts` — 9 узл.
- `shared/data/services.ts` — 9 узл.
- `site/src/lib/i18n.ts` — 8 узл.
- `site/src/lib/consent.ts` — 8 узл.
- `site/src/data/home.ts` — 8 узл.
- `site/src/lib/analytics.ts` — 7 узл.
- `shared/ui/PhoneField.tsx` — 7 узл.
- `site/src/data/solutionScenes.ts` — 6 узл.
- `shared/data/privacy.ts` — 6 узл.
- `site/src/lib/theme.ts` — 5 узл.
- `site/src/components/ui/Reveal.tsx` — 5 узл.
- `site/src/hooks/useSeo.ts` — 5 узл.
- `site/src/components/sections/LeadCapture.tsx` — 4 узл.
- `site/src/data/content.ts` — 4 узл.
- `site/src/pages/Privacy.tsx` — 4 узл.
- `site/src/components/ui/MagneticButton.tsx` — 4 узл.
- `shared/data/content.en.ts` — 4 узл.
- `site/src/data/aiServices.ts` — 4 узл.
- `site/src/components/ui/Marquee.tsx` — 3 узл.
- `site/src/lib/internal.ts` — 3 узл.
- `site/src/components/ui/HeroVideo.tsx` — 3 узл.
- `site/src/components/ui/RevealText.tsx` — 3 узл.
- `site/src/components/ui/CookieBanner.tsx` — 3 узл.
- `site/src/components/sections/Results.tsx` — 3 узл.
- `site/src/components/sections/ProcessTabs.tsx` — 3 узл.
- `site/src/components/ui/SectionHeading.tsx` — 3 узл.
- `site/src/components/sections/Advantages.tsx` — 3 узл.
- `site/src/components/layout/Footer.tsx` — 3 узл.
- `site/src/components/ui/KeywordOrbit.tsx` — 3 узл.
- `site/src/components/ui/AnimatedCounter.tsx` — 3 узл.
- `site/src/App.tsx` — 2 узл.
- `site/src/components/sections/HomeHero.tsx` — 2 узл.
- `site/src/components/sections/AiServices.tsx` — 2 узл.
- `site/src/components/layout/Layout.tsx` — 2 узл.
- `site/src/components/sections/ServiceHero.tsx` — 2 узл.
- `site/src/data/ui.ts` — 2 узл.
- `site/src/components/ui/ThemeToggle.tsx` — 2 узл.
- `site/src/pages/PrivacyRoute.tsx` — 2 узл.
- `site/src/pages/Home.tsx` — 2 узл.
- `site/src/components/layout/Header.tsx` — 2 узл.
- `site/src/components/ui/CustomCursor.tsx` — 2 узл.
- `site/src/pages/ServicePage.tsx` — 2 узл.
- `site/src/pages/PrivacyEn.tsx` — 2 узл.
- `site/src/components/ui/Aurora.tsx` — 2 узл.
- `site/src/components/sections/ServicesGrid.tsx` — 2 узл.
- `site/src/main.tsx` — 1 узл.

## Главные узлы (больше всего связей)

- `useLang()` (site/src/lib/i18n.ts:L24)
- `useUi()` (site/src/lib/i18n.ts:L28)
- `LeadCapture()` (site/src/components/sections/LeadCapture.tsx:L26)
- `localePath()` (site/src/lib/i18n.ts:L19)
- `Reveal()` (site/src/components/ui/Reveal.tsx:L13)
- `PhoneField()` (shared/ui/PhoneField.tsx:L27)
- `reachGoal()` (site/src/lib/analytics.ts:L11)
- `Home()` (site/src/pages/Home.tsx:L11)
- `MagneticButton()` (site/src/components/ui/MagneticButton.tsx:L18)
- `useSeo()` (site/src/hooks/useSeo.ts:L28)
- `ServicePage()` (site/src/pages/ServicePage.tsx:L12)
- `getServices()` (site/src/data/content.ts:L14)

## Кто зависит от раздела (менять осторожно)

- **Запись на встречу** (8): `POLICY_PATH`, `PhoneField()`, `PhoneField.tsx`, `privacy.ts`
- **Заявки и клиенты** (6): `PhoneField()`, `PhoneField.tsx`
- **Данные и инфраструктура** (4): `content.en.ts`, `services`, `services.ts`, `servicesEn`
- **Оболочка админки** (2): `services`, `services.ts`

## Типичные задачи этого раздела

- тексты и страницы
- форма заявки
- аналитика

Если задача задевает несколько разделов, вести её по одному разделу за сессию: сначала тот, от которого зависят остальные (см. «Кто зависит от раздела»).

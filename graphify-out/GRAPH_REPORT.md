# Graph Report - quizzical-sanderson-e258f3  (2026-10-25)

## Corpus Check
- 202 files · ~183,378 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 20 file(s) not represented in the graph (top: .css 13, .woff2 4, (none) 2)

## Summary
- 1391 nodes · 3832 edges · 80 communities (58 shown, 22 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 137 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `6673259b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- funnels/engine.ts
- package.json
- BookingPage.tsx
- Repo
- ClientsPage.tsx
- dialog.ts
- ClientPage.tsx
- compilerOptions
- compilerOptions
- tools.ts
- repo.ts
- vite.config.ts
- parse.ts
- AgentScene.tsx
- Evidence
- ST96 — сайт креативной студии
- .oxlintrc.json
- AnalyticsPage.tsx
- useUi
- Verdict: REFINE
- tsconfig.json
- CLAUDE.md
- .claude/CLAUDE.md
- 00-scope.md
- 02-scorecard.md
- vercel.json
- App.tsx
- Editor.tsx
- manual.ts
- Reveal
- telegram.ts
- main
- Icon
- BroadcastPage.tsx
- agent/engine.ts
- content.ts
- SolutionScene.tsx
- DESIGN-IS-2026-10-20/00-scope.md
- DESIGN-IS-2026-10-20/02-scorecard.md
- DESIGN-IS-2026-10-20/03-verdict.md
- i18n.ts
- leads/ingest.ts
- LeadCapture.tsx
- react
- 0001_core.sql
- notify.ts
- Evidence
- План: редизайн визуального слоя админки ST96 в брендовом стиле сайта
- ST96 «нейросотрудник»: состояние проекта
- Передача проекта ST96 в новую сессию
- server/catalog.ts
- 0005_broadcasts.sql
- QuickNav.tsx
- service.ts
- BookPage.tsx
- 0004_templates.sql
- 0006_agent.sql
- clients_admin_topic_key
- 0013_filter_presets.sql
- leads_interests_idx
- 0007_settings.sql
- 0011_tg_links.sql
- geo.ts
- dependencies
- devDependencies
- realFunnel.test.ts
- 0010_analytics.sql
- public.bookings
- lead.ts
- PhoneField.tsx
- supabase.ts
- booking.test.ts
- scripts

## God Nodes (most connected - your core abstractions)
1. `Repo` - 83 edges
2. `react` - 57 edges
3. `Icon()` - 50 edges
4. `createBot()` - 33 edges
5. `supabaseRepo()` - 29 edges
6. `useLang()` - 27 edges
7. `useUi()` - 26 edges
8. `advance()` - 25 edges
9. `grammy` - 25 edges
10. `json()` - 24 edges

## Surprising Connections (you probably didn't know these)
- `Как это работает` --references--> `parseLead()`  [INFERRED]
  docs/PLATFORM.md → crm/server/leads/parse.ts
- `Стек и адреса` --references--> `main()`  [INFERRED]
  docs/PLATFORM.md → scripts/graph-sections.py
- `Правила владельца` --references--> `main()`  [INFERRED]
  HANDOFF.md → scripts/graph-sections.py
- `Статус` --references--> `TallText()`  [INFERRED]
  docs/PLATFORM.md → crm/admin/builder/Editor.tsx
- `Структура` --references--> `SendTemplate()`  [INFERRED]
  DESIGN-IS-2026-10-20/01-evidence.md → crm/admin/pages/ClientPage.tsx

## Import Cycles
- None detected.

## Communities (80 total, 22 thin omitted)

### Community 0 - "funnels/engine.ts"
Cohesion: 0.07
Nodes (46): blankGraph, demoGraph, advance(), Btn, CondCtx, DOW, evalRule(), fill() (+38 more)

### Community 1 - "package.json"
Cohesion: 0.15
Nodes (12): name, private, type, version, @breezystack/lamejs, oxlint, tailwindcss, tsx (+4 more)

### Community 2 - "BookingPage.tsx"
Cohesion: 0.08
Nodes (49): active(), BookingPage(), CHIP, hhmm(), LinkTab(), ScheduleTab(), SVC_COLORS, svcColor() (+41 more)

### Community 3 - "Repo"
Cohesion: 0.06
Nodes (14): AgentTask, createBot(), ensureClient(), From, fullName(), langOf(), messageKind(), handleTopicMessage() (+6 more)

### Community 4 - "ClientsPage.tsx"
Cohesion: 0.08
Nodes (46): ClientsPage(), DEFAULTS, flatOf(), KNOWN, Row, uniq(), words(), FieldRow() (+38 more)

### Community 5 - "dialog.ts"
Cohesion: 0.12
Nodes (30): cardText(), Content, ensureTopic(), notifyTopic(), relayToAdmins(), sendContent(), sendTemplate(), threadGone() (+22 more)

### Community 6 - "ClientPage.tsx"
Cohesion: 0.13
Nodes (26): deleteClient(), esc(), Highlight(), blank, Form, fromLead(), LeadEditor(), Saved (+18 more)

### Community 7 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+11 more)

### Community 8 - "compilerOptions"
Cohesion: 0.11
Nodes (17): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, moduleResolution, noEmit (+9 more)

### Community 9 - "tools.ts"
Cohesion: 0.09
Nodes (29): emptyStats(), ExportMsg, flattenText(), IMPORT_TAG, ImportPlan, importSlice(), ImportStats, MAX_EXPORT_BYTES (+21 more)

### Community 10 - "repo.ts"
Cohesion: 0.10
Nodes (20): AgentStats, BookingInsert, AudienceClient, BROADCAST_STATUS, BroadcastRow, BroadcastStatus, canReceive(), FOOTER (+12 more)

### Community 11 - "vite.config.ts"
Cohesion: 0.18
Nodes (5): @tailwindcss/vite, vite, @vitejs/plugin-react, hasFiles(), pages

### Community 12 - "parse.ts"
Cohesion: 0.16
Nodes (15): config, handler(), json(), planImport(), detectServiceKey(), clientKey(), detectService(), FieldKey (+7 more)

### Community 13 - "AgentScene.tsx"
Cohesion: 0.10
Nodes (28): accents, AiServices(), AgentScene(), AgentSceneCard(), COPY, Dst, DST_ICON, DST_ORDER (+20 more)

### Community 14 - "Evidence"
Cohesion: 0.25
Nodes (7): Copy & honesty, Evidence, Known gaps, Print production («states»), Structural, Visual, Weight & resource

### Community 15 - "ST96 — сайт креативной студии"
Cohesion: 0.29
Nodes (6): ST96 — сайт креативной студии, Запуск, Заявки с сайта в Telegram, Сборка, Стек, Структура

### Community 16 - ".oxlintrc.json"
Cohesion: 0.33
Nodes (5): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema

### Community 17 - "AnalyticsPage.tsx"
Cohesion: 0.13
Nodes (25): AnalyticsPage(), fromDay(), LlmRow, nf, num(), Period, PERIODS, toDay() (+17 more)

### Community 18 - "useUi"
Cohesion: 0.20
Nodes (19): Advantages(), AdvantagesData, ProcessData, ProcessTabs(), Results(), ResultsData, ServicesGrid(), AnimatedCounter() (+11 more)

### Community 21 - "CLAUDE.md"
Cohesion: 0.40
Nodes (4): graphify, Platform handoff, Короткие сессии по разделам (экономия лимитов), Раскладка папок

### Community 27 - "App.tsx"
Cohesion: 0.17
Nodes (17): App(), CookieBanner(), Toggle(), CustomCursor(), trackClicks(), trackLanguageSwitch(), trackLead(), Window (+9 more)

### Community 28 - "Editor.tsx"
Cohesion: 0.07
Nodes (65): Builder(), Inner(), isMobile(), Props, Snap, ACT_TYPES, actText(), autoLayout() (+57 more)

### Community 29 - "manual.ts"
Cohesion: 0.18
Nodes (16): detectServiceInText(), serviceByLabel(), cleanInterests(), InterestKey, asParsed(), clean(), cleanFields(), createManualLead() (+8 more)

### Community 30 - "Reveal"
Cohesion: 0.24
Nodes (15): OPERATOR, POLICY_DATE_LABEL, POLICY_DATE_LABEL_EN, POLICY_PATH, POLICY_VERSION, Reveal(), SeoOptions, setAlternate() (+7 more)

### Community 31 - "telegram.ts"
Cohesion: 0.32
Nodes (7): config, handler(), json(), tracedRepo(), Структура кода, Хвосты, Известные ограничения и хвосты

### Community 32 - "main"
Cohesion: 0.29
Nodes (4): Phase 6: Проверка и закрытие, Как запустить и проверить, main(), section_of()

### Community 33 - "Icon"
Cohesion: 0.18
Nodes (22): AdminApp(), readMin(), Shell(), useNewVersion(), useAuth(), AgentPage(), LIVE, RISK_CHIP (+14 more)

### Community 34 - "BroadcastPage.tsx"
Cohesion: 0.08
Nodes (40): BroadcastPage(), Draft, fromRow(), SAMPLE, toLocalInput(), STATUS_CHIP, blank(), Draft (+32 more)

### Community 35 - "agent/engine.ts"
Cohesion: 0.05
Nodes (86): config, handler(), config, handler(), config, handler(), config, handler() (+78 more)

### Community 36 - "content.ts"
Cohesion: 0.22
Nodes (14): homeEn, servicesEn, ServiceText, Advantage, ProcessStep, Service, Stat, studioAccent (+6 more)

### Community 37 - "SolutionScene.tsx"
Cohesion: 0.15
Nodes (17): ACCENT_POS, COPY, EASE_OUT, EASE_SNAP, enter(), exit(), MOTIF_ROTATE, MOTIF_SCALE (+9 more)

### Community 42 - "i18n.ts"
Cohesion: 0.33
Nodes (13): Footer(), Header(), Layout(), LeadCapture(), MagneticButton(), getServices(), Ui, setPageLanguage() (+5 more)

### Community 43 - "leads/ingest.ts"
Cohesion: 0.20
Nodes (11): linkLeadClient(), GroupMessage, GroupResult, IngestCtx, ingestGroupMessage(), ingestLead(), originSource(), stripAt() (+3 more)

### Community 44 - "LeadCapture.tsx"
Cohesion: 0.21
Nodes (12): services, CONTACTS, Props, trustIcons, Attribution, captureAttribution(), clean(), CLICK_KEYS (+4 more)

### Community 45 - "react"
Cohesion: 0.17
Nodes (18): clsx, framer-motion, lucide-react, react, Accent, HomeHero(), ServiceHero(), Aurora() (+10 more)

### Community 46 - "0001_core.sql"
Cohesion: 0.10
Nodes (38): clients_phone_key, clients_updated, clients_username_key, funnel_runs_client_idx, funnel_runs_wake_idx, funnels_updated, jobs_due_idx, lead_notes_client_idx (+30 more)

### Community 47 - "notify.ts"
Cohesion: 0.33
Nodes (12): Requests(), adminText(), chatOf(), minutes(), notifyAdminsNewBooking(), notifyClientDecision(), tickBookingReminders(), bookingUrl() (+4 more)

### Community 48 - "Evidence"
Cohesion: 0.22
Nodes (8): TemplatePicker(), Evidence, Бренд (сверка админки с сайтом), Вес, Визуал, Структура, Тексты, Phase 2: Общие компоненты и фокус

### Community 49 - "План: редизайн визуального слоя админки ST96 в брендовом стиле сайта"
Cohesion: 0.22
Nodes (8): Phase 0: Факты (уже собраны, не перепроверять без нужды), Phase 1: Токены (один слой), Phase 3: Честные тексты и состояния, Phase 4: Миграция страниц (по одной, с визуальной проверкой), Phase 5: Вес (ленивая загрузка конструктора), Primary goal, Не входит в этот план, План: редизайн визуального слоя админки ST96 в брендовом стиле сайта

### Community 50 - "ST96 «нейросотрудник»: состояние проекта"
Cohesion: 0.25
Nodes (7): ST96 «нейросотрудник»: состояние проекта, Дальше (в порядке приоритета), Как это работает, Проверки, Секреты и доступы, Стек и адреса, Что строим

### Community 51 - "Передача проекта ST96 в новую сессию"
Cohesion: 0.25
Nodes (7): Не в репозитории (специально), Передача проекта ST96 в новую сессию, Правила владельца, Секреты (только в Vercel, в код и чат не попадают), Что готово и выложено (всё проверено на проде), Что дальше (по приоритету, по согласованию с владельцем), Что это

### Community 52 - "server/catalog.ts"
Cohesion: 0.19
Nodes (14): config, handler(), buildIcs(), esc(), utc(), FORMAT_LABEL, isDate(), minskNow() (+6 more)

### Community 53 - "0005_broadcasts.sql"
Cohesion: 0.43
Nodes (4): broadcast_recipients_pending, broadcasts_touch, public.broadcast_recipients, public.broadcasts

### Community 54 - "QuickNav.tsx"
Cohesion: 0.40
Nodes (4): ADMIN, L, SITE, SITE_EN

### Community 55 - "service.ts"
Cohesion: 0.14
Nodes (24): FORMAT_KEYS, slotAvailable(), toInstant(), toLocal(), BookingInput, byDate(), clientFor(), createBooking() (+16 more)

### Community 56 - "BookPage.tsx"
Cohesion: 0.14
Nodes (10): BookPage(), Cfg, Lang, qs, Slot, T, react-dom, BOOKING_GOALS (+2 more)

### Community 57 - "0004_templates.sql"
Cohesion: 0.83
Nodes (3): public.templates, public.touch_templates(), templates_touch

### Community 58 - "0006_agent.sql"
Cohesion: 0.83
Nodes (3): agent_tasks_status, agent_tasks_touch, public.agent_tasks

### Community 67 - "dependencies"
Cohesion: 0.17
Nodes (12): dependencies, @breezystack/lamejs, clsx, framer-motion, grammy, libphonenumber-js, lucide-react, react (+4 more)

### Community 68 - "devDependencies"
Cohesion: 0.18
Nodes (11): devDependencies, oxlint, tailwindcss, @tailwindcss/vite, tsx, @types/node, @types/react, @types/react-dom (+3 more)

### Community 71 - "realFunnel.test.ts"
Cohesion: 0.08
Nodes (14): priv, setup(), staff, START_ENT, user, seed(), Env, groupParts() (+6 more)

### Community 72 - "0010_analytics.sql"
Cohesion: 0.31
Nodes (5): llm_usage_at, public.llm_usage, public.template_events, template_events_at, template_events_tpl

### Community 74 - "public.bookings"
Cohesion: 0.43
Nodes (4): bookings_client, bookings_starts, bookings_status, public.bookings

### Community 76 - "lead.ts"
Cohesion: 0.29
Nodes (10): Attribution, clip(), config, handler(), json(), LeadPayload, sendAdEvents(), sha256() (+2 more)

### Community 77 - "PhoneField.tsx"
Cohesion: 0.27
Nodes (7): libphonenumber-js, detectCountry(), Examples, flag(), Lib, loadLib(), PhoneField()

### Community 88 - "supabase.ts"
Cohesion: 0.13
Nodes (20): callApi(), AuthCtx, AuthGate(), Ctx, Login(), State, ModelPicker(), Row() (+12 more)

### Community 90 - "booking.test.ts"
Cohesion: 0.12
Nodes (18): config, handler(), input, NOW, S, S30, DayBooking, cleanNick() (+10 more)

### Community 91 - "scripts"
Cohesion: 0.33
Nodes (6): scripts, build, dev, lint, preview, test:server

## Knowledge Gaps
- **7 isolated node(s):** `@types/node`, `@types/react`, `@types/react-dom`, `oxlint`, `tailwindcss` (+2 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 440 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **22 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `package.json`, `BookingPage.tsx`, `ClientsPage.tsx`, `ClientPage.tsx`, `AgentScene.tsx`, `AnalyticsPage.tsx`, `useUi`, `App.tsx`, `Editor.tsx`, `Reveal`, `Icon`, `BroadcastPage.tsx`, `agent/engine.ts`, `SolutionScene.tsx`, `i18n.ts`, `LeadCapture.tsx`, `QuickNav.tsx`, `BookPage.tsx`, `PhoneField.tsx`, `supabase.ts`?**
  _High betweenness centrality (0.165) - this node is a cross-community bridge._
- **Are the 10 inferred relationships involving `createBot()` (e.g. with `.claimUpdate()` and `.findActiveRun()`) actually correct?**
  _`createBot()` has 10 INFERRED edges - model-reasoned connections that need verification._
- **What connects `@types/node`, `@types/react`, `@types/react-dom` to the rest of the system?**
  _7 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `funnels/engine.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07431693989071038 - nodes in this community are weakly interconnected._
- **Why does `Repo` connect `Repo` to `funnels/engine.ts`, `BroadcastPage.tsx`, `agent/engine.ts`, `dialog.ts`, `realFunnel.test.ts`, `tools.ts`, `repo.ts`, `leads/ingest.ts`, `notify.ts`, `service.ts`, `booking.test.ts`, `manual.ts`, `telegram.ts`?**
  _High betweenness centrality (0.054) - this node is a cross-community bridge._
- **Should `BookingPage.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07686932215234102 - nodes in this community are weakly interconnected._
- **Why does `grammy` connect `agent/engine.ts` to `package.json`, `Repo`, `dialog.ts`, `realFunnel.test.ts`, `tools.ts`, `repo.ts`, `notify.ts`, `server/catalog.ts`, `booking.test.ts`, `telegram.ts`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._
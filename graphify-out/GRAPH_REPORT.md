# Graph Report - St96  (2026-10-23)

## Corpus Check
- 211 files · ~1,184,524 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 69 file(s) not represented in the graph (top: .woff2 52, .css 14, (none) 1)

## Summary
- 1463 nodes · 3898 edges · 85 communities (62 shown, 23 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 134 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `3553bc52`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- content.ts
- package.json
- CookieBanner.tsx
- dialog.ts
- service.ts
- variants-duplex/build.mjs
- AnalyticsPage.tsx
- compilerOptions
- compilerOptions
- duplex/build.mjs
- business-cards/package.json
- ref_node_fs
- parse.ts
- variants/build.mjs
- Evidence
- ST96 — сайт креативной студии
- .oxlintrc.json
- business-cards/build.mjs
- flyer-a6/build.mjs
- Verdict: REFINE
- tsconfig.json
- CLAUDE.md
- .claude/CLAUDE.md
- 00-scope.md
- 02-scorecard.md
- vercel.json
- ClientPage.tsx
- Editor.tsx
- AgentScene.tsx
- Repo
- bot.ts
- main
- Icon
- Icon.tsx
- supabaseRepo
- lead.ts
- ServicePage.tsx
- DESIGN-IS-2026-10-20/00-scope.md
- DESIGN-IS-2026-10-20/02-scorecard.md
- DESIGN-IS-2026-10-20/03-verdict.md
- TemplatesPage.tsx
- funnels/engine.ts
- server/catalog.ts
- framer-motion
- 0001_core.sql
- tools.ts
- useSeo
- react
- SolutionScene.tsx
- leads/ingest.ts
- notify.ts
- LeadCapture.tsx
- BroadcastPage.tsx
- booking.ts
- BookPage.tsx
- ThemeToggle.tsx
- Evidence
- План: редизайн визуального слоя админки ST96 в брендовом стиле сайта
- BookingPage.tsx
- filter.ts
- ST96 «нейросотрудник»: состояние проекта
- agent/types.ts
- geo.ts
- avatar/build.mjs
- agent/engine.ts
- Передача проекта ST96 в новую сессию
- engine.test.ts
- telegram.ts
- highlight.tsx
- 0010_analytics.sql
- public.bookings
- 0005_broadcasts.sql
- 0004_templates.sql
- 0006_agent.sql
- clients_admin_topic_key
- 0007_settings.sql
- 0011_tg_links.sql
- 0013_filter_presets.sql

## God Nodes (most connected - your core abstractions)
1. `Repo` - 83 edges
2. `react` - 57 edges
3. `Icon()` - 50 edges
4. `createBot()` - 33 edges
5. `supabaseRepo()` - 29 edges
6. `useLang()` - 27 edges
7. `useUi()` - 26 edges
8. `grammy` - 25 edges
9. `advance()` - 25 edges
10. `react-router-dom` - 24 edges

## Surprising Connections (you probably didn't know these)
- `Как это работает` --references--> `parseLead()`  [INFERRED]
  docs/PLATFORM.md → server/leads/parse.ts
- `Хвосты` --references--> `tracedRepo()`  [INFERRED]
  docs/PLATFORM.md → server/repo.ts
- `Известные ограничения и хвосты` --references--> `tracedRepo()`  [INFERRED]
  HANDOFF.md → server/repo.ts
- `Phase 6: Проверка и закрытие` --references--> `main()`  [INFERRED]
  DESIGN-IS-2026-10-20/05-redesign-plan.md → scripts/graph-sections.py
- `Стек и адреса` --references--> `main()`  [INFERRED]
  docs/PLATFORM.md → scripts/graph-sections.py

## Import Cycles
- None detected.

## Communities (85 total, 23 thin omitted)

### Community 0 - "content.ts"
Cohesion: 0.21
Nodes (15): homeEn, servicesEn, ServiceText, studioAccent, studioAdvantages, studioAdvantagesLead, studioProcess, studioProcessLead (+7 more)

### Community 1 - "package.json"
Cohesion: 0.04
Nodes (44): dependencies, @breezystack/lamejs, clsx, framer-motion, grammy, libphonenumber-js, lucide-react, react (+36 more)

### Community 2 - "CookieBanner.tsx"
Cohesion: 0.29
Nodes (11): CookieBanner(), Toggle(), clearAnalyticsCookies(), Consent, OPEN_EVENT, pushConsentEvent(), readConsent(), saveConsent() (+3 more)

### Community 3 - "dialog.ts"
Cohesion: 0.13
Nodes (28): cardText(), Content, ensureTopic(), notifyTopic(), sendContent(), showTemplateMenu(), threadGone(), TopicMessage (+20 more)

### Community 4 - "service.ts"
Cohesion: 0.09
Nodes (32): config, handler(), input, NOW, S, S30, BOOK_ORIGIN, DayBooking (+24 more)

### Community 5 - "variants-duplex/build.mjs"
Cohesion: 0.10
Nodes (11): finals, opentype, overview, { PDFDocument }, people, QRCode, qrSvg, require (+3 more)

### Community 6 - "AnalyticsPage.tsx"
Cohesion: 0.14
Nodes (24): costUsd(), DEFAULT_PRICES, FEATURE_LABELS, featureLabel(), parsePrices(), periodStart(), popularityScore(), Price (+16 more)

### Community 7 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+11 more)

### Community 8 - "compilerOptions"
Cohesion: 0.11
Nodes (17): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, moduleResolution, noEmit (+9 more)

### Community 9 - "duplex/build.mjs"
Cohesion: 0.12
Nodes (7): overview, people, QRCode, qrSvg, require, tpl, variants

### Community 10 - "business-cards/package.json"
Cohesion: 0.15
Nodes (12): dependencies, opentype.js, pdf-lib, qrcode, description, name, private, scripts (+4 more)

### Community 11 - "ref_node_fs"
Cohesion: 0.24
Nodes (5): [src, outDir], [src, out], css, urls, pdf-lib

### Community 12 - "parse.ts"
Cohesion: 0.20
Nodes (13): planImport(), detectServiceKey(), clientKey(), detectService(), FieldKey, LABELS, LeadOrigin, looksEmail() (+5 more)

### Community 13 - "variants/build.mjs"
Cohesion: 0.22
Nodes (4): overview, people, tpl, variants

### Community 14 - "Evidence"
Cohesion: 0.25
Nodes (7): Copy & honesty, Evidence, Known gaps, Print production («states»), Structural, Visual, Weight & resource

### Community 15 - "ST96 — сайт креативной студии"
Cohesion: 0.29
Nodes (6): ST96 — сайт креативной студии, Запуск, Заявки с сайта в Telegram, Сборка, Стек, Структура

### Community 16 - ".oxlintrc.json"
Cohesion: 0.33
Nodes (5): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema

### Community 18 - "flyer-a6/build.mjs"
Cohesion: 0.33
Nodes (3): fontCss, QRCode, require

### Community 21 - "CLAUDE.md"
Cohesion: 0.50
Nodes (3): graphify, Platform handoff, Короткие сессии по разделам (экономия лимитов)

### Community 27 - "ClientPage.tsx"
Cohesion: 0.11
Nodes (36): SITE_SERVICES, flattenJson(), KnownField, parseConds(), deleteClient(), ClientsPage(), DEFAULTS, flatOf() (+28 more)

### Community 28 - "Editor.tsx"
Cohesion: 0.06
Nodes (70): @xyflow/react, Builder(), Inner(), isMobile(), Props, Snap, ACT_TYPES, actText() (+62 more)

### Community 29 - "AgentScene.tsx"
Cohesion: 0.11
Nodes (24): AgentScene(), AgentSceneCard(), COPY, Dst, DST_ICON, DST_ORDER, flight(), Live (+16 more)

### Community 30 - "Repo"
Cohesion: 0.06
Nodes (21): AgentStats, AgentTask, BookingInsert, AudienceClient, BROADCAST_STATUS, BroadcastRow, BroadcastStatus, canReceive() (+13 more)

### Community 31 - "bot.ts"
Cohesion: 0.21
Nodes (17): loadDirectAdmins(), createBot(), ensureClient(), From, fullName(), langOf(), linkLeadClient(), messageKind() (+9 more)

### Community 32 - "main"
Cohesion: 0.23
Nodes (6): Phase 6: Проверка и закрытие, Стек и адреса, Как запустить и проверить, Правила владельца, main(), section_of()

### Community 33 - "Icon"
Cohesion: 0.12
Nodes (29): @supabase/supabase-js, blankGraph, AdminApp(), readMin(), Shell(), useNewVersion(), AuthCtx, AuthGate() (+21 more)

### Community 34 - "Icon.tsx"
Cohesion: 0.13
Nodes (16): CameraCapture(), isSafari, Shot, touch(), IconName, PATHS, ACCEPT, ext() (+8 more)

### Community 35 - "supabaseRepo"
Cohesion: 0.27
Nodes (14): config, handler(), config, handler(), config, handler(), config, handler() (+6 more)

### Community 36 - "lead.ts"
Cohesion: 0.29
Nodes (10): Attribution, clip(), config, handler(), json(), LeadPayload, sendAdEvents(), sha256() (+2 more)

### Community 37 - "ServicePage.tsx"
Cohesion: 0.18
Nodes (21): clsx, Advantages(), AdvantagesData, AiServices(), ProcessData, ProcessTabs(), Results(), ResultsData (+13 more)

### Community 42 - "TemplatesPage.tsx"
Cohesion: 0.13
Nodes (19): TemplateKind, TemplateRow, TPL_GOALS, TPL_KINDS, TPL_SERVICES, TPL_TASKS, TPL_VARS, TemplateStat (+11 more)

### Community 43 - "funnels/engine.ts"
Cohesion: 0.08
Nodes (38): bookingUrl(), hasFreeSlots(), advance(), Btn, CondCtx, DOW, evalRule(), fill() (+30 more)

### Community 44 - "server/catalog.ts"
Cohesion: 0.16
Nodes (20): config, handler(), detectServiceInText(), SERVICE_SLUGS, serviceByLabel(), serviceLabel(), SiteService, STOP_WORDS (+12 more)

### Community 45 - "framer-motion"
Cohesion: 0.25
Nodes (11): framer-motion, lucide-react, ServiceHero(), Aurora(), HeroVideo(), Props, KeywordOrbit(), Props (+3 more)

### Community 46 - "0001_core.sql"
Cohesion: 0.10
Nodes (38): clients_phone_key, clients_updated, clients_username_key, funnel_runs_client_idx, funnel_runs_wake_idx, funnels_updated, jobs_due_idx, lead_notes_client_idx (+30 more)

### Community 47 - "tools.ts"
Cohesion: 0.10
Nodes (26): emptyStats(), ExportMsg, flattenText(), IMPORT_TAG, ImportPlan, importSlice(), ImportStats, MAX_EXPORT_BYTES (+18 more)

### Community 48 - "useSeo"
Cohesion: 0.24
Nodes (14): OPERATOR, POLICY_DATE_LABEL, POLICY_DATE_LABEL_EN, POLICY_PATH, POLICY_VERSION, SeoOptions, setAlternate(), setMeta() (+6 more)

### Community 49 - "react"
Cohesion: 0.18
Nodes (12): react, react-dom, App(), CustomCursor(), Attribution, captureAttribution(), clean(), CLICK_KEYS (+4 more)

### Community 50 - "SolutionScene.tsx"
Cohesion: 0.13
Nodes (19): ACCENT_POS, COPY, EASE_OUT, EASE_SNAP, enter(), exit(), MOTIF_ROTATE, MOTIF_SCALE (+11 more)

### Community 51 - "leads/ingest.ts"
Cohesion: 0.13
Nodes (14): config, handler(), json(), clientFor(), GroupMessage, GroupResult, IngestCtx, ingestGroupMessage() (+6 more)

### Community 52 - "notify.ts"
Cohesion: 0.25
Nodes (11): config, runTick(), adminText(), chatOf(), minutes(), notifyClientDecision(), tickBookingReminders(), whenLabel() (+3 more)

### Community 53 - "LeadCapture.tsx"
Cohesion: 0.19
Nodes (23): react-router-dom, CONTACTS, Footer(), Header(), Layout(), HomeHero(), LeadCapture(), Props (+15 more)

### Community 54 - "BroadcastPage.tsx"
Cohesion: 0.15
Nodes (18): validateBroadcast(), fillTemplate(), callApi(), AgentPage(), LIVE, RISK_CHIP, STATE_ICON, STATUS_CHIP (+10 more)

### Community 55 - "booking.ts"
Cohesion: 0.18
Nodes (18): config, handler(), Статус, buildIcs(), esc(), utc(), notifyAdminsNewBooking(), FORMAT_KEYS (+10 more)

### Community 56 - "BookPage.tsx"
Cohesion: 0.10
Nodes (17): libphonenumber-js, BookPage(), Cfg, Lang, qs, Slot, T, detectCountry() (+9 more)

### Community 57 - "ThemeToggle.tsx"
Cohesion: 0.52
Nodes (5): ThemeToggle(), applyTheme(), COLORS, readTheme(), Theme

### Community 58 - "Evidence"
Cohesion: 0.22
Nodes (8): Evidence, Бренд (сверка админки с сайтом), Вес, Визуал, Структура, Тексты, Phase 2: Общие компоненты и фокус, TemplatePicker()

### Community 59 - "План: редизайн визуального слоя админки ST96 в брендовом стиле сайта"
Cohesion: 0.22
Nodes (8): Phase 0: Факты (уже собраны, не перепроверять без нужды), Phase 1: Токены (один слой), Phase 3: Честные тексты и состояния, Phase 4: Миграция страниц (по одной, с визуальной проверкой), Phase 5: Вес (ленивая загрузка конструктора), Primary goal, Не входит в этот план, План: редизайн визуального слоя админки ST96 в брендовом стиле сайта

### Community 60 - "BookingPage.tsx"
Cohesion: 0.08
Nodes (46): addDays(), Block, clampInt(), cleanWin(), cleanWins(), dayInfo, dayNum(), DOW (+38 more)

### Community 61 - "filter.ts"
Cohesion: 0.10
Nodes (35): applyFilter(), Cond, condLabel(), CondValue, DateValue, ENUM_MAX, FieldDef, FieldKind (+27 more)

### Community 62 - "ST96 «нейросотрудник»: состояние проекта"
Cohesion: 0.25
Nodes (7): ST96 «нейросотрудник»: состояние проекта, Дальше (в порядке приоритета), Как это работает, Проверки, Секреты и доступы, Хвосты, Что строим

### Community 63 - "agent/types.ts"
Cohesion: 0.25
Nodes (7): LogLine, Risk, RISK_LABEL, Step, StepState, TASK_STATUS, TaskStatus

### Community 65 - "avatar/build.mjs"
Cohesion: 0.25
Nodes (7): fit(), font, glyphs(), opentype, report, require, variants

### Community 66 - "agent/engine.ts"
Cohesion: 0.07
Nodes (63): config, handler(), config, handler(), config, exportJson(), input, leadText() (+55 more)

### Community 67 - "Передача проекта ST96 в новую сессию"
Cohesion: 0.25
Nodes (7): Известные ограничения и хвосты, Не в репозитории (специально), Передача проекта ST96 в новую сессию, Секреты (только в Vercel, в код и чат не попадают), Что готово и выложено (всё проверено на проде), Что дальше (по приоритету, по согласованию с владельцем), Что это

### Community 68 - "engine.test.ts"
Cohesion: 0.07
Nodes (19): grammy, priv, setup(), staff, START_ENT, user, seed(), demoGraph (+11 more)

### Community 69 - "telegram.ts"
Cohesion: 0.47
Nodes (5): config, handler(), json(), Структура кода, tracedRepo()

### Community 72 - "0010_analytics.sql"
Cohesion: 0.31
Nodes (5): llm_usage_at, public.llm_usage, public.template_events, template_events_at, template_events_tpl

### Community 74 - "public.bookings"
Cohesion: 0.43
Nodes (4): bookings_client, bookings_starts, bookings_status, public.bookings

### Community 75 - "0005_broadcasts.sql"
Cohesion: 0.43
Nodes (4): broadcast_recipients_pending, broadcasts_touch, public.broadcast_recipients, public.broadcasts

### Community 78 - "0004_templates.sql"
Cohesion: 0.83
Nodes (3): public.templates, public.touch_templates(), templates_touch

### Community 79 - "0006_agent.sql"
Cohesion: 0.83
Nodes (3): agent_tasks_status, agent_tasks_touch, public.agent_tasks

## Knowledge Gaps
- **7 isolated node(s):** `@types/node`, `@types/react`, `@types/react-dom`, `oxlint`, `tailwindcss` (+2 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 501 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **23 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `package.json`, `CookieBanner.tsx`, `AnalyticsPage.tsx`, `ClientPage.tsx`, `Editor.tsx`, `AgentScene.tsx`, `Icon`, `Icon.tsx`, `ServicePage.tsx`, `TemplatesPage.tsx`, `framer-motion`, `useSeo`, `SolutionScene.tsx`, `LeadCapture.tsx`, `BroadcastPage.tsx`, `BookPage.tsx`, `ThemeToggle.tsx`, `BookingPage.tsx`, `filter.ts`, `agent/engine.ts`, `highlight.tsx`?**
  _High betweenness centrality (0.112) - this node is a cross-community bridge._
- **Are the 10 inferred relationships involving `createBot()` (e.g. with `.claimUpdate()` and `.findActiveRun()`) actually correct?**
  _`createBot()` has 10 INFERRED edges - model-reasoned connections that need verification._
- **What connects `@types/node`, `@types/react`, `@types/react-dom` to the rest of the system?**
  _7 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.04343971631205674 - nodes in this community are weakly interconnected._
- **Why does `Repo` connect `Repo` to `agent/engine.ts`, `dialog.ts`, `service.ts`, `telegram.ts`, `engine.test.ts`, `TemplatesPage.tsx`, `funnels/engine.ts`, `server/catalog.ts`, `tools.ts`, `leads/ingest.ts`, `notify.ts`, `booking.ts`, `bot.ts`?**
  _High betweenness centrality (0.072) - this node is a cross-community bridge._
- **Should `dialog.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.12550607287449392 - nodes in this community are weakly interconnected._
- **Why does `grammy` connect `engine.test.ts` to `package.json`, `agent/engine.ts`, `supabaseRepo`, `service.ts`, `telegram.ts`, `dialog.ts`, `tools.ts`, `notify.ts`, `booking.ts`, `Repo`, `bot.ts`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._
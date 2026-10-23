# Graph Report - St96  (2026-10-23)

## Corpus Check
- 211 files · ~1,184,405 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 69 file(s) not represented in the graph (top: .woff2 52, .css 14, (none) 1)

## Summary
- 1464 nodes · 3900 edges · 84 communities (62 shown, 22 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 134 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1884bcbe`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- content.ts
- package.json
- App.tsx
- dialog.ts
- booking.test.ts
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
- repo.ts
- Repo
- План: редизайн визуального слоя админки ST96 в брендовом стиле сайта
- Icon
- MediaField.tsx
- service.ts
- lead.ts
- useLang
- DESIGN-IS-2026-10-20/00-scope.md
- DESIGN-IS-2026-10-20/02-scorecard.md
- DESIGN-IS-2026-10-20/03-verdict.md
- BroadcastPage.tsx
- funnels/engine.ts
- manual.ts
- dependencies
- 0001_core.sql
- tools.ts
- Reveal
- LeadCapture.tsx
- SolutionScene.tsx
- leads/ingest.ts
- notify.ts
- framer-motion
- react
- server/catalog.ts
- BookPage.tsx
- i18n.ts
- devDependencies
- normalizeSchedule
- BookingPage.tsx
- LeadsPage.tsx
- PhoneField.tsx
- agent/types.ts
- geo.ts
- avatar/build.mjs
- agent/engine.ts
- engine.test.ts
- grammy
- scripts
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
- `Phase 6: Проверка и закрытие` --references--> `main()`  [INFERRED]
  DESIGN-IS-2026-10-20/05-redesign-plan.md → scripts/graph-sections.py
- `Стек и адреса` --references--> `main()`  [INFERRED]
  docs/PLATFORM.md → scripts/graph-sections.py
- `Как запустить и проверить` --references--> `main()`  [INFERRED]
  HANDOFF.md → scripts/graph-sections.py
- `Правила владельца` --references--> `main()`  [INFERRED]
  HANDOFF.md → scripts/graph-sections.py

## Import Cycles
- None detected.

## Communities (84 total, 22 thin omitted)

### Community 0 - "content.ts"
Cohesion: 0.12
Nodes (25): ProcessData, ServiceHero(), Aurora(), HeroVideo(), Props, KeywordOrbit(), Props, homeEn (+17 more)

### Community 1 - "package.json"
Cohesion: 0.12
Nodes (15): name, private, type, version, @breezystack/lamejs, oxlint, tailwindcss, @tailwindcss/vite (+7 more)

### Community 2 - "App.tsx"
Cohesion: 0.17
Nodes (16): App(), CookieBanner(), Toggle(), CustomCursor(), trackClicks(), trackLead(), Window, clearAnalyticsCookies() (+8 more)

### Community 3 - "dialog.ts"
Cohesion: 0.14
Nodes (26): cardText(), Content, ensureTopic(), notifyTopic(), sendContent(), TopicMessage, topicTitle(), is429() (+18 more)

### Community 4 - "booking.test.ts"
Cohesion: 0.11
Nodes (19): config, handler(), input, NOW, S, S30, DayBooking, cleanNick() (+11 more)

### Community 5 - "variants-duplex/build.mjs"
Cohesion: 0.10
Nodes (11): finals, opentype, overview, { PDFDocument }, people, QRCode, qrSvg, require (+3 more)

### Community 6 - "AnalyticsPage.tsx"
Cohesion: 0.13
Nodes (24): UsageRow, costUsd(), DEFAULT_PRICES, FEATURE_LABELS, featureLabel(), periodStart(), popularityScore(), Price (+16 more)

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
Nodes (12): planImport(), detectServiceKey(), clientKey(), detectService(), FieldKey, LABELS, LeadOrigin, looksEmail() (+4 more)

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
Cohesion: 0.14
Nodes (25): @supabase/supabase-js, AuthCtx, AuthGate(), Ctx, Login(), State, deleteClient(), esc() (+17 more)

### Community 28 - "Editor.tsx"
Cohesion: 0.06
Nodes (72): Evidence, Бренд (сверка админки с сайтом), Вес, Визуал, Структура, Тексты, Phase 2: Общие компоненты и фокус, @xyflow/react (+64 more)

### Community 29 - "AgentScene.tsx"
Cohesion: 0.13
Nodes (22): AiServices(), AgentScene(), AgentSceneCard(), COPY, Dst, DST_ICON, DST_ORDER, flight() (+14 more)

### Community 30 - "repo.ts"
Cohesion: 0.10
Nodes (22): config, handler(), AgentStats, BookingInsert, AudienceClient, BroadcastRow, BroadcastStatus, canReceive() (+14 more)

### Community 31 - "Repo"
Cohesion: 0.07
Nodes (15): AgentTask, createBot(), ensureClient(), From, fullName(), langOf(), messageKind(), handleTopicMessage() (+7 more)

### Community 32 - "План: редизайн визуального слоя админки ST96 в брендовом стиле сайта"
Cohesion: 0.06
Nodes (33): config, handler(), json(), Phase 0: Факты (уже собраны, не перепроверять без нужды), Phase 1: Токены (один слой), Phase 3: Честные тексты и состояния, Phase 4: Миграция страниц (по одной, с визуальной проверкой), Phase 5: Вес (ленивая загрузка конструктора) (+25 more)

### Community 33 - "Icon"
Cohesion: 0.10
Nodes (37): react-router-dom, AdminApp(), readMin(), Shell(), useNewVersion(), useAuth(), Builder(), AgentPage() (+29 more)

### Community 34 - "MediaField.tsx"
Cohesion: 0.21
Nodes (10): CameraCapture(), isSafari, Shot, touch(), ACCEPT, ext(), LIMIT, MediaField() (+2 more)

### Community 35 - "service.ts"
Cohesion: 0.18
Nodes (23): addDays(), fromDayNum(), isDate(), slotAvailable(), toInstant(), BookingInput, byDate(), createBooking() (+15 more)

### Community 36 - "lead.ts"
Cohesion: 0.29
Nodes (10): Attribution, clip(), config, handler(), json(), LeadPayload, sendAdEvents(), sha256() (+2 more)

### Community 37 - "useLang"
Cohesion: 0.19
Nodes (23): Advantages(), AdvantagesData, LeadCapture(), ProcessTabs(), Results(), ResultsData, ServicesGrid(), AnimatedCounter() (+15 more)

### Community 42 - "BroadcastPage.tsx"
Cohesion: 0.11
Nodes (31): BROADCAST_STATUS, validateBroadcast(), fillTemplate(), TemplateKind, TPL_GENERAL, TPL_GOALS, TPL_KINDS, TPL_SERVICES (+23 more)

### Community 43 - "funnels/engine.ts"
Cohesion: 0.13
Nodes (25): bookingUrl(), advance(), Btn, CondCtx, DOW, evalRule(), fill(), FORMAT_BY_LABEL (+17 more)

### Community 44 - "manual.ts"
Cohesion: 0.20
Nodes (14): detectServiceInText(), serviceByLabel(), asParsed(), clean(), cleanFields(), createManualLead(), Key, LABELS (+6 more)

### Community 45 - "dependencies"
Cohesion: 0.17
Nodes (12): dependencies, @breezystack/lamejs, clsx, framer-motion, grammy, libphonenumber-js, lucide-react, react (+4 more)

### Community 46 - "0001_core.sql"
Cohesion: 0.10
Nodes (38): clients_phone_key, clients_updated, clients_username_key, funnel_runs_client_idx, funnel_runs_wake_idx, funnels_updated, jobs_due_idx, lead_notes_client_idx (+30 more)

### Community 47 - "tools.ts"
Cohesion: 0.10
Nodes (25): emptyStats(), ExportMsg, flattenText(), IMPORT_TAG, ImportPlan, importSlice(), ImportStats, MAX_EXPORT_BYTES (+17 more)

### Community 48 - "Reveal"
Cohesion: 0.31
Nodes (11): Reveal(), OPERATOR, POLICY_DATE_LABEL, POLICY_DATE_LABEL_EN, POLICY_PATH, POLICY_VERSION, List(), PrivacyRu() (+3 more)

### Community 49 - "LeadCapture.tsx"
Cohesion: 0.26
Nodes (10): Props, trustIcons, Attribution, captureAttribution(), clean(), CLICK_KEYS, cookie(), readAdIdentifiers() (+2 more)

### Community 50 - "SolutionScene.tsx"
Cohesion: 0.14
Nodes (18): ACCENT_POS, COPY, EASE_OUT, EASE_SNAP, enter(), exit(), MOTIF_ROTATE, MOTIF_SCALE (+10 more)

### Community 51 - "leads/ingest.ts"
Cohesion: 0.15
Nodes (13): config, handler(), json(), GroupMessage, GroupResult, IngestCtx, ingestGroupMessage(), ingestLead() (+5 more)

### Community 52 - "notify.ts"
Cohesion: 0.27
Nodes (11): config, runTick(), adminText(), chatOf(), minutes(), notifyClientDecision(), tickBookingReminders(), whenLabel() (+3 more)

### Community 53 - "framer-motion"
Cohesion: 0.19
Nodes (16): clsx, framer-motion, Footer(), Header(), Layout(), HomeHero(), MagneticButton(), Props (+8 more)

### Community 54 - "react"
Cohesion: 0.20
Nodes (12): react, callApi(), blank, Form, fromLead(), LeadEditor(), Saved, Check (+4 more)

### Community 55 - "server/catalog.ts"
Cohesion: 0.17
Nodes (15): config, handler(), Статус, buildIcs(), esc(), utc(), notifyAdminsNewBooking(), FORMAT_LABEL (+7 more)

### Community 56 - "BookPage.tsx"
Cohesion: 0.14
Nodes (10): react-dom, BookPage(), Cfg, Lang, qs, Slot, T, BOOKING_GOALS (+2 more)

### Community 57 - "i18n.ts"
Cohesion: 0.22
Nodes (11): lucide-react, CONTACTS, ThemeToggle(), Ui, langFromPath(), LANGS, stripLang(), applyTheme() (+3 more)

### Community 58 - "devDependencies"
Cohesion: 0.18
Nodes (11): devDependencies, oxlint, tailwindcss, @tailwindcss/vite, tsx, @types/node, @types/react, @types/react-dom (+3 more)

### Community 59 - "normalizeSchedule"
Cohesion: 0.33
Nodes (7): clampInt(), cleanWin(), cleanWins(), defaultSchedule(), isTime(), normalizeSchedule(), tm()

### Community 60 - "BookingPage.tsx"
Cohesion: 0.08
Nodes (43): Block, BOOK_ORIGIN, dayInfo, dayNum(), DOW, DOW_EN, DOW_RU, dowOf() (+35 more)

### Community 61 - "LeadsPage.tsx"
Cohesion: 0.08
Nodes (49): applyFilter(), Cond, condLabel(), CondValue, DateValue, ENUM_MAX, FieldDef, FieldKind (+41 more)

### Community 62 - "PhoneField.tsx"
Cohesion: 0.27
Nodes (7): libphonenumber-js, detectCountry(), Examples, flag(), Lib, loadLib(), PhoneField()

### Community 63 - "agent/types.ts"
Cohesion: 0.25
Nodes (7): LogLine, Risk, RISK_LABEL, Step, StepState, TASK_STATUS, TaskStatus

### Community 65 - "avatar/build.mjs"
Cohesion: 0.25
Nodes (7): fit(), font, glyphs(), opentype, report, require, variants

### Community 66 - "agent/engine.ts"
Cohesion: 0.06
Nodes (75): config, handler(), config, handler(), config, handler(), config, handler() (+67 more)

### Community 67 - "engine.test.ts"
Cohesion: 0.10
Nodes (21): blankGraph, demoGraph, Call, Incoming, norm(), pickFunnel(), ActionItem, asArray() (+13 more)

### Community 68 - "grammy"
Cohesion: 0.09
Nodes (15): grammy, priv, setup(), staff, START_ENT, user, seed(), Env (+7 more)

### Community 69 - "scripts"
Cohesion: 0.33
Nodes (6): scripts, build, dev, lint, preview, test:server

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
- **22 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `content.ts`, `package.json`, `App.tsx`, `AnalyticsPage.tsx`, `ClientPage.tsx`, `Editor.tsx`, `AgentScene.tsx`, `Icon`, `MediaField.tsx`, `useLang`, `BroadcastPage.tsx`, `Reveal`, `LeadCapture.tsx`, `SolutionScene.tsx`, `framer-motion`, `BookPage.tsx`, `i18n.ts`, `BookingPage.tsx`, `LeadsPage.tsx`, `PhoneField.tsx`?**
  _High betweenness centrality (0.109) - this node is a cross-community bridge._
- **Are the 10 inferred relationships involving `createBot()` (e.g. with `.claimUpdate()` and `.findActiveRun()`) actually correct?**
  _`createBot()` has 10 INFERRED edges - model-reasoned connections that need verification._
- **What connects `@types/node`, `@types/react`, `@types/react-dom` to the rest of the system?**
  _7 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `content.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.12436974789915967 - nodes in this community are weakly interconnected._
- **Why does `Repo` connect `Repo` to `План: редизайн визуального слоя админки ST96 в брендовом стиле сайта`, `agent/engine.ts`, `service.ts`, `dialog.ts`, `engine.test.ts`, `grammy`, `booking.test.ts`, `BroadcastPage.tsx`, `funnels/engine.ts`, `manual.ts`, `tools.ts`, `leads/ingest.ts`, `notify.ts`, `server/catalog.ts`, `repo.ts`?**
  _High betweenness centrality (0.070) - this node is a cross-community bridge._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.11695906432748537 - nodes in this community are weakly interconnected._
- **Why does `grammy` connect `grammy` to `План: редизайн визуального слоя админки ST96 в брендовом стиле сайта`, `package.json`, `agent/engine.ts`, `dialog.ts`, `booking.test.ts`, `engine.test.ts`, `tools.ts`, `notify.ts`, `server/catalog.ts`, `repo.ts`, `Repo`?**
  _High betweenness centrality (0.041) - this node is a cross-community bridge._
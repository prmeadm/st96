# Graph Report - St96  (2026-10-23)

## Corpus Check
- 212 files · ~1,185,360 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 69 file(s) not represented in the graph (top: .woff2 52, .css 14, (none) 1)

## Summary
- 1468 nodes · 3912 edges · 82 communities (60 shown, 22 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 134 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `88e4cd24`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- content.ts
- package.json
- react
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
- Repo
- bot.ts
- План: редизайн визуального слоя админки ST96 в брендовом стиле сайта
- Icon
- MediaField.tsx
- supabaseRepo
- BookingPage.tsx
- useUi
- DESIGN-IS-2026-10-20/00-scope.md
- DESIGN-IS-2026-10-20/02-scorecard.md
- DESIGN-IS-2026-10-20/03-verdict.md
- BroadcastPage.tsx
- funnels/engine.ts
- manual.ts
- framer-motion
- 0001_core.sql
- tools.ts
- Reveal
- LeadCapture.tsx
- SolutionScene.tsx
- leads/ingest.ts
- server/catalog.ts
- i18n.ts
- supabase.ts
- service.ts
- BookPage.tsx
- engine.test.ts
- lead.ts
- ThemeToggle.tsx
- schedule.ts
- filter.ts
- realFunnel.test.ts
- geo.ts
- avatar/build.mjs
- agent/engine.ts
- groupImport.ts
- booking-admin.ts
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

## Communities (82 total, 22 thin omitted)

### Community 0 - "content.ts"
Cohesion: 0.22
Nodes (14): homeEn, servicesEn, ServiceText, studioAccent, studioAdvantages, studioAdvantagesLead, studioProcess, studioProcessLead (+6 more)

### Community 1 - "package.json"
Cohesion: 0.04
Nodes (44): dependencies, @breezystack/lamejs, clsx, framer-motion, grammy, libphonenumber-js, lucide-react, react (+36 more)

### Community 2 - "react"
Cohesion: 0.17
Nodes (19): react, App(), CookieBanner(), Toggle(), CustomCursor(), reachGoal(), trackClicks(), trackLanguageSwitch() (+11 more)

### Community 3 - "dialog.ts"
Cohesion: 0.12
Nodes (29): Content, ensureTopic(), notifyTopic(), relayToAdmins(), sendContent(), threadGone(), TopicMessage, topicTitle() (+21 more)

### Community 4 - "booking.test.ts"
Cohesion: 0.15
Nodes (18): input, NOW, S, S30, adminText(), chatOf(), minutes(), notifyAdminsNewBooking() (+10 more)

### Community 5 - "variants-duplex/build.mjs"
Cohesion: 0.10
Nodes (11): finals, opentype, overview, { PDFDocument }, people, QRCode, qrSvg, require (+3 more)

### Community 6 - "AnalyticsPage.tsx"
Cohesion: 0.13
Nodes (26): UsageRow, costUsd(), DEFAULT_PRICES, FEATURE_LABELS, featureLabel(), parsePrices(), periodStart(), popularityScore() (+18 more)

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
Cohesion: 0.10
Nodes (39): SITE_SERVICES, flattenJson(), KnownField, fillTemplate(), deleteClient(), esc(), Highlight(), BroadcastPage() (+31 more)

### Community 28 - "Editor.tsx"
Cohesion: 0.06
Nodes (71): @xyflow/react, Builder(), Inner(), isMobile(), Props, Snap, ACT_TYPES, actText() (+63 more)

### Community 29 - "AgentScene.tsx"
Cohesion: 0.11
Nodes (21): react-dom, AgentScene(), AgentSceneCard(), COPY, Dst, DST_ICON, DST_ORDER, flight() (+13 more)

### Community 30 - "Repo"
Cohesion: 0.05
Nodes (22): AgentStats, AgentTask, BookingInsert, showTemplateMenu(), AudienceClient, BROADCAST_STATUS, BroadcastRow, BroadcastStatus (+14 more)

### Community 31 - "bot.ts"
Cohesion: 0.15
Nodes (20): config, handler(), json(), clientFor(), createBot(), ensureClient(), From, fullName() (+12 more)

### Community 32 - "План: редизайн визуального слоя админки ST96 в брендовом стиле сайта"
Cohesion: 0.05
Nodes (38): Evidence, Бренд (сверка админки с сайтом), Вес, Визуал, Структура, Тексты, Phase 0: Факты (уже собраны, не перепроверять без нужды), Phase 1: Токены (один слой) (+30 more)

### Community 33 - "Icon"
Cohesion: 0.14
Nodes (25): react-router-dom, AdminApp(), readMin(), Shell(), useNewVersion(), useAuth(), AgentPage(), LIVE (+17 more)

### Community 34 - "MediaField.tsx"
Cohesion: 0.21
Nodes (10): CameraCapture(), isSafari, Shot, touch(), ACCEPT, ext(), LIMIT, MediaField() (+2 more)

### Community 35 - "supabaseRepo"
Cohesion: 0.19
Nodes (20): config, handler(), config, handler(), config, handler(), config, handler() (+12 more)

### Community 36 - "BookingPage.tsx"
Cohesion: 0.16
Nodes (23): addDays(), dayInfo, dayNum(), dowOf(), hm(), minskNow(), pad(), toLocal() (+15 more)

### Community 37 - "useUi"
Cohesion: 0.22
Nodes (17): Advantages(), AdvantagesData, ProcessData, ProcessTabs(), Results(), ResultsData, ServicesGrid(), AnimatedCounter() (+9 more)

### Community 42 - "BroadcastPage.tsx"
Cohesion: 0.11
Nodes (25): validateBroadcast(), TemplateKind, TemplateRow, TPL_GOALS, TPL_KINDS, TPL_SERVICES, TPL_TASKS, TPL_VARS (+17 more)

### Community 43 - "funnels/engine.ts"
Cohesion: 0.09
Nodes (31): config, runTick(), bookingUrl(), hasFreeSlots(), serviceByLabel(), advance(), CondCtx, DOW (+23 more)

### Community 44 - "manual.ts"
Cohesion: 0.22
Nodes (11): asParsed(), clean(), cleanFields(), createManualLead(), Key, LABELS, LeadFields, Result (+3 more)

### Community 45 - "framer-motion"
Cohesion: 0.16
Nodes (17): clsx, framer-motion, lucide-react, HomeHero(), ServiceHero(), Aurora(), HeroVideo(), Props (+9 more)

### Community 46 - "0001_core.sql"
Cohesion: 0.10
Nodes (38): clients_phone_key, clients_updated, clients_username_key, funnel_runs_client_idx, funnel_runs_wake_idx, funnels_updated, jobs_due_idx, lead_notes_client_idx (+30 more)

### Community 47 - "tools.ts"
Cohesion: 0.12
Nodes (17): askJson(), formatStats(), history(), prompt(), SERVICE_KEYS, Tool, ToolCtx, ToolResult (+9 more)

### Community 48 - "Reveal"
Cohesion: 0.34
Nodes (11): Reveal(), OPERATOR, SeoOptions, setAlternate(), setMeta(), useSeo(), List(), PrivacyRu() (+3 more)

### Community 49 - "LeadCapture.tsx"
Cohesion: 0.16
Nodes (15): CONTACTS, Props, trustIcons, POLICY_DATE_LABEL, POLICY_DATE_LABEL_EN, POLICY_VERSION, services, Attribution (+7 more)

### Community 50 - "SolutionScene.tsx"
Cohesion: 0.14
Nodes (18): ACCENT_POS, COPY, EASE_OUT, EASE_SNAP, enter(), exit(), MOTIF_ROTATE, MOTIF_SCALE (+10 more)

### Community 51 - "leads/ingest.ts"
Cohesion: 0.15
Nodes (12): config, handler(), json(), GroupMessage, GroupResult, IngestCtx, ingestGroupMessage(), ingestLead() (+4 more)

### Community 52 - "server/catalog.ts"
Cohesion: 0.18
Nodes (16): config, handler(), Статус, buildIcs(), esc(), utc(), FORMAT_LABEL, isDate() (+8 more)

### Community 53 - "i18n.ts"
Cohesion: 0.28
Nodes (16): Footer(), Header(), Layout(), AiServices(), LeadCapture(), MagneticButton(), getServiceBySlug(), getServices() (+8 more)

### Community 54 - "supabase.ts"
Cohesion: 0.16
Nodes (14): @supabase/supabase-js, callApi(), AuthCtx, AuthGate(), Ctx, Login(), State, Check (+6 more)

### Community 55 - "service.ts"
Cohesion: 0.12
Nodes (22): slotAvailable(), toInstant(), BookingInput, byDate(), cleanNick(), createBooking(), daySlots(), DEFAULT_DIRECT_ADMINS (+14 more)

### Community 56 - "BookPage.tsx"
Cohesion: 0.09
Nodes (20): libphonenumber-js, fromDayNum(), BookPage(), Cfg, Lang, qs, Slot, T (+12 more)

### Community 57 - "engine.test.ts"
Cohesion: 0.15
Nodes (17): blankGraph, demoGraph, Call, Incoming, norm(), pickFunnel(), asArray(), FEdge (+9 more)

### Community 58 - "lead.ts"
Cohesion: 0.31
Nodes (9): Attribution, clip(), config, handler(), json(), LeadPayload, sendAdEvents(), sha256() (+1 more)

### Community 59 - "ThemeToggle.tsx"
Cohesion: 0.52
Nodes (5): ThemeToggle(), applyTheme(), COLORS, readTheme(), Theme

### Community 60 - "schedule.ts"
Cohesion: 0.09
Nodes (29): Block, BOOK_ORIGIN, clampInt(), cleanWin(), cleanWins(), defaultSchedule(), DOW, DOW_EN (+21 more)

### Community 61 - "filter.ts"
Cohesion: 0.10
Nodes (36): applyFilter(), Cond, condLabel(), CondValue, DateValue, ENUM_MAX, FieldDef, FieldKind (+28 more)

### Community 63 - "realFunnel.test.ts"
Cohesion: 0.08
Nodes (13): priv, setup(), staff, START_ENT, user, seed(), Env, setup() (+5 more)

### Community 65 - "avatar/build.mjs"
Cohesion: 0.25
Nodes (7): fit(), font, glyphs(), opentype, report, require, variants

### Community 66 - "agent/engine.ts"
Cohesion: 0.07
Nodes (63): config, handler(), config, handler(), exportJson(), input, leadText(), mockLlm() (+55 more)

### Community 69 - "groupImport.ts"
Cohesion: 0.17
Nodes (13): emptyStats(), ExportMsg, flattenText(), IMPORT_TAG, ImportPlan, importSlice(), ImportStats, MAX_EXPORT_BYTES (+5 more)

### Community 70 - "booking-admin.ts"
Cohesion: 0.24
Nodes (9): config, handler(), decideBooking(), isHttps(), loadMeetDefault(), saveDirectAdmins(), saveMeetDefault(), saveSchedule() (+1 more)

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
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 502 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **22 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `package.json`, `AnalyticsPage.tsx`, `ClientPage.tsx`, `Editor.tsx`, `AgentScene.tsx`, `Icon`, `MediaField.tsx`, `BookingPage.tsx`, `useUi`, `BroadcastPage.tsx`, `framer-motion`, `Reveal`, `LeadCapture.tsx`, `SolutionScene.tsx`, `i18n.ts`, `supabase.ts`, `BookPage.tsx`, `ThemeToggle.tsx`, `filter.ts`?**
  _High betweenness centrality (0.124) - this node is a cross-community bridge._
- **Are the 10 inferred relationships involving `createBot()` (e.g. with `.claimUpdate()` and `.findActiveRun()`) actually correct?**
  _`createBot()` has 10 INFERRED edges - model-reasoned connections that need verification._
- **What connects `@types/node`, `@types/react`, `@types/react-dom` to the rest of the system?**
  _7 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.04343971631205674 - nodes in this community are weakly interconnected._
- **Why does `Repo` connect `Repo` to `План: редизайн визуального слоя админки ST96 в брендовом стиле сайта`, `agent/engine.ts`, `dialog.ts`, `booking.test.ts`, `groupImport.ts`, `booking-admin.ts`, `BroadcastPage.tsx`, `funnels/engine.ts`, `manual.ts`, `tools.ts`, `leads/ingest.ts`, `service.ts`, `realFunnel.test.ts`, `bot.ts`?**
  _High betweenness centrality (0.060) - this node is a cross-community bridge._
- **Should `dialog.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.12307692307692308 - nodes in this community are weakly interconnected._
- **Why does `Статус` connect `server/catalog.ts` to `План: редизайн визуального слоя админки ST96 в брендовом стиле сайта`, `MediaField.tsx`, `dialog.ts`, `booking.test.ts`, `BookingPage.tsx`, `booking-admin.ts`, `parse.ts`, `leads/ingest.ts`, `i18n.ts`, `service.ts`, `Repo`, `bot.ts`?**
  _High betweenness centrality (0.039) - this node is a cross-community bridge._
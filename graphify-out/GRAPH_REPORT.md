# Graph Report - St96  (2026-10-23)

## Corpus Check
- 211 files · ~1,183,834 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 69 file(s) not represented in the graph (top: .woff2 52, .css 14, (none) 1)

## Summary
- 1461 nodes · 3895 edges · 85 communities (63 shown, 22 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 134 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `2feb9edf`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- server/catalog.ts
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
- bot.test.ts
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
- broadcasts.ts
- Repo
- План: редизайн визуального слоя админки ST96 в брендовом стиле сайта
- Icon
- ModelPicker.tsx
- service.ts
- parse.ts
- useUi
- DESIGN-IS-2026-10-20/00-scope.md
- DESIGN-IS-2026-10-20/02-scorecard.md
- DESIGN-IS-2026-10-20/03-verdict.md
- BroadcastPage.tsx
- funnels/engine.ts
- manual.ts
- react
- 0001_core.sql
- repo.ts
- Reveal
- LeadCapture.tsx
- SolutionScene.tsx
- leads/ingest.ts
- notify.ts
- i18n.ts
- groupImport.ts
- bot.ts
- BookPage.tsx
- agent/engine.ts
- engine.test.ts
- normalizeSchedule
- BookingPage.tsx
- LeadsPage.tsx
- memoryRepo.ts
- QuickNav.tsx
- geo.ts
- avatar/build.mjs
- agent.test.ts
- FunnelPage.tsx
- realFunnel.test.ts
- supabaseRepo
- llm.ts
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

## Communities (85 total, 22 thin omitted)

### Community 0 - "server/catalog.ts"
Cohesion: 0.17
Nodes (18): servicesBrief(), SiteService, STOP_WORDS, homeEn, servicesEn, ServiceText, studioAccent, studioAdvantages (+10 more)

### Community 1 - "package.json"
Cohesion: 0.04
Nodes (44): dependencies, @breezystack/lamejs, clsx, framer-motion, grammy, libphonenumber-js, lucide-react, react (+36 more)

### Community 2 - "App.tsx"
Cohesion: 0.13
Nodes (23): App(), CookieBanner(), Toggle(), CustomCursor(), ThemeToggle(), reachGoal(), trackClicks(), trackLanguageSwitch() (+15 more)

### Community 3 - "dialog.ts"
Cohesion: 0.13
Nodes (27): cardText(), Content, ensureTopic(), notifyTopic(), sendContent(), TopicMessage, topicTitle(), is429() (+19 more)

### Community 4 - "booking.test.ts"
Cohesion: 0.11
Nodes (20): config, handler(), input, NOW, S, S30, DayBooking, cleanNick() (+12 more)

### Community 5 - "variants-duplex/build.mjs"
Cohesion: 0.10
Nodes (11): finals, opentype, overview, { PDFDocument }, people, QRCode, qrSvg, require (+3 more)

### Community 6 - "AnalyticsPage.tsx"
Cohesion: 0.14
Nodes (25): UsageRow, costUsd(), DEFAULT_PRICES, FEATURE_LABELS, featureLabel(), parsePrices(), periodStart(), popularityScore() (+17 more)

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

### Community 12 - "bot.test.ts"
Cohesion: 0.15
Nodes (8): priv, setup(), staff, START_ENT, user, seed(), setup(), memoryRepo

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
Cohesion: 0.15
Nodes (22): useAuth(), deleteClient(), esc(), Highlight(), ClientPage(), SendTemplate(), blank, Form (+14 more)

### Community 28 - "Editor.tsx"
Cohesion: 0.07
Nodes (64): @xyflow/react, Builder(), Inner(), isMobile(), Props, Snap, ACT_TYPES, actText() (+56 more)

### Community 29 - "AgentScene.tsx"
Cohesion: 0.12
Nodes (20): AgentScene(), AgentSceneCard(), COPY, Dst, DST_ICON, DST_ORDER, flight(), Live (+12 more)

### Community 30 - "broadcasts.ts"
Cohesion: 0.13
Nodes (13): AudienceClient, BROADCAST_STATUS, BroadcastRow, BroadcastStatus, canReceive(), FOOTER, inAudience(), isRateLimit() (+5 more)

### Community 31 - "Repo"
Cohesion: 0.08
Nodes (3): AgentTask, RunRow, Repo

### Community 32 - "План: редизайн визуального слоя админки ST96 в брендовом стиле сайта"
Cohesion: 0.05
Nodes (38): Evidence, Бренд (сверка админки с сайтом), Вес, Визуал, Структура, Тексты, Phase 0: Факты (уже собраны, не перепроверять без нужды), Phase 1: Токены (один слой) (+30 more)

### Community 33 - "Icon"
Cohesion: 0.14
Nodes (27): AdminApp(), readMin(), Shell(), useNewVersion(), AuthCtx, AuthGate(), Ctx, Login() (+19 more)

### Community 34 - "ModelPicker.tsx"
Cohesion: 0.23
Nodes (9): CustomModel, MODELS, PRESETS, callApi(), Check, ModelPicker(), Row(), SettingsPage() (+1 more)

### Community 35 - "service.ts"
Cohesion: 0.14
Nodes (30): config, handler(), notifyAdminsNewBooking(), FORMAT_KEYS, isDate(), minskNow(), slotAvailable(), toInstant() (+22 more)

### Community 36 - "parse.ts"
Cohesion: 0.13
Nodes (22): Attribution, clip(), config, handler(), json(), LeadPayload, sendAdEvents(), sha256() (+14 more)

### Community 37 - "useUi"
Cohesion: 0.21
Nodes (18): clsx, Advantages(), AdvantagesData, ProcessData, ProcessTabs(), Results(), ResultsData, ServicesGrid() (+10 more)

### Community 42 - "BroadcastPage.tsx"
Cohesion: 0.08
Nodes (42): validateBroadcast(), fillTemplate(), TemplateKind, TemplateRow, TPL_GENERAL, TPL_GOALS, TPL_KINDS, TPL_SERVICES (+34 more)

### Community 43 - "funnels/engine.ts"
Cohesion: 0.12
Nodes (26): serviceByLabel(), advance(), Btn, CondCtx, DOW, evalRule(), fill(), FORMAT_BY_LABEL (+18 more)

### Community 44 - "manual.ts"
Cohesion: 0.16
Nodes (15): Статус, showTemplateMenu(), detectServiceInText(), UNKNOWN_SERVICE, asParsed(), clean(), cleanFields(), createManualLead() (+7 more)

### Community 45 - "react"
Cohesion: 0.15
Nodes (18): framer-motion, lucide-react, react, react-dom, HomeHero(), ServiceHero(), Aurora(), HeroVideo() (+10 more)

### Community 46 - "0001_core.sql"
Cohesion: 0.10
Nodes (38): clients_phone_key, clients_updated, clients_username_key, funnel_runs_client_idx, funnel_runs_wake_idx, funnels_updated, jobs_due_idx, lead_notes_client_idx (+30 more)

### Community 47 - "repo.ts"
Cohesion: 0.11
Nodes (19): @supabase/supabase-js, askJson(), history(), PLANNABLE, prompt(), SERVICE_KEYS, Tool, TOOL_BY_NAME (+11 more)

### Community 48 - "Reveal"
Cohesion: 0.28
Nodes (13): Reveal(), OPERATOR, POLICY_DATE_LABEL, POLICY_DATE_LABEL_EN, SeoOptions, setAlternate(), setMeta(), useSeo() (+5 more)

### Community 49 - "LeadCapture.tsx"
Cohesion: 0.19
Nodes (13): CONTACTS, Props, trustIcons, POLICY_PATH, POLICY_VERSION, Attribution, captureAttribution(), clean() (+5 more)

### Community 50 - "SolutionScene.tsx"
Cohesion: 0.14
Nodes (18): ACCENT_POS, COPY, EASE_OUT, EASE_SNAP, enter(), exit(), MOTIF_ROTATE, MOTIF_SCALE (+10 more)

### Community 51 - "leads/ingest.ts"
Cohesion: 0.14
Nodes (14): config, handler(), json(), GroupMessage, GroupResult, IngestCtx, ingestGroupMessage(), ingestLead() (+6 more)

### Community 52 - "notify.ts"
Cohesion: 0.28
Nodes (14): buildIcs(), esc(), utc(), adminText(), chatOf(), minutes(), notifyClientDecision(), tickBookingReminders() (+6 more)

### Community 53 - "i18n.ts"
Cohesion: 0.28
Nodes (17): react-router-dom, Footer(), Header(), Layout(), AiServices(), LeadCapture(), MagneticButton(), getServiceBySlug() (+9 more)

### Community 54 - "groupImport.ts"
Cohesion: 0.17
Nodes (13): emptyStats(), ExportMsg, flattenText(), IMPORT_TAG, ImportPlan, importSlice(), ImportStats, MAX_EXPORT_BYTES (+5 more)

### Community 55 - "bot.ts"
Cohesion: 0.15
Nodes (14): createBot(), ensureClient(), From, fullName(), langOf(), linkLeadClient(), messageKind(), handleTopicMessage() (+6 more)

### Community 56 - "BookPage.tsx"
Cohesion: 0.10
Nodes (16): libphonenumber-js, BookPage(), Cfg, Lang, qs, Slot, T, detectCountry() (+8 more)

### Community 57 - "agent/engine.ts"
Cohesion: 0.16
Nodes (26): config, handler(), config, runTick(), agentDeps(), approveTask(), catalog(), confirmStep() (+18 more)

### Community 58 - "engine.test.ts"
Cohesion: 0.22
Nodes (4): blankGraph, demoGraph, Call, TRIGGER

### Community 59 - "normalizeSchedule"
Cohesion: 0.28
Nodes (9): clampInt(), cleanWin(), cleanWins(), defaultSchedule(), isTime(), normalizeSchedule(), tm(), BookingPage() (+1 more)

### Community 60 - "BookingPage.tsx"
Cohesion: 0.09
Nodes (41): addDays(), Block, BOOK_ORIGIN, dayInfo, dayNum(), DOW, DOW_EN, DOW_RU (+33 more)

### Community 61 - "LeadsPage.tsx"
Cohesion: 0.08
Nodes (51): applyFilter(), Cond, condLabel(), CondValue, DateValue, ENUM_MAX, FieldDef, FieldKind (+43 more)

### Community 62 - "memoryRepo.ts"
Cohesion: 0.22
Nodes (9): ActionItem, FEdge, FNode, Funnel, JobRow, Link, Quick, Rule (+1 more)

### Community 63 - "QuickNav.tsx"
Cohesion: 0.40
Nodes (4): ADMIN, L, SITE, SITE_EN

### Community 65 - "avatar/build.mjs"
Cohesion: 0.25
Nodes (7): fit(), font, glyphs(), opentype, report, require, variants

### Community 66 - "agent.test.ts"
Cohesion: 0.13
Nodes (25): config, handler(), exportJson(), input, leadText(), mockLlm(), setup(), fail() (+17 more)

### Community 67 - "FunnelPage.tsx"
Cohesion: 0.18
Nodes (13): Incoming, norm(), pickFunnel(), asArray(), Graph, parseDelay(), Part, str() (+5 more)

### Community 68 - "realFunnel.test.ts"
Cohesion: 0.13
Nodes (7): Env, groupParts(), resumeRun(), fakeTelegram(), graph, Sent, setup()

### Community 69 - "supabaseRepo"
Cohesion: 0.19
Nodes (19): config, handler(), config, handler(), config, handler(), config, handler() (+11 more)

### Community 70 - "llm.ts"
Cohesion: 0.22
Nodes (10): DEFAULT_BASE_URL, DEFAULT_MODELS, Llm, LlmError, parseJson(), count(), MAX_TRANSLATE_CHARS, missingTokens() (+2 more)

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
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 500 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **22 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `package.json`, `App.tsx`, `AnalyticsPage.tsx`, `ClientPage.tsx`, `Editor.tsx`, `AgentScene.tsx`, `Icon`, `ModelPicker.tsx`, `useUi`, `BroadcastPage.tsx`, `Reveal`, `LeadCapture.tsx`, `SolutionScene.tsx`, `i18n.ts`, `BookPage.tsx`, `BookingPage.tsx`, `LeadsPage.tsx`, `QuickNav.tsx`, `FunnelPage.tsx`?**
  _High betweenness centrality (0.111) - this node is a cross-community bridge._
- **Are the 10 inferred relationships involving `createBot()` (e.g. with `.claimUpdate()` and `.findActiveRun()`) actually correct?**
  _`createBot()` has 10 INFERRED edges - model-reasoned connections that need verification._
- **What connects `@types/node`, `@types/react`, `@types/react-dom` to the rest of the system?**
  _7 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.04343971631205674 - nodes in this community are weakly interconnected._
- **Why does `Repo` connect `Repo` to `План: редизайн визуального слоя админки ST96 в брендовом стиле сайта`, `agent.test.ts`, `service.ts`, `dialog.ts`, `FunnelPage.tsx`, `realFunnel.test.ts`, `booking.test.ts`, `BroadcastPage.tsx`, `funnels/engine.ts`, `manual.ts`, `repo.ts`, `leads/ingest.ts`, `notify.ts`, `groupImport.ts`, `bot.ts`, `memoryRepo.ts`, `agent/engine.ts`, `broadcasts.ts`?**
  _High betweenness centrality (0.072) - this node is a cross-community bridge._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.12878787878787878 - nodes in this community are weakly interconnected._
- **Why does `grammy` connect `supabaseRepo` to `package.json`, `agent.test.ts`, `service.ts`, `booking.test.ts`, `dialog.ts`, `FunnelPage.tsx`, `realFunnel.test.ts`, `bot.test.ts`, `repo.ts`, `notify.ts`, `bot.ts`, `agent/engine.ts`, `broadcasts.ts`?**
  _High betweenness centrality (0.039) - this node is a cross-community bridge._
# Graph Report - St96  (2026-10-23)

## Corpus Check
- 211 files · ~1,182,964 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 69 file(s) not represented in the graph (top: .woff2 52, .css 14, (none) 1)

## Summary
- 1460 nodes · 3893 edges · 86 communities (63 shown, 23 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 134 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `49bfb18c`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- server/catalog.ts
- package.json
- react
- dialog.ts
- booking-admin.ts
- variants-duplex/build.mjs
- AnalyticsPage.tsx
- compilerOptions
- compilerOptions
- duplex/build.mjs
- business-cards/package.json
- ref_node_fs
- engine.test.ts
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
- manual.ts
- ServicePage.tsx
- DESIGN-IS-2026-10-20/00-scope.md
- DESIGN-IS-2026-10-20/02-scorecard.md
- DESIGN-IS-2026-10-20/03-verdict.md
- BroadcastPage.tsx
- funnels/engine.ts
- showTemplateMenu
- framer-motion
- 0001_core.sql
- repo.ts
- Reveal
- LeadCapture.tsx
- SolutionScene.tsx
- booking.test.ts
- i18n.ts
- bot.ts
- BookPage.tsx
- agent/engine.ts
- MediaField.tsx
- BookingPage.tsx
- filter.ts
- memoryRepo.ts
- geo.ts
- avatar/build.mjs
- agent-model.ts
- FunnelPage.tsx
- realFunnel.test.ts
- supabaseRepo
- llm.ts
- 0010_analytics.sql
- grammy
- public.bookings
- 0005_broadcasts.sql
- supabase.ts
- telegram.ts
- 0004_templates.sql
- 0006_agent.sql
- clients_admin_topic_key
- 0007_settings.sql
- 0011_tg_links.sql
- ThemeToggle.tsx
- ensureTopic
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

## Communities (86 total, 23 thin omitted)

### Community 0 - "server/catalog.ts"
Cohesion: 0.16
Nodes (19): servicesBrief(), SiteService, STOP_WORDS, UNKNOWN_SERVICE, homeEn, servicesEn, ServiceText, studioAccent (+11 more)

### Community 1 - "package.json"
Cohesion: 0.04
Nodes (44): dependencies, @breezystack/lamejs, clsx, framer-motion, grammy, libphonenumber-js, lucide-react, react (+36 more)

### Community 2 - "react"
Cohesion: 0.17
Nodes (15): react, react-dom, App(), CookieBanner(), Toggle(), CustomCursor(), clearAnalyticsCookies(), Consent (+7 more)

### Community 3 - "dialog.ts"
Cohesion: 0.17
Nodes (23): Content, notifyTopic(), sendContent(), TopicMessage, is429(), Markup, retryAfterMs(), telegramOut() (+15 more)

### Community 4 - "booking-admin.ts"
Cohesion: 0.21
Nodes (11): config, handler(), decideBooking(), isHttps(), loadMeetDefault(), saveDirectAdmins(), saveMeetDefault(), saveSchedule() (+3 more)

### Community 5 - "variants-duplex/build.mjs"
Cohesion: 0.10
Nodes (11): finals, opentype, overview, { PDFDocument }, people, QRCode, qrSvg, require (+3 more)

### Community 6 - "AnalyticsPage.tsx"
Cohesion: 0.12
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

### Community 12 - "engine.test.ts"
Cohesion: 0.10
Nodes (12): priv, setup(), staff, START_ENT, user, seed(), blankGraph, demoGraph (+4 more)

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
Nodes (34): flattenJson(), KnownField, parseConds(), deleteClient(), esc(), Highlight(), ClientsPage(), DEFAULTS (+26 more)

### Community 28 - "Editor.tsx"
Cohesion: 0.08
Nodes (60): @xyflow/react, Builder(), Inner(), isMobile(), Props, Snap, ACT_TYPES, actText() (+52 more)

### Community 29 - "AgentScene.tsx"
Cohesion: 0.11
Nodes (26): AiServices(), AgentScene(), AgentSceneCard(), COPY, Dst, DST_ICON, DST_ORDER, flight() (+18 more)

### Community 30 - "broadcasts.ts"
Cohesion: 0.14
Nodes (12): AudienceClient, BROADCAST_STATUS, BroadcastRow, BroadcastStatus, canReceive(), FOOTER, inAudience(), isRateLimit() (+4 more)

### Community 31 - "Repo"
Cohesion: 0.08
Nodes (3): AgentTask, RunRow, Repo

### Community 32 - "План: редизайн визуального слоя админки ST96 в брендовом стиле сайта"
Cohesion: 0.05
Nodes (38): Evidence, Бренд (сверка админки с сайтом), Вес, Визуал, Структура, Тексты, Phase 0: Факты (уже собраны, не перепроверять без нужды), Phase 1: Токены (один слой) (+30 more)

### Community 33 - "Icon"
Cohesion: 0.15
Nodes (28): react-router-dom, AdminApp(), readMin(), Shell(), useNewVersion(), useAuth(), AgentPage(), LIVE (+20 more)

### Community 34 - "ModelPicker.tsx"
Cohesion: 0.23
Nodes (9): CustomModel, MODELS, PRESETS, callApi(), Check, ModelPicker(), Row(), SettingsPage() (+1 more)

### Community 35 - "service.ts"
Cohesion: 0.13
Nodes (35): config, handler(), Статус, addDays(), dayInfo, dayNum(), FORMAT_KEYS, FORMAT_LABEL (+27 more)

### Community 36 - "manual.ts"
Cohesion: 0.05
Nodes (63): config, handler(), json(), Attribution, clip(), config, handler(), json() (+55 more)

### Community 37 - "ServicePage.tsx"
Cohesion: 0.19
Nodes (19): clsx, Advantages(), AdvantagesData, ProcessData, ProcessTabs(), Results(), ResultsData, ServicesGrid() (+11 more)

### Community 42 - "BroadcastPage.tsx"
Cohesion: 0.12
Nodes (29): validateBroadcast(), fillTemplate(), TemplateKind, TemplateRow, TPL_GENERAL, TPL_GOALS, TPL_KINDS, TPL_SERVICES (+21 more)

### Community 43 - "funnels/engine.ts"
Cohesion: 0.13
Nodes (25): advance(), Btn, CondCtx, DOW, evalRule(), fill(), FORMAT_BY_LABEL, formatKeyOf() (+17 more)

### Community 45 - "framer-motion"
Cohesion: 0.25
Nodes (11): framer-motion, lucide-react, ServiceHero(), Aurora(), HeroVideo(), Props, KeywordOrbit(), Props (+3 more)

### Community 46 - "0001_core.sql"
Cohesion: 0.10
Nodes (38): clients_phone_key, clients_updated, clients_username_key, funnel_runs_client_idx, funnel_runs_wake_idx, funnels_updated, jobs_due_idx, lead_notes_client_idx (+30 more)

### Community 47 - "repo.ts"
Cohesion: 0.10
Nodes (21): @supabase/supabase-js, askJson(), history(), PLANNABLE, prompt(), SERVICE_KEYS, Tool, TOOL_BY_NAME (+13 more)

### Community 48 - "Reveal"
Cohesion: 0.28
Nodes (13): Reveal(), OPERATOR, POLICY_DATE_LABEL, POLICY_DATE_LABEL_EN, SeoOptions, setAlternate(), setMeta(), useSeo() (+5 more)

### Community 49 - "LeadCapture.tsx"
Cohesion: 0.21
Nodes (12): CONTACTS, Props, trustIcons, POLICY_VERSION, Attribution, captureAttribution(), clean(), CLICK_KEYS (+4 more)

### Community 50 - "SolutionScene.tsx"
Cohesion: 0.14
Nodes (18): ACCENT_POS, COPY, EASE_OUT, EASE_SNAP, enter(), exit(), MOTIF_ROTATE, MOTIF_SCALE (+10 more)

### Community 52 - "booking.test.ts"
Cohesion: 0.14
Nodes (23): input, NOW, S, S30, buildIcs(), esc(), utc(), adminText() (+15 more)

### Community 53 - "i18n.ts"
Cohesion: 0.22
Nodes (19): Footer(), Header(), Layout(), HomeHero(), LeadCapture(), MagneticButton(), Props, tags (+11 more)

### Community 55 - "bot.ts"
Cohesion: 0.13
Nodes (15): createBot(), ensureClient(), From, fullName(), langOf(), linkLeadClient(), messageKind(), handleTopicMessage() (+7 more)

### Community 56 - "BookPage.tsx"
Cohesion: 0.09
Nodes (22): libphonenumber-js, dowOf(), BookPage(), Cfg, Lang, qs, Slot, T (+14 more)

### Community 57 - "agent/engine.ts"
Cohesion: 0.14
Nodes (29): config, handler(), exportJson(), input, leadText(), mockLlm(), setup(), AgentDeps (+21 more)

### Community 58 - "MediaField.tsx"
Cohesion: 0.21
Nodes (10): CameraCapture(), isSafari, Shot, touch(), ACCEPT, ext(), LIMIT, MediaField() (+2 more)

### Community 60 - "BookingPage.tsx"
Cohesion: 0.08
Nodes (40): Block, BOOK_ORIGIN, clampInt(), cleanWin(), cleanWins(), defaultSchedule(), DOW, DOW_EN (+32 more)

### Community 61 - "filter.ts"
Cohesion: 0.10
Nodes (35): applyFilter(), Cond, condLabel(), CondValue, DateValue, ENUM_MAX, FieldDef, FieldKind (+27 more)

### Community 62 - "memoryRepo.ts"
Cohesion: 0.22
Nodes (9): ActionItem, FEdge, FNode, Funnel, JobRow, Link, Quick, Rule (+1 more)

### Community 65 - "avatar/build.mjs"
Cohesion: 0.25
Nodes (7): fit(), font, glyphs(), opentype, report, require, variants

### Community 66 - "agent-model.ts"
Cohesion: 0.25
Nodes (12): config, handler(), MODEL_SETTING, AUTO_MODEL, CUSTOM_PREFIX, CUSTOM_SETTING, isKnownModel(), MAX_CUSTOM_MODELS (+4 more)

### Community 67 - "FunnelPage.tsx"
Cohesion: 0.18
Nodes (13): Incoming, norm(), pickFunnel(), asArray(), Graph, parseDelay(), Part, str() (+5 more)

### Community 68 - "realFunnel.test.ts"
Cohesion: 0.13
Nodes (7): Env, groupParts(), resumeRun(), fakeTelegram(), graph, Sent, setup()

### Community 69 - "supabaseRepo"
Cohesion: 0.27
Nodes (14): config, handler(), config, handler(), config, handler(), config, handler() (+6 more)

### Community 70 - "llm.ts"
Cohesion: 0.21
Nodes (13): DEFAULT_BASE_URL, DEFAULT_MODELS, Llm, LlmError, openAiCompatible(), parseJson(), record(), testModel() (+5 more)

### Community 72 - "0010_analytics.sql"
Cohesion: 0.31
Nodes (5): llm_usage_at, public.llm_usage, public.template_events, template_events_at, template_events_tpl

### Community 73 - "grammy"
Cohesion: 0.29
Nodes (8): config, runTick(), config, grammy, agentDeps(), fail(), resolveLlm(), modelChain()

### Community 74 - "public.bookings"
Cohesion: 0.43
Nodes (4): bookings_client, bookings_starts, bookings_status, public.bookings

### Community 75 - "0005_broadcasts.sql"
Cohesion: 0.43
Nodes (4): broadcast_recipients_pending, broadcasts_touch, public.broadcast_recipients, public.broadcasts

### Community 76 - "supabase.ts"
Cohesion: 0.17
Nodes (13): AuthCtx, AuthGate(), Ctx, Login(), State, Found, NotesPage(), Unassigned() (+5 more)

### Community 77 - "telegram.ts"
Cohesion: 0.67
Nodes (3): config, handler(), json()

### Community 78 - "0004_templates.sql"
Cohesion: 0.83
Nodes (3): public.templates, public.touch_templates(), templates_touch

### Community 79 - "0006_agent.sql"
Cohesion: 0.83
Nodes (3): agent_tasks_status, agent_tasks_touch, public.agent_tasks

### Community 89 - "ThemeToggle.tsx"
Cohesion: 0.52
Nodes (5): ThemeToggle(), applyTheme(), COLORS, readTheme(), Theme

### Community 90 - "ensureTopic"
Cohesion: 0.40
Nodes (3): cardText(), ensureTopic(), topicTitle()

## Knowledge Gaps
- **7 isolated node(s):** `@types/node`, `@types/react`, `@types/react-dom`, `oxlint`, `tailwindcss` (+2 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 500 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **23 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `package.json`, `AnalyticsPage.tsx`, `ClientPage.tsx`, `Editor.tsx`, `AgentScene.tsx`, `Icon`, `ModelPicker.tsx`, `ServicePage.tsx`, `BroadcastPage.tsx`, `framer-motion`, `Reveal`, `LeadCapture.tsx`, `SolutionScene.tsx`, `i18n.ts`, `BookPage.tsx`, `MediaField.tsx`, `BookingPage.tsx`, `filter.ts`, `FunnelPage.tsx`, `supabase.ts`, `ThemeToggle.tsx`?**
  _High betweenness centrality (0.112) - this node is a cross-community bridge._
- **Are the 10 inferred relationships involving `createBot()` (e.g. with `.claimUpdate()` and `.findActiveRun()`) actually correct?**
  _`createBot()` has 10 INFERRED edges - model-reasoned connections that need verification._
- **What connects `@types/node`, `@types/react`, `@types/react-dom` to the rest of the system?**
  _7 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.04343971631205674 - nodes in this community are weakly interconnected._
- **Why does `Repo` connect `Repo` to `План: редизайн визуального слоя админки ST96 в брендовом стиле сайта`, `service.ts`, `manual.ts`, `dialog.ts`, `FunnelPage.tsx`, `realFunnel.test.ts`, `booking-admin.ts`, `grammy`, `BroadcastPage.tsx`, `funnels/engine.ts`, `showTemplateMenu`, `repo.ts`, `booking.test.ts`, `bot.ts`, `memoryRepo.ts`, `agent/engine.ts`, `ensureTopic`, `broadcasts.ts`?**
  _High betweenness centrality (0.072) - this node is a cross-community bridge._
- **Should `variants-duplex/build.mjs` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._
- **Why does `grammy` connect `grammy` to `package.json`, `service.ts`, `booking-admin.ts`, `supabaseRepo`, `dialog.ts`, `FunnelPage.tsx`, `realFunnel.test.ts`, `engine.test.ts`, `telegram.ts`, `repo.ts`, `booking.test.ts`, `bot.ts`, `agent/engine.ts`, `broadcasts.ts`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._
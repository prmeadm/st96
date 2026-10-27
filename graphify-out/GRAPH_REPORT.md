# Graph Report - St96  (2026-10-28)

## Corpus Check
- 207 files · ~193,354 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 19 file(s) not represented in the graph (top: .css 13, .woff2 4, (none) 1)

## Summary
- 1445 nodes · 3956 edges · 77 communities (54 shown, 23 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 147 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `78240d0a`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- booking.ts
- package.json
- schedule.ts
- repo.ts
- filter.ts
- dialog.ts
- ClientPage.tsx
- compilerOptions
- compilerOptions
- tools.ts
- ScheduleTab
- vite.config.ts
- leads/ingest.ts
- AgentScene.tsx
- Evidence
- ST96 — сайт креативной студии
- .oxlintrc.json
- AnalyticsPage.tsx
- useLang
- Verdict: REFINE
- tsconfig.json
- CLAUDE.md
- .claude/CLAUDE.md
- 00-scope.md
- 02-scorecard.md
- vercel.json
- LeadCapture.tsx
- Editor.tsx
- server/catalog.ts
- Reveal
- Repo
- План: редизайн визуального слоя админки ST96 в брендовом стиле сайта
- Icon
- BroadcastPage.tsx
- agent/engine.ts
- content.ts
- BookingPage.tsx
- DESIGN-IS-2026-10-20/00-scope.md
- DESIGN-IS-2026-10-20/02-scorecard.md
- DESIGN-IS-2026-10-20/03-verdict.md
- i18n.ts
- react
- framer-motion
- 0001_core.sql
- booking.test.ts
- BookPage.tsx
- bot.ts
- funnels/engine.ts
- 0005_broadcasts.sql
- Icon.tsx
- service.ts
- SolutionScene.tsx
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
- 0010_analytics.sql
- public.bookings
- bot.test.ts
- build.mjs
- PRINT ST96/README.md
- supabase.ts
- booking-admin.ts
- scripts

## God Nodes (most connected - your core abstractions)
1. `Repo` - 84 edges
2. `react` - 57 edges
3. `Icon()` - 50 edges
4. `createBot()` - 33 edges
5. `supabaseRepo()` - 30 edges
6. `useLang()` - 27 edges
7. `Статус` - 27 edges
8. `grammy` - 26 edges
9. `useUi()` - 26 edges
10. `telegramOut()` - 25 edges

## Surprising Connections (you probably didn't know these)
- `Как это работает` --references--> `parseLead()`  [INFERRED]
  docs/PLATFORM.md → crm/server/leads/parse.ts
- `Статус` --references--> `TallText()`  [INFERRED]
  docs/PLATFORM.md → crm/admin/builder/Editor.tsx
- `Структура` --references--> `SendTemplate()`  [INFERRED]
  DESIGN-IS-2026-10-20/01-evidence.md → crm/admin/pages/ClientPage.tsx
- `Phase 2: Общие компоненты и фокус` --references--> `SendTemplate()`  [INFERRED]
  DESIGN-IS-2026-10-20/05-redesign-plan.md → crm/admin/pages/ClientPage.tsx
- `Статус` --references--> `LeadEditor()`  [INFERRED]
  docs/PLATFORM.md → crm/admin/pages/LeadEditor.tsx

## Import Cycles
- None detected.

## Communities (77 total, 23 thin omitted)

### Community 0 - "booking.ts"
Cohesion: 0.20
Nodes (15): config, handler(), FORMAT_KEYS, isDate(), minskNow(), toLocal(), byDate(), clientContacts() (+7 more)

### Community 1 - "package.json"
Cohesion: 0.15
Nodes (12): name, private, type, version, @breezystack/lamejs, oxlint, tailwindcss, tsx (+4 more)

### Community 2 - "schedule.ts"
Cohesion: 0.11
Nodes (23): Block, BOOK_ORIGIN, clampInt(), cleanWin(), cleanWins(), defaultSchedule(), DOW, DOW_EN (+15 more)

### Community 3 - "repo.ts"
Cohesion: 0.08
Nodes (28): config, handler(), config, handler(), json(), BookingInsert, AudienceClient, BroadcastRow (+20 more)

### Community 4 - "filter.ts"
Cohesion: 0.10
Nodes (35): FieldRow(), FilterBar(), FilterModal(), Preset, applyFilter(), Cond, condLabel(), CondValue (+27 more)

### Community 5 - "dialog.ts"
Cohesion: 0.11
Nodes (26): Content, ensureTopic(), notifyTopic(), sendContent(), TopicMessage, topicTitle(), is429(), Markup (+18 more)

### Community 6 - "ClientPage.tsx"
Cohesion: 0.10
Nodes (35): deleteClient(), esc(), Highlight(), ClientsPage(), DEFAULTS, flatOf(), KNOWN, Row (+27 more)

### Community 7 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+11 more)

### Community 8 - "compilerOptions"
Cohesion: 0.11
Nodes (17): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, moduleResolution, noEmit (+9 more)

### Community 9 - "tools.ts"
Cohesion: 0.07
Nodes (36): emptyStats(), ExportMsg, flattenText(), IMPORT_TAG, ImportPlan, importSlice(), ImportStats, MAX_EXPORT_BYTES (+28 more)

### Community 10 - "ScheduleTab"
Cohesion: 0.19
Nodes (16): active(), hhmm(), ScheduleTab(), svcColor(), CellInfo, DOWS, MonthGrid(), MONTHS (+8 more)

### Community 11 - "vite.config.ts"
Cohesion: 0.20
Nodes (5): @tailwindcss/vite, vite, @vitejs/plugin-react, hasFiles(), pages

### Community 12 - "leads/ingest.ts"
Cohesion: 0.15
Nodes (13): config, handler(), json(), GroupMessage, GroupResult, IngestCtx, ingestGroupMessage(), ingestLead() (+5 more)

### Community 13 - "AgentScene.tsx"
Cohesion: 0.10
Nodes (28): react-dom, accents, AiServices(), AgentScene(), AgentSceneCard(), COPY, Dst, DST_ICON (+20 more)

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
Cohesion: 0.11
Nodes (28): config, handler(), AnalyticsPage(), fromDay(), LlmRow, nf, num(), Period (+20 more)

### Community 18 - "useLang"
Cohesion: 0.20
Nodes (22): Advantages(), AdvantagesData, LeadCapture(), ProcessData, ProcessTabs(), Results(), ResultsData, ServicesGrid() (+14 more)

### Community 21 - "CLAUDE.md"
Cohesion: 0.40
Nodes (4): graphify, Platform handoff, Короткие сессии по разделам (экономия лимитов), Раскладка папок

### Community 27 - "LeadCapture.tsx"
Cohesion: 0.16
Nodes (18): POLICY_PATH, POLICY_VERSION, CONTACTS, Props, TgUser, trustIcons, CookieBanner(), Toggle() (+10 more)

### Community 28 - "Editor.tsx"
Cohesion: 0.07
Nodes (65): Builder(), Inner(), isMobile(), Props, Snap, ACT_TYPES, actText(), autoLayout() (+57 more)

### Community 29 - "server/catalog.ts"
Cohesion: 0.10
Nodes (34): config, handler(), detectServiceInText(), detectServiceKey(), SERVICE_SLUGS, serviceByLabel(), servicesBrief(), SiteService (+26 more)

### Community 30 - "Reveal"
Cohesion: 0.28
Nodes (13): OPERATOR, POLICY_DATE_LABEL, POLICY_DATE_LABEL_EN, Reveal(), SeoOptions, setAlternate(), setMeta(), useSeo() (+5 more)

### Community 31 - "Repo"
Cohesion: 0.10
Nodes (3): AgentTask, RunRow, Repo

### Community 32 - "План: редизайн визуального слоя админки ST96 в брендовом стиле сайта"
Cohesion: 0.05
Nodes (38): TemplatePicker(), tracedRepo(), Evidence, Бренд (сверка админки с сайтом), Вес, Визуал, Структура, Тексты (+30 more)

### Community 33 - "Icon"
Cohesion: 0.19
Nodes (21): AdminApp(), readMin(), Shell(), useNewVersion(), useAuth(), AgentPage(), LIVE, RISK_CHIP (+13 more)

### Community 34 - "BroadcastPage.tsx"
Cohesion: 0.13
Nodes (25): BroadcastPage(), Draft, fromRow(), SAMPLE, toLocalInput(), STATUS_CHIP, blank(), Draft (+17 more)

### Community 35 - "agent/engine.ts"
Cohesion: 0.05
Nodes (75): config, handler(), config, handler(), config, handler(), config, handler() (+67 more)

### Community 36 - "content.ts"
Cohesion: 0.21
Nodes (15): homeEn, servicesEn, ServiceText, Advantage, ProcessStep, Service, services, Stat (+7 more)

### Community 37 - "BookingPage.tsx"
Cohesion: 0.24
Nodes (9): BookingPage(), CHIP, LinkTab(), Requests(), SVC_COLORS, Tab, TimeRange(), ContactLinks() (+1 more)

### Community 43 - "i18n.ts"
Cohesion: 0.26
Nodes (11): Footer(), Header(), Layout(), getServices(), Ui, setPageLanguage(), trackLanguageSwitch(), Window (+3 more)

### Community 44 - "react"
Cohesion: 0.21
Nodes (12): react, App(), CustomCursor(), trackClicks(), Attribution, captureAttribution(), clean(), CLICK_KEYS (+4 more)

### Community 45 - "framer-motion"
Cohesion: 0.17
Nodes (18): clsx, framer-motion, lucide-react, Accent, HomeHero(), ServiceHero(), Aurora(), HeroVideo() (+10 more)

### Community 46 - "0001_core.sql"
Cohesion: 0.10
Nodes (38): clients_phone_key, clients_updated, clients_username_key, funnel_runs_client_idx, funnel_runs_wake_idx, funnels_updated, jobs_due_idx, lead_notes_client_idx (+30 more)

### Community 47 - "booking.test.ts"
Cohesion: 0.15
Nodes (22): input, NOW, S, S30, buildIcs(), esc(), utc(), adminText() (+14 more)

### Community 49 - "BookPage.tsx"
Cohesion: 0.10
Nodes (16): BookPage(), Cfg, Lang, qs, Slot, T, libphonenumber-js, BOOKING_GOALS (+8 more)

### Community 50 - "bot.ts"
Cohesion: 0.13
Nodes (18): beginStart(), createBot(), ensureClient(), From, fullName(), langOf(), linkLeadClient(), loginClaimKey() (+10 more)

### Community 51 - "funnels/engine.ts"
Cohesion: 0.05
Nodes (59): config, runTick(), bookingUrl(), setup(), blankGraph, demoGraph, advance(), Btn (+51 more)

### Community 53 - "0005_broadcasts.sql"
Cohesion: 0.43
Nodes (4): broadcast_recipients_pending, broadcasts_touch, public.broadcast_recipients, public.broadcasts

### Community 54 - "Icon.tsx"
Cohesion: 0.13
Nodes (16): CameraCapture(), isSafari, Shot, touch(), IconName, PATHS, ACCEPT, ext() (+8 more)

### Community 55 - "service.ts"
Cohesion: 0.13
Nodes (19): FormatKey, Schedule, SERVICE_KEYS, ServiceKey, slotAvailable(), toInstant(), BookingInput, cleanNick() (+11 more)

### Community 56 - "SolutionScene.tsx"
Cohesion: 0.14
Nodes (18): ACCENT_POS, COPY, EASE_OUT, EASE_SNAP, enter(), exit(), MOTIF_ROTATE, MOTIF_SCALE (+10 more)

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

### Community 72 - "0010_analytics.sql"
Cohesion: 0.31
Nodes (5): llm_usage_at, public.llm_usage, public.template_events, template_events_at, template_events_tpl

### Community 74 - "public.bookings"
Cohesion: 0.43
Nodes (4): bookings_client, bookings_starts, bookings_status, public.bookings

### Community 77 - "bot.test.ts"
Cohesion: 0.07
Nodes (40): Attribution, clip(), config, handler(), json(), LeadPayload, sendAdEvents(), sha256() (+32 more)

### Community 78 - "build.mjs"
Cohesion: 0.17
Nodes (7): fit(), font, glyphs(), opentype, report, require, variants

### Community 88 - "supabase.ts"
Cohesion: 0.13
Nodes (20): callApi(), AuthCtx, AuthGate(), Ctx, Login(), State, ModelPicker(), Row() (+12 more)

### Community 90 - "booking-admin.ts"
Cohesion: 0.21
Nodes (10): config, handler(), decideBooking(), isHttps(), loadMeetDefault(), saveDirectAdmins(), saveMeetDefault(), saveSchedule() (+2 more)

### Community 91 - "scripts"
Cohesion: 0.33
Nodes (6): scripts, build, dev, lint, preview, test:server

## Knowledge Gaps
- **7 isolated node(s):** `@types/node`, `@types/react`, `@types/react-dom`, `oxlint`, `tailwindcss` (+2 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 461 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **23 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `package.json`, `filter.ts`, `ClientPage.tsx`, `AgentScene.tsx`, `AnalyticsPage.tsx`, `useLang`, `LeadCapture.tsx`, `Editor.tsx`, `Reveal`, `Icon`, `BroadcastPage.tsx`, `agent/engine.ts`, `BookingPage.tsx`, `i18n.ts`, `framer-motion`, `BookPage.tsx`, `Icon.tsx`, `SolutionScene.tsx`, `supabase.ts`?**
  _High betweenness centrality (0.171) - this node is a cross-community bridge._
- **Are the 9 inferred relationships involving `createBot()` (e.g. with `.claimUpdate()` and `.findActiveRun()`) actually correct?**
  _`createBot()` has 9 INFERRED edges - model-reasoned connections that need verification._
- **What connects `@types/node`, `@types/react`, `@types/react-dom` to the rest of the system?**
  _7 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `schedule.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.11231884057971014 - nodes in this community are weakly interconnected._
- **Why does `grammy` connect `repo.ts` to `booking.ts`, `package.json`, `agent/engine.ts`, `dialog.ts`, `tools.ts`, `bot.test.ts`, `booking.test.ts`, `bot.ts`, `funnels/engine.ts`, `booking-admin.ts`?**
  _High betweenness centrality (0.054) - this node is a cross-community bridge._
- **Should `repo.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08405797101449275 - nodes in this community are weakly interconnected._
- **Why does `Repo` connect `Repo` to `booking.ts`, `План: редизайн визуального слоя админки ST96 в брендовом стиле сайта`, `agent/engine.ts`, `repo.ts`, `dialog.ts`, `tools.ts`, `leads/ingest.ts`, `booking.test.ts`, `bot.ts`, `funnels/engine.ts`, `service.ts`, `booking-admin.ts`, `server/catalog.ts`?**
  _High betweenness centrality (0.048) - this node is a cross-community bridge._
# Graph Report - St96  (2026-10-28)

## Corpus Check
- 205 files · ~190,614 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 19 file(s) not represented in the graph (top: .css 13, .woff2 4, (none) 1)

## Summary
- 1421 nodes · 3892 edges · 82 communities (59 shown, 23 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 143 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b028405b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- booking.ts
- package.json
- BookingPage.tsx
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
- react
- Editor.tsx
- manual.ts
- Reveal
- Repo
- План: редизайн визуального слоя админки ST96 в брендовом стиле сайта
- Icon
- BroadcastPage.tsx
- agent/engine.ts
- content.ts
- parse.ts
- DESIGN-IS-2026-10-20/00-scope.md
- DESIGN-IS-2026-10-20/02-scorecard.md
- DESIGN-IS-2026-10-20/03-verdict.md
- llm.ts
- LeadCapture.tsx
- attribution.ts
- ServiceHero.tsx
- 0001_core.sql
- booking.test.ts
- supabaseRepo
- BookPage.tsx
- bot.ts
- funnels/engine.ts
- agent-model.ts
- 0005_broadcasts.sql
- AgentPage.tsx
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
- agent.test.ts
- 0010_analytics.sql
- public.bookings
- normalizeSchedule
- telegram.ts
- bot.test.ts
- build.mjs
- PRINT ST96/README.md
- supabase.ts
- scripts

## God Nodes (most connected - your core abstractions)
1. `Repo` - 84 edges
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
- `Статус` --references--> `TallText()`  [INFERRED]
  docs/PLATFORM.md → crm/admin/builder/Editor.tsx
- `Статус` --references--> `LeadEditor()`  [INFERRED]
  docs/PLATFORM.md → crm/admin/pages/LeadEditor.tsx
- `Статус` --references--> `ContactLinks()`  [INFERRED]
  docs/PLATFORM.md → crm/admin/ui/ContactLinks.tsx
- `Статус` --references--> `MediaField()`  [INFERRED]
  docs/PLATFORM.md → crm/admin/ui/MediaField.tsx

## Import Cycles
- None detected.

## Communities (82 total, 23 thin omitted)

### Community 0 - "booking.ts"
Cohesion: 0.21
Nodes (15): config, handler(), FORMAT_KEYS, isDate(), minskNow(), toLocal(), byDate(), clientContacts() (+7 more)

### Community 1 - "package.json"
Cohesion: 0.15
Nodes (12): name, private, type, version, @breezystack/lamejs, oxlint, tailwindcss, tsx (+4 more)

### Community 2 - "BookingPage.tsx"
Cohesion: 0.09
Nodes (31): CHIP, hhmm(), SVC_COLORS, Tab, Block, BOOK_ORIGIN, DOW, DOW_EN (+23 more)

### Community 3 - "repo.ts"
Cohesion: 0.09
Nodes (23): config, handler(), AgentStats, BookingInsert, AudienceClient, BROADCAST_STATUS, BroadcastRow, BroadcastStatus (+15 more)

### Community 4 - "filter.ts"
Cohesion: 0.10
Nodes (34): FieldRow(), FilterBar(), FilterModal(), Preset, Cond, condLabel(), CondValue, DateValue (+26 more)

### Community 5 - "dialog.ts"
Cohesion: 0.11
Nodes (28): cardText(), Content, ensureTopic(), notifyTopic(), sendContent(), TopicMessage, topicTitle(), is429() (+20 more)

### Community 6 - "ClientPage.tsx"
Cohesion: 0.10
Nodes (41): useAuth(), deleteClient(), esc(), Highlight(), ClientPage(), ClientsPage(), DEFAULTS, flatOf() (+33 more)

### Community 7 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+11 more)

### Community 8 - "compilerOptions"
Cohesion: 0.11
Nodes (17): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, moduleResolution, noEmit (+9 more)

### Community 9 - "tools.ts"
Cohesion: 0.08
Nodes (31): emptyStats(), ExportMsg, flattenText(), IMPORT_TAG, ImportPlan, importSlice(), ImportStats, MAX_EXPORT_BYTES (+23 more)

### Community 10 - "ScheduleTab"
Cohesion: 0.20
Nodes (15): active(), ScheduleTab(), svcColor(), TimeRange(), CellInfo, DOWS, MonthGrid(), MONTHS (+7 more)

### Community 11 - "vite.config.ts"
Cohesion: 0.20
Nodes (5): @tailwindcss/vite, vite, @vitejs/plugin-react, hasFiles(), pages

### Community 12 - "leads/ingest.ts"
Cohesion: 0.14
Nodes (14): config, handler(), json(), GroupMessage, GroupResult, IngestCtx, ingestGroupMessage(), ingestLead() (+6 more)

### Community 13 - "AgentScene.tsx"
Cohesion: 0.11
Nodes (21): react-dom, accents, AgentScene(), AgentSceneCard(), COPY, Dst, DST_ICON, DST_ORDER (+13 more)

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
Nodes (24): AnalyticsPage(), fromDay(), LlmRow, nf, num(), Period, PERIODS, toDay() (+16 more)

### Community 18 - "useLang"
Cohesion: 0.20
Nodes (23): Advantages(), AdvantagesData, AiServices(), HomeHero(), LeadCapture(), ProcessData, ProcessTabs(), Results() (+15 more)

### Community 21 - "CLAUDE.md"
Cohesion: 0.40
Nodes (4): graphify, Platform handoff, Короткие сессии по разделам (экономия лимитов), Раскладка папок

### Community 27 - "react"
Cohesion: 0.19
Nodes (16): react, react-router-dom, App(), CookieBanner(), Toggle(), CustomCursor(), trackClicks(), clearAnalyticsCookies() (+8 more)

### Community 28 - "Editor.tsx"
Cohesion: 0.08
Nodes (61): Builder(), Inner(), isMobile(), Props, Snap, ACT_TYPES, actText(), autoLayout() (+53 more)

### Community 29 - "manual.ts"
Cohesion: 0.17
Nodes (16): config, handler(), detectServiceInText(), cleanInterests(), InterestKey, asParsed(), clean(), cleanFields() (+8 more)

### Community 30 - "Reveal"
Cohesion: 0.22
Nodes (16): OPERATOR, POLICY_DATE_LABEL, POLICY_DATE_LABEL_EN, POLICY_PATH, POLICY_VERSION, Reveal(), SeoOptions, setAlternate() (+8 more)

### Community 31 - "Repo"
Cohesion: 0.08
Nodes (4): AgentTask, showTemplateMenu(), RunRow, Repo

### Community 32 - "План: редизайн визуального слоя админки ST96 в брендовом стиле сайта"
Cohesion: 0.05
Nodes (39): TemplatePicker(), SendTemplate(), tracedRepo(), Evidence, Бренд (сверка админки с сайтом), Вес, Визуал, Структура (+31 more)

### Community 33 - "Icon"
Cohesion: 0.18
Nodes (20): AdminApp(), readMin(), Shell(), useNewVersion(), AgentPage(), BookingPage(), LinkTab(), Requests() (+12 more)

### Community 34 - "BroadcastPage.tsx"
Cohesion: 0.12
Nodes (28): BroadcastPage(), Draft, fromRow(), SAMPLE, toLocalInput(), STATUS_CHIP, blank(), Draft (+20 more)

### Community 35 - "agent/engine.ts"
Cohesion: 0.17
Nodes (25): config, handler(), approveTask(), catalog(), confirmStep(), counted(), createTask(), deleteTask() (+17 more)

### Community 36 - "content.ts"
Cohesion: 0.15
Nodes (19): ADMIN, L, SITE, SITE_EN, homeEn, servicesEn, ServiceText, Advantage (+11 more)

### Community 37 - "parse.ts"
Cohesion: 0.13
Nodes (23): Attribution, clip(), config, handler(), json(), LeadPayload, sendAdEvents(), sha256() (+15 more)

### Community 42 - "llm.ts"
Cohesion: 0.19
Nodes (14): DEFAULT_BASE_URL, DEFAULT_MODELS, Llm, LlmError, openAiCompatible(), parseJson(), record(), testModel() (+6 more)

### Community 43 - "LeadCapture.tsx"
Cohesion: 0.15
Nodes (23): lucide-react, CONTACTS, Footer(), Header(), Layout(), Props, trustIcons, MagneticButton() (+15 more)

### Community 44 - "attribution.ts"
Cohesion: 0.33
Nodes (8): Attribution, captureAttribution(), clean(), CLICK_KEYS, cookie(), readAdIdentifiers(), readAttribution(), UTM_KEYS

### Community 45 - "ServiceHero.tsx"
Cohesion: 0.17
Nodes (15): clsx, framer-motion, Accent, ServiceHero(), Aurora(), HeroVideo(), Props, KeywordOrbit() (+7 more)

### Community 46 - "0001_core.sql"
Cohesion: 0.10
Nodes (38): clients_phone_key, clients_updated, clients_username_key, funnel_runs_client_idx, funnel_runs_wake_idx, funnels_updated, jobs_due_idx, lead_notes_client_idx (+30 more)

### Community 47 - "booking.test.ts"
Cohesion: 0.16
Nodes (20): input, NOW, S, S30, buildIcs(), esc(), utc(), adminText() (+12 more)

### Community 48 - "supabaseRepo"
Cohesion: 0.22
Nodes (15): config, handler(), config, handler(), config, handler(), config, handler() (+7 more)

### Community 49 - "BookPage.tsx"
Cohesion: 0.10
Nodes (16): BookPage(), Cfg, Lang, qs, Slot, T, libphonenumber-js, BOOKING_GOALS (+8 more)

### Community 50 - "bot.ts"
Cohesion: 0.17
Nodes (14): beginStart(), createBot(), ensureClient(), From, fullName(), langOf(), linkLeadClient(), messageKind() (+6 more)

### Community 51 - "funnels/engine.ts"
Cohesion: 0.05
Nodes (59): config, runTick(), bookingUrl(), setup(), blankGraph, demoGraph, advance(), Btn (+51 more)

### Community 52 - "agent-model.ts"
Cohesion: 0.19
Nodes (16): config, handler(), Check, MODEL_SETTING, AUTO_MODEL, CUSTOM_PREFIX, CUSTOM_SETTING, CustomModel (+8 more)

### Community 53 - "0005_broadcasts.sql"
Cohesion: 0.43
Nodes (4): broadcast_recipients_pending, broadcasts_touch, public.broadcast_recipients, public.broadcasts

### Community 54 - "AgentPage.tsx"
Cohesion: 0.13
Nodes (16): LIVE, RISK_CHIP, STATE_ICON, STATUS_CHIP, CameraCapture(), isSafari, Shot, touch() (+8 more)

### Community 55 - "service.ts"
Cohesion: 0.13
Nodes (24): config, handler(), slotAvailable(), toInstant(), BookingInput, cleanNick(), clientFor(), createBooking() (+16 more)

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

### Community 71 - "agent.test.ts"
Cohesion: 0.24
Nodes (10): exportJson(), input, leadText(), mockLlm(), setup(), agentDeps(), fail(), resolveLlm() (+2 more)

### Community 72 - "0010_analytics.sql"
Cohesion: 0.31
Nodes (5): llm_usage_at, public.llm_usage, public.template_events, template_events_at, template_events_tpl

### Community 74 - "public.bookings"
Cohesion: 0.43
Nodes (4): bookings_client, bookings_starts, bookings_status, public.bookings

### Community 75 - "normalizeSchedule"
Cohesion: 0.28
Nodes (8): clampInt(), cleanWin(), cleanWins(), defaultSchedule(), isTime(), normalizeSchedule(), tm(), loadSchedule()

### Community 76 - "telegram.ts"
Cohesion: 0.67
Nodes (3): config, handler(), json()

### Community 77 - "bot.test.ts"
Cohesion: 0.15
Nodes (15): SITE_START_LOCK_MS, priv, staff, START_ENT, user, b64url(), enc, issueSiteRef() (+7 more)

### Community 78 - "build.mjs"
Cohesion: 0.17
Nodes (7): fit(), font, glyphs(), opentype, report, require, variants

### Community 88 - "supabase.ts"
Cohesion: 0.13
Nodes (20): callApi(), AuthCtx, AuthGate(), Ctx, Login(), State, ModelPicker(), Row() (+12 more)

### Community 91 - "scripts"
Cohesion: 0.33
Nodes (6): scripts, build, dev, lint, preview, test:server

## Knowledge Gaps
- **7 isolated node(s):** `@types/node`, `@types/react`, `@types/react-dom`, `oxlint`, `tailwindcss` (+2 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 453 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **23 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `package.json`, `BookingPage.tsx`, `filter.ts`, `ClientPage.tsx`, `AgentScene.tsx`, `AnalyticsPage.tsx`, `useLang`, `Editor.tsx`, `Reveal`, `Icon`, `BroadcastPage.tsx`, `content.ts`, `LeadCapture.tsx`, `ServiceHero.tsx`, `BookPage.tsx`, `agent-model.ts`, `AgentPage.tsx`, `SolutionScene.tsx`, `supabase.ts`?**
  _High betweenness centrality (0.157) - this node is a cross-community bridge._
- **Are the 9 inferred relationships involving `createBot()` (e.g. with `.claimUpdate()` and `.findActiveRun()`) actually correct?**
  _`createBot()` has 9 INFERRED edges - model-reasoned connections that need verification._
- **What connects `@types/node`, `@types/react`, `@types/react-dom` to the rest of the system?**
  _7 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `BookingPage.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.09047619047619047 - nodes in this community are weakly interconnected._
- **Why does `Repo` connect `Repo` to `booking.ts`, `План: редизайн визуального слоя админки ST96 в брендовом стиле сайта`, `agent/engine.ts`, `repo.ts`, `dialog.ts`, `agent.test.ts`, `tools.ts`, `normalizeSchedule`, `leads/ingest.ts`, `booking.test.ts`, `supabaseRepo`, `bot.ts`, `funnels/engine.ts`, `service.ts`, `manual.ts`?**
  _High betweenness centrality (0.065) - this node is a cross-community bridge._
- **Should `repo.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08710801393728224 - nodes in this community are weakly interconnected._
- **Why does `grammy` connect `dialog.ts` to `booking.ts`, `package.json`, `repo.ts`, `agent/engine.ts`, `agent.test.ts`, `tools.ts`, `telegram.ts`, `bot.test.ts`, `booking.test.ts`, `supabaseRepo`, `bot.ts`, `funnels/engine.ts`, `service.ts`?**
  _High betweenness centrality (0.055) - this node is a cross-community bridge._
# Graph Report - St96  (2026-10-27)

## Corpus Check
- 206 files · ~192,200 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 19 file(s) not represented in the graph (top: .css 13, .woff2 4, (none) 1)

## Summary
- 1434 nodes · 3925 edges · 86 communities (63 shown, 23 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 147 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e130a3ed`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- funnels/types.ts
- package.json
- BookingPage.tsx
- Repo
- filter.ts
- dialog.ts
- ClientPage.tsx
- compilerOptions
- compilerOptions
- tools.ts
- supabaseRepo
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
- react
- Editor.tsx
- manual.ts
- Reveal
- repo.ts
- План: редизайн визуального слоя админки ST96 в брендовом стиле сайта
- Icon
- BroadcastPage.tsx
- agent/engine.ts
- content.ts
- deps.ts
- DESIGN-IS-2026-10-20/00-scope.md
- DESIGN-IS-2026-10-20/02-scorecard.md
- DESIGN-IS-2026-10-20/03-verdict.md
- llm.ts
- i18n.ts
- LeadCapture.tsx
- framer-motion
- 0001_core.sql
- notify.ts
- engine.test.ts
- BookPage.tsx
- bot.ts
- funnels/engine.ts
- realFunnel.test.ts
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
- bot.test.ts
- 0010_analytics.sql
- public.bookings
- ST96 «нейросотрудник»: состояние проекта
- PhoneField.tsx
- lead.ts
- build.mjs
- booking-admin.ts
- PRINT ST96/README.md
- ThemeToggle.tsx
- jobs.ts
- VideoNoteField.tsx
- BookingRow
- scripts

## God Nodes (most connected - your core abstractions)
1. `Repo` - 84 edges
2. `react` - 57 edges
3. `Icon()` - 50 edges
4. `createBot()` - 32 edges
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

## Communities (86 total, 23 thin omitted)

### Community 0 - "funnels/types.ts"
Cohesion: 0.18
Nodes (16): Incoming, norm(), pickFunnel(), ActionItem, asArray(), FEdge, FNode, Funnel (+8 more)

### Community 1 - "package.json"
Cohesion: 0.15
Nodes (12): name, private, type, version, libphonenumber-js, oxlint, tailwindcss, tsx (+4 more)

### Community 2 - "BookingPage.tsx"
Cohesion: 0.09
Nodes (42): active(), CHIP, hhmm(), ScheduleTab(), SVC_COLORS, svcColor(), Tab, TimeRange() (+34 more)

### Community 3 - "Repo"
Cohesion: 0.06
Nodes (12): AgentTask, BROADCAST_STATUS, BroadcastRow, BroadcastStatus, canReceive(), FOOTER, isRateLimit(), MEDIA_CAPTION_LIMIT (+4 more)

### Community 4 - "filter.ts"
Cohesion: 0.10
Nodes (35): FieldRow(), FilterBar(), FilterModal(), Preset, applyFilter(), Cond, condLabel(), CondValue (+27 more)

### Community 5 - "dialog.ts"
Cohesion: 0.11
Nodes (29): Content, ensureTopic(), notifyTopic(), sendContent(), threadGone(), TopicMessage, topicTitle(), is429() (+21 more)

### Community 6 - "ClientPage.tsx"
Cohesion: 0.10
Nodes (39): deleteClient(), esc(), Highlight(), ClientsPage(), DEFAULTS, flatOf(), KNOWN, Row (+31 more)

### Community 7 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+11 more)

### Community 8 - "compilerOptions"
Cohesion: 0.11
Nodes (17): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, moduleResolution, noEmit (+9 more)

### Community 9 - "tools.ts"
Cohesion: 0.10
Nodes (24): emptyStats(), ExportMsg, flattenText(), IMPORT_TAG, ImportPlan, importSlice(), ImportStats, MAX_EXPORT_BYTES (+16 more)

### Community 10 - "supabaseRepo"
Cohesion: 0.18
Nodes (21): config, handler(), config, handler(), config, handler(), config, handler() (+13 more)

### Community 11 - "vite.config.ts"
Cohesion: 0.20
Nodes (5): @tailwindcss/vite, vite, @vitejs/plugin-react, hasFiles(), pages

### Community 12 - "parse.ts"
Cohesion: 0.11
Nodes (23): config, handler(), json(), planImport(), detectServiceKey(), GroupMessage, GroupResult, IngestCtx (+15 more)

### Community 13 - "AgentScene.tsx"
Cohesion: 0.10
Nodes (28): AiServices(), AgentScene(), AgentSceneCard(), COPY, Dst, DST_ICON, DST_ORDER, flight() (+20 more)

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
Nodes (21): lucide-react, Advantages(), AdvantagesData, LeadCapture(), ProcessData, ProcessTabs(), Results(), ResultsData (+13 more)

### Community 21 - "CLAUDE.md"
Cohesion: 0.40
Nodes (4): graphify, Platform handoff, Короткие сессии по разделам (экономия лимитов), Раскладка папок

### Community 27 - "react"
Cohesion: 0.17
Nodes (15): react, react-dom, App(), CookieBanner(), Toggle(), CustomCursor(), clearAnalyticsCookies(), Consent (+7 more)

### Community 28 - "Editor.tsx"
Cohesion: 0.07
Nodes (65): Builder(), Inner(), isMobile(), Props, Snap, ACT_TYPES, actText(), autoLayout() (+57 more)

### Community 29 - "manual.ts"
Cohesion: 0.12
Nodes (18): seed(), detectServiceInText(), serviceByLabel(), cleanInterests(), InterestKey, asParsed(), clean(), cleanFields() (+10 more)

### Community 30 - "Reveal"
Cohesion: 0.26
Nodes (14): OPERATOR, POLICY_DATE_LABEL, POLICY_DATE_LABEL_EN, POLICY_VERSION, Reveal(), SeoOptions, setAlternate(), setMeta() (+6 more)

### Community 31 - "repo.ts"
Cohesion: 0.11
Nodes (17): AgentStats, LogLine, Risk, RISK_LABEL, Step, StepState, TASK_STATUS, TaskStatus (+9 more)

### Community 32 - "План: редизайн визуального слоя админки ST96 в брендовом стиле сайта"
Cohesion: 0.06
Nodes (28): TemplatePicker(), Evidence, Бренд (сверка админки с сайтом), Вес, Визуал, Структура, Тексты, Phase 0: Факты (уже собраны, не перепроверять без нужды) (+20 more)

### Community 33 - "Icon"
Cohesion: 0.12
Nodes (33): AdminApp(), readMin(), Shell(), useNewVersion(), callApi(), useAuth(), AgentPage(), BookingPage() (+25 more)

### Community 34 - "BroadcastPage.tsx"
Cohesion: 0.12
Nodes (24): Draft, fromRow(), SAMPLE, toLocalInput(), STATUS_CHIP, blank(), Draft, Editor() (+16 more)

### Community 35 - "agent/engine.ts"
Cohesion: 0.12
Nodes (32): config, handler(), exportJson(), input, leadText(), mockLlm(), setup(), agentDeps() (+24 more)

### Community 36 - "content.ts"
Cohesion: 0.21
Nodes (14): homeEn, ServiceText, accents, Advantage, ProcessStep, Service, Stat, studioAccent (+6 more)

### Community 37 - "deps.ts"
Cohesion: 0.17
Nodes (19): config, handler(), Check, fail(), MODEL_SETTING, resolveLlm(), AUTO_MODEL, CUSTOM_PREFIX (+11 more)

### Community 42 - "llm.ts"
Cohesion: 0.23
Nodes (13): DEFAULT_BASE_URL, DEFAULT_MODELS, Llm, LlmError, openAiCompatible(), parseJson(), record(), testModel() (+5 more)

### Community 43 - "i18n.ts"
Cohesion: 0.34
Nodes (12): react-router-dom, Footer(), Header(), Layout(), getServices(), Ui, setPageLanguage(), langFromPath() (+4 more)

### Community 44 - "LeadCapture.tsx"
Cohesion: 0.19
Nodes (13): services, CONTACTS, Props, TgUser, trustIcons, Attribution, captureAttribution(), clean() (+5 more)

### Community 45 - "framer-motion"
Cohesion: 0.19
Nodes (14): clsx, framer-motion, Accent, HomeHero(), ServiceHero(), Aurora(), HeroVideo(), Props (+6 more)

### Community 46 - "0001_core.sql"
Cohesion: 0.10
Nodes (38): clients_phone_key, clients_updated, clients_username_key, funnel_runs_client_idx, funnel_runs_wake_idx, funnels_updated, jobs_due_idx, lead_notes_client_idx (+30 more)

### Community 47 - "notify.ts"
Cohesion: 0.15
Nodes (24): config, buildIcs(), esc(), utc(), adminText(), chatOf(), minutes(), notifyAdminsNewBooking() (+16 more)

### Community 48 - "engine.test.ts"
Cohesion: 0.21
Nodes (5): blankGraph, demoGraph, Call, Graph, TRIGGER

### Community 49 - "BookPage.tsx"
Cohesion: 0.11
Nodes (18): BookPage(), Cfg, Lang, qs, Slot, T, CellInfo, DOWS (+10 more)

### Community 50 - "bot.ts"
Cohesion: 0.14
Nodes (18): clientFor(), beginStart(), createBot(), ensureClient(), From, fullName(), langOf(), linkLeadClient() (+10 more)

### Community 51 - "funnels/engine.ts"
Cohesion: 0.13
Nodes (25): bookingUrl(), hasFreeSlots(), advance(), CondCtx, DOW, evalRule(), fill(), FORMAT_BY_LABEL (+17 more)

### Community 52 - "realFunnel.test.ts"
Cohesion: 0.20
Nodes (6): Env, groupParts(), fakeTelegram(), graph, Sent, setup()

### Community 53 - "0005_broadcasts.sql"
Cohesion: 0.43
Nodes (4): broadcast_recipients_pending, broadcasts_touch, public.broadcast_recipients, public.broadcasts

### Community 54 - "AgentPage.tsx"
Cohesion: 0.09
Nodes (23): AuthCtx, AuthGate(), Ctx, Login(), State, LIVE, RISK_CHIP, STATE_ICON (+15 more)

### Community 55 - "service.ts"
Cohesion: 0.11
Nodes (29): handler(), input, NOW, S, S30, BOOK_ORIGIN, defaultSchedule(), isDate() (+21 more)

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

### Community 71 - "bot.test.ts"
Cohesion: 0.14
Nodes (9): SITE_START_LOCK_MS, loginUser, priv, setup(), staff, START_ENT, user, setup() (+1 more)

### Community 72 - "0010_analytics.sql"
Cohesion: 0.31
Nodes (5): llm_usage_at, public.llm_usage, public.template_events, template_events_at, template_events_tpl

### Community 74 - "public.bookings"
Cohesion: 0.43
Nodes (4): bookings_client, bookings_starts, bookings_status, public.bookings

### Community 75 - "ST96 «нейросотрудник»: состояние проекта"
Cohesion: 0.16
Nodes (13): config, handler(), json(), tracedRepo(), ST96 «нейросотрудник»: состояние проекта, Дальше (в порядке приоритета), Как это работает, Проверки (+5 more)

### Community 76 - "PhoneField.tsx"
Cohesion: 0.31
Nodes (6): detectCountry(), Examples, flag(), Lib, loadLib(), PhoneField()

### Community 77 - "lead.ts"
Cohesion: 0.13
Nodes (24): Attribution, clip(), config, handler(), json(), LeadPayload, sendAdEvents(), sha256() (+16 more)

### Community 78 - "build.mjs"
Cohesion: 0.17
Nodes (7): fit(), font, glyphs(), opentype, report, require, variants

### Community 79 - "booking-admin.ts"
Cohesion: 0.52
Nodes (5): config, handler(), saveDirectAdmins(), saveMeetDefault(), saveSchedule()

### Community 81 - "ThemeToggle.tsx"
Cohesion: 0.52
Nodes (5): ThemeToggle(), applyTheme(), COLORS, readTheme(), Theme

### Community 82 - "jobs.ts"
Cohesion: 0.47
Nodes (4): config, runTick(), resumeBooking(), resumeRun()

### Community 88 - "VideoNoteField.tsx"
Cohesion: 0.43
Nodes (7): camVideo(), fmt(), mp4Mime(), recordSquare(), trace(), Trim, VideoNoteField()

### Community 90 - "BookingRow"
Cohesion: 0.24
Nodes (5): decideBooking(), isHttps(), loadMeetDefault(), setMeetUrl(), BookingRow

### Community 91 - "scripts"
Cohesion: 0.33
Nodes (6): scripts, build, dev, lint, preview, test:server

## Knowledge Gaps
- **7 isolated node(s):** `@types/node`, `@types/react`, `@types/react-dom`, `oxlint`, `tailwindcss` (+2 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 459 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **23 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `package.json`, `BookingPage.tsx`, `filter.ts`, `ClientPage.tsx`, `AgentScene.tsx`, `AnalyticsPage.tsx`, `useUi`, `Editor.tsx`, `Reveal`, `Icon`, `BroadcastPage.tsx`, `deps.ts`, `i18n.ts`, `LeadCapture.tsx`, `framer-motion`, `BookPage.tsx`, `AgentPage.tsx`, `SolutionScene.tsx`, `PhoneField.tsx`, `ThemeToggle.tsx`, `VideoNoteField.tsx`?**
  _High betweenness centrality (0.153) - this node is a cross-community bridge._
- **Are the 9 inferred relationships involving `createBot()` (e.g. with `.claimUpdate()` and `.findActiveRun()`) actually correct?**
  _`createBot()` has 9 INFERRED edges - model-reasoned connections that need verification._
- **What connects `@types/node`, `@types/react`, `@types/react-dom` to the rest of the system?**
  _7 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `BookingPage.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08599033816425121 - nodes in this community are weakly interconnected._
- **Why does `Repo` connect `Repo` to `agent/engine.ts`, `deps.ts`, `dialog.ts`, `tools.ts`, `ST96 «нейросотрудник»: состояние проекта`, `parse.ts`, `notify.ts`, `booking-admin.ts`, `bot.ts`, `funnels/engine.ts`, `service.ts`, `BookingRow`, `manual.ts`, `repo.ts`?**
  _High betweenness centrality (0.064) - this node is a cross-community bridge._
- **Should `Repo` be split into smaller, more focused modules?**
  _Cohesion score 0.0613107822410148 - nodes in this community are weakly interconnected._
- **Why does `grammy` connect `supabaseRepo` to `package.json`, `agent/engine.ts`, `Repo`, `deps.ts`, `dialog.ts`, `bot.test.ts`, `tools.ts`, `ST96 «нейросотрудник»: состояние проекта`, `lead.ts`, `booking-admin.ts`, `notify.ts`, `jobs.ts`, `bot.ts`, `realFunnel.test.ts`, `service.ts`, `manual.ts`?**
  _High betweenness centrality (0.061) - this node is a cross-community bridge._
# Graph Report - St96  (2026-10-21)

## Corpus Check
- 185 files · ~1,072,776 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 64 file(s) not represented in the graph (top: .woff2 48, .css 13, (none) 1)

## Summary
- 1191 nodes · 3256 edges · 73 communities (59 shown, 14 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 119 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ef2ddc7e`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- server/catalog.ts
- package.json
- react
- Handoff
- supabaseRepo
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
- agent.test.ts
- broadcasts.ts
- Repo
- ST96 «нейросотрудник»: состояние проекта
- Icon
- parse.ts
- service.ts
- manual.ts
- useLang
- DESIGN-IS-2026-10-20/00-scope.md
- DESIGN-IS-2026-10-20/02-scorecard.md
- DESIGN-IS-2026-10-20/03-verdict.md
- BroadcastPage.tsx
- funnels/engine.ts
- i18n.ts
- ServiceHero.tsx
- repo.ts
- tools.ts
- Reveal.tsx
- LeadCapture.tsx
- План: редизайн визуального слоя админки ST96 в брендовом стиле сайта
- leads/ingest.ts
- notify.ts
- BookingPage.tsx
- lead.ts
- bot.ts
- BookPage.tsx
- agent/engine.ts
- MediaField.tsx
- agent-model.ts
- schedule.ts
- PhoneField.tsx
- supabase.ts
- agent/types.ts
- geo.ts
- grammy
- llm.ts
- AdminApp.tsx
- ingest.test.ts
- bot.test.ts
- callApi
- monthAvailability
- Results.tsx

## God Nodes (most connected - your core abstractions)
1. `Repo` - 80 edges
2. `react` - 50 edges
3. `Icon()` - 44 edges
4. `createBot()` - 33 edges
5. `supabaseRepo()` - 29 edges
6. `useLang()` - 25 edges
7. `react-router-dom` - 24 edges
8. `useUi()` - 24 edges
9. `json()` - 22 edges
10. `grammy` - 21 edges

## Surprising Connections (you probably didn't know these)
- `Как это работает` --references--> `parseLead()`  [INFERRED]
  docs/PLATFORM.md → server/leads/parse.ts
- `Статус` --references--> `notifyAdminsNewBooking()`  [INFERRED]
  docs/PLATFORM.md → server/booking/notify.ts
- `Статус` --references--> `clientContacts()`  [INFERRED]
  docs/PLATFORM.md → server/booking/service.ts
- `Статус` --references--> `loadMeetDefault()`  [INFERRED]
  docs/PLATFORM.md → server/booking/service.ts
- `Статус` --references--> `saveMeetDefault()`  [INFERRED]
  docs/PLATFORM.md → server/booking/service.ts

## Import Cycles
- None detected.

## Communities (73 total, 14 thin omitted)

### Community 0 - "server/catalog.ts"
Cohesion: 0.12
Nodes (24): SERVICE_SLUGS, servicesBrief(), SiteService, STOP_WORDS, ADMIN, L, SITE, SITE_EN (+16 more)

### Community 1 - "package.json"
Cohesion: 0.04
Nodes (44): dependencies, @breezystack/lamejs, clsx, framer-motion, grammy, libphonenumber-js, lucide-react, react (+36 more)

### Community 2 - "react"
Cohesion: 0.19
Nodes (15): react, App(), CookieBanner(), Toggle(), CustomCursor(), trackClicks(), clearAnalyticsCookies(), Consent (+7 more)

### Community 3 - "Handoff"
Cohesion: 0.13
Nodes (14): Claude-in-Chrome for Supabase/Vercel, Concluding "DB is empty" from the Supabase SQL grid, Current Best Theory, Current State, Files in Play, Goal, Handoff, Imports with `.ts` extensions (+6 more)

### Community 4 - "supabaseRepo"
Cohesion: 0.19
Nodes (19): config, handler(), config, handler(), config, handler(), config, handler() (+11 more)

### Community 5 - "variants-duplex/build.mjs"
Cohesion: 0.10
Nodes (11): finals, opentype, overview, { PDFDocument }, people, QRCode, qrSvg, require (+3 more)

### Community 6 - "AnalyticsPage.tsx"
Cohesion: 0.14
Nodes (25): costUsd(), DEFAULT_PRICES, FEATURE_LABELS, featureLabel(), parsePrices(), periodStart(), popularityScore(), Price (+17 more)

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
Cohesion: 0.11
Nodes (21): blankGraph, demoGraph, Env, Call, Incoming, norm(), pickFunnel(), ActionItem (+13 more)

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

### Community 27 - "ClientPage.tsx"
Cohesion: 0.14
Nodes (23): SITE_SERVICES, deleteClient(), esc(), Highlight(), ClientsPage(), Row, words(), blank (+15 more)

### Community 28 - "Editor.tsx"
Cohesion: 0.07
Nodes (65): Evidence, Бренд (сверка админки с сайтом), Вес, Визуал, Структура, Тексты, Phase 2: Общие компоненты и фокус, @xyflow/react (+57 more)

### Community 29 - "agent.test.ts"
Cohesion: 0.20
Nodes (11): exportJson(), input, leadText(), mockLlm(), setup(), agentDeps(), fail(), resolveLlm() (+3 more)

### Community 30 - "broadcasts.ts"
Cohesion: 0.10
Nodes (18): config, handler(), BROADCAST_STATUS, BroadcastRow, BroadcastStatus, canReceive(), FOOTER, inAudience() (+10 more)

### Community 31 - "Repo"
Cohesion: 0.08
Nodes (6): AgentTask, decideBooking(), setMeetUrl(), BookingRow, RunRow, Repo

### Community 32 - "ST96 «нейросотрудник»: состояние проекта"
Cohesion: 0.20
Nodes (10): ST96 «нейросотрудник»: состояние проекта, Дальше (в порядке приоритета), Как это работает, Проверки, Секреты и доступы, Стек и адреса, Структура кода, Хвосты (+2 more)

### Community 33 - "Icon"
Cohesion: 0.18
Nodes (19): react-router-dom, AgentPage(), LIVE, RISK_CHIP, STATE_ICON, STATUS_CHIP, Requests(), BroadcastsPage() (+11 more)

### Community 34 - "parse.ts"
Cohesion: 0.24
Nodes (11): planImport(), detectServiceKey(), detectService(), FieldKey, LABELS, LeadOrigin, looksEmail(), looksHandle() (+3 more)

### Community 35 - "service.ts"
Cohesion: 0.10
Nodes (26): input, NOW, S, S30, BOOK_ORIGIN, DayBooking, defaultSchedule(), Schedule (+18 more)

### Community 36 - "manual.ts"
Cohesion: 0.22
Nodes (14): Статус, detectServiceInText(), serviceByLabel(), asParsed(), clean(), cleanFields(), createManualLead(), Key (+6 more)

### Community 37 - "useLang"
Cohesion: 0.23
Nodes (22): Advantages(), AdvantagesData, LeadCapture(), ProcessData, ProcessTabs(), Results(), ServicesGrid(), StaggerGroup() (+14 more)

### Community 42 - "BroadcastPage.tsx"
Cohesion: 0.10
Nodes (30): fillTemplate(), TemplateKind, TemplateRow, TPL_GENERAL, TPL_GOALS, TPL_KINDS, TPL_SERVICES, TPL_TASKS (+22 more)

### Community 43 - "funnels/engine.ts"
Cohesion: 0.11
Nodes (30): config, handler(), bookingUrl(), FORMAT_KEYS, FormatKey, ServiceKey, notifyTopic(), telegramOut() (+22 more)

### Community 44 - "i18n.ts"
Cohesion: 0.21
Nodes (15): Footer(), Header(), Layout(), MagneticButton(), getServices(), Ui, reachGoal(), setPageLanguage() (+7 more)

### Community 45 - "ServiceHero.tsx"
Cohesion: 0.16
Nodes (17): clsx, framer-motion, lucide-react, HomeHero(), ServiceHero(), Aurora(), HeroVideo(), Props (+9 more)

### Community 46 - "repo.ts"
Cohesion: 0.32
Nodes (8): AgentStats, BookingInsert, AudienceClient, JobRow, ClientRow, LeadInsert, MessageInsert, NoteInsert

### Community 47 - "tools.ts"
Cohesion: 0.12
Nodes (23): emptyStats(), ExportMsg, flattenText(), IMPORT_TAG, ImportPlan, importSlice(), ImportStats, MAX_EXPORT_BYTES (+15 more)

### Community 48 - "Reveal.tsx"
Cohesion: 0.33
Nodes (10): Props, Reveal(), OPERATOR, POLICY_DATE_LABEL, POLICY_DATE_LABEL_EN, List(), PrivacyRu(), Section() (+2 more)

### Community 49 - "LeadCapture.tsx"
Cohesion: 0.19
Nodes (13): CONTACTS, Props, trustIcons, POLICY_PATH, POLICY_VERSION, Attribution, captureAttribution(), clean() (+5 more)

### Community 50 - "План: редизайн визуального слоя админки ST96 в брендовом стиле сайта"
Cohesion: 0.20
Nodes (9): Phase 0: Факты (уже собраны, не перепроверять без нужды), Phase 1: Токены (один слой), Phase 3: Честные тексты и состояния, Phase 4: Миграция страниц (по одной, с визуальной проверкой), Phase 5: Вес (ленивая загрузка конструктора), Phase 6: Проверка и закрытие, Primary goal, Не входит в этот план (+1 more)

### Community 51 - "leads/ingest.ts"
Cohesion: 0.23
Nodes (11): config, handler(), json(), GroupResult, IngestCtx, ingestGroupMessage(), ingestLead(), originSource() (+3 more)

### Community 52 - "notify.ts"
Cohesion: 0.23
Nodes (15): config, handler(), buildIcs(), esc(), utc(), adminText(), chatOf(), minutes() (+7 more)

### Community 53 - "BookingPage.tsx"
Cohesion: 0.13
Nodes (20): dayInfo, dayNum(), DOW, dowOf(), hm(), HOLIDAYS_BY, Override, pad() (+12 more)

### Community 54 - "lead.ts"
Cohesion: 0.31
Nodes (9): Attribution, clip(), config, handler(), json(), LeadPayload, sendAdEvents(), sha256() (+1 more)

### Community 55 - "bot.ts"
Cohesion: 0.11
Nodes (21): createBot(), ensureClient(), From, fullName(), langOf(), linkLeadClient(), messageKind(), cardText() (+13 more)

### Community 56 - "BookPage.tsx"
Cohesion: 0.15
Nodes (14): react-dom, addDays(), fromDayNum(), BookPage(), Cfg, Lang, qs, Slot (+6 more)

### Community 57 - "agent/engine.ts"
Cohesion: 0.21
Nodes (22): config, handler(), approveTask(), catalog(), confirmStep(), counted(), createTask(), deleteTask() (+14 more)

### Community 58 - "MediaField.tsx"
Cohesion: 0.21
Nodes (10): CameraCapture(), isSafari, Shot, touch(), ACCEPT, ext(), LIMIT, MediaField() (+2 more)

### Community 59 - "agent-model.ts"
Cohesion: 0.19
Nodes (16): config, handler(), MODEL_SETTING, AUTO_MODEL, CUSTOM_PREFIX, CUSTOM_SETTING, CustomModel, isKnownModel() (+8 more)

### Community 60 - "schedule.ts"
Cohesion: 0.18
Nodes (15): Block, clampInt(), cleanWin(), cleanWins(), DOW_EN, DOW_RU, isDate(), isTime() (+7 more)

### Community 61 - "PhoneField.tsx"
Cohesion: 0.27
Nodes (7): libphonenumber-js, detectCountry(), Examples, flag(), Lib, loadLib(), PhoneField()

### Community 62 - "supabase.ts"
Cohesion: 0.21
Nodes (9): @supabase/supabase-js, AuthCtx, Ctx, State, Funnel, Stat, FUNNEL_STATUS, GROUP_LINK_ID (+1 more)

### Community 63 - "agent/types.ts"
Cohesion: 0.25
Nodes (7): LogLine, Risk, RISK_LABEL, Step, StepState, TASK_STATUS, TaskStatus

### Community 65 - "grammy"
Cohesion: 0.50
Nodes (4): config, handler(), json(), grammy

### Community 66 - "llm.ts"
Cohesion: 0.22
Nodes (14): DEFAULT_BASE_URL, DEFAULT_MODELS, Llm, LlmError, openAiCompatible(), parseJson(), record(), testModel() (+6 more)

### Community 67 - "AdminApp.tsx"
Cohesion: 0.24
Nodes (12): AdminApp(), readMin(), Shell(), useNewVersion(), AuthGate(), Login(), useAuth(), BookingPage() (+4 more)

### Community 68 - "ingest.test.ts"
Cohesion: 0.25
Nodes (3): GroupMessage, LEAD, clientKey()

### Community 69 - "bot.test.ts"
Cohesion: 0.22
Nodes (5): priv, setup(), staff, START_ENT, user

### Community 70 - "callApi"
Cohesion: 0.36
Nodes (5): callApi(), ModelPicker(), Row(), SettingsPage(), Status

### Community 71 - "monthAvailability"
Cohesion: 0.32
Nodes (7): minskNow(), toLocal(), byDate(), daySlots(), hasFreeSlots(), monthAvailability(), toDay()

### Community 72 - "Results.tsx"
Cohesion: 0.50
Nodes (3): ResultsData, AnimatedCounter(), Props

## Knowledge Gaps
- **7 isolated node(s):** `@types/node`, `@types/react`, `@types/react-dom`, `oxlint`, `tailwindcss` (+2 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 424 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **14 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `server/catalog.ts`, `package.json`, `AnalyticsPage.tsx`, `ClientPage.tsx`, `Editor.tsx`, `Icon`, `useLang`, `BroadcastPage.tsx`, `i18n.ts`, `ServiceHero.tsx`, `Reveal.tsx`, `LeadCapture.tsx`, `BookingPage.tsx`, `BookPage.tsx`, `MediaField.tsx`, `agent-model.ts`, `PhoneField.tsx`, `supabase.ts`, `AdminApp.tsx`, `callApi`, `Results.tsx`?**
  _High betweenness centrality (0.137) - this node is a cross-community bridge._
- **Are the 10 inferred relationships involving `createBot()` (e.g. with `.claimUpdate()` and `.findActiveRun()`) actually correct?**
  _`createBot()` has 10 INFERRED edges - model-reasoned connections that need verification._
- **What connects `@types/node`, `@types/react`, `@types/react-dom` to the rest of the system?**
  _7 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `server/catalog.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.11612903225806452 - nodes in this community are weakly interconnected._
- **Why does `Repo` connect `Repo` to `ST96 «нейросотрудник»: состояние проекта`, `service.ts`, `manual.ts`, `supabaseRepo`, `monthAvailability`, `BroadcastPage.tsx`, `funnels/engine.ts`, `engine.test.ts`, `repo.ts`, `tools.ts`, `leads/ingest.ts`, `notify.ts`, `bot.ts`, `agent/engine.ts`, `agent.test.ts`, `broadcasts.ts`?**
  _High betweenness centrality (0.069) - this node is a cross-community bridge._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.04343971631205674 - nodes in this community are weakly interconnected._
- **Why does `grammy` connect `grammy` to `package.json`, `service.ts`, `supabaseRepo`, `bot.test.ts`, `funnels/engine.ts`, `tools.ts`, `notify.ts`, `bot.ts`, `agent/engine.ts`, `agent.test.ts`, `broadcasts.ts`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._
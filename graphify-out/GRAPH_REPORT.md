# Graph Report - St96  (2026-10-22)

## Corpus Check
- 206 files · ~1,175,994 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 69 file(s) not represented in the graph (top: .woff2 52, .css 14, (none) 1)

## Summary
- 1312 nodes · 3609 edges · 69 communities (54 shown, 15 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 127 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e5b626a3`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- server/catalog.ts
- package.json
- App.tsx
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
- repo.ts
- Repo
- ST96 «нейросотрудник»: состояние проекта
- Icon
- parse.ts
- service.ts
- manual.ts
- useUi
- DESIGN-IS-2026-10-20/00-scope.md
- DESIGN-IS-2026-10-20/02-scorecard.md
- DESIGN-IS-2026-10-20/03-verdict.md
- BroadcastPage.tsx
- funnels/engine.ts
- i18n.ts
- framer-motion
- booking/types.ts
- groupImport.ts
- Reveal
- LeadCapture.tsx
- SolutionScene.tsx
- leads/ingest.ts
- booking.test.ts
- ScheduleTab
- lead.ts
- bot.ts
- BookPage.tsx
- agent/engine.ts
- AgentPage.tsx
- BookingPage.tsx
- schedule.ts
- Icon.tsx
- supabase.ts
- tools.ts
- geo.ts
- avatar/build.mjs
- highlight.tsx
- react
- realFunnel.test.ts

## God Nodes (most connected - your core abstractions)
1. `Repo` - 83 edges
2. `react` - 56 edges
3. `Icon()` - 46 edges
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
- `Статус` --references--> `notifyAdminsNewBooking()`  [INFERRED]
  docs/PLATFORM.md → server/booking/notify.ts
- `Статус` --references--> `loadMonth()`  [INFERRED]
  docs/PLATFORM.md → server/booking/service.ts
- `Статус` --references--> `loadDay()`  [INFERRED]
  docs/PLATFORM.md → server/booking/service.ts
- `Статус` --references--> `clientContacts()`  [INFERRED]
  docs/PLATFORM.md → server/booking/service.ts

## Import Cycles
- None detected.

## Communities (69 total, 15 thin omitted)

### Community 0 - "server/catalog.ts"
Cohesion: 0.17
Nodes (18): SiteService, STOP_WORDS, homeEn, servicesEn, ServiceText, studioAccent, studioAdvantages, studioAdvantagesLead (+10 more)

### Community 1 - "package.json"
Cohesion: 0.04
Nodes (44): dependencies, @breezystack/lamejs, clsx, framer-motion, grammy, libphonenumber-js, lucide-react, react (+36 more)

### Community 2 - "App.tsx"
Cohesion: 0.16
Nodes (18): react-dom, App(), CookieBanner(), Toggle(), CustomCursor(), trackClicks(), trackLanguageSwitch(), trackLead() (+10 more)

### Community 3 - "dialog.ts"
Cohesion: 0.15
Nodes (25): cardText(), Content, ensureTopic(), notifyTopic(), sendContent(), TopicMessage, topicTitle(), is429() (+17 more)

### Community 4 - "booking-admin.ts"
Cohesion: 0.24
Nodes (9): config, handler(), decideBooking(), isHttps(), loadMeetDefault(), saveDirectAdmins(), saveMeetDefault(), saveSchedule() (+1 more)

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

### Community 12 - "engine.test.ts"
Cohesion: 0.07
Nodes (26): priv, setup(), staff, START_ENT, user, seed(), SITE_SERVICES, blankGraph (+18 more)

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
Cohesion: 0.18
Nodes (20): deleteClient(), ClientsPage(), Row, words(), blank, Form, Saved, Row (+12 more)

### Community 28 - "Editor.tsx"
Cohesion: 0.05
Nodes (74): Evidence, Бренд (сверка админки с сайтом), Вес, Визуал, Структура, Тексты, Phase 0: Факты (уже собраны, не перепроверять без нужды), Phase 1: Токены (один слой) (+66 more)

### Community 29 - "AgentScene.tsx"
Cohesion: 0.11
Nodes (26): AiServices(), AgentScene(), AgentSceneCard(), COPY, Dst, DST_ICON, DST_ORDER, flight() (+18 more)

### Community 30 - "repo.ts"
Cohesion: 0.08
Nodes (24): config, handler(), AgentStats, BookingInsert, showTemplateMenu(), AudienceClient, BroadcastRow, BroadcastStatus (+16 more)

### Community 31 - "Repo"
Cohesion: 0.09
Nodes (3): AgentTask, RunRow, Repo

### Community 32 - "ST96 «нейросотрудник»: состояние проекта"
Cohesion: 0.10
Nodes (19): ST96 «нейросотрудник»: состояние проекта, Дальше (в порядке приоритета), Как это работает, Проверки, Секреты и доступы, Стек и адреса, Структура кода, Хвосты (+11 more)

### Community 33 - "Icon"
Cohesion: 0.28
Nodes (15): AdminApp(), readMin(), Shell(), useNewVersion(), useAuth(), BroadcastsPage(), ClientPage(), FunnelsPage() (+7 more)

### Community 34 - "parse.ts"
Cohesion: 0.21
Nodes (13): planImport(), detectServiceKey(), clickablePhone(), detectService(), FieldKey, LABELS, LeadOrigin, looksEmail() (+5 more)

### Community 35 - "service.ts"
Cohesion: 0.14
Nodes (25): config, handler(), BOOK_ORIGIN, FORMAT_KEYS, isDate(), isTime(), minskNow(), slotAvailable() (+17 more)

### Community 36 - "manual.ts"
Cohesion: 0.18
Nodes (17): config, handler(), Статус, detectServiceInText(), UNKNOWN_SERVICE, asParsed(), clean(), cleanFields() (+9 more)

### Community 37 - "useUi"
Cohesion: 0.20
Nodes (20): Advantages(), AdvantagesData, LeadCapture(), ProcessData, ProcessTabs(), Results(), ResultsData, ServicesGrid() (+12 more)

### Community 42 - "BroadcastPage.tsx"
Cohesion: 0.13
Nodes (25): BROADCAST_STATUS, validateBroadcast(), fillTemplate(), TPL_KINDS, TPL_VARS, BroadcastPage(), Draft, fromRow() (+17 more)

### Community 43 - "funnels/engine.ts"
Cohesion: 0.11
Nodes (31): bookingUrl(), serviceByLabel(), advance(), Btn, CondCtx, DOW, evalRule(), fill() (+23 more)

### Community 44 - "i18n.ts"
Cohesion: 0.35
Nodes (11): Footer(), Header(), Layout(), getServices(), Ui, setPageLanguage(), langFromPath(), LANGS (+3 more)

### Community 45 - "framer-motion"
Cohesion: 0.17
Nodes (18): clsx, framer-motion, lucide-react, HomeHero(), ServiceHero(), Aurora(), HeroVideo(), Props (+10 more)

### Community 46 - "booking/types.ts"
Cohesion: 0.25
Nodes (5): FormatKey, ServiceKey, BOOKING_STATUS, BookingRow, BookingStatus

### Community 47 - "groupImport.ts"
Cohesion: 0.17
Nodes (14): emptyStats(), ExportMsg, flattenText(), IMPORT_TAG, ImportPlan, importSlice(), ImportStats, MAX_EXPORT_BYTES (+6 more)

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
Cohesion: 0.17
Nodes (12): config, handler(), json(), GroupMessage, GroupResult, IngestCtx, ingestGroupMessage(), ingestLead() (+4 more)

### Community 52 - "booking.test.ts"
Cohesion: 0.14
Nodes (22): input, NOW, S, S30, buildIcs(), esc(), utc(), adminText() (+14 more)

### Community 53 - "ScheduleTab"
Cohesion: 0.14
Nodes (22): addDays(), dayInfo, dayNum(), dowOf(), fromDayNum(), hm(), pad(), tm() (+14 more)

### Community 54 - "lead.ts"
Cohesion: 0.31
Nodes (9): Attribution, clip(), config, handler(), json(), LeadPayload, sendAdEvents(), sha256() (+1 more)

### Community 55 - "bot.ts"
Cohesion: 0.14
Nodes (16): config, handler(), json(), createBot(), ensureClient(), From, fullName(), langOf() (+8 more)

### Community 56 - "BookPage.tsx"
Cohesion: 0.10
Nodes (16): libphonenumber-js, BookPage(), Cfg, Lang, qs, Slot, T, detectCountry() (+8 more)

### Community 57 - "agent/engine.ts"
Cohesion: 0.06
Nodes (76): config, handler(), config, handler(), config, handler(), config, runTick() (+68 more)

### Community 58 - "AgentPage.tsx"
Cohesion: 0.13
Nodes (15): AgentPage(), LIVE, RISK_CHIP, STATE_ICON, STATUS_CHIP, CameraCapture(), isSafari, Shot (+7 more)

### Community 59 - "BookingPage.tsx"
Cohesion: 0.24
Nodes (9): BookingPage(), CHIP, LinkTab(), Requests(), SVC_COLORS, Tab, TimeRange(), ContactLinks() (+1 more)

### Community 60 - "schedule.ts"
Cohesion: 0.12
Nodes (21): Block, clampInt(), cleanWin(), cleanWins(), defaultSchedule(), DOW, DOW_EN, DOW_RU (+13 more)

### Community 61 - "Icon.tsx"
Cohesion: 0.21
Nodes (9): IconName, PATHS, ADMIN, L, SITE, SITE_EN, mp4Mime(), recordSquare() (+1 more)

### Community 62 - "supabase.ts"
Cohesion: 0.17
Nodes (14): @supabase/supabase-js, callApi(), AuthCtx, AuthGate(), Ctx, Login(), State, Check (+6 more)

### Community 63 - "tools.ts"
Cohesion: 0.10
Nodes (23): askJson(), formatStats(), history(), PLANNABLE, prompt(), SERVICE_KEYS, Tool, TOOL_BY_NAME (+15 more)

### Community 65 - "avatar/build.mjs"
Cohesion: 0.25
Nodes (7): fit(), font, glyphs(), opentype, report, require, variants

### Community 67 - "react"
Cohesion: 0.21
Nodes (11): react, react-router-dom, Builder(), Funnel, FunnelPage(), Stat, FUNNEL_STATUS, Row (+3 more)

### Community 68 - "realFunnel.test.ts"
Cohesion: 0.15
Nodes (5): Env, fakeTelegram(), graph, Sent, setup()

## Knowledge Gaps
- **7 isolated node(s):** `@types/node`, `@types/react`, `@types/react-dom`, `oxlint`, `tailwindcss` (+2 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 465 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **15 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `package.json`, `App.tsx`, `AnalyticsPage.tsx`, `ClientPage.tsx`, `Editor.tsx`, `AgentScene.tsx`, `Icon`, `useUi`, `BroadcastPage.tsx`, `i18n.ts`, `framer-motion`, `Reveal`, `LeadCapture.tsx`, `SolutionScene.tsx`, `BookPage.tsx`, `AgentPage.tsx`, `BookingPage.tsx`, `Icon.tsx`, `supabase.ts`, `highlight.tsx`?**
  _High betweenness centrality (0.142) - this node is a cross-community bridge._
- **Are the 10 inferred relationships involving `createBot()` (e.g. with `.claimUpdate()` and `.findActiveRun()`) actually correct?**
  _`createBot()` has 10 INFERRED edges - model-reasoned connections that need verification._
- **What connects `@types/node`, `@types/react`, `@types/react-dom` to the rest of the system?**
  _7 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.04343971631205674 - nodes in this community are weakly interconnected._
- **Why does `Repo` connect `Repo` to `ST96 «нейросотрудник»: состояние проекта`, `service.ts`, `dialog.ts`, `realFunnel.test.ts`, `manual.ts`, `booking-admin.ts`, `funnels/engine.ts`, `engine.test.ts`, `booking/types.ts`, `groupImport.ts`, `leads/ingest.ts`, `booking.test.ts`, `ScheduleTab`, `bot.ts`, `agent/engine.ts`, `repo.ts`, `tools.ts`?**
  _High betweenness centrality (0.068) - this node is a cross-community bridge._
- **Should `dialog.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.146218487394958 - nodes in this community are weakly interconnected._
- **Why does `grammy` connect `agent/engine.ts` to `package.json`, `service.ts`, `booking-admin.ts`, `dialog.ts`, `realFunnel.test.ts`, `funnels/engine.ts`, `engine.test.ts`, `booking.test.ts`, `bot.ts`, `repo.ts`, `tools.ts`?**
  _High betweenness centrality (0.050) - this node is a cross-community bridge._
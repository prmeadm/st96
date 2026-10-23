# Graph Report - St96  (2026-10-23)

## Corpus Check
- 212 files · ~1,184,996 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 69 file(s) not represented in the graph (top: .woff2 52, .css 14, (none) 1)

## Summary
- 1467 nodes · 3910 edges · 91 communities (68 shown, 23 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 134 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `110fdf92`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- content.ts
- package.json
- ServicePage.tsx
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
- repo.ts
- deps.ts
- Home.tsx
- DESIGN-IS-2026-10-20/00-scope.md
- DESIGN-IS-2026-10-20/02-scorecard.md
- DESIGN-IS-2026-10-20/03-verdict.md
- BroadcastPage.tsx
- funnels/engine.ts
- server/catalog.ts
- useUi
- 0001_core.sql
- tools.ts
- Reveal.tsx
- LeadCapture.tsx
- SolutionScene.tsx
- leads/ingest.ts
- broadcasts.ts
- i18n.ts
- react
- service.ts
- BookPage.tsx
- funnels/types.ts
- memoryRepo.ts
- llm.ts
- BookingPage.tsx
- filter.ts
- ST96 «нейросотрудник»: состояние проекта
- realFunnel.test.ts
- geo.ts
- avatar/build.mjs
- agent/engine.ts
- dependencies
- bot.test.ts
- groupImport.ts
- BookingRow
- devDependencies
- 0010_analytics.sql
- PhoneField.tsx
- public.bookings
- 0005_broadcasts.sql
- lead-admin.ts
- engine.test.ts
- 0004_templates.sql
- 0006_agent.sql
- clients_admin_topic_key
- 0007_settings.sql
- 0011_tg_links.sql
- scripts
- auth.tsx
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
- `Стек и адреса` --references--> `main()`  [INFERRED]
  docs/PLATFORM.md → scripts/graph-sections.py
- `Как это работает` --references--> `parseLead()`  [INFERRED]
  docs/PLATFORM.md → server/leads/parse.ts
- `Phase 6: Проверка и закрытие` --references--> `main()`  [INFERRED]
  DESIGN-IS-2026-10-20/05-redesign-plan.md → scripts/graph-sections.py
- `Как запустить и проверить` --references--> `main()`  [INFERRED]
  HANDOFF.md → scripts/graph-sections.py
- `Правила владельца` --references--> `main()`  [INFERRED]
  HANDOFF.md → scripts/graph-sections.py

## Import Cycles
- None detected.

## Communities (91 total, 23 thin omitted)

### Community 0 - "content.ts"
Cohesion: 0.22
Nodes (14): homeEn, servicesEn, ServiceText, studioAccent, studioAdvantages, studioAdvantagesLead, studioProcess, studioProcessLead (+6 more)

### Community 1 - "package.json"
Cohesion: 0.12
Nodes (15): name, private, type, version, @breezystack/lamejs, oxlint, tailwindcss, @tailwindcss/vite (+7 more)

### Community 2 - "ServicePage.tsx"
Cohesion: 0.16
Nodes (17): App(), CONTACTS, CookieBanner(), Toggle(), CustomCursor(), getServiceBySlug(), trackClicks(), clearAnalyticsCookies() (+9 more)

### Community 3 - "dialog.ts"
Cohesion: 0.13
Nodes (26): Content, ensureTopic(), notifyTopic(), sendContent(), TopicMessage, topicTitle(), is429(), Markup (+18 more)

### Community 4 - "booking.test.ts"
Cohesion: 0.13
Nodes (23): input, NOW, S, S30, buildIcs(), esc(), utc(), adminText() (+15 more)

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

### Community 12 - "parse.ts"
Cohesion: 0.13
Nodes (21): Attribution, clip(), config, handler(), json(), LeadPayload, sendAdEvents(), sha256() (+13 more)

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
Nodes (37): applyFilter(), flattenJson(), KnownField, parseConds(), deleteClient(), ClientsPage(), DEFAULTS, flatOf() (+29 more)

### Community 28 - "Editor.tsx"
Cohesion: 0.06
Nodes (73): Evidence, Бренд (сверка админки с сайтом), Вес, Визуал, Структура, Тексты, Phase 2: Общие компоненты и фокус, @xyflow/react (+65 more)

### Community 29 - "AgentScene.tsx"
Cohesion: 0.09
Nodes (31): AiServices(), AgentScene(), AgentSceneCard(), COPY, Dst, DST_ICON, DST_ORDER, flight() (+23 more)

### Community 30 - "Repo"
Cohesion: 0.07
Nodes (4): AgentTask, showTemplateMenu(), RunRow, Repo

### Community 31 - "bot.ts"
Cohesion: 0.25
Nodes (13): createBot(), ensureClient(), From, fullName(), langOf(), linkLeadClient(), messageKind(), handleTopicMessage() (+5 more)

### Community 32 - "План: редизайн визуального слоя админки ST96 в брендовом стиле сайта"
Cohesion: 0.09
Nodes (19): Phase 0: Факты (уже собраны, не перепроверять без нужды), Phase 1: Токены (один слой), Phase 3: Честные тексты и состояния, Phase 4: Миграция страниц (по одной, с визуальной проверкой), Phase 5: Вес (ленивая загрузка конструктора), Phase 6: Проверка и закрытие, Primary goal, Не входит в этот план (+11 more)

### Community 33 - "Icon"
Cohesion: 0.13
Nodes (28): react-router-dom, AdminApp(), readMin(), Shell(), useNewVersion(), useAuth(), AgentPage(), LIVE (+20 more)

### Community 34 - "MediaField.tsx"
Cohesion: 0.21
Nodes (10): CameraCapture(), isSafari, Shot, touch(), ACCEPT, ext(), LIMIT, MediaField() (+2 more)

### Community 35 - "repo.ts"
Cohesion: 0.16
Nodes (23): config, handler(), config, handler(), config, handler(), config, handler() (+15 more)

### Community 36 - "deps.ts"
Cohesion: 0.18
Nodes (19): config, handler(), fail(), MODEL_SETTING, resolveLlm(), testModel(), AUTO_MODEL, CUSTOM_PREFIX (+11 more)

### Community 37 - "Home.tsx"
Cohesion: 0.21
Nodes (16): Advantages(), AdvantagesData, ProcessData, ProcessTabs(), Results(), ResultsData, ServicesGrid(), AnimatedCounter() (+8 more)

### Community 42 - "BroadcastPage.tsx"
Cohesion: 0.11
Nodes (30): BROADCAST_STATUS, fillTemplate(), TemplateKind, TemplateRow, TPL_GENERAL, TPL_GOALS, TPL_KINDS, TPL_SERVICES (+22 more)

### Community 43 - "funnels/engine.ts"
Cohesion: 0.12
Nodes (28): bookingUrl(), advance(), CondCtx, DOW, evalRule(), fill(), FORMAT_BY_LABEL, formatKeyOf() (+20 more)

### Community 44 - "server/catalog.ts"
Cohesion: 0.18
Nodes (16): detectServiceInText(), SERVICE_SLUGS, serviceByLabel(), servicesBrief(), SiteService, STOP_WORDS, UNKNOWN_SERVICE, clean() (+8 more)

### Community 45 - "useUi"
Cohesion: 0.17
Nodes (18): clsx, framer-motion, lucide-react, HomeHero(), ServiceHero(), Aurora(), HeroVideo(), Props (+10 more)

### Community 46 - "0001_core.sql"
Cohesion: 0.10
Nodes (38): clients_phone_key, clients_updated, clients_username_key, funnel_runs_client_idx, funnel_runs_wake_idx, funnels_updated, jobs_due_idx, lead_notes_client_idx (+30 more)

### Community 47 - "tools.ts"
Cohesion: 0.09
Nodes (22): emptyStats(), ImportStats, MAX_EXPORT_BYTES, summarize(), askJson(), history(), PLANNABLE, prompt() (+14 more)

### Community 48 - "Reveal.tsx"
Cohesion: 0.29
Nodes (12): Props, Reveal(), OPERATOR, SeoOptions, setAlternate(), setMeta(), useSeo(), List() (+4 more)

### Community 49 - "LeadCapture.tsx"
Cohesion: 0.16
Nodes (16): LeadCapture(), Props, trustIcons, POLICY_DATE_LABEL, POLICY_DATE_LABEL_EN, POLICY_PATH, POLICY_VERSION, services (+8 more)

### Community 50 - "SolutionScene.tsx"
Cohesion: 0.15
Nodes (17): ACCENT_POS, COPY, EASE_OUT, EASE_SNAP, enter(), exit(), MOTIF_ROTATE, MOTIF_SCALE (+9 more)

### Community 51 - "leads/ingest.ts"
Cohesion: 0.15
Nodes (12): config, handler(), json(), GroupMessage, GroupResult, IngestCtx, ingestGroupMessage(), ingestLead() (+4 more)

### Community 52 - "broadcasts.ts"
Cohesion: 0.13
Nodes (15): config, runTick(), agentDeps(), AudienceClient, BroadcastRow, BroadcastStatus, canReceive(), FOOTER (+7 more)

### Community 53 - "i18n.ts"
Cohesion: 0.30
Nodes (11): Footer(), Header(), Layout(), MagneticButton(), Ui, setPageLanguage(), Lang, langFromPath() (+3 more)

### Community 54 - "react"
Cohesion: 0.16
Nodes (16): react, callApi(), esc(), Highlight(), Check, ModelPicker(), Row(), SettingsPage() (+8 more)

### Community 55 - "service.ts"
Cohesion: 0.14
Nodes (32): config, handler(), Статус, addDays(), dayInfo, dayNum(), fromDayNum(), isDate() (+24 more)

### Community 56 - "BookPage.tsx"
Cohesion: 0.14
Nodes (10): react-dom, BookPage(), Cfg, Lang, qs, Slot, T, BOOKING_GOALS (+2 more)

### Community 57 - "funnels/types.ts"
Cohesion: 0.17
Nodes (16): Incoming, norm(), pickFunnel(), ActionItem, asArray(), FEdge, FNode, Link (+8 more)

### Community 58 - "memoryRepo.ts"
Cohesion: 0.16
Nodes (7): seed(), setup(), JobRow, LEAD, memoryRepo, MessageInsert, NoteInsert

### Community 59 - "llm.ts"
Cohesion: 0.22
Nodes (13): DEFAULT_BASE_URL, DEFAULT_MODELS, Llm, LlmError, openAiCompatible(), parseJson(), record(), UsageRow (+5 more)

### Community 60 - "BookingPage.tsx"
Cohesion: 0.07
Nodes (47): Block, BOOK_ORIGIN, clampInt(), cleanWin(), cleanWins(), DayBooking, defaultSchedule(), DOW (+39 more)

### Community 61 - "filter.ts"
Cohesion: 0.10
Nodes (34): Cond, condLabel(), CondValue, DateValue, ENUM_MAX, FieldDef, FieldKind, Flat (+26 more)

### Community 62 - "ST96 «нейросотрудник»: состояние проекта"
Cohesion: 0.15
Nodes (14): config, handler(), json(), ST96 «нейросотрудник»: состояние проекта, Дальше (в порядке приоритета), Как это работает, Проверки, Секреты и доступы (+6 more)

### Community 63 - "realFunnel.test.ts"
Cohesion: 0.17
Nodes (5): fakeTelegram(), graph, Sent, setup(), Funnel

### Community 65 - "avatar/build.mjs"
Cohesion: 0.25
Nodes (7): fit(), font, glyphs(), opentype, report, require, variants

### Community 66 - "agent/engine.ts"
Cohesion: 0.14
Nodes (29): config, handler(), exportJson(), input, leadText(), mockLlm(), setup(), AgentDeps (+21 more)

### Community 67 - "dependencies"
Cohesion: 0.17
Nodes (12): dependencies, @breezystack/lamejs, clsx, framer-motion, grammy, libphonenumber-js, lucide-react, react (+4 more)

### Community 68 - "bot.test.ts"
Cohesion: 0.17
Nodes (8): priv, setup(), staff, START_ENT, user, SITE_SERVICES, blankGraph, demoGraph

### Community 69 - "groupImport.ts"
Cohesion: 0.24
Nodes (10): ExportMsg, flattenText(), IMPORT_TAG, ImportPlan, importSlice(), parseExport(), pool(), testReason() (+2 more)

### Community 70 - "BookingRow"
Cohesion: 0.21
Nodes (6): decideBooking(), isHttps(), loadMeetDefault(), setMeetUrl(), BookingInsert, BookingRow

### Community 71 - "devDependencies"
Cohesion: 0.18
Nodes (11): devDependencies, oxlint, tailwindcss, @tailwindcss/vite, tsx, @types/node, @types/react, @types/react-dom (+3 more)

### Community 72 - "0010_analytics.sql"
Cohesion: 0.31
Nodes (5): llm_usage_at, public.llm_usage, public.template_events, template_events_at, template_events_tpl

### Community 73 - "PhoneField.tsx"
Cohesion: 0.27
Nodes (7): libphonenumber-js, detectCountry(), Examples, flag(), Lib, loadLib(), PhoneField()

### Community 74 - "public.bookings"
Cohesion: 0.43
Nodes (4): bookings_client, bookings_starts, bookings_status, public.bookings

### Community 75 - "0005_broadcasts.sql"
Cohesion: 0.43
Nodes (4): broadcast_recipients_pending, broadcasts_touch, public.broadcast_recipients, public.broadcasts

### Community 76 - "lead-admin.ts"
Cohesion: 0.43
Nodes (5): config, handler(), asParsed(), createManualLead(), updateManualLead()

### Community 78 - "0004_templates.sql"
Cohesion: 0.83
Nodes (3): public.templates, public.touch_templates(), templates_touch

### Community 79 - "0006_agent.sql"
Cohesion: 0.83
Nodes (3): agent_tasks_status, agent_tasks_touch, public.agent_tasks

### Community 88 - "scripts"
Cohesion: 0.33
Nodes (6): scripts, build, dev, lint, preview, test:server

### Community 89 - "auth.tsx"
Cohesion: 0.40
Nodes (5): AuthCtx, AuthGate(), Ctx, Login(), State

## Knowledge Gaps
- **7 isolated node(s):** `@types/node`, `@types/react`, `@types/react-dom`, `oxlint`, `tailwindcss` (+2 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 502 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **23 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `package.json`, `ServicePage.tsx`, `AnalyticsPage.tsx`, `ClientPage.tsx`, `Editor.tsx`, `AgentScene.tsx`, `Icon`, `MediaField.tsx`, `Home.tsx`, `BroadcastPage.tsx`, `useUi`, `Reveal.tsx`, `LeadCapture.tsx`, `SolutionScene.tsx`, `i18n.ts`, `BookPage.tsx`, `BookingPage.tsx`, `filter.ts`, `PhoneField.tsx`, `auth.tsx`?**
  _High betweenness centrality (0.127) - this node is a cross-community bridge._
- **Are the 10 inferred relationships involving `createBot()` (e.g. with `.claimUpdate()` and `.findActiveRun()`) actually correct?**
  _`createBot()` has 10 INFERRED edges - model-reasoned connections that need verification._
- **What connects `@types/node`, `@types/react`, `@types/react-dom` to the rest of the system?**
  _7 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.11695906432748537 - nodes in this community are weakly interconnected._
- **Why does `Repo` connect `Repo` to `dialog.ts`, `booking.test.ts`, `bot.ts`, `repo.ts`, `deps.ts`, `BroadcastPage.tsx`, `funnels/engine.ts`, `server/catalog.ts`, `tools.ts`, `leads/ingest.ts`, `broadcasts.ts`, `service.ts`, `funnels/types.ts`, `memoryRepo.ts`, `ST96 «нейросотрудник»: состояние проекта`, `realFunnel.test.ts`, `agent/engine.ts`, `groupImport.ts`, `BookingRow`, `lead-admin.ts`?**
  _High betweenness centrality (0.056) - this node is a cross-community bridge._
- **Should `dialog.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.12550607287449392 - nodes in this community are weakly interconnected._
- **Why does `grammy` connect `repo.ts` to `package.json`, `agent/engine.ts`, `dialog.ts`, `deps.ts`, `booking.test.ts`, `bot.test.ts`, `tools.ts`, `broadcasts.ts`, `service.ts`, `funnels/types.ts`, `memoryRepo.ts`, `realFunnel.test.ts`, `ST96 «нейросотрудник»: состояние проекта`, `bot.ts`?**
  _High betweenness centrality (0.037) - this node is a cross-community bridge._
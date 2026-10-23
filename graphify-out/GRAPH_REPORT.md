# Graph Report - St96  (2026-10-23)

## Corpus Check
- 207 files · ~1,177,582 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 69 file(s) not represented in the graph (top: .woff2 52, .css 14, (none) 1)

## Summary
- 1405 nodes · 3748 edges · 88 communities (67 shown, 21 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 132 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `f37df152`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- content.ts
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
- План: редизайн визуального слоя админки ST96 в брендовом стиле сайта
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
- 0001_core.sql
- groupImport.ts
- Reveal
- attribution.ts
- SolutionScene.tsx
- leads/ingest.ts
- notify.ts
- LeadCapture.tsx
- lead.ts
- bot.ts
- BookPage.tsx
- agent/engine.ts
- Icon.tsx
- booking.test.ts
- BookingPage.tsx
- supabase.ts
- ModelPicker.tsx
- tools.ts
- geo.ts
- avatar/build.mjs
- deps.ts
- react
- memoryRepo.ts
- supabaseRepo
- llm.ts
- server/catalog.ts
- 0010_analytics.sql
- jobs.ts
- public.bookings
- 0005_broadcasts.sql
- auth.tsx
- grammy
- 0004_templates.sql
- 0006_agent.sql
- clients_admin_topic_key
- 0007_settings.sql
- 0011_tg_links.sql

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

## Communities (88 total, 21 thin omitted)

### Community 0 - "content.ts"
Cohesion: 0.23
Nodes (13): homeEn, ServiceText, studioAccent, studioAdvantages, studioAdvantagesLead, studioProcess, studioProcessLead, studioQuote (+5 more)

### Community 1 - "package.json"
Cohesion: 0.04
Nodes (44): dependencies, @breezystack/lamejs, clsx, framer-motion, grammy, libphonenumber-js, lucide-react, react (+36 more)

### Community 2 - "App.tsx"
Cohesion: 0.14
Nodes (22): react-dom, App(), Header(), Layout(), CookieBanner(), Toggle(), CustomCursor(), reachGoal() (+14 more)

### Community 3 - "dialog.ts"
Cohesion: 0.14
Nodes (27): cardText(), Content, ensureTopic(), notifyTopic(), relayToAdmins(), sendContent(), threadGone(), TopicMessage (+19 more)

### Community 4 - "booking-admin.ts"
Cohesion: 0.21
Nodes (11): config, handler(), decideBooking(), isHttps(), loadMeetDefault(), saveDirectAdmins(), saveMeetDefault(), saveSchedule() (+3 more)

### Community 5 - "variants-duplex/build.mjs"
Cohesion: 0.10
Nodes (11): finals, opentype, overview, { PDFDocument }, people, QRCode, qrSvg, require (+3 more)

### Community 6 - "AnalyticsPage.tsx"
Cohesion: 0.13
Nodes (25): UsageRow, costUsd(), DEFAULT_PRICES, FEATURE_LABELS, featureLabel(), periodStart(), popularityScore(), Price (+17 more)

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
Nodes (21): blankGraph, demoGraph, Call, Incoming, norm(), pickFunnel(), ActionItem, asArray() (+13 more)

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
Cohesion: 0.16
Nodes (20): SITE_SERVICES, useAuth(), esc(), Highlight(), ClientPage(), SendTemplate(), blank, Form (+12 more)

### Community 28 - "Editor.tsx"
Cohesion: 0.08
Nodes (57): @xyflow/react, Inner(), isMobile(), Props, Snap, ACT_TYPES, actText(), autoLayout() (+49 more)

### Community 29 - "AgentScene.tsx"
Cohesion: 0.12
Nodes (20): AgentScene(), AgentSceneCard(), COPY, Dst, DST_ICON, DST_ORDER, flight(), Live (+12 more)

### Community 30 - "repo.ts"
Cohesion: 0.13
Nodes (16): config, handler(), @supabase/supabase-js, AudienceClient, BroadcastRow, BroadcastStatus, canReceive(), FOOTER (+8 more)

### Community 31 - "Repo"
Cohesion: 0.08
Nodes (4): AgentTask, showTemplateMenu(), RunRow, Repo

### Community 32 - "План: редизайн визуального слоя админки ST96 в брендовом стиле сайта"
Cohesion: 0.05
Nodes (38): Evidence, Бренд (сверка админки с сайтом), Вес, Визуал, Структура, Тексты, Phase 0: Факты (уже собраны, не перепроверять без нужды), Phase 1: Токены (один слой) (+30 more)

### Community 33 - "Icon"
Cohesion: 0.20
Nodes (19): react-router-dom, AdminApp(), readMin(), Shell(), useNewVersion(), AgentPage(), LIVE, RISK_CHIP (+11 more)

### Community 34 - "parse.ts"
Cohesion: 0.22
Nodes (10): planImport(), clientKey(), FieldKey, LABELS, LeadOrigin, looksEmail(), looksHandle(), looksPhone() (+2 more)

### Community 35 - "service.ts"
Cohesion: 0.15
Nodes (26): handler(), Статус, addDays(), fromDayNum(), isDate(), slotAvailable(), toInstant(), BookingInput (+18 more)

### Community 36 - "manual.ts"
Cohesion: 0.21
Nodes (13): detectServiceInText(), asParsed(), clean(), cleanFields(), createManualLead(), Key, LABELS, LeadFields (+5 more)

### Community 37 - "useUi"
Cohesion: 0.22
Nodes (17): Advantages(), AdvantagesData, ProcessData, ProcessTabs(), Results(), ResultsData, ServicesGrid(), AnimatedCounter() (+9 more)

### Community 42 - "BroadcastPage.tsx"
Cohesion: 0.12
Nodes (28): BROADCAST_STATUS, fillTemplate(), TemplateKind, TemplateRow, TPL_GOALS, TPL_KINDS, TPL_SERVICES, TPL_TASKS (+20 more)

### Community 43 - "funnels/engine.ts"
Cohesion: 0.13
Nodes (25): advance(), Btn, CondCtx, DOW, evalRule(), fill(), FORMAT_BY_LABEL, formatKeyOf() (+17 more)

### Community 44 - "i18n.ts"
Cohesion: 0.25
Nodes (14): AiServices(), LeadCapture(), getServiceBySlug(), Ui, SeoOptions, setAlternate(), setMeta(), useSeo() (+6 more)

### Community 45 - "framer-motion"
Cohesion: 0.27
Nodes (10): framer-motion, ServiceHero(), Aurora(), HeroVideo(), Props, KeywordOrbit(), Props, Props (+2 more)

### Community 46 - "0001_core.sql"
Cohesion: 0.10
Nodes (38): clients_phone_key, clients_updated, clients_username_key, funnel_runs_client_idx, funnel_runs_wake_idx, funnels_updated, jobs_due_idx, lead_notes_client_idx (+30 more)

### Community 47 - "groupImport.ts"
Cohesion: 0.17
Nodes (13): emptyStats(), ExportMsg, flattenText(), IMPORT_TAG, ImportPlan, importSlice(), ImportStats, MAX_EXPORT_BYTES (+5 more)

### Community 48 - "Reveal"
Cohesion: 0.35
Nodes (10): Reveal(), OPERATOR, POLICY_DATE_LABEL, POLICY_DATE_LABEL_EN, POLICY_VERSION, List(), PrivacyRu(), Section() (+2 more)

### Community 49 - "attribution.ts"
Cohesion: 0.33
Nodes (8): Attribution, captureAttribution(), clean(), CLICK_KEYS, cookie(), readAdIdentifiers(), readAttribution(), UTM_KEYS

### Community 50 - "SolutionScene.tsx"
Cohesion: 0.14
Nodes (18): ACCENT_POS, COPY, EASE_OUT, EASE_SNAP, enter(), exit(), MOTIF_ROTATE, MOTIF_SCALE (+10 more)

### Community 51 - "leads/ingest.ts"
Cohesion: 0.14
Nodes (13): config, handler(), json(), GroupMessage, GroupResult, IngestCtx, ingestGroupMessage(), ingestLead() (+5 more)

### Community 52 - "notify.ts"
Cohesion: 0.23
Nodes (17): config, buildIcs(), esc(), utc(), adminText(), chatOf(), minutes(), notifyAdminsNewBooking() (+9 more)

### Community 53 - "LeadCapture.tsx"
Cohesion: 0.16
Nodes (18): clsx, lucide-react, CONTACTS, Footer(), HomeHero(), Props, trustIcons, MagneticButton() (+10 more)

### Community 54 - "lead.ts"
Cohesion: 0.29
Nodes (10): Attribution, clip(), config, handler(), json(), LeadPayload, sendAdEvents(), sha256() (+2 more)

### Community 55 - "bot.ts"
Cohesion: 0.20
Nodes (11): createBot(), ensureClient(), From, fullName(), langOf(), linkLeadClient(), messageKind(), handleTopicMessage() (+3 more)

### Community 56 - "BookPage.tsx"
Cohesion: 0.10
Nodes (17): libphonenumber-js, BookPage(), Cfg, Lang, qs, Slot, T, detectCountry() (+9 more)

### Community 57 - "agent/engine.ts"
Cohesion: 0.14
Nodes (29): config, handler(), exportJson(), input, leadText(), mockLlm(), setup(), AgentDeps (+21 more)

### Community 58 - "Icon.tsx"
Cohesion: 0.13
Nodes (16): CameraCapture(), isSafari, Shot, touch(), IconName, PATHS, ACCEPT, ext() (+8 more)

### Community 59 - "booking.test.ts"
Cohesion: 0.14
Nodes (14): input, NOW, S, S30, clampInt(), DayBooking, defaultSchedule(), normalizeSchedule() (+6 more)

### Community 60 - "BookingPage.tsx"
Cohesion: 0.08
Nodes (45): Block, BOOK_ORIGIN, cleanWin(), cleanWins(), dayInfo, dayNum(), DOW, DOW_EN (+37 more)

### Community 61 - "supabase.ts"
Cohesion: 0.19
Nodes (15): deleteClient(), ClientsPage(), Row, words(), Found, NotesPage(), Unassigned(), GROUP_LINK_ID (+7 more)

### Community 62 - "ModelPicker.tsx"
Cohesion: 0.33
Nodes (6): callApi(), Check, ModelPicker(), Row(), SettingsPage(), Status

### Community 63 - "tools.ts"
Cohesion: 0.11
Nodes (19): askJson(), history(), PLANNABLE, prompt(), SERVICE_KEYS, Tool, TOOL_BY_NAME, ToolCtx (+11 more)

### Community 65 - "avatar/build.mjs"
Cohesion: 0.25
Nodes (7): fit(), font, glyphs(), opentype, report, require, variants

### Community 66 - "deps.ts"
Cohesion: 0.19
Nodes (18): config, handler(), fail(), MODEL_SETTING, resolveLlm(), AUTO_MODEL, CUSTOM_PREFIX, CUSTOM_SETTING (+10 more)

### Community 67 - "react"
Cohesion: 0.27
Nodes (9): react, Builder(), Funnel, FunnelPage(), Stat, FUNNEL_STATUS, BackLink(), SaveButton() (+1 more)

### Community 68 - "memoryRepo.ts"
Cohesion: 0.07
Nodes (18): priv, setup(), staff, START_ENT, user, seed(), Env, groupParts() (+10 more)

### Community 69 - "supabaseRepo"
Cohesion: 0.26
Nodes (14): config, handler(), config, handler(), config, handler(), config, handler() (+6 more)

### Community 70 - "llm.ts"
Cohesion: 0.23
Nodes (13): DEFAULT_BASE_URL, DEFAULT_MODELS, Llm, LlmError, openAiCompatible(), parseJson(), record(), testModel() (+5 more)

### Community 71 - "server/catalog.ts"
Cohesion: 0.22
Nodes (9): detectServiceKey(), serviceByLabel(), servicesBrief(), SiteService, STOP_WORDS, UNKNOWN_SERVICE, detectService(), servicesEn (+1 more)

### Community 72 - "0010_analytics.sql"
Cohesion: 0.31
Nodes (5): llm_usage_at, public.llm_usage, public.template_events, template_events_at, template_events_tpl

### Community 73 - "jobs.ts"
Cohesion: 0.43
Nodes (5): config, runTick(), agentDeps(), resumeBooking(), resumeRun()

### Community 74 - "public.bookings"
Cohesion: 0.43
Nodes (4): bookings_client, bookings_starts, bookings_status, public.bookings

### Community 75 - "0005_broadcasts.sql"
Cohesion: 0.43
Nodes (4): broadcast_recipients_pending, broadcasts_touch, public.broadcast_recipients, public.broadcasts

### Community 76 - "auth.tsx"
Cohesion: 0.40
Nodes (5): AuthCtx, AuthGate(), Ctx, Login(), State

### Community 77 - "grammy"
Cohesion: 0.50
Nodes (4): config, handler(), json(), grammy

### Community 78 - "0004_templates.sql"
Cohesion: 0.83
Nodes (3): public.templates, public.touch_templates(), templates_touch

### Community 79 - "0006_agent.sql"
Cohesion: 0.83
Nodes (3): agent_tasks_status, agent_tasks_touch, public.agent_tasks

## Knowledge Gaps
- **7 isolated node(s):** `@types/node`, `@types/react`, `@types/react-dom`, `oxlint`, `tailwindcss` (+2 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 486 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **21 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `package.json`, `App.tsx`, `AnalyticsPage.tsx`, `ClientPage.tsx`, `Editor.tsx`, `AgentScene.tsx`, `Icon`, `useUi`, `BroadcastPage.tsx`, `i18n.ts`, `framer-motion`, `Reveal`, `SolutionScene.tsx`, `LeadCapture.tsx`, `BookPage.tsx`, `Icon.tsx`, `BookingPage.tsx`, `supabase.ts`, `ModelPicker.tsx`, `auth.tsx`?**
  _High betweenness centrality (0.126) - this node is a cross-community bridge._
- **Are the 10 inferred relationships involving `createBot()` (e.g. with `.claimUpdate()` and `.findActiveRun()`) actually correct?**
  _`createBot()` has 10 INFERRED edges - model-reasoned connections that need verification._
- **What connects `@types/node`, `@types/react`, `@types/react-dom` to the rest of the system?**
  _7 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.04343971631205674 - nodes in this community are weakly interconnected._
- **Why does `Repo` connect `Repo` to `План: редизайн визуального слоя админки ST96 в брендовом стиле сайта`, `deps.ts`, `service.ts`, `dialog.ts`, `memoryRepo.ts`, `manual.ts`, `booking-admin.ts`, `funnels/engine.ts`, `engine.test.ts`, `groupImport.ts`, `leads/ingest.ts`, `notify.ts`, `bot.ts`, `agent/engine.ts`, `repo.ts`, `tools.ts`?**
  _High betweenness centrality (0.053) - this node is a cross-community bridge._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.14112903225806453 - nodes in this community are weakly interconnected._
- **Why does `grammy` connect `grammy` to `package.json`, `deps.ts`, `dialog.ts`, `booking-admin.ts`, `supabaseRepo`, `memoryRepo.ts`, `jobs.ts`, `notify.ts`, `bot.ts`, `agent/engine.ts`, `booking.test.ts`, `repo.ts`, `tools.ts`?**
  _High betweenness centrality (0.042) - this node is a cross-community bridge._
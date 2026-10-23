# Graph Report - St96  (2026-10-23)

## Corpus Check
- 211 files · ~1,184,226 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 69 file(s) not represented in the graph (top: .woff2 52, .css 14, (none) 1)

## Summary
- 1462 nodes · 3897 edges · 82 communities (59 shown, 23 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 134 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `0dc92821`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- content.ts
- package.json
- App.tsx
- dialog.ts
- Статус
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
- repo.ts
- Repo
- План: редизайн визуального слоя админки ST96 в брендовом стиле сайта
- Icon
- react
- service.ts
- lead.ts
- useLang
- DESIGN-IS-2026-10-20/00-scope.md
- DESIGN-IS-2026-10-20/02-scorecard.md
- DESIGN-IS-2026-10-20/03-verdict.md
- BroadcastPage.tsx
- funnels/engine.ts
- manual.ts
- framer-motion
- 0001_core.sql
- tools.ts
- LeadCapture.tsx
- attribution.ts
- SolutionScene.tsx
- parse.ts
- booking.test.ts
- i18n.ts
- LeadsPage.tsx
- bot.ts
- BookPage.tsx
- ThemeToggle.tsx
- engine.test.ts
- normalizeSchedule
- BookingPage.tsx
- filter.ts
- videonote.test.ts
- geo.ts
- avatar/build.mjs
- agent/engine.ts
- funnels/types.ts
- realFunnel.test.ts
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

## Communities (82 total, 23 thin omitted)

### Community 0 - "content.ts"
Cohesion: 0.21
Nodes (15): homeEn, servicesEn, ServiceText, studioAccent, studioAdvantages, studioAdvantagesLead, studioProcess, studioProcessLead (+7 more)

### Community 1 - "package.json"
Cohesion: 0.04
Nodes (44): dependencies, @breezystack/lamejs, clsx, framer-motion, grammy, libphonenumber-js, lucide-react, react (+36 more)

### Community 2 - "App.tsx"
Cohesion: 0.16
Nodes (19): react-dom, App(), CookieBanner(), Toggle(), CustomCursor(), reachGoal(), trackClicks(), trackLanguageSwitch() (+11 more)

### Community 3 - "dialog.ts"
Cohesion: 0.14
Nodes (26): cardText(), Content, ensureTopic(), notifyTopic(), sendContent(), TopicMessage, topicTitle(), is429() (+18 more)

### Community 4 - "Статус"
Cohesion: 0.23
Nodes (11): config, handler(), Статус, decideBooking(), isHttps(), loadMeetDefault(), saveDirectAdmins(), saveMeetDefault() (+3 more)

### Community 5 - "variants-duplex/build.mjs"
Cohesion: 0.10
Nodes (11): finals, opentype, overview, { PDFDocument }, people, QRCode, qrSvg, require (+3 more)

### Community 6 - "AnalyticsPage.tsx"
Cohesion: 0.14
Nodes (24): costUsd(), DEFAULT_PRICES, FEATURE_LABELS, featureLabel(), parsePrices(), periodStart(), popularityScore(), Price (+16 more)

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
Cohesion: 0.25
Nodes (4): priv, staff, START_ENT, user

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
Cohesion: 0.13
Nodes (23): @supabase/supabase-js, fillTemplate(), AuthCtx, AuthGate(), Ctx, Login(), State, deleteClient() (+15 more)

### Community 28 - "Editor.tsx"
Cohesion: 0.07
Nodes (65): @xyflow/react, Builder(), Inner(), isMobile(), Props, Snap, ACT_TYPES, actText() (+57 more)

### Community 29 - "AgentScene.tsx"
Cohesion: 0.12
Nodes (20): AgentScene(), AgentSceneCard(), COPY, Dst, DST_ICON, DST_ORDER, flight(), Live (+12 more)

### Community 30 - "repo.ts"
Cohesion: 0.10
Nodes (19): AgentStats, BookingInsert, AudienceClient, BroadcastRow, BroadcastStatus, canReceive(), FOOTER, inAudience() (+11 more)

### Community 31 - "Repo"
Cohesion: 0.07
Nodes (4): AgentTask, showTemplateMenu(), RunRow, Repo

### Community 32 - "План: редизайн визуального слоя админки ST96 в брендовом стиле сайта"
Cohesion: 0.05
Nodes (38): Evidence, Бренд (сверка админки с сайтом), Вес, Визуал, Структура, Тексты, Phase 0: Факты (уже собраны, не перепроверять без нужды), Phase 1: Токены (один слой) (+30 more)

### Community 33 - "Icon"
Cohesion: 0.15
Nodes (27): react-router-dom, AdminApp(), readMin(), Shell(), useNewVersion(), useAuth(), AgentPage(), LIVE (+19 more)

### Community 34 - "react"
Cohesion: 0.10
Nodes (22): react, Check, ModelPicker(), Row(), SettingsPage(), Status, CameraCapture(), isSafari (+14 more)

### Community 35 - "service.ts"
Cohesion: 0.13
Nodes (30): config, handler(), addDays(), FORMAT_KEYS, FORMAT_LABEL, fromDayNum(), isDate(), minskNow() (+22 more)

### Community 36 - "lead.ts"
Cohesion: 0.29
Nodes (10): Attribution, clip(), config, handler(), json(), LeadPayload, sendAdEvents(), sha256() (+2 more)

### Community 37 - "useLang"
Cohesion: 0.17
Nodes (26): Advantages(), AdvantagesData, AiServices(), LeadCapture(), ProcessData, ProcessTabs(), Results(), ResultsData (+18 more)

### Community 42 - "BroadcastPage.tsx"
Cohesion: 0.11
Nodes (30): BROADCAST_STATUS, validateBroadcast(), TemplateKind, TemplateRow, TPL_GOALS, TPL_KINDS, TPL_SERVICES, TPL_TASKS (+22 more)

### Community 43 - "funnels/engine.ts"
Cohesion: 0.12
Nodes (26): serviceByLabel(), advance(), Btn, CondCtx, DOW, evalRule(), fill(), FORMAT_BY_LABEL (+18 more)

### Community 44 - "manual.ts"
Cohesion: 0.12
Nodes (18): setup(), seed(), detectServiceInText(), setup(), asParsed(), clean(), cleanFields(), createManualLead() (+10 more)

### Community 45 - "framer-motion"
Cohesion: 0.19
Nodes (15): clsx, framer-motion, lucide-react, HomeHero(), ServiceHero(), Aurora(), HeroVideo(), Props (+7 more)

### Community 46 - "0001_core.sql"
Cohesion: 0.10
Nodes (38): clients_phone_key, clients_updated, clients_username_key, funnel_runs_client_idx, funnel_runs_wake_idx, funnels_updated, jobs_due_idx, lead_notes_client_idx (+30 more)

### Community 47 - "tools.ts"
Cohesion: 0.07
Nodes (33): emptyStats(), ExportMsg, flattenText(), IMPORT_TAG, ImportPlan, importSlice(), ImportStats, MAX_EXPORT_BYTES (+25 more)

### Community 48 - "LeadCapture.tsx"
Cohesion: 0.23
Nodes (14): CONTACTS, Props, trustIcons, Reveal(), OPERATOR, POLICY_DATE_LABEL, POLICY_DATE_LABEL_EN, POLICY_PATH (+6 more)

### Community 49 - "attribution.ts"
Cohesion: 0.33
Nodes (8): Attribution, captureAttribution(), clean(), CLICK_KEYS, cookie(), readAdIdentifiers(), readAttribution(), UTM_KEYS

### Community 50 - "SolutionScene.tsx"
Cohesion: 0.14
Nodes (18): ACCENT_POS, COPY, EASE_OUT, EASE_SNAP, enter(), exit(), MOTIF_ROTATE, MOTIF_SCALE (+10 more)

### Community 51 - "parse.ts"
Cohesion: 0.11
Nodes (23): config, handler(), json(), planImport(), detectServiceKey(), GroupMessage, GroupResult, IngestCtx (+15 more)

### Community 52 - "booking.test.ts"
Cohesion: 0.14
Nodes (22): input, NOW, S, S30, buildIcs(), esc(), utc(), adminText() (+14 more)

### Community 53 - "i18n.ts"
Cohesion: 0.25
Nodes (13): Footer(), Header(), Layout(), MagneticButton(), Props, tags, getServices(), Ui (+5 more)

### Community 54 - "LeadsPage.tsx"
Cohesion: 0.14
Nodes (24): flattenJson(), KnownField, parseConds(), ClientsPage(), DEFAULTS, flatOf(), KNOWN, Row (+16 more)

### Community 55 - "bot.ts"
Cohesion: 0.18
Nodes (16): config, handler(), json(), createBot(), ensureClient(), From, fullName(), langOf() (+8 more)

### Community 56 - "BookPage.tsx"
Cohesion: 0.10
Nodes (16): libphonenumber-js, BookPage(), Cfg, Lang, qs, Slot, T, detectCountry() (+8 more)

### Community 57 - "ThemeToggle.tsx"
Cohesion: 0.52
Nodes (5): ThemeToggle(), applyTheme(), COLORS, readTheme(), Theme

### Community 58 - "engine.test.ts"
Cohesion: 0.22
Nodes (4): blankGraph, demoGraph, Call, Graph

### Community 59 - "normalizeSchedule"
Cohesion: 0.28
Nodes (8): clampInt(), cleanWin(), cleanWins(), defaultSchedule(), isTime(), normalizeSchedule(), tm(), loadSchedule()

### Community 60 - "BookingPage.tsx"
Cohesion: 0.08
Nodes (43): Block, BOOK_ORIGIN, dayInfo, dayNum(), DOW, DOW_EN, DOW_RU, dowOf() (+35 more)

### Community 61 - "filter.ts"
Cohesion: 0.10
Nodes (35): applyFilter(), Cond, condLabel(), CondValue, DateValue, ENUM_MAX, FieldDef, FieldKind (+27 more)

### Community 65 - "avatar/build.mjs"
Cohesion: 0.25
Nodes (7): fit(), font, glyphs(), opentype, report, require, variants

### Community 66 - "agent/engine.ts"
Cohesion: 0.06
Nodes (81): config, handler(), config, handler(), config, handler(), config, handler() (+73 more)

### Community 67 - "funnels/types.ts"
Cohesion: 0.17
Nodes (16): Incoming, norm(), pickFunnel(), ActionItem, asArray(), FEdge, FNode, Link (+8 more)

### Community 68 - "realFunnel.test.ts"
Cohesion: 0.15
Nodes (6): Env, fakeTelegram(), graph, Sent, setup(), Funnel

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
- **23 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `package.json`, `Icon`, `App.tsx`, `useLang`, `AnalyticsPage.tsx`, `BroadcastPage.tsx`, `framer-motion`, `BookingPage.tsx`, `LeadCapture.tsx`, `AgentScene.tsx`, `SolutionScene.tsx`, `i18n.ts`, `LeadsPage.tsx`, `BookPage.tsx`, `ThemeToggle.tsx`, `ClientPage.tsx`, `Editor.tsx`, `filter.ts`?**
  _High betweenness centrality (0.114) - this node is a cross-community bridge._
- **Are the 10 inferred relationships involving `createBot()` (e.g. with `.claimUpdate()` and `.findActiveRun()`) actually correct?**
  _`createBot()` has 10 INFERRED edges - model-reasoned connections that need verification._
- **What connects `@types/node`, `@types/react`, `@types/react-dom` to the rest of the system?**
  _7 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.04343971631205674 - nodes in this community are weakly interconnected._
- **Why does `Repo` connect `Repo` to `План: редизайн визуального слоя админки ST96 в брендовом стиле сайта`, `agent/engine.ts`, `service.ts`, `dialog.ts`, `funnels/types.ts`, `Статус`, `realFunnel.test.ts`, `BroadcastPage.tsx`, `funnels/engine.ts`, `manual.ts`, `tools.ts`, `parse.ts`, `booking.test.ts`, `repo.ts`, `bot.ts`, `normalizeSchedule`, `videonote.test.ts`?**
  _High betweenness centrality (0.072) - this node is a cross-community bridge._
- **Should `dialog.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.13663663663663664 - nodes in this community are weakly interconnected._
- **Why does `grammy` connect `agent/engine.ts` to `package.json`, `service.ts`, `Статус`, `dialog.ts`, `funnels/types.ts`, `realFunnel.test.ts`, `bot.test.ts`, `manual.ts`, `tools.ts`, `booking.test.ts`, `repo.ts`, `bot.ts`, `videonote.test.ts`?**
  _High betweenness centrality (0.039) - this node is a cross-community bridge._
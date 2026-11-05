# Graph Report - st96-site  (2026-11-05)

## Corpus Check
- 216 files · ~151,149 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 19 file(s) not represented in the graph (top: .css 13, .woff2 4, (none) 1)

## Summary
- 1667 nodes · 4249 edges · 112 communities (75 shown, 37 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 190 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `2313209a`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- funnels/engine.ts
- package.json
- BookingPage.tsx
- TemplatesPage.tsx
- ClientsPage.tsx
- dialog.ts
- ClientPage.tsx
- compilerOptions
- compilerOptions
- tools.ts
- Repo
- booking.ts
- parse.ts
- AgentScene.tsx
- Evidence
- service.ts
- .oxlintrc.json
- MediaField.tsx
- useUi
- Verdict: REFINE
- tsconfig.json
- memoryRepo
- .claude/CLAUDE.md
- 00-scope.md
- 02-scorecard.md
- vercel.json
- 04-handoff-prompt.md
- App.tsx
- Editor.tsx
- SolutionScene.tsx
- Reveal
- 0015_crm_schema.sql
- main
- Icon
- BroadcastPage.tsx
- agent/engine.ts
- База данных ST96
- PhoneField.tsx
- Сайт ST96 — визуальный гид
- DESIGN-IS-2026-10-20/02-scorecard.md
- DESIGN-IS-2026-10-20/03-verdict.md
- DESIGN-IS-2026-10-20/04-handoff-prompt.md
- План: редизайн визуального слоя админки ST96 в брендовом стиле сайта
- leads/ingest.ts
- CRM ST96 — визуальный гид
- react
- 0001_core.sql
- notify.ts
- Evidence
- build.mjs
- ST96 «нейросотрудник»: состояние проекта
- Передача проекта ST96 в новую сессию
- Evidence
- Out
- site/index.html
- Карта проекта и правила размещения файлов
- BookPage.tsx
- 0004_templates.sql
- Verdict: REFINE
- clients_admin_topic_key
- design-is-2026-10-14/00-scope.md
- design-is-2026-10-14/02-scorecard.md
- design-is-2026-10-20/00-scope.md
- 0011_tg_links.sql
- design-is-2026-10-20/02-scorecard.md
- design-is-2026-10-20/03-verdict.md
- toLocal
- planned/README.md
- devDependencies
- public.leads
- realFunnel.test.ts
- 0010_analytics.sql
- 0012_site_consent.sql
- public.bookings
- lead.ts
- 0006_agent.sql
- Google/Gemini API — LLM агента, переводы, ретушь фото
- DESIGN-IS — методика дизайн-аудита (scope → evidence → scorecard → verdict → handoff-prompt → план)
- graphify (скилл + CLI) — граф кода, query/path/explain вместо чтения файлов
- Video thumbnail: AI Websites service (English)
- ST96 — видео (YouTube player page)
- geo.ts
- .claude/CLAUDE.md
- 0013_filter_presets.sql
- tsx / node --test — 117 серверных тестов
- supabase.ts
- tsconfig.json
- booking.test.ts
- 0007_settings.sql
- 0011_tg_links.sql
- .claude/settings.json — хуки и enabledPlugins
- crm/supabase/ — миграции и схема Supabase
- AI agents service video poster (EN)
- AI assistants service video poster (EN)
- AI servers service video poster (EN)
- AI shops service video poster (EN)
- Video thumbnail: Custom Solutions service (English)
- Video thumbnail: Dashboards service (English)
- Video thumbnail: Plugins service (English)
- Video thumbnail: SaaS service (English)
- Video thumbnail: Telegram Mini App service (English)
- Video thumbnail: Web Apps service (English)
- ffmpeg — видео для hero и сжатие роликов
- Плагин hyperframes@hyperframes — кадры/видео-сцены (сейчас выключен)
- team-orchestration — декомпозиция крупных работ на роли
- AI hero section video poster
- Production hero section video poster

## God Nodes (most connected - your core abstractions)
1. `Repo` - 84 edges
2. `react` - 58 edges
3. `Icon()` - 50 edges
4. `createBot()` - 33 edges
5. `supabaseRepo()` - 30 edges
6. `ST96 — визуальный гид (design system)` - 29 edges
7. `grammy` - 27 edges
8. `useLang()` - 27 edges
9. `telegramOut()` - 26 edges
10. `useUi()` - 26 edges

## Surprising Connections (you probably didn't know these)
- `4. Переменные окружения базы` --references--> `dbSchema()`  [INFERRED]
  docs/DATABASE.md → crm/server/env.ts
- `Как это работает` --references--> `parseLead()`  [INFERRED]
  docs/PLATFORM.md → crm/server/leads/parse.ts
- `Верхний уровень` --references--> `PhoneField()`  [INFERRED]
  docs/STRUCTURE.md → shared/ui/PhoneField.tsx
- `Статус` --references--> `TallText()`  [INFERRED]
  docs/PLATFORM.md → crm/admin/builder/Editor.tsx
- `Статус` --references--> `LeadEditor()`  [INFERRED]
  docs/PLATFORM.md → crm/admin/pages/LeadEditor.tsx

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Booking Pipeline (schedule → service → notify → api)** — crm_server_booking_schedule, crm_server_booking_service, crm_server_booking_notify, docs_platform_api_booking, api_booking_admin [EXTRACTED 0.80]
- **Рабочий инструментарий проекта (граф, аудит, деплой, БД, LLM)** — docs_tooling_graphify, docs_tooling_design_is, docs_tooling_vercel_cli, docs_tooling_supabase, docs_tooling_node_toolchain, docs_tooling_gemini_api [EXTRACTED 0.80]
- **Agent Task Pipeline (api/agent → engine → tools → llm → usage)** — docs_platform_api_agent, docs_platform_crm_server_agent_engine, crm_server_agent_tools, docs_platform_crm_server_agent_llm, docs_platform_llm_usage [EXTRACTED 0.85]
- **CRM booking page bootstrap (entry script + preloaded brand fonts)** — crm_book_index, crm_book_index_main_tsx, crm_book_index_inter_cyrillic_woff2, crm_book_index_unbounded_cyrillic_woff2 [EXTRACTED 0.85]
- **Funnel Execution Pipeline (graph → runs → pg_cron jobs → api/jobs)** — crm_server_funnels_engine, docs_platform_pg_cron_jobs, docs_platform_api_jobs, docs_platform_consent_gate [EXTRACTED 0.85]
- **Надёжная отправка медиа в воронках (YouTube, кружки, повторы через /api/jobs)** — docs_platform_youtube_video_block, docs_platform_telegram_rate_limit, docs_platform_yt_html, docs_platform_video_note, docs_platform_jobs_ts [EXTRACTED 0.85]
- **Фильтр заявок/клиентов и интересы заявки** — docs_platform_filter_bar, docs_platform_filter_ts, docs_platform_filter_presets_sql, docs_platform_interests_ts, docs_platform_lead_interests_sql, docs_platform_lead_admin_api [EXTRACTED 0.85]
- **Website Lead Capture to Telegram Flow** — site_src_components_sections_leadcapture, readme__ref__api_lead, readme_telegram_bot_api, readme_lead_flow [EXTRACTED 0.90]
- **Telegram Mini App video playback flow** — site_public_yt, site_public_yt_player_script, site_public_yt_telegram_web_app, site_public_yt_youtube_nocookie_embed [EXTRACTED 0.90]
- **Источники правды по токенам (сайт, админка, /book)** — docs_visual_guide_design_tokens, docs_visual_guide__ref__site_src_index, docs_visual_guide__ref__crm_admin_admin, docs_visual_guide__ref__crm_book_book, docs_visual_guide__ref__crm_book_fonts [EXTRACTED 0.95]
- **ST96 Platform Subsystems** — handoff_st96_platform, handoff_telegram_bot, handoff_supabase, handoff_funnels, handoff_broadcasts, handoff_agent, handoff_booking, handoff_analytics [EXTRACTED 0.95]
- **AI services video poster set (EN/RU)** — site_public_video_ai_services_ai_agents_en, site_public_video_ai_services_ai_agents_ru, site_public_video_ai_services_ai_assistants_en, site_public_video_ai_services_ai_assistants_ru, site_public_video_ai_services_ai_servers_en, site_public_video_ai_services_ai_servers_ru, site_public_video_ai_services_ai_shops_en, site_public_video_ai_services_ai_shops_ru [INFERRED 0.75]
- **English AI-services video thumbnail set** — site_public_video_ai_services_ai_websites_en_thumbnail, site_public_video_ai_services_automation_en_thumbnail, site_public_video_ai_services_custom_solutions_en_thumbnail, site_public_video_ai_services_dashboards_en_thumbnail, site_public_video_ai_services_plugins_en_thumbnail, site_public_video_ai_services_saas_en_thumbnail, site_public_video_ai_services_telegram_mini_app_en_thumbnail, site_public_video_ai_services_web_apps_en_thumbnail [INFERRED 0.85]
- **Russian AI-services video thumbnail set** — site_public_video_ai_services_ai_websites_ru_thumbnail, site_public_video_ai_services_automation_ru_thumbnail, site_public_video_ai_services_custom_solutions_ru_thumbnail, site_public_video_ai_services_dashboards_ru_thumbnail, site_public_video_ai_services_plugins_ru_thumbnail, site_public_video_ai_services_saas_ru_thumbnail, site_public_video_ai_services_telegram_mini_app_ru_thumbnail, site_public_video_ai_services_web_apps_ru_thumbnail [INFERRED 0.85]
- **Семейство связанных проектов ST96 на Vercel** — docs_audit_2026_10_31_st96_site, docs_audit_2026_10_31_retouch_studio, docs_audit_2026_10_31_st96_booth_guide, docs_audit_2026_10_31_st96_stage_videos [INFERRED 0.85]
- **Доставка шрифтов Unbounded/Inter (Google Fonts vs самохостинг)** — site_index, site_index_google_fonts, site_public_fonts, docs_visual_guide_typography, docs_visual_guide__ref__crm_book_fonts [INFERRED 0.85]
- **Переключение тёмной/светлой темы без вспышки** — site_index, docs_visual_guide__ref__site_src_index, docs_visual_guide_light_theme, docs_visual_guide_solid_accent_buttons [INFERRED 0.85]

## Communities (112 total, 37 thin omitted)

### Community 0 - "funnels/engine.ts"
Cohesion: 0.05
Nodes (83): config, handler(), config, handler(), config, handler(), config, handler() (+75 more)

### Community 1 - "package.json"
Cohesion: 0.06
Nodes (75): Builder(), Inner(), isMobile(), Props, Snap, ACT_TYPES, actText(), autoLayout() (+67 more)

### Community 2 - "BookingPage.tsx"
Cohesion: 0.10
Nodes (17): config, handler(), json(), beginStart(), createBot(), ensureClient(), From, fullName() (+9 more)

### Community 3 - "TemplatesPage.tsx"
Cohesion: 0.12
Nodes (24): BroadcastPage(), SendTemplate(), blank(), Draft, Editor(), Filters, preview(), SAMPLE (+16 more)

### Community 4 - "ClientsPage.tsx"
Cohesion: 0.06
Nodes (49): clients_phone_key, clients_updated, clients_username_key, funnel_runs_client_idx, funnel_runs_wake_idx, funnels_updated, jobs_due_idx, lead_notes_client_idx (+41 more)

### Community 5 - "dialog.ts"
Cohesion: 0.10
Nodes (36): FieldRow(), FilterBar(), FilterModal(), Preset, applyFilter(), Cond, condLabel(), CondValue (+28 more)

### Community 6 - "ClientPage.tsx"
Cohesion: 0.10
Nodes (37): deleteClient(), esc(), Highlight(), Requests(), ClientsPage(), DEFAULTS, flatOf(), KNOWN (+29 more)

### Community 7 - "compilerOptions"
Cohesion: 0.08
Nodes (43): active(), BookingPage(), CHIP, hhmm(), LinkTab(), ScheduleTab(), SVC_COLORS, svcColor() (+35 more)

### Community 8 - "compilerOptions"
Cohesion: 0.12
Nodes (29): cardText(), Content, ensureTopic(), notifyTopic(), relayToAdmins(), sendContent(), threadGone(), TopicMessage (+21 more)

### Community 9 - "tools.ts"
Cohesion: 0.12
Nodes (17): Call, setup(), Incoming, norm(), pickFunnel(), ActionItem, asArray(), FEdge (+9 more)

### Community 10 - "Repo"
Cohesion: 0.05
Nodes (27): AgentStats, AgentTask, BookingInsert, showTemplateMenu(), AudienceClient, BroadcastRow, BroadcastStatus, canReceive() (+19 more)

### Community 11 - "booking.ts"
Cohesion: 0.21
Nodes (19): config, handler(), addDays(), dayInfo(), dayNum(), fromDayNum(), isDate(), minskNow() (+11 more)

### Community 12 - "parse.ts"
Cohesion: 0.13
Nodes (28): AdminApp(), readMin(), Shell(), useNewVersion(), useAuth(), AgentPage(), LIVE, RISK_CHIP (+20 more)

### Community 13 - "AgentScene.tsx"
Cohesion: 0.08
Nodes (39): bookingUrl(), SITE_SERVICES, blankGraph, demoGraph, advance(), Btn, CondCtx, DOW (+31 more)

### Community 14 - "Evidence"
Cohesion: 0.10
Nodes (26): callApi(), AuthCtx, AuthGate(), Ctx, Login(), State, Draft, fromRow() (+18 more)

### Community 15 - "service.ts"
Cohesion: 0.11
Nodes (28): config, handler(), BOOK_ORIGIN, Schedule, SERVICE_KEYS, slotAvailable(), toInstant(), BookingInput (+20 more)

### Community 16 - ".oxlintrc.json"
Cohesion: 0.10
Nodes (31): AnalyticsPage(), fromDay(), LlmRow, nf, num(), Period, PERIODS, toDay() (+23 more)

### Community 17 - "MediaField.tsx"
Cohesion: 0.19
Nodes (11): CameraCapture(), isSafari, Shot, touch(), ACCEPT, ext(), LIMIT, MediaField() (+3 more)

### Community 18 - "useUi"
Cohesion: 0.20
Nodes (21): Advantages(), AdvantagesData, LeadCapture(), ProcessData, ProcessTabs(), Results(), ResultsData, ServicesGrid() (+13 more)

### Community 19 - "Verdict: REFINE"
Cohesion: 0.13
Nodes (18): Бренд ST96 (brand/), crm/admin (эталонные внутренние экраны), ST96 — визуальный гид (design system), crm/admin/admin.css, crm/book/book.css, crm/book/fonts.css, HANDOFF.md (правила владельца), site/public/og-image.png (+10 more)

### Community 20 - "tsconfig.json"
Cohesion: 0.16
Nodes (20): Анимации (framer-motion, prefers-reduced-motion), clsx, framer-motion, lucide-react, react, Accent, HomeHero(), ServiceHero() (+12 more)

### Community 21 - "memoryRepo"
Cohesion: 0.22
Nodes (6): setup(), seed(), GroupMessage, LEAD, MemoryRepo, memoryRepo()

### Community 22 - ".claude/CLAUDE.md"
Cohesion: 0.18
Nodes (15): App(), CookieBanner(), Toggle(), CustomCursor(), trackClicks(), trackLead(), clearAnalyticsCookies(), Consent (+7 more)

### Community 23 - "00-scope.md"
Cohesion: 0.15
Nodes (9): BookPage(), Cfg, Lang, qs, Slot, T, BOOKING_GOALS, SERVICE_OPTIONS (+1 more)

### Community 24 - "02-scorecard.md"
Cohesion: 0.08
Nodes (32): emptyStats(), ExportMsg, flattenText(), IMPORT_TAG, ImportPlan, importSlice(), ImportStats, MAX_EXPORT_BYTES (+24 more)

### Community 25 - "vercel.json"
Cohesion: 0.13
Nodes (20): api/lead.ts (Vercel function), site/src/components/layout/Footer.tsx (CONTACTS), AIDA Page Methodology, Website Lead-to-Telegram Flow, Telegram Bot API, POLICY_DATE_LABEL, POLICY_DATE_LABEL_EN, POLICY_PATH (+12 more)

### Community 26 - "04-handoff-prompt.md"
Cohesion: 0.13
Nodes (21): devDependencies, oxlint@^1.81.0, tailwindcss@^4.3.3, tsx@^4.23.15, @types/node@^24.13.3, @types/react@^19.2.18, @types/react-dom@^19.2.7, typescript@~6.0.2 (+13 more)

### Community 27 - "App.tsx"
Cohesion: 0.15
Nodes (21): input, NOW, S, S30, buildIcs(), esc(), utc(), adminText() (+13 more)

### Community 28 - "Editor.tsx"
Cohesion: 0.20
Nodes (16): detectServiceKey(), serviceByLabel(), parseManualText(), clickablePhone(), clientKey(), detectService(), FieldKey, LABELS (+8 more)

### Community 29 - "SolutionScene.tsx"
Cohesion: 0.06
Nodes (42): ST96 Admin HTML Entry, react-dom, accents, AiServices(), AgentScene(), AgentSceneCard(), COPY, Dst (+34 more)

### Community 30 - "Reveal"
Cohesion: 0.24
Nodes (11): upsertClientFromLead(), cleanInterests(), asParsed(), clean(), cleanFields(), createManualLead(), Key, LABELS (+3 more)

### Community 31 - "0015_crm_schema.sql"
Cohesion: 0.14
Nodes (6): crm.analytics_llm(), crm.analytics_templates(), crm.claim_broadcast_recipients(), crm.claim_jobs(), crm.clients_by_note_words(), crm.is_admin()

### Community 32 - "main"
Cohesion: 0.21
Nodes (15): homeEn, servicesEn, ServiceText, Advantage, ProcessStep, Service, services, Stat (+7 more)

### Community 33 - "Icon"
Cohesion: 0.10
Nodes (19): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+11 more)

### Community 34 - "BroadcastPage.tsx"
Cohesion: 0.19
Nodes (12): config, handler(), json(), linkLeadClient(), GroupResult, IngestCtx, ingestGroupMessage(), ingestLead() (+4 more)

### Community 35 - "agent/engine.ts"
Cohesion: 0.15
Nodes (15): SITE_START_LOCK_MS, priv, staff, START_ENT, user, b64url(), enc, issueSiteRef() (+7 more)

### Community 36 - "База данных ST96"
Cohesion: 0.15
Nodes (12): 1. Как устроено сейчас и куда идём, 2. Карта таблиц (все — данные CRM, схема `crm`), 3. Правила (не нарушать), 4. Переменные окружения базы, 5. Миграции, 6. Как применять миграцию схемы (по шагам `0015`, уже выполнено 2026-11-05), База данных ST96, Воронки и очередь (+4 more)

### Community 37 - "PhoneField.tsx"
Cohesion: 0.19
Nodes (10): api/booking.ts (public config/month/day/create/ics/tg_poll), api/geo.ts (x-vercel-ip-country), Admin SPA (/admin), Public booking page /book (crm/book/), detectCountry(), Examples, flag(), Lib (+2 more)

### Community 38 - "Сайт ST96 — визуальный гид"
Cohesion: 0.18
Nodes (9): 1. Источник правды, 2. Палитра (тёмная тема — основная), 3. Светлая тема, 4. Типографика, 5. Форма и ритм, 6. Компоненты и паттерны, 7. Тон и текст, 8. Чек-лист перед пушем (сайт) (+1 more)

### Community 39 - "DESIGN-IS-2026-10-20/02-scorecard.md"
Cohesion: 0.19
Nodes (18): Footer(), Header(), Layout(), ThemeToggle(), getServices(), ui, Ui, setPageLanguage() (+10 more)

### Community 40 - "DESIGN-IS-2026-10-20/03-verdict.md"
Cohesion: 0.34
Nodes (11): OPERATOR, Reveal(), SeoOptions, setAlternate(), setMeta(), useSeo(), List(), PrivacyRu() (+3 more)

### Community 41 - "DESIGN-IS-2026-10-20/04-handoff-prompt.md"
Cohesion: 0.11
Nodes (17): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, moduleResolution, noEmit (+9 more)

### Community 42 - "План: редизайн визуального слоя админки ST96 в брендовом стиле сайта"
Cohesion: 0.20
Nodes (9): Phase 0: Факты (уже собраны, не перепроверять без нужды), Phase 1: Токены (один слой), Phase 3: Честные тексты и состояния, Phase 4: Миграция страниц (по одной, с визуальной проверкой), Phase 5: Вес (ленивая загрузка конструктора), Phase 6: Проверка и закрытие, Primary goal, Не входит в этот план (+1 more)

### Community 43 - "leads/ingest.ts"
Cohesion: 0.16
Nodes (11): Стек и адреса, Как запустить и проверить, Не в репозитории (специально), Передача проекта ST96 в новую сессию, Правила владельца, Секреты (только в Vercel, в код и чат не попадают), Что готово и выложено (всё проверено на проде), Что дальше (по приоритету, по согласованию с владельцем) (+3 more)

### Community 44 - "CRM ST96 — визуальный гид"
Cohesion: 0.20
Nodes (10): 1. Источник правды, 2. Админка: палитра (светлая, единственная), 3. `/book`: палитра (тёмная, как сайт), 4. Типографика и размеры, 5. Форма и ритм админки, 6. Паттерны CRM, 7. Тон и текст, 8. Доступ и индексация (+2 more)

### Community 45 - "react"
Cohesion: 0.14
Nodes (13): graphify, Platform handoff, Per-Section Short Sessions, Короткие сессии по разделам (экономия лимитов), Раскладка папок, graphify-out/graph.json, graphify-out/GRAPH_REPORT.md, graphify-out/sections/index.md (+5 more)

### Community 46 - "0001_core.sql"
Cohesion: 0.13
Nodes (15): dependencies, @breezystack/lamejs@^1.2.7, clsx@^2.1.1, framer-motion@^13.4.0, grammy@^1.46.0, libphonenumber-js@^1.13.15, lucide-react@^1.47.0, react@^19.2.8 (+7 more)

### Community 47 - "notify.ts"
Cohesion: 0.21
Nodes (14): Аудит ST96 и связанных проектов — 2026-10-31, CLAUDE.md проекта, Секреты в .env внутри деплоя retouch-studio, Загрузка шрифтов главной: Google Fonts vs локальные woff2, Сквозной прогон воронки на тестовом клиенте, Проект Vercel retouch-studio, site/index.html (главная st96.by), site/public/fonts (локальные woff2) (+6 more)

### Community 48 - "Evidence"
Cohesion: 0.14
Nodes (8): @tailwindcss/vite@^4.3.3, vite@^8.3.0, site/src/index.css, Site Stack (Vite + React 19 + TypeScript + Tailwind v4 + Framer Motion + React Router), @tailwindcss/vite, vite, hasFiles(), pages

### Community 49 - "build.mjs"
Cohesion: 0.18
Nodes (7): fit(), font, glyphs(), opentype, report, require, variants

### Community 50 - "ST96 «нейросотрудник»: состояние проекта"
Cohesion: 0.20
Nodes (10): detectServiceInText(), servicesBrief(), SiteService, STOP_WORDS, UNKNOWN_SERVICE, api/lead.ts (site form), crm/server/agent/groupImport.ts (import_group_export), crm/server/leads/manual.ts (parseManualText) (+2 more)

### Community 51 - "Передача проекта ST96 в новую сессию"
Cohesion: 0.17
Nodes (13): broadcasts.test.ts — тесты сегмента interests в рассылках, cleanInterests — отбрасывает чужие ключи и повторы, crm/admin/pages/FilterBar.tsx — строка поиска, чипы условий, окно фильтра, Фильтр в «Заявках» и «Клиентах» (окно в духе Битрикс24, сохранённые наборы), 0013_filter_presets.sql — таблица filter_presets (page, name, conds jsonb), filter.test.ts — тесты фильтра заявок/клиентов, crm/server/leads/filter.ts — построение списка полей и типов фильтра, crm/server/leads/interests.ts — ключи и подписи интересов (+5 more)

### Community 52 - "Evidence"
Cohesion: 0.25
Nodes (7): Copy & honesty, Evidence, Known gaps, Print production («states»), Structural, Visual, Weight & resource

### Community 53 - "Out"
Cohesion: 0.21
Nodes (5): Out, ChatPlace, crm/server/repo.ts (Repo interface, Supabase, tracedRepo), crm/supabase/migrations/0001..0011, ST96 Platform

### Community 54 - "site/index.html"
Cohesion: 0.29
Nodes (7): Типографика: Unbounded + Inter, Google Fonts (Unbounded + Inter), Google Tag Manager (GTM-PMSDZV35), site/public/favicon.svg, ST96 favicon (96 logo), site/public/fonts (самохостинг woff2), Open Graph social preview image

### Community 55 - "Карта проекта и правила размещения файлов"
Cohesion: 0.40
Nodes (4): Верхний уровень, Карта проекта и правила размещения файлов, Правила, Сборка и адреса

### Community 56 - "BookPage.tsx"
Cohesion: 0.27
Nodes (10): public.templates, public.touch_templates(), templates_touch, llm_usage_at, public.analytics_llm(), public.analytics_templates(), public.llm_usage, public.template_events (+2 more)

### Community 57 - "0004_templates.sql"
Cohesion: 0.31
Nodes (9): Attribution, clip(), config, handler(), json(), LeadPayload, sendAdEvents(), sha256() (+1 more)

### Community 59 - "clients_admin_topic_key"
Cohesion: 0.22
Nodes (10): tracedRepo(), ST96 «нейросотрудник»: состояние проекта, Дальше (в порядке приоритета), Как это работает, Проверки, Секреты и доступы, Структура кода, Хвосты (+2 more)

### Community 63 - "0011_tg_links.sql"
Cohesion: 0.20
Nodes (10): api/client-log.ts — журнал шагов загрузки кружка с телефона (только админы, до 4 КБ), crm/admin/builder/Editor.tsx — редактор блоков (TallText, MediaField), Медиа в блоках воронки: фото/видео/аудио/файл одним сообщением с подписью, crm/server/media.ts — работа с загруженными медиафайлами, mp4Info — чтение размера и длительности из заголовков MP4, Telegram 429 «retry after 8» при построении предпросмотра ссылки, Кружок Telegram (video note): запись, обрезка, лимит 12 МБ, ui/VideoNoteField.tsx — запись/выбор кружка, смена камеры, окно выбора куска (+2 more)

### Community 68 - "devDependencies"
Cohesion: 0.25
Nodes (8): Gemini Agent (tasks, plan approval, translation), Token and Cost Analytics, Meeting Booking /book, Broadcasts and Templates, Funnel Engine and Visual Builder, ST96 Platform (bot, CRM, booking, funnels), Supabase Data Layer (leads, clients, migrations 0001–0011), Telegram Bot @st96_leads_bot

### Community 70 - "public.leads"
Cohesion: 0.29
Nodes (7): callback_data кнопок fb:<запуск>:<кнопка>:<блок>, Запуск воронки (running/failed, tg_user_id, шаги после паузы), api/jobs.ts — потоковый ответ сразу и результат в конце, crm/server/agent/llm.test.ts — тесты клиента модели, crm/server/agent/llm.ts — клиент модели с общим сроком deadlineMs 21 с, Подтверждение встречи клиенту (.ics-файл с двумя напоминаниями), crm/server/funnels/realFunnel.test.ts — тест на живой схеме воронки

### Community 71 - "realFunnel.test.ts"
Cohesion: 0.33
Nodes (6): Публичная запись /book (лимит 3 заявки в час по телефону/нику), PLATFORM.md — документация платформы (CRM, воронки, фильтры), DESIGN-IS-2026-10-20/05-redesign-plan.md — план редизайна админки (фазы 3–4), .claude/CLAUDE.md — правила проекта, TOOLING.md — инструменты и скиллы проекта, package.json — зависимости и скрипты сборки/тестов

### Community 72 - "0010_analytics.sql"
Cohesion: 0.33
Nodes (5): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema

### Community 73 - "0012_site_consent.sql"
Cohesion: 0.33
Nodes (6): scripts, build, dev, lint, preview, test:server

### Community 74 - "public.bookings"
Cohesion: 0.33
Nodes (6): ST96 — сайт креативной студии, Запуск, Заявки с сайта в Telegram, Сборка, Стек, Структура

### Community 76 - "lead.ts"
Cohesion: 0.40
Nodes (5): CRM booking page (crm/book/index.html), /favicon.svg, /fonts/inter-cyrillic.woff2, /crm/book/main.tsx (entry module), /fonts/unbounded-cyrillic.woff2

### Community 78 - "0006_agent.sql"
Cohesion: 0.83
Nodes (3): agent_tasks_status, agent_tasks_touch, public.agent_tasks

### Community 79 - "Google/Gemini API — LLM агента, переводы, ретушь фото"
Cohesion: 0.50
Nodes (4): api/agent.ts — эндпоинт агента на LLM, Google/Gemini API — LLM агента, переводы, ретушь фото, retouch-studio/src/api/_lib/gemini.ts — клиент Gemini для ретуши, api/translate.ts — эндпоинт переводов

### Community 80 - "DESIGN-IS — методика дизайн-аудита (scope → evidence → scorecard → verdict → handoff-prompt → план)"
Cohesion: 0.50
Nodes (4): DESIGN-IS — методика дизайн-аудита (scope → evidence → scorecard → verdict → handoff-prompt → план), DESIGN-IS-2026-10-14/ — первый дизайн-аудит админки, DESIGN-IS-2026-10-20/ — второй дизайн-аудит и план редизайна, Playwright MCP — живая проверка интерфейса в браузере

### Community 81 - "graphify (скилл + CLI) — граф кода, query/path/explain вместо чтения файлов"
Cohesion: 0.50
Nodes (4): graphify-out/ — артефакты графа кода, scripts/graph-sections.py — вспомогательный скрипт графа, graphify (скилл + CLI) — граф кода, query/path/explain вместо чтения файлов, .claude/skills/graphify/SKILL.md — описание скилла graphify

### Community 82 - "Video thumbnail: AI Websites service (English)"
Cohesion: 0.67
Nodes (4): Video thumbnail: AI Websites service (English), Video thumbnail: AI Websites service (Russian), Video thumbnail: Automation service (English), Video thumbnail: Automation service (Russian)

### Community 83 - "ST96 — видео (YouTube player page)"
Cohesion: 0.83
Nodes (4): ST96 — видео (YouTube player page), Inline player script (IIFE), telegram-web-app.js (Telegram Web App SDK), YouTube nocookie embed iframe

### Community 87 - "tsx / node --test — 117 серверных тестов"
Cohesion: 0.67
Nodes (3): crm/server/**/*.test.ts — серверные тесты (booking, agent, funnels, leads), Node 24 / npm / Vite / TypeScript — сборка сайта и админки, tsc -b, tsx / node --test — 117 серверных тестов

### Community 88 - "supabase.ts"
Cohesion: 0.67
Nodes (3): Риск: .env с живыми ключами в исходниках деплоя retouch-studio, retouch-studio .env в исходниках деплоя (GEMINI_API_KEY, ADMIN_PASSWORD, AUTH_SECRET, ACCESS_CODE, BLOB_READ_WRITE_TOKEN), Vercel CLI 65.8.0 — деплой, проекты, переменные окружения

## Ambiguous Edges - Review These
- `crm/server/bot/dialog.ts (topics, relay, templates menu)` → `crm/server/agent/engine.ts (plan → approve → execute)`  [AMBIGUOUS]
  docs/PLATFORM.md · relation: conceptually_related_to

## Knowledge Gaps
- **111 isolated node(s):** `ffmpeg — видео для hero и сжатие роликов`, `Плагин hyperframes@hyperframes — кадры/видео-сцены (сейчас выключен)`, `team-orchestration — декомпозиция крупных работ на роли`, `Playwright MCP — живая проверка интерфейса в браузере`, `Node 24 / npm / Vite / TypeScript — сборка сайта и админки, tsc -b` (+106 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 562 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **37 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `tsconfig.json` to `package.json`, `TemplatesPage.tsx`, `dialog.ts`, `ClientPage.tsx`, `compilerOptions`, `parse.ts`, `Evidence`, `.oxlintrc.json`, `MediaField.tsx`, `useUi`, `.claude/CLAUDE.md`, `00-scope.md`, `vercel.json`, `04-handoff-prompt.md`, `SolutionScene.tsx`, `PhoneField.tsx`, `DESIGN-IS-2026-10-20/02-scorecard.md`, `DESIGN-IS-2026-10-20/03-verdict.md`, `0001_core.sql`?**
  _High betweenness centrality (0.145) - this node is a cross-community bridge._
- **Are the 9 inferred relationships involving `createBot()` (e.g. with `.claimUpdate()` and `.findActiveRun()`) actually correct?**
  _`createBot()` has 9 INFERRED edges - model-reasoned connections that need verification._
- **What connects `ffmpeg — видео для hero и сжатие роликов`, `Плагин hyperframes@hyperframes — кадры/видео-сцены (сейчас выключен)`, `team-orchestration — декомпозиция крупных работ на роли` to the rest of the system?**
  _111 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `funnels/engine.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.053077058719802506 - nodes in this community are weakly interconnected._
- **Why does `Repo` connect `Repo` to `funnels/engine.ts`, `BookingPage.tsx`, `BroadcastPage.tsx`, `compilerOptions`, `tools.ts`, `clients_admin_topic_key`, `booking.ts`, `AgentScene.tsx`, `service.ts`, `02-scorecard.md`, `App.tsx`, `Reveal`?**
  _High betweenness centrality (0.043) - this node is a cross-community bridge._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.05622489959839357 - nodes in this community are weakly interconnected._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `crm/server/bot/dialog.ts (topics, relay, templates menu)` and `crm/server/agent/engine.ts (plan → approve → execute)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
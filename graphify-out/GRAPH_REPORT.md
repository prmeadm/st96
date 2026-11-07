# Graph Report - st96-site  (2026-11-07)

## Corpus Check
- 217 files · ~153,240 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 19 file(s) not represented in the graph (top: .css 13, .woff2 4, (none) 1)

## Summary
- 1676 nodes · 4284 edges · 117 communities (80 shown, 37 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 190 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `609a6ef8`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- repo.ts
- Editor.tsx
- bot.ts
- TemplatesPage.tsx
- 0001_core.sql
- filter.ts
- ClientPage.tsx
- BookingPage.tsx
- dialog.ts
- engine.test.ts
- Repo
- service.ts
- Footer.tsx
- funnels/engine.ts
- BroadcastPage.tsx
- booking-admin.ts
- AnalyticsPage.tsx
- MediaField.tsx
- useUi
- ST96 — визуальный гид (design system)
- bot.test.ts
- realFunnel.test.ts
- Footer.tsx
- BookPage.tsx
- tools.ts
- LeadCapture.tsx
- package.json
- booking.test.ts
- parse.ts
- AgentScene.tsx
- manual.ts
- 0015_crm_schema.sql
- content.ts
- compilerOptions
- leads/ingest.ts
- bot.test.ts
- База данных ST96
- normalizeSchedule
- AiServices.tsx
- useLang
- Reveal
- compilerOptions
- agent/engine.ts
- Передача проекта ST96 в новую сессию
- framer-motion
- CLAUDE.md
- dependencies
- Аудит ST96 и связанных проектов — 2026-10-31
- vite.config.ts
- build.mjs
- Site Services Catalog
- Фильтр в «Заявках» и «Клиентах» (окно в духе Битрикс24, сохранённые наборы)
- Design Audit Evidence
- Icon
- jobs.ts
- 0010_analytics.sql
- SolutionScene.tsx
- Design Audit Verdict
- ST96 Project Status
- design-is-2026-10-14/00-scope.md
- design-is-2026-10-14/02-scorecard.md
- design-is-2026-10-20/00-scope.md
- Media Upload and Video Notes
- design-is-2026-10-20/02-scorecard.md
- design-is-2026-10-20/03-verdict.md
- ClientRow
- Planned Migrations
- ST96 Platform Components
- Funnel Execution & Meetings
- Project Docs and Booking
- Lint Configuration Rules
- Build and Dev Scripts
- ST96 Website Overview
- CRM Booking Page
- llm.ts
- Agent Task Database
- Gemini Agent & Translations
- Design Audit Methodology
- Code Graph Tooling
- Service Video Thumbnails
- Video Player Page
- Geo Handler Config
- repo.ts
- 0013_filter_presets.sql
- tsx / node --test — 117 серверных тестов
- Риск: .env с живыми ключами в исходниках деплоя retouch-studio
- tsconfig.json
- vercel.json
- agent-model.ts
- App Settings Schema
- Telegram Links Schema
- groupImport.ts
- Claude Code Hooks
- Supabase CRM Schema
- AI Agents Video Poster
- AI Assistants Video Poster
- AI Servers Video Poster
- AI Shops Video Poster
- Custom Solutions Video Thumbnail
- Dashboards Video Thumbnail
- Plugins Video Thumbnail
- SaaS Video Thumbnail
- Telegram Mini App Service
- Video Thumbnail Service
- ST96 Platform
- .claude/CLAUDE.md
- Hero Video Compression
- Hyperframes Video Scenes
- Team Work Decomposition
- ClientPage.tsx
- AI Hero Video Poster
- Production Hero Video Poster

## God Nodes (most connected - your core abstractions)
1. `Repo` - 84 edges
2. `react` - 59 edges
3. `Icon()` - 50 edges
4. `createBot()` - 33 edges
5. `supabaseRepo()` - 30 edges
6. `useLang()` - 29 edges
7. `ST96 — визуальный гид (design system)` - 29 edges
8. `grammy` - 27 edges
9. `telegramOut()` - 26 edges
10. `useUi()` - 26 edges

## Surprising Connections (you probably didn't know these)
- `4. Переменные окружения базы` --references--> `dbSchema()`  [INFERRED]
  docs/DATABASE.md → crm/server/env.ts
- `Как это работает` --references--> `parseLead()`  [INFERRED]
  docs/PLATFORM.md → crm/server/leads/parse.ts
- `Статус` --references--> `TallText()`  [INFERRED]
  docs/PLATFORM.md → crm/admin/builder/Editor.tsx
- `Статус` --references--> `LeadEditor()`  [INFERRED]
  docs/PLATFORM.md → crm/admin/pages/LeadEditor.tsx
- `Статус` --references--> `ContactLinks()`  [INFERRED]
  docs/PLATFORM.md → crm/admin/ui/ContactLinks.tsx

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

## Communities (117 total, 37 thin omitted)

### Community 0 - "repo.ts"
Cohesion: 0.14
Nodes (26): config, handler(), config, handler(), config, handler(), config, handler() (+18 more)

### Community 1 - "Editor.tsx"
Cohesion: 0.05
Nodes (79): Builder(), Inner(), isMobile(), Props, Snap, ACT_TYPES, actText(), autoLayout() (+71 more)

### Community 2 - "bot.ts"
Cohesion: 0.12
Nodes (17): config, handler(), json(), beginStart(), createBot(), ensureClient(), From, fullName() (+9 more)

### Community 3 - "TemplatesPage.tsx"
Cohesion: 0.11
Nodes (30): BroadcastPage(), Draft, fromRow(), SAMPLE, toLocalInput(), STATUS_CHIP, blank(), Draft (+22 more)

### Community 4 - "0001_core.sql"
Cohesion: 0.06
Nodes (49): clients_phone_key, clients_updated, clients_username_key, funnel_runs_client_idx, funnel_runs_wake_idx, funnels_updated, jobs_due_idx, lead_notes_client_idx (+41 more)

### Community 5 - "filter.ts"
Cohesion: 0.10
Nodes (35): FieldRow(), FilterBar(), FilterModal(), Preset, applyFilter(), Cond, condLabel(), CondValue (+27 more)

### Community 6 - "ClientPage.tsx"
Cohesion: 0.13
Nodes (26): ClientsPage(), DEFAULTS, flatOf(), KNOWN, Row, uniq(), words(), blank (+18 more)

### Community 7 - "BookingPage.tsx"
Cohesion: 0.09
Nodes (38): active(), CHIP, hhmm(), ScheduleTab(), SVC_COLORS, svcColor(), Tab, TimeRange() (+30 more)

### Community 8 - "dialog.ts"
Cohesion: 0.13
Nodes (29): Content, ensureTopic(), notifyTopic(), relayToAdmins(), sendContent(), threadGone(), TopicMessage, topicTitle() (+21 more)

### Community 9 - "engine.test.ts"
Cohesion: 0.11
Nodes (19): blankGraph, demoGraph, Call, Incoming, norm(), pickFunnel(), ActionItem, asArray() (+11 more)

### Community 10 - "Repo"
Cohesion: 0.06
Nodes (12): AgentTask, BroadcastRow, isRateLimit(), sleep(), tickBroadcasts(), Funnel, JobRow, RunRow (+4 more)

### Community 11 - "service.ts"
Cohesion: 0.13
Nodes (31): config, handler(), addDays(), FORMAT_KEYS, fromDayNum(), isDate(), minskNow(), slotAvailable() (+23 more)

### Community 12 - "Footer.tsx"
Cohesion: 0.20
Nodes (14): CONTACTS, Footer(), Header(), Layout(), ThemeToggle(), setPageLanguage(), trackLanguageSwitch(), OPEN_EVENT (+6 more)

### Community 13 - "funnels/engine.ts"
Cohesion: 0.12
Nodes (30): bookingUrl(), serviceByLabel(), advance(), CondCtx, DOW, evalRule(), fill(), FORMAT_BY_LABEL (+22 more)

### Community 14 - "BroadcastPage.tsx"
Cohesion: 0.13
Nodes (19): callApi(), Check, ModelPicker(), Row(), SettingsPage(), Status, IconName, PATHS (+11 more)

### Community 15 - "booking-admin.ts"
Cohesion: 0.27
Nodes (6): decideBooking(), isHttps(), loadMeetDefault(), setMeetUrl(), BookingInsert, BookingRow

### Community 16 - "AnalyticsPage.tsx"
Cohesion: 0.10
Nodes (32): AnalyticsPage(), fromDay(), LlmRow, nf, num(), Period, PERIODS, toDay() (+24 more)

### Community 17 - "MediaField.tsx"
Cohesion: 0.19
Nodes (11): CameraCapture(), isSafari, Shot, touch(), ACCEPT, ext(), LIMIT, MediaField() (+3 more)

### Community 18 - "useUi"
Cohesion: 0.23
Nodes (13): clsx, Advantages(), AdvantagesData, Results(), ResultsData, AnimatedCounter(), Props, Props (+5 more)

### Community 19 - "ST96 — визуальный гид (design system)"
Cohesion: 0.05
Nodes (44): Бренд ST96 (brand/), crm/admin (эталонные внутренние экраны), 1. Источник правды, 2. Админка: палитра (светлая, единственная), 3. `/book`: палитра (тёмная, как сайт), 4. Типографика и размеры, 5. Форма и ритм админки, 6. Паттерны CRM (+36 more)

### Community 20 - "bot.test.ts"
Cohesion: 0.15
Nodes (14): SITE_START_LOCK_MS, priv, staff, START_ENT, user, b64url(), enc, mac() (+6 more)

### Community 21 - "realFunnel.test.ts"
Cohesion: 0.18
Nodes (8): setup(), Env, setup(), fakeTelegram(), graph, Sent, setup(), memoryRepo()

### Community 22 - "Footer.tsx"
Cohesion: 0.18
Nodes (15): App(), CookieBanner(), Toggle(), CustomCursor(), trackClicks(), trackLead(), Window, clearAnalyticsCookies() (+7 more)

### Community 23 - "BookPage.tsx"
Cohesion: 0.07
Nodes (23): BookPage(), Cfg, Lang, qs, Slot, T, api/booking.ts (public config/month/day/create/ics/tg_poll), api/geo.ts (x-vercel-ip-country) (+15 more)

### Community 24 - "tools.ts"
Cohesion: 0.11
Nodes (19): askJson(), history(), PLANNABLE, prompt(), SERVICE_KEYS, Tool, TOOL_BY_NAME, ToolCtx (+11 more)

### Community 25 - "LeadCapture.tsx"
Cohesion: 0.15
Nodes (17): api/lead.ts (Vercel function), site/src/components/layout/Footer.tsx (CONTACTS), AIDA Page Methodology, Website Lead-to-Telegram Flow, Telegram Bot API, POLICY_PATH, POLICY_VERSION, Props (+9 more)

### Community 26 - "package.json"
Cohesion: 0.13
Nodes (21): devDependencies, oxlint@^1.81.0, tailwindcss@^4.3.3, tsx@^4.23.15, @types/node@^24.13.3, @types/react@^19.2.18, @types/react-dom@^19.2.7, typescript@~6.0.2 (+13 more)

### Community 27 - "booking.test.ts"
Cohesion: 0.13
Nodes (25): input, NOW, S, S30, buildIcs(), esc(), utc(), adminText() (+17 more)

### Community 28 - "parse.ts"
Cohesion: 0.16
Nodes (15): config, handler(), json(), detectServiceKey(), offerByWords(), clientKey(), detectService(), FieldKey (+7 more)

### Community 29 - "AgentScene.tsx"
Cohesion: 0.12
Nodes (18): AgentScene(), COPY, Dst, DST_ICON, DST_ORDER, flight(), Live, Node() (+10 more)

### Community 30 - "manual.ts"
Cohesion: 0.17
Nodes (14): cleanInterests(), InterestKey, asParsed(), clean(), cleanFields(), createManualLead(), Key, LABELS (+6 more)

### Community 31 - "0015_crm_schema.sql"
Cohesion: 0.14
Nodes (6): crm.analytics_llm(), crm.analytics_templates(), crm.claim_broadcast_recipients(), crm.claim_jobs(), crm.clients_by_note_words(), crm.is_admin()

### Community 32 - "content.ts"
Cohesion: 0.16
Nodes (18): homeEn, servicesEn, ServiceText, accents, Advantage, Offer, ProcessStep, Service (+10 more)

### Community 33 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+11 more)

### Community 34 - "leads/ingest.ts"
Cohesion: 0.20
Nodes (10): GroupMessage, GroupResult, IngestCtx, ingestGroupMessage(), ingestLead(), originSource(), stripAt(), LEAD (+2 more)

### Community 35 - "bot.test.ts"
Cohesion: 0.29
Nodes (10): Attribution, clip(), config, handler(), json(), LeadPayload, sendAdEvents(), sha256() (+2 more)

### Community 36 - "База данных ST96"
Cohesion: 0.15
Nodes (12): 1. Как устроено сейчас и куда идём, 2. Карта таблиц (все — данные CRM, схема `crm`), 3. Правила (не нарушать), 4. Переменные окружения базы, 5. Миграции, 6. Как применять миграцию схемы (по шагам `0015`, уже выполнено 2026-11-05), База данных ST96, Воронки и очередь (+4 more)

### Community 37 - "normalizeSchedule"
Cohesion: 0.32
Nodes (8): clampInt(), cleanWin(), cleanWins(), defaultSchedule(), isTime(), normalizeSchedule(), tm(), loadSchedule()

### Community 38 - "AiServices.tsx"
Cohesion: 0.23
Nodes (13): Анимации (framer-motion, prefers-reduced-motion), AiServices(), copy, ProducingGallery(), AgentSceneCard(), MagneticButton(), Props, tags (+5 more)

### Community 39 - "useLang"
Cohesion: 0.26
Nodes (18): HomeHero(), LeadCapture(), ProcessTabs(), ServicesGrid(), Marquee(), Props, getHomeContent(), getServiceBySlug() (+10 more)

### Community 40 - "Reveal"
Cohesion: 0.41
Nodes (8): OPERATOR, POLICY_DATE_LABEL, POLICY_DATE_LABEL_EN, List(), PrivacyRu(), Section(), PrivacyEn(), PrivacyRoute()

### Community 41 - "compilerOptions"
Cohesion: 0.11
Nodes (17): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, moduleResolution, noEmit (+9 more)

### Community 42 - "agent/engine.ts"
Cohesion: 0.14
Nodes (29): config, handler(), exportJson(), input, leadText(), mockLlm(), setup(), AgentDeps (+21 more)

### Community 43 - "Передача проекта ST96 в новую сессию"
Cohesion: 0.16
Nodes (11): Стек и адреса, Как запустить и проверить, Не в репозитории (специально), Передача проекта ST96 в новую сессию, Правила владельца, Секреты (только в Vercel, в код и чат не попадают), Что готово и выложено (всё проверено на проде), Что дальше (по приоритету, по согласованию с владельцем) (+3 more)

### Community 44 - "framer-motion"
Cohesion: 0.25
Nodes (11): framer-motion, lucide-react, Accent, ServiceHero(), Aurora(), HeroVideo(), Props, KeywordOrbit() (+3 more)

### Community 45 - "CLAUDE.md"
Cohesion: 0.14
Nodes (13): graphify, Platform handoff, Per-Section Short Sessions, Короткие сессии по разделам (экономия лимитов), Раскладка папок, graphify-out/graph.json, graphify-out/GRAPH_REPORT.md, graphify-out/sections/index.md (+5 more)

### Community 46 - "dependencies"
Cohesion: 0.15
Nodes (13): dependencies, @breezystack/lamejs@^1.2.7, clsx@^2.1.1, framer-motion@^13.4.0, grammy@^1.46.0, libphonenumber-js@^1.13.15, lucide-react@^1.47.0, react@^19.2.8 (+5 more)

### Community 47 - "Аудит ST96 и связанных проектов — 2026-10-31"
Cohesion: 0.21
Nodes (14): Аудит ST96 и связанных проектов — 2026-10-31, CLAUDE.md проекта, Секреты в .env внутри деплоя retouch-studio, Загрузка шрифтов главной: Google Fonts vs локальные woff2, Сквозной прогон воронки на тестовом клиенте, Проект Vercel retouch-studio, site/index.html (главная st96.by), site/public/fonts (локальные woff2) (+6 more)

### Community 48 - "vite.config.ts"
Cohesion: 0.14
Nodes (8): @tailwindcss/vite@^4.3.3, @vitejs/plugin-react@^6.1.1, site/src/index.css, Site Stack (Vite + React 19 + TypeScript + Tailwind v4 + Framer Motion + React Router), @tailwindcss/vite, @vitejs/plugin-react, hasFiles(), pages

### Community 49 - "build.mjs"
Cohesion: 0.18
Nodes (7): fit(), font, glyphs(), opentype, report, require, variants

### Community 50 - "Site Services Catalog"
Cohesion: 0.15
Nodes (13): CATALOG, OFFER_STOP, SERVICE_SLUGS, servicesBrief(), SiteOffer, SiteService, STOP_WORDS, UNKNOWN_SERVICE (+5 more)

### Community 51 - "Фильтр в «Заявках» и «Клиентах» (окно в духе Битрикс24, сохранённые наборы)"
Cohesion: 0.17
Nodes (13): broadcasts.test.ts — тесты сегмента interests в рассылках, cleanInterests — отбрасывает чужие ключи и повторы, crm/admin/pages/FilterBar.tsx — строка поиска, чипы условий, окно фильтра, Фильтр в «Заявках» и «Клиентах» (окно в духе Битрикс24, сохранённые наборы), 0013_filter_presets.sql — таблица filter_presets (page, name, conds jsonb), filter.test.ts — тесты фильтра заявок/клиентов, crm/server/leads/filter.ts — построение списка полей и типов фильтра, crm/server/leads/interests.ts — ключи и подписи интересов (+5 more)

### Community 52 - "Design Audit Evidence"
Cohesion: 0.25
Nodes (7): Copy & honesty, Evidence, Known gaps, Print production («states»), Structural, Visual, Weight & resource

### Community 53 - "Icon"
Cohesion: 0.14
Nodes (31): AdminApp(), readMin(), Shell(), useNewVersion(), useAuth(), ST96 Admin HTML Entry, AgentPage(), LIVE (+23 more)

### Community 55 - "jobs.ts"
Cohesion: 0.50
Nodes (3): config, runTick(), resumeRun()

### Community 56 - "0010_analytics.sql"
Cohesion: 0.27
Nodes (10): public.templates, public.touch_templates(), templates_touch, llm_usage_at, public.analytics_llm(), public.analytics_templates(), public.llm_usage, public.template_events (+2 more)

### Community 57 - "SolutionScene.tsx"
Cohesion: 0.13
Nodes (19): react-dom@^19.2.8, react-dom, ACCENT_POS, COPY, EASE_OUT, EASE_SNAP, enter(), exit() (+11 more)

### Community 59 - "ST96 Project Status"
Cohesion: 0.22
Nodes (10): tracedRepo(), ST96 «нейросотрудник»: состояние проекта, Дальше (в порядке приоритета), Как это работает, Проверки, Секреты и доступы, Структура кода, Хвосты (+2 more)

### Community 63 - "Media Upload and Video Notes"
Cohesion: 0.20
Nodes (10): api/client-log.ts — журнал шагов загрузки кружка с телефона (только админы, до 4 КБ), crm/admin/builder/Editor.tsx — редактор блоков (TallText, MediaField), Медиа в блоках воронки: фото/видео/аудио/файл одним сообщением с подписью, crm/server/media.ts — работа с загруженными медиафайлами, mp4Info — чтение размера и длительности из заголовков MP4, Telegram 429 «retry after 8» при построении предпросмотра ссылки, Кружок Telegram (video note): запись, обрезка, лимит 12 МБ, ui/VideoNoteField.tsx — запись/выбор кружка, смена камеры, окно выбора куска (+2 more)

### Community 68 - "ST96 Platform Components"
Cohesion: 0.25
Nodes (8): Gemini Agent (tasks, plan approval, translation), Token and Cost Analytics, Meeting Booking /book, Broadcasts and Templates, Funnel Engine and Visual Builder, ST96 Platform (bot, CRM, booking, funnels), Supabase Data Layer (leads, clients, migrations 0001–0011), Telegram Bot @st96_leads_bot

### Community 70 - "Funnel Execution & Meetings"
Cohesion: 0.29
Nodes (7): callback_data кнопок fb:<запуск>:<кнопка>:<блок>, Запуск воронки (running/failed, tg_user_id, шаги после паузы), api/jobs.ts — потоковый ответ сразу и результат в конце, crm/server/agent/llm.test.ts — тесты клиента модели, crm/server/agent/llm.ts — клиент модели с общим сроком deadlineMs 21 с, Подтверждение встречи клиенту (.ics-файл с двумя напоминаниями), crm/server/funnels/realFunnel.test.ts — тест на живой схеме воронки

### Community 71 - "Project Docs and Booking"
Cohesion: 0.33
Nodes (6): Публичная запись /book (лимит 3 заявки в час по телефону/нику), PLATFORM.md — документация платформы (CRM, воронки, фильтры), DESIGN-IS-2026-10-20/05-redesign-plan.md — план редизайна админки (фазы 3–4), .claude/CLAUDE.md — правила проекта, TOOLING.md — инструменты и скиллы проекта, package.json — зависимости и скрипты сборки/тестов

### Community 72 - "Lint Configuration Rules"
Cohesion: 0.33
Nodes (5): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema

### Community 73 - "Build and Dev Scripts"
Cohesion: 0.33
Nodes (6): scripts, build, dev, lint, preview, test:server

### Community 74 - "ST96 Website Overview"
Cohesion: 0.33
Nodes (6): ST96 — сайт креативной студии, Запуск, Заявки с сайта в Telegram, Сборка, Стек, Структура

### Community 76 - "CRM Booking Page"
Cohesion: 0.40
Nodes (5): CRM booking page (crm/book/index.html), /favicon.svg, /fonts/inter-cyrillic.woff2, /crm/book/main.tsx (entry module), /fonts/unbounded-cyrillic.woff2

### Community 77 - "llm.ts"
Cohesion: 0.22
Nodes (11): config, DEFAULT_BASE_URL, DEFAULT_MODELS, Llm, LlmError, parseJson(), count(), MAX_TRANSLATE_CHARS (+3 more)

### Community 78 - "Agent Task Database"
Cohesion: 0.83
Nodes (3): agent_tasks_status, agent_tasks_touch, public.agent_tasks

### Community 79 - "Gemini Agent & Translations"
Cohesion: 0.50
Nodes (4): api/agent.ts — эндпоинт агента на LLM, Google/Gemini API — LLM агента, переводы, ретушь фото, retouch-studio/src/api/_lib/gemini.ts — клиент Gemini для ретуши, api/translate.ts — эндпоинт переводов

### Community 80 - "Design Audit Methodology"
Cohesion: 0.50
Nodes (4): DESIGN-IS — методика дизайн-аудита (scope → evidence → scorecard → verdict → handoff-prompt → план), DESIGN-IS-2026-10-14/ — первый дизайн-аудит админки, DESIGN-IS-2026-10-20/ — второй дизайн-аудит и план редизайна, Playwright MCP — живая проверка интерфейса в браузере

### Community 81 - "Code Graph Tooling"
Cohesion: 0.50
Nodes (4): graphify-out/ — артефакты графа кода, scripts/graph-sections.py — вспомогательный скрипт графа, graphify (скилл + CLI) — граф кода, query/path/explain вместо чтения файлов, .claude/skills/graphify/SKILL.md — описание скилла graphify

### Community 82 - "Service Video Thumbnails"
Cohesion: 0.67
Nodes (4): Video thumbnail: AI Websites service (English), Video thumbnail: AI Websites service (Russian), Video thumbnail: Automation service (English), Video thumbnail: Automation service (Russian)

### Community 83 - "Video Player Page"
Cohesion: 0.83
Nodes (4): ST96 — видео (YouTube player page), Inline player script (IIFE), telegram-web-app.js (Telegram Web App SDK), YouTube nocookie embed iframe

### Community 85 - "repo.ts"
Cohesion: 0.16
Nodes (14): config, handler(), AudienceClient, BroadcastStatus, canReceive(), FOOTER, inAudience(), MEDIA_CAPTION_LIMIT (+6 more)

### Community 87 - "tsx / node --test — 117 серверных тестов"
Cohesion: 0.67
Nodes (3): crm/server/**/*.test.ts — серверные тесты (booking, agent, funnels, leads), Node 24 / npm / Vite / TypeScript — сборка сайта и админки, tsc -b, tsx / node --test — 117 серверных тестов

### Community 88 - "Риск: .env с живыми ключами в исходниках деплоя retouch-studio"
Cohesion: 0.67
Nodes (3): Риск: .env с живыми ключами в исходниках деплоя retouch-studio, retouch-studio .env в исходниках деплоя (GEMINI_API_KEY, ADMIN_PASSWORD, AUTH_SECRET, ACCESS_CODE, BLOB_READ_WRITE_TOKEN), Vercel CLI 65.8.0 — деплой, проекты, переменные окружения

### Community 91 - "agent-model.ts"
Cohesion: 0.16
Nodes (22): config, handler(), agentDeps(), fail(), MODEL_SETTING, resolveLlm(), openAiCompatible(), record() (+14 more)

### Community 94 - "groupImport.ts"
Cohesion: 0.15
Nodes (15): emptyStats(), ExportMsg, flattenText(), IMPORT_TAG, ImportPlan, importSlice(), ImportStats, MAX_EXPORT_BYTES (+7 more)

### Community 108 - "ST96 Platform"
Cohesion: 0.50
Nodes (4): ChatPlace, crm/server/repo.ts (Repo interface, Supabase, tracedRepo), crm/supabase/migrations/0001..0011, ST96 Platform

### Community 116 - "ClientPage.tsx"
Cohesion: 0.14
Nodes (19): AuthCtx, AuthGate(), Ctx, Login(), State, deleteClient(), esc(), Highlight() (+11 more)

## Ambiguous Edges - Review These
- `crm/server/agent/engine.ts (plan → approve → execute)` → `crm/server/bot/dialog.ts (topics, relay, templates menu)`  [AMBIGUOUS]
  docs/PLATFORM.md · relation: conceptually_related_to

## Knowledge Gaps
- **111 isolated node(s):** `ffmpeg — видео для hero и сжатие роликов`, `Плагин hyperframes@hyperframes — кадры/видео-сцены (сейчас выключен)`, `team-orchestration — декомпозиция крупных работ на роли`, `Playwright MCP — живая проверка интерфейса в браузере`, `Node 24 / npm / Vite / TypeScript — сборка сайта и админки, tsc -b` (+106 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 567 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **37 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `Icon` to `Editor.tsx`, `TemplatesPage.tsx`, `filter.ts`, `ClientPage.tsx`, `BookingPage.tsx`, `Footer.tsx`, `BroadcastPage.tsx`, `AnalyticsPage.tsx`, `MediaField.tsx`, `useUi`, `Footer.tsx`, `BookPage.tsx`, `LeadCapture.tsx`, `package.json`, `AgentScene.tsx`, `content.ts`, `AiServices.tsx`, `useLang`, `Reveal`, `framer-motion`, `dependencies`, `SolutionScene.tsx`, `ClientPage.tsx`?**
  _High betweenness centrality (0.159) - this node is a cross-community bridge._
- **Are the 9 inferred relationships involving `createBot()` (e.g. with `.claimUpdate()` and `.findActiveRun()`) actually correct?**
  _`createBot()` has 9 INFERRED edges - model-reasoned connections that need verification._
- **What connects `ffmpeg — видео для hero и сжатие роликов`, `Плагин hyperframes@hyperframes — кадры/видео-сцены (сейчас выключен)`, `team-orchestration — декомпозиция крупных работ на роли` to the rest of the system?**
  _111 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `repo.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.13655761024182078 - nodes in this community are weakly interconnected._
- **Why does `ST96 — визуальный гид (design system)` connect `ST96 — визуальный гид (design system)` to `content.ts`, `AiServices.tsx`, `framer-motion`, `useUi`, `BookPage.tsx`?**
  _High betweenness centrality (0.063) - this node is a cross-community bridge._
- **Should `Editor.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05041797283176593 - nodes in this community are weakly interconnected._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `crm/server/agent/engine.ts (plan → approve → execute)` and `crm/server/bot/dialog.ts (topics, relay, templates menu)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
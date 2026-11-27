# Graph Report - st96-site  (2026-11-27)

## Corpus Check
- 310 files · ~238,843 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 22 file(s) not represented in the graph (top: .css 14, .woff2 4, (none) 2)

## Summary
- 2339 nodes · 5723 edges · 156 communities (108 shown, 48 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 222 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `63b8543b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- supabaseRepo
- Editor.tsx
- bot.ts
- BroadcastPage.tsx
- 0001_core.sql
- filter.ts
- ClientPage.tsx
- BookingPage.tsx
- dialog.ts
- Out
- Repo
- ScheduleTab
- i18n.ts
- funnels/engine.ts
- ModelPicker.tsx
- crm/api/booking-admin.ts
- AnalyticsPage.tsx
- SupportPage.tsx
- useLang
- ST96 — визуальный гид (design system)
- 3. Сценарии
- realFunnel.test.ts
- Footer.tsx
- BookPage.tsx
- tools.ts
- attribution.ts
- package.json
- booking.test.ts
- parse.ts
- AgentScene.tsx
- manual.ts
- 0024_cabinet.sql
- content.ts
- compilerOptions
- dbSchema
- leads/ingest.ts
- База данных ST96
- support/types.ts
- broadcasts.ts
- crm/api/lead.ts
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
- Cabinet.tsx
- Карта проекта и правила размещения файлов
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
- api/geo.ts (x-vercel-ip-country)
- Planned Migrations
- ST96 Platform Components
- Funnel Execution & Meetings
- Project Docs and Booking
- Lint Configuration Rules
- Build and Dev Scripts
- ST96 — сайт креативной студии
- CRM Booking Page
- llm.ts
- Agent Task Database
- Gemini Agent & Translations
- Design Audit Methodology
- Code Graph Tooling
- Service Video Thumbnails
- Video Player Page
- crm/api/geo.ts
- bot.test.ts
- 0013_filter_presets.sql
- tsx / node --test — 117 серверных тестов
- Риск: .env с живыми ключами в исходниках деплоя retouch-studio
- tsconfig.json
- vercel.json
- agent-model.ts
- App Settings Schema
- Telegram Links Schema
- Admin SPA (/admin)
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
- crm/server/agent/engine.ts (plan → approve → execute)
- crm/api/cabinet.ts
- support/agent.ts
- Hero Video Compression
- Hyperframes Video Scenes
- Team Work Decomposition
- agent/types.ts
- AI Hero Video Poster
- Production Hero Video Poster
- worker.ts
- processJob
- period.test.ts
- Личный кабинет клиента ST96 — данные, миграция, API
- Личный кабинет клиента ST96 — дизайн и ТЗ
- CatalogPage.tsx
- bookingUrl
- pdf.ts
- Поддержка клиентов (ИИ-агент): ТЗ
- voice.ts
- crm/api/cabinet-pdf.ts
- handler
- bootstrap
- agent/agent.test.ts
- consult.ts
- material.ts
- HANDOFF.md
- crm/api/jobs.ts
- 5. Ключевые сценарии
- 8. Фазы и критерии приёмки
- music.ts
- Юридические документы кабинета: что доработать на сайте
- ST96 «нейросотрудник»: состояние проекта
- 5. Бизнес-процессы
- Worker поддержки (Фаза 3)
- 0025_catalog.sql
- link.ts
- Кабинет: статус реализации

## God Nodes (most connected - your core abstractions)
1. `Repo` - 121 edges
2. `react` - 65 edges
3. `Icon()` - 58 edges
4. `createBot()` - 38 edges
5. `useLang()` - 34 edges
6. `supabaseRepo()` - 30 edges
7. `grammy` - 29 edges
8. `react-router-dom` - 29 edges
9. `useUi()` - 28 edges
10. `ST96 — визуальный гид (design system)` - 28 edges

## Surprising Connections (you probably didn't know these)
- `4. Переменные окружения базы` --references--> `dbSchema()`  [INFERRED]
  docs/DATABASE.md → crm/server/env.ts
- `Как это работает` --references--> `parseLead()`  [INFERRED]
  docs/PLATFORM.md → crm/server/leads/parse.ts
- `4. Где разместить ссылки и согласия` --references--> `LeadCapture()`  [INFERRED]
  docs/cabinet/legal-texts.md → site/src/components/sections/LeadCapture.tsx
- `Статус` --references--> `TallText()`  [INFERRED]
  docs/PLATFORM.md → crm/admin/builder/Editor.tsx
- `10. Пакеты, периоды и кредиты` --references--> `active()`  [INFERRED]
  docs/cabinet/data-api.md → crm/admin/pages/BookingPage.tsx

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

## Communities (156 total, 48 thin omitted)

### Community 0 - "supabaseRepo"
Cohesion: 0.10
Nodes (26): config, config, config, config, config, config, config, config (+18 more)

### Community 1 - "Editor.tsx"
Cohesion: 0.05
Nodes (79): Builder(), Inner(), isMobile(), Props, Snap, ACT_TYPES, actText(), autoLayout() (+71 more)

### Community 2 - "bot.ts"
Cohesion: 0.08
Nodes (22): clientFor(), beginStart(), createBot(), ensureClient(), From, fullName(), langOf(), linkLeadClient() (+14 more)

### Community 3 - "BroadcastPage.tsx"
Cohesion: 0.07
Nodes (43): BroadcastPage(), Draft, fromRow(), SAMPLE, toLocalInput(), STATUS_CHIP, blank(), Draft (+35 more)

### Community 4 - "0001_core.sql"
Cohesion: 0.07
Nodes (49): clients_phone_key, clients_updated, clients_username_key, funnel_runs_client_idx, funnel_runs_wake_idx, funnels_updated, jobs_due_idx, lead_notes_client_idx (+41 more)

### Community 5 - "filter.ts"
Cohesion: 0.10
Nodes (34): FieldRow(), FilterBar(), FilterModal(), Preset, Cond, condLabel(), CondValue, DateValue (+26 more)

### Community 6 - "ClientPage.tsx"
Cohesion: 0.10
Nodes (39): deleteClient(), esc(), Highlight(), ClientsPage(), DEFAULTS, flatOf(), KNOWN, Row (+31 more)

### Community 7 - "BookingPage.tsx"
Cohesion: 0.08
Nodes (38): active(), hhmm(), ScheduleTab(), svcColor(), CellInfo, DOWS, MonthGrid(), MONTHS (+30 more)

### Community 8 - "dialog.ts"
Cohesion: 0.10
Nodes (30): cardText(), Content, ensureTopic(), notifyTopic(), sendContent(), sendTemplate(), TopicMessage, topicTitle() (+22 more)

### Community 10 - "Repo"
Cohesion: 0.04
Nodes (27): AgentStats, AgentTask, BookingInsert, AudienceClient, Segment, JobRow, ClientRow, LeadInsert (+19 more)

### Community 11 - "ScheduleTab"
Cohesion: 0.10
Nodes (31): defaultSchedule(), FORMAT_KEYS, FormatKey, SERVICE_KEYS, ServiceKey, slotAvailable(), toInstant(), toLocal() (+23 more)

### Community 12 - "i18n.ts"
Cohesion: 0.24
Nodes (17): 18. EN-версия кабинета, Footer(), Header(), Layout(), HomeHero(), MagneticButton(), Marquee(), getServices() (+9 more)

### Community 13 - "funnels/engine.ts"
Cohesion: 0.07
Nodes (54): blankGraph, demoGraph, advance(), Btn, CondCtx, DOW, evalRule(), fill() (+46 more)

### Community 14 - "ModelPicker.tsx"
Cohesion: 0.19
Nodes (13): callApi(), Check, ModelPicker(), Row(), SettingsPage(), Status, camVideo(), fmt() (+5 more)

### Community 15 - "crm/api/booking-admin.ts"
Cohesion: 0.18
Nodes (11): config, config, handler(), decideBooking(), isHttps(), loadMeetDefault(), saveDirectAdmins(), saveMeetDefault() (+3 more)

### Community 16 - "AnalyticsPage.tsx"
Cohesion: 0.14
Nodes (25): AnalyticsPage(), fromDay(), LlmRow, nf, num(), Period, PERIODS, toDay() (+17 more)

### Community 17 - "SupportPage.tsx"
Cohesion: 0.11
Nodes (37): fmtDate(), INVOICE_KINDS, INVOICE_STATUSES, JOB_STATUSES, limitLabel(), money(), num(), PERIOD_STATUSES (+29 more)

### Community 18 - "useLang"
Cohesion: 0.15
Nodes (31): Service, lucide-react, Advantages(), AdvantagesData, AiImplementation(), CatalogButton, CatalogItem, CatalogSection() (+23 more)

### Community 19 - "ST96 — визуальный гид (design system)"
Cohesion: 0.05
Nodes (44): Бренд ST96 (brand/), crm/admin (эталонные внутренние экраны), 1. Источник правды, 2. Админка: палитра (светлая, единственная), 3. `/book`: палитра (тёмная, как сайт), 4. Типографика и размеры, 5. Форма и ритм админки, 6. Паттерны CRM (+36 more)

### Community 20 - "3. Сценарии"
Cohesion: 0.06
Nodes (36): 1.1 Шапка сайта, 1.2 Каркас кабинета, 1.3 Защита маршрутов, 1. Каркас и навигация, 2.10 `/cabinet/documents` — «Документы», 2.11 `/cabinet/profile` — «Профиль», 2.1 `/support` — публичная страница «Поддержка» (изменения), 2.2 Google-вход (модалка) (+28 more)

### Community 21 - "realFunnel.test.ts"
Cohesion: 0.16
Nodes (10): seed(), Env, setup(), fakeTelegram(), graph, Sent, setup(), MemoryRepo (+2 more)

### Community 22 - "Footer.tsx"
Cohesion: 0.16
Nodes (17): react-dom, App(), CookieBanner(), Toggle(), CustomCursor(), trackClicks(), trackLead(), Window (+9 more)

### Community 23 - "BookPage.tsx"
Cohesion: 0.10
Nodes (17): BookPage(), Cfg, Lang, qs, Slot, T, BOOKING_GOALS, POLICY_PATH (+9 more)

### Community 24 - "tools.ts"
Cohesion: 0.10
Nodes (25): emptyStats(), ExportMsg, flattenText(), IMPORT_TAG, ImportPlan, importSlice(), ImportStats, MAX_EXPORT_BYTES (+17 more)

### Community 25 - "attribution.ts"
Cohesion: 0.14
Nodes (18): POLICY_VERSION, services, api/lead.ts (Vercel function), site/src/components/layout/Footer.tsx (CONTACTS), AIDA Page Methodology, Website Lead-to-Telegram Flow, Telegram Bot API, CONTACTS (+10 more)

### Community 26 - "package.json"
Cohesion: 0.09
Nodes (29): devDependencies, oxlint@^1.81.0, tailwindcss@^4.3.3, @tailwindcss/vite@^4.3.3, tsx@^4.23.15, @types/node@^24.13.3, @types/nodemailer@^8.0.2, @types/pg@^8.23.1 (+21 more)

### Community 27 - "booking.test.ts"
Cohesion: 0.12
Nodes (28): config, config, handler(), input, NOW, S, S30, buildIcs() (+20 more)

### Community 28 - "parse.ts"
Cohesion: 0.15
Nodes (15): config, config, handler(), json(), planImport(), clientKey(), FieldKey, LABELS (+7 more)

### Community 29 - "AgentScene.tsx"
Cohesion: 0.10
Nodes (29): accents, AiServices(), copy, ProducingGallery(), AgentScene(), AgentSceneCard(), COPY, Dst (+21 more)

### Community 30 - "manual.ts"
Cohesion: 0.18
Nodes (15): detectServiceInText(), cleanInterests(), InterestKey, asParsed(), clean(), cleanFields(), createManualLead(), Key (+7 more)

### Community 31 - "0024_cabinet.sql"
Cohesion: 0.05
Nodes (62): crm.analytics_llm(), crm.analytics_templates(), crm.claim_broadcast_recipients(), crm.claim_jobs(), crm.clients_by_note_words(), crm.is_admin(), agent_audit_client_idx, agent_audit_project_idx (+54 more)

### Community 32 - "content.ts"
Cohesion: 0.11
Nodes (24): homeEn, servicesEn, ServiceText, Advantage, AiBlock, AiBlockPoint, ModelId, Offer (+16 more)

### Community 33 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+11 more)

### Community 34 - "dbSchema"
Cohesion: 0.09
Nodes (26): config, config, config, config, config, Db, OrderRow, CatalogButton (+18 more)

### Community 35 - "leads/ingest.ts"
Cohesion: 0.23
Nodes (11): GroupMessage, GroupResult, IngestCtx, ingestGroupMessage(), ingestLead(), originSource(), stripAt(), LEAD (+3 more)

### Community 36 - "База данных ST96"
Cohesion: 0.15
Nodes (13): 1. Как устроено сейчас и куда идём, 2. Карта таблиц (все — данные CRM, схема `crm`), 3. Правила (не нарушать), 4. Переменные окружения базы, 5. Миграции, 6. Как применять миграцию схемы (шаги `0015`; для `0022`/`0023` хватает шага 2), База данных ST96, Воронки и очередь (+5 more)

### Community 37 - "support/types.ts"
Cohesion: 0.12
Nodes (20): Индекс workspace-папок для админки, CREDIT_PRICE_LABELS, CREDIT_PRICES_KEY, CreditPrices, DEFAULT_CREDIT_PRICES, HIDDEN_WORKSPACE_FOLDER_NAMES, WORKSPACE_FOLDERS_KEY, WorkspaceFolder (+12 more)

### Community 38 - "broadcasts.ts"
Cohesion: 0.13
Nodes (12): BroadcastRow, BroadcastStatus, canReceive(), FOOTER, inAudience(), isRateLimit(), MEDIA_CAPTION_LIMIT, sleep() (+4 more)

### Community 39 - "crm/api/lead.ts"
Cohesion: 0.29
Nodes (10): Attribution, clip(), config, handler(), json(), LeadPayload, sendAdEvents(), sha256() (+2 more)

### Community 40 - "Reveal"
Cohesion: 0.26
Nodes (17): OPERATOR, POLICY_DATE_LABEL, POLICY_DATE_LABEL_EN, 3. Новый документ: оферта / условия покупки, Props, Reveal(), SeoOptions, setAlternate() (+9 more)

### Community 41 - "compilerOptions"
Cohesion: 0.11
Nodes (17): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, moduleResolution, noEmit (+9 more)

### Community 42 - "agent/engine.ts"
Cohesion: 0.18
Nodes (23): config, config, handler(), approveTask(), catalog(), confirmStep(), counted(), createTask() (+15 more)

### Community 43 - "Передача проекта ST96 в новую сессию"
Cohesion: 0.17
Nodes (11): Стек и адреса, Как запустить и проверить, Не в репозитории (специально), Передача проекта ST96 в новую сессию, Правила владельца, Секреты (только в Vercel, в код и чат не попадают), Что готово и выложено (всё проверено на проде), Что дальше (по приоритету, по согласованию с владельцем) (+3 more)

### Community 44 - "framer-motion"
Cohesion: 0.16
Nodes (15): Accent, Анимации (framer-motion, prefers-reduced-motion), clsx, framer-motion, ServiceHero(), Aurora(), HeroVideo(), Props (+7 more)

### Community 45 - "CLAUDE.md"
Cohesion: 0.17
Nodes (10): graphify, .claude/skills/graphify/SKILL.md, graphify, Platform handoff, Per-Section Short Sessions, Короткие сессии по разделам (экономия лимитов), Раскладка папок, graphify-out/GRAPH_REPORT.md (+2 more)

### Community 46 - "dependencies"
Cohesion: 0.11
Nodes (18): dependencies, @breezystack/lamejs@^1.2.7, clsx@^2.1.1, framer-motion@^13.4.0, grammy@^1.46.0, libphonenumber-js@^1.13.15, lucide-react@^1.47.0, nodemailer@^10.6.1 (+10 more)

### Community 47 - "Аудит ST96 и связанных проектов — 2026-10-31"
Cohesion: 0.21
Nodes (14): Аудит ST96 и связанных проектов — 2026-10-31, CLAUDE.md проекта, Секреты в .env внутри деплоя retouch-studio, Загрузка шрифтов главной: Google Fonts vs локальные woff2, Сквозной прогон воронки на тестовом клиенте, Проект Vercel retouch-studio, site/index.html (главная st96.by), site/public/fonts (локальные woff2) (+6 more)

### Community 48 - "vite.config.ts"
Cohesion: 0.22
Nodes (4): site/src/index.css, Site Stack (Vite + React 19 + TypeScript + Tailwind v4 + Framer Motion + React Router), hasFiles(), pages

### Community 49 - "build.mjs"
Cohesion: 0.18
Nodes (7): fit(), font, glyphs(), opentype, report, require, variants

### Community 50 - "Site Services Catalog"
Cohesion: 0.14
Nodes (16): CATALOG, detectServiceKey(), OFFER_STOP, offerByWords(), SERVICE_SLUGS, serviceByLabel(), SiteOffer, SiteService (+8 more)

### Community 51 - "Фильтр в «Заявках» и «Клиентах» (окно в духе Битрикс24, сохранённые наборы)"
Cohesion: 0.17
Nodes (13): broadcasts.test.ts — тесты сегмента interests в рассылках, cleanInterests — отбрасывает чужие ключи и повторы, crm/admin/pages/FilterBar.tsx — строка поиска, чипы условий, окно фильтра, Фильтр в «Заявках» и «Клиентах» (окно в духе Битрикс24, сохранённые наборы), 0013_filter_presets.sql — таблица filter_presets (page, name, conds jsonb), filter.test.ts — тесты фильтра заявок/клиентов, crm/server/leads/filter.ts — построение списка полей и типов фильтра, crm/server/leads/interests.ts — ключи и подписи интересов (+5 more)

### Community 52 - "Design Audit Evidence"
Cohesion: 0.25
Nodes (7): Copy & honesty, Evidence, Known gaps, Print production («states»), Structural, Visual, Weight & resource

### Community 53 - "Icon"
Cohesion: 0.08
Nodes (47): AdminApp(), readMin(), Shell(), useNewVersion(), AuthCtx, AuthGate(), Ctx, Login() (+39 more)

### Community 54 - "Cabinet.tsx"
Cohesion: 0.10
Nodes (22): anonKey, supabase, url, api(), ApiError, Cabinet(), CabinetApiError, CartItem (+14 more)

### Community 55 - "Карта проекта и правила размещения файлов"
Cohesion: 0.40
Nodes (4): Верхний уровень, Карта проекта и правила размещения файлов, Правила, Сборка и адреса

### Community 56 - "0010_analytics.sql"
Cohesion: 0.27
Nodes (10): public.templates, public.touch_templates(), templates_touch, llm_usage_at, public.analytics_llm(), public.analytics_templates(), public.llm_usage, public.template_events (+2 more)

### Community 57 - "SolutionScene.tsx"
Cohesion: 0.14
Nodes (18): ACCENT_POS, COPY, EASE_OUT, EASE_SNAP, enter(), exit(), MOTIF_ROTATE, MOTIF_SCALE (+10 more)

### Community 59 - "ST96 Project Status"
Cohesion: 0.24
Nodes (8): config, config, handler(), json(), tracedRepo(), Структура кода, Хвосты, Известные ограничения и хвосты

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

### Community 74 - "ST96 — сайт креативной студии"
Cohesion: 0.33
Nodes (6): ST96 — сайт креативной студии, Запуск, Заявки с сайта в Telegram, Сборка, Стек, Структура

### Community 76 - "CRM Booking Page"
Cohesion: 0.40
Nodes (5): CRM booking page (crm/book/index.html), /favicon.svg, /fonts/inter-cyrillic.woff2, /crm/book/main.tsx (entry module), /fonts/unbounded-cyrillic.woff2

### Community 77 - "llm.ts"
Cohesion: 0.19
Nodes (15): DEFAULT_BASE_URL, DEFAULT_MODELS, Llm, LlmError, openAiCompatible(), parseJson(), record(), testModel() (+7 more)

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

### Community 85 - "bot.test.ts"
Cohesion: 0.13
Nodes (17): SITE_START_LOCK_MS, IN_HOURS, priv, setup(), staff, START_ENT, user, b64url() (+9 more)

### Community 87 - "tsx / node --test — 117 серверных тестов"
Cohesion: 0.67
Nodes (3): crm/server/**/*.test.ts — серверные тесты (booking, agent, funnels, leads), Node 24 / npm / Vite / TypeScript — сборка сайта и админки, tsc -b, tsx / node --test — 117 серверных тестов

### Community 88 - "Риск: .env с живыми ключами в исходниках деплоя retouch-studio"
Cohesion: 0.67
Nodes (3): Риск: .env с живыми ключами в исходниках деплоя retouch-studio, retouch-studio .env в исходниках деплоя (GEMINI_API_KEY, ADMIN_PASSWORD, AUTH_SECRET, ACCESS_CODE, BLOB_READ_WRITE_TOKEN), Vercel CLI 65.8.0 — деплой, проекты, переменные окружения

### Community 91 - "agent-model.ts"
Cohesion: 0.15
Nodes (19): config, config, handler(), fail(), MODEL_SETTING, resolveLlm(), AUTO_MODEL, CUSTOM_PREFIX (+11 more)

### Community 108 - "crm/server/agent/engine.ts (plan → approve → execute)"
Cohesion: 0.29
Nodes (7): api/agent.ts (create/revise/approve/confirm/reject), api/jobs.ts (delayed steps), crm/server/agent/engine.ts (plan → approve → execute), crm/server/agent/llm.ts (Gemini via OpenAI-compatible API), crm/server/agent/models.ts (Gemini catalog), LLM Usage Accounting (llm_usage), pg_cron Delayed Job Queue

### Community 110 - "crm/api/cabinet.ts"
Cohesion: 0.12
Nodes (19): config, AccountRow, AuthUser, CartRow, CartView, ClientRow, config, Db (+11 more)

### Community 112 - "support/agent.ts"
Cohesion: 0.20
Nodes (15): AgentInput, AuditEntry, buildPrompt(), Classification, Classify, decide(), Decision, isGratitude() (+7 more)

### Community 116 - "agent/types.ts"
Cohesion: 0.15
Nodes (11): LogLine, Risk, RISK_LABEL, Step, StepState, TASK_STATUS, TaskStatus, ChatPlace (+3 more)

### Community 119 - "worker.ts"
Cohesion: 0.21
Nodes (14): CREATOR_ANSWER, isCreatorQuestion(), attachmentFileName(), creditCost(), parseCreditPrices(), downloadTelegramFile(), downloadTelegramVoice(), sendTelegramVoice() (+6 more)

### Community 120 - "processJob"
Cohesion: 0.23
Nodes (11): isConfirmation(), isRejection(), isProjectsQuestion(), norm(), ORDINALS, pickProject(), projectLabel(), projectsListText() (+3 more)

### Community 121 - "period.test.ts"
Cohesion: 0.24
Nodes (13): activatePeriod(), confirmInvoice(), monthRange(), spendCorrections(), spendCredits(), spendFeatures(), startPeriod(), calcUpgrade() (+5 more)

### Community 122 - "Личный кабинет клиента ST96 — данные, миграция, API"
Cohesion: 0.12
Nodes (16): 11. Документы: счёт, акт, чек, 12. Уведомления, 13. Безопасность, 15. Фазы и приёмка, 16. Автоматические PDF: реализация, 17. Email через mail.ru: реализация, 19. Автопродление: реализация, 1. Контекст и границы (+8 more)

### Community 123 - "Личный кабинет клиента ST96 — дизайн и ТЗ"
Cohesion: 0.12
Nodes (16): 10. Что меняется на сайте и в админке, 11. Данные и API (кратко), 12. Безопасность и приватность, 13. Состояния и ошибки (обязательные), 14. Фазы и критерии приёмки, 15. Ответы владельца и что осталось уточнить, 16. Прототип, 1. Задача (+8 more)

### Community 124 - "CatalogPage.tsx"
Cohesion: 0.22
Nodes (11): blank(), CatalogButton, CatalogPage(), CatalogRow, Draft, Editor(), pageLabel(), PAGES (+3 more)

### Community 125 - "bookingUrl"
Cohesion: 0.24
Nodes (11): bookingUrl(), Scenario, buildSupportSystem(), Lang, replySupport(), situation(), SupportReplyInput, SupportReplyStatus (+3 more)

### Community 126 - "pdf.ts"
Cohesion: 0.17
Nodes (10): INTER_TTF_GZ_B64, ACID, DIM, INK, PdfInput, S, pdf-lib@^1.17.1, @pdf-lib/fontkit@^1.1.1 (+2 more)

### Community 127 - "Поддержка клиентов (ИИ-агент): ТЗ"
Cohesion: 0.15
Nodes (13): 10. Риски, 11. Что не входит в первую версию, 1. Цель и границы, 2. Принятые решения, 3. Архитектура, 4.1 Изменения существующих таблиц, 4.2 Новые таблицы, 4.3 Нумерация (+5 more)

### Community 128 - "voice.ts"
Cohesion: 0.29
Nodes (10): HERE, run(), STT_SCRIPT, synthesizeVoice(), synthesizeVoicePiper(), synthesizeVoiceYandex(), toSpeechText(), transcribeAudio() (+2 more)

### Community 129 - "crm/api/cabinet-pdf.ts"
Cohesion: 0.27
Nodes (8): config, config, handler(), json(), localizeTitle(), PKG_EN, PdfKind, renderPdf()

### Community 130 - "handler"
Cohesion: 0.24
Nodes (10): adminDb(), assertProject(), cartView(), clientHasProjects(), getUser(), handler(), json(), summary() (+2 more)

### Community 131 - "bootstrap"
Cohesion: 0.28
Nodes (9): bootstrap(), loadAccount(), loadClient(), loadProfile(), toProfile(), 14. Тесты, 7. Идентификация и слияние карточки клиента, 3.1 Первая покупка: гость → клиент → оплата (+1 more)

### Community 132 - "agent/agent.test.ts"
Cohesion: 0.28
Nodes (6): exportJson(), input, leadText(), mockLlm(), setup(), AgentDeps

### Community 133 - "consult.ts"
Cohesion: 0.36
Nodes (7): servicesBrief(), buildConsultSystem(), consultAnswer(), ConsultReq, Lang, rules(), WORKING_HOURS_LABEL

### Community 134 - "material.ts"
Cohesion: 0.36
Nodes (7): attachmentsSummary(), effectiveRequestText(), materialAskText(), MIME_EXT, needsMaterial(), photo, SupportAttachment

### Community 135 - "HANDOFF.md"
Cohesion: 0.25
Nodes (6): config, graphify-out/graph.json, Known Limitations and Loose Ends, Next Steps (prioritised), Owner Rules (privacy policy, pushes, brand, folders), Vercel Environment Secrets

### Community 136 - "crm/api/jobs.ts"
Cohesion: 0.33
Nodes (4): config, config, runTick(), agentDeps()

### Community 138 - "5. Ключевые сценарии"
Cohesion: 0.29
Nodes (7): 5.1 Первая покупка (гость → клиент), 5.2 Возврат клиента, 5.3 Докупка кредитов, 5.4 Юридическое лицо, 5.5 Физическое лицо, 5.6 Задачи из Telegram, 5. Ключевые сценарии

### Community 139 - "8. Фазы и критерии приёмки"
Cohesion: 0.29
Nodes (7): 8. Фазы и критерии приёмки, Фаза 0 — Данные и инфраструктура (core), Фаза 1 — Заявка и карточка (leads), Фаза 2 — Админка «Поддержка» (admin), Фаза 3 — Worker + агент (support, сервер), Фаза 4 — Бот и гейт человека (bot), Фаза 5 — Оплата и периоды (support + core)

### Community 140 - "music.ts"
Cohesion: 0.60
Nodes (4): DANCE_PHRASES, hasAudioAttachment(), MUSIC_REPLY, musicReplyText()

### Community 142 - "Юридические документы кабинета: что доработать на сайте"
Cohesion: 0.33
Nodes (6): 1. Что уже есть, 2. Правки политики (RU и EN), 4. Где разместить ссылки и согласия, 5. Что НЕ делаем сейчас, 6. Проверка, Юридические документы кабинета: что доработать на сайте

### Community 143 - "ST96 «нейросотрудник»: состояние проекта"
Cohesion: 0.33
Nodes (6): ST96 «нейросотрудник»: состояние проекта, Дальше (в порядке приоритета), Как это работает, Проверки, Секреты и доступы, Что строим

### Community 144 - "5. Бизнес-процессы"
Cohesion: 0.33
Nodes (6): 5.1 Подключение проекта, 5.2 Обращение клиента, 5.3 Оплата, 5.4 Человек в диалоге, 5.5 Смена пакета в середине периода, 5. Бизнес-процессы

### Community 145 - "Worker поддержки (Фаза 3)"
Cohesion: 0.40
Nodes (4): systemd-юнит (образец), Worker поддержки (Фаза 3), Запуск, Изоляция

### Community 146 - "0025_catalog.sql"
Cohesion: 0.70
Nodes (4): catalog_items_page_idx, catalog_items_slug_uidx, catalog_items_updated, crm.catalog_items

### Community 148 - "Кабинет: статус реализации"
Cohesion: 0.50
Nodes (4): Кабинет: статус реализации, Как включить, Осталось, Сделано

## Ambiguous Edges - Review These
- `crm/server/agent/engine.ts (plan → approve → execute)` → `crm/server/bot/dialog.ts (topics, relay, templates menu)`  [AMBIGUOUS]
  docs/PLATFORM.md · relation: conceptually_related_to

## Knowledge Gaps
- **112 isolated node(s):** `ffmpeg — видео для hero и сжатие роликов`, `Плагин hyperframes@hyperframes — кадры/видео-сцены (сейчас выключен)`, `team-orchestration — декомпозиция крупных работ на роли`, `Playwright MCP — живая проверка интерфейса в браузере`, `Node 24 / npm / Vite / TypeScript — сборка сайта и админки, tsc -b` (+107 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 811 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **48 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `Icon` to `Editor.tsx`, `BroadcastPage.tsx`, `filter.ts`, `ClientPage.tsx`, `i18n.ts`, `ModelPicker.tsx`, `AnalyticsPage.tsx`, `SupportPage.tsx`, `useLang`, `Footer.tsx`, `BookPage.tsx`, `attribution.ts`, `package.json`, `AgentScene.tsx`, `Reveal`, `framer-motion`, `dependencies`, `Cabinet.tsx`, `SolutionScene.tsx`, `CatalogPage.tsx`?**
  _High betweenness centrality (0.118) - this node is a cross-community bridge._
- **Are the 13 inferred relationships involving `createBot()` (e.g. with `.claimUpdate()` and `.findClient()`) actually correct?**
  _`createBot()` has 13 INFERRED edges - model-reasoned connections that need verification._
- **What connects `ffmpeg — видео для hero и сжатие роликов`, `Плагин hyperframes@hyperframes — кадры/видео-сцены (сейчас выключен)`, `team-orchestration — декомпозиция крупных работ на роли` to the rest of the system?**
  _112 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `supabaseRepo` be split into smaller, more focused modules?**
  _Cohesion score 0.10104529616724739 - nodes in this community are weakly interconnected._
- **Why does `Repo` connect `Repo` to `bot.ts`, `leads/ingest.ts`, `BroadcastPage.tsx`, `broadcasts.ts`, `dialog.ts`, `ST96 Project Status`, `agent/engine.ts`, `agent-model.ts`, `ScheduleTab`, `funnels/engine.ts`, `crm/api/booking-admin.ts`, `tools.ts`, `booking.test.ts`, `manual.ts`?**
  _High betweenness centrality (0.064) - this node is a cross-community bridge._
- **Should `Editor.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05041797283176593 - nodes in this community are weakly interconnected._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `crm/server/agent/engine.ts (plan → approve → execute)` and `crm/server/bot/dialog.ts (topics, relay, templates menu)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
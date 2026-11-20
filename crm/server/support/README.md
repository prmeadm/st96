# Worker поддержки (Фаза 3)

Отдельный процесс, по образцу systemd-сервиса ST96/bot, без Telegram: опрашивает очередь
support_jobs, классифицирует обращение, при «ready» запускает агента в workspace проекта и
пишет результат + аудит.

## Запуск

SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… DEEPSEEK_API_KEY=… \
  npx tsx crm/server/support/worker.ts

## systemd-юнит (образец)

[Unit]
Description=ST96 support worker
After=network-online.target

[Service]
WorkingDirectory=/home/dsh/work/st96-site
EnvironmentFile=/etc/st96/support-worker.env
ExecStart=/usr/bin/npx tsx crm/server/support/worker.ts
Restart=always
RestartSec=15

[Install]
WantedBy=multi-user.target

## Изоляция

- Агент запускается с cwd = workspace проекта (client_projects.workspace_path) и видит только его.
- Запрет на чтение чужих проектов, secrets/, .env, ~/.dsh — на уровне cwd и прав процесса.
- Классификация и выполнение только в рамках agent_scenarios (рамки, стоп-условия, allowed_actions).
- Аудит каждого действия в agent_audit_log; лимит токенов и rate-limit — на стороне сценария/пакета.

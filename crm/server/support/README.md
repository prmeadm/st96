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

## Индекс workspace-папок для админки

Админка `/admin/support` работает в браузере (Vercel) и файловой системы сервера не видит, поэтому
выпадающий список «Workspace» в модалке проекта берёт список папок из `crm.app_settings[WORKSPACE_FOLDERS_KEY]`
(`support.workspace_folders`). Индекс пишет только worker:

- `crm/server/support/workspaceFolders.ts` — `scanWorkspaceFolders()` (чистое сканирование корней),
  `withProjectFolders()` (добавляет существующие папки проектов вне корней), `saveWorkspaceFolderIndex()`;
- служебные папки (`_template` — шаблон нового проекта) в индекс не попадают: `HIDDEN_WORKSPACE_FOLDER_NAMES`;
- корни — `SUPPORT_WORKSPACE_ROOTS` (переменная окружения воркера, по умолчанию `/home/dsh/work/KLIENTS`); второй корень
  добавляйте осознанно: в `/home/dsh/work` лежат служебные каталоги платформы;
- `worker.ts` → `syncWorkspaceFolders(repo)` вызывается на каждом тике (15 с); запись в БД — только если
  изменился набор папок или прошло 5 минут (обновляется `scanned_at`);
- админка только читает (policy `admins read` на `app_settings`), писать из браузера нельзя.

## Изоляция

- Агент запускается с cwd = workspace проекта (client_projects.workspace_path) и видит только его.
- Запрет на чтение чужих проектов, secrets/, .env, ~/.dsh — на уровне cwd и прав процесса.
- Классификация и выполнение только в рамках agent_scenarios (рамки, стоп-условия, allowed_actions).
- Аудит каждого действия в agent_audit_log; лимит токенов и rate-limit — на стороне сценария/пакета.

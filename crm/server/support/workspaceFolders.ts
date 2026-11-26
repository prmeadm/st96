// Индекс workspace-папок проекта на сервере.
//
// Зачем: админка `/admin/support` живёт на Vercel и файловой системы сервера не видит. Раньше
// список «Workspace» в модалке проекта собирался из уже привязанных путей `client_projects`
// (`existingWorkspaces` в SupportPage.tsx) — поэтому реальные папки на сервере, которых ещё нет
// ни у одного проекта (или созданные руками), в выпадающем списке не появлялись.
//
// Теперь единственный, кто видит диск, — worker поддержки: он сканирует корни
// (`SUPPORT_WORKSPACE_ROOTS`, по умолчанию /home/dsh/work/KLIENTS), добавляет существующие папки
// проектов вне корней, пишет индекс в `crm.app_settings` под ключом WORKSPACE_FOLDERS_KEY,
// а админка читает его оттуда.
import { existsSync, readdirSync, statSync } from 'node:fs'
import { basename, join } from 'node:path'
import pg from 'pg'
import { HIDDEN_WORKSPACE_FOLDER_NAMES, WORKSPACE_FOLDERS_KEY, type WorkspaceFolder, type WorkspaceFolderIndex, type WorkspaceRoot } from './types.js'

/** Корни по умолчанию: только клиентские проекты KLIENTS. Второй корень (/home/dsh/work) не сканируем
 *  по умолчанию: там лежат служебные каталоги платформы (ST96, st96-site) и привязать клиента к ним
 *  слишком легко. Нужны ещё корни — задать SUPPORT_WORKSPACE_ROOTS через EnvironmentFile воркера. */
export const DEFAULT_WORKSPACE_ROOTS = ['/home/dsh/work/KLIENTS']

/** Служебные папки внутри корня, которые не являются проектами. */
const SKIP_DIRS = new Set(['node_modules', 'graphify-out', '.git', '.dsh', '__pycache__', 'dist', 'var'])
/** Скрытые имена (шаблоны и пр.): в индекс не попадают, в списке админки не предлагаются. */
const HIDDEN_NAMES = new Set(HIDDEN_WORKSPACE_FOLDER_NAMES.map((n) => n.toLowerCase()))

/** Корни из окружения (параметр нужен тестам). */
export function workspaceRoots(env: NodeJS.ProcessEnv = process.env): string[] {
  const raw = (env.SUPPORT_WORKSPACE_ROOTS ?? '').trim()
  if (!raw) return [...DEFAULT_WORKSPACE_ROOTS]
  return raw.split(',').map((s) => s.trim()).filter(Boolean)
}

const normalizeRoot = (p: string) => p.trim().replace(/\/+$/, '')
const normalizePath = normalizeRoot

/** Сканирует корни и возвращает индекс: какие папки реально есть на сервере. Чистая функция (без БД). */
export function scanWorkspaceFolders(roots: string[] = workspaceRoots(), now: Date = new Date()): WorkspaceFolderIndex {
  const normRoots = [...new Set(roots.map(normalizeRoot).filter(Boolean))]
  const result: WorkspaceRoot[] = []
  for (const root of normRoots) {
    let names: { name: string; isDir: boolean }[]
    try {
      names = readdirSync(root, { withFileTypes: true }).map((e) => ({ name: e.name, isDir: e.isDirectory() }))
    } catch {
      result.push({ root, exists: false, folders: [] })
      continue
    }
    const folders: WorkspaceFolder[] = []
    for (const e of names) {
      if (!e.isDir) continue
      if (e.name.startsWith('.')) continue
      if (SKIP_DIRS.has(e.name)) continue
      if (HIDDEN_NAMES.has(e.name.toLowerCase())) continue
      const full = join(root, e.name)
      // Не показываем контейнеры, которые сами являются корнями (KLIENTS внутри /home/dsh/work).
      if (normRoots.includes(normalizeRoot(full))) continue
      let modified = ''
      try { modified = statSync(full).mtime.toISOString() } catch { /* папка исчезла между вызовами — не важно */ }
      folders.push({ name: e.name, path: full + '/', has_git: existsSync(join(full, '.git')), modified_at: modified })
    }
    folders.sort((a, b) => a.name.localeCompare(b.name, 'ru'))
    result.push({ root, exists: true, folders })
  }
  return { scanned_at: now.toISOString(), roots: result }
}

/** Добавляет к индексу папки проектов, которые лежат вне корней (легаси-пути из client_projects).
 *  Берём только реально существующие каталоги: иначе админка покажет мёртвый путь как рабочий. */
export function withProjectFolders(index: WorkspaceFolderIndex, paths: string[]): WorkspaceFolderIndex {
  const known = new Set([...index.roots.flatMap((r) => r.folders.map((f) => normalizePath(f.path))), ...(index.extra ?? []).map((f) => normalizePath(f.path))])
  const extra: WorkspaceFolder[] = []
  for (const raw of paths) {
    const path = normalizePath(raw)
    if (!path) continue
    let stat
    try { stat = statSync(path) } catch { continue } // папки нет — в индекс не попадает
    if (!stat.isDirectory() || known.has(path)) continue
    if (HIDDEN_NAMES.has(basename(path).toLowerCase())) continue
    known.add(path)
    extra.push({ name: basename(path), path: path + '/', has_git: existsSync(join(path, '.git')), modified_at: stat.mtime.toISOString() })
  }
  extra.sort((a, b) => a.path.localeCompare(b.path, 'ru'))
  return { ...index, extra }
}

/** Подпись набора папок (без mtime/scanned_at): по ней worker решает, менять ли запись в БД. */
export function indexSignature(index: WorkspaceFolderIndex): string {
  const folders = (list: WorkspaceFolder[]) => list.map((f) => ({ name: f.name, path: f.path, has_git: f.has_git }))
  return JSON.stringify({
    roots: index.roots.map((r) => ({ root: r.root, exists: r.exists, folders: folders(r.folders) })),
    extra: folders(index.extra ?? []),
  })
}

/** Пишет индекс в crm.app_settings (worker — единственный писатель этого ключа). */
export async function saveWorkspaceFolderIndex(connectionString: string, index: WorkspaceFolderIndex): Promise<void> {
  const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } })
  await client.connect()
  try {
    await client.query(
      `insert into crm.app_settings (key, value, updated_at) values ($1, $2::jsonb, now())
       on conflict (key) do update set value = excluded.value, updated_at = now()`,
      [WORKSPACE_FOLDERS_KEY, JSON.stringify(index)],
    )
  } finally {
    await client.end()
  }
}

/** Человеческое имя папки для логов. */
export const folderLabel = (f: WorkspaceFolder) => basename(f.path.replace(/\/+$/, ''))

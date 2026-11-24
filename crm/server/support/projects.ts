// Несколько проектов клиента: имя проекта, распознавание вопроса «какие у меня проекты»,
// выбор проекта по названию в тексте и текст списка. Чистая логика — покрывается тестами.
import type { ClientProjectRow } from './types.js'

/** Дружелюбное имя проекта для клиента: деплой-таргет, иначе слаг workspace, иначе repo, иначе короткий id. */
export function projectLabel(p: ClientProjectRow): string {
  if (p.deploy_target) return p.deploy_target.replace(/^https?:\/\//, '').replace(/\/$/, '')
  if (p.workspace_path) {
    const slug = p.workspace_path.replace(/\/$/, '').split('/').filter(Boolean).pop() ?? ''
    if (slug) return slug.replace(/[-_]+/g, ' ')
  }
  if (p.repo_url) {
    const slug = p.repo_url.replace(/\/$/, '').split('/').filter(Boolean).pop() ?? ''
    if (slug) return slug.replace(/\.git$/, '').replace(/[-_]+/g, ' ')
  }
  return 'проект ' + p.id.slice(0, 8)
}

/** Нормализация для сравнения: только буквы/цифры, без пробелов, дефисов и регистра. */
const norm = (s: string) => s.toLowerCase().replace(/[^a-zа-я0-9]/g, '')

/** Вопрос клиента про список его проектов («какие проекты ты видишь» и т.п.). */
export function isProjectsQuestion(text: string): boolean {
  const t = (text ?? '').toLowerCase()
  if (!/проект|сайт/.test(t)) return false
  return /(какие|сколько|какой|мои|моих|у меня|видишь|видно|знаешь|список|перечисли|покажи|проект[а-я]*)/.test(t)
}

/** Находит проект по названию в тексте (по label или слагу workspace). null — не нашёл. */
export function pickProject(text: string, projects: ClientProjectRow[]): ClientProjectRow | null {
  const t = norm(text)
  if (!t) return null
  for (const p of projects) {
    const label = norm(projectLabel(p))
    const slug = norm((p.workspace_path ?? '').replace(/\/$/, '').split('/').filter(Boolean).pop() ?? '')
    if ((label.length >= 3 && t.includes(label)) || (slug.length >= 3 && t.includes(slug))) return p
  }
  return null
}

/** Текст со списком проектов + вопрос, в какой вносить правку. */
export function projectsListText(projects: ClientProjectRow[]): string {
  const lines = projects.map((p, i) => (i + 1) + '. ' + projectLabel(p))
  return 'У тебя несколько проектов:\n' + lines.join('\n') + '\n\nВ какой проект вносим правку? Напиши название.'
}

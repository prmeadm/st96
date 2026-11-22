// Ссылка на результат правки: deploy_target проекта, иначе URL из ответа агента.
import type { ClientProjectRow } from './types'

/** Достаёт первый URL из текста ответа агента (деплой-ссылка). */
export function extractUrl(text: string): string | null {
  const m = (text ?? '').match(/https?:\/\/[^\s)'"<>]+/i)
  if (!m) return null
  return m[0].replace(/[.,;:!?]+$/, '')
}

/** Ссылка на результат: deploy_target проекта, иначе URL из ответа агента. */
export function resultLink(project: Pick<ClientProjectRow, 'deploy_target'>, output: string): string | null {
  const t = project.deploy_target?.trim()
  if (t) return t.replace(/\/+$/, '')
  return extractUrl(output)
}

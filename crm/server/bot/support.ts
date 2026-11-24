// Поддержка в боте: маршрутизация «есть проект → поддержка» и гейт человека (ИИ ↔ сотрудник).
// Логика чистая и покрывается тестами через memoryRepo и handleTopicMessage.
import type { Api } from 'grammy'
import type { ClientRow, Repo } from '../repo.js'

/** Длительная пауза ИИ (по сути до явного /startai): диалог ведёт человек. */
export const HUMAN_PAUSE_MS = 30 * 86400_000

export async function pauseAiForHuman(repo: Repo, client: ClientRow): Promise<void> {
  await repo.updateClient(client.id, { human_until: new Date(Date.now() + HUMAN_PAUSE_MS).toISOString() })
}

/** /startai: ИИ возвращается. Возвращает резюме для темы (статусы открытых обращений). */
export async function resumeAi(repo: Repo, client: ClientRow): Promise<string> {
  await repo.updateClient(client.id, { human_until: null })
  const project = await repo.findProjectByClient(client.id)
  const jobs = project ? await repo.listSupportJobs(project.id) : []
  const open = jobs.filter((j) => !['deployed', 'failed', 'out_of_scope'].includes(j.status)).slice(0, 5)
  const lines = ['ИИ-агент вернулся к работе.']
  if (open.length) {
    lines.push('Открытые обращения:')
    for (const j of open) lines.push('• ' + j.status + ': ' + j.request_text.slice(0, 80))
  } else if (project) {
    lines.push('Открытых обращений нет.')
  }
  return lines.join('\n')
}

/** Ответ ИИ клиенту + дубль в тему с пометкой «Ассистент». */
export async function notifySupportAi(api: Api, repo: Repo, groupChatId: number, client: ClientRow, text: string): Promise<void> {
  if (client.tg_user_id) {
    await api.sendMessage(client.tg_user_id, text, { link_preview_options: { is_disabled: true } })
    await repo.insertMessage({ client_id: client.id, direction: 'out', kind: 'text', text, tg_chat_id: client.tg_user_id, tg_message_id: null })
  }
  if (groupChatId && client.admin_topic_id) {
    await api.sendMessage(groupChatId, 'Ассистент: ' + text, { message_thread_id: client.admin_topic_id }).catch(() => undefined)
  }
}

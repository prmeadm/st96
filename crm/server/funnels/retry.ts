// Какие сбои отправки стоит повторить позже, а какие окончательные (клиент заблокировал бота, неверный запрос).

/** Telegram просит подождать дольше, чем можно ждать в этом запросе: продолжим по расписанию. */
export class RetryLaterError extends Error {
  readonly retryMs: number
  constructor(retryMs: number, message: string) {
    super(message)
    this.retryMs = retryMs
    this.name = 'RetryLaterError'
  }
}

type TgError = { error_code?: number; parameters?: { retry_after?: number }; message?: string }

/** Через сколько миллисекунд повторить, или null, если повтор не поможет. */
export function retryDelay(e: unknown): number | null {
  if (e instanceof RetryLaterError) return e.retryMs
  const x = (e ?? {}) as TgError
  if (x.error_code === 429) return ((x.parameters?.retry_after ?? 5) + 1) * 1000
  if (typeof x.error_code === 'number' && x.error_code >= 500) return 30_000
  if (/timed out|timeout|network|fetch failed|ECONNRESET|ETIMEDOUT|socket hang up/i.test(String(x.message ?? e))) return 30_000
  return null
}

/** Клиент заблокировал бота или удалил чат: писать ему бессмысленно. */
export const isBlockedError = (e: unknown) => /bot was blocked|user is deactivated|chat not found|bot can't initiate/i.test(String((e as TgError)?.message ?? e))

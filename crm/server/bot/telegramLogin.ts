/**
 * Проверка данных Telegram Login Widget (https://core.telegram.org/widgets/login#checking-authorization).
 * data-check-string: все поля, кроме hash, в виде key=value, отсортированные по ключу и склеенные через \n;
 * ключ = SHA256(bot_token); hash = hex(HMAC-SHA256(data-check-string, ключ)).
 * Web Crypto, а не node:crypto: функция работает и в edge-функциях Vercel. Сравнение подписи делает
 * crypto.subtle.verify, оно выполняется за постоянное время (аналог timingSafeEqual).
 */

export type TelegramLoginData = {
  id: number
  first_name?: string
  last_name?: string
  username?: string
  photo_url?: string
  auth_date: number
  hash: string
}

export const LOGIN_MAX_AGE_S = 24 * 3600

const enc = new TextEncoder()

/** data-check-string: все присланные поля, кроме hash (как требует Telegram: лишнее поле ломает подпись, а не обходит её). */
export function dataCheckString(data: Record<string, unknown>): string {
  return Object.keys(data)
    .filter((k) => k !== 'hash' && data[k] !== undefined && data[k] !== null)
    .sort()
    .map((k) => `${k}=${String(data[k])}`)
    .join('\n')
}

function hexToBytes(hex: string): Uint8Array | null {
  if (!/^[0-9a-f]{64}$/i.test(hex)) return null
  const out = new Uint8Array(32)
  for (let i = 0; i < 32; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  return out
}

async function hmacKey(botToken: string) {
  const secret = await crypto.subtle.digest('SHA-256', enc.encode(botToken))
  return crypto.subtle.importKey('raw', secret, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify'])
}

/** Подпись в том виде, как её ставит Telegram (нужна тестам и отладке). */
export async function signLoginData(data: Record<string, unknown>, botToken: string): Promise<string> {
  const sig = await crypto.subtle.sign('HMAC', await hmacKey(botToken), enc.encode(dataCheckString(data)))
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Возвращает проверенные данные пользователя или null, если подпись неверна, данные битые
 * или auth_date старше суток (или из будущего больше чем на 5 минут).
 */
export async function verifyTelegramLogin(raw: unknown, botToken: string, nowS = Math.floor(Date.now() / 1000)): Promise<TelegramLoginData | null> {
  if (!raw || typeof raw !== 'object' || !botToken) return null
  const d = raw as Record<string, unknown>
  const id = typeof d.id === 'string' && /^\d{1,20}$/.test(d.id) ? Number(d.id) : d.id
  const authDate = typeof d.auth_date === 'string' && /^\d{1,12}$/.test(d.auth_date) ? Number(d.auth_date) : d.auth_date
  if (typeof id !== 'number' || !Number.isSafeInteger(id) || id <= 0) return null
  if (typeof authDate !== 'number' || !Number.isSafeInteger(authDate)) return null
  if (nowS - authDate > LOGIN_MAX_AGE_S || authDate - nowS > 300) return null
  const sig = typeof d.hash === 'string' ? hexToBytes(d.hash) : null
  if (!sig) return null
  if (Object.keys(d).length > 12) return null
  for (const [k, v] of Object.entries(d)) {
    if (k.length > 32 || (v !== undefined && v !== null && typeof v !== 'string' && typeof v !== 'number')) return null
  }
  const ok = await crypto.subtle.verify('HMAC', await hmacKey(botToken), sig, enc.encode(dataCheckString(d)))
  if (!ok) return null
  const s = (v: unknown) => (typeof v === 'string' && v ? v : undefined)
  return { id, first_name: s(d.first_name), last_name: s(d.last_name), username: s(d.username), photo_url: s(d.photo_url), auth_date: authDate, hash: d.hash as string }
}

/** Контекст edge-функции Vercel: waitUntil даёт доработать фоновую задачу после ответа. */
export type EdgeCtx = { waitUntil?: (p: Promise<unknown>) => void }

/** Ждём задачу не дольше ms: потом отвечаем false, а задачу оставляем дорабатывать в фоне (waitUntil). */
export async function withDeadline(job: Promise<boolean>, ms: number, ctx?: EdgeCtx): Promise<boolean> {
  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<'timeout'>((r) => { timer = setTimeout(() => r('timeout'), ms) })
  const r = await Promise.race([job, timeout])
  clearTimeout(timer)
  if (r !== 'timeout') return r
  console.warn('telegram site start: still running after', ms, 'ms, continuing in background')
  ctx?.waitUntil?.(job)
  return false
}

/**
 * Ссылка из формы сайта в бота: t.me/<бот>?start=site_<токен>. Токен вместо голого id клиента:
 * id карточки, найденной по чужому телефону или нику, наружу не уходит, а подделать или переиспользовать
 * старую ссылку нельзя. Без базы: 16 байт id клиента + 4 байта срока + 12 байт HMAC (ключ из токена бота),
 * base64url, 43 символа (Telegram допускает до 64 в start).
 */

/** Сколько живёт ссылка из формы: человек может открыть Telegram не сразу. */
export const SITE_REF_TTL_S = 7 * 24 * 3600

const enc = new TextEncoder()
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
export const SITE_REF_RE = /^[A-Za-z0-9_-]{43}$/

async function refKey(botToken: string) {
  const secret = await crypto.subtle.digest('SHA-256', enc.encode(`st96-site-ref:${botToken}`))
  return crypto.subtle.importKey('raw', secret, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
}

const b64url = (b: Uint8Array) => btoa(String.fromCharCode(...b)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
const unb64url = (s: string) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0))

async function mac(body: Uint8Array, botToken: string) {
  return new Uint8Array(await crypto.subtle.sign('HMAC', await refKey(botToken), body)).slice(0, 12)
}

export async function signSiteRef(clientId: string, botToken: string, nowS = Math.floor(Date.now() / 1000)): Promise<string> {
  const id = clientId.toLowerCase()
  if (!UUID.test(id) || !botToken) throw new Error('bad site ref input')
  const body = new Uint8Array(20)
  const hex = id.replace(/-/g, '')
  for (let i = 0; i < 16; i++) body[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  new DataView(body.buffer).setUint32(16, nowS + SITE_REF_TTL_S)
  const out = new Uint8Array(32)
  out.set(body)
  out.set(await mac(body, botToken), 20)
  return b64url(out)
}

/** id клиента из токена или null: подпись не сошлась, срок вышел, формат не тот (в т.ч. старые ссылки с голым id). */
export async function verifySiteRef(ref: string, botToken: string, nowS = Math.floor(Date.now() / 1000)): Promise<string | null> {
  if (!SITE_REF_RE.test(ref) || !botToken) return null
  let raw: Uint8Array
  try { raw = unb64url(ref) } catch { return null }
  if (raw.length !== 32) return null
  const body = raw.slice(0, 20)
  const want = await mac(body, botToken)
  let diff = 0
  for (let i = 0; i < 12; i++) diff |= want[i]! ^ raw[20 + i]!
  if (diff) return null
  if (new DataView(body.buffer).getUint32(16) < nowS) return null
  const hex = [...body.slice(0, 16)].map((b) => b.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

/**
 * Ссылку на привязку получает только тот, чья заявка создала карточку. Заявка, нашедшая чужого клиента
 * по телефону или нику, ссылки не получает: иначе любой, введя чужой телефон, привязал бы свой Telegram.
 */
export async function issueSiteRef(ingested: { clientId: string | null; clientCreated: boolean }, botToken: string, nowS?: number): Promise<string | null> {
  return ingested.clientCreated && ingested.clientId ? signSiteRef(ingested.clientId, botToken, nowS) : null
}

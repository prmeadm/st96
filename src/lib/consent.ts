const KEY = 'st96-cookie-consent'
export const OPEN_EVENT = 'st96:cookie-settings'

export type Consent = { analytics: boolean; ts: number }

declare global {
  interface Window {
    dataLayer?: unknown[]
  }
}

export function readConsent(): Consent | null {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Consent) : null
  } catch {
    return null
  }
}

function clearAnalyticsCookies() {
  const host = location.hostname
  const domains = [host, `.${host}`, `.${host.split('.').slice(-2).join('.')}`]
  document.cookie.split(';').forEach((c) => {
    const name = c.split('=')[0].trim()
    if (/^(_ga|_gid|_gat|_ym|_ym_|_yasc|yandexuid|ymex|yabs-sid|i$|is_gdpr)/.test(name)) {
      domains.forEach((d) => {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${d}`
      })
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
    }
  })
}

export function pushConsentEvent(consent: Consent | null) {
  if (consent?.analytics) {
    window.dataLayer = window.dataLayer || []
    window.dataLayer.push({ event: 'analytics_consent' })
  }
}

export function saveConsent(analytics: boolean) {
  const prev = readConsent()
  const consent: Consent = { analytics, ts: Date.now() }
  try {
    localStorage.setItem(KEY, JSON.stringify(consent))
  } catch {
    /* storage unavailable */
  }
  if (analytics) {
    pushConsentEvent(consent)
  } else if (prev?.analytics) {
    clearAnalyticsCookies()
    location.reload()
  }
}

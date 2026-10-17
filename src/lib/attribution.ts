const KEY = 'st96-attribution'
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const

export type Attribution = {
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_content?: string
  utm_term?: string
  landing?: string
  referrer?: string
}

const clean = (v: string | null | undefined) => (v ? v.trim().slice(0, 100) : undefined)

export function readAttribution(): Attribution {
  try {
    return JSON.parse(sessionStorage.getItem(KEY) || '{}') as Attribution
  } catch {
    return {}
  }
}

export function captureAttribution() {
  try {
    const params = new URLSearchParams(location.search)
    const hasUtm = UTM_KEYS.some((k) => params.get(k))
    const stored = readAttribution()
    if (!hasUtm && stored.landing) return

    const next: Attribution = { landing: location.pathname }
    for (const k of UTM_KEYS) next[k] = clean(params.get(k))

    let ref: string | undefined
    try {
      const host = document.referrer ? new URL(document.referrer).hostname : ''
      ref = host && host !== location.hostname ? host : undefined
    } catch {
      ref = undefined
    }
    next.referrer = clean(ref) ?? stored.referrer

    sessionStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    /* storage unavailable */
  }
}

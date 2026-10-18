import { readConsent } from './consent'

const COUNTER_ID = 113661362

declare global {
  interface Window {
    ym?: (id: number, method: string, ...args: unknown[]) => void
  }
}

export function reachGoal(goal: string, params?: Record<string, unknown>) {
  window.ym?.(COUNTER_ID, 'reachGoal', goal, params)
}

/** Site language as a visit parameter (Metrika) and dataLayer variable (GTM/GA4). */
export function setPageLanguage(lang: string) {
  window.ym?.(COUNTER_ID, 'params', { page_language: lang })
  window.dataLayer = window.dataLayer || []
  window.dataLayer.push({ page_language: lang })
}

export function trackLanguageSwitch(from: string, to: string) {
  reachGoal('lang_switch', { from, to })
  if (readConsent()?.analytics) {
    window.dataLayer = window.dataLayer || []
    window.dataLayer.push({ event: 'language_switch', lang_from: from, lang_to: to })
  }
}

export function trackClicks(e: MouseEvent) {
  const a = (e.target as Element | null)?.closest?.('a')
  const href = a?.getAttribute('href')
  if (!href) return
  if (href.startsWith('tel:')) reachGoal('click_phone')
  else if (href.startsWith('mailto:')) reachGoal('click_email')
  else if (/^https?:\/\/t\.me\//.test(href)) reachGoal('click_telegram')
}

export function trackLead(eventId: string, lang = 'ru') {
  reachGoal('lead_submit', { page_language: lang })
  if (readConsent()?.analytics) {
    window.dataLayer = window.dataLayer || []
    window.dataLayer.push({ event: 'generate_lead', event_id: eventId, page_language: lang })
  }
}

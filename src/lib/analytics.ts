const COUNTER_ID = 113661362

declare global {
  interface Window {
    ym?: (id: number, method: string, ...args: unknown[]) => void
  }
}

export function reachGoal(goal: string) {
  window.ym?.(COUNTER_ID, 'reachGoal', goal)
}

export function trackClicks(e: MouseEvent) {
  const a = (e.target as Element | null)?.closest?.('a')
  const href = a?.getAttribute('href')
  if (!href) return
  if (href.startsWith('tel:')) reachGoal('click_phone')
  else if (href.startsWith('mailto:')) reachGoal('click_email')
  else if (/^https?:\/\/t\.me\//.test(href)) reachGoal('click_telegram')
}

export type Theme = 'dark' | 'light'

const KEY = 'st96-theme'
const COLORS: Record<Theme, string> = { dark: '#09090b', light: '#f5f4ef' }

export function readTheme(): Theme {
  const t = document.documentElement.dataset.theme
  return t === 'light' ? 'light' : 'dark'
}

export function applyTheme(theme: Theme, animate = false) {
  const root = document.documentElement
  if (animate) {
    root.classList.add('theme-anim')
    window.setTimeout(() => root.classList.remove('theme-anim'), 350)
  }
  if (theme === 'light') root.dataset.theme = 'light'
  else delete root.dataset.theme
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', COLORS[theme])
  try {
    localStorage.setItem(KEY, theme)
  } catch {
    /* storage unavailable */
  }
}

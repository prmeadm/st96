import { useLocation } from 'react-router-dom'
import { ui } from '../data/ui'

export type Lang = 'ru' | 'en'

export const LANGS: Lang[] = ['ru', 'en']

export function langFromPath(pathname: string): Lang {
  return pathname === '/en' || pathname.startsWith('/en/') ? 'en' : 'ru'
}

/** Path without language prefix and trailing slash: '/en/ai/' -> '/ai', '/en' -> '/'. */
export function stripLang(pathname: string): string {
  const p = langFromPath(pathname) === 'en' ? pathname.slice(3) || '/' : pathname
  return p.length > 1 ? p.replace(/\/+$/, '') : p
}

/** Adds the language prefix. Accepts '/', '/ai', '/#lead', '/privacy#cookies'. */
export function localePath(lang: Lang, path: string): string {
  if (lang === 'ru') return path
  return path === '/' ? '/en' : `/en${path}`
}

export function useLang(): Lang {
  return langFromPath(useLocation().pathname)
}

export function useUi() {
  return ui[useLang()]
}

import { useEffect } from 'react'
import { localePath, useLang } from '../lib/i18n'

type SeoOptions = {
  title: string
  description: string
  /** Language-neutral path, e.g. '/', '/ai', '/privacy'. */
  path: string
}

const BASE_URL = 'https://st96.by'

function setMeta(selector: string, attr: string, value: string) {
  document.head.querySelector(selector)?.setAttribute(attr, value)
}

function setAlternate(hreflang: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="alternate"][hreflang="${hreflang}"]`)
  if (!el) {
    el = document.createElement('link')
    el.rel = 'alternate'
    el.hreflang = hreflang
    document.head.appendChild(el)
  }
  el.href = href
}

export function useSeo({ title, description, path }: SeoOptions) {
  const lang = useLang()

  useEffect(() => {
    const url = `${BASE_URL}${localePath(lang, path)}`
    document.documentElement.lang = lang
    document.title = title
    setMeta('meta[name="description"]', 'content', description)
    setMeta('link[rel="canonical"]', 'href', url)
    setMeta('meta[property="og:title"]', 'content', title)
    setMeta('meta[property="og:description"]', 'content', description)
    setMeta('meta[property="og:url"]', 'content', url)
    setMeta('meta[property="og:locale"]', 'content', lang === 'en' ? 'en_US' : 'ru_RU')
    setMeta('meta[name="twitter:title"]', 'content', title)
    setMeta('meta[name="twitter:description"]', 'content', description)
    setAlternate('ru', `${BASE_URL}${localePath('ru', path)}`)
    setAlternate('en', `${BASE_URL}${localePath('en', path)}`)
    setAlternate('x-default', `${BASE_URL}${localePath('ru', path)}`)
  }, [title, description, path, lang])
}

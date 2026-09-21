import { useEffect } from 'react'

type SeoOptions = {
  title: string
  description: string
  path: string
}

const BASE_URL = 'https://st96.by'

function setMeta(selector: string, attr: string, value: string) {
  document.head.querySelector(selector)?.setAttribute(attr, value)
}

export function useSeo({ title, description, path }: SeoOptions) {
  useEffect(() => {
    const url = `${BASE_URL}${path}`
    document.title = title
    setMeta('meta[name="description"]', 'content', description)
    setMeta('link[rel="canonical"]', 'href', url)
    setMeta('meta[property="og:title"]', 'content', title)
    setMeta('meta[property="og:description"]', 'content', description)
    setMeta('meta[property="og:url"]', 'content', url)
    setMeta('meta[name="twitter:title"]', 'content', title)
    setMeta('meta[name="twitter:description"]', 'content', description)
  }, [title, description, path])
}

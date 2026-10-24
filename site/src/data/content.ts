import type { Lang } from '../lib/i18n'
import { services as servicesRu, type Service } from '../../../shared/data/services'
import {
  studioAccent,
  studioAdvantages,
  studioAdvantagesLead,
  studioProcess,
  studioProcessLead,
  studioQuote,
  studioStats,
} from './home'
import { homeEn, servicesEn } from '../../../shared/data/content.en'

export function getServices(lang: Lang): Service[] {
  if (lang === 'ru') return servicesRu
  return servicesRu.map((s) => ({ ...s, ...servicesEn[s.slug] }))
}

export function getServiceBySlug(lang: Lang, slug: string): Service | undefined {
  return getServices(lang).find((s) => s.slug === slug)
}

export function getHomeContent(lang: Lang) {
  if (lang === 'en') return { accent: studioAccent, ...homeEn }
  return {
    accent: studioAccent,
    advantagesLead: studioAdvantagesLead,
    advantages: studioAdvantages,
    processLead: studioProcessLead,
    process: studioProcess,
    stats: studioStats,
    quote: studioQuote,
  }
}

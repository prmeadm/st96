import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import SectionHeading from '../ui/SectionHeading'
import { StaggerGroup, StaggerItem } from '../ui/Reveal'
import { localePath, useLang } from '../../lib/i18n'

type CatalogButton = { label: string; action: 'cart' | 'discuss' | 'link'; href?: string }
type CatalogItem = {
  id: string
  kind: 'service' | 'product'
  slug: string
  title: string
  description: string | null
  price: number | null
  currency: string
  buttons: CatalogButton[]
  media_type: 'photo' | 'video' | null
  media_url: string | null
  page: string
  sort: number
}

const copy = {
  ru: {
    kicker: 'Каталог',
    title: 'Услуги и продукты',
    order: 'Заказать',
    discuss: 'Обсудить проект',
    currency: 'BYN',
  },
  en: {
    kicker: 'Catalog',
    title: 'Services and products',
    order: 'Order',
    discuss: 'Discuss a project',
    currency: 'BYN',
  },
} as const

/** Динамический каталог услуг и продуктов: позиции, назначенные админкой на эту страницу. */
export default function CatalogSection({ page }: { page: string }) {
  const lang = useLang()
  const t = copy[lang]
  const navigate = useNavigate()
  const [items, setItems] = useState<CatalogItem[] | null>(null)

  useEffect(() => {
    let alive = true
    fetch('/api/catalog?page=' + encodeURIComponent(page), { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => { if (alive) setItems((d?.items ?? []) as CatalogItem[]) })
      .catch(() => { if (alive) setItems([]) })
    return () => { alive = false }
  }, [page])

  if (!items || items.length === 0) return null

  const buttons = (item: CatalogItem): CatalogButton[] =>
    item.buttons.length ? item.buttons : [{ label: t.order, action: 'cart' }, { label: t.discuss, action: 'discuss' }]

  const act = (item: CatalogItem, btn: CatalogButton) => {
    if (btn.action === 'cart') {
      navigate(localePath(lang, '/cabinet') + '?add=service:' + encodeURIComponent(item.slug))
    } else if (btn.action === 'discuss') {
      document.getElementById('lead')?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <section id="catalog" className="relative border-t border-ink-line py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading kicker={t.kicker} title={t.title} className="mb-12" />
        <StaggerGroup className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <StaggerItem key={item.id}>
              <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-ink-line bg-ink-soft">
                {item.media_type === 'photo' && item.media_url && (
                  <img src={item.media_url} alt={item.title} className="aspect-video w-full object-cover" loading="lazy" />
                )}
                {item.media_type === 'video' && item.media_url && (
                  <video src={item.media_url} controls playsInline className="aspect-video w-full object-cover" />
                )}
                <div className="flex flex-1 flex-col p-6">
                  <h3 className="font-display text-lg font-semibold leading-snug sm:text-xl">{item.title}</h3>
                  {item.description && <p className="mt-2 text-sm text-paper-dim">{item.description}</p>}
                  {item.price != null && (
                    <p className="mt-4 font-display text-2xl font-bold">
                      {item.price.toLocaleString(lang === 'ru' ? 'ru-RU' : 'en-US')} <span className="text-sm font-normal text-paper-dim">{t.currency}</span>
                    </p>
                  )}
                  <div className="mt-5 flex flex-wrap gap-2 pt-1">
                    {buttons(item).map((btn, i) =>
                      btn.action === 'link' ? (
                        <a
                          key={i}
                          href={btn.href}
                          target="_blank"
                          rel="noreferrer"
                          data-cursor-hover
                          className="inline-flex items-center gap-2 rounded-full border border-ink-line px-5 py-2.5 text-sm font-semibold text-paper transition-colors hover:border-paper-dim"
                        >
                          {btn.label}
                          <ArrowUpRight className="h-4 w-4" />
                        </a>
                      ) : (
                        <button
                          key={i}
                          type="button"
                          onClick={() => act(item, btn)}
                          data-cursor-hover
                          className={
                            btn.action === 'cart'
                              ? 'inline-flex items-center gap-2 rounded-full px-5 py-2.5 font-display text-sm font-semibold text-on-solid transition-opacity hover:opacity-90'
                              : 'inline-flex items-center gap-2 rounded-full border border-ink-line px-5 py-2.5 text-sm font-semibold text-paper transition-colors hover:border-paper-dim'
                          }
                          style={btn.action === 'cart' ? { background: 'var(--color-acid-solid)' } : undefined}
                        >
                          {btn.label}
                          <ArrowUpRight className="h-4 w-4" />
                        </button>
                      ),
                    )}
                  </div>
                </div>
              </article>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </div>
    </section>
  )
}

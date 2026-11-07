import { useCallback, useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react'
import type { Service } from '../../../../shared/data/services'
import { SolutionSceneCard } from '../ui/SolutionScene'
import { useLang } from '../../lib/i18n'
import { reachGoal } from '../../lib/analytics'
import MagneticButton from '../ui/MagneticButton'
import Reveal from '../ui/Reveal'

const copy = {
  ru: {
    order: 'Заказать',
    prefill: 'Хочу заказать: ',
    prev: 'Назад',
    next: 'Вперёд',
    cta: 'Обсудить проект',
  },
  en: {
    order: 'Order',
    prefill: "I'd like to order: ",
    prev: 'Previous',
    next: 'Next',
    cta: 'Discuss a project',
  },
} as const

/** Галерея направлений услуги: карточки с короткой анимацией сверху, описанием и кнопкой «Заказать». */
export default function ProducingGallery({ service }: { service: Service }) {
  const lang = useLang()
  const t = copy[lang]
  const offers = service.offers ?? []
  const accent = service.accent
  const track = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  const [inView, setInView] = useState(false)
  const [hold, setHold] = useState(false)
  const [state, setState] = useState({ first: 1, perView: 1, atStart: true, atEnd: false })

  const update = useCallback(() => {
    const el = track.current
    const slide = el?.firstElementChild as HTMLElement | null
    if (!el || !slide) return
    const step = slide.offsetWidth + parseFloat(getComputedStyle(el).columnGap || '0')
    const perView = Math.max(1, Math.round(el.clientWidth / step))
    setState({
      first: Math.round(el.scrollLeft / step) + 1,
      perView,
      atStart: el.scrollLeft < 4,
      atEnd: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4,
    })
  }, [])

  useEffect(() => {
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [update])

  const go = (dir: 1 | -1, count = state.perView) => {
    const el = track.current
    const slide = el?.firstElementChild as HTMLElement | null
    if (!el || !slide) return
    const step = slide.offsetWidth + parseFloat(getComputedStyle(el).columnGap || '0')
    el.scrollBy({ left: dir * step * count, behavior: 'smooth' })
  }

  useEffect(() => {
    const el = track.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.3 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (reduced || hold || !inView) return
    const id = setInterval(() => {
      const el = track.current
      if (!el || document.hidden) return
      if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 4) el.scrollTo({ left: 0, behavior: 'smooth' })
      else go(1, 1)
    }, 4500)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced, hold, inView])

  const order = (key: string, title: string) => {
    reachGoal('producing_order_click', { direction: key })
    window.dispatchEvent(new CustomEvent('st96:lead-prefill', { detail: { message: `${t.prefill}${title}` } }))
    document.getElementById('lead')?.scrollIntoView({ behavior: 'smooth' })
  }

  const total = offers.length
  const last = Math.min(total, state.first + state.perView - 1)
  const pad = (n: number) => String(n).padStart(2, '0')

  if (!total) return null

  return (
    <section id="offers" className="relative border-t border-ink-line py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="mb-12 grid grid-cols-1 gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end lg:gap-16">
          <Reveal>
            <h2 className="text-balance font-display text-3xl leading-[1.1] font-semibold sm:text-4xl md:text-5xl">
              {service.offersTitle ?? service.navLabel}
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="text-paper-dim">{service.offersLead}</p>
          </Reveal>
        </div>

        <div
          ref={track}
          onScroll={update}
          onPointerEnter={() => setHold(true)}
          onPointerLeave={() => setHold(false)}
          onFocus={() => setHold(true)}
          onBlur={() => setHold(false)}
          onTouchStart={() => setHold(true)}
          onTouchEnd={() => setTimeout(() => setHold(false), 6000)}
          role="region"
          aria-roledescription="carousel"
          aria-label={service.offersTitle ?? service.navLabel}
          tabIndex={0}
          className="no-scrollbar flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth pb-2 outline-none"
        >
          {offers.map((o, i) => (
            <article
              key={o.key}
              className="group flex w-full shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-ink-line bg-ink-soft transition-colors duration-300 hover:border-paper-dim/50 md:w-[calc((100%-3rem)/3)]"
              aria-label={`${i + 1} / ${total}`}
            >
              <div className="p-3 pb-0">
                <SolutionSceneCard slug={o.key} lang={lang} />
              </div>
              <div className="relative flex flex-1 items-stretch gap-4 p-6">
                <span className="self-start font-display text-sm font-semibold" style={{ color: accent.solid }}>
                  {pad(i + 1)}
                </span>
                <div className="flex min-w-0 flex-1 flex-col">
                  <h3 className="font-display text-lg leading-snug font-semibold sm:text-xl">{o.title}</h3>
                  <p className="mt-2 mb-5 text-sm text-paper-dim">{o.text}</p>
                  <button
                    type="button"
                    onClick={() => order(o.key, o.title)}
                    data-cursor-hover
                    className="group/order mt-auto inline-flex w-fit items-center gap-2 rounded-full border-2 border-[var(--c)] bg-transparent px-5 py-2.5 font-display text-xs font-semibold text-[var(--c)] transition-[background-color,color,transform] duration-200 ease-out hover:bg-[var(--c)] hover:text-ink active:scale-[0.97] motion-reduce:transition-colors"
                    style={{ ['--c' as string]: accent.solid }}
                  >
                    {t.order}
                    <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-200 ease-out group-hover/order:translate-x-0.5 group-hover/order:-translate-y-0.5" />
                  </button>
                </div>
                <div
                  className="absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 transition-transform duration-500 group-hover:scale-x-100"
                  style={{ background: `linear-gradient(90deg, ${accent.from}, ${accent.to})` }}
                />
              </div>
            </article>
          ))}
        </div>

        <div className="mt-8 flex items-center justify-between gap-4">
          <p className="font-display text-sm font-semibold text-paper-dim" aria-live="polite">
            <span className="text-paper">
              {state.perView > 1 ? `${pad(state.first)}–${pad(last)}` : pad(state.first)}
            </span>{' '}
            / {pad(total)}
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => go(-1)}
              disabled={state.atStart}
              aria-label={t.prev}
              data-cursor-hover
              className="grid h-12 w-12 place-items-center rounded-full border border-ink-line text-paper transition-colors hover:border-paper-dim disabled:opacity-30"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              disabled={state.atEnd}
              aria-label={t.next}
              data-cursor-hover
              className="grid h-12 w-12 place-items-center rounded-full border border-ink-line text-paper transition-colors hover:border-paper-dim disabled:opacity-30"
            >
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        <Reveal className="mt-14 flex justify-center">
          <MagneticButton
            as="a"
            href="#lead"
            className="inline-flex items-center gap-2 rounded-full px-8 py-4 font-display text-sm font-semibold text-on-solid"
            style={{ background: accent.btn }}
          >
            {t.cta}
            <ArrowUpRight className="h-4 w-4" />
          </MagneticButton>
        </Reveal>
      </div>
    </section>
  )
}

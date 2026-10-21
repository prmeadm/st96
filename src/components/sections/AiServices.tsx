import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react'
import { accents } from '../../data/services'
import { aiServiceItems, aiServicesIntro } from '../../data/aiServices'
import { useLang } from '../../lib/i18n'
import HeroVideo from '../ui/HeroVideo'
import MagneticButton from '../ui/MagneticButton'
import Reveal from '../ui/Reveal'

export default function AiServices() {
  const lang = useLang()
  const t = aiServicesIntro[lang]
  const accent = accents.ai
  const track = useRef<HTMLDivElement>(null)
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

  const go = (dir: 1 | -1) => {
    const el = track.current
    const slide = el?.firstElementChild as HTMLElement | null
    if (!el || !slide) return
    const step = slide.offsetWidth + parseFloat(getComputedStyle(el).columnGap || '0')
    el.scrollBy({ left: dir * step * state.perView, behavior: 'smooth' })
  }

  const total = aiServiceItems.length
  const last = Math.min(total, state.first + state.perView - 1)
  const pad = (n: number) => String(n).padStart(2, '0')

  return (
    <section id="ai-solutions" className="relative border-t border-ink-line py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="mb-12 grid grid-cols-1 gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end lg:gap-16">
          <Reveal>
            <h2 className="text-balance font-display text-3xl leading-[1.1] font-semibold sm:text-4xl md:text-5xl">
              {t.title}
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="text-paper-dim">{t.sub}</p>
          </Reveal>
        </div>

        <div
          ref={track}
          onScroll={update}
          role="region"
          aria-roledescription="carousel"
          aria-label={t.title}
          tabIndex={0}
          className="no-scrollbar flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth pb-2 outline-none"
        >
          {aiServiceItems.map((s, i) => (
            <article
              key={s.slug}
              className="w-full shrink-0 snap-start md:w-[calc((100%-3rem)/3)]"
              aria-label={`${i + 1} / ${total}`}
            >
              <HeroVideo
                src={`/video/ai-services/${s.slug}-${lang}.mp4`}
                poster={`/video/ai-services/${s.slug}-${lang}.jpg`}
                accent={accent}
                audio
                glow={false}
                label={s.slug}
              />
              <div className="mt-5 flex items-start gap-4">
                <span className="font-display text-sm font-semibold" style={{ color: accent.solid }}>
                  {pad(i + 1)}
                </span>
                <div>
                  <h3 className="font-display text-lg leading-snug font-semibold sm:text-xl">{s.title[lang]}</h3>
                  <p className="mt-2 text-sm text-paper-dim">{s.text[lang]}</p>
                </div>
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
            className="inline-flex items-center gap-2 rounded-full px-8 py-4 font-display text-sm font-semibold text-ink"
            style={{ background: accent.solid }}
          >
            {t.cta}
            <ArrowUpRight className="h-4 w-4" />
          </MagneticButton>
        </Reveal>
      </div>
    </section>
  )
}

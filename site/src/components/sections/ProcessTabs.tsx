import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Check } from 'lucide-react'
import type { Accent, ProcessStep } from '../../../../shared/data/services'
import { useUi } from '../../lib/i18n'
import SectionHeading from '../ui/SectionHeading'

const AUTO_MS = 6000
const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)'

type ProcessData = {
  accent: Accent
  processLead: string
  process: ProcessStep[]
}

export default function ProcessTabs({ service }: { service: ProcessData }) {
  const t = useUi()
  const [active, setActive] = useState(0)
  const [auto, setAuto] = useState(true)
  const [inView, setInView] = useState(true)
  const [hover, setHover] = useState(false)
  const [reduced, setReduced] = useState(false)
  const [heights, setHeights] = useState<number[]>([])
  const rootRef = useRef<HTMLElement>(null)
  const descRefs = useRef<(HTMLDivElement | null)[]>([])
  const n = service.process.length

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const f = () => setReduced(mq.matches)
    f()
    mq.addEventListener('change', f)
    return () => mq.removeEventListener('change', f)
  }, [])

  useEffect(() => {
    const el = rootRef.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.2 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // natural heights of every step description, so the list keeps a constant total height
  useLayoutEffect(() => {
    const measure = () => setHeights(descRefs.current.slice(0, n).map((el) => el?.offsetHeight ?? 0))
    measure()
    const ro = new ResizeObserver(measure)
    descRefs.current.slice(0, n).forEach((el) => el && ro.observe(el))
    return () => ro.disconnect()
  }, [n, service.process])

  const running = auto && !reduced
  const paused = !inView || hover
  const maxH = Math.max(0, ...heights)
  const fillH = heights.length ? maxH - (heights[active] ?? 0) : 0

  const select = (i: number) => {
    setActive(i)
    setAuto(false)
  }

  return (
    <section ref={rootRef} id="process" className="relative border-t border-ink-line py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading kicker={t.processKicker} title={service.processLead} accent={service.accent.solid} className="mb-14" />

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div className="flex flex-col gap-2" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} onFocus={() => setHover(true)} onBlur={() => setHover(false)}>
            {service.process.map((step, i) => (
              <button
                key={step.step}
                onClick={() => select(i)}
                data-cursor-hover
                className={`group relative w-full overflow-hidden rounded-xl border px-5 py-4 text-left transition-colors sm:px-6 sm:py-5 ${
                  active === i ? 'border-ink-line bg-ink-soft' : 'border-transparent hover:bg-ink-soft/50'
                }`}
              >
                <div className="flex items-center gap-4">
                  <span
                    className="font-display text-sm font-semibold shrink-0"
                    style={{ color: active === i ? service.accent.solid : 'var(--color-paper-dim)' }}
                  >
                    {step.step}
                  </span>
                  <span className={`font-display font-medium ${active === i ? 'text-paper' : 'text-paper-dim'} text-base sm:text-lg`}>
                    {step.title}
                  </span>
                </div>

                <div
                  className="overflow-hidden"
                  style={{
                    height: heights.length ? (active === i ? heights[i] : 0) : active === i ? 'auto' : 0,
                    opacity: active === i ? 1 : 0,
                    transition: `height 0.4s ${EASE}, opacity 0.4s ${EASE}`,
                  }}
                  aria-hidden={active !== i}
                >
                  <div ref={(el) => { descRefs.current[i] = el }}>
                    <p className="mt-3 pl-9 text-paper-dim">{step.text}</p>
                    <ul className="mt-3 space-y-2 pl-9 lg:hidden">
                      {step.points.map((p) => (
                        <li key={p} className="flex items-start gap-2 text-sm text-paper-dim">
                          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: service.accent.solid }} />
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {active === i && running && (
                  <div
                    key={active}
                    className="absolute inset-x-0 bottom-0 h-0.5"
                    style={{
                      background: service.accent.solid,
                      transformOrigin: 'left',
                      animation: `process-progress ${AUTO_MS}ms linear forwards`,
                      animationPlayState: paused ? 'paused' : 'running',
                    }}
                    onAnimationEnd={() => setActive((v) => (v + 1) % n)}
                  />
                )}
              </button>
            ))}
            <div aria-hidden style={{ height: fillH, transition: `height 0.4s ${EASE}` }} />
          </div>

          <div className="relative hidden overflow-hidden rounded-2xl border border-ink-line bg-ink-soft p-10 lg:block">
            <div
              className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full opacity-30 blur-[90px]"
              style={{ background: service.accent.solid }}
            />
            <div className="relative grid">
              {service.process.map((cur, i) => (
                <div
                  key={cur.step}
                  aria-hidden={active !== i}
                  className="relative [grid-area:1/1]"
                  style={{
                    opacity: active === i ? 1 : 0,
                    visibility: active === i ? 'visible' : 'hidden',
                    transform: `translateY(${active === i ? 0 : active > i ? -16 : 16}px)`,
                    transition: `opacity 0.45s ${EASE}, transform 0.45s ${EASE}, visibility 0s linear ${active === i ? '0s' : '0.45s'}`,
                  }}
                >
                  <span className="font-display text-8xl font-bold opacity-10">{cur.step}</span>
                  <h3 className="mt-4 font-display text-3xl font-semibold">{cur.title}</h3>
                  <p className="mt-4 max-w-md text-paper-dim">{cur.text}</p>
                  <ul className="mt-6 space-y-3">
                    {cur.points.map((p) => (
                      <li key={p} className="flex items-start gap-2.5 text-paper">
                        <span
                          className="mt-1 grid h-4 w-4 shrink-0 place-items-center rounded-full"
                          style={{ background: `color-mix(in srgb, ${service.accent.solid} 20%, transparent)` }}
                        >
                          <Check className="h-2.5 w-2.5" style={{ color: service.accent.solid }} />
                        </span>
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <style>{`@keyframes process-progress{from{transform:scaleX(0)}to{transform:scaleX(1)}}`}</style>
    </section>
  )
}

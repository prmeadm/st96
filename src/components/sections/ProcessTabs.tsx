import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check } from 'lucide-react'
import type { Accent, ProcessStep } from '../../data/services'
import SectionHeading from '../ui/SectionHeading'

const AUTO_MS = 6000

type ProcessData = {
  accent: Accent
  processLead: string
  process: ProcessStep[]
}

export default function ProcessTabs({ service }: { service: ProcessData }) {
  const [active, setActive] = useState(0)
  const [auto, setAuto] = useState(true)

  useEffect(() => {
    if (!auto) return
    const t = setInterval(() => {
      setActive((v) => (v + 1) % service.process.length)
    }, AUTO_MS)
    return () => clearInterval(t)
  }, [auto, service.process.length])

  const select = (i: number) => {
    setActive(i)
    setAuto(false)
  }

  const current = service.process[active]

  return (
    <section id="process" className="relative border-t border-ink-line py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading kicker="Как мы работаем" title={service.processLead} accent={service.accent.solid} className="mb-14" />

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div className="flex flex-col gap-2">
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

                <AnimatePresence>
                  {active === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="mt-3 pl-9 text-paper-dim">{step.text}</p>
                      <ul className="mt-3 space-y-2 pl-9 lg:hidden">
                        {step.points.map((p) => (
                          <li key={p} className="flex items-start gap-2 text-sm text-paper-dim">
                            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: service.accent.solid }} />
                            {p}
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  )}
                </AnimatePresence>

                {active === i && (
                  <motion.div
                    key={active}
                    className="absolute inset-x-0 bottom-0 h-0.5"
                    style={{ background: service.accent.solid, transformOrigin: 'left' }}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: auto ? 1 : 0 }}
                    transition={{ duration: auto ? AUTO_MS / 1000 : 0, ease: 'linear' }}
                  />
                )}
              </button>
            ))}
          </div>

          <div className="relative hidden overflow-hidden rounded-2xl border border-ink-line bg-ink-soft p-10 lg:block">
            <div
              className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full opacity-30 blur-[90px]"
              style={{ background: service.accent.solid }}
            />
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                className="relative"
              >
                <span className="font-display text-8xl font-bold opacity-10">{current.step}</span>
                <h3 className="mt-4 font-display text-3xl font-semibold">{current.title}</h3>
                <p className="mt-4 max-w-md text-paper-dim">{current.text}</p>
                <ul className="mt-6 space-y-3">
                  {current.points.map((p) => (
                    <li key={p} className="flex items-start gap-2.5 text-paper">
                      <span
                        className="mt-1 grid h-4 w-4 shrink-0 place-items-center rounded-full"
                        style={{ background: `${service.accent.solid}33` }}
                      >
                        <Check className="h-2.5 w-2.5" style={{ color: service.accent.solid }} />
                      </span>
                      {p}
                    </li>
                  ))}
                </ul>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  )
}

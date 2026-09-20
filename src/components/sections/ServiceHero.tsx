import { motion } from 'framer-motion'
import { ArrowDown, ArrowUpRight } from 'lucide-react'
import type { Service } from '../../data/services'
import Aurora from '../ui/Aurora'
import RevealText from '../ui/RevealText'
import KeywordOrbit from '../ui/KeywordOrbit'
import MagneticButton from '../ui/MagneticButton'

export default function ServiceHero({ service }: { service: Service }) {
  return (
    <section className="relative flex min-h-[100svh] items-center overflow-hidden pt-28 pb-16 sm:pt-32">
      <Aurora accent={service.accent} />

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-14 px-5 sm:px-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-8">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-ink-line px-4 py-1.5 text-xs font-semibold tracking-[0.15em] text-paper-dim uppercase"
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: service.accent.solid }}
            />
            {service.kicker} · {service.index}/04
          </motion.div>

          <RevealText
            lines={service.title}
            as="h1"
            className="font-display text-[clamp(2.1rem,7vw,4.2rem)] leading-[1.05] font-semibold text-balance"
          />

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-6 max-w-xl text-balance text-lg text-paper-dim sm:text-xl"
          >
            {service.tagline}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.65 }}
            className="mt-9 flex flex-wrap items-center gap-4"
          >
            <MagneticButton
              as="a"
              href="#lead"
              className="inline-flex items-center gap-2 rounded-full px-7 py-4 font-display text-sm font-semibold text-ink"
              style={{ background: service.accent.solid }}
            >
              {service.ctaTitle.includes('?') ? 'Обсудить проект' : service.ctaTitle}
              <ArrowUpRight className="h-4 w-4" />
            </MagneticButton>
            <a
              href="#process"
              data-cursor-hover
              className="inline-flex items-center gap-2 rounded-full border border-ink-line px-7 py-4 text-sm font-semibold text-paper transition-colors hover:border-paper-dim"
            >
              {service.heroNote}
            </a>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <KeywordOrbit keywords={service.keywords} accent={service.accent} />
        </motion.div>
      </div>

      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
      >
        <ArrowDown className="h-5 w-5 text-paper-dim" />
      </motion.div>
    </section>
  )
}

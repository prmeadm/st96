import { motion } from 'framer-motion'
import type { Accent, Advantage } from '../../data/services'
import SectionHeading from '../ui/SectionHeading'
import { StaggerGroup, StaggerItem } from '../ui/Reveal'

type AdvantagesData = {
  accent: Accent
  advantagesLead: string
  advantages: Advantage[]
}

export default function Advantages({ service }: { service: AdvantagesData }) {
  return (
    <section className="relative border-t border-ink-line py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="mb-14 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading kicker="Преимущества" title="Почему выбирают нас" accent={service.accent.solid} />
          <p className="max-w-sm text-paper-dim">{service.advantagesLead}</p>
        </div>

        <StaggerGroup className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-ink-line bg-ink-line sm:grid-cols-2">
          {service.advantages.map((a, i) => (
            <StaggerItem key={a.title}>
              <motion.div
                whileHover={{ backgroundColor: 'var(--color-ink-soft)' }}
                className="group relative h-full bg-ink p-8 transition-colors sm:p-10"
              >
                <span
                  className="font-display text-sm font-semibold"
                  style={{ color: service.accent.solid }}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="mt-4 font-display text-xl font-semibold sm:text-2xl">{a.title}</h3>
                <p className="mt-3 text-paper-dim">{a.text}</p>
                <div
                  className="absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 transition-transform duration-500 group-hover:scale-x-100"
                  style={{ background: `linear-gradient(90deg, ${service.accent.from}, ${service.accent.to})` }}
                />
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </div>
    </section>
  )
}

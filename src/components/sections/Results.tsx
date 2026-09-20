import { Quote } from 'lucide-react'
import type { Accent, Stat } from '../../data/services'
import AnimatedCounter from '../ui/AnimatedCounter'
import Reveal, { StaggerGroup, StaggerItem } from '../ui/Reveal'

type ResultsData = {
  accent: Accent
  stats: Stat[]
  quote: { text: string; author: string }
}

export default function Results({ service }: { service: ResultsData }) {
  return (
    <section className="relative border-t border-ink-line py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <StaggerGroup className="grid grid-cols-1 gap-8 border-b border-ink-line pb-16 sm:grid-cols-3 sm:gap-6">
          {service.stats.map((stat) => (
            <StaggerItem key={stat.label}>
              <div
                className="font-display text-5xl font-bold sm:text-6xl"
                style={{ color: service.accent.solid }}
              >
                <AnimatedCounter value={stat.value} suffix={stat.suffix} />
              </div>
              <p className="mt-2 text-paper-dim">{stat.label}</p>
            </StaggerItem>
          ))}
        </StaggerGroup>

        <Reveal className="pt-16">
          <div className="flex flex-col items-start gap-6 sm:flex-row">
            <Quote className="h-10 w-10 shrink-0" style={{ color: service.accent.solid }} />
            <div>
              <p className="text-balance font-display text-2xl leading-snug font-medium sm:text-3xl">
                «{service.quote.text}»
              </p>
              <p className="mt-4 text-paper-dim">— {service.quote.author}</p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

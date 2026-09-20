import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { services } from '../../data/services'
import SectionHeading from '../ui/SectionHeading'
import { StaggerGroup, StaggerItem } from '../ui/Reveal'

export default function ServicesGrid() {
  return (
    <section id="services" className="relative border-t border-ink-line py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading kicker="Услуги" title="Что мы делаем" className="mb-14" />

        <StaggerGroup className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-ink-line bg-ink-line sm:grid-cols-2">
          {services.map((s) => (
            <StaggerItem key={s.slug}>
              <Link to={`/${s.slug}`} data-cursor-hover className="group relative block h-full bg-ink p-8 sm:p-10">
                <div
                  className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                  style={{
                    background: `linear-gradient(135deg, ${s.accent.from}14, transparent 60%)`,
                  }}
                />
                <div className="relative flex items-start justify-between">
                  <span className="font-display text-sm font-semibold" style={{ color: s.accent.solid }}>
                    {s.index}
                  </span>
                  <ArrowUpRight className="h-5 w-5 -translate-y-1 translate-x-1 text-paper-dim opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:translate-x-0 group-hover:text-paper group-hover:opacity-100" />
                </div>
                <h3 className="relative mt-6 font-display text-2xl font-semibold sm:text-3xl">
                  {s.navLabel}
                </h3>
                <p className="relative mt-3 max-w-sm text-paper-dim">{s.tagline}</p>
                <div className="relative mt-6 flex flex-wrap gap-2">
                  {s.keywords.slice(0, 3).map((k) => (
                    <span
                      key={k}
                      className="rounded-full border border-ink-line px-3 py-1 text-xs text-paper-dim"
                    >
                      {k}
                    </span>
                  ))}
                </div>
                <div
                  className="absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 transition-transform duration-500 group-hover:scale-x-100"
                  style={{ background: `linear-gradient(90deg, ${s.accent.from}, ${s.accent.to})` }}
                />
              </Link>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </div>
    </section>
  )
}

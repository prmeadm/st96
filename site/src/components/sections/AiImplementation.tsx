import { ArrowUpRight } from 'lucide-react'
import type { Service } from '../../../../crm/shared/data/services'
import SectionHeading from '../ui/SectionHeading'
import { StaggerGroup, StaggerItem } from '../ui/Reveal'
import MagneticButton from '../ui/MagneticButton'
import { useUi } from '../../lib/i18n'

/** Отдельный блок «Внедрение AI» (услуга «Поддержка»): углубляем AI в сервис, продажи, менеджмент. */
export default function AiImplementation({ service }: { service: Service }) {
  const t = useUi()
  const block = service.aiBlock
  if (!block) return null
  const accent = service.accent

  return (
    <section className="relative border-t border-ink-line py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="mb-14 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading kicker={block.kicker} title={block.title} accent={accent.solid} />
          <p className="max-w-sm text-paper-dim">{block.lead}</p>
        </div>

        <StaggerGroup className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-ink-line bg-ink-line sm:grid-cols-2">
          {block.points.map((p, i) => (
            <StaggerItem key={p.title}>
              <div className="group relative h-full bg-ink p-8 transition-colors duration-300 hover:bg-ink-soft sm:p-10">
                <span className="font-display text-sm font-semibold" style={{ color: accent.solid }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="mt-4 font-display text-xl font-semibold sm:text-2xl">{p.title}</h3>
                <p className="mt-3 text-paper-dim">{p.text}</p>
                <div
                  className="absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 transition-transform duration-500 group-hover:scale-x-100"
                  style={{ background: `linear-gradient(90deg, ${accent.from}, ${accent.to})` }}
                />
              </div>
            </StaggerItem>
          ))}
        </StaggerGroup>

        <div className="mt-14 flex justify-center">
          <MagneticButton
            as="a"
            href="#lead"
            className="inline-flex items-center gap-2 rounded-full px-8 py-4 font-display text-sm font-semibold text-on-solid"
            style={{ background: accent.btn }}
          >
            {t.discuss}
            <ArrowUpRight className="h-4 w-4" />
          </MagneticButton>
        </div>
      </div>
    </section>
  )
}

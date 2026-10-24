import clsx from 'clsx'
import Reveal from './Reveal'

type Props = {
  kicker?: string
  title: string
  className?: string
  align?: 'left' | 'center'
  accent?: string
}

export default function SectionHeading({ kicker, title, className, align = 'left', accent }: Props) {
  return (
    <div className={clsx(align === 'center' && 'text-center mx-auto', className)}>
      {kicker && (
        <Reveal>
          <span
            className="mb-4 inline-flex items-center gap-2 font-display text-xs font-semibold tracking-[0.2em] uppercase text-paper-dim"
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: accent ?? 'var(--color-acid)' }}
            />
            {kicker}
          </span>
        </Reveal>
      )}
      <Reveal delay={0.05}>
        <h2 className="text-balance font-display text-3xl leading-[1.1] font-semibold sm:text-4xl md:text-5xl">
          {title}
        </h2>
      </Reveal>
    </div>
  )
}

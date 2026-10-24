import type { ReactNode } from 'react'
import clsx from 'clsx'

type Props = {
  items: ReactNode[]
  className?: string
  speedClass?: string
  reverse?: boolean
}

export default function Marquee({ items, className, speedClass = 'animate-marquee', reverse }: Props) {
  return (
    <div className={clsx('relative overflow-hidden mask-fade-x', className)}>
      <div
        className={clsx('flex w-max items-center gap-10 whitespace-nowrap', speedClass)}
        style={reverse ? { animationDirection: 'reverse' } : undefined}
      >
        {[...items, ...items].map((item, i) => (
          <div key={i} className="flex items-center gap-10">
            {item}
          </div>
        ))}
      </div>
    </div>
  )
}

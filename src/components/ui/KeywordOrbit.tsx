import { useRef } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import type { Accent } from '../../data/services'

type Props = {
  keywords: string[]
  accent: Accent
  centerLabel?: string
}

const ORBIT_DURATION = 40

export default function KeywordOrbit({ keywords, accent, centerLabel = 'ST96' }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [10, -10]), { stiffness: 120, damping: 20 })
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-10, 10]), { stiffness: 120, damping: 20 })

  const handleMove = (e: React.MouseEvent) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    mx.set((e.clientX - rect.left) / rect.width - 0.5)
    my.set((e.clientY - rect.top) / rect.height - 0.5)
  }

  const handleLeave = () => {
    mx.set(0)
    my.set(0)
  }

  const radius = 44
  const n = keywords.length

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className="relative mx-auto aspect-square w-full max-w-[420px]"
      style={{ perspective: 900 }}
    >
      <motion.div className="relative h-full w-full" style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}>
        {Array.from({ length: n }).map((_, i) => {
          const angle = (360 / n) * i
          return (
            <div
              key={`line-${i}`}
              className="absolute top-1/2 left-1/2 h-px origin-left opacity-20"
              style={{
                width: `${radius}%`,
                background: `linear-gradient(90deg, ${accent.solid}, transparent)`,
                transform: `rotate(${angle}deg)`,
              }}
            />
          )
        })}

        <motion.div
          className="absolute inset-0"
          animate={{ rotate: 360 }}
          transition={{ duration: ORBIT_DURATION, repeat: Infinity, ease: 'linear' }}
        >
          {keywords.map((word, i) => {
            const angle = (360 / n) * i
            return (
              <div
                key={word}
                className="absolute top-1/2 left-1/2"
                style={{ transform: `rotate(${angle}deg) translate(${radius}%) rotate(${-angle}deg)` }}
              >
                <motion.div
                  className="-translate-x-1/2 -translate-y-1/2"
                  animate={{ rotate: -360 }}
                  transition={{ duration: ORBIT_DURATION, repeat: Infinity, ease: 'linear' }}
                >
                  <motion.div
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 + i * 0.08, duration: 0.5 }}
                    whileHover={{ scale: 1.15, borderColor: accent.solid }}
                    data-cursor-hover
                    className="rounded-full border border-ink-line bg-ink-soft/80 px-3.5 py-2 text-xs font-medium whitespace-nowrap text-paper backdrop-blur-sm sm:text-sm"
                  >
                    {word}
                  </motion.div>
                </motion.div>
              </div>
            )
          })}
        </motion.div>

        <div className="absolute inset-0 grid place-items-center">
          <motion.div
            className="grid h-28 w-28 place-items-center rounded-full border border-ink-line text-center font-display text-sm font-bold sm:h-36 sm:w-36 sm:text-base"
            style={{
              background: `linear-gradient(135deg, ${accent.from}22, ${accent.to}22)`,
              boxShadow: `0 0 60px ${accent.soft}`,
            }}
            animate={{ scale: [1, 1.04, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          >
            {centerLabel}
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}

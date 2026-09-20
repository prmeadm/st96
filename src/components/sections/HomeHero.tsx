import { useRef } from 'react'
import { motion, useMotionTemplate, useMotionValue } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import RevealText from '../ui/RevealText'
import Marquee from '../ui/Marquee'
import MagneticButton from '../ui/MagneticButton'
import { services } from '../../data/services'

export default function HomeHero() {
  const ref = useRef<HTMLDivElement>(null)
  const mx = useMotionValue(50)
  const my = useMotionValue(50)
  const spotlight = useMotionTemplate`radial-gradient(600px circle at ${mx}% ${my}%, rgba(216,255,63,0.14), transparent 70%)`

  const handleMove = (e: React.MouseEvent) => {
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return
    mx.set(((e.clientX - rect.left) / rect.width) * 100)
    my.set(((e.clientY - rect.top) / rect.height) * 100)
  }

  return (
    <section
      ref={ref}
      onMouseMove={handleMove}
      className="relative flex min-h-[100svh] flex-col justify-center overflow-hidden pt-24"
    >
      <motion.div className="pointer-events-none absolute inset-0" style={{ background: spotlight }} />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            'linear-gradient(to right, #f5f4ef 1px, transparent 1px), linear-gradient(to bottom, #f5f4ef 1px, transparent 1px)',
          backgroundSize: '64px 64px',
        }}
      />
      <motion.div
        className="pointer-events-none absolute top-1/4 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full opacity-30 blur-[130px]"
        style={{ background: 'radial-gradient(circle, #8b6bff, transparent 70%)' }}
        animate={{ x: [0, 60, -40, 0], y: [0, -30, 30, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="relative mx-auto w-full max-w-7xl px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-ink-line px-4 py-1.5 text-xs font-semibold tracking-[0.15em] text-paper-dim uppercase"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-acid" />
          Креативная студия полного цикла
        </motion.div>

        <RevealText
          lines={['Продюсируем.', 'Продвигаем.', 'Создаём с AI.']}
          as="h1"
          className="font-display text-[clamp(2.1rem,8vw,6rem)] leading-[1.02] font-semibold text-balance"
        />

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.55 }}
          className="mt-7 max-w-xl text-balance text-lg text-paper-dim sm:text-xl"
        >
          ST96 — студия полного цикла: продюсирование, коммерческий промоушн, продакшн и разработка
          программных решений на базе AI. Идея, упаковка и технология — в одних руках.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="mt-9 flex flex-wrap items-center gap-4"
        >
          <MagneticButton
            as="a"
            href="#lead"
            className="inline-flex items-center gap-2 rounded-full bg-acid px-7 py-4 font-display text-sm font-semibold text-ink"
          >
            Начать проект
            <ArrowUpRight className="h-4 w-4" />
          </MagneticButton>
          <a
            href="#services"
            data-cursor-hover
            className="inline-flex items-center gap-2 rounded-full border border-ink-line px-7 py-4 text-sm font-semibold transition-colors hover:border-paper-dim"
          >
            Что мы делаем
          </a>
        </motion.div>
      </div>

      <div className="relative mt-16 border-y border-ink-line py-4">
        <Marquee
          items={services
            .flatMap((s) => s.keywords)
            .map((k) => (
              <span key={k} className="font-display text-sm font-medium text-paper-dim sm:text-base">
                {k} <span className="mx-8 text-acid">✦</span>
              </span>
            ))}
        />
      </div>
    </section>
  )
}

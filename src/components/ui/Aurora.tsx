import { motion } from 'framer-motion'
import type { Accent } from '../../data/services'

export default function Aurora({ accent }: { accent: Accent }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <motion.div
        className="absolute -top-32 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full opacity-40 blur-[110px] sm:h-[700px] sm:w-[700px]"
        style={{ background: `radial-gradient(circle, ${accent.from}, transparent 70%)` }}
        animate={{ x: [0, 40, -20, 0], y: [0, -20, 20, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute top-1/3 right-0 h-[380px] w-[380px] translate-x-1/3 rounded-full opacity-30 blur-[100px]"
        style={{ background: `radial-gradient(circle, ${accent.to}, transparent 70%)` }}
        animate={{ x: [0, -30, 20, 0], y: [0, 30, -10, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            'linear-gradient(to right, #f5f4ef 1px, transparent 1px), linear-gradient(to bottom, #f5f4ef 1px, transparent 1px)',
          backgroundSize: '64px 64px',
        }}
      />
    </div>
  )
}

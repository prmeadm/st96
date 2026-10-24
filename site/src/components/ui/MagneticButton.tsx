import { useRef, type ReactNode } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'
import clsx from 'clsx'

const tags = {
  button: motion.create('button'),
  a: motion.create('a'),
}

type Props = {
  children: ReactNode
  className?: string
  as?: keyof typeof tags
  strength?: number
  [key: string]: unknown
}

export default function MagneticButton({
  children,
  className,
  as = 'button',
  strength = 24,
  ...rest
}: Props) {
  const ref = useRef<HTMLElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const sx = useSpring(x, { stiffness: 200, damping: 15, mass: 0.4 })
  const sy = useSpring(y, { stiffness: 200, damping: 15, mass: 0.4 })

  const handleMove = (e: React.MouseEvent) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const relX = e.clientX - rect.left - rect.width / 2
    const relY = e.clientY - rect.top - rect.height / 2
    x.set((relX / rect.width) * strength)
    y.set((relY / rect.height) * strength)
  }

  const handleLeave = () => {
    x.set(0)
    y.set(0)
  }

  const MotionTag = tags[as]

  return (
    <MotionTag
      ref={ref as React.Ref<HTMLButtonElement & HTMLAnchorElement>}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{ x: sx, y: sy }}
      data-cursor-hover
      className={clsx(className)}
      {...rest}
    >
      {children}
    </MotionTag>
  )
}

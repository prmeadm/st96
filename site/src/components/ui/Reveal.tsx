import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import clsx from 'clsx'

type Props = {
  children: ReactNode
  className?: string
  delay?: number
  y?: number
  once?: boolean
}

export default function Reveal({ children, className, delay = 0, y = 28, once = true }: Props) {
  return (
    <motion.div
      className={clsx(className)}
      initial="hidden"
      whileInView="show"
      viewport={{ once, margin: '-80px' }}
      variants={{
        hidden: { opacity: 0, y },
        show: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] },
        },
      }}
    >
      {children}
    </motion.div>
  )
}

export function StaggerGroup({
  children,
  className,
  stagger = 0.08,
}: {
  children: ReactNode
  className?: string
  stagger?: number
}) {
  return (
    <motion.div
      className={clsx(className)}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-80px' }}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: stagger } },
      }}
    >
      {children}
    </motion.div>
  )
}

export function StaggerItem({
  children,
  className,
  y = 24,
}: {
  children: ReactNode
  className?: string
  y?: number
}) {
  return (
    <motion.div
      className={clsx(className)}
      variants={{
        hidden: { opacity: 0, y },
        show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
      }}
    >
      {children}
    </motion.div>
  )
}

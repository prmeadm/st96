import { motion } from 'framer-motion'
import clsx from 'clsx'

type Props = {
  lines: string[]
  className?: string
  as?: 'h1' | 'h2' | 'h3'
  delay?: number
}

export default function RevealText({ lines, className, as = 'h1', delay = 0 }: Props) {
  const Tag = as
  return (
    <Tag className={clsx('overflow-hidden', className)}>
      {lines.map((line, i) => (
        <span key={i} className="block overflow-hidden py-[0.08em]">
          <motion.span
            className="block"
            initial={{ y: '110%', opacity: 0 }}
            animate={{ y: '0%', opacity: 1 }}
            transition={{
              duration: 0.9,
              delay: delay + i * 0.1,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            {line}
          </motion.span>
        </span>
      ))}
    </Tag>
  )
}

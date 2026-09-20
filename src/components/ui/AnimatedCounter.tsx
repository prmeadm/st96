import { useEffect, useRef } from 'react'
import { useInView, useMotionValue, useSpring } from 'framer-motion'

type Props = {
  value: string
  suffix?: string
  className?: string
}

export default function AnimatedCounter({ value, suffix = '', className }: Props) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  const numeric = parseFloat(value)
  const isDecimal = value.includes('.')
  const motionVal = useMotionValue(0)
  const spring = useSpring(motionVal, { stiffness: 60, damping: 18 })

  useEffect(() => {
    if (inView) motionVal.set(numeric)
  }, [inView, numeric, motionVal])

  useEffect(() => {
    const unsub = spring.on('change', (v) => {
      if (!ref.current) return
      ref.current.textContent = `${isDecimal ? v.toFixed(1) : Math.round(v)}${suffix}`
    })
    return unsub
  }, [spring, suffix, isDecimal])

  return (
    <span className={className} ref={ref}>
      0{suffix}
    </span>
  )
}

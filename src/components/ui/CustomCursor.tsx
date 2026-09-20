import { useEffect, useRef, useState } from 'react'

export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)
  const [enabled] = useState(() => window.matchMedia('(pointer: fine)').matches)
  const [hovering, setHovering] = useState(false)
  const [hidden, setHidden] = useState(true)

  useEffect(() => {
    if (!enabled) return

    let ringX = 0
    let ringY = 0
    let dotX = 0
    let dotY = 0
    let targetX = 0
    let targetY = 0
    let raf = 0

    const onMove = (e: MouseEvent) => {
      targetX = e.clientX
      targetY = e.clientY
      setHidden(false)
      const el = document.elementFromPoint(e.clientX, e.clientY)
      const interactive = el?.closest('a, button, [data-cursor-hover]')
      setHovering(Boolean(interactive))
    }

    const onLeave = () => setHidden(true)

    const loop = () => {
      dotX += (targetX - dotX) * 0.9
      dotY += (targetY - dotY) * 0.9
      ringX += (targetX - ringX) * 0.18
      ringY += (targetY - ringY) * 0.18
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${dotX}px, ${dotY}px, 0) translate(-50%, -50%)`
      }
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%)`
      }
      raf = requestAnimationFrame(loop)
    }

    window.addEventListener('mousemove', onMove)
    document.documentElement.addEventListener('mouseleave', onLeave)
    raf = requestAnimationFrame(loop)

    return () => {
      window.removeEventListener('mousemove', onMove)
      document.documentElement.removeEventListener('mouseleave', onLeave)
      cancelAnimationFrame(raf)
    }
  }, [enabled])

  if (!enabled) return null

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[70] hidden md:block"
      style={{ opacity: hidden ? 0 : 1, transition: 'opacity 0.2s' }}
      aria-hidden="true"
    >
      <div
        ref={dotRef}
        className="fixed top-0 left-0 h-1.5 w-1.5 rounded-full bg-acid"
      />
      <div
        ref={ringRef}
        className="fixed top-0 left-0 rounded-full border border-paper/40 transition-[width,height,border-color] duration-200 ease-out"
        style={{
          width: hovering ? 56 : 32,
          height: hovering ? 56 : 32,
          borderColor: hovering ? 'var(--color-acid)' : 'rgba(245,244,239,0.35)',
        }}
      />
    </div>
  )
}

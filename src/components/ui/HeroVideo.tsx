import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Maximize2, X } from 'lucide-react'
import type { Accent } from '../../data/services'

type Props = {
  src: string
  poster: string
  accent: Accent
}

export default function HeroVideo({ src, poster, accent }: Props) {
  const inlineRef = useRef<HTMLVideoElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const startAt = useRef(0)
  const [open, setOpen] = useState(false)

  const openModal = () => {
    const v = inlineRef.current
    startAt.current = v?.currentTime ?? 0
    v?.pause()
    setOpen(true)
  }

  const closeModal = () => {
    setOpen(false)
    inlineRef.current?.play().catch(() => {})
  }

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        inlineRef.current?.play().catch(() => {})
      }
    }
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    closeRef.current?.focus()
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="relative mx-auto w-full">
      <div
        className="pointer-events-none absolute -inset-6 rounded-[2rem] opacity-60 blur-3xl"
        style={{ background: `linear-gradient(135deg, ${accent.from}33, ${accent.to}33)` }}
        aria-hidden="true"
      />
      <div
        className="group relative overflow-hidden rounded-2xl border border-ink-line bg-ink-soft"
        style={{ boxShadow: `0 0 60px ${accent.soft}` }}
      >
        <video
          ref={inlineRef}
          className="block aspect-video w-full object-cover"
          src={src}
          poster={poster}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden="true"
        />
        <button
          type="button"
          onClick={openModal}
          data-cursor-hover
          aria-label="Увеличить видео"
          className="absolute right-3 bottom-3 inline-flex items-center gap-2 rounded-full border border-paper/20 bg-ink/70 px-3.5 py-2 text-xs font-semibold text-paper backdrop-blur-md transition-colors hover:border-paper/50 hover:bg-ink/90"
        >
          <Maximize2 className="h-3.5 w-3.5" />
          Увеличить
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Видео"
            className="fixed inset-0 z-[65] grid place-items-center bg-ink/90 p-4 backdrop-blur-md sm:p-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={closeModal}
          >
            <motion.div
              className="relative w-full max-w-[min(1280px,calc((100svh-4rem)*16/9))] overflow-hidden rounded-2xl border border-ink-line bg-ink-soft"
              style={{ boxShadow: `0 0 120px ${accent.soft}` }}
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              <video
                className="block aspect-video w-full"
                src={src}
                poster={poster}
                autoPlay
                loop
                playsInline
                controls
                controlsList="nodownload"
                onLoadedMetadata={(e) => {
                  e.currentTarget.currentTime = startAt.current
                }}
              />
            </motion.div>
            <button
              ref={closeRef}
              type="button"
              onClick={closeModal}
              data-cursor-hover
              aria-label="Закрыть"
              className="absolute top-4 right-4 grid h-11 w-11 place-items-center rounded-full border border-ink-line bg-ink-soft text-paper transition-colors hover:border-paper-dim sm:top-6 sm:right-6"
            >
              <X className="h-5 w-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

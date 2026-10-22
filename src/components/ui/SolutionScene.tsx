import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Maximize2, Play, X } from 'lucide-react'
import { solutionScenes } from '../../data/solutionScenes'
import type { Motif } from '../../data/solutionScenes'
import type { Lang } from '../../lib/i18n'
import { reachGoal } from '../../lib/analytics'

const ACID = '#d8ff3f'
const INK = '#09090b'
const BEAT_MS = 2800
const MOTION_KEY = 'st96-allow-motion'
const EASE_OUT = [0.16, 1, 0.3, 1] as const
const EASE_SNAP = [0.7, 0, 0.84, 0] as const

const COPY = {
  ru: { labels: ['Что это', 'Где применимо', 'Выгода'], play: 'Запустить анимацию', expand: 'Увеличить', close: 'Закрыть' },
  en: { labels: ['What it is', 'Where it fits', 'Benefit'], play: 'Play animation', expand: 'Expand', close: 'Close' },
} as const

// Camera: odd beats dive in, even beats pull back — both enter and exit follow the same direction.
const enter = (b: number) => ({ opacity: 0, scale: b % 2 === 0 ? 0.72 : 1.38 })
const exit = (b: number) => ({ opacity: 0, scale: b % 2 === 0 ? 1.45 : 0.7 })

const MOTIF_SCALE = [1, 1.5, 0.86]
const MOTIF_ROTATE = [0, 7, -5]
// accent dot travels between beats (offsets from centre, in cqw)
const ACCENT_POS = [
  { x: -21, y: -13 },
  { x: 22, y: 11 },
  { x: 0, y: -19 },
]

function readAllow() {
  try {
    return localStorage.getItem(MOTION_KEY) === '1'
  } catch {
    return false
  }
}

function wordSize(word: string) {
  const n = word.length
  if (n <= 7) return '13.5cqw'
  if (n <= 10) return '10.6cqw'
  if (n <= 13) return '8.4cqw'
  return '7cqw'
}

function MotifArt({ kind }: { kind: Motif }) {
  const p = { fill: 'none', stroke: INK, strokeWidth: 1.6, vectorEffect: 'non-scaling-stroke' as const, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const }
  switch (kind) {
    case 'bubble':
      return (
        <>
          <rect x="22" y="12" width="56" height="30" rx="9" {...p} />
          <path d="M34 42 L30 52 L44 42" {...p} />
          <rect x="54" y="30" width="32" height="18" rx="6" {...p} />
        </>
      )
    case 'squares':
      return (
        <>
          {[[36, 16], [52, 16], [36, 32], [52, 32]].map(([x, y]) => (
            <rect key={`${x}${y}`} x={x} y={y} width="14" height="14" rx="2.5" {...p} />
          ))}
        </>
      )
    case 'steps':
      return (
        <>
          <path d="M22 31 H78" {...p} />
          {[22, 50, 78].map((x) => (
            <circle key={x} cx={x} cy="31" r="6" {...p} />
          ))}
        </>
      )
    case 'frame':
      return (
        <>
          <rect x="18" y="10" width="64" height="42" rx="4" {...p} />
          <path d="M18 20 H82" {...p} />
          <rect x="24" y="27" width="22" height="18" rx="2" {...p} />
        </>
      )
    case 'cards':
      return (
        <>
          <rect x="22" y="14" width="20" height="32" rx="3" transform="rotate(-9 32 30)" {...p} />
          <rect x="40" y="12" width="20" height="34" rx="3" {...p} />
          <rect x="58" y="14" width="20" height="32" rx="3" transform="rotate(9 68 30)" {...p} />
        </>
      )
    case 'phone':
      return (
        <>
          <rect x="38" y="5" width="24" height="52" rx="5" {...p} />
          <path d="M46 10 H54" {...p} />
        </>
      )
    case 'layers':
      return (
        <>
          {[12, 24, 36].map((y) => (
            <rect key={y} x="27" y={y} width="46" height="14" rx="4" {...p} />
          ))}
        </>
      )
    case 'bars':
      return (
        <>
          {[12, 20, 28, 36, 44].map((h, i) => (
            <rect key={h} x={24 + i * 11.5} y={54 - h} width="8" height={h} rx="2" {...p} />
          ))}
        </>
      )
    case 'shield':
      return <path d="M50 7 L76 16 V31 C76 43 64 51 50 57 C36 51 24 43 24 31 V16 Z" {...p} />
  }
}

export default function SolutionScene({ slug, lang, className = '' }: { slug: string; lang: Lang; className?: string }) {
  const cfg = solutionScenes[slug]
  const copy = COPY[lang]
  const beats = cfg[lang]
  const rm = useReducedMotion()
  const [allow, setAllow] = useState(readAllow)
  const still = Boolean(rm) && !allow
  const root = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(false)
  const [beat, setBeat] = useState(0)

  useEffect(() => {
    const el = root.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setActive(e.isIntersecting), { threshold: 0.25 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (!active || still) return
    const t = setInterval(() => setBeat((b) => (b + 1) % 3), BEAT_MS)
    return () => clearInterval(t)
  }, [active, still])

  const b = beats[beat]
  const benefit = beat === 2

  return (
    <div className={className}>
      <div
        ref={root}
        role="img"
        aria-label={`${beats[0].word} — ${beats[0].cap}`}
        className="relative aspect-[16/10] w-full overflow-hidden border"
        style={{ containerType: 'inline-size', background: '#c084fc', borderColor: 'rgba(9,9,11,0.22)', borderRadius: '1.6cqw' }}
      >
        {/* quiet ground: soft light + depth */}
        <div className="pointer-events-none absolute" style={{ left: '-25%', top: '-45%', width: '80%', height: '110%', background: 'radial-gradient(circle, rgba(255,255,255,0.42), transparent 65%)' }} />
        <div className="pointer-events-none absolute" style={{ right: '-30%', bottom: '-55%', width: '90%', height: '120%', background: 'radial-gradient(circle, rgba(88,28,135,0.34), transparent 65%)' }} />

        {/* motif: one faint geometric shape that zooms with the beats */}
        <motion.div
          className="pointer-events-none absolute inset-0"
          animate={{ scale: MOTIF_SCALE[beat], rotate: MOTIF_ROTATE[beat] }}
          transition={{ duration: 1.1, ease: EASE_OUT }}
          style={{ opacity: 0.3 }}
        >
          <svg viewBox="0 0 100 62.5" className="h-full w-full" aria-hidden="true">
            <MotifArt kind={cfg.motif} />
          </svg>
        </motion.div>
        <motion.span
          className="pointer-events-none absolute rounded-full"
          style={{ left: '50%', top: '47%', width: '3.4cqw', height: '3.4cqw', marginLeft: '-1.7cqw', marginTop: '-1.7cqw', background: ACID, boxShadow: `0 0 0 0.5cqw ${INK}` }}
          animate={{ x: `${ACCENT_POS[beat].x}cqw`, y: `${ACCENT_POS[beat].y}cqw` }}
          transition={{ duration: 1.1, ease: EASE_OUT }}
        />

        {/* step label + progress */}
        <div className="absolute flex items-center rounded-full" style={{ left: '3cqw', top: '3cqw', padding: '0.9cqw 2.2cqw', background: INK }}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={beat}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              style={{ fontFamily: 'Unbounded, sans-serif', fontWeight: 700, fontSize: '2.1cqw', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#f5f4ef' }}
            >
              {copy.labels[beat]}
            </motion.span>
          </AnimatePresence>
        </div>
        <div className="absolute flex items-center" style={{ right: '3cqw', top: '4.4cqw', gap: '1cqw' }}>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="block rounded-full"
              style={{ width: i === beat ? '4.2cqw' : '1.4cqw', height: '1.4cqw', background: i === beat ? INK : 'rgba(9,9,11,0.3)', transition: 'width 0.4s cubic-bezier(0.16,1,0.3,1), background-color 0.3s' }}
            />
          ))}
        </div>

        {/* the typographic beat */}
        <div className="absolute inset-x-0 flex flex-col items-center text-center" style={{ top: '27%', padding: '0 6cqw' }}>
          <AnimatePresence mode="wait" custom={beat} initial={false}>
            <motion.div
              key={beat}
              custom={beat}
              variants={{
                in: (c: number) => enter(c),
                show: { opacity: 1, scale: 1, transition: { duration: 0.7, ease: EASE_OUT } },
                out: (c: number) => ({ ...exit(c), transition: { duration: 0.34, ease: EASE_SNAP } }),
              }}
              initial="in"
              animate="show"
              exit="out"
              className="flex flex-col items-center"
              style={{ willChange: 'transform, opacity' }}
            >
              <span
                className="block"
                style={{
                  fontFamily: 'Unbounded, sans-serif',
                  fontWeight: 900,
                  fontSize: wordSize(b.word),
                  lineHeight: 1.04,
                  letterSpacing: '-0.03em',
                  color: benefit ? ACID : INK,
                  background: benefit ? INK : 'transparent',
                  padding: benefit ? '0.5cqw 2.6cqw 1cqw' : '0',
                  borderRadius: '2cqw',
                }}
              >
                {b.word}
              </span>
              <span className="block" style={{ marginTop: '3cqw', maxWidth: '72%', fontSize: '3cqw', fontWeight: 700, lineHeight: 1.3, color: INK }}>
                {b.cap}
              </span>
            </motion.div>
          </AnimatePresence>
        </div>

        {still && (
          <button
            type="button"
            onClick={() => {
              try {
                localStorage.setItem(MOTION_KEY, '1')
              } catch {
                /* storage unavailable */
              }
              setAllow(true)
            }}
            data-cursor-hover
            className="absolute z-30 inline-flex items-center rounded-full font-semibold"
            style={{ left: '3cqw', bottom: '3cqw', gap: '1.2cqw', padding: '1.3cqw 2.6cqw', fontSize: '2.5cqw', whiteSpace: 'nowrap', background: ACID, color: INK, boxShadow: '0 0.8cqw 2.4cqw rgba(9,9,11,0.35)' }}
          >
            <Play style={{ width: '2.4cqw', height: '2.4cqw' }} fill={INK} />
            {copy.play}
          </button>
        )}
      </div>
    </div>
  )
}

/** Card media: the scene + an "expand" button that opens it large. */
export function SolutionSceneCard({ slug, lang }: { slug: string; lang: Lang }) {
  const [open, setOpen] = useState(false)
  const copy = COPY[lang]

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="relative">
      <SolutionScene slug={slug} lang={lang} />
      <button
        type="button"
        onClick={() => {
          reachGoal('video_expand', { video: `${slug}-live` })
          setOpen(true)
        }}
        data-cursor-hover
        aria-label={copy.expand}
        className="absolute right-3 bottom-3 inline-flex items-center gap-2 rounded-full border border-paper/20 bg-ink/70 px-3.5 py-2 text-xs font-semibold text-paper backdrop-blur-md transition-colors hover:border-paper/50 hover:bg-ink/90"
      >
        <Maximize2 className="h-3.5 w-3.5" />
        {copy.expand}
      </button>
      {createPortal(
        <AnimatePresence>
          {open && (
            <motion.div
              role="dialog"
              aria-modal="true"
              className="fixed inset-0 z-[65] grid place-items-center bg-ink/90 p-4 backdrop-blur-md sm:p-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            >
              <motion.div
                className="w-full max-w-[min(1180px,calc((100svh-4rem)*1.6))]"
                initial={{ opacity: 0, scale: 0.94, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.35, ease: EASE_OUT }}
                onClick={(e) => e.stopPropagation()}
              >
                <SolutionScene slug={slug} lang={lang} />
              </motion.div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                data-cursor-hover
                aria-label={copy.close}
                className="absolute top-4 right-4 grid h-11 w-11 place-items-center rounded-full border border-ink-line bg-ink-soft text-paper transition-colors hover:border-paper-dim sm:top-6 sm:right-6"
              >
                <X className="h-5 w-5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </div>
  )
}

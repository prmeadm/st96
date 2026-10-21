import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from 'framer-motion'
import { Check, Database, FileText, Mail, MessageCircle, Maximize2, Package, Phone, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { Lang } from '../../lib/i18n'
import { reachGoal } from '../../lib/analytics'

type Src = 'chat' | 'call' | 'form'
type Dst = 'crm' | 'stock' | 'mail'

const ROW_Y = [29, 50, 71] // % of scene height
const SRC_ORDER: Src[] = ['chat', 'call', 'form']
const DST_ORDER: Dst[] = ['crm', 'stock', 'mail']
const SRC_ICON: Record<Src, LucideIcon> = { chat: MessageCircle, call: Phone, form: FileText }
const DST_ICON: Record<Dst, LucideIcon> = { crm: Database, stock: Package, mail: Mail }

const COPY = {
  ru: {
    live: 'AI-агент онлайн · 24/7',
    processed: 'Обработано сегодня',
    status: ['Принимаю запрос', 'Понимаю контекст', 'Выполняю действие'],
    src: { chat: 'Чат', call: 'Звонок', form: 'Заявка' },
    dst: { crm: 'CRM', stock: 'Склад', mail: 'Письмо' },
    events: [
      { src: 'chat', dst: 'crm', packet: 'Хочу заказать', log: 'Лид создан в CRM' },
      { src: 'call', dst: 'stock', packet: 'Есть в наличии?', log: 'Остаток проверен на складе' },
      { src: 'form', dst: 'mail', packet: 'Заявка №1042', log: 'Клиенту отправлено письмо' },
      { src: 'chat', dst: 'stock', packet: 'Когда доставка?', log: 'Срок поставки подтверждён' },
      { src: 'form', dst: 'crm', packet: 'Нужна смета', log: 'Сделка заведена и назначена' },
      { src: 'call', dst: 'mail', packet: 'Пришлите КП', log: 'КП собрано и отправлено' },
    ],
    seconds: 'за секунды',
    expand: 'Увеличить',
    close: 'Закрыть',
    aria: 'Анимация: AI-агент принимает запросы и выполняет задачи в CRM, на складе и в почте',
  },
  en: {
    live: 'AI agent online · 24/7',
    processed: 'Handled today',
    status: ['Receiving request', 'Understanding context', 'Taking action'],
    src: { chat: 'Chat', call: 'Call', form: 'Request' },
    dst: { crm: 'CRM', stock: 'Stock', mail: 'Email' },
    events: [
      { src: 'chat', dst: 'crm', packet: 'I want to order', log: 'Lead created in CRM' },
      { src: 'call', dst: 'stock', packet: 'Is it in stock?', log: 'Stock level checked' },
      { src: 'form', dst: 'mail', packet: 'Request #1042', log: 'Email sent to the client' },
      { src: 'chat', dst: 'stock', packet: 'When is delivery?', log: 'Delivery date confirmed' },
      { src: 'form', dst: 'crm', packet: 'Need an estimate', log: 'Deal created and assigned' },
      { src: 'call', dst: 'mail', packet: 'Send the offer', log: 'Offer prepared and sent' },
    ],
    seconds: 'in seconds',
    expand: 'Expand',
    close: 'Close',
    aria: 'Animation: an AI agent receives requests and performs tasks in CRM, stock and email',
  },
} as const

const ACID = '#d8ff3f'
const CYCLE_MS = 2700

type Live = { id: number; ev: number }

/** Per-property timing: position eases along the path, opacity/scale fade in and out at the ends. */
const flight = (duration: number, delay: number) => ({
  left: { duration, delay, ease: 'easeInOut' as const, times: [0, 0.55, 1] },
  top: { duration, delay, ease: 'easeInOut' as const, times: [0, 0.55, 1] },
  opacity: { duration, delay, ease: 'linear' as const, times: [0, 0.15, 0.85, 1] },
  scale: { duration, delay, ease: 'easeOut' as const, times: [0, 0.2, 0.85, 1] },
})

function Node({
  Icon,
  label,
  x,
  y,
  hit,
  side,
}: {
  Icon: LucideIcon
  label: string
  x: number
  y: number
  hit?: boolean
  side: 'l' | 'r'
}) {
  return (
    <div
      className="absolute flex flex-col items-center"
      style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%,-50%)', gap: '0.6cqw' }}
    >
      <motion.div
        animate={hit ? { scale: [1, 1.18, 1], borderColor: [ACID, ACID, '#09090b'] } : {}}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="relative grid place-items-center border"
        style={{ width: '9.5cqw', height: '9.5cqw', borderRadius: '2.4cqw', borderColor: '#09090b', background: '#09090b', boxShadow: '0 0.8cqw 2cqw rgba(9,9,11,0.28)' }}
      >
        <Icon style={{ width: '4.6cqw', height: '4.6cqw', color: hit ? ACID : '#f5f4ef' }} strokeWidth={1.8} />
        <AnimatePresence>
          {hit && side === 'r' && (
            <motion.span
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute grid place-items-center rounded-full"
              style={{ right: '-1.4cqw', top: '-1.4cqw', width: '4cqw', height: '4cqw', background: ACID }}
            >
              <Check style={{ width: '2.6cqw', height: '2.6cqw', color: '#09090b' }} strokeWidth={3.4} />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>
      <span style={{ fontSize: '2.4cqw', fontWeight: 700, color: '#09090b', letterSpacing: '0.01em', lineHeight: 1.1 }}>{label}</span>
    </div>
  )
}

function Packet({ copy, ev, onDone }: { copy: (typeof COPY)['ru'] | (typeof COPY)['en']; ev: number; onDone: () => void }) {
  const e = copy.events[ev % copy.events.length]
  const si = SRC_ORDER.indexOf(e.src as Src)
  const di = DST_ORDER.indexOf(e.dst as Dst)
  const sx = 11
  const dx = 89
  return (
    <>
      {/* request flies into the agent */}
      <motion.div
        className="pointer-events-none absolute z-20 whitespace-nowrap rounded-full border font-semibold"
        style={{
          fontSize: '2.5cqw',
          padding: '0.9cqw 2cqw',
          background: '#09090b',
          borderColor: ACID,
          color: '#f5f4ef',
          boxShadow: '0 0.8cqw 2.4cqw rgba(9,9,11,0.4)',
          translateX: '-50%',
          translateY: '-50%',
        }}
        initial={{ left: `${sx + 5}%`, top: `${ROW_Y[si]}%`, opacity: 0, scale: 0.7 }}
        animate={{
          left: [`${sx + 5}%`, '34%', '50%'],
          top: [`${ROW_Y[si]}%`, `${(ROW_Y[si] + 50) / 2}%`, '50%'],
          opacity: [0, 1, 1, 0],
          scale: [0.7, 1, 1, 0.2],
        }}
        transition={flight(1.25, 0)}
      >
        {e.packet}
      </motion.div>
      {/* result leaves the agent */}
      <motion.div
        className="pointer-events-none absolute z-20 grid place-items-center rounded-full"
        style={{ width: '4.6cqw', height: '4.6cqw', background: ACID, translateX: '-50%', translateY: '-50%', boxShadow: '0 0.8cqw 2.4cqw rgba(9,9,11,0.4)' }}
        initial={{ left: '50%', top: '50%', opacity: 0, scale: 0.2 }}
        animate={{
          left: ['50%', '66%', `${dx - 7}%`],
          top: ['50%', `${(50 + ROW_Y[di]) / 2}%`, `${ROW_Y[di]}%`],
          opacity: [0, 1, 1, 0],
          scale: [0.2, 1, 1, 0.5],
        }}
        transition={flight(1.1, 1.3)}
        onAnimationComplete={onDone}
      >
        <Check style={{ width: '3cqw', height: '3cqw', color: '#09090b' }} strokeWidth={3.4} />
      </motion.div>
    </>
  )
}

export default function AgentScene({ lang, className = '' }: { lang: Lang; className?: string }) {
  const copy = COPY[lang]
  const reduced = useReducedMotion()
  const root = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(false)
  const [live, setLive] = useState<Live[]>([])
  const [count, setCount] = useState(1284)
  const [pulse, setPulse] = useState(0)
  const [statusIdx, setStatusIdx] = useState(0)
  const [hit, setHit] = useState<{ dst: Dst; key: number } | null>(null)
  const [log, setLog] = useState<{ key: number; text: string } | null>(null)
  const seq = useRef(0)

  // tilt + spotlight follow the pointer
  const mx = useMotionValue(0.5)
  const my = useMotionValue(0.5)
  const rx = useSpring(useTransform(my, [0, 1], [5, -5]), { stiffness: 120, damping: 16 })
  const ry = useSpring(useTransform(mx, [0, 1], [-6, 6]), { stiffness: 120, damping: 16 })
  const spot = useTransform([mx, my], ([x, y]) => `radial-gradient(34cqw circle at ${(x as number) * 100}% ${(y as number) * 100}%, rgba(255,255,255,0.34), transparent 70%)`)

  useEffect(() => {
    const el = root.current
    if (!el) return
    const io = new IntersectionObserver(([en]) => setActive(en.isIntersecting), { threshold: 0.25 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const fire = useCallback(() => {
    const id = ++seq.current
    const ev = (id - 1) % copy.events.length
    const e = copy.events[ev]
    setLive((l) => [...l.slice(-3), { id, ev }])
    setStatusIdx(0)
    setTimeout(() => setStatusIdx(1), 700)
    setTimeout(() => setPulse((p) => p + 1), 1250)
    setTimeout(() => setStatusIdx(2), 1300)
    setTimeout(() => {
      setHit({ dst: e.dst as Dst, key: id })
      setCount((c) => c + 1)
      setLog({ key: id, text: `${e.log} · ${copy.seconds}` })
    }, 2400)
  }, [copy])

  useEffect(() => {
    if (!active || reduced) return
    fire()
    const t = setInterval(fire, CYCLE_MS)
    return () => clearInterval(t)
  }, [active, reduced, fire])

  const onMove = (e: React.PointerEvent) => {
    const r = root.current?.getBoundingClientRect()
    if (!r) return
    mx.set((e.clientX - r.left) / r.width)
    my.set((e.clientY - r.top) / r.height)
  }
  const onLeave = () => {
    mx.set(0.5)
    my.set(0.5)
  }

  const lineD = (y: number, side: 'l' | 'r') => {
    const yy = (y / 100) * 62.5
    return side === 'l'
      ? `M 16.5 ${yy} C 30 ${yy} 33 31.25 40 31.25`
      : `M 83.5 ${yy} C 70 ${yy} 67 31.25 60 31.25`
  }

  return (
    <div className={`[perspective:1100px] ${className}`}>
      <motion.div
        ref={root}
        role="img"
        aria-label={copy.aria}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        style={{ rotateX: reduced ? 0 : rx, rotateY: reduced ? 0 : ry, containerType: 'inline-size', transformStyle: 'preserve-3d', background: '#c084fc', borderColor: 'rgba(9,9,11,0.22)' }}
        className="relative aspect-[16/10] w-full overflow-hidden rounded-[1.6cqw] border"
      >
        {/* ground: grid + corner glows + cursor spotlight */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: 'linear-gradient(to right,rgba(9,9,11,0.12) 1px,transparent 1px),linear-gradient(to bottom,rgba(9,9,11,0.12) 1px,transparent 1px)',
            backgroundSize: '8cqw 8cqw',
            WebkitMaskImage: 'radial-gradient(ellipse 80% 85% at 50% 50%,#000 20%,transparent 85%)',
            maskImage: 'radial-gradient(ellipse 80% 85% at 50% 50%,#000 20%,transparent 85%)',
          }}
        />
        <div className="pointer-events-none absolute" style={{ left: '-30%', bottom: '-55%', width: '80%', height: '110%', background: 'radial-gradient(circle, rgba(88,28,135,0.34), transparent 65%)' }} />
        <div className="pointer-events-none absolute" style={{ right: '-30%', top: '-55%', width: '90%', height: '120%', background: 'radial-gradient(circle, rgba(255,255,255,0.42), transparent 65%)' }} />
        <motion.div className="pointer-events-none absolute inset-0" style={{ background: spot }} />

        {/* connection lines */}
        <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 62.5" preserveAspectRatio="none" aria-hidden="true">
          {ROW_Y.map((y, i) => (
            <g key={i}>
              {(['l', 'r'] as const).map((side) => (
                <g key={side}>
                  <path d={lineD(y, side)} fill="none" stroke="rgba(9,9,11,0.3)" strokeWidth="1.4" vectorEffect="non-scaling-stroke" />
                  <motion.path
                    d={lineD(y, side)}
                    fill="none"
                    stroke="#09090b"
                    strokeOpacity={0.85}
                    strokeWidth="1.4"
                    strokeDasharray="2 9"
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                    animate={reduced || !active ? undefined : { strokeDashoffset: side === 'l' ? [0, -44] : [0, -44] }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: 'linear' }}
                  />
                </g>
              ))}
            </g>
          ))}
        </svg>

        {/* channels (left) and systems (right) */}
        {SRC_ORDER.map((s, i) => (
          <Node key={s} Icon={SRC_ICON[s]} label={copy.src[s]} x={11} y={ROW_Y[i]} side="l" />
        ))}
        {DST_ORDER.map((d, i) => (
          <Node key={d} Icon={DST_ICON[d]} label={copy.dst[d]} x={89} y={ROW_Y[i]} hit={hit?.dst === d} side="r" />
        ))}

        {/* the agent core */}
        <div className="absolute" style={{ left: '50%', top: '50%', transform: 'translate(-50%,-50%)', width: '30cqw', height: '30cqw' }}>
          {[0, 1].map((i) => (
            <motion.span
              key={i}
              className="absolute inset-0 rounded-full"
              style={{ border: '1.5px solid rgba(9,9,11,0.5)' }}
              animate={reduced || !active ? { opacity: 0 } : { scale: [0.7, 1.55], opacity: [0.5, 0] }}
              transition={{ duration: 2.8, repeat: Infinity, delay: i * 1.4, ease: 'easeOut' }}
            />
          ))}
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{ background: `conic-gradient(from 0deg, transparent 0%, #09090b 22%, transparent 46%, ${ACID} 62%, transparent 80%)`, WebkitMask: 'radial-gradient(circle, transparent 62%, #000 64%)', mask: 'radial-gradient(circle, transparent 62%, #000 64%)' }}
            animate={reduced || !active ? undefined : { rotate: 360 }}
            transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
          />
          <motion.div
            className="absolute inset-0"
            animate={reduced || !active ? undefined : { rotate: -360 }}
            transition={{ duration: 11, repeat: Infinity, ease: 'linear' }}
          >
            {[0, 120, 240].map((a) => (
              <span
                key={a}
                className="absolute rounded-full"
                style={{ left: '50%', top: '50%', width: '1.6cqw', height: '1.6cqw', background: a === 0 ? ACID : '#09090b', transform: `rotate(${a}deg) translateY(-17.5cqw) translate(-50%,-50%)`, boxShadow: a === 0 ? '0 0 0 0.4cqw #09090b' : 'none' }}
              />
            ))}
          </motion.div>
          <motion.div
            key={pulse}
            className="absolute grid place-items-center rounded-full border"
            style={{ inset: '16%', borderColor: ACID, background: '#09090b', boxShadow: `0 1.5cqw 4cqw rgba(9,9,11,0.4), inset 0 0 3cqw ${ACID}22` }}
            initial={{ scale: pulse ? 1.16 : 1 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 14 }}
          >
            <span style={{ fontFamily: 'Unbounded, sans-serif', fontWeight: 900, fontSize: '6.4cqw', color: ACID, letterSpacing: '-0.03em' }}>AI</span>
          </motion.div>
          <div className="absolute left-1/2 whitespace-nowrap" style={{ top: 'calc(100% + 1cqw)', transform: 'translateX(-50%)' }}>
            <AnimatePresence mode="wait">
              <motion.span
                key={statusIdx}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25 }}
                className="block"
                style={{ fontSize: '2.5cqw', fontWeight: 700, color: '#09090b' }}
              >
                {copy.status[statusIdx]}…
              </motion.span>
            </AnimatePresence>
          </div>
        </div>

        {/* flying packets */}
        {live.map((l) => (
          <Packet key={l.id} copy={copy} ev={l.ev} onDone={() => setLive((a) => a.filter((x) => x.id !== l.id))} />
        ))}

        {/* HUD */}
        <div className="absolute flex items-center rounded-full border border-ink-line bg-ink" style={{ left: '3cqw', top: '3cqw', gap: '1.2cqw', padding: '0.9cqw 2cqw' }}>
          <motion.span
            className="block rounded-full"
            style={{ width: '1.5cqw', height: '1.5cqw', background: ACID }}
            animate={reduced ? undefined : { opacity: [1, 0.25, 1] }}
            transition={{ duration: 1.4, repeat: Infinity }}
          />
          <span style={{ fontSize: '2.3cqw', fontWeight: 600, color: '#f5f4ef' }}>{copy.live}</span>
        </div>
        <div className="absolute flex items-center rounded-full border border-ink-line bg-ink" style={{ right: '3cqw', top: '3cqw', gap: '1.2cqw', padding: '0.9cqw 2cqw' }}>
          <span style={{ fontSize: '2.3cqw', color: '#a6a6ac' }}>{copy.processed}</span>
          <span className="relative block overflow-hidden text-right" style={{ height: '3.2cqw', minWidth: '6.6cqw' }}>
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={count}
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '-100%' }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="block"
                style={{ fontFamily: 'Unbounded, sans-serif', fontWeight: 700, fontSize: '2.5cqw', lineHeight: '3.2cqw', color: ACID }}
              >
                {count.toLocaleString(lang === 'ru' ? 'ru-RU' : 'en-US')}
              </motion.span>
            </AnimatePresence>
          </span>
        </div>
        <div className="absolute flex justify-start" style={{ bottom: '3cqw', left: '3cqw', width: '60%', height: '5.4cqw' }}>
          <AnimatePresence mode="wait">
            {log && (
              <motion.div
                key={log.key}
                initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
                className="flex items-center whitespace-nowrap rounded-full border"
                style={{ gap: '1.2cqw', padding: '0.9cqw 2.2cqw', fontSize: '2.4cqw', fontWeight: 600, color: '#f5f4ef', borderColor: `${ACID}66`, background: '#09090b' }}
              >
                <Check style={{ width: '2.6cqw', height: '2.6cqw', color: ACID }} strokeWidth={3.2} />
                {log.text}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}

/** Card media: the live scene + an "expand" button that opens it large. */
export function AgentSceneCard({ lang }: { lang: Lang }) {
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
      <AgentScene lang={lang} />
      <button
        type="button"
        onClick={() => {
          reachGoal('video_expand', { video: 'ai-agents-live' })
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
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                onClick={(e) => e.stopPropagation()}
              >
                <AgentScene lang={lang} />
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

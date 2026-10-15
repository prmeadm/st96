import type { Accent } from '../../data/services'

type Props = {
  src: string
  poster: string
  accent: Accent
}

export default function HeroVideo({ src, poster, accent }: Props) {
  return (
    <div className="relative mx-auto w-full">
      <div
        className="pointer-events-none absolute -inset-6 rounded-[2rem] opacity-60 blur-3xl"
        style={{ background: `linear-gradient(135deg, ${accent.from}33, ${accent.to}33)` }}
        aria-hidden="true"
      />
      <div
        className="relative overflow-hidden rounded-2xl border border-ink-line bg-ink-soft"
        style={{ boxShadow: `0 0 60px ${accent.soft}` }}
      >
        <video
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
      </div>
    </div>
  )
}

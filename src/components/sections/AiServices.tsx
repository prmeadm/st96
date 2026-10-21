import { ArrowUpRight } from 'lucide-react'
import { accents } from '../../data/services'
import { aiServiceItems, aiServicesIntro } from '../../data/aiServices'
import { useLang } from '../../lib/i18n'
import HeroVideo from '../ui/HeroVideo'
import MagneticButton from '../ui/MagneticButton'
import Reveal, { StaggerGroup, StaggerItem } from '../ui/Reveal'

export default function AiServices() {
  const lang = useLang()
  const t = aiServicesIntro[lang]
  const accent = accents.ai

  return (
    <section id="ai-solutions" className="relative border-t border-ink-line py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="mb-14 grid grid-cols-1 gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-end lg:gap-16">
          <div>
            <Reveal>
              <p className="mb-5 text-5xl leading-none sm:text-6xl" aria-hidden="true">
                {t.emoji}
              </p>
              <span className="mb-4 inline-flex items-center gap-2 font-display text-xs font-semibold tracking-[0.2em] text-paper-dim uppercase">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: accent.solid }} />
                {t.kicker}
              </span>
            </Reveal>
            <Reveal delay={0.05}>
              <h2 className="text-balance font-display text-3xl leading-[1.1] font-semibold sm:text-4xl md:text-5xl">
                {t.title}
              </h2>
            </Reveal>
          </div>
          <Reveal delay={0.1}>
            <p className="text-lg text-paper">{t.lead}</p>
            <p className="mt-4 text-paper-dim">{t.sub}</p>
          </Reveal>
        </div>

        <StaggerGroup className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {aiServiceItems.map((s, i) => (
            <StaggerItem key={s.slug}>
              <article>
                <HeroVideo
                  src={`/video/ai-services/${s.slug}-${lang}.mp4`}
                  poster={`/video/ai-services/${s.slug}-${lang}.jpg`}
                  accent={accent}
                  audio
                  glow={false}
                  label={s.slug}
                />
                <div className="mt-5 flex items-start gap-4">
                  <span className="font-display text-sm font-semibold" style={{ color: accent.solid }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <h3 className="font-display text-lg leading-snug font-semibold sm:text-xl">{s.title[lang]}</h3>
                    <p className="mt-2 text-sm text-paper-dim">{s.text[lang]}</p>
                  </div>
                </div>
              </article>
            </StaggerItem>
          ))}
        </StaggerGroup>

        <Reveal className="mt-16 flex justify-center">
          <MagneticButton
            as="a"
            href="#lead"
            className="inline-flex items-center gap-2 rounded-full px-8 py-4 font-display text-sm font-semibold text-ink"
            style={{ background: accent.solid }}
          >
            {t.cta}
            <ArrowUpRight className="h-4 w-4" />
          </MagneticButton>
        </Reveal>
      </div>
    </section>
  )
}

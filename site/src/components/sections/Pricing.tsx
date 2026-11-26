import { useEffect, useState } from 'react'
import { ArrowUpRight } from 'lucide-react'
import clsx from 'clsx'
import type { Service } from '../../../../crm/shared/data/services'
import SectionHeading from '../ui/SectionHeading'
import { StaggerGroup, StaggerItem } from '../ui/Reveal'
import MagneticButton from '../ui/MagneticButton'
import { ModelIcon } from '../ui/ModelIcon'
import { useLang } from '../../lib/i18n'

const copy = {
  ru: {
    kicker: 'Тарифы',
    monthly: 'Месячная',
    yearly: 'Годовая',
    save: '−20%',
    perMonth: '/мес',
    billedYearly: 'при оплате за год',
    popular: 'Популярный',
    cta: 'Подключить',
    models: 'AI-модели',
    currency: 'BYN',
    creditsPerMonth: 'кредитов / мес',
    creditsLabel: 'кредитов',
    enterpriseCta: 'Обсудить условия',
    topupCta: 'Докупить',
  },
  en: {
    kicker: 'Pricing',
    monthly: 'Monthly',
    yearly: 'Annual',
    save: '−20%',
    perMonth: '/mo',
    billedYearly: 'billed annually',
    popular: 'Most popular',
    cta: 'Get started',
    models: 'AI models',
    currency: 'BYN',
    creditsPerMonth: 'credits / month',
    creditsLabel: 'credits',
    enterpriseCta: 'Talk to us',
    topupCta: 'Top up',
  },
} as const

/** Код пакета в базе (packages.code) — единый ключ между админкой и сайтом. */
const dbCode = (key: string) => (key.startsWith('support-') ? key.slice('support-'.length) : key)

/** Блок пакетов: кредиты (из базы) + цена, переключатель месяц/год, «Интерпрайс» и докупка кредитов. */
export default function Pricing({ service }: { service: Service }) {
  const lang = useLang()
  const t = copy[lang]
  const block = service.pricing
  const accent = service.accent
  const [yearly, setYearly] = useState(false)
  const [credits, setCredits] = useState<Record<string, number | null>>({})
  useEffect(() => {
    fetch('/api/packages', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        const m: Record<string, number | null> = {}
        for (const p of ((d?.packages ?? []) as { code: string; credits: number | null }[])) m[p.code] = p.credits
        setCredits(m)
      })
      .catch(() => {})
  }, [])
  if (!block) return null

  const discount = (p: number) => Math.round(p * 0.8)
  const fmt = (n: number) => n.toLocaleString(lang === 'ru' ? 'ru-RU' : 'en-US')

  return (
    <section id="pricing" className="relative border-t border-ink-line py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="mb-10 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading kicker={t.kicker} title={block.title} accent={accent.solid} />
          <div className="flex flex-col items-start gap-3 lg:items-end">
            <div className="flex items-center gap-1 rounded-full border border-ink-line bg-ink-soft p-1" role="group" aria-label={t.kicker}>
              <button
                type="button"
                onClick={() => setYearly(false)}
                aria-pressed={!yearly}
                className="rounded-full px-4 py-2 text-sm font-medium transition-colors"
                style={!yearly ? { background: accent.btn, color: 'var(--color-on-solid)' } : { color: 'var(--color-paper-dim)' }}
              >
                {t.monthly}
              </button>
              <button
                type="button"
                onClick={() => setYearly(true)}
                aria-pressed={yearly}
                className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors"
                style={yearly ? { background: accent.btn, color: 'var(--color-on-solid)' } : { color: 'var(--color-paper-dim)' }}
              >
                {t.yearly}
                <span
                  className="rounded-full px-1.5 py-0.5 text-[11px] font-semibold"
                  style={yearly ? { background: 'rgba(0,0,0,0.18)', color: 'var(--color-on-solid)' } : { background: accent.soft, color: accent.solid }}
                >
                  {t.save}
                </span>
              </button>
            </div>
            <p className="max-w-sm text-paper-dim">{block.lead}</p>
          </div>
        </div>

        <StaggerGroup className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
          {block.plans.map((plan) => {
            const price = yearly ? discount(plan.price) : plan.price
            const featured = Boolean(plan.featured)
            const c = credits[dbCode(plan.key)]
            return (
              <StaggerItem key={plan.key} className={featured ? 'relative' : ''}>
                <article
                  className={clsx(
                    'relative flex h-full flex-col overflow-hidden rounded-2xl border bg-ink-soft p-7',
                    featured ? 'border-[var(--c)]' : 'border-ink-line',
                  )}
                  style={featured ? { ['--c' as string]: accent.solid } : undefined}
                >
                  {featured && (
                    <span
                      className="pointer-events-none absolute -top-20 -right-20 h-56 w-56 rounded-full opacity-20 blur-[80px]"
                      style={{ background: accent.solid }}
                    />
                  )}
                  <div className="relative">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-display text-xl font-semibold">{plan.name}</h3>
                      {featured && (
                        <span
                          className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                          style={{ background: accent.solid, color: 'var(--color-on-solid)' }}
                        >
                          {t.popular}
                        </span>
                      )}
                    </div>
                    <p className="mt-1.5 min-h-10 text-sm text-paper-dim">{plan.tagline}</p>

                    <div className="mt-5">
                      {c != null ? (
                        <>
                          <div className="flex items-baseline gap-1.5">
                            <span className="font-display text-4xl font-bold" style={{ color: featured ? accent.solid : undefined }}>
                              {fmt(c)}
                            </span>
                            <span className="text-sm text-paper-dim">{t.creditsPerMonth}</span>
                          </div>
                          <div className="mt-2 flex items-baseline gap-2">
                            {yearly && <span className="text-sm text-paper-dim line-through">{plan.price} {t.currency}</span>}
                            <span className="text-lg font-semibold">{price} {t.currency}{t.perMonth}</span>
                          </div>
                        </>
                      ) : (
                        <div className="flex items-baseline gap-1.5">
                          {yearly && <span className="mr-1 text-sm text-paper-dim line-through">{plan.price} {t.currency}</span>}
                          <span className="font-display text-4xl font-bold" style={{ color: featured ? accent.solid : undefined }}>
                            {price}
                          </span>
                          <span className="text-sm text-paper-dim">{t.currency}{t.perMonth}</span>
                        </div>
                      )}
                      <span className="mt-1 block text-xs text-paper-dim">{yearly ? t.billedYearly : ' '}</span>
                    </div>
                  </div>

                  <ul className="relative mt-6 flex-1 space-y-3 border-t border-ink-line pt-5">
                    {plan.features.map((f) => {
                      const unlimited = f.value === '∞'
                      const excluded = f.value === '—'
                      return (
                        <li key={f.label} className="flex items-baseline justify-between gap-3">
                          <span className="text-sm text-paper-dim">{f.label}</span>
                          <span
                            className="shrink-0 font-semibold"
                            style={{ color: unlimited ? accent.solid : excluded ? 'var(--color-paper-dim)' : 'var(--color-paper)' }}
                          >
                            {f.value}
                          </span>
                        </li>
                      )
                    })}
                  </ul>

                  <div className="relative mt-6 border-t border-ink-line pt-5">
                    <span className="text-xs tracking-wide text-paper-dim uppercase">{t.models}</span>
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
                      {plan.models.map((m) => (
                        <ModelIcon key={m} id={m} />
                      ))}
                    </div>
                  </div>

                  <div className="relative mt-7">
                    <MagneticButton
                      as="a"
                      href="#lead"
                      className="inline-flex w-full items-center justify-center gap-2 rounded-full py-3.5 font-display text-sm font-semibold"
                      style={
                        featured
                          ? { background: accent.btn, color: 'var(--color-on-solid)' }
                          : { border: '1px solid var(--color-ink-line)', color: accent.solid }
                      }
                    >
                      {t.cta}
                      <ArrowUpRight className="h-4 w-4" />
                    </MagneticButton>
                  </div>
                </article>
              </StaggerItem>
            )
          })}
        </StaggerGroup>

        {block.enterprise && (
          <div className="mt-5 overflow-hidden rounded-2xl border border-ink-line bg-ink-soft p-8 sm:p-10">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <h3 className="font-display text-2xl font-semibold">{block.enterprise.title}</h3>
                <p className="mt-2 text-paper-dim">{block.enterprise.tagline}</p>
                <ul className="mt-5 grid grid-cols-1 gap-x-8 gap-y-2.5 sm:grid-cols-2">
                  {block.enterprise.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-paper-dim">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: accent.solid }} />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
              <MagneticButton
                as="a"
                href="#lead"
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full px-7 py-3.5 font-display text-sm font-semibold"
                style={{ background: accent.btn, color: 'var(--color-on-solid)' }}
              >
                {t.enterpriseCta}
                <ArrowUpRight className="h-4 w-4" />
              </MagneticButton>
            </div>
          </div>
        )}

        {block.topups && (
          <div className="mt-16">
            <h3 className="font-display text-2xl font-semibold sm:text-3xl">{block.topups.title}</h3>
            <p className="mt-2 max-w-xl text-paper-dim">{block.topups.lead}</p>
            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
              {block.topups.bundles.map((b) => (
                <div key={b.credits} className="flex flex-col rounded-2xl border border-ink-line bg-ink-soft p-6">
                  <span className="font-display text-3xl font-bold">{fmt(b.credits)}</span>
                  <span className="mt-1 text-sm text-paper-dim">{t.creditsLabel}</span>
                  <div className="mt-4 flex items-baseline gap-1.5 border-t border-ink-line pt-4">
                    <span className="text-lg font-semibold">{b.price}</span>
                    <span className="text-sm text-paper-dim">{t.currency}</span>
                  </div>
                  <MagneticButton
                    as="a"
                    href="#lead"
                    className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full py-3 font-display text-sm font-semibold"
                    style={{ border: '1px solid var(--color-ink-line)', color: accent.solid }}
                  >
                    {t.topupCta}
                    <ArrowUpRight className="h-4 w-4" />
                  </MagneticButton>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

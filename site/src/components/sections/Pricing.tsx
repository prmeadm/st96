import { useEffect, useState } from 'react'
import { ArrowUpRight, Check, Info } from 'lucide-react'
import clsx from 'clsx'
import type { Service } from '../../../../crm/shared/data/services'
import SectionHeading from '../ui/SectionHeading'
import { StaggerGroup, StaggerItem } from '../ui/Reveal'
import MagneticButton from '../ui/MagneticButton'
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
    currency: 'BYN',
    creditsPerMonth: 'кредитов / мес',
    creditsLabel: 'кредитов',
    perCredit: 'за кредит',
    topupHint: 'Кредиты докупаются разово и не сгорают',
    bestValue: 'Выгодно',
    topupCta: 'Докупить',
    enterpriseCta: 'Обсудить условия',
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
    currency: 'BYN',
    creditsPerMonth: 'credits / month',
    creditsLabel: 'credits',
    perCredit: 'per credit',
    topupHint: 'One-time packs, added to your balance right away',
    bestValue: 'Best value',
    topupCta: 'Purchase',
    enterpriseCta: 'Talk to us',
  },
} as const

/** Лаймовый бейдж — как в референсе: насыщенный лайм + чёрный текст. */
const lime = { background: 'var(--color-acid-solid)', color: 'var(--color-on-solid)' } as const

/** Код пакета в базе (packages.code) — единый ключ между админкой и сайтом. */
const dbCode = (key: string) => (key.startsWith('support-') ? key.slice('support-'.length) : key)

/** Визуал карточки тарифа: яркие градиенты из бренд-палитры (как у референса), у Базового — нейтральная. */
const PLAN_VISUALS: Record<string, { bg: string; glow: string }> = {
  'support-standard': { bg: 'linear-gradient(155deg,#1d4ed8 0%,#0b1226 100%)', glow: '#4d7bff' },
  'support-professional': { bg: 'linear-gradient(155deg,#7c3aed 0%,#db2777 100%)', glow: '#ff5fa8' },
  'support-ultimate': { bg: 'linear-gradient(155deg,#0891b2 0%,#155e75 100%)', glow: '#35e6c8' },
}

/** Блок пакетов: кредиты (из базы) + цена, переключатель месяц/год, докупка кредитов и «Интерпрайс». */
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
  const locale = lang === 'ru' ? 'ru-RU' : 'en-US'
  const fmt = (n: number) => n.toLocaleString(locale)
  const fmtRate = (n: number) => n.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  return (
    <section id="pricing" className="relative overflow-hidden border-t border-ink-line py-20 sm:py-28">
      <span
        className="pointer-events-none absolute -top-40 left-1/2 h-80 w-[46rem] -translate-x-1/2 rounded-full opacity-15 blur-[120px]"
        style={{ background: accent.solid }}
      />
      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
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
                <span className="rounded-full px-1.5 py-0.5 text-[11px] font-semibold" style={lime}>
                  {t.save}
                </span>
              </button>
            </div>
            <p className="max-w-sm text-paper-dim">{block.lead}</p>
          </div>
        </div>

        <StaggerGroup className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {block.plans.map((plan) => {
            const price = yearly ? discount(plan.price) : plan.price
            const featured = Boolean(plan.featured)
            const c = credits[dbCode(plan.key)]
            const vis = PLAN_VISUALS[plan.key]
            const vivid = Boolean(vis)
            const fg = vivid ? 'text-white' : 'text-paper'
            const fgDim = vivid ? 'text-white/65' : 'text-paper-dim'
            const fgSoft = vivid ? 'text-white/50' : 'text-paper-dim'
            const line = vivid ? 'border-white/15' : 'border-ink-line'
            return (
              <StaggerItem key={plan.key}>
                <article
                  className={clsx(
                    'relative flex h-full flex-col overflow-hidden rounded-3xl border p-6',
                    vivid ? 'border-white/10' : 'border-ink-line bg-ink-soft',
                  )}
                  style={vivid ? { background: vis.bg } : undefined}
                >
                  {vivid && (
                    <span
                      className="pointer-events-none absolute -top-24 -right-24 h-56 w-56 rounded-full opacity-30 blur-[70px]"
                      style={{ background: vis.glow }}
                    />
                  )}
                  <div className="relative">
                    <h3 className={clsx('font-display text-base font-bold leading-tight break-words', fg)}>{plan.name}</h3>
                    <p className={clsx('mt-2 min-h-10 text-sm', fgDim)}>{plan.tagline}</p>

                    <div className="mt-6 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                      {yearly && <span className={clsx('text-sm line-through', fgSoft)}>{plan.price} {t.currency}</span>}
                      <span className={clsx('font-display text-4xl font-bold tracking-tight', fg)}>{price}</span>
                      <span className={clsx('text-sm', fgDim)}>{t.currency}{t.perMonth}</span>
                      {featured && (
                        <span className="rounded-full px-2 py-0.5 text-[11px] font-bold" style={lime}>
                          {t.popular}
                        </span>
                      )}
                      {yearly && (
                        <span className="rounded-full px-2 py-0.5 text-[11px] font-bold" style={lime}>
                          {t.save}
                        </span>
                      )}
                    </div>
                    <span className={clsx('mt-1 block text-xs', fgSoft)}>{yearly ? t.billedYearly : '\u00A0'}</span>

                    {c != null && (
                      <div className="mt-4 flex items-center gap-2">
                        <span className="inline-block h-2 w-2 shrink-0 rounded-full" style={{ background: vivid ? vis.glow : accent.solid }} />
                        <span className={clsx('text-sm font-semibold', fg)}>
                          {fmt(c)} {t.creditsPerMonth}
                        </span>
                      </div>
                    )}
                  </div>

                  <ul className={clsx('relative mt-5 flex-1 space-y-2.5 border-t pt-5', line)}>
                    {plan.features.map((f) => (
                      <li key={f.label} className="flex items-start justify-between gap-3 text-sm">
                        <span className={fgDim}>{f.label}</span>
                        <span
                          className={clsx('shrink-0 font-semibold', f.value === '—' ? fgSoft : fg)}
                          style={f.value === '∞' ? { color: 'var(--color-acid-solid)' } : undefined}
                        >
                          {f.value}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <div className="relative mt-6">
                    <MagneticButton
                      as="a"
                      href="#lead"
                      className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white py-3.5 font-display text-sm font-semibold text-black"
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

        {block.topups && (
          <div className="mt-20 sm:mt-28">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h3 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">{block.topups.title}</h3>
                <p className="mt-3 max-w-xl text-paper-dim">{block.topups.lead}</p>
              </div>
              <p className="flex items-center gap-2 text-sm text-paper-dim">
                <Info className="h-4 w-4 shrink-0" />
                {t.topupHint}
              </p>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {block.topups.bundles.map((b, i) => {
                const best = i === block.topups!.bundles.length - 1
                return (
                  <div
                    key={b.credits}
                    className={clsx(
                      'relative flex flex-col overflow-hidden rounded-2xl border p-6',
                      best ? '' : 'border-ink-line bg-ink-soft',
                    )}
                    style={
                      best
                        ? {
                            borderColor: 'var(--color-acid)',
                            background: 'linear-gradient(160deg, rgba(216,255,63,0.12) 0%, rgba(216,255,63,0.02) 100%)',
                          }
                        : undefined
                    }
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-display text-2xl font-bold">{fmt(b.credits)} {t.creditsLabel}</span>
                      {best && (
                        <span className="rounded-full px-2 py-0.5 text-[11px] font-bold" style={lime}>
                          {t.bestValue}
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-paper-dim">
                      ≈ {fmtRate(b.price / b.credits)} {t.currency} {t.perCredit}
                    </p>
                    <div className="mt-auto flex items-end justify-between gap-3 pt-8">
                      <div>
                        <div className="font-display text-3xl font-bold">
                          {fmt(b.price)}
                          <span className="ml-1 text-sm font-normal text-paper-dim">{t.currency}</span>
                        </div>
                      </div>
                      <MagneticButton
                        as="a"
                        href="#lead"
                        className="shrink-0 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors"
                        style={{ background: 'var(--color-paper)', color: 'var(--color-ink)' }}
                      >
                        {t.topupCta}
                      </MagneticButton>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {block.enterprise && (
          <div className="mt-20 sm:mt-28">
            <div
              className="relative overflow-hidden rounded-3xl border border-white/10 p-8 sm:p-12"
              style={{ background: 'linear-gradient(150deg,#16162a 0%,#0b0b14 55%,#1a1030 100%)' }}
            >
              <span
                className="pointer-events-none absolute -top-24 right-0 h-72 w-72 rounded-full opacity-25 blur-[100px]"
                style={{ background: '#8b6bff' }}
              />
              <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
                <div className="max-w-2xl">
                  <h3 className="font-display text-3xl font-bold text-white sm:text-4xl">{block.enterprise.title}</h3>
                  <p className="mt-3 text-white/70">{block.enterprise.tagline}</p>
                  <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {block.enterprise.features.map((f) => (
                      <li key={f} className="flex items-center gap-2.5 text-sm text-white/80">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full" style={lime}>
                          <Check className="h-3 w-3" />
                        </span>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
                <MagneticButton
                  as="a"
                  href="#lead"
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-white px-8 py-4 font-display text-sm font-semibold text-black"
                >
                  {t.enterpriseCta}
                  <ArrowUpRight className="h-4 w-4" />
                </MagneticButton>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

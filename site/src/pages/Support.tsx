import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

type Pkg = { code: string; title: string; credits: number | null; price: number | null; currency: string }
type Lang = 'ru' | 'en'

const PKG_META: Record<string, { credits: number | null; price: number | null; currency: string }> = {
  basic: { credits: 1070, price: 320, currency: 'BYN' },
  standard: { credits: 2240, price: 560, currency: 'BYN' },
  professional: { credits: 3600, price: 720, currency: 'BYN' },
  ultimate: { credits: 6830, price: 1025, currency: 'BYN' },
}

const T = {
  ru: {
    kicker: 'Поддержка ST96',
    title: 'Пакет поддержки: задачи, правки и доработки в кредитах',
    intro:
      'Выберите пакет — он попадёт в корзину кабинета. Там выберете, платит физлицо или юрлицо, и оформите заявку. Кредиты списываются за задачи, отчёт по расходу — в кабинете.',
    packages: { basic: 'Базовый', standard: 'Стандартный', professional: 'Профессиональный', ultimate: 'Ультимейт' },
    creditsSuffix: 'кредитов',
    onRequest: 'По запросу',
    perMonth: 'за месяц',
    addToCart: 'Добавить в корзину',
    topupTitle: 'Докупить кредиты',
    topupNote: 'Докупленные кредиты не сгорают и списываются после кредитов пакета.',
    howTitle: 'Как это работает',
    howSteps: [
      'Добавьте пакет или кредиты в корзину.',
      'Войдите через Google и привяжите Telegram — без этого покупка недоступна.',
      'Выберите плательщика: физлицо или юрлицо, заполните реквизиты.',
      'Оформите заявку: счёт появится в кабинете, оплата — по счёту.',
    ],
  },
  en: {
    kicker: 'ST96 support',
    title: 'Support package: tasks, edits and improvements in credits',
    intro:
      'Pick a package — it will be added to your cabinet cart. There you choose whether an individual or a legal entity pays, and submit the request. Credits are deducted for tasks; the usage report is in your cabinet.',
    packages: { basic: 'Basic', standard: 'Standard', professional: 'Professional', ultimate: 'Ultimate' },
    creditsSuffix: 'credits',
    onRequest: 'On request',
    perMonth: 'per month',
    addToCart: 'Add to cart',
    topupTitle: 'Buy extra credits',
    topupNote: 'Extra credits never expire and are used after your package credits.',
    howTitle: 'How it works',
    howSteps: [
      'Add a package or credits to your cart.',
      'Sign in with Google and link Telegram — purchases are unavailable without it.',
      'Choose the payer: individual or legal entity, and fill in the details.',
      'Submit the request: the invoice will appear in your cabinet, payment is by invoice.',
    ],
  },
}

const TOPUP_CREDITS = [500, 1000, 2500]
const fmtMoney = (n: number, locale: string) => new Intl.NumberFormat(locale).format(n) + ' BYN'
const fmtNum = (n: number, locale: string) => new Intl.NumberFormat(locale).format(n)

export default function Support({ lang = 'ru' }: { lang?: Lang }) {
  const t = T[lang]
  const locale = lang === 'en' ? 'en-GB' : 'ru-RU'
  const money = (n: number) => fmtMoney(n, locale)
  const num = (n: number) => fmtNum(n, locale)
  const cabinetPath = lang === 'en' ? '/en/cabinet' : '/cabinet'
  const FALLBACK: Pkg[] = Object.keys(PKG_META).map((code) => ({
    code,
    title: t.packages[code as keyof typeof t.packages],
    credits: PKG_META[code].credits,
    price: PKG_META[code].price,
    currency: PKG_META[code].currency,
  }))
  const [packages, setPackages] = useState<Pkg[]>(FALLBACK)
  const [topupRate, setTopupRate] = useState(0.3)

  useEffect(() => {
    fetch('/api/packages')
      .then((r) => r.json())
      .then((d: { packages?: Pkg[]; topup_rate?: number }) => {
        if (d.packages?.length) setPackages(d.packages.filter((p) => p.price != null))
        if (d.topup_rate && d.topup_rate > 0) setTopupRate(d.topup_rate)
      })
      .catch(() => undefined)
  }, [])

  const topups = TOPUP_CREDITS.map((credits) => ({ credits, price: Math.round(credits * topupRate * 100) / 100 }))

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-5 pt-32 pb-20 sm:px-8">
      <span className="mb-4 inline-flex items-center gap-2 font-display text-xs font-semibold tracking-[0.2em] text-paper-dim uppercase">
        <span className="h-1.5 w-1.5 rounded-full bg-acid" />
        {t.kicker}
      </span>
      <h1 className="max-w-3xl font-display text-3xl font-semibold sm:text-5xl">{t.title}</h1>
      <p className="mt-5 max-w-2xl text-paper-dim">{t.intro}</p>

      <section className="mt-12 grid gap-4 lg:grid-cols-4">
        {packages.map((p) => (
          <div key={p.code} className="flex flex-col rounded-3xl border border-ink-line bg-ink-soft p-6">
            <p className="font-display text-lg font-semibold">{t.packages[p.code as keyof typeof t.packages] || p.title}</p>
            <p className="mt-1 text-sm text-paper-dim">{p.credits ? num(p.credits) + ' ' + t.creditsSuffix : '—'}</p>
            <p className="mt-6 font-display text-3xl font-semibold text-acid">{p.price != null ? money(p.price) : t.onRequest}</p>
            <p className="mt-1 text-xs text-paper-dim">{t.perMonth}</p>
            <Link
              to={cabinetPath + '?add=package:' + p.code}
              className="mt-6 inline-flex justify-center rounded-full bg-acid px-5 py-2.5 font-display text-sm font-semibold text-ink transition hover:bg-acid/90"
            >
              {t.addToCart}
            </Link>
          </div>
        ))}
      </section>

      <section className="mt-14">
        <h2 className="font-display text-2xl font-semibold">{t.topupTitle}</h2>
        <p className="mt-2 text-sm text-paper-dim">{t.topupNote}</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {topups.map((topup) => (
            <div key={topup.credits} className="rounded-2xl border border-ink-line bg-ink-soft p-5">
              <p className="font-display text-xl font-semibold">{num(topup.credits)} {t.creditsSuffix}</p>
              <p className="mt-1 text-sm text-paper-dim">{money(topup.price)}</p>
              <Link
                to={cabinetPath + '?add=topup:' + topup.credits}
                className="mt-4 inline-flex rounded-full border border-ink-line px-4 py-2 text-sm text-paper transition hover:border-acid/60"
              >
                {t.addToCart}
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-14 rounded-3xl border border-ink-line bg-ink-soft p-6 text-sm text-paper-dim">
        <p className="font-display text-base font-semibold text-paper">{t.howTitle}</p>
        <ol className="mt-3 list-decimal space-y-2 pl-5">
          {t.howSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </section>
    </main>
  )
}

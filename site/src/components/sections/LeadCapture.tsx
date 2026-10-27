import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowUpRight, Check, Mail, Phone, Send, ShieldCheck, Timer } from 'lucide-react'
import type { Service } from '../../../../shared/data/services'
import { services as servicesRu } from '../../../../shared/data/services'
import { getServices } from '../../data/content'
import { localePath, useLang, useUi } from '../../lib/i18n'
import { CONTACTS } from '../layout/Footer'
import { trackLead } from '../../lib/analytics'
import { isInternal } from '../../lib/internal'
import { readAdIdentifiers, readAttribution } from '../../lib/attribution'
import { POLICY_PATH, POLICY_VERSION } from '../../../../shared/data/privacy'
import Reveal from '../ui/Reveal'
import { PhoneField } from '../../../../shared/ui/PhoneField'
import MagneticButton from '../ui/MagneticButton'

type Props = {
  service?: Service
  title?: string
  text?: string
}

const trustIcons = [Timer, ShieldCheck]

type TgUser = {
  id: number
  first_name: string
  last_name?: string
  username?: string
  photo_url?: string
  auth_date: number
  hash: string
}

export default function LeadCapture({ service, title, text }: Props) {
  const lang = useLang()
  const l = useUi().lead
  const services = getServices(lang)
  const trust = l.trust.map((text, i) => ({ icon: trustIcons[i], text }))
  const [name, setName] = useState('')
  const [contact, setContact] = useState('')
  const [byEmail, setByEmail] = useState(false) // по умолчанию телефон с маской страны; можно указать email
  const [interest, setInterest] = useState(service?.slug ?? '')
  const [message, setMessage] = useState('')
  const [consent, setConsent] = useState(true)
  const [status, setStatus] = useState<'idle' | 'sent'>('idle')
  const [tgRef, setTgRef] = useState<string | null>(null)
  const [redirectIn, setRedirectIn] = useState<number | null>(null) // секунды до автоперехода к боту; null = не переходить
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [tg, setTg] = useState<TgUser | null>(null)
  const [tgStarted, setTgStarted] = useState(false)
  const [tgWanted, setTgWanted] = useState(false) // виджет грузим лениво: форма на экране или первый фокус
  const [tgFailed, setTgFailed] = useState(false)
  const formRef = useRef<HTMLDivElement>(null)
  const tgBoxRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = formRef.current
    if (!el || tgWanted) return
    if (!('IntersectionObserver' in window)) { setTgWanted(true); return }
    const io = new IntersectionObserver((entries) => {
      if (entries.some((en) => en.isIntersecting)) { setTgWanted(true); io.disconnect() }
    }, { rootMargin: '200px' })
    io.observe(el)
    return () => io.disconnect()
  }, [tgWanted])

  useEffect(() => {
    const box = tgBoxRef.current
    if (!tgWanted || tg || status !== 'idle' || !box) return
    const w = window as unknown as Record<string, unknown>
    w.st96TgAuth = (u: TgUser) => setTg(u)
    const s = document.createElement('script')
    s.async = true
    s.src = 'https://telegram.org/js/telegram-widget.js?22'
    s.setAttribute('data-telegram-login', CONTACTS.botName)
    s.setAttribute('data-size', 'large')
    s.setAttribute('data-request-access', 'write')
    s.setAttribute('data-onauth', 'st96TgAuth(user)')
    s.onerror = () => setTgFailed(true)
    let timer: ReturnType<typeof setTimeout> | undefined
    s.onload = () => {
      timer = setTimeout(() => {
        if (!box.querySelector('iframe')) setTgFailed(true)
      }, 5000)
    }
    box.appendChild(s)
    return () => {
      if (timer) clearTimeout(timer)
      delete w.st96TgAuth
      box.innerHTML = ''
    }
  }, [tgWanted, tg, status])

  const botUrl = tgStarted
    ? `https://t.me/${CONTACTS.botName}`
    : `https://t.me/${CONTACTS.botName}?start=${tgRef ? `site_${tgRef}` : 'site'}`
  // После отправки заявки через 3 секунды открываем бота, чтобы клиент сразу запустил диалог и подтвердил связь
  useEffect(() => {
    if (status !== 'sent' || redirectIn === null) return
    if (redirectIn <= 0) {
      window.location.assign(botUrl)
      return
    }
    const timer = setTimeout(() => setRedirectIn((n) => (n === null ? n : n - 1)), 1000)
    return () => clearTimeout(timer)
  }, [status, redirectIn, botUrl])

  const accentSolid = service?.accent.solid ?? 'var(--color-acid)'

  // other sections (e.g. "Order" on a solution card) can prefill the message
  useEffect(() => {
    const onPrefill = (e: Event) => {
      const m = (e as CustomEvent<{ message?: string }>).detail?.message
      if (m) setMessage(m)
    }
    window.addEventListener('st96:lead-prefill', onPrefill)
    return () => window.removeEventListener('st96:lead-prefill', onPrefill)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !contact.trim()) {
      setError(l.errFill)
      return
    }
    if (!consent) {
      setError(l.errConsent)
      return
    }
    setError('')
    setSubmitting(true)

    const eventId = crypto.randomUUID()
    const serviceLabel = servicesRu.find((s) => s.slug === interest)?.navLabel ?? ''

    try {
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          contact,
          interest: serviceLabel,
          message,
          consent: true,
          lang,
          policyVersion: POLICY_VERSION,
          attribution: readAttribution(),
          eventId,
          ads: readAdIdentifiers(),
          pageUrl: location.href,
          internal: isInternal(),
          ...(tg ? { tg } : {}),
        }),
      })
      if (!res.ok) throw new Error('request failed')
      const ok = (await res.json().catch(() => null)) as { ref?: string | null; tgStarted?: boolean } | null
      const started = ok?.tgStarted === true
      setTgStarted(started)
      setTgRef(typeof ok?.ref === 'string' && /^[A-Za-z0-9_-]{43}$/.test(ok.ref) ? ok.ref : null)
      trackLead(eventId, lang)
      setStatus('sent')
      setRedirectIn(started ? null : 3)
    } catch {
      setError(l.errSend)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section id="lead" className="relative border-t border-ink-line py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid grid-cols-1 gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-10">
          <Reveal className="min-w-0">
            <span
              className="mb-4 inline-flex items-center gap-2 font-display text-xs font-semibold tracking-[0.2em] text-paper-dim uppercase"
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: accentSolid }} />
              {l.kicker}
            </span>
            <h2 className="text-balance font-display text-[clamp(1.4rem,7vw,1.875rem)] leading-[1.1] font-semibold sm:text-4xl md:text-5xl lg:text-[clamp(1.5rem,3vw,2.45rem)]">
              {title ?? service?.ctaTitle ?? l.defaultTitle}
            </h2>
            <p className="mt-5 max-w-md text-lg text-paper-dim">
              {text ?? service?.ctaText ?? l.defaultText}
            </p>

            <ul className="mt-8 space-y-3">
              {trust.map((t) => (
                <li key={t.text} className="flex items-center gap-3 text-sm text-paper-dim">
                  <t.icon className="h-4 w-4 shrink-0" style={{ color: accentSolid }} />
                  {t.text}
                </li>
              ))}
            </ul>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <a
                href={`tel:${CONTACTS.phoneHref}`}
                data-cursor-hover
                className="inline-flex items-center gap-2 rounded-full border border-ink-line px-5 py-3 text-sm font-medium transition-colors hover:border-paper-dim"
              >
                <Phone className="h-4 w-4" />
                {CONTACTS.phone}
              </a>
              <a
                href={CONTACTS.telegramHref}
                target="_blank"
                rel="noreferrer"
                data-cursor-hover
                className="inline-flex items-center gap-2 rounded-full border border-ink-line px-5 py-3 text-sm font-medium transition-colors hover:border-paper-dim"
              >
                <Send className="h-4 w-4" />
                {CONTACTS.telegram}
              </a>
            </div>
          </Reveal>

          <Reveal delay={0.1} className="min-w-0">
            <div ref={formRef} onFocusCapture={() => setTgWanted(true)} className="relative overflow-hidden rounded-2xl border border-ink-line bg-ink-soft p-6 sm:p-10">
              <div
                className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full opacity-20 blur-[90px]"
                style={{ background: accentSolid }}
              />
              <AnimatePresence mode="wait">
                {status === 'idle' ? (
                  <motion.form
                    key="form"
                    onSubmit={handleSubmit}
                    exit={{ opacity: 0, y: -12 }}
                    className="relative flex flex-col gap-5"
                  >
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                      <label className="flex flex-col gap-2">
                        <span className="text-xs font-medium text-paper-dim">{l.name}</span>
                        <input
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          type="text"
                          placeholder={l.namePh}
                          className="ym-disable-keys rounded-xl border border-ink-line bg-ink px-4 py-3.5 text-paper outline-none transition-colors focus:border-paper-dim"
                        />
                      </label>
                      <div className="flex flex-col gap-2">
                        <span className="flex items-center justify-between gap-3 text-xs font-medium text-paper-dim">
                          <span>{l.contact}</span>
                          <button type="button" className="underline underline-offset-2 hover:text-paper" onClick={() => { setByEmail(!byEmail); setContact('') }}>
                            {byEmail ? l.contactToPhone : l.contactToEmail}
                          </button>
                        </span>
                        {byEmail ? (
                          <input
                            value={contact}
                            onChange={(e) => setContact(e.target.value)}
                            type="email"
                            autoComplete="email"
                            placeholder={l.contactEmailPh}
                            className="ym-disable-keys rounded-xl border border-ink-line bg-ink px-4 py-3.5 text-paper outline-none transition-colors focus:border-paper-dim"
                          />
                        ) : (
                          <PhoneField
                            lang={lang}
                            value={contact}
                            onChange={setContact}
                            selectClassName="rounded-xl border border-ink-line bg-ink text-paper"
                            inputClassName="ym-disable-keys rounded-xl border border-ink-line bg-ink px-4 py-3.5 text-paper outline-none transition-colors focus:border-paper-dim"
                          />
                        )}
                      </div>
                    </div>

                    <label className="flex flex-col gap-2">
                      <span className="text-xs font-medium text-paper-dim">{l.interest}</span>
                      <select
                        value={interest}
                        onChange={(e) => setInterest(e.target.value)}
                        className="ym-disable-keys rounded-xl border border-ink-line bg-ink px-4 py-3.5 text-paper outline-none transition-colors focus:border-paper-dim"
                      >
                        <option value="">{l.interestNone}</option>
                        {services.map((s) => (
                          <option key={s.slug} value={s.slug}>
                            {s.navLabel}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="flex flex-col gap-2">
                      <span className="text-xs font-medium text-paper-dim">{l.message}</span>
                      <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows={3}
                        placeholder={l.messagePh}
                        className="ym-disable-keys resize-none rounded-xl border border-ink-line bg-ink px-4 py-3.5 text-paper outline-none transition-colors focus:border-paper-dim"
                      />
                    </label>

                    <label className="flex cursor-pointer items-start gap-3" data-cursor-hover>
                      <input
                        type="checkbox"
                        checked={consent}
                        onChange={(e) => {
                          setConsent(e.target.checked)
                          if (e.target.checked) setError('')
                        }}
                        className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer"
                        style={{ accentColor: accentSolid }}
                        aria-required="true"
                      />
                      <span className="text-xs leading-relaxed text-paper-dim">
                        {l.consentPre}{' '}
                        <Link
                          to={localePath(lang, POLICY_PATH)}
                          target="_blank"
                          rel="noreferrer"
                          className="underline underline-offset-2 transition-colors hover:text-paper"
                          style={{ color: accentSolid }}
                        >
                          {l.consentLink}
                        </Link>
                        .
                      </span>
                    </label>

                    {!tgFailed && (
                      <div className="flex flex-col gap-2">
                        {tg ? (
                          <p className="text-sm text-paper-dim" role="status" aria-live="polite">
                            {l.tgAs} {tg.first_name}{tg.username ? ` (@${tg.username})` : ''}{' '}
                            <button type="button" onClick={() => setTg(null)} className="underline underline-offset-2 hover:text-paper">
                              {l.tgRemove}
                            </button>
                          </p>
                        ) : (
                          <>
                            <div ref={tgBoxRef} className="min-h-[40px]" />
                            <p className="text-xs text-paper-dim">{l.tgLoginHint}</p>
                          </>
                        )}
                      </div>
                    )}

                    {error && <p className="text-sm text-pink">{error}</p>}

                    <MagneticButton
                      as="button"
                      type="submit"
                      disabled={submitting}
                      className="mt-2 inline-flex items-center justify-center gap-2 rounded-full py-4 font-display text-sm font-semibold text-ink disabled:opacity-60"
                      style={{ background: accentSolid }}
                    >
                      {submitting ? l.sending : l.send}
                      <ArrowUpRight className="h-4 w-4" />
                    </MagneticButton>
                  </motion.form>
                ) : (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative flex min-h-[360px] flex-col items-center justify-center gap-4 py-10 text-center"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 260, damping: 16 }}
                      className="grid h-16 w-16 place-items-center rounded-full"
                      style={{ background: accentSolid }}
                    >
                      <Check className="h-8 w-8 text-ink" />
                    </motion.div>
                    <h3 className="font-display text-2xl font-semibold">{l.sentTitle}</h3>
                    <p className="max-w-xs text-paper-dim">
                      {l.sentText}
                    </p>
                    <p className="max-w-xs text-sm text-paper-dim" role="status" aria-live="polite">{tgStarted ? l.tgStarted : l.tgHint}</p>
                    <a
                      href={botUrl}
                      target="_blank"
                      rel="noreferrer"
                      data-cursor-hover
                      className="inline-flex items-center gap-2 rounded-full bg-acid px-6 py-3.5 text-sm font-semibold text-ink transition-transform hover:scale-[1.03]"
                    >
                      <Send className="h-4 w-4" />
                      {tgStarted ? l.openChat : l.openTg}
                    </a>
                    {redirectIn !== null && (
                      <p className="text-sm text-paper-dim" role="status" aria-live="polite">
                        {l.redirecting} {Math.max(redirectIn, 1)} {l.sec}…{' '}
                        <button onClick={() => setRedirectIn(null)} className="underline underline-offset-4">
                          {l.stay}
                        </button>
                      </p>
                    )}
                    <button
                      onClick={() => { setRedirectIn(null); setTgStarted(false); setStatus('idle') }}
                      className="text-xs text-paper-dim underline underline-offset-4"
                    >
                      {l.again}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <p className="mt-4 flex items-center gap-2 text-xs text-paper-dim">
              <Mail className="h-3.5 w-3.5" />
              {l.orEmail} {CONTACTS.email}
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

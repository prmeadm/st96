import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { localePath, useLang, useUi } from '../../lib/i18n'
import { OPEN_EVENT, pushConsentEvent, readConsent, saveConsent } from '../../lib/consent'

function Toggle({ checked, disabled, onChange, label }: { checked: boolean; disabled?: boolean; onChange?: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? 'bg-acid' : 'bg-ink-line'} ${disabled ? 'opacity-60' : ''}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-ink transition-transform ${checked ? 'translate-x-5' : ''}`}
      />
    </button>
  )
}

export default function CookieBanner() {
  const lang = useLang()
  const c = useUi().cookie
  const [open, setOpen] = useState(() => readConsent() === null)
  const [details, setDetails] = useState(false)
  const [analytics, setAnalytics] = useState(() => readConsent()?.analytics ?? true)

  useEffect(() => {
    pushConsentEvent(readConsent())
    const reopen = () => {
      setAnalytics(readConsent()?.analytics ?? true)
      setDetails(true)
      setOpen(true)
    }
    window.addEventListener(OPEN_EVENT, reopen)
    return () => window.removeEventListener(OPEN_EVENT, reopen)
  }, [])

  const choose = (value: boolean) => {
    saveConsent(value)
    setOpen(false)
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-label={c.aria}
          className="fixed inset-x-3 bottom-3 z-[64] mx-auto max-w-3xl rounded-2xl border border-ink-line bg-ink-soft/95 p-5 shadow-2xl backdrop-blur-md sm:bottom-5 sm:p-6"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="font-display text-base font-semibold">{c.title}</p>
          <p className="mt-2 text-sm leading-relaxed text-paper-dim">
            {c.text}{' '}
            <Link to={localePath(lang, '/privacy#cookies')} className="underline underline-offset-2 hover:text-paper">
              {c.more}
            </Link>
          </p>

          {details && (
            <div className="mt-4 space-y-3 border-t border-ink-line pt-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">{c.necessary}</p>
                  <p className="text-xs text-paper-dim">{c.necessaryText}</p>
                </div>
                <Toggle checked disabled label={c.necessaryLabel} />
              </div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">{c.analytics}</p>
                  <p className="text-xs text-paper-dim">{c.analyticsText}</p>
                </div>
                <Toggle checked={analytics} onChange={setAnalytics} label={c.analyticsLabel} />
              </div>
            </div>
          )}

          <div className="mt-5 flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={() => choose(true)}
              data-cursor-hover
              className="rounded-full bg-acid px-5 py-2.5 text-sm font-semibold text-ink"
            >
              {c.acceptAll}
            </button>
            {details ? (
              <button
                type="button"
                onClick={() => choose(analytics)}
                data-cursor-hover
                className="rounded-full border border-paper-dim/40 px-5 py-2.5 text-sm font-semibold hover:border-paper"
              >
                {c.save}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setDetails(true)}
                data-cursor-hover
                className="rounded-full border border-paper-dim/40 px-5 py-2.5 text-sm font-semibold hover:border-paper"
              >
                {c.customize}
              </button>
            )}
            <button
              type="button"
              onClick={() => choose(false)}
              data-cursor-hover
              className="rounded-full px-5 py-2.5 text-sm font-semibold text-paper-dim hover:text-paper"
            >
              {c.onlyNecessary}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

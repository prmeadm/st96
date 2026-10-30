import { Link, useLocation, useNavigate } from 'react-router-dom'
import { OPEN_EVENT } from '../../lib/consent'
import { ArrowUpRight, Mail, Phone, Send } from 'lucide-react'
import { getServices } from '../../data/content'
import { localePath, stripLang, useLang, useUi } from '../../lib/i18n'
import Reveal from '../ui/Reveal'
import ThemeToggle from '../ui/ThemeToggle'
import MagneticButton from '../ui/MagneticButton'

const CONTACTS = {
  email: 'hi@st96.by',
  phone: '+375 (29) 954-51-51',
  phoneHref: '+375299545151',
  telegram: '@studia96',
  telegramHref: 'https://t.me/studia96',
  botName: 'st96_leads_bot',
}

export default function Footer() {
  const location = useLocation()
  const navigate = useNavigate()
  const lang = useLang()
  const t = useUi()
  const isHome = stripLang(location.pathname) === '/'

  const goToLead = (e: React.MouseEvent) => {
    e.preventDefault()
    if (isHome) {
      document.getElementById('lead')?.scrollIntoView({ behavior: 'smooth' })
    } else {
      navigate(`${localePath(lang, '/')}#lead`)
    }
  }

  return (
    <footer className="relative border-t border-ink-line bg-ink-soft">
      <div className="mx-auto max-w-7xl px-5 pt-16 pb-8 sm:px-8 sm:pt-24">
        <Reveal>
          <div className="flex flex-col justify-between gap-8 border-b border-ink-line pb-14 lg:flex-row lg:items-end">
            <div>
              <span className="font-display text-4xl font-bold tracking-tight sm:text-6xl">
                ST<span className="text-acid">96</span>
              </span>
              <p className="mt-4 max-w-md text-paper-dim">{t.footerText}</p>
            </div>
            <MagneticButton
              as="a"
              href="#lead"
              onClick={goToLead}
              className="inline-flex w-fit items-center gap-2 rounded-full bg-acid-solid px-7 py-4 font-display text-sm font-semibold text-on-solid"
            >
              {t.startProject}
              <ArrowUpRight className="h-4 w-4" />
            </MagneticButton>
          </div>
        </Reveal>

        <div className="grid grid-cols-2 gap-10 py-14 sm:grid-cols-4">
          <Reveal delay={0.05}>
            <div>
              <p className="mb-4 text-xs font-semibold tracking-[0.2em] text-paper-dim uppercase">{t.nav}</p>
              <ul className="space-y-3">
                <li>
                  <Link to={localePath(lang, '/')} className="text-paper-dim transition-colors hover:text-paper" data-cursor-hover>
                    {t.home}
                  </Link>
                </li>
                <li>
                  <a
                    href="#lead"
                    onClick={goToLead}
                    className="text-paper-dim transition-colors hover:text-paper"
                    data-cursor-hover
                  >
                    {t.contacts}
                  </a>
                </li>
              </ul>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div>
              <p className="mb-4 text-xs font-semibold tracking-[0.2em] text-paper-dim uppercase">{t.servicesTitle}</p>
              <ul className="space-y-3">
                {getServices(lang).map((s) => (
                  <li key={s.slug}>
                    <Link
                      to={localePath(lang, `/${s.slug}`)}
                      className="text-paper-dim transition-colors hover:text-paper"
                      data-cursor-hover
                    >
                      {s.navLabel}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <Reveal delay={0.15} className="col-span-2 sm:col-span-2">
            <div>
              <p className="mb-4 text-xs font-semibold tracking-[0.2em] text-paper-dim uppercase">{t.contactsTitle}</p>
              <ul className="space-y-3">
                <li>
                  <a
                    href={`mailto:${CONTACTS.email}`}
                    className="inline-flex items-center gap-2 text-paper-dim transition-colors hover:text-paper"
                    data-cursor-hover
                  >
                    <Mail className="h-4 w-4 shrink-0" />
                    {CONTACTS.email}
                  </a>
                </li>
                <li>
                  <a
                    href={`tel:${CONTACTS.phoneHref}`}
                    className="inline-flex items-center gap-2 text-paper-dim transition-colors hover:text-paper"
                    data-cursor-hover
                  >
                    <Phone className="h-4 w-4 shrink-0" />
                    {CONTACTS.phone}
                  </a>
                </li>
                <li>
                  <a
                    href={CONTACTS.telegramHref}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-paper-dim transition-colors hover:text-paper"
                    data-cursor-hover
                  >
                    <Send className="h-4 w-4 shrink-0" />
                    {CONTACTS.telegram}
                  </a>
                </li>
              </ul>
            </div>
          </Reveal>
        </div>

        <div className="flex flex-col items-start justify-between gap-4 pt-8 text-sm text-paper-dim sm:flex-row sm:items-center">
          <div className="flex flex-col items-start gap-4">
            <p>© {new Date().getFullYear()} ST96. {t.rights}</p>
            <ThemeToggle />
          </div>
          <div className="flex flex-col gap-1 sm:items-end">
            <Link to={localePath(lang, '/privacy')} className="transition-colors hover:text-paper" data-cursor-hover>
              {t.privacyLink}
            </Link>
            <button
              type="button"
              onClick={() => window.dispatchEvent(new Event(OPEN_EVENT))}
              className="transition-colors hover:text-paper"
              data-cursor-hover
            >
              {t.cookieSettings}
            </button>
            <p>{t.operatorLine}</p>
          </div>
        </div>
      </div>
    </footer>
  )
}

export { CONTACTS }

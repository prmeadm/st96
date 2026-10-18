import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Menu, X, ArrowUpRight } from 'lucide-react'
import { getServices } from '../../data/content'
import { localePath, stripLang, useLang, useUi } from '../../lib/i18n'
import { trackLanguageSwitch } from '../../lib/analytics'
import MagneticButton from '../ui/MagneticButton'

export default function Header() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const lang = useLang()
  const t = useUi()
  const otherLang = lang === 'ru' ? 'en' : 'ru'
  const navItems = [
    { label: t.home, to: localePath(lang, '/') },
    ...getServices(lang).map((s) => ({ label: s.navLabel, to: localePath(lang, `/${s.slug}`) })),
  ]
  const isHome = stripLang(location.pathname) === '/'
  const switchTo = `${localePath(otherLang, stripLang(location.pathname))}${location.hash}`
  const onSwitch = () => {
    trackLanguageSwitch(lang, otherLang)
    setOpen(false)
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.documentElement.style.overflow = open ? 'hidden' : ''
    return () => {
      document.documentElement.style.overflow = ''
    }
  }, [open])

  const goToLead = (e: React.MouseEvent) => {
    e.preventDefault()
    setOpen(false)
    if (isHome) {
      document.getElementById('lead')?.scrollIntoView({ behavior: 'smooth' })
    } else {
      navigate(`${localePath(lang, '/')}#lead`)
    }
  }

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        scrolled || open ? 'bg-ink/85 backdrop-blur-md border-b border-ink-line' : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:h-20 sm:px-8">
        <Link
          to={localePath(lang, '/')}
          onClick={() => setOpen(false)}
          className="font-display text-xl font-bold tracking-tight"
          data-cursor-hover
        >
          ST<span className="text-acid">96</span>
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              data-cursor-hover
              className={`relative text-sm font-medium transition-colors hover:text-paper ${
                location.pathname === item.to ? 'text-paper' : 'text-paper-dim'
              }`}
            >
              {item.label}
              {location.pathname === item.to && (
                <motion.span
                  layoutId="nav-dot"
                  className="absolute -bottom-1.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-acid"
                />
              )}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            to={switchTo}
            onClick={onSwitch}
            hrefLang={otherLang}
            aria-label={t.switchTo}
            title={t.switchTo}
            data-cursor-hover
            className="inline-flex h-10 items-center gap-1 rounded-full border border-ink-line px-3 font-display text-xs font-semibold tracking-wider transition-colors hover:border-paper-dim"
          >
            <span className="text-paper">{t.langShort}</span>
            <span className="text-paper-dim">/</span>
            <span className="text-paper-dim">{t.langOtherShort}</span>
          </Link>
          <MagneticButton
            as="a"
            onClick={goToLead}
            className="hidden items-center gap-1.5 rounded-full bg-paper px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-acid sm:inline-flex"
          >
            {t.discuss}
            <ArrowUpRight className="h-4 w-4" />
          </MagneticButton>

          <button
            onClick={() => setOpen((v) => !v)}
            className="grid h-10 w-10 place-items-center rounded-full border border-ink-line lg:hidden"
            aria-label={t.menu}
            data-cursor-hover
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden border-t border-ink-line bg-ink lg:hidden"
          >
            <nav className="flex flex-col gap-1 px-5 py-6">
              {navItems.map((item, i) => (
                <motion.div
                  key={item.to}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.4 }}
                >
                  <Link
                    to={item.to}
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-between border-b border-ink-line/60 py-4 font-display text-2xl font-medium"
                  >
                    {item.label}
                    <ArrowUpRight className="h-5 w-5 text-paper-dim" />
                  </Link>
                </motion.div>
              ))}
              <motion.a
                href="#lead"
                onClick={goToLead}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: navItems.length * 0.05, duration: 0.4 }}
                className="mt-6 inline-flex items-center justify-center gap-1.5 rounded-full bg-acid px-6 py-3.5 text-center font-semibold text-ink"
              >
                {t.discuss}
                <ArrowUpRight className="h-4 w-4" />
              </motion.a>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}

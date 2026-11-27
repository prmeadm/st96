import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Menu, X, ArrowUpRight, UserRound } from 'lucide-react'
import { getServices } from '../../data/content'
import { localePath, stripLang, useLang, useUi } from '../../lib/i18n'
import { trackLanguageSwitch } from '../../lib/analytics'
import MagneticButton from '../ui/MagneticButton'

export default function Header() {
  const location = useLocation()
  const [scrolled, setScrolled] = useState(false)
  // Шторка привязана к маршруту: любая навигация (ссылка, «назад», смена языка)
  // закрывает её сама — без эффекта, синхронизирующего состояние.
  const locationKey = `${location.pathname}${location.hash}`
  const [menu, setMenu] = useState({ open: false, key: locationKey })
  const open = menu.open && menu.key === locationKey
  const setOpen = (next: boolean) => setMenu({ open: next, key: locationKey })
  const navigate = useNavigate()
  const lang = useLang()
  const t = useUi()
  const otherLang = lang === 'ru' ? 'en' : 'ru'
  const navItems = [
    { label: t.home, to: localePath(lang, '/') },
    ...getServices(lang).map((s) => ({ label: s.navLabel, to: localePath(lang, `/${s.slug}`) })),
  ]
  const cabinetPath = localePath(lang, '/cabinet')
  const isHome = stripLang(location.pathname) === '/'
  const switchTo = `${localePath(otherLang, stripLang(location.pathname))}${location.hash}`
  const navLabel = lang === 'ru' ? 'Основная навигация' : 'Main navigation'
  const isActive = (to: string) => stripLang(location.pathname) === stripLang(to)
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

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenu((m) => ({ ...m, open: false }))
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
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

  const leadHref = `${isHome ? '' : localePath(lang, '/')}#lead`

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        scrolled || open ? 'bg-ink/85 backdrop-blur-md border-b border-ink-line' : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-5 sm:h-20 sm:px-8">
        <Link
          to={localePath(lang, '/')}
          onClick={() => setOpen(false)}
          className="-mx-2 -my-2 shrink-0 rounded-full px-2 py-2 font-display text-xl font-bold tracking-tight focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acid"
          data-cursor-hover
        >
          ST<span className="text-acid">96</span>
        </Link>

        <nav aria-label={navLabel} className="hidden items-center gap-5 xl:flex">
          {navItems.map((item) => {
            const active = isActive(item.to)
            return (
              <Link
                key={item.to}
                to={item.to}
                data-cursor-hover
                aria-current={active ? 'page' : undefined}
                className={`relative whitespace-nowrap text-sm font-medium transition-colors hover:text-paper focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-acid ${
                  active ? 'text-paper' : 'text-paper-dim'
                }`}
              >
                {item.label}
                {active && (
                  <motion.span
                    layoutId="nav-dot"
                    aria-hidden="true"
                    className="absolute -bottom-1.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-acid"
                  />
                )}
              </Link>
            )
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-3">
          <Link
            to={switchTo}
            onClick={onSwitch}
            hrefLang={otherLang}
            aria-label={t.switchTo}
            title={t.switchTo}
            data-cursor-hover
            className="inline-flex h-10 items-center gap-1 whitespace-nowrap rounded-full border border-ink-line px-3 font-display text-xs font-semibold tracking-wider transition-colors hover:border-paper-dim focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acid"
          >
            <span className="text-acid">{t.langShort}</span>
            <span className="text-paper-dim">/</span>
            <span className="text-paper-dim">{t.langOtherShort}</span>
          </Link>
          <Link
            to={cabinetPath}
            aria-label={t.signIn}
            title={t.signIn}
            data-cursor-hover
            className="inline-flex h-10 items-center gap-2 whitespace-nowrap rounded-full border border-ink-line px-3 text-sm font-medium text-paper-dim transition-colors hover:border-acid/60 hover:text-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acid"
          >
            <UserRound className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">{t.signIn}</span>
          </Link>
          <MagneticButton
            as="a"
            href={leadHref}
            onClick={goToLead}
            className="hidden shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-paper px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-acid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acid sm:inline-flex"
          >
            {t.discuss}
            <ArrowUpRight className="h-4 w-4" />
          </MagneticButton>

          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="grid h-10 w-10 place-items-center rounded-full border border-ink-line focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acid xl:hidden"
            aria-label={t.menu}
            aria-expanded={open}
            aria-controls="mobile-nav"
            data-cursor-hover
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-nav"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="max-h-[calc(100dvh-4rem)] overflow-y-auto overscroll-contain border-t border-ink-line bg-ink sm:max-h-[calc(100dvh-5rem)] xl:hidden"
          >
            <nav aria-label={navLabel} className="flex flex-col gap-1 px-5 py-6">
              {navItems.map((item, i) => {
                const active = isActive(item.to)
                return (
                  <motion.div
                    key={item.to}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.4 }}
                  >
                    <Link
                      to={item.to}
                      onClick={() => setOpen(false)}
                      aria-current={active ? 'page' : undefined}
                      className={`flex items-center justify-between border-b border-ink-line/60 py-4 font-display text-2xl font-medium ${
                        active ? 'text-acid' : 'text-paper'
                      }`}
                    >
                      {item.label}
                      <ArrowUpRight className="h-5 w-5 text-paper-dim" />
                    </Link>
                  </motion.div>
                )
              })}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: navItems.length * 0.05, duration: 0.4 }}
                className="mt-6"
              >
                <Link
                  to={cabinetPath}
                  onClick={() => setOpen(false)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-ink-line px-6 py-3.5 text-center font-semibold text-paper transition-colors hover:border-acid/60"
                >
                  <UserRound className="h-4 w-4" aria-hidden="true" />
                  {t.signIn}
                </Link>
              </motion.div>
              <motion.a
                href={leadHref}
                onClick={goToLead}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (navItems.length + 1) * 0.05, duration: 0.4 }}
                className="mt-6 inline-flex items-center justify-center gap-1.5 rounded-full bg-acid-solid px-6 py-3.5 text-center font-semibold text-on-solid"
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

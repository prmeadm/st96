import { useEffect, useRef, useState } from 'react'
import { NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AuthGate, useAuth } from './auth'
import ClientsPage from './pages/ClientsPage'
import ClientPage from './pages/ClientPage'
import LeadsPage from './pages/LeadsPage'
import NotesPage from './pages/NotesPage'
import FunnelsPage from './pages/FunnelsPage'
import FunnelPage from './pages/FunnelPage'
import TemplatesPage from './pages/TemplatesPage'
import BroadcastsPage from './pages/BroadcastsPage'
import BroadcastPage from './pages/BroadcastPage'
import AgentPage from './pages/AgentPage'
import SettingsPage from './pages/SettingsPage'
import AnalyticsPage from './pages/AnalyticsPage'
import BookingPage from './pages/BookingPage'
import { Icon } from './ui/Icon'
import { QuickNav } from './ui/QuickNav'

const RAIL_KEY = 'st96-admin-rail'
const readMin = () => { try { return localStorage.getItem(RAIL_KEY) === 'min' } catch { return false } }

const SCRIPT_RE = /\/assets\/admin-[A-Za-z0-9_-]+\.js/

/** Страница админки открыта давно, а сайт уже обновлён: сравниваем файл скрипта в открытой странице и на сервере. */
function useNewVersion() {
  const [stale, setStale] = useState(false)
  useEffect(() => {
    const mine = document.querySelector<HTMLScriptElement>('script[src*="/assets/admin-"]')?.src.match(SCRIPT_RE)?.[0]
    if (!mine) return
    const check = async () => {
      try {
        const html = await (await fetch('/admin/', { cache: 'no-store' })).text()
        const now = html.match(SCRIPT_RE)?.[0]
        if (now && now !== mine) setStale(true)
      } catch { /* нет связи: проверим позже */ }
    }
    const t = window.setInterval(check, 5 * 60_000)
    const onVis = () => { if (document.visibilityState === 'visible') void check() }
    document.addEventListener('visibilitychange', onVis)
    void check()
    return () => { window.clearInterval(t); document.removeEventListener('visibilitychange', onVis) }
  }, [])
  return stale
}

function Shell() {
  const { signOut } = useAuth()
  const stale = useNewVersion()
  const [min, setMin] = useState(readMin)
  const toggle = () => {
    setMin(!min)
    try { localStorage.setItem(RAIL_KEY, min ? 'max' : 'min') } catch { /* память браузера недоступна: меню просто не запомнится */ }
  }
  // На телефоне нижняя навигация прокручивается: активный раздел всегда в поле зрения
  const nav = useRef<HTMLElement>(null)
  const { pathname } = useLocation()
  useEffect(() => {
    const r = nav.current
    const on = r?.querySelector<HTMLElement>('a.on')
    if (!r || !on || r.scrollWidth <= r.clientWidth) return
    r.scrollLeft = on.offsetLeft - (r.clientWidth - on.offsetWidth) / 2
  }, [pathname])
  const link = ({ isActive }: { isActive: boolean }) => (isActive ? 'on' : '')
  const item = (to: string, icon: Parameters<typeof Icon>[0]['name'], label: string) => (
    <NavLink to={to} className={link} title={min ? label : undefined} aria-label={label}><Icon name={icon} /><span>{label}</span></NavLink>
  )
  return (
    <div className="app">
      <nav ref={nav} className={`rail${min ? ' min' : ''}`} aria-label="Разделы">
        <div className="brand">
          {min ? <img className="mark" src="/favicon.svg" alt="ST96" width={36} height={36} /> : <span className="wm" role="img" aria-label="ST96">ST<span>96</span></span>}
          <button type="button" className="fold" onClick={toggle} aria-expanded={!min} aria-label={min ? 'Развернуть меню' : 'Свернуть меню'} title={min ? 'Развернуть меню' : 'Свернуть меню'}>
            <Icon name={min ? 'expand' : 'collapse'} size={18} />
          </button>
        </div>
        {item('/clients', 'clients', 'Клиенты')}
        {item('/leads', 'leads', 'Заявки')}
        {item('/funnels', 'funnels', 'Воронки')}
        {item('/broadcasts', 'send', 'Рассылки')}
        {item('/booking', 'calendar', 'Запись')}
        {item('/templates', 'templates', 'Шаблоны')}
        {item('/agent', 'agent', 'Агент')}
        {item('/analytics', 'chart', 'Аналитика')}
        {item('/notes', 'notes', 'Заметки')}
        <div className="rail-gap" />
        {item('/settings', 'settings', 'Настройки')}
        <button className="out" onClick={signOut} title={min ? 'Выйти' : undefined} aria-label="Выйти"><Icon name="logout" /><span>Выйти</span></button>
      </nav>
      <main className="main">
        {stale && (
          <div className="newver" role="status">
            <span>Вышла новая версия админки: часть новых возможностей на этой странице ещё не видна.</span>
            <button type="button" className="btn primary" onClick={() => window.location.reload()}>Обновить</button>
          </div>
        )}
        <header className="topbar"><span className="sp" /><QuickNav /></header>
        <div className="page">
          <Routes>
            <Route path="/" element={<Navigate to="/clients" replace />} />
            <Route path="/clients" element={<ClientsPage />} />
            <Route path="/clients/:id" element={<ClientPage />} />
            <Route path="/leads" element={<LeadsPage />} />
            <Route path="/funnels" element={<FunnelsPage />} />
            <Route path="/funnels/:id" element={<FunnelPage />} />
            <Route path="/broadcasts" element={<BroadcastsPage />} />
            <Route path="/broadcasts/:id" element={<BroadcastPage />} />
            <Route path="/booking" element={<BookingPage />} />
            <Route path="/templates" element={<TemplatesPage />} />
            <Route path="/agent" element={<AgentPage />} />
            <Route path="/agent/:id" element={<AgentPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/notes" element={<NotesPage />} />
            <Route path="*" element={<Navigate to="/clients" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  )
}

export default function AdminApp() {
  return (
    <AuthGate>
      <Shell />
    </AuthGate>
  )
}

import { useState } from 'react'
import { NavLink, Navigate, Route, Routes } from 'react-router-dom'
import { AuthGate, useAuth } from './auth'
import ClientsPage from './pages/ClientsPage'
import ClientPage from './pages/ClientPage'
import LeadsPage from './pages/LeadsPage'
import NotesPage from './pages/NotesPage'
import FunnelsPage from './pages/FunnelsPage'
import FunnelPage from './pages/FunnelPage'
import TemplatesPage from './pages/TemplatesPage'
import { Icon } from './ui/Icon'
import wordmark from './assets/st96-wordmark.png'

const RAIL_KEY = 'st96-admin-rail'
const readMin = () => { try { return localStorage.getItem(RAIL_KEY) === 'min' } catch { return false } }

function Shell() {
  const { signOut } = useAuth()
  const [min, setMin] = useState(readMin)
  const toggle = () => {
    setMin(!min)
    try { localStorage.setItem(RAIL_KEY, min ? 'max' : 'min') } catch { /* память браузера недоступна: меню просто не запомнится */ }
  }
  const link = ({ isActive }: { isActive: boolean }) => (isActive ? 'on' : '')
  const item = (to: string, icon: Parameters<typeof Icon>[0]['name'], label: string) => (
    <NavLink to={to} className={link} title={min ? label : undefined} aria-label={label}><Icon name={icon} /><span>{label}</span></NavLink>
  )
  return (
    <div className="app">
      <nav className={`rail${min ? ' min' : ''}`} aria-label="Разделы">
        <div className="brand">
          {min ? <img className="mark" src="/favicon.svg" alt="ST96" width={36} height={36} /> : <span className="wm"><img src={wordmark} alt="ST96" /></span>}
          <button type="button" className="fold" onClick={toggle} aria-expanded={!min} aria-label={min ? 'Развернуть меню' : 'Свернуть меню'} title={min ? 'Развернуть меню' : 'Свернуть меню'}>
            <Icon name={min ? 'expand' : 'collapse'} size={18} />
          </button>
        </div>
        {item('/clients', 'clients', 'Клиенты')}
        {item('/leads', 'leads', 'Заявки')}
        {item('/funnels', 'funnels', 'Воронки')}
        {item('/templates', 'templates', 'Шаблоны')}
        {item('/notes', 'notes', 'Заметки')}
        <button className="out" onClick={signOut} title={min ? 'Выйти' : undefined} aria-label="Выйти"><Icon name="logout" /><span>Выйти</span></button>
      </nav>
      <main className="main">
        <div className="page">
          <Routes>
            <Route path="/" element={<Navigate to="/clients" replace />} />
            <Route path="/clients" element={<ClientsPage />} />
            <Route path="/clients/:id" element={<ClientPage />} />
            <Route path="/leads" element={<LeadsPage />} />
            <Route path="/funnels" element={<FunnelsPage />} />
            <Route path="/funnels/:id" element={<FunnelPage />} />
            <Route path="/templates" element={<TemplatesPage />} />
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

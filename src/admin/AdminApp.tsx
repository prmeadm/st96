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

function Shell() {
  const { email, signOut } = useAuth()
  const link = ({ isActive }: { isActive: boolean }) => (isActive ? 'on' : '')
  return (
    <div className="app">
      <nav className="rail" aria-label="Разделы">
        <div className="brand"><span className="logo" aria-hidden="true">ST</span>96 · админка</div>
        <NavLink to="/clients" className={link}><Icon name="clients" /><span>Клиенты</span></NavLink>
        <NavLink to="/leads" className={link}><Icon name="leads" /><span>Заявки</span></NavLink>
        <NavLink to="/funnels" className={link}><Icon name="funnels" /><span>Воронки</span></NavLink>
        <NavLink to="/templates" className={link}><Icon name="templates" /><span>Шаблоны</span></NavLink>
        <NavLink to="/notes" className={link}><Icon name="notes" /><span>Заметки</span></NavLink>
        <button className="out" onClick={signOut}><Icon name="logout" /><span>Выйти</span></button>
        <div className="who">{email}<br /><button className="btn small" onClick={signOut}>Выйти</button></div>
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

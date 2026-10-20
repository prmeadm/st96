import { NavLink, Navigate, Route, Routes } from 'react-router-dom'
import { AuthGate, useAuth } from './auth'
import ClientsPage from './pages/ClientsPage'
import ClientPage from './pages/ClientPage'
import LeadsPage from './pages/LeadsPage'
import NotesPage from './pages/NotesPage'
import FunnelsPage from './pages/FunnelsPage'
import FunnelPage from './pages/FunnelPage'
import TemplatesPage from './pages/TemplatesPage'

function Shell() {
  const { email, signOut } = useAuth()
  const link = ({ isActive }: { isActive: boolean }) => (isActive ? 'on' : '')
  return (
    <div className="app">
      <nav className="rail" aria-label="Разделы">
        <div className="brand">ST96 · админка</div>
        <NavLink to="/clients" className={link}>👥 Клиенты</NavLink>
        <NavLink to="/leads" className={link}>📥 Заявки</NavLink>
        <NavLink to="/funnels" className={link}>🔀 Воронки</NavLink>
        <NavLink to="/templates" className={link}>💬 Шаблоны</NavLink>
        <NavLink to="/notes" className={link}>📝 Заметки</NavLink>
        <button className="out" onClick={signOut}>⎋<span>Выйти</span></button>
        <div className="who">{email}<br /><button className="btn" style={{ marginTop: 8, padding: '5px 10px' }} onClick={signOut}>Выйти</button></div>
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

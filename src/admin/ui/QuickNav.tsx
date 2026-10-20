import { useEffect, useRef, useState } from 'react'
import { services } from '../../data/services'
import { Icon, type IconName } from './Icon'

type L = { href: string; label: string; icon?: IconName }
const ADMIN: L[] = [
  { href: '/admin/clients', label: 'Клиенты', icon: 'clients' },
  { href: '/admin/leads', label: 'Заявки', icon: 'leads' },
  { href: '/admin/funnels', label: 'Воронки', icon: 'funnels' },
  { href: '/admin/broadcasts', label: 'Рассылки', icon: 'send' },
  { href: '/admin/booking', label: 'Запись', icon: 'calendar' },
  { href: '/admin/templates', label: 'Шаблоны', icon: 'templates' },
  { href: '/admin/agent', label: 'Агент', icon: 'agent' },
  { href: '/admin/analytics', label: 'Аналитика', icon: 'chart' },
  { href: '/admin/notes', label: 'Заметки', icon: 'notes' },
  { href: '/admin/settings', label: 'Настройки', icon: 'settings' },
]
const SITE: L[] = [
  { href: '/', label: 'Главная' },
  ...services.map((s) => ({ href: `/${s.slug}`, label: s.navLabel })),
  { href: '/book', label: 'Запись на встречу' },
  { href: '/privacy', label: 'Политика конфиденциальности' },
]
const SITE_EN: L[] = [{ href: '/en', label: 'Home (EN)' }, ...services.map((s) => ({ href: `/en/${s.slug}`, label: `${s.navLabel} (EN)` })), { href: '/en/privacy', label: 'Privacy (EN)' }]

/** Бургер сверху справа: быстрые переходы по админке и сайту, каждая страница в новой вкладке. */
export function QuickNav() {
  const [open, setOpen] = useState(false)
  const box = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    const onDown = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onDown)
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('mousedown', onDown) }
  }, [open])

  const group = (title: string, items: L[]) => (
    <div className="qn-group" key={title}>
      <div className="qn-title">{title}</div>
      {items.map((l) => (
        <a key={l.href} className="qn-link" href={l.href} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)}>
          {l.icon ? <Icon name={l.icon} size={18} /> : <span className="qn-dot" aria-hidden="true" />}
          <span>{l.label}</span>
          <Icon name="external" size={14} />
        </a>
      ))}
    </div>
  )
  return (
    <div className="qn" ref={box}>
      <button type="button" className="qn-btn" aria-expanded={open} aria-controls="qn-panel" aria-label={open ? 'Закрыть меню страниц' : 'Меню страниц'} title="Страницы админки и сайта" onClick={() => setOpen(!open)}>
        <Icon name={open ? 'close' : 'menu'} size={22} />
      </button>
      {open && (
        <nav id="qn-panel" className="qn-panel" aria-label="Страницы админки и сайта">
          {group('Админка', ADMIN)}
          {group('Сайт', SITE)}
          {group('English', SITE_EN)}
          <div className="hint qn-note">Страницы открываются в новой вкладке.</div>
        </nav>
      )}
    </div>
  )
}

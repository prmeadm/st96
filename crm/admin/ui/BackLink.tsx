import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from './Icon'

/** Ссылка «назад» к списку: иконка-стрелка и название раздела. */
export function BackLink({ to, children, className = '' }: { to: string; children: ReactNode; className?: string }) {
  return <Link to={to} className={`backlink ${className}`}><Icon name="collapse" size={18} />{children}</Link>
}

import { Fragment } from 'react'

/** Ссылка на Telegram по нику (с @ или без) */
export const tgUrl = (handle: string) => `https://t.me/${handle.trim().replace(/^@/, '')}`

/** Контакты ссылками: телефон звонит, ник открывает Telegram, почта открывает письмо. Пустые поля пропускаются. */
export function ContactLinks({ phone, telegram, email, before = [] }: { phone?: string | null; telegram?: string | null; email?: string | null; before?: string[] }) {
  const items = [
    ...before.filter(Boolean).map((t) => ({ key: `b${t}`, node: <span>{t}</span> })),
    telegram?.trim() ? { key: 't', node: <a href={tgUrl(telegram)} target="_blank" rel="noreferrer" title="Открыть в Telegram">{telegram.startsWith('@') ? telegram : `@${telegram}`}</a> } : null,
    phone?.trim() ? { key: 'p', node: <a href={`tel:${phone.replace(/[^\d+]/g, '')}`}>{phone}</a> } : null,
    email?.trim() ? { key: 'e', node: <a href={`mailto:${email}`}>{email}</a> } : null,
  ].filter(Boolean) as { key: string; node: React.ReactNode }[]
  if (!items.length) return <>контактов нет</>
  return <>{items.map((x, i) => <Fragment key={x.key}>{i > 0 && ' · '}{x.node}</Fragment>)}</>
}

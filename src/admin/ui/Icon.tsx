// Линейные иконки навигации: 24x24, штрих 1.7, скруглённые концы (один стиль для всех).
const PATHS = {
  clients: 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2.5 20c0-3.3 2.9-5.5 6.5-5.5s6.5 2.2 6.5 5.5M16.5 4.4a3.3 3.3 0 0 1 0 6.2M18.2 14.8c2 .7 3.3 2.3 3.3 5.2',
  leads: 'M3 13l2.4-7.2A2 2 0 0 1 7.3 4.4h9.4a2 2 0 0 1 1.9 1.4L21 13v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM3 13h5.2l1.2 2.4h5.2l1.2-2.4H21',
  funnels: 'M9 3.5h6v4H9zM12 7.5v4M5 14v-2.5h14V14M3 14h4v4.5H3zM17 14h4v4.5h-4zM10 14h4v4.5h-4zM12 11.5V14',
  templates: 'M20.5 11.8a8 8 0 0 1-11.7 7.1L3.5 20.5l1.6-4.8A8 8 0 1 1 20.5 11.8zM8.5 10.5h7M8.5 13.5h4',
  notes: 'M5.5 3.5h9l4 4v13h-13zM14.5 3.5v4h4M8.5 12h7M8.5 15.5h7',
  send: 'M21.5 3.5L2.5 10.8l7.4 2.7 2.7 7.4zM21.5 3.5L9.9 13.5',
  collapse: 'M15 6l-6 6 6 6',
  expand: 'M9 6l6 6-6 6',
  agent: 'M12 3l1.8 4.7L18.5 9.5 13.8 11.3 12 16l-1.8-4.7L5.5 9.5l4.7-1.8zM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z',
  logout: 'M9.5 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3.5M14 8l4 4-4 4M18 12H9.5',
} as const

export type IconName = keyof typeof PATHS

export function Icon({ name, size = 22 }: { name: IconName; size?: number }) {
  return (
    <svg className="ic" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={PATHS[name]} />
    </svg>
  )
}

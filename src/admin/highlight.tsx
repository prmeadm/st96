import type { ReactNode } from 'react'

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** Подсвечивает слова фильтра; «е» и «ё» считаются одной буквой, регистр не важен. */
export function Highlight({ text, words }: { text: string; words: string[] }): ReactNode {
  const parts = words.map((w) => esc(w.trim().toLowerCase()).replace(/[её]/g, '[её]')).filter(Boolean)
  if (!parts.length) return text
  const re = new RegExp(`(${parts.join('|')})`, 'gi')
  return text.split(re).map((chunk, i) => (i % 2 ? <mark key={i}>{chunk}</mark> : chunk))
}

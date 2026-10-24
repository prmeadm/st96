import { useState } from 'react'
import { callApi } from '../api'
import { Icon } from './Icon'

/** Перевод русского текста на английский (модель сервера; переменные {имя}, ссылки и команды сохраняются). */
export function TranslateButton({ source, target, onDone, compact = false }: { source: string; target: string; onDone: (en: string) => void; compact?: boolean }) {
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const run = async () => {
    if (target.trim() && !confirm('Английское поле уже заполнено. Заменить его новым переводом?')) return
    setBusy(true)
    setErr('')
    const r = await callApi<{ text: string }>('/api/translate', { text: source })
    setBusy(false)
    if (r.ok) onDone(r.data.text)
    else setErr(r.error)
  }
  const label = busy ? 'Перевожу…' : 'Перевести на English'
  return (
    <span className="tr">
      <button type="button" className={compact ? 'ibtn sm' : 'btn small-btn'} onClick={run} disabled={busy || !source.trim()} title={source.trim() ? 'Перевести русский текст на английский' : 'Сначала введите русский текст'} aria-label="Перевести на английский">
        <Icon name="translate" size={compact ? 18 : 16} />{!compact && <span>{label}</span>}
      </button>
      {err && <span className="err" role="alert">{err}</span>}
    </span>
  )
}

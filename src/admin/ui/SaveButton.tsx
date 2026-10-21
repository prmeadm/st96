import { useEffect, useRef, useState, type ReactNode } from 'react'

type State = 'idle' | 'saving' | 'done' | 'fail'

/** Кнопка сохранения с обратной связью: крутилка, затем анимированная галочка «Сохранено» (или «Не сохранено»). */
export function SaveButton({ onSave, children, doneLabel = 'Сохранено', className = '', disabled }: {
  onSave: () => Promise<boolean | void> | boolean | void
  children: ReactNode
  doneLabel?: string
  className?: string
  disabled?: boolean
}) {
  const [state, setState] = useState<State>('idle')
  const [width, setWidth] = useState<number | undefined>()
  const ref = useRef<HTMLButtonElement>(null)
  const timer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(timer.current), [])

  const click = async () => {
    if (state === 'saving') return
    setWidth(ref.current?.offsetWidth) // ширина не прыгает, пока меняется подпись
    setState('saving')
    let ok: boolean | void = true
    try { ok = await onSave() } catch { ok = false }
    setState(ok === false ? 'fail' : 'done')
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => { setState('idle'); setWidth(undefined) }, 2200)
  }

  return (
    <button ref={ref} type="button" className={`btn save-btn ${className} ${state}`} style={width ? { minWidth: width } : undefined} disabled={disabled || state === 'saving'} onClick={click} aria-live="polite">
      {state === 'saving' && <span className="save-spin" aria-hidden="true" />}
      {state === 'done' && (
        <svg className="save-check" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7" /></svg>
      )}
      <span>{state === 'done' ? doneLabel : state === 'fail' ? 'Не сохранено' : state === 'saving' ? 'Сохраняем…' : children}</span>
    </button>
  )
}

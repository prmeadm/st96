import type { ModelId } from '../../../../crm/shared/data/services'

/** Модели AI для пакетов поддержки: название + фирменный цвет */
const MODELS: Record<ModelId, { name: string; color: string }> = {
  deepseek: { name: 'DeepSeek', color: '#4d6bfe' },
  chatgpt: { name: 'ChatGPT', color: '#10a37f' },
  claude: { name: 'Claude', color: '#d97757' },
}

function Glyph({ id }: { id: ModelId }) {
  if (id === 'deepseek') {
    // кит
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3.2 13.6c0-2.3 1.7-4.2 4-4.5.4-2 1.9-3.1 3.7-3.1.9 0 1.8.2 2.6.7.7-.5 1.6-.7 2.5-.7 1.2 1.1 1.9 2.6 2 4.2 1.2 1 1.9 2.4 1.9 4 0 2.5-1.9 4.4-4.3 4.6-.5 1.7-2 2.9-3.8 2.9-1 0-2-.4-2.7-1-.6.5-1.3.8-2.1.8-1.5 0-2.8-1.1-2.8-2.6 0-.4 0-.7.1-1.1C4.6 16.2 3 15 3.2 13.6z" />
        <circle cx="9" cy="13" r="0.9" fill="currentColor" stroke="none" />
      </svg>
    )
  }
  if (id === 'chatgpt') {
    // чат-пузырь
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 11.5a7.5 7.5 0 0 1-7.5 7.5H7l-4 4v-4.2A7.5 7.5 0 1 1 21 11.5z" />
        <path d="M8.5 12h.01M12 12h.01M15.5 12h.01" strokeWidth="2.4" />
      </svg>
    )
  }
  // искра / звёздочка (Claude)
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2.5v19M2.5 12h19M5.3 5.3l13.4 13.4M18.7 5.3L5.3 18.7" />
    </svg>
  )
}

/** Иконка модели: фирменный цвет + подпись. Используется в карточках пакетов. */
export function ModelIcon({ id, size = 18, withName = true }: { id: ModelId; size?: number; withName?: boolean }) {
  const m = MODELS[id]
  return (
    <span className="inline-flex items-center gap-1.5" title={m.name}>
      <span
        className="grid shrink-0 place-items-center rounded-md"
        style={{ width: size + 8, height: size + 8, background: m.color, color: '#fff' }}
      >
        <span style={{ width: size, height: size }} className="block">
          <Glyph id={id} />
        </span>
      </span>
      {withName && <span className="text-xs font-medium text-paper-dim">{m.name}</span>}
    </span>
  )
}

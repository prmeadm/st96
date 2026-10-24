import { Icon, type IconName } from './Icon'

export type SegOption<T extends string> = { value: T; label: string; icon?: IconName }

/** Переключатель: у каждого пункта иконка, подпись видна только у выбранного (у остальных она в подсказке). */
export function Seg<T extends string>({ value, options, onChange, label, iconOnly = false }: { value: T; options: SegOption<T>[]; onChange: (v: T) => void; label: string; iconOnly?: boolean }) {
  return (
    <div className={`seg${iconOnly ? ' icons' : ''}`} role="group" aria-label={label}>
      {options.map((o) => (
        <button type="button" key={o.value} className={o.value === value ? 'on' : ''} aria-pressed={o.value === value} aria-label={o.label} title={o.label} onClick={() => onChange(o.value)}>
          {o.icon && <Icon name={o.icon} size={18} />}
          <span>{o.label}</span>
        </button>
      ))}
    </div>
  )
}

/** Типы сообщений для шаблонов и рассылок */
export const KIND_OPTIONS: SegOption<'text' | 'photo' | 'video' | 'voice' | 'audio' | 'file'>[] = [
  { value: 'text', label: 'Текст', icon: 'text' },
  { value: 'photo', label: 'Фото', icon: 'photo' },
  { value: 'video', label: 'Видео', icon: 'video' },
  { value: 'voice', label: 'Голос', icon: 'voice' },
  { value: 'audio', label: 'Аудио', icon: 'audio' },
  { value: 'file', label: 'Файл', icon: 'file' },
]

/** Что можно выбрать в списках: «Аудио» отдельно не нужно, аудиофайл прикладывается в «Голос» (запись или файл); старые шаблоны с типом «аудио» продолжают работать. */
export const PICK_KINDS = KIND_OPTIONS.filter((o) => o.value !== 'audio')
export const pickKind = <T extends string>(k: T): T | 'voice' => (k === 'audio' ? 'voice' : k)

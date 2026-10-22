import { useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { applyTheme, readTheme } from '../../lib/theme'
import type { Theme } from '../../lib/theme'
import { reachGoal } from '../../lib/analytics'
import { useUi } from '../../lib/i18n'

export default function ThemeToggle() {
  const t = useUi()
  const [theme, setTheme] = useState<Theme>(readTheme)

  const choose = (next: Theme) => {
    if (next === theme) return
    applyTheme(next, true)
    setTheme(next)
    reachGoal('theme_switch', { theme: next })
  }

  const options: { value: Theme; label: string; Icon: typeof Sun }[] = [
    { value: 'dark', label: t.themeDark, Icon: Moon },
    { value: 'light', label: t.themeLight, Icon: Sun },
  ]

  return (
    <div role="radiogroup" aria-label={t.themeSwitch} className="inline-flex items-center gap-1 rounded-full border border-ink-line p-1">
      {options.map(({ value, label, Icon }) => {
        const active = theme === value
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => choose(value)}
            data-cursor-hover
            className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-[background-color,color] duration-200 ease-out ${
              active ? 'bg-paper text-ink' : 'text-paper-dim hover:text-paper'
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        )
      })}
    </div>
  )
}

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../supabase'
import { Icon } from '../ui/Icon'
import { PERIODS, condLabel, isEmptyCond, type Cond, type CondValue, type DateValue, type FieldDef, type Period, type Range } from '../../server/leads/filter'

type Preset = { id: string; name: string; conds: Cond[] }

/**
 * Строка поиска с чипами условий и окно «Фильтр» в духе Битрикс24: сохранённые наборы слева, поля справа.
 * Поля приходят от страницы (выведены из данных), сюда новый параметр попадает сам.
 */
export function FilterBar({ page, fields, defaults, conds, q, onChange, placeholder }: {
  page: 'leads' | 'clients'
  fields: FieldDef[]
  defaults: string[]
  conds: Cond[]
  q: string
  onChange: (conds: Cond[], q: string) => void
  placeholder: string
}) {
  const [open, setOpen] = useState(false)
  const byKey = useMemo(() => new Map(fields.map((f) => [f.key, f])), [fields])
  const active = conds.filter((c) => !isEmptyCond(c))
  const drop = (i: number) => onChange(active.filter((_, j) => j !== i), q)

  return (
    <>
      <div className="fb-bar">
        {active.map((c, i) => (
          <span key={`${c.field}-${i}`} className="fb-chip">
            {condLabel(c, byKey.get(c.field))}
            <button type="button" aria-label="Убрать условие" onClick={() => drop(i)}><Icon name="close" size={14} /></button>
          </span>
        ))}
        <input type="search" value={q} placeholder={active.length ? 'Поиск' : placeholder} aria-label="Поиск" onChange={(e) => onChange(active, e.target.value)} />
        {(active.length > 0 || q) && <button type="button" className="fb-x" aria-label="Сбросить фильтр" title="Сбросить фильтр" onClick={() => onChange([], '')}><Icon name="close" size={16} /></button>}
        <button type="button" className={`btn${active.length ? ' primary' : ''}`} onClick={() => setOpen(true)}><Icon name="settings" size={18} />Фильтр</button>
      </div>
      {open && <FilterModal page={page} fields={fields} byKey={byKey} defaults={defaults} conds={active} q={q} onClose={() => setOpen(false)}
        onApply={(c, text, close) => { onChange(c, text); if (close) setOpen(false) }} />}
    </>
  )
}

function FilterModal({ page, fields, byKey, defaults, conds, q, onApply, onClose }: {
  page: 'leads' | 'clients'
  fields: FieldDef[]
  byKey: Map<string, FieldDef>
  defaults: string[]
  conds: Cond[]
  q: string
  onApply: (conds: Cond[], q: string, close: boolean) => void
  onClose: () => void
}) {
  const showFor = (cs: Cond[]) => [...new Set([...defaults, ...cs.map((c) => c.field)])].filter((k) => byKey.has(k))
  const [draft, setDraft] = useState<Cond[]>(conds)
  const [text, setText] = useState(q)
  const [shown, setShown] = useState<string[]>(() => showFor(conds))
  const [presets, setPresets] = useState<Preset[] | null>(null)
  const [current, setCurrent] = useState<string | null>(null)
  const [err, setErr] = useState('')

  const loadPresets = () =>
    supabase.from('filter_presets').select('id, name, conds').eq('page', page).order('sort').order('created_at')
      .then(({ data, error }) => (error ? (setPresets([]), setErr('Наборы фильтров недоступны: нужна миграция 0013_filter_presets.sql')) : setPresets((data ?? []) as Preset[])))
  useEffect(() => { void loadPresets() }, [page]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [onClose])

  const valueOf = (k: string) => draft.find((c) => c.field === k)?.value
  const set = (k: string, v: CondValue | null) => setDraft((d) => {
    const rest = d.filter((c) => c.field !== k)
    return v === null ? rest : [...rest, { field: k, value: v }]
  })
  const hide = (k: string) => { setShown((s) => s.filter((x) => x !== k)); set(k, null) }
  const clean = () => draft.filter((c) => !isEmptyCond(c))

  const pickPreset = (p: Preset) => {
    setCurrent(p.id)
    setDraft(p.conds)
    setText('')
    setShown(showFor(p.conds))
    onApply(p.conds.filter((c) => !isEmptyCond(c)), '', false)
  }
  const savePreset = async (asNew: boolean) => {
    const cur = presets?.find((p) => p.id === current)
    const name = asNew || !cur ? window.prompt('Название набора фильтров', '')?.trim() : cur.name
    if (!name) return
    const { data, error } = asNew || !cur
      ? await supabase.from('filter_presets').insert({ page, name, conds: clean(), sort: presets?.length ?? 0 }).select('id').single()
      : await supabase.from('filter_presets').update({ conds: clean() }).eq('id', cur.id).select('id').single()
    if (error) return setErr('Не удалось сохранить набор')
    setErr('')
    setCurrent((data as { id: string }).id)
    void loadPresets()
  }
  const renamePreset = async (p: Preset) => {
    const name = window.prompt('Новое название', p.name)?.trim()
    if (!name || name === p.name) return
    const { error } = await supabase.from('filter_presets').update({ name }).eq('id', p.id)
    if (error) setErr('Не удалось переименовать'); else void loadPresets()
  }
  const removePreset = async (p: Preset) => {
    if (!window.confirm(`Удалить набор «${p.name}»?`)) return
    const { error } = await supabase.from('filter_presets').delete().eq('id', p.id)
    if (error) return setErr('Не удалось удалить набор')
    if (current === p.id) setCurrent(null)
    void loadPresets()
  }

  const groups = useMemo(() => {
    const m = new Map<string, FieldDef[]>()
    for (const f of fields) if (!shown.includes(f.key)) m.set(f.group, [...(m.get(f.group) ?? []), f])
    return [...m.entries()]
  }, [fields, shown])
  const cur = presets?.find((p) => p.id === current)

  return (
    <div className="lx-ov" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="lx-modal fb-modal" role="dialog" aria-modal="true" aria-label="Фильтр">
        <div className="lx-h"><b>Фильтр</b><span className="sp" /><button type="button" className="fb-x" aria-label="Закрыть" onClick={onClose}><Icon name="close" size={18} /></button></div>
        <div className="fb-body">
          <aside className="fb-presets">
            <div className="hint">Сохранённые наборы</div>
            {presets === null && <div className="hint">Загрузка…</div>}
            {presets?.length === 0 && !err && <div className="hint">Пока нет. Настройте поля и нажмите «Сохранить как набор».</div>}
            {presets?.map((p) => (
              <div key={p.id} className={`fb-preset${p.id === current ? ' on' : ''}`}>
                <button type="button" className="fb-pname" onClick={() => pickPreset(p)}>{p.name}</button>
                <button type="button" aria-label={`Переименовать «${p.name}»`} title="Переименовать" onClick={() => renamePreset(p)}><Icon name="edit" size={14} /></button>
                <button type="button" aria-label={`Удалить «${p.name}»`} title="Удалить" onClick={() => removePreset(p)}><Icon name="trash" size={14} /></button>
              </div>
            ))}
          </aside>
          <div className="fb-fields">
            <div className="fld"><label htmlFor="fb-q">Поиск по тексту</label><input id="fb-q" type="search" value={text} onChange={(e) => setText(e.target.value)} placeholder="Часть имени, телефона, ника, комментария…" /></div>
            {shown.map((k) => {
              const f = byKey.get(k)
              return f ? <FieldRow key={k} f={f} value={valueOf(k)} onChange={(v) => set(k, v)} onHide={() => hide(k)} /> : null
            })}
            {groups.length > 0 && (
              <select value="" aria-label="Добавить поле" onChange={(e) => e.target.value && setShown((s) => [...s, e.target.value])}>
                <option value="">+ Добавить поле</option>
                {groups.map(([g, fs]) => <optgroup key={g} label={g}>{fs.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}</optgroup>)}
              </select>
            )}
            {err && <div className="err" role="alert">{err}</div>}
          </div>
        </div>
        <div className="lx-f fb-foot">
          <button type="button" className="btn primary" onClick={() => onApply(clean(), text, true)}>Найти</button>
          <button type="button" className="btn" onClick={() => { setDraft([]); setText(''); setCurrent(null); setShown(showFor([])); onApply([], '', false) }}>Сбросить</button>
          <span className="sp" />
          {cur && <button type="button" className="btn" onClick={() => savePreset(false)}>Сохранить в «{cur.name}»</button>}
          <button type="button" className="btn" onClick={() => savePreset(true)}>Сохранить как набор</button>
        </div>
      </div>
    </div>
  )
}

function FieldRow({ f, value, onChange, onHide }: { f: FieldDef; value: CondValue | undefined; onChange: (v: CondValue | null) => void; onHide: () => void }) {
  const id = `fb-${f.key}`
  const head = (
    <div className="fb-lbl">
      <label htmlFor={id}>{f.label}</label>
      <button type="button" className="fb-x" aria-label={`Убрать поле «${f.label}»`} title="Убрать поле" onClick={onHide}><Icon name="close" size={14} /></button>
    </div>
  )
  if (f.kind === 'enum') {
    const sel = Array.isArray(value) ? value : []
    const toggle = (v: string) => onChange(sel.includes(v) ? sel.filter((x) => x !== v) : [...sel, v])
    return (
      <div className="fld" role="group" aria-labelledby={id}>
        {head}
        <div className="chips" id={id}>
          {!f.options?.length && <span className="hint">Пока нет значений</span>}
          {(f.options ?? []).map((o) => <button type="button" key={o.value} className={sel.includes(o.value) ? 'on' : ''} aria-pressed={sel.includes(o.value)} onClick={() => toggle(o.value)}>{o.label}</button>)}
        </div>
      </div>
    )
  }
  if (f.kind === 'bool') {
    return (
      <div className="fld">{head}
        <select id={id} value={value === true ? 'yes' : value === false ? 'no' : ''} onChange={(e) => onChange(e.target.value ? e.target.value === 'yes' : null)}>
          <option value="">Не важно</option><option value="yes">Да</option><option value="no">Нет</option>
        </select>
      </div>
    )
  }
  if (f.kind === 'number') {
    const r = (value ?? {}) as Range
    return (
      <div className="fld">{head}
        <div className="fb-range">
          <input id={id} inputMode="decimal" placeholder="от" value={r.from ?? ''} onChange={(e) => onChange({ ...r, from: e.target.value })} />
          <span className="muted">—</span>
          <input inputMode="decimal" placeholder="до" aria-label={`${f.label}: до`} value={r.to ?? ''} onChange={(e) => onChange({ ...r, to: e.target.value })} />
        </div>
      </div>
    )
  }
  if (f.kind === 'date') {
    const d = (value ?? {}) as DateValue
    const period = d.period ?? (d.from || d.to ? 'range' : '')
    return (
      <div className="fld">{head}
        <div className="fb-range">
          <select id={id} value={period} onChange={(e) => onChange(e.target.value ? { period: e.target.value as Period } : null)}>
            <option value="">Любая дата</option>
            {Object.entries(PERIODS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          {period === 'range' && <>
            <input type="date" aria-label={`${f.label}: с`} value={d.from ?? ''} onChange={(e) => onChange({ ...d, period: 'range', from: e.target.value })} />
            <span className="muted">—</span>
            <input type="date" aria-label={`${f.label}: по`} value={d.to ?? ''} onChange={(e) => onChange({ ...d, period: 'range', to: e.target.value })} />
          </>}
        </div>
      </div>
    )
  }
  return (
    <div className="fld">{head}
      <input id={id} value={typeof value === 'string' ? value : ''} placeholder="содержит" onChange={(e) => onChange(e.target.value)} />
    </div>
  )
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, type ReactNode } from 'react'
import type { Node } from '@xyflow/react'
import { TRIGGER } from '../../../server/funnels/types'
import { ACT_TYPES, COND_TYPES, DAYS, FORMATS, P, SERVICES, TRIGGERS, TYPES, uid, type D } from './catalog'
import { Ic } from './Nodes'
import { TranslateButton } from '../ui/TranslateButton'
import { MediaField } from '../ui/MediaField'
import { VideoNoteField } from '../ui/VideoNoteField'
import { supabase } from '../supabase'
import type { TemplateRow } from '../../../server/templates'
import { TPL_KINDS } from '../../../server/templates'

/** Выбор шаблона из библиотеки: текст копируется в блок, поздние правки шаблона опубликованные воронки не меняют */
function TemplatePicker({ onPick }: { onPick: (t: TemplateRow) => void }) {
  const [open, setOpen] = useState(false)
  const [rows, setRows] = useState<TemplateRow[] | null>(null)
  const [q, setQ] = useState('')
  const [err, setErr] = useState('')
  const toggle = () => {
    setOpen(!open)
    if (!open && !rows) supabase.from('templates').select('*').order('used', { ascending: false }).then(({ data, error }) => (error ? setErr('Не удалось загрузить шаблоны') : setRows((data ?? []) as TemplateRow[])))
  }
  const list = (rows ?? []).filter((t) => !q.trim() || `${t.title} ${t.body}`.toLowerCase().includes(q.trim().toLowerCase()))
  return (
    <div>
      <button type="button" className="btn" style={{ width: '100%', justifyContent: 'center' }} onClick={toggle}>Вставить из шаблона</button>
      {open && (
        <div className="item" style={{ marginTop: 6 }}>
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Поиск шаблонов" />
          {err && <div className="err">{err}</div>}
          {rows === null && !err && <div className="hint">Загрузка…</div>}
          {rows && list.length === 0 && <div className="hint">Шаблонов не найдено. Создайте их в разделе «Шаблоны».</div>}
          <div style={{ maxHeight: 260, overflow: 'auto', marginTop: 6 }}>
            {list.map((t) => (
              <button type="button" key={t.id} className="btn" style={{ width: '100%', justifyContent: 'flex-start', textAlign: 'left', marginBottom: 4, flexDirection: 'column', alignItems: 'flex-start' }} onClick={() => { onPick(t); setOpen(false) }}>
                <b>{t.title} <span className="hint">· {TPL_KINDS[t.kind]}</span></b>
                <span className="hint" style={{ whiteSpace: 'normal' }}>{t.body.slice(0, 90)}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const Field = ({ label, children }: { label: string; children: ReactNode }) => <div className="fld"><label>{label}</label>{children}</div>
const Seg = ({ value, options, onChange }: { value: string; options: [string, string][]; onChange: (v: string) => void }) => (
  <div className="seg">{options.map(([v, l]) => <button type="button" key={v} className={value === v ? 'on' : ''} onClick={() => onChange(v)}>{l}</button>)}</div>
)
const Check = ({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: ReactNode }) => (
  <label className="chk"><input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />{children}</label>
)

function Grouped({ items, onPick, label }: { items: { k: string; n: string; g: string }[]; onPick: (k: string) => void; label: string }) {
  const [open, setOpen] = useState(false)
  const groups = [...new Set(items.map((i) => i.g))]
  return (
    <div style={{ position: 'relative' }}>
      <button type="button" className="btn" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setOpen(!open)}><Ic d={P.plus} size={14} /> {label}</button>
      {open && (
        <div className="menu" style={{ bottom: 'auto', top: 44, left: 0, transform: 'none', width: '100%', maxHeight: 320, overflow: 'auto' }}>
          {groups.map((g) => (
            <div key={g}><div className="sep">{g}</div>
              {items.filter((i) => i.g === g).map((i) => <button type="button" key={i.k} onClick={() => { onPick(i.k); setOpen(false) }}><b style={{ fontWeight: 500 }}>{i.n}</b></button>)}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const PART_NAMES: Record<string, string> = { text: 'Текст', image: 'Фото', video: 'Видео', videonote: 'Кружок', audio: 'Аудио', file: 'Файл' }
// вид части блока -> вид поля загрузки (как в шаблонах)
const FIELD_KIND = { image: 'photo', video: 'video', audio: 'audio', file: 'file' } as const
const ACT_HINT: Record<string, string> = {
  delay: 'Например: 2 часа, 30 мин, 1 день', notify: 'Текст уведомления, можно {имя}', addtag: 'Теги через запятую', deltag: 'Теги через запятую',
  segment: 'Название сегмента', setvar: 'ключ = значение', conv: 'Название цели',
}
const COND_HINT: Record<string, string> = {
  tag: 'Тег, например VIP', field: 'Поле = значение (имя, телефон, компания, email, язык, ник, источник; * = заполнено)', var: 'Переменная = значение', time: 'С 10:00 до 18:00', date: '2026-10-25 или 2026-10-25 — 2026-10-30',
}

export function Editor({ node, patch, remove, duplicate, close }: { node: Node; patch: (id: string, p: D) => void; remove: (id: string) => void; duplicate: (id: string) => void; close: () => void }) {
  const d: D = node.data
  const type = node.type as string
  const t = TYPES[type]
  const set = (p: D) => patch(node.id, p)
  let body: ReactNode = null

  if (type === 'start') body = (<>
    <div className="h2">Когда запускать воронку</div>
    {TRIGGERS.map((x) => (
      <Check key={x} checked={d.triggers.includes(x)} onChange={(v) => set({ triggers: v ? [...d.triggers, x] : d.triggers.filter((y: string) => y !== x) })}>{x}</Check>
    ))}
    {d.triggers.includes(TRIGGER.keyword) && <Field label="Ключевые слова (через запятую, лучше основы)"><input type="text" value={d.keyword} onChange={(e) => set({ keyword: e.target.value })} placeholder="цен, прайс, запис" /></Field>}
    <Check checked={!!d.once} onChange={(v) => set({ once: v })}>Не запускать повторно для одного клиента</Check>
  </>)

  if (type === 'message') body = (<>
    <div className="h2">Содержимое</div>
    {d.parts.map((p: D) => (
      <div className="item" key={p.id}>
        <div className="ih"><span>{PART_NAMES[p.kind] ?? 'Блок'}</span>
          <button type="button" className="x" onClick={() => set({ parts: d.parts.filter((x: D) => x.id !== p.id) })} aria-label="Удалить" title="Удалить"><Ic d={P.close} size={14} /></button></div>
        {p.kind === 'text' ? (<>
          <textarea value={p.text ?? ''} placeholder="Текст сообщения. Можно {имя}, {компания}, {запись}" onChange={(e) => set({ parts: d.parts.map((x: D) => x.id === p.id ? { ...x, text: e.target.value } : x) })} />
          <div className="lblrow"><span className="hint">English</span><TranslateButton source={p.text ?? ''} target={p.en ?? ''} onDone={(t) => set({ parts: d.parts.map((x: D) => x.id === p.id ? { ...x, en: t } : x) })} /></div>
          <textarea className="en" value={p.en ?? ''} placeholder="English (необязательно, для клиентов с английским)" onChange={(e) => set({ parts: d.parts.map((x: D) => x.id === p.id ? { ...x, en: e.target.value } : x) })} />
        </>) : p.kind === 'videonote' ? (
          <VideoNoteField value={p.url ?? ''} folder="funnels" onChange={(url) => set({ parts: d.parts.map((x: D) => x.id === p.id ? { ...x, url } : x) })} />
        ) : (
          <MediaField kind={FIELD_KIND[p.kind as keyof typeof FIELD_KIND] ?? 'file'} value={p.url ?? ''} folder="funnels" onChange={(url) => set({ parts: d.parts.map((x: D) => x.id === p.id ? { ...x, url } : x) })} />
        )}
      </div>
    ))}
    <div className="addrow">
      {[['text', '+ Текст'], ['image', '+ Фото'], ['video', '+ Видео'], ['videonote', '+ Кружок'], ['audio', '+ Аудио'], ['file', '+ Файл']].map(([k, l]) =>
        <button type="button" key={k} onClick={() => set({ parts: [...d.parts, { id: uid('p'), kind: k, text: '', url: '' }] })}>{l}</button>)}
    </div>
    <TemplatePicker onPick={(t) => {
      set({ parts: [...d.parts, { id: uid('p'), kind: t.kind === 'photo' ? 'image' : t.kind === 'voice' ? 'audio' : t.kind, text: t.body, en: t.body_en ?? '', url: t.media_url ?? '' }] })
      supabase.from('template_events').insert({ template_id: t.id, kind: 'funnel' }).then(() => undefined)
    }} />
    <div className="hint">Файл можно загрузить, снять камерой или вставить ссылкой (YouTube, Vimeo, Rutube тоже). Кружок — квадратное видео до минуты. Фото или видео уходит одним сообщением с соседним текстом: медиа сверху, текст под ним (как в Telegram).</div>
    <div className="h2">Быстрые ответы</div>
    <div className="hint">Каждый ответ получает свой выход: тяните связь к следующему блоку.</div>
    {d.quick.map((q: D) => (
      <div className="item" key={q.id}>
        <div className="ih"><span>Ответ</span><button type="button" className="x" onClick={() => set({ quick: d.quick.filter((x: D) => x.id !== q.id) })} aria-label="Удалить" title="Удалить"><Ic d={P.close} size={14} /></button></div>
        <input type="text" value={q.label ?? ''} placeholder="Название кнопки" onChange={(e) => set({ quick: d.quick.map((x: D) => x.id === q.id ? { ...x, label: e.target.value } : x) })} />
        <div className="inrow">
          <input type="text" value={q.en ?? ''} placeholder="English (необязательно)" onChange={(e) => set({ quick: d.quick.map((x: D) => x.id === q.id ? { ...x, en: e.target.value } : x) })} />
          <TranslateButton compact source={q.label ?? ''} target={q.en ?? ''} onDone={(t) => set({ quick: d.quick.map((x: D) => x.id === q.id ? { ...x, en: t } : x) })} />
        </div>
      </div>
    ))}
    <div className="addrow"><button type="button" onClick={() => set({ quick: [...d.quick, { id: uid('q'), label: '' }] })}><Ic d={P.plus} size={14} /> Быстрый ответ</button></div>
    <div className="h2">Кнопки-ссылки</div>
    {d.links.map((l: D) => (
      <div className="item" key={l.id}>
        <div className="ih"><span>Ссылка</span><button type="button" className="x" onClick={() => set({ links: d.links.filter((x: D) => x.id !== l.id) })} aria-label="Удалить" title="Удалить"><Ic d={P.close} size={14} /></button></div>
        <input type="text" value={l.label ?? ''} placeholder="Название" onChange={(e) => set({ links: d.links.map((x: D) => x.id === l.id ? { ...x, label: e.target.value } : x) })} />
        <input type="url" value={l.url ?? ''} placeholder="https://" onChange={(e) => set({ links: d.links.map((x: D) => x.id === l.id ? { ...x, url: e.target.value } : x) })} />
      </div>
    ))}
    <div className="addrow"><button type="button" onClick={() => set({ links: [...d.links, { id: uid('l'), label: '', url: '' }] })}><Ic d={P.plus} size={14} /> Кнопка-ссылка</button></div>
  </>)

  if (type === 'condition') body = (<>
    <Field label="Соответствует"><Seg value={d.mode} onChange={(v) => set({ mode: v })} options={[['all', 'Всем условиям'], ['any', 'Любому']]} /></Field>
    {d.rules.map((r: D) => {
      const upd = (p: D) => set({ rules: d.rules.map((x: D) => x.id === r.id ? { ...x, ...p } : x) })
      return (
        <div className="item" key={r.id}>
          <div className="ih"><span>{COND_TYPES.find((c) => c.k === r.kind)?.n ?? r.kind}</span><button type="button" className="x" onClick={() => set({ rules: d.rules.filter((x: D) => x.id !== r.id) })} aria-label="Удалить" title="Удалить"><Ic d={P.close} size={14} /></button></div>
          {r.kind === 'service'
            ? <select value={r.value} onChange={(e) => upd({ value: e.target.value })}><option value="">Выберите услугу</option>{SERVICES.map((s) => <option key={s}>{s}</option>)}</select>
            : r.kind === 'day'
              ? <select value={r.value} onChange={(e) => upd({ value: e.target.value })}><option value="">День недели</option>{DAYS.map((s) => <option key={s}>{s}</option>)}</select>
              : r.kind === 'slot' || r.kind === 'booked'
                ? <div className="hint">Проверяется автоматически по расписанию и заявкам клиента.</div>
                : <input type="text" value={r.value ?? ''} placeholder={COND_HINT[r.kind]} onChange={(e) => upd({ value: e.target.value })} />}
        </div>
      )
    })}
    <Grouped items={COND_TYPES} label="Условие" onPick={(k) => set({ rules: [...d.rules, { id: uid('r'), kind: k, value: '' }] })} />
  </>)

  if (type === 'action') body = (<>
    {d.items.map((a: D) => {
      const upd = (p: D) => set({ items: d.items.map((x: D) => x.id === a.id ? { ...x, ...p } : x) })
      return (
        <div className="item" key={a.id}>
          <div className="ih"><span>{ACT_TYPES.find((c) => c.k === a.kind)?.n ?? a.kind}</span><button type="button" className="x" onClick={() => set({ items: d.items.filter((x: D) => x.id !== a.id) })} aria-label="Удалить" title="Удалить"><Ic d={P.close} size={14} /></button></div>
          <input type="text" value={a.value ?? ''} onChange={(e) => upd({ value: e.target.value })} placeholder={ACT_HINT[a.kind]} />
        </div>
      )
    })}
    <Grouped items={ACT_TYPES} label="Действие" onPick={(k) => set({ items: [...d.items, { id: uid('a'), kind: k, value: '' }] })} />
    <div className="hint">Сообщения после паузы получают только клиенты, согласившиеся на рассылки.</div>
  </>)

  if (type === 'booking') body = (<>
    <div className="aibox teal">Клиент получает кнопку «Выбрать время» с личной ссылкой на календарь. Воронка ждёт решения администратора: по выходу «Админ подтвердил» или «Админ отклонил / другое время».</div>
    <Field label="Сообщение клиенту"><textarea value={d.message ?? ''} placeholder="Выберите удобное время для встречи:" onChange={(e) => set({ message: e.target.value })} /></Field>
    <div className="lblrow"><span className="hint">English</span><TranslateButton source={d.message ?? ''} target={d.messageEn ?? ''} onDone={(t) => set({ messageEn: t })} /></div>
    <textarea className="en" value={d.messageEn ?? ''} placeholder="English (необязательно)" onChange={(e) => set({ messageEn: e.target.value })} />
    <div className="h2">Услуги на выбор</div>
    {SERVICES.map((s) => <Check key={s} checked={d.services.includes(s)} onChange={(v) => set({ services: v ? [...d.services, s] : d.services.filter((x: string) => x !== s) })}>{s}</Check>)}
    <div className="h2">Форматы</div>
    {FORMATS.map((s) => <Check key={s} checked={d.formats.includes(s)} onChange={(v) => set({ formats: v ? [...d.formats, s] : d.formats.filter((x: string) => x !== s) })}>{s}</Check>)}
    <div className="hint">Если выбрана одна услуга или один формат, они подставятся в форму заранее. Рабочие часы и правила задаются в разделе «Запись».</div>
  </>)

  if (type === 'handoff') body = (<>
    <Field label="Что увидит клиент"><textarea value={d.message ?? ''} onChange={(e) => set({ message: e.target.value })} /></Field>
    <Check checked={!!d.notify} onChange={(v) => set({ notify: v })}>Уведомить администратора в Telegram</Check>
    <div className="hint">После этого блока бот молчит 12 часов или пока администратор не закроет диалог.</div>
  </>)

  if (type === 'ai') body = <div className="aibox">ИИ-ответ пока не подключён: шаг пропускается.</div>
  if (type === 'note') body = <Field label="Заметка"><textarea value={d.text ?? ''} onChange={(e) => set({ text: e.target.value })} /></Field>

  return (
    <div className="panel"><span className="sheet-grip" />
      <div className="ph"><span className="ic" style={{ width: 26, height: 26, borderRadius: 8, display: 'grid', placeItems: 'center', background: t.soft, color: t.color }}><Ic d={t.icon} size={14} /></span>{t.name}<span className="sp" />
        <button type="button" className="x" onClick={close} title="Закрыть" aria-label="Закрыть"><Ic d={P.close} size={16} /></button></div>
      <div className="pb">{body}</div>
      {type !== 'start' && <div className="pf">
        <button type="button" className="btn" onClick={() => duplicate(node.id)}><Ic d={P.copy} size={14} /> Копия</button>
        <button type="button" className="btn" style={{ color: 'var(--red)' }} onClick={() => remove(node.id)}><Ic d={P.trash} size={14} /> Удалить</button>
      </div>}
    </div>
  )
}

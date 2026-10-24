import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../supabase'
import { fmtDate } from '../types'
import { TPL_GOALS, TPL_KINDS, TPL_SERVICES, TPL_TASKS, TPL_VARS, type TemplateKind, type TemplateRow } from '../../server/templates'
import { MediaField } from '../ui/MediaField'
import { Icon } from '../ui/Icon'
import { TranslateButton } from '../ui/TranslateButton'
import { KIND_OPTIONS, PICK_KINDS, Seg, pickKind } from '../ui/Seg'
import { popularityScore, ratings, type TemplateStat } from '../../server/usage'
import './templates.css'

const SAMPLE = { name: 'Анна', tg_username: 'anna', company: 'Студия «Лето»' }
const preview = (s: string) => s.replace(/\{имя\}/gi, SAMPLE.name).replace(/\{компания\}/gi, SAMPLE.company).replace(/\{ник\}/gi, `@${SAMPLE.tg_username}`).replace(/\{запись\}/gi, 'https://st96.by/book?c=…')
const blank = (): Draft => ({ kind: 'text', title: '', body: '', body_en: '', media_url: '', task: TPL_TASKS[0]!, goal: TPL_GOALS[0]!, services: [], fav: false })
type Draft = Omit<TemplateRow, 'id' | 'used' | 'updated_at' | 'body_en' | 'media_url'> & { id?: string; body_en: string; media_url: string }
type Filters = { task: string[]; goal: string[]; service: string[] }

export default function TemplatesPage() {
  const [rows, setRows] = useState<TemplateRow[] | null>(null)
  const [error, setError] = useState('')
  const [q, setQ] = useState('')
  const [kinds, setKinds] = useState<TemplateKind[]>([])
  const [favOnly, setFavOnly] = useState(false)
  const [f, setF] = useState<Filters>({ task: [], goal: [], service: [] })
  const [edit, setEdit] = useState<Draft | null>(null)
  const [sheet, setSheet] = useState(false)
  const [sort, setSort] = useState<'new' | 'top'>('new')
  const [stats, setStats] = useState<Record<string, TemplateStat>>({})
  const viewed = useRef(new Set<string>())

  const load = () =>
    supabase.from('templates').select('*').order('updated_at', { ascending: false })
      .then(({ data, error: e }) => (e ? setError('Не удалось загрузить шаблоны') : setRows((data ?? []) as TemplateRow[])))
  const loadStats = () =>
    supabase.rpc('analytics_templates').then(({ data }) => {
      const m: Record<string, TemplateStat> = {}
      for (const r of (data ?? []) as { template_id: string; views: number; uses: number; funnels: number; broadcasts: number }[]) m[r.template_id] = { views: +r.views, uses: +r.uses, funnels: +r.funnels, broadcasts: +r.broadcasts }
      setStats(m)
    })
  useEffect(() => { void load(); void loadStats() }, [])
  // Просмотр шаблона (открыли карточку) попадает в «Аналитику»; один раз за посещение страницы
  const openTpl = (t: TemplateRow) => {
    setEdit({ ...t, body_en: t.body_en ?? '', media_url: t.media_url ?? '' })
    if (!viewed.current.has(t.id)) { viewed.current.add(t.id); supabase.from('template_events').insert({ template_id: t.id, kind: 'view' }).then(() => undefined) }
  }
  const rating = useMemo(() => {
    const ids = (rows ?? []).map((t) => t.id)
    const r = ratings(ids.map((id) => (stats[id] ? popularityScore(stats[id]!) : 0)))
    return Object.fromEntries(ids.map((id, i) => [id, r[i]!]))
  }, [rows, stats])

  const list = useMemo(() => [...(rows ?? [])].sort((a, b) => (sort === 'top' ? (rating[b.id]?.pct ?? 0) - (rating[a.id]?.pct ?? 0) || b.used - a.used : 0)).filter((t) =>
    (!kinds.length || kinds.includes(pickKind(t.kind))) && (!favOnly || t.fav)
    && (!f.task.length || f.task.includes(t.task)) && (!f.goal.length || f.goal.includes(t.goal))
    && (!f.service.length || t.services.some((s) => f.service.includes(s)))
    && (!q.trim() || `${t.title} ${t.body}`.toLowerCase().includes(q.trim().toLowerCase()))), [rows, kinds, favOnly, f, q, sort, rating])
  const nf = f.task.length + f.goal.length + f.service.length
  const reset = () => { setF({ task: [], goal: [], service: [] }); setKinds([]); setFavOnly(false); setQ('') }

  const toggleFav = async (t: TemplateRow) => {
    setRows((r) => r && r.map((x) => (x.id === t.id ? { ...x, fav: !x.fav } : x)))
    const { error: e } = await supabase.from('templates').update({ fav: !t.fav }).eq('id', t.id)
    if (e) { setError('Не удалось изменить избранное'); void load() }
  }

  const save = async (d: Draft) => {
    const row = { kind: d.kind, title: d.title.trim(), body: d.body, body_en: d.body_en.trim() || null, media_url: d.media_url.trim() || null, task: d.task, goal: d.goal, services: d.services, fav: d.fav }
    const r = d.id ? await supabase.from('templates').update(row).eq('id', d.id) : await supabase.from('templates').insert(row)
    if (r.error) return setError('Не удалось сохранить шаблон')
    setError(''); setEdit(null); await load()
  }
  const remove = async (d: Draft) => {
    if (!d.id || !confirm(`Удалить шаблон «${d.title}»?`)) return
    const { error: e } = await supabase.from('templates').delete().eq('id', d.id)
    if (e) return setError('Не удалось удалить шаблон')
    setEdit(null); await load()
  }
  const copy = async (d: Draft) => {
    const { error: e } = await supabase.from('templates').insert({ kind: d.kind, title: `${d.title} (копия)`, body: d.body, body_en: d.body_en || null, media_url: d.media_url || null, task: d.task, goal: d.goal, services: d.services })
    if (e) return setError('Не удалось создать копию')
    setEdit(null); await load()
  }

  const group = (k: keyof Filters, title: string, opts: string[]) => (
    <div key={k}>
      <div className="h2">{title}</div>
      <div className="chips">{opts.map((o) => {
        const n = (rows ?? []).filter((t) => (k === 'service' ? t.services.includes(o) : t[k] === o)).length
        const on = f[k].includes(o)
        return <button key={o} className={on ? 'on' : ''} onClick={() => setF({ ...f, [k]: on ? f[k].filter((x) => x !== o) : [...f[k], o] })}>{o} <small>{n}</small></button>
      })}</div>
    </div>
  )
  const filters = <>{group('task', 'Задача', TPL_TASKS)}{group('goal', 'Цель', TPL_GOALS)}{group('service', 'Услуга', TPL_SERVICES)}</>

  return (
    <div className="wrap tpl">
      <h1 className="h1">Шаблоны <span className="chip">{rows?.length ?? '…'}</span><span className="sp" /><button className="btn primary" onClick={() => setEdit(blank())}><Icon name="plus" size={18} />Новый шаблон</button></h1>
      <div className="hint">Готовые сообщения для клиентов. В воронках выбираются в блоке «Сообщение», в теме диалога вызываются командой /shablon. Переменные: {TPL_VARS.join(', ')}.</div>
      {error && <div className="err" role="alert">{error}</div>}
      <div className="tplw">
        <aside className="tfil">{filters}{(nf > 0 || kinds.length > 0 || favOnly) && <button className="btn" onClick={reset}>Сбросить фильтры</button>}</aside>
        <div className="tmain">
          <div className="tbar">
            <input type="search" className="tsearch" placeholder="Поиск шаблонов" value={q} onChange={(e) => setQ(e.target.value)} />
            <button className="btn fbtn" onClick={() => setSheet(true)}>Фильтры{nf ? ` · ${nf}` : ''}</button>
          </div>
          <div className="chips">
            <button className={!kinds.length && !favOnly ? 'on' : ''} onClick={() => { setKinds([]); setFavOnly(false) }}>Все</button>
            {PICK_KINDS.map((o) => <button key={o.value} className={kinds.includes(o.value) ? 'on' : ''} title={`Только: ${o.label}`} onClick={() => setKinds(kinds.includes(o.value) ? kinds.filter((x) => x !== o.value) : [...kinds, o.value])}>{o.icon && <Icon name={o.icon} size={16} />}{o.label} <small>{(rows ?? []).filter((t) => pickKind(t.kind) === o.value).length}</small></button>)}
            <button className={favOnly ? 'on' : ''} onClick={() => setFavOnly(!favOnly)}><Icon name="star" size={16} fill={favOnly} />Избранное</button>
            <button className={sort === 'top' ? 'on' : ''} aria-pressed={sort === 'top'} title="Сначала самые популярные" onClick={() => setSort(sort === 'top' ? 'new' : 'top')}><Icon name="chart" size={16} />Популярные</button>
          </div>
          {rows === null && !error && <div className="empty">Загрузка…</div>}
          {rows && <div className="hint">Найдено: {list.length} из {rows.length}</div>}
          {rows && rows.length === 0 && <div className="empty">Шаблонов пока нет. Нажмите «+ Новый шаблон».</div>}
          {rows && rows.length > 0 && list.length === 0 && <div className="empty">Ничего не найдено. <button className="btn" onClick={reset}>Сбросить фильтры</button></div>}
          <div className="tgrid">
            {list.map((t) => (
              <div key={t.id} className="tcard" role="button" tabIndex={0} onClick={() => openTpl(t)}
                onKeyDown={(e) => e.key === 'Enter' && openTpl(t)}>
                <div className="row"><span className="chip kindchip">{KIND_OPTIONS.find((o) => o.value === t.kind)?.icon && <Icon name={KIND_OPTIONS.find((o) => o.value === t.kind)!.icon!} size={14} />}{TPL_KINDS[t.kind]}</span>
                  {rating[t.id] && rating[t.id]!.stars > 0 && <span className="chip amber rate" title={`Рейтинг популярности ${rating[t.id]!.pct} из 100: отправки клиентам, добавления в воронки и рассылки, просмотры`}><Icon name="star" size={13} fill />{rating[t.id]!.pct}</span>}<span className="sp" />
                  <button className={`star ${t.fav ? 'on' : ''}`} aria-label="Избранное" onClick={(e) => { e.stopPropagation(); void toggleFav(t) }}><Icon name="star" size={20} fill={t.fav} /></button>
                  <button type="button" className="ibtn sm" title="Изменить" aria-label="Изменить" onClick={(e) => { e.stopPropagation(); openTpl(t) }}><Icon name="edit" size={18} /></button>
                  <button type="button" className="ibtn sm danger" title="Удалить" aria-label="Удалить" onClick={(e) => { e.stopPropagation(); void remove({ ...t, body_en: t.body_en ?? '', media_url: t.media_url ?? '' }) }}><Icon name="trash" size={18} /></button></div>
                <b>{t.title}</b>
                <div className="tex">{preview(t.body)}</div>
                <div className="chips tags"><span className="tg">{t.task}</span><span className="tg">{t.goal}</span>{t.services.map((s) => <span className="tg" key={s}>{s}</span>)}</div>
                <div className="hint">Отправлен: {stats[t.id]?.uses ?? t.used} · в воронки: {stats[t.id]?.funnels ?? 0} · в рассылки: {stats[t.id]?.broadcasts ?? 0} · {fmtDate(t.updated_at)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {edit && <Editor d={edit} onSave={save} onClose={() => setEdit(null)} onDelete={remove} onCopy={copy} />}
      {sheet && (
        <div className="ov" onClick={() => setSheet(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="mh"><b>Фильтры</b><span className="sp" /><button className="x" onClick={() => setSheet(false)} aria-label="Закрыть"><Icon name="close" size={18} /></button></div>
            <div className="mb">{filters}</div>
            <div className="mf"><button className="btn primary" style={{ flex: 1 }} onClick={() => setSheet(false)}>Показать: {list.length}</button></div>
          </div>
        </div>
      )}
    </div>
  )
}

function Editor({ d: init, onSave, onClose, onDelete, onCopy }: { d: Draft; onSave: (d: Draft) => Promise<void>; onClose: () => void; onDelete: (d: Draft) => void; onCopy: (d: Draft) => void }) {
  const [d, setD] = useState(init)
  const [busy, setBusy] = useState(false)
  const ta = useRef<HTMLTextAreaElement>(null)
  const up = (p: Partial<Draft>) => setD({ ...d, ...p })
  const insert = (v: string) => {
    const el = ta.current
    const s = el?.selectionStart ?? d.body.length
    const e = el?.selectionEnd ?? s
    up({ body: d.body.slice(0, s) + v + d.body.slice(e) })
    setTimeout(() => el?.focus(), 0)
  }
  const missing = [!d.title.trim() && 'название', d.kind === 'text' && !d.body.trim() && 'текст', d.kind !== 'text' && !d.media_url.trim() && 'файл', !d.services.length && 'услугу'].filter(Boolean) as string[]
  return (
    <div className="ov" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="mh"><b>{d.id ? 'Шаблон' : 'Новый шаблон'}</b><span className="sp" />
          <button className={`star ${d.fav ? 'on' : ''}`} onClick={() => up({ fav: !d.fav })} aria-label="Избранное"><Icon name="star" size={20} fill={d.fav} /></button>
          <button className="x" onClick={onClose} aria-label="Закрыть"><Icon name="close" size={18} /></button></div>
        <div className="mb">
          <div className="fld"><label>Что отправляем: текст, фото, видео, голос (запись или аудиофайл) или файл</label><Seg label="Тип сообщения" iconOnly value={pickKind(d.kind)} options={PICK_KINDS} onChange={(k) => up({ kind: k })} /></div>
          <div className="fld"><label>Название</label><input type="text" value={d.title} onChange={(e) => up({ title: e.target.value })} placeholder="Например, «Напоминание за час»" /></div>
          {d.kind !== 'text' && <div className="fld"><label>{d.kind === 'voice' ? 'Голосовое сообщение' : 'Файл'}</label><MediaField kind={d.kind} value={d.media_url} onChange={(url) => up({ media_url: url })} folder="templates" /></div>}
          <div className="fld"><label>{d.kind === 'text' ? 'Текст сообщения' : 'Подпись'}</label>
            <div className="chips">{TPL_VARS.map((v) => <button type="button" key={v} onClick={() => insert(v)}>{v}</button>)}</div>
            <textarea ref={ta} value={d.body} onChange={(e) => up({ body: e.target.value })} /></div>
          <div className="fld"><div className="lblrow"><label>English (необязательно)</label><TranslateButton source={d.body} target={d.body_en} onDone={(t) => up({ body_en: t })} /></div><textarea value={d.body_en} onChange={(e) => up({ body_en: e.target.value })} placeholder="Для клиентов с английским языком" /></div>
          <div className="fld"><label>Предпросмотр в Telegram</label><div className="tgprev">{preview(d.body) || '…'}</div></div>
          <div className="fld"><label>Задача</label><select value={d.task} onChange={(e) => up({ task: e.target.value })}>{TPL_TASKS.map((x) => <option key={x}>{x}</option>)}</select></div>
          <div className="fld"><label>Цель</label><select value={d.goal} onChange={(e) => up({ goal: e.target.value })}>{TPL_GOALS.map((x) => <option key={x}>{x}</option>)}</select></div>
          <div className="fld"><label>Услуги</label><div className="chips">{TPL_SERVICES.map((s) => <button type="button" key={s} className={d.services.includes(s) ? 'on' : ''} onClick={() => up({ services: d.services.includes(s) ? d.services.filter((x) => x !== s) : [...d.services, s] })}>{s}</button>)}</div></div>
        </div>
        <div className="mf">
          {d.id && <button className="btn danger" onClick={() => onDelete(d)}>Удалить</button>}
          {d.id && <button className="btn" onClick={() => onCopy(d)}>Дублировать</button>}
          <span className="sp" />
          <button className="btn primary" disabled={busy || missing.length > 0} title={missing.length ? `Заполните: ${missing.join(', ')}` : ''}
            onClick={async () => { setBusy(true); await onSave(d); setBusy(false) }}>Сохранить</button>
        </div>
      </div>
    </div>
  )
}

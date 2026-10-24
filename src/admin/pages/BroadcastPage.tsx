import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../supabase'
import { callApi } from '../api'
import { INTERESTS, SERVICES, clientTitle, fmtDate } from '../types'
import { BackLink } from '../ui/BackLink'
import { MediaField } from '../ui/MediaField'
import { TranslateButton } from '../ui/TranslateButton'
import { PICK_KINDS, Seg, pickKind } from '../ui/Seg'
import { BROADCAST_STATUS, MEDIA_CAPTION_LIMIT, validateBroadcast, type BroadcastRow, type Segment } from '../../../server/broadcasts'
import { TPL_VARS, fillTemplate, type TemplateKind, type TemplateRow } from '../../../server/templates'
import { STATUS_CHIP } from './BroadcastsPage'

type Draft = { title: string; kind: TemplateKind; body: string; body_en: string; media_url: string; segment: Segment; when: 'now' | 'later'; at: string }
const toLocalInput = (iso: string | null) => { if (!iso) return ''; const d = new Date(iso); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16) }
const fromRow = (b: BroadcastRow): Draft => ({ title: b.title, kind: b.kind, body: b.body, body_en: b.body_en ?? '', media_url: b.media_url ?? '', segment: b.segment ?? {}, when: b.scheduled_at ? 'later' : 'now', at: toLocalInput(b.scheduled_at) })
const SAMPLE = { name: 'Анна', tg_username: 'anna', company: 'Студия «Лето»' }

export default function BroadcastPage() {
  const { id } = useParams()
  const nav = useNavigate()
  const [b, setB] = useState<BroadcastRow | null>(null)
  const [d, setD] = useState<Draft | null>(null)
  const [tags, setTags] = useState<string[]>([])
  const [templates, setTemplates] = useState<TemplateRow[]>([])
  const [count, setCount] = useState<{ count: number; reachable: number } | null>(null)
  const [failed, setFailed] = useState<{ name: string; error: string }[]>([])
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    if (!id) return
    const { data, error: e } = await supabase.from('broadcasts').select('*').eq('id', id).maybeSingle()
    if (e || !data) return setError('Рассылка не найдена')
    const row = data as BroadcastRow
    setB(row)
    setD((cur) => cur ?? fromRow(row))
  }, [id])

  useEffect(() => { void load() }, [load])
  useEffect(() => {
    supabase.from('tags').select('name').order('name').then(({ data }) => setTags((data ?? []).map((t) => t.name as string)))
    supabase.from('templates').select('*').order('title').then(({ data }) => setTemplates((data ?? []) as TemplateRow[]))
  }, [])

  // Пока рассылка идёт, обновляем ход отправки
  useEffect(() => {
    if (!b || (b.status !== 'scheduled' && b.status !== 'sending')) return
    const t = window.setInterval(() => { void supabase.from('broadcasts').select('*').eq('id', b.id).maybeSingle().then(({ data }) => data && setB(data as BroadcastRow)) }, 5000)
    return () => window.clearInterval(t)
  }, [b])

  useEffect(() => {
    if (!b || b.status === 'draft') return
    supabase.from('broadcast_recipients').select('error, clients(name, tg_username)').eq('broadcast_id', b.id).eq('status', 'failed').limit(50)
      .then(({ data }) => setFailed(((data ?? []) as unknown as { error: string | null; clients: { name: string | null; tg_username: string | null } | null }[]).map((r) => ({ name: r.clients ? clientTitle({ name: r.clients.name, tg_username: r.clients.tg_username } as never) : '—', error: r.error ?? '' }))))
  }, [b?.status, b?.failed]) // eslint-disable-line react-hooks/exhaustive-deps

  // Сколько клиентов попадёт в сегмент (с задержкой после правок)
  const segKey = JSON.stringify(d?.segment ?? {})
  useEffect(() => {
    if (!b || b.status !== 'draft') return
    const t = window.setTimeout(() => { void callApi<{ count: number; reachable: number }>('/api/broadcast', { action: 'count', segment: JSON.parse(segKey) }).then((r) => r.ok && setCount(r.data)) }, 400)
    return () => window.clearTimeout(t)
  }, [segKey, b?.status]) // eslint-disable-line react-hooks/exhaustive-deps

  if (error && !b) return <div className="wrap"><BackLink to="/broadcasts">Рассылки</BackLink><div className="err">{error}</div></div>
  if (!b || !d) return <div className="empty">Загрузка…</div>

  const up = (p: Partial<Draft>) => setD({ ...d, ...p })
  const seg = (p: Partial<Segment>) => up({ segment: { ...d.segment, ...p } })
  const toggle = (k: 'services' | 'interests' | 'tags', v: string) => { const cur = d.segment[k] ?? []; seg({ [k]: cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v] }) }
  const draft = b.status === 'draft'
  const problem = validateBroadcast({ title: d.title, kind: d.kind, body: d.body, body_en: d.body_en, media_url: d.media_url })
  const when = d.when === 'later' && d.at ? new Date(d.at).toISOString() : null
  const needTime = d.when === 'later' && !d.at

  const persist = async () => {
    const { error: e } = await supabase.from('broadcasts').update({ title: d.title.trim(), kind: d.kind, body: d.body, body_en: d.body_en.trim() || null, media_url: d.media_url.trim() || null, segment: d.segment, scheduled_at: when }).eq('id', b.id)
    if (e) { setError('Не удалось сохранить'); return false }
    setError('')
    return true
  }
  const save = async () => { setBusy(true); if (await persist()) { setInfo('Черновик сохранён'); await load() } setBusy(false) }
  const start = async () => {
    const n = count?.count ?? 0
    if (!confirm(`Отправить рассылку «${d.title}» ${n} клиентам${when ? ` на ${fmtDate(when)}` : ' сейчас'}? Остановить можно, но уже отправленное не вернуть.`)) return
    setBusy(true)
    setInfo('')
    if (await persist()) {
      const r = await callApi('/api/broadcast', { action: 'start', id: b.id })
      if (!r.ok) setError(r.error); else { setError(''); setD(null); await load() }
    }
    setBusy(false)
  }
  const cancel = async () => {
    if (!confirm('Остановить рассылку? Неотправленные сообщения не уйдут.')) return
    setBusy(true)
    const r = await callApi('/api/broadcast', { action: 'cancel', id: b.id })
    if (!r.ok) setError(r.error); else { setError(''); await load() }
    setBusy(false)
  }
  const remove = async () => {
    if (!confirm(`Удалить рассылку «${b.title}»?`)) return
    const { error: e } = await supabase.from('broadcasts').delete().eq('id', b.id)
    if (e) setError('Не удалось удалить'); else nav('/broadcasts')
  }
  const fromTemplate = (tid: string) => {
    const t = templates.find((x) => x.id === tid)
    if (t) {
      up({ kind: t.kind, body: t.body, body_en: t.body_en ?? '', media_url: t.media_url ?? '' })
      supabase.from('template_events').insert({ template_id: t.id, kind: 'broadcast' }).then(() => undefined) // попадает в «Аналитику»
    }
  }
  const pct = b.total ? Math.round(((b.sent + b.failed) / b.total) * 100) : 0

  return (
    <div className="wrap">
      <BackLink to="/broadcasts">Рассылки</BackLink>
      <h1 className="h1">{b.title}<span className={`chip ${STATUS_CHIP[b.status]}`}>{BROADCAST_STATUS[b.status]}</span></h1>
      {error && <div className="err" role="alert">{error}</div>}
      {info && <div className="hint" role="status">{info}</div>}

      {!draft && (
        <div className="card">
          <h3>Ход отправки</h3>
          <div className="progress" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}><i style={{ width: `${pct}%` }} /></div>
          <div className="hint">Отправлено {b.sent} из {b.total}{b.failed ? `, не доставлено ${b.failed}` : ''}{b.scheduled_at && b.status === 'scheduled' ? ` · старт ${fmtDate(b.scheduled_at)}` : ''}{b.finished_at ? ` · завершена ${fmtDate(b.finished_at)}` : ''}</div>
          {failed.length > 0 && <ul className="faillist">{failed.map((f, i) => <li key={i}><b>{f.name}</b>: {f.error}</li>)}</ul>}
          {(b.status === 'scheduled' || b.status === 'sending') && <div className="row" style={{ marginTop: 10 }}><button className="btn danger" onClick={cancel} disabled={busy}>Остановить рассылку</button></div>}
        </div>
      )}

      <div className="card">
        <h3>Сообщение</h3>
        <fieldset className="plain" disabled={!draft}>
          <div className="fld"><label>Название (видно только вам)</label><input value={d.title} onChange={(e) => up({ title: e.target.value })} /></div>
          {draft && templates.length > 0 && (
            <div className="fld"><label>Взять из шаблона</label>
              <select value="" onChange={(e) => fromTemplate(e.target.value)} aria-label="Шаблон"><option value="">Выберите шаблон…</option>{templates.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}</select></div>
          )}
          <Seg label="Тип сообщения" iconOnly value={pickKind(d.kind)} options={PICK_KINDS} onChange={(k) => up({ kind: k })} />
          {d.kind !== 'text' && <div className="fld"><label>{d.kind === 'voice' ? 'Голосовое сообщение' : 'Файл'}</label><MediaField kind={d.kind} value={d.media_url} onChange={(url) => up({ media_url: url })} folder="broadcasts" /></div>}
          <div className="fld"><label>{d.kind === 'text' ? 'Текст' : 'Подпись'}{d.kind !== 'text' ? ` (до ${MEDIA_CAPTION_LIMIT} знаков)` : ''}</label>
            <div className="chips">{TPL_VARS.map((v) => <button type="button" key={v} onClick={() => up({ body: `${d.body}${v}` })}>{v}</button>)}</div>
            <textarea value={d.body} onChange={(e) => up({ body: e.target.value })} /></div>
          <div className="fld"><div className="lblrow"><label>English (необязательно, для клиентов с английским)</label>{draft && <TranslateButton source={d.body} target={d.body_en} onDone={(t) => up({ body_en: t })} />}</div><textarea value={d.body_en} onChange={(e) => up({ body_en: e.target.value })} /></div>
        </fieldset>
        <div className="fld"><label>Предпросмотр в Telegram</label><div className="tgprev">{fillTemplate(d.body, SAMPLE) || '…'}<div className="hint">Отписаться: /stop</div></div></div>
      </div>

      <div className="card">
        <h3>Кому отправить</h3>
        <fieldset className="plain" disabled={!draft}>
          <div className="fld"><label>Услуга из заявок (любая из выбранных)</label>
            <div className="chips">{Object.entries(SERVICES).map(([k, l]) => <button type="button" key={k} className={d.segment.services?.includes(k) ? 'on' : ''} aria-pressed={!!d.segment.services?.includes(k)} onClick={() => toggle('services', k)}>{l}</button>)}</div></div>
          <div className="fld"><label>Интересы из заявок (группа: любой из выбранных)</label>
            <div className="chips">{Object.entries(INTERESTS).map(([k, l]) => <button type="button" key={k} className={d.segment.interests?.includes(k) ? 'on' : ''} aria-pressed={!!d.segment.interests?.includes(k)} onClick={() => toggle('interests', k)}>{l}</button>)}</div></div>
          {tags.length > 0 && <div className="fld"><label>Теги клиента (любой из выбранных)</label>
            <div className="chips">{tags.map((t) => <button type="button" key={t} className={d.segment.tags?.includes(t) ? 'on' : ''} aria-pressed={!!d.segment.tags?.includes(t)} onClick={() => toggle('tags', t)}>{t}</button>)}</div></div>}
          <div className="fld"><label>Язык клиента</label>
            <Seg label="Язык" value={d.segment.language ?? ''} options={[{ value: '', label: 'Все', icon: 'globe' }, { value: 'ru', label: 'Русский' }, { value: 'en', label: 'English' }]} onChange={(k) => seg({ language: k })} /></div>
        </fieldset>
        {draft && <div className="hint" role="status">{count ? <>Получат <b>{count.count}</b> из {count.reachable} клиентов, которые согласились на рассылки.</> : 'Считаю получателей…'}</div>}
        {!draft && <div className="hint">Получателей на момент запуска: {b.total}.</div>}
      </div>

      {draft && (
        <div className="card">
          <h3>Когда отправить</h3>
          <Seg label="Время отправки" value={d.when} options={[{ value: 'now', label: 'Сразу', icon: 'bolt' }, { value: 'later', label: 'В выбранное время', icon: 'clock' }]} onChange={(k) => up({ when: k })} />
          {d.when === 'later' && <div className="fld" style={{ marginTop: 8 }}><label>Дата и время (по времени вашего устройства)</label><input type="datetime-local" value={d.at} onChange={(e) => up({ at: e.target.value })} /></div>}
          <div className="hint" style={{ marginTop: 8 }}>Плановые рассылки уходят в течение минуты после назначенного времени, по ~25 сообщений в секунду.</div>
        </div>
      )}

      {draft && (
        <div className="row formbtns">
          <button className="btn danger" onClick={remove} disabled={busy}>Удалить</button><span className="sp" />
          <button className="btn" onClick={save} disabled={busy}>Сохранить черновик</button>
          <button className="btn primary" onClick={start} disabled={busy || !!problem || needTime || !count?.count} title={problem || (needTime ? 'Укажите дату и время' : !count?.count ? 'В сегменте нет получателей' : '')}>{d.when === 'later' ? 'Запланировать' : 'Отправить'}</button>
        </div>
      )}
      {draft && (problem || needTime) && <div className="hint">{problem || 'Укажите дату и время отправки.'}</div>}
      {!draft && b.status !== 'sending' && b.status !== 'scheduled' && <div className="row"><button className="btn danger" onClick={remove}>Удалить рассылку</button></div>}
    </div>
  )
}

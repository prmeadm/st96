import { useEffect, useMemo, useState } from 'react'
import { MonthGrid, shiftMonth } from '../booking/MonthGrid'
import { POLICY_PATH } from '../data/privacy'

type Lang = 'ru' | 'en'
type Cfg = { services: { key: string; ru: string; en: string; minutes: number }[]; formats: { key: string; ru: string; en: string }[]; offlineDays: number[]; today: string; horizon: number }
type Slot = { t: string; free: boolean }

const T = {
  ru: {
    title: 'Запись на встречу', sub: 'Выберите услугу, формат и удобное время. Мы подтвердим встречу и напишем вам.',
    service: 'Услуга', format: 'Формат встречи', date: 'Дата', time: 'Время', pickService: 'Сначала выберите услугу', noSlots: 'На этот день свободного времени нет',
    contacts: 'Ваши контакты', name: 'Имя', phone: 'Телефон', telegram: 'Telegram', company: 'Компания', goal: 'Цель встречи', comment: 'Комментарий',
    contactHint: 'Достаточно телефона или Telegram', consentPre: 'Согласен на обработку персональных данных:', consentLink: 'политика конфиденциальности',
    send: 'Отправить заявку', sending: 'Отправляю…', missing: 'Заполните', mService: 'услугу', mFormat: 'формат', mDate: 'дату', mTime: 'время', mName: 'имя', mContact: 'телефон или Telegram', mConsent: 'согласие',
    doneTitle: 'Заявка отправлена', doneText: 'Мы подтвердим время и напишем вам. Чтобы получить подтверждение сразу в Telegram и быстро связаться с менеджером, откройте нашего бота.',
    openTg: 'Перейти в Telegram', again: 'Новая запись', when: 'Когда', offline: 'Офлайн-встречи проходят по дням', video: 'Ссылку на видеозвонок пришлём после подтверждения.', min: 'мин', err: 'Не удалось отправить. Попробуйте ещё раз.',
    dows: ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'], minsk: 'время по Минску',
  },
  en: {
    title: 'Book a meeting', sub: 'Pick a service, format and a convenient time. We will confirm the meeting and message you.',
    service: 'Service', format: 'Meeting format', date: 'Date', time: 'Time', pickService: 'Choose a service first', noSlots: 'No free time on this day',
    contacts: 'Your contacts', name: 'Name', phone: 'Phone', telegram: 'Telegram', company: 'Company', goal: 'Meeting goal', comment: 'Comment',
    contactHint: 'A phone or Telegram is enough', consentPre: 'I agree to the processing of personal data:', consentLink: 'privacy policy',
    send: 'Send request', sending: 'Sending…', missing: 'Please fill in', mService: 'service', mFormat: 'format', mDate: 'date', mTime: 'time', mName: 'name', mContact: 'phone or Telegram', mConsent: 'consent',
    doneTitle: 'Request sent', doneText: 'We will confirm the time and message you. To get the confirmation right in Telegram and reach a manager faster, open our bot.',
    openTg: 'Open Telegram', again: 'New booking', when: 'When', offline: 'In-person meetings take place on', video: 'We will send the video call link after confirmation.', min: 'min', err: 'Could not send. Please try again.',
    dows: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], minsk: 'Minsk time',
  },
} as const

const BOT = 'st96_leads_bot'
const qs = new URLSearchParams(location.search)
const api = async <R,>(body: Record<string, unknown>): Promise<R & { error?: string }> => {
  const r = await fetch('/api/booking', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  return (await r.json().catch(() => ({ error: 'bad response' }))) as R & { error?: string }
}

export default function BookPage() {
  const [lang, setLang] = useState<Lang>(() => (qs.get('lang') ?? navigator.language).toLowerCase().startsWith('en') ? 'en' : 'ru')
  const t = T[lang]
  const [cfg, setCfg] = useState<Cfg | null>(null)
  const [service, setService] = useState(qs.get('s') ?? '')
  const [format, setFormat] = useState(qs.get('f') ?? '')
  const [month, setMonth] = useState('')
  const [days, setDays] = useState<Record<string, { free: number; why?: string }>>({})
  const [date, setDate] = useState('')
  const [slots, setSlots] = useState<Slot[] | null>(null)
  const [time, setTime] = useState('')
  const [f, setF] = useState({ name: '', phone: '', telegram: '', company: '', goal: '', comment: '', website: '' })
  const [consent, setConsent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState<{ ref: string; starts_at: string } | null>(null)

  useEffect(() => { void api<Cfg>({ action: 'config' }).then((c) => { if (!c.error) { setCfg(c); setMonth(c.today.slice(0, 7)) } }) }, [])
  useEffect(() => { document.documentElement.lang = lang; document.title = `${t.title} — ST96` }, [lang, t.title])

  useEffect(() => {
    if (!service || !month) return
    let alive = true
    void api<{ days: typeof days }>({ action: 'month', service, format, month }).then((r) => alive && r.days && setDays(r.days))
    return () => { alive = false }
  }, [service, format, month])
  useEffect(() => {
    if (!service || !date) return setSlots(null)
    let alive = true
    void api<{ slots: Slot[] }>({ action: 'day', service, format, date }).then((r) => alive && setSlots(r.slots ?? []))
    return () => { alive = false }
  }, [service, format, date])

  const svc = cfg?.services.find((s) => s.key === service)
  const missing = useMemo(() => [!service && t.mService, !format && t.mFormat, !date && t.mDate, !time && t.mTime, !f.name.trim() && t.mName, !f.phone.trim() && !f.telegram.trim() && t.mContact, !consent && t.mConsent].filter(Boolean) as string[], [service, format, date, time, f, consent, t])
  const dateLabel = (iso: string) => new Date(iso).toLocaleString(lang === 'en' ? 'en-GB' : 'ru-RU', { timeZone: 'Europe/Minsk', day: 'numeric', month: 'long', weekday: 'short', hour: '2-digit', minute: '2-digit' })

  const submit = async () => {
    setBusy(true)
    setError('')
    const r = await api<{ ok?: boolean; ref?: string; starts_at?: string }>({ action: 'create', service, format, date, time, ...f, clientId: qs.get('c') ?? undefined, runId: qs.get('r') ?? undefined, runNode: qs.get('n') ?? undefined })
    setBusy(false)
    if (r.ok) setDone({ ref: r.ref ?? '', starts_at: r.starts_at ?? '' })
    else {
      setError(r.error ?? t.err)
      if (date) { setSlots(null); void api<{ slots: Slot[] }>({ action: 'day', service, format, date }).then((x) => setSlots(x.slots ?? [])); setTime('') }
    }
  }
  const reset = () => { setDone(null); setDate(''); setTime(''); setConsent(false); setF({ name: '', phone: '', telegram: '', company: '', goal: '', comment: '', website: '' }) }
  const input = (k: keyof typeof f, label: string, extra: Partial<React.InputHTMLAttributes<HTMLInputElement>> = {}) => (
    <label className="bk-fld"><span>{label}</span><input value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} {...extra} /></label>
  )

  return (
    <div className="bk">
      <header className="bk-top">
        <a className="bk-logo" href="/" aria-label="ST96">ST<span>96</span></a>
        <div className="bk-lang" role="group" aria-label="Language">
          {(['ru', 'en'] as Lang[]).map((l) => <button key={l} type="button" className={lang === l ? 'on' : ''} onClick={() => setLang(l)} aria-pressed={lang === l}>{l.toUpperCase()}</button>)}
        </div>
      </header>
      <main className="bk-main">
        <h1>{t.title}</h1>
        <p className="bk-sub">{t.sub}</p>

        {done ? (
          <div className="bk-card bk-done" role="status">
            <div className="bk-check" aria-hidden="true">✓</div>
            <h2>{t.doneTitle}</h2>
            {done.starts_at && <p><b>{t.when}:</b> {dateLabel(done.starts_at)} ({t.minsk})</p>}
            <p className="bk-dim">{t.doneText}</p>
            <a className="bk-btn" target="_blank" rel="noreferrer" href={`https://t.me/${BOT}?start=${done.ref ? `site_${done.ref}` : 'site'}`}>{t.openTg}</a>
            <button type="button" className="bk-link" onClick={reset}>{t.again}</button>
          </div>
        ) : (
          <>
            <section className="bk-card">
              <h2>{t.service}</h2>
              <div className="bk-chips">{cfg?.services.map((s) => <button key={s.key} type="button" className={service === s.key ? 'on' : ''} aria-pressed={service === s.key} onClick={() => { setService(s.key); setTime('') }}>{s[lang]}<small>{s.minutes} {t.min}</small></button>)}</div>
              <h2>{t.format}</h2>
              <div className="bk-chips">{cfg?.formats.map((x) => <button key={x.key} type="button" className={format === x.key ? 'on' : ''} aria-pressed={format === x.key} onClick={() => { setFormat(x.key); setDate(''); setTime('') }}>{x[lang]}</button>)}</div>
              {format === 'offline' && cfg && <p className="bk-dim">{t.offline}: {cfg.offlineDays.map((i) => t.dows[i]).join(', ')}.</p>}
              {format === 'video' && <p className="bk-dim">{t.video}</p>}
            </section>

            <section className="bk-card">
              <h2>{t.date}</h2>
              {!service || !month ? <p className="bk-dim">{t.pickService}</p> : (
                <MonthGrid lang={lang} month={month} onMonth={(m) => { setMonth(m); setDays({}) }} selected={date}
                  cell={(d) => { const x = days[d]; const ok = !!x && x.free > 0; return { disabled: !ok, cls: ok ? 'open' : 'dis', title: x?.why } }}
                  onPick={(d) => { setDate(d); setTime(''); if (d.slice(0, 7) !== month) setMonth(d.slice(0, 7)) }} />
              )}
              {date && slots && (
                <>
                  <h2>{t.time} <small className="bk-dim">{t.minsk}</small></h2>
                  <div className="bk-slots">
                    {slots.filter((s) => s.free).map((s) => <button key={s.t} type="button" className={time === s.t ? 'on' : ''} aria-pressed={time === s.t} onClick={() => setTime(s.t)}>{s.t}</button>)}
                    {!slots.some((s) => s.free) && <p className="bk-dim">{t.noSlots}</p>}
                  </div>
                </>
              )}
              {svc && <p className="bk-dim">{svc[lang]} · {svc.minutes} {t.min}</p>}
            </section>

            <section className="bk-card">
              <h2>{t.contacts}</h2>
              <div className="bk-grid">
                {input('name', `${t.name} *`, { autoComplete: 'name' })}
                {input('company', t.company, { autoComplete: 'organization' })}
                {input('phone', t.phone, { type: 'tel', inputMode: 'tel', autoComplete: 'tel', placeholder: '+375 29 000-00-00' })}
                {input('telegram', t.telegram, { autoCapitalize: 'none', placeholder: '@username' })}
              </div>
              <p className="bk-dim">{t.contactHint}</p>
              {input('goal', t.goal)}
              <label className="bk-fld"><span>{t.comment}</span><textarea rows={3} value={f.comment} onChange={(e) => setF({ ...f, comment: e.target.value })} /></label>
              <input className="bk-hp" tabIndex={-1} autoComplete="off" aria-hidden="true" value={f.website} onChange={(e) => setF({ ...f, website: e.target.value })} />
              <label className="bk-check-row"><input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} /><span>{t.consentPre} <a href={POLICY_PATH} target="_blank" rel="noreferrer">{t.consentLink}</a></span></label>
              {error && <p className="bk-err" role="alert">{error}</p>}
              {missing.length > 0 && <p className="bk-dim">{t.missing}: {missing.join(', ')}</p>}
              <button type="button" className="bk-btn" disabled={busy || missing.length > 0} onClick={submit}>{busy ? t.sending : t.send}</button>
            </section>
          </>
        )}
      </main>
    </div>
  )
}
export { shiftMonth }

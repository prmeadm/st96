import { SERVICE_OPTIONS } from '../data/serviceOptions'
import { BOOKING_GOALS } from '../data/bookingGoals'
import { PhoneField } from '../components/ui/PhoneField'
import { useEffect, useMemo, useRef, useState } from 'react'
import { MonthGrid, shiftMonth } from '../booking/MonthGrid'
import { POLICY_PATH } from '../data/privacy'

type Lang = 'ru' | 'en'
type Cfg = { services: { key: string; ru: string; en: string; infoRu: string; infoEn: string; url: string; urlEn: string; minutes: number }[]; formats: { key: string; ru: string; en: string }[]; offlineDays: number[]; today: string; horizon: number; month?: string; days?: Record<string, { free: number; why?: string }> }
type Slot = { t: string; free: boolean }

const T = {
  ru: {
    title: 'Запись на встречу', sub: 'Выберите услугу, формат и удобное время. Мы подтвердим встречу и напишем вам.',
    service: 'Услуга', format: 'Формат встречи', date: 'Дата', time: 'Время', noSlots: 'На этот день свободного времени нет',
    contacts: 'Ваши контакты', name: 'Имя', phone: 'Телефон', telegram: 'Telegram', company: 'Компания', goal: 'Цель встречи', comment: 'Сообщение', commentPh: 'Кратко о задаче, сроках, бюджете', topics: 'Что именно нужно', pickNeeded: 'Выберите нужные вам',
    contactHint: 'Достаточно телефона или Telegram', consentPre: 'Согласен на обработку персональных данных:', consentLink: 'политика конфиденциальности',
    send: 'Отправить заявку', sending: 'Отправляю…', missing: 'Заполните', mService: 'услугу', mFormat: 'формат', mDate: 'дату', mTime: 'время', mName: 'имя', mContact: 'телефон или Telegram', mConsent: 'согласие',
    doneTitle: 'Заявка отправлена', doneText: 'Мы подтвердим время и напишем вам. Чтобы получить подтверждение сразу в Telegram и быстро связаться с менеджером, откройте нашего бота.',
    openTg: 'Перейти в Telegram', again: 'Новая запись', when: 'Когда', offline: 'Офлайн-встречи проходят по дням', video: 'Ссылку на видеозвонок пришлём после подтверждения.', min: 'мин', loadingDays: 'Загружаем свободное время…', goalPick: 'Выберите цель встречи', tgBtn: 'Из Telegram', tgWaiting: 'Жду…', tgBtnHint: 'Подставить ник из вашего Telegram', tgOpen: 'Откройте Telegram и нажмите «Запустить» у бота. Ник подставится сам.', tgDone: 'Ник подставлен из Telegram.', tgNoName: 'В вашем Telegram нет публичного ника: задайте его в настройках Telegram или укажите телефон.', tgTimeout: 'Не дождались ответа. Попробуйте ещё раз или впишите ник вручную.', prefilled: 'Мы подставили контакты, которые вы оставляли в заявке. Проверьте и при необходимости исправьте.', pickDay: 'Выберите день: у каждого дня своё свободное время.', freeSlots: 'свободных времён', duration: 'Длительность встречи', more: 'Подробнее на сайте', err: 'Не удалось отправить. Попробуйте ещё раз.',
    dows: ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'], minsk: 'время по Минску',
  },
  en: {
    title: 'Book a meeting', sub: 'Pick a service, format and a convenient time. We will confirm the meeting and message you.',
    service: 'Service', format: 'Meeting format', date: 'Date', time: 'Time', noSlots: 'No free time on this day',
    contacts: 'Your contacts', name: 'Name', phone: 'Phone', telegram: 'Telegram', company: 'Company', goal: 'Meeting goal', comment: 'Message', commentPh: 'Briefly: task, timing, budget', topics: 'What exactly do you need', pickNeeded: 'Pick the ones you need',
    contactHint: 'A phone or Telegram is enough', consentPre: 'I agree to the processing of personal data:', consentLink: 'privacy policy',
    send: 'Send request', sending: 'Sending…', missing: 'Please fill in', mService: 'service', mFormat: 'format', mDate: 'date', mTime: 'time', mName: 'name', mContact: 'phone or Telegram', mConsent: 'consent',
    doneTitle: 'Request sent', doneText: 'We will confirm the time and message you. To get the confirmation right in Telegram and reach a manager faster, open our bot.',
    openTg: 'Open Telegram', again: 'New booking', when: 'When', offline: 'In-person meetings take place on', video: 'We will send the video call link after confirmation.', min: 'min', loadingDays: 'Loading free times…', goalPick: 'Choose the goal of the meeting', tgBtn: 'From Telegram', tgWaiting: 'Waiting…', tgBtnHint: 'Fill in your Telegram username', tgOpen: 'Open Telegram and tap Start in the bot. Your username will be filled in automatically.', tgDone: 'Username filled in from Telegram.', tgNoName: 'Your Telegram has no public username: set one in Telegram settings or enter your phone.', tgTimeout: 'No answer received. Try again or type the username manually.', prefilled: 'We filled in the contacts you left in your request. Please check and edit if needed.', pickDay: 'Pick a day: every day has its own free times.', freeSlots: 'free times', duration: 'Meeting length', more: 'More on the site', err: 'Could not send. Please try again.',
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
  const [topics, setTopics] = useState<string[]>([])
  const [consent, setConsent] = useState(true) // по просьбе владельца отмечен заранее; клиент может снять
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState<{ ref: string; starts_at: string } | null>(null)

  // Один запрос при открытии: настройки и календарь текущего месяца сразу (раньше два запроса подряд)
  const loaded = useRef('')
  const [daysBusy, setDaysBusy] = useState(true)
  useEffect(() => {
    void api<Cfg>({ action: 'init', format: qs.get('f') ?? '' }).then((c) => {
      if (c.error) return setDaysBusy(false)
      setCfg(c)
      const m = c.month ?? c.today.slice(0, 7)
      loaded.current = `${m}|${format}`
      setMonth(m)
      if (c.days) setDays(c.days)
      setDaysBusy(false)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  // Контакты из карточки клиента по личной ссылке: клиент уже оставлял их в заявке
  const [prefilled, setPrefilled] = useState(false)
  useEffect(() => {
    const id = qs.get('c')
    if (!id) return
    void api<{ client: { name: string; company: string; phone: string; telegram: string } | null }>({ action: 'client', id }).then((r) => {
      const c = r.client
      if (!c) return
      setF((x) => ({ ...x, name: x.name || c.name, company: x.company || c.company, phone: x.phone || c.phone, telegram: x.telegram || c.telegram }))
      setPrefilled(!!(c.name || c.phone || c.telegram))
    })
  }, [])
  useEffect(() => { document.documentElement.lang = lang; document.title = `${t.title} — ST96` }, [lang, t.title])

  useEffect(() => {
    if (!month || loaded.current === `${month}|${format}`) return
    let alive = true
    setDaysBusy(true)
    void api<{ days: typeof days }>({ action: 'month', format, month }).then((r) => { if (!alive) return; if (r.days) setDays(r.days); loaded.current = `${month}|${format}`; setDaysBusy(false) })
    return () => { alive = false }
  }, [format, month])
  useEffect(() => {
    if (!date) return setSlots(null)
    let alive = true
    void api<{ slots: Slot[] }>({ action: 'day', format, date }).then((r) => {
      if (!alive) return
      const list = r.slots ?? []
      setSlots(list)
      setTime((cur) => (list.some((x) => x.t === cur && x.free) ? cur : ''))
    })
    return () => { alive = false }
  }, [format, date])

  // «Из Telegram»: открываем бота с одноразовым токеном; человек нажимает «Запустить», бот запоминает ник, страница его забирает
  const [tgWait, setTgWait] = useState(false)
  const [tgMsg, setTgMsg] = useState('')
  const poll = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearInterval(poll.current), [])
  const fetchTelegram = () => {
    const bytes = crypto.getRandomValues(new Uint8Array(12))
    const token = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('')
    window.open(`https://t.me/${BOT}?start=bk_${token}`, '_blank', 'noopener')
    setTgWait(true)
    setTgMsg(t.tgOpen)
    let tries = 0
    window.clearInterval(poll.current)
    poll.current = window.setInterval(async () => {
      tries++
      const r = await api<{ ready?: boolean; username?: string; name?: string }>({ action: 'tg_poll', token }).catch(() => ({ ready: false } as { ready?: boolean; username?: string; name?: string }))
      if (r.ready) {
        window.clearInterval(poll.current)
        setTgWait(false)
        if (r.username) { setF((x) => ({ ...x, telegram: r.username!, name: x.name || r.name || '' })); setTgMsg(t.tgDone) } else setTgMsg(t.tgNoName)
      } else if (tries > 90) { window.clearInterval(poll.current); setTgWait(false); setTgMsg(t.tgTimeout) }
    }, 2000)
  }

  // «AI-разработка» первой, остальные в порядке сайта
  const services = useMemo(() => [...(cfg?.services ?? [])].sort((a, b) => Number(b.key === 'ai') - Number(a.key === 'ai')), [cfg])
  const svc = cfg?.services.find((s) => s.key === service)
  const missing = useMemo(() => [!format && t.mFormat, !date && t.mDate, !time && t.mTime, !service && t.mService, !f.name.trim() && t.mName, !f.phone.trim() && !f.telegram.trim() && t.mContact, !consent && t.mConsent].filter(Boolean) as string[], [service, format, date, time, f, consent, t])
  const dayLabel = (d: string) => new Date(`${d}T12:00:00+03:00`).toLocaleDateString(lang === 'en' ? 'en-GB' : 'ru-RU', { timeZone: 'Europe/Minsk', weekday: 'long', day: 'numeric', month: 'long' })
  const dateLabel = (iso: string) => new Date(iso).toLocaleString(lang === 'en' ? 'en-GB' : 'ru-RU', { timeZone: 'Europe/Minsk', day: 'numeric', month: 'long', weekday: 'short', hour: '2-digit', minute: '2-digit' })

  const submit = async () => {
    setBusy(true)
    setError('')
    const r = await api<{ ok?: boolean; ref?: string; starts_at?: string }>({ action: 'create', service, format, date, time, topics, ...f, clientId: qs.get('c') ?? undefined, runId: qs.get('r') ?? undefined, runNode: qs.get('n') ?? undefined })
    setBusy(false)
    if (r.ok) setDone({ ref: r.ref ?? '', starts_at: r.starts_at ?? '' })
    else {
      setError(r.error ?? t.err)
      if (date) { setSlots(null); void api<{ slots: Slot[] }>({ action: 'day', format, date }).then((x) => setSlots(x.slots ?? [])); setTime('') }
    }
  }
  const reset = () => { setDone(null); setDate(''); setTime(''); setConsent(true); setTopics([]); setF({ name: '', phone: '', telegram: '', company: '', goal: '', comment: '', website: '' }) }
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
              <h2><span className="bk-n">1</span>{t.format}</h2>
              <div className="bk-chips">{cfg?.formats.map((x) => <button key={x.key} type="button" className={format === x.key ? 'on' : ''} aria-pressed={format === x.key} onClick={() => setFormat(x.key)}>{x[lang]}</button>)}</div>
              {format === 'offline' && cfg && <p className="bk-dim">{t.offline}: {cfg.offlineDays.map((i) => t.dows[i]).join(', ')}.</p>}
              {format === 'video' && <p className="bk-dim">{t.video}</p>}
            </section>

            <section className="bk-card">
              <h2><span className="bk-n">2</span>{t.date}</h2>
              {month && (
                <MonthGrid lang={lang} month={month} onMonth={(m) => { setMonth(m); setDays({}) }} selected={date}
                  cell={(d) => { const x = days[d]; const ok = !!x && x.free > 0; return { disabled: !ok, cls: ok ? 'open' : 'dis', title: x?.why ?? (ok ? `${x.free} ${t.freeSlots}` : undefined) } }}
                  onPick={(d) => { setDate(d); setTime(''); if (d.slice(0, 7) !== month) setMonth(d.slice(0, 7)) }} />
              )}
              {daysBusy && <p className="bk-dim" role="status">{t.loadingDays}</p>}
              {!date && !daysBusy && <p className="bk-dim">{t.pickDay}</p>}
              {date && slots && (
                <>
                  <h2 className="bk-sub2">{dayLabel(date)} <small className="bk-dim">{t.minsk}</small></h2>
                  <div className="bk-slots">
                    {slots.filter((s) => s.free).map((s) => <button key={s.t} type="button" className={time === s.t ? 'on' : ''} aria-pressed={time === s.t} onClick={() => setTime(s.t)}>{s.t}</button>)}
                    {!slots.some((s) => s.free) && <p className="bk-dim">{t.noSlots}</p>}
                  </div>
                  {cfg && <p className="bk-dim">{t.duration}: {cfg.services[0]?.minutes} {t.min}</p>}
                </>
              )}
            </section>

            <section className="bk-card">
              <h2><span className="bk-n">3</span>{t.service}</h2>
              <div className="bk-chips">{services.map((s) => <button key={s.key} type="button" className={service === s.key ? 'on' : ''} aria-pressed={service === s.key} onClick={() => { setService(s.key); setTopics([]) }}>{s[lang]}</button>)}</div>
              {service && SERVICE_OPTIONS[service] && (
                <div className="bk-topicsbox">
                  <p className="bk-topichint">{t.pickNeeded}</p>
                  <div className="bk-chips bk-topics" role="group" aria-label={t.topics}>
                    {SERVICE_OPTIONS[service]!.map((o) => {
                      const on = topics.includes(o.ru)
                      return (
                        <button key={o.ru} type="button" className={on ? 'on' : ''} aria-pressed={on} onClick={() => setTopics((cur) => (cur.includes(o.ru) ? cur.filter((x) => x !== o.ru) : [...cur, o.ru]))}>
                          <i className="bk-box" aria-hidden="true">{on ? '✓' : ''}</i>{lang === 'en' ? o.en : o.ru}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
              {svc && <p className="bk-dim bk-svcinfo">{lang === 'en' ? svc.infoEn : svc.infoRu} <a href={lang === 'en' ? svc.urlEn : svc.url} target="_blank" rel="noreferrer">{t.more}</a></p>}
            </section>

            <section className="bk-card">
              <h2><span className="bk-n">4</span>{t.contacts}</h2>
              {prefilled && <p className="bk-dim">{t.prefilled}</p>}
              <div className="bk-grid">
                {input('name', `${t.name} *`, { autoComplete: 'name' })}
                {input('company', t.company, { autoComplete: 'organization' })}
                <div className="bk-fld"><span>{t.phone}</span><PhoneField lang={lang} value={f.phone} onChange={(v) => setF((x) => ({ ...x, phone: v }))} inputClassName="bk-phone" /></div>
                <div className="bk-fld"><span>{t.telegram}</span>
                  <div className="bk-tg">
                    <input value={f.telegram} onChange={(e) => setF({ ...f, telegram: e.target.value })} autoCapitalize="none" placeholder="@username" />
                    <button type="button" className="bk-tgbtn" onClick={fetchTelegram} disabled={tgWait} title={t.tgBtnHint}>{tgWait ? t.tgWaiting : t.tgBtn}</button>
                  </div>
                  {tgMsg && <small className="bk-dim" role="status">{tgMsg}</small>}
                </div>
              </div>
              <p className="bk-dim">{t.contactHint}</p>
              <label className="bk-fld"><span>{t.goal}</span>
                <select value={f.goal} onChange={(e) => setF({ ...f, goal: e.target.value })}>
                  <option value="">{t.goalPick}</option>
                  {BOOKING_GOALS.map((g) => <option key={g.ru} value={g.ru}>{lang === 'en' ? g.en : g.ru}</option>)}
                </select>
              </label>
              <label className="bk-fld"><span>{t.comment}</span><textarea rows={3} placeholder={t.commentPh} value={f.comment} onChange={(e) => setF({ ...f, comment: e.target.value })} /></label>
              <input className="bk-hp" tabIndex={-1} autoComplete="off" aria-hidden="true" value={f.website} onChange={(e) => setF({ ...f, website: e.target.value })} />
              <label className="bk-check-row"><input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} /><span>{t.consentPre} <a href={POLICY_PATH} target="_blank" rel="noreferrer">{t.consentLink}</a></span></label>
              {error && <p className="bk-err" role="alert">{error}</p>}
              {missing.length > 0 && <p className="bk-missing">{t.missing}: {missing.map((m) => <span key={m} className="bk-miss">{m}</span>)}</p>}
              <button type="button" className="bk-btn" disabled={busy || missing.length > 0} onClick={submit}>{busy ? t.sending : t.send}</button>
            </section>
          </>
        )}
      </main>
    </div>
  )
}
export { shiftMonth }

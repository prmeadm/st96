import { useEffect, useState } from 'react'
import { SITE_SERVICES } from '../../../server/catalog'
import { callApi } from '../api'
import { SERVICES, STATUSES, WARNINGS, type Lead } from '../types'
import { Icon } from '../ui/Icon'
import { PhoneField } from '../../components/ui/PhoneField'


type Form = { service_key: string; name: string; phone: string; telegram: string; email: string; company: string; comment: string; status: Lead['status'] }
type Saved = { clientId: string | null; clientCreated: boolean; leadsOfClient: number }

const blank: Form = { service_key: 'other', name: '', phone: '', telegram: '', email: '', company: '', comment: '', status: 'new' }
const fromLead = (l: Lead): Form => ({
  service_key: l.service_key && SERVICES[l.service_key] ? l.service_key : 'other', name: l.name ?? '', phone: l.phone ?? '', telegram: l.telegram ?? '',
  email: l.email ?? '', company: l.company ?? '', comment: l.comment ?? '', status: l.status,
})

/** Окно заявки: новая (вставить текст из Telegram, поля разложатся сами) или правка по карандашу. */
export function LeadEditor({ lead, onClose, onSaved }: { lead: Lead | null; onClose: () => void; onSaved: (s: Saved, edited: boolean) => void }) {
  const [f, setF] = useState<Form>(lead ? fromLead(lead) : blank)
  const [text, setText] = useState('')
  const [warn, setWarn] = useState<string[]>(lead?.warnings ?? [])
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const up = (p: Partial<Form>) => setF((x) => ({ ...x, ...p }))

  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [onClose])

  const parse = async () => {
    setBusy(true); setErr('')
    const r = await callApi<{ fields: Omit<Form, 'status'>; warnings: string[] }>('/api/lead-admin', { action: 'parse', text })
    setBusy(false)
    if (!r.ok) return setErr(r.error)
    setF((x) => ({ ...x, ...r.data.fields }))
    setWarn(r.data.warnings)
  }
  const save = async () => {
    setBusy(true); setErr('')
    const r = await callApi<Saved>('/api/lead-admin', lead ? { action: 'update', id: lead.id, fields: f } : { action: 'create', text, fields: f })
    setBusy(false)
    if (!r.ok) return setErr(r.error)
    onSaved(r.data, !!lead)
  }
  const empty = !f.name.trim() && !f.phone.trim() && !f.telegram.trim() && !f.email.trim() && !f.comment.trim()

  return (
    <div className="lx-ov" onClick={onClose}>
      <div className="lx-modal" role="dialog" aria-modal="true" aria-label={lead ? 'Изменить заявку' : 'Новая заявка'} onClick={(e) => e.stopPropagation()}>
        <div className="lx-h"><b>{lead ? 'Изменить заявку' : 'Новая заявка'}</b><span className="sp" />
          <button type="button" className="x" onClick={onClose} aria-label="Закрыть"><Icon name="close" size={18} /></button></div>
        <div className="lx-b">
          {!lead && (
            <div className="fld">
              <label>Текст из Telegram</label>
              <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder={'Вставьте сообщение клиента как есть: имя, телефон, ник, что нужно. Поля разложатся сами.'} autoFocus />
              <button type="button" className="btn" disabled={busy || !text.trim()} onClick={parse}><Icon name="agent" size={18} />Разобрать текст</button>
            </div>
          )}
          {warn.length > 0 && <div className="chips">{warn.map((w) => <span key={w} className="chip amber">{WARNINGS[w] ?? w}</span>)}</div>}
          <div className="lx-grid">
            <div className="fld"><label>Услуга</label>
              <select value={f.service_key} onChange={(e) => up({ service_key: e.target.value })}>
                {SITE_SERVICES.map((s) => <option key={s.key} value={s.key}>{s.ru}</option>)}
                <option value="other">Не указана</option>
              </select></div>
            <div className="fld"><label>Статус</label>
              <select value={f.status} onChange={(e) => up({ status: e.target.value as Lead['status'] })}>{Object.entries(STATUSES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
            <div className="fld"><label>Имя</label><input value={f.name} onChange={(e) => up({ name: e.target.value })} /></div>
            <div className="fld"><label>Компания</label><input value={f.company} onChange={(e) => up({ company: e.target.value })} /></div>
            <div className="fld"><label>Телефон</label><PhoneField value={f.phone} onChange={(v) => up({ phone: v })} /></div>
            <div className="fld"><label>Telegram</label><input value={f.telegram} onChange={(e) => up({ telegram: e.target.value })} placeholder="@ник" /></div>
            <div className="fld lx-wide"><label>Почта</label><input type="email" value={f.email} onChange={(e) => up({ email: e.target.value })} /></div>
          </div>
          <div className="fld"><label>Комментарий</label><textarea value={f.comment} onChange={(e) => up({ comment: e.target.value })} /></div>
          <div className="hint">Клиент определяется по телефону, затем по нику Telegram. Если такого клиента нет, он создаётся сам. У одного клиента может быть сколько угодно заявок.</div>
          {err && <div className="err" role="alert">{err}</div>}
        </div>
        <div className="lx-f">
          <button type="button" className="btn" onClick={onClose}>Отмена</button>
          <span className="sp" />
          <button type="button" className="btn primary" disabled={busy || empty} onClick={save}>{busy ? 'Сохраняю…' : lead ? 'Сохранить' : 'Создать заявку'}</button>
        </div>
      </div>
    </div>
  )
}

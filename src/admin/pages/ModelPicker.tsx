import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { callApi } from '../api'
import { Icon } from '../ui/Icon'
import { AUTO_MODEL, MODELS, PRESETS, parseCustom, type CustomModel } from '../../../server/agent/models'

type Check = { busy?: boolean; ok?: boolean; text?: string }

/** Вкладка «Модель»: описание каталога, свои модели, переключение и проверка доступности. */
export default function ModelPicker() {
  const [selected, setSelected] = useState<string>(AUTO_MODEL)
  const [custom, setCustom] = useState<CustomModel[]>([])
  const [checks, setChecks] = useState<Record<string, Check>>({})
  const [error, setError] = useState('')
  const [note, setNote] = useState('')
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState<{ preset: string; name: string; baseUrl: string; model: string; keyEnv: string }>({ preset: 'groq', name: '', baseUrl: PRESETS[1].baseUrl, model: '', keyEnv: PRESETS[1].keyEnv })

  const load = useCallback(async () => {
    const { data, error: e } = await supabase.from('app_settings').select('key, value').in('key', ['llm_model', 'llm_custom_models'])
    if (e) return setError('Не удалось загрузить настройки модели')
    const map = Object.fromEntries((data ?? []).map((r) => [r.key as string, r.value as unknown]))
    setSelected(typeof map.llm_model === 'string' ? map.llm_model : AUTO_MODEL)
    setCustom(parseCustom(typeof map.llm_custom_models === 'string' ? map.llm_custom_models : null))
  }, [])
  useEffect(() => { void load() }, [load])

  const call = async (body: Record<string, unknown>) => {
    setError('')
    const r = await callApi<{ id?: string }>('/api/agent-model', body)
    if (!r.ok) setError(r.error)
    return r.ok ? r.data : null
  }
  const choose = async (id: string) => {
    if (await call({ action: 'select', model: id })) { setSelected(id); setNote('Модель выбрана: её используют агент и перевод.') }
  }
  const test = async (id: string) => {
    setChecks((c) => ({ ...c, [id]: { busy: true } }))
    const r = await callApi<{ ok: boolean; ms?: number; error?: string }>('/api/agent-model', { action: 'test', id })
    setChecks((c) => ({ ...c, [id]: r.ok && r.data.ok ? { ok: true, text: `Работает, ответ за ${((r.data.ms ?? 0) / 1000).toFixed(1)} с` } : { ok: false, text: r.ok ? r.data.error : r.error } }))
  }
  const testAll = async () => { for (const id of [...MODELS.map((m) => m.id), ...custom.map((m) => m.id)]) await test(id) }
  const remove = async (m: CustomModel) => {
    if (!confirm(`Убрать модель «${m.name}» из списка? Ключ в Vercel останется.`)) return
    if (await call({ action: 'remove', id: m.id })) { if (selected === m.id) setSelected(AUTO_MODEL); await load() }
  }
  const pickPreset = (key: string) => {
    const p = PRESETS.find((x) => x.key === key)!
    setForm({ ...form, preset: key, baseUrl: p.baseUrl, keyEnv: p.keyEnv })
  }
  const add = async () => {
    const d = await call({ action: 'add', name: form.name, baseUrl: form.baseUrl, model: form.model, keyEnv: form.keyEnv })
    if (d) {
      setAdding(false)
      setNote(`Модель добавлена. Добавьте ключ ${form.keyEnv} в Vercel (Settings, Environment Variables), сделайте новый деплой и нажмите «Проверить».`)
      setForm({ ...form, name: '', model: '' })
      await load()
      if (d.id) setChecks((c) => ({ ...c, [d.id!]: {} }))
    }
  }
  const preset = PRESETS.find((p) => p.key === form.preset)!

  const status = (id: string) => {
    const c = checks[id]
    if (!c) return null
    if (c.busy) return <span className="chip">Проверяю…</span>
    return <span className={`chip ${c.ok ? 'green' : 'red'}`} title={c.text}>{c.ok ? <Icon name="check" size={12} /> : <Icon name="close" size={12} />}{c.text}</span>
  }
  const actions = (id: string) => (
    <div className="mact">
      {selected === id ? <span className="chip green"><Icon name="check" size={12} />Выбрана</span> : <button type="button" className="btn small-btn" onClick={() => choose(id)}>Использовать</button>}
      <button type="button" className="ibtn sm" title="Проверить доступность" aria-label="Проверить доступность" onClick={() => test(id)} disabled={checks[id]?.busy}><Icon name="bolt" size={18} /></button>
    </div>
  )

  return (
    <div className="models">
      <div className="hint">Выбранную модель используют задания агента и перевод на английский. Если выбранная модель Google недоступна, будут пробоваться следующие по списку. Своя модель работает строго сама по себе: тексты не уйдут к Google без вашего ведома.</div>
      {error && <div className="err" role="alert">{error}</div>}
      {note && <div className="hint" role="status">{note}</div>}
      <div className="row"><button type="button" className="btn" onClick={testAll}><Icon name="bolt" size={16} />Проверить все модели</button><button type="button" className="btn primary" onClick={() => setAdding(!adding)}><Icon name={adding ? 'close' : 'plus'} size={18} />{adding ? 'Отмена' : 'Добавить свою модель'}</button></div>

      {adding && (
        <div className="card">
          <h3>Новая модель</h3>
          <div className="fld"><label>Сервис</label>
            <div className="chips">{PRESETS.map((p) => <button type="button" key={p.key} className={form.preset === p.key ? 'on' : ''} aria-pressed={form.preset === p.key} onClick={() => pickPreset(p.key)}>{p.label}</button>)}</div></div>
          <div className="fld"><label htmlFor="m-name">Название</label><input id="m-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Например, Groq Llama" /></div>
          <div className="fld"><label htmlFor="m-id">Идентификатор модели</label><input id="m-id" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} placeholder={preset.modelHint} /></div>
          <div className="fld"><label htmlFor="m-url">Адрес API (OpenAI-совместимый)</label><input id="m-url" value={form.baseUrl} onChange={(e) => setForm({ ...form, baseUrl: e.target.value })} placeholder="https://…/v1" /></div>
          <div className="fld"><label htmlFor="m-key">Переменная с ключом в Vercel</label><input id="m-key" value={form.keyEnv} onChange={(e) => setForm({ ...form, keyEnv: e.target.value.toUpperCase() })} />
            <span className="hint">Сам ключ сюда вводить не нужно: он хранится только в Vercel под этим именем (LLM_API_KEY или LLM_KEY_ИМЯ).</span></div>
          <div className="row formbtns"><button type="button" className="btn primary" onClick={add} disabled={!form.name.trim() || !form.model.trim() || !form.baseUrl.trim()}>Добавить</button></div>
        </div>
      )}

      <div className="mgrid">
        <div className={`mcard ${selected === AUTO_MODEL ? 'on' : ''}`}>
          <div className="mhead"><b>Авто</b><span className="chip">по умолчанию</span></div>
          <p className="mblurb">Сначала пробуется самая новая модель Google из списка ниже, при недоступности следующая. Подходит, если не хочется следить за тем, какие бесплатные модели Google ещё открыты для вашего ключа.</p>
          <div className="mact">{selected === AUTO_MODEL ? <span className="chip green"><Icon name="check" size={12} />Выбрана</span> : <button type="button" className="btn small-btn" onClick={() => choose(AUTO_MODEL)}>Использовать</button>}</div>
        </div>
        {MODELS.map((m) => (
          <div key={m.id} className={`mcard ${selected === m.id ? 'on' : ''}`}>
            <div className="mhead"><b>{m.name}</b>{m.recommended && <span className="chip green">Рекомендуем</span>}<span className="chip">{m.family}</span></div>
            <p className="mblurb">{m.blurb}</p>
            <ul className="mlist">{m.strengths.map((s) => <li key={s}><Icon name="check" size={14} />{s}</li>)}{m.tradeoffs.map((s) => <li key={s} className="minus"><Icon name="minus" size={14} />{s}</li>)}</ul>
            <div className="hint">{m.price}</div>
            {status(m.id)}
            {actions(m.id)}
          </div>
        ))}
        {custom.map((m) => (
          <div key={m.id} className={`mcard ${selected === m.id ? 'on' : ''}`}>
            <div className="mhead"><b>{m.name}</b><span className="chip violet">Своя</span>
              <button type="button" className="ibtn sm danger" style={{ marginLeft: 'auto' }} title="Убрать из списка" aria-label="Убрать из списка" onClick={() => remove(m)}><Icon name="trash" size={18} /></button></div>
            <p className="mblurb">Модель <code>{m.model}</code> на {new URL(m.baseUrl).host}. Ключ берётся из переменной <code>{m.keyEnv}</code> в Vercel. Условия и лимиты смотрите у провайдера.</p>
            {status(m.id)}
            {actions(m.id)}
          </div>
        ))}
      </div>
      <div className="hint">Возможности моделей описаны по семейству и дают ориентир. Лучший способ выбрать: нажать «Проверить» и попробовать модель на своём задании или переводе.</div>
    </div>
  )
}

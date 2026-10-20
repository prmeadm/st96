import { useEffect, useState } from 'react'
import { callApi } from '../api'
import { Icon } from '../ui/Icon'
import ModelPicker from './ModelPicker'
import './settings.css'

type Status = {
  telegram: { token: boolean; group: boolean; webhook: { url: string; pending: number; lastError: string | null } | null }
  llm: { key: boolean; baseUrl: string | null; model: string | null }
  custom: { id: string; name: string; keyEnv: string; set: boolean }[]
}

function Row({ ok, title, hint }: { ok: boolean; title: string; hint?: string }) {
  return (
    <li className="srow">
      <span className={`sdot ${ok ? 'ok' : 'bad'}`} aria-hidden="true"><Icon name={ok ? 'check' : 'close'} size={14} /></span>
      <div><b>{title}</b><span className="hint">{ok ? 'Подключено' : 'Не настроено'}{hint ? `. ${hint}` : ''}</span></div>
    </li>
  )
}

/** Технические настройки: модель ИИ и состояние подключений. Нужны редко, поэтому не мешают в основных разделах. */
export default function SettingsPage() {
  const [st, setSt] = useState<Status | null>(null)
  const [err, setErr] = useState('')
  useEffect(() => {
    callApi<Status>('/api/status', {}).then((r) => (r.ok ? setSt(r.data) : setErr(r.error)))
  }, [])
  const w = st?.telegram.webhook
  return (
    <div className="wrap settings">
      <h1 className="h1">Настройки</h1>
      <div className="hint">Технические параметры платформы. Для повседневной работы они не нужны.</div>

      <section className="card">
        <h3>Модель ИИ</h3>
        <ModelPicker />
      </section>

      <section className="card">
        <h3>Подключения</h3>
        {err && <div className="err" role="alert">{err}</div>}
        {!st && !err && <div className="hint">Проверяю…</div>}
        {st && (
          <ul className="slist">
            <Row ok={st.telegram.token} title="Telegram-бот" hint={st.telegram.token ? undefined : 'Добавьте TELEGRAM_BOT_TOKEN в Vercel'} />
            <Row ok={!!w?.url && !w.lastError} title="Вебхук бота" hint={w ? `в очереди ${w.pending}${w.lastError ? `, последняя ошибка: ${w.lastError}` : ''}` : undefined} />
            <Row ok={st.telegram.group} title="Группа администраторов" hint={st.telegram.group ? undefined : 'Добавьте TELEGRAM_CHAT_ID в Vercel'} />
            <Row ok={st.llm.key} title="Ключ модели Google (LLM_API_KEY)" hint={st.llm.key ? undefined : 'Без него не работают агент и перевод'} />
            {st.custom.map((m) => <Row key={m.id} ok={m.set} title={`Ключ модели «${m.name}» (${m.keyEnv})`} hint={m.set ? undefined : 'Добавьте переменную в Vercel и сделайте новый деплой'} />)}
          </ul>
        )}
        <div className="hint" style={{ marginTop: 10 }}>Ключи хранятся только в Vercel (Settings, Environment Variables). Здесь они не показываются и не вводятся. После изменения переменной нужен новый деплой.</div>
      </section>
    </div>
  )
}

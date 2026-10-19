import { createContext, useContext, useEffect, useState, type FormEvent, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'

type Ctx = { email: string; signOut: () => void }
const AuthCtx = createContext<Ctx | null>(null)
export const useAuth = () => useContext(AuthCtx)!

type State = 'loading' | 'out' | 'noaccess' | 'ok'

export function AuthGate({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>('loading')
  const [email, setEmail] = useState('')

  useEffect(() => {
    const check = async (session: Session | null) => {
      if (!session) return setState('out')
      setEmail(session.user.email ?? '')
      // Таблицу admins читает только администратор (правила базы), у остальных будет пусто
      const { data } = await supabase.from('admins').select('user_id').eq('user_id', session.user.id).maybeSingle()
      setState(data ? 'ok' : 'noaccess')
    }
    supabase.auth.getSession().then(({ data }) => check(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      // Запросы к базе внутри этого обработчика напрямую блокируют клиента, поэтому откладываем
      setTimeout(() => check(s), 0)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  if (state === 'loading') return <div className="login"><div className="hint">Загрузка…</div></div>
  if (state === 'out') return <Login />
  if (state === 'noaccess')
    return (
      <div className="login">
        <div className="card">
          <h3>Нет доступа</h3>
          <div className="hint">Аккаунт {email} не добавлен в администраторы. Попросите владельца выдать доступ.</div>
          <button className="btn" onClick={() => supabase.auth.signOut()}>Выйти</button>
        </div>
      </div>
    )
  return <AuthCtx.Provider value={{ email, signOut: () => supabase.auth.signOut() }}>{children}</AuthCtx.Provider>
}

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (err) setError(err.message === 'Invalid login credentials' ? 'Неверная почта или пароль' : 'Не удалось войти. Попробуйте ещё раз.')
    setBusy(false)
  }

  return (
    <div className="login">
      <form className="card" onSubmit={submit}>
        <h3 style={{ fontSize: 18 }}>ST96 — вход</h3>
        <div className="fld"><label htmlFor="em">Почта</label><input id="em" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <div className="fld"><label htmlFor="pw">Пароль</label><input id="pw" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} /></div>
        {error && <div className="err" role="alert">{error}</div>}
        <button className="btn primary" disabled={busy}>{busy ? 'Входим…' : 'Войти'}</button>
      </form>
    </div>
  )
}

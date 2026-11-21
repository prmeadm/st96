import { useEffect, useState } from 'react'
import { supabase } from '../../supabase'
import { Icon } from '../../ui/Icon'
import { useAuth } from '../../auth'
import type { Client } from '../../types'
import type { ClientProjectRow, InvoiceRow, PackagePeriodRow, PackageRow, SupportJobRow } from '../../../server/support/types'
import { INVOICE_KINDS, INVOICE_STATUSES, JOB_STATUSES, PERIOD_STATUSES, PROJECT_STATUSES, fmtDate, limitLabel, money, num, useTable } from './shared'

type Tab = 'projects' | 'periods' | 'packages' | 'jobs' | 'invoices' | 'settings'
const TABS: { id: Tab; label: string }[] = [
  { id: 'projects', label: 'Клиенты и проекты' },
  { id: 'periods', label: 'Периоды' },
  { id: 'packages', label: 'Пакеты' },
  { id: 'jobs', label: 'Обращения' },
  { id: 'invoices', label: 'Счета' },
  { id: 'settings', label: 'Настройки' },
]

// Шаблон сценария агента для нового проекта. Лимиты пакета и вежливые ответы (на «спасибо»)
// система подставляет сама — в сценарий их не пишут.
const SCENARIO_TEMPLATE = `Роль: агент поддержки проекта клиента — вносит правки в рамках проекта и публикует их.

Можно:
— изучать сайт и файлы проекта;
— вносить правки текста и контента по запросу клиента;
— публиковать изменения.

Нельзя:
— создавать новые страницы и функции (оценивается отдельно);
— выполнять команды, не связанные с проектом.

Стоп-условия: если запрос неоднозначен — уточни; если вне рамок — вежливо откажи и сообщи, что оценивается отдельно.`

// Базовая папка клиентских проектов на сервере + помощники для имени новой папки
const WORKSPACE_BASE = '/home/dsh/work/KLIENTS/'
const slugify = (s: string) => s.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-_]/g, '').replace(/-+/g, '-')
const slugFromPath = (p: string) => p.replace(WORKSPACE_BASE, '').replace(/\/+$/, '')

// ─── Клиенты и проекты ───
type ProjectJoined = ClientProjectRow & { clients: { name: string | null; tg_username: string | null } | null; packages: { title: string } | null }

function ProjectsTab() {
  const [projects, setProjects] = useState<ProjectJoined[] | null>(null)
  const [ptick, setPtick] = useState(0)
  useEffect(() => {
    supabase.from('client_projects').select('*, clients(name, tg_username), packages(title)').order('created_at')
      .then(({ data, error }) => { if (!error) setProjects((data ?? []) as ProjectJoined[]) })
  }, [ptick])
  const reloadProjects = () => setPtick((x) => x + 1)
  const { rows: clients } = useTable<Client>('clients', 'created_at')
  const { rows: packages } = useTable<PackageRow>('packages', 'sort_order')
  const { rows: periods } = useTable<PackagePeriodRow>('package_periods')
  const [editing, setEditing] = useState<Partial<ClientProjectRow> & { client_id: string; system_prompt: string } | null>(null)
  const [msg, setMsg] = useState('')

  const clientName = (c: ProjectJoined) => c.clients?.name ?? (c.clients?.tg_username ? '@' + c.clients.tg_username : 'Без имени')
  const openPeriod = (projectId: string) => (periods ?? []).filter((p) => p.project_id === projectId && (p.status === 'pending_payment' || p.status === 'active')).sort((a, b) => Date.parse(b.period_start) - Date.parse(a.period_start))[0]
  const remaining = (p: PackagePeriodRow) => {
    const c = p.corrections_limit == null ? null : p.corrections_limit - p.corrections_used
    return c == null ? '∞' : String(c)
  }
  // Существующие папки проектов (для выбора) + режим «новая папка»
  const existingWorkspaces = [...new Set((projects ?? []).map((p) => p.workspace_path).filter((w): w is string => !!w))]
  const workspaceIsNew = !existingWorkspaces.includes(editing?.workspace_path ?? '')

  const openEdit = async (p: ProjectJoined) => {
    let prompt = ''
    if (p.agent_scenario_id) {
      const { data } = await supabase.from('agent_scenarios').select('system_prompt').eq('id', p.agent_scenario_id).maybeSingle()
      prompt = (data?.system_prompt as string | undefined) ?? ''
    }
    setEditing({ ...p, client_id: p.client_id, system_prompt: prompt })
  }

  const save = async () => {
    if (!editing) return
    if (!editing.client_id) return setMsg('Выберите клиента')
    const base = {
      client_id: editing.client_id,
      package_id: editing.package_id ?? null,
      workspace_path: editing.workspace_path?.trim() || null,
      repo_url: editing.repo_url?.trim() || null,
      deploy_target: editing.deploy_target?.trim() || null,
      default_branch: editing.default_branch?.trim() || 'main',
      deploy_cmd: editing.deploy_cmd?.trim() || null,
      status: editing.status ?? 'active',
    }
    const prompt = editing.system_prompt?.trim()
    if (editing.id) {
      await supabase.from('client_projects').update(base).eq('id', editing.id)
      if (prompt) {
        if (editing.agent_scenario_id) {
          await supabase.from('agent_scenarios').update({ system_prompt: prompt }).eq('id', editing.agent_scenario_id)
        } else {
          const { data: sc } = await supabase.from('agent_scenarios').insert({ client_id: editing.client_id, project_id: editing.id, system_prompt: prompt }).select('id').single()
          if (sc) await supabase.from('client_projects').update({ agent_scenario_id: sc.id }).eq('id', editing.id)
        }
      }
    } else {
      const { data, error } = await supabase.from('client_projects').insert(base).select('id').single()
      if (error) return setMsg('Не удалось создать проект')
      if (prompt) {
        const { data: sc } = await supabase.from('agent_scenarios').insert({ client_id: editing.client_id, project_id: data.id, system_prompt: prompt }).select('id').single()
        if (sc) await supabase.from('client_projects').update({ agent_scenario_id: sc.id }).eq('id', data.id)
      }
    }
    setEditing(null); setMsg('Сохранено'); reloadProjects()
  }

  return (
    <div className="card">
      <div className="row"><h3 style={{ margin: 0 }}>Клиенты и проекты</h3><span className="sp" /><button className="btn primary" onClick={() => setEditing({ client_id: '', system_prompt: SCENARIO_TEMPLATE })}><Icon name="plus" size={18} />Проект</button></div>
      {msg && <div className="hint" role="status" style={{ marginTop: 6 }}>{msg}</div>}
      {projects === null ? <div className="hint">Загрузка…</div> : projects.length === 0 ? <div className="hint" style={{ marginTop: 10 }}>Проектов нет. Привяжите клиента к workspace-папке.</div> : (
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {projects.map((p) => {
            const per = openPeriod(p.id)
            return (
              <div key={p.id} className="item" style={{ boxShadow: 'none' }}>
                <div className="row"><b>{clientName(p)}</b>{p.packages && <span className="chip">{p.packages.title}</span>}<span className="chip">{PROJECT_STATUSES[p.status] ?? p.status}</span><span className="sp" /><span className="hint">{p.workspace_path ?? '—'}</span><button className="ibtn" title="Редактировать" onClick={() => openEdit(p)}><Icon name="edit" size={18} /></button></div>
                <div className="hint" style={{ marginTop: 4 }}>{p.repo_url ?? 'без репозитория'} · деплой {p.deploy_cmd ?? '—'}</div>
                {per && <div className="hint" style={{ marginTop: 4 }}>Период: {fmtDate(per.period_start)}–{fmtDate(per.period_end)} · {PERIOD_STATUSES[per.status]} · правки {per.corrections_used}/{limitLabel(per.corrections_limit)} (осталось {remaining(per)})</div>}
              </div>
            )
          })}
        </div>
      )}
      {editing && (
        <div className="lx-ov" onClick={() => setEditing(null)}>
          <div className="lx-modal" role="dialog" aria-modal="true" aria-label="Проект" onClick={(e) => e.stopPropagation()}>
            <div className="lx-h"><b>{editing.id ? 'Проект' : 'Новый проект'}</b><span className="sp" /><button type="button" className="x" onClick={() => setEditing(null)} aria-label="Закрыть"><Icon name="close" size={18} /></button></div>
            <div className="lx-b">
              <div className="lx-grid">
                <div className="fld"><label>Клиент</label>
                  <select value={editing.client_id} onChange={(e) => setEditing({ ...editing, client_id: e.target.value })}>
                    <option value="">—</option>
                    {(clients ?? []).map((c) => <option key={c.id} value={c.id}>{c.name ?? (c.tg_username ? '@' + c.tg_username : c.phone ?? 'Без имени')}</option>)}
                  </select></div>
                <div className="fld"><label>Пакет</label>
                  <select value={editing.package_id ?? ''} onChange={(e) => setEditing({ ...editing, package_id: e.target.value || null })}>
                    <option value="">—</option>
                    {(packages ?? []).map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
                  </select></div>
                <div className="fld"><label>Статус</label>
                  <select value={editing.status ?? 'active'} onChange={(e) => setEditing({ ...editing, status: e.target.value as ClientProjectRow['status'] })}>
                    {Object.entries(PROJECT_STATUSES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select></div>
                <div className="fld"><label>Ветка по умолчанию</label><input value={editing.default_branch ?? 'main'} onChange={(e) => setEditing({ ...editing, default_branch: e.target.value })} /></div>
                <div className="fld lx-wide"><label>Workspace (папка проекта на сервере)</label>
                    <select value={workspaceIsNew ? '__new__' : (editing.workspace_path ?? '')} onChange={(e) => setEditing({ ...editing, workspace_path: e.target.value === '__new__' ? WORKSPACE_BASE : e.target.value })}>
                      <option value="__new__">+ Создать новую папку</option>
                      {existingWorkspaces.map((w) => <option key={w} value={w}>{w}</option>)}
                    </select>
                    {workspaceIsNew && <input value={slugFromPath(editing.workspace_path ?? '')} onChange={(e) => setEditing({ ...editing, workspace_path: WORKSPACE_BASE + slugify(e.target.value) + '/' })} placeholder="имя папки (например gf-leasing)" />}
                  </div>
                <div className="fld lx-wide"><label>Репозиторий</label><input value={editing.repo_url ?? ''} onChange={(e) => setEditing({ ...editing, repo_url: e.target.value })} placeholder="https://github.com/…" /></div>
                <div className="fld lx-wide"><label>Деплой-таргет / команда</label><input value={editing.deploy_cmd ?? ''} onChange={(e) => setEditing({ ...editing, deploy_cmd: e.target.value })} placeholder="vercel --prod / npm run deploy" /></div>
                <div className="fld lx-wide"><label>Сценарий агента (рамки)</label><textarea rows={4} value={editing.system_prompt ?? ''} onChange={(e) => setEditing({ ...editing, system_prompt: e.target.value })} placeholder="Роль, что можно / что нельзя, стоп-условия. Лимиты пакета и вежливые ответы система подставляет сама." /></div>
              </div>
            </div>
            <div className="lx-f"><button className="btn" onClick={() => setEditing(null)}>Отмена</button><span className="sp" /><button className="btn primary" onClick={save}>Сохранить</button></div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Пакеты ───
type PkgForm = { code: string; title: string; description: string; price: string; corrections_limit: string; features_limit: string; requests_limit: string; features_allowed: string; sla_note: string; sort_order: string; is_active: boolean }
const blankPkg: PkgForm = { code: '', title: '', description: '', price: '', corrections_limit: '', features_limit: '', requests_limit: '', features_allowed: '', sla_note: '', sort_order: '0', is_active: true }

function PackagesTab() {
  const { rows, reload } = useTable<PackageRow>('packages', 'sort_order')
  const [editing, setEditing] = useState<PackageRow | null>(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState<PkgForm>(blankPkg)
  const [msg, setMsg] = useState('')

  const openEdit = (p: PackageRow) => { setEditing(p); setCreating(false); setForm({ code: p.code, title: p.title, description: p.description ?? '', price: p.price == null ? '' : String(p.price), corrections_limit: p.corrections_limit == null ? '' : String(p.corrections_limit), features_limit: p.features_limit == null ? '' : String(p.features_limit), requests_limit: p.requests_limit == null ? '' : String(p.requests_limit), features_allowed: p.features_allowed ?? '', sla_note: p.sla_note ?? '', sort_order: String(p.sort_order), is_active: p.is_active }) }
  const save = async () => {
    if (!form.code.trim() || !form.title.trim()) return setMsg('Укажите код и название')
    const row = { code: form.code.trim(), title: form.title.trim(), description: form.description.trim() || null, price: num(form.price), corrections_limit: num(form.corrections_limit), features_limit: num(form.features_limit), requests_limit: num(form.requests_limit), features_allowed: form.features_allowed.trim() || null, sla_note: form.sla_note.trim() || null, sort_order: Number(form.sort_order) || 0, is_active: form.is_active }
    const { error } = editing ? await supabase.from('packages').update(row).eq('id', editing.id) : await supabase.from('packages').insert(row)
    if (error) return setMsg(error.code === '23505' ? 'Такой код уже есть' : 'Не удалось сохранить')
    setEditing(null); setCreating(false); setMsg('Сохранено'); reload()
  }
  const toggle = async (p: PackageRow) => { await supabase.from('packages').update({ is_active: !p.is_active }).eq('id', p.id); reload() }
  const copy = async (p: PackageRow) => { await supabase.from('packages').insert({ code: p.code + '-copy', title: p.title + ' (копия)', description: p.description, price: p.price, corrections_limit: p.corrections_limit, features_limit: p.features_limit, requests_limit: p.requests_limit, features_allowed: p.features_allowed, sla_note: p.sla_note, sort_order: p.sort_order, is_active: false }); reload() }

  return (
    <div className="card">
      <div className="row"><h3 style={{ margin: 0 }}>Пакеты</h3><span className="sp" /><button className="btn primary" onClick={() => { setCreating(true); setEditing(null); setForm(blankPkg) }}><Icon name="plus" size={18} />Новый пакет</button></div>
      {msg && <div className="hint" role="status" style={{ marginTop: 6 }}>{msg}</div>}
      {rows === null ? <div className="hint">Загрузка…</div> : (
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {rows.map((p) => (
            <div key={p.id} className="item" style={{ boxShadow: 'none' }}>
              <div className="row"><b>{p.title}</b><span className="hint">· {p.code}</span>{!p.is_active && <span className="chip red">выключен</span>}<span className="sp" />
                <span className="hint">{money(p.price)} · правки {limitLabel(p.corrections_limit)} · функции {limitLabel(p.features_limit)} · обращения {limitLabel(p.requests_limit)}</span>
                <button className="ibtn" title={p.is_active ? 'Выключить' : 'Включить'} onClick={() => toggle(p)}><Icon name={p.is_active ? 'stop' : 'play'} size={18} /></button>
                <button className="ibtn" title="Копировать" onClick={() => copy(p)}><Icon name="file" size={18} /></button>
                <button className="ibtn" title="Редактировать" onClick={() => openEdit(p)}><Icon name="edit" size={18} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
      {(editing || creating) && (
        <div className="lx-ov" onClick={() => { setEditing(null); setCreating(false) }}>
          <div className="lx-modal" role="dialog" aria-modal="true" aria-label="Пакет" onClick={(e) => e.stopPropagation()}>
            <div className="lx-h"><b>{creating ? 'Новый пакет' : 'Пакет'}</b><span className="sp" /><button type="button" className="x" onClick={() => { setEditing(null); setCreating(false) }} aria-label="Закрыть"><Icon name="close" size={18} /></button></div>
            <div className="lx-b">
              <div className="lx-grid">
                <div className="fld"><label>Код</label><input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="standard" /></div>
                <div className="fld"><label>Название</label><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Стандартный" /></div>
                <div className="fld"><label>Цена, BYN</label><input value={form.price} inputMode="decimal" onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
                <div className="fld"><label>Порядок</label><input value={form.sort_order} inputMode="numeric" onChange={(e) => setForm({ ...form, sort_order: e.target.value })} /></div>
                <div className="fld"><label>Лимит правок</label><input value={form.corrections_limit} inputMode="numeric" onChange={(e) => setForm({ ...form, corrections_limit: e.target.value })} placeholder="пусто = ∞" /></div>
                <div className="fld"><label>Лимит функций</label><input value={form.features_limit} inputMode="numeric" onChange={(e) => setForm({ ...form, features_limit: e.target.value })} placeholder="пусто = ∞" /></div>
                <div className="fld"><label>Лимит обращений</label><input value={form.requests_limit} inputMode="numeric" onChange={(e) => setForm({ ...form, requests_limit: e.target.value })} placeholder="пусто = ∞" /></div>
                <div className="fld"><label>Входит (функции)</label><input value={form.features_allowed} onChange={(e) => setForm({ ...form, features_allowed: e.target.value })} /></div>
                <div className="fld lx-wide"><label>Описание</label><textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
                <div className="fld lx-wide"><label>SLA / примечание</label><input value={form.sla_note} onChange={(e) => setForm({ ...form, sla_note: e.target.value })} /></div>
                <label className="fld lx-wide" style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}><input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} /><span>Пакет активен</span></label>
              </div>
            </div>
            <div className="lx-f"><button className="btn" onClick={() => { setEditing(null); setCreating(false) }}>Отмена</button><span className="sp" /><button className="btn primary" onClick={save}>Сохранить</button></div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Периоды ───
type PeriodJoined = PackagePeriodRow & { client_projects: { clients: { name: string | null; tg_username: string | null } | null; packages: { title: string } | null } | null }
type PeriodForm = {
  id?: string
  project_id: string
  status: PackagePeriodRow['status']
  period_start: string
  period_end: string
  corrections_limit: string
  corrections_used: string
  features_limit: string
  features_used: string
  requests_limit: string
  requests_used: string
}
const blankPeriod = (): PeriodForm => ({
  project_id: '', status: 'active',
  period_start: new Date().toISOString().slice(0, 10),
  period_end: new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10),
  corrections_limit: '', corrections_used: '0', features_limit: '', features_used: '0', requests_limit: '', requests_used: '0',
})

function PeriodsTab() {
  const { rows, reload } = useTable<PeriodJoined>('package_periods', 'period_start', 500, '*, client_projects(clients(name, tg_username), packages(title))')
  const { rows: projects } = useTable<ProjectJoined>('client_projects', 'created_at', 500, '*, clients(name, tg_username), packages(title)')
  const { rows: packages } = useTable<PackageRow>('packages', 'sort_order')
  const [form, setForm] = useState<PeriodForm | null>(null)
  const [msg, setMsg] = useState('')

  const projName = (p: ProjectJoined) => p.clients?.name ?? (p.clients?.tg_username ? '@' + p.clients.tg_username : 'Без имени')
  const rowName = (p: PeriodJoined) => p.client_projects?.clients?.name ?? (p.client_projects?.clients?.tg_username ? '@' + p.client_projects.clients.tg_username : '—')
  const left = (limit: number | null, used: number) => (limit == null ? '∞' : String(Math.max(0, limit - used)))

  const openCreate = () => { setMsg(''); setForm(blankPeriod()) }
  const openEdit = (p: PeriodJoined) => { setMsg(''); setForm({
    id: p.id, project_id: p.project_id, status: p.status,
    period_start: p.period_start.slice(0, 10), period_end: p.period_end.slice(0, 10),
    corrections_limit: p.corrections_limit == null ? '' : String(p.corrections_limit), corrections_used: String(p.corrections_used),
    features_limit: p.features_limit == null ? '' : String(p.features_limit), features_used: String(p.features_used),
    requests_limit: p.requests_limit == null ? '' : String(p.requests_limit), requests_used: String(p.requests_used),
  }) }
  const pickProject = (projectId: string) => {
    const pr = (projects ?? []).find((p) => p.id === projectId)
    const pkg = (packages ?? []).find((k) => k.id === pr?.package_id)
    setForm((f) => f ? {
      ...f, project_id: projectId,
      corrections_limit: pkg?.corrections_limit == null ? '' : String(pkg.corrections_limit),
      features_limit: pkg?.features_limit == null ? '' : String(pkg.features_limit),
      requests_limit: pkg?.requests_limit == null ? '' : String(pkg.requests_limit),
    } : f)
  }
  const save = async () => {
    if (!form) return
    if (!form.project_id) return setMsg('Выберите проект')
    const row = {
      project_id: form.project_id, status: form.status, period_start: form.period_start, period_end: form.period_end,
      corrections_limit: num(form.corrections_limit), corrections_used: Number(form.corrections_used) || 0,
      features_limit: num(form.features_limit), features_used: Number(form.features_used) || 0,
      requests_limit: num(form.requests_limit), requests_used: Number(form.requests_used) || 0,
    }
    const { error } = form.id
      ? await supabase.from('package_periods').update(row).eq('id', form.id)
      : await supabase.from('package_periods').insert(row)
    if (error) return setMsg('Не удалось сохранить: ' + error.message)
    setForm(null); setMsg('Сохранено'); reload()
  }
  const activate = async (p: PeriodJoined) => {
    await supabase.from('package_periods').update({ status: 'expired' }).eq('project_id', p.project_id).eq('status', 'active')
    await supabase.from('package_periods').update({ status: 'active' }).eq('id', p.id)
    reload()
  }

  return (
    <div className="card">
      <div className="row"><h3 style={{ margin: 0 }}>Периоды</h3><span className="hint">остатки по пакетам</span><span className="sp" /><button className="btn primary" onClick={openCreate}><Icon name="plus" size={18} />Новый период</button></div>
      {msg && <div className="hint" role="status" style={{ marginTop: 6 }}>{msg}</div>}
      {rows === null ? <div className="hint">Загрузка…</div> : rows.length === 0 ? <div className="hint" style={{ marginTop: 10 }}>Периодов нет.</div> : (
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {rows.map((p) => (
            <div key={p.id} className="item" style={{ boxShadow: 'none' }}>
              <div className="row">
                <span className="chip">{PERIOD_STATUSES[p.status] ?? p.status}</span>
                <b>{rowName(p)}</b>
                <span className="hint">· {p.client_projects?.packages?.title ?? 'пакет не задан'} · {fmtDate(p.period_start)} — {fmtDate(p.period_end)}</span>
                <span className="sp" />
                <span className="hint">правки {left(p.corrections_limit, p.corrections_used)} из {limitLabel(p.corrections_limit)} · функции {left(p.features_limit, p.features_used)} · обращения {left(p.requests_limit, p.requests_used)}</span>
                {p.status !== 'active' && <button className="ibtn" title="Активировать" onClick={() => activate(p)}><Icon name="play" size={18} /></button>}
                <button className="ibtn" title="Редактировать" onClick={() => openEdit(p)}><Icon name="edit" size={18} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
      {form && (
        <div className="lx-ov" onClick={() => setForm(null)}>
          <div className="lx-modal" role="dialog" aria-modal="true" aria-label="Период" onClick={(e) => e.stopPropagation()}>
            <div className="lx-h"><b>{form.id ? 'Период' : 'Новый период'}</b><span className="sp" /><button type="button" className="x" onClick={() => setForm(null)} aria-label="Закрыть"><Icon name="close" size={18} /></button></div>
            <div className="lx-b">
              <div className="lx-grid">
                <div className="fld lx-wide"><label>Проект</label>
                  <select value={form.project_id} onChange={(e) => pickProject(e.target.value)}>
                    <option value="">— выберите —</option>
                    {(projects ?? []).map((p) => <option key={p.id} value={p.id}>{projName(p)} · {p.packages?.title ?? 'без пакета'}</option>)}
                  </select>
                </div>
                <div className="fld"><label>Статус</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as PackagePeriodRow['status'] })}>
                    {Object.entries(PERIOD_STATUSES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div className="fld"><label>Начало</label><input type="date" value={form.period_start} onChange={(e) => setForm({ ...form, period_start: e.target.value })} /></div>
                <div className="fld"><label>Конец</label><input type="date" value={form.period_end} onChange={(e) => setForm({ ...form, period_end: e.target.value })} /></div>
                <div className="fld"><label>Лимит правок</label><input value={form.corrections_limit} inputMode="numeric" onChange={(e) => setForm({ ...form, corrections_limit: e.target.value })} placeholder="пусто = ∞" /></div>
                <div className="fld"><label>Использовано правок</label><input value={form.corrections_used} inputMode="numeric" onChange={(e) => setForm({ ...form, corrections_used: e.target.value })} /></div>
                <div className="fld"><label>Лимит функций</label><input value={form.features_limit} inputMode="numeric" onChange={(e) => setForm({ ...form, features_limit: e.target.value })} placeholder="пусто = ∞" /></div>
                <div className="fld"><label>Использовано функций</label><input value={form.features_used} inputMode="numeric" onChange={(e) => setForm({ ...form, features_used: e.target.value })} /></div>
                <div className="fld"><label>Лимит обращений</label><input value={form.requests_limit} inputMode="numeric" onChange={(e) => setForm({ ...form, requests_limit: e.target.value })} placeholder="пусто = ∞" /></div>
                <div className="fld"><label>Использовано обращений</label><input value={form.requests_used} inputMode="numeric" onChange={(e) => setForm({ ...form, requests_used: e.target.value })} /></div>
              </div>
            </div>
            <div className="lx-f"><button className="btn" onClick={() => setForm(null)}>Отмена</button><span className="sp" /><button className="btn primary" onClick={save}>Сохранить</button></div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Обращения ───
type JobJoined = SupportJobRow & { clients: { name: string | null; tg_username: string | null } | null }

function JobsTab() {
  const { rows } = useTable<JobJoined>('support_jobs', 'created_at', 500, '*, clients(name, tg_username)')
  const [filter, setFilter] = useState('')
  const list = (rows ?? []).filter((j) => !filter || j.status === filter).slice().reverse()
  const who = (j: JobJoined) => j.clients?.name ?? (j.clients?.tg_username ? '@' + j.clients.tg_username : '—')
  return (
    <div className="card">
      <div className="row"><h3 style={{ margin: 0 }}>Обращения</h3><span className="hint">задачи, статусы, токены</span><span className="sp" />
        <select value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Статус">
          <option value="">Все статусы</option>
          {Object.entries(JOB_STATUSES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>
      {rows === null ? <div className="hint">Загрузка…</div> : list.length === 0 ? <div className="hint" style={{ marginTop: 10 }}>Обращений нет.</div> : (
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {list.map((j) => (
            <div key={j.id} className="item" style={{ boxShadow: 'none' }}>
              <div className="row"><span className="chip">{JOB_STATUSES[j.status] ?? j.status}</span><b>{who(j)}</b><span className="hint">· правок {j.edits_count} · токены {j.tokens_used} · создано {fmtDate(j.created_at)}{j.finished_at ? ' · выполнено ' + fmtDate(j.finished_at) : ''}</span><span className="sp" /><span className="hint">{j.voice_file_id ? 'голосовое' : 'текст'}</span></div>
              <div className="note" style={{ marginTop: 6 }}>{j.request_text || (j.result_json as { transcript?: string } | null)?.transcript || '—'}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Счета ───
type InvJoined = InvoiceRow & { clients: { name: string | null; client_kind: string | null; legal_name: string | null; unp: string | null; legal_address: string | null; bank_details: string | null } | null }

function InvoicesTab() {
  const { rows, reload } = useTable<InvJoined>('invoices', 'created_at', 500, '*, clients(name, client_kind, legal_name, unp, legal_address, bank_details)')
  const { rows: clients } = useTable<Client>('clients', 'created_at')
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ client_id: '', kind: 'period' as InvoiceRow['kind'], amount: '' })
  const [studio, setStudio] = useState('')
  const [msg, setMsg] = useState('')

  const loadStudio = () => { supabase.from('app_settings').select('value').eq('key', 'support.studio_requisites').maybeSingle().then(({ data }) => { if (data?.value) setStudio(data.value) }) }
  const selClient = (clients ?? []).find((c) => c.id === form.client_id)

  const save = async () => {
    if (!form.client_id || !num(form.amount)) return setMsg('Укажите клиента и сумму')
    const { error } = await supabase.from('invoices').insert({ client_id: form.client_id, kind: form.kind, amount: num(form.amount) })
    if (error) return setMsg('Не удалось создать счёт')
    setCreating(false); setForm({ client_id: '', kind: 'period', amount: '' }); setMsg('Счёт создан'); reload()
  }
  const confirm = async (inv: InvoiceRow) => {
    const { data: s } = await supabase.auth.getSession()
    const { error } = await supabase.from('invoices').update({ status: 'paid_confirmed', confirmed_by: s.session?.user.id ?? null, confirmed_at: new Date().toISOString() }).eq('id', inv.id)
    if (error) return setMsg('Не удалось подтвердить')
    setMsg('Оплата подтверждена'); reload()
  }

  const invoiceText = (inv: InvJoined) => {
    const c = inv.clients
    if (!c || c.client_kind !== 'legal') return null
    return ['Получатель: ' + (c.legal_name ?? '—'), 'УНП ' + (c.unp ?? '—'), c.legal_address ?? '', c.bank_details ?? '', 'Сумма: ' + money(inv.amount) + ' · ' + (INVOICE_KINDS[inv.kind] ?? inv.kind)].filter(Boolean).join('\n')
  }

  return (
    <div className="card">
      <div className="row"><h3 style={{ margin: 0 }}>Счета</h3><span className="sp" /><button className="btn primary" onClick={() => { setCreating(true); loadStudio() }}><Icon name="plus" size={18} />Счёт</button></div>
      {msg && <div className="hint" role="status" style={{ marginTop: 6 }}>{msg}</div>}
      {rows === null ? <div className="hint">Загрузка…</div> : rows.length === 0 ? <div className="hint" style={{ marginTop: 10 }}>Счетов нет.</div> : (
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {rows.map((inv) => (
            <div key={inv.id} className="item" style={{ boxShadow: 'none' }}>
              <div className="row"><b>{inv.clients?.name ?? 'Без имени'}</b><span className="chip">{INVOICE_KINDS[inv.kind] ?? inv.kind}</span><span className="chip">{INVOICE_STATUSES[inv.status] ?? inv.status}</span><span className="sp" /><b>{money(inv.amount)}</b>
                {inv.status === 'draft' && <button className="btn" onClick={() => confirm(inv)}>Подтвердить оплату</button>}
              </div>
              {invoiceText(inv) && <div className="note" style={{ marginTop: 6, whiteSpace: 'pre-line' }}>{invoiceText(inv)}</div>}
            </div>
          ))}
        </div>
      )}
      {creating && (
        <div className="lx-ov" onClick={() => setCreating(false)}>
          <div className="lx-modal" role="dialog" aria-modal="true" aria-label="Новый счёт" onClick={(e) => e.stopPropagation()}>
            <div className="lx-h"><b>Новый счёт</b><span className="sp" /><button type="button" className="x" onClick={() => setCreating(false)} aria-label="Закрыть"><Icon name="close" size={18} /></button></div>
            <div className="lx-b">
              <div className="lx-grid">
                <div className="fld"><label>Клиент</label>
                  <select value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value })}>
                    <option value="">—</option>
                    {(clients ?? []).map((c) => <option key={c.id} value={c.id}>{c.name ?? (c.tg_username ? '@' + c.tg_username : c.phone ?? 'Без имени')}{c.client_kind === 'legal' ? ' · юрлицо' : ''}</option>)}
                  </select></div>
                <div className="fld"><label>Назначение</label>
                  <select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value as InvoiceRow['kind'] })}>
                    {Object.entries(INVOICE_KINDS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select></div>
                <div className="fld"><label>Сумма, BYN</label><input value={form.amount} inputMode="decimal" onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
              </div>
              {selClient?.client_kind === 'legal' && (
                <div className="note" style={{ marginTop: 10, whiteSpace: 'pre-line' }}>Счёт для юрлица:
Получатель: {selClient.legal_name ?? '—'}
УНП {selClient.unp ?? '—'}
{selClient.legal_address ?? ''}
{selClient.bank_details ?? ''}
Студия: {studio || 'реквизиты не заданы'}
Сумма: {num(form.amount) ?? 0} BYN</div>
              )}
            </div>
            <div className="lx-f"><button className="btn" onClick={() => setCreating(false)}>Отмена</button><span className="sp" /><button className="btn primary" onClick={save}>Создать</button></div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Настройки ───
function SettingsTab() {
  const [link, setLink] = useState('')
  const [studio, setStudio] = useState('')
  const [oneoff, setOneoff] = useState('')
  const [msg, setMsg] = useState('')
  const load = () => {
    supabase.from('app_settings').select('key, value').in('key', ['support.payment_link', 'support.studio_requisites', 'support.oneoff_price'])
      .then(({ data }) => {
        const get = (k: string) => (data ?? []).find((r: { key: string; value: string }) => r.key === k)?.value ?? ''
        setLink(get('support.payment_link')); setStudio(get('support.studio_requisites')); setOneoff(get('support.oneoff_price'))
      })
  }
  useEffect(load, [])
  const save = async () => {
    const rows = [
      { key: 'support.payment_link', value: link.trim() },
      { key: 'support.studio_requisites', value: studio.trim() },
      { key: 'support.oneoff_price', value: oneoff.trim() },
    ]
    const { error } = await supabase.from('app_settings').upsert(rows, { onConflict: 'key' })
    if (error) return setMsg('Не удалось сохранить')
    setMsg('Сохранено')
  }
  return (
    <div className="card">
      <h3>Настройки поддержки</h3>
      {msg && <div className="hint" role="status">{msg}</div>}
      <div className="fld"><label>Ссылка на оплату (физлицо)</label><input value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://…" /></div>
      <div className="fld"><label>Реквизиты студии (для счёта)</label><textarea rows={3} value={studio} onChange={(e) => setStudio(e.target.value)} placeholder="ООО «КИНГСГАРДЕН», УНП 193999293, адрес, р/с" /></div>
      <div className="fld"><label>Разовая цена функции, BYN</label><input value={oneoff} inputMode="decimal" onChange={(e) => setOneoff(e.target.value)} /></div>
      <div className="row" style={{ marginTop: 10 }}><button className="btn primary" onClick={save}>Сохранить</button></div>
    </div>
  )
}

export default function SupportPage() {
  const { email } = useAuth()
  const [tab, setTab] = useState<Tab>('projects')
  return (
    <div className="wrap">
      <h1 className="h1">Поддержка <span className="hint" style={{ fontWeight: 400, fontSize: 14 }}>{email}</span></h1>
      <div className="row" style={{ gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
        {TABS.map((t) => (
          <button key={t.id} type="button" className={tab === t.id ? 'btn primary' : 'btn'} onClick={() => setTab(t.id)}>{t.label}</button>
        ))}
      </div>
      {tab === 'projects' && <ProjectsTab />}
      {tab === 'periods' && <PeriodsTab />}
      {tab === 'packages' && <PackagesTab />}
      {tab === 'jobs' && <JobsTab />}
      {tab === 'invoices' && <InvoicesTab />}
      {tab === 'settings' && <SettingsTab />}
    </div>
  )
}

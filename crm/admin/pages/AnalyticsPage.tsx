import { useCallback, useEffect, useMemo, useState } from 'react'
import { callApi } from '../api'
import { supabase } from '../supabase'
import { Icon } from '../ui/Icon'
import { KIND_OPTIONS } from '../ui/Seg'
import { DEFAULT_PRICES, PRICE_SETTING, TEMPLATE_EVENT_LABEL, costUsd, featureLabel, parsePrices, periodStart, popularityScore, priceOf, ratings, type Price } from '../../server/usage'
import { TPL_KINDS, type TemplateKind } from '../../server/templates'
import './analytics.css'

type LlmRow = { model: string; feature: string; calls: number; prompt_tokens: number; completion_tokens: number; total_tokens: number; estimated_calls: number }
type TplRow = { template_id: string; views: number; uses: number; funnels: number; broadcasts: number }
type Tpl = { id: string; title: string; kind: TemplateKind }
type Period = '7' | '30' | '90' | 'all' | 'custom'

const PERIODS: [Period, string][] = [['7', '7 дней'], ['30', '30 дней'], ['90', '90 дней'], ['all', 'Всё время'], ['custom', 'Свой период']]
const nf = new Intl.NumberFormat('ru-RU')
const num = (n: number) => nf.format(Math.round(n))
const usd = (n: number) => `≈ $${n < 1 ? n.toFixed(4) : n.toFixed(2)}`
const fromDay = (d: string) => new Date(`${d}T00:00:00+03:00`).toISOString()
const toDay = (d: string) => new Date(new Date(`${d}T00:00:00+03:00`).getTime() + 86_400_000).toISOString()

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>('30')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [llm, setLlm] = useState<LlmRow[] | null>(null)
  const [tplStats, setTplStats] = useState<TplRow[] | null>(null)
  const [tpls, setTpls] = useState<Tpl[]>([])
  const [prices, setPrices] = useState<Record<string, Price>>({})
  const [error, setError] = useState('')

  const range = useMemo(() => {
    if (period === 'all') return { p_from: null, p_to: null }
    if (period === 'custom') return { p_from: from ? fromDay(from) : null, p_to: to ? toDay(to) : null }
    return { p_from: periodStart(Number(period)), p_to: null }
  }, [period, from, to])

  const load = useCallback(async () => {
    setError('')
    const [a, b, c, d] = await Promise.all([
      supabase.rpc('analytics_llm', range),
      supabase.rpc('analytics_templates', range),
      supabase.from('templates').select('id, title, kind'),
      supabase.from('app_settings').select('value').eq('key', PRICE_SETTING).maybeSingle(),
    ])
    if (a.error || b.error || c.error) return setError('Не удалось загрузить аналитику')
    setLlm(((a.data ?? []) as LlmRow[]).map((r) => ({ ...r, calls: +r.calls, prompt_tokens: +r.prompt_tokens, completion_tokens: +r.completion_tokens, total_tokens: +r.total_tokens, estimated_calls: +r.estimated_calls })))
    setTplStats(((b.data ?? []) as TplRow[]).map((r) => ({ ...r, views: +r.views, uses: +r.uses, funnels: +r.funnels, broadcasts: +r.broadcasts })))
    setTpls((c.data ?? []) as Tpl[])
    setPrices(parsePrices(typeof d.data?.value === 'string' ? d.data.value : d.data?.value ? JSON.stringify(d.data.value) : null))
  }, [range])
  useEffect(() => { void load() }, [load])

  // ───────── ИИ: по моделям и по функциям ─────────
  const ai = useMemo(() => {
    const rows = llm ?? []
    const cost = (r: LlmRow) => costUsd(r.model, r.prompt_tokens, r.completion_tokens, prices)
    const agg = <K extends 'model' | 'feature'>(key: K) => {
      const m = new Map<string, { key: string; calls: number; inp: number; out: number; total: number; cost: number; unpriced: number; by: Map<string, number> }>()
      for (const r of rows) {
        const k = r[key]
        const x = m.get(k) ?? { key: k, calls: 0, inp: 0, out: 0, total: 0, cost: 0, unpriced: 0, by: new Map() }
        const c = cost(r)
        x.calls += r.calls; x.inp += r.prompt_tokens; x.out += r.completion_tokens; x.total += r.total_tokens
        if (c == null) x.unpriced += r.total_tokens; else x.cost += c
        const other = key === 'model' ? r.feature : r.model
        x.by.set(other, (x.by.get(other) ?? 0) + r.total_tokens)
        m.set(k, x)
      }
      return [...m.values()].sort((a, b) => b.total - a.total)
    }
    const totals = rows.reduce((t, r) => { const c = cost(r); return { calls: t.calls + r.calls, inp: t.inp + r.prompt_tokens, out: t.out + r.completion_tokens, total: t.total + r.total_tokens, cost: t.cost + (c ?? 0), unpriced: t.unpriced + (c == null ? r.total_tokens : 0), estimated: t.estimated + r.estimated_calls } }, { calls: 0, inp: 0, out: 0, total: 0, cost: 0, unpriced: 0, estimated: 0 })
    return { byModel: agg('model'), byFeature: agg('feature'), totals }
  }, [llm, prices])

  // ───────── Шаблоны ─────────
  const tpl = useMemo(() => {
    const st = new Map((tplStats ?? []).map((r) => [r.template_id, r]))
    const list = tpls.map((t) => { const s = st.get(t.id) ?? { views: 0, uses: 0, funnels: 0, broadcasts: 0 }; return { ...t, ...s, score: popularityScore(s) } })
    const rt = ratings(list.map((x) => x.score))
    const rows = list.map((x, i) => ({ ...x, ...rt[i]! })).sort((a, b) => b.score - a.score)
    const sum = rows.reduce((t, r) => ({ views: t.views + r.views, uses: t.uses + r.uses, funnels: t.funnels + r.funnels, broadcasts: t.broadcasts + r.broadcasts }), { views: 0, uses: 0, funnels: 0, broadcasts: 0 })
    return { rows, sum }
  }, [tplStats, tpls])

  // ───────── Цены ─────────
  const modelNames = useMemo(() => [...new Set([...Object.keys(DEFAULT_PRICES), ...Object.keys(prices), ...ai.byModel.map((m) => m.key)])], [ai.byModel, prices])
  const [draft, setDraft] = useState<Record<string, { in: string; out: string }>>({})
  const [priceMsg, setPriceMsg] = useState('')
  useEffect(() => { setDraft(Object.fromEntries(modelNames.map((m) => { const p = priceOf(m, prices); return [m, { in: p ? String(p.in) : '', out: p ? String(p.out) : '' }] }))) }, [modelNames, prices])
  const savePrices = async () => {
    const body: Record<string, { in: number; out: number }> = {}
    for (const [m, v] of Object.entries(draft)) if (v.in !== '' && v.out !== '' && Number.isFinite(+v.in) && Number.isFinite(+v.out)) body[m] = { in: +v.in, out: +v.out }
    const r = await callApi('/api/analytics-admin', { action: 'save_prices', prices: body })
    if (!r.ok) return setPriceMsg(r.error)
    setPriceMsg('Цены сохранены, расход пересчитан'); void load()
  }

  const maxFeature = Math.max(1, ...ai.byFeature.map((f) => f.total))
  const empty = llm !== null && ai.totals.calls === 0

  return (
    <div className="wrap an">
      <h1 className="h1">Аналитика</h1>
      <div className="card an-bar">
        <div className="chips" role="group" aria-label="Период">
          {PERIODS.map(([k, l]) => <button key={k} type="button" className={period === k ? 'on' : ''} aria-pressed={period === k} onClick={() => setPeriod(k)}>{l}</button>)}
        </div>
        {period === 'custom' && (
          <div className="an-dates">
            <div className="fld"><label>С</label><input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
            <div className="fld"><label>По</label><input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
          </div>
        )}
        <div className="hint">Время по Минску. Учёт токенов ведётся с 20 октября 2026: более ранние обращения к ИИ не записывались.</div>
      </div>
      {error && <div className="err" role="alert">{error}</div>}
      {llm === null && !error && <div className="empty">Загрузка…</div>}

      {llm !== null && (
        <>
          <section className="card">
            <h3>Общий расход за период</h3>
            <div className="an-tot">
              <div className="an-stat big"><span>Токены</span><b>{num(ai.totals.total)}</b><small>вход {num(ai.totals.inp)} · выход {num(ai.totals.out)}</small></div>
              <div className="an-stat big"><span>Эквивалент в деньгах</span><b>{usd(ai.totals.cost)}</b><small>{ai.totals.unpriced ? `без учёта ${num(ai.totals.unpriced)} токенов: нет цены модели` : 'по тарифам платного доступа'}</small></div>
              <div className="an-stat"><span>Обращений к ИИ</span><b>{num(ai.totals.calls)}</b><small>{ai.totals.estimated ? `${num(ai.totals.estimated)} с оценкой токенов` : 'токены от провайдера'}</small></div>
              <div className="an-stat"><span>Отправок шаблонов</span><b>{num(tpl.sum.uses)}</b></div>
              <div className="an-stat"><span>Просмотров шаблонов</span><b>{num(tpl.sum.views)}</b></div>
              <div className="an-stat"><span>Добавлено в воронки</span><b>{num(tpl.sum.funnels)}</b></div>
              <div className="an-stat"><span>Добавлено в рассылки</span><b>{num(tpl.sum.broadcasts)}</b></div>
            </div>
            <div className="hint">Сейчас модели Google работают на бесплатном тарифе, фактически вы платите $0. Сумма показывает, сколько стоил бы этот же расход на платном тарифе.</div>
          </section>

          <section className="card">
            <h3>Функции, где использовался ИИ</h3>
            {empty && <div className="empty">За этот период обращений к ИИ не было. Расход появится после заданий агента и переводов.</div>}
            <div className="an-feat">
              {ai.byFeature.map((f) => (
                <div className="an-fc" key={f.key}>
                  <div className="an-fh"><b>{featureLabel(f.key)}</b><span className="hint">{num(f.calls)} обращ.</span></div>
                  <div className="an-fn"><span className="an-tok">{num(f.total)}</span><span className="an-unit">токенов</span><span className="an-cost">{f.unpriced && !f.cost ? 'цена не задана' : usd(f.cost)}</span></div>
                  <div className="an-bar1" aria-hidden="true"><i style={{ width: `${Math.max(3, (f.total / maxFeature) * 100)}%` }} /></div>
                  <div className="hint">вход {num(f.inp)} · выход {num(f.out)}</div>
                  <div className="chips an-by">{[...f.by.entries()].sort((a, b) => b[1] - a[1]).map(([m, t]) => <span className="chip" key={m}>{m}: {num(t)}</span>)}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="card">
            <h3>Модели ИИ</h3>
            {empty ? <div className="empty">Нет данных за период.</div> : (
              <div className="an-scroll">
                <table className="tbl an-tbl">
                  <thead><tr><th>Модель</th><th className="r">Обращений</th><th className="r">Вход</th><th className="r">Выход</th><th className="r">Всего токенов</th><th className="r">Эквивалент</th></tr></thead>
                  <tbody>
                    {ai.byModel.map((m) => (
                      <tr key={m.key}>
                        <td><b>{m.key}</b><div className="hint">{[...m.by.entries()].sort((a, b) => b[1] - a[1]).map(([f, t]) => `${featureLabel(f)}: ${num(t)}`).join(' · ')}</div></td>
                        <td className="r">{num(m.calls)}</td><td className="r">{num(m.inp)}</td><td className="r">{num(m.out)}</td><td className="r"><b>{num(m.total)}</b></td>
                        <td className="r">{m.unpriced && !m.cost ? <span className="hint">нет цены</span> : usd(m.cost)}</td>
                      </tr>
                    ))}
                    <tr className="an-sum"><td><b>Итого</b></td><td className="r">{num(ai.totals.calls)}</td><td className="r">{num(ai.totals.inp)}</td><td className="r">{num(ai.totals.out)}</td><td className="r"><b>{num(ai.totals.total)}</b></td><td className="r"><b>{usd(ai.totals.cost)}</b></td></tr>
                  </tbody>
                </table>
              </div>
            )}
            <details className="an-prices">
              <summary>Цены токенов (доллары за 1 млн)</summary>
              <div className="hint">Цены Google взяты со страницы ai.google.dev/gemini-api/docs/pricing. Для своих моделей и если тариф изменился, впишите цену сами.{' '}
                {modelNames.some((m) => DEFAULT_PRICES[m]?.estimate && !prices[m]) && 'У gemini-3.1-flash-lite цена на странице не указана, подставлена как у 3.5 Flash-Lite: уточните.'}</div>
              <div className="an-pg">
                {modelNames.map((m) => (
                  <div className="an-pr" key={m}>
                    <b>{m}</b>
                    <label>вход<input inputMode="decimal" value={draft[m]?.in ?? ''} onChange={(e) => setDraft({ ...draft, [m]: { in: e.target.value, out: draft[m]?.out ?? '' } })} /></label>
                    <label>выход<input inputMode="decimal" value={draft[m]?.out ?? ''} onChange={(e) => setDraft({ ...draft, [m]: { in: draft[m]?.in ?? '', out: e.target.value } })} /></label>
                  </div>
                ))}
              </div>
              <div className="row"><button type="button" className="btn primary" onClick={savePrices}>Сохранить цены</button>{priceMsg && <span className="hint" role="status">{priceMsg}</span>}</div>
            </details>
          </section>

          <section className="card">
            <h3>Шаблоны: популярность</h3>
            <div className="hint">Рейтинг 0–100 считается от самого популярного шаблона: отправка клиенту весит 5, добавление в воронку или рассылку 3, просмотр 1.</div>
            {tpl.rows.length === 0 && <div className="empty">Шаблонов пока нет.</div>}
            {tpl.rows.length > 0 && (
              <div className="an-scroll">
                <table className="tbl an-tbl">
                  <thead><tr><th>Шаблон</th><th>Рейтинг</th><th className="r">{TEMPLATE_EVENT_LABEL.use}</th><th className="r">{TEMPLATE_EVENT_LABEL.view}</th><th className="r">{TEMPLATE_EVENT_LABEL.funnel}</th><th className="r">{TEMPLATE_EVENT_LABEL.broadcast}</th></tr></thead>
                  <tbody>
                    {tpl.rows.map((t) => {
                      const o = KIND_OPTIONS.find((k) => k.value === t.kind)
                      return (
                        <tr key={t.id}>
                          <td><span className="an-tt">{o?.icon && <Icon name={o.icon} size={16} />}<b>{t.title}</b></span><div className="hint">{TPL_KINDS[t.kind]}</div></td>
                          <td><div className="an-rate" title={`${t.pct} из 100`}><i style={{ width: `${t.pct}%` }} /></div><span className="hint">{t.pct}{t.stars > 0 ? ` · ${'★'.repeat(t.stars)}` : ''}</span></td>
                          <td className="r">{num(t.uses)}</td><td className="r">{num(t.views)}</td><td className="r">{num(t.funnels)}</td><td className="r">{num(t.broadcasts)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}

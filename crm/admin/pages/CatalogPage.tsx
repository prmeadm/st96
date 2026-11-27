import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../supabase'
import { fmtDate } from '../types'
import { MediaField } from '../ui/MediaField'
import { Icon } from '../ui/Icon'
import './catalog.css'

type CatalogButton = { label: string; action: 'cart' | 'discuss' | 'link'; href?: string }
type CatalogRow = {
  id: string
  kind: 'service' | 'product'
  slug: string
  title: string
  description: string | null
  price: number | null
  currency: string
  buttons: CatalogButton[]
  media_type: 'photo' | 'video' | null
  media_url: string | null
  page: string
  sort: number
  active: boolean
  created_at: string
  updated_at: string
}

const PAGES = [
  { value: 'home', label: 'Главная' },
  { value: 'producing', label: 'Продюсирование' },
  { value: 'promotion', label: 'Промоушн' },
  { value: 'production', label: 'Продакшн' },
  { value: 'ai', label: 'AI-разработка' },
  { value: 'support', label: 'Поддержка' },
]
const pageLabel = (v: string) => PAGES.find((p) => p.value === v)?.label ?? v

const TRANSLIT: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
}
const slugify = (s: string) =>
  s.toLowerCase().trim().split('').map((ch) => TRANSLIT[ch] ?? ch).join('')
    .replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '')

type Draft = {
  id?: string
  kind: 'service' | 'product'
  slug: string
  title: string
  description: string
  price: string
  currency: string
  buttons: CatalogButton[]
  media_type: 'photo' | 'video' | null
  media_url: string
  page: string
  sort: string
  active: boolean
}

const blank = (): Draft => ({
  kind: 'service', slug: '', title: '', description: '', price: '', currency: 'BYN',
  buttons: [{ label: 'Заказать', action: 'cart' }, { label: 'Обсудить проект', action: 'discuss' }],
  media_type: null, media_url: '', page: 'home', sort: '', active: true,
})

const toDraft = (r: CatalogRow): Draft => ({
  id: r.id, kind: r.kind, slug: r.slug, title: r.title, description: r.description ?? '', price: r.price == null ? '' : String(r.price),
  currency: r.currency || 'BYN', buttons: r.buttons ?? [], media_type: r.media_type, media_url: r.media_url ?? '', page: r.page, sort: String(r.sort ?? 0), active: r.active,
})

export default function CatalogPage() {
  const [rows, setRows] = useState<CatalogRow[] | null>(null)
  const [error, setError] = useState('')
  const [q, setQ] = useState('')
  const [kind, setKind] = useState<'' | 'service' | 'product'>('')
  const [page, setPage] = useState('')
  const [edit, setEdit] = useState<Draft | null>(null)

  const load = () =>
    supabase.from('catalog_items').select('*').order('page').order('sort').order('created_at')
      .then(({ data, error: e }) => (e ? setError('Не удалось загрузить каталог') : setRows((data ?? []) as CatalogRow[])))

  useEffect(() => { void load() }, [])

  const list = useMemo(() => [...(rows ?? [])].filter((r) =>
    (!kind || r.kind === kind)
    && (!page || r.page === page)
    && (!q.trim() || (r.title + ' ' + r.slug + ' ' + (r.description ?? '')).toLowerCase().includes(q.trim().toLowerCase()))), [rows, kind, page, q])

  const save = async (d: Draft) => {
    const price = d.price.trim() === '' ? null : Number(d.price)
    if (price != null && !Number.isFinite(price)) return setError('Цена должна быть числом')
    const row = {
      kind: d.kind, slug: d.slug.trim(), title: d.title.trim(), description: d.description.trim() || null,
      price, currency: d.currency || 'BYN', buttons: d.buttons, media_type: d.media_type, media_url: d.media_url.trim() || null,
      page: d.page, sort: Number(d.sort) || 0, active: d.active,
    }
    const r = d.id ? await supabase.from('catalog_items').update(row).eq('id', d.id) : await supabase.from('catalog_items').insert(row)
    if (r.error) return setError('Не удалось сохранить позицию: ' + (r.error.message || 'ошибка'))
    setError(''); setEdit(null); await load()
  }

  const remove = async (d: Draft) => {
    if (!d.id || !confirm('Удалить позицию «' + d.title + '»?')) return
    const { error: e } = await supabase.from('catalog_items').delete().eq('id', d.id)
    if (e) return setError('Не удалось удалить позицию')
    setEdit(null); await load()
  }

  const toggleActive = async (r: CatalogRow) => {
    setRows((x) => x && x.map((t) => (t.id === r.id ? { ...t, active: !t.active } : t)))
    const { error: e } = await supabase.from('catalog_items').update({ active: !r.active }).eq('id', r.id)
    if (e) { setError('Не удалось изменить видимость'); void load() }
  }

  return (
    <div className="wrap cat">
      <h1 className="h1">Каталог <span className="chip">{rows?.length ?? '…'}</span><span className="sp" /><button className="btn primary" onClick={() => setEdit(blank())}><Icon name="plus" size={18} />Новая позиция</button></h1>
      <div className="hint">Услуги и продукты компании. Позиции выводятся на выбранной странице сайта; кнопка «Заказать» кладёт их в корзину кабинета. Пустая цена — на сайте не выводится.</div>
      {error && <div className="err" role="alert">{error}</div>}

      <div className="tbar">
        <input type="search" placeholder="Поиск по названию или описанию" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={kind} onChange={(e) => setKind(e.target.value as '' | 'service' | 'product')} aria-label="Вид">
          <option value="">Все</option>
          <option value="service">Услуги</option>
          <option value="product">Продукты</option>
        </select>
        <select value={page} onChange={(e) => setPage(e.target.value)} aria-label="Страница">
          <option value="">Все страницы</option>
          {PAGES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
      </div>

      {rows === null && !error && <div className="empty">Загрузка…</div>}
      {rows && rows.length === 0 && <div className="empty">Каталог пуст. Нажмите «+ Новая позиция».</div>}
      {rows && rows.length > 0 && list.length === 0 && <div className="empty">Ничего не найдено.</div>}

      <div className="grid">
        {list.map((r) => (
          <div key={r.id} className="card">
            <div className="row">
              <span className={'chip ' + (r.kind === 'service' ? 'violet' : 'green')}>{r.kind === 'service' ? 'Услуга' : 'Продукт'}</span>
              <span className="chip">{pageLabel(r.page)}</span>
              <span className="chip amber">{r.price == null ? 'без цены' : r.price + ' ' + r.currency}</span>
              <span className="sp" />
              <button className={'star' + (r.active ? ' on' : '')} title={r.active ? 'Скрыть' : 'Показать'} aria-label={r.active ? 'Скрыть' : 'Показать'} onClick={() => void toggleActive(r)}><Icon name={r.active ? 'check' : 'minus'} size={18} /></button>
              <button type="button" className="ibtn sm" title="Изменить" aria-label="Изменить" onClick={() => setEdit(toDraft(r))}><Icon name="edit" size={18} /></button>
              <button type="button" className="ibtn sm danger" title="Удалить" aria-label="Удалить" onClick={() => void remove(toDraft(r))}><Icon name="trash" size={18} /></button>
            </div>
            <b>{r.title}</b>
            {r.media_url && <img className="thumb" src={r.media_url} alt={r.title} />}
            {r.description && <div className="tex">{r.description}</div>}
            <div className="hint">/{r.slug} · обновлено {fmtDate(r.updated_at)}</div>
          </div>
        ))}
      </div>

      {edit && <Editor d={edit} onSave={save} onClose={() => setEdit(null)} onDelete={remove} />}
    </div>
  )
}

function Editor({ d: init, onSave, onClose, onDelete }: { d: Draft; onSave: (d: Draft) => Promise<void>; onClose: () => void; onDelete: (d: Draft) => void }) {
  const [d, setD] = useState(init)
  const [busy, setBusy] = useState(false)
  const up = (p: Partial<Draft>) => setD({ ...d, ...p })
  const upBtn = (i: number, p: Partial<CatalogButton>) => setD({ ...d, buttons: d.buttons.map((b, j) => (j === i ? { ...b, ...p } : b)) })
  const addBtn = () => setD({ ...d, buttons: [...d.buttons, { label: '', action: 'cart' }] })
  const delBtn = (i: number) => setD({ ...d, buttons: d.buttons.filter((_, j) => j !== i) })
  const missing = [!d.title.trim() && 'название', !d.slug.trim() && 'адрес (slug)'].filter(Boolean) as string[]

  return (
    <div className="ov" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="mh"><b>{d.id ? 'Позиция каталога' : 'Новая позиция'}</b><span className="sp" /><button className="x" onClick={onClose} aria-label="Закрыть"><Icon name="close" size={18} /></button></div>
        <div className="mb">
          <div className="fld"><label>Тип</label>
            <div className="chips">
              <button className={d.kind === 'service' ? 'on' : ''} onClick={() => up({ kind: 'service' })}>Услуга</button>
              <button className={d.kind === 'product' ? 'on' : ''} onClick={() => up({ kind: 'product' })}>Продукт</button>
            </div>
          </div>
          <div className="fld"><label>Заголовок</label><input type="text" value={d.title} onChange={(e) => up({ title: e.target.value, slug: d.slug || slugify(e.target.value) })} placeholder="Например, «Разработка сайта»" /></div>
          <div className="fld"><label>Адрес (slug)</label><input type="text" value={d.slug} onChange={(e) => up({ slug: e.target.value })} placeholder="razrabotka-sajta" /></div>
          <div className="fld"><label>Описание</label><textarea value={d.description} onChange={(e) => up({ description: e.target.value })} /></div>
          <div className="fld"><label>Цена, BYN <small>пусто — цена не выводится</small></label><input type="number" min="0" step="0.01" value={d.price} onChange={(e) => up({ price: e.target.value })} placeholder="Например, 500" /></div>
          <div className="fld"><label>Страница вывода</label><select value={d.page} onChange={(e) => up({ page: e.target.value })}>{PAGES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}</select></div>
          <div className="fld"><label>Порядок</label><input type="number" value={d.sort} onChange={(e) => up({ sort: e.target.value })} /></div>
          <div className="fld"><label>Медиа</label>
            <div className="chips">
              <button className={d.media_type == null ? 'on' : ''} onClick={() => up({ media_type: null })}>Без медиа</button>
              <button className={d.media_type === 'photo' ? 'on' : ''} onClick={() => up({ media_type: 'photo' })}>Фото</button>
              <button className={d.media_type === 'video' ? 'on' : ''} onClick={() => up({ media_type: 'video' })}>Видео</button>
            </div>
            {d.media_type && <MediaField kind={d.media_type} value={d.media_url} onChange={(url) => up({ media_url: url })} folder="catalog" />}
          </div>
          <div className="fld"><label>Кнопки</label>
            {d.buttons.map((b, i) => (
              <div key={i} className="row">
                <input type="text" value={b.label} onChange={(e) => upBtn(i, { label: e.target.value })} placeholder="Текст кнопки" style={{ flex: 1 }} />
                <select value={b.action} onChange={(e) => upBtn(i, { action: e.target.value as CatalogButton['action'] })}>
                  <option value="cart">Заказать</option>
                  <option value="discuss">Обсудить проект</option>
                  <option value="link">Ссылка</option>
                </select>
                {b.action === 'link' && <input type="text" value={b.href ?? ''} onChange={(e) => upBtn(i, { href: e.target.value })} placeholder="https://…" />}
                <button type="button" className="ibtn sm danger" onClick={() => delBtn(i)} aria-label="Убрать кнопку"><Icon name="close" size={16} /></button>
              </div>
            ))}
            <button type="button" className="btn" onClick={addBtn}><Icon name="plus" size={16} />Кнопка</button>
          </div>
          <label className="fld" style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <input type="checkbox" checked={d.active} onChange={(e) => up({ active: e.target.checked })} />
            <span>Показывать на сайте</span>
          </label>
        </div>
        <div className="mf">
          {d.id && <button className="btn danger" onClick={() => onDelete(d)}>Удалить</button>}
          <span className="sp" />
          <button className="btn primary" disabled={busy || missing.length > 0} title={missing.length ? 'Заполните: ' + missing.join(', ') : ''}
            onClick={async () => { setBusy(true); await onSave(d); setBusy(false) }}>Сохранить</button>
        </div>
      </div>
    </div>
  )
}

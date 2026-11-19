import { useEffect, useMemo, useRef, useState } from 'react'
import './phone-field.css'

type Lib = typeof import('libphonenumber-js/min')
type Examples = typeof import('libphonenumber-js/examples.mobile.json')
const COUNTRY_KEY = 'st96-phone-country'

// Библиотека (~80 КБ) грузится только когда поле появилось на странице
let libPromise: Promise<{ lib: Lib; examples: Examples['default'] }> | null = null
const loadLib = () => (libPromise ??= Promise.all([import('libphonenumber-js/min'), import('libphonenumber-js/examples.mobile.json')]).then(([lib, ex]) => ({ lib, examples: ex.default })))

const flag = (c: string) => String.fromCodePoint(...[...c].map((ch) => 0x1f1e6 + ch.charCodeAt(0) - 65))

/** Страна по IP (api/geo), запасной вариант: регион языка браузера, затем Беларусь */
async function detectCountry(): Promise<string> {
  try { const saved = localStorage.getItem(COUNTRY_KEY); if (saved) return saved } catch { /* необязательно */ }
  let c: string | null = null
  try { c = ((await (await fetch('/api/geo')).json()) as { country: string | null }).country } catch { /* нет связи */ }
  if (!c) c = (navigator.languages?.[0] ?? navigator.language ?? '').split('-')[1]?.toUpperCase() ?? null
  return c && /^[A-Z]{2}$/.test(c) ? c : 'BY'
}

/**
 * Телефон с маской страны. Отдаёт номер в международном виде (+375291234567) или пустую строку, пока номер не введён.
 * Страна определяется сама; цифр можно ввести не больше, чем допускает номер этой страны; полный номер с «+» при вставке сам выбирает страну.
 */
export function PhoneField({ value, onChange, lang = 'ru', className = '', inputClassName = '', selectClassName = '', placeholder, id, 'aria-label': ariaLabel, required }: {
  value: string
  onChange: (e164: string) => void
  lang?: 'ru' | 'en'
  className?: string
  inputClassName?: string
  selectClassName?: string
  placeholder?: string
  id?: string
  'aria-label'?: string
  required?: boolean
}) {
  const [ready, setReady] = useState<{ lib: Lib; examples: Examples['default'] } | null>(null)
  const [country, setCountry] = useState('')
  const [typed, setTyped] = useState('') // цифры, как их набрал человек (вместе с «8» или «0» в начале)
  const last = useRef(value)
  const plain = useRef<HTMLInputElement>(null)
  const [want, setWant] = useState(false) // библиотеку грузим, когда поле видно или в него нажали, а не при открытии страницы

  useEffect(() => {
    const el = plain.current
    if (!el || want) return
    if (typeof IntersectionObserver === 'undefined') return setWant(true)
    const io = new IntersectionObserver((e) => { if (e.some((x) => x.isIntersecting)) { setWant(true); io.disconnect() } }, { rootMargin: '300px' })
    io.observe(el)
    return () => io.disconnect()
  }, [want])
  useEffect(() => { if (want) void loadLib().then(setReady) }, [want])

  // Начальное значение: страна из уже введённого номера, иначе по IP
  useEffect(() => {
    if (!ready || country) return
    const p = value ? ready.lib.parsePhoneNumberFromString(value) : undefined
    if (p?.country) { setCountry(p.country); setTyped(p.nationalNumber); return }
    void detectCountry().then((c) => setCountry(c))
  }, [ready, country, value])

  // Значение изменили снаружи (подгрузили из карточки): показываем его
  useEffect(() => {
    if (!ready || value === last.current) return
    last.current = value
    if (!value) { setTyped(''); return }
    const p = ready.lib.parsePhoneNumberFromString(value)
    if (p?.country) { setCountry(p.country); setTyped(p.nationalNumber) }
  }, [value, ready])

  const countries = useMemo(() => {
    if (!ready) return []
    const names = new Intl.DisplayNames([lang], { type: 'region' })
    return ready.lib.getCountries().map((c) => ({ c, name: names.of(c) ?? c, code: ready.lib.getCountryCallingCode(c) })).sort((a, b) => a.name.localeCompare(b.name, lang))
  }, [ready, lang])

  const emit = (e164: string) => { last.current = e164; onChange(e164) }

  if (!ready || !country) {
    // пока библиотека грузится: обычное поле, ввод не теряется
    return <input ref={plain} onFocus={() => setWant(true)} id={id} type="tel" inputMode="tel" autoComplete="tel" className={`${inputClassName} pf-plain`} value={value} placeholder={placeholder ?? '+375 29 000-00-00'} aria-label={ariaLabel} required={required} onChange={(e) => emit(e.target.value)} />
  }

  const { lib, examples } = ready
  const code = lib.getCountryCallingCode(country as never)
  // Национальная часть номера без «8»/«0» в начале и её вид с маской страны: +375 [29 123 45 67]
  const nat = (c: string, digits: string) => { const t = new lib.AsYouType(c as never); t.input(digits); return t.getNumber()?.nationalNumber ?? digits }
  const mask = (c: string, national: string) => (national ? new lib.AsYouType().input(`+${lib.getCountryCallingCode(c as never)}${national}`).replace(/^\+\d+\s?/, '') : '')
  const shown = mask(country, nat(country, typed))
  const example = (() => { const e = lib.getExampleNumber(country as never, examples)?.formatInternational(); return e ? e.replace(/^\+\d+\s?/, '') : '' })()

  const apply = (c: string, digits: string) => {
    const n = nat(c, digits)
    // больше цифр, чем в маске страны (длина мобильного номера этой страны), ввести нельзя
    const max = lib.getExampleNumber(c as never, examples)?.nationalNumber.length
    if (n && ((max && n.length > max) || lib.validatePhoneNumberLength(`+${lib.getCountryCallingCode(c as never)}${n}`) === 'TOO_LONG')) return false
    setTyped(digits)
    emit(n ? `+${lib.getCountryCallingCode(c as never)}${n}` : '')
    return true
  }
  const handle = (text: string) => {
    // Полный номер с «+» (вставка): страна выбирается по коду
    if (text.trim().startsWith('+')) {
      const p = lib.parsePhoneNumberFromString(text)
      const cc = p?.country
      if (cc) { setCountry(cc); try { localStorage.setItem(COUNTRY_KEY, cc) } catch { /* необязательно */ } setTyped(p.nationalNumber); emit(p.number); return }
    }
    const digits = text.replace(/\D/g, '')
    const shownDigits = shown.replace(/\D/g, '')
    // дописали в конец: добавляем к набранному; правили посередине или стирали: берём то, что видно
    const next = digits.length > shownDigits.length && digits.startsWith(shownDigits) ? typed + digits.slice(shownDigits.length) : digits
    apply(country, next)
  }
  const pick = (c: string) => {
    setCountry(c)
    try { localStorage.setItem(COUNTRY_KEY, c) } catch { /* необязательно */ }
    const keep = nat(country, typed) // при смене страны переносим номер без «8»/«0» прежней страны
    if (!apply(c, keep)) { setTyped(''); emit('') }
  }

  return (
    <div className={`pf ${className}`}>
      <label className={`pf-sel ${selectClassName}`}>
        <span aria-hidden="true">{flag(country)} +{code}</span>
        <select value={country} onChange={(e) => pick(e.target.value)} aria-label={lang === 'en' ? 'Country' : 'Страна'}>
          {countries.map((x) => <option key={x.c} value={x.c}>{flag(x.c)} {x.name} +{x.code}</option>)}
        </select>
      </label>
      <input id={id} type="tel" inputMode="tel" autoComplete="tel-national" className={`pf-input ${inputClassName}`} value={shown} placeholder={placeholder ?? example}
        aria-label={ariaLabel} required={required} onChange={(e) => handle(e.target.value)} />
    </div>
  )
}

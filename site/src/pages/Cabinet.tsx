import { useCallback, useEffect, useRef, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { CabinetBootstrap, CabinetSummary } from '../../../crm/shared/cabinet'

type ApiError = { error?: { code?: string; message?: string } }
type Lang = 'ru' | 'en'

type CartItem = {
  id: string
  kind: 'package' | 'topup'
  title: string
  credits: number | null
  amount: number
  quantity: number
  project_title: string | null
}
type CartView = { items: CartItem[]; total: number; currency: string }
type OrderResult = { id: string; number: string; amount: number; currency: string; status: string; expires_at: string }
type TaskItem = { id: string; request_text: string; status: string; st_credits: number; created_at: string; project_title: string | null }
type ProjectItem = { id: string; title: string | null; domain: string | null; package_title: string | null; period_end: string | null; credits_left: number; auto_renew: boolean; status: string }
type OrderItem = { id: string; number: string; kind: string; status: string; amount: number; payer_type: string; created_at: string; documents_count: number }
type DocItem = { id: string; kind: string; number: string; status: string; amount: number; issued_at: string | null; order_number: string | null; file_available: boolean }
type Tab = 'overview' | 'tasks' | 'projects' | 'orders' | 'documents' | 'profile'

const fmtMoney = (n: number, locale: string) => new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(n) + ' BYN'
const fmtCredits = (n: number, locale: string) => new Intl.NumberFormat(locale).format(n)
const fmtDate = (s: string | null, locale: string) => (s ? new Date(s).toLocaleDateString(locale, locale === 'ru-RU' ? { day: '2-digit', month: '2-digit', year: 'numeric' } : { day: 'numeric', month: 'short', year: 'numeric' }) : '—')
const PKG_EN: Record<string, string> = { Базовый: 'Basic', Стандартный: 'Standard', Профессиональный: 'Professional', Ультимейт: 'Ultimate' }
const localizeTitle = (title: string | null | undefined, lang: Lang) => {
  if (!title) return title ?? null
  if (lang === 'en') {
    if (PKG_EN[title]) return PKG_EN[title]
    const topup = title.match(/^Докупка (\d+) кредитов$/)
    if (topup) return 'Top-up ' + topup[1] + ' credits'
    if (title === 'Покупка пакета') return 'Package purchase'
    if (title === 'Докупка кредитов') return 'Credit top-up'
    if (title === 'Покупка пакета и кредитов') return 'Package and credits'
  }
  return title
}

const T = {
  ru: {
    notConnectedTitle: 'Личный кабинет',
    notConnectedText: 'Кабинет ещё не подключён к этому окружению: не заданы VITE_SUPABASE_URL и VITE_SUPABASE_PUBLISHABLE_KEY.',
    clientKicker: 'Кабинет клиента',
    signInTitle: 'Вход в личный кабинет',
    signInText: 'Здесь ваши пакет и кредиты, задачи, проекты, заявки и закрывающие документы. Войдите через Google — это займёт несколько секунд.',
    errorLabel: 'Ошибка',
    signInGoogle: 'Войти через Google',
    signInConsent: 'Продолжая, вы принимаете оферту и политику обработки персональных данных.',
    cabinetKicker: 'Личный кабинет',
    client: 'Клиент',
    signOut: 'Выйти',
    tabs: { overview: 'Обзор', tasks: 'Задачи', projects: 'Проекты', orders: 'Заявки', documents: 'Документы', profile: 'Профиль' },
    pendingAddTitle: 'К какому проекту добавить?',
    pendingAddText: 'Кредиты и пакет будут привязаны к выбранному проекту.',
    project: 'Проект',
    noProject: 'Без проекта',
    loading: 'Загружаем данные кабинета…',
    loadError: 'Не удалось загрузить кабинет',
    onboardingTitle: 'Остался один шаг — привяжите Telegram',
    onboardingText: 'Покупки и оплата откроются после привязки. Откройте бота ST96 по кнопке и нажмите Start — кабинет подхватит привязку автоматически.',
    waitingConfirm: 'Ждём подтверждения…',
    openBot: 'Открыть бота и привязать',
    checkAgain: 'Проверить ещё раз',
    requestWord: 'Заявка',
    createdWord: 'создана',
    amountWord: 'Сумма',
    invoiceNote: 'Счёт появится в разделе «Документы»; оплата — по счёту, менеджер подтвердит её и активирует пакет.',
    cart: 'Корзина',
    packageMonthly: 'Пакет на месяц',
    creditTopup: 'Докупка кредитов',
    withoutProject: 'без проекта',
    remove: 'Удалить',
    payer: 'Плательщик',
    individual: 'Физлицо',
    legalEntity: 'Юрлицо',
    legalName: 'Название организации',
    unpLabel: 'УНП (9 цифр)',
    legalAddress: 'Юридический адрес',
    bankDetails: 'Банковские реквизиты',
    autoRenewLabel: 'Продлевать пакет автоматически (заявка и счёт за 7 дней до конца)',
    checkingOut: 'Оформляем…',
    submitRequest: 'Оформить заявку',
    telegramRequiredNote: 'Сначала привяжите Telegram — иначе покупка недоступна.',
    invoiceActNote: 'Счёт и акт появятся в кабинете автоматически.',
    offerConsent: 'Принимаю оферту и политику обработки персональных данных.',
    offerDoc: 'оферта',
    policyDoc: 'политика',
    creditsLeft: 'Осталось кредитов',
    inPackage: 'В пакете',
    topUp: 'докуплено',
    packageWord: 'Пакет',
    noPackage: 'Нет пакета',
    until: 'до',
    projectsWord: 'Проекты',
    activeProjects: 'Активные проекты на поддержке',
    projectsEmptyOverview: 'Проектов пока нет. Подключим после первой покупки пакета.',
    remainingCredits: (n: number) => 'осталось ' + n + ' кр.',
    credAbbr: 'кр.',
    noPackageShort: 'Без пакета',
    recentTasks: 'Последние задачи',
    tasksEmptyOverview: 'Задач пока нет — напишите боту, и они появятся здесь.',
    requestsWord: 'Заявки',
    purchasesEmpty: 'Покупок пока нет.',
    legalShort: 'юрлицо',
    individualShort: 'физлицо',
    documentsWord: 'Документы',
    documentsEmpty: 'Документов пока нет.',
    ready: 'готов',
    voided: 'аннулирован',
    preparing: 'готовится',
    allTasks: 'Все задачи',
    tasksEmpty: 'Задач пока нет.',
    myProjects: 'Мои проекты',
    projectsEmptyTab: 'Проектов пока нет.',
    autoRenewStatus: 'Автопродление',
    on: 'включено',
    off: 'выключено',
    enable: 'Включить',
    disable: 'Выключить',
    myRequests: 'Мои заявки',
    requestsEmpty: 'Заявок пока нет.',
    documentsCount: 'документов',
    documentsNote: 'Счета, акты и чеки. Ссылка на файл действует 60 секунд.',
    invoice: 'Счёт',
    act: 'Акт',
    receipt: 'Чек',
    requestNumber: 'заявка',
    openPdf: 'Открыть PDF',
    preparingFile: 'Готовится',
    profile: 'Профиль',
    nameLabel: 'Имя',
    emailLabel: 'Email',
    phoneLabel: 'Телефон',
    companyLabel: 'Компания',
    telegramLabel: 'Telegram',
    notLinked: 'не привязан',
    languageLabel: 'Язык',
    languageRussian: 'Русский',
    languageEnglish: 'English',
    profileNote: 'Редактирование профиля и реквизитов — в следующей итерации.',
    priceChanged: 'Цены обновились — проверьте корзину и оформите заявку ещё раз.',
    errTelegramRequired: 'Сначала привяжите Telegram.',
    errProjectRequired: 'Выберите проект для пакета.',
    errLegalRequisites: 'Заполните название, УНП, адрес и банковские реквизиты.',
    errInvalidUnp: 'УНП должен состоять из 9 цифр.',
    errCartEmpty: 'Корзина пуста.',
  },
  en: {
    notConnectedTitle: 'Personal cabinet',
    notConnectedText: 'The cabinet is not connected to this environment yet: VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are not set.',
    clientKicker: 'Client cabinet',
    signInTitle: 'Sign in to your cabinet',
    signInText: 'Here are your package and credits, tasks, projects, requests and closing documents. Sign in with Google — it takes a few seconds.',
    errorLabel: 'Error',
    signInGoogle: 'Sign in with Google',
    signInConsent: 'By continuing, you accept the offer and the personal data processing policy.',
    cabinetKicker: 'Personal cabinet',
    client: 'Client',
    signOut: 'Sign out',
    tabs: { overview: 'Overview', tasks: 'Tasks', projects: 'Projects', orders: 'Requests', documents: 'Documents', profile: 'Profile' },
    pendingAddTitle: 'Which project to add to?',
    pendingAddText: 'Credits and the package will be linked to the selected project.',
    project: 'Project',
    noProject: 'Without a project',
    loading: 'Loading cabinet data…',
    loadError: 'Failed to load the cabinet',
    onboardingTitle: 'One step left — link Telegram',
    onboardingText: 'Purchases and payment will unlock after linking. Open the ST96 bot with the button and press Start — the cabinet will pick up the link automatically.',
    waitingConfirm: 'Waiting for confirmation…',
    openBot: 'Open the bot and link',
    checkAgain: 'Check again',
    requestWord: 'Request',
    createdWord: 'created',
    amountWord: 'Amount',
    invoiceNote: 'The invoice will appear in the "Documents" section; payment is by invoice, a manager will confirm it and activate the package.',
    cart: 'Cart',
    packageMonthly: 'Monthly package',
    creditTopup: 'Credit top-up',
    withoutProject: 'without a project',
    remove: 'Remove',
    payer: 'Payer',
    individual: 'Individual',
    legalEntity: 'Legal entity',
    legalName: 'Company name',
    unpLabel: 'UNP (9 digits)',
    legalAddress: 'Legal address',
    bankDetails: 'Bank details',
    autoRenewLabel: 'Auto-renew the package (request and invoice 7 days before the end)',
    checkingOut: 'Submitting…',
    submitRequest: 'Submit request',
    telegramRequiredNote: 'Link Telegram first — otherwise the purchase is unavailable.',
    invoiceActNote: 'The invoice and act will appear in your cabinet automatically.',
    offerConsent: 'I accept the offer and the personal data processing policy.',
    offerDoc: 'offer',
    policyDoc: 'policy',
    creditsLeft: 'Credits left',
    inPackage: 'In package',
    topUp: 'top-up',
    packageWord: 'Package',
    noPackage: 'No package',
    until: 'until',
    projectsWord: 'Projects',
    activeProjects: 'Active projects under support',
    projectsEmptyOverview: 'No projects yet. We will connect one after your first package purchase.',
    remainingCredits: (n: number) => n + ' cred. left',
    credAbbr: 'cred.',
    noPackageShort: 'No package',
    recentTasks: 'Recent tasks',
    tasksEmptyOverview: 'No tasks yet — message the bot and they will appear here.',
    requestsWord: 'Requests',
    purchasesEmpty: 'No purchases yet.',
    legalShort: 'legal entity',
    individualShort: 'individual',
    documentsWord: 'Documents',
    documentsEmpty: 'No documents yet.',
    ready: 'ready',
    voided: 'voided',
    preparing: 'preparing',
    allTasks: 'All tasks',
    tasksEmpty: 'No tasks yet.',
    myProjects: 'My projects',
    projectsEmptyTab: 'No projects yet.',
    autoRenewStatus: 'Auto-renewal',
    on: 'on',
    off: 'off',
    enable: 'Enable',
    disable: 'Disable',
    myRequests: 'My requests',
    requestsEmpty: 'No requests yet.',
    documentsCount: 'documents',
    documentsNote: 'Invoices, acts and receipts. The file link is valid for 60 seconds.',
    invoice: 'Invoice',
    act: 'Act',
    receipt: 'Receipt',
    requestNumber: 'request',
    openPdf: 'Open PDF',
    preparingFile: 'Preparing',
    profile: 'Profile',
    nameLabel: 'Name',
    emailLabel: 'Email',
    phoneLabel: 'Phone',
    companyLabel: 'Company',
    telegramLabel: 'Telegram',
    notLinked: 'not linked',
    languageLabel: 'Language',
    languageRussian: 'Russian',
    languageEnglish: 'English',
    profileNote: 'Editing your profile and details — coming in the next iteration.',
    priceChanged: 'Prices have changed — review your cart and submit the request again.',
    errTelegramRequired: 'Link Telegram first.',
    errProjectRequired: 'Select a project for the package.',
    errLegalRequisites: 'Fill in the name, UNP, address and bank details.',
    errInvalidUnp: 'UNP must consist of 9 digits.',
    errCartEmpty: 'The cart is empty.',
  },
}

class CabinetApiError extends Error {
  code: string
  data: Record<string, unknown>
  constructor(code: string, data: Record<string, unknown>) {
    super(code)
    this.code = code
    this.data = data
  }
}

async function api<T>(action: string, token: string, init?: RequestInit): Promise<T> {
  const res = await fetch('/api/cabinet?action=' + encodeURIComponent(action), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token,
      ...(init?.headers || {}),
    },
  })
  const data = (await res.json().catch(() => ({}))) as T & ApiError
  if (!res.ok) throw new CabinetApiError(data.error?.code || 'request_failed', (data.error || {}) as Record<string, unknown>)
  return data
}

export default function Cabinet({ lang = 'ru' }: { lang?: Lang }) {
  const t = T[lang]
  const locale = lang === 'en' ? 'en-GB' : 'ru-RU'
  const money = (n: number) => fmtMoney(n, locale)
  const credits = (n: number) => fmtCredits(n, locale)
  const date = (s: string | null) => fmtDate(s, locale)
  const [session, setSession] = useState<Session | null>(null)
  const [boot, setBoot] = useState<CabinetBootstrap | null>(null)
  const [summary, setSummary] = useState<CabinetSummary | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [tgBusy, setTgBusy] = useState(false)
  const [cart, setCart] = useState<CartView | null>(null)
  const [payer, setPayer] = useState<'individual' | 'legal'>('individual')
  const [legal, setLegal] = useState({ legal_name: '', unp: '', legal_address: '', bank_details: '' })
  const [autoRenew, setAutoRenew] = useState(true)
  const [checkoutBusy, setCheckoutBusy] = useState(false)
  const [accepted, setAccepted] = useState(false)
  const checkoutKeyRef = useRef('cab-' + Date.now() + '-' + Math.random().toString(16).slice(2))
  const [orderResult, setOrderResult] = useState<OrderResult | null>(null)
  const [pendingAdd, setPendingAdd] = useState<{ kind: string; value: string } | null>(null)
  const [tab, setTab] = useState<Tab>('overview')
  const [tasks, setTasks] = useState<TaskItem[]>([])
  const [projectsList, setProjectsList] = useState<ProjectItem[]>([])
  const [ordersList, setOrdersList] = useState<OrderItem[]>([])
  const [docsList, setDocsList] = useState<DocItem[]>([])
  const pollRef = useRef<number | null>(null)
  const addRef = useRef(false)

  const load = useCallback(async (s: Session) => {
    setBusy(true)
    setError(null)
    try {
      const b = await api<CabinetBootstrap>('bootstrap', s.access_token, { method: 'POST' })
      setBoot(b)
      const sum = await api<CabinetSummary>('summary', s.access_token)
      setSummary(sum)

      // Переход с /support: ?add=package:code или ?add=topup:500 — кладём в корзину один раз.
      const params = new URLSearchParams(window.location.search)
      const add = params.get('add')
      if (add && !addRef.current) {
        addRef.current = true
        const [kind, value] = add.split(':')
        window.history.replaceState({}, '', window.location.pathname)
        if (sum.projects.length > 1) {
          if (kind === 'package' || kind === 'topup') setPendingAdd({ kind, value })
        } else {
          const projectId = sum.projects[0]?.id || null
          if (kind === 'package' && value) {
            await api('cart_add', s.access_token, {
              method: 'POST',
              body: JSON.stringify({ kind: 'package', package_code: value, project_id: projectId }),
            })
          } else if (kind === 'topup' && value) {
            await api('cart_add', s.access_token, {
              method: 'POST',
              body: JSON.stringify({ kind: 'topup', credits: Number(value), project_id: projectId }),
            })
          }
        }
      }
      setCart(await api<CartView>('cart', s.access_token))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'request_failed')
    } finally {
      setBusy(false)
    }
  }, [])

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      if (data.session) void load(data.session)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next)
      if (next) void load(next)
      else {
        setBoot(null)
        setSummary(null)
      }
    })
    return () => sub.subscription.unsubscribe()
  }, [load])

  const signIn = async () => {
    if (!supabase) return
    setError(null)
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + window.location.pathname + window.location.search },
    })
    if (err) setError(err.message)
  }

  const signOut = async () => {
    if (pollRef.current) window.clearInterval(pollRef.current)
    await supabase?.auth.signOut()
  }

  const openTab = async (next: Tab) => {
    setTab(next)
    setError(null)
    if (!session || next === 'overview' || next === 'profile') return
    try {
      if (next === 'tasks') {
        const d = await api<{ items: TaskItem[] }>('tasks', session.access_token)
        setTasks(d.items)
      } else if (next === 'projects') {
        const d = await api<{ items: ProjectItem[] }>('projects', session.access_token)
        setProjectsList(d.items)
      } else if (next === 'orders') {
        const d = await api<{ items: OrderItem[] }>('orders', session.access_token)
        setOrdersList(d.items)
      } else if (next === 'documents') {
        const d = await api<{ items: DocItem[] }>('documents', session.access_token)
        setDocsList(d.items)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'request_failed')
    }
  }

  const openDocument = async (id: string) => {
    if (!session) return
    setError(null)
    try {
      const res = await fetch('/api/cabinet-pdf?id=' + encodeURIComponent(id) + '&lang=' + lang, {
        headers: { Authorization: 'Bearer ' + session.access_token },
      })
      const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string }
      if (!res.ok || !data.url) throw new Error(data.error || 'file_pending')
      window.open(data.url, '_blank', 'noopener')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'file_pending')
    }
  }

  const confirmPendingAdd = async (projectId: string | null) => {
    if (!session || !pendingAdd) return
    try {
      const body = pendingAdd.kind === 'package'
        ? { kind: 'package', package_code: pendingAdd.value, project_id: projectId }
        : { kind: 'topup', credits: Number(pendingAdd.value), project_id: projectId }
      setCart(await api<CartView>('cart_add', session.access_token, { method: 'POST', body: JSON.stringify(body) }))
      setPendingAdd(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'cart_failed')
    }
  }

  const toggleAutoRenew = async (p: ProjectItem) => {
    if (!session) return
    try {
      await api('project_auto_renew', session.access_token, {
        method: 'POST',
        body: JSON.stringify({ project_id: p.id, enabled: !p.auto_renew }),
      })
      setProjectsList((list) => list.map((x) => (x.id === p.id ? { ...x, auto_renew: !p.auto_renew } : x)))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'renewal_failed')
    }
  }

  const removeCartItem = async (id: string) => {
    if (!session) return
    try {
      setCart(await api<CartView>('cart_remove', session.access_token, { method: 'POST', body: JSON.stringify({ id }) }))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'cart_failed')
    }
  }

  const checkout = async () => {
    if (!session || !cart?.items.length) return
    setCheckoutBusy(true)
    setError(null)
    try {
      const buyer = payer === 'legal' ? { ...legal } : {}
      const data = await api<{ order: OrderResult }>('checkout', session.access_token, {
        method: 'POST',
        body: JSON.stringify({
          payer_type: payer,
          buyer,
          auto_renew: autoRenew,
          idempotency_key: checkoutKeyRef.current,
        }),
      })
      setOrderResult(data.order)
      checkoutKeyRef.current = 'cab-' + Date.now() + '-' + Math.random().toString(16).slice(2)
      setCart({ items: [], total: 0, currency: 'BYN' })
      const sum = await api<CabinetSummary>('summary', session.access_token)
      setSummary(sum)
    } catch (e) {
      const code = e instanceof Error ? e.message : 'checkout_failed'
      if (code === 'price_changed') {
        try {
          setCart(await api<CartView>('cart', session.access_token))
        } catch {
          // оставляем старую корзину, ниже покажем ошибку
        }
        setError(t.priceChanged)
        setCheckoutBusy(false)
        return
      }
      const map: Record<string, string> = {
        telegram_required: t.errTelegramRequired,
        project_required: t.errProjectRequired,
        legal_requisites_required: t.errLegalRequisites,
        invalid_unp: t.errInvalidUnp,
        cart_empty: t.errCartEmpty,
      }
      setError(map[code] || code)
    } finally {
      setCheckoutBusy(false)
    }
  }

  const startTelegram = async () => {
    if (!session) return
    setTgBusy(true)
    setError(null)
    try {
      const data = await api<{ deep_link: string }>('telegram_start', session.access_token, { method: 'POST' })
      window.open(data.deep_link, '_blank', 'noopener')
      if (pollRef.current) window.clearInterval(pollRef.current)
      let tries = 0
      pollRef.current = window.setInterval(async () => {
        tries += 1
        if (!session || tries > 40) {
          if (pollRef.current) window.clearInterval(pollRef.current)
          setTgBusy(false)
          return
        }
        try {
          const st = await api<{ linked: boolean }>('telegram_status', session.access_token, { method: 'POST' })
          if (st.linked) {
            if (pollRef.current) window.clearInterval(pollRef.current)
            setTgBusy(false)
            await load(session)
          }
        } catch {
          /* повторим на следующем тике */
        }
      }, 3000)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'telegram_failed')
      setTgBusy(false)
    }
  }

  if (!supabase) {
    return (
      <main className="mx-auto min-h-screen max-w-3xl px-5 pt-32 pb-20 sm:px-8">
        <h1 className="font-display text-3xl font-semibold">{t.notConnectedTitle}</h1>
        <p className="mt-4 text-paper-dim">
          {t.notConnectedText}
        </p>
      </main>
    )
  }

  if (!session) {
    return (
      <main className="mx-auto min-h-screen max-w-3xl px-5 pt-32 pb-20 sm:px-8">
        <span className="mb-4 inline-flex items-center gap-2 font-display text-xs font-semibold tracking-[0.2em] text-paper-dim uppercase">
          <span className="h-1.5 w-1.5 rounded-full bg-acid" />
          {t.clientKicker}
        </span>
        <h1 className="font-display text-3xl font-semibold sm:text-5xl">{t.signInTitle}</h1>
        <p className="mt-4 max-w-xl text-paper-dim">{t.signInText}</p>
        {error && <p className="mt-4 text-sm text-[#ff8a3d]">{t.errorLabel}: {error}</p>}
        <button
          type="button"
          onClick={() => void signIn()}
          className="mt-8 inline-flex items-center gap-3 rounded-full bg-acid px-6 py-3 font-display text-sm font-semibold text-ink transition hover:bg-acid/90"
        >
          {t.signInGoogle}
        </button>
        <p className="mt-4 text-xs text-paper-dim">{t.signInConsent}</p>
      </main>
    )
  }

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-5 pt-32 pb-20 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="mb-3 inline-flex items-center gap-2 font-display text-xs font-semibold tracking-[0.2em] text-paper-dim uppercase">
            <span className="h-1.5 w-1.5 rounded-full bg-acid" />
            {t.cabinetKicker}
          </span>
          <h1 className="font-display text-3xl font-semibold sm:text-4xl">
            {summary?.profile.name || boot?.profile.full_name || summary?.profile.email || t.client}
          </h1>
          <p className="mt-1 text-sm text-paper-dim">{summary?.profile.email}</p>
        </div>
        <button
          type="button"
          onClick={() => void signOut()}
          className="rounded-full border border-ink-line px-4 py-2 text-sm text-paper-dim transition hover:text-paper"
        >
          {t.signOut}
        </button>
      </div>


      {summary && (
        <nav className="mt-8 flex flex-wrap gap-2">
          {([
            ['overview', t.tabs.overview],
            ['tasks', t.tabs.tasks],
            ['projects', t.tabs.projects],
            ['orders', t.tabs.orders],
            ['documents', t.tabs.documents],
            ['profile', t.tabs.profile],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => void openTab(key)}
              className={'rounded-full border px-4 py-2 text-sm transition ' + (tab === key ? 'border-acid bg-acid/10 text-paper' : 'border-ink-line text-paper-dim hover:text-paper')}
            >
              {label}
            </button>
          ))}
        </nav>
      )}


      {summary && pendingAdd && (
        <section className="mt-6 rounded-3xl border border-acid/40 bg-acid/5 p-5">
          <p className="font-display text-sm font-semibold text-paper">{t.pendingAddTitle}</p>
          <p className="mt-1 text-sm text-paper-dim">{t.pendingAddText}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {summary.projects.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => void confirmPendingAdd(p.id)}
                className="rounded-full border border-ink-line px-4 py-2 text-sm text-paper transition hover:border-acid/60"
              >
                {p.title || p.domain || t.project}
              </button>
            ))}
            {pendingAdd.kind === 'topup' && (
              <button
                type="button"
                onClick={() => void confirmPendingAdd(null)}
                className="rounded-full border border-ink-line px-4 py-2 text-sm text-paper-dim transition hover:text-paper"
              >
                {t.noProject}
              </button>
            )}
          </div>
        </section>
      )}

      {busy && <p className="mt-8 text-sm text-paper-dim">{t.loading}</p>}
      {error && <p className="mt-8 text-sm text-[#ff8a3d]">{t.loadError}: {error}</p>}

      {summary && tab === 'overview' && (
        <>
          {summary.profile.onboarding_status !== 'complete' && (
            <div className="mt-8 rounded-3xl border border-acid/40 bg-acid/5 p-5">
              <p className="font-display text-sm font-semibold text-paper">{t.onboardingTitle}</p>
              <p className="mt-1 text-sm text-paper-dim">{t.onboardingText}</p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => void startTelegram()}
                  disabled={tgBusy}
                  className="rounded-full bg-acid px-5 py-2.5 font-display text-sm font-semibold text-ink transition hover:bg-acid/90 disabled:opacity-60"
                >
                  {tgBusy ? t.waitingConfirm : t.openBot}
                </button>
                <button
                  type="button"
                  onClick={() => void load(session)}
                  className="rounded-full border border-ink-line px-4 py-2.5 text-sm text-paper-dim transition hover:text-paper"
                >
                  {t.checkAgain}
                </button>
              </div>
            </div>
          )}

          {orderResult && (
            <div className="mt-8 rounded-3xl border border-acid/50 bg-ink-soft p-5">
              <p className="font-display text-sm font-semibold text-acid">{t.requestWord} {orderResult.number} {t.createdWord}</p>
              <p className="mt-1 text-sm text-paper-dim">
                {t.amountWord} {money(orderResult.amount)}. {t.invoiceNote}
              </p>
            </div>
          )}

          {cart && cart.items.length > 0 && (
            <section className="mt-8 rounded-3xl border border-ink-line bg-ink-soft p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-display text-xl font-semibold">{t.cart}</h2>
                <p className="font-display text-lg font-semibold text-acid">{money(cart.total)}</p>
              </div>
              <div className="mt-4 divide-y divide-ink-line">
                {cart.items.map((item) => (
                  <div key={item.id} className="flex items-start justify-between gap-4 py-3">
                    <div>
                      <p className="text-sm text-paper">{localizeTitle(item.title, lang) ?? item.title}</p>
                      <p className="mt-1 text-xs text-paper-dim">
                        {item.kind === 'package' ? t.packageMonthly : t.creditTopup}
                        {item.project_title ? ' · ' + item.project_title : ' · ' + t.withoutProject}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-semibold">{money(item.amount)}</span>
                      <button
                        type="button"
                        onClick={() => void removeCartItem(item.id)}
                        className="text-xs text-paper-dim underline-offset-4 hover:text-paper hover:underline"
                      >
                        {t.remove}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                <div>
                  <p className="text-xs tracking-[0.16em] text-paper-dim uppercase">{t.payer}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setPayer('individual')}
                      className={'rounded-full border px-4 py-2 text-sm ' + (payer === 'individual' ? 'border-acid bg-acid/10 text-paper' : 'border-ink-line text-paper-dim')}
                    >
                      {t.individual}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPayer('legal')}
                      className={'rounded-full border px-4 py-2 text-sm ' + (payer === 'legal' ? 'border-acid bg-acid/10 text-paper' : 'border-ink-line text-paper-dim')}
                    >
                      {t.legalEntity}
                    </button>
                  </div>

                  {payer === 'legal' && (
                    <div className="mt-3 space-y-2">
                      {([
                        ['legal_name', t.legalName],
                        ['unp', t.unpLabel],
                        ['legal_address', t.legalAddress],
                        ['bank_details', t.bankDetails],
                      ] as const).map(([key, label]) => (
                        <input
                          key={key}
                          value={legal[key]}
                          onChange={(e) => setLegal((v) => ({ ...v, [key]: e.target.value }))}
                          placeholder={label}
                          className="w-full rounded-xl border border-ink-line bg-ink px-3 py-2 text-sm text-paper outline-none placeholder:text-paper-dim/60 focus:border-acid/60"
                        />
                      ))}
                    </div>
                  )}

                  {cart.items.some((i) => i.kind === 'package') && (
                    <label className="mt-4 flex items-center gap-2 text-sm text-paper-dim">
                      <input
                        type="checkbox"
                        checked={autoRenew}
                        onChange={(e) => setAutoRenew(e.target.checked)}
                        className="h-4 w-4 accent-[#d8ff3f]"
                      />
                      {t.autoRenewLabel}
                    </label>
                  )}
                </div>

                <div className="flex flex-col justify-end">
                  <label className="mb-3 flex items-start gap-2 text-xs text-paper-dim">
                    <input
                      type="checkbox"
                      checked={accepted}
                      onChange={(e) => setAccepted(e.target.checked)}
                      className="mt-0.5 h-4 w-4 accent-[#d8ff3f]"
                    />
                    <span>{t.offerConsent} (<a className="text-acid underline" href={lang === 'en' ? '/en/offer' : '/offer'} target="_blank" rel="noreferrer">{t.offerDoc}</a>, <a className="text-acid underline" href={lang === 'en' ? '/en/privacy' : '/privacy'} target="_blank" rel="noreferrer">{t.policyDoc}</a>)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => void checkout()}
                    disabled={checkoutBusy || summary.profile.onboarding_status !== 'complete' || !accepted}
                    className="rounded-full bg-acid px-6 py-3 font-display text-sm font-semibold text-ink transition hover:bg-acid/90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {checkoutBusy ? t.checkingOut : t.submitRequest}
                  </button>
                  <p className="mt-2 text-xs text-paper-dim">
                    {summary.profile.onboarding_status !== 'complete'
                      ? t.telegramRequiredNote
                      : t.invoiceActNote}
                  </p>
                </div>
              </div>
            </section>
          )}

          <section className="mt-10 grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl border border-ink-line bg-ink-soft p-6">
              <p className="text-xs tracking-[0.16em] text-paper-dim uppercase">{t.creditsLeft}</p>
              <p className="mt-3 font-display text-4xl font-semibold text-acid">{credits(summary.credits.total_left)}</p>
              <p className="mt-2 text-xs text-paper-dim">
                {t.inPackage} {credits(summary.credits.period_left)} · {t.topUp} {credits(summary.credits.topup_left)}
              </p>
            </div>
            <div className="rounded-3xl border border-ink-line bg-ink-soft p-6">
              <p className="text-xs tracking-[0.16em] text-paper-dim uppercase">{t.packageWord}</p>
              <p className="mt-3 font-display text-2xl font-semibold">
                {localizeTitle(summary.projects.find((p) => p.package_title)?.package_title, lang) || t.noPackage}
              </p>
              <p className="mt-2 text-xs text-paper-dim">{t.until} {date(summary.credits.period_end)}</p>
            </div>
            <div className="rounded-3xl border border-ink-line bg-ink-soft p-6">
              <p className="text-xs tracking-[0.16em] text-paper-dim uppercase">{t.projectsWord}</p>
              <p className="mt-3 font-display text-4xl font-semibold">{summary.projects.length}</p>
              <p className="mt-2 text-xs text-paper-dim">{t.activeProjects}</p>
            </div>
          </section>

          <section className="mt-10">
            <h2 className="font-display text-xl font-semibold">{t.projectsWord}</h2>
            {summary.projects.length === 0 ? (
              <p className="mt-3 text-sm text-paper-dim">{t.projectsEmptyOverview}</p>
            ) : (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {summary.projects.map((p) => (
                  <div key={p.id} className="rounded-2xl border border-ink-line bg-ink-soft p-5">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-display font-semibold">{p.title || p.domain || t.project}</p>
                      <span className="rounded-full border border-ink-line px-2 py-0.5 text-xs text-paper-dim">
                        {p.credits_left} {t.credAbbr}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-paper-dim">{p.domain || p.public_url || '—'}</p>
                    <p className="mt-1 text-xs text-paper-dim">
                      {localizeTitle(p.package_title, lang) || t.noPackageShort} · {t.until} {date(p.period_end)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="mt-10">
            <h2 className="font-display text-xl font-semibold">{t.recentTasks}</h2>
            {summary.tasks_recent.length === 0 ? (
              <p className="mt-3 text-sm text-paper-dim">{t.tasksEmptyOverview}</p>
            ) : (
              <div className="mt-4 divide-y divide-ink-line rounded-2xl border border-ink-line bg-ink-soft">
                {summary.tasks_recent.map((task) => (
                  <div key={task.id} className="flex items-start justify-between gap-4 p-4">
                    <div>
                      <p className="text-sm text-paper">{task.request_text}</p>
                      <p className="mt-1 text-xs text-paper-dim">
                        {task.project_title || t.noProject} · {date(task.created_at)} · {task.status}
                      </p>
                    </div>
                    <span className="whitespace-nowrap text-sm font-semibold text-acid">−{task.st_credits}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="mt-10 grid gap-6 lg:grid-cols-2">
            <div>
              <h2 className="font-display text-xl font-semibold">{t.requestsWord}</h2>
              {summary.orders_recent.length === 0 ? (
                <p className="mt-3 text-sm text-paper-dim">{t.purchasesEmpty}</p>
              ) : (
                <div className="mt-4 space-y-3">
                  {summary.orders_recent.map((o) => (
                    <div key={o.id} className="rounded-2xl border border-ink-line bg-ink-soft p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-display text-sm font-semibold">{o.number}</p>
                        <span className="text-xs text-paper-dim">{o.status}</span>
                      </div>
                      <p className="mt-1 text-sm text-paper-dim">
                        {money(o.amount)} · {o.payer_type === 'legal' ? t.legalShort : t.individualShort}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <h2 className="font-display text-xl font-semibold">{t.documentsWord}</h2>
              {summary.documents_recent.length === 0 ? (
                <p className="mt-3 text-sm text-paper-dim">{t.documentsEmpty}</p>
              ) : (
                <div className="mt-4 space-y-3">
                  {summary.documents_recent.map((d) => (
                    <div key={d.id} className="rounded-2xl border border-ink-line bg-ink-soft p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-display text-sm font-semibold">{d.number}</p>
                        <span className="text-xs text-paper-dim">{d.kind}</span>
                      </div>
                      <p className="mt-1 text-sm text-paper-dim">
                        {money(d.amount)} ·{' '}
                        {d.status === 'issued' ? t.ready : d.status === 'void' ? t.voided : t.preparing}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </>
      )}

      {summary && tab === 'tasks' && (
        <section className="mt-8">
          <h2 className="font-display text-2xl font-semibold">{t.allTasks}</h2>
          {tasks.length === 0 ? (
            <p className="mt-3 text-sm text-paper-dim">{t.tasksEmpty}</p>
          ) : (
            <div className="mt-4 divide-y divide-ink-line rounded-2xl border border-ink-line bg-ink-soft">
              {tasks.map((task) => (
                <div key={task.id} className="flex items-start justify-between gap-4 p-4">
                  <div>
                    <p className="text-sm text-paper">{task.request_text}</p>
                    <p className="mt-1 text-xs text-paper-dim">{task.project_title || t.noProject} · {date(task.created_at)} · {task.status}</p>
                  </div>
                  <span className="whitespace-nowrap text-sm font-semibold text-acid">−{task.st_credits} {t.credAbbr}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {summary && tab === 'projects' && (
        <section className="mt-8">
          <h2 className="font-display text-2xl font-semibold">{t.myProjects}</h2>
          {projectsList.length === 0 ? (
            <p className="mt-3 text-sm text-paper-dim">{t.projectsEmptyTab}</p>
          ) : (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {projectsList.map((p) => (
                <div key={p.id} className="rounded-2xl border border-ink-line bg-ink-soft p-5">
                  <p className="font-display font-semibold">{p.title || p.domain || t.project}</p>
                  <p className="mt-1 text-sm text-paper-dim">{p.domain || '—'}</p>
                  <p className="mt-2 text-xs text-paper-dim">
                    {localizeTitle(p.package_title, lang) || t.noPackageShort} · {t.remainingCredits(p.credits_left)} · {t.until} {date(p.period_end)}
                  </p>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <p className="text-xs text-paper-dim">{t.autoRenewStatus}: {p.auto_renew ? t.on : t.off}</p>
                    <button
                      type="button"
                      onClick={() => void toggleAutoRenew(p)}
                      className="rounded-full border border-ink-line px-3 py-1 text-xs text-paper-dim transition hover:text-paper"
                    >
                      {p.auto_renew ? t.disable : t.enable}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {summary && tab === 'orders' && (
        <section className="mt-8">
          <h2 className="font-display text-2xl font-semibold">{t.myRequests}</h2>
          {ordersList.length === 0 ? (
            <p className="mt-3 text-sm text-paper-dim">{t.requestsEmpty}</p>
          ) : (
            <div className="mt-4 space-y-3">
              {ordersList.map((o) => (
                <div key={o.id} className="rounded-2xl border border-ink-line bg-ink-soft p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-display text-sm font-semibold">{o.number}</p>
                    <span className="text-xs text-paper-dim">{o.status} · {date(o.created_at)}</span>
                  </div>
                  <p className="mt-1 text-sm text-paper-dim">
                    {money(o.amount)} · {o.payer_type === 'legal' ? t.legalShort : t.individualShort} · {t.documentsCount}: {o.documents_count}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {summary && tab === 'documents' && (
        <section className="mt-8">
          <h2 className="font-display text-2xl font-semibold">{t.documentsWord}</h2>
          <p className="mt-2 text-sm text-paper-dim">{t.documentsNote}</p>
          {docsList.length === 0 ? (
            <p className="mt-3 text-sm text-paper-dim">{t.documentsEmpty}</p>
          ) : (
            <div className="mt-4 space-y-3">
              {docsList.map((d) => (
                <div key={d.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ink-line bg-ink-soft p-4">
                  <div>
                    <p className="font-display text-sm font-semibold">{d.number}</p>
                    <p className="mt-1 text-xs text-paper-dim">
                      {d.kind === 'invoice' ? t.invoice : d.kind === 'act' ? t.act : t.receipt} · {money(d.amount)} ·{' '}
                      {d.status === 'issued' ? t.ready : d.status === 'void' ? t.voided : t.preparing}
                      {d.order_number ? ' · ' + t.requestNumber + ' ' + d.order_number : ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void openDocument(d.id)}
                    disabled={!d.file_available}
                    className="rounded-full border border-ink-line px-4 py-2 text-sm text-paper-dim transition hover:text-paper disabled:opacity-40"
                  >
                    {d.file_available ? t.openPdf : t.preparingFile}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {summary && tab === 'profile' && (
        <section className="mt-8 max-w-2xl">
          <h2 className="font-display text-2xl font-semibold">{t.profile}</h2>
          <div className="mt-4 space-y-2 rounded-2xl border border-ink-line bg-ink-soft p-5 text-sm">
            <p><span className="text-paper-dim">{t.nameLabel}:</span> {summary.profile.name || '—'}</p>
            <p><span className="text-paper-dim">{t.emailLabel}:</span> {summary.profile.email || '—'}</p>
            <p><span className="text-paper-dim">{t.phoneLabel}:</span> {summary.profile.phone || '—'}</p>
            <p><span className="text-paper-dim">{t.companyLabel}:</span> {summary.profile.company || '—'}</p>
            <p><span className="text-paper-dim">{t.telegramLabel}:</span> {summary.profile.telegram_username ? '@' + summary.profile.telegram_username : t.notLinked}</p>
            <p><span className="text-paper-dim">{t.languageLabel}:</span> {summary.profile.language === 'en' ? t.languageEnglish : t.languageRussian}</p>
          </div>
          <p className="mt-3 text-xs text-paper-dim">{t.profileNote}</p>
        </section>
      )}

    </main>
  )
}

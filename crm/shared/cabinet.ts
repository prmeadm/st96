// Общие типы кабинета клиента (API и сайт). Формат — snake_case как в БД,
// чтобы не плодить маппинг; UI переводит подписи и статусы.

export type CabinetOnboardingStatus = 'telegram_required' | 'complete'

export type CabinetProfile = {
  client_id: string
  email: string | null
  full_name: string | null
  avatar_url: string | null
  name: string | null
  phone: string | null
  company: string | null
  language: 'ru' | 'en'
  telegram_username: string | null
  telegram_linked_at: string | null
  onboarding_status: CabinetOnboardingStatus
}

export type CabinetBootstrap = {
  profile: CabinetProfile
  created: boolean
  linked_existing: boolean
}

export type CabinetProject = {
  id: string
  title: string | null
  domain: string | null
  platform: string | null
  public_url: string | null
  package_code: string | null
  package_title: string | null
  period_end: string | null
  credits_left: number
}

export type CabinetTask = {
  id: string
  project_id: string | null
  project_title: string | null
  request_text: string
  status: string
  st_credits: number
  created_at: string
}

export type CabinetOrder = {
  id: string
  number: string
  kind: string
  status: string
  amount: number
  currency: string
  payer_type: string
  created_at: string
  project_title: string | null
  documents_count: number
}

export type CabinetDocument = {
  id: string
  kind: 'invoice' | 'act' | 'receipt'
  number: string
  status: 'draft' | 'issued' | 'void'
  amount: number
  currency: string
  issued_at: string | null
  order_id: string | null
  order_number: string | null
  file_available: boolean
  source: 'document' | 'legacy'
}

export type CabinetSummary = {
  profile: CabinetProfile
  projects: CabinetProject[]
  credits: {
    period_left: number
    topup_left: number
    total_left: number
    period_end: string | null
  }
  tasks_recent: CabinetTask[]
  orders_recent: CabinetOrder[]
  documents_recent: CabinetDocument[]
  cart_count: number
  alerts: string[]
}

export type CabinetApiError = { error: { code: string; message: string } }

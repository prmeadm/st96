import type { FormatKey, ServiceKey } from './schedule'

export type BookingStatus = 'pending' | 'confirmed' | 'rejected' | 'canceled'
export type BookingRow = {
  id: string
  client_id: string | null
  run_id: string | null
  run_node: string | null
  service: ServiceKey
  format: FormatKey
  starts_at: string
  ends_at: string
  name: string
  company: string | null
  telegram: string | null
  phone: string | null
  goal: string | null
  comment: string | null
  status: BookingStatus
  meet_url: string | null
  source: string
  reminded_at: string | null
  created_at: string
  decided_at: string | null
}
export type BookingInsert = Omit<BookingRow, 'id' | 'created_at' | 'decided_at' | 'reminded_at' | 'status' | 'meet_url'>
export const BOOKING_STATUS: Record<BookingStatus, string> = { pending: 'На рассмотрении', confirmed: 'Подтверждена', rejected: 'Отклонена', canceled: 'Отменена' }

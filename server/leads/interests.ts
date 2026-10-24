// Интересы заявки: направления, по которым клиентов объединяют в группы и делают рассылки.
// Ключи хранятся в leads.interests (text[]), подписи только здесь.
export const INTERESTS = {
  producing: 'Продюсирование',
  ai: 'AI-решение',
  production: 'Продакшн',
  promotion: 'Промоушн',
  crm_supaoffice: 'CRM SupaOffice',
  retouch_studio: 'Retouch Studio',
  neuro_photo: 'Нейрофотосессия',
} as const satisfies Record<string, string>

export type InterestKey = keyof typeof INTERESTS

/** Только известные ключи, без повторов, в порядке списка. Не массив — undefined (поле не менять). */
export function cleanInterests(v: unknown): InterestKey[] | undefined {
  if (!Array.isArray(v)) return undefined
  return (Object.keys(INTERESTS) as InterestKey[]).filter((k) => v.includes(k))
}

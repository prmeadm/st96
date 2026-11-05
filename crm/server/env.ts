// Переменные окружения Vercel. Без типов Node, чтобы файл проверялся и в конфиге приложения.
export function env(name: string): string | undefined {
  const g = globalThis as { process?: { env?: Record<string, string | undefined> } }
  return g.process?.env?.[name]
}

/** Схема данных Supabase: `public` до миграции 0015, `crm` — после (переменная SUPABASE_SCHEMA). */
export const dbSchema = (): string => env('SUPABASE_SCHEMA') || 'public'

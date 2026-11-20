// Ядро агента поддержки: классификация обращения, проверка лимитов, решение и аудит.
// Чистая логика без ввода-вывода (LLM и БД инжектируются) — покрывается тестами.
// Процессы: ТЗ §5.2 (обращение), §5.3 (оплата), §5.5 (смена пакета).

export type Scenario = {
  system_prompt: string
  scope_notes: string | null
  stop_conditions: string | null
  allowed_actions: string | null
}

export type Limits = {
  corrections_limit: number | null
  corrections_used: number
  features_limit: number | null
  features_used: number
  requests_limit: number | null
  requests_used: number
}

export type AgentInput = {
  request_text: string
  scenario: Scenario
  limits: Limits
  /** true — у клиента есть активный оплаченный период; без него агент не работает. */
  hasActivePeriod: boolean
}

export type Classification =
  | { kind: 'clarify'; reason: string }
  | { kind: 'out_of_scope'; reason: string }
  | { kind: 'thanks'; reason: string }
  | { kind: 'edits'; edits: string[]; is_feature: boolean }

export type Classify = (input: AgentInput) => Promise<Classification>

export type AuditEntry = { actor: 'ai' | 'human' | 'admin'; action: string; payload?: Record<string, unknown> }

export type Decision =
  | { status: 'clarify'; reason: string; audit: AuditEntry[] }
  | { status: 'out_of_scope'; reason: string; audit: AuditEntry[] }
  | { status: 'thanks'; reason: string; audit: AuditEntry[] }
  | { status: 'awaiting_payment'; reason: string; edits: string[]; edits_count: number; is_feature: boolean; audit: AuditEntry[] }
  | { status: 'ready'; edits: string[]; edits_count: number; is_feature: boolean; remaining_after: number | null; audit: AuditEntry[] }

/** Остаток правок: null = без лимита. */
export const remainingCorrections = (l: Limits): number | null =>
  l.corrections_limit == null ? null : Math.max(0, l.corrections_limit - l.corrections_used)

export const remainingFeatures = (l: Limits): number | null =>
  l.features_limit == null ? null : Math.max(0, l.features_limit - l.features_used)

/** Промпт агента: рамки + лимиты + обращение. */
export function buildPrompt(input: AgentInput): string {
  const s = input.scenario
  const l = input.limits
  const lim = [
    'Остаток правок: ' + (remainingCorrections(l) == null ? 'без лимита' : String(remainingCorrections(l))),
    'Остаток функций: ' + (remainingFeatures(l) == null ? 'без лимита' : String(remainingFeatures(l))),
  ].join('; ')
  return [
    'Ты — ИИ-агент поддержки клиента. Работай строго в рамках заданного сценария.',
    s.system_prompt && 'Сценарий: ' + s.system_prompt,
    s.scope_notes && 'Область: ' + s.scope_notes,
    s.allowed_actions && 'Разрешено: ' + s.allowed_actions,
    s.stop_conditions && 'Стоп-условия: ' + s.stop_conditions,
    lim,
    'Обращение клиента:',
    input.request_text,
  ].filter(Boolean).join('\n\n')
}

/**
 * Решение по обращению: clarify (уточнить), out_of_scope (вне рамок), awaiting_payment
 * (правок/функций не хватает), ready (можно делать; правки в пределах остатка).
 * Счётчики не меняет — списание после успешного деплоя (Фаза 5).
 */
export async function decide(input: AgentInput, classify: Classify): Promise<Decision> {
  const c = await classify(input)
  if (c.kind === 'thanks') {
    return { status: 'thanks', reason: c.reason, audit: [{ actor: 'ai', action: 'thanks', payload: { reason: c.reason } }] }
  }
  if (!input.hasActivePeriod) {
    return {
      status: 'awaiting_payment', reason: 'нет активного оплаченного периода', edits: [], edits_count: 0, is_feature: false,
      audit: [{ actor: 'ai', action: 'awaiting_payment', payload: { reason: 'no_active_period' } }],
    }
  }
  if (c.kind === 'clarify') {
    return { status: 'clarify', reason: c.reason, audit: [{ actor: 'ai', action: 'clarify', payload: { reason: c.reason } }] }
  }
  if (c.kind === 'out_of_scope') {
    return { status: 'out_of_scope', reason: c.reason, audit: [{ actor: 'ai', action: 'out_of_scope', payload: { reason: c.reason } }] }
  }
  const edits_count = c.edits.length
  if (c.is_feature) {
    const remF = remainingFeatures(input.limits)
    if (remF != null && remF <= 0) {
      return {
        status: 'awaiting_payment', reason: 'лимит функций исчерпан', edits: c.edits, edits_count, is_feature: true,
        audit: [{ actor: 'ai', action: 'awaiting_payment', payload: { reason: 'features_exhausted', edits_count } }],
      }
    }
    return {
      status: 'ready', edits: c.edits, edits_count, is_feature: true, remaining_after: remF,
      audit: [{ actor: 'ai', action: 'planned', payload: { edits_count, kind: 'feature' } }],
    }
  }
  const rem = remainingCorrections(input.limits)
  if (rem == null || edits_count <= rem) {
    return {
      status: 'ready', edits: c.edits, edits_count, is_feature: false, remaining_after: rem == null ? null : rem - edits_count,
      audit: [{ actor: 'ai', action: 'planned', payload: { edits_count, kind: 'correction' } }],
    }
  }
  return {
    status: 'awaiting_payment', reason: 'нужно ' + edits_count + ' правок, осталось ' + rem, edits: c.edits, edits_count, is_feature: false,
    audit: [{ actor: 'ai', action: 'awaiting_payment', payload: { reason: 'corrections_exhausted', edits_count, remaining: rem } }],
  }
}

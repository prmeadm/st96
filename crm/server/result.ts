// Явное сужение Result-типов (`{ ok: true; … } | { ok: false; error; … }`) через type-предикат.
// Нужно, чтобы edge-функции сужались и под строгим type-check Vercel, где control-flow-сужение
// дискриминанта `ok` в пересечённых union не срабатывает.
export function isErr<T extends { ok: boolean }>(r: T): r is Extract<T, { ok: false }> {
  return !r.ok
}

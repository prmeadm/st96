import { test } from 'node:test'
import assert from 'node:assert/strict'
import { applyFilter, condLabel, flattenJson, inferFields, isEmptyCond, matchText, parseConds, resolveRange, type Flat } from './filter'

const rows: Flat[] = [
  { status: 'new', name: 'Анна Петрова', created_at: '2026-10-01T09:00:00Z', tags: ['vip', 'сегмент:печать'], 'utm.utm_source': 'instagram', 'ans.budget': '1500', 'ans.city': 'Минск', bot: true },
  { status: 'won', name: 'Олег', created_at: '2026-10-10T09:00:00Z', tags: ['vip'], 'utm.utm_source': 'instagram', 'ans.city': 'Минск', bot: false },
  { status: 'new', name: 'Ирина', created_at: '2026-10-20T09:00:00Z', tags: [], 'utm.utm_source': 'google', 'ans.city': 'Гродно', bot: false },
  { status: 'lost', name: 'Пётр', created_at: '2026-10-21T09:00:00Z', 'utm.utm_source': 'instagram', 'ans.city': 'Минск', 'ans.comment': 'длинный ответ про съёмку', bot: true },
]
const known = {
  status: { label: 'Статус', group: 'Заявка', options: { new: 'Новая', won: 'Выиграна', lost: 'Проиграна' } },
  name: { label: 'Имя', group: 'Заявка', kind: 'text' as const },
  created_at: { label: 'Создана', group: 'Заявка' },
  tags: { label: 'Теги', group: 'Клиент' },
  bot: { label: 'Пишет боту', group: 'Клиент' },
}
const fields = inferFields(rows, known, { 'utm.': 'UTM', 'ans.': 'Ответы воронок' })
const by = (k: string) => fields.find((f) => f.key === k)

test('поля строятся из данных: тип выбирается сам, новые ключи jsonb попадают в фильтр', () => {
  assert.equal(by('status')?.kind, 'enum')
  assert.deepEqual(by('status')?.options?.map((o) => o.label), ['Новая', 'Выиграна', 'Проиграна'])
  assert.equal(by('name')?.kind, 'text')
  assert.equal(by('created_at')?.kind, 'date')
  assert.equal(by('tags')?.kind, 'enum')
  assert.deepEqual(by('tags')?.options?.map((o) => o.value), ['vip', 'сегмент:печать'])
  assert.equal(by('bot')?.kind, 'bool')
  assert.equal(by('utm.utm_source')?.kind, 'enum')
  assert.equal(by('utm.utm_source')?.group, 'UTM')
  assert.equal(by('utm.utm_source')?.label, 'utm source')
  assert.equal(by('ans.city')?.kind, 'enum')
  assert.equal(by('ans.comment')?.kind, 'enum', 'одно значение — тоже список (≤3 разных)')
})

test('много разных чисел — диапазон от/до, много разных строк — «содержит»', () => {
  const many: Flat[] = Array.from({ length: 30 }, (_, i) => ({ 'ans.age': String(18 + i), 'ans.about': `ответ ${i}` }))
  const f = inferFields(many, {}, { 'ans.': 'Ответы' })
  assert.equal(f.find((x) => x.key === 'ans.age')?.kind, 'number')
  assert.equal(f.find((x) => x.key === 'ans.about')?.kind, 'text')
})

test('список без значений в данных остаётся списком, а не «содержит»', () => {
  const f = inferFields([{ tags: [] }], { tags: { label: 'Теги', kind: 'enum' } })
  assert.equal(f[0].kind, 'enum')
  assert.deepEqual(f[0].options, [])
})

test('ключи без описания и без префикса не попадают в фильтр', () => {
  const f = inferFields([{ id: 'x', raw_text: 'abc', __wait: 'input' }], {}, { 'ans.': 'Ответы' })
  assert.equal(f.length, 0)
})

test('условия: список, да/нет, период, «содержит», число', () => {
  const now = new Date(2026, 9, 21, 12)
  const pick = (conds: Parameters<typeof applyFilter>[2], q = '') => applyFilter(rows, (r) => r, conds, q, fields, now).map((r) => r.name)
  assert.deepEqual(pick([{ field: 'status', value: ['new', 'lost'] }]), ['Анна Петрова', 'Ирина', 'Пётр'])
  assert.deepEqual(pick([{ field: 'tags', value: ['сегмент:печать'] }]), ['Анна Петрова'])
  assert.deepEqual(pick([{ field: 'bot', value: true }]), ['Анна Петрова', 'Пётр'])
  assert.deepEqual(pick([{ field: 'created_at', value: { period: 'range', from: '2026-10-05', to: '2026-10-20' } }]), ['Олег', 'Ирина'])
  assert.deepEqual(pick([{ field: 'created_at', value: { period: 'yesterday' } }]), ['Ирина'])
  assert.deepEqual(pick([{ field: 'name', value: 'ПЁТР' }]), ['Пётр'])
  assert.deepEqual(pick([{ field: 'status', value: ['new'] }, { field: 'ans.city', value: ['Минск'] }]), ['Анна Петрова'])
  assert.deepEqual(pick([], 'google'), ['Ирина'])
  const nums = inferFields(Array.from({ length: 20 }, (_, i) => ({ n: i * 10 })), { n: { label: 'N' } })
  assert.equal(applyFilter(Array.from({ length: 20 }, (_, i) => ({ n: i * 10 })), (r) => r, [{ field: 'n', value: { from: '50', to: '80' } }], '', nums).length, 4)
})

test('пустые условия ничего не отсекают', () => {
  assert.ok(isEmptyCond({ field: 'status', value: [] }))
  assert.ok(isEmptyCond({ field: 'name', value: '  ' }))
  assert.ok(isEmptyCond({ field: 'created_at', value: { period: 'range' } }))
  assert.ok(!isEmptyCond({ field: 'created_at', value: { period: '7d' } }))
  assert.ok(!isEmptyCond({ field: 'bot', value: false }))
  assert.equal(applyFilter(rows, (r) => r, [{ field: 'status', value: [] }], '', fields).length, 4)
})

test('периоды считаются от сегодняшнего дня', () => {
  const now = new Date(2026, 9, 21, 12)
  assert.deepEqual(resolveRange({ period: '7d' }, now), { from: '2026-10-15', to: '2026-10-21' })
  assert.deepEqual(resolveRange({ period: 'month' }, now), { from: '2026-10-01', to: '2026-10-21' })
  assert.deepEqual(resolveRange({ period: 'prev_month' }, now), { from: '2026-09-01', to: '2026-09-30' })
})

test('подписи чипов и разбор адреса', () => {
  assert.equal(condLabel({ field: 'status', value: ['new', 'won'] }, by('status')), 'Статус: Новая, Выиграна')
  assert.equal(condLabel({ field: 'created_at', value: { period: 'range', from: '2026-10-01', to: '2026-10-15' } }, by('created_at')), 'Создана: 01.10.2026 – 15.10.2026')
  assert.equal(condLabel({ field: 'created_at', value: { period: '7d' } }, by('created_at')), 'Создана: за 7 дней')
  assert.equal(condLabel({ field: 'bot', value: false }, by('bot')), 'Пишет боту: нет')
  assert.deepEqual(parseConds('не json'), [])
  assert.deepEqual(parseConds('[{"field":"status","value":["new"]},{"x":1}]'), [{ field: 'status', value: ['new'] }])
})

test('jsonb в плоские ключи: служебные и вложенные пропускаются', () => {
  assert.deepEqual(flattenJson('ans.', { city: 'Минск', age: 30, __wait: 'input', deep: { a: 1 }, list: ['a', 'b'] }), { 'ans.city': 'Минск', 'ans.age': 30, 'ans.list': ['a', 'b'] })
  assert.ok(matchText({ phone: '+375291112233', tg: 'anna_photo' }, '@anna'))
})

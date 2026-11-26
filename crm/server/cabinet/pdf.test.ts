import { test } from 'node:test'
import assert from 'node:assert/strict'
import { renderPdf } from './pdf.js'

const client = { name: 'Иван', company: null, email: 'a@b.c', phone: null, legal_name: null, unp: null, legal_address: null, bank_details: null }

test('PDF: счёт рендерится с кириллицей и суммой', async () => {
  const bytes = await renderPdf({
    kind: 'invoice',
    number: 'СЧ-2026-000001',
    date: new Date('2026-11-26T10:00:00Z'),
    orderNumber: 'ST-2026-000001',
    amount: 560,
    currency: 'BYN',
    payerType: 'legal',
    buyer: { legal_name: 'ООО Тест', unp: '193999293', legal_address: 'Минск', bank_details: 'BYN BY00' },
    client,
    items: [{ title: 'Пакет Стандартный', quantity: 1, amount: 560 }],
  })
  assert.equal(Buffer.from(bytes.slice(0, 4)).toString(), '%PDF')
  assert.ok(bytes.length > 3000)
})

test('PDF: акт и чек тоже рендерятся', async () => {
  for (const kind of ['act', 'receipt'] as const) {
    const bytes = await renderPdf({
      kind,
      number: kind === 'act' ? 'АКТ-2026-000001' : 'ЧЕК-2026-000001',
      date: new Date('2026-11-26T10:00:00Z'),
      orderNumber: 'ST-2026-000001',
      amount: 150,
      currency: 'BYN',
      payerType: 'individual',
      buyer: {},
      client,
      items: [{ title: 'Докупка 500 кредитов', quantity: 1, amount: 150 }],
    })
    assert.equal(Buffer.from(bytes.slice(0, 4)).toString(), '%PDF')
  }
})

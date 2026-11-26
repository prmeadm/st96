import { gunzipSync } from 'node:zlib'
import { PDFDocument, rgb } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import { INTER_TTF_GZ_B64 } from './font.js'

export type PdfKind = 'invoice' | 'act' | 'receipt'

export type PdfInput = {
  kind: PdfKind
  number: string
  date: Date
  orderNumber: string
  amount: number
  currency: string
  payerType: 'individual' | 'legal'
  buyer: Record<string, unknown>
  client: { name: string | null; company: string | null; email: string | null; phone: string | null; legal_name: string | null; unp: string | null; legal_address: string | null; bank_details: string | null }
  items: { title: string; quantity: number; amount: number }[]
  expiresAt?: string | null
  language?: 'ru' | 'en'
}

const INK = rgb(0.035, 0.035, 0.043)
const DIM = rgb(0.42, 0.42, 0.45)
const ACID = rgb(0.55, 0.7, 0.05)

const S = {
  ru: {
    invoice: 'Счёт на оплату',
    act: 'Акт оказанных услуг',
    receipt: 'Электронный чек',
    number: '№',
    from: 'от',
    payer: 'Плательщик',
    unp: 'УНП',
    address: 'Адрес',
    bank: 'Реквизиты',
    email: 'Email',
    order: 'Заявка',
    item: 'Наименование',
    qty: 'Кол-во',
    amount: 'Сумма',
    total: 'Итого',
    invoice_note: 'Оплата по счёту в течение 5 календарных дней.',
    valid_until: 'Счёт действителен до',
    purpose: 'Назначение платежа',
    purpose_tail: 'за услуги поддержки ST96.',
    act_note: 'Услуги оказаны в полном объёме, претензий по объёму и качеству нет.',
    receipt_note: 'Электронный чек. Документ не является фискальным чеком до подключения платёжного провайдера.',
    executor: 'Исполнитель',
    header: 'ООО «КИНГСГАРДЕН» · УНП 193999293',
    executorName: 'ООО «КИНГСГАРДЕН», УНП 193999293',
    generated: 'Документ сформирован автоматически',
    default_item: 'Услуги поддержки ST96',
  },
  en: {
    invoice: 'Invoice',
    act: 'Service Completion Act',
    receipt: 'E-receipt',
    number: 'No.',
    from: 'dated',
    payer: 'Payer',
    unp: 'Tax ID',
    address: 'Address',
    bank: 'Bank details',
    email: 'Email',
    order: 'Order',
    item: 'Description',
    qty: 'Qty',
    amount: 'Amount',
    total: 'Total',
    invoice_note: 'Pay by invoice within 5 calendar days.',
    valid_until: 'Invoice valid until',
    purpose: 'Payment reference',
    purpose_tail: 'for ST96 support services.',
    act_note: 'Services were rendered in full; there are no claims regarding scope or quality.',
    receipt_note: 'E-receipt. This document is not a fiscal receipt until a payment provider is connected.',
    executor: 'Contractor',
    header: 'KINGSGARDEN LLC · Tax ID 193999293',
    executorName: 'KINGSGARDEN LLC, Tax ID 193999293',
    generated: 'Document generated automatically',
    default_item: 'ST96 support services',
  },
} as const

export async function renderPdf(input: PdfInput): Promise<Uint8Array> {
  const en = input.language === 'en'
  const t = en ? S.en : S.ru
  const locale = en ? 'en-GB' : 'ru-RU'
  const money = (n: number, c: string) => new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n) + ' ' + c
  const dateFmt = (d: Date) => d.toLocaleDateString(locale)

  const pdf = await PDFDocument.create()
  pdf.registerFontkit(fontkit)
  const fontBytes = gunzipSync(Buffer.from(INTER_TTF_GZ_B64, 'base64'))
  const font = await pdf.embedFont(fontBytes, { subset: true })
  const page = pdf.addPage([595.28, 841.89])
  const { width, height } = page.getSize()
  const left = 48
  const right = width - 48
  let y = height - 56

  const text = (s: string, size = 10, color = INK, x = left) => {
    page.drawText(s, { x, y, size, font, color, maxWidth: right - x })
  }
  const line = (textValue: string, size = 10, color = INK) => {
    text(textValue, size, color)
    y -= size + 7
  }
  text('ST96', 20, INK)
  text(t.header, 9, DIM)
  y -= 46
  line(t[input.kind], 18, INK)
  line(t.number + ' ' + input.number + ' ' + t.from + ' ' + dateFmt(input.date), 10, DIM)
  y -= 8
  page.drawLine({ start: { x: left, y }, end: { x: right, y }, thickness: 1, color: ACID })
  y -= 22

  const buyer = input.buyer || {}
  const legalName = String(buyer.legal_name || input.client.legal_name || input.client.company || input.client.name || '')
  const unp = String(buyer.unp || input.client.unp || '')
  const address = String(buyer.legal_address || input.client.legal_address || '')
  const bank = String(buyer.bank_details || input.client.bank_details || '')

  line(t.payer + ': ' + (legalName || '—'), 10)
  if (input.payerType === 'legal') {
    line(t.unp + ': ' + (unp || '—'), 9, DIM)
    if (address) line(t.address + ': ' + address, 9, DIM)
    if (bank) line(t.bank + ': ' + bank, 9, DIM)
  } else {
    line(t.email + ': ' + (input.client.email || '—'), 9, DIM)
  }
  line(t.order + ': ' + input.orderNumber, 10)
  y -= 10

  const colTitle = left
  const colQty = right - 170
  const colAmount = right
  text(t.item, 9, DIM, colTitle)
  text(t.qty, 9, DIM, colQty)
  text(t.amount, 9, DIM, colAmount - 40)
  y -= 16
  const fit = (s: string, maxWidth: number, size: number): string => {
    if (font.widthOfTextAtSize(s, size) <= maxWidth) return s
    let out = s
    while (out.length > 4 && font.widthOfTextAtSize(out + '…', size) > maxWidth) out = out.slice(0, -1)
    return out + '…'
  }
  for (const item of input.items.slice(0, 10)) {
    if (y < 160) break
    text(fit(item.title, colQty - colTitle - 16, 10), 10, INK, colTitle)
    text(String(item.quantity), 10, INK, colQty)
    text(money(item.amount, input.currency), 10, INK, colAmount - 70)
    y -= 15
  }
  if (y < 150) y = 150
  y -= 6
  page.drawLine({ start: { x: left, y }, end: { x: right, y }, thickness: 0.6, color: rgb(0.82, 0.82, 0.82) })
  y -= 22
  text(t.total + ': ' + money(input.amount, input.currency), 13, INK)
  y -= 26

  if (input.kind === 'invoice') {
    line(t.invoice_note, 10, DIM)
    if (input.expiresAt) line(t.valid_until + ' ' + dateFmt(new Date(input.expiresAt)) + '.', 9, DIM)
    line(t.purpose + ': ' + input.number + ' ' + t.purpose_tail, 9, DIM)
  } else if (input.kind === 'act') {
    line(t.act_note, 10, DIM)
  } else {
    line(t.receipt_note, 9, DIM)
  }

  y -= 24
  line(t.executor + ': ' + t.executorName, 9, DIM)
  line(t.generated + ' ' + dateFmt(new Date()) + '.', 8, DIM)

  page.drawRectangle({ x: 0, y: 0, width, height: 6, color: ACID })
  return pdf.save()
}

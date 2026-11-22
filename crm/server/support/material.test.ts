import { test } from 'node:test'
import assert from 'node:assert/strict'
import { needsMaterial, materialAskText, attachmentsSummary, effectiveRequestText } from './material'
import type { SupportAttachment } from './types'

const photo: SupportAttachment = { kind: 'photo', file_id: 'f1', file_name: 'kotik.jpg', caption: 'вот котик' }

test('needsMaterial: требует фото/файл для размещения визуала', () => {
  assert.ok(needsMaterial('разместить котика на пульте ведущего внизу', []))
  assert.ok(needsMaterial('замени логотип в шапке', []))
  assert.ok(needsMaterial('добавь картинку на главную', []))
  assert.ok(needsMaterial('вставь документ с текстом', []))
})

test('needsMaterial: текстовая правка без файла — материал не нужен', () => {
  assert.ok(!needsMaterial('поменяй заголовок на «Музыкальное лото»', []))
  assert.ok(!needsMaterial('исправь опечатку в тексте', []))
})

test('needsMaterial: если материал уже прислан — false', () => {
  assert.ok(!needsMaterial('разместить котика', [photo]))
})

test('materialAskText: просит файл и что/куда, не ищет в интернете', () => {
  const s = materialAskText()
  assert.match(s, /фото/)
  assert.match(s, /искать в интернете/)
  assert.match(s, /что именно и куда/)
})

test('effectiveRequestText: берёт текст из result_json, если голосовое', () => {
  assert.equal(effectiveRequestText({ request_text: '', result_json: { request_text: 'разместить фото котика' } }), 'разместить фото котика')
  assert.equal(effectiveRequestText({ request_text: '', result_json: { transcript: 'транскрипт' } }), 'транскрипт')
  assert.equal(effectiveRequestText({ request_text: 'обычный текст', result_json: null }), 'обычный текст')
})

test('attachmentsSummary: перечисляет фото и документ', () => {
  const s = attachmentsSummary([photo, { kind: 'document', file_id: 'f2', file_name: 'text.docx' }])
  assert.match(s, /kotik\.jpg/)
  assert.match(s, /документ/)
  assert.match(s, /text\.docx/)
})

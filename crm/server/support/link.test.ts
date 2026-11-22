import { test } from 'node:test'
import assert from 'node:assert/strict'
import { extractUrl, resultLink } from './link'

test('extractUrl: находит и чистит URL', () => {
  assert.equal(extractUrl('Готово: https://music-loto.vercel.app/ всё ок.'), 'https://music-loto.vercel.app/')
  assert.equal(extractUrl('ссылка https://st96.by/book?c=1!'), 'https://st96.by/book?c=1')
  assert.equal(extractUrl('без ссылки'), null)
})

test('resultLink: приоритет deploy_target, иначе URL из ответа', () => {
  assert.equal(resultLink({ deploy_target: 'https://site.by/' }, ''), 'https://site.by')
  assert.equal(resultLink({ deploy_target: null }, 'готово: https://x.vercel.app'), 'https://x.vercel.app')
  assert.equal(resultLink({ deploy_target: null }, 'нет ссылки'), null)
})

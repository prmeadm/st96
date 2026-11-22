import { test } from 'node:test'
import assert from 'node:assert/strict'
import { MUSIC_REPLY, hasAudioAttachment, DANCE_PHRASES, musicReplyText } from './music'

test('MUSIC_REPLY: 10 эмодзи, включая робота и разбитое сердце', () => {
  assert.equal(MUSIC_REPLY.split(' ').length, 10)
  assert.ok(MUSIC_REPLY.includes('\u{1F916}'))
  assert.ok(MUSIC_REPLY.includes('\u{1F494}'))
  assert.ok(MUSIC_REPLY.includes('\u{1F645}\u{200D}\u{2640}\u{FE0F}'))
  assert.ok(MUSIC_REPLY.includes('\u{1F481}\u{200D}\u{2642}\u{FE0F}'))
})

test('hasAudioAttachment: находит audio', () => {
  assert.equal(hasAudioAttachment([{ kind: 'audio', file_id: 'x' }]), true)
  assert.equal(hasAudioAttachment([{ kind: 'photo', file_id: 'x' }]), false)
  assert.equal(hasAudioAttachment(null), false)
})

test('DANCE_PHRASES: содержит заданные реплики', () => {
  assert.ok(DANCE_PHRASES.includes('Гоу, денс... Уже танцую на цифровом баре'))
  assert.ok(DANCE_PHRASES.includes('Аааа, ееееее'))
})

test('musicReplyText: эмодзи + одна из реплик', () => {
  const t = musicReplyText()
  assert.ok(t.startsWith(MUSIC_REPLY + '\n\n'))
  assert.ok(DANCE_PHRASES.some((p) => t.endsWith(p)))
})

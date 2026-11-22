import { test } from 'node:test'
import assert from 'node:assert/strict'
import { MUSIC_REPLY, hasAudioAttachment } from './music'

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

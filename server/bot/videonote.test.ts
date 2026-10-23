import assert from 'node:assert/strict'
import { test } from 'node:test'
import { InputFile, type Api } from 'grammy'
import type { Repo } from '../repo'
import { groupParts } from '../funnels/engine'
import { telegramOut } from './telegramOut'

const URL_ = 'https://ljatihrxiuouukakbdtb.supabase.co/storage/v1/object/public/media/funnels/videonote-1.mp4'

/** Минимальный MP4: moov с mvhd (длительность) и tkhd (размер кадра). */
function squareMp4(side: number, sec: number): Uint8Array {
  const box = (type: string, body: number[]) => { const n = 8 + body.length; return [n >>> 24, (n >> 16) & 255, (n >> 8) & 255, n & 255, ...[...type].map((c) => c.charCodeAt(0)), ...body] }
  const u32 = (v: number) => [v >>> 24, (v >> 16) & 255, (v >> 8) & 255, v & 255]
  const mvhd = box('mvhd', [0, 0, 0, 0, ...u32(0), ...u32(0), ...u32(1000), ...u32(sec * 1000), ...new Array(80).fill(0)])
  const tkhd = box('tkhd', [0, 0, 0, 0, ...new Array(72).fill(0), ...u32(side * 65536), ...u32(side * 65536)])
  return new Uint8Array(box('moov', [...mvhd, ...box('trak', tkhd)]))
}

function fakeApi(rejectNote = false) {
  const calls: { m: string; file: unknown; extra: { reply_markup?: unknown } }[] = []
  const rec = (m: string, fail?: boolean) => async (_c: unknown, file: unknown, extra: { reply_markup?: unknown } = {}) => {
    calls.push({ m, file, extra })
    if (fail) throw Object.assign(new Error("Call to 'sendVideoNote' failed! (400: Bad Request: wrong video note)"), { error_code: 400 })
    return m === 'sendVideoNote' ? { message_id: 1, video_note: {} } : { message_id: 1 }
  }
  return { calls, api: { sendVideoNote: rec('sendVideoNote', rejectNote), sendVideo: rec('sendVideo'), sendMessage: rec('sendMessage') } as unknown as Api }
}

test('кружок берёт соседний текст: сначала кружок, под ним текст, даже если текст в блоке стоит выше', () => {
  const units = groupParts([{ id: 't', kind: 'text', text: 'Привет' }, { id: 'v', kind: 'videonote', url: URL_ }])
  assert.deepEqual(units.map((u) => `${u.media?.id ?? '-'}+${u.text?.id ?? '-'}`), ['v+t'])
})

test('кружок, затем текст с кнопками; диаметр и длительность передаются Telegram', async () => {
  const { calls, api } = fakeApi()
  await telegramOut(api, {} as Repo, null, { sleep: async () => undefined, download: async () => squareMp4(480, 12) }).sendMedia(1, 'videonote', URL_, 'Текст под кружком', [[{ text: 'Дальше', callback_data: 'fb:x' }]])
  assert.deepEqual(calls.map((c) => c.m), ['sendVideoNote', 'sendMessage'])
  assert.equal(calls[0]!.extra.reply_markup, undefined)
  assert.equal((calls[0]!.extra as { length?: number }).length, 480)
  assert.equal((calls[0]!.extra as { duration?: number }).duration, 12)
  assert.match(JSON.stringify(calls[1]!.extra.reply_markup), /fb:x/)
})

test('кружок уходит загрузкой файла (sendVideoNote), кнопки на нём', async () => {
  const { calls, api } = fakeApi()
  await telegramOut(api, {} as Repo, null, { sleep: async () => undefined, download: async () => squareMp4(480, 12) }).sendMedia(1, 'videonote', URL_, undefined, [[{ text: 'Дальше', callback_data: 'fb:x' }]])
  assert.deepEqual(calls.map((c) => c.m), ['sendVideoNote'])
  assert.ok(calls[0]!.file instanceof InputFile, 'Telegram принимает кружок только файлом, не ссылкой')
  assert.match(JSON.stringify(calls[0]!.extra.reply_markup), /fb:x/)
})

test('если Telegram не принял кружок, клиент получает то же видео обычным сообщением', async () => {
  const { calls, api } = fakeApi(true)
  await telegramOut(api, {} as Repo, null, { sleep: async () => undefined, download: async () => squareMp4(480, 12) }).sendMedia(1, 'videonote', URL_, undefined, [[{ text: 'Дальше', callback_data: 'fb:x' }]])
  assert.deepEqual(calls.map((c) => c.m), ['sendVideoNote', 'sendVideo'])
  assert.equal(calls[1]!.file, URL_)
  assert.match(JSON.stringify(calls[1]!.extra.reply_markup), /fb:x/)
})

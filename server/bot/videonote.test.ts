import assert from 'node:assert/strict'
import { test } from 'node:test'
import { InputFile, type Api } from 'grammy'
import type { Repo } from '../repo'
import { groupParts } from '../funnels/engine'
import { telegramOut } from './telegramOut'

const URL_ = 'https://ljatihrxiuouukakbdtb.supabase.co/storage/v1/object/public/media/funnels/videonote-1.mp4'

function fakeApi(rejectNote = false) {
  const calls: { m: string; file: unknown; extra: { reply_markup?: unknown } }[] = []
  const rec = (m: string, fail?: boolean) => async (_c: unknown, file: unknown, extra: { reply_markup?: unknown } = {}) => {
    calls.push({ m, file, extra })
    if (fail) throw Object.assign(new Error("Call to 'sendVideoNote' failed! (400: Bad Request: wrong video note)"), { error_code: 400 })
    return { message_id: 1 }
  }
  return { calls, api: { sendVideoNote: rec('sendVideoNote', rejectNote), sendVideo: rec('sendVideo'), sendMessage: rec('sendMessage') } as unknown as Api }
}

test('кружок не склеивается с текстом: подписи у кружков нет', () => {
  const units = groupParts([{ id: 't', kind: 'text', text: 'Привет' }, { id: 'v', kind: 'videonote', url: URL_ }])
  assert.deepEqual(units.map((u) => `${u.media?.id ?? '-'}+${u.text?.id ?? '-'}`), ['-+t', 'v+-'])
})

test('кружок уходит загрузкой файла (sendVideoNote), кнопки на нём', async () => {
  const { calls, api } = fakeApi()
  await telegramOut(api, {} as Repo, null, { sleep: async () => undefined }).sendMedia(1, 'videonote', URL_, undefined, [[{ text: 'Дальше', callback_data: 'fb:x' }]])
  assert.deepEqual(calls.map((c) => c.m), ['sendVideoNote'])
  assert.ok(calls[0]!.file instanceof InputFile, 'Telegram принимает кружок только файлом, не ссылкой')
  assert.match(JSON.stringify(calls[0]!.extra.reply_markup), /fb:x/)
})

test('если Telegram не принял кружок, клиент получает то же видео обычным сообщением', async () => {
  const { calls, api } = fakeApi(true)
  await telegramOut(api, {} as Repo, null, { sleep: async () => undefined }).sendMedia(1, 'videonote', URL_, undefined, [[{ text: 'Дальше', callback_data: 'fb:x' }]])
  assert.deepEqual(calls.map((c) => c.m), ['sendVideoNote', 'sendVideo'])
  assert.equal(calls[1]!.file, URL_)
  assert.match(JSON.stringify(calls[1]!.extra.reply_markup), /fb:x/)
})

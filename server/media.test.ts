import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { Api } from 'grammy'
import { isVideoPageUrl } from './media'
import { sendContent } from './bot/dialog'
import { telegramOut } from './bot/telegramOut'
import type { ClientRow, Repo } from './repo'

test('страницы видеосервисов распознаются, прямые файлы нет', () => {
  for (const u of ['https://www.youtube.com/watch?v=abc', 'https://youtu.be/abc', 'https://m.youtube.com/watch?v=1', 'https://vimeo.com/123', 'https://rutube.ru/video/abc/', 'https://vk.com/video-1_2'])
    assert.equal(isVideoPageUrl(u), true, u)
  for (const u of ['https://st96.by/video.mp4', 'https://example.com/a.mov', 'not a url', 'ftp://youtube.com/x'])
    assert.equal(isVideoPageUrl(u), false, u)
})

function fakeApi(failVideoWith?: string) {
  const calls: { m: string; args: unknown[] }[] = []
  const rec = (m: string, fail?: string) => async (...args: unknown[]) => {
    calls.push({ m, args })
    if (fail) throw new Error(fail)
    return { message_id: 1 }
  }
  return { calls, api: { sendMessage: rec('sendMessage'), sendVideo: rec('sendVideo', failVideoWith), sendPhoto: rec('sendPhoto'), sendAudio: rec('sendAudio'), sendDocument: rec('sendDocument'), sendVoice: rec('sendVoice') } as unknown as Api }
}

test('воронка: ссылка на YouTube в блоке уходит сообщением со ссылкой, а не как видеофайл', async () => {
  const { calls, api } = fakeApi()
  await telegramOut(api, {} as Repo, null).sendMedia(1, 'video', 'https://youtu.be/abc', undefined)
  assert.deepEqual(calls.map((c) => c.m), ['sendMessage'])
  assert.match(String(calls[0].args[1]), /youtu\.be\/abc/)
})

test('воронка: если по ссылке не видеофайл, Telegram отказал, клиент получает ссылку', async () => {
  const { calls, api } = fakeApi('Bad Request: wrong type of the web page content')
  await telegramOut(api, {} as Repo, null).sendMedia(1, 'video', 'https://example.com/page', 'Подпись')
  assert.deepEqual(calls.map((c) => c.m), ['sendVideo', 'sendMessage'])
  assert.equal(String(calls[1].args[1]), 'Подпись\nhttps://example.com/page')
})

test('воронка: прочие ошибки Telegram не скрываются', async () => {
  const { api } = fakeApi('Forbidden: bot was blocked by the user')
  await assert.rejects(telegramOut(api, {} as Repo, null).sendMedia(1, 'video', 'https://example.com/v.mp4'), /blocked/)
})

test('шаблоны и рассылки: видео-шаблон со ссылкой на YouTube уходит ссылкой с подписью', async () => {
  const { calls, api } = fakeApi()
  const client = { tg_user_id: 5, language: 'ru', name: 'Анна' } as ClientRow
  await sendContent(api, client, { kind: 'video', body: 'Смотрите, {имя}', body_en: null, media_url: 'https://www.youtube.com/watch?v=abc' })
  assert.deepEqual(calls.map((c) => c.m), ['sendMessage'])
  assert.match(String(calls[0].args[1]), /Смотрите, Анна\nhttps:\/\/www\.youtube\.com/)
})

import { canonicalVideoUrl, firstVideoUrl } from './media'

test('canonicalVideoUrl чистит ссылки YouTube от лишнего и оставляет время старта', () => {
  assert.equal(canonicalVideoUrl('https://youtu.be/dQw4w9WgXcQ?si=abc123'), 'https://www.youtube.com/watch?v=dQw4w9WgXcQ')
  assert.equal(canonicalVideoUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ&feature=share&utm_source=x'), 'https://www.youtube.com/watch?v=dQw4w9WgXcQ')
  assert.equal(canonicalVideoUrl('https://youtu.be/dQw4w9WgXcQ?t=42'), 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42')
  assert.equal(canonicalVideoUrl('https://m.youtube.com/shorts/dQw4w9WgXcQ'), 'https://www.youtube.com/watch?v=dQw4w9WgXcQ')
  assert.equal(canonicalVideoUrl('https://vimeo.com/123'), 'https://vimeo.com/123')
  assert.equal(canonicalVideoUrl('https://www.youtube.com/watch?v=bad'), 'https://www.youtube.com/watch?v=bad')
})

test('firstVideoUrl находит ссылку на видео в тексте и не трогает обычные ссылки', () => {
  assert.equal(firstVideoUrl('Смотрите: https://youtu.be/dQw4w9WgXcQ, это важно'), 'https://youtu.be/dQw4w9WgXcQ')
  assert.equal(firstVideoUrl('Наш сайт https://st96.by и всё'), null)
})

test('текст со ссылкой на Vimeo уходит с предпросмотром плеера; YouTube и обычные ссылки без предпросмотра', async () => {
  const { calls, api } = fakeApi()
  const out = telegramOut(api, {} as Repo, null, { sleep: async () => undefined })
  await out.sendText(1, 'Ролик: https://vimeo.com/123')
  await out.sendText(1, 'Ролик: https://youtu.be/dQw4w9WgXcQ?si=zz')
  await out.sendText(1, 'Сайт https://st96.by')
  const opt = (i: number) => (calls[i].args[2] as { link_preview_options: Record<string, unknown> }).link_preview_options
  assert.equal(opt(0).url, 'https://vimeo.com/123')
  assert.equal(opt(1).is_disabled, true)
  assert.match(String(calls[1].args[1]), /youtu\.be/)
  assert.equal(opt(2).is_disabled, true)
})

test('Telegram 429 («подождите N секунд»): бот ждёт и повторяет, сообщение не теряется', async () => {
  const calls: number[] = []
  const waits: number[] = []
  const api = { sendMessage: async () => {
    calls.push(1)
    if (calls.length === 1) throw Object.assign(new Error("Call to 'sendMessage' failed! (429: Too Many Requests: retry after 8)"), { error_code: 429, parameters: { retry_after: 8 } })
    return { message_id: 1 }
  } } as unknown as Api
  await telegramOut(api, {} as Repo, null, { sleep: async (ms) => { waits.push(ms) } }).sendText(1, 'Привет')
  assert.equal(calls.length, 2)
  assert.ok(waits.some((w) => w >= 8000 && w <= 9000), `ждали ${waits.join(', ')} мс`)
})

test('на 429 не зацикливаемся: после двух повторов ошибка выходит наружу', async () => {
  const api = { sendMessage: async () => { throw Object.assign(new Error('429'), { error_code: 429, parameters: { retry_after: 1 } }) } } as unknown as Api
  await assert.rejects(telegramOut(api, {} as Repo, null, { sleep: async () => undefined }).sendText(1, 'x'), /429/)
})

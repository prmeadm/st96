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

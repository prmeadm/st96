import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { Api } from 'grammy'
import type { Repo } from '../repo'
import { validateGraph } from '../funnels/validate'
import { telegramOut } from './telegramOut'

function fakeApi(rejectKeyboard = false) {
  const calls: { m: string; markup: unknown }[] = []
  const rec = (m: string) => async (_chat: unknown, _x: unknown, extra?: { reply_markup?: unknown }) => {
    calls.push({ m, markup: extra?.reply_markup })
    if (rejectKeyboard && extra?.reply_markup) throw new Error("Call to 'x' failed! (400: Bad Request: can't parse InlineKeyboardButton: Text buttons are not allowed in the inline keyboard)")
    return { message_id: 1 }
  }
  return { calls, api: { sendMessage: rec('sendMessage'), sendPhoto: rec('sendPhoto') } as unknown as Api }
}

test('кнопка без адреса и без данных не попадает в клавиатуру (иначе Telegram отвергает всё сообщение)', async () => {
  const { calls, api } = fakeApi()
  await telegramOut(api, {} as Repo, null).sendText(1, 'Привет', [[{ text: 'Битая' }], [{ text: 'Ок', callback_data: 'fb:x' }]])
  const kb = JSON.stringify(calls[0].markup)
  assert.match(kb, /fb:x/)
  assert.doesNotMatch(kb, /Битая/)
  await telegramOut(api, {} as Repo, null).sendText(1, 'Привет', [[{ text: 'Битая' }]])
  assert.equal(calls[1].markup, undefined, 'совсем без рабочих кнопок: клавиатуры нет')
})

test('если Telegram всё же не принял клавиатуру, фото и текст уходят без кнопок', async () => {
  const { calls, api } = fakeApi(true)
  await telegramOut(api, {} as Repo, null).sendMedia(1, 'image', 'https://st96.by/a.jpg', undefined, [[{ text: 'Ок', callback_data: 'fb:x' }]])
  assert.deepEqual(calls.map((c) => [c.m, !!c.markup]), [['sendPhoto', true], ['sendPhoto', false]])
  await telegramOut(api, {} as Repo, null).sendText(1, 'Привет', [[{ text: 'Ок', callback_data: 'fb:x' }]])
  assert.deepEqual(calls.slice(2).map((c) => [c.m, !!c.markup]), [['sendMessage', true], ['sendMessage', false]])
})

test('публикация воронки блокируется, если у кнопки-ссылки нет адреса', () => {
  const g = {
    nodes: [
      { id: 'start', type: 'start', data: { triggers: ['Команда /start'], keyword: '' } },
      { id: 'm1', type: 'message', data: { parts: [{ id: 'p', kind: 'text', text: 'Привет' }], quick: [], links: [{ id: 'l', label: 'Сайт', url: '' }] } },
    ],
    edges: [{ source: 'start', sourceHandle: 'out', target: 'm1' }],
  }
  assert.ok(validateGraph(g).errors.some((e) => /Кнопка-ссылка/.test(e.text)))
  g.nodes[1]!.data.links = [{ id: 'l', label: 'Сайт', url: 'https://st96.by' }]
  assert.equal(validateGraph(g).errors.length, 0)
})

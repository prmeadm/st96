import { test } from 'node:test'
import assert from 'node:assert/strict'
import { clientKey, normalizePhone, normalizeTelegram, parseLead } from './parse'

const stand = (title: string, lines: string[]) =>
  [`\u{1F195} Заявка: ${title}`, ...lines, 'Источник: стенд, форма в памятке сотрудника'].join('\n')

test('телефон и ник без @ в поле Telegram', () => {
  const l = parseLead(stand('Нейрофотосессия', ['Имя: Максим', 'Телефон: +375298763480', 'Telegram: Sirmshir', 'Комментарий: Нижнее белье генерация фото']))
  assert.equal(l.name, 'Максим')
  assert.equal(l.phone, '+375298763480')
  assert.equal(l.telegram, '@Sirmshir')
  assert.equal(l.service, 'other', 'услуги нет на сайте: не определена')
  assert.equal(l.title, 'Нейрофотосессия')
  assert.equal(l.origin, 'stand')
  assert.equal(l.comment, 'Нижнее белье генерация фото')
})

test('тема после двоеточия в названии формы', () => {
  const l = parseLead(stand('Продакшн: примеры роликов', ['Имя: Алексей', 'Телефон: +375296797974', 'Компания: Фабрика худ изделий', 'Комментарий: Интересует полный цикл, стоимость']))
  assert.equal(l.service, 'production')
  assert.equal(l.topic, 'примеры роликов')
  assert.equal(l.company, 'Фабрика худ изделий')
})

test('многострочный комментарий склеивается', () => {
  const l = parseLead(stand('Цифровой офис (SupaOffice)', ['Имя: Елена', 'Телефон: +375447747326', 'Telegram: @elenalapanovich', 'Компания: Парад-русь', 'Комментарий: Проблемы в организации бизнеса:', 'Сотрудники.', 'Смоленск. Работают по всей России']))
  assert.equal(l.service, 'other')
  assert.match(l.comment, /Сотрудники\.\nСмоленск/)
  assert.equal(l.company, 'Парад-русь')
})

test('в поле «Имя» телефон, имя не указано', () => {
  const l = parseLead(stand('Цифровой офис (SupaOffice)', ['Имя: +375255440314', 'Телефон: +375255440314', 'Компания: Иван', 'Комментарий: Ищет работу']))
  assert.equal(l.name, '')
  assert.equal(l.phone, '+375255440314')
  // «Иван» в компании остаётся компанией: тип определить нельзя, сотрудник увидит предупреждение
  assert.ok(l.warnings.includes('no_name'))
})

test('только ник в Telegram', () => {
  const l = parseLead(stand('Цифровой офис (SupaOffice)', ['Telegram: @hoegaarden1693', 'Комментарий: Реклама сока, хотят промо']))
  assert.equal(l.telegram, '@hoegaarden1693')
  assert.equal(l.phone, '')
  assert.ok(l.warnings.includes('no_name'))
  assert.ok(!l.warnings.includes('no_contact'))
})

test('российский номер и абзацы в комментарии', () => {
  const l = parseLead(stand('Нейрофотосессия', ['Имя: Олеся', 'Телефон: +79204612888', 'Telegram: @olesiazubkova', 'Компания: Частое лицо', 'Комментарий: Россия. Организатор мероприятий', 'Воронеж']))
  assert.equal(l.phone, '+79204612888')
  const b = parseLead(stand('Нейрофотосессия', ['Имя: Александра', 'Telegram: @Alex_Balashova', 'Компания: Фотограф/Видеограф', 'Комментарий: возможно сервис по ретуши', '', 'идея по созданию фотоальбомов']))
  assert.match(b.comment, /ретуши\n\nидея/)
})

test('ник вместо имени и телефон в Telegram', () => {
  const a = parseLead(stand('Нейрофотосессия', ['Имя: @studio_ivan', 'Телефон: нет']))
  assert.equal(a.telegram, '@studio_ivan')
  assert.equal(a.name, '')
  const b = parseLead(stand('Нейрофотосессия', ['Имя: Пётр', 'Telegram: 29 123-45-67']))
  assert.equal(b.phone, '+375291234567')
  assert.ok(b.warnings.includes('phone_in_telegram'))
})

test('контакт из комментария, если полей нет', () => {
  const l = parseLead(stand('Продакшн', ['Имя: Мария', 'Комментарий: звонить 8 029 111-22-33, @maria_photo']))
  assert.equal(l.phone, '+375291112233')
  assert.equal(l.telegram, '@maria_photo')
  assert.ok(l.warnings.includes('phone_from_comment'))
})

test('заявка с сайта', () => {
  const l = parseLead(['\u{1F195} Новая заявка с сайта ST96', 'Имя: Анна', 'Контакт: anna@example.com', 'Интересует: AI-разработка', 'Сообщение: Нужен чат-бот', 'Язык сайта: English (EN)', 'Источник: google / cpc', 'Страница входа: /en'].join('\n'))
  assert.equal(l.origin, 'site')
  assert.equal(l.email, 'anna@example.com')
  assert.equal(l.lang, 'en')
  assert.equal(l.interest, 'AI-разработка')
  assert.equal(l.service, 'ai')
  assert.equal(l.comment, 'Нужен чат-бот')
})

test('не заявка', () => {
  assert.equal(parseLead('Интересует франшиза - хочет запускать печатный центр').isLead, false)
})

test('нормализация телефонов и ников', () => {
  assert.equal(normalizePhone('8 029 123-45-67'), '+375291234567')
  assert.equal(normalizePhone('8 (920) 461-28-88'), '+79204612888')
  assert.equal(normalizePhone('29 123 45 67'), '+375291234567')
  assert.equal(normalizePhone('12345'), null)
  assert.equal(normalizeTelegram('https://t.me/studia96'), '@studia96')
  assert.equal(normalizeTelegram('ab'), null)
  assert.equal(clientKey({ phone: '', telegram: '@Foo_Bar', email: '' }), 't:@foo_bar')
})

test('услуги определяются только по названиям и ключевым словам с сайта', () => {
  const site = (interest: string) => parseLead(['\u{1F195} Новая заявка с сайта ST96', 'Имя: Анна', 'Контакт: +375291112233', `Интересует: ${interest}`].join('\n')).service
  assert.equal(site('Коммерческий промоушн'), 'promotion')
  assert.equal(site('Продюсирование'), 'producing')
  assert.equal(site('Commercial promotion'), 'promotion')
  assert.equal(site('AI development'), 'ai')
  assert.equal(site('Продакшн'), 'production')
  assert.equal(site('Ретушь'), 'other')
  assert.equal(parseLead(stand('Продакшн: email-рассылка', ['Имя: Олег', 'Телефон: +375291112233'])).service, 'production')
})

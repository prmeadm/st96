// ИИ-консультант поддержки: отвечает человеку по доступной информации сайта st96.by.
// База знаний — каталог услуг сайта; рабочие часы — из workingHours.ts; запись — https://st96.by/book.
// Тон: на «ты», свой, с юмором, без официоза и цензуры. Мягко допродаёт услуги студии, но ничего не выдумывает.
import { parseJson, type Llm } from '../agent/llm.js'
import { bookingUrl } from '../booking/schedule.js'
import { servicesBrief } from '../catalog.js'
import { WORKING_HOURS_LABEL } from '../workingHours.js'

export type Lang = 'ru' | 'en'

const WORKING_HOURS_LABEL_EN = 'Mon–Thu 10:00–18:00, Fri 10:00–16:00, Sat–Sun days off (Minsk)'

export type ConsultReq = {
  question: string
  lang: Lang
  name?: string | null
  clientId?: string | null
  /** По умолчанию да: предлагать запись на встречу. */
  offerBooking?: boolean
  now?: Date
}

/** Правила консультанта: тон, допродажа, честный отказ, рабочие часы, запись. */
function rules(lang: Lang, askBooking: boolean, clientId?: string | null): string[] {
  const book = bookingUrl(clientId)
  const base = [
    'Ты — консультант креативной студии ST96. Общаешься с человеком в Telegram.',
    'Голос и тон: всегда на «ты», никогда на «вы». Ты свой — лёгкий, слегка неформальный, живой. Без официоза и без цензуры, местами с юмором, но по делу.',
    'Опирайся ТОЛЬКО на факты ниже (сайт st96.by). Не придумывай услуги, цены, сроки, скидки, гарантии и имена сотрудников.',
    'Мягко допродавай другие услуги студии из списка ниже, когда это уместно и в тему: красиво, ненавязчиво, местами с юмором, старайся вызвать у человека WOW-эффект. Только реальные услуги с сайта — ничего не фантазируй.',
    'Отвечай коротко и живо, без списков и markdown. При уместности задай один уточняющий вопрос о задаче.',
    `Рабочее время сотрудников (Минск): ${lang === 'en' ? WORKING_HOURS_LABEL_EN : WORKING_HOURS_LABEL}.`,
    'Если спрашивают, когда свяжется менеджер или реальный человек, — назови эти часы и скажи, что заявка уже у администратора и он ответит в рабочее время.',
  ]
  if (askBooking) {
    base.push(`Когда это уместно (вопрос о встрече, сроках, цене, старте проекта), предложи записаться на встречу: ${book}`)
  }
  base.push(
    'Если просят внести правки/доработки — дружелюбно объясни, что правки делаются в рамках оплаченного пакета поддержки, и предложи записаться на встречу по ссылке.',
    'Если ответа ты не знаешь или вопрос выходит за факты — не выдумывай. Тогда отвечай ДОСЛОВНО, слово в слово, без переформулировок и замен слов (особенно не заменяй «коженным» на «нашим»/«нашим специалистам» и не исправляй «ни так»), вот этой фразой: «Слушай, Давай запишу тебя на встречу к коженным, лучше ты с ними перетри за эту тему, а то они мне весь мозг вынесут если я тебе сейчас скажу что-то ни так...» — и сразу после неё добавь ссылку на запись',
    lang === 'en' ? 'Answer in English.' : 'Отвечай на русском языке.',
    'Верни строго JSON: {"answer": "текст ответа человеку"}.',
  )
  return base
}

/** Системная подсказка консультанта: правила + услуги с сайта. */
export function buildConsultSystem(r: ConsultReq): string {
  const lang = r.lang
  return [
    rules(lang, r.offerBooking !== false, r.clientId).join('\n'),
    '',
    'Услуги студии (с сайта st96.by):',
    servicesBrief(lang),
    r.name ? `\nИмя человека: ${r.name}` : '',
  ].filter(Boolean).join('\n')
}

/** Ответ консультанта. Пустая строка — модель не дала ответа (вызывающий решает, что отправить). */
export async function consultAnswer(ask: Llm, r: ConsultReq): Promise<string> {
  const question = r.question.trim().slice(0, 2000)
  if (!question) return ''
  const raw = await ask({ system: buildConsultSystem(r), user: question, feature: 'support:consult' })
  const parsed = parseJson<{ answer?: unknown }>(raw)
  return typeof parsed.answer === 'string' ? parsed.answer.trim().slice(0, 3000) : ''
}

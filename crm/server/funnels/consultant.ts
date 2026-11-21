// ИИ-консультант воронки: отвечает потенциальному покупателю по доступной информации.
// База знаний — граф воронки (тексты блоков, кнопки, ссылки) и каталог услуг с сайта;
// рабочие часы сотрудников — из workingHours.ts; запись на встречу — https://st96.by/book.
// Ничего не выдумывает: всё, чего нет в базе, отдаёт менеджеру.
import { parseJson, type Llm } from '../agent/llm'
import { bookingUrl } from '../booking/schedule'
import { servicesBrief } from '../catalog'
import { WORKING_HOURS_LABEL, isWorkingTime, minskNow } from '../workingHours'
import { asArray, str, type Graph, type Part } from './types'

export type Lang = 'ru' | 'en'

export const WORKING_HOURS_LABEL_EN = 'Mon–Thu 10:00–18:00, Fri 10:00–16:00, Sat–Sun days off (Minsk)'

/** Ссылка на запись для ответа консультанта (с привязкой клиента, чтобы заявка нашлась в CRM). */
export const consultBookingUrl = (clientId?: string | null) => bookingUrl(clientId)

/** Советы правил: одинаковые для узла воронки и для ответа вне воронки. */
function rules(lang: Lang, askBooking: boolean, clientId?: string | null): string[] {
  const book = consultBookingUrl(clientId)
  const base = [
    'Ты — консультант креативной студии ST96. Общаешься с потенциальным покупателем в Telegram.',
    'Голос и тон: всегда на «ты», никогда на «вы». Ты свой — лёгкий, слегка неформальный, живой. Без официоза и без цензуры, местами с юмором, но по делу.',
    'Опирайся ТОЛЬКО на факты ниже (сайт st96.by и граф воронки). Не придумывай услуги, цены, сроки, скидки, гарантии и имена сотрудников.',
    'Мягко допродавай другие услуги студии из списка ниже, когда это уместно и в тему: красиво, ненавязчиво, местами с юмором, старайся вызвать у покупателя WOW-эффект. Только реальные услуги с сайта — ничего не фантазируй.',
    'Отвечай коротко и живо, без списков и markdown. При уместности задай один уточняющий вопрос о задаче.',
    `Рабочее время сотрудников (Минск): ${lang === 'en' ? WORKING_HOURS_LABEL_EN : WORKING_HOURS_LABEL}.`,
    'Если спрашивают, когда свяжется менеджер или реальный человек, — назови эти часы и скажи, что заявка уже у администратора и он ответит в рабочее время.',
  ]
  if (askBooking) {
    base.push(`Когда это уместно (вопрос о встрече, сроках, цене, старте проекта), предложи записаться на встречу: ${book}`)
  }
  base.push(
    'Если ответа ты не знаешь или вопрос выходит за факты (нестандартная задача, точная смета, юридические условия) — не выдумывай, а скажи так: «Слушай, Давай запишу тебя на встречу к коженным, лучше ты с ними перетри за эту тему, а то они мне весь мозг вынесут если я тебе сейчас скажу что-то ни так...» и дай ссылку на запись.',
    lang === 'en' ? 'Answer in English.' : 'Отвечай на русском языке.',
    'Верни строго JSON: {"answer": "текст ответа клиенту"}.',
  )
  return base
}

/** Тексты блоков графа — то, что студия уже говорит клиентам. */
export function graphKnowledge(graph: Graph, lang: Lang): string {
  const lines: string[] = []
  for (const n of graph.nodes) {
    if (n.type === 'message') {
      for (const p of asArray<Part>(n.data.parts)) {
        const t = str(lang === 'en' && p.en ? p.en : p.text).trim()
        if (p.kind === 'text' && t) lines.push('- ' + t.replace(/\s+/g, ' ').slice(0, 300))
      }
      for (const q of asArray<{ label?: string }>(n.data.quick)) if (str(q.label).trim()) lines.push('- вариант ответа: ' + str(q.label).trim())
      for (const l of asArray<{ label?: string; url?: string }>(n.data.links)) if (str(l.label).trim()) lines.push(`- кнопка «${str(l.label).trim()}»: ${str(l.url).trim()}`)
    }
    if (n.type === 'handoff' || n.type === 'offhours') {
      const t = str(lang === 'en' && str(n.data.messageEn).trim() ? n.data.messageEn : n.data.message).trim()
      if (t) lines.push('- ' + t.replace(/\s+/g, ' ').slice(0, 300))
    }
  }
  return [...new Set(lines)].slice(0, 80).join('\n')
}

export type ConsultRequest = {
  lang: Lang
  question: string
  /** Тексты графа; пусто — только сайт и часы работы. */
  knowledge?: string
  /** Цель блока «ИИ-ответ» из конструктора. */
  goal?: string
  /** Предлагать запись (по умолчанию да). */
  offerBooking?: boolean
  now?: Date
  clientName?: string | null
  /** id клиента — ссылка на запись с ?c=, чтобы заявка привязалась к карточке в CRM. */
  clientId?: string | null
}

/** Системная подсказка консультанта: факты + правила + вопрос клиента. */
export function buildConsultSystem(r: ConsultRequest): string {
  const lang = r.lang
  const now = r.now ?? new Date()
  const local = minskNow(now)
  return [
    rules(lang, r.offerBooking !== false, r.clientId).join('\n'),
    '',
    'Услуги студии (с сайта st96.by):',
    servicesBrief(lang),
    r.knowledge?.trim() ? `\nЧто студия говорит в воронке:\n${r.knowledge.trim()}` : '',
    r.goal?.trim() ? `\nЦель этого диалога: ${r.goal.trim()}` : '',
    '',
    `Сейчас по Минску: ${local.iso}, ${isWorkingTime(now) ? 'рабочее время' : 'нерабочее время'}.`,
    r.clientName ? `Имя клиента: ${r.clientName}` : '',
  ].filter(Boolean).join('\n')
}

/** Ответ консультанта. Пустая строка — модель не дала ответа (вызывающий решает, что отправить). */
export async function consult(ask: Llm, r: ConsultRequest): Promise<string> {
  const question = r.question.trim().slice(0, 2000)
  if (!question) return ''
  const raw = await ask({ system: buildConsultSystem(r), user: question, feature: 'funnel:consult' })
  const parsed = parseJson<{ answer?: unknown }>(raw)
  return typeof parsed.answer === 'string' ? parsed.answer.trim().slice(0, 3000) : ''
}

// Распознавание подтверждения/отмены плана правок клиентом.
// Кириллица: \b в JS не считает русские буквы «словом» (без флага u \w — только ASCII),
// поэтому «Да»/«Нет» не распознавались. Граница — явный негативный просмотр на букву/цифру.

const CONFIRM = /^(да|ок|окей|ага|конечно|подтверждаю|подтвержда|согласен|согласна|верно|давай|поехали|вперёд|старт|yes|ok|go)(?![a-zа-яё0-9])/i
const REJECT = /^(нет|не надо|отмена|отмени|стоп|cancel|no)(?![a-zа-яё0-9])/i

/** Клиент подтверждает план правок: «да», «ок», «подтверждаю» и т.п. */
export function isConfirmation(text: string): boolean {
  const t = (text ?? '').toLowerCase().trim()
  if (!t || t.length > 80) return false
  return CONFIRM.test(t)
}

/** Клиент отменил план: «нет», «отмена», «стоп». */
export function isRejection(text: string): boolean {
  const t = (text ?? '').toLowerCase().trim()
  if (!t || t.length > 80) return false
  return REJECT.test(t)
}

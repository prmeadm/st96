import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowUpRight, Check, Mail, Phone, Send, ShieldCheck, Timer } from 'lucide-react'
import type { Service } from '../../data/services'
import { services } from '../../data/services'
import { CONTACTS } from '../layout/Footer'
import Reveal from '../ui/Reveal'
import MagneticButton from '../ui/MagneticButton'

type Props = {
  service?: Service
  title?: string
  text?: string
}

const trust = [
  { icon: Timer, text: 'Отвечаем в течение 2 часов в рабочее время' },
  { icon: ShieldCheck, text: 'Обсудим проект без обязательств' },
]

export default function LeadCapture({ service, title, text }: Props) {
  const [name, setName] = useState('')
  const [contact, setContact] = useState('')
  const [interest, setInterest] = useState(service?.slug ?? '')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<'idle' | 'sent'>('idle')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const accentSolid = service?.accent.solid ?? '#d8ff3f'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !contact.trim()) {
      setError('Заполните имя и контакт для связи')
      return
    }
    setError('')
    setSubmitting(true)

    const serviceLabel = services.find((s) => s.slug === interest)?.navLabel ?? ''

    try {
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, contact, interest: serviceLabel, message }),
      })
      if (!res.ok) throw new Error('request failed')
      setStatus('sent')
    } catch {
      setError('Не удалось отправить заявку. Напишите нам напрямую в Telegram или по телефону ниже.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section id="lead" className="relative border-t border-ink-line py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid grid-cols-1 gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-10">
          <Reveal>
            <span
              className="mb-4 inline-flex items-center gap-2 font-display text-xs font-semibold tracking-[0.2em] text-paper-dim uppercase"
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: accentSolid }} />
              Начать проект
            </span>
            <h2 className="text-balance font-display text-3xl leading-[1.1] font-semibold sm:text-4xl md:text-5xl">
              {title ?? service?.ctaTitle ?? 'Готовы обсудить ваш проект?'}
            </h2>
            <p className="mt-5 max-w-md text-lg text-paper-dim">
              {text ?? service?.ctaText ?? 'Расскажите о задаче — вернёмся с идеями и планом в течение дня.'}
            </p>

            <ul className="mt-8 space-y-3">
              {trust.map((t) => (
                <li key={t.text} className="flex items-center gap-3 text-sm text-paper-dim">
                  <t.icon className="h-4 w-4 shrink-0" style={{ color: accentSolid }} />
                  {t.text}
                </li>
              ))}
            </ul>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <a
                href={`tel:${CONTACTS.phoneHref}`}
                data-cursor-hover
                className="inline-flex items-center gap-2 rounded-full border border-ink-line px-5 py-3 text-sm font-medium transition-colors hover:border-paper-dim"
              >
                <Phone className="h-4 w-4" />
                {CONTACTS.phone}
              </a>
              <a
                href={CONTACTS.telegramHref}
                target="_blank"
                rel="noreferrer"
                data-cursor-hover
                className="inline-flex items-center gap-2 rounded-full border border-ink-line px-5 py-3 text-sm font-medium transition-colors hover:border-paper-dim"
              >
                <Send className="h-4 w-4" />
                {CONTACTS.telegram}
              </a>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="relative overflow-hidden rounded-2xl border border-ink-line bg-ink-soft p-6 sm:p-10">
              <div
                className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full opacity-20 blur-[90px]"
                style={{ background: accentSolid }}
              />
              <AnimatePresence mode="wait">
                {status === 'idle' ? (
                  <motion.form
                    key="form"
                    onSubmit={handleSubmit}
                    exit={{ opacity: 0, y: -12 }}
                    className="relative flex flex-col gap-5"
                  >
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                      <label className="flex flex-col gap-2">
                        <span className="text-xs font-medium text-paper-dim">Имя *</span>
                        <input
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          type="text"
                          placeholder="Как к вам обращаться"
                          className="rounded-xl border border-ink-line bg-ink px-4 py-3.5 text-paper outline-none transition-colors focus:border-paper-dim"
                        />
                      </label>
                      <label className="flex flex-col gap-2">
                        <span className="text-xs font-medium text-paper-dim">Телефон или email *</span>
                        <input
                          value={contact}
                          onChange={(e) => setContact(e.target.value)}
                          type="text"
                          placeholder="+375 29 000-00-00"
                          className="rounded-xl border border-ink-line bg-ink px-4 py-3.5 text-paper outline-none transition-colors focus:border-paper-dim"
                        />
                      </label>
                    </div>

                    <label className="flex flex-col gap-2">
                      <span className="text-xs font-medium text-paper-dim">Интересует</span>
                      <select
                        value={interest}
                        onChange={(e) => setInterest(e.target.value)}
                        className="rounded-xl border border-ink-line bg-ink px-4 py-3.5 text-paper outline-none transition-colors focus:border-paper-dim"
                      >
                        <option value="">Не знаю, нужна консультация</option>
                        {services.map((s) => (
                          <option key={s.slug} value={s.slug}>
                            {s.navLabel}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="flex flex-col gap-2">
                      <span className="text-xs font-medium text-paper-dim">Сообщение</span>
                      <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows={3}
                        placeholder="Кратко о задаче, сроках, бюджете"
                        className="resize-none rounded-xl border border-ink-line bg-ink px-4 py-3.5 text-paper outline-none transition-colors focus:border-paper-dim"
                      />
                    </label>

                    {error && <p className="text-sm text-pink">{error}</p>}

                    <MagneticButton
                      as="button"
                      type="submit"
                      disabled={submitting}
                      className="mt-2 inline-flex items-center justify-center gap-2 rounded-full py-4 font-display text-sm font-semibold text-ink disabled:opacity-60"
                      style={{ background: accentSolid }}
                    >
                      {submitting ? 'Отправляем…' : 'Отправить заявку'}
                      <ArrowUpRight className="h-4 w-4" />
                    </MagneticButton>
                    <p className="text-center text-xs text-paper-dim">
                      Нажимая кнопку, вы соглашаетесь на обработку данных
                    </p>
                  </motion.form>
                ) : (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative flex min-h-[360px] flex-col items-center justify-center gap-4 py-10 text-center"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 260, damping: 16 }}
                      className="grid h-16 w-16 place-items-center rounded-full"
                      style={{ background: accentSolid }}
                    >
                      <Check className="h-8 w-8 text-ink" />
                    </motion.div>
                    <h3 className="font-display text-2xl font-semibold">Заявка отправлена</h3>
                    <p className="max-w-xs text-paper-dim">
                      Мы уже получили уведомление и свяжемся с вами в течение 2 часов. Также можно
                      написать нам в Telegram.
                    </p>
                    <a
                      href={CONTACTS.telegramHref}
                      target="_blank"
                      rel="noreferrer"
                      data-cursor-hover
                      className="mt-2 inline-flex items-center gap-2 rounded-full border border-ink-line px-5 py-3 text-sm font-medium"
                    >
                      <Send className="h-4 w-4" />
                      Написать в Telegram
                    </a>
                    <button
                      onClick={() => setStatus('idle')}
                      className="text-xs text-paper-dim underline underline-offset-4"
                    >
                      Заполнить ещё раз
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <p className="mt-4 flex items-center gap-2 text-xs text-paper-dim">
              <Mail className="h-3.5 w-3.5" />
              Или напишите напрямую на {CONTACTS.email}
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

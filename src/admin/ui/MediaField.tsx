import { useEffect, useRef, useState } from 'react'
import { supabase } from '../supabase'
import { Icon, type IconName } from './Icon'
import type { TemplateKind } from '../../../server/templates'

// Файл для сообщения: снять или выбрать с устройства, записать голос или вставить ссылку. Файлы лежат в хранилище Supabase (бакет media).
const MB = 1024 * 1024
const LIMIT: Record<Exclude<TemplateKind, 'text'>, number> = { photo: 5 * MB, video: 20 * MB, voice: 20 * MB, audio: 20 * MB, file: 20 * MB }
const ACCEPT: Record<Exclude<TemplateKind, 'text'>, string> = { photo: 'image/*', video: 'video/*', voice: 'audio/*', audio: 'audio/*', file: '*/*' }
const MAX_VOICE_SEC = 300

const ext = (name: string, type: string) => (name.includes('.') ? name.split('.').pop()!.toLowerCase().replace(/[^a-z0-9]/g, '') : type.split('/')[1]?.split(';')[0] ?? 'bin').slice(0, 5) || 'bin'

/** Фото с камеры бывают по 8-12 МБ, а Telegram берёт по ссылке не больше 5 МБ: уменьшаем до 2000 px. */
async function shrinkImage(file: File): Promise<Blob> {
  if (file.size <= 1.5 * MB && /jpe?g/.test(file.type)) return file
  const bmp = await createImageBitmap(file)
  const k = Math.min(1, 2000 / Math.max(bmp.width, bmp.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bmp.width * k)
  canvas.height = Math.round(bmp.height * k)
  canvas.getContext('2d')!.drawImage(bmp, 0, 0, canvas.width, canvas.height)
  return await new Promise<Blob>((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error('Не удалось сжать фото'))), 'image/jpeg', 0.85))
}

/** Запись браузера (webm/opus) Telegram как голосовое не принимает: переводим в MP3. Запись Safari (mp4/aac) уходит как есть. */
async function toVoiceFile(blob: Blob): Promise<{ data: Blob; ext: string; type: string }> {
  if (/mp4|aac|mpeg|ogg/.test(blob.type)) return { data: blob, ext: /ogg/.test(blob.type) ? 'ogg' : /mpeg/.test(blob.type) ? 'mp3' : 'm4a', type: blob.type.split(';')[0]! }
  const { Mp3Encoder } = await import('@breezystack/lamejs')
  const ctx = new AudioContext()
  const audio = await ctx.decodeAudioData(await blob.arrayBuffer())
  await ctx.close()
  const f = audio.getChannelData(0)
  const pcm = new Int16Array(f.length)
  for (let i = 0; i < f.length; i++) pcm[i] = Math.max(-1, Math.min(1, f[i]!)) * 0x7fff
  const enc = new Mp3Encoder(1, audio.sampleRate, 64)
  const parts: Uint8Array[] = []
  for (let i = 0; i < pcm.length; i += 1152) {
    const out = enc.encodeBuffer(pcm.subarray(i, i + 1152))
    if (out.length) parts.push(new Uint8Array(out))
  }
  const tail = enc.flush()
  if (tail.length) parts.push(new Uint8Array(tail))
  return { data: new Blob(parts as BlobPart[], { type: 'audio/mpeg' }), ext: 'mp3', type: 'audio/mpeg' }
}

export function MediaField({ kind, value, onChange, folder }: { kind: Exclude<TemplateKind, 'text'>; value: string; onChange: (url: string) => void; folder: string }) {
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [rec, setRec] = useState<{ sec: number } | null>(null)
  const [over, setOver] = useState(false)
  const recorder = useRef<MediaRecorder | null>(null)
  const timer = useRef<number | undefined>(undefined)
  useEffect(() => () => { window.clearInterval(timer.current); recorder.current?.stream.getTracks().forEach((t) => t.stop()) }, [])

  const upload = async (data: Blob, extension: string, type: string) => {
    if (data.size > LIMIT[kind]) return setMsg(`Файл слишком большой: ${(data.size / MB).toFixed(1)} МБ, допустимо до ${LIMIT[kind] / MB} МБ (ограничение Telegram)`)
    const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`
    const { error } = await supabase.storage.from('media').upload(path, data, { contentType: type, cacheControl: '31536000' })
    if (error) return setMsg('Не удалось загрузить файл. Попробуйте ещё раз.')
    onChange(supabase.storage.from('media').getPublicUrl(path).data.publicUrl)
    setMsg('Файл загружен')
  }

  const pick = async (file: File | undefined) => {
    if (!file) return
    const want = { photo: 'image/', video: 'video/', voice: 'audio/', audio: 'audio/' }[kind as 'photo' | 'video' | 'voice' | 'audio']
    if (want && file.type && !file.type.startsWith(want)) return setMsg(kind === 'photo' ? 'Нужна картинка' : kind === 'video' ? 'Нужен видеофайл' : 'Нужен аудиофайл')
    setBusy(true)
    setMsg('')
    try {
      if (kind === 'photo') {
        const small = await shrinkImage(file)
        await upload(small, small === file ? ext(file.name, file.type) : 'jpg', small === file ? file.type || 'image/jpeg' : 'image/jpeg')
      } else await upload(file, ext(file.name, file.type), file.type || 'application/octet-stream')
    } catch {
      setMsg('Не удалось обработать файл')
    }
    setBusy(false)
  }

  const startRec = async () => {
    setMsg('')
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') return setMsg('Этот браузер не умеет записывать звук. Выберите файл или вставьте ссылку.')
    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch {
      return setMsg('Нет доступа к микрофону. Разрешите его в настройках браузера.')
    }
    const mime = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm'].find((m) => MediaRecorder.isTypeSupported(m))
    const mr = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined)
    const chunks: Blob[] = []
    mr.ondataavailable = (e) => e.data.size && chunks.push(e.data)
    mr.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop())
      window.clearInterval(timer.current)
      setRec(null)
      setBusy(true)
      try {
        const f = await toVoiceFile(new Blob(chunks, { type: mr.mimeType }))
        await upload(f.data, f.ext, f.type)
      } catch {
        setMsg('Не удалось обработать запись')
      }
      setBusy(false)
    }
    recorder.current = mr
    mr.start()
    setRec({ sec: 0 })
    timer.current = window.setInterval(() => setRec((r) => {
      if (r && r.sec + 1 >= MAX_VOICE_SEC) mr.stop()
      return r && { sec: r.sec + 1 }
    }), 1000)
  }
  const stopRec = () => recorder.current?.state === 'recording' && recorder.current.stop()

  const KIND_ICON: Record<typeof kind, IconName> = { photo: 'photo', video: 'video', voice: 'audio', audio: 'audio', file: 'file' }
  const pickBtn = (label: string, icon: IconName, capture?: 'environment' | 'user') => (
    <label className="ibtn" title={label} aria-label={label} aria-disabled={busy}>
      <Icon name={icon} size={20} />
      <input type="file" hidden accept={ACCEPT[kind]} capture={capture} disabled={busy} onChange={(e) => { void pick(e.target.files?.[0]); e.target.value = '' }} />
    </label>
  )
  const mm = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
  const hint = { photo: 'Перетащите фото сюда', video: 'Перетащите видео сюда', voice: 'Запишите голос или перетащите аудиофайл', audio: 'Перетащите аудиофайл сюда', file: 'Перетащите файл сюда' }[kind]

  return (
    <div className="mfield">
      {value && kind === 'photo' && <img className="media-prev" src={value} alt="Выбранное фото" />}
      {value && kind === 'video' && <video className="media-prev" src={value} controls playsInline />}
      {value && (kind === 'voice' || kind === 'audio') && <audio className="media-audio" src={value} controls />}
      {value && kind === 'file' && <a className="media-link" href={value} target="_blank" rel="noreferrer"><Icon name="file" size={16} /> Открыть файл</a>}
      <div
        className={`drop${over ? ' over' : ''}${rec ? ' rec' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setOver(true) }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); void pick(e.dataTransfer.files?.[0]) }}
      >
        {rec ? (
          <div className="recline" role="status"><i className="dot" aria-hidden="true" /> Идёт запись {mm(rec.sec)}</div>
        ) : (
          <div className="drop-hint"><Icon name="upload" size={22} /><span>{busy ? 'Загружаю…' : hint}</span></div>
        )}
        <div className="ibtns">
          {kind === 'photo' && pickBtn('Снять фото', 'camera', 'environment')}
          {kind === 'video' && pickBtn('Снять видео', 'video', 'environment')}
          {kind === 'voice' && !rec && <button type="button" className="ibtn rec-btn" title={value ? 'Записать заново' : 'Записать голос'} aria-label={value ? 'Записать заново' : 'Записать голос'} onClick={startRec} disabled={busy}><Icon name="voice" size={20} /></button>}
          {kind === 'voice' && rec && <button type="button" className="ibtn stop-btn" title="Остановить запись" aria-label="Остановить запись" onClick={stopRec}><Icon name="stop" size={18} /></button>}
          {!rec && pickBtn(kind === 'photo' ? 'Выбрать фото' : kind === 'video' ? 'Выбрать видео' : kind === 'file' ? 'Выбрать файл' : 'Выбрать аудиофайл', KIND_ICON[kind])}
          {value && !rec && <button type="button" className="ibtn" title="Убрать файл" aria-label="Убрать файл" onClick={() => onChange('')}><Icon name="trash" size={18} /></button>}
        </div>
      </div>
      {msg && !busy && <div className="hint" role="status">{msg}</div>}
      <input type="url" value={value} onChange={(e) => onChange(e.target.value)} placeholder="или вставьте ссылку https://…" aria-label="Ссылка на файл" />
    </div>
  )
}

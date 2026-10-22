import { useEffect, useRef, useState } from 'react'
import { supabase } from '../supabase'
import { Icon } from './Icon'

// Видеосообщение-«кружок» Telegram: квадратное видео MP4 до 60 секунд. Telegram отправляет кружки только загруженным файлом,
// поэтому файл кладём в хранилище, а бот при отправке скачивает его и загружает в Telegram.
const SIZE = 480 // сторона квадрата: Telegram рекомендует до 640
const MAX_SEC = 60
const MAX_MB = 20

/** MP4, который понимает Telegram. WebM (старый Chrome, Firefox) кружком не отправится. */
const mp4Mime = () => (typeof MediaRecorder === 'undefined' ? null : ['video/mp4;codecs=avc1.42E01E,mp4a.40.2', 'video/mp4;codecs=avc1', 'video/mp4'].find((m) => MediaRecorder.isTypeSupported(m)) ?? null)

/** Пишет квадрат из центра кадра: видео рисуется на холст, звук берётся из переданных дорожек. */
function recordSquare(video: HTMLVideoElement, audio: MediaStreamTrack[], mime: string, opts: { mirror?: boolean; onTick?: (sec: number) => void; until?: Promise<void> }) {
  const canvas = document.createElement('canvas')
  canvas.width = SIZE
  canvas.height = SIZE
  const ctx = canvas.getContext('2d')!
  let raf = 0
  const draw = () => {
    const vw = video.videoWidth, vh = video.videoHeight
    if (vw && vh) {
      const s = Math.min(vw, vh)
      ctx.save()
      if (opts.mirror) { ctx.translate(SIZE, 0); ctx.scale(-1, 1) }
      ctx.drawImage(video, (vw - s) / 2, (vh - s) / 2, s, s, 0, 0, SIZE, SIZE)
      ctx.restore()
    }
    raf = requestAnimationFrame(draw)
  }
  draw()
  const stream = canvas.captureStream(30)
  audio.forEach((t) => stream.addTrack(t))
  const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 1_200_000 })
  const chunks: Blob[] = []
  rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data) }
  const t0 = Date.now()
  const tick = window.setInterval(() => {
    const sec = Math.floor((Date.now() - t0) / 1000)
    opts.onTick?.(sec)
    if (sec >= MAX_SEC && rec.state === 'recording') rec.stop()
  }, 250)
  const done = new Promise<Blob>((resolve) => {
    rec.onstop = () => {
      cancelAnimationFrame(raf)
      window.clearInterval(tick)
      resolve(new Blob(chunks, { type: 'video/mp4' }))
    }
  })
  rec.start(500)
  void opts.until?.then(() => { if (rec.state === 'recording') rec.stop() })
  return { stop: () => { if (rec.state === 'recording') rec.stop() }, done }
}

export function VideoNoteField({ value, onChange, folder }: { value: string; onChange: (url: string) => void; folder: string }) {
  const [busy, setBusy] = useState('')
  const [msg, setMsg] = useState('')
  const [cam, setCam] = useState(false)
  const [sec, setSec] = useState<number | null>(null)
  const live = useRef<HTMLVideoElement>(null)
  const stream = useRef<MediaStream | null>(null)
  const recording = useRef<{ stop: () => void } | null>(null)
  const mime = mp4Mime()
  const stopCamera = () => { stream.current?.getTracks().forEach((t) => t.stop()); stream.current = null }
  useEffect(() => () => stopCamera(), [])

  const upload = async (blob: Blob) => {
    if (blob.size > MAX_MB * 1024 * 1024) return setMsg(`Кружок получился ${(blob.size / 1048576).toFixed(1)} МБ, допустимо до ${MAX_MB} МБ. Сделайте короче.`)
    setBusy('Загружаю…')
    const path = `${folder}/videonote-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.mp4`
    const { error } = await supabase.storage.from('media').upload(path, blob, { contentType: 'video/mp4', cacheControl: '31536000' })
    setBusy('')
    if (error) return setMsg('Не удалось загрузить кружок. Попробуйте ещё раз.')
    onChange(supabase.storage.from('media').getPublicUrl(path).data.publicUrl)
    setMsg('Кружок готов')
  }

  const openCamera = async () => {
    setMsg('')
    if (!mime) return setMsg('Этот браузер не умеет записывать MP4, а Telegram принимает кружки только в MP4. Откройте админку в Safari или в Chrome последней версии.')
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 720 }, height: { ideal: 720 } }, audio: true })
    } catch {
      return setMsg('Нет доступа к камере или микрофону. Разрешите их в настройках браузера.')
    }
    setCam(true)
    requestAnimationFrame(() => { if (live.current && stream.current) { live.current.srcObject = stream.current; void live.current.play() } })
  }

  const startRec = () => {
    if (!live.current || !stream.current || !mime) return
    setSec(0)
    const r = recordSquare(live.current, stream.current.getAudioTracks(), mime, { mirror: true, onTick: setSec })
    recording.current = r
    void r.done.then(async (blob) => {
      recording.current = null
      setSec(null)
      setCam(false)
      stopCamera()
      await upload(blob)
    })
  }

  /** Готовое видео: обрезаем до квадрата и до 60 секунд (перекодирование идёт в реальном времени). */
  const pickFile = async (file: File | undefined) => {
    if (!file) return
    setMsg('')
    if (!file.type.startsWith('video/')) return setMsg('Нужен видеофайл')
    if (!mime) return setMsg('Этот браузер не умеет готовить MP4. Откройте админку в Safari или в Chrome последней версии.')
    const url = URL.createObjectURL(file)
    const v = document.createElement('video')
    v.src = url
    v.playsInline = true
    v.preload = 'auto'
    try {
      await new Promise<void>((res, rej) => { v.onloadedmetadata = () => res(); v.onerror = () => rej(new Error('bad')) })
    } catch {
      URL.revokeObjectURL(url)
      return setMsg('Не получилось открыть видео. Попробуйте другой файл (MP4 или MOV).')
    }
    const square = v.videoWidth === v.videoHeight
    if (square && v.duration <= MAX_SEC && /mp4/.test(file.type)) {
      URL.revokeObjectURL(url)
      return upload(file)
    }
    setBusy(`Готовлю кружок: ${Math.min(Math.ceil(v.duration), MAX_SEC)} с…`)
    // звук ролика через Web Audio: так он попадает в запись, но не играет в колонках
    const ac = new AudioContext()
    const dest = ac.createMediaStreamDestination()
    ac.createMediaElementSource(v).connect(dest)
    const ended = new Promise<void>((res) => { v.onended = () => res() })
    await v.play()
    const r = recordSquare(v, dest.stream.getAudioTracks(), mime, { until: ended, onTick: (s) => setBusy(`Готовлю кружок: ${s} из ${Math.min(Math.ceil(v.duration), MAX_SEC)} с…`) })
    const blob = await r.done
    v.pause()
    await ac.close()
    URL.revokeObjectURL(url)
    await upload(blob)
  }

  return (
    <div className="mfield vnote">
      {value && <video className="vnote-prev" src={value} controls playsInline />}
      {cam ? (
        <div className="vnote-cam">
          <video ref={live} className="vnote-live" muted playsInline />
          <div className="ibtns">
            {sec === null
              ? <div className="ibw"><button type="button" className="ibtn rec-btn" onClick={startRec} title="Начать запись" aria-label="Начать запись"><Icon name="video" size={20} /></button><span>Записать</span></div>
              : <div className="ibw"><button type="button" className="ibtn stop-btn" onClick={() => recording.current?.stop()} title="Остановить" aria-label="Остановить"><Icon name="stop" size={18} /></button><span>{`0:${String(sec).padStart(2, '0')} / 1:00`}</span></div>}
            {sec === null && <div className="ibw"><button type="button" className="ibtn" onClick={() => { setCam(false); stopCamera() }} title="Закрыть камеру" aria-label="Закрыть камеру"><Icon name="trash" size={18} /></button><span>Отмена</span></div>}
          </div>
        </div>
      ) : (
        <div className="drop">
          <div className="drop-hint"><Icon name="video" size={22} /><span>{busy || 'Кружок: квадратное видео до 1 минуты'}</span></div>
          <div className="ibtns">
            <div className="ibw"><button type="button" className="ibtn" disabled={!!busy} onClick={openCamera} title="Записать кружок камерой" aria-label="Записать кружок камерой"><Icon name="camera" size={20} /></button><span>Записать</span></div>
            <div className="ibw">
              <label className="ibtn" title="Выбрать видео" aria-label="Выбрать видео" aria-disabled={!!busy}>
                <Icon name="upload" size={20} />
                <input type="file" hidden accept="video/*" disabled={!!busy} onChange={(e) => { void pickFile(e.target.files?.[0]); e.target.value = '' }} />
              </label>
              <span>Из галереи</span>
            </div>
            {value && <div className="ibw"><button type="button" className="ibtn" onClick={() => onChange('')} title="Убрать кружок" aria-label="Убрать кружок"><Icon name="trash" size={18} /></button><span>Убрать</span></div>}
          </div>
        </div>
      )}
      {msg && !busy && <div className="hint" role="status">{msg}</div>}
      <div className="hint">Кружок уходит отдельным сообщением: подписи у кружков в Telegram нет, текст блока придёт рядом.</div>
    </div>
  )
}

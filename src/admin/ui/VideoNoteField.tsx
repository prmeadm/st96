import { useEffect, useRef, useState } from 'react'
import { supabase } from '../supabase'
import { Icon } from './Icon'

// Видеосообщение-«кружок» Telegram: квадратное видео MP4 до 60 секунд. Telegram отправляет кружки только загруженным файлом,
// поэтому файл кладём в хранилище, а бот при отправке скачивает его и загружает в Telegram.
const SIZE = 480 // сторона квадрата: Telegram рекомендует до 640
const MAX_SEC = 59 // Telegram принимает кружки до 60 с; запас в секунду, иначе запись на 1:00 придёт обычным видео
const camVideo = (facingMode: 'user' | 'environment'): MediaTrackConstraints => ({ facingMode, width: { ideal: 720 }, height: { ideal: 720 } })
const fmt = (t: number) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`
const NOTE_MAX_BYTES = 12 * 1024 * 1024 // предел Telegram для кружка (12 582 912 байт); больше — Telegram покажет обычное видео
// Браузеры превышают заказанный битрейт почти вдвое: 700 кбит/с дают ~1,4 Мбит/с, это ~10 МБ за 59 с
const NOTE_BPS = 700_000

/** MP4, который понимает Telegram. WebM (старый Chrome, Firefox) кружком не отправится. */
const mp4Mime = () => (typeof MediaRecorder === 'undefined' ? null : ['video/mp4;codecs=avc1.42E01E,mp4a.40.2', 'video/mp4;codecs=avc1', 'video/mp4'].find((m) => MediaRecorder.isTypeSupported(m)) ?? null)

/** Пишет квадрат из центра кадра: видео рисуется на холст, звук берётся из переданных дорожек. */
function recordSquare(video: HTMLVideoElement, audio: MediaStreamTrack[], mime: string, opts: { mirror?: () => boolean; onTick?: (sec: number) => void; until?: Promise<void>; bps?: number }) {
  const canvas = document.createElement('canvas')
  canvas.width = SIZE
  canvas.height = SIZE
  const ctx = canvas.getContext('2d')!
  let raf = 0
  let frames = 0
  const draw = () => {
    const vw = video.videoWidth, vh = video.videoHeight
    if (vw && vh) {
      frames++
      const s = Math.min(vw, vh)
      ctx.save()
      if (opts.mirror?.()) { ctx.translate(SIZE, 0); ctx.scale(-1, 1) }
      ctx.drawImage(video, (vw - s) / 2, (vh - s) / 2, s, s, 0, 0, SIZE, SIZE)
      ctx.restore()
    }
    raf = requestAnimationFrame(draw)
  }
  draw()
  const stream = canvas.captureStream(30)
  audio.forEach((t) => stream.addTrack(t))
  const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: opts.bps ?? NOTE_BPS }) // audioBitsPerSecond не задаём: Chrome с ним падает на MP4
  let failed = false
  rec.onerror = () => { failed = true }
  const chunks: Blob[] = []
  rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data) }
  const t0 = Date.now()
  const tick = window.setInterval(() => opts.onTick?.(Math.min(MAX_SEC, Math.floor((Date.now() - t0) / 1000))), 250)
  const limit = window.setTimeout(() => { if (rec.state === 'recording') rec.stop() }, MAX_SEC * 1000) // ровно 59 с, дольше записать нельзя
  // null: ни одного кадра с камеры или из ролика (было бы чёрное видео) или запись сорвалась
  const done = new Promise<Blob | null>((resolve) => {
    rec.onstop = () => {
      cancelAnimationFrame(raf)
      window.clearInterval(tick)
      window.clearTimeout(limit)
      resolve(frames && !failed ? new Blob(chunks, { type: 'video/mp4' }) : null)
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
  const [ready, setReady] = useState(false)
  // длинный ролик из галереи: выбор куска до 59 с, как в Telegram
  const [trim, setTrim] = useState<{ url: string; duration: number; start: number; end: number } | null>(null)
  const trimVideo = useRef<HTMLVideoElement>(null)
  const live = useRef<HTMLVideoElement>(null)
  const stream = useRef<MediaStream | null>(null)
  const recording = useRef<{ stop: () => void } | null>(null)
  // фронтальная камера (зеркалим, как в Telegram) или основная; переключать можно и во время записи
  const [facing, setFacing] = useState<'user' | 'environment'>('user')
  const [multiCam, setMultiCam] = useState(false)
  const [switching, setSwitching] = useState(false)
  const mirror = useRef(true)
  const mime = mp4Mime()
  const stopCamera = () => { stream.current?.getTracks().forEach((t) => t.stop()); stream.current = null }
  useEffect(() => () => stopCamera(), [])
  // поток подключаем после того, как <video> появился на странице: иначе круг остаётся пустым, а кружок выходит чёрным
  useEffect(() => {
    const v = live.current
    if (!cam || !v || !stream.current) return
    setReady(false)
    v.srcObject = stream.current
    v.onloadeddata = () => setReady(v.videoWidth > 0)
    void v.play().catch(() => {})
  }, [cam])

  const upload = async (blob: Blob, shrunk = false): Promise<void> => {
    if (blob.size > NOTE_MAX_BYTES) {
      // тяжелее 12 МБ Telegram кружок не принимает: один раз пережимаем с меньшим битрейтом
      if (!shrunk) return makeNote(URL.createObjectURL(blob), 0, Infinity, { bps: Math.floor(NOTE_BPS * (NOTE_MAX_BYTES / blob.size) * 0.7), shrunk: true })
      return setMsg(`Кружок получился ${(blob.size / 1048576).toFixed(1)} МБ, а Telegram принимает до 12 МБ. Сделайте его короче.`)
    }
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
      stream.current = await navigator.mediaDevices.getUserMedia({ video: camVideo('user'), audio: true })
    } catch {
      return setMsg('Нет доступа к камере или микрофону. Разрешите их в настройках браузера.')
    }
    if (!stream.current.getVideoTracks().some((t) => t.readyState === 'live')) {
      stopCamera()
      return setMsg('Камера не отдаёт изображение. Закройте другие программы, которые её используют, и попробуйте снова.')
    }
    setFacing('user')
    mirror.current = true
    // названия камер видны только после разрешения, поэтому считаем их здесь
    const devices = await navigator.mediaDevices.enumerateDevices().catch(() => [])
    setMultiCam(devices.filter((d) => d.kind === 'videoinput').length > 1)
    setCam(true)
  }

  /** Меняет камеру на лету: запись идёт с того же <video>, микрофон остаётся прежним, поэтому кружок не прерывается. */
  const switchCamera = async () => {
    const s = stream.current, v = live.current
    if (!s || !v || switching) return
    const next = facing === 'user' ? 'environment' : 'user'
    setSwitching(true)
    const current = s.getVideoTracks()[0]?.getSettings().deviceId
    const other = (await navigator.mediaDevices.enumerateDevices().catch(() => [])).find((d) => d.kind === 'videoinput' && d.deviceId && d.deviceId !== current)?.deviceId
    // старую камеру отпускаем заранее: многие телефоны не открывают две камеры сразу
    s.getVideoTracks().forEach((t) => t.stop())
    // телефон: камеру выбираем по направлению; компьютер с двумя камерами направления не знает, тогда берём другую по списку
    const tries: MediaTrackConstraints[] = [{ ...camVideo(next), facingMode: { exact: next } }]
    if (other) tries.push({ ...camVideo(next), facingMode: undefined, deviceId: { exact: other } })
    let fresh: MediaStream | null = null
    for (const video of tries) {
      try { fresh = await navigator.mediaDevices.getUserMedia({ video }); break } catch { /* следующий способ */ }
    }
    if (fresh) {
      setFacing(next)
      mirror.current = next === 'user'
    } else {
      setMsg('Не удалось включить другую камеру.')
      fresh = await navigator.mediaDevices.getUserMedia({ video: camVideo(facing) }).catch(() => null)
    }
    setSwitching(false)
    if (!fresh) return setMsg('Камера отключилась. Закройте запись и откройте снова.')
    stream.current = new MediaStream([...s.getAudioTracks(), ...fresh.getVideoTracks()])
    v.srcObject = stream.current
    void v.play().catch(() => {})
  }

  const startRec = () => {
    if (!live.current || !stream.current || !mime) return
    if (!live.current.videoWidth) return setMsg('Камера ещё включается, подождите секунду.')
    setMsg('')
    setSec(0)
    const r = recordSquare(live.current, stream.current.getAudioTracks(), mime, { mirror: () => mirror.current, onTick: setSec })
    recording.current = r
    void r.done.then(async (blob) => {
      recording.current = null
      setSec(null)
      setCam(false)
      stopCamera()
      if (!blob) return setMsg('С камеры не пришло изображение, кружок не сохранён. Попробуйте ещё раз.')
      await upload(blob)
    })
  }

  /** Готовое видео: квадратный MP4 до 59 с уходит как есть, короткое обрезаем до квадрата, у длинного сначала выбираем кусок. */
  const pickFile = async (file: File | undefined) => {
    if (!file) return
    setMsg('')
    if (!file.type.startsWith('video/')) return setMsg('Нужен видеофайл')
    if (!mime) return setMsg('Этот браузер не умеет готовить MP4. Откройте админку в Safari или в Chrome последней версии.')
    const url = URL.createObjectURL(file)
    const v = document.createElement('video')
    v.src = url
    v.preload = 'metadata'
    try {
      await new Promise<void>((res, rej) => { v.onloadedmetadata = () => res(); v.onerror = () => rej(new Error('bad')) })
    } catch {
      URL.revokeObjectURL(url)
      return setMsg('Не получилось открыть видео. Попробуйте другой файл (MP4 или MOV).')
    }
    if (v.videoWidth === v.videoHeight && v.duration <= MAX_SEC && /mp4/.test(file.type) && file.size <= NOTE_MAX_BYTES) {
      URL.revokeObjectURL(url)
      return upload(file)
    }
    if (v.duration > MAX_SEC) return setTrim({ url, duration: v.duration, start: 0, end: MAX_SEC })
    await makeNote(url, 0, v.duration)
  }

  /** Перекодирует кусок [start, end] ролика в квадратный кружок (в реальном времени) и загружает. */
  const makeNote = async (url: string, start: number, end: number, opts: { bps?: number; shrunk?: boolean } = {}) => {
    const label = opts.shrunk ? 'Сжимаю кружок до 12 МБ' : 'Готовлю кружок'
    setBusy(`${label}…`)
    const v = document.createElement('video')
    v.src = url
    v.playsInline = true
    v.preload = 'auto'
    try {
      await new Promise<void>((res, rej) => { v.onloadeddata = () => res(); v.onerror = () => rej(new Error('bad')) })
      if (start > 0) await new Promise<void>((res) => { v.onseeked = () => res(); v.currentTime = start })
      if (!Number.isFinite(v.duration)) await new Promise<void>((res) => { v.ondurationchange = () => { if (Number.isFinite(v.duration)) res() }; setTimeout(res, 1500) })
    } catch {
      URL.revokeObjectURL(url)
      setBusy('')
      return setMsg('Не получилось открыть видео. Попробуйте другой файл (MP4 или MOV).')
    }
    // звук ролика через Web Audio: так он попадает в запись, но не играет в колонках
    const ac = new AudioContext()
    const dest = ac.createMediaStreamDestination()
    ac.createMediaElementSource(v).connect(dest)
    const len = Math.min(MAX_SEC, Math.ceil(Math.min(end, Number.isFinite(v.duration) ? v.duration : MAX_SEC) - start))
    const reached = new Promise<void>((res) => {
      v.onended = () => res()
      v.ontimeupdate = () => { if (v.currentTime >= end) res() }
    })
    await v.play()
    const r = recordSquare(v, dest.stream.getAudioTracks(), mime!, { until: reached, bps: opts.bps, onTick: (s) => setBusy(`${label}: ${s} из ${len} с…`) })
    const blob = await r.done
    v.pause()
    await ac.close()
    URL.revokeObjectURL(url)
    setBusy('')
    if (!blob) return setMsg('Не получилось прочитать кадры видео. Попробуйте другой файл.')
    await upload(blob, opts.shrunk)
  }

  // превью выбранного куска крутится по кругу от начала до конца
  useEffect(() => {
    const v = trimVideo.current
    if (!trim || !v) return
    if (v.currentTime < trim.start || v.currentTime > trim.end) v.currentTime = trim.start
    v.ontimeupdate = () => { if (v.currentTime >= trim.end) v.currentTime = trim.start }
  }, [trim])

  /** Двигаем начало или конец; кусок не длиннее 59 с и не короче 1 с, второй край едет следом. */
  const moveTrim = (edge: 'start' | 'end', t: number) => setTrim((x) => {
    if (!x) return x
    let { start, end } = x
    if (edge === 'start') {
      start = Math.min(t, x.duration - 1)
      if (end - start > MAX_SEC) end = start + MAX_SEC
      if (end <= start) end = Math.min(x.duration, start + 1)
      if (trimVideo.current) trimVideo.current.currentTime = start
    } else {
      end = Math.max(t, 1)
      if (end - start > MAX_SEC) start = end - MAX_SEC
      if (start >= end) start = Math.max(0, end - 1)
      if (trimVideo.current) trimVideo.current.currentTime = Math.max(start, end - 2)
    }
    return { ...x, start, end }
  })

  const cancelTrim = () => { if (trim) URL.revokeObjectURL(trim.url); setTrim(null) }
  const confirmTrim = () => {
    if (!trim) return
    const { url, start, end } = trim
    setTrim(null)
    void makeNote(url, start, end)
  }

  return (
    <div className="mfield vnote">
      {value && <video className="vnote-prev" src={value} controls playsInline />}
      {trim ? (
        <div className="vnote-trim">
          <video ref={trimVideo} className="vnote-prev" src={trim.url} autoPlay muted playsInline loop={false} />
          <div className="vnote-trim-len">{fmt(trim.start)} – {fmt(trim.end)} · {Math.round(trim.end - trim.start)} с из {fmt(trim.duration)}</div>
          <div className="vnote-trim-track">
            <div className="vnote-trim-sel" style={{ left: `${(trim.start / trim.duration) * 100}%`, width: `${((trim.end - trim.start) / trim.duration) * 100}%` }} />
            <input type="range" min={0} max={trim.duration} step={0.1} value={trim.start} onChange={(e) => moveTrim('start', Number(e.target.value))} aria-label="Начало куска" />
            <input type="range" min={0} max={trim.duration} step={0.1} value={trim.end} onChange={(e) => moveTrim('end', Number(e.target.value))} aria-label="Конец куска" />
          </div>
          <div className="hint">Ролик длиннее 59 секунд. Выберите кусок: перетащите начало и конец.</div>
          <div className="vnote-trim-btns">
            <button type="button" className="btn" onClick={cancelTrim}>Отмена</button>
            <button type="button" className="btn primary" onClick={confirmTrim}>Сделать кружок</button>
          </div>
        </div>
      ) : cam ? (
        <div className="vnote-cam">
          <video ref={live} className={facing === 'user' ? 'vnote-live front' : 'vnote-live'} autoPlay muted playsInline />
          <div className="ibtns">
            {sec === null
              ? <div className="ibw"><button type="button" className="ibtn rec-btn" disabled={!ready} onClick={startRec} title="Начать запись" aria-label="Начать запись"><Icon name="video" size={20} /></button><span>{ready ? 'Записать' : 'Включаю камеру…'}</span></div>
              : <div className="ibw"><button type="button" className="ibtn stop-btn" onClick={() => recording.current?.stop()} title="Остановить" aria-label="Остановить"><Icon name="stop" size={18} /></button><span>{`${fmt(sec)} / ${fmt(MAX_SEC)}`}</span></div>}
            {multiCam && <div className="ibw"><button type="button" className="ibtn" disabled={switching || !ready} onClick={() => void switchCamera()} title="Сменить камеру" aria-label="Сменить камеру"><Icon name="flip" size={20} /></button><span>{facing === 'user' ? 'Основная' : 'Фронтальная'}</span></div>}
            {sec === null && <div className="ibw"><button type="button" className="ibtn" onClick={() => { setCam(false); stopCamera() }} title="Закрыть камеру" aria-label="Закрыть камеру"><Icon name="trash" size={18} /></button><span>Отмена</span></div>}
          </div>
        </div>
      ) : (
        <div className="drop">
          <div className="drop-hint"><Icon name="video" size={22} /><span>{busy || 'Кружок: квадратное видео до 59 секунд'}</span></div>
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
      <div className="hint">Кружок приходит первым, текст блока и кнопки — следующим сообщением прямо под ним (подписи у кружков в Telegram нет).</div>
    </div>
  )
}

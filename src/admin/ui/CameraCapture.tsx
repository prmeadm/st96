import { useEffect, useRef, useState } from 'react'
import { Icon } from './Icon'

type Shot = { blob: Blob; url: string; ext: string; type: string }
const MAX_VIDEO_SEC = 90
const MB = 1024 * 1024
const CAM_KEY = 'st96-camera'
const isSafari = /^((?!chrome|android|crios|fxios).)*safari/i.test(navigator.userAgent)
const touch = () => window.matchMedia('(pointer: coarse)').matches

/** Камера того устройства, с которого нажали «Снять»: превью, снимок или запись видео, просмотр и подтверждение. Нужен доступ к камере (и микрофону для видео). */
export function CameraCapture({ mode, maxMB, onDone, onClose, onFallback }: {
  mode: 'photo' | 'video'
  maxMB: number
  onDone: (blob: Blob, ext: string, type: string) => void
  onClose: () => void
  onFallback: () => void
}) {
  const videoEl = useRef<HTMLVideoElement>(null)
  const currentId = useRef('')
  const currentIsPhone = useRef(false)
  const stream = useRef<MediaStream | null>(null)
  const rec = useRef<MediaRecorder | null>(null)
  const timer = useRef<number | undefined>(undefined)
  // Камера выбирается явно и запоминается: на Mac рядом лежащий iPhone системе виден как камера и мог бы выбраться сам
  const [deviceId, setDeviceId] = useState<string>(() => { try { return localStorage.getItem(CAM_KEY) ?? '' } catch { return '' } })
  const [active, setActive] = useState('')
  const [devices, setDevices] = useState<{ id: string; label: string }[]>([])
  const [err, setErr] = useState('')
  const [ready, setReady] = useState(false)
  const [sec, setSec] = useState<number | null>(null)
  const [shot, setShot] = useState<Shot | null>(null)
  const [note, setNote] = useState('')

  const stop = () => { window.clearInterval(timer.current); stream.current?.getTracks().forEach((t) => t.stop()); stream.current = null }
  useEffect(() => () => stop(), [])
  useEffect(() => () => { if (shot) URL.revokeObjectURL(shot.url) }, [shot])
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [onClose])

  // Включаем камеру при открытии, при смене камеры и после «Переснять»
  useEffect(() => {
    if (shot) return
    let off = false
    setReady(false)
    setErr('')
    stop()
    if (!navigator.mediaDevices?.getUserMedia) { setErr('Этот браузер не даёт открыть камеру.'); return }
    const video = deviceId ? { deviceId: { exact: deviceId }, width: { ideal: 1920 } } : touch() ? { facingMode: { ideal: 'environment' }, width: { ideal: 1920 } } : { facingMode: { ideal: 'user' }, width: { ideal: 1920 } }
    navigator.mediaDevices.getUserMedia({ video, audio: mode === 'video' })
      .then(async (s) => {
        if (off) return s.getTracks().forEach((t) => t.stop())
        stream.current = s
        if (videoEl.current) { videoEl.current.srcObject = s; void videoEl.current.play().catch(() => undefined) }
        // после разрешения у устройств появляются названия: показываем список камер
        setActive(s.getVideoTracks()[0]?.label ?? '')
        await refreshDevices()
        const cur = s.getVideoTracks()[0]?.getSettings().deviceId
        if (cur && cur !== deviceId) setCurrent(cur)
        setReady(true)
      })
      .catch((e: unknown) => {
        // запомненная камера могла исчезнуть (iPhone ушёл из зоны): возвращаемся к камере по умолчанию
        if (deviceId && /overconstrained|notfound/i.test(String(e))) { setDeviceId(''); try { localStorage.removeItem(CAM_KEY) } catch { /* необязательно */ } return }
        setErr(/denied|permission|notallowed/i.test(String(e)) ? 'Нет доступа к камере. Разрешите камеру и микрофон для этого сайта в настройках браузера и откройте снова.' : 'Камера недоступна: она занята другой программой или не найдена.')
      })
    return () => { off = true }
  }, [deviceId, shot, mode])

  const setCurrent = (id: string) => { currentId.current = id }
  async function refreshDevices() {
    const list = (await navigator.mediaDevices.enumerateDevices().catch(() => [])).filter((d) => d.kind === 'videoinput')
    const all = list.map((d, i) => ({ id: d.deviceId, label: d.label || `Камера ${i + 1}` }))
    setDevices(all)
    // iPhone по умолчанию: если браузер видит его камеру и выбор ещё не сделан вручную, берём её и запоминаем
    const phone = all.find((d) => /iphone|continuity/i.test(d.label))
    let saved = ''
    try { saved = localStorage.getItem(CAM_KEY) ?? '' } catch { /* необязательно */ }
    if (phone && !saved && !currentIsPhone.current && phone.id !== currentId.current) { currentIsPhone.current = true; choose(phone.id) }
  }
  // iPhone рядом может появиться или исчезнуть как камера уже после открытия окна
  useEffect(() => {
    const md = navigator.mediaDevices
    if (!md?.addEventListener) return
    const f = () => void refreshDevices()
    md.addEventListener('devicechange', f)
    return () => md.removeEventListener('devicechange', f)
  }, [])
  const choose = (id: string) => { setDeviceId(id); try { localStorage.setItem(CAM_KEY, id) } catch { /* необязательно */ } }

  const snap = () => {
    const v = videoEl.current
    if (!v || !v.videoWidth) return
    const k = Math.min(1, 2000 / Math.max(v.videoWidth, v.videoHeight))
    const c = document.createElement('canvas')
    c.width = Math.round(v.videoWidth * k)
    c.height = Math.round(v.videoHeight * k)
    c.getContext('2d')!.drawImage(v, 0, 0, c.width, c.height)
    c.toBlob((b) => { if (b) { stop(); setShot({ blob: b, url: URL.createObjectURL(b), ext: 'jpg', type: 'image/jpeg' }) } }, 'image/jpeg', 0.85)
  }

  const startRec = () => {
    const s = stream.current
    if (!s || typeof MediaRecorder === 'undefined') return setErr('Этот браузер не умеет записывать видео.')
    // Telegram лучше всего принимает MP4; WebM он покажет файлом
    const mime = ['video/mp4;codecs=avc1.42E01E,mp4a.40.2', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm'].find((m) => MediaRecorder.isTypeSupported(m))
    const mr = new MediaRecorder(s, { ...(mime ? { mimeType: mime } : {}), videoBitsPerSecond: 1_500_000 })
    const chunks: Blob[] = []
    mr.ondataavailable = (e) => e.data.size && chunks.push(e.data)
    mr.onstop = () => {
      window.clearInterval(timer.current)
      const type = (mr.mimeType || mime || 'video/webm').split(';')[0]!
      const blob = new Blob(chunks, { type })
      stop()
      setSec(null)
      setNote(type === 'video/mp4' ? '' : 'Браузер записал видео в формате WebM: Telegram может показать его как файл. Для обычного видео снимайте в Safari или на телефоне.')
      setShot({ blob, url: URL.createObjectURL(blob), ext: type === 'video/mp4' ? 'mp4' : 'webm', type })
    }
    rec.current = mr
    mr.start(1000)
    setSec(0)
    timer.current = window.setInterval(() => setSec((x) => {
      const n = (x ?? 0) + 1
      if (n >= MAX_VIDEO_SEC && mr.state === 'recording') mr.stop()
      return n
    }), 1000)
  }
  const stopRec = () => rec.current?.state === 'recording' && rec.current.stop()
  const mm = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
  const tooBig = shot ? shot.blob.size > maxMB * MB : false

  return (
    <div className="cam-ov" role="dialog" aria-modal="true" aria-label={mode === 'photo' ? 'Снять фото' : 'Снять видео'}>
      <div className="cam">
        <div className="cam-top">
          <b>{mode === 'photo' ? 'Снять фото' : 'Снять видео'}</b><span className="sp" />
          <button type="button" className="ibtn" onClick={() => { stopRec(); stop(); onClose() }} aria-label="Закрыть" title="Закрыть"><Icon name="close" size={20} /></button>
        </div>
        {!shot && sec === null && ready && (devices.length > 1 ? (
          <label className="cam-pick"><span>Камера</span>
            <select value={deviceId || currentId.current} onChange={(e) => choose(e.target.value)} aria-label="Выбор камеры">
              {devices.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
            </select>
          </label>
        ) : (
          <div className="cam-one">
            <div><span>Камера:</span> <b>{active || devices[0]?.label || 'не определена'}</b></div>
            <div className="hint">Safari сообщил камер: {devices.length}{devices.length ? ` (${devices.map((d) => d.label).join('; ')})` : ''}. Вид браузера: {isSafari ? 'Safari' : 'другой'}.</div>
            {isSafari
              ? <div className="hint">Safari отдаёт сайту только одну камеру, и её выбирает macOS, сайт переключить её не может. <b>Чтобы Mac взял iPhone:</b> положите iPhone рядом экраном вниз или к экрану, заблокированным и в горизонтальном положении, включите Wi-Fi и Bluetooth (тот же Apple ID), в настройках iPhone включите «Непрерывность камеры» (Основные → AirPlay и Handoff), закройте это окно и откройте «Снять» снова. Для фото ещё есть кнопка «Из галереи» → в системном окне «Импорт с iPhone» → «Снять фото». Другой вариант: Chrome показывает все камеры списком. <button type="button" className="lnk" onClick={() => void refreshDevices()}>Обновить список</button></div>
              : <div className="hint">Браузер показывает только эту камеру. Другую выберите в настройках браузера для сайта: в Chrome нажмите значок камеры справа в адресной строке. <button type="button" className="lnk" onClick={() => void refreshDevices()}>Обновить список</button></div>}
          </div>
        ))}
        <div className="cam-view">
          {err ? (
            <div className="cam-err" role="alert">
              <p>{err}</p>
              <button type="button" className="btn" onClick={() => { stop(); onFallback() }}>Выбрать файл вместо камеры</button>
            </div>
          ) : shot ? (
            mode === 'photo' ? <img src={shot.url} alt="Снимок" /> : <video src={shot.url} controls playsInline />
          ) : (
            <video ref={videoEl} playsInline muted autoPlay className={/front|facetime|встроенн|built-in/i.test(devices.find((d) => d.id === (deviceId || currentId.current))?.label ?? '') ? 'mirror' : ''} />
          )}
          {sec !== null && <div className="cam-rec"><i className="dot" aria-hidden="true" /> {mm(sec)} из {mm(MAX_VIDEO_SEC)}</div>}
        </div>
        {note && shot && <div className="cam-note">{note}</div>}
        {tooBig && <div className="cam-note bad">Файл слишком большой: {(shot!.blob.size / MB).toFixed(1)} МБ, допустимо до {maxMB} МБ. Снимите короче.</div>}
        <div className="cam-bar">
          {shot ? (
            <>
              <div className="ibw"><button type="button" className="ibtn" onClick={() => { setShot(null); setNote('') }} aria-label="Переснять" title="Переснять"><Icon name="close" size={20} /></button><span>Переснять</span></div>
              <div className="ibw"><button type="button" className="ibtn rec-btn" disabled={tooBig} onClick={() => onDone(shot.blob, shot.ext, shot.type)} aria-label="Использовать" title="Использовать"><Icon name="check" size={22} /></button><span>Использовать</span></div>
            </>
          ) : !err && (
            <>
              {mode === 'photo'
                ? <div className="ibw"><button type="button" className="ibtn shutter" disabled={!ready} onClick={snap} aria-label="Сделать снимок" title="Сделать снимок"><Icon name="camera" size={26} /></button><span>Снимок</span></div>
                : sec === null
                  ? <div className="ibw"><button type="button" className="ibtn shutter rec" disabled={!ready} onClick={startRec} aria-label="Начать запись" title="Начать запись"><Icon name="video" size={26} /></button><span>Запись</span></div>
                  : <div className="ibw"><button type="button" className="ibtn stop-btn shutter" onClick={stopRec} aria-label="Остановить запись" title="Остановить запись"><Icon name="stop" size={22} /></button><span>Стоп</span></div>}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

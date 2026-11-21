// Голос в поддержке: распознавание речи (faster-whisper) и синтез (piper), конверсия ffmpeg.
// Бинарники/модели ставятся на сервер, пути настраиваются env (WHISPER_PY, WHISPER_MODEL, PIPER_BIN, PIPER_VOICE).
import { execFile } from 'node:child_process'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const WHISPER_PY = process.env.WHISPER_PY ?? '/home/dsh/.venv-whisper/bin/python'
const WHISPER_MODEL = process.env.WHISPER_MODEL ?? 'small'
const PIPER_BIN = process.env.PIPER_BIN ?? '/home/dsh/tools/piper/piper/piper'
const PIPER_VOICE = process.env.PIPER_VOICE ?? '/home/dsh/tools/piper/voices/ru_RU-irina-medium.onnx'
const YANDEX_API_KEY = process.env.YANDEX_API_KEY ?? ''
const YANDEX_VOICE = process.env.YANDEX_VOICE ?? 'filipp'
const STT_SCRIPT = join(HERE, 'stt.py')

function run(cmd: string, args: string[], opts: { input?: Buffer | string; timeout?: number } = {}): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = execFile(cmd, args, { timeout: opts.timeout ?? 180_000, maxBuffer: 20 * 1024 * 1024 }, (err, stdout, stderr) => {
      if (err) reject(new Error((stderr || err.message || 'error').slice(-500)))
      else resolve(stdout)
    })
    if (opts.input != null) child.stdin?.end(opts.input)
  })
}

/** Скачать голосовое из Telegram по file_id (нужен токен бота). */
export async function downloadTelegramVoice(token: string, fileId: string): Promise<Buffer> {
  const r = await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${encodeURIComponent(fileId)}`)
  const j = (await r.json()) as { ok: boolean; result?: { file_path?: string }; description?: string }
  if (!j.ok || !j.result?.file_path) throw new Error('getFile: ' + (j.description ?? 'no file_path'))
  const f = await fetch(`https://api.telegram.org/file/bot${token}/${j.result.file_path}`)
  if (!f.ok) throw new Error('download: HTTP ' + f.status)
  return Buffer.from(await f.arrayBuffer())
}

/** Распознать речь (faster-whisper, русский). */
export async function transcribeAudio(input: Buffer, filename = 'voice.ogg'): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'stt-'))
  try {
    const src = join(dir, filename)
    await writeFile(src, input)
    const out = await run(WHISPER_PY, [STT_SCRIPT, src, WHISPER_MODEL], { timeout: 300_000 })
    const j = JSON.parse(out) as { text?: string }
    return (j.text ?? '').trim()
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
}

/** Текст для озвучки: без ссылок и эмодзи (piper читает их буквально). */
export function toSpeechText(text: string): string {
  return text
    .replace(/https?:\/\/\S+/gi, '')
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Синтез речи Yandex SpeechKit → OGG/Opus (готово для Telegram voice). */
export async function synthesizeVoiceYandex(text: string): Promise<Buffer> {
  if (!YANDEX_API_KEY) throw new Error('YANDEX_API_KEY не задан')
  const body = new URLSearchParams({ text: toSpeechText(text), lang: 'ru-RU', voice: YANDEX_VOICE, format: 'oggopus', speed: '1.0' })
  const r = await fetch('https://tts.api.cloud.yandex.net/speech/v1/tts:synthesize', {
    method: 'POST',
    headers: { Authorization: 'Api-Key ' + YANDEX_API_KEY, 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  if (!r.ok) throw new Error('Yandex TTS ' + r.status + ': ' + (await r.text().catch(() => '')).slice(0, 200))
  return Buffer.from(await r.arrayBuffer())
}

/** Синтез речи (piper) → OGG/Opus: локальный резерв, если Yandex недоступен. */
async function synthesizeVoicePiper(text: string): Promise<Buffer> {
  const dir = await mkdtemp(join(tmpdir(), 'tts-'))
  try {
    const wav = join(dir, 'out.wav')
    await run(PIPER_BIN, ['--model', PIPER_VOICE, '--output_file', wav], { input: toSpeechText(text), timeout: 120_000 })
    const ogg = join(dir, 'out.ogg')
    await run('ffmpeg', ['-y', '-loglevel', 'error', '-i', wav, '-c:a', 'libopus', '-b:a', '48k', '-ar', '48000', '-ac', '1', '-f', 'ogg', ogg], { timeout: 60_000 })
    return await readFile(ogg)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
}

/** Синтез речи: Yandex (filipp), при сбое — локальный piper. */
export async function synthesizeVoice(text: string): Promise<Buffer> {
  try {
    return await synthesizeVoiceYandex(text)
  } catch (e) {
    console.error('Yandex TTS failed, fallback piper:', e instanceof Error ? e.message : e)
    return synthesizeVoicePiper(text)
  }
}

/** Отправить голосовое сообщение (multipart). */
export async function sendTelegramVoice(token: string, chatId: string, ogg: Buffer, threadId?: number | null): Promise<boolean> {
  const fd = new FormData()
  fd.append('chat_id', chatId)
  if (threadId != null) fd.append('message_thread_id', String(threadId))
  fd.append('voice', new Blob([new Uint8Array(ogg)], { type: 'audio/ogg' }), 'voice.ogg')
  const r = await fetch(`https://api.telegram.org/bot${token}/sendVoice`, { method: 'POST', body: fd })
  if (!r.ok) {
    console.error('sendVoice failed', r.status, (await r.text().catch(() => '')).slice(0, 200))
    return false
  }
  return true
}

#!/usr/bin/env python3
"""Распознавание речи (faster-whisper). Аргументы: <audio> [model]. Печатает JSON {"text": "..."}.
Авто-детект языка (без принудительного ru), иначе не-русская речь даёт пустой результат.
Первый проход — с VAD; если пусто, повтор без VAD и без ограничения языка."""
import json
import sys

from faster_whisper import WhisperModel

path = sys.argv[1]
model_name = sys.argv[2] if len(sys.argv) > 2 else "small"
model = WhisperModel(model_name, device="cpu", compute_type="int8")

def run(vad, language):
    segments, info = model.transcribe(path, beam_size=5, vad_filter=vad, language=language)
    text = " ".join(s.text.strip() for s in segments if s.text and s.text.strip())
    return text, info

text, info = run(True, None)
if not text.strip():
    text, info = run(False, None)
print(json.dumps({"text": text, "language": getattr(info, "language", None)}, ensure_ascii=False))

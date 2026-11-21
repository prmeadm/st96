#!/usr/bin/env python3
"""Распознавание речи (faster-whisper, русский). Аргументы: <audio> [model]. Печатает JSON {"text": "..."}."""
import json
import sys

from faster_whisper import WhisperModel

path = sys.argv[1]
model_name = sys.argv[2] if len(sys.argv) > 2 else "small"
model = WhisperModel(model_name, device="cpu", compute_type="int8")
segments, info = model.transcribe(path, beam_size=1, vad_filter=True, language="ru")
text = " ".join(s.text.strip() for s in segments if s.text and s.text.strip())
print(json.dumps({"text": text, "language": getattr(info, "language", None)}, ensure_ascii=False))

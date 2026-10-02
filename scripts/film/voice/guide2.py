"""Film 2 (posture) voice guide, draft for Sam's yes: the same voice and pace as film 1, lines laid end to end
with a breath between them. Usage: python3 guide2.py <out folder>"""
import json, sys, os
import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro
from kokoro_onnx.tokenizer import Tokenizer
OUT = sys.argv[1] if len(sys.argv) > 1 else "film2"; os.makedirs(OUT, exist_ok=True)
SR = 24000; VOICE = "am_michael"; SPEED = 0.86
LINES = [
    ["Trying to fix your posture?", "Here's what the science says."],
    ["One: there's no perfect posture.", "The straight line in textbooks comes from a nineteenth-century model of a body standing still without using its muscles."],
    ["Forty-one reviews of the evidence found no proof that posture causes back pain."],
    ["Two: your spine is built to move.", "People with back pain don't have a different curve.", "They move less."],
    ["Three: text neck.", "The famous sixty pounds on your neck came from a computer model."],
    ["When scientists measured more than seven hundred people, the angle of their neck didn't predict neck pain."],
    ["So change position often.", "Get up once an hour."],
    ["And train your neck and upper back.", "In trials, exercise moved the head back and eased neck pain."],
    ["Back pain with numbness or weakness in both legs, or changes in your bladder?", "Get help right away."],
    ["Back to factory settings."],
]
tok = Tokenizer(); k = Kokoro("kokoro-v1.0.onnx", "voices-v1.0.bin")
def say(t):
    a, sr = k.create(tok.phonemize(t, lang="en-us"), voice=VOICE, speed=SPEED, is_phonemes=True); a = a.astype(np.float32)
    idx = np.where(np.abs(a) > 0.006)[0]; n = int(0.03 * SR)
    return a[max(0, idx[0] - n): idx[-1] + n] if len(idx) else a
parts, report, t = [np.zeros(int(0.35 * SR), np.float32)], [], 0.35
for i, sents in enumerate(LINES):
    seg = []
    for j, s in enumerate(sents):
        seg.append(say(s))
        if j < len(sents) - 1: seg.append(np.zeros(int((0.45 if s.rstrip()[-1] in ".?" else 0.22) * SR), np.float32))
    a = np.concatenate(seg); d = len(a) / SR
    report.append({"line": i + 1, "start": round(t, 2), "end": round(t + d, 2), "text": " ".join(sents)})
    parts += [a, np.zeros(int(0.75 * SR), np.float32)]; t += d + 0.75
track = np.concatenate(parts); track = track / np.abs(track).max() * 0.89
sf.write(f"{OUT}/film2-voice-guide-{VOICE}.wav", track, SR); json.dump(report, open(f"{OUT}/report.json", "w"), indent=1)
words = sum(len(r["text"].split()) for r in report)
print("duration", round(len(track) / SR, 1), "s, words", words)
for r in report: print(r["line"], r["start"], r["end"], r["text"][:70])

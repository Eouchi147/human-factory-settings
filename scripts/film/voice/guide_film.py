"""Voice guide for any film: reads content/films/NN-slug.json, says each line with Kokoro (am_michael, the series' guide voice),
lays the lines end to end with a breath between them, and writes the guide wav plus a report of line timings.
Usage: python3 guide_film.py <film json> <out folder>"""
import json, sys, os
import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro
from kokoro_onnx.tokenizer import Tokenizer
SPEC = json.load(open(sys.argv[1])); OUT = sys.argv[2]; os.makedirs(OUT, exist_ok=True)
HERE = os.path.dirname(os.path.abspath(__file__))
SR = 24000; VOICE = SPEC.get("voice", "am_michael"); SPEED = SPEC.get("speed", 0.86)
tok = Tokenizer(); k = Kokoro(os.path.join(HERE, "kokoro-v1.0.onnx"), os.path.join(HERE, "voices-v1.0.bin"))
def say(t):
    a, sr = k.create(tok.phonemize(t, lang="en-us"), voice=VOICE, speed=SPEED, is_phonemes=True); a = a.astype(np.float32)
    idx = np.where(np.abs(a) > 0.006)[0]; n = int(0.03 * SR)
    return a[max(0, idx[0] - n): idx[-1] + n] if len(idx) else a
parts, report, t = [np.zeros(int(0.35 * SR), np.float32)], [], 0.35
for i, L in enumerate(SPEC["lines"]):
    sents = L["say"]; seg = []; st = []; tt = t
    for j, s in enumerate(sents):
        a1 = say(s); seg.append(a1); st.append([round(tt, 2), round(tt + len(a1) / SR, 2), s]); tt += len(a1) / SR
        if j < len(sents) - 1:
            pz = int((0.45 if s.rstrip()[-1] in ".?:" else 0.22) * SR); seg.append(np.zeros(pz, np.float32)); tt += pz / SR
    a = np.concatenate(seg); d = len(a) / SR
    report.append({"line": i + 1, "start": round(t, 2), "end": round(t + d, 2), "text": " ".join(sents), "words": len(" ".join(sents).split()), "sents": st})
    gap = L.get("gap", 0.75)
    parts += [a, np.zeros(int(gap * SR), np.float32)]; t += d + gap
track = np.concatenate(parts); track = track / np.abs(track).max() * 0.89
name = f"{SPEC['n']:02d}-{SPEC['slug']}"
sf.write(f"{OUT}/{name}-voice-guide.wav", track, SR); json.dump(report, open(f"{OUT}/{name}-report.json", "w"), indent=1)
print(name, "duration", round(len(track) / SR, 2), "s, words", sum(r["words"] for r in report))
for r in report: print(f"  {r['line']:2d} {r['start']:6.2f} {r['end']:6.2f}  {r['text'][:80]}")

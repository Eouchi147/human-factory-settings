"""Film 1 voice guide: an AI read of the script, timed to the shots, for Sam to follow with his own voice.
Kokoro-82M (Apache 2.0) through kokoro-onnx. Pronunciation is fixed by hand where the automatic phonemes are wrong
(adenosine), and every line is timed to its shot: calm pace, a 0.45 s pause at each full stop of the marked script.
Usage: python3 guide.py <voice> <out folder>"""
import json, sys, os
import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro
from kokoro_onnx.tokenizer import Tokenizer

VOICE = sys.argv[1] if len(sys.argv) > 1 else "am_michael"
OUT = sys.argv[2] if len(sys.argv) > 2 else "film1"
os.makedirs(OUT, exist_ok=True)
SR = 24000
SHOTS = [0, 4, 12, 18, 26, 33, 40, 44, 52, 59, 63]  # shot starts (s), from the Direction's shot table; film ends at 63 s
LINES = [
    ["Always tired?", "Check these three things first."],
    ["One: short sleep.", "All day, a chemical called adenosine builds up in your brain, and makes you sleepy."],
    ["Sleep clears it.", "Cut sleep short, and some is left when you wake."],
    ["Two: late coffee.", "Coffee doesn't clear that chemical.", "It hides it, and that cuts into your sleep."],
    ["A coffee at six p.m.?", "About half of it is still in you at eleven."],
    ["Three: late light.", "Bright light at night, even room light, tells your body clock it's still day,"],
    ["so your sleep signal comes later."],
    # read as a list, each setting on its own beat (the sheet's / marks), so the last word lands clearly
    ["For a seven a.m. alarm:", "in bed by eleven,", "last coffee by two,", "lights low from eight."],
    ["Still tired with enough sleep?", "See a doctor.", "Low iron, or your thyroid, can cause it."],
    ["Back to factory settings."],
]
# where the automatic phonemes are wrong, the right ones (US English): adenosine is uh-DEN-uh-seen
FIX = {"ˈædənˌɑːsaɪn": "ɐdˈɛnəsˌiːn", "pˈiː.ˈɛm.": "pˌiːˈɛm", "ˈeɪ.ˈɛm.": "ˌeɪˈɛm"}
GAP = 0.45  # between sentences of one line (the sheet's //)
LEAD = 0.35  # from the cut to the first word
TAIL = 0.2  # quiet before the next cut, at least

tok = Tokenizer()
k = Kokoro("kokoro-v1.0.onnx", "voices-v1.0.bin")


def phon(text):
    p = tok.phonemize(text, lang="en-us")
    for a, b in FIX.items():
        p = p.replace(a, b)
    return p


def trim(a, th=0.006, keep=0.03):
    idx = np.where(np.abs(a) > th)[0]
    if not len(idx):
        return a
    n = int(keep * SR)
    return a[max(0, idx[0] - n): idx[-1] + n]


def say(text, speed):
    a, sr = k.create(phon(text), voice=VOICE, speed=speed, is_phonemes=True)
    assert sr == SR
    return trim(a.astype(np.float32))


def line_audio(sents, speed):
    parts = []
    for i, s in enumerate(sents):
        parts.append(say(s, speed))
        if i < len(sents) - 1:
            # a full stop gets the sheet's long pause; a comma or colon inside a list, a short breath
            gap = GAP if s.rstrip()[-1] in ".?" else 0.22
            parts.append(np.zeros(int(gap * SR), np.float32))
    return np.concatenate(parts)


report = []
track = np.zeros(int(SHOTS[-1] * SR), np.float32)
for i, sents in enumerate(LINES):
    room = SHOTS[i + 1] - SHOTS[i] - LEAD - TAIL
    speed = 0.82  # calm and close: slower than the model's default (it reads at about 175 words a minute)
    a = line_audio(sents, speed)
    # too long for its shot: speed up a little, never past 1.05
    while len(a) / SR > room and speed < 1.05:
        speed = round(speed + 0.03, 2)
        a = line_audio(sents, speed)
    start = SHOTS[i] + LEAD
    s0 = int(start * SR)
    end = min(len(track), s0 + len(a))
    track[s0:end] += a[: end - s0]
    words = sum(len(s.replace(":", " ").split()) for s in sents)
    dur = len(a) / SR
    sf.write(f"{OUT}/line{i + 1:02d}.wav", a, SR)
    report.append({"line": i + 1, "start": round(start, 2), "end": round(start + dur, 2), "next_cut": SHOTS[i + 1], "speed": speed,
                   "seconds": round(dur, 2), "words": words, "wpm": round(words / dur * 60), "fits": start + dur <= SHOTS[i + 1] - 0.1,
                   "phonemes": " | ".join(phon(s) for s in sents)})
peak = float(np.abs(track).max())
track = track / max(peak, 1e-6) * 0.89
sf.write(f"{OUT}/voice-guide-{VOICE}.wav", track, SR)
json.dump(report, open(f"{OUT}/report-{VOICE}.json", "w"), indent=1, ensure_ascii=False)
for r in report:
    print(f"{r['line']:2d} {r['start']:6.2f}-{r['end']:6.2f} (cut {r['next_cut']:2d}) speed {r['speed']:.2f} {r['seconds']:5.2f}s {r['words']:2d}w {r['wpm']:3d}wpm {'ok' if r['fits'] else 'LONG'}")
total_words = sum(r["words"] for r in report)
speech = sum(r["seconds"] for r in report)
print("words", total_words, "speech s", round(speech, 1), "avg wpm incl. pauses", round(total_words / speech * 60))

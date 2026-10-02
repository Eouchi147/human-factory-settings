"""Word start times for a film's voice guide, so picture beats can land on words.
For each sentence, says every prefix with the same voice and speed and measures it (Kokoro gives no word timings;
a prefix keeps nearly the same rhythm, so its length is where the next word starts, within about 0.1 s).
Adds "words": [[start, word], ...] to each sentence of the report.
Usage: python3 word_times.py <film json> <report json>"""
import json, sys, os, re
import numpy as np
from kokoro_onnx import Kokoro
from kokoro_onnx.tokenizer import Tokenizer
SPEC = json.load(open(sys.argv[1])); REP = sys.argv[2]; report = json.load(open(REP))
HERE = os.path.dirname(os.path.abspath(__file__))
SR = 24000; VOICE = SPEC.get("voice", "am_michael"); SPEED = SPEC.get("speed", 0.86)
tok = Tokenizer(); k = Kokoro(os.path.join(HERE, "kokoro-v1.0.onnx"), os.path.join(HERE, "voices-v1.0.bin"))
def dur(t):
    a, sr = k.create(tok.phonemize(t, lang="en-us"), voice=VOICE, speed=SPEED, is_phonemes=True); a = a.astype(np.float32)
    idx = np.where(np.abs(a) > 0.006)[0]; n = int(0.03 * SR)
    return (min(len(a), idx[-1] + n) - max(0, idx[0] - n)) / SR if len(idx) else 0.0
for r in report:
    for s in r["sents"]:
        t0, t1, text = s[0], s[1], s[2]
        words = text.split(); out = [[t0, words[0]]]
        for i in range(1, len(words)):
            pre = " ".join(words[:i]).rstrip(",;:")
            d = dur(pre) - 0.03          # the prefix ends where the next word begins (less the trim margin)
            out.append([round(min(t1 - 0.05, t0 + d), 2), words[i]])
        # keep the order even where a prefix ran long
        for i in range(1, len(out)): out[i][0] = max(out[i][0], out[i - 1][0] + 0.05)
        if len(s) > 3: s[3] = out
        else: s.append(out)
json.dump(report, open(REP, "w"), indent=1)
for r in report:
    for s in r["sents"]:
        print(" ".join(f"{w[0]:.2f}:{w[1]}" for w in s[3]))

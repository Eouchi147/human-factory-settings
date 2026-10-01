"""Kokoro-82M (Apache-2.0). Renders every line per voice, keeps the phonemes it used."""
import argparse, json, os, sys, time
import numpy as np
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from common import load_texts, write_set
from kokoro import KPipeline

ap = argparse.ArgumentParser()
ap.add_argument("--voices", required=True)
ap.add_argument("--texts", default="film1,hard")
ap.add_argument("--speed", type=float, default=1.0)
ap.add_argument("--out", required=True)
a = ap.parse_args()

pipes = {}
for voice in a.voices.split(","):
    lang = voice[0]
    if lang not in pipes:
        pipes[lang] = KPipeline(lang_code=lang, repo_id="hexgrad/Kokoro-82M")
    pipe = pipes[lang]
    for text in load_texts(a.texts.split(",")):
        clips, phon = [], []
        t0 = time.time()
        for line in text["lines"]:
            parts, ps_all = [], []
            for r in pipe(line["tts"], voice=voice, speed=a.speed, split_pattern=r"\n+"):
                audio = r.audio if hasattr(r, "audio") else r[2]
                ps = r.phonemes if hasattr(r, "phonemes") else r[1]
                parts.append(np.asarray(audio, dtype=np.float32))
                ps_all.append(ps)
            clips.append(np.concatenate(parts))
            phon.append({"id": line["id"], "phonemes": " ".join(ps_all)})
        meta = {"engine": "kokoro-82m", "voice": voice, "speed": a.speed, "seconds_to_render": round(time.time() - t0, 1), "phonemes": phon}
        write_set(os.path.join(a.out, f"kokoro-{voice}"), text, clips, 24000, meta)
        print(voice, text["id"], meta["seconds_to_render"], "s", flush=True)

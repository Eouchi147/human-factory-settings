"""Chatterbox (Resemble AI, MIT). Built-in voice or a reference clip; outputs carry Resemble's inaudible watermark."""
import argparse, json, os, sys, time
import numpy as np
import torch
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from common import load_texts, write_set

ap = argparse.ArgumentParser()
ap.add_argument("--voices", required=True, help="comma list of name=path|default")
ap.add_argument("--texts", default="film1,hard")
ap.add_argument("--settings", default="0.5:0.5", help="comma list of exaggeration:cfg")
ap.add_argument("--seed", type=int, default=7)
ap.add_argument("--out", required=True)
a = ap.parse_args()

torch.set_num_threads(os.cpu_count() or 2)
from chatterbox.tts import ChatterboxTTS
model = ChatterboxTTS.from_pretrained(device="cpu")

for spec in a.voices.split(","):
    name, _, path = spec.partition("=")
    prompt = None if path in ("", "default") else path
    for setting in a.settings.split(","):
        ex, cfg = (float(x) for x in setting.split(":"))
        for text in load_texts(a.texts.split(",")):
            clips = []
            t0 = time.time()
            for line in text["lines"]:
                torch.manual_seed(a.seed)
                wav = model.generate(line["tts"], audio_prompt_path=prompt, exaggeration=ex, cfg_weight=cfg)
                clips.append(wav.squeeze(0).cpu().numpy().astype(np.float32))
            meta = {"engine": "chatterbox", "voice": name, "exaggeration": ex, "cfg_weight": cfg, "seed": a.seed, "seconds_to_render": round(time.time() - t0, 1)}
            write_set(os.path.join(a.out, f"chatterbox-{name}-e{ex}-c{cfg}"), text, clips, model.sr, meta)
            print(name, setting, text["id"], meta["seconds_to_render"], "s", flush=True)

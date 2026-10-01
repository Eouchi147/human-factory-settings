"""Shared helpers: load texts, write clips, build the full read with designed pauses."""
import json, os
import numpy as np
import soundfile as sf

ROOT = os.path.dirname(os.path.abspath(__file__))


def load_texts(ids):
    out = []
    for t in ids:
        with open(os.path.join(ROOT, "texts", f"{t}.json")) as f:
            out.append(json.load(f))
    return out


def trim(audio, sr, thresh=0.004, keep=0.04):
    """Cut leading and trailing silence, keeping a short natural margin."""
    a = np.abs(audio)
    idx = np.where(a > thresh)[0]
    if len(idx) == 0:
        return audio
    k = int(keep * sr)
    return audio[max(0, idx[0] - k): min(len(audio), idx[-1] + k)]


def write_set(outdir, text, clips, sr, meta):
    """clips: list of float32 arrays, one per line. Writes each line and the full read."""
    os.makedirs(outdir, exist_ok=True)
    full = []
    for i, (line, audio) in enumerate(zip(text["lines"], clips)):
        audio = trim(np.asarray(audio, dtype=np.float32), sr)
        sf.write(os.path.join(outdir, f"{text['id']}-{line['id']}.wav"), audio, sr)
        full.append(audio)
        gap = text.get("gap_after", [0.6] * len(clips))[i]
        if gap:
            full.append(np.zeros(int(gap * sr), dtype=np.float32))
    lead = np.zeros(int(0.3 * sr), dtype=np.float32)
    sf.write(os.path.join(outdir, f"{text['id']}-full.wav"), np.concatenate([lead] + full + [lead]), sr)
    with open(os.path.join(outdir, f"{text['id']}-meta.json"), "w") as f:
        json.dump(meta, f, indent=1)

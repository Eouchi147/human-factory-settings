"""Check every rendered set: does a speech recogniser hear back every word, how natural does it
score (UTMOS), how fast is it, how much does the pitch move, where are the pauses.
Usage: python qa.py <dir with one sub-folder per voice set>"""
import glob, json, os, re, sys
import numpy as np
import soundfile as sf

ROOT = os.path.dirname(os.path.abspath(__file__))
NUM = {"0": "zero", "1": "one", "2": "two", "3": "three", "4": "four", "5": "five", "6": "six", "7": "seven",
       "8": "eight", "9": "nine", "10": "ten", "11": "eleven", "12": "twelve"}


def norm(s):
    s = s.lower().replace("’", "'")
    s = re.sub(r"\b(a|p)\.\s?m\.?", r"\1m", s)
    s = re.sub(r"(\d+)\s?(am|pm)\b", r"\1 \2", s)
    s = re.sub(r"(\d+):00", r"\1", s)
    s = re.sub(r"\b\d+\b", lambda m: NUM.get(m.group(0), m.group(0)), s)
    s = s.replace("'", "")
    s = re.sub(r"[^a-z ]+", " ", s)
    return " ".join(s.split())


def load_whisper():
    from faster_whisper import WhisperModel
    for name in ("large-v3-turbo", "deepdml/faster-whisper-large-v3-turbo-ct2", "large-v3"):
        try:
            return name, WhisperModel(name, device="cpu", compute_type="int8")
        except Exception as e:  # noqa: BLE001
            print("whisper load failed", name, e, flush=True)
    raise SystemExit("no whisper model")


def load_utmos():
    import torch
    try:
        return torch.hub.load("tarepan/SpeechMOS:v1.2.0", "utmos22_strong", trust_repo=True)
    except Exception as e:  # noqa: BLE001
        print("utmos load failed", e, flush=True)
        return None


def mos(pred, path):
    if pred is None:
        return None
    import torch, librosa
    y, sr = librosa.load(path, sr=16000, mono=True)
    with torch.no_grad():
        return round(float(pred(torch.from_numpy(y).unsqueeze(0), 16000).item()), 3)


def pitch(path):
    import librosa
    y, sr = librosa.load(path, sr=22050, mono=True)
    f0, vflag, _ = librosa.pyin(y, fmin=60, fmax=400, sr=sr, frame_length=1024)
    f0 = f0[~np.isnan(f0)]
    if len(f0) < 10:
        return {}
    st = 12 * np.log2(f0 / np.median(f0))
    return {"f0_median_hz": round(float(np.median(f0)), 1), "f0_sd_semitones": round(float(np.std(st)), 2),
            "f0_range_semitones_p5_p95": round(float(np.percentile(st, 95) - np.percentile(st, 5)), 2)}


def main(base):
    import jiwer
    wname, wm = load_whisper()
    pred = load_utmos()
    for d in sorted(glob.glob(os.path.join(base, "*/"))):
        report = {"dir": os.path.basename(d.rstrip("/")), "whisper": wname, "texts": {}}
        for meta_path in sorted(glob.glob(os.path.join(d, "*-meta.json"))):
            tid = os.path.basename(meta_path).replace("-meta.json", "")
            with open(os.path.join(ROOT, "texts", f"{tid}.json")) as f:
                text = json.load(f)
            lines, errors, words, speech_s = [], 0, 0, 0.0
            for line in text["lines"]:
                p = os.path.join(d, f"{tid}-{line['id']}.wav")
                info = sf.info(p)
                segs, _ = wm.transcribe(p, language="en", beam_size=5, word_timestamps=True, vad_filter=False,
                                        condition_on_previous_text=False)
                segs = list(segs)
                hyp = " ".join(s.text.strip() for s in segs)
                ws = [w for s in segs for w in (s.words or [])]
                gaps = [round(ws[i + 1].start - ws[i].end, 2) for i in range(len(ws) - 1)]
                ref_n, hyp_n = norm(line["text"]), norm(hyp)
                out = jiwer.process_words(ref_n, hyp_n)
                err = out.substitutions + out.deletions + out.insertions
                errors += err
                words += len(ref_n.split())
                speech_s += info.duration
                lines.append({"id": line["id"], "seconds": round(info.duration, 2), "slot": line.get("slot"),
                              "heard": hyp, "word_errors": err,
                              "diff": None if err == 0 else jiwer.visualize_alignment(out).split("\n")[1:4],
                              "pauses_over_0_25s": [g for g in gaps if g >= 0.25],
                              "low_confidence_words": [(w.word.strip(), round(w.probability, 2)) for w in ws if w.probability < 0.6],
                              "mos": mos(pred, p)})
            full = os.path.join(d, f"{tid}-full.wav")
            report["texts"][tid] = {"word_errors": errors, "words": words,
                                    "words_per_minute": round(words / speech_s * 60, 1) if speech_s else None,
                                    "mos_full": mos(pred, full), **pitch(full), "lines": lines}
            print(report["dir"], tid, "errors", errors, "mos", report["texts"][tid]["mos_full"], flush=True)
        with open(os.path.join(d, "qa.json"), "w") as f:
            json.dump(report, f, indent=1)


if __name__ == "__main__":
    main(sys.argv[1])

"""Merge every job's results into voice/out/<run>/: mp3 clips, qa.json per set, one summary table."""
import glob, json, os, shutil, subprocess, sys
src, run = sys.argv[1], sys.argv[2]
dst = os.path.join("voice", "out", run)
os.makedirs(dst, exist_ok=True)
rows = []
for d in sorted(glob.glob(os.path.join(src, "*", "*/"))):
    name = os.path.basename(d.rstrip("/"))
    out = os.path.join(dst, name)
    os.makedirs(out, exist_ok=True)
    for w in glob.glob(os.path.join(d, "*.wav")):
        mp3 = os.path.join(out, os.path.basename(w)[:-4] + ".mp3")
        subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", w, "-codec:a", "libmp3lame", "-b:a", "160k", mp3], check=True)
    for j in glob.glob(os.path.join(d, "*.json")):
        shutil.copy(j, out)
    q = os.path.join(d, "qa.json")
    if os.path.exists(q):
        rep = json.load(open(q))
        for tid, t in rep["texts"].items():
            rows.append((name, tid, t["word_errors"], t["words"], t.get("words_per_minute"), t.get("mos_full"),
                         t.get("f0_sd_semitones"), t.get("f0_range_semitones_p5_p95")))
rows.sort(key=lambda r: (r[1], r[2], -(r[5] or 0)))
with open(os.path.join(dst, "summary.md"), "w") as f:
    f.write("| set | text | word errors | words | wpm | UTMOS | pitch sd (st) | pitch range (st) |\n|---|---|---|---|---|---|---|---|\n")
    for r in rows:
        f.write("| " + " | ".join("" if x is None else str(x) for x in r) + " |\n")
print(open(os.path.join(dst, "summary.md")).read())

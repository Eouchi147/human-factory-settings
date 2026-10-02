"""Film 1 final: two cuts from the same frames.
1. "Film 1, music and effects (for your voice)": the clean picture with the score and effects only.
2. "Film 1 voice guide (AI voice, not for posting)": same picture, a corner label, subtitles, the AI guide voice mixed in."""
import json, subprocess, os
HERE = os.path.dirname(os.path.abspath(__file__)); os.chdir(HERE)
F = 'final1'; OUT = '../out'; R = '../voice/render'
rep = json.load(open('../voice/film1/report-am_michael.json'))
os.makedirs(OUT, exist_ok=True)
base = ['ffmpeg', '-y', '-loglevel', 'error', '-framerate', '24', '-i', f'{F}/f%05d.jpg']
enc = ['-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-pix_fmt', 'yuv420p', '-r', '24', '-c:a', 'aac', '-b:a', '256k', '-movflags', '+faststart', '-shortest']
loud = 'loudnorm=I=-14:TP=-1.0:LRA=11'
# 1. clean
subprocess.run(base + ['-i', 'snd/film1_fx.wav', '-map', '0:v', '-map', '1:a', '-af', loud] + enc + [f'{OUT}/Film 1, music and effects (for your voice).mp4'], check=True)
# 2. guide
ins = ['-i', f'{R}/label.png'] + sum([['-i', f"{R}/sub{r['line']:02d}.png"] for r in rep], []) + ['-i', 'snd/film1_guide_mix.wav']
fc = ['[0][1]overlay=0:0[v0]']
for k, r in enumerate(rep):
    fc.append(f"[v{k}][{k + 2}]overlay=0:0:enable='between(t,{r['start'] - 0.05:.2f},{r['end'] + 0.35:.2f})'[v{k + 1}]")
fc.append(f"[{len(rep) + 2}:a]{loud}[a]")
subprocess.run(base + ins + ['-filter_complex', ';'.join(fc), '-map', f'[v{len(rep)}]', '-map', '[a]'] + enc + [f'{OUT}/Film 1 voice guide (AI voice, not for posting).mp4'], check=True)
for f in os.listdir(OUT):
    if f.startswith('Film 1') and f.endswith('.mp4'):
        d = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', os.path.join(OUT, f)], capture_output=True, text=True).stdout.strip()
        print(f, d)

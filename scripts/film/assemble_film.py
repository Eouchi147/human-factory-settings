"""Any film, final: two cuts from the same frames, plus a high-quality master kept here for the voice mix later.
1. "Film N, music and effects (for your voice).mp4": the clean picture with the score and effects only (HEVC, sized to send in chat).
2. "Film N voice guide (AI voice, not for posting).mp4": the same picture, a corner label, subtitles, the AI guide voice mixed in.
Usage: python3 assemble_film.py <n> <frames dir> <sound dir> [--mb 27]"""
import json, subprocess, os, sys, asyncio, argparse, base64
HERE = os.path.dirname(os.path.abspath(__file__)); os.chdir(HERE)
ap = argparse.ArgumentParser(); ap.add_argument('n', type=int); ap.add_argument('frames'); ap.add_argument('snd'); ap.add_argument('--mb', type=float, default=27.0)
a = ap.parse_args()
REPO = '/home/claude/human-factory-settings'
spec = next(json.load(open(os.path.join(REPO, 'content/films', f))) for f in sorted(os.listdir(os.path.join(REPO, 'content/films'))) if f.startswith(f'{a.n:02d}-'))
name = f"{spec['n']:02d}-{spec['slug']}"
rep = json.load(open(f'../voice/guides/{name}-report.json'))
OUT = '../out'; OV = f'ovl_{a.n:02d}'; os.makedirs(OUT, exist_ok=True); os.makedirs(OV, exist_ok=True); os.makedirs(f'{OUT}/hq', exist_ok=True)
FONTS = f'{REPO}/app/fonts'
b64 = lambda f: base64.b64encode(open(f'{FONTS}/{f}', 'rb').read()).decode()
HEAD = f"""<style>
@font-face {{ font-family: Archivo; src: url(data:font/woff2;base64,{b64('archivo-latin.woff2')}) format('woff2'); font-weight: 100 900; font-stretch: 62% 125%; }}
@font-face {{ font-family: 'Geist Mono'; src: url(data:font/woff2;base64,{b64('geist-mono-500.woff2')}) format('woff2'); font-weight: 500; }}
html, body {{ margin: 0; width: 1080px; height: 1920px; background: transparent; -webkit-font-smoothing: antialiased; }}
.label {{ position: absolute; top: 64px; left: 0; right: 0; text-align: center; font: 500 22px/1 'Geist Mono'; letter-spacing: .18em; color: rgba(236,238,241,.78); }}
.label span {{ display: inline-block; padding: 12px 20px; border-radius: 99px; background: rgba(8,9,11,.62); border: 1px solid rgba(236,238,241,.22); }}
.sub {{ position: absolute; left: 48px; right: 48px; bottom: 54px; display: flex; justify-content: center; }}
.sub p {{ margin: 0; padding: 18px 26px; border-radius: 20px; background: rgba(8,9,11,.72); font: 600 36px/1.3 Archivo; font-stretch: 104%; letter-spacing: -.01em; color: #ECEEF1; text-align: center; text-wrap: balance; }}
</style>"""

async def overlays():
    from playwright.async_api import async_playwright
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--disable-lcd-text']); pg = await b.new_page(viewport={'width': 1080, 'height': 1920})
        async def shot(html, f):
            await pg.set_content(f'<!doctype html><html><head>{HEAD}</head><body>{html}</body></html>')
            await pg.evaluate('() => document.fonts.ready'); await pg.wait_for_timeout(120)
            await pg.screenshot(path=f, omit_background=True)
        await shot('<div class="label"><span>VOICE GUIDE · AI VOICE · NOT FOR POSTING</span></div>', f'{OV}/label.png')
        for r in rep:
            txt = r['text'].replace('&', '&amp;').replace('<', '&lt;')
            await shot(f'<div class="sub"><p>{txt}</p></div>', f"{OV}/sub{r['line']:02d}.png")
        await b.close()
asyncio.run(overlays())

frames = sorted(f for f in os.listdir(a.frames) if f.endswith('.jpg'))
dur = len(frames) / 24
fx, gm = f'{a.snd}/film{a.n:02d}_fx.wav', f'{a.snd}/film{a.n:02d}_guide_mix.wav'
base = ['ffmpeg', '-y', '-loglevel', 'error', '-framerate', '24', '-i', f'{a.frames}/f%05d.jpg']
loud = 'loudnorm=I=-14:TP=-1.0:LRA=11,aresample=48000'
aud = ['-c:a', 'aac', '-b:a', '192k', '-ar', '48000']
N = spec['n']
# the high-quality master, kept here (for the final mix with Sam's voice)
hq = f'{OUT}/hq/Film {N}, music and effects, master.mp4'
subprocess.run(base + ['-i', fx, '-map', '0:v', '-map', '1:a', '-af', loud, '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-pix_fmt', 'yuv420p', '-r', '24'] + aud + ['-movflags', '+faststart', '-shortest', hq], check=True)
# 1. the clean cut, HEVC two-pass, sized to send
kbps = int(a.mb * 8e6 / dur / 1000) - 200
P = ['-c:v', 'libx265', '-preset', 'medium', '-b:v', f'{kbps}k', '-pix_fmt', 'yuv420p', '-tag:v', 'hvc1']
os.makedirs(f'{OUT}/tmp', exist_ok=True); stats = f'{OUT}/tmp/x265_{N}.log'
subprocess.run(base + P + ['-x265-params', f'pass=1:stats={stats}:log-level=error', '-an', '-f', 'mp4', '/dev/null'], check=True)
clean = f'{OUT}/Film {N}, music and effects (for your voice).mp4'
subprocess.run(base + ['-i', fx, '-map', '0:v', '-map', '1:a'] + P + ['-x265-params', f'pass=2:stats={stats}:log-level=error', '-r', '24', '-af', loud] + aud + ['-movflags', '+faststart', '-shortest', clean], check=True)
# 2. the guide cut: label, subtitles, the AI voice
ins = ['-i', f'{OV}/label.png'] + sum([['-i', f"{OV}/sub{r['line']:02d}.png"] for r in rep], []) + ['-i', gm]
fc = ['[0][1]overlay=0:0[v0]']
for k, r in enumerate(rep): fc.append(f"[v{k}][{k + 2}]overlay=0:0:enable='between(t,{r['start'] - 0.05:.2f},{r['end'] + 0.35:.2f})'[v{k + 1}]")
fc.append(f"[{len(rep) + 2}:a]{loud}[a]")
guide = f'{OUT}/Film {N} voice guide (AI voice, not for posting).mp4'
subprocess.run(base + ins + ['-filter_complex', ';'.join(fc), '-map', f'[v{len(rep)}]', '-map', '[a]', '-c:v', 'libx264', '-preset', 'medium', '-crf', '25', '-pix_fmt', 'yuv420p', '-r', '24'] + aud + ['-movflags', '+faststart', '-shortest', guide], check=True)
for f in (hq, clean, guide):
    d = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f], capture_output=True, text=True).stdout.strip()
    print(os.path.basename(f), d, 's', round(os.path.getsize(f) / 1e6, 1), 'MB')

"""tl4.py FILM OUT 't1,t2,...' [cols w h port]: a timeline contact sheet along the film's own camera"""
import sys, os, subprocess, json, glob
from PIL import Image, ImageDraw
film, out, times = sys.argv[1], sys.argv[2], sys.argv[3]
cols = int(sys.argv[4]) if len(sys.argv) > 4 else 6; w = int(sys.argv[5]) if len(sys.argv) > 5 else 270; h = int(sys.argv[6]) if len(sys.argv) > 6 else 480; port = int(sys.argv[7]) if len(sys.argv) > 7 else 8881
os.makedirs(out, exist_ok=True)
for f in glob.glob(out + '/t*.jpg'): os.remove(f)
r = subprocess.run([sys.executable, 'film_render.py', out, '--film', film, '--w', str(w), '--h', str(h), '--times', times, '--port', str(port), '--shadow', '1024'], capture_output=True, text=True, timeout=1800)
errs = [l for l in (r.stdout + r.stderr).splitlines() if 'ERR' in l or 'rror' in l]
if errs: print('ERRORS:', errs[:6])
fs = sorted(glob.glob(out + '/t*.jpg')); n = len(fs); rows = (n + cols - 1) // cols
S = Image.new('RGB', (w * cols, h * rows), (20, 20, 20))
for i, f in enumerate(fs):
    im = Image.open(f); S.paste(im, ((i % cols) * w, (i // cols) * h)); ImageDraw.Draw(S).text(((i % cols) * w + 6, (i // cols) * h + 6), os.path.basename(f)[1:-4], fill=(255, 200, 80))
S.save(os.path.join(out, 'sheet.jpg'), quality=86); print('sheet', S.size, n)

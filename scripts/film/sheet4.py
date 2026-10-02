"""sheet4.py FILM OUT 'view1,view2' 't1,t2,...' [w h port]: render test stills for each view and tile them (rows = views, cols = times)"""
import sys, os, subprocess, json, glob
from PIL import Image, ImageDraw
film, out, views, times = sys.argv[1], sys.argv[2], sys.argv[3].split(','), sys.argv[4]
w = int(sys.argv[5]) if len(sys.argv) > 5 else 360; h = int(sys.argv[6]) if len(sys.argv) > 6 else 640; port = int(sys.argv[7]) if len(sys.argv) > 7 else 8861
os.makedirs(out, exist_ok=True)
rows = []
for v in views:
    d = os.path.join(out, v); os.makedirs(d, exist_ok=True)
    for f in glob.glob(d + '/*'): os.remove(f)
    r = subprocess.run([sys.executable, 'film_render.py', d, '--film', film, '--w', str(w), '--h', str(h), '--times', times, '--port', str(port), '--shadow', '1024', '--extra', json.dumps({'view': v})], capture_output=True, text=True, timeout=900)
    errs = [l for l in (r.stdout + r.stderr).splitlines() if 'ERR' in l or 'Error' in l or 'error' in l]
    if errs: print(v, 'ERRORS:', errs[:4])
    rows.append(sorted(glob.glob(d + '/t*.jpg')))
ts = times.split(',')
W = Image.new('RGB', (w * len(ts), h * len(rows)), (20, 20, 20))
for i, row in enumerate(rows):
    for j, f in enumerate(row):
        im = Image.open(f); W.paste(im, (j * w, i * h)); ImageDraw.Draw(W).text((j * w + 6, i * h + 6), f'{views[i]} {ts[j]}', fill=(255, 200, 80))
W.save(os.path.join(out, 'sheet.jpg'), quality=88); print('sheet', W.size)

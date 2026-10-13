"""contact_sheet.py: one image of 24 moments of a film, labelled with their time, to look at before and after rendering.
  python3 contact_sheet.py film FILM T1 OUT.png [--port P] [--times 1.2,3.4,...]   renders the stills from the film's page
  python3 contact_sheet.py video FILE.mp4 OUT.png                                     takes them from a finished cut (ffmpeg)
Run from scripts/film (the film mode needs the render kit set up, as render/setup.sh does)."""
import sys, os, subprocess, tempfile, glob
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))   # scripts/film
W, H, N, COLS = 360, 640, 24, 8

def compose(items, out):
    rows = (len(items) + COLS - 1) // COLS; s = Image.new('RGB', (W * COLS // 2, H * rows // 2), (0, 0, 0))
    for k, (t, f) in enumerate(items):
        im = Image.open(f).convert('RGB').resize((W // 2, H // 2)); d = ImageDraw.Draw(im)
        d.rectangle([0, 0, 52, 14], fill=(0, 0, 0)); d.text((3, 2), f'{t:6.2f}s', fill=(255, 106, 43))
        s.paste(im, ((k % COLS) * W // 2, (k // COLS) * H // 2))
    s.save(out); print('sheet', out, len(items), 'stills')

mode = sys.argv[1]
if mode == 'film':
    film, t1, out = sys.argv[2], float(sys.argv[3]), os.path.abspath(sys.argv[4])
    port = sys.argv[sys.argv.index('--port') + 1] if '--port' in sys.argv else '8995'
    times = [float(x) for x in sys.argv[sys.argv.index('--times') + 1].split(',')] if '--times' in sys.argv else [round(0.4 + (t1 - 0.8) * i / (N - 1), 2) for i in range(N)]
    d = tempfile.mkdtemp()
    r = subprocess.run([sys.executable, 'film_render.py', d, '--film', film, '--w', str(W), '--h', str(H), '--times', ','.join(f'{t:.2f}' for t in times), '--port', port],
                       cwd=HERE, capture_output=True, text=True)
    fs = sorted(glob.glob(os.path.join(d, 't*.jpg')))
    if not fs: print(r.stdout[-2000:], r.stderr[-2000:]); sys.exit(1)
    compose([(float(os.path.basename(f)[1:-4]), f) for f in fs], out)
elif mode == 'video':
    mp4, out = sys.argv[2], os.path.abspath(sys.argv[3])
    dur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', mp4], capture_output=True, text=True).stdout.strip())
    d = tempfile.mkdtemp(); items = []
    for i in range(N):
        t = 0.4 + (dur - 0.8) * i / (N - 1); f = os.path.join(d, f'{i:02d}.jpg')
        subprocess.run(['ffmpeg', '-v', 'error', '-ss', f'{t:.2f}', '-i', mp4, '-frames:v', '1', '-vf', f'scale={W}:{H}', '-y', f], check=True)
        items.append((t, f))
    compose(items, out)
else:
    sys.exit(__doc__)

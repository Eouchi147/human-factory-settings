import sys, glob, os
from PIL import Image, ImageDraw
src, out, cols = sys.argv[1], sys.argv[2], int(sys.argv[3]); w = int(sys.argv[4]) if len(sys.argv) > 4 else 270
sel = sys.argv[5].split(',') if len(sys.argv) > 5 else None
fs = sorted(glob.glob(os.path.join(src, 't*.jpg')) + glob.glob(os.path.join(src, 't*.png')))
if sel: fs = [f for f in fs if any(os.path.basename(f).startswith('t%06.2f' % float(x)) for x in sel)]
h = int(w * 16 / 9); rows = (len(fs) + cols - 1) // cols
sheet = Image.new('RGB', (cols * w, rows * (h + 18)), (30, 30, 30)); d = ImageDraw.Draw(sheet)
for i, f in enumerate(fs):
    im = Image.open(f).convert('RGB').resize((w, h)); x, y = (i % cols) * w, (i // cols) * (h + 18)
    sheet.paste(im, (x, y + 18)); d.text((x + 6, y + 3), os.path.basename(f), fill=(220, 220, 220))
sheet.save(out, quality=88); print(sheet.size)

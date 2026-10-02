import sys, glob, os
from PIL import Image, ImageDraw
src = sys.argv[1]; out = sys.argv[2]; cols = int(sys.argv[3]) if len(sys.argv) > 3 else 5
fs = sorted(glob.glob(os.path.join(src, 't*.png')) + glob.glob(os.path.join(src, 't*.jpg')))
w, h = 216, 384
rows = (len(fs) + cols - 1) // cols
sheet = Image.new('RGB', (cols * w, rows * (h + 20)), (30, 30, 30)); d = ImageDraw.Draw(sheet)
for i, f in enumerate(fs):
    im = Image.open(f).convert('RGB').resize((w, h)); x, y = (i % cols) * w, (i // cols) * (h + 20)
    sheet.paste(im, (x, y + 20)); d.text((x + 6, y + 4), os.path.basename(f), fill=(220, 220, 220))
sheet.save(out); print(sheet.size)

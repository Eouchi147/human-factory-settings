"""page_images.py SRC:NAME[:X,Y,SIZE] ...: put a film still on the site as public/img/NAME.jpg (900 x 900) and add its tiny
blurred preview to lib/blur.ts. Without X,Y,SIZE the middle square of SRC is used; with them, the square SIZE pixels wide whose
top left corner is at X,Y. Run again with the same NAME to replace an image."""
import base64, io, os, re, sys
from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
BLUR = os.path.join(ROOT, "lib", "blur.ts")


def square(im, box):
    w, h = im.size
    if box:
        x, y, k = box
    else:
        k = min(w, h); x, y = (w - k) // 2, (h - k) // 2
    return im.crop((x, y, x + k, y + k)).resize((900, 900), Image.LANCZOS)


def main(args):
    s = open(BLUR).read()
    for arg in args:
        parts = arg.split(":")
        src, name = parts[0], parts[1]
        box = tuple(int(v) for v in parts[2].split(",")) if len(parts) > 2 else None
        im = square(Image.open(src).convert("RGB"), box)
        im.save(os.path.join(ROOT, "public", "img", name + ".jpg"), quality=84, optimize=True, progressive=True)
        b = io.BytesIO(); im.resize((20, 20), Image.LANCZOS).save(b, "JPEG", quality=70)
        line = f' "/img/{name}.jpg": "data:image/jpeg;base64,{base64.b64encode(b.getvalue()).decode()}",'
        pat = re.compile(r'^ "/img/' + re.escape(name) + r'\.jpg": "[^"]*",$', re.M)
        if pat.search(s):
            s = pat.sub(line, s)
        else:
            i = s.rstrip().rfind("};")
            s = s[:i] + line + "\n" + s[i:]
        print("ok", name, im.size)
    open(BLUR, "w").write(s)


if __name__ == "__main__":
    main(sys.argv[1:])

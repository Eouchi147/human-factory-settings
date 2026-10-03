"""stills_clean.py FILM 't1,t2,...' OUTDIR [port]: full-size frames of a film with no words on screen (captions, tags and
the logo hidden), for the site's pages. Each still is also cropped to a 900 x 900 square around the frame's middle."""
import asyncio, subprocess, sys, os, time
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__))
film, times, out = sys.argv[1], [float(x) for x in sys.argv[2].split(',')], sys.argv[3]
port = int(sys.argv[4]) if len(sys.argv) > 4 else 8911
os.makedirs(out, exist_ok=True)
async def main():
    from playwright.async_api import async_playwright
    srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(port), '--bind', '127.0.0.1'], cwd=HERE, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(0.8)
    try:
        async with async_playwright() as p:
            b = await p.chromium.launch(args=['--use-gl=angle', '--use-angle=gl-egl', '--ignore-gpu-blocklist', '--disable-lcd-text'], env={**os.environ, 'LIBGL_ALWAYS_SOFTWARE': '1', 'EGL_PLATFORM': 'surfaceless'})
            pg = await b.new_page(viewport={'width': 1080, 'height': 1920})
            await pg.goto(f'http://127.0.0.1:{port}/film.html?f={film}'); await pg.wait_for_function('!!(window.HFS && window.HFS.filmReady)', timeout=120000)
            await pg.evaluate('c => window.HFS.film.init(c)', {'width': 1080, 'height': 1920, 'shadow': 2048})
            await pg.evaluate('() => document.fonts.ready')
            for t in times:
                await pg.evaluate('t => window.HFS.film.render(t, { sub: 1 })', t)
                await pg.evaluate("() => { document.getElementById('ov').style.display = 'none'; }")
                f = os.path.join(out, f'{film}_{t:06.2f}.png'); await pg.screenshot(path=f, timeout=600000)
                im = Image.open(f).convert('RGB'); W, H = im.size; y0 = (H - W) // 2
                im.crop((0, y0, W, y0 + W)).resize((900, 900), Image.LANCZOS).save(f.replace('.png', '_sq.jpg'), quality=88)
                print('ok', f, flush=True)
            await b.close()
    finally:
        srv.terminate()
asyncio.run(main())

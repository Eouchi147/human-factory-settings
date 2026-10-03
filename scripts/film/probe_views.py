"""probe_views.py FILM OUT JSON: JSON = [[t, view or null], ...]; renders each at 360x640 after one init; writes vNN.jpg and a sheet."""
import asyncio, subprocess, sys, time, os, json
from PIL import Image, ImageDraw
HERE = os.path.dirname(os.path.abspath(__file__))
film, out, jobs = sys.argv[1], sys.argv[2], json.loads(sys.argv[3])
W, Hh, port = 360, 640, int(os.environ.get('PORT', 8931))
os.makedirs(out, exist_ok=True)
async def main():
    from playwright.async_api import async_playwright
    srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(port), '--bind', '127.0.0.1'], cwd=HERE, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(0.8)
    try:
        async with async_playwright() as p:
            b = await p.chromium.launch(args=['--use-gl=angle', '--use-angle=gl-egl', '--ignore-gpu-blocklist'], env={**os.environ, 'LIBGL_ALWAYS_SOFTWARE': '1', 'EGL_PLATFORM': 'surfaceless'})
            pg = await b.new_page(viewport={'width': W, 'height': Hh}); logs = []
            pg.on('pageerror', lambda e: logs.append('ERR ' + str(e))); pg.on('console', lambda m: logs.append(m.text[:300]) if m.type in ('error',) else None)
            await pg.goto(f'http://127.0.0.1:{port}/film.html?f={film}'); await pg.wait_for_function('!!(window.HFS && window.HFS.filmReady)', timeout=180000)
            info = await pg.evaluate('c => window.HFS.film.init(c)', {'width': W, 'height': Hh, 'shadow': 1024})
            print('INFO', json.dumps({k: v for k, v in info.items() if k not in ('T', 'fast')}), logs[:4], flush=True)
            fs = []
            for i, (t, view) in enumerate(jobs):
                await pg.evaluate('v => { window.HFS.film.debug().cfg.view = v; }', view)
                await pg.evaluate('([t]) => window.HFS.film.render(t, { sub: 1 })', [t])
                f = os.path.join(out, f'v{i:02d}.jpg'); await pg.screenshot(path=f, type='jpeg', quality=88); fs.append((f, t, view))
                if os.environ.get('EXPR'): print('EXPR', t, await pg.evaluate(os.environ['EXPR']), flush=True)
            if logs: print('LOGS', logs[:6])
            await b.close()
    finally: srv.terminate()
    cols = min(6, len(fs)); rows = (len(fs) + cols - 1) // cols
    S = Image.new('RGB', (W * cols, Hh * rows), (20, 20, 20))
    for i, (f, t, v) in enumerate(fs):
        S.paste(Image.open(f), ((i % cols) * W, (i // cols) * Hh)); ImageDraw.Draw(S).text(((i % cols) * W + 6, (i // cols) * Hh + 6), f'{i} t={t}', fill=(255, 200, 80))
    S.save(os.path.join(out, 'sheet.jpg'), quality=85)
asyncio.run(main())

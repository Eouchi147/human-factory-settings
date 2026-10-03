"""probe_film.py EXPR [out.json] [film]: open a film page, init it, and evaluate EXPR (for example window.HFS_W.timing). Prints or writes the JSON result."""
import asyncio, subprocess, sys, time, json, os
HERE = os.path.dirname(os.path.abspath(__file__))
async def main():
    from playwright.async_api import async_playwright
    srv = subprocess.Popen([sys.executable, '-m', 'http.server', '8907', '--bind', '127.0.0.1'], cwd=HERE, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(0.8)
    try:
        async with async_playwright() as p:
            b = await p.chromium.launch(args=['--use-gl=angle', '--use-angle=gl-egl', '--ignore-gpu-blocklist'], env={**os.environ, 'LIBGL_ALWAYS_SOFTWARE': '1', 'EGL_PLATFORM': 'surfaceless'})
            pg = await b.new_page(viewport={'width': 270, 'height': 480})
            await pg.goto('http://127.0.0.1:8907/film.html?f=' + (sys.argv[3] if len(sys.argv) > 3 else 'film05')); await pg.wait_for_function('!!(window.HFS && window.HFS.filmReady)', timeout=120000)
            await pg.evaluate('c => window.HFS.film.init(c)', {'width': 270, 'height': 480, 'shadow': 512})
            r = await pg.evaluate(sys.argv[1])
            (open(sys.argv[2], "w").write(json.dumps(r)) if len(sys.argv) > 2 else print(json.dumps(r, indent=1)[:3000])); await b.close()
    finally: srv.terminate()
asyncio.run(main())

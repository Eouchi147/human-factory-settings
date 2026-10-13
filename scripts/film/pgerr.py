import asyncio, subprocess, sys, time, os
HERE = sys.argv[2]; film = sys.argv[1]; port = int(sys.argv[3]) if len(sys.argv) > 3 else 8979
async def main():
    from playwright.async_api import async_playwright
    srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(port), '--bind', '127.0.0.1'], cwd=HERE, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(0.8)
    try:
        async with async_playwright() as p:
            b = await p.chromium.launch(args=['--use-gl=angle', '--use-angle=gl-egl', '--ignore-gpu-blocklist'], env={**os.environ, 'LIBGL_ALWAYS_SOFTWARE': '1', 'EGL_PLATFORM': 'surfaceless'})
            pg = await b.new_page(viewport={'width': 270, 'height': 480}); logs = []
            pg.on('pageerror', lambda e: logs.append('PAGEERR ' + str(e)[:600])); pg.on('console', lambda m: logs.append(m.type + ' ' + m.text[:400]))
            await pg.goto(f'http://127.0.0.1:{port}/film.html?f={film}')
            try:
                await pg.wait_for_function('!!(window.HFS && window.HFS.filmReady)', timeout=60000)
                print('ready'); r = await pg.evaluate('c => window.HFS.film.init(c).then(x => JSON.stringify(x).slice(0, 1500))', {'width': 270, 'height': 480, 'shadow': 256}); print('INIT', r)
            except Exception as e: print('EXC', str(e)[:300])
            for l in logs[:30]: print(l)
            await b.close()
    finally: srv.terminate()
asyncio.run(main())

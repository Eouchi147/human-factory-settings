"""measure_caps.py FILM JSON: JSON = [[size, html], ...]; lays each caption out like the film's .cap (fonts loaded), one line
per <br>, and prints each line's natural width against the cap's max width (86% of 1080 = 928.8 px)."""
import asyncio, subprocess, sys, time, os, json
HERE = os.path.dirname(os.path.abspath(__file__))
JS = """(jobs) => jobs.map(([size, html]) => {
  const lines = html.split(/<br\\s*\\/?>/i), out = [];
  for (const ln of lines) { const e = document.createElement('div'); e.className = 'cap'; e.style.cssText = 'top:0;visibility:hidden;white-space:nowrap;max-width:none;font-size:' + size + 'px'; e.innerHTML = ln; (document.getElementById('ovw') || document.getElementById('ov')).appendChild(e); out.push(Math.round(e.getBoundingClientRect().width)); e.remove(); }
  return { size, html, widths: out, max: Math.max(...out) };
})"""
async def main(film, jobs):
    from playwright.async_api import async_playwright
    port = int(os.environ.get('PORT', 8914))
    srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(port), '--bind', '127.0.0.1'], cwd=HERE, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(0.8)
    try:
        async with async_playwright() as p:
            b = await p.chromium.launch(args=['--use-gl=angle', '--use-angle=gl-egl', '--ignore-gpu-blocklist'], env={**os.environ, 'LIBGL_ALWAYS_SOFTWARE': '1', 'EGL_PLATFORM': 'surfaceless'})
            pg = await b.new_page(viewport={'width': 1080, 'height': 1920})
            await pg.goto(f'http://127.0.0.1:{port}/film.html?f={film}'); await pg.wait_for_function('!!(window.HFS && window.HFS.filmReady)', timeout=180000)
            await pg.evaluate('c => window.HFS.film.init(c)', {'width': 270, 'height': 480, 'shadow': 256})
            await pg.evaluate('() => document.fonts.ready')
            for r in await pg.evaluate(JS, jobs):
                flag = 'OK ' if r['max'] <= 928 else 'TOO WIDE'
                print(f"{flag} {r['size']}px max {r['max']} {r['widths']}  {r['html']}")
            await b.close()
    finally: srv.terminate()
asyncio.run(main(sys.argv[1], json.loads(sys.argv[2])))

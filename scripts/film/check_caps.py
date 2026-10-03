"""check_caps.py film01 film02 ...: for each film page, lay out every caption at full size and report any caption whose
words wrap onto more lines than its <br> breaks ask for (a line too long for its font size). Prints one line per problem."""
import asyncio, subprocess, sys, time, os, json
HERE = os.path.dirname(os.path.abspath(__file__))
JS = """() => {
  const out = [];
  document.querySelectorAll('.cap, .num').forEach((el, i) => {
    el.style.visibility = 'visible';
    const fs = parseFloat(el.style.fontSize) || 80, ys = [];
    el.querySelectorAll('span.w').forEach((w) => { const r = w.getBoundingClientRect(); ys.push(r.top + r.height / 2); });
    ys.sort((p, q) => p - q); let n = ys.length ? 1 : 0; for (let k = 1; k < ys.length; k++) if (ys[k] - ys[k - 1] > 0.5 * fs) n++;
    const want = el.querySelectorAll('br').length + 1;
    out.push({ i, want, got: n, size: el.style.fontSize, w: Math.round(el.getBoundingClientRect().width), text: el.textContent.replace(/\\s+/g, ' ').trim() });
  });
  return out;
}"""
async def main(films):
    from playwright.async_api import async_playwright
    srv = subprocess.Popen([sys.executable, '-m', 'http.server', '8913', '--bind', '127.0.0.1'], cwd=HERE, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(0.8)
    bad = 0
    try:
        async with async_playwright() as p:
            b = await p.chromium.launch(args=['--use-gl=angle', '--use-angle=gl-egl', '--ignore-gpu-blocklist'], env={**os.environ, 'LIBGL_ALWAYS_SOFTWARE': '1', 'EGL_PLATFORM': 'surfaceless'})
            for f in films:
                pg = await b.new_page(viewport={'width': 1080, 'height': 1920})
                await pg.goto('http://127.0.0.1:8913/' + (f if f.endswith('.html') else 'film.html?f=' + f)); await pg.wait_for_function('!!(window.HFS && window.HFS.filmReady)', timeout=180000)
                await pg.evaluate('c => window.HFS.film.init(c)', {'width': 270, 'height': 480, 'shadow': 256})
                await pg.evaluate('() => document.fonts.ready')
                res = await pg.evaluate(JS)
                for r in res:
                    if r['got'] > r['want']:
                        bad += 1; print(f"{f} cap {r['i']}: {r['got']} lines for {r['want']} ({r['size']}): {r['text']}")
                print(f"{f}: {len(res)} captions checked"); await pg.close()
            await b.close()
    finally: srv.terminate()
    print('problems:', bad)
asyncio.run(main(sys.argv[1:]))

"""Film 1, one continuous shot: renders frames with Playwright (Chromium, software GL) and saves them as JPEG.
Usage: python3 film_render.py OUTDIR --w 540 --h 960 --fps 12 --t0 0 --t1 63 [--times 1,2,3] [--guide] [--blur]"""
import asyncio, argparse, os, sys, time, subprocess, json
HERE = os.path.dirname(os.path.abspath(__file__))
ap = argparse.ArgumentParser()
ap.add_argument('out'); ap.add_argument('--w', type=int, default=540); ap.add_argument('--h', type=int, default=960)
ap.add_argument('--fps', type=float, default=12); ap.add_argument('--t0', type=float, default=0); ap.add_argument('--t1', type=float, default=63)
ap.add_argument('--times', default=''); ap.add_argument('--guide', action='store_true'); ap.add_argument('--blur', action='store_true')
ap.add_argument('--port', type=int, default=8771); ap.add_argument('--shadow', type=int, default=1024); ap.add_argument('--png', action='store_true')
ap.add_argument('--extra', default='{}'); ap.add_argument('--rw', type=int, default=0); ap.add_argument('--rh', type=int, default=0); ap.add_argument('--start', type=int, default=0); ap.add_argument('--step', type=int, default=1); ap.add_argument('--end', type=int, default=0); ap.add_argument('--film', default=''); ap.add_argument('--retime', default='')
a = ap.parse_args()
# motion blur: sub-frames where the picture moves (from the camera's own motion, measured in the page),
# plus a floor where things move on their own: the time-lapse hands, the dials' clicks, the hands swinging home
FAST = [(52.3, 54.6, 8), (47.05, 47.65, 4), (49.05, 49.65, 4), (50.85, 51.45, 4), (59.9, 60.8, 4)]
def floor_subs(t):
    for t0, t1, n in FAST:
        if t0 <= t <= t1: return n
    return 1

async def main():
    from playwright.async_api import async_playwright
    os.makedirs(a.out, exist_ok=True)
    srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(a.port), '--bind', '127.0.0.1'], cwd=HERE, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(0.8)
    try:
        async with async_playwright() as p:
            GL = os.environ.get('FILM_GL', 'egl')  # egl = Mesa llvmpipe through ANGLE: 2 to 4 times faster than SwiftShader here, same picture
            glargs = {'swiftshader': ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'], 'egl': ['--use-gl=angle', '--use-angle=gl-egl'], 'gl': ['--use-gl=angle', '--use-angle=gl'], 'native': ['--use-gl=egl']}[GL]
            b = await p.chromium.launch(args=glargs + ['--ignore-gpu-blocklist', '--disable-lcd-text'], env={**os.environ, 'LIBGL_ALWAYS_SOFTWARE': '1', 'EGL_PLATFORM': 'surfaceless'})
            pg = await b.new_page(viewport={'width': a.w, 'height': a.h})
            logs = []
            pg.on('pageerror', lambda e: logs.append('ERR ' + str(e)))
            pg.on('console', lambda m: logs.append(m.type + ' ' + m.text[:300]) if m.type in ('error', 'warning') else None)
            await pg.goto(f'http://127.0.0.1:{a.port}/' + (f'film.html?f={a.film}' if a.film else 'index_film.html'))
            await pg.wait_for_function('!!(window.HFS && window.HFS.filmReady)', timeout=120000)
            t = time.time()
            RT = json.load(open(a.retime))['anchors'] if a.retime else None
            info = await pg.evaluate('c => window.HFS.film.init(c)', {'width': a.rw or a.w, 'height': a.rh or a.h, 'guide': a.guide, 'shadow': a.shadow, **({'retime': RT} if RT else {}), **json.loads(a.extra)})
            await pg.evaluate('() => document.fonts.ready')
            print('init', round(time.time() - t, 1), 's', json.dumps(info)[:600], logs[:5], flush=True)
            if a.film: FAST[:] = [tuple(x) for x in info.get('fast', [])]   # each film says where things move fast on their own
            if RT:   # the film's fast stretches are in its own time: move them to the new voice's time
                sys.path.insert(0, HERE); from retime import timemap, inverse
                inv = inverse(timemap(RT)); FAST[:] = [(inv(t0), inv(t1), n) for t0, t1, n in FAST]
            if a.times:
                times = [float(x) for x in a.times.split(',')]
            else:
                n = int(round((a.t1 - a.t0) * a.fps))
                times = [a.t0 + i / a.fps for i in range(n)]
            for i in range(a.start, a.end or len(times), a.step):
                tt = times[i]
                name = os.path.join(a.out, (f't{tt:06.2f}' if a.times else f'f{i:05d}') + ('.png' if a.png else '.jpg'))
                if os.path.exists(name) and not a.times: continue
                t = time.time()
                n = floor_subs(tt) if a.blur else 1   # the camera's own motion is blurred in the page, every frame
                await pg.evaluate('([t, s, f]) => window.HFS.film.render(t, { sub: s, fps: f })', [tt, n, a.fps])
                if a.png: await pg.screenshot(path=name, timeout=600000)
                else: await pg.screenshot(path=name, type='jpeg', quality=93, timeout=600000)  # heavy sub-frame work can take minutes
                if (i // a.step) % 5 == 0 or a.times: print(f'{i} t={tt:.2f} sub={n} {time.time() - t:.2f}s', logs[-3:] if logs else '', flush=True)
            await b.close()
    finally:
        srv.terminate()
asyncio.run(main())

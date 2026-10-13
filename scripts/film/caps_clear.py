"""caps_clear.py FILM [--dt 0.1] [--margin 0.012] [--port P]: walks the film's real camera path and reports every moment the
skeleton sits behind the words on screen: any bone point projected inside a caption's text box (plus a margin) while that
caption is fully up. Moments the film declares dark are left out: inside its shade windows (F.shade, the deep scrim behind
the words, at full strength) and its dark windows (F.dark: the skeleton unlit). Check those by eye on the contact sheet.
Prints one line per stretch (time span, how deep into the box, the bone, the caption). Exit 1 if any."""
import asyncio, subprocess, sys, time, os, json, argparse
HERE = os.path.dirname(os.path.abspath(__file__))
ap = argparse.ArgumentParser(); ap.add_argument('film'); ap.add_argument('--dt', type=float, default=0.1); ap.add_argument('--margin', type=float, default=0.012)
ap.add_argument('--port', type=int, default=8987); ap.add_argument('--t0', type=float, default=0); ap.add_argument('--t1', type=float, default=-1)
a = ap.parse_args()
JS = r"""async ([dt, margin, t0, t1]) => {
  const THREE = await import('three');
  const api = window.HFS.film, S = api.debug(), F = api.film, W = window.HFS_W, cam = S.cam;
  await document.fonts.ready;
  const sc = innerWidth / 1080;
  const caps = S.O.caps.map((c) => { c.el.style.visibility = 'visible'; c.el.style.opacity = 1;
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    c.words.forEach((w) => { w.style.opacity = 1; const q = w.getBoundingClientRect(); x0 = Math.min(x0, q.left); y0 = Math.min(y0, q.top); x1 = Math.max(x1, q.right); y1 = Math.max(y1, q.bottom); });
    return { t0: c.t0, t1: c.t1, box: [x0 / sc / 1080, y0 / sc / 1920, x1 / sc / 1080, y1 / sc / 1920], text: c.el.textContent.replace(/\s+/g, ' ').trim().slice(0, 34) }; });
  let bones = W.bones;
  if (!bones) { bones = []; W.rig.root.traverse((o) => { if (o.isMesh && o.userData && ['bone', 'tooth', 'cartilage'].includes(o.userData.tissue)) bones.push(o); }); }
  const v = new THREE.Vector3(), out = [], T1 = t1 > 0 ? t1 : api.T.end;
  const ss = (a, b, x) => { const k = Math.min(1, Math.max(0, (x - a) / (b - a))); return k * k * (3 - 2 * k); };
  const shade = (t) => { let k = 0; for (const [a, b] of F.shade || []) k = Math.max(k, ss(a, a + 0.2, t) * (1 - ss(b - 0.2, b, t))); return k; };
  let skipped = 0;
  for (let t = t0; t <= T1 + 1e-6; t += dt) {
    const cs = caps.filter((c) => t >= c.t0 + 0.2 && t <= c.t1 - 0.2); if (!cs.length) continue;
    if (shade(t) > 0.97 || (F.dark || []).some(([a, b]) => t >= a && t <= b)) { skipped++; continue; }
    F.update(S, t); S.scene.updateMatrixWorld(true);
    const P = F.pose(S, t); cam.position.fromArray(P.p); cam.lookAt(new THREE.Vector3().fromArray(P.l)); cam.fov = P.fov ?? 30; cam.aspect = 1080 / 1920; cam.updateProjectionMatrix(); cam.updateMatrixWorld(true);
    let worst = null;
    for (const m of bones) { let vis = true; for (let o = m; o; o = o.parent) if (!o.visible) { vis = false; break; } if (!vis) continue;
      const pos = m.geometry.attributes.position, step = Math.max(1, Math.floor(pos.count / 80));
      for (let i = 0; i < pos.count; i += step) { v.fromBufferAttribute(pos, i).applyMatrix4(m.matrixWorld).project(cam); if (v.z > 1 || v.z < -1) continue;
        const x = (v.x + 1) / 2, y = (1 - v.y) / 2;
        for (const c of cs) { const [bx0, by0, bx1, by1] = c.box; if (x >= bx0 - margin && x <= bx1 + margin && y >= by0 - margin && y <= by1 + margin) { const d = Math.min(y - (by0 - margin), by1 + margin - y, x - (bx0 - margin), bx1 + margin - x); if (!worst || d > worst.d) worst = { d, bone: m.userData.name, cap: c.text }; } } } }
    if (worst) out.push({ t: +t.toFixed(2), d: +worst.d.toFixed(3), bone: worst.bone, cap: worst.cap });
  }
  return { caps: caps.length, out, skipped: +(skipped * dt).toFixed(2) };
}"""
async def main():
    from playwright.async_api import async_playwright
    srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(a.port), '--bind', '127.0.0.1'], cwd=HERE, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(0.8)
    try:
        async with async_playwright() as p:
            b = await p.chromium.launch(args=['--use-gl=angle', '--use-angle=gl-egl', '--ignore-gpu-blocklist'], env={**os.environ, 'LIBGL_ALWAYS_SOFTWARE': '1', 'EGL_PLATFORM': 'surfaceless'})
            pg = await b.new_page(viewport={'width': 270, 'height': 480})
            await pg.goto(f'http://127.0.0.1:{a.port}/film.html?f={a.film}'); await pg.wait_for_function('!!(window.HFS && window.HFS.filmReady)', timeout=180000)
            await pg.evaluate('c => window.HFS.film.init(c)', {'width': 270, 'height': 480, 'shadow': 256})
            res = await pg.evaluate(JS, [a.dt, a.margin, a.t0, a.t1])
            await b.close()
    finally: srv.terminate()
    rows = res['out']; spans = []
    for r in rows:
        if spans and abs(r['t'] - spans[-1]['t1'] - a.dt) < a.dt * 0.6 and r['cap'] == spans[-1]['cap']:
            s = spans[-1]; s['t1'] = r['t'];
            if r['d'] > s['d']: s['d'], s['bone'] = r['d'], r['bone']
        else: spans.append({'t0': r['t'], 't1': r['t'], 'd': r['d'], 'bone': r['bone'], 'cap': r['cap']})
    for s in spans: print(f"{s['t0']:6.2f}-{s['t1']:6.2f}  {s['d']*100:4.1f}% into the words  {s['bone'][:38]:38s}  \"{s['cap']}\"")
    if res.get('skipped'): print(f"(left out: {res['skipped']} s the film declares shaded or unlit)")
    print(f"{a.film}: {res['caps']} captions, bones behind the words: {len(spans)} stretches")
    sys.exit(1 if spans else 0)
asyncio.run(main())

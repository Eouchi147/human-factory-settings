"""tags_check.py FILM [--dt 0.1] [--t0] [--t1] [--port P] [--x1 0.85] [--y1 0.8]: walks the film's camera path and reports every
moment printed words in the scene (text drawn into canvas textures with fillText) show in the bottom fifth of the frame
(y > y1) or in the right-hand button column (x > x1). Text is found by recording each fillText call's box on its canvas
(an init script), mapping the box through the mesh's UVs to 3D, and projecting it with the film's own camera. Text must
face the camera, its mesh be visible and opaque enough; occlusion by other objects is not tested (check those by eye).
Prints one line per stretch: time span, the text, where it reaches. Exit 1 if any."""
import asyncio, subprocess, sys, time, os, json, argparse
HERE = os.path.dirname(os.path.abspath(__file__))
ap = argparse.ArgumentParser(); ap.add_argument('film'); ap.add_argument('--dt', type=float, default=0.1)
ap.add_argument('--port', type=int, default=8988); ap.add_argument('--t0', type=float, default=0); ap.add_argument('--t1', type=float, default=-1)
ap.add_argument('--x1', type=float, default=0.85); ap.add_argument('--y1', type=float, default=0.8)
ap.add_argument('--digits', action='store_true', help='also check lone numerals (clock dials); off by default')
ap.add_argument('--whips', action='store_true', help='also check inside the fast camera moves; off by default')
a = ap.parse_args()
INIT = r"""(() => {
  const P = CanvasRenderingContext2D.prototype, fT = P.fillText, sT = P.strokeText, fR = P.fillRect, cR = P.clearRect;
  const rec = function (s, x, y) { try { const m = this.measureText(String(s)), tr = this.getTransform();
      const x0 = x - m.actualBoundingBoxLeft, x1 = x + m.actualBoundingBoxRight, y0 = y - m.actualBoundingBoxAscent, y1 = y + m.actualBoundingBoxDescent;
      if (!(x1 > x0 && y1 > y0)) return;
      const pts = []; for (const fx of [0, 0.25, 0.5, 0.75, 1]) for (const fy of [0, 0.5, 1]) { const px = x0 + (x1 - x0) * fx, py = y0 + (y1 - y0) * fy; pts.push([tr.a * px + tr.c * py + tr.e, tr.b * px + tr.d * py + tr.f]); }
      const c = this.canvas; (c.__tb = c.__tb || []).push({ pts, s: String(s).slice(0, 30), alpha: this.globalAlpha }); c.__tv = (c.__tv || 0) + 1; } catch (e) {} };
  P.fillText = function (s, x, y, mw) { rec.call(this, s, x, y); return fT.apply(this, arguments); };
  P.strokeText = function (s, x, y, mw) { rec.call(this, s, x, y); return sT.apply(this, arguments); };
  const wipe = function (x, y, w, h) { const t = this.getTransform(); if (t.isIdentity && x <= 0 && y <= 0 && x + w >= this.canvas.width && y + h >= this.canvas.height) { this.canvas.__tb = []; this.canvas.__tv = (this.canvas.__tv || 0) + 1; } };
  P.fillRect = function (x, y, w, h) { wipe.call(this, x, y, w, h); return fR.apply(this, arguments); };
  P.clearRect = function (x, y, w, h) { wipe.call(this, x, y, w, h); return cR.apply(this, arguments); };
})();"""
JS = r"""async ([dt, t0, t1, X1, Y1, digits, fast]) => {
  const THREE = await import('three');
  const api = window.HFS.film, S = api.debug(), F = api.film, cam = S.cam;
  const v = new THREE.Vector3(), out = [], T1 = t1 > 0 ? t1 : api.T.end;
  const cache = new Map();   // mesh -> { tv, pts: [[local xyz, normal, text, alpha]] }
  const canvasOf = (m) => { const arr = Array.isArray(m.material), mats = arr ? m.material : [m.material]; for (let k = 0; k < mats.length; k++) { const mt = mats[k], mp = mt && mt.map; const im = mp && (mp.image || (mp.source && mp.source.data)); if (im && im.__tb) return [im, mt, mp, arr ? k : -1]; } return null; };
  function locate(m, im, mp, mi) {
    const g = m.geometry, P = g.attributes.position, U = g.attributes.uv; if (!U) return [];
    const idx = g.index ? g.index.array : null, n = idx ? idx.length : P.count, res = [];
    const W = im.width, H = im.height, flip = mp.flipY !== false;
    const ranges = mi >= 0 && g.groups.length ? g.groups.filter((q) => q.materialIndex === mi).map((q) => [q.start, q.start + q.count]) : [[0, n]];   // only the faces that wear this texture
    const tri = []; for (const [r0, r1] of ranges) for (let i = r0; i < Math.min(r1, n); i += 3) tri.push(idx ? [idx[i], idx[i + 1], idx[i + 2]] : [i, i + 1, i + 2]);
    for (const tb of im.__tb) for (const [px, py] of tb.pts) {
      let u = px / W, w = py / H; let vv = flip ? 1 - w : w;
      if (mp.repeat) { u = u * 1; }
      for (const [i0, i1, i2] of tri) {
        const ax = U.getX(i0), ay = U.getY(i0), bx = U.getX(i1), by = U.getY(i1), cx = U.getX(i2), cy = U.getY(i2);
        const d = (by - cy) * (ax - cx) + (cx - bx) * (ay - cy); if (Math.abs(d) < 1e-12) continue;
        const l0 = ((by - cy) * (u - cx) + (cx - bx) * (vv - cy)) / d, l1 = ((cy - ay) * (u - cx) + (ax - cx) * (vv - cy)) / d, l2 = 1 - l0 - l1;
        if (l0 < -1e-4 || l1 < -1e-4 || l2 < -1e-4) continue;
        const A = new THREE.Vector3().fromBufferAttribute(P, i0), B = new THREE.Vector3().fromBufferAttribute(P, i1), C = new THREE.Vector3().fromBufferAttribute(P, i2);
        const p = A.clone().multiplyScalar(l0).add(B.clone().multiplyScalar(l1)).add(C.clone().multiplyScalar(l2));
        const nn = B.clone().sub(A).cross(C.clone().sub(A)).normalize();
        res.push([p, nn, tb.s, tb.alpha]);
      } }
    return res;
  }
  for (let t = t0; t <= T1 + 1e-6; t += dt) {
    if (fast.some(([a, b]) => t > a - 0.05 && t < b + 0.05)) continue;
    F.update(S, t); S.scene.updateMatrixWorld(true);
    const Pz = F.pose(S, t); cam.position.fromArray(Pz.p); cam.lookAt(new THREE.Vector3().fromArray(Pz.l)); cam.fov = Pz.fov ?? 30; cam.aspect = 1080 / 1920; cam.updateProjectionMatrix(); cam.updateMatrixWorld(true);
    let worst = null;
    S.scene.traverse((m) => {
      if (!m.isMesh) return; const r = canvasOf(m); if (!r) return; const [im, mt, mp, mi] = r;
      for (let o = m; o; o = o.parent) if (!o.visible) return;
      if (mt.opacity !== undefined && mt.transparent && mt.opacity < 0.25) return;
      let c = cache.get(m); if (!c || c.tv !== im.__tv) { c = { tv: im.__tv, pts: locate(m, im, mp, mi) }; cache.set(m, c); }
      const nm = new THREE.Matrix3().getNormalMatrix(m.matrixWorld), side = mt.side;
      for (const [p, nn, s, alpha] of c.pts) { if (alpha < 0.25) continue; if (!digits && /^\s*\d{1,2}\s*$/.test(s)) continue;
        v.copy(p).applyMatrix4(m.matrixWorld); const wn = nn.clone().applyMatrix3(nm).normalize(), toCam = cam.position.clone().sub(v);
        if (side === THREE.FrontSide && wn.dot(toCam) <= 0) continue;
        v.project(cam); if (v.z > 1 || v.z < -1) continue; const x = (v.x + 1) / 2, y = (1 - v.y) / 2;
        if (x < 0 || x > 1 || y < 0 || y > 1) continue;
        const d = Math.max(y - Y1, x - X1); if (d > 0 && (!worst || d > worst.d)) worst = { d, s, x: +x.toFixed(3), y: +y.toFixed(3), mesh: m.name || (m.userData && m.userData.name) || '' };
      } });
    if (worst) out.push({ t: +t.toFixed(2), ...worst });
  }
  return out;
}"""
async def main():
    from playwright.async_api import async_playwright
    srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(a.port), '--bind', '127.0.0.1'], cwd=HERE, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(0.8)
    try:
        async with async_playwright() as p:
            b = await p.chromium.launch(args=['--use-gl=angle', '--use-angle=gl-egl', '--ignore-gpu-blocklist'], env={**os.environ, 'LIBGL_ALWAYS_SOFTWARE': '1', 'EGL_PLATFORM': 'surfaceless'})
            pg = await b.new_page(viewport={'width': 270, 'height': 480}); await pg.add_init_script(INIT)
            await pg.goto(f'http://127.0.0.1:{a.port}/film.html?f={a.film}'); await pg.wait_for_function('!!(window.HFS && window.HFS.filmReady)', timeout=180000)
            info = await pg.evaluate('c => window.HFS.film.init(c)', {'width': 270, 'height': 480, 'shadow': 256})
            fast = [] if a.whips else [[f[0], f[1]] for f in (info.get('fast') or [])]
            rows = await pg.evaluate(JS, [a.dt, a.t0, a.t1, a.x1, a.y1, a.digits, fast])
            await b.close()
    finally: srv.terminate()
    spans = []
    for r in rows:
        if spans and abs(r['t'] - spans[-1]['t1'] - a.dt) < a.dt * 0.6 and r['s'] == spans[-1]['s']:
            s = spans[-1]; s['t1'] = r['t']
            if r['d'] > s['d']: s.update(d=r['d'], x=r['x'], y=r['y'])
        else: spans.append({'t0': r['t'], 't1': r['t'], **{k: r[k] for k in ('d', 's', 'x', 'y')}})
    for s in spans: print(f"{s['t0']:6.2f}-{s['t1']:6.2f}  \"{s['s']}\" reaches x {s['x']:.3f} y {s['y']:.3f} ({s['d']*100:.1f}% past the line)")
    print(f"{a.film}: printed words in the bottom fifth or the button column: {len(spans)} stretches")
    sys.exit(1 if spans else 0)
asyncio.run(main())

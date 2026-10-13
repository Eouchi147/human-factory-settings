"""jump_check.py FILM [--fps 24] [--port P]: poses a film frame by frame (no rendering) and reports every pop: a bone or a
prop that moves much further in one frame than in the frames either side of it (a pose that jumps instead of moving).
A jump the camera cannot see (the part outside the frame on both sides of it, as when a film moves its skeleton while the
camera is at another station) is not reported.
Usage: python3 jump_check.py film04 --port 8975"""
import asyncio, subprocess, sys, time, os, json, argparse
HERE = os.path.dirname(os.path.abspath(__file__))
ap = argparse.ArgumentParser(); ap.add_argument('film'); ap.add_argument('--fps', type=float, default=24); ap.add_argument('--port', type=int, default=8975)
ap.add_argument('--t0', type=float, default=0); ap.add_argument('--t1', type=float, default=-1)
a = ap.parse_args()

JS = r"""async ([t0, t1, fps]) => {
  const api = window.HFS.film, S = api.debug(), F = api.film, W = window.HFS_W, R = W.rig;
  const T1 = t1 > 0 ? t1 : api.T.end;
  // what is tracked: every bone of the limbs (the trunk moves smoothly with the spine), and every prop part
  const objs = [];
  R.root.traverse((o) => { if (o.isMesh && o.userData && o.userData.name && ['bone', 'tooth', 'cartilage'].includes(o.userData.tissue)) objs.push({ o, name: o.userData.name }); });
  const props = [['phone', W.phone && W.phone.g], ['bag', W.bag && W.bag.g], ['carrot', W.carrot && W.carrot.g], ['cup', W.cup && W.cup.g], ['remote', W.remote && W.remote.g],
    ['dumbbell L', W.hand && W.hand.Left && W.hand.Left.db], ['dumbbell R', W.hand && W.hand.Right && W.hand.Right.db], ['pedometer', W.ped], ...(W.auditSolids || [])];
  for (const [nm, g] of props) if (g) { let k = 0; g.traverse((o) => { if (o.isMesh && o.geometry && o.geometry.attributes.position) objs.push({ o, name: nm + ' #' + (k++) }); }); }
  for (const b of objs) if (!b.o.geometry.boundingSphere) b.o.geometry.computeBoundingSphere();
  const vis = (o) => { let v = o.visible; o.traverseAncestors((p) => { if (!p.visible) v = false; }); return v; };
  const n = Math.floor((T1 - t0) * fps) + 1, P = objs.map(() => new Float32Array(n * 3)), V = objs.map(() => new Uint8Array(n)), Q = objs.map(() => new Uint8Array(n));
  const THREE = await import('three'), cam = S.cam, pv = new THREE.Vector3();
  const c = { x: 0, y: 0, z: 0 }, e = new Float32Array(16);
  for (let i = 0; i < n; i++) {
    const t = t0 + i / fps; F.update(S, t); S.scene.updateMatrixWorld(true);
    const Pz = F.pose(S, t); cam.position.fromArray(Pz.p); cam.lookAt(new THREE.Vector3().fromArray(Pz.l)); cam.fov = Pz.fov ?? 30; cam.aspect = 1080 / 1920; cam.updateProjectionMatrix(); cam.updateMatrixWorld(true);
    objs.forEach((b, k) => { const s = b.o.geometry.boundingSphere.center, m = b.o.matrixWorld.elements;
      P[k][i * 3] = m[0] * s.x + m[4] * s.y + m[8] * s.z + m[12]; P[k][i * 3 + 1] = m[1] * s.x + m[5] * s.y + m[9] * s.z + m[13]; P[k][i * 3 + 2] = m[2] * s.x + m[6] * s.y + m[10] * s.z + m[14];
      V[k][i] = vis(b.o) ? 1 : 0;
      pv.set(P[k][i * 3], P[k][i * 3 + 1], P[k][i * 3 + 2]).project(cam); const r = b.o.geometry.boundingSphere.radius * 0;   // in the frame (a 10% margin round it)
      Q[k][i] = (pv.z < 1 && pv.z > -1 && pv.x > -1.2 && pv.x < 1.2 && pv.y > -1.2 && pv.y < 1.2) ? 1 : 0; });
  }
  // a pop: a step over 12 mm that is more than 3x the larger of the steps before and after it (visible in all four frames)
  const out = [];
  objs.forEach((b, k) => { const d = (i) => Math.hypot(P[k][i * 3] - P[k][i * 3 - 3], P[k][i * 3 + 1] - P[k][i * 3 - 2], P[k][i * 3 + 2] - P[k][i * 3 - 1]);
    for (let i = 2; i < n - 1; i++) { if (!(V[k][i - 2] && V[k][i - 1] && V[k][i] && V[k][i + 1])) continue; if (!(Q[k][i - 1] || Q[k][i])) continue;
      const di = d(i), nb = Math.max(d(i - 1), d(i + 1)); if (di > 0.012 && di > 3 * nb) out.push([+(t0 + i / fps).toFixed(3), b.name, +(di * 1000).toFixed(1), +(nb * 1000).toFixed(1)]); } });
  return { frames: n, objects: objs.length, pops: out };
}"""

async def main():
    from playwright.async_api import async_playwright
    srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(a.port), '--bind', '127.0.0.1'], cwd=HERE, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(0.8)
    try:
        async with async_playwright() as p:
            b = await p.chromium.launch(args=['--use-gl=angle', '--use-angle=gl-egl', '--ignore-gpu-blocklist'], env={**os.environ, 'LIBGL_ALWAYS_SOFTWARE': '1', 'EGL_PLATFORM': 'surfaceless'})
            pg = await b.new_page(viewport={'width': 180, 'height': 320})
            await pg.goto(f'http://127.0.0.1:{a.port}/film.html?f={a.film}'); await pg.wait_for_function('!!(window.HFS && window.HFS.filmReady)', timeout=180000)
            await pg.evaluate('c => window.HFS.film.init(c)', {'width': 180, 'height': 320, 'shadow': 256})
            r = await pg.evaluate(JS, [a.t0, a.t1, a.fps])
            await b.close()
    finally: srv.terminate()
    # merge: one line per moment (objects popping in the same frame grouped)
    by = {}
    for t, name, d, nb in r['pops']: by.setdefault(t, []).append((d, name, nb))
    print(f"{a.film}: {r['frames']} frames, {r['objects']} objects tracked")
    for t in sorted(by):
        L = sorted(by[t], reverse=True)
        print(f"  {t:7.3f}s  {len(L):3d} objects pop, largest {L[0][0]:.0f} mm ({L[0][1]}; steps either side {L[0][2]:.0f} mm)")
    print('pops:', len(by))
    sys.exit(1 if by else 0)
asyncio.run(main())

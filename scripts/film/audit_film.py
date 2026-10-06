"""audit_film.py FILM [--dt 0.1] [--t0 0] [--t1 end]: poses a film through its whole timeline (no rendering) and reports
every moment where the skeleton goes through itself or through a prop, so it is fixed before a frame is rendered.
- Bone through bone: every bone is voxelised once in its own frame (3 mm or finer, filled, with depth from its surface);
  each point the voxels flag is then measured exactly (a ray's crossings say inside or out, the nearest triangle says how
  deep), and anything 1.5 mm or more inside is reported.
  Limb bones (arms, hands, legs, feet, the shoulder girdle) and the film's props are tested against every other bone,
  except bones that ride together or meet at a joint (and spine against ribs, girdle against ribs, which slide by design).
- Inside the head: limbs and props inside the convex hull of the skull (orbits, mouth and cranium included).
- Rides with the wrong part: a bone or cartilage that, at rest, touches nothing in the rigid group it moves with.
- Below the floor.
Prints one line per problem stretch: time span, what goes into what, and how deep (mm). Exit code 1 if anything is found."""
import asyncio, subprocess, sys, time, os, json, argparse
HERE = os.path.dirname(os.path.abspath(__file__))
ap = argparse.ArgumentParser(); ap.add_argument('film'); ap.add_argument('--dt', type=float, default=0.1); ap.add_argument('--t0', type=float, default=0.0)
ap.add_argument('--t1', type=float, default=-1); ap.add_argument('--port', type=int, default=int(os.environ.get('PORT', 8939))); ap.add_argument('--min', type=float, default=1.5)
ap.add_argument('--json', default='')
a = ap.parse_args()

JS = r"""async ([t0, t1, dt, minDepth]) => {
  const THREE = await import('three');
  const { ConvexHull } = await import('three/addons/math/ConvexHull.js');
  const api = window.HFS.film, S = api.debug(), F = api.film, W = window.HFS_W, R = W.rig;
  const T1 = t1 > 0 ? t1 : api.T.end;
  // ---- the skeleton's meshes, and which rigid body each rides with
  const bones = []; R.root.traverse((o) => { if (o.isMesh && o.userData && o.userData.name && ['bone', 'tooth', 'cartilage'].includes(o.userData.tissue)) bones.push(o); });
  const spineNames = new Set(Object.keys(R.seg)); const segGroups = new Set(Object.values(R.seg).map((s) => s.g));
  const underHead = (m) => { let p = m.parent; while (p) { if (p === R.seg.Atlas.g) return true; p = p.parent; } return false; };   // the skull, and a jaw on its own hinge
  const axial = (m) => segGroups.has(m.parent) || m.parent === R.pelvis || underHead(m) || /rib|costal|sternum|manubrium|xiphoid|hyoid/i.test(m.userData.name);
  const girdle = (m) => /clavicle|scapula/i.test(m.userData.name);
  const handRe = /phalanx of (left|right) (thumb|index|middle|ring|little)|metacarpal|carpal|scaphoid|lunate|triquetr|pisiform|trapez|capitate|hamate/i;
  const sideOf = (m) => (/\bright\b/i.test(m.userData.name) ? 'R' : /\bleft\b/i.test(m.userData.name) ? 'L' : '');
  const adjacent = (a, b) => a.parent === b.parent || a.parent.parent === b.parent || b.parent.parent === a.parent || (handRe.test(a.userData.name) && handRe.test(b.userData.name) && sideOf(a) === sideOf(b));
  // ---- voxelise every bone once, in its own frame: filled, with depth (in cells) from its surface
  function voxelise(geo, fine = false) {
    const P = geo.attributes.position, I = geo.index ? geo.index.array : null, n = P.count;
    const bb = new THREE.Box3().setFromBufferAttribute(P), size = bb.getSize(new THREE.Vector3()), maxD = Math.max(size.x, size.y, size.z);
    const cell = fine ? Math.min(0.0015, Math.max(0.0008, maxD / 40)) : Math.min(0.003, Math.max(0.0012, maxD / 24));
    const o = bb.min.clone().subScalar(cell * 1.5), nx = Math.ceil(size.x / cell) + 4, ny = Math.ceil(size.y / cell) + 4, nz = Math.ceil(size.z / cell) + 4;
    const N = nx * ny * nz, G = new Uint8Array(N), idx = (x, y, z) => (z * ny + y) * nx + x;
    const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), p = new THREE.Vector3();
    const tri = (i0, i1, i2) => {
      a.fromBufferAttribute(P, i0); b.fromBufferAttribute(P, i1); c.fromBufferAttribute(P, i2);
      const L = Math.max(a.distanceTo(b), b.distanceTo(c), c.distanceTo(a)), k = Math.max(1, Math.ceil(L / (cell * 0.45)));
      for (let i = 0; i <= k; i++) for (let j = 0; j <= k - i; j++) {
        const u = i / k, v = j / k; p.set(a.x + (b.x - a.x) * u + (c.x - a.x) * v, a.y + (b.y - a.y) * u + (c.y - a.y) * v, a.z + (b.z - a.z) * u + (c.z - a.z) * v);
        const x = Math.floor((p.x - o.x) / cell), y = Math.floor((p.y - o.y) / cell), z = Math.floor((p.z - o.z) / cell); G[idx(x, y, z)] = 1;
      } };
    if (I) for (let t = 0; t < I.length; t += 3) tri(I[t], I[t + 1], I[t + 2]); else for (let t = 0; t < n; t += 3) tri(t, t + 1, t + 2);
    // flood the outside from the border (6-connected), through empty cells only
    const out = new Uint8Array(N), q = new Int32Array(N); let qh = 0, qt = 0;
    const push = (x, y, z) => { if (x < 0 || y < 0 || z < 0 || x >= nx || y >= ny || z >= nz) return; const k = idx(x, y, z); if (out[k] || G[k]) return; out[k] = 1; q[qt++] = k; };
    push(0, 0, 0);
    while (qh < qt) { const k = q[qh++], x = k % nx, y = Math.floor(k / nx) % ny, z = Math.floor(k / (nx * ny)); push(x + 1, y, z); push(x - 1, y, z); push(x, y + 1, z); push(x, y - 1, z); push(x, y, z + 1); push(x, y, z - 1); }
    // depth: 1 on the inside layer next to the outside, growing inward
    const D = new Uint8Array(N); qh = 0; qt = 0;
    for (let k = 0; k < N; k++) if (!out[k]) { const x = k % nx, y = Math.floor(k / nx) % ny, z = Math.floor(k / (nx * ny));
      const nb = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]].some(([dx, dy, dz]) => { const X = x + dx, Y = y + dy, Z = z + dz; return X < 0 || Y < 0 || Z < 0 || X >= nx || Y >= ny || Z >= nz || out[idx(X, Y, Z)]; });
      if (nb) { D[k] = 1; q[qt++] = k; } }
    while (qh < qt) { const k = q[qh++], d = D[k], x = k % nx, y = Math.floor(k / nx) % ny, z = Math.floor(k / (nx * ny));
      for (const [dx, dy, dz] of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) { const X = x + dx, Y = y + dy, Z = z + dz; if (X < 0 || Y < 0 || Z < 0 || X >= nx || Y >= ny || Z >= nz) continue; const kk = idx(X, Y, Z); if (out[kk] || D[kk]) continue; D[kk] = Math.min(255, d + 1); q[qt++] = kk; } }
    return { o, cell, nx, ny, nz, D };
  }
  // the voxels find candidates; each candidate is then measured exactly (distance to the nearest triangle), so a point a
  // millimetre outside a thin bone in a coarse cell is not reported as inside it
  const TRI = new Map();
  function tris(geo) { let T = TRI.get(geo); if (T) return T; const P = geo.attributes.position, I = geo.index ? geo.index.array : null, n = I ? I.length : P.count;
    T = new Float32Array(n * 3); for (let k = 0; k < n; k++) { const i = I ? I[k] : k; T[k * 3] = P.getX(i); T[k * 3 + 1] = P.getY(i); T[k * 3 + 2] = P.getZ(i); } TRI.set(geo, T); return T; }
  function surfDist(geo, px, py, pz) {   // nearest distance to the triangle soup (Ericson's closest point on a triangle)
    const T = tris(geo); let best = 1e9;
    for (let k = 0; k < T.length; k += 9) {
      const ax = T[k], ay = T[k + 1], az = T[k + 2], bx = T[k + 3], by = T[k + 4], bz = T[k + 5], cx = T[k + 6], cy = T[k + 7], cz = T[k + 8];
      const abx = bx - ax, aby = by - ay, abz = bz - az, acx = cx - ax, acy = cy - ay, acz = cz - az, apx = px - ax, apy = py - ay, apz = pz - az;
      const d1 = abx * apx + aby * apy + abz * apz, d2 = acx * apx + acy * apy + acz * apz; let qx, qy, qz;
      if (d1 <= 0 && d2 <= 0) { qx = ax; qy = ay; qz = az; }
      else { const bpx = px - bx, bpy = py - by, bpz = pz - bz, d3 = abx * bpx + aby * bpy + abz * bpz, d4 = acx * bpx + acy * bpy + acz * bpz;
        if (d3 >= 0 && d4 <= d3) { qx = bx; qy = by; qz = bz; }
        else { const vc = d1 * d4 - d3 * d2;
          if (vc <= 0 && d1 >= 0 && d3 <= 0) { const v = d1 / (d1 - d3); qx = ax + abx * v; qy = ay + aby * v; qz = az + abz * v; }
          else { const cpx = px - cx, cpy = py - cy, cpz = pz - cz, d5 = abx * cpx + aby * cpy + abz * cpz, d6 = acx * cpx + acy * cpy + acz * cpz;
            if (d6 >= 0 && d5 <= d6) { qx = cx; qy = cy; qz = cz; }
            else { const vb = d5 * d2 - d1 * d6;
              if (vb <= 0 && d2 >= 0 && d6 <= 0) { const w = d2 / (d2 - d6); qx = ax + acx * w; qy = ay + acy * w; qz = az + acz * w; }
              else { const va = d3 * d6 - d5 * d4;
                if (va <= 0 && d4 - d3 >= 0 && d5 - d6 >= 0) { const w = (d4 - d3) / ((d4 - d3) + (d5 - d6)); qx = bx + (cx - bx) * w; qy = by + (cy - by) * w; qz = bz + (cz - bz) * w; }
                else { const den = 1 / (va + vb + vc), v = vb * den, w = vc * den; qx = ax + abx * v + acx * w; qy = ay + aby * v + acy * w; qz = az + abz * v + acz * w; } } } } } }
      const dx = px - qx, dy = py - qy, dz = pz - qz, d = dx * dx + dy * dy + dz * dz; if (d < best) best = d;
    }
    return Math.sqrt(best); }
  function rayInside(geo, px, py, pz) {   // a ray's crossings of the closed mesh: odd = inside (Moller-Trumbore)
    const T = tris(geo), dx = 0.8812, dy = 0.3261, dz = 0.3421; let n = 0;
    for (let k = 0; k < T.length; k += 9) {
      const e1x = T[k + 3] - T[k], e1y = T[k + 4] - T[k + 1], e1z = T[k + 5] - T[k + 2], e2x = T[k + 6] - T[k], e2y = T[k + 7] - T[k + 1], e2z = T[k + 8] - T[k + 2];
      const hx = dy * e2z - dz * e2y, hy = dz * e2x - dx * e2z, hz = dx * e2y - dy * e2x, a = e1x * hx + e1y * hy + e1z * hz; if (Math.abs(a) < 1e-12) continue;
      const f = 1 / a, sx = px - T[k], sy = py - T[k + 1], sz = pz - T[k + 2], u = f * (sx * hx + sy * hy + sz * hz); if (u < 0 || u > 1) continue;
      const qx = sy * e1z - sz * e1y, qy = sz * e1x - sx * e1z, qz = sx * e1y - sy * e1x, vv = f * (dx * qx + dy * qy + dz * qz); if (vv < 0 || u + vv > 1) continue;
      if (f * (e2x * qx + e2y * qy + e2z * qz) > 0) n++; }
    return n % 2 === 1; }
  // how deep a voxel candidate really is: 0 if it is outside the mesh, else its distance to the surface
  const depthAt = (geo, x, y, z) => (rayInside(geo, x, y, z) ? surfDist(geo, x, y, z) : 0);
  const V = new Map(); for (const m of bones) if (!V.has(m.geometry)) V.set(m.geometry, voxelise(m.geometry));
  for (const m of bones) if (!m.geometry.boundingSphere) m.geometry.computeBoundingSphere();
  // ---- the head: the convex hull of everything that rides with the skull, in that group's frame
  const headG = R.seg.Atlas.g, headPts = [];
  for (const m of bones) if (m.parent === headG) { const Pp = m.geometry.attributes.position; for (let i = 0; i < Pp.count; i += 3) headPts.push(new THREE.Vector3().fromBufferAttribute(Pp, i).applyMatrix4(m.matrix)); }
  const hull = new ConvexHull().setFromPoints(headPts); const planes = hull.faces.map((f) => { const pl = new THREE.Plane(); pl.setFromNormalAndCoplanarPoint(f.normal, f.midpoint); return pl; });
  const headDepth = (pL) => { let d = 1e9; for (const pl of planes) { const s = -pl.distanceToPoint(pL); if (s < 0) return 0; d = Math.min(d, s); } return d; };
  // ---- what is tested: limb bones, and the film's props (the hand that holds a prop may touch it)
  const limb = (m) => !axial(m);
  const probes = bones.filter(limb).map((m) => ({ m, name: m.userData.name, bone: true }));
  const process_name = (nm, o) => nm + ' (' + (o.geometry.type || 'mesh').replace('Geometry', '').replace('Buffer', '') + ')';   // which part of the prop
  const propRoots = [['phone', W.phone && W.phone.g], ['bag', W.bag && W.bag.g], ['carrot', W.carrot && W.carrot.g], ['cup', W.cup && W.cup.g], ['remote', W.remote && W.remote.g],
    ['dumbbell L', W.hand && W.hand.Left && W.hand.Left.db], ['dumbbell R', W.hand && W.hand.Right && W.hand.Right.db], ['pedometer', W.ped], ...(W.auditSolids || [])];
  for (const [nm, g] of propRoots) if (g) g.traverse((o) => { if (o.isMesh && o.geometry && o.geometry.attributes.position) probes.push({ m: o, name: process_name(nm, o), prop: true }); });
  const handBone = /phalanx|metacarpal|carpal|scaphoid|lunate|triquetr|pisiform|trapez|capitate|hamate|radius|ulna/i;
  // the props as solids (finer cells), so a finger that goes into the phone it holds is found too
  const propT = probes.filter((p) => p.prop && p.m.geometry.attributes.position.count >= 8).map((p) => ({ m: p.m, name: p.name, V: voxelise(p.m.geometry, true) }));
  for (const p of propT) if (!p.m.geometry.boundingSphere) p.m.geometry.computeBoundingSphere();
  const limbBones = bones.map((m) => ({ m, name: m.userData.name }));   // every bone, the skull included (a phone on the nose)
  const events = []; const v = new THREE.Vector3(), w = new THREE.Vector3(), inv = new THREE.Matrix4(), sphA = new THREE.Sphere(), sphB = new THREE.Sphere();
  // ---- a part that rides with the wrong part: at rest every bone or cartilage touches another of its own rigid group (a disk
  //      its vertebra, a cartilage its rib); one 2 cm or more from all of its group mates moves with something it is not
  //      part of, and drifts out of place as the body bends (reported once, at the start)
  { const groups = new Map(); for (const m of bones) if (m.userData.home) { if (!groups.has(m.parent)) groups.set(m.parent, []); groups.get(m.parent).push(m); }
    const restPts = (o) => { const P = o.geometry.attributes.position, h = o.userData.home, st = Math.max(1, Math.floor(P.count / 300)), a = []; for (let i = 0; i < P.count; i += st) a.push([P.getX(i) + h.x, P.getY(i) + h.y, P.getZ(i) + h.z]); return a; };
    for (const [, L] of groups) { if (L.length < 2) continue; const P = L.map(restPts);
      L.forEach((o, i) => { let best = 1e9; P.forEach((Q, j) => { if (j !== i) for (const a of P[i]) for (const b of Q) { const d = (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2; if (d < best) best = d; } });
        best = Math.sqrt(best); if (best > 0.02) events.push([t0, `${o.userData.name} -> rides with the wrong part (${(best * 100).toFixed(1)} cm from its group)`, 1, best * 1000]); }); } }
  const headBones = bones.filter((m) => underHead(m) || m.parent === headG), hs = new THREE.Sphere(), hInv = new THREE.Matrix4(), hl = new THREE.Vector3();
  const nearHeadBone = (pw, r) => { for (const b of headBones) { hs.copy(b.geometry.boundingSphere).applyMatrix4(b.matrixWorld); if (hs.distanceToPoint(pw) > r) continue;
    hInv.copy(b.matrixWorld).invert(); hl.copy(pw).applyMatrix4(hInv); if (surfDist(b.geometry, hl.x, hl.y, hl.z) < r) return true; } return false; };
  const sampleStep = (m) => Math.max(1, Math.floor(m.geometry.attributes.position.count / 600));
  for (let t = t0; t <= T1 + 1e-6; t += dt) {
    F.update(S, t); S.scene.updateMatrixWorld(true);
    const hits = new Map();
    const note = (key, d) => { const h = hits.get(key) || { n: 0, d: 0 }; h.n++; h.d = Math.max(h.d, d); hits.set(key, h); };
    headG.updateWorldMatrix(true, false); const headInv = new THREE.Matrix4().copy(headG.matrixWorld).invert();
    for (const pr of probes) {
      const m = pr.m; if (!m.visible) continue; let vis = true; m.traverseAncestors((p) => { if (!p.visible) vis = false; }); if (!vis) continue;
      if (!m.geometry.boundingSphere) m.geometry.computeBoundingSphere();
      sphA.copy(m.geometry.boundingSphere).applyMatrix4(m.matrixWorld);
      const Pp = m.geometry.attributes.position, st = sampleStep(m);
      // inside the head
      // (inside the hull and more than 6 mm from any bone of the head: in the skull's cavity, an orbit or the mouth; a prop that
      //  hugs the outside of the skull where it curves in is not)
      if (!(pr.bone && m.parent === headG)) for (let i = 0; i < Pp.count; i += st) { v.fromBufferAttribute(Pp, i).applyMatrix4(m.matrixWorld); w.copy(v).applyMatrix4(headInv); const d = headDepth(w);
        if (d * 1000 > (pr.prop ? 4 : 6) && !nearHeadBone(v, 0.006)) note(`${pr.name} -> inside the head`, d * 1000); }
      // below the floor
      for (let i = 0; i < Pp.count; i += st * 3) { v.fromBufferAttribute(Pp, i).applyMatrix4(m.matrixWorld); const gy = R.ground ? R.ground(v.x, v.z) : 0; if (v.y - gy < -0.004) note(`${pr.name} -> below the floor`, (gy - v.y) * 1000); }
      // through bones
      for (const b of bones) {
        if (b === m) continue;
        if (pr.bone && (adjacent(m, b) || (girdle(m) && axial(b)) || (girdle(b) && axial(m)))) continue;
        sphB.copy(b.geometry.boundingSphere).applyMatrix4(b.matrixWorld); if (!sphA.intersectsSphere(sphB)) continue;
        const vx = V.get(b.geometry); inv.copy(b.matrixWorld).invert();
        for (let i = 0; i < Pp.count; i += st) {
          v.fromBufferAttribute(Pp, i).applyMatrix4(m.matrixWorld).applyMatrix4(inv);
          const x = Math.floor((v.x - vx.o.x) / vx.cell), y = Math.floor((v.y - vx.o.y) / vx.cell), z = Math.floor((v.z - vx.o.z) / vx.cell);
          if (x < 0 || y < 0 || z < 0 || x >= vx.nx || y >= vx.ny || z >= vx.nz) continue;
          const d = vx.D[(z * vx.ny + y) * vx.nx + x]; if (d >= 2) { const mm = depthAt(b.geometry, v.x, v.y, v.z) * 1000; if (mm >= 1.5) note(`${pr.name} -> ${b.userData.name}`, mm); }
        }
      }
    }
    // bones into props
    for (const pt of propT) {
      const pm = pt.m; if (!pm.visible) continue; let vis = true; pm.traverseAncestors((p) => { if (!p.visible) vis = false; }); if (!vis) continue;
      sphB.copy(pm.geometry.boundingSphere).applyMatrix4(pm.matrixWorld); inv.copy(pm.matrixWorld).invert(); const vx = pt.V;
      for (const lb of limbBones) {
        const m = lb.m; if (!m.visible) continue; sphA.copy(m.geometry.boundingSphere).applyMatrix4(m.matrixWorld); if (!sphA.intersectsSphere(sphB)) continue;
        const Pp = m.geometry.attributes.position, st = Math.max(1, Math.floor(sampleStep(m) / 2));
        for (let i = 0; i < Pp.count; i += st) {
          v.fromBufferAttribute(Pp, i).applyMatrix4(m.matrixWorld).applyMatrix4(inv);
          const x = Math.floor((v.x - vx.o.x) / vx.cell), y = Math.floor((v.y - vx.o.y) / vx.cell), z = Math.floor((v.z - vx.o.z) / vx.cell);
          if (x < 0 || y < 0 || z < 0 || x >= vx.nx || y >= vx.ny || z >= vx.nz) continue;
          const d = vx.D[(z * vx.ny + y) * vx.nx + x]; if (d >= 2) { const mm = depthAt(pm.geometry, v.x, v.y, v.z) * 1000; if (mm >= 1.5) note(`${lb.name} -> ${pt.name}`, mm); }
        }
      }
    }
    for (const [k, h] of hits) events.push([+t.toFixed(2), k, h.n, +h.d.toFixed(1)]);
  }
  return { events, bones: bones.length, probes: probes.length, hullFaces: planes.length, end: T1 };
}"""

async def main():
    from playwright.async_api import async_playwright
    srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(a.port), '--bind', '127.0.0.1'], cwd=HERE, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(0.8)
    try:
        async with async_playwright() as p:
            b = await p.chromium.launch(args=['--use-gl=angle', '--use-angle=gl-egl', '--ignore-gpu-blocklist'], env={**os.environ, 'LIBGL_ALWAYS_SOFTWARE': '1', 'EGL_PLATFORM': 'surfaceless'})
            pg = await b.new_page(viewport={'width': 180, 'height': 320}); logs = []
            pg.on('pageerror', lambda e: logs.append('ERR ' + str(e)))
            await pg.goto(f'http://127.0.0.1:{a.port}/film.html?f={a.film}'); await pg.wait_for_function('!!(window.HFS && window.HFS.filmReady)', timeout=180000)
            await pg.evaluate('c => window.HFS.film.init(c)', {'width': 180, 'height': 320, 'shadow': 256})
            r = await pg.evaluate(JS, [a.t0, a.t1, a.dt, a.min])
            if logs: print('LOGS', logs[:5])
            await b.close()
    finally: srv.terminate()
    ev = r['events']
    # merge into stretches per problem
    by = {}
    for t, k, n, d in ev: by.setdefault(k, []).append((t, n, d))
    rows = []
    for k, lst in by.items():
        lst.sort(); start = prev = lst[0][0]; dmax = 0; nmax = 0
        for t, n, d in lst:
            if t - prev > a.dt * 1.5:
                rows.append((start, prev, k, nmax, dmax)); start = t; dmax = 0; nmax = 0
            prev = t; dmax = max(dmax, d); nmax = max(nmax, n)
        rows.append((start, prev, k, nmax, dmax))
    rows.sort()
    print(f"{a.film}: {r['bones']} bones, {r['probes']} tested parts, head hull {r['hullFaces']} faces, 0 to {r['end']} s every {a.dt} s")
    for s, e, k, n, d in rows: print(f"  {s:6.2f}-{e:6.2f}  {k}  ({n} points, {d:.0f} mm deep)")
    print('problems:', len(rows))
    if a.json: json.dump(rows, open(a.json, 'w'))
    sys.exit(1 if rows else 0)
asyncio.run(main())

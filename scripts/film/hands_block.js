// ------------------------------------------------------------------ a wrist, and hands that can hold (from film 11, on the wrist)
const HANDBONE = /scaphoid|lunate|triquetral|pisiform|trapezium|trapezoid|capitate|hamate|metacarpal|phalanx of/i;
function makeWrist(R, Side) {
  const A = R.arms[Side], low = (m) => { const vs = worldVerts(m); let mn = 9; for (const v of vs) mn = Math.min(mn, v.y); return avgV(vs.filter((v) => v.y < mn + 0.012)); };
  const P = low(R.byName.get(`${Side} radius`)).lerp(low(R.byName.get(`${Side} ulna`)), 0.5);
  const g = new THREE.Group(); g.position.copy(P).sub(A.EL); A.elbow.add(g);
  for (const m of [...A.elbow.children]) if (m.isMesh && HANDBONE.test(m.userData.name) && m.userData.name.toLowerCase().includes(Side.toLowerCase())) { A.elbow.remove(m); m.position.copy(m.userData.home).sub(P); g.add(m); }
  return { g, P, s: Side === 'Right' ? -1 : 1 };
}
const setWrist = (Wr, p) => Wr.g.rotation.set(p.wf || 0, (p.wr || 0) * Wr.s, (p.wd || 0) * Wr.s, 'YXZ');   // roll (forearm turn), then flex, then tilt
function rigHand(R, Side, Wr) {
  const A = R.arms[Side], side = Side.toLowerCase(), eg = Wr.g, EL = Wr.P, by = (n) => R.byName.get(n);
  const top = (m) => { const vs = worldVerts(m); let mx = -9, mn = 9; for (const v of vs) { mx = Math.max(mx, v.y); mn = Math.min(mn, v.y); } return avgV(vs.filter((v) => v.y > mx - 0.12 * (mx - mn))); };
  const bot = (m) => { const vs = worldVerts(m); let mx = -9, mn = 9; for (const v of vs) { mx = Math.max(mx, v.y); mn = Math.min(mn, v.y); } return avgV(vs.filter((v) => v.y < mn + 0.12 * (mx - mn))); };
  const F = ['index', 'middle', 'ring', 'little'].map((f) => ({ P: by(`Proximal phalanx of ${side} ${f} finger`), M: by(`Middle phalanx of ${side} ${f} finger`), D: by(`Distal phalanx of ${side} ${f} finger`) }));
  const mcpI = top(F[0].P), mcpL = top(F[3].P), fdir = bot(F[1].D).sub(top(F[1].P)).normalize();
  const across = mcpL.clone().sub(mcpI); across.sub(fdir.clone().multiplyScalar(across.dot(fdir))).normalize();
  const n = new THREE.Vector3().crossVectors(fdir, across).normalize(); if (n.z < 0) n.negate();
  const axis = new THREE.Vector3().crossVectors(fdir, n).normalize();   // +angle turns each finger toward the palm (n): the way fingers close
  const joints = [];
  for (const f of F) { const pts = [top(f.P), top(f.M), top(f.D)], gs = []; let parent = eg, pp = EL;
    [f.P, f.M, f.D].forEach((m, i) => { const g = new THREE.Group(); g.position.copy(pts[i]).sub(pp); parent.add(g); m.parent.remove(m); m.position.copy(m.userData.home).sub(pts[i]); g.add(m); gs.push(g); parent = g; pp = pts[i]; }); joints.push(gs); }
  const tP = by(`Proximal phalanx of ${side} thumb`), tD = by(`Distal phalanx of ${side} thumb`), tpt = [top(tP), top(tD)];
  const ttip = bot(tD), tdir = ttip.clone().sub(tpt[0]).normalize(), aim = mcpI.clone().lerp(mcpL, 0.6).add(n.clone().multiplyScalar(0.03)).sub(ttip);
  const taxis = new THREE.Vector3().crossVectors(tdir, aim).normalize(), tg = [];
  { let parent = eg, pp = EL; [tP, tD].forEach((m, i) => { const g = new THREE.Group(); g.position.copy(tpt[i]).sub(pp); parent.add(g); m.parent.remove(m); m.position.copy(m.userData.home).sub(tpt[i]); g.add(m); tg.push(g); parent = g; pp = tpt[i]; }); }
  const mid = mcpI.clone().add(mcpL).multiplyScalar(0.5);
  const handle = mid.clone().addScaledVector(fdir, 0.03).addScaledVector(n, 0.024).sub(EL);
  // prof: how a finger shares its closing between knuckle, middle and end joint (a fist by default; a hand flat on a
  // phone's back that wraps its far edge bends mostly at the middle joints)
  const PROF = [1.25, 1.5, 0.95];
  const setF = (gs, kk, s, pr) => { gs[0].quaternion.setFromAxisAngle(axis, pr[0] * kk * s); gs[1].quaternion.setFromAxisAngle(axis, pr[1] * kk * s); gs[2].quaternion.setFromAxisAngle(axis, pr[2] * kk * s); };
  function curl(k, per = null, tk = null, prof = PROF) {   // per: each finger's own closing [index, middle, ring, little]; tk: the thumb's
    joints.forEach((gs, i) => setF(gs, per ? per[i] : k, 1 + 0.06 * i, prof));
    const t = tk ?? k; tg[0].quaternion.setFromAxisAngle(taxis, 0.55 * t); tg[1].quaternion.setFromAxisAngle(taxis, 0.7 * t);
  }
  // close each finger (and the thumb) on an object until it is `need` off it: sdf(world point) is the distance to the object
  // (+ outside). Returns { per, tk } for curl(); a finger that never meets it closes to kmax
  function fit(sdf, { need = 0.003, kmin = 0.05, kmax = 0.95, prof = PROF, tmin = kmin } = {}) {   // tmin < 0 lets the thumb stand off, away from the palm
    const v = new THREE.Vector3(), samp = (ms) => ms.map((m) => { const P = m.geometry.attributes.position, st = Math.max(1, Math.floor(P.count / 200)), pts = []; for (let i = 0; i < P.count; i += st) pts.push(new THREE.Vector3().fromBufferAttribute(P, i)); return { m, pts }; });
    const gap = (S) => { eg.updateMatrixWorld(true); let g = 9; for (const { m, pts } of S) for (const p of pts) g = Math.min(g, sdf(v.copy(p).applyMatrix4(m.matrixWorld))); return g; };
    // the first contact on the way from open to closed (a finger can pass an object's edge and curl clear of it again,
    // so the whole sweep is scanned, then the contact is found finely)
    const search = (S, set, k0 = kmin) => { set(k0); if (gap(S) < need) return k0; let lo = k0, hi = null;
      for (let j = 1; j <= 24; j++) { const k = k0 + (kmax - k0) * (j / 24); set(k); if (gap(S) < need) { hi = k; break; } lo = k; }
      if (hi === null) return kmax;
      for (let j = 0; j < 12; j++) { const m = (lo + hi) / 2; set(m); if (gap(S) >= need) lo = m; else hi = m; } set(lo); return lo; };
    const per = joints.map((gs, i) => search(samp(gs.map((g) => g.children.find((c) => c.isMesh)).filter(Boolean)), (kk) => setF(gs, kk, 1 + 0.06 * i, prof)));
    const tk = search(samp(tg.map((g) => g.children.find((c) => c.isMesh)).filter(Boolean)), (kk) => { tg[0].quaternion.setFromAxisAngle(taxis, 0.55 * kk); tg[1].quaternion.setFromAxisAngle(taxis, 0.7 * kk); }, tmin);
    return { per, tk };
  }
  const hand = new THREE.Vector3().crossVectors(fdir, across).dot(n) > 0 ? 1 : -1;   // n = hand * (fdir x across)
  return { curl, fit, handle, across: across.clone(), n: n.clone(), fdir: fdir.clone(), eg, hand };
}
function solveHand(R, Side, H, at, init, aims = [], extra = null, starts = null) {   // starts: other initial poses to try (default: a spread for a standing body)   // an arm and wrist pose that puts the hand's grip at a world point, with hand directions (local v) turned toward world ones; extra(A) adds a posture cost
  R.root.updateMatrixWorld(true);
  const A = R.arms[Side], Wr = H.wr, h = new THREE.Vector3(), q = new THREE.Quaternion(), pn = new THREE.Vector3();
  const err = (p) => { poseArm(A, p); setWrist(Wr, p); A.girdle.updateMatrixWorld(true); h.copy(H.handle).applyMatrix4(Wr.g.matrixWorld); let E = h.distanceTo(at);
    if (aims.length) { Wr.g.getWorldQuaternion(q); for (const a of aims) E += a.w * (1 - pn.copy(a.v).applyQuaternion(q).dot(a.to)); }
    if (extra) E += extra(A);
    E += 0.01 * ((p.wf || 0) ** 2 + 2 * (p.wd || 0) ** 2 + 0.5 * (p.wr || 0) ** 2); return E; };
  const descend = (start) => {
    let best = { dir: [...start.dir], twist: start.twist, elbow: start.elbow, wf: start.wf || 0, wd: start.wd || 0, wr: start.wr || 0, retract: 0, elevate: 0 }, bestE = err(best);
    for (const st of [0.25, 0.12, 0.06, 0.03, 0.015, 0.007]) for (let it = 0; it < 40; it++) {
      let improved = false;
      for (const key of ['d0', 'd1', 'd2', 'twist', 'elbow', 'wf', 'wd', 'wr']) for (const sg of [-1, 1]) {
        const c = { ...best, dir: [...best.dir] }; if (key[0] === 'd') c.dir[+key[1]] += sg * st; else c[key] += sg * st * 2; c.elbow = Math.min(2.6, Math.max(0, c.elbow)); c.wf = Math.min(1.1, Math.max(-1.1, c.wf)); c.wd = Math.min(0.4, Math.max(-0.4, c.wd)); c.wr = Math.min(2.2, Math.max(-2.2, c.wr));
        const E = err(c); if (E < bestE) { bestE = E; best = c; improved = true; }
      }
      if (!improved) break;
    }
    return { best, bestE };
  };
  let out = descend(init);
  const tries = starts || [[0.6, 0.8, 0.2], [0.35, 0.7, 0.45], [0.9, 0.35, 0.1], [0.5, 0.5, -0.3], [0.2, -0.2, 0.9]].flatMap((dir) => [-1.2, -0.4, 0.4, 1.2].flatMap((twist) => [1.3, 1.9, 2.4].map((elbow) => ({ dir, twist, elbow }))));
  for (const st of tries) { if (out.bestE < 0.004) break; const r = descend(st); if (r.bestE < out.bestE) out = r; }
  poseArm(A, out.best); setWrist(Wr, out.best); A.girdle.updateMatrixWorld(true); h.copy(H.handle).applyMatrix4(Wr.g.matrixWorld); Wr.g.getWorldQuaternion(q);
  const dbg = { pos: +h.distanceTo(at).toFixed(4), dots: aims.map((a) => +pn.copy(a.v).applyQuaternion(q).dot(a.to).toFixed(3)), at: at.toArray().map((v) => +v.toFixed(3)) };
  return { ...out.best, err: out.bestE, dbg };
}
const FIST = [1.25, 1.5, 0.95], FLAT_WRAP = [0.35, 1.6, 1.25];   // how the fingers close: a fist; flat on a phone's back, bent round its edge
// a hand closing on what it holds: each finger goes from `base` toward its fitted closing, and never further in than that fit
// while the object is there (a finger more closed than its fit would be inside the object)
function gripCurl(H, G, g, base, prof) { H.curl(0, G.per.map((k) => lerp(Math.min(base, k), k, g)), lerp(Math.min(base, G.tk), G.tk, g), prof); }
// the phone (props.js makePhone): a rounded box, its long edges rounded to half its thickness; local y = 0 is the back, Th the
// screen. Signed distance from a point in the phone's own frame (+ outside)
const PHONE = { W: 0.0716, L: 0.1476, Th: 0.0078 };
function phoneSDF(p) {
  const r = PHONE.Th / 2, qx = Math.abs(p.x) - (PHONE.W / 2 - r), qy = Math.abs(p.y - PHONE.Th / 2) - (PHONE.Th / 2 - r), qz = Math.abs(p.z) - (PHONE.L / 2 - r);
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qy, qz), 0) - r;
}
// how far a hand's bones come inside their gap round an object (sdf: world point -> distance, + outside): fingers `finger`,
// palm and wrist `palm` (the flesh that is not drawn). palmOnly skips the fingers (they are closed on the object after)
function handGap(H, sdf, { palm = 0.006, finger = 0.003, palmOnly = false } = {}) {
  if (!H._gapPts) { H._gapPts = []; H.wr.g.traverse((m) => { if (!m.isMesh) return; const P = m.geometry.attributes.position, st = Math.max(1, Math.floor(P.count / 40)), fing = /phalanx/i.test(m.userData.name);
    for (let i = 0; i < P.count; i += st) H._gapPts.push({ m, p: new THREE.Vector3().fromBufferAttribute(P, i), fing }); }); }
  const v = new THREE.Vector3(); let E = 0, worst = 0, who = '';
  for (const q of H._gapPts) { if (palmOnly && q.fing) continue; const d = (q.fing ? finger : palm) - sdf(v.copy(q.p).applyMatrix4(q.m.matrixWorld)); if (d > 0) { E += d; if (d > worst) { worst = d; who = q.m.userData.name; } } }
  return { E, worst, who };
}
// a posture cost that keeps an arm out of ellipsoids (world centre c, semi-axes r, the bone's own thickness included):
// samples the upper arm (from a quarter of the way down, the shoulder itself sits where it sits), the forearm and the hand
function keepOut(R, Side, H, zones, w = 3) {
  const A = R.arms[Side], s = new THREE.Vector3(), e = new THREE.Vector3(), wr = new THREE.Vector3(), g = new THREE.Vector3(), p = new THREE.Vector3();
  const f = (arm) => { A.arm.getWorldPosition(s); A.elbow.getWorldPosition(e); H.wr.g.getWorldPosition(wr); g.copy(H.handle).applyMatrix4(H.wr.g.matrixWorld);
    let E = 0;
    for (const [a, b, n, u0] of [[s, e, 10, 0.25], [e, wr, 10, 0], [wr, g, 4, 0]]) for (let i = 0; i <= n; i++) { p.lerpVectors(a, b, u0 + (1 - u0) * i / n);
      for (const z of zones) { const q = Math.hypot((p.x - z.c.x) / z.r.x, (p.y - z.c.y) / z.r.y, (p.z - z.c.z) / z.r.z); if (q < 1) E += w * (1 - q); } }
    return E; };
  return f;
}
const mixArm = (a, b, k) => ({ dir: a.dir.map((v, i) => lerp(v, b.dir[i], k)), twist: lerp(a.twist, b.twist, k), elbow: lerp(a.elbow, b.elbow, k), wf: lerp(a.wf || 0, b.wf || 0, k), wd: lerp(a.wd || 0, b.wd || 0, k), wr: lerp(a.wr || 0, b.wr || 0, k), retract: 0, elevate: 0, mix: [a, b, k] });


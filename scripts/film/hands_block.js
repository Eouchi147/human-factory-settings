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
  const axis = new THREE.Vector3().crossVectors(fdir, n).dot(across) > 0 ? across.clone().negate() : across.clone();
  const joints = [];
  for (const f of F) { const pts = [top(f.P), top(f.M), top(f.D)], gs = []; let parent = eg, pp = EL;
    [f.P, f.M, f.D].forEach((m, i) => { const g = new THREE.Group(); g.position.copy(pts[i]).sub(pp); parent.add(g); m.parent.remove(m); m.position.copy(m.userData.home).sub(pts[i]); g.add(m); gs.push(g); parent = g; pp = pts[i]; }); joints.push(gs); }
  const tP = by(`Proximal phalanx of ${side} thumb`), tD = by(`Distal phalanx of ${side} thumb`), tpt = [top(tP), top(tD)];
  const ttip = bot(tD), tdir = ttip.clone().sub(tpt[0]).normalize(), aim = mcpI.clone().lerp(mcpL, 0.6).add(n.clone().multiplyScalar(0.03)).sub(ttip);
  const taxis = new THREE.Vector3().crossVectors(tdir, aim).normalize(), tg = [];
  { let parent = eg, pp = EL; [tP, tD].forEach((m, i) => { const g = new THREE.Group(); g.position.copy(tpt[i]).sub(pp); parent.add(g); m.parent.remove(m); m.position.copy(m.userData.home).sub(tpt[i]); g.add(m); tg.push(g); parent = g; pp = tpt[i]; }); }
  const mid = mcpI.clone().add(mcpL).multiplyScalar(0.5);
  const handle = mid.clone().addScaledVector(fdir, 0.03).addScaledVector(n, 0.024).sub(EL);
  function curl(k) {
    joints.forEach((gs, i) => { const s = 1 + 0.06 * i; gs[0].quaternion.setFromAxisAngle(axis, 1.25 * k * s); gs[1].quaternion.setFromAxisAngle(axis, 1.5 * k * s); gs[2].quaternion.setFromAxisAngle(axis, 0.95 * k * s); });
    tg[0].quaternion.setFromAxisAngle(taxis, 0.55 * k); tg[1].quaternion.setFromAxisAngle(taxis, 0.7 * k);
  }
  const hand = new THREE.Vector3().crossVectors(fdir, across).dot(n) > 0 ? 1 : -1;   // n = hand * (fdir x across)
  return { curl, handle, across: across.clone(), n: n.clone(), fdir: fdir.clone(), eg, hand };
}
function solveHand(R, Side, H, at, init, aims = []) {   // an arm and wrist pose that puts the hand's grip at a world point, with hand directions (local v) turned toward world ones
  R.root.updateMatrixWorld(true);
  const A = R.arms[Side], Wr = H.wr, h = new THREE.Vector3(), q = new THREE.Quaternion(), pn = new THREE.Vector3();
  const err = (p) => { poseArm(A, p); setWrist(Wr, p); A.girdle.updateMatrixWorld(true); h.copy(H.handle).applyMatrix4(Wr.g.matrixWorld); let E = h.distanceTo(at);
    if (aims.length) { Wr.g.getWorldQuaternion(q); for (const a of aims) E += a.w * (1 - pn.copy(a.v).applyQuaternion(q).dot(a.to)); }
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
  for (const dir of [[0.6, 0.8, 0.2], [0.35, 0.7, 0.45], [0.9, 0.35, 0.1], [0.5, 0.5, -0.3], [0.2, -0.2, 0.9]]) for (const twist of [-1.2, -0.4, 0.4, 1.2]) for (const elbow of [1.3, 1.9, 2.4]) {
    if (out.bestE < 0.004) break; const r = descend({ dir, twist, elbow }); if (r.bestE < out.bestE) out = r; }
  poseArm(A, out.best); setWrist(Wr, out.best); A.girdle.updateMatrixWorld(true); h.copy(H.handle).applyMatrix4(Wr.g.matrixWorld); Wr.g.getWorldQuaternion(q);
  const dbg = { pos: +h.distanceTo(at).toFixed(4), dots: aims.map((a) => +pn.copy(a.v).applyQuaternion(q).dot(a.to).toFixed(3)), at: at.toArray().map((v) => +v.toFixed(3)) };
  return { ...out.best, err: out.bestE, dbg };
}
const mixArm = (a, b, k) => ({ dir: a.dir.map((v, i) => lerp(v, b.dir[i], k)), twist: lerp(a.twist, b.twist, k), elbow: lerp(a.elbow, b.elbow, k), wf: lerp(a.wf || 0, b.wf || 0, k), wd: lerp(a.wd || 0, b.wd || 0, k), wr: lerp(a.wr || 0, b.wr || 0, k), retract: 0, elevate: 0 });


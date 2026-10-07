// Human Factory Settings · Film 6 "Are barefoot shoes good for your feet?" (new direction, 6 Oct 2026) · one continuous shot, 9:16.
// A shoe box marked BAREFOOT SHOES: the lid comes off on "wearing no shoes" and it is empty (paying money to feel like you
// wear nothing). A skeleton in thin, flexible shoes stands on a walking pad; the shoes go clear: 26 bones, three arches, the
// small muscles that hold them. Eight weeks of walking (the pad counts the weeks and steps), then heel raises, barefoot, for
// free. 118 runners: the ones who skipped the exercises were 2.42 times as likely to get hurt. Toe shoes over ten weeks: an
// MRI ring runs along the foot; 10 of 19 light up. Then he walks again, in flat shoes, not running; three dials for the
// build-up (2,500, 5,000, 7,000 steps a day). The lid slams on the empty box: a doctor, not a shoe shop. The last dial
// becomes the logo.
import { THREE, ORANGE, ss, s5, lerp, clamp01, hash, camTrack, phys, glowMat, shadows, spot, RoundedBoxGeometry,
  loadAnatomy, tissueMat, V3, place, logoEnd, makeFilm, outBack, stamp, labelCanvas, stampLine, noiseTex } from '../kit.js';
import { buildRig, skeletonKind, walkAt, legIK, bendSpine, poseArm, ARM0, worldVerts, FOOT, clearArms } from '../rig.js';
import { makeLogoRing } from '../props.js';
import { skinned } from '../soft.js';

// ------------------------------------------------------------------ timing, from the voice guide (word starts)
const T = {
  end: 77.05, logo: 74.53,
  youre: 0.35, thinking: 0.79, buying: 1.45, barefoot: 1.66, shoes: 2.06, which: 2.36, paying: 3.08, money: 3.63, feel: 4.26, wearing: 5.04, no: 5.5, noshoes: 5.75,
  lets: 6.73, see: 7.25, feet: 7.66, need: 8.19,
  your: 9.64, feet2: 10.08, built: 10.48, twentysix: 10.91, bones: 11.43, each: 11.86, three: 12.09, arches: 12.54, and1: 13.2, small: 13.39, muscles: 13.82, help: 14.66, hold: 14.84, arches2: 15.96, up: 16.37,
  like: 17.25, stronger: 18.56, when1: 19.01, work: 19.99,
  when2: 21.16, runners: 21.67, walked: 22.0, flat: 22.4, eight: 23.93, weeks: 24.03, their: 24.44, foot: 24.86, forty: 26.41, stronger2: 27.43, and2: 28.17, simple: 28.46, exercises: 29.13, worked: 30.25, well: 31.31, free: 31.71,
  runners2: 32.79, did: 33.61, eight2: 34.95, kept: 35.97, even: 36.7, fewer: 37.59, injuries: 38.19, year: 39.9,
  but: 40.92, switch: 41.6, overnight: 41.88, when3: 42.82, toe: 44.44, ten: 45.29, weeks2: 45.42, more: 45.93, half: 46.75, bone: 47.38, stress: 47.77, scans: 48.8,
  plan: 50.43, walk: 52.41, flat2: 53.27, notrun: 54.62, building: 55.35, two: 56.72, five: 59.02, seven: 60.32,
  if: 61.78, painful: 62.76, numb: 64.1, injuring: 64.87, balance: 66.89, gone: 68.61, see2: 69.17, doctor: 69.69, shoe: 70.54, shop: 70.7,
  final: 72.27, factory: 73.48, settings: 73.85,
};

// ------------------------------------------------------------------ the set (metres; the skeleton faces +z; +x is its left)
const W = {}; window.HFS_W = W;
const FLOOR = 0.4;
const PAD = { w: 0.56, z0: -0.78, z1: 0.66, h: 0.105, bw: 0.46 };   // a walking pad: deck top at h, belt bw wide
const SOLE = 0.006;                                                   // the shoes' sole: 6 mm
const HZ = -0.2;                                                      // where the heels stand on the belt
const BOX = new THREE.Vector3(0.79, 0, 1.08), BOX_RY = 0.32;          // the shoe box, on the floor in front of the pad
const BF = new THREE.Vector3(Math.sin(BOX_RY), 0, Math.cos(BOX_RY));  // the box's front
const DIALS = [-0.38, 0, 0.38].map((x) => new THREE.Vector3(x, 0, 1.16));
const LOGO_R = 0.072;
const SIDES = ['Right', 'Left'];
const RELAX = 0.18;                                                   // a hand at rest, a little closed

// ------------------------------------------------------------------ small helpers
function canvasTex(w, h, draw, { srgb = true } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h, c);
  const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.userData.canvas = c; return t;
}
function txt(x, s, px, py, { font = '800 100px Archivo', color = '#fff', align = 'center', track = 0, base = 'middle', maxW = 0 } = {}) {
  x.font = font; x.letterSpacing = `${track}px`; x.fillStyle = color; x.textAlign = align; x.textBaseline = base;
  if (maxW) { const w = x.measureText(s).width; if (w > maxW) { x.save(); x.translate(px, py); x.scale(maxW / w, 1); x.fillText(s, 0, 0); x.restore(); return; } }
  x.fillText(s, px, py);
}
const avgV = (a) => a.reduce((s, v) => s.add(v), new THREE.Vector3()).multiplyScalar(1 / Math.max(1, a.length));
const sgnpow = (v, e) => Math.sign(v) * Math.pow(Math.abs(v), e);
const add = (v, x, y, z) => v.clone().add(new THREE.Vector3(x, y, z));

// ------------------------------------------------------------------ hands (with wrists; here they only hang, a little closed)
// (from hands_block.js)
// ------------------------------------------------------------------ a wrist, and hands that can hold (from film 11, on the wrist)
const HANDBONE = /scaphoid|lunate|triquetral|pisiform|trapezium|trapezoid|capitate|hamate|metacarpal|phalanx of/i;
function makeWrist(R, Side, { pronate = false } = {}) {
  const A = R.arms[Side], low = (m) => { const vs = worldVerts(m); let mn = 9; for (const v of vs) mn = Math.min(mn, v.y); return avgV(vs.filter((v) => v.y < mn + 0.012)); };
  const rad = R.byName.get(`${Side} radius`), uln = R.byName.get(`${Side} ulna`);
  const P = low(rad).lerp(low(uln), 0.5);
  // pronate: the forearm turns as a real one does. The radius, and the hand on it, turn about the line from the middle of
  // the radial head to the middle of the ulnar head; the ulna stays. setWrist's p.pro turns it (radians, + = pronation)
  let host = A.elbow, hp = A.EL, pro = null, proAxis = null;
  if (pronate) {
    const rv = worldVerts(rad), uv = worldVerts(uln); let rt = -9, ub = 9; for (const v of rv) rt = Math.max(rt, v.y); for (const v of uv) ub = Math.min(ub, v.y);
    const RH = avgV(rv.filter((v) => v.y > rt - 0.012)), UH = avgV(uv.filter((v) => v.y < ub + 0.016));
    proAxis = UH.clone().sub(RH).normalize();
    pro = new THREE.Group(); pro.position.copy(RH).sub(A.EL); A.elbow.add(pro); R.pivots.set(pro, RH.clone());
    A.elbow.remove(rad); rad.position.copy(rad.userData.home).sub(RH); pro.add(rad);
    host = pro; hp = RH;
  }
  const g = new THREE.Group(); g.position.copy(P).sub(hp); host.add(g);
  for (const m of [...A.elbow.children]) if (m.isMesh && HANDBONE.test(m.userData.name) && m.userData.name.toLowerCase().includes(Side.toLowerCase())) { A.elbow.remove(m); m.position.copy(m.userData.home).sub(P); g.add(m); }
  return { g, P, s: Side === 'Right' ? -1 : 1, pro, proAxis };
}
const setWrist = (Wr, p) => { Wr.g.rotation.set(p.wf || 0, (p.wr || 0) * Wr.s, (p.wd || 0) * Wr.s, 'YXZ'); if (Wr.pro) Wr.pro.quaternion.setFromAxisAngle(Wr.proAxis, (p.pro || 0) * Wr.s); };   // roll (forearm turn), then flex, then tilt; a pronating forearm turns too
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
const mixArm = (a, b, k) => ({ dir: a.dir.map((v, i) => lerp(v, b.dir[i], k)), twist: lerp(a.twist, b.twist, k), elbow: lerp(a.elbow, b.elbow, k), wf: lerp(a.wf || 0, b.wf || 0, k), wd: lerp(a.wd || 0, b.wd || 0, k), wr: lerp(a.wr || 0, b.wr || 0, k), pro: lerp(a.pro || 0, b.pro || 0, k), retract: 0, elevate: 0, mix: [a, b, k] });



// a shell lofted around a set of points, slice by slice along z: each slice's width and height come from the points
// in it, the slices are smoothed, and the two ends are closed with rounded caps. Regular rings, so it bends cleanly.
function loft(pts, { n = 40, seg = 36, ex = 2.6, z0, z1, smooth = 2, dil = 1, flat = -Infinity, ring, cap = [0.82, 0.5, 0], capD = [0.0035, 0.0065, 0.0085] }) {
  const za = z0 ?? Math.min(...pts.map((p) => p.z)), zb = z1 ?? Math.max(...pts.map((p) => p.z)), step = (zb - za) / (n - 1);
  const sec = [];
  for (let i = 0; i < n; i++) {
    const z = za + i * step; let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity, c = 0;
    for (const p of pts) if (Math.abs(p.z - z) <= step * 0.75 + 0.002) { c++; if (p.x < x0) x0 = p.x; if (p.x > x1) x1 = p.x; if (p.y < y0) y0 = p.y; if (p.y > y1) y1 = p.y; }
    sec.push(c ? { z, x0, x1, y0, y1 } : null);
  }
  for (let i = 0; i < n; i++) if (!sec[i]) {
    let a = i - 1; while (a >= 0 && !sec[a]) a--; let b = i + 1; while (b < n && !sec[b]) b++;
    const A = a >= 0 ? sec[a] : sec[b], B = b < n ? sec[b] : sec[a], k = a >= 0 && b < n ? (i - a) / (b - a) : 0;
    sec[i] = { z: za + i * step, x0: lerp(A.x0, B.x0, k), x1: lerp(A.x1, B.x1, k), y0: lerp(A.y0, B.y0, k), y1: lerp(A.y1, B.y1, k) };
  }
  const dl = sec.map((s, i) => { const o = { ...s }; for (let k = -dil; k <= dil; k++) { const q = sec[Math.min(n - 1, Math.max(0, i + k))]; o.x0 = Math.min(o.x0, q.x0); o.x1 = Math.max(o.x1, q.x1); o.y1 = Math.max(o.y1, q.y1); } return o; });
  const sm = dl.map((s, i) => { const o = { z: s.z, x0: 0, x1: 0, y0: 0, y1: 0 }; let c = 0;
    for (let k = -smooth; k <= smooth; k++) { const q = dl[Math.min(n - 1, Math.max(0, i + k))]; o.x0 += q.x0; o.x1 += q.x1; o.y0 += q.y0; o.y1 += q.y1; c++; }
    o.x0 /= c; o.x1 /= c; o.y0 /= c; o.y1 /= c; return o; });
  const R = sm.map((s) => ({ z: s.z, ...ring(s) })), F = R[0], L = R[R.length - 1];
  const capRing = (r, f, dz) => ({ z: r.z + dz, cx: r.cx, hw: r.hw * f, hh: r.hh * Math.pow(f, 0.6), cy: flat > -1 ? flat + (r.cy - flat) * (0.55 + 0.45 * f) : r.cy });
  const all = [...cap.map((f, k) => capRing(F, f, -capD[k])).reverse(), ...R, ...cap.map((f, k) => capRing(L, f, capD[k]))];
  const pos = new Float32Array(all.length * seg * 3), uv = new Float32Array(all.length * seg * 2); let o = 0, u = 0;
  all.forEach((r, i) => { for (let j = 0; j < seg; j++) { const a = (2 * Math.PI * j) / seg;
    pos[o++] = r.cx + r.hw * sgnpow(Math.cos(a), 2 / ex); pos[o++] = Math.max(flat, r.cy + r.hh * sgnpow(Math.sin(a), 2 / ex)); pos[o++] = r.z;
    uv[u++] = j / seg; uv[u++] = i / (all.length - 1); } });
  const idx = [];
  for (let i = 0; i < all.length - 1; i++) for (let j = 0; j < seg; j++) { const a = i * seg + j, b = i * seg + ((j + 1) % seg), c = (i + 1) * seg + ((j + 1) % seg), d = (i + 1) * seg + j; idx.push(a, b, c, a, c, d); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  return g;
}

// ------------------------------------------------------------------ the shoe box: kraft card, a lid, tissue paper, nothing else
function makeBox() {
  const g = new THREE.Group(), L = 0.34, Wd = 0.22, H = 0.12, t = 0.004;
  const kraftTex = noiseTex(61, 256, 0.86, 1.0, 3);
  const kraft = phys({ color: 0xb48a58, roughness: 0.86, roughnessMap: kraftTex, bumpMap: kraftTex, bumpScale: 0.4 });
  const inside = phys({ color: 0x9b7448, roughness: 0.9 });
  const wall = (w, h, d, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), [kraft, kraft, kraft, inside, kraft, kraft]); m.position.set(x, y, z); g.add(m); return m; };
  wall(L, t, Wd, 0, t / 2, 0);
  wall(L, H, t, 0, H / 2, Wd / 2 - t / 2); wall(L, H, t, 0, H / 2, -Wd / 2 + t / 2);
  wall(t, H, Wd, L / 2 - t / 2, H / 2, 0); wall(t, H, Wd, -L / 2 + t / 2, H / 2, 0);
  const tissue = phys({ color: 0xe6e1d8, roughness: 0.82, sheen: 0.4, sheenColor: new THREE.Color(0xffffff), side: THREE.DoubleSide });
  for (const s of [-1, 1]) {
    const geo = new THREE.PlaneGeometry(L * 0.96, Wd * 0.6, 32, 18), P = geo.attributes.position;
    for (let i = 0; i < P.count; i++) { const x = P.getX(i), y = P.getY(i); P.setZ(i, 0.006 * Math.sin(x * 61 + y * 37 + s) + 0.004 * Math.sin(x * 113 - y * 71) + 0.09 * Math.max(0, Math.abs(y) - Wd * 0.2)); }
    geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, tissue); m.rotation.x = -Math.PI / 2 + s * 0.04; m.position.set(0, t + 0.016, s * Wd * 0.17); g.add(m);
  }
  const top = canvasTex(1360, 880, (x, w, h) => {
    x.fillStyle = '#b48a58'; x.fillRect(0, 0, w, h);
    x.globalAlpha = 0.08; for (let k = 0; k < 900; k++) { x.fillStyle = k % 2 ? '#000' : '#fff'; x.fillRect(hash(k) * w, hash(k + 3.3) * h, 2, 2); } x.globalAlpha = 1;
    txt(x, 'BAREFOOT', w / 2, h * 0.42, { font: '900 210px Archivo', color: '#161412', track: 18, maxW: w * 0.84 });
    txt(x, 'SHOES', w / 2, h * 0.64, { font: '700 86px Archivo', color: '#161412', track: 42 });
    x.strokeStyle = '#161412'; x.lineWidth = 6; x.strokeRect(60, 60, w - 120, h - 120);
    txt(x, 'EU 44 · 1 PAIR', w / 2, h * 0.84, { font: '500 40px "Geist Mono"', color: '#2a2622', track: 8 });
  });
  const lidTop = phys({ map: top, roughness: 0.84, bumpMap: kraftTex, bumpScale: 0.3 });
  const lid = new THREE.Group(), lt = 0.004, LH = 0.035;
  const lm = (w, h, d, x, y, z, mats) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mats || kraft); m.position.set(x, y, z); lid.add(m); };
  lm(L + 0.01, lt, Wd + 0.01, 0, LH - lt / 2, 0, [kraft, kraft, lidTop, inside, kraft, kraft]);
  lm(L + 0.01, LH, lt, 0, LH / 2, (Wd + 0.01) / 2); lm(L + 0.01, LH, lt, 0, LH / 2, -(Wd + 0.01) / 2);
  lm(lt, LH, Wd + 0.01, (L + 0.01) / 2, LH / 2, 0); lm(lt, LH, Wd + 0.01, -(L + 0.01) / 2, LH / 2, 0);
  g.add(lid);
  shadows(g); g.traverse((o) => o.layers.enable(1));
  return { g, lid, H, LH, L, Wd, closed: new THREE.Vector3(0, H - LH + 0.003, 0), open: new THREE.Vector3(0, 0.113, -0.195), tilt: 1.27 };
}
function setLid(B, a) {   // a: 0 closed, 1 standing behind the box
  const e = s5(0.22, 1, a), p = B.closed.clone().lerp(B.open, e); p.y += 0.075 * Math.sin(Math.PI * clamp01(a * 1.05));
  B.lid.position.copy(p); B.lid.rotation.set(B.tilt * s5(0.12, 0.92, a), 0, 0);
}

// ------------------------------------------------------------------ the walking pad: a flat treadmill, a belt that runs, a small display
function makePad() {
  const g = new THREE.Group();
  const shell = phys({ color: 0x1b1d21, roughness: 0.45, metalness: 0.2, clearcoat: 0.4 });
  const len = PAD.z1 - PAD.z0, cz = (PAD.z0 + PAD.z1) / 2;
  const deck = new THREE.Mesh(new RoundedBoxGeometry(PAD.w, PAD.h, len, 4, 0.02), shell); deck.position.set(0, PAD.h / 2, cz); g.add(deck);
  const beltTex = canvasTex(256, 1024, (x, w, h) => { x.fillStyle = '#26282d'; x.fillRect(0, 0, w, h); for (let k = 0; k < 64; k++) { x.fillStyle = k % 2 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.12)'; x.fillRect(0, k * 16, w, 8); } x.globalAlpha = 0.25; for (let k = 0; k < 2400; k++) { x.fillStyle = hash(k) > 0.5 ? '#000' : '#4a4d55'; x.fillRect(hash(k * 1.3) * w, hash(k * 2.7) * h, 2, 2); } }, { srgb: true });
  beltTex.wrapS = beltTex.wrapT = THREE.RepeatWrapping; beltTex.repeat.set(1, 2.2);
  const belt = new THREE.Mesh(new THREE.PlaneGeometry(PAD.bw, len - 0.12), phys({ map: beltTex, roughness: 0.92, color: 0xffffff }));
  belt.rotation.x = -Math.PI / 2; belt.position.set(0, PAD.h + 0.0008, cz - 0.03); g.add(belt);
  const hood = new THREE.Mesh(new RoundedBoxGeometry(PAD.w, PAD.h + 0.03, 0.14, 4, 0.02), shell); hood.position.set(0, (PAD.h + 0.03) / 2, PAD.z1 - 0.07); g.add(hood);
  const c = document.createElement('canvas'); c.width = 640; c.height = 200;
  const dtex = new THREE.CanvasTexture(c); dtex.colorSpace = THREE.SRGBColorSpace; dtex.anisotropy = 8;
  const disp = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.0625), new THREE.MeshBasicMaterial({ map: dtex, toneMapped: false }));
  disp.rotation.x = -Math.PI / 2 + 0.25; disp.position.set(0, PAD.h + 0.0395, PAD.z1 - 0.07); g.add(disp);
  shadows(g); disp.castShadow = false; belt.castShadow = false; g.traverse((o) => o.layers.enable(1));
  return { g, beltTex, c, dtex, disp, deck, key: '' };
}
function drawPad(P, l1, l2, glow) {
  const key = l1 + '|' + l2 + '|' + glow.toFixed(2); if (key === P.key) return; P.key = key;
  const x = P.c.getContext('2d'), w = P.c.width, h = P.c.height;
  x.fillStyle = '#060708'; x.fillRect(0, 0, w, h);
  if (glow > 0.001) {
    x.globalAlpha = glow; x.shadowColor = '#5fd3ff'; x.shadowBlur = 16;
    txt(x, l1, 40, 62, { font: '600 76px "Geist Mono"', color: '#a6eaff', align: 'left', track: 6 });
    txt(x, l2, w - 40, 148, { font: '600 64px "Geist Mono"', color: '#a6eaff', align: 'right', track: 4, maxW: w - 80 });
    x.shadowBlur = 0; x.globalAlpha = 1;
  }
  P.dtex.needsUpdate = true;
}

// ------------------------------------------------------------------ dials (as in films 4 and 5)
function buildDials(scene) {
  const out = [];
  const alu = phys({ color: 0xcdcac4, metalness: 1, roughness: 0.3, clearcoat: 0.4, clearcoatRoughness: 0.3 }), dark = phys({ color: 0x141518, roughness: 0.4, clearcoat: 0.6 });
  for (let i = 0; i < 3; i++) {
    const g = new THREE.Group(), knob = new THREE.Group(); g.add(knob);
    const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.004, 96), dark); plate.position.y = 0.002; g.add(plate);
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.092, 0.097, 0.06, 128), alu); body.position.y = 0.034; knob.add(body);
    const face = new THREE.Mesh(new THREE.CylinderGeometry(0.086, 0.086, 0.002, 128), phys({ color: 0x9a9893, metalness: 1, roughness: 0.38, clearcoat: 0.5, clearcoatRoughness: 0.3 })); face.position.y = 0.065; knob.add(face);
    const ind = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.002, 0.05), glowMat(ORANGE)); ind.position.set(0, 0.0665, -0.05); knob.add(ind);
    const tickMat = new THREE.MeshBasicMaterial({ color: 0x8a8d93 });
    for (let k = 0; k <= 20; k++) { const a = -Math.PI * 0.75 + (k / 20) * Math.PI * 1.5, big = k % 5 === 0, len = big ? 0.022 : 0.012; const tk = new THREE.Mesh(new THREE.BoxGeometry(big ? 0.003 : 0.002, 0.001, len), tickMat); const r = 0.112 + len / 2; tk.position.set(Math.sin(a) * r, 0.0045, -Math.cos(a) * r); tk.rotation.y = -a; g.add(tk); }
    const setMat = glowMat(ORANGE); setMat.transparent = true; setMat.opacity = 0; const set = new THREE.Mesh(new THREE.BoxGeometry(0.005, 0.0015, 0.03), setMat); g.add(set);
    shadows(g); g.traverse((o) => o.layers.enable(1)); scene.add(g);
    out.push({ g, knob, set, setMat, face, ind, angle: (v) => -Math.PI * 0.75 + v * Math.PI * 1.5 });
  }
  return out;
}

// ------------------------------------------------------------------ the toes: the rig's own toe joint (at the ball, about the slanted line
// of the joints); legIK bends it just enough to keep every toe on the ground (R.ground), so the toes stay flat as a heel lifts
function toeJoint(R, Side) {
  const G = R.legs[Side], ph = [];
  G.toe.traverse((o) => { if (o.isMesh) ph.push(o); });
  return { toes: G.toe, pivot: R.pivots.get(G.toe).clone(), n: ph.length, ph };
}

// ------------------------------------------------------------------ the shoes, lofted around each foot's own bones (world rest frame), skinned to foot and toes
function footPts(R, Side, { phalanges = true, legLow = true } = {}) {
  const G = R.legs[Side], out = [];
  G.ankle.traverse((o) => { if (o.isMesh && FOOT.test(o.userData.name || '') && !/sesamoid/i.test(o.userData.name) && (phalanges || !/phalanx/i.test(o.userData.name))) out.push(...worldVerts(o, 2)); });
  if (legLow) for (const n of [`${Side} tibia`, `${Side} fibula`]) { const m = R.byName.get(n); if (m) out.push(...worldVerts(m, 3).filter((p) => p.y < G.ground + 0.075)); }
  return out;
}
function makeShoe(R, Side, mats) {
  const G = R.legs[Side], Tz = W.toes[Side].pivot.z, gr = G.ground;
  const pts = footPts(R, Side), bones = footPts(R, Side, { legLow: false });
  const z0 = Math.min(...bones.map((p) => p.z)) - 0.002, z1 = Math.max(...bones.map((p) => p.z)) + 0.003;
  const upperG = loft(pts.filter((p) => p.z >= z0 - 0.01), { n: 44, seg: 40, ex: 2.4, z0, z1, flat: gr, smooth: 2,
    ring: (s) => { const y = s.y1 + 0.0065, top = lerp(Math.min(gr + 0.064, y), y, ss(G.A.z - 0.004, G.A.z + 0.03, s.z)), hh = (top - gr) * 0.72; return { cx: (s.x0 + s.x1) / 2, hw: (s.x1 - s.x0) / 2 + 0.0055, cy: top - hh, hh }; } });
  const low = bones.filter((p) => p.y < gr + 0.022);
  const soleG = loft(low, { n: 44, seg: 28, ex: 7, z0: z0 - 0.003, z1: z1 + 0.003, smooth: 3, cap: [0.9, 0.6, 0], capD: [0.002, 0.004, 0.005],
    ring: (s) => ({ cx: (s.x0 + s.x1) / 2, hw: (s.x1 - s.x0) / 2 + 0.006, cy: gr - SOLE / 2 + 0.0004, hh: SOLE / 2 }) });
  const bind = (p) => [G.ankle, W.toes[Side].toes, ss(Tz - 0.012, Tz + 0.012, p.z)];
  const upper = skinned(upperG, bind, R, mats.upper), sole = skinned(soleG, bind, R, mats.sole);
  for (const sk of [upper, sole]) { sk.mesh.castShadow = true; sk.mesh.receiveShadow = true; sk.mesh.layers.enable(1); sk.mesh.visible = false; }
  upper.mesh.renderOrder = 3; return { upper, sole, parts: [upper, sole] };
}
function makeToeShoe(R, Side, mats) {
  const G = R.legs[Side], gr = G.ground, TW = W.toes[Side];
  const body = footPts(R, Side, { phalanges: false });
  const bones = footPts(R, Side, { phalanges: false, legLow: false });
  const z0 = Math.min(...bones.map((p) => p.z)) - 0.002, z1 = Math.max(...bones.map((p) => p.z)) + 0.002;
  const bodyG = loft(body.filter((p) => p.z >= z0 - 0.01), { n: 36, seg: 40, ex: 2.4, z0, z1, flat: gr, smooth: 2,
    ring: (s) => { const y = s.y1 + 0.006, top = lerp(Math.min(gr + 0.062, y), y, ss(G.A.z - 0.004, G.A.z + 0.03, s.z)), hh = (top - gr) * 0.72; return { cx: (s.x0 + s.x1) / 2, hw: (s.x1 - s.x0) / 2 + 0.005, cy: top - hh, hh }; } });
  const parts = [skinned(bodyG, () => [G.ankle, G.ankle, 0], R, mats.upper)];
  for (const k of ['big', 'second', 'third', 'fourth', 'little']) {
    const ph = TW.ph.filter((m) => new RegExp(`\\b${k} toe`, 'i').test(m.userData.name)), P = ph.flatMap((m) => worldVerts(m, 1));
    if (!P.length) continue;
    const a = Math.min(...P.map((p) => p.z)), b = Math.max(...P.map((p) => p.z));
    const g = loft(P, { n: 14, seg: 22, ex: 2.1, z0: a - 0.006, z1: b + 0.001, flat: gr, smooth: 1, cap: [0.85, 0.55, 0], capD: [0.002, 0.004, 0.005],
      ring: (s) => { const top = s.y1 + 0.0042, hh = (top - gr) * 0.7; return { cx: (s.x0 + s.x1) / 2, hw: Math.max(0.0055, (s.x1 - s.x0) / 2 + 0.0038), cy: top - hh, hh }; } });
    parts.push(skinned(g, () => [TW.toes, TW.toes, 0], R, mats.upper));
  }
  const allB = footPts(R, Side, { legLow: false }), low = allB.filter((p) => p.y < gr + 0.022);
  const za = Math.min(...allB.map((p) => p.z)) - 0.004, zb = Math.max(...allB.map((p) => p.z)) + 0.004;
  parts.push(skinned(loft(low, { n: 44, seg: 28, ex: 7, z0: za, z1: zb, smooth: 3, cap: [0.9, 0.6, 0], capD: [0.002, 0.004, 0.005],
    ring: (s) => ({ cx: (s.x0 + s.x1) / 2, hw: (s.x1 - s.x0) / 2 + 0.005, cy: gr - SOLE / 2 + 0.0004, hh: SOLE / 2 }) }), () => [G.ankle, G.ankle, 0], R, mats.sole));
  for (const sk of parts) { sk.mesh.castShadow = true; sk.mesh.receiveShadow = true; sk.mesh.layers.enable(1); sk.mesh.visible = false; sk.mesh.renderOrder = 3; }
  return { parts };
}

// ------------------------------------------------------------------ the arches of the right foot: three arcs of light under the bones
function archCurves(R, Side) {
  const by = (n) => R.byName.get(n), G = R.legs[Side], s = Side.toLowerCase(), gr = G.ground;
  const vs = (n) => worldVerts(by(n));
  const lowFront = (n) => { const v = vs(n); const zmax = Math.max(...v.map((p) => p.z)); const f = v.filter((p) => p.z > zmax - 0.012); return avgV(f.map((p) => p.clone())).setY(Math.min(...f.map((p) => p.y))); };
  const lowBack = (n) => { const v = vs(n); const zmin = Math.min(...v.map((p) => p.z)); const f = v.filter((p) => p.z < zmin + 0.012); return avgV(f.map((p) => p.clone())).setY(Math.min(...f.map((p) => p.y))); };
  const bottomY = (n) => Math.min(...vs(n).map((p) => p.y));
  const med = Side === 'Right' ? 1 : -1;   // the medial side of the right foot is +x
  const heel = G.heel.clone(); heel.y = gr + 0.002; heel.z += 0.018;
  const mt1 = lowFront(`${Side} first metatarsal bone`), mt5 = lowFront(`${Side} fifth metatarsal bone`);
  const navY = bottomY(`Navicular bone of ${s} foot`), cubY = bottomY(`${Side} cuboid bone`);
  const arc = (a, b, apexY, xa, xb) => { const c = (apexY - (a.y + b.y) / 2) / 0.75;
    return new THREE.CubicBezierCurve3(a, new THREE.Vector3(xa, a.y + c, lerp(a.z, b.z, 0.3)), new THREE.Vector3(xb, b.y + c, lerp(a.z, b.z, 0.68)), b); };
  const m0 = add(heel, 0.012 * med, 0, 0), m1 = add(mt1, 0.004 * med, 0.001, 0);
  const l0 = add(heel, -0.014 * med, 0, 0), l1 = add(mt5, -0.003 * med, 0.001, 0);
  const b1 = lowBack(`${Side} first metatarsal bone`), b5 = lowBack(`${Side} fifth metatarsal bone`), b2 = lowBack(`${Side} second metatarsal bone`);
  const t0 = add(b1, 0.004 * med, -0.002, 0.004), t1 = add(b5, -0.004 * med, -0.002, 0.004);
  const across = new THREE.CubicBezierCurve3(t0, new THREE.Vector3(lerp(t0.x, t1.x, 0.3), b2.y + 0.002, lerp(t0.z, t1.z, 0.3) + 0.003), new THREE.Vector3(lerp(t0.x, t1.x, 0.7), b2.y + 0.0, lerp(t0.z, t1.z, 0.7) + 0.003), t1);
  return {
    medial: arc(m0, m1, navY - 0.002, lerp(m0.x, m1.x, 0.3) + 0.004 * med, lerp(m0.x, m1.x, 0.7) + 0.004 * med),
    lateral: arc(l0, l1, cubY - 0.001, lerp(l0.x, l1.x, 0.3) - 0.004 * med, lerp(l0.x, l1.x, 0.7) - 0.004 * med),
    across,
  };
}
function lineMesh(curve, A, r) {
  const pts = curve.getPoints(80).map((p) => p.sub(A));
  const mat = new THREE.ShaderMaterial({
    uniforms: { uDraw: { value: 0 }, uC: { value: new THREE.Color(0xeceef1).multiplyScalar(1.6) }, uO: { value: 1 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'uniform float uDraw, uO; uniform vec3 uC; varying vec2 vUv; void main(){ if (vUv.x > uDraw) discard; float e = smoothstep(0.0, 0.04, vUv.x) * smoothstep(0.0, 0.04, uDraw - vUv.x + 0.02); gl_FragColor = vec4(uC, uO * (0.35 + 0.65 * e)); }',
    transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending,
  });
  const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 96, r, 8, false), mat); m.renderOrder = 8; m.userData.mid = pts[40].clone(); return m;
}

// ------------------------------------------------------------------ the body: standing on the belt, walking on it (twice), heel raises
const STRIDE = 1.08;
// two walks: eight weeks in flat shoes, and later "walk, not run", slower
const WALKS = [{ t0: 20.7, t1: 27.6, v: 1.12 }, { t0: 50.7, t1: 54.9, v: 0.95 }], RAMP = 0.9;
function walkDist(Wk, t) { const D = Wk.v * (Wk.t1 - Wk.t0 - RAMP); if (t <= Wk.t0) return 0; if (t >= Wk.t1) return D; const u = t - Wk.t0, TT = Wk.t1 - Wk.t0;
  if (u < RAMP) return (Wk.v * u * u) / (2 * RAMP); if (u > TT - RAMP) { const r = TT - u; return D - (Wk.v * r * r) / (2 * RAMP); } return Wk.v * (u - RAMP / 2); }
const walkS = (t) => WALKS.reduce((a, Wk) => a + walkDist(Wk, t), 0);   // distance walked on the belt (the belt runs under the feet)
const walkOf = (t) => WALKS.find((Wk) => t > Wk.t0 - 0.05 && t < Wk.t1 + 0.8);
const soleOn = (t) => Math.max(1 - ss(27.85, 28.45, t), ss(50.15, 50.75, t));          // the shoes go for the exercises, come back for the second walk
const toeOn = (t) => ss(T.toe - 0.15, T.toe + 0.3, t) * (1 - ss(49.9, 50.5, t));         // the toe shoes, for the ten weeks
const groundAt = (t) => PAD.h + SOLE * Math.max(soleOn(t), toeOn(t));
const REPS = [28.55, 30.05, 31.55];
function riseAt(t) {   // heel raises, barefoot: up, a hold, down
  for (const r0 of REPS) { const u = t - r0; if (u < 0 || u > 1.6) continue; if (u < 0.55) return s5(0, 0.55, u); if (u < 0.85) return 1; return 1 - s5(0.85, 1.6, u); }
  return 0;
}
function standPose(t, rise) {
  const R = W.rig, out = { feet: {} }, g = groundAt(t), ang = 0.42 * rise;
  out.pelvis = new THREE.Vector3(R.P0.x, R.P0.y - 0.004 + g - W.groundRest, HZ + (R.P0.z - R.legs.Right.heel.z));
  out.pelvisRot = new THREE.Euler(0, 0, 0);
  for (const Side of SIDES) {
    const G = R.legs[Side], q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), ang);
    const ballW = new THREE.Vector3(G.ball.x, g, HZ + (G.ball.z - G.heel.z));
    const restBall = G.ball.clone(); restBall.y = G.ground;
    const ankle = G.A.clone().sub(restBall).applyQuaternion(q).add(ballW);
    out.feet[Side] = { ankle, q };
    out.pelvis.y += 0.5 * (ankle.y - (G.A.y - G.ground + g));
  }
  out.armR = ARM0; out.armL = ARM0; out.twist = 0;
  return out;
}
function bodyAt(t) {
  const R = W.rig, s = walkS(t), g = groundAt(t);
  const st = standPose(t, riseAt(t)), Wk = walkOf(t);
  if (!Wk) return st;
  const w = walkAt(R, s + 0.25 * STRIDE, { stride: STRIDE, ground: () => g, slope: () => 0, z0: 0, drop: 0.065 });   // hips a little lower than the default: the leading knee never locks straight at heel strike (it snapped)
  const shift = -(s + 0.25 * STRIDE) + (HZ - R.legs.Right.heel.z + 0.05);   // keep the walker in place on the belt, 5 cm ahead of where he stands
  w.pelvis.z += shift; for (const Side of SIDES) w.feet[Side].ankle.z += shift;
  const k = 1 - ss(Wk.t0 - 0.05, Wk.t0 + 0.7, t) * (1 - ss(Wk.t1 - 0.75, Wk.t1 + 0.05, t));   // 1 = standing
  if (k > 0) {
    w.pelvis.lerp(st.pelvis, k); w.pelvisRot.set(lerp(w.pelvisRot.x, 0, k), lerp(w.pelvisRot.y, 0, k), lerp(w.pelvisRot.z, 0, k));
    for (const Side of SIDES) { const a = w.feet[Side], b = st.feet[Side], lift = a.stance ? 0 : 0.03 * Math.sin(Math.PI * k); a.ankle.lerp(b.ankle, k); a.ankle.y += lift; a.q.slerp(b.q, k); }
    const mix = (x, y) => ({ dir: x.dir.map((v, i) => lerp(v, y.dir[i], k)), twist: lerp(x.twist || 0, 0, k), elbow: lerp(x.elbow, y.elbow, k), retract: 0, elevate: 0 });
    w.armR = mix(w.armR, ARM0); w.armL = mix(w.armL, ARM0); w.twist *= 1 - k;
  }
  return w;
}
function applyBody(t) {
  const R = W.rig, b = bodyAt(t), g = groundAt(t);
  R.ground = () => g;                         // the toes stay on the belt (or the shoe's sole), never in it
  R.pelvis.position.copy(b.pelvis); R.pelvis.rotation.copy(b.pelvisRot);
  bendSpine(R.seg, { tho: 0.04, cer: 0.02, twist: b.twist || 0 });
  poseArm(R.arms.Right, b.armR); poseArm(R.arms.Left, b.armL);
  for (const Side of SIDES) { setWrist(W.hand[Side].wr, {}); W.hand[Side].curl(RELAX); }
  for (const Side of SIDES) legIK(R, Side, b.feet[Side].ankle, b.feet[Side].q);
  clearArms(R);   // no arm through the trunk or the thighs, in any pose or between poses
  R.root.updateMatrixWorld(true);
  return b;
}

// ------------------------------------------------------------------ build
async function build(S, cfg) {
  const scene = S.scene;
  S.fog.near = 4; S.fog.far = 14;
  S.table.scale.set(3, 3, 1); S.tableMat.clearcoat = 0.06; S.tableMat.specularIntensity = 0.3;
  for (const m of [S.tableMat.map, S.tableMat.roughnessMap]) if (m) { m.wrapS = m.wrapT = THREE.RepeatWrapping; m.repeat.multiplyScalar(3); }
  // ---- the skeleton, with hands that hang a little closed
  const meshes = await loadAnatomy(skeletonKind());
  W.rig = buildRig(meshes); scene.add(W.rig.root);
  for (const m of meshes) { m.castShadow = true; m.receiveShadow = true; m.layers.enable(1); }
  const R = W.rig;
  W.groundRest = Math.min(R.legs.Right.ground, R.legs.Left.ground);
  W.hand = {}; for (const Side of SIDES) { const Wr = makeWrist(R, Side); W.hand[Side] = rigHand(R, Side, Wr); W.hand[Side].wr = Wr; }
  W.toes = { Right: toeJoint(R, 'Right'), Left: toeJoint(R, 'Left') };
  // the right foot's 26 bones, in the order they light up (heel to toes)
  const order = ['calcaneus', 'talus', 'navicular', 'cuboid', 'medial cuneiform', 'intermediate cuneiform', 'lateral cuneiform', 'first metatarsal', 'second metatarsal', 'third metatarsal', 'fourth metatarsal', 'fifth metatarsal'];
  const rf = meshes.filter((m) => /\bright\b/i.test(m.userData.name) && FOOT.test(m.userData.name) && !/sesamoid/i.test(m.userData.name));
  const rank = (n) => { n = n.toLowerCase(); const i = order.findIndex((k) => n.includes(k)); if (i >= 0) return i; const toe = ['big', 'second', 'third', 'fourth', 'little'].findIndex((k) => n.includes(k + ' toe')); const seg = n.startsWith('proximal') ? 0 : n.startsWith('middle') ? 1 : 2; return 12 + seg * 5 + toe; };
  W.rightFoot = rf.sort((a, b) => rank(a.userData.name) - rank(b.userData.name));
  for (const m of W.rightFoot) m.material.emissive.set(0xfff1dc);
  // ---- the factory stamp: along the top of the right first metatarsal
  { const mt = R.byName.get('Right first metatarsal bone');
    W.stampSpot = stampLine(mt, { a: [0.0, 0.2, -0.024], b: [0.0, 0.2, 0.02], dir: [0, -1, 0], top: [1, 0, 0] });
    if (W.stampSpot) W.stamp = stamp(mt, { canvas: labelCanvas('HUMAN FACTORY SETTINGS'), center: W.stampSpot.center, normal: W.stampSpot.normal, up: W.stampSpot.up, width: 0.046, depth: 0.02, opacity: 0.62 }); }
  // ---- the small muscles of the feet: they ride the foot, and the toe muscles bend with the toes
  const FM = /(abductor hallucis|flexor digitorum brevis|abductor digiti minimi of|flexor digiti minimi brevis of|opponens digiti minimi of|flexor hallucis brevis|adductor hallucis|lumbrical of|plantar interosseous of|extensor hallucis brevis)/i;
  const fm = await loadAnatomy((p) => (FM.test(p.name) && /\bfoot\b|hallucis/i.test(p.name) && /\b(right|left)\b/i.test(p.name) && !/longus/i.test(p.name) ? 'muscle' : null));
  W.footMat = tissueMat('muscle', { transparent: true, opacity: 0 }); W.footMat.emissive.set(0xe02a20); W.footSkins = [];   // a working muscle glows red (orange is kept for the settings)
  for (const m of fm) {
    const Side = /\bright\b/i.test(m.userData.name) ? 'Right' : 'Left', G = R.legs[Side], Tz = W.toes[Side].pivot.z;
    const bind = (p) => [G.ankle, W.toes[Side].toes, ss(Tz - 0.012, Tz + 0.012, p.z)];
    const g = new THREE.BufferGeometry(), h = m.userData.home, P = m.geometry.attributes.position, N = m.geometry.attributes.normal, pp = new Float32Array(P.count * 3), nn = new Float32Array(P.count * 3);
    for (let i = 0; i < P.count; i++) { pp[i * 3] = P.getX(i) + h.x; pp[i * 3 + 1] = P.getY(i) + h.y; pp[i * 3 + 2] = P.getZ(i) + h.z; nn[i * 3] = N.getX(i); nn[i * 3 + 1] = N.getY(i); nn[i * 3 + 2] = N.getZ(i); }
    g.setAttribute('position', new THREE.BufferAttribute(pp, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nn, 3)); g.setIndex(m.geometry.index.clone());
    const sk = skinned(g, bind, R, W.footMat); sk.mesh.castShadow = true; sk.mesh.receiveShadow = true; sk.mesh.visible = false; sk.mesh.renderOrder = 2; scene.add(sk.mesh); W.footSkins.push(sk);
  }
  // ---- the shoes: a 6 mm sole and a knit upper you can see through when it matters; then toe shoes
  { const fab = noiseTex(71, 256, 0.72, 1.0, 14); fab.repeat.set(5, 9);
    W.upperMat = phys({ color: 0x323946, roughness: 0.82, roughnessMap: fab, bumpMap: fab, bumpScale: 0.6, sheen: 0.6, sheenColor: new THREE.Color(0x9aa6b8), sheenRoughness: 0.5, transparent: false, opacity: 1 });
    W.soleMat = phys({ color: 0xbdb5a8, roughness: 0.7, clearcoat: 0.2, transparent: false, opacity: 1 });
    W.shoes = {}; for (const Side of SIDES) W.shoes[Side] = makeShoe(R, Side, { upper: W.upperMat, sole: W.soleMat });
    W.toeMat = phys({ color: 0x4d545e, roughness: 0.78, roughnessMap: fab, bumpMap: fab, bumpScale: 0.5, sheen: 0.5, sheenColor: new THREE.Color(0x7d8899), sheenRoughness: 0.5, transparent: true, opacity: 0 });
    W.toeSoleMat = phys({ color: 0x141518, roughness: 0.6, transparent: true, opacity: 0 });
    W.toeShoes = {}; for (const Side of SIDES) W.toeShoes[Side] = makeToeShoe(R, Side, { upper: W.toeMat, sole: W.toeSoleMat });
    W.skins = [...SIDES.flatMap((s) => W.shoes[s].parts), ...SIDES.flatMap((s) => W.toeShoes[s].parts)];
    for (const sk of W.skins) scene.add(sk.mesh); }
  // ---- the arches (right foot), riding the foot
  { const c = archCurves(R, 'Right'), A = R.legs.Right.A;
    W.arches = [lineMesh(c.medial, A, 0.0017), lineMesh(c.lateral, A, 0.0014), lineMesh(c.across, A, 0.0015)];
    W.arches[1].material.uniforms.uC.value.multiplyScalar(0.55); W.arches[2].material.uniforms.uC.value.multiplyScalar(0.85);
    for (const m of W.arches) { m.visible = false; R.legs.Right.ankle.add(m); } }
  // ---- the scan: an ellipse of light, and a faint slice inside it, that runs along the right foot
  { const G = R.legs.Right, cx = (G.heel.x + G.ball.x) / 2 + 0.012, cy = G.ground + 0.036;
    const e = new THREE.EllipseCurve(0, 0, 0.074, 0.054, 0, Math.PI * 2, false, 0).getPoints(160).slice(0, -1).map((p) => new THREE.Vector3(p.x, p.y, 0));
    const rm = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xbfd6ff).multiplyScalar(1.7), transparent: true, opacity: 0, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, fog: false });
    const sm = new THREE.MeshBasicMaterial({ color: new THREE.Color(0x9fc0ff), transparent: true, opacity: 0, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false });
    W.scan = new THREE.Group(); W.scan.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(e, true), 160, 0.0011, 6, true), rm));
    W.scan.add(new THREE.Mesh(new THREE.ShapeGeometry(new THREE.Shape(e.map((p) => new THREE.Vector2(p.x, p.y))), 1), sm));
    W.scan.children.forEach((m) => { m.renderOrder = 9; });
    W.scan.visible = false; W.scanMat = rm; W.sliceMat = sm; W.scanC = new THREE.Vector3(cx, cy, 0); R.legs.Right.ankle.add(W.scan); }
  // ---- the set: the pad, the box, the dials
  W.pad = makePad(); scene.add(W.pad.g);
  W.auditSolids = [['walking pad', W.pad.deck, { floor: false }]];   // the deck is what he stands on: tested for feet going into it, not against itself as a floor
  W.box = makeBox(); W.box.g.position.copy(BOX); W.box.g.rotation.y = BOX_RY; scene.add(W.box.g); setLid(W.box, 0);
  W.dials = buildDials(scene); W.dials.forEach((d, i) => d.g.position.copy(DIALS[i]));
  W.logoRing = makeLogoRing(LOGO_R); W.logoRing.g.rotation.x = -Math.PI / 2; W.logoRing.g.position.y = 0.0665 + 0.0012; W.dials[2].g.add(W.logoRing.g);
  // ---- points of light: 118 runners (57 trained, 61 not), then 19 runners in toe shoes
  W.dots = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 14, 10), new THREE.MeshBasicMaterial({ color: 0xffffff }), 118 + 19);
  W.dots.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array((118 + 19) * 3), 3); W.dots.visible = false; W.dots.frustumCulled = false; scene.add(W.dots);
  // ---- light
  W.key = spot(scene, { color: 0xffe9d2, pos: new THREE.Vector3(-1.2, 3.0, 1.9), target: new THREE.Vector3(0.1, 0.6, 0.1), angle: 0.5, penumbra: 0.85, shadow: true, size: cfg.shadow ?? 1024 });
  W.key.shadow.camera.far = 7;
  W.rim = spot(scene, { color: 0xa9c4ff, pos: new THREE.Vector3(1.5, 2.2, -1.9), target: new THREE.Vector3(0, 0.8, 0), angle: 0.6, penumbra: 0.9 });
  W.fill = spot(scene, { color: 0xc8d6ff, pos: new THREE.Vector3(-1.9, 0.7, 1.9), target: new THREE.Vector3(0, 0.3, 0), angle: 0.7, penumbra: 1 });
  W.footLight = spot(scene, { color: 0xfff1e2, pos: new THREE.Vector3(0.1, 0.95, 1.05), target: new THREE.Vector3(-0.02, 0.12, HZ + 0.1), angle: 0.3, penumbra: 0.8 });
  W.boxLight = spot(scene, { color: 0xfff1d8, pos: new THREE.Vector3(BOX.x + 0.12, 1.45, BOX.z + 0.5), target: BOX.clone(), angle: 0.24, penumbra: 0.55 });
  W.dialLight = spot(scene, { color: 0xffe9d2, pos: new THREE.Vector3(0.2, 1.8, 2.2), target: new THREE.Vector3(0, 0, 1.1), angle: 0.5, penumbra: 0.8 });
  W.dotLight = spot(scene, { color: 0xd8e2ff, pos: new THREE.Vector3(-0.9, 1.9, 1.6), target: new THREE.Vector3(-0.51, 1.0, -0.1), angle: 0.45, penumbra: 0.9 });
  W.timing = { lid: [4.85, 5.95], walks: WALKS, shoesOff: 27.85, shoesOn: 50.15, reps: REPS, toe: [T.toe - 0.15, 49.9], scan: T.stress, slam: T.shop };
  return { stamp: W.stampSpot, toes: [W.toes.Right.n, W.toes.Left.n], muscles: fm.length, rightFoot: W.rightFoot.length, skins: W.skins.length };
}

// ------------------------------------------------------------------ the pad's display: the trial's weeks and steps, then "walk, not run"
function padText(t) {
  if (t > 20.4 && t < 28.0) { const u = clamp01((t - 21.0) / (27.0 - 21.0)), wk = 1 + Math.min(7, Math.floor(u * 8)); const steps = wk <= 2 ? '2,500' : wk <= 4 ? '5,000' : '7,000'; return [`WEEK ${wk}`, `${steps} STEPS`, 1]; }
  if (t > 50.5 && t < 55.4) return ['WALKING', 'NOT RUNNING', ss(50.5, 50.8, t) * (1 - ss(55.0, 55.4, t))];
  return ['', '', 0];
}

// ------------------------------------------------------------------ the camera: one path, no cuts
let CAM = null;
function buildCam() {
  const b = (f, y, dx = 0, dz = 0) => V3(BOX.x + BF.x * f + dx, y, BOX.z + BF.z * f + dz), bl = V3(BOX.x, 0.04, BOX.z);
  const D = (i, dx, y, dz) => V3(DIALS[i].x + dx, y, DIALS[i].z + dz);
  return camTrack([
    { t: -3.0, p: b(1.0, 1.08), l: bl, fov: 30 },
    { t: 0.0, p: b(0.95, 1.02), l: bl, fov: 30 },                                                     // the box, under its light
    { t: 3.4, p: b(0.88, 0.99), l: bl, fov: 30 },
    { t: 5.2, p: b(0.8, 1.02), l: V3(BOX.x - BF.x * 0.09, 0.19, BOX.z - BF.z * 0.09), fov: 30, tens: 0.5 },   // the lid comes off and stands behind: nothing inside
    { t: 6.1, p: b(0.79, 1.02, -0.01, 0.0), l: V3(BOX.x - BF.x * 0.09 - 0.01, 0.19, BOX.z - BF.z * 0.09), fov: 30, tens: 0.4 },
    { t: 7.4, p: V3(0.42, 0.4, 0.92), l: V3(0.0, 0.16, -0.1), fov: 30 },                              // up and over to the feet: thin shoes, on a walking pad
    { t: 8.6, p: V3(0.36, 0.36, 0.84), l: V3(-0.01, 0.15, -0.1), fov: 30, tens: 0.5 },
    { t: 9.6, p: V3(0.22, 0.25, 0.6), l: V3(-0.06, 0.13, -0.09), fov: 30 },
    { t: 10.7, p: V3(0.17, 0.21, 0.5), l: V3(-0.07, 0.125, -0.1), fov: 30 },                          // the right foot, low, from the front and inside
    { t: 12.2, p: V3(0.44, 0.23, 0.46), l: V3(-0.07, 0.13, -0.05), fov: 30 },                         // round to the inside: the arches
    { t: 13.4, p: V3(0.43, 0.24, 0.48), l: V3(-0.07, 0.13, -0.05), fov: 30, tens: 0.4 },
    { t: 15.8, p: V3(0.25, 0.25, 0.54), l: V3(-0.07, 0.125, -0.07), fov: 30, tens: 0.4 },
    { t: 19.9, p: V3(0.16, 0.28, 0.58), l: V3(-0.07, 0.13, -0.08), fov: 30, tens: 0.35 },
    { t: 22.3, p: V3(-1.75, 1.25, 2.6), l: V3(0, 0.97, -0.05), fov: 34 },                             // back and round: the whole skeleton, walking
    { t: 24.5, p: V3(-1.62, 1.12, 2.44), l: V3(0, 0.9, -0.05), fov: 34 },
    { t: 26.0, p: V3(-0.08, 0.5, 1.75), l: V3(0, 0.22, 0.05), fov: 28 },                              // down over the pad's display to the walking feet
    { t: 27.4, p: V3(-0.07, 0.49, 1.68), l: V3(0, 0.21, 0.05), fov: 28, tens: 0.4 },
    { t: 29.0, p: V3(-1.08, 0.27, -0.04), l: V3(0, 0.17, -0.09), fov: 30 },                           // the side: heel raises, barefoot
    { t: 32.5, p: V3(-1.09, 0.29, 0.0), l: V3(0, 0.17, -0.09), fov: 30, tens: 0.3 },
    { t: 33.7, p: V3(-1.25, 0.82, 1.1), l: V3(-0.35, 0.8, 0.0), fov: 32 },
    { t: 34.7, p: V3(-0.91, 1.265, 2.12), l: V3(-0.675, 1.185, 0.05), fov: 32, tens: 0.15 },                        // up: 118 runners
    { t: 40.1, p: V3(-0.9, 1.265, 2.15), l: V3(-0.675, 1.185, 0.05), fov: 32, tens: 0.15 },
    { t: 42.3, p: V3(-0.42, 0.52, 1.32), l: V3(0, 0.17, 0.0), fov: 32 },                              // down to the feet and the display: toe shoes
    { t: 44.7, p: V3(-0.36, 0.62, 1.14), l: V3(0, 0.15, -0.03), fov: 32 },
    { t: 46.95, p: V3(-0.37, 0.63, 1.17), l: V3(0, 0.15, -0.03), fov: 32, tens: 0.3 },
    { t: 47.95, p: V3(-0.36, 0.3, 0.56), l: V3(-0.07, 0.13, -0.08), fov: 30 },                         // the right foot: the MRI
    { t: 49.85, p: V3(-0.33, 0.32, 0.6), l: V3(-0.07, 0.13, -0.08), fov: 30, tens: 0.3 },
    { t: 51.4, p: V3(-1.15, 0.92, 1.95), l: V3(0, 0.72, -0.05), fov: 34 },                            // back: he walks again, in flat shoes, not running
    { t: 54.3, p: V3(-1.05, 0.9, 1.85), l: V3(0, 0.7, -0.05), fov: 34 },
    { t: 55.6, p: D(0, 0.02, 0.69, 0.88), l: D(0, 0.06, 0.05, 0), fov: 32 },                          // the dials, one by one: the first rises in view
    { t: 57.9, p: D(0, 0.03, 0.69, 0.88), l: D(0, 0.07, 0.05, 0), fov: 32, tens: 0.2 },
    { t: 59.0, p: D(1, 0.02, 0.69, 0.88), l: D(1, 0.06, 0.05, 0), fov: 32 },
    { t: 60.0, p: D(1, 0.03, 0.69, 0.88), l: D(1, 0.07, 0.05, 0), fov: 32, tens: 0.2 },
    { t: 61.1, p: D(2, -0.02, 0.66, 0.84), l: D(2, 0, 0.05, 0), fov: 32 },
    { t: 62.9, p: V3(0.66, 1.2, 3.0), l: V3(0.62, 0.12, 1.1), fov: 34 },                             // back: the last dial and the open box
    { t: 66.6, p: V3(0.78, 1.0, 2.7), l: V3(0.7, 0.16, 1.06), fov: 34, tens: 0.4 },
    { t: 70.9, p: V3(0.77, 0.96, 2.6), l: V3(0.69, 0.16, 1.08), fov: 34, tens: 0.3 },
    { t: T.logo, p: V3(DIALS[2].x, 1.12, DIALS[2].z + 0.005), l: V3(DIALS[2].x, 0.0665, DIALS[2].z), fov: 30, stop: true },   // straight down on the last dial: the logo lands here
  ]);
}
function camPose(S, t) {
  const v = S.cfg.view;
  if (Array.isArray(v)) return { p: v[0], l: v[1], fov: v[2] ?? 30 };
  if (v && typeof v === 'object') return v;
  if (!CAM) CAM = buildCam();
  if (t <= T.logo) return CAM(t);
  const P = CAM(T.logo), k = ss(T.logo, T.end, t);
  return { p: [P.p[0], lerp(P.p[1], P.p[1] - 0.08, k), P.p[2]], l: P.l, fov: 30 };
}
function focusAt(S, t, P) { return Math.hypot(P.p[0] - P.l[0], P.p[1] - P.l[1], P.p[2] - P.l[2]); }

// ------------------------------------------------------------------ where the points of light sit
const DOT1 = (i) => { const grp = i < 57 ? 0 : 1, j = grp ? i - 57 : i, gx = j % 8, gy = Math.floor(j / 8);   // two blocks, one above the other, beside the skeleton
  return new THREE.Vector3(-0.76 + gx * 0.027, (grp ? 1.045 : 1.33) - gy * 0.027, 0.05); };
const DOT2 = (k) => { const a = (-80 + (160 * k) / 18) * (Math.PI / 180);                                     // an arc on the belt, in front of the feet
  return new THREE.Vector3(0.19 * Math.sin(a), PAD.h + 0.011, -0.085 + 0.19 * Math.cos(a)); };

// ------------------------------------------------------------------ one moment of the film
const _m4 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _c = new THREE.Color();
const RED = new THREE.Color(0xff3b30).multiplyScalar(1.4);
function update(S, t) {
  const scene = S.scene;
  applyBody(t);
  const endDark = ss(T.final + 0.3, T.logo - 0.3, t);
  // ---- the belt runs while he walks
  W.pad.beltTex.offset.y = -walkS(t) / ((PAD.z1 - PAD.z0 - 0.12) / 2.2);
  { const [l1, l2, gl] = padText(t); drawPad(W.pad, l1, l2, gl); }
  // ---- the box: the lid comes off on "wearing no shoes" (nothing inside), and slams back down at "shoe shop"
  { const a = s5(4.85, 5.95, t), u = clamp01((t - (T.shop - 0.82)) / 0.82); setLid(W.box, t < 40 ? a : 1 - u * u); }
  // ---- the shoes: solid at first, clear for the bones, gone for the exercises, back for the second walk
  const xray = ss(T.built - 0.25, T.built + 0.45, t), shoeO = soleOn(t);
  const walkK = ss(20.3, 21.3, t) * (1 - ss(27.0, 27.8, t)) + ss(50.3, 51.2, t) * (1 - ss(54.4, 55.2, t));
  W.upperMat.opacity = Math.min(1, lerp(1, 0.16, xray) + 0.36 * walkK) * shoeO; W.soleMat.opacity = Math.min(1, lerp(1, 0.5, xray) + 0.35 * walkK) * shoeO;
  for (const m of [W.upperMat, W.soleMat]) { const tr = m.opacity < 0.999; if (m.transparent !== tr) { m.transparent = tr; m.needsUpdate = true; } m.depthWrite = m.opacity > 0.6; }
  // the toe shoes: on at "toe shoes", clear for the MRI, off before the second walk
  { const on = toeOn(t), xr = ss(T.stress - 0.6, T.stress - 0.1, t); W.toeMat.opacity = on * lerp(1, 0.2, xr); W.toeSoleMat.opacity = on * lerp(1, 0.45, xr);
    for (const m of [W.toeMat, W.toeSoleMat]) m.depthWrite = m.opacity > 0.6; }
  for (const Side of SIDES) { for (const sk of W.shoes[Side].parts) sk.mesh.visible = shoeO > 0.002; for (const sk of W.toeShoes[Side].parts) sk.mesh.visible = W.toeMat.opacity > 0.002; }
  for (const sk of W.skins) if (sk.mesh.visible) sk.update(0);
  // ---- 26 bones light up, heel to toes; then the three arches draw themselves
  W.rightFoot.forEach((m, i) => { const t0 = T.twentysix - 0.05 + i * 0.034; m.material.emissiveIntensity = 0.55 * Math.exp(-Math.max(0, t - t0) * 2.2) * (t > t0 ? 1 : 0) + 0.06 * ss(T.twentysix, T.bones + 0.4, t) * (1 - ss(T.small, T.small + 0.8, t)); });
  W.arches.forEach((m, i) => { const t0 = T.three + 0.05 + i * 0.22; m.visible = t > t0 && t < 16.9; m.material.uniforms.uDraw.value = s5(t0, t0 + 0.7, t) * 1.02; m.material.uniforms.uO.value = 1 - 0.55 * ss(T.small, T.small + 0.6, t) - 0.45 * ss(16.2, 16.9, t); });
  // ---- the small muscles: they appear under the arches, and work
  { const on = ss(T.small - 0.1, T.muscles + 0.4, t) * (1 - ss(55.0, 56.0, t));
    W.footMat.opacity = on; const tr = on < 0.999; if (W.footMat.transparent !== tr) { W.footMat.transparent = tr; W.footMat.needsUpdate = true; } W.footMat.depthWrite = on > 0.5;
    const pulse = (T.like < t && t < 20.6 ? 0.5 + 0.5 * Math.sin((t - T.like) * 7.5) : 0) * ss(T.like, T.like + 0.4, t), rise = riseAt(t), walk = ss(WALKS[0].t0, WALKS[0].t0 + 1, t) * (1 - ss(WALKS[0].t1 - 0.5, WALKS[0].t1 + 0.5, t));
    W.footMat.emissiveIntensity = 0.02 + 0.12 * pulse + 0.14 * rise + 0.06 * walk * ss(T.their, T.forty, t);
    for (const sk of W.footSkins) { sk.mesh.visible = on > 0.002; if (on > 0.002) sk.update(0); } }
  // ---- the dots: 118 runners in two groups (57 trained, 61 not); then 19 runners, ten of them lit red
  { const on1 = ss(T.runners2 + 0.6, T.runners2 + 1.4, t) * (1 - ss(40.4, 41.1, t)), on2 = ss(T.toe - 0.1, T.toe + 0.6, t) * (1 - ss(T.stress - 0.3, T.stress + 0.2, t));
    W.dots.visible = on1 > 0.002 || on2 > 0.002;
    if (W.dots.visible) {
      for (let i = 0; i < 118; i++) {
        const pop = outBack(clamp01((t - (T.runners2 + 0.6 + i * 0.006)) / 0.25), 2) * on1;
        _s.setScalar(Math.max(0.00001, pop * 0.0078)); _m4.compose(DOT1(i), _q.identity(), _s); W.dots.setMatrixAt(i, _m4);
        _c.set(i < 57 ? 0xeceef1 : 0x8a909a); W.dots.setColorAt(i, _c);
      }
      for (let k = 0; k < 19; k++) {
        const i = 118 + k, pop = outBack(clamp01((t - (T.toe + k * 0.025)) / 0.25), 2) * on2, hot = k < 10 ? ss(T.more + 0.3 + k * 0.06, T.more + 0.6 + k * 0.06, t) : 0;
        _s.setScalar(Math.max(0.00001, pop * 0.0085 * (1 + 0.15 * hot))); _m4.compose(DOT2(k), _q.identity(), _s); W.dots.setMatrixAt(i, _m4);
        _c.set(0xeceef1).lerp(RED, hot); W.dots.setColorAt(i, _c);
      }
      W.dots.instanceMatrix.needsUpdate = true; W.dots.instanceColor.needsUpdate = true;
    } }
  // ---- the MRI: an ellipse of light runs along the right foot, the bones flash in its path
  { const on = ss(T.stress - 0.2, T.stress + 0.1, t) * (1 - ss(T.scans + 0.6, T.scans + 1.0, t)), run = s5(0, 1, clamp01((t - T.stress) / 1.6));
    W.scan.visible = on > 0.002; W.scanMat.opacity = on; W.sliceMat.opacity = 0.07 * on;
    const G = W.rig.legs.Right, zr = lerp(G.heel.z - 0.025, G.toeZ + 0.012, run);
    if (on > 0.002) { W.scan.position.set(W.scanC.x - G.A.x, W.scanC.y - G.A.y, zr - G.A.z);
      W.rightFoot.forEach((m) => { const dz = m.userData.home.z - zr; m.material.emissiveIntensity = Math.max(m.material.emissiveIntensity, 0.42 * Math.exp(-(dz * dz) / 0.0005) * on); }); } }
  // ---- the dials rise and are set (2,500 / 5,000 / 7,000 steps a day, of 10,000)
  W.dials.forEach((d, i) => {
    const t0 = 55.0 + i * 0.18, up = s5(t0, t0 + 0.9, t); d.g.position.y = lerp(-0.075, 0, up); d.g.visible = up > 0.001;
    const ts = [T.two, T.five, T.seven][i], v = [0.25, 0.5, 0.7][i], k = s5(ts - 0.1, ts + 0.55, t);
    d.knob.rotation.y = -d.angle(lerp(lerp(0, v, k), 0.5, i === 2 ? s5(T.final + 0.2, T.logo - 0.3, t) : 0));
    d.setMat.opacity = ss(ts + 0.3, ts + 0.6, t) * (1 - endDark);
    const a = d.angle(v), r = 0.147; d.set.position.set(Math.sin(a) * r, 0.0048, -Math.cos(a) * r); d.set.rotation.y = -a;
  });
  { const logoK = s5(T.final + 0.4, T.logo - 0.25, t); W.logoRing.set({ weight: logoK, white: logoK, hours: 0, hand: ss(T.logo - 0.4, T.logo - 0.15, t), handScale: outBack(clamp01((t - (T.logo - 0.4)) / 0.35), 1.8) }); }
  // ---- light
  const fig = 1 - endDark;
  W.key.intensity = 5.4 * fig; W.rim.intensity = 2.2 * fig; W.fill.intensity = 0.9 * fig;
  W.footLight.intensity = 2.6 * (ss(6.6, 8.2, t) * (1 - ss(20.4, 21.9, t)) + ss(25.1, 26.5, t) * (1 - ss(33.2, 34.2, t)) + ss(40.8, 42.0, t) * (1 - ss(49.6, 50.8, t)));
  W.boxLight.intensity = 5.0 * (1 - ss(6.6, 8.4, t) * (1 - ss(61.5, 63.1, t))) * (1 - 0.7 * endDark);
  W.dialLight.intensity = 3.2 * ss(54.8, 56.0, t) * (1 - 0.6 * endDark);
  W.dotLight.intensity = 1.6 * ss(33.9, 34.9, t) * (1 - ss(40.3, 41.3, t));
  S.tableMat.color.setScalar(FLOOR * (1 - endDark * 0.9)); scene.environmentIntensity = 0.12 * (1 - endDark); S.reflAmt = 0.9 * (1 - endDark);
}

// ------------------------------------------------------------------ the words on screen
const CAPS = [
  { t0: T.youre, t1: 2.32, top: 292, size: 88, html: 'You’re thinking about<br>buying <em>barefoot shoes</em>,' },
  { t0: T.which, t1: 6.45, top: 292, size: 84, html: 'which means paying<br>money to feel like<br>you’re wearing <em>no shoes.</em>' },
  { t0: T.lets, t1: 9.3, top: 292, size: 88, html: 'Let’s see if your feet<br><em>actually need them.</em>' },
  { t0: T.your, t1: 13.16, top: 292, size: 84, html: 'Your feet were built with<br><em>26 bones</em> each,<br><em>three arches</em>' },
  { t0: T.and1, t1: 16.9, top: 292, size: 84, html: 'and small muscles that<br>help <em>hold those<br>arches up.</em>' },
  { t0: T.like, t1: 20.8, top: 292, size: 88, html: 'Like any muscle, they<br>get <em>stronger</em> when<br>you make them work.' },
  { t0: T.when2, t1: 24.4, top: 292, size: 84, html: 'When runners walked<br>in <em>flat, flexible shoes</em><br>for eight weeks,' },
  { t0: T.their, t1: 28.12, top: 292, size: 88, html: 'their foot muscles got<br>about <em>40% stronger</em>,' },
  { t0: T.and2, t1: 32.45, top: 292, size: 84, html: 'and simple <em>foot exercises</em><br>worked just as well,<br><em>for free.</em>' },
  { t0: T.runners2, t1: 36.65, top: 292, size: 75, html: 'Runners who did foot<br>exercises for eight weeks,<br>and kept them up,' },
  { t0: T.even, t1: 40.6, top: 292, size: 84, html: 'even got fewer<br><em>running injuries</em><br>over the next year.' },
  { t0: T.but, t1: 42.6, top: 300, size: 92, html: 'But don’t switch<br><em>overnight.</em>' },
  { t0: T.when3, t1: 45.88, top: 292, size: 82, html: 'When runners switched<br>to running in <em>toe shoes</em><br>over ten weeks,' },
  { t0: T.more, t1: 49.8, top: 292, size: 84, html: 'more than half showed<br><em>bone stress</em><br>on their scans.' },
  { t0: 50.13, t1: 55.3, top: 292, size: 80, html: 'The plan that made feet<br>stronger had people <em>walk</em><br>in flat, flexible shoes,<br><em>not run</em>,' },
  { t0: T.building, t1: 61.4, top: 292, size: 84, html: 'building up from <em>2,500</em><br>steps a day to <em>5,000</em>,<br>then <em>7,000</em>.' },
  { t0: T.if, t1: 67.3, top: 292, size: 78, html: 'If your feet are painful,<br>stiff, weak or numb,<br>you keep injuring them<br>or losing your balance,' },
  { t0: 67.35, t1: 71.8, top: 292, size: 84, html: 'or one foot has<br>gone flat, see a <em>doctor</em>,<br>not a shoe shop.' },
  { t0: T.final, t1: 99, top: 360, size: 92, html: 'Let’s get you back to<br><em>factory settings.</em>' },
];
const OVL = {};
function overlayInit(S) {
  const O = S.O, tag = (cls, txt, size) => { const e = O.tag(cls, txt); e.style.fontSize = size + 'px'; return e; };
  OVL.arch = [tag('tag', 'Inner arch', 28), tag('tag', 'Outer arch', 28), tag('tag', 'Across', 28)];
  for (const e of OVL.arch) Object.assign(e.style, { background: 'rgba(8,9,11,.62)', padding: '6px 14px 5px', borderRadius: '22px' });
  OVL.grp = [tag('tag', 'Foot exercises<b>57 runners</b>', 26), tag('tag', 'No exercises<b>61 runners</b>', 26)];
  for (const e of OVL.grp) e.querySelector('b').style.fontSize = '40px';
  OVL.risk = tag('tag', 'Injured within<br>a year<b>2.42× as likely</b>', 26); OVL.risk.querySelector('b').style.fontSize = '44px'; OVL.risk.style.textAlign = 'right';
  OVL.toe = tag('tag', 'Toe shoes, 10 weeks<b>10 of 19</b>', 26); OVL.toe.querySelector('b').style.fontSize = '44px';
  OVL.dial = [tag('tag', 'Weeks 1 to 2<b>2,500 steps a day</b>', 30), tag('tag', 'Weeks 3 to 4<b>5,000 steps a day</b>', 30), tag('tag', 'Weeks 5 to 8<b>7,000 steps a day</b>', 30)];
  for (const e of OVL.dial) e.querySelector('b').style.fontSize = '54px';
}
function overlay(S, t) {
  const R = W.rig, ank = R.legs.Right.ankle;
  W.arches.forEach((m, i) => { const mid = ank.localToWorld(m.userData.mid.clone()); const t0 = T.three + 0.05 + i * 0.22;
    place(S, OVL.arch[i], mid, [40, -210, -65][i], [-70, 87, -77][i], ss(t0 + 0.3, t0 + 0.6, t) * (1 - ss(13.9, 14.3, t))); });
  const g1 = ss(34.75, 35.2, t) * (1 - ss(39.85, 40.2, t));   // only while the camera holds on the dots
  place(S, OVL.grp[0], new THREE.Vector3(-0.773, 1.33, 0.05), -6, -112, g1);
  place(S, OVL.grp[1], new THREE.Vector3(-0.773, 1.045, 0.05), -6, -112, g1 * ss(35.0, 35.45, t));
  place(S, OVL.risk, new THREE.Vector3(-0.76, 1.045, 0.05), -(OVL.risk.offsetWidth || 280) - 44, -14, ss(T.fewer, T.injuries + 0.3, t) * (1 - ss(39.85, 40.2, t)));   // left of the untrained block, clear of the dots and of the apps' buttons (right) and text (bottom fifth)
  place(S, OVL.toe, new THREE.Vector3(0, PAD.h + 0.01, 0.105), -130, 52, ss(T.half, T.half + 0.4, t) * (1 - ss(T.stress - 0.35, T.stress, t)));
  W.dials.forEach((d, i) => { const ts = [T.two, T.five, T.seven][i], e = OVL.dial[i];
    place(S, e, d.g.position.clone().add(new THREE.Vector3(0, 0.0, -0.17)), -(e.offsetWidth || 200) / 2, -62, ss(ts, ts + 0.4, t) * (1 - ss(T.if - 0.3, T.if + 0.2, t))); });
  const d = W.dials[2], c = d.g.position.clone().add(new THREE.Vector3(0, 0.0665 + 0.0012, 0));
  logoEnd(S, t, { t0: T.logo, center: c, edge: c.clone().add(new THREE.Vector3(LOGO_R, 0, 0)) });
}

makeFilm({
  T, caps: CAPS, subs: [], build, update, pose: camPose, overlay, overlayInit, focus: focusAt,
  stage: { bg: 0x07080a, reflSize: 6, env: 0.12, far: 30 },
  aperture: [[0, 0.006], [5.2, 0.005], [7.9, 0.004], [10.7, 0.006], [19.9, 0.006], [22.3, 0.002], [24.5, 0.002], [26.2, 0.0022], [29.0, 0.005], [35.2, 0.003], [42.3, 0.004], [46.95, 0.004], [47.95, 0.006], [49.9, 0.004], [51.4, 0.002], [54.3, 0.002], [55.9, 0.003], [62.9, 0.002], [70.6, 0.003]],
  bloom: [[0, 0.42], [9.6, 0.48], [32, 0.45], [47.95, 0.5], [74, 0.55]],
  fast: [[20.6, 27.7, 2], [28.4, 33.2, 2], [50.6, 55.0, 2], [69.7, 70.9, 2]],
});

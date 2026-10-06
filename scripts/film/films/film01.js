// Human Factory Settings · Film 1 "Why am I always tired?" (new direction, 3 Oct 2026) · one continuous shot, 9:16.
// A skeleton in bed at night, scrolling a phone held over its face; on "Let's fix that." the phone drops onto its face.
// Inside the glass skull a day's sleepy chemical piles up as glowing grains; at night a robot vacuum, the cleaning crew,
// clears it until the alarm cuts the night short and the vacuum gives up, leaving yesterday's mess. A warning light on the
// forehead; coffee tapes over it. The cup only drains to half between 6 and 11 p.m.; caffeinated, the skeleton buzzes like
// a phone on vibrate. Day and night through the window; a lamp and a screen keep the body clock on DAY. A split-flap board:
// SLEEP HORMONE DELAYED, ALARM ON TIME, then the settings in orange. Morning: he sits up. The clock becomes the logo.
import { THREE, ORANGE, AMBER, ss, s5, lerp, clamp01, hash, camTrack, phys, glowMat, shadows, spot, RoundedBoxGeometry,
  loadAnatomy, V3, place, logoEnd, makeFilm, outBack, stamp, stampCanvas, stampSpot, noiseTex, TIME, keys } from '../kit.js';
import { buildRig, skeletonKind, legIK, bendSpine, poseArm, worldVerts, avgV, clearArms } from '../rig.js';
import { makeClock, makeCup, makePhone, makeLamp, makeLogoRing, tickAngle } from '../props.js';

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



// ------------------------------------------------------------------ timing, from the voice guide (word starts)
const T = {
  end: 79.2, logo: 76.75,
  you: 0.35, sleep: 0.80, six: 1.08, hours: 1.34, drink: 1.65, coffee: 1.94, after: 2.26, dinner: 2.59, scroll: 3.05, bed: 3.56, until: 3.87, midnight: 4.56,
  and1: 4.92, wonder: 5.58, why: 6.03, always: 6.76, tired: 7.62, lets: 8.66, fix: 9.18, that: 9.51,
  all: 10.52, day: 10.87, chemical: 11.41, builds: 11.73, brain: 12.61, makes: 13.18, sleepy: 13.50, and2: 14.07, sleep2: 14.49, cleaning: 14.99, crew: 15.59, clears: 16.04, out: 16.81,
  cut: 17.45, night: 18.05, short: 18.28, some: 18.80, yesterdays: 19.05, mess: 19.91, still: 20.43, morning: 21.25,
  coffee2: 22.46, doesnt: 23.06, clean: 23.35, it: 23.90, just: 24.73, hides: 25.06, signal: 25.55, like: 25.87, tape: 26.08, over: 26.53, warning: 27.29, light: 27.56,
  drink2: 28.72, six2: 29.50, evening: 29.94, and3: 30.31, about: 30.71, half: 30.99, still2: 31.89, eleven: 32.59, maybe: 33.64, sleeper: 34.98, maybe2: 35.38, just2: 36.13, caffeinated: 36.47,
  your: 38.11, body: 38.55, built: 39.16, sun: 39.88, so: 40.12, even: 40.54, ordinary: 41.07, lamp: 41.78, screen: 42.46, night2: 42.99, makes2: 43.36, clock: 44.41, think: 44.86, daytime: 45.94,
  and4: 46.47, sleepH: 47.14, hormone: 47.41, shows: 47.85, late: 48.49, alarm: 49.70, sadly: 50.05, still3: 50.49, on: 51.33, time: 51.60,
  so2: 52.77, seven: 53.55, am: 53.78, alarm2: 54.45, beIn: 54.85, bed2: 55.33, eleven2: 56.06, stop: 56.42, coffee3: 56.87, two: 57.39, and5: 57.93, dim: 58.12, lights: 58.61, eight: 59.39,
  if1: 60.52, exhausted: 61.36, or1: 62.36, fever: 63.31, sweats: 63.86, weight: 64.61, see: 66.49, doctor: 67.06, if2: 68.12, confused: 68.90, dizzy: 69.71, or2: 69.94, thoughts: 70.60, get: 72.26, help: 72.51, away: 73.07,
  final: 74.48, factory: 75.69, settings: 76.06,
};
const H = 3600;

// ------------------------------------------------------------------ the set (metres; the bed runs along z, its head at -z; +x is the bedside)
const W = {}; window.HFS_W = W;
const BED = { x0: -0.48, x1: 0.48, z0: -1.06, z1: 1.02, top: 0.5, base: 0.3 };
const TBL = { x: 0.83, z: -0.83, w: 0.56, d: 0.46, top: 0.56 };
const CLOCK = new THREE.Vector3(0.66, TBL.top, -0.72), LAMP = new THREE.Vector3(1.0, TBL.top, -0.97), CUP = new THREE.Vector3(0.9, TBL.top, -0.66);
const WALL_Z = -1.2, BOARD = { x: 0.86, y: 1.05, z: WALL_Z + 0.03, ry: 0 };
const X = new THREE.Vector3(1, 0, 0), Y = new THREE.Vector3(0, 1, 0), Z = new THREE.Vector3(0, 0, 1);
const pulse = (t, a, b, r = 0.35) => ss(a, a + r, t) * (1 - ss(b - r, b, t));

function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h, c);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.userData.canvas = c; return t;
}
function txt(x, s, px, py, { font = '800 100px Archivo', color = '#fff', align = 'center', track = 0, base = 'middle' } = {}) {
  x.font = font; x.letterSpacing = `${track}px`; x.fillStyle = color; x.textAlign = align; x.textBaseline = base; x.fillText(s, px, py);
}

// ------------------------------------------------------------------ the bed (from film 8): frame, headboard, a mattress that takes the body's shape, a pillow
const MAT = { nx: 97, nz: 209, r: 0.035 };
function edgeDrop(x, z) {
  const d = Math.min(x - BED.x0, BED.x1 - x, z - BED.z0, BED.z1 - z), r = MAT.r;
  if (d >= r) return 0; const u = r - Math.max(0, d); return r - Math.sqrt(Math.max(0, r * r - u * u));
}
function makeBed(scene) {
  const g = new THREE.Group(); scene.add(g);
  const lacquer = phys({ color: 0x0c0d0f, roughness: 0.34, clearcoat: 0.6, clearcoatRoughness: 0.25 });
  const frame = new THREE.Mesh(new RoundedBoxGeometry(BED.x1 - BED.x0 + 0.05, 0.16, BED.z1 - BED.z0 + 0.05, 4, 0.012), lacquer);
  frame.position.set(0, 0.06 + 0.08 + 0.002, (BED.z0 + BED.z1) / 2); g.add(frame);
  for (const [x, z] of [[BED.x0 + 0.04, BED.z0 + 0.06], [BED.x1 - 0.04, BED.z0 + 0.06], [BED.x0 + 0.04, BED.z1 - 0.06], [BED.x1 - 0.04, BED.z1 - 0.06]]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.014, 0.07, 24), lacquer); leg.position.set(x, 0.035, z); g.add(leg);
  }
  const fabric = (c, o = {}) => phys({ color: c, roughness: 0.92, sheen: 0.6, sheenColor: new THREE.Color(0x8a93a6), sheenRoughness: 0.6, roughnessMap: noiseTex(5, 256, 0.82, 1.0, 40), ...o });
  const head = new THREE.Mesh(new RoundedBoxGeometry(BED.x1 - BED.x0 + 0.08, 0.86, 0.07, 5, 0.025), fabric(0x262a31));
  head.position.set(0, 0.1 + 0.43, BED.z0 - 0.06); g.add(head);
  const sideH = BED.top - MAT.r - BED.base;
  const box = new THREE.Mesh(new THREE.BoxGeometry(BED.x1 - BED.x0, sideH, BED.z1 - BED.z0), fabric(0x2c3037));
  box.position.set(0, BED.base + sideH / 2, (BED.z0 + BED.z1) / 2); g.add(box);
  const nx = MAT.nx, nz = MAT.nz, pos = new Float32Array(nx * nz * 3), uv = new Float32Array(nx * nz * 2), idx = [];
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
    const k = j * nx + i, x = lerp(BED.x0, BED.x1, i / (nx - 1)), z = lerp(BED.z0, BED.z1, j / (nz - 1));
    pos[k * 3] = x; pos[k * 3 + 1] = BED.top - edgeDrop(x, z); pos[k * 3 + 2] = z; uv[k * 2] = i / (nx - 1); uv[k * 2 + 1] = j / (nz - 1);
  }
  for (let j = 0; j < nz - 1; j++) for (let i = 0; i < nx - 1; i++) { const a = j * nx + i, b = a + 1, c = a + nx, d = c + 1; idx.push(a, c, b, b, c, d); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); geo.setIndex(idx); geo.computeVertexNormals();
  const top = new THREE.Mesh(geo, fabric(0x30343c)); g.add(top);
  shadows(g); g.traverse((o) => o.layers.enable(1));
  const edge = new Float32Array(nx * nz); for (let k = 0; k < nx * nz; k++) { const x = pos[k * 3], z = pos[k * 3 + 2]; edge[k] = ss(0.0, 0.05, Math.min(x - BED.x0, BED.x1 - x, z - BED.z0, BED.z1 - z)); }
  return { g, top, geo, base: Float32Array.from(pos), edge, key: '' };
}
function imprint(pts, { x0, x1, z0, z1, nx, nz }, surf, { gap = 0.004, dil = 2, blur = 3, max = 0.07 } = {}) {
  const d = new Float32Array(nx * nz);
  for (let p = 0; p < pts.length; p += 3) {
    const x = pts[p], y = pts[p + 1], z = pts[p + 2]; const i = Math.round(((x - x0) / (x1 - x0)) * (nx - 1)), j = Math.round(((z - z0) / (z1 - z0)) * (nz - 1));
    if (i < 0 || j < 0 || i >= nx || j >= nz) continue;
    const s = surf(x, z), k = j * nx + i; d[k] = Math.max(d[k], Math.min(max, s - (y - gap)));
  }
  const pass = (src, r, op) => { const out = new Float32Array(nx * nz);
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { let a = 0, ws = 0;
      for (let dj = -r; dj <= r; dj++) for (let di = -r; di <= r; di++) { const ii = i + di, jj = j + dj; if (ii < 0 || jj < 0 || ii >= nx || jj >= nz) continue;
        const v = src[jj * nx + ii]; if (op === 'max') a = Math.max(a, v); else { const w = Math.exp(-(di * di + dj * dj) / (r * r * 0.6)); a += v * w; ws += w; } }
      out[j * nx + i] = op === 'max' ? a : a / ws; }
    return out; };
  const soft = pass(pass(d, dil, 'max'), blur, 'blur');
  for (let k = 0; k < d.length; k++) soft[k] = Math.max(soft[k], d[k]);
  return soft;
}
function setMattress(B, dent) {
  const key = dent.key; if (key === B.key) return; B.key = key;
  const P = B.geo.attributes.position.array, base = B.base;
  for (let k = 0; k < base.length / 3; k++) P[k * 3 + 1] = base[k * 3 + 1] - dent.at(k) * B.edge[k];
  B.geo.attributes.position.needsUpdate = true; B.geo.computeVertexNormals(); B.geo.computeBoundingSphere();
}
function makePillow(scene, c, size) {
  const geo = new THREE.SphereGeometry(1, 160, 80), P = geo.attributes.position, sp = (u, e) => Math.sign(u) * Math.pow(Math.abs(u), e);
  for (let i = 0; i < P.count; i++) P.setXYZ(i, sp(P.getX(i), 0.32) * size.x, sp(P.getY(i), 0.75) * size.y, sp(P.getZ(i), 0.32) * size.z);
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, phys({ color: 0x3a3f48, roughness: 0.9, sheen: 0.7, sheenColor: new THREE.Color(0x9aa3b6), sheenRoughness: 0.6 }));
  m.position.copy(c); m.castShadow = m.receiveShadow = true; m.layers.enable(1); scene.add(m);
  return { m, geo, base: Float32Array.from(P.array), key: '' };
}
function makeTable(scene) {
  const g = new THREE.Group(); g.position.set(TBL.x, 0, TBL.z); scene.add(g);
  const wood = phys({ color: 0x15100c, roughness: 0.45, clearcoat: 0.5, clearcoatRoughness: 0.3 });
  const top = new THREE.Mesh(new RoundedBoxGeometry(TBL.w, 0.03, TBL.d, 4, 0.008), wood); top.position.y = TBL.top - 0.015; g.add(top);
  const body = new THREE.Mesh(new RoundedBoxGeometry(TBL.w - 0.03, 0.34, TBL.d - 0.03, 4, 0.01), wood); body.position.y = TBL.top - 0.03 - 0.17; g.add(body);
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.01, TBL.top - 0.37, 16), wood); leg.position.set(x * (TBL.w / 2 - 0.04), (TBL.top - 0.37) / 2, z * (TBL.d / 2 - 0.04)); g.add(leg); }
  shadows(g); g.traverse((o) => o.layers.enable(1));
  return g;
}

// ------------------------------------------------------------------ the phone's feed: cards that scroll, and the time in the status bar
const FEED_H = [520, 430, 610, 380, 560, 470], FEED_SUM = FEED_H.reduce((a, b) => a + b, 0);
const HUES = ['#e2795a', '#5aa0e2', '#c9a14a', '#7cc48a', '#b07ad9', '#e25a8c'];
function drawFeed(P, scroll, clockTxt) {
  const key = scroll.toFixed(1) + '|' + clockTxt; if (key === P.feedKey) return; P.feedKey = key;
  const x = P.feed.getContext('2d'), w = 590, h = 1220;
  x.fillStyle = '#0c0e13'; x.fillRect(0, 0, w, h);
  let y = 96 - (scroll % FEED_SUM), k = 0;
  while (y < h + 40) {
    const hh = FEED_H[k % 6];
    if (y + hh > 90) {
      x.fillStyle = '#161922'; x.beginPath(); x.roundRect(22, y + 14, w - 44, hh - 28, 26); x.fill();
      x.fillStyle = HUES[(k + 2) % 6]; x.beginPath(); x.arc(70, y + 64, 26, 0, Math.PI * 2); x.fill();
      x.fillStyle = '#3a3f4c'; x.fillRect(110, y + 46, 220, 16); x.fillStyle = '#2a2e38'; x.fillRect(110, y + 72, 140, 12);
      const g = x.createLinearGradient(0, y + 110, 0, y + hh - 70); g.addColorStop(0, HUES[k % 6]); g.addColorStop(1, '#1b1e27');
      x.fillStyle = g; x.beginPath(); x.roundRect(40, y + 110, w - 80, hh - 190, 18); x.fill();
      x.fillStyle = '#2f3440'; x.fillRect(40, y + hh - 62, 300, 14);
    }
    y += hh; k++;
  }
  x.fillStyle = '#0c0e13'; x.fillRect(0, 0, w, 88);
  txt(x, clockTxt, 58, 50, { font: '600 36px Archivo', color: '#eceef1', align: 'left' });
  x.fillStyle = '#eceef1'; x.fillRect(w - 110, 36, 54, 24); x.fillStyle = '#0c0e13'; x.fillRect(w - 106, 40, 40, 16);   // a battery, nearly empty
  x.fillStyle = '#ff5a4a'; x.fillRect(w - 106, 40, 8, 16);
  P.feedTex.needsUpdate = true;
}

// ------------------------------------------------------------------ the sleepy chemical: grains piling up inside the skull (built in the head's own frame)
function makeGrains(R) {
  const vault = ['Frontal bone', 'Left parietal bone', 'Right parietal bone', 'Occipital bone', 'Left temporal bone', 'Right temporal bone'].map((n) => R.byName.get(n)).filter(Boolean);
  const box = new THREE.Box3(); for (const m of vault) for (const v of worldVerts(m, 3)) box.expandByPoint(v);
  const c = box.getCenter(new THREE.Vector3()), h = box.getSize(new THREE.Vector3()).multiplyScalar(0.5);
  const E = { c: new THREE.Vector3(c.x, c.y + 0.12 * h.y, c.z - 0.02 * h.z), r: new THREE.Vector3(h.x * 0.78, h.y * 0.66, h.z * 0.8) };
  const seg = R.seg.Atlas, N = 2600, pts = [];
  let s = 1;
  while (pts.length < N * 2.2) {
    const u = hash(s * 1.37) * 2 - 1, v = hash(s * 2.71 + 3.1) * 2 - 1, w = hash(s * 4.13 + 7.7) * 2 - 1; s++;
    if (u * u + v * v + w * w > 1) continue;
    pts.push(new THREE.Vector3(E.c.x + u * E.r.x, E.c.y + v * E.r.y, E.c.z + w * E.r.z));
  }
  const geo = new THREE.IcosahedronGeometry(1, 1);
  const mat = new THREE.MeshStandardMaterial({ color: 0x1c2338, roughness: 0.45, emissive: new THREE.Color(0x7f9cff), emissiveIntensity: 1.4, toneMapped: true });
  const mesh = new THREE.InstancedMesh(geo, mat, N); mesh.count = 0; mesh.frustumCulled = false;
  const g = new THREE.Group(); g.position.copy(seg.pivot).negate(); seg.g.add(g); g.add(mesh);
  return { g, mesh, pts, N, E, seg };
}
function settleGrains(G) {   // with the body lying as it will lie, sort the grains bottom-up in world space; keep the lowest N
  G.g.updateMatrixWorld(true);
  const wp = G.pts.map((p) => ({ p, y: p.clone().applyMatrix4(G.g.matrixWorld).y }));
  wp.sort((a, b) => a.y - b.y);
  const keep = wp.slice(0, G.N), M = new THREE.Matrix4(), q = new THREE.Quaternion(), col = new THREE.Color();
  keep.forEach((k, i) => { const r = 0.0021 + 0.0012 * hash(i * 5.3); M.compose(k.p, q, new THREE.Vector3(r, r, r)); G.mesh.setMatrixAt(i, M);
    col.setRGB(0.75 + 0.25 * hash(i * 2.2), 0.8 + 0.2 * hash(i * 3.9), 1); G.mesh.setColorAt(i, col); });
  G.mesh.instanceMatrix.needsUpdate = true; if (G.mesh.instanceColor) G.mesh.instanceColor.needsUpdate = true;
  G.levelY = keep.map((k) => k.y);                                 // world height of the i-th grain
  G.world = keep.map((k) => k.p.clone().applyMatrix4(G.g.matrixWorld));
}
// the top surface at a fill count k: a centre and half-widths in x and z, from the grains just under the top
function surfaceAt(G, k) {
  k = Math.max(40, Math.min(G.N - 1, Math.round(k)));
  const y = G.levelY[k], band = G.world.slice(Math.max(0, k - 220), k);
  let cx = 0, cz = 0; for (const p of band) { cx += p.x; cz += p.z; } cx /= band.length; cz /= band.length;
  let ax = 0, az = 0; for (const p of band) { ax = Math.max(ax, Math.abs(p.x - cx)); az = Math.max(az, Math.abs(p.z - cz)); }
  return { y, cx, cz, ax, az };
}

// ------------------------------------------------------------------ the cleaning crew: a robot vacuum, the size of a coin
function makeVacuum(scene) {
  const g = new THREE.Group(); scene.add(g);
  const r = 0.0105, h = 0.0042;
  const shell = phys({ color: 0x24272d, roughness: 0.32, clearcoat: 0.7, clearcoatRoughness: 0.2 });
  const lid = phys({ color: 0x3b4049, roughness: 0.25, clearcoat: 0.9, clearcoatRoughness: 0.1, metalness: 0.2 });
  const b = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 0.97, h, 48), shell); b.position.y = h / 2; g.add(b);
  const top = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.86, r * 0.86, 0.0006, 48), lid); top.position.y = h + 0.0003; g.add(top);
  const bump = new THREE.Mesh(new THREE.TorusGeometry(r * 1.01, 0.0011, 8, 48, Math.PI), phys({ color: 0x111215, roughness: 0.6 }));
  bump.rotation.x = Math.PI / 2; bump.rotation.z = Math.PI; bump.position.y = h * 0.45; g.add(bump);
  const ledMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0x58ff9a).multiplyScalar(2.2), toneMapped: false });
  const led = new THREE.Mesh(new THREE.SphereGeometry(0.0013, 12, 8), ledMat); led.position.set(0, h + 0.0006, r * 0.55); g.add(led);
  const brush = new THREE.Group(); brush.position.set(r * 0.62, 0.0006, r * 0.62); g.add(brush);
  for (let i = 0; i < 3; i++) { const bristle = new THREE.Mesh(new THREE.BoxGeometry(0.0003, 0.0003, 0.007), phys({ color: 0x9aa0a8, roughness: 0.5 })); bristle.position.z = 0.0035; const a = new THREE.Group(); a.rotation.y = (i / 3) * Math.PI * 2; a.add(bristle); brush.add(a); }
  shadows(g); g.visible = false;
  return { g, led, ledMat, brush, r, h };
}

// ------------------------------------------------------------------ the warning light on the forehead, and the tape that hides it
function makeWarning(R) {
  const fb = R.byName.get('Frontal bone');
  const sp = stampSpot(fb, { from: [0, 0.028, 0.14], dir: [0, -0.15, -1], spread: 0.003 }) || stampSpot(fb, { from: [0, 0.0, 0.14], dir: [0, 0, -1], spread: 0.003 }) || { center: [0, 0.02, 0.05], normal: [0, 0.3, 1] };
  const g = new THREE.Group(); fb.add(g);
  const n = new THREE.Vector3().fromArray(sp.normal).normalize(); g.position.fromArray(sp.center).addScaledVector(n, 0.0005);
  g.quaternion.setFromUnitVectors(Z, n);
  { const up = new THREE.Vector3(0, 1, 0).applyQuaternion(g.quaternion.clone().invert()); g.rotateZ(Math.atan2(-up.x, up.y)); }   // the icon stands upright on the skull
  const housing = new THREE.Mesh(new RoundedBoxGeometry(0.03, 0.02, 0.006, 4, 0.0025), phys({ color: 0x141519, roughness: 0.35, clearcoat: 0.7 })); housing.position.z = 0.003; g.add(housing);
  const icon = canvasTex(256, 170, (x, w, h) => {
    x.fillStyle = '#000'; x.fillRect(0, 0, w, h);
    x.strokeStyle = '#fff'; x.lineWidth = 10; x.beginPath(); x.arc(92, 88, 44, Math.PI * 0.35, Math.PI * 1.65); x.stroke();   // a crescent moon
    x.beginPath(); x.arc(118, 74, 36, Math.PI * 0.42, Math.PI * 1.58); x.lineWidth = 9; x.strokeStyle = '#000'; x.stroke();
    txt(x, 'z', 170, 92, { font: '800 64px Archivo', color: '#fff' }); txt(x, 'z', 206, 56, { font: '800 44px Archivo', color: '#fff' });
  });
  const faceMat = new THREE.MeshBasicMaterial({ color: AMBER.clone().multiplyScalar(0.1), map: icon, transparent: true, toneMapped: false });
  const face = new THREE.Mesh(new THREE.PlaneGeometry(0.024, 0.016), faceMat); face.position.z = 0.0062; g.add(face);
  const haloMat = new THREE.MeshBasicMaterial({ color: AMBER.clone(), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false,
    map: canvasTex(256, 256, (x, w) => { const gr = x.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.35, 'rgba(255,255,255,0.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(0, 0, w, w); }) });
  const halo = new THREE.Mesh(new THREE.PlaneGeometry(0.08, 0.06), haloMat); halo.position.z = 0.0075; halo.renderOrder = 9; g.add(halo);
  const tapeTex = canvasTex(640, 280, (x, w, h) => {
    x.fillStyle = '#c9c2b2'; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 260; i++) { x.fillStyle = `rgba(0,0,0,${0.03 + 0.04 * hash(i * 3.1)})`; x.fillRect(hash(i) * w, hash(i * 1.7) * h, 3, 1 + hash(i * 2.3) * 3); }
    x.save(); x.translate(w / 2, h / 2 + 6); x.rotate(-0.06); txt(x, 'COFFEE', 0, 0, { font: '800 120px Archivo', color: '#1d1d1f', track: 2 }); x.restore();
  });
  const tape = new THREE.Group(); g.add(tape);
  const tg = new THREE.PlaneGeometry(0.054, 0.024, 16, 2), tp = tg.attributes.position;
  for (let i = 0; i < tp.count; i++) { const xx = tp.getX(i); if (Math.abs(xx) > 0.0265) tp.setY(i, tp.getY(i) * (0.82 + 0.3 * hash(i * 7.7))); }   // torn ends
  const tm = new THREE.Mesh(tg, phys({ map: tapeTex, roughness: 0.55, clearcoat: 0.3, side: THREE.DoubleSide })); tape.add(tm); tm.castShadow = true;
  tape.visible = false;
  return { g, faceMat, haloMat, tape };
}

// ------------------------------------------------------------------ the split-flap board on the bedside table
const FL = { cols: 22, rows: 4, cw: 74, ch: 150, gx: 6, gy: 14, pad: 30 };
const BOARD_ROWS = [   // each row: [time, text, colour]
  [[0, '', 'w'], [43.4, '       TONIGHT', 'm'], [T.so2, '   FOR A 07:00 ALARM', 'm']],
  [[0, '', 'w'], [43.7, 'BODY CLOCK       NIGHT', 'w'], [T.daytime - 0.05, 'BODY CLOCK         DAY', 'w'], [T.bed2 - 0.05, 'IN BED BY        23:00', 'o']],
  [[0, '', 'w'], [43.8, 'SLEEP HORMONE      DUE', 'w'], [T.late - 0.05, 'SLEEP HORMONE  DELAYED', 'a'], [T.coffee3 - 0.05, 'LAST COFFEE      14:00', 'o']],
  [[0, '', 'w'], [43.9, 'ALARM            07:00', 'w'], [T.on - 0.1, 'ALARM          ON TIME', 'w'], [T.lights - 0.05, 'LIGHTS LOW       20:00', 'o']],
];
const FLAP_CH = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789:';
function makeBoard(scene) {
  const g = new THREE.Group(); g.position.set(BOARD.x, BOARD.y, BOARD.z); g.rotation.y = BOARD.ry; scene.add(g);
  const cw = FL.cols * (FL.cw + FL.gx) - FL.gx + 2 * FL.pad, chh = FL.rows * (FL.ch + FL.gy) - FL.gy + 2 * FL.pad;
  const Wb = 0.44, Hb = Wb * (chh / cw);
  const lac = phys({ color: 0x0e0f11, roughness: 0.3, clearcoat: 0.7, clearcoatRoughness: 0.2 });
  const body = new THREE.Mesh(new RoundedBoxGeometry(Wb + 0.024, Hb + 0.024, 0.05, 4, 0.006), lac); body.position.set(0, 0, 0); g.add(body);
  const tex = canvasTex(cw, chh, (x, w, h) => { x.fillStyle = '#060607'; x.fillRect(0, 0, w, h); });
  const faceMat = new THREE.MeshBasicMaterial({ map: tex, toneMapped: true }); faceMat.color.setScalar(0.95);
  const face = new THREE.Mesh(new THREE.PlaneGeometry(Wb, Hb), faceMat); face.position.set(0, 0, 0.0252); g.add(face);
  shadows(g); face.castShadow = false; g.traverse((o) => o.layers.enable(1));
  return { g, tex, c: tex.userData.canvas, key: '', Wb, Hb };
}
const COLS = { w: '#eceef1', m: '#9da2ab', a: '#ffb347', o: '#ff6a2b' };
const VAL0 = 14;
function flapCell(x, px, py, ch, from, to, p, colFrom, colTo) {   // one split-flap cell mid-flip (p 0..1), or at rest (p >= 1)
  const w = FL.cw, h = FL.ch, mid = py + h / 2;
  const draw = (c, col, half) => { x.save(); x.beginPath(); if (half === 'top') x.rect(px, py, w, h / 2); else x.rect(px, mid, w, h / 2); x.clip();
    x.fillStyle = '#17181c'; x.beginPath(); x.roundRect(px, py, w, h, 8); x.fill();
    txt(x, c, px + w / 2, mid + 4, { font: '600 118px Archivo', color: COLS[col] }); x.restore(); };
  if (p >= 1) { draw(to, colTo, 'top'); draw(to, colTo, 'bottom'); }
  else {
    draw(to, colTo, 'top'); draw(from, colFrom, 'bottom');
    if (p < 0.5) { const k = Math.cos(p * Math.PI); x.save(); x.translate(0, mid); x.scale(1, k); x.translate(0, -mid); draw(from, colFrom, 'top'); x.restore(); }
    else { const k = -Math.cos(p * Math.PI); x.save(); x.translate(0, mid); x.scale(1, k); x.translate(0, -mid); draw(to, colTo, 'bottom'); x.restore(); }
  }
  x.fillStyle = '#000'; x.fillRect(px, mid - 1.5, w, 3);
}
function drawBoard(B, t) {
  const st = BOARD_ROWS.map((row) => { let i = 0; while (i + 1 < row.length && row[i + 1][0] <= t) i++; return i; });
  const flipping = BOARD_ROWS.some((row, r) => t - row[st[r]][0] < 0.03 * FL.cols + 0.6);
  const key = st.join() + (flipping ? '|' + t.toFixed(2) : ''); if (key === B.key) return; B.key = key;
  const x = B.c.getContext('2d'); x.fillStyle = '#060607'; x.fillRect(0, 0, B.c.width, B.c.height);
  BOARD_ROWS.forEach((row, r) => {
    const cur = row[st[r]], prev = st[r] > 0 ? row[st[r] - 1] : [0, '', 'w'];
    const a = cur[1].padEnd(FL.cols).slice(0, FL.cols), b = prev[1].padEnd(FL.cols).slice(0, FL.cols);
    for (let j = 0; j < FL.cols; j++) {
      const px = FL.pad + j * (FL.cw + FL.gx), py = FL.pad + r * (FL.ch + FL.gy);
      const cc = (st0) => (r === 0 || j >= VAL0 ? st0 : 'w'), curC = cc(cur[2]), prevC = cc(prev[2]);
      const t0 = cur[0] + 0.03 * j + 0.012 * r, dur = 0.42;
      if ((a[j] === b[j] && curC === prevC) || t >= t0 + dur) { flapCell(x, px, py, '', a[j], a[j], 1, curC, curC); continue; }
      if (t < t0) { flapCell(x, px, py, '', b[j], b[j], 1, prevC, prevC); continue; }
      const q = (t - t0) / dur * 3, step = Math.floor(q), p = q - step;   // two random letters on the way, then the new one
      const seq = [b[j], FLAP_CH[Math.floor(hash(j * 7.1 + r * 3.3 + cur[0]) * FLAP_CH.length)], FLAP_CH[Math.floor(hash(j * 5.9 + r * 1.7 + cur[0]) * FLAP_CH.length)], a[j]];
      flapCell(x, px, py, '', seq[step], seq[step + 1], p, step === 0 ? prevC : curC, curC);
    }
  });
  B.tex.needsUpdate = true;
}

// ------------------------------------------------------------------ a window over the bed: dark blue at night, gold at sunrise and sunset, white in the day
function makeWindow(scene) {
  const g = new THREE.Group(); g.position.set(0, 1.6, WALL_Z + 0.012); scene.add(g);
  const frameMat = phys({ color: 0x0d0e10, roughness: 0.5, clearcoat: 0.4 }), W0 = 0.86, H0 = 0.62;
  const bar = (w, h, x, y) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.03), frameMat); m.position.set(x, y, 0.013); m.castShadow = true; g.add(m); };
  bar(W0 + 0.06, 0.04, 0, H0 / 2 + 0.014); bar(W0 + 0.06, 0.04, 0, -H0 / 2 - 0.014); bar(0.04, H0 + 0.06, -W0 / 2 - 0.014, 0); bar(0.04, H0 + 0.06, W0 / 2 + 0.014, 0);
  bar(0.022, H0, -W0 / 6, 0); bar(0.022, H0, W0 / 6, 0); bar(W0, 0.022, 0, 0);
  const sky = canvasTex(256, 184, (x, w, h) => { x.fillStyle = '#0a1022'; x.fillRect(0, 0, w, h); });
  const paneMat = new THREE.MeshBasicMaterial({ map: sky });
  const pane = new THREE.Mesh(new THREE.PlaneGeometry(W0, H0), paneMat); g.add(pane);
  const sill = new THREE.Mesh(new RoundedBoxGeometry(W0 + 0.12, 0.025, 0.08, 3, 0.006), frameMat); sill.position.set(0, -H0 / 2 - 0.04, 0.03); g.add(sill);
  return { g, paneMat, sky, key: '' };
}
const SKY = { night: [[10, 16, 34], [18, 26, 51]], day: [[62, 112, 186], [168, 200, 232]], gold: [[78, 92, 150], [238, 158, 96]] };
function drawSky(Wn, hr) {   // the sky through the window at hour hr: stars at night, the sun's arc by day, warm at dawn and dusk
  const key = hr.toFixed(2); if (Wn.key === key) return; Wn.key = key;
  const day = ss(6.6, 8.2, hr) * (1 - ss(19.2, 20.6, hr)), gold = Math.min(1, ss(6.4, 7.4, hr) * (1 - ss(7.6, 9.0, hr)) + ss(16.8, 18.2, hr) * (1 - ss(19.0, 20.2, hr)));
  const c = Wn.sky.userData.canvas, x = c.getContext('2d'), w = c.width, h = c.height;
  const mix = (k) => SKY.night[k].map((v, i) => Math.round(lerp(lerp(v, SKY.day[k][i], day), SKY.gold[k][i], gold * 0.85)));
  const gr = x.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, `rgb(${mix(0)})`); gr.addColorStop(1, `rgb(${mix(1)})`);
  x.fillStyle = gr; x.fillRect(0, 0, w, h);
  const night = 1 - Math.max(day, gold);
  if (night > 0.02) for (let i = 0; i < 26; i++) { x.fillStyle = `rgba(220,228,255,${((0.25 + 0.5 * hash(i * 3.7)) * night).toFixed(3)})`; x.fillRect(hash(i * 1.3) * w, hash(i * 2.1 + 5) * h * 0.8, 1.6, 1.6); }
  const u = (hr - 6.4) / 13.2;   // the sun: up on the left at about half past six, high at one, down on the right at about half past seven
  if (u > -0.08 && u < 1.08) {
    const sx = w * (0.12 + 0.76 * u), sy = h * (1.14 - 0.98 * Math.sin(Math.PI * clamp01(u))), core = gold > 0.3 ? '255,206,140' : '255,247,224';
    const rg = x.createRadialGradient(sx, sy, 0, sx, sy, 50); rg.addColorStop(0, `rgba(${core},0.9)`); rg.addColorStop(0.28, `rgba(${core},0.32)`); rg.addColorStop(1, `rgba(${core},0)`);
    x.fillStyle = rg; x.fillRect(0, 0, w, h); x.fillStyle = `rgb(${core})`; x.beginPath(); x.arc(sx, sy, 12, 0, Math.PI * 2); x.fill();
  }
  Wn.sky.needsUpdate = true;
}

// ------------------------------------------------------------------ steam off the cup
function makeSteam(scene, at) {
  const out = [];
  for (let i = 0; i < 3; i++) {
    const mat = new THREE.ShaderMaterial({
      uniforms: { uTime: TIME, uAmt: { value: 0 }, uSeed: { value: i * 3.17 } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: `uniform float uTime, uAmt, uSeed; varying vec2 vUv;
        float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h(i), h(i + vec2(1.0, 0.0)), f.x), mix(h(i + vec2(0.0, 1.0)), h(i + vec2(1.0, 1.0)), f.x), f.y); }
        float fbm(vec2 p){ float a = 0.5, s = 0.0; for (int k = 0; k < 5; k++) { s += a * n(p); p = p * 2.03 + 7.1; a *= 0.5; } return s; }
        void main(){ float t = uTime * 0.3; vec2 p = vec2(vUv.x * 3.0 + uSeed, vUv.y * 1.6 - t);
          float q = fbm(vec2(p.x * 0.55, p.y * 0.8 + uSeed * 1.3)); p.x += (q - 0.5) * 2.2 * (0.25 + vUv.y);
          float w = fbm(p * vec2(1.0, 0.5)); float strands = smoothstep(0.5, 0.74, w);
          float env = smoothstep(0.0, 0.12, vUv.y) * (1.0 - smoothstep(0.35, 1.0, vUv.y)) * smoothstep(0.0, 0.35, vUv.x) * (1.0 - smoothstep(0.65, 1.0, vUv.x));
          gl_FragColor = vec4(vec3(1.0, 0.96, 0.92), strands * env * uAmt); }`,
      transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false, blending: THREE.AdditiveBlending,
    });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.09, 0.2), mat); m.position.set(at.x + (i - 1) * 0.008, at.y + 0.17, at.z + (i - 1) * 0.006); m.renderOrder = 7; scene.add(m); out.push(m);
  }
  return out;
}

// ------------------------------------------------------------------ build
async function build(S, cfg) {
  const scene = S.scene;
  S.fog.near = 4; S.fog.far = 14;
  S.table.scale.set(3, 3, 1); S.tableMat.clearcoat = 0.12; S.tableMat.specularIntensity = 0.35;
  for (const m of [S.tableMat.map, S.tableMat.roughnessMap]) if (m) { m.wrapS = m.wrapT = THREE.RepeatWrapping; m.repeat.multiplyScalar(3); }
  // ---- the skeleton, rigged; the body group's origin is the pelvis
  const meshes = await loadAnatomy(skeletonKind());
  const R = W.rig = buildRig(meshes);
  W.body = new THREE.Group(); scene.add(W.body); R.root.position.copy(R.P0).negate(); W.body.add(R.root);
  for (const m of meshes) { m.castShadow = true; m.receiveShadow = true; m.layers.enable(1); }
  W.meshes = meshes;
  W.vault = meshes.filter((m) => /frontal bone|parietal bone|occipital bone|temporal bone/i.test(m.userData.name));
  for (const m of W.vault) { m.material = m.material.clone(); m.material.transparent = true; }
  // hands that hold
  W.wristL = makeWrist(R, 'Left'); W.wristR = makeWrist(R, 'Right');
  W.handL = rigHand(R, 'Left', W.wristL); W.handR = rigHand(R, 'Right', W.wristR); W.handL.wr = W.wristL; W.handR.wr = W.wristR;
  // the lower jaw on its own hinge (a yawn)
  { const jaw = meshes.filter((m) => /^mandible$|lower .*tooth/i.test(m.userData.name)), mv = worldVerts(R.byName.get('Mandible'), 2);
    let top = -9; for (const v of mv) top = Math.max(top, v.y); const hi = mv.filter((v) => v.y > top - 0.012), zc = hi.reduce((s, v) => s + v.z, 0) / hi.length;
    const TMJ = new THREE.Vector3(0, top - 0.008, Math.min(...hi.filter((v) => v.z < zc).map((v) => v.z)) + 0.012);
    const seg = R.seg.Atlas; W.jaw = new THREE.Group(); W.jaw.position.copy(TMJ).sub(seg.pivot); seg.g.add(W.jaw);
    for (const m of jaw) { m.removeFromParent(); m.position.copy(m.userData.home).sub(TMJ); W.jaw.add(m); } }
  // ---- the factory stamp: on the front of the breastbone
  { const st = R.byName.get('Body of sternum'); st.material = st.material.clone();
    W.stampSpot = stampSpot(st, { from: [0, 0.006, 0.12], dir: [0, 0, -1], spread: 0.004 });
    if (W.stampSpot) W.stamp = stamp(st, { canvas: stampCanvas(['HUMAN FACTORY', 'SETTINGS'], '', { frame: false }), center: W.stampSpot.center, normal: W.stampSpot.normal, up: [0, 1, 0], width: 0.04, depth: 0.03, opacity: 0.6 }); }
  // ---- the set
  W.bed = makeBed(scene);
  makeTable(scene);
  { const wall = new THREE.Mesh(new THREE.PlaneGeometry(9, 3.2), phys({ color: 0x1b1d22, roughness: 0.92, roughnessMap: noiseTex(9, 256, 0.85, 1.0, 30) })); wall.position.set(0, 1.6, WALL_Z); wall.receiveShadow = true; scene.add(wall); }
  W.clock = makeClock(); W.clock.g.position.copy(CLOCK); W.clock.g.rotation.y = 0.95; W.clock.g.scale.setScalar(1.25); scene.add(W.clock.g);
  W.clock.arcMat.color.set(0x3f66d8); W.clock.arcGhostMat.color.set(0x9aa0aa); W.clock.markMat.opacity = 1; W.clock.g.traverse((o) => o.layers.enable(1));
  W.logo = makeLogoRing(0.044); W.logo.g.position.z = W.clock.D / 2 + 0.0012; W.clock.body.add(W.logo.g);
  W.cup = makeCup(); W.cup.g.position.copy(CUP); W.cup.g.rotation.y = 2.2; scene.add(W.cup.g); W.cup.g.traverse((o) => o.layers.enable(1));
  W.steam = makeSteam(scene, CUP);
  W.lamp = makeLamp(); W.lamp.g.position.copy(LAMP); scene.add(W.lamp.g); W.lamp.g.traverse((o) => o.layers.enable(1));
  W.lampLight = new THREE.PointLight(0xffc98a, 0, 3.0, 2); W.lampLight.position.copy(LAMP).add(new THREE.Vector3(0, 0.27, 0)); scene.add(W.lampLight);
  W.board = makeBoard(scene);
  W.window = makeWindow(scene);
  W.phone = makePhone(); scene.add(W.phone.g); W.phone.g.traverse((o) => o.layers.enable(1));
  W.phone.feed = document.createElement('canvas'); W.phone.feed.width = 590; W.phone.feed.height = 1220;
  W.phone.feedTex = new THREE.CanvasTexture(W.phone.feed); W.phone.feedTex.colorSpace = THREE.SRGBColorSpace; W.phone.feedTex.anisotropy = 8;
  W.phone.screenMat.map = W.phone.feedTex; W.phone.screenMat.needsUpdate = true; drawFeed(W.phone, 0, '23:46');
  W.phoneLight = new THREE.SpotLight(0xbcd2ff, 0, 0.9, 0.9, 0.8, 2); scene.add(W.phoneLight, W.phoneLight.target);
  // ---- lying and sitting: measure the pose, place the body, press the bed (as in film 8)
  W.qLie = new THREE.Quaternion().setFromAxisAngle(X, -Math.PI / 2);
  poseRig(restPose()); W.body.quaternion.copy(W.qLie); W.body.position.set(0, 0, 0); W.body.updateMatrixWorld(true);
  const bb = (re) => { const b = new THREE.Box3(); for (const m of W.meshes) if (re.test(m.userData.name)) b.expandByObject(m); return b; };
  const heel = bb(/calcaneus/i), skull = bb(/parietal bone|occipital bone|frontal bone/i), occ = bb(/occipital bone/i);
  W.lieP = new THREE.Vector3(0, BED.top - 0.012 - heel.min.y, BED.z0 + 0.075 - skull.min.z);
  const occY = occ.min.y + W.lieP.y, occZ = (occ.min.z + occ.max.z) / 2 + W.lieP.z;
  const ph = (occY + 0.04 - BED.top) / 2;
  W.pillow = makePillow(scene, new THREE.Vector3(0, BED.top + ph - 0.004, occZ - 0.03), new THREE.Vector3(0.3, ph, 0.19));
  const hipB = new THREE.Box3(); for (const m of W.meshes) if (/hip bone/i.test(m.userData.name)) for (const v of worldVerts(m, 3)) hipB.expandByPoint(v);
  W.qSit = new THREE.Quaternion().setFromAxisAngle(Y, Math.PI / 2);
  W.sitP = new THREE.Vector3(BED.x1 - 0.13, BED.top - 0.025 + (R.P0.y - hipB.min.y), W.lieP.z + 0.02);
  const grab = () => { W.body.updateMatrixWorld(true); const out = []; const v = new THREE.Vector3();
    for (const m of W.meshes) { const P = m.geometry.attributes.position; for (let i = 0; i < P.count; i += 2) { v.fromBufferAttribute(P, i).applyMatrix4(m.matrixWorld); out.push(v.x, v.y, v.z); } } return out; };
  const grid = { x0: BED.x0, x1: BED.x1, z0: BED.z0, z1: BED.z1, nx: MAT.nx, nz: MAT.nz }, surf = (x, z) => BED.top - edgeDrop(x, z);
  W.body.position.copy(W.lieP); const lyingPts = grab();
  W.dentLie = imprint(lyingPts, grid, surf, { gap: 0.002, dil: 2, blur: 4, max: 0.08 });
  // the face, lying: where the phone is held and where it lands
  { const face = bb(/frontal bone|nasal bone|maxilla|zygomatic bone/i); W.faceTop = face.max.y; W.faceC = face.getCenter(new THREE.Vector3());
    const nose = bb(/nasal bone/i), brow = bb(/frontal bone/i); W.noseTop = nose.max.y; W.noseC = nose.getCenter(new THREE.Vector3()); W.browTop = brow.max.y; }
  // where the dropped phone comes to rest: on the face, just touching it (1.5 mm off the bone: the skin)
  { const qL = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.18, 0, Math.PI + 0.05)), x = W.noseC.x, z = (W.noseC.z + W.faceC.z) / 2 - 0.01, pts = [];
    R.seg.Atlas.g.traverse((m) => { if (!m.isMesh || !['bone', 'tooth', 'cartilage'].includes(m.userData.tissue)) return; m.updateMatrixWorld(true);
      const P = m.geometry.attributes.position, st = Math.max(1, Math.floor(P.count / 500)); for (let i = 0; i < P.count; i += st) pts.push(new THREE.Vector3().fromBufferAttribute(P, i).applyMatrix4(m.matrixWorld)); });
    const M = new THREE.Matrix4(), v = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1);
    const clear = (y) => { M.compose(v.set(x, y, z), qL, one).invert(); let mn = 9; for (const p of pts) mn = Math.min(mn, phoneSDF(v.copy(p).applyMatrix4(M))); return mn; };
    let lo = W.noseTop - 0.03, hi = W.noseTop + 0.08; for (let i = 0; i < 30; i++) { const m = (lo + hi) / 2; if (clear(m) >= 0.0015) hi = m; else lo = m; }
    W.land = new THREE.Vector3(x, hi, z); W.landQ = qL; }
  W.holdAt = new THREE.Vector3(0.0, W.faceTop + 0.26, W.faceC.z + 0.07);
  // the phone in one hand, the way it is held in bed: palm on its back, fingers across it and round the far long edge, thumb
  // on the near one (and the risk of dropping it on the face). Solved once, lying: the forearm rises from the chest, clear
  // of the head and the trunk; then the fingers close until they meet the phone, a few millimetres off it (the flesh not drawn)
  { const zone = (re, m) => { const b = bb(re); return { c: b.getCenter(new THREE.Vector3()), r: b.getSize(new THREE.Vector3()).multiplyScalar(0.5).addScalar(m) }; };
    W.zHead = zone(/frontal bone|parietal bone|occipital bone|temporal bone|sphenoid|maxilla|zygomatic|nasal bone|mandible|tooth/i, 0.035);
    W.zChest = zone(/\brib\b|sternum|manubrium|xiphoid|costal/i, 0.02);
    const held = new THREE.Vector3(W.holdAt.x, W.holdAt.y + 0.004, W.holdAt.z), qp = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, Math.PI + PHONE_TILT));
    W.phoneHold = new THREE.Matrix4().compose(held, qp, new THREE.Vector3(1, 1, 1)); const toPhone = W.phoneHold.clone().invert(), v = new THREE.Vector3();
    W.phoneSlip = new THREE.Vector3(-1, 0, 0).applyQuaternion(qp);   // the way it slips out of the hand when let go
    const Side = 'Right', H = W.handR, A = R.arms[Side], pts = [];
    H.wr.g.traverse((m) => { if (!m.isMesh) return; const P = m.geometry.attributes.position, st = Math.max(1, Math.floor(P.count / 40)), fing = /phalanx/i.test(m.userData.name), need = fing ? 0.003 : 0.007;
      for (let i = 0; i < P.count; i += st) pts.push({ m, p: new THREE.Vector3().fromBufferAttribute(P, i), need, fing }); });
    // how far the hand's bones come inside their gap round the phone (fingers 3 mm, palm 7 mm)
    const pen = (palmOnly = false) => { let E = 0, worst = 0, who = ''; for (const q of pts) { if (palmOnly && q.fing) continue; v.copy(q.p).applyMatrix4(q.m.matrixWorld).applyMatrix4(toPhone); const d = q.need - phoneSDF(v); if (d > 0) { E += d; if (d > worst) { worst = d; who = q.m.userData.name; } } } return { E, worst, who }; };
    const ko = keepOut(R, Side, H, [W.zHead, W.zChest]);
    // the grip point (phone local; +x is the right hand's side, +y the screen side): the palm ~9 mm above the back, the
    // knuckles over the far half, so the fingers bend round the far long edge at their middle joints
    const target = new THREE.Vector3(-0.021, 0.011, 0.02).applyQuaternion(qp).add(held);
    const aims = [{ v: H.n, to: new THREE.Vector3(0, 1, 0).applyQuaternion(qp), w: 0.3 }, { v: H.fdir, to: new THREE.Vector3(-1, 0, 0).applyQuaternion(qp), w: 0.2 }];
    const init = { dir: [0.35, 0.1, 1], twist: -0.6, elbow: 1.6 };
    H.curl(0.08, null, 0.08, HOLD_PROF);
    const sol = solveHand(R, Side, H, target, init, aims, () => ko() + 2 * pen(true).E,   // the palm clear of it; the fingers are closed on it after
      [init, { dir: [0.6, 0.3, 0.8], twist: -1.2, elbow: 1.4 }, { dir: [0.2, 0.0, 1], twist: 0.4, elbow: 1.8 }, { dir: [0.5, -0.2, 0.9], twist: -1.8, elbow: 1.2 }]);
    poseArm(A, sol); setWrist(H.wr, sol); A.girdle.updateMatrixWorld(true);
    // each finger and the thumb close until they are 3 mm off the phone
    const g = H.fit((p) => phoneSDF(v.copy(p).applyMatrix4(toPhone)), { need: 0.003, kmin: 0.05, kmax: 0.95, prof: HOLD_PROF, tmin: -0.8 });
    H.curl(0, g.per, g.tk, HOLD_PROF); A.girdle.updateMatrixWorld(true); const left = pen(); H.curl(0.12);
    W.holdR = { ...sol, per: g.per, tk: g.tk }; W.holdL = null;
    W.holdInfo = { dbg: sol.dbg, per: g.per.map((k) => +k.toFixed(2)), tk: +g.tk.toFixed(2), worst: +(left.worst * 1000).toFixed(1), who: left.who, keep: +ko().toFixed(4) }; }
  poseRig(restPose()); W.body.updateMatrixWorld(true);
  // the grains, settled for the body as it lies
  W.grains = makeGrains(R); settleGrains(W.grains);
  W.vac = makeVacuum(scene);
  W.warn = makeWarning(R);
  // sitting, for the morning
  poseRig(sitPose()); W.body.quaternion.copy(W.qSit); W.body.position.copy(W.sitP);
  for (const Side of ['Right', 'Left']) legIK(R, Side, footTarget(Side), W.qSit, X);
  W.dentSit = imprint(grab(), grid, surf, { gap: 0.002, dil: 2, blur: 4, max: 0.06 });
  { const P = W.pillow.base, c = W.pillow.m.position, cell = new Map(), key = (x, z) => `${Math.round(x / 0.008)},${Math.round(z / 0.008)}`;
    for (let p = 0; p < lyingPts.length; p += 3) { const x = lyingPts[p] - c.x, y = lyingPts[p + 1] - c.y, z = lyingPts[p + 2] - c.z; if (Math.abs(x) > 0.32 || Math.abs(z) > 0.21) continue; const k = key(x, z); cell.set(k, Math.min(cell.get(k) ?? 9, y)); }
    W.pillowDent = new Float32Array(P.length / 3);
    for (let i = 0; i < P.length / 3; i++) { const x = P[i * 3], y = P[i * 3 + 1], z = P[i * 3 + 2]; if (y < 0) continue; let lo = 9;
      for (let a = -3; a <= 3; a++) for (let b = -3; b <= 3; b++) { const v = cell.get(`${Math.round(x / 0.008) + a},${Math.round(z / 0.008) + b}`); if (v !== undefined) lo = Math.min(lo, v + 0.004 + 0.0012 * (a * a + b * b)); }
      W.pillowDent[i] = Math.max(0, y - lo); } }
  // ---- light: the moon (or the sun) through a window, a cold rim, a fill, the table
  const cookie = canvasTex(512, 512, (x, w) => { x.fillStyle = '#000'; x.fillRect(0, 0, w, w); x.filter = 'blur(4px)'; x.fillStyle = '#fff';
    const m = 50, gap = 26, pw = (w - 2 * m - gap * 2) / 3, phh = (w - 2 * m - gap * 3) / 4;
    for (let i = 0; i < 3; i++) for (let j = 0; j < 4; j++) x.fillRect(m + i * (pw + gap), m + j * (phh + gap), pw, phh); });
  cookie.colorSpace = THREE.NoColorSpace;
  W.key = spot(scene, { color: 0xb8c8ff, pos: new THREE.Vector3(2.6, 2.6, -0.6), target: new THREE.Vector3(0.05, 0.5, -0.15), angle: 0.42, penumbra: 0.35, shadow: true, size: cfg.shadow ?? 1024 });
  W.key.map = cookie; W.key.shadow.camera.far = 7;
  W.rim = spot(scene, { color: 0x9fb6ff, pos: new THREE.Vector3(-0.9, 1.9, -2.2), target: new THREE.Vector3(0, 0.55, -0.4), angle: 0.5, penumbra: 0.9 });
  W.fill = spot(scene, { color: 0xc8d6ff, pos: new THREE.Vector3(-1.8, 1.4, 1.6), target: new THREE.Vector3(0, 0.5, -0.1), angle: 0.6, penumbra: 1 });
  W.tableLight = spot(scene, { color: 0xdfe6ff, pos: new THREE.Vector3(1.4, 1.6, -0.25), target: new THREE.Vector3(0.82, TBL.top + 0.1, -0.85), angle: 0.32, penumbra: 0.8 });
  W.headLight = spot(scene, { color: 0xc4d2ff, pos: new THREE.Vector3(-0.35, 1.35, -0.55), target: new THREE.Vector3(0, 0.62, -0.88), angle: 0.26, penumbra: 0.9 });
  return { stamp: W.stampSpot, lieP: W.lieP.toArray(), faceTop: W.faceTop, holdAt: W.holdAt.toArray(), hold: W.holdInfo, grainsE: [W.grains.E.c.toArray(), W.grains.E.r.toArray()], levelLo: W.grains.levelY[0], levelHi: W.grains.levelY[W.grains.N - 1] };
}

// ------------------------------------------------------------------ the body over time
const ARM_LIE = { dir: [-0.1, -1, -0.09], twist: 0, elbow: 0.1 }, ARM_PUSH = { dir: [0.28, -0.95, -0.2], twist: 0, elbow: 0.25 };
const ARM_REST = { dir: [0.1, -0.9, 0.42], twist: 0.6, elbow: 1.1 };   // sitting, hands on the knees
function restPose() { return { up: 0, swivel: 0, move: 0, knee: 0, ik: 0, cer: 0.3, tho: 0, lum: 0, turn: 0, jaw: 0, hold: 0, push: 0, rest: 0 }; }
function sitPose() { return { ...restPose(), up: 1, swivel: 1, move: 1, knee: 1, ik: 1, cer: 0.12, tho: 0.12, rest: 1 }; }
function footTarget(Side) { const G = W.rig.legs[Side], ah = G.A.y - G.ground; return new THREE.Vector3(W.sitP.x + 0.43, ah + 0.002, W.sitP.z + (Side === 'Right' ? 0.11 : -0.11)); }
const DROP = { t0: T.lets - 0.35, hit: T.fix - 0.02 };
const PHONE_TILT = 0.32;   // the phone is held tilted toward the bedside
const HOLD_PROF = FLAT_WRAP;
function bodyAt(t) {
  const o = restPose();
  o.hold = 1 - s5(DROP.t0 + 0.05, DROP.t0 + 1.3, t);
  o.grip = 1 - s5(DROP.t0 - 0.3, DROP.t0 + 0.02, t);   // the fingers open first, then it slips
  o.thumbOut = s5(DROP.t0 - 0.3, DROP.t0, t) * (1 - s5(DROP.hit + 0.2, DROP.hit + 0.7, t));
  o.jaw = 0.46 * pulse(t, T.always - 0.35, T.lets - 0.2, 0.45);
  o.cer = 0.3 - 0.35 * pulse(t, T.always - 0.35, T.lets - 0.2, 0.45);
  const G0 = T.if1 - 0.1;   // morning: he sits up on the edge of the bed
  o.up = s5(G0, G0 + 0.9, t); o.swivel = s5(G0 + 0.3, G0 + 1.25, t); o.move = s5(G0 + 0.25, G0 + 1.2, t); o.knee = s5(G0 + 0.55, G0 + 1.3, t); o.ik = s5(G0 + 0.95, G0 + 1.4, t);
  o.push = pulse(t, G0, G0 + 1.5, 0.45); o.rest = s5(G0 + 1.3, G0 + 2.2, t);
  o.cer = lerp(o.cer, 0.12, o.up); o.tho = lerp(0, 0.12, o.up);
  return o;
}
const mixA = (a, b, k) => ({ dir: a.dir.map((v, i) => lerp(v, b.dir[i], k)), twist: lerp(a.twist, b.twist, k), elbow: lerp(a.elbow, b.elbow, k), wf: lerp(a.wf || 0, b.wf || 0, k), wd: lerp(a.wd || 0, b.wd || 0, k), wr: lerp(a.wr || 0, b.wr || 0, k), mix: [a, b, k] });
const _qa = new THREE.Quaternion(), _qb = new THREE.Quaternion(), _qc = new THREE.Quaternion();
function poseRig(o) {
  const R = W.rig;
  bendSpine(R.seg, { lum: 0, tho: o.tho, cer: o.cer });
  for (const n of ['Atlas', 'Axis', 'Third cervical vertebra']) R.seg[n].g.rotation.y += o.turn / 3;
  if (W.jaw) W.jaw.rotation.x = o.jaw;
  const hk = s5(0, 1, o.hold || 0);
  for (const [Side, Hs] of [['Right', W.holdR], ['Left', W.holdL]]) {
    let a = mixA(mixA(ARM_LIE, ARM_PUSH, o.push), ARM_REST, o.rest);
    if (Hs && hk > 0) a = mixA(a, Hs, hk);
    poseArm(R.arms[Side], a); if (W.wristR) setWrist(Side === 'Right' ? W.wristR : W.wristL, a);
  }
  if (W.handR) { const g = s5(0, 1, o.grip ?? o.hold ?? 0), hkP = s5(0, 1, o.hold || 0), Hh = W.holdR;
    // letting go: the fingers relax (keeping their flat shape while the phone is near), the thumb swings out from under it
    const tb = lerp(0.12, -0.8, o.thumbOut || 0);
    const fb = lerp(0.12, -0.2, o.thumbOut || 0);
    if (Hh) W.handR.curl(0, Hh.per.map((k) => lerp(Math.min(fb, k), k, g)), lerp(Math.min(tb, Hh.tk), Hh.tk, g), FIST.map((f, j) => lerp(f, HOLD_PROF[j], hkP))); else W.handR.curl(0.12);
    W.handL.curl(0.12); }
  if (W.handR) clearArms(R);   // no arm through the trunk, in any pose or between poses
  for (const Side of ['Right', 'Left']) {
    const G = R.legs[Side], s = G.s, lie = 1 - o.up;
    _qa.setFromAxisAngle(X, -(Math.PI / 2) * o.up); _qb.setFromAxisAngle(Z, 0.1 * s * o.knee); _qc.setFromAxisAngle(Y, 0.22 * s * lie);
    G.hip.quaternion.multiplyQuaternions(_qa, _qb).multiply(_qc);
    G.knee.quaternion.setFromAxisAngle(X, (Math.PI / 2) * o.knee);
    G.ankle.quaternion.setFromAxisAngle(X, lerp(0.62, 0, o.knee));
  }
}
function placeBody(o, t) {
  _qa.setFromAxisAngle(X, -(Math.PI / 2) * (1 - o.up)); _qb.setFromAxisAngle(Y, (Math.PI / 2) * o.swivel);
  W.body.quaternion.multiplyQuaternions(_qb, _qa);
  W.body.position.lerpVectors(W.lieP, W.sitP, o.move); W.body.position.y += 0.04 * Math.sin(Math.PI * o.move) + (W.sitP.y - W.lieP.y) * (o.up - o.move) * 0.6;
  // caffeinated: he buzzes like a phone on vibrate, in bursts
  const bz = buzzAt(t); if (bz > 0) { const f = Math.floor(t * 60); W.body.position.x += (hash(f * 1.3) - 0.5) * 0.009 * bz; W.body.position.z += (hash(f * 2.9 + 1) - 0.5) * 0.009 * bz; W.body.position.y += hash(f * 4.7 + 2) * 0.004 * bz; _qc.setFromAxisAngle(Y, (hash(f * 6.1 + 3) - 0.5) * 0.02 * bz); W.body.quaternion.premultiply(_qc); }
  W.body.updateMatrixWorld(true);
  if (o.ik > 0.001) for (const Side of ['Right', 'Left']) {
    const G = W.rig.legs[Side]; const h = G.hip.quaternion.clone(), k = G.knee.quaternion.clone(), a = G.ankle.quaternion.clone();
    legIK(W.rig, Side, footTarget(Side), W.body.quaternion, X);
    G.hip.quaternion.copy(h.slerp(G.hip.quaternion, o.ik)); G.knee.quaternion.copy(k.slerp(G.knee.quaternion, o.ik)); G.ankle.quaternion.copy(a.slerp(G.ankle.quaternion, o.ik));
  }
  W.body.updateMatrixWorld(true);
}
const BUZZ = [[T.caffeinated - 0.1, T.caffeinated + 0.45], [T.caffeinated + 0.7, T.caffeinated + 1.15]];
function buzzAt(t) { let b = 0; for (const [a, c] of BUZZ) b = Math.max(b, ss(a, a + 0.05, t) * (1 - ss(c - 0.05, c, t))); return b; }

// ------------------------------------------------------------------ the clock: seconds of the day, with the time-lapses
const CK = [
  [-5, 23 * H + 45 * 60], [T.scroll, 23 * H + 53 * 60], [T.midnight, 24 * H], [10.2, 24 * H + 12 * 60],
  [10.65, 31 * H], [13.7, 46 * H + 30 * 60], [14.45, 49 * H], [T.cut, 55 * H], [22.2, 55 * H + 25 * 60],
  [22.6, 56 * H], [28.3, 58 * H], [28.68, 66 * H], [T.eleven, 71 * H], [37.6, 73 * H + 20 * 60],
  [38.4, 84 * H], [40.1, 84 * H + 30 * 60], [41.6, 93 * H + 30 * 60], [43.2, 95 * H], [49.3, 97 * H], [T.alarm, 103 * H], [60, 103 * H + 6 * 60], [74.3, 103 * H + 30 * 60], [T.end, 103 * H + 31 * 60],
];
function clockAt(t) { return keys(CK, t); }
const RING = [[T.cut - 0.05, T.cut + 1.3], [T.alarm - 0.05, T.alarm + 1.4]];
function ringAt(t) { let r = 0; for (const [a, b] of RING) r = Math.max(r, ss(a, a + 0.04, t) * (1 - ss(b - 0.25, b, t))); return r; }
// the grains' fill (instances shown): a day's worth, cleaned until the alarm, the rest left over
function fillAt(t, N) {
  const full = 0.62 * N, left = 0.42 * N;
  let k = full * s5(T.all, T.sleepy + 0.2, t);
  const clean = clamp01((t - (T.cleaning + 0.35)) / (T.cut - (T.cleaning + 0.35)));
  if (t > T.cleaning + 0.35) k = lerp(full, left, clean < 1 ? clean : 1);
  return k;
}

// ------------------------------------------------------------------ the camera: one path, no cuts
let CAM = null;
function buildCam() {
  const C = W.clock.g.position, cf = new THREE.Vector3(Math.sin(0.95), 0, Math.cos(0.95)), Cc = C.clone().add(new THREE.Vector3(0, 0.0625 + 0.001, 0));   // the clock face's centre and its normal
  const B = new THREE.Vector3(BOARD.x, TBL.top + 0.11, BOARD.z), bn = new THREE.Vector3(Math.sin(BOARD.ry), 0, Math.cos(BOARD.ry));
  const hold = W.holdAt, f = W.faceC, top = W.faceTop;
  const head = V3(0, top - 0.06, f.z);
  W.camLogo = { p: Cc.clone().addScaledVector(cf, 0.6), l: Cc.clone() };
  return camTrack([
    { t: -3, p: V3(1.38, 0.96, -0.1), l: V3(0.75, 0.665, -0.71), fov: 32 },
    { t: 0.3, p: V3(1.36, 0.95, -0.11), l: V3(0.75, 0.665, -0.71), fov: 32, tens: 0.4 },                // the clock (23:46) and the cup
    { t: 2.7, p: V3(1.3, 0.96, -0.14), l: V3(0.74, 0.67, -0.72), fov: 32, tens: 0.4 },
    { t: 3.9, p: V3(0.66, 0.81, -0.34), l: V3(0.0, 0.88, -0.82), fov: 48 },                            // beside the bed, low: the feed over the face (under the words)
    { t: 9.9, p: V3(0.6, 0.8, -0.4), l: V3(0.0, 0.83, -0.84), fov: 46, tens: 0.4 },
    { t: 11.7, p: V3(0.05, 1.12, -0.6), l: V3(0.0, 0.6, -0.92), fov: 27 },                              // into the glass skull
    { t: 21.6, p: V3(0.05, 1.11, -0.61), l: V3(0.0, 0.6, -0.92), fov: 27, tens: 0.4 },
    { t: 23.1, p: V3(0.12, 1.02, -0.7), l: V3(0.0, 0.72, -0.88), fov: 26 },                             // the forehead: the light and the tape
    { t: 28.0, p: V3(0.12, 1.01, -0.71), l: V3(0.0, 0.72, -0.88), fov: 26, tens: 0.4 },
    { t: 29.3, p: V3(1.32, 0.93, -0.36), l: V3(0.76, 0.64, -0.72), fov: 32, tens: 0.25 },              // the cup and the clock
    { t: 33.1, p: V3(1.31, 0.93, -0.37), l: V3(0.76, 0.64, -0.72), fov: 32, tens: 0.4 },
    { t: 34.4, p: V3(0.95, 1.18, 0.02), l: V3(0.0, 0.55, -0.6), fov: 34 },                              // the upper body: he buzzes
    { t: 37.6, p: V3(0.94, 1.18, 0.04), l: V3(0.0, 0.55, -0.6), fov: 34, tens: 0.4 },
    { t: 39.2, p: V3(1.3, 1.22, 0.95), l: V3(0.18, 0.98, -1.0), fov: 42 },                              // the room and its window: sun, then the lamp and the screen
    { t: 43.0, p: V3(1.26, 1.2, 0.92), l: V3(0.2, 0.96, -1.0), fov: 42, tens: 0.4 },
    { t: 44.5, p: V3(BOARD.x, 1.06, WALL_Z + 1.78), l: V3(BOARD.x, 0.98, WALL_Z), fov: 34, tens: 0.15 },              // the board, the lamp under it
    { t: 59.9, p: V3(BOARD.x, 1.06, WALL_Z + 1.74), l: V3(BOARD.x, 0.98, WALL_Z), fov: 34, tens: 0.15 },
    { t: 61.6, p: V3(2.94, 1.88, 2.03), l: V3(0.42, 0.97, -0.42), fov: 38, tens: 0.2 },                 // morning, wide: he sits up (his head under the words)
    { t: 73.8, p: V3(2.86, 1.84, 1.95), l: V3(0.44, 0.96, -0.44), fov: 38, tens: 0.4 },
    { t: 75.6, p: W.camLogo.p.clone().addScaledVector(cf, 0.25).add(new THREE.Vector3(0, 0.06, 0)).toArray(), l: W.camLogo.l.toArray(), fov: 30 },
    { t: T.logo, p: W.camLogo.p.toArray(), l: W.camLogo.l.toArray(), fov: 30, stop: true },
  ]);
}
function camPose(S, t) {
  const v = S.cfg.view; if (v && typeof v === 'object') return v;
  if (!CAM) CAM = buildCam();
  if (t <= T.logo) return CAM(t);
  const P = CAM(T.logo), k = ss(T.logo, T.end, t), cf = new THREE.Vector3(Math.sin(0.95), 0, Math.cos(0.95));
  return { p: [P.p[0] + cf.x * 0.03 * k, P.p[1], P.p[2] + cf.z * 0.03 * k], l: P.l, fov: 30 };
}
function focusAt(S, t, P) { return Math.hypot(P.p[0] - P.l[0], P.p[1] - P.l[1], P.p[2] - P.l[2]); }

// ------------------------------------------------------------------ one moment of the film
const _v = new THREE.Vector3(), _w = new THREE.Vector3();
function update(S, t) {
  const scene = S.scene, endDark = ss(T.final + 0.3, T.logo - 0.3, t);
  // ---- the body
  const o = bodyAt(t); poseRig(o); placeBody(o, t);
  // ---- the bed takes the body's shape
  { const k = clamp01(o.move), kk = Math.round(k * 200) / 200, L = W.dentLie, Sd = W.dentSit;
    setMattress(W.bed, { key: kk.toFixed(3), at: (i) => lerp(L[i], Sd[i], kk) });
    const pk = Math.round(clamp01(1 - o.up * 1.4) * 100) / 100, P = W.pillow;
    if (P.key !== pk.toFixed(2)) { P.key = pk.toFixed(2); const A = P.geo.attributes.position.array; for (let i = 0; i < A.length / 3; i++) A[i * 3 + 1] = P.base[i * 3 + 1] - W.pillowDent[i] * pk; P.geo.attributes.position.needsUpdate = true; P.geo.computeVertexNormals(); } }
  // ---- the phone: held and scrolled, dropped on the face, slid off; lit again at "screen"
  { const P = W.phone, g = P.g, hk = s5(0, 1, o.hold);
    const s = clockAt(t), hh = Math.floor((s / H) % 24), mm = Math.floor((s % H) / 60), clockTxt = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
    const flicks = [3.2, 3.75, 4.3, 4.85, 5.5, 6.1]; let sc = 0; for (const f of flicks) sc += 640 * s5(f, f + 0.32, t);
    if (t < 11) drawFeed(P, sc, clockTxt);
    const tilt = PHONE_TILT;   // held tilted toward the bedside
    const held = new THREE.Vector3(W.holdAt.x, W.holdAt.y + 0.004, W.holdAt.z);
    const land = W.land;
    const off = new THREE.Vector3(0.25, BED.top + 0.006, W.faceC.z + 0.2);
    const fall = clamp01((t - DROP.t0) / (DROP.hit - DROP.t0)), slide = s5(T.all - 0.1, T.all + 0.85, t);
    const pos = new THREE.Vector3(), q = new THREE.Quaternion(), e = new THREE.Euler();
    if (t < DROP.t0) { pos.copy(held); e.set(0, 0, Math.PI + tilt); }
    else if (t < DROP.hit) {   // it slips sideways out of the hand (clear of the thumb under it), then drops, turning as it falls
      const fd = Math.max(0, (fall - 0.25) / 0.75), f2 = fd * fd, side = 0.027 * s5(0, 0.25, fall) * (1 - f2);
      pos.lerpVectors(held, land, f2).addScaledVector(W.phoneSlip, side); e.set(0.18 * f2, 0, Math.PI + tilt * (1 - f2) + 0.05 * f2); }
    else { const b = Math.exp(-(t - DROP.hit) * 9) * Math.abs(Math.sin((t - DROP.hit) * 22)) * 0.012; pos.copy(land); pos.y += b; e.set(0.18, 0, Math.PI + 0.05); }
    if (slide > 0) { pos.lerpVectors(pos, off, slide); pos.y += 0.12 * Math.sin(Math.PI * Math.min(1, slide * 1.15)); e.set(lerp(0.18, 0, slide), lerp(0, 0.7, slide), lerp(Math.PI + 0.05, Math.PI * 2, slide)); }
    q.setFromEuler(e); g.position.copy(pos); g.quaternion.copy(q);
    if (slide >= 1) { g.rotation.set(0, 0.7, 0); g.position.copy(off); }   // face up on the mattress
    const litHold = 0.62 * (1 - ss(T.all + 0.2, T.all + 0.7, t)), litScreen = 0.7 * pulse(t, T.screen - 0.1, T.alarm, 0.25);
    P.screenMat.color.setScalar(Math.max(litHold, litScreen));
    if (t >= 11 && litScreen > 0.01) drawFeed(P, 1400 + 120 * Math.max(0, t - T.screen), clockTxt);
    // its light on the face
    const L = W.phoneLight; L.intensity = 0.12 * litHold * (t < DROP.hit ? 1 : 0.4) + 0.4 * litScreen;
    L.position.copy(g.position).add(new THREE.Vector3(0, -0.01, 0)); L.target.position.set(g.position.x, g.position.y - 0.4, g.position.z); if (slide >= 1) { L.position.y += 0.03; L.target.position.set(off.x, off.y + 0.4, off.z); }
  }
  // ---- the glass skull and the grains: a day piles up; the vacuum cleans until the alarm
  { const glass = pulse(t, T.all - 0.4, T.drink2 - 0.2, 0.6);
    for (const m of W.vault) { m.material.opacity = 1 - 0.88 * glass; m.material.depthWrite = glass < 0.5; }
    const G = W.grains, k = fillAt(t, G.N) * clamp01(glass * 1.5);
    G.mesh.count = Math.round(k); G.mesh.visible = k > 1;
    G.mesh.material.emissiveIntensity = 1.1 + 0.5 * pulse(t, T.chemical, T.sleepy + 0.4, 0.4) + 0.4 * pulse(t, T.yesterdays, T.morning + 0.6, 0.4);
    // the vacuum
    const V = W.vac, on = ss(T.cleaning - 0.05, T.cleaning + 0.3, t) * (1 - ss(T.drink2 - 0.6, T.drink2 - 0.2, t));
    V.g.visible = on > 0.001;
    if (V.g.visible) {
      const sf = surfaceAt(G, Math.max(k, 0.42 * G.N)), stopT = T.cut + 0.15, u = Math.min(t, stopT) - T.cleaning;
      const ax = Math.max(0.006, sf.ax * 0.62), az = Math.max(0.006, sf.az * 0.62);
      const px = sf.cx + ax * Math.sin(u * 2.3 + 0.3) * Math.cos(u * 0.7), pz = sf.cz + az * Math.sin(u * 1.7 + 1.2);
      const dx = ax * (2.3 * Math.cos(u * 2.3 + 0.3) * Math.cos(u * 0.7) - 0.7 * Math.sin(u * 2.3 + 0.3) * Math.sin(u * 0.7)), dz = az * 1.7 * Math.cos(u * 1.7 + 1.2);
      let head = Math.atan2(dx, dz);
      const after = Math.max(0, t - stopT);                                   // stopped: a sad half turn, then still
      head += 2.6 * s5(0, 0.9, after) + 0.25 * Math.sin(after * 18) * Math.exp(-after * 4);
      const pop = outBack(clamp01((t - T.cleaning) / 0.35), 2.2);
      V.g.position.set(px, sf.y + 0.0012 + (1 - pop) * 0.03, pz); V.g.rotation.y = head; V.g.scale.setScalar(Math.max(0.001, pop * on));
      V.brush.rotation.y = after > 0 ? V.brush.rotation.y : t * 30;
      const red = ss(stopT, stopT + 0.2, t); V.ledMat.color.setRGB(lerp(0.35, 2.6, red), lerp(2.2, 0.25, red), lerp(1.2, 0.2, red));
      if (red > 0.5) { const bl = (Math.floor(t * 2.5) % 2) ? 1 : 0.15; V.ledMat.color.multiplyScalar(bl); }
    }
  }
  // ---- the warning light on the forehead; the tape over it
  { const Wn = W.warn, on = pulse(t, T.coffee2 - 0.5, T.drink2 - 0.3, 0.4), blink = 0.55 + 0.45 * (Math.sin(t * 6.5) > 0 ? 1 : 0.2);
    const taped = ss(T.over - 0.08, T.over + 0.02, t);
    Wn.g.visible = on > 0.002;
    Wn.faceMat.color.copy(AMBER).multiplyScalar(lerp(0.1, 2.4 * blink, on));
    Wn.haloMat.opacity = on * lerp(0.55 * blink, 0.22 * blink, taped);
    const tp = Wn.tape; tp.visible = t > T.tape - 0.05 && on > 0.002;
    if (tp.visible) { const f = clamp01((t - (T.tape - 0.05)) / (T.over - (T.tape - 0.05))), land = outBack(f, 1.3);
      tp.position.set(lerp(0.09, 0, land), lerp(0.05, 0, land), lerp(0.09, 0.0068, f)); tp.rotation.set(0, 0, lerp(-0.9, -0.08, land));
      const w = Math.exp(-Math.max(0, t - T.over) * 7) * Math.sin(Math.max(0, t - T.over) * 30) * 0.03; tp.rotation.z += w; }
  }
  // ---- the cup: steam after dinner; between 6 and 11 p.m. only half of it goes
  { const C = W.cup, lvl = 1 - 0.5 * s5(T.six2 - 0.1, T.eleven + 0.2, t) * (1 - ss(T.maybe + 0.4, T.maybe + 1.2, t));
    const y = lerp(0.03, 0.0632, lvl), rr = lerp(0.0322, 0.0356, ss(0.03, 0.0632, y)) / 0.0356;
    C.coffee.position.y = y; C.coffee.scale.set(rr, 1, rr); C.GLOW.uTime.value = t; C.GLOW.uGlow.value = 0.6 * pulse(t, T.drink2 - 0.3, T.maybe + 0.6, 0.4);
    const st = pulse(t, T.coffee - 0.3, T.scroll + 0.8, 0.5) + pulse(t, T.drink2 - 0.2, T.half + 0.4, 0.5);
    for (const m of W.steam) { m.visible = st > 0.002; m.material.uniforms.uAmt.value = 0.28 * st; m.rotation.y = Math.atan2(S.cam.position.x - m.position.x, S.cam.position.z - m.position.z); } }
  // ---- the clock: the night it gets (1 to 7), the alarm, and the logo at the end
  { const s = clockAt(t), C = W.clock, hrs = (s / H) % 12, spin = Math.abs(clockAt(t + 0.02) - s) > 30;
    C.hands.h.rotation.z = -(hrs / 12) * Math.PI * 2; C.hands.m.rotation.z = -((s % H) / H) * Math.PI * 2; C.hands.s.rotation.z = spin ? -((s % 60) / 60) * Math.PI * 2 : -tickAngle(s % 60);
    const six = pulse(t, T.six - 0.15, T.scroll - 0.2, 0.35); C.setArc(C.arc, 1, 7, 0.036, 0.0024); C.arcMat.opacity = six; C.arcGhostMat.opacity = 0;
    const r = ringAt(t); C.body.rotation.z = r * 0.07 * Math.sin(t * 2 * Math.PI * 17); C.body.position.y = C.R + 0.001 + r * 0.0015 * Math.abs(Math.sin(t * 2 * Math.PI * 17));
    C.markMat.color.copy(ORANGE).multiplyScalar(1 + 2.5 * r);
    const lk = s5(T.final + 0.5, T.logo - 0.25, t), fade = 1 - lk;
    for (const m of [C.hourMat, C.minMat, C.secMat]) m.opacity = fade; C.markMat.opacity = fade;
    C.faceMat.color.setScalar(lerp(1, 0.06, lk)); C.minorMat.opacity = fade; C.topMat.opacity = fade;
    W.logo.set({ weight: lk, white: lk, hours: 0, hand: ss(T.logo - 0.4, T.logo - 0.15, t), handScale: outBack(clamp01((t - (T.logo - 0.4)) / 0.35), 1.8) }); }
  // ---- the board
  { drawBoard(W.board, t); }
  // ---- light: from the clock's hour; the lamp from "lamp" to the alarm; dark at the very end
  { const s = clockAt(t), hr = (s / H) % 24, day = ss(6.6, 8.2, hr) * (1 - ss(19.2, 20.6, hr)), gold = (ss(6.4, 7.4, hr) * (1 - ss(7.6, 9.0, hr)) + ss(16.8, 18.2, hr) * (1 - ss(19.0, 20.2, hr))), fig = 1 - endDark;
    const sunUp = ss(9, 13, hr) * (1 - ss(13, 18.5, hr));
    W.key.position.set(lerp(2.6, 2.4, day), lerp(2.6, 1.7 + 1.5 * sunUp, day), lerp(-0.6, -1.2, day));
    W.key.color.setRGB(lerp(0.72, 1.0, day), lerp(0.78, lerp(0.95, 0.76, gold), day), lerp(1.0, lerp(0.86, 0.52, gold), day));
    const close = pulse(t, 9.8, 28.6, 0.8);   // the head close-ups: keep the sun off the glass skull
    const roomK = pulse(t, 37.4, 43.6, 0.6) * day;   // the room by day: let the sun pour in
    W.key.intensity = lerp(22, 62, day) * fig * (1 - 0.7 * close) * (1 + 0.6 * roomK);
    drawSky(W.window, hr); W.window.paneMat.color.setScalar(1 - 0.9 * endDark);
    const lamp = pulse(t, T.lamp - 0.15, T.alarm + 0.2, 0.25); W.lampLight.intensity = 1.8 * lamp * fig; W.lamp.shadeMat.emissiveIntensity = 0.9 * lamp; W.lamp.bulbMat.color.setScalar(1.2 * lamp);
    W.rim.intensity = 2.6 * fig; W.fill.intensity = (0.45 + 1.4 * day) * fig * (1 - 0.6 * close) * (1 + 0.6 * roomK); W.tableLight.intensity = (2.6 + 1.2 * pulse(t, 43.5, 60.4, 0.6)) * fig * (1 - day * 0.5);
    W.headLight.intensity = (0.5 + 0.9 * pulse(t, 10.3, 28.4, 0.6)) * fig * (1 - day * 0.7);
    S.tableMat.color.setScalar(0.35 * (1 - endDark * 0.9) * (1 + 0.6 * day)); scene.environmentIntensity = (0.1 + 0.38 * day * (1 - 0.6 * close) + 0.25 * roomK) * (1 - endDark); S.reflAmt = 0.5 * (1 - endDark);
    S.bg.setRGB(lerp(0.027, lerp(0.09, 0.11, gold), day), lerp(0.031, lerp(0.085, 0.08, gold), day), lerp(0.039, lerp(0.08, 0.06, gold), day)); S.fog.color.copy(S.bg); }
}

// ------------------------------------------------------------------ the words on screen
const CAPS = [
  { t0: T.you, t1: 1.6, top: 300, size: 100, html: 'You sleep <em>six hours</em>,' },
  { t0: T.drink, t1: 2.98, top: 300, size: 92, html: 'drink coffee<br><em>after dinner</em>,' },
  { t0: T.scroll, t1: 4.88, top: 300, size: 92, html: 'scroll in bed<br>until <em>midnight</em>,' },
  { t0: T.and1, t1: 8.4, top: 292, size: 80, html: 'and then you wonder<br>why you’re <em>always tired.</em>' },
  { t0: T.lets, t1: 10.25, top: 300, size: 104, html: 'Let’s <em>fix</em> that.' },
  { t0: T.all, t1: 14.0, top: 292, size: 80, html: 'All day, a chemical<br>builds up in your brain<br>and makes you <em>sleepy</em>,' },
  { t0: T.and2, t1: 17.3, top: 292, size: 84, html: 'and sleep is the<br><em>cleaning crew</em><br>that clears it out.' },
  { t0: T.cut, t1: 18.45, top: 300, size: 100, html: 'Cut the night <em>short</em>,' },
  { t0: T.some - 0.27, t1: 22.0, top: 292, size: 84, html: 'and some of <em>yesterday’s</em><br><em>mess</em> is still there<br>in the morning.' },
  { t0: T.coffee2, t1: 24.3, top: 300, size: 92, html: 'Coffee doesn’t<br><em>clean</em> any of it.' },
  { t0: T.just - 0.31, t1: 28.3, top: 292, size: 84, html: 'It just <em>hides</em> the signal,<br>like tape over<br>a warning light.' },
  { t0: T.drink2, t1: 30.22, top: 300, size: 92, html: 'Drink it at <em>six</em><br>in the evening,' },
  { t0: T.and3, t1: 33.4, top: 292, size: 88, html: 'and about <em>half</em> of it<br>is still in you<br>at <em>eleven</em>.' },
  { t0: T.maybe, t1: 35.3, top: 300, size: 92, html: 'Maybe you’re not<br>a <em>light sleeper</em>.' },
  { t0: T.maybe2, t1: 37.9, top: 300, size: 92, html: 'Maybe you’re just<br><em>caffeinated</em>.' },
  { t0: T.your, t1: 40.05, top: 300, size: 92, html: 'Your body was built<br>to run on the <em>sun</em>,' },
  { t0: T.so, t1: 43.3, top: 292, size: 84, html: 'so even an<br>ordinary <em>lamp</em><br>or a <em>screen</em> at night' },
  { t0: T.makes2, t1: 46.4, top: 292, size: 84, html: 'makes your body clock<br>think it’s still <em>daytime</em>,' },
  { t0: T.and4, t1: 49.15, top: 292, size: 80, html: 'and your sleep hormone<br>shows up <em>late</em>.' },
  { t0: 49.26, t1: 52.5, top: 292, size: 88, html: 'Your alarm, sadly,<br>still shows up<br><em>on time</em>.' },
  { t0: T.so2, t1: 54.78, top: 300, size: 92, html: 'So for a <em>7 a.m.</em> alarm,' },
  { t0: T.beIn, t1: 56.36, top: 300, size: 96, html: 'be in bed by <em>11</em>,' },
  { t0: T.stop, t1: 57.88, top: 300, size: 96, html: 'stop coffee by <em>2</em>,' },
  { t0: T.and5, t1: 60.3, top: 300, size: 92, html: 'and dim the lights<br>from <em>8</em>.' },
  { t0: T.if1, t1: 62.3, top: 300, size: 88, html: 'If you’re still <em>exhausted</em><br>after that,' },
  { t0: T.or1, t1: 66.42, top: 292, size: 84, html: 'or it comes with <em>fever</em>,<br><em>sweats</em> or <em>weight loss</em><br>you can’t explain,' },
  { t0: T.see, t1: 68.0, top: 300, size: 100, html: 'see a <em>doctor</em>.' },
  { t0: T.if2, t1: 69.88, top: 300, size: 92, html: 'If you feel <em>confused</em><br>or <em>dizzy</em>,' },
  { t0: T.or2, t1: 72.2, top: 300, size: 88, html: 'or have thoughts<br>of <em>harming yourself</em>,' },
  { t0: T.get, t1: 74.3, top: 300, size: 96, html: 'get help<br><em>straight away</em>.' },
  { t0: T.final, t1: 99, top: 360, size: 92, html: 'Let’s get you back to<br><em>factory settings.</em>' },
];
const OVL = {};
function overlayInit(S) {
  const O = S.O, tag = (cls, txt2, size, bsize) => { const e = O.tag(cls, txt2); e.style.fontSize = size + 'px'; const b = e.querySelector('b'); if (b && bsize) b.style.fontSize = bsize + 'px'; return e; };
  OVL.six = tag('tag', 'Asleep<b>6 hours</b>', 24, 44);
  OVL.chem = tag('tag', 'The sleepy chemical<b>adenosine</b>', 22, 40);
  OVL.crew = tag('tag', 'Sleep<b>the cleaning crew</b>', 22, 40);
  OVL.left = tag('tag', 'In the morning<b>yesterday’s mess</b>', 22, 40);
  for (const e of [OVL.chem, OVL.crew, OVL.left]) Object.assign(e.style, { background: 'rgba(8,9,11,.58)', padding: '12px 18px 14px', borderRadius: '16px', color: '#d4d7dc' });
  OVL.half = tag('tag', '11 p.m.<b>about half still in you</b>', 22, 40);
}
function overlay(S, t) {
  const C = W.clock.g.position;
  place(S, OVL.six, W.clock.body.localToWorld(new THREE.Vector3(0.05, 0, W.clock.D / 2)), 34, -52, pulse(t, T.six, T.scroll - 0.25));
  { const G = W.grains, k = fillAt(t, G.N), sf = surfaceAt(G, Math.max(60, k));
    const at = new THREE.Vector3(sf.cx + sf.ax * 0.9, sf.y + 0.005, sf.cz);
    place(S, OVL.chem, at, 60, -30, pulse(t, T.chemical, T.and2 - 0.1));
    place(S, OVL.crew, W.vac.g.position.clone(), 60, -40, pulse(t, T.crew - 0.1, T.cut - 0.15));
    place(S, OVL.left, at, 60, -30, pulse(t, T.yesterdays, T.coffee2 - 0.2)); }
  place(S, OVL.half, new THREE.Vector3(CUP.x, CUP.y + 0.09, CUP.z), 50, -60, pulse(t, T.half, T.maybe - 0.1));
  const lc = W.clock.body.localToWorld(new THREE.Vector3(0, 0, W.clock.D / 2 + 0.0012)), le = W.clock.body.localToWorld(new THREE.Vector3(0, 0.044, W.clock.D / 2 + 0.0012));
  logoEnd(S, t, { t0: T.logo, center: lc, edge: le });
}

makeFilm({
  T, caps: CAPS, subs: [], build, update, pose: camPose, overlay, overlayInit, focus: focusAt,
  stage: { bg: 0x07080a, reflSize: 6, env: 0.1, far: 30 },
  aperture: [[0, 0.003], [3.9, 0.004], [11.7, 0.003], [23.1, 0.004], [29.3, 0.003], [34.4, 0.002], [44.5, 0.003], [61.6, 0.002], [75.6, 0.003]],
  bloom: [[0, 0.5], [10.5, 0.6], [28.5, 0.5], [44, 0.45], [74, 0.55]],
  fast: [[8.5, 9.6, 2], [10.2, 11.0, 2], [14.9, 17.7, 2], [26.0, 26.7, 2], [28.3, 33.0, 2], [35.9, 37.8, 3], [37.6, 43.4, 2], [49.6, 51.0, 2]],
});

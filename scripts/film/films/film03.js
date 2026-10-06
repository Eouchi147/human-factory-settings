// Human Factory Settings · Film 3 "Do you really need 10,000 steps?" (new direction, 3 Oct 2026) · one continuous shot, 9:16.
// A skeleton marches along chasing a "10,000" card that dangles in front of its face from a rod on its own headband, like a
// donkey after a carrot. A 1965 pedometer rides on its hip: the dial says TEN-THOUSAND-STEPS METER. On "marketing slogan"
// the card spins round: SLOGAN, in sale-sign red. On "doesn't need ten thousand steps" the whole contraption falls off and
// clatters on the floor. Points of light gather into a hill of benefit, drawn like a chart (a bar every thousand steps),
// steep to 7,000 steps a day, then flat; he climbs it. Brain and hips glow for dementia and falls. On "you don't owe the
// pedometer anything" he unclips it and lets it drop. A link, not proof: the line goes dashed. The plan: 7,000 in orange,
// stairs of a thousand; a shopping bag, the stairs, a phone call on foot; a couch pops up down below, and sighs on
// "survive". The pedometer, face up on the hill, becomes the logo. The factory stamp runs along the right thigh bone.
import { THREE, ORANGE, ss, s5, lerp, clamp01, hash, camTrack, phys, glowMat, shadows, spot, RoundedBoxGeometry,
  loadAnatomy, V3, vadd, place, logoEnd, makeFilm, outBack, stamp, labelCanvas, stampLine, noiseTex } from '../kit.js';
import { buildRig, skeletonKind, walkAt, legIK, bendSpine, poseArm, ARM0, worldVerts, avgV, clearArms } from '../rig.js';
import { makePhone } from '../props.js';

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
  end: 70.0, logo: 67.52,
  you: 0.35, chasing: 1.09, ten: 1.35, steps: 2.05, day: 2.52, without: 2.62, asking: 3.54, who: 4.04, picked: 4.42, number: 4.85,
  it: 6.31, probably: 6.96, japanese: 7.51, company: 7.99, y1965: 8.58, selling: 10.04, pedometer: 10.95, name: 11.69, meant: 12.02, tenk: 12.36, meter: 14.06,
  youve: 14.97, cardio: 15.89, marketing: 16.58, slogan: 16.93,
  body: 18.75, built: 19.36, walk: 19.63, need: 20.61, ten2: 20.93, thank: 22.37,
  people: 23.38, seven: 24.56, half: 27.22, dying: 28.04, compared: 28.82, two: 30.85,
  they: 32.41, dementia: 34.07, falls: 34.99, above: 35.77, seven2: 36.22, extra: 37.35, small: 38.66,
  walkmore: 40.6, enjoy: 41.61, owe: 42.62, pedometer2: 43.01, anything: 43.63,
  fair: 46.05, link: 46.55, proof: 47.01, because: 47.76, sick: 49.87,
  so: 51.61, aim: 52.15, seven3: 52.83, far: 55.15, add: 56.18, time: 57.62,
  walk3: 58.73, shop: 59.54, stairs: 60.17, phone: 61.37, foot: 62.27,
  your3: 63.07, couch: 63.51, survive: 64.0,
  final: 65.26, factory: 66.47, settings: 66.84,
};

// ------------------------------------------------------------------ the hill: steps a day along z, the benefit as height
const PER = 1.5;                       // metres of path per 1,000 steps a day; 2,000 steps sits at z = 0
const H = 1.1;                         // height at 7,000 steps (about half the risk); the chart has no y scale, only its shape
const zOf = (k) => (k - 2) * PER;      // k = thousands of steps a day
const KC = 0.45, NORM = 1 - Math.exp(-5 * KC);
function hill(z) {                     // an illustrative curve through the film's two points, steep then flat
  if (z <= -0.25) return 0;
  const x = Math.max(0, z / PER), y = (H * (1 - Math.exp(-KC * x))) / NORM;
  return y * ss(-0.25, 0.45, z);
}
const slopeOf = (z) => Math.atan2(hill(z + 0.02) - hill(z - 0.02), 0.04);
const Z_END = zOf(12.4);
const H0 = 19.3;                       // the points of light start to gather; the hill is whole by H0 + 4.2, just after he sets off

// ------------------------------------------------------------------ the world
const W = {}; window.HFS_W = W;
const FLOOR = 0.4;
const STRIDE = 7.9 / 7;                // seven strides from the foot of the hill to the top
const HS_STOP1 = -0.45, HS_STOP2 = HS_STOP1 + 7 * STRIDE;   // where the leading heel stands: before the hill, and at 7,000
const COUCH = { x: -1.32, z: zOf(7) + 0.15 };               // on the floor beside the hill, under him
const pulse = (t, a, b, r = 0.3) => ss(a, a + r, t) * (1 - ss(b - r, b, t));
function posedVerts(m, step = 1) { m.updateMatrixWorld(true); const P = m.geometry.attributes.position, out = []; for (let i = 0; i < P.count; i += step) out.push(new THREE.Vector3().fromBufferAttribute(P, i).applyMatrix4(m.matrixWorld)); return out; }

function brainKind(p) {
  if (p.system !== 'nervous') return undefined;
  const cy = (p.bounds[0][1] + p.bounds[1][1]) / 2;
  if (cy < 1.45 || p.vertexCount < 400 || /nerve|optic|tentorium/i.test(p.name)) return null;
  return 'brain';
}
function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}

// the pedometer: chrome case, enamel dial 0 to 14 (thousand) over 270 degrees, so 7,000 points straight up; a rolling counter
function pedometerFace(c, count, logoK) {
  const x = c.getContext('2d'), S = c.width, R = S / 2;
  x.clearRect(0, 0, S, S);
  x.fillStyle = '#f3efe6'; x.beginPath(); x.arc(R, R, R, 0, Math.PI * 2); x.fill();
  for (let i = 0; i <= 28; i++) {
    const a = (-135 + (270 * i) / 28) * (Math.PI / 180), big = i % 2 === 0;
    const r0 = R * (big ? 0.72 : 0.77), r1 = R * 0.86;
    x.strokeStyle = '#1b1c1f'; x.lineWidth = big ? S * 0.012 : S * 0.006;
    x.beginPath(); x.moveTo(R + Math.sin(a) * r0, R - Math.cos(a) * r0); x.lineTo(R + Math.sin(a) * r1, R - Math.cos(a) * r1); x.stroke();
    if (big) { x.fillStyle = '#1b1c1f'; x.font = `600 ${S * 0.075}px Archivo`; x.textAlign = 'center'; x.textBaseline = 'middle';
      x.fillText(String(i / 2), R + Math.sin(a) * R * 0.6, R - Math.cos(a) * R * 0.6); }
  }
  x.fillStyle = '#1b1c1f'; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.font = `700 ${S * 0.04}px Archivo`; x.fillText('TEN-THOUSAND', R, R * 0.77); x.fillText('-STEPS METER', R, R * 0.865);
  x.font = `500 ${S * 0.036}px "Geist Mono"`; x.fillStyle = '#55575c'; x.fillText('×1000', R, R * 1.47);
  x.font = `500 ${S * 0.042}px "Geist Mono"`; x.fillText('1965', R, R * 1.62);
  const ww = S * 0.38, wh = S * 0.11, wx = R - ww / 2, wy = R * 1.26 - wh / 2;
  x.fillStyle = '#121315'; x.fillRect(wx, wy, ww, wh);
  x.save(); x.beginPath(); x.rect(wx, wy, ww, wh); x.clip();
  x.font = `600 ${wh * 0.78}px "Geist Mono"`; x.fillStyle = '#f3efe6'; x.textBaseline = 'middle';
  const n = Math.max(0, count), whole = Math.floor(n), frac = n - whole, roll = s5(0.7, 1.0, frac);
  for (let d = 0; d < 5; d++) {
    const p = Math.pow(10, 4 - d), dig = Math.floor(whole / p) % 10;
    const turning = (whole % p) === p - 1 ? roll : 0;
    const cx = wx + ww * (0.1 + d * 0.2);
    x.textAlign = 'center'; for (const [v, off] of [[dig, -turning], [(dig + 1) % 10, 1 - turning]]) x.fillText(String(v), cx, wy + wh / 2 + off * wh);
  }
  x.restore();
  if (logoK > 0) {
    x.globalAlpha = logoK; x.fillStyle = '#060607'; x.beginPath(); x.arc(R, R, R, 0, Math.PI * 2); x.fill();
    const u = R / 21.2;
    x.strokeStyle = '#eceef1'; x.lineWidth = 1.4 * u; x.beginPath(); x.arc(R, R, 20.5 * u, 0, Math.PI * 2); x.stroke();
    x.globalAlpha = logoK * 0.55; x.lineWidth = u; x.lineCap = 'round';
    for (let d = 30; d < 360; d += 30) { const a = (d * Math.PI) / 180; x.beginPath(); x.moveTo(R + Math.sin(a) * 15.2 * u, R - Math.cos(a) * 15.2 * u); x.lineTo(R + Math.sin(a) * 17.6 * u, R - Math.cos(a) * 17.6 * u); x.stroke(); }
    x.globalAlpha = 1;
  }
}

// the carrot: a headband, a rod forward over the face, a string, and a card: 10,000 on the front, SLOGAN on the back
function makeCarrot(fit) {   // fit: the band's path round the skull and where the post stands on it (the carrot's own frame)
  const g = new THREE.Group();
  const band = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(fit.band, true), 160, 0.009, 12, true), phys({ color: 0xc23b2c, roughness: 0.7, sheen: 0.4 }));
  g.add(band);
  const rodM = phys({ color: 0x8a6a45, roughness: 0.5, clearcoat: 0.3 });
  const bh = 0.055 - fit.postY;   // the post: from the skull's surface up to where the rod starts
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.01, bh, 16), rodM); base.position.set(0, fit.postY + bh / 2, 0.03); g.add(base);
  const curve = new THREE.CatmullRomCurve3([V3(0, 0.05, 0.03), V3(0, 0.13, 0.12), V3(0, 0.15, 0.3), V3(0, 0.12, 0.44)].map((a) => new THREE.Vector3(...a)));
  const rod = new THREE.Mesh(new THREE.TubeGeometry(curve, 48, 0.0045, 10, false), rodM); g.add(rod);
  const tip = new THREE.Vector3(0, 0.12, 0.44);
  const swing = new THREE.Group(); swing.position.copy(tip); g.add(swing);
  const L = 0.2;
  const string = new THREE.Mesh(new THREE.CylinderGeometry(0.0011, 0.0011, L, 6), new THREE.MeshStandardMaterial({ color: 0xe8e2d4, roughness: 0.9 }));
  string.position.y = -L / 2; swing.add(string);
  const spin = new THREE.Group(); spin.position.y = -L - 0.05; swing.add(spin);
  const face = (word, sub, bg, fg) => canvasTex(640, 400, (x, w, h) => {
    x.fillStyle = bg; x.fillRect(0, 0, w, h); x.strokeStyle = fg; x.lineWidth = 10; x.strokeRect(18, 18, w - 36, h - 36);
    x.fillStyle = fg; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.font = `900 ${word.length > 6 ? 150 : 170}px Archivo`; x.fillText(word, w / 2, h / 2 - (sub ? 30 : 0), w - 80);
    if (sub) { x.font = '600 44px "Geist Mono"'; x.fillText(sub, w / 2, h - 72); } });
  const cw = 0.16, ch = 0.1;
  const card = new THREE.Mesh(new RoundedBoxGeometry(cw, ch, 0.004, 2, 0.002), phys({ color: 0xf3efe6, roughness: 0.8 }));
  spin.add(card);
  const front = new THREE.Mesh(new THREE.PlaneGeometry(cw * 0.98, ch * 0.98), phys({ map: face('10,000', 'STEPS A DAY', '#f3efe6', '#141519'), roughness: 0.75 }));
  front.position.z = 0.0021; spin.add(front);   // faces forward, toward the camera in front of him; he sees the back
  const back = new THREE.Mesh(new THREE.PlaneGeometry(cw * 0.98, ch * 0.98), phys({ map: face('SLOGAN', 'SINCE 1965', '#c8322a', '#f3efe6'), roughness: 0.75 }));
  back.position.z = -0.0021; back.rotation.y = Math.PI; spin.add(back);
  const hole = new THREE.Mesh(new THREE.TorusGeometry(0.006, 0.0015, 8, 20), phys({ color: 0x9a9da3, metalness: 1, roughness: 0.3 })); hole.position.y = ch / 2 - 0.01; spin.add(hole);
  shadows(g);
  return { g, swing, spin, card };
}

// the couch, on the floor beside the hill: three seat cushions, a back, two arms
function makeCouch() {
  const g = new THREE.Group();
  const fabric = phys({ color: 0x4b5262, roughness: 0.95, sheen: 0.6, sheenColor: new THREE.Color(0x8c96aa), sheenRoughness: 0.6, roughnessMap: noiseTex(5, 256, 0.82, 1.0, 30) });
  const wood = phys({ color: 0x2a1d13, roughness: 0.5 });
  const Lc = 1.7, D = 0.82;
  const base = new THREE.Mesh(new RoundedBoxGeometry(D, 0.2, Lc, 4, 0.04), fabric); base.position.y = 0.2; g.add(base);
  const back = new THREE.Mesh(new RoundedBoxGeometry(0.2, 0.46, Lc, 5, 0.07), fabric); back.position.set(D / 2 - 0.1, 0.52, 0); g.add(back);
  for (const s of [-1, 1]) { const arm = new THREE.Mesh(new RoundedBoxGeometry(D, 0.34, 0.18, 5, 0.07), fabric); arm.position.set(0, 0.42, s * (Lc / 2 - 0.09)); g.add(arm); }
  const cushions = [];
  for (let i = 0; i < 3; i++) { const c = new THREE.Mesh(new RoundedBoxGeometry(D - 0.24, 0.15, (Lc - 0.36) / 3 - 0.01, 5, 0.06), fabric); c.position.set(-0.08, 0.37, -((Lc - 0.36) / 3) + i * ((Lc - 0.36) / 3)); g.add(c); cushions.push(c); }
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const f = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.016, 0.1, 12), wood); f.position.set(sx * (D / 2 - 0.08), 0.05, sz * (Lc / 2 - 0.08)); g.add(f); }
  shadows(g);
  return { g, cushions };
}

// a paper shopping bag with rope handles (its origin at the top of the handles), a leek poking out
function makeBag() {
  const g = new THREE.Group();
  const paper = phys({ color: 0xb98a55, roughness: 0.9 });
  const bw = 0.24, bd = 0.13, bh = 0.3;
  const body = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bd), paper); body.position.y = -0.1 - bh / 2; g.add(body);
  const rope = new THREE.MeshStandardMaterial({ color: 0xe9dfc8, roughness: 0.9 }), ropes = [];
  for (const s of [-1, 1]) { const c = new THREE.CatmullRomCurve3([new THREE.Vector3(-0.05, -0.1, s * bd / 2), new THREE.Vector3(-0.02, 0.0, s * 0.01), new THREE.Vector3(0.02, 0.0, s * 0.01), new THREE.Vector3(0.05, -0.1, s * bd / 2)]);
    g.add(new THREE.Mesh(new THREE.TubeGeometry(c, 20, 0.004, 6, false), rope)); ropes.push(c.getSpacedPoints(80)); }
  const greens = phys({ color: 0x3f7a3a, roughness: 0.7 });
  const leek = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.016, 0.22, 10), greens); leek.position.set(0.06, -0.14, 0.02); leek.rotation.z = -0.25; g.add(leek);
  shadows(g);
  // distance from a point (the bag's own frame) to the rope handles' surface
  const ropeSDF = (p) => { let d = 9; for (const pts of ropes) for (let i = 0; i + 1 < pts.length; i++) { const a = pts[i], b = pts[i + 1], ab = b.clone().sub(a), t = clamp01(p.clone().sub(a).dot(ab) / ab.lengthSq()); d = Math.min(d, p.distanceTo(a.clone().addScaledVector(ab, t))); } return d - 0.004; };
  return { g, ropeSDF };
}

async function build(S, cfg) {
  const scene = S.scene;
  S.fog.near = 7; S.fog.far = 32;
  S.table.scale.set(5, 5, 1); S.table.position.z = 6; S.tableMat.clearcoat = 0.06; S.tableMat.specularIntensity = 0.3;
  for (const m of [S.tableMat.map, S.tableMat.roughnessMap]) if (m) { m.wrapS = m.wrapT = THREE.RepeatWrapping; m.repeat.multiplyScalar(5); }
  // ---- the skeleton, its brain, its hands
  const meshes = await loadAnatomy(skeletonKind(brainKind));
  const R = W.rig = buildRig(meshes); scene.add(R.root);
  R.ground = (x, z) => (Math.abs(x) <= 0.45 && z >= -0.3 && z <= Z_END ? hill(z) : 0);   // the hill's top where the slab is, the floor beside it
  for (const m of meshes) { m.castShadow = true; m.receiveShadow = true; m.layers.enable(1); }
  W.brain = meshes.filter((m) => m.userData.tissue === 'brain');
  for (const m of W.brain) { m.material.transparent = true; m.material.opacity = 0; m.visible = false; m.castShadow = false; m.material.emissive.set(0xffb27a); }
  W.skull = meshes.filter((m) => m.parent === R.seg.Atlas.g && m.userData.tissue !== 'brain');
  for (const m of W.skull) m.material.transparent = true;
  W.hips = meshes.filter((m) => /hip bone|femur|sacrum/i.test(m.userData.name));
  W.wristL = makeWrist(R, 'Left'); W.wristR = makeWrist(R, 'Right');
  W.handL = rigHand(R, 'Left', W.wristL); W.handR = rigHand(R, 'Right', W.wristR); W.handL.wr = W.wristL; W.handR.wr = W.wristR;
  // ---- the pedometer, clipped to the front of the right hip bone
  const hb = worldVerts(R.byName.get('Right hip bone')); let top = -9; for (const v of hb) top = Math.max(top, v.y);
  const asis = hb.filter((v) => v.y > top - 0.09).reduce((a, v) => (v.z > a.z ? v : a)).clone();
  W.ped = new THREE.Group(); W.ped.position.copy(asis).sub(R.P0).add(new THREE.Vector3(-0.004, -0.018, 0.016)); R.pelvis.add(W.ped);
  const PR = 0.026, chrome = phys({ color: 0xd8dbe0, metalness: 1, roughness: 0.16, clearcoat: 0.6 });
  const caseM = new THREE.Mesh(new THREE.CylinderGeometry(PR, PR, 0.013, 96), chrome); caseM.rotation.x = Math.PI / 2; W.ped.add(caseM);
  const bezel = new THREE.Mesh(new THREE.TorusGeometry(PR - 0.0012, 0.0016, 16, 128), chrome); bezel.position.z = 0.0068; W.ped.add(bezel);
  W.faceCanvas = document.createElement('canvas'); W.faceCanvas.width = W.faceCanvas.height = 768;
  W.faceTex = new THREE.CanvasTexture(W.faceCanvas); W.faceTex.colorSpace = THREE.SRGBColorSpace; W.faceTex.anisotropy = 8;
  W.faceMat = new THREE.MeshPhysicalMaterial({ map: W.faceTex, roughness: 0.42, clearcoat: 0.3, emissive: new THREE.Color(0xffffff), emissiveMap: W.faceTex, emissiveIntensity: 0 });
  const face = new THREE.Mesh(new THREE.CircleGeometry(PR - 0.0026, 128), W.faceMat); face.position.z = 0.0068; W.ped.add(face);
  W.needleMat = phys({ color: 0x17181b, roughness: 0.4, emissive: ORANGE.clone(), emissiveIntensity: 0 });
  W.needle = new THREE.Group(); W.needle.position.z = 0.0074; W.ped.add(W.needle);
  const nd = new THREE.Mesh(new THREE.BoxGeometry(0.0007, 0.0185, 0.0006), W.needleMat); nd.position.y = 0.0075; W.needle.add(nd);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.0018, 0.0018, 0.0012, 32), W.needleMat); hub.rotation.x = Math.PI / 2; W.needle.add(hub);
  W.glass = new THREE.Mesh(new THREE.CircleGeometry(PR - 0.002, 96), phys({ color: 0x000000, roughness: 0.05, transparent: true, opacity: 0.16, depthWrite: false, specularIntensity: 0.6 }));
  W.glass.position.z = 0.0084; W.ped.add(W.glass);
  const clip = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.04, 0.003), chrome); clip.position.set(0, 0.012, -0.0095); W.ped.add(clip);
  shadows(W.ped); W.ped.traverse((o) => o.layers.enable(1));
  W.pedRest = W.ped.position.clone();
  // ---- the factory stamp along the outer face of the right thigh bone
  const femR = R.byName.get('Right femur');
  W.stampSpot = stampLine(femR, { a: [-0.3, 0.13, 0.0], b: [-0.3, -0.03, 0.018], dir: [1, 0, 0], top: [0, 0, 1] });
  if (W.stampSpot) W.stamp = stamp(femR, { canvas: labelCanvas('HUMAN FACTORY SETTINGS'), center: W.stampSpot.center, normal: W.stampSpot.normal, up: W.stampSpot.up, width: 0.15, depth: 0.04, opacity: 0.6 });
  // ---- the carrot on its headband, seated on the crown of the skull, the rod out over the face
  { const parts = ['Frontal bone', 'Right parietal bone', 'Left parietal bone'].map((n) => R.byName.get(n)).filter(Boolean);
    const vs = parts.flatMap((m) => worldVerts(m, 3)); let ymax = -9; for (const v of vs) ymax = Math.max(ymax, v.y);
    const crown = avgV(vs.filter((v) => v.y > ymax - 0.05));
    const atlas = R.seg.Atlas.g; R.root.updateMatrixWorld(true);
    // the band: round the skull 3.5 cm under the crown, 1.5 mm off the widest bone across its own thickness
    const skull = ['Frontal bone', 'Right parietal bone', 'Left parietal bone', 'Occipital bone', 'Right temporal bone', 'Left temporal bone', 'Sphenoid bone']
      .map((n) => R.byName.get(n)).filter(Boolean).flatMap((m) => worldVerts(m, 1));
    const yb = crown.y - 0.035, ring = skull.filter((v) => Math.abs(v.y - yb) < 0.011);
    const c = avgV(ring), NB = 96, rad = new Array(NB).fill(0);
    for (const v of ring) { const a = Math.atan2(v.z - c.z, v.x - c.x), k = ((Math.round((a / (2 * Math.PI)) * NB) % NB) + NB) % NB; rad[k] = Math.max(rad[k], Math.hypot(v.x - c.x, v.z - c.z)); }
    const r2 = rad.map((_, k) => Math.max(rad[(k + NB - 1) % NB], rad[k], rad[(k + 1) % NB]));   // the widest of each bin and its neighbours
    const band = r2.map((r, k) => { const a = (k / NB) * 2 * Math.PI, R0 = r + 0.009 + 0.0015; return new THREE.Vector3(R0 * Math.cos(a), 0, R0 * Math.sin(a)); });
    // the post stands on the skull: the highest bone under its foot (1.5 mm off)
    const px = c.x, pz = c.z + 0.03; let top = -9; for (const v of skull) if (Math.hypot(v.x - px, v.z - pz) < 0.011) top = Math.max(top, v.y);
    W.carrot = makeCarrot({ band, postY: top - yb + 0.0015 }); atlas.add(W.carrot.g);
    W.carrot.g.position.copy(atlas.worldToLocal(new THREE.Vector3(c.x, yb, c.z)));
    W.carrot.g.traverse((o) => o.layers.enable(1)); W.carHome = W.carrot.g.position.clone(); W.crownInfo = crown.toArray().map((v) => +v.toFixed(3)); }
  // ---- the hill: a dark slab whose top is the curve, a white line along its edge, ticks every thousand steps
  const N = 300, zs = [], slab = new THREE.Shape();
  for (let i = 0; i <= N; i++) zs.push(-0.3 + (Z_END + 0.3) * (i / N));
  slab.moveTo(zs[0], 0); for (const z of zs) slab.lineTo(z, hill(z)); slab.lineTo(Z_END, 0); slab.closePath();
  const geo = new THREE.ExtrudeGeometry(slab, { depth: 0.9, bevelEnabled: false, steps: 1 }); geo.rotateY(-Math.PI / 2); geo.translate(0.45, 0, 0);
  W.slabMat = phys({ color: 0x111317, roughness: 0.62, clearcoat: 0.25, clearcoatRoughness: 0.5, polygonOffset: true, polygonOffsetFactor: 2, polygonOffsetUnits: 4 });
  W.slab = new THREE.Mesh(geo, W.slabMat); W.slab.receiveShadow = true; W.slab.castShadow = false; W.slab.layers.enable(1); scene.add(W.slab);
  const linePts = zs.map((z) => new THREE.Vector3(-0.461, hill(z) + 0.009, z));
  W.lineMat = new THREE.ShaderMaterial({
    uniforms: { uDraw: { value: 0 }, uDash: { value: 0 }, uC: { value: new THREE.Color(0xeceef1).multiplyScalar(1.6) }, uO: { value: 1 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'uniform float uDraw, uDash, uO; uniform vec3 uC; varying vec2 vUv; void main(){ if (vUv.x > uDraw) discard; float d = step(0.5, fract(vUv.x * 90.0)); if (uDash > 0.5 && d < 0.5) discard; gl_FragColor = vec4(uC, uO); }',
    transparent: true,
  });
  W.line = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(linePts), 900, 0.008, 8, false), W.lineMat); scene.add(W.line);
  W.tickMat = new THREE.MeshBasicMaterial({ color: 0xa8acb3, transparent: true, opacity: 0 });
  W.barMat = new THREE.MeshBasicMaterial({ color: 0xdfe3ea, transparent: true, opacity: 0, depthWrite: false });   // a bar every thousand steps, floor to curve: the chart
  for (let k = 2; k <= 12; k++) {
    const t = new THREE.Mesh(new THREE.BoxGeometry(0.003, 0.05, 0.004), W.tickMat); t.position.set(-0.455, 0.025, zOf(k)); scene.add(t);
    const hk = hill(zOf(k)); if (hk > 0.02) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.002, hk, 0.006), W.barMat); b.position.set(-0.456, hk / 2, zOf(k)); scene.add(b); }
  }
  // ---- points of light that gather into the line (the studies, unnamed)
  W.dots = []; const st = new THREE.MeshBasicMaterial({ color: 0xeceef1 });
  for (let i = 0; i < 57; i++) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.012, 16, 12), st.clone()); m.material.transparent = true; scene.add(m);
    const k = i / 56, z = lerp(zOf(2), zOf(12), k);
    W.dots.push({ m, from: new THREE.Vector3(-1.4 + hash(i * 1.3) * 2.6, 0.4 + hash(i * 2.7) * 2.2, -1.5 + hash(i * 3.9) * 14), to: new THREE.Vector3(-0.461, hill(z) + 0.009, z), k });
  }
  // ---- the settings: 7,000 in orange, and the hill turned into stairs of a thousand
  W.markMat = glowMat(ORANGE); W.markMat.transparent = true; W.markMat.opacity = 0;
  W.mark = new THREE.Mesh(new THREE.BoxGeometry(0.94, 0.016, 0.05), W.markMat); W.mark.position.set(0, hill(zOf(7)) + 0.004, zOf(7)); scene.add(W.mark);
  W.stairs = [];
  for (let k = 2; k < 7; k++) {
    const z0 = zOf(k), z1 = zOf(k + 1), y1 = hill(z1);
    const mat = glowMat(ORANGE); mat.transparent = true; mat.opacity = 0;
    const tread = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.028, z1 - z0 + 0.028), mat); tread.position.set(-0.47, y1, (z0 + z1) / 2);
    const riser = new THREE.Mesh(new THREE.BoxGeometry(0.03, y1 - hill(z0), 0.028), mat); riser.position.set(-0.47, (y1 + hill(z0)) / 2, z0);
    scene.add(tread, riser); W.stairs.push(mat);
  }
  // ---- the couch, the bag, the phone
  W.couch = makeCouch(); W.couch.g.position.set(COUCH.x, 0, COUCH.z); scene.add(W.couch.g); W.couch.g.traverse((o) => o.layers.enable(1));
  W.bag = makeBag(); scene.add(W.bag.g); W.bag.g.traverse((o) => o.layers.enable(1));
  W.phone = makePhone(); scene.add(W.phone.g); W.phone.g.traverse((o) => o.layers.enable(1));
  // ---- light: a museum spot that walks with the skeleton, a cold rim, the hill's own soft light, one for the couch
  W.key = spot(scene, { color: 0xffe9d2, pos: new THREE.Vector3(-1.8, 3.6, 0), target: new THREE.Vector3(0, 1, 0), angle: 0.5, penumbra: 0.85, shadow: true, size: cfg.shadow ?? 1024 });
  W.key.shadow.camera.far = 9;
  W.rim = spot(scene, { color: 0xa9c4ff, pos: new THREE.Vector3(1.8, 2.8, -2), target: new THREE.Vector3(0, 1.1, 0), angle: 0.55, penumbra: 0.9 });
  W.fill = spot(scene, { color: 0xc8d6ff, pos: new THREE.Vector3(-2.6, 1.0, 0), target: new THREE.Vector3(0, 0.9, 0), angle: 0.6, penumbra: 1 });
  W.hillLight = spot(scene, { color: 0xdfe6f5, pos: new THREE.Vector3(-4, 6, zOf(7)), target: new THREE.Vector3(0, 0.3, zOf(7)), angle: 0.9, penumbra: 1 });
  W.couchLight = spot(scene, { color: 0xffd9b0, pos: new THREE.Vector3(COUCH.x - 1.2, 3.0, COUCH.z + 0.6), target: new THREE.Vector3(COUCH.x, 0.3, COUCH.z), angle: 0.45, penumbra: 0.8 });
  W.pedLight = new THREE.SpotLight(0xffe9d2, 0, 2.5, 0.07, 0.6, 2); scene.add(W.pedLight, W.pedLight.target);   // a pin light on the dial only
  W.brainLight = new THREE.PointLight(0xffb27a, 0, 0.6, 2); R.seg.Atlas.g.add(W.brainLight); W.brainLight.position.set(0, 0.08, 0.02);
  Z0 = HS_STOP1 - 0.27 - R.P0.z;
  // ---- the phone call at the top: the right hand solved to the right ear, the phone between them
  applyBody(T.phone + 0.6, { noProps: true }); R.root.updateMatrixWorld(true);
  { const tbm = R.byName.get('Right temporal bone'), tb = avgV(posedVerts(tbm, 3));
    const head = R.seg.Atlas.g.getWorldPosition(new THREE.Vector3()), qh = R.seg.Atlas.g.getWorldQuaternion(new THREE.Quaternion());
    const out = tb.clone().sub(head).setY(0).normalize();               // from the head out through the right ear
    const fwd = new THREE.Vector3(0, 0, 1).applyQuaternion(qh).setY(0).normalize(), up = new THREE.Vector3(0, 1, 0);
    // the phone against the ear: screen in, its top behind and above the ear, the bottom toward the mouth (25 degrees), 9 mm
    // off the nearest bone (the ear and the skin are not drawn)
    const top = up.clone().multiplyScalar(Math.cos(0.44)).addScaledVector(fwd, -Math.sin(0.44)), inward = out.clone().negate();
    top.addScaledVector(inward, -top.dot(inward)).normalize();
    const side = new THREE.Vector3().crossVectors(inward, top.clone().negate()).normalize();   // local x, so that x, y (in), z (down) is right-handed
    const qph = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(side, inward, top.clone().negate()));
    const headPts = []; R.seg.Atlas.g.traverse((m) => { if (!m.isMesh || !['bone', 'tooth', 'cartilage'].includes(m.userData.tissue)) return; m.updateMatrixWorld(true); const P = m.geometry.attributes.position, st = Math.max(1, Math.floor(P.count / 600)); for (let i = 0; i < P.count; i += st) headPts.push(new THREE.Vector3().fromBufferAttribute(P, i).applyMatrix4(m.matrixWorld)); });
    const ear = tb.clone().addScaledVector(top, -0.035), M = new THREE.Matrix4(), v = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1);
    const at = (d) => ear.clone().addScaledVector(out, d).addScaledVector(inward, PHONE.Th);   // the screen face d out from the ear point
    const clear = (d) => { M.compose(at(d), qph, one).invert(); let mn = 9; for (const p of headPts) mn = Math.min(mn, phoneSDF(v.copy(p).applyMatrix4(M))); return mn; };
    let lo = -0.03, hi = 0.12; for (let i = 0; i < 30; i++) { const m = (lo + hi) / 2; if (clear(m) >= 0.009) hi = m; else lo = m; }
    const ph = W.phone.g; ph.position.copy(at(hi)); ph.quaternion.copy(qph); ph.updateMatrixWorld(true);
    const toPh = ph.matrixWorld.clone().invert(), sdf = (p) => phoneSDF(v.copy(p).applyMatrix4(toPh));
    // the hand: palm on the back, fingers up along it (the way a phone is held to the ear); the elbow down and in front
    const H = W.handR;
    const target = new THREE.Vector3(0, 0.011, 0.02).applyMatrix4(ph.matrixWorld);   // the grip point (phone local): palm ~13 mm off the back, low on it
    const e1 = new THREE.Vector3(), s1 = new THREE.Vector3();
    const posture = (A) => { A.elbow.getWorldPosition(e1); A.arm.getWorldPosition(s1); return 2 * Math.max(0, e1.y - (s1.y - 0.06)) + 2 * Math.max(0, Math.abs(e1.x - s1.x) - 0.18); };
    H.curl(0.08, null, -0.4, FLAT_WRAP);   // fingers nearly straight, thumb out: all of them kept off the phone while the arm is solved
    W.callR = solveHand(R, 'Right', H, target, { dir: [0.3, -0.3, 0.9], twist: 0.6, elbow: 2.4 },
      [{ v: H.n, to: inward.clone(), w: 0.3 }, { v: H.fdir, to: top.clone(), w: 0.2 }], (A) => posture(A) + 2 * handGap(H, sdf).E,
      [{ dir: [0.3, -0.3, 0.9], twist: 0.6, elbow: 2.4 }, { dir: [0.5, -0.2, 0.8], twist: 0.2, elbow: 2.3 }, { dir: [0.2, -0.5, 0.8], twist: 1.0, elbow: 2.5 }]);
    poseArm(R.arms.Right, W.callR); setWrist(W.wristR, W.callR); R.root.updateMatrixWorld(true);
    W.callGrip = H.fit(sdf, { need: 0.003, kmin: 0.05, kmax: 0.95, prof: FLAT_WRAP, tmin: -0.8 }); H.curl(0, W.callGrip.per, W.callGrip.tk, FLAT_WRAP); R.root.updateMatrixWorld(true);
    W.wristR.g.attach(ph);
    const chk = handGap(H, sdf); H.curl(0.2);
    W.callInfo = { dbg: W.callR.dbg, off: +hi.toFixed(4), grip: W.callGrip, worst: +(chk.worst * 1000).toFixed(1), who: chk.who }; }
  // ---- where the pedometer and the carrot are when they let go, read now so any frame can be drawn alone
  { applyBody(T.anything - 0.25, { noProps: true }); R.root.updateMatrixWorld(true);
    W.pedRelP = W.ped.getWorldPosition(new THREE.Vector3()); W.pedRelQ = W.ped.getWorldQuaternion(new THREE.Quaternion());
    const zl = W.pedRelP.z + 0.16, xl = -0.3;
    // face up (12 o'clock toward +x), lying with the slope, its lowest point 1.5 mm off the hill
    W.pedLandQ = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -slopeOf(zl)).multiply(new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3(0, 0, 1), new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 1, 0))));
    { const P = W.ped, keep = P.parent, kp = P.position.clone(), kq = P.quaternion.clone(); scene.add(P); P.position.set(xl, hill(zl), zl); P.quaternion.copy(W.pedLandQ); P.updateMatrixWorld(true);
      let mn = 9; const v = new THREE.Vector3(); P.traverse((o) => { if (!o.isMesh) return; const G = o.geometry.attributes.position; for (let i = 0; i < G.count; i++) { v.fromBufferAttribute(G, i).applyMatrix4(o.matrixWorld); mn = Math.min(mn, v.y - R.ground(v.x, v.z)); } });
      W.pedLandP = new THREE.Vector3(xl, hill(zl) - mn + 0.0015, zl); keep.add(P); P.position.copy(kp); P.quaternion.copy(kq); }
    applyBody(CAR.tr, { noProps: true }); carrotOnHead(CAR.tr); R.root.updateMatrixWorld(true);
    W.carRelP = W.carrot.g.getWorldPosition(new THREE.Vector3()); W.carRelQ = W.carrot.g.getWorldQuaternion(new THREE.Quaternion());
    // where it comes to rest: on the floor beside the hill, band flat, rod pointing away from the path, the card's edge on the floor
    const C = W.carrot, keep = C.g.parent; scene.add(C.g); C.g.position.set(0, 0, 0); C.g.quaternion.copy(CAR.lq); C.spin.rotation.y = Math.PI; C.swing.rotation.set(0, 0, 0);
    const lowOf = (root, skip) => { root.updateMatrixWorld(true); let mn = 9; root.traverse((o) => { if (!o.isMesh || (skip && isUnder(o, skip))) return; const P = o.geometry.attributes.position, v = new THREE.Vector3(); for (let i = 0; i < P.count; i += 2) mn = Math.min(mn, v.fromBufferAttribute(P, i).applyMatrix4(o.matrixWorld).y); }); return mn; };
    const isUnder = (o, a) => { for (let p = o; p; p = p.parent) if (p === a) return true; return false; };
    const y0 = -lowOf(C.g, C.swing) + 0.002;
    C.g.position.set(CAR.x, y0, W.carRelP.z + 0.2);
    let lo = 0, hi = Math.PI / 2; for (let i = 0; i < 24; i++) { const m = (lo + hi) / 2; C.swing.rotation.set(-m, 0, 0); if (lowOf(C.swing) < 0.002) lo = m; else hi = m; }
    W.carLand = { p: C.g.position.clone(), q: CAR.lq.clone(), swing: hi };
    keep.add(C.g); C.g.position.copy(W.carHome); C.g.quaternion.identity(); C.swing.rotation.set(0, 0, 0); }
  { applyBody(T.owe + 0.6, { noProps: true }); R.root.updateMatrixWorld(true);
    const pw = W.ped.getWorldPosition(new THREE.Vector3());
    // the pedometer as a solid (its own frame: a disc 26 mm round, 13 mm thick along z), for the hand to close on it
    const toPed = W.ped.matrixWorld.clone().invert(), vp = new THREE.Vector3();
    const pedSDF = (p) => { vp.copy(p).applyMatrix4(toPed); const dr = Math.hypot(vp.x, vp.y) - 0.026, dz = Math.abs(vp.z) - 0.0065; return Math.hypot(Math.max(dr, 0), Math.max(dz, 0)) + Math.min(Math.max(dr, dz), 0); };
    W.handR.curl(0.15);
    W.unclipR = solveHand(R, 'Right', W.handR, pw.clone().add(new THREE.Vector3(-0.012, 0.004, 0.028)), { dir: [0.1, -0.7, 0.5], twist: 0.6, elbow: 1.5 },
      [{ v: W.handR.n, to: new THREE.Vector3(0.2, 0, -1).normalize(), w: 0.3 }, { v: W.handR.fdir, to: new THREE.Vector3(0, -0.7, -0.3).normalize(), w: 0.2 }],
      () => (R.clear ? R.clear.cost('Right') : 0) + 2 * handGap(W.handR, pedSDF, { palmOnly: true }).E);   // clear of the ribs, the palm off the dial
    poseArm(R.arms.Right, W.unclipR); setWrist(W.wristR, W.unclipR); R.root.updateMatrixWorld(true);
    W.unclipGrip = W.handR.fit(pedSDF, { need: 0.002, kmin: 0.05, kmax: 0.9, tmin: -0.6 }); W.handR.curl(0.2);
    W.unclipInfo = W.unclipR.dbg; }
  // the bag's rope handles in the left hand: each finger closes on them
  { applyBody(T.shop + 1.2); R.root.updateMatrixWorld(true);
    const bp = bagPose(T.shop + 1.2), toBag = new THREE.Matrix4().compose(bp.p, bp.q, new THREE.Vector3(1, 1, 1)).invert(), vb = new THREE.Vector3();
    W.bagGrip = W.handL.fit((p) => W.bag.ropeSDF(vb.copy(p).applyMatrix4(toBag)), { need: 0.002, kmin: 0.05, kmax: 0.9, tmin: -0.6 }); W.handL.curl(0.2); }
  applyBody(0, { noProps: true });
  buildTracks();
  return { stride: STRIDE, P0: R.P0.toArray(), stamp: W.stampSpot, call: W.callInfo, unclip: W.unclipInfo, crown: W.crownInfo, pedLand: W.pedLandP.toArray().map((v) => +v.toFixed(3)) };
}

// ------------------------------------------------------------------ the walk: walk, stop at the foot of the hill, climb, stop at 7,000
let Z0 = 0;
const S_STOP1 = 0.25 * STRIDE, S_STOP2 = S_STOP1 + 7 * STRIDE;
function easeDist(t, t0, t1, d, ramp) {
  const TT = t1 - t0, v = d / (TT - ramp), u = clamp01((t - t0) / TT) * TT;
  if (u < ramp) return (v * u * u) / (2 * ramp);
  if (u > TT - ramp) { const r = TT - u; return d - (v * r * r) / (2 * ramp); }
  return v * (u - ramp / 2);
}
const WALK1 = { t0: 0, t1: 17.9, d: 13.2, ramp: 1.4 }, WALK2 = { t0: 23.0, t1: 31.3, d: S_STOP2 - S_STOP1 };
function walk1(t) {
  const { t0, t1, d, ramp } = WALK1, v = d / (t1 - t0 - ramp / 2);
  if (t < t1 - ramp) return v * (t - t0);
  const r = Math.max(0, t1 - t); return d - (v * r * r) / (2 * ramp);
}
function sAt(t) {
  if (t < WALK2.t0) return S_STOP1 - WALK1.d + walk1(t);
  return S_STOP1 + easeDist(t, WALK2.t0, WALK2.t1, WALK2.d, 0.7);
}
function standW(t) { return ss(WALK1.t1 - 0.75, WALK1.t1 + 0.05, t) * (1 - ss(WALK2.t0 - 0.05, WALK2.t0 + 0.55, t)) + ss(WALK2.t1 - 0.75, WALK2.t1 + 0.05, t); }
const gaitOpts = () => ({ stride: STRIDE, ground: hill, slope: slopeOf, z0: Z0 });
function standPose(hsz) {
  const R = W.rig, out = { feet: {} };
  const zp = hsz + (R.P0.z - R.legs.Right.heel.z);
  out.pelvis = new THREE.Vector3(R.P0.x, R.P0.y - 0.004 + hill(zp), zp); out.pelvisRot = new THREE.Euler(0, 0, 0);
  for (const Side of ['Right', 'Left']) {
    const G = R.legs[Side], beta = slopeOf(hsz);
    const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -beta);
    const P = new THREE.Vector3(G.heel.x, hill(hsz) + G.heel.y, hsz);
    out.feet[Side] = { ankle: G.A.clone().sub(G.heel).applyQuaternion(q).add(P), q };
  }
  out.armR = ARM0; out.armL = ARM0; out.twist = 0; return out;
}
function bodyAt(t) {
  const R = W.rig, s = sAt(t), w = walkAt(R, s, gaitOpts());
  const k = standW(t);
  if (k > 0) {
    const st = standPose(t < WALK2.t0 - 0.5 ? HS_STOP1 : t < WALK2.t1 - 1.5 ? HS_STOP1 : HS_STOP2);
    w.pelvis.lerp(st.pelvis, k); w.pelvisRot.set(lerp(w.pelvisRot.x, 0, k), lerp(w.pelvisRot.y, 0, k), lerp(w.pelvisRot.z, 0, k));
    for (const Side of ['Right', 'Left']) {
      const a = w.feet[Side], b = st.feet[Side], lift = a.stance ? 0 : 0.035 * Math.sin(Math.PI * k);
      a.ankle.lerp(b.ankle, k); a.ankle.y += lift; a.q.slerp(b.q, k);
    }
    const mix = (x, y) => ({ dir: x.dir.map((v, i) => lerp(v, y.dir[i], k)), twist: lerp(x.twist || 0, 0, k), elbow: lerp(x.elbow, y.elbow, k), retract: 0, elevate: 0, mix: [x, y, k] });
    w.armR = mix(w.armR, ARM0); w.armL = mix(w.armL, ARM0); w.twist *= 1 - k;
  }
  return w;
}
// the hands' jobs: the right goes to the right hip to unclip the pedometer, later takes the call; the left carries the bag
const ARM_UNCLIP = { dir: [-0.12, -0.75, 0.62], twist: 0.6, elbow: 1.35, wf: 0.3 };
const ARM_BAG = { dir: [0.1, -1, 0.04], twist: 0.2, elbow: 0.12, wf: 0 };
function applyBody(t, extra = {}) {
  const R = W.rig, b = bodyAt(t), props = !extra.noProps;
  R.pelvis.position.copy(b.pelvis); R.pelvis.rotation.copy(b.pelvisRot);
  const un = props ? pulse(t, T.owe - 0.25, T.anything + 0.3, 0.35) : 0;
  bendSpine(R.seg, { tho: 0.04 + 0.06 * ss(WALK2.t0, WALK2.t0 + 1, t) * (1 - ss(WALK2.t1 - 1, WALK2.t1, t)), cer: (extra.cer || 0) + 0.25 * un, twist: b.twist, lum: 0.1 * un });
  let aR = { ...b.armR, wf: 0, wd: 0, wr: 0 }, aL = { ...b.armL, wf: 0, wd: 0, wr: 0 };
  const call = props && W.callR ? pulse(t, T.phone - 0.45, T.your3 + 0.2, 0.4) : 0, bag = props ? ss(T.shop - 0.4, T.shop, t) : 0;
  if (un > 0) aR = mixArm(aR, W.unclipR || ARM_UNCLIP, un);
  if (call > 0) aR = mixArm(aR, W.callR, call);
  if (bag > 0) aL = mixArm(aL, ARM_BAG, bag);
  poseArm(R.arms.Right, aR); setWrist(W.wristR, aR); poseArm(R.arms.Left, aL); setWrist(W.wristL, aL);
  { const U = W.unclipGrip, tr = T.anything - 0.25, ug = un * (1 - s5(tr - 0.2, tr, t));   // the fingers open just before it is let go
    const b0 = 0.2, G = W.callGrip;
    if (U && ug > 0) gripCurl(W.handR, U, ug, b0);
    else if (G && call > 0) gripCurl(W.handR, G, call, b0, FIST.map((f, j) => lerp(f, FLAT_WRAP[j], call))); else W.handR.curl(b0);
    const B = W.bagGrip, bg = bag * (1 - s5(T.final - 0.25, T.final + 0.05, t)); if (B && bg > 0) gripCurl(W.handL, B, bg, 0.2); else W.handL.curl(0.2); }
  clearArms(R);   // no arm through the trunk, in any pose or between poses
  for (const Side of ['Right', 'Left']) legIK(R, Side, b.feet[Side].ankle, b.feet[Side].q);
  R.root.updateMatrixWorld(true);
  return b;
}
const stepsAt = (t) => 9985.6 + (2 * sAt(t)) / STRIDE - (2 * sAt(T.day)) / STRIDE + 14.4;   // the counter reads 10,000 on "day"

// ------------------------------------------------------------------ the camera: one path, no cuts
let CAM;
function buildTracks() {
  const R = W.rig;
  const pz = (t) => R.P0.z + Z0 + sAt(t), hz = (t) => hill(pz(t));
  const R0 = W.pedRest, px = R.P0.x + R0.x, py = R.P0.y + R0.y, dz0 = R0.z;
  // the camera stays on his right (-x), so the dial, the chart's face and the right hand all face it. Words sit in the top third, so
  // every framing keeps his head below about 30% of the frame
  const P = (t, dx, dy, dz, fov, tens) => ({ t, p: V3(px + dx, py + dy, pz(t) + dz0 + dz), l: V3(px, py + 0.018, pz(t) + dz0), fov, tens });   // the dial, a little under centre (camPose locks it to the live dial)
  const Hd = (t, dx, y, dz, ly, lz, fov, tens) => ({ t, p: V3(dx, y, pz(t) + dz), l: V3(0, ly, pz(t) + lz), fov, tens });         // his head and the card, riding along
  const Sd = (t, tens) => ({ t, p: V3(-4.75, hz(t) + 1.5, pz(t) + 0.9), l: V3(0, hz(t) + 1.2, pz(t) + 0.55), fov: 34, tens });   // his whole right side, the slope under his feet
  const z7 = zOf(7), y7 = hill(z7), zS = pz(WALK1.t1);
  applyBody(36, { noProps: true }); R.root.updateMatrixWorld(true);
  const hd = R.seg.Atlas.g.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, 0.08, 0.02)).toArray();
  const hp = R.pelvis.getWorldPosition(new THREE.Vector3()).toArray();
  const fc = W.pedLandP.toArray(), cl = [-0.6, 0.1, W.carRelP.z + 0.12];
  const K = [
    Hd(-4.6, -1.15, 1.68, 1.55, 1.66, 0.22, 36),
    Hd(0.0, -1.15, 1.68, 1.55, 1.66, 0.22, 36),          // the hook: his head, and the card dangling in front of it
    Hd(3.6, -0.95, 1.69, 1.38, 1.66, 0.25, 34),
    Hd(5.2, -0.42, 1.70, 1.12, 1.68, 0.47, 30),          // in on the card: who picked that number?
    P(6.6, -0.07, 0.10, 0.40, 26, 0.25),                  // the pedometer: 1965, ten-thousand-steps meter
    P(10.2, -0.09, 0.11, 0.38, 26, 0.6),
    P(13.6, -0.05, 0.09, 0.36, 25, 0.4),
    Hd(14.5, -0.95, 1.38, 1.55, 1.4, 0.22, 32),          // out and up, clear of his ribs
    Hd(15.4, -0.85, 1.70, 1.42, 1.68, 0.31, 32, 0.3),    // back to the card: it spins round, SLOGAN
    Hd(17.6, -0.9, 1.70, 1.46, 1.67, 0.3, 32, 0.4),
    { t: 19.6, p: V3(-1.45, 1.62, zS + 1.9), l: V3(0, 1.55, zS + 0.2), fov: 34, tens: 0.35 },     // he stops: waist up. The contraption drops out of frame
    { t: 21.5, p: V3(-1.55, 1.6, zS + 2.0), l: V3(0, 1.5, zS + 0.2), fov: 34, tens: 0.35 },
    Sd(23.2),                                                                                      // pull out to his side: the hill forms in front of him
    Sd(24.6), Sd(26.3), Sd(28.0), Sd(29.7),                                                        // the climb, tracking his right side
    Sd(31.3, 0.4),                                                                                 // he stops at 7,000
    { t: 32.6, p: V3(-4.6, y7 + 1.5, z7 + 0.85), l: V3(0, y7 + 1.2, z7 + 0.5), fov: 34, tens: 0.4 },
    { t: 33.6, p: vadd(hd, [-1.15, 0.05, -0.1]), l: vadd(hd, [0, -0.02, 0.0]), fov: 30, tens: 0.3 }, // the brain, in profile: dementia
    { t: 34.45, p: vadd(hd, [-1.17, 0.06, -0.08]), l: vadd(hd, [0, -0.02, 0.0]), fov: 30, tens: 0.3 },
    { t: 35.4, p: vadd(hp, [-1.5, 0.2, -0.5]), l: vadd(hp, [0, -0.15, 0.0]), fov: 32, tens: 0.4 },   // the hips: falls
    { t: 37.4, p: V3(-0.2, y7 + 2.3, z7 - 2.2), l: V3(-0.1, y7 + 0.45, z7 + 4.6), fov: 34, tens: 0.3 }, // past 7,000: flat ahead, over his shoulder
    { t: 40.0, p: V3(-0.22, y7 + 2.25, z7 - 2.1), l: V3(-0.1, y7 + 0.45, z7 + 4.6), fov: 34, tens: 0.4 },
    { t: 40.55, p: V3(-1.0, y7 + 1.9, z7 - 1.5), l: V3(0, y7 + 1.2, z7 + 0.3), fov: 34 },             // down to him
    { t: 41.0, p: V3(-2.0, y7 + 1.45, z7 + 0.6), l: V3(0, y7 + 1.05, z7 + 0.1), fov: 34 },            // round to his right side: walk more if you enjoy it
    { t: 41.9, p: vadd(hp, [-1.0, -0.05, 0.95]), l: vadd(hp, [0, 0.02, 0.1]), fov: 32, tens: 0.3 },   // the pedometer: unclipped
    { t: 43.25, p: vadd(hp, [-1.02, -0.06, 0.97]), l: vadd(hp, [0, 0.0, 0.1]), fov: 32, tens: 0.3 },
    { t: 44.2, p: vadd(hp, [-1.05, -0.3, 1.0]), l: vadd(fc, [0, 0.05, -0.02]), fov: 32, tens: 0.3 },  // and dropped: follow it down
    { t: 45.2, p: vadd(hp, [-1.06, -0.32, 1.02]), l: vadd(fc, [0, 0.05, -0.02]), fov: 32, tens: 0.4 },
    { t: 46.4, p: V3(-1.9, 1.75 + y7, zOf(10.5)), l: V3(0, 0.95 + y7, zOf(7.6)), fov: 34, tens: 0.3 }, // a link, not proof: the line goes dashed
    { t: 50.6, p: V3(-1.8, 1.72 + y7, zOf(10.3)), l: V3(0, 0.9 + y7, zOf(7.4)), fov: 34, tens: 0.4 },
    { t: 52.4, p: V3(-2.9, 3.4, 14.2), l: V3(0, 0.8, zOf(4.6)), fov: 34, tens: 0.3 },                // the plan, from the far end looking back down
    { t: 57.9, p: V3(-2.4, 3.05, 12.9), l: V3(0, 0.9, zOf(5.0)), fov: 34, tens: 0.4 },
    { t: 59.2, p: vadd(hp, [-1.75, 0.6, 2.35]), l: vadd(hp, [0, 0.5, 0.05]), fov: 36, tens: 0.3 },   // the bag
    { t: 59.65, p: vadd(hp, [-1.74, 0.6, 2.33]), l: vadd(hp, [0, 0.5, 0.05]), fov: 36, tens: 0.3 },
    { t: 60.25, p: V3(-1.7, y7 + 2.3, z7 + 4.3), l: V3(0, y7 - 0.1, z7 - 2.2), fov: 34, tens: 0.3 },  // out wide: the stairs light up behind him
    { t: 60.65, p: V3(-1.68, y7 + 2.28, z7 + 4.25), l: V3(0, y7 - 0.1, z7 - 2.2), fov: 34, tens: 0.3 },
    { t: 61.35, p: vadd(hp, [-1.75, 0.6, 2.35]), l: vadd(hp, [0, 0.5, 0.05]), fov: 36, tens: 0.3 },   // back in: the call
    { t: 62.4, p: vadd(hp, [-1.72, 0.6, 2.3]), l: vadd(hp, [0, 0.5, 0.05]), fov: 36, tens: 0.4 },
    { t: 63.4, p: V3(COUCH.x - 2.2, 1.55, COUCH.z + 1.9), l: V3(COUCH.x + 0.35, 0.62, COUCH.z - 0.1), fov: 36, tens: 0.3 },   // the couch, down below
    { t: 64.6, p: V3(COUCH.x - 2.1, 1.6, COUCH.z + 1.8), l: V3(COUCH.x + 0.35, 0.6, COUCH.z - 0.1), fov: 36, tens: 0.4 },
    { t: 66.3, p: vadd(fc, [-0.35, 0.75, 0.05]), l: fc, fov: 32 },                                     // up and over to the pedometer on the hill
    { t: T.logo, p: vadd(fc, [-0.02, 0.5, 0.0]), l: fc, fov: 30, stop: true },                        // straight down onto its face: the logo
  ];
  // every key rides with him: stored relative to where he is at that moment, so a framing holds while he walks (and the
  // hold tension means "hold on him", not "stop dead in the world"). While he stands, relative and world are the same.
  const Wv = (t) => [0, hz(t), pz(t)];
  for (const k of K) { const w = Wv(k.t); k.p = k.p.map((v, i) => v - w[i]); k.l = k.l.map((v, i) => v - w[i]); }
  const C0 = camTrack(K);
  CAM = (t) => { const P = C0(t), w = Wv(t); return { p: vadd(P.p, w), l: vadd(P.l, w), fov: P.fov }; };
}
function camPose(S, t) {
  if (S.cfg.view) return S.cfg.view;
  if (t <= T.logo) {
    const P = CAM(t), k = ss(5.7, 6.6, t) * (1 - ss(13.6, 14.4, t));   // the dial close-ups lock on to the live dial (the hip sways as he walks)
    if (k > 0 && W.ped.parent === W.rig.pelvis) {
      // the offset is read once per frame (at the time the body was posed), so the shutter's two ends see the same lock: no false blur
      const R = W.rig, w = W.ped.getWorldPosition(new THREE.Vector3()), tn = W.tNow ?? t;
      const d = [w.x - (R.P0.x + W.pedRest.x), w.y - (R.P0.y + W.pedRest.y), w.z - (R.P0.z + Z0 + sAt(tn) + W.pedRest.z)].map((v) => v * k);
      return { p: vadd(P.p, d), l: vadd(P.l, d), fov: P.fov };
    }
    return P;
  }
  const P = CAM(T.logo), k = ss(T.logo, T.end, t);
  return { p: [P.p[0], P.p[1] - 0.03 * k, P.p[2]], l: P.l, fov: 30 };
}
function camFocus(S, t, P) {
  const d = new THREE.Vector3().fromArray(P.p).distanceTo(new THREE.Vector3().fromArray(P.l)), dir = S.cam.getWorldDirection(new THREE.Vector3());
  const k = ss(5.6, 6.6, t) * (1 - ss(13.6, 15.0, t));   // the pedometer close-ups: on the dial
  if (k > 0) { const f = faceFrame(); return lerp(d, f.c.clone().sub(S.cam.position).dot(dir), Math.min(1, k)); }
  const kf = ss(22.0, 23.2, t) * (1 - ss(31.8, 32.8, t));   // following him up the hill: on him
  if (kf > 0) { const c = W.rig.pelvis.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, 0.45, 0)); return lerp(d, c.sub(S.cam.position).dot(dir), kf); }
  return d;
}
function carrier(S, t) { const z = W.rig.P0.z + Z0 + sAt(t); return [0, hill(z), z]; }
function faceFrame() { W.ped.updateWorldMatrix(true, false); return { c: new THREE.Vector3(0, 0, 0.0084).applyMatrix4(W.ped.matrixWorld), n: new THREE.Vector3(0, 0, 1).transformDirection(W.ped.matrixWorld).normalize() }; }

// ------------------------------------------------------------------ one moment of the film
let lastFace = '';
function fallAt(t, t0, P0, Q0, P1, Q1, h = 0.1) {   // let go at t0, drop under gravity onto P1, tip to Q1, one small bounce
  const tf = Math.sqrt(Math.max(0.01, 2 * (P0.y - P1.y) / 9.8)), u = clamp01((t - t0) / tf), p = new THREE.Vector3();
  p.x = lerp(P0.x, P1.x, u); p.z = lerp(P0.z, P1.z, u); p.y = Math.max(P1.y, P0.y - 4.9 * Math.pow(Math.min(t - t0, tf), 2));
  if (t > t0 + tf) { const b = t - t0 - tf, bt = 0.22; p.y = P1.y + (b < bt ? h * 4 * (b / bt) * (1 - b / bt) : 0); }
  const q = Q0.clone().slerp(Q1, s5(0, 1, clamp01((t - t0) / (tf + 0.12))));
  return { p, q };
}
// the bag hangs from the left hand's grip, its rope handles along the hand's knuckles (through the closed fingers); it
// grows in and shrinks away about its own middle, so the handles never pass through the hand
const BAG_MID = 0.25;
function bagPose(t) {
  const s = s5(T.shop - 0.35, T.shop - 0.05, t) * (1 - s5(T.final - 0.2, T.final + 0.3, t));
  const W2 = W.wristL.g, hp = W.handL.handle.clone().applyMatrix4(W2.matrixWorld), a = W.handL.across.clone().applyQuaternion(W2.getWorldQuaternion(new THREE.Quaternion()));
  const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.05 * Math.sin(t * 3), Math.atan2(-a.z, a.x), 0, 'YXZ'));
  return { s, q, p: hp.add(new THREE.Vector3(0, -BAG_MID * (1 - s), 0)) };
}
// the carrot comes off on "need": it pops up off the crown, tipping to its right, then falls beside the hill
const CAR = { td: T.need - 0.05, tr: T.need + 0.11, x: -0.85, lq: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI / 2) };
function carrotOnHead(t) {
  const C = W.carrot, a = R_ATLAS(); if (C.g.parent !== a) a.add(C.g);
  const k = s5(0, 1, clamp01((t - CAR.td) / (CAR.tr - CAR.td)));
  C.g.position.copy(W.carHome); C.g.position.y += 0.1 * k; C.g.quaternion.setFromAxisAngle(new THREE.Vector3(0, 0, 1), 0.35 * k);
}
const R_ATLAS = () => W.rig.seg.Atlas.g;
function update(S, t) {
  const scene = S.scene, R = W.rig; W.tNow = t;
  // ---- the body
  const b = applyBody(t, { cer: -0.05 * ss(T.above - 0.5, T.above + 1, t) });
  // ---- light follows the walker
  const zc = b.pelvis.z, yc = b.pelvis.y;
  const figure = 1 - ss(T.final + 0.2, T.logo - 0.4, t);
  W.key.position.set(-1.8, yc + 2.7, zc + 1.1); W.key.target.position.set(0, yc + 0.05, zc);
  W.key.intensity = figure * lerp(3.0, 4.6, ss(4.0, 7.0, t)) * (1 - 0.45 * ss(5.6, 6.6, t) * (1 - ss(13.6, 14.6, t))) * (1 - 0.35 * ss(T.link - 0.3, T.link + 0.8, t) * (1 - ss(T.aim - 0.4, T.aim + 0.6, t)));
  W.rim.position.set(1.8, yc + 1.9, zc - 2.0); W.rim.target.position.set(0, yc + 0.2, zc); W.rim.intensity = figure * 2.4;
  W.fill.position.set(-2.6, yc + 0.1, zc); W.fill.target.position.set(0, yc, zc); W.fill.intensity = figure * 0.9;
  const pw = W.ped.getWorldPosition(new THREE.Vector3());
  W.pedLight.position.copy(pw).add(new THREE.Vector3(-0.35, 0.45, 0.7)); W.pedLight.target.position.copy(pw);
  W.pedLight.intensity = ss(5.6, 6.4, t) * (1 - ss(13.8, 15.4, t)) * 3.0 + ss(T.final - 0.5, T.final + 0.8, t) * 2.0 * (1 - ss(T.logo - 0.2, T.logo + 0.6, t));
  W.hillLight.intensity = ss(H0, H0 + 3.0, t) * 0.6 * figure;
  W.couchLight.intensity = pulse(t, T.your3 - 0.5, T.final + 0.6, 0.35) * 5.0;
  const endDark = ss(T.final + 0.2, T.logo - 0.3, t);
  S.tableMat.color.setScalar(FLOOR * (1 - endDark * 0.95)); scene.environmentIntensity = 0.12 * (1 - endDark); S.reflAmt = 0.9 * (1 - endDark);
  W.slabMat.color.set(0x111317).multiplyScalar(1 - endDark);

  // ---- the carrot: it bobs with the walk and swings; the card spins round on "slogan"; the whole thing falls off on "need"
  { const C = W.carrot, sw = Math.sin(t * 5.6) * 0.16 * (1 - standW(t) * 0.7) + Math.sin(t * 2.1) * 0.05;
    const spin = outBack(clamp01((t - (T.slogan - 0.12)) / 0.45), 1.4); C.spin.rotation.y = Math.PI * spin + 0.12 * Math.sin(t * 1.7);
    if (t < CAR.tr) { carrotOnHead(t); const k = ss(CAR.td, CAR.tr, t); C.swing.rotation.set(sw * 0.6 * (1 - k), 0, sw * 0.25 * (1 - k)); }
    else {
      if (C.g.parent !== scene) scene.add(C.g);
      const L = W.carLand, P0 = W.carRelP, tf = Math.sqrt(2 * (P0.y - L.p.y) / 9.8), u = clamp01((t - CAR.tr) / tf), e = 1 - (1 - u) ** 2;   // out to the side first, then down
      C.g.position.set(lerp(P0.x, L.p.x, e), Math.max(L.p.y, P0.y - 4.9 * (t - CAR.tr) ** 2), lerp(P0.z, L.p.z, u));
      if (t > CAR.tr + tf) { const b = t - CAR.tr - tf; C.g.position.y = L.p.y + (b < 0.2 ? 0.03 * 4 * (b / 0.2) * (1 - b / 0.2) : 0); }
      C.g.quaternion.copy(W.carRelQ).slerp(L.q, s5(0, 1, clamp01((t - CAR.tr) / (tf + 0.1))));
      const k = s5(0, 1, clamp01((t - CAR.tr) / (tf + 0.15))); C.swing.rotation.set(-L.swing * k, 0, 0);
      C.spin.rotation.y = Math.PI * spin + 0.12 * Math.sin(t * 1.7) * (1 - k);
    } }

  // ---- the pedometer: on the hip, the needle reads the count; unclipped and dropped on "anything"; face up, it becomes the logo
  { const P = W.ped, tr = T.anything - 0.25;
    if (t < tr) { if (P.parent !== R.pelvis) { R.pelvis.add(P); P.position.copy(W.pedRest); P.quaternion.identity(); } }
    else { if (P.parent !== scene) scene.add(P); const f = fallAt(t, tr, W.pedRelP, W.pedRelQ, W.pedLandP, W.pedLandQ, 0.05); P.position.copy(f.p); P.quaternion.copy(f.q); }
    const count = t < tr ? stepsAt(t) : stepsAt(tr);
    const toTwelve = s5(T.final + 0.3, T.logo - 0.25, t), logoK = s5(T.final + 0.4, T.logo - 0.2, t);
    const a = lerp((-135 + (270 * Math.min(14, count / 1000)) / 14) * (Math.PI / 180), 0, toTwelve);
    W.needle.rotation.z = -a;
    W.needleMat.color.set(0x17181b).lerp(ORANGE, toTwelve); W.needleMat.emissiveIntensity = toTwelve * 1.2;
    const key = `${count.toFixed(3)}|${logoK.toFixed(3)}`;
    if (key !== lastFace) { pedometerFace(W.faceCanvas, count, logoK); W.faceTex.needsUpdate = true; lastFace = key; }
    W.faceMat.emissiveIntensity = 0.15 + 0.35 * logoK;
    const ding = Math.exp(-Math.max(0, t - T.day) * 3) * (t > T.day ? 1 : 0); W.faceMat.emissiveIntensity += ding * 0.5; }

  // ---- the hill rises out of points of light; ticks and bars every thousand steps
  { for (const d of W.dots) {
      const on = ss(H0 - 0.3 + d.k * 0.8, H0 + 0.1 + d.k * 0.8, t), fly = s5(H0 + 0.6 + d.k * 0.9, H0 + 2.2 + d.k * 0.9, t);
      d.m.position.lerpVectors(d.from, d.to, fly); d.m.position.y += Math.sin(Math.PI * fly) * 0.35;
      d.m.material.opacity = on * (1 - ss(0.85, 1, fly)); d.m.visible = d.m.material.opacity > 0.01;
    }
    W.lineMat.uniforms.uDraw.value = ss(H0 + 1.2, H0 + 4.0, t) * 1.001;
    W.lineMat.uniforms.uDash.value = t > T.link - 0.1 && t < T.aim ? 1 : 0;
    W.lineMat.uniforms.uO.value = 1 - endDark;
    const rise = s5(H0 + 1.0, H0 + 4.2, t); W.slab.visible = rise > 0.001; W.slab.scale.y = Math.max(0.001, rise);
    W.tickMat.opacity = ss(H0 + 2, H0 + 3, t) * 0.7 * (1 - endDark);
    W.barMat.opacity = ss(H0 + 2.4, H0 + 3.6, t) * 0.2 * (1 - endDark); }
  // ---- the settings: 7,000 in orange; the slope as stairs of a thousand, lit one by one; they pulse on "take the stairs"
  W.markMat.opacity = ss(T.seven3 - 0.2, T.seven3 + 0.3, t) * (1 - endDark);
  const stairPulse = 1 + 0.8 * pulse(t, T.stairs - 0.1, T.stairs + 0.9, 0.25);
  W.stairs.forEach((m, i) => { m.opacity = Math.min(1, ss(T.add + i * 0.28, T.add + 0.2 + i * 0.28, t) * stairPulse) * (1 - endDark); m.color.copy(ORANGE).multiplyScalar(stairPulse); });

  // ---- the readouts: the brain for dementia, the hips for falls
  const br = ss(T.dementia - 0.2, T.dementia + 0.6, t) * (1 - ss(T.falls + 0.2, T.falls + 0.9, t));
  for (const m of W.brain) { m.visible = br > 0.002; m.material.opacity = br; m.material.emissiveIntensity = br * 0.3; }
  for (const m of W.skull) { m.material.opacity = 1 - 0.7 * br; m.material.depthWrite = br < 0.5; }
  W.brainLight.intensity = br * 0.25;
  const fl = ss(T.falls, T.falls + 0.5, t) * (1 - ss(T.above + 0.2, T.above + 0.8, t));
  for (const m of W.hips) { m.material.emissive.set(0xffb27a); m.material.emissiveIntensity = fl * 0.22; }

  // ---- the bag in the left hand (hanging straight down), the phone in the right
  { const bp = bagPose(t); W.bag.g.visible = bp.s > 0.01; W.bag.g.scale.setScalar(Math.max(0.001, bp.s));
    if (W.bag.g.visible) { W.bag.g.position.copy(bp.p); W.bag.g.quaternion.copy(bp.q); }
    const callOn = pulse(t, T.phone - 0.3, T.your3 + 0.1, 0.25);
    W.phone.g.visible = callOn > 0.01; W.phone.g.scale.setScalar(Math.max(0.001, callOn));
    W.phone.screenMat.color.setScalar(0.9 * callOn); }
  // ---- the couch: it pops up on "your couch", its light comes on; the cushions breathe out on "survive"
  { const pop = clamp01((t - (T.your3 - 0.45)) / 0.5); W.couch.g.visible = pop > 0; W.couch.g.scale.setScalar(Math.max(0.001, outBack(pop, 1.7)));
    const sigh = Math.exp(-Math.max(0, t - T.survive) * 3.2) * (t > T.survive ? 1 : 0) * Math.sin(Math.max(0, t - T.survive) * 9);
    W.couch.cushions.forEach((c, i) => { c.scale.y = 1 + 0.12 * sigh * (i === 1 ? 1 : 0.6); }); }
}

// ------------------------------------------------------------------ the words on screen
const CAPS = [
  { t0: T.you, t1: 5.75, top: 292, size: 80, html: 'You’ve been chasing<br><em>10,000 steps</em> a day<br>without ever asking<br>who picked that number.' },
  { t0: T.it, t1: 10.0, top: 292, size: 84, html: 'It was probably<br>a Japanese company<br>in <em>1965</em>,' },
  { t0: T.selling, t1: 14.6, top: 292, size: 80, html: 'selling a pedometer<br>whose name meant<br><em>ten-thousand-steps meter.</em>' },
  { t0: T.youve, t1: 17.9, top: 300, size: 88, html: 'You’ve been<br>doing cardio for a<br><em>marketing slogan.</em>' },
  { t0: 18.31, t1: 20.1, top: 300, size: 84, html: 'Your body was built<br>to <em>walk</em>,' },
  { t0: 20.15, t1: 23.0, top: 292, size: 84, html: 'and it doesn’t need<br><em>10,000 steps</em><br>to thank you.' },
  { t0: T.people, t1: 26.0, top: 300, size: 84, html: 'People who walk about<br><em>7,000 steps</em> a day' },
  { t0: 26.05, t1: 28.75, top: 300, size: 84, html: 'have around <em>half the risk</em><br>of dying early' },
  { t0: 28.8, t1: 32.0, top: 300, size: 84, html: 'compared with people<br>who walk <em>2,000.</em>' },
  { t0: T.they, t1: 35.15, top: 292, size: 84, html: 'They also have a lower<br>risk of <em>dementia</em><br>and <em>falls</em>,' },
  { t0: 35.2, t1: 40.3, top: 292, size: 84, html: 'and above 7,000,<br>the extra benefit is <em>small</em><br>for most things.' },
  { t0: T.walkmore, t1: 42.0, top: 300, size: 88, html: 'Walk more<br>if you <em>enjoy</em> it,' },
  { t0: 42.05, t1: 45.0, top: 300, size: 80, html: 'but you don’t owe<br>the <em>pedometer</em> anything.' },
  { t0: 45.39, t1: 47.3, top: 300, size: 84, html: 'To be fair, that’s<br>a <em>link, not proof,</em>' },
  { t0: 47.33, t1: 51.2, top: 292, size: 84, html: 'partly because people<br>who are already sick<br>walk less.' },
  { t0: T.so, t1: 54.1, top: 300, size: 84, html: 'So aim for about<br><em>7,000 steps</em> a day,' },
  { t0: 54.15, t1: 58.3, top: 292, size: 84, html: 'and if you’re far<br>below that, add<br><em>a thousand</em> at a time.' },
  { t0: T.walk3, t1: 62.75, top: 292, size: 80, html: 'Walk to the <em>shop</em>,<br>take the <em>stairs</em>, and take<br>your phone calls <em>on foot.</em>' },
  { t0: T.your3, t1: 64.9, top: 300, size: 96, html: 'Your couch<br>will <em>survive.</em>' },
  { t0: T.final, t1: 99, top: 360, size: 92, html: 'Let’s get you back to<br><em>factory settings.</em>' },
];
const OVL = {};
function overlayInit(S) {
  const O = S.O, tag = (cls, txt, size, bsize) => { const e = O.tag(cls, txt); e.style.fontSize = size + 'px'; const b = e.querySelector('b'); if (b && bsize) b.style.fontSize = bsize + 'px'; return e; };
  const pill = (e) => Object.assign(e.style, { background: 'rgba(8,9,11,.58)', padding: '12px 18px 14px', borderRadius: '16px', color: '#d4d7dc' });
  OVL.k2 = tag('tag', '2,000 steps', 26); OVL.k7 = tag('tag', '7,000 steps', 26); OVL.k10 = tag('tag', '10,000', 24); OVL.k12 = tag('tag', '12,000', 24);
  OVL.half = tag('tag', 'At 7,000 steps, vs 2,000:<br>risk of dying early<b>about half</b>', 22, 40); pill(OVL.half);
  OVL.dem = tag('tag', 'Dementia<b>lower risk</b>', 22, 40); pill(OVL.dem);
  OVL.falls = tag('tag', 'Falls<b>lower risk</b>', 22, 40); pill(OVL.falls);
  OVL.flat = tag('tag', 'Past 7,000<b>small extra benefit</b>', 22, 36); pill(OVL.flat);
  OVL.link = tag('tag', 'The line<b>a link, not proof</b>', 22, 36); pill(OVL.link);
  OVL.add = [3, 4, 5, 6, 7].map((k) => tag('tag o', '+1,000', 22));
}
function overlay(S, t) {
  const y = (k) => hill(zOf(k)), P = (x, yy, z) => new THREE.Vector3(x, yy, z);
  const hillOn = ss(H0 + 2.9, H0 + 3.7, t) * (1 - ss(T.final - 0.2, T.final + 0.4, t));
  place(S, OVL.k2, P(-0.46, -0.02, zOf(2)), -60, 18, hillOn * (1 - ss(T.they + 0.6, T.they + 1.1, t)));
  place(S, OVL.k7, P(-0.46, y(7) - 0.02, zOf(7)), -40, 18, hillOn * ss(T.seven - 0.2, T.seven + 0.3, t) * (1 - ss(T.they + 0.6, T.they + 1.1, t)) + ss(T.seven3 - 0.2, T.seven3 + 0.3, t) * (1 - ss(T.final - 0.4, T.final, t)));
  { const o = ss(T.half - 0.1, T.half + 0.3, t) * (1 - ss(T.they - 0.2, T.they + 0.2, t)); Object.assign(OVL.half.style, { left: (1080 - 48 - (OVL.half.offsetWidth || 300)) + 'px', top: '1180px', opacity: o.toFixed(3), filter: `blur(${((1 - o) * 8).toFixed(2)}px)` }); }
  place(S, OVL.k10, P(-0.46, y(10) - 0.02, zOf(10)), -36, 18, hillOn * ss(T.above + 0.3, T.above + 0.8, t) * (1 - ss(T.walkmore - 0.3, T.walkmore + 0.2, t)));
  place(S, OVL.k12, P(-0.46, y(12) - 0.02, zOf(12)), -36, 18, hillOn * ss(T.above + 0.5, T.above + 1.0, t) * (1 - ss(T.walkmore - 0.3, T.walkmore + 0.2, t)));
  place(S, OVL.flat, P(-0.46, y(10) + 0.3, zOf(10)), -120, -100, ss(T.extra - 0.2, T.extra + 0.3, t) * (1 - ss(T.walkmore - 0.3, T.walkmore + 0.2, t)));
  const head = W.rig.seg.Atlas.g.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, 0.08, 0));
  place(S, OVL.dem, head, 2000, -230, ss(T.dementia, T.dementia + 0.4, t) * (1 - ss(T.falls - 0.2, T.falls + 0.3, t)));
  const hipP = W.rig.pelvis.getWorldPosition(new THREE.Vector3());
  place(S, OVL.falls, hipP, 2000, -140, ss(T.falls, T.falls + 0.4, t) * (1 - ss(T.above - 0.3, T.above + 0.2, t)));
  place(S, OVL.link, P(-0.46, y(8.5) + 0.25, zOf(8.5)), -120, -110, ss(T.link - 0.1, T.link + 0.3, t) * (1 - ss(T.so - 0.4, T.so, t)));
  OVL.add.forEach((e, i) => { const k = 2.5 + i; place(S, e, P(-0.46, y(k + 0.5) + 0.06, zOf(k)), -30, -36, ss(T.add + i * 0.28, T.add + 0.2 + i * 0.28, t) * (1 - ss(T.walk3 + 0.2, T.walk3 + 0.6, t))); });
  const f = faceFrame(), qw = W.ped.getWorldQuaternion(new THREE.Quaternion());
  const edge = f.c.clone().add(new THREE.Vector3(0, (0.026 - 0.0026) * 20.5 / 21.2, 0).applyQuaternion(qw));
  logoEnd(S, t, { t0: T.logo, center: f.c, edge });
}

makeFilm({
  T, caps: CAPS, subs: [], build, update, pose: camPose, overlay, overlayInit, carrier, focus: camFocus,
  stage: { bg: 0x07080a, reflSize: 40, env: 0.12, far: 40 },
  aperture: [[0, 0.004], [5.2, 0.006], [6.6, 0.009], [13.6, 0.008], [15.4, 0.004], [19.6, 0.003], [21.5, 0.003], [22.9, 0.0012], [24.6, 0.002], [31.6, 0.002], [33.6, 0.004], [35.4, 0.003], [37.4, 0.0015], [41.9, 0.003], [44.2, 0.004], [46.4, 0.002], [52.4, 0.0006], [59.2, 0.002], [63.4, 0.002], [66.3, 0.006], [67.6, 0.003]],
  bloom: [[0, 0.42], [20, 0.48], [52, 0.5], [63, 0.46], [67.5, 0.55]],
  fast: [[16.8, 17.5, 3], [21.5, 22.9, 2], [32.6, 33.6, 2], [34.45, 37.4, 2], [40.0, 41.9, 2], [43.3, 44.2, 3], [57.9, 59.2, 2], [59.65, 61.35, 3], [62.4, 63.4, 2], [64.6, 66.3, 2]],
});

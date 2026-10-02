// Human Factory Settings · Film 2 "How do I fix my posture?" · one continuous shot, 9:16.
// A real skeleton stands beside the textbook plumb line. The evidence cuts the line; the body was built to move.
import { THREE, ORANGE, ss, s5, lerp, clamp01, ckeys, hash, camTrack, phys, glowMat, shadows, spot,
  loadAnatomy, tissueMat, V3, place, logoEnd, makeFilm, outBack } from '../kit.js';
import { makePhone, makeLogoRing } from '../props.js';

// ------------------------------------------------------------------ timing, from the voice guide (word starts)
const T = {
  end: 69.6,
  q0: 0.35, q1: 2.51,                                   // "Trying to fix your posture? Here's what the science says."
  one: 4.97, line: 7.56, model: 10.0, still: 12.6,      // "One: there's no perfect posture. The straight line ... nineteenth-century model ... standing still ..."
  rev: 16.53, cut: 19.34,                               // "Forty-one reviews of the evidence found no PROOF ..." : the line falls
  two: 23.1, curve: 25.76, less: 29.6,                  // "Two: your spine is built to move. ... a different curve. They move less."
  three: 31.04, sixty: 33.65, comp: 35.6,               // "Three: text neck. The famous sixty pounds ... computer model."
  people: 37.47, flat: 42.4,                            // "... more than seven hundred people, the angle of their neck didn't predict neck pain."
  move: 45.07, hour: 47.42,                             // "So change position often. Get up once an hour."
  train: 49.74, trials: 52.24, back: 53.95,             // "And train your neck and upper back. In trials, exercise moved the head back ..."
  red: 57.48, bladder: 61.15, help: 63.44,              // "Back pain with numbness or weakness in both legs, or changes in your bladder? Get help right away."
  final: 65.62, logo: 67.55,                            // "Back to factory settings."
};

// ------------------------------------------------------------------ the world
const W = {};
const LINE_X = -0.165;       // the plumb line hangs just outside the right side of the body (the camera mostly looks from the right)
const TOP = 2.62;            // where the line hangs from, just above the frame
const RING_R = 0.62;         // the hour ring on the floor, which ends the film as the logo
const SPINE = ['Fifth lumbar vertebra', 'Fourth lumbar vertebra', 'Third lumbar vertebra', 'Second lumbar vertebra', 'First lumbar vertebra',
  'Twelfth thoracic vertebra', 'Eleventh thoracic vertebra', 'Tenth thoracic vertebra', 'Ninth thoracic vertebra', 'Eighth thoracic vertebra',
  'Seventh thoracic vertebra', 'Sixth thoracic vertebra', 'Fifth thoracic vertebra', 'Fourth thoracic vertebra', 'Third thoracic vertebra',
  'Second thoracic vertebra', 'First thoracic vertebra', 'Seventh cervical vertebra', 'Sixth cervical vertebra', 'Fifth cervical vertebra',
  'Fourth cervical vertebra', 'Third cervical vertebra', 'Axis', 'Atlas'];
const NECK_MUSCLES = /splenius|semispinalis (capitis|cervicis)|levator scapulae/i;
const BACK_MUSCLES = /trapezius|rhomboid/i;
const HAND = /radius|ulna|scaphoid|lunate|triquetral|pisiform|trapezium|trapezoid|capitate|hamate|metacarpal|phalanx of (right|left) (thumb|\w+ finger)/i;

function boneKind(p) {
  const n = p.name.toLowerCase(), has = (...k) => k.some((s) => n.includes(s));
  if (p.name === 'Urinary bladder') return 'bladder';
  if (p.system === 'skeletal') {
    if (has('gingiva', 'fibularis', 'tibialis', 'subscapularis', 'iliotibial')) return null;
    if (has('levator scapulae')) return 'muscle';
    if (has('tooth')) return 'tooth';
    if (has('cartilage', 'intervertebral disk')) return 'cartilage';
    return 'bone';
  }
  if (p.system === 'muscular' && (NECK_MUSCLES.test(p.name) || BACK_MUSCLES.test(p.name))) return 'muscle';
  return null;
}
// which spine segment a part rides with when the spine bends
function segmentOf(name) {
  const n = name.toLowerCase();
  const disk = n.match(/^intervertebral disk of (\w+) (cervical|thoracic|lumbar) vertebra/);
  if (disk) return SPINE.find((s) => s.toLowerCase() === `${disk[1]} ${disk[2]} vertebra`) || null;
  if (n === 'intervertebral disk of axis') return 'Axis';
  if (/rib|costal|sternum|manubrium|xiphoid/.test(n)) return 'Seventh thoracic vertebra';
  if (/clavicle|scapula|humerus/.test(n) || HAND.test(name)) return 'Third thoracic vertebra';
  if (BACK_MUSCLES.test(name)) return 'Third thoracic vertebra';
  if (NECK_MUSCLES.test(name)) return 'Sixth cervical vertebra';
  if (/hyoid|thyroid cartilage|cricoid|arytenoid|corniculate/.test(n)) return 'Fourth cervical vertebra';
  if (/bladder|hip bone|sacrum|coccyx|femur|patella|tibia|fibula|talus|calcaneus|navicular|cuboid|cuneiform|metatarsal|toe|sesamoid|intervertebral disk$/.test(n)) return null; // stays put
  return 'Atlas'; // the skull and the face ride on the top of the neck
}

// a spine as a chain of groups: each vertebra turns about its own middle, carrying everything above it
function buildChain(parentObj, meshes, byName, withAttachments) {
  const seg = {}; let parent = parentObj, pp = new THREE.Vector3();
  for (const name of SPINE) {
    const m = byName.get(name); if (!m) continue;
    const g = new THREE.Group(); g.position.copy(m.userData.home).sub(pp); parent.add(g);
    m.position.set(0, 0, 0); g.add(m);
    seg[name] = { g, pivot: m.userData.home.clone() }; parent = g; pp = m.userData.home;
  }
  if (withAttachments) for (const m of meshes) {
    if (SPINE.includes(m.userData.name)) continue;
    const s = segmentOf(m.userData.name);
    if (s && seg[s]) { m.position.copy(m.userData.home).sub(seg[s].pivot); seg[s].g.add(m); }
    else { m.position.copy(m.userData.home); parentObj.add(m); }
  }
  return seg;
}
// bend the chain: flexion (+ = forward), side bend (+ = to the right), twist (+ = to the left), and a forward head (poke)
function bend(seg, { lum = 0, tho = 0, cer = 0, side = 0, twist = 0, poke = 0 }) {
  SPINE.forEach((name) => {
    const s = seg[name]; if (!s) return;
    const n = name.toLowerCase();
    let k = n.includes('lumbar') ? lum / 5 : n.includes('thoracic') ? tho / 12 : cer / 7;
    if (/seventh cervical|sixth cervical|fifth cervical/.test(n)) k += poke * 0.42;   // a forward head: the low neck tips forward,
    if (/^axis$|^atlas$|third cervical/.test(n)) k -= poke * 0.42;                    // the top of the neck tips back to keep the eyes level
    s.g.rotation.set(k, twist / SPINE.length, side / SPINE.length);
  });
}

// ---- the arms: collarbone and shoulder blade turn at the breastbone, the arm at the shoulder, the forearm and hand at the elbow
const DOWN = new THREE.Vector3(0, -1, 0);
function worldVerts(m) { const p = m.geometry.attributes.position, out = []; for (let i = 0; i < p.count; i++) out.push(new THREE.Vector3().fromBufferAttribute(p, i).add(m.userData.home)); return out; }
const avgV = (a) => a.reduce((s, v) => s.add(v), new THREE.Vector3()).multiplyScalar(1 / Math.max(1, a.length));
function reparent(m, group, pivot) { if (m.parent) m.parent.remove(m); m.position.copy(m.userData.home).sub(pivot); group.add(m); }
function buildArms(seg, byName, meshes) {
  const t3 = seg['Third thoracic vertebra'], arms = {};
  for (const Side of ['Right', 'Left']) {
    const side = Side.toLowerCase();
    const hum = byName.get(`${Side} humerus`), cla = byName.get(`${Side} clavicle`), sca = byName.get(`${Side} scapula`);
    const hv = worldVerts(hum); let top = -9, bot = 9; for (const v of hv) { top = Math.max(top, v.y); bot = Math.min(bot, v.y); }
    const SH = avgV(hv.filter((v) => v.y > top - 0.045)), EL = avgV(hv.filter((v) => v.y < bot + 0.03));
    const cv = worldVerts(cla); let mn = 9; for (const v of cv) mn = Math.min(mn, Math.abs(v.x));
    const SC = avgV(cv.filter((v) => Math.abs(v.x) < mn + 0.012));
    const girdle = new THREE.Group(); girdle.position.copy(SC).sub(t3.pivot); t3.g.add(girdle);
    reparent(cla, girdle, SC); reparent(sca, girdle, SC);
    const arm = new THREE.Group(); arm.position.copy(SH).sub(SC); girdle.add(arm); reparent(hum, arm, SH);
    const elbow = new THREE.Group(); elbow.position.copy(EL).sub(SH); arm.add(elbow);
    for (const m of meshes) if (HAND.test(m.userData.name) && m.userData.name.toLowerCase().includes(side)) reparent(m, elbow, EL);
    arms[Side] = { s: Side === 'Right' ? -1 : 1, girdle, arm, elbow, mc: byName.get(`${Side} third metacarpal bone`) };
  }
  return arms;
}
const _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _d = new THREE.Vector3();
// dir: where the upper arm points, [outward, up, forward]; twist: internal rotation (+ turns the forearm in); elbow: flexion
function poseArm(A, a) {
  _d.set(a.dir[0] * A.s, a.dir[1], a.dir[2]).normalize();
  _q.setFromUnitVectors(DOWN, _d); _q2.setFromAxisAngle(_d, a.twist * A.s);
  A.arm.quaternion.multiplyQuaternions(_q2, _q);
  A.elbow.rotation.set(-a.elbow, 0, 0);
  A.girdle.rotation.set(0, (a.retract || 0) * A.s, (a.elevate || 0) * A.s);
}

// ---- poses: the spine and both arms
const ARM0 = { dir: [0, -1, 0], twist: 0, elbow: 0.05, retract: 0, elevate: 0 };
const arm = (dir, elbow = 0.05, twist = 0, retract = 0, elevate = 0) => ({ dir, elbow, twist, retract, elevate });
const pose = (o) => ({ lum: 0, tho: 0, cer: 0, side: 0, twist: 0, poke: 0, r: ARM0, l: ARM0, ...o });
const P = {
  rest: pose({}),
  phone: pose({ lum: 0.06, tho: 0.2, cer: 0.92, r: arm([0.04, -0.9, 0.42], 1.42, 0.55, -0.04), l: arm([0.04, -0.9, 0.42], 1.42, 0.55, -0.04) }),
  // the hours: a new position every hour
  stretch: pose({ lum: -0.14, tho: -0.12, cer: -0.12, r: arm([0.16, 1, 0.1], 0.06, 0, 0, 0.18), l: arm([0.16, 1, 0.1], 0.06, 0, 0, 0.18) }),
  sideL: pose({ side: -0.36, cer: 0.05, r: arm([0.42, 0.9, 0.05], 0.12, 0, 0, 0.15), l: arm([0.08, -1, 0.05], 0.15) }),
  twist: pose({ twist: 0.5, tho: 0.04, r: arm([1, -0.05, 0.12], 0.12), l: arm([1, -0.05, 0.12], 0.12) }),
  reach: pose({ lum: 0.18, tho: 0.14, cer: 0.08, r: arm([0.12, -0.12, 1], 0.06, 0.2), l: arm([0.12, -0.12, 1], 0.06, 0.2) }),
  sideR: pose({ side: 0.36, cer: -0.05, l: arm([0.42, 0.9, 0.05], 0.12, 0, 0, 0.15), r: arm([0.08, -1, 0.05], 0.15) }),
  shrug: pose({ cer: -0.1, r: arm([0.03, -1, -0.04], 0.1, 0, 0.12, 0.3), l: arm([0.03, -1, -0.04], 0.1, 0, 0.12, 0.3) }),
  fold: pose({ lum: 0.42, tho: 0.32, cer: 0.24, r: arm([0.06, -0.8, 0.75], 0.2), l: arm([0.06, -0.8, 0.75], 0.2) }),
  // the training: arms forward, then pulled apart, shoulder blades squeezed
  pull0: pose({ tho: 0.08, cer: 0.2, poke: 0.32, r: arm([0.1, 0.02, 1], 0.06, -0.3, -0.06), l: arm([0.1, 0.02, 1], 0.06, -0.3, -0.06) }),
  pull1: pose({ tho: 0.02, cer: 0.2, poke: 0.32, r: arm([1, 0.05, 0.18], 0.06, -0.3, 0.24), l: arm([1, 0.05, 0.18], 0.06, -0.3, 0.24) }),
};
const HOURS = [P.phone, P.stretch, P.sideL, P.twist, P.reach, P.sideR, P.shrug, P.fold, P.rest];
const lerpArm = (a, b, k) => ({ dir: a.dir.map((v, i) => lerp(v, b.dir[i], k)), twist: lerp(a.twist, b.twist, k), elbow: lerp(a.elbow, b.elbow, k), retract: lerp(a.retract, b.retract, k), elevate: lerp(a.elevate, b.elevate, k) });
function lerpPose(a, b, k) {
  if (k <= 0) return a; if (k >= 1) return b;
  const o = {}; for (const key of ['lum', 'tho', 'cer', 'side', 'twist', 'poke']) o[key] = lerp(a[key], b[key], k);
  o.r = lerpArm(a.r, b.r, k); o.l = lerpArm(a.l, b.l, k); return o;
}

// ---- the plumb bob: it hangs and settles; at "no proof" the line is cut, the bob drops and tips over
const G = 9.8;
function swayAt(t) { return (1 - ss(T.q1, T.line, t)) * 0.011 * Math.sin(t * 2.0 + 0.6) * Math.exp(-t * 0.32); }
function bobAt(t, out) {
  const u = t - T.cut; out.pos.set(LINE_X, W.bobY, W.lineZ); out.rx = 0;
  if (u <= 0) { const dz = swayAt(t); out.pos.z += dz; out.rx = -dz / (TOP - W.bobY); return out; }
  const tf = Math.sqrt((2 * W.bobY) / G);
  if (u < tf) { out.pos.y = W.bobY - 0.5 * G * u * u; return out; }
  const v = u - tf, A = 1.31, d = 0.3;                 // it lands on its point and falls over backwards, onto its side
  out.pos.y = 0; out.rx = -(v < d ? A * (v / d) * (v / d) : A + 0.06 * Math.sin((v - d) * 26) * Math.exp(-(v - d) * 9));
  return out;
}
const _bob = { pos: new THREE.Vector3(), rx: 0 }, _e = new THREE.Vector3();
function eyeAt(t, out) { bobAt(t, _bob); const h = 0.071; return out.set(_bob.pos.x, _bob.pos.y + h * Math.cos(_bob.rx), _bob.pos.z + h * Math.sin(_bob.rx)); }
// the thread after the cut: a rope that falls and piles on the floor (simulated once, then read back by time)
const ROPE_N = 90;
function simRope() {
  const n = ROPE_N, len = TOP - (W.bobY + 0.071), seg = len / (n - 1), dt = 1 / 600, steps = Math.round(2.8 / dt), every = 2;
  const Pp = new Float32Array(n * 3), Q = new Float32Array(n * 3), r = 0.0012;
  for (let i = 0; i < n; i++) {
    Pp[i * 3] = LINE_X + 0.0016 * Math.sin(i * 0.83 + 0.4); Pp[i * 3 + 1] = W.bobY + 0.071 + seg * i; Pp[i * 3 + 2] = W.lineZ + 0.0022 * Math.sin(i * 0.51 + 1.3);
  }
  Q.set(Pp); const frames = [];
  const pin = new THREE.Vector3();
  for (let s = 0; s <= steps; s++) {
    const t = T.cut + s * dt;
    eyeAt(t, pin);
    for (let i = 1; i < n; i++) {
      const k = i * 3;
      for (let c = 0; c < 3; c++) { const v = (Pp[k + c] - Q[k + c]) * 0.998; Q[k + c] = Pp[k + c]; Pp[k + c] += v + (c === 1 ? -G * dt * dt : 0); }
    }
    Pp[0] = pin.x; Pp[1] = pin.y; Pp[2] = pin.z;
    for (let it = 0; it < 10; it++) {
      for (let i = 0; i < n - 1; i++) {   // inextensible, free to go slack
        const a = i * 3, b = a + 3; const dx = Pp[b] - Pp[a], dy = Pp[b + 1] - Pp[a + 1], dz = Pp[b + 2] - Pp[a + 2]; const d = Math.hypot(dx, dy, dz);
        if (d > seg) { const f = (d - seg) / d, wa = i === 0 ? 0 : 0.5, wb = i === 0 ? 1 : 0.5; Pp[a] += dx * f * wa; Pp[a + 1] += dy * f * wa; Pp[a + 2] += dz * f * wa; Pp[b] -= dx * f * wb; Pp[b + 1] -= dy * f * wb; Pp[b + 2] -= dz * f * wb; }
      }
      for (let i = 0; i < n - 2; i++) {   // a little stiffness, so it lies down in loops rather than one heap
        const a = i * 3, b = a + 6; const dx = Pp[b] - Pp[a], dy = Pp[b + 1] - Pp[a + 1], dz = Pp[b + 2] - Pp[a + 2]; const d = Math.hypot(dx, dy, dz), m = seg * 1.55;
        if (d < m && d > 1e-6) { const f = (d - m) / d * 0.5, wa = i === 0 ? 0 : 0.5, wb = i === 0 ? 1 : 0.5; Pp[a] += dx * f * wa; Pp[a + 1] += dy * f * wa; Pp[a + 2] += dz * f * wa; Pp[b] -= dx * f * wb; Pp[b + 1] -= dy * f * wb; Pp[b + 2] -= dz * f * wb; }
      }
      for (let i = 1; i < n; i++) { const k = i * 3; if (Pp[k + 1] < r) { Pp[k + 1] = r; Q[k] = lerp(Q[k], Pp[k], 0.6); Q[k + 2] = lerp(Q[k + 2], Pp[k + 2], 0.6); Q[k + 1] = Pp[k + 1]; } }
      Pp[0] = pin.x; Pp[1] = pin.y; Pp[2] = pin.z;
    }
    if (s % every === 0) frames.push(Pp.slice());
  }
  W.rope = { frames, rate: 600 / every };
}
const _rp = new Float32Array(ROPE_N * 3);
function ropeAt(t) {
  if (t <= T.cut) {   // a straight line from the bob's eye to the hanging point
    eyeAt(t, _e); for (let i = 0; i < ROPE_N; i++) { const k = i / (ROPE_N - 1); _rp[i * 3] = lerp(_e.x, LINE_X, k); _rp[i * 3 + 1] = lerp(_e.y, TOP, k); _rp[i * 3 + 2] = lerp(_e.z, W.lineZ, k); }
    return _rp;
  }
  const R = W.rope, f = (t - T.cut) * R.rate, i = Math.min(R.frames.length - 1, Math.floor(f)), j = Math.min(R.frames.length - 1, i + 1), w = clamp01(f - i);
  const a = R.frames[i], b = R.frames[j]; for (let k = 0; k < a.length; k++) _rp[k] = lerp(a[k], b[k], w); return _rp;
}
const _pts = Array.from({ length: ROPE_N }, () => new THREE.Vector3());
function setThread(t, radius) {
  const p = ropeAt(t); for (let i = 0; i < ROPE_N; i++) _pts[i].set(p[i * 3], p[i * 3 + 1], p[i * 3 + 2]);
  const key = t <= T.cut ? `s${_pts[0].z.toFixed(5)}${radius.toFixed(5)}` : `${Math.min(t, T.cut + 2.8).toFixed(4)}${radius.toFixed(5)}`;
  if (W.thread.userData.key === key) return; W.thread.userData.key = key;
  W.thread.geometry.dispose();
  W.thread.geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(_pts, false, 'centripetal'), 360, radius, 5, false);
}

// ---- the 41 reviews: a wall of pages behind the figure
function pageTex(v) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 346; const x = c.getContext('2d');
  x.fillStyle = '#f1ece3'; x.fillRect(0, 0, 256, 346);
  const ink = (a) => `rgba(34,32,28,${a})`;
  x.fillStyle = ink(0.78); x.fillRect(20, 22, 200 - (v % 3) * 24, 9); x.fillRect(20, 36, 150 - (v % 2) * 30, 9);
  x.fillStyle = ink(0.4); x.fillRect(20, 54, 120, 5);
  let y = 72;
  for (let i = 0; i < 5; i++) { x.fillStyle = ink(0.26); x.fillRect(20, y, i === 4 ? 120 : 216, 4); y += 9; }
  y += 8;
  if (v % 2 === 0) { // a forest plot: each study a line, a dot, and the line of no effect
    x.strokeStyle = ink(0.5); x.lineWidth = 1.2; x.beginPath(); x.moveTo(128, y); x.lineTo(128, y + 108); x.stroke();
    for (let i = 0; i < 9; i++) { const cx = 128 + (hash(v * 17 + i) - 0.5) * 60, w = 14 + hash(v * 31 + i * 3) * 34, yy = y + 8 + i * 11;
      x.strokeStyle = ink(0.55); x.beginPath(); x.moveTo(cx - w, yy); x.lineTo(cx + w, yy); x.stroke(); x.fillStyle = ink(0.75); x.fillRect(cx - 3, yy - 3, 6, 6); }
    x.fillStyle = ink(0.8); x.beginPath(); const dy = y + 112; x.moveTo(118, dy); x.lineTo(128 + (hash(v) - 0.5) * 8, dy - 5); x.lineTo(138, dy); x.lineTo(128 + (hash(v) - 0.5) * 8, dy + 5); x.closePath(); x.fill();
    y += 128;
  } else { // a table
    x.strokeStyle = ink(0.4); x.lineWidth = 1;
    for (let i = 0; i <= 6; i++) { x.beginPath(); x.moveTo(20, y + i * 15); x.lineTo(236, y + i * 15); x.stroke(); }
    for (let i = 0; i < 6; i++) for (let j = 0; j < 4; j++) { x.fillStyle = ink(0.28); x.fillRect(26 + j * 54, y + 5 + i * 15, 20 + hash(v * 7 + i * 5 + j) * 22, 4); }
    y += 104;
  }
  for (let col = 0; col < 2; col++) { let yy = y; while (yy < 326) { x.fillStyle = ink(0.24); x.fillRect(20 + col * 112, yy, 100 - (hash(yy + col * 13 + v) > 0.85 ? 40 : 0), 4); yy += 9; } }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
function dotTex() {
  const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
  x.fillStyle = '#fff'; x.beginPath(); x.arc(32, 32, 26, 0, Math.PI * 2); x.fill(); return new THREE.CanvasTexture(c);
}

async function build(S, cfg) {
  const scene = S.scene;
  S.fog.near = 2.6; S.fog.far = 9.0;
  // ---- the skeleton, the neck and upper-back muscles, the bladder
  const meshes = await loadAnatomy(boneKind);
  const byName = new Map(meshes.map((m) => [m.userData.name, m]));
  W.root = new THREE.Group(); scene.add(W.root);
  W.seg = buildChain(W.root, meshes, byName, true);
  W.arms = buildArms(W.seg, byName, meshes);
  W.bladder = byName.get('Urinary bladder');
  W.bladder.material = tissueMat('airway', { transparent: true, opacity: 0 }); W.bladder.material.emissive.set(0x86a6ff);
  W.muscles = meshes.filter((m) => m.userData.tissue === 'muscle');
  W.body = meshes.filter((m) => m !== W.bladder);
  for (const m of W.body) { m.castShadow = true; m.receiveShadow = true; m.layers.enable(1); }
  for (const m of W.muscles) { m.material.transparent = true; m.material.opacity = 0; m.castShadow = false; m.visible = false; }
  W.lowBack = meshes.filter((m) => /lumbar|sacrum|hip bone|femur|tibia|fibula|patella|intervertebral disk$/i.test(m.userData.name));
  W.root.updateMatrixWorld(true);
  // landmarks for the textbook line: ear, shoulder tip, hip, knee, ankle (right side)
  const ext = (name, pick) => { const m = byName.get(name); if (!m) return null; let best = null, bs = -Infinity;
    for (const v of worldVerts(m)) { const s = pick(v); if (s > bs) { bs = s; best = v; } } return best; };
  const femur = byName.get('Right femur').userData;
  W.marks = [
    ext('Right temporal bone', (v) => -v.x * 3 - Math.abs(v.y - 1.62) * 8 - Math.abs(v.z + 0.005) * 6),  // the ear opening, roughly
    ext('Right scapula', (v) => -v.x + v.y * 0.6),                                                   // the shoulder tip (acromion)
    ext('Right femur', (v) => -v.x - Math.abs(v.y - (femur.home.y + femur.size.y * 0.42)) * 3),      // the greater trochanter
    ext('Right femur', (v) => -v.x - Math.abs(v.y - (femur.home.y - femur.size.y * 0.44)) * 3),      // the knee (lateral condyle)
    ext('Right fibula', (v) => -v.y),                                                                // the ankle (lateral malleolus)
  ];
  W.lineZ = W.marks[4].z + 0.012;
  // ---- the plumb line and its brass bob
  const brass = phys({ color: 0xb08d57, metalness: 1, roughness: 0.3, clearcoat: 0.4 });
  W.bob = new THREE.Group();
  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.016, 0.05, 64), brass); cone.rotation.x = Math.PI; cone.position.y = 0.025; W.bob.add(cone);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.0165, 0.016, 0.012, 64), brass); cap.position.y = 0.056; W.bob.add(cap);
  const eye = new THREE.Mesh(new THREE.TorusGeometry(0.004, 0.0012, 12, 32), brass); eye.position.y = 0.066; W.bob.add(eye);
  shadows(W.bob); W.bob.traverse((o) => o.layers.enable(1));
  W.bobY = 0.118; scene.add(W.bob);
  W.threadMat = new THREE.MeshBasicMaterial({ color: 0xd9dbe0, transparent: true, opacity: 0.9 });
  W.thread = new THREE.Mesh(new THREE.BufferGeometry(), W.threadMat); scene.add(W.thread);
  simRope();
  W.markMat = glowMat(new THREE.Color(0xeceef1)); W.markMat.transparent = true; W.markMat.opacity = 0;
  W.markDots = W.marks.map((p) => { const d = new THREE.Mesh(new THREE.SphereGeometry(0.0085, 24, 16), W.markMat); d.position.set(LINE_X, p.y, W.lineZ); scene.add(d); return d; });
  // ---- the ghost spine (same curve, moving less), for "they move less"
  const ghostMeshes = meshes.filter((m) => SPINE.includes(m.userData.name)).map((m) => {
    const g = new THREE.Mesh(m.geometry, new THREE.MeshPhysicalMaterial({ color: 0x9aa7c4, roughness: 0.5, transparent: true, opacity: 0, depthWrite: false }));
    g.userData = { ...m.userData }; return g; });
  W.ghostRoot = new THREE.Group(); W.ghostRoot.position.set(0.3, 0, -0.2); scene.add(W.ghostRoot);
  W.ghostSeg = buildChain(W.ghostRoot, ghostMeshes, new Map(ghostMeshes.map((m) => [m.userData.name, m])), false);
  W.ghostMats = ghostMeshes.map((m) => m.material);
  // ---- 41 reviews: a wall of pages behind the figure (seen from the right side), 7 across, 6 down
  const texs = [0, 1, 2, 3, 4, 5].map(pageTex); W.pages = [];
  const PW = 0.2, PH = 0.27, GAP = 0.05, wallX = 1.2, wallY = 1.25, wallZ = -0.12;
  for (let i = 0; i < 41; i++) {
    const r = Math.floor(i / 7), c = i % 7;
    const mat = new THREE.MeshPhysicalMaterial({ map: texs[i % 6], color: 0xffffff, roughness: 0.85, emissive: new THREE.Color(0xfff2dc), emissiveIntensity: 0, emissiveMap: texs[i % 6], transparent: true, opacity: 0, fog: false });
    const pg = new THREE.Mesh(new THREE.PlaneGeometry(PW, PH), mat);
    pg.position.set(wallX + (hash(i * 2.3) - 0.5) * 0.04, wallY + (2.5 - r) * (PH + GAP), wallZ + (c - 3) * (PW + GAP));
    pg.rotation.set(0, -Math.PI / 2, (hash(i * 1.7) - 0.5) * 0.05); pg.receiveShadow = true; scene.add(pg);
    W.pages.push({ m: pg, mat, i });
  }
  // ---- text neck: the phone in the hands; the "computer model" wireframe of head and neck
  W.phone = makePhone({}); scene.add(W.phone.g); W.phone.g.traverse((o) => o.layers.enable(1));
  W.phoneMats = []; W.phone.g.traverse((o) => { if (o.isMesh) { o.material.transparent = true; W.phoneMats.push([o.material, o.material.opacity]); } });
  W.wire = []; W.wireMat = new THREE.MeshBasicMaterial({ color: 0x8fb4ff, wireframe: true, transparent: true, opacity: 0, depthWrite: false, fog: false });
  for (const m of meshes) {
    const s = segmentOf(m.userData.name), n = m.userData.name;
    if (!(/cervical vertebra|^axis$|^atlas$/i.test(n) || (s === 'Atlas' && m.userData.tissue === 'bone'))) continue;
    const w = new THREE.Mesh(m.geometry, W.wireMat); m.add(w); W.wire.push(w);
  }
  // ---- 732 people: one dot each, neck angle against neck pain, and a flat line through them
  const N = 732, pos = new Float32Array(N * 3), Z0 = 0.5, Z1 = 1.1, Y0 = 0.5, Y1 = 0.98;
  for (let i = 0; i < N; i++) {
    const u = hash(i * 1.37 + 0.2), v = (hash(i * 2.91 + 5.1) + hash(i * 4.07 + 1.3) + hash(i * 0.73 + 8.8)) / 3, w2 = hash(i * 7.3 + 2.2);
    pos[i * 3] = (w2 - 0.5) * 0.01; pos[i * 3 + 1] = lerp(Y0 + 0.02, Y1 - 0.02, clamp01((v - 0.5) * 1.6 + 0.5)); pos[i * 3 + 2] = lerp(Z0 + 0.02, Z1 - 0.02, u);
  }
  const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const order = new Float32Array(N); for (let i = 0; i < N; i++) order[i] = hash(i * 9.1); dg.setAttribute('ord', new THREE.BufferAttribute(order, 1));
  W.dotsMat = new THREE.ShaderMaterial({
    uniforms: { uMap: { value: dotTex() }, uShow: { value: 0 }, uAmt: { value: 0 }, uSize: { value: 15 * S.res } },
    vertexShader: 'attribute float ord; varying float vA; uniform float uShow, uAmt, uSize; void main(){ float k = smoothstep(ord, ord + 0.08, uShow); vA = k * uAmt; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = uSize * (2.0 / -mv.z) * (0.4 + 0.6 * k); gl_Position = projectionMatrix * mv; }',
    fragmentShader: 'uniform sampler2D uMap; varying float vA; void main(){ float a = texture2D(uMap, gl_PointCoord).r; gl_FragColor = vec4(vec3(0.93, 0.94, 0.95), a * vA); }',
    transparent: true, depthWrite: false,
  });
  W.dots = new THREE.Points(dg, W.dotsMat); scene.add(W.dots);
  W.flatMat = new THREE.MeshBasicMaterial({ color: 0xeceef1, transparent: true, opacity: 0 });
  W.flatY = lerp(Y0 + 0.02, Y1 - 0.02, 0.5);
  W.flat = new THREE.Mesh(new THREE.BoxGeometry(0.002, 0.004, Z1 - Z0), W.flatMat); W.flat.position.set(0, W.flatY, (Z0 + Z1) / 2); scene.add(W.flat);
  W.axisMat = new THREE.MeshBasicMaterial({ color: 0x8d9097, transparent: true, opacity: 0 });
  const ax1 = new THREE.Mesh(new THREE.BoxGeometry(0.0015, 0.0015, Z1 - Z0 + 0.03), W.axisMat); ax1.position.set(0, Y0 - 0.015, (Z0 + Z1) / 2 + 0.015); scene.add(ax1);
  const ax2 = new THREE.Mesh(new THREE.BoxGeometry(0.0015, Y1 - Y0 + 0.03, 0.0015), W.axisMat); ax2.position.set(0, (Y0 + Y1) / 2, Z0 - 0.015); scene.add(ax2);
  W.plot = { Z0, Z1, Y0, Y1 };
  // ---- the hour ring on the floor: move every hour; at the end it is the logo (twelve towards the front of the body)
  W.ringC = new THREE.Vector3(0, 0.003, 0.03);
  W.ring = makeLogoRing(RING_R); const turn = new THREE.Group(); turn.rotation.y = Math.PI; turn.position.copy(W.ringC); W.ring.g.rotation.x = -Math.PI / 2; turn.add(W.ring.g); scene.add(turn);
  // ---- the nerves down the legs, for the red flags (a drawn path, not modelled tissue)
  W.nerveMat = new THREE.ShaderMaterial({
    uniforms: { uP: { value: 0 }, uC: { value: new THREE.Color(0x9fc0ff) }, uO: { value: 0 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'uniform float uP, uO; uniform vec3 uC; varying vec2 vUv; void main(){ float s = vUv.x; if (s > uP) discard; float head = exp(-(uP - s) * 30.0); gl_FragColor = vec4(uC * (1.0 + 2.5 * head), uO); }',
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  for (const sx of [-1, 1]) {
    const pts = [[0.012, 1.03, -0.07], [0.05, 0.93, -0.1], [0.075, 0.82, -0.085], [0.085, 0.66, -0.06], [0.082, 0.5, -0.05], [0.075, 0.33, -0.045], [0.07, 0.14, -0.045], [0.068, 0.05, -0.02]].map(([x, y, z]) => new THREE.Vector3(x * sx, y, z));
    scene.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 220, 0.0032, 8, false), W.nerveMat));
  }
  // ---- light: a museum spot on the figure, a cold rim, a soft fill
  const C = new THREE.Vector3(0, 0.95, 0);
  W.key = spot(scene, { color: 0xffe9d2, pos: new THREE.Vector3(-1.6, 3.4, 1.5), target: C.clone(), angle: 0.48, penumbra: 0.85, shadow: true, size: cfg.shadow ?? 1024 });
  W.key.shadow.camera.far = 8;
  W.rim = spot(scene, { color: 0xa9c4ff, pos: new THREE.Vector3(1.6, 2.6, -2.2), target: new THREE.Vector3(0, 1.1, 0), angle: 0.5, penumbra: 0.9 });
  W.fill = spot(scene, { color: 0xc8d6ff, pos: new THREE.Vector3(-2.4, 0.8, -0.6), target: new THREE.Vector3(0, 0.9, 0), angle: 0.6, penumbra: 1 });
  W.top = spot(scene, { color: 0xfff1e0, pos: new THREE.Vector3(0, 3.6, 0.1), target: new THREE.Vector3(0, 0, 0), angle: 0.3, penumbra: 0.8 });
  W.back = spot(scene, { color: 0xfff0e2, pos: new THREE.Vector3(-0.6, 2.4, -2.4), target: new THREE.Vector3(0, 1.1, -0.05), angle: 0.42, penumbra: 0.9 });
  W.coldSpot = spot(scene, { color: 0x7f9dff, pos: new THREE.Vector3(-0.9, 1.9, -1.4), target: new THREE.Vector3(0, 0.75, -0.05), angle: 0.45, penumbra: 1 });
  W.warm = spot(scene, { color: 0xffc89a, pos: new THREE.Vector3(-0.7, 2.3, -1.5), target: new THREE.Vector3(0, 1.4, -0.05), angle: 0.32, penumbra: 1 });
  W.dotLight = spot(scene, { color: 0xeef2ff, pos: new THREE.Vector3(-1.4, 2.2, 1.6), target: new THREE.Vector3(0, 1.1, 0.4), angle: 0.42, penumbra: 1 });
  W.pageLight = spot(scene, { color: 0xfff0dc, pos: new THREE.Vector3(-1.4, 2.8, 1.6), target: new THREE.Vector3(1.2, 1.25, -0.12), angle: 0.5, penumbra: 1 });
  W.bobLight = spot(scene, { color: 0xffe2c0, pos: new THREE.Vector3(LINE_X - 0.7, 0.62, W.lineZ + 0.45), target: new THREE.Vector3(LINE_X, 0.14, W.lineZ), angle: 0.12, penumbra: 0.8 });
  W.phoneGlow = new THREE.PointLight(0x9fc0ff, 0, 0.6, 2); scene.add(W.phoneGlow);
  buildTracks();
  return { marks: W.marks.map((v) => v.toArray().map((x) => +x.toFixed(3))), lineZ: W.lineZ, ropeFrames: W.rope.frames.length };
}

// ------------------------------------------------------------------ the camera: one path, no cuts
let CAM;
function buildTracks() {
  const z = W.lineZ, x = LINE_X, c = W.ringC;
  CAM = camTrack([
    { t: 0.0, p: V3(x - 0.3, 0.153, z + 0.1), l: V3(x, 0.153, z), fov: 22 },
    { t: 2.6, p: V3(x - 0.285, 0.163, z + 0.09), l: V3(x, 0.16, z), fov: 22, stop: true },
    { t: 4.7, p: V3(x - 0.8, 0.62, z + 0.22), l: V3(x, 0.6, z), fov: 26 },
    { t: 7.6, p: V3(-3.85, 1.24, 0.2), l: V3(-0.06, 1.2, 0.0), fov: 36 },
    { t: 15.8, p: V3(-3.72, 1.24, 0.26), l: V3(-0.06, 1.2, 0.0), fov: 36 },
    { t: 22.4, p: V3(-3.62, 1.24, 0.3), l: V3(-0.03, 1.2, 0.0), fov: 36 },
    { t: 25.0, p: V3(-2.2, 1.45, -2.65), l: V3(0.17, 1.3, -0.23), fov: 36 },
    { t: 30.2, p: V3(-2.02, 1.45, -2.48), l: V3(0.17, 1.3, -0.23), fov: 36 },
    { t: 32.8, p: V3(-2.25, 1.5, 0.34), l: V3(0, 1.48, 0.2), fov: 30 },
    { t: 36.8, p: V3(-2.12, 1.5, 0.42), l: V3(0, 1.48, 0.22), fov: 30 },
    { t: 38.8, p: V3(-3.6, 1.18, 0.5), l: V3(0, 1.12, 0.48), fov: 36 },
    { t: 44.4, p: V3(-3.45, 1.18, 0.55), l: V3(0, 1.12, 0.48), fov: 36 },
    { t: 46.6, p: V3(-3.2, 3.55, -1.8), l: V3(0, 0.8, 0.02), fov: 36 },
    { t: 49.3, p: V3(-3.05, 3.45, -1.72), l: V3(0, 0.82, 0.02), fov: 36 },
    { t: 51.4, p: V3(-1.0, 1.85, -2.05), l: V3(0, 1.55, -0.05), fov: 32 },
    { t: 56.8, p: V3(-0.88, 1.82, -1.9), l: V3(0, 1.53, -0.05), fov: 32 },
    { t: 59.0, p: V3(-1.75, 1.15, -2.3), l: V3(0, 0.85, -0.05), fov: 34 },
    { t: 64.5, p: V3(-1.65, 1.1, -2.15), l: V3(0, 0.83, -0.05), fov: 34, stop: true },
    { t: 67.25, p: V3(c.x, 8.5, c.z - 0.35), l: V3(c.x, c.y, c.z), fov: 36, stop: true },
    { t: 69.6, p: V3(c.x, 8.62, c.z - 0.35), l: V3(c.x, c.y, c.z), fov: 36 },
  ]);
}
function camPose(S, t) { return CAM(t); }

// ------------------------------------------------------------------ the body's pose over the film
function poseAt(t) {
  let p = P.rest;
  // two: the spine comes alive (and a ghost spine with the same curve moves less)
  const alive = ss(T.two, T.two + 0.8, t) * (1 - ss(T.three - 0.5, T.three + 0.3, t));
  if (alive > 0) {
    const w = (t - T.two) * 1.25, sw = 0.12 * Math.sin(w + 0.4);
    p = lerpPose(p, pose({ lum: 0.3 * Math.sin(w), tho: 0.24 * Math.sin(w - 0.6), cer: 0.18 * Math.sin(w - 1.1), side: 0.14 * Math.sin(w * 0.7 + 1.0), twist: 0.2 * Math.sin(w * 0.55 + 2.0),
      r: arm([0.05, -1, sw], 0.18 + 0.1 * Math.sin(w)), l: arm([0.05, -1, -sw], 0.18 - 0.1 * Math.sin(w)) }), alive);
  }
  // three: the phone comes up, the head goes down
  const ph = ss(T.three - 0.1, T.three + 1.1, t) * (1 - ss(T.move - 0.05, T.move + 0.05, t));
  if (ph > 0) { const head = ss(T.three + 0.4, T.sixty, t); p = lerpPose(p, lerpPose({ ...P.phone, cer: 0, tho: 0.05 }, P.phone, head), ph); }
  // the hours: a new position every hour
  const hrs = ss(T.move - 0.05, T.move + 0.05, t) * (1 - ss(T.train - 0.2, T.train + 0.6, t));
  if (hrs > 0) { const ht = hourAt(t), k = Math.min(7, Math.floor(ht)), fr = s5(0, 0.62, ht - k); p = lerpPose(p, lerpPose(HOURS[k], HOURS[k + 1], ht >= 8 ? 1 : fr), hrs); }
  // training: arms forward, pulled apart three times; the head comes back over the shoulders
  const tr = ss(T.train - 0.1, T.train + 0.8, t) * (1 - ss(T.red - 1.0, T.red - 0.2, t));
  if (tr > 0) {
    const r0 = T.train + 1.0, rep = 1.95, u = (t - r0) / rep, k = Math.floor(u), f = u - k;
    const out = k >= 0 && k < 3 ? (f < 0.4 ? s5(0, 0.4, f) : f < 0.52 ? 1 : 1 - s5(0.52, 0.92, f)) : 0;
    let q = lerpPose(P.pull0, P.pull1, out);
    const head = ss(T.back - 0.4, T.back + 1.3, t); q = { ...q, cer: lerp(q.cer, -0.02, head), poke: lerp(q.poke, -0.07, head), tho: lerp(q.tho, 0, head) };
    p = lerpPose(p, q, tr); W.squeeze = out * tr;
  } else W.squeeze = 0;
  return p;
}
function hourAt(t) { return clamp01((t - T.move) / (T.train - 0.6 - T.move)) * 8; }
function applyPose(p) {
  bend(W.seg, p); poseArm(W.arms.Right, p.r); poseArm(W.arms.Left, p.l);
}

// ------------------------------------------------------------------ one moment of the film
const _v = new THREE.Vector3(), _v2 = new THREE.Vector3(), _m = new THREE.Matrix4(), _x = new THREE.Vector3(), _y = new THREE.Vector3(), _z = new THREE.Vector3();
function update(S, t) {
  const scene = S.scene;
  // ---- light: museum warm, colder for the 19th-century model, the computer model and the red flags, warm for the training
  const figure = 1 - ss(T.final - 0.3, T.final + 1.4, t);
  const coldK = ss(T.comp - 0.3, T.comp + 0.4, t) * (1 - ss(T.people - 0.2, T.people + 0.8, t)) + ss(T.red - 0.4, T.red + 0.6, t) * (1 - ss(T.final - 0.4, T.final + 0.6, t));
  const warmK = ss(T.train, T.train + 1.2, t) * (1 - ss(T.red - 0.6, T.red + 0.4, t));
  const reveal = ss(T.q1 + 0.6, T.line - 0.4, t);
  W.key.intensity = figure * reveal * lerp(5.6, 2.6, coldK) * (1 + 0.2 * warmK);
  ckeys([[0, 0xffe9d2], [T.model, 0xffe9d2], [T.model + 0.8, 0xe6ebf5], [T.rev + 0.4, 0xe6ebf5], [T.rev + 1.6, 0xffe9d2]], t, W.key.color);
  W.rim.intensity = figure * reveal * (2.2 + coldK * 1.6);
  W.fill.intensity = figure * reveal * 0.6;
  W.top.intensity = figure * reveal * 1.3;
  W.back.intensity = figure * ss(T.two - 0.5, T.two + 1.5, t) * 2.2;
  W.coldSpot.intensity = ss(T.red - 0.3, T.red + 0.8, t) * (1 - ss(T.final - 0.4, T.final + 0.5, t)) * 3.4;
  W.warm.intensity = warmK * 4.0;
  W.bobLight.intensity = (1 - ss(T.line - 1.2, T.line + 1.6, t)) * 2.6;
  const endDark = ss(T.final + 0.2, T.logo - 0.3, t);
  S.tableMat.color.setScalar(1 - endDark * 0.95); scene.environmentIntensity = 0.12 * (1 - endDark);
  S.reflAmt = 0.9 * (1 - endDark);
  const gone = t > T.logo - 0.45; // the figure has gone dark: take it away so nothing hides the dial
  W.root.visible = !gone;

  // ---- the body
  applyPose(poseAt(t));
  W.root.updateMatrixWorld(true);

  // ---- the line, the bob, the marks
  bobAt(t, _bob); W.bob.position.copy(_bob.pos); W.bob.rotation.set(_bob.rx, 0, 0); W.bob.visible = !gone;
  { const P = CAM(t), d = Math.max(0.2, Math.hypot(P.p[0] - LINE_X, P.p[2] - W.lineZ)); const px = (2 * d * Math.tan((P.fov * Math.PI) / 360)) / S.size.y;
    setThread(t, Math.max(0.0006, px * 1.0)); }
  W.thread.visible = !gone;
  W.threadMat.opacity = 0.9 * (1 - 0.35 * ss(T.cut + 1.0, T.cut + 2.4, t));
  const marks = ss(T.line + 0.3, T.line + 1.6, t) * (1 - ss(T.cut - 0.25, T.cut + 0.05, t));
  W.markMat.opacity = marks;
  W.markDots.forEach((d, i) => d.scale.setScalar(0.001 + s5(T.line + 0.3 + i * 0.3, T.line + 0.75 + i * 0.3, t) * (1 - ss(T.cut - 0.25, T.cut + 0.05, t))));

  // ---- the ghost spine: the same curve, a smaller range of movement
  const ghost = ss(T.curve - 0.2, T.curve + 0.8, t) * (1 - ss(T.three - 0.6, T.three + 0.2, t));
  W.ghostMats.forEach((m) => { m.opacity = ghost * 0.66; m.depthWrite = ghost > 0.5; });
  W.ghostRoot.visible = ghost > 0.002;
  if (ghost > 0) {
    const w = (t - T.two) * 1.25, g2 = ss(T.less - 0.2, T.less + 0.5, t), k = lerp(1, 0.3, g2);
    bend(W.ghostSeg, { lum: 0.3 * Math.sin(w) * k, tho: 0.24 * Math.sin(w - 0.6) * k, cer: 0.18 * Math.sin(w - 1.1) * k, side: 0.14 * Math.sin(w * 0.7 + 1.0) * k, twist: 0.2 * Math.sin(w * 0.55 + 2.0) * k });
  }

  // ---- 41 reviews: a wave of light along the wall; at "no proof" they all go grey
  const pg = ss(T.rev - 0.4, T.rev + 0.5, t) * (1 - ss(T.two - 0.6, T.two + 0.6, t));
  const grey = ss(T.cut, T.cut + 0.8, t);
  for (const p of W.pages) {
    const ti = T.rev + 0.2 + p.i * 0.056, on = ss(ti, ti + 0.25, t);
    p.mat.opacity = pg * (0.18 + 0.82 * on);
    p.mat.emissiveIntensity = pg * on * lerp(0.42 + 0.55 * Math.exp(-Math.max(0, t - ti - 0.1) * 2.2), 0.1, grey);
    p.mat.color.setScalar(lerp(1, 0.55, grey)); p.m.visible = pg > 0.002;
  }
  W.pageLight.intensity = pg * lerp(1.6, 0.6, grey);

  // ---- text neck: the phone lies in the hands; "60 lb" is a computer model
  const ph = ss(T.three, T.three + 0.7, t) * (1 - ss(T.move - 0.15, T.move + 0.2, t));
  W.phone.g.visible = ph > 0.002;
  if (ph > 0.002) {
    const R = W.arms.Right, L = W.arms.Left;
    R.mc.getWorldPosition(_v); L.mc.getWorldPosition(_v2);
    const mid = _v.clone().add(_v2).multiplyScalar(0.5);
    R.elbow.getWorldPosition(_x); L.elbow.getWorldPosition(_y);
    _z.copy(_v).sub(_x).add(_v2).sub(_y).normalize();                  // along the forearms
    _x.set(0, 1, 0).cross(_z).normalize(); _y.copy(_z).clone(); _y.crossVectors(_z, _x).normalize();
    _m.makeBasis(_x, _y, _z); W.phone.g.quaternion.setFromRotationMatrix(_m); W.phone.g.rotateX(-0.42);
    W.phone.g.position.copy(mid).addScaledVector(_y, 0.016).addScaledVector(_z, -0.035);
    for (const [m, o] of W.phoneMats) m.opacity = o * ph;
    W.phone.screenMat.color.setScalar(ss(T.three + 0.3, T.three + 0.9, t) * (1 - ss(T.move - 0.4, T.move - 0.1, t)) * 1.25);
    W.phoneGlow.position.copy(W.phone.g.position).addScaledVector(_y, 0.06); W.phoneGlow.intensity = ph * 0.35;
  } else W.phoneGlow.intensity = 0;
  W.wireMat.opacity = ss(T.comp - 0.2, T.comp + 0.35, t) * (1 - ss(T.people - 0.3, T.people + 0.4, t)) * 0.45;
  for (const w of W.wire) w.visible = W.wireMat.opacity > 0.002;

  // ---- 732 people, and the flat line
  const dp = ss(T.people - 0.2, T.people + 0.4, t) * (1 - ss(T.move - 0.6, T.move + 0.2, t));
  W.dotsMat.uniforms.uAmt.value = dp; W.dotsMat.uniforms.uShow.value = ss(T.people, T.people + 2.8, t) * 1.1;
  W.dots.visible = dp > 0.002;
  W.axisMat.opacity = dp * 0.6;
  W.flatMat.opacity = dp * ss(T.flat - 0.1, T.flat + 0.2, t); W.flat.scale.z = 0.001 + s5(T.flat - 0.1, T.flat + 1.1, t);
  W.dotLight.intensity = dp * 1.3;

  // ---- the hour ring: every hour the orange arc steps on; at the end it turns into the logo
  const ring = ss(T.move - 0.5, T.move + 0.4, t);
  const dim = 1 - 0.75 * ss(T.train + 0.4, T.train + 1.6, t) * (1 - ss(T.final - 0.2, T.final + 1.0, t));
  const ht = hourAt(t), hk = Math.floor(ht), hours = Math.min(8, hk + outQuick(ht - hk));
  const logoK = s5(T.final + 0.3, T.logo - 0.25, t);
  W.ring.set({ weight: logoK, white: ring * dim * lerp(0.6, 1, logoK), hours: lerp(hours, 0, ss(T.final + 0.2, T.logo - 0.6, t)), arcOpacity: ring * dim * (1 - ss(T.logo - 0.9, T.logo - 0.5, t)),
    hand: ss(T.logo - 0.4, T.logo - 0.15, t), handScale: outBack(clamp01((t - (T.logo - 0.4)) / 0.35), 1.8), from: 9 });

  // ---- the muscles of the neck and upper back: in for the training, and they light as they squeeze
  const mus = ss(T.train + 0.1, T.train + 1.2, t) * (1 - ss(T.red - 0.6, T.red + 0.2, t));
  for (const m of W.muscles) { m.material.opacity = mus * 0.92; m.material.depthWrite = mus > 0.6; m.visible = mus > 0.002; m.material.emissive.set(0xff8a5c); m.material.emissiveIntensity = mus * (0.03 + 0.22 * W.squeeze); }

  // ---- red flags: the lower back and legs go cold, the nerve paths light from the spine down, the bladder lights
  const rf = ss(T.red, T.red + 0.8, t) * (1 - ss(T.final - 0.4, T.final + 0.4, t));
  W.nerveMat.uniforms.uO.value = rf * 0.85; W.nerveMat.uniforms.uP.value = ss(T.red + 0.5, T.red + 3.0, t);
  for (const m of W.lowBack) { m.material.emissive.set(0x7f9dff); m.material.emissiveIntensity = rf * (0.05 + 0.04 * Math.sin(t * 5.0)); }
  const bl = ss(T.bladder - 0.1, T.bladder + 0.5, t) * (1 - ss(T.final - 0.4, T.final + 0.4, t));
  W.bladder.visible = bl > 0.002; W.bladder.material.opacity = bl * 0.9; W.bladder.material.emissiveIntensity = bl * (1.2 + 0.5 * Math.sin(t * 5.0));
}
const outQuick = (x) => 1 - Math.pow(1 - clamp01(x / 0.35), 3);

// ------------------------------------------------------------------ the words on screen
const CAPS = [
  { t0: 0.35, t1: 4.45, top: 300, size: 112, html: 'Fix your <em>posture?</em>' },
  { t0: 4.97, t1: 15.9, top: 238, size: 30, mono: true, html: '1' },
  { t0: 5.07, t1: 9.9, top: 292, size: 100, html: 'No perfect <em>posture</em>' },
  { t0: 10.0, t1: 15.9, top: 292, size: 84, html: 'A <em>19th-century</em> model' },
  { t0: 16.6, t1: 22.6, top: 292, size: 84, html: '41 reviews. <em>No proof.</em>' },
  { t0: 23.1, t1: 30.6, top: 238, size: 30, mono: true, html: '2' },
  { t0: 23.2, t1: 29.2, top: 292, size: 100, html: 'Built to <em>move</em>' },
  { t0: 29.3, t1: 30.7, top: 292, size: 88, html: 'Same curve.<br><em>Less movement.</em>' },
  { t0: 31.04, t1: 37.0, top: 238, size: 30, mono: true, html: '3' },
  { t0: 31.14, t1: 35.4, top: 292, size: 100, html: 'Text <em>neck</em>' },
  { t0: 35.5, t1: 37.1, top: 292, size: 88, html: '<em>A computer model.</em>' },
  { t0: 37.5, t1: 44.6, top: 292, size: 96, html: '732 people.<br><em>No link.</em>' },
  { t0: 45.1, t1: 49.4, top: 292, size: 96, html: 'Move every <em>hour</em>' },
  { t0: 49.8, t1: 57.1, top: 292, size: 92, html: 'Train neck and<br><em>upper back</em>' },
  { t0: 57.5, t1: 65.2, top: 292, size: 84, html: 'Numb legs?<br>Bladder changes?' },
  { t0: 63.44, t1: 65.2, top: 500, size: 84, html: '<em>Get help now.</em>' },
  { t0: 65.62, t1: 99, top: 360, size: 96, html: 'Back to<br><em>factory settings.</em>' },
];
const SUBS = [
  [0.35, 4.22, "Trying to fix your posture? Here's what the science says."],
  [4.97, 15.78, "One: there's no perfect posture. The straight line in textbooks comes from a nineteenth-century model of a body standing still without using its muscles."],
  [16.53, 22.35, 'Forty-one reviews of the evidence found no proof that posture causes back pain.'],
  [23.1, 30.29, "Two: your spine is built to move. People with back pain don't have a different curve. They move less."],
  [31.04, 36.72, 'Three: text neck. The famous sixty pounds on your neck came from a computer model.'],
  [37.47, 44.32, "When scientists measured more than seven hundred people, the angle of their neck didn't predict neck pain."],
  [45.07, 48.99, 'So change position often. Get up once an hour.'],
  [49.74, 56.73, 'And train your neck and upper back. In trials, exercise moved the head back and eased neck pain.'],
  [57.48, 64.87, 'Back pain with numbness or weakness in both legs, or changes in your bladder? Get help right away.'],
  [65.62, 67.28, 'Back to factory settings.'],
];
const OVL = {};
function overlayInit(S) {
  const O = S.O;
  OVL.sixty = O.tag('big', '60 lb'); OVL.sixty.style.fontSize = '150px';
  OVL.ax = O.tag('tag', 'Neck angle →'); OVL.ax.style.fontSize = '26px';
  OVL.ay = O.tag('tag', 'Neck pain ↑'); OVL.ay.style.fontSize = '26px';
  OVL.marks = ['Ear', 'Shoulder', 'Hip', 'Knee', 'Ankle'].map((s) => { const e = O.tag('tag', s); e.style.fontSize = '28px'; return e; });
  OVL.hour = O.tag('tag o', 'Every hour'); OVL.hour.style.fontSize = '24px';
}
// a label to the left of a point, its right edge a gap away from it
function placeLeft(S, el, v, gap, dy, o) { place(S, el, v, -gap - (el.offsetWidth || 120), dy, o); }
function overlay(S, t) {
  const neck = W.seg['Sixth cervical vertebra'].g.getWorldPosition(new THREE.Vector3());
  const s60 = ss(T.sixty - 0.1, T.sixty + 0.35, t) * (1 - ss(T.comp - 0.15, T.comp + 0.4, t));
  placeLeft(S, OVL.sixty, neck, 70, -90, s60);
  const dp = ss(T.people + 0.4, T.people + 1.0, t) * (1 - ss(T.move - 0.6, T.move + 0.1, t)), pl = W.plot;
  placeLeft(S, OVL.ax, new THREE.Vector3(0, pl.Y0 - 0.05, pl.Z1), 0, 6, dp);
  place(S, OVL.ay, new THREE.Vector3(0, pl.Y1 + 0.02, pl.Z0 - 0.015), 10, -36, dp);
  W.marks.forEach((p, i) => placeLeft(S, OVL.marks[i], new THREE.Vector3(LINE_X, p.y, W.lineZ), 22, -17,
    ss(T.line + 0.45 + i * 0.3, T.line + 0.95 + i * 0.3, t) * (1 - ss(T.model + 0.4, T.model + 1.2, t))));
  place(S, OVL.hour, new THREE.Vector3(W.ringC.x + RING_R + 0.04, 0, W.ringC.z), 16, -14, ss(T.hour, T.hour + 0.4, t) * (1 - ss(T.train - 0.4, T.train + 0.2, t)));
  logoEnd(S, t, { t0: T.logo, center: W.ringC, edge: W.ringC.clone().add(new THREE.Vector3(RING_R, 0, 0)) });
}

makeFilm({
  T, caps: CAPS, subs: SUBS, build, update, pose: camPose, overlay, overlayInit,
  stage: { bg: 0x07080a, reflSize: 6, env: 0.12, far: 14 },
  aperture: [[0, 0.007], [4.5, 0.005], [7.6, 0.0016], [16, 0.0016], [22, 0.0022], [31, 0.003], [37.5, 0.0018], [45, 0.0014], [50, 0.0026], [57.5, 0.0024], [64.8, 0.002], [66.5, 0.0006]],
  bloom: [[0, 0.4], [16, 0.42], [31, 0.5], [37.5, 0.38], [45, 0.45], [57.5, 0.5], [65.6, 0.5], [67.5, 0.55]],
  fast: [[45.0, 49.3, 4], [19.3, 20.4, 3]],
});

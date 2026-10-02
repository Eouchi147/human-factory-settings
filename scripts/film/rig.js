// Human Factory Settings · the skeleton rig: a real skeleton (BodyParts3D) that can stand, bend, reach and walk.
// Joints sit where the bones say they are (the femoral head by a sphere fit, the knee at the condyles, the ankle between
// the malleoli, the shoulder at the humeral head). The pelvis carries the spine and both legs; the spine carries the arms.
import { THREE, lerp, clamp01, s5 } from './kit.js';

export const SPINE = ['Fifth lumbar vertebra', 'Fourth lumbar vertebra', 'Third lumbar vertebra', 'Second lumbar vertebra', 'First lumbar vertebra',
  'Twelfth thoracic vertebra', 'Eleventh thoracic vertebra', 'Tenth thoracic vertebra', 'Ninth thoracic vertebra', 'Eighth thoracic vertebra',
  'Seventh thoracic vertebra', 'Sixth thoracic vertebra', 'Fifth thoracic vertebra', 'Fourth thoracic vertebra', 'Third thoracic vertebra',
  'Second thoracic vertebra', 'First thoracic vertebra', 'Seventh cervical vertebra', 'Sixth cervical vertebra', 'Fifth cervical vertebra',
  'Fourth cervical vertebra', 'Third cervical vertebra', 'Axis', 'Atlas'];
export const NECK_MUSCLES = /splenius|semispinalis (capitis|cervicis)|levator scapulae/i;
export const BACK_MUSCLES = /trapezius|rhomboid/i;
export const HAND = /radius|ulna|scaphoid|lunate|triquetral|pisiform|trapezium|trapezoid|capitate|hamate|metacarpal|phalanx of (right|left) (thumb|\w+ finger)/i;
export const FOOT = /talus|calcaneus|cuboid bone|navicular bone of|cuneiform bone|metatarsal bone|phalanx of (right|left) (big|second|third|fourth|little) toe|sesamoid bone of (right|left) foot/i;
const SHANK = /^(right|left) (tibia|fibula|patella)$/i, THIGH = /^(right|left) femur$/i, PELVIS = /hip bone|sacrum|coccyx|bladder|^intervertebral disk$/i;
const sideOf = (n) => (/\bright\b/i.test(n) ? 'Right' : /\bleft\b/i.test(n) ? 'Left' : null);

// a selector for loadAnatomy: the whole skeleton, plus any extra parts a film asks for (returns a tissue key or null)
export function skeletonKind(extra) {
  return (p) => {
    const n = p.name.toLowerCase(), has = (...k) => k.some((s) => n.includes(s));
    const e = extra && extra(p); if (e !== undefined) return e;
    if (p.system !== 'skeletal') return null;
    if (has('gingiva', 'fibularis', 'tibialis', 'subscapularis', 'iliotibial', 'levator scapulae')) return null;
    if (has('tooth')) return 'tooth';
    if (has('cartilage', 'intervertebral disk')) return 'cartilage';
    return 'bone';
  };
}

// where a part rides: a spine segment name, 'pelvis', or [side, 'girdle' | 'arm' | 'elbow' | 'hip' | 'knee' | 'ankle']
export function placeOf(name) {
  const n = name.toLowerCase(), side = sideOf(name);
  const disk = n.match(/^intervertebral disk of (\w+) (cervical|thoracic|lumbar) vertebra/);
  if (disk) return SPINE.find((s) => s.toLowerCase() === `${disk[1]} ${disk[2]} vertebra`) || 'pelvis';
  if (n === 'intervertebral disk of axis') return 'Axis';
  if (PELVIS.test(name)) return 'pelvis';
  if (THIGH.test(name)) return [side, 'hip'];
  if (SHANK.test(name)) return [side, 'knee'];
  if (FOOT.test(name) && side) return [side, 'ankle'];
  if (/rib|costal|sternum|manubrium|xiphoid/.test(n)) return 'Seventh thoracic vertebra';
  if (/clavicle|scapula/.test(n) && side) return [side, 'girdle'];
  if (/humerus/.test(n) && side) return [side, 'arm'];
  if (HAND.test(name) && side) return [side, 'elbow'];
  if (BACK_MUSCLES.test(name)) return 'Third thoracic vertebra';
  if (NECK_MUSCLES.test(name)) return 'Sixth cervical vertebra';
  if (/hyoid|thyroid cartilage|cricoid|arytenoid|corniculate|cuneiform cartilage|larynx|trachea/.test(n)) return 'Fourth cervical vertebra';
  return 'Atlas'; // the skull, the face, the brain
}

export function worldVerts(m, step = 1) { const p = m.geometry.attributes.position, out = []; for (let i = 0; i < p.count; i += step) out.push(new THREE.Vector3().fromBufferAttribute(p, i).add(m.userData.home)); return out; }
export const avgV = (a) => a.reduce((s, v) => s.add(v), new THREE.Vector3()).multiplyScalar(1 / Math.max(1, a.length));
function sphereFit(pts) { // least squares: |p|^2 = 2c.p + d
  const A = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]], b = [0, 0, 0, 0];
  for (const p of pts) { const r = [2 * p.x, 2 * p.y, 2 * p.z, 1], q = p.lengthSq(); for (let i = 0; i < 4; i++) { b[i] += r[i] * q; for (let j = 0; j < 4; j++) A[i][j] += r[i] * r[j]; } }
  for (let i = 0; i < 4; i++) { let mx = i; for (let k = i + 1; k < 4; k++) if (Math.abs(A[k][i]) > Math.abs(A[mx][i])) mx = k; [A[i], A[mx]] = [A[mx], A[i]]; [b[i], b[mx]] = [b[mx], b[i]];
    for (let k = i + 1; k < 4; k++) { const f = A[k][i] / A[i][i]; for (let j = i; j < 4; j++) A[k][j] -= f * A[i][j]; b[k] -= f * b[i]; } }
  const x = [0, 0, 0, 0]; for (let i = 3; i >= 0; i--) { let s = b[i]; for (let j = i + 1; j < 4; j++) s -= A[i][j] * x[j]; x[i] = s / A[i][i]; }
  return new THREE.Vector3(x[0], x[1], x[2]);
}

export function buildRig(meshes, { assign } = {}) {
  const byName = new Map(); for (const m of meshes) if (!byName.has(m.userData.name)) byName.set(m.userData.name, m);
  const all = (re) => meshes.filter((m) => re.test(m.userData.name));
  const root = new THREE.Group();
  // ---- the legs' joints, from the bones
  const L = {};
  for (const Side of ['Right', 'Left']) {
    const s = Side.toLowerCase();
    const fem = byName.get(`${Side} femur`), fv = worldVerts(fem, 2);
    let top = -9, bot = 9; for (const v of fv) { top = Math.max(top, v.y); bot = Math.min(bot, v.y); }
    const upper = fv.filter((v) => v.y > top - 0.06); let mx = 9; for (const v of upper) mx = Math.min(mx, Math.abs(v.x));
    const head = upper.filter((v) => Math.abs(v.x) < mx + 0.035);
    const H = sphereFit(head);
    const lowv = fv.filter((v) => v.y < bot + 0.03), K = avgV(lowv); K.y = bot + 0.022;
    const tib = worldVerts(byName.get(`${Side} tibia`), 2), fib = worldVerts(byName.get(`${Side} fibula`), 2);
    const lo = (vs) => vs.reduce((a, v) => (v.y < a.y ? v : a));
    const A = lo(tib).clone().add(lo(fib)).multiplyScalar(0.5); A.y += 0.015;
    const cal = worldVerts(byName.get(`${Side} calcaneus`)); let cy = 9; for (const v of cal) cy = Math.min(cy, v.y);
    const heel = cal.filter((v) => v.y < cy + 0.008).reduce((a, v) => (v.z < a.z ? v : a)).clone();
    const m1 = worldVerts(byName.get(`${Side} first metatarsal bone`)), m5 = worldVerts(byName.get(`${Side} fifth metatarsal bone`));
    const front = (vs) => vs.reduce((a, v) => (v.z > a.z ? v : a));
    const ball = front(m1).clone().add(front(m5)).multiplyScalar(0.5); ball.z = front(m1).z - 0.012;
    let ground = 9; for (const m of all(FOOT)) if (sideOf(m.userData.name) === Side) for (const v of worldVerts(m, 3)) ground = Math.min(ground, v.y);
    ball.y = ground; heel.y = Math.max(heel.y, ground);
    let toeZ = -9; for (const m of all(/phalanx of (right|left) (big|second) toe/i)) if (sideOf(m.userData.name) === Side) for (const v of worldVerts(m, 3)) toeZ = Math.max(toeZ, v.z);
    L[Side] = { H, K, A, heel, ball, toeZ, ground, L1: H.distanceTo(K), L2: K.distanceTo(A) };
  }
  const P0 = L.Right.H.clone().add(L.Left.H).multiplyScalar(0.5);
  const pelvis = new THREE.Group(); pelvis.position.copy(P0); root.add(pelvis);
  const pivots = new Map(); pivots.set(pelvis, P0);
  // ---- the spine, on the pelvis
  const seg = {}; let parent = pelvis, pp = P0.clone();
  for (const name of SPINE) {
    const m = byName.get(name); if (!m) continue;
    const g = new THREE.Group(); g.position.copy(m.userData.home).sub(pp); parent.add(g); pivots.set(g, m.userData.home.clone());
    m.position.set(0, 0, 0); g.add(m); seg[name] = { g, pivot: m.userData.home.clone() }; parent = g; pp = m.userData.home;
  }
  // ---- the legs, on the pelvis
  const legs = {};
  for (const Side of ['Right', 'Left']) {
    const J = L[Side];
    const hip = new THREE.Group(); hip.position.copy(J.H).sub(P0); pelvis.add(hip); pivots.set(hip, J.H);
    const knee = new THREE.Group(); knee.position.copy(J.K).sub(J.H); hip.add(knee); pivots.set(knee, J.K);
    const ankle = new THREE.Group(); ankle.position.copy(J.A).sub(J.K); knee.add(ankle); pivots.set(ankle, J.A);
    legs[Side] = { ...J, hip, knee, ankle, s: Side === 'Right' ? -1 : 1 };
  }
  // ---- the arms, on the third thoracic vertebra
  const t3 = seg['Third thoracic vertebra'], arms = {};
  for (const Side of ['Right', 'Left']) {
    const hum = byName.get(`${Side} humerus`), cla = byName.get(`${Side} clavicle`);
    const hv = worldVerts(hum); let top = -9, bot = 9; for (const v of hv) { top = Math.max(top, v.y); bot = Math.min(bot, v.y); }
    const SH = avgV(hv.filter((v) => v.y > top - 0.045)), EL = avgV(hv.filter((v) => v.y < bot + 0.03));
    const cv = worldVerts(cla); let mn = 9; for (const v of cv) mn = Math.min(mn, Math.abs(v.x));
    const SC = avgV(cv.filter((v) => Math.abs(v.x) < mn + 0.012));
    const girdle = new THREE.Group(); girdle.position.copy(SC).sub(t3.pivot); t3.g.add(girdle); pivots.set(girdle, SC);
    const arm = new THREE.Group(); arm.position.copy(SH).sub(SC); girdle.add(arm); pivots.set(arm, SH);
    const elbow = new THREE.Group(); elbow.position.copy(EL).sub(SH); arm.add(elbow); pivots.set(elbow, EL);
    arms[Side] = { s: Side === 'Right' ? -1 : 1, girdle, arm, elbow, SH, EL, mc: byName.get(`${Side} third metacarpal bone`) };
  }
  // ---- every other part rides with its place
  const groupOf = (place) => {
    if (place === 'pelvis') return pelvis;
    if (typeof place === 'string') return (seg[place] || seg.Atlas).g;
    const [Side, j] = place;
    if (j === 'girdle' || j === 'arm' || j === 'elbow') return arms[Side][j];
    return legs[Side][j];
  };
  for (const m of meshes) {
    if (SPINE.includes(m.userData.name) && seg[m.userData.name] && m.parent === seg[m.userData.name].g) continue;
    const place = (assign && assign(m.userData.name, m)) || placeOf(m.userData.name);
    if (place === 'world') { m.position.copy(m.userData.home); root.add(m); continue; }
    const g = groupOf(place); m.position.copy(m.userData.home).sub(pivots.get(g)); g.add(m);
  }
  const rig = { root, pelvis, P0, seg, legs, arms, byName, pivots };
  return rig;
}

// ---------------------------------------------------------------- posing
export function bendSpine(seg, { lum = 0, tho = 0, cer = 0, side = 0, twist = 0, poke = 0 }) {
  SPINE.forEach((name) => {
    const s = seg[name]; if (!s) return;
    const n = name.toLowerCase();
    let k = n.includes('lumbar') ? lum / 5 : n.includes('thoracic') ? tho / 12 : cer / 7;
    if (/seventh cervical|sixth cervical|fifth cervical/.test(n)) k += poke * 0.42;
    if (/^axis$|^atlas$|third cervical/.test(n)) k -= poke * 0.42;
    s.g.rotation.set(k, twist / SPINE.length, side / SPINE.length);
  });
}
const DOWN = new THREE.Vector3(0, -1, 0), _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _d = new THREE.Vector3();
// dir: where the upper arm points, [outward, up, forward]; twist: internal rotation (+ turns the forearm in); elbow: flexion
export function poseArm(A, a) {
  _d.set(a.dir[0] * A.s, a.dir[1], a.dir[2]).normalize();
  _q.setFromUnitVectors(DOWN, _d); _q2.setFromAxisAngle(_d, (a.twist || 0) * A.s);
  A.arm.quaternion.multiplyQuaternions(_q2, _q);
  A.elbow.rotation.set(-(a.elbow || 0), 0, 0);
  A.girdle.rotation.set(0, (a.retract || 0) * A.s, (a.elevate || 0) * A.s);
}
export const ARM0 = { dir: [0, -1, 0], twist: 0, elbow: 0.05, retract: 0, elevate: 0 };

// two-bone leg IK: put the ankle centre at a world point with the foot at a world orientation; the knee bends forward
const _H = new THREE.Vector3(), _K = new THREE.Vector3(), _v1 = new THREE.Vector3(), _v2 = new THREE.Vector3(), _f = new THREE.Vector3();
const _qp = new THREE.Quaternion(), _qh = new THREE.Quaternion(), _qk = new THREE.Quaternion(), _qi = new THREE.Quaternion();
export function legIK(rig, Side, target, footQuat, forward = new THREE.Vector3(0, 0, 1)) {
  const G = rig.legs[Side];
  rig.pelvis.updateMatrixWorld(true);
  rig.pelvis.getWorldQuaternion(_qp);
  _H.copy(G.H).sub(rig.P0).applyQuaternion(_qp).add(rig.pelvis.getWorldPosition(_v1));
  const dvec = _v2.copy(target).sub(_H); let d = dvec.length(); const max = (G.L1 + G.L2) * 0.9995; if (d > max) { dvec.multiplyScalar(max / d); d = max; }
  const dir = dvec.clone().normalize();
  _f.copy(forward).addScaledVector(dir, -forward.dot(dir)).normalize();
  const ca = clamp01((G.L1 * G.L1 + d * d - G.L2 * G.L2) / (2 * G.L1 * d)), sa = Math.sqrt(1 - ca * ca);
  _K.copy(_H).addScaledVector(dir, G.L1 * ca).addScaledVector(_f, G.L1 * sa);
  const A = _H.clone().add(dvec);
  // thigh
  _qi.copy(_qp).invert();
  const restT = G.K.clone().sub(G.H).normalize(), tgtT = _K.clone().sub(_H).applyQuaternion(_qi).normalize();
  G.hip.quaternion.setFromUnitVectors(restT, tgtT);
  // shank
  _qh.multiplyQuaternions(_qp, G.hip.quaternion); _qi.copy(_qh).invert();
  const restS = G.A.clone().sub(G.K).normalize(), tgtS = A.clone().sub(_K).applyQuaternion(_qi).normalize();
  G.knee.quaternion.setFromUnitVectors(restS, tgtS);
  // foot
  _qk.multiplyQuaternions(_qh, G.knee.quaternion); _qi.copy(_qk).invert();
  G.ankle.quaternion.multiplyQuaternions(_qi, footQuat);
  return { reach: d / (G.L1 + G.L2) };
}

// ---------------------------------------------------------------- walking
// A walk along +z over ground y = ground(z). s = distance walked (m). Returns what to pose; walkApply() poses it.
// stride: one full cycle (two steps). The right heel strikes at s = k * stride.
export function walkAt(rig, s, { stride = 1.1, ground = () => 0, slope = () => 0, drop = 0.03, bob = 0.012, sway = 0.014, yaw = 0.07, arms = 0.26, x0 = 0, z0 = 0 } = {}) {
  const out = { feet: {} };
  const phase = (u) => u - Math.floor(u);
  const zp = z0 + s;                                         // where the pelvis is
  const ph = phase(s / stride);
  out.pelvis = new THREE.Vector3(rig.P0.x + x0 - sway * Math.sin(2 * Math.PI * ph), rig.P0.y - drop - bob * Math.cos(4 * Math.PI * ph) + ground(zp), rig.P0.z + zp);
  out.pelvisRot = new THREE.Euler(0, yaw * Math.cos(2 * Math.PI * ph), -0.035 * Math.sin(2 * Math.PI * ph));
  for (const Side of ['Right', 'Left']) {
    const G = rig.legs[Side], off = Side === 'Right' ? 0 : 0.5;
    const u = s / stride - off, k = Math.floor(u), f = u - k;
    const hs = (kk) => z0 + rig.P0.z + (kk + off) * stride + 0.27;   // world z of the heel contact for step kk
    const pose = (pivot, pivotRest, pitch, zHeel) => {       // ankle and foot orientation, foot pivoting on a point on the ground
      const zz = zHeel + (pivotRest.z - G.heel.z), beta = slope(zz);
      const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -(pitch + beta));
      const P = new THREE.Vector3(pivotRest.x + x0, ground(zz) + (pivotRest.y - G.ground) + G.ground, zz);
      const ankle = G.A.clone().sub(pivotRest).applyQuaternion(q).add(P);
      return { ankle, q };
    };
    const HS = 0.21, TO = 0.6;                                // toes up at heel strike, heel up at toe-off (radians)
    let r;
    if (f < 0.62) {
      if (f < 0.1) r = pose(G.heel, G.heel, HS * (1 - s5(0, 0.1, f)), hs(k));
      else if (f < 0.45) r = pose(G.heel, G.heel, 0, hs(k));
      else r = pose(G.ball, G.ball, -TO * s5(0.45, 0.62, f), hs(k));
      r.stance = true;
    } else {
      const w = (f - 0.62) / 0.38;
      const a = pose(G.ball, G.ball, -TO, hs(k)), b = pose(G.heel, G.heel, HS, hs(k + 1));
      const e = s5(0, 1, w);
      const ankle = a.ankle.clone().lerp(b.ankle, e); ankle.y += 0.055 * Math.sin(Math.PI * Math.pow(w, 0.75));
      r = { ankle, q: a.q.clone().slerp(b.q, s5(0.05, 0.95, w)), stance: false };
    }
    out.feet[Side] = r;
    // the arm on this side swings with the other leg
    const sw = -arms * Math.cos(2 * Math.PI * (ph - off));
    out[Side === 'Right' ? 'armR' : 'armL'] = { dir: [0.07, -Math.cos(sw), Math.sin(sw)], twist: 0.1, elbow: 0.22 + 0.25 * Math.max(0, Math.sin(sw) / Math.sin(arms)), retract: 0, elevate: 0 };
  }
  out.twist = -0.6 * out.pelvisRot.y;
  return out;
}
export function walkApply(rig, W, spine = {}) {
  rig.pelvis.position.copy(W.pelvis); rig.pelvis.rotation.copy(W.pelvisRot);
  bendSpine(rig.seg, { tho: 0.04, ...spine, twist: (spine.twist || 0) + W.twist });
  poseArm(rig.arms.Right, W.armR); poseArm(rig.arms.Left, W.armL);
  const r = {};
  for (const Side of ['Right', 'Left']) r[Side] = legIK(rig, Side, W.feet[Side].ankle, W.feet[Side].q);
  return r;
}
export function standApply(rig, spine = {}, armR = ARM0, armL = ARM0) {
  rig.pelvis.position.copy(rig.P0); rig.pelvis.rotation.set(0, 0, 0);
  bendSpine(rig.seg, spine); poseArm(rig.arms.Right, armR); poseArm(rig.arms.Left, armL);
  for (const Side of ['Right', 'Left']) { const G = rig.legs[Side]; G.hip.quaternion.identity(); G.knee.quaternion.identity(); G.ankle.quaternion.identity(); }
}

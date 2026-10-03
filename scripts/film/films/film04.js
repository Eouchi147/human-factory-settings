// Human Factory Settings · Film 4 "Can crunches burn belly fat?" · one continuous shot, 9:16.
// A skeleton on an exercise mat does crunches. Its abs grow strong under a golden layer of fat that never moves.
// The evidence, one study at a time; the trained arm and the untrained arm look the same on the scan; what works.
import { THREE, ORANGE, ss, s5, lerp, clamp01, hash, camTrack, phys, glowMat, shadows, spot, glowSprite,
  loadAnatomy, tissueMat, V3, vadd, place, logoEnd, makeFilm, outBack, stamp, labelCanvas, stampLine, noiseTex } from '../kit.js';
import { buildRig, skeletonKind, legIK, bendSpine, poseArm, ARM0, worldVerts } from '../rig.js';
import { makeLogoRing } from '../props.js';
import { skinned, spineBinder, armBinder, frontField, radialField, gridGeo, lobuleTex, fatMat, FAT } from '../soft.js';

// ------------------------------------------------------------------ timing, from the voice guide (word starts)
const T = {
  end: 72.0,
  q0: 0.35, crunches: 1.04, bellyfat: 1.96,                   // "Doing crunches to lose belly fat?"
  strong: 2.96, abs: 4.05,                                     // "You'll get strong abs."
  under: 4.86, same: 5.71,                                     // "Under the same fat."
  muscle: 7.39, burn: 8.67, top: 9.76,                         // "A muscle doesn't burn the fat sitting on top of it."
  trial: 11.35, sixweek: 12.10, alone: 14.36, shrink: 15.16, waist: 15.74, bfat: 16.65,   // "In a six-week trial, ab exercises alone didn't shrink the waist or the belly fat."
  across: 18.29, thirteen: 19.11, eleven: 20.49, training: 22.05, part: 22.79, spot: 25.64,   // "Across thirteen studies ... in that spot."
  another: 27.09, onearm: 29.14, twelve: 30.08,                // "In another, people trained only one arm for twelve weeks."
  scans: 31.43, nodiff: 32.57, twoarms: 33.89,                 // "On the scans, no difference between the two arms."
  myth: 35.19, mythw: 36.81, excellent: 37.15, marketing: 37.66,   // "Spot reduction is a myth with excellent marketing."
  what: 39.72, strength: 41.30,                                // "What does work? Strength training."
  s58: 42.99, fiftyeight: 43.62, cut: 44.78, deep: 46.91, organs: 48.23,   // "In fifty-eight studies, it cut body fat, including the deep fat around your organs."
  lose: 49.80, anywhere: 50.97, eat: 51.36, less: 52.84, use: 53.73,       // "And to lose fat anywhere, eat and drink a little less than you use."
  burns: 54.82, stored: 56.27,                                 // "Your body burns its stored fat."
  picks: 57.32, where: 58.14, dont: 58.37,                     // "It picks where. You don't."
  lift: 59.71, twice: 60.54,                                   // "So lift twice a week."
  move: 61.76, hundred: 63.05, minutes: 63.84,                 // "Move at least a hundred and fifty minutes a week."
  eatless: 65.11, little: 66.09,                               // "And eat a little less."
  final: 67.89, settings: 69.05, logo: 69.75,                  // "Back to factory settings."
};

// ------------------------------------------------------------------ the world
const W = {}; window.HFS_W = W;
const MAT_H = 0.006;                    // the exercise mat: 6 mm of rubber on the walnut floor
const BACK = -0.1125;                   // the body's back plane (sacrum and upper back, standing frame z): it lies on the mat
const FLOOR = 0.4;

// ------------------------------------------------------------------ the abdominal wall (standing frame, metres)
// The atlas has the external obliques but no rectus abdominis, so the "six-pack" is built here: two strips from the
// costal margin to the pubis, three tendinous intersections above the navel, lying where the obliques' front sheath is.
const RX0 = 0.0036, RY0 = 0.93, RY1 = 1.33;
const RWK = [[0.93, 0.03], [1.0, 0.05], [1.09, 0.064], [1.2, 0.073], [1.31, 0.071]];
const pw = (K, y) => { if (y <= K[0][0]) return K[0][1]; for (let i = 0; i < K.length - 1; i++) if (y <= K[i + 1][0]) return lerp(K[i][1], K[i + 1][1], (y - K[i][0]) / (K[i + 1][0] - K[i][0])); return K[K.length - 1][1]; };
const RW = (y) => pw(RWK, y);
const INT = [1.31, 1.235, 1.165, 1.09];      // the top and the three tendinous intersections (the lowest at the navel)
const rTop = (u) => 1.298 + 0.03 * Math.sin(Math.PI * 0.5 * u);   // the top edge rides up the costal cartilages, higher at the side
function rectusBulge(u, y, def) {
  const across = Math.pow(Math.sin(Math.PI * clamp01(u)), 0.55), end = ss(RY0, RY0 + 0.025, y) * ss(rTop(u), rTop(u) - 0.03, y);
  let along = 0.5 * ss(RY0, 1.04, y);
  for (let k = 0; k < 3; k++) if (y <= INT[k] && y > INT[k + 1]) along = Math.pow(Math.sin((Math.PI * (INT[k] - y)) / (INT[k] - INT[k + 1])), 0.85);
  return { front: 0.0015 + (0.0012 + (0.0035 + 0.0115 * def) * along) * across * end, back: 0.0015 - 0.012 * Math.pow(across, 0.5) * end };
}
function alphaFrom(geo, f) {   // RGBA vertex colours: white, alpha from f(u, v) (the fat fades out where it thins to nothing)
  const UV = geo.attributes.uv, n = UV.count, C = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) { C[i * 4] = C[i * 4 + 1] = C[i * 4 + 2] = 1; C[i * 4 + 3] = f(UV.getX(i), UV.getY(i)); }
  geo.setAttribute('color', new THREE.BufferAttribute(C, 4)); return geo;
}
function orient(geo, test) {   // flip the triangles if the normals point the wrong way (test(p, n) > 0 when right)
  const P = geo.attributes.position, N = geo.attributes.normal, p = new THREE.Vector3(), n = new THREE.Vector3(); let s = 0;
  for (let i = 0; i < P.count; i += 7) { p.fromBufferAttribute(P, i); n.fromBufferAttribute(N, i); s += test(p, n); }
  if (s < 0) { const I = geo.index.array; for (let i = 0; i < I.length; i += 3) { const t = I[i + 1]; I[i + 1] = I[i + 2]; I[i + 2] = t; } geo.computeVertexNormals(); }
  return geo;
}
function restGeo(m) {   // an atlas mesh in the standing frame, float normals
  const g = new THREE.BufferGeometry(), h = m.userData.home, P = m.geometry.attributes.position, N = m.geometry.attributes.normal;
  const p = new Float32Array(P.count * 3), n = new Float32Array(P.count * 3);
  for (let i = 0; i < P.count; i++) { p[i * 3] = P.getX(i) + h.x; p[i * 3 + 1] = P.getY(i) + h.y; p[i * 3 + 2] = P.getZ(i) + h.z; n[i * 3] = N.getX(i); n[i * 3 + 1] = N.getY(i); n[i * 3 + 2] = N.getZ(i); }
  g.setAttribute('position', new THREE.BufferAttribute(p, 3)); g.setAttribute('normal', new THREE.BufferAttribute(n, 3)); g.setIndex(m.geometry.index.clone());
  return g;
}
// fat under the skin of the belly: a layer over the abdominal wall, thickest low on the front, thinning to nothing at its edges
const FY0 = 0.9, FY1 = 1.37, FA = 2.45, FZC = -0.005, FT = 0.034;
const fy1 = (a) => 1.312 + 0.058 * ss(0.12, 0.62, Math.abs(a));   // the top edge: low at the midline, so the sternum stays bare
const fatT = (y, a) => FT * lerp(0.1, 1, ss(1.25, 1.12, y)) * ss(fy1(a), fy1(a) - 0.05, y) * ss(FY0, 0.985, y) * (0.78 + 0.22 * Math.exp(-(((y - 1.05) / 0.06) ** 2))) * ss(FA, 1.85, Math.abs(a)) * (1 - 0.33 * ss(0.3, 1.6, Math.abs(a)));

function muscleMat(o = {}) { const m = tissueMat('muscle', o); m.emissive.set(0xff5a1e); return m; }

// ------------------------------------------------------------------ the fat around an upper arm (standing frame: the arm hangs from SH to EL)
const ARM_S0 = 0.13, ARM_S1 = 0.97;
const armFatT = (s, a) => 0.0088 * ss(ARM_S0, 0.32, s) * ss(ARM_S1, 0.8, s) * (0.62 + 0.38 * (0.5 - 0.5 * Math.cos(a)));   // a = 0 front, pi back
function sleeveGeo(pts, SH, EL, k) {
  const ax = EL.clone().sub(SH), L = ax.length(); ax.normalize();
  const e1 = new THREE.Vector3(0, 0, 1).addScaledVector(ax, -ax.z).normalize(), e2 = new THREE.Vector3().crossVectors(ax, e1);
  const ns = 36, na = 48, Rr = new Float32Array((ns + 1) * na).fill(-1), d = new THREE.Vector3();
  for (const p of pts) {
    d.copy(p).sub(SH); const s = d.dot(ax) / L; if (s < 0.02 || s > 1.02) continue;
    const x1 = d.dot(e1), x2 = d.dot(e2), a = Math.atan2(x2, x1), r = Math.hypot(x1, x2);
    const j = Math.round(((s - 0.02) / 1.0) * ns), i = ((Math.round((a / (2 * Math.PI)) * na) % na) + na) % na, kk = Math.min(ns, Math.max(0, j)) * na + i;
    if (r > Rr[kk]) Rr[kk] = r;
  }
  for (let j = 0; j <= ns; j++) for (let i = 0; i < na; i++) { const kk = j * na + i; if (Rr[kk] >= 0) continue; let b = -1; for (let dd = 1; dd < na && b < 0; dd++) for (const [jj, ii] of [[j, i - dd], [j, i + dd], [j - dd, i], [j + dd, i]]) { const iw = ((ii % na) + na) % na; if (jj >= 0 && jj <= ns && Rr[jj * na + iw] >= 0) { b = Rr[jj * na + iw]; break; } } Rr[kk] = Math.max(0.02, b); }
  for (let r = 0; r < 3; r++) { const C = Rr.slice(); for (let j = 1; j < ns; j++) for (let i = 0; i < na; i++) { let sum = 0, mx = 0; for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) { const v = C[(j + dj) * na + ((i + di + na) % na)]; sum += v; mx = Math.max(mx, v); } Rr[j * na + i] = 0.5 * sum / 9 + 0.5 * mx; } }
  const rin = (s, a) => { const fj = Math.min(ns - 1e-6, Math.max(0, ((s - 0.02) / 1.0) * ns)), j = Math.floor(fj), v = fj - j; const fa = (((a / (2 * Math.PI)) * na) % na + na) % na, i = Math.floor(fa), u = fa - i, i2 = (i + 1) % na;
    return lerp(lerp(Rr[j * na + i], Rr[j * na + i2], u), lerp(Rr[(j + 1) * na + i], Rr[(j + 1) * na + i2], u), v); };
  const g = gridGeo((u, v) => { const a = u * 2 * Math.PI, s = lerp(ARM_S0, ARM_S1, v), r = rin(s, a) + 0.002 + armFatT(s, a) * k; const c = SH.clone().addScaledVector(ax, s * L).addScaledVector(e1, Math.cos(a) * r).addScaledVector(e2, Math.sin(a) * r); return [c.x, c.y, c.z]; }, 64, 40);
  orient(g, (p, n) => { const q = p.clone().sub(SH); q.addScaledVector(ax, -q.dot(ax)); return n.dot(q); });
  alphaFrom(g, (u, v) => ss(0.0003, 0.003, armFatT(lerp(ARM_S0, ARM_S1, v), u * 2 * Math.PI)));
  g.userData.slice = { s: 0.5, rin: (a) => rin(0.5, a), t: (a) => armFatT(0.5, a), L };
  return g;
}

// ------------------------------------------------------------------ hands that can hold a dumbbell
// Each finger gets three joints (knuckle, middle, end), found on its bones; curl(k) closes the hand into a fist.
// The palm's frame (finger direction, across the knuckles, palm normal) lives in the forearm group, so a dumbbell rides there.
const avgV = (a) => a.reduce((s, v) => s.add(v), new THREE.Vector3()).multiplyScalar(1 / Math.max(1, a.length));
function rigHand(R, Side) {
  const A = R.arms[Side], side = Side.toLowerCase(), eg = A.elbow, EL = A.EL, by = (n) => R.byName.get(n);
  const top = (m) => { const vs = worldVerts(m); let mx = -9, mn = 9; for (const v of vs) { mx = Math.max(mx, v.y); mn = Math.min(mn, v.y); } return avgV(vs.filter((v) => v.y > mx - 0.12 * (mx - mn))); };
  const bot = (m) => { const vs = worldVerts(m); let mx = -9, mn = 9; for (const v of vs) { mx = Math.max(mx, v.y); mn = Math.min(mn, v.y); } return avgV(vs.filter((v) => v.y < mn + 0.12 * (mx - mn))); };
  const F = ['index', 'middle', 'ring', 'little'].map((f) => ({ P: by(`Proximal phalanx of ${side} ${f} finger`), M: by(`Middle phalanx of ${side} ${f} finger`), D: by(`Distal phalanx of ${side} ${f} finger`) }));
  const mcpI = top(F[0].P), mcpL = top(F[3].P), fdir = bot(F[1].D).sub(top(F[1].P)).normalize();
  const across = mcpL.clone().sub(mcpI); across.sub(fdir.clone().multiplyScalar(across.dot(fdir))).normalize();
  const n = new THREE.Vector3().crossVectors(fdir, across).normalize(); if (n.z < 0) n.negate();   // the palm faces forward in the atlas (anatomical position)
  const axis = new THREE.Vector3().crossVectors(fdir, n).dot(across) > 0 ? across.clone().negate() : across.clone();   // +angle curls toward the palm
  const joints = [];
  for (const f of F) {
    const pts = [top(f.P), top(f.M), top(f.D)], gs = [];
    let parent = eg, pp = EL;
    [f.P, f.M, f.D].forEach((m, i) => {
      const g = new THREE.Group(); g.position.copy(pts[i]).sub(pp); parent.add(g);
      m.parent.remove(m); m.position.copy(m.userData.home).sub(pts[i]); g.add(m); gs.push(g); parent = g; pp = pts[i];
    });
    joints.push(gs);
  }
  // the thumb: two phalanges that close across the palm
  const tP = by(`Proximal phalanx of ${side} thumb`), tD = by(`Distal phalanx of ${side} thumb`), tpt = [top(tP), top(tD)];
  const ttip = bot(tD), tdir = ttip.clone().sub(tpt[0]).normalize(), aim = mcpI.clone().lerp(mcpL, 0.6).add(n.clone().multiplyScalar(0.03)).sub(ttip);
  const taxis = new THREE.Vector3().crossVectors(tdir, aim).normalize(), tg = [];
  { let parent = eg, pp = EL; [tP, tD].forEach((m, i) => { const g = new THREE.Group(); g.position.copy(tpt[i]).sub(pp); parent.add(g); m.parent.remove(m); m.position.copy(m.userData.home).sub(tpt[i]); g.add(m); tg.push(g); parent = g; pp = tpt[i]; }); }
  const mid = mcpI.clone().add(mcpL).multiplyScalar(0.5);
  const handle = mid.clone().addScaledVector(fdir, 0.03).addScaledVector(n, 0.024).sub(EL);   // where a dumbbell's handle sits in a closed fist
  function curl(k) {
    joints.forEach((gs, i) => { const s = 1 + 0.06 * i; gs[0].quaternion.setFromAxisAngle(axis, 1.25 * k * s); gs[1].quaternion.setFromAxisAngle(axis, 1.5 * k * s); gs[2].quaternion.setFromAxisAngle(axis, 0.95 * k * s); });
    tg[0].quaternion.setFromAxisAngle(taxis, 0.55 * k); tg[1].quaternion.setFromAxisAngle(taxis, 0.7 * k);
  }
  return { curl, handle, across: across.clone(), n: n.clone(), fdir: fdir.clone(), eg };
}

// a 6 kg hex dumbbell: rubber heads, a knurled chrome handle; its axis along local x
function makeDumbbell() {
  const g = new THREE.Group(), rubber = phys({ color: 0x17181b, roughness: 0.62, clearcoat: 0.25, clearcoatRoughness: 0.5 });
  const chrome = phys({ color: 0xd0d3d8, metalness: 1, roughness: 0.24, clearcoat: 0.4 });
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.0145, 0.0145, 0.135, 32), chrome); handle.rotation.z = Math.PI / 2; g.add(handle);
  for (const s of [-1, 1]) {
    const head = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.052, 0.06, 6), rubber); head.rotation.z = Math.PI / 2; head.position.x = s * 0.0975; g.add(head);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.062, 24), chrome); cap.rotation.z = Math.PI / 2; cap.position.x = s * 0.0975; g.add(cap);
    const coll = new THREE.Mesh(new THREE.CylinderGeometry(0.021, 0.021, 0.008, 32), chrome); coll.rotation.z = Math.PI / 2; coll.position.x = s * 0.064; g.add(coll);
  }
  shadows(g); g.traverse((o) => o.layers.enable(1));
  return g;
}

// a pose for one arm, solved on the rig in the world: the handle at a point, the elbow near a point, the palm facing a way
function solveArm(A, hand, { at, elbowAt = null, palm = null, init, wE = 0.5, wP = 0.08 }) {
  const h = new THREE.Vector3(), e = new THREE.Vector3(), q = new THREE.Quaternion(), pn = new THREE.Vector3();
  const err = (p) => {
    poseArm(A, p); A.girdle.updateMatrixWorld(true);
    h.copy(hand.handle).applyMatrix4(A.elbow.matrixWorld); let E = h.distanceTo(at);
    if (elbowAt) { A.elbow.getWorldPosition(e); E += wE * e.distanceTo(elbowAt); }
    if (palm) { A.elbow.getWorldQuaternion(q); pn.copy(hand.n).applyQuaternion(q); E += wP * (1 - pn.dot(palm)); }
    A.elbow.getWorldPosition(e); E += 2 * Math.max(0, MAT_H + 0.03 - e.y) + 2 * Math.max(0, MAT_H + 0.03 - h.y);   // never through the mat
    return E;
  };
  let best = { dir: [...init.dir], twist: init.twist, elbow: init.elbow, retract: 0, elevate: 0 }, bestE = err(best);
  for (const st of [0.25, 0.12, 0.06, 0.03, 0.015, 0.007, 0.003]) for (let it = 0; it < 40; it++) {
    let improved = false;
    for (const key of ['d0', 'd1', 'd2', 'twist', 'elbow']) for (const sg of [-1, 1]) {
      const c = { ...best, dir: [...best.dir] };
      if (key[0] === 'd') c.dir[+key[1]] += sg * st; else c[key] += sg * st * 2;
      c.elbow = Math.min(2.6, Math.max(0, c.elbow));
      const E = err(c); if (E < bestE) { bestE = E; best = c; improved = true; }
    }
    if (!improved) break;
  }
  return { ...best, err: bestE };
}

// ------------------------------------------------------------------ the props
// the tape measure: a yellow tailor's tape once round the waist at the navel, over the fat, its free end overlapping the
// zero; it wraps itself on (uDraw) and the reading never moves
const TY = 1.072, TAPE_W = 0.02, LOGO_R = 0.072;
function tapeCanvas(len) {
  const c = document.createElement('canvas'); c.width = 4096; c.height = 96; const x = c.getContext('2d'), K = 4096 / len;
  x.fillStyle = '#ffd83d'; x.fillRect(0, 0, 4096, 96);
  x.fillStyle = '#1a1714'; x.textAlign = 'center'; x.textBaseline = 'middle';
  for (let cm = 0; cm <= len * 100; cm++) {
    const px = cm * 0.01 * K, big = cm % 10 === 0, mid = cm % 5 === 0;
    x.fillRect(px - 1.2, 0, 2.4, big ? 34 : mid ? 26 : 16); x.fillRect(px - 1.2, 96 - (big ? 34 : mid ? 26 : 16), 2.4, big ? 34 : mid ? 26 : 16);
    if (big && cm > 0) { x.font = '600 30px Archivo'; x.fillText(String(cm), px, 48); }
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
function buildTape(scene, R, rin, spineB) {
  const surf = (a) => rin(TY, a) + 0.0025 + fatT(TY, a) + 0.0014;
  const outR = (a) => { a = Math.atan2(Math.sin(a), Math.cos(a)); const A = Math.abs(a); if (A <= 2.1) return surf(a); return lerp(surf(Math.sign(a) * 2.1), 0.108, ss(2.1, Math.PI, A)); };
  const A0 = -0.3, span = 2 * Math.PI + 0.62, n = 480, P = [];
  let len = 0; const L = [0];
  for (let i = 0; i <= n; i++) {
    const a = A0 + (i / n) * span, lift = 0.0011 * ss(2 * Math.PI - 0.12, 2 * Math.PI, a - A0), r = outR(a) + lift;
    P.push(new THREE.Vector3(r * Math.sin(a), TY, FZC + r * Math.cos(a)));
    if (i) { len += P[i].distanceTo(P[i - 1]); L.push(len); }
  }
  const pos = [], uv = [], idx = [];
  for (let i = 0; i <= n; i++) for (const k of [0, 1]) { const p = P[i]; pos.push(p.x, TY + (k - 0.5) * TAPE_W, p.z); uv.push(L[i] / len, k); }
  for (let i = 0; i < n; i++) { const a = i * 2, b = a + 1, c = a + 2, d = a + 3; idx.push(a, c, b, b, c, d); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  orient(g, (p, nn) => nn.x * p.x + nn.z * (p.z - FZC));
  const mat = phys({ map: tapeCanvas(len), roughness: 0.5, clearcoat: 0.3, side: THREE.DoubleSide, transparent: true, opacity: 1, emissive: new THREE.Color(0xffd83d), emissiveIntensity: 0.12 });
  const U = { uDraw: { value: 0 } };
  mat.onBeforeCompile = (sh) => { sh.uniforms.uDraw = U.uDraw; sh.fragmentShader = 'uniform float uDraw;\n' + sh.fragmentShader.replace('void main() {', 'void main() {\nif (vMapUv.x > uDraw) discard;'); };
  mat.customProgramCacheKey = () => 'hfs-tape';
  const sk = skinned(g, spineB, R, mat); sk.mesh.castShadow = true; sk.mesh.receiveShadow = true; sk.mesh.visible = false; scene.add(sk.mesh);
  // the reading: an orange line on the outer layer, right over the tape's zero
  const rmat = new THREE.MeshBasicMaterial({ color: ORANGE.clone().multiplyScalar(1.5), transparent: true, opacity: 0, depthWrite: false });
  const r0 = outR(A0) + 0.0028, mk = new THREE.BoxGeometry(0.0016, TAPE_W * 1.5, 0.0006); mk.rotateY(A0); mk.translate(r0 * Math.sin(A0), TY, FZC + r0 * Math.cos(A0));
  const msk = skinned(mk.toNonIndexed ? mk : mk, spineB, R, rmat); msk.mesh.visible = false; scene.add(msk.mesh);
  return { sk, U, mat, len, mark: msk, rmat, at: new THREE.Vector3(r0 * Math.sin(A0), TY, FZC + r0 * Math.cos(A0)) };
}

// the target: an orange reticle that locks onto a spot of fat
function buildReticle(scene) {
  const g = new THREE.Group(), mat = new THREE.MeshBasicMaterial({ color: ORANGE.clone().multiplyScalar(1.7), transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, fog: false });
  const spin = new THREE.Group(); g.add(spin);
  for (let k = 0; k < 4; k++) { const arc = new THREE.Mesh(new THREE.RingGeometry(0.056, 0.0605, 48, 1, k * Math.PI / 2 + 0.22, Math.PI / 2 - 0.44), mat); spin.add(arc); }
  g.add(new THREE.Mesh(new THREE.RingGeometry(0.017, 0.0195, 64), mat));
  for (let k = 0; k < 4; k++) { const b = new THREE.Mesh(new THREE.PlaneGeometry(0.0032, 0.026), mat), a = k * Math.PI / 2; b.position.set(Math.sin(a) * 0.04, Math.cos(a) * 0.04, 0); b.rotation.z = -a; g.add(b); }
  g.add(new THREE.Mesh(new THREE.CircleGeometry(0.0035, 24), mat));
  g.renderOrder = 6; g.traverse((o) => { o.renderOrder = 6; }); g.visible = false; scene.add(g);
  return { g, spin, mat };
}

// a scan of the upper arm, as an MRI shows it (fat bright, muscle grey, the bone's cortex black, its marrow bright)
function mriCanvas(slice, mirror) {
  const c = document.createElement('canvas'); c.width = c.height = 512; const x = c.getContext('2d'), K = 512 / 0.125, cx = 256, cy = 256;
  x.fillStyle = '#000'; x.fillRect(0, 0, 512, 512);
  const ring = (rf) => { x.beginPath(); for (let i = 0; i <= 180; i++) { const a = (i / 180) * Math.PI * 2, r = rf(a) * K, px = cx + (mirror ? -1 : 1) * Math.sin(a) * r, py = cy - Math.cos(a) * r; if (i) x.lineTo(px, py); else x.moveTo(px, py); } x.closePath(); };
  x.filter = 'blur(1.4px)';
  ring((a) => slice.rin(a) + 0.002 + slice.t(a)); x.fillStyle = '#e6e2da'; x.fill();
  ring((a) => slice.rin(a) + 0.0005); x.fillStyle = '#575553'; x.fill();
  x.fillStyle = '#0a0a0a'; x.beginPath(); x.arc(cx, cy + 0.003 * K, 0.0118 * K, 0, Math.PI * 2); x.fill();
  x.fillStyle = '#b9b4ab'; x.beginPath(); x.arc(cx, cy + 0.003 * K, 0.0066 * K, 0, Math.PI * 2); x.fill();
  x.filter = 'none';
  const im = x.getImageData(0, 0, 512, 512); let sd = mirror ? 99 : 7;
  for (let i = 0; i < im.data.length; i += 4) { sd = (sd * 16807) % 2147483647; const nn = ((sd / 2147483647) - 0.5) * 22; for (let k = 0; k < 3; k++) im.data[i + k] = Math.max(0, Math.min(255, im.data[i + k] + nn)); }
  x.putImageData(im, 0, 0);
  // the fat's thickness, measured the same way on both: an orange caliper across the back of the arm
  const a = Math.PI, r0 = (slice.rin(a) + 0.002) * K, r1 = (slice.rin(a) + 0.002 + slice.t(a)) * K;
  x.strokeStyle = '#ff6a2b'; x.lineWidth = 5; x.beginPath(); x.moveTo(cx, cy + r0); x.lineTo(cx, cy + r1); x.stroke();
  for (const r of [r0, r1]) { x.beginPath(); x.moveTo(cx - 16, cy + r); x.lineTo(cx + 16, cy + r); x.stroke(); }
  x.globalCompositeOperation = 'destination-in'; x.beginPath(); x.arc(cx, cy, 252, 0, Math.PI * 2); x.fill(); x.globalCompositeOperation = 'source-over';
  x.strokeStyle = 'rgba(236,238,241,0.55)'; x.lineWidth = 4; x.beginPath(); x.arc(cx, cy, 250, 0, Math.PI * 2); x.stroke();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function buildScans(scene, R) {
  const out = {};
  for (const Side of ['Right', 'Left']) {
    const A = R.arms[Side], ax = A.EL.clone().sub(A.SH);
    // the scanner's slice: a thin ring of light that runs down the upper arm
    const rm = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xbfd6ff).multiplyScalar(1.6), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, fog: false });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.062, 0.0014, 8, 128), rm); ring.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), ax.clone().normalize()); ring.visible = false; A.arm.add(ring);
    const disc = new THREE.Mesh(new THREE.CircleGeometry(0.062, 96), new THREE.MeshBasicMaterial({ color: new THREE.Color(0x9fc0ff), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false }));
    disc.quaternion.copy(ring.quaternion); disc.visible = false; A.arm.add(disc);
    // the image: a panel that rises out of the slice and turns to the camera
    const sl = W.armFat[Side].slice, tex = mriCanvas(sl, Side === 'Right');
    const pm = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0, depthWrite: false, fog: false, toneMapped: false });
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(0.17, 0.17), pm); panel.visible = false; panel.renderOrder = 7; scene.add(panel);
    out[Side] = { A, ax, ring, rm, disc, panel, pm };
  }
  return out;
}

// the gag: a glossy box for an ab gadget, propped on the floor. Its claim has an asterisk; the footnote is the joke.
function boxCanvas() {
  const c = document.createElement('canvas'); c.width = 880; c.height = 1200; const x = c.getContext('2d');
  const bg = x.createLinearGradient(0, 0, 0, 1200); bg.addColorStop(0, '#ffd21a'); bg.addColorStop(1, '#ffb800'); x.fillStyle = bg; x.fillRect(0, 0, 880, 1200);
  x.fillStyle = '#d6191f'; x.fillRect(0, 0, 880, 150); x.fillRect(0, 1105, 880, 95);
  x.fillStyle = '#fff'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = '800 92px Archivo'; x.letterSpacing = '6px'; x.fillText('AB TONER', 440, 80);
  // the starburst
  x.save(); x.translate(735, 245); x.rotate(-0.25); x.fillStyle = '#d6191f'; x.beginPath();
  for (let i = 0; i < 28; i++) { const a = (i / 28) * Math.PI * 2, r = i % 2 ? 78 : 104; x.lineTo(Math.cos(a) * r, Math.sin(a) * r); } x.closePath(); x.fill();
  x.fillStyle = '#fff'; x.font = '800 54px Archivo'; x.letterSpacing = '2px'; x.fillText('NEW!', 0, 4); x.restore();
  // the target
  x.save(); x.translate(440, 430); x.strokeStyle = '#d6191f'; x.lineWidth = 22;
  for (let k = 0; k < 4; k++) { x.beginPath(); x.arc(0, 0, 150, k * Math.PI / 2 + 0.25, (k + 1) * Math.PI / 2 - 0.25); x.stroke(); }
  x.beginPath(); x.arc(0, 0, 54, 0, Math.PI * 2); x.stroke(); x.fillStyle = '#d6191f'; x.beginPath(); x.arc(0, 0, 14, 0, Math.PI * 2); x.fill();
  for (let k = 0; k < 4; k++) { x.save(); x.rotate(k * Math.PI / 2); x.fillRect(-10, -128, 20, 56); x.restore(); }
  x.restore();
  x.fillStyle = '#111'; x.font = '900 118px Archivo'; x.letterSpacing = '-2px'; x.fillText('TARGETS', 440, 715); x.fillText('BELLY FAT*', 440, 840);
  x.font = '600 44px Archivo'; x.letterSpacing = '1px'; x.fillStyle = '#3a2a00'; x.fillText('Just strap it on and relax', 440, 950);
  x.fillStyle = '#fff'; x.font = '700 40px Archivo'; x.letterSpacing = '3px'; x.fillText('AS SEEN ON SCREENS', 440, 1152);
  x.fillStyle = '#3a2a00'; x.font = '600 36px Archivo'; x.letterSpacing = '0.5px'; x.textAlign = 'left'; x.fillText('*Misses.', 60, 1046);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
function buildBox(scene) {
  const side = phys({ color: 0xd6191f, roughness: 0.32, clearcoat: 0.8, clearcoatRoughness: 0.15 }), top = phys({ color: 0xffc800, roughness: 0.32, clearcoat: 0.8, clearcoatRoughness: 0.15 });
  const front = phys({ map: boxCanvas(), roughness: 0.3, clearcoat: 0.9, clearcoatRoughness: 0.12 });
  const box = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.3, 0.075), [side, side, top, top, front, side]);
  box.castShadow = true; box.receiveShadow = true; box.layers.enable(1); scene.add(box);
  return box;
}

// three dials beside the mat: the settings. The last one's face turns into the logo at the end.
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
    out.push({ g, knob, set, setMat, face, angle: (v) => -Math.PI * 0.75 + v * Math.PI * 1.5 });
  }
  return out;
}

// the belly wall in section, as an ultrasound shows it: fat over muscle. The muscle thickens and lights with each crunch;
// the fat band above it does not change (the caliper on it never moves)
function sectionDraw(c, k, glow) {
  const x = c.getContext('2d'), Wd = c.width, H = c.height;
  x.clearRect(0, 0, Wd, H);
  x.fillStyle = 'rgba(10,11,13,0.92)'; x.beginPath(); x.roundRect(4, 4, Wd - 8, H - 8, 28); x.fill();
  x.strokeStyle = 'rgba(236,238,241,0.35)'; x.lineWidth = 3; x.stroke();
  x.save(); x.beginPath(); x.roundRect(4, 4, Wd - 8, H - 8, 28); x.clip();
  const top = 70, fat = 150, mus = 74 + 26 * k, L = 150, R = Wd - 40;
  // fat: soft golden lobules
  x.fillStyle = '#e8bd52'; x.fillRect(L, top, R - L, fat);
  for (let i = 0; i < 70; i++) { const px = L + ((i * 97.3) % (R - L)), py = top + 12 + ((i * 53.7) % (fat - 24)), r = 13 + ((i * 7.1) % 9); x.fillStyle = 'rgba(255,236,170,0.28)'; x.beginPath(); x.arc(px, py, r, 0, Math.PI * 2); x.fill(); x.strokeStyle = 'rgba(150,100,20,0.35)'; x.lineWidth = 1.5; x.stroke(); }
  // muscle: red with its fibres, brighter as it contracts
  const my = top + fat + 6; x.fillStyle = `rgb(${Math.round(150 + 90 * glow)},${Math.round(52 + 40 * glow)},${Math.round(44 + 10 * glow)})`; x.fillRect(L, my, R - L, mus);
  x.strokeStyle = 'rgba(255,200,180,0.25)'; x.lineWidth = 2; for (let yy = my + 8; yy < my + mus - 4; yy += 9) { x.beginPath(); x.moveTo(L, yy); x.lineTo(R, yy + 3); x.stroke(); }
  x.restore();
  // labels and the caliper on the fat (it never moves)
  x.fillStyle = '#c3c6cc'; x.font = '500 30px "Geist Mono"'; x.textAlign = 'left'; x.textBaseline = 'middle'; x.letterSpacing = '4px';
  x.fillText('FAT', 34, top + fat / 2); x.fillText('MUSCLE', 34, my + mus / 2);
  x.strokeStyle = '#ff6a2b'; x.lineWidth = 6; const cx = R - 70; x.beginPath(); x.moveTo(cx, top + 4); x.lineTo(cx, top + fat - 4); x.stroke();
  for (const yy of [top + 4, top + fat - 4]) { x.beginPath(); x.moveTo(cx - 18, yy); x.lineTo(cx + 18, yy); x.stroke(); }
}
function buildSection(scene) {
  const c = document.createElement('canvas'); c.width = 720; c.height = 380; sectionDraw(c, 0, 0);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0, depthWrite: false, fog: false, toneMapped: false });
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(0.26, 0.26 * 380 / 720), mat); panel.visible = false; panel.renderOrder = 7; scene.add(panel);
  return { panel, mat, c, tex, key: '' };
}

// visceral fat: lobulated golden lumps among the loops of gut (in the mesentery) and over them (the omentum)
function lumpGeo() {
  const g = new THREE.IcosahedronGeometry(1, 3), P = g.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < P.count; i++) { v.fromBufferAttribute(P, i); const n = 1 + 0.1 * Math.sin(v.x * 5.1 + 1.3) * Math.sin(v.y * 4.7 + 0.4) * Math.sin(v.z * 5.3 + 2.2) + 0.03 * Math.sin(v.x * 11 + v.y * 9); v.multiplyScalar(n); P.setXYZ(i, v.x, v.y, v.z); }
  g.computeVertexNormals(); return g;
}

// stored fat, burned: motes of gold leave the fat and travel into the body, flaring as they reach the muscles
function buildMotes(scene, N) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3)); g.setAttribute('aEnd', new THREE.BufferAttribute(new Float32Array(N * 3), 3));
  g.setAttribute('aMid', new THREE.BufferAttribute(new Float32Array(N * 3), 3)); g.setAttribute('aPh', new THREE.BufferAttribute(new Float32Array(N), 1)); g.setAttribute('aSize', new THREE.BufferAttribute(new Float32Array(N), 1));
  const m = new THREE.ShaderMaterial({
    uniforms: { uT: { value: 0 }, uScale: { value: 1 }, uGold: { value: new THREE.Color(0xffd27a).multiplyScalar(1.5) }, uFire: { value: ORANGE.clone().multiplyScalar(2.2) } },
    vertexShader: `attribute vec3 aEnd; attribute vec3 aMid; attribute float aPh; attribute float aSize; uniform float uT, uScale; varying float vA; varying float vF;
      void main(){ float k = clamp((uT - aPh) / 1.3, 0.0, 1.0); float e = k * k * (3.0 - 2.0 * k);
        vec3 p = mix(mix(position, aMid, e), mix(aMid, aEnd, e), e);
        vA = smoothstep(0.0, 0.12, k) * (1.0 - smoothstep(0.86, 1.0, k)); vF = smoothstep(0.72, 0.95, k);
        vec4 mv = modelViewMatrix * vec4(p, 1.0); gl_PointSize = aSize * uScale * (1.0 + 1.6 * vF * (1.0 - smoothstep(0.95, 1.0, k))) / -mv.z; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform vec3 uGold, uFire; varying float vA; varying float vF; void main(){ vec2 d = gl_PointCoord - 0.5; float a = smoothstep(0.5, 0.05, length(d)); gl_FragColor = vec4(mix(uGold, uFire, vF), a * a * vA); }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const pts = new THREE.Points(g, m); pts.frustumCulled = false; pts.visible = false; scene.add(pts);
  return { pts, m, g };
}

async function build(S, cfg) {
  const scene = S.scene;
  W.skins = []; W.muscleMats = [];
  S.fog.near = 4; S.fog.far = 14;
  S.table.scale.set(3, 3, 1); S.tableMat.clearcoat = 0.06; S.tableMat.specularIntensity = 0.3;
  for (const m of [S.tableMat.map, S.tableMat.roughnessMap]) if (m) { m.wrapS = m.wrapT = THREE.RepeatWrapping; m.repeat.multiplyScalar(3); }
  // ---- the mat
  { const w = 0.61, l = 1.83, r = 0.03, sh = new THREE.Shape();
    sh.moveTo(-w / 2 + r, -l / 2); sh.lineTo(w / 2 - r, -l / 2); sh.quadraticCurveTo(w / 2, -l / 2, w / 2, -l / 2 + r); sh.lineTo(w / 2, l / 2 - r); sh.quadraticCurveTo(w / 2, l / 2, w / 2 - r, l / 2);
    sh.lineTo(-w / 2 + r, l / 2); sh.quadraticCurveTo(-w / 2, l / 2, -w / 2, l / 2 - r); sh.lineTo(-w / 2, -l / 2 + r); sh.quadraticCurveTo(-w / 2, -l / 2, -w / 2 + r, -l / 2);
    const g = new THREE.ExtrudeGeometry(sh, { depth: MAT_H, bevelEnabled: true, bevelThickness: 0.0012, bevelSize: 0.0012, bevelSegments: 2, curveSegments: 12 });
    g.rotateX(Math.PI / 2); g.translate(0, MAT_H, 0);
    const tex = noiseTex(11, 512, 0.82, 1.0, 40);
    W.matMat = phys({ color: 0x23272d, roughness: 0.9, roughnessMap: tex, bumpMap: tex, bumpScale: 0.6, clearcoat: 0.0, sheen: 0.3, sheenColor: new THREE.Color(0x6a7280) });
    W.mat = new THREE.Mesh(g, W.matMat); W.mat.position.z = -0.13; W.mat.receiveShadow = true; W.mat.layers.enable(1); scene.add(W.mat); }
  // ---- the skeleton, lying on its back on the mat, head toward -z
  const meshes = await loadAnatomy(skeletonKind());
  W.rig = buildRig(meshes); scene.add(W.rig.root);
  for (const m of meshes) { m.castShadow = true; m.receiveShadow = true; m.layers.enable(1); }
  W.meshes = meshes;
  const R = W.rig;
  W.pelvisRest = new THREE.Vector3(R.P0.x, MAT_H + (R.P0.z - BACK) + 0.001, 0);
  W.qSupine = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2);
  // ---- hands behind the head, elbows wide (the classic crunch): solved once on the standing rig, a hand on each side
  //      of the back of the skull; during the crunch the arms ride with the upper back
  W.behind = {};
  for (const Side of ['Right', 'Left']) {
    const A = R.arms[Side], tgt = new THREE.Vector3(0.035 * A.s, 1.705, -0.15), hand = new THREE.Vector3();
    let best = { dir: [0.9, 0.45, -0.15], twist: 0.6, elbow: 2.2 }, bestE = 9;
    const err = (p) => { poseArm(A, p); A.girdle.updateMatrixWorld(true); A.mc.getWorldPosition(hand); const e = hand.distanceTo(tgt); const el = new THREE.Vector3(); A.elbow.getWorldPosition(el); return e + 0.25 * Math.max(0, 0.36 - Math.abs(el.x)) + 0.4 * Math.max(0, el.z - 0.05); };
    bestE = err(best);
    const steps = [0.2, 0.1, 0.05, 0.02, 0.01, 0.005];
    for (const h of steps) for (let it = 0; it < 30; it++) {
      let improved = false;
      for (const key of ['d0', 'd1', 'd2', 'twist', 'elbow']) for (const sg of [-1, 1]) {
        const c = { dir: [...best.dir], twist: best.twist, elbow: best.elbow };
        if (key[0] === 'd') c.dir[+key[1]] += sg * h; else c[key] += sg * h * (key === 'elbow' ? 1.5 : 2);
        c.elbow = Math.min(2.5, Math.max(0.3, c.elbow));
        const e = err(c); if (e < bestE) { bestE = e; best = c; improved = true; }
      }
      if (!improved) break;
    }
    W.behind[Side] = { ...best, retract: 0, elevate: 0, err: bestE };
    poseArm(A, ARM0);
  }
  // ---- hands that close, two dumbbells, and the arm's other poses, solved in the world with the body lying at rest
  W.hand = { Right: rigHand(R, 'Right'), Left: rigHand(R, 'Left') };
  R.pelvis.position.copy(W.pelvisRest); R.pelvis.quaternion.copy(W.qSupine); bendSpine(R.seg, { cer: 0.26 }); R.root.updateMatrixWorld(true);
  W.pose = {};
  for (const Side of ['Right', 'Left']) {
    const A = R.arms[Side], H = W.hand[Side], s = A.s;
    // at rest: the arm along the body, palm up. The press: the elbow on the mat out at 45 degrees and the forearm upright,
    // then the arm straight up. The dumbbell appears in the fist when a press begins and goes when the arm is back down
    const lo = solveArm(A, H, { at: new THREE.Vector3(s * 0.4, MAT_H + 0.335, -0.36), elbowAt: new THREE.Vector3(s * 0.4, MAT_H + 0.036, -0.37), palm: new THREE.Vector3(0, 0, -1), wP: 0.03, init: { dir: [0.75, -0.6, -0.15], twist: 0, elbow: 1.5 } });
    const hi = solveArm(A, H, { at: new THREE.Vector3(s * 0.21, 0.69, -0.47), elbowAt: new THREE.Vector3(s * 0.19, 0.39, -0.5), wE: 0.3, palm: new THREE.Vector3(0, 0, -1), wP: 0.03, init: { dir: [0.1, -0.2, 1], twist: 0, elbow: 0.1 } });
    const floor = solveArm(A, H, { at: new THREE.Vector3(s * 0.32, MAT_H + 0.077, 0.09), elbowAt: new THREE.Vector3(s * 0.25, MAT_H + 0.036, -0.265), palm: new THREE.Vector3(0, 1, 0), init: { dir: [0.25, -1, -0.2], twist: 0, elbow: 0.2 } });
    W.pose[Side] = { floor, lo, hi };
    const db = makeDumbbell(); db.matrixAutoUpdate = false; db.visible = false; scene.add(db);
    db.userData.hm = new THREE.Matrix4().compose(H.handle, new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1, 0, 0), H.across), new THREE.Vector3(1, 1, 1));
    db.userData.mats = []; db.traverse((o) => { if (o.isMesh && !db.userData.mats.includes(o.material)) { o.material.transparent = true; db.userData.mats.push(o.material); } });
    H.db = db;
  }
  // ---- the arms' muscles (they appear for the one-arm study): biceps, brachialis, triceps, coracobrachialis, deltoid and
  //      pectoralis major from the atlas, skinned to the shoulder girdle, the upper arm and the forearm
  const armSoft = await loadAnatomy((p) => (/(biceps brachii|brachialis|triceps brachii|coracobrachialis|deltoid)/i.test(p.name) && /\b(right|left)\b/i.test(p.name) ? 'muscle' : null));
  W.armMat = muscleMat({ transparent: true, opacity: 0 }); W.armMeshes = [];
  const sideOf = (n) => (/\bright\b/i.test(n) ? 'Right' : 'Left');
  for (const m of armSoft) {
    const Side = sideOf(m.userData.name), A = R.arms[Side], n = m.userData.name;
    let bind;
    if (/pectoralis/i.test(n)) { const org = /clavicular/i.test(n) ? A.girdle : R.seg['Seventh thoracic vertebra'].g; bind = (p) => [org, A.arm, ss(0.1, 0.165, Math.abs(p.x))]; }
    else bind = armBinder(R, Side);
    const sk = skinned(restGeo(m), bind, R, W.armMat); sk.mesh.castShadow = sk.mesh.receiveShadow = true; sk.mesh.layers.enable(1); sk.mesh.visible = false; scene.add(sk.mesh);
    W.skins.push(sk); W.armMeshes.push(sk.mesh); sk.side = Side;
  }
  // ---- the fat around each upper arm: a sleeve just outside the muscles, thicker at the back of the arm
  W.lobArm = lobuleTex(7, 512, 9); W.lobArm.repeat.set(7, 4); W.armFatMat = fatMat(W.lobArm, { opacity: 0, vertexColors: true }); W.armFat = {};
  for (const Side of ['Right', 'Left']) {
    const A = R.arms[Side], pts = armSoft.filter((m) => sideOf(m.userData.name) === Side && !/pectoralis/i.test(m.userData.name)).flatMap((m) => worldVerts(m, 1));
    const geo = (k) => sleeveGeo(pts, A.SH, A.EL, k);
    const g0 = geo(1), g1 = geo(0.02);
    const sk = skinned(g0, armBinder(R, Side), R, W.armFatMat, { morph: g1 }); sk.mesh.renderOrder = 3; sk.mesh.visible = false; scene.add(sk.mesh);
    W.armFat[Side] = sk; W.armFat[Side].slice = g0.userData.slice;
  }
  // ---- the soft parts: the external obliques (atlas), skinned to the spine
  const soft = await loadAnatomy((p) => (/^(right|left) external oblique$/i.test(p.name) ? 'muscle' : null));
  const spineB = spineBinder(R);
  const obl = soft.filter((m) => /external oblique/i.test(m.userData.name));
  const oblPts = obl.flatMap((m) => worldVerts(m, 1));
  const ribPts = meshes.filter((m) => /rib$|costal cartilage|sternum|xiphoid|manubrium/i.test(m.userData.name)).flatMap((m) => worldVerts(m, 1));
  const zo = frontField([oblPts], { x0: -0.13, x1: 0.13, y0: 0.88, y1: 1.38, step: 0.005, smooth: 2 });
  const zr = frontField([ribPts], { x0: -0.13, x1: 0.13, y0: 1.1, y1: 1.42, step: 0.005, smooth: 1 });
  const zf = (x, y) => (y > 1.2 ? Math.max(zo(x, y), lerp(-1, zr(x, y) + 0.004, ss(1.2, 1.24, y))) : zo(x, y));   // over the ribcage, never inside it
  W.zf = zf;
  for (const m of obl) {
    const g = restGeo(m), P = g.attributes.position, apo = new Float32Array(P.count);
    for (let i = 0; i < P.count; i++) { const x = P.getX(i), y = P.getY(i), z = P.getZ(i); apo[i] = Math.min(RW(Math.min(RY1, Math.max(RY0, y))) * (0.55 + 0.45 * Math.sqrt(ss(RY0 - 0.01, RY0 + 0.05, y))) - 0.007 - Math.abs(x), z - (zf(x, y) - 0.03), RY1 + 0.01 - y) * 100; }
    g.setAttribute('apo', new THREE.BufferAttribute(apo, 1));
    const mat = muscleMat(); W.muscleMats.push(mat);
    mat.onBeforeCompile = (sh) => {
      sh.vertexShader = 'attribute float apo;\nvarying float vApo;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvApo = apo;');
      sh.fragmentShader = 'varying float vApo;\n' + sh.fragmentShader.replace('void main() {', 'void main() {\nif (vApo > 0.0) discard;');
    };
    mat.customProgramCacheKey = () => 'hfs-apo';
    const sk = skinned(g, spineB, R, mat); sk.mesh.castShadow = sk.mesh.receiveShadow = true; sk.mesh.layers.enable(1); scene.add(sk.mesh); W.skins.push(sk);
  }
  // ---- the rectus abdominis, both sides, as closed lenses (front and back surfaces); "def" morphs in the six-pack
  W.rectusMat = muscleMat(); W.muscleMats.push(W.rectusMat);
  const rectusFront = [];
  for (const s of [-1, 1]) for (const face of ['front', 'back']) {
    const f = (def) => (u, v) => { const y = lerp(rTop(u), RY0, v), x = s * lerp(RX0, RW(y) * (0.55 + 0.45 * Math.sqrt(ss(RY0 - 0.01, RY0 + 0.05, y))), u), b = rectusBulge(u, y, def), z0 = zf(x, y); return [x, y, face === 'front' ? z0 + b.front : z0 + b.back]; };
    const g0 = orient(gridGeo(f(0), 18, 96), (p, n) => (face === 'front' ? n.z : -n.z)), g1 = orient(gridGeo(f(1), 18, 96), (p, n) => (face === 'front' ? n.z : -n.z));
    if (face === 'front') { const P = g1.attributes.position; for (let i = 0; i < P.count; i += 2) rectusFront.push(new THREE.Vector3().fromBufferAttribute(P, i)); }
    const sk = skinned(g0, spineB, R, W.rectusMat, { morph: g1 }); sk.mesh.castShadow = sk.mesh.receiveShadow = true; sk.mesh.layers.enable(1); scene.add(sk.mesh); W.skins.push(sk); sk.rectus = true;
  }
  // the linea alba between them: a pale band of tendon
  { const g = orient(gridGeo((u, v) => { const y = lerp(1.3, RY0, v), x = lerp(-RX0 - 0.0012, RX0 + 0.0012, u); return [x, y, zf(x, y) - 0.0005]; }, 2, 60), (p, n) => n.z);
    const mat = tissueMat('cartilage', { color: new THREE.Color(0x5e534c), roughness: 0.7, sheen: 0 });
    const sk = skinned(g, spineB, R, mat); sk.mesh.receiveShadow = true; scene.add(sk.mesh); W.skins.push(sk); }
  // ---- the fat over the belly: its inner face just outside the muscle, its outer face thickest low on the front
  const rin = radialField([oblPts, rectusFront, ribPts.filter((v) => v.y > 1.15)], { y0: FY0 - 0.02, y1: FY1 + 0.02, zc: FZC, ny: 70, na: 140, amax: Math.PI, smooth: 2 });
  W.rin = rin;
  W.lob = lobuleTex(5, 512, 9); W.lob.repeat.set(11, 6);
  W.fatMat = fatMat(W.lob); W.fatMat.side = THREE.FrontSide;
  const shell = (k) => (u, v) => { const a = lerp(-FA, FA, u), y = lerp(FY1, FY0, v), r = rin(y, a) + 0.0025 + fatT(y, a) * k; return [r * Math.sin(a), y, FZC + r * Math.cos(a)]; };
  const outward = (p, n) => n.x * p.x + n.z * (p.z - FZC);
  const g0 = orient(gridGeo(shell(1), 110, 72), outward), g1 = orient(gridGeo(shell(0.02), 110, 72), outward);
  alphaFrom(g0, (u, v) => ss(0.0004, 0.004, fatT(lerp(FY1, FY0, v), lerp(-FA, FA, u)))); W.fatMat.vertexColors = true;
  W.shellUV = (a, y) => { const u = (a + FA) / (2 * FA), v = (FY1 - y) / (FY1 - FY0); return Math.round(v * 72) * 111 + Math.round(u * 110); };   // the grid vertex nearest a point
  W.fat = skinned(g0, spineB, R, W.fatMat, { morph: g1 }); W.fat.mesh.renderOrder = 3; W.fat.mesh.castShadow = false; W.fat.mesh.receiveShadow = true; scene.add(W.fat.mesh);
  // ---- the factory stamp: printed down the front of the breastbone, in every shot of the chest
  { const st = R.byName.get('Body of sternum');
    W.stampSpot = stampLine(st, { a: [0, 0.042, 0.08], b: [0, -0.045, 0.08], dir: [0, 0, -1], top: [0, 1, 0] });
    if (W.stampSpot) W.stamp = stamp(st, { canvas: labelCanvas('HUMAN FACTORY SETTINGS'), center: W.stampSpot.center, normal: W.stampSpot.normal, up: W.stampSpot.up, width: 0.086, depth: 0.03, opacity: 0.62 }); }
  // ---- the props
  W.tape = buildTape(scene, R, rin, spineB);
  W.ret = buildReticle(scene);
  W.sec = null;
  W.scans = buildScans(scene, R);
  W.box = buildBox(scene); W.box.position.set(-0.06, 0.15, -1.3); W.box.rotation.y = 0.12;
  W.dials = buildDials(scene); W.dials.forEach((d, i) => { d.g.position.set(-0.36 + i * 0.36, 0, 1.0); });
  W.logoRing = makeLogoRing(LOGO_R); W.logoRing.g.rotation.x = -Math.PI / 2; W.logoRing.g.position.y = 0.0665 + 0.0012; W.dials[2].g.add(W.logoRing.g);
  // ---- the gut, and the deep (visceral) fat among it; they ride with the third lumbar vertebra and show only for the dive
  const L3 = R.seg['Third lumbar vertebra'];
  const gut = await loadAnatomy((p) => (/^(stomach|duodenum|transverse colon|ascending colon|descending colon|sigmoid colon|caecum|cecum|appendix)$|jejunum|ileum/i.test(p.name) ? (/colon|caecum|cecum|appendix/i.test(p.name) ? 'colon' : /stomach/i.test(p.name) ? 'stomach' : 'gut') : null));
  W.gut = gut; W.gutMats = [];
  const gutPts = [];
  for (const m of gut) { if (/jejunum|ileum|colon/i.test(m.userData.name)) gutPts.push(...worldVerts(m, 3)); m.position.copy(m.userData.home).sub(L3.pivot); L3.g.add(m); m.visible = false; m.castShadow = false; m.receiveShadow = true; m.material.transparent = true; m.material.opacity = 0; W.gutMats.push(m.material); }
  { const C = avgV(gutPts.map((v) => v.clone())), N = 64, lg = lumpGeo();
    W.lumpMat = fatMat(null, { opacity: 0, map: null, bumpMap: null, transparent: true, depthWrite: true, color: new THREE.Color(0xf2d27a), roughness: 0.3, clearcoat: 0.8 });
    const im = new THREE.InstancedMesh(lg, W.lumpMat, N), M = new THREE.Matrix4(), Q = new THREE.Quaternion(), V = new THREE.Vector3();
    W.lumps = []; let sd = 4242; const rnd = () => ((sd = (sd * 16807) % 2147483647) / 2147483647);
    const front = gutPts.filter((v) => v.z > C.z + 0.025);
    for (let i = 0; i < N; i++) {
      const om = i < 28, src = om ? front : gutPts, v = src[Math.floor(rnd() * src.length)].clone(), d = v.clone().sub(C); d.y *= 0.4; d.normalize();
      const r = om ? 0.014 + rnd() * 0.01 : 0.008 + rnd() * 0.008, c = v.addScaledVector(d, r * 0.55); if (om) c.z += 0.006;
      W.lumps.push({ c: c.sub(L3.pivot), r, q: Q.clone().setFromEuler(new THREE.Euler(rnd() * 6, rnd() * 6, rnd() * 6)), s: new THREE.Vector3(1, om ? 0.65 : 0.85, 1).multiplyScalar(r) });
    }
    W.lumpIM = im; im.visible = false; im.castShadow = false; im.receiveShadow = true; L3.g.add(im);
  }
  // ---- motes for the fat being burned: from the fat's surfaces to the muscles, sampled with the body as it lies then
  W.motes = buildMotes(scene, 1100);
  // ---- light
  W.key = spot(scene, { color: 0xffe9d2, pos: new THREE.Vector3(-1.2, 2.6, 0.6), target: new THREE.Vector3(0, 0.1, -0.2), angle: 0.55, penumbra: 0.85, shadow: true, size: cfg.shadow ?? 1024 });
  W.key.shadow.camera.far = 6;
  W.rim = spot(scene, { color: 0xa9c4ff, pos: new THREE.Vector3(1.6, 1.4, -1.6), target: new THREE.Vector3(0, 0.1, -0.2), angle: 0.6, penumbra: 0.9 });
  W.fill = spot(scene, { color: 0xc8d6ff, pos: new THREE.Vector3(-1.8, 0.5, 1.2), target: new THREE.Vector3(0, 0.1, -0.1), angle: 0.7, penumbra: 1 });
  W.boxLight = spot(scene, { color: 0xfff1d8, pos: new THREE.Vector3(0.1, 1.3, -0.62), target: W.box.position.clone(), angle: 0.19, penumbra: 0.35 });
  W.dialLight = spot(scene, { color: 0xffe9d2, pos: new THREE.Vector3(0.2, 1.7, 1.6), target: new THREE.Vector3(0, 0, 1.0), angle: 0.45, penumbra: 0.8 });
  { // sample the motes' paths on the body as it lies at that moment
    update(S, 55.6, true);
    const N = 1100, P = W.motes.g.attributes, fatP = W.fat.geo.attributes.position.array, fatA = W.fat.geo.attributes.color.array;
    const armP = [W.armFat.Left.geo.attributes.position.array, W.armFat.Right.geo.attributes.position.array];
    const musc = W.skins.filter((k) => k.rectus || k.side).map((k) => k.geo.attributes.position.array);
    let sd = 777; const rnd = () => ((sd = (sd * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < N; i++) {
      let sx, sy, sz;
      if (i < 760) { let j; do { j = Math.floor(rnd() * (fatP.length / 3)); } while (fatA[j * 4 + 3] < 0.6); sx = fatP[j * 3]; sy = fatP[j * 3 + 1]; sz = fatP[j * 3 + 2]; }
      else { const A = armP[i % 2], j = Math.floor(rnd() * (A.length / 3)); sx = A[j * 3]; sy = A[j * 3 + 1]; sz = A[j * 3 + 2]; }
      const Mm = musc[Math.floor(rnd() * musc.length)], k = Math.floor(rnd() * (Mm.length / 3));
      const ex = Mm[k * 3], ey = Mm[k * 3 + 1], ez = Mm[k * 3 + 2];
      P.position.setXYZ(i, sx, sy, sz); P.aEnd.setXYZ(i, ex, ey, ez);
      P.aMid.setXYZ(i, (sx + ex) * 0.5 * 0.4, Math.min(sy, ey) + 0.02 + rnd() * 0.04, (sz + ez) * 0.5);
      P.aPh.setX(i, T.burns + 0.15 + rnd() * 1.9); P.aSize.setX(i, 14 + rnd() * 18);
    }
    for (const k in P) P[k].needsUpdate = true;
  }
  return { pelvis: W.pelvisRest.toArray(), behind: W.behind, stamp: W.stampSpot };
}

// ------------------------------------------------------------------ the crunch: a rep is up, a short hold, down, a breath on the floor
// reps per second follow a rate curve (steady, then fast through the six weeks, then still); its integral is the rep count
const RATE = [[0, 0.62], [12.6, 0.62], [13.6, 2.2], [15.6, 2.2], [16.6, 0.62], [17.2, 0.62], [17.9, 0]];
function rateAt(t) { let i = 0; while (i < RATE.length - 2 && RATE[i + 1][0] <= t) i++; const [a, x] = RATE[i], [b, y] = RATE[i + 1]; return lerp(x, y, s5(a, b, t)); }
const REPS = (() => { const dt = 0.005, n = Math.ceil(T.end / dt) + 2, a = new Float32Array(n); let s = 0.22; for (let i = 0; i < n; i++) { a[i] = s; s += rateAt(i * dt) * dt; } return { a, dt }; })();
const repsAt = (t) => { const i = Math.max(0, Math.min(REPS.a.length - 2, Math.floor(t / REPS.dt))), f = t / REPS.dt - i; return lerp(REPS.a[i], REPS.a[i + 1], f); };
function crunchAt(t) {   // 0 = lying, 1 = top of the crunch
  const ph = repsAt(t) % 1;
  if (ph < 0.36) return s5(0, 0.36, ph);
  if (ph < 0.48) return 1;
  if (ph < 0.86) return 1 - s5(0.48, 0.86, ph);
  return 0;
}

// ------------------------------------------------------------------ the arms: behind the head for the crunches, down to the mat, then the presses
const ARMT = { down0: 17.45, down1: 18.55, grabL: 27.15, liftL: 27.35, repsL0: 27.95, repsL1: 30.55, putL: 31.3, grabR: 40.55, lift2: 40.75, reps20: 41.3, reps21: 46.15, put2: 46.95 };
const mixArm = (a, b, k) => ({ dir: a.dir.map((v, i) => lerp(v, b.dir[i], k)), twist: lerp(a.twist, b.twist, k), elbow: lerp(a.elbow, b.elbow, k), retract: 0, elevate: 0 });
// press reps: the dumbbell goes up and comes back; the rate speeds up through the twelve weeks (left arm alone)
const RATE_L = [[ARMT.repsL0, 0.9], [28.6, 0.9], [29.4, 2.6], [30.0, 2.6], [ARMT.repsL1, 1.2]];
const rateL = (t) => { let i = 0; while (i < RATE_L.length - 2 && RATE_L[i + 1][0] <= t) i++; const [a, x] = RATE_L[i], [b, y] = RATE_L[i + 1]; return lerp(x, y, s5(a, b, t)); };
const PRESS_L = (() => { const dt = 0.005, t0 = ARMT.repsL0, n = Math.ceil((ARMT.repsL1 - t0) / dt) + 2, a = new Float32Array(n); let s = 0; for (let i = 0; i < n; i++) { a[i] = s; s += rateL(t0 + i * dt) * dt; } return { a, dt, t0 }; })();
function pressPh(t, which) {   // 0 = bottom, 1 = top of the press
  let reps;
  if (which === 'L') { const i = Math.max(0, Math.min(PRESS_L.a.length - 2, Math.floor((t - PRESS_L.t0) / PRESS_L.dt))); reps = PRESS_L.a[i]; const total = PRESS_L.a[PRESS_L.a.length - 1]; reps = Math.min(reps, Math.floor(total)); }
  else reps = Math.min((t - ARMT.reps20) * 0.62, 3);
  const ph = reps % 1; return ph < 0.45 ? s5(0, 0.45, ph) : ph < 0.55 ? 1 : 1 - s5(0.55, 1, ph);
}
function armAt(Side, t) {
  const P = W.pose[Side], B = W.behind[Side];
  if (t < ARMT.down0) return { p: B, curl: 0.35, held: 0 };
  if (t < ARMT.down1) { const k = s5(ARMT.down0, ARMT.down1, t); return { p: mixArm(B, P.floor, k), curl: lerp(0.35, 0.15, k), held: 0 }; }
  // the presses: lift to the bottom of the press, the reps, back on the mat
  const L = Side === 'Left' && t < ARMT.grabR - 1 ? [ARMT.liftL, ARMT.repsL0, ARMT.repsL1, ARMT.putL, 'L'] : t >= ARMT.grabR - 1 ? [ARMT.lift2, ARMT.reps20, ARMT.reps21, ARMT.put2, '2'] : null;
  if (!L || t < L[0] - 0.3) return { p: P.floor, curl: 0.15, held: 0 };
  const [l0, r0, r1, p1, w] = L;
  const curl = lerp(0.15, 1, s5(l0 - 0.3, l0 + 0.1, t)) - 0.85 * s5(p1 - 0.05, p1 + 0.35, t), held = s5(l0 - 0.25, l0 + 0.15, t) * (1 - s5(p1 - 0.25, p1 + 0.1, t));
  if (t < r0) return { p: mixArm(P.floor, P.lo, s5(l0, r0, t)), curl, held };
  if (t < r1) return { p: mixArm(P.lo, P.hi, pressPh(t, w)), curl, held };
  return { p: mixArm(P.lo, P.floor, s5(r1, p1, t)), curl, held };
}

// ------------------------------------------------------------------ posing the body
const _v = new THREE.Vector3(), _q = new THREE.Quaternion(), UP = new THREE.Vector3(0, 1, 0), QI = new THREE.Quaternion();
function applyBody(t) {
  const R = W.rig, c = crunchAt(t);
  R.pelvis.position.copy(W.pelvisRest); R.pelvis.quaternion.copy(W.qSupine);
  bendSpine(R.seg, { lum: 0.1 * c, tho: 0.46 * c, cer: 0.26 + 0.14 * c });
  for (const Side of ['Right', 'Left']) { const a = armAt(Side, t); poseArm(R.arms[Side], a.p); W.hand[Side].curl(a.curl); W.hand[Side].held = a.held; }
  R.root.updateMatrixWorld(true);
  for (const Side of ['Right', 'Left']) {
    const H = W.hand[Side], db = H.db, o = H.held; db.visible = o > 0.002;
    db.matrix.multiplyMatrices(R.arms[Side].elbow.matrixWorld, db.userData.hm); db.matrixWorldNeedsUpdate = true;
    for (const m of db.userData.mats) { m.opacity = o; m.depthWrite = o > 0.5; }
  }
  for (const Side of ['Right', 'Left']) {
    const G = R.legs[Side], sx = Side === 'Right' ? -1 : 1;
    const zH = 0.56;    // the ankles: this far toward the feet from the hip joints, so the knees stand at about 90 degrees
    const target = _v.set(G.A.x + sx * 0.02, MAT_H + (G.A.y - G.ground), W.pelvisRest.z + zH);
    legIK(R, Side, target, QI, UP);
  }
  R.root.updateMatrixWorld(true);
  return { c };
}

// ------------------------------------------------------------------ the camera: one path, no cuts
const CAM = camTrack([
  { t: -3.0, p: V3(0.0, 0.37, 1.22), l: V3(0, 0.17, -0.3), fov: 32 },
  { t: 0.0, p: V3(0.0, 0.38, 1.14), l: V3(0, 0.17, -0.3), fov: 32 },                // between the knees: the crunch comes at us
  { t: 2.6, p: V3(0.0, 0.46, 0.98), l: V3(0, 0.17, -0.3), fov: 32 },
  { t: 4.6, p: V3(0.04, 1.02, 0.6), l: V3(0, 0.16, -0.33), fov: 32 },               // up over the knees: the six-pack under the gold
  { t: 6.6, p: V3(0.12, 0.98, 0.52), l: V3(0, 0.17, -0.3), fov: 32 },
  { t: 8.6, p: V3(0.5, 0.66, 0.2), l: V3(0, 0.27, -0.22), fov: 32 },                // round to the left: the wall in section above it
  { t: 10.6, p: V3(0.54, 0.64, 0.24), l: V3(0, 0.27, -0.21), fov: 32 },
  { t: 12.6, p: V3(0.78, 0.86, 0.66), l: V3(0, 0.17, -0.22), fov: 32 },             // back: the tape goes round, six weeks of crunches
  { t: 16.8, p: V3(0.72, 0.9, 0.7), l: V3(0, 0.16, -0.22), fov: 32 },
  { t: 19.6, p: V3(0.04, 2.15, 0.55), l: V3(0, 0.0, -0.2), fov: 36 },               // up: the whole body, from above
  { t: 25.9, p: V3(0.02, 2.05, 0.5), l: V3(0, 0.02, -0.21), fov: 35 },
  { t: 28.8, p: V3(0.0, 1.5, 0.42), l: V3(0, 0.12, -0.44), fov: 36 },               // down toward the chest: both arms, the left one pressing
  { t: 34.6, p: V3(0.0, 1.42, 0.38), l: V3(0, 0.14, -0.47), fov: 36 },
  { t: 36.4, p: V3(0.0, 0.52, -0.42), l: V3(-0.04, 0.22, -1.28), fov: 30 },          // over the skull: a box on the floor beyond the head
  { t: 37.4, p: V3(-0.02, 0.46, -0.52), l: V3(-0.06, 0.19, -1.29), fov: 28 },
  { t: 38.8, p: V3(-0.08, 0.3, -0.72), l: V3(-0.1, 0.1, -1.29), fov: 26 },          // in on the small print
  { t: 40.8, p: V3(0.62, 1.2, 0.74), l: V3(0, 0.25, -0.42), fov: 34 },              // back up: strength training
  { t: 44.4, p: V3(0.55, 1.15, 0.7), l: V3(0, 0.22, -0.38), fov: 34 },
  { t: 46.8, p: V3(0.08, 0.86, 0.22), l: V3(0, 0.1, -0.22), fov: 32 },              // over the belly, and into it
  { t: 48.8, p: V3(0.05, 0.74, 0.12), l: V3(0, 0.1, -0.22), fov: 31 },
  { t: 51.0, p: V3(0.58, 1.18, 0.82), l: V3(0, 0.2, -0.33), fov: 34 },
  { t: 54.6, p: V3(0.66, 1.16, 0.78), l: V3(0, 0.2, -0.36), fov: 34 },
  { t: 57.0, p: V3(0.6, 1.1, 0.7), l: V3(0, 0.2, -0.33), fov: 34 },
  { t: 58.9, p: V3(0.3, 0.9, 0.42), l: V3(0, 0.2, -0.24), fov: 32 },
  { t: 61.0, p: V3(-0.28, 0.82, 1.82), l: V3(-0.3, 0.05, 1.0), fov: 32 },           // the dials, at the foot of the mat
  { t: 63.9, p: V3(0.02, 0.82, 1.84), l: V3(0.0, 0.05, 1.0), fov: 32 },
  { t: 66.7, p: V3(0.32, 0.82, 1.84), l: V3(0.34, 0.05, 1.0), fov: 32 },
  { t: 68.4, p: V3(0.36, 1.0, 1.36), l: V3(0.36, 0.06, 1.0), fov: 30 },
  { t: T.logo, p: V3(0.36, 1.12, 1.005), l: V3(0.36, 0.0665, 1.0), fov: 30, stop: true },   // straight down on the last dial: the logo lands here
]);
function camPose(S, t) {
  const v = S.cfg.view;
  if (v) { const V = { arms: [[0, 1.55, -1.55], [0, 0.15, -0.3], 34], belly: [[0.62, 0.36, -0.1], [0, 0.19, -0.2], 30], q34: [[1.3, 0.9, 1.1], [0, 0.15, -0.35], 32], feet: [[0, 0.42, 1.25], [0, 0.14, -0.3], 32], top: [[0, 2.5, 0.2], [0, 0, -0.15], 40], box: [[-0.2, 0.4, -0.62], [-0.56, 0.15, -1.02], 30], gut: [[-0.08, 0.47, -0.02], [0, 0.12, -0.2], 30], abs: [[0.25, 0.62, 0.2], [0, 0.24, -0.22], 30], abs2: [[0.0, 0.75, 0.45], [0, 0.2, -0.3], 30], dials: [[1.45, 0.6, 0.55], [0.8, 0.04, -0.33], 32] }[v]; if (V) return { p: V[0], l: V[1], fov: V[2] }; }
  if (t <= T.logo) return CAM(t);
  const P = CAM(T.logo), k = ss(T.logo, T.end, t);
  return { p: [P.p[0], lerp(P.p[1], P.p[1] - 0.08, k), P.p[2]], l: P.l, fov: 30 };
}
function focusAt(S, t, P) { return Math.hypot(P.p[0] - P.l[0], P.p[1] - P.l[1], P.p[2] - P.l[2]); }

// ------------------------------------------------------------------ one moment of the film
const _p = new THREE.Vector3(), _n = new THREE.Vector3(), _m4 = new THREE.Matrix4(), _qq = new THREE.Quaternion(), _s3 = new THREE.Vector3();
function update(S, t, quiet) {
  const scene = S.scene, b = applyBody(t);
  // ---- the abs: the six-pack comes in on "strong abs"; they light with every crunch and every press
  const def = ss(T.strong + 0.4, T.abs + 0.3, t);
  const press = W.hand.Left.held * (t < 32 ? pressPh(Math.min(t, ARMT.repsL1 - 0.01), 'L') : 0) + (t > ARMT.reps20 && t < ARMT.reps21 ? pressPh(t, '2') : 0);
  // ---- fat: how much is left (1 = all of it): strength training trims it everywhere; then the body picks the arms first
  const cut = 1 - 0.14 * s5(T.cut, T.cut + 1.8, t);
  const bellyK = cut * (1 - 0.08 * s5(59.0, 60.2, t)), armK = cut * (1 - 0.3 * s5(T.picks + 0.3, T.where + 0.5, t));
  for (const sk of W.skins) sk.update(sk.rectus ? def : 0);
  W.fat.update(1 - bellyK);
  for (const k in W.armFat) W.armFat[k].update(1 - armK);
  // ---- the dive: the wall of the belly goes clear and the gut shows, with its deep fat
  const dive = s5(45.7, 46.9, t) * (1 - s5(49.4, 50.5, t));
  const strong = ss(T.strong + 0.3, T.strong + 0.8, t) * (1 - ss(T.under - 0.1, T.same, t));
  W.fatMat.opacity = lerp(0.84, 0.24, strong) * (1 - 0.88 * dive); W.fatMat.emissiveIntensity = 0.04 + 0.05 * ss(T.burns - 0.4, T.burns + 0.4, t) * (1 - ss(T.stored + 1.2, T.picks + 0.4, t));
  const wallO = 1 - 0.9 * dive;
  for (const m of W.muscleMats) { m.transparent = wallO < 0.999; m.opacity = wallO; m.depthWrite = wallO > 0.5; }
  for (const sk of W.skins) if (!sk.side) sk.mesh.castShadow = wallO > 0.6;   // a clear wall casts no shadow on the gut
  const glowAbs = 0.02 + 0.1 * b.c + 0.06 * strong + 0.22 * b.c * ss(T.muscle - 0.2, T.muscle + 0.3, t) * (1 - ss(T.top + 0.8, T.trial, t)) + 0.15 * press * ss(40, 41, t);
  W.rectusMat.emissiveIntensity = glowAbs;
  for (const m of W.muscleMats) if (m !== W.rectusMat) m.emissiveIntensity = 0.02 + 0.06 * b.c + 0.08 * press * ss(40, 41, t);
  // ---- the arms' tissue arrives for the one-arm study
  const armOn = ss(T.another, T.another + 0.8, t);
  W.armMat.opacity = armOn; W.armMat.transparent = armOn < 0.999; W.armMat.depthWrite = armOn > 0.5; W.armFatMat.opacity = 0.74 * armOn * (1 - 0.85 * dive);
  W.armMat.emissiveIntensity = 0.04 + 0.4 * W.hand.Left.held * (t < 32 ? pressPh(Math.min(t, ARMT.repsL1 - 0.01), 'L') : 0) * 0 + 0.3 * press;
  for (const m of W.armMeshes) m.visible = armOn > 0.002; for (const k in W.armFat) W.armFat[k].mesh.visible = armOn > 0.002;
  // ---- the gut and its deep fat, only for the dive
  const gutO = s5(45.9, 46.8, t) * (1 - s5(49.2, 50.2, t));
  for (const m of W.gut) m.visible = gutO > 0.002; for (const m of W.gutMats) { m.opacity = gutO; m.depthWrite = gutO > 0.5; }
  W.lumpIM.visible = gutO > 0.002; W.lumpMat.opacity = gutO * 0.95; W.lumpMat.emissiveIntensity = 0.03 + 0.18 * ss(T.deep - 0.2, T.deep + 0.4, t) * (1 - ss(T.organs + 0.6, T.organs + 1.4, t));
  if (gutO > 0.002) { const sh = 1 - 0.2 * s5(T.deep + 0.3, T.organs + 0.2, t); W.lumps.forEach((L, i) => { _m4.compose(L.c, L.q, _s3.copy(L.s).multiplyScalar(sh)); W.lumpIM.setMatrixAt(i, _m4); }); W.lumpIM.instanceMatrix.needsUpdate = true; }
  // ---- the tape: wraps on, stays put through six weeks of crunches, comes off
  const tp = W.tape, tOn = t > T.trial - 0.1 && t < 18.2;
  tp.sk.mesh.visible = tOn; tp.mark.mesh.visible = tOn;
  if (tOn) { tp.sk.update(0); tp.mark.update(0); }
  tp.U.uDraw.value = s5(T.trial, T.trial + 1.1, t) * (1 - s5(17.1, 17.9, t)) * 1.001;
  tp.rmat.opacity = ss(T.trial + 1.0, T.trial + 1.4, t) * (1 - ss(16.9, 17.3, t));
  // ---- the reticle: locks onto the belly ("one body part"), nothing happens, it gives up; back later for "it picks where"
  { const R1 = [T.training - 0.15, 24.3, 25.7], R2 = [T.picks - 0.1, T.dont - 0.05, T.dont + 0.6];
    let o = 0, sc = 1, spin = 0;
    for (const [a0, f0, f1] of [R1, R2]) { if (t < a0 - 0.2 || t > f1 + 0.1) continue; const k = clamp01((t - a0) / 0.55);
      sc = lerp(2.4, 1, outBack(k, 1.6)); spin = (1 - k) * 2.2;
      const blink = t > f0 && t < f0 + 0.7 ? (Math.floor((t - f0) * 8) % 2 ? 0.25 : 1) : 1;
      o = ss(a0 - 0.2, a0 + 0.15, t) * (1 - ss(f0 + 0.6, f1, t)) * blink; }
    const R = W.ret; R.g.visible = o > 0.002; R.mat.opacity = o;
    if (o > 0.002) { const i = W.shellUV(0, 1.08), P = W.fat.geo.attributes.position, N = W.fat.geo.attributes.normal;
      _p.fromBufferAttribute(P, i); _n.fromBufferAttribute(N, i).normalize(); R.g.position.copy(_p).addScaledVector(_n, 0.004); R.g.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), _n); R.g.scale.setScalar(sc); R.spin.rotation.z = spin; } }
  // ---- the scan: a ring of light runs down each upper arm; then the two images rise, the same
  for (const Side of ['Right', 'Left']) {
    const Sc = W.scans[Side], run = clamp01((t - T.scans + 0.1) / 1.0), on = ss(T.scans - 0.15, T.scans + 0.1, t) * (1 - ss(T.scans + 1.0, T.scans + 1.35, t));
    Sc.ring.visible = Sc.disc.visible = on > 0.002; Sc.rm.opacity = on; Sc.disc.material.opacity = on * 0.12;
    const sAx = lerp(0.18, 0.62, s5(0, 1, run)); Sc.ring.position.copy(Sc.ax).multiplyScalar(sAx); Sc.disc.position.copy(Sc.ring.position);
    const po = s5(T.scans + 0.5, T.scans + 1.1, t) * (1 - ss(35.1, 35.7, t)); Sc.panel.visible = po > 0.002; Sc.pm.opacity = po;
    if (po > 0.002) { Sc.A.arm.localToWorld(_p.copy(Sc.ax).multiplyScalar(0.5)); const k = outBack(clamp01((t - T.scans - 0.5) / 0.8), 1.2), dst = new THREE.Vector3(Side === 'Left' ? 0.098 : -0.098, 0.46, -0.4);
      Sc.panel.position.copy(_p).lerp(dst, k); Sc.panel.quaternion.copy(S.cam.quaternion); Sc.panel.scale.setScalar(lerp(0.3, 1, po)); }
  }
  // ---- the dumbbells' grip: done in applyBody. The box: in the dark until a shop light clicks on
  W.box.visible = t > 34.6 && t < 41.5; W.boxLight.intensity = (t > T.myth + 0.05 ? 1 : 0) * (1 - ss(39.4, 40.4, t)) * 7;
  // ---- the dials rise and are set, one per line; the last one's face becomes the logo
  const endDark = ss(T.final + 0.3, T.logo - 0.3, t);
  W.dials.forEach((d, i) => {
    const up = s5(59.4 + i * 0.18, 60.3 + i * 0.18, t); d.g.position.y = lerp(-0.075, 0, up); d.g.visible = up > 0.001;
    const [ts, v] = [[T.twice, 0.4], [T.hundred + 0.2, 0.5], [T.little, 0.43]][i], k = s5(ts - 0.1, ts + 0.5, t);
    d.knob.rotation.y = -d.angle(lerp(lerp(0, v, k), 0.5, i === 2 ? s5(T.final + 0.2, T.logo - 0.3, t) : 0)); d.setMat.opacity = ss(ts + 0.3, ts + 0.6, t) * (1 - endDark);
    const a = d.angle(v), r = 0.1; d.set.position.set(Math.sin(a) * r, 0.0048, -Math.cos(a) * r); d.set.rotation.y = -a;
  });
  { const logoK = s5(T.final + 0.4, T.logo - 0.25, t); W.logoRing.set({ weight: logoK, white: logoK, hours: 0, hand: ss(T.logo - 0.4, T.logo - 0.15, t), handScale: outBack(clamp01((t - (T.logo - 0.4)) / 0.35), 1.8) }); }
  // ---- motes: stored fat leaves and burns
  W.motes.pts.visible = t > T.burns && t < T.picks + 1.6; W.motes.m.uniforms.uT.value = t; W.motes.m.uniforms.uScale.value = S.size.y * 0.0012;
  // ---- light
  const fig = 1 - endDark;
  W.key.intensity = 5.5 * fig; W.rim.intensity = 2.2 * fig; W.fill.intensity = 0.8 * fig; W.dialLight.intensity = 3.2 * ss(59.2, 60.4, t) * (1 - 0.6 * endDark);
  S.tableMat.color.setScalar(FLOOR * (1 - endDark * 0.9)); W.matMat.color.set(0x23272d).multiplyScalar(1 - endDark * 0.8); scene.environmentIntensity = 0.12 * (1 - endDark); S.reflAmt = 0.9 * (1 - endDark);
  if (S.cfg.nofat) { W.fat.mesh.visible = false; }
  if (quiet) return;
}

// ------------------------------------------------------------------ the words on screen
const CAPS = [
  { t0: 0.35, t1: 2.75, top: 300, size: 100, html: 'Crunches for<br><em>belly fat?</em>' },
  { t0: 2.96, t1: 4.7, top: 300, size: 104, html: 'Strong <em>abs.</em>' },
  { t0: 4.86, t1: 6.9, top: 300, size: 104, html: 'Same <em>fat.</em>' },
  { t0: 7.39, t1: 10.8, top: 292, size: 84, html: 'Muscle doesn’t burn<br>the fat <em>on top of it</em>' },
  { t0: 11.35, t1: 14.2, top: 292, size: 84, html: '<em>6 weeks</em> of ab exercises' },
  { t0: 14.36, t1: 17.6, top: 292, size: 84, html: 'Waist and belly fat:<br><em>no change</em>' },
  { t0: 18.29, t1: 21.9, top: 292, size: 88, html: '<em>13</em> studies<br><em>1,158</em> people' },
  { t0: 22.05, t1: 26.4, top: 292, size: 84, html: 'Train one spot.<br>Its fat <em>stays.</em>' },
  { t0: 27.09, t1: 31.2, top: 292, size: 84, html: 'One arm trained<br>for <em>12 weeks</em>' },
  { t0: 31.43, t1: 34.9, top: 292, size: 92, html: 'MRI: <em>no difference</em>' },
  { t0: 35.19, t1: 38.6, top: 292, size: 84, html: 'Spot reduction:<br><em>a myth</em>' },
  { t0: 39.72, t1: 41.1, top: 300, size: 100, html: 'What <em>works?</em>' },
  { t0: 41.3, t1: 42.8, top: 300, size: 96, html: '<em>Strength training</em>' },
  { t0: 42.99, t1: 49.2, top: 292, size: 80, html: '58 studies: <em>less</em> body fat,<br>deep fat included' },
  { t0: 49.8, t1: 54.4, top: 292, size: 84, html: 'Eat a little <em>less</em><br>than you use' },
  { t0: 54.82, t1: 57.1, top: 292, size: 88, html: 'Your body burns<br><em>stored fat</em>' },
  { t0: 57.32, t1: 59.5, top: 292, size: 96, html: 'It picks where.<br><em>You don’t.</em>' },
  { t0: 59.71, t1: 61.6, top: 300, size: 96, html: 'Lift <em>twice</em> a week' },
  { t0: 61.76, t1: 64.9, top: 300, size: 90, html: 'Move <em>150 min</em> a week' },
  { t0: 65.11, t1: 67.6, top: 300, size: 96, html: 'Eat a little <em>less</em>' },
  { t0: 67.89, t1: 99, top: 360, size: 96, html: 'Back to<br><em>factory settings.</em>' },
];
const OVL = {};
function overlayInit(S) {
  const O = S.O, tag = (cls, txt, size) => { const e = O.tag(cls, txt); e.style.fontSize = size + 'px'; return e; };
  OVL.week = tag('tag', 'Week 1', 34);
  // the belly wall in section (as an ultrasound shows it), under the words: the muscle works, the fat stays
  const sc = document.createElement('canvas'); sc.width = 720; sc.height = 380; sc.style.cssText = 'position:absolute;left:180px;top:520px;width:720px;height:380px;opacity:0';
  S.O.wrap.appendChild(sc); OVL.sec = sc; OVL.secKey = '';
  OVL.tr = tag('tag', 'Trained arm', 24); OVL.un = tag('tag', 'Untrained arm', 24);
  OVL.dial = [tag('tag', 'Lift<b>2× a week</b>', 28), tag('tag', 'Move<b>150 min a week</b>', 28), tag('tag', 'Eat<b>a little less</b>', 28)];
  for (const e of OVL.dial) e.querySelector('b').style.fontSize = '50px';
  // energy in and out, as two bars under the words
  const bars = document.createElement('div'); bars.style.cssText = 'position:absolute;left:150px;right:150px;top:560px;opacity:0;font-family:Geist Mono,monospace;letter-spacing:.14em;text-transform:uppercase;font-size:24px;color:#c3c6cc';
  bars.innerHTML = '<div style="display:flex;justify-content:space-between"><span>Eat and drink</span></div><div id="bIn" style="height:16px;border-radius:8px;background:#ff8a50;width:84%;margin:10px 0 26px"></div>' +
    '<div style="display:flex;justify-content:space-between"><span>Use</span></div><div style="height:16px;border-radius:8px;background:#eceef1;width:100%;margin-top:10px"></div>';
  S.O.wrap.appendChild(bars); OVL.bars = bars;
}
function overlay(S, t) {
  // the belly wall in section: the muscle thickens and lights with each crunch, the fat over it does not change
  { const o = s5(T.muscle - 0.1, T.muscle + 0.5, t) * (1 - s5(T.top + 0.7, T.trial - 0.2, t)), c = crunchAt(t);
    OVL.sec.style.opacity = o.toFixed(3); OVL.sec.style.transform = `translateY(${((1 - o) * 30).toFixed(1)}px)`;
    if (o > 0.002) { const key = c.toFixed(2); if (key !== OVL.secKey) { sectionDraw(OVL.sec, c, c); OVL.secKey = key; } } }
  // the week count, beside the tape's reading
  { const wk = 1 + Math.min(5, Math.floor(Math.max(0, repsAt(t) - repsAt(T.sixweek)) / ((repsAt(16.4) - repsAt(T.sixweek)) / 5.0)));
    OVL.week.textContent = 'Week ' + wk; W.tape.mark.mesh.geometry.computeBoundingBox();
    const g = W.tape.mark.geo.attributes.position; _p.fromBufferAttribute(g, 0);
    place(S, OVL.week, _p, 40, -90, ss(T.sixweek - 0.1, T.sixweek + 0.3, t) * (1 - ss(16.9, 17.3, t))); }
  // the scans' labels
  for (const [Side, el] of [['Left', OVL.tr], ['Right', OVL.un]]) { const Sc = W.scans[Side]; place(S, el, Sc.panel.position.clone().add(new THREE.Vector3(0, 0, 0.1)), -80, 20, Sc.pm.opacity); }
  // the settings
  W.dials.forEach((d, i) => { const ts = [T.lift, T.move, T.eatless][i]; place(S, OVL.dial[i], d.g.position.clone().add(new THREE.Vector3(0, 0.07, -0.19)), -70, -40, ss(ts, ts + 0.4, t) * (1 - ss(T.final - 0.3, T.final + 0.2, t))); });
  // energy in, a little less than energy out
  OVL.bars.style.opacity = (ss(T.eat - 0.1, T.eat + 0.4, t) * (1 - ss(54.0, 54.6, t))).toFixed(3);
  OVL.bars.querySelector('#bIn').style.width = lerp(100, 84, s5(T.less, T.less + 0.6, t)).toFixed(1) + '%';
  // the end: the logo lands on the last dial's face
  const d = W.dials[2], c = d.g.position.clone().add(new THREE.Vector3(0, 0.0665 + 0.0012, 0));
  logoEnd(S, t, { t0: T.logo, center: c, edge: c.clone().add(new THREE.Vector3(LOGO_R, 0, 0)) });
}

window.HFS_POSE = poseArm;
makeFilm({
  T, caps: CAPS, subs: [], build, update, pose: camPose, overlay, overlayInit, focus: focusAt,
  stage: { bg: 0x07080a, reflSize: 6, env: 0.12, far: 30 },
  aperture: [[0, 0.006], [3, 0.004], [7, 0.006], [11, 0.003], [18, 0.0012], [27, 0.002], [35.5, 0.005], [39.5, 0.002], [46, 0.004], [50.5, 0.0018], [60, 0.003], [68, 0.002]],
  bloom: [[0, 0.42], [30, 0.45], [54, 0.55], [58, 0.45], [69.7, 0.55]],
  fast: [[12.9, 16.8, 3], [28.4, 30.4, 3]],
});

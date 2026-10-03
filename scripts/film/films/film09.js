// Human Factory Settings · Film 9 "The breath that calms you down" · one continuous shot, 9:16.
// A skeleton sits on a stool and breathes: glass lungs fill around their airways, the diaphragm drops, the ribs open, and
// the heart beats a little faster on each breath in and slower on each breath out (a chart recorder prints it). A sigh:
// two breaths in; under a bell jar, air sacs a hundred times life size fold shut and open again. The Stanford trial:
// 108 people in four groups, five minutes a day for a month; good mood rises more with cyclic sighing than with
// meditation, anxiety falls the same; and the fifth place, the do-nothing group, is empty (the gag). Twelve trials: small
// to medium. Longer out-breaths: no clear gain. Fast drills: carbon dioxide drops, the room sways; never near water.
// See a doctor. A dial for breaths a minute (12 to 18 at rest) becomes the logo.
import { THREE, ORANGE, COLD, ss, s5, lerp, clamp01, hash, camTrack, phys, glowMat, shadows, spot, RoundedBoxGeometry,
  loadAnatomy, tissueMat, V3, place, logoEnd, makeFilm, outBack, stamp, stampCanvas, stampSpot, noiseTex, TIME } from '../kit.js';
import { buildRig, skeletonKind, legIK, bendSpine, poseArm, worldVerts } from '../rig.js';
import { makeLogoRing } from '../props.js';
import { ConvexHull } from 'three/addons/math/ConvexHull.js';

// ------------------------------------------------------------------ timing, from the voice guide (word starts)
const T = {
  end: 79.0,
  q0: 0.35, in: 1.10, heart: 1.62, speeds: 1.94, little: 2.64, out: 3.41, out2: 4.16, slows: 4.62,                     // "Breathe in, and your heart speeds up a little. Breathe out, and it slows."
  already: 6.38, sigh: 6.85, every: 7.09, minutes: 7.61, noticing: 8.36, second: 10.11, breath: 10.45, top: 10.90, first: 11.47,
  reopen: 12.37, tiny: 12.91, air: 13.34, sacs: 13.60, fold: 14.29, shut: 14.90,                                     // "You already sigh ... to reopen tiny air sacs that fold shut."
  stanford: 16.61, hundred: 17.58, people: 18.41, students: 19.61, given: 20.42, five: 20.88, minutes2: 21.52, day: 22.27,
  breathing: 22.73, meditation: 23.69, month: 25.42,                                                                  // "In a Stanford trial, a hundred and eight people ... for a month."
  sighing: 26.53, purpose: 27.44, two: 27.85, breaths: 28.16, one: 28.73, long: 29.08, out3: 29.80, lifted: 30.18, good: 30.74,
  more: 31.18, meditation2: 31.94, did: 33.20,                                                                        // "Sighing on purpose, two breaths in, one long breath out, lifted good mood more than meditation did."
  anxious: 35.39, dropped: 35.80, much: 36.77, meditation3: 37.20, and: 38.73, trial: 39.51, no: 39.88, nothing: 40.17, group: 40.69,
  across: 42.08, twelve: 42.90, trials: 43.20, cut: 45.20, small: 46.40, medium: 47.01, amount: 47.51, useful: 48.68, not: 49.44, magic: 49.80,
  longer: 51.08, outbreaths: 51.78, twelveweek: 53.71, notc: 54.84, better: 55.59, equal: 56.29, breaths2: 56.77,
  skip: 58.29, hard: 58.85, fast: 59.22, drills: 60.11, drop: 61.61, carbon: 62.07, dizzy: 64.40, never: 65.03, water: 67.00,
  struggling: 68.31, cope: 69.40, nothing2: 70.61, helping: 72.09, see: 72.84, doctor: 73.56,
  final: 74.88, settings: 76.04, logo: 76.74,
};

// ------------------------------------------------------------------ the set (metres; the skeleton faces +z; +x is its left)
const W = {}; window.HFS_W = W;
const SEAT = 0.47;                                                     // the stool's top
const SIDE = new THREE.Vector3(0.62, 0.62, 0.08);                      // the side table's top (the skeleton's left): the chart recorder
const JAR = new THREE.Vector3(-0.62, 0.62, 0.1);                       // the bell jar's base top (its right)
const PLINTH = { x: 0.0, z: 0.86, w: 0.6, d: 0.66, top: 0.36 };      // the low plinth in front: the trial
const DIAL = new THREE.Vector3(0.71, SIDE.y, 0.165), DIAL_R = 0.062, LOGO_R = 0.048;
const X = new THREE.Vector3(1, 0, 0), Y = new THREE.Vector3(0, 1, 0), Z = new THREE.Vector3(0, 0, 1);
const pulse = (t, a, b, r = 0.35) => ss(a, a + r, t) * (1 - ss(b - r, b, t));
function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h, c);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.userData.canvas = c; return t;
}
function txt(x, s, px, py, { font = '800 100px Archivo', color = '#fff', align = 'center', track = 0, base = 'middle' } = {}) {
  x.font = font; x.letterSpacing = `${track}px`; x.fillStyle = color; x.textAlign = align; x.textBaseline = base; x.fillText(s, px, py);
}

// ------------------------------------------------------------------ breathing: lung volume 0..1 over time, written to the words
// a breath: in over `a` seconds, out over `b`; `k` = depth
function breathAt(t) {
  const segs = [];
  const add = (t0, a, b, k = 1, hold = 0) => segs.push({ t0, a, b, k, hold });
  // the first lines: one slow breath in on "Breathe in", out on "Breathe out"
  add(0.55, 2.2, 0, 1.0, 0.55); add(3.3, 0, 2.4, 1.0);
  // quiet breathing at about 12 a minute
  for (let s = 6.0; s < 9.3; s += 4.6) add(s, 1.7, 2.6, 0.65);
  // the sigh: a breath in, a second on top, a long breath out
  segs.push({ sigh: true, t0: 9.55, a1: 0.9, a2: 0.75, b: 3.2 });
  for (let s = 14.6; s < 26.6; s += 4.8) add(s, 1.8, 2.8, 0.6);
  // cyclic sighing on purpose: two in, one long out, three times
  for (const s of [27.7, 32.1]) segs.push({ sigh: true, t0: s, a1: 0.65, a2: 0.55, b: 3.0 });
  for (let s = 36.4; s < 50.6; s += 4.8) add(s, 1.8, 2.8, 0.6);
  // longer out-breaths, then equal ones
  add(51.0, 1.6, 3.2, 0.7); add(55.9, 1.8, 1.8, 0.7);
  // hard, fast breathing (the drill), then calm
  for (let s = 59.0; s < 64.9; s += 0.92) add(s, 0.42, 0.46, 1.0);
  for (let s = 65.6; s < 81; s += 4.9) add(s, 1.9, 2.9, 0.6);
  let v = 0;
  for (const g of segs) {
    if (t < g.t0) continue;
    const u = t - g.t0;
    if (g.sigh) {
      const i1 = s5(0, g.a1, u) * 0.72, i2 = s5(g.a1 + 0.08, g.a1 + 0.08 + g.a2, u) * 0.28, o = 1 - s5(g.a1 + g.a2 + 0.15, g.a1 + g.a2 + 0.15 + g.b, u);
      if (u < g.a1 + g.a2 + 0.15 + g.b) v = (i1 + i2) * o * 1.15;
    } else {
      const up = g.a > 0 ? s5(0, g.a, u) : 1, dn = g.b > 0 ? 1 - s5(g.a + g.hold, g.a + g.hold + g.b, u) : 1;
      if (g.b === 0) v = g.k * up; else if (g.a === 0) { if (u < g.b) v = g.k * (1 - s5(0, g.b, u)); }
      else if (u < g.a + g.hold + g.b) v = g.k * up * dn;
    }
  }
  return v;
}
// the heart: a little faster while the lungs fill, slower while they empty (respiratory sinus arrhythmia), faster in the drill
let BEATS = null;
function buildBeats() {
  BEATS = []; let ph = 0, prev = breathAt(0);
  for (let t = 0; t < T.end + 1; t += 0.002) {
    const b = breathAt(t), db = (b - prev) / 0.002; prev = b;
    const drill = ss(58.8, 59.6, t) * (1 - ss(64.6, 66.0, t));
    const hr = 64 + 9 * Math.tanh(db * 1.4) + 14 * drill;           // beats a minute
    ph += (hr / 60) * 0.002; if (ph >= 1) { ph -= 1; BEATS.push(t); }
  }
}
function beatEnv(t) { let e = 0; for (const b of BEATS) { if (b > t) break; const u = t - b; if (u < 0.5) e = Math.max(e, Math.exp(-u * 9) * Math.min(1, u * 40)); } return e; }
function hrAt(t) { let i = 0; while (i < BEATS.length && BEATS[i] <= t) i++; if (i < 2) return 64; return 60 / (BEATS[i - 1] - BEATS[i - 2]); }

// ------------------------------------------------------------------ the lungs: a rounded hull round each bronchial tree
function softHull(pts, c, { k = 0.012, grow = 0.014, nu = 96, nv = 64, smooth = 3 } = {}) {
  const hull = new ConvexHull().setFromPoints(pts), faces = hull.faces.map((f) => ({ n: f.normal.clone(), w: f.constant }));
  const R = new Float32Array(nu * nv), dirs = [];
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
    const th = (j / (nv - 1)) * Math.PI, ph = (i / nu) * Math.PI * 2, d = new THREE.Vector3(Math.sin(th) * Math.cos(ph), Math.cos(th), Math.sin(th) * Math.sin(ph)); dirs.push(d);
    let acc = 0; for (const f of faces) { const nd = f.n.dot(d); if (nd <= 1e-4) continue; const tt = (f.w - f.n.dot(c)) / nd; acc += Math.exp(-tt / k); }
    R[j * nu + i] = -k * Math.log(Math.max(acc, 1e-30)) + grow;
  }
  for (let s = 0; s < smooth; s++) { const Q = R.slice(); for (let j = 1; j < nv - 1; j++) for (let i = 0; i < nu; i++) { const a = j * nu + i; Q[a] = (R[a] * 4 + R[j * nu + (i + 1) % nu] + R[j * nu + (i + nu - 1) % nu] + R[(j + 1) * nu + i] + R[(j - 1) * nu + i]) / 8; } R.set(Q); }
  const pos = new Float32Array(nu * nv * 3), idx = [];
  for (let k2 = 0; k2 < nu * nv; k2++) { const p = dirs[k2].clone().multiplyScalar(R[k2]).add(c); pos[k2 * 3] = p.x; pos[k2 * 3 + 1] = p.y; pos[k2 * 3 + 2] = p.z; }
  for (let j = 0; j < nv - 1; j++) for (let i = 0; i < nu; i++) { const a = j * nu + i, b = j * nu + (i + 1) % nu, cc = (j + 1) * nu + i, d = (j + 1) * nu + (i + 1) % nu; idx.push(a, cc, b, b, cc, d); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  return g;
}
function glassMat(color, { alpha = 0.1, rim = 0.55, pow = 2.0 } = {}) {
  return new THREE.ShaderMaterial({
    uniforms: { uC: { value: new THREE.Color(color) }, uA: { value: alpha }, uR: { value: rim }, uP: { value: pow }, uO: { value: 1 } },
    vertexShader: 'varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }',
    fragmentShader: 'uniform vec3 uC; uniform float uA, uR, uP, uO; varying vec3 vN; varying vec3 vV; void main(){ float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), uP); gl_FragColor = vec4(uC * (0.7 + 0.8 * f), (uA + uR * f) * uO); }',
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
  });
}

// ------------------------------------------------------------------ props
function makeStool(scene) {
  const g = new THREE.Group(); scene.add(g);
  const black = phys({ color: 0x0d0e10, roughness: 0.32, clearcoat: 0.6, clearcoatRoughness: 0.25 });
  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.035, 96), black); top.position.y = SEAT - 0.0175; g.add(top);
  for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2 + 0.5, leg = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.011, SEAT - 0.03, 20), black);
    leg.position.set(Math.cos(a) * 0.12, (SEAT - 0.03) / 2, Math.sin(a) * 0.12); leg.rotation.set(Math.sin(a) * 0.08, 0, -Math.cos(a) * 0.08); g.add(leg); }
  shadows(g); g.traverse((o) => o.layers.enable(1)); return g;
}
function makeSideTable(scene, at, w = 0.34, d = 0.34) {
  const g = new THREE.Group(); g.position.set(at.x, 0, at.z); scene.add(g);
  const black = phys({ color: 0x0d0e10, roughness: 0.32, clearcoat: 0.6, clearcoatRoughness: 0.25 });
  const top = new THREE.Mesh(new RoundedBoxGeometry(w, 0.03, d, 4, 0.008), black); top.position.y = at.y - 0.015; g.add(top);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, at.y - 0.03, 32), black); stem.position.y = (at.y - 0.03) / 2; g.add(stem);
  const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.14, 0.02, 64), black); foot.position.y = 0.01; g.add(foot);
  shadows(g); g.traverse((o) => o.layers.enable(1)); return g;
}
// the chart recorder: paper comes out of a slot and runs over the table's edge; the trace is drawn once for the whole film
const PAPER_V = 0.035;                                                 // metres of paper a second
function makeRecorder(scene) {
  const g = new THREE.Group(); g.position.copy(SIDE).add(new THREE.Vector3(0.0, 0, -0.06)); g.rotation.y = -0.35; scene.add(g);
  const body = new THREE.Mesh(new RoundedBoxGeometry(0.17, 0.075, 0.12, 4, 0.01), phys({ color: 0x1b1c20, roughness: 0.45, clearcoat: 0.4 })); body.position.y = 0.0375; g.add(body);
  const slot = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.004, 0.004), new THREE.MeshBasicMaterial({ color: 0x050505 })); slot.position.set(0, 0.025, 0.061); g.add(slot);
  const lamp = new THREE.Mesh(new THREE.CircleGeometry(0.004, 20), glowMat(new THREE.Color(0x9fdcff))); lamp.position.set(0.065, 0.06, 0.0605); g.add(lamp);
  const label = canvasTex(512, 96, (x, w, h) => { x.fillStyle = '#1b1c20'; x.fillRect(0, 0, w, h); txt(x, 'HEART · BREATH', 24, h / 2, { font: '500 40px "Geist Mono"', color: '#8d9097', align: 'left', track: 6 }); });
  const lab = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.019), new THREE.MeshBasicMaterial({ map: label })); lab.position.set(-0.02, 0.06, 0.0606); g.add(lab);
  // the trace: breath (top) and heartbeats (bottom), the whole film, 120 px a second
  const PX = 90, TT0 = -5, Wc = Math.ceil((T.end + 2 - TT0) * PX), Hc = 256;
  const tex = canvasTex(Wc, Hc, (x) => {
    x.fillStyle = '#efebe2'; x.fillRect(0, 0, Wc, Hc);
    x.strokeStyle = 'rgba(190,120,110,0.35)'; x.lineWidth = 1; for (let px = 0; px < Wc; px += 12) { x.beginPath(); x.moveTo(px, 0); x.lineTo(px, Hc); x.stroke(); }
    for (let py = 0; py < Hc; py += 12) { x.beginPath(); x.moveTo(0, py); x.lineTo(Wc, py); x.stroke(); }
    x.strokeStyle = '#3b5fc2'; x.lineWidth = 3; x.beginPath(); for (let px = 0; px < Wc; px += 2) { const t = px / PX + TT0, y = 100 - 70 * breathAt(Math.max(0, t)); px ? x.lineTo(px, y) : x.moveTo(px, y); } x.stroke();
    x.strokeStyle = '#1d1e22'; x.lineWidth = 2.5; x.beginPath(); x.moveTo(0, 200);
    for (const b of BEATS) { const px = (b - TT0) * PX; x.lineTo(px - 6, 200); x.lineTo(px - 3, 206); x.lineTo(px, 140); x.lineTo(px + 4, 214); x.lineTo(px + 8, 200); }
    x.lineTo(Wc, 200); x.stroke();
  });
  tex.wrapS = THREE.ClampToEdgeWrapping;
  // the paper: out of the slot, flat for 0.16 m, then over the edge and down
  const pts = [new THREE.Vector3(0, 0.025, 0.062), new THREE.Vector3(0, 0.02, 0.14), new THREE.Vector3(0, 0.004, 0.2), new THREE.Vector3(0, -0.01, 0.235), new THREE.Vector3(0, -0.06, 0.25), new THREE.Vector3(0, -0.2, 0.255)];
  const curve = new THREE.CatmullRomCurve3(pts), N = 120, Wp = 0.12, L = curve.getLength();
  const pos = new Float32Array((N + 1) * 2 * 3), uv = new Float32Array((N + 1) * 2 * 2), idx = [];
  for (let i = 0; i <= N; i++) { const p = curve.getPointAt(i / N); for (let s = 0; s < 2; s++) { const k = i * 2 + s; pos.set([p.x + (s ? Wp / 2 : -Wp / 2), p.y, p.z], k * 3); uv.set([i / N, s], k * 2); } }
  for (let i = 0; i < N; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); pg.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); pg.setIndex(idx); pg.computeVertexNormals();
  // the texture runs along the strip's length: u = 0 at the slot (now), u = 1 at the end (L / PAPER_V seconds ago); v across
  tex.rotation = 0; tex.center.set(0, 0);
  const paper = new THREE.Mesh(pg, new THREE.MeshPhysicalMaterial({ map: tex, roughness: 0.8, side: THREE.DoubleSide })); paper.castShadow = true; paper.receiveShadow = true; g.add(paper);
  shadows(g); paper.castShadow = false; g.traverse((o) => o.layers.enable(1));
  return { g, tex, L, Wc, PX, TT0, paper };
}
function setPaper(R, t) {   // texture u maps to film time: the slot shows now
  const span = R.L / PAPER_V; R.tex.repeat.set(-(span * R.PX) / R.Wc, 1); R.tex.offset.set(((t - R.TT0) * R.PX) / R.Wc, 0);
}
// the bell jar: air sacs a hundred times life size, round the end of a small airway
function makeJar(scene) {
  const g = new THREE.Group(); g.position.copy(JAR); scene.add(g);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.135, 0.03, 96), phys({ color: 0x15100c, roughness: 0.45, clearcoat: 0.5 })); base.position.y = 0.015; g.add(base);
  const prof = []; for (let i = 0; i <= 40; i++) { const a = (i / 40) * Math.PI / 2; prof.push(new THREE.Vector2(0.11 * Math.cos(a) + 0.0001, 0.03 + 0.17 + 0.11 * Math.sin(a))); }
  const wall = []; wall.push(new THREE.Vector2(0.11, 0.03)); for (const p of prof) wall.push(p);
  const glass = new THREE.Mesh(new THREE.LatheGeometry(wall, 96), glassMat(0xdfe8ff, { alpha: 0.03, rim: 0.35, pow: 3 })); glass.renderOrder = 6; g.add(glass);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.012, 24, 16), glassMat(0xdfe8ff, { alpha: 0.1, rim: 0.5 })); knob.position.y = 0.03 + 0.17 + 0.11 + 0.008; g.add(knob);
  const lab = canvasTex(512, 64, (x, w, h) => { x.fillStyle = '#15100c'; x.fillRect(0, 0, w, h); txt(x, 'AIR SACS × 100', w / 2, h / 2, { font: '500 34px "Geist Mono"', color: '#a39f97', track: 8 }); });
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(0.11, 0.014), new THREE.MeshBasicMaterial({ map: lab })); plate.position.set(0, 0.015, 0.1352); g.add(plate);
  // the airway: a small tube rising from the base, branching; the sacs cluster round its ends
  const pink = tissueMat('airway', { color: new THREE.Color(0xe7b2aa), roughness: 0.45, clearcoat: 0.3, sheen: 0.6, sheenColor: new THREE.Color(0xffd6cf) });
  const stem = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0.03, 0), new THREE.Vector3(0, 0.1, 0), new THREE.Vector3(0.01, 0.15, 0.005)]), 32, 0.008, 16), pink); g.add(stem);
  const sacs = []; let s = 7;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 26; i++) {
    const a = rnd() * Math.PI * 2, e = (rnd() - 0.3) * 1.2, r = 0.045 + rnd() * 0.035, c = new THREE.Vector3(0.01 + Math.cos(a) * Math.cos(e) * r, 0.19 + Math.sin(e) * r * 0.8, 0.005 + Math.sin(a) * Math.cos(e) * r);
    const m = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 24), pink.clone()); m.position.copy(c); const rr = 0.016 + rnd() * 0.008; m.userData = { r: rr, ph: rnd(), shut: i % 2 === 0 }; m.scale.setScalar(rr); m.castShadow = true; g.add(m); sacs.push(m);
  }
  shadows(g); glass.castShadow = false; knob.castShadow = false; g.traverse((o) => o.layers.enable(1));
  return { g, sacs };
}
// the trial: 108 people in four groups of 27; the fifth place (the do-nothing group) holds only a placard
const GROUPS = ['Cyclic sighing', 'Box breathing', 'Fast breathing', 'Meditation'];
const GP = (i) => (i < 4 ? new THREE.Vector3(PLINTH.x + (i % 2 ? 0.13 : -0.13), 0, PLINTH.z - 0.2 + Math.floor(i / 2) * 0.2) : new THREE.Vector3(PLINTH.x, 0, PLINTH.z + 0.22));   // two by two, the fifth in front
const GX = (i) => GP(i).x, GZ_ = (i) => GP(i).z;
function makeTrial(scene) {
  const g = new THREE.Group(); scene.add(g);
  const black = phys({ color: 0x0d0e10, roughness: 0.32, clearcoat: 0.6, clearcoatRoughness: 0.25 });
  const box = new THREE.Mesh(new RoundedBoxGeometry(PLINTH.w, PLINTH.top, PLINTH.d, 5, 0.012), black); box.position.set(PLINTH.x, PLINTH.top / 2, PLINTH.z); g.add(box);
  const dotGeo = new THREE.SphereGeometry(0.0085, 20, 14), dots = [];
  for (let i = 0; i < 108; i++) { const grp = Math.floor(i / 27), k = i % 27, cx = GX(grp), cz = GZ_(grp), col = k % 7, row = Math.floor(k / 7);
    const m = new THREE.Mesh(dotGeo, new THREE.MeshPhysicalMaterial({ color: 0xeceef1, roughness: 0.35, emissive: new THREE.Color(0xeceef1), emissiveIntensity: 0.25, transparent: true, opacity: 0 }));
    const home = new THREE.Vector3(cx + (col - 3) * 0.022, PLINTH.top + 0.0085, cz - 0.036 + row * 0.024); m.position.copy(home); m.userData = { grp, k, home, from: new THREE.Vector3(hash(i * 1.3) * 3 - 1.5, 1.5 + hash(i * 2.1) * 1.2, -1 + hash(i * 3.7) * 2.5) };
    m.castShadow = true; m.visible = false; g.add(m); dots.push(m); }
  // the empty fifth place: a dashed outline and a placard
  const pts = []; const x0 = GX(4) - 0.085, x1 = GX(4) + 0.085, z0 = GZ_(4) - 0.06, z1 = GZ_(4) + 0.06, y = PLINTH.top + 0.001;
  pts.push(new THREE.Vector3(x0, y, z0), new THREE.Vector3(x1, y, z0), new THREE.Vector3(x1, y, z1), new THREE.Vector3(x0, y, z1), new THREE.Vector3(x0, y, z0));
  const outline = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineDashedMaterial({ color: 0x8d9097, dashSize: 0.008, gapSize: 0.006, transparent: true, opacity: 0 })); outline.computeLineDistances(); g.add(outline);
  const cardTex = canvasTex(640, 420, (x, w, h) => { x.fillStyle = '#f2efe8'; x.fillRect(0, 0, w, h); x.strokeStyle = '#1b1b1d'; x.lineWidth = 4; x.strokeRect(24, 24, w - 48, h - 48);
    txt(x, 'GROUP 5', w / 2, 120, { font: '500 40px "Geist Mono"', color: '#55524c', track: 10 }); txt(x, 'DO NOTHING', w / 2, 220, { font: '800 84px Archivo', color: '#151517', track: 2 });
    txt(x, '0 people', w / 2, 320, { font: 'italic 400 56px "Instrument Serif", Georgia, serif', color: '#2a2928' }); });
  const card = new THREE.Group(); card.position.set(GX(4), PLINTH.top, GZ_(4) + 0.01); card.rotation.y = 0; g.add(card);
  const face = new THREE.Mesh(new THREE.PlaneGeometry(0.075, 0.049), new THREE.MeshPhysicalMaterial({ map: cardTex, roughness: 0.7 })); face.position.set(0, 0.03, 0); face.rotation.x = -0.2; card.add(face);
  const back = new THREE.Mesh(new THREE.BoxGeometry(0.077, 0.051, 0.002), black); back.position.set(0, 0.03, -0.0015); back.rotation.x = -0.2; card.add(back);
  // the effect: a vertical gauge, 0 at the plinth to 1 at the top (0.5 m), and a bar that rises to 0.35 (small to medium)
  const GH = 0.5, GZ = PLINTH.z + 0.05;
  const rulerTex = canvasTex(256, 1024, (x, w, h) => { x.clearRect(0, 0, w, h); x.strokeStyle = '#a8acb3'; x.lineWidth = 4;
    x.beginPath(); x.moveTo(40, 0); x.lineTo(40, h); x.stroke();
    for (let i = 0; i <= 20; i++) { const py = h - (i / 20) * h, big = i % 5 === 0; x.beginPath(); x.moveTo(40, py); x.lineTo(big ? 84 : 62, py); x.stroke(); }
    for (const [v, s2] of [[0.2, 'SMALL'], [0.5, 'MEDIUM'], [0.8, 'LARGE']]) txt(x, s2, 96, h - v * h, { font: '500 30px "Geist Mono"', color: '#c3c6cc', align: 'left', track: 5 }); });
  const ruler = new THREE.Mesh(new THREE.PlaneGeometry(0.125, GH), new THREE.MeshBasicMaterial({ map: rulerTex, transparent: true, opacity: 0, depthWrite: false })); ruler.position.set(PLINTH.x + 0.045, PLINTH.top + GH / 2, GZ); g.add(ruler);
  const barMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xeceef1), transparent: true, opacity: 0 });
  const bar = new THREE.Mesh(new THREE.BoxGeometry(0.03, 1, 0.012), barMat); bar.position.set(PLINTH.x - 0.012, PLINTH.top, GZ); g.add(bar);
  // columns of mood (up) and anxiety (down): for the sighing group and the meditation group
  const colMat = (o) => new THREE.MeshBasicMaterial({ color: new THREE.Color(0xeceef1), transparent: true, opacity: o, depthWrite: false });
  const cols = {}; for (const [key, gi] of [['moodS', 0], ['moodM', 3], ['anxS', 0], ['anxM', 3]]) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.15, 1, 0.012), colMat(0)); m.position.set(GX(gi), 0, GZ_(gi) - 0.05); g.add(m); cols[key] = m; }
  const twelve = []; for (let i = 0; i < 12; i++) { const m = new THREE.Mesh(dotGeo, new THREE.MeshPhysicalMaterial({ color: 0xeceef1, roughness: 0.35, emissive: new THREE.Color(0xeceef1), emissiveIntensity: 0.3, transparent: true, opacity: 0 }));
    m.userData = { from: new THREE.Vector3(PLINTH.x - 0.3 + (i % 6) * 0.12, PLINTH.top + 0.42 + Math.floor(i / 6) * 0.06, GZ - 0.02), to: new THREE.Vector3(PLINTH.x - 0.012, PLINTH.top + 0.01 + i * 0.0072, GZ) }; m.visible = false; g.add(m); twelve.push(m); }
  shadows(g); outline.castShadow = false; ruler.castShadow = bar.castShadow = false; g.traverse((o) => o.layers.enable(1));
  return { g, dots, outline, card, ruler, bar, barMat, cols, twelve };
}
// the breaths-a-minute dial (rises on the side table at the end): 0 to 30 over 270 degrees, 12 to 18 at rest
const ANG = (v) => ((-135 + 9 * v) * Math.PI) / 180;
function makeDial(scene) {
  const g = new THREE.Group(); g.position.copy(DIAL); scene.add(g);
  const dark = phys({ color: 0x121316, roughness: 0.38, clearcoat: 0.6, clearcoatRoughness: 0.25 }), alu = phys({ color: 0xcdcac4, metalness: 1, roughness: 0.3, clearcoat: 0.4 });
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(DIAL_R + 0.01, DIAL_R + 0.013, 0.012, 128), dark); plate.position.y = 0.006; g.add(plate);
  const bezel = new THREE.Mesh(new THREE.TorusGeometry(DIAL_R + 0.003, 0.003, 20, 160), alu); bezel.rotation.x = Math.PI / 2; bezel.position.y = 0.0125; g.add(bezel);
  const tex = canvasTex(1024, 1024, (x, w) => { const R = w / 2; x.fillStyle = '#0b0c0e'; x.fillRect(0, 0, w, w);
    for (let v = 0; v <= 30; v++) { const a = ANG(v), big = v % 6 === 0, r0 = R * (big ? 0.78 : 0.83), r1 = R * 0.9; x.strokeStyle = big ? '#e7e9ec' : '#8d9097'; x.lineWidth = big ? 7 : 3.5; x.beginPath(); x.moveTo(R + Math.sin(a) * r0, R - Math.cos(a) * r0); x.lineTo(R + Math.sin(a) * r1, R - Math.cos(a) * r1); x.stroke();
      if (v % 6 === 0) txt(x, String(v), R + Math.sin(a) * R * 0.64, R - Math.cos(a) * R * 0.64, { font: '600 74px Archivo', color: '#e7e9ec' }); }
    txt(x, 'BREATHS', R, R * 1.42, { font: '500 40px "Geist Mono"', color: '#9a9da4', track: 9 }); txt(x, 'A MINUTE', R, R * 1.53, { font: '500 30px "Geist Mono"', color: '#6d7077', track: 7 }); });
  const faceMat = new THREE.MeshPhysicalMaterial({ map: tex, roughness: 0.42, clearcoat: 0.5, emissive: new THREE.Color(0xffffff), emissiveMap: tex, emissiveIntensity: 0.08, transparent: true });
  const face = new THREE.Mesh(new THREE.CircleGeometry(DIAL_R, 128), faceMat); face.rotation.x = -Math.PI / 2; face.position.y = 0.0122; g.add(face);
  const flat = new THREE.Group(); flat.rotation.x = -Math.PI / 2; flat.position.y = 0.0128; g.add(flat);
  const setM = new THREE.Mesh(new THREE.RingGeometry(DIAL_R * 0.905, DIAL_R * 0.965, 64, 1, Math.PI / 2 - ANG(18), ANG(18) - ANG(12)), new THREE.MeshBasicMaterial({ color: ORANGE.clone().multiplyScalar(1.6), transparent: true, opacity: 0, depthWrite: false })); flat.add(setM);
  const n = new THREE.Group(); n.position.y = 0.0135; g.add(n);
  const nmat = new THREE.MeshPhysicalMaterial({ color: 0xf2f3f5, roughness: 0.35, clearcoat: 0.6, emissive: new THREE.Color(0xffffff), emissiveIntensity: 0.25, transparent: true });
  const bar = new THREE.Mesh(new THREE.BoxGeometry(0.002, 0.0009, DIAL_R * 0.86), nmat); bar.position.z = -DIAL_R * 0.43 + 0.007; n.add(bar);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.0045, 0.0045, 0.002, 40), nmat); n.add(hub);
  const logo = makeLogoRing(LOGO_R); logo.g.rotation.x = -Math.PI / 2; logo.g.position.y = 0.0142; g.add(logo.g);
  shadows(g); face.castShadow = false; g.traverse((o) => o.layers.enable(1));
  return { g, faceMat, setM, n, nmat, logo };
}

// ------------------------------------------------------------------ build
function extraKind(p) {
  const n = p.name.toLowerCase();
  if (p.system === 'respiratory' && /bronchial tree|bronchus|trachea/.test(n)) return 'airway';
  if (p.system === 'cardiac' && /wall of|valve|leaflet|cusp/.test(n)) return 'heart';
  if (n === 'diaphragm') return 'muscle';
  return undefined;
}
async function build(S, cfg) {
  const scene = S.scene;
  S.fog.near = 4; S.fog.far = 14;
  S.table.scale.set(3, 3, 1); S.tableMat.clearcoat = 0.1; S.tableMat.specularIntensity = 0.3;
  for (const m of [S.tableMat.map, S.tableMat.roughnessMap]) if (m) { m.wrapS = m.wrapT = THREE.RepeatWrapping; m.repeat.multiplyScalar(3); }
  buildBeats(); if (cfg.dbg && cfg.dbg.arm) W.armRest = cfg.dbg.arm;
  const meshes = await loadAnatomy(skeletonKind(extraKind));
  const inside = (n) => /bronch|trachea|wall of|valve|leaflet|cusp|diaphragm/i.test(n);
  const R = W.rig = buildRig(meshes, { assign: (n) => (inside(n) ? 'Seventh thoracic vertebra' : undefined) });
  W.body = new THREE.Group(); scene.add(W.body); R.root.position.copy(R.P0).negate(); W.body.add(R.root);
  for (const m of meshes) { m.castShadow = true; m.receiveShadow = true; m.layers.enable(1); }
  const T7 = R.seg['Seventh thoracic vertebra'];
  // ---- the ribs breathe: a group at the spine that widens and deepens
  W.cage = new THREE.Group(); W.cage.position.set(0, 0, 0); T7.g.add(W.cage);
  for (const m of meshes) if (/rib|costal|sternum|manubrium|xiphoid/i.test(m.userData.name) && m.parent === T7.g) { m.removeFromParent(); W.cage.add(m); }
  // ---- inside: the airways, the heart, the diaphragm
  W.airway = meshes.filter((m) => m.userData.tissue === 'airway');
  for (const m of W.airway) { m.material = tissueMat('airway', { color: new THREE.Color(0xd9a59c), roughness: 0.45, clearcoat: 0.35, transparent: true, opacity: 0.85 }); m.castShadow = false; }
  W.heart = meshes.filter((m) => m.userData.tissue === 'heart' && /wall of/i.test(m.userData.name));
  for (const m of meshes) if (m.userData.tissue === 'heart' && !/wall of/i.test(m.userData.name)) m.visible = false;
  W.heartG = new THREE.Group(); const hb = new THREE.Box3(); for (const m of W.heart) hb.expandByPoint(m.userData.home); const hc = hb.getCenter(new THREE.Vector3());
  W.heartG.position.copy(hc).sub(T7.pivot); T7.g.add(W.heartG); for (const m of W.heart) { m.removeFromParent(); m.position.copy(m.userData.home).sub(hc); W.heartG.add(m); }
  W.dia = meshes.find((m) => /^diaphragm$/i.test(m.userData.name));
  if (W.dia) { W.dia.material = tissueMat('muscle', { transparent: true, opacity: 0.55 }); W.diaHome = W.dia.position.clone(); }
  // ---- the lungs: rounded hulls round each bronchial tree, as glass
  W.lungs = [];
  for (const side of [-1, 1]) {
    const parts = W.airway.filter((m) => /bronchial tree|bronchus/i.test(m.userData.name) && Math.sign(m.userData.home.x) === side);
    const pts = parts.flatMap((m) => worldVerts(m, 3));
    const c = pts.reduce((a, v) => a.add(v), new THREE.Vector3()).multiplyScalar(1 / pts.length);
    const geo = softHull(pts, c, { k: 0.014, grow: 0.018 });
    const hil = parts.reduce((a, m) => (m.userData.home.y > a.y ? m.userData.home : a), new THREE.Vector3(0, -9, 0)).clone();   // the root of the tree: where it swells from
    const piv = new THREE.Group(); piv.position.copy(hil).sub(T7.pivot); T7.g.add(piv);
    const m = new THREE.Mesh(geo, glassMat(0xf3b9b2, { alpha: 0.13, rim: 0.8, pow: 2.0 })); m.position.copy(hil).negate(); m.renderOrder = 5; piv.add(m);
    W.lungs.push({ piv, m, side });
  }
  // ---- the factory stamp: on the front of the breastbone, across it
  { const st = R.byName.get('Body of sternum'); st.material = st.material.clone();
    W.stampSpot = stampSpot(st, { from: [0, 0.006, 0.12], dir: [0, 0, -1], spread: 0.004 });
    if (W.stampSpot) W.stamp = stamp(st, { canvas: stampCanvas(['HUMAN FACTORY', 'SETTINGS'], '', { frame: false }), center: W.stampSpot.center, normal: W.stampSpot.normal, up: [0, 1, 0], width: 0.04, depth: 0.03, opacity: 0.6 }); }
  // ---- seated on the stool
  makeStool(scene);
  const hipB = new THREE.Box3(); for (const m of meshes) if (/hip bone/i.test(m.userData.name)) for (const v of worldVerts(m, 3)) hipB.expandByPoint(v);
  W.sitP = new THREE.Vector3(0, SEAT - 0.012 + (R.P0.y - hipB.min.y), -0.02);
  // ---- the set
  makeSideTable(scene, SIDE); makeSideTable(scene, JAR, 0.32, 0.32);
  W.rec = makeRecorder(scene); W.jar = makeJar(scene); W.trial = makeTrial(scene); W.dial = makeDial(scene);
  // ---- light
  W.key = spot(scene, { color: 0xffe9d2, pos: new THREE.Vector3(-1.4, 2.6, 1.8), target: new THREE.Vector3(0, 0.9, 0.1), angle: 0.42, penumbra: 0.8, shadow: true, size: cfg.shadow ?? 1024 });
  W.key.shadow.camera.far = 7;
  W.rim = spot(scene, { color: 0xa9c4ff, pos: new THREE.Vector3(1.2, 2.2, -1.8), target: new THREE.Vector3(0, 1.0, 0), angle: 0.5, penumbra: 0.9 });
  W.fill = spot(scene, { color: 0xc8d6ff, pos: new THREE.Vector3(1.8, 1.2, 1.4), target: new THREE.Vector3(0, 0.9, 0), angle: 0.55, penumbra: 1 });
  W.plinthLight = spot(scene, { color: 0xfff1d8, pos: new THREE.Vector3(0.3, 1.9, 1.9), target: new THREE.Vector3(PLINTH.x, PLINTH.top, PLINTH.z), angle: 0.42, penumbra: 0.7 });
  W.sideLight = spot(scene, { color: 0xffe9d2, pos: new THREE.Vector3(1.3, 1.6, 0.9), target: SIDE.clone(), angle: 0.3, penumbra: 0.8 });
  W.jarLight = spot(scene, { color: 0xffe9d2, pos: new THREE.Vector3(-1.2, 1.6, 1.0), target: JAR.clone().add(new THREE.Vector3(0, 0.15, 0)), angle: 0.25, penumbra: 0.8 });
  W.heartLight = new THREE.PointLight(0xff9a8a, 0, 0.5, 2); W.heartG.add(W.heartLight);
  return { stamp: W.stampSpot, sitP: W.sitP.toArray(), lungs: W.lungs.map((l) => l.m.geometry.attributes.position.count), heart: W.heart.length, airway: W.airway.length, dia: !!W.dia, beats: BEATS.length };
}

// ------------------------------------------------------------------ the body over time
const ARM_REST = { dir: [0.02, -0.92, 0.4], twist: 0.8, elbow: 1.0 };   // hands resting on the belly
const _qa = new THREE.Quaternion();
function poseBody(t) {
  const R = W.rig, b = breathAt(t), dizzy = ss(T.drop, T.dizzy, t) * (1 - ss(T.never, T.water, t));
  bendSpine(R.seg, { lum: -0.05, tho: 0.06 - 0.08 * b, cer: 0.05 + 0.04 * Math.sin(t * 2.1) * dizzy, side: 0.05 * Math.sin(t * 1.7) * dizzy });
  const AR = W.armRest || ARM_REST; poseArm(R.arms.Right, AR); poseArm(R.arms.Left, AR);
  R.arms.Right.girdle.rotation.z += -0.035 * b; R.arms.Left.girdle.rotation.z += 0.035 * b;   // the shoulders rise a little on the breath in
  W.body.quaternion.identity(); W.body.position.copy(W.sitP); W.body.updateMatrixWorld(true);
  for (const Side of ['Right', 'Left']) {
    const G = R.legs[Side]; _qa.setFromAxisAngle(X, -Math.PI / 2); G.hip.quaternion.copy(_qa);
    const tgt = new THREE.Vector3(W.sitP.x + G.s * 0.13, G.A.y - G.ground + 0.002, W.sitP.z + 0.44);
    legIK(R, Side, tgt, new THREE.Quaternion(), Z);
  }
  W.body.updateMatrixWorld(true);
  // breathing: the ribs open, the lungs fill (mostly downward), the diaphragm drops
  W.cage.scale.set(1 + 0.03 * b, 1 + 0.008 * b, 1 + 0.045 * b);
  for (const L of W.lungs) L.piv.scale.set(1 + 0.05 * b, 1 + 0.1 * b, 1 + 0.06 * b);
  if (W.dia) W.dia.position.copy(W.diaHome).add(new THREE.Vector3(0, -0.025 * b, 0));
  // the heart beats
  const e = beatEnv(t); W.heartG.scale.setScalar(1 - 0.05 * e); W.heartLight.intensity = 0.05 + 0.25 * e;
  return { b, e, dizzy };
}

// ------------------------------------------------------------------ the camera: one path, no cuts
let CAM = null;
const CHEST = V3(0, 0.9, 0.04);
function buildCam() {
  const D = DIAL, J = JAR, P = PLINTH;
  return camTrack([
    { t: -3.0, p: V3(0.36, 1.04, 0.86), l: CHEST, fov: 30 },
    { t: 0.0, p: V3(0.32, 1.02, 0.82), l: CHEST, fov: 30, tens: 0.5 },                             // the chest breathes; the heart
    { t: 2.4, p: V3(0.4, 1.12, 0.86), l: V3(0.06, 0.9, 0.04), fov: 30, tens: 0.6 },
    { t: 4.0, p: V3(0.98, 1.02, 0.7), l: V3(0.6, 0.64, 0.1), fov: 30, tens: 0.2 },                 // and the recorder beside it
    { t: 5.6, p: V3(0.97, 0.97, 0.7), l: V3(0.6, 0.63, 0.11), fov: 30, tens: 0.4 },
    { t: 7.1, p: V3(0.18, 1.0, 0.78), l: CHEST, fov: 30, tens: 0.2 },                               // a sigh
    { t: 10.9, p: V3(0.17, 1.0, 0.76), l: CHEST, fov: 30, tens: 0.4 },
    { t: 12.2, p: V3(-0.38, 0.95, 0.52), l: V3(J.x, J.y + 0.17, J.z), fov: 32, tens: 0.2 },        // air sacs under the bell jar
    { t: 15.2, p: V3(-0.37, 0.95, 0.5), l: V3(J.x, J.y + 0.17, J.z), fov: 32, tens: 0.4 },
    { t: 16.9, p: V3(0.04, 1.42, 1.82), l: V3(P.x, P.top, P.z + 0.02), fov: 32, tens: 0.2 },               // the trial
    { t: 26.0, p: V3(0.05, 1.41, 1.8), l: V3(P.x, P.top, P.z + 0.02), fov: 32, tens: 0.3 },
    { t: 27.6, p: V3(0.02, 0.94, 2.1), l: V3(0.0, 0.76, 0.45), fov: 36, tens: 0.2 },             // cyclic sighing; the mood
    { t: 38.4, p: V3(0.03, 0.94, 2.08), l: V3(0.0, 0.75, 0.46), fov: 36, tens: 0.3 },
    { t: 39.9, p: V3(0.12, 0.74, 1.62), l: V3(GX(4), P.top + 0.03, GZ_(4)), fov: 28, tens: 0.2 },  // the fifth place: empty
    { t: 41.6, p: V3(0.13, 0.74, 1.6), l: V3(GX(4), P.top + 0.03, GZ_(4)), fov: 28, tens: 0.4 },
    { t: 43.2, p: V3(0.1, 0.66, 1.72), l: V3(P.x, P.top + 0.24, P.z + 0.05), fov: 32, tens: 0.2 },   // twelve trials: small to medium
    { t: 50.2, p: V3(0.11, 0.66, 1.7), l: V3(P.x, P.top + 0.24, P.z + 0.05), fov: 32, tens: 0.3 },
    { t: 51.8, p: V3(0.98, 0.95, 0.72), l: V3(0.62, 0.58, 0.16), fov: 30, tens: 0.2 },              // longer out-breaths, on paper
    { t: 57.4, p: V3(0.97, 0.94, 0.7), l: V3(0.62, 0.58, 0.16), fov: 30, tens: 0.3 },
    { t: 58.9, p: V3(0.3, 1.02, 0.86), l: CHEST, fov: 32, tens: 0.2 },                               // the drill
    { t: 67.2, p: V3(0.32, 1.02, 0.88), l: CHEST, fov: 32, tens: 0.3 },
    { t: 69.0, p: V3(0.75, 1.15, 2.3), l: V3(0.0, 0.72, 0.2), fov: 34, tens: 0.2 },                 // calm: the whole room
    { t: 74.0, p: V3(0.78, 1.16, 2.26), l: V3(0.05, 0.72, 0.2), fov: 34, tens: 0.3 },
    { t: 75.6, p: V3(0.85, 1.12, 0.78), l: V3(D.x, D.y + 0.01, D.z), fov: 30 },
    { t: T.logo, p: V3(D.x, D.y + 0.5, D.z + 0.005), l: V3(D.x, D.y + 0.0142, D.z), fov: 30, stop: true },   // straight down on the dial: the logo
  ]);
}
function camPose(S, t) {
  const v = S.cfg.view; if (v && typeof v === 'object') return v;
  if (!CAM) CAM = buildCam();
  let P;
  if (t <= T.logo) P = CAM(t); else { const Q = CAM(T.logo), k = ss(T.logo, T.end, t); P = { p: [Q.p[0], lerp(Q.p[1], Q.p[1] - 0.04, k), Q.p[2]], l: Q.l, fov: 30 }; }
  // dizzy: the view sways a little in the drill
  const dz = ss(T.drop, T.dizzy, t) * (1 - ss(T.never - 0.2, T.water - 0.6, t));
  if (dz > 0) P = { ...P, l: [P.l[0] + 0.025 * dz * Math.sin(t * 1.9), P.l[1] + 0.012 * dz * Math.sin(t * 2.7 + 1), P.l[2]] };
  return P;
}
function focusAt(S, t, P) { return Math.hypot(P.p[0] - P.l[0], P.p[1] - P.l[1], P.p[2] - P.l[2]); }

// ------------------------------------------------------------------ one moment of the film
function update(S, t) {
  const scene = S.scene, endDark = ss(T.final + 0.3, T.logo - 0.3, t);
  const o = poseBody(t);
  setPaper(W.rec, t);
  // ---- the air sacs: some fold shut; the sigh opens them; two fold again
  { const open = s5(T.reopen - 0.1, T.tiny + 0.5, t), refold = s5(T.fold - 0.1, T.shut + 0.5, t);
    W.jar.sacs.forEach((m, i) => { const shut = m.userData.shut, ref = shut && i % 3 !== 1;
      const k = shut ? Math.max(1 - open, ref ? refold : 0) : 0, br = 0.04 * o.b;
      const sx = lerp(1, 0.72, k), sy = lerp(1, 0.2, k); m.scale.set(m.userData.r * (sx + br), m.userData.r * (sy + br), m.userData.r * (sx + br));
      m.material.color.setHex(0xe7b2aa).multiplyScalar(lerp(1, 0.6, k)); }); }
  // ---- the trial
  { const Tr = W.trial, inA = (i) => ss(T.hundred - 0.4 + (i % 27) * 0.03 + Math.floor(i / 27) * 0.18, T.hundred + 0.6 + (i % 27) * 0.03 + Math.floor(i / 27) * 0.18, t);
    const fadeOthers = ss(T.lifted - 0.4, T.lifted + 0.2, t) * (1 - ss(T.across - 0.6, T.across, t)), gone = ss(T.across - 0.5, T.across + 0.3, t);
    Tr.dots.forEach((m, i) => { const a = inA(i); m.visible = a > 0.001 && gone < 0.999; m.position.lerpVectors(m.userData.from, m.userData.home, s5(0, 1, a));
      const other = m.userData.grp === 1 || m.userData.grp === 2; m.material.opacity = a * (1 - (other ? 0.75 * fadeOthers : 0)) * (1 - gone); });
    const mood = ss(T.good - 0.2, T.more + 0.3, t) * (1 - ss(T.anxious - 0.6, T.anxious, t)), anx = ss(T.anxious - 0.3, T.anxious + 0.3, t) * (1 - ss(T.across - 0.8, T.across, t)), drop = s5(T.dropped, T.much + 0.3, t);
    const setCol = (m, h, o2) => { m.visible = o2 > 0.002 && h > 0.002; m.scale.y = Math.max(0.001, h); m.position.y = PLINTH.top + h / 2; m.material.opacity = o2; };
    setCol(Tr.cols.moodS, 0.2 * s5(T.lifted, T.more, t), 0.7 * mood); setCol(Tr.cols.moodM, 0.11 * s5(T.lifted, T.more, t), 0.7 * mood);
    setCol(Tr.cols.anxS, lerp(0.2, 0.09, drop), 0.45 * anx); setCol(Tr.cols.anxM, lerp(0.2, 0.09, drop), 0.45 * anx);
    Tr.outline.material.opacity = 0.8 * pulse(t, T.trial - 0.2, T.across, 0.4); Tr.card.visible = t > T.no - 1.0 && t < T.across + 0.5; Tr.card.position.y = PLINTH.top - 0.06 * (1 - s5(T.no - 0.9, T.no - 0.2, t)) - 0.06 * s5(T.across - 0.2, T.across + 0.4, t);
    const ru = pulse(t, T.across - 0.2, T.longer, 0.5); Tr.ruler.material.opacity = ru; const v = 0.35 * s5(T.cut - 0.2, T.medium + 0.2, t);
    Tr.twelve.forEach((m, i) => { const a = ss(T.twelve - 0.3 + i * 0.05, T.twelve + 0.1 + i * 0.05, t), d = s5(T.trials + 0.6 + i * 0.06, T.cut + 0.1 + i * 0.06, t);
      m.visible = a > 0.001 && d < 0.999; m.position.lerpVectors(m.userData.from, m.userData.to, d); m.material.opacity = a * (1 - ss(0.85, 1, d)); });
    Tr.bar.scale.y = Math.max(0.001, v * 0.5); Tr.bar.position.y = PLINTH.top + (v * 0.5) / 2; Tr.barMat.opacity = ru * ss(T.cut - 0.3, T.cut, t); Tr.bar.visible = Tr.barMat.opacity > 0.002; }
  // ---- the dial rises at the end; set to 12 to 18; the logo
  { const D = W.dial, up = s5(T.final - 0.6, T.final + 0.3, t); D.g.position.y = DIAL.y - 0.03 * (1 - up); D.g.visible = up > 0.001;
    const v = lerp(0, 15, s5(T.final, T.settings, t)); D.n.rotation.y = -ANG(v); D.nmat.opacity = 1 - ss(T.logo - 0.6, T.logo - 0.2, t);
    D.setM.material.opacity = ss(T.settings - 0.2, T.settings + 0.3, t) * (1 - ss(T.logo - 0.6, T.logo - 0.2, t)); D.faceMat.opacity = 1 - 0.85 * ss(T.settings, T.logo - 0.2, t);
    const logoK = s5(T.final + 0.4, T.logo - 0.25, t); D.logo.set({ weight: logoK, white: logoK, hours: 0, hand: ss(T.logo - 0.4, T.logo - 0.15, t), handScale: outBack(clamp01((t - (T.logo - 0.4)) / 0.35), 1.8) }); }
  // ---- light
  const fig = 1 - endDark;
  W.key.intensity = 16 * fig; W.rim.intensity = 3.0 * fig; W.fill.intensity = 1.0 * fig;
  W.plinthLight.intensity = 6 * ss(T.stanford - 0.8, T.stanford, t) * (1 - ss(T.longer - 0.4, T.longer + 0.4, t)) * fig;
  W.sideLight.intensity = 3 * fig; W.jarLight.intensity = 4 * fig;
  S.tableMat.color.setScalar(0.35 * (1 - endDark * 0.9)); scene.environmentIntensity = 0.12 * (1 - endDark); S.reflAmt = 0.6 * (1 - endDark);
}

// ------------------------------------------------------------------ the words on screen
const CAPS = [
  { t0: 0.35, t1: 3.2, top: 292, size: 84, html: 'Breathe in: your heart<br><em>speeds up</em> a little' },
  { t0: 3.41, t1: 5.5, top: 300, size: 92, html: 'Breathe out: it <em>slows</em>' },
  { t0: 5.87, t1: 9.4, top: 292, size: 80, html: 'You already <em>sigh</em><br>every few minutes' },
  { t0: 9.61, t1: 12.2, top: 292, size: 80, html: 'A second breath<br><em>on top of the first</em>' },
  { t0: 12.37, t1: 15.5, top: 292, size: 80, html: 'to reopen tiny air sacs<br>that <em>fold shut</em>' },
  { t0: 15.86, t1: 20.3, top: 292, size: 78, html: 'A Stanford trial:<br><em>108 people</em>, mostly students' },
  { t0: 20.42, t1: 26.2, top: 292, size: 76, html: '<em>5 minutes a day</em> of breathing<br>or meditation, for a month' },
  { t0: 26.53, t1: 30.0, top: 292, size: 80, html: 'Sighing on purpose: two in,<br><em>one long breath out</em>' },
  { t0: 30.18, t1: 34.2, top: 292, size: 80, html: 'lifted good mood<br><em>more than meditation</em>' },
  { t0: 34.64, t1: 38.5, top: 292, size: 80, html: 'Anxiety dropped<br><em>just as much</em> with meditation' },
  { t0: 38.73, t1: 41.6, top: 292, size: 84, html: 'No <em>do-nothing</em> group' },
  { t0: 42.08, t1: 48.4, top: 292, size: 78, html: '12 trials: stress cut by a<br><em>small to medium</em> amount' },
  { t0: 48.68, t1: 50.6, top: 300, size: 92, html: 'Useful. <em>Not magic.</em>' },
  { t0: 51.08, t1: 52.8, top: 300, size: 92, html: 'Longer <em>out-breaths?</em>' },
  { t0: 52.96, t1: 57.8, top: 292, size: 78, html: '12 weeks: not clearly better<br>than <em>equal breaths</em>' },
  { t0: 58.29, t1: 60.9, top: 292, size: 84, html: 'Skip hard, fast<br><em>breathing drills</em>' },
  { t0: 61.08, t1: 64.9, top: 292, size: 78, html: 'Less carbon dioxide,<br>and you can get <em>dizzy</em>' },
  { t0: 65.03, t1: 67.9, top: 292, size: 84, html: 'Never in or<br><em>near water</em>' },
  { t0: 68.31, t1: 72.7, top: 292, size: 76, html: 'Struggling to cope with stress,<br>or <em>nothing helps?</em>' },
  { t0: 72.84, t1: 74.6, top: 300, size: 100, html: 'See a <em>doctor</em>' },
  { t0: 74.88, t1: 99, top: 360, size: 96, html: 'Back to<br><em>factory settings.</em>' },
];
const OVL = {};
function overlayInit(S) {
  const O = S.O, tag = (cls, txt2, size, bsize) => { const e = O.tag(cls, txt2); e.style.fontSize = size + 'px'; const b = e.querySelector('b'); if (b && bsize) b.style.fontSize = bsize + 'px'; return e; };
  OVL.hr = tag('tag', 'Heart rate<b>speeding up</b>', 24, 44); OVL.hrB = OVL.hr.querySelector('b');
  OVL.sacs = tag('tag', 'Air sacs<b>reopened</b>', 24, 40);
  OVL.groups = GROUPS.map((g) => tag('tag', g, 18));
  OVL.time = tag('tag', 'Each day<b>5 min · 30 days</b>', 22, 38);
  OVL.mood = tag('tag', 'Good mood<b>up more with sighing</b>', 22, 36);
  OVL.anx = tag('tag', 'Anxiety<b>down the same</b>', 22, 36);
  OVL.twelve = tag('tag', 'Trials<b>12</b>', 22, 44);
  OVL.ratio = tag('tag', 'Longer out-breaths<b>no clear gain</b>', 22, 36);
  OVL.co2 = tag('tag', 'Carbon dioxide<b>down</b>', 22, 40);
  OVL.rest = tag('tag', 'At rest<b>12 to 18 a minute</b>', 24, 40);
}
function overlay(S, t) {
  const Hpos = W.heartG.getWorldPosition(new THREE.Vector3());
  OVL.hrB.textContent = breathAt(t + 0.05) - breathAt(t - 0.05) >= 0 && t < T.out ? 'speeding up' : 'slowing';   // words, not numbers: the claim is the direction
  place(S, OVL.hr, Hpos, 70, -40, pulse(t, T.heart - 0.2, T.already + 0.2));
  place(S, OVL.sacs, new THREE.Vector3(JAR.x, JAR.y + 0.3, JAR.z), 30, -40, pulse(t, T.tiny, T.fold + 0.1));
  GROUPS.forEach((g, i) => place(S, OVL.groups[i], new THREE.Vector3(GX(i), PLINTH.top, GZ_(i) + 0.06), -60, 4, pulse(t, T.people, T.across - 0.5) * (i === 1 || i === 2 ? 1 - 0.7 * ss(T.lifted - 0.4, T.lifted + 0.2, t) : 1)));
  place(S, OVL.time, new THREE.Vector3(PLINTH.x + 0.45, PLINTH.top + 0.1, PLINTH.z - 0.1), -120, -100, pulse(t, T.five - 0.2, T.sighing - 0.3));
  place(S, OVL.mood, new THREE.Vector3(GX(0), PLINTH.top + 0.22, GZ_(0) - 0.05), -60, -70, pulse(t, T.good, T.anxious - 0.4));
  place(S, OVL.anx, new THREE.Vector3(GX(3), PLINTH.top + 0.22, GZ_(3) - 0.05), -60, -70, pulse(t, T.dropped, T.no - 1.2));
  place(S, OVL.twelve, new THREE.Vector3(PLINTH.x - 0.3, PLINTH.top + 0.5, PLINTH.z + 0.03), -40, -80, pulse(t, T.trials - 0.2, T.cut + 0.6));
  place(S, OVL.ratio, new THREE.Vector3(SIDE.x, SIDE.y + 0.1, SIDE.z + 0.1), -80, -120, pulse(t, T.twelveweek - 0.2, T.skip - 0.3));
  place(S, OVL.co2, new THREE.Vector3(0.0, 1.45, 0.05), 60, -40, pulse(t, T.drop - 0.1, T.never));
  place(S, OVL.rest, new THREE.Vector3(DIAL.x, DIAL.y + 0.02, DIAL.z), 60, -60, pulse(t, T.settings - 0.3, T.logo - 0.4));
  const c = new THREE.Vector3(DIAL.x, DIAL.y + 0.0142, DIAL.z);
  logoEnd(S, t, { t0: T.logo, center: c, edge: c.clone().add(new THREE.Vector3(0, 0, LOGO_R)) });
}

makeFilm({
  T, caps: CAPS, subs: [], build, update, pose: camPose, overlay, overlayInit, focus: focusAt,
  stage: { bg: 0x07080a, reflSize: 6, env: 0.12, far: 30 },
  aperture: [[0, 0.003], [12.2, 0.003], [16.8, 0.002], [39.9, 0.004], [43.2, 0.002], [51.8, 0.003], [58.9, 0.003], [69, 0.0015], [75.6, 0.003]],
  bloom: [[0, 0.45], [74, 0.55]],
  fast: [[58.9, 64.9, 2]],
});

// Human Factory Settings · Film 9 "The breath that calms you down" (new direction, 6 Oct 2026) · one continuous shot, 9:16.
// A skeleton sits on a stool, breathing like something is chasing it, while sticky notes slap onto its skull: CALM DOWN,
// CALM DOWN., CALM DOWN!! (the gag). "Your body has a better way": the notes peel off and flutter away. Glass lungs fill
// round their airways, the heart beats a little faster on each breath in and slower on each breath out, and a chart
// recorder beside it prints both. Under a bell jar, air sacs a hundred times life size fold shut; a sigh, a second breath
// on top of the first, opens them again. The sigh on purpose: in, in, one long breath out. The Stanford study: good mood
// rises more with sighing than with meditation; twelve trials: stress down by a small to medium amount. A magic wand
// sparks and falls over: a useful tool, not a magic one. Fast drills make the room sway. See a doctor; get help now if
// you need it. A dial set to five minutes a day becomes the logo.
import { THREE, ORANGE, ss, s5, lerp, clamp01, hash, camTrack, phys, glowMat, shadows, spot, RoundedBoxGeometry,
  loadAnatomy, tissueMat, V3, place, logoEnd, makeFilm, outBack, stamp, stampCanvas, stampSpot, noiseTex } from '../kit.js';
import { buildRig, skeletonKind, legIK, bendSpine, poseArm, worldVerts, avgV, clearArms } from '../rig.js';
import { makeLogoRing } from '../props.js';
import { ConvexHull } from 'three/addons/math/ConvexHull.js';

//@HANDS@

// ------------------------------------------------------------------ timing, from the voice guide (word starts)
const T = {
  end: 79.73, logo: 77.21,
  you: 0.35, keep: 0.80, telling: 1.03, yourself: 1.26, calm: 1.84, down: 2.14, while: 2.41, breathing: 2.90, like: 3.28, something: 3.70, chasing: 4.48, you2: 4.94,
  your: 5.71, body: 6.15, has: 6.45, better: 6.77, way: 7.03,
  your2: 8.28, built: 9.33, brake: 9.78, reach: 10.52, when: 10.78, breathe: 11.51, in: 11.83, heart: 12.26, speeds: 12.69, up: 13.32, little: 13.72, when2: 14.17, breathe2: 14.56, out: 14.95, slows: 15.31, down2: 16.08,
  your3: 17.23, already: 17.97, sighs: 18.49, every: 18.74, minutes: 19.19, noticing: 20.25, taking: 20.88, second: 21.59, breath: 21.97, reopen: 22.56, tiny: 23.05, air: 23.53, sacs: 23.90, lungs: 24.68,
  so: 26.12, sigh: 26.66, purpose: 27.03, breathe3: 27.41, in2: 28.15, twice: 28.20, then: 28.65, let: 28.89, one: 29.13, long: 29.39, slow: 29.77, breath2: 30.22, out2: 30.67,
  in3: 31.65, stanford: 32.26, study: 32.55, mostly: 33.02, students: 33.42, five: 33.98, minutes2: 34.49, day: 35.22, this: 35.58, month: 36.07, lifted: 36.39, mood: 37.02, more: 37.45, meditation: 37.89, did: 38.82,
  and2: 39.05, across: 39.67, twelve: 40.25, trials: 40.56, breathing2: 41.10, exercises: 41.54, cut: 42.63, stress: 42.86, small: 43.87, medium: 44.51, amount: 44.96,
  its: 45.86, useful: 46.49, tool: 46.76, not: 47.10, magic: 47.45, one2: 47.99,
  do: 49.07, five2: 49.82, minutes3: 50.07, day2: 50.54, skip: 50.99, hard: 51.14, fast: 51.49, drills: 52.57, because: 53.12, dizzy: 54.80,
  and3: 55.59, never: 56.03, practise: 56.34, holding: 57.59, near: 58.70, water: 59.08,
  if: 60.31, stress2: 60.62, cope: 62.04, nothing: 62.79, helping: 64.20, talk: 64.48, doctor: 65.31,
  if2: 66.42, someone: 67.24, needs: 67.96, help: 68.30, now: 68.91, harmed: 70.61, call: 71.69, emergency: 71.91, services: 73.07,
  final: 74.95, factory: 76.16, settings: 76.53,
};

// ------------------------------------------------------------------ the set (metres; the skeleton faces +z; +x is its left)
const W = {}; window.HFS_W = W;
const SEAT = 0.47;                                                     // the stool's top
const SIDE = new THREE.Vector3(0.62, 0.62, 0.08);                      // the side table's top (the skeleton's left): the chart recorder
const JAR = new THREE.Vector3(-0.62, 0.62, 0.1);                       // the bell jar's base top (its right)
// the low plinth in front: the study. It stands clear of the skeleton's feet, turned to face +x, so a camera on that side sees it
// against the dark room and not against the legs; it rises out of the floor for the study and sinks after the wand
const PLINTH = { x: 0.05, z: 1.15, ry: Math.PI / 2, w: 0.45, d: 0.4, top: 0.36 };
const PL = (x, y, z) => new THREE.Vector3(PLINTH.x + x * Math.cos(PLINTH.ry) + z * Math.sin(PLINTH.ry), y, PLINTH.z - x * Math.sin(PLINTH.ry) + z * Math.cos(PLINTH.ry));
const RISE = [31.3, 32.8], SINK = [49.6, 50.6];
const plinthUp = (t) => s5(RISE[0], RISE[1], t) * (1 - s5(SINK[0], SINK[1], t));
const pDyAt = (t) => -(PLINTH.top + 0.02) * (1 - plinthUp(t));
const DIAL = new THREE.Vector3(0.7, SIDE.y, 0.175), DIAL_R = 0.062, LOGO_R = 0.048;
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
const PANIC = [0.4, 5.6], DRILL = [51.0, 54.9];
const SIGHS = [{ t0: 21.25, a1: 0.7, a2: 0.55, b: 2.6 }, { t0: 27.3, a1: 0.85, a2: 0.5, b: 3.1 }];   // the body's own (in the jar), then on purpose
let SEGS = null;
function buildSegs() {
  SEGS = []; const segs = [], add = (t0, a, b, k = 1, hold = 0) => segs.push({ t0, a, b, k, hold });
  for (let s = PANIC[0]; s < PANIC[1] - 0.5; s += 0.95) add(s, 0.42, 0.48, 0.62);                    // like something is chasing you
  add(6.0, 1.3, 2.3, 0.8);                                                                            // a better way
  add(8.4, 1.4, 1.5, 0.55);
  add(11.35, 2.4, 2.5, 1.0, 0.55);                                                                    // in: faster; out: slower
  for (let s = 17.4; s < 21.0; s += 3.6) add(s, 1.5, 2.0, 0.55);
  for (const g of SIGHS) segs.push({ sigh: true, ...g });
  for (let s = 24.8; s < 27.0; s += 3.8) add(s, 1.2, 1.4, 0.5);
  for (let s = 32.0; s < 50.5; s += 4.6) add(s, 1.7, 2.6, 0.55);                                     // quiet
  for (let s = DRILL[0]; s < DRILL[1] - 0.3; s += 0.92) add(s, 0.42, 0.46, 1.0);                     // the hard, fast drill
  for (let s = 55.6; s < 82; s += 4.9) add(s, 1.9, 2.9, 0.55);                                       // calm
  segs.sort((p, q) => p.t0 - q.t0); SEGS = [];
  for (const g of segs) { g.v0 = breathAt(g.t0); SEGS.push(g); }                                     // each breath starts where the last one is, so nothing jumps
}
function segAt(g, t) {                                                                                 // one breath's lung volume at t, or null once it is over
  const u = t - g.t0;
  if (g.sigh) {
    if (u >= g.a1 + 0.08 + g.a2 + 0.15 + g.b) return null;
    const i1 = s5(0, g.a1, u) * 0.72, i2 = s5(g.a1 + 0.08, g.a1 + 0.08 + g.a2, u) * 0.28, o = 1 - s5(g.a1 + g.a2 + 0.15, g.a1 + g.a2 + 0.15 + g.b, u);
    return g.v0 * (1 - s5(0, g.a1, u)) + (i1 + i2) * o * 1.15;
  }
  if (u >= g.a + g.hold + g.b) return null;
  const up = g.a > 0 ? s5(0, g.a, u) : 1, dn = g.b > 0 ? 1 - s5(g.a + g.hold, g.a + g.hold + g.b, u) : 1;
  return (g.v0 + (g.k - g.v0) * up) * dn;
}
function breathAt(t) {
  let v = 0;
  for (const g of SEGS) { if (t < g.t0) break; const x = segAt(g, t); if (x !== null) v = x; }
  return v;
}
// the heart: a little faster while the lungs fill, slower while they empty (respiratory sinus arrhythmia); faster in a panic and in the drill
let BEATS = null;
function buildBeats() {
  BEATS = []; let ph = 0, prev = breathAt(0);
  for (let t = 0; t < T.end + 1; t += 0.002) {
    const b = breathAt(t), db = (b - prev) / 0.002; prev = b;
    const fast = ss(0.2, 0.9, t) * (1 - ss(5.8, 8.0, t)) + ss(50.8, 51.6, t) * (1 - ss(55.0, 57.0, t));
    const hr = 64 + 9 * Math.tanh(db * 1.4) * (1 - 0.6 * fast) + 18 * fast;            // beats a minute
    ph += (hr / 60) * 0.002; if (ph >= 1) { ph -= 1; BEATS.push(t); }
  }
}
function beatEnv(t) { let e = 0; for (const b of BEATS) { if (b > t) break; const u = t - b; if (u < 0.5) e = Math.max(e, Math.exp(-u * 9) * Math.min(1, u * 40)); } return e; }

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
  const pts = [new THREE.Vector3(0, 0.025, 0.062), new THREE.Vector3(0, 0.02, 0.14), new THREE.Vector3(0, 0.004, 0.2), new THREE.Vector3(0, -0.01, 0.235), new THREE.Vector3(0, -0.06, 0.25), new THREE.Vector3(0, -0.2, 0.255)];
  const curve = new THREE.CatmullRomCurve3(pts), N = 120, Wp = 0.12, L = curve.getLength();
  const pos = new Float32Array((N + 1) * 2 * 3), uv = new Float32Array((N + 1) * 2 * 2), idx = [];
  for (let i = 0; i <= N; i++) { const p = curve.getPointAt(i / N); for (let s = 0; s < 2; s++) { const k = i * 2 + s; pos.set([p.x + (s ? Wp / 2 : -Wp / 2), p.y, p.z], k * 3); uv.set([i / N, s], k * 2); } }
  for (let i = 0; i < N; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); pg.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); pg.setIndex(idx); pg.computeVertexNormals();
  tex.rotation = 0; tex.center.set(0, 0);
  const paper = new THREE.Mesh(pg, new THREE.MeshPhysicalMaterial({ map: tex, roughness: 0.8, side: THREE.DoubleSide })); paper.castShadow = true; paper.receiveShadow = true; g.add(paper);
  shadows(g); paper.castShadow = false; g.traverse((o) => o.layers.enable(1));
  return { g, tex, L, Wc, PX, TT0, paper, body };
}
function setPaper(R, t) { const span = R.L / PAPER_V; R.tex.repeat.set(-(span * R.PX) / R.Wc, 1); R.tex.offset.set(((t - R.TT0) * R.PX) / R.Wc, 0); }
// the bell jar: air sacs a hundred times life size, round the end of a small airway
function makeJar(scene) {
  const g = new THREE.Group(); g.position.copy(JAR); scene.add(g);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.135, 0.03, 96), phys({ color: 0x15100c, roughness: 0.45, clearcoat: 0.5 })); base.position.y = 0.015; g.add(base);
  const prof = []; for (let i = 0; i <= 40; i++) { const a = (i / 40) * Math.PI / 2; prof.push(new THREE.Vector2(0.11 * Math.cos(a) + 0.0001, 0.03 + 0.17 + 0.11 * Math.sin(a))); }
  const wall = [new THREE.Vector2(0.11, 0.03), ...prof];
  const glass = new THREE.Mesh(new THREE.LatheGeometry(wall, 96), glassMat(0xdfe8ff, { alpha: 0.03, rim: 0.35, pow: 3 })); glass.renderOrder = 6; g.add(glass);
  const lab = canvasTex(512, 64, (x, w, h) => { x.fillStyle = '#15100c'; x.fillRect(0, 0, w, h); txt(x, 'AIR SACS × 100', w / 2, h / 2, { font: '500 34px "Geist Mono"', color: '#a39f97', track: 8 }); });
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(0.11, 0.014), new THREE.MeshBasicMaterial({ map: lab })); plate.position.set(0, 0.015, 0.1352); g.add(plate);
  const pink = tissueMat('airway', { color: new THREE.Color(0xe7b2aa), roughness: 0.45, clearcoat: 0.3, sheen: 0.6, sheenColor: new THREE.Color(0xffd6cf) });
  const stem = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0.03, 0), new THREE.Vector3(0, 0.1, 0), new THREE.Vector3(0.01, 0.15, 0.005)]), 32, 0.008, 16), pink); g.add(stem);
  const sacs = [], SAC = new THREE.SphereGeometry(0.02, 32, 24); let s = 7;   // real size (the collision audit voxelises each shape at its own size)
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 26; i++) {
    const a = rnd() * Math.PI * 2, e = (rnd() - 0.3) * 1.2, r = 0.045 + rnd() * 0.035, c = new THREE.Vector3(0.01 + Math.cos(a) * Math.cos(e) * r, 0.19 + Math.sin(e) * r * 0.8, 0.005 + Math.sin(a) * Math.cos(e) * r);
    const m = new THREE.Mesh(SAC, pink.clone()); m.position.copy(c); const rr = 0.016 + rnd() * 0.008; m.userData = { r: rr / 0.02, ph: rnd(), shut: i % 2 === 0 }; m.scale.setScalar(rr / 0.02); m.castShadow = true; g.add(m); sacs.push(m);
  }
  const shut = sacs.filter((m) => m.userData.shut); shut.forEach((m, j) => { m.userData.d = (((j * 7) % shut.length) / (shut.length - 1)) * 1.07; });   // they reopen one after another
  shadows(g); glass.castShadow = false; g.traverse((o) => o.layers.enable(1));
  return { g, sacs };
}
// the study: two white columns (good mood: sighing, meditation) on a low plinth; twelve trials drop into a bar against a scale.
// Built in the plinth's own frame (its front is local +z), then turned with it.
const GH = 0.3, GZ = -0.03;                                            // the scale: 0 at the plinth to 1 at GH; SMALL, MEDIUM, LARGE at 0.2, 0.5, 0.8
const COLS = [{ x: -0.075, h: 0.2 }, { x: 0.075, h: 0.2 * 1.22 / 1.89 }];   // good mood, average daily change: cyclic sighing 1.89, meditation 1.22 (Balban 2023)
function makeStudy(scene) {
  const g = new THREE.Group(); g.position.set(PLINTH.x, 0, PLINTH.z); g.rotation.y = PLINTH.ry; scene.add(g);
  const black = phys({ color: 0x0d0e10, roughness: 0.32, clearcoat: 0.6, clearcoatRoughness: 0.25 });
  const box = new THREE.Mesh(new RoundedBoxGeometry(PLINTH.w, PLINTH.top, PLINTH.d, 5, 0.012), black); box.position.set(0, PLINTH.top / 2, 0); g.add(box);
  const white = (o = 0) => new THREE.MeshPhysicalMaterial({ color: 0xeceef1, roughness: 0.4, clearcoat: 0.4, emissive: new THREE.Color(0xeceef1), emissiveIntensity: 0.18, transparent: true, opacity: o });
  const cols = COLS.map((c) => { const m = new THREE.Mesh(new RoundedBoxGeometry(0.08, 1, 0.08, 3, 0.008), white()); m.position.set(c.x, PLINTH.top, GZ); m.visible = false; m.castShadow = true; g.add(m); return m; });
  const rulerTex = canvasTex(320, 1024, (x, w, h) => { x.clearRect(0, 0, w, h); x.strokeStyle = '#a8acb3'; x.lineWidth = 5;
    x.beginPath(); x.moveTo(40, 0); x.lineTo(40, h); x.stroke();
    for (let i = 0; i <= 20; i++) { const py = Math.min(h - 3, Math.max(3, h - (i / 20) * h)), big = i % 5 === 0; x.beginPath(); x.moveTo(40, py); x.lineTo(big ? 88 : 64, py); x.stroke(); }
    for (const [v, s2] of [[0.2, 'SMALL'], [0.5, 'MEDIUM'], [0.8, 'LARGE']]) txt(x, s2, 100, h - v * h, { font: '500 40px "Geist Mono"', color: '#c3c6cc', align: 'left', track: 5 }); });
  const RW = GH * (320 / 1024);                                        // keeps the canvas's shape
  const ruler = new THREE.Mesh(new THREE.PlaneGeometry(RW, GH), new THREE.MeshBasicMaterial({ map: rulerTex, transparent: true, opacity: 0, depthWrite: false })); ruler.position.set(0.0035 - RW * (40 / 320) + RW / 2, PLINTH.top + GH / 2, GZ); g.add(ruler);
  const barMat = white(0);
  const bar = new THREE.Mesh(new THREE.BoxGeometry(0.024, 1, 0.012), barMat); bar.position.set(-0.012, PLINTH.top, GZ); bar.visible = false; g.add(bar);
  const dotGeo = new THREE.SphereGeometry(0.0075, 20, 14);
  const twelve = []; for (let i = 0; i < 12; i++) { const m = new THREE.Mesh(dotGeo, white(0)); m.material.emissiveIntensity = 0.3;
    m.userData = { from: new THREE.Vector3(-0.15 + (i % 4) * 0.034, PLINTH.top + 0.215 - Math.floor(i / 4) * 0.034, GZ), to: new THREE.Vector3(-0.012, PLINTH.top + 0.009 + i * 0.0075, GZ) }; m.visible = false; g.add(m); twelve.push(m); }
  shadows(g); ruler.castShadow = bar.castShadow = false; g.traverse((o) => o.layers.enable(1));
  return { g, box, cols, ruler, bar, barMat, twelve };
}
// a magic wand: it rises, sparks, the sparks fizzle, it falls over (to the camera's right)
const WAND = PL(-0.02, PLINTH.top, 0.08);
function makeWand(scene) {
  const g = new THREE.Group(); g.position.copy(WAND); g.rotation.y = PLINTH.ry; scene.add(g);
  const tip = new THREE.Group(); g.add(tip);   // pivots at its foot
  const black = phys({ color: 0x0b0b0c, roughness: 0.25, clearcoat: 0.9 }), white = phys({ color: 0xf2f2ee, roughness: 0.35, clearcoat: 0.6 });
  const L = 0.2, r = 0.0045;
  const stick = new THREE.Mesh(new THREE.CylinderGeometry(r, r, L * 0.82, 24), black); stick.position.y = L * 0.41; tip.add(stick);
  const end = new THREE.Mesh(new THREE.CylinderGeometry(r, r, L * 0.18, 24), white); end.position.y = L * 0.91; tip.add(end);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), white); cap.position.y = L; tip.add(cap);
  const foot = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), black); tip.add(foot);
  const sparks = []; for (let i = 0; i < 14; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.0032, 10, 8), glowMat(new THREE.Color(0xfff3c8).multiplyScalar(1.6))); m.material.transparent = true; m.visible = false;
    const a = (i / 14) * Math.PI * 2 + hash(i * 1.7), e = 0.4 + hash(i * 2.3) * 0.9; m.userData = { d: new THREE.Vector3(Math.cos(a) * Math.cos(e), Math.sin(e), Math.sin(a) * Math.cos(e)), v: 0.06 + 0.05 * hash(i * 3.1), t: 0.05 * hash(i * 4.7) }; scene.add(m); sparks.push(m); }
  shadows(g); g.traverse((o) => o.layers.enable(1)); g.visible = false;
  return { g, tip, sparks, L };
}
// sticky notes: yellow squares, a little curved, stuck to the skull
function makeNote(text, tilt) {
  const tex = canvasTex(512, 512, (x, w, h) => {
    x.fillStyle = '#f1dc69'; x.fillRect(0, 0, w, h);
    const gr = x.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(120,90,0,0.10)'); gr.addColorStop(0.16, 'rgba(120,90,0,0)'); gr.addColorStop(1, 'rgba(255,255,255,0.05)'); x.fillStyle = gr; x.fillRect(0, 0, w, h);
    x.save(); x.translate(w / 2, h / 2 + 10); x.rotate(tilt); const ls = text.split('\n');
    ls.forEach((ln, i) => txt(x, ln, 0, (i - (ls.length - 1) / 2) * 128, { font: '800 118px Archivo', color: '#1b1c1f', track: 1 })); x.restore(); });
  const S2 = 0.05, geo = new THREE.PlaneGeometry(S2, S2, 16, 16), P = geo.attributes.position;
  for (let i = 0; i < P.count; i++) { const x = P.getX(i), y = P.getY(i); P.setZ(i, -(x * x) / (2 * 0.07) - (y * y) / (2 * 0.11) + (y < -0.012 ? 0.06 * (y + 0.012) * (y + 0.012) * 40 : 0)); }   // follows the brow; the free bottom edge lifts a little
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, new THREE.MeshPhysicalMaterial({ map: tex, roughness: 0.85, side: THREE.DoubleSide, transparent: true }));
  m.castShadow = true; m.layers.enable(1); m.renderOrder = 2;
  return m;
}
// the dial: minutes a day, 0 to 10 over 270 degrees; at the end the setting, 5, in orange
const ANG = (v) => ((-135 + 27 * v) * Math.PI) / 180;
function makeDial(scene) {
  const g = new THREE.Group(); g.position.copy(DIAL); scene.add(g);
  const dark = phys({ color: 0x121316, roughness: 0.38, clearcoat: 0.6, clearcoatRoughness: 0.25 }), alu = phys({ color: 0xcdcac4, metalness: 1, roughness: 0.3, clearcoat: 0.4 });
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(DIAL_R + 0.01, DIAL_R + 0.013, 0.012, 128), dark); plate.position.y = 0.006; g.add(plate);
  const bezel = new THREE.Mesh(new THREE.TorusGeometry(DIAL_R + 0.003, 0.003, 20, 160), alu); bezel.rotation.x = Math.PI / 2; bezel.position.y = 0.0125; g.add(bezel);
  const tex = canvasTex(1024, 1024, (x, w) => { const R = w / 2; x.fillStyle = '#0b0c0e'; x.fillRect(0, 0, w, w);
    for (let v = 0; v <= 20; v++) { const a = ANG(v / 2), big = v % 2 === 0, r0 = R * (big ? 0.78 : 0.83), r1 = R * 0.9; x.strokeStyle = big ? '#e7e9ec' : '#8d9097'; x.lineWidth = big ? 7 : 3.5; x.beginPath(); x.moveTo(R + Math.sin(a) * r0, R - Math.cos(a) * r0); x.lineTo(R + Math.sin(a) * r1, R - Math.cos(a) * r1); x.stroke();
      if (v % 4 === 0) txt(x, String(v / 2), R + Math.sin(a) * R * 0.64, R - Math.cos(a) * R * 0.64, { font: '600 74px Archivo', color: '#e7e9ec' }); }
    txt(x, 'MINUTES', R, R * 1.42, { font: '500 40px "Geist Mono"', color: '#9a9da4', track: 9 }); txt(x, 'A DAY', R, R * 1.53, { font: '500 30px "Geist Mono"', color: '#6d7077', track: 7 }); });
  const faceMat = new THREE.MeshPhysicalMaterial({ map: tex, roughness: 0.42, clearcoat: 0.5, emissive: new THREE.Color(0xffffff), emissiveMap: tex, emissiveIntensity: 0.08, transparent: true });
  const face = new THREE.Mesh(new THREE.CircleGeometry(DIAL_R, 128), faceMat); face.rotation.x = -Math.PI / 2; face.position.y = 0.0122; face.renderOrder = 1; g.add(face);
  const flat = new THREE.Group(); flat.rotation.x = -Math.PI / 2; flat.position.y = 0.0128; g.add(flat);
  const setM = new THREE.Mesh(new THREE.RingGeometry(DIAL_R * 0.905, DIAL_R * 0.965, 64, 1, Math.PI / 2 - ANG(5), ANG(5) - ANG(0)), new THREE.MeshBasicMaterial({ color: ORANGE.clone().multiplyScalar(1.6), transparent: true, opacity: 0, depthWrite: false })); setM.renderOrder = 2; flat.add(setM);
  const n = new THREE.Group(); n.position.y = 0.0135; g.add(n);
  const nmat = new THREE.MeshPhysicalMaterial({ color: 0xf2f3f5, roughness: 0.35, clearcoat: 0.6, emissive: new THREE.Color(0xffffff), emissiveIntensity: 0.25, transparent: true });
  const bar = new THREE.Mesh(new THREE.BoxGeometry(0.002, 0.0009, DIAL_R * 0.86), nmat); bar.position.z = -DIAL_R * 0.43 + 0.007; bar.renderOrder = 3; n.add(bar);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.0045, 0.0045, 0.002, 40), nmat); hub.renderOrder = 3; n.add(hub);
  const logo = makeLogoRing(LOGO_R); logo.g.rotation.x = -Math.PI / 2; logo.g.position.y = 0.0142; logo.g.traverse((o) => { o.renderOrder = 4; }); g.add(logo.g);
  shadows(g); face.castShadow = false; g.traverse((o) => o.layers.enable(1)); g.visible = false;
  return { g, faceMat, setM, n, nmat, logo };
}

// ------------------------------------------------------------------ build
function extraKind(p) {
  const n = p.name.toLowerCase();
  if (p.system === 'respiratory' && /bronchial tree|bronchus|trachea/.test(n)) return 'airway';
  if (p.system === 'cardiac' && /wall of|valve|leaflet|cusp/.test(n)) return 'heart';
  return undefined;
}
const NOTES = [
  { text: 'CALM\nDOWN', at: [0.0, 0.012], rot: 0.05, slap: 1.12, peel: 6.15 },
  { text: 'CALM\nDOWN.', at: [0.03, 0.036], rot: 0.22, slap: 1.96, peel: 6.42 },
  { text: 'CALM\nDOWN!!', at: [-0.032, 0.03], rot: -0.18, slap: 2.72, peel: 6.7 },
];
async function build(S, cfg) {
  const scene = S.scene;
  S.fog.near = 4; S.fog.far = 14;
  S.table.scale.set(3, 3, 1); S.tableMat.clearcoat = 0.1; S.tableMat.specularIntensity = 0.3;
  for (const m of [S.tableMat.map, S.tableMat.roughnessMap]) if (m) { m.wrapS = m.wrapT = THREE.RepeatWrapping; m.repeat.multiplyScalar(3); }
  buildSegs(); buildBeats();
  const meshes = await loadAnatomy(skeletonKind(extraKind));
  const inside = (n) => /bronch|trachea|wall of|valve|leaflet|cusp/i.test(n);
  const R = W.rig = buildRig(meshes, { assign: (n) => (inside(n) ? 'Seventh thoracic vertebra' : undefined) });
  W.body = new THREE.Group(); scene.add(W.body); R.root.position.copy(R.P0).negate(); W.body.add(R.root);
  for (const m of meshes) { m.castShadow = true; m.receiveShadow = true; m.layers.enable(1); }
  W.bones = meshes.filter((m) => ['bone', 'tooth', 'cartilage'].includes(m.userData.tissue));
  const T7 = R.seg['Seventh thoracic vertebra'];
  // hands, a little closed, resting on the belly
  W.hand = {}; for (const Side of ['Right', 'Left']) { const Wr = makeWrist(R, Side); W.hand[Side] = rigHand(R, Side, Wr); W.hand[Side].wr = Wr; }
  // ---- the ribs breathe: a group at the spine that widens and deepens
  W.cage = new THREE.Group(); T7.g.add(W.cage);
  for (const m of meshes) if (/rib|costal|sternum|manubrium|xiphoid/i.test(m.userData.name) && m.parent === T7.g) { m.removeFromParent(); W.cage.add(m); }
  // ---- inside: the airways and the heart, as soft glass
  W.airway = meshes.filter((m) => m.userData.tissue === 'airway');
  for (const m of W.airway) { m.material = tissueMat('airway', { color: new THREE.Color(0xe6d3cf), roughness: 0.45, clearcoat: 0.35, transparent: true, opacity: 0.7 }); m.castShadow = false; }
  W.heart = meshes.filter((m) => m.userData.tissue === 'heart' && /wall of/i.test(m.userData.name));
  for (const m of meshes) if (m.userData.tissue === 'heart' && !/wall of/i.test(m.userData.name)) m.visible = false;
  for (const m of W.heart) { m.material = new THREE.MeshPhysicalMaterial({ color: 0xeed2cd, roughness: 0.32, clearcoat: 0.7, transparent: true, opacity: 0.78, emissive: new THREE.Color(0xff8f80), emissiveIntensity: 0.03, depthWrite: false }); m.castShadow = false; m.renderOrder = 4; }
  W.heartG = new THREE.Group(); const hb = new THREE.Box3(); for (const m of W.heart) hb.expandByPoint(m.userData.home); const hc = hb.getCenter(new THREE.Vector3());
  W.heartG.position.copy(hc).sub(T7.pivot); T7.g.add(W.heartG); for (const m of W.heart) { m.removeFromParent(); m.position.copy(m.userData.home).sub(hc); W.heartG.add(m); }
  // ---- the lungs: rounded hulls round each bronchial tree, as glass
  W.lungs = [];
  for (const side of [-1, 1]) {
    const parts = W.airway.filter((m) => /bronchial tree|bronchus/i.test(m.userData.name) && Math.sign(m.userData.home.x) === side);
    const pts = parts.flatMap((m) => worldVerts(m, 3));
    const c = pts.reduce((a, v) => a.add(v), new THREE.Vector3()).multiplyScalar(1 / pts.length);
    const geo = softHull(pts, c, { k: 0.014, grow: 0.018 });
    const hil = parts.reduce((a, m) => (m.userData.home.y > a.y ? m.userData.home : a), new THREE.Vector3(0, -9, 0)).clone();
    const piv = new THREE.Group(); piv.position.copy(hil).sub(T7.pivot); T7.g.add(piv);
    const m = new THREE.Mesh(geo, glassMat(0xeadcd9, { alpha: 0.05, rim: 0.42, pow: 2.4 })); m.position.copy(hil).negate(); m.renderOrder = 5; piv.add(m);
    W.lungs.push({ piv, m, side });
  }
  // ---- the factory stamp: on the front of the breastbone, across it
  { const st = R.byName.get('Body of sternum'); st.material = st.material.clone();
    W.stampSpot = stampSpot(st, { from: [0, 0.006, 0.12], dir: [0, 0, -1], spread: 0.004 });
    if (W.stampSpot) W.stamp = stamp(st, { canvas: stampCanvas(['HUMAN FACTORY', 'SETTINGS'], '', { frame: false }), center: W.stampSpot.center, normal: W.stampSpot.normal, up: [0, 1, 0], width: 0.04, depth: 0.03, opacity: 0.6 }); }
  // ---- the sticky notes: on the forehead and either side of it, 1.5 mm off the bone
  { const fb = R.byName.get('Frontal bone'); W.notes = [];
    for (const N of NOTES) {
      const sp = stampSpot(fb, { from: [N.at[0], N.at[1], 0.15], dir: [0, 0, -1], spread: 0.006 }) || { center: [N.at[0], N.at[1], 0.05], normal: [0, 0, 1] };
      const m = makeNote(N.text, N.rot * 0.4), nrm = new THREE.Vector3(...sp.normal), up = new THREE.Vector3(0, 1, 0).sub(nrm.clone().multiplyScalar(nrm.y)).normalize();
      const q = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3().crossVectors(up, nrm), up, nrm)).multiply(new THREE.Quaternion().setFromAxisAngle(Z, N.rot));
      const home = new THREE.Vector3(...sp.center).addScaledVector(nrm, 0.0015);
      m.position.copy(home); m.quaternion.copy(q); m.visible = false; fb.add(m);
      W.notes.push({ m, home, q, nrm, N }); } }
  // ---- seated on the stool
  W.stool = makeStool(scene);
  const hipB = new THREE.Box3(); for (const m of meshes) if (/hip bone/i.test(m.userData.name)) for (const v of worldVerts(m, 3)) hipB.expandByPoint(v);
  W.sitP = new THREE.Vector3(0, SEAT - 0.012 + (R.P0.y - hipB.min.y), -0.02);
  // ---- the set
  W.sideG = makeSideTable(scene, SIDE); W.jarG = makeSideTable(scene, JAR, 0.32, 0.32);
  W.rec = makeRecorder(scene); W.jar = makeJar(scene); W.study = makeStudy(scene); W.wand = makeWand(scene); W.dial = makeDial(scene);
  // ---- light
  W.key = spot(scene, { color: 0xffe9d2, pos: new THREE.Vector3(-1.4, 2.6, 1.8), target: new THREE.Vector3(0, 0.9, 0.1), angle: 0.42, penumbra: 0.8, shadow: true, size: cfg.shadow ?? 1024 });
  W.key.shadow.camera.far = 7;
  W.rim = spot(scene, { color: 0xa9c4ff, pos: new THREE.Vector3(1.2, 2.2, -1.8), target: new THREE.Vector3(0, 1.0, 0), angle: 0.5, penumbra: 0.9 });
  W.fill = spot(scene, { color: 0xc8d6ff, pos: new THREE.Vector3(1.8, 1.2, 1.4), target: new THREE.Vector3(0, 0.9, 0), angle: 0.55, penumbra: 1 });
  W.plinthLight = spot(scene, { color: 0xfff1d8, pos: PL(0.25, 1.95, 1.0), target: PL(0, PLINTH.top + 0.08, 0), angle: 0.3, penumbra: 0.75 });
  W.sideLight = spot(scene, { color: 0xffe9d2, pos: new THREE.Vector3(1.3, 1.6, 0.9), target: SIDE.clone(), angle: 0.3, penumbra: 0.8 });
  W.jarLight = spot(scene, { color: 0xffe9d2, pos: new THREE.Vector3(-1.2, 1.6, 1.0), target: JAR.clone().add(new THREE.Vector3(0, 0.15, 0)), angle: 0.25, penumbra: 0.8 });
  W.faceLight = spot(scene, { color: 0xfff1e2, pos: new THREE.Vector3(0.5, 1.6, 1.2), target: new THREE.Vector3(0, 1.15, 0.05), angle: 0.22, penumbra: 0.8 });
  W.heartLight = new THREE.PointLight(0xffb2a6, 0, 0.22, 2); W.heartG.add(W.heartLight);
  W.auditSolids = [['stool', W.stool], ['recorder', W.rec.g], ['jar', W.jar.g], ['plinth', W.study.box, { floor: false }], ['wand', W.wand.g], ['dial', W.dial.g]].filter((x) => x[1]);
  W.timing = { slaps: NOTES.map((n) => n.slap), peels: NOTES.map((n) => n.peel), panic: PANIC, sighs: SIGHS.map((g) => [g.t0, g.a1, g.a2, g.b]), drill: DRILL,
    beats: BEATS.filter((b) => b < T.end), cols: T.lifted, twelve: [T.twelve, T.trials], bar: [T.cut - 0.2, T.medium + 0.2], wandUp: WAND_T.up, sparks: WAND_T.spark, fall: WAND_T.fall,
    dialUp: T.final - 0.6, needle: [T.final + 0.2, T.settings - 0.1], logo: T.logo, rise: RISE, sink: SINK, ruler: T.across - 0.2,
    sacPops: W.jar.sacs.filter((m) => m.userData.shut).map((m) => +(T.second - 0.1 + m.userData.d + 0.3).toFixed(3)).sort((a, b) => a - b),
    dotsIn: [...Array(12).keys()].map((i) => +(T.twelve - 0.1 + i * 0.05).toFixed(3)), dotsLand: [...Array(12).keys()].map((i) => +(T.cut + 0.1 + i * 0.06).toFixed(3)),
    breathDt: 0.02, breath: [...Array(Math.ceil(T.end / 0.02) + 1).keys()].map((i) => +breathAt(i * 0.02).toFixed(3)) };
  return { stamp: W.stampSpot, sitP: W.sitP.toArray(), lungs: W.lungs.map((l) => l.m.geometry.attributes.position.count), heart: W.heart.length, airway: W.airway.length, beats: BEATS.length, notes: W.notes.map((n) => n.home.toArray().map((v) => +v.toFixed(3))) };
}

// ------------------------------------------------------------------ the body over time
const ARM_REST = { dir: [0.02, -0.92, 0.4], twist: 0.8, elbow: 1.0 };   // hands resting on the belly
const WAND_T = { up: [45.95, 46.45], spark: [47.3, 47.95], fall: [48.0, 48.45] };
const _qa = new THREE.Quaternion();
function poseBody(t) {
  const R = W.rig, b = breathAt(t), dizzy = ss(53.0, T.dizzy, t) * (1 - ss(56.0, 57.4, t)), panic = ss(0.3, 0.8, t) * (1 - ss(5.7, 6.6, t));
  bendSpine(R.seg, { lum: -0.05, tho: 0.06 - 0.08 * b + 0.04 * panic, cer: 0.05 + 0.04 * Math.sin(t * 2.1) * dizzy, side: 0.05 * Math.sin(t * 1.7) * dizzy });
  for (const Side of ['Right', 'Left']) { poseArm(R.arms[Side], ARM_REST); setWrist(W.hand[Side].wr, { wf: 0.15 }); W.hand[Side].curl(0.22); }
  R.arms.Right.girdle.rotation.z += -0.035 * b * (1 + 0.6 * panic); R.arms.Left.girdle.rotation.z += 0.035 * b * (1 + 0.6 * panic);   // the shoulders rise on the breath in (more in a panic)
  clearArms(R);
  W.body.quaternion.identity(); W.body.position.copy(W.sitP); W.body.updateMatrixWorld(true);
  for (const Side of ['Right', 'Left']) {
    const G = R.legs[Side]; _qa.setFromAxisAngle(X, -Math.PI / 2); G.hip.quaternion.copy(_qa);
    const tgt = new THREE.Vector3(W.sitP.x + G.s * 0.13, G.A.y - G.ground + 0.002, W.sitP.z + 0.44);
    legIK(R, Side, tgt, new THREE.Quaternion(), Z);
  }
  W.body.updateMatrixWorld(true);
  W.cage.scale.set(1 + 0.03 * b, 1 + 0.008 * b, 1 + 0.045 * b);
  for (const L of W.lungs) L.piv.scale.set(1 + 0.05 * b, 1 + 0.1 * b, 1 + 0.06 * b);
  const e = beatEnv(t); W.heartG.scale.setScalar(1 - 0.05 * e); W.heartLight.intensity = 0.004 + 0.03 * e;
  for (const m of W.heart) m.material.emissiveIntensity = 0.03 + 0.3 * e;
  return { b, e, dizzy };
}

// ------------------------------------------------------------------ the camera: one path, no cuts
let CAM = null;
// framings found with tools/search_view.py: each subject sits under the captions (below 0.33 of the frame) and above the bottom fifth
const FACE_L = V3(0, 1.3, 0.03), HEAD_L = V3(0, 1.28, 0.02), CHEST_L = V3(0, 1.02, 0.02), SIGH_L = V3(-0.1, 1.02, 0.02), REC_L = V3(0.6, 0.66, 0.06), JAR_L = V3(-0.62, 0.8, 0.1), STUDY_L = PL(0, 0.54, -0.03).toArray();
function buildCam() {
  const D = DIAL, Wl = PL(0.06, 0.58, 0.08).toArray(), Wp = PL(0.06, 1.18, 1.119).toArray(), add = (a, b) => a.map((v, i) => v + b[i]);
  return camTrack([
    { t: -3.0, p: V3(0.3, 1.5, 1.2), l: FACE_L, fov: 30 },
    { t: 0.0, p: V3(0.28, 1.491, 1.076), l: FACE_L, fov: 30, tens: 0.15 },                    // the face: notes slapped on the skull
    { t: 3.0, p: V3(0.275, 1.488, 1.06), l: FACE_L, fov: 30, tens: 0.15 },
    { t: 4.9, p: V3(0.257, 1.54, 1.475), l: HEAD_L, fov: 30, tens: 0.15 },                    // back a little: the shoulders heave; the notes peel off
    { t: 7.3, p: V3(0.25, 1.535, 1.455), l: HEAD_L, fov: 30, tens: 0.15 },
    { t: 8.6, p: V3(0.208, 1.125, 1.197), l: CHEST_L, fov: 30, stop: true },                  // the chest: a brake you can reach
    { t: 11.6, p: V3(0.2, 1.12, 1.18), l: CHEST_L, fov: 30, stop: true },
    { t: 12.9, p: V3(0.996, 0.971, 1.149), l: REC_L, fov: 30, stop: true },                   // the recorder: faster in, slower out
    { t: 16.7, p: V3(0.985, 0.968, 1.135), l: REC_L, fov: 30, stop: true },
    { t: 17.9, p: V3(-0.34, 0.609, 1.146), l: JAR_L, fov: 30, stop: true },                   // air sacs under the bell jar, from a little below
    { t: 25.1, p: V3(-0.345, 0.612, 1.13), l: JAR_L, fov: 30, stop: true },
    { t: 26.4, p: V3(-0.847, 1.151, 1.314), l: SIGH_L, fov: 30, stop: true },                 // the sigh on purpose: the chest from its right, room for the words on the left
    { t: 31.3, p: V3(-0.835, 1.148, 1.295), l: SIGH_L, fov: 30, stop: true },
    { t: 32.6, p: V3(0.05, 1.45, 1.8), l: PL(0, 0.42, 0).toArray(), fov: 30 },                // passing in front, looking down at the plinth as it rises
    { t: 34.0, p: PL(0, 1.311, 0.889).toArray(), l: STUDY_L, fov: 30, stop: true },            // the study, twelve trials: from the side, against the dark
    { t: 45.6, p: PL(0, 1.3, 0.87).toArray(), l: STUDY_L, fov: 30, stop: true },
    { t: 46.4, p: Wp, l: Wl, fov: 30, stop: true },                                            // the wand
    { t: 48.6, p: add(Wp, [-0.012, -0.006, 0]), l: add(Wl, [0, -0.01, 0]), fov: 30, stop: true },
    { t: 49.9, p: V3(0.257, 1.54, 1.475), l: HEAD_L, fov: 30, stop: true },                   // five minutes a day; the drill, the room sways
    { t: 55.4, p: V3(0.25, 1.535, 1.455), l: HEAD_L, fov: 30, stop: true },
    { t: 57.0, p: V3(1.283, 1.366, 4.141), l: V3(0.2, 1.0, 0.1), fov: 34, stop: true },          // calm: the whole figure, then slowly closer
    { t: 73.6, p: V3(0.973, 1.361, 2.986), l: V3(0.2, 1.1, 0.1), fov: 34, stop: true },
    { t: 75.6, p: V3(0.85, 1.12, 0.78), l: V3(D.x, D.y + 0.01, D.z), fov: 30 },
    { t: T.logo, p: V3(D.x, D.y + 0.72, D.z + 0.005), l: V3(D.x, D.y + 0.0142, D.z), fov: 30, stop: true },   // straight down on the dial: the logo
  ]);
}
function camPose(S, t) {
  const v = S.cfg.view; if (v && typeof v === 'object') return v;
  if (!CAM) CAM = buildCam();
  let P;
  if (t <= T.logo) P = CAM(t); else { const Q = CAM(T.logo), k = ss(T.logo, T.end, t); P = { p: [Q.p[0], lerp(Q.p[1], Q.p[1] - 0.04, k), Q.p[2]], l: Q.l, fov: 30 }; }
  const dz = ss(53.0, T.dizzy, t) * (1 - ss(56.0, 57.4, t));   // dizzy: the view sways a little after the drill
  if (dz > 0) P = { ...P, l: [P.l[0] + 0.025 * dz * Math.sin(t * 1.9), P.l[1] + 0.012 * dz * Math.sin(t * 2.7 + 1), P.l[2]] };
  return P;
}
function focusAt(S, t, P) { return Math.hypot(P.p[0] - P.l[0], P.p[1] - P.l[1], P.p[2] - P.l[2]); }

// ------------------------------------------------------------------ one moment of the film
const _v = new THREE.Vector3(), _q = new THREE.Quaternion();
function update(S, t) {
  const scene = S.scene, endDark = ss(T.final + 0.3, T.logo - 0.3, t);
  const o = poseBody(t);
  setPaper(W.rec, t);
  // ---- the notes: slapped on one by one; at "a better way" each peels off and flutters away, fading
  for (const n of W.notes) {
    const { m, home, q, nrm, N } = n, a = (t - N.slap) / 0.16;
    if (t < N.slap - 0.16 || t > N.peel + 1.1) { m.visible = false; continue; }
    m.visible = true;
    if (t < N.slap) { const u = clamp01(1 + a); m.position.copy(home).addScaledVector(nrm, 0.25 * (1 - u) * (1 - u)); m.quaternion.copy(q); m.material.opacity = u; m.scale.setScalar(1); }
    else if (t < N.peel) { const bnc = Math.exp(-(t - N.slap) * 22) * Math.sin((t - N.slap) * 60) * 0.06; m.position.copy(home); m.quaternion.copy(q); m.scale.set(1 + bnc, 1 - bnc, 1); m.material.opacity = 1; }
    else { const u = (t - N.peel) / 1.1, f = s5(0, 1, u);
      m.position.copy(home).addScaledVector(nrm, 0.01 + 0.2 * f).add(_v.set(0.03 * Math.sin(u * 7 + N.rot * 9), -0.16 * u * u, 0));
      m.quaternion.copy(q).multiply(_q.setFromAxisAngle(X, -1.1 * f)).multiply(_q.setFromAxisAngle(Z, 0.6 * Math.sin(u * 5 + N.rot * 5)));
      m.material.opacity = 1 - ss(0.45, 1, u); m.scale.setScalar(1); } }
  // ---- the air sacs: some folded shut; the sigh, a second breath on top, opens them
  { W.jar.sacs.forEach((m) => { const a0 = T.second - 0.1 + (m.userData.d || 0), k = m.userData.shut ? 1 - s5(a0, a0 + 0.6, t) : 0, br = 0.04 * o.b;
      const sx = lerp(1, 0.72, k), sy = lerp(1, 0.2, k); m.scale.set(m.userData.r * (sx + br), m.userData.r * (sy + br), m.userData.r * (sx + br));
      m.material.color.setHex(0xe7b2aa).multiplyScalar(lerp(1, 0.6, k)); }); }
  // ---- the study: good mood, sighing against meditation; twelve trials into a bar against small, medium, large
  const pUp = plinthUp(t), pDy = pDyAt(t);
  { const St = W.study, show = pulse(t, T.lifted - 0.3, T.across + 0.2, 0.4), grow = s5(T.lifted, T.more + 0.2, t);
    St.g.position.y = pDy; St.g.visible = pUp > 0.001;
    St.cols.forEach((m, i) => { const h = COLS[i].h * grow; m.visible = show > 0.002 && h > 0.002; m.scale.y = Math.max(0.001, h); m.position.y = PLINTH.top + h / 2; m.material.opacity = 0.85 * show; });
    const ru = pulse(t, T.across - 0.2, 45.9, 0.5); St.ruler.material.opacity = ru; const v = 0.35 * s5(T.cut - 0.2, T.medium + 0.2, t);
    St.twelve.forEach((m, i) => { const a = ss(T.twelve - 0.3 + i * 0.05, T.twelve + 0.1 + i * 0.05, t), d = s5(T.trials + 0.6 + i * 0.06, T.cut + 0.1 + i * 0.06, t);
      m.visible = a > 0.001 && d < 0.999; m.position.lerpVectors(m.userData.from, m.userData.to, d); m.material.opacity = a * (1 - ss(0.85, 1, d)); });
    St.bar.scale.y = Math.max(0.001, v * GH); St.bar.position.y = PLINTH.top + (v * GH) / 2; St.barMat.opacity = ru * ss(T.cut - 0.3, T.cut, t); St.bar.visible = St.barMat.opacity > 0.002; }
  // ---- the wand: up out of the plinth, sparks that fizzle, then it falls over
  { const Wd = W.wand, up = s5(WAND_T.up[0], WAND_T.up[1], t) * (1 - s5(49.3, 49.8, t)), fall = WAND_T.fall;
    Wd.g.visible = up > 0.001; Wd.g.position.set(WAND.x, WAND.y - Wd.L * (1 - up) + pDy, WAND.z);
    const f = clamp01((t - fall[0]) / (fall[1] - fall[0])), fa = f * f * (Math.PI / 2 - 0.03), bounce = f >= 1 ? 0.06 * Math.exp(-(t - fall[1]) * 9) * Math.abs(Math.sin((t - fall[1]) * 25)) : 0;
    Wd.tip.rotation.set(0, 0, -(fa - bounce));
    const tipW = Wd.tip.localToWorld(_v.set(0, Wd.L, 0)); Wd.g.updateMatrixWorld(true); Wd.tip.localToWorld(tipW.set(0, Wd.L, 0));
    Wd.sparks.forEach((m) => { const u = (t - WAND_T.spark[0] - m.userData.t) / (WAND_T.spark[1] - WAND_T.spark[0]); m.visible = u > 0 && u < 1 && Wd.g.visible;
      if (m.visible) { m.position.copy(tipW).addScaledVector(m.userData.d, m.userData.v * Math.sqrt(u)); m.position.y -= 0.03 * u * u; m.scale.setScalar(Math.max(0.001, 1 - u) * (1 + 0.5 * Math.sin(u * 30))); m.material.opacity = 1 - u; } }); }
  // ---- the dial rises at the end; set to five minutes a day; the logo
  { const D = W.dial, up = s5(T.final - 0.6, T.final + 0.3, t); D.g.position.y = DIAL.y - 0.03 * (1 - up); D.g.visible = up > 0.001;
    const v = lerp(0, 5, s5(T.final + 0.2, T.settings - 0.1, t)); D.n.rotation.y = -ANG(v); D.nmat.opacity = 1 - ss(T.logo - 0.6, T.logo - 0.2, t);
    D.setM.material.opacity = ss(T.settings - 0.2, T.settings + 0.3, t) * (1 - ss(T.logo - 0.6, T.logo - 0.2, t)); D.faceMat.opacity = 1 - 0.85 * ss(T.settings, T.logo - 0.2, t);
    const logoK = s5(T.final + 0.4, T.logo - 0.25, t); D.logo.set({ weight: logoK, white: logoK, hours: 0, hand: ss(T.logo - 0.4, T.logo - 0.15, t), handScale: outBack(clamp01((t - (T.logo - 0.4)) / 0.35), 1.8) }); }
  // ---- light
  const fig = 1 - endDark;
  W.key.intensity = 16 * fig; W.rim.intensity = 3.0 * fig; W.fill.intensity = 1.0 * fig;
  W.plinthLight.intensity = 6 * ss(T.in3 - 0.8, T.in3, t) * (1 - ss(49.3, 50.0, t)) * fig;
  W.sideLight.intensity = 3 * fig; W.jarLight.intensity = 4 * fig; W.faceLight.intensity = 2.2 * pulse(t, -1, 8.4, 0.6) * fig;
  S.tableMat.color.setScalar(0.35 * (1 - endDark * 0.9)); scene.environmentIntensity = 0.12 * (1 - endDark); S.reflAmt = 0.6 * (1 - endDark);
}

// ------------------------------------------------------------------ the words on screen
const CAPS = [
  { t0: T.you, t1: 2.3, top: 292, size: 86, html: 'You keep telling<br>yourself to <em>calm down</em>' },
  { t0: T.while, t1: 5.5, top: 292, size: 84, html: 'while you’re breathing<br>like something<br>is <em>chasing you</em>.' },
  { t0: T.your, t1: 7.85, top: 300, size: 92, html: 'Your body has<br>a <em>better way</em>.' },
  { t0: T.your2, t1: 11.3, top: 292, size: 86, html: 'Your body was built<br>with a <em>brake</em><br>you can reach:' },
  { t0: T.when, t1: 13.95, top: 292, size: 84, html: 'when you breathe <em>in</em>,<br>your heart speeds up<br>a little,' },
  { t0: T.when2 - 0.32, t1: 16.9, top: 292, size: 84, html: 'and when you<br>breathe <em>out</em>,<br>it slows down.' },
  { t0: T.your3, t1: 20.7, top: 292, size: 86, html: 'Your body already<br><em>sighs</em> every few minutes<br>without you noticing,' },
  { t0: T.taking, t1: 25.3, top: 292, size: 84, html: 'taking a <em>second breath</em><br>to reopen tiny<br>air sacs in your lungs.' },
  { t0: T.so, t1: 28.55, top: 292, size: 88, html: 'So sigh on purpose:<br>breathe <em>in twice</em>,' },
  { t0: T.then, t1: 31.3, top: 292, size: 88, html: 'then let one<br><em>long, slow</em><br>breath out.' },
  { t0: T.in3, t1: 36.25, top: 292, size: 76, html: 'In a Stanford study<br>of mostly students,<br><em>5 minutes a day</em> of this<br>for a month' },
  { t0: T.lifted, t1: 38.95, top: 292, size: 86, html: 'lifted mood <em>more</em><br>than meditation did,' },
  { t0: T.and2, t1: 42.5, top: 292, size: 84, html: 'and across <em>12 trials</em>,<br>breathing exercises' },
  { t0: T.cut, t1: 45.6, top: 292, size: 84, html: 'cut stress by<br>a <em>small to medium</em><br>amount.' },
  { t0: T.its, t1: 48.6, top: 300, size: 92, html: 'It’s a useful tool,<br>not a <em>magic</em> one.' },
  { t0: T.do, t1: 50.85, top: 300, size: 92, html: 'Do it for<br><em>5 minutes a day</em>,' },
  { t0: T.skip - 0.35, t1: 55.3, top: 292, size: 80, html: 'and skip <em>hard, fast</em><br>breathing drills,<br>because they can<br>make you <em>dizzy</em>.' },
  { t0: T.and3, t1: 59.9, top: 292, size: 82, html: 'And never practise<br>breathing drills or<br>breath-holding<br><em>in or near water</em>.' },
  { t0: T.if, t1: 63.95, top: 292, size: 84, html: 'If stress is getting<br>too much to cope with,<br>or nothing you try' },
  { t0: T.helping - 0.3, t1: 66.2, top: 300, size: 92, html: 'is helping,<br>talk to a <em>doctor</em>.' },
  { t0: T.if2, t1: 69.4, top: 292, size: 82, html: 'If you or someone<br>you know needs help<br><em>right now</em>,' },
  { t0: 69.5, t1: 74.4, top: 292, size: 82, html: 'or you’ve seriously<br>harmed yourself,<br>call <em>emergency services</em>.' },
  { t0: T.final, t1: 99, top: 360, size: 92, html: 'Let’s get you back to<br><em>factory settings.</em>' },
];
const OVL = {};
const TAG = { hr: new THREE.Vector3(0.495, 0.624, 0.187), sacs: new THREE.Vector3(-0.702, 0.779, 0.1), sigh: new THREE.Vector3(-0.3, 1.2, 0.0) };   // world anchors, checked with campath.py
function overlayInit(S) {
  const O = S.O, tag = (cls, txt2, size, bsize) => { const e = O.tag(cls, txt2); e.style.fontSize = size + 'px'; const b = e.querySelector('b'); if (b && bsize) b.style.fontSize = bsize + 'px'; return e; };
  OVL.hr = tag('tag', 'Breathing in<b>heart rate up</b>', 24, 42); OVL.hrL = OVL.hr.firstChild; OVL.hrB = OVL.hr.querySelector('b');
  OVL.sacs = tag('tag', 'Air sacs<b>reopened</b>', 24, 40);
  OVL.sigh = tag('tag', 'In · in<b>one long breath out</b>', 22, 40);
  OVL.time = tag('tag', 'Each day<b>5 min · 1 month</b>', 22, 38);
  OVL.colS = tag('tag', 'Cyclic sighing', 22); OVL.colM = tag('tag', 'Meditation', 22);
  OVL.mood = tag('tag', 'Good mood<b>up more with sighing</b>', 22, 36);
  OVL.twelve = tag('tag', 'Trials<b>12</b>', 22, 44);
}
function overlay(S, t) {
  const Hpos = W.heartG.getWorldPosition(new THREE.Vector3()), out = t > T.when2 - 0.4;
  OVL.hrL.textContent = out ? 'Breathing out' : 'Breathing in'; OVL.hrB.textContent = out ? 'heart rate down' : 'heart rate up';   // words, not numbers: the claim is the direction
  place(S, OVL.hr, TAG.hr, 24, -240, pulse(t, 12.8, 16.6));                                            // above the paper, left of the recorder
  place(S, OVL.sacs, TAG.sacs, -90, 70, pulse(t, T.reopen, 25.0));                                    // left of the stem, under the sacs
  place(S, OVL.sigh, TAG.sigh, -20, 116, pulse(t, T.in2, 31.2));                                       // in the dark, top left, above the shoulder
  const pT = PLINTH.top + pDyAt(t);
  place(S, OVL.time, PL(0, pT + 0.2, -0.03), -140, -40, pulse(t, 34.0, T.lifted - 0.2));       // over the empty plinth
  place(S, OVL.colS, PL(COLS[0].x, pT, 0.03), -100, 14, pulse(t, T.lifted - 0.1, T.across + 0.2));
  place(S, OVL.colM, PL(COLS[1].x, pT, 0.03), -70, 14, pulse(t, T.lifted - 0.1, T.across + 0.2));
  place(S, OVL.mood, PL(COLS[0].x, pT + COLS[0].h + 0.02, -0.03), -110, -96, pulse(t, T.mood - 0.1, T.across + 0.1));
  place(S, OVL.twelve, PL(-0.15, pT + 0.215, GZ), -20, -100, pulse(t, T.trials - 0.2, T.medium + 0.6));   // above the grid of dots
  const c = new THREE.Vector3(DIAL.x, DIAL.y + 0.0142, DIAL.z);
  logoEnd(S, t, { t0: T.logo, center: c, edge: c.clone().add(new THREE.Vector3(0, 0, LOGO_R)) });
}

makeFilm({
  T, caps: CAPS, subs: [], build, update, pose: camPose, overlay, overlayInit, focus: focusAt,
  stage: { bg: 0x07080a, reflSize: 6, env: 0.12, far: 30 },
  aperture: [[0, 0.003], [8.6, 0.003], [12.9, 0.003], [17.9, 0.003], [26.4, 0.003], [34.0, 0.002], [46.4, 0.004], [49.9, 0.003], [57.0, 0.0015], [75.6, 0.003]],
  bloom: [[0, 0.45], [74, 0.55]],
  fast: [[0.3, 5.6, 2], [7.2, 8.8, 2], [11.5, 13.1, 2], [16.6, 18.1, 2], [25.0, 26.6, 2], [31.2, 34.1, 2], [45.5, 46.6, 2], [48.5, 50.1, 2], [51.0, 57.2, 2], [73.5, 75.8, 2]],
});

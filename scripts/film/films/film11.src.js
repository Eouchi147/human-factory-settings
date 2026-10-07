// Human Factory Settings · Film 11 "Does foam rolling work?" (new direction, 7 Oct 2026) · one continuous shot, 9:16.
// A skeleton lies on its side on a foam roller, rolling the outside of its thigh, wincing (a hand over its eyes). It believes
// it is breaking up its fascia; its fascia would like a word: a sticky note slaps onto the thigh, WE NEED TO TALK (the gag).
// Fascia is real: a sleeve of collagen round every muscle of the thigh, the thick band down its outside, and lines of light
// that run on through the whole body. To squash the thick kind by 1%, one model says 925 kg: forty-six 20 kg plates and one
// 5 kg plate land on a sample, and the tower dwarfs the skeleton on its roller. Before exercise: the top leg swings out to
// its own range (orange: its factory range) and, after rolling, 4% further (a blue sliver), the same as stretching; thirty
// minutes later the sliver is gone. After exercise: sore muscles glow, a little less; signals from the thigh to the brain
// turn down. Collagen is kept strong by use: the leg swings, the band brightens day after day. The boring stuff arrives:
// a toy dog on a leash (walking), a dumbbell (lifting), a calendar ticked every day (moving). A brisk warm-up roll; a red
// toolbox, REPAIR KIT, rises; at "see a doctor" its lid opens on a note that says so. The roller's end cap becomes the logo.
import { THREE, ORANGE, COLD, ss, s5, lerp, clamp01, hash, camTrack, phys, glowMat, shadows, spot, RoundedBoxGeometry,
  loadAnatomy, tissueMat, V3, place, logoEnd, makeFilm, outBack, stamp, stampCanvas, stampSpot, noiseTex, TIME } from '../kit.js';
import { buildRig, skeletonKind, legIK, bendSpine, poseArm, worldVerts } from '../rig.js';
import { makeLogoRing } from '../props.js';
import { skinned } from '../soft.js';

// ------------------------------------------------------------------ timing, from the voice guide (word starts)
const T = {
  end: 80.9, logo: 78.38,
  you: 0.35, lie: 0.8, foam: 1.29, tube: 1.45, wince: 1.69, ten: 2.48, minutes: 2.63, and: 3.12, believe: 3.21, breaking: 3.97, up: 4.42, fascia: 5.04,
  your: 6.2, fascia2: 6.64, would: 7.05, like: 7.29, word: 7.64,
  fascia3: 8.88, real: 9.78, tough: 10.55, wrapping: 10.84, collagen: 11.62, around: 12.29, every: 12.8, muscle: 13.07, and2: 13.45, runs: 13.93, through: 14.45, whole: 15.05, body: 15.26,
  but: 16.53, squash: 17.2, tough2: 17.64, thigh: 18.51, just: 18.99, one: 19.26, percent: 19.7, one2: 20.31, model: 20.59, says: 21.06, need: 21.77, about: 22.07, nine: 22.36, kilos: 24.39,
  lying: 25.55, roller: 26.45, doesnt: 26.63, close: 27.19, so: 27.64, nothing: 27.88, breaking2: 28.79, up2: 29.35,
  so2: 30.39, what: 30.93, rolling: 31.29, actually: 31.57, do: 32.07,
  before: 32.81, exercise: 33.48, gives: 34.17, about2: 34.47, four: 34.78, more: 35.68, flex: 36.07, no: 37.03, stretching: 37.88, does: 38.48,
  and3: 38.96, trial: 39.5, extra: 40.45, range: 41.0, gone: 41.92, within: 42.05, thirty: 42.59, minutes2: 43.04,
  after: 44.45, exercise2: 45.09, eases: 45.76, soreness: 46.21, little: 46.97, and4: 47.24, best: 47.5, nerves: 49.09, turn: 49.63, down: 49.97, pain: 50.42, tension: 50.99, while: 51.79,
  your2: 52.99, body2: 53.43, keeps: 53.73, collagen2: 54.17, strong: 54.68, using: 55.25, after2: 55.66, workout: 56.78, keeps2: 57.34, building: 57.71, new: 58.15, collagen3: 58.57, days: 59.37,
  so3: 60.38, give: 60.92, boring: 61.73, stuff: 62.03, walking: 62.38, lifting: 63.2, moving: 63.92, every2: 64.32, day: 64.78,
  use: 66.03, roller2: 66.77, warmup: 67.41, like2: 68.09, not: 68.46, repair: 69.44, kit: 69.93,
  and5: 70.55, muscle2: 71.12, pain2: 71.4, settle: 72.0, rest: 72.37, see: 72.69, doctor: 73.29, not2: 73.77, foam2: 74.24, roller3: 74.49,
  final: 76.12, factory: 77.33, settings: 77.7,
};

// ------------------------------------------------------------------ the set (metres): the skeleton lies on its left side along z,
// head toward -z, its front toward +x; the roller runs across the mat (axis along x) under its left thigh
const W = {}; window.HFS_W = W;
const MAT_H = 0.006, MAT_Z = -0.06;
const RR = 0.075, RL = 0.45, ROLLX = 0.03;                              // the roller: 15 cm across, 45 cm long
const ALPHA = 0.26;                                                    // the trunk rises toward the head (propped on the left forearm)
const TOWER = new THREE.Vector3(-1.2, 0, 0.16);                         // the sample under 925 kg, well behind the skeleton (out of the thigh shots)
const OBJ = { cal: new THREE.Vector3(0.59, 0, -0.19), db: new THREE.Vector3(0.78, 0, 0.05), dog: new THREE.Vector3(0.61, 0, 0.37) };   // the boring stuff, a little group on the floor in front
const BOX = new THREE.Vector3(0.95, 0, -0.36);                          // the repair kit, toward the head end, in front (its close-up clear of the skull and the hand)
const FOOT = new THREE.Vector3(0.36, 0, 0.5);                           // where the top (right) foot is planted
const PHI0 = (70 * Math.PI) / 180, PHI1 = PHI0 * 1.04;                 // the top leg's range, and 4% more
const PLATE_T = 0.03, PLATE_R = 0.225, NPLATES = 46;                    // 46 x 20 kg + 5 kg = 925 kg
const X = new THREE.Vector3(1, 0, 0), Y = new THREE.Vector3(0, 1, 0), Z = new THREE.Vector3(0, 0, 1);
const pulse = (t, a, b, r = 0.35) => ss(a, a + r, t) * (1 - ss(b - r, b, t));
function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h, c);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.userData.canvas = c; return t;
}
function txt(x, s, px, py, { font = '800 100px Archivo', color = '#fff', align = 'center', track = 0, base = 'middle' } = {}) {
  x.font = font; x.letterSpacing = `${track}px`; x.fillStyle = color; x.textAlign = align; x.textBaseline = base; x.fillText(s, px, py);
}
const black = () => phys({ color: 0x0d0e10, roughness: 0.32, clearcoat: 0.6, clearcoatRoughness: 0.25 });
const steel = () => phys({ color: 0xa89e92, metalness: 0.7, roughness: 0.42, clearcoat: 0.25 });

// ------------------------------------------------------------------ rolling: back and forth along the thigh, with stops
const ROLLS = [[0.35, 7.35, 0.07], [25.2, 29.9, 0.06], [44.2, 52.3, 0.06], [66.0, 70.4, 0.065]];   // [start, stop, amplitude in metres]
const RATE = (t) => (t > 65.8 && t < 70.6 ? 0.62 : 0.42);                                          // strokes a second (brisker for the warm-up)
const PHASE = (() => { const dt = 0.005, n = Math.ceil((T.end + 2) / dt), a = new Float32Array(n); let s = 0; for (let i = 0; i < n; i++) { a[i] = s; s += RATE(i * dt) * dt; } return { a, dt }; })();
const phaseAt = (t) => { const i = Math.max(0, Math.min(PHASE.a.length - 2, Math.floor(t / PHASE.dt))), f = t / PHASE.dt - i; return lerp(PHASE.a[i], PHASE.a[i + 1], f); };
function rollU(t) {   // how far the body has moved toward its feet (m); the roller moves half as far and turns
  let a = 0; for (const [t0, t1, A] of ROLLS) a = Math.max(a, A * ss(t0, t0 + 0.7, t) * (1 - ss(t1 - 0.7, t1, t)));
  return a * Math.sin(Math.PI * 2 * (phaseAt(t) - phaseAt(0.45)));
}

// ------------------------------------------------------------------ materials: fascia (collagen sheets, two sets of crossing fibres)
function fasciaMat({ color = 0xf3eee4, alpha = 0.08, rim = 0.42, fib = 0.38, freq = 1300, along = 0.35 } = {}) {
  return new THREE.ShaderMaterial({
    uniforms: { uC: { value: new THREE.Color(color) }, uA: { value: alpha }, uR: { value: rim }, uF: { value: fib }, uK: { value: freq }, uL: { value: along }, uO: { value: 0 } },
    vertexShader: 'attribute vec3 rest; varying vec3 vN; varying vec3 vV; varying vec3 vR; void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); vR = rest; gl_Position = projectionMatrix * mv; }',
    fragmentShader: `uniform vec3 uC; uniform float uA, uR, uF, uK, uL, uO; varying vec3 vN; varying vec3 vV; varying vec3 vR;
      void main(){
        float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.0);
        float a = sin((vR.y + vR.x * uL + vR.z * 0.2) * uK + 2.6 * sin(vR.y * 37.0 + vR.x * 23.0));
        float b = sin((vR.y - vR.x * uL * 0.9 - vR.z * 0.4) * uK * 0.83 + 2.1 * sin(vR.x * 41.0 + vR.z * 29.0));
        float fib = smoothstep(0.5, 1.0, a) + 0.55 * smoothstep(0.62, 1.0, b);
        float al = clamp(uA + uR * f + uF * fib * (0.45 + 0.55 * f), 0.0, 0.95) * uO;
        gl_FragColor = vec4(uC * (0.72 + 0.45 * f + 0.3 * fib), al);
      }`,
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
  });
}
function muscleMat() { const m = tissueMat('muscle', { transparent: true, opacity: 0, color: new THREE.Color(0x561a24), sheen: 0.22, sheenColor: new THREE.Color(0xb86a78), clearcoat: 0.08 }); m.emissive.set(0xe0283a); return m; }

// ------------------------------------------------------------------ props
function makeMat(scene) {
  const w = 0.61, l = 1.83, r = 0.03, sh = new THREE.Shape();
  sh.moveTo(-w / 2 + r, -l / 2); sh.lineTo(w / 2 - r, -l / 2); sh.quadraticCurveTo(w / 2, -l / 2, w / 2, -l / 2 + r); sh.lineTo(w / 2, l / 2 - r); sh.quadraticCurveTo(w / 2, l / 2, w / 2 - r, l / 2);
  sh.lineTo(-w / 2 + r, l / 2); sh.quadraticCurveTo(-w / 2, l / 2, -w / 2, l / 2 - r); sh.lineTo(-w / 2, -l / 2 + r); sh.quadraticCurveTo(-w / 2, -l / 2, -w / 2 + r, -l / 2);
  const g = new THREE.ExtrudeGeometry(sh, { depth: MAT_H, bevelEnabled: true, bevelThickness: 0.0012, bevelSize: 0.0012, bevelSegments: 2, curveSegments: 12 });
  g.rotateX(Math.PI / 2); g.translate(0, MAT_H, 0);
  const tex = noiseTex(11, 512, 0.82, 1.0, 40);
  const m = new THREE.Mesh(g, phys({ color: 0x23272d, roughness: 0.9, roughnessMap: tex, bumpMap: tex, bumpScale: 0.6, clearcoat: 0.0, sheen: 0.3, sheenColor: new THREE.Color(0x6a7280) }));
  m.position.z = MAT_Z; m.receiveShadow = true; m.layers.enable(1); scene.add(m); return m;
}
// the foam roller: dense black foam with a grid of small nubs; its end cap reads MYOFASCIAL
function makeRoller(scene) {
  const g = new THREE.Group(); scene.add(g);                       // moves along z and turns about x
  const nub = canvasTex(256, 256, (x, w, h) => { x.fillStyle = '#000'; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { const cx = (i + 0.5 + (j % 2) * 0.5) * (w / 4), cy = (j + 0.5) * (h / 4), gr = x.createRadialGradient(cx, cy, 0, cx, cy, w / 9);
      gr.addColorStop(0, '#fff'); gr.addColorStop(0.6, '#777'); gr.addColorStop(1, '#000'); x.fillStyle = gr; x.beginPath(); x.arc(cx % w, cy, w / 9, 0, Math.PI * 2); x.fill(); } });
  nub.colorSpace = THREE.NoColorSpace; nub.wrapS = nub.wrapT = THREE.RepeatWrapping; nub.repeat.set(14, 9);
  const foam = phys({ color: 0x24272c, roughness: 0.86, bumpMap: nub, bumpScale: 1.6, sheen: 0.4, sheenColor: new THREE.Color(0x59606b), sheenRoughness: 0.7 });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(RR, RR, RL, 128, 1, true), foam); body.rotation.z = -Math.PI / 2; g.add(body);
  // the end caps: a darker disc; the +x one carries the label
  const capMat = phys({ color: 0x1a1c20, roughness: 0.7, clearcoat: 0.2 });
  const caps = [];
  for (const s of [1, -1]) {
    const c = new THREE.Group(); c.position.x = (s * RL) / 2; c.rotation.y = (s * Math.PI) / 2; g.add(c); caps.push(c);
    const disc = new THREE.Mesh(new THREE.CircleGeometry(RR, 96), capMat); c.add(disc);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(RR - 0.002, 0.0025, 12, 96), foam); c.add(rim);
  }
  const cap = caps[0];
  const labTex = canvasTex(512, 512, (x, w, h) => { x.clearRect(0, 0, w, h);
    x.strokeStyle = 'rgba(210,214,220,0.55)'; x.lineWidth = 5; x.beginPath(); x.arc(w / 2, h / 2, w * 0.43, 0, Math.PI * 2); x.stroke();
    txt(x, 'MYOFASCIAL', w / 2, h * 0.36, { font: '700 52px Archivo', color: '#e6e8ec', track: 9 });
    txt(x, 'PRO · 45 CM', w / 2, h * 0.75, { font: '500 26px "Geist Mono"', color: '#9a9ea6', track: 6 }); });
  const label = new THREE.Mesh(new THREE.CircleGeometry(RR, 96), new THREE.MeshPhysicalMaterial({ map: labTex, transparent: true, roughness: 0.5, depthWrite: false })); label.position.z = 0.0006; cap.add(label);
  shadows(body); body.receiveShadow = true; g.traverse((o) => o.layers.enable(1));
  return { g, body, cap, label, labTex };
}
// iron plates: a lathe profile (hub, web, rim), 46 of 20 kg and one of 5 kg, on a steel platen over a sample of fascia
function plateGeo(R, T2) {
  const k = R / 0.225, h = T2 / 2, pts = [[0.026, -h], [0.068, -h], [0.078, -h * 0.6], [0.19, -h * 0.6], [0.2, -h], [0.225, -h], [0.225, h], [0.2, h], [0.19, h * 0.6], [0.078, h * 0.6], [0.068, h], [0.026, h]].map(([r, y]) => new THREE.Vector2(r === 0.026 ? 0.026 : r * k, y));
  pts.push(pts[0].clone());
  const g = new THREE.LatheGeometry(pts, 96); g.computeVertexNormals(); return g;
}
function makeTower(scene) {
  const g = new THREE.Group(); g.position.copy(TOWER); scene.add(g);
  const base = new THREE.Mesh(new RoundedBoxGeometry(0.3, 0.014, 0.3, 3, 0.003), steel()); base.position.y = 0.007; g.add(base);
  const fibTex = canvasTex(512, 256, (x, w, h) => { x.fillStyle = '#ece6da'; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 900; i++) { const y = hash(i * 1.7) * h, a = (hash(i * 3.1) - 0.5) * 0.5; x.strokeStyle = `rgba(150,140,125,${0.12 + 0.25 * hash(i * 5.3)})`; x.lineWidth = 1 + 2 * hash(i * 7.9);
      x.beginPath(); x.moveTo(0, y); x.bezierCurveTo(w * 0.3, y + a * 60, w * 0.6, y - a * 60, w, y + a * 30); x.stroke(); } });
  const sample = new THREE.Mesh(new RoundedBoxGeometry(0.17, 0.026, 0.13, 3, 0.005), phys({ color: 0xffffff, map: fibTex, roughness: 0.55, sheen: 0.6, sheenColor: new THREE.Color(0xfff8ee), clearcoat: 0.35 }));
  sample.position.y = 0.014 + 0.013; g.add(sample);
  const platen = new THREE.Mesh(new RoundedBoxGeometry(0.25, 0.014, 0.25, 3, 0.003), steel()); g.add(platen);
  const labTex = canvasTex(1024, 96, (x, w, h) => { x.fillStyle = '#b9bcc2'; x.fillRect(0, 0, w, h); txt(x, 'FASCIA LATA', w / 2, h / 2 + 2, { font: '600 54px "Geist Mono"', color: '#2a2c30', track: 14 }); });
  const lab = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 0.014), new THREE.MeshBasicMaterial({ map: labTex })); lab.position.set(0, 0.007, 0.1505); g.add(lab);
  const iron = phys({ color: 0x232529, metalness: 0.55, roughness: 0.42, clearcoat: 0.35, clearcoatRoughness: 0.4 });
  const plates = new THREE.InstancedMesh(plateGeo(PLATE_R, PLATE_T), iron, NPLATES); plates.castShadow = plates.receiveShadow = true; plates.frustumCulled = false; g.add(plates);
  const ringTex = canvasTex(1024, 1024, (x, w, h) => { x.clearRect(0, 0, w, h); x.translate(w / 2, h / 2);
    for (let i = 0; i < 2; i++) { x.save(); x.rotate(i * Math.PI); txt(x, '20 KG', 0, -w * 0.33, { font: '800 92px Archivo', color: 'rgba(225,228,232,0.85)', track: 8 }); x.restore(); } });
  const rings = new THREE.InstancedMesh(new THREE.RingGeometry(0.08, 0.19, 64).rotateX(-Math.PI / 2), new THREE.MeshPhysicalMaterial({ map: ringTex, transparent: true, roughness: 0.5, depthWrite: false }), NPLATES); rings.frustumCulled = false; g.add(rings);
  const five = new THREE.Mesh(plateGeo(0.105, 0.022), iron); five.castShadow = five.receiveShadow = true; g.add(five);
  const fiveTex = canvasTex(512, 512, (x, w, h) => { x.clearRect(0, 0, w, h); x.translate(w / 2, h / 2); txt(x, '5 KG', 0, -w * 0.3, { font: '800 70px Archivo', color: 'rgba(225,228,232,0.85)', track: 6 }); });
  const fiveLab = new THREE.Mesh(new THREE.RingGeometry(0.04, 0.09, 48).rotateX(-Math.PI / 2), new THREE.MeshPhysicalMaterial({ map: fiveTex, transparent: true, roughness: 0.5, depthWrite: false })); five.add(fiveLab); fiveLab.position.y = 0.0067;
  shadows(base); shadows(sample); shadows(platen); g.traverse((o) => o.layers.enable(1));
  // when each plate lands: a quick run that speeds up, the 5 kg plate last
  const land = []; for (let i = 0; i < NPLATES; i++) land.push(21.75 + 2.85 * Math.pow(i / (NPLATES - 1), 0.92));
  return { g, sample, platen, plates, rings, five, land, land5: 24.85, y0: 0.014 + 0.026 + 0.014 };
}
// ------------------------------------------------------------------ the sticky note: the fascia would like a word
function makeNote(text, small, tilt, size = 104, S2 = 0.07) {
  const tex = canvasTex(512, 512, (x, w, h) => {
    x.fillStyle = '#f1dc69'; x.fillRect(0, 0, w, h);
    const gr = x.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(120,90,0,0.10)'); gr.addColorStop(0.16, 'rgba(120,90,0,0)'); gr.addColorStop(1, 'rgba(255,255,255,0.05)'); x.fillStyle = gr; x.fillRect(0, 0, w, h);
    x.save(); x.translate(w / 2, h / 2 - 14); x.rotate(tilt); const ls = text.split('\n');
    ls.forEach((ln, i) => txt(x, ln, 0, (i - (ls.length - 1) / 2) * size * 1.08, { font: `800 ${size}px Archivo`, color: '#1b1c1f', track: 1 }));
    if (small) txt(x, small, 0, ((ls.length - 1) / 2) * size * 1.08 + size * 1.02, { font: 'italic 500 48px Archivo', color: '#3a3524' });
    x.restore(); });
  const geo = new THREE.PlaneGeometry(S2, S2, 16, 16), P = geo.attributes.position;
  for (let i = 0; i < P.count; i++) { const x = P.getX(i), y = P.getY(i); P.setZ(i, -(x * x) / (2 * 0.09) + (y < -0.016 ? 0.05 * (y + 0.016) * (y + 0.016) * 40 : 0)); }   // curves round the thigh; the free bottom edge lifts a little
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, new THREE.MeshPhysicalMaterial({ map: tex, roughness: 0.85, side: THREE.DoubleSide, transparent: true }));
  m.castShadow = true; m.layers.enable(1); m.renderOrder = 5;
  return m;
}
// ------------------------------------------------------------------ the boring stuff: a toy dog on a leash, a dumbbell, a calendar
function makeDog(scene) {
  const g = new THREE.Group(); scene.add(g);
  const wood = phys({ color: 0xd9b98a, roughness: 0.55, clearcoat: 0.35 }), dark = phys({ color: 0x3a2a1c, roughness: 0.5 }), eyeM = phys({ color: 0x0b0b0c, roughness: 0.2, clearcoat: 1 });
  const b = (w, h, d, m, x, y, z, r = 0.01) => { const k = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, r), m); k.position.set(x, y, z); g.add(k); return k; };
  b(0.1, 0.08, 0.2, wood, 0, 0.11, 0, 0.025);                                   // body (it faces +z)
  const head = b(0.085, 0.08, 0.09, wood, 0, 0.175, 0.11, 0.022);
  b(0.05, 0.035, 0.05, wood, 0, 0.16, 0.165, 0.012);                             // snout
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.012, 16, 12), dark); nose.position.set(0, 0.17, 0.192); g.add(nose);
  for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.0075, 12, 10), eyeM); e.position.set(s * 0.025, 0.195, 0.153); g.add(e); }
  const ears = [-1, 1].map((s) => { const p = new THREE.Group(); p.position.set(s * 0.045, 0.205, 0.1); g.add(p); const e = new THREE.Mesh(new RoundedBoxGeometry(0.012, 0.06, 0.035, 2, 0.005), dark); e.position.y = -0.026; p.add(e); return p; });
  const tail = new THREE.Group(); tail.position.set(0, 0.135, -0.1); g.add(tail);
  { const pts = []; for (let i = 0; i <= 30; i++) { const k = i / 30, a = k * Math.PI * 2 * 4; pts.push(new THREE.Vector3(Math.cos(a) * 0.008, k * 0.055, -k * 0.02 + Math.sin(a) * 0.008)); }   // a spring tail
    tail.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 90, 0.0025, 6), phys({ color: 0x9a9ca0, metalness: 1, roughness: 0.35 })));
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.01, 12, 10), wood); knob.position.set(0, 0.06, -0.022); tail.add(knob); }
  const wheels = []; for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.018, 28), dark); w.rotation.z = Math.PI / 2; const p = new THREE.Group(); p.position.set(sx * 0.062, 0.035, sz * 0.065); p.add(w); g.add(p); wheels.push(p); }
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.006, 8, 24), phys({ color: 0x7a2c22, roughness: 0.5 })); collar.position.set(0, 0.15, 0.07); collar.rotation.x = Math.PI / 2 - 0.4; g.add(collar);
  shadows(g); g.traverse((o) => o.layers.enable(1));
  return { g, head, ears, tail, wheels, ring: new THREE.Vector3(0, 0.15, 0.1) };
}
function makeDumbbell(scene) {
  const g = new THREE.Group(); scene.add(g); const rubber = phys({ color: 0x17181b, roughness: 0.62, clearcoat: 0.25, clearcoatRoughness: 0.5 });
  const chrome = phys({ color: 0x9a9da3, metalness: 0.9, roughness: 0.42, clearcoat: 0.2 });
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.0145, 0.0145, 0.135, 32), chrome); handle.rotation.z = Math.PI / 2; g.add(handle);
  for (const s of [-1, 1]) {
    const head = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.052, 0.06, 6), rubber); head.rotation.z = Math.PI / 2; head.position.x = s * 0.0975; g.add(head);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.062, 24), chrome); cap.rotation.z = Math.PI / 2; cap.position.x = s * 0.0975; g.add(cap);
    const coll = new THREE.Mesh(new THREE.CylinderGeometry(0.021, 0.021, 0.008, 32), chrome); coll.rotation.z = Math.PI / 2; coll.position.x = s * 0.064; g.add(coll);
  }
  shadows(g); g.traverse((o) => o.layers.enable(1)); return g;
}
// a little desk calendar: a week, each day ticked in turn
function makeCalendar(scene) {
  const g = new THREE.Group(); scene.add(g);
  const W2 = 0.24, H2 = 0.17, days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  const texs = [...Array(8).keys()].map((n) => canvasTex(1024, 726, (x, w, h) => {
    x.fillStyle = '#eceae4'; x.fillRect(0, 0, w, h); x.fillStyle = '#26282d'; x.fillRect(0, 0, w, h * 0.22);
    txt(x, 'EVERY DAY', w / 2, h * 0.115, { font: '700 64px "Geist Mono"', color: '#eceae4', track: 18 });
    for (let i = 0; i < 7; i++) { const cx = w * (0.08 + (i + 0.5) * 0.84 / 7), cy = h * 0.6;
      txt(x, days[i], cx, h * 0.36, { font: '600 34px "Geist Mono"', color: '#55585f', track: 4 });
      x.strokeStyle = '#b9bcc2'; x.lineWidth = 4; x.strokeRect(cx - 50, cy - 50, 100, 100);
      if (i < n) { x.strokeStyle = '#1d1f23'; x.lineWidth = 16; x.lineCap = 'round'; x.lineJoin = 'round'; x.beginPath(); x.moveTo(cx - 30, cy + 2); x.lineTo(cx - 8, cy + 26); x.lineTo(cx + 34, cy - 28); x.stroke(); } } }));
  const face = new THREE.Mesh(new THREE.PlaneGeometry(W2, H2), new THREE.MeshPhysicalMaterial({ map: texs[0], roughness: 0.7 }));
  const back = new THREE.Mesh(new RoundedBoxGeometry(W2 + 0.012, H2 + 0.012, 0.008, 3, 0.003), black());
  const stand = new THREE.Group(); stand.rotation.x = -0.2; g.add(stand);                         // leaning back on its easel
  back.position.set(0, H2 / 2 + 0.006, -0.0045); face.position.set(0, H2 / 2 + 0.006, 0.0002); stand.add(back); stand.add(face);
  const leg = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.15, 0.006), black()); leg.position.set(0, 0.075, -0.055); leg.rotation.x = 0.42; g.add(leg);
  shadows(g); g.traverse((o) => o.layers.enable(1));
  return { g, face, texs, n: 0 };
}
// ------------------------------------------------------------------ the repair kit: a red metal toolbox; inside, a note
function makeToolbox(scene) {
  const g = new THREE.Group(); g.position.copy(BOX); g.rotation.y = 0.3; scene.add(g);   // its front toward both cameras that see it
  const red = phys({ color: 0xa3231b, roughness: 0.38, metalness: 0.35, clearcoat: 0.55, clearcoatRoughness: 0.3 }), dark = phys({ color: 0x1b1c1f, roughness: 0.5, metalness: 0.4 });
  const L = 0.42, D = 0.2, Hb = 0.14, Hl = 0.05, t2 = 0.006;
  // the tray: a box open at the top (five walls)
  const walls = [[L, t2, D, 0, t2 / 2, 0], [L, Hb, t2, 0, Hb / 2, D / 2 - t2 / 2], [L, Hb, t2, 0, Hb / 2, -D / 2 + t2 / 2], [t2, Hb, D, L / 2 - t2 / 2, Hb / 2, 0], [t2, Hb, D, -L / 2 + t2 / 2, Hb / 2, 0]];
  for (const [w, h, d, x, y, z] of walls) { const m = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 2, 0.002), red); m.position.set(x, y, z); g.add(m); }
  const inner = new THREE.Mesh(new THREE.PlaneGeometry(L - 0.02, D - 0.02), phys({ color: 0x2a0d0a, roughness: 0.8 })); inner.rotation.x = -Math.PI / 2; inner.position.y = t2 + 0.001; g.add(inner);
  // the lid: hinged along the back edge
  const hinge = new THREE.Group(); hinge.position.set(0, Hb, -D / 2); g.add(hinge);
  const lid = new THREE.Mesh(new RoundedBoxGeometry(L + 0.008, Hl, D + 0.008, 3, 0.008), red); lid.position.set(0, Hl / 2, D / 2); hinge.add(lid);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.007, 12, 40, Math.PI), dark); handle.position.set(0, Hl, D / 2); hinge.add(handle);
  for (const s of [-1, 1]) { const latch = new THREE.Mesh(new RoundedBoxGeometry(0.03, 0.03, 0.008, 2, 0.002), dark); latch.position.set(s * 0.13, Hb - 0.005, D / 2 + 0.006); g.add(latch); }
  const lab = canvasTex(1024, 220, (x, w, h) => { x.clearRect(0, 0, w, h); txt(x, 'REPAIR KIT', w / 2, h / 2 + 6, { font: '800 150px Archivo', color: '#f1ece2', track: 22 }); });
  const label = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.064), new THREE.MeshBasicMaterial({ map: lab, transparent: true, depthWrite: false })); label.position.set(0, Hb * 0.48, D / 2 + 0.0035); g.add(label);
  const note = makeNote('SEE A\nDOCTOR', '', -0.06); note.geometry = new THREE.PlaneGeometry(0.1, 0.1); note.rotation.x = -Math.PI / 2 + 0.25; note.rotation.z = 0.12; note.position.set(0.02, t2 + 0.03, 0.0); g.add(note);
  const prop = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.03, 0.012), phys({ color: 0x8a8f99, roughness: 0.6 })); prop.position.set(0.02, t2 + 0.015, -0.04); g.add(prop);   // the note leans on a little block so it faces up and out
  shadows(g); label.castShadow = false; g.traverse((o) => o.layers.enable(1));
  return { g, hinge, note, Hb, D };
}
// ------------------------------------------------------------------ the arm and the hand on the mat: a pose solved in the world
function solveArmW(A, { hand, elbow = null, wE = 0.6, init }) {
  const h = new THREE.Vector3(), e = new THREE.Vector3();
  const err = (p) => { poseArm(A, p); A.girdle.updateMatrixWorld(true); A.mc.getWorldPosition(h); let E = h.distanceTo(hand);
    A.elbow.getWorldPosition(e); if (elbow) E += wE * e.distanceTo(elbow); E += 3 * Math.max(0, MAT_H + 0.025 - e.y) + 3 * Math.max(0, MAT_H + 0.018 - h.y); return E; };
  let best = { dir: [...init.dir], twist: init.twist, elbow: init.elbow, retract: init.retract || 0, elevate: init.elevate || 0 }, bestE = err(best);
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
const mixArm = (a, b, k) => ({ dir: a.dir.map((v, i) => lerp(v, b.dir[i], k)), twist: lerp(a.twist, b.twist, k), elbow: lerp(a.elbow, b.elbow, k), retract: lerp(a.retract || 0, b.retract || 0, k), elevate: lerp(a.elevate || 0, b.elevate || 0, k) });

// ------------------------------------------------------------------ build
function legBinder(R, Side) {   // pelvis above the hip, the thigh between, the shank below the knee (standing frame)
  const G = R.legs[Side];
  return (p) => (p.y > G.K.y + 0.05 ? [R.pelvis, G.hip, ss(G.H.y + 0.07, G.H.y - 0.05, p.y)] : [G.hip, G.knee, ss(G.K.y + 0.05, G.K.y - 0.03, p.y)]);
}
function restGeo(m, push = 0) {   // an atlas mesh in the standing frame (float normals), optionally pushed out along its normals
  const g = new THREE.BufferGeometry(), h = m.userData.home, P = m.geometry.attributes.position, N = m.geometry.attributes.normal;
  const p = new Float32Array(P.count * 3), n = new Float32Array(P.count * 3);
  for (let i = 0; i < P.count; i++) { const nx = N.getX(i), ny = N.getY(i), nz = N.getZ(i); p[i * 3] = P.getX(i) + h.x + nx * push; p[i * 3 + 1] = P.getY(i) + h.y + ny * push; p[i * 3 + 2] = P.getZ(i) + h.z + nz * push; n[i * 3] = nx; n[i * 3 + 1] = ny; n[i * 3 + 2] = nz; }
  g.setAttribute('position', new THREE.BufferAttribute(p, 3)); g.setAttribute('normal', new THREE.BufferAttribute(n, 3)); g.setIndex(m.geometry.index.clone());
  return g;
}
function sideQuat(a) {   // standing frame -> lying on the left side, head toward -z, front toward +x, the trunk rising by a
  const m = new THREE.Matrix4().makeBasis(new THREE.Vector3(0, -Math.cos(a), -Math.sin(a)), new THREE.Vector3(0, Math.sin(a), -Math.cos(a)), new THREE.Vector3(1, 0, 0));
  return new THREE.Quaternion().setFromRotationMatrix(m);
}
async function build(S, cfg) {
  const scene = S.scene;
  S.fog.near = 4; S.fog.far = 14;
  S.table.scale.set(3, 3, 1); S.tableMat.clearcoat = 0.06; S.tableMat.specularIntensity = 0.3;
  for (const m of [S.tableMat.map, S.tableMat.roughnessMap]) if (m) { m.wrapS = m.wrapT = THREE.RepeatWrapping; m.repeat.multiplyScalar(3); }
  W.cfg = cfg;
  makeMat(scene);
  // ---- the skeleton
  const meshes = await loadAnatomy(skeletonKind());
  const R = W.rig = buildRig(meshes);
  W.body = new THREE.Group(); scene.add(W.body); R.root.position.copy(R.P0).negate(); W.body.add(R.root);
  for (const m of meshes) { m.castShadow = true; m.receiveShadow = true; m.layers.enable(1); }
  W.bones = meshes.filter((m) => ['bone', 'tooth', 'cartilage'].includes(m.userData.tissue));
  W.Q = sideQuat(ALPHA); W.D = new THREE.Vector3(0, Math.sin(ALPHA), -Math.cos(ALPHA));   // up the spine, in the world
  W.PY = 0.31;
  // ---- the factory stamp: on the front of the breastbone
  { const st = R.byName.get('Body of sternum'); st.material = st.material.clone();
    W.stampSpot = stampSpot(st, { from: [0, 0.006, 0.12], dir: [0, 0, -1], spread: 0.004 });
    if (W.stampSpot) W.stamp = stamp(st, { canvas: stampCanvas(['HUMAN FACTORY', 'SETTINGS'], '', { frame: false }), center: W.stampSpot.center, normal: W.stampSpot.normal, up: [0, 1, 0], width: 0.04, depth: 0.03, opacity: 0.6 }); }
  // ---- the thighs' muscles, each in a thin sleeve of fascia, and the iliotibial tract (the thick band on the outside)
  const MUS = /^(left|right) (vastus lateralis|vastus medialis|vastus intermedius|rectus femoris|sartorius|semitendinosus|semimembranosus|tensor fasciae latae)$|^(long|short) head of (left|right) biceps femoris$/i;
  const soft = await loadAnatomy((p) => (MUS.test(p.name) ? 'muscle' : /^(left|right) iliotibial tract$/i.test(p.name) ? 'cartilage' : null));
  W.musMat = muscleMat(); W.sheathMat = fasciaMat({ alpha: 0.05, rim: 0.36, fib: 0.3 }); W.itbMat = fasciaMat({ alpha: 0.3, rim: 0.4, fib: 0.5, freq: 1700, along: 0.12 });
  W.skins = []; W.itb = {};
  for (const m of soft) {
    const Side = /\bright\b/i.test(m.userData.name) ? 'Right' : 'Left', bind = legBinder(R, Side), isITB = /iliotibial/i.test(m.userData.name);
    if (isITB) { const sk = skinned(restGeo(m, 0.0015), bind, R, W.itbMat); sk.mesh.renderOrder = 4; scene.add(sk.mesh); W.skins.push(sk); W.itb[Side] = sk; continue; }
    const mu = skinned(restGeo(m), bind, R, W.musMat); mu.mesh.castShadow = true; mu.mesh.receiveShadow = true; mu.mesh.layers.enable(1); scene.add(mu.mesh); W.skins.push(mu); mu.muscle = true;
    const sh = skinned(restGeo(m, 0.0018), bind, R, W.sheathMat); sh.mesh.renderOrder = 3; scene.add(sh.mesh); W.skins.push(sh);
  }
  // ---- the props
  W.roll = makeRoller(scene); W.tower = makeTower(scene);
  W.dog = makeDog(scene); W.db = makeDumbbell(scene); W.cal = makeCalendar(scene); W.box = makeToolbox(scene);
  W.leash = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshPhysicalMaterial({ color: 0x6e2a22, roughness: 0.6 })); W.leash.castShadow = true; W.leash.layers.enable(1); W.leash.frustumCulled = false; scene.add(W.leash);
  W.logo = makeLogoRing(0.052); W.roll.cap.add(W.logo.g); W.logo.g.position.z = 0.0012;
  // ---- the pose at rest (u = 0): where the hips are, where the hands go; then the height that puts the band on the roller
  poseBody(0, { solve: true });
  // the roller sits under the middle of the lower thigh
  const HL = hipW('Left'), KL = new THREE.Vector3(); R.legs.Left.knee.getWorldPosition(KL);
  W.RZ0 = lerp(HL.z, KL.z, 0.5);
  for (let it = 0; it < 3; it++) {
    poseBody(0, {}); W.body.updateMatrixWorld(true); W.itb.Left.update();
    const P = W.itb.Left.geo.attributes.position; let lo = 9; for (let i = 0; i < P.count; i++) if (Math.abs(P.getZ(i) - W.RZ0) < 0.04 && Math.abs(P.getX(i) - ROLLX) < 0.12) lo = Math.min(lo, P.getY(i));
    W.PY += MAT_H + 2 * RR + 0.003 - lo;
  }
  poseBody(0, { solve: true });
  // ---- the note: on the top thigh's band, at its highest point half way down the thigh; it rides with the thigh
  { W.itb.Right.update(); const P = W.itb.Right.geo.attributes.position, GR = R.legs.Right, a = hipW('Right'), kn = new THREE.Vector3(); GR.knee.getWorldPosition(kn);
    const mid = a.clone().lerp(kn, 0.46), axis = kn.clone().sub(a).normalize(); let best = null, by = -9;
    for (let i = 0; i < P.count; i++) { _v.fromBufferAttribute(P, i); const along = _v.clone().sub(mid).dot(axis); if (Math.abs(along) < 0.03 && _v.y > by) { by = _v.y; best = _v.clone(); } }
    const n = best.clone().sub(mid.clone().addScaledVector(axis, best.clone().sub(mid).dot(axis))).normalize();   // out from the thigh's axis
    W.note = makeNote('WE NEED\nTO TALK.', '— your fascia', -0.05, 92, 0.088); GR.hip.add(W.note);
    const up = axis.clone().negate().sub(n.clone().multiplyScalar(-axis.dot(n))).normalize();   // the note's up: toward the hip
    const q = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3().crossVectors(up, n), up, n)).multiply(new THREE.Quaternion().setFromAxisAngle(Z, 0.9));
    GR.hip.updateMatrixWorld(true); const inv = new THREE.Quaternion(); GR.hip.getWorldQuaternion(inv).invert();
    W.noteHome = GR.hip.worldToLocal(best.clone().addScaledVector(n, 0.004)); W.noteQ = inv.multiply(q); W.noteN = n.clone().applyQuaternion(new THREE.Quaternion().copy(inv));
    W.note.position.copy(W.noteHome); W.note.quaternion.copy(W.noteQ); W.note.visible = false; }
  // ---- the fascia lines: light that runs from the thigh on through the whole body
  W.lineMat = new THREE.ShaderMaterial({
    uniforms: { uR: { value: 0 }, uO: { value: 0 }, uT: { value: 0 }, uC: { value: new THREE.Color(0xf6f1e6) } },
    vertexShader: 'varying vec2 vU; void main(){ vU = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'uniform float uR, uO, uT; uniform vec3 uC; varying vec2 vU; void main(){ float shown = 1.0 - smoothstep(uR - 0.06, uR, vU.x); float spark = exp(-pow((vU.x - fract(uT)) * 18.0, 2.0)); float a = (0.6 + 0.4 * spark) * shown * uO; gl_FragColor = vec4(uC * (1.1 + 1.4 * spark), a); }',
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  W.lines = [...Array(5).keys()].map(() => { const m = new THREE.Mesh(new THREE.BufferGeometry(), W.lineMat); m.frustumCulled = false; m.renderOrder = 8; m.visible = false; scene.add(m); return m; });
  // ---- the goniometer: a fan in the plane the top leg swings in, centred on its hip
  W.HR0 = hipW('Right').clone();
  W.gon = makeGonio(scene, W.HR0);
  // ---- the nerve: a line of light from the top thigh up the spine to the brain
  W.nerveMat = new THREE.ShaderMaterial({
    uniforms: { uP: { value: 0 }, uO: { value: 0 }, uG: { value: 1 }, uC: { value: new THREE.Color(0xc4d6ff) } },
    vertexShader: 'varying vec2 vU; void main(){ vU = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'uniform float uP, uO, uG; uniform vec3 uC; varying vec2 vU; void main(){ float p = 0.0; for (int i = 0; i < 4; i++) { float c = fract(uP + float(i) * 0.25); p += exp(-pow((vU.x - c) * 26.0, 2.0)); } float a = (0.35 + 1.0 * p * uG) * uO; gl_FragColor = vec4(uC * (0.7 + 1.3 * p * uG), a); }',
    transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending });
  W.nerve = new THREE.Mesh(new THREE.BufferGeometry(), W.nerveMat); W.nerve.frustumCulled = false; W.nerve.renderOrder = 9; scene.add(W.nerve);
  // ---- light
  W.key = spot(scene, { color: 0xffe9d2, pos: new THREE.Vector3(1.5, 2.7, 1.2), target: new THREE.Vector3(0, 0.25, -0.1), angle: 0.5, penumbra: 0.8, shadow: true, size: cfg.shadow ?? 1024 });
  W.key.shadow.camera.far = 7;
  W.rim = spot(scene, { color: 0xa9c4ff, pos: new THREE.Vector3(-1.6, 2.0, -1.4), target: new THREE.Vector3(0, 0.3, 0), angle: 0.55, penumbra: 0.9 });
  W.fill = spot(scene, { color: 0xc8d6ff, pos: new THREE.Vector3(1.8, 1.0, -1.2), target: new THREE.Vector3(0, 0.3, -0.2), angle: 0.55, penumbra: 1 });
  W.towerLight = spot(scene, { color: 0xfff1d8, pos: new THREE.Vector3(-0.4, 2.6, 1.3), target: new THREE.Vector3(TOWER.x, 0.7, TOWER.z), angle: 0.42, penumbra: 0.7 });
  W.objLight = spot(scene, { color: 0xfff1d8, pos: new THREE.Vector3(1.6, 1.9, 0.6), target: new THREE.Vector3(0.66, 0.05, 0.12), angle: 0.42, penumbra: 0.8 });
  W.boxLight = spot(scene, { color: 0xfff1d8, pos: new THREE.Vector3(1.4, 1.7, -0.3), target: new THREE.Vector3(BOX.x, 0.1, BOX.z), angle: 0.3, penumbra: 0.8 });
  W.rollLight = spot(scene, { color: 0xfff1e0, pos: new THREE.Vector3(0.95, 0.32, -0.32), target: new THREE.Vector3(ROLLX, RR * 0.8, W.RZ0), angle: 0.26, penumbra: 0.9 });
  W.capLight = spot(scene, { color: 0xfff1e0, pos: new THREE.Vector3(1.1, 0.45, 0.55), target: new THREE.Vector3(RL / 2 + ROLLX, RR, W.RZ0), angle: 0.25, penumbra: 0.9 });
  W.auditSolids = [['roller', W.roll.g], ['tower', W.tower.g, { floor: false }], ['dog', W.dog.g, { floor: false }], ['dumbbell', W.db, { floor: false }], ['calendar', W.cal.g, { floor: false }], ['repair kit', W.box.g, { floor: false }]];   // (they rise out of the floor and sink back into it)
  W.timing = { rolls: ROLLS, rate: [0.42, 0.62, 65.8, 70.6], wince: T.wince, note: NOTE_T, noteOff: NOTE_OFF, lines: [T.runs - 0.2, T.body + 0.3], plates: W.tower.land, five: W.tower.land5,
    legUp: [T.so2 - 0.05, T.rolling + 0.15], range: [T.rolling - 0.2, T.before + 0.1], more: [T.about2 - 0.1, T.more + 0.2], back: [T.trial, T.minutes2 + 0.3], legDown: [43.2, 44.2],
    sore: [T.after + 0.2, T.exercise2 + 0.4], nerve: [T.and4 - 0.3, 52.3], down: [T.turn - 0.05, T.pain + 0.15], swings: SWING, days: DAYS,
    dog: [T.walking - 0.5, T.walking + 0.25], db: [T.lifting - 0.35, T.lifting], cal: [T.moving - 0.1, T.moving + 0.3], ticks: TICKS, objOut: [65.6, 66.3],
    boxUp: [T.not - 0.3, T.not + 0.45], lid: [T.see - 0.25, T.see + 0.4], boxOut: [75.3, 76.0], logo: T.logo };
  return { stamp: W.stampSpot, PY: W.PY, RZ0: W.RZ0, HR0: W.HR0.toArray(), arms: W.armSol && Object.fromEntries(Object.entries(W.armSol).map(([k, v]) => [k, v.err])) };
}
// ------------------------------------------------------------------ the body over time
const _qp = new THREE.Quaternion(), _v = new THREE.Vector3(), _q1 = new THREE.Quaternion();
function hipW(Side) { const R = W.rig, G = R.legs[Side]; R.pelvis.updateMatrixWorld(true); R.pelvis.getWorldQuaternion(_qp); return G.H.clone().sub(R.P0).applyQuaternion(_qp).add(R.pelvis.getWorldPosition(new THREE.Vector3())); }
const U_A = 0.075;
function placeBody(u) { W.body.position.set(0, W.PY, u); W.body.quaternion.copy(W.Q); W.body.updateMatrixWorld(true); }
const NOTE_T = 7.35, NOTE_OFF = 30.25;                                  // the note slaps on at "like a word"; it lets go at "so what does rolling do?"
const SWING = [53.3, 53.9, 57.5, 58.1];                                // using it: the top leg swings, three times
const DAYS = [57.45, 58.3, 59.3];                                      // new collagen, day after day
const TICKS = [...Array(7).keys()].map((i) => +(T.every2 - 0.05 + i * 0.1).toFixed(3));   // the calendar's week, ticked
function legAt(t) {   // the top leg: 0 planted, 1 lifted straight at angle phi (the test; then the swings)
  const up1 = s5(T.so2 - 0.05, T.rolling + 0.15, t) * (1 - s5(43.2, 44.2, t));
  let phi = lerp(0.62, PHI0, s5(T.rolling - 0.2, T.before + 0.1, t));
  phi = lerp(phi, PHI1, s5(T.about2 - 0.1, T.more + 0.2, t));
  phi = lerp(phi, PHI0, s5(T.trial, T.minutes2 + 0.3, t));
  const up2 = s5(SWING[0], SWING[1], t) * (1 - s5(SWING[2], SWING[3], t));
  if (up2 > up1) { const c = clamp01((t - SWING[1]) / (SWING[2] - SWING[1])) * 3; phi = lerp(0.62, 1.02, 0.5 - 0.5 * Math.cos(2 * Math.PI * c)); return { up: up2, phi }; }
  return { up: up1, phi };
}
function poseBody(t, { solve = false } = {}) {
  const R = W.rig, u = W.cfg && W.cfg.dbg && W.cfg.dbg.u !== undefined ? W.cfg.dbg.u : rollU(t);
  const wince = Math.exp(-Math.pow((t - T.wince - 0.12) / 0.22, 2)), tap = pulse(t, T.wince - 0.14, T.wince + 1.2, 0.3), look = pulse(t, NOTE_T + 0.12, 9.7, 0.35);
  placeBody(u);
  bendSpine(R.seg, { lum: 0.02, tho: 0.05, cer: 0.12 + 0.24 * wince + 0.24 * look, side: -0.1 - 0.03 * wince, twist: 0.03 });   // (the wince is in the neck: a side bend would push the planted forearm into the floor)   // (look: down at the note)
  if (solve) solveArms();
  // the arms: a pose for the hips at -A, 0 and +A, blended
  for (const Side of ['Left', 'Right']) {
    const P = W.armSol[Side], k = clamp01(Math.abs(u) / U_A), p = mixArm(P.mid, u < 0 ? P.lo : P.hi, k);
    if (Side === 'Right' && tap > 0) { const q = mixArm(p, W.armSol.Right.head, s5(0, 1, tap)); Object.assign(p, q); }
    poseArm(R.arms[Side], p);
  }
  // the lower (left) leg: straight, carried on the roller
  const HL = hipW('Left'), GL = R.legs.Left, reach = (GL.L1 + GL.L2) * 0.985, dirB = new THREE.Vector3(0.02, -0.05, 1).normalize();
  _q1.setFromUnitVectors(W.D.clone().negate(), dirB).multiply(W.Q);
  legIK(R, 'Left', HL.clone().addScaledVector(dirB, reach), _q1.clone().multiply(new THREE.Quaternion().setFromAxisAngle(X, 0.35)), new THREE.Vector3(1, 0.15, 0));
  // the upper (right) leg: crossed over in front, its foot flat on the mat; or lifted straight and swung out (the test)
  const HR = hipW('Right'), GR = R.legs.Right, L = legAt(t);
  const plantT = new THREE.Vector3(FOOT.x, GR.A.y - GR.ground + MAT_H, FOOT.z), plantQ = new THREE.Quaternion().setFromAxisAngle(Y, 0.3);
  if (L.up < 0.001) legIK(R, 'Right', plantT, plantQ, new THREE.Vector3(0.45, 0.85, 0.2));
  else {
    const reachR = (GR.L1 + GR.L2) * 0.992, dirS = new THREE.Vector3(Math.sin(L.phi), 0, Math.cos(L.phi));
    const swingT = HR.clone().addScaledVector(dirS, reachR), swingQ = new THREE.Quaternion().setFromAxisAngle(Y, L.phi).multiply(new THREE.Quaternion().setFromUnitVectors(W.D.clone().negate(), Z)).multiply(W.Q);
    const k = L.up, tgt = plantT.clone().lerp(swingT, k); tgt.y += Math.sin(Math.PI * k) * 0.08;
    const q = plantQ.clone().slerp(swingQ, k), fwd = new THREE.Vector3(0.45, 0.85, 0.2).lerp(new THREE.Vector3(Math.cos(L.phi), 0.3, -Math.sin(L.phi)), k).normalize();
    legIK(R, 'Right', tgt, q, fwd);
  }
  W.body.updateMatrixWorld(true);
  return { u, wince, L };
}
function solveArms() {   // the lower forearm flat on the mat under the shoulder (planted: solved for the hips at -A, 0, +A);
  // the upper hand resting on the upper hip (it rides with the body)
  const R = W.rig; W.armSol = { Left: {}, Right: {} };
  placeBody(0); const sh = new THREE.Vector3(); R.arms.Left.arm.getWorldPosition(sh);
  W.shoulder0 = sh.clone();
  const tgtL = { hand: new THREE.Vector3(0.22, MAT_H + 0.022, sh.z - 0.05), elbow: new THREE.Vector3(0.0, MAT_H + 0.03, sh.z + 0.01) };
  for (const [key, u] of [['mid', 0], ['lo', -U_A], ['hi', U_A]]) {
    placeBody(u);
    W.armSol.Left[key] = solveArmW(R.arms.Left, { hand: tgtL.hand, elbow: tgtL.elbow, init: key === 'mid' ? { dir: [0.95, -0.25, 0.05], twist: 0.2, elbow: 1.4, elevate: 0.1 } : W.armSol.Left.mid });
  }
  placeBody(0);
  const GR = R.legs.Right, onHip = wp(R.pelvis, GR.H.clone().add(new THREE.Vector3(-0.075, 0.125, 0.05)));   // resting on the hip, not in it
  const sol = solveArmW(R.arms.Right, { hand: onHip, init: { dir: [0.15, -1, 0.12], twist: 0.3, elbow: 0.5 } });
  const at = R.seg.Atlas, onHead = wp(at.g, at.pivot.clone().add(new THREE.Vector3(-0.02, 0.07, 0.215)));   // a hand over the eyes, just in front of them
  const head = solveArmW(R.arms.Right, { hand: onHead, init: { dir: [0.1, -0.3, 0.9], twist: 0.6, elbow: 2.3 } });
  W.armSol.Right = { mid: sol, lo: sol, hi: sol, head };
}

// ------------------------------------------------------------------ the goniometer
function makeGonio(scene, H) {
  const g = new THREE.Group(); g.position.copy(H); g.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(Z, X, Y)); scene.add(g);   // local +x -> world +z (the leg at 0), local +y -> world +x, the fan faces up
  const mk = (c, o = 0) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: o, depthWrite: false, side: THREE.DoubleSide, fog: false });
  const OR = ORANGE.clone().multiplyScalar(1.5), BL = new THREE.Color(0x4a78ff).multiplyScalar(1.5);
  const fan = new THREE.Mesh(new THREE.RingGeometry(0.12, 0.8, 96, 8, 0, PHI0), new THREE.ShaderMaterial({ uniforms: { uC: { value: OR.clone() }, opacity: { value: 0 } },
    vertexShader: 'varying float vR; void main(){ vR = length(position.xy); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'uniform vec3 uC; uniform float opacity; varying float vR; void main(){ float k = smoothstep(0.12, 0.8, vR); gl_FragColor = vec4(uC, opacity * (0.12 + 0.88 * k * k)); }',
    transparent: true, depthWrite: false, side: THREE.DoubleSide })); fan.material.opacity = 0; g.add(fan);
  const arc = new THREE.Mesh(new THREE.RingGeometry(0.795, 0.808, 128, 1, 0, PHI0), mk(OR)); g.add(arc);
  const edge = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.004), mk(OR)); edge.position.set(Math.cos(PHI0) * 0.47, Math.sin(PHI0) * 0.47, 0.0005); edge.rotation.z = PHI0; g.add(edge);
  const sliver = new THREE.Mesh(new THREE.BufferGeometry(), mk(BL)); sliver.position.z = 0.0008; g.add(sliver);
  const ticks = []; for (let d = 0; d <= 90; d += 10) { const a = (d * Math.PI) / 180, m = new THREE.Mesh(new THREE.PlaneGeometry(d % 30 === 0 ? 0.045 : 0.026, 0.0035), mk(0xd9dce2)); m.position.set(Math.cos(a) * (0.83 + (d % 30 === 0 ? 0.0225 : 0.013)), Math.sin(a) * (0.83 + (d % 30 === 0 ? 0.0225 : 0.013)), 0); m.rotation.z = a; g.add(m); ticks.push(m); }
  const pts = [new THREE.Vector3(Math.cos(PHI1) * 0.12, Math.sin(PHI1) * 0.12, 0.001), new THREE.Vector3(Math.cos(PHI1) * 0.86, Math.sin(PHI1) * 0.86, 0.001)];
  const dash = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineDashedMaterial({ color: 0xe6e8ec, dashSize: 0.018, gapSize: 0.012, transparent: true, opacity: 0, fog: false })); dash.computeLineDistances(); g.add(dash);
  let key = -1;
  function setSliver(k) { const kk = Math.round(k * 200) / 200; if (kk === key) return; key = kk; sliver.geometry.dispose(); sliver.geometry = new THREE.RingGeometry(0.12, 0.8, 16, 1, PHI0, Math.max(0.0001, (PHI1 - PHI0) * kk)); }
  return { g, fan, arc, edge, sliver, ticks, dash, setSliver };
}

// ------------------------------------------------------------------ the nerve path, from the top thigh to the brain
function wp(group, p) { return p.clone().sub(W.rig.pivots.get(group)).applyMatrix4(group.matrixWorld); }
function nerveCurve() {
  const R = W.rig, G = R.legs.Right, s = R.seg, pts = [];
  pts.push(wp(G.hip, G.H.clone().lerp(G.K, 0.62).add(new THREE.Vector3(-0.05, 0, 0.0))));
  pts.push(wp(G.hip, G.H.clone().lerp(G.K, 0.3).add(new THREE.Vector3(-0.045, 0, -0.01))));
  pts.push(wp(R.pelvis, G.H.clone().add(new THREE.Vector3(0.0, 0.06, -0.08))));
  for (const n of ['Fifth lumbar vertebra', 'Third lumbar vertebra', 'First lumbar vertebra', 'Ninth thoracic vertebra', 'Fourth thoracic vertebra', 'Seventh cervical vertebra', 'Third cervical vertebra']) if (s[n]) pts.push(wp(s[n].g, s[n].pivot.clone().add(new THREE.Vector3(0, 0, -0.03))));
  const ax = s.Axis || s['Third cervical vertebra']; pts.push(wp(ax.g, ax.pivot.clone().add(new THREE.Vector3(0, 0.07, 0.0)))); pts.push(wp(ax.g, ax.pivot.clone().add(new THREE.Vector3(0, 0.13, 0.03))));
  return new THREE.CatmullRomCurve3(pts, false, 'centripetal');
}
// ------------------------------------------------------------------ the fascia lines: from the top thigh on through the whole body (each starts at the thigh)
function fasciaCurves() {
  const R = W.rig, G = R.legs.Right, s = R.seg, A = R.arms.Right, V = (x, y, z) => new THREE.Vector3(x, y, z);
  const sp = (n, d) => { const q = s[n] || s.Axis; return wp(q.g, q.pivot.clone().add(d)); };
  const th = (k, d) => wp(G.hip, G.H.clone().lerp(G.K, k).add(d)), sh = (k, d) => wp(G.knee, G.K.clone().lerp(G.A, k).add(d));
  const lat = [th(0.5, V(-0.075, 0, 0)), th(0.2, V(-0.08, 0, 0)), wp(R.pelvis, G.H.clone().add(V(-0.05, 0.13, 0.0))), sp('Third lumbar vertebra', V(-0.12, 0, 0.05)), sp('Tenth thoracic vertebra', V(-0.15, 0, 0.06)),
    sp('Sixth thoracic vertebra', V(-0.15, 0, 0.05)), wp(A.girdle, A.SH.clone().add(V(0.0, 0.03, 0))), sp('Fourth cervical vertebra', V(-0.05, 0, 0.0)), sp('Axis', V(-0.07, 0.07, 0.0))];
  const back = [th(0.5, V(0, 0, -0.07)), th(0.15, V(0, 0, -0.08)), wp(R.pelvis, R.P0.clone().add(V(0, -0.02, -0.11))), sp('Third lumbar vertebra', V(0, 0, -0.07)), sp('Tenth thoracic vertebra', V(0, 0, -0.08)),
    sp('Fourth thoracic vertebra', V(0, 0, -0.08)), sp('Seventh cervical vertebra', V(0, 0, -0.07)), sp('Axis', V(0, 0.05, -0.08)), sp('Axis', V(0, 0.14, -0.06))];
  const front = [th(0.5, V(-0.01, 0, 0.07)), th(0.15, V(0, 0, 0.08)), wp(R.pelvis, R.P0.clone().add(V(-0.03, -0.02, 0.12))), sp('Third lumbar vertebra', V(-0.03, 0, 0.13)), sp('Tenth thoracic vertebra', V(-0.03, 0, 0.16)),
    sp('Sixth thoracic vertebra', V(-0.02, 0, 0.17)), sp('First thoracic vertebra', V(-0.02, 0.03, 0.11)), sp('Fourth cervical vertebra', V(0, 0, 0.06)), sp('Axis', V(0, 0.02, 0.09))];
  const leg = [th(0.5, V(-0.07, 0, 0.01)), th(0.85, V(-0.06, 0, 0.0)), sh(0.1, V(-0.05, 0, 0.0)), sh(0.5, V(-0.045, 0, 0.0)), sh(0.92, V(-0.04, 0, 0.0))];
  const arm = [th(0.5, V(-0.075, 0, 0.0)), th(0.15, V(-0.08, 0, 0.0)), sp('Tenth thoracic vertebra', V(-0.14, 0, 0.09)), wp(A.girdle, A.SH.clone().add(V(-0.01, 0.0, 0.03))), wp(A.arm, A.SH.clone().lerp(A.EL, 0.5).add(V(-0.03, 0, 0))),
    wp(A.elbow, A.EL.clone().add(V(-0.025, 0, 0))), A.mc.getWorldPosition(new THREE.Vector3())];
  return [lat, back, front, leg, arm].map((p) => new THREE.CatmullRomCurve3(p, false, 'centripetal'));
}

// ------------------------------------------------------------------ the camera: one path, no cuts
let CAM = null;
function buildCam() {
  const TW = TOWER, C = new THREE.Vector3(RL / 2 + ROLLX, RR, W.RZ0), B = BOX;
  // framings found with tools/fit_view.py: each subject sits under the captions (below 0.36 of the frame), clear of the right-side buttons
  const WB = { p: V3(1.802, 1.6, 2.275), l: V3(0.028, 0.474, -0.26), fov: 34 };                            // the whole body, from the front, toward the feet
  const TH = { p: V3(1.125, 2.02, 0.312), l: V3(0.115, 0.554, 0.134), fov: 32 };                            // the top thigh from high in front: its band, the note
  const nudge = (k, d) => ({ ...k, p: k.p.map((v, i) => v + d[i]) });
  return camTrack([
    { t: -3.0, ...WB },
    { t: 3.2, ...nudge(WB, [-0.04, -0.03, -0.045]), tens: 0.4 },                                         // you lie on a foam tube and wince
    { t: 4.6, ...TH, tens: 0.2 },                                                                          // breaking up your fascia; the note; the muscles
    { t: 12.9, ...nudge(TH, [-0.02, -0.02, 0.0]), tens: 0.4 },
    { t: 14.1, ...WB, tens: 0.3 },                                                                         // it runs through the whole body
    { t: 15.9, ...nudge(WB, [-0.02, -0.02, -0.025]), tens: 0.4 },
    { t: 17.3, p: V3(TW.x + 0.48, 0.52, TW.z + 0.82), l: V3(TW.x, 0.05, TW.z), fov: 30, tens: 0.2 },       // the sample
    { t: 21.4, p: V3(TW.x + 0.47, 0.54, TW.z + 0.8), l: V3(TW.x, 0.07, TW.z), fov: 30, tens: 0.4 },
    { t: 25.0, p: V3(TW.x + 0.68, 1.62, TW.z + 1.79), l: V3(TW.x, 1.12, TW.z), fov: 34, tens: 0.3 },       // the tower grows
    { t: 26.6, p: V3(4.672, 1.463, 3.322), l: V3(-0.303, 0.932, -0.162), fov: 34, tens: 0.25 },            // the skeleton, dwarfed by it
    { t: 29.9, p: V3(4.57, 1.45, 3.25), l: V3(-0.303, 0.932, -0.162), fov: 34, tens: 0.3 },
    { t: 31.6, p: V3(0.248, 2.707, 3.182), l: V3(0.513, 0.575, 0.15), fov: 34, tens: 0.2 },                // the test, from high at the feet end
    { t: 43.4, p: V3(0.25, 2.69, 3.16), l: V3(0.513, 0.575, 0.15), fov: 34, tens: 0.3 },
    { t: 45.0, p: V3(0.72, 1.22, 1.16), l: V3(0.07, 0.36, 0.12), fov: 34, tens: 0.2 },                       // sore thighs on the roller
    { t: 47.0, p: V3(0.7, 1.2, 1.13), l: V3(0.07, 0.36, 0.11), fov: 34, tens: 0.4 },
    { t: 48.4, ...WB, tens: 0.2 },                                                                         // the nerves, thigh to brain
    { t: 52.4, ...nudge(WB, [-0.03, -0.02, -0.03]), tens: 0.3 },
    { t: 53.8, ...TH, fov: 36, tens: 0.2 },                                                                // using it: the band, day after day
    { t: 59.7, ...nudge(TH, [-0.02, -0.02, 0.0]), fov: 36, tens: 0.4 },
    { t: 61.3, p: V3(0.726, 1.011, 2.294), l: V3(0.726, 0.192, 0.044), fov: 32, tens: 0.2 },               // the boring stuff (the skeleton kept out from behind the words)
    { t: 65.4, p: V3(0.725, 1.0, 2.27), l: V3(0.726, 0.192, 0.044), fov: 32, tens: 0.4 },
    { t: 66.8, p: V3(-0.31, 1.618, 4.224), l: V3(0.449, 0.446, -0.083), fov: 34, tens: 0.3 },              // a warm-up; the repair kit rises
    { t: 70.2, p: V3(-0.3, 1.6, 4.17), l: V3(0.449, 0.446, -0.083), fov: 34, tens: 0.4 },
    { t: 71.8, p: V3(1.208, 1.751, 0.543), l: V3(0.931, 0.222, -0.491), fov: 32, tens: 0.2 },              // see a doctor
    { t: 75.2, p: V3(1.2, 1.73, 0.53), l: V3(0.931, 0.222, -0.491), fov: 32, tens: 0.4 },
    { t: 76.8, p: V3(C.x + 0.62, C.y + 0.06, C.z + 0.08), l: V3(C.x, C.y, C.z), fov: 30 },
    { t: T.logo, p: V3(C.x + 0.5, C.y, C.z + 0.0005), l: V3(C.x, C.y, C.z), fov: 30, stop: true },          // straight at the end cap: the logo
  ]);
}
function camPose(S, t) {
  const v = S.cfg.view; if (v && typeof v === 'object') return v;
  if (!CAM) CAM = buildCam();
  if (t <= T.logo) return CAM(t);
  const Q = CAM(T.logo), k = ss(T.logo, T.end, t); return { p: [lerp(Q.p[0], Q.p[0] + 0.035, k), Q.p[1], Q.p[2]], l: Q.l, fov: 30 };
}
function focusAt(S, t, P) { return Math.hypot(P.p[0] - P.l[0], P.p[1] - P.l[1], P.p[2] - P.l[2]); }

// ------------------------------------------------------------------ one moment of the film
const _m4 = new THREE.Matrix4(), _p3 = new THREE.Vector3(), _q2 = new THREE.Quaternion();
const drop = (t, t0, t1, h) => { if (t < t0) return h; if (t < t1) { const u = (t - t0) / (t1 - t0); return h * (1 - u * u); } const u = t - t1; return 0.03 * h * Math.exp(-u * 9) * Math.abs(Math.sin(u * 22)); };   // falls, lands, bounces
function update(S, t) {
  const scene = S.scene, endDark = ss(T.final + 0.2, T.logo - 0.3, t), dbg = (S.cfg.dbg || {});
  const o = poseBody(t);
  // ---- the roller: half the body's travel, turning as it goes
  const RO = W.roll, zr = W.RZ0 + o.u / 2; RO.g.position.set(ROLLX, MAT_H + RR, zr); RO.g.rotation.x = (o.u / 2) / RR; RO.g.updateMatrixWorld(true);
  // ---- soft parts: muscles and fascia; later the band strengthens, day after day
  const day = ss(DAYS[0] - 0.15, DAYS[0] + 0.25, t) + ss(DAYS[1] - 0.15, DAYS[1] + 0.25, t) + ss(DAYS[2] - 0.15, DAYS[2] + 0.25, t), grow = day / 3;
  const itbO = Math.max(ss(T.breaking - 0.2, T.fascia, t) * (1 - ss(16.0, 16.6, t)), pulse(t, T.lying - 0.3, 30.4, 0.5), pulse(t, T.after - 0.2, 60.6, 0.5));
  const musO = Math.max(ss(T.fascia3 - 0.1, T.real + 0.3, t) * (1 - ss(16.0, 16.6, t)), pulse(t, T.after - 0.2, 60.6, 0.5));
  const showSoft = itbO > 0.002 || musO > 0.002 || dbg.soft;
  for (const sk of W.skins) { sk.mesh.visible = showSoft; if (showSoft) sk.update(); }
  W.itbMat.uniforms.uO.value = dbg.soft ? 1 : itbO * (t > 30.5 && t < 52.8 ? 0.45 : 1) * (1 + 0.6 * grow);
  W.sheathMat.uniforms.uO.value = dbg.soft ? 1 : musO * (t > 30 ? 0.4 + 0.9 * grow : ss(T.collagen - 0.3, T.around + 0.3, t));
  W.musMat.opacity = (dbg.soft ? 1 : musO) * 0.82; W.musMat.depthWrite = W.musMat.opacity > 0.5;
  const sore = ss(T.after + 0.2, T.exercise2 + 0.4, t) * lerp(1, 0.8, s5(T.eases, T.little + 0.3, t)) * (1 - 0.45 * s5(T.turn, T.pain + 0.2, t)) * (1 - ss(52.0, 52.7, t));
  W.musMat.emissiveIntensity = sore * (1.05 + 0.15 * Math.sin(t * 5.2));
  // ---- the note: flies in and slaps on the band at "like a word"; it lets go later and flutters off
  { const N = W.note, a = (t - NOTE_T) / 0.16;
    if (t < NOTE_T - 0.16 || t > NOTE_OFF + 1.1) N.visible = false;
    else { N.visible = true;
      if (t < NOTE_T) { const u = clamp01(1 + a); N.position.copy(W.noteHome).addScaledVector(W.noteN, 0.3 * (1 - u) * (1 - u)); N.quaternion.copy(W.noteQ); N.material.opacity = u; N.scale.setScalar(1); }
      else if (t < NOTE_OFF) { const b = Math.exp(-(t - NOTE_T) * 22) * Math.sin((t - NOTE_T) * 60) * 0.06; N.position.copy(W.noteHome); N.quaternion.copy(W.noteQ); N.scale.set(1 + b, 1 - b, 1); N.material.opacity = 1; }
      else { const u = clamp01((t - NOTE_OFF) / 1.1); N.position.copy(W.noteHome).addScaledVector(W.noteN, 0.06 * u + 0.25 * u * u); N.position.x += 0.05 * Math.sin(u * 7) * u;
        N.quaternion.copy(W.noteQ).multiply(_q2.setFromAxisAngle(new THREE.Vector3(1, 0.4, 0.2).normalize(), u * 2.6)); N.material.opacity = 1 - u * u; N.scale.setScalar(1); } } }
  // ---- the fascia lines: they run from the thigh out through the whole body
  { const on = pulse(t, T.and2 - 0.1, 16.3, 0.4), r = s5(T.runs - 0.25, T.body + 0.35, t);
    W.lines.forEach((m) => { m.visible = on > 0.002; });
    if (on > 0.002) { fasciaCurves().forEach((c, i) => { const m = W.lines[i]; m.geometry.dispose(); m.geometry = new THREE.TubeGeometry(c, 160, 0.0042, 6, false); }); }
    W.lineMat.uniforms.uO.value = on; W.lineMat.uniforms.uR.value = r * 1.08; W.lineMat.uniforms.uT.value = (t - T.runs) * 0.7; }
  // ---- the nerve
  { const on = pulse(t, T.and4 - 0.3, 52.3, 0.45), down = s5(T.turn - 0.05, T.pain + 0.15, t);
    W.nerve.visible = on > 0.002;
    if (W.nerve.visible) { const c = nerveCurve(); W.nerve.geometry.dispose(); W.nerve.geometry = new THREE.TubeGeometry(c, 200, 0.0042, 8, false); }
    W.nerveMat.uniforms.uO.value = on * lerp(1, 0.45, down); W.nerveMat.uniforms.uG.value = lerp(1, 0.25, down);
    W.nerveMat.uniforms.uP.value = (t - T.and4) * 0.75 - Math.max(0, t - T.turn) * 0.45 * down; }
  // ---- the tower: its base rises out of the floor; then plates land one after another
  { const Tw = W.tower; let top = Tw.y0; const rise = s5(15.9, 16.9, t), gone = s5(30.0, 31.5, t); Tw.g.visible = rise > 0.001 && gone < 0.999; Tw.g.position.y = -0.09 * (1 - rise) - 1.55 * gone;
    for (let i = 0; i < NPLATES; i++) { const tl = Tw.land[i], ye = Tw.y0 + PLATE_T / 2 + i * PLATE_T;
      let y = ye, vis = t > tl - 0.2; if (t < tl) { const d = tl - t; y = ye + 4.9 * d * d; } else y = ye + 0.004 * Math.exp(-(t - tl) * 22) * Math.abs(Math.sin((t - tl) * 60));
      _m4.compose(_p3.set(0, vis ? y : -5, 0), _q1.setFromAxisAngle(Y, hash(i * 3.3) * 6.28), new THREE.Vector3(1, 1, 1)); Tw.plates.setMatrixAt(i, _m4);
      _m4.compose(_p3.set(0, vis ? y + PLATE_T * 0.3 + 0.0004 : -5, 0), _q1, new THREE.Vector3(1, 1, 1)); Tw.rings.setMatrixAt(i, _m4);
      if (t >= tl) top = ye + PLATE_T / 2; }
    Tw.plates.instanceMatrix.needsUpdate = true; Tw.rings.instanceMatrix.needsUpdate = true;
    const d5 = W.tower.land5 - t; Tw.five.visible = d5 < 0.2; Tw.five.position.y = Tw.y0 + NPLATES * PLATE_T + 0.011 + (d5 > 0 ? 4.9 * d5 * d5 : 0.003 * Math.exp(-(t - W.tower.land5) * 22) * Math.abs(Math.sin((t - W.tower.land5) * 60)));
    const sq = 1 - 0.01 * ss(Tw.land[0], W.tower.land5, t); Tw.sample.scale.y = sq; Tw.sample.position.y = 0.014 + 0.013 * sq; Tw.platen.position.y = 0.014 + 0.026 * sq + 0.007;
    W.towerTop = top; }
  // ---- the goniometer: the factory range in orange, 4% more in blue, gone in 30 minutes
  { const Gn = W.gon, on = pulse(t, T.rolling, 43.6, 0.5), L = o.L;
    Gn.fan.material.uniforms.opacity.value = 0.3 * on; Gn.arc.material.opacity = 0.9 * on; Gn.edge.material.opacity = 0.8 * on; Gn.ticks.forEach((m) => (m.material.opacity = 0.6 * on));
    const k = clamp01((L.phi - PHI0) / (PHI1 - PHI0)) * ss(T.before, T.about2, t); Gn.setSliver(k); Gn.sliver.material.opacity = 0.55 * on * (k > 0.01 ? 1 : 0);
    Gn.dash.material.opacity = 0.85 * pulse(t, T.no - 0.1, T.and3 + 0.2, 0.3); }
  // ---- the boring stuff: the dog rolls in on "walking", the dumbbell drops on "lifting", the calendar pops up on "moving" and is ticked every day
  { const out = s5(65.6, 66.3, t), sink = -0.3 * out;
    const D = W.dog, rk = s5(T.walking - 0.5, T.walking + 0.25, t); D.g.visible = rk > 0.001 && out < 0.999;
    D.g.position.set(lerp(OBJ.dog.x + 0.8, OBJ.dog.x, rk), sink, OBJ.dog.z); D.g.rotation.y = -Math.PI / 2;   // rolls in from the right, in profile
    D.wheels.forEach((w) => { w.rotation.x = -(D.g.position.x - OBJ.dog.x) / 0.035; });
    const wag = pulse(t, T.walking + 0.1, 65.5, 0.2); D.tail.rotation.z = Math.sin(t * 16) * 0.45 * (0.3 + 0.7 * wag); D.ears.forEach((e, i) => { e.rotation.x = 0.2 * Math.sin(t * 9 + i) * wag; });
    { const ring = D.g.localToWorld(D.ring.clone()), end = new THREE.Vector3(OBJ.dog.x - 0.26, sink + 0.008, OBJ.dog.z - 0.1), mid = ring.clone().lerp(end, 0.5); mid.y = Math.max(sink + 0.008, mid.y - 0.12);
      const pts = []; for (let i = 0; i <= 20; i++) { const u = i / 20; pts.push(new THREE.Vector3().copy(ring).multiplyScalar((1 - u) * (1 - u)).addScaledVector(mid, 2 * u * (1 - u)).addScaledVector(end, u * u)); }
      W.leash.visible = D.g.visible && rk > 0.98; if (W.leash.visible) { W.leash.geometry.dispose(); W.leash.geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.004, 8); } }
    const Db = W.db; Db.visible = t > T.lifting - 0.35 && out < 0.999; Db.position.set(OBJ.db.x, 0.052 + drop(t, T.lifting - 0.35, T.lifting, 0.6) + sink, OBJ.db.z); Db.rotation.set(0, 0.5, 0);
    const Ca = W.cal, pk = clamp01((t - (T.moving - 0.1)) / 0.4); Ca.g.visible = pk > 0 && out < 0.999; Ca.g.position.set(OBJ.cal.x, sink, OBJ.cal.z); Ca.g.rotation.y = 0.12; Ca.g.scale.setScalar(Math.max(0.001, outBack(pk, 1.6)));
    const n = TICKS.filter((x) => t >= x).length; if (n !== Ca.n) { Ca.n = n; Ca.face.material.map = Ca.texs[n]; Ca.face.material.needsUpdate = true; } }
  // ---- the repair kit: up out of the floor on "not as a repair kit"; its lid opens on "see a doctor"; it sinks before the end
  { const Bx = W.box, up = s5(T.not - 0.3, T.not + 0.45, t), down = s5(75.3, 76.0, t); Bx.g.visible = up > 0.001 && down < 0.999;
    Bx.g.position.y = -0.25 * (1 - up) - 0.25 * down; Bx.hinge.rotation.x = -1.95 * s5(T.see - 0.25, T.see + 0.4, t) + 0.12 * Math.exp(-Math.max(0, t - T.see - 0.4) * 6) * Math.sin(Math.max(0, t - T.see - 0.4) * 20); }
  // ---- the end: the cap's label fades; the logo
  { const lk = s5(T.final + 0.4, T.logo - 0.25, t); W.roll.label.material.opacity = 1 - lk;
    W.logo.set({ weight: lk, white: lk, hours: 0, hand: ss(T.logo - 0.4, T.logo - 0.15, t), handScale: outBack(clamp01((t - (T.logo - 0.4)) / 0.35), 1.8) }); }
  // ---- light
  const fig = 1 - endDark;
  W.key.intensity = 15 * fig; W.rim.intensity = 3.0 * fig; W.fill.intensity = 1.1 * fig;
  W.towerLight.intensity = 7 * ss(T.but - 0.8, T.but, t) * (1 - ss(T.so2, T.rolling, t)) * fig + 2.0 * ss(T.so2, T.rolling, t) * fig;
  W.objLight.intensity = 4 * pulse(t, T.walking - 0.8, 66.2, 0.5) * fig;
  W.boxLight.intensity = 5 * pulse(t, T.not - 0.6, 76.0, 0.5) * fig;
  W.rollLight.intensity = 2.6 * (1 - ss(1.0, 2.2, t)) * fig;
  W.capLight.intensity = 2.2 * ss(T.final - 0.6, T.final, t) * (1 - 0.6 * endDark);
  S.tableMat.color.setScalar(0.35 * (1 - endDark * 0.9)); scene.environmentIntensity = 0.12 * (1 - endDark); S.reflAmt = 0.6 * (1 - endDark);
}

// ------------------------------------------------------------------ the words on screen
const CAPS = [
  { t0: T.you, t1: 3.0, top: 292, size: 84, html: 'You lie on a <em>foam tube</em>,<br>wince for <em>ten minutes</em>,' },
  { t0: T.and, t1: 5.95, top: 292, size: 84, html: 'and believe you’re<br><em>breaking up</em> your fascia.' },
  { t0: T.your, t1: 8.6, top: 300, size: 92, html: 'Your fascia would<br><em>like a word</em>.' },
  { t0: T.fascia3, t1: 13.3, top: 292, size: 77, html: 'Fascia is real: it’s the<br>tough wrapping of <em>collagen</em><br>around every muscle,' },
  { t0: T.and2, t1: 16.2, top: 292, size: 86, html: 'and it runs through<br>your <em>whole body</em>.' },
  { t0: T.but, t1: 20.15, top: 292, size: 82, html: 'But to squash the tough<br>fascia in your thigh<br>by just <em>1%</em>,' },
  { t0: T.one2, t1: 25.3, top: 292, size: 86, html: 'one model says you’d<br>need about <em>925 kilos</em>.' },
  { t0: T.lying, t1: 30.1, top: 292, size: 77, html: 'Lying on a roller<br><em>doesn’t come close</em>,<br>so nothing is breaking up.' },
  { t0: T.so2, t1: 32.6, top: 300, size: 92, html: 'So what does rolling<br><em>actually</em> do?' },
  { t0: T.before, t1: 36.9, top: 292, size: 82, html: 'Before exercise, it gives<br>you about <em>4% more</em><br><em>flexibility</em>,' },
  { t0: T.no, t1: 38.85, top: 300, size: 92, html: 'no more than<br><em>stretching</em> does,' },
  { t0: T.and3, t1: 43.9, top: 292, size: 78, html: 'and in one trial,<br>the extra range was gone<br>within <em>30 minutes</em>.' },
  { t0: T.after, t1: 47.15, top: 292, size: 86, html: 'After exercise,<br>it eases soreness<br><em>a little</em>,' },
  { t0: T.and4, t1: 52.6, top: 280, size: 86, html: 'and the best guess<br>is that your nerves<br><em>turn down</em> pain and<br>tension for a while.' },
  { t0: T.your2, t1: 55.6, top: 292, size: 86, html: 'Your body keeps its<br>collagen strong<br>by <em>using it</em>:' },
  { t0: T.after2, t1: 60.1, top: 292, size: 82, html: 'after a workout, it keeps<br>building new collagen<br>for <em>days</em>.' },
  { t0: T.so3, t1: 62.3, top: 300, size: 92, html: 'So give your fascia<br>the <em>boring stuff</em>:' },
  { t0: T.walking, t1: 65.6, top: 300, size: 92, html: '<em>walking</em>, <em>lifting</em><br>and <em>moving</em> every day.' },
  { t0: T.use, t1: 70.3, top: 292, size: 84, html: 'Use the roller as a<br><em>warm-up</em> if you like it,<br>not as a repair kit.' },
  { t0: T.and5, t1: 72.6, top: 292, size: 88, html: 'And if muscle pain<br>won’t settle with rest,' },
  { t0: T.see, t1: 75.4, top: 300, size: 92, html: 'see a <em>doctor</em>,<br>not a foam roller.' },
  { t0: T.final, t1: 99, top: 360, size: 92, html: 'Let’s get you back to<br><em>factory settings.</em>' },
];
const OVL = {};
function overlayInit(S) {
  const O = S.O, tag = (cls, txt2, size, bsize) => { const e = O.tag(cls, txt2); e.style.fontSize = size + 'px'; const b = e.querySelector('b'); if (b && bsize) b.style.fontSize = bsize + 'px'; return e; };
  OVL.itb = tag('tag', 'Fascia<b>iliotibial band</b>', 22, 36);
  OVL.load = tag('tag', 'Load<b>0 kg</b>', 24, 56); OVL.loadB = OVL.load.querySelector('b');
  OVL.sq = tag('tag', 'Squashed<b>1%</b>', 22, 44);
  OVL.range = tag('tag', 'Its own<b>range</b>', 22, 40);
  OVL.more = tag('tag', 'After rolling<b>+4%</b>', 22, 44);
  OVL.str = tag('tag', 'Stretching<b>the same</b>', 22, 36);
  OVL.min = tag('tag', 'Later<b>0 min</b>', 22, 44); OVL.minB = OVL.min.querySelector('b');
  OVL.sore = tag('tag', 'Soreness<b>a little less</b>', 22, 36);
  OVL.nerve = tag('tag', 'Pain and tension<b>turned down</b>', 22, 36);
  OVL.day = tag('tag', 'New collagen<b>day 1</b>', 22, 40); OVL.dayB = OVL.day.querySelector('b');
}
function overlay(S, t) {
  const R = W.rig, G = R.legs.Right;
  place(S, OVL.itb, wp(G.hip, G.H.clone().lerp(G.K, 0.5).add(new THREE.Vector3(-0.06, 0, 0))), 50, -60, pulse(t, T.breaking, NOTE_T - 0.2));
  const n = Math.min(NPLATES, W.tower.land.filter((x) => x <= t).length), kg = n * 20 + (t >= W.tower.land5 ? 5 : 0); OVL.loadB.textContent = kg + ' kg';
  const ly = Math.min(0.95, Math.max(0.12, (W.towerTop || 0) - 0.02)); place(S, OVL.load, new THREE.Vector3(TOWER.x + 0.24, ly, TOWER.z), 40, -40, pulse(t, T.need - 0.3, T.lying + 0.4));
  place(S, OVL.sq, new THREE.Vector3(TOWER.x + 0.24, ly, TOWER.z), 40, 70, pulse(t, T.kilos + 0.1, T.lying + 0.6));
  const H = W.HR0;
  place(S, OVL.range, H.clone().add(new THREE.Vector3(Math.sin(PHI0) * 0.82, 0, Math.cos(PHI0) * 0.82)), 30, -30, pulse(t, T.rolling + 0.4, T.about2));
  place(S, OVL.more, H.clone().add(new THREE.Vector3(Math.sin(PHI1) * 0.82, 0, Math.cos(PHI1) * 0.82)), 30, -30, pulse(t, T.about2 + 0.2, T.no));
  place(S, OVL.str, H.clone().add(new THREE.Vector3(Math.sin(PHI1) * 0.6, 0, Math.cos(PHI1) * 0.6)), 40, -10, pulse(t, T.no, T.and3));
  OVL.minB.textContent = Math.round(30 * s5(T.trial, T.minutes2 + 0.3, t)) + ' min';
  place(S, OVL.min, H.clone().add(new THREE.Vector3(0.1, 0, 0.75)), 20, -20, pulse(t, T.trial - 0.1, 43.6));
  place(S, OVL.sore, wp(R.legs.Left.hip, R.legs.Left.H.clone().lerp(R.legs.Left.K, 0.5)), 60, -120, pulse(t, T.eases - 0.2, T.and4));
  const ax = R.seg.Axis || R.seg['Third cervical vertebra'];
  place(S, OVL.nerve, wp(ax.g, ax.pivot.clone().add(new THREE.Vector3(0, 0.13, 0.03))), 40, -60, pulse(t, T.turn, 52.4));
  OVL.dayB.textContent = 'day ' + Math.max(1, DAYS.filter((x) => t >= x).length);
  place(S, OVL.day, wp(G.hip, G.H.clone().lerp(G.K, 0.5).add(new THREE.Vector3(-0.06, 0, 0))), 50, -70, pulse(t, DAYS[0] - 0.15, 60.3));
  const c = new THREE.Vector3(), e = new THREE.Vector3(); W.roll.cap.getWorldPosition(c); e.copy(c).add(new THREE.Vector3(0, 0.052, 0));
  logoEnd(S, t, { t0: T.logo, center: c, edge: e });
}

makeFilm({
  T, caps: CAPS, subs: [], build, update, pose: camPose, overlay, overlayInit, focus: focusAt,
  stage: { bg: 0x07080a, reflSize: 6, env: 0.12, far: 30 },
  aperture: [[0, 0.003], [4.5, 0.003], [14.1, 0.002], [17.3, 0.002], [25, 0.0015], [31.6, 0.0015], [45, 0.003], [48.4, 0.002], [53.8, 0.003], [61.3, 0.002], [66.8, 0.002], [71.8, 0.003], [76.8, 0.003]],
  bloom: [[0, 0.45], [76, 0.55]],
  fast: [[0.1, 1.6, 2], [3.0, 4.6, 2], [12.8, 14.2, 2], [15.8, 17.4, 2], [21.4, 26.6, 2], [29.8, 31.7, 2], [43.3, 45.1, 2], [46.9, 48.5, 2], [52.3, 53.9, 2], [59.6, 61.4, 2], [65.3, 66.9, 2], [70.1, 71.9, 2], [75.1, 76.9, 2]],
});

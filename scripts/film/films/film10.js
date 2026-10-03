// Human Factory Settings · Film 10 "Does foam rolling work?" · one continuous shot, 9:16.
// A skeleton lies on its side on a foam roller, rolling the outside of its thigh; it winces. The fascia appears: a band
// of white collagen down the outside of the thigh, and a thin sleeve round every muscle. To squash the thick kind by 1%,
// one model says 925 kg: forty-six 20 kg plates and one 5 kg plate land on a sample, one after another, and the tower
// dwarfs the skeleton on its roller. Before exercise: the top leg swings out to its range (the orange fan: its own
// factory range) and, after rolling, 4% further (a blue sliver), the same as stretching; thirty minutes later the sliver
// is gone. After exercise: sore muscles glow, a little less. Signals from the thigh to the brain turn down. The roller's
// end reads MYOFASCIAL RELEASE: the word RELEASE peels off and falls on the mat (the gag). Lactic acid: two hourglasses,
// rest and massage; the massage one drains slower. A warm-up, not a repair kit. See a doctor. The end cap is the logo.
import { THREE, ORANGE, COLD, ss, s5, lerp, clamp01, hash, camTrack, phys, glowMat, shadows, spot, RoundedBoxGeometry,
  loadAnatomy, tissueMat, V3, place, logoEnd, makeFilm, outBack, stamp, stampCanvas, stampSpot, noiseTex, TIME } from '../kit.js';
import { buildRig, skeletonKind, legIK, bendSpine, poseArm, worldVerts } from '../rig.js';
import { makeLogoRing } from '../props.js';
import { skinned } from '../soft.js';

// ------------------------------------------------------------------ timing, from the voice guide (word starts)
const T = {
  end: 72.7,
  foam: 0.35, rolling: 1.06, lie: 1.89, tube: 2.89, wince: 2.94, believe: 3.71, breaking: 4.29, fascia: 5.49,            // "Foam rolling. Lie on a tube, wince, and believe you're breaking up your fascia."
  fascia2: 7.13, real: 8.14, tough: 8.47, collagen: 8.99, wrapped: 9.66, every: 10.55, muscle: 10.84,                     // "Fascia is real: tough collagen wrapped around every muscle."
  squash: 12.79, thick: 13.33, percent: 14.69, one: 15.12, model: 15.82, says: 16.33, need: 16.99, about: 17.37, nine: 17.63, kilos: 19.78,
  lying: 21.01, roller: 22.08, close: 22.90,                                                                                // "Lying on a roller doesn't come close."
  so: 24.27, rolling2: 25.30, before: 26.40, exercise: 27.15, about2: 27.79, four: 28.15, more: 28.97, flex: 29.21,
  no: 31.28, stretching: 32.23, and: 33.32, trial: 34.27, extra: 34.88, gone: 35.86, thirty: 36.73, minutes: 37.21,
  after: 38.57, exercise2: 39.37, eases: 40.09, soreness: 40.62, little: 41.38,
  likely: 42.47, nerves: 44.32, turn: 45.02, down: 45.22, pain: 45.61, tension: 46.20, while: 47.01,
  the: 47.93, release: 48.25, mostly: 49.09, name: 49.79,
  flushing: 50.99, lactic: 52.05, acid: 52.40, inlab: 53.31, lab: 54.06, massage: 55.13, slowed: 56.43, clearing: 57.15,
  use: 58.47, warmup: 59.73, repair: 60.58, kit: 61.01,
  musclepain: 62.33, settle: 63.94, rest: 64.42, see: 65.29, doctor: 66.01, foam2: 66.69,
  back: 68.54, factory: 69.40, settings: 69.70, logo: 70.40,
};

// ------------------------------------------------------------------ the set (metres): the skeleton lies on its left side along z,
// head toward -z, its front toward +x; the roller runs across the mat (axis along x) under its left thigh
const W = {}; window.HFS_W = W;
const MAT_H = 0.006, MAT_Z = -0.06;
const RR = 0.075, RL = 0.45, ROLLX = 0.03;                              // the roller: 15 cm across, 45 cm long
const ALPHA = 0.26;                                                    // the trunk rises toward the head (propped on the left forearm)
const TOWER = new THREE.Vector3(-0.7, 0, 0.16);                         // the sample under 925 kg, behind the skeleton
const PLINTH = { x: 0.74, z: -0.98, w: 0.46, d: 0.3, top: 0.36 };       // the two hourglasses
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
const ROLLS = [[0.45, 23.75, 0.07], [38.75, 47.45, 0.06], [50.2, 61.95, 0.065]];   // [start, stop, amplitude in metres]
const RATE = (t) => (t > 58.2 && t < 62 ? 0.62 : 0.42);                                // strokes a second (brisker for the warm-up)
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
// the foam roller: dense black foam with a grid of small nubs; its end cap reads MYOFASCIAL / RELEASE
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
  // the sticker: one word on a strip of white vinyl, its own mesh so it can peel (a grid that curls from its right edge)
  const SW = 0.104, SH = 0.03, NX = 40;
  const stTex = canvasTex(1024, 296, (x, w, h) => { x.fillStyle = '#eef0f2'; x.beginPath(); x.roundRect(4, 4, w - 8, h - 8, 26); x.fill();
    txt(x, 'RELEASE', w / 2, h / 2 + 6, { font: '800 190px Archivo', color: '#17191c', track: 14 }); });
  const sg = new THREE.PlaneGeometry(SW, SH, NX, 2);
  const sticker = new THREE.Mesh(sg, new THREE.MeshPhysicalMaterial({ map: stTex, roughness: 0.42, clearcoat: 0.5, side: THREE.FrontSide }));
  sticker.add(new THREE.Mesh(sg, new THREE.MeshPhysicalMaterial({ color: 0xd9d6cf, roughness: 0.75, side: THREE.BackSide })));
  sticker.matrixAutoUpdate = false; sticker.castShadow = true; scene.add(sticker);
  const rest = Float32Array.from(sg.attributes.position.array);
  shadows(body); body.receiveShadow = true; g.traverse((o) => o.layers.enable(1)); sticker.layers.enable(1);
  return { g, body, cap, label, labTex, sticker, rest, SW, SH, stOff: new THREE.Vector3(0, -0.017, 0.0012) };
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
  const land = []; for (let i = 0; i < NPLATES; i++) land.push(15.55 + 4.0 * Math.pow(i / (NPLATES - 1), 0.92));
  return { g, sample, platen, plates, rings, five, land, land5: 19.83, y0: 0.014 + 0.026 + 0.014 };
}
// two hourglasses on a plinth: rest and massage
function hourglassProfile() {   // the glass: two bulbs and a neck, 0.2 m tall (radius by height)
  const pts = []; const H = 0.176, y0 = 0.012;
  for (let i = 0; i <= 64; i++) { const u = i / 64, y = y0 + u * H, s = Math.abs(u - 0.5) * 2;   // s: 0 at the neck, 1 at the ends
    const r = 0.0042 + 0.041 * Math.pow(Math.sin(Math.PI * Math.min(1, s * 0.98)), 0.75) * (s > 0.5 ? 1 : 1) - (s > 0.97 ? (s - 0.97) * 0.3 : 0);
    pts.push(new THREE.Vector2(Math.max(0.004, r), y)); }
  return pts;
}
function makeHourglasses(scene) {
  const g = new THREE.Group(); g.position.set(PLINTH.x, 0, PLINTH.z); scene.add(g);
  const box = new THREE.Mesh(new RoundedBoxGeometry(PLINTH.w, PLINTH.top, PLINTH.d, 5, 0.012), black()); box.position.y = PLINTH.top / 2; g.add(box);
  const plate = canvasTex(1024, 96, (x, w, h) => { x.fillStyle = '#0d0e10'; x.fillRect(0, 0, w, h); txt(x, 'CLEARING LACTIC ACID', w / 2, h / 2 + 2, { font: '500 44px "Geist Mono"', color: '#8d9097', track: 12 }); });
  const pm = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.028), new THREE.MeshBasicMaterial({ map: plate })); pm.position.set(0, PLINTH.top - 0.04, PLINTH.d / 2 + 0.0006); g.add(pm);
  const prof = hourglassProfile();
  const glassM = new THREE.ShaderMaterial({
    uniforms: { uC: { value: new THREE.Color(0xdfe8ff) }, uA: { value: 0.035 }, uR: { value: 0.45 }, uP: { value: 2.6 }, uO: { value: 1 } },
    vertexShader: 'varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }',
    fragmentShader: 'uniform vec3 uC; uniform float uA, uR, uP, uO; varying vec3 vN; varying vec3 vV; void main(){ float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), uP); gl_FragColor = vec4(uC * (0.7 + 0.8 * f), (uA + uR * f) * uO); }',
    transparent: true, depthWrite: false, side: THREE.DoubleSide });
  const wood = phys({ color: 0x1b1612, roughness: 0.5, clearcoat: 0.4 });
  const sandMat = phys({ color: 0xe9d9a6, roughness: 0.9, sheen: 0.3, sheenColor: new THREE.Color(0xfff2c8) });
  const glasses = [];
  for (const [i, name] of [[0, 'REST'], [1, 'MASSAGE']]) {
    const hg = new THREE.Group(); hg.position.set(i ? 0.11 : -0.11, PLINTH.top, 0.0); g.add(hg);
    const flip = new THREE.Group(); flip.position.y = 0.1; hg.add(flip);                // turns about its middle
    const inner = new THREE.Group(); inner.position.y = -0.1; flip.add(inner);
    const glass = new THREE.Mesh(new THREE.LatheGeometry(prof, 64), glassM); glass.renderOrder = 6; inner.add(glass);
    for (const y of [0.006, 0.194]) { const d = new THREE.Mesh(new THREE.CylinderGeometry(0.056, 0.056, 0.012, 64), wood); d.position.y = y; inner.add(d); }
    for (let k = 0; k < 3; k++) { const a = (k / 3) * Math.PI * 2 + 0.4, p = new THREE.Mesh(new THREE.CylinderGeometry(0.0035, 0.0035, 0.176, 12), wood); p.position.set(Math.cos(a) * 0.049, 0.1, Math.sin(a) * 0.049); inner.add(p); }
    const top = new THREE.Mesh(new THREE.BufferGeometry(), sandMat), bot = new THREE.Mesh(new THREE.BufferGeometry(), sandMat), stream = new THREE.Mesh(new THREE.CylinderGeometry(0.0011, 0.0011, 1, 8), sandMat);
    inner.add(top); inner.add(bot); inner.add(stream);
    const tag = canvasTex(512, 96, (x, w, h) => { x.fillStyle = '#0d0e10'; x.fillRect(0, 0, w, h); txt(x, name, w / 2, h / 2 + 2, { font: '600 52px "Geist Mono"', color: '#d5d8dd', track: 12 }); });
    const tm = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.019), new THREE.MeshBasicMaterial({ map: tag })); tm.position.set(i ? 0.11 : -0.11, PLINTH.top - 0.015, PLINTH.d / 2 + 0.0007); g.add(tm);
    shadows(inner); glass.castShadow = false;
    glasses.push({ hg, flip, inner, top, bot, stream, k: -1 });
  }
  g.traverse((o) => o.layers.enable(1));
  return { g, glasses, prof };
}
// sand in an hourglass: the heap in the upper bulb (sitting on the neck), the heap in the lower bulb, the stream between
const SAND = (() => {   // the volume inside the glass below each height, to turn an amount of sand into a level
  const prof = hourglassProfile(), N = 400, y0 = 0.014, y1 = 0.186, vol = [0];
  const rAt = (y) => { for (let i = 0; i < prof.length - 1; i++) if (y <= prof[i + 1].y) return lerp(prof[i].x, prof[i + 1].x, (y - prof[i].y) / (prof[i + 1].y - prof[i].y)); return prof[prof.length - 1].x; };
  for (let i = 1; i <= N; i++) { const y = y0 + ((y1 - y0) * i) / N, r = Math.max(0, rAt(y) - 0.0016); vol.push(vol[i - 1] + Math.PI * r * r * ((y1 - y0) / N)); }
  const V = (y) => { const f = clamp01((y - y0) / (y1 - y0)) * N, i = Math.min(N - 1, Math.floor(f)); return lerp(vol[i], vol[i + 1], f - i); };
  return { rAt, y0, y1, N, vol, V, cap: V(0.1) * 0.62 };   // the sand fills 62% of one bulb
})();
function levelAt(v) { const { vol, N, y0, y1 } = SAND; let i = 0; while (i < N && vol[i + 1] < v) i++; return y0 + ((y1 - y0) * (i + clamp01((v - vol[i]) / Math.max(1e-12, vol[i + 1] - vol[i])))) / N; }
function sandGeo(yA, yB, dip) {   // a solid of revolution filling the glass from yA up to yB, its top dished by `dip` (negative: a mound)
  const pts = [new THREE.Vector2(0.0001, yA)], n = 28;
  for (let i = 0; i <= n; i++) { const y = lerp(yA, yB, i / n); pts.push(new THREE.Vector2(Math.max(0.0005, SAND.rAt(y) - 0.0016), y)); }
  pts.push(new THREE.Vector2(0.0001, yB - dip));
  const g = new THREE.LatheGeometry(pts, 40); g.computeVertexNormals(); return g;
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
  W.roll = makeRoller(scene); W.tower = makeTower(scene); W.hg = makeHourglasses(scene);
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
  W.plinthLight = spot(scene, { color: 0xffe9d2, pos: new THREE.Vector3(1.4, 1.6, -0.4), target: new THREE.Vector3(PLINTH.x, PLINTH.top + 0.1, PLINTH.z), angle: 0.32, penumbra: 0.8 });
  W.rollLight = spot(scene, { color: 0xfff1e0, pos: new THREE.Vector3(0.95, 0.32, -0.32), target: new THREE.Vector3(ROLLX, RR * 0.8, W.RZ0), angle: 0.26, penumbra: 0.9 });
  W.capLight = spot(scene, { color: 0xfff1e0, pos: new THREE.Vector3(1.1, 0.45, 0.55), target: new THREE.Vector3(RL / 2 + ROLLX, RR, W.RZ0), angle: 0.25, penumbra: 0.9 });
  return { stamp: W.stampSpot, PY: W.PY, RZ0: W.RZ0, HR0: W.HR0.toArray(), arms: W.armSol && Object.fromEntries(Object.entries(W.armSol).map(([k, v]) => [k, v.err])) };
}

// ------------------------------------------------------------------ the body over time
const _qp = new THREE.Quaternion(), _v = new THREE.Vector3(), _q1 = new THREE.Quaternion();
function hipW(Side) { const R = W.rig, G = R.legs[Side]; R.pelvis.updateMatrixWorld(true); R.pelvis.getWorldQuaternion(_qp); return G.H.clone().sub(R.P0).applyQuaternion(_qp).add(R.pelvis.getWorldPosition(new THREE.Vector3())); }
const U_A = 0.075;
function placeBody(u) { W.body.position.set(0, W.PY, u); W.body.quaternion.copy(W.Q); W.body.updateMatrixWorld(true); }
function legAt(t) {   // the top leg: 0 planted, 1 lifted straight at angle phi (the test)
  const up = s5(T.so - 0.05, T.rolling2 + 0.15, t) * (1 - s5(37.6, 38.55, t));
  let phi = lerp(0.62, PHI0, s5(T.rolling2 - 0.2, T.before + 0.1, t));
  phi = lerp(phi, PHI1, s5(T.about2 - 0.1, T.more + 0.2, t));
  phi = lerp(phi, PHI0, s5(T.trial, T.minutes + 0.3, t));
  return { up, phi };
}
function poseBody(t, { solve = false } = {}) {
  const R = W.rig, u = W.cfg && W.cfg.dbg && W.cfg.dbg.u !== undefined ? W.cfg.dbg.u : rollU(t);
  const wince = Math.exp(-Math.pow((t - T.wince - 0.12) / 0.22, 2)), tap = pulse(t, T.wince - 0.14, T.wince + 1.2, 0.3);
  placeBody(u);
  bendSpine(R.seg, { lum: 0.02, tho: 0.05, cer: 0.12 + 0.22 * wince, side: -0.1 - 0.12 * wince, twist: 0.03 });
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
  const GR = R.legs.Right, onHip = wp(R.pelvis, GR.H.clone().add(new THREE.Vector3(-0.05, 0.1, 0.05)));
  const sol = solveArmW(R.arms.Right, { hand: onHip, init: { dir: [0.15, -1, 0.12], twist: 0.3, elbow: 0.5 } });
  const at = R.seg.Atlas, onHead = wp(at.g, at.pivot.clone().add(new THREE.Vector3(-0.02, 0.06, 0.15)));   // a hand over the eyes
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

// ------------------------------------------------------------------ the camera: one path, no cuts
let CAM = null;
function buildCam() {
  const TW = TOWER, C = new THREE.Vector3(RL / 2 + ROLLX, RR, W.RZ0), H = W.HR0, P = PLINTH;
  return camTrack([
    { t: -3.0, p: V3(0.8, 0.3, -0.02), l: V3(0.03, 0.19, 0.2), fov: 30 },
    { t: 0.0, p: V3(0.76, 0.31, 0.03), l: V3(0.03, 0.19, 0.2), fov: 30, tens: 0.5 },                         // the roller, rolling
    { t: 1.5, p: V3(0.73, 0.33, 0.06), l: V3(0.03, 0.2, 0.19), fov: 30, tens: 0.4 },
    { t: 3.3, p: V3(0.86, 2.02, 1.57), l: V3(0.03, 0.28, -0.12), fov: 36, tens: 0.35 },                      // out to the whole body: a wince
    { t: 5.0, p: V3(0.8, 1.86, 1.44), l: V3(0.04, 0.3, -0.06), fov: 36, tens: 0.5 },
    { t: 7.2, p: V3(0.64, 1.14, 1.0), l: V3(0.07, 0.42, 0.16), fov: 32, tens: 0.2 },                        // the fascia on the top thigh
    { t: 11.7, p: V3(0.62, 1.12, 0.97), l: V3(0.07, 0.41, 0.18), fov: 32, tens: 0.4 },
    { t: 13.3, p: V3(-0.22, 0.52, 0.98), l: V3(TW.x, 0.05, TW.z), fov: 30, tens: 0.2 },                     // the sample
    { t: 15.6, p: V3(-0.23, 0.54, 0.96), l: V3(TW.x, 0.07, TW.z), fov: 30, tens: 0.4 },
    { t: 19.9, p: V3(-0.02, 1.62, 1.95), l: V3(TW.x, 1.12, TW.z), fov: 34, tens: 0.3 },                     // the tower grows
    { t: 21.75, p: V3(1.55, 1.2, 1.75), l: V3(-0.3, 0.55, -0.02), fov: 36, tens: 0.25 },                    // the skeleton in front of it
    { t: 24.2, p: V3(1.52, 1.22, 1.7), l: V3(-0.28, 0.54, -0.02), fov: 36, tens: 0.3 },
    { t: 26.1, p: V3(0.35, 3.3, 0.75), l: V3(0.35, 0.3, 0.02), fov: 34, tens: 0.2 },                        // the test, from high above (head up)
    { t: 37.5, p: V3(0.35, 3.26, 0.74), l: V3(0.35, 0.3, 0.02), fov: 34, tens: 0.3 },
    { t: 39.3, p: V3(0.72, 1.22, 1.16), l: V3(0.07, 0.36, 0.12), fov: 34, tens: 0.2 },                       // sore thighs on the roller
    { t: 42.0, p: V3(0.7, 1.2, 1.13), l: V3(0.07, 0.36, 0.11), fov: 34, tens: 0.4 },
    { t: 43.7, p: V3(0.95, 1.9, 1.35), l: V3(0.02, 0.32, -0.2), fov: 36, tens: 0.2 },                       // the nerves, thigh to brain
    { t: 46.5, p: V3(0.93, 1.86, 1.32), l: V3(0.02, 0.32, -0.2), fov: 36, tens: 0.3 },
    { t: 47.95, p: V3(C.x + 0.72, C.y + 0.05, C.z + 0.02), l: V3(C.x, C.y + 0.005, C.z), fov: 30, tens: 0.2 },  // the end cap: the gag
    { t: 50.1, p: V3(C.x + 0.74, C.y + 0.09, C.z + 0.05), l: V3(C.x + 0.03, C.y - 0.02, C.z), fov: 30, tens: 0.4 },
    { t: 50.85, p: V3(P.x + 0.42, P.top + 0.2, P.z + 1.3), l: V3(P.x, P.top + 0.1, P.z), fov: 32, tens: 0.4 },
    { t: 51.7, p: V3(P.x + 0.14, P.top + 0.32, P.z + 1.13), l: V3(P.x - 0.01, P.top + 0.08, P.z), fov: 34, tens: 0.2 },   // the hourglasses
    { t: 57.6, p: V3(P.x + 0.13, P.top + 0.31, P.z + 1.1), l: V3(P.x - 0.01, P.top + 0.08, P.z), fov: 34, tens: 0.4 },
    { t: 59.3, p: V3(0.9, 2.05, 1.6), l: V3(0.03, 0.28, -0.12), fov: 36, tens: 0.2 },                       // a warm-up
    { t: 62.4, p: V3(0.88, 2.02, 1.57), l: V3(0.03, 0.28, -0.12), fov: 36, tens: 0.4 },
    { t: 67.2, p: V3(0.8, 1.84, 1.42), l: V3(0.03, 0.28, -0.1), fov: 36, tens: 0.4 },                       // see a doctor
    { t: 68.9, p: V3(C.x + 0.62, C.y + 0.06, C.z + 0.08), l: V3(C.x, C.y, C.z), fov: 30 },
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
const _m4 = new THREE.Matrix4(), _p3 = new THREE.Vector3();
let nerveP = 0, nerveT = 0;
function update(S, t) {
  const scene = S.scene, endDark = ss(T.back + 0.2, T.logo - 0.3, t), dbg = (S.cfg.dbg || {});
  const o = poseBody(t);
  // ---- the roller: half the body's travel, turning as it goes
  const RO = W.roll, zr = W.RZ0 + o.u / 2; RO.g.position.set(ROLLX, MAT_H + RR, zr); RO.g.rotation.x = (o.u / 2) / RR; RO.g.updateMatrixWorld(true);
  // ---- soft parts: muscles and fascia
  const itbO = Math.max(ss(T.breaking - 0.2, T.fascia, t) * (1 - ss(12.4, 13.0, t)), ss(T.after - 0.2, T.after + 0.6, t) * (1 - ss(47.2, 47.8, t))) * (dbg.soft ? 1 : 1);
  const musO = Math.max(ss(T.fascia2 - 0.1, T.real + 0.3, t) * (1 - ss(12.4, 13.0, t)), ss(T.after - 0.2, T.after + 0.6, t) * (1 - ss(47.2, 47.8, t)));
  const showSoft = itbO > 0.002 || musO > 0.002 || dbg.soft;
  for (const sk of W.skins) { sk.mesh.visible = showSoft; if (showSoft) sk.update(); }
  W.itbMat.uniforms.uO.value = dbg.soft ? 1 : itbO * (t > 30 ? 0.45 : 1); W.sheathMat.uniforms.uO.value = dbg.soft ? 1 : musO * (t > 30 ? 0.4 : ss(T.collagen - 0.3, T.wrapped + 0.3, t));
  W.musMat.opacity = (dbg.soft ? 1 : musO) * 0.82; W.musMat.depthWrite = W.musMat.opacity > 0.5;
  const sore = ss(T.after + 0.2, T.exercise2 + 0.4, t) * lerp(1, 0.8, s5(T.eases, T.little + 0.3, t)) * (1 - 0.45 * s5(T.turn, T.pain + 0.2, t)) * (1 - ss(47.0, 47.6, t));
  W.musMat.emissiveIntensity = sore * (1.05 + 0.15 * Math.sin(t * 5.2));
  // ---- the nerve
  { const on = pulse(t, T.likely - 0.3, T.the + 0.1, 0.45), down = s5(T.turn - 0.05, T.pain + 0.15, t);
    W.nerve.visible = on > 0.002;
    if (W.nerve.visible) { const c = nerveCurve(); W.nerve.geometry.dispose(); W.nerve.geometry = new THREE.TubeGeometry(c, 200, 0.0042, 8, false); }
    W.nerveMat.uniforms.uO.value = on * lerp(1, 0.45, down); W.nerveMat.uniforms.uG.value = lerp(1, 0.25, down);
    W.nerveMat.uniforms.uP.value = (t - T.likely) * lerp(0.75, 0.75, 0) - Math.max(0, t - T.turn) * 0.45 * down; }
  // ---- the tower: plates land one after another
  { const Tw = W.tower; let top = Tw.y0;
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
  { const Gn = W.gon, on = pulse(t, T.rolling2, 38.0, 0.5), L = o.L;
    Gn.fan.material.uniforms.opacity.value = 0.3 * on; Gn.arc.material.opacity = 0.9 * on; Gn.edge.material.opacity = 0.8 * on; Gn.ticks.forEach((m) => (m.material.opacity = 0.6 * on));
    const k = clamp01((L.phi - PHI0) / (PHI1 - PHI0)) * ss(T.before, T.about2, t); Gn.setSliver(k); Gn.sliver.material.opacity = 0.55 * on * (k > 0.01 ? 1 : 0);
    Gn.dash.material.opacity = 0.85 * pulse(t, T.no - 0.1, T.trial + 0.2, 0.3); }
  // ---- the sticker: peels from its right edge, lets go, falls on the mat
  { const RO2 = W.roll, st = RO2.sticker, P = st.geometry.attributes.position, A = RO2.rest, w2 = RO2.SW / 2;
    const peel = s5(T.release - 0.05, T.mostly + 0.15, t), fall = (t - (T.mostly + 0.25)), rc = 0.012, front = lerp(w2, -w2 - 0.004, peel);
    for (let i = 0; i < P.count; i++) { const x0 = A[i * 3], y0 = A[i * 3 + 1]; let x = x0, z = 0;
      if (x0 > front) { const a = Math.min(2.5, (x0 - front) / rc), s = x0 - front; x = front + (s > rc * 2.5 ? rc * Math.sin(2.5) + (s - rc * 2.5) * Math.cos(2.5) : rc * Math.sin(a)); z = s > rc * 2.5 ? rc * (1 - Math.cos(2.5)) + (s - rc * 2.5) * Math.sin(2.5) : rc * (1 - Math.cos(a)); }
      P.setXYZ(i, x, y0 + 0.002 * peel * Math.sin(x0 * 40), z); }
    P.needsUpdate = true; st.geometry.computeVertexNormals();
    const capM = RO2.cap.matrixWorld, local = new THREE.Matrix4().makeTranslation(RO2.stOff.x, RO2.stOff.y, RO2.stOff.z);
    if (fall <= 0) st.matrix.multiplyMatrices(capM, local);
    else {   // free: drift away from the cap, tumble, land flat on the mat in front of it
      const k = clamp01(fall / 0.75), base = new THREE.Matrix4().multiplyMatrices(capM, local), p0 = new THREE.Vector3().setFromMatrixPosition(base);
      const p = new THREE.Vector3(p0.x + 0.03 * s5(0, 1, k) + 0.02 * Math.sin(Math.PI * k), lerp(p0.y, MAT_H + 0.0012, k * k), p0.z - 0.035 * s5(0, 1, k));
      const q0 = new THREE.Quaternion().setFromRotationMatrix(base), q1 = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, Math.PI / 2 + 0.3));
      const q = q0.clone().slerp(q1, s5(0, 1, k)); st.matrix.compose(p, q, new THREE.Vector3(1, 1, 1));
      if (k >= 1) { for (let i = 0; i < P.count; i++) P.setXYZ(i, A[i * 3], A[i * 3 + 1], 0); P.needsUpdate = true; st.geometry.computeVertexNormals(); }
    }
    st.matrixWorldNeedsUpdate = true; }
  // ---- the hourglasses: on the turn of the line, both flip; the massage one drains slower
  { const H = W.hg, flip = s5(T.inlab - 0.05, T.inlab + 0.5, t);
    H.glasses.forEach((Gl, i) => {
      const dur = i ? 5.2 : 3.1, t0 = T.inlab + 0.55, f = flip < 1 ? 1 : 1 - clamp01((t - t0) / dur);   // f: the fraction still above
      Gl.flip.rotation.x = flip < 1 ? Math.PI * flip : 0;
      const before = flip < 1;   // until the flip ends: all the sand lies in the lower bulb (it rides up with the turn)
      const vTop = before ? 0 : SAND.cap * f, vBot = before ? SAND.cap : SAND.cap * (1 - f);
      const key = (vTop * 1e9).toFixed(0) + '|' + (vBot * 1e9).toFixed(0);
      if (key !== Gl.k) { Gl.k = key;
        Gl.top.geometry.dispose(); Gl.bot.geometry.dispose();
        if (vTop > 1e-9) { const lv = levelAt(SAND.V(0.1) + vTop); Gl.top.geometry = sandGeo(0.1, lv, Math.min(0.01, (lv - 0.1) * 0.8)); Gl.top.visible = true; } else Gl.top.visible = false;
        if (vBot > 1e-9) { const lv = levelAt(vBot); Gl.bot.geometry = sandGeo(0.014, lv, -0.008 * clamp01(vBot / SAND.cap)); Gl.bot.visible = true; Gl.lb = lv; } else { Gl.bot.visible = false; Gl.lb = 0.014; } }
      const flowing = !before && f > 0.002 && f < 0.999; Gl.stream.visible = flowing;
      if (flowing) { const lb = Gl.lb - 0.004; Gl.stream.scale.y = Math.max(0.001, 0.1 - lb); Gl.stream.position.y = (0.1 + lb) / 2; }
    }); }
  // ---- the end: the cap's label fades; the logo
  { const lk = s5(T.back + 0.4, T.logo - 0.25, t); W.roll.label.material.opacity = 1 - lk;
    W.logo.set({ weight: lk, white: lk, hours: 0, hand: ss(T.logo - 0.4, T.logo - 0.15, t), handScale: outBack(clamp01((t - (T.logo - 0.4)) / 0.35), 1.8) }); }
  // ---- light
  const fig = 1 - endDark;
  W.key.intensity = 15 * fig; W.rim.intensity = 3.0 * fig; W.fill.intensity = 1.1 * fig;
  W.towerLight.intensity = 7 * ss(T.squash - 0.8, T.squash, t) * (1 - ss(T.so, T.rolling2, t)) * fig + 2.0 * ss(T.so, T.rolling2, t) * fig;
  W.plinthLight.intensity = 5 * ss(T.flushing - 0.8, T.flushing, t) * (1 - ss(T.use, T.warmup, t)) * fig;
  W.rollLight.intensity = 2.6 * (1 - ss(2.0, 3.4, t)) * fig;
  W.capLight.intensity = 2.2 * Math.max(pulse(t, T.the - 0.6, T.flushing, 0.4), ss(T.back - 0.6, T.back, t)) * (1 - 0.6 * endDark);
  S.tableMat.color.setScalar(0.35 * (1 - endDark * 0.9)); scene.environmentIntensity = 0.12 * (1 - endDark); S.reflAmt = 0.6 * (1 - endDark);
}

// ------------------------------------------------------------------ the words on screen
const CAPS = [
  { t0: 0.35, t1: 1.75, top: 300, size: 100, html: '<em>Foam rolling.</em>' },
  { t0: 1.89, t1: 3.55, top: 300, size: 92, html: 'Lie on a tube, <em>wince</em>' },
  { t0: 3.71, t1: 6.4, top: 292, size: 80, html: 'and believe you&rsquo;re<br><em>breaking up</em> your fascia' },
  { t0: 7.13, t1: 11.6, top: 292, size: 78, html: 'Fascia is real: tough<br><em>collagen</em> wrapped<br>around every muscle' },
  { t0: 12.25, t1: 15.0, top: 292, size: 84, html: 'To squash the<br>thick kind<br>by just <em>1%</em>' },
  { t0: 15.12, t1: 20.8, top: 292, size: 80, html: 'one model says<br>you&rsquo;d need about<br><em>925 kilos</em>' },
  { t0: 21.01, t1: 23.6, top: 292, size: 84, html: 'Lying on a roller<br><em>doesn&rsquo;t come close</em>' },
  { t0: 24.27, t1: 26.25, top: 300, size: 88, html: 'So what does<br><em>rolling</em> do?' },
  { t0: 26.4, t1: 30.6, top: 292, size: 80, html: 'Before exercise: about<br><em>4% more flexibility</em>' },
  { t0: 31.28, t1: 33.15, top: 300, size: 88, html: 'No better than<br><em>stretching</em>' },
  { t0: 33.32, t1: 37.9, top: 292, size: 76, html: 'In one trial, the extra<br>range was <em>gone within</em><br><em>30 minutes</em>' },
  { t0: 38.57, t1: 41.8, top: 292, size: 82, html: 'After exercise, it eases<br>soreness <em>a little</em>' },
  { t0: 42.47, t1: 47.6, top: 292, size: 74, html: 'One likely reason: your<br>nerves turn down <em>pain</em><br><em>and tension</em>, for a while' },
  { t0: 47.93, t1: 50.3, top: 292, size: 84, html: 'The release is mostly<br><em>in the name</em>' },
  { t0: 50.99, t1: 53.15, top: 300, size: 88, html: 'Flushing out <em>lactic acid?</em>' },
  { t0: 53.31, t1: 57.8, top: 292, size: 76, html: 'In one lab test, sports<br>massage actually <em>slowed</em><br>its clearing' },
  { t0: 58.47, t1: 61.65, top: 292, size: 84, html: 'Use it as a <em>warm-up</em>,<br>not a repair kit' },
  { t0: 62.33, t1: 65.1, top: 292, size: 84, html: 'Muscle pain that won&rsquo;t<br>settle with <em>rest?</em>' },
  { t0: 65.29, t1: 67.6, top: 292, size: 88, html: 'See a <em>doctor</em>,<br>not a foam roller' },
  { t0: 68.54, t1: 99, top: 360, size: 96, html: 'Back to<br><em>factory settings.</em>' },
];
const OVL = {};
function overlayInit(S) {
  const O = S.O, tag = (cls, txt2, size, bsize) => { const e = O.tag(cls, txt2); e.style.fontSize = size + 'px'; const b = e.querySelector('b'); if (b && bsize) b.style.fontSize = bsize + 'px'; return e; };
  OVL.itb = tag('tag', 'Fascia<b>iliotibial band</b>', 22, 36);
  OVL.load = tag('tag', 'Load<b>0 kg</b>', 24, 56); OVL.loadB = OVL.load.querySelector('b');
  OVL.sq = tag('tag', 'Squashed<b>1%</b>', 22, 44);
  OVL.model = tag('tag', 'One model<b>fascia lata</b>', 20, 34);
  OVL.range = tag('tag', 'Its own<b>range</b>', 22, 40);
  OVL.more = tag('tag', 'After rolling<b>+4%</b>', 22, 44);
  OVL.str = tag('tag', 'Stretching<b>the same</b>', 22, 36);
  OVL.min = tag('tag', 'Later<b>0 min</b>', 22, 44); OVL.minB = OVL.min.querySelector('b');
  OVL.sore = tag('tag', 'Soreness<b>a little less</b>', 22, 36);
  OVL.nerve = tag('tag', 'Pain and tension<b>turned down</b>', 22, 36);
  OVL.clear = tag('tag', 'Clearing<b>slower with massage</b>', 22, 36);
}
function overlay(S, t) {
  const R = W.rig, G = R.legs.Right;
  place(S, OVL.itb, wp(G.hip, G.H.clone().lerp(G.K, 0.5).add(new THREE.Vector3(-0.06, 0, 0))), 50, -60, pulse(t, T.breaking, T.real));
  const n = Math.min(NPLATES, W.tower.land.filter((x) => x <= t).length), kg = n * 20 + (t >= W.tower.land5 ? 5 : 0); OVL.loadB.textContent = kg + ' kg';
  place(S, OVL.load, new THREE.Vector3(TOWER.x + 0.24, Math.max(0.12, (W.towerTop || 0) - 0.02), TOWER.z), 40, -40, pulse(t, T.one - 0.3, T.lying + 0.4));
  place(S, OVL.model, new THREE.Vector3(TOWER.x, 0.03, TOWER.z + 0.15), 30, 20, pulse(t, T.thick, T.one + 0.2));
  place(S, OVL.sq, new THREE.Vector3(TOWER.x + 0.12, 0.03, TOWER.z + 0.12), 30, 20, pulse(t, T.kilos + 0.1, T.lying + 0.6));
  const H = W.HR0;
  place(S, OVL.range, H.clone().add(new THREE.Vector3(Math.sin(PHI0) * 0.82, 0, Math.cos(PHI0) * 0.82)), 30, -30, pulse(t, T.rolling2 + 0.4, T.about2));
  place(S, OVL.more, H.clone().add(new THREE.Vector3(Math.sin(PHI1) * 0.82, 0, Math.cos(PHI1) * 0.82)), 30, -30, pulse(t, T.about2 + 0.2, T.no));
  place(S, OVL.str, H.clone().add(new THREE.Vector3(Math.sin(PHI1) * 0.6, 0, Math.cos(PHI1) * 0.6)), 40, -10, pulse(t, T.no, T.trial));
  OVL.minB.textContent = Math.round(30 * s5(T.trial, T.minutes + 0.3, t)) + ' min';
  place(S, OVL.min, H.clone().add(new THREE.Vector3(0.1, 0, 0.75)), 20, -20, pulse(t, T.trial - 0.1, 38.1));
  place(S, OVL.sore, wp(R.legs.Left.hip, R.legs.Left.H.clone().lerp(R.legs.Left.K, 0.5)), 60, -120, pulse(t, T.eases - 0.2, T.likely));
  const ax = R.seg.Axis || R.seg['Third cervical vertebra'];
  place(S, OVL.nerve, wp(ax.g, ax.pivot.clone().add(new THREE.Vector3(0, 0.13, 0.03))), 40, -60, pulse(t, T.turn, T.the));
  place(S, OVL.clear, new THREE.Vector3(PLINTH.x + 0.11, PLINTH.top + 0.21, PLINTH.z), 30, -60, pulse(t, T.slowed - 0.2, T.use - 0.3));
  const c = new THREE.Vector3(), e = new THREE.Vector3(); W.roll.cap.getWorldPosition(c); e.copy(c).add(new THREE.Vector3(0, 0.052, 0));
  logoEnd(S, t, { t0: T.logo, center: c, edge: e });
}

makeFilm({
  T, caps: CAPS, subs: [], build, update, pose: camPose, overlay, overlayInit, focus: focusAt,
  stage: { bg: 0x07080a, reflSize: 6, env: 0.12, far: 30 },
  aperture: [[0, 0.003], [7.4, 0.003], [13.2, 0.002], [19.9, 0.0015], [26, 0.0015], [39.2, 0.003], [43.6, 0.002], [48, 0.004], [51.6, 0.003], [59.2, 0.0015], [68.9, 0.003]],
  bloom: [[0, 0.45], [68, 0.55]],
});

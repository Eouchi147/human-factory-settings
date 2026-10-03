// Human Factory Settings · Film 11 "What does creatine do?" · one continuous shot, 9:16.
// A skeleton stands on a bathroom scale in a dark home gym, a dumbbell in its left hand. On the side table: a tub of
// creatine; a molecule rises from the scoop, beside the four rings of a steroid (nothing alike). Your body makes about a
// gram a day (the kitchen scale). Its arm and thigh muscles appear, lit from inside by the store; a short, hard curl
// spends it and it refills; supplements raise the gauge 20 to 40%. A beam balance: lifting with creatine against lifting
// alone, 1.1 kg of lean mass more; without lifting, a 30 g chip. The scale: up 1 to 2 kg, mostly water (the muscles turn
// blue). The brain lights a little for memory; no proof for dementia. The hair-loss scare: the skeleton combs its bald
// skull (the gag). Two lab tests of gummies: a scan finds almost no creatine in 5 of 9, and 5 of 12. A blood tube:
// creatinine can read higher; the kidneys. A dial for the gram a day the body makes becomes the logo.
import { THREE, ORANGE, COLD, ss, s5, lerp, clamp01, hash, camTrack, phys, glowMat, shadows, spot, RoundedBoxGeometry,
  loadAnatomy, tissueMat, V3, place, logoEnd, makeFilm, outBack, stamp, labelCanvas, stampLine, noiseTex, TIME } from '../kit.js';
import { buildRig, skeletonKind, bendSpine, poseArm, worldVerts } from '../rig.js';
import { makeLogoRing } from '../props.js';
import { skinned, armBinder } from '../soft.js';

// ------------------------------------------------------------------ timing, from the voice guide (word starts)
const T = {
  end: 79.5,
  creatine: 0.35, not: 1.77, steroid: 2.49, body: 3.43, makes: 3.70, gram: 4.70, day: 5.55,                                  // "Creatine. Not a steroid. Your body makes about a gram of it a day."
  about: 6.42, ninety: 7.11, sits: 8.16, muscles: 8.80, where: 9.42, refuels: 10.00, short: 10.90, hard: 11.04, efforts: 11.65,
  supplements: 13.13, top: 14.01, store: 14.62, twenty: 15.28, forty: 15.83, percent: 16.20,
  trials: 18.12, lifting: 18.47, taking: 19.19, added: 19.73, kilo: 21.33, lean: 22.05, mass: 22.63, alone: 24.09,
  take: 25.60, without: 26.32, exercising: 26.69, zero: 27.49, three: 29.25, kilos: 29.57, doesnt: 31.11, workout: 32.08,
  first: 34.26, scale: 35.08, up: 35.89, one: 36.01, two: 36.56, mostly: 37.59, water: 38.22,
  memory: 40.06, small: 40.61, gain: 40.83, no: 42.49, proof: 43.08, prevents: 43.53, dementia: 44.56,
  hair: 46.40, scare: 47.03, study: 47.63, twentyR: 48.31, rugby: 48.89, never: 50.28, measured: 50.78, hair2: 51.49,
  twelve: 52.93, trial: 53.48, did: 54.10, found: 54.30, difference: 54.89,
  gummies: 56.35, inTwo: 57.59, lab: 58.42, close: 59.00, half: 59.47, brands: 60.04, almost: 60.84, none: 61.19,
  raise: 64.43, creatinine: 64.69, blood: 65.51, tell: 66.69, doctor: 67.34, kidney: 69.04, diabetes: 70.28, pressure: 72.02, ask: 72.50,
  back: 75.38, factory: 76.24, settings: 76.54, logo: 77.24,
};

// ------------------------------------------------------------------ the set (metres; the skeleton faces +z; +x is its left)
const W = {}; window.HFS_W = W;
const SCALE = { w: 0.34, d: 0.36, h: 0.026 };
const TABLE = { x: 0.62, z: -0.02, w: 0.5, d: 0.42, top: 0.8 };            // the side table, at its left
const TUB = new THREE.Vector3(0.5, TABLE.top, -0.1), KS = new THREE.Vector3(0.68, TABLE.top, 0.06), TUBE = new THREE.Vector3(0.77, TABLE.top, -0.13);
const DIAL = new THREE.Vector3(0.53, TABLE.top, 0.12), DIAL_R = 0.052, LOGO_R = 0.04;
const BAL = { x: 0.68, z: 0.72, top: 0.6 };                               // the beam balance's plinth, in front
const GAUGE = new THREE.Vector3(-0.36, 0, 0.3);                            // the store gauge, at its right
const GSHELF = { x: -0.72, z: -0.06, w: 0.62, y: [0.84, 1.08] };           // the gummies, two rows (two tests)
const X = new THREE.Vector3(1, 0, 0), Y = new THREE.Vector3(0, 1, 0), Z = new THREE.Vector3(0, 0, 1);
const pulse = (t, a, b, r = 0.35) => ss(a, a + r, t) * (1 - ss(b - r, b, t));
function canvasTex(w, h, draw, { srgb = true, aniso = 8 } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h, c);
  const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = aniso; t.userData.canvas = c; return t;
}
function txt(x, s, px, py, { font = '800 100px Archivo', color = '#fff', align = 'center', track = 0, base = 'middle', maxW = 0 } = {}) {
  x.font = font; x.letterSpacing = `${track}px`; x.fillStyle = color; x.textAlign = align; x.textBaseline = base;
  if (maxW) { const w = x.measureText(s).width; if (w > maxW) { x.save(); x.translate(px, py); x.scale(maxW / w, 1); x.fillText(s, 0, 0); x.restore(); return; } }
  x.fillText(s, px, py);
}
const black = () => phys({ color: 0x0d0e10, roughness: 0.32, clearcoat: 0.6, clearcoatRoughness: 0.25 });
function glassMat(color, { alpha = 0.06, rim = 0.5, pow = 2.4 } = {}) {
  return new THREE.ShaderMaterial({
    uniforms: { uC: { value: new THREE.Color(color) }, uA: { value: alpha }, uR: { value: rim }, uP: { value: pow }, uO: { value: 1 } },
    vertexShader: 'varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }',
    fragmentShader: 'uniform vec3 uC; uniform float uA, uR, uP, uO; varying vec3 vN; varying vec3 vV; void main(){ float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), uP); gl_FragColor = vec4(uC * (0.7 + 0.8 * f), (uA + uR * f) * uO); }',
    transparent: true, depthWrite: false, side: THREE.DoubleSide });
}

// ------------------------------------------------------------------ seven-segment digits (as in film 5)
const SEG = { 0: 'abcdef', 1: 'bc', 2: 'abged', 3: 'abgcd', 4: 'fgbc', 5: 'afgcd', 6: 'afgedc', 7: 'abc', 8: 'abcdefg', 9: 'abcdfg', '-': 'g', ' ': '' };
function seg7(x, text, { x0, y0, w, h, th, gap, on, off, slant = 0.12, cells }) {
  const cs = []; for (const ch of text) { if (ch === '.' && cs.length) cs[cs.length - 1].dp = true; else cs.push({ ch, dp: false }); }
  while (cs.length < cells) cs.unshift({ ch: ' ', dp: false });
  const hseg = (sx, sy, len) => { x.beginPath(); x.moveTo(sx, sy); x.lineTo(sx + th / 2, sy - th / 2); x.lineTo(sx + len - th / 2, sy - th / 2); x.lineTo(sx + len, sy); x.lineTo(sx + len - th / 2, sy + th / 2); x.lineTo(sx + th / 2, sy + th / 2); x.closePath(); x.fill(); };
  const vseg = (sx, sy, len) => { x.beginPath(); x.moveTo(sx, sy); x.lineTo(sx + th / 2, sy + th / 2); x.lineTo(sx + th / 2, sy + len - th / 2); x.lineTo(sx, sy + len); x.lineTo(sx - th / 2, sy + len - th / 2); x.lineTo(sx - th / 2, sy + th / 2); x.closePath(); x.fill(); };
  x.save(); x.transform(1, 0, -slant, 1, slant * (y0 + h), 0);
  const pitch = w + th * 1.25 + gap * 4;
  cs.forEach((c, i) => {
    const cx = x0 + i * pitch, g = gap, hh = h / 2, lit = SEG[c.ch] || '';
    const S = { a: () => hseg(cx + g, y0, w - 2 * g), g: () => hseg(cx + g, y0 + hh, w - 2 * g), d: () => hseg(cx + g, y0 + h, w - 2 * g),
      f: () => vseg(cx, y0 + g, hh - 2 * g), b: () => vseg(cx + w, y0 + g, hh - 2 * g), e: () => vseg(cx, y0 + hh + g, hh - 2 * g), c: () => vseg(cx + w, y0 + hh + g, hh - 2 * g) };
    for (const k of 'abcdefg') { x.fillStyle = lit.includes(k) || (c.ch === '+' && k === 'g') ? on : off; S[k](); }
    if (c.ch === '+') { x.fillStyle = on; vseg(cx + w / 2, y0 + hh * 0.42, hh * 1.16); }
  });
  cs.forEach((c, i) => { x.fillStyle = c.dp ? on : off; x.beginPath(); x.arc(x0 + i * pitch + w + th * 0.62 + gap * 2, y0 + h, th * 0.5, 0, Math.PI * 2); x.fill(); });
  x.restore();
}

// ------------------------------------------------------------------ props
function makeTable(scene, P) {
  const g = new THREE.Group(); g.position.set(P.x, 0, P.z); scene.add(g);
  const top = new THREE.Mesh(new RoundedBoxGeometry(P.w, 0.03, P.d, 4, 0.008), black()); top.position.y = P.top - 0.015; g.add(top);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const leg = new THREE.Mesh(new THREE.BoxGeometry(0.025, P.top - 0.03, 0.025), black()); leg.position.set(sx * (P.w / 2 - 0.04), (P.top - 0.03) / 2, sz * (P.d / 2 - 0.04)); g.add(leg); }
  shadows(g); g.traverse((o) => o.layers.enable(1)); return g;
}
// the tub: white, a plain label (no brand): CREATINE / MONOHYDRATE
function makeTub() {
  const g = new THREE.Group(), r = 0.062, h = 0.17;
  const lab = canvasTex(1024, 512, (x, w, h2) => { x.fillStyle = '#f3f3f1'; x.fillRect(0, 0, w, h2); x.fillStyle = '#16181c'; x.fillRect(0, h2 - 64, w, 64); x.fillRect(0, 0, w, 40);
    txt(x, 'CREATINE', 512, 196, { font: '900 132px Archivo', color: '#16181c', track: 6, maxW: 340 }); txt(x, 'MONOHYDRATE', 512, 300, { font: '700 46px Archivo', color: '#4a4e57', track: 10, maxW: 330 });
    txt(x, '500 g', 512, h2 - 32, { font: '700 30px Archivo', color: '#fff', track: 5 }); x.globalAlpha = 0.25; for (let k = 0; k < 9; k++) { x.fillStyle = '#16181c'; x.fillRect(90, 110 + k * 30, 170, 6); x.fillRect(w - 260, 110 + k * 30, 170, 6); } });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 0.97, h * 0.86, 64, 1, true), phys({ map: lab, roughness: 0.4, clearcoat: 0.5, side: THREE.DoubleSide })); body.rotation.y = Math.PI + 0.62; body.position.y = h * 0.43; g.add(body);
  const base = new THREE.Mesh(new THREE.CircleGeometry(r * 0.97, 48), phys({ color: 0xf3f3f1 })); base.rotation.x = Math.PI / 2; base.position.y = 0.001; g.add(base);
  const powder = new THREE.Mesh(new THREE.CircleGeometry(r * 0.96, 48), phys({ color: 0xf6f5f1, roughness: 0.95, bumpMap: noiseTex(5, 256, 0.6, 1, 8), bumpScale: 0.4 })); powder.rotation.x = -Math.PI / 2; powder.position.y = h * 0.7; g.add(powder);
  const lid = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.04, r * 1.04, 0.022, 64), phys({ color: 0x16181c, roughness: 0.35, clearcoat: 0.6 })); lid.position.set(0.12, 0.011, 0.04); g.add(lid);   // off, on the table beside it
  const scoopM = phys({ color: 0xe9ecef, roughness: 0.35, clearcoat: 0.5 });
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.017, 0.014, 0.022, 32, 1, true), scoopM); const cupB = new THREE.Mesh(new THREE.CircleGeometry(0.014, 32), scoopM); cupB.rotation.x = Math.PI / 2; cupB.position.y = -0.011; cup.add(cupB);
  const fill = new THREE.Mesh(new THREE.SphereGeometry(0.0168, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), phys({ color: 0xf8f7f3, roughness: 0.95 })); fill.scale.y = 0.45; fill.position.y = 0.009; cup.add(fill);
  const handle = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.004, 0.009), scoopM); handle.position.set(0.05, 0.006, 0); cup.add(handle);
  const scoop = new THREE.Group(); scoop.add(cup); scoop.position.set(0.0, h * 0.7 + 0.012, 0.0); scoop.rotation.z = 0.25; g.add(scoop);
  shadows(g); g.traverse((o) => o.layers.enable(1)); return { g, scoop, powderY: h * 0.7 };
}
// creatine as atoms (ball and stick, angstroms): H2N-C(=NH)-N(CH3)-CH2-COOH, C4H9N3O2
const ATOMS = [
  ['C', 0, 0, 0], ['N', -1.2, 0.72, 0], ['N', 0.0, -1.32, 0], ['N', 1.24, 0.72, 0], ['C', 1.24, 2.18, 0.1], ['C', 2.5, 0.02, 0], ['C', 3.74, 0.72, 0], ['O', 3.74, 1.95, 0.05], ['O', 4.9, 0.02, 0],
  ['H', -2.1, 0.22, 0], ['H', -1.25, 1.72, 0.05], ['H', -0.9, -1.78, 0], ['H', 0.38, 2.62, 0.3], ['H', 2.08, 2.62, 0.35], ['H', 1.28, 2.42, -0.95], ['H', 2.5, -0.6, 0.86], ['H', 2.5, -0.6, -0.86], ['H', 5.66, 0.52, 0],
];
const BONDS = [[0, 1, 1], [0, 2, 2], [0, 3, 1], [3, 4, 1], [3, 5, 1], [5, 6, 1], [6, 7, 2], [6, 8, 1], [1, 9, 1], [1, 10, 1], [2, 11, 1], [4, 12, 1], [4, 13, 1], [4, 14, 1], [5, 15, 1], [5, 16, 1], [8, 17, 1]];
function makeMolecule() {
  const g = new THREE.Group(), s = 0.022;   // metres per angstrom
  const col = { C: 0x3a3d43, N: 0x4a78ff, O: 0xe0473a, H: 0xe9ebef }, rad = { C: 0.38, N: 0.36, O: 0.36, H: 0.22 };
  const mats = {}; for (const k in col) mats[k] = phys({ color: col[k], roughness: 0.3, clearcoat: 0.8, clearcoatRoughness: 0.12, transparent: true, opacity: 0 });
  const c = new THREE.Vector3(); for (const a of ATOMS) c.add(new THREE.Vector3(a[1], a[2], a[3])); c.multiplyScalar(1 / ATOMS.length);
  const P = ATOMS.map((a) => new THREE.Vector3(a[1], a[2], a[3]).sub(c).multiplyScalar(s));
  ATOMS.forEach((a, i) => { const m = new THREE.Mesh(new THREE.SphereGeometry(rad[a[0]] * s, 24, 16), mats[a[0]]); m.position.copy(P[i]); g.add(m); });
  const stick = phys({ color: 0xc9ccd2, roughness: 0.35, clearcoat: 0.5, transparent: true, opacity: 0 });
  for (const [i, j, n] of BONDS) {
    const d = P[j].clone().sub(P[i]), L = d.length(), mid = P[i].clone().add(P[j]).multiplyScalar(0.5), q = new THREE.Quaternion().setFromUnitVectors(Y, d.clone().normalize());
    const off = new THREE.Vector3(0, 0, 1).cross(d).normalize().multiplyScalar(0.0045);
    for (let k = 0; k < n; k++) { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.0022, 0.0022, L, 10), stick); m.quaternion.copy(q); m.position.copy(mid).addScaledVector(off, n > 1 ? (k - 0.5) * 2 : 0); g.add(m); }
  }
  g.userData.mats = [...Object.values(mats), stick];
  return g;
}
// a steroid's skeleton, drawn as chemists draw it: three six-rings and a five-ring, fused (on a dark card)
function steroidCard() {
  return canvasTex(768, 512, (x, w, h) => {
    x.fillStyle = '#121316'; x.beginPath(); x.roundRect(0, 0, w, h, 26); x.fill(); x.strokeStyle = 'rgba(236,238,241,0.18)'; x.lineWidth = 3; x.beginPath(); x.roundRect(8, 8, w - 16, h - 16, 22); x.stroke();
    const r = 58, hexV = (cx, cy) => [-90, -30, 30, 90, 150, 210].map((d) => [cx + r * Math.cos((d * Math.PI) / 180), cy + r * Math.sin((d * Math.PI) / 180)]);
    const A = [190, 300], B = [A[0] + Math.sqrt(3) * r, A[1]], C = [B[0] + (Math.sqrt(3) * r) / 2, B[1] - 1.5 * r];
    const rings = [hexV(...A), hexV(...B), hexV(...C)];
    const p1 = rings[2][1], p2 = rings[2][2], mx = (p1[0] + p2[0]) / 2, my = (p1[1] + p2[1]) / 2, R5 = r / (2 * Math.sin(Math.PI / 5)), ap = r / (2 * Math.tan(Math.PI / 5)), cx5 = mx + ap, cy5 = my;
    rings.push([144, 216, 288, 0, 72].map((d) => [cx5 + R5 * Math.cos((d * Math.PI) / 180), cy5 + R5 * Math.sin((d * Math.PI) / 180)]));
    x.strokeStyle = '#eceef1'; x.lineWidth = 7; x.lineJoin = 'round';
    for (const ring of rings) { x.beginPath(); ring.forEach(([a, b], i) => (i ? x.lineTo(a, b) : x.moveTo(a, b))); x.closePath(); x.stroke(); }
    txt(x, 'A STEROID', w / 2, 70, { font: '600 40px "Geist Mono"', color: '#9a9da4', track: 10 });
  });
}
// the bathroom scale, the kitchen scale (as in film 5)
function makeBathScale() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new RoundedBoxGeometry(SCALE.w, 0.018, SCALE.d, 4, 0.008), phys({ color: 0x15161a, roughness: 0.45, metalness: 0.3 })); body.position.y = 0.011; g.add(body);
  const glass = new THREE.Mesh(new RoundedBoxGeometry(SCALE.w + 0.002, 0.007, SCALE.d + 0.002, 4, 0.0034), phys({ color: 0x0b0c0f, roughness: 0.06, clearcoat: 1, clearcoatRoughness: 0.04, specularIntensity: 0.8 }));
  glass.position.y = SCALE.h - 0.0035; g.add(glass);
  const c = document.createElement('canvas'); c.width = 512; c.height = 176;
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const disp = new THREE.Mesh(new THREE.PlaneGeometry(0.086, 0.0296), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false, transparent: true }));
  disp.rotation.x = -Math.PI / 2; disp.position.set(0.07, SCALE.h + 0.0002, SCALE.d / 2 - 0.024); g.add(disp);
  shadows(g); disp.castShadow = false; g.traverse((o) => o.layers.enable(1));
  return { g, c, tex, disp, key: '' };
}
function drawBath(B, text, glow) {
  const key = text + '|' + glow.toFixed(2); if (key === B.key) return; B.key = key;
  const x = B.c.getContext('2d'), w = B.c.width, h = B.c.height;
  x.clearRect(0, 0, w, h); x.fillStyle = '#050506'; x.beginPath(); x.roundRect(0, 0, w, h, 18); x.fill();
  if (glow > 0.001) { const on = `rgba(255,${Math.round(70 + 40 * glow)},${Math.round(60 + 30 * glow)},${glow})`, off = `rgba(90,24,26,${0.16 * glow})`;
    seg7(x, text, { x0: 52, y0: 30, w: 66, h: 114, th: 15, gap: 3, on, off, cells: 3, slant: 0.1 }); x.globalAlpha = glow; txt(x, 'kg', 452, 128, { font: '600 46px Archivo', color: '#ff5a4a', track: 2 }); x.globalAlpha = 1; }
  B.tex.needsUpdate = true;
}
function makeKitchenScale() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new RoundedBoxGeometry(0.16, 0.018, 0.17, 4, 0.006), phys({ color: 0xeeeeec, roughness: 0.4, clearcoat: 0.4 })); body.position.y = 0.009; g.add(body);
  const brushed = noiseTex(17, 256, 0.85, 1.0, 1); brushed.repeat.set(1, 30);
  const plate = new THREE.Mesh(new RoundedBoxGeometry(0.15, 0.003, 0.15, 3, 0.0012), phys({ color: 0xc9ccd1, metalness: 1, roughness: 0.32, roughnessMap: brushed })); plate.position.set(0, 0.0195, -0.008); g.add(plate);
  const c = document.createElement('canvas'); c.width = 384; c.height = 128;
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const disp = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 0.02), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false })); disp.position.set(0.0, 0.0095, 0.0852); g.add(disp);
  const heap = new THREE.Mesh(new THREE.ConeGeometry(0.009, 0.006, 32), phys({ color: 0xf8f7f3, roughness: 0.95 })); heap.position.set(0, 0.021 + 0.003, -0.008); heap.visible = false; g.add(heap);
  shadows(g); disp.castShadow = false; g.traverse((o) => o.layers.enable(1));
  return { g, c, tex, heap, key: '' };
}
function drawKitchen(K, grams) {
  const text = String(grams), key = text; if (key === K.key) return; K.key = key;
  const x = K.c.getContext('2d'), w = K.c.width, h = K.c.height;
  x.fillStyle = '#b9c7c4'; x.fillRect(0, 0, w, h);
  seg7(x, text, { x0: 40, y0: 20, w: 46, h: 82, th: 11, gap: 2.4, on: '#15191a', off: 'rgba(20,25,26,0.08)', cells: 4, slant: 0.08 });
  txt(x, 'g', 346, 92, { font: '700 44px Archivo', color: '#15191a' }); K.tex.needsUpdate = true;
}
// the store gauge: a glass column, 100% marked; the white level rises 20 to 40% over it
function makeGauge(scene) {
  const g = new THREE.Group(); g.position.copy(GAUGE); scene.add(g);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.065, 0.025, 48), black()); base.position.y = 0.0125; g.add(base);
  const H0 = 0.62, H1 = 1.16;   // the glass from 0.62 to 1.16 m; 100% at 1.0 m
  const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, H1 - H0, 48, 1, true), glassMat(0xdfe8ff, { alpha: 0.04, rim: 0.4 })); glass.position.y = (H0 + H1) / 2; glass.renderOrder = 6; g.add(glass);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, H0 - 0.025, 16), black()); stem.position.y = (H0 + 0.025) / 2; g.add(stem);
  const fillM = new THREE.MeshPhysicalMaterial({ color: 0xf2f3f5, roughness: 0.3, emissive: new THREE.Color(0xffffff), emissiveIntensity: 0.25, transparent: true, opacity: 0.92 });
  const fill = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 1, 48), fillM); g.add(fill);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.0315, 0.0315, 1, 48, 1, true), new THREE.MeshBasicMaterial({ color: new THREE.Color(0x4a78ff).multiplyScalar(1.4), transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide })); g.add(band);
  const mark = new THREE.Mesh(new THREE.TorusGeometry(0.032, 0.0018, 8, 64), new THREE.MeshBasicMaterial({ color: 0xeceef1 })); mark.rotation.x = Math.PI / 2; g.add(mark);
  const lab = canvasTex(512, 96, (x, w, h) => { x.clearRect(0, 0, w, h); txt(x, 'MUSCLE STORE', w / 2, h / 2, { font: '600 40px "Geist Mono"', color: '#a6a9b0', track: 9 }); });
  const lm = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 0.028), new THREE.MeshBasicMaterial({ map: lab, transparent: true })); lm.position.set(0, H0 - 0.04, 0.035); g.add(lm);
  shadows(g); glass.castShadow = false; g.traverse((o) => o.layers.enable(1));
  const Y100 = 1.0, level = (k) => H0 + (Y100 - H0) * k;   // k = 1 at 100%
  return { g, fill, fillM, band, mark, level, H0, H1, Y100 };
}
// the beam balance: a column, a beam, two pans hanging; labels on the plinth
function makeBalance(scene) {
  const g = new THREE.Group(); g.position.set(BAL.x, 0, BAL.z); scene.add(g);
  const box = new THREE.Mesh(new RoundedBoxGeometry(0.46, BAL.top, 0.3, 5, 0.012), black()); box.position.y = BAL.top / 2; g.add(box);
  const brass = phys({ color: 0xb8a07a, metalness: 1, roughness: 0.3, clearcoat: 0.4 }), dark = phys({ color: 0x1c1d21, metalness: 0.6, roughness: 0.4 });
  const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.02, 48), dark); foot.position.y = BAL.top + 0.01; g.add(foot);
  const col = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.012, 0.36, 24), brass); col.position.y = BAL.top + 0.2; g.add(col);
  const pivot = new THREE.Group(); pivot.position.y = BAL.top + 0.38; g.add(pivot);
  const beam = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.012, 0.014), brass); pivot.add(beam);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.014, 24, 16), brass); pivot.add(knob);
  const needle = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.12, 0.004), dark); needle.position.y = -0.06; pivot.add(needle);
  const pans = [];
  for (const s of [-1, 1]) {
    const hang = new THREE.Group(); hang.position.x = s * 0.175; pivot.add(hang);
    const hook = new THREE.Group(); hang.add(hook);   // stays level
    for (let k = 0; k < 3; k++) { const a = (k / 3) * Math.PI * 2, wire = new THREE.Mesh(new THREE.CylinderGeometry(0.0012, 0.0012, 0.19, 6), dark); wire.position.set(Math.cos(a) * 0.036, -0.095, Math.sin(a) * 0.036); wire.rotation.set(Math.sin(a) * 0.19, 0, -Math.cos(a) * 0.19); hook.add(wire); }
    const pan = new THREE.Mesh(new THREE.CylinderGeometry(0.078, 0.074, 0.008, 64), brass); pan.position.y = -0.19; hook.add(pan);
    pans.push({ hang, hook, pan, s });
  }
  // what the pans hold: lean mass, as blocks of muscle (the 1.1 kg block is 10.1 cm a side; 30 g is 3.0 cm)
  const fib = canvasTex(256, 256, (x, w, h) => { x.fillStyle = '#808080'; x.fillRect(0, 0, w, h); for (let k = 0; k < 90; k++) { const y = (k / 90) * h + (hash(k) - 0.5) * 2; x.strokeStyle = `rgba(${hash(k * 3) > 0.5 ? 255 : 0},${hash(k * 3) > 0.5 ? 255 : 0},${hash(k * 3) > 0.5 ? 255 : 0},0.35)`; x.lineWidth = 1 + hash(k * 5) * 1.5; x.beginPath(); x.moveTo(0, y); x.bezierCurveTo(w * 0.3, y + 3, w * 0.7, y - 3, w, y + 1); x.stroke(); } }, { srgb: false });
  const mus = tissueMat('muscle', { bumpMap: fib, bumpScale: 1.4, roughness: 0.42, clearcoat: 0.45, color: new THREE.Color(0x6a2420), transparent: true, opacity: 1 });
  const block = (a) => { const m = new THREE.Mesh(new RoundedBoxGeometry(a, a, a, 3, a * 0.12), mus); m.castShadow = m.receiveShadow = true; m.layers.enable(1); return m; };
  const big = block(0.101), chip = block(0.030);
  big.position.set(0.0, -0.19 + 0.004 + 0.0505, 0.0); pans[0].hook.add(big); chip.position.set(0.0, -0.19 + 0.004 + 0.015, 0.0); pans[0].hook.add(chip);
  // the label plate: two captions, redrawn for each comparison
  const c = document.createElement('canvas'); c.width = 1024; c.height = 160; const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(0.44, 0.07), new THREE.MeshBasicMaterial({ map: tex, transparent: true })); plate.position.set(0, BAL.top - 0.07, 0.1505); g.add(plate);
  shadows(g); g.traverse((o) => o.layers.enable(1));
  return { g, pivot, pans, big, chip, mus, c, tex, key: '' };
}
function drawBalance(B, L, R) {
  const key = L + '|' + R; if (key === B.key) return; B.key = key;
  const x = B.c.getContext('2d'), w = B.c.width, h = B.c.height; x.fillStyle = '#0d0e10'; x.fillRect(0, 0, w, h);
  txt(x, L, w * 0.25, h / 2, { font: '600 38px "Geist Mono"', color: '#d5d8dd', track: 6, maxW: w * 0.44 }); txt(x, R, w * 0.75, h / 2, { font: '600 38px "Geist Mono"', color: '#d5d8dd', track: 6, maxW: w * 0.44 });
  x.fillStyle = 'rgba(213,216,221,0.25)'; x.fillRect(w / 2 - 1, 30, 2, h - 60); B.tex.needsUpdate = true;
}
// two rows of gummy bottles (two lab tests: 9 brands, 12 brands); a scan finds almost no creatine in 5 of each
const FAIL = [[1, 3, 4, 6, 8], [0, 2, 5, 7, 9]];
const SCAN0 = 58.22, SCAN_D = 1.75;   // the scan runs left to right across both rows (the sound uses the same times)
function makeGummies(scene) {
  const g = new THREE.Group(); g.position.set(GSHELF.x, 0, GSHELF.z); scene.add(g);
  const steel = phys({ color: 0x1c1e22, roughness: 0.5, metalness: 0.4 });
  for (const y of GSHELF.y) { const b = new THREE.Mesh(new THREE.BoxGeometry(GSHELF.w + 0.04, 0.02, 0.2), steel); b.position.set(0, y - 0.01, 0); g.add(b); }
  for (const sx of [-1, 1]) { const side = new THREE.Mesh(new THREE.BoxGeometry(0.02, GSHELF.y[1] + 0.25, 0.2), steel); side.position.set(sx * (GSHELF.w / 2 + 0.03), (GSHELF.y[1] + 0.25) / 2, 0); g.add(side); }
  const back = new THREE.Mesh(new THREE.BoxGeometry(GSHELF.w + 0.08, GSHELF.y[1] + 0.25, 0.012), steel); back.position.set(0, (GSHELF.y[1] + 0.25) / 2, -0.106); g.add(back);
  const cols = ['#ff4f7a', '#ffb627', '#36c9a0', '#7b61ff', '#ff7a3d', '#2fb8ff'];
  const jars = [];
  [9, 12].forEach((n, row) => {
    const pitch = GSHELF.w / n, y = GSHELF.y[row];
    for (let i = 0; i < n; i++) {
      const jx = -GSHELF.w / 2 + pitch * (i + 0.5), color = cols[(i + row * 2) % cols.length];
      const lab = canvasTex(256, 128, (x, w, h) => { x.fillStyle = '#f4f2ee'; x.fillRect(0, 0, w, h); x.fillStyle = color; x.fillRect(0, 0, w, 26); x.fillRect(0, h - 22, w, 22);
        txt(x, 'CREATINE', w / 2, 58, { font: '900 36px Archivo', color: '#17181c', track: 2, maxW: 120 }); txt(x, 'GUMMIES', w / 2, 90, { font: '800 22px Archivo', color: color, track: 4, maxW: 120 }); });
      const jar = new THREE.Group(); jar.position.set(jx, y, 0.02); g.add(jar);
      const r = Math.min(0.026, pitch * 0.4), hh = 0.075;
      const body = new THREE.Mesh(new THREE.CylinderGeometry(r, r, hh, 40, 1, true), new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.25, transmission: 0, transparent: true, opacity: 0.35, depthWrite: false, side: THREE.DoubleSide })); body.position.y = hh / 2; jar.add(body);
      const label = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.01, r * 1.01, hh * 0.5, 40, 1, true), phys({ map: lab, roughness: 0.4, clearcoat: 0.4 })); label.position.y = hh * 0.42; label.rotation.y = Math.PI; jar.add(label);
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.92, r * 0.92, 0.016, 32), phys({ color, roughness: 0.4, clearcoat: 0.5 })); cap.position.y = hh + 0.008; jar.add(cap);
      // the gummies inside (seen above the label), and the creatine in them: a white glow the scan reveals
      for (let k = 0; k < 7; k++) { const gm = new THREE.Mesh(new THREE.SphereGeometry(r * 0.32, 12, 8), phys({ color, roughness: 0.25, clearcoat: 0.6, transmission: 0 })); gm.scale.set(1, 1.25, 0.8); gm.position.set((hash(i * 7 + k + row * 50) - 0.5) * r * 1.1, hh * 0.72 + (hash(k * 3 + i + row) - 0.5) * hh * 0.18, (hash(k * 11 + i * 3 + row) - 0.5) * r * 1.1); jar.add(gm); }
      const glow = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.8, r * 0.8, hh * 0.85, 24), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffffff).multiplyScalar(1.2), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })); glow.position.y = hh * 0.47; jar.add(glow);
      jars.push({ jar, glow, row, i, fail: FAIL[row].includes(i), x: jx, y });
    }
  });
  const scan = new THREE.Mesh(new THREE.PlaneGeometry(0.012, 0.6), new THREE.MeshBasicMaterial({ color: new THREE.Color(0x9fdcff).multiplyScalar(1.4), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })); scan.position.set(0, (GSHELF.y[0] + GSHELF.y[1]) / 2 + 0.03, 0.06); g.add(scan);
  const plate = canvasTex(1024, 96, (x, w, h) => { x.fillStyle = '#1c1e22'; x.fillRect(0, 0, w, h); txt(x, 'TEST 2 · 12 BRANDS', w * 0.5, h / 2, { font: '600 40px "Geist Mono"', color: '#a6a9b0', track: 8 }); });
  const plate1 = canvasTex(1024, 96, (x, w, h) => { x.fillStyle = '#1c1e22'; x.fillRect(0, 0, w, h); txt(x, 'TEST 1 · 9 BRANDS', w * 0.5, h / 2, { font: '600 40px "Geist Mono"', color: '#a6a9b0', track: 8 }); });
  for (const [k, tex] of [[0, plate1], [1, plate]]) { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.028), new THREE.MeshBasicMaterial({ map: tex })); m.position.set(0, GSHELF.y[k] - 0.025, 0.1006); g.add(m); }
  shadows(g); g.traverse((o) => o.layers.enable(1));
  return { g, jars, scan };
}
// a blood tube in a little rack: a gold-top tube, a printed label
function makeTube(scene) {
  const g = new THREE.Group(); g.position.copy(TUBE); scene.add(g);
  const rack = new THREE.Mesh(new RoundedBoxGeometry(0.07, 0.04, 0.04, 3, 0.004), phys({ color: 0xe9ebee, roughness: 0.5 })); rack.position.y = 0.02; g.add(rack);
  const tube = new THREE.Group(); tube.position.y = 0.012; g.add(tube);
  const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.0078, 0.0078, 0.1, 32, 1, true), glassMat(0xe8f0ff, { alpha: 0.08, rim: 0.5 })); glass.position.y = 0.05; glass.renderOrder = 6; tube.add(glass);
  const bot = new THREE.Mesh(new THREE.SphereGeometry(0.0078, 24, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), phys({ color: 0x5b0d12, roughness: 0.2, clearcoat: 1 })); tube.add(bot);
  const blood = new THREE.Mesh(new THREE.CylinderGeometry(0.0074, 0.0074, 0.058, 32), phys({ color: 0x5b0d12, roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.08 })); blood.position.y = 0.029; tube.add(blood);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.0094, 0.0094, 0.02, 32), phys({ color: 0xd8a52c, roughness: 0.4 })); cap.position.y = 0.105; tube.add(cap);
  const lab = canvasTex(512, 256, (x, w, h) => { x.fillStyle = '#f7f6f2'; x.fillRect(0, 0, w, h); txt(x, 'CREATININE', w / 2, 80, { font: '800 64px Archivo', color: '#16181c', track: 4, maxW: 440 });
    for (let k = 0; k < 26; k++) { x.fillStyle = '#16181c'; x.fillRect(60 + k * 15, 140, hash(k) > 0.5 ? 6 : 3, 70); } });
  const label = new THREE.Mesh(new THREE.CylinderGeometry(0.0081, 0.0081, 0.05, 32, 1, true, -1.2, 2.4), phys({ map: lab, roughness: 0.6 })); label.position.y = 0.055; tube.add(label);
  shadows(g); glass.castShadow = false; g.traverse((o) => o.layers.enable(1));
  return { g };
}
// a plain black comb (the gag), held in the right hand
function makeComb() {
  const g = new THREE.Group(), m = phys({ color: 0x141518, roughness: 0.35, clearcoat: 0.6 });
  const spine = new THREE.Mesh(new RoundedBoxGeometry(0.15, 0.012, 0.004, 2, 0.002), m); g.add(spine);
  for (let k = 0; k < 30; k++) { const tooth = new THREE.Mesh(new THREE.BoxGeometry(0.0022, 0.02, 0.0035), m); tooth.position.set(-0.07 + k * 0.0047, -0.016, 0); g.add(tooth); }
  shadows(g); g.traverse((o) => o.layers.enable(1)); return g;
}
// the end dial on the table: grams a day the body makes, 0 to 5; the orange mark at 1
const ANG = (v) => ((-135 + 54 * v) * Math.PI) / 180;
function makeDial(scene) {
  const g = new THREE.Group(); g.position.copy(DIAL); scene.add(g);
  const dark = phys({ color: 0x121316, roughness: 0.38, clearcoat: 0.6, clearcoatRoughness: 0.25 }), alu = phys({ color: 0xcdcac4, metalness: 1, roughness: 0.3, clearcoat: 0.4 });
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(DIAL_R + 0.01, DIAL_R + 0.013, 0.012, 128), dark); plate.position.y = 0.006; g.add(plate);
  const bezel = new THREE.Mesh(new THREE.TorusGeometry(DIAL_R + 0.003, 0.003, 20, 160), alu); bezel.rotation.x = Math.PI / 2; bezel.position.y = 0.0125; g.add(bezel);
  const tex = canvasTex(1024, 1024, (x, w) => { const R = w / 2; x.fillStyle = '#0b0c0e'; x.fillRect(0, 0, w, w);
    for (let k = 0; k <= 25; k++) { const v = k / 5, a = ANG(v), big = k % 5 === 0, r0 = R * (big ? 0.78 : 0.83), r1 = R * 0.9; x.strokeStyle = big ? '#e7e9ec' : '#8d9097'; x.lineWidth = big ? 7 : 3.5; x.beginPath(); x.moveTo(R + Math.sin(a) * r0, R - Math.cos(a) * r0); x.lineTo(R + Math.sin(a) * r1, R - Math.cos(a) * r1); x.stroke();
      if (big) txt(x, String(v), R + Math.sin(a) * R * 0.64, R - Math.cos(a) * R * 0.64, { font: '600 74px Archivo', color: '#e7e9ec' }); }
    txt(x, 'GRAMS A DAY', R, R * 1.42, { font: '500 38px "Geist Mono"', color: '#9a9da4', track: 9 }); txt(x, 'YOUR BODY MAKES', R, R * 1.53, { font: '500 28px "Geist Mono"', color: '#6d7077', track: 7 }); });
  const faceMat = new THREE.MeshPhysicalMaterial({ map: tex, roughness: 0.42, clearcoat: 0.5, emissive: new THREE.Color(0xffffff), emissiveMap: tex, emissiveIntensity: 0.08, transparent: true });
  const face = new THREE.Mesh(new THREE.CircleGeometry(DIAL_R, 128), faceMat); face.rotation.x = -Math.PI / 2; face.position.y = 0.0122; g.add(face);
  const flat = new THREE.Group(); flat.rotation.x = -Math.PI / 2; flat.position.y = 0.0128; g.add(flat);
  const a1 = ANG(1), setM = new THREE.Mesh(new THREE.RingGeometry(DIAL_R * 0.905, DIAL_R * 0.965, 32, 1, Math.PI / 2 - a1 - 0.07, 0.14), new THREE.MeshBasicMaterial({ color: ORANGE.clone().multiplyScalar(1.6), transparent: true, opacity: 0, depthWrite: false })); flat.add(setM);
  const n = new THREE.Group(); n.position.y = 0.0135; g.add(n);
  const nmat = new THREE.MeshPhysicalMaterial({ color: 0xf2f3f5, roughness: 0.35, clearcoat: 0.6, emissive: new THREE.Color(0xffffff), emissiveIntensity: 0.25, transparent: true });
  const bar = new THREE.Mesh(new THREE.BoxGeometry(0.002, 0.0009, DIAL_R * 0.86), nmat); bar.position.z = -DIAL_R * 0.43 + 0.007; n.add(bar);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.0045, 0.0045, 0.002, 40), nmat); n.add(hub);
  const logo = makeLogoRing(LOGO_R); logo.g.rotation.x = -Math.PI / 2; logo.g.position.y = 0.0142; g.add(logo.g);
  shadows(g); face.castShadow = false; g.traverse((o) => o.layers.enable(1));
  return { g, faceMat, setM, n, nmat, logo };
}

// ------------------------------------------------------------------ hands (as in film 5), the dumbbell, rest geometry
const avgV = (a) => a.reduce((s, v) => s.add(v), new THREE.Vector3()).multiplyScalar(1 / Math.max(1, a.length));
function rigHand(R, Side) {
  const A = R.arms[Side], side = Side.toLowerCase(), eg = A.elbow, EL = A.EL, by = (n) => R.byName.get(n);
  const top = (m) => { const vs = worldVerts(m); let mx = -9, mn = 9; for (const v of vs) { mx = Math.max(mx, v.y); mn = Math.min(mn, v.y); } return avgV(vs.filter((v) => v.y > mx - 0.12 * (mx - mn))); };
  const bot = (m) => { const vs = worldVerts(m); let mx = -9, mn = 9; for (const v of vs) { mx = Math.max(mx, v.y); mn = Math.min(mn, v.y); } return avgV(vs.filter((v) => v.y < mn + 0.12 * (mx - mn))); };
  const F = ['index', 'middle', 'ring', 'little'].map((f) => ({ P: by(`Proximal phalanx of ${side} ${f} finger`), M: by(`Middle phalanx of ${side} ${f} finger`), D: by(`Distal phalanx of ${side} ${f} finger`) }));
  const mcpI = top(F[0].P), mcpL = top(F[3].P), fdir = bot(F[1].D).sub(top(F[1].P)).normalize();
  const across = mcpL.clone().sub(mcpI); across.sub(fdir.clone().multiplyScalar(across.dot(fdir))).normalize();
  const n = new THREE.Vector3().crossVectors(fdir, across).normalize(); if (n.z < 0) n.negate();
  const axis = new THREE.Vector3().crossVectors(fdir, n).dot(across) > 0 ? across.clone().negate() : across.clone();
  const joints = [];
  for (const f of F) { const pts = [top(f.P), top(f.M), top(f.D)], gs = []; let parent = eg, pp = EL;
    [f.P, f.M, f.D].forEach((m, i) => { const g = new THREE.Group(); g.position.copy(pts[i]).sub(pp); parent.add(g); m.parent.remove(m); m.position.copy(m.userData.home).sub(pts[i]); g.add(m); gs.push(g); parent = g; pp = pts[i]; }); joints.push(gs); }
  const tP = by(`Proximal phalanx of ${side} thumb`), tD = by(`Distal phalanx of ${side} thumb`), tpt = [top(tP), top(tD)];
  const ttip = bot(tD), tdir = ttip.clone().sub(tpt[0]).normalize(), aim = mcpI.clone().lerp(mcpL, 0.6).add(n.clone().multiplyScalar(0.03)).sub(ttip);
  const taxis = new THREE.Vector3().crossVectors(tdir, aim).normalize(), tg = [];
  { let parent = eg, pp = EL; [tP, tD].forEach((m, i) => { const g = new THREE.Group(); g.position.copy(tpt[i]).sub(pp); parent.add(g); m.parent.remove(m); m.position.copy(m.userData.home).sub(tpt[i]); g.add(m); tg.push(g); parent = g; pp = tpt[i]; }); }
  const mid = mcpI.clone().add(mcpL).multiplyScalar(0.5);
  const handle = mid.clone().addScaledVector(fdir, 0.03).addScaledVector(n, 0.024).sub(EL);
  function curl(k) {
    joints.forEach((gs, i) => { const s = 1 + 0.06 * i; gs[0].quaternion.setFromAxisAngle(axis, 1.25 * k * s); gs[1].quaternion.setFromAxisAngle(axis, 1.5 * k * s); gs[2].quaternion.setFromAxisAngle(axis, 0.95 * k * s); });
    tg[0].quaternion.setFromAxisAngle(taxis, 0.55 * k); tg[1].quaternion.setFromAxisAngle(taxis, 0.7 * k);
  }
  return { curl, handle, across: across.clone(), n: n.clone(), fdir: fdir.clone(), eg };
}
function makeDumbbell() {
  const g = new THREE.Group(), rubber = phys({ color: 0x17181b, roughness: 0.62, clearcoat: 0.25, clearcoatRoughness: 0.5 }), chrome = phys({ color: 0xd0d3d8, metalness: 1, roughness: 0.24, clearcoat: 0.4 });
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.0145, 0.0145, 0.135, 32), chrome); handle.rotation.z = Math.PI / 2; g.add(handle);
  for (const s of [-1, 1]) { const head = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.07, 6), rubber); head.rotation.z = Math.PI / 2; head.position.x = s * 0.1025; g.add(head);
    const coll = new THREE.Mesh(new THREE.CylinderGeometry(0.021, 0.021, 0.008, 32), chrome); coll.rotation.z = Math.PI / 2; coll.position.x = s * 0.064; g.add(coll); }
  shadows(g); g.traverse((o) => o.layers.enable(1)); return g;
}
function restGeo(m) {
  const g = new THREE.BufferGeometry(), h = m.userData.home, P = m.geometry.attributes.position, N = m.geometry.attributes.normal;
  const p = new Float32Array(P.count * 3), n = new Float32Array(P.count * 3);
  for (let i = 0; i < P.count; i++) { p[i * 3] = P.getX(i) + h.x; p[i * 3 + 1] = P.getY(i) + h.y; p[i * 3 + 2] = P.getZ(i) + h.z; n[i * 3] = N.getX(i); n[i * 3 + 1] = N.getY(i); n[i * 3 + 2] = N.getZ(i); }
  g.setAttribute('position', new THREE.BufferAttribute(p, 3)); g.setAttribute('normal', new THREE.BufferAttribute(n, 3)); g.setIndex(m.geometry.index.clone());
  return g;
}
function legBinder(R, Side) { const G = R.legs[Side]; return (p) => (p.y > G.K.y + 0.05 ? [R.pelvis, G.hip, ss(G.H.y + 0.07, G.H.y - 0.05, p.y)] : [G.hip, G.knee, ss(G.K.y + 0.05, G.K.y - 0.03, p.y)]); }
// the store inside a muscle: specks of light, as many as the store holds (k), white (or blue: water)
function storeMat() {
  return new THREE.ShaderMaterial({
    uniforms: { uK: { value: 0 }, uO: { value: 0 }, uW: { value: 0 }, uT: { value: 0 } },
    vertexShader: 'attribute vec3 rest; varying vec3 vR; varying vec3 vN; varying vec3 vV; void main(){ vR = rest; vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }',
    fragmentShader: `uniform float uK, uO, uW, uT; varying vec3 vR; varying vec3 vN; varying vec3 vV;
      float h3(vec3 p){ return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
      void main(){
        vec3 q = vR * 160.0; vec3 c = floor(q); vec3 f = fract(q) - 0.5;
        float r = h3(c), on = step(r, uK * 0.55);
        float tw = 0.6 + 0.4 * sin(uT * 3.0 + r * 40.0);
        float speck = on * smoothstep(0.32, 0.0, length(f)) * tw;
        float rim = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.0);
        vec3 col = mix(vec3(1.0, 0.98, 0.94), vec3(0.45, 0.68, 1.0), uW);
        gl_FragColor = vec4(col * (0.9 + speck * 1.6), (speck * 0.9 + rim * 0.06 * uK) * uO);
      }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
}

// ------------------------------------------------------------------ build
async function build(S, cfg) {
  const scene = S.scene;
  S.fog.near = 4; S.fog.far = 14;
  S.table.scale.set(3, 3, 1); S.tableMat.clearcoat = 0.06; S.tableMat.specularIntensity = 0.3;
  for (const m of [S.tableMat.map, S.tableMat.roughnessMap]) if (m) { m.wrapS = m.wrapT = THREE.RepeatWrapping; m.repeat.multiplyScalar(3); }
  W.cfg = cfg;
  // ---- the skeleton, its kidneys and brain (hidden until their moments), standing on the scale
  const KID = /^(left|right) kidney$/i, BRAIN = /gyrus|lobe\b|lobule|cerebellum|^pons$|^midbrain$|medulla oblongata|insula|white matter of|corpus callosum|thalamus$/i;
  const meshes = await loadAnatomy(skeletonKind((p) => (KID.test(p.name) ? 'kidney' : p.system === 'nervous' && BRAIN.test(p.name) && !/artery/i.test(p.name) ? 'brain' : undefined)));
  W.rig = buildRig(meshes, { assign: (n) => (/kidney/i.test(n) ? 'Second lumbar vertebra' : null) });
  scene.add(W.rig.root);
  const R = W.rig;
  for (const m of meshes) { m.castShadow = true; m.receiveShadow = true; m.layers.enable(1); }
  W.kidneys = meshes.filter((m) => m.userData.tissue === 'kidney');
  for (const m of W.kidneys) { m.material.transparent = true; m.material.opacity = 0; m.visible = false; m.castShadow = false; m.material.emissive.set(0xff8a6a); }
  W.brain = meshes.filter((m) => m.userData.tissue === 'brain');
  W.brainMat = tissueMat('brain', { transparent: true, opacity: 0 }); W.brainMat.emissive.set(0xfff0e6);
  for (const m of W.brain) { m.material = W.brainMat; m.visible = false; m.castShadow = false; }
  W.skull = meshes.filter((m) => /frontal bone|parietal bone|occipital bone|temporal bone|sphenoid bone|^ethmoid$|zygomatic|nasal bone|maxilla|lacrimal|palatine|vomer|nasal concha/i.test(m.userData.name));
  for (const m of W.skull) { m.material = m.material.clone(); m.material.transparent = true; }
  const ground = Math.min(R.legs.Right.ground, R.legs.Left.ground);
  R.root.position.y = SCALE.h - ground;
  const heelZ = Math.min(R.legs.Right.heel.z, R.legs.Left.heel.z), toeZ = Math.max(R.legs.Right.toeZ, R.legs.Left.toeZ);
  W.scaleZ = (heelZ + toeZ) / 2 - 0.005;
  // ---- the muscles of the arms and thighs, and the store inside them
  const ARMM = /(biceps brachii|brachialis|triceps brachii|deltoid|brachioradialis|flexor carpi|extensor carpi radialis)/i, LEGM = /^(left|right) (vastus lateralis|vastus medialis|rectus femoris|sartorius)$|^long head of (left|right) biceps femoris$/i;
  const soft = await loadAnatomy((p) => ((ARMM.test(p.name) && /\b(right|left)\b/i.test(p.name)) || LEGM.test(p.name) ? 'muscle' : null));
  W.musMat = tissueMat('muscle', { transparent: true, opacity: 0, color: new THREE.Color(0x5e2024), sheen: 0.25, clearcoat: 0.1 }); W.storeMat = storeMat(); W.skins = [];
  for (const m of soft) {
    const Side = /\bright\b/i.test(m.userData.name) ? 'Right' : 'Left', isLeg = LEGM.test(m.userData.name), bind = isLeg ? legBinder(R, Side) : armBinder(R, Side);
    const mu = skinned(restGeo(m), bind, R, W.musMat); mu.mesh.castShadow = mu.mesh.receiveShadow = true; mu.mesh.layers.enable(1); scene.add(mu.mesh); W.skins.push(mu);
    const st = skinned(restGeo(m), bind, R, W.storeMat); st.mesh.renderOrder = 4; scene.add(st.mesh); W.skins.push(st); st.arm = !isLeg && Side === 'Left';
  }
  // ---- hands: the left holds a dumbbell, the right a comb (for its moment)
  W.handL = rigHand(R, 'Left'); W.handR = rigHand(R, 'Right');
  W.db = makeDumbbell(); W.db.matrixAutoUpdate = false; scene.add(W.db);
  W.db.userData.hm = new THREE.Matrix4().compose(W.handL.handle, new THREE.Quaternion().setFromUnitVectors(X, W.handL.across), new THREE.Vector3(1, 1, 1));
  W.comb = makeComb(); W.comb.matrixAutoUpdate = false; scene.add(W.comb);
  { const H = W.handR, yAx = H.n.clone().negate(), zAx = new THREE.Vector3().crossVectors(H.across, yAx).normalize();   // the spine across the knuckles, the teeth out of the palm
    W.comb.userData.hm = new THREE.Matrix4().makeBasis(H.across, yAx, zAx).setPosition(H.handle.clone().addScaledVector(H.n, 0.006)); }
  // the comb's poses: the right hand over the crown of the skull, the teeth on it, at the front and at the back (solved once)
  R.root.updateMatrixWorld(true);
  const crown = (dz) => wpS(R.seg.Atlas.g, R.seg.Atlas.pivot.clone().add(new THREE.Vector3(-0.012, 0.2, dz))), DOWN = new THREE.Vector3(0, -1, 0);
  W.combFront = solveHand(R, 'Right', W.handR, crown(0.045), { dir: [0.45, 0.75, 0.5], twist: 0, elbow: 1.6 }, DOWN, Z);
  W.combBack = solveHand(R, 'Right', W.handR, crown(-0.06), W.combFront, DOWN, Z);
  W.combPose = W.combFront;
  // ---- the factory stamp: printed down the front of the left shin bone
  { const tib = R.byName.get('Left tibia');
    W.stampSpot = stampLine(tib, { a: [0.15, 0.09, 0.26], b: [0.15, -0.07, 0.26], dir: [-0.5, 0, -0.87], top: [1, 0, 0] });
    if (W.stampSpot) W.stamp = stamp(tib, { canvas: labelCanvas('HUMAN FACTORY SETTINGS'), center: W.stampSpot.center, normal: W.stampSpot.normal, up: W.stampSpot.up, width: 0.13, depth: 0.03, opacity: 0.6 }); }
  // ---- the set
  W.bath = makeBathScale(); W.bath.g.position.set(0, 0, W.scaleZ); scene.add(W.bath.g);
  makeTable(scene, TABLE);
  W.tub = makeTub(); W.tub.g.position.copy(TUB); scene.add(W.tub.g);
  W.mol = makeMolecule(); W.mol.position.set(TUB.x - 0.02, TABLE.top + 0.33, TUB.z + 0.02); scene.add(W.mol);
  W.card = new THREE.Mesh(new THREE.PlaneGeometry(0.17, 0.113), new THREE.MeshBasicMaterial({ map: steroidCard(), transparent: true, opacity: 0, depthWrite: false })); W.card.position.set(TUB.x + 0.155, TABLE.top + 0.31, TUB.z - 0.04); W.card.rotation.y = 0.55; scene.add(W.card);
  W.ks = makeKitchenScale(); W.ks.g.position.copy(KS); W.ks.g.rotation.y = -0.3; scene.add(W.ks.g);
  W.gauge = makeGauge(scene); W.bal = makeBalance(scene); W.gum = makeGummies(scene); W.tube = makeTube(scene); W.dial = makeDial(scene);
  // ---- light
  W.key = spot(scene, { color: 0xffe9d2, pos: new THREE.Vector3(-1.1, 3.1, 1.9), target: new THREE.Vector3(0.1, 0.8, 0.1), angle: 0.55, penumbra: 0.85, shadow: true, size: cfg.shadow ?? 1024 });
  W.key.shadow.camera.far = 7;
  W.rim = spot(scene, { color: 0xa9c4ff, pos: new THREE.Vector3(1.5, 2.3, -1.9), target: new THREE.Vector3(0.1, 0.9, 0), angle: 0.6, penumbra: 0.9 });
  W.fill = spot(scene, { color: 0xc8d6ff, pos: new THREE.Vector3(-1.9, 0.9, 1.7), target: new THREE.Vector3(0.1, 0.7, 0.1), angle: 0.7, penumbra: 1 });
  W.tableLight = spot(scene, { color: 0xfff1d8, pos: new THREE.Vector3(1.1, 2.2, 0.9), target: new THREE.Vector3(TABLE.x, TABLE.top + 0.1, TABLE.z), angle: 0.32, penumbra: 0.7 });
  W.balLight = spot(scene, { color: 0xfff1d8, pos: new THREE.Vector3(0.5, 2.3, 2.1), target: new THREE.Vector3(BAL.x, BAL.top + 0.25, BAL.z), angle: 0.32, penumbra: 0.7 });
  W.gumLight = spot(scene, { color: 0xfff1d8, pos: new THREE.Vector3(-0.4, 2.2, 1.3), target: new THREE.Vector3(GSHELF.x, 1.1, GSHELF.z), angle: 0.34, penumbra: 0.7 });
  return { stamp: W.stampSpot, scaleZ: W.scaleZ, brain: W.brain.length, kidneys: W.kidneys.length, comb: W.combPose && W.combPose.err };
}
function wpS(group, p) { return p.clone().sub(W.rig.pivots.get(group)).applyMatrix4(group.matrixWorld); }
function solveHand(R, Side, H, at, init, palm = null, fingers = null) {   // a pose for one arm that puts the hand's grip at a world point (standing, at rest), its palm facing a way
  R.root.updateMatrixWorld(true);
  const A = R.arms[Side], h = new THREE.Vector3(), q = new THREE.Quaternion(), pn = new THREE.Vector3();
  const err = (p) => { poseArm(A, p); A.girdle.updateMatrixWorld(true); h.copy(H.handle).applyMatrix4(A.elbow.matrixWorld); let E = h.distanceTo(at);
    if (palm || fingers) A.elbow.getWorldQuaternion(q);
    if (palm) { pn.copy(H.n).applyQuaternion(q); E += 0.06 * (1 - pn.dot(palm)); }
    if (fingers) { pn.copy(H.fdir).applyQuaternion(q); E += 0.04 * (1 - pn.dot(fingers)); } return E; };
  const descend = (start) => {
    let best = { dir: [...start.dir], twist: start.twist, elbow: start.elbow, retract: 0, elevate: 0 }, bestE = err(best);
    for (const st of [0.25, 0.12, 0.06, 0.03, 0.015, 0.007]) for (let it = 0; it < 40; it++) {
      let improved = false;
      for (const key of ['d0', 'd1', 'd2', 'twist', 'elbow']) for (const sg of [-1, 1]) {
        const c = { ...best, dir: [...best.dir] }; if (key[0] === 'd') c.dir[+key[1]] += sg * st; else c[key] += sg * st * 2; c.elbow = Math.min(2.6, Math.max(0, c.elbow));
        const E = err(c); if (E < bestE) { bestE = E; best = c; improved = true; }
      }
      if (!improved) break;
    }
    return { best, bestE };
  };
  let out = descend(init);
  for (const dir of [[0.6, 0.8, 0.2], [0.35, 0.7, 0.45], [0.9, 0.35, 0.1], [0.5, 0.5, -0.3]]) for (const twist of [-1.2, -0.4, 0.4, 1.2]) for (const elbow of [1.3, 1.9, 2.4]) {
    if (out.bestE < 0.004) break; const r = descend({ dir, twist, elbow }); if (r.bestE < out.bestE) out = r; }
  poseArm(A, { dir: [0.03, -1, 0], twist: 0, elbow: 0.08 });
  return { ...out.best, err: out.bestE };
}

// ------------------------------------------------------------------ the body over time
const mixArm = (a, b, k) => ({ dir: a.dir.map((v, i) => lerp(v, b.dir[i], k)), twist: lerp(a.twist, b.twist, k), elbow: lerp(a.elbow, b.elbow, k), retract: 0, elevate: 0 });
const ARM_R = { dir: [0.03, -1, 0], twist: 0, elbow: 0.08 };
const CURL = { t0: 10.0, up: 0.55, hold: 0.12, down: 0.75 };                // one short, hard curl on "refuels short, hard efforts"
function curlAt(t) { const u = t - CURL.t0; if (u < 0 || u > CURL.up + CURL.hold + CURL.down) return 0; if (u < CURL.up) return s5(0, CURL.up, u); if (u < CURL.up + CURL.hold) return 1; return 1 - s5(CURL.up + CURL.hold, CURL.up + CURL.hold + CURL.down, u); }
const COMB = { up0: 47.2, up1: 48.3, strokes: [48.6, 49.35, 50.1, 50.85, 51.6], down0: 52.4, down1: 53.4 };
function combAt(t) {   // 0 = arm at the side, 1 = the comb on the crown; the strokes run front to back
  const k = s5(COMB.up0, COMB.up1, t) * (1 - s5(COMB.down0, COMB.down1, t));
  let stroke = 0; for (const s of COMB.strokes) { const u = (t - s) / 0.75; if (u >= 0 && u < 1) stroke = u < 0.7 ? s5(0, 0.7, u) : 1 - s5(0.7, 1, u); }
  return { k, stroke };
}
function poseBody(t) {
  const R = W.rig;
  R.pelvis.position.copy(R.P0); R.pelvis.rotation.set(0, 0, 0);
  bendSpine(R.seg, { tho: 0.02, cer: 0.02 + 0.06 * pulse(t, 39.6, 45.0, 0.6) });
  for (const Side of ['Right', 'Left']) { const G = R.legs[Side]; G.hip.quaternion.identity(); G.knee.quaternion.identity(); G.ankle.quaternion.identity(); }
  // the left arm holds the dumbbell at its side; one hard curl
  const c = curlAt(t); poseArm(R.arms.Left, { dir: [0.09, -1, 0.04 + 0.15 * c], twist: 0, elbow: 0.2 + 1.95 * c }); W.handL.curl(1);
  // the right arm: at its side, or combing the crown of its skull
  const cb = combAt(t); const p = mixArm(ARM_R, mixArm(W.combFront, W.combBack, cb.stroke), cb.k);
  poseArm(R.arms.Right, p); W.handR.curl(0.9 * s5(COMB.up0 - 0.3, COMB.up0, t) * (1 - s5(COMB.down1, COMB.down1 + 0.3, t)));
  R.root.updateMatrixWorld(true);
  W.db.matrix.multiplyMatrices(R.arms.Left.elbow.matrixWorld, W.db.userData.hm); W.db.matrixWorldNeedsUpdate = true;
  const combOn = s5(COMB.up0 - 0.4, COMB.up0, t) * (1 - s5(COMB.down1, COMB.down1 + 0.3, t)); W.comb.visible = combOn > 0.01;
  W.comb.matrix.multiplyMatrices(R.arms.Right.elbow.matrixWorld, W.comb.userData.hm); W.comb.matrixWorldNeedsUpdate = true;
  return { c, cb };
}

// ------------------------------------------------------------------ the camera: one path, no cuts
let CAM = null;
function buildCam() {
  const Tb = TUB, B = BAL, G = GSHELF, D = DIAL, Z0 = W.scaleZ;
  return camTrack([
    { t: -3.0, p: V3(1.0, 1.18, 0.66), l: V3(0.53, 1.0, -0.06), fov: 30 },
    { t: 0.0, p: V3(0.98, 1.16, 0.64), l: V3(0.53, 1.02, -0.06), fov: 30, tens: 0.5 },                       // the tub; the molecule; a steroid
    { t: 2.6, p: V3(0.99, 1.16, 0.7), l: V3(0.6, 1.09, -0.09), fov: 30, tens: 0.4 },
    { t: 3.9, p: V3(0.66, 0.97, 0.52), l: V3(KS.x - 0.03, KS.y + 0.012, KS.z + 0.07), fov: 28, tens: 0.2 },  // a gram a day
    { t: 5.8, p: V3(0.65, 0.96, 0.5), l: V3(KS.x - 0.03, KS.y + 0.012, KS.z + 0.07), fov: 28, tens: 0.4 },
    { t: 7.6, p: V3(-0.12, 1.22, 2.25), l: V3(0.02, 0.98, Z0), fov: 34, tens: 0.2 },                          // the muscles; a hard curl
    { t: 12.2, p: V3(-0.13, 1.2, 2.2), l: V3(0.04, 0.96, Z0), fov: 34, tens: 0.4 },
    { t: 13.8, p: V3(-0.32, 1.12, 1.75), l: V3(-0.2, 0.92, 0.12), fov: 32, tens: 0.2 },                      // the gauge: 20 to 40% more
    { t: 16.8, p: V3(-0.31, 1.11, 1.72), l: V3(-0.2, 0.93, 0.12), fov: 32, tens: 0.4 },
    { t: 18.4, p: V3(B.x + 0.05, 1.32, B.z + 1.42), l: V3(B.x, B.top + 0.2, B.z), fov: 32, tens: 0.2 },                 // the balance: 1.1 kg
    { t: 24.6, p: V3(B.x + 0.04, 1.3, B.z + 1.38), l: V3(B.x, B.top + 0.2, B.z), fov: 32, tens: 0.3 },
    { t: 26.4, p: V3(B.x + 0.02, 1.27, B.z + 1.34), l: V3(B.x - 0.03, B.top + 0.19, B.z), fov: 32, tens: 0.3 },           // 30 g
    { t: 32.6, p: V3(B.x + 0.01, 1.25, B.z + 1.3), l: V3(B.x - 0.03, B.top + 0.19, B.z), fov: 32, tens: 0.3 },
    { t: 34.2, p: V3(0.3, 0.5, Z0 + 1.2), l: V3(0.03, 0.3, Z0 + 0.06), fov: 34, tens: 0.2 },                  // the scale, the water
    { t: 38.8, p: V3(0.3, 0.52, Z0 + 1.18), l: V3(0.03, 0.32, Z0 + 0.06), fov: 34, tens: 0.4 },
    { t: 40.0, p: V3(0.24, 1.72, 0.82), l: V3(0.0, 1.66, Z0 - 0.02), fov: 30, tens: 0.2 },                   // the brain
    { t: 45.4, p: V3(0.25, 1.71, 0.8), l: V3(0.0, 1.66, Z0 - 0.02), fov: 30, tens: 0.3 },
    { t: 47.4, p: V3(-0.78, 1.64, Z0 + 0.9), l: V3(0.0, 1.84, Z0), fov: 34, tens: 0.3 },                           // the comb, the bald skull
    { t: 55.4, p: V3(-0.75, 1.62, Z0 + 0.88), l: V3(0.0, 1.82, Z0), fov: 34, tens: 0.3 },
    { t: 57.2, p: V3(-0.5, 1.08, 1.12), l: V3(G.x, 0.96, G.z), fov: 32, tens: 0.2 },                         // gummies: two tests
    { t: 62.9, p: V3(-0.49, 1.07, 1.1), l: V3(G.x, 0.96, G.z), fov: 32, tens: 0.3 },
    { t: 64.4, p: V3(0.98, 0.98, 0.42), l: V3(TUBE.x - 0.03, TUBE.y + 0.06, TUBE.z), fov: 28, tens: 0.2 },  // creatinine: the tube
    { t: 68.6, p: V3(0.96, 0.97, 0.4), l: V3(TUBE.x - 0.03, TUBE.y + 0.06, TUBE.z), fov: 28, tens: 0.3 },
    { t: 70.2, p: V3(-0.18, 1.12, 1.25), l: V3(0.0, 1.06, Z0 - 0.08), fov: 32, tens: 0.2 },                  // the kidneys; ask your doctor
    { t: 74.4, p: V3(-0.17, 1.1, 1.22), l: V3(0.0, 1.05, Z0 - 0.08), fov: 32, tens: 0.3 },
    { t: 75.8, p: V3(0.86, 1.18, 0.6), l: V3(D.x, D.y + 0.01, D.z), fov: 30 },
    { t: T.logo, p: V3(D.x, D.y + 0.5, D.z + 0.005), l: V3(D.x, D.y + 0.0142, D.z), fov: 30, stop: true },   // straight down on the dial: the logo
  ]);
}
function camPose(S, t) {
  const v = S.cfg.view; if (v && typeof v === 'object') return v;
  if (!CAM) CAM = buildCam();
  if (t <= T.logo) return CAM(t);
  const Q = CAM(T.logo), k = ss(T.logo, T.end, t); return { p: [Q.p[0], lerp(Q.p[1], Q.p[1] - 0.04, k), Q.p[2]], l: Q.l, fov: 30 };
}
function focusAt(S, t, P) { return Math.hypot(P.p[0] - P.l[0], P.p[1] - P.l[1], P.p[2] - P.l[2]); }

// ------------------------------------------------------------------ one moment of the film
function update(S, t) {
  const scene = S.scene, endDark = ss(T.factory - 0.5, T.logo - 0.3, t);
  const o = poseBody(t);
  // ---- the molecule and the steroid card
  { const k = s5(T.creatine - 0.2, T.creatine + 1.0, t) * (1 - s5(5.4, 6.4, t)); W.mol.visible = k > 0.002;
    W.mol.position.y = TABLE.top + 0.24 + 0.09 * s5(T.creatine - 0.2, T.creatine + 1.2, t); W.mol.rotation.set(0.25 * Math.sin(t * 0.5), t * 0.45, 0.1);
    for (const m of W.mol.userData.mats) { m.opacity = k; m.depthWrite = k > 0.6; }
    W.card.material.opacity = s5(T.not - 0.1, T.steroid + 0.3, t) * (1 - s5(5.4, 6.4, t)); W.card.visible = W.card.material.opacity > 0.002; }
  // ---- the kitchen scale: a gram
  { const on = s5(T.makes, T.gram + 0.1, t); W.ks.heap.visible = on > 0.01; W.ks.heap.scale.setScalar(Math.max(0.01, on)); drawKitchen(W.ks, on > 0.5 ? 1 : 0); }
  // ---- the muscles and their store
  { const vis = s5(T.about - 0.2, T.ninety + 0.3, t) * (1 - s5(39.0, 39.8, t)), visK = Math.max(vis, pulse(t, 63.0, 75.0, 0.6) * 0);
    const show = vis > 0.002; for (const sk of W.skins) { sk.mesh.visible = show; if (show) sk.update(); }
    W.musMat.opacity = 0.75 * vis; W.musMat.depthWrite = vis > 0.6;
    // the store: full (1), spent by the curl and refilled; topped up 30% (the middle of 20 to 40) by supplements; water turns it blue
    const spend = Math.max(0, curlAt(t)) * 0.75, refill = s5(CURL.t0 + 1.4, CURL.t0 + 3.0, t), base = 1 - spend * (1 - refill) * (t < CURL.t0 + 3.0 ? 1 : 0);
    const top = 0.3 * s5(T.top, T.percent + 0.4, t);
    W.storeMat.uniforms.uK.value = Math.max(0, base) + top; W.storeMat.uniforms.uO.value = vis; W.storeMat.uniforms.uT.value = t;
    W.storeMat.uniforms.uW.value = s5(T.mostly - 0.3, T.water + 0.4, t); W.storeMat.uniforms.uK.value += 0.25 * s5(T.up, T.two + 0.4, t); }
  // ---- the gauge: 100%, then 120 to 140
  { const Gg = W.gauge, k = 1 + 0.3 * s5(T.top, T.percent + 0.4, t), y = Gg.level(k), on = s5(T.supplements - 0.6, T.supplements, t);
    Gg.g.visible = t > T.supplements - 1.2; Gg.fill.scale.y = Math.max(0.001, y - Gg.H0); Gg.fill.position.y = (Gg.H0 + y) / 2; Gg.fillM.opacity = 0.92 * on;
    const b0 = Gg.level(1.2), b1 = Gg.level(1.4); Gg.band.scale.y = b1 - b0; Gg.band.position.y = (b0 + b1) / 2; Gg.band.material.opacity = 0.45 * s5(T.twenty - 0.2, T.forty + 0.3, t) * on; Gg.mark.position.y = Gg.level(1); }
  // ---- the balance: lifting with creatine against lifting alone (1.1 kg); then without lifting (30 g)
  { const B = W.bal, phase2 = t > 25.2;
    drawBalance(B, phase2 ? 'CREATINE, NO LIFTING' : 'LIFTING + CREATINE', phase2 ? 'NOTHING' : 'LIFTING ALONE');
    const bigIn = s5(T.added - 0.2, T.kilo, t) * (1 - s5(24.9, 25.4, t)), chipIn = s5(T.zero - 0.3, T.three + 0.2, t);
    B.big.visible = bigIn > 0.002; B.big.scale.setScalar(Math.max(0.01, bigIn)); B.big.position.y = -0.19 + 0.004 + 0.0505 * bigIn + 0.25 * (1 - bigIn);
    B.chip.visible = chipIn > 0.002; B.chip.position.y = -0.19 + 0.004 + 0.015 + 0.2 * (1 - chipIn);
    const tilt = 0.24 * bigIn + 0.014 * chipIn; B.pivot.rotation.z = tilt; for (const P of B.pans) P.hook.rotation.z = -tilt; }
  // ---- the bathroom scale: up 1 to 2 kg (shown as a change)
  { const on = s5(T.first - 0.3, T.scale, t) * (1 - s5(39.0, 39.6, t)), k = s5(T.up, T.two + 0.3, t);
    drawBath(W.bath, on > 0.01 ? (k < 0.5 ? '+1.' : '+2.') : '', on); }
  // ---- the brain: a little light for memory; then it fades (no proof for dementia)
  { const on = pulse(t, T.memory - 0.4, T.dementia + 0.9, 0.5); W.brainMat.opacity = 0.9 * on; for (const m of W.brain) m.visible = on > 0.002;
    W.brainMat.emissiveIntensity = 0.35 * s5(T.small, T.gain + 0.4, t) * (1 - s5(T.no, T.proof + 0.3, t));
    for (const m of W.skull) { m.material.opacity = 1 - 0.78 * on; m.material.depthWrite = on < 0.5; } }
  // ---- the gummies: a scan along each row; most glow with creatine, five in each row stay dark
  { const Gm = W.gum, sx = -GSHELF.w / 2 + GSHELF.w * clamp01((t - SCAN0) / SCAN_D);   // one scan bar across both rows
    Gm.scan.material.opacity = 0.9 * pulse(t, SCAN0 - 0.1, SCAN0 + SCAN_D + 0.1, 0.2); Gm.scan.position.x = sx;
    for (const J of Gm.jars) { const passed = clamp01((sx - J.x) / 0.04); J.glow.material.opacity = J.fail ? 0 : 0.35 * passed * (1 - ss(63.2, 63.8, t)); } }
  // ---- the kidneys: shown, quietly, for the last lines
  { const on = s5(T.kidney - 0.3, T.kidney + 0.4, t) * (1 - s5(T.back - 0.6, T.back, t)); for (const m of W.kidneys) { m.visible = on > 0.002; m.material.opacity = 0.9 * on; m.material.emissiveIntensity = 0.12 * on; } }
  // ---- the end dial: rises at the end, turns to 1 g; the logo
  { const D = W.dial, up = s5(T.back - 0.6, T.back + 0.3, t); D.g.position.y = DIAL.y - 0.03 * (1 - up); D.g.visible = up > 0.001;
    D.n.rotation.y = -ANG(lerp(0, 1, s5(T.back, T.settings, t))); D.nmat.opacity = 1 - ss(T.logo - 0.6, T.logo - 0.2, t);
    D.setM.material.opacity = ss(T.settings - 0.2, T.settings + 0.3, t) * (1 - ss(T.logo - 0.6, T.logo - 0.2, t)); D.faceMat.opacity = 1 - 0.85 * ss(T.settings, T.logo - 0.2, t);
    const lk = s5(T.back + 0.4, T.logo - 0.25, t); D.logo.set({ weight: lk, white: lk, hours: 0, hand: ss(T.logo - 0.4, T.logo - 0.15, t), handScale: outBack(clamp01((t - (T.logo - 0.4)) / 0.35), 1.8) }); }
  // ---- light
  const fig = 1 - endDark;
  W.key.intensity = 15 * fig; W.rim.intensity = 3.0 * fig; W.fill.intensity = 1.1 * fig;
  W.tableLight.intensity = 5 * fig; W.balLight.intensity = 5 * ss(T.trials - 0.8, T.trials, t) * (1 - ss(33.4, 34.2, t)) * fig; W.gumLight.intensity = 5 * ss(55.8, 56.6, t) * (1 - ss(63.4, 64.2, t)) * fig;
  S.tableMat.color.setScalar(0.35 * (1 - endDark * 0.9)); scene.environmentIntensity = 0.12 * (1 - endDark); S.reflAmt = 0.6 * (1 - endDark);
}

// ------------------------------------------------------------------ the words on screen
const CAPS = [
  { t0: 0.35, t1: 1.65, top: 300, size: 104, html: '<em>Creatine.</em>' },
  { t0: 1.77, t1: 2.85, top: 300, size: 96, html: 'Not a <em>steroid.</em>' },
  { t0: 2.92, t1: 6.1, top: 292, size: 80, html: 'Your body makes about<br><em>a gram of it a day</em>' },
  { t0: 6.42, t1: 9.3, top: 292, size: 80, html: 'About <em>95%</em> sits<br>in your muscles' },
  { t0: 9.42, t1: 12.6, top: 292, size: 80, html: 'where it refuels<br><em>short, hard efforts</em>' },
  { t0: 13.13, t1: 17.0, top: 292, size: 80, html: 'Supplements top up that<br>store by <em>20 to 40%</em>' },
  { t0: 17.49, t1: 25.2, top: 292, size: 74, html: 'In trials, lifting while<br>taking it added <em>a little</em><br><em>over a kilo</em> more lean<br>mass than lifting alone' },
  { t0: 25.6, t1: 30.4, top: 292, size: 78, html: 'Take it without<br>exercising: <em>0.03 kilos</em>' },
  { t0: 30.79, t1: 33.2, top: 292, size: 84, html: 'It doesn&rsquo;t do<br>the <em>workout</em> for you' },
  { t0: 33.58, t1: 39.0, top: 292, size: 78, html: 'In the first weeks,<br>the scale can go up<br><em>1 to 2 kilos</em>.<br>Mostly water.' },
  { t0: 39.44, t1: 42.2, top: 292, size: 84, html: 'For memory, a <em>small gain</em><br>in trials' },
  { t0: 42.49, t1: 45.6, top: 292, size: 80, html: 'No proof it prevents<br>or treats <em>dementia</em>' },
  { t0: 46.08, t1: 52.2, top: 292, size: 74, html: 'The hair loss scare:<br>one study of 20 rugby<br>players that <em>never</em><br><em>measured hair</em>' },
  { t0: 52.43, t1: 55.8, top: 292, size: 78, html: 'A 12-week trial that did<br>found <em>no difference</em>' },
  { t0: 56.35, t1: 57.45, top: 300, size: 100, html: '<em>Gummies?</em>' },
  { t0: 57.59, t1: 63.2, top: 292, size: 74, html: 'In two lab tests,<br>close to half the brands<br>had <em>almost no creatine</em><br>in them' },
  { t0: 63.63, t1: 68.8, top: 292, size: 74, html: 'It can raise creatinine<br>on blood tests, so <em>tell</em><br><em>your doctor</em> you take it' },
  { t0: 69.04, t1: 74.6, top: 292, size: 74, html: 'Kidney problems, diabetes<br>or high blood pressure?<br><em>Ask your doctor first.</em>' },
  { t0: 75.38, t1: 99, top: 360, size: 96, html: 'Back to<br><em>factory settings.</em>' },
];
const OVL = {};
function overlayInit(S) {
  const O = S.O, tag = (cls, txt2, size, bsize) => { const e = O.tag(cls, txt2); e.style.fontSize = size + 'px'; const b = e.querySelector('b'); if (b && bsize) b.style.fontSize = bsize + 'px'; return e; };
  OVL.mol = tag('tag', 'Creatine<b>the molecule</b>', 22, 40);
  OVL.made = tag('tag', 'Your body makes<b>about 1 g a day</b>', 22, 38);
  OVL.ninety = tag('tag', 'In your muscles<b>95%</b>', 24, 56);
  OVL.short = tag('tag', 'Short, hard efforts<b>under 30 s</b>', 22, 38);
  OVL.top = tag('tag', 'Topped up<b>+20 to 40%</b>', 22, 44);
  OVL.kilo = tag('tag', '35 studies<b>+1.1 kg lean mass</b>', 22, 38);
  OVL.chip = tag('tag', 'Without lifting<b>+0.03 kg</b>', 22, 40);
  OVL.water = tag('tag', 'The scale<b>+1 to 2 kg, mostly water</b>', 22, 34);
  OVL.mem = tag('tag', 'Memory<b>a small gain</b>', 22, 40);
  OVL.dem = tag('tag', 'Dementia<b>no proof</b>', 22, 40);
  OVL.hair = tag('tag', '1 study, 20 players<b>hair not measured</b>', 20, 32);
  OVL.hair2 = tag('tag', '12-week trial<b>no difference</b>', 22, 38);
  OVL.t1 = tag('tag', 'Test 1<b>5 of 9: almost none</b>', 20, 34);
  OVL.t2 = tag('tag', 'Test 2<b>5 of 12: almost none</b>', 20, 34);
  OVL.cr = tag('tag', 'Creatinine<b>can read higher</b>', 22, 38);
  OVL.rest = tag('tag', 'Your body makes<b>about 1 g a day</b>', 24, 40);
}
function overlay(S, t) {
  const R = W.rig, Z0 = W.scaleZ;
  place(S, OVL.mol, W.mol.position.clone().add(new THREE.Vector3(-0.06, 0.07, 0)), -40, -30, pulse(t, T.creatine + 0.3, T.body - 0.2));
  place(S, OVL.made, new THREE.Vector3(KS.x, KS.y + 0.04, KS.z), -60, -90, pulse(t, T.gram - 0.1, 6.2));
  place(S, OVL.ninety, new THREE.Vector3(0.22, 1.25, Z0), 30, -40, pulse(t, T.ninety, T.where + 0.2));
  place(S, OVL.short, new THREE.Vector3(0.3, 1.0, Z0 + 0.1), 30, -40, pulse(t, T.short - 0.2, 12.9));
  place(S, OVL.top, new THREE.Vector3(GAUGE.x, W.gauge.level(1.3) + 0.03, GAUGE.z), -170, -30, pulse(t, T.twenty - 0.2, 17.2));
  place(S, OVL.kilo, new THREE.Vector3(BAL.x - 0.175, BAL.top + 0.32, BAL.z), -80, -60, pulse(t, T.kilo, 25.0));
  place(S, OVL.chip, new THREE.Vector3(BAL.x - 0.175, BAL.top + 0.27, BAL.z), -60, -60, pulse(t, T.kilos, 32.8));
  place(S, OVL.water, new THREE.Vector3(0.12, 0.08, Z0 + 0.2), -40, -40, pulse(t, T.up - 0.2, 39.2));
  const ax = R.seg.Atlas; const head = wpS(ax.g, ax.pivot.clone().add(new THREE.Vector3(0, 0.12, 0.02)));
  place(S, OVL.mem, head, 60, -80, pulse(t, T.small - 0.2, T.no));
  place(S, OVL.dem, head, 60, -80, pulse(t, T.no + 0.2, 45.8));
  place(S, OVL.hair, head.clone().add(new THREE.Vector3(0, 0.08, 0)), -60, -110, pulse(t, T.study, 52.3));
  place(S, OVL.hair2, head.clone().add(new THREE.Vector3(0, 0.08, 0)), -60, -110, pulse(t, T.trial, 55.9));
  place(S, OVL.t1, new THREE.Vector3(GSHELF.x + 0.2, GSHELF.y[0] + 0.1, GSHELF.z + 0.1), 20, -10, pulse(t, T.lab + 1.1, 63.0));
  place(S, OVL.t2, new THREE.Vector3(GSHELF.x + 0.2, GSHELF.y[1] + 0.1, GSHELF.z + 0.1), 20, -10, pulse(t, T.lab + 1.6, 63.0));
  place(S, OVL.cr, new THREE.Vector3(TUBE.x, TUBE.y + 0.06, TUBE.z), 40, 0, pulse(t, T.creatinine, 68.8));
  place(S, OVL.rest, new THREE.Vector3(DIAL.x, DIAL.y + 0.02, DIAL.z), 60, -60, pulse(t, T.settings - 0.3, T.logo - 0.4));
  const c = new THREE.Vector3(DIAL.x, DIAL.y + 0.0142, DIAL.z);
  logoEnd(S, t, { t0: T.logo, center: c, edge: c.clone().add(new THREE.Vector3(0, 0, LOGO_R)) });
}

makeFilm({
  T, caps: CAPS, subs: [], build, update, pose: camPose, overlay, overlayInit, focus: focusAt,
  stage: { bg: 0x07080a, reflSize: 6, env: 0.12, far: 30 },
  aperture: [[0, 0.004], [3.9, 0.004], [7.6, 0.002], [13.8, 0.003], [18.4, 0.002], [26.4, 0.003], [34.2, 0.002], [40, 0.004], [47, 0.003], [57.2, 0.003], [64.4, 0.004], [70.2, 0.003], [75.8, 0.003]],
  bloom: [[0, 0.45], [75, 0.55]],
});

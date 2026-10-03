// Human Factory Settings · Film 8 "How can I fall asleep faster?" · one continuous shot, 9:16.
// A skeleton in bed at night. A timer on the bedside table measures the minutes to fall asleep: normal is 10 to 20; out
// within a minute, the arm drops off the bed (sleep debt, not a talent). A cup of coffee adds 9 minutes and takes 45 off
// the night on the clock; the clock spins back to the cut-off (8.8 hours before bed in one review, 6 for the NHS), and the
// room turns to afternoon. Warmth from a bath rises off the bones. A busy head: the brain flickers; headphones play a
// march and one foot keeps time (the gag); trying: 34 minutes, not trying: 22. After 20 minutes awake the skeleton gets
// up, reads by the lamp, the phone turns itself face down, a yawn, back to bed. CBT for insomnia: 20 trials, 19 minutes
// faster. Over 30 minutes, three nights a week, three months: a sleep diary; see a doctor. The timer becomes the logo.
import { THREE, ORANGE, COLD, ss, s5, lerp, clamp01, hash, camTrack, phys, glowMat, shadows, spot, RoundedBoxGeometry,
  loadAnatomy, V3, place, logoEnd, makeFilm, outBack, stamp, stampCanvas, stampSpot, noiseTex, motes, TIME } from '../kit.js';
import { buildRig, skeletonKind, legIK, bendSpine, poseArm, worldVerts } from '../rig.js';
import { makeClock, makeCup, makePhone, makeLamp, makeLogoRing, tickAngle } from '../props.js';

// ------------------------------------------------------------------ timing, from the voice guide (word starts)
const T = {
  end: 81.3,
  q0: 0.35, fall: 0.98, asleep: 1.24, heres: 2.16, measured: 3.30,                                                   // "Can't fall asleep? Here's what's been measured."
  normal: 4.50, ten: 5.74, twenty: 6.26, minutes: 6.67, out: 7.53, within: 8.10, minute: 8.75, short: 9.47, sleep: 10.02,
  not: 10.64, talent: 11.32,                                                                                          // "Normal is about ten to twenty minutes. Out within a minute can mean you're short on sleep. Not a talent."
  inStudies: 12.65, caffeine: 13.63, added: 14.09, nine: 14.90, falling: 15.95, cut: 17.52, fortyfive: 18.25, sleep2: 19.91,   // "In studies, caffeine added about nine minutes to falling asleep, and cut about forty-five minutes of sleep."
  regular: 21.88, cup: 22.30, review: 22.77, cutoff: 23.79, almost: 24.44, nineh: 25.13, before: 25.96, bed: 26.50,
  nhs: 27.69, six: 28.81,                                                                                             // "For a regular cup, one review put the cut-off at almost nine hours before bed. The NHS says six."
  warm: 30.26, bath: 30.65, shower: 31.06, oneTwo: 31.30, two: 32.10, before2: 32.70, bed2: 33.42, gets: 33.78, sooner: 34.84,   // "A warm bath or shower, one to two hours before bed, gets you there sooner."
  trying: 36.17, backfires: 37.17, head: 38.30, busy: 38.74, students: 39.59, told: 40.43, fast: 41.52, marches: 42.46,
  playing: 43.18, reported: 43.69, t34: 44.44, ones: 45.94, didnt: 46.64, try: 47.03, t22: 47.48,                     // "Trying hard backfires ... reported thirty-four minutes. The ones who didn't try: twenty-two."
  notAsleep: 49.33, after: 50.32, twenty2: 50.65, getUp: 51.85, up: 52.42, quiet: 53.22, away: 53.64, screens: 54.36,
  goBack: 55.02, sleepy: 56.19,                                                                                       // "Not asleep after twenty minutes? Get up. Do something quiet, away from screens. Go back when you're sleepy."
  part: 58.01, cbt: 58.58, insomnia: 59.39, firstline: 60.46, across: 62.44, trials: 63.62, people: 63.92, withIns: 64.38,
  fell: 65.49, nineteen: 66.73, faster: 67.96,                                                                        // "It's part of CBT for insomnia, the first-line treatment. Across twenty trials, ... nineteen minutes faster."
  over: 69.36, thirty: 70.04, three: 70.67, nights: 70.95, week: 71.49, months: 72.50, may: 73.95, insomnia2: 74.37,
  see: 74.99, doctor: 75.81,                                                                                          // "Over thirty minutes, three nights a week, for three months? That may be insomnia. See a doctor."
  final: 77.17, settings: 78.33, logo: 79.0,                                                                          // "Back to factory settings."
};

// ------------------------------------------------------------------ the set (metres; the bed runs along z, its head at -z; +x is the bedside)
const W = {}; window.HFS_W = W;
const BED = { x0: -0.48, x1: 0.48, z0: -1.06, z1: 1.02, top: 0.5, base: 0.3 };   // the mattress (a single bed)
const TBL = { x: 0.83, z: -0.83, w: 0.56, d: 0.46, top: 0.56 };                  // the bedside table
const DIAL = new THREE.Vector3(0.77, TBL.top, -0.72), DIAL_R = 0.078;            // the sleep timer, flat on the table
const LOGO_R = 0.06;
const CLOCK = new THREE.Vector3(0.68, TBL.top, -0.97), LAMP = new THREE.Vector3(1.0, TBL.top, -0.95);
const CUP = new THREE.Vector3(0.98, TBL.top, -0.72), PHONE = new THREE.Vector3(0.61, TBL.top, -0.75), DIARY = new THREE.Vector3(0.985, TBL.top, -0.71);
const X = new THREE.Vector3(1, 0, 0), Y = new THREE.Vector3(0, 1, 0), Z = new THREE.Vector3(0, 0, 1);
const BED_T = 23 * 3600;                 // bedtime on the clock: 11 pm
const pulse = (t, a, b, r = 0.35) => ss(a, a + r, t) * (1 - ss(b - r, b, t));

function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h, c);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.userData.canvas = c; return t;
}
function txt(x, s, px, py, { font = '800 100px Archivo', color = '#fff', align = 'center', track = 0, base = 'middle' } = {}) {
  x.font = font; x.letterSpacing = `${track}px`; x.fillStyle = color; x.textAlign = align; x.textBaseline = base; x.fillText(s, px, py);
}
function brainKind(p) {
  if (p.system !== 'nervous') return undefined;
  const cy = (p.bounds[0][1] + p.bounds[1][1]) / 2;
  if (cy < 1.45 || p.vertexCount < 400 || /nerve|optic|tentorium/i.test(p.name)) return null;
  return 'brain';
}

// ------------------------------------------------------------------ the bed: frame, headboard, a mattress that takes the body's shape, a pillow
const MAT = { nx: 97, nz: 209, r: 0.035 };
function edgeDrop(x, z) {   // the mattress's rounded top edge
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
  // the mattress: straight sides, and a top that is a fine grid we can press down
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
// the body's imprint: for each cell of the mattress (or pillow) grid, how far the bones above it press it down
function imprint(pts, { x0, x1, z0, z1, nx, nz }, surf, { gap = 0.004, dil = 2, blur = 3, max = 0.07 } = {}) {
  const d = new Float32Array(nx * nz);
  for (let p = 0; p < pts.length; p += 3) {
    const x = pts[p], y = pts[p + 1], z = pts[p + 2]; const i = Math.round(((x - x0) / (x1 - x0)) * (nx - 1)), j = Math.round(((z - z0) / (z1 - z0)) * (nz - 1));
    if (i < 0 || j < 0 || i >= nx || j >= nz) continue;
    const s = surf(x, z), k = j * nx + i; d[k] = Math.max(d[k], Math.min(max, s - (y - gap)));
  }
  const pass = (src, r, op) => { const out = new Float32Array(nx * nz);
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { let a = op === 'max' ? 0 : 0, ws = 0;
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
function makePillow(scene, c, size) {   // a soft box: a sphere pushed out toward a box
  const geo = new THREE.SphereGeometry(1, 160, 80), P = geo.attributes.position, sp = (u, e) => Math.sign(u) * Math.pow(Math.abs(u), e);
  for (let i = 0; i < P.count; i++) P.setXYZ(i, sp(P.getX(i), 0.32) * size.x, sp(P.getY(i), 0.75) * size.y, sp(P.getZ(i), 0.32) * size.z);
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, phys({ color: 0x3a3f48, roughness: 0.9, sheen: 0.7, sheenColor: new THREE.Color(0x9aa3b6), sheenRoughness: 0.6 }));
  m.position.copy(c); m.castShadow = m.receiveShadow = true; m.layers.enable(1); scene.add(m);
  return { m, geo, base: Float32Array.from(P.array), key: '' };
}

// ------------------------------------------------------------------ the bedside table and what is on it
function makeTable(scene) {
  const g = new THREE.Group(); g.position.set(TBL.x, 0, TBL.z); scene.add(g);
  const wood = phys({ color: 0x15100c, roughness: 0.45, clearcoat: 0.5, clearcoatRoughness: 0.3 });
  const top = new THREE.Mesh(new RoundedBoxGeometry(TBL.w, 0.03, TBL.d, 4, 0.008), wood); top.position.y = TBL.top - 0.015; g.add(top);
  const body = new THREE.Mesh(new RoundedBoxGeometry(TBL.w - 0.03, 0.34, TBL.d - 0.03, 4, 0.01), wood); body.position.y = TBL.top - 0.03 - 0.17; g.add(body);
  const drawer = new THREE.Mesh(new THREE.BoxGeometry(TBL.w - 0.06, 0.003, 0.002), phys({ color: 0x050505, roughness: 0.6 })); drawer.position.set(0, TBL.top - 0.15, -TBL.d / 2 + 0.014); drawer.rotation.y = 0; g.add(drawer);
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.01, TBL.top - 0.37, 16), wood); leg.position.set(x * (TBL.w / 2 - 0.04), (TBL.top - 0.37) / 2, z * (TBL.d / 2 - 0.04)); g.add(leg); }
  shadows(g); g.traverse((o) => o.layers.enable(1));
  return g;
}
// the sleep timer: minutes to fall asleep, 0 to 45 over 270 degrees (twelve o'clock, toward the headboard, is 22.5)
const ANG = (v) => ((-135 + 6 * v) * Math.PI) / 180;   // clockwise from twelve, seen from above
function makeTimer(scene) {
  const g = new THREE.Group(); g.position.copy(DIAL); scene.add(g);
  const dark = phys({ color: 0x121316, roughness: 0.38, clearcoat: 0.6, clearcoatRoughness: 0.25 });
  const alu = phys({ color: 0xcdcac4, metalness: 1, roughness: 0.3, clearcoat: 0.4, clearcoatRoughness: 0.3 });
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(DIAL_R + 0.012, DIAL_R + 0.015, 0.012, 128), dark); plate.position.y = 0.006; g.add(plate);
  const bezel = new THREE.Mesh(new THREE.TorusGeometry(DIAL_R + 0.003, 0.0032, 20, 160), alu); bezel.rotation.x = Math.PI / 2; bezel.position.y = 0.0125; g.add(bezel);
  // the face, drawn: minute ticks, 0 10 20 30 40, the words
  const tex = canvasTex(1024, 1024, (x, w) => {
    const R = w / 2; x.fillStyle = '#0b0c0e'; x.fillRect(0, 0, w, w);
    for (let v = 0; v <= 45; v++) { const a = ANG(v), big = v % 5 === 0, r0 = R * (big ? 0.78 : 0.83), r1 = R * 0.9;
      x.strokeStyle = big ? '#e7e9ec' : '#8d9097'; x.lineWidth = big ? 7 : 3.5; x.beginPath(); x.moveTo(R + Math.sin(a) * r0, R - Math.cos(a) * r0); x.lineTo(R + Math.sin(a) * r1, R - Math.cos(a) * r1); x.stroke();
      if (v % 10 === 0) txt(x, String(v), R + Math.sin(a) * R * 0.64, R - Math.cos(a) * R * 0.64, { font: '600 74px Archivo', color: '#e7e9ec' }); }
    txt(x, 'MINUTES', R, R * 1.42, { font: '500 40px "Geist Mono"', color: '#9a9da4', track: 9 });
    txt(x, 'TO FALL ASLEEP', R, R * 1.53, { font: '500 30px "Geist Mono"', color: '#6d7077', track: 7 });
  });
  const faceMat = new THREE.MeshPhysicalMaterial({ map: tex, roughness: 0.42, clearcoat: 0.5, clearcoatRoughness: 0.2, emissive: new THREE.Color(0xffffff), emissiveMap: tex, emissiveIntensity: 0, transparent: true });
  const face = new THREE.Mesh(new THREE.CircleGeometry(DIAL_R, 128), faceMat); face.rotation.x = -Math.PI / 2; face.position.y = 0.0122; g.add(face);
  // arcs on the scale (drawn in the face's plane, twelve at +y): the normal band, the coffee's extra, the drop, the long zone, the setting
  const flat = new THREE.Group(); flat.rotation.x = -Math.PI / 2; flat.position.y = 0.0128; g.add(flat);
  const arc = (color, r0, r1, add = true) => { const m = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial({ color: color.clone(), transparent: true, opacity: 0, depthWrite: false, blending: add ? THREE.AdditiveBlending : THREE.NormalBlending, fog: false }));
    m.userData = { r0, r1, key: '' }; flat.add(m); return m; };
  const A = { band: arc(new THREE.Color(0x9fb0cf), DIAL_R * 0.905, DIAL_R * 0.965, false), extra: arc(COLD.clone().multiplyScalar(1.5), DIAL_R * 0.905, DIAL_R * 0.965),
    drop: arc(new THREE.Color(0xd9dce2), DIAL_R * 0.905, DIAL_R * 0.965, false), zone: arc(new THREE.Color(0x9fb0cf), DIAL_R * 0.905, DIAL_R * 0.965, false),
    set: arc(ORANGE.clone().multiplyScalar(1.6), DIAL_R * 0.905, DIAL_R * 0.965, false) };
  // the needle, and a ghost needle for comparisons
  const needle = (o) => { const n = new THREE.Group(); n.position.y = 0.0135 + o * 0.0006; g.add(n);
    const mat = new THREE.MeshPhysicalMaterial({ color: 0xf2f3f5, roughness: 0.35, clearcoat: 0.6, emissive: new THREE.Color(0xffffff), emissiveIntensity: 0.25, transparent: true, opacity: 1 });
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.0022, 0.0009, DIAL_R * 0.86), mat); bar.position.z = -DIAL_R * 0.43 + 0.008; n.add(bar);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.0052, 0.0052, 0.0022, 40), mat); n.add(hub);
    return { n, mat }; };
  const N = needle(1), G = needle(0); G.mat.opacity = 0; G.mat.emissiveIntensity = 0.1;
  // twenty dots for twenty trials, round the rim
  const dotMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xeceef1).multiplyScalar(1.3), fog: false });
  const dots = []; for (let i = 0; i < 20; i++) { const a = ANG(-1.5 + (i / 19) * 48), m = new THREE.Mesh(new THREE.SphereGeometry(0.0032, 16, 12), dotMat.clone());
    m.material.transparent = true; m.material.opacity = 0; m.position.set(Math.sin(a) * (DIAL_R + 0.026), 0.004, -Math.cos(a) * (DIAL_R + 0.026)); g.add(m); dots.push(m); }
  // the logo, for the end
  const logo = makeLogoRing(LOGO_R); logo.g.rotation.x = -Math.PI / 2; logo.g.position.y = 0.0142; g.add(logo.g);
  shadows(g); face.castShadow = false; g.traverse((o) => o.layers.enable(1));
  return { g, faceMat, A, N, G, dots, logo };
}
function setArc(m, v0, v1, o) {   // an arc from v0 to v1 minutes
  m.material.opacity = o; m.visible = o > 0.002 && v1 - v0 > 0.01; if (!m.visible) return;
  const key = v0.toFixed(3) + '|' + v1.toFixed(3); if (key === m.userData.key) return; m.userData.key = key;
  const a0 = ANG(v0), a1 = ANG(v1);   // clockwise from twelve; the ring's angles run anticlockwise from +x
  m.geometry.dispose(); m.geometry = new THREE.RingGeometry(m.userData.r0, m.userData.r1, 96, 1, Math.PI / 2 - a1, a1 - a0);
}
// the sleep diary: thirteen weeks, seven nights each; three nights a week marked
const DIARY_N = [[0, 2, 5], [1, 3, 6], [0, 3, 5], [1, 4, 6], [0, 2, 4], [2, 5, 6], [1, 3, 5], [0, 4, 6], [1, 2, 5], [0, 3, 6], [2, 4, 5], [1, 3, 6], [0, 2, 5]];
function makeDiary(scene) {
  const g = new THREE.Group(); g.position.copy(DIARY); g.rotation.y = 0.5; scene.add(g);
  const tex = canvasTex(1280, 900, () => {}), c = tex.userData.canvas;
  const card = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.002, 0.112), [0, 0, new THREE.MeshPhysicalMaterial({ map: tex, roughness: 0.75 }), 0, 0, 0].map((m) => m || phys({ color: 0xe9e5dc, roughness: 0.8 })));
  card.position.y = 0.001; g.add(card); shadows(g); g.traverse((o) => o.layers.enable(1));
  return { g, tex, c, key: '' };
}
function drawDiary(D, k) {   // k: weeks filled (0..13)
  const key = k.toFixed(3); if (key === D.key) return; D.key = key;
  const x = D.c.getContext('2d'), w = D.c.width, h = D.c.height;
  x.fillStyle = '#ebe7de'; x.fillRect(0, 0, w, h);
  txt(x, 'SLEEP DIARY', 70, 92, { font: '500 46px "Geist Mono"', color: '#3d3c39', align: 'left', track: 10 });
  txt(x, '13 WEEKS', w - 70, 92, { font: '500 34px "Geist Mono"', color: '#7a7873', align: 'right', track: 8 });
  const gx = 120, gy = 170, cw = 80, ch = 92;
  ['M', 'T', 'W', 'T', 'F', 'S', 'S'].forEach((d, r) => txt(x, d, 78, gy + r * ch + ch / 2, { font: '500 34px "Geist Mono"', color: '#8a8780' }));
  for (let wk = 0; wk < 13; wk++) for (let r = 0; r < 7; r++) {
    const px = gx + wk * cw, py = gy + r * ch; x.strokeStyle = '#c9c5bb'; x.lineWidth = 2; x.strokeRect(px + 6, py + 8, cw - 12, ch - 16);
    const on = DIARY_N[wk].includes(r), f = clamp01(k - wk);
    if (on && f > 0) { x.globalAlpha = f; x.fillStyle = '#2a2b2f'; x.fillRect(px + 12, py + 14, cw - 24, ch - 28); x.globalAlpha = 1; }
  }
  D.tex.needsUpdate = true;
}

// ------------------------------------------------------------------ headphones (on the skull) and a tape player (on the bed)
function makePhones(R, skullBox) {
  const g = new THREE.Group(), seg = R.seg.Atlas, piv = seg.pivot;
  const black = phys({ color: 0x17181b, roughness: 0.5, clearcoat: 0.3 }), soft = phys({ color: 0x222327, roughness: 0.85, sheen: 0.4, sheenColor: new THREE.Color(0x666a73) });
  const ear = (s) => new THREE.Vector3(s * (skullBox.hx + 0.016), skullBox.earY, skullBox.earZ);
  const cups = [];
  for (const s of [-1, 1]) {
    const c = new THREE.Group(); c.position.copy(ear(s)); g.add(c);
    const shell = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.034, 0.026, 64), black); shell.rotation.z = Math.PI / 2; shell.position.x = s * 0.012; c.add(shell);
    const pad = new THREE.Mesh(new THREE.TorusGeometry(0.027, 0.009, 20, 64), soft); pad.rotation.y = Math.PI / 2; pad.position.x = -s * 0.006; c.add(pad);
    const yoke = new THREE.Mesh(new THREE.TorusGeometry(0.039, 0.003, 10, 48, Math.PI), phys({ color: 0x9da2a9, metalness: 1, roughness: 0.3 })); yoke.rotation.y = Math.PI / 2; yoke.position.x = s * 0.012; c.add(yoke);
    cups.push(c);
  }
  const top = skullBox.topY + 0.016, pts = [];
  for (let i = 0; i <= 24; i++) { const a = Math.PI * (i / 24), xx = Math.cos(a) * (skullBox.hx + 0.028), yy = skullBox.earY + 0.05 + Math.sin(a) * (top - skullBox.earY - 0.05); pts.push(new THREE.Vector3(xx, yy, skullBox.earZ)); }
  const band = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 80, 0.0075, 12), black); g.add(band);
  g.position.sub(piv); seg.g.add(g); g.visible = false; shadows(g); g.traverse((o) => o.layers.enable(1));
  return { g, cups, home: g.position.clone() };
}
function makeTape(scene) {
  const g = new THREE.Group(); scene.add(g);
  const body = new THREE.Mesh(new RoundedBoxGeometry(0.084, 0.026, 0.118, 4, 0.004), phys({ color: 0x2a2c31, roughness: 0.4, metalness: 0.3, clearcoat: 0.4 })); body.position.y = 0.013; g.add(body);
  const tex = canvasTex(512, 720, (x, w, h) => {
    x.fillStyle = '#2a2c31'; x.fillRect(0, 0, w, h);
    x.fillStyle = '#0d0e10'; x.fillRect(40, 60, w - 80, 380);                                 // the window
    x.fillStyle = '#d9d2c3'; x.fillRect(70, 90, w - 140, 120);                                // the cassette's label
    txt(x, 'MARCHES', w / 2, 152, { font: '600 58px "Geist Mono"', color: '#2c2b29', track: 8 });
    for (const cx of [170, w - 170]) { x.strokeStyle = '#8a8d93'; x.lineWidth = 8; x.beginPath(); x.arc(cx, 320, 46, 0, Math.PI * 2); x.stroke(); }
    for (let i = 0; i < 4; i++) { x.fillStyle = '#4a4d54'; x.fillRect(60 + i * 104, 520, 80, 120); }
    x.fillStyle = '#eceef1'; x.beginPath(); x.moveTo(90, 555); x.lineTo(90, 605); x.lineTo(125, 580); x.fill();   // play
  });
  const face = new THREE.Mesh(new THREE.PlaneGeometry(0.08, 0.114), new THREE.MeshPhysicalMaterial({ map: tex, roughness: 0.4, clearcoat: 0.5 }));
  face.rotation.x = -Math.PI / 2; face.position.y = 0.0262; g.add(face);
  shadows(g); g.traverse((o) => o.layers.enable(1)); g.visible = false;
  const cord = new THREE.Mesh(new THREE.BufferGeometry(), phys({ color: 0x141518, roughness: 0.5 })); cord.castShadow = true; cord.layers.enable(1); scene.add(cord); cord.visible = false;
  return { g, cord, key: '' };
}
function makeBook(scene) {
  const g = new THREE.Group(); scene.add(g);
  const cover = phys({ color: 0x5b2b25, roughness: 0.6, clearcoat: 0.2 }), paper = phys({ color: 0xe8e2d4, roughness: 0.85 });
  const halves = [], open = new THREE.Group(); g.add(open);
  for (const s of [-1, 1]) {   // two halves that open about the spine (the spine runs along z)
    const h = new THREE.Group(); open.add(h);
    const c = new THREE.Mesh(new THREE.BoxGeometry(0.128, 0.003, 0.2), cover); c.position.set(s * 0.064, -0.0015, 0); h.add(c);
    const p = new THREE.Mesh(new THREE.BoxGeometry(0.122, 0.012, 0.19), paper); p.position.set(s * 0.062, 0.006, 0); h.add(p);
    halves.push({ h, s });
  }
  const closed = new THREE.Group(); g.add(closed);
  const cb = new THREE.Mesh(new RoundedBoxGeometry(0.13, 0.03, 0.2, 2, 0.002), cover); cb.position.y = 0.015; closed.add(cb);
  const cp = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.024, 0.19), paper); cp.position.set(0.0645, 0.015, 0); closed.add(cp);
  shadows(g); g.traverse((o) => o.layers.enable(1));
  return { g, halves, open, closed };
}

function makeSteam(scene) {
  const out = [];
  for (let i = 0; i < 10; i++) {
    const mat = new THREE.ShaderMaterial({
      uniforms: { uTime: TIME, uAmt: { value: 0 }, uSeed: { value: i * 3.17 } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: `uniform float uTime, uAmt, uSeed; varying vec2 vUv;
        float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h(i), h(i + vec2(1.0, 0.0)), f.x), mix(h(i + vec2(0.0, 1.0)), h(i + vec2(1.0, 1.0)), f.x), f.y); }
        float fbm(vec2 p){ float a = 0.5, s = 0.0; for (int k = 0; k < 5; k++) { s += a * n(p); p = p * 2.03 + 7.1; a *= 0.5; } return s; }
        void main(){ float t = uTime * 0.22; vec2 p = vec2(vUv.x * 3.4 + uSeed, vUv.y * 1.5 - t);
          float q = fbm(vec2(p.x * 0.55, p.y * 0.8 + uSeed * 1.3));
          p.x += (q - 0.5) * 2.4 * (0.25 + vUv.y);                           // the strands curl as they rise
          float w = fbm(p * vec2(1.0, 0.5));
          float strands = smoothstep(0.52, 0.74, w) * (0.55 + 0.45 * smoothstep(0.6, 0.8, w));
          float env = smoothstep(0.0, 0.16, vUv.y) * (1.0 - smoothstep(0.3, 1.0, vUv.y)) * smoothstep(0.0, 0.32, vUv.x) * (1.0 - smoothstep(0.68, 1.0, vUv.x));
          gl_FragColor = vec4(vec3(1.0, 0.95, 0.9), strands * env * uAmt); }`,
      transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false, blending: THREE.AdditiveBlending,
    });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.55), mat); m.position.set((hash(i * 2.3) - 0.5) * 0.22, BED.top + 0.33, -0.74 + i * 0.15); m.renderOrder = 7; scene.add(m); out.push(m);
  }
  return out;
}

// ------------------------------------------------------------------ build
async function build(S, cfg) {
  const scene = S.scene;
  S.fog.near = 4; S.fog.far = 14;
  S.table.scale.set(3, 3, 1); S.tableMat.clearcoat = 0.12; S.tableMat.specularIntensity = 0.35;
  for (const m of [S.tableMat.map, S.tableMat.roughnessMap]) if (m) { m.wrapS = m.wrapT = THREE.RepeatWrapping; m.repeat.multiplyScalar(3); }
  // ---- the skeleton (and its brain), rigged; the body group's origin is the pelvis
  const meshes = await loadAnatomy(skeletonKind(brainKind));
  const R = W.rig = buildRig(meshes);
  W.body = new THREE.Group(); scene.add(W.body); R.root.position.copy(R.P0).negate(); W.body.add(R.root);
  for (const m of meshes) { m.castShadow = true; m.receiveShadow = true; m.layers.enable(1); }
  W.meshes = meshes.filter((m) => m.userData.tissue !== 'brain');
  W.brain = meshes.filter((m) => m.userData.tissue === 'brain');
  W.brain.forEach((m, i) => { m.material.transparent = true; m.material.opacity = 0; m.visible = false; m.castShadow = false; m.material.color.set(0x5d5f6b); m.material.sheen = 0.3; m.material.emissive.set(0xb8ccff); m.userData.ph = hash(i * 3.7) * 40; m.userData.f = 1.5 + hash(i * 1.9) * 4; });
  W.vault = meshes.filter((m) => /frontal bone|parietal bone|occipital bone|temporal bone|sphenoid bone/i.test(m.userData.name));
  for (const m of W.vault) { m.material = m.material.clone(); m.material.transparent = true; }
  // the lower jaw gets its own hinge (for a yawn)
  { const jaw = meshes.filter((m) => /^mandible$|lower .*tooth/i.test(m.userData.name)), mv = worldVerts(R.byName.get('Mandible'), 2);
    let top = -9; for (const v of mv) top = Math.max(top, v.y); const hi = mv.filter((v) => v.y > top - 0.012), zc = hi.reduce((s, v) => s + v.z, 0) / hi.length;
    const TMJ = new THREE.Vector3(0, top - 0.008, Math.min(...hi.filter((v) => v.z < zc).map((v) => v.z)) + 0.012);
    const seg = R.seg.Atlas; W.jaw = new THREE.Group(); W.jaw.position.copy(TMJ).sub(seg.pivot); seg.g.add(W.jaw);
    for (const m of jaw) { m.removeFromParent(); m.position.copy(m.userData.home).sub(TMJ); W.jaw.add(m); }
    W.TMJ = TMJ; }
  // the skull's size, for the headphones
  { const sk = meshes.filter((m) => /parietal bone|temporal bone/i.test(m.userData.name)).flatMap((m) => worldVerts(m, 3));
    let hx = 0, topY = -9; for (const v of sk) { hx = Math.max(hx, Math.abs(v.x)); topY = Math.max(topY, v.y); }
    const tv = worldVerts(R.byName.get('Right temporal bone'), 2), lat = tv.filter((v) => v.x < -hx + 0.012);
    W.skullBox = { hx, topY, earY: W.TMJ.y + 0.03, earZ: W.TMJ.z - 0.02, lat: lat.length }; }
  // ---- the factory stamp: on the front of the breastbone, across it
  { const st = R.byName.get('Body of sternum'); st.material = st.material.clone();
    W.stampSpot = stampSpot(st, { from: [0, 0.006, 0.12], dir: [0, 0, -1], spread: 0.004 });
    if (W.stampSpot) W.stamp = stamp(st, { canvas: stampCanvas(['HUMAN FACTORY', 'SETTINGS'], '', { frame: false }), center: W.stampSpot.center, normal: W.stampSpot.normal, up: [0, 1, 0], width: 0.04, depth: 0.03, opacity: 0.6 }); }
  // ---- the set
  W.bed = makeBed(scene);
  makeTable(scene);
  W.timer = makeTimer(scene);
  W.clock = makeClock(); W.clock.g.position.copy(CLOCK); W.clock.g.rotation.y = 0.72; W.clock.g.scale.setScalar(1.25); scene.add(W.clock.g);
  W.clock.arcMat.color.set(0x3f66d8); W.clock.arcGhostMat.color.set(0x9aa0aa); W.clock.markMat.opacity = 0; W.clock.marker.visible = false; W.clock.g.traverse((o) => o.layers.enable(1));
  W.cup = makeCup(); W.cup.g.position.copy(CUP); W.cup.g.rotation.y = 2.2; scene.add(W.cup.g); W.cup.g.traverse((o) => o.layers.enable(1));
  W.phone = makePhone(); W.phone.g.position.copy(PHONE); W.phone.g.rotation.y = 0.18; scene.add(W.phone.g); W.phone.g.traverse((o) => o.layers.enable(1));
  { const cv = document.createElement('canvas'); cv.width = 590; cv.height = 1220; const x = cv.getContext('2d');
    const bg = x.createLinearGradient(0, 0, 0, 1220); bg.addColorStop(0, '#1b2440'); bg.addColorStop(1, '#090c16'); x.fillStyle = bg; x.fillRect(0, 0, 590, 1220);
    txt(x, '23:38', 295, 360, { font: '300 190px Archivo', color: 'rgba(255,255,255,0.95)' }); txt(x, 'Thursday 5 November', 295, 200, { font: '500 34px Archivo', color: 'rgba(255,255,255,0.75)' });
    x.fillStyle = 'rgba(255,255,255,0.16)'; x.beginPath(); x.roundRect(40, 560, 510, 150, 34); x.fill();
    txt(x, '1 new notification', 295, 635, { font: '500 38px Archivo', color: 'rgba(255,255,255,0.9)' });
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; W.phone.screenMat.map = tex; W.phone.screenMat.needsUpdate = true; }
  W.lamp = makeLamp(); W.lamp.g.position.copy(LAMP); scene.add(W.lamp.g); W.lamp.g.traverse((o) => o.layers.enable(1));
  W.lampLight = new THREE.PointLight(0xffc98a, 0, 3.0, 2); W.lampLight.position.copy(LAMP).add(new THREE.Vector3(0, 0.27, 0)); scene.add(W.lampLight);
  W.diary = makeDiary(scene); drawDiary(W.diary, 0);
  W.phones = makePhones(R, W.skullBox);
  W.tape = makeTape(scene);
  W.book = makeBook(scene);
  W.steam = makeSteam(scene);
  // ---- lying and sitting: measure the pose, place the body, press the bed
  W.qLie = new THREE.Quaternion().setFromAxisAngle(X, -Math.PI / 2);
  poseRig(restPose()); W.body.quaternion.copy(W.qLie); W.body.position.set(0, 0, 0); W.body.updateMatrixWorld(true);
  const bb = (re) => { const b = new THREE.Box3(); for (const m of W.meshes) if (re.test(m.userData.name)) b.expandByObject(m); return b; };
  const heel = bb(/calcaneus/i), skull = bb(/parietal bone|occipital bone|frontal bone/i), occ = bb(/occipital bone/i);
  W.lieP = new THREE.Vector3(0, BED.top - 0.012 - heel.min.y, BED.z0 + 0.075 - skull.min.z);
  // the pillow: under the skull, its top a little above the back of the skull
  const occY = occ.min.y + W.lieP.y, occZ = (occ.min.z + occ.max.z) / 2 + W.lieP.z;
  const ph = (occY + 0.04 - BED.top) / 2;
  W.pillow = makePillow(scene, new THREE.Vector3(0, BED.top + ph - 0.004, occZ - 0.03), new THREE.Vector3(0.3, ph, 0.19));
  // sitting on the bed's edge, facing the bedside
  const hipB = new THREE.Box3(); for (const m of W.meshes) if (/hip bone/i.test(m.userData.name)) for (const v of worldVerts(m, 3)) hipB.expandByPoint(v);
  W.qSit = new THREE.Quaternion().setFromAxisAngle(Y, Math.PI / 2);
  W.sitP = new THREE.Vector3(BED.x1 - 0.13, BED.top - 0.025 + (R.P0.y - hipB.min.y), W.lieP.z + 0.02);
  // the imprints, lying and sitting
  const grab = () => { W.body.updateMatrixWorld(true); const out = []; const v = new THREE.Vector3();
    for (const m of W.meshes) { const P = m.geometry.attributes.position; for (let i = 0; i < P.count; i += 2) { v.fromBufferAttribute(P, i).applyMatrix4(m.matrixWorld); out.push(v.x, v.y, v.z); } } return out; };
  const grid = { x0: BED.x0, x1: BED.x1, z0: BED.z0, z1: BED.z1, nx: MAT.nx, nz: MAT.nz }, surf = (x, z) => BED.top - edgeDrop(x, z);
  W.body.position.copy(W.lieP); const lyingPts = grab();
  W.dentLie = imprint(lyingPts, grid, surf, { gap: 0.002, dil: 2, blur: 4, max: 0.08 });
  poseRig(sitPose()); W.body.quaternion.copy(W.qSit); W.body.position.copy(W.sitP);
  for (const Side of ['Right', 'Left']) legIK(R, Side, footTarget(Side), W.qSit, X);
  W.dentSit = imprint(grab(), grid, surf, { gap: 0.002, dil: 2, blur: 4, max: 0.06 });
  // the pillow's imprint (lying only)
  { const P = W.pillow.base, c = W.pillow.m.position, cell = new Map(), key = (x, z) => `${Math.round(x / 0.008)},${Math.round(z / 0.008)}`;
    for (let p = 0; p < lyingPts.length; p += 3) { const x = lyingPts[p] - c.x, y = lyingPts[p + 1] - c.y, z = lyingPts[p + 2] - c.z; if (Math.abs(x) > 0.32 || Math.abs(z) > 0.21) continue; const k = key(x, z); cell.set(k, Math.min(cell.get(k) ?? 9, y)); }
    W.pillowDent = new Float32Array(P.length / 3);
    for (let i = 0; i < P.length / 3; i++) { const x = P[i * 3], y = P[i * 3 + 1], z = P[i * 3 + 2]; if (y < 0) continue; let lo = 9;
      for (let a = -3; a <= 3; a++) for (let b = -3; b <= 3; b++) { const v = cell.get(`${Math.round(x / 0.008) + a},${Math.round(z / 0.008) + b}`); if (v !== undefined) lo = Math.min(lo, v + 0.004 + 0.0012 * (a * a + b * b)); }
      W.pillowDent[i] = Math.max(0, y - lo); } }
  // ---- light: the moon through a window (it turns to afternoon when the clock goes back), a cold rim, the lamp
  const cookie = canvasTex(512, 512, (x, w) => { x.fillStyle = '#000'; x.fillRect(0, 0, w, w); x.filter = 'blur(4px)'; x.fillStyle = '#fff';
    const m = 50, gap = 26, pw = (w - 2 * m - gap * 2) / 3, phh = (w - 2 * m - gap * 3) / 4;
    for (let i = 0; i < 3; i++) for (let j = 0; j < 4; j++) x.fillRect(m + i * (pw + gap), m + j * (phh + gap), pw, phh); });
  cookie.colorSpace = THREE.NoColorSpace;
  W.key = spot(scene, { color: 0xb8c8ff, pos: new THREE.Vector3(2.6, 2.6, -0.6), target: new THREE.Vector3(0.05, 0.5, -0.15), angle: 0.42, penumbra: 0.35, shadow: true, size: cfg.shadow ?? 1024 });
  W.key.map = cookie; W.key.shadow.camera.far = 7;
  W.rim = spot(scene, { color: 0x9fb6ff, pos: new THREE.Vector3(-0.9, 1.9, -2.2), target: new THREE.Vector3(0, 0.55, -0.4), angle: 0.5, penumbra: 0.9 });
  W.fill = spot(scene, { color: 0xc8d6ff, pos: new THREE.Vector3(-1.8, 1.4, 1.6), target: new THREE.Vector3(0, 0.5, -0.1), angle: 0.6, penumbra: 1 });
  W.tableLight = spot(scene, { color: 0xdfe6ff, pos: new THREE.Vector3(1.3, 1.6, -0.2), target: new THREE.Vector3(0.82, TBL.top, -0.8), angle: 0.3, penumbra: 0.8 });
  return { stamp: W.stampSpot, lieP: W.lieP.toArray(), sitP: W.sitP.toArray(), skullBox: W.skullBox, pillowH: ph, brain: W.brain.length, n: meshes.length };
}

// ------------------------------------------------------------------ the body over time
// poses: lying (arms at the sides, feet relaxed outward), sitting (on the edge, feet on the floor), reading, a yawn
const ARM_LIE = { dir: [-0.1, -1, -0.09], twist: 0, elbow: 0.1 }, ARM_FLOP = { dir: [0.96, -0.12, -0.25], twist: 3.0, elbow: 1.25 };
const ARM_PUSH = { dir: [0.28, -0.95, -0.2], twist: 0, elbow: 0.25 }, ARM_READ = { dir: [0.1, -0.86, 0.5], twist: 0.45, elbow: 1.3 };
const mixArm = (a, b, k) => ({ dir: a.dir.map((v, i) => lerp(v, b.dir[i], k)), twist: lerp(a.twist, b.twist, k), elbow: lerp(a.elbow, b.elbow, k) });
function restPose() { return { up: 0, swivel: 0, move: 0, knee: 0, ik: 0, cer: 0.3, tho: 0, lum: 0, turn: 0, roll: 0, flopL: 0, read: 0, push: 0, jaw: 0, tap: 0 }; }
function sitPose() { return { ...restPose(), up: 1, swivel: 1, move: 1, knee: 1, ik: 1, cer: 0.12, tho: 0.12 }; }
function footTarget(Side) {   // sitting: the ankle above the floor, in front of the knee
  const G = W.rig.legs[Side], ah = G.A.y - G.ground;
  return new THREE.Vector3(W.sitP.x + 0.43, ah + 0.002, W.sitP.z + (Side === 'Right' ? 0.11 : -0.11));
}
function bodyAt(t) {
  const o = restPose();
  // clock-watching at the start: the head turns to the bedside, then back
  o.turn = 0.62 * s5(0.6, 1.5, t) * (1 - s5(3.4, 4.6, t));
  // asleep within a minute: the left arm drops off the bed, the head rolls; back for the next test
  const fl = T.minute + 0.15; o.flopL = (t < fl ? 0 : outBack(clamp01((t - fl) / 0.42), 1.2)) * (1 - s5(12.1, 13.2, t)); o.roll = 0.35 * s5(fl - 0.05, fl + 0.4, t) * (1 - s5(12.1, 13.2, t));
  // the march: the right foot keeps time (the gag); 120 to the minute, from the first beat to the music's end
  if (t > MARCH.t0 && t < MARCH.t1) { const b = (t - MARCH.t0) / MARCH.beat, f = b - Math.floor(b); o.tap = (f < 0.18 ? ss(0, 0.18, f) : 1 - ss(0.18, 0.62, f)) * ss(MARCH.t0, MARCH.t0 + 0.3, t) * (1 - ss(MARCH.t1 - 0.4, MARCH.t1, t)); }
  // getting up, and back
  const G0 = T.getUp - 0.15, B0 = T.sleepy + 0.25;
  o.up = s5(G0, G0 + 0.75, t) * (1 - s5(B0 + 0.55, B0 + 1.35, t));
  o.swivel = s5(G0 + 0.25, G0 + 1.05, t) * (1 - s5(B0 + 0.2, B0 + 1.0, t));
  o.move = s5(G0 + 0.2, G0 + 1.0, t) * (1 - s5(B0 + 0.2, B0 + 1.0, t));
  o.knee = s5(G0 + 0.45, G0 + 1.1, t) * (1 - s5(B0 + 0.1, B0 + 0.7, t));
  o.ik = s5(G0 + 0.8, G0 + 1.2, t) * (1 - s5(B0, B0 + 0.35, t));
  o.push = pulse(t, G0, G0 + 1.2, 0.4) + pulse(t, B0 + 0.4, B0 + 1.4, 0.4);
  o.read = s5(T.quiet - 0.6, T.quiet + 0.1, t) * (1 - s5(T.goBack + 0.1, T.goBack + 0.7, t));
  const y = pulse(t, T.goBack + 0.15, T.sleepy + 0.25, 0.4); o.jaw = 0.42 * y;
  o.cer = lerp(lerp(0.3, 0.12, o.up), 0.55, o.read) - 0.5 * y; o.tho = lerp(0, 0.12, o.up) + 0.25 * o.read - 0.15 * y;
  return o;
}
const MARCH = { t0: 42.55, t1: 48.3, beat: 0.5 };
const _qa = new THREE.Quaternion(), _qb = new THREE.Quaternion(), _qc = new THREE.Quaternion(), _qd = new THREE.Quaternion();
function poseRig(o) {
  const R = W.rig;
  bendSpine(R.seg, { lum: 0, tho: o.tho, cer: o.cer });
  for (const n of ['Atlas', 'Axis', 'Third cervical vertebra']) { R.seg[n].g.rotation.y += o.turn / 3 + o.roll / 3; }
  W.jaw.rotation.x = o.jaw;
  // arms
  const armL = mixArm(mixArm(mixArm(ARM_LIE, ARM_PUSH, o.push), ARM_READ, o.read), ARM_FLOP, o.flopL);
  const armR = mixArm(mixArm(ARM_LIE, ARM_PUSH, o.push), ARM_READ, o.read);
  poseArm(R.arms.Right, armR); poseArm(R.arms.Left, armL);
  // legs: lying, the hips turn out and the feet fall forward; sitting, the hips bend as the body rises, the knees as the legs leave the bed
  for (const Side of ['Right', 'Left']) {
    const G = R.legs[Side], s = G.s, lie = 1 - o.up;
    _qa.setFromAxisAngle(X, -(Math.PI / 2) * o.up); _qb.setFromAxisAngle(Z, 0.1 * s * o.knee); _qc.setFromAxisAngle(Y, 0.22 * s * lie);
    G.hip.quaternion.multiplyQuaternions(_qa, _qb).multiply(_qc);
    G.knee.quaternion.setFromAxisAngle(X, (Math.PI / 2) * o.knee);
    const tap = Side === 'Right' ? o.tap : 0;
    G.ankle.quaternion.setFromAxisAngle(X, lerp(0.62, 0, o.knee) - 0.38 * tap);
  }
}
function placeBody(o) {
  _qa.setFromAxisAngle(X, -(Math.PI / 2) * (1 - o.up)); _qb.setFromAxisAngle(Y, (Math.PI / 2) * o.swivel);
  W.body.quaternion.multiplyQuaternions(_qb, _qa);
  W.body.position.lerpVectors(W.lieP, W.sitP, o.move); W.body.position.y += 0.04 * Math.sin(Math.PI * o.move) + (W.sitP.y - W.lieP.y) * (o.up - o.move) * 0.6;
  W.body.updateMatrixWorld(true);
  if (o.ik > 0.001) for (const Side of ['Right', 'Left']) {
    const G = W.rig.legs[Side]; const h = G.hip.quaternion.clone(), k = G.knee.quaternion.clone(), a = G.ankle.quaternion.clone();
    legIK(W.rig, Side, footTarget(Side), W.body.quaternion, X);
    G.hip.quaternion.copy(h.slerp(G.hip.quaternion, o.ik)); G.knee.quaternion.copy(k.slerp(G.knee.quaternion, o.ik)); G.ankle.quaternion.copy(a.slerp(G.ankle.quaternion, o.ik));
  }
  W.body.updateMatrixWorld(true);
}

// ------------------------------------------------------------------ the clock, the timer and the light over time
const H = 3600;
function clockAt(t) {   // seconds of the day on the bedside clock
  const night = 23 * H + 38 * 60 + t, sp = (a, b, x) => s5(a, b, x);
  const rew = sp(T.regular - 0.3, T.cutoff + 0.5, t), fw1 = sp(T.nhs - 0.1, T.six + 0.2, t), fw2 = sp(T.warm - 0.9, T.warm + 0.4, t), fw3 = sp(T.bed2 + 0.3, T.gets + 0.9, t);
  const c1 = 14 * H + 12 * 60 + (t - T.cutoff - 0.5), c2 = 17 * H + (t - T.six - 0.2), c3 = 21 * H + 30 * 60 + (t - T.warm - 0.4);   // each held time keeps ticking
  let s = lerp(night, c1, rew); s = lerp(s, c2, fw1); s = lerp(s, c3, fw2); s = lerp(s, night, fw3);
  return s;
}
function timerAt(t) {   // the needle, the ghost needle and the arcs, in minutes
  const o = { v: 0, g: 0, gO: 0, band: 0, extra: 0, extraV: 0, drop: [0, 0], dropO: 0, zone: 0, set: 0, dots: 0, glow: 0 };
  o.glow = ss(T.heres - 0.2, T.measured, t);
  // normal: a run from 0 to 15, the band 10 to 20
  let v = 15 * s5(T.ten - 0.3, T.minutes + 0.4, t);
  o.band = ss(T.ten - 0.1, T.ten + 0.4, t) * (1 - ss(T.out - 0.4, T.out, t)) + 0.45 * ss(T.out, T.out + 0.4, t) * (1 - ss(T.inStudies, T.inStudies + 0.6, t));
  // out within a minute: back to zero, then barely moves
  v = lerp(v, 0.7, s5(T.out - 0.3, T.minute + 0.2, t));
  // caffeine: from 15 to 24 (+9)
  const cf = s5(T.caffeine - 0.2, T.added + 0.6, t); v = lerp(v, 15, cf); v = lerp(v, 24, s5(T.nine - 0.1, T.falling + 0.3, t));
  o.extra = ss(T.nine - 0.2, T.nine + 0.3, t) * (1 - ss(T.regular - 0.6, T.regular, t)); o.extraV = 15 + 9 * s5(T.nine - 0.1, T.falling + 0.3, t);
  // the bath: a run that stops sooner (13, against the ghost at 15)
  v = lerp(v, 0, s5(T.regular - 0.6, T.cup, t)); v = lerp(v, 13, s5(T.gets - 0.2, T.sooner + 0.3, t));
  o.gO = 0.55 * ss(T.gets - 0.3, T.gets, t) * (1 - ss(T.trying - 0.6, T.trying, t)); o.g = 15;
  // trying hard: 34; not trying: 22 (the ghost)
  v = lerp(v, 34, s5(T.reported - 0.1, T.t34 + 0.5, t));
  const g2 = ss(T.didnt - 0.2, T.didnt + 0.2, t) * (1 - ss(T.notAsleep - 0.4, T.notAsleep, t)); if (t > T.trying) { o.g = 22 * s5(T.didnt - 0.2, T.t22 + 0.3, t); o.gO = 0.6 * g2; }
  // twenty minutes awake
  v = lerp(v, 0, s5(T.notAsleep - 0.6, T.notAsleep, t)); v = lerp(v, 20, s5(T.notAsleep + 0.1, T.twenty2 + 0.1, t));
  // insomnia: long; CBT: about 19 minutes faster
  v = lerp(v, 45, s5(T.withIns - 0.2, T.fell + 0.2, t)); v = lerp(v, 26, s5(T.nineteen - 0.2, T.faster + 0.2, t));
  o.drop = [26 + 19 * (1 - s5(T.nineteen - 0.2, T.faster + 0.2, t)), 45]; o.dropO = ss(T.nineteen - 0.2, T.nineteen + 0.2, t) * (1 - ss(T.over - 0.5, T.over, t));
  o.dots = clamp01((t - (T.trials - 0.4)) / 0.9) * (1 - ss(T.over - 0.6, T.over, t));
  // over thirty: the long zone
  v = lerp(v, 38, s5(T.thirty - 0.3, T.three, t)); o.zone = ss(T.thirty - 0.2, T.thirty + 0.3, t) * (1 - ss(T.final - 0.2, T.final + 0.3, t));
  // factory settings: 15, the band in orange
  v = lerp(v, 15, s5(T.final, T.final + 0.9, t)); o.set = ss(T.final + 0.3, T.final + 0.9, t);
  o.v = v; return o;
}

// ------------------------------------------------------------------ the camera: one path, no cuts
let CAM = null;
function buildCam() {
  const D = DIAL, Dl = V3(D.x, D.y + 0.012, D.z - 0.004), C = V3(CLOCK.x - 0.01, CLOCK.y + 0.075, CLOCK.z);
  return camTrack([
    { t: -3.0, p: V3(0.31, 4.35, 0.08), l: V3(0.31, 0.5, 0.0), fov: 44 },
    { t: 0.3, p: V3(0.31, 3.95, 0.08), l: V3(0.31, 0.5, 0.0), fov: 44, tens: 0.5 },                 // the bed from above, at night
    { t: 2.4, p: V3(1.05, 1.75, 0.5), l: V3(0.62, 0.56, -0.7), fov: 34 },
    { t: 4.2, p: V3(1.0, 1.13, -0.3), l: Dl, fov: 28, tens: 0.2 },                                  // down to the timer
    { t: 7.2, p: V3(1.0, 1.12, -0.29), l: Dl, fov: 28, tens: 0.4 },
    { t: 8.7, p: V3(1.3, 1.38, 0.4), l: V3(0.36, 0.5, -0.5), fov: 36, tens: 0.2 },                 // back: the arm drops
    { t: 12.1, p: V3(1.31, 1.37, 0.42), l: V3(0.38, 0.5, -0.52), fov: 36, tens: 0.4 },
    { t: 13.7, p: V3(0.95, 1.08, -0.06), l: V3(0.83, 0.6, -0.77), fov: 32, tens: 0.2 },              // the coffee, the timer, the clock
    { t: 19.9, p: V3(0.94, 1.07, -0.08), l: V3(0.82, 0.6, -0.78), fov: 32, tens: 0.4 },
    { t: 21.7, p: V3(1.14, 0.76, -0.47), l: C, fov: 28, tens: 0.2 },                                // the clock goes back to the afternoon
    { t: 32.4, p: V3(1.12, 0.76, -0.49), l: C, fov: 28, tens: 0.3 },
    { t: 33.9, p: V3(1.5, 1.2, 0.5), l: V3(0.05, 0.62, -0.45), fov: 36, tens: 0.2 },              // warmth off the bones
    { t: 35.5, p: V3(1.47, 1.19, 0.52), l: V3(0.05, 0.62, -0.47), fov: 36, tens: 0.4 },
    { t: 36.9, p: V3(0.24, 1.2, -0.4), l: V3(-0.015, 0.62, -0.86), fov: 30, tens: 0.2 },              // the busy head
    { t: 41.7, p: V3(0.25, 1.21, -0.37), l: V3(-0.015, 0.62, -0.85), fov: 31, tens: 0.4 },
    { t: 43.0, p: V3(-0.32, 1.06, 1.66), l: V3(0.02, 0.5, 0.0), fov: 34, tens: 0.2 },              // the right foot keeps time
    { t: 45.1, p: V3(-0.29, 1.07, 1.63), l: V3(0.06, 0.5, -0.08), fov: 34, tens: 0.4 },
    { t: 46.6, p: V3(1.0, 1.13, -0.3), l: Dl, fov: 28, tens: 0.2 },                                 // 34 against 22, then 20 minutes awake
    { t: 50.3, p: V3(1.01, 1.12, -0.29), l: Dl, fov: 28, tens: 0.3 },
    { t: 51.7, p: V3(2.7, 1.62, 1.25), l: V3(0.52, 0.62, -0.36), fov: 38, tens: 0.2 },             // he gets up, reads, goes back
    { t: 57.5, p: V3(2.66, 1.61, 1.28), l: V3(0.5, 0.6, -0.37), fov: 38, tens: 0.4 },
    { t: 59.0, p: V3(1.06, 1.27, -0.17), l: Dl, fov: 28, tens: 0.2 },                                // CBT: twenty trials, nineteen minutes
    { t: 68.6, p: V3(1.05, 1.26, -0.18), l: Dl, fov: 28, tens: 0.4 },
    { t: 70.2, p: V3(0.86, 1.3, -0.03), l: V3(0.86, TBL.top + 0.01, -0.74), fov: 31, tens: 0.2 },  // the sleep diary
    { t: 76.7, p: V3(0.86, 1.29, -0.04), l: V3(0.86, TBL.top + 0.01, -0.74), fov: 31, tens: 0.4 },
    { t: 77.9, p: V3(0.9, 1.1, -0.42), l: Dl, fov: 30 },
    { t: T.logo, p: V3(D.x, D.y + 0.62, D.z + 0.005), l: V3(D.x, D.y + 0.0142, D.z), fov: 30, stop: true },   // straight down on the timer: the logo
  ]);
}
function camPose(S, t) {
  const v = S.cfg.view; if (v && typeof v === 'object') return v;
  if (!CAM) CAM = buildCam();
  if (t <= T.logo) return CAM(t);
  const P = CAM(T.logo), k = ss(T.logo, T.end, t);
  return { p: [P.p[0], lerp(P.p[1], P.p[1] - 0.05, k), P.p[2]], l: P.l, fov: 30 };
}
function focusAt(S, t, P) { return Math.hypot(P.p[0] - P.l[0], P.p[1] - P.l[1], P.p[2] - P.l[2]); }

// ------------------------------------------------------------------ one moment of the film
const _v = new THREE.Vector3(), _w = new THREE.Vector3(), _m4 = new THREE.Matrix4();
function update(S, t) {
  const scene = S.scene, endDark = ss(T.final + 0.3, T.logo - 0.3, t);
  // ---- the body
  const o = bodyAt(t); poseRig(o); placeBody(o);
  // ---- the bed takes the body's shape
  { const k = clamp01(o.move), kk = Math.round(k * 200) / 200, L = W.dentLie, Sd = W.dentSit;
    setMattress(W.bed, { key: kk.toFixed(3), at: (i) => lerp(L[i], Sd[i], kk) });
    const pk = Math.round(clamp01(1 - o.up * 1.4) * 100) / 100, P = W.pillow;
    if (P.key !== pk.toFixed(2)) { P.key = pk.toFixed(2); const A = P.geo.attributes.position.array; for (let i = 0; i < A.length / 3; i++) A[i * 3 + 1] = P.base[i * 3 + 1] - W.pillowDent[i] * pk; P.geo.attributes.position.needsUpdate = true; P.geo.computeVertexNormals(); } }
  // ---- the busy head: the vault turns to glass, the brain flickers
  { const busy = ss(T.backfires - 0.3, T.head, t) * (1 - ss(T.notAsleep - 0.8, T.notAsleep, t)), hard = 0.6 + 0.4 * ss(T.fast - 0.4, T.marches, t) * (1 - ss(T.didnt - 0.2, T.t22, t));
    for (const m of W.vault) { m.material.opacity = 1 - 0.72 * busy; m.material.depthWrite = busy < 0.5; }
    for (const m of W.brain) { m.visible = busy > 0.003; const ph = (t * m.userData.f + m.userData.ph) % 1, fl = Math.exp(-ph * 9) * (hash(Math.floor(t * m.userData.f + m.userData.ph) * 1.7 + m.userData.ph) < 0.55 * hard + 0.1 ? 1 : 0);
      m.material.opacity = busy * 0.92; m.material.emissiveIntensity = busy * (0.05 + 2.4 * fl); } }
  // ---- headphones and the tape player: on from "students" to the end of the march
  { const on = s5(T.students - 0.1, T.students + 0.5, t) * (1 - s5(MARCH.t1 + 0.2, MARCH.t1 + 0.8, t)), P = W.phones, Tp = W.tape;
    P.g.visible = on > 0.001; P.g.position.copy(P.home); P.g.position.z += (1 - on) * 0.25;   // they come down onto the skull (its own +z is up when lying)
    Tp.g.visible = on > 0.001; Tp.g.position.set(0.33, BED.top + (1 - on) * 0.25, -0.05); Tp.g.rotation.y = 0.25;
    Tp.cord.visible = on > 0.98;
    if (Tp.cord.visible) { const c = P.cups[1].getWorldPosition(_v), a = c.clone().add(new THREE.Vector3(0.02, -0.06, 0.05)), b = new THREE.Vector3(0.3, BED.top + 0.004, -0.45), e = Tp.g.position.clone().add(new THREE.Vector3(-0.02, 0.012, -0.055));
      const key = c.toArray().map((x) => x.toFixed(4)).join(); if (key !== Tp.key) { Tp.key = key; Tp.cord.geometry.dispose(); Tp.cord.geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3([c, a, b, e]), 64, 0.0018, 6); } } }
  // ---- the book: on the bed, then in the hands, open
  { const B = W.book, rd = o.read, rest = new THREE.Vector3(0.3, BED.top + 0.001, 0.32);
    const R = W.rig, hr = R.arms.Right.mc.getWorldPosition(_v), hl = R.arms.Left.mc.getWorldPosition(_w), mid = hr.clone().add(hl).multiplyScalar(0.5);
    const head = R.seg.Atlas.g.getWorldPosition(new THREE.Vector3());
    const inHand = mid.clone().add(new THREE.Vector3(0, 0.03, 0));
    B.g.position.lerpVectors(rest, inHand, s5(0, 1, rd));
    const q0 = new THREE.Quaternion().setFromAxisAngle(Y, 0.4), look = head.clone().sub(inHand).normalize();
    const q1 = new THREE.Quaternion().setFromUnitVectors(Y, look); const turn = new THREE.Quaternion().setFromAxisAngle(look, Math.atan2(look.x, look.z) + Math.PI / 2); q1.premultiply(turn);
    B.g.quaternion.copy(q0).slerp(q1, s5(0, 1, rd));
    const op = ss(0.35, 0.8, rd); B.open.visible = op > 0.001; B.closed.visible = !B.open.visible;
    for (const h of B.halves) h.h.rotation.z = h.s * lerp(Math.PI / 2 - 0.02, 0.32, op); }
  // ---- warmth from a bath, rising off the bones
  { const a = 0.55 * pulse(t, T.bath, T.sooner + 1.0, 0.8); for (const m of W.steam) { m.visible = a > 0.002; m.material.uniforms.uAmt.value = a; m.rotation.y = Math.atan2(S.cam.position.x - m.position.x, S.cam.position.z - m.position.z); } }
  { const wm = 0.1 * pulse(t, T.bath, T.sooner + 0.9, 0.9); if (wm !== W.warmK) { W.warmK = wm; for (const m of W.meshes) m.material.emissiveIntensity = wm; } }
  // ---- the clock
  { const s = clockAt(t), C = W.clock, hrs = (s / H) % 12, spin = Math.abs(clockAt(t + 0.02) - s) > 30;
    C.hands.h.rotation.z = -(hrs / 12) * Math.PI * 2; C.hands.m.rotation.z = -((s % H) / H) * Math.PI * 2; C.hands.s.rotation.z = spin ? -((s % 60) / 60) * Math.PI * 2 : -tickAngle(s % 60);
    // the night on the face: 11 to 7; coffee takes 45 minutes off it
    const night = pulse(t, T.cut - 0.6, T.regular - 0.2, 0.4), lose = s5(T.fortyfive - 0.2, T.sleep2 + 0.3, t);
    // the cut-off: the arc follows the hour hand back from bedtime; then from six hours before; then the bath, 9 to 10
    const cutA = pulse(t, T.regular - 0.3, T.warm - 0.6, 0.3), bathA = pulse(t, T.warm - 0.5, T.trying - 0.3, 0.3);
    if (night > 0.002) { C.setArc(C.arc, 23 + 0.75 * lose, 7, 0.036, 0.0022); C.setArc(C.ghost, 23, 7, 0.036, 0.0011); C.arcMat.opacity = night; C.arcGhostMat.opacity = night * 0.5 * lose; }
    else if (cutA > 0.002) { const from = t < T.nhs - 0.2 ? hrs : hrs; C.setArc(C.arc, Math.min(from, 10.99), 11, 0.036, 0.0022); C.arcMat.opacity = cutA * ss(T.regular, T.regular + 0.4, t); C.arcGhostMat.opacity = 0;
      if (t > T.nhs - 0.2) { C.setArc(C.ghost, 14.2, 23, 0.036, 0.0011); C.arcGhostMat.opacity = cutA * 0.5; } }
    else if (bathA > 0.002) { C.setArc(C.arc, 21, 22, 0.036, 0.0026); C.arcMat.opacity = bathA; C.arcGhostMat.opacity = 0; }
    else { C.arcMat.opacity = 0; C.arcGhostMat.opacity = 0; }
    C.lipMat.emissiveIntensity = 0; }
  // ---- the timer
  { const D = W.timer, o2 = timerAt(t);
    D.N.n.rotation.y = -ANG(o2.v); D.G.n.rotation.y = -ANG(o2.g); D.G.mat.opacity = o2.gO; D.G.n.visible = o2.gO > 0.002;
    D.N.mat.opacity = 1 - ss(T.logo - 0.6, T.logo - 0.2, t);
    setArc(D.A.band, 10, 20, 0.9 * o2.band); setArc(D.A.extra, 15, o2.extraV, 0.9 * o2.extra);
    setArc(D.A.drop, o2.drop[0], o2.drop[1], 0.9 * o2.dropO); setArc(D.A.zone, 30, 45, 0.85 * o2.zone);
    setArc(D.A.set, 10, 20, o2.set * (1 - ss(T.logo - 0.6, T.logo - 0.2, t)));
    D.faceMat.emissiveIntensity = 0.06 + 0.1 * o2.glow; D.faceMat.opacity = 1 - 0.85 * ss(T.settings, T.logo - 0.2, t);
    D.dots.forEach((m, i) => { const a = clamp01(o2.dots * 20 - i); m.material.opacity = a; m.visible = a > 0.002; m.scale.setScalar(Math.max(0.001, outBack(a, 2))); });
    const logoK = s5(T.final + 0.4, T.logo - 0.25, t); D.logo.set({ weight: logoK, white: logoK, hours: 0, hand: ss(T.logo - 0.4, T.logo - 0.15, t), handScale: outBack(clamp01((t - (T.logo - 0.4)) / 0.35), 1.8) }); }
  // ---- the cup: there for the coffee lines, then it sinks into the table; the diary rises in its place
  { const c = pulse(t, -1, T.warm - 0.3, 0.6) ; W.cup.g.position.y = CUP.y - 0.09 * (1 - c); W.cup.g.visible = c > 0.001; W.cup.GLOW.uGlow.value = 0; W.cup.GLOW.uTime.value = t;
    const d = s5(T.nights - 0.4, T.nights + 0.3, t) * (1 - s5(T.final, T.final + 0.6, t)); W.diary.g.position.y = DIARY.y - 0.01 * (1 - d); W.diary.g.visible = d > 0.002;
    drawDiary(W.diary, 13 * clamp01((t - T.nights) / (T.months + 0.4 - T.nights))); }
  // ---- the phone: a notification at the start; turned face down at "away from screens"
  { const P = W.phone, lit = pulse(t, 0.55, 2.6, 0.15) * 0.9 + 0.12 * (1 - ss(2.6, 3.2, t)), fl = s5(T.away, T.away + 0.5, t);
    P.screenMat.color.setScalar(lit); P.g.rotation.z = Math.PI * fl; P.g.position.y = PHONE.y + 0.03 * Math.sin(Math.PI * fl) + 0.0078 * fl; }
  // ---- light: night; the afternoon when the clock goes back; the lamp for reading; dark at the very end
  { const s = clockAt(t), hr = (s / H) % 24, day = ss(8, 9.5, hr) * (1 - ss(18.6, 20.4, hr)), gold = ss(15.2, 17.2, hr) * (1 - ss(18.6, 19.6, hr)), fig = 1 - endDark;
    const sunUp = lerp(0.6, 1.0, ss(13, 15, hr) * (1 - ss(15, 18.5, hr)));
    W.key.position.set(lerp(2.6, 2.4, day), lerp(2.6, 1.6 + 1.6 * sunUp, day), lerp(-0.6, -1.2, day));
    W.key.color.setRGB(lerp(0.72, 1.0, day), lerp(0.78, lerp(0.93, 0.78, gold), day), lerp(1.0, lerp(0.82, 0.55, gold), day));
    W.key.intensity = lerp(24, 34, day) * fig;
    const lamp = pulse(t, T.quiet - 0.6, T.sleepy + 0.4, 0.25); W.lampLight.intensity = 1.6 * lamp * fig; W.lamp.shadeMat.emissiveIntensity = 0.9 * lamp; W.lamp.bulbMat.color.setScalar(1.2 * lamp);
    W.rim.intensity = 2.6 * fig; W.fill.intensity = (0.45 + 1.0 * day) * fig; W.tableLight.intensity = 3.2 * fig * (1 - day * 0.6);
    S.tableMat.color.setScalar(0.35 * (1 - endDark * 0.9) * (1 + 0.6 * day)); scene.environmentIntensity = (0.1 + 0.45 * day) * (1 - endDark); S.reflAmt = 0.5 * (1 - endDark);
    if (S.cfg.dbg) { const d = S.cfg.dbg; if (d.key) W.key.intensity = d.key; if (d.only) { W.rim.intensity = W.fill.intensity = W.tableLight.intensity = 0; scene.environmentIntensity = 0; } }
    S.bg.setRGB(lerp(0.027, lerp(0.17, 0.2, gold), day), lerp(0.031, lerp(0.15, 0.14, gold), day), lerp(0.039, lerp(0.13, 0.1, gold), day)); S.fog.color.copy(S.bg);  }
}

// ------------------------------------------------------------------ the words on screen
const CAPS = [
  { t0: 0.35, t1: 2.0, top: 300, size: 100, html: 'Can’t <em>fall asleep?</em>' },
  { t0: 2.16, t1: 4.2, top: 300, size: 88, html: 'Here’s what’s<br>been <em>measured</em>' },
  { t0: 4.50, t1: 7.3, top: 292, size: 84, html: 'Normal: about<br><em>10 to 20 minutes</em>' },
  { t0: 7.53, t1: 10.45, top: 292, size: 80, html: 'Out within a minute:<br>maybe <em>short on sleep</em>' },
  { t0: 10.64, t1: 12.3, top: 300, size: 100, html: 'Not a <em>talent</em>' },
  { t0: 12.65, t1: 17.3, top: 292, size: 78, html: 'In studies, caffeine<br>added about <em>9 minutes</em><br>to falling asleep' },
  { t0: 17.52, t1: 20.7, top: 292, size: 84, html: 'and cut about<br><em>45 minutes</em> of sleep' },
  { t0: 21.19, t1: 27.15, top: 292, size: 78, html: 'A regular cup: one<br>review’s cut-off, <em>almost</em><br><em>9 hours</em> before bed' },
  { t0: 27.37, t1: 29.4, top: 300, size: 96, html: 'The NHS says <em>six</em>' },
  { t0: 29.76, t1: 33.6, top: 292, size: 80, html: 'A warm bath or shower,<br><em>1 to 2 hours</em> before bed' },
  { t0: 33.78, t1: 35.8, top: 300, size: 92, html: 'gets you there <em>sooner</em>' },
  { t0: 36.17, t1: 39.3, top: 292, size: 84, html: 'Trying hard <em>backfires</em><br>when your head is busy' },
  { t0: 39.59, t1: 43.5, top: 292, size: 80, html: 'Told to fall asleep fast,<br>with <em>marches</em> playing:' },
  { t0: 43.69, t1: 45.6, top: 300, size: 92, html: '<em>34 minutes</em>, reported' },
  { t0: 45.78, t1: 48.8, top: 300, size: 92, html: 'Didn’t try: <em>22</em>' },
  { t0: 49.33, t1: 51.7, top: 292, size: 84, html: 'Not asleep after<br><em>20 minutes?</em>' },
  { t0: 51.85, t1: 52.5, top: 300, size: 104, html: '<em>Get up</em>' },
  { t0: 52.59, t1: 54.9, top: 292, size: 84, html: 'Something quiet,<br><em>away from screens</em>' },
  { t0: 55.02, t1: 57.2, top: 300, size: 88, html: 'Back when<br>you’re <em>sleepy</em>' },
  { t0: 57.60, t1: 62.2, top: 292, size: 80, html: 'Part of <em>CBT for insomnia</em>,<br>the first-line treatment' },
  { t0: 62.44, t1: 68.8, top: 292, size: 80, html: 'Across 20 trials: about<br><em>19 minutes faster</em>' },
  { t0: 69.36, t1: 73.2, top: 292, size: 76, html: 'Over 30 minutes,<br>3 nights a week,<br>for <em>3 months?</em>' },
  { t0: 73.41, t1: 74.85, top: 300, size: 92, html: 'That may be <em>insomnia</em>' },
  { t0: 74.99, t1: 76.7, top: 300, size: 100, html: 'See a <em>doctor</em>' },
  { t0: 77.17, t1: 99, top: 360, size: 96, html: 'Back to<br><em>factory settings.</em>' },
];
const OVL = {};
function overlayInit(S) {
  const O = S.O, tag = (cls, txt2, size, bsize) => { const e = O.tag(cls, txt2); e.style.fontSize = size + 'px'; const b = e.querySelector('b'); if (b && bsize) b.style.fontSize = bsize + 'px'; return e; };
  OVL.normal = tag('tag', 'Normal<b>10 to 20 min</b>', 26, 44);
  OVL.minute = tag('tag', 'Under a minute<b>maybe sleep debt</b>', 24, 40);
  OVL.caf = tag('tag', 'Caffeine<b>+9 min to fall asleep</b>', 24, 40);
  OVL.lost = tag('tag', 'Sleep<b>45 min less</b>', 24, 40);
  OVL.cut = tag('tag', 'One review<b>8.8 hours before bed</b>', 24, 40);
  OVL.nhs = tag('tag', 'NHS<b>6 hours</b>', 24, 44);
  OVL.bath = tag('tag', 'Warm bath or shower<b>1 to 2 hours before</b>', 24, 40);
  OVL.tried = tag('tag', 'Tried hard<b>34 min</b>', 26, 48);
  OVL.didnt = tag('tag', 'Didn’t try<b>22 min</b>', 26, 48);
  OVL.twenty = tag('tag', 'Still awake<b>20 min</b>', 26, 44);
  OVL.cbt = tag('tag', 'CBT for insomnia<b>first-line</b>', 24, 40);
  OVL.trials = tag('tag', 'Trials<b>20</b>', 24, 48);
  OVL.faster = tag('tag', 'About<b>19 min faster</b>', 24, 44);
  OVL.long = tag('tag', 'Over 30 min<b>3 nights a week · 3 months</b>', 22, 36);
}
function overlay(S, t) {
  const D = DIAL, at = (v, r = DIAL_R * 1.15) => { const a = ANG(v); return new THREE.Vector3(D.x + Math.sin(a) * r, D.y + 0.014, D.z - Math.cos(a) * r); };
  place(S, OVL.normal, at(15), 50, -40, pulse(t, T.ten, T.out - 0.2));
  place(S, OVL.minute, new THREE.Vector3(0.56, 0.3, -0.5), 30, 0, pulse(t, T.short - 0.2, T.inStudies - 0.3));
  place(S, OVL.caf, at(24), 40, -60, pulse(t, T.nine, T.cut + 0.6));
  { const C = W.clock.g.position; place(S, OVL.lost, new THREE.Vector3(C.x + 0.05, C.y + 0.07, C.z + 0.03), 40, -30, pulse(t, T.fortyfive - 0.1, T.regular - 0.4)); }
  { const C = W.clock.g.position; place(S, OVL.cut, new THREE.Vector3(C.x, C.y + 0.02, C.z + 0.04), 50, 30, pulse(t, T.almost - 0.2, T.nhs - 0.1));
    place(S, OVL.nhs, new THREE.Vector3(C.x, C.y + 0.02, C.z + 0.04), 50, 30, pulse(t, T.six - 0.3, T.warm - 0.6));
    place(S, OVL.bath, new THREE.Vector3(C.x, C.y + 0.17, C.z), -80, -60, pulse(t, T.oneTwo - 0.2, T.bed2 + 0.4)); }
  place(S, OVL.tried, at(34), 40, -50, pulse(t, T.t34, T.notAsleep - 0.4));
  place(S, OVL.didnt, at(22), -230, -90, pulse(t, T.t22 - 0.3, T.notAsleep - 0.4));
  place(S, OVL.twenty, at(20), 40, -40, pulse(t, T.twenty2, T.getUp + 0.3));
  place(S, OVL.cbt, at(40, DIAL_R * 1.5), -40, -170, pulse(t, T.cbt - 0.2, T.across - 0.3));
  place(S, OVL.trials, at(-1, DIAL_R * 1.5), -120, 10, pulse(t, T.trials, T.fell - 0.2));
  place(S, OVL.faster, at(22, DIAL_R * 1.8), -170, -90, pulse(t, T.nineteen, T.over - 0.5));
  place(S, OVL.long, at(36, DIAL_R * 1.4), -60, -170, pulse(t, T.thirty, T.final - 0.3));
  const c = new THREE.Vector3(D.x, D.y + 0.0142, D.z);
  logoEnd(S, t, { t0: T.logo, center: c, edge: c.clone().add(new THREE.Vector3(0, 0, LOGO_R)) });
}

makeFilm({
  T, caps: CAPS, subs: [], build, update, pose: camPose, overlay, overlayInit, focus: focusAt,
  stage: { bg: 0x07080a, reflSize: 6, env: 0.1, far: 30 },
  aperture: [[0, 0.002], [4.3, 0.004], [8.6, 0.002], [13.6, 0.003], [21.6, 0.004], [30.6, 0.002], [36.6, 0.003], [43, 0.002], [46.6, 0.004], [50.8, 0.0015], [59, 0.004], [70, 0.003], [77.9, 0.003]],
  bloom: [[0, 0.42], [36, 0.55], [49, 0.45], [77, 0.55]],
  fast: [[8.8, 9.6, 2], [21.6, 24.6, 3], [27.5, 29.2, 2], [29.6, 30.8, 2], [35.2, 36.2, 2], [42.5, 48.3, 2], [51.6, 53.2, 2], [56.3, 57.8, 2]],
});

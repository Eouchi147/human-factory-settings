// Human Factory Settings · Film 8 "How can I fall asleep faster?" (new direction, 6 Oct 2026) · one continuous shot, 9:16.
// From the ceiling: a skeleton in bed at night, staring straight up at us. It orders itself to sleep the way you order
// anything: it slaps the service bell on the bedside table, again and again. Nothing comes. The bell sinks into the table
// and a sleep timer rises in its place: on its own, 10 to 20 minutes. A busy head flickers inside a glass skull;
// headphones play a march and one foot keeps time (the gag); told to fall asleep fast: 34 minutes; not trying: 22. After
// 20 minutes awake he gets up, sits on the edge of the bed and reads by the lamp; the phone turns itself face down; a yawn,
// back to bed. The clock runs backwards on "backwards". Warmth rises off the bones (a bath, 9 to 10 p.m. on the clock).
// Over 30 minutes, three nights a week, for three months: a sleep diary fills; see a doctor, and don't wait that long if
// life is hard to cope with (the diary empties). The timer becomes the logo.
import { THREE, ORANGE, ss, s5, lerp, clamp01, hash, camTrack, phys, shadows, spot, RoundedBoxGeometry,
  loadAnatomy, V3, place, logoEnd, makeFilm, outBack, stamp, stampCanvas, stampSpot, noiseTex, TIME, keys } from '../kit.js';
import { buildRig, skeletonKind, legIK, bendSpine, poseArm, worldVerts, avgV, clearArms } from '../rig.js';
import { makeClock, makePhone, makeLamp, makeLogoRing, tickAngle } from '../props.js';

//@HANDS@

// ------------------------------------------------------------------ timing, from the voice guide (word starts)
const T = {
  end: 73.6, logo: 71.08,
  you: 0.35, lie: 0.80, bed: 1.15, hour: 1.59, staring: 1.91, ceiling: 2.88, and1: 3.27, ordering: 3.56, yourself: 4.04, fall: 4.74, asleep: 5.02, as: 5.65, if: 6.31, sleep: 6.40, takes: 6.62, orders: 7.10,
  lets: 8.18, fix: 8.70, that: 9.03,
  your: 10.04, body: 10.48, built: 11.09, own: 12.24, and0: 12.57, most: 13.24, people: 13.65, takes2: 14.41, about: 14.82, ten: 15.22, twenty: 15.87, minutes: 16.26,
  and2: 17.55, head: 18.41, busy: 18.74, trying: 18.86, hard: 19.27, makes: 19.63, worse: 20.16,
  in: 21.26, study: 21.85, marching: 22.45, music: 22.76, playing: 23.48, people2: 23.89, told: 24.29, fast: 25.58, said: 26.05, t34: 26.85, minutes2: 27.53,
  and3: 28.03, people3: 28.41, werent: 28.98, trying2: 29.22, said2: 29.81, t22: 30.15,
  so: 31.65, still: 32.46, awake: 32.62, after: 32.87, twenty2: 33.19, minutes3: 33.62, get: 33.84, up: 34.16, something: 34.74, quiet: 35.36, dim: 35.76, light: 35.96,
  with: 36.31, no: 36.82, screens: 37.09, and4: 37.71, go: 37.98, back: 38.42, bed2: 38.74, when: 39.03, sleepy: 39.57,
  it: 40.88, sounds: 41.19, backwards: 41.64, but: 42.09, part: 42.37, treatment: 42.86, doctors: 43.84, recommend: 44.59, most2: 45.13, strongly: 45.49, insomnia: 46.19,
  a: 47.83, warm: 48.25, bath: 48.55, shower: 48.85, one: 49.25, two: 49.58, hours: 49.81, before: 50.27, bed3: 50.74, also: 51.26, helped: 51.64, sooner: 53.39, studies: 53.93,
  if2: 55.54, over: 56.50, thirty: 56.72, asleep2: 57.77, three: 58.26, more: 59.01, nights: 59.06, week: 59.76, three2: 60.45, months: 60.76, see: 61.19, doctor: 61.47, insomnia2: 62.45,
  and5: 63.80, dont: 64.24, wait: 64.52, long: 64.89, poor: 65.24, life: 66.36, hard2: 66.80, cope: 67.31, with2: 67.59,
  final: 68.82, factory: 70.03, settings: 70.40,
};
const H = 3600;

// ------------------------------------------------------------------ the set (metres; the bed runs along z, its head at -z; +x is the bedside)
const W = {}; window.HFS_W = W;
const BED = { x0: -0.48, x1: 0.48, z0: -1.06, z1: 1.02, top: 0.5, base: 0.3 };
const TBL = { x: 0.83, z: -0.83, w: 0.56, d: 0.46, top: 0.56 };
const DIAL = new THREE.Vector3(0.75, TBL.top, -0.72), DIAL_R = 0.078, LOGO_R = 0.06;   // the sleep timer, flat on the table
const BELL = new THREE.Vector3(0.665, TBL.top, -0.705);                                  // the service bell, where the left hand reaches
const BOOK = new THREE.Vector3(0.73, TBL.top, -0.74), BOOK_RY = 2.3;
const CLOCK = new THREE.Vector3(0.68, TBL.top, -0.985), CLOCK_RY = 0.6, LAMP = new THREE.Vector3(1.0, TBL.top, -0.95);
const PHONE_AT = new THREE.Vector3(0.99, TBL.top, -0.715), DIARY = new THREE.Vector3(0.985, TBL.top, -0.72);
const WALL_Z = -1.2;
const X = new THREE.Vector3(1, 0, 0), Y = new THREE.Vector3(0, 1, 0), Z = new THREE.Vector3(0, 0, 1);
const pulse = (t, a, b, r = 0.35) => ss(a, a + r, t) * (1 - ss(b - r, b, t));

function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h, c);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.userData.canvas = c; return t;
}
function txt(x, s, px, py, { font = '800 100px Archivo', color = '#fff', align = 'center', track = 0, base = 'middle' } = {}) {
  x.font = font; x.letterSpacing = `${track}px`; x.fillStyle = color; x.textAlign = align; x.textBaseline = base; x.fillText(s, px, py);
}
function brainKind(p) {   // the brain (for the busy head): the big pieces of the nervous system inside the skull
  if (p.system !== 'nervous') return undefined;
  const cy = (p.bounds[0][1] + p.bounds[1][1]) / 2;
  if (cy < 1.45 || p.vertexCount < 400 || /nerve|optic|tentorium/i.test(p.name)) return null;
  return 'brain';
}

// ------------------------------------------------------------------ the bed (films 1 and 8): frame, headboard, a mattress that takes the body's shape, a pillow
const MAT = { nx: 97, nz: 209, r: 0.035 };
function edgeDrop(x, z) {
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
  return { g, top, geo, base: Float32Array.from(pos), edge, key: '', frame, box };
}
function imprint(pts, { x0, x1, z0, z1, nx, nz }, surf, { gap = 0.004, dil = 2, blur = 3, max = 0.07 } = {}) {
  const d = new Float32Array(nx * nz);
  for (let p = 0; p < pts.length; p += 3) {
    const x = pts[p], y = pts[p + 1], z = pts[p + 2]; const i = Math.round(((x - x0) / (x1 - x0)) * (nx - 1)), j = Math.round(((z - z0) / (z1 - z0)) * (nz - 1));
    if (i < 0 || j < 0 || i >= nx || j >= nz) continue;
    const s = surf(x, z), k = j * nx + i; d[k] = Math.max(d[k], Math.min(max, s - (y - gap)));
  }
  const pass = (src, r, op) => { const out = new Float32Array(nx * nz);
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { let a = 0, ws = 0;
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
function makePillow(scene, c, size) {
  const geo = new THREE.SphereGeometry(1, 160, 80), P = geo.attributes.position, sp = (u, e) => Math.sign(u) * Math.pow(Math.abs(u), e);
  for (let i = 0; i < P.count; i++) P.setXYZ(i, sp(P.getX(i), 0.32) * size.x, sp(P.getY(i), 0.75) * size.y, sp(P.getZ(i), 0.32) * size.z);
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, phys({ color: 0x3a3f48, roughness: 0.9, sheen: 0.7, sheenColor: new THREE.Color(0x9aa3b6), sheenRoughness: 0.6 }));
  m.position.copy(c); m.castShadow = m.receiveShadow = true; m.layers.enable(1); scene.add(m);
  return { m, geo, base: Float32Array.from(P.array), key: '' };
}
function makeTable(scene) {
  const g = new THREE.Group(); g.position.set(TBL.x, 0, TBL.z); scene.add(g);
  const wood = phys({ color: 0x15100c, roughness: 0.45, clearcoat: 0.5, clearcoatRoughness: 0.3 });
  const top = new THREE.Mesh(new RoundedBoxGeometry(TBL.w, 0.03, TBL.d, 4, 0.008), wood); top.position.y = TBL.top - 0.015; g.add(top);
  const body = new THREE.Mesh(new RoundedBoxGeometry(TBL.w - 0.03, 0.34, TBL.d - 0.03, 4, 0.01), wood); body.position.y = TBL.top - 0.03 - 0.17; g.add(body);
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.01, TBL.top - 0.37, 16), wood); leg.position.set(x * (TBL.w / 2 - 0.04), (TBL.top - 0.37) / 2, z * (TBL.d / 2 - 0.04)); g.add(leg); }
  shadows(g); g.traverse((o) => o.layers.enable(1));
  return g;
}

// ------------------------------------------------------------------ a window over the bed: night, a few stars
function makeWindow(scene) {
  const g = new THREE.Group(); g.position.set(0, 1.6, WALL_Z + 0.012); scene.add(g);
  const frameMat = phys({ color: 0x0d0e10, roughness: 0.5, clearcoat: 0.4 }), W0 = 0.86, H0 = 0.62;
  const bar = (w, h, x, y) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.03), frameMat); m.position.set(x, y, 0.013); m.castShadow = true; g.add(m); };
  bar(W0 + 0.06, 0.04, 0, H0 / 2 + 0.014); bar(W0 + 0.06, 0.04, 0, -H0 / 2 - 0.014); bar(0.04, H0 + 0.06, -W0 / 2 - 0.014, 0); bar(0.04, H0 + 0.06, W0 / 2 + 0.014, 0);
  bar(0.022, H0, -W0 / 6, 0); bar(0.022, H0, W0 / 6, 0); bar(W0, 0.022, 0, 0);
  const sky = canvasTex(256, 184, (x, w, h) => {
    const gr = x.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgb(10,16,34)'); gr.addColorStop(1, 'rgb(18,26,51)'); x.fillStyle = gr; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 26; i++) { x.fillStyle = `rgba(220,228,255,${(0.25 + 0.5 * hash(i * 3.7)).toFixed(3)})`; x.fillRect(hash(i * 1.3) * w, hash(i * 2.1 + 5) * h * 0.8, 1.6, 1.6); } });
  const paneMat = new THREE.MeshBasicMaterial({ map: sky });
  const pane = new THREE.Mesh(new THREE.PlaneGeometry(W0, H0), paneMat); g.add(pane);
  const sill = new THREE.Mesh(new RoundedBoxGeometry(W0 + 0.12, 0.025, 0.08, 3, 0.006), frameMat); sill.position.set(0, -H0 / 2 - 0.04, 0.03); g.add(sill);
  return { g, paneMat };
}

// ------------------------------------------------------------------ the service bell: a black base, a chrome dome, a plunger that goes down when struck
function makeBell() {
  const g = new THREE.Group();
  const chrome = new THREE.MeshPhysicalMaterial({ color: 0xdcdde1, metalness: 1, roughness: 0.14, clearcoat: 0.6, clearcoatRoughness: 0.1 });
  const black = phys({ color: 0x101113, roughness: 0.38, clearcoat: 0.5 });
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.046, 0.049, 0.014, 96), black); base.position.y = 0.007; g.add(base);
  const DH = 0.041 * 0.8;
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.041, 96, 48, 0, Math.PI * 2, 0, Math.PI / 2), chrome); dome.position.y = 0.014; dome.scale.y = 0.8; g.add(dome);
  const plunger = new THREE.Group(); plunger.position.y = 0.014 + DH; g.add(plunger);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.0026, 0.0026, 0.012, 24), chrome); stem.position.y = 0.006; plunger.add(stem);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.0068, 32, 16), chrome); knob.scale.y = 0.7; knob.position.y = 0.0122; plunger.add(knob);
  shadows(g); g.traverse((o) => o.layers.enable(1));
  return { g, plunger, top: 0.014 + DH + 0.0122 + 0.0068 * 0.7 };
}

// ------------------------------------------------------------------ the sleep timer: minutes to fall asleep, 0 to 45 over 270 degrees (twelve o'clock, toward the headboard, is 22.5)
const ANG = (v) => ((-135 + 6 * v) * Math.PI) / 180;   // clockwise from twelve, seen from above
function makeTimer(scene) {
  const g = new THREE.Group(); g.position.copy(DIAL); scene.add(g);
  const dark = phys({ color: 0x121316, roughness: 0.38, clearcoat: 0.6, clearcoatRoughness: 0.25 });
  const alu = phys({ color: 0xcdcac4, metalness: 1, roughness: 0.3, clearcoat: 0.4, clearcoatRoughness: 0.3 });
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(DIAL_R + 0.012, DIAL_R + 0.015, 0.012, 128), dark); plate.position.y = 0.006; g.add(plate);
  const bezel = new THREE.Mesh(new THREE.TorusGeometry(DIAL_R + 0.003, 0.0032, 20, 160), alu); bezel.rotation.x = Math.PI / 2; bezel.position.y = 0.0125; g.add(bezel);
  const tex = canvasTex(1024, 1024, (x, w) => {
    const R = w / 2; x.fillStyle = '#0b0c0e'; x.fillRect(0, 0, w, w);
    for (let v = 0; v <= 45; v++) { const a = ANG(v), big = v % 5 === 0, r0 = R * (big ? 0.78 : 0.83), r1 = R * 0.9;
      x.strokeStyle = big ? '#e7e9ec' : '#8d9097'; x.lineWidth = big ? 7 : 3.5; x.beginPath(); x.moveTo(R + Math.sin(a) * r0, R - Math.cos(a) * r0); x.lineTo(R + Math.sin(a) * r1, R - Math.cos(a) * r1); x.stroke();
      if (v % 10 === 0) txt(x, String(v), R + Math.sin(a) * R * 0.64, R - Math.cos(a) * R * 0.64, { font: '600 74px Archivo', color: '#e7e9ec' }); }
    txt(x, 'MINUTES', R, R * 1.42, { font: '500 40px "Geist Mono"', color: '#9a9da4', track: 9 });
    txt(x, 'TO FALL ASLEEP', R, R * 1.53, { font: '500 30px "Geist Mono"', color: '#6d7077', track: 7 });
  });
  const faceMat = new THREE.MeshPhysicalMaterial({ map: tex, roughness: 0.42, clearcoat: 0.5, clearcoatRoughness: 0.2, emissive: new THREE.Color(0xffffff), emissiveMap: tex, emissiveIntensity: 0, transparent: true });
  const face = new THREE.Mesh(new THREE.CircleGeometry(DIAL_R, 128), faceMat); face.rotation.x = -Math.PI / 2; face.position.y = 0.0122; face.renderOrder = 1; g.add(face);
  const flat = new THREE.Group(); flat.rotation.x = -Math.PI / 2; flat.position.y = 0.0128; g.add(flat);
  const arc = (color, add = false) => { const m = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial({ color: color.clone(), transparent: true, opacity: 0, depthWrite: false, blending: add ? THREE.AdditiveBlending : THREE.NormalBlending, fog: false }));
    m.userData = { r0: DIAL_R * 0.905, r1: DIAL_R * 0.965, key: '' }; m.renderOrder = 2; flat.add(m); return m; };
  const A = { band: arc(new THREE.Color(0x9fb0cf)), zone: arc(new THREE.Color(0xc7cbd3)), set: arc(ORANGE.clone().multiplyScalar(1.6)) };
  const needle = (o) => { const n = new THREE.Group(); n.position.y = 0.0135 + o * 0.0006; g.add(n);
    const mat = new THREE.MeshPhysicalMaterial({ color: 0xf2f3f5, roughness: 0.35, clearcoat: 0.6, emissive: new THREE.Color(0xffffff), emissiveIntensity: 0.25, transparent: true, opacity: 1 });
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.0022, 0.0009, DIAL_R * 0.86), mat); bar.position.z = -DIAL_R * 0.43 + 0.008; n.add(bar);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.0052, 0.0052, 0.0022, 40), mat); n.add(hub); bar.renderOrder = hub.renderOrder = 3;
    return { n, mat }; };
  const N = needle(1), G = needle(0); G.mat.opacity = 0; G.mat.emissiveIntensity = 0.1;
  const logo = makeLogoRing(LOGO_R); logo.g.rotation.x = -Math.PI / 2; logo.g.position.y = 0.0142; logo.g.traverse((o) => { o.renderOrder = 4; }); g.add(logo.g);
  shadows(g); face.castShadow = false; g.traverse((o) => o.layers.enable(1));
  return { g, faceMat, A, N, G, logo };
}
function setArc(m, v0, v1, o) {   // an arc on the timer from v0 to v1 minutes
  m.material.opacity = o; m.visible = o > 0.002 && v1 - v0 > 0.01; if (!m.visible) return;
  const key = v0.toFixed(3) + '|' + v1.toFixed(3); if (key === m.userData.key) return; m.userData.key = key;
  const a0 = ANG(v0), a1 = ANG(v1);
  m.geometry.dispose(); m.geometry = new THREE.RingGeometry(m.userData.r0, m.userData.r1, 96, 1, Math.PI / 2 - a1, a1 - a0);
}

// ------------------------------------------------------------------ the sleep diary: thirteen weeks, seven nights each; three nights a week marked
const DIARY_N = [[0, 2, 5], [1, 3, 6], [0, 3, 5], [1, 4, 6], [0, 2, 4], [2, 5, 6], [1, 3, 5], [0, 4, 6], [1, 2, 5], [0, 3, 6], [2, 4, 5], [1, 3, 6], [0, 2, 5]];
function makeDiary(scene) {
  const g = new THREE.Group(); g.position.copy(DIARY); g.rotation.y = 0.45; scene.add(g);
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
    x.fillStyle = '#0d0e10'; x.fillRect(40, 60, w - 80, 380);
    x.fillStyle = '#d9d2c3'; x.fillRect(70, 90, w - 140, 120);
    txt(x, 'MARCHES', w / 2, 152, { font: '600 58px "Geist Mono"', color: '#2c2b29', track: 8 });
    for (const cx of [170, w - 170]) { x.strokeStyle = '#8a8d93'; x.lineWidth = 8; x.beginPath(); x.arc(cx, 320, 46, 0, Math.PI * 2); x.stroke(); }
    for (let i = 0; i < 4; i++) { x.fillStyle = '#4a4d54'; x.fillRect(60 + i * 104, 520, 80, 120); }
    x.fillStyle = '#eceef1'; x.beginPath(); x.moveTo(90, 555); x.lineTo(90, 605); x.lineTo(125, 580); x.fill();
  });
  const face = new THREE.Mesh(new THREE.PlaneGeometry(0.08, 0.114), new THREE.MeshPhysicalMaterial({ map: tex, roughness: 0.4, clearcoat: 0.5 }));
  face.rotation.x = -Math.PI / 2; face.position.y = 0.0262; g.add(face);
  shadows(g); g.traverse((o) => o.layers.enable(1)); g.visible = false;
  const cord = new THREE.Mesh(new THREE.BufferGeometry(), phys({ color: 0x141518, roughness: 0.5 })); cord.castShadow = true; cord.layers.enable(1); scene.add(cord); cord.visible = false;
  return { g, cord, key: '' };
}
// ------------------------------------------------------------------ a book: it rises from the table, opens, shuts and goes back in
function makeBook(scene) {
  const g = new THREE.Group(); g.position.copy(BOOK); g.rotation.y = BOOK_RY; scene.add(g);
  const cover = phys({ color: 0x5b2b25, roughness: 0.6, clearcoat: 0.2 }), paper = phys({ color: 0xe8e2d4, roughness: 0.85 });
  const halves = [];
  for (const s of [-1, 1]) {   // two halves that open about the spine (the spine runs along local z)
    const h = new THREE.Group(); g.add(h);
    const c = new THREE.Mesh(new THREE.BoxGeometry(0.124, 0.003, 0.19), cover); c.position.set(s * 0.062, 0.0015, 0); h.add(c);
    const p = new THREE.Mesh(new THREE.BoxGeometry(0.118, 0.011, 0.18), paper); p.position.set(s * 0.06, 0.0085, 0); h.add(p);
    halves.push({ h, s });
  }
  const leaf = new THREE.Group(); g.add(leaf);   // one page, turning
  const lp = new THREE.Mesh(new THREE.PlaneGeometry(0.116, 0.178), phys({ color: 0xece6d8, roughness: 0.85, side: THREE.DoubleSide })); lp.rotation.x = -Math.PI / 2; lp.position.x = 0.058; leaf.add(lp);
  leaf.position.y = 0.0145; leaf.visible = false;
  shadows(g); g.traverse((o) => o.layers.enable(1)); g.visible = false;
  return { g, halves, leaf };
}

// ------------------------------------------------------------------ warmth from a bath, rising off the bones
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
        void main(){ float t = uTime * 0.22; vec2 p = vec2(vUv.x * 2.0 + uSeed, vUv.y * 1.3 - t);
          float q = fbm(vec2(p.x * 0.55, p.y * 0.8 + uSeed * 1.3));
          p.x += (q - 0.5) * 2.4 * (0.25 + vUv.y);
          float w = fbm(p * vec2(1.0, 0.5));
          float strands = smoothstep(0.42, 0.78, w) * (0.6 + 0.4 * smoothstep(0.55, 0.8, w));
          float env = smoothstep(0.0, 0.16, vUv.y) * (1.0 - smoothstep(0.3, 1.0, vUv.y)) * smoothstep(0.0, 0.32, vUv.x) * (1.0 - smoothstep(0.68, 1.0, vUv.x));
          gl_FragColor = vec4(vec3(1.0, 0.95, 0.9), strands * env * uAmt); }`,
      transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false, blending: THREE.AdditiveBlending,
    });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.55), mat); m.position.set((hash(i * 2.3) - 0.5) * 0.22, BED.top + 0.33, -0.74 + i * 0.15); m.renderOrder = 7; m.visible = false; scene.add(m); out.push(m);
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
  W.brain.forEach((m, i) => { m.material = m.material.clone(); m.material.transparent = true; m.material.opacity = 0; m.visible = false; m.castShadow = false; m.material.color.set(0x5d5f6b); m.material.sheen = 0.3; m.material.emissive = new THREE.Color(0xb8ccff); m.userData.ph = hash(i * 3.7) * 40; m.userData.f = 1.5 + hash(i * 1.9) * 4; });
  W.vault = meshes.filter((m) => /frontal bone|parietal bone|occipital bone|temporal bone|sphenoid bone/i.test(m.userData.name));
  for (const m of W.vault) { m.material = m.material.clone(); m.material.transparent = true; }
  // hands
  W.wristL = makeWrist(R, 'Left'); W.wristR = makeWrist(R, 'Right');
  W.handL = rigHand(R, 'Left', W.wristL); W.handR = rigHand(R, 'Right', W.wristR); W.handL.wr = W.wristL; W.handR.wr = W.wristR;
  // the lower jaw on its own hinge (a yawn)
  { const jaw = meshes.filter((m) => /^mandible$|lower .*tooth/i.test(m.userData.name)), mv = worldVerts(R.byName.get('Mandible'), 2);
    let top = -9; for (const v of mv) top = Math.max(top, v.y); const hi = mv.filter((v) => v.y > top - 0.012), zc = hi.reduce((s, v) => s + v.z, 0) / hi.length;
    const TMJ = new THREE.Vector3(0, top - 0.008, Math.min(...hi.filter((v) => v.z < zc).map((v) => v.z)) + 0.012);
    const seg = R.seg.Atlas; W.jaw = new THREE.Group(); W.jaw.position.copy(TMJ).sub(seg.pivot); seg.g.add(W.jaw);
    for (const m of jaw) { m.removeFromParent(); m.position.copy(m.userData.home).sub(TMJ); W.jaw.add(m); }
    W.TMJ = TMJ; }
  // the skull's size, for the headphones
  { const sk = meshes.filter((m) => /parietal bone|temporal bone/i.test(m.userData.name)).flatMap((m) => worldVerts(m, 3));
    let hx = 0, topY = -9; for (const v of sk) { hx = Math.max(hx, Math.abs(v.x)); topY = Math.max(topY, v.y); }
    W.skullBox = { hx, topY, earY: W.TMJ.y + 0.03, earZ: W.TMJ.z - 0.02 }; }
  // ---- the factory stamp: on the front of the breastbone (seen from the ceiling)
  { const st = R.byName.get('Body of sternum'); st.material = st.material.clone();
    W.stampSpot = stampSpot(st, { from: [0, 0.006, 0.12], dir: [0, 0, -1], spread: 0.004 });
    if (W.stampSpot) W.stamp = stamp(st, { canvas: stampCanvas(['HUMAN FACTORY', 'SETTINGS'], '', { frame: false }), center: W.stampSpot.center, normal: W.stampSpot.normal, up: [0, 1, 0], width: 0.04, depth: 0.03, opacity: 0.6 }); }
  // ---- the set
  W.bed = makeBed(scene);
  W.tableG = makeTable(scene);
  { const wall = new THREE.Mesh(new THREE.PlaneGeometry(9, 3.2), phys({ color: 0x1b1d22, roughness: 0.92, roughnessMap: noiseTex(9, 256, 0.85, 1.0, 30) })); wall.position.set(0, 1.6, WALL_Z); wall.receiveShadow = true; scene.add(wall); }
  W.window = makeWindow(scene);
  W.clock = makeClock(); W.clock.g.position.copy(CLOCK); W.clock.g.rotation.y = CLOCK_RY; W.clock.g.scale.setScalar(1.25); scene.add(W.clock.g);
  W.clock.arcMat.color.set(0x4a5a78); W.clock.arcGhostMat.color.set(0x9aa0aa); W.clock.markMat.color.set(0xd9dce2); W.clock.marker.rotation.z = -(11 / 12) * Math.PI * 2;   // bedtime, 11
  W.clock.g.traverse((o) => o.layers.enable(1));
  W.timer = makeTimer(scene); W.timer.g.visible = false;
  W.bell = makeBell(); W.bell.g.position.copy(BELL); W.bell.g.rotation.y = 0.4; scene.add(W.bell.g);
  W.lamp = makeLamp(); W.lamp.g.position.copy(LAMP); scene.add(W.lamp.g); W.lamp.g.traverse((o) => o.layers.enable(1));
  W.lampLight = new THREE.PointLight(0xffc98a, 0, 3.0, 2); W.lampLight.position.copy(LAMP).add(new THREE.Vector3(0, 0.27, 0)); scene.add(W.lampLight);
  W.phone = makePhone(); W.phone.g.position.copy(PHONE_AT); W.phone.g.rotation.y = 0.32; scene.add(W.phone.g); W.phone.g.traverse((o) => o.layers.enable(1));
  { const cv = document.createElement('canvas'); cv.width = 590; cv.height = 1220; const x = cv.getContext('2d');
    const bg = x.createLinearGradient(0, 0, 0, 1220); bg.addColorStop(0, '#1b2440'); bg.addColorStop(1, '#090c16'); x.fillStyle = bg; x.fillRect(0, 0, 590, 1220);
    txt(x, '00:31', 295, 360, { font: '300 190px Archivo', color: 'rgba(255,255,255,0.95)' }); txt(x, 'Thursday 5 November', 295, 200, { font: '500 34px Archivo', color: 'rgba(255,255,255,0.75)' });
    x.fillStyle = 'rgba(255,255,255,0.16)'; x.beginPath(); x.roundRect(40, 560, 510, 150, 34); x.fill();
    txt(x, '3 new notifications', 295, 635, { font: '500 38px Archivo', color: 'rgba(255,255,255,0.9)' });
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; W.phone.screenMat.map = tex; W.phone.screenMat.needsUpdate = true; }
  W.book = makeBook(scene);
  W.diary = makeDiary(scene); drawDiary(W.diary, 0); W.diary.g.visible = false;
  W.phones = makePhones(R, W.skullBox);
  W.tape = makeTape(scene);
  W.steam = makeSteam(scene);
  // ---- lying and sitting: measure the pose, place the body, press the bed (as in films 1 and 8)
  W.qLie = new THREE.Quaternion().setFromAxisAngle(X, -Math.PI / 2);
  poseRig(restPose()); W.body.quaternion.copy(W.qLie); W.body.position.set(0, 0, 0); W.body.updateMatrixWorld(true);
  const bb = (re) => { const b = new THREE.Box3(); for (const m of W.meshes) if (re.test(m.userData.name)) b.expandByObject(m); return b; };
  const heel = bb(/calcaneus/i), skull = bb(/parietal bone|occipital bone|frontal bone/i), occ = bb(/occipital bone/i);
  W.lieP = new THREE.Vector3(0, BED.top - 0.012 - heel.min.y, BED.z0 + 0.075 - skull.min.z);
  const occY = occ.min.y + W.lieP.y, occZ = (occ.min.z + occ.max.z) / 2 + W.lieP.z;
  const ph = (occY + 0.04 - BED.top) / 2;
  W.pillow = makePillow(scene, new THREE.Vector3(0, BED.top + ph - 0.004, occZ - 0.03), new THREE.Vector3(0.3, ph, 0.19));
  const hipB = new THREE.Box3(); for (const m of W.meshes) if (/hip bone/i.test(m.userData.name)) for (const v of worldVerts(m, 3)) hipB.expandByPoint(v);
  W.qSit = new THREE.Quaternion().setFromAxisAngle(Y, Math.PI / 2);
  W.sitP = new THREE.Vector3(BED.x1 - 0.13, BED.top - 0.025 + (R.P0.y - hipB.min.y), -0.32);   // sitting up nearer the head of the bed, by the table
  const grab = () => { W.body.updateMatrixWorld(true); const out = []; const v = new THREE.Vector3();
    for (const m of W.meshes) { const P = m.geometry.attributes.position; for (let i = 0; i < P.count; i += 2) { v.fromBufferAttribute(P, i).applyMatrix4(m.matrixWorld); out.push(v.x, v.y, v.z); } } return out; };
  const grid = { x0: BED.x0, x1: BED.x1, z0: BED.z0, z1: BED.z1, nx: MAT.nx, nz: MAT.nz }, surf = (x, z) => BED.top - edgeDrop(x, z);
  W.body.position.copy(W.lieP); const lyingPts = grab();
  W.dentLie = imprint(lyingPts, grid, surf, { gap: 0.002, dil: 2, blur: 4, max: 0.08 });
  // ---- the bell: where the left hand slaps it, solved once, lying. The palm comes down flat on the knob (the flesh not
  // drawn: the bones stop 10 mm above it), the fingers pointing on, away from the body
  { const Hh = W.handL, A = R.arms.Left, sh = A.arm.getWorldPosition(new THREE.Vector3());
    const knob = new THREE.Vector3(BELL.x, TBL.top + W.bell.top, BELL.z);
    const along = new THREE.Vector3(knob.x - sh.x, 0, knob.z - sh.z).normalize();
    W.zHead = (() => { const b = bb(/frontal bone|parietal bone|occipital bone|temporal bone|sphenoid|maxilla|zygomatic|nasal bone|mandible|tooth/i); return { c: b.getCenter(new THREE.Vector3()), r: b.getSize(new THREE.Vector3()).multiplyScalar(0.5).addScalar(0.03) }; })();
    const tbl = { c: new THREE.Vector3(TBL.x, TBL.top - 0.2, TBL.z), r: new THREE.Vector3(TBL.w / 2 + 0.02, 0.21, TBL.d / 2 + 0.02) };
    const ko = keepOut(R, 'Left', Hh, [W.zHead, tbl]);
    const hitAt = knob.clone().addScaledVector(along, 0.062); hitAt.y = knob.y - 0.004 + 0.015 - 0.024;   // the palm 15 mm over the pressed knob (the thumb's base clears the dome)
    const upAt = hitAt.clone(); upAt.y += 0.07;
    const aims = [{ v: Hh.n, to: new THREE.Vector3(0, -1, 0), w: 0.5 }, { v: Hh.fdir, to: along, w: 0.25 }];
    Hh.curl(0.1);
    const starts = [{ dir: [1, 0.15, 0.3], twist: 0, elbow: 0.6 }, { dir: [1, 0.3, 0.5], twist: 0.6, elbow: 0.9 }, { dir: [0.9, 0.0, 0.2], twist: -0.6, elbow: 0.4 }, { dir: [1, 0.2, 0.6], twist: 1.2, elbow: 1.1 }, { dir: [0.8, 0.3, 0.7], twist: -1.2, elbow: 1.3 }];
    W.slapHit = solveHand(R, 'Left', Hh, hitAt, starts[0], aims, () => ko(), starts);
    W.slapUp = solveHand(R, 'Left', Hh, upAt, W.slapHit, aims, () => ko(), [W.slapHit, ...starts]);
    W.bellInfo = { sh: sh.toArray().map((v) => +v.toFixed(3)), hit: W.slapHit.dbg, up: W.slapUp.dbg, hitE: +W.slapHit.err.toFixed(4), upE: +W.slapUp.err.toFixed(4) };
    poseRig(restPose()); W.body.updateMatrixWorld(true); }
  // sitting, by the table
  poseRig(sitPose()); W.body.quaternion.copy(W.qSit); W.body.position.copy(W.sitP);
  for (const Side of ['Right', 'Left']) legIK(R, Side, footTarget(Side), W.qSit, X);
  W.dentSit = imprint(grab(), grid, surf, { gap: 0.002, dil: 2, blur: 4, max: 0.06 });
  { const P = W.pillow.base, c = W.pillow.m.position, cell = new Map(), key = (x, z) => `${Math.round(x / 0.008)},${Math.round(z / 0.008)}`;
    for (let p = 0; p < lyingPts.length; p += 3) { const x = lyingPts[p] - c.x, y = lyingPts[p + 1] - c.y, z = lyingPts[p + 2] - c.z; if (Math.abs(x) > 0.32 || Math.abs(z) > 0.21) continue; const k = key(x, z); cell.set(k, Math.min(cell.get(k) ?? 9, y)); }
    W.pillowDent = new Float32Array(P.length / 3);
    for (let i = 0; i < P.length / 3; i++) { const x = P[i * 3], y = P[i * 3 + 1], z = P[i * 3 + 2]; if (y < 0) continue; let lo = 9;
      for (let a = -3; a <= 3; a++) for (let b = -3; b <= 3; b++) { const v = cell.get(`${Math.round(x / 0.008) + a},${Math.round(z / 0.008) + b}`); if (v !== undefined) lo = Math.min(lo, v + 0.004 + 0.0012 * (a * a + b * b)); }
      W.pillowDent[i] = Math.max(0, y - lo); } }
  poseRig(restPose()); W.body.quaternion.copy(W.qLie); W.body.position.copy(W.lieP); W.body.updateMatrixWorld(true);
  // ---- light: the moon through the window, a cold rim, a fill, the table, the head
  const cookie = canvasTex(512, 512, (x, w) => { x.fillStyle = '#000'; x.fillRect(0, 0, w, w); x.filter = 'blur(4px)'; x.fillStyle = '#fff';
    const m = 50, gap = 26, pw = (w - 2 * m - gap * 2) / 3, phh = (w - 2 * m - gap * 3) / 4;
    for (let i = 0; i < 3; i++) for (let j = 0; j < 4; j++) x.fillRect(m + i * (pw + gap), m + j * (phh + gap), pw, phh); });
  cookie.colorSpace = THREE.NoColorSpace;
  W.key = spot(scene, { color: 0xb8c8ff, pos: new THREE.Vector3(2.6, 2.6, -0.6), target: new THREE.Vector3(0.05, 0.5, -0.15), angle: 0.42, penumbra: 0.35, shadow: true, size: cfg.shadow ?? 1024 });
  W.key.map = cookie; W.key.shadow.camera.far = 7;
  W.rim = spot(scene, { color: 0x9fb6ff, pos: new THREE.Vector3(-0.9, 1.9, -2.2), target: new THREE.Vector3(0, 0.55, -0.4), angle: 0.5, penumbra: 0.9 });
  W.fill = spot(scene, { color: 0xc8d6ff, pos: new THREE.Vector3(-1.8, 1.4, 1.6), target: new THREE.Vector3(0, 0.5, -0.1), angle: 0.6, penumbra: 1 });
  W.tableLight = spot(scene, { color: 0xdfe6ff, pos: new THREE.Vector3(1.4, 1.6, -0.25), target: new THREE.Vector3(0.82, TBL.top + 0.05, -0.8), angle: 0.32, penumbra: 0.8 });
  W.headLight = spot(scene, { color: 0xc4d2ff, pos: new THREE.Vector3(-0.35, 1.35, -0.55), target: new THREE.Vector3(0, 0.62, -0.88), angle: 0.26, penumbra: 0.9 });
  W.auditSolids = [['bed frame', W.bed.frame], ['mattress', W.bed.box], ['bell', W.bell.g], ['timer', W.timer.g], ['book', W.book.g], ['tape', W.tape.g], ['headphones', W.phones.g], ['nightstand', W.tableG], ['diary', W.diary.g], ['clock', W.clock.g], ['lamp', W.lamp.g]];
  W.timing = { dings: SLAP.hits, lift: SLAP.lift[0], back: SLAP.back[0], bellSink: BELL_SINK[0], dialRise: DIAL_RISE[0], run1: [T.body, T.minutes + 0.3], band: T.ten,
    phonesOn: PHONES[0], march: [MARCH.t0, MARCH.t1, MARCH.beat], phonesOff: PHONES[1], run34: [T.t34 - 0.75, T.t34 + 0.35], ghost22: [T.t22 - 0.55, T.t22 + 0.3], run20: [32.0, T.minutes3],
    getUp: G0, dialDown: DIAL_DOWN[0], bookUp: BOOK_UP[0], bookOpen: BOOK_OPEN[0], page: PAGE, lamp: T.dim - 0.1, flip: FLIP[0], bookShut: BOOK_SHUT[0], bookDown: BOOK_DOWN[0],
    yawn: YAWN[0], lieDown: B0, dialUp: DIAL_UP[0], backwards: BACK, steam: [50.6, 55.4], run38: [T.over - 0.3, T.thirty + 0.6],
    phoneDown: PHONE_DOWN[0], diaryUp: DIARY_UP[0], fill: DIARY_FILL, rewind: DIARY_REW, diaryDown: DIARY_DOWN[0], setRun: [T.final + 0.1, T.final + 1.0], logo: T.logo };
  return { stamp: W.stampSpot, lieP: W.lieP.toArray(), sitP: W.sitP.toArray(), bell: W.bellInfo, brain: W.brain.length, n: meshes.length };
}

// ------------------------------------------------------------------ when things happen (beats on the words)
const SLAP = { lift: [2.9, 3.42], up: [3.36, 3.72], hits: [3.88, 4.43, 5.05, 7.16], back: [7.42, 8.3] };   // the bell: three quick slaps, a wait, one more
const BELL_SINK = [8.6, 9.1], DIAL_RISE = [9.05, 9.6];
const PHONES = [22.2, 31.2], MARCH = { t0: 22.5, t1: 30.95, beat: 0.5 };
const G0 = T.get - 0.12, B0 = 39.8;                                                 // getting up; lying back down
const DIAL_DOWN = [34.3, 34.75], BOOK_UP = [34.7, 35.2], BOOK_OPEN = [35.3, 35.9], PAGE = 36.75, BOOK_SHUT = [37.95, 38.45], BOOK_DOWN = [38.5, 38.95], DIAL_UP = [54.8, 55.35];
const FLIP = [T.no - 0.05, T.no + 0.45], YAWN = [39.0, 39.95];
const BACK = [41.62, 42.62];                                                        // the clock runs backwards
const PHONE_DOWN = [58.3, 58.75], DIARY_UP = [58.75, 59.25], DIARY_FILL = [59.1, 61.0], DIARY_REW = [64.3, 65.1], DIARY_DOWN = [67.75, 68.3];

// ------------------------------------------------------------------ the body over time
// lying (arms at the sides, feet relaxed outward), the bell (the left arm lifts, reaches, slaps), sitting (on the edge, by
// the table), reading (leaning to the book), a yawn
const ARM_LIE = { dir: [-0.1, -1, -0.09], twist: 0, elbow: 0.1 }, ARM_PUSH = { dir: [0.28, -0.95, -0.2], twist: 0, elbow: 0.25 };
const ARM_REST = { dir: [0.1, -0.9, 0.42], twist: 0.6, elbow: 1.1 };   // sitting, hands on the knees
const ARM_LIFT = { dir: [0.85, 0.05, 0.55], twist: 0, elbow: 0.75 };     // lying: the hand up off the bed and out, on its way to the bell
function restPose() { return { up: 0, swivel: 0, move: 0, knee: 0, ik: 0, cer: 0.3, tho: 0, lum: 0, turn: 0, twist: 0, jaw: 0, push: 0, rest: 0, lift: 0, reach: 0, hit: 0, tap: 0 }; }
function sitPose() { return { ...restPose(), up: 1, swivel: 1, move: 1, knee: 1, ik: 1, cer: 0.12, tho: 0.12, rest: 1 }; }
function footTarget(Side) { const G = W.rig.legs[Side], ah = G.A.y - G.ground; return new THREE.Vector3(W.sitP.x + 0.43, ah + 0.002, W.sitP.z + (Side === 'Right' ? 0.11 : -0.11)); }
function bodyAt(t) {
  const o = restPose();
  // the bell: lift, reach, slap (fast down, a bounce up), back down to the side
  o.lift = s5(SLAP.lift[0], SLAP.lift[1], t) * (1 - s5(SLAP.back[0] + 0.3, SLAP.back[1], t));
  o.reach = s5(SLAP.up[0], SLAP.up[1], t) * (1 - s5(SLAP.back[0], SLAP.back[0] + 0.45, t));
  let hit = 0; for (const h of SLAP.hits) hit = Math.max(hit, t < h ? ss(h - 0.1, h, t) : 1 - ss(h + 0.02, h + 0.17, t));
  o.hit = hit * ss(0.9, 1, o.reach);
  // the march: the right foot keeps time
  if (t > MARCH.t0 && t < MARCH.t1) { const b = (t - MARCH.t0) / MARCH.beat, f = b - Math.floor(b); o.tap = (f < 0.18 ? ss(0, 0.18, f) : 1 - ss(0.18, 0.62, f)) * ss(MARCH.t0, MARCH.t0 + 0.3, t) * (1 - ss(MARCH.t1 - 0.4, MARCH.t1, t)); }
  // getting up, reading by the lamp, a yawn, back
  o.up = s5(G0, G0 + 0.8, t) * (1 - s5(B0 + 0.55, B0 + 1.35, t));
  o.swivel = s5(G0 + 0.3, G0 + 1.1, t) * (1 - s5(B0 + 0.2, B0 + 1.0, t));
  o.move = s5(G0 + 0.25, G0 + 1.05, t) * (1 - s5(B0 + 0.2, B0 + 1.0, t));
  o.knee = s5(G0 + 0.5, G0 + 1.15, t) * (1 - s5(B0 + 0.1, B0 + 0.7, t));
  o.ik = s5(G0 + 0.85, G0 + 1.25, t) * (1 - s5(B0, B0 + 0.35, t));
  o.rest = s5(G0 + 0.1, G0 + 0.85, t) * (1 - s5(B0 + 0.45, B0 + 1.25, t));
  const read = s5(BOOK_OPEN[0] - 0.2, BOOK_OPEN[1], t) * (1 - s5(BOOK_SHUT[0], BOOK_SHUT[1] + 0.2, t));
  const y = pulse(t, YAWN[0], YAWN[1], 0.4); o.jaw = 0.42 * y;
  o.cer = lerp(lerp(0.3, 0.12, o.up), 0.5, read) - 0.45 * y; o.tho = lerp(0, 0.12, o.up) + 0.22 * read - 0.12 * y;
  o.turn = 0.5 * read; o.twist = 0.18 * read;
  return o;
}
const mixA = (a, b, k) => ({ dir: a.dir.map((v, i) => lerp(v, b.dir[i], k)), twist: lerp(a.twist, b.twist, k), elbow: lerp(a.elbow, b.elbow, k), wf: lerp(a.wf || 0, b.wf || 0, k), wd: lerp(a.wd || 0, b.wd || 0, k), wr: lerp(a.wr || 0, b.wr || 0, k), mix: [a, b, k] });
const _qa = new THREE.Quaternion(), _qb = new THREE.Quaternion(), _qc = new THREE.Quaternion();
function poseRig(o) {
  const R = W.rig;
  bendSpine(R.seg, { lum: 0, tho: o.tho, cer: o.cer, twist: o.twist || 0 });
  for (const n of ['Atlas', 'Axis', 'Third cervical vertebra']) R.seg[n].g.rotation.y += (o.turn || 0) / 3;
  if (W.jaw) W.jaw.rotation.x = o.jaw || 0;
  for (const Side of ['Right', 'Left']) {
    let a = mixA(mixA(ARM_LIE, ARM_PUSH, o.push), ARM_REST, o.rest);
    if (Side === 'Left' && W.slapUp) { if (o.lift > 0) a = mixA(a, ARM_LIFT, o.lift); if (o.reach > 0) a = mixA(a, W.slapUp, o.reach); if (o.hit > 0) a = mixA(a, W.slapHit, o.hit); }
    poseArm(R.arms[Side], a); if (W.wristR) setWrist(Side === 'Right' ? W.wristR : W.wristL, a);
  }
  if (W.handR) { W.handR.curl(0.12); W.handL.curl(lerp(0.12, 0.1, o.reach || 0)); clearArms(R); }
  for (const Side of ['Right', 'Left']) {
    const G = R.legs[Side], s = G.s, lie = 1 - o.up;
    _qa.setFromAxisAngle(X, -(Math.PI / 2) * o.up); _qb.setFromAxisAngle(Z, 0.1 * s * o.knee); _qc.setFromAxisAngle(Y, 0.22 * s * lie);
    G.hip.quaternion.multiplyQuaternions(_qa, _qb).multiply(_qc);
    G.knee.quaternion.setFromAxisAngle(X, (Math.PI / 2) * o.knee);
    const tap = Side === 'Right' ? o.tap || 0 : 0;
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

// ------------------------------------------------------------------ the clock: seconds of the day
const CK = [
  [-5, 23 * H], [0.35, 23 * H], [2.95, 24 * H],                                       // an hour in bed, staring at the ceiling
  [BACK[0], 24 * H + (BACK[0] - 2.95)], [BACK[1], 21 * H + 30 * 60],               // "backwards": back to half past nine
  [T.end, 21 * H + 30 * 60 + (T.end - BACK[1])],
];
function clockAt(t) { return keys(CK, t); }

// ------------------------------------------------------------------ the timer over time: the needle, the ghost needle and the arcs, in minutes
function timerAt(t) {
  const o = { v: 0, g: 0, gO: 0, band: 0, zone: 0, set: 0 };
  // on its own: a run from 0 to 15, the band 10 to 20 at "ten to twenty"
  let v = 15 * s5(T.body, T.minutes + 0.3, t);
  o.band = ss(T.ten - 0.15, T.ten + 0.35, t) * (1 - ss(25.0, 25.6, t));
  // told to fall asleep fast: 34; not trying: 22 (the ghost)
  v = lerp(v, 0, s5(25.2, 25.8, t)); v = lerp(v, 34, s5(T.t34 - 0.75, T.t34 + 0.35, t));
  o.g = 22 * s5(T.t22 - 0.55, T.t22 + 0.3, t); o.gO = 0.6 * ss(T.t22 - 0.6, T.t22 - 0.3, t) * (1 - ss(31.4, 31.9, t));
  // still awake after twenty minutes
  v = lerp(v, 0, s5(31.45, 31.95, t)); v = lerp(v, 20, s5(32.0, T.minutes3, t));
  // back in bed: from zero; over thirty minutes: the long zone
  v = lerp(v, 0, s5(34.0, 34.3, t)); v = lerp(v, 38, s5(T.over - 0.3, T.thirty + 0.6, t));
  o.zone = ss(T.thirty - 0.2, T.thirty + 0.3, t) * (1 - ss(T.final - 0.2, T.final + 0.3, t));
  // factory settings: 15, the band in orange
  v = lerp(v, 15, s5(T.final + 0.1, T.final + 1.0, t)); o.set = ss(T.final + 0.4, T.final + 1.0, t);
  o.v = v; return o;
}

// ------------------------------------------------------------------ the camera: one path, no cuts
let CAM = null;
function buildCam() {
  const D = DIAL, Dl = V3(D.x, D.y + 0.012, D.z - 0.004);
  const cf = new THREE.Vector3(Math.sin(CLOCK_RY), 0, Math.cos(CLOCK_RY)), Cc = W.clock.body.localToWorld(new THREE.Vector3(0, 0, W.clock.D / 2));
  const ck = Cc.clone().addScaledVector(cf, 0.42).add(new THREE.Vector3(0.0, 0.07, 0.0));
  const TV = { p: V3(1.195, 1.243, -0.463), p2: V3(1.19, 1.24, -0.47), l: V3(0.75, 0.63, -0.72) };   // the timer, from beside the table (the bed behind it)
  const CK = { p: V3(0.972, 0.865, -0.482), p2: V3(0.985, 0.87, -0.47), l: V3(0.69, 0.66, -0.97) };   // the clock
  return camTrack([
    { t: -3.0, p: V3(0.17, 4.2, -0.38), l: V3(0.17, 0.5, -0.46), fov: 44 },
    { t: 0.3, p: V3(0.17, 4.15, -0.4), l: V3(0.17, 0.5, -0.48), fov: 44, tens: 0.5 },          // from the ceiling: he stares up at us
    { t: 2.55, p: V3(0.2, 2.3, -0.74), l: V3(0.2, 0.55, -0.83), fov: 40, tens: 0.5 },          // closer: the face
    { t: 3.75, p: V3(1.646, 1.316, 0.237), l: V3(0.33, 0.7, -0.83), fov: 36, stop: true },     // the skull, the arm, the bell
    { t: 9.45, p: V3(1.62, 1.3, 0.22), l: V3(0.34, 0.69, -0.83), fov: 36, stop: true },
    { t: 10.7, p: TV.p, l: TV.l, fov: 28, stop: true },                                          // the timer
    { t: 16.9, p: TV.p2, l: TV.l, fov: 28, stop: true },
    { t: 18.3, p: V3(0.33, 1.2, -0.42), l: V3(0.0, 0.66, -0.83), fov: 32, stop: true },        // the busy head; the headphones come down
    { t: 23.0, p: V3(0.35, 1.21, -0.4), l: V3(0.0, 0.66, -0.83), fov: 32, stop: true },
    { t: 24.2, p: V3(-0.35, 1.1, 2.3), l: V3(-0.01, 0.6, 0.7), fov: 30, tens: 0.15 },          // the right foot keeps time
    { t: 25.6, p: V3(-0.345, 1.1, 2.28), l: V3(-0.01, 0.6, 0.7), fov: 30, tens: 0.15 },
    { t: 26.6, p: TV.p, l: TV.l, fov: 28, stop: true },                                          // 34, 22, then 20
    { t: 33.5, p: TV.p2, l: TV.l, fov: 28, stop: true },
    { t: 35.0, p: V3(1.234, 2.5, 1.416), l: V3(0.5, 0.7, -0.6), fov: 42, stop: true },        // up, the lamp, the book, the phone; back to bed
    { t: 40.4, p: V3(1.21, 2.48, 1.43), l: V3(0.49, 0.69, -0.6), fov: 42, stop: true },
    { t: 41.5, p: CK.p, l: CK.l, fov: 30, tens: 0.15 },                                          // the clock runs backwards
    { t: 42.7, p: CK.p2, l: CK.l, fov: 30, tens: 0.15 },
    { t: 44.5, p: V3(0.17, 4.15, -0.4), l: V3(0.17, 0.5, -0.48), fov: 44, tens: 0.15 },       // the ceiling again: the treatment
    { t: 47.3, p: V3(0.17, 4.1, -0.4), l: V3(0.17, 0.5, -0.48), fov: 44, tens: 0.15 },
    { t: 48.6, p: V3(1.09, 0.951, -0.277), l: V3(0.69, 0.67, -0.97), fov: 30, tens: 0.15 },    // the clock: 9 to 10, before bed
    { t: 50.6, p: V3(1.1, 0.955, -0.265), l: V3(0.69, 0.67, -0.97), fov: 30, tens: 0.15 },
    { t: 51.7, p: V3(0.966, 1.318, 1.473), l: V3(0.0, 0.8, -0.2), fov: 40, tens: 0.15 },       // warmth off the bones
    { t: 54.5, p: V3(0.95, 1.31, 1.49), l: V3(0.0, 0.8, -0.21), fov: 40, tens: 0.15 },
    { t: 55.9, p: V3(0.209, 1.0, -0.503), l: V3(0.86, 0.57, -0.74), fov: 36, stop: true },     // the timer and the diary
    { t: 68.0, p: V3(0.215, 1.005, -0.51), l: V3(0.86, 0.57, -0.74), fov: 36, stop: true },
    { t: 69.6, p: V3(0.66, 1.42, -0.5), l: Dl, fov: 30 },
    { t: T.logo, p: V3(D.x, D.y + 0.9, D.z + 0.005), l: V3(D.x, D.y + 0.0142, D.z), fov: 30, stop: true },   // straight down on the timer: the logo
  ]);
}
function camPose(S, t) {
  const v = S.cfg.view; if (v && typeof v === 'object') return v;
  if (!CAM) CAM = buildCam();
  if (t <= T.logo) return CAM(t);
  const P = CAM(T.logo), k = ss(T.logo, T.end, t);
  return { p: [P.p[0], lerp(P.p[1], P.p[1] - 0.06, k), P.p[2]], l: P.l, fov: 30 };
}
function focusAt(S, t, P) { return Math.hypot(P.p[0] - P.l[0], P.p[1] - P.l[1], P.p[2] - P.l[2]); }

// ------------------------------------------------------------------ one moment of the film
const _v = new THREE.Vector3(), _w = new THREE.Vector3();
function update(S, t) {
  const scene = S.scene, endDark = ss(T.final + 0.3, T.logo - 0.3, t);
  // ---- the body
  const o = bodyAt(t); poseRig(o); placeBody(o);
  // ---- the bed takes the body's shape
  { const k = clamp01(o.move), kk = Math.round(k * 200) / 200, L = W.dentLie, Sd = W.dentSit;
    setMattress(W.bed, { key: kk.toFixed(3), at: (i) => lerp(L[i], Sd[i], kk) });
    const pk = Math.round(clamp01(1 - o.up * 1.4) * 100) / 100, P = W.pillow;
    if (P.key !== pk.toFixed(2)) { P.key = pk.toFixed(2); const A = P.geo.attributes.position.array; for (let i = 0; i < A.length / 3; i++) A[i * 3 + 1] = P.base[i * 3 + 1] - W.pillowDent[i] * pk; P.geo.attributes.position.needsUpdate = true; P.geo.computeVertexNormals(); } }
  // ---- the bell: struck, its plunger goes down; then it sinks into the table
  { const B = W.bell, sk = s5(BELL_SINK[0], BELL_SINK[1], t);
    B.plunger.position.y = 0.014 + 0.041 * 0.8 - 0.004 * o.hit;
    B.g.position.y = BELL.y - 0.08 * sk; B.g.visible = sk < 0.999; }
  // ---- the busy head: the vault turns to glass, the brain flickers
  { const busy = ss(T.and2 - 0.1, T.head, t) * (1 - ss(31.0, 31.8, t)), hard = 0.6 + 0.4 * ss(T.trying - 0.2, T.hard + 0.3, t);
    for (const m of W.vault) { m.material.opacity = 1 - 0.72 * busy; m.material.depthWrite = busy < 0.5; }
    for (const m of W.brain) { m.visible = busy > 0.003; const ph = (t * m.userData.f + m.userData.ph) % 1, fl = Math.exp(-ph * 9) * (hash(Math.floor(t * m.userData.f + m.userData.ph) * 1.7 + m.userData.ph) < 0.55 * hard + 0.1 ? 1 : 0);
      m.material.opacity = busy * 0.92; m.material.emissiveIntensity = busy * (0.05 + 1.1 * fl); } }
  // ---- headphones and the tape player: on at "marching", off when the march ends
  { const on = s5(PHONES[0], PHONES[0] + 0.55, t) * (1 - s5(PHONES[1], PHONES[1] + 0.6, t)), P = W.phones, Tp = W.tape;
    P.g.visible = on > 0.001; P.g.position.copy(P.home); P.g.position.z += (1 - on) * 0.25;   // they come down onto the skull (its own +z is up when lying)
    Tp.g.visible = on > 0.001; Tp.g.position.set(0.335, BED.top + (1 - on) * 0.25, -0.12); Tp.g.rotation.y = 0.25;
    Tp.cord.visible = on > 0.98;
    if (Tp.cord.visible) { const c = P.cups[1].getWorldPosition(_v), a = c.clone().add(new THREE.Vector3(0.03, -0.05, 0.05)), b = new THREE.Vector3(0.33, BED.top + 0.004, -0.42), e = Tp.g.position.clone().add(new THREE.Vector3(-0.02, 0.012, -0.055));
      const key = c.toArray().map((x) => x.toFixed(4)).join(); if (key !== Tp.key) { Tp.key = key; Tp.cord.geometry.dispose(); Tp.cord.geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3([c, a, b, e]), 64, 0.0018, 6); } } }
  // ---- the timer: rises where the bell was; sinks for the book and comes back
  { const D = W.timer, o2 = timerAt(t), up = s5(DIAL_RISE[0], DIAL_RISE[1], t) * (1 - s5(DIAL_DOWN[0], DIAL_DOWN[1], t)) + s5(DIAL_UP[0], DIAL_UP[1], t);
    D.g.position.y = DIAL.y - 0.03 * (1 - up); D.g.visible = up > 0.001;
    D.N.n.rotation.y = -ANG(o2.v); D.G.n.rotation.y = -ANG(o2.g); D.G.mat.opacity = o2.gO; D.G.n.visible = o2.gO > 0.002;
    D.N.mat.opacity = 1 - ss(T.logo - 0.6, T.logo - 0.2, t);
    setArc(D.A.band, 10, 20, 0.9 * o2.band); setArc(D.A.zone, 30, 45, 0.85 * o2.zone);
    setArc(D.A.set, 10, 20, o2.set * (1 - ss(T.logo - 0.6, T.logo - 0.2, t)));
    D.faceMat.emissiveIntensity = 0.08; D.faceMat.opacity = 1 - 0.85 * ss(T.settings, T.logo - 0.2, t);
    const logoK = s5(T.final + 0.4, T.logo - 0.25, t); D.logo.set({ weight: logoK, white: logoK, hours: 0, hand: ss(T.logo - 0.4, T.logo - 0.15, t), handScale: outBack(clamp01((t - (T.logo - 0.4)) / 0.35), 1.8) }); }
  // ---- the book: rises, opens, a page turns, shuts, goes back into the table
  { const B = W.book, up = s5(BOOK_UP[0], BOOK_UP[1], t) * (1 - s5(BOOK_DOWN[0], BOOK_DOWN[1], t)), op = s5(BOOK_OPEN[0], BOOK_OPEN[1], t) * (1 - s5(BOOK_SHUT[0], BOOK_SHUT[1], t));
    B.g.visible = up > 0.001; B.g.position.y = BOOK.y - 0.035 * (1 - up);
    for (const h of B.halves) h.h.rotation.z = h.s * lerp(Math.PI / 2 - 0.02, 0.06, op);
    const pg = clamp01((t - PAGE) / 0.7); B.leaf.visible = op > 0.95 && pg > 0 && pg < 1; B.leaf.rotation.z = Math.PI * s5(0, 1, pg); B.leaf.position.y = 0.0145 + 0.03 * Math.sin(Math.PI * pg); }
  // ---- the phone: face up, a glow; it turns itself face down at "no screens"; it goes into the table for the diary
  { const P = W.phone, fl = s5(FLIP[0], FLIP[1], t), dn = s5(PHONE_DOWN[0], PHONE_DOWN[1], t), lit = 0.55 * pulse(t, 35.6, T.no + 0.05, 0.3) + 0.1;
    P.screenMat.color.setScalar(lit * (1 - fl));
    P.g.rotation.set(0, 0.32, Math.PI * fl); P.g.position.y = PHONE_AT.y + 0.03 * Math.sin(Math.PI * fl) + 0.0078 * fl - 0.04 * dn; P.g.visible = dn < 0.999; }
  // ---- the diary: three nights a week for thirteen weeks; then it empties again ("don't wait that long")
  { const Dy = W.diary, up = s5(DIARY_UP[0], DIARY_UP[1], t) * (1 - s5(DIARY_DOWN[0], DIARY_DOWN[1], t));
    Dy.g.visible = up > 0.001; Dy.g.position.y = DIARY.y - 0.01 * (1 - up);
    const k = 13 * s5(DIARY_FILL[0], DIARY_FILL[1], t) - 11 * s5(DIARY_REW[0], DIARY_REW[1], t); if (Dy.g.visible) drawDiary(Dy, k); }
  // ---- warmth from a bath, rising off the bones
  { const a = 0.24 * pulse(t, 50.6, 55.4, 0.8); for (const m of W.steam) { m.visible = a > 0.002; m.material.uniforms.uAmt.value = a; m.rotation.y = Math.atan2(S.cam.position.x - m.position.x, S.cam.position.z - m.position.z); } }
  { const wm = 0.1 * pulse(t, 50.6, 55.3, 0.9); if (wm !== W.warmK) { W.warmK = wm; for (const m of W.meshes) if (m.material.emissive) m.material.emissiveIntensity = wm; } }
  // ---- the clock: an hour at the start, backwards on "backwards"; 9 to 10 for the bath
  { const s = clockAt(t), C = W.clock, hrs = (s / H) % 12, spin = Math.abs(clockAt(t + 0.02) - s) > 30;
    C.hands.h.rotation.z = -(hrs / 12) * Math.PI * 2; C.hands.m.rotation.z = -((s % H) / H) * Math.PI * 2; C.hands.s.rotation.z = spin ? -((s % 60) / 60) * Math.PI * 2 : -tickAngle(s % 60);
    const bath = pulse(t, T.one - 0.35, 51.3, 0.4); C.setArc(C.arc, 9, 10, 0.036, 0.0026); C.arcMat.opacity = bath; C.arcGhostMat.opacity = 0;
    C.markMat.opacity = 0.35 + 0.65 * bath; C.lipMat.emissiveIntensity = 0; }
  // ---- light: night; the moon's window slides over the bed while the hour passes; the lamp for reading; dark at the very end
  { const fig = 1 - endDark, hourK = s5(T.you, 2.95, t);
    W.key.position.set(lerp(2.75, 2.45, hourK), 2.6, lerp(-0.85, -0.35, hourK));
    W.key.intensity = 24 * fig;
    const lamp = pulse(t, T.dim - 0.1, B0 + 0.3, 0.25); W.lampLight.intensity = 0.85 * lamp * fig; W.lamp.shadeMat.emissiveIntensity = 0.6 * lamp; W.lamp.bulbMat.color.setScalar(1.0 * lamp);
    const head = pulse(t, 17.6, 23.0, 0.6);
    W.rim.intensity = 2.6 * fig; W.fill.intensity = 0.45 * fig; W.tableLight.intensity = 3.0 * fig; W.headLight.intensity = (0.5 + 0.9 * head) * fig;
    W.window.paneMat.color.setScalar(1 - 0.9 * endDark);
    S.tableMat.color.setScalar(0.35 * (1 - endDark * 0.9)); scene.environmentIntensity = 0.1 * (1 - endDark); S.reflAmt = 0.5 * (1 - endDark);
    S.bg.setRGB(0.027, 0.031, 0.039); S.fog.color.copy(S.bg); }
}

// ------------------------------------------------------------------ the words on screen
const CAPS = [
  { t0: T.you, t1: 1.86, top: 300, size: 96, html: 'You lie in bed<br>for <em>an hour</em>,' },
  { t0: T.staring, t1: 3.2, top: 300, size: 96, html: 'staring at<br>the <em>ceiling</em>' },
  { t0: T.and1, t1: 5.5, top: 292, size: 86, html: 'and ordering yourself<br>to <em>fall asleep</em>,' },
  { t0: T.as, t1: 7.95, top: 300, size: 96, html: 'as if sleep<br><em>takes orders.</em>' },
  { t0: T.lets, t1: 9.6, top: 300, size: 104, html: 'Let’s <em>fix</em> that.' },
  { t0: T.your, t1: 12.5, top: 292, size: 86, html: 'Your body was built<br>to fall asleep<br><em>on its own</em>,' },
  { t0: T.and0, t1: 17.2, top: 292, size: 84, html: 'and for most people,<br>that takes about<br><em>10 to 20 minutes</em>.' },
  { t0: T.and2, t1: 18.8, top: 300, size: 96, html: 'And when your<br>head is <em>busy</em>,' },
  { t0: T.trying, t1: 21.0, top: 300, size: 96, html: 'trying hard<br>makes it <em>worse</em>.' },
  { t0: T.in, t1: 23.8, top: 292, size: 88, html: 'In one study,<br>with <em>marching music</em><br>playing,' },
  { t0: T.people2, t1: 27.95, top: 292, size: 84, html: 'people told to<br>fall asleep <em>fast</em><br>said it took <em>34 minutes</em>,' },
  { t0: T.and3, t1: 31.3, top: 292, size: 88, html: 'and people who<br>weren’t trying<br>said <em>22</em>.' },
  { t0: T.so, t1: 33.78, top: 292, size: 88, html: 'So if you’re still<br>awake after<br><em>20 minutes</em>,' },
  { t0: T.get, t1: 36.25, top: 292, size: 84, html: '<em>get up</em>, do something<br>quiet in <em>dim light</em>,' },
  { t0: T.with, t1: 37.65, top: 300, size: 96, html: 'with <em>no screens</em>,' },
  { t0: T.and4, t1: 40.4, top: 292, size: 86, html: 'and go back to bed<br>when you’re <em>sleepy</em>.' },
  { t0: T.it, t1: 42.05, top: 300, size: 96, html: 'It sounds<br><em>backwards</em>,' },
  { t0: T.but, t1: 44.55, top: 292, size: 86, html: 'but it’s part of the<br>treatment <em>sleep doctors</em>' },
  { t0: T.recommend, t1: 47.3, top: 292, size: 92, html: 'recommend<br><em>most strongly</em><br>for insomnia.' },
  { t0: T.a, t1: 51.2, top: 292, size: 84, html: 'A warm <em>bath</em> or <em>shower</em><br>1 to 2 hours<br>before bed' },
  { t0: T.also, t1: 54.9, top: 292, size: 86, html: 'also helped people<br>fall asleep <em>sooner</em><br>in studies.' },
  { t0: T.if2, t1: 58.2, top: 292, size: 86, html: 'If it takes you<br><em>over 30 minutes</em><br>to fall asleep,' },
  { t0: T.three, t1: 61.1, top: 292, size: 86, html: '3 or more<br>nights a week,<br>for <em>3 months</em>,' },
  { t0: T.see, t1: 63.4, top: 300, size: 96, html: 'see a <em>doctor</em><br>about insomnia.' },
  { t0: T.and5, t1: 68.4, top: 292, size: 82, html: 'And don’t wait that long<br>if poor sleep is making<br>life <em>hard to cope with</em>.' },
  { t0: T.final, t1: 99, top: 360, size: 92, html: 'Let’s get you back to<br><em>factory settings.</em>' },
];
const OVL = {};
function overlayInit(S) {
  const O = S.O, tag = (cls, txt2, size, bsize) => { const e = O.tag(cls, txt2); e.style.fontSize = size + 'px'; const b = e.querySelector('b'); if (b && bsize) b.style.fontSize = bsize + 'px'; return e; };
  OVL.normal = tag('tag', 'Most people<b>10 to 20 min</b>', 26, 46);
  OVL.tried = tag('tag', 'Told to fall asleep fast<b>said 34 min</b>', 22, 42);
  OVL.didnt = tag('tag', 'Not trying<b>said 22 min</b>', 22, 42);
  OVL.twenty = tag('tag', 'Still awake<b>20 min</b>', 26, 46);
  OVL.cbt = tag('tag', 'CBT for insomnia<b>strongly recommended</b>', 22, 40);
  OVL.bath = tag('tag', 'Warm bath or shower<b>1 to 2 h before bed</b>', 22, 40);
  OVL.over = tag('tag', 'Over<b>30 min</b>', 26, 46);
  for (const e of [OVL.cbt]) Object.assign(e.style, { background: 'rgba(8,9,11,.58)', padding: '12px 18px 14px', borderRadius: '16px' });
}
function overlay(S, t) {
  const D = DIAL, at = (v, r = DIAL_R * 1.15) => { const a = ANG(v); return new THREE.Vector3(D.x + Math.sin(a) * r, D.y + 0.014, D.z - Math.cos(a) * r); };
  // tags above the dial as seen (its highest point on screen), centred on it, or to its left or right
  let top = null, ty = 9e9; for (let v = -7.5; v <= 52.5; v += 2.5) { const w = at(v, DIAL_R * 1.2), y = w.clone().project(S.cam).y; if (-y < ty) { ty = -y; top = w; } }
  const ab = (e, side, o) => { const w = e.offsetWidth || 240, h = e.offsetHeight || 110; place(S, e, top, side === 0 ? -w / 2 : side < 0 ? -w - 14 : 14, -h - 22, 1);
    e.style.opacity = (o * parseFloat(e.style.opacity || 1)).toFixed(3); e.style.filter = `blur(${((1 - o) * 8).toFixed(2)}px)`; };
  ab(OVL.normal, 0, pulse(t, T.ten, 17.25));
  ab(OVL.didnt, -1, pulse(t, T.t22 - 0.3, 31.4));
  ab(OVL.tried, 1, pulse(t, T.t34, 31.4));
  ab(OVL.twenty, 0, pulse(t, T.minutes3 - 0.1, G0 + 0.5));
  place(S, OVL.cbt, new THREE.Vector3(0.36, 0.62, -0.25), 0, 0, pulse(t, T.treatment, 47.3));
  { const C = W.clock.body.localToWorld(new THREE.Vector3(0, W.clock.R + 0.004, W.clock.D / 2)); place(S, OVL.bath, C, -(OVL.bath.offsetWidth || 300) / 2, -(OVL.bath.offsetHeight || 100) - 24, pulse(t, T.one, 51.0)); }
  ab(OVL.over, 0, pulse(t, T.thirty, T.final - 0.3));
  const c = new THREE.Vector3(D.x, D.y + 0.0142, D.z);
  logoEnd(S, t, { t0: T.logo, center: c, edge: c.clone().add(new THREE.Vector3(0, 0, LOGO_R)) });
}

makeFilm({
  T, caps: CAPS, subs: [], build, update, pose: camPose, overlay, overlayInit, focus: focusAt,
  stage: { bg: 0x07080a, reflSize: 6, env: 0.1, far: 30 },
  aperture: [[0, 0.002], [3.9, 0.003], [9.8, 0.004], [18.3, 0.003], [24.1, 0.002], [26.6, 0.004], [35.0, 0.0015], [41.5, 0.004], [44.5, 0.002], [49.0, 0.002], [55.9, 0.003], [69.6, 0.003]],
  bloom: [[0, 0.42], [17.5, 0.55], [23, 0.45], [68, 0.55]],
  fast: [[2.7, 4.2, 2], [7.4, 10.0, 2], [16.8, 18.4, 2], [22.6, 26.8, 2], [33.4, 35.2, 2], [40.3, 41.6, 2], [41.5, 42.7, 3], [42.6, 44.6, 2], [47.2, 49.2, 2], [54.3, 56.0, 2], [67.9, 69.7, 2]],
});

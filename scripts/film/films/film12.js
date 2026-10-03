// Human Factory Settings · Film 12 "Is mouth taping safe?" · one continuous shot, 9:16.
// A skeleton asleep on its back, a strip of white tape across its teeth. On the wall above the bed: three US polls (12%,
// 5%, 7% have tried it) and a review of 10 studies, 213 people; two improve, both mild, neither with a comparison group;
// the verdict. On the bedside table the tape's box promises better sleep, less snoring, a sharper jaw. The airway lights
// up: air in through the nose, down the throat. A blocked nose sends it through the mouth; tape the mouth over a blocked
// nose and the air stops. Jawline? Two photo frames lying face down on the table stand up: before and after, identical
// (the gag). Snoring with pauses, gasping, tired all day: the tape is peeled off. The roll of tape, seen from above,
// becomes the logo. The factory stamp is on the left temple.
import { THREE, ORANGE, COLD, ss, s5, lerp, clamp01, hash, camTrack, phys, glowMat, shadows, spot, RoundedBoxGeometry,
  loadAnatomy, V3, place, logoEnd, makeFilm, outBack, stamp, stampCanvas, stampSpot, noiseTex, TIME } from '../kit.js';
import { buildRig, skeletonKind, bendSpine, poseArm, worldVerts } from '../rig.js';
import { makeLamp, makeLogoRing } from '../props.js';

// ------------------------------------------------------------------ timing, from the voice guide (word starts)
const T = {
  end: 69.3,
  people: 0.35, tape: 1.20, shut: 2.21, night: 2.43, purpose: 3.29,                                                          // "People now tape their mouths shut at night. On purpose."
  three: 5.73, polls: 6.73, five: 7.14, twelve: 7.97, percent: 8.52, adults: 9.06, tried: 10.04,                           // "In three yearly US polls, five to twelve percent of adults said they'd tried it."
  promise: 11.84, better: 12.47, sleep: 13.02, less: 13.32, snoring: 13.73, even: 14.27, sharper: 14.93, jaw: 15.34,
  review: 18.07, ten: 18.73, studies: 19.07, two: 19.58, hundred: 19.96, people2: 21.42, total: 22.09,
  showed: 23.97, main: 24.34, score: 25.29, improving: 25.63, both: 26.87, mild: 27.73, neither: 28.55, comparison: 29.72, group: 30.47,
  verdict: 32.61, data: 33.63, support: 34.04, treatment: 35.31,
  nose: 37.39, better2: 38.11, airway: 38.41, sleep2: 39.01, but: 39.90, mouth: 41.53, reason: 42.02, blocked: 43.63, nose2: 44.00,
  tape2: 45.33, over: 46.41, blocked2: 46.96, shut2: 48.33, only: 48.73, other: 49.28, breathe: 50.10,
  jawline: 51.40, noEvidence: 52.71, evidence: 53.83,
  snoringP: 55.30, pauses: 56.27, gasping: 56.74, tired: 58.18, often: 60.53, blocked3: 61.09, dont: 62.44, tape3: 63.10, see: 63.45, doctor: 63.84,
  back: 65.16, factory: 66.02, settings: 66.32, logo: 67.02,
};

// ------------------------------------------------------------------ the set (metres): the bed along z, the head at -z; lying face up
const W = {}; window.HFS_W = W;
const BED = { x0: -0.48, x1: 0.48, z0: -1.06, z1: 1.02, top: 0.5, base: 0.3 };
const TBL = { x: 0.83, z: -0.83, w: 0.56, d: 0.46, top: 0.56 };
const ROLL = new THREE.Vector3(1.0, TBL.top, -0.68), BOX = new THREE.Vector3(0.92, TBL.top, -0.92), FRAMES = new THREE.Vector3(0.72, TBL.top, -0.97);
const LAMP = new THREE.Vector3(1.0, TBL.top, -1.0);
const BOARD = { z: -1.2, y0: 1.06, y1: 1.63, x0: -0.62, x1: 0.62 };
const PX = -0.31, RX = 0.31, CAMY = 1.42, CAMD = 1.06;   // the polls' half and the review's half, framed one at a time   // a dark panel on the wall above the headboard
const LOGO_R = 0.03, ROLL_R = 0.036;
const X = new THREE.Vector3(1, 0, 0), Y = new THREE.Vector3(0, 1, 0), Z = new THREE.Vector3(0, 0, 1);
const pulse = (t, a, b, r = 0.35) => ss(a, a + r, t) * (1 - ss(b - r, b, t));
function canvasTex(w, h, draw, { srgb = true } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h, c);
  const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.userData.canvas = c; return t;
}
function txt(x, s, px, py, { font = '800 100px Archivo', color = '#fff', align = 'center', track = 0, base = 'middle', maxW = 0 } = {}) {
  x.font = font; x.letterSpacing = `${track}px`; x.fillStyle = color; x.textAlign = align; x.textBaseline = base;
  if (maxW) { const w = x.measureText(s).width; if (w > maxW) { x.save(); x.translate(px, py); x.scale(maxW / w, 1); x.fillText(s, 0, 0); x.restore(); return; } }
  x.fillText(s, px, py);
}

// ------------------------------------------------------------------ the bed, the pillow, the table (as in film 8)
const MAT = { nx: 97, nz: 209, r: 0.035 };
function edgeDrop(x, z) { const d = Math.min(x - BED.x0, BED.x1 - x, z - BED.z0, BED.z1 - z), r = MAT.r; if (d >= r) return 0; const u = r - Math.max(0, d); return r - Math.sqrt(Math.max(0, r * r - u * u)); }
function makeBed(scene) {
  const g = new THREE.Group(); scene.add(g);
  const lacquer = phys({ color: 0x0c0d0f, roughness: 0.34, clearcoat: 0.6, clearcoatRoughness: 0.25 });
  const frame = new THREE.Mesh(new RoundedBoxGeometry(BED.x1 - BED.x0 + 0.05, 0.16, BED.z1 - BED.z0 + 0.05, 4, 0.012), lacquer); frame.position.set(0, 0.142, (BED.z0 + BED.z1) / 2); g.add(frame);
  for (const [x, z] of [[BED.x0 + 0.04, BED.z0 + 0.06], [BED.x1 - 0.04, BED.z0 + 0.06], [BED.x0 + 0.04, BED.z1 - 0.06], [BED.x1 - 0.04, BED.z1 - 0.06]]) { const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.014, 0.07, 24), lacquer); leg.position.set(x, 0.035, z); g.add(leg); }
  const fabric = (c, o = {}) => phys({ color: c, roughness: 0.92, sheen: 0.6, sheenColor: new THREE.Color(0x8a93a6), sheenRoughness: 0.6, roughnessMap: noiseTex(5, 256, 0.82, 1.0, 40), ...o });
  const head = new THREE.Mesh(new RoundedBoxGeometry(BED.x1 - BED.x0 + 0.08, 0.86, 0.07, 5, 0.025), fabric(0x262a31)); head.position.set(0, 0.53, BED.z0 - 0.06); g.add(head);
  const sideH = BED.top - MAT.r - BED.base;
  const box = new THREE.Mesh(new THREE.BoxGeometry(BED.x1 - BED.x0, sideH, BED.z1 - BED.z0), fabric(0x2c3037)); box.position.set(0, BED.base + sideH / 2, (BED.z0 + BED.z1) / 2); g.add(box);
  const nx = MAT.nx, nz = MAT.nz, pos = new Float32Array(nx * nz * 3), idx = [];
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const k = j * nx + i, x = lerp(BED.x0, BED.x1, i / (nx - 1)), z = lerp(BED.z0, BED.z1, j / (nz - 1)); pos[k * 3] = x; pos[k * 3 + 1] = BED.top - edgeDrop(x, z); pos[k * 3 + 2] = z; }
  for (let j = 0; j < nz - 1; j++) for (let i = 0; i < nx - 1; i++) { const a = j * nx + i, b = a + 1, c = a + nx, d = c + 1; idx.push(a, c, b, b, c, d); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setIndex(idx); geo.computeVertexNormals();
  const top = new THREE.Mesh(geo, fabric(0x30343c)); g.add(top);
  shadows(g); g.traverse((o) => o.layers.enable(1));
  const edge = new Float32Array(nx * nz); for (let k = 0; k < nx * nz; k++) { const x = pos[k * 3], z = pos[k * 3 + 2]; edge[k] = ss(0.0, 0.05, Math.min(x - BED.x0, BED.x1 - x, z - BED.z0, BED.z1 - z)); }
  return { g, top, geo, base: Float32Array.from(pos), edge };
}
function imprint(pts, { x0, x1, z0, z1, nx, nz }, surf, { gap = 0.004, dil = 2, blur = 3, max = 0.07 } = {}) {
  const d = new Float32Array(nx * nz);
  for (let p = 0; p < pts.length; p += 3) { const x = pts[p], y = pts[p + 1], z = pts[p + 2]; const i = Math.round(((x - x0) / (x1 - x0)) * (nx - 1)), j = Math.round(((z - z0) / (z1 - z0)) * (nz - 1)); if (i < 0 || j < 0 || i >= nx || j >= nz) continue; const s = surf(x, z), k = j * nx + i; d[k] = Math.max(d[k], Math.min(max, s - (y - gap))); }
  const pass = (src, r, op) => { const out = new Float32Array(nx * nz); for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { let a = 0, ws = 0; for (let dj = -r; dj <= r; dj++) for (let di = -r; di <= r; di++) { const ii = i + di, jj = j + dj; if (ii < 0 || jj < 0 || ii >= nx || jj >= nz) continue; const v = src[jj * nx + ii]; if (op === 'max') a = Math.max(a, v); else { const w = Math.exp(-(di * di + dj * dj) / (r * r * 0.6)); a += v * w; ws += w; } } out[j * nx + i] = op === 'max' ? a : a / ws; } return out; };
  const soft = pass(pass(d, dil, 'max'), blur, 'blur'); for (let k = 0; k < d.length; k++) soft[k] = Math.max(soft[k], d[k]); return soft;
}
function makePillow(scene, c, size) {
  const geo = new THREE.SphereGeometry(1, 160, 80), P = geo.attributes.position, sp = (u, e) => Math.sign(u) * Math.pow(Math.abs(u), e);
  for (let i = 0; i < P.count; i++) P.setXYZ(i, sp(P.getX(i), 0.32) * size.x, sp(P.getY(i), 0.75) * size.y, sp(P.getZ(i), 0.32) * size.z);
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, phys({ color: 0x3a3f48, roughness: 0.9, sheen: 0.7, sheenColor: new THREE.Color(0x9aa3b6), sheenRoughness: 0.6 })); m.position.copy(c); m.castShadow = m.receiveShadow = true; m.layers.enable(1); scene.add(m);
  return { m, geo, base: Float32Array.from(P.array) };
}
function makeTable(scene) {
  const g = new THREE.Group(); g.position.set(TBL.x, 0, TBL.z); scene.add(g);
  const wood = phys({ color: 0x15100c, roughness: 0.45, clearcoat: 0.5, clearcoatRoughness: 0.3 });
  const top = new THREE.Mesh(new RoundedBoxGeometry(TBL.w, 0.03, TBL.d, 4, 0.008), wood); top.position.y = TBL.top - 0.015; g.add(top);
  const body = new THREE.Mesh(new RoundedBoxGeometry(TBL.w - 0.03, 0.34, TBL.d - 0.03, 4, 0.01), wood); body.position.y = TBL.top - 0.2; g.add(body);
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.01, TBL.top - 0.37, 16), wood); leg.position.set(x * (TBL.w / 2 - 0.04), (TBL.top - 0.37) / 2, z * (TBL.d / 2 - 0.04)); g.add(leg); }
  shadows(g); g.traverse((o) => o.layers.enable(1)); return g;
}

// ------------------------------------------------------------------ the tape: a roll on the table, a box that promises, a strip on the mouth
function makeRoll(scene) {
  const g = new THREE.Group(); g.position.copy(ROLL); scene.add(g);
  const prof = []; const ri = 0.0245, ro = ROLL_R, h = 0.0125;
  prof.push(new THREE.Vector2(ri, 0), new THREE.Vector2(ro, 0), new THREE.Vector2(ro, h), new THREE.Vector2(ri, h), new THREE.Vector2(ri, 0));
  const tapeTex = noiseTex(9, 256, 0.85, 1.0, 6);
  const tape = new THREE.Mesh(new THREE.LatheGeometry(prof, 96), phys({ color: 0xf1efe9, roughness: 0.78, roughnessMap: tapeTex, sheen: 0.4, sheenColor: new THREE.Color(0xffffff) })); g.add(tape);
  const core = new THREE.Mesh(new THREE.CylinderGeometry(ri, ri, h + 0.001, 64, 1, true), phys({ color: 0xb59a6e, roughness: 0.8, side: THREE.DoubleSide })); core.position.y = h / 2; g.add(core);
  const logo = makeLogoRing(LOGO_R); logo.g.rotation.x = -Math.PI / 2; logo.g.position.y = h + 0.0006; g.add(logo.g);
  shadows(g); g.traverse((o) => o.layers.enable(1));
  return { g, tape, logo, top: h };
}
function makeBox(scene) {   // the tape's box: three promises, lit in turn
  const g = new THREE.Group(); g.position.copy(BOX); g.rotation.y = -0.55; scene.add(g);
  const draw = (lit) => (x, w, h) => {
    x.fillStyle = '#e9edf2'; x.fillRect(0, 0, w, h); x.fillStyle = '#2b3a67'; x.fillRect(0, 0, w, 120);
    txt(x, 'SLEEP TAPE', w / 2, 66, { font: '900 64px Archivo', color: '#ffffff', track: 8, maxW: w * 0.9 });
    ['BETTER SLEEP', 'LESS SNORING', 'SHARPER JAW'].forEach((s, i) => { const y = 200 + i * 92, on = lit[i];
      x.fillStyle = on ? '#2b3a67' : 'rgba(43,58,103,0.12)'; x.beginPath(); x.roundRect(40, y - 36, w - 80, 72, 14); x.fill();
      txt(x, '✓ ' + s, w / 2, y + 2, { font: '800 44px Archivo', color: on ? '#ffffff' : '#2b3a67', track: 3, maxW: w * 0.78 }); });
    txt(x, '30 STRIPS', w / 2, h - 34, { font: '700 30px Archivo', color: '#5b6478', track: 8 }); };
  const texs = [[0, 0, 0], [1, 0, 0], [1, 1, 0], [1, 1, 1]].map((l) => canvasTex(512, 520, draw(l)));
  const front = new THREE.MeshPhysicalMaterial({ map: texs[0], roughness: 0.5, clearcoat: 0.4 }), side = phys({ color: 0xe9edf2, roughness: 0.5 }), topM = phys({ color: 0x2b3a67, roughness: 0.5 });
  const m = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.04), [side, side, topM, side, front, side]); m.position.y = 0.05; g.add(m);
  shadows(g); g.traverse((o) => o.layers.enable(1));
  return { g, front, texs, k: 0 };
}
// before and after: two small frames lying face down on the table; they stand up on cue, the same skull in profile in each (the gag)
function makeFrames(scene) {
  const g = new THREE.Group(); g.position.copy(FRAMES); g.rotation.y = 0.35; scene.add(g);
  const photo = (word) => canvasTex(512, 640, (x, w, h) => {
    x.fillStyle = '#e8e4da'; x.fillRect(0, 0, w, h); x.fillStyle = '#16181c'; x.fillRect(36, 36, w - 72, h - 160);
    // a skull in profile, drawn simply, the same in both
    x.save(); x.translate(w / 2 + 10, 260); x.fillStyle = '#d9d2c3';
    x.beginPath(); x.ellipse(-20, -40, 120, 108, 0, 0, Math.PI * 2); x.fill();
    x.beginPath(); x.moveTo(60, -10); x.lineTo(118, 30); x.lineTo(104, 60); x.lineTo(70, 66); x.lineTo(84, 110); x.lineTo(40, 140); x.lineTo(-30, 140); x.lineTo(-48, 60); x.closePath(); x.fill();
    x.fillStyle = '#16181c'; x.beginPath(); x.ellipse(52, -22, 26, 22, 0, 0, Math.PI * 2); x.fill(); x.beginPath(); x.moveTo(100, 18); x.lineTo(112, 36); x.lineTo(96, 40); x.closePath(); x.fill();
    for (let k = 0; k < 6; k++) { x.fillStyle = '#16181c'; x.fillRect(54 + k * 9, 72, 3, 18); }
    x.restore();
    txt(x, word, w / 2, h - 66, { font: '800 56px Archivo', color: '#16181c', track: 10 });
  });
  const frameM = phys({ color: 0x1c1d21, roughness: 0.4, clearcoat: 0.5 }), hinges = [];
  const mk = (word, dx) => { const h = new THREE.Group(); h.position.set(dx, 0.0015, 0); g.add(h);   // hinged at its bottom edge
    const border = new THREE.Mesh(new RoundedBoxGeometry(0.084, 0.104, 0.008, 2, 0.002), frameM); border.position.set(0, 0.052, -0.004); h.add(border);
    const pic = new THREE.Mesh(new THREE.PlaneGeometry(0.072, 0.09), new THREE.MeshPhysicalMaterial({ map: photo(word), roughness: 0.4, clearcoat: 0.6 })); pic.position.set(0, 0.052, 0.0004); h.add(pic);
    const sp = new THREE.Group(); sp.position.set(0, 0.09, -0.008); h.add(sp);   // the stand on the back, folded flat until it stands
    const strut = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.09, 0.003), frameM); strut.position.set(0, -0.045, -0.0015); sp.add(strut);
    hinges.push({ h, sp }); };
  mk('BEFORE', -0.048); mk('AFTER', 0.048);
  shadows(g); g.traverse((o) => o.layers.enable(1));
  return { g, hinges };
}
// white surgical tape, curved round the front teeth (built in the head's own standing frame); it peels off from its left end
function makeStrip() {
  const w = 0.072, h = 0.03, n = 36, R = 0.042, c = new THREE.Vector3(0, 1.62, 0.052);   // the arc's axis, behind the front teeth
  const geo = new THREE.PlaneGeometry(w, h, n, 4), P = geo.attributes.position, uv0 = new Float32Array(P.count * 2);
  for (let i = 0; i < P.count; i++) { uv0[i * 2] = P.getX(i); uv0[i * 2 + 1] = P.getY(i); }
  const tex = canvasTex(512, 220, (x, w2, h2) => { x.fillStyle = '#f3f1ec'; x.fillRect(0, 0, w2, h2); x.globalAlpha = 0.35;
    for (let k = 0; k < 160; k++) { x.strokeStyle = k % 2 ? '#d8d4ca' : '#ffffff'; x.lineWidth = 1; x.beginPath(); x.moveTo(k * 3.2, 0); x.lineTo(k * 3.2 + 6, h2); x.stroke(); }
    x.globalAlpha = 1; for (let k = 0; k < 40; k++) { x.fillStyle = 'rgba(160,155,145,0.4)'; x.beginPath(); x.arc(20 + k * 12, 14, 2.2, 0, Math.PI * 2); x.fill(); x.beginPath(); x.arc(20 + k * 12, h2 - 14, 2.2, 0, Math.PI * 2); x.fill(); } });
  const m = new THREE.Mesh(geo, new THREE.MeshPhysicalMaterial({ map: tex, roughness: 0.7, sheen: 0.5, sheenColor: new THREE.Color(0xffffff), side: THREE.DoubleSide, transparent: true }));
  m.castShadow = true; m.layers.enable(1); m.userData = { w, R, c, uv0, k: -1 };
  peelStrip(m, 0);
  return m;
}
// k = 0: stuck flat round the teeth; k = 1: peeled all the way. The peeled part curls up off the teeth and back over itself.
function peelStrip(m, k) {
  const U = m.userData; if (Math.abs(U.k - k) < 1e-5) return; U.k = k;
  const { w, R, c, uv0 } = U, P = m.geometry.attributes.position, sf = w / 2 - k * (w + 0.014), af = sf / R;
  const fx = c.x + Math.sin(af) * R, fz = c.z + Math.cos(af) * R, tx = Math.cos(af), tz = -Math.sin(af), nx = Math.sin(af), nz = Math.cos(af);
  const TH = 1.9, L = 0.007, kk = TH / L;
  for (let i = 0; i < P.count; i++) { const u = uv0[i * 2], v = uv0[i * 2 + 1];
    if (u <= sf) { const a = u / R; P.setXYZ(i, c.x + Math.sin(a) * R, c.y + v, c.z + Math.cos(a) * R); continue; }
    const d = u - sf; let x1, x2;
    if (d <= L) { x1 = Math.sin(kk * d) / kk; x2 = (1 - Math.cos(kk * d)) / kk; } else { x1 = Math.sin(TH) / kk + (d - L) * Math.cos(TH); x2 = (1 - Math.cos(TH)) / kk + (d - L) * Math.sin(TH); }
    P.setXYZ(i, fx + tx * x1 + nx * x2, c.y + v, fz + tz * x1 + nz * x2); }
  P.needsUpdate = true; m.geometry.computeVertexNormals();
}

// ------------------------------------------------------------------ the board on the wall: three polls (left half), ten studies (right half)
const POLLS = [['2023', 12], ['2024', 5], ['2025', 7]];
const IMPROVED = [6, 8];   // which of the ten study cards showed the main apnoea score improving (Huang 2015, Lee 2022)
function makeBoard(scene) {
  const g = new THREE.Group(); scene.add(g); const Zf = BOARD.z + 0.001;
  const panel = new THREE.Mesh(new RoundedBoxGeometry(BOARD.x1 - BOARD.x0, BOARD.y1 - BOARD.y0, 0.02, 4, 0.01), phys({ color: 0x111215, roughness: 0.55, clearcoat: 0.2 }));
  panel.position.set((BOARD.x0 + BOARD.x1) / 2, (BOARD.y0 + BOARD.y1) / 2, BOARD.z - 0.01); g.add(panel);
  const plane = (w, h, tex, x, y, o = {}) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0, ...o })); m.position.set(x, y, Zf); g.add(m); return m; };
  const title = (s2, x) => plane(0.4, 0.032, canvasTex(1500, 120, (c, w, h) => { c.clearRect(0, 0, w, h); txt(c, s2, w / 2, h / 2, { font: '600 58px "Geist Mono"', color: '#8d9097', track: 8, maxW: w * 0.98 }); }), x, 1.556);
  // polls: each a bar of 100 dots (20 by 5), filled column by column; the year and the share at its left
  const dotGeo = new THREE.CircleGeometry(0.0046, 18), dots = [], offM = new THREE.MeshBasicMaterial({ color: 0x34373e }), P = 0.0142;
  POLLS.forEach(([yr, n], p) => { const y = 1.445 - p * 0.146;
    for (let k = 0; k < 100; k++) { const col = Math.floor(k / 5), row = k % 5, lit = k < n;
      const m = new THREE.Mesh(dotGeo, lit ? new THREE.MeshBasicMaterial({ color: new THREE.Color(0xeceef1).multiplyScalar(1.3), transparent: true, opacity: 0 }) : offM);
      m.position.set(PX - 0.083 + col * P, y + (2 - row) * P, Zf); g.add(m); if (lit) dots.push({ m, p, k }); }
    const lab = plane(0.105, 0.0788, canvasTex(400, 300, (c, w, h) => { c.clearRect(0, 0, w, h); txt(c, yr, w / 2, 74, { font: '600 58px "Geist Mono"', color: '#a6a9b0', track: 8 }); txt(c, n + '%', w / 2, 196, { font: '800 120px Archivo', color: '#eceef1', track: 2 }); }), PX - 0.15, y);
    dots.push({ lab, p });
  });
  const pollTitle = title('US ADULTS WHO HAVE TRIED IT', PX);
  // the review: ten study cards, two rows of five
  const cards = [];
  for (let k = 0; k < 10; k++) { const i = k % 5, j = Math.floor(k / 5), x = RX - 0.16 + i * 0.08, y = 1.43 - j * 0.122;
    const tex = canvasTex(256, 320, (c, w, h) => { c.fillStyle = '#e8e6e0'; c.fillRect(0, 0, w, h); c.fillStyle = '#16181c'; c.fillRect(24, 30, w - 48, 22); for (let r = 0; r < 9; r++) { c.fillStyle = 'rgba(22,24,28,0.3)'; c.fillRect(24, 80 + r * 22, (w - 48) * (0.6 + 0.4 * hash(k * 9 + r)), 8); } });
    const m = plane(0.07, 0.0875, tex, x, y);
    const glow = plane(0.082, 0.0995, null, x, y, { color: new THREE.Color(0xeceef1).multiplyScalar(1.4), blending: THREE.AdditiveBlending, depthWrite: false }); glow.position.z -= 0.0005;
    const mild = plane(0.064, 0.024, canvasTex(256, 96, (c, w, h) => { c.clearRect(0, 0, w, h); c.strokeStyle = '#2b3a67'; c.lineWidth = 6; c.strokeRect(8, 8, w - 16, h - 16); txt(c, 'MILD', w / 2, h / 2 + 2, { font: '800 52px Archivo', color: '#2b3a67', track: 8 }); }), x + 0.004, y - 0.014);
    mild.position.z += 0.0008; mild.rotation.z = 0.2;
    cards.push({ m, glow, mild, k });
  }
  const revTitle = title('REVIEW 2025 · 10 STUDIES · 213 PEOPLE', RX);
  const verdict = plane(0.4, 0.0465, canvasTex(1500, 174, (c, w, h) => { c.clearRect(0, 0, w, h); c.strokeStyle = '#eceef1'; c.lineWidth = 5; c.strokeRect(6, 6, w - 12, h - 12); txt(c, 'VERDICT: NOT SUPPORTED AS A TREATMENT', w / 2, h / 2 + 3, { font: '800 64px Archivo', color: '#eceef1', track: 4, maxW: w * 0.9 }); }), RX, 1.152);
  g.traverse((o) => o.layers.enable(1));
  return { g, dots, cards, pollTitle, revTitle, verdict };
}

// ------------------------------------------------------------------ the airway: two paths in the head's own standing frame, air as specks along them
// (from the bones: the nostrils under the alar cartilages, the nasal floor on the palate, the throat in front of the
// neck bones, the larynx inside the thyroid cartilage). Each path has a door: the nostrils, the lips.
const THROAT = [[0, 1.604, 0.0], [0, 1.586, 0.004], [0, 1.57, 0.008], [0, 1.554, 0.006], [0, 1.532, 0.006], [0, 1.508, 0.007]];
const NOSE_PATH = [[0, 1.626, 0.13], [0.006, 1.64, 0.104], [0.008, 1.65, 0.088], [0.008, 1.655, 0.064], [0.008, 1.656, 0.04], [0.006, 1.652, 0.016], [0.002, 1.64, 0.002], [0, 1.622, -0.002], ...THROAT];
const MOUTH_PATH = [[0, 1.612, 0.136], [0, 1.6145, 0.105], [0, 1.6152, 0.088], [0, 1.62, 0.066], [0, 1.626, 0.042], [0, 1.624, 0.018], [0, 1.612, 0.004], ...THROAT];
const DOOR = { nose: 1, mouth: 1 };   // the index of the door on each path
function groupFor(y, z) { const R = W.rig; return z > 0.012 || y > 1.632 ? R.seg.Atlas : y > 1.598 ? R.seg.Axis : R.seg['Fourth cervical vertebra']; }
function pathWorld(P) { return P.map(([x, y, z]) => { const s = groupFor(y, z), p = new THREE.Vector3(x, y, z); return p.sub(s.pivot).applyMatrix4(s.g.matrixWorld); }); }
function doorU(P, i) { let a = 0, all = 0; for (let k = 1; k < P.length; k++) { const d = Math.hypot(P[k][0] - P[k - 1][0], P[k][1] - P[k - 1][1], P[k][2] - P[k - 1][2]); all += d; if (k <= i) a += d; } return a / all; }
const NSPECK = 40;
function makeAir(scene) {
  const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xbfd6ff).multiplyScalar(1.5), transparent: true, opacity: 0.9, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending });
  const specks = new THREE.InstancedMesh(new THREE.SphereGeometry(0.0024, 10, 8), mat, NSPECK * 2); specks.frustumCulled = false; specks.renderOrder = 9; scene.add(specks);
  const lineMat = (c) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending });
  const tubeN = new THREE.Mesh(new THREE.BufferGeometry(), lineMat(new THREE.Color(0x9fc0ff))), tubeM = new THREE.Mesh(new THREE.BufferGeometry(), lineMat(new THREE.Color(0x9fc0ff)));
  for (const m of [tubeN, tubeM]) { m.frustumCulled = false; m.renderOrder = 8; scene.add(m); }
  const plug = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xd9483c).multiplyScalar(1.15), transparent: true, opacity: 0, depthTest: false, depthWrite: false })); plug.renderOrder = 10; scene.add(plug);
  return { specks, mat, tubeN, tubeM, plug, dn: doorU(NOSE_PATH, DOOR.nose), dm: doorU(MOUTH_PATH, DOOR.mouth), plugU: (doorU(NOSE_PATH, 1) + doorU(NOSE_PATH, 3)) / 2 };
}
// the specks, simulated from a fixed start so that every frame agrees: they move along at a steady pace; at a shut door they
// queue, a few deep, and the ones already inside drain down the throat
const AIR_T0 = 36.0, AIR_V = 0.3, AIR_DT = 1 / 120;
function airSim(t, open, door) {
  const u = Array.from({ length: NSPECK }, (_, k) => k / NSPECK), held = new Array(NSPECK).fill(-1); let q = 0;
  for (let tt = AIR_T0; tt < t; tt += AIR_DT) {
    const o = open(tt);
    if (o && q) { held.fill(-1); q = 0; }
    for (let k = 0; k < NSPECK; k++) {
      if (held[k] >= 0) continue;
      const out = u[k] < door, v = AIR_V * (o || !out ? 1 : 0.55);
      let nu = u[k] + v * AIR_DT;
      if (!o && out) { const slot = door - 0.011 * q - 0.004; if (nu >= slot) { if (q < 8) { nu = slot; held[k] = q; q++; } else nu = Math.min(nu, slot); } }
      if (nu >= 1) nu -= 1;
      u[k] = nu;
    }
  }
  return u;
}

// ------------------------------------------------------------------ build
async function build(S, cfg) {
  const scene = S.scene;
  S.fog.near = 4; S.fog.far = 14;
  S.table.scale.set(3, 3, 1); S.tableMat.clearcoat = 0.12; S.tableMat.specularIntensity = 0.35;
  for (const m of [S.tableMat.map, S.tableMat.roughnessMap]) if (m) { m.wrapS = m.wrapT = THREE.RepeatWrapping; m.repeat.multiplyScalar(3); }
  const meshes = await loadAnatomy(skeletonKind());
  const R = W.rig = buildRig(meshes);
  W.body = new THREE.Group(); scene.add(W.body); R.root.position.copy(R.P0).negate(); W.body.add(R.root);
  for (const m of meshes) { m.castShadow = true; m.receiveShadow = true; m.layers.enable(1); }
  W.meshes = meshes;
  const at = R.seg.Atlas;
  // the jaw on its own hinge (between the jaw joints), so the mouth can open when it breathes through it
  W.body.updateMatrixWorld(true);
  W.jawG = new THREE.Group(); W.jawG.position.copy(new THREE.Vector3(0, 1.668, -0.003)).sub(at.pivot); at.g.add(W.jawG); at.g.updateMatrixWorld(true);
  for (const m of meshes) if (/^mandible$|lower .*tooth/i.test(m.userData.name)) W.jawG.attach(m);
  // the factory stamp: on the left temple, above the jaw joint (it faces the camera in profile)
  { const tb = meshes.find((m) => m.userData.name === 'Left temporal bone'); tb.material = tb.material.clone();
    W.stampSpot = stampSpot(tb, { from: [0.12, 0.016, 0.006], dir: [-1, 0, 0], spread: 0.003 });
    if (W.stampSpot) W.stamp = stamp(tb, { canvas: stampCanvas(['HUMAN FACTORY', 'SETTINGS'], '', { frame: false }), center: W.stampSpot.center, normal: W.stampSpot.normal, up: [0, 0, 1], width: 0.022, depth: 0.016, opacity: 0.6 }); }
  // the strip of tape, riding with the head
  W.strip = makeStrip(); W.strip.position.copy(at.pivot).negate(); const sg = new THREE.Group(); at.g.add(sg); sg.add(W.strip); W.stripG = sg;
  // ---- the set
  W.bed = makeBed(scene); makeTable(scene);
  W.roll = makeRoll(scene); W.box = makeBox(scene); W.frames = makeFrames(scene); W.board = makeBoard(scene); W.air = makeAir(scene);
  W.lamp = makeLamp(); W.lamp.g.position.copy(LAMP); scene.add(W.lamp.g); W.lamp.g.traverse((o) => o.layers.enable(1));
  // ---- lying: place the body, press the bed, a pillow under the skull
  W.qLie = new THREE.Quaternion().setFromAxisAngle(X, -Math.PI / 2);
  poseRig(0); W.body.quaternion.copy(W.qLie); W.body.position.set(0, 0, 0); W.body.updateMatrixWorld(true);
  const bb = (re) => { const b = new THREE.Box3(); for (const m of meshes) if (re.test(m.userData.name)) b.expandByObject(m); return b; };
  const heel = bb(/calcaneus/i), skull = bb(/parietal bone|occipital bone|frontal bone/i), occ = bb(/occipital bone/i);
  W.lieP = new THREE.Vector3(0, BED.top - 0.012 - heel.min.y, BED.z0 + 0.075 - skull.min.z);
  const occY = occ.min.y + W.lieP.y, occZ = (occ.min.z + occ.max.z) / 2 + W.lieP.z, ph = (occY + 0.04 - BED.top) / 2;
  W.pillow = makePillow(scene, new THREE.Vector3(0, BED.top + ph - 0.004, occZ - 0.03), new THREE.Vector3(0.3, ph, 0.19));
  W.body.position.copy(W.lieP); W.body.updateMatrixWorld(true);
  { const out = [], v = new THREE.Vector3(); for (const m of meshes) { const P = m.geometry.attributes.position; for (let i = 0; i < P.count; i += 2) { v.fromBufferAttribute(P, i).applyMatrix4(m.matrixWorld); out.push(v.x, v.y, v.z); } }
    const dent = imprint(out, { x0: BED.x0, x1: BED.x1, z0: BED.z0, z1: BED.z1, nx: MAT.nx, nz: MAT.nz }, (x, z) => BED.top - edgeDrop(x, z), { gap: 0.002, dil: 2, blur: 4, max: 0.08 });
    const P = W.bed.geo.attributes.position.array; for (let k = 0; k < W.bed.base.length / 3; k++) P[k * 3 + 1] = W.bed.base[k * 3 + 1] - dent[k] * W.bed.edge[k];
    W.bed.geo.attributes.position.needsUpdate = true; W.bed.geo.computeVertexNormals();
    const PP = W.pillow.base, c = W.pillow.m.position, cell = new Map(), key = (x, z) => `${Math.round(x / 0.008)},${Math.round(z / 0.008)}`;
    for (let p = 0; p < out.length; p += 3) { const x = out[p] - c.x, y = out[p + 1] - c.y, z = out[p + 2] - c.z; if (Math.abs(x) > 0.32 || Math.abs(z) > 0.21) continue; const k = key(x, z); cell.set(k, Math.min(cell.get(k) ?? 9, y)); }
    const PA = W.pillow.geo.attributes.position;
    for (let i = 0; i < PA.count; i++) { const x = PP[i * 3], y = PP[i * 3 + 1], z = PP[i * 3 + 2]; if (y < 0) continue; let lo = 9;
      for (let a = -3; a <= 3; a++) for (let b = -3; b <= 3; b++) { const vv = cell.get(`${Math.round(x / 0.008) + a},${Math.round(z / 0.008) + b}`); if (vv !== undefined) lo = Math.min(lo, vv + 0.004 + 0.0012 * (a * a + b * b)); }
      PA.setY(i, y - Math.max(0, y - lo)); }
    PA.needsUpdate = true; W.pillow.geo.computeVertexNormals(); }
  // where the mouth is, in the world (for the camera)
  W.mouth = new THREE.Vector3(0, 1.62, 0.1).sub(at.pivot).applyMatrix4(at.g.matrixWorld);
  W.nose = new THREE.Vector3(0, 1.66, 0.1).sub(at.pivot).applyMatrix4(at.g.matrixWorld);
  const headW = (x, y, z) => new THREE.Vector3(x, y, z).sub(at.pivot).applyMatrix4(at.g.matrixWorld);
  W.airC = headW(0, 1.582, 0.071); W.nostril = headW(0.006, 1.64, 0.104); W.lips = headW(0, 1.6145, 0.105); W.nasal = headW(0.008, 1.652, 0.07);
  // ---- light: moonlight through a window, a cold rim, a warm table light
  const cookie = canvasTex(512, 512, (x, w) => { x.fillStyle = '#000'; x.fillRect(0, 0, w, w); x.filter = 'blur(4px)'; x.fillStyle = '#fff'; const m = 50, gap = 26, pw = (w - 2 * m - gap * 2) / 3, phh = (w - 2 * m - gap * 3) / 4; for (let i = 0; i < 3; i++) for (let j = 0; j < 4; j++) x.fillRect(m + i * (pw + gap), m + j * (phh + gap), pw, phh); }, { srgb: false });
  W.key = spot(scene, { color: 0xb8c8ff, pos: new THREE.Vector3(2.6, 2.6, -0.6), target: new THREE.Vector3(0.05, 0.5, -0.35), angle: 0.42, penumbra: 0.35, shadow: true, size: cfg.shadow ?? 1024 });
  W.key.map = cookie; W.key.shadow.camera.far = 7;
  W.rim = spot(scene, { color: 0x9fb6ff, pos: new THREE.Vector3(-0.9, 1.9, -2.2), target: new THREE.Vector3(0, 0.55, -0.4), angle: 0.5, penumbra: 0.9 });
  W.fill = spot(scene, { color: 0xc8d6ff, pos: new THREE.Vector3(-1.8, 1.4, 1.6), target: new THREE.Vector3(0, 0.5, -0.3), angle: 0.6, penumbra: 1 });
  W.faceLight = spot(scene, { color: 0xffe9d2, pos: new THREE.Vector3(0.6, 1.4, -0.2), target: W.mouth.clone(), angle: 0.22, penumbra: 0.9 });
  W.tableLight = spot(scene, { color: 0xffe2c0, pos: new THREE.Vector3(1.3, 1.5, -0.3), target: new THREE.Vector3(0.82, TBL.top, -0.85), angle: 0.32, penumbra: 0.8 });
  W.boardLight = spot(scene, { color: 0xe6ecff, pos: new THREE.Vector3(0.0, 2.1, 0.5), target: new THREE.Vector3(0, (BOARD.y0 + BOARD.y1) / 2, BOARD.z), angle: 0.5, penumbra: 0.6 });
  return { stamp: W.stampSpot, lieP: W.lieP.toArray(), mouth: W.mouth.toArray(), nose: W.nose.toArray() };
}

// ------------------------------------------------------------------ the body (lying, arms at the sides, feet fallen out; a breath)
const ARM_LIE = { dir: [-0.1, -1, -0.09], twist: 0, elbow: 0.1 };
function poseRig(b) {
  const R = W.rig;
  bendSpine(R.seg, { lum: 0, tho: -0.01 * b, cer: 0.3 });
  poseArm(R.arms.Right, ARM_LIE); poseArm(R.arms.Left, ARM_LIE);
  for (const Side of ['Right', 'Left']) { const G = R.legs[Side], s = G.s; G.hip.quaternion.setFromAxisAngle(Y, 0.22 * s); G.knee.quaternion.identity(); G.ankle.quaternion.setFromAxisAngle(X, 0.62); }
  if (W.jawG) W.jawG.rotation.x = 0.1 * (W.jawOpen || 0);
}
function breathAt(t) { return 0.5 - 0.5 * Math.cos((t / 4.6) * Math.PI * 2); }
// the tape: k = how far it is peeled (0 stuck, 1 off), g = gone (lifted away and faded). Off for the mouth-breathing line,
// back on for "tape your mouth over a blocked nose", peeled off for good at "don't tape"
function peelAt(t) {
  const off1 = s5(39.95, 41.43, t), gone1 = s5(41.43, 41.93, t), back = s5(44.73, 45.13, t), stick = s5(45.13, 45.68, t);
  const off2 = s5(T.dont + 0.05, T.tape3 + 0.2, t), gone2 = s5(T.tape3 + 0.2, T.see + 0.3, t);
  return { k: Math.max(off1 * (1 - stick), off2), g: Math.max(gone1 * (1 - back), gone2) };
}
// the airway: on for the airway shot; the nose blocks at "a blocked nose"; the mouth opens while the tape is off
function airAt(t) {
  const on = s5(36.5, 37.4, t) * (1 - s5(50.9, 51.6, t));
  const block = s5(T.blocked - 0.2, T.nose2 + 0.3, t);
  const jaw = s5(41.0, 41.8, t) * (1 - s5(44.75, 45.15, t));                      // the jaw drops while it breathes through the mouth
  const mouthVis = s5(41.5, 42.1, t);                                              // the mouth's air shows once the tape is off
  const both = s5(T.shut2 - 0.3, T.only + 0.2, t);                                 // tape over a blocked nose: no way left
  return { on, block, jaw, mouthVis, both };
}
const noseOpen = (t) => airAt(t).block < 0.5, mouthOpen = (t) => peelAt(t).g > 0.5;

// ------------------------------------------------------------------ the camera: one path, no cuts
let CAM = null;
function buildCam() {
  const M = W.mouth, Ac = W.airC, Rl = ROLL, Bx = BOX, Fr = FRAMES, Bz = BOARD.z;
  return camTrack([
    { t: -3.0, p: V3(M.x + 0.05, M.y + 0.43, M.z + 0.41), l: V3(M.x, M.y + 0.02, M.z - 0.075), fov: 30 },
    { t: 0.0, p: V3(M.x + 0.05, M.y + 0.42, M.z + 0.4), l: V3(M.x, M.y + 0.02, M.z - 0.075), fov: 30, tens: 0.5 },     // the tape on the mouth
    { t: 4.0, p: V3(M.x + 0.045, M.y + 0.37, M.z + 0.35), l: V3(M.x, M.y + 0.02, M.z - 0.07), fov: 30, stop: true },
    { t: 5.6, p: V3(PX, CAMY, Bz + CAMD), l: V3(PX, CAMY - 0.002, Bz), fov: 40, stop: true },                         // the polls
    { t: 10.9, p: V3(PX + 0.012, CAMY, Bz + CAMD - 0.04), l: V3(PX, CAMY - 0.002, Bz), fov: 40, stop: true },
    { t: 12.2, p: V3(Bx.x - 0.303, Bx.y + 0.22, Bx.z + 0.494), l: V3(Bx.x, Bx.y + 0.09, Bx.z), fov: 30, stop: true }, // the promises
    { t: 15.9, p: V3(Bx.x - 0.294, Bx.y + 0.214, Bx.z + 0.48), l: V3(Bx.x, Bx.y + 0.09, Bx.z), fov: 30, stop: true },
    { t: 17.4, p: V3(RX, CAMY, Bz + CAMD), l: V3(RX, CAMY - 0.002, Bz), fov: 40, stop: true },                        // the review
    { t: 36.0, p: V3(RX - 0.012, CAMY, Bz + CAMD - 0.07), l: V3(RX, CAMY - 0.002, Bz), fov: 40, stop: true },
    { t: 37.4, p: V3(Ac.x + 0.93, Ac.y + 0.11, Ac.z - 0.013), l: V3(Ac.x, Ac.y - 0.01, Ac.z - 0.033), fov: 30, stop: true },   // the airway, in profile
    { t: 50.6, p: V3(Ac.x + 0.9, Ac.y + 0.105, Ac.z - 0.016), l: V3(Ac.x, Ac.y - 0.01, Ac.z - 0.033), fov: 30, stop: true },
    { t: 51.9, p: V3(Fr.x + 0.226, Fr.y + 0.13, Fr.z + 0.62), l: V3(Fr.x, Fr.y + 0.07, Fr.z), fov: 32, stop: true },  // before and after
    { t: 54.8, p: V3(Fr.x + 0.22, Fr.y + 0.127, Fr.z + 0.6), l: V3(Fr.x, Fr.y + 0.07, Fr.z), fov: 32, stop: true },
    { t: 56.4, p: V3(M.x + 0.3, M.y + 0.42, M.z + 0.42), l: V3(M.x, M.y, M.z - 0.07), fov: 32, stop: true },        // see a doctor: the tape comes off
    { t: 64.4, p: V3(M.x + 0.28, M.y + 0.39, M.z + 0.39), l: V3(M.x, M.y, M.z - 0.07), fov: 32, stop: true },
    { t: 65.9, p: V3(Rl.x + 0.18, Rl.y + 0.24, Rl.z + 0.2), l: V3(Rl.x, Rl.y + 0.01, Rl.z), fov: 30 },
    { t: T.logo, p: V3(Rl.x, Rl.y + 0.3, Rl.z + 0.004), l: V3(Rl.x, Rl.y + 0.0131, Rl.z), fov: 30, stop: true },         // straight down on the roll: the logo
  ]);
}
function camPose(S, t) {
  const v = S.cfg.view; if (v && typeof v === 'object') return v;
  if (!CAM) CAM = buildCam();
  if (t <= T.logo) return CAM(t);
  const Q = CAM(T.logo), k = ss(T.logo, T.end, t); return { p: [Q.p[0], lerp(Q.p[1], Q.p[1] - 0.025, k), Q.p[2]], l: Q.l, fov: 30 };
}
W.camAt = (t) => camPose({ cfg: {} }, t);
function focusAt(S, t, P) { return Math.hypot(P.p[0] - P.l[0], P.p[1] - P.l[1], P.p[2] - P.l[2]); }

// ------------------------------------------------------------------ one moment of the film
const _m4 = new THREE.Matrix4(), _p3 = new THREE.Vector3(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(1, 1, 1);
function update(S, t) {
  const scene = S.scene, endDark = ss(T.factory - 0.5, T.logo - 0.3, t), R = W.rig, a = airAt(t);
  W.jawOpen = a.jaw; poseRig(breathAt(t)); W.body.quaternion.copy(W.qLie); W.body.position.copy(W.lieP); W.body.updateMatrixWorld(true);
  // ---- the strip of tape: peeled, lifted away, put back
  { const P = peelAt(t); peelStrip(W.strip, P.k); W.strip.visible = P.g < 0.995; W.strip.material.opacity = 1 - P.g;
    W.strip.position.copy(R.seg.Atlas.pivot).negate().add(new THREE.Vector3(0.025 * P.g, 0.012 * P.g, 0.07 * P.g)); }
  // ---- the board: polls, then the review
  { const B = W.board, pollsOn = s5(T.three - 0.6, T.polls, t), revOn = s5(T.review - 0.6, T.review, t);
    B.pollTitle.material.opacity = pollsOn;
    for (const d of B.dots) { if (d.lab) { d.lab.material.opacity = pollsOn * s5(T.five - 0.3 + d.p * 0.25, T.five + 0.3 + d.p * 0.25, t); continue; } d.m.material.opacity = pollsOn * s5(T.polls + d.p * 0.4 + d.k * 0.03, T.polls + 0.3 + d.p * 0.4 + d.k * 0.03, t); }
    B.revTitle.material.opacity = revOn * s5(T.ten - 0.2, T.ten + 0.3, t);
    for (const c of B.cards) { const inK = s5(T.ten - 0.2 + c.k * 0.06, T.ten + 0.2 + c.k * 0.06, t), imp = IMPROVED.includes(c.k);
      const dim = 1 - 0.65 * s5(T.showed - 0.2, T.main, t) * (imp ? 0 : 1) - 0.55 * s5(T.verdict - 0.2, T.data, t) * (imp ? 1 : 0);
      c.m.material.opacity = revOn * inK * dim; c.glow.material.opacity = imp ? 0.4 * pulse(t, T.showed - 0.1, T.verdict, 0.3) : 0; c.mild.material.opacity = imp ? s5(T.mild - 0.2, T.mild + 0.2, t) * (1 - s5(T.verdict - 0.2, T.data, t)) : 0; }
    B.verdict.material.opacity = s5(T.data - 0.3, T.support + 0.2, t) * (1 - s5(36.3, 37.0, t)); }
  // ---- the box: its promises, in turn
  { const B = W.box, k = t < T.better ? 0 : t < T.less ? 1 : t < T.even ? 2 : 3; if (k !== B.k) { B.k = k; B.front.map = B.texs[k]; B.front.needsUpdate = true; } }
  // ---- the airway
  { const A = W.air, vis = a.on > 0.002;
    A.tubeN.visible = A.tubeM.visible = A.specks.visible = A.plug.visible = vis;
    if (vis) {
      const cN = new THREE.CatmullRomCurve3(pathWorld(NOSE_PATH)), cM = new THREE.CatmullRomCurve3(pathWorld(MOUTH_PATH));
      A.tubeN.geometry.dispose(); A.tubeN.geometry = new THREE.TubeGeometry(cN, 90, 0.0014, 6);
      A.tubeM.geometry.dispose(); A.tubeM.geometry = new THREE.TubeGeometry(cM, 90, 0.0014, 6);
      A.tubeN.material.opacity = 0.35 * a.on; A.tubeM.material.opacity = 0.35 * a.on * (0.3 + 0.7 * a.mouthVis);
      A.tubeN.material.color.setHex(a.block > 0.5 ? 0xc0605a : 0x9fc0ff); A.tubeM.material.color.setHex(a.both > 0.5 ? 0xc0605a : 0x9fc0ff);
      const uN = airSim(t, noseOpen, A.dn), uM = airSim(t, mouthOpen, A.dm);
      for (let i = 0; i < NSPECK * 2; i++) { const nose = i < NSPECK, u = nose ? uN[i] : uM[i - NSPECK], v = nose ? 1 : a.mouthVis;
        const p = (nose ? cN : cM).getPointAt(u), sc = Math.max(0.001, v * ss(0.0, 0.05, u) * (1 - ss(0.93, 1.0, u)));
        _m4.compose(p, _q, _s.setScalar(sc)); A.specks.setMatrixAt(i, _m4); }
      A.specks.instanceMatrix.needsUpdate = true; A.mat.opacity = 0.9 * a.on;
      const pp = cN.getPointAt(A.plugU), tg = cN.getTangentAt(A.plugU), bs = Math.max(0.0001, a.block);
      A.plug.position.copy(pp); A.plug.quaternion.setFromUnitVectors(Z, tg); A.plug.scale.set(0.0058 * bs, 0.0058 * bs, 0.0105 * bs); A.plug.material.opacity = 0.85 * a.block * a.on; } }
  // ---- before and after (the gag): the two frames stand up, one after the other
  W.frames.hinges.forEach((H, i) => { const k = s5(T.jawline - 0.55 + i * 0.22, T.jawline + 0.05 + i * 0.22, t); H.h.rotation.x = lerp(Math.PI / 2, -0.18, k); H.sp.rotation.x = 0.44 * s5(0.55, 1.0, k); });
  // ---- the roll: the logo
  { const lk = s5(T.back + 0.4, T.logo - 0.25, t); W.roll.logo.set({ weight: lk, white: lk, hours: 0, hand: ss(T.logo - 0.4, T.logo - 0.15, t), handScale: outBack(clamp01((t - (T.logo - 0.4)) / 0.35), 1.8) }); }
  // ---- light
  const fig = 1 - endDark;
  W.key.intensity = 16 * fig; W.rim.intensity = 3.0 * fig; W.fill.intensity = 0.8 * fig;
  W.faceLight.intensity = 3.0 * fig; W.tableLight.intensity = 3.5 * fig; W.boardLight.intensity = 3.0 * ss(4.8, 5.6, t) * (1 - ss(36.2, 37.2, t)) * fig;
  S.tableMat.color.setScalar(0.35 * (1 - endDark * 0.9)); scene.environmentIntensity = 0.1 * (1 - endDark); S.reflAmt = 0.5 * (1 - endDark);
}

// ------------------------------------------------------------------ the words on screen
const CAPS = [
  { t0: 0.35, t1: 3.1, top: 292, size: 84, html: 'People now tape their<br>mouths <em>shut</em> at night' },
  { t0: 3.29, t1: 4.7, top: 300, size: 100, html: 'On <em>purpose.</em>' },
  { t0: 5.1, t1: 11.1, top: 292, size: 76, html: 'In three yearly US polls,<br><em>5 to 12%</em> of adults<br>said they&rsquo;d tried it' },
  { t0: 11.52, t1: 16.2, top: 292, size: 78, html: 'The promise: better<br>sleep, less snoring,<br>even a <em>sharper jaw</em>' },
  { t0: 16.61, t1: 22.9, top: 292, size: 76, html: 'A 2025 review found<br><em>10 studies, 213 people</em><br>in total' },
  { t0: 23.36, t1: 26.6, top: 292, size: 78, html: 'Two showed the main<br><em>sleep apnoea score</em> improving' },
  { t0: 26.87, t1: 31.2, top: 292, size: 78, html: 'Both in <em>mild</em> cases.<br>Neither had a<br>comparison group.' },
  { t0: 31.63, t1: 36.4, top: 292, size: 76, html: 'The authors&rsquo; verdict:<br>the data don&rsquo;t support<br>it as a <em>treatment</em>' },
  { t0: 36.87, t1: 39.6, top: 292, size: 82, html: 'Your <em>nose</em> is the better<br>airway in sleep' },
  { t0: 39.9, t1: 44.9, top: 292, size: 68, html: 'But people breathe through<br>the mouth for a reason,<br>often a <em>blocked nose</em>' },
  { t0: 45.33, t1: 51.0, top: 292, size: 70, html: 'Tape your mouth over<br>a blocked nose, and<br>you&rsquo;ve shut your <em>only</em><br><em>other way to breathe</em>' },
  { t0: 51.4, t1: 52.6, top: 300, size: 100, html: '<em>Jawline?</em>' },
  { t0: 52.71, t1: 54.9, top: 300, size: 88, html: 'No scientific <em>evidence</em>' },
  { t0: 55.3, t1: 62.2, top: 292, size: 70, html: 'Snoring with pauses,<br>gasping in your sleep,<br>tired all day, or a nose<br>that&rsquo;s often <em>blocked?</em>' },
  { t0: 62.44, t1: 64.6, top: 300, size: 90, html: 'Don&rsquo;t tape.<br><em>See a doctor.</em>' },
  { t0: 65.16, t1: 99, top: 360, size: 96, html: 'Back to<br><em>factory settings.</em>' },
];
const OVL = {};
function overlayInit(S) {
  const O = S.O, tag = (cls, txt2, size, bsize) => { const e = O.tag(cls, txt2); e.style.fontSize = size + 'px'; const b = e.querySelector('b'); if (b && bsize) b.style.fontSize = bsize + 'px'; return e; };
  OVL.st1 = tag('tag', '2015 study<b>30 people</b>', 22, 36);
  OVL.st2 = tag('tag', '2022 study<b>20 people</b>', 22, 36);
  OVL.cmp1 = tag('tag', 'Comparison group<b>none</b>', 22, 36);
  OVL.cmp2 = tag('tag', 'Comparison group<b>none</b>', 22, 36);
  OVL.nose = tag('tag', 'Nose breathing in sleep<b>less airway resistance</b>', 22, 34);
  OVL.block = tag('tag', 'Nose<b>blocked</b>', 22, 38);
  OVL.taped = tag('tag', 'Mouth<b>taped</b>', 22, 38);
}
function overlay(S, t) {
  const c1 = W.board.cards[IMPROVED[0]].m.position, c2 = W.board.cards[IMPROVED[1]].m.position, dn = new THREE.Vector3(0, -0.056, 0);
  place(S, OVL.st1, c1.clone().add(dn), -110, 0, pulse(t, T.main, T.neither - 0.1));
  place(S, OVL.st2, c2.clone().add(dn), -110, 0, pulse(t, T.main + 0.2, T.neither - 0.1));
  place(S, OVL.cmp1, c1.clone().add(dn), -110, 0, pulse(t, T.neither, 31.4));
  place(S, OVL.cmp2, c2.clone().add(dn), -110, 0, pulse(t, T.neither + 0.2, 31.4));
  place(S, OVL.nose, W.nostril, -380, -190, pulse(t, T.nose, T.but));
  place(S, OVL.block, W.nasal, 40, -40, pulse(t, T.blocked, T.shut2 - 0.2));
  place(S, OVL.taped, W.lips, -180, -90, pulse(t, T.tape2 + 0.4, 51.0));
  const c = new THREE.Vector3(ROLL.x, ROLL.y + W.roll.top + 0.0006, ROLL.z);
  logoEnd(S, t, { t0: T.logo, center: c, edge: c.clone().add(new THREE.Vector3(0, 0, LOGO_R)) });
}

makeFilm({
  T, caps: CAPS, subs: [], build, update, pose: camPose, overlay, overlayInit, focus: focusAt,
  stage: { bg: 0x07080a, reflSize: 6, env: 0.1, far: 30 },
  aperture: [[0, 0.004], [5.6, 0.002], [12.2, 0.003], [17.4, 0.002], [37.4, 0.004], [51.9, 0.004], [56.4, 0.003], [65.9, 0.003]],
  bloom: [[0, 0.45], [65, 0.55]],
});

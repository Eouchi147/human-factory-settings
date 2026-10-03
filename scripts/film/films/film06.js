// Human Factory Settings · Film 6 "Are barefoot shoes good for your feet?" · one continuous shot, 9:16.
// A shoe box marked BAREFOOT SHOES opens: it is empty (shoes made to feel like no shoes). A skeleton in thin, flexible
// shoes stands on a walking pad; the shoes go clear: 26 bones, three arches, the small muscles that hold them. Eight
// weeks of walking (the pad's display counts the trial's weeks and steps), then heel raises, barefoot. 118 runners and
// their injuries. Toe shoes in ten weeks: an MRI ring runs along the foot, 10 of 19 light up. Three dials for the
// build-up. The lid slams on the empty box: see a doctor, not a shoe shop. The last dial becomes the logo.
import { THREE, ORANGE, ss, s5, lerp, clamp01, hash, camTrack, phys, glowMat, shadows, spot, RoundedBoxGeometry,
  loadAnatomy, tissueMat, V3, place, logoEnd, makeFilm, outBack, stamp, labelCanvas, stampLine, noiseTex } from '../kit.js';
import { buildRig, skeletonKind, walkAt, legIK, bendSpine, poseArm, ARM0, worldVerts, FOOT } from '../rig.js';
import { makeLogoRing } from '../props.js';
import { skinned } from '../soft.js';

// ------------------------------------------------------------------ timing, from the voice guide (word starts)
const T = {
  end: 72.3,
  q0: 0.35, designed: 2.01, feel: 2.91, noshoes: 3.51, dothey: 4.93, work: 5.63,           // "Barefoot shoes: shoes designed to feel like no shoes. Do they work?"
  each: 7.24, twentysix: 8.39, bones: 8.83, three: 9.50, arches: 9.75,                    // "Each foot has twenty-six bones and three arches."
  small: 10.94, muscles: 11.64, hold: 13.28, up: 13.78,                                   // "Small muscles inside the foot help hold them up."
  like: 14.87, stronger: 16.42, work2: 17.47,                                             // "Like any muscle, they get stronger when they work."
  trial: 19.41, eight: 19.75, walking: 20.47, flat: 21.24, made: 22.95, fortyone: 24.27, stronger2: 25.70,   // "In one trial, eight weeks of walking in flat, flexible shoes made foot muscles forty-one percent stronger."
  exercises: 27.76, more: 29.21, fiftyeight: 29.46, nonew: 31.61, required: 32.74,       // "Foot exercises did even more: fifty-eight percent. No new shoes required."
  another: 34.75, runners: 35.00, training: 37.05, fewer: 37.67, injuries: 38.61, year: 40.45,   // "In another, runners given eight weeks of foot training got fewer running injuries over the next year."
  but: 41.54, overnight: 42.69, toe: 45.01, tenweeks: 45.88, ten: 46.48, nineteen: 47.43, bone: 48.37, mri: 49.43,   // "But don't switch overnight. When runners moved to toe shoes over ten weeks, ten of nineteen showed bone stress on MRI."
  ten2: 51.08, still: 52.02, fast: 52.59,                                                 // "Ten weeks. Still too fast."
  worked: 54.80, slowly: 55.58, two: 56.05, five: 58.87, seven: 60.65,                    // "The trial that worked built up slowly: two and a half thousand steps a day, then five thousand, then seven."
  feet: 61.97, numb: 64.04, see: 64.80, doctor: 65.52, shop: 66.20,                       // "Feet painful, stiff, weak or numb? See a doctor, not a shoe shop."
  final: 68.19, settings: 69.35, logo: 70.05,                                             // "Back to factory settings."
};

// ------------------------------------------------------------------ the set (metres; the skeleton faces +z; +x is its left)
const W = {}; window.HFS_W = W;
const FLOOR = 0.4;
const PAD = { w: 0.56, z0: -0.78, z1: 0.66, h: 0.105, bw: 0.46 };   // a walking pad: deck top at h, belt bw wide
const SOLE = 0.006;                                                   // the shoes' sole: 6 mm
const HZ = -0.2;                                                      // where the heels stand on the belt
const BOX = new THREE.Vector3(0.79, 0, 1.08), BOX_RY = 0.32;          // the shoe box, on the floor in front of the pad
const BF = new THREE.Vector3(Math.sin(BOX_RY), 0, Math.cos(BOX_RY));  // the box's front
const DIALS = [-0.38, 0, 0.38].map((x) => new THREE.Vector3(x, 0, 1.16));
const LOGO_R = 0.072;
const SIDES = ['Right', 'Left'];

// ------------------------------------------------------------------ small helpers
function canvasTex(w, h, draw, { srgb = true } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h, c);
  const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.userData.canvas = c; return t;
}
function txt(x, s, px, py, { font = '800 100px Archivo', color = '#fff', align = 'center', track = 0, base = 'middle', maxW = 0 } = {}) {
  x.font = font; x.letterSpacing = `${track}px`; x.fillStyle = color; x.textAlign = align; x.textBaseline = base;
  if (maxW) { const w = x.measureText(s).width; if (w > maxW) { x.save(); x.translate(px, py); x.scale(maxW / w, 1); x.fillText(s, 0, 0); x.restore(); return; } }
  x.fillText(s, px, py);
}
const avgV = (a) => a.reduce((s, v) => s.add(v), new THREE.Vector3()).multiplyScalar(1 / Math.max(1, a.length));
const sgnpow = (v, e) => Math.sign(v) * Math.pow(Math.abs(v), e);
const add = (v, x, y, z) => v.clone().add(new THREE.Vector3(x, y, z));

// a shell lofted around a set of points, slice by slice along z: each slice's width and height come from the points
// in it, the slices are smoothed, and the two ends are closed with rounded caps. Regular rings, so it bends cleanly.
function loft(pts, { n = 40, seg = 36, ex = 2.6, z0, z1, smooth = 2, dil = 1, flat = -Infinity, ring, cap = [0.82, 0.5, 0], capD = [0.0035, 0.0065, 0.0085] }) {
  const za = z0 ?? Math.min(...pts.map((p) => p.z)), zb = z1 ?? Math.max(...pts.map((p) => p.z)), step = (zb - za) / (n - 1);
  const sec = [];
  for (let i = 0; i < n; i++) {
    const z = za + i * step; let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity, c = 0;
    for (const p of pts) if (Math.abs(p.z - z) <= step * 0.75 + 0.002) { c++; if (p.x < x0) x0 = p.x; if (p.x > x1) x1 = p.x; if (p.y < y0) y0 = p.y; if (p.y > y1) y1 = p.y; }
    sec.push(c ? { z, x0, x1, y0, y1 } : null);
  }
  for (let i = 0; i < n; i++) if (!sec[i]) {
    let a = i - 1; while (a >= 0 && !sec[a]) a--; let b = i + 1; while (b < n && !sec[b]) b++;
    const A = a >= 0 ? sec[a] : sec[b], B = b < n ? sec[b] : sec[a], k = a >= 0 && b < n ? (i - a) / (b - a) : 0;
    sec[i] = { z: za + i * step, x0: lerp(A.x0, B.x0, k), x1: lerp(A.x1, B.x1, k), y0: lerp(A.y0, B.y0, k), y1: lerp(A.y1, B.y1, k) };
  }
  const dl = sec.map((s, i) => { const o = { ...s }; for (let k = -dil; k <= dil; k++) { const q = sec[Math.min(n - 1, Math.max(0, i + k))]; o.x0 = Math.min(o.x0, q.x0); o.x1 = Math.max(o.x1, q.x1); o.y1 = Math.max(o.y1, q.y1); } return o; });
  const sm = dl.map((s, i) => { const o = { z: s.z, x0: 0, x1: 0, y0: 0, y1: 0 }; let c = 0;
    for (let k = -smooth; k <= smooth; k++) { const q = dl[Math.min(n - 1, Math.max(0, i + k))]; o.x0 += q.x0; o.x1 += q.x1; o.y0 += q.y0; o.y1 += q.y1; c++; }
    o.x0 /= c; o.x1 /= c; o.y0 /= c; o.y1 /= c; return o; });
  const R = sm.map((s) => ({ z: s.z, ...ring(s) })), F = R[0], L = R[R.length - 1];
  const capRing = (r, f, dz) => ({ z: r.z + dz, cx: r.cx, hw: r.hw * f, hh: r.hh * Math.pow(f, 0.6), cy: flat > -1 ? flat + (r.cy - flat) * (0.55 + 0.45 * f) : r.cy });
  const all = [...cap.map((f, k) => capRing(F, f, -capD[k])).reverse(), ...R, ...cap.map((f, k) => capRing(L, f, capD[k]))];
  const pos = new Float32Array(all.length * seg * 3), uv = new Float32Array(all.length * seg * 2); let o = 0, u = 0;
  all.forEach((r, i) => { for (let j = 0; j < seg; j++) { const a = (2 * Math.PI * j) / seg;
    pos[o++] = r.cx + r.hw * sgnpow(Math.cos(a), 2 / ex); pos[o++] = Math.max(flat, r.cy + r.hh * sgnpow(Math.sin(a), 2 / ex)); pos[o++] = r.z;
    uv[u++] = j / seg; uv[u++] = i / (all.length - 1); } });
  const idx = [];
  for (let i = 0; i < all.length - 1; i++) for (let j = 0; j < seg; j++) { const a = i * seg + j, b = i * seg + ((j + 1) % seg), c = (i + 1) * seg + ((j + 1) % seg), d = (i + 1) * seg + j; idx.push(a, b, c, a, c, d); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  return g;
}

// ------------------------------------------------------------------ the shoe box: kraft card, a lid, tissue paper, nothing else
function makeBox() {
  const g = new THREE.Group(), L = 0.34, Wd = 0.22, H = 0.12, t = 0.004;
  const kraftTex = noiseTex(61, 256, 0.86, 1.0, 3);
  const kraft = phys({ color: 0xb48a58, roughness: 0.86, roughnessMap: kraftTex, bumpMap: kraftTex, bumpScale: 0.4 });
  const inside = phys({ color: 0x9b7448, roughness: 0.9 });
  const wall = (w, h, d, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), [kraft, kraft, kraft, inside, kraft, kraft]); m.position.set(x, y, z); g.add(m); return m; };
  wall(L, t, Wd, 0, t / 2, 0);                                        // the floor of the box
  wall(L, H, t, 0, H / 2, Wd / 2 - t / 2); wall(L, H, t, 0, H / 2, -Wd / 2 + t / 2);
  wall(t, H, Wd, L / 2 - t / 2, H / 2, 0); wall(t, H, Wd, -L / 2 + t / 2, H / 2, 0);
  // tissue paper: two crumpled sheets, white, lying on the floor of the box
  const tissue = phys({ color: 0xe6e1d8, roughness: 0.82, sheen: 0.4, sheenColor: new THREE.Color(0xffffff), side: THREE.DoubleSide });
  for (const s of [-1, 1]) {
    const geo = new THREE.PlaneGeometry(L * 0.96, Wd * 0.6, 32, 18), P = geo.attributes.position;
    for (let i = 0; i < P.count; i++) { const x = P.getX(i), y = P.getY(i); P.setZ(i, 0.006 * Math.sin(x * 61 + y * 37 + s) + 0.004 * Math.sin(x * 113 - y * 71) + 0.09 * Math.max(0, Math.abs(y) - Wd * 0.2)); }
    geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, tissue); m.rotation.x = -Math.PI / 2 + s * 0.04; m.position.set(0, t + 0.016, s * Wd * 0.17); g.add(m);
  }
  // the lid: printed on top
  const top = canvasTex(1360, 880, (x, w, h) => {
    x.fillStyle = '#b48a58'; x.fillRect(0, 0, w, h);
    x.globalAlpha = 0.08; for (let k = 0; k < 900; k++) { x.fillStyle = k % 2 ? '#000' : '#fff'; x.fillRect(hash(k) * w, hash(k + 3.3) * h, 2, 2); } x.globalAlpha = 1;
    txt(x, 'BAREFOOT', w / 2, h * 0.42, { font: '900 210px Archivo', color: '#161412', track: 18, maxW: w * 0.84 });
    txt(x, 'SHOES', w / 2, h * 0.64, { font: '700 86px Archivo', color: '#161412', track: 42 });
    x.strokeStyle = '#161412'; x.lineWidth = 6; x.strokeRect(60, 60, w - 120, h - 120);
    txt(x, 'EU 44 · 1 PAIR', w / 2, h * 0.84, { font: '500 40px "Geist Mono"', color: '#2a2622', track: 8 });
  });
  const lidTop = phys({ map: top, roughness: 0.84, bumpMap: kraftTex, bumpScale: 0.3 });
  const lid = new THREE.Group(), lt = 0.004, LH = 0.035;
  const lm = (w, h, d, x, y, z, mats) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mats || kraft); m.position.set(x, y, z); lid.add(m); };
  lm(L + 0.01, lt, Wd + 0.01, 0, LH - lt / 2, 0, [kraft, kraft, lidTop, inside, kraft, kraft]);
  lm(L + 0.01, LH, lt, 0, LH / 2, (Wd + 0.01) / 2); lm(L + 0.01, LH, lt, 0, LH / 2, -(Wd + 0.01) / 2);
  lm(lt, LH, Wd + 0.01, (L + 0.01) / 2, LH / 2, 0); lm(lt, LH, Wd + 0.01, -(L + 0.01) / 2, LH / 2, 0);
  g.add(lid);
  shadows(g); g.traverse((o) => o.layers.enable(1));
  // closed: on the box. Open: standing on its edge behind the box, print to the front
  return { g, lid, H, LH, L, Wd, closed: new THREE.Vector3(0, H - LH + 0.003, 0), open: new THREE.Vector3(0, 0.113, -0.195), tilt: 1.27 };
}
function setLid(B, a) {   // a: 0 closed, 1 standing behind the box
  const e = s5(0.22, 1, a), p = B.closed.clone().lerp(B.open, e); p.y += 0.12 * Math.sin(Math.PI * clamp01(a * 1.05));
  B.lid.position.copy(p); B.lid.rotation.set(B.tilt * s5(0.12, 0.92, a), 0, 0);
}

// ------------------------------------------------------------------ the walking pad: a flat treadmill, a belt that runs, a small display
function makePad() {
  const g = new THREE.Group();
  const shell = phys({ color: 0x1b1d21, roughness: 0.45, metalness: 0.2, clearcoat: 0.4 });
  const len = PAD.z1 - PAD.z0, cz = (PAD.z0 + PAD.z1) / 2;
  const deck = new THREE.Mesh(new RoundedBoxGeometry(PAD.w, PAD.h, len, 4, 0.02), shell); deck.position.set(0, PAD.h / 2, cz); g.add(deck);
  const beltTex = canvasTex(256, 1024, (x, w, h) => { x.fillStyle = '#26282d'; x.fillRect(0, 0, w, h); for (let k = 0; k < 64; k++) { x.fillStyle = k % 2 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.12)'; x.fillRect(0, k * 16, w, 8); } x.globalAlpha = 0.25; for (let k = 0; k < 2400; k++) { x.fillStyle = hash(k) > 0.5 ? '#000' : '#4a4d55'; x.fillRect(hash(k * 1.3) * w, hash(k * 2.7) * h, 2, 2); } }, { srgb: true });
  beltTex.wrapS = beltTex.wrapT = THREE.RepeatWrapping; beltTex.repeat.set(1, 2.2);
  const belt = new THREE.Mesh(new THREE.PlaneGeometry(PAD.bw, len - 0.12), phys({ map: beltTex, roughness: 0.92, color: 0xffffff }));
  belt.rotation.x = -Math.PI / 2; belt.position.set(0, PAD.h + 0.0008, cz - 0.03); g.add(belt);
  // the motor housing at the front, with its display
  const hood = new THREE.Mesh(new RoundedBoxGeometry(PAD.w, PAD.h + 0.03, 0.14, 4, 0.02), shell); hood.position.set(0, (PAD.h + 0.03) / 2, PAD.z1 - 0.07); g.add(hood);
  const c = document.createElement('canvas'); c.width = 640; c.height = 200;
  const dtex = new THREE.CanvasTexture(c); dtex.colorSpace = THREE.SRGBColorSpace; dtex.anisotropy = 8;
  const disp = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.0625), new THREE.MeshBasicMaterial({ map: dtex, toneMapped: false }));
  disp.rotation.x = -Math.PI / 2 + 0.25; disp.position.set(0, PAD.h + 0.0395, PAD.z1 - 0.07); g.add(disp);
  shadows(g); disp.castShadow = false; belt.castShadow = false; g.traverse((o) => o.layers.enable(1));
  return { g, beltTex, c, dtex, disp, key: '' };
}
function drawPad(P, l1, l2, glow) {
  const key = l1 + '|' + l2 + '|' + glow.toFixed(2); if (key === P.key) return; P.key = key;
  const x = P.c.getContext('2d'), w = P.c.width, h = P.c.height;
  x.fillStyle = '#060708'; x.fillRect(0, 0, w, h);
  if (glow > 0.001) {
    x.globalAlpha = glow; x.shadowColor = '#5fd3ff'; x.shadowBlur = 16;
    txt(x, l1, 40, 62, { font: '600 76px "Geist Mono"', color: '#a6eaff', align: 'left', track: 6 });
    txt(x, l2, w - 40, 148, { font: '600 64px "Geist Mono"', color: '#a6eaff', align: 'right', track: 4 });
    x.shadowBlur = 0; x.globalAlpha = 1;
  }
  P.dtex.needsUpdate = true;
}

// ------------------------------------------------------------------ dials (as in films 4 and 5)
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
    out.push({ g, knob, set, setMat, face, ind, angle: (v) => -Math.PI * 0.75 + v * Math.PI * 1.5 });
  }
  return out;
}

// ------------------------------------------------------------------ the toes: one joint per foot at the ball, so the toes can stay flat when the heel lifts
function rigToes(R, Side) {
  const G = R.legs[Side], side = Side.toLowerCase(), ankle = G.ankle, ph = [];
  ankle.traverse((o) => { if (o.isMesh && /phalanx of (right|left) (big|second|third|fourth|little) toe/i.test(o.userData.name || '') && new RegExp(`\\b${side}\\b`, 'i').test(o.userData.name)) ph.push(o); });
  const mt = ['first', 'fifth'].map((k) => R.byName.get(`${Side} ${k} metatarsal bone`));
  const front = (m) => worldVerts(m).reduce((a, v) => (v.z > a.z ? v : a));
  const pivot = front(mt[0]).clone().add(front(mt[1])).multiplyScalar(0.5); pivot.z -= 0.014; pivot.y = G.ground + 0.016;
  const toes = new THREE.Group(); toes.position.copy(pivot).sub(G.A); ankle.add(toes); R.pivots.set(toes, pivot.clone());
  for (const m of ph) { m.parent.remove(m); m.position.copy(m.userData.home).sub(pivot); toes.add(m); }
  return { toes, pivot, n: ph.length, ph };
}

// ------------------------------------------------------------------ the shoes, lofted around each foot's own bones (world rest frame), skinned to foot and toes
function footPts(R, Side, { phalanges = true, legLow = true } = {}) {
  const G = R.legs[Side], out = [];
  G.ankle.traverse((o) => { if (o.isMesh && FOOT.test(o.userData.name || '') && !/sesamoid/i.test(o.userData.name) && (phalanges || !/phalanx/i.test(o.userData.name))) out.push(...worldVerts(o, 2)); });
  if (legLow) for (const n of [`${Side} tibia`, `${Side} fibula`]) { const m = R.byName.get(n); if (m) out.push(...worldVerts(m, 3).filter((p) => p.y < G.ground + 0.075)); }
  return out;
}
function makeShoe(R, Side, mats) {
  const G = R.legs[Side], Tz = W.toes[Side].pivot.z, gr = G.ground;
  const pts = footPts(R, Side), bones = footPts(R, Side, { legLow: false });
  const z0 = Math.min(...bones.map((p) => p.z)) - 0.002, z1 = Math.max(...bones.map((p) => p.z)) + 0.003;
  const upperG = loft(pts.filter((p) => p.z >= z0 - 0.01), { n: 44, seg: 40, ex: 2.4, z0, z1, flat: gr, smooth: 2,
    ring: (s) => { const y = s.y1 + 0.0065, top = lerp(Math.min(gr + 0.064, y), y, ss(G.A.z - 0.004, G.A.z + 0.03, s.z)), hh = (top - gr) * 0.72; return { cx: (s.x0 + s.x1) / 2, hw: (s.x1 - s.x0) / 2 + 0.0055, cy: top - hh, hh }; } });
  const low = bones.filter((p) => p.y < gr + 0.022);
  const soleG = loft(low, { n: 44, seg: 28, ex: 7, z0: z0 - 0.003, z1: z1 + 0.003, smooth: 3, cap: [0.9, 0.6, 0], capD: [0.002, 0.004, 0.005],
    ring: (s) => ({ cx: (s.x0 + s.x1) / 2, hw: (s.x1 - s.x0) / 2 + 0.006, cy: gr - SOLE / 2 + 0.0004, hh: SOLE / 2 }) });
  const bind = (p) => [G.ankle, W.toes[Side].toes, ss(Tz - 0.012, Tz + 0.012, p.z)];
  const upper = skinned(upperG, bind, R, mats.upper), sole = skinned(soleG, bind, R, mats.sole);
  for (const sk of [upper, sole]) { sk.mesh.castShadow = true; sk.mesh.receiveShadow = true; sk.mesh.layers.enable(1); sk.mesh.visible = false; }
  upper.mesh.renderOrder = 3; return { upper, sole, parts: [upper, sole] };
}
function makeToeShoe(R, Side, mats) {
  const G = R.legs[Side], gr = G.ground, TW = W.toes[Side];
  const body = footPts(R, Side, { phalanges: false });
  const bones = footPts(R, Side, { phalanges: false, legLow: false });
  const z0 = Math.min(...bones.map((p) => p.z)) - 0.002, z1 = Math.max(...bones.map((p) => p.z)) + 0.002;
  const bodyG = loft(body.filter((p) => p.z >= z0 - 0.01), { n: 36, seg: 40, ex: 2.4, z0, z1, flat: gr, smooth: 2,
    ring: (s) => { const y = s.y1 + 0.006, top = lerp(Math.min(gr + 0.062, y), y, ss(G.A.z - 0.004, G.A.z + 0.03, s.z)), hh = (top - gr) * 0.72; return { cx: (s.x0 + s.x1) / 2, hw: (s.x1 - s.x0) / 2 + 0.005, cy: top - hh, hh }; } });
  const parts = [skinned(bodyG, () => [G.ankle, G.ankle, 0], R, mats.upper)];
  for (const k of ['big', 'second', 'third', 'fourth', 'little']) {
    const ph = TW.ph.filter((m) => new RegExp(`\\b${k} toe`, 'i').test(m.userData.name)), P = ph.flatMap((m) => worldVerts(m, 1));
    if (!P.length) continue;
    const a = Math.min(...P.map((p) => p.z)), b = Math.max(...P.map((p) => p.z));
    const g = loft(P, { n: 14, seg: 22, ex: 2.1, z0: a - 0.006, z1: b + 0.001, flat: gr, smooth: 1, cap: [0.85, 0.55, 0], capD: [0.002, 0.004, 0.005],
      ring: (s) => { const top = s.y1 + 0.0042, hh = (top - gr) * 0.7; return { cx: (s.x0 + s.x1) / 2, hw: Math.max(0.0055, (s.x1 - s.x0) / 2 + 0.0038), cy: top - hh, hh }; } });
    parts.push(skinned(g, () => [TW.toes, TW.toes, 0], R, mats.upper));
  }
  const allB = footPts(R, Side, { legLow: false }), low = allB.filter((p) => p.y < gr + 0.022);
  const za = Math.min(...allB.map((p) => p.z)) - 0.004, zb = Math.max(...allB.map((p) => p.z)) + 0.004;
  parts.push(skinned(loft(low, { n: 44, seg: 28, ex: 7, z0: za, z1: zb, smooth: 3, cap: [0.9, 0.6, 0], capD: [0.002, 0.004, 0.005],
    ring: (s) => ({ cx: (s.x0 + s.x1) / 2, hw: (s.x1 - s.x0) / 2 + 0.005, cy: gr - SOLE / 2 + 0.0004, hh: SOLE / 2 }) }), () => [G.ankle, G.ankle, 0], R, mats.sole));
  for (const sk of parts) { sk.mesh.castShadow = true; sk.mesh.receiveShadow = true; sk.mesh.layers.enable(1); sk.mesh.visible = false; sk.mesh.renderOrder = 3; }
  return { parts };
}

// ------------------------------------------------------------------ the arches of the right foot: three arcs of light under the bones
function archCurves(R, Side) {
  const by = (n) => R.byName.get(n), G = R.legs[Side], s = Side.toLowerCase(), gr = G.ground;
  const vs = (n) => worldVerts(by(n));
  const lowFront = (n) => { const v = vs(n); const zmax = Math.max(...v.map((p) => p.z)); const f = v.filter((p) => p.z > zmax - 0.012); return avgV(f.map((p) => p.clone())).setY(Math.min(...f.map((p) => p.y))); };
  const lowBack = (n) => { const v = vs(n); const zmin = Math.min(...v.map((p) => p.z)); const f = v.filter((p) => p.z < zmin + 0.012); return avgV(f.map((p) => p.clone())).setY(Math.min(...f.map((p) => p.y))); };
  const bottomY = (n) => Math.min(...vs(n).map((p) => p.y));
  const med = Side === 'Right' ? 1 : -1;   // the medial side of the right foot is +x
  const heel = G.heel.clone(); heel.y = gr + 0.002; heel.z += 0.018;
  const mt1 = lowFront(`${Side} first metatarsal bone`), mt5 = lowFront(`${Side} fifth metatarsal bone`);
  const navY = bottomY(`Navicular bone of ${s} foot`), cubY = bottomY(`${Side} cuboid bone`);
  const arc = (a, b, apexY, xa, xb) => { const c = (apexY - (a.y + b.y) / 2) / 0.75;
    return new THREE.CubicBezierCurve3(a, new THREE.Vector3(xa, a.y + c, lerp(a.z, b.z, 0.3)), new THREE.Vector3(xb, b.y + c, lerp(a.z, b.z, 0.68)), b); };
  const m0 = add(heel, 0.012 * med, 0, 0), m1 = add(mt1, 0.004 * med, 0.001, 0);
  const l0 = add(heel, -0.014 * med, 0, 0), l1 = add(mt5, -0.003 * med, 0.001, 0);
  const b1 = lowBack(`${Side} first metatarsal bone`), b5 = lowBack(`${Side} fifth metatarsal bone`), b2 = lowBack(`${Side} second metatarsal bone`);
  const t0 = add(b1, 0.004 * med, -0.002, 0.004), t1 = add(b5, -0.004 * med, -0.002, 0.004);
  const across = new THREE.CubicBezierCurve3(t0, new THREE.Vector3(lerp(t0.x, t1.x, 0.3), b2.y + 0.002, lerp(t0.z, t1.z, 0.3) + 0.003), new THREE.Vector3(lerp(t0.x, t1.x, 0.7), b2.y + 0.0, lerp(t0.z, t1.z, 0.7) + 0.003), t1);
  return {
    medial: arc(m0, m1, navY - 0.002, lerp(m0.x, m1.x, 0.3) + 0.004 * med, lerp(m0.x, m1.x, 0.7) + 0.004 * med),
    lateral: arc(l0, l1, cubY - 0.001, lerp(l0.x, l1.x, 0.3) - 0.004 * med, lerp(l0.x, l1.x, 0.7) - 0.004 * med),
    across,
  };
}
function lineMesh(curve, A, r) {
  const pts = curve.getPoints(80).map((p) => p.sub(A));
  const mat = new THREE.ShaderMaterial({
    uniforms: { uDraw: { value: 0 }, uC: { value: new THREE.Color(0xeceef1).multiplyScalar(1.6) }, uO: { value: 1 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'uniform float uDraw, uO; uniform vec3 uC; varying vec2 vUv; void main(){ if (vUv.x > uDraw) discard; float e = smoothstep(0.0, 0.04, vUv.x) * smoothstep(0.0, 0.04, uDraw - vUv.x + 0.02); gl_FragColor = vec4(uC, uO * (0.35 + 0.65 * e)); }',
    transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending,
  });
  const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 96, r, 8, false), mat); m.renderOrder = 8; m.userData.mid = pts[40].clone(); return m;
}

// ------------------------------------------------------------------ the body: standing on the belt, walking on it, heel raises
const STRIDE = 1.08;
const WALK0 = 18.62, WALK1 = 26.35;
function walkS(t) {   // distance walked on the belt (the belt runs under the feet)
  const ramp = 0.9, v = 1.12, T0 = WALK0, T1 = WALK1, D = v * (T1 - T0 - ramp);
  if (t <= T0) return 0; if (t >= T1) return D;
  const u = t - T0, TT = T1 - T0;
  if (u < ramp) return (v * u * u) / (2 * ramp);
  if (u > TT - ramp) { const r = TT - u; return D - (v * r * r) / (2 * ramp); }
  return v * (u - ramp / 2);
}
const soleOn = (t) => 1 - ss(26.9, 27.5, t);                                          // the shoes go at "foot exercises"
const toeOn = (t) => ss(T.toe - 0.15, T.toe + 0.3, t) * (1 - ss(52.4, 53.0, t));      // the toe shoes, for the ten weeks
const groundAt = (t) => PAD.h + SOLE * Math.max(soleOn(t), toeOn(t));
const REPS = [27.7, 29.45, 31.2];
function riseAt(t) {   // heel raises, barefoot: up, a hold, down
  for (const r0 of REPS) { const u = t - r0; if (u < 0 || u > 1.6) continue; if (u < 0.55) return s5(0, 0.55, u); if (u < 0.85) return 1; return 1 - s5(0.85, 1.6, u); }
  return 0;
}
function standPose(t, rise) {
  const R = W.rig, out = { feet: {} }, g = groundAt(t), ang = 0.42 * rise;
  out.pelvis = new THREE.Vector3(R.P0.x, R.P0.y - 0.004 + g - W.groundRest, HZ + (R.P0.z - R.legs.Right.heel.z));
  out.pelvisRot = new THREE.Euler(0, 0, 0);
  for (const Side of SIDES) {
    const G = R.legs[Side], q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), ang);
    const ballW = new THREE.Vector3(G.ball.x, g, HZ + (G.ball.z - G.heel.z));
    const restBall = G.ball.clone(); restBall.y = G.ground;
    const ankle = G.A.clone().sub(restBall).applyQuaternion(q).add(ballW);
    out.feet[Side] = { ankle, q, toe: -ang };
    out.pelvis.y += 0.5 * (ankle.y - (G.A.y - G.ground + g));
  }
  out.armR = ARM0; out.armL = ARM0; out.twist = 0;
  return out;
}
function bodyAt(t) {
  const R = W.rig, s = walkS(t), g = groundAt(t);
  const st = standPose(t, riseAt(t));
  if (t <= WALK0 - 0.05 || t >= WALK1 + 0.8) return st;
  const w = walkAt(R, s + 0.25 * STRIDE, { stride: STRIDE, ground: () => g, slope: () => 0, z0: 0 });
  const shift = -(s + 0.25 * STRIDE) + (HZ - R.legs.Right.heel.z + 0.05);   // keep the walker in place on the belt, 5 cm ahead of where he stands
  w.pelvis.z += shift; for (const Side of SIDES) w.feet[Side].ankle.z += shift;
  const k = 1 - ss(WALK0 - 0.05, WALK0 + 0.7, t) * (1 - ss(WALK1 - 0.75, WALK1 + 0.05, t));   // 1 = standing
  if (k > 0) {
    w.pelvis.lerp(st.pelvis, k); w.pelvisRot.set(lerp(w.pelvisRot.x, 0, k), lerp(w.pelvisRot.y, 0, k), lerp(w.pelvisRot.z, 0, k));
    for (const Side of SIDES) { const a = w.feet[Side], b = st.feet[Side], lift = a.stance ? 0 : 0.03 * Math.sin(Math.PI * k); a.ankle.lerp(b.ankle, k); a.ankle.y += lift; a.q.slerp(b.q, k); }
    const mix = (x, y) => ({ dir: x.dir.map((v, i) => lerp(v, y.dir[i], k)), twist: lerp(x.twist || 0, 0, k), elbow: lerp(x.elbow, y.elbow, k), retract: 0, elevate: 0 });
    w.armR = mix(w.armR, ARM0); w.armL = mix(w.armL, ARM0); w.twist *= 1 - k;
  }
  for (const Side of SIDES) { const q = w.feet[Side].q; if (q.w < 0) { q.x = -q.x; q.y = -q.y; q.z = -q.z; q.w = -q.w; } w.feet[Side].toe = -Math.max(0, 2 * Math.atan2(q.x, q.w)); }   // toes stay flat as the heel lifts
  return w;
}
function applyBody(t) {
  const R = W.rig, b = bodyAt(t);
  R.pelvis.position.copy(b.pelvis); R.pelvis.rotation.copy(b.pelvisRot);
  bendSpine(R.seg, { tho: 0.04, cer: 0.02, twist: b.twist || 0 });
  poseArm(R.arms.Right, b.armR); poseArm(R.arms.Left, b.armL);
  for (const Side of SIDES) { legIK(R, Side, b.feet[Side].ankle, b.feet[Side].q); W.toes[Side].toes.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), b.feet[Side].toe || 0); }
  R.root.updateMatrixWorld(true);
  return b;
}

// ------------------------------------------------------------------ build
async function build(S, cfg) {
  const scene = S.scene;
  S.fog.near = 4; S.fog.far = 14;
  S.table.scale.set(3, 3, 1); S.tableMat.clearcoat = 0.06; S.tableMat.specularIntensity = 0.3;
  for (const m of [S.tableMat.map, S.tableMat.roughnessMap]) if (m) { m.wrapS = m.wrapT = THREE.RepeatWrapping; m.repeat.multiplyScalar(3); }
  // ---- the skeleton
  const meshes = await loadAnatomy(skeletonKind());
  W.rig = buildRig(meshes); scene.add(W.rig.root);
  for (const m of meshes) { m.castShadow = true; m.receiveShadow = true; m.layers.enable(1); }
  const R = W.rig;
  W.groundRest = Math.min(R.legs.Right.ground, R.legs.Left.ground);
  W.toes = { Right: rigToes(R, 'Right'), Left: rigToes(R, 'Left') };
  // the right foot's 26 bones, in the order they light up (heel to toes)
  const order = ['calcaneus', 'talus', 'navicular', 'cuboid', 'medial cuneiform', 'intermediate cuneiform', 'lateral cuneiform', 'first metatarsal', 'second metatarsal', 'third metatarsal', 'fourth metatarsal', 'fifth metatarsal'];
  const rf = meshes.filter((m) => /\bright\b/i.test(m.userData.name) && FOOT.test(m.userData.name) && !/sesamoid/i.test(m.userData.name));
  const rank = (n) => { n = n.toLowerCase(); const i = order.findIndex((k) => n.includes(k)); if (i >= 0) return i; const toe = ['big', 'second', 'third', 'fourth', 'little'].findIndex((k) => n.includes(k + ' toe')); const seg = n.startsWith('proximal') ? 0 : n.startsWith('middle') ? 1 : 2; return 12 + seg * 5 + toe; };
  W.rightFoot = rf.sort((a, b) => rank(a.userData.name) - rank(b.userData.name));
  for (const m of W.rightFoot) m.material.emissive.set(0xfff1dc);
  // ---- the factory stamp: along the top of the right first metatarsal
  { const mt = R.byName.get('Right first metatarsal bone');
    W.stampSpot = stampLine(mt, { a: [0.0, 0.2, -0.024], b: [0.0, 0.2, 0.02], dir: [0, -1, 0], top: [1, 0, 0] });
    if (W.stampSpot) W.stamp = stamp(mt, { canvas: labelCanvas('HUMAN FACTORY SETTINGS'), center: W.stampSpot.center, normal: W.stampSpot.normal, up: W.stampSpot.up, width: 0.046, depth: 0.02, opacity: 0.62 }); }
  // ---- the small muscles of the feet: they ride the foot, and the toe muscles bend with the toes
  const FM = /(abductor hallucis|flexor digitorum brevis|abductor digiti minimi of|flexor digiti minimi brevis of|opponens digiti minimi of|flexor hallucis brevis|adductor hallucis|lumbrical of|plantar interosseous of|extensor hallucis brevis)/i;
  const fm = await loadAnatomy((p) => (FM.test(p.name) && /\bfoot\b|hallucis/i.test(p.name) && /\b(right|left)\b/i.test(p.name) && !/longus/i.test(p.name) ? 'muscle' : null));
  W.footMat = tissueMat('muscle', { transparent: true, opacity: 0 }); W.footMat.emissive.set(0xff2c18); W.footSkins = [];
  for (const m of fm) {
    const Side = /\bright\b/i.test(m.userData.name) ? 'Right' : 'Left', G = R.legs[Side], Tz = W.toes[Side].pivot.z;
    const bind = (p) => [G.ankle, W.toes[Side].toes, ss(Tz - 0.012, Tz + 0.012, p.z)];
    const g = new THREE.BufferGeometry(), h = m.userData.home, P = m.geometry.attributes.position, N = m.geometry.attributes.normal, pp = new Float32Array(P.count * 3), nn = new Float32Array(P.count * 3);
    for (let i = 0; i < P.count; i++) { pp[i * 3] = P.getX(i) + h.x; pp[i * 3 + 1] = P.getY(i) + h.y; pp[i * 3 + 2] = P.getZ(i) + h.z; nn[i * 3] = N.getX(i); nn[i * 3 + 1] = N.getY(i); nn[i * 3 + 2] = N.getZ(i); }
    g.setAttribute('position', new THREE.BufferAttribute(pp, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nn, 3)); g.setIndex(m.geometry.index.clone());
    const sk = skinned(g, bind, R, W.footMat); sk.mesh.castShadow = true; sk.mesh.receiveShadow = true; sk.mesh.visible = false; sk.mesh.renderOrder = 2; scene.add(sk.mesh); W.footSkins.push(sk);
  }
  // ---- the shoes: a 6 mm sole and a knit upper you can see through when it matters; then toe shoes
  { const fab = noiseTex(71, 256, 0.72, 1.0, 14); fab.repeat.set(5, 9);
    W.upperMat = phys({ color: 0x323946, roughness: 0.82, roughnessMap: fab, bumpMap: fab, bumpScale: 0.6, sheen: 0.6, sheenColor: new THREE.Color(0x9aa6b8), sheenRoughness: 0.5, transparent: false, opacity: 1 });
    W.soleMat = phys({ color: 0xbdb5a8, roughness: 0.7, clearcoat: 0.2, transparent: false, opacity: 1 });
    W.shoes = {}; for (const Side of SIDES) W.shoes[Side] = makeShoe(R, Side, { upper: W.upperMat, sole: W.soleMat });
    W.toeMat = phys({ color: 0x4d545e, roughness: 0.78, roughnessMap: fab, bumpMap: fab, bumpScale: 0.5, sheen: 0.5, sheenColor: new THREE.Color(0x7d8899), sheenRoughness: 0.5, transparent: true, opacity: 0 });
    W.toeSoleMat = phys({ color: 0x141518, roughness: 0.6, transparent: true, opacity: 0 });
    W.toeShoes = {}; for (const Side of SIDES) W.toeShoes[Side] = makeToeShoe(R, Side, { upper: W.toeMat, sole: W.toeSoleMat });
    W.skins = [...SIDES.flatMap((s) => W.shoes[s].parts), ...SIDES.flatMap((s) => W.toeShoes[s].parts)];
    for (const sk of W.skins) scene.add(sk.mesh); }
  // ---- the arches (right foot), riding the foot
  { const c = archCurves(R, 'Right'), A = R.legs.Right.A;
    W.arches = [lineMesh(c.medial, A, 0.0017), lineMesh(c.lateral, A, 0.0014), lineMesh(c.across, A, 0.0015)];
    W.arches[1].material.uniforms.uC.value.multiplyScalar(0.55); W.arches[2].material.uniforms.uC.value.multiplyScalar(0.85);
    for (const m of W.arches) { m.visible = false; R.legs.Right.ankle.add(m); } }
  // ---- the scan: an ellipse of light, and a faint slice inside it, that runs along the right foot
  { const G = R.legs.Right, cx = (G.heel.x + G.ball.x) / 2 + 0.012, cy = G.ground + 0.036;
    const e = new THREE.EllipseCurve(0, 0, 0.074, 0.054, 0, Math.PI * 2, false, 0).getPoints(160).slice(0, -1).map((p) => new THREE.Vector3(p.x, p.y, 0));
    const rm = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xbfd6ff).multiplyScalar(1.7), transparent: true, opacity: 0, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, fog: false });
    const sm = new THREE.MeshBasicMaterial({ color: new THREE.Color(0x9fc0ff), transparent: true, opacity: 0, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false });
    W.scan = new THREE.Group(); W.scan.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(e, true), 160, 0.0011, 6, true), rm));
    W.scan.add(new THREE.Mesh(new THREE.ShapeGeometry(new THREE.Shape(e.map((p) => new THREE.Vector2(p.x, p.y))), 1), sm));
    W.scan.children.forEach((m) => { m.renderOrder = 9; });
    W.scan.visible = false; W.scanMat = rm; W.sliceMat = sm; W.scanC = new THREE.Vector3(cx, cy, 0); R.legs.Right.ankle.add(W.scan); }
  // ---- the set: the pad, the box, the dials
  W.pad = makePad(); scene.add(W.pad.g);
  W.box = makeBox(); W.box.g.position.copy(BOX); W.box.g.rotation.y = BOX_RY; scene.add(W.box.g); setLid(W.box, 0);
  W.dials = buildDials(scene); W.dials.forEach((d, i) => d.g.position.copy(DIALS[i]));
  W.logoRing = makeLogoRing(LOGO_R); W.logoRing.g.rotation.x = -Math.PI / 2; W.logoRing.g.position.y = 0.0665 + 0.0012; W.dials[2].g.add(W.logoRing.g);
  // ---- points of light: 118 runners (57 trained, 61 not), then 19 runners in toe shoes
  W.dots = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 14, 10), new THREE.MeshBasicMaterial({ color: 0xffffff }), 118 + 19);
  W.dots.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array((118 + 19) * 3), 3); W.dots.visible = false; W.dots.frustumCulled = false; scene.add(W.dots);
  // ---- light
  W.key = spot(scene, { color: 0xffe9d2, pos: new THREE.Vector3(-1.2, 3.0, 1.9), target: new THREE.Vector3(0.1, 0.6, 0.1), angle: 0.5, penumbra: 0.85, shadow: true, size: cfg.shadow ?? 1024 });
  W.key.shadow.camera.far = 7;
  W.rim = spot(scene, { color: 0xa9c4ff, pos: new THREE.Vector3(1.5, 2.2, -1.9), target: new THREE.Vector3(0, 0.8, 0), angle: 0.6, penumbra: 0.9 });
  W.fill = spot(scene, { color: 0xc8d6ff, pos: new THREE.Vector3(-1.9, 0.7, 1.9), target: new THREE.Vector3(0, 0.3, 0), angle: 0.7, penumbra: 1 });
  W.footLight = spot(scene, { color: 0xfff1e2, pos: new THREE.Vector3(0.1, 0.95, 1.05), target: new THREE.Vector3(-0.02, 0.12, HZ + 0.1), angle: 0.3, penumbra: 0.8 });
  W.boxLight = spot(scene, { color: 0xfff1d8, pos: new THREE.Vector3(BOX.x + 0.12, 1.45, BOX.z + 0.5), target: BOX.clone(), angle: 0.24, penumbra: 0.55 });
  W.dialLight = spot(scene, { color: 0xffe9d2, pos: new THREE.Vector3(0.2, 1.8, 2.2), target: new THREE.Vector3(0, 0, 1.1), angle: 0.5, penumbra: 0.8 });
  W.dotLight = spot(scene, { color: 0xd8e2ff, pos: new THREE.Vector3(-0.9, 1.9, 1.6), target: new THREE.Vector3(-0.3, 1.0, -0.1), angle: 0.45, penumbra: 0.9 });
  return { stamp: W.stampSpot, toes: [W.toes.Right.n, W.toes.Left.n], muscles: fm.length, rightFoot: W.rightFoot.length, skins: W.skins.length };
}

// ------------------------------------------------------------------ the pad's display: the trial's weeks and steps, then the toe-shoe weeks
function padText(t) {
  if (t > 18.3 && t < 26.8) { const u = clamp01((t - 18.9) / (25.9 - 18.9)), wk = 1 + Math.min(7, Math.floor(u * 8)); const steps = wk <= 2 ? '2,500' : wk <= 4 ? '5,000' : '7,000'; return [`WEEK ${wk}`, `${steps} STEPS`, 1]; }
  if (t > 44.7 && t < 53.4) { const u = clamp01((t - T.tenweeks + 0.25) / 1.45), wk = 1 + Math.min(9, Math.floor(u * 10)); const blink = t > T.ten2 - 0.1 && t < T.fast + 0.5 ? (Math.floor((t - T.ten2 + 0.1) * 5) % 2 ? 0.25 : 1) : 1; return [`WEEK ${wk}`, 'TOE SHOES', blink]; }
  return ['', '', 0];
}

// ------------------------------------------------------------------ the camera: one path, no cuts
let CAM = null;
function buildCam() {
  const b = (f, y, dx = 0, dz = 0) => V3(BOX.x + BF.x * f + dx, y, BOX.z + BF.z * f + dz), bl = V3(BOX.x, 0.04, BOX.z);
  const D = (i, dx, y, dz) => V3(DIALS[i].x + dx, y, DIALS[i].z + dz);
  return camTrack([
    { t: -3.0, p: b(1.0, 1.08), l: bl, fov: 30 },
    { t: 0.0, p: b(0.95, 1.02), l: bl, fov: 30 },                                                     // the box, under its light
    { t: 2.4, p: b(0.9, 0.99), l: bl, fov: 30 },
    { t: 3.9, p: b(0.8, 1.02), l: V3(BOX.x - BF.x * 0.09, 0.125, BOX.z - BF.z * 0.09), fov: 30, tens: 0.5 },   // the lid comes off and stands behind: nothing inside
    { t: 4.45, p: b(0.79, 1.02, -0.01, 0.0), l: V3(BOX.x - BF.x * 0.09 - 0.01, 0.125, BOX.z - BF.z * 0.09), fov: 30, tens: 0.4 },
    { t: 5.45, p: V3(0.42, 0.4, 0.92), l: V3(0.0, 0.16, -0.1), fov: 30 },                             // up and over to the feet: thin shoes, on a walking pad
    { t: 6.9, p: V3(0.36, 0.36, 0.84), l: V3(-0.01, 0.15, -0.1), fov: 30, tens: 0.5 },
    { t: 7.9, p: V3(0.22, 0.25, 0.6), l: V3(-0.06, 0.13, -0.09), fov: 30 },
    { t: 8.8, p: V3(0.17, 0.21, 0.5), l: V3(-0.07, 0.125, -0.1), fov: 30 },                           // the right foot, low, from the front and inside
    { t: 10.1, p: V3(0.44, 0.23, 0.46), l: V3(-0.07, 0.13, -0.05), fov: 30 },                         // round to the inside: the arches
    { t: 11.5, p: V3(0.43, 0.24, 0.48), l: V3(-0.07, 0.13, -0.05), fov: 30, tens: 0.4 },
    { t: 13.8, p: V3(0.25, 0.25, 0.54), l: V3(-0.07, 0.125, -0.07), fov: 30, tens: 0.4 },
    { t: 17.6, p: V3(0.16, 0.28, 0.58), l: V3(-0.07, 0.13, -0.08), fov: 30, tens: 0.35 },
    { t: 20.4, p: V3(-1.75, 1.25, 2.6), l: V3(0, 0.97, -0.05), fov: 34 },                             // back and round: the whole skeleton, walking
    { t: 22.6, p: V3(-1.62, 1.12, 2.44), l: V3(0, 0.9, -0.05), fov: 34 },
    { t: 24.3, p: V3(-0.07, 0.64, 1.34), l: V3(0, 0.14, 0.2), fov: 32 },                              // down over the pad's display to the walking feet
    { t: 26.2, p: V3(-0.06, 0.62, 1.3), l: V3(0, 0.14, 0.18), fov: 32, tens: 0.4 },
    { t: 28.2, p: V3(-1.08, 0.27, -0.04), l: V3(0, 0.17, -0.09), fov: 30 },                           // the side: heel raises, barefoot
    { t: 32.9, p: V3(-1.09, 0.29, 0.0), l: V3(0, 0.17, -0.09), fov: 30, tens: 0.3 },
    { t: 34.3, p: V3(-1.25, 0.82, 1.1), l: V3(-0.35, 0.8, 0.0), fov: 32 },
    { t: 35.4, p: V3(-0.72, 1.21, 1.62), l: V3(-0.5, 1.145, 0.05), fov: 32 },                        // up: 118 runners
    { t: 40.6, p: V3(-0.71, 1.21, 1.65), l: V3(-0.5, 1.145, 0.05), fov: 32, tens: 0.3 },
    { t: 43.3, p: V3(-0.42, 0.52, 1.32), l: V3(0, 0.17, 0.0), fov: 32 },                              // down to the feet and the display: toe shoes
    { t: 45.4, p: V3(-0.36, 0.62, 1.14), l: V3(0, 0.15, -0.03), fov: 32 },
    { t: 47.9, p: V3(-0.36, 0.3, 0.56), l: V3(-0.07, 0.13, -0.08), fov: 30 },                         // the right foot: the MRI
    { t: 50.4, p: V3(-0.33, 0.32, 0.6), l: V3(-0.07, 0.13, -0.08), fov: 30, tens: 0.3 },
    { t: 52.7, p: V3(-0.46, 0.52, 1.12), l: V3(0, 0.18, 0.0), fov: 32 },
    { t: 54.9, p: D(0, 0.02, 0.69, 0.88), l: D(0, 0.06, 0.05, 0), fov: 32 },                          // the dials, one by one: the first rises in view
    { t: 57.2, p: D(0, 0.03, 0.69, 0.88), l: D(0, 0.07, 0.05, 0), fov: 32, tens: 0.2 },
    { t: 58.6, p: D(1, 0.02, 0.69, 0.88), l: D(1, 0.06, 0.05, 0), fov: 32 },
    { t: 59.9, p: D(1, 0.03, 0.69, 0.88), l: D(1, 0.07, 0.05, 0), fov: 32, tens: 0.2 },
    { t: 61.2, p: D(2, 0.02, 0.69, 0.88), l: D(2, 0.06, 0.05, 0), fov: 32 },
    { t: 63.0, p: V3(0.64, 1.22, 3.0), l: V3(0.6, 0.05, 1.12), fov: 34 },                             // back: the last dial and the open box
    { t: 64.9, p: V3(0.68, 1.04, 2.62), l: V3(0.66, 0.05, 1.1), fov: 34, tens: 0.4 },
    { t: 67.2, p: V3(0.66, 0.98, 2.5), l: V3(0.62, 0.05, 1.12), fov: 34, tens: 0.3 },
    { t: T.logo, p: V3(DIALS[2].x, 1.12, DIALS[2].z + 0.005), l: V3(DIALS[2].x, 0.0665, DIALS[2].z), fov: 30, stop: true },   // straight down on the last dial: the logo lands here
  ]);
}
function camPose(S, t) {
  const v = S.cfg.view;
  if (v && typeof v === 'object') return v;
  if (!CAM) CAM = buildCam();
  if (t <= T.logo) return CAM(t);
  const P = CAM(T.logo), k = ss(T.logo, T.end, t);
  return { p: [P.p[0], lerp(P.p[1], P.p[1] - 0.08, k), P.p[2]], l: P.l, fov: 30 };
}
function focusAt(S, t, P) { return Math.hypot(P.p[0] - P.l[0], P.p[1] - P.l[1], P.p[2] - P.l[2]); }

// ------------------------------------------------------------------ where the points of light sit
const DOT1 = (i) => { const grp = i < 57 ? 0 : 1, j = grp ? i - 57 : i, gx = j % 8, gy = Math.floor(j / 8);   // two blocks, one above the other, beside the skeleton
  return new THREE.Vector3(-0.6 + gx * 0.027, (grp ? 1.045 : 1.33) - gy * 0.027, 0.05); };
const DOT2 = (k) => { const a = (-80 + (160 * k) / 18) * (Math.PI / 180);                                     // an arc on the belt, in front of the feet
  return new THREE.Vector3(0.19 * Math.sin(a), PAD.h + 0.011, -0.085 + 0.19 * Math.cos(a)); };

// ------------------------------------------------------------------ one moment of the film
const _m4 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _c = new THREE.Color();
const RED = new THREE.Color(0xff3b30).multiplyScalar(1.4);
function update(S, t) {
  const scene = S.scene;
  applyBody(t);
  const endDark = ss(T.final + 0.3, T.logo - 0.3, t);
  // ---- the belt runs while he walks
  W.pad.beltTex.offset.y = -walkS(t) / ((PAD.z1 - PAD.z0 - 0.12) / 2.2);
  { const [l1, l2, gl] = padText(t); drawPad(W.pad, l1, l2, gl); }
  // ---- the box: the lid comes off (nothing inside), and slams back down at "shoe shop"
  { const a = s5(2.45, 3.55, t), u = clamp01((t - (T.shop - 0.82)) / 0.82); setLid(W.box, t < 40 ? a : 1 - u * u); }
  // ---- the shoes: solid at first, clear for the bones, gone for the exercises
  const xray = ss(T.each - 0.25, T.each + 0.45, t), shoeO = soleOn(t);
  const walkK = ss(18.2, 19.2, t) * (1 - ss(25.9, 26.7, t));
  W.upperMat.opacity = Math.min(1, lerp(1, 0.16, xray) + 0.36 * walkK) * shoeO; W.soleMat.opacity = Math.min(1, lerp(1, 0.5, xray) + 0.35 * walkK) * shoeO;
  for (const m of [W.upperMat, W.soleMat]) { const tr = m.opacity < 0.999; if (m.transparent !== tr) { m.transparent = tr; m.needsUpdate = true; } m.depthWrite = m.opacity > 0.6; }
  // the toe shoes: on at "toe shoes", clear for the MRI, off after "still too fast"
  { const on = toeOn(t), xr = ss(T.bone - 0.6, T.bone - 0.1, t); W.toeMat.opacity = on * lerp(1, 0.2, xr); W.toeSoleMat.opacity = on * lerp(1, 0.45, xr);
    for (const m of [W.toeMat, W.toeSoleMat]) m.depthWrite = m.opacity > 0.6; }
  for (const Side of SIDES) { for (const sk of W.shoes[Side].parts) sk.mesh.visible = shoeO > 0.002; for (const sk of W.toeShoes[Side].parts) sk.mesh.visible = W.toeMat.opacity > 0.002; }
  for (const sk of W.skins) if (sk.mesh.visible) sk.update(0);
  // ---- 26 bones light up, heel to toes; then the three arches draw themselves
  W.rightFoot.forEach((m, i) => { const t0 = T.twentysix - 0.05 + i * 0.034; m.material.emissiveIntensity = 0.55 * Math.exp(-Math.max(0, t - t0) * 2.2) * (t > t0 ? 1 : 0) + 0.06 * ss(T.twentysix, T.bones + 0.4, t) * (1 - ss(T.small, T.small + 0.8, t)); });
  W.arches.forEach((m, i) => { const t0 = T.three + 0.1 + i * 0.3; m.visible = t > t0 && t < 14.3; m.material.uniforms.uDraw.value = s5(t0, t0 + 0.7, t) * 1.02; m.material.uniforms.uO.value = 1 - 0.55 * ss(T.small, T.small + 0.6, t) - 0.45 * ss(13.6, 14.3, t); });
  // ---- the small muscles: they appear under the arches, and work
  { const on = ss(T.small - 0.1, T.muscles + 0.4, t) * (1 - ss(53.0, 54.0, t));
    W.footMat.opacity = on; const tr = on < 0.999; if (W.footMat.transparent !== tr) { W.footMat.transparent = tr; W.footMat.needsUpdate = true; } W.footMat.depthWrite = on > 0.5;
    const pulse = (T.like < t && t < 18.0 ? 0.5 + 0.5 * Math.sin((t - T.like) * 7.5) : 0) * ss(T.like, T.like + 0.4, t), rise = riseAt(t), walk = ss(WALK0, WALK0 + 1, t) * (1 - ss(WALK1 - 0.5, WALK1 + 0.5, t));
    W.footMat.emissiveIntensity = 0.02 + 0.12 * pulse + 0.14 * rise + 0.06 * walk * ss(T.made, T.fortyone, t);
    for (const sk of W.footSkins) { sk.mesh.visible = on > 0.002; if (on > 0.002) sk.update(0); } }
  // ---- the dots: 118 runners in two groups (57 trained, 61 not); then 19 runners, ten of them lit red
  { const on1 = ss(T.runners - 0.2, T.runners + 0.6, t) * (1 - ss(40.9, 41.6, t)), on2 = ss(T.toe - 0.1, T.toe + 0.6, t) * (1 - ss(T.bone - 0.1, T.bone + 0.4, t));
    W.dots.visible = on1 > 0.002 || on2 > 0.002;
    if (W.dots.visible) {
      for (let i = 0; i < 118; i++) {
        const pop = outBack(clamp01((t - (T.runners - 0.2 + i * 0.006)) / 0.25), 2) * on1;
        _s.setScalar(Math.max(0.00001, pop * 0.0078)); _m4.compose(DOT1(i), _q.identity(), _s); W.dots.setMatrixAt(i, _m4);
        _c.set(i < 57 ? 0xeceef1 : 0x8a909a); W.dots.setColorAt(i, _c);
      }
      for (let k = 0; k < 19; k++) {
        const i = 118 + k, pop = outBack(clamp01((t - (T.toe + k * 0.025)) / 0.25), 2) * on2, hot = k < 10 ? ss(T.ten + k * 0.06, T.ten + 0.3 + k * 0.06, t) : 0;
        _s.setScalar(Math.max(0.00001, pop * 0.0085 * (1 + 0.15 * hot))); _m4.compose(DOT2(k), _q.identity(), _s); W.dots.setMatrixAt(i, _m4);
        _c.set(0xeceef1).lerp(RED, hot); W.dots.setColorAt(i, _c);
      }
      W.dots.instanceMatrix.needsUpdate = true; W.dots.instanceColor.needsUpdate = true;
    } }
  // ---- the MRI: an ellipse of light runs along the right foot, the bones flash in its path
  { const on = ss(T.bone - 0.2, T.bone + 0.1, t) * (1 - ss(T.mri + 0.6, T.mri + 1.0, t)), run = s5(0, 1, clamp01((t - T.bone) / 1.7));
    W.scan.visible = on > 0.002; W.scanMat.opacity = on; W.sliceMat.opacity = 0.07 * on;
    const G = W.rig.legs.Right, zr = lerp(G.heel.z - 0.025, G.toeZ + 0.012, run);
    if (on > 0.002) { W.scan.position.set(W.scanC.x - G.A.x, W.scanC.y - G.A.y, zr - G.A.z);
      W.rightFoot.forEach((m) => { const dz = m.userData.home.z - zr; m.material.emissiveIntensity = Math.max(m.material.emissiveIntensity, 0.42 * Math.exp(-(dz * dz) / 0.0005) * on); }); } }
  // ---- the dials rise and are set (2,500 / 5,000 / 7,000 steps a day, of 10,000)
  W.dials.forEach((d, i) => {
    const t0 = T.worked + i * 0.18, up = s5(t0, t0 + 0.9, t); d.g.position.y = lerp(-0.075, 0, up); d.g.visible = up > 0.001;
    const ts = [T.two, T.five, T.seven][i], v = [0.25, 0.5, 0.7][i], k = s5(ts - 0.1, ts + 0.55, t);
    d.knob.rotation.y = -d.angle(lerp(lerp(0, v, k), 0.5, i === 2 ? s5(T.final + 0.2, T.logo - 0.3, t) : 0));
    d.setMat.opacity = ss(ts + 0.3, ts + 0.6, t) * (1 - endDark);
    const a = d.angle(v), r = 0.147; d.set.position.set(Math.sin(a) * r, 0.0048, -Math.cos(a) * r); d.set.rotation.y = -a;
  });
  { const logoK = s5(T.final + 0.4, T.logo - 0.25, t); W.logoRing.set({ weight: logoK, white: logoK, hours: 0, hand: ss(T.logo - 0.4, T.logo - 0.15, t), handScale: outBack(clamp01((t - (T.logo - 0.4)) / 0.35), 1.8) }); }
  // ---- light
  const fig = 1 - endDark;
  W.key.intensity = 5.4 * fig; W.rim.intensity = 2.2 * fig; W.fill.intensity = 0.9 * fig;
  W.footLight.intensity = 2.6 * (ss(5.0, 6.6, t) * (1 - ss(18.0, 19.5, t)) + ss(23.4, 24.8, t) * (1 - ss(34.0, 35.0, t)) + ss(41.8, 43.0, t) * (1 - ss(52.6, 53.6, t)));
  W.boxLight.intensity = 5.0 * (1 - ss(5.0, 6.8, t) * (1 - ss(61.6, 63.2, t))) * (1 - 0.7 * endDark);
  W.dialLight.intensity = 3.2 * ss(54.6, 55.8, t) * (1 - 0.6 * endDark);
  W.dotLight.intensity = 1.6 * ss(34.6, 35.6, t) * (1 - ss(40.8, 41.8, t));
  S.tableMat.color.setScalar(FLOOR * (1 - endDark * 0.9)); scene.environmentIntensity = 0.12 * (1 - endDark); S.reflAmt = 0.9 * (1 - endDark);
}

// ------------------------------------------------------------------ the words on screen
const CAPS = [
  { t0: 0.35, t1: 4.7, top: 292, size: 88, html: '<em>Barefoot</em> shoes:<br>made to feel like none' },
  { t0: 4.93, t1: 6.9, top: 300, size: 104, html: 'Do they <em>work?</em>' },
  { t0: 7.24, t1: 10.7, top: 292, size: 88, html: '<em>26</em> bones,<br><em>3</em> arches' },
  { t0: 10.94, t1: 14.6, top: 292, size: 84, html: 'Small muscles<br><em>hold them up</em>' },
  { t0: 14.87, t1: 18.2, top: 292, size: 84, html: 'Work them,<br>they get <em>stronger</em>' },
  { t0: 18.66, t1: 26.6, top: 292, size: 80, html: '8 weeks walking in<br>flat shoes: <em>+41%</em>' },
  { t0: 27.23, t1: 31.4, top: 292, size: 88, html: 'Foot exercises:<br><em>+58%</em>' },
  { t0: 31.61, t1: 33.9, top: 300, size: 88, html: 'No new shoes <em>required</em>' },
  { t0: 34.12, t1: 41.2, top: 292, size: 80, html: 'Foot training:<br>fewer <em>running injuries</em>' },
  { t0: 41.54, t1: 43.4, top: 300, size: 92, html: 'Don’t switch <em>overnight</em>' },
  { t0: 43.6, t1: 50.8, top: 292, size: 80, html: 'Toe shoes in 10 weeks:<br><em>10 of 19</em> bone stress' },
  { t0: 51.08, t1: 53.5, top: 300, size: 96, html: 'Still <em>too fast.</em>' },
  { t0: 53.73, t1: 61.7, top: 292, size: 84, html: 'Build up <em>slowly</em>' },
  { t0: 61.97, t1: 64.6, top: 292, size: 84, html: 'Painful, stiff,<br>weak or <em>numb?</em>' },
  { t0: 64.8, t1: 67.7, top: 292, size: 88, html: 'See a <em>doctor.</em><br>Not a shoe shop.' },
  { t0: 68.19, t1: 99, top: 360, size: 96, html: 'Back to<br><em>factory settings.</em>' },
];
const OVL = {};
function overlayInit(S) {
  const O = S.O, tag = (cls, txt, size) => { const e = O.tag(cls, txt); e.style.fontSize = size + 'px'; return e; };
  OVL.arch = [tag('tag', 'Inner arch', 28), tag('tag', 'Outer arch', 28), tag('tag', 'Across', 28)];
  OVL.grp = [tag('tag', 'Foot training<b>57 runners</b>', 26), tag('tag', 'No training<b>61 runners</b>', 26)];
  for (const e of OVL.grp) e.querySelector('b').style.fontSize = '40px';
  OVL.risk = tag('tag', 'Injured within a year<b>2.42× as likely</b>', 26); OVL.risk.querySelector('b').style.fontSize = '44px';
  OVL.dial = [tag('tag', 'Weeks 1 to 2<b>2,500 steps a day</b>', 30), tag('tag', 'Weeks 3 to 4<b>5,000 a day</b>', 30), tag('tag', 'Weeks 5 to 8<b>7,000 a day</b>', 30)];
  for (const e of OVL.dial) e.querySelector('b').style.fontSize = '54px';
}
function overlay(S, t) {
  const R = W.rig, ank = R.legs.Right.ankle;
  W.arches.forEach((m, i) => { const mid = ank.localToWorld(m.userData.mid.clone()); const t0 = T.three + 0.1 + i * 0.3;
    place(S, OVL.arch[i], mid, [40, -230, 40][i], [-70, 40, 30][i], ss(t0 + 0.35, t0 + 0.75, t) * (1 - ss(10.8, 11.2, t))); });
  const g1 = ss(T.runners + 0.3, T.runners + 0.8, t) * (1 - ss(40.9, 41.4, t));
  place(S, OVL.grp[0], new THREE.Vector3(-0.613, 1.33, 0.05), -6, -112, g1);
  place(S, OVL.grp[1], new THREE.Vector3(-0.613, 1.045, 0.05), -6, -112, g1 * ss(T.runners + 0.6, T.runners + 1.1, t));
  place(S, OVL.risk, new THREE.Vector3(-0.613, 0.845, 0.05), -6, 26, ss(T.fewer, T.injuries + 0.3, t) * (1 - ss(40.9, 41.4, t)));
  W.dials.forEach((d, i) => { const ts = [T.two, T.five, T.seven][i], e = OVL.dial[i];
    place(S, e, d.g.position.clone().add(new THREE.Vector3(0, 0.0, 0.2)), -(e.offsetWidth || 200) / 2, 10, ss(ts, ts + 0.4, t) * (1 - ss(T.feet - 0.3, T.feet + 0.2, t))); });
  const d = W.dials[2], c = d.g.position.clone().add(new THREE.Vector3(0, 0.0665 + 0.0012, 0));
  logoEnd(S, t, { t0: T.logo, center: c, edge: c.clone().add(new THREE.Vector3(LOGO_R, 0, 0)) });
}

makeFilm({
  T, caps: CAPS, subs: [], build, update, pose: camPose, overlay, overlayInit, focus: focusAt,
  stage: { bg: 0x07080a, reflSize: 6, env: 0.12, far: 30 },
  aperture: [[0, 0.006], [3.9, 0.005], [6.2, 0.004], [8.8, 0.006], [17.6, 0.006], [20.4, 0.002], [22.6, 0.002], [24.6, 0.004], [28.2, 0.005], [35.9, 0.003], [43.3, 0.004], [47.9, 0.006], [52.8, 0.003], [55.5, 0.003], [63, 0.002], [67, 0.003]],
  bloom: [[0, 0.42], [8, 0.48], [30, 0.45], [48, 0.5], [70, 0.55]],
  fast: [[18.6, 26.4, 2], [27.6, 32.9, 2], [65.3, 66.4, 2]],
});

// Human Factory Settings · Film 7 "Is ultra-processed food bad for you?" (new direction, 6 Oct 2026) · one continuous shot, 9:16.
// A long kitchen counter beside a skeleton standing on a bathroom scale. Breakfast from a box, lunch from a wrapper, dinner
// from a bag; a WILLPOWER meter on the wall gets the blame (a BLAMED stamp). A cast-iron pot takes a carrot, a fish and a
// drumstick (grew, swam, walked). Five jars (starch, sugar, oil, protein isolate, additives) pour into a snack packet and a
// can. Twenty pawns; two trays, two weeks each; the packaged one gets second helpings (+508 kcal a day) and the scale goes
// up 0.9 kg. Same people: the stamp falls off the meter. Two stacks of discs: two come off for minimally processed food,
// one for ultra-processed. Whole food on a board; a packet, a can and a pack of sausages slide into a crate marked
// EXCEPTION; two dials. A potato on a plinth marked FOOD, the potato-flavoured crisps on one marked HOBBY (the gag).
// Medicine and a plate, side by side. The second dial becomes the logo.
import { THREE, ORANGE, ss, s5, lerp, clamp01, hash, camTrack, phys, glowMat, shadows, spot, RoundedBoxGeometry,
  loadAnatomy, V3, place, logoEnd, makeFilm, outBack, stamp, labelCanvas, stampLine, noiseTex } from '../kit.js';
import { buildRig, skeletonKind, bendSpine, poseArm, clearArms, worldVerts, avgV } from '../rig.js';
import { makeLogoRing } from '../props.js';

// ------------------------------------------------------------------ timing, from the voice guide (word starts)
const T = {
  end: 79.42, logo: 76.9,
  you: 0.35, breakfast: 1.06, box: 1.76, lunch: 1.98, wrapper: 2.94, dinner: 3.4, bag: 4.21, then: 4.37, blame: 4.65, willpower: 5.56,
  lets: 6.78, look: 7.3, food: 7.76, instead: 8.0,
  for: 9.37, history: 10.29, people: 10.6, cooked: 10.97, things: 12.04, grew: 12.63, swam: 12.98, walked: 13.72,
  ultra: 14.79, made: 16.36, factories: 16.62, parts: 17.74, foods: 18.32, additives: 18.89, like: 19.62, packaged: 20.02, snacks: 20.49, fizzy: 21.17, drinks: 21.54,
  in: 22.88, hospital: 23.49, twenty: 24.13, adults: 24.72, ate: 25.13, wanted: 26.32, two1: 26.81, ultra2: 27.76, meals2: 28.94, two2: 29.82, fresh: 30.35, same: 31.75, nutrients: 32.15, offer: 33.18,
  on: 34.29, packaged2: 34.86, ate2: 35.67, five: 36.32, hundred: 36.72, extra: 37.26, calories: 37.78, day: 38.55, gained: 38.98, almost: 39.43, kilo: 40.38,
  they: 41.53, same2: 42.31, people2: 42.48, with: 42.77, same3: 43.38, willpower2: 43.6,
  in2: 45.02, newer: 45.63, trial: 45.75, both: 46.11, diets: 46.38, healthy: 47.22, advice: 48.18, people3: 49.16, lost: 49.61, about2: 50.38, half: 50.81, weight: 51.82, ultra3: 52.48, one: 53.63,
  so: 54.62, cook: 55.16, food2: 55.54, still: 56.01, looks: 56.29, came: 56.95, and3: 57.58, make: 58.01, packaged3: 58.22, snacks2: 58.86, sugary: 59.25, drinks2: 59.81, processed: 60.55, meat: 61.31, exception: 61.86,
  a: 62.98, potato: 63.4, food3: 64.1, a2: 64.32, potato2: 64.82, snack: 65.78, hobby: 66.59,
  if: 67.78, medicine: 68.55, diabetes: 69.18, heart: 70.34, better: 70.78, food4: 71.22, works: 71.68, with2: 72.02, not: 72.37, instead2: 72.69,
  final: 74.64, factory: 75.85, settings: 76.22,
};

// ------------------------------------------------------------------ the set (metres; the skeleton faces +z; +x is its left, the right of the frame)
const W = {}; window.HFS_W = W;
const FLOOR = 0.4;
const SCALE = { w: 0.34, d: 0.36, h: 0.026 };                       // the bathroom scale
const CT = { x0: 0.38, x1: 2.38, zf: 0.3, zb: -0.32, y: 0.9 };      // the counter: x0..x1 along, zf front edge, y its top face
const WALL_Z = CT.zb - 0.004;
const GAUGE = new THREE.Vector3(0.84, 1.72, WALL_Z);                 // the WILLPOWER meter, on the wall above the first items
const POT = new THREE.Vector3(1.32, CT.y, 0.0);
const JARS = [1.56, 1.67, 1.78, 1.89, 2.0].map((x) => new THREE.Vector3(x, CT.y, -0.12));
const PACKET = new THREE.Vector3(1.71, CT.y, 0.15), CAN = new THREE.Vector3(1.88, CT.y, 0.15);
const TRAYS = [new THREE.Vector3(1.04, CT.y, 0.12), new THREE.Vector3(1.32, CT.y, 0.12)];   // ultra-processed, fresh
const STACKS = [new THREE.Vector3(0.68, CT.y, 0.07), new THREE.Vector3(0.9, CT.y, 0.07)];  // minimally processed, ultra-processed
const BOARD = new THREE.Vector3(1.24, CT.y, 0.04), CRATE = new THREE.Vector3(1.62, CT.y, 0.03), SLIDE_X = 1.45;
const PLINTHS = [new THREE.Vector3(2.06, CT.y, 0.0), new THREE.Vector3(2.26, CT.y, 0.0)];   // FOOD, HOBBY
const MEDS = new THREE.Vector3(2.04, CT.y, 0.05), PLATE = new THREE.Vector3(2.22, CT.y, 0.05);
const DIAL_S = 0.55;                                                // the dials stand on the counter, at 55% of their floor size
const DIALS = [new THREE.Vector3(0.97, CT.y, 0.17), new THREE.Vector3(1.86, CT.y, 0.17)];   // cook from food; the exception (the logo's)
const LOGO_R = 0.072;
const RELAX = 0.18;                                                 // a hand at rest, a little closed
const SIDES = ['Right', 'Left'];

// ------------------------------------------------------------------ small helpers
function canvasTex(w, h, draw, { srgb = true, aniso = 8 } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h, c);
  const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = aniso; t.userData.canvas = c; return t;
}
function txt(x, s, px, py, { font = '800 100px Archivo', color = '#fff', align = 'center', track = 0, base = 'middle', maxW = 0 } = {}) {
  x.font = font; x.letterSpacing = `${track}px`; x.fillStyle = color; x.textAlign = align; x.textBaseline = base;
  if (maxW) { const w = x.measureText(s).width; if (w > maxW) { x.save(); x.translate(px, py); x.scale(maxW / w, 1); x.fillText(s, 0, 0); x.restore(); return; } }
  x.fillText(s, px, py);
}
const mulberry = (seed) => () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const lathe = (pts, n = 48) => new THREE.LatheGeometry(pts.map(([a, b]) => new THREE.Vector2(a, b)), n);
const finish = (g) => { shadows(g); g.traverse((o) => o.layers.enable(1)); return g; };
const pop = (t, t0, d = 0.32, k = 1.6) => outBack(clamp01((t - t0) / d), k);            // 0 → 1 with a little overshoot
function showAt(obj, k) { obj.visible = k > 0.001; obj.scale.setScalar(Math.max(0.001, k)); }

// seven-segment digits, slanted, as on a scale's display (from film 5)
const SEG = { 0: 'abcdef', 1: 'bc', 2: 'abged', 3: 'abgcd', 4: 'fgbc', 5: 'afgcd', 6: 'afgedc', 7: 'abc', 8: 'abcdefg', 9: 'abcdfg', '-': 'g', ' ': '' };
function seg7(x, text, { x0, y0, w, h, th, gap, on, off, slant = 0.12, cells }) {
  const cs = [];
  for (const ch of text) { if (ch === '.' && cs.length) cs[cs.length - 1].dp = true; else cs.push({ ch, dp: false }); }
  while (cs.length < cells) cs.unshift({ ch: ' ', dp: false });
  const hseg = (sx, sy, len) => { x.beginPath(); x.moveTo(sx, sy); x.lineTo(sx + th / 2, sy - th / 2); x.lineTo(sx + len - th / 2, sy - th / 2); x.lineTo(sx + len, sy); x.lineTo(sx + len - th / 2, sy + th / 2); x.lineTo(sx + th / 2, sy + th / 2); x.closePath(); x.fill(); };
  const vseg = (sx, sy, len) => { x.beginPath(); x.moveTo(sx, sy); x.lineTo(sx + th / 2, sy + th / 2); x.lineTo(sx + th / 2, sy + len - th / 2); x.lineTo(sx, sy + len); x.lineTo(sx - th / 2, sy + len - th / 2); x.lineTo(sx - th / 2, sy + th / 2); x.closePath(); x.fill(); };
  x.save(); x.transform(1, 0, -slant, 1, slant * (y0 + h), 0);
  const pitch = w + th * 1.25 + gap * 4;
  cs.forEach((c, i) => {
    const cx = x0 + i * pitch, g = gap, hh = h / 2, lit = SEG[c.ch] || '';
    const S = { a: () => hseg(cx + g, y0, w - 2 * g), g: () => hseg(cx + g, y0 + hh, w - 2 * g), d: () => hseg(cx + g, y0 + h, w - 2 * g),
      f: () => vseg(cx, y0 + g, hh - 2 * g), b: () => vseg(cx + w, y0 + g, hh - 2 * g), e: () => vseg(cx, y0 + hh + g, hh - 2 * g), c: () => vseg(cx + w, y0 + hh + g, hh - 2 * g) };
    for (const k of 'abcdefg') { x.fillStyle = lit.includes(k) ? on : off; S[k](); }
  });
  cs.forEach((c, i) => { x.fillStyle = c.dp ? on : off; x.beginPath(); x.arc(x0 + i * pitch + w + th * 0.62 + gap * 2, y0 + h, th * 0.5, 0, Math.PI * 2); x.fill(); });
  x.restore();
}

// ------------------------------------------------------------------ hands (with wrists; here they only hang, a little closed)
// (from hands_block.js)
//@HANDS@

// ------------------------------------------------------------------ the counter: dark cabinets, an oak top, a tiled wall behind
function makeCounter() {
  const g = new THREE.Group(), w = CT.x1 - CT.x0, d = CT.zf - CT.zb, cx = (CT.x0 + CT.x1) / 2, cz = (CT.zf + CT.zb) / 2;
  const cab = phys({ color: 0x1b1e22, roughness: 0.5, clearcoat: 0.3, clearcoatRoughness: 0.4 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(w, CT.y - 0.04, d - 0.03), cab); body.position.set(cx, (CT.y - 0.04) / 2, cz - 0.015); g.add(body);
  const groove = phys({ color: 0x0b0c0e, roughness: 0.8 });
  for (let k = 1; k < 5; k++) { const gr = new THREE.Mesh(new THREE.BoxGeometry(0.004, CT.y - 0.16, 0.003), groove); gr.position.set(CT.x0 + (w * k) / 5, (CT.y - 0.04) / 2 + 0.02, CT.zf - 0.0285); g.add(gr); }
  const kick = new THREE.Mesh(new THREE.BoxGeometry(w, 0.08, 0.02), groove); kick.position.set(cx, 0.04, CT.zf - 0.06); g.add(kick);
  const oak = canvasTex(2048, 256, (x, cw, ch) => {
    x.fillStyle = '#b8875a'; x.fillRect(0, 0, cw, ch);
    for (let k = 0; k < 140; k++) { const y = hash(k) * ch, a = 0.05 + 0.1 * hash(k * 3.3); x.strokeStyle = hash(k * 7) > 0.5 ? `rgba(92,56,26,${a})` : `rgba(236,196,150,${a})`; x.lineWidth = 1 + 3 * hash(k * 5);
      x.beginPath(); x.moveTo(0, y); for (let s = 1; s <= 16; s++) x.lineTo((s / 16) * cw, y + Math.sin(s * 0.9 + k) * 3 + (hash(k + s) - 0.5) * 2); x.stroke(); }
  });
  const top = new THREE.Mesh(new RoundedBoxGeometry(w + 0.02, 0.04, d + 0.02, 3, 0.006), phys({ map: oak, roughness: 0.48, clearcoat: 0.35, clearcoatRoughness: 0.35 }));
  top.position.set(cx, CT.y - 0.02, cz); g.add(top);
  const tiles = canvasTex(2048, 1200, (x, cw, ch) => {
    x.fillStyle = '#0e0f11'; x.fillRect(0, 0, cw, ch);
    const tw = cw / 26, th = ch / 16;
    for (let j = 0; j < 16; j++) for (let i = 0; i < 26; i++) { const v = 26 + Math.floor(8 * hash(i * 13 + j * 7)); x.fillStyle = `rgb(${v},${v + 2},${v + 5})`; x.fillRect(i * tw + 3, j * th + 3, tw - 6, th - 6); }
  });
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(w + 0.02, 1.25), phys({ map: tiles, roughness: 0.32, clearcoat: 0.6, clearcoatRoughness: 0.15 }));
  wall.position.set(cx, CT.y + 0.625, WALL_Z - 0.001); g.add(wall);
  finish(g); return { g, body, top };
}

// ------------------------------------------------------------------ the WILLPOWER meter (on the wall) and its BLAMED stamp
function makeGauge() {
  const g = new THREE.Group(), r = 0.072;
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(r + 0.009, r + 0.011, 0.03, 96), phys({ color: 0xcfcac2, metalness: 1, roughness: 0.28, clearcoat: 0.4 }));
  rim.rotation.x = Math.PI / 2; rim.position.z = 0.015; g.add(rim);
  const faceTex = canvasTex(1024, 1024, (x, w, h) => {
    const c = w / 2; x.fillStyle = '#f1ebdd'; x.beginPath(); x.arc(c, c, c, 0, Math.PI * 2); x.fill();
    x.strokeStyle = '#2b2824'; x.lineCap = 'butt';
    for (let k = 0; k <= 20; k++) { const a = -2.2 + (k / 20) * 4.4, big = k % 5 === 0, r0 = c * (big ? 0.62 : 0.68), r1 = c * 0.78; x.lineWidth = big ? 9 : 5;
      x.beginPath(); x.moveTo(c + Math.sin(a) * r0, c - Math.cos(a) * r0); x.lineTo(c + Math.sin(a) * r1, c - Math.cos(a) * r1); x.stroke(); }
    x.lineWidth = 6; x.beginPath(); x.arc(c, c, c * 0.8, -Math.PI / 2 - 2.2, -Math.PI / 2 + 2.2); x.stroke();
    txt(x, 'LOW', c - c * 0.5, c + c * 0.44, { font: '700 64px Archivo', color: '#2b2824', track: 6 });
    txt(x, 'HIGH', c + c * 0.5, c + c * 0.44, { font: '700 64px Archivo', color: '#2b2824', track: 6 });
    txt(x, 'WILLPOWER', c, c + c * 0.25, { font: '900 112px Archivo', color: '#2b2824', track: 10, maxW: c * 1.2 });
  });
  const face = new THREE.Mesh(new THREE.CircleGeometry(r, 96), phys({ map: faceTex, roughness: 0.62 })); face.position.z = 0.0302; g.add(face);
  const needle = new THREE.Group(); needle.position.z = 0.0325; g.add(needle);
  const nm = new THREE.Mesh(new THREE.BoxGeometry(0.0035, r * 0.74, 0.0015), phys({ color: 0x1b1a19, roughness: 0.4 })); nm.position.y = r * 0.3; needle.add(nm);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.0065, 0.0065, 0.004, 24), phys({ color: 0x2a2a2a, metalness: 0.6, roughness: 0.35 })); hub.rotation.x = Math.PI / 2; hub.position.z = 0.034; g.add(hub);
  const glass = new THREE.Mesh(new THREE.CircleGeometry(r, 96), phys({ color: 0xffffff, transparent: true, opacity: 0.07, roughness: 0.03, clearcoat: 1, clearcoatRoughness: 0.02, depthWrite: false }));
  glass.position.z = 0.0365; g.add(glass);
  finish(g); glass.castShadow = false;
  const stampTex = canvasTex(1024, 420, (x, w, h) => {
    x.clearRect(0, 0, w, h); x.strokeStyle = 'rgba(196,30,36,0.92)'; x.lineWidth = 26; x.strokeRect(22, 22, w - 44, h - 44);
    txt(x, 'BLAMED', w / 2, h / 2 + 8, { font: '900 250px Archivo', color: 'rgba(196,30,36,0.92)', track: 18, maxW: w - 120 });
    x.globalCompositeOperation = 'destination-out'; for (let k = 0; k < 900; k++) { x.fillStyle = `rgba(0,0,0,${0.3 + 0.5 * hash(k * 2.1)})`; x.fillRect(hash(k) * w, hash(k * 1.7) * h, 3 + 6 * hash(k * 3), 2 + 4 * hash(k * 5)); }
  });
  const sm = phys({ map: stampTex, transparent: true, roughness: 0.6, depthWrite: false });
  const st = new THREE.Mesh(new THREE.PlaneGeometry(0.11, 0.045), sm); st.position.set(0, 0.024, 0.0375); st.rotation.z = 0.2; st.visible = false; st.layers.enable(1); g.add(st);
  return { g, needle, st, sm, stP: st.position.clone(), stR: 0.2 };
}

// ------------------------------------------------------------------ the packs (fictional, no brands): labels as canvases
function hoopsTex() {
  return canvasTex(720, 1080, (x, cw, ch) => {
    const g = x.createLinearGradient(0, 0, 0, ch); g.addColorStop(0, '#e2462e'); g.addColorStop(1, '#a92a18'); x.fillStyle = g; x.fillRect(0, 0, cw, ch);
    txt(x, 'HONEY', cw / 2, ch * 0.13, { font: `900 ${cw * 0.2}px Archivo`, color: '#ffe066', track: 4, maxW: cw * 0.86 });
    txt(x, 'HOOPS', cw / 2, ch * 0.27, { font: `900 ${cw * 0.24}px Archivo`, color: '#fff', track: 4, maxW: cw * 0.88 });
    x.fillStyle = '#f7f1e6'; x.beginPath(); x.ellipse(cw / 2, ch * 0.64, cw * 0.38, ch * 0.13, 0, 0, Math.PI * 2); x.fill();
    for (let k = 0; k < 30; k++) { const px = cw / 2 + (hash(k) - 0.5) * cw * 0.55, py = ch * 0.6 + (hash(k + 9) - 0.5) * ch * 0.1; x.strokeStyle = k % 2 ? '#d9952f' : '#e8b04a'; x.lineWidth = cw * 0.018; x.beginPath(); x.arc(px, py, cw * 0.032, 0, Math.PI * 2); x.stroke(); }
    x.fillStyle = '#ffe066'; x.beginPath(); x.arc(cw * 0.8, ch * 0.42, cw * 0.11, 0, Math.PI * 2); x.fill();
    txt(x, 'NEW', cw * 0.8, ch * 0.42, { font: `900 ${cw * 0.06}px Archivo`, color: '#a92a18', track: 2 });
    txt(x, 'WITH REAL HONEY FLAVOUR', cw / 2, ch * 0.9, { font: `700 ${cw * 0.05}px Archivo`, color: '#ffd8c8', track: 3, maxW: cw * 0.86 });
  });
}
function makeCereal() {
  const w = 0.17, h = 0.26, d = 0.06, tex = hoopsTex(), side = phys({ color: 0xb8301f, roughness: 0.5, clearcoat: 0.3 }), topM = phys({ color: 0xd8442c, roughness: 0.5, clearcoat: 0.3 });
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), [side, side, topM, topM, phys({ map: tex, roughness: 0.45, clearcoat: 0.35 }), side]); m.position.y = h / 2;
  const g = new THREE.Group(); g.add(m); return finish(g);
}
function makeBar() {   // a snack bar in a foil wrapper, lying flat, crimped at both ends
  const g = new THREE.Group(), L = 0.14, Wd = 0.046, H = 0.024;
  const tex = canvasTex(1024, 340, (x, w, h) => {
    x.fillStyle = '#5a2ca8'; x.fillRect(0, 0, w, h); x.fillStyle = '#ffcf33'; x.fillRect(0, h * 0.72, w, h * 0.28);
    txt(x, 'CRUNCH', w * 0.42, h * 0.38, { font: '900 150px Archivo', color: '#fff', track: 6, maxW: w * 0.6 });
    txt(x, 'CARAMEL · NOUGAT', w * 0.42, h * 0.86, { font: '800 52px Archivo', color: '#5a2ca8', track: 4, maxW: w * 0.6 });
    x.fillStyle = '#7a3a1c'; x.beginPath(); x.roundRect(w * 0.76, h * 0.16, w * 0.18, h * 0.42, 18); x.fill();
  });
  const foil = phys({ map: tex, roughness: 0.25, metalness: 0.3, clearcoat: 0.8, clearcoatRoughness: 0.15 });
  const crimp0 = phys({ color: 0x5a2ca8, roughness: 0.3, metalness: 0.35, clearcoat: 0.7 });
  const body = new THREE.Mesh(new RoundedBoxGeometry(L * 0.86, H, Wd, 4, 0.01), [crimp0, crimp0, foil, crimp0, crimp0, crimp0]); body.position.y = H / 2; g.add(body);
  const crimp = phys({ color: 0x5a2ca8, roughness: 0.3, metalness: 0.35, clearcoat: 0.7 });
  for (const s of [-1, 1]) { const c = new THREE.Mesh(new THREE.BoxGeometry(L * 0.075, 0.003, Wd * 1.02), crimp); c.position.set(s * L * 0.465, H * 0.5, 0); g.add(c);
    for (let k = 0; k < 7; k++) { const rib = new THREE.Mesh(new THREE.BoxGeometry(0.0012, 0.0035, Wd * 1.02), crimp); rib.position.set(s * (L * 0.44 + k * 0.0016), H * 0.5, 0); g.add(rib); } }
  return finish(g);
}
function makeBag() {   // a kraft takeaway bag, its top rolled over and stapled
  const g = new THREE.Group(), w = 0.17, h = 0.22, d = 0.11;
  const kraftTex = noiseTex(61, 256, 0.84, 1.0, 3);
  const kraft = phys({ color: 0xb48a58, roughness: 0.88, roughnessMap: kraftTex, bumpMap: kraftTex, bumpScale: 0.5 });
  const front = canvasTex(680, 880, (x, cw, ch) => {
    x.fillStyle = '#b48a58'; x.fillRect(0, 0, cw, ch);
    x.globalAlpha = 0.08; for (let k = 0; k < 700; k++) { x.fillStyle = k % 2 ? '#000' : '#fff'; x.fillRect(hash(k) * cw, hash(k + 3.3) * ch, 2, 2); } x.globalAlpha = 1;
    x.strokeStyle = '#2a1d12'; x.lineWidth = 12; x.beginPath(); x.arc(cw / 2, ch * 0.42, cw * 0.22, 0, Math.PI * 2); x.stroke();
    x.lineWidth = 14; x.lineCap = 'round'; x.beginPath(); x.moveTo(cw * 0.44, ch * 0.32); x.lineTo(cw * 0.44, ch * 0.52); x.moveTo(cw * 0.56, ch * 0.32); x.lineTo(cw * 0.56, ch * 0.52); x.stroke();
    txt(x, 'TAKEAWAY', cw / 2, ch * 0.74, { font: '900 120px Archivo', color: '#2a1d12', track: 10, maxW: cw * 0.86 });
    txt(x, 'HOT · FAST · LATE', cw / 2, ch * 0.86, { font: '700 46px Archivo', color: '#4a3524', track: 8, maxW: cw * 0.8 });
  });
  const fm = phys({ map: front, roughness: 0.86, bumpMap: kraftTex, bumpScale: 0.4 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), [kraft, kraft, kraft, kraft, fm, kraft]); body.position.y = h / 2; g.add(body);
  const fold = new THREE.Mesh(new RoundedBoxGeometry(w + 0.002, 0.034, 0.016, 2, 0.006), kraft); fold.position.set(0, h + 0.004, 0.012); fold.rotation.x = -0.35; g.add(fold);
  const staple = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.002, 0.001), phys({ color: 0xd8d8d8, metalness: 1, roughness: 0.3 })); staple.position.set(0, h + 0.006, 0.0225); staple.rotation.x = -0.35; g.add(staple);
  return finish(g);
}

// ------------------------------------------------------------------ the pot, and what grew, swam and walked
function makePot() {
  const g = new THREE.Group();
  const iron = phys({ color: 0x1c1c1e, roughness: 0.55, metalness: 0.35, bumpMap: noiseTex(7, 256, 0.85, 1.0, 4), bumpScale: 0.6, side: THREE.DoubleSide });
  g.add(new THREE.Mesh(lathe([[0.0, 0.0], [0.092, 0.0], [0.104, 0.007], [0.11, 0.024], [0.11, 0.094], [0.116, 0.1], [0.106, 0.102], [0.101, 0.096], [0.101, 0.014], [0.0, 0.014]], 96), iron));
  for (const s of [-1, 1]) { const h = new THREE.Mesh(new THREE.TorusGeometry(0.02, 0.006, 12, 32, Math.PI), iron); h.position.set(s * 0.112, 0.082, 0); h.rotation.set(0, 0, s > 0 ? -Math.PI / 2 : Math.PI / 2); g.add(h); }
  const stew = new THREE.Mesh(new THREE.CircleGeometry(0.1, 64), phys({ color: 0x8a4a22, roughness: 0.25, clearcoat: 0.8, clearcoatRoughness: 0.2 }));
  stew.rotation.x = -Math.PI / 2; stew.position.y = 0.03; g.add(stew);
  finish(g); return { g, stew };
}
function makeCarrot() {
  const g = new THREE.Group(), pts = [];
  for (let i = 0; i <= 20; i++) { const u = i / 20; pts.push([0.0175 * Math.pow(Math.sin((u * Math.PI) / 2), 0.7) * (u > 0.94 ? Math.cos(((u - 0.94) / 0.06) * Math.PI * 0.5) * 0.8 + 0.2 : 1), u * 0.13]); }
  pts[0][0] = 0.0005; pts.push([0.0, 0.13]);
  const body = new THREE.Mesh(lathe(pts, 32), phys({ color: 0xe8701b, roughness: 0.55, bumpMap: noiseTex(17, 128, 0.7, 1.0, 6), bumpScale: 0.6 }));
  g.add(body);
  const leaf = phys({ color: 0x3f8a2a, roughness: 0.6 });
  for (let k = 0; k < 4; k++) { const l = new THREE.Mesh(new THREE.ConeGeometry(0.004, 0.06, 6), leaf); l.position.set(0, 0.155, 0); l.rotation.set((k - 1.5) * 0.25, 0, (k % 2 ? 1 : -1) * 0.18); g.add(l); }
  g.rotation.z = Math.PI / 2;   // lying down, tip to +x
  const o = new THREE.Group(); o.add(g); g.position.set(0.075, 0.018, 0); return finish(o);
}
function makeFish() {   // a whole fish: a silver body, a forked tail, an eye
  const g = new THREE.Group();
  const scales = canvasTex(512, 256, (x, w, h) => { const gr = x.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#3e5566'); gr.addColorStop(0.45, '#9fb1bb'); gr.addColorStop(1, '#e6ecef'); x.fillStyle = gr; x.fillRect(0, 0, w, h);
    x.strokeStyle = 'rgba(255,255,255,0.18)'; x.lineWidth = 2; for (let j = 0; j < 12; j++) for (let i = 0; i < 26; i++) { x.beginPath(); x.arc(i * 20 + (j % 2) * 10, j * 22, 11, 0.2, Math.PI - 0.2); x.stroke(); } });
  const skin = phys({ map: scales, roughness: 0.32, metalness: 0.35, clearcoat: 0.7, clearcoatRoughness: 0.15 });
  const body = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 24), skin); body.scale.set(0.072, 0.026, 0.013); body.rotation.x = Math.PI / 2; g.add(body);
  const tailShape = new THREE.Shape(); tailShape.moveTo(0, 0); tailShape.lineTo(0.042, 0.026); tailShape.quadraticCurveTo(0.03, 0, 0.042, -0.026); tailShape.lineTo(0, 0);
  const tail = new THREE.Mesh(new THREE.ShapeGeometry(tailShape, 8), phys({ color: 0x8a9ca6, roughness: 0.4, metalness: 0.3, side: THREE.DoubleSide }));
  tail.position.x = 0.062; tail.rotation.x = -Math.PI / 2; g.add(tail);
  const eye = new THREE.Mesh(new THREE.SphereGeometry(0.0045, 16, 12), phys({ color: 0x0b0b0b, roughness: 0.1, clearcoat: 1 })); eye.position.set(-0.05, 0.0098, 0.004); eye.scale.set(1, 0.5, 1); g.add(eye);
  const eye2 = eye.clone(); eye2.position.y = -0.0098; g.add(eye2);
  g.position.y = 0.014; const o = new THREE.Group(); o.add(g); return finish(o);
}
function makeDrumstick() {   // a roast chicken leg
  const g = new THREE.Group();
  const meat = new THREE.Mesh(lathe([[0.0, 0.0], [0.014, 0.004], [0.024, 0.02], [0.028, 0.04], [0.024, 0.058], [0.013, 0.074], [0.008, 0.082], [0.0, 0.084]], 32),
    phys({ color: 0x9a5426, roughness: 0.45, clearcoat: 0.6, clearcoatRoughness: 0.3, bumpMap: noiseTex(29, 128, 0.7, 1.0, 5), bumpScale: 0.8 }));
  g.add(meat);
  const bone = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.0045, 0.03, 12), phys({ color: 0xece4d4, roughness: 0.5 })); bone.position.y = 0.094; g.add(bone);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.0065, 16, 12), phys({ color: 0xece4d4, roughness: 0.5 })); knob.position.y = 0.11; knob.scale.set(1.2, 0.8, 1); g.add(knob);
  g.rotation.z = Math.PI / 2; g.position.set(0.055, 0.028, 0);
  const o = new THREE.Group(); o.add(g); return finish(o);
}

// ------------------------------------------------------------------ the factory: five jars of parts of foods and additives
const JAR_KINDS = [
  { word: 'STARCH', col: 0xf2efe7, rough: 0.95, pcol: 0xf4f1ea },
  { word: 'SUGAR', col: 0xfbfbfb, rough: 0.3, pcol: 0xffffff, sparkle: true },
  { word: 'OIL', col: 0xe3b02a, rough: 0.05, pcol: 0xf0c040, liquid: true },
  { word: 'PROTEIN ISOLATE', col: 0xe4d4b0, rough: 0.9, pcol: 0xe8d8b6 },
  { word: 'ADDITIVES', col: 0x2b2f3a, rough: 0.4, pcol: 0xff4d6d, beads: true },
];
function makeJar(K) {
  const g = new THREE.Group(), r = 0.036, h = 0.12;
  const glass = phys({ color: 0xe8f2f6, roughness: 0.04, clearcoat: 1, clearcoatRoughness: 0.03, transparent: true, opacity: 0.22, depthWrite: false, side: THREE.DoubleSide });
  const shell = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 48, 1, true), glass); shell.position.y = h / 2; g.add(shell);
  const base = new THREE.Mesh(new THREE.CircleGeometry(r, 48), glass); base.rotation.x = -Math.PI / 2; base.position.y = 0.001; g.add(base);
  const fillH = 0.078;
  const content = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.94, r * 0.94, fillH, 48),
    K.liquid ? phys({ color: K.col, roughness: 0.04, transmission: 0, transparent: true, opacity: 0.82, clearcoat: 1 }) : phys({ color: K.col, roughness: K.rough, bumpMap: noiseTex(3 + K.word.length, 128, 0.6, 1.0, 8), bumpScale: K.sparkle ? 0.3 : 1.2, sheen: K.sparkle ? 0.8 : 0.1, sheenColor: new THREE.Color(0xffffff) }));
  content.position.y = fillH / 2 + 0.002; g.add(content);
  if (K.beads) { const cols = [0xff4d6d, 0x3fa7ff, 0x46d27a, 0xffd23f, 0xb06bff], rnd = mulberry(7);
    for (let k = 0; k < 26; k++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.0075, 12, 10), phys({ color: cols[k % 5], roughness: 0.25, clearcoat: 0.9 })); const a = rnd() * 6.28, rr = rnd() * r * 0.75; b.position.set(Math.cos(a) * rr, fillH + 0.002 + rnd() * 0.012, Math.sin(a) * rr); g.add(b); } }
  const lid = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.06, r * 1.06, 0.014, 48), phys({ color: 0xbfc3c8, metalness: 1, roughness: 0.3 })); lid.position.y = h + 0.007; g.add(lid);
  const lab = canvasTex(1024, 256, (x, w, hh) => { x.fillStyle = '#f6f4ee'; x.fillRect(0, 0, w, hh); x.fillStyle = '#16181c'; x.fillRect(0, hh - 22, w, 22);
    const ws = K.word.split(' ');
    if (ws.length > 1) ws.forEach((wd, i) => txt(x, wd, w / 2, hh * (0.29 + 0.35 * i), { font: '800 72px Archivo', color: '#16181c', track: 6, maxW: w * 0.3 }));
    else txt(x, K.word, w / 2, hh * 0.46, { font: '800 84px Archivo', color: '#16181c', track: 7, maxW: w * 0.3 }); });   // within the front 110 degrees of the jar
  const band = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.004, r * 1.004, 0.032, 48, 1, true), phys({ map: lab, roughness: 0.6 })); band.rotation.y = Math.PI; band.position.y = 0.05; g.add(band);
  finish(g); shell.castShadow = false; base.castShadow = false;
  return { g, lid };
}
function makePacket(tex, w, h, d, edge) {   // a pillow pack: the middle bulges, sealed fins top and bottom
  const geo = new THREE.BoxGeometry(w, h, d, 16, 20, 1), P = geo.attributes.position;
  for (let i = 0; i < P.count; i++) { const x = P.getX(i) / (w / 2), y = P.getY(i) / (h / 2), z = P.getZ(i); const f = (1 - Math.pow(Math.abs(x), 6)) * (1 - Math.pow(Math.abs(y), 4)); P.setZ(i, z * (0.18 + 0.82 * f)); }
  geo.computeVertexNormals();
  const side = phys({ color: edge, roughness: 0.38, metalness: 0.25, clearcoat: 0.3, clearcoatRoughness: 0.3 }), front = phys({ map: tex, roughness: 0.34, metalness: 0.2, clearcoat: 0.3, clearcoatRoughness: 0.3 });
  const body = new THREE.Mesh(geo, [side, side, side, side, front, front]); body.position.y = h / 2;
  const g = new THREE.Group(); g.add(body);
  for (const s of [-1, 1]) { const fin = new THREE.Mesh(new THREE.BoxGeometry(w * 1.0, 0.012, 0.004), side); fin.position.y = h / 2 + s * (h / 2 + 0.004); g.add(fin); }
  g.children.forEach((c) => { c.position.y += 0.01; });
  return finish(g);
}
const puffsTex = () => canvasTex(600, 800, (x, w, h) => {
  x.fillStyle = '#ff8a1e'; x.fillRect(0, 0, w, h); x.fillStyle = '#ffd23f'; x.fillRect(0, h * 0.62, w, h * 0.38);
  txt(x, 'CHEESY', w / 2, h * 0.17, { font: '900 120px Archivo', color: '#fff', track: 4, maxW: w * 0.86 });
  txt(x, 'PUFFS', w / 2, h * 0.33, { font: '900 150px Archivo', color: '#7a1f00', track: 4, maxW: w * 0.86 });
  for (let k = 0; k < 9; k++) { x.fillStyle = k % 2 ? '#ffb23a' : '#ffc95a'; x.beginPath(); x.ellipse(w * (0.25 + 0.06 * k), h * (0.75 + 0.05 * Math.sin(k * 2)), 34, 20, k, 0, Math.PI * 2); x.fill(); }
  txt(x, 'EXTRA CHEESE FLAVOUR', w / 2, h * 0.93, { font: '700 36px Archivo', color: '#7a1f00', track: 3, maxW: w * 0.86 });
});
const crispsTex = () => canvasTex(600, 800, (x, w, h) => {
  x.fillStyle = '#f2cf2e'; x.fillRect(0, 0, w, h); x.fillStyle = '#1f4fa8'; x.fillRect(0, 0, w, h * 0.12);
  txt(x, 'POTATO', w / 2, h * 0.25, { font: '900 132px Archivo', color: '#1f4fa8', track: 4, maxW: w * 0.86 });
  txt(x, 'FLAVOUR', w / 2, h * 0.38, { font: '900 84px Archivo', color: '#c4312a', track: 6, maxW: w * 0.86 });
  txt(x, 'CRISPS', w / 2, h * 0.49, { font: '800 64px Archivo', color: '#1f4fa8', track: 12, maxW: w * 0.86 });
  x.fillStyle = '#a7743c'; x.beginPath(); x.ellipse(w * 0.5, h * 0.72, w * 0.2, h * 0.1, -0.2, 0, Math.PI * 2); x.fill();
  x.fillStyle = '#7e5326'; for (const [a, b] of [[0.45, 0.68], [0.55, 0.75], [0.5, 0.79]]) { x.beginPath(); x.arc(w * a, h * b, 6, 0, Math.PI * 2); x.fill(); }
  txt(x, 'MADE WITH POTATO FLAKES', w / 2, h * 0.93, { font: '700 32px Archivo', color: '#1f4fa8', track: 3, maxW: w * 0.86 });
});
function makeCan() {
  const g = new THREE.Group(), r = 0.033, h = 0.115;
  const tex = canvasTex(1024, 512, (x, w, hh) => {
    x.fillStyle = '#e0142c'; x.fillRect(0, 0, w, hh);
    x.fillStyle = '#ffffff'; x.beginPath(); x.moveTo(0, hh * 0.62); for (let i = 0; i <= 40; i++) x.lineTo((i / 40) * w, hh * (0.62 + 0.06 * Math.sin(i * 0.5))); x.lineTo(w, hh); x.lineTo(0, hh); x.fill();
    txt(x, 'FIZZ', w * 0.25, hh * 0.38, { font: '900 190px Archivo', color: '#fff', track: 8, maxW: w * 0.3 });
    txt(x, 'FIZZ', w * 0.75, hh * 0.38, { font: '900 190px Archivo', color: '#fff', track: 8, maxW: w * 0.3 });
    txt(x, 'ORIGINAL · 330 ml', w * 0.25, hh * 0.84, { font: '700 40px Archivo', color: '#e0142c', track: 4, maxW: w * 0.3 });
  });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h * 0.86, 64), [phys({ map: tex, roughness: 0.25, metalness: 0.55, clearcoat: 0.8 }), phys({ color: 0xc9cdd2, metalness: 1, roughness: 0.3 }), phys({ color: 0xc9cdd2, metalness: 1, roughness: 0.3 })]);
  body.position.y = h * 0.5; body.rotation.y = -Math.PI / 2; g.add(body);   // a FIZZ (drawn a quarter of the way round) faces the front
  const alu = phys({ color: 0xd4d8dc, metalness: 1, roughness: 0.28 });
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.84, r, h * 0.07, 64), alu); neck.position.y = h * 0.965; g.add(neck);
  const foot = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 0.82, h * 0.07, 64), alu); foot.position.y = h * 0.035; g.add(foot);
  const tab = new THREE.Mesh(new RoundedBoxGeometry(0.012, 0.0015, 0.02, 2, 0.0006), alu); tab.position.set(0, h + 0.0008, 0.004); g.add(tab);
  return finish(g);
}

// ------------------------------------------------------------------ the hospital study: twenty pawns, two trays
function makePawn() {
  return finish(new THREE.Mesh(lathe([[0.0, 0.0], [0.0125, 0.0], [0.0125, 0.003], [0.0095, 0.006], [0.0065, 0.016], [0.0042, 0.028], [0.0068, 0.031], [0.004, 0.033], [0.0062, 0.039], [0.0068, 0.044], [0.005, 0.0495], [0.0, 0.051]], 32),
    phys({ color: 0xece9e2, roughness: 0.35, clearcoat: 0.6, clearcoatRoughness: 0.2 })));
}
function makeTray() {
  const g = new THREE.Group();
  const t = new THREE.Mesh(new RoundedBoxGeometry(0.24, 0.012, 0.16, 3, 0.005), phys({ color: 0x353a42, roughness: 0.45, clearcoat: 0.4 })); t.position.y = 0.006; g.add(t);
  return finish(g);
}
function makeReadyMeal() {
  const g = new THREE.Group();
  const tub = new THREE.Mesh(new RoundedBoxGeometry(0.1, 0.03, 0.07, 3, 0.006), phys({ color: 0x141416, roughness: 0.35, clearcoat: 0.5 })); tub.position.y = 0.015; g.add(tub);
  const lab = canvasTex(800, 560, (x, w, h) => { x.fillStyle = '#f4f2ec'; x.fillRect(0, 0, w, h); x.fillStyle = '#2a7a3a'; x.fillRect(0, 0, w, h * 0.28);
    txt(x, 'READY MEAL', w / 2, h * 0.15, { font: '900 96px Archivo', color: '#fff', track: 6, maxW: w * 0.9 }); txt(x, 'LASAGNE', w / 2, h * 0.5, { font: '900 120px Archivo', color: '#2a7a3a', track: 6, maxW: w * 0.9 });
    txt(x, 'MICROWAVE 4 MIN', w / 2, h * 0.78, { font: '700 54px Archivo', color: '#444', track: 4, maxW: w * 0.9 }); });
  const film = new THREE.Mesh(new THREE.PlaneGeometry(0.094, 0.064), phys({ map: lab, roughness: 0.3, clearcoat: 0.8 })); film.rotation.x = -Math.PI / 2; film.position.y = 0.0305; g.add(film);
  return finish(g);
}
function makePotato() {
  const geo = new THREE.SphereGeometry(1, 40, 28), P = geo.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < P.count; i++) { v.fromBufferAttribute(P, i); const n = 1 + 0.06 * Math.sin(v.x * 5 + 1) * Math.sin(v.y * 4) + 0.04 * Math.sin(v.z * 7 + v.x * 3); v.multiplyScalar(n); P.setXYZ(i, v.x * 0.042, v.y * 0.028, v.z * 0.03); }
  geo.computeVertexNormals();
  const skin = canvasTex(512, 256, (x, w, h) => { x.fillStyle = '#b07a44'; x.fillRect(0, 0, w, h); for (let k = 0; k < 500; k++) { x.fillStyle = `rgba(${hash(k) > 0.5 ? '120,80,40' : '210,170,120'},${0.15 + 0.2 * hash(k * 2)})`; x.fillRect(hash(k * 3) * w, hash(k * 5) * h, 3 + 4 * hash(k), 2 + 3 * hash(k * 7)); }
    x.fillStyle = '#6e4a24'; for (let k = 0; k < 7; k++) { x.beginPath(); x.arc(hash(k * 11) * w, hash(k * 13) * h, 5, 0, Math.PI * 2); x.fill(); } });
  const m = new THREE.Mesh(geo, phys({ map: skin, roughness: 0.85, bumpMap: noiseTex(31, 128, 0.7, 1.0, 4), bumpScale: 1.0 })); m.position.y = 0.027;
  const g = new THREE.Group(); g.add(m); return finish(g);
}
function makeApple() {
  const pts = []; for (let i = 0; i <= 24; i++) { const th = (i / 24) * Math.PI; pts.push([Math.max(0.0005, 0.036 * Math.sin(th) * (1 - 0.1 * Math.cos(th)) - (i < 3 || i > 21 ? 0.006 : 0)), 0.035 - 0.035 * Math.cos(th)]); }
  const g = new THREE.Group();
  const skin = canvasTex(512, 256, (x, w, h) => { const gr = x.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#9e1b1b'); gr.addColorStop(0.6, '#c8322a'); gr.addColorStop(1, '#e0a040'); x.fillStyle = gr; x.fillRect(0, 0, w, h);
    for (let k = 0; k < 160; k++) { x.strokeStyle = `rgba(255,220,160,${0.08 + 0.1 * hash(k)})`; x.lineWidth = 2; const px = hash(k * 3) * w; x.beginPath(); x.moveTo(px, h * hash(k * 5)); x.lineTo(px + 3, h * hash(k * 5) + 30); x.stroke(); } });
  g.add(new THREE.Mesh(lathe(pts, 40), phys({ map: skin, roughness: 0.32, clearcoat: 0.8, clearcoatRoughness: 0.2 })));
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.0018, 0.0022, 0.018, 8), phys({ color: 0x4a3018, roughness: 0.8 })); stem.position.y = 0.072; stem.rotation.z = 0.2; g.add(stem);
  return finish(g);
}
function makeEgg() {
  const pts = []; for (let i = 0; i <= 28; i++) { const th = (i / 28) * Math.PI; pts.push([Math.max(1e-4, 0.0195 * Math.sin(th) * (1 + 0.1 * Math.cos(th))), -0.026 * Math.cos(th)]); }
  const e = new THREE.Mesh(lathe(pts, 40), phys({ color: 0xd8b48c, roughness: 0.62, bumpMap: noiseTex(5, 256, 0.9, 1.0, 3), bumpScale: 0.4, sheen: 0.2, sheenColor: new THREE.Color(0xfff0dc) }));
  e.rotation.z = Math.PI / 2; e.position.y = 0.0195; const g = new THREE.Group(); g.add(e); return finish(g);
}
function makeFillet() {
  const tex = canvasTex(512, 256, (x, w, h) => { x.fillStyle = '#ee8a6c'; x.fillRect(0, 0, w, h); for (let k = 0; k < 9; k++) { x.strokeStyle = 'rgba(255,226,212,0.85)'; x.lineWidth = 7 + 4 * hash(k); x.beginPath(); const x0 = (k / 8) * w * 1.1 - 40; x.moveTo(x0, -10); x.quadraticCurveTo(x0 + 40, h * 0.5, x0 - 10, h + 10); x.stroke(); } });
  const f = new THREE.Mesh(new RoundedBoxGeometry(0.09, 0.018, 0.045, 3, 0.007), phys({ map: tex, roughness: 0.45, clearcoat: 0.35, clearcoatRoughness: 0.3, sheen: 0.3, sheenColor: new THREE.Color(0xffc8b4) }));
  f.position.y = 0.009; const g = new THREE.Group(); g.add(f); return finish(g);
}
function makeSausages() {   // processed meat: a pack of three
  const g = new THREE.Group();
  const tray = new THREE.Mesh(new RoundedBoxGeometry(0.13, 0.012, 0.075, 2, 0.004), phys({ color: 0xf2f2f0, roughness: 0.4 })); tray.position.y = 0.006; g.add(tray);
  const skin = phys({ color: 0xc8735e, roughness: 0.35, clearcoat: 0.7, clearcoatRoughness: 0.2 });
  for (let k = 0; k < 3; k++) { const s = new THREE.Mesh(new THREE.CapsuleGeometry(0.0105, 0.095, 8, 20), skin); s.rotation.z = Math.PI / 2; s.position.set(0, 0.022, (k - 1) * 0.022); g.add(s); }
  const film = new THREE.Mesh(new RoundedBoxGeometry(0.132, 0.03, 0.077, 2, 0.006), phys({ color: 0xffffff, roughness: 0.05, clearcoat: 1, transparent: true, opacity: 0.18, depthWrite: false })); film.position.y = 0.017; g.add(film);
  const lab = canvasTex(640, 300, (x, w, h) => { x.fillStyle = '#1d3f8f'; x.fillRect(0, 0, w, h); txt(x, 'FRANKS', w / 2, h * 0.42, { font: '900 130px Archivo', color: '#fff', track: 6, maxW: w * 0.9 }); txt(x, 'SMOKED · 3 PACK', w / 2, h * 0.8, { font: '700 46px Archivo', color: '#ffd23f', track: 4 }); });
  const sticker = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 0.028), phys({ map: lab, roughness: 0.4 })); sticker.rotation.x = -Math.PI / 2; sticker.position.set(0.025, 0.0325, 0.012); sticker.rotation.z = 0.08; g.add(sticker);
  finish(g); film.castShadow = false; return g;
}
function makeCrate() {   // an open wooden crate, stencilled EXCEPTION
  const g = new THREE.Group(), w = 0.2, h = 0.09, d = 0.15, t = 0.008;
  const wood = phys({ color: 0xc89b62, roughness: 0.8, bumpMap: noiseTex(43, 256, 0.8, 1.0, 6), bumpScale: 0.6 });
  const b = (sx, sy, sz, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), wood); m.position.set(x, y, z); g.add(m); };
  b(w, t, d, 0, t / 2, 0); b(w, h, t, 0, h / 2, d / 2 - t / 2); b(w, h, t, 0, h / 2, -d / 2 + t / 2); b(t, h, d, w / 2 - t / 2, h / 2, 0); b(t, h, d, -w / 2 + t / 2, h / 2, 0);
  const sten = canvasTex(1024, 300, (x, cw, ch) => { x.clearRect(0, 0, cw, ch); txt(x, 'EXCEPTION', cw / 2, ch / 2 + 6, { font: '900 170px Archivo', color: 'rgba(28,24,20,0.92)', track: 20, maxW: cw * 0.92 });
    x.globalCompositeOperation = 'destination-out'; for (let k = 0; k < 9; k++) x.fillRect(cw * (0.08 + k * 0.105), 0, 7, ch); });
  const label = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.92, h * 0.5), phys({ map: sten, transparent: true, roughness: 0.8, depthWrite: false }));
  label.position.set(0, h * 0.5, d / 2 + 0.0008); g.add(label);
  finish(g); label.castShadow = false; return { g, label, mat: label.material, h };
}
function makePlinth(word) {   // a small white museum plinth with a brass plaque
  const g = new THREE.Group(), s = 0.115, h = 0.11;
  const m = new THREE.Mesh(new RoundedBoxGeometry(s, h, s, 3, 0.003), phys({ color: 0xf1efe9, roughness: 0.55, clearcoat: 0.2 })); m.position.y = h / 2; g.add(m);
  const plaqueTex = canvasTex(768, 256, (x, w, hh) => { const gr = x.createLinearGradient(0, 0, w, hh); gr.addColorStop(0, '#b8924a'); gr.addColorStop(0.5, '#e6c983'); gr.addColorStop(1, '#a8833f'); x.fillStyle = gr; x.fillRect(0, 0, w, hh);
    x.strokeStyle = 'rgba(70,50,20,0.6)'; x.lineWidth = 8; x.strokeRect(14, 14, w - 28, hh - 28);
    txt(x, word, w / 2, hh / 2 + 6, { font: '700 120px "Instrument Serif"', color: '#3b2a10', track: 16, maxW: w * 0.84 }); });
  const plaque = new THREE.Mesh(new THREE.PlaneGeometry(0.096, 0.032), phys({ map: plaqueTex, metalness: 0.7, roughness: 0.3, clearcoat: 0.6 })); plaque.position.set(0, h * 0.55, s / 2 + 0.0008); g.add(plaque);
  finish(g); return { g, top: h };
}
function makePills() {   // a white pill bottle, label YOUR MEDICINE (no product named)
  const g = new THREE.Group(), r = 0.024, h = 0.07;
  const lab = canvasTex(1024, 300, (x, w, hh) => { x.fillStyle = '#ffffff'; x.fillRect(0, 0, w, hh); x.fillStyle = '#1d5bd6'; x.fillRect(0, 0, w, hh * 0.26);
    txt(x, 'YOUR MEDICINE', w * 0.5, hh * 0.6, { font: '900 80px Archivo', color: '#11131a', track: 6, maxW: w * 0.42 });
    txt(x, 'AS PRESCRIBED', w * 0.5, hh * 0.85, { font: '700 44px Archivo', color: '#1d5bd6', track: 6, maxW: w * 0.4 }); });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 48), [phys({ map: lab, roughness: 0.45, clearcoat: 0.4 }), phys({ color: 0xf6f6f4, roughness: 0.45 }), phys({ color: 0xf6f6f4, roughness: 0.45 })]);
  body.rotation.y = Math.PI; body.position.y = h / 2; g.add(body);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.06, r * 1.06, 0.022, 48), phys({ color: 0xf3f3f1, roughness: 0.5, bumpMap: noiseTex(9, 64, 0.8, 1.0, 30), bumpScale: 0.6 })); cap.position.y = h + 0.011; g.add(cap);
  return finish(g);
}
function makePlate() {   // a white plate of real food
  const g = new THREE.Group();
  g.add(new THREE.Mesh(lathe([[0.0, 0.0], [0.06, 0.0], [0.064, 0.004], [0.088, 0.008], [0.1, 0.016], [0.103, 0.018], [0.1, 0.019], [0.086, 0.012], [0.062, 0.008], [0.0, 0.008]], 96), phys({ color: 0xf5f3ee, roughness: 0.2, clearcoat: 0.8, clearcoatRoughness: 0.1 })));
  const fil = makeFillet(); fil.position.set(-0.02, 0.008, -0.012); fil.rotation.y = 0.4; g.add(fil);
  const leaf = phys({ color: 0x3f8f3a, roughness: 0.5, clearcoat: 0.4 });
  for (let k = 0; k < 6; k++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.011, 12, 10), leaf); b.position.set(0.035 + (k % 3) * 0.013, 0.016, 0.02 + Math.floor(k / 3) * 0.013); b.scale.set(1, 0.8, 1); g.add(b); }
  const pot = phys({ color: 0xe8c77e, roughness: 0.6 });
  for (let k = 0; k < 3; k++) { const p = new THREE.Mesh(new THREE.SphereGeometry(0.014, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2), pot); p.position.set(-0.04 + k * 0.022, 0.008, 0.04); p.scale.set(1, 0.8, 1); g.add(p); }
  return finish(g);
}
function makeDisc() { return finish(new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.012, 64), phys({ color: 0xd9dbe0, roughness: 0.35, metalness: 0.6, clearcoat: 0.5 }))); }
function makeBoard() {
  const tex = canvasTex(1024, 640, (x, w, h) => { x.fillStyle = '#c99a63'; x.fillRect(0, 0, w, h); for (let k = 0; k < 80; k++) { const y = hash(k) * h; x.strokeStyle = `rgba(110,70,30,${0.06 + 0.1 * hash(k * 3)})`; x.lineWidth = 1 + 3 * hash(k * 5); x.beginPath(); x.moveTo(0, y); x.bezierCurveTo(w * 0.3, y + 6, w * 0.6, y - 6, w, y + 2); x.stroke(); } });
  const m = new THREE.Mesh(new RoundedBoxGeometry(0.33, 0.02, 0.2, 3, 0.008), phys({ map: tex, roughness: 0.6, clearcoat: 0.3 })); m.position.y = 0.01;
  const g = new THREE.Group(); g.add(m); return finish(g);
}

// ------------------------------------------------------------------ the bathroom scale (from film 5)
function makeBathScale() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new RoundedBoxGeometry(SCALE.w, 0.018, SCALE.d, 4, 0.008), phys({ color: 0x15161a, roughness: 0.45, metalness: 0.3 })); body.position.y = 0.011; g.add(body);
  const glass = new THREE.Mesh(new RoundedBoxGeometry(SCALE.w + 0.002, 0.007, SCALE.d + 0.002, 4, 0.0034), phys({ color: 0x0b0c0f, roughness: 0.06, clearcoat: 1, clearcoatRoughness: 0.04, specularIntensity: 0.8 }));
  glass.position.y = SCALE.h - 0.0035; g.add(glass);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const f = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.004, 24), phys({ color: 0x0c0c0e, roughness: 0.8 })); f.position.set(sx * (SCALE.w / 2 - 0.03), 0.002, sz * (SCALE.d / 2 - 0.03)); g.add(f); }
  const c = document.createElement('canvas'); c.width = 512; c.height = 176;
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const disp = new THREE.Mesh(new THREE.PlaneGeometry(0.086, 0.0296), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false, transparent: true }));
  disp.rotation.x = -Math.PI / 2; disp.position.set(0.07, SCALE.h + 0.0002, SCALE.d / 2 - 0.024); g.add(disp);
  finish(g); disp.castShadow = false;
  return { g, c, tex, disp, key: '' };
}
function drawBath(B, text, glow) {
  const key = text + '|' + glow.toFixed(2); if (key === B.key) return; B.key = key;
  const x = B.c.getContext('2d'), w = B.c.width, h = B.c.height;
  x.clearRect(0, 0, w, h); x.fillStyle = '#050506'; x.beginPath(); x.roundRect(0, 0, w, h, 18); x.fill();
  if (glow <= 0.001) { B.tex.needsUpdate = true; return; }
  const on = `rgba(255,${Math.round(70 + 40 * glow)},${Math.round(60 + 30 * glow)},${glow})`, off = `rgba(90,24,26,${0.16 * glow})`;
  seg7(x, text, { x0: 52, y0: 30, w: 66, h: 114, th: 15, gap: 3, on, off, cells: 3, slant: 0.1 });
  x.globalAlpha = glow; txt(x, 'kg', 452, 128, { font: '600 46px Archivo', color: '#ff5a4a', track: 2 }); x.globalAlpha = 1;
  B.tex.needsUpdate = true;
}

// ------------------------------------------------------------------ the dials (as in films 4 to 6), standing on the counter at 55%
function buildDials(scene) {
  const out = [];
  const alu = phys({ color: 0xcdcac4, metalness: 1, roughness: 0.3, clearcoat: 0.4, clearcoatRoughness: 0.3 }), dark = phys({ color: 0x141518, roughness: 0.4, clearcoat: 0.6 });
  for (let i = 0; i < 2; i++) {
    const g = new THREE.Group(), knob = new THREE.Group(); g.add(knob);
    const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.004, 96), dark); plate.position.y = 0.002; g.add(plate);
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.092, 0.097, 0.06, 128), alu); body.position.y = 0.034; knob.add(body);
    const face = new THREE.Mesh(new THREE.CylinderGeometry(0.086, 0.086, 0.002, 128), phys({ color: 0x9a9893, metalness: 1, roughness: 0.38, clearcoat: 0.5, clearcoatRoughness: 0.3 })); face.position.y = 0.065; knob.add(face);
    const ind = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.002, 0.05), glowMat(ORANGE)); ind.position.set(0, 0.0665, -0.05); knob.add(ind);
    const tickMat = new THREE.MeshBasicMaterial({ color: 0x8a8d93 });
    for (let k = 0; k <= 20; k++) { const a = -Math.PI * 0.75 + (k / 20) * Math.PI * 1.5, big = k % 5 === 0, len = big ? 0.022 : 0.012; const tk = new THREE.Mesh(new THREE.BoxGeometry(big ? 0.003 : 0.002, 0.001, len), tickMat); const r = 0.112 + len / 2; tk.position.set(Math.sin(a) * r, 0.0045, -Math.cos(a) * r); tk.rotation.y = -a; g.add(tk); }
    const setMat = glowMat(ORANGE); setMat.transparent = true; setMat.opacity = 0; const set = new THREE.Mesh(new THREE.BoxGeometry(0.005, 0.0015, 0.03), setMat); g.add(set);
    g.scale.setScalar(DIAL_S); finish(g); scene.add(g);
    out.push({ g, knob, set, setMat, face, angle: (v) => -Math.PI * 0.75 + v * Math.PI * 1.5 });
  }
  return out;
}

// ------------------------------------------------------------------ the particles: parts of foods and additives, flying into the packet and the can
const N_PER = 22, N_PART = N_PER * 5;
const PART_T0 = (j) => (j < 4 ? T.parts + 0.05 + j * 0.16 : T.additives + 0.05);
function partAt(i, t, out) {   // -> { p, s, c } or null
  const j = Math.floor(i / N_PER), k = i % N_PER, t0 = PART_T0(j) + k * 0.034, dur = 0.66;
  const u = (t - t0) / dur; if (u <= 0 || u >= 1) return null;
  const toPacket = (j + k) % 2 === 0, A = JARS[j], B = toPacket ? PACKET : CAN;
  const ay = CT.y + 0.135, by = CT.y + (toPacket ? 0.1 : 0.08);
  const e = u, x = lerp(A.x, B.x, e) + (hash(i * 3.1) - 0.5) * 0.012, z = lerp(A.z, B.z, e) + (hash(i * 5.7) - 0.5) * 0.012, y = lerp(ay, by, e) + 0.12 * Math.sin(Math.PI * e);
  out.p.set(x, y, z); out.s = 0.0085 * Math.min(1, u * 6) * (1 - ss(0.85, 1, u)); out.j = j; return out;
}

// ------------------------------------------------------------------ the body: standing on the scale, arms at rest
const ARM_HANG = { dir: [0.03, -1, 0.02], twist: 0, elbow: 0.12, retract: 0, elevate: 0 };
function applyBody(t) {
  const R = W.rig;
  R.pelvis.position.copy(R.P0); R.pelvis.rotation.set(0, 0, 0);
  bendSpine(R.seg, { tho: 0.02, cer: 0.03, twist: 0.06 * ss(T.they - 0.4, T.same2, t) * (1 - ss(T.willpower2, T.in2, t)) });   // a small turn to the meter: same willpower
  for (const Side of SIDES) { const G = R.legs[Side]; G.hip.quaternion.identity(); G.knee.quaternion.identity(); G.ankle.quaternion.identity(); }
  for (const Side of SIDES) { poseArm(R.arms[Side], ARM_HANG); setWrist(W.hand[Side].wr, {}); W.hand[Side].curl(RELAX); }
  clearArms(R);   // no arm through the trunk or the thighs
  R.root.updateMatrixWorld(true);
}

// ------------------------------------------------------------------ build
async function build(S, cfg) {
  const scene = S.scene;
  S.fog.near = 4; S.fog.far = 14;
  S.table.scale.set(3, 3, 1); S.tableMat.clearcoat = 0.06; S.tableMat.specularIntensity = 0.3;
  for (const m of [S.tableMat.map, S.tableMat.roughnessMap]) if (m) { m.wrapS = m.wrapT = THREE.RepeatWrapping; m.repeat.multiplyScalar(3); }
  // ---- the skeleton on the scale, hands a little closed
  const meshes = await loadAnatomy(skeletonKind());
  W.rig = buildRig(meshes); scene.add(W.rig.root);
  for (const m of meshes) { m.castShadow = true; m.receiveShadow = true; m.layers.enable(1); }
  const R = W.rig;
  const ground = Math.min(R.legs.Right.ground, R.legs.Left.ground);
  R.root.position.y = SCALE.h - ground;
  const heelZ = Math.min(R.legs.Right.heel.z, R.legs.Left.heel.z), toeZ = Math.max(R.legs.Right.toeZ, R.legs.Left.toeZ);
  W.scaleZ = (heelZ + toeZ) / 2 - 0.005;
  W.hand = {}; for (const Side of SIDES) { const Wr = makeWrist(R, Side); W.hand[Side] = rigHand(R, Side, Wr); W.hand[Side].wr = Wr; }
  // ---- the factory stamp: down the front of the left shin bone (seen on the way down to the scale)
  { const tib = R.byName.get('Left tibia');
    W.stampSpot = stampLine(tib, { a: [0.15, 0.09, 0.26], b: [0.15, -0.07, 0.26], dir: [-0.5, 0, -0.87], top: [1, 0, 0] });
    if (W.stampSpot) W.stamp = stamp(tib, { canvas: labelCanvas('HUMAN FACTORY SETTINGS'), center: W.stampSpot.center, normal: W.stampSpot.normal, up: W.stampSpot.up, width: 0.13, depth: 0.03, opacity: 0.6 }); }
  W.bath = makeBathScale(); W.bath.g.position.set(0, 0, W.scaleZ); scene.add(W.bath.g);
  // ---- the counter and the wall
  W.counter = makeCounter(); scene.add(W.counter.g);
  W.auditSolids = [['bath scale', W.bath.g], ['counter', W.counter.body]];
  // ---- the meter on the wall
  W.gauge = makeGauge(); W.gauge.g.position.copy(GAUGE); scene.add(W.gauge.g);
  // ---- breakfast, lunch, dinner
  W.cereal = makeCereal(); W.cereal.position.set(0.66, CT.y, 0.03); W.cereal.rotation.y = 0.12; scene.add(W.cereal);
  W.bar = makeBar(); W.bar.position.set(0.85, CT.y, 0.15); W.bar.rotation.y = -0.18; scene.add(W.bar);
  W.bag = makeBag(); W.bag.position.set(1.02, CT.y, 0.02); W.bag.rotation.y = -0.2; scene.add(W.bag);
  // ---- the pot; what grew, swam and walked
  W.pot = makePot(); W.pot.g.position.copy(POT); scene.add(W.pot.g);
  W.drops = [makeCarrot(), makeFish(), makeDrumstick()].map((o, i) => { scene.add(o); o.visible = false; return o; });
  // ---- the jars, the packet and the can they make
  W.jars = JARS.map((p, j) => { const J = makeJar(JAR_KINDS[j]); J.g.position.copy(p); J.g.visible = false; scene.add(J.g); return J; });
  W.packet = makePacket(puffsTex(), 0.12, 0.16, 0.05, 0xff8a1e); W.packet.position.copy(PACKET); W.packet.rotation.y = -0.1; W.packet.visible = false; scene.add(W.packet);
  W.can = makeCan(); W.can.position.copy(CAN); W.can.rotation.y = 0.15; W.can.visible = false; scene.add(W.can);
  { const geo = new THREE.SphereGeometry(1, 10, 8), mat = new THREE.MeshPhysicalMaterial({ roughness: 0.4, clearcoat: 0.6 });
    W.parts = new THREE.InstancedMesh(geo, mat, N_PART); W.parts.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(N_PART * 3), 3);
    const c = new THREE.Color(), beadCols = [0xff4d6d, 0x3fa7ff, 0x46d27a, 0xffd23f, 0xb06bff];
    for (let i = 0; i < N_PART; i++) { const j = Math.floor(i / N_PER); c.set(j === 4 ? beadCols[i % 5] : JAR_KINDS[j].pcol); W.parts.setColorAt(i, c); }
    W.parts.castShadow = true; W.parts.frustumCulled = false; W.parts.visible = false; W.parts.layers.enable(1); scene.add(W.parts); }
  // ---- twenty pawns, two trays
  W.pawns = []; for (let j = 0; j < 4; j++) for (let i = 0; i < 5; i++) { const p = makePawn(); p.position.set(1.06 + i * 0.06, CT.y, -0.245 + j * 0.052); p.visible = false; scene.add(p); W.pawns.push(p); }
  W.trays = TRAYS.map((p) => { const g = makeTray(); g.position.copy(p); g.visible = false; scene.add(g); return g; });
  { const U = W.trays[0], F = W.trays[1], y = 0.012;
    const add = (tray, obj, x, z, ry = 0, s = 1) => { obj.position.set(x, y, z); obj.rotation.y = ry; obj.scale.setScalar(s); obj.userData.s = s; tray.add(obj); return obj; };
    W.upf = [add(U, makePacket(puffsTex(), 0.12, 0.16, 0.05, 0xff8a1e), -0.07, -0.02, 0.1, 0.55), add(U, makeCan(), 0.0, -0.03, 0.1, 0.8), add(U, makeReadyMeal(), 0.055, 0.03, -0.1)];
    W.upfMore = [add(U, makeBar(), -0.06, 0.05, 0.2, 0.7), add(U, makePacket(crispsTex(), 0.12, 0.16, 0.05, 0xf2cf2e), 0.075, -0.035, -0.25, 0.5)];
    W.fresh = [add(F, makePotato(), -0.07, 0.02, 0.4), add(F, makeFillet(), 0.0, 0.02, 0.3), add(F, makeCarrot(), -0.02, -0.045, 0.1, 0.9), add(F, makeApple(), 0.07, -0.03), add(F, makeEgg(), 0.075, 0.045, 0.6)];
    for (const o of W.upfMore) o.visible = false; }
  // ---- the two stacks of discs (body weight); some come off (weight lost)
  W.stacks = STACKS.map((p) => { const g = new THREE.Group(); g.position.copy(p); g.visible = false; scene.add(g);
    const discs = []; for (let k = 0; k < 10; k++) { const d = makeDisc(); d.position.y = 0.006 + k * 0.0135; g.add(d); discs.push(d); }
    discs.forEach((d) => { d.material = d.material.clone(); d.material.transparent = true; }); return { g, discs }; });
  // ---- real food on a board; the packet, the can and the sausages into a crate
  W.board = makeBoard(); W.board.position.copy(BOARD); W.board.visible = false; scene.add(W.board);
  W.whole = [[makePotato(), -0.11, 0.02, 0.5], [makeCarrot(), -0.06, -0.05, 0.2], [makeFish(), 0.0, 0.035, -0.15], [makeApple(), 0.1, -0.04, 0], [makeEgg(), 0.12, 0.05, 0.4]].map(([o, x, z, ry]) => {
    o.position.set(x, 0.02, z); o.rotation.y = ry; o.visible = false; W.board.add(o); return o; });
  W.crate = makeCrate(); W.crate.g.position.copy(CRATE); W.crate.g.visible = false; scene.add(W.crate.g);
  W.junk = [makePacket(puffsTex(), 0.12, 0.16, 0.05, 0xff8a1e), makeCan(), makeSausages()].map((o, i) => { o.scale.setScalar([0.7, 0.9, 1][i]); o.visible = false; scene.add(o); return o; });
  // ---- the dials, in the counter until the settings
  W.dials = buildDials(scene); W.dials.forEach((d, i) => d.g.position.copy(DIALS[i]));
  W.logoRing = makeLogoRing(LOGO_R); W.logoRing.g.rotation.x = -Math.PI / 2; W.logoRing.g.position.y = 0.0665 + 0.0012; W.dials[1].g.add(W.logoRing.g);
  // ---- FOOD and HOBBY
  W.plinths = ['FOOD', 'HOBBY'].map((w, i) => { const P = makePlinth(w); P.g.position.copy(PLINTHS[i]); P.g.visible = false; scene.add(P.g); return P; });
  W.museum = [makePotato(), makePacket(crispsTex(), 0.12, 0.16, 0.05, 0xf2cf2e)].map((o, i) => { o.scale.setScalar(i ? 0.62 : 1.15); o.visible = false; scene.add(o); return o; });
  // ---- medicine, and a plate
  W.pills = makePills(); W.pills.position.copy(MEDS); W.pills.rotation.y = 0.08; W.pills.visible = false; scene.add(W.pills);
  W.plate = makePlate(); W.plate.position.copy(PLATE); W.plate.visible = false; scene.add(W.plate);
  // ---- steam over the pot
  { const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.0, depthWrite: false });
    W.steam = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 10, 8), mat, 24); W.steam.frustumCulled = false; W.steam.visible = false; scene.add(W.steam); W.steamMat = mat; }
  // ---- light
  W.key = spot(scene, { color: 0xffe9d2, pos: new THREE.Vector3(-0.4, 3.0, 2.1), target: new THREE.Vector3(1.0, 0.9, 0.0), angle: 0.55, penumbra: 0.85, shadow: true, size: cfg.shadow ?? 1024 });
  W.key.shadow.camera.far = 7;
  W.rim = spot(scene, { color: 0xa9c4ff, pos: new THREE.Vector3(-1.6, 2.3, -1.6), target: new THREE.Vector3(0.1, 0.9, 0), angle: 0.6, penumbra: 0.9 });
  W.fill = spot(scene, { color: 0xc8d6ff, pos: new THREE.Vector3(2.9, 1.2, 1.9), target: new THREE.Vector3(1.2, 0.9, 0.0), angle: 0.7, penumbra: 1 });
  W.counterLight = spot(scene, { color: 0xfff1dc, pos: new THREE.Vector3(1.38, 2.5, 0.7), target: new THREE.Vector3(1.38, CT.y, -0.02), angle: 0.62, penumbra: 0.7 });
  W.gaugeLight = spot(scene, { color: 0xfff1dc, pos: new THREE.Vector3(0.84, 2.25, 0.75), target: GAUGE.clone(), angle: 0.2, penumbra: 0.6 });
  W.lowLight = spot(scene, { color: 0xffeedd, pos: new THREE.Vector3(0.55, 0.7, 1.1), target: new THREE.Vector3(0.02, 0.05, W.scaleZ), angle: 0.42, penumbra: 0.9 });
  W.dialLight = spot(scene, { color: 0xfff1e2, pos: new THREE.Vector3(1.4, 1.75, 1.5), target: new THREE.Vector3(1.4, CT.y, 0.17), angle: 0.62, penumbra: 0.8 });
  W.museumLight = spot(scene, { color: 0xfff4e4, pos: new THREE.Vector3(2.16, 1.9, 0.75), target: new THREE.Vector3(2.16, CT.y + 0.1, 0.0), angle: 0.28, penumbra: 0.55 });
  W.timing = { box: T.box, bar: T.wrapper, bag: T.bag, stamp: T.blame + 0.12, peel: T.same3 + 0.08, sinkA: 9.0, drops: DROPS.map((d) => d.t1), pot: [POT_IN, POT_OUT],
    jars: [JAR_IN, JAR_OUT], parts: [0, 1, 2, 3, 4].map((j) => PART_T0(j)), packet: T.snacks + 0.05, can: T.fizzy + 0.05,
    pawns: PAWN_T(0), trays: [T.two1 + 0.05, T.two2 + 0.05], more: [T.extra + 0.05, T.calories + 0.1], kg: [KG0, KG1],
    stacks: STACK_IN, off: [OFF_L[0], OFF_L[1], OFF_R], board: WHOLE_T, slide: JUNK_T, crate: T.exception + 0.1, dials: [DIAL_IN, DIAL_IN2], sets: [T.cook, T.exception],
    plinths: PLINTH_IN, museum: [T.potato + 0.05, T.potato2 + 0.05], hobby: T.hobby + 0.05, pills: T.medicine + 0.05, plate: T.better + 0.05, logo: T.logo };
  return { stamp: W.stampSpot, scaleZ: W.scaleZ };
}

// ------------------------------------------------------------------ when things happen (beats on the words)
const SINK_A = [9.0, 9.6];                                         // breakfast, lunch and dinner go into the counter
const POT_IN = 9.15, POT_OUT = 22.45;
const DROPS = [T.grew, T.swam, T.walked].map((t1, i) => ({ t0: t1 - 0.38, t1, x: [-0.03, 0.02, 0.0][i], z: [-0.02, 0.03, -0.035][i], ry: [0.6, -0.4, 1.4][i] }));
const JAR_IN = T.ultra + 0.05, JAR_OUT = 23.0;
const PAWN_T = (i) => T.twenty + 0.05 + i * 0.03;
const TRAY_OUT = 44.4, PAWN_OUT = 44.2;
const KG0 = T.gained, KG1 = T.kilo + 0.35;
const STACK_IN = 44.85, OFF_L = [T.lost + 0.05, T.lost + 0.32], OFF_R = T.half + 0.05, STACK_OUT = 54.2;
const WHOLE_T = [T.cook, T.food2, T.still, T.looks, T.came].map((t) => t + 0.05);
const JUNK_T = [T.snacks2 - 0.1, T.drinks2 - 0.1, T.meat - 0.1];
const DIAL_IN = 54.35, DIAL_IN2 = 58.0, BOARD_IN = 54.5;
const PLINTH_IN = 62.75, PLINTH_OUT = 67.35;
const JUNK_OUT = 63.0, BOARD_OUT = 66.0;

// ------------------------------------------------------------------ the camera: one path, no cuts
let CAM = null;
function buildCam() {
  return camTrack([
    { t: -2.0, p: V3(0.84, 1.36, 1.98), l: V3(0.84, 1.1, 0.04), fov: 32 },
    { t: 0.0, p: V3(0.84, 1.35, 1.92), l: V3(0.84, 1.1, 0.04), fov: 32 },          // breakfast, lunch, dinner on the counter
    { t: 4.3, p: V3(0.85, 1.37, 1.82), l: V3(0.84, 1.11, 0.04), fov: 32 },
    { t: 5.3, p: V3(0.86, 1.78, 0.98), l: V3(0.84, 1.7, WALL_Z), fov: 30 },          // up to the meter: blame your willpower
    { t: 6.45, p: V3(0.86, 1.78, 0.94), l: V3(0.84, 1.7, WALL_Z), fov: 30, tens: 0.4 },
    { t: 7.6, p: V3(0.86, 1.26, 1.4), l: V3(0.85, 0.99, 0.05), fov: 32 },            // back down to the food
    { t: 8.7, p: V3(0.87, 1.25, 1.34), l: V3(0.86, 0.99, 0.05), fov: 32, tens: 0.4 },
    { t: 9.9, p: V3(1.33, 1.37, 1.08), l: V3(1.32, 0.97, 0.0), fov: 30 },             // the pot
    { t: 14.2, p: V3(1.34, 1.35, 1.02), l: V3(1.32, 0.97, 0.0), fov: 30, tens: 0.4 },
    { t: 15.4, p: V3(1.79, 1.34, 1.96), l: V3(1.78, 1.0, -0.02), fov: 32, tens: 0.15 },   // the jars
    { t: 22.0, p: V3(1.79, 1.33, 1.9), l: V3(1.78, 1.0, 0.0), fov: 32, tens: 0.15 },
    { t: 23.3, p: V3(1.19, 1.43, 1.8), l: V3(1.18, 0.96, -0.04), fov: 32 },           // twenty pawns, two trays
    { t: 33.4, p: V3(1.19, 1.41, 1.72), l: V3(1.18, 0.96, -0.02), fov: 32, tens: 0.3 },
    { t: 35.2, p: V3(1.06, 1.3, 1.12), l: V3(1.04, 0.95, 0.1), fov: 30 },             // the packaged tray: second helpings
    { t: 38.55, p: V3(1.05, 1.29, 1.08), l: V3(1.04, 0.95, 0.1), fov: 30, tens: 0.4 },
    { t: 39.55, p: V3(0.45, 0.42, 0.98), l: V3(0.04, 0.07, W_SCALE_Z + 0.12), fov: 30 },   // down to the scale: almost a kilo
    { t: 41.2, p: V3(0.44, 0.43, 0.94), l: V3(0.04, 0.07, W_SCALE_Z + 0.12), fov: 30, tens: 0.3 },
    { t: 42.45, p: V3(0.55, 1.62, 1.3), l: V3(0.12, 1.55, 0.0), fov: 32 },            // up the same skeleton
    { t: 43.35, p: V3(0.86, 1.78, 0.98), l: V3(0.84, 1.7, WALL_Z), fov: 30 },         // to the meter: same willpower
    { t: 44.5, p: V3(0.86, 1.78, 0.94), l: V3(0.84, 1.7, WALL_Z), fov: 30, tens: 0.4 },
    { t: 45.7, p: V3(0.8, 1.3, 1.62), l: V3(0.79, 1.0, 0.06), fov: 32 },              // the stacks
    { t: 53.8, p: V3(0.8, 1.29, 1.56), l: V3(0.79, 1.0, 0.06), fov: 32, tens: 0.3 },
    { t: 55.0, p: V3(1.14, 1.35, 1.86), l: V3(1.14, 0.97, 0.06), fov: 32 },           // real food on the board, the first dial
    { t: 57.9, p: V3(1.15, 1.34, 1.8), l: V3(1.14, 0.97, 0.06), fov: 32, tens: 0.4 },
    { t: 59.0, p: V3(1.72, 1.35, 1.84), l: V3(1.72, 0.97, 0.05), fov: 32 },           // into the crate; the second dial
    { t: 62.4, p: V3(1.73, 1.34, 1.78), l: V3(1.72, 0.97, 0.05), fov: 32, tens: 0.4 },
    { t: 63.3, p: V3(2.16, 1.28, 1.52), l: V3(2.16, 1.0, 0.0), fov: 32 },             // FOOD and HOBBY
    { t: 67.2, p: V3(2.17, 1.27, 1.46), l: V3(2.16, 1.0, 0.0), fov: 32, tens: 0.4 },
    { t: 68.4, p: V3(2.14, 1.25, 1.46), l: V3(2.13, 0.97, 0.04), fov: 32 },           // medicine, and better food beside it
    { t: 73.6, p: V3(2.14, 1.24, 1.4), l: V3(2.13, 0.97, 0.04), fov: 32, tens: 0.3 },
    { t: 75.1, p: V3(DIALS[1].x + 0.02, CT.y + 0.5, DIALS[1].z + 0.58), l: V3(DIALS[1].x, CT.y + 0.03, DIALS[1].z), fov: 30 },
    { t: T.logo, p: V3(DIALS[1].x, CT.y + 0.62, DIALS[1].z + 0.003), l: V3(DIALS[1].x, CT.y + 0.0665 * DIAL_S, DIALS[1].z), fov: 30, stop: true },   // straight down on the dial: the logo lands here
  ]);
}
let W_SCALE_Z = 0.03;
function camPose(S, t) {
  const v = S.cfg.view;
  if (Array.isArray(v)) return { p: v[0], l: v[1], fov: v[2] ?? 30 };
  if (v && typeof v === 'object') return v;
  if (!CAM) { W_SCALE_Z = W.scaleZ ?? 0.03; CAM = buildCam(); }
  if (t <= T.logo) return CAM(t);
  const P = CAM(T.logo), k = ss(T.logo, T.end, t);
  return { p: [P.p[0], lerp(P.p[1], P.p[1] - 0.05, k), P.p[2]], l: P.l, fov: 30 };
}
function focusAt(S, t, P) { return Math.hypot(P.p[0] - P.l[0], P.p[1] - P.l[1], P.p[2] - P.l[2]); }

// ------------------------------------------------------------------ one moment of the film
const _m4 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _v = new THREE.Vector3(), _P = { p: new THREE.Vector3(), s: 0, j: 0 };
const sinkK = (t, a, b) => 1 - s5(a, b, t);                          // 1 → 0
function update(S, t) {
  const scene = S.scene;
  applyBody(t);
  const endDark = ss(T.final + 0.3, T.logo - 0.3, t);
  // ---- breakfast, lunch, dinner: they pop onto the counter on their words, and go before the pot
  { const out = sinkK(t, SINK_A[0], SINK_A[1]);
    [[W.cereal, T.box], [W.bar, T.wrapper], [W.bag, T.bag]].forEach(([o, t0], i) => { showAt(o, pop(t, t0 - 0.1) * out); }); }
  // ---- the meter: the needle breathes around the middle; BLAMED is stamped on, then falls off (same willpower)
  { const G = W.gauge; G.needle.rotation.z = -(0.05 + 0.05 * Math.sin(t * 1.7) + 0.02 * Math.sin(t * 5.3));
    const t0 = T.blame + 0.12, u = clamp01((t - (t0 - 0.12)) / 0.12), a = t - t0, pe = clamp01((t - (T.same3 + 0.08)) / 0.75);
    G.st.visible = u > 0 && pe < 1;
    if (G.st.visible) {
      const wob = a > 0 ? 0.14 * Math.exp(-a / 0.1) * Math.sin(a * 46) : 0;
      G.st.position.copy(G.stP); G.st.position.z += 0.05 * (1 - u) * (1 - u) + 0.04 * pe; G.st.position.y -= 0.16 * pe * pe;
      G.st.scale.setScalar(lerp(1.5, 1, u * u) * (1 + (a > 0 ? 0.06 * Math.exp(-a / 0.05) : 0)));
      G.st.rotation.z = G.stR + 0.5 * (1 - u) + wob + 1.6 * pe * pe; G.sm.opacity = Math.min(1, u * 2) * (1 - ss(0.4, 1, pe));
    } }
  // ---- the pot: up through the counter; a carrot, a fish and a drumstick drop in; steam; then down again
  { const k = s5(POT_IN, POT_IN + 0.45, t) * sinkK(t, POT_OUT, POT_OUT + 0.45); W.pot.g.visible = k > 0.001; W.pot.g.position.y = CT.y - 0.12 * (1 - k);
    W.pot.stew.position.y = 0.03 + 0.03 * ss(T.grew, T.walked + 0.2, t);
    DROPS.forEach((D, i) => { const o = W.drops[i], u = clamp01((t - D.t0) / (D.t1 - D.t0));
      o.visible = t > D.t0 && k > 0.001;
      if (!o.visible) return;
      const land = POT.y + 0.03 + 0.03 * ss(T.grew, T.walked + 0.2, t) - 0.01 + i * 0.006, y = lerp(POT.y + 0.42, land, u * u), b = t > D.t1 ? 0.012 * Math.exp(-(t - D.t1) / 0.08) * Math.abs(Math.sin((t - D.t1) * 30)) : 0;
      o.position.set(POT.x + D.x, y + b, POT.z + D.z); o.rotation.set(0.6 * (1 - u), D.ry + 2.2 * (1 - u), 0.3 * Math.sin(u * 3)); o.position.y -= 0.12 * (1 - k); });
    W.steam.visible = false;
 }
  // ---- the factory: five jars rise; their contents fly into a packet and a can
  { const k = s5(JAR_IN, JAR_IN + 0.5, t) * sinkK(t, JAR_OUT, JAR_OUT + 0.4);
    W.jars.forEach((J, j) => { const kj = s5(JAR_IN + j * 0.08, JAR_IN + 0.5 + j * 0.08, t) * sinkK(t, JAR_OUT, JAR_OUT + 0.4); J.g.visible = kj > 0.001; J.g.position.y = CT.y - 0.14 * (1 - kj);
      J.lid.position.y = 0.127 + 0.03 * ss(PART_T0(j) - 0.2, PART_T0(j), t) * (1 - ss(T.drinks + 0.4, T.drinks + 0.8, t)); });
    showAt(W.packet, pop(t, T.snacks) * sinkK(t, JAR_OUT, JAR_OUT + 0.4)); W.packet.position.y = CT.y;
    showAt(W.can, pop(t, T.fizzy) * sinkK(t, JAR_OUT, JAR_OUT + 0.4)); W.can.position.y = CT.y;
    let n = 0;
    if (t > T.parts - 0.1 && t < T.drinks + 1.0) for (let i = 0; i < N_PART; i++) { const P = partAt(i, t, _P); if (!P) _m4.makeScale(0, 0, 0); else { _s.setScalar(Math.max(0.0001, P.s)); _m4.compose(P.p, _q.identity(), _s); n++; } W.parts.setMatrixAt(i, _m4); }
    W.parts.instanceMatrix.needsUpdate = true; W.parts.visible = n > 0; void k; }
  // ---- twenty pawns pop up; the trays slide in; the packaged one gets second helpings
  W.pawns.forEach((p, i) => showAt(p, pop(t, PAWN_T(i), 0.28) * sinkK(t, PAWN_OUT, PAWN_OUT + 0.35)));
  W.trays.forEach((g, i) => { const t0 = [T.two1, T.two2][i] + 0.05; showAt(g, pop(t, t0, 0.36, 1.3) * sinkK(t, TRAY_OUT, TRAY_OUT + 0.4)); });
  W.upfMore.forEach((o, i) => { const k = pop(t, [T.extra, T.calories][i] + 0.05); o.visible = k > 0.001; o.scale.setScalar(Math.max(0.001, k) * o.userData.s); });
  // ---- the scale: wakes as the camera arrives, 70.0, then up 0.9 kg on "gained almost a kilo"
  { let text = '   ', glow = 0;
    if (t > 38.9 && t < 41.9) { const kg = 70 + 0.9 * s5(KG0, KG1, t); text = kg.toFixed(1); glow = 1 - ss(41.5, 41.9, t); }
    drawBath(W.bath, text, glow); }
  // ---- the stacks rise; two discs come off the minimally processed one, one off the ultra-processed one
  W.stacks.forEach((S2, si) => { const k = s5(STACK_IN + si * 0.1, STACK_IN + 0.5 + si * 0.1, t) * sinkK(t, STACK_OUT, STACK_OUT + 0.4); S2.g.visible = k > 0.001; S2.g.position.y = CT.y - 0.16 * (1 - k);
    const offs = si === 0 ? [[9, OFF_L[1]], [8, OFF_L[0]]] : [[9, OFF_R]];
    S2.discs.forEach((d, n) => { d.position.set(0, 0.006 + n * 0.0135, 0); d.rotation.set(0, 0, 0); d.material.opacity = 1; d.visible = true; });
    for (const [n, t0] of offs) { const d = S2.discs[n], u = clamp01((t - t0) / 0.7); if (u <= 0) continue;
      d.position.set(0.05 * u * (si ? 1 : -1), 0.006 + n * 0.0135 + 0.22 * u - 0.06 * u * u, -0.25 * u * u); d.rotation.set(1.6 * u, 0, (si ? -1 : 1) * 0.9 * u); d.material.opacity = 1 - ss(0.5, 1, u); d.visible = u < 1; } });
  // ---- real food on the board; then the packet, the can and the sausages slide into the crate
  { const kb = s5(BOARD_IN, BOARD_IN + 0.45, t) * sinkK(t, BOARD_OUT, BOARD_OUT + 0.4); W.board.visible = kb > 0.001; W.board.position.y = CT.y - 0.05 * (1 - kb);
    W.whole.forEach((o, i) => showAt(o, pop(t, WHOLE_T[i]))); }
  { const kc = s5(DIAL_IN2 + 0.2, DIAL_IN2 + 0.6, t) * sinkK(t, JUNK_OUT, JUNK_OUT + 0.4); W.crate.g.visible = kc > 0.001; W.crate.g.position.y = CT.y - 0.1 * (1 - kc);
    W.crate.mat.opacity = 0.8 + 0.2 * ss(T.exception, T.exception + 0.3, t);
    W.junk.forEach((o, i) => { const t0 = JUNK_T[i], k = pop(t, t0 - 0.35, 0.3), u = s5(t0, t0 + 0.5, t), out = sinkK(t, JUNK_OUT, JUNK_OUT + 0.4);
      o.visible = k > 0.001 && out > 0.001; if (!o.visible) return;
      const inX = CRATE.x + [-0.05, 0.03, 0.0][i], inZ = CRATE.z + [-0.02, -0.02, 0.035][i], hop = 0.06 * Math.sin(Math.PI * u);
      o.position.set(lerp(SLIDE_X, inX, u), CT.y + 0.008 * u + hop - 0.1 * (1 - out), lerp(0.12, inZ, u)); o.rotation.set(0, [-0.2, 0.15, 0.15][i] * u, 0);
      o.scale.setScalar([0.7, 0.9, 1][i] * Math.max(0.001, k)); }); }
  // ---- the dials rise; cook from food turned up, the exception turned down; the second becomes the logo
  W.dials.forEach((d, i) => {
    const t0 = [DIAL_IN, DIAL_IN2][i], up = s5(t0, t0 + 0.8, t); d.g.position.y = CT.y - 0.075 * DIAL_S * (1 - up); d.g.visible = up > 0.001;
    const ts = [T.cook, T.exception][i], v = [0.85, 0.15][i], k = s5(ts - 0.05, ts + 0.55, t);
    d.knob.rotation.y = -d.angle(lerp(lerp(0.5, v, k), 0.5, i === 1 ? s5(T.final + 0.2, T.logo - 0.3, t) : 0));
    d.setMat.opacity = ss(ts + 0.3, ts + 0.6, t) * (1 - endDark);
    const a = d.angle(v), r = 0.147; d.set.position.set(Math.sin(a) * r, 0.0048, -Math.cos(a) * r); d.set.rotation.y = -a;
  });
  { const logoK = s5(T.final + 0.4, T.logo - 0.25, t); W.logoRing.set({ weight: logoK, white: logoK, hours: 0, hand: ss(T.logo - 0.4, T.logo - 0.15, t), handScale: outBack(clamp01((t - (T.logo - 0.4)) / 0.35), 1.8) }); }
  // ---- FOOD and HOBBY: two plinths; a potato, then the potato-flavoured crisps
  W.plinths.forEach((P, i) => { const k = s5(PLINTH_IN + i * 0.1, PLINTH_IN + 0.5 + i * 0.1, t) * sinkK(t, PLINTH_OUT, PLINTH_OUT + 0.4); P.g.visible = k > 0.001; P.g.position.y = CT.y - 0.12 * (1 - k); });
  W.museum.forEach((o, i) => { const t0 = [T.potato, T.potato2][i] + 0.02, k = pop(t, t0, 0.34, 1.4), out = sinkK(t, PLINTH_OUT, PLINTH_OUT + 0.4);
    o.visible = k > 0.001 && out > 0.001; if (!o.visible) return; const P = W.plinths[i];
    o.position.set(PLINTHS[i].x, P.g.position.y + P.top + 0.0005, PLINTHS[i].z); o.rotation.y = [0.5, -0.12][i] + (i === 1 ? 0.12 * Math.sin((t - T.hobby) * 9) * Math.exp(-Math.max(0, t - T.hobby) / 0.35) * (t > T.hobby ? 1 : 0) : 0);
    o.scale.setScalar([1.15, 0.62][i] * Math.max(0.001, k)); });
  // ---- medicine, and a plate of real food beside it
  showAt(W.pills, pop(t, T.medicine) * (1 - endDark * 0)); W.pills.position.y = CT.y;
  { const u = s5(T.better, T.better + 0.6, t); W.plate.visible = u > 0.001; W.plate.position.set(lerp(PLATE.x + 0.25, PLATE.x, u), CT.y, PLATE.z); }
  // ---- light
  const fig = 1 - endDark, low = ss(38.7, 39.5, t) * (1 - ss(41.6, 42.4, t)), meter = Math.max(ss(4.6, 5.3, t) * (1 - ss(6.6, 7.6, t)), ss(42.8, 43.4, t) * (1 - ss(44.6, 45.6, t)));
  W.key.intensity = 5.2 * fig; W.rim.intensity = 2.0 * fig; W.fill.intensity = 1.1 * fig;
  W.counterLight.intensity = 4.2 * fig * (1 - 0.6 * low);
  W.gaugeLight.intensity = 0.35 + 1.5 * meter;
  W.lowLight.intensity = 1.8 * low;
  W.museumLight.intensity = 4.0 * ss(62.6, 63.4, t) * (1 - ss(67.2, 68.0, t));
  W.dialLight.intensity = 2.6 * ss(54.2, 55.0, t) * (1 - ss(63.0, 63.8, t)) + 2.6 * ss(74.4, 75.4, t) * (1 - 0.6 * endDark);
  S.tableMat.color.setScalar(FLOOR * (1 - endDark * 0.9)); scene.environmentIntensity = 0.12 * (1 - endDark); S.reflAmt = 0.9 * (1 - endDark);
}

// ------------------------------------------------------------------ the words on screen
const CAPS = [
  { t0: T.you, t1: 4.33, top: 292, size: 84, html: 'You eat breakfast<br>from a <em>box</em>, lunch from<br>a <em>wrapper</em> and dinner<br>from a <em>bag</em>,' },
  { t0: T.then, t1: 6.6, top: 300, size: 92, html: 'then blame<br>your <em>willpower.</em>' },
  { t0: T.lets, t1: 8.95, top: 300, size: 92, html: 'Let’s look at<br>the <em>food</em> instead.' },
  { t0: T.for, t1: 14.55, top: 292, size: 84, html: 'For most of history,<br>people cooked meals<br>from things that <em>grew</em>,<br><em>swam</em> or <em>walked</em>.' },
  { t0: T.ultra, t1: 19.55, top: 292, size: 84, html: '<em>Ultra-processed</em> food<br>is made in factories<br>from parts of foods<br>and <em>additives</em>,' },
  { t0: T.like, t1: 22.6, top: 300, size: 88, html: 'like packaged snacks<br>and <em>fizzy drinks.</em>' },
  { t0: T.in, t1: 26.75, top: 292, size: 84, html: 'In a hospital study,<br><em>twenty adults</em> ate as<br>much as they wanted:' },
  { t0: T.two1, t1: 29.4, top: 300, size: 88, html: 'two weeks of<br><em>ultra-processed</em> meals,' },
  { t0: 29.45, t1: 33.9, top: 292, size: 84, html: 'and two weeks of<br><em>fresh meals</em> with the<br>same nutrients on offer.' },
  { t0: T.on, t1: 38.7, top: 292, size: 84, html: 'On the packaged food,<br>they ate about <em>500</em><br>extra calories a day' },
  { t0: 38.75, t1: 41.3, top: 300, size: 92, html: 'and gained<br><em>almost a kilo.</em>' },
  { t0: T.they, t1: 44.6, top: 300, size: 88, html: 'They were the<br><em>same people</em>, with the<br><em>same willpower.</em>' },
  { t0: T.in2, t1: 48.7, top: 292, size: 84, html: 'In a newer trial,<br>both diets followed<br>healthy eating advice,' },
  { t0: 48.75, t1: 54.25, top: 292, size: 84, html: 'and people lost only<br>about <em>half as much</em><br>weight on the<br>ultra-processed one.' },
  { t0: T.so, t1: 57.5, top: 292, size: 84, html: 'So cook from food<br>that still <em>looks like</em><br>what it came from,' },
  { t0: T.and3, t1: 62.75, top: 292, size: 84, html: 'and make packaged<br>snacks, sugary drinks<br>and processed meat<br>the <em>exception.</em>' },
  { t0: T.a, t1: 64.28, top: 300, size: 96, html: 'A potato<br>is <em>food.</em>' },
  { t0: T.a2, t1: 67.5, top: 300, size: 88, html: 'A potato-flavoured<br>snack is a <em>hobby.</em>' },
  { t0: T.if, t1: 70.72, top: 292, size: 84, html: 'If you take medicine<br>for <em>diabetes</em><br>or your <em>heart</em>,' },
  { t0: T.better, t1: 74.3, top: 292, size: 84, html: 'better food works<br><em>with it</em>,<br>not instead of it.' },
  { t0: T.final, t1: 99, top: 360, size: 92, html: 'Let’s get you back to<br><em>factory settings.</em>' },
];
const OVL = {};
function overlayInit(S) {
  const O = S.O, tag = (cls, txt, size, big = 0) => { const e = O.tag(cls, txt); e.style.fontSize = size + 'px'; if (big) { const b = e.querySelector('b'); if (b) b.style.fontSize = big + 'px'; } return e; };
  OVL.jars = JAR_KINDS.map(() => null);
  OVL.study = tag('tag', 'Hospital study<b>20 adults</b>', 24, 44);
  OVL.trays = [tag('tag', 'Ultra-processed<b>2 weeks</b>', 24, 40), tag('tag', 'Fresh<b>2 weeks</b>', 24, 40)];
  OVL.same = tag('tag', 'Same nutrients<b>on offer</b>', 24, 36);
  OVL.kcal = tag('tag', 'Eaten per day<b>+508 kcal</b>', 24, 48);
  OVL.kg = tag('tag', 'In 2 weeks<b>+0.9 kg</b>', 24, 48);
  OVL.stacks = [tag('tag', 'Minimally processed<b>−2.06%</b>', 22, 44), tag('tag', 'Ultra-processed<b>−1.05%</b>', 22, 44)];
  OVL.trial = tag('tag', 'Weight lost<b>8 weeks each</b>', 24, 36);
  OVL.dial = [tag('tag', 'Most meals<b>cooked from food</b>', 24, 40), tag('tag', 'Snacks, sugary drinks,<br>processed meat<b>the exception</b>', 24, 40)];
  OVL.meds = [tag('tag', 'Your medicine', 26), tag('tag', 'Better food', 26)];
}
function overlay(S, t) {
  const fade = (a, b, c, d) => ss(a, b, t) * (1 - ss(c, d, t));
  place(S, OVL.study, new THREE.Vector3(1.0, CT.y + 0.06, -0.25), -120, -70, fade(T.adults, T.adults + 0.4, 26.6, 27.0));
  W.trays.forEach((g, i) => place(S, OVL.trays[i], g.position.clone().add(_v.set(-0.1, 0.0, 0.09)), 0, 14, fade([T.two1, T.two2][i] + 0.45, [T.two1, T.two2][i] + 0.85, 34.0, 34.4)));
  place(S, OVL.same, new THREE.Vector3(1.18, CT.y + 0.055, -0.27), -62, -66, fade(T.same, T.same + 0.35, 34.0, 34.4));
  place(S, OVL.kcal, W.trays[0].position.clone().add(_v.set(0.0, 0.0, 0.085)), -70, 8, fade(T.five, T.five + 0.4, 38.6, 39.0));   // (tags stay clear of the bottom fifth, where the apps put their own text)
  place(S, OVL.kg, new THREE.Vector3(0.12, SCALE.h, W.scaleZ + SCALE.d / 2), 24, -96, fade(T.almost, T.almost + 0.4, 41.4, 41.8));
  W.stacks.forEach((S2, i) => place(S, OVL.stacks[i], S2.g.position.clone().add(_v.set([-0.06, 0.07][i], 0.075, 0)), [-(OVL.stacks[i].offsetWidth || 220) - 4, 10][i], -20, fade([T.lost + 0.4, T.half + 0.4][i], [T.lost + 0.8, T.half + 0.8][i], 54.0, 54.4)));
  place(S, OVL.trial, new THREE.Vector3(0.79, CT.y + 0.2, 0.06), -90, -40, fade(T.both, T.both + 0.4, 49.4, 49.8));
  W.dials.forEach((d, i) => place(S, OVL.dial[i], d.g.position.clone().add(_v.set(0, 0.0, 0.1)), [-170, -70][i], 18, fade([T.cook, T.exception][i] + 0.3, [T.cook, T.exception][i] + 0.7, [58.6, 74.3][i], [59.0, 74.7][i])));
  place(S, OVL.meds[0], MEDS.clone().add(_v.set(0, 0.105, 0)), -70, -36, fade(T.medicine + 0.3, T.medicine + 0.7, 74.3, 74.7));
  place(S, OVL.meds[1], PLATE.clone().add(_v.set(0, 0.05, 0)), -50, -40, fade(T.better + 0.6, T.better + 1.0, 74.3, 74.7));
  const d = W.dials[1], c = d.g.position.clone().add(new THREE.Vector3(0, (0.0665 + 0.0012) * DIAL_S, 0));
  logoEnd(S, t, { t0: T.logo, center: c, edge: c.clone().add(new THREE.Vector3(LOGO_R * DIAL_S, 0, 0)) });
}

makeFilm({
  T, caps: CAPS, subs: [], build, update, pose: camPose, overlay, overlayInit, focus: focusAt,
  stage: { bg: 0x07080a, reflSize: 6, env: 0.12, far: 30 },
  aperture: [[0, 0.004], [5.3, 0.004], [7.6, 0.004], [9.9, 0.005], [15.4, 0.003], [23.3, 0.003], [35.2, 0.004], [39.55, 0.004], [42.4, 0.002], [43.35, 0.004], [45.7, 0.004], [55, 0.003], [59, 0.002], [63.3, 0.004], [68.4, 0.004], [75.1, 0.003]],
  bloom: [[0, 0.42], [20, 0.45], [40, 0.45], [62, 0.45], [76.9, 0.55]],
  fast: [[4.4, 5.4, 2], [6.5, 7.7, 2], [8.8, 10.0, 2], [14.3, 15.5, 2], [22.1, 23.4, 2], [38.6, 39.7, 3], [41.2, 43.5, 2], [44.5, 45.8, 2], [53.9, 55.1, 2], [57.9, 59.1, 2], [62.4, 63.4, 2], [73.6, 75.2, 2]],
});

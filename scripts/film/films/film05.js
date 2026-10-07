// Human Factory Settings · Film 5 "How much protein do you need?" (new direction, 6 Oct 2026) · one continuous shot, 9:16.
// A supermarket end-cap where a PROTEIN sticker gets slapped on everything: the coffee, the flakes, the pancake mix, and
// then the eggs (NOW WITH PROTEIN!). A skeleton stands on a bathroom scale beside it; a band of light rebuilds the muscles
// of its arms. The scale counts to 70 kg and a cream cube (one gram of protein) lands for every 1.2 kg: 58. It curls a
// dumbbell, palm in (the radius turns about the ulna, as in a real forearm); 300 g of lean mass drops on a kitchen scale
// beside a tub with a giant arm on its label. The column climbs to 1.6 g per kg (112) and the rest tumble off. Two dials:
// every day at least 0.8, training up to 1.6 (a stop). Four bowls of real food take the 112 grams, 28 each; past 1.6 the
// training dial is thrown at its stop. The kidneys. The every-day dial becomes the logo.
import { THREE, ORANGE, ss, s5, lerp, clamp01, hash, camTrack, phys, glowMat, shadows, spot, RoundedBoxGeometry,
  loadAnatomy, tissueMat, V3, place, logoEnd, makeFilm, outBack, stamp, labelCanvas, stampLine, noiseTex } from '../kit.js';
import { buildRig, skeletonKind, bendSpine, poseArm, ARM0, worldVerts, avgV, clearArms } from '../rig.js';
import { makeLogoRing } from '../props.js';
import { skinned, armBinder } from '../soft.js';

// ------------------------------------------------------------------ timing, from the voice guide (word starts)
const T = {
  end: 73.7, logo: 71.16,
  youre: 0.35, putting: 0.79, protein: 1.07, coffee: 1.84, cereal: 2.33, and1: 2.99, pancakes: 3.48, so: 4.05, lets: 4.36, work: 4.67, much: 5.63, need: 6.84,
  your: 8.12, body: 8.56, rebuilds: 8.86, itself: 9.35, protein2: 9.87, every: 10.31, day: 10.78, but: 11.0, needs: 11.36, less: 12.11, supplement: 12.69, aisle: 13.15, wants: 13.63, think: 14.43,
  europe: 15.54, experts: 16.76, say: 17.23, about: 17.67, point: 17.99, eight: 18.24, grams: 18.46, aday: 19.12, every2: 19.82, kilo: 20.37, weigh: 21.11, enough: 21.57, almost: 22.23, adult: 23.35,
  if1: 24.35, weigh2: 24.96, seventy: 25.04, kilos: 25.49, thats: 25.9, fiftyeight: 26.56, grams2: 27.19,
  if2: 28.78, lift: 29.39, weights: 29.57, extra: 29.85, help: 31.21, only: 31.59, little: 32.06, about2: 32.42, three: 33.0, hundred: 33.34, grams3: 33.8, lean: 35.07, mass: 35.48, average: 36.15,
  thats2: 37.42, not: 37.96, body2: 38.53, label: 39.02,
  and2: 40.24, above: 40.68, one: 41.22, six: 41.72, kilo2: 42.53, extra2: 43.28, gains: 43.76, stopped: 44.31,
  so2: 45.54, eat: 46.08, least: 46.37, point8: 46.64, eight2: 46.85, day2: 48.29, upto: 48.42, one6: 48.95, six2: 49.64, lift2: 50.5, and3: 50.85, get: 51.44, real: 52.12, food: 52.45,
  about3: 52.98, tf: 53.25, thirty: 54.36, grams4: 54.85, each: 55.5, meal: 55.95,
  past: 56.76, six3: 57.77, buying: 58.26, more: 58.72, protein3: 59.08, not2: 59.64, muscle: 60.26,
  if4: 61.48, kidney: 62.23, disease: 62.51, ask: 63.01, doctor: 63.49, dietitian: 64.45, notvideo: 65.06, video: 65.59, includes: 66.64, thisone: 67.3,
  final: 68.9, factory: 70.11, settings: 70.48,
};

// ------------------------------------------------------------------ the set (metres; the skeleton faces +z; +x is its left, the right of the frame)
const W = {}; window.HFS_W = W;
const FLOOR = 0.4;
const SCALE = { w: 0.34, d: 0.36, h: 0.026 };                      // the bathroom scale
const SHELF = { x0: 0.52, x1: 1.12, zf: -0.03, zb: -0.37, y: [0.22, 0.62, 1.02, 1.42], top: 1.78 };   // the end-cap; y = the shelves' top faces
const KS = new THREE.Vector3(0.635, SHELF.y[2], -0.17);             // the kitchen scale, on the eye-level shelf
const CUBE = 0.014, PITCH = 0.0146;                                 // one gram of protein: a 14 mm cube of pressed powder
const COL = new THREE.Vector3(0.215, 0, 0.17);                      // the column of cubes, on the floor beside the scale's front corner (z set in build)
const BOWLS = [[-0.385, 0.47], [-0.215, 0.47], [-0.385, 0.64], [-0.215, 0.64]].map(([x, z]) => new THREE.Vector3(x, 0, z));
const DIALS = [new THREE.Vector3(0, 0, 0.98), new THREE.Vector3(-0.4, 0, 0.98)];   // every day (the logo's), training
const LOGO_R = 0.072;
const N_COL = 112, N_OVER = 30, N_CUBES = N_COL + N_OVER;
const RELAX = 0.18;                                                 // a hand at rest, a little closed

// ------------------------------------------------------------------ small canvas helpers
function canvasTex(w, h, draw, { srgb = true, aniso = 8 } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h, c);
  const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = aniso; t.userData.canvas = c; return t;
}
function txt(x, s, px, py, { font = '800 100px Archivo', color = '#fff', align = 'center', track = 0, base = 'middle', maxW = 0 } = {}) {
  x.font = font; x.letterSpacing = `${track}px`; x.fillStyle = color; x.textAlign = align; x.textBaseline = base;
  if (maxW) { const w = x.measureText(s).width; if (w > maxW) { x.save(); x.translate(px, py); x.scale(maxW / w, 1); x.fillText(s, 0, 0); x.restore(); return; } }
  x.fillText(s, px, py);
}
function starburst(x, cx, cy, r0, r1, n, color, rot = 0) {
  x.save(); x.translate(cx, cy); x.rotate(rot); x.fillStyle = color; x.beginPath();
  for (let i = 0; i < n * 2; i++) { const a = (i / (n * 2)) * Math.PI * 2, r = i % 2 ? r0 : r1; x.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
  x.closePath(); x.fill(); x.restore();
}
// a flexed arm, the kind printed on tubs: fist up, a biceps like a melon (drawn in a 400 x 400 box; ink = the label's ground)
function flexArm(x, ox, oy, s, color, ink) {
  x.save(); x.translate(ox, oy); x.scale(s, s); x.fillStyle = color; x.strokeStyle = color; x.lineCap = 'round'; x.lineJoin = 'round';
  x.lineWidth = 92; x.beginPath(); x.moveTo(54, 304); x.lineTo(290, 302); x.stroke();
  x.lineWidth = 78; x.beginPath(); x.moveTo(298, 292); x.quadraticCurveTo(326, 210, 318, 132); x.stroke();
  x.beginPath(); x.ellipse(164, 238, 100, 80, -0.06, 0, Math.PI * 2); x.fill();
  x.beginPath(); x.roundRect(262, 28, 112, 112, 30); x.fill();
  x.strokeStyle = ink; x.lineWidth = 9;
  x.beginPath(); x.moveTo(262, 238); x.quadraticCurveTo(250, 272, 272, 300); x.stroke();
  for (const yy of [62, 88, 114]) { x.beginPath(); x.moveTo(282, yy); x.lineTo(322, yy); x.stroke(); }
  x.beginPath(); x.moveTo(300, 40); x.quadraticCurveTo(268, 56, 276, 96); x.stroke();
  x.lineWidth = 7; x.beginPath(); x.moveTo(96, 300); x.quadraticCurveTo(170, 322, 236, 300); x.stroke();
  x.restore();
}
// seven-segment digits, slanted, as on a scale's display. text: digits, ' ', '-', '.' attaches to the digit before it
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

// ------------------------------------------------------------------ the products (fictional, no brands): labels as canvases
function tubLabel({ bg, band, word, wordColor, sub, subColor, foot, arm = false, armColor = '#fff' }) {
  return canvasTex(1024, 512, (x, w, h) => {
    x.fillStyle = bg; x.fillRect(0, 0, w, h);
    x.fillStyle = band; x.fillRect(0, 0, w, 54); x.fillRect(0, h - 70, w, 70);
    if (arm) { flexArm(x, 392, 62, 0.64, armColor, bg); txt(x, word, 512, 352, { font: '900 112px Archivo', color: wordColor, track: 4, maxW: 300 }); }
    else txt(x, word, 512, 230, { font: '900 190px Archivo', color: wordColor, track: 2, maxW: 330 });
    txt(x, sub, 512, arm ? 418 : 350, { font: '800 38px Archivo', color: subColor, track: 6, maxW: 320 });
    txt(x, foot, 512, h - 35, { font: '700 30px Archivo', color: '#fff', track: 5, maxW: 300 });
    x.globalAlpha = 0.35; for (let k = 0; k < 9; k++) { x.fillStyle = '#fff'; x.fillRect(90, 120 + k * 30, 170, 6); x.fillRect(w - 260, 120 + k * 30, 170, 6); } x.globalAlpha = 1;
  });
}
function makeTub(r, h, bodyCol, lidCol, tex) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 0.97, h * 0.86, 64, 1, true), phys({ map: tex, roughness: 0.42, clearcoat: 0.5, clearcoatRoughness: 0.25, side: THREE.DoubleSide }));
  body.rotation.y = Math.PI; body.position.y = h * 0.43; g.add(body);
  const base = new THREE.Mesh(new THREE.CircleGeometry(r * 0.97, 48), phys({ color: bodyCol })); base.rotation.x = Math.PI / 2; base.position.y = 0.001; g.add(base);
  const lid = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.03, r * 1.03, h * 0.14, 64), phys({ color: lidCol, roughness: 0.35, clearcoat: 0.6 }));
  lid.position.y = h * 0.86 + h * 0.07; g.add(lid);
  const rib = new THREE.Mesh(new THREE.TorusGeometry(r * 1.03, 0.0016, 8, 96), phys({ color: lidCol, roughness: 0.3 })); rib.rotation.x = Math.PI / 2; rib.position.y = h * 0.86 + 0.004; g.add(rib);
  shadows(g); g.traverse((o) => o.layers.enable(1)); return g;
}
function boxLabel(w, h, draw) { return canvasTex(Math.round(w * 4000), Math.round(h * 4000), draw); }
function makeBox(w, h, d, front, side, top) {
  const sm = phys({ color: side, roughness: 0.55, clearcoat: 0.3 }), tm = phys({ color: top, roughness: 0.55, clearcoat: 0.3 });
  const fm = phys({ map: front, roughness: 0.5, clearcoat: 0.35, clearcoatRoughness: 0.3 });
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), [sm, sm, tm, tm, fm, sm]); m.position.y = h / 2;
  const g = new THREE.Group(); g.add(m); shadows(g); g.traverse((o) => o.layers.enable(1)); g.userData.size = [w, h, d]; return g;
}
function makeBottle(r, h, tex) {
  const g = new THREE.Group(), pts = [];
  const prof = [[0.0, 0], [r * 0.92, 0], [r, 0.01], [r, h * 0.62], [r * 0.96, h * 0.7], [r * 0.45, h * 0.86], [r * 0.4, h * 0.9], [r * 0.4, h * 0.93]];
  for (const [a, b] of prof) pts.push(new THREE.Vector2(a, b));
  const pet = phys({ color: 0xbfd8ea, roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.05, transparent: true, opacity: 0.55, depthWrite: false, side: THREE.DoubleSide });
  g.add(new THREE.Mesh(new THREE.LatheGeometry(pts, 48), pet));
  const water = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.94, r * 0.9, h * 0.62, 32), phys({ color: 0x9ec9e6, roughness: 0.1, transparent: true, opacity: 0.35, depthWrite: false })); water.position.y = h * 0.31 + 0.004; g.add(water);
  const lab = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.004, r * 1.004, h * 0.3, 48, 1, true), phys({ map: tex, roughness: 0.35, clearcoat: 0.6 })); lab.rotation.y = Math.PI; lab.position.y = h * 0.36; g.add(lab);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.43, r * 0.43, h * 0.07, 32), phys({ color: 0x1e5bd8, roughness: 0.4 })); cap.position.y = h * 0.965; g.add(cap);
  shadows(g); g.traverse((o) => o.layers.enable(1)); return g;
}
// the stickers: a red starburst slapped onto the front of a pack (local +z out of the face)
function stickerTex(lines, { sizes = [], colors = [] } = {}) {
  return canvasTex(512, 512, (x) => {
    starburst(x, 256, 256, 206, 250, 18, '#e31b23', 0.1);
    x.save(); x.translate(256, 256); x.rotate(-0.16);
    const n = lines.length, step = n === 3 ? 96 : 104;
    lines.forEach((s, i) => txt(x, s, 0, (i - (n - 1) / 2) * step + 6, { font: `900 ${sizes[i] || 100}px Archivo`, color: colors[i] || '#fff', track: 2, maxW: 380 }));
    x.restore();
  });
}
function makeSticker(parent, tex, r, p, rot) {
  const mat = phys({ map: tex, transparent: true, roughness: 0.3, clearcoat: 0.8, clearcoatRoughness: 0.1 });
  const m = new THREE.Mesh(new THREE.CircleGeometry(r, 48), mat); m.position.copy(p); m.rotation.z = rot; m.visible = false; m.layers.enable(1); parent.add(m);
  return { m, mat, p: p.clone(), rot };
}
function slap(st, t0, t) {   // flies in from the camera's side, squashes flat on the pack, wobbles, stays
  const u = clamp01((t - (t0 - 0.11)) / 0.11); st.m.visible = u > 0; if (!st.m.visible) return;
  const a = t - t0, wob = a > 0 ? 0.16 * Math.exp(-a / 0.11) * Math.sin(a * 46) : 0;
  st.m.position.copy(st.p); st.m.position.z += 0.05 * (1 - u) * (1 - u);
  st.m.scale.setScalar(lerp(1.45, 1, u * u) * (1 + (a > 0 ? 0.06 * Math.exp(-a / 0.05) : 0)));
  st.m.rotation.z = st.rot + 0.5 * (1 - u) + wob; st.mat.opacity = Math.min(1, u * 2);
}
// the breakfast packs: plain coffee, plain flakes, plain pancake mix (until the stickers)
function coffeeTex(w, h) {
  return boxLabel(w, h, (x, cw, ch) => {
    x.fillStyle = '#b48656'; x.fillRect(0, 0, cw, ch);
    for (let k = 0; k < 900; k++) { x.fillStyle = `rgba(${hash(k) > 0.5 ? '255,236,205' : '70,45,22'},${0.06 + 0.06 * hash(k * 3.1)})`; x.fillRect(hash(k * 1.3) * cw, hash(k * 2.7) * ch, 2 + hash(k * 5) * 3, 2 + hash(k * 7) * 3); }
    x.fillStyle = '#16120e'; x.fillRect(0, ch * 0.34, cw, ch * 0.34);
    x.fillStyle = '#3b2716'; for (const [bx, by, r] of [[0.38, 0.2, 0.0], [0.62, 0.2, 0.5]]) { x.save(); x.translate(cw * bx, ch * by); x.rotate(r - 0.4); x.beginPath(); x.ellipse(0, 0, cw * 0.09, cw * 0.13, 0, 0, Math.PI * 2); x.fill(); x.strokeStyle = '#b48656'; x.lineWidth = cw * 0.018; x.beginPath(); x.moveTo(0, -cw * 0.11); x.quadraticCurveTo(cw * 0.03, 0, 0, cw * 0.11); x.stroke(); x.restore(); }
    txt(x, 'COFFEE', cw / 2, ch * 0.475, { font: `900 ${cw * 0.22}px Archivo`, color: '#f3e7d3', track: 3, maxW: cw * 0.86 });
    txt(x, 'DARK ROAST', cw / 2, ch * 0.6, { font: `700 ${cw * 0.075}px Archivo`, color: '#c99a5b', track: 8, maxW: cw * 0.8 });
    txt(x, 'WHOLE BEAN', cw / 2, ch * 0.84, { font: `700 ${cw * 0.07}px Archivo`, color: '#3b2716', track: 8, maxW: cw * 0.8 });
  });
}
function flakesTex(w, h) {
  return boxLabel(w, h, (x, cw, ch) => {
    const g = x.createLinearGradient(0, 0, 0, ch); g.addColorStop(0, '#2b5fd0'); g.addColorStop(1, '#173b8f'); x.fillStyle = g; x.fillRect(0, 0, cw, ch);
    txt(x, 'WHEAT', cw / 2, ch * 0.15, { font: `900 ${cw * 0.2}px Archivo`, color: '#fff', track: 4, maxW: cw * 0.86 });
    txt(x, 'FLAKES', cw / 2, ch * 0.29, { font: `900 ${cw * 0.24}px Archivo`, color: '#ffd23f', track: 4, maxW: cw * 0.88 });
    x.fillStyle = '#f7f3ea'; x.beginPath(); x.ellipse(cw / 2, ch * 0.66, cw * 0.37, ch * 0.12, 0, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#e9e2d2'; x.beginPath(); x.ellipse(cw / 2, ch * 0.7, cw * 0.37, ch * 0.12, 0, 0, Math.PI); x.fill();
    for (let k = 0; k < 46; k++) { x.fillStyle = k % 2 ? '#d99a3a' : '#e8b250'; x.beginPath(); x.ellipse(cw / 2 + (hash(k) - 0.5) * cw * 0.52, ch * 0.635 + (hash(k + 9) - 0.5) * ch * 0.1, cw * 0.042, cw * 0.026, hash(k + 3) * 3, 0, Math.PI * 2); x.fill(); }
    txt(x, 'TOASTED · WHOLE GRAIN', cw / 2, ch * 0.9, { font: `700 ${cw * 0.06}px Archivo`, color: '#cfe0ff', track: 5, maxW: cw * 0.86 });
  });
}
function pancakeTex(w, h) {
  return boxLabel(w, h, (x, cw, ch) => {
    x.fillStyle = '#f6ead2'; x.fillRect(0, 0, cw, ch); x.fillStyle = '#b8322b'; x.fillRect(0, 0, cw, ch * 0.2);
    txt(x, 'PANCAKE', cw / 2, ch * 0.105, { font: `900 ${cw * 0.17}px Archivo`, color: '#fff', track: 4, maxW: cw * 0.86 });
    txt(x, 'MIX', cw / 2, ch * 0.31, { font: `900 ${cw * 0.22}px Archivo`, color: '#6b3a1c', track: 8, maxW: cw * 0.8 });
    for (let k = 0; k < 4; k++) { const y = ch * (0.72 - k * 0.055); x.fillStyle = '#9c5a24'; x.beginPath(); x.ellipse(cw / 2, y + ch * 0.012, cw * 0.32, ch * 0.035, 0, 0, Math.PI * 2); x.fill(); x.fillStyle = '#d8964a'; x.beginPath(); x.ellipse(cw / 2, y, cw * 0.32, ch * 0.033, 0, 0, Math.PI * 2); x.fill(); }
    x.fillStyle = '#f4d98a'; x.fillRect(cw * 0.44, ch * 0.5, cw * 0.12, ch * 0.03);
    x.fillStyle = '#7a3c12'; x.beginPath(); x.ellipse(cw * 0.47, ch * 0.555, cw * 0.18, ch * 0.022, 0.05, 0, Math.PI * 2); x.fill(); x.fillRect(cw * 0.3, ch * 0.56, cw * 0.025, ch * 0.08);
    txt(x, 'JUST ADD MILK', cw / 2, ch * 0.9, { font: `700 ${cw * 0.07}px Archivo`, color: '#6b3a1c', track: 6, maxW: cw * 0.86 });
  });
}
// the gag: a plain carton of eggs. Eggs have always had protein.
function makeEggs() {
  const g = new THREE.Group(), w = 0.158, d = 0.105, h = 0.042;
  const pulpTex = noiseTex(31, 256, 0.72, 1.0, 6);
  const pulp = phys({ color: 0x9d9a90, roughness: 0.97, bumpMap: pulpTex, bumpScale: 1.6, sheen: 0.12, sheenColor: new THREE.Color(0xcfcbc0) });
  const tray = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, 0.006), pulp); tray.position.y = h / 2; g.add(tray);
  for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) {
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.0235, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), pulp);
    dome.scale.set(1.02, 0.58, 0.98); dome.position.set((i - 1) * 0.05, h - 0.003, (j - 0.5) * 0.048); g.add(dome);
  }
  const paper = boxLabel(w - 0.01, 0.034, (x, cw, ch) => {
    x.fillStyle = '#f4efe2'; x.fillRect(0, 0, cw, ch);
    txt(x, 'FARM EGGS', cw * 0.71, ch * 0.38, { font: `800 ${ch * 0.36}px Archivo`, color: '#2d4a2b', track: 3, maxW: cw * 0.5 });
    txt(x, '6 LARGE · FREE RANGE', cw * 0.71, ch * 0.76, { font: `600 ${ch * 0.16}px Archivo`, color: '#55624f', track: 2, maxW: cw * 0.5 });
  });
  const band = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.01, 0.034), phys({ map: paper, roughness: 0.8 })); band.position.set(0, h / 2 + 0.002, d / 2 + 0.0006); g.add(band);
  const st = makeSticker(g, stickerTex(['NOW WITH', 'PROTEIN!', 'NEW'], { sizes: [64, 108, 58], colors: ['#fff', '#fff', '#ffe14a'] }), 0.0305, new THREE.Vector3(-0.045, h / 2 + 0.006, d / 2 + 0.0012), 0);
  shadows(g); g.traverse((o) => o.layers.enable(1)); st.m.castShadow = false; return { g, st };
}

// ------------------------------------------------------------------ the scales
function makeBathScale() {   // dark glass, a red LED readout under it
  const g = new THREE.Group();
  const body = new THREE.Mesh(new RoundedBoxGeometry(SCALE.w, 0.018, SCALE.d, 4, 0.008), phys({ color: 0x15161a, roughness: 0.45, metalness: 0.3 })); body.position.y = 0.011; g.add(body);
  const glass = new THREE.Mesh(new RoundedBoxGeometry(SCALE.w + 0.002, 0.007, SCALE.d + 0.002, 4, 0.0034), phys({ color: 0x0b0c0f, roughness: 0.06, clearcoat: 1, clearcoatRoughness: 0.04, specularIntensity: 0.8 }));
  glass.position.y = SCALE.h - 0.0035; g.add(glass);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const f = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.004, 24), phys({ color: 0x0c0c0e, roughness: 0.8 })); f.position.set(sx * (SCALE.w / 2 - 0.03), 0.002, sz * (SCALE.d / 2 - 0.03)); g.add(f); }
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
  if (glow <= 0.001) { B.tex.needsUpdate = true; return; }
  const on = `rgba(255,${Math.round(70 + 40 * glow)},${Math.round(60 + 30 * glow)},${glow})`, off = `rgba(90,24,26,${0.16 * glow})`;
  seg7(x, text, { x0: 52, y0: 30, w: 66, h: 114, th: 15, gap: 3, on, off, cells: 3, slant: 0.1 });
  x.globalAlpha = glow; txt(x, 'kg', 452, 128, { font: '600 46px Archivo', color: '#ff5a4a', track: 2 }); x.globalAlpha = 1;
  B.tex.needsUpdate = true;
}
function makeKitchenScale() {   // brushed steel, a backlit grey LCD in grams
  const g = new THREE.Group();
  const body = new THREE.Mesh(new RoundedBoxGeometry(0.16, 0.018, 0.17, 4, 0.006), phys({ color: 0xeeeeec, roughness: 0.4, clearcoat: 0.4 })); body.position.y = 0.009; g.add(body);
  const brushed = noiseTex(17, 256, 0.85, 1.0, 1); brushed.repeat.set(1, 30);
  const plate = new THREE.Mesh(new RoundedBoxGeometry(0.15, 0.003, 0.15, 3, 0.0012), phys({ color: 0xc9ccd1, metalness: 1, roughness: 0.32, roughnessMap: brushed })); plate.position.set(0, 0.0195, -0.008); g.add(plate);
  const c = document.createElement('canvas'); c.width = 384; c.height = 128;
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const disp = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 0.02), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
  disp.position.set(0.0, 0.0095, 0.0852); g.add(disp);
  shadows(g); disp.castShadow = false; g.traverse((o) => o.layers.enable(1));
  return { g, c, tex, key: '', top: 0.021 };
}
function drawKitchen(K, grams) {
  const text = String(Math.round(grams)), key = text; if (key === K.key) return; K.key = key;
  const x = K.c.getContext('2d'), w = K.c.width, h = K.c.height;
  x.fillStyle = '#b9c7c4'; x.fillRect(0, 0, w, h);
  const gr = x.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(255,255,255,0.18)'); gr.addColorStop(1, 'rgba(0,0,0,0.12)'); x.fillStyle = gr; x.fillRect(0, 0, w, h);
  seg7(x, text, { x0: 40, y0: 20, w: 46, h: 82, th: 11, gap: 2.4, on: '#15191a', off: 'rgba(20,25,26,0.08)', cells: 4, slant: 0.08 });
  txt(x, 'g', 346, 92, { font: '700 44px Archivo', color: '#15191a' });
  K.tex.needsUpdate = true;
}

// ------------------------------------------------------------------ hands (with wrists; the left forearm turns, so the palm faces in)
// (from hands_block.js: a wrist, a forearm that pronates, fingers that close, mixArm with the wrist)
// ------------------------------------------------------------------ a wrist, and hands that can hold (from film 11, on the wrist)
const HANDBONE = /scaphoid|lunate|triquetral|pisiform|trapezium|trapezoid|capitate|hamate|metacarpal|phalanx of/i;
function makeWrist(R, Side, { pronate = false } = {}) {
  const A = R.arms[Side], low = (m) => { const vs = worldVerts(m); let mn = 9; for (const v of vs) mn = Math.min(mn, v.y); return avgV(vs.filter((v) => v.y < mn + 0.012)); };
  const rad = R.byName.get(`${Side} radius`), uln = R.byName.get(`${Side} ulna`);
  const P = low(rad).lerp(low(uln), 0.5);
  // pronate: the forearm turns as a real one does. The radius, and the hand on it, turn about the line from the middle of
  // the radial head to the middle of the ulnar head; the ulna stays. setWrist's p.pro turns it (radians, + = pronation)
  let host = A.elbow, hp = A.EL, pro = null, proAxis = null;
  if (pronate) {
    const rv = worldVerts(rad), uv = worldVerts(uln); let rt = -9, ub = 9; for (const v of rv) rt = Math.max(rt, v.y); for (const v of uv) ub = Math.min(ub, v.y);
    const RH = avgV(rv.filter((v) => v.y > rt - 0.012)), UH = avgV(uv.filter((v) => v.y < ub + 0.016));
    proAxis = UH.clone().sub(RH).normalize();
    pro = new THREE.Group(); pro.position.copy(RH).sub(A.EL); A.elbow.add(pro); R.pivots.set(pro, RH.clone());
    A.elbow.remove(rad); rad.position.copy(rad.userData.home).sub(RH); pro.add(rad);
    host = pro; hp = RH;
  }
  const g = new THREE.Group(); g.position.copy(P).sub(hp); host.add(g);
  for (const m of [...A.elbow.children]) if (m.isMesh && HANDBONE.test(m.userData.name) && m.userData.name.toLowerCase().includes(Side.toLowerCase())) { A.elbow.remove(m); m.position.copy(m.userData.home).sub(P); g.add(m); }
  return { g, P, s: Side === 'Right' ? -1 : 1, pro, proAxis };
}
const setWrist = (Wr, p) => { Wr.g.rotation.set(p.wf || 0, (p.wr || 0) * Wr.s, (p.wd || 0) * Wr.s, 'YXZ'); if (Wr.pro) Wr.pro.quaternion.setFromAxisAngle(Wr.proAxis, (p.pro || 0) * Wr.s); };   // roll (forearm turn), then flex, then tilt; a pronating forearm turns too
function rigHand(R, Side, Wr) {
  const A = R.arms[Side], side = Side.toLowerCase(), eg = Wr.g, EL = Wr.P, by = (n) => R.byName.get(n);
  const top = (m) => { const vs = worldVerts(m); let mx = -9, mn = 9; for (const v of vs) { mx = Math.max(mx, v.y); mn = Math.min(mn, v.y); } return avgV(vs.filter((v) => v.y > mx - 0.12 * (mx - mn))); };
  const bot = (m) => { const vs = worldVerts(m); let mx = -9, mn = 9; for (const v of vs) { mx = Math.max(mx, v.y); mn = Math.min(mn, v.y); } return avgV(vs.filter((v) => v.y < mn + 0.12 * (mx - mn))); };
  const F = ['index', 'middle', 'ring', 'little'].map((f) => ({ P: by(`Proximal phalanx of ${side} ${f} finger`), M: by(`Middle phalanx of ${side} ${f} finger`), D: by(`Distal phalanx of ${side} ${f} finger`) }));
  const mcpI = top(F[0].P), mcpL = top(F[3].P), fdir = bot(F[1].D).sub(top(F[1].P)).normalize();
  const across = mcpL.clone().sub(mcpI); across.sub(fdir.clone().multiplyScalar(across.dot(fdir))).normalize();
  const n = new THREE.Vector3().crossVectors(fdir, across).normalize(); if (n.z < 0) n.negate();
  const axis = new THREE.Vector3().crossVectors(fdir, n).normalize();   // +angle turns each finger toward the palm (n): the way fingers close
  const joints = [];
  for (const f of F) { const pts = [top(f.P), top(f.M), top(f.D)], gs = []; let parent = eg, pp = EL;
    [f.P, f.M, f.D].forEach((m, i) => { const g = new THREE.Group(); g.position.copy(pts[i]).sub(pp); parent.add(g); m.parent.remove(m); m.position.copy(m.userData.home).sub(pts[i]); g.add(m); gs.push(g); parent = g; pp = pts[i]; }); joints.push(gs); }
  const tP = by(`Proximal phalanx of ${side} thumb`), tD = by(`Distal phalanx of ${side} thumb`), tpt = [top(tP), top(tD)];
  const ttip = bot(tD), tdir = ttip.clone().sub(tpt[0]).normalize(), aim = mcpI.clone().lerp(mcpL, 0.6).add(n.clone().multiplyScalar(0.03)).sub(ttip);
  const taxis = new THREE.Vector3().crossVectors(tdir, aim).normalize(), tg = [];
  { let parent = eg, pp = EL; [tP, tD].forEach((m, i) => { const g = new THREE.Group(); g.position.copy(tpt[i]).sub(pp); parent.add(g); m.parent.remove(m); m.position.copy(m.userData.home).sub(tpt[i]); g.add(m); tg.push(g); parent = g; pp = tpt[i]; }); }
  const mid = mcpI.clone().add(mcpL).multiplyScalar(0.5);
  const handle = mid.clone().addScaledVector(fdir, 0.03).addScaledVector(n, 0.024).sub(EL);
  // prof: how a finger shares its closing between knuckle, middle and end joint (a fist by default; a hand flat on a
  // phone's back that wraps its far edge bends mostly at the middle joints)
  const PROF = [1.25, 1.5, 0.95];
  const setF = (gs, kk, s, pr) => { gs[0].quaternion.setFromAxisAngle(axis, pr[0] * kk * s); gs[1].quaternion.setFromAxisAngle(axis, pr[1] * kk * s); gs[2].quaternion.setFromAxisAngle(axis, pr[2] * kk * s); };
  function curl(k, per = null, tk = null, prof = PROF) {   // per: each finger's own closing [index, middle, ring, little]; tk: the thumb's
    joints.forEach((gs, i) => setF(gs, per ? per[i] : k, 1 + 0.06 * i, prof));
    const t = tk ?? k; tg[0].quaternion.setFromAxisAngle(taxis, 0.55 * t); tg[1].quaternion.setFromAxisAngle(taxis, 0.7 * t);
  }
  // close each finger (and the thumb) on an object until it is `need` off it: sdf(world point) is the distance to the object
  // (+ outside). Returns { per, tk } for curl(); a finger that never meets it closes to kmax
  function fit(sdf, { need = 0.003, kmin = 0.05, kmax = 0.95, prof = PROF, tmin = kmin } = {}) {   // tmin < 0 lets the thumb stand off, away from the palm
    const v = new THREE.Vector3(), samp = (ms) => ms.map((m) => { const P = m.geometry.attributes.position, st = Math.max(1, Math.floor(P.count / 200)), pts = []; for (let i = 0; i < P.count; i += st) pts.push(new THREE.Vector3().fromBufferAttribute(P, i)); return { m, pts }; });
    const gap = (S) => { eg.updateMatrixWorld(true); let g = 9; for (const { m, pts } of S) for (const p of pts) g = Math.min(g, sdf(v.copy(p).applyMatrix4(m.matrixWorld))); return g; };
    // the first contact on the way from open to closed (a finger can pass an object's edge and curl clear of it again,
    // so the whole sweep is scanned, then the contact is found finely)
    const search = (S, set, k0 = kmin) => { set(k0); if (gap(S) < need) return k0; let lo = k0, hi = null;
      for (let j = 1; j <= 24; j++) { const k = k0 + (kmax - k0) * (j / 24); set(k); if (gap(S) < need) { hi = k; break; } lo = k; }
      if (hi === null) return kmax;
      for (let j = 0; j < 12; j++) { const m = (lo + hi) / 2; set(m); if (gap(S) >= need) lo = m; else hi = m; } set(lo); return lo; };
    const per = joints.map((gs, i) => search(samp(gs.map((g) => g.children.find((c) => c.isMesh)).filter(Boolean)), (kk) => setF(gs, kk, 1 + 0.06 * i, prof)));
    const tk = search(samp(tg.map((g) => g.children.find((c) => c.isMesh)).filter(Boolean)), (kk) => { tg[0].quaternion.setFromAxisAngle(taxis, 0.55 * kk); tg[1].quaternion.setFromAxisAngle(taxis, 0.7 * kk); }, tmin);
    return { per, tk };
  }
  const hand = new THREE.Vector3().crossVectors(fdir, across).dot(n) > 0 ? 1 : -1;   // n = hand * (fdir x across)
  return { curl, fit, handle, across: across.clone(), n: n.clone(), fdir: fdir.clone(), eg, hand };
}
function solveHand(R, Side, H, at, init, aims = [], extra = null, starts = null) {   // starts: other initial poses to try (default: a spread for a standing body)   // an arm and wrist pose that puts the hand's grip at a world point, with hand directions (local v) turned toward world ones; extra(A) adds a posture cost
  R.root.updateMatrixWorld(true);
  const A = R.arms[Side], Wr = H.wr, h = new THREE.Vector3(), q = new THREE.Quaternion(), pn = new THREE.Vector3();
  const err = (p) => { poseArm(A, p); setWrist(Wr, p); A.girdle.updateMatrixWorld(true); h.copy(H.handle).applyMatrix4(Wr.g.matrixWorld); let E = h.distanceTo(at);
    if (aims.length) { Wr.g.getWorldQuaternion(q); for (const a of aims) E += a.w * (1 - pn.copy(a.v).applyQuaternion(q).dot(a.to)); }
    if (extra) E += extra(A);
    E += 0.01 * ((p.wf || 0) ** 2 + 2 * (p.wd || 0) ** 2 + 0.5 * (p.wr || 0) ** 2); return E; };
  const descend = (start) => {
    let best = { dir: [...start.dir], twist: start.twist, elbow: start.elbow, wf: start.wf || 0, wd: start.wd || 0, wr: start.wr || 0, retract: 0, elevate: 0 }, bestE = err(best);
    for (const st of [0.25, 0.12, 0.06, 0.03, 0.015, 0.007]) for (let it = 0; it < 40; it++) {
      let improved = false;
      for (const key of ['d0', 'd1', 'd2', 'twist', 'elbow', 'wf', 'wd', 'wr']) for (const sg of [-1, 1]) {
        const c = { ...best, dir: [...best.dir] }; if (key[0] === 'd') c.dir[+key[1]] += sg * st; else c[key] += sg * st * 2; c.elbow = Math.min(2.6, Math.max(0, c.elbow)); c.wf = Math.min(1.1, Math.max(-1.1, c.wf)); c.wd = Math.min(0.4, Math.max(-0.4, c.wd)); c.wr = Math.min(2.2, Math.max(-2.2, c.wr));
        const E = err(c); if (E < bestE) { bestE = E; best = c; improved = true; }
      }
      if (!improved) break;
    }
    return { best, bestE };
  };
  let out = descend(init);
  const tries = starts || [[0.6, 0.8, 0.2], [0.35, 0.7, 0.45], [0.9, 0.35, 0.1], [0.5, 0.5, -0.3], [0.2, -0.2, 0.9]].flatMap((dir) => [-1.2, -0.4, 0.4, 1.2].flatMap((twist) => [1.3, 1.9, 2.4].map((elbow) => ({ dir, twist, elbow }))));
  for (const st of tries) { if (out.bestE < 0.004) break; const r = descend(st); if (r.bestE < out.bestE) out = r; }
  poseArm(A, out.best); setWrist(Wr, out.best); A.girdle.updateMatrixWorld(true); h.copy(H.handle).applyMatrix4(Wr.g.matrixWorld); Wr.g.getWorldQuaternion(q);
  const dbg = { pos: +h.distanceTo(at).toFixed(4), dots: aims.map((a) => +pn.copy(a.v).applyQuaternion(q).dot(a.to).toFixed(3)), at: at.toArray().map((v) => +v.toFixed(3)) };
  return { ...out.best, err: out.bestE, dbg };
}
const FIST = [1.25, 1.5, 0.95], FLAT_WRAP = [0.35, 1.6, 1.25];   // how the fingers close: a fist; flat on a phone's back, bent round its edge
// a hand closing on what it holds: each finger goes from `base` toward its fitted closing, and never further in than that fit
// while the object is there (a finger more closed than its fit would be inside the object)
function gripCurl(H, G, g, base, prof) { H.curl(0, G.per.map((k) => lerp(Math.min(base, k), k, g)), lerp(Math.min(base, G.tk), G.tk, g), prof); }
// the phone (props.js makePhone): a rounded box, its long edges rounded to half its thickness; local y = 0 is the back, Th the
// screen. Signed distance from a point in the phone's own frame (+ outside)
const PHONE = { W: 0.0716, L: 0.1476, Th: 0.0078 };
function phoneSDF(p) {
  const r = PHONE.Th / 2, qx = Math.abs(p.x) - (PHONE.W / 2 - r), qy = Math.abs(p.y - PHONE.Th / 2) - (PHONE.Th / 2 - r), qz = Math.abs(p.z) - (PHONE.L / 2 - r);
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qy, qz), 0) - r;
}
// how far a hand's bones come inside their gap round an object (sdf: world point -> distance, + outside): fingers `finger`,
// palm and wrist `palm` (the flesh that is not drawn). palmOnly skips the fingers (they are closed on the object after)
function handGap(H, sdf, { palm = 0.006, finger = 0.003, palmOnly = false } = {}) {
  if (!H._gapPts) { H._gapPts = []; H.wr.g.traverse((m) => { if (!m.isMesh) return; const P = m.geometry.attributes.position, st = Math.max(1, Math.floor(P.count / 40)), fing = /phalanx/i.test(m.userData.name);
    for (let i = 0; i < P.count; i += st) H._gapPts.push({ m, p: new THREE.Vector3().fromBufferAttribute(P, i), fing }); }); }
  const v = new THREE.Vector3(); let E = 0, worst = 0, who = '';
  for (const q of H._gapPts) { if (palmOnly && q.fing) continue; const d = (q.fing ? finger : palm) - sdf(v.copy(q.p).applyMatrix4(q.m.matrixWorld)); if (d > 0) { E += d; if (d > worst) { worst = d; who = q.m.userData.name; } } }
  return { E, worst, who };
}
// a posture cost that keeps an arm out of ellipsoids (world centre c, semi-axes r, the bone's own thickness included):
// samples the upper arm (from a quarter of the way down, the shoulder itself sits where it sits), the forearm and the hand
function keepOut(R, Side, H, zones, w = 3) {
  const A = R.arms[Side], s = new THREE.Vector3(), e = new THREE.Vector3(), wr = new THREE.Vector3(), g = new THREE.Vector3(), p = new THREE.Vector3();
  const f = (arm) => { A.arm.getWorldPosition(s); A.elbow.getWorldPosition(e); H.wr.g.getWorldPosition(wr); g.copy(H.handle).applyMatrix4(H.wr.g.matrixWorld);
    let E = 0;
    for (const [a, b, n, u0] of [[s, e, 10, 0.25], [e, wr, 10, 0], [wr, g, 4, 0]]) for (let i = 0; i <= n; i++) { p.lerpVectors(a, b, u0 + (1 - u0) * i / n);
      for (const z of zones) { const q = Math.hypot((p.x - z.c.x) / z.r.x, (p.y - z.c.y) / z.r.y, (p.z - z.c.z) / z.r.z); if (q < 1) E += w * (1 - q); } }
    return E; };
  return f;
}
const mixArm = (a, b, k) => ({ dir: a.dir.map((v, i) => lerp(v, b.dir[i], k)), twist: lerp(a.twist, b.twist, k), elbow: lerp(a.elbow, b.elbow, k), wf: lerp(a.wf || 0, b.wf || 0, k), wd: lerp(a.wd || 0, b.wd || 0, k), wr: lerp(a.wr || 0, b.wr || 0, k), pro: lerp(a.pro || 0, b.pro || 0, k), retract: 0, elevate: 0, mix: [a, b, k] });



// a 6 kg hex dumbbell: rubber heads, a knurled chrome handle; its axis along local x
function makeDumbbell() {
  const g = new THREE.Group(), rubber = phys({ color: 0x17181b, roughness: 0.62, clearcoat: 0.25, clearcoatRoughness: 0.5 });
  const chrome = phys({ color: 0xd0d3d8, metalness: 1, roughness: 0.24, clearcoat: 0.4 });
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.0145, 0.0145, 0.135, 32), chrome); handle.rotation.z = Math.PI / 2; g.add(handle);
  for (const s of [-1, 1]) {
    const head = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.052, 0.06, 6), rubber); head.rotation.z = Math.PI / 2; head.position.x = s * 0.0975; g.add(head);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.062, 24), chrome); cap.rotation.z = Math.PI / 2; cap.position.x = s * 0.0975; g.add(cap);
    const coll = new THREE.Mesh(new THREE.CylinderGeometry(0.021, 0.021, 0.008, 32), chrome); coll.rotation.z = Math.PI / 2; coll.position.x = s * 0.064; g.add(coll);
  }
  shadows(g); g.traverse((o) => o.layers.enable(1));
  return g;
}
const capX = (v, cx, h, r) => { const qx = Math.abs(v.x - cx) - h, qr = Math.hypot(v.y, v.z) - r; return Math.hypot(Math.max(qx, 0), Math.max(qr, 0)) + Math.min(Math.max(qx, qr), 0); };
const dbSDF = (v) => Math.min(capX(v, 0, 0.0675, 0.0145), capX(v, 0.0975, 0.03, 0.052), capX(v, -0.0975, 0.03, 0.052), capX(v, 0.064, 0.004, 0.021), capX(v, -0.064, 0.004, 0.021));
function restGeo(m) {   // an atlas mesh in the standing frame, float normals
  const g = new THREE.BufferGeometry(), h = m.userData.home, P = m.geometry.attributes.position, N = m.geometry.attributes.normal;
  const p = new Float32Array(P.count * 3), n = new Float32Array(P.count * 3);
  for (let i = 0; i < P.count; i++) { p[i * 3] = P.getX(i) + h.x; p[i * 3 + 1] = P.getY(i) + h.y; p[i * 3 + 2] = P.getZ(i) + h.z; n[i * 3] = N.getX(i); n[i * 3 + 1] = N.getY(i); n[i * 3 + 2] = N.getZ(i); }
  g.setAttribute('position', new THREE.BufferAttribute(p, 3)); g.setAttribute('normal', new THREE.BufferAttribute(n, 3)); g.setIndex(m.geometry.index.clone());
  return g;
}
// the muscles are built by a band of light running down them (uSweep: the height, standing frame, above which they exist)
function sweepPatch(m, U, depth = false) {
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uSweep = U;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec3 rest;\nvarying float vRestY;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvRestY = rest.y;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform float uSweep;\nvarying float vRestY;').replace('void main() {', 'void main() {\n  if (vRestY < uSweep) discard;');
    if (!depth) sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n  totalEmissiveRadiance += vec3(1.0, 0.42, 0.38) * 2.0 * exp(-pow((vRestY - uSweep) / 0.016, 2.0));');
  };
  m.customProgramCacheKey = () => 'sweep' + (depth ? 'D' : 'M');
}

// ------------------------------------------------------------------ the dials: every day (it becomes the logo) and training (a hard stop at 1.6)
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
    shadows(g); g.traverse((o) => o.layers.enable(1)); scene.add(g);
    out.push({ g, knob, set, setMat, face, angle: (v) => -Math.PI * 0.75 + v * Math.PI * 1.5 });
  }
  const d = out[1], a16 = d.angle(0.8);
  d.pinMat = glowMat(ORANGE); d.pinMat.transparent = true; d.pinMat.opacity = 0;
  d.pin = new THREE.Mesh(new THREE.CylinderGeometry(0.0055, 0.0055, 0.016, 24), d.pinMat); d.pin.position.set(Math.sin(a16) * 0.103, 0.012, -Math.cos(a16) * 0.103); d.g.add(d.pin);
  return out;
}
function stopBounce(u) {   // how far below the stop the training dial sits while it is thrown at it (0 = at the stop)
  let d = 0;
  for (const [a, k] of [[0, 1], [0.62, 0.6]]) {
    const w = u - a; if (w < 0) continue;
    if (w < 0.3) d = Math.max(d, 0.045 * k * s5(0, 0.18, w) * (1 - s5(0.18, 0.3, w)));
    else d = Math.max(d, 0.016 * k * Math.abs(Math.sin((Math.PI * (w - 0.3)) / 0.12)) * Math.exp(-(w - 0.3) / 0.12));
  }
  return d;
}

// ------------------------------------------------------------------ real food, one bowl each (no amounts claimed for any one food; the four take 112 g between them)
const mulberry = (seed) => () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const BOWL_PROF = [[0.0, 0.0], [0.04, 0.0], [0.046, 0.005], [0.064, 0.026], [0.074, 0.05], [0.0755, 0.054], [0.0725, 0.0555], [0.069, 0.052], [0.058, 0.03], [0.046, 0.0145], [0.04, 0.0125], [0.0, 0.0125]];
const FOOD_TOP = [0.056, 0.059, 0.052, 0.074];                       // where the cubes meet each food (bowl frame)
function domeGeo(rs, ys) { return new THREE.LatheGeometry(rs.map((r, i) => new THREE.Vector2(r, ys[i])), 64); }
function makeFood(kind) {
  const g = new THREE.Group(), rnd = mulberry(11 + kind);
  if (kind === 0) {   // eggs
    const pts = []; for (let i = 0; i <= 28; i++) { const th = (i / 28) * Math.PI; pts.push(new THREE.Vector2(Math.max(1e-4, 0.0195 * Math.sin(th) * (1 + 0.1 * Math.cos(th))), -0.026 * Math.cos(th))); }
    const geo = new THREE.LatheGeometry(pts, 40), shell = phys({ color: 0xd8b48c, roughness: 0.62, bumpMap: noiseTex(5, 256, 0.9, 1.0, 3), bumpScale: 0.4, sheen: 0.2, sheenColor: new THREE.Color(0xfff0dc) });
    for (const [x, z, ry] of [[-0.0205, -0.0265, 0.08], [0.0205, -0.0265, -0.06], [-0.0205, 0.0265, -0.05], [0.0205, 0.0265, 0.1]]) {
      const e = new THREE.Mesh(geo, shell); e.rotation.set(0, ry, Math.PI / 2); e.position.set(x, 0.0125 + 0.0205, z); g.add(e);
    }
  } else if (kind === 1) {   // chickpeas, heaped
    const tex = noiseTex(9, 128, 0.8, 1.0, 2), mat = phys({ color: 0xd8b07a, roughness: 0.6, bumpMap: tex, bumpScale: 0.6, sheen: 0.25, sheenColor: new THREE.Color(0xffe8c4) });
    const P = []; for (const [y0, sp] of [[0.0, 0.0084], [-0.0075, 0.0084]]) for (let j = -8; j <= 8; j++) for (let i = -8; i <= 8; i++) {
      const x = (i + (j & 1) * 0.5) * sp + (rnd() - 0.5) * 0.002, z = j * sp * 0.866 + (rnd() - 0.5) * 0.002, r = Math.hypot(x, z); if (r > 0.058) continue;
      P.push([x, 0.046 + 0.012 * (1 - (r / 0.06) ** 2) + y0 + (rnd() - 0.5) * 0.002, z]); }
    const im = new THREE.InstancedMesh(new THREE.SphereGeometry(0.0046, 12, 9), mat, P.length), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3();
    P.forEach((p, i) => { q.setFromEuler(new THREE.Euler(rnd() * 6, rnd() * 6, rnd() * 6)); s.set(1 + (rnd() - 0.5) * 0.18, 0.9 + (rnd() - 0.5) * 0.12, 1 + (rnd() - 0.5) * 0.18); m4.compose(new THREE.Vector3(...p), q, s); im.setMatrixAt(i, m4); });
    g.add(im);
  } else if (kind === 2) {   // Greek yoghurt and blueberries
    g.add(new THREE.Mesh(domeGeo([0.0, 0.025, 0.045, 0.06, 0.0662], [0.0505, 0.0498, 0.0482, 0.0462, 0.0448]), phys({ color: 0xf3efe6, roughness: 0.36, clearcoat: 0.3, clearcoatRoughness: 0.4, sheen: 0.3, sheenColor: new THREE.Color(0xffffff), bumpMap: noiseTex(13, 256, 0.9, 1.0, 2), bumpScale: 0.25 })));
    const berry = phys({ color: 0x2a2f5a, roughness: 0.42, clearcoat: 0.3, sheen: 0.6, sheenColor: new THREE.Color(0x8a96d8) });
    for (let k = 0; k < 11; k++) { const a = k * 2.4, r = 0.006 + 0.0042 * Math.sqrt(k) * 1.6; const b = new THREE.Mesh(new THREE.SphereGeometry(0.0055, 16, 12), berry); b.position.set(0.012 + Math.cos(a) * r, 0.0545, -0.006 + Math.sin(a) * r * 0.8); b.scale.set(1, 0.86, 1); g.add(b); }
  } else {   // a salmon fillet on rice
    const rice = phys({ color: 0xf2f0ea, roughness: 0.7, bumpMap: noiseTex(21, 256, 0.6, 1.0, 9), bumpScale: 1.2, sheen: 0.2, sheenColor: new THREE.Color(0xffffff) });
    g.add(new THREE.Mesh(domeGeo([0.0, 0.03, 0.05, 0.062, 0.0675], [0.056, 0.0545, 0.051, 0.0475, 0.046]), rice));
    const tex = canvasTex(512, 256, (x, w, h) => { x.fillStyle = '#ee8a6c'; x.fillRect(0, 0, w, h); for (let k = 0; k < 9; k++) { x.strokeStyle = 'rgba(255,226,212,0.85)'; x.lineWidth = 7 + 4 * hash(k); x.beginPath(); const x0 = (k / 8) * w * 1.1 - 40; x.moveTo(x0, -10); x.quadraticCurveTo(x0 + 40, h * 0.5, x0 - 10, h + 10); x.stroke(); } x.fillStyle = 'rgba(200,90,60,0.25)'; x.fillRect(0, h * 0.82, w, h * 0.18); });
    const f = new THREE.Mesh(new RoundedBoxGeometry(0.094, 0.019, 0.046, 3, 0.007), phys({ map: tex, roughness: 0.45, clearcoat: 0.35, clearcoatRoughness: 0.3, sheen: 0.3, sheenColor: new THREE.Color(0xffc8b4) }));
    f.position.set(0.002, 0.0645, 0.002); f.rotation.y = 0.45; g.add(f);
  }
  g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; o.layers.enable(1); } });
  return g;
}

// ------------------------------------------------------------------ the cubes: one per gram, an instanced set
const ORDER = (() => { const r = mulberry(5), o = []; for (let L = 0; L < 14; L++) { const a = [0, 1, 2, 3, 4, 5, 6, 7, 8]; for (let i = 8; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } o.push(a); } o[12] = [4, 1, 3, 5, 7, 0, 2, 6, 8]; return o; })();   // the top layer at 112 g: the middle first, so what lands there has a cube to land on
function colSlot(i) { const L = Math.floor(i / 9), s = ORDER[L][i % 9], gx = (s % 3) - 1, gz = Math.floor(s / 3) - 1; return new THREE.Vector3(COL.x + gx * PITCH, PITCH * L + CUBE / 2 + 0.0002, COL.z + gz * PITCH); }
const colTop = (n) => PITCH * Math.ceil(n / 9);
// the bathroom scale counts up to 70.0 kg from "point eight", slowly out of zero (the first cubes one by one); a cube lands
// for every 1.2 kg (0.83 g per kg: 58 at 70). Then, for "above 1.6 g per kilo", the rest pour in up to 112
const KG0 = 17.95, KG1 = 25.3, POUR0 = 40.75, POUR1 = 42.35;
const kgAt = (t) => 70 * ss(KG0, KG1, t);
const kgInv = (kg) => { let lo = KG0, hi = KG1; for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; if (kgAt(m) < kg) lo = m; else hi = m; } return hi; };
const LAND = (() => {
  const a = new Float32Array(N_COL);
  for (let i = 0; i < 58; i++) a[i] = kgInv((i + 1) / 0.83);
  for (let i = 58; i < N_COL; i++) { const u = (i - 58) / (N_COL - 59); a[i] = lerp(POUR0, POUR1, 0.55 * u + 0.45 * s5(0, 1, u)); }
  return a;
})();
const DROP = 0.3;
let OVER = null;
const makeOver = () => {   // 30 more cubes past 1.6 g per kg land on the top and tumble off to the floor
  const r = mulberry(77), out = [], rest = [];
  const ok = (p) => { if (Math.abs(p.x - COL.x) < 0.04 && Math.abs(p.z - COL.z) < 0.04) return false; if (p.x < SCALE.w / 2 + 0.03) return false; for (const q of rest) if (Math.hypot(p.x - q.x, p.z - q.z) < 0.022) return false; return true; };
  for (let k = 0; k < N_OVER; k++) {
    let p; for (let tries = 0; tries < 400; tries++) { const a = lerp(-1.2, 2.3, r()), d = 0.05 + 0.1 * Math.pow(r(), 0.8); p = new THREE.Vector3(COL.x + Math.sin(a) * d, CUBE / 2 + 0.0002, COL.z + Math.cos(a) * d); if (ok(p)) break; }
    rest.push(p);
    const edge = new THREE.Vector3(p.x - COL.x, 0, p.z - COL.z).normalize();
    out.push({ t0: 42.95 + k * 0.046 + 0.02 * (r() - 0.5), rest: p, yaw: r() * Math.PI * 2, edge, hit: new THREE.Vector3(COL.x + edge.x * 0.012 + (r() - 0.5) * 0.01, 0, COL.z + edge.z * 0.012 + (r() - 0.5) * 0.01), spin: (0.5 + r()) * Math.PI * (r() < 0.5 ? -1 : 1), axis: new THREE.Vector3(-edge.z, 0, edge.x) });
  }
  return out;
};
// the meals: the column is dealt round the four bowls from the top down, 28 each, and each cube sinks into the food
const DEAL0 = 53.0, DEAL_DT = 0.018, FLY = 0.5, SINK = 0.16;
const dealT = (i) => DEAL0 + (N_COL - 1 - i) * DEAL_DT;
const dealOff = (j) => { const a = j * 2.39996, r = 0.026 * Math.sqrt((j + 0.5) / 28); return new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r); };
function dealDst(b, j, out) {   // where a cube meets the food: spread over the bowl, or over the fillet (turned 0.45 rad) in the salmon bowl
  const o = dealOff(j);
  if (b === 3) { const lx = o.x * 1.5, lz = o.z * 0.65, c = Math.cos(0.45), sn = Math.sin(0.45); out.set(0.002 + lx * c + lz * sn, 0, 0.002 - lx * sn + lz * c); } else out.copy(o);
  out.add(BOWLS[b]); out.y = FOOD_TOP[b] + CUBE / 2; return out;
}
const BOWL_T0 = 50.85, FOOD_T = [51.92, 52.06, 52.2, 52.34];

const _m4 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _e = new THREE.Euler(), _s = new THREE.Vector3(), _p = new THREE.Vector3(), _v = new THREE.Vector3();
const UPY = new THREE.Vector3(0, 1, 0);
function cubeAt(i, t, out) {   // -> { p, q, s } or null when not there
  if (i < N_COL) {
    const tl = LAND[i]; if (t < tl - DROP) return null;
    const home = colSlot(i), yaw0 = (hash(i * 7.31) - 0.5) * 0.9, td = dealT(i);
    if (t < td) {   // falling, then a tiny settle
      const k = clamp01((t - (tl - DROP)) / DROP), fall = k * k;
      out.p.copy(home); out.p.y += 0.07 * (1 - fall) + 0.0025 * Math.sin(Math.PI * clamp01((t - tl) / 0.09)) * (t > tl ? 1 : 0);
      out.q.setFromAxisAngle(UPY, yaw0 * (1 - s5(0, 1, k))); out.s = lerp(0.55, 1, outBack(clamp01(k * 1.25), 1.2)); return out;
    }
    const b = i % 4, j = Math.floor(i / 4), dst = dealDst(b, j, _v);
    const u = clamp01((t - td) / FLY), e = s5(0, 1, u), apex = Math.max(home.y, dst.y) + 0.12 + 0.04 * hash(i * 3.3);
    out.p.lerpVectors(home, dst, e); out.p.y = lerp(home.y, dst.y, e) + (apex - lerp(home.y, dst.y, e)) * Math.sin(Math.PI * e);
    out.q.setFromAxisAngle(_p.set(hash(i * 1.7) - 0.5, 0.3, hash(i * 2.9) - 0.5).normalize(), Math.PI * 2 * e);
    out.s = 1;
    if (u >= 1) { const k = clamp01((t - td - FLY) / SINK); if (k >= 1) return null; out.p.y -= 0.016 * s5(0, 1, k); out.s = 1 - s5(0, 1, k); }
    return out;
  }
  const O = OVER[i - N_COL]; if (t < O.t0) return null;
  const yTop = colTop(N_COL) + CUBE / 2, t1 = O.t0 + 0.26, t2 = t1 + 0.34;
  if (t < t1) { const k = clamp01((t - O.t0) / 0.26); out.p.copy(O.hit); out.p.y = yTop + 0.09 * (1 - k * k); out.q.setFromAxisAngle(UPY, O.yaw * 0.3 * (1 - k)); out.s = lerp(0.6, 1, outBack(clamp01(k * 1.3), 1.2)); return out; }
  if (t < t2) {
    const k = (t - t1) / 0.34, x = lerp(O.hit.x, O.rest.x, k), z = lerp(O.hit.z, O.rest.z, k);
    const y = lerp(yTop, O.rest.y, k * k) + 0.03 * Math.sin(Math.PI * k) * (1 - k);
    out.p.set(x, y, z); out.q.setFromAxisAngle(O.axis, O.spin * s5(0, 1, k)).premultiply(_q2.setFromAxisAngle(UPY, O.yaw * s5(0, 1, k))); out.s = 1; return out;
  }
  out.p.copy(O.rest); out.p.y += 0.004 * Math.abs(Math.sin(Math.PI * clamp01((t - t2) / 0.12))) * (t - t2 < 0.12 ? 1 : 0);
  const qt = Math.round(O.spin / (Math.PI / 2)) * (Math.PI / 2), w = s5(t2, t2 + 0.12, t);   // settle flat: the nearest quarter turn
  out.q.setFromAxisAngle(O.axis, lerp(O.spin, qt, w)).premultiply(_q2.setFromAxisAngle(UPY, O.yaw));
  out.s = 1; return out;
}

// ------------------------------------------------------------------ build
async function build(S, cfg) {
  const scene = S.scene;
  W.skins = [];
  S.fog.near = 4; S.fog.far = 14;
  S.table.scale.set(3, 3, 1); S.tableMat.clearcoat = 0.06; S.tableMat.specularIntensity = 0.3;
  for (const m of [S.tableMat.map, S.tableMat.roughnessMap]) if (m) { m.wrapS = m.wrapT = THREE.RepeatWrapping; m.repeat.multiplyScalar(3); }
  // ---- the skeleton, its kidneys (hidden until the end), standing on the scale
  const KID = /^(left|right) kidney$|^(left|right) ureter$|^urinary bladder$/i;
  const meshes = await loadAnatomy(skeletonKind((p) => (KID.test(p.name) ? 'kidney' : undefined)));
  W.rig = buildRig(meshes, { assign: (n) => (/kidney|ureter/i.test(n) ? 'Second lumbar vertebra' : null) });
  scene.add(W.rig.root);
  for (const m of meshes) { m.castShadow = true; m.receiveShadow = true; m.layers.enable(1); }
  const R = W.rig;
  W.kidneys = meshes.filter((m) => m.userData.tissue === 'kidney');
  for (const m of W.kidneys) { m.material.transparent = true; m.material.opacity = 0; m.visible = false; m.castShadow = false; m.material.emissive.set(0xd04a3c); }
  const ground = Math.min(R.legs.Right.ground, R.legs.Left.ground);
  R.root.position.y = SCALE.h - ground;
  const heelZ = Math.min(R.legs.Right.heel.z, R.legs.Left.heel.z), toeZ = Math.max(R.legs.Right.toeZ, R.legs.Left.toeZ);
  W.scaleZ = (heelZ + toeZ) / 2 - 0.005;
  COL.z = W.scaleZ + 0.105; OVER = makeOver();
  // ---- hands with wrists; the left forearm pronates (it curls palm in)
  W.hand = {};
  for (const Side of ['Right', 'Left']) { const Wr = makeWrist(R, Side, { pronate: Side === 'Left' }); W.hand[Side] = rigHand(R, Side, Wr); W.hand[Side].wr = Wr; }
  { const H = W.hand.Left, db = makeDumbbell(); db.matrixAutoUpdate = false; db.visible = false; scene.add(db);
    db.userData.hm = new THREE.Matrix4().compose(H.handle.clone().addScaledVector(H.across, -0.006), new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1, 0, 0), H.across), new THREE.Vector3(1, 1, 1));   // the bar 6 mm toward the thumb's side
    db.userData.mats = []; db.traverse((o) => { if (o.isMesh && !db.userData.mats.includes(o.material)) { o.material.transparent = true; db.userData.mats.push(o.material); } });
    H.db = db; }
  // ---- the arms' muscles (biceps, brachialis, triceps, coracobrachialis, deltoid), skinned to the girdle, the upper arm and
  //      the forearm; the left biceps' tendon follows the turning radius it ends on
  const armSoft = await loadAnatomy((p) => (/(biceps brachii|brachialis|triceps brachii|coracobrachialis|deltoid)/i.test(p.name) && /\b(right|left)\b/i.test(p.name) ? 'muscle' : null));
  W.sweep = { value: 9 }; W.armMat = {}; W.armMeshes = [];
  for (const Side of ['Right', 'Left']) { const m = tissueMat('muscle'); m.emissive.set(0xe02a20); m.emissiveIntensity = 0.02; sweepPatch(m, W.sweep); W.armMat[Side] = m; }   // a working muscle glows red (orange is kept for the settings)
  W.armDepth = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking }); sweepPatch(W.armDepth, W.sweep, true);
  const sideOf = (n) => (/\bright\b/i.test(n) ? 'Right' : 'Left');
  let my0 = 9, my1 = -9;
  for (const m of armSoft) {
    const Side = sideOf(m.userData.name), A = R.arms[Side], Wr = W.hand[Side].wr;
    for (const v of worldVerts(m, 7)) { my0 = Math.min(my0, v.y); my1 = Math.max(my1, v.y); }
    let bind = armBinder(R, Side);
    if (Wr.pro && /biceps/i.test(m.userData.name)) { const base = bind; bind = (p, n) => (p.y > A.EL.y - 0.02 ? base(p, n) : [A.elbow, Wr.pro, ss(A.EL.y - 0.02, A.EL.y - 0.04, p.y)]); }   // (armBinder is all forearm below EL - 2 cm: no seam)
    const sk = skinned(restGeo(m), bind, R, W.armMat[Side]); sk.mesh.castShadow = sk.mesh.receiveShadow = true; sk.mesh.layers.enable(1); sk.mesh.visible = false; sk.mesh.customDepthMaterial = W.armDepth; scene.add(sk.mesh);
    W.skins.push(sk); W.armMeshes.push(sk.mesh);
  }
  W.musY = [my0, my1];
  // ---- the factory stamp: printed down the front of the left shin bone, like a part number on a tube
  { const tib = R.byName.get('Left tibia');
    W.stampSpot = stampLine(tib, { a: [0.15, 0.09, 0.26], b: [0.15, -0.07, 0.26], dir: [-0.5, 0, -0.87], top: [1, 0, 0] });
    if (W.stampSpot) W.stamp = stamp(tib, { canvas: labelCanvas('HUMAN FACTORY SETTINGS'), center: W.stampSpot.center, normal: W.stampSpot.normal, up: W.stampSpot.up, width: 0.13, depth: 0.03, opacity: 0.6 }); }
  // ---- the bathroom scale under the feet
  W.bath = makeBathScale(); W.bath.g.position.set(0, 0, W.scaleZ); scene.add(W.bath.g);
  W.auditSolids = [['bath scale', W.bath.g]];
  // ---- the end-cap: a dark steel gondola, white label rails, a header; packs on four shelves
  { const steel = phys({ color: 0x1c1e22, roughness: 0.5, metalness: 0.4, clearcoat: 0.2 }), rail = phys({ color: 0xe8e6e0, roughness: 0.5, clearcoat: 0.3 });
    const g = new THREE.Group(), w = SHELF.x1 - SHELF.x0, d = SHELF.zf - SHELF.zb, cx = (SHELF.x0 + SHELF.x1) / 2, cz = (SHELF.zf + SHELF.zb) / 2;
    for (const sx of [SHELF.x0 - 0.011, SHELF.x1 + 0.011]) { const side = new THREE.Mesh(new THREE.BoxGeometry(0.022, SHELF.top, d + 0.02), steel); side.position.set(sx, SHELF.top / 2, cz); g.add(side); }
    const back = new THREE.Mesh(new THREE.BoxGeometry(w + 0.044, SHELF.top, 0.012), steel); back.position.set(cx, SHELF.top / 2, SHELF.zb - 0.006); g.add(back);
    const peg = noiseTex(41, 256, 0.9, 1.0, 1); back.material = phys({ color: 0x23262b, roughness: 0.6, metalness: 0.3, bumpMap: peg, bumpScale: 0.3 });
    for (const y of SHELF.y) { const b = new THREE.Mesh(new THREE.BoxGeometry(w, 0.02, d), steel); b.position.set(cx, y - 0.01, cz); g.add(b);
      const r = new THREE.Mesh(new THREE.BoxGeometry(w, 0.034, 0.008), rail); r.position.set(cx, y - 0.019, SHELF.zf + 0.004); g.add(r); }
    const kick = new THREE.Mesh(new THREE.BoxGeometry(w, 0.1, 0.01), steel); kick.position.set(cx, 0.05, SHELF.zf - 0.02); g.add(kick);
    const hdr = canvasTex(1536, 384, (x, cw, ch) => { x.fillStyle = '#111215'; x.fillRect(0, 0, cw, ch); txt(x, 'PROTEIN', cw / 2, ch * 0.54, { font: '900 250px Archivo', color: '#f1efe9', track: 30, maxW: cw * 0.86 }); });
    const header = new THREE.Mesh(new THREE.BoxGeometry(w + 0.044, 0.15, 0.03), [steel, steel, steel, steel, phys({ map: hdr, roughness: 0.4, emissive: new THREE.Color(0xffffff), emissiveMap: hdr, emissiveIntensity: 0.25 }), steel]);
    header.position.set(cx, SHELF.top + 0.075, SHELF.zf - 0.02); g.add(header);
    shadows(g); g.traverse((o) => o.layers.enable(1)); scene.add(g); W.shelf = g;
    const put = (obj, x, k, z = -0.17, ry = 0) => { obj.position.set(x, SHELF.y[k], z); obj.rotation.y = ry; scene.add(obj); return obj; };
    // top shelf: three tubs of whey
    put(makeTub(0.068, 0.2, 0x111114, 0xd8262e, tubLabel({ bg: '#121215', band: '#d8262e', word: 'WHEY', wordColor: '#ffffff', sub: '100% PROTEIN', subColor: '#ff4a52', foot: '2 kg' })), 0.615, 3);
    put(makeTub(0.068, 0.2, 0x111114, 0xd8262e, tubLabel({ bg: '#121215', band: '#d8262e', word: 'WHEY', wordColor: '#ffffff', sub: '100% PROTEIN', subColor: '#ff4a52', foot: '2 kg' })), 0.79, 3, -0.17, 0.25);
    put(makeTub(0.072, 0.21, 0xf2f2f0, 0x1d5bd6, tubLabel({ bg: '#f4f4f2', band: '#1d5bd6', word: 'ISO', wordColor: '#1d5bd6', sub: 'ULTRA PROTEIN', subColor: '#11131a', foot: '1.8 kg' })), 0.98, 3, -0.17, -0.2);
    // eye level: the kitchen scale (weighing nothing yet), the big tub with the arm, the eggs
    W.ks = makeKitchenScale(); put(W.ks.g, KS.x, 2, KS.z);
    W.massTub = put(makeTub(0.086, 0.27, 0x0c0c0d, 0xe2b13a, tubLabel({ bg: '#0c0c0e', band: '#e2b13a', word: 'MASS', wordColor: '#e2b13a', sub: 'MUSCLE GAINER', subColor: '#ffffff', foot: '5 kg', arm: true })), 0.832, 2, -0.18);
    W.eggs = makeEggs(); put(W.eggs.g, 1.022, 2, -0.15, -0.06);
    // the second shelf: breakfast, plain (until the stickers)
    const PROT = stickerTex(['+', 'PROTEIN'], { sizes: [150, 100] });
    W.packs = [];
    const pack = (tex, w, h, d, side, top, x, ry, sp, sr) => { const b = put(makeBox(w, h, d, tex, side, top), x, 1, -0.17, ry); const st = makeSticker(b, PROT, sr, new THREE.Vector3(sp[0], sp[1], d / 2 + 0.0012), sp[2]); W.packs.push({ g: b, st, w, h, d }); return b; };
    pack(coffeeTex(0.104, 0.17), 0.104, 0.17, 0.055, 0xb48656, 0x8c6640, 0.605, 0.07, [0.022, 0.128, -0.12], 0.027);
    pack(flakesTex(0.18, 0.27), 0.18, 0.27, 0.065, 0x173b8f, 0x2b5fd0, 0.78, -0.04, [0.046, 0.205, 0.1], 0.034);
    pack(pancakeTex(0.14, 0.21), 0.14, 0.21, 0.055, 0xb8322b, 0xf6ead2, 0.965, 0.06, [0.042, 0.088, -0.08], 0.03);
    // the bottom shelf: protein bars, protein water, protein pasta
    const barTex = boxLabel(0.2, 0.09, (x, cw, ch) => { x.fillStyle = '#ffd21a'; x.fillRect(0, 0, cw, ch); x.fillStyle = '#7a3cff'; x.fillRect(0, ch * 0.66, cw, ch * 0.34);
      txt(x, 'PROTEIN BAR', cw / 2, ch * 0.34, { font: `900 ${ch * 0.36}px Archivo`, color: '#2a1158', track: 2, maxW: cw * 0.9 }); txt(x, '12 × 60 g', cw / 2, ch * 0.84, { font: `700 ${ch * 0.18}px Archivo`, color: '#fff', track: 6 }); });
    put(makeBox(0.2, 0.09, 0.1, barTex, 0xffd21a, 0x2a1158), 0.64, 0, -0.16);
    const watTex = canvasTex(512, 256, (x, cw, ch) => { x.fillStyle = '#e9f6ff'; x.fillRect(0, 0, cw, ch); x.fillStyle = '#17a0e6'; x.fillRect(0, ch * 0.72, cw, ch * 0.28);
      txt(x, 'PROTEIN', cw / 2, ch * 0.3, { font: '900 66px Archivo', color: '#0b5ea8', track: 3, maxW: 200 }); txt(x, 'WATER', cw / 2, ch * 0.56, { font: '800 44px Archivo', color: '#17a0e6', track: 10, maxW: 200 }); txt(x, '20 g', cw / 2, ch * 0.86, { font: '700 30px Archivo', color: '#fff', track: 4 }); });
    for (const [x, ry] of [[0.8, 0.1], [0.872, -0.05]]) put(makeBottle(0.031, 0.21, watTex), x, 0, -0.15, ry);
    const pstTex = boxLabel(0.12, 0.24, (x, cw, ch) => { x.fillStyle = '#1a2a6c'; x.fillRect(0, 0, cw, ch); x.fillStyle = '#f2c14e'; x.fillRect(0, ch * 0.42, cw, ch * 0.2);
      txt(x, 'PROTEIN', cw / 2, ch * 0.18, { font: `900 ${cw * 0.24}px Archivo`, color: '#fff', track: 2, maxW: cw * 0.9 }); txt(x, 'PASTA', cw / 2, ch * 0.31, { font: `800 ${cw * 0.22}px Archivo`, color: '#f2c14e', track: 6, maxW: cw * 0.9 });
      txt(x, 'PENNE', cw / 2, ch * 0.52, { font: `800 ${cw * 0.14}px Archivo`, color: '#1a2a6c', track: 8 }); });
    put(makeBox(0.12, 0.24, 0.06, pstTex, 0x1a2a6c, 0xf2c14e), 1.025, 0, -0.17, -0.08);
  }
  // ---- the lean mass the trials found: a 300 g block of muscle (6.6 cm a side)
  { const fib = canvasTex(256, 256, (x, w, h) => { x.fillStyle = '#808080'; x.fillRect(0, 0, w, h); for (let k = 0; k < 90; k++) { const y = (k / 90) * h + (hash(k) - 0.5) * 2; const c = hash(k * 3) > 0.5 ? 255 : 0; x.strokeStyle = `rgba(${c},${c},${c},0.35)`; x.lineWidth = 1 + hash(k * 5) * 1.5; x.beginPath(); x.moveTo(0, y); x.bezierCurveTo(w * 0.3, y + 3, w * 0.7, y - 3, w, y + 1); x.stroke(); } }, { srgb: false });
    fib.wrapS = fib.wrapT = THREE.RepeatWrapping;
    W.blockMat = tissueMat('muscle', { bumpMap: fib, bumpScale: 1.4, roughness: 0.42, clearcoat: 0.45, clearcoatRoughness: 0.25 }); W.blockMat.emissive.set(0xe02a20);
    W.block = new THREE.Mesh(new RoundedBoxGeometry(0.066, 0.066, 0.066, 4, 0.009), W.blockMat); W.block.castShadow = W.block.receiveShadow = true; W.block.layers.enable(1); W.block.visible = false; scene.add(W.block); }
  // ---- the cubes, and the levels on the column: thin orange marks at 58 and 112 g
  { const tex = noiseTex(23, 256, 0.78, 1.0, 1);
    W.cubeMat = phys({ color: 0xf0e8d6, roughness: 0.82, roughnessMap: tex, bumpMap: tex, bumpScale: 0.5, sheen: 0.35, sheenColor: new THREE.Color(0xfff6e2), sheenRoughness: 0.6 });
    W.cubes = new THREE.InstancedMesh(new RoundedBoxGeometry(CUBE, CUBE, CUBE, 2, 0.0017), W.cubeMat, N_CUBES); W.cubes.castShadow = W.cubes.receiveShadow = true; W.cubes.layers.enable(1); W.cubes.frustumCulled = false; scene.add(W.cubes);
    W.marks = [58, 112].map((n) => { const m = glowMat(ORANGE); m.transparent = true; m.opacity = 0; const y = (n / 9) * PITCH, g = new THREE.Group();
      for (const [dx, dz, ry] of [[0, 1, 0], [0, -1, 0], [1, 0, Math.PI / 2], [-1, 0, Math.PI / 2]]) { const b = new THREE.Mesh(new THREE.BoxGeometry(3 * PITCH + 0.008, 0.0016, 0.0016), m); b.position.set(COL.x + dx * (1.5 * PITCH + 0.003), y, COL.z + dz * (1.5 * PITCH + 0.003)); b.rotation.y = ry; g.add(b); }
      scene.add(g); return { g, m, y }; }); }
  // ---- the bowls: dark stoneware; they rise out of the floor for "real food", and the food pops in
  { const geo = new THREE.LatheGeometry(BOWL_PROF.map(([a, b]) => new THREE.Vector2(a, b)), 96), glaze = noiseTex(51, 256, 0.8, 1.0, 2);
    const mat = phys({ color: 0x2b2a29, roughness: 0.38, roughnessMap: glaze, clearcoat: 0.5, clearcoatRoughness: 0.3, side: THREE.DoubleSide });
    W.bowls = BOWLS.map((p, b) => { const g = new THREE.Group(), m = new THREE.Mesh(geo, mat); m.castShadow = m.receiveShadow = true; m.layers.enable(1); g.add(m);
      const food = makeFood(b); food.visible = false; g.add(food); g.position.copy(p); g.visible = false; scene.add(g); return { g, food }; }); }
  // ---- the dials, under the floor until the settings
  W.dials = buildDials(scene); W.dials.forEach((d, i) => d.g.position.copy(DIALS[i]));
  W.logoRing = makeLogoRing(LOGO_R); W.logoRing.g.rotation.x = -Math.PI / 2; W.logoRing.g.position.y = 0.0665 + 0.0012; W.dials[0].g.add(W.logoRing.g);
  // ---- the dumbbell grip: each finger closes on the bar until just off it; the thumb wraps over it
  { const M = new THREE.Matrix4(), v = new THREE.Vector3(), H = W.hand.Left, A = R.arms.Left;
    R.pelvis.position.copy(R.P0); poseArm(A, CURL_LO); setWrist(H.wr, CURL_LO); R.root.updateMatrixWorld(true);
    M.multiplyMatrices(H.eg.matrixWorld, H.db.userData.hm).invert(); const sdf = (p) => dbSDF(v.copy(p).applyMatrix4(M));
    H.dbGrip = H.fit(sdf, { need: 0.002, kmax: 1.0, tmin: -0.6 });
    const samp = (m, n) => { const P = m.geometry.attributes.position, st = Math.max(1, Math.floor(P.count / n)), o = []; for (let i = 0; i < P.count; i += st) o.push(new THREE.Vector3().fromBufferAttribute(P, i)); return o; };
    const TP = ['Proximal', 'Distal'].map((k) => R.byName.get(`${k} phalanx of left thumb`)).map((m) => ({ m, p: samp(m, 120) }));
    H.curl(0, H.dbGrip.per, 0); R.root.updateMatrixWorld(true);
    const fw = ['index', 'middle', 'ring', 'little'].flatMap((f) => ['Proximal', 'Middle', 'Distal'].map((k) => R.byName.get(`${k} phalanx of left ${f} finger`))).flatMap((m) => samp(m, 60).map((q) => q.applyMatrix4(m.matrixWorld)));
    H.dbGrip.wrap = null; const w = new THREE.Vector3();
    for (let tk = 0.9; tk <= 1.8001 && !H.dbGrip.wrap; tk += 0.02) { H.curl(0, H.dbGrip.per, tk); H.eg.updateMatrixWorld(true); let gD = 9, gF = 9;
      for (const { m, p } of TP) for (const q of p) { w.copy(q).applyMatrix4(m.matrixWorld); gD = Math.min(gD, sdf(w)); for (const f of fw) { const dd = w.distanceToSquared(f); if (dd < gF) gF = dd; } }
      gF = Math.sqrt(gF); if (gD >= 0.003 && gF >= 0.002) H.dbGrip.wrap = { tk: +tk.toFixed(2), db: +(gD * 1000).toFixed(1), fingers: +(gF * 1000).toFixed(1) }; }
    if (H.dbGrip.wrap) H.dbGrip.tk = H.dbGrip.wrap.tk;
    poseArm(A, ARM_HANG); setWrist(H.wr, ARM_HANG); H.curl(RELAX); R.root.updateMatrixWorld(true);
    W.gripInfo = { per: H.dbGrip.per.map((k) => +k.toFixed(3)), tk: H.dbGrip.tk, wrap: H.dbGrip.wrap }; }
  // ---- light
  W.key = spot(scene, { color: 0xffe9d2, pos: new THREE.Vector3(-1.1, 3.1, 1.9), target: new THREE.Vector3(0.2, 0.7, 0.1), angle: 0.52, penumbra: 0.85, shadow: true, size: cfg.shadow ?? 1024 });
  W.key.shadow.camera.far = 7;
  W.rim = spot(scene, { color: 0xa9c4ff, pos: new THREE.Vector3(1.5, 2.3, -1.9), target: new THREE.Vector3(0.1, 0.9, 0), angle: 0.6, penumbra: 0.9 });
  W.fill = spot(scene, { color: 0xc8d6ff, pos: new THREE.Vector3(-1.9, 0.7, 1.7), target: new THREE.Vector3(0.2, 0.5, 0.1), angle: 0.7, penumbra: 1 });
  W.shelfLight = spot(scene, { color: 0xfff1d8, pos: new THREE.Vector3(0.84, 2.7, 0.95), target: new THREE.Vector3(0.82, 0.9, -0.2), angle: 0.34, penumbra: 0.55 });
  W.dialLight = spot(scene, { color: 0xffe9d2, pos: new THREE.Vector3(-0.2, 1.8, 2.0), target: new THREE.Vector3(-0.2, 0, 0.9), angle: 0.5, penumbra: 0.8 });
  W.lowLight = spot(scene, { color: 0xffeedd, pos: new THREE.Vector3(0.75, 0.75, 1.1), target: new THREE.Vector3(0.22, 0.08, 0.15), angle: 0.4, penumbra: 0.9 });
  W.bowlLight = spot(scene, { color: 0xfff0dc, pos: new THREE.Vector3(-0.75, 1.5, 1.35), target: new THREE.Vector3(-0.3, 0.03, 0.56), angle: 0.32, penumbra: 0.8 });
  W.timing = { packs: [T.coffee, T.cereal, T.pancakes], eggs: T.so + 0.08, land: Array.from(LAND), over: OVER.map((o) => o.t0), deal: Array.from({ length: N_COL }, (_, i) => dealT(i) + FLY),
    reps: REPS, block: [BLOCK_T0, T.three], bowls: BOWLS.map((_, b) => BOWL_T0 + b * 0.06), food: FOOD_T, sweep: [SWEEP0, SWEEP1], kg: [KG0, KG1] };
  return { stamp: W.stampSpot, scaleZ: W.scaleZ, grip: W.gripInfo, musY: W.musY.map((v) => +v.toFixed(3)) };
}

// ------------------------------------------------------------------ the left arm: a hammer curl (three reps), then the weight goes
const ARM_HANG = { dir: [0.03, -1, 0], twist: 0, elbow: 0.08, wf: 0, wd: 0, wr: 0, pro: 0 };
const CURL_LO = { dir: [0.17, -1, 0.04], twist: 0, elbow: 0.16, wf: 0, wd: 0, wr: 0, pro: 1.45 };   // the dumbbell beside the thigh, palm in
const CURL_HI = { dir: [0.14, -1, 0.12], twist: 0, elbow: 1.92, wf: 0, wd: 0, wr: 0, pro: 1.45 };
const REPS = [29.65, 31.15, 32.65], UP = 0.62, HOLD = 0.12, DOWN = 0.7;
const ARMT = { in0: 28.35, in1: 29.05, grip0: 28.75, grip1: 29.1, show0: 29.12, show1: 29.38, hide0: 39.25, hide1: 39.5, open0: 39.55, open1: 39.85, out0: 39.75, out1: 40.5 };
const SWEEP0 = 8.8, SWEEP1 = 10.2;
function curlShape(t) {
  for (const r0 of REPS) { const u = t - r0; if (u < 0 || u > UP + HOLD + DOWN) continue; if (u < UP) return s5(0, UP, u); if (u < UP + HOLD) return 1; return 1 - s5(UP + HOLD, UP + HOLD + DOWN, u); }
  return 0;
}
function armL(t) {
  const on = s5(ARMT.in0, ARMT.in1, t) * (1 - s5(ARMT.out0, ARMT.out1, t)), c = curlShape(t);
  const base = mixArm(ARM_HANG, CURL_LO, on), p = c > 0 ? mixArm(base, CURL_HI, c) : base;
  return { p, c, grip: s5(ARMT.grip0, ARMT.grip1, t) * (1 - s5(ARMT.open0, ARMT.open1, t)), held: ss(ARMT.show0, ARMT.show1, t) * (1 - ss(ARMT.hide0, ARMT.hide1, t)) };
}
function applyBody(t) {
  const R = W.rig, HR = W.hand.Right, HL = W.hand.Left;
  R.pelvis.position.copy(R.P0); R.pelvis.rotation.set(0, 0, 0);
  bendSpine(R.seg, { tho: 0.02, cer: 0.02 });
  for (const Side of ['Right', 'Left']) { const G = R.legs[Side]; G.hip.quaternion.identity(); G.knee.quaternion.identity(); G.ankle.quaternion.identity(); }
  poseArm(R.arms.Right, ARM_HANG); setWrist(HR.wr, ARM_HANG); HR.curl(RELAX);
  const a = armL(t); poseArm(R.arms.Left, a.p); setWrist(HL.wr, a.p);
  if (a.grip > 0.001) gripCurl(HL, HL.dbGrip, a.grip, RELAX); else HL.curl(RELAX);
  clearArms(R);   // no arm through the trunk or the thighs, in any pose or between poses
  R.root.updateMatrixWorld(true);
  const db = HL.db, o = a.held; db.visible = o > 0.002; db.matrix.multiplyMatrices(HL.eg.matrixWorld, db.userData.hm); db.matrixWorldNeedsUpdate = true;
  for (const m of db.userData.mats) { m.opacity = o; m.depthWrite = o > 0.5; }
  return a;
}

// ------------------------------------------------------------------ the 300 g block: it pops in over the kitchen scale on "about", lands on "three"
const BLOCK_T0 = 32.42, BLOCK_DROP = 32.72;
function blockPos(t, out) {
  const y0 = KS.y + W.ks.top + 0.033;
  if (t >= T.three) return out.set(KS.x, y0, KS.z - 0.008);
  const k = clamp01((t - BLOCK_DROP) / (T.three - BLOCK_DROP));
  return out.set(KS.x, lerp(y0 + 0.15, y0, k * k), KS.z - 0.008);
}

// ------------------------------------------------------------------ the camera: one path, no cuts
let CAM = null;
function buildCam() {
  return camTrack([
    { t: -2.0, p: V3(0.75, 0.8, 1.0), l: V3(0.72, 0.79, -0.14), fov: 30 },
    { t: 0.0, p: V3(0.74, 0.8, 0.97), l: V3(0.715, 0.79, -0.14), fov: 30 },          // the coffee and the flakes
    { t: 2.45, p: V3(0.77, 0.81, 0.94), l: V3(0.75, 0.795, -0.14), fov: 30 },
    { t: 3.3, p: V3(0.95, 0.82, 0.88), l: V3(0.955, 0.79, -0.14), fov: 30 },              // the pancake mix
    { t: 4.25, p: V3(1.0, 1.13, 0.52), l: V3(0.99, 1.085, -0.1), fov: 30 },             // up to the eggs
    { t: 5.6, p: V3(0.86, 1.18, 1.75), l: V3(0.8, 1.05, -0.15), fov: 32 },              // back: the end-cap
    { t: 7.4, p: V3(0.45, 1.1, 3.45), l: V3(0.33, 0.95, 0.0), fov: 34 },                // and the skeleton beside it, on a scale
    { t: 8.4, p: V3(0.42, 1.12, 3.2), l: V3(0.3, 0.96, 0.0), fov: 34 },
    { t: 9.7, p: V3(0.55, 1.37, 2.0), l: V3(0.12, 1.33, 0.0), fov: 32 },                // in: the arms' muscles are rebuilt
    { t: 11.0, p: V3(0.6, 1.38, 1.9), l: V3(0.16, 1.32, 0.0), fov: 32 },
    { t: 12.6, p: V3(0.93, 1.56, 1.3), l: V3(0.82, 1.5, -0.17), fov: 32 },              // the supplement aisle: the tubs
    { t: 14.6, p: V3(0.92, 1.55, 1.18), l: V3(0.81, 1.5, -0.17), fov: 32 },
    { t: 16.6, p: V3(0.36, 0.52, 1.2), l: V3(0.15, 0.06, COL.z), fov: 30 },             // down to the scale and the floor beside it
    { t: 19.5, p: V3(0.33, 0.47, 1.08), l: V3(0.155, 0.06, COL.z + 0.02), fov: 30 },
    { t: 24.5, p: V3(0.32, 0.48, 1.04), l: V3(0.16, 0.1, COL.z + 0.02), fov: 30 },
    { t: 27.6, p: V3(0.33, 0.5, 1.02), l: V3(0.17, 0.11, COL.z + 0.02), fov: 30 },
    { t: 29.2, p: V3(1.47, 1.33, 0.98), l: V3(0.2, 1.17, 0.1), fov: 32 },                // up to the arm: the curl, from its side
    { t: 31.5, p: V3(1.44, 1.34, 0.95), l: V3(0.22, 1.18, 0.09), fov: 32 },
    { t: 32.45, p: V3(0.88, 1.25, 0.98), l: V3(KS.x + 0.1, 1.12, KS.z), fov: 30 },      // the kitchen scale: 300 g lands
    { t: 35.6, p: V3(0.86, 1.23, 0.93), l: V3(KS.x + 0.1, 1.1, KS.z), fov: 30 },
    { t: 37.4, p: V3(0.74, 1.22, 0.88), l: V3(0.73, 1.13, -0.15), fov: 30 },             // beside the tub's arm
    { t: 39.2, p: V3(0.73, 1.22, 0.85), l: V3(0.73, 1.13, -0.15), fov: 30 },
    { t: 40.6, p: V3(0.6, 0.5, 0.92), l: V3(COL.x, 0.1, COL.z), fov: 30 },               // down to the column: it climbs to 112, then overflows
    { t: 42.5, p: V3(0.6, 0.55, 0.95), l: V3(COL.x, 0.14, COL.z + 0.02), fov: 30 },
    { t: 44.6, p: V3(0.58, 0.54, 0.98), l: V3(COL.x, 0.12, COL.z + 0.03), fov: 30 },
    { t: 46.0, p: V3(0.04, 0.74, 1.86), l: V3(DIALS[0].x + 0.06, 0.05, DIALS[0].z), fov: 32 },   // the every-day dial
    { t: 47.8, p: V3(0.02, 0.74, 1.86), l: V3(DIALS[0].x + 0.05, 0.05, DIALS[0].z), fov: 32 },
    { t: 48.75, p: V3(-0.36, 0.74, 1.86), l: V3(DIALS[1].x + 0.05, 0.05, DIALS[1].z), fov: 32 }, // the training dial, and its stop
    { t: 50.5, p: V3(-0.37, 0.73, 1.84), l: V3(DIALS[1].x + 0.05, 0.05, DIALS[1].z), fov: 32 },
    { t: 51.5, p: V3(-0.3, 1.3, 1.48), l: V3(-0.31, 0.03, 0.66), fov: 32 },              // the bowls of real food
    { t: 56.1, p: V3(-0.31, 1.28, 1.5), l: V3(-0.32, 0.03, 0.68), fov: 32 },
    { t: 57.1, p: V3(-0.37, 0.72, 1.84), l: V3(DIALS[1].x + 0.06, 0.05, DIALS[1].z), fov: 32 },  // past 1.6: thrown at the stop
    { t: 60.5, p: V3(-0.38, 0.7, 1.82), l: V3(DIALS[1].x + 0.06, 0.05, DIALS[1].z), fov: 32, tens: 0.3 },
    { t: 62.0, p: V3(0.32, 1.16, 1.08), l: V3(0.0, 1.06, -0.05), fov: 32 },              // up to the kidneys
    { t: 67.6, p: V3(0.28, 1.13, 0.98), l: V3(0.0, 1.05, -0.05), fov: 32, tens: 0.3 },
    { t: 69.6, p: V3(DIALS[0].x + 0.03, 0.92, 1.42), l: V3(DIALS[0].x, 0.06, DIALS[0].z), fov: 30 },
    { t: T.logo, p: V3(DIALS[0].x, 1.12, DIALS[0].z + 0.005), l: V3(DIALS[0].x, 0.0665, DIALS[0].z), fov: 30, stop: true },   // straight down on the every-day dial: the logo lands here
  ]);
}
function camPose(S, t) {
  const v = S.cfg.view;
  if (Array.isArray(v)) return { p: v[0], l: v[1], fov: v[2] ?? 30 };
  if (v) { const V = { wide: [[0.4, 1.1, 3.6], [0.35, 0.85, 0], 36], shelf: [[0.86, 1.08, 2.0], [0.82, 0.93, -0.18], 32], packs: [[0.8, 0.8, 1.05], [0.79, 0.74, -0.14], 32], eggs: [[1.0, 1.14, 0.72], [0.985, 1.065, -0.1], 30],
    col: [[0.5, 0.45, 0.86], [0.22, 0.14, 0.1], 30], arm: [[1.0, 1.25, 0.9], [0.26, 1.15, 0.05], 32], armF: [[0.3, 1.2, 1.3], [0.24, 1.12, 0.0], 32], armB: [[0.6, 1.2, -1.1], [0.24, 1.12, 0.0], 32], bowls: [[-0.3, 1.3, 1.48], [-0.31, 0.03, 0.66], 32],
    dials: [[-0.2, 0.9, 2.0], [-0.2, 0.05, 0.98], 34], kid: [[0.3, 1.15, 1.05], [0, 1.06, -0.05], 32], tub: [[0.78, 1.21, 0.62], [0.735, 1.14, -0.15], 30], shin: [[-0.25, 0.32, 0.55], [0.08, 0.26, 0.0], 30],
    hand: [[0.55, 0.85, 0.35], [0.25, 0.78, 0.02], 26], top: [[0.25, 1.65, 0.45], [0.22, 1.2, 0.08], 30] }[v]; if (V) return { p: V[0], l: V[1], fov: V[2] }; }
  if (!CAM) CAM = buildCam();
  if (t <= T.logo) return CAM(t);
  const P = CAM(T.logo), k = ss(T.logo, T.end, t);
  return { p: [P.p[0], lerp(P.p[1], P.p[1] - 0.08, k), P.p[2]], l: P.l, fov: 30 };
}

// ------------------------------------------------------------------ one moment of the film
const _b = new THREE.Vector3(), _c = { p: new THREE.Vector3(), q: new THREE.Quaternion(), s: 1 };
function update(S, t) {
  const scene = S.scene, a = applyBody(t);
  // ---- the arms' muscles: a band of light builds them from the shoulders down; then the curling arm lights with each rep
  { W.sweep.value = t < SWEEP0 ? 9 : t >= SWEEP1 ? -9 : lerp(W.musY[1] + 0.012, W.musY[0] - 0.02, s5(SWEEP0, SWEEP1, t));
    const on = t > SWEEP0 - 0.02; for (const m of W.armMeshes) m.visible = on;
    if (on) for (const sk of W.skins) sk.update(0);
    W.armMat.Left.emissiveIntensity = 0.02 + 0.16 * a.c * a.held + 0.05 * ss(SWEEP0, SWEEP0 + 0.3, t) * (1 - ss(SWEEP1, SWEEP1 + 0.8, t));
    W.armMat.Right.emissiveIntensity = 0.02 + 0.05 * ss(SWEEP0, SWEEP0 + 0.3, t) * (1 - ss(SWEEP1, SWEEP1 + 0.8, t)); }
  // ---- the stickers: "+ PROTEIN" on the coffee, the flakes, the pancake mix; then the eggs
  W.packs.forEach((P, i) => slap(P.st, [T.coffee, T.cereal, T.pancakes][i] + 0.06, t));
  slap(W.eggs.st, T.so + 0.08, t);
  // ---- the bathroom scale: wakes, counts to 70.0, blinks, holds, switches itself off before the dumbbell
  { let text = '   ', glow = 0;
    if (t > 17.62 && t < KG0) { text = '88.8'; glow = 1; }
    else if (t >= KG0 && t < 28.3) { text = kgAt(t).toFixed(1); glow = t > 25.35 && t < 26.0 ? (Math.floor((t - 25.35) * 6) % 2 ? 0.25 : 1) : 1; }
    else if (t >= 28.3 && t < 28.6) { text = '70.0'; glow = 1 - ss(28.3, 28.6, t); }
    drawBath(W.bath, text, glow); }
  // ---- the kitchen scale: 0 g until the block lands, then 300 g
  drawKitchen(W.ks, t < T.three ? 0 : 300 * s5(T.three, T.three + 0.45, t));
  // ---- the cubes
  { let n = 0;
    for (let i = 0; i < N_CUBES; i++) { const c = cubeAt(i, t, _c); if (!c) _m4.makeScale(0, 0, 0); else { _s.setScalar(Math.max(0.0001, c.s)); _m4.compose(c.p, c.q, _s); n++; } W.cubes.setMatrixAt(i, _m4); }
    W.cubes.instanceMatrix.needsUpdate = true; W.cubes.visible = n > 0; }
  { const gone = 1 - ss(DEAL0 - 0.3, DEAL0, t);
    W.marks[0].m.opacity = ss(T.fiftyeight - 0.2, T.fiftyeight + 0.3, t) * gone;
    W.marks[1].m.opacity = ss(T.kilo2 - 0.25, T.kilo2 + 0.25, t) * gone; }
  // ---- the block of lean mass
  { const k = outBack(clamp01((t - BLOCK_T0) / 0.35), 1.5); W.block.visible = k > 0.001; W.block.scale.setScalar(Math.max(0.001, k));
    blockPos(t, W.block.position); W.block.rotation.set(0, -0.35 + 0.35 * s5(BLOCK_T0, T.three, t), 0);
    W.blockMat.emissiveIntensity = 0.03 + 0.25 * (1 - ss(T.three, T.three + 0.8, t)) * ss(BLOCK_T0, BLOCK_T0 + 0.3, t); }
  // ---- the bowls rise for "real food"; the food pops in
  W.bowls.forEach((B, b) => { const up = s5(BOWL_T0 + b * 0.06, BOWL_T0 + 0.6 + b * 0.06, t); B.g.position.y = lerp(-0.07, 0, up); B.g.visible = up > 0.001;
    const f = outBack(clamp01((t - FOOD_T[b]) / 0.32), 1.5); B.food.visible = f > 0.001; B.food.scale.setScalar(Math.max(0.001, f)); });
  // ---- the dials rise; every day is set to 0.8, training runs up to its stop at 1.6 (and past 1.6 is thrown at it)
  const endDark = ss(T.final + 0.3, T.logo - 0.3, t);
  W.dials.forEach((d, i) => {
    const t0 = [T.so2 - 0.45, T.upto - 0.5][i], up = s5(t0, t0 + 0.9, t); d.g.position.y = lerp(-0.075, 0, up); d.g.visible = up > 0.001;
    let v = 0, setO = 0;
    if (i === 0) { v = 0.4 * s5(T.point8 - 0.1, T.eight2 + 0.45, t); setO = ss(T.eight2 + 0.25, T.eight2 + 0.55, t); v = lerp(v, 0.5, s5(T.final + 0.2, T.logo - 0.3, t)); }
    if (i === 1) { v = 0.8 * s5(T.one6 - 0.2, T.six2 + 0.3, t) - stopBounce(t - (T.past + 0.15)); setO = ss(T.six2 + 0.2, T.six2 + 0.5, t);
      d.pinMat.opacity = ss(T.upto - 0.1, T.upto + 0.3, t) * (1 - endDark); d.pin.position.y = 0.012 * ss(T.upto - 0.1, T.upto + 0.3, t) + 0.0005; }
    d.knob.rotation.y = -d.angle(v);
    d.setMat.opacity = setO * (1 - endDark);
    const sv = i === 0 ? 0.4 : 0.8, ang = d.angle(sv), r = 0.147; d.set.position.set(Math.sin(ang) * r, 0.0048, -Math.cos(ang) * r); d.set.rotation.y = -ang;
  });
  { const logoK = s5(T.final + 0.4, T.logo - 0.25, t); W.logoRing.set({ weight: logoK, white: logoK, hours: 0, hand: ss(T.logo - 0.4, T.logo - 0.15, t), handScale: outBack(clamp01((t - (T.logo - 0.4)) / 0.35), 1.8) }); }
  // ---- the kidneys: last, softly lit, behind the lower ribs
  { const k = ss(T.kidney - 0.6, T.kidney + 0.3, t) * (1 - ss(T.final, T.final + 0.8, t));
    for (const m of W.kidneys) { m.visible = k > 0.002; m.material.opacity = k * (/bladder|ureter/i.test(m.userData.name) ? 0.7 : 1); m.material.depthWrite = k > 0.5; m.material.emissiveIntensity = 0.05 + 0.12 * k * (0.75 + 0.25 * Math.sin((t - T.kidney) * 2.4)); } }
  // ---- light
  const fig = 1 - endDark, floorShot = ss(15.6, 16.8, t) * (1 - ss(28.4, 29.4, t)) + ss(39.6, 40.6, t) * (1 - ss(44.8, 45.8, t));
  W.key.intensity = 5.6 * fig; W.rim.intensity = 2.3 * fig; W.fill.intensity = 0.8 * fig;
  W.shelfLight.intensity = 6.5 * (1 - 0.55 * floorShot) * (1 - 0.6 * ss(44.8, 46.0, t)) * fig;
  W.dialLight.intensity = 3.2 * ss(44.6, 45.8, t) * (1 - 0.6 * endDark);
  W.lowLight.intensity = 1.6 * floorShot;
  W.bowlLight.intensity = 2.4 * ss(50.6, 51.6, t) * (1 - ss(60.0, 61.0, t));
  S.tableMat.color.setScalar(FLOOR * (1 - endDark * 0.9)); scene.environmentIntensity = 0.12 * (1 - endDark); S.reflAmt = 0.9 * (1 - endDark);
}
function focusAt(S, t, P) { return Math.hypot(P.p[0] - P.l[0], P.p[1] - P.l[1], P.p[2] - P.l[2]); }

// ------------------------------------------------------------------ the words on screen
const CAPS = [
  { t0: T.youre, t1: 2.95, top: 292, size: 88, html: 'You’re putting protein<br>in your <em>coffee</em>,<br>your <em>cereal</em>' },
  { t0: T.and1, t1: 4.0, top: 300, size: 92, html: 'and your <em>pancakes</em>,' },
  { t0: T.so, t1: 7.3, top: 292, size: 88, html: 'so let’s work out<br>how much you<br><em>actually need.</em>' },
  { t0: T.your, t1: 10.95, top: 292, size: 88, html: 'Your body <em>rebuilds itself</em><br>with protein<br>every day,' },
  { t0: T.but, t1: 14.9, top: 292, size: 84, html: 'but it needs <em>less</em> than<br>the supplement aisle<br>wants you to think.' },
  { t0: T.europe, t1: 19.5, top: 292, size: 84, html: 'Europe’s food safety<br>experts say that about<br><em>0.8 grams</em> a day' },
  { t0: 19.56, t1: 24.1, top: 292, size: 84, html: 'for every <em>kilo</em> you weigh<br>is enough for<br>almost every adult.' },
  { t0: T.if1, t1: 28.3, top: 292, size: 88, html: 'If you weigh <em>70 kilos</em>,<br>that’s about <em>58 grams.</em>' },
  { t0: T.if2, t1: 31.28, top: 292, size: 88, html: 'If you lift weights,<br>extra protein<br><em>does help</em>,' },
  { t0: 31.33, t1: 32.38, top: 300, size: 96, html: 'but only <em>a little</em>:' },
  { t0: T.about2, t1: 37.0, top: 292, size: 88, html: 'about <em>300 grams</em><br>of extra lean mass,<br>on average.' },
  { t0: T.thats2, t1: 39.9, top: 292, size: 88, html: 'That’s not quite<br>the <em>body on the label.</em>' },
  { t0: T.and2, t1: 42.85, top: 292, size: 88, html: 'And above about<br><em>1.6 grams</em> per kilo,' },
  { t0: 42.9, t1: 45.2, top: 300, size: 92, html: 'the extra gains<br><em>stopped.</em>' },
  { t0: T.so2, t1: 48.38, top: 292, size: 88, html: 'So eat at least<br><em>0.8 grams</em> per kilo<br>a day,' },
  { t0: T.upto, t1: 50.8, top: 300, size: 92, html: 'up to <em>1.6</em><br>if you lift,' },
  { t0: T.and3, t1: 52.92, top: 300, size: 92, html: 'and get it from<br><em>real food</em>,' },
  { t0: T.about3, t1: 56.4, top: 292, size: 88, html: 'about <em>25 to 30 grams</em><br>at each meal.' },
  { t0: T.past, t1: 61.1, top: 292, size: 84, html: 'Past <em>1.6</em>, you’re buying<br>more protein,<br><em>not more muscle.</em>' },
  { t0: T.if4, t1: 64.95, top: 292, size: 80, html: 'If you have<br><em>kidney disease</em>,<br>ask your doctor<br>or a dietitian,' },
  { t0: T.notvideo, t1: 68.4, top: 292, size: 88, html: 'not a video,<br>and that includes<br><em>this one.</em>' },
  { t0: T.final, t1: 99, top: 360, size: 92, html: 'Let’s get you back to<br><em>factory settings.</em>' },
];
const OVL = {};
function overlayInit(S) {
  const O = S.O, tag = (cls, txt, size, big = 0) => { const e = O.tag(cls, txt); e.style.fontSize = size + 'px'; if (big) { const b = e.querySelector('b'); if (b) b.style.fontSize = big + 'px'; } return e; };
  OVL.one = tag('tag', 'One cube<b>1 g of protein</b>', 24, 40);
  OVL.kg = tag('tag', 'Body weight<b>70 kg</b>', 24, 44);
  OVL.lv = [tag('tag', '0.8 g per kg<b>58 g</b>', 24, 44), tag('tag', '1.6 g per kg<b>112 g</b>', 24, 44)];
  OVL.lean = tag('tag', 'Extra lean mass, on average<b>about 300 g</b>', 24, 44);
  OVL.meal = tag('tag', 'Each meal<b>25 to 30 g</b>', 26, 48);
  OVL.dial = [tag('tag', 'Every day<b>at least 0.8 g/kg</b>', 26, 44), tag('tag', 'Training<b>up to 1.6 g/kg</b>', 26, 44)];
  OVL.kid = tag('tag', 'Kidneys', 28);
}
function overlay(S, t) {
  const gone = 1 - ss(DEAL0 - 0.4, DEAL0, t);
  place(S, OVL.one, colSlot(0).add(_b.set(0.012, 0.0, 0)), 34, -54, ss(LAND[0] + 0.05, LAND[0] + 0.4, t) * (1 - ss(21.2, 21.7, t)));
  place(S, OVL.kg, new THREE.Vector3(0.07, SCALE.h, W.scaleZ + SCALE.d / 2), -90, 34, ss(T.seventy - 0.1, T.seventy + 0.4, t) * (1 - ss(28.0, 28.5, t)));
  place(S, OVL.lv[0], new THREE.Vector3(COL.x + 0.03, W.marks[0].y, COL.z), 44, -40, Math.min(1, ss(T.fiftyeight - 0.1, T.fiftyeight + 0.35, t) * (1 - ss(28.0, 28.5, t)) + ss(40.5, 40.9, t)) * gone);
  place(S, OVL.lv[1], new THREE.Vector3(COL.x + 0.03, W.marks[1].y, COL.z), 44, -40, ss(T.kilo2 - 0.1, T.kilo2 + 0.35, t) * gone);
  place(S, OVL.lean, W.block.position.clone().add(_b.set(-0.04, 0.05, 0)), -300, -30, ss(T.hundred + 0.1, T.grams3 + 0.2, t) * (1 - ss(38.9, 39.3, t)));
  place(S, OVL.meal, new THREE.Vector3(-0.3, 0.06, 0.78), -110, -10, ss(T.thirty - 0.1, T.thirty + 0.3, t) * (1 - ss(56.3, 56.8, t)));
  W.dials.forEach((d, i) => { const ts = [T.eight2, T.six2][i]; place(S, OVL.dial[i], d.g.position.clone().add(_b.set(0.17, 0.02, 0.05)), 12, -30, ss(ts, ts + 0.4, t) * (1 - ss(T.final - 0.3, T.final + 0.2, t))); });
  place(S, OVL.kid, W.rig.seg['First lumbar vertebra'].g.getWorldPosition(_b).add(new THREE.Vector3(0.12, 0.0, 0.0)), 40, -20, ss(T.kidney + 0.2, T.kidney + 0.7, t) * (1 - ss(T.final - 0.4, T.final + 0.2, t)));
  // the end: the logo lands on the every-day dial's face
  const d = W.dials[0], c = d.g.position.clone().add(new THREE.Vector3(0, 0.0665 + 0.0012, 0));
  logoEnd(S, t, { t0: T.logo, center: c, edge: c.clone().add(new THREE.Vector3(LOGO_R, 0, 0)) });
}

window.HFS_POSE = poseArm;
makeFilm({
  T, caps: CAPS, subs: [], build, update, pose: camPose, overlay, overlayInit, focus: focusAt,
  stage: { bg: 0x07080a, reflSize: 6, env: 0.12, far: 30 },
  aperture: [[0, 0.006], [3, 0.005], [4.3, 0.004], [6, 0.002], [7.4, 0.0012], [9.7, 0.003], [12.6, 0.003], [16.6, 0.005], [27.6, 0.005], [29.2, 0.002], [32.45, 0.005], [39.2, 0.005], [40.6, 0.004], [44.6, 0.004], [46, 0.003], [51.5, 0.002], [56.1, 0.002], [57.1, 0.003], [60.5, 0.003], [62, 0.002], [67.6, 0.002], [69.6, 0.003]],
  bloom: [[0, 0.42], [10, 0.5], [12, 0.45], [30, 0.5], [34, 0.45], [62, 0.5], [71.2, 0.55]],
  fast: [[1.7, 2.5, 2], [3.2, 4.4, 2], [28.4, 29.4, 2], [31.6, 32.6, 2], [39.4, 40.7, 2], [42.9, 44.6, 3], [47.8, 48.9, 2], [50.4, 51.6, 2], [52.9, 55.7, 2], [56.1, 57.3, 2], [60.4, 62.1, 2]],
});

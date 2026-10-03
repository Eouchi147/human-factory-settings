// Human Factory Settings · Film 5 "How much protein do you need?" · one continuous shot, 9:16.
// A skeleton stands on a bathroom scale beside a supermarket end-cap where everything says PROTEIN, the eggs included.
// One gram of protein is one cream cube: 58 of them for a 70 kg body, more for the US range; lifting adds a little lean
// mass (49 trials: about 300 g, weighed on a kitchen scale beside a tub with a giant arm on it); past 1.6 g per kg the
// cubes just fall off; four bowls of 28; three dials; the kidneys; the first dial becomes the logo.
import { THREE, ORANGE, ss, s5, lerp, clamp01, hash, camTrack, phys, glowMat, shadows, spot, RoundedBoxGeometry,
  loadAnatomy, tissueMat, V3, place, logoEnd, makeFilm, outBack, stamp, labelCanvas, stampLine, noiseTex } from '../kit.js';
import { buildRig, skeletonKind, bendSpine, poseArm, ARM0, worldVerts } from '../rig.js';
import { makeLogoRing } from '../props.js';
import { skinned, armBinder } from '../soft.js';

// ------------------------------------------------------------------ timing, from the voice guide (word starts)
const T = {
  end: 70.4,
  q0: 0.35, protein: 1.20, need: 2.01, less: 2.73, aisle: 4.07, hopes: 4.49,       // "How much protein do you need? Less than the supplement aisle hopes."
  europe: 6.31, point: 8.95, eight: 9.35, every: 10.66, kilo: 11.25, weigh: 11.85, day: 12.50,   // "Europe's food safety experts set it at about point eight grams for every kilo you weigh, each day."
  someone: 14.39, seventy: 15.18, kilos: 15.56, fiftyeight: 16.89,                 // "For someone who weighs seventy kilos, that's about fifty-eight grams."
  american: 19.94, higher: 21.11, one2: 21.51, two: 22.68, one6: 23.07, six: 23.78, // "The new American guidelines go higher: one point two to one point six."
  lift: 26.33, help: 28.27, alittle: 29.08,                                        // "If you lift weights, extra protein does help. A little."
  in49: 30.32, fortynine: 30.95, three: 33.04, lean: 34.74,                        // "In forty-nine trials, it added about three hundred grams of lean mass."
  not: 36.17, body: 37.24, label: 37.82,                                           // "Not quite the body on the label."
  above: 39.44, one16: 40.12, gains: 42.33, stopped: 43.00,                        // "And above about one point six grams per kilo, the gains stopped."
  spread: 44.34, meals: 45.55, tf: 45.94, thirty: 47.19, each: 48.07,              // "Spread it over your meals: twenty-five to thirty grams each."
  so: 49.16, point8: 50.31, training: 51.56, one8: 52.81, past: 54.07, muscle: 57.06,   // "So: at least point eight a day. Training? Up to one point six. Past that, ..."
  kidney: 58.37, ask: 60.00, doctor: 60.82, notvideo: 62.56, including: 63.59,     // "Kidney disease? Ask your doctor or dietitian. Not a video. Including this one."
  final: 66.24, settings: 67.40, logo: 68.1,                                       // "Back to factory settings."
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
const DIALS = [0, -0.38, 0.38].map((x) => new THREE.Vector3(x, 0, 0.98));   // every day (the logo's, in the middle), each meal (by the bowls), training
const LOGO_R = 0.072;
const N_COL = 112, N_OVER = 30, N_CUBES = N_COL + N_OVER;

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
  x.lineWidth = 92; x.beginPath(); x.moveTo(54, 304); x.lineTo(290, 302); x.stroke();                                   // the upper arm
  x.lineWidth = 78; x.beginPath(); x.moveTo(298, 292); x.quadraticCurveTo(326, 210, 318, 132); x.stroke();            // the forearm
  x.beginPath(); x.ellipse(164, 238, 100, 80, -0.06, 0, Math.PI * 2); x.fill();                                         // the biceps
  x.beginPath(); x.roundRect(262, 28, 112, 112, 30); x.fill();                                                          // the fist
  x.strokeStyle = ink; x.lineWidth = 9;
  x.beginPath(); x.moveTo(262, 238); x.quadraticCurveTo(250, 272, 272, 300); x.stroke();                                // the crook of the elbow
  for (const yy of [62, 88, 114]) { x.beginPath(); x.moveTo(282, yy); x.lineTo(322, yy); x.stroke(); }                  // the fingers
  x.beginPath(); x.moveTo(300, 40); x.quadraticCurveTo(268, 56, 276, 96); x.stroke();                                   // the thumb
  x.lineWidth = 7; x.beginPath(); x.moveTo(96, 300); x.quadraticCurveTo(170, 322, 236, 300); x.stroke();                // under the biceps
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
    // the front of the tub is the middle of the label (the tub is turned so)
    x.fillStyle = band; x.fillRect(0, 0, w, 54); x.fillRect(0, h - 70, w, 70);
    if (arm) { flexArm(x, 392, 62, 0.64, armColor, bg); txt(x, word, 512, 352, { font: '900 112px Archivo', color: wordColor, track: 4, maxW: 300 }); }
    else txt(x, word, 512, 230, { font: '900 190px Archivo', color: wordColor, track: 2, maxW: 330 });
    txt(x, sub, 512, arm ? 418 : 350, { font: '800 38px Archivo', color: subColor, track: 6, maxW: 320 });
    txt(x, foot, 512, h - 35, { font: '700 30px Archivo', color: '#fff', track: 5, maxW: 300 });
    // a little back-of-tub small print, never read
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
  const g = new THREE.Group(); g.add(m); shadows(g); g.traverse((o) => o.layers.enable(1)); return g;
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
// the gag: a plain carton of eggs with a sticker. Eggs have always had protein.
function makeEggs() {
  const g = new THREE.Group(), w = 0.158, d = 0.105, h = 0.042;
  const pulpTex = noiseTex(31, 256, 0.72, 1.0, 6);
  const pulp = phys({ color: 0x9d9a90, roughness: 0.97, bumpMap: pulpTex, bumpScale: 1.6, sheen: 0.12, sheenColor: new THREE.Color(0xcfcbc0) });
  const tray = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, 0.006), pulp); tray.position.y = h / 2; g.add(tray);
  for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) {   // the lid's six domes
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.0235, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), pulp);
    dome.scale.set(1.02, 0.58, 0.98); dome.position.set((i - 1) * 0.05, h - 0.003, (j - 0.5) * 0.048); g.add(dome);
  }
  const paper = boxLabel(w - 0.01, 0.034, (x, cw, ch) => {
    x.fillStyle = '#f4efe2'; x.fillRect(0, 0, cw, ch);
    txt(x, 'FARM EGGS', cw * 0.71, ch * 0.38, { font: `800 ${ch * 0.36}px Archivo`, color: '#2d4a2b', track: 3, maxW: cw * 0.5 });
    txt(x, '6 LARGE · FREE RANGE', cw * 0.71, ch * 0.76, { font: `600 ${ch * 0.16}px Archivo`, color: '#55624f', track: 2, maxW: cw * 0.5 });
  });
  const band = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.01, 0.034), phys({ map: paper, roughness: 0.8 })); band.position.set(0, h / 2 + 0.002, d / 2 + 0.0006); g.add(band);
  const stk = canvasTex(512, 512, (x) => {
    starburst(x, 256, 256, 206, 250, 18, '#e31b23', 0.1);
    x.save(); x.translate(256, 256); x.rotate(-0.16);
    txt(x, 'NOW WITH', 0, -88, { font: '800 64px Archivo', color: '#fff', track: 3 });
    txt(x, 'PROTEIN!', 0, 8, { font: '900 108px Archivo', color: '#fff', track: 1, maxW: 380 });
    txt(x, 'NEW', 0, 104, { font: '800 58px Archivo', color: '#ffe14a', track: 8 }); x.restore();
  });
  const sticker = new THREE.Mesh(new THREE.CircleGeometry(0.0305, 48), phys({ map: stk, transparent: true, roughness: 0.3, clearcoat: 0.8, clearcoatRoughness: 0.1 }));
  sticker.position.set(-0.045, h / 2 + 0.006, d / 2 + 0.0012); g.add(sticker);
  shadows(g); g.traverse((o) => o.layers.enable(1)); return { g, sticker };
}

// ------------------------------------------------------------------ the bathroom scale: dark glass, a red LED readout under it
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
  shadows(g); disp.castShadow = false; g.traverse((o) => o.layers.enable(1));
  return { g, c, tex, disp, key: '' };
}
function drawBath(B, text, glow) {
  const key = text + '|' + glow.toFixed(2); if (key === B.key) return; B.key = key;
  const x = B.c.getContext('2d'), w = B.c.width, h = B.c.height;
  x.clearRect(0, 0, w, h); x.fillStyle = '#050506'; x.beginPath(); x.roundRect(0, 0, w, h, 18); x.fill();
  if (glow <= 0.001) { B.tex.needsUpdate = true; return; }   // off: just dark glass
  const on = `rgba(255,${Math.round(70 + 40 * glow)},${Math.round(60 + 30 * glow)},${glow})`, off = `rgba(90,24,26,${0.16 * glow})`;
  seg7(x, text, { x0: 52, y0: 30, w: 66, h: 114, th: 15, gap: 3, on, off, cells: 3, slant: 0.1 });
  x.globalAlpha = glow; txt(x, 'kg', 452, 128, { font: '600 46px Archivo', color: '#ff5a4a', track: 2 }); x.globalAlpha = 1;
  B.tex.needsUpdate = true;
}
// the kitchen scale: brushed steel, a backlit grey LCD in grams
function makeKitchenScale() {
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

// ------------------------------------------------------------------ hands that can hold a dumbbell (as in film 4)
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
  for (const f of F) {
    const pts = [top(f.P), top(f.M), top(f.D)], gs = [];
    let parent = eg, pp = EL;
    [f.P, f.M, f.D].forEach((m, i) => { const g = new THREE.Group(); g.position.copy(pts[i]).sub(pp); parent.add(g); m.parent.remove(m); m.position.copy(m.userData.home).sub(pts[i]); g.add(m); gs.push(g); parent = g; pp = pts[i]; });
    joints.push(gs);
  }
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
function makeDumbbell() {   // a 6 kg hex dumbbell: rubber heads, a knurled chrome handle; its axis along local x
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
function restGeo(m) {   // an atlas mesh in the standing frame, float normals
  const g = new THREE.BufferGeometry(), h = m.userData.home, P = m.geometry.attributes.position, N = m.geometry.attributes.normal;
  const p = new Float32Array(P.count * 3), n = new Float32Array(P.count * 3);
  for (let i = 0; i < P.count; i++) { p[i * 3] = P.getX(i) + h.x; p[i * 3 + 1] = P.getY(i) + h.y; p[i * 3 + 2] = P.getZ(i) + h.z; n[i * 3] = N.getX(i); n[i * 3 + 1] = N.getY(i); n[i * 3 + 2] = N.getZ(i); }
  g.setAttribute('position', new THREE.BufferAttribute(p, 3)); g.setAttribute('normal', new THREE.BufferAttribute(n, 3)); g.setIndex(m.geometry.index.clone());
  return g;
}

// ------------------------------------------------------------------ three dials in front of the bowls (as in film 4); the first becomes the logo
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
    out.push({ g, knob, set, setMat, face, angle: (v) => -Math.PI * 0.75 + v * Math.PI * 1.5 });
  }
  // the training dial has a hard stop at 1.6 (an orange pin); the meal dial is set to a range (an orange arc, 25 to 30 g)
  const d2 = out[2], a16 = d2.angle(0.8);
  d2.pinMat = glowMat(ORANGE); d2.pinMat.transparent = true; d2.pinMat.opacity = 0;
  d2.pin = new THREE.Mesh(new THREE.CylinderGeometry(0.0055, 0.0055, 0.016, 24), d2.pinMat); d2.pin.position.set(Math.sin(a16) * 0.103, 0.012, -Math.cos(a16) * 0.103); d2.g.add(d2.pin);
  const d3 = out[1]; d3.arcMat = glowMat(ORANGE); d3.arcMat.transparent = true; d3.arcMat.opacity = 0; d3.arcMat.side = THREE.DoubleSide;
  const a0 = d3.angle(0.5), a1 = d3.angle(0.6);
  d3.arcMat.color.multiplyScalar(1.4);
  d3.arc = new THREE.Mesh(new THREE.RingGeometry(0.139, 0.155, 48, 1, Math.PI / 2 - a1, a1 - a0), d3.arcMat); d3.arc.rotation.x = -Math.PI / 2; d3.arc.position.y = 0.0048; d3.g.add(d3.arc);
  return out;
}

// ------------------------------------------------------------------ the cubes: one per gram, an instanced set
const mulberry = (seed) => () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const ORDER = (() => { const r = mulberry(5), o = []; for (let L = 0; L < 14; L++) { const a = [0, 1, 2, 3, 4, 5, 6, 7, 8]; for (let i = 8; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } o.push(a); } o[12] = [4, 1, 3, 5, 7, 0, 2, 6, 8]; return o; })();   // the top layer at 112 g: the middle first, so what lands there has a cube to land on
function colSlot(i) { const L = Math.floor(i / 9), s = ORDER[L][i % 9], gx = (s % 3) - 1, gz = Math.floor(s / 3) - 1; return new THREE.Vector3(COL.x + gx * PITCH, PITCH * L + CUBE / 2 + 0.0002, COL.z + gz * PITCH); }
const colTop = (n) => PITCH * Math.ceil(n / 9);
// the bathroom scale counts up to 70.0 kg; a cube lands for every 1.2 kg (0.83 g per kg: 58 at 70)
const KG0 = 10.72, KG1 = 15.35;
const kgAt = (t) => { const u = clamp01((t - KG0) / (KG1 - KG0)); return 70 * (1 - Math.pow(1 - u, 2.2)); };
const kgInv = (kg) => KG0 + (1 - Math.pow(1 - Math.min(1, kg / 70), 1 / 2.2)) * (KG1 - KG0);
const LAND = (() => {
  const a = new Float32Array(N_COL);
  for (let i = 0; i < 58; i++) a[i] = kgInv((i + 1) / 0.83);
  for (let i = 58; i < 84; i++) a[i] = lerp(21.42, 22.6, s5(0, 1, (i - 58) / 25) * 0.5 + 0.5 * ((i - 58) / 25));
  for (let i = 84; i < N_COL; i++) a[i] = lerp(22.98, 23.95, s5(0, 1, (i - 84) / 27) * 0.5 + 0.5 * ((i - 84) / 27));
  return a;
})();
const DROP = 0.3;
// the overflow: 30 more cubes past 1.6 g per kg land on the top and tumble off to the floor (laid out once the column is placed)
let OVER = null;
const makeOver = () => {
  const r = mulberry(77), out = [], rest = [];
  const ok = (p) => { if (Math.abs(p.x - COL.x) < 0.04 && Math.abs(p.z - COL.z) < 0.04) return false; if (p.x < SCALE.w / 2 + 0.03) return false; for (const q of rest) if (Math.hypot(p.x - q.x, p.z - q.z) < 0.022) return false; return true; };
  for (let k = 0; k < N_OVER; k++) {
    let p; for (let tries = 0; tries < 400; tries++) { const a = lerp(-1.2, 2.3, r()), d = 0.05 + 0.1 * Math.pow(r(), 0.8); p = new THREE.Vector3(COL.x + Math.sin(a) * d, CUBE / 2 + 0.0002, COL.z + Math.cos(a) * d); if (ok(p)) break; }
    rest.push(p);
    const edge = new THREE.Vector3(p.x - COL.x, 0, p.z - COL.z).normalize();
    out.push({ t0: 39.55 + k * 0.104 + 0.03 * (r() - 0.5), rest: p, yaw: r() * Math.PI * 2, edge, hit: new THREE.Vector3(COL.x + edge.x * 0.012 + (r() - 0.5) * 0.01, 0, COL.z + edge.z * 0.012 + (r() - 0.5) * 0.01), spin: (0.5 + r()) * Math.PI * (r() < 0.5 ? -1 : 1), axis: new THREE.Vector3(-edge.z, 0, edge.x) });
  }
  return out;
};
// the bowls: 28 cubes each, dealt round the four bowls from the top of the column down
const BOWL_SLOTS = (() => {
  const r = mulberry(9), s = 0.0158, l1 = [], l2 = [];
  for (let j = -4; j <= 4; j++) for (let i = -4; i <= 4; i++) { const x = (i + (j & 1) * 0.5) * s, z = j * s * 0.866; if (Math.hypot(x, z) < 0.035) l1.push([x, z]); }
  for (let j = -4; j <= 4; j++) for (let i = -4; i <= 4; i++) { const x = (i + (j & 1) * 0.5 + 0.5) * s, z = (j + 0.33) * s * 0.866; if (Math.hypot(x, z) < 0.03) l2.push([x, z]); }
  l1.sort((a, b) => Math.hypot(...a) - Math.hypot(...b)); l2.sort((a, b) => Math.hypot(...a) - Math.hypot(...b));
  const out = [];
  for (let k = 0; k < 28; k++) {
    const top = k >= l1.length, [x, z] = top ? l2[k - l1.length] : l1[k];
    out.push({ p: new THREE.Vector3(x + (r() - 0.5) * 0.002, 0.0125 + CUBE / 2 + (top ? PITCH : 0), z + (r() - 0.5) * 0.002), yaw: (r() - 0.5) * 0.9, tilt: top ? (r() - 0.5) * 0.3 : (r() - 0.5) * 0.06 });
  }
  return { out, n1: l1.length, n2: l2.length };
})();
const DEAL0 = 44.55, DEAL_DT = 0.0283, FLY = 0.56;
const dealT = (i) => DEAL0 + (N_COL - 1 - i) * DEAL_DT;

const _m4 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _e = new THREE.Euler(), _s = new THREE.Vector3(), _p = new THREE.Vector3(), _v = new THREE.Vector3();
const UPY = new THREE.Vector3(0, 1, 0);
function cubeAt(i, t, out) {   // -> { p, q, s } or null when not there yet
  // the column's cubes
  if (i < N_COL) {
    const tl = LAND[i]; if (t < tl - DROP) return null;
    const home = colSlot(i), sd = hash(i * 7.31), yaw0 = (sd - 0.5) * 0.9;
    if (t < dealT(i)) {
      const k = clamp01((t - (tl - DROP)) / DROP), fall = k * k;   // falling, then a tiny settle
      out.p.copy(home); out.p.y += 0.07 * (1 - fall) + 0.0025 * Math.sin(Math.PI * clamp01((t - tl) / 0.09)) * (t > tl ? 1 : 0);
      out.q.setFromAxisAngle(UPY, yaw0 * (1 - s5(0, 1, k))); out.s = lerp(0.55, 1, outBack(clamp01(k * 1.25), 1.2)); return out;
    }
    // dealt into a bowl
    const b = i % 4, j = Math.floor(i / 4), B = BOWL_SLOTS.out[j], dst = _v.copy(BOWLS[b]).add(B.p);
    const u = clamp01((t - dealT(i)) / FLY), e = s5(0, 1, u), apex = Math.max(home.y, dst.y) + 0.11 + 0.04 * hash(i * 3.3);
    out.p.lerpVectors(home, dst, e); out.p.y = lerp(home.y, dst.y, e) + (apex - lerp(home.y, dst.y, e)) * Math.sin(Math.PI * e) * 1.0;
    if (u >= 1) out.p.y += 0.002 * Math.sin(Math.PI * clamp01((t - dealT(i) - FLY) / 0.08));
    _e.set(B.tilt, B.yaw + hash(i) * 0.4, B.tilt * 0.5); _q2.setFromEuler(_e); _q.identity().slerp(_q2, e);
    out.q.setFromAxisAngle(_v.set(hash(i * 1.7) - 0.5, 0.3, hash(i * 2.9) - 0.5).normalize(), Math.PI * 2 * e).premultiply(_q);
    out.s = 1; return out;
  }
  // the overflow: lands on the top, tumbles off, rests on the floor
  const O = OVER[i - N_COL]; if (t < O.t0) return null;
  const yTop = colTop(N_COL) + CUBE / 2, t1 = O.t0 + 0.26, t2 = t1 + 0.34;
  if (t < t1) { const k = clamp01((t - O.t0) / 0.26); out.p.copy(O.hit); out.p.y = yTop + 0.09 * (1 - k * k); out.q.setFromAxisAngle(UPY, O.yaw * 0.3 * (1 - k)); out.s = lerp(0.6, 1, outBack(clamp01(k * 1.3), 1.2)); return out; }
  if (t < t2) {
    const k = (t - t1) / 0.34, x = lerp(O.hit.x, O.rest.x, k), z = lerp(O.hit.z, O.rest.z, k);
    const y = lerp(yTop, O.rest.y, k * k) + 0.03 * Math.sin(Math.PI * k) * (1 - k);
    out.p.set(x, y, z); out.q.setFromAxisAngle(O.axis, O.spin * s5(0, 1, k)).premultiply(_q2.setFromAxisAngle(UPY, O.yaw * s5(0, 1, k))); out.s = 1; return out;
  }
  out.p.copy(O.rest); out.p.y += 0.004 * Math.abs(Math.sin(Math.PI * clamp01((t - t2) / 0.12))) * (t - t2 < 0.12 ? 1 : 0);
  out.q.setFromAxisAngle(O.axis, O.spin).premultiply(_q2.setFromAxisAngle(UPY, O.yaw));
  // settle flat: snap the tumble to the nearest quarter turn
  const qt = Math.round(O.spin / (Math.PI / 2)) * (Math.PI / 2), w = s5(t2, t2 + 0.12, t);
  out.q.setFromAxisAngle(O.axis, lerp(O.spin, qt, w)).premultiply(_q2.setFromAxisAngle(UPY, O.yaw));
  out.s = 1; return out;
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
  for (const m of W.kidneys) { m.material.transparent = true; m.material.opacity = 0; m.visible = false; m.castShadow = false; m.material.emissive.set(0xff8a6a); }
  const ground = Math.min(R.legs.Right.ground, R.legs.Left.ground);
  R.root.position.y = SCALE.h - ground;
  const heelZ = Math.min(R.legs.Right.heel.z, R.legs.Left.heel.z), toeZ = Math.max(R.legs.Right.toeZ, R.legs.Left.toeZ);
  W.scaleZ = (heelZ + toeZ) / 2 - 0.005;
  COL.z = W.scaleZ + 0.105; OVER = makeOver();
  // ---- the arms' muscles (they arrive with the dumbbell): from the shoulder to the wrist, both arms
  const ARMM = /(biceps brachii|brachialis|triceps brachii|coracobrachialis|deltoid|brachioradialis|pronator teres|flexor carpi|palmaris longus|extensor carpi radialis)/i;
  const armSoft = await loadAnatomy((p) => (ARMM.test(p.name) && /\b(right|left)\b/i.test(p.name) ? 'muscle' : null));
  const sideOf = (n) => (/\bright\b/i.test(n) ? 'Right' : 'Left');
  W.armMat = {}; W.armMeshes = [];
  for (const Side of ['Right', 'Left']) { const m = tissueMat('muscle', { transparent: true, opacity: 0 }); m.emissive.set(0xff5a1e); W.armMat[Side] = m; }
  for (const m of armSoft) {
    const Side = sideOf(m.userData.name);
    const sk = skinned(restGeo(m), armBinder(R, Side), R, W.armMat[Side]); sk.mesh.castShadow = sk.mesh.receiveShadow = true; sk.mesh.layers.enable(1); sk.mesh.visible = false; scene.add(sk.mesh);
    sk.mesh.position.y = 0; W.skins.push(sk); W.armMeshes.push(sk.mesh);
  }
  // ---- the left hand closes round a dumbbell
  W.hand = rigHand(R, 'Left');
  W.db = makeDumbbell(); W.db.matrixAutoUpdate = false; W.db.visible = false; scene.add(W.db);
  W.db.userData.hm = new THREE.Matrix4().compose(W.hand.handle, new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1, 0, 0), W.hand.across), new THREE.Vector3(1, 1, 1));
  W.db.userData.mats = []; W.db.traverse((o) => { if (o.isMesh && !W.db.userData.mats.includes(o.material)) { o.material.transparent = true; W.db.userData.mats.push(o.material); } });
  // ---- the factory stamp: printed down the front of the left shin bone, like a part number on a tube
  { const tib = R.byName.get('Left tibia');
    W.stampSpot = stampLine(tib, { a: [0.15, 0.09, 0.26], b: [0.15, -0.07, 0.26], dir: [-0.5, 0, -0.87], top: [1, 0, 0] });
    if (W.stampSpot) W.stamp = stamp(tib, { canvas: labelCanvas('HUMAN FACTORY SETTINGS'), center: W.stampSpot.center, normal: W.stampSpot.normal, up: W.stampSpot.up, width: 0.13, depth: 0.03, opacity: 0.6 }); }
  // ---- the bathroom scale under the feet
  W.bath = makeBathScale(); W.bath.g.position.set(0, 0, W.scaleZ); scene.add(W.bath.g);
  // ---- the end-cap: a dark steel gondola, white label rails, a header; products on four shelves
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
    // the second shelf: protein bars, protein water
    const barTex = boxLabel(0.2, 0.09, (x, cw, ch) => { x.fillStyle = '#ffd21a'; x.fillRect(0, 0, cw, ch); x.fillStyle = '#7a3cff'; x.fillRect(0, ch * 0.66, cw, ch * 0.34);
      txt(x, 'PROTEIN BAR', cw / 2, ch * 0.34, { font: `900 ${ch * 0.36}px Archivo`, color: '#2a1158', track: 2, maxW: cw * 0.9 }); txt(x, '12 × 60 g', cw / 2, ch * 0.84, { font: `700 ${ch * 0.18}px Archivo`, color: '#fff', track: 6 }); });
    put(makeBox(0.2, 0.09, 0.1, barTex, 0xffd21a, 0x2a1158), 0.665, 1, -0.16);
    const watTex = canvasTex(512, 256, (x, cw, ch) => { x.fillStyle = '#e9f6ff'; x.fillRect(0, 0, cw, ch); x.fillStyle = '#17a0e6'; x.fillRect(0, ch * 0.72, cw, ch * 0.28);
      txt(x, 'PROTEIN', cw / 2, ch * 0.3, { font: '900 66px Archivo', color: '#0b5ea8', track: 3, maxW: 200 }); txt(x, 'WATER', cw / 2, ch * 0.56, { font: '800 44px Archivo', color: '#17a0e6', track: 10, maxW: 200 }); txt(x, '20 g', cw / 2, ch * 0.86, { font: '700 30px Archivo', color: '#fff', track: 4 }); });
    for (const [x, ry] of [[0.86, 0.1], [0.935, -0.05], [1.01, 0.2]]) put(makeBottle(0.031, 0.21, watTex), x, 1, -0.15, ry);
    // the bottom shelf: protein flakes, protein pasta
    const flkTex = boxLabel(0.19, 0.28, (x, cw, ch) => { const g = x.createLinearGradient(0, 0, 0, ch); g.addColorStop(0, '#2bb673'); g.addColorStop(1, '#127a45'); x.fillStyle = g; x.fillRect(0, 0, cw, ch);
      txt(x, 'PROTEIN', cw / 2, ch * 0.17, { font: `900 ${cw * 0.2}px Archivo`, color: '#fff', track: 2, maxW: cw * 0.88 }); txt(x, 'FLAKES', cw / 2, ch * 0.31, { font: `900 ${cw * 0.24}px Archivo`, color: '#ffe14a', track: 4, maxW: cw * 0.88 });
      x.fillStyle = '#f7f1e3'; x.beginPath(); x.ellipse(cw / 2, ch * 0.66, cw * 0.36, ch * 0.13, 0, 0, Math.PI * 2); x.fill(); for (let k = 0; k < 40; k++) { x.fillStyle = k % 2 ? '#d99a3a' : '#e8b250'; x.beginPath(); x.ellipse(cw / 2 + (hash(k) - 0.5) * cw * 0.5, ch * 0.62 + (hash(k + 9) - 0.5) * ch * 0.12, cw * 0.04, cw * 0.025, hash(k + 3) * 3, 0, Math.PI * 2); x.fill(); } });
    put(makeBox(0.19, 0.28, 0.07, flkTex, 0x127a45, 0x2bb673), 0.67, 0, -0.17);
    const pstTex = boxLabel(0.12, 0.24, (x, cw, ch) => { x.fillStyle = '#1a2a6c'; x.fillRect(0, 0, cw, ch); x.fillStyle = '#f2c14e'; x.fillRect(0, ch * 0.42, cw, ch * 0.2);
      txt(x, 'PROTEIN', cw / 2, ch * 0.18, { font: `900 ${cw * 0.24}px Archivo`, color: '#fff', track: 2, maxW: cw * 0.9 }); txt(x, 'PASTA', cw / 2, ch * 0.31, { font: `800 ${cw * 0.22}px Archivo`, color: '#f2c14e', track: 6, maxW: cw * 0.9 });
      txt(x, 'PENNE', cw / 2, ch * 0.52, { font: `800 ${cw * 0.14}px Archivo`, color: '#1a2a6c', track: 8 }); });
    put(makeBox(0.12, 0.24, 0.06, pstTex, 0x1a2a6c, 0xf2c14e), 0.9, 0, -0.17, -0.1);
    put(makeBox(0.12, 0.24, 0.06, pstTex, 0x1a2a6c, 0xf2c14e), 1.04, 0, -0.17, 0.06);
  }
  // ---- the lean mass the trials found: a 300 g block of muscle (6.6 cm a side), and the 49 trials as points of light
  { const fib = canvasTex(256, 256, (x, w, h) => { x.fillStyle = '#808080'; x.fillRect(0, 0, w, h); for (let k = 0; k < 90; k++) { const y = (k / 90) * h + (hash(k) - 0.5) * 2; x.strokeStyle = `rgba(${hash(k * 3) > 0.5 ? 255 : 0},${hash(k * 3) > 0.5 ? 255 : 0},${hash(k * 3) > 0.5 ? 255 : 0},0.35)`; x.lineWidth = 1 + hash(k * 5) * 1.5; x.beginPath(); x.moveTo(0, y); x.bezierCurveTo(w * 0.3, y + 3, w * 0.7, y - 3, w, y + 1); x.stroke(); } }, { srgb: false });
    fib.wrapS = fib.wrapT = THREE.RepeatWrapping;
    W.blockMat = tissueMat('muscle', { bumpMap: fib, bumpScale: 1.4, roughness: 0.42, clearcoat: 0.45, clearcoatRoughness: 0.25 }); W.blockMat.emissive.set(0xff5a1e);
    W.block = new THREE.Mesh(new RoundedBoxGeometry(0.066, 0.066, 0.066, 4, 0.009), W.blockMat); W.block.castShadow = W.block.receiveShadow = true; W.block.layers.enable(1); W.block.visible = false; scene.add(W.block);
    W.dots = new THREE.InstancedMesh(new THREE.SphereGeometry(0.0062, 16, 12), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xeceef1).multiplyScalar(1.6) }), 49); W.dots.visible = false; W.dots.frustumCulled = false; scene.add(W.dots); }
  // ---- the cubes
  { const tex = noiseTex(23, 256, 0.78, 1.0, 1);
    W.cubeMat = phys({ color: 0xf0e8d6, roughness: 0.82, roughnessMap: tex, bumpMap: tex, bumpScale: 0.5, sheen: 0.35, sheenColor: new THREE.Color(0xfff6e2), sheenRoughness: 0.6 });
    W.cubes = new THREE.InstancedMesh(new RoundedBoxGeometry(CUBE, CUBE, CUBE, 2, 0.0017), W.cubeMat, N_CUBES); W.cubes.castShadow = W.cubes.receiveShadow = true; W.cubes.layers.enable(1); W.cubes.frustumCulled = false; scene.add(W.cubes);
    // the levels on the column: thin orange marks at 58, 84 and 112 g
    W.marks = [58, 84, 112].map((n) => { const m = glowMat(ORANGE); m.transparent = true; m.opacity = 0; const y = (n / 9) * PITCH, g = new THREE.Group();
      for (const [dx, dz, ry] of [[0, 1, 0], [0, -1, 0], [1, 0, Math.PI / 2], [-1, 0, Math.PI / 2]]) { const b = new THREE.Mesh(new THREE.BoxGeometry(3 * PITCH + 0.008, 0.0016, 0.0016), m); b.position.set(COL.x + dx * (1.5 * PITCH + 0.003), y, COL.z + dz * (1.5 * PITCH + 0.003)); b.rotation.y = ry; g.add(b); }
      scene.add(g); return { g, m, y }; }); }
  // ---- the bowls: dark stoneware, on the floor in front
  { const prof = [[0.0, 0.0], [0.04, 0.0], [0.046, 0.005], [0.064, 0.026], [0.074, 0.05], [0.0755, 0.054], [0.0725, 0.0555], [0.069, 0.052], [0.058, 0.03], [0.046, 0.0145], [0.04, 0.0125], [0.0, 0.0125]].map(([a, b]) => new THREE.Vector2(a, b));
    const geo = new THREE.LatheGeometry(prof, 96); const glaze = noiseTex(51, 256, 0.8, 1.0, 2);
    const mat = phys({ color: 0x2b2a29, roughness: 0.38, roughnessMap: glaze, clearcoat: 0.5, clearcoatRoughness: 0.3, side: THREE.DoubleSide });
    W.bowls = BOWLS.map((p) => { const m = new THREE.Mesh(geo, mat); m.position.copy(p); m.castShadow = m.receiveShadow = true; m.layers.enable(1); scene.add(m); return m; }); }
  // ---- the dials, under the floor until the settings
  W.dials = buildDials(scene); W.dials.forEach((d, i) => d.g.position.copy(DIALS[i]));
  W.logoRing = makeLogoRing(LOGO_R); W.logoRing.g.rotation.x = -Math.PI / 2; W.logoRing.g.position.y = 0.0665 + 0.0012; W.dials[0].g.add(W.logoRing.g);
  // ---- light
  W.key = spot(scene, { color: 0xffe9d2, pos: new THREE.Vector3(-1.1, 3.1, 1.9), target: new THREE.Vector3(0.2, 0.7, 0.1), angle: 0.52, penumbra: 0.85, shadow: true, size: cfg.shadow ?? 1024 });
  W.key.shadow.camera.far = 7;
  W.rim = spot(scene, { color: 0xa9c4ff, pos: new THREE.Vector3(1.5, 2.3, -1.9), target: new THREE.Vector3(0.1, 0.9, 0), angle: 0.6, penumbra: 0.9 });
  W.fill = spot(scene, { color: 0xc8d6ff, pos: new THREE.Vector3(-1.9, 0.7, 1.7), target: new THREE.Vector3(0.2, 0.5, 0.1), angle: 0.7, penumbra: 1 });
  W.shelfLight = spot(scene, { color: 0xfff1d8, pos: new THREE.Vector3(0.84, 2.7, 0.95), target: new THREE.Vector3(0.82, 0.9, -0.2), angle: 0.34, penumbra: 0.55 });
  W.dialLight = spot(scene, { color: 0xffe9d2, pos: new THREE.Vector3(0.2, 1.8, 2.0), target: new THREE.Vector3(0, 0, 0.9), angle: 0.5, penumbra: 0.8 });
  W.lowLight = spot(scene, { color: 0xffeedd, pos: new THREE.Vector3(0.75, 0.75, 1.1), target: new THREE.Vector3(0.22, 0.08, 0.15), angle: 0.4, penumbra: 0.9 });
  W.timing = { land: Array.from(LAND), over: OVER.map((o) => o.t0), deal: Array.from({ length: N_COL }, (_, i) => dealT(i) + FLY) };   // for the sound
  return { stamp: W.stampSpot, scaleZ: W.scaleZ, bowl: [BOWL_SLOTS.n1, BOWL_SLOTS.n2] };
}

// ------------------------------------------------------------------ the left arm: a standing curl (three reps), then the weight goes
const REPS = [26.2, 28.4, 30.6], UP = 0.95, HOLD = 0.16, DOWN = 1.08;
function curlShape(t) {
  for (const r0 of REPS) { const u = t - r0; if (u < 0 || u > UP + HOLD + DOWN) continue; if (u < UP) return s5(0, UP, u); if (u < UP + HOLD) return 1; return 1 - s5(UP + HOLD, UP + HOLD + DOWN, u); }
  return 0;
}
function armL(t) {
  const on = s5(25.45, 26.15, t) * (1 - s5(33.1, 33.9, t)), c = curlShape(t);
  return { pose: { dir: [lerp(0, 0.09, on), -1, lerp(0, 0.04, on) + 0.15 * c], twist: 0, elbow: lerp(0.05, 0.2, on) + 1.85 * c, retract: 0, elevate: 0 },
    grip: s5(25.5, 26.0, t) * (1 - s5(33.0, 33.5, t)), held: ss(25.55, 25.95, t) * (1 - ss(32.95, 33.3, t)), c };
}
function applyBody(t) {
  const R = W.rig;
  R.pelvis.position.copy(R.P0); R.pelvis.rotation.set(0, 0, 0);
  bendSpine(R.seg, { tho: 0.02, cer: 0.02 });
  for (const Side of ['Right', 'Left']) { const G = R.legs[Side]; G.hip.quaternion.identity(); G.knee.quaternion.identity(); G.ankle.quaternion.identity(); }
  poseArm(R.arms.Right, { dir: [0.03, -1, 0], twist: 0, elbow: 0.08 });
  const a = armL(t); poseArm(R.arms.Left, a.pose); W.hand.curl(lerp(0, 1, a.grip));
  R.root.updateMatrixWorld(true);
  const db = W.db; db.visible = a.held > 0.002; db.matrix.multiplyMatrices(R.arms.Left.elbow.matrixWorld, db.userData.hm); db.matrixWorldNeedsUpdate = true;
  for (const m of db.userData.mats) { m.opacity = a.held; m.depthWrite = a.held > 0.5; }
  return a;
}

// ------------------------------------------------------------------ the 49 trials and the 300 g they add
const GRID = new THREE.Vector3(0.6, 1.27, 0.03), BLOCK_C = new THREE.Vector3(0.635, 1.205, -0.165);
const DOT_IN = 30.36, GATHER0 = 31.55, GATHER1 = 32.35, BLOCK_DROP = 32.86;
function blockPos(t, out) {
  const rest = out.set(KS.x, KS.y + W.ks.top + 0.033, KS.z - 0.008);
  if (t >= T.three) return rest;
  const k = clamp01((t - BLOCK_DROP) / (T.three - BLOCK_DROP));
  return out.lerpVectors(BLOCK_C, rest.clone(), k * k);
}

// ------------------------------------------------------------------ the camera: one path, no cuts
let CAM = null;
function buildCam() {
  const eg = W.eggs.g.position, ec = [eg.x - 0.045, eg.y + 0.025, eg.z + 0.06];   // the sticker
  const tub = W.massTub.position, tubC = [tub.x - 0.05, tub.y + 0.15, tub.z + 0.08];
  const ks = [KS.x, KS.y + 0.06, KS.z];
  const col = [COL.x - 0.03, 0.1, COL.z];
  return camTrack([
    { t: -3.0, p: V3(ec[0] + 0.05, ec[1] + 0.15, ec[2] + 0.86), l: V3(ec[0] + 0.045, ec[1] - 0.012, ec[2]), fov: 30 },
    { t: 0.0, p: V3(ec[0] + 0.048, ec[1] + 0.14, ec[2] + 0.8), l: V3(ec[0] + 0.045, ec[1] - 0.012, ec[2]), fov: 30 },   // the eggs, and their sticker
    { t: 2.55, p: V3(ec[0] + 0.04, ec[1] + 0.13, ec[2] + 0.72), l: V3(ec[0] + 0.04, ec[1] - 0.01, ec[2]), fov: 30 },
    { t: 5.0, p: V3(0.84, 1.3, 2.75), l: V3(0.82, 1.13, -0.18), fov: 32 },                           // back: the whole end-cap, PROTEIN everywhere
    { t: 8.4, p: V3(0.42, 1.06, 3.7), l: V3(0.3, 0.95, 0.0), fov: 34 },                              // and the skeleton beside it, on a scale
    { t: 10.9, p: V3(0.36, 0.52, 1.2), l: V3(0.15, 0.06, COL.z), fov: 30 },                          // down to the scale's readout and the floor beside it
    { t: 13.4, p: V3(0.31, 0.45, 1.06), l: V3(0.155, 0.06, COL.z + 0.02), fov: 30 },
    { t: 18.6, p: V3(0.32, 0.46, 1.04), l: V3(0.16, 0.065, COL.z + 0.02), fov: 30 },
    { t: 21.2, p: V3(0.42, 0.5, 0.98), l: V3(0.19, 0.12, COL.z), fov: 30 },                           // the column grows: the US range
    { t: 24.6, p: V3(0.44, 0.52, 1.0), l: V3(0.19, 0.13, COL.z), fov: 30 },
    { t: 26.9, p: V3(1.47, 1.33, 0.98), l: V3(0.2, 1.22, 0.1), fov: 32 },                            // up to the arm: a curl, seen from its side
    { t: 29.4, p: V3(1.44, 1.34, 0.95), l: V3(0.22, 1.23, 0.09), fov: 32 },
    { t: 30.9, p: V3(0.86, 1.38, 1.36), l: V3(0.47, 1.24, 0.0), fov: 32 },                           // the 49 trials appear
    { t: 32.3, p: V3(0.86, 1.3, 1.24), l: V3(0.6, 1.17, -0.08), fov: 32 },                           // they gather into a block
    { t: 34.4, p: V3(0.82, 1.22, 0.94), l: V3(ks[0] + 0.07, ks[1] + 0.035, ks[2]), fov: 30 },        // on the kitchen scale: 300 g
    { t: 36.5, p: V3(0.72, 1.22, 0.9), l: V3(0.725, 1.13, -0.15), fov: 30 },                         // beside the tub's arm
    { t: 38.2, p: V3(0.72, 1.22, 0.86), l: V3(0.73, 1.13, -0.15), fov: 30 },
    { t: 40.0, p: V3(0.6, 0.5, 0.92), l: V3(COL.x, 0.1, COL.z), fov: 30 },                            // down to the column: it overflows
    { t: 43.5, p: V3(0.58, 0.52, 0.96), l: V3(COL.x, 0.09, COL.z + 0.03), fov: 30 },
    { t: 45.9, p: V3(-0.28, 1.32, 1.5), l: V3(-0.31, 0.02, 0.7), fov: 32 },                          // across and back: the four bowls, the meal dial
    { t: 48.7, p: V3(-0.3, 1.3, 1.55), l: V3(-0.32, 0.02, 0.72), fov: 32 },
    { t: 50.2, p: V3(0.04, 0.74, 1.86), l: V3(DIALS[0].x + 0.06, 0.05, DIALS[0].z), fov: 32 },       // the every-day dial
    { t: 51.3, p: V3(0.06, 0.74, 1.86), l: V3(DIALS[0].x + 0.07, 0.05, DIALS[0].z), fov: 32 },
    { t: 52.9, p: V3(0.42, 0.74, 1.88), l: V3(DIALS[2].x + 0.05, 0.05, DIALS[2].z), fov: 32 },       // the training dial, and its stop
    { t: 57.3, p: V3(0.44, 0.7, 1.84), l: V3(DIALS[2].x + 0.06, 0.05, DIALS[2].z), fov: 32, tens: 0.25 },
    { t: 59.0, p: V3(0.32, 1.16, 1.08), l: V3(0.0, 1.06, -0.05), fov: 32 },                          // up to the kidneys
    { t: 64.8, p: V3(0.28, 1.13, 0.98), l: V3(0.0, 1.05, -0.05), fov: 32, tens: 0.3 },
    { t: 66.7, p: V3(DIALS[0].x + 0.03, 0.92, 1.42), l: V3(DIALS[0].x, 0.06, DIALS[0].z), fov: 30 },
    { t: T.logo, p: V3(DIALS[0].x, 1.12, DIALS[0].z + 0.005), l: V3(DIALS[0].x, 0.0665, DIALS[0].z), fov: 30, stop: true },   // straight down on the first dial: the logo lands here
  ]);
}
function camPose(S, t) {
  const v = S.cfg.view;
  if (v) { const V = { wide: [[0.4, 1.1, 3.6], [0.35, 0.85, 0], 36], shelf: [[0.86, 1.08, 2.0], [0.82, 0.93, -0.18], 32], eggs: [[1.0, 1.1, 0.25], [0.98, 1.06, -0.1], 30], col: [[0.5, 0.45, 0.86], [0.22, 0.14, 0.1], 30], arm: [[0.86, 1.2, 1.3], [0.32, 1.02, 0.06], 32], bowls: [[0.06, 0.92, 1.52], [0.02, 0.04, 0.42], 32], dials: [[0, 0.74, 1.88], [0, 0.05, 0.98], 32], kid: [[0.3, 1.15, 1.05], [0, 1.06, -0.05], 32], tub: [[0.78, 1.21, 0.62], [0.735, 1.14, -0.15], 30], shin: [[-0.25, 0.32, 0.55], [0.08, 0.26, 0.0], 30] }[v]; if (V) return { p: V[0], l: V[1], fov: V[2] }; }
  if (!CAM) CAM = buildCam();
  if (t <= T.logo) return CAM(t);
  const P = CAM(T.logo), k = ss(T.logo, T.end, t);
  return { p: [P.p[0], lerp(P.p[1], P.p[1] - 0.08, k), P.p[2]], l: P.l, fov: 30 };
}

// ------------------------------------------------------------------ one moment of the film
const _b = new THREE.Vector3(), _c = { p: new THREE.Vector3(), q: new THREE.Quaternion(), s: 1 };
function update(S, t) {
  const scene = S.scene, a = applyBody(t);
  // ---- the arms' muscles: in with the dumbbell; the working arm lights a little with each curl
  const musc = ss(25.5, 26.2, t);
  for (const Side of ['Right', 'Left']) { const m = W.armMat[Side]; m.opacity = musc; m.transparent = musc < 0.999; m.depthWrite = musc > 0.5; }
  W.armMat.Left.emissiveIntensity = 0.02 + (0.1 + 0.08 * ss(T.alittle - 0.3, T.alittle + 0.2, t) * (1 - ss(30.3, 31, t))) * a.c * ss(26, 26.5, t);
  W.armMat.Right.emissiveIntensity = 0.02;
  for (const m of W.armMeshes) m.visible = musc > 0.002;
  if (musc > 0.002) for (const sk of W.skins) sk.update(0);
  // ---- the bathroom scale: wakes, counts to 70.0, holds, switches itself off
  { let text = '', glow = 0;
    if (t > 10.38 && t < 10.62) { text = '88.8'; glow = 1; }
    else if (t >= 10.62 && t < 22.2) { const kg = kgAt(t); text = kg.toFixed(1); glow = t > 15.5 && t < 16.1 ? (Math.floor((t - 15.5) * 6) % 2 ? 0.25 : 1) : 1; }
    else if (t >= 22.2 && t < 22.5) { text = '70.0'; glow = 1 - ss(22.2, 22.5, t); }
    drawBath(W.bath, text || '   ', glow); }
  // ---- the kitchen scale: 0 g until the block lands, then 300 g
  drawKitchen(W.ks, t < T.three ? 0 : 300 * s5(T.three, T.three + 0.4, t));
  // ---- the cubes
  { let n = 0;
    for (let i = 0; i < N_CUBES; i++) { const c = cubeAt(i, t, _c); if (!c) { _m4.makeScale(0, 0, 0); } else { _s.setScalar(c.s); _m4.compose(c.p, c.q, _s); n++; } W.cubes.setMatrixAt(i, _m4); }
    W.cubes.instanceMatrix.needsUpdate = true; W.cubes.visible = n > 0; }
  // the level marks: 58 when the column reaches it, then 84 and 112; gone when the cubes are dealt
  const gone = 1 - ss(44.4, 44.8, t);
  W.marks[0].m.opacity = ss(T.fiftyeight - 0.2, T.fiftyeight + 0.3, t) * gone;
  W.marks[1].m.opacity = ss(T.one2 + 0.6, T.two + 0.2, t) * gone;
  W.marks[2].m.opacity = ss(T.one6 + 0.4, T.six + 0.3, t) * gone;
  // ---- the 49 trials: points of light in a grid, they gather into a block of lean mass; it drops onto the kitchen scale
  { const on = t > DOT_IN - 0.05 && t < GATHER1 + 0.05; W.dots.visible = on;
    if (on) { for (let i = 0; i < 49; i++) {
      const gx = (i % 7) - 3, gy = 3 - Math.floor(i / 7), home = _p.set(GRID.x + gx * 0.026, GRID.y + gy * 0.026, GRID.z);
      const pop = outBack(clamp01((t - (DOT_IN + i * 0.019)) / 0.22), 2.2), g = s5(GATHER0 + (i % 7) * 0.02, GATHER1 - 0.1 + (i % 7) * 0.02, t);
      _v.copy(home).lerp(BLOCK_C, g); _s.setScalar(Math.max(0.0001, pop * (1 - 0.85 * g))); _m4.compose(_v, _q.identity(), _s); W.dots.setMatrixAt(i, _m4); }
      W.dots.instanceMatrix.needsUpdate = true; } }
  { const k = outBack(clamp01((t - (GATHER1 - 0.25)) / 0.4), 1.5); W.block.visible = k > 0.001; W.block.scale.setScalar(Math.max(0.001, k));
    blockPos(t, W.block.position); W.block.rotation.set(0, -0.35 + 0.35 * s5(GATHER1 - 0.2, T.three, t), 0);
    W.blockMat.emissiveIntensity = 0.03 + 0.25 * (1 - ss(T.three, T.three + 0.8, t)) * ss(GATHER1 - 0.3, GATHER1, t); }
  // ---- the dials rise as the bowls fill; the meal dial is set to 25 to 30, then the day and training dials
  const endDark = ss(T.final + 0.3, T.logo - 0.3, t);
  W.dials.forEach((d, i) => {
    const t0 = [T.so - 0.55, 44.55, T.so - 0.4][i], up = s5(t0, t0 + 0.9, t); d.g.position.y = lerp(-0.075, 0, up); d.g.visible = up > 0.001;
    let v = 0, setO = 0;
    if (i === 0) { v = 0.4 * s5(T.point8 - 0.1, T.point8 + 0.5, t); setO = ss(T.point8 + 0.3, T.point8 + 0.6, t); v = lerp(v, 0.5, s5(T.final + 0.2, T.logo - 0.3, t)); }
    if (i === 2) { v = 0.8 * s5(T.one8 - 0.25, T.one8 + 0.45, t); setO = ss(T.one8 + 0.2, T.one8 + 0.5, t);
      // past 1.6: it is wound back and thrown at the stop, twice; it never passes it
      v -= stopBounce(t - (T.past + 0.1));
      d.pinMat.opacity = ss(T.one8 + 0.3, T.one8 + 0.7, t) * (1 - endDark); d.pin.position.y = 0.012 * ss(T.one8 + 0.3, T.one8 + 0.7, t) + 0.0005; }
    if (i === 1) { v = 0.55 * s5(T.tf - 0.1, T.thirty + 0.3, t); setO = 0; d.arcMat.opacity = ss(T.tf, T.thirty + 0.2, t) * (1 - endDark); }
    d.knob.rotation.y = -d.angle(v);
    d.setMat.opacity = setO * (1 - endDark);
    const sv = i === 0 ? 0.4 : i === 2 ? 0.8 : 0.55, ang = d.angle(sv), r = 0.147; d.set.position.set(Math.sin(ang) * r, 0.0048, -Math.cos(ang) * r); d.set.rotation.y = -ang;
  });
  { const logoK = s5(T.final + 0.4, T.logo - 0.25, t); W.logoRing.set({ weight: logoK, white: logoK, hours: 0, hand: ss(T.logo - 0.4, T.logo - 0.15, t), handScale: outBack(clamp01((t - (T.logo - 0.4)) / 0.35), 1.8) }); }
  // ---- the kidneys: last, softly lit, behind the lower ribs
  { const k = ss(T.kidney - 0.25, T.kidney + 0.5, t) * (1 - ss(T.final, T.final + 0.8, t));
    for (const m of W.kidneys) { m.visible = k > 0.002; m.material.opacity = k * (/bladder|ureter/i.test(m.userData.name) ? 0.7 : 1); m.material.depthWrite = k > 0.5; m.material.emissiveIntensity = 0.05 + 0.12 * k * (0.75 + 0.25 * Math.sin((t - T.kidney) * 2.4)); } }
  // ---- light
  const fig = 1 - endDark;
  W.key.intensity = 5.6 * fig; W.rim.intensity = 2.3 * fig; W.fill.intensity = 0.8 * fig;
  W.shelfLight.intensity = 6.5 * (1 - 0.55 * ss(9.0, 11.0, t) * (1 - ss(25.5, 27.5, t))) * (1 - 0.6 * ss(38.6, 40.0, t)) * fig;
  W.dialLight.intensity = 3.2 * ss(44.4, 45.6, t) * (1 - 0.6 * endDark);
  W.lowLight.intensity = 1.6 * ss(9.5, 11, t) * (1 - ss(24.8, 26.2, t)) + 1.6 * ss(38.5, 39.8, t) * (1 - ss(44.0, 45.5, t));
  S.tableMat.color.setScalar(FLOOR * (1 - endDark * 0.9)); scene.environmentIntensity = 0.12 * (1 - endDark); S.reflAmt = 0.9 * (1 - endDark);
}
function focusAt(S, t, P) { return Math.hypot(P.p[0] - P.l[0], P.p[1] - P.l[1], P.p[2] - P.l[2]); }

// ------------------------------------------------------------------ the words on screen
const CAPS = [
  { t0: 0.35, t1: 2.6, top: 300, size: 96, html: 'How much <em>protein</em><br>do you need?' },
  { t0: 2.73, t1: 5.7, top: 300, size: 90, html: 'Less than the<br><em>supplement aisle</em> hopes.' },
  { t0: 6.31, t1: 13.2, top: 292, size: 84, html: 'Europe’s experts:<br><em>0.8 g</em> per kg a day' },
  { t0: 13.77, t1: 18.7, top: 292, size: 88, html: 'You weigh 70 kg?<br>About <em>58 g</em> a day' },
  { t0: 19.21, t1: 24.7, top: 292, size: 84, html: 'US guidelines:<br><em>1.2 to 1.6 g</em> per kg' },
  { t0: 25.59, t1: 28.9, top: 292, size: 88, html: 'Lift weights?<br>Extra protein <em>helps</em>' },
  { t0: 29.08, t1: 30.2, top: 300, size: 104, html: '<em>A little.</em>' },
  { t0: 30.32, t1: 35.9, top: 292, size: 88, html: '<em>49</em> trials:<br><em>+300 g</em> lean mass' },
  { t0: 36.17, t1: 38.7, top: 292, size: 88, html: 'Not quite the<br><em>body on the label.</em>' },
  { t0: 38.95, t1: 43.9, top: 292, size: 84, html: 'Past <em>1.6 g</em> per kg:<br>the gains <em>stopped</em>' },
  { t0: 44.34, t1: 48.8, top: 300, size: 96, html: '<em>25 to 30 g</em> a meal' },
  { t0: 49.16, t1: 51.4, top: 300, size: 88, html: 'At least <em>0.8 g</em> per kg' },
  { t0: 51.56, t1: 53.9, top: 300, size: 96, html: 'Training? Up to <em>1.6</em>' },
  { t0: 54.07, t1: 57.9, top: 292, size: 92, html: 'More protein.<br><em>Not more muscle.</em>' },
  { t0: 58.37, t1: 59.9, top: 300, size: 100, html: 'Kidney <em>disease?</em>' },
  { t0: 60.0, t1: 62.4, top: 292, size: 92, html: 'Ask your <em>doctor</em><br>or dietitian' },
  { t0: 62.56, t1: 65.7, top: 292, size: 92, html: 'Not a video.<br><em>Including this one.</em>' },
  { t0: 66.24, t1: 99, top: 360, size: 96, html: 'Back to<br><em>factory settings.</em>' },
];
const OVL = {};
function overlayInit(S) {
  const O = S.O, tag = (cls, txt, size) => { const e = O.tag(cls, txt); e.style.fontSize = size + 'px'; return e; };
  OVL.lv = [tag('tag', '0.8 g per kg<b>58 g</b>', 24), tag('tag', '1.2 g per kg<b>84 g</b>', 24), tag('tag', '1.6 g per kg<b>112 g</b>', 24)];
  for (const e of OVL.lv) e.querySelector('b').style.fontSize = '44px';
  OVL.kg = tag('tag', 'Body weight<b>70 kg</b>', 24); OVL.kg.querySelector('b').style.fontSize = '44px';
  OVL.bowl = BOWLS.map(() => tag('tag', '28 g', 26));
  OVL.dial = [tag('tag', 'Every day<b>at least 0.8 g/kg</b>', 26), tag('tag', 'Each meal<b>25 to 30 g</b>', 26), tag('tag', 'Training<b>up to 1.6 g/kg</b>', 26)];
  for (const e of OVL.dial) e.querySelector('b').style.fontSize = '44px';
  OVL.kid = tag('tag', 'Kidneys', 28);
  OVL.lean = tag('tag', 'Lean mass<b>300 g</b>', 24); OVL.lean.querySelector('b').style.fontSize = '44px';
}
function overlay(S, t) {
  // the column's levels
  const lv = [[T.fiftyeight, 0], [T.two, 1], [T.six, 2]];
  lv.forEach(([t0, i]) => { const y = W.marks[i].y; place(S, OVL.lv[i], new THREE.Vector3(COL.x + 0.03, y, COL.z), 44, -40, ss(t0 - 0.1, t0 + 0.35, t) * (1 - ss(i < 2 ? 24.3 : 24.3, 24.9, t))); });
  place(S, OVL.kg, new THREE.Vector3(0.07, SCALE.h, W.scaleZ + SCALE.d / 2), -90, 34, ss(T.seventy - 0.1, T.seventy + 0.4, t) * (1 - ss(18.5, 19.2, t)));
  BOWLS.forEach((b, i) => place(S, OVL.bowl[i], b.clone().add(new THREE.Vector3(0.0, 0.0, i < 2 ? -0.08 : 0.075)), -34, i < 2 ? -34 : 0, ss(T.thirty - 0.2 + i * 0.08, T.thirty + 0.2 + i * 0.08, t) * (1 - ss(49.3, 49.9, t))));
  W.dials.forEach((d, i) => { const ts = [T.point8, T.tf, T.one8][i]; place(S, OVL.dial[i], d.g.position.clone().add(new THREE.Vector3(0.17, 0.02, 0.05)), 12, -30, ss(ts, ts + 0.4, t) * (1 - ss(T.kidney - 0.6, T.kidney - 0.1, t))); });
  place(S, OVL.kid, W.rig.seg['First lumbar vertebra'].g.getWorldPosition(_b).add(new THREE.Vector3(0.12, 0.0, 0.0)), 40, -20, ss(T.kidney + 0.2, T.kidney + 0.7, t) * (1 - ss(T.final - 0.4, T.final + 0.2, t)));
  place(S, OVL.lean, W.block.position.clone().add(new THREE.Vector3(-0.04, 0.05, 0)), -260, -30, ss(T.three + 0.3, T.three + 0.7, t) * (1 - ss(35.9, 36.4, t)));
  // the end: the logo lands on the first dial's face
  const d = W.dials[0], c = d.g.position.clone().add(new THREE.Vector3(0, 0.0665 + 0.0012, 0));
  logoEnd(S, t, { t0: T.logo, center: c, edge: c.clone().add(new THREE.Vector3(LOGO_R, 0, 0)) });
}

window.HFS_POSE = poseArm;
makeFilm({
  T, caps: CAPS, subs: [], build, update, pose: camPose, overlay, overlayInit, focus: focusAt,
  stage: { bg: 0x07080a, reflSize: 6, env: 0.12, far: 30 },
  aperture: [[0, 0.007], [2.6, 0.005], [5, 0.002], [8.4, 0.0012], [11, 0.005], [19, 0.005], [21, 0.004], [26.5, 0.002], [32, 0.003], [34.4, 0.005], [38.2, 0.005], [40, 0.004], [45.9, 0.002], [50, 0.003], [57, 0.003], [59, 0.002], [65, 0.002], [67, 0.003]],
  bloom: [[0, 0.42], [10, 0.45], [30, 0.5], [34, 0.45], [58, 0.5], [68.1, 0.55]],
  fast: [[26.1, 33.2, 2], [39.5, 43.0, 3], [44.5, 48.4, 2]],
});

// Human Factory Settings · Film 14 "Does intermittent fasting work?" · one continuous shot, 9:16.
// A skeleton sits at a small table and waits. In front of it, a plate that is a clock: the fork and the knife are its
// hands, and an eating window lights on the rim (noon to 8 pm; then 8 am to 4 pm). A beam balance weighs the trials:
// noon to 8 against three meals a day, level; a calorie limit with or without the window, level. A newspaper: the 91%
// scare, stamped conference abstract, not peer reviewed; two days, from memory; a link, not proof. Ninety-nine trials:
// fasting outweighs eating freely, and ties with ordinary dieting. "It works like a diet": the brand on the plate's dial
// reads DIET (the gag). The warnings, plain. The plate, from above, becomes the logo. The factory stamp is on the breastbone.
import { THREE, ss, s5, lerp, clamp01, hash, camTrack, phys, shadows, spot, RoundedBoxGeometry,
  loadAnatomy, V3, place, logoEnd, makeFilm, outBack, stamp, stampCanvas, stampSpot, noiseTex } from '../kit.js';
import { buildRig, skeletonKind, bendSpine, poseArm, legIK, worldVerts } from '../rig.js';
import { makeLogoRing } from '../props.js';

// ------------------------------------------------------------------ timing, from the voice guide (word starts)
const T = {
  end: 76.7,
  fasting: 0.35, trust: 2.26, clock: 3.19, dieting: 3.81,                                              // "Intermittent fasting. Trust the clock to do the dieting."
  trial: 4.91, noon: 7.29, eight: 8.02, noCal: 8.72,
  after: 11.01, twelve: 11.81, noMore: 12.25, three: 13.84, calories: 15.64, noDiff: 16.83,
  year: 18.58, same: 21.34, limit: 22.42, one: 23.21, eight2: 25.07, four: 25.56, noSig: 26.56,
  scare: 29.54, under8: 31.0, t91: 33.14, death: 37.4,
  conf: 38.6, notPeer: 40.14, times: 41.96, twoDays: 43.09, memory: 43.93, link: 45.11, proof: 46.15,
  across: 47.32, t99: 48.14, beat: 50.93, against: 52.96, tie: 55.62,
  works: 56.74, diet: 57.96, because: 58.72, isOne: 59.55,
  pregnant: 60.8, dontFast: 64.83, diabetes: 66.12, medication: 68.75, doctor: 69.93,
  back: 72.53, factory: 73.39, settings: 73.69, logo: 74.4,
};

// ------------------------------------------------------------------ the set (metres, floor at y = 0)
const W = {}; window.HFS_W = W;
const X = new THREE.Vector3(1, 0, 0), Y = new THREE.Vector3(0, 1, 0), Z = new THREE.Vector3(0, 0, 1);
const TABLE = { w: 0.92, d: 0.62, top: 0.74 };                       // the table at the origin; the skeleton sits at -z, facing +z
const SEAT = 0.46, SEAT_Z = -0.52;
const PLATE = new THREE.Vector3(0, TABLE.top, -0.06), PLATE_R = 0.135, LOGO_R = 0.036;
const PAPER = new THREE.Vector3(0.3, TABLE.top, 0.06);
const BAL = { x: 0.95, z: 0.55, top: 0.62 };
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
const black = () => phys({ color: 0x151619, roughness: 0.45, clearcoat: 0.4 });

// ------------------------------------------------------------------ the table, the stool
function makeTable(scene) {
  const g = new THREE.Group(); scene.add(g);
  const wood = phys({ color: 0x1a120d, roughness: 0.42, clearcoat: 0.5, clearcoatRoughness: 0.3, roughnessMap: noiseTex(7, 256, 0.8, 1.0, 12) });
  const top = new THREE.Mesh(new RoundedBoxGeometry(TABLE.w, 0.03, TABLE.d, 4, 0.008), wood); top.position.y = TABLE.top - 0.015; g.add(top);
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.014, TABLE.top - 0.03, 20), wood); leg.position.set(x * (TABLE.w / 2 - 0.06), (TABLE.top - 0.03) / 2, z * (TABLE.d / 2 - 0.06)); g.add(leg); }
  const stool = new THREE.Group(); stool.position.set(0, 0, SEAT_Z); g.add(stool);
  const st = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.035, 96), black()); st.position.y = SEAT - 0.0175; stool.add(st);
  for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2 + 0.5, leg = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.011, SEAT - 0.03, 20), black());
    leg.position.set(Math.cos(a) * 0.12, (SEAT - 0.03) / 2, Math.sin(a) * 0.12); leg.rotation.set(Math.sin(a) * 0.08, 0, -Math.cos(a) * 0.08); stool.add(leg); }
  shadows(g); g.traverse((o) => o.layers.enable(1)); return g;
}

// ------------------------------------------------------------------ the plate that is a clock: a white plate, a printed dial, the fork and the knife as its hands
function cutlery(kind) {   // flat, pointing along +y from the pivot (the handle's end at the centre), in the plate's own plane
  const g = new THREE.Group(), steel = new THREE.MeshPhysicalMaterial({ color: 0xb9bec7, metalness: 0.7, roughness: 0.26, clearcoat: 0.4 });
  const sh = new THREE.Shape();
  if (kind === 'knife') {   // handle, a slim neck, the blade with a rounded tip
    sh.moveTo(-0.0055, -0.012); sh.lineTo(0.0055, -0.012); sh.lineTo(0.0058, 0.05); sh.lineTo(0.0036, 0.056); sh.lineTo(0.0075, 0.062); sh.quadraticCurveTo(0.0085, 0.098, 0.0016, 0.112); sh.lineTo(-0.0055, 0.112); sh.lineTo(-0.0055, 0.062); sh.lineTo(-0.0036, 0.056); sh.lineTo(-0.0058, 0.05); sh.closePath();
  } else {                  // handle, neck, a head with four tines
    sh.moveTo(-0.0055, -0.01); sh.lineTo(0.0055, -0.01); sh.lineTo(0.0052, 0.036); sh.lineTo(0.0028, 0.044); sh.lineTo(0.0078, 0.054); sh.lineTo(0.0078, 0.08);
    const tine = (x0) => { sh.lineTo(x0 + 0.0026, 0.08); sh.lineTo(x0 + 0.0026, 0.058); }; tine(0.0052 - 0.0026); sh.lineTo(0.0026, 0.058); sh.lineTo(0.0026, 0.08); sh.lineTo(0.0008, 0.08); sh.lineTo(0.0008, 0.058); sh.lineTo(-0.0008, 0.058); sh.lineTo(-0.0008, 0.08); sh.lineTo(-0.0026, 0.08); sh.lineTo(-0.0026, 0.058); sh.lineTo(-0.0052, 0.058); sh.lineTo(-0.0052, 0.08); sh.lineTo(-0.0078, 0.08); sh.lineTo(-0.0078, 0.054); sh.lineTo(-0.0028, 0.044); sh.lineTo(-0.0052, 0.036); sh.closePath();
  }
  const geo = new THREE.ExtrudeGeometry(sh, { depth: 0.0018, bevelEnabled: true, bevelThickness: 0.0006, bevelSize: 0.0005, bevelSegments: 2, curveSegments: 16 });
  const m = new THREE.Mesh(geo, steel); m.castShadow = true; g.add(m);
  const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.004, 24), steel); pin.rotation.x = Math.PI / 2; g.add(pin);
  return g;
}
function dialTex(windowArc) {   // the plate's printed face: hour marks round the rim, numbers, the brand under twelve (DIET); the window drawn separately
  return canvasTex(1024, 1024, (x, w) => {
    const c = w / 2; x.fillStyle = '#d9d5cc'; x.fillRect(0, 0, w, w);
    const gr = x.createRadialGradient(c, c, c * 0.62, c, c, c); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(120,115,105,0.18)'); x.fillStyle = gr; x.fillRect(0, 0, w, w);
    for (let i = 0; i < 60; i++) { const a = (i / 60) * Math.PI * 2, big = i % 5 === 0, r0 = c * (big ? 0.8 : 0.84), r1 = c * 0.9;
      x.strokeStyle = '#2a2b2f'; x.lineWidth = big ? 9 : 3; x.beginPath(); x.moveTo(c + Math.sin(a) * r0, c - Math.cos(a) * r0); x.lineTo(c + Math.sin(a) * r1, c - Math.cos(a) * r1); x.stroke(); }
    for (let h = 1; h <= 12; h++) { const a = (h / 12) * Math.PI * 2; txt(x, String(h), c + Math.sin(a) * c * 0.68, c - Math.cos(a) * c * 0.68 + 6, { font: '700 64px Archivo', color: '#2a2b2f' }); }
    txt(x, 'DIET', c, c * 0.62, { font: '600 34px "Geist Mono"', color: '#55575d', track: 14 });
    void windowArc;
  });
}
function makePlate(scene) {
  const g = new THREE.Group(); g.position.copy(PLATE); scene.add(g);
  const prof = [[0, 0.0005], [0.07, 0.0005], [0.074, 0.004], [0.088, 0.006], [0.112, 0.012], [0.133, 0.017], [0.135, 0.0155], [0.115, 0.009], [0.09, 0.0065], [0.0, 0.0065]].map(([r, y]) => new THREE.Vector2(r, y));
  const china = new THREE.MeshPhysicalMaterial({ color: 0xd6d2ca, roughness: 0.3, clearcoat: 0.6, clearcoatRoughness: 0.2 });
  const body = new THREE.Mesh(new THREE.LatheGeometry(prof, 128), china); g.add(body);
  // the printed face, on the plate's flat well and its rim
  const face = new THREE.Mesh(new THREE.RingGeometry(0.0001, 0.128, 128, 32), new THREE.MeshPhysicalMaterial({ map: dialTex(), roughness: 0.32, clearcoat: 0.6, clearcoatRoughness: 0.2, transparent: true }));
  face.rotation.x = -Math.PI / 2; face.position.y = 0.0068; g.add(face);
  // bend the face's outer ring up to follow the rim
  { const P = face.geometry.attributes.position; for (let i = 0; i < P.count; i++) P.setZ(i, rimLift(Math.hypot(P.getX(i), P.getY(i)))); face.geometry.computeVertexNormals(); }
  // the eating window: a cold band on the rim, drawn as far as it reaches
  const win = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial({ color: new THREE.Color(0x7fb2e6).multiplyScalar(1.15), transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }));
  win.rotation.x = -Math.PI / 2; win.position.y = 0.0068 + 0.0005; win.renderOrder = 3; g.add(win); face.renderOrder = 1;
  // the hands: knife (minutes, long) and fork (hours, short)
  const hands = new THREE.Group(); hands.position.y = 0.0082; g.add(hands);
  const knife = cutlery('knife'), fork = cutlery('fork'); knife.rotation.x = -Math.PI / 2; fork.rotation.x = -Math.PI / 2;
  const kp = new THREE.Group(), fp = new THREE.Group(); kp.add(knife); fp.add(fork); fp.position.y = 0.0024; hands.add(kp, fp);
  const logo = makeLogoRing(LOGO_R); logo.g.rotation.x = -Math.PI / 2; logo.g.position.y = 0.0075; g.add(logo.g);
  shadows(g); g.traverse((o) => o.layers.enable(1)); face.castShadow = false; win.castShadow = false;
  return { g, face, win, kp, fp, knife, fork, logo, key: '' };
}
function rimLift(r) { return r < 0.09 ? 0 : (0.012 - 0.0065) * ((r - 0.09) / 0.04) + 0.0002; }   // the printed face follows the plate up its rim
function setWindow(P, h0, h1, k) {   // the band from h0 o'clock to h1 o'clock (clockwise), drawn as far as k
  const key = `${h0}|${h1}|${k.toFixed(3)}`; if (key === P.key) return; P.key = key;
  const a0 = (h0 / 12) * Math.PI * 2, span = (((h1 - h0 + 12) % 12) / 12) * Math.PI * 2 * k;
  const geo = new THREE.RingGeometry(0.1045, 0.1165, 96, 2, Math.PI / 2 - a0 - span, Math.max(0.0001, span)), Q = geo.attributes.position;
  for (let i = 0; i < Q.count; i++) Q.setZ(i, rimLift(Math.hypot(Q.getX(i), Q.getY(i))));
  P.win.geometry.dispose(); P.win.geometry = geo;
}

// ------------------------------------------------------------------ the beam balance (as in film 11), with tokens on the pans
function makeBalance(scene) {
  const g = new THREE.Group(); g.position.set(BAL.x, 0, BAL.z); g.rotation.y = -0.5; scene.add(g);
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
    const hook = new THREE.Group(); hang.add(hook);
    for (let k = 0; k < 3; k++) { const a = (k / 3) * Math.PI * 2, wire = new THREE.Mesh(new THREE.CylinderGeometry(0.0012, 0.0012, 0.19, 6), dark); wire.position.set(Math.cos(a) * 0.036, -0.095, Math.sin(a) * 0.036); wire.rotation.set(Math.sin(a) * 0.19, 0, -Math.cos(a) * 0.19); hook.add(wire); }
    const pan = new THREE.Mesh(new THREE.CylinderGeometry(0.078, 0.074, 0.008, 64), brass); pan.position.y = -0.19; hook.add(pan);
    // a token on each pan: a disc with a printed top, redrawn for each comparison
    const c = document.createElement('canvas'); c.width = c.height = 256; const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
    const tok = new THREE.Mesh(new THREE.CylinderGeometry(0.066, 0.066, 0.016, 64), [phys({ color: 0xe9e6df, roughness: 0.4 }), new THREE.MeshPhysicalMaterial({ map: tex, roughness: 0.35, clearcoat: 0.5 }), phys({ color: 0xe9e6df, roughness: 0.4 })]);
    tok.position.y = -0.19 + 0.004 + 0.008; hook.add(tok);
    pans.push({ hang, hook, pan, s, tok, c, tex, key: '' });
  }
  const c = document.createElement('canvas'); c.width = 1024; c.height = 160; const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(0.44, 0.07), new THREE.MeshBasicMaterial({ map: tex, transparent: true })); plate.position.set(0, BAL.top - 0.07, 0.1505); g.add(plate);
  shadows(g); g.traverse((o) => o.layers.enable(1));
  return { g, pivot, pans, c, tex, key: '' };
}
function drawLabels(B, L, R) {
  const key = L + '|' + R; if (key === B.key) return; B.key = key;
  const x = B.c.getContext('2d'), w = B.c.width, h = B.c.height; x.fillStyle = '#0d0e10'; x.fillRect(0, 0, w, h);
  txt(x, L, w * 0.25, h / 2, { font: '600 38px "Geist Mono"', color: '#d5d8dd', track: 6, maxW: w * 0.44 }); txt(x, R, w * 0.75, h / 2, { font: '600 38px "Geist Mono"', color: '#d5d8dd', track: 6, maxW: w * 0.44 });
  x.fillStyle = 'rgba(213,216,221,0.25)'; x.fillRect(w / 2 - 1, 30, 2, h - 60); B.tex.needsUpdate = true;
}
function drawToken(P, kind) {   // clock: a little clock with a window; meals: three plates; kcal: a calorie card; free: an open plate, no clock
  if (P.key === kind) return; P.key = kind;
  const x = P.c.getContext('2d'), w = P.c.width, c = w / 2; x.fillStyle = '#ece9e2'; x.fillRect(0, 0, w, w); x.strokeStyle = '#2a2b2f'; x.fillStyle = '#2a2b2f';
  if (kind.startsWith('clock')) { x.lineWidth = 8; x.beginPath(); x.arc(c, c, w * 0.36, 0, Math.PI * 2); x.stroke();
    x.strokeStyle = '#4f86c6'; x.lineWidth = 18; x.beginPath(); x.arc(c, c, w * 0.3, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 4) / 3); x.stroke();
    x.strokeStyle = '#2a2b2f'; x.lineWidth = 8; x.beginPath(); x.moveTo(c, c); x.lineTo(c, c - w * 0.22); x.moveTo(c, c); x.lineTo(c + w * 0.14, c); x.stroke(); }
  if (kind === 'meals') for (let k = 0; k < 3; k++) { const a = -Math.PI / 2 + (k / 3) * Math.PI * 2; x.lineWidth = 6; x.beginPath(); x.arc(c + Math.cos(a) * w * 0.2, c + Math.sin(a) * w * 0.2, w * 0.14, 0, Math.PI * 2); x.stroke(); }
  if (kind === 'kcal' || kind === 'clock+kcal') { txt(x, 'KCAL', c, kind === 'kcal' ? c : w * 0.86, { font: `800 ${kind === 'kcal' ? 64 : 34}px Archivo`, color: '#2a2b2f', track: 4 }); }
  if (kind === 'free') { x.lineWidth = 6; x.beginPath(); x.arc(c, c, w * 0.32, 0, Math.PI * 2); x.stroke(); txt(x, 'ANY TIME', c, c, { font: '800 36px Archivo', color: '#2a2b2f', track: 3 }); }
  if (kind === 'diet') { txt(x, 'DIETING', c, c, { font: '800 44px Archivo', color: '#2a2b2f', track: 3 }); }
  P.tex.needsUpdate = true;
}

// ------------------------------------------------------------------ the newspaper: the scare, then the stamps
function stampTex(word, { w = 900, h = 190, color = '#c2312b', size = 92 } = {}) {
  return canvasTex(w, h, (x) => { x.clearRect(0, 0, w, h); x.strokeStyle = color; x.lineWidth = 10; x.beginPath(); x.roundRect(10, 10, w - 20, h - 20, 18); x.stroke();
    txt(x, word, w / 2, h / 2 + 4, { font: `900 ${size}px Archivo`, color, track: 5, maxW: w * 0.88 });
    x.globalCompositeOperation = 'destination-out'; for (let i = 0; i < 1100; i++) { x.fillStyle = `rgba(0,0,0,${0.15 + 0.5 * hash(i * 7.3)})`; x.fillRect(hash(i) * w, hash(i * 3.1) * h, 1 + 3 * hash(i * 1.7), 1 + 2 * hash(i * 2.3)); } });
}
function makePaper(scene) {
  const g = new THREE.Group(); g.position.copy(PAPER); g.rotation.y = -0.28; scene.add(g);
  const tex = canvasTex(1024, 1400, (x, w, h) => { x.fillStyle = '#d3cec2'; x.fillRect(0, 0, w, h);
    x.fillStyle = '#1d1e22'; x.fillRect(60, 60, w - 120, 6); x.fillRect(60, 150, w - 120, 3);
    txt(x, 'HEALTH', 60, 112, { font: '700 40px "Geist Mono"', color: '#1d1e22', align: 'left', track: 12 });
    const lines = ['EATING IN UNDER', '8 HOURS A DAY', 'LINKED TO 91%', 'HIGHER RISK OF', 'CARDIOVASCULAR', 'DEATH'];
    lines.forEach((s, i) => txt(x, s, 60, 250 + i * 104, { font: '900 96px Archivo', color: '#141518', align: 'left', track: 0, maxW: w - 120 }));
    for (let r = 0; r < 14; r++) { x.fillStyle = 'rgba(30,31,35,0.28)'; x.fillRect(60, 920 + r * 30, (w - 120) * (0.7 + 0.3 * hash(r)), 12); } });
  const sheet = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.3, 8, 8), new THREE.MeshPhysicalMaterial({ map: tex, roughness: 0.9, sheen: 0.3 }));
  { const P = sheet.geometry.attributes.position; for (let i = 0; i < P.count; i++) P.setZ(i, 0.0025 * Math.sin((P.getX(i) / 0.22) * Math.PI * 2) * (P.getY(i) / 0.3 + 0.5)); sheet.geometry.computeVertexNormals(); }
  sheet.rotation.x = -Math.PI / 2; sheet.position.y = 0.003; g.add(sheet);
  const mk = (word, size, w, h, x, z, rot) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: stampTex(word, { size }), transparent: true, opacity: 0, depthWrite: false })); m.rotation.set(-Math.PI / 2, 0, rot); m.position.set(x, 0.0062, z); g.add(m); return m; };
  const s1 = mk('CONFERENCE ABSTRACT', 84, 0.19, 0.038, -0.004, 0.055, 0.05), s2 = mk('NOT PEER REVIEWED', 88, 0.18, 0.036, 0.006, 0.093, -0.04);
  const note = new THREE.Mesh(new THREE.PlaneGeometry(0.09, 0.09), new THREE.MeshPhysicalMaterial({ map: canvasTex(512, 512, (x, w) => { x.fillStyle = '#f4e27a'; x.fillRect(0, 0, w, w);
    txt(x, 'EATING TIMES:', w / 2, 140, { font: '800 50px Archivo', color: '#1d1e22', track: 2 }); txt(x, '2 DAYS,', w / 2, 260, { font: '900 86px Archivo', color: '#1d1e22' }); txt(x, 'FROM MEMORY', w / 2, 370, { font: '800 56px Archivo', color: '#1d1e22', track: 2 }); }), roughness: 0.85, transparent: true, opacity: 0 }));
  note.rotation.set(-Math.PI / 2, 0, 0.3); note.position.set(-0.17, 0.0015, 0.02); g.add(note);
  const s3 = mk('A LINK, NOT PROOF', 92, 0.19, 0.038, -0.002, 0.13, 0.03);
  shadows(g); g.traverse((o) => o.layers.enable(1));
  return { g, s1, s2, note, s3 };
}

// ------------------------------------------------------------------ build
let ARM_ON_TABLE = null;
async function build(S, cfg) {
  const scene = S.scene;
  S.fog.near = 4; S.fog.far = 14;
  S.table.scale.set(3, 3, 1); S.tableMat.clearcoat = 0.1; S.tableMat.specularIntensity = 0.3;
  for (const m of [S.tableMat.map, S.tableMat.roughnessMap]) if (m) { m.wrapS = m.wrapT = THREE.RepeatWrapping; m.repeat.multiplyScalar(3); }
  const meshes = await loadAnatomy(skeletonKind());
  const R = W.rig = buildRig(meshes);
  W.body = new THREE.Group(); scene.add(W.body); R.root.position.copy(R.P0).negate(); W.body.add(R.root);
  for (const m of meshes) { m.castShadow = true; m.receiveShadow = true; m.layers.enable(1); }
  W.meshes = meshes;
  { const st = R.byName.get('Body of sternum'); st.material = st.material.clone();
    W.stampSpot = stampSpot(st, { from: [0, 0.006, 0.12], dir: [0, 0, -1], spread: 0.004 });
    if (W.stampSpot) W.stamp = stamp(st, { canvas: stampCanvas(['HUMAN FACTORY', 'SETTINGS'], '', { frame: false }), center: W.stampSpot.center, normal: W.stampSpot.normal, up: [0, 1, 0], width: 0.04, depth: 0.03, opacity: 0.6 }); }
  // seated on the stool, as in film 9
  const hipB = new THREE.Box3(); for (const m of meshes) if (/hip bone/i.test(m.userData.name)) for (const v of worldVerts(m, 3)) hipB.expandByPoint(v);
  W.sitP = new THREE.Vector3(0, SEAT - 0.012 + (R.P0.y - hipB.min.y), SEAT_Z + 0.02);
  // ---- the set
  makeTable(scene); W.plate = makePlate(scene); W.bal = makeBalance(scene); W.paper = makePaper(scene);
  // the forearms resting on the table, the hands either side of the plate
  poseBody(0); ARM_ON_TABLE = solveArms();
  // ---- light
  W.key = spot(scene, { color: 0xffe9d2, pos: new THREE.Vector3(-1.2, 2.6, 1.4), target: new THREE.Vector3(0, 0.8, -0.1), angle: 0.45, penumbra: 0.8, shadow: true, size: cfg.shadow ?? 1024 }); W.key.shadow.camera.far = 7;
  W.rim = spot(scene, { color: 0xa9c4ff, pos: new THREE.Vector3(1.2, 2.2, -1.9), target: new THREE.Vector3(0, 1.0, -0.4), angle: 0.5, penumbra: 0.9 });
  W.fill = spot(scene, { color: 0xc8d6ff, pos: new THREE.Vector3(1.6, 1.3, 1.6), target: new THREE.Vector3(0, 0.9, -0.2), angle: 0.6, penumbra: 1 });
  W.plateLight = spot(scene, { color: 0xfff1d8, pos: new THREE.Vector3(0.25, 2.1, 0.35), target: PLATE.clone(), angle: 0.16, penumbra: 0.6 });
  W.paperLight = spot(scene, { color: 0xfff1d8, pos: new THREE.Vector3(0.6, 2.0, 0.6), target: PAPER.clone(), angle: 0.2, penumbra: 0.6 });
  W.balLight = spot(scene, { color: 0xfff1d8, pos: new THREE.Vector3(0.3, 2.3, 1.8), target: new THREE.Vector3(BAL.x, BAL.top + 0.25, BAL.z), angle: 0.3, penumbra: 0.7 });
  return { stamp: W.stampSpot, sitP: W.sitP.toArray(), arms: ARM_ON_TABLE && [ARM_ON_TABLE.Right.err, ARM_ON_TABLE.Left.err] };
}

// ------------------------------------------------------------------ the body: seated, forearms on the table, looking at the plate
function solveArms() {
  const R = W.rig, out = {};
  for (const Side of ['Right', 'Left']) {
    const A = R.arms[Side], hand = new THREE.Vector3(A.s * 0.2, TABLE.top + 0.022, PLATE.z - 0.02), e = new THREE.Vector3(), h = new THREE.Vector3();
    const elbowT = new THREE.Vector3(A.s * 0.24, TABLE.top + 0.04, -0.27);
    const err = (p) => { poseArm(A, p); A.girdle.updateMatrixWorld(true); A.mc.getWorldPosition(h); A.elbow.getWorldPosition(e); return h.distanceTo(hand) + 0.5 * e.distanceTo(elbowT) + 3 * Math.max(0, TABLE.top + 0.02 - e.y) + 3 * Math.max(0, TABLE.top + 0.012 - h.y); };
    let best = { dir: [0.15, -0.75, 0.6], twist: 0.6, elbow: 1.3, retract: 0, elevate: 0 }, bestE = err(best);
    for (const st of [0.25, 0.12, 0.06, 0.03, 0.015, 0.007, 0.003]) for (let it = 0; it < 40; it++) {
      let improved = false;
      for (const key of ['d0', 'd1', 'd2', 'twist', 'elbow']) for (const sg of [-1, 1]) {
        const c = { ...best, dir: [...best.dir] }; if (key[0] === 'd') c.dir[+key[1]] += sg * st; else c[key] += sg * st * 2;
        c.elbow = Math.min(2.6, Math.max(0, c.elbow)); const E = err(c); if (E < bestE) { bestE = E; best = c; improved = true; } }
      if (!improved) break; }
    out[Side] = { ...best, err: bestE };
  }
  return out;
}
const _qa = new THREE.Quaternion();
function poseBody(t) {
  const R = W.rig, br = 0.5 - 0.5 * Math.cos((t / 4.4) * Math.PI * 2);
  const look = 0.32 - 0.12 * pulse(t, 29.0, 47.0, 0.8);   // eyes on the plate; on the paper, a little less bent
  bendSpine(R.seg, { lum: 0.08, tho: 0.16 + 0.01 * br, cer: look, twist: 0.12 * pulse(t, 29.0, 47.0, 0.8) });
  if (ARM_ON_TABLE) { poseArm(R.arms.Right, ARM_ON_TABLE.Right); poseArm(R.arms.Left, ARM_ON_TABLE.Left); }
  else { const a = { dir: [0.15, -0.75, 0.6], twist: 0.6, elbow: 1.3 }; poseArm(R.arms.Right, a); poseArm(R.arms.Left, a); }
  W.body.quaternion.identity(); W.body.position.copy(W.sitP); W.body.updateMatrixWorld(true);
  for (const Side of ['Right', 'Left']) {
    const G = R.legs[Side]; _qa.setFromAxisAngle(X, -Math.PI / 2); G.hip.quaternion.copy(_qa);
    const tgt = new THREE.Vector3(W.sitP.x + G.s * 0.13, G.A.y - G.ground + 0.002, W.sitP.z + 0.44);
    legIK(R, Side, tgt, new THREE.Quaternion(), Z);
  }
  W.body.updateMatrixWorld(true);
}

// ------------------------------------------------------------------ the clock: the time it shows (hours, 0 to 12), by moment
function clockAt(t) {
  // waiting before noon (11:54 to noon), then fast forward through the windows, then stopped for the warnings
  const k1 = s5(T.trial, T.noon, t), k2 = s5(T.eight - 0.3, T.noCal + 0.4, t);
  let h = 11.9 + (t / 4.3) * 0.1 * (1 - k1);   // the knife creeps toward twelve
  h = lerp(h, 12, k1); h = lerp(h, 20, k2);
  const k3 = s5(T.one - 0.2, T.eight2, t), k4 = s5(T.four - 0.2, T.noSig, t); h = lerp(h, 24 + 8, k3); h = lerp(h, 24 + 16, k4);
  const k5 = s5(T.works - 0.4, T.works + 0.6, t); h = lerp(h, 48 + 10 + 10 / 60, k5);   // ten past ten for the punchline, as in a watch advert: the brand shows
  return h;
}
function windowAt(t) {   // which window, and how far it is drawn
  if (t < T.year) return { h0: 12, h1: 8, k: s5(T.noon - 0.1, T.eight + 0.3, t) * (1 - s5(T.year - 0.6, T.year, t)) };
  return { h0: 8, h1: 4, k: s5(T.eight2 - 0.2, T.four + 0.3, t) * (1 - s5(T.scare - 0.6, T.scare, t)) };
}

// ------------------------------------------------------------------ the camera: one path, no cuts
let CAM = null;
function buildCam() {
  const P = PLATE, B = BAL, Pa = PAPER, Sk = W.sitP;
  const balC = new THREE.Vector3(B.x, B.top + 0.24, B.z), balD = new THREE.Vector3(Math.sin(-0.5), 0, Math.cos(-0.5));   // the balance faces this way
  const bp = (d, h) => V3(balC.x + balD.x * d, h, balC.z + balD.z * d);
  return camTrack([
    { t: -3.0, p: V3(P.x + 0.02, P.y + 0.6, P.z + 0.42), l: V3(P.x, P.y, P.z - 0.02), fov: 38 },
    { t: 0.0, p: V3(P.x + 0.02, P.y + 0.58, P.z + 0.41), l: V3(P.x, P.y, P.z - 0.02), fov: 38, tens: 0.5 },          // the plate that is a clock
    { t: 4.0, p: V3(P.x + 0.03, P.y + 0.55, P.z + 0.4), l: V3(P.x, P.y, P.z - 0.03), fov: 38, tens: 0.4 },
    { t: 6.5, p: V3(P.x + 0.5, P.y + 0.78, P.z + 1.0), l: V3(P.x, P.y + 0.16, P.z - 0.2), fov: 34, stop: true },        // the skeleton waits
    { t: 10.2, p: V3(P.x + 0.48, P.y + 0.76, P.z + 0.97), l: V3(P.x, P.y + 0.16, P.z - 0.2), fov: 34, stop: true },
    { t: 11.6, p: bp(1.65, 1.15), l: V3(balC.x, balC.y, balC.z), fov: 32, stop: true },                                // the balance
    { t: 28.4, p: bp(1.6, 1.14), l: V3(balC.x, balC.y, balC.z), fov: 32, stop: true },
    { t: 29.45, p: V3(Pa.x + 0.32, Pa.y + 0.95, Pa.z + 0.62), l: V3(Pa.x + 0.02, Pa.y, Pa.z), fov: 38 },
    { t: 30.2, p: V3(Pa.x + 0.01, Pa.y + 0.72, Pa.z + 0.3), l: V3(Pa.x, Pa.y, Pa.z - 0.01), fov: 38, stop: true },     // the newspaper
    { t: 46.6, p: V3(Pa.x + 0.01, Pa.y + 0.7, Pa.z + 0.29), l: V3(Pa.x, Pa.y, Pa.z - 0.01), fov: 38, stop: true },
    { t: 48.1, p: bp(1.62, 1.15), l: V3(balC.x, balC.y, balC.z), fov: 32, stop: true },                                  // the balance again
    { t: 56.0, p: bp(1.58, 1.13), l: V3(balC.x, balC.y, balC.z), fov: 32, stop: true },
    { t: 57.4, p: V3(P.x + 0.04, P.y + 0.36, P.z + 0.14), l: V3(P.x, P.y, P.z - 0.01), fov: 30, tens: 0.3 },         // the plate
    { t: 59.0, p: V3(P.x + 0.005, P.y + 0.24, P.z + 0.07), l: V3(P.x, P.y, P.z - 0.035), fov: 30, stop: true },       // its brand: DIET
    { t: 60.1, p: V3(P.x + 0.004, P.y + 0.235, P.z + 0.068), l: V3(P.x, P.y, P.z - 0.035), fov: 30, stop: true },
    { t: 61.7, p: V3(Sk.x + 1.05, 1.3, Sk.z + 1.55), l: V3(Sk.x, 0.86, Sk.z + 0.2), fov: 30, stop: true },           // the warnings: the table, the skeleton
    { t: 71.8, p: V3(Sk.x + 1.0, 1.28, Sk.z + 1.5), l: V3(Sk.x, 0.86, Sk.z + 0.2), fov: 30, stop: true },
    { t: 73.3, p: V3(P.x + 0.08, P.y + 0.4, P.z + 0.22), l: V3(P.x, P.y, P.z), fov: 30 },
    { t: T.logo, p: V3(P.x, P.y + 0.3, P.z + 0.004), l: V3(P.x, P.y + 0.0075, P.z), fov: 30, stop: true },            // straight down on the plate: the logo
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
function update(S, t) {
  const scene = S.scene, endDark = ss(T.factory - 0.5, T.logo - 0.3, t);
  poseBody(t);
  // ---- the plate-clock: the hands (knife = minutes, fork = hours), the window
  { const P = W.plate, h = clockAt(t), logoK = s5(T.back + 0.2, T.logo - 0.4, t);
    const mins = h < 12 ? h % 1 : (10 / 60) * s5(T.works - 0.4, T.works + 0.6, t);   // the knife shows minutes while it creeps to noon, and at ten past ten; on the hour in between
    P.kp.rotation.y = -(mins * Math.PI * 2); P.fp.rotation.y = -(((h % 12) / 12) * Math.PI * 2);
    const hk = 1 - logoK; P.knife.visible = P.fork.visible = hk > 0.02; P.kp.scale.setScalar(Math.max(0.001, hk)); P.fp.scale.setScalar(Math.max(0.001, hk));
    const w = windowAt(t); setWindow(P, w.h0, w.h1, Math.max(0.001, w.k)); P.win.material.opacity = 0.85 * (w.k > 0.002 ? 1 : 0);
    P.face.material.opacity = 1 - 0.85 * logoK;
    P.logo.set({ weight: logoK, white: logoK, hours: 0, hand: ss(T.logo - 0.4, T.logo - 0.15, t), handScale: outBack(clamp01((t - (T.logo - 0.4)) / 0.35), 1.8) }); }
  // ---- the balance: what it weighs, by moment
  { const B = W.bal; let L = 'NOON TO 8 PM', R2 = '3 MEALS A DAY', kL = 'clock', kR = 'meals', tilt = 0;
    if (t > 18.0) { L = '8 AM TO 4 PM + CALORIE LIMIT'; R2 = 'CALORIE LIMIT ALONE'; kL = 'clock+kcal'; kR = 'kcal'; }
    if (t > 47.0) { L = 'FASTING, ANY STYLE'; R2 = 'EATING FREELY'; kL = 'clock'; kR = 'free'; tilt = 0.2 * s5(T.beat - 0.3, T.beat + 0.5, t) * (1 - s5(T.against - 0.4, T.against + 0.4, t)); }
    if (t > T.against - 0.2) { L = 'FASTING, ANY STYLE'; R2 = 'ORDINARY DIETING'; kL = 'clock'; kR = 'diet'; }
    drawLabels(B, L, R2); drawToken(B.pans[0], kL); drawToken(B.pans[1], kR);
    const wob = 0.012 * Math.sin(t * 5.1) * Math.exp(-((t - 13.0) ** 2) / 1.5) + 0.01 * Math.sin(t * 4.7) * Math.exp(-((t - 21.5) ** 2) / 1.5) + 0.01 * Math.sin(t * 4.9) * Math.exp(-((t - 54.0) ** 2) / 1.2);
    const tl = tilt + wob; B.pivot.rotation.z = tl; for (const P of B.pans) P.hook.rotation.z = -tl; }
  // ---- the newspaper: the stamps, the note
  { const Pa = W.paper, st = (m, at) => { const k = s5(at, at + 0.08, t); m.material.opacity = k; m.scale.setScalar(1 + 0.3 * (1 - k)); };
    st(Pa.s1, T.conf + 0.05); st(Pa.s2, T.notPeer + 0.1); st(Pa.s3, T.link + 0.1);
    const nk = s5(T.times - 0.1, T.times + 0.4, t); Pa.note.material.opacity = nk; Pa.note.position.y = 0.0075 + 0.03 * (1 - nk); }
  // ---- light
  const fig = 1 - endDark;
  W.key.intensity = 9 * fig; W.rim.intensity = 4 * fig; W.fill.intensity = 1.0 * fig;
  W.plateLight.intensity = 2.2 * fig; W.paperLight.intensity = 2.0 * fig * ss(28.6, 29.8, t) * (1 - ss(46.6, 47.8, t)); W.balLight.intensity = 10 * fig;
  S.tableMat.color.setScalar(0.32 * (1 - endDark * 0.9)); scene.environmentIntensity = 0.12 * (1 - endDark); S.reflAmt = 0.5 * (1 - endDark);
}

// ------------------------------------------------------------------ the words on screen
const CAPS = [
  { t0: 0.35, t1: 2.0, top: 300, size: 96, html: 'Intermittent <em>fasting.</em>' },
  { t0: 2.26, t1: 4.6, top: 292, size: 82, html: 'Trust the clock<br>to do the <em>dieting</em>' },
  { t0: 4.91, t1: 10.5, top: 292, size: 74, html: 'In one trial, people ate<br>only from <em>noon to eight,</em><br>with no calorie target' },
  { t0: 11.01, t1: 15.4, top: 292, size: 74, html: 'After 12 weeks: <em>no more</em><br><em>effective</em> than three<br>meals a day' },
  { t0: 15.64, t1: 18.1, top: 300, size: 84, html: 'Calories eaten:<br><em>no different</em>' },
  { t0: 18.58, t1: 23.0, top: 292, size: 74, html: 'In a year-long trial, both<br>groups had the <em>same</em><br><em>calorie limit</em>' },
  { t0: 23.21, t1: 26.35, top: 292, size: 78, html: 'One also ate only<br>from <em>eight to four</em>' },
  { t0: 26.56, t1: 29.0, top: 292, size: 78, html: 'No significant<br>difference in <em>weight</em>' },
  { t0: 29.54, t1: 38.1, top: 292, size: 66, html: 'The scare: eating in under<br>8 hours a day, linked to a<br><em>91% higher risk</em> of<br>cardiovascular death' },
  { t0: 38.6, t1: 41.75, top: 292, size: 78, html: 'A conference abstract,<br><em>not peer reviewed</em>' },
  { t0: 41.96, t1: 44.9, top: 292, size: 78, html: 'Eating times: <em>two days,</em><br>from memory' },
  { t0: 45.11, t1: 46.9, top: 300, size: 90, html: 'A link, <em>not proof.</em>' },
  { t0: 47.32, t1: 52.75, top: 292, size: 72, html: 'Across <em>99 trials,</em> every<br>style of fasting beat<br>eating freely' },
  { t0: 52.96, t1: 56.3, top: 292, size: 78, html: 'Against ordinary dieting,<br>mostly <em>a tie</em>' },
  { t0: 56.74, t1: 58.5, top: 300, size: 90, html: 'It works like a diet.' },
  { t0: 58.72, t1: 60.4, top: 300, size: 90, html: '<em>Because it is one.</em>' },
  { t0: 60.8, t1: 65.9, top: 292, size: 70, html: 'Pregnant, breastfeeding,<br>or a history of eating<br>disorders? <em>Don&rsquo;t fast.</em>' },
  { t0: 66.12, t1: 71.8, top: 292, size: 72, html: 'Diabetes?<br>Don&rsquo;t skip meals.<br>On medication? <em>Tell</em><br><em>your doctor first.</em>' },
  { t0: 72.53, t1: 99, top: 360, size: 96, html: 'Back to<br><em>factory settings.</em>' },
];
const OVL = {};
function overlayInit(S) {
  const O = S.O, tag = (cls, txt2, size, bsize) => { const e = O.tag(cls, txt2); e.style.fontSize = size + 'px'; const b = e.querySelector('b'); if (b && bsize) b.style.fontSize = bsize + 'px'; return e; };
  OVL.t1 = tag('tag', '12 weeks, 116 adults<b>difference 0.26 kg, not significant</b>', 22, 32);
  OVL.t2 = tag('tag', '12 months, 139 adults<b>difference 1.8 kg, not significant</b>', 22, 32);
  OVL.t3 = tag('tag', '99 trials<b>6,582 adults</b>', 22, 38);
}
function overlay(S, t) {
  const top = new THREE.Vector3(BAL.x, BAL.top + 0.06, BAL.z);
  place(S, OVL.t1, top, -200, -150, pulse(t, T.noMore + 0.4, 17.9));
  place(S, OVL.t2, top, -200, -150, pulse(t, T.noSig, 28.9));
  place(S, OVL.t3, top, -110, -150, pulse(t, T.t99, T.against));
  const c = new THREE.Vector3(PLATE.x, PLATE.y + 0.0075, PLATE.z);
  logoEnd(S, t, { t0: T.logo, center: c, edge: c.clone().add(new THREE.Vector3(0, 0, LOGO_R)) });
}

makeFilm({
  T, caps: CAPS, subs: [], build, update, pose: camPose, overlay, overlayInit, focus: focusAt,
  stage: { bg: 0x07080a, reflSize: 6, env: 0.12, far: 30 },
  aperture: [[0, 0.004], [6.5, 0.003], [11.6, 0.003], [30.2, 0.004], [48.1, 0.003], [57.4, 0.004], [61.2, 0.003], [73.3, 0.003]],
  bloom: [[0, 0.45], [72, 0.55]],
});

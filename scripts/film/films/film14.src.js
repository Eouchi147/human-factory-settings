// Human Factory Settings · Film 14 "Intermittent fasting" (new direction, 7 Oct 2026) · one continuous shot, 9:16.
// A skeleton sits at a table and drums its fingers, waiting for noon. In front of it a plate that is a clock: the knife and
// the fork are its hands. Beside it a little hanging sign, EATING WINDOW: CLOSED, and a family pizza box. Noon: the box flies
// open on a family pizza, the jaw drops, the sign spins round to OPEN (the gag). The window lights on the plate's rim, noon
// to eight, and the hours fly by. A switch on the table, FAT BURNING, flips on in a sparkle; its cable runs down to a plug on
// the floor, plugged into nothing. A balance weighs the trials: noon to 8 pm against three meals a day, level; the same
// calorie limit on both pans, and an eating window dropped on one, still level; fasting against eating freely, down;
// against ordinary dieting, level. The plate's brand appears under twelve: DIET. Midnight: a fridge flies open and its light
// falls on the skeleton. Three proper meals land on the table. The warnings, plain. The plate, from above, becomes the logo.
// The factory stamp is on the breastbone.
import { THREE, ss, s5, lerp, clamp01, hash, camTrack, phys, shadows, spot, RoundedBoxGeometry, glowSprite,
  loadAnatomy, V3, place, logoEnd, makeFilm, outBack, stamp, stampCanvas, stampSpot, noiseTex } from '../kit.js';
import { buildRig, skeletonKind, bendSpine, poseArm, legIK, worldVerts, avgV, clearArms } from '../rig.js';
import { makeLogoRing } from '../props.js';

//@HANDS@

// ------------------------------------------------------------------ timing, from the voice guide (word starts)
const T = {
  end: 79.21, logo: 76.69,
  you: 0.35, skip: 0.8, breakfast: 1.01, call: 1.45, fasting: 2.55, and: 3.19, eat: 3.41, family: 3.79, pizza: 4.35, noon: 5.12, because: 5.6, window: 6.45, open: 7.23,
  lets: 8.1, talk: 8.62, window2: 9.26,
  your: 10.48, built: 11.53, hours: 11.98, food: 12.6, but: 13.02, long: 13.6, gap: 14.06, meals: 14.84, isnt: 15.29, magic: 15.83, fat: 16.34, switch: 17.2,
  in: 18.68, trial: 19.27, only: 20.21, noon2: 20.85, eight: 21.46, evening: 22.13, no: 22.86, limit: 23.7, after: 24.52, twelve: 24.95, lost: 25.9, same: 26.93, weight: 27.3, three: 28.9, day: 29.87,
  in2: 30.85, year: 31.46, both: 32.15, same2: 33.34, limits: 34.24, adding: 35.01, eighthr: 35.36, window3: 36.66, made: 37.26, clear: 37.86, difference: 38.29, weight2: 39.23,
  across: 40.6, ninetynine: 41.28, fasting2: 42.33, beat: 42.84, freely: 43.74, but2: 44.24, against: 44.55, ordinary: 45.04, dieting: 45.89, mostly: 47.15, tie: 47.64,
  clock: 48.91, magic2: 49.54, its: 50.01, one: 50.61, less: 51.68,
  so: 52.87, window4: 53.95, snack: 54.69, use: 55.16, and2: 55.9, raid: 57.29, fridge: 57.87, midnight: 58.5, eat3: 58.97, three2: 59.44, proper: 59.66, meals3: 60.24, instead: 60.77,
  dont: 62.2, pregnant: 63.34, diabetes: 64.87, ever: 66.43, disorder: 67.69, and3: 68.37, medication: 69.35, tell: 70.29, doctor: 70.89, change: 72.2,
  final: 74.43, factory: 75.64, settings: 76.01,
};

// ------------------------------------------------------------------ the set (metres, floor at y = 0): the table at the origin; the skeleton sits at -z, facing +z; +x is its left
const W = {}; window.HFS_W = W;
const X = new THREE.Vector3(1, 0, 0), Y = new THREE.Vector3(0, 1, 0), Z = new THREE.Vector3(0, 0, 1);
const TABLE = { w: 1.5, d: 0.75, top: 0.74 };
const SEAT = 0.46, SEAT_Z = -0.45;
const PLATE = new THREE.Vector3(0, TABLE.top, -0.06), PLATE_R = 0.135, LOGO_R = 0.036;
const SIGN = new THREE.Vector3(-0.42, TABLE.top, 0.24);
const PIZZA = new THREE.Vector3(0.5, TABLE.top, 0.06), BOX = { s: 0.42, h: 0.042 };
const SWITCH = new THREE.Vector3(-0.56, TABLE.top, -0.2), PLUG = new THREE.Vector3(-0.95, 0, -0.36);
const BAL = { x: 1.12, z: 0.62, top: 0.62, ry: 0 };
const FRIDGE = { x: -1.55, z: 0.85, ry: 0.9, w: 0.6, h: 1.16, d: 0.6 };
const MEALS = [new THREE.Vector3(0.45, TABLE.top, 0.08), new THREE.Vector3(0.04, TABLE.top, 0.255), new THREE.Vector3(-0.42, TABLE.top, 0.04)];
const BOX_OPEN = [T.pizza - 0.05, T.pizza + 0.32], BOX_SHUT = [9.35, 9.75], BOX_GONE = [9.75, 10.55];
const FLIP = [T.open - 0.15, T.open + 0.45];
const MAGIC = T.magic + 0.05, CABLE_LOOK = [16.6, 17.9];
const pulse = (t, a, b, r = 0.35) => ss(a, a + r, t) * (1 - ss(b - r, b, t));
// a thing that falls h metres and lands at t1, then bounces a little
const drop = (t, t1, h, b = 0.03) => { const tf = Math.sqrt((2 * h) / 9.81); if (t < t1 - tf) return h; if (t < t1) { const u = t1 - t; return 4.905 * u * u; } const u = t - t1; return b * h * Math.exp(-u * 9) * Math.abs(Math.sin(u * 22)); };
function canvasTex(w, h, draw, { srgb = true } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h, c);
  const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.userData.canvas = c; return t;
}
function txt(x, s, px, py, { font = '800 100px Archivo', color = '#fff', align = 'center', track = 0, base = 'middle', maxW = 0 } = {}) {
  x.font = font; x.letterSpacing = `${track}px`; x.fillStyle = color; x.textAlign = align; x.textBaseline = base;
  if (maxW) { const w = x.measureText(s).width; if (w > maxW) { x.save(); x.translate(px, py); x.scale(maxW / w, 1); x.fillText(s, 0, 0); x.restore(); return; } }
  x.fillText(s, px, py);
}
const blackMat = () => phys({ color: 0x141518, roughness: 0.42, clearcoat: 0.45 });
const lathe = (pts, n = 96) => new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), n);
const finish = (g) => { shadows(g); g.traverse((o) => o.layers.enable(1)); return g; };

// ------------------------------------------------------------------ the table, the stool
function makeTable(scene) {
  const g = new THREE.Group(); scene.add(g);
  const wood = phys({ color: 0x1d140e, roughness: 0.42, clearcoat: 0.5, clearcoatRoughness: 0.3, roughnessMap: noiseTex(7, 256, 0.8, 1.0, 12) });
  const top = new THREE.Mesh(new RoundedBoxGeometry(TABLE.w, 0.03, TABLE.d, 4, 0.008), wood); top.position.y = TABLE.top - 0.015; g.add(top);
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.016, TABLE.top - 0.03, 20), wood); leg.position.set(x * (TABLE.w / 2 - 0.07), (TABLE.top - 0.03) / 2, z * (TABLE.d / 2 - 0.07)); g.add(leg); }
  const stool = new THREE.Group(); stool.position.set(0, 0, SEAT_Z); g.add(stool); const black = blackMat();
  const st = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.035, 96), black); st.position.y = SEAT - 0.0175; stool.add(st);
  for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2 + 0.5, leg = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.011, SEAT - 0.03, 20), black);
    leg.position.set(Math.cos(a) * 0.12, (SEAT - 0.03) / 2, Math.sin(a) * 0.12); leg.rotation.set(Math.sin(a) * 0.08, 0, -Math.cos(a) * 0.08); stool.add(leg); }
  return finish(g);
}

// ------------------------------------------------------------------ the plate that is a clock: a white plate, a printed dial, the knife and the fork as its hands
function cutlery(kind) {   // flat, pointing along +y from the pivot (the handle's end at the centre), in the plate's own plane
  const g = new THREE.Group(), steel = new THREE.MeshPhysicalMaterial({ color: 0xb9bec7, metalness: 0.7, roughness: 0.26, clearcoat: 0.4 });
  const sh = new THREE.Shape();
  if (kind === 'knife') {
    sh.moveTo(-0.0055, -0.012); sh.lineTo(0.0055, -0.012); sh.lineTo(0.0058, 0.05); sh.lineTo(0.0036, 0.056); sh.lineTo(0.0075, 0.062); sh.quadraticCurveTo(0.0085, 0.098, 0.0016, 0.112); sh.lineTo(-0.0055, 0.112); sh.lineTo(-0.0055, 0.062); sh.lineTo(-0.0036, 0.056); sh.lineTo(-0.0058, 0.05); sh.closePath();
  } else {
    sh.moveTo(-0.0055, -0.01); sh.lineTo(0.0055, -0.01); sh.lineTo(0.0052, 0.036); sh.lineTo(0.0028, 0.044); sh.lineTo(0.0078, 0.054); sh.lineTo(0.0078, 0.08);
    const tine = (x0) => { sh.lineTo(x0 + 0.0026, 0.08); sh.lineTo(x0 + 0.0026, 0.058); }; tine(0.0052 - 0.0026); sh.lineTo(0.0026, 0.058); sh.lineTo(0.0026, 0.08); sh.lineTo(0.0008, 0.08); sh.lineTo(0.0008, 0.058); sh.lineTo(-0.0008, 0.058); sh.lineTo(-0.0008, 0.08); sh.lineTo(-0.0026, 0.08); sh.lineTo(-0.0026, 0.058); sh.lineTo(-0.0052, 0.058); sh.lineTo(-0.0052, 0.08); sh.lineTo(-0.0078, 0.08); sh.lineTo(-0.0078, 0.054); sh.lineTo(-0.0028, 0.044); sh.lineTo(-0.0052, 0.036); sh.closePath();
  }
  const geo = new THREE.ExtrudeGeometry(sh, { depth: 0.0018, bevelEnabled: true, bevelThickness: 0.0006, bevelSize: 0.0005, bevelSegments: 2, curveSegments: 16 });
  const m = new THREE.Mesh(geo, steel); m.castShadow = true; g.add(m);
  const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.004, 24), steel); pin.rotation.x = Math.PI / 2; g.add(pin);
  return g;
}
function dialTex() {   // the plate's printed face: hour marks round the rim, the numbers
  return canvasTex(1024, 1024, (x, w) => {
    const c = w / 2; x.fillStyle = '#e4e0d7'; x.fillRect(0, 0, w, w);
    const gr = x.createRadialGradient(c, c, c * 0.62, c, c, c); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(120,115,105,0.16)'); x.fillStyle = gr; x.fillRect(0, 0, w, w);
    for (let i = 0; i < 60; i++) { const a = (i / 60) * Math.PI * 2, big = i % 5 === 0, r0 = c * (big ? 0.8 : 0.84), r1 = c * 0.9;
      x.strokeStyle = '#2a2b2f'; x.lineWidth = big ? 9 : 3; x.beginPath(); x.moveTo(c + Math.sin(a) * r0, c - Math.cos(a) * r0); x.lineTo(c + Math.sin(a) * r1, c - Math.cos(a) * r1); x.stroke(); }
    for (let h = 1; h <= 12; h++) { const a = (h / 12) * Math.PI * 2; txt(x, String(h), c + Math.sin(a) * c * 0.68, c - Math.cos(a) * c * 0.68 + 6, { font: '700 64px Archivo', color: '#2a2b2f' }); }
  });
}
function rimLift(r) { return r < 0.09 ? 0 : (0.012 - 0.0065) * ((r - 0.09) / 0.04) + 0.0002; }   // the printed face follows the plate up its rim
function makePlate(scene) {
  const g = new THREE.Group(); g.position.copy(PLATE); scene.add(g);
  const prof = [[0, 0.0005], [0.07, 0.0005], [0.074, 0.004], [0.088, 0.006], [0.112, 0.012], [0.133, 0.017], [0.135, 0.0155], [0.115, 0.009], [0.09, 0.0065], [0.0, 0.0065]];
  const china = new THREE.MeshPhysicalMaterial({ color: 0xe2ded6, roughness: 0.3, clearcoat: 0.6, clearcoatRoughness: 0.2 });
  const body = new THREE.Mesh(lathe(prof, 128), china); g.add(body);
  const face = new THREE.Mesh(new THREE.RingGeometry(0.0001, 0.128, 128, 32), new THREE.MeshPhysicalMaterial({ map: dialTex(), roughness: 0.32, clearcoat: 0.6, clearcoatRoughness: 0.2, transparent: true }));
  face.rotation.x = -Math.PI / 2; face.position.y = 0.0068; g.add(face);
  { const P = face.geometry.attributes.position; for (let i = 0; i < P.count; i++) P.setZ(i, rimLift(Math.hypot(P.getX(i), P.getY(i)))); face.geometry.computeVertexNormals(); }
  // the brand under twelve, printed as on a watch: DIET (it fades in when it is said)
  const brand = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 0.015), new THREE.MeshBasicMaterial({ map: canvasTex(512, 128, (x, w, h) => { x.clearRect(0, 0, w, h); txt(x, 'DIET', w / 2, h / 2 + 3, { font: '600 84px "Geist Mono"', color: '#3a3c42', track: 26 }); }), transparent: true, opacity: 0, depthWrite: false }));
  brand.rotation.x = -Math.PI / 2; brand.position.set(0, 0.0072, -0.046); brand.renderOrder = 2; g.add(brand);
  // the eating window: a cold band on the rim, drawn as far as it reaches
  const win = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial({ color: new THREE.Color(0x7fb2e6).multiplyScalar(1.15), transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }));
  win.rotation.x = -Math.PI / 2; win.position.y = 0.0068 + 0.0005; win.renderOrder = 3; g.add(win); face.renderOrder = 1;
  const hands = new THREE.Group(); hands.position.y = 0.0082; g.add(hands);
  const knife = cutlery('knife'), fork = cutlery('fork'); knife.rotation.x = -Math.PI / 2; fork.rotation.x = -Math.PI / 2;
  const kp = new THREE.Group(), fp = new THREE.Group(); kp.add(knife); fp.add(fork); fp.position.y = 0.0024; hands.add(kp, fp);
  const logo = makeLogoRing(LOGO_R); logo.g.rotation.x = -Math.PI / 2; logo.g.position.y = 0.0075; g.add(logo.g);
  finish(g); face.castShadow = false; win.castShadow = false; brand.castShadow = false;
  return { g, face, win, brand, kp, fp, knife, fork, logo, key: '' };
}
function setWindow(P, h0, h1, k) {   // the band from h0 o'clock to h1 o'clock (clockwise), drawn as far as k
  const key = `${h0}|${h1}|${k.toFixed(3)}`; if (key === P.key) return; P.key = key;
  const a0 = (h0 / 12) * Math.PI * 2, span = (((h1 - h0 + 12) % 12) / 12) * Math.PI * 2 * k;
  const geo = new THREE.RingGeometry(0.1045, 0.1165, 96, 2, Math.PI / 2 - a0 - span, Math.max(0.0001, span)), Q = geo.attributes.position;
  for (let i = 0; i < Q.count; i++) Q.setZ(i, rimLift(Math.hypot(Q.getX(i), Q.getY(i))));
  P.win.geometry.dispose(); P.win.geometry = geo;
}

// ------------------------------------------------------------------ the hanging sign: EATING WINDOW, CLOSED on one side, OPEN on the other
function makeSign(scene) {
  const g = new THREE.Group(); g.position.copy(SIGN); g.rotation.y = -0.72; scene.add(g);   // turned toward the camera that watches it
  const brass = phys({ color: 0xb8a07a, metalness: 1, roughness: 0.32, clearcoat: 0.3 }), black = blackMat();
  const base = new THREE.Mesh(new RoundedBoxGeometry(0.15, 0.012, 0.07, 3, 0.004), black); base.position.y = 0.006; g.add(base);
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.0035, 0.0035, 0.215, 16), brass); post.position.set(-0.068, 0.012 + 0.1075, 0); g.add(post);
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.14, 16), brass); arm.rotation.z = Math.PI / 2; arm.position.set(0.002, 0.225, 0); g.add(arm);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.005, 16, 12), brass); knob.position.set(0.074, 0.225, 0); g.add(knob);
  const face = (word, col) => canvasTex(640, 360, (x, w, h) => { x.fillStyle = '#efebe2'; x.fillRect(0, 0, w, h); x.strokeStyle = '#2a2b2f'; x.lineWidth = 8; x.strokeRect(14, 14, w - 28, h - 28);
    txt(x, 'EATING WINDOW', w / 2, 82, { font: '600 40px "Geist Mono"', color: '#55575d', track: 10 }); txt(x, word, w / 2, 222, { font: '900 132px Archivo', color: col, track: 6, maxW: w * 0.84 }); });
  const card = new THREE.Group(); card.position.set(0.002, 0.2, 0); g.add(card);
  const CW = 0.12, CH = 0.0675;
  for (const s of [-1, 1]) { const ring = new THREE.Mesh(new THREE.TorusGeometry(0.004, 0.0008, 8, 20), brass); ring.position.set(s * 0.042, -0.002, 0); card.add(ring); }
  const front = new THREE.Mesh(new THREE.PlaneGeometry(CW, CH), new THREE.MeshPhysicalMaterial({ map: face('CLOSED', '#2a2b2f'), roughness: 0.6 })); front.position.set(0, -0.006 - CH / 2, 0.0013); card.add(front);
  const back = new THREE.Mesh(new THREE.PlaneGeometry(CW, CH), new THREE.MeshPhysicalMaterial({ map: face('OPEN', '#23845a'), roughness: 0.6 })); back.position.set(0, -0.006 - CH / 2, -0.0013); back.rotation.y = Math.PI; card.add(back);
  const core = new THREE.Mesh(new THREE.BoxGeometry(CW, CH, 0.002), black); core.position.y = -0.006 - CH / 2; card.add(core);
  return { g: finish(g), card };
}

// ------------------------------------------------------------------ the family pizza, in its box
function pizzaTex() {
  return canvasTex(1024, 1024, (x, w) => {
    const c = w / 2; x.clearRect(0, 0, w, w);
    x.fillStyle = '#b43e1d'; x.beginPath(); x.arc(c, c, c * 0.93, 0, Math.PI * 2); x.fill();   // the sauce
    for (let i = 0; i < 260; i++) { const a = hash(i * 1.7) * Math.PI * 2, r = Math.sqrt(hash(i * 2.3)) * c * 0.86, rr = 18 + 42 * hash(i * 3.1);   // the cheese, melted and browned in places
      const gr = x.createRadialGradient(c + Math.cos(a) * r, c + Math.sin(a) * r, 2, c + Math.cos(a) * r, c + Math.sin(a) * r, rr);
      const b = hash(i * 4.7); gr.addColorStop(0, b < 0.2 ? 'rgba(196,128,52,0.95)' : 'rgba(246,214,140,0.95)'); gr.addColorStop(0.7, 'rgba(240,200,120,0.75)'); gr.addColorStop(1, 'rgba(240,200,120,0)');
      x.fillStyle = gr; x.beginPath(); x.arc(c + Math.cos(a) * r, c + Math.sin(a) * r, rr, 0, Math.PI * 2); x.fill(); }
    for (let i = 0; i < 22; i++) { const a = (i / 22) * Math.PI * 2 * 3.3 + hash(i) , r = c * (0.18 + 0.66 * hash(i * 5.3)), px = c + Math.cos(a) * r, py = c + Math.sin(a) * r;   // pepperoni
      x.fillStyle = '#8c2617'; x.beginPath(); x.arc(px, py, 34, 0, Math.PI * 2); x.fill(); x.fillStyle = 'rgba(60,12,6,0.45)'; for (let k = 0; k < 6; k++) { x.beginPath(); x.arc(px + (hash(i * 9 + k) - 0.5) * 40, py + (hash(i * 11 + k) - 0.5) * 40, 4, 0, Math.PI * 2); x.fill(); }
      x.strokeStyle = 'rgba(70,16,8,0.6)'; x.lineWidth = 4; x.beginPath(); x.arc(px, py, 33, 0, Math.PI * 2); x.stroke(); }
    for (let i = 0; i < 9; i++) { const a = hash(i * 8.1) * Math.PI * 2, r = c * (0.2 + 0.6 * hash(i * 6.2)); x.save(); x.translate(c + Math.cos(a) * r, c + Math.sin(a) * r); x.rotate(hash(i) * 6.28); x.fillStyle = '#2f6b2a'; x.beginPath(); x.ellipse(0, 0, 22, 11, 0, 0, Math.PI * 2); x.fill(); x.restore(); }   // basil
    x.strokeStyle = 'rgba(70,30,10,0.55)'; x.lineWidth = 5; for (let k = 0; k < 4; k++) { const a = (k / 4) * Math.PI; x.beginPath(); x.moveTo(c - Math.cos(a) * c * 0.93, c - Math.sin(a) * c * 0.93); x.lineTo(c + Math.cos(a) * c * 0.93, c + Math.sin(a) * c * 0.93); x.stroke(); }   // cut in eight
  });
}
function makePizza(scene) {
  const g = new THREE.Group(); g.position.copy(PIZZA); g.rotation.y = -0.12; scene.add(g);
  const S2 = BOX.s, H = BOX.h, th = 0.003;
  const card = phys({ color: 0xc9a274, roughness: 0.88 }), inside = phys({ color: 0xb08a5e, roughness: 0.92 });
  const lidTex = canvasTex(1024, 1024, (x, w) => { x.fillStyle = '#d2ad7e'; x.fillRect(0, 0, w, w);
    for (let i = 0; i < 9000; i++) { x.fillStyle = `rgba(120,85,45,${0.05 + 0.08 * hash(i * 1.9)})`; x.fillRect(hash(i * 3.3) * w, hash(i * 5.1) * w, 2, 1); }
    x.strokeStyle = '#b33a26'; x.lineWidth = 14; x.strokeRect(60, 60, w - 120, w - 120);
    txt(x, 'FAMILY', w / 2, 410, { font: '900 150px Archivo', color: '#b33a26', track: 8 }); txt(x, 'SIZE', w / 2, 560, { font: '900 150px Archivo', color: '#b33a26', track: 8 });
    txt(x, 'HOT · FRESH · HUGE', w / 2, 700, { font: '700 46px "Geist Mono"', color: '#6e4a23', track: 10 }); });
  const bottom = new THREE.Mesh(new THREE.BoxGeometry(S2, th, S2), card); bottom.position.y = th / 2; g.add(bottom);
  for (const [px, pz, sx, sz] of [[0, -S2 / 2, S2, th], [0, S2 / 2, S2, th], [-S2 / 2, 0, th, S2], [S2 / 2, 0, th, S2]]) { const wall = new THREE.Mesh(new THREE.BoxGeometry(sx, H, sz), [card, card, inside, inside, card, card]); wall.position.set(px, H / 2, pz); g.add(wall); }
  // the lid, hinged along the back edge (toward the skeleton); its top printed
  const lid = new THREE.Group(); lid.position.set(0, H, -S2 / 2); g.add(lid);
  const lidTop = new THREE.Mesh(new THREE.BoxGeometry(S2, th, S2), [card, card, new THREE.MeshPhysicalMaterial({ map: lidTex, roughness: 0.86 }), inside, card, card]); lidTop.position.set(0, th / 2, S2 / 2); lid.add(lidTop);
  const flap = new THREE.Mesh(new THREE.BoxGeometry(S2, H * 0.8, th), card); flap.position.set(0, -H * 0.4, S2); lid.add(flap);
  // the pizza: the base with its toppings, a crust round it
  const pz = new THREE.Group(); pz.position.y = th; g.add(pz);
  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.188, 0.19, 0.008, 128), [phys({ color: 0xd9a35a, roughness: 0.7 }), new THREE.MeshPhysicalMaterial({ map: pizzaTex(), roughness: 0.55, transparent: true, sheen: 0.4, sheenColor: new THREE.Color(0xffe0a0) }), phys({ color: 0xd9a35a, roughness: 0.7 })]);
  top.position.y = 0.004; pz.add(top);
  const crust = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.0115, 16, 128), phys({ color: 0xc98a43, roughness: 0.62, roughnessMap: noiseTex(11, 256, 0.75, 1.0, 30), sheen: 0.4, sheenColor: new THREE.Color(0xffd28a) }));
  crust.rotation.x = Math.PI / 2; crust.position.y = 0.009; crust.scale.set(1, 1, 0.75); pz.add(crust);
  return { g: finish(g), lid };
}

// ------------------------------------------------------------------ the switch, FAT BURNING, and its cable to a plug on the floor (plugged into nothing)
function makeSwitch(scene) {
  const g = new THREE.Group(); g.position.copy(SWITCH); g.rotation.y = 0.35; scene.add(g);
  const bake = phys({ color: 0x17181b, roughness: 0.35, clearcoat: 0.7 }), chrome = phys({ color: 0xd4d8de, metalness: 1, roughness: 0.18 });
  const box = new THREE.Mesh(new RoundedBoxGeometry(0.14, 0.05, 0.12, 4, 0.008), bake); box.position.y = 0.025; g.add(box);
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.075), new THREE.MeshPhysicalMaterial({ map: canvasTex(640, 480, (x, w, h) => { x.fillStyle = '#d9d4c8'; x.fillRect(0, 0, w, h);
    x.strokeStyle = '#2a2b2f'; x.lineWidth = 6; x.strokeRect(12, 12, w - 24, h - 24);
    txt(x, 'OFF', w * 0.2, 70, { font: '700 46px "Geist Mono"', color: '#55575d', track: 6 }); txt(x, 'ON', w * 0.8, 70, { font: '700 46px "Geist Mono"', color: '#55575d', track: 6 });
    txt(x, 'FAT', w / 2, 270, { font: '900 96px Archivo', color: '#1e1f23', track: 6 }); txt(x, 'BURNING', w / 2, 370, { font: '900 82px Archivo', color: '#1e1f23', track: 4 });
    x.fillStyle = '#2a2b2f'; for (const [sx, sy, r] of [[w * 0.84, 70, 14], [w * 0.13, 60, 9], [w * 0.9, 160, 7]]) { x.beginPath(); for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2, rr = k % 2 ? r * 0.35 : r; x.lineTo(sx + Math.cos(a) * rr, sy + Math.sin(a) * rr); } x.closePath(); x.fill(); } }), roughness: 0.5 }));
  plate.rotation.x = -Math.PI / 2; plate.position.set(0, 0.0502, 0.016); plate.scale.setScalar(1.18); g.add(plate);
  // the toggle: a chrome lever on a pivot across the box
  const piv = new THREE.Group(); piv.position.set(0, 0.052, -0.034); g.add(piv);
  const boss = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.01, 0.006, 32), chrome); boss.position.y = 0.002; g.add(boss); boss.position.set(0, 0.053, -0.034);
  const lever = new THREE.Mesh(new THREE.CylinderGeometry(0.0035, 0.0045, 0.045, 20), chrome); lever.position.y = 0.0225; piv.add(lever);
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.0065, 20, 14), chrome); tip.position.y = 0.046; piv.add(tip);
  finish(g);
  // the cable: off the back of the box, over the table's edge, down the leg side to the floor, to the plug
  g.updateMatrixWorld(true);
  const wp = (x, y, z) => new THREE.Vector3(x, y, z).applyMatrix4(g.matrixWorld);
  const e = -TABLE.w / 2, cr = 0.0035, ty = TABLE.top + cr;
  const pts = [wp(0, 0.018, -0.062), wp(-0.012, cr, -0.095), new THREE.Vector3(e + 0.06, ty, SWITCH.z - 0.1), new THREE.Vector3(e + 0.006, ty - 0.0005, SWITCH.z - 0.09),
    new THREE.Vector3(e - 0.006, TABLE.top - 0.012, SWITCH.z - 0.085), new THREE.Vector3(e - 0.012, TABLE.top - 0.06, SWITCH.z - 0.08), new THREE.Vector3(e - 0.03, 0.4, SWITCH.z - 0.06),
    new THREE.Vector3(e - 0.045, 0.07, SWITCH.z - 0.04), new THREE.Vector3(e - 0.07, cr + 0.002, SWITCH.z + 0.02), new THREE.Vector3(e - 0.13, cr, SWITCH.z + 0.04), new THREE.Vector3(PLUG.x + 0.07, cr, PLUG.z + 0.06), new THREE.Vector3(PLUG.x + 0.026, cr, PLUG.z)];
  const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
  const cord = phys({ color: 0xe9e6df, roughness: 0.45, clearcoat: 0.4 });
  const cable = new THREE.Mesh(new THREE.TubeGeometry(curve, 220, cr, 10), cord); scene.add(cable);
  const plug = new THREE.Group(); plug.position.copy(PLUG); scene.add(plug);
  const dir = curve.getTangent(1); plug.rotation.y = Math.atan2(dir.x, dir.z) + Math.PI / 2;
  const pb = new THREE.Mesh(new RoundedBoxGeometry(0.044, 0.022, 0.034, 3, 0.006), cord); pb.position.y = 0.011; plug.add(pb);
  for (const s of [-1, 1]) { const prong = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.0045, 0.0018), chrome); prong.position.set(-0.031, 0.011, s * 0.0065); plug.add(prong); }
  finish(cable); finish(plug);
  // a few sparks for the magic
  const sparks = []; for (let i = 0; i < 26; i++) { const s = glowSprite(new THREE.Color(i % 3 ? 0xfff2c6 : 0xbfd8ff), 0.008); s.visible = false; s.material.depthWrite = false; scene.add(s); sparks.push({ s, a: hash(i * 3.7) * Math.PI * 2, u: 0.4 + 0.6 * hash(i * 5.3), up: 0.3 + 0.7 * hash(i * 7.1), d: hash(i * 9.9) * 0.12 }); }
  return { g, piv, cable, plug, sparks, tipW: () => tip.getWorldPosition(new THREE.Vector3()) };
}

// ------------------------------------------------------------------ the balance (as in film 12), weights dropped on its pans
function makeBalance(scene) {
  const g = new THREE.Group(); g.position.set(BAL.x, 0, BAL.z); g.rotation.y = BAL.ry; scene.add(g);
  const box = new THREE.Mesh(new RoundedBoxGeometry(0.5, BAL.top, 0.32, 5, 0.012), blackMat()); box.position.y = BAL.top / 2; g.add(box);
  const brass = phys({ color: 0xb8a07a, metalness: 1, roughness: 0.3, clearcoat: 0.4 }), dark = phys({ color: 0x1c1d21, metalness: 0.6, roughness: 0.4 });
  const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.02, 48), dark); foot.position.y = BAL.top + 0.01; g.add(foot);
  const col = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.012, 0.4, 24), brass); col.position.y = BAL.top + 0.22; g.add(col);
  const pivot = new THREE.Group(); pivot.position.y = BAL.top + 0.42; g.add(pivot);
  const beam = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.012, 0.014), brass); pivot.add(beam);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.014, 24, 16), brass); pivot.add(knob);
  const needle = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.13, 0.004), dark); needle.position.y = -0.065; pivot.add(needle);
  const pans = [];
  for (const s of [-1, 1]) {
    const hang = new THREE.Group(); hang.position.x = s * 0.2; pivot.add(hang);
    const hook = new THREE.Group(); hang.add(hook);
    for (let k = 0; k < 3; k++) { const a = (k / 3) * Math.PI * 2, wire = new THREE.Mesh(new THREE.CylinderGeometry(0.0012, 0.0012, 0.21, 6), dark); wire.position.set(Math.cos(a) * 0.04, -0.105, Math.sin(a) * 0.04); wire.rotation.set(Math.sin(a) * 0.19, 0, -Math.cos(a) * 0.19); hook.add(wire); }
    const pan = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.08, 0.008, 64), brass); pan.position.y = -0.21; hook.add(pan);
    pans.push({ hang, hook, pan, s });
  }
  // the label on the box's front: what is weighed against what
  const c = document.createElement('canvas'); c.width = 1100; c.height = 250; const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  finish(g);
  return { g, pivot, pans, c, tex, key: '' };
}
function drawLabels(B, head, L, R) {
  const key = head + L + '|' + R; if (key === B.key) return; B.key = key;
  const x = B.c.getContext('2d'), w = B.c.width, h = B.c.height; x.fillStyle = '#0d0e10'; x.fillRect(0, 0, w, h);
  txt(x, head, w / 2, 52, { font: '600 34px "Geist Mono"', color: '#8d9198', track: 10, maxW: w * 0.9 });
  txt(x, L, w * 0.25, 160, { font: '700 44px "Geist Mono"', color: '#e1e4e9', track: 4, maxW: w * 0.46 }); txt(x, R, w * 0.75, 160, { font: '700 44px "Geist Mono"', color: '#e1e4e9', track: 4, maxW: w * 0.46 });
  x.fillStyle = 'rgba(213,216,221,0.25)'; x.fillRect(w / 2 - 1, 100, 2, 120); B.tex.needsUpdate = true;
}
// the weights: short cylinders, an icon on the top and the name round the side
function weightTex(kind) {
  const top = canvasTex(256, 256, (x, w) => { const c = w / 2; x.fillStyle = '#ece9e2'; x.fillRect(0, 0, w, w); x.strokeStyle = '#2a2b2f'; x.fillStyle = '#2a2b2f'; x.translate(w, w); x.rotate(Math.PI);
    if (kind === 'noon8' || kind === 'win8' || kind === 'fast') { x.lineWidth = 9; x.beginPath(); x.arc(c, c, w * 0.36, 0, Math.PI * 2); x.stroke();
      x.strokeStyle = '#4f86c6'; x.lineWidth = 20; x.beginPath(); x.arc(c, c, w * 0.29, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 4) / 3); x.stroke();
      x.strokeStyle = '#2a2b2f'; x.lineWidth = 9; x.beginPath(); x.moveTo(c, c); x.lineTo(c, c - w * 0.2); x.moveTo(c, c); x.lineTo(c + w * 0.13, c); x.stroke(); }
    if (kind === 'meals') for (let k = 0; k < 3; k++) { const a = -Math.PI / 2 + (k / 3) * Math.PI * 2; x.lineWidth = 7; x.beginPath(); x.arc(c + Math.cos(a) * w * 0.2, c + Math.sin(a) * w * 0.2, w * 0.13, 0, Math.PI * 2); x.stroke(); }
    if (kind === 'kcal') txt(x, 'KCAL', c, c + 4, { font: '900 66px Archivo', color: '#2a2b2f', track: 3 });
    if (kind === 'free') { x.lineWidth = 7; x.beginPath(); x.arc(c, c, w * 0.32, 0, Math.PI * 2); x.stroke(); txt(x, 'ANY', c, c - 18, { font: '900 44px Archivo', color: '#2a2b2f' }); txt(x, 'TIME', c, c + 30, { font: '900 44px Archivo', color: '#2a2b2f' }); }
    if (kind === 'diet') txt(x, 'DIET', c, c + 4, { font: '900 70px Archivo', color: '#2a2b2f', track: 3 }); });
  const name = { noon8: 'NOON TO 8 PM', meals: '3 MEALS A DAY', kcal: 'CALORIE LIMIT', win8: '8-HOUR WINDOW', fast: 'FASTING', free: 'EATING FREELY', diet: 'ORDINARY DIETING' }[kind];
  const side = canvasTex(1024, 96, (x, w, h) => { x.fillStyle = '#e5e1d8'; x.fillRect(0, 0, w, h); txt(x, name, w * 0.25, h / 2 + 2, { font: '800 50px Archivo', color: '#2a2b2f', track: 3, maxW: w * 0.44 }); txt(x, name, w * 0.75, h / 2 + 2, { font: '800 50px Archivo', color: '#2a2b2f', track: 3, maxW: w * 0.44 }); });
  return { top, side };
}
const WEIGHT = { r: 0.064, h: 0.03 };
function makeWeight(scene, kind, small = false) {
  const r = small ? 0.045 : WEIGHT.r, h = small ? 0.022 : WEIGHT.h, tx = weightTex(kind);
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 64), [new THREE.MeshPhysicalMaterial({ map: tx.side, roughness: 0.45, clearcoat: 0.3 }), new THREE.MeshPhysicalMaterial({ map: tx.top, roughness: 0.4, clearcoat: 0.4 }), phys({ color: 0xd8d4cb, roughness: 0.5 })]);
  m.userData = { r, h, kind }; finish(m); m.visible = false; scene.add(m); return m;
}
// the weighings: on which pan (0 = left as the camera sees it, the skeleton's side), when it lands, when it lifts off, what it weighs
const WEIGHS = [
  { kind: 'noon8', pan: 0, land: T.eight + 0.15, off: 30.35, w: 1 },
  { kind: 'meals', pan: 1, land: T.same + 0.1, off: 30.35, w: 1 },
  { kind: 'kcal', pan: 0, land: T.same2 + 0.3, off: 40.35, w: 1 },
  { kind: 'kcal', pan: 1, land: T.same2 + 0.3, off: 40.35, w: 1 },
  { kind: 'win8', pan: 0, land: T.window3 - 0.25, off: 40.35, w: 0, small: true, on: 'kcal' },
  { kind: 'fast', pan: 0, land: T.fasting2 + 0.1, off: 99, w: 1.3 },
  { kind: 'free', pan: 1, land: T.freely, off: T.against + 0.1, w: 0.45 },
  { kind: 'diet', pan: 1, land: T.dieting - 0.1, off: 99, w: 1.3 },
];
// the beam's angle: each change of load starts a damped swing toward the new balance (a step response)
const TILT_K = 0.2;
const BAL_CAM = { p: [1.12, 2.117, 2.315], l: [1.12, 0.928, 0.617] };
function tiltAt(t) {
  const ev = new Set(); for (const q of WEIGHS) { ev.add(q.land); ev.add(q.off); }
  const load = (tt) => { let d = 0; for (const q of WEIGHS) if (tt >= q.land && tt < q.off) d += (q.pan === 0 ? 1 : -1) * q.w; return d; };
  let a = 0, prev = 0; for (const te of [...ev].sort((p, q) => p - q)) { if (te > t) break; const tgt = Math.max(-1.6, Math.min(1.6, load(te + 1e-6))) * TILT_K, d = tgt - prev; prev = tgt;
    const u = t - te, w0 = 7.5, z = 0.28, wd = w0 * Math.sqrt(1 - z * z); a += d * (1 - Math.exp(-z * w0 * u) * (Math.cos(wd * u) + (z / Math.sqrt(1 - z * z)) * Math.sin(wd * u))); }
  return a;
}

// ------------------------------------------------------------------ the fridge: a rounded old one; inside, a light and a few things
function makeFridge(scene) {
  const g = new THREE.Group(); g.position.set(FRIDGE.x, 0, FRIDGE.z); g.rotation.y = FRIDGE.ry; scene.add(g);
  const { w, h, d } = FRIDGE, t = 0.035, enamel = phys({ color: 0xe8e4da, roughness: 0.28, clearcoat: 0.8, clearcoatRoughness: 0.15 }), chrome = phys({ color: 0xd4d8de, metalness: 1, roughness: 0.16 });
  const inner = phys({ color: 0xf2f2ee, roughness: 0.5, emissive: new THREE.Color(0xfff6e0), emissiveIntensity: 0 });
  const box = (sx, sy, sz, x, y, z, m) => { const b = new THREE.Mesh(new RoundedBoxGeometry(sx, sy, sz, 3, Math.min(0.012, sx / 2.2, sy / 2.2, sz / 2.2)), m); b.position.set(x, y, z); g.add(b); return b; };
  const legH = 0.06;
  box(w, t, d, 0, legH + t / 2, 0, enamel); box(w, t, d, 0, legH + h - t / 2, 0, enamel); box(t, h, d, -w / 2 + t / 2, legH + h / 2, 0, enamel); box(t, h, d, w / 2 - t / 2, legH + h / 2, 0, enamel); box(w, h, t, 0, legH + h / 2, -d / 2 + t / 2, enamel);
  const back = box(w - 2 * t - 0.004, h - 2 * t - 0.004, 0.004, 0, legH + h / 2, -d / 2 + t + 0.003, inner);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.022, legH, 16), chrome); leg.position.set(sx * (w / 2 - 0.06), legH / 2, sz * (d / 2 - 0.06)); g.add(leg); }
  // shelves and a few things on them
  const glass = new THREE.MeshPhysicalMaterial({ color: 0xdfe8ee, roughness: 0.1, transparent: true, opacity: 0.35, depthWrite: false });
  for (const y of [0.36, 0.72]) { const s = new THREE.Mesh(new THREE.BoxGeometry(w - 2 * t - 0.01, 0.006, d - t - 0.06), glass); s.position.set(0, legH + y, 0.0); g.add(s); }
  const thing = (geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, legH + y, z); g.add(m); return m; };
  thing(lathe([[0.0001, 0], [0.04, 0], [0.042, 0.02], [0.042, 0.17], [0.025, 0.21], [0.018, 0.24], [0.0001, 0.24]], 48), phys({ color: 0xf6f6f2, roughness: 0.3, clearcoat: 0.5 }), -0.15, 0.726, 0.05);   // milk
  thing(new THREE.CylinderGeometry(0.1, 0.1, 0.08, 48), phys({ color: 0xf0d9e0, roughness: 0.5 }), 0.07, 0.726 + 0.04, 0.0);                                    // a cake
  thing(new THREE.CylinderGeometry(0.045, 0.045, 0.1, 32), phys({ color: 0x9c3b2e, roughness: 0.3, clearcoat: 0.6 }), 0.16, 0.366 + 0.05, 0.08);               // a jar of jam
  thing(new RoundedBoxGeometry(0.17, 0.06, 0.12, 3, 0.01), phys({ color: 0xe9d38a, roughness: 0.5 }), -0.1, 0.366 + 0.03, -0.02);                               // cheese
  thing(new THREE.SphereGeometry(0.042, 24, 16), phys({ color: 0x7aa04a, roughness: 0.5 }), -0.12, 0.036 + 0.042 + 0.03, 0.06);                                 // an apple, in the bottom
  // the door: hinged on its right edge, a chrome handle on the left
  const hinge = new THREE.Group(); hinge.position.set(-w / 2, 0, d / 2); g.add(hinge);
  const door = new THREE.Mesh(new RoundedBoxGeometry(w, h, 0.06, 5, 0.025), enamel); door.position.set(w / 2, legH + h / 2, 0.03); hinge.add(door);
  const handle = new THREE.Mesh(new RoundedBoxGeometry(0.03, 0.26, 0.03, 3, 0.012), chrome); handle.position.set(w - 0.06, legH + h * 0.62, 0.075); hinge.add(handle);
  const badge = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.03), new THREE.MeshPhysicalMaterial({ map: canvasTex(512, 128, (x, cw, ch) => { x.fillStyle = '#c9ccd2'; x.fillRect(0, 0, cw, ch); txt(x, 'COLDSTORE', cw / 2, ch / 2 + 3, { font: '800 62px Archivo', color: '#2a2b2f', track: 10 }); }), metalness: 0.6, roughness: 0.3 }));
  badge.position.set(w / 2, legH + h * 0.9, 0.0605); hinge.add(badge);
  const light = new THREE.SpotLight(0xfff1d8, 0, 4.5, 0.75, 0.6, 2); light.position.set(0, legH + h * 0.8, 0.05); light.target.position.set(0, 0.4, 2.0); g.add(light, light.target);
  light.castShadow = true; light.shadow.mapSize.set(1024, 1024); light.shadow.camera.near = 0.05; light.shadow.camera.far = 5; light.shadow.bias = -0.0005;
  const bulb = new THREE.PointLight(0xfff1d8, 0, 1.2, 2); bulb.position.set(0, legH + h * 0.85, 0); g.add(bulb);
  finish(g); badge.castShadow = false;
  return { g, hinge, inner, light, bulb };
}

// ------------------------------------------------------------------ three proper meals: breakfast, lunch, dinner, each on its plate
function mealPlate(scene, kind) {
  const g = new THREE.Group(); scene.add(g);
  const china = new THREE.MeshPhysicalMaterial({ color: 0xece9e2, roughness: 0.3, clearcoat: 0.6, clearcoatRoughness: 0.2 });
  const plate = new THREE.Mesh(lathe([[0, 0.0005], [0.06, 0.0005], [0.064, 0.004], [0.078, 0.006], [0.098, 0.011], [0.112, 0.015], [0.114, 0.0135], [0.098, 0.008], [0.078, 0.0058], [0.0, 0.0058]], 96), china); g.add(plate);
  const add = (geo, mat, x, y, z, rx = 0, ry = 0, rz = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, 0.0058 + y, z); m.rotation.set(rx, ry, rz); g.add(m); return m; };
  if (kind === 'breakfast') {
    const white = phys({ color: 0xf7f5ef, roughness: 0.35, clearcoat: 0.4 }), yolk = phys({ color: 0xf2a91f, roughness: 0.2, clearcoat: 0.8 });
    for (const [x, z] of [[-0.03, -0.02], [0.035, 0.028]]) { const e = add(new THREE.CylinderGeometry(0.036, 0.04, 0.005, 40), white, x, 0.0025, z); e.scale.set(1, 1, 0.85); add(new THREE.SphereGeometry(0.016, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2), yolk, x + 0.004, 0.004, z); }
    add(new RoundedBoxGeometry(0.085, 0.014, 0.07, 3, 0.006), phys({ color: 0xc98b45, roughness: 0.7, roughnessMap: noiseTex(5, 128, 0.7, 1, 20) }), 0.012, 0.007, -0.062, 0, 0.3, 0);   // toast
  } else if (kind === 'lunch') {
    const bread = phys({ color: 0xe0c08c, roughness: 0.8 }), leaf = phys({ color: 0x5f9a3a, roughness: 0.6 }), tom = phys({ color: 0xc8372a, roughness: 0.35 });
    const tri = (y, m, h) => { const sh = new THREE.Shape(); sh.moveTo(-0.06, -0.035); sh.lineTo(0.06, -0.035); sh.lineTo(0, 0.06); sh.closePath(); const geo = new THREE.ExtrudeGeometry(sh, { depth: h, bevelEnabled: true, bevelThickness: 0.002, bevelSize: 0.002, bevelSegments: 2 }); geo.rotateX(-Math.PI / 2); return add(geo, m, -0.012, y, 0.005, 0, 0.4, 0); };
    tri(0.0, bread, 0.01); tri(0.012, leaf, 0.003); tri(0.016, tom, 0.004); tri(0.021, bread, 0.01);
    for (const [x, z] of [[0.06, -0.04], [0.07, 0.012], [0.05, 0.05]]) add(new THREE.SphereGeometry(0.014, 20, 14), tom, x, 0.012, z);
  } else {
    const fish = phys({ color: 0xe7865f, roughness: 0.45, sheen: 0.3, sheenColor: new THREE.Color(0xffd0b0) }), green = phys({ color: 0x3f7a30, roughness: 0.75, roughnessMap: noiseTex(9, 128, 0.6, 1, 30) }), pot = phys({ color: 0xd9bf82, roughness: 0.6 });
    const f = add(new RoundedBoxGeometry(0.1, 0.022, 0.055, 4, 0.01), fish, -0.018, 0.011, -0.018, 0, -0.3, 0); f.scale.set(1, 1, 1);
    for (const [x, z] of [[0.05, 0.04], [0.068, 0.0], [0.036, 0.068]]) { add(new THREE.CylinderGeometry(0.006, 0.007, 0.02, 10), phys({ color: 0x8db35a, roughness: 0.6 }), x, 0.01, z); for (let k = 0; k < 5; k++) add(new THREE.SphereGeometry(0.011, 14, 10), green, x + Math.cos(k * 1.3) * 0.009, 0.024 + 0.004 * (k % 2), z + Math.sin(k * 1.3) * 0.009); }
    for (const [x, z] of [[-0.05, 0.045], [-0.022, 0.06], [-0.065, 0.015]]) { const p = add(new THREE.SphereGeometry(0.016, 20, 14), pot, x, 0.012, z); p.scale.set(1.2, 0.8, 1); }
  }
  finish(g); g.visible = false; return g;
}

// ------------------------------------------------------------------ the body: seated, forearms on the table; head turns; fingers that drum
const SPINE_CER = ['Atlas', 'Axis', 'Third cervical vertebra', 'Fourth cervical vertebra', 'Fifth cervical vertebra', 'Sixth cervical vertebra', 'Seventh cervical vertebra'];
let HANDS = null;
function tableSDF(p) { return p.y - TABLE.top; }
function solveHands() {
  const R = W.rig, out = {};
  for (const Side of ['Right', 'Left']) {
    const A = R.arms[Side], H = W.hand[Side], s = A.s, e = new THREE.Vector3();
    const at = new THREE.Vector3(s * 0.19, TABLE.top - 0.006, 0.035), elbowT = new THREE.Vector3(s * 0.29, TABLE.top + 0.028, -0.31);
    const wq = new THREE.Vector3();
    const extra = (A2) => { A2.elbow.getWorldPosition(e); H.wr.g.getWorldPosition(wq); return 1.5 * e.distanceTo(elbowT) + 4 * Math.max(0, TABLE.top + 0.026 - e.y) + 2 * Math.abs(wq.y - (TABLE.top + 0.024)); };   // the forearm lies on the wood: the wrist low too
    const aims = [{ v: H.n, to: new THREE.Vector3(0, -1, 0), w: 2.5 }, { v: H.fdir, to: new THREE.Vector3(-s * 0.22, -0.04, 1).normalize(), w: 1.5 }];
    // solve, then lift or lower the target until the lowest bone of the palm and wrist rests 3 mm above the wood
    const palmLow = () => { let mn = 9; const v = new THREE.Vector3(); H.eg.updateMatrixWorld(true); H.eg.traverse((m) => { if (!m.isMesh || /phalanx/i.test(m.userData.name)) return; const P = m.geometry.attributes.position; for (let i = 0; i < P.count; i += 2) mn = Math.min(mn, v.fromBufferAttribute(P, i).applyMatrix4(m.matrixWorld).y); }); return mn; };
    let sol = null;   // the forearms turned palm down (the radius crosses the ulna): pronation P0
    for (let it = 0; it < 4; it++) {
      const P0 = 2.1; sol = solveHand(R, Side, H, at, sol || { dir: [0.15, -0.75, 0.6], twist: 0.6, elbow: 1.3, pro: P0 }, aims, extra, it ? [] : [{ dir: [0.15, -0.75, 0.6], twist: 0.6, elbow: 1.3, pro: P0 }, { dir: [0.25, -0.6, 0.75], twist: 0.2, elbow: 1.1, pro: P0 }, { dir: [0.1, -0.85, 0.5], twist: 1.0, elbow: 1.5, pro: P0 }]);
      poseArm(A, sol); setWrist(H.wr, sol); A.girdle.updateMatrixWorld(true); H.curl(0);
      const d = TABLE.top + 0.004 - palmLow(); if (Math.abs(d) < 0.0008) break; at.y += d;
    }
    // lift the hand clear of the table, then let each finger down onto it
    const F = H.fit(tableSDF, { need: 0.0035, kmin: -0.25, kmax: 0.9 });
    out[Side] = { sol, F }; W.handDbg = W.handDbg || {}; W.handDbg[Side] = { ...sol.dbg, wr: +sol.wr.toFixed(2), wf: +sol.wf.toFixed(2), wd: +sol.wd.toFixed(2), tw: +sol.twist.toFixed(2), el: +sol.elbow.toFixed(2), elbow: A.elbow.getWorldPosition(new THREE.Vector3()).toArray().map((v) => +v.toFixed(3)), shoulder: A.arm.getWorldPosition(new THREE.Vector3()).toArray().map((v) => +v.toFixed(3)) };
  }
  return out;
}
function headAt(t) {   // where the head looks: yaw (+ to its left), pitch (+ down), from the moment
  const look = [
    [0, 0.0, 0.3], [4.2, 0.0, 0.3], [4.55, 0.42, 0.12], [6.2, 0.42, 0.12], [6.6, -0.42, 0.18], [7.9, -0.42, 0.18], [8.4, 0.0, 0.3],
    [13.4, 0.0, 0.3], [13.9, -0.5, 0.42], [17.6, -0.5, 0.42], [18.6, 0.0, 0.25], [19.4, 0.6, 0.12], [47.9, 0.6, 0.12], [48.8, 0.0, 0.32],
    [56.6, 0.0, 0.32], [57.4, -0.72, 0.05], [58.9, -0.72, 0.05], [59.4, 0.0, 0.34], [99, 0.0, 0.34]];
  for (let i = 0; i < look.length - 1; i++) if (t < look[i + 1][0]) { const k = s5(look[i][0], look[i + 1][0], t); return [lerp(look[i][1], look[i + 1][1], k), lerp(look[i][2], look[i + 1][2], k)]; }
  return [0, 0.34];
}
const _qa = new THREE.Quaternion();
function poseBody(t) {
  const R = W.rig, br = 0.5 - 0.5 * Math.cos((t / 4.4) * Math.PI * 2);
  const [yaw, pitch] = headAt(t);
  bendSpine(R.seg, { lum: 0.1, tho: 0.26, cer: pitch + 0.015 * br });           // the trunk stays put (the forearms rest on the table); the neck turns
  for (const n of SPINE_CER) { const s = R.seg[n]; if (s) s.g.rotation.y += yaw / SPINE_CER.length; }
  if (HANDS) for (const Side of ['Right', 'Left']) { const A = R.arms[Side], h = HANDS[Side]; poseArm(A, h.sol); setWrist(W.hand[Side].wr, h.sol);
    // the right hand drums its fingers while it waits for noon (each lifts and taps down, little finger first)
    const per = h.F.per.map((k, i) => { if (Side !== 'Right') return k; const dr = pulse(t, T.you, T.noon - 0.3, 0.3); const ph = ((t * 1.6 - (3 - i) * 0.12) % 1 + 1) % 1; return k - dr * 0.45 * Math.max(0, Math.sin(Math.PI * Math.min(1, ph / 0.7))) ** 2; });
    W.hand[Side].curl(0, per, h.F.tk); }
  W.body.quaternion.identity(); W.body.position.copy(W.sitP); W.body.updateMatrixWorld(true);
  for (const Side of ['Right', 'Left']) {
    const G = R.legs[Side]; _qa.setFromAxisAngle(X, -Math.PI / 2); G.hip.quaternion.copy(_qa);
    const tgt = new THREE.Vector3(W.sitP.x + G.s * 0.13, G.A.y - G.ground + 0.002, W.sitP.z + 0.44);
    legIK(R, Side, tgt, new THREE.Quaternion(), Z);
  }
  // the jaw drops at the pizza
  if (W.jawG) W.jawG.rotation.x = 0.3 * pulse(t, T.pizza + 0.05, 7.6, 0.25);
  W.body.updateMatrixWorld(true);
}

// ------------------------------------------------------------------ the clock: the time it shows (hours), by moment
function clockAt(t) {
  let h = 11.93 + 0.07 * s5(0, T.noon - 0.2, t);                              // the knife creeps to twelve
  h += 36 * s5(T.your + 0.3, T.food + 0.3, t);                               // the hours fly by: three days round
  h += (10 + 10 / 60) * s5(T.clock - 0.35, T.clock + 0.45, t);               // ten past ten, as in a watch advert: the brand shows
  h += (2 - 10 / 60) * s5(T.raid - 0.2, T.midnight, t);                      // midnight
  return h;
}
function windowAt(t) { return s5(T.window2 - 0.4, T.window2 + 0.5, t) * (1 - s5(T.raid - 0.4, T.raid, t)); }

// ------------------------------------------------------------------ build
async function build(S, cfg) {
  const scene = S.scene;
  S.fog.near = 4; S.fog.far = 14;
  S.table.scale.set(3, 3, 1); S.tableMat.clearcoat = 0.1; S.tableMat.specularIntensity = 0.3;
  for (const m of [S.tableMat.map, S.tableMat.roughnessMap]) if (m) { m.wrapS = m.wrapT = THREE.RepeatWrapping; m.repeat.multiplyScalar(3); }
  const meshes = await loadAnatomy(skeletonKind());
  const R = W.rig = buildRig(meshes);
  W.body = new THREE.Group(); scene.add(W.body); R.root.position.copy(R.P0).negate(); W.body.add(R.root);
  for (const m of meshes) { m.castShadow = true; m.receiveShadow = true; m.layers.enable(1); }
  W.bones = meshes.filter((m) => ['bone', 'tooth', 'cartilage'].includes(m.userData.tissue));
  { const st = R.byName.get('Body of sternum'); st.material = st.material.clone();
    W.stampSpot = stampSpot(st, { from: [0, 0.006, 0.12], dir: [0, 0, -1], spread: 0.004 });
    if (W.stampSpot) W.stamp = stamp(st, { canvas: stampCanvas(['HUMAN FACTORY', 'SETTINGS'], '', { frame: false }), center: W.stampSpot.center, normal: W.stampSpot.normal, up: [0, 1, 0], width: 0.04, depth: 0.03, opacity: 0.6 }); }
  // the jaw on its own hinge
  { const at = R.seg.Atlas; W.body.updateMatrixWorld(true);
    W.jawG = new THREE.Group(); W.jawG.position.copy(new THREE.Vector3(0, 1.668, -0.003)).sub(at.pivot); at.g.add(W.jawG); at.g.updateMatrixWorld(true);
    for (const m of meshes) if (/^mandible$|lower .*tooth/i.test(m.userData.name)) W.jawG.attach(m); }
  W.hand = {}; for (const Side of ['Right', 'Left']) { const Wr = makeWrist(R, Side, { pronate: true }); W.hand[Side] = rigHand(R, Side, Wr); W.hand[Side].wr = Wr; }
  // seated on the stool
  const hipB = new THREE.Box3(); for (const m of meshes) if (/hip bone/i.test(m.userData.name)) for (const v of worldVerts(m, 3)) hipB.expandByPoint(v);
  W.sitP = new THREE.Vector3(0, SEAT + 0.002 + (R.P0.y - hipB.min.y), SEAT_Z + 0.02);
  // ---- the set
  W.table = makeTable(scene); W.plate = makePlate(scene); W.sign = makeSign(scene); W.pizza = makePizza(scene); W.sw = makeSwitch(scene);
  W.bal = makeBalance(scene); W.fridge = makeFridge(scene);
  W.weights = WEIGHS.map((q) => makeWeight(scene, q.kind, q.small));
  { const c = BAL_CAM.p, dx = c[0] - BAL.x, dz = c[2] - BAL.z; W.weightYaw = Math.atan2(-dz, dx); }   // the name, printed at a quarter turn, faces the balance's camera
  W.meals = ['breakfast', 'lunch', 'dinner'].map((k) => mealPlate(scene, k));
  // the forearms on the table, the hands either side of the plate, the fingers down on the wood
  poseBody(0); HANDS = solveHands(); poseBody(0);
  // ---- light
  W.key = spot(scene, { color: 0xffe9d2, pos: new THREE.Vector3(-1.2, 2.7, 1.5), target: new THREE.Vector3(0, 0.8, -0.1), angle: 0.5, penumbra: 0.8, shadow: true, size: cfg.shadow ?? 1024 }); W.key.shadow.camera.far = 7;
  W.rim = spot(scene, { color: 0xa9c4ff, pos: new THREE.Vector3(1.2, 2.2, -1.9), target: new THREE.Vector3(0, 1.0, -0.4), angle: 0.5, penumbra: 0.9 });
  W.fill = spot(scene, { color: 0xc8d6ff, pos: new THREE.Vector3(1.6, 1.3, 1.8), target: new THREE.Vector3(0, 0.9, -0.2), angle: 0.6, penumbra: 1 });
  W.plateLight = spot(scene, { color: 0xfff1d8, pos: new THREE.Vector3(0.25, 2.1, 0.45), target: PLATE.clone(), angle: 0.16, penumbra: 0.6 });
  W.poolLight = spot(scene, { color: 0xfff3e2, pos: new THREE.Vector3(-0.15, 2.25, 0.75), target: new THREE.Vector3(-0.22, TABLE.top, 0.08), angle: 0.21, penumbra: 0.75 });
  W.balLight = spot(scene, { color: 0xfff1d8, pos: new THREE.Vector3(0.4, 2.4, 1.9), target: new THREE.Vector3(BAL.x, BAL.top + 0.25, BAL.z), angle: 0.28, penumbra: 0.7 });
  W.swLight = spot(scene, { color: 0xfff1d8, pos: new THREE.Vector3(-0.95, 2.1, -0.6), target: new THREE.Vector3(-0.72, 0.35, -0.22), angle: 0.42, penumbra: 0.7 });
  W.auditSolids = [['table', W.table], ['plate', W.plate.g], ['sign', W.sign.g], ['pizza box', W.pizza.g], ['switch', W.sw.g], ['cable', W.sw.cable], ['plug', W.sw.plug],
    ['balance', W.bal.g], ['fridge', W.fridge.g], ...W.meals.map((m, i) => ['meal ' + i, m])].filter((q) => q[1]);
  W.timing = { drum: [T.you, T.noon - 0.3], boxOpen: BOX_OPEN, jaw: [T.pizza + 0.05, 7.6], noon: T.noon, flip: FLIP, window: [T.window2 - 0.4, T.window2 + 0.5], boxShut: BOX_SHUT, boxGone: BOX_GONE,
    hours: [T.your + 0.3, T.food + 0.3], magic: MAGIC, cable: CABLE_LOOK, weights: WEIGHS.map((q) => [q.kind, q.pan, q.land, q.off]),
    brand: [T.one - 0.2, T.less + 0.2], fridge: [T.fridge - 0.15, T.fridge + 0.45], midnight: T.midnight, meals: MEAL_T, logo: T.logo };
  return { stamp: W.stampSpot, sitP: W.sitP.toArray().map((v) => +v.toFixed(3)), hands: HANDS && ['Right', 'Left'].map((s) => +HANDS[s].sol.err.toFixed(4)), fingers: HANDS && ['Right', 'Left'].map((s) => HANDS[s].F.per.map((v) => +v.toFixed(2))) };
}
const MEAL_T = [T.three2, T.proper + 0.18, T.meals3 + 0.1];

// ------------------------------------------------------------------ the camera: one path, no cuts
let CAM = null;
function buildCam() {
  const P = PLATE;
  const toward = (p, l, k) => p.map((v, i) => l[i] + (v - l[i]) * k);
  const orbit = (p, l, a) => { const dx = p[0] - l[0], dz = p[2] - l[2], c = Math.cos(a), s = Math.sin(a); return [l[0] + dx * c + dz * s, p[1], l[2] - dx * s + dz * c]; };
  const SIGNV = { p: [-0.833, 1.214, 0.674], l: [-0.22, 0.809, 0.06] };              // the sign, the plate, the drumming hand
  const NOON = { p: [1.121, 1.946, 2.543], l: [0.144, 1.181, -0.143] };              // the skeleton, the pizza, the plate
  const WIN = { p: [0.101, 1.539, 0.504], l: [-0.008, 0.788, -0.117] };              // the plate from above: the window, the brand
  const HOURS = { p: [0.0, 2.496, 1.639], l: [0.0, 1.166, -0.259] };                 // the skeleton waiting, the hands flying round
  const SWV = { p: [-0.613, 1.38, 0.144], l: [-0.543, 0.905, -0.249] };              // the switch
  const PLUGV = { p: [-0.687, 1.996, -0.795], l: [-0.687, 0.477, -0.087] };            // down the cable to the plug, from behind
  const FRV = { p: [0.549, 2.301, 2.746], l: [-1.418, 0.935, 1.096] };               // the fridge
  const MEALV = { p: [1.289, 2.262, 2.216], l: [-0.055, 1.176, -0.113] };             // three meals; the warnings
  return camTrack([
    { t: -3.0, p: V3(...toward(SIGNV.p, SIGNV.l, 1.08)), l: V3(...SIGNV.l), fov: 34 },
    { t: 0.0, p: V3(...toward(SIGNV.p, SIGNV.l, 1.05)), l: V3(...SIGNV.l), fov: 34, tens: 0.4 },
    { t: 3.05, p: V3(...SIGNV.p), l: V3(...SIGNV.l), fov: 34, stop: true },
    { t: 3.7, p: V3(...NOON.p), l: V3(...NOON.l), fov: 34, stop: true },
    { t: 6.25, p: V3(...toward(NOON.p, NOON.l, 0.95)), l: V3(...NOON.l), fov: 34, stop: true },
    { t: 6.8, p: V3(...toward(SIGNV.p, SIGNV.l, 0.97)), l: V3(...SIGNV.l), fov: 34, stop: true },
    { t: 8.05, p: V3(...toward(SIGNV.p, SIGNV.l, 0.95)), l: V3(...SIGNV.l), fov: 34, stop: true },
    { t: 8.65, p: V3(...WIN.p), l: V3(...WIN.l), fov: 32, stop: true },
    { t: 10.35, p: V3(...toward(WIN.p, WIN.l, 0.97)), l: V3(...WIN.l), fov: 32, stop: true },
    { t: 11.0, p: V3(...HOURS.p), l: V3(...HOURS.l), fov: 34, stop: true },
    { t: 13.35, p: V3(...toward(HOURS.p, HOURS.l, 0.96)), l: V3(...HOURS.l), fov: 34, stop: true },
    { t: 14.05, p: V3(...SWV.p), l: V3(...SWV.l), fov: 30, stop: true },
    { t: CABLE_LOOK[0], p: V3(...toward(SWV.p, SWV.l, 0.96)), l: V3(...SWV.l), fov: 30, stop: true },
    { t: CABLE_LOOK[1], p: V3(...PLUGV.p), l: V3(...PLUGV.l), fov: 32, stop: true },
    { t: 18.35, p: V3(...toward(PLUGV.p, PLUGV.l, 0.98)), l: V3(...PLUGV.l), fov: 32, stop: true },
    { t: 19.15, p: V3(...BAL_CAM.p), l: V3(...BAL_CAM.l), fov: 32, stop: true },
    { t: 47.95, p: V3(...toward(BAL_CAM.p, BAL_CAM.l, 0.95)), l: V3(...BAL_CAM.l), fov: 32, stop: true },
    { t: 48.75, p: V3(...WIN.p), l: V3(...WIN.l), fov: 32, stop: true },
    { t: 56.45, p: V3(...toward(WIN.p, WIN.l, 0.96)), l: V3(...WIN.l), fov: 32, stop: true },
    { t: 57.3, p: V3(...FRV.p), l: V3(...FRV.l), fov: 34, stop: true },
    { t: 58.9, p: V3(...toward(FRV.p, FRV.l, 0.97)), l: V3(...FRV.l), fov: 34, stop: true },
    { t: 59.45, p: V3(...MEALV.p), l: V3(...MEALV.l), fov: 34, stop: true },
    { t: 73.6, p: V3(...orbit(MEALV.p, MEALV.l, -0.42)), l: V3(...MEALV.l), fov: 34, stop: true },
    { t: 74.9, p: V3(P.x, P.y + 0.58, P.z + 0.14), l: V3(P.x, P.y, P.z), fov: 30, stop: true },
    { t: T.logo, p: V3(P.x, P.y + 0.4, P.z + 0.004), l: V3(P.x, P.y + 0.0075, P.z), fov: 30, stop: true },   // straight down on the plate: the logo
  ]);
}
function camPose(S, t) {
  const v = S.cfg.view; if (v && typeof v === 'object') return v;
  if (!CAM) CAM = buildCam();
  if (t <= T.logo) return CAM(t);
  const Q = CAM(T.logo), k = ss(T.logo, T.end, t); return { p: [Q.p[0], lerp(Q.p[1], Q.p[1] - 0.03, k), Q.p[2]], l: Q.l, fov: 30 };
}
function focusAt(S, t, P) { return Math.hypot(P.p[0] - P.l[0], P.p[1] - P.l[1], P.p[2] - P.l[2]); }

// ------------------------------------------------------------------ one moment of the film
const _v = new THREE.Vector3();
function update(S, t) {
  const scene = S.scene, endDark = ss(T.final + 0.2, T.factory + 0.25, t);   // dark early, so the plate never sits bright behind the last words
  poseBody(t);
  // ---- the plate-clock: the hands (knife = minutes, fork = hours), the window, the brand
  { const P = W.plate, h = clockAt(t), logoK = s5(T.final + 0.4, T.logo - 0.4, t);
    P.kp.rotation.y = -((h % 1) * Math.PI * 2); P.fp.rotation.y = -(((h % 12) / 12) * Math.PI * 2);
    const hk = 1 - logoK; P.knife.visible = P.fork.visible = hk > 0.02; P.kp.scale.setScalar(Math.max(0.001, hk)); P.fp.scale.setScalar(Math.max(0.001, hk));
    const w = windowAt(t); setWindow(P, 12, 8, Math.max(0.001, w)); P.win.material.opacity = 0.85 * (w > 0.002 ? 1 : 0);
    P.brand.material.opacity = s5(T.one - 0.2, T.less + 0.2, t) * (1 - logoK);
    P.face.material.opacity = 1 - 0.85 * logoK;
    P.logo.set({ weight: logoK, white: logoK, hours: 0, hand: ss(T.logo - 0.4, T.logo - 0.15, t), handScale: outBack(clamp01((t - (T.logo - 0.4)) / 0.35), 1.8) }); }
  // ---- the sign: spun round to OPEN at noon's punchline; back to CLOSED at midnight
  { const f = s5(FLIP[0], FLIP[1], t) - s5(T.raid - 0.3, T.raid + 0.3, t), wob = 0.12 * Math.exp(-Math.max(0, t - FLIP[1]) * 6) * Math.sin(Math.max(0, t - FLIP[1]) * 24) * (t > FLIP[1] ? 1 : 0);
    W.sign.card.rotation.y = Math.PI * f + wob; }
  // ---- the pizza box: flies open; shuts; slides off the table and is gone
  { const Pz = W.pizza, o = s5(BOX_OPEN[0], BOX_OPEN[1], t) * (1 - s5(BOX_SHUT[0], BOX_SHUT[1], t)), bounce = 0.12 * Math.exp(-Math.max(0, t - BOX_OPEN[1]) * 7) * Math.sin(Math.max(0, t - BOX_OPEN[1]) * 20) * (t > BOX_OPEN[1] && t < BOX_SHUT[0] ? 1 : 0);
    Pz.lid.rotation.x = -(1.95 * o + bounce);
    const gk = s5(BOX_GONE[0], BOX_GONE[1], t); Pz.g.position.set(PIZZA.x + 0.9 * gk, PIZZA.y - 0.25 * Math.max(0, gk - 0.35) ** 2, PIZZA.z); Pz.g.visible = gk < 0.999; }
  // ---- the switch: flipped on, a burst of sparks; nothing happens
  { const Sw = W.sw, k = s5(MAGIC - 0.12, MAGIC + 0.08, t); Sw.piv.rotation.x = lerp(-0.55, 0.55, k) + 0.08 * Math.exp(-Math.max(0, t - MAGIC - 0.08) * 9) * Math.sin(Math.max(0, t - MAGIC) * 30) * (t > MAGIC ? 1 : 0);
    const tip = Sw.tipW(), u0 = t - MAGIC;
    Sw.sparks.forEach((q) => { const u = (u0 - q.d) / 0.9; q.s.visible = u > 0 && u < 1; if (!q.s.visible) return; const r = 0.12 * q.u * Math.sqrt(u);
      q.s.position.set(tip.x + Math.cos(q.a) * r, tip.y + 0.15 * q.up * u - 0.1 * u * u, tip.z + Math.sin(q.a) * r); q.s.material.opacity = Math.sin(Math.PI * u) * (0.6 + 0.4 * Math.abs(Math.sin(t * 40 + q.a * 7))); q.s.scale.setScalar(0.006 + 0.006 * Math.sin(Math.PI * u)); }); }
  // ---- the balance: the weights land and lift off; the beam swings and settles
  { const B = W.bal;
    const a = tiltAt(t); B.pivot.rotation.z = a; B.g.updateMatrixWorld(true);
    for (const P of B.pans) P.hook.rotation.z = -a;
    const stack = [0, 0];
    WEIGHS.forEach((q, i) => { const m = W.weights[i], P = B.pans[q.pan];
      const fall = drop(t, q.land, 0.55, 0.05), lift = Math.max(0, t - q.off); m.visible = t > q.land - 0.6 && lift < 0.8;
      if (!m.visible) return;
      P.hook.updateMatrixWorld(true); const base = q.on ? WEIGHT.h : 0; _v.set(0, -0.21 + 0.004 + base + m.userData.h / 2, 0).applyMatrix4(P.hook.matrixWorld);
      m.position.set(_v.x, _v.y + fall + 2.5 * lift * lift, _v.z); m.quaternion.setFromAxisAngle(Y, W.weightYaw ?? 0); stack[q.pan]++; }); }
  // ---- the fridge: midnight, the door flies open, its light out over the floor and the skeleton
  { const Fr = W.fridge, o = s5(T.fridge - 0.15, T.fridge + 0.45, t) * (1 - s5(61.0, 61.8, t)), sw = 0.06 * Math.exp(-Math.max(0, t - T.fridge - 0.45) * 5) * Math.sin(Math.max(0, t - T.fridge - 0.45) * 16) * (t > T.fridge + 0.45 && t < 61 ? 1 : 0);
    Fr.hinge.rotation.y = -(1.9 * o + sw); const on = ss(T.fridge - 0.1, T.fridge + 0.2, t) * (1 - ss(61.2, 61.8, t));
    Fr.light.intensity = 9 * on; Fr.bulb.intensity = 0.7 * on; Fr.inner.emissiveIntensity = 0.22 * on; }
  // ---- three proper meals land on the table
  W.meals.forEach((m, i) => { const at = MEAL_T[i]; m.visible = t > at - 0.5; if (!m.visible) return; m.position.set(MEALS[i].x, MEALS[i].y + drop(t, at, 0.4, 0.02), MEALS[i].z); m.rotation.y = 0.4 * i - 0.3; });
  // ---- light
  const fig = 1 - endDark, night = pulse(t, T.raid - 0.2, 61.4, 0.5);
  const close = Math.max(pulse(t, -1, 3.25, 0.3), pulse(t, 6.35, 10.5, 0.3), pulse(t, 48.6, 56.55, 0.35), ss(74.1, 74.6, t)), dk = 1 - 0.97 * close;
  W.key.intensity = 9 * fig * (1 - 0.6 * night) * dk; W.rim.intensity = 4 * fig * dk; W.fill.intensity = 1.0 * fig * (1 - 0.5 * night) * dk;
  W.plateLight.intensity = 2.2 * fig * (1 + 0.8 * close); W.poolLight.intensity = 6 * fig * close; W.balLight.intensity = 10 * fig * pulse(t, 18.4, 48.6, 0.6); W.swLight.intensity = 5 * fig * pulse(t, 13.6, 18.6, 0.5);
  S.tableMat.color.setScalar(0.32 * (1 - endDark * 0.9)); scene.environmentIntensity = 0.12 * (1 - endDark) * (1 - 0.85 * close); S.reflAmt = 0.5 * (1 - endDark);
}

// ------------------------------------------------------------------ the words on screen
const CAPS = [
  { t0: T.you, t1: 3.1, top: 292, size: 86, html: 'You skip <em>breakfast</em>,<br>call it intermittent<br>fasting,' },
  { t0: T.and, t1: 7.95, top: 292, size: 82, html: 'and then eat a<br><em>family pizza</em> at noon<br>because the<br>window is open.' },
  { t0: T.lets, t1: 10.3, top: 300, size: 92, html: 'Let’s talk about<br>the <em>window</em>.' },
  { t0: T.your, t1: 12.95, top: 292, size: 86, html: 'Your body was built<br>to go <em>hours</em><br>without food,' },
  { t0: T.but, t1: 18.4, top: 292, size: 82, html: 'but a long gap<br>between meals isn’t<br>a <em>magic</em><br>fat-burning switch.' },
  { t0: T.in, t1: 24.3, top: 292, size: 78, html: 'In one trial, people ate<br>only from <em>noon to 8 pm</em>,<br>with no calorie limit,' },
  { t0: T.after - 0.04, t1: 30.5, top: 292, size: 76, html: 'and after 12 weeks,<br>they lost about the<br><em>same weight</em> as people<br>eating three meals a day.' },
  { t0: T.in2, t1: 34.6, top: 292, size: 82, html: 'In a year-long trial,<br>both groups had the<br><em>same calorie limits</em>,' },
  { t0: 34.69, t1: 40.3, top: 292, size: 80, html: 'and adding an 8-hour<br>eating window made<br><em>no clear difference</em><br>to their weight.' },
  { t0: T.across, t1: 44.1, top: 292, size: 86, html: 'Across 99 trials,<br>fasting <em>beat</em><br>eating freely,' },
  { t0: T.but2, t1: 48.3, top: 292, size: 84, html: 'but against ordinary<br>dieting, it was<br>mostly <em>a tie</em>.' },
  { t0: 48.61, t1: 52.5, top: 292, size: 84, html: 'The clock isn’t magic.<br>It’s just one way<br>to <em>eat less</em>.' },
  { t0: T.so, t1: 55.85, top: 292, size: 80, html: 'So if an eating window<br>helps you snack less,<br><em>use it</em>,' },
  { t0: T.and2, t1: 58.9, top: 292, size: 86, html: 'and if it makes you<br><em>raid the fridge</em><br>at midnight,' },
  { t0: T.eat3, t1: 61.9, top: 300, size: 90, html: 'eat <em>three proper</em><br><em>meals</em> instead.' },
  { t0: T.dont, t1: 68.3, top: 292, size: 72, html: 'Don’t fast if you’re<br>pregnant or breastfeeding,<br>have diabetes, or have ever<br>had an eating disorder,' },
  { t0: T.and3, t1: 74.0, top: 292, size: 80, html: 'and if you take<br>medication, tell your<br><em>doctor</em> before you<br>change how you eat.' },
  { t0: T.final, t1: 99, top: 360, size: 92, html: 'Let’s get you back to<br><em>factory settings.</em>' },
];
const OVL = {};
function overlayInit(S) {
  const O = S.O, tag = (cls, txt2, size, bsize) => { const e = O.tag(cls, txt2); e.style.fontSize = size + 'px'; const b = e.querySelector('b'); if (b && bsize) b.style.fontSize = bsize + 'px'; return e; };
  OVL.t1 = tag('tag', 'One trial<b>12 weeks</b>', 22, 40);
  OVL.t2 = tag('tag', 'One trial, same calorie limit<b>1 year</b>', 22, 40);
  OVL.t3 = tag('tag', 'Across<b>99 trials</b>', 22, 40);
}
function overlay(S, t) {
  const top = new THREE.Vector3(BAL.x, BAL.top + 0.42, BAL.z);
  place(S, OVL.t1, top, -140, -150, pulse(t, T.trial, 30.3));
  place(S, OVL.t2, top, -200, -150, pulse(t, T.year, 40.3));
  place(S, OVL.t3, top, -90, -150, pulse(t, T.ninetynine, 48.2));
  const c = new THREE.Vector3(PLATE.x, PLATE.y + 0.0075, PLATE.z);
  logoEnd(S, t, { t0: T.logo, center: c, edge: c.clone().add(new THREE.Vector3(0, 0, LOGO_R)) });
}

makeFilm({
  T, caps: CAPS, subs: [], build, update, pose: camPose, overlay, overlayInit, focus: focusAt,
  stage: { bg: 0x07080a, reflSize: 8, env: 0.12, far: 30 },
  aperture: [[0, 0.004], [3.7, 0.003], [6.8, 0.004], [8.65, 0.004], [11.0, 0.003], [14.05, 0.004], [17.95, 0.003], [19.15, 0.003], [48.75, 0.004], [57.3, 0.003], [59.45, 0.003], [75.0, 0.004]],
  bloom: [[0, 0.45], [74, 0.55]],
  fast: [[3.0, 3.75, 2], [6.2, 6.85, 2], [8.0, 8.7, 2], [10.3, 11.05, 2], [13.3, 14.1, 2], [16.6, 17.95, 2], [18.3, 19.2, 2], [47.9, 48.8, 2], [56.4, 57.35, 2], [58.85, 59.5, 2], [73.6, 75.1, 2]],
});

// Human Factory Settings · Film 19 "Can you get up off the floor without your hands?" (new direction) · one continuous shot, 9:16.
// One room: a sofa, a score board, a sturdy chair, a warning sign, a logo dial. The skeleton starts on the floor and
// hauls itself up with a hand, a knee and a grab at the sofa. Then the clean move, in one piece. Then the scored test:
// a hand on the floor costs a point on the board, a knee down costs another. The way back beside the chair: push on
// the seat, one hand, a fingertip, nothing. Training: chair stands, calf raises holding the chair, one slow trip down
// to the floor and back. The warning on its sign. The dial becomes the logo. The factory stamp is on the right thigh
// bone, like film 3. Posture: athlete stand, palms facing the body, from film 18 on.
import { THREE, ss, s5, lerp, clamp01, hash, camTrack, phys, shadows, spot, RoundedBoxGeometry,
  loadAnatomy, V3, place, logoEnd, makeFilm, outBack, noiseTex, stamp, stampCanvas, stampSpot, softSprite } from '../kit.js';
import { buildRig, skeletonKind, bendSpine, poseArm, legIK, worldVerts, avgV } from '../rig.js';
import { makeLogoRing } from '../props.js';

// ------------------------------------------------------------------ timing, from the voice guide (word starts)
const T = { end: 77.15, logo: 74.65, you: 0.35, floor1: 1.33, lava: 1.69, down1: 2.34, easy: 3.26, up1: 3.74, hand1: 4.56, knee1: 4.91, prayer: 6.19, sofaW: 7.07, haveNot: 8.24, party: 9.62, basic: 11.32, body: 13.54, built: 14.63, sit2: 14.93, floor2: 15.39, stand2: 16.09, onePiece: 17.06, strength: 18.23, balance: 18.64, flexibility: 19.86, researchers: 22.19, scored: 23.11, move3: 23.97, twoThousand: 24.41, adults: 25.57, sat3: 26.24, rose: 27.73, every: 29.36, hand2: 29.98, knee2: 30.4, cost: 30.53, point4: 31.16, low: 31.68, linked4: 32.75, higher: 33.23, death: 33.65, each: 36.23, extra: 36.68, point5: 37.15, twentyOne: 38.15, percent: 38.79, survival: 40.11, so6: 41.72, win: 42.3, beside: 43.05, sturdy: 43.6, chair6: 43.93, seatFirst: 44.76, then1: 45.51, oneHand: 45.73, then2: 46.51, fingertip: 47.02, then3: 47.33, nothing: 47.94, train: 49.36, twice: 50.34, week7: 50.8, chairStands: 50.96, calf: 51.94, raises: 52.34, slow: 53.14, trips: 53.58, floor7: 54.76, back7: 55.4, plain: 56.59, warning: 57.17, fallen: 58.17, head8: 59.16, back8: 59.43, neck8: 59.75, hip8: 60.0, cannot: 61.36, call: 62.23, emergency: 62.88, keepWarm: 64.51, wait8: 65.98, ifNot: 66.8, exercised: 67.85, doctor: 69.86, final: 72.3, factory: 73.56, settings: 73.95 };

// ------------------------------------------------------------------ the set (metres, floor at y = 0)
const W = {}; window.HFS_W = W;
const X = new THREE.Vector3(1, 0, 0), Y = new THREE.Vector3(0, 1, 0), Z = new THREE.Vector3(0, 0, 1);
const FB = { x: 0, z: 0.06 };                       // the floor spot, centre stage
const CH = { x: 0.58, seat: 0.46, z: -0.14 };       // the sturdy chair: seat centre, seat top
const BOARD = { x: -0.35, y: 1.36, z: -1.0 };       // the score board
const DIAL = { x: 1.06, y: 1.0, z: -0.8, R: 0.115 }; // the logo dial on its pedestal
const SIGN = { x: -0.66, z: 0.5, y: 0.88 };        // the warning sign, front left
const SOFA_ARM = { x: -0.62, top: 0.615, z: 0.0 };   // the sofa arm he grabs
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
const woodM = () => phys({ color: 0x24170f, roughness: 0.42, clearcoat: 0.5, roughnessMap: noiseTex(7, 256, 0.8, 1.0, 12) });
function printed(w, h, draw, opts = {}) { return new THREE.Mesh(new THREE.PlaneGeometry(w, h), phys({ map: canvasTex(Math.round(w * 4000), Math.round(h * 4000), draw), roughness: 0.6, transparent: true, ...opts })); }
function label(w, h, lines, { color = '#c9ccd2', size = 64, font = '"Geist Mono"', weight = 700, track = 4, align = 'center', bg = null } = {}) {
  return printed(w, h, (x, cw, ch) => { if (bg) { x.fillStyle = bg; x.fillRect(0, 0, cw, ch); } else x.clearRect(0, 0, cw, ch);
    const L = Array.isArray(lines) ? lines : [lines], lh = ch / L.length;
    L.forEach((s, i) => { const [str, sz, col] = Array.isArray(s) ? s : [s, size, color];
      txt(x, str, align === 'left' ? cw * 0.03 : cw / 2, lh * (i + 0.5) + 2, { font: `${weight} ${sz}px ${font}`, color: col, align, track, maxW: cw * 0.96 }); }); }, { depthWrite: false });
}

// ------------------------------------------------------------------ the sofa: low, soft looking, with one arm near the floor spot
function makeSofa(scene) {
  const g = new THREE.Group(); scene.add(g);
  const fab = phys({ color: 0x2c3242, roughness: 0.92, sheen: 0.5, sheenColor: new THREE.Color(0x5a6a8a) });
  const seat = new THREE.Mesh(new RoundedBoxGeometry(0.78, 0.22, 0.58, 3, 0.03), fab); seat.position.set(-0.98, 0.31, -0.04); g.add(seat);
  const base = new THREE.Mesh(new RoundedBoxGeometry(0.8, 0.2, 0.6, 3, 0.02), fab); base.position.set(-0.98, 0.1, -0.04); g.add(base);
  const back = new THREE.Mesh(new RoundedBoxGeometry(0.8, 0.5, 0.14, 3, 0.03), fab); back.position.set(-0.98, 0.62, -0.33); g.add(back);
  const armL = new THREE.Mesh(new RoundedBoxGeometry(0.12, 0.42, 0.6, 3, 0.03), fab); armL.position.set(-1.43, 0.4, -0.04); g.add(armL);
  const armR = new THREE.Mesh(new RoundedBoxGeometry(0.12, 0.42, 0.6, 3, 0.03), fab); armR.position.set(SOFA_ARM.x, 0.405, -0.04); g.add(armR);
  const cush = new THREE.Mesh(new RoundedBoxGeometry(0.34, 0.09, 0.5, 3, 0.03), fab); cush.position.set(-1.15, 0.455, -0.02); g.add(cush);
  const cush2 = cush.clone(); cush2.position.x = -0.8; g.add(cush2);
  shadows(g); g.traverse((o) => o.layers.enable(1));
  return g;
}

// ------------------------------------------------------------------ the score board: the test, the points, the bars
function makeBoard(scene) {
  const g = new THREE.Group(); g.position.set(BOARD.x, 0, BOARD.z); scene.add(g);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, BOARD.y, 16), black()); pole.position.y = BOARD.y / 2; g.add(pole);
  const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.19, 0.025, 40), black()); foot.position.y = 0.0125; g.add(foot);
  const back = new THREE.Mesh(new RoundedBoxGeometry(0.70, 0.56, 0.025, 3, 0.008), phys({ color: 0x1a1c20, roughness: 0.55, clearcoat: 0.3 })); back.position.set(0, BOARD.y, -0.015); g.add(back);
  const c = document.createElement('canvas'); c.width = 1200; c.height = 960; const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const face = new THREE.Mesh(new THREE.PlaneGeometry(0.66, 0.52), phys({ map: tex, roughness: 0.6 })); face.position.set(0, BOARD.y, 0.0); g.add(face);
  // the big digit, its own plane so it can pop as it flips
  const dc = document.createElement('canvas'); dc.width = 400; dc.height = 400; const dtex = new THREE.CanvasTexture(dc); dtex.colorSpace = THREE.SRGBColorSpace;
  const digit = new THREE.Mesh(new THREE.PlaneGeometry(0.17, 0.17), new THREE.MeshBasicMaterial({ map: dtex, transparent: true, depthWrite: false })); digit.position.set(0.19, BOARD.y + 0.08, 0.004); g.add(digit);
  // three bars for the survival line, grown in update
  const bars = [], bm = phys({ color: 0x67b3e6, roughness: 0.4, clearcoat: 0.5 });
  for (let k = 0; k < 3; k++) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.07, 1, 0.012), bm); b.position.set(-0.17 + k * 0.115, BOARD.y - 0.26, 0.004); b.visible = false; g.add(b); bars.push(b); }
  shadows(g); g.traverse((o) => o.layers.enable(1)); digit.castShadow = false;
  return { g, c, tex, dc, dtex, digit, bars, key: '', dkey: '' };
}
function drawDigit(B, n) { const s = String(n); if (s === B.dkey) return; B.dkey = s; const x = B.dc.getContext('2d'), w = B.dc.width, h = B.dc.height;
  x.clearRect(0, 0, w, h); txt(x, s, w / 2, h * 0.54, { font: '900 300px Archivo', color: '#eceef1' }); B.dtex.needsUpdate = true; }
function drawBoard(B, mode) {   // mode: 0 blank, 1 the test, 2 hand or knee, 3 low scores, 4 per point
  if (mode === B.key) return; B.key = mode; const x = B.c.getContext('2d'), w = B.c.width, h = B.c.height;
  x.fillStyle = '#101216'; x.fillRect(0, 0, w, h);
  if (mode >= 1) {
    txt(x, 'THE SITTING RISING TEST', w * 0.34, h * 0.11, { font: '800 56px Archivo', color: '#eceef1', track: 4 });
    txt(x, 'SIT ON THE FLOOR. STAND BACK UP.', w * 0.34, h * 0.215, { font: '700 40px "Geist Mono"', color: '#9aa0aa', track: 2 });
    txt(x, '2,002 ADULTS', w * 0.34, h * 0.325, { font: '700 54px "Geist Mono"', color: '#c9ccd2', track: 2 });
    txt(x, 'SCORE', w * 0.855, h * 0.13, { font: '700 44px "Geist Mono"', color: '#9aa0aa', track: 4 });
  }
  if (mode === 2) txt(x, 'EVERY HAND OR KNEE DOWN: ONE POINT GONE', w / 2, h * 0.62, { font: '700 54px "Geist Mono"', color: '#eceef1', track: 2, maxW: w * 0.92 });
  if (mode === 3) { txt(x, 'EVERY HAND OR KNEE DOWN: ONE POINT GONE', w / 2, h * 0.58, { font: '700 54px "Geist Mono"', color: '#eceef1', track: 2, maxW: w * 0.92 });
    txt(x, 'LOW SCORES WERE LINKED TO HIGHER DEATH RATES', w / 2, h * 0.7, { font: '700 54px "Geist Mono"', color: '#e2574c', track: 2, maxW: w * 0.92 }); }
  if (mode === 4) { txt(x, 'EACH EXTRA POINT', w * 0.3, h * 0.44, { font: '800 62px Archivo', color: '#eceef1', track: 2 });
    txt(x, '+21% IMPROVEMENT IN SURVIVAL', w * 0.3, h * 0.53, { font: '700 52px "Geist Mono"', color: '#67b3e6', track: 2 }); }
  B.tex.needsUpdate = true;
}

// ------------------------------------------------------------------ the sturdy chair
function makeChair(scene) {
  const g = new THREE.Group(); scene.add(g);
  const seat = new THREE.Mesh(new RoundedBoxGeometry(0.46, 0.04, 0.42, 3, 0.008), woodM()); seat.position.set(CH.x, CH.seat - 0.02, CH.z); g.add(seat);
  for (const [dx, dz] of [[-0.2, -0.18], [0.2, -0.18], [-0.2, 0.18], [0.2, 0.18]]) { const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.014, CH.seat - 0.04, 12), woodM()); leg.position.set(CH.x + dx, (CH.seat - 0.04) / 2, CH.z + dz); g.add(leg); }
  for (const dx of [-0.2, 0.2]) { const post = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.56, 12), woodM()); post.position.set(CH.x + dx, CH.seat + 0.28, CH.z - 0.19); g.add(post); }
  const rail = new THREE.Mesh(new RoundedBoxGeometry(0.46, 0.09, 0.03, 3, 0.008), woodM()); rail.position.set(CH.x, 1.0, CH.z - 0.19); g.add(rail);
  const mid = new THREE.Mesh(new RoundedBoxGeometry(0.46, 0.06, 0.025, 3, 0.008), woodM()); mid.position.set(CH.x, 0.8, CH.z - 0.19); g.add(mid);
  shadows(g); g.traverse((o) => o.layers.enable(1));
  return g;
}

// ------------------------------------------------------------------ the way back board, beside the chair
const WAY_ROWS = ['PUSH ON THE SEAT', 'ONE HAND', 'A FINGERTIP', 'NOTHING'];
function makeWay(scene) {
  const g = new THREE.Group(); g.position.set(0.08, 0, -0.55); g.rotation.y = -0.06; scene.add(g);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 1.02, 12), black()); pole.position.y = 0.51; g.add(pole);
  const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.02, 32), black()); foot.position.y = 0.01; g.add(foot);
  const back = new THREE.Mesh(new RoundedBoxGeometry(0.34, 0.3, 0.014, 3, 0.006), black()); back.position.set(0, 1.06, -0.008); g.add(back);
  const c = document.createElement('canvas'); c.width = 1000; c.height = 880; const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const card = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.28), phys({ map: tex, roughness: 0.6 })); card.position.set(0, 1.06, 0.0); g.add(card);
  shadows(g); g.traverse((o) => o.layers.enable(1));
  return { g, c, tex, key: '' };
}
function drawWay(Wy, ks, train) {
  const key = ks.map((k) => k.toFixed(2)).join() + train.toFixed(2); if (key === Wy.key) return; Wy.key = key;
  const x = Wy.c.getContext('2d'), w = Wy.c.width, h = Wy.c.height;
  x.fillStyle = '#f2efe8'; x.fillRect(0, 0, w, h); x.fillStyle = '#16181c'; x.fillRect(0, 0, w, h * 0.16);
  txt(x, 'THE WAY BACK', w / 2, h * 0.085, { font: '800 84px Archivo', color: '#f2efe8', track: 6 });
  WAY_ROWS.forEach((s, i) => { const y = h * (0.27 + i * 0.115), k = ks[i], bx = w * 0.07;
    x.globalAlpha = 0.3 + 0.7 * Math.min(1, k * 2); x.strokeStyle = '#26272b'; x.lineWidth = 8; x.strokeRect(bx, y - 30, 60, 60);
    if (k > 0) { x.strokeStyle = '#c62f2a'; x.lineWidth = 14; x.lineCap = 'round'; x.lineJoin = 'round'; x.beginPath(); x.moveTo(bx + 10, y + 2);
      const a = Math.min(1, k / 0.4), b = clamp01((k - 0.4) / 0.6); x.lineTo(bx + 10 + 16 * a, y + 2 + 18 * a); if (b > 0) x.lineTo(bx + 26 + 44 * b, y + 20 - 56 * b); x.stroke(); }
    txt(x, s, w * 0.17, y + 2, { font: '700 62px "Geist Mono"', color: '#26272b', align: 'left', track: 2, maxW: w * 0.78 }); });
  x.globalAlpha = train; x.fillStyle = '#16181c'; x.fillRect(w * 0.05, h * 0.76, w * 0.9, h * 0.18);
  txt(x, 'TRAIN TWICE A WEEK', w / 2, h * 0.815, { font: '800 58px Archivo', color: '#f2efe8', track: 3, maxW: w * 0.84 });
  txt(x, 'CHAIR STANDS · CALF RAISES · FLOOR TRIPS', w / 2, h * 0.885, { font: '700 40px "Geist Mono"', color: '#c9ccd2', track: 1, maxW: w * 0.86 });
  x.globalAlpha = 1; Wy.tex.needsUpdate = true;
}

// ------------------------------------------------------------------ the warning sign
const SIGN_ROWS = ['HEAD, BACK, NECK OR HIP HURT', 'YOU CANNOT GET UP', 'CALL FOR EMERGENCY HELP', 'KEEP WARM WHILE YOU WAIT'];
const SIGN_IN = T.fallen + 0.1, SIGN_OUT = T.doctor + 1.6;
function makeSign(scene) {
  const g = new THREE.Group(); g.position.set(SIGN.x, 0, SIGN.z); scene.add(g);
  const SW = 0.34, SH = 0.3, PH = SIGN.y - SH / 2 + 0.01;
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, PH, 16), black()); post.position.set(0, PH / 2, -0.03); g.add(post);
  const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 0.02, 40), black()); foot.position.set(0, 0.01, -0.03); g.add(foot);
  const back = new THREE.Mesh(new RoundedBoxGeometry(SW + 0.016, SH + 0.016, 0.014, 3, 0.006), black()); back.position.set(0, SIGN.y, -0.0085); g.add(back);
  const c = document.createElement('canvas'); c.width = 1300; c.height = 1150; const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const card = new THREE.Mesh(new THREE.PlaneGeometry(SW, SH), phys({ map: tex, roughness: 0.6 })); card.position.set(0, SIGN.y, 0.0); g.add(card);
  g.scale.setScalar(0.0001); shadows(g); g.traverse((o) => o.layers.enable(1));
  return { g, c, tex, key: '' };
}
function drawSign(Sg, ks, kd) {
  const key = ks.map((k) => k.toFixed(2)).join() + kd.toFixed(2); if (key === Sg.key) return; Sg.key = key;
  const x = Sg.c.getContext('2d'), w = Sg.c.width, h = Sg.c.height;
  x.fillStyle = '#f2efe8'; x.fillRect(0, 0, w, h); x.fillStyle = '#16181c'; x.fillRect(0, 0, w, h * 0.14);
  txt(x, 'AFTER A FALL', w / 2, h * 0.075, { font: '800 92px Archivo', color: '#f2efe8', track: 8, maxW: w * 0.9 });
  SIGN_ROWS.forEach((s, i) => { const y = h * (0.225 + i * 0.105), k = ks[i], bx = w * 0.06;
    x.globalAlpha = 0.3 + 0.7 * Math.min(1, k * 2); x.strokeStyle = '#26272b'; x.lineWidth = 8; x.strokeRect(bx, y - 30, 60, 60);
    if (k > 0) { x.strokeStyle = '#c62f2a'; x.lineWidth = 14; x.lineCap = 'round'; x.lineJoin = 'round'; x.beginPath(); x.moveTo(bx + 10, y + 2);
      const a = Math.min(1, k / 0.4), b = clamp01((k - 0.4) / 0.6); x.lineTo(bx + 10 + 16 * a, y + 2 + 18 * a); if (b > 0) x.lineTo(bx + 26 + 44 * b, y + 20 - 56 * b); x.stroke(); }
    txt(x, s, w * 0.155, y + 2, { font: '700 60px "Geist Mono"', color: '#26272b', align: 'left', track: 1, maxW: w * 0.8 }); });
  x.globalAlpha = kd; x.fillStyle = '#16181c'; x.fillRect(w * 0.04, h * 0.68, w * 0.92, h * 0.27);
  txt(x, 'NOT EXERCISED FOR A WHILE?', w / 2, h * 0.755, { font: '800 62px Archivo', color: '#f2efe8', track: 2, maxW: w * 0.88 });
  txt(x, 'TALK TO YOUR DOCTOR FIRST', w / 2, h * 0.86, { font: '800 62px Archivo', color: '#f2efe8', track: 2, maxW: w * 0.88 });
  x.globalAlpha = 1; Sg.tex.needsUpdate = true;
}

// ------------------------------------------------------------------ the logo dial on its pedestal
function makeDialStand(scene) {
  const g = new THREE.Group(); g.position.set(DIAL.x, 0, DIAL.z); scene.add(g);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.013, DIAL.y, 16), black()); pole.position.y = DIAL.y / 2; g.add(pole);
  const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.022, 40), black()); foot.position.y = 0.011; g.add(foot);
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.014, 96), phys({ color: 0x1c1e22, roughness: 0.5, clearcoat: 0.4 })); plate.rotation.x = Math.PI / 2; plate.position.set(0, DIAL.y, -0.008); g.add(plate);
  const logo = makeLogoRing(DIAL.R); logo.g.position.set(0, DIAL.y, 0.002); g.add(logo.g);
  shadows(g); g.traverse((o) => o.layers.enable(1));
  return { g, logo };
}

//@HANDS@

// ------------------------------------------------------------------ arm poses
const STAND_ARM = { dir: [0.1, -1, 0.0], twist: 0.15, elbow: 0.2, pro: 1.45, wf: 0.08 };
const SIT_ARM = { dir: [0.24, -1, 0.22], twist: 0.35, elbow: 0.62, pro: 1.3, wf: 0.1 };
const CLASP_ARM = { dir: [0.28, -0.92, 0.72], twist: 0.5, elbow: 0.55, pro: 1.3, wf: 0.25 };
const REACH_ARM = { dir: [0.3, -0.55, 0.75], twist: 0.2, elbow: 0.5, pro: 1.2, wf: 0.1 };
const FSIT_ARM = { dir: [0.25, -1, 0.05], twist: 0.3, elbow: 0.35, pro: 1.35, wf: 0.08 };
const GRIP_NAMES = new Set(['floorR', 'sofaR', 'seatR', 'seatL', 'backR']);
function boxSDF(cx, cy, cz, hx, hy, hz) { return (p) => { const dx = Math.abs(p.x - cx) - hx, dy = Math.abs(p.y - cy) - hy, dz = Math.abs(p.z - cz) - hz;
  return Math.hypot(Math.max(dx, 0), Math.max(dy, 0), Math.max(dz, 0)) + Math.min(Math.max(dx, Math.max(dy, dz)), 0); }; }

// ------------------------------------------------------------------ build
async function build(S, cfg) {
  const scene = S.scene;
  S.fog.near = 4; S.fog.far = 13;
  S.table.scale.set(5, 5, 1); S.tableMat.clearcoat = 0.1; S.tableMat.specularIntensity = 0.3;
  for (const m of [S.tableMat.map, S.tableMat.roughnessMap]) if (m) { m.wrapS = m.wrapT = THREE.RepeatWrapping; m.repeat.multiplyScalar(5); }
  const meshes = await loadAnatomy(skeletonKind());
  const R = W.rig = buildRig(meshes);
  W.body = new THREE.Group(); scene.add(W.body); W.body.add(R.root);
  for (const m of meshes) { m.castShadow = true; m.receiveShadow = true; m.layers.enable(1); }
  W.meshes = meshes; W.ground = Math.min(R.legs.Right.ground, R.legs.Left.ground);
  const hipB = new THREE.Box3(); for (const m of meshes) if (/hip bone/i.test(m.userData.name)) for (const v of worldVerts(m, 3)) hipB.expandByPoint(v);
  W.sitDrop = R.P0.y - hipB.min.y;
  W.ankleH = { Right: R.legs.Right.A.y - R.legs.Right.ground, Left: R.legs.Left.A.y - R.legs.Left.ground };
  W.wristL = makeWrist(R, 'Left', { pronate: true }); W.wristR = makeWrist(R, 'Right', { pronate: true });
  W.handL = rigHand(R, 'Left', W.wristL); W.handR = rigHand(R, 'Right', W.wristR); W.handL.wr = W.wristL; W.handR.wr = W.wristR;
  // ---- the set
  W.sofa = makeSofa(scene); W.board = makeBoard(scene); W.chair = makeChair(scene); W.way = makeWay(scene); W.sign = makeSign(scene); W.dial = makeDialStand(scene);
  // ---- pose constants (body.position.y for each base pose; pelvis world height = P0.y + py)
  const P0y = R.P0.y;
  const GY = -W.ground;                                   // standing
  const FY = W.sitDrop + 0.004 - P0y;                     // sitting on the floor
  const SQY = 0.47 - P0y;                                 // a deep squat
  const KNY = 0.56 - P0y;                                 // half kneeling
  const CY = CH.seat + W.sitDrop + 0.003 - P0y;           // sitting on the chair
  const AH = W.ankleH.Right;
  const F = {
    standFB: { base: [FB.x, FB.z], py: GY, fR: [FB.x - 0.11, AH, FB.z + 0.02], fL: [FB.x + 0.11, AH, FB.z + 0.02], fpR: 0, fpL: 0, fyR: 0, fyL: 0, kfR: [0, 0, 1], kfL: [0, 0, 1], spine: [0, -0.02, 0.01], armR: 'stand', armL: 'stand', curlR: 0.3, curlL: 0.3 },
    floorFB: { base: [FB.x, FB.z], py: FY, fR: [FB.x - 0.15, AH, FB.z + 0.4], fL: [FB.x + 0.15, AH, FB.z + 0.4], fpR: 0, fpL: 0, fyR: 0, fyL: 0, kfR: [-0.1, 1, 0.35], kfL: [0.1, 1, 0.35], spine: [0, 0.05, 0.03], armR: 'sit', armL: 'sit', curlR: 0.12, curlL: 0.3 },
    squatFB: { base: [FB.x, FB.z], py: SQY, fR: [FB.x - 0.12, AH, FB.z + 0.05], fL: [FB.x + 0.12, AH, FB.z + 0.05], fpR: 0, fpL: 0, fyR: 0, fyL: 0, kfR: [0, 0, 1], kfL: [0, 0, 1], spine: [0.08, 0.3, 0.1], armR: 'reach', armL: 'reach', curlR: 0.25, curlL: 0.25 },
  };
  F.floorSlump = { ...F.floorFB, spine: [0.05, 0.34, 0.18] };
  F.floorHand = { ...F.floorFB, spine: [0.04, 0.22, 0.1], armR: 'floorR' };
  F.kneelFB = { base: [FB.x, FB.z + 0.02], py: KNY, fR: [FB.x - 0.13, 0.11, FB.z - 0.3], fL: [FB.x + 0.13, AH, FB.z + 0.34], fpR: -1.15, fpL: 0, fyR: 0, fyL: 0, kfR: [-0.15, 0, -1], kfL: [0, 1, 0], spine: [0.04, 0.16, 0.06], armR: 'sit', armL: 'sit', curlR: 0.15, curlL: 0.3 };
  F.kneelSofa = { ...F.kneelFB, armR: 'sofaR', curlR: 0.55 };
  F.standClasp = { ...F.standFB, armR: 'clasp', armL: 'clasp', curlR: 0.3, curlL: 0.5 };
  F.floorClasp = { ...F.floorFB, armR: 'clasp', armL: 'clasp', curlR: 0.5, curlL: 0.5 };
  const CHF = { fR: [CH.x - 0.11, AH, 0.3], fL: [CH.x + 0.11, AH, 0.3] };
  F.chairSit = { base: [CH.x, CH.z], py: CY, ...CHF, fpR: 0, fpL: 0, fyR: 0, fyL: 0, kfR: [0, 0, 1], kfL: [0, 0, 1], spine: [0.01, 0.08, 0.04], armR: 'seatR', armL: 'seatL', curlR: 0.45, curlL: 0.45 };
  F.chairStand = { base: [CH.x, 0.02], py: GY, ...CHF, fpR: 0, fpL: 0, fyR: 0, fyL: 0, kfR: [0, 0, 1], kfL: [0, 0, 1], spine: [0, -0.02, 0.01], armR: 'stand', armL: 'stand', curlR: 0.3, curlL: 0.3 };
  F.calfStand = { base: [0.02, 0.02], py: GY, fR: [-0.09, AH, 0.08], fL: [0.13, AH, 0.08], fpR: 0, fpL: 0, fyR: 0, fyL: 0, kfR: [0, 0, 1], kfL: [0, 0, 1], spine: [0, -0.02, 0.01], armR: 'stand', armL: 'stand', curlR: 0.3, curlL: 0.3 };
  F.standC = { ...F.calfStand, armR: 'stand', curlR: 0.3 };
  F.squatC = { base: [0.02, 0.02], py: SQY, fR: [-0.11, AH, 0.11], fL: [0.15, AH, 0.11], fpR: 0, fpL: 0, fyR: 0, fyL: 0, kfR: [-0.3, 0, 1], kfL: [0.3, 0, 1], spine: [0.08, 0.3, 0.1], armR: 'reach', armL: 'reach', curlR: 0.25, curlL: 0.25 };
  F.floorC = { base: [0.02, 0.02], py: FY, fR: [-0.13, AH, 0.44], fL: [0.17, AH, 0.44], fpR: 0, fpL: 0, fyR: 0, fyL: 0, kfR: [-0.1, 1, 0.35], kfL: [0.1, 1, 0.35], spine: [0, 0.05, 0.03], armR: 'sit', armL: 'sit', curlR: 0.12, curlL: 0.3 };
  W.F = F;
  // ---- solved arm poses, each solved in the body pose where it is used
  const POSES = { stand: STAND_ARM, sit: SIT_ARM, clasp: CLASP_ARM, reach: REACH_ARM, fsit: FSIT_ARM, liftR: { dir: [0.35, -0.25, 0.55], twist: 0.3, elbow: 0.5, pro: 1.3, wf: 0.1 } };
  W.POSES = POSES;
  const solveIn = (P, Side, H, at, aims, extra, init, starts) => { applyPose(P, { Right: STAND_ARM, Left: STAND_ARM }); return solveHand(R, Side, H, at, init || { dir: [0.5, -0.8, 0.3], twist: 0.2, elbow: 0.8 }, aims, extra, starts); };
  const palmDown = (H, fdir) => [{ v: H.n, to: new THREE.Vector3(0, -1, 0), w: 0.55 }, { v: H.fdir, to: fdir, w: 0.25 }];
  POSES.floorR = solveIn(F.floorFB, 'Right', W.handR, new THREE.Vector3(FB.x - 0.32, 0.02, FB.z + 0.28), palmDown(W.handR, new THREE.Vector3(0.2, 0, 1).normalize()), () => 2 * handGap(W.handR, (q) => q.y, { palmOnly: true }).E, { dir: [0.3, -1, 0.35], twist: 0.4, elbow: 0.25, pro: 1.35 }, [{ dir: [0.3, -1, 0.35], twist: 0.4, elbow: 0.25, pro: 1.35 }, { dir: [0.5, -0.8, 0.3], twist: 0.2, elbow: 0.8 }, { dir: [0.1, -1, 0.15], twist: 0.2, elbow: 0.3 }]);
  POSES.floorR.fit = W.handR.fit((p) => p.y, { need: 0.004, kmin: 0.05, kmax: 0.9, tmin: -0.8 });
  POSES.sofaR = solveIn(F.kneelFB, 'Right', W.handR, new THREE.Vector3(SOFA_ARM.x + 0.01, SOFA_ARM.top + 0.012, SOFA_ARM.z), palmDown(W.handR, new THREE.Vector3(1, 0, 0.15).normalize()));
  POSES.sofaR.fit = W.handR.fit(boxSDF(SOFA_ARM.x, SOFA_ARM.top - 0.045, -0.04, 0.06, 0.045, 0.3), { need: 0.004, kmin: 0.05, kmax: 0.7 });
  POSES.seatR = solveIn(F.chairSit, 'Right', W.handR, new THREE.Vector3(CH.x - 0.185, CH.seat + 0.012, 0.02), palmDown(W.handR, new THREE.Vector3(0, 0, 1)));
  POSES.seatR.fit = W.handR.fit((p) => (Math.abs(p.x - CH.x) < 0.23 && p.z > -0.35 && p.z < 0.07 ? p.y - CH.seat : 9), { need: 0.004, kmin: 0.05, kmax: 0.7 });
  POSES.seatL = solveIn(F.chairSit, 'Left', W.handL, new THREE.Vector3(CH.x + 0.185, CH.seat + 0.012, 0.02), palmDown(W.handL, new THREE.Vector3(0, 0, 1)));
  POSES.seatL.fit = W.handL.fit((p) => (Math.abs(p.x - CH.x) < 0.23 && p.z > -0.35 && p.z < 0.07 ? p.y - CH.seat : 9), { need: 0.004, kmin: 0.05, kmax: 0.7 });
  POSES.backR = solveIn(F.calfStand, 'Right', W.handR, new THREE.Vector3(CH.x - 0.21, 1.045 + 0.012, CH.z - 0.19), palmDown(W.handR, new THREE.Vector3(0, 0, -1)));
  POSES.backR.fit = W.handR.fit(boxSDF(CH.x - 0.21, 1.0, CH.z - 0.19, 0.05, 0.045, 0.015), { need: 0.004, kmin: 0.05, kmax: 0.7 });
  // ---- the pose keys over time (what the body is doing, beat by beat)
  const K = (t, P) => ({ t, ...P });
  W.keys = [
    K(-1, F.floorSlump), K(T.hand1 - 0.5, F.floorSlump), K(T.hand1 + 0.35, F.floorHand), K(T.knee1 + 0.5, F.kneelFB), K(T.prayer - 0.2, { ...F.kneelFB, armR: 'liftR', curlR: 0.2 }), K(T.prayer + 0.3, F.kneelSofa),
    K(T.prayer + 1.25, { ...F.standFB, armR: 'liftR', curlR: 0.08 }), K(T.haveNot - 0.4, F.standFB), K(T.basic + 0.6, F.standFB),
    K(T.sit2 + 0.5, F.squatFB), K(T.strength - 0.3, F.floorClasp), K(T.flexibility + 0.9, F.floorClasp),
    K(T.sat3 + 0.4, F.squatFB), K(T.rose + 0.5, F.standClasp), K(T.every - 0.3, F.standClasp),
    K(T.hand2 + 0.3, { ...F.squatFB, armR: 'floorR', curlR: 0.12 }), K(T.cost + 0.55, F.floorHand), K(T.low + 0.7, F.floorFB),
    K(T.linked4 + 0.5, F.kneelFB), K(T.death + 0.75, F.standFB), K(T.win - 0.9, F.standFB),
    K(T.win - 0.25, F.chairStand), K(T.win + 0.45, F.chairSit), K(T.seatFirst + 0.95, F.chairStand),
    K(T.oneHand + 0.75, { ...F.chairSit, armR: 'seatR', armL: 'sit', curlL: 0.3 }), K(T.fingertip + 0.35, { ...F.chairStand, armL: 'sit' }),
    K(T.then3 + 0.62, { ...F.chairSit, armR: 'seatR', armL: 'sit', curlR: 0.12, curlL: 0.3 }), K(T.nothing + 0.85, { ...F.chairStand, armL: 'sit' }),
    K(T.train + 0.15, { ...F.chairSit, armR: 'clasp', armL: 'clasp', curlR: 0.5, curlL: 0.5 }), K(T.twice + 0.55, { ...F.chairStand, armR: 'clasp', armL: 'clasp', curlR: 0.1, curlL: 0.5 }),
    K(T.calf - 0.5, { ...F.chairStand, armR: 'clasp', armL: 'clasp', curlR: 0.1, curlL: 0.5 }),
    K(T.calf + 0.5, F.calfStand), K(T.slow + 0.15, F.calfStand),
    K(T.trips + 0.5, F.squatC), K(T.floor7 + 0.7, F.floorC), K(T.back7 + 1.05, F.standC),
    K(T.plain, F.standC), K(T.end, F.standC),
  ];
  // ---- the factory stamp, on the outer face of the right thigh bone (film 3's place)
  applyPose(F.standFB, { Right: STAND_ARM, Left: STAND_ARM }); W.body.updateMatrixWorld(true);
  { const femur = R.byName.get('Right femur');
    if (femur) { W.stampSpot = stampSpot(femur, { from: [0.35, 1.0, FB.z + 0.72], dir: [-0.54, -0.1, -0.83], spread: 0.004 });
      if (W.stampSpot) W.stamp = stamp(femur, { canvas: stampCanvas(['HUMAN FACTORY', 'SETTINGS'], '', { frame: true }), center: W.stampSpot.center, normal: W.stampSpot.normal, up: [0, 1, 0], width: 0.13, depth: 0.03, opacity: 0.5 }); } }
  // ---- light
  W.key = spot(scene, { color: 0xdfe6ff, pos: new THREE.Vector3(1.3, 3.0, 2.2), target: new THREE.Vector3(0, 1.0, 0), angle: 0.45, penumbra: 0.8, shadow: true, size: cfg.shadow ?? 1024 }); W.key.shadow.camera.far = 8;
  W.rim = spot(scene, { color: 0xa9c4ff, pos: new THREE.Vector3(-1.2, 2.6, -0.9), target: new THREE.Vector3(0, 1.1, 0), angle: 0.5, penumbra: 0.9 });
  W.fill = spot(scene, { color: 0xc8d6ff, pos: new THREE.Vector3(-1.0, 1.4, 2.2), target: new THREE.Vector3(0, 0.9, 0.2), angle: 0.55, penumbra: 1 });
  const sp = (x, y, z, tx, ty, tz, a = 0.3, I = 8) => { const L = spot(scene, { color: 0xfff1d8, pos: new THREE.Vector3(x, y, z), target: new THREE.Vector3(tx, ty, tz), angle: a, penumbra: 0.7 }); L.userData.I = I; return L; };
  W.lights = [sp(BOARD.x + 0.2, 2.6, 1.2, BOARD.x, BOARD.y, BOARD.z, 0.3, 6), sp(CH.x + 0.2, 2.4, 1.3, CH.x, 0.7, CH.z, 0.32), sp(SIGN.x + 0.25, 2.2, 1.7, SIGN.x, SIGN.y, SIGN.z, 0.22, 7), sp(-0.85, 2.2, 1.4, -0.85, 0.45, -0.04, 0.34, 6), sp(DIAL.x + 0.1, 1.7, DIAL.z + 0.9, DIAL.x, DIAL.y, DIAL.z, 0.2, 5)];
  W.auditSolids = [['sofa', W.sofa], ['chair', W.chair], ['score board', W.board.g], ['way board', W.way.g], ['sign', W.sign.g], ['dial', W.dial.g]];
  return { stamp: W.stampSpot && W.stampSpot.center, solves: { floorR: POSES.floorR.err, sofaR: POSES.sofaR.err, seatR: POSES.seatR.err, seatL: POSES.seatL.err, backR: POSES.backR.err } };
}

// ------------------------------------------------------------------ posing the body from the keys
const _fq = new THREE.Quaternion(), _fe = new THREE.Euler();
function applyPose(P, arms) {
  const R = W.rig;
  W.body.quaternion.identity(); W.body.position.set(P.base[0], P.py, P.base[1] - R.P0.z);
  R.pelvis.position.copy(R.P0); R.pelvis.rotation.set(0, 0, 0);
  bendSpine(R.seg, { lum: P.spine[0], tho: P.spine[1], cer: P.spine[2] });
  W.body.updateMatrixWorld(true);
  for (const Side of ['Right', 'Left']) { const f = Side === 'Right' ? P.fR : P.fL, fp = Side === 'Right' ? P.fpR : P.fpL, fy = Side === 'Right' ? P.fyR : P.fyL, kf = Side === 'Right' ? P.kfR : P.kfL;
    _fq.setFromEuler(_fe.set(fp, fy, 0, 'YXZ'));
    legIK(R, Side, new THREE.Vector3(f[0], f[1], f[2]), _fq, new THREE.Vector3(kf[0], kf[1], kf[2])); }
  if (arms) for (const Side of ['Right', 'Left']) { const p = arms[Side]; poseArm(R.arms[Side], p); setWrist(Side === 'Left' ? W.wristL : W.wristR, p); }
  W.body.updateMatrixWorld(true);
}
const mixA = (a, b, k) => (k <= 0 ? a : k >= 1 ? b : mixArm(a, b, k));
function evalPose(t) {
  const KS = W.keys; let i = 0; while (i < KS.length - 2 && t >= KS[i + 1].t) i++;
  const A = KS[i], B = KS[i + 1], k = s5(A.t, B.t, t), L = (a, b) => lerp(a, b, k), LA = (a, b) => a.map((v, j) => lerp(v, b[j], k));
  const moved = (a, b) => Math.hypot(b[0] - a[0], b[2] - a[2]) > 0.02;
  const lift = (a, b) => (moved(a, b) ? 0.035 * Math.sin(Math.PI * k) : 0);
  const P = { base: LA(A.base, B.base), py: L(A.py, B.py), spine: LA(A.spine, B.spine),
    fR: LA(A.fR, B.fR), fL: LA(A.fL, B.fL), fpR: L(A.fpR, B.fpR), fpL: L(A.fpL, B.fpL), fyR: L(A.fyR, B.fyR), fyL: L(A.fyL, B.fyL), kfR: LA(A.kfR, B.kfR), kfL: LA(A.kfL, B.kfL),
    curlR: L(A.curlR, B.curlR), curlL: L(A.curlL, B.curlL) };
  P.fR[1] += lift(A.fR, B.fR); P.fL[1] += lift(A.fL, B.fL);
  const arms = {}, grips = {};
  for (const Side of ['Right', 'Left']) { const na = Side === 'Right' ? A.armR : A.armL, nb = Side === 'Right' ? B.armR : B.armL;
    arms[Side] = na === nb ? W.POSES[na] : mixA(W.POSES[na], W.POSES[nb], k);
    grips[Side] = GRIP_NAMES.has(nb) && na !== nb ? { name: nb, w: k } : GRIP_NAMES.has(na) && na !== nb ? { name: na, w: 1 - k } : GRIP_NAMES.has(na) ? { name: na, w: 1 } : null; }
  return { P, arms, grips };
}
function poseBody(t) {
  const { P, arms, grips } = evalPose(t);
  // calf raises: the heels lift three times, slow cosine bumps, while he holds the chair back
  { const b = ss(T.calf + 0.6, T.calf + 1.3, t) * (1 - ss(T.slow + 0.05, T.slow + 0.75, t)); if (b > 0.001) { P.py += 0.05 * b; P.fR[1] += 0.05 * b; P.fL[1] += 0.05 * b; P.fR[2] -= 0.025 * b; P.fL[2] -= 0.025 * b; P.fpR = -0.55 * b; P.fpL = -0.55 * b; } }
  // a wobble as he first gets up, settling as he stands tall
  if (t > T.haveNot - 0.4 && t < T.party + 1.2) { const d = Math.exp(-(t - (T.haveNot - 0.4)) * 0.9); P.base[0] += 0.009 * d * Math.sin((t - T.haveNot) * 8.5); }
  applyPose(P, arms);
  for (const Side of ['Right', 'Left']) { const H = Side === 'Left' ? W.handL : W.handR, g = grips[Side], curl = Side === 'Right' ? P.curlR : P.curlL, pose = W.POSES[g ? g.name : 'stand'];
    if (g && pose.fit) gripCurl(H, pose.fit, g.w, curl); else H.curl(curl); }
  W.baseX = P.base[0];
}

// ------------------------------------------------------------------ the camera: one path, no cuts
let CAM = null;
function buildCam() {
  const DC = V3(DIAL.x, DIAL.y, DIAL.z + 0.002);
  const MAST = { p: V3(0.05, 1.65, 3.62), l: V3(0.0, 1.3, 0.0) };
  const HOOK = { p: V3(-0.12, 1.62, 3.0), l: V3(-0.05, 1.14, 0.02) };
  const HOOKC = { p: V3(-0.32, 1.18, 2.15), l: V3(-0.28, 0.68, 0.0) };
  const BOARDV = { p: V3(BOARD.x, 2.05, BOARD.z + 2.6), l: V3(BOARD.x, 1.28, BOARD.z) };
  const CHAIRV = { p: V3(0.58, 1.62, 3.5), l: V3(0.58, 1.34, -0.02) };
  const CALFV = { p: V3(0.3, 1.68, 3.35), l: V3(0.27, 1.38, 0.0) };
  const SIGNV = { p: V3(-0.55, 1.15, 1.9), l: V3(SIGN.x, 0.86, SIGN.z) };
  return camTrack([
    { t: -3.0, p: V3(-0.12, 1.42, 3.1), l: HOOK.l, fov: 38 },
    { t: 0.0, p: HOOK.p, l: HOOK.l, fov: 38, tens: 0.5 },
    { t: T.up1, p: HOOK.p, l: HOOK.l, fov: 38, stop: true },
    { t: T.prayer + 0.3, p: HOOKC.p, l: HOOKC.l, fov: 36, stop: true },
    { t: T.haveNot - 0.1, p: HOOKC.p, l: HOOKC.l, fov: 36, stop: true },
    { t: T.party + 0.9, p: MAST.p, l: MAST.l, fov: 38, stop: true },
    { t: T.flexibility + 0.6, p: MAST.p, l: MAST.l, fov: 38, stop: true },
    { t: T.researchers + 0.85, p: BOARDV.p, l: BOARDV.l, fov: 34, stop: true },
    { t: T.sat3 + 0.2, p: BOARDV.p, l: BOARDV.l, fov: 34, stop: true },
    { t: T.rose + 0.6, p: MAST.p, l: MAST.l, fov: 38, stop: true },
    { t: T.each + 0.8, p: MAST.p, l: MAST.l, fov: 38, stop: true },
    { t: T.survival + 0.55, p: BOARDV.p, l: BOARDV.l, fov: 34, stop: true },
    { t: T.win + 0.75, p: CHAIRV.p, l: CHAIRV.l, fov: 37, stop: true },
    { t: T.train + 0.4, p: CHAIRV.p, l: CHAIRV.l, fov: 37, stop: true },
    { t: T.calf + 0.6, p: CALFV.p, l: CALFV.l, fov: 37, stop: true },
    { t: T.slow + 0.5, p: CALFV.p, l: CALFV.l, fov: 37, stop: true },
    { t: T.trips + 0.7, p: MAST.p, l: MAST.l, fov: 38, stop: true },
    { t: T.plain + 0.4, p: MAST.p, l: MAST.l, fov: 38, stop: true },
    { t: T.fallen + 0.9, p: SIGNV.p, l: SIGNV.l, fov: 36, stop: true },
    { t: T.doctor + 1.0, p: SIGNV.p, l: SIGNV.l, fov: 36, stop: true },
    { t: T.final + 1.1, p: V3(DIAL.x - 0.1, DIAL.y + 0.12, DIAL.z + 0.95), l: DC, fov: 32 },
    { t: T.logo, p: V3(DC[0], DC[1], DC[2] + DIAL.R / 0.115), l: DC, fov: 30, stop: true },
  ]);
}
const CAM_MOVES = [[T.up1, T.prayer + 0.3], [T.haveNot - 0.1, T.party + 0.9], [T.flexibility + 0.6, T.researchers + 0.85], [T.sat3 + 0.2, T.rose + 0.6],
  [T.each + 0.8, T.survival + 0.55], [T.survival + 0.55, T.win + 0.75], [T.train + 0.4, T.calf + 0.6], [T.slow + 0.5, T.trips + 0.7],
  [T.plain + 0.4, T.fallen + 0.9], [T.doctor + 1.0, T.final + 1.1], [T.final + 1.1, T.logo]];
function camPose(S, t) {
  const v = S.cfg.view; if (v && typeof v === 'object') return v;
  if (!CAM) CAM = buildCam();
  if (t <= T.logo) return CAM(t);
  const Q = CAM(T.logo), k = ss(T.logo, T.end, t), d = [Q.p[0] - Q.l[0], Q.p[1] - Q.l[1], Q.p[2] - Q.l[2]];
  return { p: [Q.l[0] + d[0] * (1 + 0.07 * k), Q.l[1] + d[1] * (1 + 0.07 * k), Q.l[2] + d[2] * (1 + 0.07 * k)], l: Q.l, fov: 30 };
}
W.camAt = (t) => camPose({ cfg: {} }, t);
W.prepare = () => { if (!CAM) CAM = buildCam(); };
function focusAt(S, t, P) { return Math.hypot(P.p[0] - P.l[0], P.p[1] - P.l[1], P.p[2] - P.l[2]); }

// ------------------------------------------------------------------ the score over time
function scoreAt(t) {
  let n = 10;
  if (t > T.cost + 0.45) n = 9;
  if (t > T.linked4 + 0.4) n = 8;
  if (t > T.extra + 0.1) n = 9;
  if (t > T.point5 + 0.25) n = 10;
  return n;
}
function boardMode(t) { return t >= T.plain - 0.3 ? 0 : t < T.researchers ? 0 : t < T.hand2 ? 1 : t < T.linked4 ? 2 : t < T.each ? 3 : 4; }

// ------------------------------------------------------------------ one moment of the film
function update(S, t) {
  const scene = S.scene, endDark = ss(T.final - 0.3, T.logo - 0.3, t);
  poseBody(t);
  // ---- the score board: its face, the digit popping as it flips, the bars rising point by point
  { const B = W.board; drawBoard(B, boardMode(t)); drawDigit(B, scoreAt(t));
    B.digit.visible = t > T.researchers && t < T.plain - 0.3;
    const flip = Math.max(pulse(t, T.cost + 0.45, T.cost + 0.85, 0.18), pulse(t, T.linked4 + 0.4, T.linked4 + 0.8, 0.18), pulse(t, T.extra + 0.1, T.extra + 0.5, 0.18), pulse(t, T.point5 + 0.25, T.point5 + 0.65, 0.18));
    B.digit.scale.setScalar(1 + 0.25 * flip);
    const barH = [0.07, 0.12, 0.17];
    B.bars.forEach((b, k) => { const a = [T.extra, T.point5, T.twentyOne][k], h = barH[k] * s5(a, a + 0.55, t); b.visible = h > 0.002 && t > T.each; b.scale.y = Math.max(0.001, h); b.position.y = BOARD.y - 0.26 + h / 2; }); }
  // ---- the way back board: a tick for each rung of the ladder, then the training line
  if (t > T.win - 0.5) drawWay(W.way, [T.seatFirst, T.oneHand, T.fingertip, T.nothing].map((a) => s5(a - 0.05, a + 0.35, t)), s5(T.twice - 0.05, T.twice + 0.3, t));
  // ---- the warning sign springs up, ticks its rows as they are said, then the doctor line; it goes before the end
  { const Sg = W.sign, inK = outBack(clamp01((t - SIGN_IN) / 0.35), 1.5), outK = s5(SIGN_OUT, SIGN_OUT + 0.3, t);
    Sg.g.scale.setScalar(Math.max(0.0001, inK * (1 - outK)));
    if (t > SIGN_IN - 0.1 && t < SIGN_OUT + 0.5) drawSign(Sg, [Math.max(s5(T.head8 - 0.05, T.head8 + 0.3, t), s5(T.hip8 - 0.05, T.hip8 + 0.35, t)), s5(T.cannot - 0.05, T.cannot + 0.35, t), s5(T.call - 0.05, T.call + 0.35, t), s5(T.keepWarm - 0.05, T.keepWarm + 0.35, t)], s5(T.doctor - 0.05, T.doctor + 0.3, t)); }
  // ---- the dial becomes the logo
  { const lk = s5(T.final + 0.1, T.logo - 0.25, t); W.dial.logo.set({ weight: lk, white: lk, hours: 0, hand: ss(T.logo - 0.4, T.logo - 0.15, t), handScale: outBack(clamp01((t - (T.logo - 0.4)) / 0.35), 1.8) }); }
  // ---- light: the key follows the body; each prop keeps its own spot
  const fig = 1 - endDark, kx = W.baseX || 0;
  W.key.position.set(kx + 1.3, 3.0, 2.2); W.key.target.position.set(kx, 1.0, 0.0);
  W.rim.position.set(kx - 1.2, 2.6, -0.9); W.rim.target.position.set(kx, 1.1, 0);
  W.fill.position.set(kx - 1.0, 1.4, 2.2); W.fill.target.position.set(kx, 0.9, 0.2);
  W.key.intensity = 11 * fig; W.rim.intensity = 4 * fig; W.fill.intensity = 1.0 * fig;
  for (const L of W.lights) L.intensity = L.userData.I * fig;
  S.tableMat.color.setScalar(0.3 * (1 - endDark * 0.9)); scene.environmentIntensity = 0.12 * (1 - endDark * 0.7); S.reflAmt = 0.5 * (1 - endDark);
}

// ------------------------------------------------------------------ the words on screen
const CAPS = [
  { t0: T.you, t1: T.down1 - 0.05, top: 268, size: 78, html: 'You treat the floor<br>like <em>lava</em> now:' },
  { t0: T.down1, t1: T.prayer - 0.05, top: 268, size: 76, html: 'down is easy, but up<br>needs a <em>hand</em>, a <em>knee</em>,' },
  { t0: T.prayer, t1: T.haveNot - 0.05, top: 268, size: 78, html: 'and a small <em>prayer</em><br>to the sofa.' },
  { t0: T.haveNot, t1: T.basic - 0.05, top: 268, size: 76, html: 'You have not lost<br>a <em>party trick</em>.' },
  { t0: T.basic, t1: T.body - 0.1, top: 268, size: 78, html: 'You have lost<br>a <em>basic move</em>.' },
  { t0: T.body, t1: T.onePiece - 0.05, top: 268, size: 74, html: 'Your body was built to<br><em>sit on the floor</em> and<br>stand back up' },
  { t0: T.onePiece, t1: T.researchers - 0.1, top: 268, size: 74, html: 'in <em>one piece</em>, using<br>strength, balance and<br>flexibility together.' },
  { t0: T.researchers, t1: T.twoThousand - 0.05, top: 268, size: 76, html: 'Researchers <em>scored</em><br>exactly that move in' },
  { t0: T.twoThousand, t1: T.every - 0.1, top: 268, size: 76, html: '<em>2,002 adults</em> who sat<br>on the floor and<br>rose again.' },
  { t0: T.every, t1: T.low - 0.05, top: 268, size: 76, html: '<em>Every hand or knee</em><br>cost a point,' },
  { t0: T.low, t1: T.each - 0.1, top: 268, size: 74, html: 'and <em>low scores</em> were<br>linked to <em>higher</em><br><em>death rates</em> afterwards.' },
  { t0: T.each, t1: T.twentyOne - 0.05, top: 268, size: 76, html: '<em>Each extra point</em> was<br>linked to a' },
  { t0: T.twentyOne, t1: T.so6 - 0.1, top: 268, size: 76, html: '<em>21% improvement</em><br>in survival.' },
  { t0: T.so6, t1: T.seatFirst - 0.05, top: 268, size: 76, html: 'So <em>win the points back</em><br>beside a sturdy chair:' },
  { t0: T.seatFirst, t1: T.train - 0.1, top: 268, size: 76, html: 'its <em>seat</em> first, then<br><em>one hand</em>, then a<br><em>fingertip</em>, then <em>nothing</em>.' },
  { t0: T.train, t1: T.chairStands - 0.05, top: 268, size: 78, html: '<em>Train the parts</em><br>twice a week:' },
  { t0: T.chairStands, t1: T.plain - 0.1, top: 268, size: 74, html: '<em>chair stands</em>, <em>calf raises</em>,<br>and <em>slow trips</em> down<br>to the floor and back.' },
  { t0: T.plain, t1: T.cannot - 0.05, top: 268, size: 76, html: '<em>Plain warning:</em> if you<br>have fallen, hurt your<br>head, back, neck or hip,' },
  { t0: T.cannot, t1: T.keepWarm - 0.05, top: 268, size: 76, html: 'or you <em>cannot get up</em>,<br>call for <em>emergency help</em>' },
  { t0: T.keepWarm, t1: T.ifNot - 0.05, top: 268, size: 78, html: 'and <em>keep warm</em><br>while you wait.' },
  { t0: T.ifNot, t1: T.final - 0.1, top: 268, size: 74, html: 'If you have not exercised<br>for a while, talk to<br>your <em>doctor</em> first.' },
  { t0: T.final, t1: 99, top: 360, size: 92, html: 'Let’s get you back to<br><em>factory settings.</em>' },
];
function overlayInit(S) {}
function overlay(S, t) {
  const c = new THREE.Vector3(DIAL.x, DIAL.y, DIAL.z + 0.002);
  logoEnd(S, t, { t0: T.logo, center: c, edge: c.clone().add(new THREE.Vector3(0, DIAL.R, 0)) });
}

// ------------------------------------------------------------------ the timing table the sound reads (timing19.json)
W.timing = { handDown: T.hand1 + 0.35, kneeDown: T.knee1 + 0.5, sofaGrab: T.prayer + 0.3, upFirst: T.haveNot - 0.4, descend1: [T.sit2 + 0.5, T.strength - 0.3], rise1: [T.sat3 + 0.4, T.rose + 0.5],
  handDown2: T.hand2 + 0.3, flips: [T.cost + 0.45, T.linked4 + 0.4], scoreUp: [T.extra + 0.1, T.point5 + 0.25], bars: [T.extra, T.point5, T.twentyOne],
  seat: T.seatFirst, stands: [T.seatFirst + 0.95, T.fingertip + 0.35, T.nothing + 0.85, T.twice + 0.55], ticks: [T.seatFirst, T.oneHand, T.fingertip, T.nothing], train: T.twice,
  calf: [T.calf + 0.6, 1.35, 1], trip: [T.trips + 0.6, T.back7 + 1.1], sign: [SIGN_IN, SIGN_OUT], checks: [T.hip8, T.cannot, T.call, T.keepWarm], doctor: T.doctor, logo: T.logo, moves: CAM_MOVES };

makeFilm({
  T, caps: CAPS, subs: [], build, update, pose: camPose, overlay, overlayInit, focus: focusAt,
  shade: [[T.hand1 - 0.6, T.party + 0.95], [T.sat3 + 0.1, T.rose + 0.65], [T.flexibility + 0.6, T.researchers + 0.85], [T.survival + 0.5, T.win + 0.8], [T.plain + 0.35, T.fallen + 0.95], [T.doctor + 1.0, T.final + 1.1]],
  stage: { bg: 0x07080a, reflSize: 9, env: 0.12, far: 30 },
  aperture: [[0, 0.004], [T.researchers, 0.003], [T.final, 0.003]],
  bloom: [[0, 0.5], [T.final, 0.55]],
  fast: CAM_MOVES.map(([a, b]) => [a, b, 2]),
});

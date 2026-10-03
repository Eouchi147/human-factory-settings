// Human Factory Settings · Film 18 "What do cold showers really do?" · one continuous shot, 9:16.
// A skeleton under a shower; the dial goes to cold and its jaw starts to chatter (the gag: nothing to shiver with, and it
// chatters anyway). On the tiled wall, one shower ends in a cold tile; thirty tiles turn blue, a month. A board of tiles: days
// off sick, 29% fewer; days feeling ill, the same. A hundred tiles: 91 want to keep going, 64 do. Two cards, immune boost and
// better mood, stamped NO PROOF over eleven little tubs. Two muscle sections after training, one with an ice bath: it grows
// less. A block of fat on a scale, 0.7 kg; the skeleton on a stool in the cold, two hours, a day counter racing to 42.
// A cold plunge: a gasp, a breathing gauge to ×10, a pulse that runs. The chiller's dial goes back to the middle and becomes
// the logo. The factory stamp is on the tank, where a maker marks a stock tank.
import { THREE, ss, s5, lerp, clamp01, hash, camTrack, phys, shadows, spot, RoundedBoxGeometry,
  loadAnatomy, V3, place, logoEnd, makeFilm, outBack, noiseTex, stamp, stampCanvas, stampSpot, softSprite } from '../kit.js';
import { buildRig, skeletonKind, bendSpine, poseArm, legIK, worldVerts, avgV } from '../rig.js';
import { makeLogoRing, makeClock, setClock } from '../props.js';

// ------------------------------------------------------------------ timing, from the voice guide (word starts)
const T = {
  end: 78.48,
  cold0: 0.35, showers: 1.04, supposedly: 2.01, boost: 3.23, immunity: 3.58, burn: 4.58, fat: 4.80,                  // "Cold showers. Supposedly, they boost immunity and burn fat."
  biggest: 6.61, dutch: 7.24, ended: 8.03, shower: 8.71, thirty: 9.53, ninety: 10.18, seconds: 10.74, coldW: 11.29,
  every: 11.75, day: 12.63, month: 13.34,
  compared: 14.53, normal: 15.49, reported: 16.55, t29: 17.35, fewer: 18.88, sick: 19.94, but: 20.74, noFewer: 21.21, ill: 22.40,
  t91: 23.51, wanted: 24.92, keep: 25.44, t64: 26.55, did: 27.96,
  immune: 29.03, mood: 30.62, review: 31.99, eleven: 32.57, mostly: 33.42, baths: 34.69, found: 35.11, no: 35.57, proof: 35.77, either: 36.35,
  lifting: 37.89, inTrials: 39.20, sitting: 40.18, coldWater: 40.56, straight: 41.46, after: 41.89, training: 42.35, may: 43.03, blunt: 43.36, growth: 44.19,
  fatLoss: 45.63, small: 47.62, zero: 48.33, seven: 49.39, kilos: 49.82, fatW: 50.81, six: 50.97, weeks: 51.50,
  with2: 52.37, two: 52.95, hours: 53.21, inCold: 53.78, aDay: 54.66, day2: 55.16,
  cw: 56.23, trigger: 57.43, shock: 58.10, gasp: 59.15, breathing: 59.52, ten: 60.63, faster: 61.48, harder: 62.05, heart: 63.06,
  shock2: 64.41, attacks: 66.19, even: 66.65, young: 68.49, healthy: 69.15, heartQ: 70.11, condition: 70.74, ask: 71.77, doctor: 72.59, first: 72.95,
  back: 74.33, factory: 75.19, settings: 75.49, logo: 76.18,
};

// ------------------------------------------------------------------ the set (metres, floor at y = 0); stations along x, each facing +z
const W = {}; window.HFS_W = W;
const X = new THREE.Vector3(1, 0, 0), Y = new THREE.Vector3(0, 1, 0), Z = new THREE.Vector3(0, 0, 1);
const WALL_Z = -0.35;                                                     // the shower's tiled wall
const SK = { x: -0.35, z: 0.02 };                                         // where the skeleton showers
const DIAL = { x: 0.02, y: 1.2 };                                         // the mixer, on the wall
const PANEL = { x: 0.45, i0: 10 };                                        // the month in tiles, right of the shower (wall columns 10..15)
const S1 = { x: 2.0, z: 0.0, y: 1.25 };                                   // days off sick, days feeling ill
const S2 = { x: 3.0, z: 0.0, y: 1.3 };                                    // a hundred tiles
const S3 = { x: 4.0, z: 0.0 };                                            // eleven trials, no proof
const S4 = { x: 5.0, z: 0.0, top: 0.84 };                                 // after training: rest, or an ice bath
const S5 = { x: 6.1, z: 0.0 };                                            // the scale; the stool in the cold; the clock
const S6 = { x: 7.9, z: 0.0 };                                           // the cold plunge
const TANK = { r: 0.48, h: 0.6, water: 0.5, seat: 0.27 };
const CHILL = { x: S6.x - 0.78, z: 0.2, y: 0.3 }, DIAL_R = 0.055, LOGO_R = 0.045;
const SWAP1 = 10.0, SWAP2 = 55.3;   // the skeleton moves while no one looks: shower to stool; stool to tank
const pulse = (t, a, b, r = 0.35) => ss(a, a + r, t) * (1 - ss(b - r, b, t));
const WARM = new THREE.Color(0xc9533c), ICE = new THREE.Color(0x67b3e6), TILE = new THREE.Color(0xe8eaed), TILE_DIM = new THREE.Color(0xc9cdd3);
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
const chrome = () => phys({ color: 0xd0d3d8, metalness: 1, roughness: 0.2, clearcoat: 0.4 });
const ceramic = (c = 0xeef0f2) => phys({ color: c, roughness: 0.18, clearcoat: 0.8, clearcoatRoughness: 0.15 });
const woodM = () => phys({ color: 0x24170f, roughness: 0.42, clearcoat: 0.5, roughnessMap: noiseTex(7, 256, 0.8, 1.0, 12) });
function printed(w, h, draw, opts = {}) { return new THREE.Mesh(new THREE.PlaneGeometry(w, h), phys({ map: canvasTex(Math.round(w * 4000), Math.round(h * 4000), draw), roughness: 0.6, transparent: true, ...opts })); }
function stand(g, x, z, h, top = 0.3, d = 0.3) {   // a black plinth
  const m = new THREE.Mesh(new RoundedBoxGeometry(top, h, d, 3, 0.01), black()); m.position.set(x, h / 2, z); g.add(m); return m;
}
function label(w, h, lines, { color = '#c9ccd2', size = 64, font = '"Geist Mono"', weight = 700, track = 4, align = 'center', bg = null } = {}) {
  return printed(w, h, (x, cw, ch) => { if (bg) { x.fillStyle = bg; x.fillRect(0, 0, cw, ch); } else x.clearRect(0, 0, cw, ch);
    const L = Array.isArray(lines) ? lines : [lines], lh = ch / L.length;
    L.forEach((s, i) => { const [str, sz, col] = Array.isArray(s) ? s : [s, size, color];
      txt(x, str, align === 'left' ? cw * 0.03 : cw / 2, lh * (i + 0.5) + 2, { font: `${weight} ${sz}px ${font}`, color: col, align, track, maxW: cw * 0.96 }); }); }, { depthWrite: false });
}
function tileGeo(s, d = 0.008) { return new RoundedBoxGeometry(s, s, d, 2, Math.min(0.004, s * 0.12)); }

// ------------------------------------------------------------------ the shower: a tiled wall, a tray, the head, the mixer, water
function makeShower(scene) {
  const g = new THREE.Group(); scene.add(g);
  const WW = 1.7, WH = 2.3, TS = 0.1;
  const grout = new THREE.Mesh(new THREE.PlaneGeometry(WW, WH), phys({ color: 0x0e0f11, roughness: 0.9 })); grout.position.set(0, WH / 2, WALL_Z - 0.004); g.add(grout);
  // the wall's tiles, except the thirty that count the month (they are their own meshes)
  const MONTH = []; for (let r = 0; r < 5; r++) for (let c = 0; c < 6; c++) MONTH.push([c, r]);
  const mCol = (c) => PANEL.i0 + c, mRow = (r) => 17 - r, ROW_J = 11;   // the month: wall columns 10..15, rows 13..17; one shower: row 11
  const isMonth = (i, j) => (i >= PANEL.i0 && i < PANEL.i0 + 6) && ((j >= 13 && j <= 17) || j === ROW_J);
  const tg = tileGeo(TS - 0.005), tm = ceramic(0x2b2e34), NX = Math.round(WW / TS), NY = Math.round(WH / TS);
  const inst = new THREE.InstancedMesh(tg, tm, NX * NY); let n = 0; const M = new THREE.Matrix4();
  for (let i = 0; i < NX; i++) for (let j = 0; j < NY; j++) { if (isMonth(i, j)) continue; M.makeTranslation(-WW / 2 + TS / 2 + i * TS, TS / 2 + j * TS, WALL_Z); inst.setMatrixAt(n++, M); }
  inst.count = n; inst.receiveShadow = true; g.add(inst);
  const month = MONTH.map(([c, r]) => { const m = new THREE.Mesh(tg, ceramic(0x34373e)); m.position.set(-WW / 2 + TS / 2 + mCol(c) * TS, TS / 2 + mRow(r) * TS, WALL_Z); m.userData.c0 = m.material.color.clone(); g.add(m); return m; });
  W.monthOrder = month.map((m, i) => i).sort((a, b) => (month[b].position.y - month[a].position.y) || (month[a].position.x - month[b].position.x));
  // the panel's words, and one shower in six tiles: five warm, the last one cold
  const ROW_Y = TS / 2 + ROW_J * TS, rowTiles = [];
  for (let k = 0; k < 6; k++) { const i = PANEL.i0 + k; const m = new THREE.Mesh(tg, ceramic(0x34373e)); m.position.set(-WW / 2 + TS / 2 + i * TS, ROW_Y, WALL_Z); m.userData.c0 = m.material.color.clone(); g.add(m); rowTiles.push(m); }
  const mkPlate = (w, h, lines, x, y, opts) => { const l = label(w, h, lines, opts); l.position.set(x, y, WALL_Z + 0.0045); g.add(l); return l; };
  mkPlate(0.6, 0.06, [['EVERY DAY FOR A MONTH', 118, '#eceef1']], PANEL.x + 0.05, TS / 2 + 17 * TS + 0.095);
  mkPlate(0.6, 0.06, [['ONE SHOWER', 118, '#eceef1']], PANEL.x + 0.05, ROW_Y + 0.095);
  const coldTag = mkPlate(0.3, 0.05, [['LAST 30 TO 90 S', 92, '#8fd0f6']], PANEL.x + 0.2, ROW_Y - 0.08);
  // the tray and its drain
  const tray = new THREE.Mesh(new RoundedBoxGeometry(0.92, 0.05, 0.84, 3, 0.012), ceramic(0xe9ebee)); tray.position.set(SK.x, 0.025, WALL_Z + 0.42); g.add(tray);
  const drain = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.002, 48), chrome()); drain.position.set(SK.x, 0.051, WALL_Z + 0.42); g.add(drain);
  // the head: an arm out of the wall, a wide round rose
  const armM = chrome(), HY = 2.16;
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.36, 24), armM); arm.rotation.x = Math.PI / 2; arm.position.set(SK.x, HY + 0.06, WALL_Z + 0.18); g.add(arm);
  const elbow = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.07, 24), armM); elbow.position.set(SK.x, HY + 0.03, SK.z + 0.01); g.add(elbow);
  const rose = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.085, 0.022, 64), armM); rose.position.set(SK.x, HY - 0.012, SK.z + 0.01); g.add(rose);
  const face = new THREE.Mesh(new THREE.CircleGeometry(0.083, 64), phys({ color: 0x2a2d33, roughness: 0.4, metalness: 0.6, map: canvasTex(512, 512, (x, w) => {
    x.fillStyle = '#9aa0a8'; x.fillRect(0, 0, w, w); x.fillStyle = '#1b1d21'; for (let r = 0; r < 6; r++) { const n = r === 0 ? 1 : r * 7; for (let k = 0; k < n; k++) { const a = (k / n) * Math.PI * 2, rr = r * w * 0.075; x.beginPath(); x.arc(w / 2 + Math.cos(a) * rr, w / 2 + Math.sin(a) * rr, w * 0.011, 0, 7); x.fill(); } } }) }));
  face.rotation.x = Math.PI / 2; face.position.set(SK.x, HY - 0.024, SK.z + 0.01); g.add(face);
  // the mixer: a ceramic plate with a warm-to-cold arc, a chrome lever
  const dial = new THREE.Group(); dial.position.set(DIAL.x, DIAL.y, WALL_Z + 0.006); g.add(dial);
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.012, 64), ceramic(0xf4f5f6)); plate.rotation.x = Math.PI / 2; dial.add(plate);
  const arcFace = new THREE.Mesh(new THREE.CircleGeometry(0.0745, 64), new THREE.MeshPhysicalMaterial({ transparent: true, roughness: 0.3, clearcoat: 0.6, map: canvasTex(512, 512, (x, w) => {
    x.clearRect(0, 0, w, w); const c = w / 2; x.lineWidth = w * 0.06; x.lineCap = 'round';
    for (let k = 0; k < 60; k++) { const u = k / 60, a0 = Math.PI * (0.75 + 1.5 * u), a1 = Math.PI * (0.75 + 1.5 * (u + 1 / 60) + 0.002); const col = new THREE.Color().copy(WARM).lerp(ICE, u);
      x.strokeStyle = '#' + col.getHexString(); x.beginPath(); x.arc(c, c, w * 0.38, a0, a1); x.stroke(); }
    txt(x, 'WARM', w * 0.22, w * 0.86, { font: '700 40px "Geist Mono"', color: '#8d4a3e', track: 2 }); txt(x, 'COLD', w * 0.78, w * 0.86, { font: '700 40px "Geist Mono"', color: '#3f7ea6', track: 2 }); }) }));
  arcFace.position.z = 0.0062; dial.add(arcFace);
  const lever = new THREE.Group(); lever.position.z = 0.012; dial.add(lever);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.03, 0.03, 48), chrome()); hub.rotation.x = Math.PI / 2; hub.position.z = 0.015; lever.add(hub);
  const handle = new THREE.Mesh(new RoundedBoxGeometry(0.016, 0.075, 0.016, 3, 0.006), chrome()); handle.position.set(0, 0.045, 0.026); lever.add(handle);
  shadows(g); g.traverse((o) => o.layers.enable(1)); inst.castShadow = false;
  return { g, month, rowTiles, coldTag, lever, HY };
}
// water: streaks falling from the rose; they go straight through the bones, which have nothing to stop them
function makeWater(scene, HY) {
  const N = 320, geo = new THREE.CapsuleGeometry(0.0018, 0.07, 3, 6), mat = new THREE.MeshPhysicalMaterial({ color: 0xdcecff, roughness: 0.05, transparent: true, opacity: 0.55, emissive: 0x34465c, depthWrite: false });
  const m = new THREE.InstancedMesh(geo, mat, N); m.frustumCulled = false; m.renderOrder = 3; scene.add(m); m.layers.enable(1);
  const D = []; for (let i = 0; i < N; i++) { const a = hash(i * 1.7) * Math.PI * 2, r = Math.sqrt(hash(i * 2.3)) * 0.075; D.push({ x: Math.cos(a) * r, z: Math.sin(a) * r, sx: Math.cos(a) * (0.05 + hash(i * 5.1) * 0.12), sz: Math.sin(a) * (0.05 + hash(i * 5.1) * 0.12), ph: hash(i * 9.7), v: 1.6 + hash(i * 3.3) * 0.8 }); }
  return { m, D, N, top: HY - 0.03, bot: 0.06 };
}
function setWater(Wt, t, on = 1) {
  const M = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(1, on, 1), p = new THREE.Vector3(), H = Wt.top - Wt.bot, g = 9.81;
  for (let i = 0; i < Wt.N; i++) { const d = Wt.D[i], Tf = (-d.v + Math.sqrt(d.v * d.v + 2 * g * H)) / g, u = ((t / Tf) + d.ph) % 1, tt = u * Tf;
    const y = Wt.top - (d.v * tt + 0.5 * g * tt * tt); p.set(SK.x + 0.0 + d.x + d.sx * u, y, SK.z + 0.01 + d.z + d.sz * u); M.compose(p, q, s); Wt.m.setMatrixAt(i, M); }
  Wt.m.instanceMatrix.needsUpdate = true; Wt.m.visible = on > 0.01;
}
function makeSteam(scene) {   // warm water's steam: soft puffs that rise and thin out once the water goes cold
  const tex = softSprite(), P = [];
  for (let i = 0; i < 26; i++) { const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: 0xdfe4ea, transparent: true, opacity: 0, depthWrite: false })); m.renderOrder = 5; scene.add(m);
    P.push({ m, x: SK.x + (hash(i * 3.1) - 0.5) * 0.7, z: SK.z + (hash(i * 4.7) - 0.5) * 0.45 + 0.1, ph: hash(i * 6.3), s: 0.35 + hash(i * 8.9) * 0.4 }); }
  return P;
}
function setSteam(P, t, k) {
  for (const p of P) { const u = (t * 0.12 + p.ph) % 1, y = 0.5 + u * 1.9; p.m.position.set(p.x + Math.sin(t * 0.4 + p.ph * 9) * 0.06, y, p.z); p.m.scale.setScalar(p.s * (0.6 + u));
    p.m.material.opacity = 0.11 * k * Math.sin(Math.PI * u); p.m.visible = k > 0.01; }
}

// ------------------------------------------------------------------ days off sick, days feeling ill: bars of tiles
function makeSick(scene) {
  const g = new THREE.Group(); g.position.set(S1.x, 0, S1.z); scene.add(g);
  const BW = 0.68, BH = 0.68;
  for (const s of [-1, 1]) { const leg = new THREE.Mesh(new THREE.BoxGeometry(0.03, S1.y + BH / 2, 0.03), black()); leg.position.set(s * (BW / 2 - 0.03), (S1.y + BH / 2) / 2, -0.04); g.add(leg); }
  const board = new THREE.Mesh(new RoundedBoxGeometry(BW, BH, 0.025, 3, 0.008), phys({ color: 0x1a1c20, roughness: 0.55, clearcoat: 0.3 })); board.position.set(0, S1.y, -0.015); g.add(board);
  const TSZ = 0.04, tg = tileGeo(TSZ, 0.008), x0 = -0.15;
  const sec = (title, y0) => { const h = label(0.6, 0.05, [[title, 96, '#eceef1']], { align: 'left' }); h.position.set(0.0, y0, 0.0); g.add(h); };
  const rowLab = (s, y) => { const l = label(0.15, 0.04, [[s, 72, '#a3a9b3']], { align: 'left' }); l.position.set(-0.235, y, 0.0); g.add(l); };
  const bars = [];
  const mkBar = (y, n, col) => { const ts = []; for (let k = 0; k < 10; k++) { const m = new THREE.Mesh(tg, ceramic(col)); m.position.set(x0 + TSZ / 2 + k * (TSZ + 0.004), y, 0.006); m.userData.full = Math.min(1, n - k); m.visible = false; g.add(m); ts.push(m); } bars.push(ts); };
  const Y1 = S1.y + 0.215, Y2 = S1.y - 0.075;
  sec('DAYS OFF SICK', Y1 + 0.035); rowLab('NORMAL', Y1 - 0.045); rowLab('COLD END', Y1 - 0.11); mkBar(Y1 - 0.045, 10, 0xc9cdd3); mkBar(Y1 - 0.11, 7.1, 0x67b3e6);
  sec('DAYS FEELING ILL', Y2 + 0.035); rowLab('NORMAL', Y2 - 0.045); rowLab('COLD END', Y2 - 0.11); mkBar(Y2 - 0.045, 10, 0xc9cdd3); mkBar(Y2 - 0.11, 10, 0x67b3e6);
  shadows(g); g.traverse((o) => o.layers.enable(1));
  return { g, bars };
}

// ------------------------------------------------------------------ a hundred tiles: 91 want to keep going; 64 do
function makeHundred(scene) {
  const g = new THREE.Group(); g.position.set(S2.x, 0, S2.z); scene.add(g);
  const BW = 0.6, BH = 0.8;
  for (const s of [-1, 1]) { const leg = new THREE.Mesh(new THREE.BoxGeometry(0.03, S2.y + BH / 2, 0.03), black()); leg.position.set(s * (BW / 2 - 0.03), (S2.y + BH / 2) / 2, -0.04); g.add(leg); }
  const board = new THREE.Mesh(new RoundedBoxGeometry(BW, BH, 0.025, 3, 0.008), phys({ color: 0x1a1c20, roughness: 0.55, clearcoat: 0.3 })); board.position.set(0, S2.y, -0.015); g.add(board);
  const head = label(0.54, 0.05, [['OUT OF 100 WHO TRIED IT', 96, '#eceef1']]); head.position.set(0, S2.y + BH / 2 - 0.05, 0); g.add(head);
  const TSZ = 0.042, P = 0.047, inst = new THREE.InstancedMesh(tileGeo(TSZ, 0.007), ceramic(0xffffff), 100), M = new THREE.Matrix4();
  for (let i = 0; i < 100; i++) { const r = Math.floor(i / 10), c = i % 10; M.makeTranslation(-4.5 * P + c * P, S2.y + 0.25 - r * P, 0.005); inst.setMatrixAt(i, M); inst.setColorAt(i, TILE_DIM); }
  inst.castShadow = true; inst.receiveShadow = true; g.add(inst);
  // the count under the grid: 91 wanted to; 64 did
  const cv = document.createElement('canvas'); cv.width = 2200; cv.height = 520; const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const count = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.13), new THREE.MeshPhysicalMaterial({ map: tex, transparent: true, roughness: 0.5, depthWrite: false })); count.position.set(0, S2.y - 0.3, 0.0); g.add(count);
  shadows(g); g.traverse((o) => o.layers.enable(1));
  return { g, inst, cv, tex, key: '' };
}
function drawCount(H, n, word, k) {
  const key = n + word + k.toFixed(2); if (key === H.key) return; H.key = key;
  const x = H.cv.getContext('2d'), w = H.cv.width, h = H.cv.height; x.clearRect(0, 0, w, h); x.globalAlpha = k;
  txt(x, String(n), w * 0.27, h * 0.52, { font: '900 380px Archivo', color: '#7fc1ec', track: -6 });
  txt(x, word, w * 0.47, h * 0.52, { font: '700 92px "Geist Mono"', color: '#e6e8eb', align: 'left', track: 6, maxW: w * 0.52 }); x.globalAlpha = 1; H.tex.needsUpdate = true;
}

// ------------------------------------------------------------------ eleven little tubs (ten baths, one shower); two cards, stamped NO PROOF
function miniTub() {
  const g = new THREE.Group(), white = ceramic(0xf2f3f5);
  const body = new THREE.Mesh(new RoundedBoxGeometry(0.066, 0.032, 0.036, 3, 0.011), white); body.position.y = 0.023; g.add(body);
  const water = new THREE.Mesh(new RoundedBoxGeometry(0.054, 0.002, 0.025, 2, 0.0008), phys({ color: 0x5aa7de, roughness: 0.1, clearcoat: 1, emissive: 0x0d2a40 })); water.position.y = 0.0385; g.add(water);
  for (const [x, z] of [[-0.024, -0.011], [0.024, -0.011], [-0.024, 0.011], [0.024, 0.011]]) { const f = new THREE.Mesh(new THREE.SphereGeometry(0.0042, 12, 8), chrome()); f.position.set(x, 0.0045, z); g.add(f); }
  return g;
}
function miniShower() {
  const g = new THREE.Group(), white = ceramic(0xf2f3f5), cr = chrome();
  const tray = new THREE.Mesh(new RoundedBoxGeometry(0.046, 0.008, 0.04, 2, 0.003), white); tray.position.y = 0.004; g.add(tray);
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.0024, 0.0024, 0.075, 10), cr); post.position.set(-0.016, 0.045, -0.013); g.add(post);
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.002, 0.002, 0.022, 10), cr); arm.rotation.z = Math.PI / 2; arm.position.set(-0.005, 0.082, -0.013); g.add(arm);
  const head = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.008, 0.004, 20), cr); head.position.set(0.007, 0.079, -0.013); g.add(head);
  return g;
}
function makeReview(scene) {
  const g = new THREE.Group(); g.position.set(S3.x, 0, S3.z); scene.add(g);
  stand(g, 0, -0.02, 1.0, 0.66, 0.3);
  const shelfTop = new THREE.Mesh(new RoundedBoxGeometry(0.7, 0.02, 0.32, 3, 0.006), woodM()); shelfTop.position.set(0, 1.01, -0.02); g.add(shelfTop);
  const minis = []; for (let k = 0; k < 11; k++) { const m = k === 10 ? miniShower() : miniTub(), front = k < 6, j = front ? k : k - 6; m.position.set(front ? -0.1875 + j * 0.075 : -0.15 + j * 0.075, 1.02, front ? 0.08 : 0.0); m.rotation.y = (hash(k * 3.7) - 0.5) * 0.25; m.scale.setScalar(0.0001); g.add(m); minis.push(m); }
  const foot = label(0.46, 0.03, [['10 IN BATHS, 1 IN SHOWERS', 54, '#9aa0aa']]); foot.position.set(0, 0.97, 0.141); g.add(foot);
  // the two cards, on a little easel each
  const card = (title) => printed(0.2, 0.14, (x, w, h) => { x.fillStyle = '#f2efe8'; x.fillRect(0, 0, w, h);
    txt(x, title, w / 2, h * 0.2, { font: '800 100px Archivo', color: '#1f2228', track: 2, maxW: w * 0.9 });
    x.strokeStyle = '#2b2f36'; x.lineWidth = 12; x.strokeRect(w * 0.39, h * 0.42, w * 0.22, w * 0.22); });
  const stampTex = canvasTex(1024, 360, (x, w, h) => { x.clearRect(0, 0, w, h); x.save(); x.translate(w / 2, h / 2); x.rotate(-0.12);
    x.strokeStyle = 'rgba(196,46,40,0.92)'; x.lineWidth = 20; x.beginPath(); x.roundRect(-w * 0.46, -h * 0.34, w * 0.92, h * 0.68, 26); x.stroke();
    x.fillStyle = 'rgba(196,46,40,0.92)'; x.font = '900 128px Archivo'; x.letterSpacing = '6px'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('NO PROOF', 0, 8); x.restore();
    x.globalCompositeOperation = 'destination-out'; for (let k = 0; k < 700; k++) { x.fillStyle = `rgba(0,0,0,${0.25 + hash(k) * 0.5})`; x.fillRect(hash(k * 3.1) * w, hash(k * 7.3) * h, 3 + hash(k * 1.3) * 7, 2 + hash(k * 2.9) * 5); } });
  const cards = [], stamps = [];
  [['IMMUNE BOOST', -0.112], ['BETTER MOOD', 0.112]].forEach(([s, x]) => { const c = card(s); c.position.set(x, 1.25, -0.07); c.rotation.x = -0.12; g.add(c); cards.push(c);
    const back = new THREE.Mesh(new RoundedBoxGeometry(0.21, 0.15, 0.012, 2, 0.004), black()); back.position.set(x, 1.25, -0.078); back.rotation.x = -0.12; g.add(back);
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.22, 0.012), black()); leg.position.set(x, 1.12, -0.12); leg.rotation.x = 0.35; g.add(leg);
    const st = new THREE.Mesh(new THREE.PlaneGeometry(0.17, 0.06), new THREE.MeshStandardMaterial({ map: stampTex, transparent: true, opacity: 0, roughness: 0.8, depthWrite: false }));
    st.position.set(x, 1.228, -0.062); st.rotation.x = -0.12; g.add(st); stamps.push(st); });
  shadows(g); g.traverse((o) => o.layers.enable(1));
  return { g, minis, stamps };
}

// ------------------------------------------------------------------ after training: rest, or an ice bath
function crossSection(r0 = 0.07) {   // a slice of muscle, face on: red fibres in bundles, a pale rim; it grows by scale
  const g = new THREE.Group();
  const face = new THREE.Mesh(new THREE.CircleGeometry(1, 96), phys({ roughness: 0.55, clearcoat: 0.3, map: canvasTex(512, 512, (x, w) => {
    const c = w / 2; x.fillStyle = '#e9d9c9'; x.beginPath(); x.arc(c, c, c, 0, 7); x.fill(); x.fillStyle = '#8f1f22'; x.beginPath(); x.arc(c, c, c * 0.93, 0, 7); x.fill();
    for (let k = 0; k < 420; k++) { const a = hash(k * 1.3) * 7, rr = Math.sqrt(hash(k * 2.9)) * c * 0.88, s = 6 + hash(k * 4.1) * 10; x.fillStyle = `rgba(${150 + hash(k) * 60},${30 + hash(k * 7) * 25},${32 + hash(k * 5) * 20},0.85)`;
      x.beginPath(); x.arc(c + Math.cos(a) * rr, c + Math.sin(a) * rr, s, 0, 7); x.fill(); }
    x.strokeStyle = 'rgba(233,217,201,0.55)'; x.lineWidth = 4; for (let k = 0; k < 9; k++) { const a = (k / 9) * 7 + 0.3; x.beginPath(); x.moveTo(c, c); x.lineTo(c + Math.cos(a) * c * 0.92, c + Math.sin(a) * c * 0.92); x.stroke(); } }) }));
  g.add(face); const back = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.12, 96, 1, true), phys({ color: 0x6d1719, roughness: 0.6 })); back.rotation.x = Math.PI / 2; back.position.z = -0.06; g.add(back);
  g.scale.setScalar(r0); shadows(g); return { g, r0 };
}
function iceCube(s = 0.03) { const m = new THREE.Mesh(new RoundedBoxGeometry(s, s * 0.85, s, 3, s * 0.18), new THREE.MeshPhysicalMaterial({ color: 0xeaf6ff, roughness: 0.12, transmission: 0.0, transparent: true, opacity: 0.78, clearcoat: 1, emissive: 0x1d2b38 })); return m; }
function makeLift(scene) {
  const g = new THREE.Group(); g.position.set(S4.x, 0, S4.z); scene.add(g);
  const table = new THREE.Mesh(new RoundedBoxGeometry(0.62, 0.03, 0.4, 3, 0.008), woodM()); table.position.y = S4.top - 0.015; g.add(table);
  stand(g, 0, 0, S4.top - 0.03, 0.54, 0.32);
  const CX = 0.14, secs = [], rings = [];
  for (const [x, lab] of [[-CX, 'REST'], [CX, 'ICE BATH']]) {
    const cs = crossSection(0.06); cs.g.position.set(x, S4.top + 0.5, -0.06); g.add(cs.g); secs.push(cs);
    const rm = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false }), ring = new THREE.Group(); ring.material = rm;
    for (let k = 0; k < 36; k++) ring.add(new THREE.Mesh(new THREE.RingGeometry(0.0592, 0.0612, 6, 1, (k / 36) * Math.PI * 2, (Math.PI * 2 / 36) * 0.58), rm));
    ring.position.set(x, S4.top + 0.5, -0.057); g.add(ring); rings.push(ring);
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.44, 12), chrome()); post.position.set(x, S4.top + 0.22, -0.075); g.add(post);
    const l = label(0.2, 0.04, [[lab, 70, '#e6e8eb']], { bg: '#16171a' }); l.position.set(x, S4.top + 0.37, -0.05); g.add(l);
  }
  // the dumbbell, under REST; the ice bath, under ICE BATH
  const db = new THREE.Group(); { const head = phys({ color: 0x4a4e57, roughness: 0.5, clearcoat: 0.35, metalness: 0.3 });
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.0125, 0.0125, 0.15, 24), phys({ color: 0x9a9ea6, metalness: 1, roughness: 0.45 })); bar.rotation.z = Math.PI / 2; db.add(bar);
    for (const s of [-1, 1]) { const h = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.05, 6), head); h.rotation.z = Math.PI / 2; h.position.x = s * 0.07; db.add(h); } }
  db.position.set(-CX, S4.top + 0.045, 0.09); db.rotation.y = 0.12; g.add(db);
  const tub = new THREE.Group(); tub.position.set(CX, S4.top, 0.06); g.add(tub);
  const tb = new THREE.Mesh(new RoundedBoxGeometry(0.2, 0.08, 0.13, 3, 0.02), ceramic(0xf2f3f5)); tb.position.y = 0.04; tub.add(tb);
  const tw = new THREE.Mesh(new RoundedBoxGeometry(0.175, 0.004, 0.105, 2, 0.002), phys({ color: 0x5fa8da, roughness: 0.05, clearcoat: 1, transparent: true, opacity: 0.9 })); tw.position.y = 0.079; tub.add(tw);
  for (let k = 0; k < 6; k++) { const c = iceCube(0.022); c.position.set(-0.06 + (k % 3) * 0.055 + (hash(k) - 0.5) * 0.01, 0.084, -0.022 + Math.floor(k / 3) * 0.042); c.rotation.set(hash(k * 2) * 0.3, hash(k * 3) * 3, hash(k * 4) * 0.3); tub.add(c); }
  shadows(g); g.traverse((o) => o.layers.enable(1));
  return { g, secs, rings };
}

// ------------------------------------------------------------------ the scale and the fat; the stool in the cold; the clock and the days
function makeCold(scene) {
  const g = new THREE.Group(); g.position.set(S5.x, 0, S5.z); scene.add(g);
  // the scale, on a side table to the left
  const ST = { x: -0.62, z: 0.08, y: 0.78 };
  const tbl = new THREE.Mesh(new RoundedBoxGeometry(0.42, 0.03, 0.36, 3, 0.008), woodM()); tbl.position.set(ST.x, ST.y - 0.015, ST.z); g.add(tbl);
  stand(g, ST.x, ST.z, ST.y - 0.03, 0.34, 0.28);
  const sc = new THREE.Group(); sc.position.set(ST.x, ST.y, ST.z); g.add(sc);
  const base = new THREE.Mesh(new RoundedBoxGeometry(0.2, 0.028, 0.2, 3, 0.01), ceramic(0xeceef0)); base.position.y = 0.014; sc.add(base);
  const pan = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.004, 64), chrome()); pan.position.y = 0.03; sc.add(pan);
  const cv = document.createElement('canvas'); cv.width = 512; cv.height = 160; const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const disp = new THREE.Mesh(new THREE.PlaneGeometry(0.075, 0.0235), new THREE.MeshBasicMaterial({ map: tex })); disp.position.set(0, 0.016, 0.1005); sc.add(disp);
  const fat = new THREE.Mesh(new RoundedBoxGeometry(0.12, 0.075, 0.085, 4, 0.016), phys({ color: 0xf1e3b8, roughness: 0.55, clearcoat: 0.25, sheen: 0.6, sheenColor: new THREE.Color(0xfff4d6), roughnessMap: noiseTex(23, 256, 0.6, 1.0, 6) }));
  fat.position.set(ST.x, ST.y + 0.032 + 0.0375, ST.z); fat.rotation.y = 0.25; fat.visible = false; g.add(fat);
  const fatTag = label(0.1, 0.022, [['0.7 KG OF FAT', 46, '#e6e8eb']], { bg: '#16171a' }); fatTag.position.set(ST.x, ST.y - 0.015, ST.z + 0.1812); g.add(fatTag);
  // the stool
  const stool = new THREE.Group(); stool.position.set(0, 0, -0.02); g.add(stool);
  const seat = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.035, 48), woodM()); seat.position.y = 0.46; stool.add(seat);
  for (let k = 0; k < 3; k++) { const a = (k / 3) * Math.PI * 2 + 0.3, l = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.012, 0.47, 12), woodM()); l.position.set(Math.cos(a) * 0.12, 0.22, Math.sin(a) * 0.12); l.rotation.set(Math.sin(a) * 0.12, 0, -Math.cos(a) * 0.12); stool.add(l); }
  // the stand at its left: the clock, the day count, the thermometer at 17 °C
  const PX = 0.42, pole = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1.7, 16), black()); pole.position.set(PX, 0.85, -0.12); g.add(pole);
  const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.025, 40), black()); foot.position.set(PX, 0.0125, -0.12); g.add(foot);
  const shelf = new THREE.Mesh(new RoundedBoxGeometry(0.26, 0.016, 0.16, 2, 0.005), black()); shelf.position.set(PX, 1.242, -0.07); g.add(shelf);
  const clock = makeClock(); clock.g.scale.setScalar(2.6); clock.g.position.set(PX, 1.25, -0.06); g.add(clock.g);
  const dcv = document.createElement('canvas'); dcv.width = 1100; dcv.height = 300; const dtex = new THREE.CanvasTexture(dcv); dtex.colorSpace = THREE.SRGBColorSpace;
  const days = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.06), new THREE.MeshPhysicalMaterial({ map: dtex, roughness: 0.5 })); days.position.set(PX, 1.19, 0.012); g.add(days);
  const thermo = printed(0.075, 0.42, (x, w, h) => { x.fillStyle = '#f2efe8'; x.beginPath(); x.roundRect(0, 0, w, h, 60); x.fill();
    const y0 = h * 0.84, y1 = h * 0.1, yv = (c) => y0 - ((c + 10) / 50) * (y0 - y1);
    for (let c = -10; c <= 40; c += 5) { const yy = yv(c); x.fillStyle = '#4a4f58'; x.fillRect(w * 0.56, yy - 3, c % 10 === 0 ? w * 0.2 : w * 0.12, 6); if (c % 10 === 0) txt(x, String(c), w * 0.36, yy, { font: '700 64px "Geist Mono"', color: '#4a4f58' }); }
    txt(x, '°C', w * 0.5, h * 0.05, { font: '700 64px "Geist Mono"', color: '#4a4f58' });
    x.fillStyle = '#d8d4cb'; x.fillRect(w * 0.47, y1, w * 0.07, y0 - y1);
    x.fillStyle = '#c62f2a'; x.fillRect(w * 0.47, yv(17), w * 0.07, y0 - yv(17)); x.beginPath(); x.arc(w * 0.505, y0 + h * 0.055, w * 0.16, 0, 7); x.fill();
    x.fillStyle = '#c62f2a'; txt(x, '17', w * 0.84, yv(17), { font: '800 70px Archivo', color: '#c62f2a' }); });
  thermo.position.set(PX, 0.86, -0.1); g.add(thermo);
  shadows(g); g.traverse((o) => o.layers.enable(1));
  return { g, fat, cv, tex, clock, dcv, dtex, key: '', dkey: '', ST, PX };
}
function drawScale(C, kg) { const s = kg.toFixed(2) + ' kg'; if (s === C.key) return; C.key = s; const x = C.cv.getContext('2d'), w = C.cv.width, h = C.cv.height;
  x.fillStyle = '#0d1a14'; x.fillRect(0, 0, w, h); txt(x, s, w * 0.92, h * 0.55, { font: '700 112px "Geist Mono"', color: '#8ff0b8', align: 'right' }); C.tex.needsUpdate = true; }
function drawDays(C, n) { const s = 'DAY ' + n; if (s === C.dkey) return; C.dkey = s; const x = C.dcv.getContext('2d'), w = C.dcv.width, h = C.dcv.height;
  x.fillStyle = '#16171a'; x.fillRect(0, 0, w, h); txt(x, s, w / 2, h * 0.54, { font: '700 170px "Geist Mono"', color: '#e6e8eb', track: 10 }); C.dtex.needsUpdate = true; }

// ------------------------------------------------------------------ the cold plunge: a galvanised tank, ice; the gauges; the chiller and its dial
function makeTank(scene) {
  const g = new THREE.Group(); g.position.set(S6.x, 0, S6.z); scene.add(g);
  const zinc = phys({ color: 0xaeb4bb, metalness: 0.75, roughness: 0.42, clearcoat: 0.2, roughnessMap: noiseTex(31, 512, 0.55, 1.0, 9), side: THREE.DoubleSide });
  const wall = new THREE.Mesh(new THREE.CylinderGeometry(TANK.r, TANK.r, TANK.h, 128, 1, true), zinc); wall.position.y = TANK.h / 2; g.add(wall);
  for (const y of [0.16, 0.36]) { const rib = new THREE.Mesh(new THREE.TorusGeometry(TANK.r + 0.004, 0.009, 12, 128), zinc); rib.rotation.x = Math.PI / 2; rib.position.y = y; g.add(rib); }
  const lip = new THREE.Mesh(new THREE.TorusGeometry(TANK.r + 0.006, 0.014, 16, 128), zinc); lip.rotation.x = Math.PI / 2; lip.position.y = TANK.h; g.add(lip);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(TANK.r, 96), zinc); floor.rotation.x = -Math.PI / 2; floor.position.y = 0.02; g.add(floor);
  const seat = new THREE.Mesh(new RoundedBoxGeometry(0.42, TANK.seat - 0.02, 0.3, 3, 0.02), black()); seat.position.set(0, (TANK.seat - 0.02) / 2 + 0.02, -0.22); g.add(seat);
  const water = new THREE.Mesh(new THREE.CircleGeometry(TANK.r - 0.003, 128), new THREE.MeshPhysicalMaterial({ color: 0x2f6f99, roughness: 0.05, metalness: 0, transparent: true, opacity: 0.62, clearcoat: 1, emissive: 0x08141d, depthWrite: false }));
  water.rotation.x = -Math.PI / 2; water.position.y = TANK.water; water.renderOrder = 2; g.add(water);
  const ice = []; for (let k = 0; k < 9; k++) { const c = iceCube(0.045 + hash(k * 1.9) * 0.02), a = hash(k * 2.7) * Math.PI * 2, r = 0.2 + hash(k * 4.1) * 0.22; c.position.set(Math.cos(a) * r, TANK.water + 0.004, Math.sin(a) * r * 0.9 + 0.04); c.userData.ph = hash(k * 6.1) * 6; c.rotation.y = hash(k * 8.3) * 3; g.add(c); ice.push(c); }
  // the console: breathing and pulse, on a pole at the tank's left (+x)
  const CXc = 0.66, cons = new THREE.Group(); cons.position.set(CXc, 0, 0.12); g.add(cons);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1.15, 16), black()); pole.position.y = 0.575; cons.add(pole);
  const cfoot = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.15, 0.022, 40), black()); cfoot.position.y = 0.011; cons.add(cfoot);
  const box = new THREE.Mesh(new RoundedBoxGeometry(0.24, 0.36, 0.05, 3, 0.012), black()); box.position.set(0, 1.18, 0); cons.add(box);
  const gauge = printed(0.2, 0.15, (x, w, h) => { x.fillStyle = '#f2efe8'; x.beginPath(); x.roundRect(0, 0, w, h, 40); x.fill();
    txt(x, 'BREATHING', w / 2, h * 0.13, { font: '700 64px "Geist Mono"', color: '#4a4f58', track: 4 }); const cx = w / 2, cy = h * 0.86, R = w * 0.36;
    x.lineWidth = 10; x.strokeStyle = '#4a4f58'; x.beginPath(); x.arc(cx, cy, R, Math.PI, 2 * Math.PI); x.stroke();
    for (let k = 1; k <= 10; k++) { const a = Math.PI + ((k - 1) / 9) * Math.PI, big = k === 1 || k === 5 || k === 10; x.lineWidth = big ? 10 : 6;
      x.beginPath(); x.moveTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); x.lineTo(cx + Math.cos(a) * (R - (big ? 50 : 30)), cy + Math.sin(a) * (R - (big ? 50 : 30))); x.stroke();
      if (big) txt(x, '×' + k, cx + Math.cos(a) * (R - 100), cy + Math.sin(a) * (R - 100) + 10, { font: '700 60px "Geist Mono"', color: k === 10 ? '#c62f2a' : '#4a4f58' }); } });
  gauge.position.set(0, 1.27, 0.026); cons.add(gauge);
  const needle = new THREE.Group(); needle.position.set(0, 1.27 - 0.075 + 0.15 * 0.14, 0.03); cons.add(needle);
  { const nm = new THREE.Mesh(new THREE.BoxGeometry(0.0035, 0.06, 0.002), new THREE.MeshStandardMaterial({ color: 0xc62f2a, roughness: 0.4 })); nm.position.y = 0.03; needle.add(nm);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.004, 20), black()); hub.rotation.x = Math.PI / 2; needle.add(hub); }
  const pcv = document.createElement('canvas'); pcv.width = 800; pcv.height = 420; const ptex = new THREE.CanvasTexture(pcv); ptex.colorSpace = THREE.SRGBColorSpace;
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.105), new THREE.MeshBasicMaterial({ map: ptex })); screen.position.set(0, 1.08, 0.026); cons.add(screen);
  // the chiller, to the right (−x), its hose over the rim; its dial (it ends the film as the logo)
  const ch = new THREE.Group(); ch.position.set(CHILL.x - S6.x, 0, CHILL.z); g.add(ch);
  const cb = new THREE.Mesh(new RoundedBoxGeometry(0.3, 0.42, 0.26, 3, 0.02), phys({ color: 0x1c1e22, roughness: 0.5, clearcoat: 0.4 })); cb.position.y = 0.21; ch.add(cb);
  const grille = printed(0.22, 0.08, (x, w, h) => { x.fillStyle = '#121316'; x.fillRect(0, 0, w, h); x.fillStyle = '#2a2d33'; for (let k = 0; k < 14; k++) x.fillRect(w * 0.05, h * (0.1 + k * 0.06), w * 0.9, h * 0.03); });
  grille.position.set(0, 0.1, 0.1305); ch.add(grille);
  const dialG = new THREE.Group(); dialG.position.set(0, CHILL.y, 0.131); ch.add(dialG);
  const dplate = new THREE.Mesh(new THREE.CircleGeometry(DIAL_R, 96), phys({ roughness: 0.4, clearcoat: 0.6, map: canvasTex(512, 512, (x, w) => {
    const c = w / 2; x.fillStyle = '#e9e6df'; x.beginPath(); x.arc(c, c, c, 0, 7); x.fill();
    x.lineWidth = w * 0.035; x.lineCap = 'butt'; for (let k = 0; k < 40; k++) { const u = k / 40, a0 = Math.PI * (0.75 + 1.5 * u), a1 = Math.PI * (0.75 + 1.5 * (u + 1 / 40)) + 0.002;
      x.strokeStyle = '#' + new THREE.Color().copy(WARM).lerp(ICE, u).getHexString(); x.beginPath(); x.arc(c, c, c * 0.86, a0, a1); x.stroke(); } }) }));
  dialG.add(dplate);
  const knob = new THREE.Group(); knob.position.z = 0.004; dialG.add(knob);
  const kb = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.028, 0.018, 48), chrome()); kb.rotation.x = Math.PI / 2; kb.position.z = 0.009; knob.add(kb);
  const ptr = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.022, 0.002), new THREE.MeshStandardMaterial({ color: 0x16171a })); ptr.position.set(0, 0.012, 0.0185); knob.add(ptr);
  const logo = makeLogoRing(LOGO_R); logo.g.position.z = 0.0195; dialG.add(logo.g);
  const hose = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V(CHILL.x - S6.x + 0.1, 0.4, CHILL.z - 0.05), V(-0.3, 0.72, 0.05), V(-0.38, 0.62, -0.02), V(-0.36, 0.42, -0.02)].map((a) => new THREE.Vector3(...a))), 40, 0.012, 10), black());
  g.add(hose);
  shadows(g); g.traverse((o) => o.layers.enable(1));
  return { g, wall, water, ice, needle, pcv, ptex, knob, logo, dialG, pkey: '' };
}
const V = (...a) => a;
function drawPulse(K, t, rate) {   // a pulse trace that scrolls; beats come faster when the rate goes up
  const key = (t * 24) | 0; if (key === K.pkey) return; K.pkey = key;
  const x = K.pcv.getContext('2d'), w = K.pcv.width, h = K.pcv.height; x.fillStyle = '#0c1214'; x.fillRect(0, 0, w, h);
  x.strokeStyle = 'rgba(120,200,170,0.12)'; x.lineWidth = 2; for (let k = 1; k < 8; k++) { x.beginPath(); x.moveTo((k / 8) * w, 0); x.lineTo((k / 8) * w, h); x.stroke(); }
  txt(x, 'HEART', w * 0.05, h * 0.13, { font: '700 46px "Geist Mono"', color: '#7fd8b4', align: 'left', track: 4 });
  // the phase of beats, integrated over time so the trace speeds up without jumping
  const beatAt = (tt) => W.beatPhase(tt);
  x.strokeStyle = '#8ff0c8'; x.lineWidth = 7; x.lineJoin = 'round'; x.beginPath();
  for (let i = 0; i <= 200; i++) { const u = i / 200, tt = t - (1 - u) * 2.6, ph = beatAt(tt) % 1;
    const yv = ph < 0.06 ? -Math.sin((ph / 0.06) * Math.PI) * 0.12 : ph < 0.1 ? 0 : ph < 0.13 ? -((ph - 0.1) / 0.03) * 0.85 : ph < 0.16 ? -0.85 + ((ph - 0.13) / 0.03) * 1.15 : ph < 0.19 ? 0.3 - ((ph - 0.16) / 0.03) * 0.3 : ph < 0.4 ? -Math.sin(((ph - 0.19) / 0.21) * Math.PI) * 0.2 : 0;
    const X0 = w * 0.04 + u * w * 0.92, Y0 = h * 0.62 + yv * h * 0.38; if (i === 0) x.moveTo(X0, Y0); else x.lineTo(X0, Y0); }
  x.stroke(); K.ptex.needsUpdate = true;
}

//@HANDS@

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
  // the jaw on its own hinge, so it can chatter
  const at = R.seg.Atlas; W.body.updateMatrixWorld(true);
  W.jawG = new THREE.Group(); W.jawG.position.copy(new THREE.Vector3(0, 1.668, -0.003)).sub(at.pivot); at.g.add(W.jawG); at.g.updateMatrixWorld(true);
  for (const m of meshes) if (/^mandible$|lower .*tooth/i.test(m.userData.name)) W.jawG.attach(m);
  W.wristL = makeWrist(R, 'Left'); W.wristR = makeWrist(R, 'Right');
  W.handL = rigHand(R, 'Left', W.wristL); W.handR = rigHand(R, 'Right', W.wristR); W.handL.wr = W.wristL; W.handR.wr = W.wristR;
  // ---- the set
  W.shower = makeShower(scene); W.water = makeWater(scene, W.shower.HY); W.steam = makeSteam(scene);
  W.sick = makeSick(scene); W.hundred = makeHundred(scene); W.review = makeReview(scene); W.lift = makeLift(scene); W.cold = makeCold(scene); W.tank = makeTank(scene);
  // ---- the hug, solved once: each hand on the other arm, forearms across the chest
  poseStand(0, true); W.body.updateMatrixWorld(true); W.hug = solveHug();
  // ---- the factory stamp, on the tank where a maker marks a stock tank
  { const wl = W.tank.wall; wl.updateMatrixWorld(true); const wp = new THREE.Vector3(); wl.getWorldPosition(wp);
    W.stampSpot = stampSpot(wl, { from: [0, 0.18, TANK.r + 0.3], dir: [0, 0, -1], spread: 0.004 });
    if (W.stampSpot) W.stamp = stamp(wl, { canvas: stampCanvas(['HUMAN FACTORY', 'SETTINGS'], '', { frame: true }), center: W.stampSpot.center, normal: W.stampSpot.normal, up: [0, 1, 0], width: 0.15, depth: 0.03, opacity: 0.5 }); }
  // ---- light
  W.key = spot(scene, { color: 0xdfe6ff, pos: new THREE.Vector3(SK.x + 1.3, 3.0, 2.2), target: new THREE.Vector3(SK.x, 1.1, 0), angle: 0.42, penumbra: 0.8, shadow: true, size: cfg.shadow ?? 1024 }); W.key.shadow.camera.far = 8;
  W.rim = spot(scene, { color: 0xa9c4ff, pos: new THREE.Vector3(SK.x - 1.2, 2.6, 0.9), target: new THREE.Vector3(SK.x, 1.2, 0), angle: 0.45, penumbra: 0.9 });
  W.fill = spot(scene, { color: 0xc8d6ff, pos: new THREE.Vector3(SK.x - 1.0, 1.4, 2.2), target: new THREE.Vector3(SK.x, 1.0, 0.2), angle: 0.55, penumbra: 1 });
  const sp = (x, y, z, tx, ty, tz, a = 0.3, I = 8) => { const L = spot(scene, { color: 0xfff1d8, pos: new THREE.Vector3(x, y, z), target: new THREE.Vector3(tx, ty, tz), angle: a, penumbra: 0.7 }); L.userData.I = I; return L; };
  W.lights = [sp(PANEL.x + 0.2, 2.8, 1.4, PANEL.x, 1.45, WALL_Z, 0.32, 6), sp(S1.x + 0.2, 2.5, 1.4, S1.x, S1.y, S1.z, 0.3), sp(S2.x + 0.2, 2.5, 1.4, S2.x, S2.y, S2.z, 0.3),
    sp(S3.x + 0.2, 2.5, 1.4, S3.x, 1.15, S3.z, 0.3), sp(S4.x + 0.2, 2.4, 1.3, S4.x, S4.top + 0.3, S4.z, 0.3), sp(S5.x - 0.4, 2.6, 1.5, S5.x - 0.25, 0.8, S5.z, 0.42, 9),
    sp(S6.x + 0.25, 2.7, 1.6, S6.x + 0.1, 0.6, S6.z, 0.4, 10), sp(CHILL.x + 0.1, 1.6, CHILL.z + 0.9, CHILL.x, CHILL.y, CHILL.z, 0.2, 5)];
  return { hug: W.hug && [W.hug.Right.err, W.hug.Left.err], stamp: W.stampSpot && W.stampSpot.center };
}

// ------------------------------------------------------------------ the body: in the shower; on the stool; in the tank
function where(t) { return t < SWAP1 ? 'shower' : t < SWAP2 ? 'stool' : 'tank'; }
const STAND_ARM = { dir: [0.08, -1, 0.04], twist: 0.1, elbow: 0.12 };
const hugOn = (t) => where(t) === 'shower' ? ss(T.showers + 0.25, T.showers + 0.85, t) : 1;
const chatter = (t) => {   // teeth: open a little, shut, at about seven a second; none while the warning is said
  const on = where(t) === 'shower' ? ss(T.showers + 0.4, T.showers + 0.7, t) : where(t) === 'stool' ? ss(T.with2 - 0.4, T.with2, t) : 0;
  if (on <= 0) return 0; const ph = t * 7.3 + 0.3 * Math.sin(t * 2.1), f = ph - Math.floor(ph), kick = 0.6 + 0.4 * hash(Math.floor(ph));
  return on * 0.07 * kick * (f < 0.4 ? Math.sin((f / 0.4) * Math.PI) : 0);
};
const shiver = (t) => (where(t) === 'tank' ? 0 : hugOn(t));
function poseStand(t, solving = false) {
  const R = W.rig, sh = solving ? 0 : shiver(t);
  W.body.quaternion.identity(); W.body.position.set(SK.x + sh * 0.0016 * Math.sin(t * 71), -W.ground, SK.z - R.P0.z + sh * 0.001 * Math.sin(t * 53));
  R.pelvis.position.copy(R.P0); R.pelvis.rotation.set(0, 0, 0);
  bendSpine(R.seg, { lum: 0.02, tho: 0.06 + 0.04 * (solving ? 1 : hugOn(t)), cer: 0.08 * (solving ? 1 : hugOn(t)) });
  W.body.updateMatrixWorld(true);
  for (const Side of ['Right', 'Left']) { const G = R.legs[Side], b = W.body.position; legIK(R, Side, new THREE.Vector3(b.x + G.A.x, b.y + G.A.y, b.z + G.A.z), new THREE.Quaternion(), Z); }
  if (!solving) armsHug(hugOn(t));
  else for (const Side of ['Right', 'Left']) { poseArm(R.arms[Side], STAND_ARM); setWrist(Side === 'Left' ? W.wristL : W.wristR, STAND_ARM); }
}
function armsHug(k) {
  const R = W.rig;
  for (const Side of ['Right', 'Left']) { const p = W.hug ? mixArm(STAND_ARM, W.hug[Side], k) : STAND_ARM; poseArm(R.arms[Side], p); setWrist(Side === 'Left' ? W.wristL : W.wristR, p); }
  W.handL.curl(0.15 + 0.45 * k); W.handR.curl(0.15 + 0.45 * k);
}
function solveHug() {   // each hand round the other upper arm, forearms across the chest; solved in turns, since each arm moves the other's target
  const R = W.rig, cur = { Right: STAND_ARM, Left: STAND_ARM }, out = {};
  for (let it = 0; it < 3; it++) for (const Side of ['Right', 'Left']) {
    const other = Side === 'Right' ? 'Left' : 'Right', A = R.arms[other];
    poseArm(A, cur[other]); setWrist(other === 'Left' ? W.wristL : W.wristR, cur[other]); R.root.updateMatrixWorld(true);
    const sh = new THREE.Vector3(), el = new THREE.Vector3(); A.arm.getWorldPosition(sh); A.elbow.getWorldPosition(el);
    const at = sh.clone().lerp(el, 0.5).add(new THREE.Vector3(0, 0, Side === 'Right' ? 0.035 : 0.005));   // the right forearm crosses in front of the left
    const r = solveHugArm(R, Side, Side === 'Left' ? W.handL : W.handR, at, it === 0 ? null : cur[Side]);
    cur[Side] = r; out[Side] = r;
  }
  return out;
}
function solveHugArm(R, Side, H, at, start) {   // like solveHand, but the upper arm must hang down and forward, never up
  R.root.updateMatrixWorld(true);
  const A = R.arms[Side], Wr = H.wr, s = A.s, h = new THREE.Vector3(), q = new THREE.Quaternion(), pn = new THREE.Vector3(), dv = new THREE.Vector3();
  const fore = new THREE.Vector3(-s, 0.12, 0.2).normalize(), cl = (v, a, b) => Math.min(b, Math.max(a, v));
  const err = (p) => { poseArm(A, p); setWrist(Wr, p); A.girdle.updateMatrixWorld(true); h.copy(H.handle).applyMatrix4(Wr.g.matrixWorld); let E = h.distanceTo(at);
    Wr.g.getWorldQuaternion(q); E += 0.25 * (1 - pn.set(0, -1, 0).applyQuaternion(q).dot(fore));
    dv.set(p.dir[0], p.dir[1], p.dir[2]).normalize(); E += 3 * Math.max(0, dv.y + 0.6) ** 2 + 1 * Math.max(0, -dv.z) ** 2;
    E += 0.01 * (p.wf ** 2 + 2 * p.wd ** 2 + 0.5 * p.wr ** 2); return E; };
  const descend = (b0) => { let best = { dir: [...b0.dir], twist: b0.twist, elbow: b0.elbow, wf: b0.wf || 0, wd: b0.wd || 0, wr: b0.wr || 0, retract: 0, elevate: 0 }, bestE = err(best);
    for (const st of [0.25, 0.12, 0.06, 0.03, 0.015, 0.007]) for (let it = 0; it < 60; it++) { let improved = false;
      for (const key of ['d0', 'd1', 'd2', 'twist', 'elbow', 'wf', 'wd', 'wr']) for (const sg of [-1, 1]) {
        const c = { ...best, dir: [...best.dir] }; if (key[0] === 'd') c.dir[+key[1]] += sg * st; else c[key] += sg * st * 2;
        c.elbow = cl(c.elbow, 0, 2.6); c.wf = cl(c.wf, -1.1, 1.1); c.wd = cl(c.wd, -0.4, 0.4); c.wr = cl(c.wr, -2.2, 2.2);
        const E = err(c); if (E < bestE) { bestE = E; best = c; improved = true; } }
      if (!improved) break; }
    return { best, bestE }; };
  let out = start ? descend(start) : { best: null, bestE: 9 };
  for (const dir of [[-0.15, -0.85, 0.45], [0.05, -0.9, 0.35], [-0.3, -0.75, 0.6]]) for (const twist of [-0.6, 0.4, 1.2]) for (const elbow of [1.7, 2.2]) {
    const r = descend({ dir, twist, elbow }); if (r.bestE < out.bestE) out = r; }
  poseArm(A, out.best); setWrist(Wr, out.best); A.girdle.updateMatrixWorld(true); h.copy(H.handle).applyMatrix4(Wr.g.matrixWorld);
  return { ...out.best, err: out.bestE, dbg: { pos: +h.distanceTo(at).toFixed(4), at: at.toArray().map((v) => +v.toFixed(3)) } };
}
const sitP = (seatY, x, z) => new THREE.Vector3(x, seatY + W.sitDrop - 0.012, z);
function poseSit(t, P, feetY, feetZ, hugK) {   // seated upright; shins down, feet on a floor
  const R = W.rig, sh = shiver(t);
  W.body.quaternion.identity(); W.body.position.copy(P).add(new THREE.Vector3(-R.P0.x + sh * 0.0015 * Math.sin(t * 71), -R.P0.y, -R.P0.z));
  R.pelvis.position.copy(R.P0); R.pelvis.rotation.set(0, 0, 0);
  bendSpine(R.seg, { lum: 0.04, tho: 0.12, cer: 0.1 });
  W.body.updateMatrixWorld(true);
  for (const Side of ['Right', 'Left']) { const G = R.legs[Side]; G.hip.quaternion.setFromAxisAngle(X, -Math.PI / 2);
    legIK(R, Side, new THREE.Vector3(P.x + G.s * 0.11, feetY + (G.A.y - G.ground), feetZ), new THREE.Quaternion(), Z); }
  armsHug(hugK);
}
function poseBody(t) {
  const w = where(t);
  if (w === 'shower') poseStand(t);
  else if (w === 'stool') poseSit(t, sitP(0.4775, S5.x, S5.z + 0.0), 0, S5.z + 0.38, 1);
  else poseSit(t, sitP(TANK.seat, S6.x, S6.z - 0.2), 0.02, S6.z + 0.2, 1 - 0.0 * gaspK(t));
  // the jaw: chatter; a gasp, held open a moment
  const g = gaspK(t); W.jawG.rotation.x = chatter(t) + 0.26 * g;
  if (where(t) === 'tank') { const hd = R_seg('Atlas'); if (hd) hd.g.rotation.x -= 0.18 * g; const tho = R_seg('Seventh thoracic vertebra'); if (tho) tho.g.rotation.x -= 0.02 * breathK(t) * Math.sin(W.breathPhase(t) * Math.PI * 2); }
  W.body.updateMatrixWorld(true);
}
const R_seg = (n) => W.rig.seg[n];
const gaspK = (t) => s5(T.gasp - 0.12, T.gasp + 0.05, t) * (1 - s5(T.breathing + 0.4, T.faster, t)) + 0.35 * s5(T.breathing, T.breathing + 0.3, t) * (1 - s5(T.harder, T.heart + 0.4, t));
const breathK = (t) => s5(T.breathing - 0.1, T.breathing + 0.3, t) * (1 - s5(T.heart + 0.6, T.shock2 + 1.5, t));
// breathing and the pulse: rates that rise, integrated to a phase so nothing jumps
function rateInt(t, base, peak, t0, t1, t2, t3) { const N = 120, a = 0; let ph = 0; const dt = (t - a) / N; for (let i = 0; i < N; i++) { const tt = a + (i + 0.5) * dt; ph += (base + (peak - base) * ss(t0, t1, tt) * (1 - ss(t2, t3, tt))) * dt; } return ph; }
W.breathPhase = (t) => rateInt(t, 0.25, 2.5, T.breathing - 0.1, T.ten + 0.3, T.heart + 1.0, T.shock2 + 3.0);
W.beatPhase = (t) => rateInt(t, 1.15, 2.6, T.harder - 0.2, T.heart + 0.2, T.shock2 + 1.0, T.healthy);

// ------------------------------------------------------------------ the camera: one path, no cuts
let CAM = null;
function buildCam() {
  const DC = V(CHILL.x, CHILL.y, CHILL.z + 0.131 + 0.0195);
  return camTrack([
    { t: -3.0, p: V(SK.x + 0.06, 1.5, 3.0), l: V(SK.x + 0.02, 1.36, 0.0), fov: 38 },
    { t: 0.0, p: V(SK.x + 0.05, 1.49, 2.92), l: V(SK.x + 0.02, 1.36, 0.0), fov: 38, tens: 0.5 },                          // the shower
    { t: 5.6, p: V(SK.x + 0.04, 1.47, 2.7), l: V(SK.x + 0.02, 1.37, 0.0), fov: 38, stop: true },
    { t: 6.8, p: V(PANEL.x + 0.02, 1.7, 1.85), l: V(PANEL.x, 1.66, WALL_Z), fov: 36, stop: true },                       // the panel: one shower; a month
    { t: 14.15, p: V(PANEL.x + 0.0, 1.69, 1.76), l: V(PANEL.x, 1.66, WALL_Z), fov: 36, stop: true },
    { t: 15.2, p: V(S1.x + 0.02, 1.45, 1.95), l: V(S1.x, 1.42, S1.z), fov: 36, stop: true },                              // sick days
    { t: 22.85, p: V(S1.x + 0.0, 1.44, 1.87), l: V(S1.x, 1.42, S1.z), fov: 36, stop: true },
    { t: 23.75, p: V(S2.x + 0.02, 1.5, 1.98), l: V(S2.x, 1.47, S2.z), fov: 36, stop: true },                              // a hundred
    { t: 28.5, p: V(S2.x + 0.0, 1.49, 1.9), l: V(S2.x, 1.47, S2.z), fov: 36, stop: true },
    { t: 29.5, p: V(S3.x + 0.02, 1.3, 1.45), l: V(S3.x, 1.17, S3.z), fov: 36, stop: true },                               // no proof
    { t: 37.4, p: V(S3.x + 0.0, 1.29, 1.39), l: V(S3.x, 1.17, S3.z), fov: 36, stop: true },
    { t: 38.4, p: V(S4.x + 0.02, 1.32, 1.55), l: V(S4.x, 1.24, S4.z), fov: 36, stop: true },                              // rest or ice
    { t: 45.1, p: V(S4.x + 0.0, 1.31, 1.48), l: V(S4.x, 1.24, S4.z), fov: 36, stop: true },
    { t: 46.1, p: V(S5.x - 0.6, 1.22, 0.95), l: V(S5.x - 0.62, 0.92, 0.08), fov: 36, stop: true },                       // the scale, the fat
    { t: 51.95, p: V(S5.x - 0.6, 1.21, 0.9), l: V(S5.x - 0.62, 0.92, 0.08), fov: 36, stop: true },
    { t: 52.75, p: V(S5.x + 0.2, 1.32, 2.85), l: V(S5.x + 0.18, 1.12, 0.0), fov: 38, stop: true },                       // two hours in the cold
    { t: 54.4, p: V(S5.x + 0.2, 1.31, 2.75), l: V(S5.x + 0.18, 1.12, 0.0), fov: 38, stop: true },
    { t: 54.9, p: V(S5.x + 0.42, 1.45, 0.95), l: V(S5.x + 0.42, 1.4, -0.06), fov: 34, stop: true },                      // a day: the clock, the count
    { t: 55.35, p: V(S5.x + 0.42, 1.45, 0.92), l: V(S5.x + 0.42, 1.4, -0.06), fov: 34, stop: true },
    { t: 56.3, p: V(S6.x + 0.04, 1.2, 2.3), l: V(S6.x + 0.0, 0.92, S6.z), fov: 38, stop: true },                         // the plunge
    { t: 59.45, p: V(S6.x + 0.03, 1.19, 2.2), l: V(S6.x + 0.0, 0.92, S6.z), fov: 38, stop: true },
    { t: 60.15, p: V(S6.x + 0.68, 1.36, 1.02), l: V(S6.x + 0.66, 1.26, 0.12), fov: 34, stop: true },                     // the gauges
    { t: 63.75, p: V(S6.x + 0.68, 1.35, 0.98), l: V(S6.x + 0.66, 1.26, 0.12), fov: 34, stop: true },
    { t: 64.55, p: V(S6.x + 0.02, 1.2, 2.45), l: V(S6.x + 0.0, 0.9, S6.z), fov: 38, stop: true },                        // the warning: still, plain
    { t: 73.5, p: V(S6.x + 0.01, 1.17, 2.15), l: V(S6.x + 0.0, 0.9, S6.z), fov: 38, stop: true },
    { t: 74.9, p: V(CHILL.x + 0.02, CHILL.y + 0.08, CHILL.z + 0.85), l: DC, fov: 32 },
    { t: T.logo, p: V(DC[0], DC[1], DC[2] + LOGO_R / 0.115), l: DC, fov: 30, stop: true },                                 // straight on the dial: the logo
  ]);
}
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

// ------------------------------------------------------------------ one moment of the film
function update(S, t) {
  const scene = S.scene, endDark = ss(T.factory - 0.5, T.logo - 0.3, t);
  poseBody(t);
  // ---- the shower: water; the mixer goes to cold; steam thins out
  const toCold = s5(T.showers - 0.15, T.showers + 0.35, t);
  W.shower.lever.rotation.z = lerp(Math.PI * 0.6, -Math.PI * 0.62, toCold);
  setWater(W.water, t, 1); setSteam(W.steam, t, 1 - ss(T.showers + 0.3, T.supposedly + 1.5, t));
  W.water.m.material.color.setHex(0xdcecff).lerp(new THREE.Color(0xbfe0ff), toCold);
  // ---- one shower in six tiles: five warm, one cold; then the month, tile by tile
  W.shower.rowTiles.forEach((m, k) => { const on = k < 5 ? s5(T.ended + k * 0.18, T.ended + k * 0.18 + 0.2, t) : s5(T.thirty - 0.1, T.thirty + 0.15, t);
    m.material.color.copy(m.userData.c0).lerp(k < 5 ? WARM : ICE, on); m.material.emissive.copy(k < 5 ? WARM : ICE).multiplyScalar(0.08 * on); });
  W.shower.coldTag.material.opacity = s5(T.thirty, T.thirty + 0.3, t);
  W.monthOrder.forEach((i, k) => { const m = W.shower.month[i], a = T.every + k * 0.055, on = s5(a, a + 0.12, t); m.material.color.copy(m.userData.c0).lerp(ICE, on); m.material.emissive.copy(ICE).multiplyScalar(0.08 * on); });
  // ---- sick days: four bars, tile by tile; the cold row of days off sick stops short
  W.sick.bars.forEach((ts, bi) => ts.forEach((m, k) => { const a = (bi < 2 ? T.normal + 0.2 : T.noFewer) + k * (bi < 2 ? 0.17 : 0.09) + (bi % 2) * (bi < 2 ? 0.06 : 0.04);
    const f = m.userData.full; m.visible = f > 0 && t > a; const p = outBack(clamp01((t - a) / 0.22), 1.6); m.scale.set(Math.max(0.0001, clamp01(f) * p), Math.max(0.0001, p), 1);
    m.position.x = -0.15 + 0.02 + k * 0.044 - (1 - clamp01(f)) * 0.02; }));
  // ---- a hundred: 91 turn blue; then 27 of them go back
  { const H = W.hundred, c = new THREE.Color();
    for (let i = 0; i < 100; i++) { const on = i < 91 ? s5(T.t91 - 0.05 + i * 0.008, T.t91 + 0.15 + i * 0.008, t) : 0, off = i >= 64 && i < 91 ? s5(T.t64 + (90 - i) * 0.02, T.t64 + 0.25 + (90 - i) * 0.02, t) : 0;
      c.copy(TILE_DIM).lerp(ICE, on * (1 - off)); H.inst.setColorAt(i, c); }
    H.inst.instanceColor.needsUpdate = true;
    const k2 = s5(T.t64 - 0.1, T.t64 + 0.2, t); drawCount(H, k2 > 0.5 ? 64 : 91, k2 > 0.5 ? 'KEPT GOING' : 'WANTED TO KEEP GOING', s5(T.t91, T.t91 + 0.4, t) * (k2 > 0.5 ? s5(0.5, 1, k2) : 1 - s5(0, 0.5, k2) * 1)); }
  // ---- eleven little tubs; NO PROOF, twice
  W.review.minis.forEach((m, k) => { const a = T.review + k * 0.13; m.scale.setScalar(Math.max(0.0001, outBack(clamp01((t - a) / 0.25), 2.0))); });
  W.review.stamps.forEach((st, i) => { const a = (i ? T.proof + 0.25 : T.no - 0.05), k = clamp01((t - a) / 0.12); st.material.opacity = k > 0 ? 0.95 : 0; st.scale.setScalar(lerp(1.35, 1, outBack(k, 1.2))); });
  // ---- after training: both sections grow; the one with the ice bath grows less
  { const g = s5(T.training - 0.1, T.growth + 0.6, t); W.lift.secs[0].g.scale.setScalar(0.06 * (1 + 0.17 * g)); W.lift.secs[1].g.scale.setScalar(0.06 * (1 + 0.03 * g));
    W.lift.rings.forEach((r) => { r.material.opacity = 0.85 * pulse(t, T.training - 0.2, 45.3, 0.4); }); }
  // ---- the fat lands on the scale; the scale reads it
  { const C = W.cold, a = T.zero - 0.2, u = t - a, h0 = 0.4, y = C.ST.y + 0.032 + 0.0375, fall = Math.min(h0, 0.5 * 9.81 * u * u);
    C.fat.visible = u > 0; C.fat.position.y = y + (h0 - fall) + (u > 0.28 ? 0.004 * Math.exp(-(u - 0.28) * 12) * Math.sin((u - 0.28) * 40) : 0);
    const landed = u > Math.sqrt(2 * h0 / 9.81); drawScale(C, landed ? 0.7 * s5(0, 0.35, u - Math.sqrt(2 * h0 / 9.81)) : 0);
    // the clock: two hours go round while it sits; then the days run to 42
    const hrs = 9 + 2 * s5(T.two, T.inCold + 0.6, t); setClock(C.clock, hrs * 3600, { tick: false });
    drawDays(C, 1 + Math.round(41 * s5(T.aDay - 0.05, T.day2 + 0.25, t))); }
  // ---- the plunge: ice bobs; breathing to ×10; the pulse runs; the chiller's dial goes back to the middle
  { const K = W.tank; K.ice.forEach((c) => { c.position.y = TANK.water + 0.004 + 0.003 * Math.sin(t * 1.3 + c.userData.ph); c.rotation.y += 0; });
    const bk = s5(T.breathing, T.ten + 0.25, t) * (1 - s5(T.heart + 0.8, T.shock2 + 2.0, t)), wob = 0.04 * bk * Math.sin(t * 9);
    K.needle.rotation.z = lerp(Math.PI / 2, -Math.PI / 2, clamp01(bk + wob * 0.2));
    drawPulse(K, t, 0);
    const back = s5(T.back, T.factory + 0.2, t); K.knob.rotation.z = lerp(-Math.PI * 0.55, 0, back);
    const lk = s5(T.back + 0.3, T.logo - 0.25, t); K.logo.set({ weight: lk, white: lk, hours: 0, hand: ss(T.logo - 0.4, T.logo - 0.15, t), handScale: outBack(clamp01((t - (T.logo - 0.4)) / 0.35), 1.8) }); }
  // ---- light: the key follows the skeleton; each station's light stays put
  const fig = 1 - endDark, w = where(t);
  const kx = w === 'shower' ? SK.x : w === 'stool' ? S5.x : S6.x;
  W.key.position.set(kx + 1.3, 3.0, 2.2); W.key.target.position.set(kx, w === 'shower' ? 1.1 : 0.8, 0.0);
  W.rim.position.set(kx - 1.2, 2.6, w === 'shower' ? 0.9 : -1.4); W.rim.target.position.set(kx, 1.0, 0);
  W.fill.position.set(kx - 1.0, 1.4, 2.2); W.fill.target.position.set(kx, 0.9, 0.2);
  W.key.intensity = 11 * fig; W.rim.intensity = 4 * fig; W.fill.intensity = 1.0 * fig;
  for (const L of W.lights) L.intensity = L.userData.I * fig;
  W.lights[7].intensity = W.lights[7].userData.I * (1 - 0.5 * endDark);
  S.tableMat.color.setScalar(0.3 * (1 - endDark * 0.9)); scene.environmentIntensity = 0.12 * (1 - endDark * 0.7); S.reflAmt = 0.5 * (1 - endDark);
}

// ------------------------------------------------------------------ the words on screen
const CAPS = [
  { t0: 0.35, t1: 1.85, top: 300, size: 100, html: 'Cold <em>showers.</em>' },
  { t0: 2.01, t1: 5.6, top: 292, size: 80, html: 'Supposedly, they boost<br><em>immunity</em> and burn <em>fat</em>' },
  { t0: 5.93, t1: 11.55, top: 292, size: 72, html: 'In the biggest trial, Dutch<br>adults ended their shower<br>with <em>30 to 90 seconds</em><br>of cold' },
  { t0: 11.75, t1: 14.1, top: 300, size: 86, html: 'every day<br><em>for a month</em>' },
  { t0: 14.53, t1: 20.55, top: 292, size: 74, html: 'Compared with normal<br>showers, they reported<br><em>29% fewer</em> days off sick' },
  { t0: 20.74, t1: 23.2, top: 292, size: 80, html: 'But <em>no fewer</em> days<br>feeling ill' },
  { t0: 23.51, t1: 26.4, top: 292, size: 84, html: '<em>91%</em> wanted<br>to keep going' },
  { t0: 26.55, t1: 28.7, top: 300, size: 100, html: '<em>64%</em> did.' },
  { t0: 29.03, t1: 31.3, top: 292, size: 86, html: 'Immune boost<br>or <em>better mood?</em>' },
  { t0: 31.49, t1: 37.5, top: 292, size: 74, html: 'A review of 11 trials,<br>mostly cold baths,<br>found <em>no proof</em><br>of either' },
  { t0: 37.89, t1: 39.0, top: 300, size: 100, html: '<em>Lifting?</em>' },
  { t0: 39.2, t1: 45.2, top: 292, size: 70, html: 'In trials, sitting in cold<br>water straight after<br>training may <em>blunt</em><br><em>muscle growth</em>' },
  { t0: 45.63, t1: 46.85, top: 300, size: 100, html: '<em>Fat loss?</em>' },
  { t0: 47.02, t1: 52.15, top: 292, size: 80, html: 'One small trial:<br><em>0.7 kg of fat</em><br>in six weeks' },
  { t0: 52.37, t1: 54.45, top: 292, size: 84, html: 'With two hours<br>in the <em>cold.</em>' },
  { t0: 54.66, t1: 55.65, top: 300, size: 100, html: '<em>A day.</em>' },
  { t0: 56.23, t1: 59.4, top: 292, size: 80, html: 'Cold water can trigger<br><em>cold shock:</em> a gasp,' },
  { t0: 59.52, t1: 63.9, top: 292, size: 76, html: 'breathing up to<br><em>10 times faster,</em><br>a harder-working heart' },
  { t0: 64.41, t1: 69.9, top: 292, size: 74, html: 'Cold shock can cause<br>heart attacks, even in<br>the relatively young<br>and healthy' },
  { t0: 70.11, t1: 71.6, top: 300, size: 100, html: 'Heart condition?' },
  { t0: 71.77, t1: 74.0, top: 300, size: 92, html: 'Ask your<br>doctor first.' },
  { t0: 74.33, t1: 99, top: 360, size: 96, html: 'Back to<br><em>factory settings.</em>' },
];
const OVL = {};
function overlayInit(S) {
  const O = S.O, tag = (cls, txt2, size, bsize) => { const e = O.tag(cls, txt2); e.style.fontSize = size + 'px'; const b = e.querySelector('b'); if (b && bsize) b.style.fontSize = bsize + 'px'; return e; };
  OVL.trial = tag('tag', '3,018 adults<br>in the Netherlands<b>30 days, cold at the end</b>', 22, 32);
  OVL.sick = tag('tag', 'self-reported<b>sickness absence −29%</b>', 22, 32);
  OVL.review = tag('tag', '11 trials,<br>3,177 people<b>10 in baths, 1 in showers</b>', 22, 32);
  OVL.lift = tag('tag', '8 studies<b>quality: fair to poor</b>', 22, 32);
  OVL.fat = tag('tag', '12 young men,<br>17 °C, 2 h a day<b>body fat −0.7 kg<br>in 6 weeks</b>', 22, 32);
}
function overlay(S, t) {
  place(S, OVL.trial, new THREE.Vector3(PANEL.x - 0.38, 1.08, WALL_Z + 0.01), 0, 0, pulse(t, T.dutch + 0.2, 11.5));
  place(S, OVL.sick, new THREE.Vector3(S1.x - 0.3, 1.0, S1.z), 0, -6, pulse(t, T.t29 + 0.3, 20.5));
  place(S, OVL.review, new THREE.Vector3(S3.x - 0.33, 0.93, S3.z + 0.14), 0, 30, pulse(t, T.eleven + 0.6, 37.3));
  place(S, OVL.lift, new THREE.Vector3(S4.x - 0.3, S4.top - 0.04, S4.z + 0.2), 0, -10, pulse(t, T.blunt, 45.0));
  place(S, OVL.fat, new THREE.Vector3(S5.x - 0.62 - 0.21, 0.74, 0.26), 0, 30, pulse(t, T.kilos + 0.3, 51.9));
  const c = new THREE.Vector3(CHILL.x, CHILL.y, CHILL.z + 0.131 + 0.0195);
  logoEnd(S, t, { t0: T.logo, center: c, edge: c.clone().add(new THREE.Vector3(0, LOGO_R, 0)) });
}

makeFilm({
  T, caps: CAPS, subs: [], build, update, pose: camPose, overlay, overlayInit, focus: focusAt,
  stage: { bg: 0x07080a, reflSize: 9, env: 0.12, far: 30 },
  aperture: [[0, 0.004], [6.8, 0.003], [15.2, 0.003], [46.1, 0.003], [52.75, 0.003], [56.3, 0.003], [60.15, 0.003], [74.9, 0.003]],
  bloom: [[0, 0.5], [74, 0.55]],
});

// Human Factory Settings · Film 18 "What do cold showers really do?" (new direction, 7 Oct 2026) · one continuous shot, 9:16.
// A skeleton stands tall under a warm shower; the mixer goes to cold and it screams, then hugs itself and chatters (nothing
// to shiver with, and it chatters anyway). On the shelf, its phone plays the podcast that promised cold showers would fix its
// whole life. On the tiled wall, one shower ends in a cold tile; thirty tiles turn blue, a month. A board of tiles: days off
// sick, fewer; days feeling ill, the same. A week of MEETINGS: a thermometer on every day, then the meetings drop in. Eleven
// little tubs; two cards, immune boost and better mood, stamped NO PROOF. Two muscle sections after training, one with an
// ice bath: it grows less. 700 g of fat on a scale; six weeks, two hours a day, 17 °C; the skeleton on a stool in the cold.
// A cold plunge: a gasp, a racing heart; a checklist to take to the doctor. The chiller's dial goes back to the middle and
// becomes the logo. The factory stamp is on the tank, where a maker marks a stock tank.
// Posture (Sam, 7 Oct 2026, every film from this one on): the skeleton stands tall like an athlete, shoulders back, arms
// relaxed with the palms facing the body (the forearm pronates; never palms up), fingers loosely curled.
import { THREE, ss, s5, lerp, clamp01, hash, camTrack, phys, shadows, spot, RoundedBoxGeometry,
  loadAnatomy, V3, place, logoEnd, makeFilm, outBack, noiseTex, stamp, stampCanvas, stampSpot, softSprite } from '../kit.js';
import { buildRig, skeletonKind, bendSpine, poseArm, legIK, worldVerts, avgV } from '../rig.js';
import { makeLogoRing, makeClock, setClock, makePhone } from '../props.js';

// ------------------------------------------------------------------ timing, from the voice guide (word starts)
const T = {
  end: 80.72, logo: 78.2,
  you: 0.35, scream: 0.8, cold: 1.46, shower: 1.75, every: 2.0, morning: 2.25, because: 2.69, podcast: 3.27, promised: 3.86, fix: 5.17, whole: 5.56, life: 5.79,
  lets: 6.79, see: 7.31, does: 7.73,
  in1: 8.9, biggest: 9.46, dutch: 10.05, ended: 10.8, showerW: 11.35, with1: 12.01, thirty: 12.17, ninety: 12.77, seconds: 13.21, coldW: 13.72, water: 14.19,
  everyDay: 14.53, day: 14.91, month: 15.49,
  they: 16.8, reported: 17.24, about: 17.7, thirty2: 17.85, fewer: 18.64, sick: 19.6, but: 19.77, no: 20.2, fewer2: 20.61, feeling: 21.39, ill: 21.77,
  they2: 22.62, still: 23.06, felt: 23.34, ill2: 23.6, went: 24.12, more: 24.67, meetings: 24.84,
  but3: 26.32, across: 26.71, eleven: 27.16, trials: 27.47, mostly: 27.98, ice: 28.85, baths: 29.01, there: 29.51, no2: 30.01, proof: 30.22, boosts: 31.67, immunity: 32.08, mood: 33.13,
  if1: 34.43, lift: 35.04, skip: 35.5, iceBath: 35.95, straight: 36.6, after: 36.98, training: 37.37, because2: 38.05, inTrials: 38.53, may: 39.54, blunt: 39.95, muscle: 40.37, growth: 40.82,
  and6: 42.19, fatLoss: 42.88, small: 43.55, found: 44.49, people: 44.91, lost: 45.31, seven: 46.09, hundred: 46.52, grams: 46.89, fatW: 47.52, six: 47.98, weeks: 48.34,
  from: 48.66, two: 49.12, hours: 49.46, aDay: 49.99, seventeen: 50.43, degrees: 51.24, celsius: 51.92, hope: 53.37, showers: 53.77, shorter: 54.3,
  plunging: 55.38, triggers: 56.89, gasp: 57.55, racing: 58.23, heart: 58.61, first: 59.42, minute: 59.76, shock: 60.8, cause: 61.22, attacks: 61.63, even: 62.31, young: 63.54, healthy: 63.95, people2: 64.51,
  so: 65.55, heartQ: 66.61, high: 67.32, pressure: 68.17, diabetes: 68.65, poor: 69.8, circulation: 69.97, pregnant: 71.47, talk: 72.16, doctor: 73.05, before: 73.53, start: 74.53,
  final: 75.94, back: 76.82, factory: 77.15, settings: 77.52,
};

// ------------------------------------------------------------------ the set (metres, floor at y = 0); stations along x, each facing +z
const W = {}; window.HFS_W = W;
const X = new THREE.Vector3(1, 0, 0), Y = new THREE.Vector3(0, 1, 0), Z = new THREE.Vector3(0, 0, 1);
const WALL_Z = -0.35;                                                     // the shower's tiled wall
const SK = { x: -0.35, z: 0.02 };                                         // where the skeleton showers
const DIAL = { x: 0.02, y: 1.2 };                                         // the mixer, on the wall
const PANEL = { x: 0.45, i0: 10 };                                        // the month in tiles, right of the shower (wall columns 10..15)
const S1 = { x: 2.0, z: 0.0, y: 1.25 };                                   // days off sick, days feeling ill
const S2 = { x: 3.0, z: 0.0, y: 1.3 };                                    // a week of meetings
const S3 = { x: 4.0, z: 0.0 };                                            // eleven trials, no proof
const S4 = { x: 5.0, z: 0.0, top: 0.84 };                                 // after training: rest, or an ice bath
const S5 = { x: 6.1, z: 0.0 };                                            // the scale; the stool in the cold; the clock
const S6 = { x: 7.9, z: 0.0 };                                           // the cold plunge
const TANK = { r: 0.48, h: 0.6, water: 0.5, seat: 0.27 };
const CHILL = { x: S6.x - 0.78, z: 0.2, y: 0.3 }, DIAL_R = 0.055, LOGO_R = 0.045;
const SWAP1 = 10.0, SWAP2 = 55.0;   // the skeleton moves while no one looks: shower to stool (the camera on the panel); stool to tank (mid-move)
const POD = { x: -0.1, y: 1.42, z: WALL_Z + 0.013 };                    // the phone on its shelf, leaning on the wall, right of the shower
const SIGN = { x: S6.x - 0.5, z: 0.62, y: 0.85 };                        // the checklist on its stand, front left of the tank
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
  const lbMonth = mkPlate(0.6, 0.06, [['EVERY DAY FOR A MONTH', 118, '#eceef1']], PANEL.x + 0.05, TS / 2 + 17 * TS + 0.095);
  const lbOne = mkPlate(0.6, 0.06, [['ONE SHOWER', 118, '#eceef1']], PANEL.x + 0.05, ROW_Y + 0.095);
  lbMonth.material.opacity = 0; lbOne.material.opacity = 0;   // the panel's words come up when the camera is on them
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
  // the phone, on a little chrome shelf right of the shower, leaning on the wall: the podcast plays
  const PB = POD.y - 0.0733;   // the phone's bottom edge
  const shelf = new THREE.Mesh(new RoundedBoxGeometry(0.14, 0.008, 0.07, 2, 0.003), chrome()); shelf.position.set(POD.x, PB - 0.0045, WALL_Z + 0.004 + 0.035); g.add(shelf);
  for (const s of [-1, 1]) { const br = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.006, 0.06), chrome()); br.position.set(POD.x + s * 0.055, PB - 0.03, WALL_Z + 0.004 + 0.022); br.rotation.x = 0.75; g.add(br); }
  const ph = makePhone(); ph.g.rotation.x = Math.PI / 2 - 0.12; ph.g.position.set(POD.x, POD.y, POD.z); g.add(ph.g);
  const pc = document.createElement('canvas'); pc.width = 590; pc.height = 1220; const ptex = new THREE.CanvasTexture(pc); ptex.colorSpace = THREE.SRGBColorSpace; ptex.anisotropy = 8;
  ph.screenMat.map = ptex; ph.screenMat.color.setRGB(0.62, 0.62, 0.62); ph.screenMat.needsUpdate = true;
  shadows(g); g.traverse((o) => o.layers.enable(1)); inst.castShadow = false;
  return { g, month, rowTiles, coldTag, lever, HY, lbMonth, lbOne, pod: { ...ph, pc, ptex, key: '' } };
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

function drawPod(P, t) {   // the podcast: the cover, the promise (lit up as it is said), a progress bar that creeps on
  const hl = [s5(T.fix - 0.08, T.fix + 0.2, t), s5(T.whole - 0.08, T.whole + 0.2, t)], prog = 0.31 + t * 0.0012;
  const key = hl.map((v) => v.toFixed(2)).join() + prog.toFixed(3); if (key === P.key) return; P.key = key;
  const x = P.pc.getContext('2d'), w = 590, h = 1220;
  const bg = x.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, '#151a24'); bg.addColorStop(1, '#0b0d12'); x.fillStyle = bg; x.fillRect(0, 0, w, h);
  txt(x, 'NOW PLAYING', w / 2, 118, { font: '700 34px "Geist Mono"', color: '#8a93a3', track: 6 });
  const cg = x.createLinearGradient(105, 165, 485, 545); cg.addColorStop(0, '#b5e2ff'); cg.addColorStop(1, '#2d6aae');
  x.fillStyle = cg; x.beginPath(); x.roundRect(105, 165, 380, 380, 30); x.fill();
  x.strokeStyle = 'rgba(255,255,255,0.95)'; x.lineWidth = 15; x.lineCap = 'round';   // a snowflake on the cover
  for (let k = 0; k < 3; k++) { const a = k * Math.PI / 3 + Math.PI / 2, ca = Math.cos(a), sa = Math.sin(a); x.beginPath(); x.moveTo(295 - ca * 112, 330 - sa * 112); x.lineTo(295 + ca * 112, 330 + sa * 112); x.stroke();
    for (const e of [-1, 1]) for (const b of [-1, 1]) { const px = 295 + e * ca * 70, py = 330 + e * sa * 70, a2 = a + b * 0.75; x.beginPath(); x.moveTo(px, py); x.lineTo(px + e * Math.cos(a2) * 34, py + e * Math.sin(a2) * 34); x.stroke(); } }
  txt(x, 'ICE MODE', 295, 498, { font: '900 50px Archivo', color: '#ffffff', track: 8 });
  [['COLD SHOWERS', -1], ['WILL FIX YOUR', 0], ['WHOLE LIFE', 1]].forEach(([s, i], j) => { const k = i < 0 ? 0 : hl[i];
    const c = new THREE.Color('#ffffff').lerp(new THREE.Color('#8fd0f6'), k);
    txt(x, s, w / 2, 650 + j * 92, { font: '900 76px Archivo', color: '#' + c.getHexString(), maxW: w * 0.9 }); });
  x.fillStyle = '#2a2f3a'; x.beginPath(); x.roundRect(60, 930, w - 120, 10, 5); x.fill();
  x.fillStyle = '#8fd0f6'; x.beginPath(); x.roundRect(60, 930, (w - 120) * prog, 10, 5); x.fill(); x.beginPath(); x.arc(60 + (w - 120) * prog, 935, 13, 0, 7); x.fill();
  txt(x, '23:41', 60, 980, { font: '700 30px "Geist Mono"', color: '#8a93a3', align: 'left' }); txt(x, '-51:12', w - 60, 980, { font: '700 30px "Geist Mono"', color: '#8a93a3', align: 'right' });
  x.fillStyle = '#e8ebf0';   // back, pause, forward
  for (const [cx, d] of [[150, -1], [440, 1]]) for (const o of [0, 1]) { x.beginPath(); x.moveTo(cx + d * (o * 30 - 15), 1060); x.lineTo(cx + d * (o * 30 + 15), 1085); x.lineTo(cx + d * (o * 30 - 15), 1110); x.closePath(); x.fill(); }
  x.beginPath(); x.arc(295, 1085, 58, 0, 7); x.fill(); x.fillStyle = '#151a24'; x.fillRect(273, 1060, 14, 50); x.fillRect(303, 1060, 14, 50);
  P.ptex.needsUpdate = true;
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

// ------------------------------------------------------------------ a week of meetings: a thermometer on every day; then the meetings drop in
const DAYS5 = ['MON', 'TUE', 'WED', 'THU', 'FRI'];
function thermoIcon() {
  return printed(0.05, 0.05, (x, w, h) => { x.clearRect(0, 0, w, h); const cx = w / 2;
    x.fillStyle = '#f2efe8'; x.beginPath(); x.roundRect(cx - w * 0.1, h * 0.06, w * 0.2, h * 0.64, w * 0.1); x.fill(); x.beginPath(); x.arc(cx, h * 0.76, w * 0.17, 0, 7); x.fill();
    x.fillStyle = '#c62f2a'; x.fillRect(cx - w * 0.045, h * 0.24, w * 0.09, h * 0.5); x.beginPath(); x.arc(cx, h * 0.76, w * 0.11, 0, 7); x.fill();
    x.fillStyle = '#9aa0aa'; for (let k = 0; k < 4; k++) x.fillRect(cx + w * 0.12, h * (0.14 + k * 0.12), w * 0.1, h * 0.025); }, { depthWrite: false });
}
function makeMeetings(scene) {
  const g = new THREE.Group(); g.position.set(S2.x, 0, S2.z); scene.add(g);
  const BW = 0.62, BH = 0.56, CW = 0.108;
  for (const s of [-1, 1]) { const leg = new THREE.Mesh(new THREE.BoxGeometry(0.03, S2.y + BH / 2, 0.03), black()); leg.position.set(s * (BW / 2 - 0.03), (S2.y + BH / 2) / 2, -0.04); g.add(leg); }
  const board = new THREE.Mesh(new RoundedBoxGeometry(BW, BH, 0.025, 3, 0.008), phys({ color: 0x1a1c20, roughness: 0.55, clearcoat: 0.3 })); board.position.set(0, S2.y, -0.015); g.add(board);
  const head = label(0.5, 0.06, [['MEETINGS', 150, '#eceef1']]); head.position.set(0, S2.y + 0.225, 0); g.add(head);
  const cols = DAYS5.map((d, i) => (i - 2) * CW), therms = [], blocks = [];
  const colM = phys({ color: 0x24272d, roughness: 0.7 });
  DAYS5.forEach((d, i) => { const l = label(0.1, 0.032, [[d, 84, '#a3a9b3']]); l.position.set(cols[i], S2.y + 0.165, 0); g.add(l);
    const col = new THREE.Mesh(new RoundedBoxGeometry(CW - 0.008, 0.37, 0.004, 2, 0.0015), colM); col.position.set(cols[i], S2.y - 0.045, 0.0); g.add(col);
    const th = thermoIcon(); th.position.set(cols[i], S2.y + 0.105, 0.0035); th.scale.setScalar(0.0001); g.add(th); therms.push(th); });
  const bm = phys({ color: 0x5b6ee1, roughness: 0.45, clearcoat: 0.4 }), bgeo = new RoundedBoxGeometry(CW - 0.022, 0.05, 0.012, 2, 0.005);
  [3, 4, 3, 4, 3].forEach((n, i) => { for (let k = 0; k < n; k++) { const m = new THREE.Mesh(bgeo, bm); m.userData.y = S2.y + 0.05 - k * 0.06; m.position.set(cols[i], m.userData.y, 0.008); m.visible = false; g.add(m); blocks.push({ m, i, k }); } });
  blocks.sort((a, b) => (a.k - b.k) || (a.i - b.i));   // the top row first, left to right
  shadows(g); g.traverse((o) => o.layers.enable(1));
  return { g, therms, blocks };
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
  const fatTag = label(0.1, 0.022, [['700 G OF FAT', 46, '#e6e8eb']], { bg: '#16171a' }); fatTag.position.set(ST.x, ST.y - 0.015, ST.z + 0.1812); g.add(fatTag);
  // the stool
  const stool = new THREE.Group(); stool.position.set(0, 0, -0.02); g.add(stool);
  const seat = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.035, 48), woodM()); seat.position.y = 0.46; stool.add(seat);
  for (let k = 0; k < 3; k++) { const a = (k / 3) * Math.PI * 2 + 0.3, l = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.012, 0.47, 12), woodM()); l.position.set(Math.cos(a) * 0.12, 0.22, Math.sin(a) * 0.12); l.rotation.set(Math.sin(a) * 0.12, 0, -Math.cos(a) * 0.12); stool.add(l); }
  // the stand at its left: the clock; under its shelf, the day count and the temperature
  const PX = 0.42, pole = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1.7, 16), black()); pole.position.set(PX, 0.85, -0.12); g.add(pole);
  const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.025, 40), black()); foot.position.set(PX, 0.0125, -0.12); g.add(foot);
  const shelf = new THREE.Mesh(new RoundedBoxGeometry(0.26, 0.016, 0.16, 2, 0.005), black()); shelf.position.set(PX, 1.242, -0.07); g.add(shelf);
  const clock = makeClock(); clock.g.scale.setScalar(2.6); clock.g.position.set(PX, 1.25, -0.06); g.add(clock.g);
  const dcv = document.createElement('canvas'); dcv.width = 1100; dcv.height = 300; const dtex = new THREE.CanvasTexture(dcv); dtex.colorSpace = THREE.SRGBColorSpace;
  const days = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.06), new THREE.MeshPhysicalMaterial({ map: dtex, roughness: 0.5 })); days.position.set(PX, 1.19, 0.0115); g.add(days);
  const box = new THREE.Mesh(new RoundedBoxGeometry(0.25, 0.16, 0.12, 3, 0.008), black()); box.position.set(PX, 1.152, -0.05); g.add(box);   // the displays' housing, on the pole
  const temp = label(0.22, 0.06, [['17 °C', 170, '#8fd0f6']], { bg: '#16171a' }); temp.position.set(PX, 1.115, 0.012); temp.material.opacity = 0; g.add(temp);
  shadows(g); g.traverse((o) => o.layers.enable(1));
  return { g, fat, cv, tex, clock, dcv, dtex, key: '', dkey: '', ST, PX, stool, temp };
}
function drawScale(C, gr) { const s = Math.round(gr) + ' g'; if (s === C.key) return; C.key = s; const x = C.cv.getContext('2d'), w = C.cv.width, h = C.cv.height;
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
  const seat = new THREE.Mesh(new RoundedBoxGeometry(0.42, TANK.seat - 0.02, 0.3, 3, 0.02), black()); seat.position.set(0, (TANK.seat - 0.02) / 2 + 0.02, -0.22); g.add(seat); seat.name = 'tank seat';
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
    for (let k = 1; k <= 10; k++) { const a = Math.PI + ((k - 1) / 9) * Math.PI, big = k === 1 || k === 10; x.lineWidth = big ? 10 : 6;
      x.beginPath(); x.moveTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); x.lineTo(cx + Math.cos(a) * (R - (big ? 50 : 30)), cy + Math.sin(a) * (R - (big ? 50 : 30))); x.stroke(); }
    txt(x, 'CALM', cx - R * 0.62, cy - 30, { font: '700 56px "Geist Mono"', color: '#4a4f58' }); txt(x, 'GASP', cx + R * 0.62, cy - 30, { font: '700 56px "Geist Mono"', color: '#c62f2a' }); });
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
  return { g, wall, water, ice, needle, pcv, ptex, knob, logo, dialG, seat, pkey: '' };
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

// ------------------------------------------------------------------ the checklist, by the tank: talk to your doctor first
const CHECKS = ['A HEART CONDITION', 'HIGH BLOOD PRESSURE', 'DIABETES', 'POOR CIRCULATION', 'PREGNANT'];
const SIGN_IN = 64.95, SIGN_OUT = 74.65;   // it springs up while the camera comes to it, and goes before the camera passes it
function makeSign(scene) {
  const g = new THREE.Group(); g.position.set(SIGN.x, 0, SIGN.z); scene.add(g);
  const SW = 0.3, SH = 0.27, PH = SIGN.y - SH / 2 + 0.01;
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, PH, 16), black()); post.position.set(0, PH / 2, -0.03); g.add(post);
  const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 0.02, 40), black()); foot.position.set(0, 0.01, -0.03); g.add(foot);
  const back = new THREE.Mesh(new RoundedBoxGeometry(SW + 0.016, SH + 0.016, 0.014, 3, 0.006), black()); back.position.set(0, SIGN.y, -0.0085); g.add(back);
  const c = document.createElement('canvas'); c.width = 1200; c.height = 1080; const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const card = new THREE.Mesh(new THREE.PlaneGeometry(SW, SH), phys({ map: tex, roughness: 0.6 })); card.position.set(0, SIGN.y, 0.0); g.add(card);
  g.scale.setScalar(0.0001); shadows(g); g.traverse((o) => o.layers.enable(1));
  return { g, c, tex, key: '' };
}
function drawSign(Sg, ks, kd) {   // ks: each line, ticked as it is said (0..1); kd: the doctor
  const key = ks.map((k) => k.toFixed(2)).join() + kd.toFixed(2); if (key === Sg.key) return; Sg.key = key;
  const x = Sg.c.getContext('2d'), w = Sg.c.width, h = Sg.c.height;
  x.fillStyle = '#f2efe8'; x.fillRect(0, 0, w, h); x.fillStyle = '#16181c'; x.fillRect(0, 0, w, h * 0.15);
  txt(x, 'BEFORE YOU START', w / 2, h * 0.078, { font: '800 84px Archivo', color: '#f2efe8', track: 8, maxW: w * 0.9 });
  CHECKS.forEach((s, i) => { const y = h * (0.245 + i * 0.118), k = ks[i], bx = w * 0.07;
    x.globalAlpha = 0.3 + 0.7 * Math.min(1, k * 2); x.strokeStyle = '#26272b'; x.lineWidth = 8; x.strokeRect(bx, y - 30, 60, 60);
    if (k > 0) { x.strokeStyle = '#c62f2a'; x.lineWidth = 14; x.lineCap = 'round'; x.lineJoin = 'round'; x.beginPath(); x.moveTo(bx + 10, y + 2);
      const a = Math.min(1, k / 0.4), b = clamp01((k - 0.4) / 0.6); x.lineTo(bx + 10 + 16 * a, y + 2 + 18 * a); if (b > 0) x.lineTo(bx + 26 + 44 * b, y + 20 - 56 * b); x.stroke(); }
    txt(x, s, w * 0.17, y + 2, { font: '700 64px "Geist Mono"', color: '#26272b', align: 'left', track: 3, maxW: w * 0.78 }); });
  x.globalAlpha = kd; x.fillStyle = '#16181c'; x.fillRect(w * 0.05, h * 0.83, w * 0.9, h * 0.13);
  txt(x, 'TALK TO YOUR DOCTOR FIRST', w / 2, h * 0.895, { font: '800 62px Archivo', color: '#f2efe8', track: 4, maxW: w * 0.84 }); x.globalAlpha = 1;
  Sg.tex.needsUpdate = true;
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
  W.wristL = makeWrist(R, 'Left', { pronate: true }); W.wristR = makeWrist(R, 'Right', { pronate: true });   // forearms that turn: palms to the body
  W.handL = rigHand(R, 'Left', W.wristL); W.handR = rigHand(R, 'Right', W.wristR); W.handL.wr = W.wristL; W.handR.wr = W.wristR;
  // ---- the set
  W.shower = makeShower(scene); W.water = makeWater(scene, W.shower.HY); W.steam = makeSteam(scene);
  W.sick = makeSick(scene); W.meet = makeMeetings(scene); W.sign = makeSign(scene); W.review = makeReview(scene); W.lift = makeLift(scene); W.cold = makeCold(scene); W.tank = makeTank(scene);
  // ---- the hug, solved once: each hand on the other arm, forearms across the chest
  poseStand(0, true); W.body.updateMatrixWorld(true); W.hug = solveHug();
  // ---- the factory stamp, on the tank where a maker marks a stock tank
  { const wl = W.tank.wall; wl.updateMatrixWorld(true); const wp = new THREE.Vector3(); wl.getWorldPosition(wp);
    W.stampSpot = stampSpot(wl, { from: [0, 0.2, TANK.r + 0.3], dir: [0, 0, -1], spread: 0.004 });
    if (W.stampSpot) W.stamp = stamp(wl, { canvas: stampCanvas(['HUMAN FACTORY', 'SETTINGS'], '', { frame: true }), center: W.stampSpot.center, normal: W.stampSpot.normal, up: [0, 1, 0], width: 0.15, depth: 0.03, opacity: 0.5 }); }
  // ---- light
  W.key = spot(scene, { color: 0xdfe6ff, pos: new THREE.Vector3(SK.x + 1.3, 3.0, 2.2), target: new THREE.Vector3(SK.x, 1.1, 0), angle: 0.42, penumbra: 0.8, shadow: true, size: cfg.shadow ?? 1024 }); W.key.shadow.camera.far = 8;
  W.rim = spot(scene, { color: 0xa9c4ff, pos: new THREE.Vector3(SK.x - 1.2, 2.6, 0.9), target: new THREE.Vector3(SK.x, 1.2, 0), angle: 0.45, penumbra: 0.9 });
  W.fill = spot(scene, { color: 0xc8d6ff, pos: new THREE.Vector3(SK.x - 1.0, 1.4, 2.2), target: new THREE.Vector3(SK.x, 1.0, 0.2), angle: 0.55, penumbra: 1 });
  const sp = (x, y, z, tx, ty, tz, a = 0.3, I = 8) => { const L = spot(scene, { color: 0xfff1d8, pos: new THREE.Vector3(x, y, z), target: new THREE.Vector3(tx, ty, tz), angle: a, penumbra: 0.7 }); L.userData.I = I; return L; };
  W.lights = [sp(PANEL.x + 0.2, 2.8, 1.4, PANEL.x, 1.45, WALL_Z, 0.32, 6), sp(S1.x + 0.2, 2.5, 1.4, S1.x, S1.y, S1.z, 0.3), sp(S2.x + 0.2, 2.5, 1.4, S2.x, S2.y, S2.z, 0.3),
    sp(S3.x + 0.2, 2.5, 1.4, S3.x, 1.15, S3.z, 0.3), sp(S4.x + 0.2, 2.4, 1.3, S4.x, S4.top + 0.3, S4.z, 0.3), sp(S5.x - 0.4, 2.6, 1.5, S5.x - 0.25, 0.8, S5.z, 0.42, 9),
    sp(S6.x + 0.25, 2.7, 1.6, S6.x + 0.1, 0.6, S6.z, 0.4, 10), sp(CHILL.x + 0.1, 1.6, CHILL.z + 0.9, CHILL.x, CHILL.y, CHILL.z, 0.2, 5),
    sp(SIGN.x + 0.25, 2.3, 1.7, SIGN.x, SIGN.y, SIGN.z, 0.2, 7)];
  W.auditSolids = [['stool', W.cold.stool], ['tank seat', W.tank.seat]];
  return { hug: W.hug && [W.hug.Right.err, W.hug.Left.err], stamp: W.stampSpot && W.stampSpot.center };
}

// ------------------------------------------------------------------ the body: in the shower; on the stool; in the tank
function where(t) { return t < SWAP1 ? 'shower' : t < SWAP2 ? 'stool' : 'tank'; }
// standing tall: the arms hang relaxed a little out from the thighs, elbows soft, the forearms turned so the palms face the body
const STAND_ARM = { dir: [0.1, -1, 0.0], twist: 0.15, elbow: 0.2, pro: 1.45, wf: 0.08 };
const CHATTER2 = 52.5;   // the teeth start again on the stool as the camera comes to it
const screamK = (t) => s5(T.scream - 0.06, T.scream + 0.12, t) * (1 - s5(T.shower + 0.15, T.shower + 0.5, t));
const hugOn = (t) => where(t) === 'shower' ? s5(T.shower + 0.05, T.shower + 0.6, t) : 1;
const chatter = (t) => {   // teeth: open a little, shut, at about seven a second; none in the tank
  const on = where(t) === 'shower' ? ss(T.shower + 0.45, T.shower + 0.75, t) : where(t) === 'stool' ? ss(CHATTER2 - 0.3, CHATTER2, t) : 0;
  if (on <= 0) return 0; const ph = t * 7.3 + 0.3 * Math.sin(t * 2.1), f = ph - Math.floor(ph), kick = 0.6 + 0.4 * hash(Math.floor(ph));
  return on * 0.07 * kick * (f < 0.4 ? Math.sin((f / 0.4) * Math.PI) : 0);
};
const shiver = (t) => (where(t) === 'tank' ? 0 : hugOn(t));
function poseStand(t, solving = false) {
  const R = W.rig, sh = solving ? 0 : shiver(t), hk = solving ? 1 : hugOn(t);
  W.body.quaternion.identity(); W.body.position.set(SK.x + sh * 0.0016 * Math.sin(t * 71), -W.ground, SK.z - R.P0.z + sh * 0.001 * Math.sin(t * 53));
  R.pelvis.position.copy(R.P0); R.pelvis.rotation.set(0, 0, 0);
  bendSpine(R.seg, { lum: 0.0, tho: -0.02 + 0.07 * hk, cer: 0.01 + 0.06 * hk });   // tall; hunched only once it hugs itself against the cold
  W.body.updateMatrixWorld(true);
  for (const Side of ['Right', 'Left']) { const G = R.legs[Side], b = W.body.position; legIK(R, Side, new THREE.Vector3(b.x + G.A.x, b.y + G.A.y, b.z + G.A.z), new THREE.Quaternion(), Z); }
  if (!solving) armsHug(hk);
  else for (const Side of ['Right', 'Left']) { poseArm(R.arms[Side], STAND_ARM); setWrist(Side === 'Left' ? W.wristL : W.wristR, STAND_ARM); }
}
function armsHug(k) {
  const R = W.rig;
  for (const Side of ['Right', 'Left']) { const p = W.hug ? mixArm(STAND_ARM, W.hug[Side], k) : STAND_ARM; poseArm(R.arms[Side], p); setWrist(Side === 'Left' ? W.wristL : W.wristR, p);
    R.arms[Side].girdle.rotation.set(0, SHOULDERS_BACK * (1 - k) * R.arms[Side].s, 0); }   // shoulders back while it stands tall
  W.handL.curl(0.3 + 0.3 * k); W.handR.curl(0.3 + 0.3 * k);
}
const SHOULDERS_BACK = 0.06;
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
function solveHugArm(R, Side, H, at, start) {   // like solveHand, but the upper arm must hang down and forward, never up; the forearm turns (pro), the wrist barely
  R.root.updateMatrixWorld(true);
  const A = R.arms[Side], Wr = H.wr, s = A.s, h = new THREE.Vector3(), q = new THREE.Quaternion(), pn = new THREE.Vector3(), dv = new THREE.Vector3();
  const fore = new THREE.Vector3(-s, 0.12, 0.2).normalize(), cl = (v, a, b) => Math.min(b, Math.max(a, v));
  const err = (p) => { poseArm(A, p); setWrist(Wr, p); A.girdle.updateMatrixWorld(true); h.copy(H.handle).applyMatrix4(Wr.g.matrixWorld); let E = h.distanceTo(at);
    Wr.g.getWorldQuaternion(q); E += 0.25 * (1 - pn.set(0, -1, 0).applyQuaternion(q).dot(fore));
    dv.set(p.dir[0], p.dir[1], p.dir[2]).normalize(); E += 3 * Math.max(0, dv.y + 0.6) ** 2 + 1 * Math.max(0, -dv.z) ** 2;
    E += 0.01 * (p.wf ** 2 + 2 * p.wd ** 2) + 0.06 * p.wr ** 2; return E; };
  const descend = (b0) => { let best = { dir: [...b0.dir], twist: b0.twist, elbow: b0.elbow, wf: b0.wf || 0, wd: b0.wd || 0, wr: b0.wr || 0, pro: b0.pro ?? 1.6, retract: 0, elevate: 0 }, bestE = err(best);
    for (const st of [0.25, 0.12, 0.06, 0.03, 0.015, 0.007]) for (let it = 0; it < 60; it++) { let improved = false;
      for (const key of ['d0', 'd1', 'd2', 'twist', 'elbow', 'wf', 'wd', 'wr', 'pro']) for (const sg of [-1, 1]) {
        const c = { ...best, dir: [...best.dir] }; if (key[0] === 'd') c.dir[+key[1]] += sg * st; else c[key] += sg * st * 2;
        c.elbow = cl(c.elbow, 0, 2.6); c.wf = cl(c.wf, -1.1, 1.1); c.wd = cl(c.wd, -0.4, 0.4); c.wr = cl(c.wr, -0.6, 0.6); c.pro = cl(c.pro, 0, 2.6);
        const E = err(c); if (E < bestE) { bestE = E; best = c; improved = true; } }
      if (!improved) break; }
    return { best, bestE }; };
  let out = start ? descend(start) : { best: null, bestE: 9 };
  for (const dir of [[-0.15, -0.85, 0.45], [0.05, -0.9, 0.35], [-0.3, -0.75, 0.6]]) for (const twist of [-0.6, 0.4, 1.2]) for (const elbow of [1.7, 2.2]) {
    const r = descend({ dir, twist, elbow }); if (r.bestE < out.bestE) out = r; }
  poseArm(A, out.best); setWrist(Wr, out.best); A.girdle.updateMatrixWorld(true); h.copy(H.handle).applyMatrix4(Wr.g.matrixWorld);
  return { ...out.best, err: out.bestE, dbg: { pos: +h.distanceTo(at).toFixed(4), pro: +out.best.pro.toFixed(2), at: at.toArray().map((v) => +v.toFixed(3)) } };
}
const sitP = (seatY, x, z) => new THREE.Vector3(x, seatY + W.sitDrop - 0.012, z);
function poseSit(t, P, feetY, feetZ, hugK) {   // seated upright, a little hunched against the cold; shins down, feet on a floor
  const R = W.rig, sh = shiver(t);
  W.body.quaternion.identity(); W.body.position.copy(P).add(new THREE.Vector3(-R.P0.x + sh * 0.0015 * Math.sin(t * 71), -R.P0.y, -R.P0.z));
  R.pelvis.position.copy(R.P0); R.pelvis.rotation.set(0, 0, 0);
  bendSpine(R.seg, { lum: 0.01, tho: 0.06, cer: 0.05 });
  W.body.updateMatrixWorld(true);
  for (const Side of ['Right', 'Left']) { const G = R.legs[Side]; G.hip.quaternion.setFromAxisAngle(X, -Math.PI / 2);
    legIK(R, Side, new THREE.Vector3(P.x + G.s * 0.11, feetY + (G.A.y - G.ground), feetZ), new THREE.Quaternion(), Z); }
  armsHug(hugK);
}
function poseBody(t) {
  const w = where(t);
  if (w === 'shower') poseStand(t);
  else if (w === 'stool') poseSit(t, sitP(0.4775, S5.x, S5.z + 0.0), 0, S5.z + 0.38, 1);
  else poseSit(t, sitP(TANK.seat, S6.x, S6.z - 0.2), 0.02, S6.z + 0.2, 1);
  // the jaw: a scream as the water goes cold; chatter; a gasp, held open a moment
  const g = gaspK(t), sc = screamK(t); W.jawG.rotation.x = chatter(t) + 0.26 * g + 0.36 * sc;
  if (w === 'shower' && sc > 0) { const hd = R_seg('Atlas'); if (hd) hd.g.rotation.x -= 0.14 * sc; }
  if (w === 'tank') { const hd = R_seg('Atlas'); if (hd) hd.g.rotation.x -= 0.18 * g; const tho = R_seg('Seventh thoracic vertebra'); if (tho) tho.g.rotation.x -= 0.02 * breathK(t) * Math.sin(W.breathPhase(t) * Math.PI * 2); }
  W.body.updateMatrixWorld(true);
}
const R_seg = (n) => W.rig.seg[n];
const gaspK = (t) => s5(T.gasp - 0.12, T.gasp + 0.05, t) * (1 - s5(T.racing, T.heart + 0.35, t)) + 0.3 * s5(T.racing, T.heart + 0.3, t) * (1 - s5(T.attacks, T.even + 0.4, t));
const breathK = (t) => s5(T.gasp - 0.1, T.gasp + 0.3, t) * (1 - s5(T.even, T.people2 + 1.0, t));
// breathing and the pulse: rates that rise, integrated to a phase so nothing jumps
function rateInt(t, base, peak, t0, t1, t2, t3) { const N = 120, a = 0; let ph = 0; const dt = (t - a) / N; for (let i = 0; i < N; i++) { const tt = a + (i + 0.5) * dt; ph += (base + (peak - base) * ss(t0, t1, tt) * (1 - ss(t2, t3, tt))) * dt; } return ph; }
const BREATH = [0.25, 2.2, T.gasp - 0.1, T.racing + 0.3, T.even, T.people2 + 1.5], BEAT = [1.15, 2.6, T.racing - 0.2, T.heart + 0.25, T.even + 0.5, T.so];
W.breathPhase = (t) => rateInt(t, ...BREATH);
W.beatPhase = (t) => rateInt(t, ...BEAT);

// ------------------------------------------------------------------ the camera: one path, no cuts (every shot framed so printed words sit between the
// captions and the bottom fifth, clear of the button column, and the skeleton stays under the captions)
let CAM = null;
const FAT_DROP = T.seven - 0.25;
function buildCam() {
  const DC = V(CHILL.x, CHILL.y, CHILL.z + 0.131 + 0.0195);
  return camTrack([
    { t: -3.0, p: V(SK.x + 0.05, 1.65, 3.35), l: V(SK.x + 0.02, 1.56, 0.0), fov: 38 },
    { t: 0.0, p: V(SK.x + 0.05, 1.64, 3.28), l: V(SK.x + 0.02, 1.56, 0.0), fov: 38, tens: 0.5 },                          // the shower: it screams
    { t: 2.5, p: V(SK.x + 0.04, 1.63, 3.2), l: V(SK.x + 0.02, 1.56, 0.0), fov: 38, stop: true },
    { t: 3.35, p: V(POD.x, 1.448, POD.z + 0.6), l: V(POD.x, 1.448, POD.z), fov: 34, stop: true },                         // the podcast
    { t: 6.5, p: V(POD.x, 1.448, POD.z + 0.57), l: V(POD.x, 1.448, POD.z), fov: 34, stop: true },
    { t: 8.3, p: V(0.54, 1.43, WALL_Z + 2.08), l: V(0.54, 1.415, WALL_Z), fov: 36, stop: true },                         // one shower
    { t: 14.2, p: V(0.54, 1.43, WALL_Z + 2.02), l: V(0.54, 1.415, WALL_Z), fov: 36, stop: true },
    { t: 14.75, p: V(0.54, 1.71, WALL_Z + 2.17), l: V(0.54, 1.7, WALL_Z), fov: 36, stop: true },                         // a month
    { t: 16.3, p: V(0.54, 1.71, WALL_Z + 2.12), l: V(0.54, 1.7, WALL_Z), fov: 36, stop: true },
    { t: 17.05, p: V(2.035, 1.41, 2.18), l: V(2.035, 1.4, 0.0), fov: 36, stop: true },                                  // sick days
    { t: 22.2, p: V(2.035, 1.405, 2.12), l: V(2.035, 1.4, 0.0), fov: 36, stop: true },
    { t: 22.9, p: V(3.04, 1.43, 2.18), l: V(3.04, 1.42, 0.0), fov: 36, stop: true },                                    // meetings
    { t: 25.85, p: V(3.04, 1.425, 2.12), l: V(3.04, 1.42, 0.0), fov: 36, stop: true },
    { t: 26.6, p: V(4.03, 1.26, 1.83), l: V(4.03, 1.23, 0.03), fov: 36, stop: true },                                   // no proof
    { t: 33.9, p: V(4.03, 1.255, 1.77), l: V(4.03, 1.23, 0.03), fov: 36, stop: true },
    { t: 34.6, p: V(5.034, 1.31, 1.83), l: V(5.034, 1.3, -0.05), fov: 36, stop: true },                                 // rest or ice
    { t: 41.6, p: V(5.034, 1.305, 1.77), l: V(5.034, 1.3, -0.05), fov: 36, stop: true },
    { t: 42.4, p: V(5.48, 0.86, 0.92), l: V(5.48, 0.85, 0.0), fov: 36, stop: true },                                    // the scale, the fat
    { t: 47.4, p: V(5.48, 0.858, 0.88), l: V(5.48, 0.85, 0.0), fov: 36, stop: true },
    { t: 48.0, p: V(6.55, 1.42, 1.79), l: V(6.55, 1.41, 0.0), fov: 36, stop: true },                                    // six weeks, two hours a day, 17 °C
    { t: 52.15, p: V(6.55, 1.415, 1.73), l: V(6.55, 1.41, 0.0), fov: 36, stop: true },
    { t: 52.8, p: V(6.3, 1.32, 2.85), l: V(6.28, 1.12, 0.0), fov: 38, stop: true },                                     // it shivers on the stool
    { t: 54.45, p: V(6.3, 1.315, 2.77), l: V(6.28, 1.12, 0.0), fov: 38, stop: true },
    { t: SWAP2, p: V(7.0, 1.2, 2.66), l: V(6.98, 0.98, 0.0), fov: 38 },                                                 // neither the stool nor the tank in view: it moves
    { t: 55.95, p: V(7.85, 0.93, 2.78), l: V(7.85, 0.91, 0.0), fov: 38, stop: true },                                   // the plunge
    { t: 58.2, p: V(7.85, 0.93, 2.72), l: V(7.85, 0.91, 0.0), fov: 38, stop: true },
    { t: 58.85, p: V(8.58, 1.26, 1.4), l: V(8.58, 1.247, 0.146), fov: 34, stop: true },                                 // a racing heart
    { t: 62.1, p: V(8.58, 1.258, 1.36), l: V(8.58, 1.247, 0.146), fov: 34, stop: true },
    { t: 62.8, p: V(7.85, 0.93, 2.76), l: V(7.85, 0.91, 0.0), fov: 38, stop: true },                                    // even the young and healthy
    { t: 64.85, p: V(7.85, 0.93, 2.7), l: V(7.85, 0.91, 0.0), fov: 38, stop: true },
    { t: 65.5, p: V(7.42, 0.92, 1.77), l: V(7.42, 0.905, 0.62), fov: 34, stop: true },                                 // the checklist
    { t: 74.6, p: V(7.42, 0.918, 1.72), l: V(7.42, 0.905, 0.62), fov: 34, stop: true },
    { t: 76.0, p: V(CHILL.x + 0.02, CHILL.y + 0.08, CHILL.z + 0.85), l: DC, fov: 32 },
    { t: T.logo, p: V(DC[0], DC[1], DC[2] + LOGO_R / 0.115), l: DC, fov: 30, stop: true },                                 // straight on the dial: the logo
  ]);
}
const CAM_MOVES = [[2.5, 3.35], [6.5, 8.3], [14.2, 14.75], [16.3, 17.05], [22.2, 22.9], [25.85, 26.6], [33.9, 34.6], [41.6, 42.4], [47.4, 48.0],
  [52.15, 52.8], [54.45, 55.95], [58.2, 58.85], [62.1, 62.8], [64.85, 65.5], [74.6, 76.0]];
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
  // ---- the shower: water; the mixer goes to cold (and it screams); steam thins out; the podcast plays on
  const toCold = s5(T.scream - 0.2, T.scream + 0.2, t);
  W.shower.lever.rotation.z = lerp(Math.PI * 0.6, -Math.PI * 0.62, toCold);
  setWater(W.water, t, 1); setSteam(W.steam, t, 1 - ss(T.scream + 0.2, T.podcast, t));
  W.water.m.material.color.setHex(0xdcecff).lerp(new THREE.Color(0xbfe0ff), toCold);
  if (t < 9) drawPod(W.shower.pod, t);
  // ---- the panel: its words come up; one shower in six tiles, five warm and one cold; then the month, tile by tile
  const panelOut = 1 - s5(T.everyDay - 0.35, T.everyDay - 0.05, t);
  W.shower.lbOne.material.opacity = s5(T.ended - 0.3, T.ended, t) * panelOut;
  W.shower.lbMonth.material.opacity = s5(T.everyDay - 0.2, T.everyDay + 0.1, t);
  W.shower.rowTiles.forEach((m, k) => { const on = k < 5 ? s5(T.ended + k * 0.18, T.ended + k * 0.18 + 0.2, t) : s5(T.thirty - 0.1, T.thirty + 0.15, t);
    m.material.color.copy(m.userData.c0).lerp(k < 5 ? WARM : ICE, on); m.material.emissive.copy(k < 5 ? WARM : ICE).multiplyScalar(0.08 * on); });
  W.shower.coldTag.material.opacity = s5(T.thirty, T.thirty + 0.3, t) * panelOut;
  W.monthOrder.forEach((i, k) => { const m = W.shower.month[i], a = T.everyDay + k * 0.055, on = s5(a, a + 0.12, t); m.material.color.copy(m.userData.c0).lerp(ICE, on); m.material.emissive.copy(ICE).multiplyScalar(0.08 * on); });
  // ---- sick days: four bars, tile by tile; the cold row of days off sick stops short
  W.sick.bars.forEach((ts, bi) => ts.forEach((m, k) => { const a = (bi < 2 ? T.reported + 0.1 : T.no) + k * (bi < 2 ? 0.12 : 0.09) + (bi % 2) * (bi < 2 ? 0.06 : 0.04);
    const f = m.userData.full; m.visible = f > 0 && t > a; const p = outBack(clamp01((t - a) / 0.22), 1.6); m.scale.set(Math.max(0.0001, clamp01(f) * p), Math.max(0.0001, p), 1);
    m.position.x = -0.15 + 0.02 + k * 0.044 - (1 - clamp01(f)) * 0.02; }));
  // ---- the week: a thermometer on every day; then the meetings pop in
  W.meet.therms.forEach((m, i) => { const a = T.still + i * 0.09; m.scale.setScalar(Math.max(0.0001, outBack(clamp01((t - a) / 0.25), 1.8))); });
  W.meet.blocks.forEach((b, j) => { const a = T.more - 0.05 + j * 0.045, u = clamp01((t - a) / 0.22), p = outBack(u, 1.6); b.m.visible = t > a;
    b.m.scale.set(Math.max(0.0001, p), Math.max(0.0001, p), 1); b.m.position.y = b.m.userData.y + 0.012 * (1 - u); });
  // ---- eleven little tubs; NO PROOF, on each card as it is said
  W.review.minis.forEach((m, k) => { const a = T.eleven + k * 0.1; m.scale.setScalar(Math.max(0.0001, outBack(clamp01((t - a) / 0.25), 2.0))); });
  W.review.stamps.forEach((st, i) => { const a = (i ? T.mood : T.immunity) + 0.05, k = clamp01((t - a) / 0.12); st.material.opacity = k > 0 ? 0.95 : 0; st.scale.setScalar(lerp(1.35, 1, outBack(k, 1.2))); });
  // ---- after training: both sections grow; the one with the ice bath grows less
  { const g = s5(T.training - 0.1, T.growth + 0.6, t); W.lift.secs[0].g.scale.setScalar(0.06 * (1 + 0.17 * g)); W.lift.secs[1].g.scale.setScalar(0.06 * (1 + 0.03 * g));
    W.lift.rings.forEach((r) => { r.material.opacity = 0.85 * pulse(t, T.training - 0.2, 41.75, 0.4); }); }
  // ---- the fat lands on the scale and it reads 700 g; six weeks of days; two hours on the clock; 17 °C
  { const C = W.cold, u = t - FAT_DROP, h0 = 0.4, y = C.ST.y + 0.032 + 0.0375, fall = Math.min(h0, 0.5 * 9.81 * u * u), tl = Math.sqrt(2 * h0 / 9.81);
    C.fat.visible = u > 0; C.fat.position.y = y + (h0 - fall) + (u > tl ? 0.004 * Math.exp(-(u - tl) * 12) * Math.sin((u - tl) * 40) : 0);
    drawScale(C, u > tl ? 700 * s5(0, 0.35, u - tl) : 0);
    const hrs = 9 + 2 * s5(T.two, T.aDay + 0.45, t); setClock(C.clock, hrs * 3600, { tick: false });
    drawDays(C, 1 + Math.round(41 * s5(T.six + 0.02, T.weeks + 0.55, t)));
    C.temp.material.opacity = s5(T.seventeen - 0.05, T.seventeen + 0.25, t); }
  // ---- the plunge: ice bobs; the breath gauge swings to GASP; the pulse runs; the chiller's dial goes back to the middle
  { const K = W.tank; K.ice.forEach((c) => { c.position.y = TANK.water + 0.004 + 0.003 * Math.sin(t * 1.3 + c.userData.ph); });
    const bk = s5(T.gasp - 0.1, T.gasp + 0.25, t) * (1 - s5(T.even, T.people2 + 0.8, t)), wob = 0.04 * bk * Math.sin(t * 9);
    K.needle.rotation.z = lerp(Math.PI / 2, -Math.PI / 2, clamp01(0.85 * bk + wob * 0.2));
    if (t > 54.5 && t < 66) drawPulse(K, t, 0);
    const back = s5(T.back - 0.1, T.factory + 0.2, t); K.knob.rotation.z = lerp(-Math.PI * 0.55, 0, back);
    const lk = s5(T.back + 0.2, T.logo - 0.25, t); K.logo.set({ weight: lk, white: lk, hours: 0, hand: ss(T.logo - 0.4, T.logo - 0.15, t), handScale: outBack(clamp01((t - (T.logo - 0.4)) / 0.35), 1.8) }); }
  // ---- the checklist springs up, ticks each line as it is said, then the doctor; it goes before the camera passes
  { const Sg = W.sign, inK = outBack(clamp01((t - SIGN_IN) / 0.35), 1.5), outK = s5(SIGN_OUT, SIGN_OUT + 0.3, t);
    Sg.g.scale.setScalar(Math.max(0.0001, inK * (1 - outK)));
    if (t > SIGN_IN - 0.1 && t < SIGN_OUT + 0.5) drawSign(Sg, [T.heartQ, T.high, T.diabetes, T.poor, T.pregnant].map((a) => s5(a - 0.05, a + 0.35, t)), s5(T.talk - 0.05, T.talk + 0.3, t)); }
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
  { t0: T.you, t1: 2.6, top: 300, size: 88, html: 'You <em>scream</em> through<br>a cold shower<br>every morning' },
  { t0: T.because, t1: 6.65, top: 292, size: 84, html: 'because a <em>podcast</em><br>promised it would fix<br>your <em>whole life</em>.' },
  { t0: T.lets, t1: 8.65, top: 300, size: 92, html: 'Let’s see what<br>it <em>does</em>.' },
  { t0: T.in1, t1: 12.1, top: 292, size: 84, html: 'In the biggest trial,<br>Dutch adults ended<br>their shower with' },
  { t0: T.thirty, t1: 16.45, top: 292, size: 80, html: '<em>30 to 90 seconds</em><br>of cold water every day<br><em>for a month</em>.' },
  { t0: T.they, t1: 19.72, top: 292, size: 84, html: 'They reported about<br><em>30% fewer</em> days<br>off sick,' },
  { t0: T.but, t1: 22.35, top: 300, size: 88, html: 'but <em>no fewer</em> days<br>feeling ill.' },
  { t0: T.they2, t1: 25.95, top: 292, size: 84, html: 'They still felt ill,<br>but they went to<br><em>more meetings</em>.' },
  { t0: T.but3, t1: 29.45, top: 300, size: 84, html: 'But across <em>11 trials</em>,<br>mostly of ice baths,' },
  { t0: T.there, t1: 34.0, top: 292, size: 80, html: 'there was <em>no proof</em><br>that cold water boosts<br>immunity or mood.' },
  { t0: T.if1, t1: 37.95, top: 292, size: 76, html: 'If you lift weights,<br><em>skip the ice bath</em><br>straight after training,' },
  { t0: T.because2, t1: 41.75, top: 292, size: 88, html: 'because in trials<br>it may <em>blunt</em><br><em>muscle growth</em>.' },
  { t0: T.and6, t1: 44.85, top: 300, size: 84, html: 'And for <em>fat loss</em>,<br>one small trial found' },
  { t0: T.people, t1: 48.6, top: 292, size: 84, html: 'people lost about<br><em>700 grams of fat</em><br>in six weeks,' },
  { t0: T.from, t1: 52.6, top: 300, size: 84, html: 'from <em>two hours a day</em><br>at 17 °C.' },
  { t0: 52.94, t1: 54.95, top: 300, size: 88, html: 'I hope your showers<br>are <em>shorter</em>.' },
  { t0: T.plunging, t1: 57.95, top: 300, size: 76, html: 'Plunging into cold water<br>triggers a <em>gasp</em>' },
  { t0: 58.01, t1: 60.0, top: 300, size: 84, html: 'and a <em>racing heart</em><br>in the first minute,' },
  { t0: 60.04, t1: 62.2, top: 300, size: 84, html: 'and that shock can<br>cause <em>heart attacks</em>,' },
  { t0: T.even, t1: 65.2, top: 300, size: 84, html: 'even in fairly young,<br>healthy people.' },
  { t0: T.so, t1: 69.5, top: 292, size: 80, html: 'So if you have a heart<br>condition, high blood<br>pressure, diabetes' },
  { t0: 69.55, t1: 72.05, top: 300, size: 84, html: 'or poor circulation,<br>or you’re pregnant,' },
  { t0: T.talk, t1: 75.45, top: 300, size: 88, html: 'talk to your <em>doctor</em><br>before you start.' },
  { t0: T.final, t1: 99, top: 360, size: 92, html: 'Let’s get you back to<br><em>factory settings.</em>' },
];
function overlayInit(S) {}
function overlay(S, t) {
  const c = new THREE.Vector3(CHILL.x, CHILL.y, CHILL.z + 0.131 + 0.0195);
  logoEnd(S, t, { t0: T.logo, center: c, edge: c.clone().add(new THREE.Vector3(0, LOGO_R, 0)) });
}

// ------------------------------------------------------------------ the timing table the sound reads (timing18.json)
W.timing = { cold: T.scream - 0.2, scream: [T.scream - 0.06, T.shower + 0.5], hug: T.shower + 0.05, chatter: [T.shower + 0.45, CHATTER2], swap: [SWAP1, SWAP2],
  pod: [T.fix, T.whole], row: T.ended, coldTile: T.thirty, month: T.everyDay, sick: T.reported + 0.1, ill: T.no, therms: T.still, meet: T.more - 0.05,
  tubs: T.eleven, stamps: [T.immunity + 0.05, T.mood + 0.05], grow: [T.training - 0.1, T.growth + 0.6], fat: FAT_DROP + Math.sqrt(2 * 0.4 / 9.81),
  days: [T.six + 0.02, T.weeks + 0.55], clock: [T.two, T.aDay + 0.45], temp: T.seventeen, gasp: T.gasp, breath: BREATH, beat: BEAT,
  sign: [SIGN_IN, SIGN_OUT], checks: [T.heartQ, T.high, T.diabetes, T.poor, T.pregnant], doctor: T.talk, knob: T.back, logo: T.logo, moves: CAM_MOVES };

makeFilm({
  T, caps: CAPS, subs: [], build, update, pose: camPose, overlay, overlayInit, focus: focusAt,
  stage: { bg: 0x07080a, reflSize: 9, env: 0.12, far: 30 },
  aperture: [[0, 0.004], [2.6, 0.004], [3.35, 0.002], [6.5, 0.002], [8.3, 0.003], [74.6, 0.003]],
  bloom: [[0, 0.5], [74, 0.55]],
  fast: CAM_MOVES.map(([a, b]) => [a, b, 2]),
});

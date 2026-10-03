// Human Factory Settings · Film 17 "How do I build muscle?" · one continuous shot, 9:16.
// A skeleton strikes a double-biceps pose: nothing bulges (the gag). Beside it, a rack where a heavy dumbbell is labelled
// GROW and a small pink one TONE. Two muscle cross-sections, one trained light, one heavy, every set to the last possible
// rep: they grow alike; heavy wins on maximal strength. A week calendar, twice ticked. A chalkboard of weekly sets: more
// sets, bigger sections. Two weeks with the same sets, split two ways: equal. A sleepless bed: the next day's protein
// building runs 18% short. A chart of protein that stops paying at about 1.6 grams per kilo. On a leg-extension bench,
// a walking stick: a thigh section grows 9%. Balance on one leg. A weight plate, seen from above, becomes the logo; the
// factory stamp is cast into the plate, like a maker's name.
import { THREE, ss, s5, lerp, clamp01, hash, camTrack, phys, shadows, spot, RoundedBoxGeometry,
  loadAnatomy, V3, place, logoEnd, makeFilm, outBack, noiseTex } from '../kit.js';
import { buildRig, skeletonKind, bendSpine, poseArm, legIK, worldVerts, avgV } from '../rig.js';
import { makeLogoRing } from '../props.js';

// ------------------------------------------------------------------ timing, from the voice guide (word starts)
const T = {
  end: 78.86,
  building: 0.35, muscle: 1.07, heavy: 1.89, grow: 3.07, light: 3.27, tone: 4.32,                        // "Building muscle. Heavy weights to grow, light ones to tone."
  t21: 6.05, every: 7.20, last: 8.90, rep: 10.05, lightL: 10.10, heavyL: 11.18, built: 12.08, similar: 12.44, size: 12.99,
  heavyWon: 14.17, maximal: 15.25, strength: 15.78,
  who: 17.41, minimum: 17.85, twice: 19.61, week: 20.18,
  count: 21.99, sets: 22.40, across: 23.27, more: 24.81, weekly: 25.22, perMuscle: 26.39, moreGrowth: 27.37, range: 28.79,
  often: 31.50, equal: 33.97, noReal: 34.95, difference: 35.86, t25: 37.08, preference: 39.73, secret: 40.46,
  sleep: 41.62, sleepless: 44.34, night: 44.97, cut: 45.52, building2: 46.92, t18: 47.53, nextDay: 49.22,
  extra: 50.94, protein: 51.79, little: 52.75, upTo: 52.85, onePoint: 53.77, six: 54.69, kilo: 55.72,
  frail: 58.60, ninety: 58.97, grew: 60.33, thigh: 60.78, nine: 61.60, eightWeeks: 62.59, age: 64.10, slows: 64.70, doesnt: 66.06, stop: 66.63,
  over65: 67.77, who2: 70.01, balance: 70.74, strengthT: 71.39, prevent: 72.52, falls: 73.08,
  back: 74.71, factory: 75.57, settings: 75.87, logo: 76.56,
};

// ------------------------------------------------------------------ the set (metres, floor at y = 0); the skeleton starts at the origin, facing +z
const W = {}; window.HFS_W = W;
const X = new THREE.Vector3(1, 0, 0), Y = new THREE.Vector3(0, 1, 0), Z = new THREE.Vector3(0, 0, 1);
const RACK = { x: 0.78, z: -0.05 };                                       // the dumbbell rack: GROW and TONE
const S1 = { x: 1.72, z: 0.0, top: 0.82 };                                 // light against heavy
const S2 = { x: 2.6, z: -0.05 };                                           // the week calendar
const S3 = { x: 3.42, z: -0.08, y: 1.02 };                                 // the chalkboard of sets
const S4 = { x: 4.3, z: 0.0, top: 0.82 };                                  // two splits, same sets
const S5 = { x: 5.2, z: 0.0 };                                             // the sleepless bed, the bricks
const BRICKS = { x: 0.05, z: 0.22 };                                       // the two towers, in front of the bed (relative to S5)
const S6 = { x: 6.12, z: -0.05, y: 1.02 };                                 // protein's chart
const S7 = { x: 7.05, z: 0.0 };                                            // the bench, the stick, the thigh; balance
const SEAT = 0.5, BENCH_Z = -0.1;
const PLATE = new THREE.Vector3(8.3, 0, 0.5), PLATE_R = 0.18, LOGO_R = 0.105;
const SWAP1 = 20.0, SWAP2 = 64.6;   // the skeleton moves while no one looks: to the bench; to the balance pad
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
const rubber = () => phys({ color: 0x18191c, roughness: 0.75, clearcoat: 0.1 });
const chrome = () => phys({ color: 0xd0d3d8, metalness: 1, roughness: 0.22, clearcoat: 0.4 });
const woodM = () => phys({ color: 0x24170f, roughness: 0.42, clearcoat: 0.5, roughnessMap: noiseTex(7, 256, 0.8, 1.0, 12) });
function printed(w, h, draw, opts = {}) { return new THREE.Mesh(new THREE.PlaneGeometry(w, h), phys({ map: canvasTex(Math.round(w * 4000), Math.round(h * 4000), draw), roughness: 0.6, transparent: true, ...opts })); }
function stand(g, x, z, h, top = 0.3, d = 0.3) {   // a black plinth
  const m = new THREE.Mesh(new RoundedBoxGeometry(top, h, d, 3, 0.01), black()); m.position.set(x, h / 2, z); g.add(m); return m;
}

// ------------------------------------------------------------------ dumbbells (hex heads), a muscle cross-section, gauges
function dumbbell(r = 0.06, len = 0.07, color = 0x18191c) {
  const g = new THREE.Group(), head = phys({ color, roughness: 0.6, clearcoat: 0.25 });
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.0145, 0.0145, 0.13 + 2 * len * 0.2, 24), chrome()); bar.rotation.z = Math.PI / 2; g.add(bar);
  for (const s of [-1, 1]) { const h = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 6), head); h.rotation.z = Math.PI / 2; h.position.x = s * (0.065 + len / 2); g.add(h); }
  shadows(g); return g;
}
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
function bar(g, x, z, y0, h, lab, color = 0xff6a2b) {   // a vertical gauge bar with a label under it
  const frame = new THREE.Mesh(new RoundedBoxGeometry(0.05, h + 0.012, 0.014, 2, 0.004), black()); frame.position.set(x, y0 + h / 2, z); g.add(frame);
  const fill = new THREE.Mesh(new THREE.BoxGeometry(0.036, 1, 0.006), new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.35, roughness: 0.4 })); fill.position.set(x, y0, z + 0.008); g.add(fill);
  const tag = printed(0.12, 0.028, (c2, w, hh) => { c2.clearRect(0, 0, w, hh); txt(c2, lab, w / 2, hh / 2 + 2, { font: '700 64px "Geist Mono"', color: '#c9ccd2', track: 4, maxW: w * 0.95 }); }, { depthWrite: false });
  tag.position.set(x, y0 - 0.028, z + 0.008); g.add(tag);
  return { fill, y0, h, set(k) { const v = Math.max(0.0005, k * h); fill.scale.y = v; fill.position.y = y0 + v / 2; } };
}

// ------------------------------------------------------------------ the rack: GROW and TONE
function makeRack(scene) {
  const g = new THREE.Group(); g.position.set(RACK.x, 0, RACK.z); scene.add(g);
  const steel = black();
  for (const [x, z] of [[-0.42, -0.14], [0.42, -0.14], [-0.42, 0.14], [0.42, 0.14]]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.82, 0.04), steel); p.position.set(x, 0.41, z); g.add(p); }
  for (const [y, z, tilt] of [[0.78, 0.05, -0.25], [0.48, 0.0, -0.25]]) { const sh = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.02, 0.26), steel); sh.position.set(0, y, z); sh.rotation.x = tilt; g.add(sh); }
  const sizes = [[0.05, 0.05], [0.055, 0.055], [0.06, 0.06], [0.065, 0.065]];
  sizes.forEach(([r, l], i) => { const d = dumbbell(r, l); d.position.set(-0.3 + i * 0.2, 0.52, -0.02); g.add(d); });
  const heavy = dumbbell(0.075, 0.085); heavy.position.set(-0.2, 0.83, 0.07); g.add(heavy);
  const lightD = dumbbell(0.034, 0.04, 0xe18fae); lightD.position.set(0.2, 0.81, 0.08); g.add(lightD);
  const mk = (s, w) => { const m = printed(w, 0.05, (x, cw, ch) => { x.fillStyle = '#efe9dc'; x.beginPath(); x.roundRect(0, 0, cw, ch, 30); x.fill(); txt(x, s, cw / 2, ch / 2 + 4, { font: '900 130px Archivo', color: '#16181c', track: 12, maxW: cw * 0.86 }); }); return m; };
  const tGrow = mk('GROW', 0.16), tTone = mk('TONE', 0.13);
  tGrow.position.set(-0.2, 0.705, 0.175); tGrow.rotation.x = -0.25; g.add(tGrow);
  tTone.position.set(0.2, 0.705, 0.175); tTone.rotation.x = -0.25; g.add(tTone);
  shadows(g); g.traverse((o) => o.layers.enable(1));
  return { g };
}

// ------------------------------------------------------------------ light against heavy: two sections grow alike; heavy wins on strength
function makeLightHeavy(scene) {
  const g = new THREE.Group(); g.position.set(S1.x, 0, S1.z); scene.add(g);
  const table = new THREE.Mesh(new RoundedBoxGeometry(0.78, 0.03, 0.4, 3, 0.008), woodM()); table.position.y = S1.top - 0.015; g.add(table);
  stand(g, 0, 0, S1.top - 0.03, 0.7, 0.32);
  const out = {};
  [['LIGHT LOADS', -0.19, dumbbell(0.034, 0.04, 0xe18fae)], ['HEAVY LOADS', 0.19, dumbbell(0.072, 0.08)]].forEach(([lab, x, db], i) => {
    db.position.set(x, S1.top + 0.075, 0.08); db.scale.setScalar(0.85); g.add(db);
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.2, 12), chrome()); post.position.set(x, S1.top + 0.1, -0.06); g.add(post);
    const cs = crossSection(0.062); cs.g.position.set(x, S1.top + 0.29, -0.05); g.add(cs.g);
    const tag = printed(0.16, 0.03, (c2, w, h) => { c2.fillStyle = '#16171a'; c2.beginPath(); c2.roundRect(0, 0, w, h, 30); c2.fill(); txt(c2, lab, w / 2, h / 2 + 2, { font: '700 66px "Geist Mono"', color: '#eceef1', track: 5, maxW: w * 0.88 }); });
    tag.position.set(x, S1.top + 0.004, 0.165); tag.rotation.x = -Math.PI / 2 + 0.6; g.add(tag);
    const b = bar(g, i ? 0.035 : -0.035, -0.04, S1.top + 0.06, 0.3, i ? 'HEAVY' : 'LIGHT'); b.set(0.0);
    out[i ? 'heavy' : 'light'] = { cs, b, db };
  });
  const sign = printed(0.6, 0.05, (c2, w, h) => { c2.fillStyle = '#16171a'; c2.fillRect(0, 0, w, h); txt(c2, 'EVERY SET TO THE LAST POSSIBLE REP', w / 2, h / 2 + 2, { font: '700 76px "Geist Mono"', color: '#ffb36b', track: 4, maxW: w * 0.94 }); });
  sign.position.set(0, S1.top + 0.44, -0.1); g.add(sign);
  const sTag = printed(0.2, 0.026, (c2, w, h) => { c2.clearRect(0, 0, w, h); txt(c2, 'MAXIMAL STRENGTH', w / 2, h / 2 + 2, { font: '700 60px "Geist Mono"', color: '#ffb36b', track: 4, maxW: w * 0.95 }); }, { depthWrite: false });
  sTag.position.set(0, S1.top + 0.395, -0.04); g.add(sTag);
  shadows(g); g.traverse((o) => o.layers.enable(1));
  return { g, ...out, sign };
}

// ------------------------------------------------------------------ the week: twice ticked
const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
function makeWeek(scene) {
  const g = new THREE.Group(); g.position.set(S2.x, 0, S2.z); scene.add(g);
  for (const s of [-1, 1]) { const leg = new THREE.Mesh(new THREE.BoxGeometry(0.025, 1.4, 0.025), black()); leg.position.set(s * 0.32, 0.7, -0.03); leg.rotation.x = 0.06; g.add(leg); }
  const card = printed(0.62, 0.3, (x, w, h) => { x.fillStyle = '#f2efe8'; x.fillRect(0, 0, w, h); x.fillStyle = '#16181c'; x.fillRect(0, 0, w, h * 0.2);
    txt(x, 'THIS WEEK', w / 2, h * 0.1 + 4, { font: '800 120px Archivo', color: '#f2efe8', track: 20 });
    DAYS.forEach((d, i) => { const cx = w * (0.07 + i * 0.143); x.strokeStyle = '#c9c4b8'; x.lineWidth = 6; x.strokeRect(cx - w * 0.06, h * 0.27, w * 0.12, h * 0.64); txt(x, d, cx, h * 0.35, { font: '700 64px "Geist Mono"', color: '#4a4f58', track: 4 }); }); });
  card.position.set(0, 1.12, 0); card.rotation.x = -0.06; g.add(card);
  const ticks = [1, 4].map((i) => { const m = printed(0.07, 0.07, (x, w, h) => { x.clearRect(0, 0, w, h); x.strokeStyle = '#ff6a2b'; x.lineWidth = 40; x.lineCap = 'round'; x.lineJoin = 'round'; x.beginPath(); x.moveTo(w * 0.15, h * 0.55); x.lineTo(w * 0.42, h * 0.82); x.lineTo(w * 0.9, h * 0.18); x.stroke(); }, { depthWrite: false });
    m.position.set(-0.31 + 0.62 * (0.07 + i * 0.143), 1.12 - 0.3 * 0.12, 0.004); m.rotation.x = -0.06; m.material.opacity = 0; g.add(m); return m; });
  shadows(g); g.traverse((o) => o.layers.enable(1));
  return { g, ticks };
}

// ------------------------------------------------------------------ the chalkboard: weekly sets per muscle, three bands; more sets, bigger sections
function chalk(x, w, h) { x.fillStyle = '#1e2421'; x.fillRect(0, 0, w, h); for (let k = 0; k < 900; k++) { x.fillStyle = `rgba(255,255,255,${0.012 + hash(k) * 0.02})`; x.fillRect(hash(k * 3.1) * w, hash(k * 7.7) * h, 40 * hash(k * 1.9), 3); } }
function tally(x, cx, cy, n, s = 1) {   // chalk tally marks, in fives
  x.strokeStyle = 'rgba(236,238,241,0.92)'; x.lineWidth = 9 * s; x.lineCap = 'round';
  for (let i = 0; i < n; i++) { const grp = Math.floor(i / 5), k = i % 5, bx = cx + grp * 120 * s;
    if (k < 4) { x.beginPath(); x.moveTo(bx + k * 22 * s, cy - 40 * s); x.lineTo(bx + k * 22 * s + 4, cy + 40 * s); x.stroke(); }
    else { x.beginPath(); x.moveTo(bx - 12 * s, cy + 30 * s); x.lineTo(bx + 80 * s, cy - 30 * s); x.stroke(); } }
}
function makeBoard(scene) {   // portrait: three bands, one under the other; each band's section sits at its right
  const g = new THREE.Group(); g.position.set(S3.x, 0, S3.z); scene.add(g);
  const BW = 0.6, BH = 0.74, rowF = (i) => 0.3 + i * 0.25;
  for (const s of [-1, 1]) { const leg = new THREE.Mesh(new THREE.BoxGeometry(0.03, S3.y + BH / 2 + 0.03, 0.03), woodM()); leg.position.set(s * (BW / 2 + 0.005), (S3.y + BH / 2 + 0.03) / 2, -0.03); g.add(leg); }
  const board = printed(BW, BH, (x, w, h) => { chalk(x, w, h);
    txt(x, 'WEEKLY SETS PER MUSCLE', w / 2, h * 0.075, { font: '700 100px "Geist Mono"', color: 'rgba(236,238,241,0.85)', track: 8, maxW: w * 0.9 });
    x.strokeStyle = 'rgba(236,238,241,0.22)'; x.lineWidth = 6; x.beginPath(); x.moveTo(w * 0.06, h * 0.14); x.lineTo(w * 0.94, h * 0.14); x.stroke();
    [['UNDER 5', 4], ['5 TO 9', 7], ['10 OR MORE', 12]].forEach(([lab, n], i) => { const cy = h * rowF(i);
      txt(x, lab, w * 0.07, cy - h * 0.05, { font: '700 100px "Geist Mono"', color: '#f1d68c', align: 'left', track: 4 }); tally(x, w * 0.07 + 40, cy + h * 0.05, n, 1.35); }); });
  board.position.set(0, S3.y, 0); g.add(board);
  const frame = new THREE.Mesh(new RoundedBoxGeometry(BW + 0.04, BH + 0.04, 0.02, 3, 0.006), woodM()); frame.position.set(0, S3.y, -0.012); g.add(frame);
  const secs = [0.045, 0.06, 0.072].map((r, i) => { const cs = crossSection(r); cs.g.position.set(BW * 0.27, S3.y + BH / 2 - BH * rowF(i), 0.03); cs.g.scale.setScalar(0.0001); g.add(cs.g); return cs; });
  shadows(g); g.traverse((o) => o.layers.enable(1));
  return { g, secs };
}

// ------------------------------------------------------------------ two splits of the same sets: equal
function makeSplits(scene) {
  const g = new THREE.Group(); g.position.set(S4.x, 0, S4.z); scene.add(g);
  const table = new THREE.Mesh(new RoundedBoxGeometry(0.62, 0.03, 0.4, 3, 0.008), woodM()); table.position.y = S4.top - 0.015; g.add(table);
  stand(g, 0, 0, S4.top - 0.03, 0.54, 0.32);
  // portrait: each week is a column of seven days, standing on the table under its own section
  const col = (big, per) => printed(0.17, 0.42, (x, w, h) => { x.fillStyle = '#f2efe8'; x.fillRect(0, 0, w, h);
    txt(x, 'SAME SETS', w / 2, h * 0.055, { font: '700 60px "Geist Mono"', color: '#7a7f88', track: 4, maxW: w * 0.9 });
    txt(x, big, w / 2, h * 0.128, { font: '700 104px "Geist Mono"', color: '#2b2f36', track: 2, maxW: w * 0.9 });
    DAYS.forEach((d, i) => { const cy = h * (0.235 + i * 0.108);
      txt(x, d, w * 0.07, cy + 2, { font: '700 46px "Geist Mono"', color: '#8d929b', align: 'left', track: 2 });
      x.strokeStyle = '#d3cec2'; x.lineWidth = 4; x.strokeRect(w * 0.3, cy - h * 0.04, w * 0.64, h * 0.08);
      const n = per[i] || 0; for (let k = 0; k < n; k++) { x.fillStyle = '#ff6a2b'; x.fillRect(w * 0.34 + k * w * 0.095, cy - 24, 48, 48); } }); });
  const a = col('2 DAYS', [6, 0, 0, 6, 0, 0, 0]), b = col('4 DAYS', [3, 0, 3, 0, 3, 0, 3]);
  const CX = 0.13, lean = -0.1;
  [[a, -CX], [b, CX]].forEach(([m, x]) => { m.position.set(x, S4.top + 0.21, 0.07); m.rotation.x = lean; g.add(m);
    const back = new THREE.Mesh(new RoundedBoxGeometry(0.18, 0.43, 0.012, 2, 0.004), black()); back.position.set(x, S4.top + 0.21, 0.063); back.rotation.x = lean; g.add(back);
    const foot = new THREE.Mesh(new RoundedBoxGeometry(0.12, 0.06, 0.06, 2, 0.006), black()); foot.position.set(x, S4.top + 0.03, 0.02); g.add(foot); });
  const ca = crossSection(0.068), cb = crossSection(0.068);
  ca.g.position.set(-CX, S4.top + 0.52, -0.06); cb.g.position.set(CX, S4.top + 0.52, -0.06); g.add(ca.g, cb.g);
  for (const x of [-CX, CX]) { const post = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.52, 12), chrome()); post.position.set(x, S4.top + 0.26, -0.075); g.add(post); }
  const eq = printed(0.06, 0.06, (x, w, h) => { x.clearRect(0, 0, w, h); x.fillStyle = '#ff6a2b'; x.fillRect(w * 0.15, h * 0.32, w * 0.7, h * 0.12); x.fillRect(w * 0.15, h * 0.56, w * 0.7, h * 0.12); }, { depthWrite: false });
  eq.position.set(0, S4.top + 0.52, -0.05); eq.material.opacity = 0; g.add(eq);
  shadows(g); g.traverse((o) => o.layers.enable(1));
  return { g, ca, cb, eq };
}

// ------------------------------------------------------------------ the sleepless bed; the next day's bricks
function makeSleep(scene) {
  const g = new THREE.Group(); g.position.set(S5.x, 0, S5.z); scene.add(g);
  const frame = new THREE.Mesh(new RoundedBoxGeometry(0.62, 0.22, 1.1, 3, 0.02), woodM()); frame.position.set(-0.12, 0.11, -0.45); g.add(frame);
  const mat = new THREE.Mesh(new RoundedBoxGeometry(0.58, 0.12, 1.06, 4, 0.04), phys({ color: 0xd9dde3, roughness: 0.9 })); mat.position.set(-0.12, 0.28, -0.45); g.add(mat);
  const blanket = new THREE.Mesh(new RoundedBoxGeometry(0.6, 0.05, 0.62, 4, 0.02), phys({ color: 0x3c4b66, roughness: 0.85 })); blanket.position.set(-0.12, 0.36, -0.28); blanket.rotation.set(0.05, 0.12, 0.06); g.add(blanket);
  const pillow = new THREE.Mesh(new RoundedBoxGeometry(0.4, 0.09, 0.22, 4, 0.04), phys({ color: 0xeef0f3, roughness: 0.9 })); pillow.position.set(-0.12, 0.38, -0.88); pillow.rotation.y = 0.15; g.add(pillow);
  const night = new THREE.Mesh(new RoundedBoxGeometry(0.22, 0.42, 0.22, 3, 0.01), woodM()); night.position.set(0.33, 0.21, -0.82); g.add(night);
  const clock = printed(0.12, 0.06, (x, w, h) => { x.fillStyle = '#0b0c0e'; x.fillRect(0, 0, w, h); txt(x, '3:47', w / 2, h / 2 + 4, { font: '700 150px "Geist Mono"', color: '#ff5a3c' }); }, { emissive: new THREE.Color(0xff5a3c), emissiveIntensity: 0.25 });
  clock.position.set(0.33, 0.46, -0.72); clock.rotation.y = -0.3; g.add(clock);
  // the bricks: protein building the next day, after a normal night and after none; two towers, the sleepless one 18% shorter
  const wall = new THREE.Group(); wall.position.set(BRICKS.x, 0, BRICKS.z); g.add(wall);
  const PH = 0.36, plinth = new THREE.Mesh(new RoundedBoxGeometry(0.44, PH, 0.14, 3, 0.008), black()); plinth.position.set(0, PH / 2, 0); wall.add(plinth);
  const lab = (a, b, x) => { const m = printed(0.205, 0.085, (c, w, h) => { c.clearRect(0, 0, w, h);
      txt(c, a, w / 2, h * 0.27, { font: '700 70px "Geist Mono"', color: '#9aa0aa', track: 4, maxW: w * 0.96 });
      txt(c, b, w / 2, h * 0.73, { font: '700 86px "Geist Mono"', color: '#e3e5e9', track: 4, maxW: w * 0.96 }); }, { depthWrite: false });
    m.position.set(x, PH - 0.07, 0.0712); wall.add(m); };
  lab('AFTER A', 'NORMAL NIGHT', -0.105); lab('AFTER', 'NO SLEEP', 0.105);
  const BH = 0.031, brick = new THREE.BoxGeometry(0.086, BH, 0.052), bm = phys({ color: 0xb4583f, roughness: 0.85, roughnessMap: noiseTex(13, 128, 0.6, 1.0, 20) });
  const rows = [[-0.105, 10], [0.105, 8.2]].map(([x0, n], ri) => { const bs = [];
    for (let k = 0; k < 10; k++) { const m = new THREE.Mesh(brick, bm), full = Math.min(1, n - k); m.userData.full = full; m.userData.y = PH + k * (BH + 0.0015) + BH * Math.max(0, full) / 2;
      m.position.set(x0 + (hash(k * 5.3 + ri * 17) - 0.5) * 0.008, m.userData.y, (hash(k * 2.9 + ri * 31) - 0.5) * 0.006); m.rotation.y = (hash(k * 7.1 + ri * 13) - 0.5) * 0.06;
      m.visible = false; wall.add(m); bs.push(m); } return bs; });
  shadows(g); g.traverse((o) => o.layers.enable(1));
  return { g, rows };
}

// ------------------------------------------------------------------ protein: a tub, a scoop, a chart that goes flat at about 1.6
function makeProtein(scene) {
  const g = new THREE.Group(); g.position.set(S6.x, 0, S6.z); scene.add(g);
  for (const s of [-1, 1]) { const leg = new THREE.Mesh(new THREE.BoxGeometry(0.025, S6.y + 0.35, 0.025), black()); leg.position.set(s * 0.36, (S6.y + 0.35) / 2, -0.03); g.add(leg); }
  const XS = [0.8, 1.2, 1.6, 2.0, 2.4];
  const cv = (x, w, h, k) => { x.fillStyle = '#f2efe8'; x.fillRect(0, 0, w, h);
    const X0 = w * 0.12, X1 = w * 0.94, Y0 = h * 0.8, Y1 = h * 0.2, ax = (v) => X0 + ((v - 0.6) / 2.0) * (X1 - X0);
    x.strokeStyle = '#26272b'; x.lineWidth = 5; x.beginPath(); x.moveTo(X0, Y1 - 20); x.lineTo(X0, Y0); x.lineTo(X1, Y0); x.stroke();
    XS.forEach((v) => { x.beginPath(); x.moveTo(ax(v), Y0); x.lineTo(ax(v), Y0 + 14); x.stroke(); txt(x, v.toFixed(1), ax(v), Y0 + 44, { font: '700 40px "Geist Mono"', color: '#26272b' }); });
    txt(x, 'GRAMS OF PROTEIN PER KILO A DAY', (X0 + X1) / 2, h * 0.94, { font: '700 40px "Geist Mono"', color: '#4a4f58', track: 4 });
    x.save(); x.translate(w * 0.05, (Y0 + Y1) / 2); x.rotate(-Math.PI / 2); txt(x, 'EXTRA MUSCLE', 0, 0, { font: '700 40px "Geist Mono"', color: '#4a4f58', track: 4 }); x.restore();
    if (k > 0) { x.strokeStyle = '#c2312b'; x.lineWidth = 9; x.lineJoin = 'round'; x.beginPath(); const N = 80;
      for (let i = 0; i <= N * k; i++) { const v = 0.8 + (i / N) * 1.6, y = v < 1.62 ? (v - 0.8) / 0.82 : 1; const yy = Y0 - 20 - (Y0 - Y1 - 40) * (0.15 + 0.7 * Math.sin(Math.min(1, y) * Math.PI / 2));
        if (i === 0) x.moveTo(ax(v), yy); else x.lineTo(ax(v), yy); } x.stroke(); }
    if (k > 0.5) { x.setLineDash([12, 10]); x.strokeStyle = 'rgba(194,49,43,0.6)'; x.lineWidth = 4; x.beginPath(); x.moveTo(ax(1.62), Y0); x.lineTo(ax(1.62), Y1); x.stroke(); x.setLineDash([]); } };
  const c = document.createElement('canvas'); c.width = 2400; c.height = 1600; const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const chart = new THREE.Mesh(new THREE.PlaneGeometry(0.72, 0.48), phys({ map: tex, roughness: 0.6 })); chart.position.set(0, S6.y, 0); g.add(chart);
  const tub = new THREE.Group(); tub.position.set(0.48, 0, 0.2); g.add(tub);
  stand(tub, 0, 0, 0.62, 0.22, 0.22);
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.2, 48), phys({ color: 0x17181c, roughness: 0.4, clearcoat: 0.5 })); body.position.y = 0.72; tub.add(body);
  const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.073, 0.073, 0.03, 48), phys({ color: 0xe7e3da, roughness: 0.4 })); lid.position.y = 0.835; tub.add(lid);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.0702, 0.0702, 0.07, 48, 1, true, -0.9, 1.8), new THREE.MeshBasicMaterial({ transparent: true, map: canvasTex(1024, 256, (x, w, h) => { x.clearRect(0, 0, w, h); txt(x, 'PROTEIN', w / 2, h / 2 + 6, { font: '900 150px Archivo', color: '#eceef1', track: 16 }); }) }));
  band.position.y = 0.72; tub.add(band);
  shadows(g); g.traverse((o) => o.layers.enable(1));
  return { g, c, tex, cv, key: -1, dim: [chart.material, body.material, lid.material, band.material] };
}

// ------------------------------------------------------------------ the bench (leg extension), the walking stick, the thigh's section; the balance pad; the plate
function makeBench(scene) {
  const g = new THREE.Group(); g.position.set(S7.x, 0, S7.z); scene.add(g);
  const pad = phys({ color: 0x1e1f23, roughness: 0.7, clearcoat: 0.15 });
  const seat = new THREE.Mesh(new RoundedBoxGeometry(0.42, 0.08, 0.5, 4, 0.03), pad); seat.position.set(0, SEAT - 0.04, BENCH_Z); g.add(seat);
  const backrest = new THREE.Mesh(new RoundedBoxGeometry(0.42, 0.6, 0.08, 4, 0.03), pad); backrest.position.set(0, SEAT + 0.3, BENCH_Z - 0.29); backrest.rotation.x = -0.15; g.add(backrest);
  const frame = new THREE.Mesh(new RoundedBoxGeometry(0.1, SEAT - 0.08, 0.5, 3, 0.01), black()); frame.position.set(0, (SEAT - 0.08) / 2, BENCH_Z); g.add(frame);
  const stack = new THREE.Mesh(new RoundedBoxGeometry(0.16, 0.9, 0.12, 3, 0.01), black()); stack.position.set(-0.34, 0.45, BENCH_Z - 0.2); g.add(stack);
  // the lever: pivots at the knee line, its roller pad rests on the shins
  const lever = new THREE.Group(); lever.position.set(0, SEAT - 0.02, BENCH_Z + 0.26); g.add(lever);
  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.44, 0.03), black()); arm.position.set(0.25, -0.22, 0); lever.add(arm);
  const pivot = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.06, 20), black()); pivot.rotation.z = Math.PI / 2; pivot.position.set(0.25, 0, 0); lever.add(pivot);
  const roller = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.42, 32), pad); roller.rotation.z = Math.PI / 2; roller.position.set(0.0, -0.4, 0.06); lever.add(roller);
  const rollRod = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.5, 12), chrome()); rollRod.rotation.z = Math.PI / 2; rollRod.position.set(0.02, -0.4, 0.06); lever.add(rollRod);
  // the walking stick, leaning
  const stick = new THREE.Group(); stick.position.set(0.3, 0, BENCH_Z - 0.05); stick.rotation.z = 0.18; g.add(stick);
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.012, 0.86, 16), phys({ color: 0x3a2516, roughness: 0.45, clearcoat: 0.6 })); shaft.position.y = 0.43; stick.add(shaft);
  const crook = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.012, 12, 32, Math.PI), phys({ color: 0x3a2516, roughness: 0.45, clearcoat: 0.6 })); crook.position.set(-0.045, 0.86, 0); stick.add(crook);
  const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.03, 16), rubber()); tip.position.y = 0.015; stick.add(tip);
  // the thigh's cross-section, on its own little stand by the bench
  const th = crossSection(0.075); th.g.position.set(-0.42, 1.12, BENCH_Z + 0.12); g.add(th.g);
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.012, 1.0, 12), black()); post.position.set(-0.42, 0.52, BENCH_Z + 0.06); g.add(post);
  // the section's size before the 8 weeks: a dashed white circle, like a measurement drawn on it
  const ringM = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false }), ring = new THREE.Group(); ring.material = ringM;
  for (let k = 0; k < 40; k++) ring.add(new THREE.Mesh(new THREE.RingGeometry(0.0741, 0.0767, 6, 1, (k / 40) * Math.PI * 2, (Math.PI * 2 / 40) * 0.58), ringM));
  ring.position.set(-0.42, 1.12, BENCH_Z + 0.123); g.add(ring);
  // the balance pad, beside the bench
  const bal = new THREE.Mesh(new RoundedBoxGeometry(0.46, 0.06, 0.36, 4, 0.025), phys({ color: 0x2b4a6e, roughness: 0.85 })); bal.position.set(0.62, 0.03, 0.26); g.add(bal);
  shadows(g); g.traverse((o) => o.layers.enable(1));
  return { g, lever, th, ring, bal };
}
function makePlate(scene) {   // a 20 kg plate on the floor; its cast lettering is the factory stamp
  const g = new THREE.Group(); g.position.copy(PLATE); scene.add(g);
  const iron = phys({ color: 0x1b1c20, roughness: 0.5, metalness: 0.4, clearcoat: 0.2, roughnessMap: noiseTex(17, 256, 0.6, 1.0, 10) });
  const P = [[0.026, 0.0], [PLATE_R, 0.0], [PLATE_R, 0.045], [PLATE_R - 0.012, 0.05], [PLATE_R - 0.03, 0.033], [0.06, 0.033], [0.048, 0.045], [0.026, 0.045]].map(([x, y]) => new THREE.Vector2(x, y));
  const body = new THREE.Mesh(new THREE.LatheGeometry(P, 128), iron); g.add(body);
  const letters = new THREE.Mesh(new THREE.RingGeometry(0.075, 0.145, 128), new THREE.MeshStandardMaterial({ transparent: true, roughness: 0.4, metalness: 0.6, color: 0x8c9098, map: canvasTex(1024, 1024, (x, w) => {
    x.clearRect(0, 0, w, w); const c = w / 2; x.fillStyle = '#ffffff';
    const arc = (s, r, a0, flip) => { x.save(); x.translate(c, c); x.font = '800 64px Archivo'; x.letterSpacing = '6px'; const tot = x.measureText(s).width / r; let a = a0 - tot / 2;
      for (const ch of s) { const cw = x.measureText(ch).width / r; x.save(); x.rotate(a + cw / 2); x.translate(0, flip ? r : -r); if (flip) x.rotate(Math.PI); x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(ch, 0, 0); x.restore(); a += cw; } x.restore(); };
    arc('HUMAN FACTORY SETTINGS', w * 0.4, 0, false); arc('20 KG', w * 0.4, Math.PI, true); }) }));
  letters.rotation.x = -Math.PI / 2; letters.position.y = 0.0335; g.add(letters);
  const logo = makeLogoRing(LOGO_R); logo.g.rotation.x = -Math.PI / 2; logo.g.position.y = 0.0465; g.add(logo.g);
  shadows(g); g.traverse((o) => o.layers.enable(1));
  return { g, logo };
}

// ------------------------------------------------------------------ a wrist, and hands that can hold (from film 11, on the wrist)
const HANDBONE = /scaphoid|lunate|triquetral|pisiform|trapezium|trapezoid|capitate|hamate|metacarpal|phalanx of/i;
function makeWrist(R, Side) {
  const A = R.arms[Side], low = (m) => { const vs = worldVerts(m); let mn = 9; for (const v of vs) mn = Math.min(mn, v.y); return avgV(vs.filter((v) => v.y < mn + 0.012)); };
  const P = low(R.byName.get(`${Side} radius`)).lerp(low(R.byName.get(`${Side} ulna`)), 0.5);
  const g = new THREE.Group(); g.position.copy(P).sub(A.EL); A.elbow.add(g);
  for (const m of [...A.elbow.children]) if (m.isMesh && HANDBONE.test(m.userData.name) && m.userData.name.toLowerCase().includes(Side.toLowerCase())) { A.elbow.remove(m); m.position.copy(m.userData.home).sub(P); g.add(m); }
  return { g, P, s: Side === 'Right' ? -1 : 1 };
}
const setWrist = (Wr, p) => Wr.g.rotation.set(p.wf || 0, (p.wr || 0) * Wr.s, (p.wd || 0) * Wr.s, 'YXZ');   // roll (forearm turn), then flex, then tilt
function rigHand(R, Side, Wr) {
  const A = R.arms[Side], side = Side.toLowerCase(), eg = Wr.g, EL = Wr.P, by = (n) => R.byName.get(n);
  const top = (m) => { const vs = worldVerts(m); let mx = -9, mn = 9; for (const v of vs) { mx = Math.max(mx, v.y); mn = Math.min(mn, v.y); } return avgV(vs.filter((v) => v.y > mx - 0.12 * (mx - mn))); };
  const bot = (m) => { const vs = worldVerts(m); let mx = -9, mn = 9; for (const v of vs) { mx = Math.max(mx, v.y); mn = Math.min(mn, v.y); } return avgV(vs.filter((v) => v.y < mn + 0.12 * (mx - mn))); };
  const F = ['index', 'middle', 'ring', 'little'].map((f) => ({ P: by(`Proximal phalanx of ${side} ${f} finger`), M: by(`Middle phalanx of ${side} ${f} finger`), D: by(`Distal phalanx of ${side} ${f} finger`) }));
  const mcpI = top(F[0].P), mcpL = top(F[3].P), fdir = bot(F[1].D).sub(top(F[1].P)).normalize();
  const across = mcpL.clone().sub(mcpI); across.sub(fdir.clone().multiplyScalar(across.dot(fdir))).normalize();
  const n = new THREE.Vector3().crossVectors(fdir, across).normalize(); if (n.z < 0) n.negate();
  const axis = new THREE.Vector3().crossVectors(fdir, n).dot(across) > 0 ? across.clone().negate() : across.clone();
  const joints = [];
  for (const f of F) { const pts = [top(f.P), top(f.M), top(f.D)], gs = []; let parent = eg, pp = EL;
    [f.P, f.M, f.D].forEach((m, i) => { const g = new THREE.Group(); g.position.copy(pts[i]).sub(pp); parent.add(g); m.parent.remove(m); m.position.copy(m.userData.home).sub(pts[i]); g.add(m); gs.push(g); parent = g; pp = pts[i]; }); joints.push(gs); }
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
  const hand = new THREE.Vector3().crossVectors(fdir, across).dot(n) > 0 ? 1 : -1;   // n = hand * (fdir x across)
  return { curl, handle, across: across.clone(), n: n.clone(), fdir: fdir.clone(), eg, hand };
}
function solveHand(R, Side, H, at, init, aims = []) {   // an arm and wrist pose that puts the hand's grip at a world point, with hand directions (local v) turned toward world ones
  R.root.updateMatrixWorld(true);
  const A = R.arms[Side], Wr = H.wr, h = new THREE.Vector3(), q = new THREE.Quaternion(), pn = new THREE.Vector3();
  const err = (p) => { poseArm(A, p); setWrist(Wr, p); A.girdle.updateMatrixWorld(true); h.copy(H.handle).applyMatrix4(Wr.g.matrixWorld); let E = h.distanceTo(at);
    if (aims.length) { Wr.g.getWorldQuaternion(q); for (const a of aims) E += a.w * (1 - pn.copy(a.v).applyQuaternion(q).dot(a.to)); }
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
  for (const dir of [[0.6, 0.8, 0.2], [0.35, 0.7, 0.45], [0.9, 0.35, 0.1], [0.5, 0.5, -0.3], [0.2, -0.2, 0.9]]) for (const twist of [-1.2, -0.4, 0.4, 1.2]) for (const elbow of [1.3, 1.9, 2.4]) {
    if (out.bestE < 0.004) break; const r = descend({ dir, twist, elbow }); if (r.bestE < out.bestE) out = r; }
  poseArm(A, out.best); setWrist(Wr, out.best); A.girdle.updateMatrixWorld(true); h.copy(H.handle).applyMatrix4(Wr.g.matrixWorld); Wr.g.getWorldQuaternion(q);
  const dbg = { pos: +h.distanceTo(at).toFixed(4), dots: aims.map((a) => +pn.copy(a.v).applyQuaternion(q).dot(a.to).toFixed(3)), at: at.toArray().map((v) => +v.toFixed(3)) };
  return { ...out.best, err: out.bestE, dbg };
}
const mixArm = (a, b, k) => ({ dir: a.dir.map((v, i) => lerp(v, b.dir[i], k)), twist: lerp(a.twist, b.twist, k), elbow: lerp(a.elbow, b.elbow, k), wf: lerp(a.wf || 0, b.wf || 0, k), wd: lerp(a.wd || 0, b.wd || 0, k), wr: lerp(a.wr || 0, b.wr || 0, k), retract: 0, elevate: 0 });



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
  W.wristL = makeWrist(R, 'Left'); W.wristR = makeWrist(R, 'Right');
  W.handL = rigHand(R, 'Left', W.wristL); W.handR = rigHand(R, 'Right', W.wristR); W.handL.wr = W.wristL; W.handR.wr = W.wristR;
  // ---- the set
  W.rack = makeRack(scene); W.lh = makeLightHeavy(scene); W.week = makeWeek(scene); W.board = makeBoard(scene); W.splits = makeSplits(scene);
  W.sleep = makeSleep(scene); W.prot = makeProtein(scene); W.bench = makeBench(scene); W.plate = makePlate(scene);
  // ---- the flex, solved once: fists up by its ears
  poseStand(0, true); W.body.updateMatrixWorld(true); W.flex = solveFlex();
  // ---- light
  W.key = spot(scene, { color: 0xdfe6ff, pos: new THREE.Vector3(1.4, 3.0, 2.3), target: new THREE.Vector3(0, 1.1, 0), angle: 0.42, penumbra: 0.8, shadow: true, size: cfg.shadow ?? 1024 }); W.key.shadow.camera.far = 8;
  W.rim = spot(scene, { color: 0xa9c4ff, pos: new THREE.Vector3(-1.4, 2.6, -1.6), target: new THREE.Vector3(0, 1.1, 0), angle: 0.45, penumbra: 0.9 });
  W.fill = spot(scene, { color: 0xc8d6ff, pos: new THREE.Vector3(-1.6, 1.4, 2.0), target: new THREE.Vector3(0, 1.0, 0.2), angle: 0.55, penumbra: 1 });
  const sp = (x, y, z, tx, ty, tz, a = 0.3, I = 8) => { const L = spot(scene, { color: 0xfff1d8, pos: new THREE.Vector3(x, y, z), target: new THREE.Vector3(tx, ty, tz), angle: a, penumbra: 0.7 }); L.userData.I = I; return L; };
  W.lights = [sp(RACK.x + 0.2, 2.4, 1.3, RACK.x, 0.75, RACK.z, 0.3), sp(S1.x + 0.2, 2.4, 1.3, S1.x, S1.top + 0.25, S1.z, 0.3), sp(S2.x + 0.2, 2.4, 1.3, S2.x, 1.1, S2.z, 0.24),
    sp(S3.x + 0.25, 2.5, 1.4, S3.x, S3.y - 0.05, S3.z, 0.32), sp(S4.x + 0.2, 2.4, 1.3, S4.x, S4.top + 0.3, S4.z, 0.3), sp(S5.x + 0.2, 2.5, 1.6, S5.x + 0.03, 0.5, S5.z - 0.05, 0.36),
    sp(S6.x + 0.25, 2.4, 1.4, S6.x + 0.1, S6.y - 0.2, S6.z, 0.34), sp(S7.x + 0.3, 2.6, 1.6, S7.x + 0.1, 0.7, S7.z, 0.4, 9), sp(PLATE.x + 0.2, 1.9, PLATE.z + 0.7, PLATE.x, 0.05, PLATE.z, 0.2, 6)];
  W.lampLight = new THREE.PointLight(0xffc98a, 0.6, 1.4, 2); W.lampLight.position.set(S5.x + 0.33, 0.62, S5.z - 0.82); scene.add(W.lampLight);
  return { flex: W.flex && [W.flex.Right.err, W.flex.Left.err] };
}

// ------------------------------------------------------------------ the body: standing (flex), seated (leg extensions), on one leg (balance)
function where(t) { return t < SWAP1 ? 'stand' : t < SWAP2 ? 'sit' : 'balance'; }
function poseStand(t, solving = false) {
  const R = W.rig, br = 0.5 - 0.5 * Math.cos((t / 4.2) * Math.PI * 2);
  W.body.quaternion.identity(); W.body.position.set(0, -W.ground, -R.P0.z);
  R.pelvis.position.copy(R.P0); R.pelvis.rotation.set(0, 0, 0);
  bendSpine(R.seg, { lum: -0.02, tho: 0.04 + 0.006 * br, cer: -0.02 });
  for (const Side of ['Right', 'Left']) { const G = R.legs[Side]; G.hip.quaternion.setFromAxisAngle(Z, -G.s * 0.05); G.knee.quaternion.identity(); G.ankle.quaternion.setFromAxisAngle(Z, G.s * 0.05); }
  const k = solving ? 0 : s5(T.building - 0.15, T.building + 0.55, t) * (1 - s5(3.6, 4.6, t)), pump = 0.06 * Math.sin(Math.max(0, t - 0.9) * 9) * pulse(t, 0.9, 3.4, 0.3);
  const hang = { dir: [0.12, -1, 0.04], twist: 0.2, elbow: 0.12 };
  for (const Side of ['Right', 'Left']) { const A = R.arms[Side], F = W.flex && W.flex[Side], p = F ? mixArm(hang, { ...F, elbow: F.elbow + pump }, k) : hang; poseArm(A, p); setWrist(Side === 'Left' ? W.wristL : W.wristR, p); }
  W.handL.curl(0.2 + 1.05 * k); W.handR.curl(0.2 + 1.05 * k);   // a tight fist for the flex
}
function solveFlex() {
  const R = W.rig, out = {};
  for (const Side of ['Right', 'Left']) {
    const sh = new THREE.Vector3(); R.arms[Side].arm.getWorldPosition(sh); const s = Side === 'Right' ? -1 : 1, H = Side === 'Left' ? W.handL : W.handR;
    const at = sh.clone().add(new THREE.Vector3(s * 0.24, 0.3, 0.08));
    out[Side] = solveHand(R, Side, H, at, { dir: [1, 0.05, 0], twist: 1.2, elbow: 1.8 }, [{ v: new THREE.Vector3(0, -1, 0), to: Y, w: 0.25 }, { v: H.n, to: new THREE.Vector3(-s * 0.3, 0, 1).normalize(), w: 0.03 }]);
  }
  return out;
}
const sitP = () => new THREE.Vector3(S7.x, SEAT + W.sitDrop - 0.012, BENCH_Z + 0.02);
function poseSit(t) {   // on the bench; the knees straighten against the roller, slowly, and bend again
  const R = W.rig, P = sitP();
  W.body.quaternion.identity(); W.body.position.copy(P).sub(new THREE.Vector3(0, R.P0.y, 0)).add(new THREE.Vector3(0, 0, -R.P0.z));
  W.body.position.copy(P).add(new THREE.Vector3(-R.P0.x, -R.P0.y, -R.P0.z));
  R.pelvis.position.copy(R.P0); R.pelvis.rotation.set(0, 0, 0);
  bendSpine(R.seg, { lum: 0.05, tho: 0.12, cer: 0.1 });
  const ext = extAt(t);
  W.body.updateMatrixWorld(true);
  for (const Side of ['Right', 'Left']) { const G = R.legs[Side]; G.hip.quaternion.setFromAxisAngle(X, -Math.PI / 2);
    const a = lerp(0.0, 1.35, ext), shin = G.L2, kx = P.x + G.s * 0.12, kz = P.z + G.L1 * 0.98, ky = P.y - 0.03;
    const tgt = new THREE.Vector3(kx, ky - Math.cos(a) * shin, kz + Math.sin(a) * shin);
    legIK(R, Side, tgt, new THREE.Quaternion(), Z); }
  const grip = { dir: [0.12, -1, 0.05], twist: 0.2, elbow: 0.25 };
  for (const Side of ['Right', 'Left']) { poseArm(R.arms[Side], grip); setWrist(Side === 'Left' ? W.wristL : W.wristR, grip); }
  W.handL.curl(0.85); W.handR.curl(0.85);
  W.body.updateMatrixWorld(true);
  return ext;
}
function extAt(t) {   // repetitions: up 1.2 s, hold, down 1.4 s
  const t0 = 56.8, per = 3.4; if (t < t0) return 0; const u = ((t - t0) % per) / per;
  return u < 0.35 ? s5(0, 0.35, u) : u < 0.5 ? 1 : 1 - s5(0.5, 0.92, u);
}
function poseBalance(t) {   // on the left foot on the pad, the right knee up, arms out
  const R = W.rig, sway = 0.012 * Math.sin(t * 1.7) + 0.006 * Math.sin(t * 3.1);
  W.body.quaternion.identity(); W.body.position.set(S7.x + 0.66, 0.06 - W.ground, 0.26 - R.P0.z);
  R.pelvis.position.copy(R.P0).add(new THREE.Vector3(0.03, -0.01, 0)); R.pelvis.rotation.set(0, 0, -0.04 + sway);
  bendSpine(R.seg, { lum: 0.02, tho: 0.05, cer: 0.02, side: 0.06 - sway * 2 });
  W.body.updateMatrixWorld(true);
  const GL = R.legs.Left, GR = R.legs.Right, base = W.body.position;
  legIK(R, 'Left', new THREE.Vector3(base.x + GL.A.x + 0.01, base.y + GL.A.y, base.z + GL.A.z), new THREE.Quaternion(), Z);
  legIK(R, 'Right', new THREE.Vector3(base.x + GR.A.x + 0.03, base.y + GR.A.y + 0.3, base.z + GR.A.z + 0.14), new THREE.Quaternion().setFromAxisAngle(X, 0.3), Z);
  const out = { dir: [1, -1.2, 0.12], twist: 0.3, elbow: 0.12 };
  for (const Side of ['Right', 'Left']) { poseArm(R.arms[Side], out); setWrist(Side === 'Left' ? W.wristL : W.wristR, out); }
  W.handL.curl(0.15); W.handR.curl(0.15);
  W.body.updateMatrixWorld(true);
}
function poseBody(t) { const w = where(t); if (w === 'stand') poseStand(t); else if (w === 'sit') poseSit(t); else poseBalance(t); W.body.updateMatrixWorld(true); }

// ------------------------------------------------------------------ the camera: one path, no cuts
let CAM = null;
function buildCam() {
  const Pl = V3(PLATE.x, PLATE.y + 0.0465, PLATE.z), Sp = sitP();
  return camTrack([
    { t: -3.0, p: V3(0.08, 1.46, 3.06), l: V3(0.0, 1.38, 0.0), fov: 38 },
    { t: 0.0, p: V3(0.07, 1.45, 3.0), l: V3(0.0, 1.38, 0.0), fov: 38, tens: 0.5 },                                // the flex: nothing bulges
    { t: 1.85, p: V3(0.08, 1.44, 2.86), l: V3(0.0, 1.39, 0.0), fov: 38, stop: true },
    { t: 2.75, p: V3(RACK.x + 0.02, 1.3, 1.62), l: V3(RACK.x, 0.84, RACK.z), fov: 34, stop: true },               // GROW and TONE
    { t: 4.9, p: V3(RACK.x + 0.0, 1.28, 1.54), l: V3(RACK.x, 0.84, RACK.z + 0.02), fov: 34, stop: true },
    { t: 5.9, p: V3(S1.x + 0.02, 1.4, 1.78), l: V3(S1.x, S1.top + 0.3, S1.z), fov: 34, stop: true },              // light against heavy
    { t: 16.3, p: V3(S1.x + 0.0, 1.38, 1.7), l: V3(S1.x, S1.top + 0.29, S1.z), fov: 34, stop: true },
    { t: 17.4, p: V3(S2.x + 0.02, 1.36, 1.95), l: V3(S2.x, 1.2, S2.z), fov: 34, stop: true },                      // the week
    { t: 20.8, p: V3(S2.x + 0.0, 1.34, 1.88), l: V3(S2.x, 1.2, S2.z), fov: 34, stop: true },
    { t: 22.0, p: V3(S3.x + 0.02, 1.3, 2.38), l: V3(S3.x, 1.22, S3.z), fov: 34, stop: true },                      // the sets
    { t: 30.3, p: V3(S3.x + 0.0, 1.29, 2.3), l: V3(S3.x, 1.22, S3.z), fov: 34, stop: true },
    { t: 31.4, p: V3(S4.x + 0.02, 1.36, 1.98), l: V3(S4.x, 1.28, S4.z - 0.05), fov: 34, stop: true },              // two splits
    { t: 40.9, p: V3(S4.x + 0.0, 1.35, 1.9), l: V3(S4.x, 1.28, S4.z - 0.05), fov: 34, stop: true },
    { t: 42.2, p: V3(S5.x + 0.07, 1.12, 2.5), l: V3(S5.x + 0.05, 0.5, S5.z), fov: 36, stop: true },                // the sleepless bed, the bricks
    { t: 50.4, p: V3(S5.x + 0.06, 1.1, 2.4), l: V3(S5.x + 0.05, 0.5, S5.z), fov: 36, stop: true },
    { t: 51.5, p: V3(S6.x + 0.1, 1.34, 1.72), l: V3(S6.x + 0.1, S6.y + 0.02, S6.z), fov: 34, stop: true },        // protein
    { t: 56.9, p: V3(S6.x + 0.08, 1.32, 1.64), l: V3(S6.x + 0.1, S6.y + 0.02, S6.z), fov: 34, stop: true },
    { t: 58.1, p: V3(S7.x + 1.93, 1.3, 3.3), l: V3(S7.x - 0.08, 1.06, S7.z + 0.08), fov: 40, stop: true },         // the bench, the stick, the thigh: from its left front
    { t: 63.25, p: V3(S7.x + 1.85, 1.29, 3.18), l: V3(S7.x - 0.08, 1.06, S7.z + 0.08), fov: 40, stop: true },
    { t: 63.72, p: V3(S7.x - 0.78, 1.22, 2.45), l: V3(S7.x - 0.38, 1.13, BENCH_Z + 0.12), fov: 34 },               // round the front, wide of the skeleton
    { t: 64.25, p: V3(S7.x - 0.68, 1.2, 0.74), l: V3(S7.x - 0.42, 1.172, BENCH_Z + 0.12), fov: 32, stop: true },   // the section, close: the swap happens out of frame
    { t: 66.9, p: V3(S7.x - 0.68, 1.2, 0.72), l: V3(S7.x - 0.42, 1.172, BENCH_Z + 0.12), fov: 32, stop: true },
    { t: 68.1, p: V3(S7.x - 0.29, 1.4, 4.0), l: V3(S7.x + 0.75, 1.36, 0.22), fov: 45, stop: true },                 // on one leg
    { t: 73.9, p: V3(S7.x - 0.25, 1.39, 3.82), l: V3(S7.x + 0.75, 1.36, 0.22), fov: 45, stop: true },
    { t: 75.2, p: V3(PLATE.x + 0.05, 0.75, PLATE.z + 0.6), l: Pl, fov: 32 },
    { t: T.logo, p: V3(PLATE.x, PLATE.y + 0.0465 + LOGO_R / 0.115, PLATE.z + 0.004), l: Pl, fov: 30, stop: true },   // straight down on the plate: the logo
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
W.dbgHand = (t, c) => { poseBody(t); if (c != null) W.handL.curl(c); W.body.updateMatrixWorld(true); const R = W.rig, f = (v) => v.toArray().map((x) => +x.toFixed(3));
  const tip = R.byName.get('Distal phalanx of left middle finger'), mc = R.byName.get('Left third metacarpal bone'), a = new THREE.Vector3(), b = new THREE.Vector3(), w = new THREE.Vector3();
  tip.getWorldPosition(a); mc.getWorldPosition(b); W.wristL.g.getWorldPosition(w); return { tip: f(a), mc: f(b), wrist: f(w), d: +a.distanceTo(w).toFixed(3) }; };
W.dbgJoints = (c) => { poseBody(1.5); W.handL.curl(c); W.body.updateMatrixWorld(true); const R = W.rig, out = {};
  const dirOf = (name) => { const m = R.byName.get(name), P = m.geometry.attributes.position; let lo = null, hi = null, ylo = 9, yhi = -9;
    for (let i = 0; i < P.count; i += 3) { const v = new THREE.Vector3().fromBufferAttribute(P, i); const yy = v.y + m.userData.home.y; if (yy < ylo) { ylo = yy; lo = v.clone(); } if (yy > yhi) { yhi = yy; hi = v.clone(); } }
    lo.applyMatrix4(m.matrixWorld); hi.applyMatrix4(m.matrixWorld); return lo.sub(hi).normalize(); };   // rest-top to rest-bottom: along the bone, toward the tip
  const mc = dirOf('Left third metacarpal bone'), pp = dirOf('Proximal phalanx of left middle finger'), mp = dirOf('Middle phalanx of left middle finger');
  out.mcp = +(Math.acos(Math.max(-1, Math.min(1, mc.dot(pp)))) * 57.3).toFixed(1); out.pip = +(Math.acos(Math.max(-1, Math.min(1, pp.dot(mp)))) * 57.3).toFixed(1);
  return out; };
W.dbgSit = (t) => { poseBody(t); const R = W.rig, f = (v) => v.toArray().map((x) => +x.toFixed(3)), o = { where: where(t), ext: +extAt(t).toFixed(3), sitP: f(sitP()) };
  for (const Side of ['Right', 'Left']) { const G = R.legs[Side], a = new THREE.Vector3(), k = new THREE.Vector3(); G.ankle.getWorldPosition(a); G.knee.getWorldPosition(k); o[Side] = { knee: f(k), ankle: f(a) }; }
  return o; };
function focusAt(S, t, P) { return Math.hypot(P.p[0] - P.l[0], P.p[1] - P.l[1], P.p[2] - P.l[2]); }

// ------------------------------------------------------------------ one moment of the film
function update(S, t) {
  const scene = S.scene, endDark = ss(T.factory - 0.5, T.logo - 0.3, t);
  poseBody(t);
  // ---- light against heavy: both sections grow alike; heavy wins on strength
  { const L = W.lh, g = s5(T.built - 0.2, T.size + 0.4, t), r = 0.062 * (1 + 0.32 * g);
    L.light.cs.g.scale.setScalar(r); L.heavy.cs.g.scale.setScalar(r);
    const st = s5(T.heavyWon - 0.1, T.strength + 0.3, t); L.light.b.set(0.5 * st); L.heavy.b.set(0.88 * st);
    L.sign.material.opacity = 0.25 + 0.75 * pulse(t, T.every - 0.1, 13.6, 0.4); }
  // ---- the week: twice
  W.week.ticks.forEach((m, i) => { m.material.opacity = s5(T.twice - 0.1 + i * 0.25, T.twice + 0.25 + i * 0.25, t); });
  // ---- the sets: three sections, smallest to largest
  W.board.secs.forEach((cs, i) => { const k = outBack(clamp01((t - (T.more + i * 0.75)) / 0.6), 1.4); cs.g.scale.setScalar(Math.max(0.0001, cs.r0 * k)); });
  // ---- two splits: same sets, same size
  { const SP = W.splits, k = s5(T.equal - 0.3, T.noReal + 0.2, t), r = 0.068 * (0.85 + 0.15 * k); SP.ca.g.scale.setScalar(r); SP.cb.g.scale.setScalar(r); SP.eq.material.opacity = s5(T.noReal - 0.1, T.noReal + 0.35, t); }
  // ---- the bricks: laid through the next day; the sleepless row stops 18% short
  W.sleep.rows.forEach((bs) => bs.forEach((m, k) => { const at = T.cut - 0.4 + k * 0.33, f = m.userData.full; m.visible = t > at && f > 0;
    m.scale.y = m.visible ? clamp01(f) : 0.0001; m.position.y = m.userData.y + 0.08 * (1 - s5(at, at + 0.25, t)); }));
  // ---- protein: the line draws, and flattens at about 1.6
  { const P = W.prot, k = s5(T.little - 0.2, T.kilo + 0.3, t), key = Math.round(k * 60); if (key !== P.key) { P.key = key; P.cv(P.c.getContext('2d'), P.c.width, P.c.height, k); P.tex.needsUpdate = true; }
    const off = 1 - 0.82 * ss(57.4, 58.4, t); P.dim.forEach((m) => { if (!m.userData.c0) m.userData.c0 = m.color.clone(); m.color.copy(m.userData.c0).multiplyScalar(off); }); }   // its light goes down once the camera has left
  // ---- the bench: the lever follows the shins; the thigh's section grows 9%
  { const B = W.bench, ext = where(t) === 'sit' ? extAt(t) : 0; B.lever.rotation.x = -lerp(0, 1.35, ext);
    const g9 = s5(T.nine - 0.2, T.eightWeeks + 0.4, t); B.th.g.scale.setScalar(0.075 * (1 + 0.09 * g9)); B.ring.material.opacity = 0.85 * pulse(t, T.nine - 0.3, 66.9, 0.4); }
  // ---- the plate: the logo on it
  { const lk = s5(T.back + 0.3, T.logo - 0.25, t); W.plate.logo.set({ weight: lk, white: lk, hours: 0, hand: ss(T.logo - 0.4, T.logo - 0.15, t), handScale: outBack(clamp01((t - (T.logo - 0.4)) / 0.35), 1.8) }); }
  // ---- light
  const fig = 1 - endDark;
  W.key.position.set(where(t) === 'stand' ? 1.4 : S7.x + 1.2, 3.0, 2.3); W.key.target.position.set(where(t) === 'stand' ? 0 : S7.x + 0.36, 0.9, 0.15);
  W.key.intensity = 11 * fig; W.rim.intensity = 4 * fig; W.fill.intensity = 1.0 * fig;
  W.rim.position.set(where(t) === 'stand' ? -1.4 : S7.x - 1.2, 2.6, -1.6); W.rim.target.position.set(where(t) === 'stand' ? 0 : S7.x + 0.3, 1.0, 0);
  W.fill.position.set(where(t) === 'stand' ? -1.6 : S7.x - 0.7, 1.5, 2.3); W.fill.target.position.set(where(t) === 'stand' ? 0 : S7.x + 0.36, 0.9, 0.2);
  for (const L of W.lights) L.intensity = L.userData.I * fig;
  W.lights[8].intensity = W.lights[8].userData.I * (1 - 0.5 * endDark);
  W.lights[6].intensity *= 1 - 0.85 * ss(57.4, 58.4, t); W.lights[5].intensity *= 1 - 0.85 * ss(50.6, 51.4, t);
  W.lampLight.intensity = 0.6 * fig * (1 - 0.85 * ss(50.6, 51.4, t));
  S.tableMat.color.setScalar(0.3 * (1 - endDark * 0.9)); scene.environmentIntensity = 0.12 * (1 - endDark * 0.7); S.reflAmt = 0.5 * (1 - endDark);
}

// ------------------------------------------------------------------ the words on screen
const CAPS = [
  { t0: 0.35, t1: 1.75, top: 300, size: 100, html: 'Building <em>muscle.</em>' },
  { t0: 1.89, t1: 4.95, top: 292, size: 80, html: 'Heavy weights to <em>grow,</em><br>light ones to <em>tone</em>' },
  { t0: 5.42, t1: 10.0, top: 292, size: 74, html: 'In 21 studies, with<br>every set taken to the<br><em>last possible rep</em>' },
  { t0: 10.1, t1: 13.7, top: 292, size: 80, html: 'light and heavy loads<br>built <em>similar size</em>' },
  { t0: 14.17, t1: 16.6, top: 300, size: 86, html: 'Heavy won on<br><em>maximal strength.</em>' },
  { t0: 17.09, t1: 20.9, top: 292, size: 78, html: 'The WHO minimum:<br>strength work <em>at least</em><br><em>twice a week</em>' },
  { t0: 21.36, t1: 23.1, top: 300, size: 86, html: 'Then <em>count your sets.</em>' },
  { t0: 23.27, t1: 30.4, top: 292, size: 70, html: 'Across 15 studies, more<br>weekly sets per muscle<br>went with <em>more growth,</em><br>in the range tested' },
  { t0: 30.94, t1: 32.3, top: 300, size: 100, html: 'How <em>often?</em>' },
  { t0: 32.47, t1: 38.6, top: 292, size: 72, html: 'With weekly sets<br>kept equal, it made<br><em>no real difference,</em><br>across 25 studies' },
  { t0: 38.95, t1: 41.1, top: 300, size: 86, html: 'It&rsquo;s a preference,<br><em>not a secret.</em>' },
  { t0: 41.62, t1: 42.7, top: 300, size: 100, html: '<em>Sleep?</em>' },
  { t0: 42.85, t1: 50.4, top: 292, size: 70, html: 'In a small trial, one<br>sleepless night cut muscle<br>protein building by <em>18%</em><br>the next day' },
  { t0: 50.94, t1: 56.9, top: 292, size: 74, html: 'Extra protein helps<br><em>a little,</em> up to about<br><em>1.6 grams</em> per kilo a day' },
  { t0: 57.42, t1: 63.7, top: 292, size: 72, html: 'In a small study, frail<br>90-year-olds grew their<br>thigh muscle <em>9%</em><br>in 8 weeks' },
  { t0: 64.1, t1: 67.3, top: 300, size: 86, html: 'Age <em>slows</em> it.<br>It doesn&rsquo;t <em>stop</em> it.' },
  { t0: 67.77, t1: 69.4, top: 300, size: 100, html: 'Over <em>65?</em>' },
  { t0: 69.69, t1: 74.0, top: 292, size: 76, html: 'The WHO adds balance<br>and strength training,<br>to <em>prevent falls</em>' },
  { t0: 74.71, t1: 99, top: 360, size: 96, html: 'Back to<br><em>factory settings.</em>' },
];
const OVL = {};
function overlayInit(S) {
  const O = S.O, tag = (cls, txt2, size, bsize) => { const e = O.tag(cls, txt2); e.style.fontSize = size + 'px'; const b = e.querySelector('b'); if (b && bsize) b.style.fontSize = bsize + 'px'; return e; };
  OVL.sleep = tag('tag', '13 adults, one night without sleep<b>muscle protein building: −18%</b>', 22, 32);
  OVL.prot = tag('tag', '49 studies, 1,863 people<b>about +0.3 kg fat-free mass</b>', 22, 32);
  OVL.old = tag('tag', '10 frail volunteers,<br>aged about 90<b>thigh muscle +9%<br>in 8 weeks</b>', 22, 32);
}
function overlay(S, t) {
  place(S, OVL.sleep, new THREE.Vector3(S5.x + BRICKS.x, 0.17, S5.z + BRICKS.z + 0.07), -205, 0, pulse(t, T.t18 + 0.2, 50.3));
  place(S, OVL.prot, new THREE.Vector3(S6.x - 0.2, S6.y - 0.3, S6.z), -60, 30, pulse(t, T.little + 0.3, 56.8));
  place(S, OVL.old, new THREE.Vector3(S7.x - 0.42, 1.12, BENCH_Z + 0.12), -300, 75, pulse(t, T.nine + 0.2, 63.5));
  const c = new THREE.Vector3(PLATE.x, PLATE.y + 0.0465, PLATE.z);
  logoEnd(S, t, { t0: T.logo, center: c, edge: c.clone().add(new THREE.Vector3(0, 0, LOGO_R)) });
}

makeFilm({
  T, caps: CAPS, subs: [], build, update, pose: camPose, overlay, overlayInit, focus: focusAt,
  stage: { bg: 0x07080a, reflSize: 9, env: 0.12, far: 30 },
  aperture: [[0, 0.004], [5.9, 0.003], [17.4, 0.003], [22.0, 0.003], [42.2, 0.003], [58.1, 0.003], [64.2, 0.004], [68.1, 0.003], [75.2, 0.003]],
  bloom: [[0, 0.5], [74, 0.55]],
});

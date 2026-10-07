// Human Factory Settings · Film 17 "How do I build muscle?" (new direction, 7 Oct 2026) · one continuous shot, 9:16.
// A row of stations in a dark gym; the camera travels along it once. A skeleton sits on a flat bench curling a tiny pink
// dumbbell, its eyes on the phone in its other hand; between sets it scrolls. Beside it, ARM SIZE over three years: flat,
// until "let's get you growing" sends the line up. Light and heavy loads, every set to the last possible rep: two muscle
// sections grow alike. A week, ticked twice. A chalkboard of weekly sets: more sets, bigger sections. A protein chart that
// flattens at about 1.6 grams per kilo. A sleepless bed at 3:47, and two towers of bricks, the sleepless one 18%
// short. On a leg-extension bench, a walking stick: the skeleton (moved while no one looked) works, its thigh's section
// grows 9%, and on "what's your excuse?" it turns its head to us. Three cards, SQUATS, PUSH-UPS, ROWS; a barbell gets a rep
// and a small plate. On one leg on a balance pad. A 20 kg plate on the floor, seen from above, becomes the logo; its cast
// lettering is the factory stamp.
import { THREE, ss, s5, lerp, clamp01, hash, camTrack, phys, shadows, spot, RoundedBoxGeometry,
  loadAnatomy, V3, place, logoEnd, makeFilm, outBack, noiseTex } from '../kit.js';
import { buildRig, skeletonKind, bendSpine, poseArm, legIK, worldVerts, avgV } from '../rig.js';
import { makeLogoRing, makePhone } from '../props.js';

//@HANDS@

// ------------------------------------------------------------------ timing, from the voice guide (word starts)
const T = {
  end: 79.49, logo: 76.97,
  you: 0.35, lifted: 0.84, same: 1.3, tiny: 1.58, dumbbells: 1.89, three: 2.58, years: 2.85, scrolling: 3.14, between: 3.99, sets: 4.46,
  and1: 4.94, wonder: 5.46, why: 6.05, nothing: 6.1, grows: 6.76, lets: 8.05, growing: 8.93,
  your: 10.13, muscles: 10.57, built: 11.22, grow: 11.55, push: 12.23, them: 12.41, in21: 12.68, twentyOne: 12.98, light: 14.34, heavy: 14.96, loads: 15.43,
  built2: 16.13, similar: 16.36, size: 16.83, when: 17.45, every: 17.58, last: 18.91, possible: 19.23, rep: 19.92,
  the: 21.17, world: 21.47, recommends: 22.78, strength: 23.58, least: 24.37, twice: 24.74, week: 25.42, and2: 25.47, more: 26.59, weekly: 26.68, sets2: 27.5, meant: 27.96, more2: 28.22, growth: 28.42,
  protein: 29.85, helps: 30.57, little: 31.04, upTo: 31.13, about: 31.69, one: 31.95, six: 32.75, grams: 33.08, kilo: 33.72, day: 35.02,
  and3: 35.5, sleep: 36.51, inA: 36.82, trial: 37.67, sleepless: 38.72, night: 39.39, cut: 39.55, next: 40.17, building: 42.05, eighteen: 42.68, percent: 43.4,
  and4: 44.78, never: 45.4, late: 45.89, inOne: 46.07, frail: 47.38, ninety: 47.78, grew: 49.04, thigh: 49.54, nine: 50.63, percent2: 51.09, eight: 51.75, weeks: 52.08,
  so: 52.98, excuse: 53.88,
  pick: 55.06, big: 55.88, squats: 56.51, pushups: 56.99, rows: 57.78, and5: 58.33, add: 58.38, rep2: 59.16, little2: 59.38, weight: 59.76, easy: 61.16,
  if1: 62.57, over: 63.19, sixtyFive: 63.46, balance: 64.3, falls: 66.68,
  and6: 67.72, health: 68.71, exercised: 69.76, while: 71.16, check: 71.58, doctor: 72.37, start: 73.43,
  final: 74.7, factory: 75.91, settings: 76.28,
};

// ------------------------------------------------------------------ the set: a row of stations along x (metres, floor at y = 0), every one facing +z
const W = {}; window.HFS_W = W;
const X = new THREE.Vector3(1, 0, 0), Y = new THREE.Vector3(0, 1, 0), Z = new THREE.Vector3(0, 0, 1);
const S0 = { x: 0.0, z: 0.0, seat: 0.45 };            // the skeleton on a flat bench: a tiny dumbbell, a phone
const CH = { x: 1.2, z: -0.05, y: 1.0 };              // ARM SIZE: three years, flat
const S1 = { x: 2.1, z: 0.0, top: 0.82 };            // light against heavy
const S2 = { x: 2.97, z: -0.05 };                     // the week
const S3 = { x: 3.83, z: -0.08, y: 1.02 };            // the weekly sets
const S4 = { x: 4.73, z: -0.05, y: 1.02 };            // protein
const S5 = { x: 5.67, z: 0.0 };                       // the sleepless night, the bricks
const BRICKS = { x: 0.05, z: 0.22 };                  // the two towers, in front of the bed (relative to S5)
const S7 = { x: 6.8, z: 0.0 };                       // the leg-extension bench, the stick, the thigh
const S8 = { x: 7.87, z: -0.05, top: 0.78 };          // big moves; a rep, a plate
const BAL = { x: 9.2, z: 0.18 };                     // the balance pad (far enough right that the moves' frame never holds it)
const PLATE = new THREE.Vector3(10.65, 0, 0.45), PLATE_R = 0.18, LOGO_R = 0.105;
const SEAT = 0.5, BENCH_Z = -0.1, HANDLE_Y = 0.475;   // the leg-extension bench; its handles, either side of the seat
const SWAP1 = 22.4, SWAP2 = 57.2;                     // the skeleton moves while no one looks: to the leg bench; to the balance pad
const LIGHT1 = 44.4, LIGHT2 = 62.3;                    // its lights follow, during the camera's moves between stations
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
const finish = (g) => { shadows(g); g.traverse((o) => o.layers.enable(1)); return g; };
function posedVerts(m, step = 1) { m.updateMatrixWorld(true); const P = m.geometry.attributes.position, out = []; for (let i = 0; i < P.count; i += step) out.push(new THREE.Vector3().fromBufferAttribute(P, i).applyMatrix4(m.matrixWorld)); return out; }

// ------------------------------------------------------------------ dumbbells (hex heads), a muscle cross-section
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

// ------------------------------------------------------------------ the opening: a flat bench; the tiny dumbbell; the phone and its feed
const DB = { r: 0.03, len: 0.036, s: 0.85 };   // the tiny dumbbell: pink, small heads, a little under life size
function makeBench0(scene) {
  const g = new THREE.Group(); g.position.set(S0.x, 0, S0.z); scene.add(g);
  const pad = phys({ color: 0x1e1f23, roughness: 0.7, clearcoat: 0.15 });
  const top = new THREE.Mesh(new RoundedBoxGeometry(0.28, 0.07, 1.1, 4, 0.025), pad); top.position.set(0, S0.seat - 0.035, -0.43); g.add(top);
  for (const z of [-0.88, 0.0]) { const leg = new THREE.Mesh(new RoundedBoxGeometry(0.06, S0.seat - 0.07, 0.06, 2, 0.008), black()); leg.position.set(0, (S0.seat - 0.07) / 2, z); g.add(leg);
    const foot = new THREE.Mesh(new RoundedBoxGeometry(0.32, 0.03, 0.06, 2, 0.008), black()); foot.position.set(0, 0.015, z); g.add(foot); }
  return finish(g);
}
const FEED_H = [520, 430, 610, 380, 560, 470], FEED_SUM = FEED_H.reduce((a, b) => a + b, 0);
const HUES = ['#e2795a', '#5aa0e2', '#c9a14a', '#7cc48a', '#b07ad9', '#e25a8c'];
function drawFeed(P, scroll) {   // cards that scroll (no words on it)
  const key = scroll.toFixed(1); if (key === P.feedKey) return; P.feedKey = key;
  const x = P.feed.getContext('2d'), w = 590, h = 1220;
  x.fillStyle = '#0c0e13'; x.fillRect(0, 0, w, h);
  let y = 96 - (scroll % FEED_SUM), k = 0;
  while (y < h + 40) {
    const hh = FEED_H[k % 6];
    if (y + hh > 90) {
      x.fillStyle = '#161922'; x.beginPath(); x.roundRect(22, y + 14, w - 44, hh - 28, 26); x.fill();
      x.fillStyle = HUES[(k + 2) % 6]; x.beginPath(); x.arc(70, y + 64, 26, 0, Math.PI * 2); x.fill();
      x.fillStyle = '#3a3f4c'; x.fillRect(110, y + 46, 220, 16); x.fillStyle = '#2a2e38'; x.fillRect(110, y + 72, 140, 12);
      const gr = x.createLinearGradient(0, y + 110, 0, y + hh - 70); gr.addColorStop(0, HUES[k % 6]); gr.addColorStop(1, '#1b1e27');
      x.fillStyle = gr; x.beginPath(); x.roundRect(40, y + 110, w - 80, hh - 190, 18); x.fill();
      x.fillStyle = '#2f3440'; x.fillRect(40, y + hh - 62, 300, 14);
    }
    y += hh; k++;
  }
  x.fillStyle = '#0c0e13'; x.fillRect(0, 0, w, 88);
  P.feedTex.needsUpdate = true;
}

// ------------------------------------------------------------------ ARM SIZE: three years, flat; then it goes up
const YEARS = ['2023', '2024', '2025', '2026'];
function makeChart(scene) {
  const g = new THREE.Group(); g.position.set(CH.x, 0, CH.z); scene.add(g);
  for (const s of [-1, 1]) { const leg = new THREE.Mesh(new THREE.BoxGeometry(0.025, CH.y + 0.24, 0.025), black()); leg.position.set(s * 0.3, (CH.y + 0.24) / 2, -0.03); leg.rotation.x = 0.05; g.add(leg); }
  const c = document.createElement('canvas'); c.width = 2200; c.height = 1500; const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const cv = (x, w, h, k, up) => { x.fillStyle = '#f2efe8'; x.fillRect(0, 0, w, h);
    txt(x, 'ARM SIZE', w * 0.5, h * 0.1, { font: '800 120px Archivo', color: '#16181c', track: 14 });
    const X0 = w * 0.1, X1 = w * 0.92, Y0 = h * 0.8, Y1 = h * 0.22;
    x.strokeStyle = '#26272b'; x.lineWidth = 6; x.beginPath(); x.moveTo(X0, Y1); x.lineTo(X0, Y0); x.lineTo(X1, Y0); x.stroke();
    YEARS.forEach((s, i) => { const xx = X0 + ((i + 0.5) / 4) * (X1 - X0); x.beginPath(); x.moveTo(xx, Y0); x.lineTo(xx, Y0 + 16); x.stroke(); txt(x, s, xx, Y0 + 70, { font: '700 64px "Geist Mono"', color: '#26272b' }); });
    const yl = Y0 - (Y0 - Y1) * 0.3;
    if (k > 0) { x.strokeStyle = '#c2312b'; x.lineWidth = 12; x.lineJoin = 'round'; x.lineCap = 'round'; x.beginPath(); const N = 120, xe = X0 + 20 + k * (X1 - X0 - 120);
      for (let i = 0; i <= N; i++) { const xx = X0 + 20 + (i / N) * (xe - X0 - 20), yy = yl + 5 * Math.sin(i * 1.7) * Math.sin(i * 0.31); if (i === 0) x.moveTo(xx, yy); else x.lineTo(xx, yy); }
      const xu = xe + 110 * up, yu = yl - (yl - Y1 + 30) * up; if (up > 0) x.lineTo(xu, yu);
      x.stroke();
      if (up > 0.6) { const a = Math.atan2(yu - yl, xu - xe), L = 70 * (up - 0.6) / 0.4; x.fillStyle = '#c2312b'; x.beginPath(); x.moveTo(xu + Math.cos(a) * L * 0.6, yu + Math.sin(a) * L * 0.6);
        x.lineTo(xu + Math.cos(a + 2.5) * L, yu + Math.sin(a + 2.5) * L); x.lineTo(xu + Math.cos(a - 2.5) * L, yu + Math.sin(a - 2.5) * L); x.closePath(); x.fill(); } } };
  const chart = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.42), phys({ map: tex, roughness: 0.6 })); chart.position.set(0, CH.y, 0); chart.rotation.x = -0.05; g.add(chart);
  return { g: finish(g), c, tex, cv, key: '' };
}

// ------------------------------------------------------------------ light against heavy: two sections grow alike
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
    out[i ? 'heavy' : 'light'] = { cs, db, y0: db.position.y };
  });
  const sign = printed(0.6, 0.05, (c2, w, h) => { c2.fillStyle = '#16171a'; c2.fillRect(0, 0, w, h); txt(c2, 'EVERY SET TO THE LAST POSSIBLE REP', w / 2, h / 2 + 2, { font: '700 76px "Geist Mono"', color: '#ffb36b', track: 4, maxW: w * 0.94 }); });
  sign.position.set(0, S1.top + 0.44, -0.1); g.add(sign);
  finish(g);
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
  finish(g);
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
  finish(g);
  return { g, secs };
}

// ------------------------------------------------------------------ protein: a chart that goes flat at about 1.6
function makeProtein(scene) {
  const g = new THREE.Group(); g.position.set(S4.x, 0, S4.z); scene.add(g);
  for (const s of [-1, 1]) { const leg = new THREE.Mesh(new THREE.BoxGeometry(0.025, S4.y + 0.35, 0.025), black()); leg.position.set(s * 0.36, (S4.y + 0.35) / 2, -0.03); g.add(leg); }
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
  const chart = new THREE.Mesh(new THREE.PlaneGeometry(0.72, 0.48), phys({ map: tex, roughness: 0.6 })); chart.position.set(0, S4.y, 0); g.add(chart);
  finish(g);
  return { g, c, tex, cv, key: -1 };
}

// ------------------------------------------------------------------ the sleepless bed; the next day's bricks
function makeSleep(scene) {
  const g = new THREE.Group(); g.position.set(S5.x, 0, S5.z); scene.add(g);
  const frame = new THREE.Mesh(new RoundedBoxGeometry(0.62, 0.22, 1.1, 3, 0.02), woodM()); frame.position.set(-0.12, 0.11, -0.45); g.add(frame);
  const mat = new THREE.Mesh(new RoundedBoxGeometry(0.58, 0.12, 1.06, 4, 0.04), phys({ color: 0xd9dde3, roughness: 0.9 })); mat.position.set(-0.12, 0.28, -0.45); g.add(mat);
  const blanket = new THREE.Mesh(new RoundedBoxGeometry(0.6, 0.05, 0.62, 4, 0.02), phys({ color: 0x3c4b66, roughness: 0.85 })); blanket.position.set(-0.12, 0.36, -0.28); blanket.rotation.set(0.05, 0.12, 0.06); g.add(blanket);
  const pillow = new THREE.Mesh(new RoundedBoxGeometry(0.4, 0.09, 0.22, 4, 0.04), phys({ color: 0xeef0f3, roughness: 0.9 })); pillow.position.set(-0.12, 0.38, -0.88); pillow.rotation.y = 0.15; g.add(pillow);
  const night = new THREE.Mesh(new RoundedBoxGeometry(0.22, 0.42, 0.22, 3, 0.01), woodM()); night.position.set(-0.57, 0.21, -0.82); g.add(night);   // on the bed's left: its clock stays out of the buttons
  const clock = printed(0.12, 0.06, (x, w, h) => { x.fillStyle = '#0b0c0e'; x.fillRect(0, 0, w, h); txt(x, '3:47', w / 2, h / 2 + 4, { font: '700 150px "Geist Mono"', color: '#ff5a3c' }); }, { emissive: new THREE.Color(0xff5a3c), emissiveIntensity: 0.25 });
  clock.position.set(-0.57, 0.46, -0.72); clock.rotation.y = 0.3; g.add(clock);
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
  finish(g);
  return { g, rows };
}

// ------------------------------------------------------------------ the leg-extension bench, the walking stick, the thigh's section
function makeBench(scene, knee) {   // knee: where the seated skeleton's knees are (bench frame: y, z) and its shin length
  const g = new THREE.Group(); g.position.set(S7.x, 0, S7.z); scene.add(g);
  const pad = phys({ color: 0x1e1f23, roughness: 0.7, clearcoat: 0.15 });
  const seat = new THREE.Mesh(new RoundedBoxGeometry(0.42, 0.08, 0.5, 4, 0.03), pad); seat.position.set(0, SEAT - 0.04, BENCH_Z); g.add(seat);
  const backrest = new THREE.Mesh(new RoundedBoxGeometry(0.42, 0.6, 0.08, 4, 0.03), pad); backrest.position.set(0, SEAT + 0.3, BENCH_Z - 0.29); backrest.rotation.x = -0.15; g.add(backrest);
  const frame = new THREE.Mesh(new RoundedBoxGeometry(0.1, SEAT - 0.08, 0.5, 3, 0.01), black()); frame.position.set(0, (SEAT - 0.08) / 2, BENCH_Z); g.add(frame);
  const stack = new THREE.Mesh(new RoundedBoxGeometry(0.16, 0.9, 0.12, 3, 0.01), black()); stack.position.set(-0.34, 0.45, BENCH_Z - 0.2); g.add(stack);
  for (const s of [-1, 1]) { const h = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.16, 16), rubber()); h.rotation.x = Math.PI / 2; h.position.set(s * 0.245, HANDLE_Y, BENCH_Z + 0.02); g.add(h);
    const st = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.05, 10), chrome()); st.rotation.z = Math.PI / 2; st.position.set(s * 0.215, HANDLE_Y, BENCH_Z + 0.02); g.add(st); }   // the seat's handles
  W.handles = [-1, 1].map((s) => new THREE.Vector3(S7.x + s * 0.245, HANDLE_Y, S7.z + BENCH_Z + 0.02));
  const lever = new THREE.Group(); lever.position.set(0, knee.y, knee.z); g.add(lever);
  const RL = knee.shin - 0.07;   // the roller's distance down the shin
  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.03, RL, 0.03), black()); arm.position.set(0.25, -RL / 2, 0.065); lever.add(arm);
  const pivot = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.06, 20), black()); pivot.rotation.z = Math.PI / 2; pivot.position.set(0.25, 0, 0); lever.add(pivot);
  const roller = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.42, 32), pad); roller.rotation.z = Math.PI / 2; roller.position.set(0.0, -RL, 0.072); lever.add(roller);
  const rollRod = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.5, 12), chrome()); rollRod.rotation.z = Math.PI / 2; rollRod.position.set(0.02, -RL, 0.072); lever.add(rollRod);
  const stick = new THREE.Group(); stick.position.set(0.5, 0, BENCH_Z - 0.18); stick.rotation.z = 0.1; g.add(stick);   // leaning by the bench, clear of the elbow
  const wood = phys({ color: 0x3a2516, roughness: 0.45, clearcoat: 0.6 });
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.012, 0.86, 16), wood); shaft.position.y = 0.43; stick.add(shaft);
  const crook = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.012, 12, 32, Math.PI), wood); crook.position.set(-0.045, 0.86, 0); stick.add(crook);
  const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.03, 16), rubber()); tip.position.y = 0.015; stick.add(tip);
  const th = crossSection(0.075); th.g.position.set(-0.42, 1.12, BENCH_Z + 0.12); g.add(th.g);
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.012, 1.0, 12), black()); post.position.set(-0.42, 0.52, BENCH_Z + 0.06); g.add(post);
  const ringM = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false }), ring = new THREE.Group(); ring.material = ringM;
  for (let k = 0; k < 40; k++) ring.add(new THREE.Mesh(new THREE.RingGeometry(0.0741, 0.0767, 6, 1, (k / 40) * Math.PI * 2, (Math.PI * 2 / 40) * 0.58), ringM));
  ring.position.set(-0.42, 1.12, BENCH_Z + 0.123); g.add(ring);
  finish(g);
  return { g, lever, th, ring };
}

// ------------------------------------------------------------------ big moves: three cards; a barbell that gets a rep and a small plate
function makeMoves(scene) {
  const g = new THREE.Group(); g.position.set(S8.x, 0, S8.z); scene.add(g);
  const table = new THREE.Mesh(new RoundedBoxGeometry(0.7, 0.03, 0.42, 3, 0.008), woodM()); table.position.y = S8.top - 0.015; g.add(table);
  stand(g, 0, 0, S8.top - 0.03, 0.62, 0.34);
  const cards = ['SQUATS', 'PUSH-UPS', 'ROWS'].map((s, i) => { const m = printed(0.19, 0.11, (x, w, h) => { x.fillStyle = '#f2efe8'; x.beginPath(); x.roundRect(0, 0, w, h, 40); x.fill();
      x.fillStyle = '#16181c'; x.fillRect(0, 0, w, h * 0.16); txt(x, String(i + 1), w * 0.5, h * 0.08 + 2, { font: '800 50px "Geist Mono"', color: '#f2efe8' });
      txt(x, s, w / 2, h * 0.6, { font: '900 120px Archivo', color: '#16181c', track: 6, maxW: w * 0.86 }); });
    m.position.set(-0.21 + i * 0.21, S8.top + 0.22, -0.12); m.rotation.x = -0.12; g.add(m);
    const easel = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.2, 0.012), black()); easel.position.set(-0.21 + i * 0.21, S8.top + 0.1, -0.14); easel.rotation.x = 0.25; g.add(easel);
    m.material.opacity = 0; return m; });
  // the barbell on two low stands at the table's front: a bar, a plate each side; a small plate slides on at "a little weight"
  const bb = new THREE.Group(); bb.position.set(0, S8.top + 0.09, 0.08); g.add(bb);
  const barM = chrome(), plateM = phys({ color: 0x1b1c20, roughness: 0.5, metalness: 0.4, clearcoat: 0.2 });
  const barr = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.66, 24), barM); barr.rotation.z = Math.PI / 2; bb.add(barr);
  for (const s of [-1, 1]) { const sl = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.12, 24), barM); sl.rotation.z = Math.PI / 2; sl.position.x = s * 0.27; bb.add(sl);
    const pl = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.024, 48), plateM); pl.rotation.z = Math.PI / 2; pl.position.x = s * 0.225; bb.add(pl);
    const sp = new THREE.Mesh(new RoundedBoxGeometry(0.03, 0.09, 0.05, 2, 0.006), black()); sp.position.set(s * 0.16, -0.045, 0); bb.add(sp); }
  const small = [-1, 1].map((s) => { const pl = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.048, 0.014, 40), phys({ color: 0x9aa0aa, roughness: 0.35, metalness: 0.7, clearcoat: 0.3 })); pl.rotation.z = Math.PI / 2; pl.userData.s = s; bb.add(pl); return pl; });   // standing on the table in front, until they hop onto the bar
  const reps = document.createElement('canvas'); reps.width = 600; reps.height = 330; const rtex = new THREE.CanvasTexture(reps); rtex.colorSpace = THREE.SRGBColorSpace;
  const rep = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.066), phys({ map: rtex, roughness: 0.6 })); rep.position.set(0.0, S8.top + 0.0165, 0.17); rep.rotation.x = -Math.PI / 2 + 0.55; g.add(rep);
  const drawReps = (n) => { const x = reps.getContext('2d'); x.fillStyle = '#16171a'; x.fillRect(0, 0, 600, 330); txt(x, 'REPS', 300, 80, { font: '700 64px "Geist Mono"', color: '#9aa0aa', track: 8 }); txt(x, String(n), 300, 215, { font: '800 170px "Geist Mono"', color: n > 8 ? '#ffb36b' : '#eceef1' }); rtex.needsUpdate = true; };
  drawReps(8);
  finish(g);
  return { g, cards, small, bb, drawReps, reps: 8 };
}

// ------------------------------------------------------------------ the balance pad; the 20 kg plate (its lettering is the stamp)
function makePad(scene) {
  const g = new THREE.Group(); g.position.set(BAL.x, 0, BAL.z); scene.add(g);
  const bal = new THREE.Mesh(new RoundedBoxGeometry(0.46, 0.06, 0.36, 4, 0.025), phys({ color: 0x2b4a6e, roughness: 0.85 })); bal.position.set(0, 0.03, 0); g.add(bal);
  return finish(g);
}
function makePlate(scene) {
  const g = new THREE.Group(); g.position.copy(PLATE); scene.add(g);
  const iron = phys({ color: 0x1b1c20, roughness: 0.5, metalness: 0.4, clearcoat: 0.2, roughnessMap: noiseTex(17, 256, 0.6, 1.0, 10) });
  const P = [[0.026, 0.0], [PLATE_R, 0.0], [PLATE_R, 0.045], [PLATE_R - 0.012, 0.05], [PLATE_R - 0.03, 0.033], [0.06, 0.033], [0.048, 0.045], [0.026, 0.045]].map(([x, y]) => new THREE.Vector2(x, y));
  const body = new THREE.Mesh(new THREE.LatheGeometry(P, 128), iron); g.add(body);
  const letters = new THREE.Mesh(new THREE.RingGeometry(0.075, 0.145, 128), new THREE.MeshStandardMaterial({ transparent: true, roughness: 0.4, metalness: 0.6, color: 0x8c9098, map: canvasTex(1024, 1024, (x, w) => {
    x.clearRect(0, 0, w, w); const c = w / 2; x.fillStyle = '#ffffff';
    const arc = (s, r, a0, flip) => { x.save(); x.translate(c, c); x.font = '800 46px Archivo'; x.letterSpacing = '4px'; const tot = x.measureText(s).width / r; let a = a0 - tot / 2;
      for (const ch of s) { const cw = x.measureText(ch).width / r; x.save(); x.rotate(a + cw / 2); x.translate(0, flip ? r : -r); if (flip) x.rotate(Math.PI); x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(ch, 0, 0); x.restore(); a += cw; } x.restore(); };
    const arcB = (s, r) => { x.save(); x.translate(c, c); x.font = '800 46px Archivo'; x.letterSpacing = '4px'; let a = x.measureText(s).width / r / 2;   // along the bottom, upright, left to right
      for (const ch of s) { const cw = x.measureText(ch).width / r; x.save(); x.rotate(a - cw / 2); x.translate(0, r); x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(ch, 0, 0); x.restore(); a -= cw; } x.restore(); };
    arcB('HUMAN FACTORY SETTINGS', w * 0.4); }) }));
  letters.rotation.x = -Math.PI / 2; letters.position.y = 0.0335; g.add(letters);
  const logo = makeLogoRing(LOGO_R); logo.g.rotation.x = -Math.PI / 2; logo.g.position.y = 0.0465; g.add(logo.g);
  finish(g);
  return { g, logo };
}

// ------------------------------------------------------------------ build
async function build(S, cfg) {
  const scene = S.scene;
  S.fog.near = 4; S.fog.far = 13;
  S.table.scale.set(6, 6, 1); S.tableMat.clearcoat = 0.1; S.tableMat.specularIntensity = 0.3;
  for (const m of [S.tableMat.map, S.tableMat.roughnessMap]) if (m) { m.wrapS = m.wrapT = THREE.RepeatWrapping; m.repeat.multiplyScalar(6); }
  const meshes = await loadAnatomy(skeletonKind());
  const R = W.rig = buildRig(meshes);
  W.body = new THREE.Group(); scene.add(W.body); W.body.add(R.root);
  for (const m of meshes) { m.castShadow = true; m.receiveShadow = true; m.layers.enable(1); }
  W.meshes = meshes; W.bones = meshes.filter((m) => ['bone', 'tooth', 'cartilage'].includes(m.userData.tissue));
  W.ground = Math.min(R.legs.Right.ground, R.legs.Left.ground);
  const hipB = new THREE.Box3(); for (const m of meshes) if (/hip bone/i.test(m.userData.name)) for (const v of worldVerts(m, 3)) hipB.expandByPoint(v);
  W.sitDrop = R.P0.y - hipB.min.y;
  { const G = R.legs.Right; W.ankleH = G.A.y - G.ground; }
  W.wristL = makeWrist(R, 'Left'); W.wristR = makeWrist(R, 'Right');
  W.handL = rigHand(R, 'Left', W.wristL); W.handR = rigHand(R, 'Right', W.wristR); W.handL.wr = W.wristL; W.handR.wr = W.wristR;
  // ---- the set
  W.bench0 = makeBench0(scene); W.chart = makeChart(scene); W.lh = makeLightHeavy(scene); W.week = makeWeek(scene); W.board = makeBoard(scene);
  W.prot = makeProtein(scene); W.sleep = makeSleep(scene);
  { const G = R.legs.Right; W.bench = makeBench(scene, { y: SEAT + W.sitDrop + 0.003 - 0.03, z: BENCH_Z + 0.02 + G.L1 * 0.98, shin: G.L2 }); } W.moves = makeMoves(scene); W.pad = makePad(scene); W.plate = makePlate(scene);
  // ---- the opening's props: the tiny dumbbell, the phone
  W.db = dumbbell(DB.r, DB.len, 0xe18fae); W.db.scale.setScalar(DB.s); W.db.matrixAutoUpdate = false; scene.add(W.db); W.db.traverse((o) => o.layers.enable(1));
  W.phone = makePhone(); scene.add(W.phone.g); W.phone.g.matrixAutoUpdate = false; W.phone.g.traverse((o) => o.layers.enable(1));
  W.phone.feed = document.createElement('canvas'); W.phone.feed.width = 590; W.phone.feed.height = 1220;
  W.phone.feedTex = new THREE.CanvasTexture(W.phone.feed); W.phone.feedTex.colorSpace = THREE.SRGBColorSpace; W.phone.feedTex.anisotropy = 8;
  W.phone.screenMat.map = W.phone.feedTex; W.phone.screenMat.color.setRGB(0.42, 0.42, 0.42); W.phone.screenMat.needsUpdate = true; drawFeed(W.phone, 0);
  // ---- the poses, solved once
  W.poses = solvePoses();
  // ---- light: key, rim and fill follow the skeleton; a soft spot for each station
  W.key = spot(scene, { color: 0xdfe6ff, pos: new THREE.Vector3(1.2, 3.0, 2.3), target: new THREE.Vector3(0, 0.8, 0), angle: 0.42, penumbra: 0.8, shadow: true, size: cfg.shadow ?? 1024 }); W.key.shadow.camera.far = 8;
  W.rim = spot(scene, { color: 0xa9c4ff, pos: new THREE.Vector3(-1.4, 2.6, -1.6), target: new THREE.Vector3(0, 0.9, 0), angle: 0.45, penumbra: 0.9 });
  W.fill = spot(scene, { color: 0xc8d6ff, pos: new THREE.Vector3(-1.6, 1.4, 2.0), target: new THREE.Vector3(0, 0.8, 0.2), angle: 0.55, penumbra: 1 });
  const sp = (x, y, z, tx, ty, tz, a = 0.3, I = 8) => { const L = spot(scene, { color: 0xfff1d8, pos: new THREE.Vector3(x, y, z), target: new THREE.Vector3(tx, ty, tz), angle: a, penumbra: 0.7 }); L.userData.I = I; return L; };
  W.lights = {
    chart: sp(CH.x + 0.2, 2.4, 1.3, CH.x, CH.y, CH.z, 0.24), lh: sp(S1.x + 0.2, 2.4, 1.3, S1.x, S1.top + 0.25, S1.z, 0.3), week: sp(S2.x + 0.2, 2.4, 1.3, S2.x, 1.1, S2.z, 0.24),
    board: sp(S3.x + 0.25, 2.5, 1.4, S3.x, S3.y - 0.05, S3.z, 0.32), prot: sp(S4.x + 0.25, 2.4, 1.4, S4.x + 0.1, S4.y - 0.2, S4.z, 0.34), sleep: sp(S5.x + 0.2, 2.5, 1.6, S5.x + 0.03, 0.5, S5.z - 0.05, 0.36),
    bench: sp(S7.x + 0.3, 2.6, 1.6, S7.x + 0.1, 0.7, S7.z, 0.4, 9), moves: sp(S8.x + 0.2, 2.4, 1.3, S8.x, S8.top + 0.15, S8.z, 0.3), pad: sp(BAL.x + 0.25, 2.6, 1.7, BAL.x, 0.7, BAL.z, 0.36, 8),
    plate: sp(PLATE.x + 0.2, 1.9, PLATE.z + 0.7, PLATE.x, 0.05, PLATE.z, 0.2, 6),
  };
  W.lampLight = new THREE.PointLight(0xffc98a, 0.6, 1.4, 2); W.lampLight.position.set(S5.x - 0.57, 0.62, S5.z - 0.82); scene.add(W.lampLight);
  W.phoneLight = new THREE.PointLight(0xbcd2ff, 0, 0.5, 2); scene.add(W.phoneLight);
  W.auditSolids = [['bench0', W.bench0], ['legbench', W.bench.g], ['pad', W.pad], ['tiny dumbbell', W.db], ['phone', W.phone.g]];
  W.timing = { curls: CURLS, scroll: SCROLL, chart: [T.three - 0.2, T.grows + 0.3], up: [T.growing - 0.1, T.growing + 0.5], push: T.push, grow: [T.built2 - 0.2, T.size + 0.4],
    ticks: [T.twice - 0.1, T.twice + 0.15], secs: SECS, line: [T.helps - 0.2, T.kilo + 0.3], bricks: [T.cut - 0.4, 0.33],
    ext: [EXT.t0, EXT.per], nine: [T.nine - 0.2, T.eight + 0.4], turn: [T.so - 0.1, T.excuse + 0.6], cards: [T.squats - 0.15, T.pushups - 0.15, T.rows - 0.15], rep: T.rep2 - 0.05, plate: [T.weight - 0.25, T.weight + 0.2],
    swap: [SWAP1, SWAP2], logo: T.logo };
  return { poses: Object.fromEntries(Object.entries(W.poses).map(([k, v]) => [k, v && v.err !== undefined ? +v.err.toFixed(4) : (v && v.worst !== undefined ? v : null)])) };
}

// ------------------------------------------------------------------ the body: on the flat bench (curls, the phone); on the leg bench; on one leg
const CURLS = [0.45, 1.35, 2.25];                 // each curl: up 0.42 s, down 0.48 s
const SCROLL = [3.2, 3.75, 4.3, 4.85, 5.5];         // thumb flicks between sets
const EXT = { t0: 44.5, per: 3.2 };                 // leg extensions: up, hold, down
const SECS = [27.05, 27.65, 28.25];                 // the board's three sections appear
function where(t) { return t < SWAP1 ? 'flat' : t < SWAP2 ? 'leg' : 'balance'; }
const sit0P = () => new THREE.Vector3(S0.x, S0.seat + W.sitDrop + 0.003, S0.z + 0.0);   // the sitting bones on the pad, not in it
const sitP = () => new THREE.Vector3(S7.x, SEAT + W.sitDrop + 0.003, S7.z + BENCH_Z + 0.02);
function curlAt(t) { let k = 0; for (const c of CURLS) { const u = t - c; if (u >= 0 && u < 0.95) k = Math.max(k, u < 0.42 ? s5(0, 0.42, u) : 1 - s5(0.47, 0.95, u)); } return k; }
function seatBody(P, { lum = 0.05, tho = 0.14, cer = 0.0 } = {}, feet = 0.42) {   // the pelvis on a seat at P; the feet on the floor in front
  const R = W.rig;
  W.body.quaternion.identity(); W.body.position.copy(P).add(new THREE.Vector3(-R.P0.x, -R.P0.y, -R.P0.z));
  R.pelvis.position.copy(R.P0); R.pelvis.rotation.set(0, 0, 0);
  bendSpine(R.seg, { lum, tho, cer });
  W.body.updateMatrixWorld(true);
  for (const Side of ['Right', 'Left']) { const G = R.legs[Side]; legIK(R, Side, new THREE.Vector3(P.x + G.s * 0.17, W.ankleH, P.z + feet), new THREE.Quaternion().setFromAxisAngle(Y, -G.s * 0.15), Z); }
}
function poseFlat(t, solving = false) {
  const R = W.rig, look = solving ? 0.5 : 0.5 + 0.03 * Math.sin(t * 0.9);
  seatBody(sit0P(), { lum: 0.06, tho: 0.16, cer: look });
  if (W.poses && !solving) {
    const P = W.poses, k = curlAt(t), pr = mixArm(P.curlDown, P.curlUp, k);
    poseArm(R.arms.Right, pr); setWrist(W.wristR, pr); W.handR.curl(0, P.dbGrip.per, P.dbGrip.tk);
    poseArm(R.arms.Left, P.phone); setWrist(W.wristL, P.phone);
    let flick = 0; for (const s of SCROLL) { const u = t - s; if (u > 0 && u < 0.35) flick = Math.max(flick, Math.sin(Math.PI * u / 0.35)); }
    W.handL.curl(0, P.phoneGrip.per, P.phoneGrip.tk - 0.35 * flick, FLAT_WRAP);
  }
  W.body.updateMatrixWorld(true);
}
function extAt(t) {   // repetitions: up 1.2 s, hold, down 1.4 s
  if (t < EXT.t0) return 0; const u = ((t - EXT.t0) % EXT.per) / EXT.per;
  return u < 0.35 ? s5(0, 0.35, u) : u < 0.5 ? 1 : 1 - s5(0.5, 0.92, u);
}
function poseLeg(t) {   // on the leg bench; the knees straighten against the roller, slowly, and bend again; hands on the handles
  const R = W.rig, P = sitP();
  W.body.quaternion.identity(); W.body.position.copy(P).add(new THREE.Vector3(-R.P0.x, -R.P0.y, -R.P0.z));
  R.pelvis.position.copy(R.P0); R.pelvis.rotation.set(0, 0, 0);
  const turn = s5(T.so - 0.1, T.so + 0.5, t) * (1 - s5(T.excuse + 0.5, T.excuse + 1.3, t));
  bendSpine(R.seg, { lum: 0.05, tho: 0.12, cer: 0.1 - 0.12 * turn });
  if (R.seg.Atlas) R.seg.Atlas.g.rotation.y += 0.55 * turn; if (R.seg.Axis) R.seg.Axis.g.rotation.y += 0.25 * turn;   // "what's your excuse?": it turns to us
  const ext = extAt(t) * (1 - turn);
  W.body.updateMatrixWorld(true);
  for (const Side of ['Right', 'Left']) { const G = R.legs[Side];
    const a = lerp(0.0, 1.35, ext), shin = G.L2, kx = P.x + G.s * 0.12, kz = P.z + G.L1 * 0.98, ky = P.y - 0.03;
    legIK(R, Side, new THREE.Vector3(kx, ky - Math.cos(a) * shin, kz + Math.sin(a) * shin), new THREE.Quaternion(), Z); }
  if (W.poses) { for (const Side of ['Right', 'Left']) { const p = W.poses['handle' + Side], H = Side === 'Right' ? W.handR : W.handL; poseArm(R.arms[Side], p); setWrist(H.wr, p); H.curl(0, W.poses['grip' + Side].per, W.poses['grip' + Side].tk); } }
  W.body.updateMatrixWorld(true);
  return ext;
}
function poseBalance(t) {   // on the left foot on the pad, the right knee up, arms out
  const R = W.rig, sway = 0.012 * Math.sin(t * 1.7) + 0.006 * Math.sin(t * 3.1);
  W.body.quaternion.identity(); W.body.position.set(BAL.x - 0.03, 0.06 - W.ground, BAL.z - R.P0.z);
  R.pelvis.position.copy(R.P0).add(new THREE.Vector3(0.03, -0.01, 0)); R.pelvis.rotation.set(0, 0, -0.04 + sway);
  bendSpine(R.seg, { lum: 0.02, tho: 0.05, cer: 0.02, side: 0.06 - sway * 2 });
  W.body.updateMatrixWorld(true);
  const GL = R.legs.Left, GR = R.legs.Right, base = W.body.position;
  legIK(R, 'Left', new THREE.Vector3(base.x + GL.A.x + 0.01, base.y + GL.A.y, base.z + GL.A.z), new THREE.Quaternion(), Z);
  legIK(R, 'Right', new THREE.Vector3(base.x + GR.A.x + 0.03, base.y + GR.A.y + 0.3, base.z + GR.A.z + 0.14), new THREE.Quaternion().setFromAxisAngle(X, 0.3), Z);
  const out = { dir: [0.75, -1.3, 0.15], twist: 0.3, elbow: 0.15 };
  for (const Side of ['Right', 'Left']) { poseArm(R.arms[Side], out); setWrist(Side === 'Left' ? W.wristL : W.wristR, out); }
  W.handL.curl(0.15); W.handR.curl(0.15);
  W.body.updateMatrixWorld(true);
}
function poseBody(t) { const w = where(t); if (w === 'flat') poseFlat(t); else if (w === 'leg') poseLeg(t); else poseBalance(t); W.body.updateMatrixWorld(true); }

// the solved poses: the tiny dumbbell in the right hand (down and curled up), the phone in the left, the hands on the leg bench's handles
const barSDF = (M) => { const inv = M.clone().invert(), v = new THREE.Vector3(), sc = M.getMaxScaleOnAxis();   // the bar and both heads (dumbbell frame, unscaled units)
  return (p) => { v.copy(p).applyMatrix4(inv); const r = Math.hypot(v.y, v.z), x = Math.max(-0.065, Math.min(0.065, v.x));
    const bar = Math.hypot(v.x - x, r) - 0.0145, hc = 0.065 + DB.len / 2, head = Math.max(Math.abs(Math.abs(v.x) - hc) - DB.len / 2, r - DB.r);
    return Math.min(bar, head) * sc; }; };
function solvePoses() {
  const R = W.rig, out = {}, HR = W.handR, HL = W.handL;
  const bb = (re) => { const b = new THREE.Box3(); for (const m of W.meshes) if (re.test(m.userData.name)) b.expandByObject(m); return b; };
  const zone = (re, m) => { const b = bb(re); return { c: b.getCenter(new THREE.Vector3()), r: b.getSize(new THREE.Vector3()).multiplyScalar(0.5).addScalar(m) }; };
  // ---- on the flat bench
  poseFlat(0, true); R.root.updateMatrixWorld(true);
  const zHead = zone(/frontal bone|parietal bone|occipital bone|temporal bone|sphenoid|maxilla|zygomatic|nasal bone|mandible|tooth/i, 0.035);
  const zChest = zone(/\brib\b|sternum|manubrium|xiphoid|costal/i, 0.02);
  const zThighR = zone(/right femur/i, 0.03), zThighL = zone(/left femur/i, 0.03), zPelvis = zone(/hip bone|sacrum/i, 0.02);
  // the dumbbell: hanging by the right thigh, its bar across (along x); the hand round its bar, palm in (toward the body), then curled up
  { const sh = new THREE.Vector3(); R.arms.Right.arm.getWorldPosition(sh);
    const dbAt = sh.clone().add(new THREE.Vector3(-0.09, -0.47, 0.13));
    const dbQ = new THREE.Quaternion().setFromAxisAngle(Y, Math.PI / 2 - 0.2);   // the bar runs front to back, nearly: a hammer hold
    const dbM = new THREE.Matrix4().compose(dbAt, dbQ, new THREE.Vector3(DB.s, DB.s, DB.s));
    const axis = new THREE.Vector3(1, 0, 0).applyQuaternion(dbQ);
    const ko = keepOut(R, 'Right', HR, [zThighR, zPelvis, zChest]);
    const aims = [{ v: HR.across, to: axis.clone(), w: 0.3 }, { v: HR.n, to: new THREE.Vector3(1, 0, 0), w: 0.15 }];   // index forward, little finger back; palm in
    HR.curl(0.1);
    out.curlDown = solveHand(R, 'Right', HR, dbAt, { dir: [0.1, -1, 0.15], twist: 0.2, elbow: 0.3 }, aims, () => ko(), [{ dir: [0.1, -1, 0.15], twist: 0.2, elbow: 0.3 }, { dir: [0.2, -1, 0.3], twist: 0.6, elbow: 0.5 }, { dir: [0.0, -1, 0.0], twist: -0.3, elbow: 0.2 }]);
    poseArm(R.arms.Right, out.curlDown); setWrist(W.wristR, out.curlDown); R.root.updateMatrixWorld(true);
    out.dbGrip = HR.fit(barSDF(dbM), { need: 0.003, kmin: 0.05, kmax: 1.25, tmin: -1.4 }); HR.curl(0, out.dbGrip.per, out.dbGrip.tk); R.root.updateMatrixWorld(true);
    W.dbHM = W.wristR.g.matrixWorld.clone().invert().multiply(dbM);   // the dumbbell rides in the hand from here on
    const upAt = sh.clone().add(new THREE.Vector3(-0.07, -0.27, 0.3));   // the top of the curl: forearm level, the dumbbell upright in front of the belly, clear of the ribs
    out.curlUp = solveHand(R, 'Right', HR, upAt, { dir: [0.1, -1, 0.2], twist: 0.3, elbow: 2.0 }, [{ v: HR.n, to: new THREE.Vector3(1, 0, 0), w: 0.1 }], () => ko(), [{ dir: [0.1, -1, 0.2], twist: 0.3, elbow: 2.0 }, { dir: [0.15, -1, 0.35], twist: 0.6, elbow: 2.2 }, { dir: [0.05, -1, 0.1], twist: 0.0, elbow: 1.9 }]);   // a hammer curl: the palm stays in
    // the dumbbell's head must clear the shoulder and the chest at the top: checked by the audit
  }
  // the phone in the left hand: in front of the chest, its screen turned up to the eyes; palm on its back, fingers round the far edge
  { const st = avgV(posedVerts(R.byName.get('Body of sternum'), 2)), eyes = avgV(posedVerts(R.byName.get('Frontal bone'), 3)).add(new THREE.Vector3(0, -0.035, 0.03));   // as it sits
    const at = st.clone().add(new THREE.Vector3(0.08, 0.09, 0.28));
    const n = eyes.clone().sub(at).normalize(), top = new THREE.Vector3(0, 0, 1).addScaledVector(n, -n.z).normalize();   // its top leans away from the face
    const zl = top.clone().negate(), xl = new THREE.Vector3().crossVectors(n, zl).normalize();
    const qp = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(xl, n, zl));
    const phM = new THREE.Matrix4().compose(at, qp, new THREE.Vector3(1, 1, 1)), toPhone = phM.clone().invert(), v = new THREE.Vector3();
    const sdf = (p) => phoneSDF(v.copy(p).applyMatrix4(toPhone));
    const ko = keepOut(R, 'Left', HL, [zHead, zChest, zThighL]);
    const target = new THREE.Vector3(0.021, 0.011, 0.02).applyMatrix4(phM);
    const aims = [{ v: HL.n, to: new THREE.Vector3(0, 1, 0).applyQuaternion(qp), w: 0.3 }, { v: HL.fdir, to: new THREE.Vector3(1, 0, 0).applyQuaternion(qp), w: 0.2 }];
    const init = { dir: [0.35, -0.6, 0.6], twist: 0.6, elbow: 1.7 };
    HL.curl(0.08, null, 0.08, FLAT_WRAP);
    out.phone = solveHand(R, 'Left', HL, target, init, aims, () => ko() + 2 * handGap(HL, sdf, { palmOnly: true }).E,
      [init, { dir: [0.5, -0.5, 0.6], twist: 0.2, elbow: 1.5 }, { dir: [0.2, -0.7, 0.6], twist: 1.0, elbow: 1.9 }, { dir: [0.4, -0.8, 0.4], twist: -0.3, elbow: 1.6 }]);
    poseArm(R.arms.Left, out.phone); setWrist(W.wristL, out.phone); R.root.updateMatrixWorld(true);
    out.phoneGrip = HL.fit(sdf, { need: 0.003, kmin: 0.05, kmax: 0.95, prof: FLAT_WRAP, tmin: -0.8 }); HL.curl(0, out.phoneGrip.per, out.phoneGrip.tk, FLAT_WRAP); R.root.updateMatrixWorld(true);
    out.phoneGap = handGap(HL, sdf); out.phoneGap = { worst: +(out.phoneGap.worst * 1000).toFixed(1), who: out.phoneGap.who };
    W.phoneHM = W.wristL.g.matrixWorld.clone().invert().multiply(phM);
  }
  // ---- on the leg bench: each hand round its handle
  { poseLeg(46.0); R.root.updateMatrixWorld(true);
    for (const Side of ['Right', 'Left']) { const H = Side === 'Right' ? HR : HL, s = Side === 'Right' ? -1 : 1, hp = W.handles[Side === 'Right' ? 0 : 1];
      const hSDF = (p) => { const q = p.clone().sub(hp); const z = Math.max(-0.08, Math.min(0.08, q.z)); return Math.hypot(q.x, q.y, q.z - z) - 0.012; };
      H.curl(0.1);
      out['handle' + Side] = solveHand(R, Side, H, hp, { dir: [0.15, -1, 0.05], twist: 0.2, elbow: 0.25 }, [{ v: H.across, to: new THREE.Vector3(0, 0, -1), w: 0.25 }, { v: H.n, to: new THREE.Vector3(-s, 0, 0), w: 0.15 }]);   // thumbs forward, palms in
      poseArm(R.arms[Side], out['handle' + Side]); setWrist(H.wr, out['handle' + Side]); R.root.updateMatrixWorld(true);
      out['grip' + Side] = H.fit(hSDF, { need: 0.003, kmin: 0.05, kmax: 1.25, tmin: -0.6 }); }
  }
  return out;
}

// ------------------------------------------------------------------ the camera: one path, no cuts (views fitted per station: tools/fit17.py)
let CAM = null;
W.views = {   // fitted (tools/fit17.py): every station under the words, its print clear of the buttons and the bottom fifth
  open: { p: [-2.046, 0.81, 3.209], l: [-0.071, 1.086, 0.309], fov: 30 },        // the skeleton on its bench, from its dumbbell side, low
  chart: { p: [0.651, 1.561, 2.533], l: [1.232, 1.126, -0.07], fov: 30 },
  lh: { p: [1.432, 2.485, 2.527], l: [2.155, 1.172, -0.016], fov: 30 },
  week: { p: [2.43, 1.864, 2.489], l: [3.003, 1.244, -0.079], fov: 30 },
  board: { p: [3.83, 2.475, 2.657], l: [3.866, 1.168, -0.158], fov: 30 },
  prot: { p: [3.611, 2.074, 3.378], l: [4.664, 1.083, 0.018], fov: 30 },
  sleep: { p: [5.651, 1.544, 3.357], l: [5.624, 0.481, 0.074], fov: 30 },
  leg: { p: [8.688, 0.595, 3.422], l: [6.823, 1.128, 0.232], fov: 32 },          // from its right, low: the skull under the words
  thigh: { p: [6.38, 1.677, 1.076], l: [6.38, 1.137, 0.004], fov: 30 },
  moves: { p: [8.397, 2.354, 2.388], l: [7.879, 1.014, -0.132], fov: 30 },
  bal: { p: [6.45, 0.372, 4.943], l: [9.193, 1.468, 0.195], fov: 34 },            // low and wide: all of it, on one leg, under the words
  plateIn: { p: [PLATE.x + 0.05, 0.85, PLATE.z + 0.55], l: [PLATE.x, 0.0465, PLATE.z], fov: 32 },
  logo: { p: [PLATE.x, 0.0465 + LOGO_R / 0.115, PLATE.z + 0.004], l: [PLATE.x, 0.0465, PLATE.z], fov: 30 },
};
function buildCam() {
  const V = W.views, toward = (p, l, k) => p.map((v, i) => l[i] + (v - l[i]) * k);
  const key = (t, v, k = 1, extra = {}) => ({ t, p: V3(...toward(v.p, v.l, k)), l: V3(...v.l), fov: v.fov, stop: true, ...extra });
  return camTrack([
    { t: -3.0, p: V3(...toward(V.open.p, V.open.l, 1.06)), l: V3(...V.open.l), fov: V.open.fov },
    { t: 0.0, p: V3(...toward(V.open.p, V.open.l, 1.03)), l: V3(...V.open.l), fov: V.open.fov, tens: 0.4 },
    key(4.85, V.open, 0.93),
    key(5.6, V.chart), key(9.6, V.chart, 0.97),
    key(10.35, V.lh), key(20.4, V.lh, 0.97),
    key(21.15, V.week), key(25.3, V.week, 0.98), key(26.0, V.board), key(29.2, V.board, 0.98),
    key(29.95, V.prot), key(35.4, V.prot, 0.98), key(36.2, V.sleep), key(44.0, V.sleep, 0.98),
    key(44.85, V.leg), key(50.2, V.leg, 0.96), key(50.9, V.thigh), key(52.6, V.thigh, 0.97), key(53.3, V.leg, 0.95), key(54.4, V.leg, 0.93),
    key(55.15, V.moves), key(61.9, V.moves, 0.98),
    key(62.7, V.bal), key(73.9, V.bal, 0.93),
    key(75.2, V.plateIn),   // a straight line from the balance to the plate (a curve here swung close past the skeleton)
    key(T.logo, V.logo),
  ]);
}
function camPose(S, t) {
  const v = S.cfg.view; if (v && typeof v === 'object') return v;
  if (!CAM) CAM = buildCam();
  if (t <= T.logo) return CAM(t);
  const Q = CAM(T.logo), k = ss(T.logo, T.end, t), d = [Q.p[0] - Q.l[0], Q.p[1] - Q.l[1], Q.p[2] - Q.l[2]];
  return { p: [Q.l[0] + d[0] * (1 + 0.07 * k), Q.l[1] + d[1] * (1 + 0.07 * k), Q.l[2] + d[2] * (1 + 0.07 * k)], l: Q.l, fov: 30 };
}
function focusAt(S, t, P) { return Math.hypot(P.p[0] - P.l[0], P.p[1] - P.l[1], P.p[2] - P.l[2]); }

// ------------------------------------------------------------------ one moment of the film
function update(S, t) {
  const scene = S.scene, endDark = ss(T.factory - 0.5, T.logo - 0.3, t);
  poseBody(t);
  // ---- the tiny dumbbell and the phone ride in the hands (and are put away once the skeleton has moved)
  { const flat = where(t) === 'flat'; W.db.visible = flat; W.phone.g.visible = flat;
    if (flat) { W.db.matrix.multiplyMatrices(W.wristR.g.matrixWorld, W.dbHM); W.db.matrixWorldNeedsUpdate = true; W.db.updateMatrixWorld(true);
      W.phone.g.matrix.multiplyMatrices(W.wristL.g.matrixWorld, W.phoneHM); W.phone.g.matrixWorldNeedsUpdate = true; W.phone.g.updateMatrixWorld(true);
      let sc = 0; for (const s of SCROLL) sc += 420 * s5(s, s + 0.4, t); drawFeed(W.phone, sc);
      const sp = new THREE.Vector3(0, 0.03, 0).applyMatrix4(W.phone.g.matrixWorld); W.phoneLight.position.copy(sp); } }
  // ---- ARM SIZE: three years drawn flat; then up
  { const C = W.chart, k = s5(T.three - 0.2, T.grows + 0.3, t), up = s5(T.growing - 0.1, T.growing + 0.5, t), key = `${Math.round(k * 80)}|${Math.round(up * 30)}`;
    if (key !== C.key) { C.key = key; C.cv(C.c.getContext('2d'), C.c.width, C.c.height, k, up); C.tex.needsUpdate = true; } }
  // ---- light against heavy: the dumbbells lift at "push"; both sections grow alike
  { const L = W.lh, h = Math.sin(Math.PI * clamp01((t - T.push + 0.05) / 0.5)) * (t > T.push - 0.05 && t < T.push + 0.45 ? 1 : 0);
    L.light.db.position.y = L.light.y0 + 0.05 * h; L.heavy.db.position.y = L.heavy.y0 + 0.05 * h;
    const g = s5(T.built2 - 0.2, T.size + 0.4, t), r = 0.062 * (1 + 0.32 * g); L.light.cs.g.scale.setScalar(r); L.heavy.cs.g.scale.setScalar(r);
    L.sign.material.opacity = 0.3 + 0.7 * pulse(t, T.every - 0.15, 20.6, 0.4); }
  // ---- the week: twice
  W.week.ticks.forEach((m, i) => { m.material.opacity = s5(T.twice - 0.1 + i * 0.25, T.twice + 0.15 + i * 0.25, t); });
  // ---- the sets: three sections, smallest to largest
  W.board.secs.forEach((cs, i) => { const k = outBack(clamp01((t - SECS[i]) / 0.55), 1.4); cs.g.scale.setScalar(Math.max(0.0001, cs.r0 * k)); });
  // ---- protein: the line draws, and flattens at about 1.6
  { const P = W.prot, k = s5(T.helps - 0.2, T.kilo + 0.3, t), key = Math.round(k * 60); if (key !== P.key) { P.key = key; P.cv(P.c.getContext('2d'), P.c.width, P.c.height, k); P.tex.needsUpdate = true; } }
  // ---- the bricks: laid through the next day; the sleepless row stops 18% short
  W.sleep.rows.forEach((bs) => bs.forEach((m, k) => { const at = T.cut - 0.4 + k * 0.33, f = m.userData.full; m.visible = t > at && f > 0;
    m.scale.y = m.visible ? clamp01(f) : 0.0001; m.position.y = m.userData.y + 0.08 * (1 - s5(at, at + 0.25, t)); }));
  // ---- the leg bench: the lever follows the shins; the thigh's section grows 9%
  { const B = W.bench, ext = where(t) === 'leg' ? extAt(t) * (1 - s5(T.so - 0.1, T.so + 0.5, t) * (1 - s5(T.excuse + 0.5, T.excuse + 1.3, t))) : 0; B.lever.rotation.x = -lerp(0, 1.35, ext);
    const g9 = s5(T.nine - 0.2, T.eight + 0.4, t); B.th.g.scale.setScalar(0.075 * (1 + 0.09 * g9)); B.ring.material.opacity = 0.85 * pulse(t, T.nine - 0.3, 53.1, 0.4); }
  // ---- big moves: the three cards; a rep more; a small plate slides on
  { const M = W.moves; M.cards.forEach((m, i) => { m.material.opacity = s5([T.squats, T.pushups, T.rows][i] - 0.15, [T.squats, T.pushups, T.rows][i] + 0.2, t); });
    const n = t > T.rep2 - 0.05 ? 9 : 8; if (n !== M.reps) { M.reps = n; M.drawReps(n); }
    const pk = s5(T.weight - 0.3, T.weight + 0.25, t); M.small.forEach((pl) => { pl.position.set(pl.userData.s * lerp(0.3, 0.255, pk), lerp(-0.042, 0, pk) + 0.07 * Math.sin(Math.PI * pk), lerp(0.13, 0, pk)); }); }
  // ---- the plate: the logo on it
  { const lk = s5(T.final + 0.3, T.logo - 0.25, t); W.plate.logo.set({ weight: lk, white: lk, hours: 0, hand: ss(T.logo - 0.4, T.logo - 0.15, t), handScale: outBack(clamp01((t - (T.logo - 0.4)) / 0.35), 1.8) }); }
  // ---- light: key, rim, fill on wherever the skeleton is
  const fig = 1 - endDark, wh = where(t), at = t < LIGHT1 ? new THREE.Vector3(S0.x, 0.8, S0.z) : t < LIGHT2 ? new THREE.Vector3(S7.x, 0.9, S7.z) : new THREE.Vector3(BAL.x, 0.9, BAL.z);
  W.key.position.set(at.x + 1.2, 3.0, 2.3); W.key.target.position.copy(at); W.rim.position.set(at.x - 1.3, 2.6, -1.6); W.rim.target.position.copy(at).add(new THREE.Vector3(0, 0.1, 0));
  W.fill.position.set(at.x - 1.0, 1.4, 2.0); W.fill.target.position.copy(at);
  W.key.intensity = 11 * fig; W.rim.intensity = 4 * fig; W.fill.intensity = 1.0 * fig;
  for (const L of Object.values(W.lights)) L.intensity = L.userData.I * fig;
  W.lights.plate.intensity = W.lights.plate.userData.I * (1 - 0.5 * endDark);
  W.lampLight.intensity = 0.6 * fig;
  W.phoneLight.intensity = wh === 'flat' ? 0.12 : 0;
  S.tableMat.color.setScalar(0.3 * (1 - endDark * 0.9)); scene.environmentIntensity = 0.12 * (1 - endDark * 0.7); S.reflAmt = 0.5 * (1 - endDark);
}

// ------------------------------------------------------------------ the words on screen
const CAPS = [
  { t0: T.you, t1: 4.85, top: 292, size: 80, html: 'You’ve lifted the same<br><em>tiny dumbbells</em> for<br>three years, scrolling<br>between sets,' },
  { t0: T.and1, t1: 7.7, top: 300, size: 88, html: 'and you wonder<br>why <em>nothing grows</em>.' },
  { t0: T.lets, t1: 9.6, top: 300, size: 92, html: 'Let’s get you <em>growing</em>.' },
  { t0: T.your, t1: 12.6, top: 292, size: 84, html: 'Your muscles were<br>built to grow when<br>you <em>push them</em>:' },
  { t0: T.in21, t1: 16.05, top: 292, size: 84, html: 'in 21 studies, <em>light</em><br>and <em>heavy</em> loads' },
  { t0: T.built2, t1: 20.35, top: 292, size: 80, html: 'built <em>similar size</em> when<br>every set went to your<br><em>last possible rep</em>.' },
  { t0: T.the, t1: 25.4, top: 292, size: 72, html: 'The World Health<br>Organization recommends<br>strength work at least<br><em>twice a week</em>,' },
  { t0: T.and2, t1: 29.05, top: 292, size: 84, html: 'and in studies, more<br>weekly sets meant<br><em>more growth</em>.' },
  { t0: T.protein, t1: 35.45, top: 292, size: 80, html: 'Protein helps <em>a little</em>,<br>up to about <em>1.6 grams</em><br>per kilo of body<br>weight a day,' },
  { t0: T.and3, t1: 36.76, top: 300, size: 92, html: 'and so does <em>sleep</em>:' },
  { t0: T.inA, t1: 43.95, top: 292, size: 76, html: 'in a small trial, one<br>sleepless night cut the<br>next day’s muscle protein<br>building by <em>18%</em>.' },
  { t0: T.and4, t1: 46.0, top: 300, size: 92, html: 'And it’s <em>never too late</em>:' },
  { t0: T.inOne, t1: 52.45, top: 292, size: 80, html: 'in one small study,<br>frail 90-year-olds grew<br>their thigh muscles by<br><em>9%</em> in 8 weeks.' },
  { t0: T.so, t1: 54.3, top: 300, size: 84, html: 'So what’s your <em>excuse</em>?' },
  { t0: T.pick, t1: 58.25, top: 292, size: 84, html: 'Pick a few <em>big moves</em>,<br>like squats, push-ups<br>and rows,' },
  { t0: T.and5, t1: 61.75, top: 292, size: 84, html: 'and add <em>a rep</em> or<br><em>a little weight</em><br>whenever it gets easy.' },
  { t0: T.if1, t1: 67.2, top: 292, size: 82, html: 'If you’re over 65, add<br><em>balance training</em> too,<br>to help prevent falls.' },
  { t0: T.and6, t1: 71.5, top: 292, size: 80, html: 'And if you have a health<br>condition or haven’t<br>exercised for a while,' },
  { t0: T.check, t1: 73.75, top: 300, size: 86, html: 'check with your <em>doctor</em><br>before you start.' },
  { t0: T.final, t1: 99, top: 360, size: 92, html: 'Let’s get you back to<br><em>factory settings.</em>' },
];
function overlayInit(S) {}
function overlay(S, t) {
  const c = new THREE.Vector3(PLATE.x, PLATE.y + 0.0465, PLATE.z);
  logoEnd(S, t, { t0: T.logo, center: c, edge: c.clone().add(new THREE.Vector3(0, 0, LOGO_R)) });
}

makeFilm({
  T, caps: CAPS, subs: [], build, update, pose: camPose, overlay, overlayInit, focus: focusAt,
  stage: { bg: 0x07080a, reflSize: 11, env: 0.12, far: 30 },
  aperture: [[0, 0.003], [5.6, 0.003], [10.1, 0.003], [21.15, 0.003], [29.95, 0.003], [44.85, 0.003], [55.15, 0.003], [62.7, 0.002], [75.2, 0.003]],
  bloom: [[0, 0.5], [74, 0.55]],
  shade: [[50.25, 50.95]],   // the whip from the skeleton to the thigh's section carries its skull up behind the words
  fast: [[4.85, 5.6, 2], [25.3, 26.0, 2], [50.2, 50.9, 2], [52.6, 53.3, 2], [9.6, 10.35, 2], [20.4, 21.15, 2], [29.2, 29.95, 2], [35.4, 36.2, 2], [44.0, 44.85, 2], [54.4, 55.15, 2], [61.9, 62.7, 2], [73.9, 75.2, 2]],
});

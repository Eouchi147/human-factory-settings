// Human Factory Settings · Film 15 "Why do I get hangry?" (new direction, 7 Oct 2026) · one continuous shot, 9:16.
// A skeleton at an office desk types a reply to a colleague: YOU ARE AN IDIOT. Its jaw snaps, steam puffs from its temples.
// A station clock says three in the afternoon; lunch, on a plate, was a coffee. A sandwich drops onto the plate. A hunger
// gauge: built for hunger, pushed too far, the needle runs past EMPTY into ANGRY (the gag). A whiteboard fills with three
// weeks of ratings, five a day, then a scatter that climbs: the hungrier, the angrier. Hangry is real. The computer crashes;
// rate the researcher: harsh; how are you feeling? fair again. Meals at regular times on the clock; a real snack drops in.
// The email again, and a dialog: angry, or just hungry? Hungry. The insult is deleted: Sorry, back after lunch. The
// warnings, plain. The clock becomes the logo. The factory stamp is on the breastbone.
import { THREE, ORANGE, ss, s5, lerp, clamp01, hash, camTrack, phys, shadows, spot, RoundedBoxGeometry, glowSprite, softSprite,
  loadAnatomy, V3, place, logoEnd, makeFilm, outBack, stamp, stampCanvas, stampSpot, noiseTex } from '../kit.js';
import { buildRig, skeletonKind, bendSpine, poseArm, legIK, worldVerts, avgV, clearArms } from '../rig.js';
import { makeLogoRing, makeClock } from '../props.js';

//@HANDS@

// ------------------------------------------------------------------ timing, from the voice guide (word starts)
const T = {
  end: 80.59, logo: 78.07,
  you: 0.35, snap: 0.8, colleague: 1.33, decide: 1.94, idiot: 2.88, when: 3.32, three: 4.12, afternoon: 4.78, lunch: 5.95, coffee: 6.83,
  lets: 7.7, fed: 8.58,
  your: 9.78, built: 10.83, hunger: 11.42, push: 11.99, far: 12.83, hunger2: 13.42, anger: 14.89,
  in: 16.33, sixtyfour: 17.24, rated: 18.42, five: 19.98, three2: 21.47, weeks: 21.85, and: 22.15, hungrier: 22.74, angrier: 23.95, irritable: 25.1, felt: 26.21,
  so: 27.09, hangry: 27.63, real: 28.16,
  in2: 29.2, lab: 29.81, blamed: 30.99, computer: 31.9, crash: 32.69, saw: 33.02, researcher: 33.37, harsher: 34.35, unless: 34.74, stopped: 36.19, think: 36.71, feelings: 37.58,
  so2: 39.0, eat: 39.54, regular: 40.54, times: 41.01, keep: 41.43, real2: 41.94, snack: 42.28, lunches: 43.22, and2: 43.91, send: 45.02, email: 45.61, ask: 46.16, am: 47.14, angry: 47.77, just: 48.55, hungry: 49.0,
  hunger3: 50.04, explains: 50.62, doesnt: 51.54, excuse: 51.89,
  if: 53.43, insulin: 54.2, shaky: 57.22, that: 59.05, low: 60.1, treat: 61.52, team: 64.53,
  and3: 66.23, dont: 67.01, or: 71.09, stress: 73.19, see: 73.6, doctor: 74.21,
  final: 75.8, factory: 77.01, settings: 77.38,
};

// ------------------------------------------------------------------ the set (metres, floor at y = 0): the desk at the origin; the skeleton sits at -z, facing +z; +x is its left
const W = {}; window.HFS_W = W;
const X = new THREE.Vector3(1, 0, 0), Y = new THREE.Vector3(0, 1, 0), Z = new THREE.Vector3(0, 0, 1);
const DESK = { w: 1.3, d: 0.72, top: 0.74 };
const SEAT = 0.46, SEAT_Z = -0.45;
const KB = { x: 0, z: -0.005, w: 0.42, d: 0.14, h: 0.02 }, KEYTOP = DESK.top + KB.h + 0.007;
const MON = { x: 0, z: 0.27, w: 0.54, h: 0.34, y: 1.035 };                // the screen's centre; it faces the skeleton (-z)
const PLATE = new THREE.Vector3(-0.43, DESK.top, 0.09), CUP = new THREE.Vector3(-0.37, DESK.top + 0.006, 0.04);
const GAUGE = new THREE.Vector3(0.46, DESK.top, 0.12);
const SNACK = new THREE.Vector3(-0.5, DESK.top, 0.29);
const CLOCK = { x: -1.25, z: 0.95, y: 1.5, ry: 0.55, s: 3.2 };              // a station clock on a pole, out at the front right
const STEAM_T = [T.idiot - 0.3, 3.9], STEAM2_T = [T.anger - 0.15, 17.6];   // the second puff still going when the camera gets back to the skull
const SANDWICH_T = T.fed + 0.05, SNACK_T = [T.real2 + 0.05, T.snack + 0.2], CUP_T = [T.lets + 0.1, T.fed - 0.1];   // the coffee lifts away, then the sandwich lands
const pulse = (t, a, b, r = 0.35) => ss(a, a + r, t) * (1 - ss(b - r, b, t));
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
// steam: soft sprites that rise, swell and fade, on a loop (as in film 12)
let STEAM_TEX = null;
function makeSteam(parent, n, { r = 0.012, rise = 0.12, size = 0.035, life = 1.2, opacity = 0.3 } = {}) {
  if (!STEAM_TEX) STEAM_TEX = softSprite();
  const ps = [];
  for (let i = 0; i < n; i++) { const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: STEAM_TEX, transparent: true, depthWrite: false, opacity: 0, color: 0xeef2f6 }));
    m.userData = { a: hash(i * 3.7 + n) * Math.PI * 2, rr: Math.sqrt(hash(i * 5.1 + n)) * r, ph: hash(i * 7.9 + n), sw: 0.5 + hash(i * 9.3 + n) }; m.renderOrder = 7; m.visible = false; parent.add(m); ps.push(m); }
  return { ps, rise, size, life, opacity };
}
function setSteam(St, t, amt, dir) {   // dir: the way the puffs travel (in the parent's frame)
  for (const m of St.ps) { const d = m.userData, u = (((t / St.life + d.ph) % 1) + 1) % 1; m.visible = amt > 0.003; if (!m.visible) continue;
    m.position.set(Math.sin(d.a) * d.rr + dir.x * St.rise * u, Math.cos(d.a) * d.rr * 0.5 + dir.y * St.rise * u + 0.02 * u * u, dir.z * St.rise * u);
    m.scale.setScalar(St.size * (0.4 + 1.3 * u)); m.material.opacity = St.opacity * amt * Math.pow(Math.sin(Math.PI * u), 1.3); }
}

// ------------------------------------------------------------------ the camera's views (fitted: see the notes by each)
W.views = {
  mail: { p: [1.2, 2.0, -1.9], l: [-0.096, 1.055, 0.218], fov: 30 },        // over its left shoulder: the screen, the skull to the right of it
  study: { p: [0.9, 2.1, -1.4], l: [-0.033, 1.088, 0.278], fov: 30 },       // the same, closer: the screen fills the width under the words
  clock: { p: [-0.446, 1.627, 2.262], l: [-1.23, 1.574, 0.982], fov: 30 },  // square on to the clock's face
  lunch: { p: [-1.0, 1.45, -0.6], l: [-0.42, 0.828, 0.12], fov: 30 },        // from behind its right side: the skeleton out of the frame
  gauge: { p: [0.2, 1.35, 1.15], l: [0.477, 0.965, 0.105], fov: 30 },
  snack: { p: [-0.5, 1.75, -0.7], l: [-0.446, 0.786, 0.205], fov: 30 },     // over its right shoulder: the plate, the snack beyond
  warn: { p: [0.7, 1.8, 1.1], l: [0.014, 1.257, -0.356], fov: 30 },         // the front left, orbiting round to its left side
  logoIn: { p: [0.08, 1.707, 3.119], l: [-1.223, 1.507, 0.994], fov: 30 },
  logo: { p: [-0.306, 1.648, 2.49], l: [-1.223, 1.507, 0.994], fov: 30 },  // on the clock face's axis: the ring is the logo
};

// ------------------------------------------------------------------ the desk, the stool, the keyboard, the monitor
function makeDesk(scene) {
  const g = new THREE.Group(); scene.add(g);
  const top = phys({ color: 0x23201c, roughness: 0.5, clearcoat: 0.35, clearcoatRoughness: 0.35, roughnessMap: noiseTex(7, 256, 0.8, 1.0, 12) }), metal = phys({ color: 0x2c2e33, metalness: 0.8, roughness: 0.35 });
  const slab = new THREE.Mesh(new RoundedBoxGeometry(DESK.w, 0.03, DESK.d, 4, 0.008), top); slab.position.y = DESK.top - 0.015; g.add(slab);
  for (const sx of [-1, 1]) { const frame = new THREE.Mesh(new RoundedBoxGeometry(0.05, DESK.top - 0.03, DESK.d - 0.12, 3, 0.008), metal); frame.position.set(sx * (DESK.w / 2 - 0.08), (DESK.top - 0.03) / 2, 0); g.add(frame);
    const foot = new THREE.Mesh(new RoundedBoxGeometry(0.07, 0.025, DESK.d - 0.04, 3, 0.008), metal); foot.position.set(sx * (DESK.w / 2 - 0.08), 0.0125, 0); g.add(foot); }
  const stool = new THREE.Group(); stool.position.set(0, 0, SEAT_Z); g.add(stool); const black = blackMat();
  const st = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.035, 96), black); st.position.y = SEAT - 0.0175; stool.add(st);
  for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2 + 0.5, leg = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.011, SEAT - 0.03, 20), black);
    leg.position.set(Math.cos(a) * 0.12, (SEAT - 0.03) / 2, Math.sin(a) * 0.12); leg.rotation.set(Math.sin(a) * 0.08, 0, -Math.cos(a) * 0.08); stool.add(leg); }
  return finish(g);
}
function makeKeyboard(scene) {
  const g = new THREE.Group(); g.position.set(KB.x, DESK.top, KB.z); scene.add(g);
  const body = new THREE.Mesh(new RoundedBoxGeometry(KB.w, KB.h, KB.d, 3, 0.006), phys({ color: 0x1b1c20, roughness: 0.45, clearcoat: 0.3 })); body.position.y = KB.h / 2; g.add(body);
  const capGeo = new RoundedBoxGeometry(0.0165, 0.007, 0.0165, 2, 0.003), capMat = phys({ color: 0x2b2d33, roughness: 0.5 });
  const rows = 5, cols = 21, n = rows * cols, im = new THREE.InstancedMesh(capGeo, capMat, n), m4 = new THREE.Matrix4(); let k = 0;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { const x = -KB.w / 2 + 0.014 + c * 0.0186, z = -KB.d / 2 + 0.017 + r * 0.0215; if (r === 4 && c > 5 && c < 13) { if (c === 6) { m4.makeScale(7.2, 1, 1).setPosition(x + 0.056, KB.h + 0.0035, z); im.setMatrixAt(k++, m4); } continue; } m4.makeTranslation(x, KB.h + 0.0035, z); im.setMatrixAt(k++, m4); }
  im.count = k; im.castShadow = true; im.receiveShadow = true; g.add(im);
  return finish(g);
}
// the screen: a canvas the film redraws as it changes (the email, the crash, the rating, the dialog)
function makeMonitor(scene) {
  const g = new THREE.Group(); g.position.set(MON.x, 0, MON.z); g.rotation.y = Math.PI; scene.add(g);   // its front faces -z, the skeleton
  const shell = phys({ color: 0x16171a, roughness: 0.38, clearcoat: 0.5 }), metal = phys({ color: 0x8c9097, metalness: 0.9, roughness: 0.3 });
  const frame = new THREE.Mesh(new RoundedBoxGeometry(MON.w + 0.024, MON.h + 0.024, 0.022, 4, 0.008), shell); frame.position.set(0, MON.y, -0.004); g.add(frame);
  const neck = new THREE.Mesh(new RoundedBoxGeometry(0.05, MON.y - MON.h / 2 - DESK.top + 0.02, 0.02, 3, 0.006), metal); neck.position.set(0, DESK.top + (MON.y - MON.h / 2 - DESK.top) / 2, -0.03); g.add(neck);
  const base = new THREE.Mesh(new RoundedBoxGeometry(0.2, 0.012, 0.14, 3, 0.005), metal); base.position.set(0, DESK.top + 0.006, -0.03); g.add(base);
  const c = document.createElement('canvas'); c.width = 1280; c.height = 806; const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(MON.w, MON.h), new THREE.MeshBasicMaterial({ map: tex, toneMapped: true })); screen.position.set(0, MON.y, 0.0075); g.add(screen);
  const glow = new THREE.PointLight(0xcfe0ff, 0, 1.6, 2); glow.position.set(0, MON.y, 0.25); g.add(glow);
  finish(g); screen.castShadow = false;
  return { g, c, tex, screen, glow, key: '' };
}
const MAIL = { to: 'colleague', subject: 'Re: quick question', angry: 'You are an idiot.', sorry: 'Sorry. Back after lunch.' };
function typed(s, t0, t1, t) { const n = Math.max(0, Math.min(s.length, Math.floor(((t - t0) / (t1 - t0)) * s.length + 1e-6))); return s.slice(0, n); }
function screenState(t) {   // what the screen shows at t
  if (t >= 16.0 && t < 31.85) return { kind: 'study', ...studyState(t) };
  if (t < 16.0 || t >= 43.6) {
    let body = typed(MAIL.angry, 0.62, 2.8, t), dialog = 0, pick = 0;
    if (t > 43.6) { body = MAIL.angry; dialog = s5(T.ask - 0.1, T.ask + 0.25, t) * (1 - s5(49.6, 49.9, t)); pick = t > T.hungry + 0.2 ? 2 : 0; }
    if (t > 49.9) { const del = typed(MAIL.angry, 50.0, 50.85, t); body = MAIL.angry.slice(0, MAIL.angry.length - del.length); if (t > 50.95) body = typed(MAIL.sorry, 51.0, 52.55, t); }
    return { kind: 'mail', body, dialog: +dialog.toFixed(2), pick, caret: Math.floor(t * 2.2) % 2 };
  }
  if (t < 33.3) return { kind: 'crash', k: +s5(31.85, 32.25, t).toFixed(2) };
  const knob = lerp(0.5, 0.92, s5(T.harsher - 0.2, T.harsher + 0.35, t)) - 0.42 * s5(37.1, 37.9, t);
  return { kind: 'rate', knob: +knob.toFixed(3), feel: +s5(35.6, 36.1, t).toFixed(2) };
}
function drawScreen(M, st) {
  const key = JSON.stringify(st); if (key === M.key) return; M.key = key;
  const x = M.c.getContext('2d'), w = M.c.width, h = M.c.height;
  if (st.kind === 'mail') {
    x.fillStyle = '#eceef2'; x.fillRect(0, 0, w, h);
    x.fillStyle = '#2b2e35'; x.fillRect(0, 0, w, 78); txt(x, 'New message', 40, 40, { font: '600 34px Archivo', color: '#e8eaee', align: 'left' });
    for (const [i, lab, val] of [[0, 'To', MAIL.to], [1, 'Subject', MAIL.subject]]) { const y = 120 + i * 70; txt(x, lab, 50, y, { font: '500 32px Archivo', color: '#7a7f88', align: 'left' }); txt(x, val, 220, y, { font: '600 32px Archivo', color: '#2b2e35', align: 'left' }); x.fillStyle = '#d3d6dc'; x.fillRect(40, y + 32, w - 80, 2); }
    txt(x, st.body, 60, 330, { font: '800 92px Archivo', color: '#16181c', align: 'left', maxW: w - 140 });
    if (st.caret && st.dialog < 0.5) { x.font = '800 92px Archivo'; const cw = x.measureText(st.body).width; x.fillStyle = '#16181c'; x.fillRect(64 + Math.min(cw, w - 140), 282, 6, 96); }
    x.fillStyle = '#2f6fdf'; x.beginPath(); x.roundRect(40, h - 120, 220, 80, 14); x.fill(); txt(x, 'Send', 150, h - 79, { font: '700 40px Archivo', color: '#ffffff' });
    if (st.dialog > 0.01) {
      x.fillStyle = `rgba(10,12,16,${0.45 * st.dialog})`; x.fillRect(0, 0, w, h);
      x.globalAlpha = st.dialog; const bw = 900, bh = 440, bx = (w - bw) / 2, by = (h - bh) / 2 + 20 * (1 - st.dialog);
      x.fillStyle = '#ffffff'; x.beginPath(); x.roundRect(bx, by, bw, bh, 24); x.fill();
      txt(x, 'Before you send:', w / 2, by + 90, { font: '600 40px Archivo', color: '#5a5f68' });
      txt(x, 'angry, or just hungry?', w / 2, by + 180, { font: '800 64px Archivo', color: '#16181c', maxW: bw - 80 });
      [['Angry', -1], ['Hungry', 1]].forEach(([lab, s], i) => { const picked = st.pick === i + 1, bx2 = w / 2 + s * 200 - 170;
        x.fillStyle = picked ? '#2f6fdf' : '#e6e8ec'; x.beginPath(); x.roundRect(bx2, by + 270, 340, 100, 18); x.fill();
        txt(x, lab, bx2 + 170, by + 322, { font: '700 46px Archivo', color: picked ? '#ffffff' : '#2b2e35' }); });
      x.globalAlpha = 1; }
  } else if (st.kind === 'study') {
    // three weeks of ratings, five a day, filled in order; then hunger against anger; then the stamp
    const ink = '#1f2937', red = '#c2312b', blue = '#2f5fbf';
    x.fillStyle = '#eceef2'; x.fillRect(0, 0, w, h); x.fillStyle = '#2b2e35'; x.fillRect(0, 0, w, 60);
    for (let k = 0; k < 3; k++) { x.fillStyle = ['#e0605a', '#e8b84a', '#5fbf6a'][k]; x.beginPath(); x.arc(36 + k * 34, 30, 10, 0, Math.PI * 2); x.fill(); }
    const gx = 64, gy = 92, cw = (w - 128) / 21, chh = 34;
    for (let i = 0; i < 105; i++) { const q = CELLS[i], cx = gx + q.day * cw, cy = gy + q.slot * (chh + 6);
      x.strokeStyle = '#c9cdd4'; x.lineWidth = 2; x.strokeRect(cx + 3, cy, cw - 6, chh);
      if (i < st.fill) { x.fillStyle = `rgba(194,49,43,${0.18 + 0.7 * q.an})`; x.fillRect(cx + 5, cy + 2, cw - 10, chh - 4); } }
    if (st.plot > 0) {
      const px0 = 150, px1 = w - 90, py0 = h - 86, py1 = 330;
      x.strokeStyle = ink; x.lineWidth = 6; x.beginPath(); x.moveTo(px0, py1 - 16); x.lineTo(px0, py0); x.lineTo(px1 + 16, py0); x.stroke();
      txt(x, 'HUNGER →', (px0 + px1) / 2, py0 + 46, { font: '800 40px Archivo', color: ink, track: 4 });
      x.save(); x.translate(px0 - 56, (py0 + py1) / 2); x.rotate(-Math.PI / 2); txt(x, 'ANGER →', 0, 0, { font: '800 40px Archivo', color: ink, track: 4 }); x.restore();
      const n = Math.round(105 * st.plot);
      for (let i = 0; i < n; i++) { const q = CELLS[i]; x.fillStyle = blue; x.beginPath(); x.arc(lerp(px0 + 20, px1, q.hu), lerp(py0 - 20, py1, q.an), 9, 0, Math.PI * 2); x.fill(); }
      if (st.line > 0) { x.strokeStyle = red; x.lineWidth = 12; x.lineCap = 'round'; x.beginPath(); x.moveTo(px0 + 20, lerp(py0 - 20, py1, 0.12)); x.lineTo(lerp(px0 + 20, px1, st.line), lerp(py0 - 20, py1, 0.12 + 0.62 * st.line)); x.stroke(); }
    }
    if (st.real > 0) { x.globalAlpha = st.real; x.save(); x.translate(w * 0.6, h * 0.62); x.rotate(-0.12); x.scale(1 + 0.25 * (1 - st.real), 1 + 0.25 * (1 - st.real)); x.strokeStyle = red; x.lineWidth = 12; x.strokeRect(-260, -76, 520, 152); txt(x, 'HANGRY: REAL', 0, 6, { font: '900 76px Archivo', color: red, track: 4 }); x.restore(); x.globalAlpha = 1; }
  } else if (st.kind === 'crash') {
    x.fillStyle = '#3a3f4a'; x.fillRect(0, 0, w, h); x.globalAlpha = st.k;
    txt(x, 'ERROR', w / 2, 300, { font: '900 200px Archivo', color: '#f2f3f5', track: 10 }); txt(x, 'The task stopped responding.', w / 2, 470, { font: '600 48px Archivo', color: '#c9ccd2' });
    x.strokeStyle = '#f2f3f5'; x.lineWidth = 10; x.beginPath(); x.moveTo(w / 2 - 60, 560); x.lineTo(w / 2 + 60, 680); x.moveTo(w / 2 + 60, 560); x.lineTo(w / 2 - 60, 680); x.stroke(); x.globalAlpha = 1;
  } else {
    x.fillStyle = '#eceef2'; x.fillRect(0, 0, w, h);
    txt(x, 'Rate the researcher', w / 2, 150, { font: '800 72px Archivo', color: '#16181c' });
    const y = 400, x0 = 160, x1 = w - 160; x.fillStyle = '#c7cad1'; x.beginPath(); x.roundRect(x0, y - 8, x1 - x0, 16, 8); x.fill();
    const kx = lerp(x0, x1, st.knob); x.fillStyle = st.knob > 0.7 ? '#c2312b' : '#2f6fdf'; x.beginPath(); x.roundRect(x0, y - 8, kx - x0, 16, 8); x.fill();
    x.beginPath(); x.arc(kx, y, 34, 0, Math.PI * 2); x.fill(); x.fillStyle = '#ffffff'; x.beginPath(); x.arc(kx, y, 14, 0, Math.PI * 2); x.fill();
    txt(x, 'fair', x0, y + 90, { font: '700 46px Archivo', color: '#5a5f68' }); txt(x, 'harsh', x1, y + 90, { font: '700 46px Archivo', color: '#5a5f68' });
    if (st.feel > 0.01) { x.globalAlpha = st.feel; x.fillStyle = '#fff4c8'; x.beginPath(); x.roundRect(w / 2 - 380, 570, 760, 150, 22); x.fill();
      txt(x, 'First: how are you feeling?', w / 2, 646, { font: '700 52px Archivo', color: '#3b3420', maxW: 700 }); x.globalAlpha = 1; }
  }
  M.tex.needsUpdate = true;
}

// ------------------------------------------------------------------ lunch: a plate with a paper cup of coffee on it; the sandwich that drops onto it; the snack
function makeLunch(scene) {
  const g = new THREE.Group(); g.position.copy(PLATE); scene.add(g);
  const china = new THREE.MeshPhysicalMaterial({ color: 0xece9e2, roughness: 0.3, clearcoat: 0.6, clearcoatRoughness: 0.2 });
  const plate = new THREE.Mesh(lathe([[0, 0.0005], [0.07, 0.0005], [0.074, 0.004], [0.088, 0.006], [0.11, 0.012], [0.124, 0.016], [0.126, 0.0145], [0.11, 0.009], [0.088, 0.0062], [0.0, 0.0062]], 96), china); g.add(plate);
  const card = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.05), new THREE.MeshPhysicalMaterial({ map: canvasTex(512, 256, (x, w, h) => { x.fillStyle = '#f2efe7'; x.fillRect(0, 0, w, h); x.strokeStyle = '#2a2b2f'; x.lineWidth = 8; x.strokeRect(12, 12, w - 24, h - 24); txt(x, 'LUNCH', w / 2, h / 2 + 4, { font: '900 110px Archivo', color: '#1d1e22', track: 10 }); }), roughness: 0.7 }));
  const cardRear = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.05), phys({ color: 0xe8e5dc, roughness: 0.7 })); cardRear.rotation.y = Math.PI; card.add(cardRear);
  const cardG = new THREE.Group(); cardG.position.set(0.052, 0, 0.12); cardG.rotation.y = -2.05; g.add(cardG);   // a place card beyond the plate, facing the camera that looks at lunch from over the right shoulder
  card.position.set(0.0, 0.032, 0); card.rotation.x = -0.25; cardG.add(card);
  const cardBack = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.002, 0.03), phys({ color: 0xe2dfd6, roughness: 0.7 })); cardBack.position.set(0, 0.009, -0.007); cardG.add(cardBack);
  // a paper cup with a sleeve and a lid
  const cup = new THREE.Group(); cup.position.set(CUP.x - PLATE.x, 0.0062, CUP.z - PLATE.z); g.add(cup);
  const paper = phys({ color: 0xf2efe8, roughness: 0.7, side: THREE.DoubleSide }), sleeve = phys({ color: 0x9b7a55, roughness: 0.85 }), lid = phys({ color: 0x1f2024, roughness: 0.4, clearcoat: 0.4 });
  cup.add(new THREE.Mesh(lathe([[0.0001, 0], [0.026, 0], [0.034, 0.105], [0.0001, 0.105]], 48), paper));
  const sl = new THREE.Mesh(lathe([[0.0288, 0.032], [0.0318, 0.075], [0.0318, 0.075], [0.0288, 0.032]], 48), sleeve); cup.add(sl);
  const sleeveBand = new THREE.Mesh(new THREE.CylinderGeometry(0.0322, 0.0296, 0.043, 48, 1, true), sleeve); sleeveBand.position.y = 0.0535; cup.add(sleeveBand);
  const lidM = new THREE.Mesh(lathe([[0.0001, 0.104], [0.0355, 0.104], [0.036, 0.11], [0.03, 0.116], [0.0001, 0.117]], 48), lid); cup.add(lidM);
  // the sandwich, in its triangle halves
  const sw = new THREE.Group(); g.add(sw); sw.visible = false;
  const bread = phys({ color: 0xe0c08c, roughness: 0.8, roughnessMap: noiseTex(3, 128, 0.7, 1, 20) }), crust = phys({ color: 0xb98a4d, roughness: 0.8 }), leaf = phys({ color: 0x5f9a3a, roughness: 0.6 }), tom = phys({ color: 0xc8372a, roughness: 0.35 }), cheese = phys({ color: 0xf0c64a, roughness: 0.5 });
  const tri = (y, m, h, dx, rot, s = 1) => { const sh = new THREE.Shape(); sh.moveTo(-0.055 * s, -0.04 * s); sh.lineTo(0.055 * s, -0.04 * s); sh.lineTo(0, 0.055 * s); sh.closePath(); const geo = new THREE.ExtrudeGeometry(sh, { depth: h, bevelEnabled: true, bevelThickness: 0.002, bevelSize: 0.002, bevelSegments: 2 }); geo.rotateX(-Math.PI / 2); const mm = new THREE.Mesh(geo, m); mm.position.set(dx, 0.0062 + y, 0.035); mm.rotation.y = rot; sw.add(mm); return mm; };
  for (const [dx, rot] of [[0.035, 0.3], [-0.03, 0.3 + Math.PI]]) { tri(0.0, bread, 0.011, dx, rot); tri(0.0125, leaf, 0.002, dx, rot, 1.03); tri(0.015, cheese, 0.003, dx, rot, 0.98); tri(0.019, tom, 0.003, dx, rot, 0.95); tri(0.0235, bread, 0.011, dx, rot); }
  finish(g); card.castShadow = false;
  return { g, sw, cup, cupY: cup.position.y };
}
function makeSnack(scene) {
  const g = new THREE.Group(); g.position.copy(SNACK); scene.add(g);
  const apple = new THREE.Mesh(new THREE.SphereGeometry(0.038, 32, 24), phys({ color: 0x7aa04a, roughness: 0.45, clearcoat: 0.6 })); apple.scale.set(1, 0.9, 1); apple.position.set(-0.04, 0.034, 0); g.add(apple);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.002, 0.0025, 0.016, 8), phys({ color: 0x4a3420, roughness: 0.8 })); stem.position.set(-0.04, 0.072, 0); stem.rotation.z = 0.25; g.add(stem);
  const bowl = new THREE.Group(); bowl.position.set(0.05, 0, 0.01); g.add(bowl);
  bowl.add(new THREE.Mesh(lathe([[0, 0.0005], [0.022, 0.0005], [0.026, 0.004], [0.04, 0.02], [0.043, 0.026], [0.0405, 0.0262], [0.037, 0.021], [0.021, 0.0055], [0, 0.0055]], 64), new THREE.MeshPhysicalMaterial({ color: 0x2f5f8f, roughness: 0.3, clearcoat: 0.7 })));
  const nutMat = phys({ color: 0x9a6236, roughness: 0.75, roughnessMap: noiseTex(5, 64, 0.7, 1, 30) }), nutGeo = new THREE.SphereGeometry(0.008, 16, 10);
  for (let i = 0; i < 14; i++) { const a = hash(i * 2.3) * Math.PI * 2, r = Math.sqrt(hash(i * 4.1)) * 0.026, m = new THREE.Mesh(nutGeo, nutMat); m.scale.set(1.5, 0.75, 0.95);
    m.position.set(Math.cos(a) * r, 0.012 + 0.009 * (1 - r / 0.026) + 0.004 * hash(i * 6.7), Math.sin(a) * r); m.rotation.set(hash(i) * 0.6, a + hash(i * 9.1), hash(i * 3.3) * 0.5); bowl.add(m); }
  finish(g); g.visible = false; return { g };
}

// ------------------------------------------------------------------ the hunger gauge: FULL to EMPTY, and past it, ANGRY
const G_A0 = -2.0, G_A1 = 0.55, G_A2 = 2.05;   // the needle's angle (from straight up, + clockwise): FULL, EMPTY, the end of ANGRY
function makeGauge(scene) {
  const g = new THREE.Group(); g.position.copy(GAUGE); g.rotation.y = -0.55; scene.add(g);
  const shell = phys({ color: 0x17181b, roughness: 0.4, clearcoat: 0.6 }), chrome = phys({ color: 0xd4d8de, metalness: 1, roughness: 0.18 });
  const R = 0.11, cy = 0.17;
  const foot = new THREE.Mesh(new RoundedBoxGeometry(0.2, 0.02, 0.1, 3, 0.006), shell); foot.position.y = 0.01; g.add(foot);
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.01, cy - 0.02, 16), chrome); post.position.set(0, 0.02 + (cy - 0.04) / 2, -0.03); g.add(post);
  const bezel = new THREE.Mesh(new THREE.CylinderGeometry(R + 0.012, R + 0.012, 0.03, 96), shell); bezel.rotation.x = Math.PI / 2; bezel.position.set(0, cy, -0.012); g.add(bezel);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(R + 0.006, 0.004, 16, 120), chrome); ring.position.set(0, cy, 0.004); g.add(ring);
  const face = new THREE.Mesh(new THREE.CircleGeometry(R, 96), new THREE.MeshPhysicalMaterial({ map: canvasTex(1024, 1024, (x, w) => {
    const c = w / 2, rr = c * 0.86; x.fillStyle = '#ece8df'; x.fillRect(0, 0, w, w);
    const arc = (a0, a1, col, lw, r2 = rr) => { x.strokeStyle = col; x.lineWidth = lw; x.beginPath(); x.arc(c, c, r2, a0 - Math.PI / 2, a1 - Math.PI / 2); x.stroke(); };
    arc(G_A0, G_A1, '#2a2b2f', 10); arc(G_A1, G_A2, '#c2312b', 46, rr - 18);
    for (let i = 0; i <= 8; i++) { const a = G_A0 + (G_A1 - G_A0) * (i / 8) - Math.PI / 2, big = i % 2 === 0; x.strokeStyle = '#2a2b2f'; x.lineWidth = big ? 12 : 6; x.beginPath(); x.moveTo(c + Math.cos(a) * (rr - (big ? 70 : 45)), c + Math.sin(a) * (rr - (big ? 70 : 45))); x.lineTo(c + Math.cos(a) * rr, c + Math.sin(a) * rr); x.stroke(); }
    const at = (a, r2) => [c + Math.sin(a) * r2, c - Math.cos(a) * r2];
    txt(x, 'FULL', ...at(-1.3, rr - 160), { font: '900 60px Archivo', color: '#2a2b2f' });           // where the needle never rests
    txt(x, 'EMPTY', ...at(0.1, rr - 150), { font: '900 56px Archivo', color: '#2a2b2f' });
    txt(x, 'ANGRY', ...at(1.3, rr - 165), { font: '900 66px Archivo', color: '#c2312b' });
    txt(x, 'HUNGER', c, c + 250, { font: '700 54px "Geist Mono"', color: '#55575d', track: 14 }); }), roughness: 0.4, clearcoat: 0.5 }));
  face.position.set(0, cy, 0.0035); g.add(face);
  const needle = new THREE.Group(); needle.position.set(0, cy, 0.009); g.add(needle);
  const nm = phys({ color: 0x1b1c20, roughness: 0.35, clearcoat: 0.6 });
  const blade = new THREE.Mesh(new THREE.BoxGeometry(0.004, R * 0.86, 0.002), nm); blade.position.y = R * 0.86 / 2 - 0.012; needle.add(blade);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.008, 32), chrome); hub.rotation.x = Math.PI / 2; needle.add(hub);
  const glass = new THREE.Mesh(new THREE.CircleGeometry(R + 0.004, 96), new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.05, transparent: true, opacity: 0.1, depthWrite: false })); glass.position.set(0, cy, 0.014); g.add(glass);
  finish(g); glass.castShadow = false;
  return { g, needle, cy, R };
}
function gaugeAt(t) {   // the needle: comfortably full, then pushed to empty, then on into ANGRY, shaking
  let a = G_A0 + 0.3 + 0.04 * Math.sin(t * 1.3);
  a = lerp(a, G_A1 - 0.03, s5(T.push - 0.05, T.far + 0.4, t));
  a = lerp(a, G_A2 - 0.22, s5(T.hunger2 + 0.2, T.anger + 0.15, t));
  a += 0.05 * Math.sin(t * 37) * ss(T.anger, T.anger + 0.2, t);
  return a;
}

// ------------------------------------------------------------------ the whiteboard: three weeks of ratings, five a day; then the scatter; HANGRY: REAL
const CELLS = [...Array(105).keys()].map((i) => { const day = Math.floor(i / 5), slot = i % 5, hu = clamp01(0.5 + 0.42 * Math.sin(i * 1.7 + day) * Math.cos(i * 0.37) + 0.15 * (hash(i * 3.1) - 0.5)); return { day, slot, hu, an: clamp01(0.12 + 0.62 * hu + 0.28 * (hash(i * 7.7) - 0.5)) }; });
function studyState(t) { return { fill: Math.round(105 * s5(T.rated - 0.1, T.three2 + 0.4, t)), plot: +s5(T.hungrier - 0.1, T.irritable + 0.3, t).toFixed(2), line: +s5(T.irritable, T.felt + 0.6, t).toFixed(2), real: +s5(T.hangry - 0.05, T.real + 0.2, t).toFixed(2) }; }

// ------------------------------------------------------------------ the body: seated at the desk, hands on the keyboard; head turns; fingers that type
const SPINE_CER = ['Atlas', 'Axis', 'Third cervical vertebra', 'Fourth cervical vertebra', 'Fifth cervical vertebra', 'Sixth cervical vertebra', 'Seventh cervical vertebra'];
let HANDS = null;
function keySDF(p) { return p.y - KEYTOP; }
function solveHands() {
  const R = W.rig, out = {};
  for (const Side of ['Right', 'Left']) {
    const A = R.arms[Side], H = W.hand[Side], s = A.s, e = new THREE.Vector3(), wq = new THREE.Vector3();
    const at = new THREE.Vector3(s * 0.105, KEYTOP - 0.006, KB.z + 0.03), elbowT = new THREE.Vector3(s * 0.27, DESK.top + 0.03, -0.3);
    const extra = (A2) => { A2.elbow.getWorldPosition(e); H.wr.g.getWorldPosition(wq); return 1.5 * e.distanceTo(elbowT) + 4 * Math.max(0, DESK.top + 0.026 - e.y) + 1.5 * Math.abs(wq.y - (DESK.top + 0.04)); };
    const aims = [{ v: H.n, to: new THREE.Vector3(0, -1, 0), w: 2.5 }, { v: H.fdir, to: new THREE.Vector3(-s * 0.3, -0.06, 1).normalize(), w: 1.5 }];
    const low = () => { let mn = 9; const v = new THREE.Vector3(); H.eg.updateMatrixWorld(true); H.eg.traverse((m) => { if (!m.isMesh || /phalanx/i.test(m.userData.name)) return; const P = m.geometry.attributes.position; for (let i = 0; i < P.count; i += 2) mn = Math.min(mn, v.fromBufferAttribute(P, i).applyMatrix4(m.matrixWorld).y); }); return mn; };
    let sol = null;   // the forearms turned palm down (the radius crosses the ulna): pronation P0
    for (let it = 0; it < 4; it++) {
      const P0 = 2.1; sol = solveHand(R, Side, H, at, sol || { dir: [0.15, -0.75, 0.6], twist: 0.6, elbow: 1.3, pro: P0 }, aims, extra, it ? [] : [{ dir: [0.15, -0.75, 0.6], twist: 0.6, elbow: 1.3, pro: P0 }, { dir: [0.25, -0.6, 0.75], twist: 0.2, elbow: 1.1, pro: P0 }, { dir: [0.1, -0.85, 0.5], twist: 1.0, elbow: 1.5, pro: P0 }]);
      poseArm(A, sol); setWrist(H.wr, sol); A.girdle.updateMatrixWorld(true); H.curl(0);
      const d = KEYTOP + 0.012 - low(); if (Math.abs(d) < 0.0008) break; at.y += d;   // the heel of the hand hovers just over the keys
    }
    const F = H.fit(keySDF, { need: 0.003, kmin: -0.25, kmax: 0.9 });
    out[Side] = { sol, F };
  }
  return out;
}
function headAt(t) {   // where the head looks: yaw (+ to its left), pitch (+ down)
  const look = [
    [0, 0.0, 0.05], [3.6, 0.0, 0.05], [4.1, -0.62, -0.15], [5.4, -0.62, -0.15], [5.9, -0.45, 0.35], [8.9, -0.45, 0.35], [9.6, 0.5, 0.25], [15.8, 0.5, 0.25], [16.6, 0.0, 0.05],
    [41.6, 0.0, 0.05], [42.0, 0.42, 0.42], [43.4, 0.42, 0.42], [43.9, 0.0, 0.05], [53.0, 0.0, 0.05], [53.8, 0.32, 0.16], [99, 0.32, 0.16]];
  for (let i = 0; i < look.length - 1; i++) if (t < look[i + 1][0]) { const k = s5(look[i][0], look[i + 1][0], t); return [lerp(look[i][1], look[i + 1][1], k), lerp(look[i][2], look[i + 1][2], k)]; }
  return [0.32, 0.16];
}
const TYPE = [[0.62, 2.8], [51.0, 52.55]];
const _qa = new THREE.Quaternion();
function poseBody(t) {
  const R = W.rig, br = 0.5 - 0.5 * Math.cos((t / 4.4) * Math.PI * 2);
  const [yaw, pitch] = headAt(t);
  bendSpine(R.seg, { lum: 0.1, tho: 0.22, cer: pitch + 0.015 * br });
  for (const n of SPINE_CER) { const s = R.seg[n]; if (s) s.g.rotation.y += yaw / SPINE_CER.length; }
  if (HANDS) { const ty = Math.max(...TYPE.map(([a, b]) => pulse(t, a - 0.15, b + 0.15, 0.15)));
    for (const Side of ['Right', 'Left']) { const A = R.arms[Side], h = HANDS[Side]; poseArm(A, h.sol); setWrist(W.hand[Side].wr, h.sol);
      // typing: the fingers lift and strike in a quick, uneven rhythm
      const per = h.F.per.map((k, i) => { const ph = ((t * (5.3 + 0.7 * i) + (Side === 'Right' ? 0.37 : 0) + i * 0.23) % 1 + 1) % 1; return k - ty * 0.35 * Math.sin(Math.PI * Math.min(1, ph / 0.6)) ** 2; });
      W.hand[Side].curl(0, per, h.F.tk); } }
  W.body.quaternion.identity(); W.body.position.copy(W.sitP); W.body.updateMatrixWorld(true);
  for (const Side of ['Right', 'Left']) { const G = R.legs[Side]; _qa.setFromAxisAngle(X, -Math.PI / 2); G.hip.quaternion.copy(_qa);
    legIK(R, Side, new THREE.Vector3(W.sitP.x + G.s * 0.13, G.A.y - G.ground + 0.002, W.sitP.z + 0.44), new THREE.Quaternion(), Z); }
  // the jaw: it snaps shut on "snap" (open a moment before), then again in anger
  if (W.jawG) W.jawG.rotation.x = 0.22 * (pulse(t, T.you, T.snap + 0.03, 0.12) + 0.6 * pulse(t, T.anger - 0.35, T.anger + 0.03, 0.12));
  W.body.updateMatrixWorld(true);
}

// ------------------------------------------------------------------ the clock: three in the afternoon; meals at regular times; then it becomes the logo
function clockAt(t) {   // seconds of the day: 2:57 and a bit; the hands sweep to three o'clock on "three", then real time
  const s0 = (14 * 60 + 57) * 60 + 20 + t, s1 = 15 * 3600 + (t - T.three - 0.05);
  return lerp(s0, s1, s5(T.three - 0.55, T.three + 0.05, t));
}

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
  { const at = R.seg.Atlas; W.body.updateMatrixWorld(true);
    W.jawG = new THREE.Group(); W.jawG.position.copy(new THREE.Vector3(0, 1.668, -0.003)).sub(at.pivot); at.g.add(W.jawG); at.g.updateMatrixWorld(true);
    for (const m of meshes) if (/^mandible$|lower .*tooth/i.test(m.userData.name)) W.jawG.attach(m); }
  W.hand = {}; for (const Side of ['Right', 'Left']) { const Wr = makeWrist(R, Side, { pronate: true }); W.hand[Side] = rigHand(R, Side, Wr); W.hand[Side].wr = Wr; }
  const hipB = new THREE.Box3(); for (const m of meshes) if (/hip bone/i.test(m.userData.name)) for (const v of worldVerts(m, 3)) hipB.expandByPoint(v);
  W.sitP = new THREE.Vector3(0, SEAT + 0.002 + (R.P0.y - hipB.min.y), SEAT_Z + 0.02);
  // steam from the temples: two little puffs in the head's own frame
  { const at = R.seg.Atlas, hp = (x) => new THREE.Vector3(x, 1.72, -0.02).sub(at.pivot);
    const puff = { r: 0.016, rise: 0.22, size: 0.065, life: 1.0, opacity: 0.55 }; W.steamL = makeSteam(at.g, 16, puff); W.steamR = makeSteam(at.g, 16, puff);
    W.steamL.ps.forEach((m) => { m.userData.base = hp(0.07); }); W.steamR.ps.forEach((m) => { m.userData.base = hp(-0.07); });
    W.steamG = [new THREE.Group(), new THREE.Group()]; W.steamG[0].position.copy(hp(0.072)); W.steamG[1].position.copy(hp(-0.072)); at.g.add(...W.steamG);
    W.steamL.ps.forEach((m) => W.steamG[0].add(m)); W.steamR.ps.forEach((m) => W.steamG[1].add(m)); }
  // ---- the set
  W.desk = makeDesk(scene); W.kb = makeKeyboard(scene); W.mon = makeMonitor(scene); W.lunch = makeLunch(scene); W.snack = makeSnack(scene); W.gauge = makeGauge(scene);
  { const C = W.clock = makeClock(); C.g.position.set(CLOCK.x, CLOCK.y - C.R * CLOCK.s, CLOCK.z); C.g.rotation.y = CLOCK.ry; C.g.scale.setScalar(CLOCK.s); scene.add(C.g);
    C.markMat.opacity = 0; C.g.traverse((o) => o.layers.enable(1));
    const poleH = CLOCK.y - C.R * CLOCK.s + 0.012;   // up into the clock's foot
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.022, poleH, 24), phys({ color: 0x2a2c31, metalness: 0.7, roughness: 0.35 })); pole.position.set(CLOCK.x, poleH / 2, CLOCK.z); scene.add(pole);
    const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.03, 48), phys({ color: 0x1c1d21, metalness: 0.6, roughness: 0.4 })); foot.position.set(CLOCK.x, 0.015, CLOCK.z); scene.add(foot); finish(pole); finish(foot);
    W.logo = makeLogoRing(0.044); W.logo.g.position.z = C.D / 2 + 0.0012; C.body.add(W.logo.g);
    // meals at regular times: three small plates on the rim at 8, 1 and 7
    W.meals = [8, 13, 19].map((hh) => { const a = ((hh % 12) / 12) * Math.PI * 2, m = new THREE.Mesh(new THREE.CircleGeometry(0.0055, 24), new THREE.MeshBasicMaterial({ color: new THREE.Color(0x4f86c6), transparent: true, opacity: 0 })); m.position.set(Math.sin(a) * 0.033, Math.cos(a) * 0.033, C.D / 2 + 0.0004); C.body.add(m); return m; }); }
  // the hands on the keys, solved once
  poseBody(0); HANDS = solveHands(); poseBody(0);
  // ---- light
  W.key = spot(scene, { color: 0xffe9d2, pos: new THREE.Vector3(-1.2, 2.7, 1.5), target: new THREE.Vector3(0, 0.85, -0.1), angle: 0.5, penumbra: 0.8, shadow: true, size: cfg.shadow ?? 1024 }); W.key.shadow.camera.far = 7;
  W.rim = spot(scene, { color: 0xa9c4ff, pos: new THREE.Vector3(1.2, 2.2, -1.9), target: new THREE.Vector3(0, 1.0, -0.4), angle: 0.5, penumbra: 0.9 });
  W.fill = spot(scene, { color: 0xc8d6ff, pos: new THREE.Vector3(1.6, 1.3, 1.8), target: new THREE.Vector3(0, 0.9, -0.2), angle: 0.6, penumbra: 1 });
  W.clockLight = spot(scene, { color: 0xfff4e6, pos: new THREE.Vector3(CLOCK.x + 0.7, 2.4, CLOCK.z + 1.0), target: new THREE.Vector3(CLOCK.x, CLOCK.y - 0.16, CLOCK.z), angle: 0.22, penumbra: 0.7 });
  W.gaugeLight = spot(scene, { color: 0xfff4e6, pos: new THREE.Vector3(GAUGE.x + 0.2, 1.9, GAUGE.z + 0.9), target: new THREE.Vector3(GAUGE.x, GAUGE.y + 0.17, GAUGE.z), angle: 0.18, penumbra: 0.7 });
  W.lunchLight = spot(scene, { color: 0xfff1d8, pos: new THREE.Vector3(PLATE.x - 0.2, 2.0, PLATE.z + 0.8), target: PLATE.clone(), angle: 0.16, penumbra: 0.7 });
  W.auditSolids = [['desk', W.desk], ['keyboard', W.kb], ['monitor', W.mon.g], ['lunch', W.lunch.g], ['snack', W.snack.g, { floor: false }], ['gauge', W.gauge.g], ['clock', W.clock.g]];
  W.timing = { snap: T.snap, steam: STEAM_T, steam2: STEAM2_T, type: TYPE, keys: [...MAIL.angry].map((_, i) => +(0.62 + (2.18 * (i + 1)) / MAIL.angry.length).toFixed(3)), three: T.three, sandwich: SANDWICH_T, cup: CUP_T, gaugeAngry: [T.hunger2 + 0.2, T.anger + 0.15],
    fill: [T.rated - 0.1, T.three2 + 0.4], plot: [T.hungrier - 0.1, T.irritable + 0.3], real: T.hangry, crash: 31.85, harsh: T.harsher, feel: 35.6, fair: 37.1, meals: [40.3, 41.2], snack: SNACK_T,
    dialog: T.ask - 0.1, pick: T.hungry + 0.2, del: [50.0, 50.85], retype: [51.0, 52.55], logo: T.logo };
  return { stamp: W.stampSpot, sitP: W.sitP.toArray().map((v) => +v.toFixed(3)), hands: HANDS && ['Right', 'Left'].map((s) => +HANDS[s].sol.err.toFixed(4)), fingers: HANDS && ['Right', 'Left'].map((s) => HANDS[s].F.per.map((v) => +v.toFixed(2))) };
}

// ------------------------------------------------------------------ the camera: one path, no cuts (keys set in fitting; placeholders here)
let CAM = null;
function buildCam() {
  const toward = (p, l, k) => p.map((v, i) => l[i] + (v - l[i]) * k);
  const orbit = (p, l, a) => { const dx = p[0] - l[0], dz = p[2] - l[2], c = Math.cos(a), s = Math.sin(a); return [l[0] + dx * c + dz * s, p[1], l[2] - dx * s + dz * c]; };
  const V = W.views;
  return camTrack([
    { t: -3.0, p: V3(...toward(V.mail.p, V.mail.l, 1.06)), l: V3(...V.mail.l), fov: V.mail.fov },
    { t: 0.0, p: V3(...toward(V.mail.p, V.mail.l, 1.04)), l: V3(...V.mail.l), fov: V.mail.fov, tens: 0.4 },
    { t: 3.3, p: V3(...V.mail.p), l: V3(...V.mail.l), fov: V.mail.fov, stop: true },
    { t: 4.15, p: V3(...V.clock.p), l: V3(...V.clock.l), fov: V.clock.fov, stop: true },
    { t: 5.45, p: V3(...toward(V.clock.p, V.clock.l, 0.97)), l: V3(...V.clock.l), fov: V.clock.fov, stop: true },
    { t: 6.1, p: V3(...V.lunch.p), l: V3(...V.lunch.l), fov: V.lunch.fov, stop: true },
    { t: 9.3, p: V3(...toward(V.lunch.p, V.lunch.l, 0.95)), l: V3(...V.lunch.l), fov: V.lunch.fov, stop: true },
    { t: 10.0, p: V3(...V.gauge.p), l: V3(...V.gauge.l), fov: V.gauge.fov, stop: true },
    { t: 15.75, p: V3(...toward(V.gauge.p, V.gauge.l, 0.95)), l: V3(...V.gauge.l), fov: V.gauge.fov, stop: true },
    { t: 16.6, p: V3(...V.study.p), l: V3(...V.study.l), fov: V.study.fov, stop: true },
    { t: 28.0, p: V3(...toward(V.study.p, V.study.l, 0.96)), l: V3(...V.study.l), fov: V.study.fov, stop: true },
    { t: 31.2, p: V3(...V.mail.p), l: V3(...V.mail.l), fov: V.mail.fov, stop: true },
    { t: 38.6, p: V3(...toward(V.mail.p, V.mail.l, 0.95)), l: V3(...V.mail.l), fov: V.mail.fov, stop: true },
    { t: 39.55, p: V3(...V.clock.p), l: V3(...V.clock.l), fov: V.clock.fov, stop: true },
    { t: 41.25, p: V3(...toward(V.clock.p, V.clock.l, 0.97)), l: V3(...V.clock.l), fov: V.clock.fov, stop: true },
    { t: 41.9, p: V3(...V.snack.p), l: V3(...V.snack.l), fov: V.snack.fov, stop: true },
    { t: 43.4, p: V3(...toward(V.snack.p, V.snack.l, 0.97)), l: V3(...V.snack.l), fov: V.snack.fov, stop: true },
    { t: 44.1, p: V3(...V.mail.p), l: V3(...V.mail.l), fov: V.mail.fov, stop: true },
    { t: 52.9, p: V3(...toward(V.mail.p, V.mail.l, 0.94)), l: V3(...V.mail.l), fov: V.mail.fov, stop: true },
    { t: 53.75, p: V3(...V.warn.p), l: V3(...V.warn.l), fov: V.warn.fov, stop: true },
    { t: 64.3, p: V3(...orbit(V.warn.p, V.warn.l, 0.25)), l: V3(...V.warn.l), fov: V.warn.fov },
    { t: 74.9, p: V3(...orbit(V.warn.p, V.warn.l, 0.5)), l: V3(...V.warn.l), fov: V.warn.fov, stop: true },
    { t: 76.1, p: V3(...V.logoIn.p), l: V3(...V.logoIn.l), fov: 30, stop: true },
    { t: T.logo, p: V3(...V.logo.p), l: V3(...V.logo.l), fov: 30, stop: true },   // straight at the clock's face: the logo
  ]);
}
function camPose(S, t) {
  const v = S.cfg.view; if (v && typeof v === 'object') return v;
  if (!CAM) CAM = buildCam();
  if (t <= T.logo) return CAM(t);
  const Q = CAM(T.logo), k = ss(T.logo, T.end, t), d = Q.p.map((x, i) => x - Q.l[i]); return { p: Q.p.map((x, i) => x - d[i] * 0.04 * k), l: Q.l, fov: 30 };
}
function focusAt(S, t, P) { return Math.hypot(P.p[0] - P.l[0], P.p[1] - P.l[1], P.p[2] - P.l[2]); }

// ------------------------------------------------------------------ one moment of the film
const _v = new THREE.Vector3();
function update(S, t) {
  const scene = S.scene, endDark = ss(T.final + 0.2, T.factory + 0.25, t);
  poseBody(t);
  // ---- steam from the temples, in anger
  { const a = pulse(t, STEAM_T[0], STEAM_T[1], 0.2) + pulse(t, STEAM2_T[0], STEAM2_T[1], 0.2);
    setSteam(W.steamL, t, a, new THREE.Vector3(0.6, 0.8, 0)); setSteam(W.steamR, t, a, new THREE.Vector3(-0.6, 0.8, 0)); }
  // ---- the screen
  const nap = 1 - 0.82 * pulse(t, 5.75, 9.7, 0.3);   // the screen dims while the camera looks at lunch past it, so the words stay on dark
  drawScreen(W.mon, screenState(t)); W.mon.screen.material.color.setScalar(nap); W.mon.glow.intensity = 0.35 * nap * (1 - endDark);
  // ---- lunch: the sandwich drops onto the plate, then gets eaten by bits
  { const L = W.lunch, sw = L.sw; sw.visible = t > SANDWICH_T - 0.45; sw.position.y = drop(t, SANDWICH_T, 0.35, 0.03);
    const cu = clamp01((t - CUP_T[0]) / (CUP_T[1] - CUP_T[0])); L.cup.visible = cu < 1; L.cup.position.y = L.cupY + 0.7 * cu * cu * cu; L.cup.rotation.z = 0.25 * cu * cu;
    sw.children.forEach((m, i) => { m.visible = !(t > 56 && i >= 5); }); }   // one half gone by the warnings
  // ---- the snack drops in
  { const Sn = W.snack; Sn.g.visible = t > SNACK_T[0] - 0.4; Sn.g.position.y = SNACK.y + drop(t, SNACK_T[0], 0.4, 0.04); }
  // ---- the gauge
  W.gauge.needle.rotation.z = -gaugeAt(t);
  // ---- the board
  // ---- the clock: the time; meals at regular times; then the logo
  { const C = W.clock, s = clockAt(t), hrs = (s / 3600) % 12;
    C.hands.h.rotation.z = -(hrs / 12) * Math.PI * 2; C.hands.m.rotation.z = -(((s / 60) % 60) / 60) * Math.PI * 2; C.hands.s.rotation.z = -((s % 60) / 60) * Math.PI * 2;
    const mk = s5(40.3, 41.2, t) * (1 - s5(46.0, 46.6, t)); W.meals.forEach((m, i) => { m.material.opacity = mk * s5(40.3 + i * 0.25, 40.6 + i * 0.25, t); });
    const lk = s5(T.final + 0.5, T.logo - 0.25, t), fade = 1 - lk;
    for (const m of [C.hourMat, C.minMat, C.secMat]) m.opacity = fade; C.faceMat.color.setScalar(lerp(1, 0.06, lk)); C.minorMat.opacity = fade; C.topMat.opacity = fade;
    W.logo.set({ weight: lk, white: lk, hours: 0, hand: ss(T.logo - 0.4, T.logo - 0.15, t), handScale: outBack(clamp01((t - (T.logo - 0.4)) / 0.35), 1.8) }); }
  // ---- light
  const fig = 1 - endDark;
  W.key.intensity = 9 * fig; W.rim.intensity = 4 * fig; W.fill.intensity = 1.0 * fig;
  W.clockLight.intensity = 2.2 * fig * Math.max(pulse(t, 3.3, 6.1, 0.4), pulse(t, 38.7, 42.0, 0.4), ss(75.4, 76.2, t));
  W.gaugeLight.intensity = 6 * fig * pulse(t, 9.4, 16.2, 0.4); W.lunchLight.intensity = 1.6 * fig * pulse(t, 5.4, 9.8, 0.4);
  S.tableMat.color.setScalar(0.32 * (1 - endDark * 0.9)); scene.environmentIntensity = 0.12 * (1 - endDark); S.reflAmt = 0.5 * (1 - endDark);
}

// ------------------------------------------------------------------ the words on screen
const CAPS = [
  { t0: T.you, t1: 3.25, top: 292, size: 84, html: 'You <em>snap</em> at your<br>colleague and decide<br>they’re an idiot,' },
  { t0: T.when, t1: 7.6, top: 292, size: 84, html: 'when really it’s<br><em>three in the afternoon</em><br>and your lunch<br>was a coffee.' },
  { t0: T.lets, t1: 9.6, top: 300, size: 92, html: 'Let’s get you <em>fed</em>.' },
  { t0: T.your, t1: 15.9, top: 292, size: 78, html: 'Your body was built<br>to handle hunger, but<br>push it too far and hunger<br>can come out as <em>anger</em>.' },
  { t0: T.in, t1: 22.05, top: 292, size: 78, html: 'In one study, 64 adults<br>rated their hunger and<br>mood 5 times a day<br>for 3 weeks,' },
  { t0: T.and, t1: 26.95, top: 292, size: 82, html: 'and the hungrier they<br>were, the <em>angrier</em> and<br>more irritable they felt.' },
  { t0: T.so, t1: 28.9, top: 300, size: 92, html: 'So <em>hangry</em> is real.' },
  { t0: T.in2, t1: 34.65, top: 292, size: 80, html: 'In a lab test, hungry<br>students blamed for a<br><em>computer crash</em> saw the<br>researcher as harsher,' },
  { t0: T.unless, t1: 38.7, top: 292, size: 86, html: 'unless they first<br>stopped to think about<br>their <em>feelings</em>.' },
  { t0: T.so2, t1: 43.85, top: 292, size: 82, html: 'So eat proper meals<br>at <em>regular times</em>, keep<br>a real snack for<br>late lunches,' },
  { t0: T.and2, t1: 49.9, top: 292, size: 80, html: 'and before you send<br>that email, ask yourself:<br>am I <em>angry</em>, or<br>just <em>hungry</em>?' },
  { t0: T.hunger3, t1: 52.9, top: 300, size: 88, html: 'Hunger <em>explains</em> it.<br>It doesn’t <em>excuse</em> it.' },
  { t0: T.if, t1: 59.0, top: 292, size: 78, html: 'If you take insulin or<br>other diabetes medicines<br>and feel shaky, sweaty<br>or confused,' },
  { t0: T.that, t1: 66.0, top: 292, size: 76, html: 'that may be <em>low blood sugar</em>,<br>so treat it straight away,<br>as your diabetes team<br>showed you.' },
  { t0: T.and3, t1: 70.95, top: 292, size: 80, html: 'And if you don’t have<br>diabetes but get shaky,<br>sweaty or confused<br>when hungry,' },
  { t0: T.or, t1: 75.3, top: 292, size: 86, html: 'or you’re struggling<br>to cope with stress,<br>see a <em>doctor</em>.' },
  { t0: T.final, t1: 99, top: 360, size: 92, html: 'Let’s get you back to<br><em>factory settings.</em>' },
];
function overlayInit(S) {}
function overlay(S, t) {
  const C = W.clock, lc = C.body.localToWorld(new THREE.Vector3(0, 0, C.D / 2 + 0.0012)), le = C.body.localToWorld(new THREE.Vector3(0, 0.044, C.D / 2 + 0.0012));
  logoEnd(S, t, { t0: T.logo, center: lc, edge: le });
}

makeFilm({
  T, caps: CAPS, subs: [], build, update, pose: camPose, overlay, overlayInit, focus: focusAt,
  stage: { bg: 0x07080a, reflSize: 8, env: 0.12, far: 30 },
  aperture: [[0, 0.003], [4.15, 0.003], [6.1, 0.004], [10.0, 0.003], [16.6, 0.003], [31.2, 0.003], [39.55, 0.003], [41.9, 0.004], [44.1, 0.003], [53.75, 0.002], [76.1, 0.003]],
  bloom: [[0, 0.45], [75, 0.55]],
  fast: [[3.3, 4.2, 2], [5.45, 6.15, 2], [9.3, 10.05, 2], [15.75, 16.65, 2], [38.6, 39.6, 2], [41.25, 41.95, 2], [43.4, 44.15, 2], [52.9, 53.8, 2], [74.9, 76.15, 2]],
});

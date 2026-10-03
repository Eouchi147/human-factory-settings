// Human Factory Settings · Film 16 "How much water do you need?" · one continuous shot, 9:16.
// A skeleton stands with its feet apart and drinks a glass of water. The water falls straight through it, into a bucket
// that was waiting between its feet, already part full (the gag). Beside it, a tray of eight glasses, one missing, and a
// coffee cup with a note: DOESN'T COUNT. A card drawer, "8 glasses a day: the study", slides open, empty. Two jugs fill to
// Europe's figures, 2 litres and 2.5; drinks and food light up; about a fifth of the water comes from food. The skeleton
// bites an apple, and the bite falls into the bucket too. The note is corrected. Five tubes: water, coffee, tea and cola
// keep the same, milk more. A meal; the NHS colour check, a clear pale yellow. A cylinder rises with heat, long exercise,
// illness, pregnancy, and overflows. A marathon board: 13 of 100 bibs. The warnings, plain, over one glass, which seen
// from above becomes the logo. The factory stamp is on the bucket, where a maker marks a pail.
import { THREE, ss, s5, lerp, clamp01, hash, camTrack, phys, shadows, spot, RoundedBoxGeometry, glowSprite,
  loadAnatomy, V3, place, logoEnd, makeFilm, outBack, stamp, stampCanvas, stampSpot, noiseTex } from '../kit.js';
import { buildRig, skeletonKind, bendSpine, poseArm, legIK, worldVerts, avgV } from '../rig.js';
import { makeCup, makeLogoRing } from '../props.js';

// ------------------------------------------------------------------ timing, from the voice guide (word starts)
const T = {
  end: 76.15,
  water: 0.35, eight: 1.50, glasses: 2.04, day: 2.78, coffee: 3.27, doesnt: 3.58, count: 4.14,          // "Water. Eight glasses a day, and coffee doesn't count."
  review: 5.67, looking: 6.39, study: 6.83, rule: 7.76, found: 9.26, none: 9.79,
  europe: 10.75, experts: 12.23, two: 12.90, litres: 13.09, women: 14.13, twoHalf: 14.58, half: 15.47, men: 15.87,
  counts: 17.17, every: 17.55, drink: 17.83, inFood: 18.52, food: 18.99,
  us: 21.13, supplied: 22.16, twenty: 23.11, percent: 23.78, eat: 25.17, yourWater: 25.93,
  coffee2: 27.04, counts2: 27.79, trials: 29.25, hydrated: 29.71, asWater: 31.18, tea: 33.08, cola: 33.56, milk: 34.40, kept: 35.00, moreIn: 35.35,
  most: 36.54, thirsty: 39.35, meals: 40.44, nhs: 42.06, check: 42.90, pee: 43.07, pale: 44.06, yellow: 44.82,
  more: 47.15, heat: 47.55, long: 48.34, exercise: 48.62, ill: 49.84, pregnant: 50.10, breastfeeding: 50.99,
  but: 52.70, overdoing: 53.17, dangerous: 54.29, marathon: 55.98, thirteen: 56.52, runners: 57.96, finish: 59.27,
  sodium: 60.55, linked: 61.33, gaining: 62.34, weight: 62.89, race: 64.07,
  drinking: 65.45, kill: 67.27, ill2: 68.68, doctor: 69.43, drink2: 70.55,
  back: 72.00, factory: 72.86, settings: 73.16, logo: 73.85,
};

// ------------------------------------------------------------------ the set (metres, floor at y = 0); the skeleton stands at the origin, facing +z
const W = {}; window.HFS_W = W;
const X = new THREE.Vector3(1, 0, 0), Y = new THREE.Vector3(0, 1, 0), Z = new THREE.Vector3(0, 0, 1);
const P1 = { x: 0.64, z: 0.16, r: 0.25, top: 0.8 };                         // the side table: the tray of eight, the coffee and its note
const P2 = { x: -0.8, z: 0.0, top: 0.92, w: 0.34, h: 0.26, d: 0.3 };        // the card drawers on a stand
const P3 = { x: -1.62, z: 0.0, w: 0.92, d: 0.44, top: 0.86 };               // the counter: two jugs, the drinks, the food
const P4 = { x: 1.48, z: 0.0, w: 0.58, d: 0.32, top: 0.86 };                // the tubes
const P5 = { x: 2.34, z: 0.1, w: 0.56, d: 0.4, top: 0.74 };                 // a meal; the colour card
const P6 = { x: 3.16, z: 0.0, top: 0.9 };                                   // the cylinder that rises
const P7 = { x: 4.06, z: -0.05, y: 1.3, w: 0.9, h: 0.88 };                  // the marathon board
const P8 = { x: 4.9, z: 0.1, r: 0.2, top: 0.78 };                           // the last glass
const GLASS = { r: 0.034, h: 0.11 }, GRIP = 0.05;
const LOGO_R = GLASS.r;
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
const glassM = () => new THREE.MeshPhysicalMaterial({ color: 0xeef4ff, roughness: 0.03, metalness: 0, transparent: true, opacity: 0.06, clearcoat: 1, clearcoatRoughness: 0.02, side: THREE.DoubleSide, depthWrite: false, envMapIntensity: 0.9 });
function label(w, h, draw, opts = {}) {   // a flat card with canvas print
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: canvasTex(Math.round(w * 4000), Math.round(h * 4000), draw), transparent: true, depthWrite: false, ...opts }));
  return m;
}
function printed(w, h, draw, opts = {}) {   // a lit card (takes the light)
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), phys({ map: canvasTex(Math.round(w * 4000), Math.round(h * 4000), draw), roughness: 0.6, transparent: true, ...opts }));
}

// ------------------------------------------------------------------ water that keeps level in a glass at any angle: the volume is cut by a world plane;
// its back faces, seen through the cut, are shaded as a flat surface (they read as the water's top)
function waterMat(color = 0x5d93d6, opacity = 0.3) {
  const m = new THREE.MeshStandardMaterial({ color, transparent: true, opacity, roughness: 0.03, metalness: 0, side: THREE.DoubleSide, depthWrite: false, envMapIntensity: 0.9 });
  m.clippingPlanes = [new THREE.Plane(new THREE.Vector3(0, -1, 0), 99)];
  m.onBeforeCompile = (sh) => { sh.fragmentShader = sh.fragmentShader.replace('#include <normal_fragment_begin>', '#include <normal_fragment_begin>\nif (!gl_FrontFacing) normal = normalize((viewMatrix * vec4(0.0, 1.0, 0.0, 0.0)).xyz);'); };
  m.customProgramCacheKey = () => 'levelwater';
  return m;
}
function makeGlass(fill = 0.82, { color = 0x5d93d6, opacity = 0.3 } = {}) {
  const g = new THREE.Group(), { r, h } = GLASS;
  const wall = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 0.88, h - 0.008, 48, 1, true), glassM()); wall.position.y = 0.008 + (h - 0.008) / 2; wall.renderOrder = 3; g.add(wall);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.88, r * 0.86, 0.008, 48), glassM()); base.position.y = 0.004; base.renderOrder = 3; g.add(base);
  const lip = new THREE.Mesh(new THREE.TorusGeometry(r - 0.0008, 0.0011, 8, 64), glassM()); lip.rotation.x = Math.PI / 2; lip.position.y = h; lip.renderOrder = 3; g.add(lip);
  const wm = waterMat(color, opacity), wh = h - 0.012;
  const water = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.955, r * 0.84, wh, 40, 1, false), wm); water.position.y = 0.009 + wh / 2; water.renderOrder = 2; g.add(water);
  // samples of the water's room, for the level at any tilt
  const smp = []; for (let k = 0; k < 900; k++) { const a = hash(k * 1.7) * Math.PI * 2, rr = Math.sqrt(hash(k * 3.1 + 2)), y = hash(k * 5.3 + 7);
    const rad = lerp(r * 0.84, r * 0.955, y); smp.push(new THREE.Vector3(Math.cos(a) * rr * rad, 0.009 + y * wh, Math.sin(a) * rr * rad)); }
  g.traverse((o) => o.layers.enable(1));
  const G = { g, water, wm, fill, smp, ys: new Float32Array(smp.length) };
  return G;
}
function levelGlass(G) {   // after the glass has its world matrix: cut its water at the height that holds G.fill of it
  const e = G.g.matrixWorld.elements;
  if (G.fill <= 0.002) { G.water.visible = false; return; } G.water.visible = true;
  for (let i = 0; i < G.smp.length; i++) { const p = G.smp[i]; G.ys[i] = e[1] * p.x + e[5] * p.y + e[9] * p.z + e[13]; }
  const s = Array.from(G.ys).sort((a, b) => a - b), H = s[Math.min(s.length - 1, Math.floor(G.fill * s.length))];
  G.wm.clippingPlanes[0].constant = G.fill >= 0.999 ? 99 : H;
}

// ------------------------------------------------------------------ the bucket, already part full; the stream; the splash
function makeBucket(scene) {
  const g = new THREE.Group(); scene.add(g);
  const steel = phys({ color: 0xa7adb5, metalness: 1, roughness: 0.36, roughnessMap: noiseTex(11, 256, 0.7, 1.0, 6), clearcoat: 0.2, side: THREE.DoubleSide });
  const P = [[0.0001, 0.004], [0.106, 0.004], [0.11, 0.012], [0.128, 0.255], [0.1305, 0.262]].map(([x, y]) => new THREE.Vector2(x, y));
  const body = new THREE.Mesh(new THREE.LatheGeometry(P, 96), steel); g.add(body);
  for (const y of [0.07, 0.16]) { const hoop = new THREE.Mesh(new THREE.TorusGeometry(lerp(0.112, 0.128, y / 0.255) + 0.002, 0.0028, 8, 96), steel); hoop.rotation.x = Math.PI / 2; hoop.position.y = y; g.add(hoop); }
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.131, 0.0045, 10, 96), steel); rim.rotation.x = Math.PI / 2; rim.position.y = 0.263; g.add(rim);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.133, 0.0028, 8, 64, Math.PI), steel); handle.position.y = 0.25; handle.rotation.set(-1.35, 0, 0); g.add(handle);
  for (const s of [-1, 1]) { const ear = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.004, 20), steel); ear.rotation.z = Math.PI / 2; ear.position.set(s * 0.13, 0.25, 0); g.add(ear); }
  const surf = new THREE.Mesh(new THREE.CircleGeometry(1, 96), new THREE.MeshStandardMaterial({ color: 0x5f86b8, roughness: 0.03, metalness: 0.1, transparent: true, opacity: 0.85, envMapIntensity: 2.0 }));
  surf.rotation.x = -Math.PI / 2; g.add(surf);
  // ripples and drops
  const ripM = () => new THREE.MeshBasicMaterial({ color: 0xdfeeff, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
  const rips = []; for (let k = 0; k < 6; k++) { const m = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.0, 64), ripM()); m.rotation.x = -Math.PI / 2; g.add(m); rips.push(m); }
  const dropM = new THREE.MeshStandardMaterial({ color: 0xd8ecff, roughness: 0.05, transparent: true, opacity: 0.8, emissive: 0x334455 });
  const drops = []; for (let k = 0; k < 14; k++) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.0028, 10, 8), dropM); m.visible = false; g.add(m); drops.push(m); }
  shadows(body); g.traverse((o) => o.layers.enable(1));
  return { g, body, surf, rips, drops, level: 0.12 };
}
const radAt = (y) => lerp(0.106, 0.128, clamp01((y - 0.012) / 0.243));
function makeStream(scene) {
  const NR = 10, NY = 40, pos = new Float32Array((NR + 1) * (NY + 1) * 3), idx = [];
  for (let j = 0; j < NY; j++) for (let i = 0; i < NR; i++) { const a = j * (NR + 1) + i, b = a + 1, c = a + NR + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setIndex(idx);
  const mat = new THREE.MeshStandardMaterial({ color: 0xcfe4ff, roughness: 0.04, metalness: 0, transparent: true, opacity: 0.7, emissive: 0x2a3d55, envMapIntensity: 2.2, depthWrite: false });
  const m = new THREE.Mesh(geo, mat); m.frustumCulled = false; m.renderOrder = 4; scene.add(m); m.layers.enable(1);
  return { m, geo, NR, NY };
}
function setStream(S2, x, z, yTop, yBot, t, on = 1) {   // a falling column from yTop down to yBot: thicker where it leaves, thinner as it speeds up, a slight wobble
  if (!(on > 0.001) || yTop - yBot < 0.002) { S2.m.visible = false; return; } S2.m.visible = true;
  const p = S2.geo.attributes.position.array, { NR, NY } = S2;
  for (let j = 0; j <= NY; j++) { const u = j / NY, y = lerp(yTop, yBot, u), fall = Math.max(0, yTop - y), rr = (0.0052 / Math.sqrt(1 + fall * 2.2)) * on;
    const wx = 0.0012 * Math.sin(y * 31 - t * 21) + 0.0006 * Math.sin(y * 77 + t * 13), wz = 0.0012 * Math.cos(y * 27 - t * 17);
    for (let i = 0; i <= NR; i++) { const a = (i / NR) * Math.PI * 2, k = (j * (NR + 1) + i) * 3; p[k] = x + wx + Math.cos(a) * rr; p[k + 1] = y; p[k + 2] = z + wz + Math.sin(a) * rr; } }
  S2.geo.attributes.position.needsUpdate = true; S2.geo.computeVertexNormals();
}

// ------------------------------------------------------------------ the apple; its bite
function makeApple() {
  const pts = []; for (let k = 0; k <= 24; k++) { const a = (k / 24) * Math.PI, r = 0.036 * Math.sin(a) * (1 + 0.1 * Math.sin(a * 2)) * (1 - 0.12 * Math.max(0, Math.cos(a))), y = -0.034 * Math.cos(a) * (1 - 0.15 * Math.exp(-((a - Math.PI) ** 2) * 6)) + (k === 0 || k === 24 ? 0 : 0);
    pts.push(new THREE.Vector2(Math.max(0.0005, r), y)); }
  const geo = new THREE.LatheGeometry(pts, 48); geo.computeVertexNormals();
  const col = new Float32Array(geo.attributes.position.count * 3), P = geo.attributes.position;
  for (let i = 0; i < P.count; i++) { const v = new THREE.Vector3().fromBufferAttribute(P, i), k = clamp01(0.5 + 0.5 * Math.sin(Math.atan2(v.z, v.x) * 1 + 0.6) * 0.8 + v.y * 6);
    const c = new THREE.Color(0x8c1a16).lerp(new THREE.Color(0xc79a2c), 0.35 * (1 - k)); col.set([c.r, c.g, c.b], i * 3); }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const mat = phys({ vertexColors: true, roughness: 0.35, clearcoat: 0.6, clearcoatRoughness: 0.25 });
  const g = new THREE.Group(), m = new THREE.Mesh(geo, mat); g.add(m);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.0016, 0.002, 0.014, 8), phys({ color: 0x3b2716, roughness: 0.8 })); stem.position.y = 0.034; stem.rotation.z = 0.2; g.add(stem);
  shadows(g); g.traverse((o) => o.layers.enable(1));
  return { g, m, geo };
}
function biteApple(A, localDir) {   // push the surface near localDir in, to a scoop, and paint it the colour of the flesh
  const geo = A.geo.clone(), P = geo.attributes.position, C = geo.attributes.color, d = localDir.clone().normalize(), c = d.clone().multiplyScalar(0.036 + 0.008), R = 0.021, flesh = new THREE.Color(0xf1e2b8);
  for (let i = 0; i < P.count; i++) { const v = new THREE.Vector3().fromBufferAttribute(P, i), q = v.clone().sub(c), L = q.length();
    if (L < R) { const n = v.clone().sub(c).normalize(); const nv = c.clone().addScaledVector(n, R); if (nv.length() < v.length()) { P.setXYZ(i, nv.x, nv.y, nv.z); C.setXYZ(i, flesh.r, flesh.g, flesh.b); } } }
  geo.computeVertexNormals(); A.m.geometry = geo;
}

// ------------------------------------------------------------------ the side table: a tray of eight (one gone), the coffee and its note
function makeSideTable(scene) {
  const g = new THREE.Group(); g.position.set(P1.x, 0, P1.z); scene.add(g);
  const wood = woodM(), top = new THREE.Mesh(new THREE.CylinderGeometry(P1.r, P1.r, 0.025, 72), wood); top.position.y = P1.top - 0.0125; g.add(top);
  const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.028, P1.top - 0.025, 20), black()); leg.position.y = (P1.top - 0.025) / 2; g.add(leg);
  const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.17, 0.02, 48), black()); foot.position.y = 0.01; g.add(foot);
  const tray = new THREE.Mesh(new RoundedBoxGeometry(0.34, 0.012, 0.17, 3, 0.005), phys({ color: 0x2b2d31, metalness: 0.8, roughness: 0.35 })); tray.position.set(-0.04, P1.top + 0.006, -0.06); g.add(tray);
  const glasses = [];
  for (let k = 0; k < 8; k++) { const i = k % 4, j = Math.floor(k / 4); if (k === 3) continue;   // the empty place: the glass it holds
    const G = makeGlass(0.82); G.g.position.set(-0.04 - 0.12 + i * 0.08, P1.top + 0.012, -0.06 - 0.04 + j * 0.08); g.add(G.g); glasses.push(G); }
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.029, 0.033, 48), new THREE.MeshBasicMaterial({ color: 0x8e96a3, transparent: true, opacity: 0.25, depthWrite: false })); ring.rotation.x = -Math.PI / 2; ring.position.set(-0.04 - 0.12 + 3 * 0.08, P1.top + 0.0125, -0.1); g.add(ring);
  const cup = makeCup(); cup.g.position.set(0.12, P1.top, 0.1); cup.g.rotation.y = -0.6; g.add(cup.g);
  // the note: a square of yellow paper leaning on the saucer
  const note = new THREE.Group(); note.position.set(-0.03, P1.top + 0.002, 0.14); note.rotation.set(-1.0, 0.25, 0); g.add(note);
  const paper = printed(0.07, 0.07, (x, w, h) => { x.fillStyle = '#f2d75b'; x.fillRect(0, 0, w, h); x.fillStyle = 'rgba(0,0,0,0.06)'; x.fillRect(0, 0, w, h * 0.12);
    txt(x, 'DOESN’T', w / 2, h * 0.42, { font: '800 52px Archivo', color: '#1d1e22', maxW: w * 0.84 }); txt(x, 'COUNT', w / 2, h * 0.68, { font: '800 52px Archivo', color: '#1d1e22', maxW: w * 0.84 }); }, { side: THREE.DoubleSide });
  paper.position.y = 0.035; note.add(paper);
  const strike = new THREE.Mesh(new THREE.PlaneGeometry(0.056, 0.0045), new THREE.MeshBasicMaterial({ color: 0xc8322c })); strike.position.set(0, 0.035 + 0.07 * 0.08, 0.0006); strike.geometry.translate(0.028, 0, 0); strike.position.x = -0.028; strike.scale.x = 0.001; note.add(strike);
  shadows(g); g.traverse((o) => o.layers.enable(1));
  return { g, glasses, cup, note, strike };
}

// ------------------------------------------------------------------ the card drawers: one labelled "8 glasses a day: the study"
function makeDrawers(scene) {
  const g = new THREE.Group(); g.position.set(P2.x, 0, P2.z); scene.add(g);
  const wood = woodM(), dark = phys({ color: 0xcfc6b4, roughness: 0.75 }), brass = phys({ color: 0xb58f55, metalness: 1, roughness: 0.3 });
  const stand = new THREE.Mesh(new RoundedBoxGeometry(0.3, P2.top, 0.26, 3, 0.008), black()); stand.position.y = P2.top / 2; g.add(stand);
  const cab = new THREE.Mesh(new RoundedBoxGeometry(P2.w, P2.h, P2.d, 3, 0.006), wood); cab.position.y = P2.top + P2.h / 2; g.add(cab);
  const fronts = [], cw = (P2.w - 0.03) / 2, ch = (P2.h - 0.03) / 2;
  let open = null;
  for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) {
    const d = new THREE.Group(); d.position.set(-P2.w / 2 + 0.01 + cw / 2 + i * (cw + 0.01), P2.top + P2.h - 0.01 - ch / 2 - j * (ch + 0.01), P2.d / 2); g.add(d);
    const face = new THREE.Mesh(new RoundedBoxGeometry(cw, ch, 0.014, 2, 0.003), wood); face.position.z = 0.007; d.add(face);
    const holder = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.026, 0.002), brass); holder.position.set(0, 0.022, 0.0145); d.add(holder);
    const pull = new THREE.Mesh(new THREE.TorusGeometry(0.009, 0.0022, 8, 24, Math.PI), brass); pull.position.set(0, -0.015, 0.016); pull.rotation.z = Math.PI; d.add(pull);
    const isIt = j === 0 && i === 1;
    const card = printed(0.062, 0.02, (x, w, h) => { x.fillStyle = '#efe9dc'; x.fillRect(0, 0, w, h); if (isIt) { txt(x, '8 GLASSES A DAY', w / 2, h * 0.36, { font: '700 30px "Geist Mono"', color: '#22242a', maxW: w * 0.9 }); txt(x, 'THE STUDY', w / 2, h * 0.74, { font: '700 30px "Geist Mono"', color: '#22242a', maxW: w * 0.9 }); }
      else { x.fillStyle = 'rgba(30,30,34,0.35)'; x.fillRect(w * 0.15, h * 0.42, w * 0.7, h * 0.16); } });
    card.position.set(0, 0.022, 0.0158); d.add(card);
    if (isIt) {   // the drawer itself: a tray behind the face, empty
      const box = new THREE.Group(); box.position.z = -0.0005; d.add(box);
      const bt = new THREE.Mesh(new THREE.BoxGeometry(cw - 0.012, 0.004, P2.d - 0.03), dark); bt.position.set(0, -ch / 2 + 0.008, -(P2.d - 0.03) / 2); box.add(bt);
      for (const s of [-1, 1]) { const sd = new THREE.Mesh(new THREE.BoxGeometry(0.004, ch - 0.02, P2.d - 0.03), dark); sd.position.set(s * (cw / 2 - 0.008), 0, -(P2.d - 0.03) / 2); box.add(sd); }
      const bk = new THREE.Mesh(new THREE.BoxGeometry(cw - 0.012, ch - 0.02, 0.004), dark); bk.position.set(0, 0, -(P2.d - 0.03)); box.add(bk);
      const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.0025, 0.0025, P2.d - 0.04, 12), brass); rod.rotation.x = Math.PI / 2; rod.position.set(0, -ch / 2 + 0.02, -(P2.d - 0.03) / 2); box.add(rod);
      const hole = new THREE.Mesh(new THREE.PlaneGeometry(cw - 0.004, ch - 0.004), new THREE.MeshBasicMaterial({ color: 0x050505 })); hole.position.set(0, 0, -0.001); g.add(hole); hole.position.add(d.position).setZ(P2.d / 2 - 0.002);
      open = d;
    }
    fronts.push(d);
  }
  shadows(g); g.traverse((o) => o.layers.enable(1));
  return { g, open };
}

// ------------------------------------------------------------------ the counter: two jugs (women 2.0 L, men 2.5 L); drinks and food in front
const JUG = { r: 0.065, h: 0.24 };
const jugH = (mL) => (mL / 1e6) / (Math.PI * JUG.r * JUG.r * 0.93);   // the height of so many millilitres in a jug
function makeJug(lab) {
  const g = new THREE.Group(), { r, h } = JUG;
  const wall = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.04, r, h, 64, 1, true), glassM()); wall.material.opacity = 0.06; wall.position.y = h / 2 + 0.01; wall.renderOrder = 3; g.add(wall);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.01, 64), glassM()); base.position.y = 0.005; base.renderOrder = 3; g.add(base);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.007, 12, 48, Math.PI), glassM()); handle.position.set(r * 1.02, h * 0.55, 0); handle.rotation.z = -Math.PI / 2; handle.renderOrder = 3; g.add(handle);
  // the marks: 1 L, 2 L (and 0.5 steps), printed on the glass, facing the room
  const marks = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.045, r * 1.005, h, 64, 1, true, -0.55, 1.1), new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, map: canvasTex(512, 1024, (x, w, H) => {
    x.clearRect(0, 0, w, H); x.fillStyle = 'rgba(235,240,248,0.85)';
    for (let L = 0.5; L <= 3.0; L += 0.5) { const y = H - (jugH(L * 1000) / h) * H; const big = L % 1 === 0; x.fillRect(w * 0.5 - (big ? 70 : 40), y - 3, big ? 140 : 80, 6); if (big) txt(x, `${L} L`, w * 0.5 + 120, y, { font: '700 44px "Geist Mono"', color: 'rgba(235,240,248,0.9)' }); }
  }) })); marks.position.y = h / 2 + 0.01; marks.renderOrder = 4; g.add(marks);
  const wm = new THREE.MeshStandardMaterial({ color: 0x8fbcf2, transparent: true, opacity: 0.5, roughness: 0.04, depthWrite: false, envMapIntensity: 1.4 });
  const water = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.97, r * 0.95, 1, 64), wm); water.renderOrder = 2; g.add(water);
  const fm = new THREE.MeshStandardMaterial({ color: 0xd9b45a, transparent: true, opacity: 0.55, roughness: 0.1, depthWrite: false, emissive: 0x2b1e05 });
  const foodW = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.975, r * 0.97, 1, 64), fm); foodW.renderOrder = 2; foodW.visible = false; g.add(foodW);
  const plaque = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.05, r * 1.05, 0.032, 64, 1, true, -0.62, 1.24), new THREE.MeshBasicMaterial({ transparent: true, map: canvasTex(1024, 160, (x, w, H) => {
    x.clearRect(0, 0, w, H); x.fillStyle = 'rgba(14,15,18,0.92)'; x.beginPath(); x.roundRect(w * 0.04, 8, w * 0.92, H - 16, 40); x.fill(); txt(x, lab, w / 2, H / 2 + 4, { font: '800 92px Archivo', color: '#eceef1', track: 6, maxW: w * 0.82 }); }) }));
  plaque.position.y = h - 0.014; plaque.renderOrder = 5; g.add(plaque);
  g.traverse((o) => o.layers.enable(1));
  return { g, water, wm, foodW, fm };
}
function setJug(J, litres, foodFrac = 0, foodOn = 0) {
  const H = Math.max(0.0005, jugH(litres)), hf = H * foodFrac * foodOn, hw = H - hf;
  J.water.scale.y = Math.max(0.0005, hw); J.water.position.y = 0.01 + hw / 2; J.water.visible = litres > 0.005;
  J.foodW.visible = hf > 0.0005; J.foodW.scale.y = Math.max(0.0005, hf); J.foodW.position.y = 0.01 + hw + hf / 2;
}
function makeCounter(scene, C) {
  const g = new THREE.Group(); g.position.set(C.x, 0, C.z); scene.add(g);
  const top = new THREE.Mesh(new RoundedBoxGeometry(C.w, 0.035, C.d, 3, 0.008), woodM()); top.position.y = C.top - 0.0175; g.add(top);
  const body = new THREE.Mesh(new RoundedBoxGeometry(C.w - 0.04, C.top - 0.035, C.d - 0.04, 3, 0.01), black()); body.position.y = (C.top - 0.035) / 2; g.add(body);
  shadows(g); g.traverse((o) => o.layers.enable(1));
  return g;
}
function makeKitchen(scene) {
  const g = makeCounter(scene, P3);
  const women = makeJug('WOMEN · 2.0 L'), men = makeJug('MEN · 2.5 L');
  women.g.position.set(-0.13, P3.top, -0.07); men.g.position.set(0.12, P3.top, -0.07); g.add(women.g, men.g);
  // what counts: every drink, and the water in food
  const items = [];
  const waterG = makeGlass(0.8); waterG.g.position.set(-0.33, P3.top, 0.12); waterG.g.scale.setScalar(0.8); g.add(waterG.g); items.push(waterG.g);
  const mug = makeMug(0x2a1a10); mug.position.set(-0.2, P3.top, 0.14); mug.rotation.y = -0.5; g.add(mug); items.push(mug);
  const tea = makeMug(0x7a3e12, true); tea.position.set(-0.06, P3.top, 0.14); tea.rotation.y = -0.3; g.add(tea); items.push(tea);
  const milk = makeGlass(0.8, { color: 0xf3f1ea, opacity: 0.92 }); milk.g.position.set(0.06, P3.top, 0.13); milk.g.scale.setScalar(0.8); g.add(milk.g); items.push(milk.g);
  const bowl = makeBowl(); bowl.position.set(0.27, P3.top, 0.11); g.add(bowl); items.push(bowl);
  return { g, women, men, items, waterG, milk };
}
function makeMug(liquid, tea = false) {
  const g = new THREE.Group(), cer = phys({ color: tea ? 0xf3efe7 : 0x23252a, roughness: 0.3, clearcoat: 0.5, side: THREE.DoubleSide });
  const P = (tea ? [[0.0001, 0.001], [0.026, 0.001], [0.03, 0.006], [0.042, 0.05], [0.0435, 0.053], [0.0415, 0.052], [0.029, 0.009], [0.0001, 0.008]] : [[0.0001, 0.001], [0.034, 0.001], [0.036, 0.006], [0.038, 0.09], [0.0395, 0.093], [0.0365, 0.091], [0.0345, 0.008], [0.0001, 0.008]]).map(([x, y]) => new THREE.Vector2(x, y));
  g.add(new THREE.Mesh(new THREE.LatheGeometry(P, 64), cer));
  const hd = new THREE.Mesh(new THREE.TorusGeometry(tea ? 0.014 : 0.022, 0.004, 10, 32, Math.PI * 1.3), cer); hd.position.set(tea ? 0.045 : 0.04, tea ? 0.03 : 0.05, 0); hd.rotation.z = -Math.PI * 0.65; g.add(hd);
  const top = new THREE.Mesh(new THREE.CircleGeometry(tea ? 0.039 : 0.0355, 48), phys({ color: liquid, roughness: 0.05, clearcoat: 1 })); top.rotation.x = -Math.PI / 2; top.position.y = tea ? 0.045 : 0.082; g.add(top);
  if (tea) { const sau = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.008, 48), cer); sau.position.y = -0.003; g.add(sau); g.position.y = 0.007; }
  shadows(g); g.traverse((o) => o.layers.enable(1)); return g;
}
function makeBowl() {
  const g = new THREE.Group(), cer = phys({ color: 0xe9e4da, roughness: 0.35, clearcoat: 0.4, side: THREE.DoubleSide });
  g.add(new THREE.Mesh(new THREE.LatheGeometry([[0.0001, 0.001], [0.04, 0.001], [0.07, 0.03], [0.082, 0.05], [0.078, 0.05], [0.066, 0.032], [0.038, 0.008], [0.0001, 0.008]].map(([x, y]) => new THREE.Vector2(x, y)), 64), cer));
  const ap = makeApple(); ap.g.position.set(-0.022, 0.045, 0.0); ap.g.scale.setScalar(0.85); g.add(ap.g);
  const orange = new THREE.Mesh(new THREE.SphereGeometry(0.03, 32, 24), phys({ color: 0xe0761c, roughness: 0.55, roughnessMap: noiseTex(5, 128, 0.6, 1.0, 30), clearcoat: 0.3 })); orange.position.set(0.028, 0.04, 0.012); g.add(orange);
  for (let k = 0; k < 3; k++) { const s = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.005, 24), [phys({ color: 0x2f5a1f, roughness: 0.5 }), phys({ color: 0xcfe0a8, roughness: 0.6 }), phys({ color: 0xcfe0a8, roughness: 0.6 })]);
    s.position.set(0.005 + k * 0.012, 0.072 + k * 0.004, -0.03 + k * 0.004); s.rotation.set(0.5 + k * 0.2, 0, 0.3); g.add(s); }
  shadows(g); g.traverse((o) => o.layers.enable(1)); return g;
}

// ------------------------------------------------------------------ the tubes: kept in, by drink
const TUBES = [['WATER', 0x6aa6ee, 0.6], ['COFFEE', 0x3a2414, 0.96], ['TEA', 0xb0621c, 0.88], ['COLA', 0x2a120c, 0.96], ['MILK', 0xf4f2ea, 0.98]];
function makeTubes(scene) {
  const g = makeCounter(scene, P4), out = [];
  const rack = new THREE.Mesh(new RoundedBoxGeometry(0.52, 0.02, 0.09, 3, 0.005), black()); rack.position.set(0, P4.top + 0.01, 0); g.add(rack);
  TUBES.forEach(([lab, col, op], i) => {
    const x = -0.2 + i * 0.1, tube = new THREE.Group(); tube.position.set(x, P4.top + 0.02, 0); g.add(tube);
    const wall = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.25, 40, 1, true), glassM()); wall.material.opacity = 0.035; wall.material.envMapIntensity = 0.5; wall.position.y = 0.125; wall.renderOrder = 3; tube.add(wall);
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.022, 32, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), glassM()); cap.renderOrder = 3; tube.add(cap);
    const liq = new THREE.Mesh(new THREE.CylinderGeometry(0.0205, 0.0205, 1, 40), new THREE.MeshStandardMaterial({ color: col, transparent: true, opacity: op, roughness: 0.06, depthWrite: false, envMapIntensity: 1.3 }));
    liq.renderOrder = 2; tube.add(liq);
    const tag = printed(0.085, 0.022, (x2, w, h) => { x2.fillStyle = '#e9e5dc'; x2.fillRect(0, 0, w, h); txt(x2, lab, w / 2, h / 2 + 2, { font: '700 52px "Geist Mono"', color: '#16181c', track: 4, maxW: w * 0.88 }); });
    tag.position.set(x, P4.top + 0.01, 0.047); g.add(tag);
    tube.traverse((o) => o.layers.enable(1));
    out.push({ tube, liq });
  });
  const line = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.0016), new THREE.MeshBasicMaterial({ color: 0xffb36b, transparent: true, opacity: 0, depthWrite: false })); line.position.set(0, P4.top + 0.02, 0.026); g.add(line);
  return { g, out, line };
}
const TUBE_H = (k) => 0.03 + 0.22 * k;   // liquid height for a level k

// ------------------------------------------------------------------ the meal and the colour card
function makeMeal(scene) {
  const g = new THREE.Group(); g.position.set(P5.x, 0, P5.z); scene.add(g);
  const top = new THREE.Mesh(new RoundedBoxGeometry(P5.w, 0.03, P5.d, 3, 0.008), woodM()); top.position.y = P5.top - 0.015; g.add(top);
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.012, P5.top - 0.03, 12), black()); leg.position.set(sx * (P5.w / 2 - 0.04), (P5.top - 0.03) / 2, sz * (P5.d / 2 - 0.04)); g.add(leg); }
  const cer = phys({ color: 0xeeeae2, roughness: 0.3, clearcoat: 0.5, side: THREE.DoubleSide });
  const plate = new THREE.Mesh(new THREE.LatheGeometry([[0.0001, 0.001], [0.08, 0.001], [0.11, 0.012], [0.125, 0.018], [0.123, 0.02], [0.105, 0.015], [0.078, 0.006], [0.0001, 0.006]].map(([x, y]) => new THREE.Vector2(x, y)), 72), cer);
  plate.position.set(-0.04, P5.top, 0.05); g.add(plate);
  const steel = phys({ color: 0xd2d5da, metalness: 1, roughness: 0.25 });
  const fork = new THREE.Mesh(new RoundedBoxGeometry(0.012, 0.004, 0.17, 2, 0.0015), steel); fork.position.set(-0.19, P5.top + 0.002, 0.05); g.add(fork);
  const knife = new THREE.Mesh(new RoundedBoxGeometry(0.014, 0.004, 0.19, 2, 0.0015), steel); knife.position.set(0.11, P5.top + 0.002, 0.05); g.add(knife);
  const gl = makeGlass(0.8); gl.g.position.set(0.17, P5.top, -0.07); g.add(gl.g);
  // the colour card, on a small stand: the NHS check
  const card = new THREE.Group(); card.position.set(0.02, P5.top, -0.13); card.rotation.x = -0.2; g.add(card);
  const CH = ['#fbf6d8', '#f6ea9b', '#ecd25a', '#d9a72c', '#b8791c'];
  const face = printed(0.12, 0.27, (x, w, h) => { x.fillStyle = '#f4f2ec'; x.fillRect(0, 0, w, h);
    txt(x, 'THE NHS CHECK', w / 2, h * 0.07, { font: '800 40px Archivo', color: '#16181c', track: 4, maxW: w * 0.86 });
    CH.forEach((c, i) => { const y0 = h * 0.13 + i * h * 0.165; x.fillStyle = c; x.fillRect(w * 0.08, y0, w * 0.84, h * 0.14); });
    txt(x, 'CLEAR PALE YELLOW', w * 0.5, h * 0.13 + 1 * h * 0.165 + h * 0.07, { font: '700 30px "Geist Mono"', color: '#5b4a12', track: 2, maxW: w * 0.7 }); });
  face.position.y = 0.15; card.add(face);
  const easel = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.3, 0.012), black()); easel.position.set(0, 0.13, -0.05); easel.rotation.x = -0.35; card.add(easel);
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.052, 0.058, 64), new THREE.MeshBasicMaterial({ color: 0xff6a2b, transparent: true, opacity: 0, depthWrite: false })); ring.scale.set(1.15, 0.42, 1);
  ring.position.set(0, 0.15 + 0.27 * (0.5 - (0.13 + 0.165 + 0.07)), 0.001); card.add(ring);
  const tick = label(0.03, 0.03, (x, w, h) => { x.clearRect(0, 0, w, h); x.strokeStyle = '#ff6a2b'; x.lineWidth = 16; x.lineCap = 'round'; x.lineJoin = 'round'; x.beginPath(); x.moveTo(w * 0.15, h * 0.55); x.lineTo(w * 0.42, h * 0.8); x.lineTo(w * 0.88, h * 0.2); x.stroke(); });
  tick.position.set(0.075, ring.position.y, 0.002); tick.material.opacity = 0; card.add(tick);
  shadows(g); g.traverse((o) => o.layers.enable(1));
  return { g, ring, tick };
}

// ------------------------------------------------------------------ the cylinder that rises with each reason, then overflows
const CYL = { r: 0.042, h: 0.42 };
function makeCylinder(scene) {
  const g = new THREE.Group(); g.position.set(P6.x, 0, P6.z); scene.add(g);
  const ped = new THREE.Mesh(new RoundedBoxGeometry(0.28, P6.top, 0.28, 3, 0.01), black()); ped.position.y = P6.top / 2; g.add(ped);
  const wall = new THREE.Mesh(new THREE.CylinderGeometry(CYL.r, CYL.r, CYL.h, 48, 1, true), glassM()); wall.position.y = P6.top + 0.015 + CYL.h / 2; wall.renderOrder = 3; g.add(wall);
  const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.075, 0.015, 6), glassM()); foot.position.y = P6.top + 0.0075; foot.renderOrder = 3; g.add(foot);
  const marks = new THREE.Mesh(new THREE.CylinderGeometry(CYL.r * 1.004, CYL.r * 1.004, CYL.h, 48, 1, true, -0.5, 1.0), new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, map: canvasTex(256, 1024, (x, w, H) => {
    x.clearRect(0, 0, w, H); x.fillStyle = 'rgba(235,240,248,0.8)'; for (let k = 1; k < 20; k++) { const y = H - (k / 20) * H; x.fillRect(w * 0.5 - (k % 5 ? 20 : 40), y - 2, k % 5 ? 40 : 80, 4); } }) }));
  marks.position.y = wall.position.y; marks.rotation.y = Math.PI / 2; marks.renderOrder = 4; g.add(marks);
  const wm = new THREE.MeshStandardMaterial({ color: 0x8fbcf2, transparent: true, opacity: 0.55, roughness: 0.04, depthWrite: false, envMapIntensity: 1.4 });
  const water = new THREE.Mesh(new THREE.CylinderGeometry(CYL.r * 0.96, CYL.r * 0.96, 1, 48), wm); water.renderOrder = 2; g.add(water);
  // the spill: a sheet down the outside, a pool on the pedestal
  const sheet = new THREE.Mesh(new THREE.CylinderGeometry(CYL.r * 1.03, CYL.r * 1.03, 1, 48, 1, true, -1.1, 2.2), new THREE.MeshStandardMaterial({ color: 0xbfdcff, transparent: true, opacity: 0, roughness: 0.04, depthWrite: false, emissive: 0x18283a, side: THREE.DoubleSide }));
  sheet.renderOrder = 4; g.add(sheet);
  const pool = new THREE.Mesh(new THREE.CircleGeometry(1, 64), new THREE.MeshStandardMaterial({ color: 0x8fb6e6, transparent: true, opacity: 0, roughness: 0.03, depthWrite: false, envMapIntensity: 2 }));
  pool.rotation.x = -Math.PI / 2; pool.position.y = P6.top + 0.0012; g.add(pool);
  const tags = ['+ HEAT', '+ LONG EXERCISE', '+ ILLNESS', '+ PREGNANT OR BREASTFEEDING'].map((s, i) => {
    const m = printed(0.18, 0.031, (x, w, h) => { x.fillStyle = '#16171a'; x.beginPath(); x.roundRect(0, 0, w, h, 30); x.fill(); txt(x, s, w * 0.06, h / 2 + 2, { font: '700 60px "Geist Mono"', color: '#eceef1', align: 'left', track: 3, maxW: w * 0.88 }); }, { depthWrite: false });
    m.position.set(-0.155, P6.top + 0.08 + i * 0.048, 0.03); m.rotation.y = 0.15; m.material.opacity = 0; g.add(m); return m; });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(CYL.r * 0.99, 48, 12, 0, Math.PI * 2, 0, 0.5), new THREE.MeshStandardMaterial({ color: 0x9cc6f6, transparent: true, opacity: 0, roughness: 0.03, depthWrite: false, envMapIntensity: 1.6 }));
  dome.scale.set(1, 0.28, 1); g.add(dome);
  shadows(ped); g.traverse((o) => o.layers.enable(1));
  const runs = [-0.55, 0.05, 0.6].map(() => makeStream(scene));
  return { g, water, sheet, pool, tags, dome, runs };
}

// ------------------------------------------------------------------ the marathon board: a finish banner, 100 bibs; 13 turn red. A scale on the floor.
function makeMarathon(scene) {
  const g = new THREE.Group(); g.position.set(P7.x, 0, P7.z); scene.add(g);
  const board = new THREE.Mesh(new RoundedBoxGeometry(P7.w, P7.h, 0.03, 3, 0.008), phys({ color: 0x1b1c20, roughness: 0.6 })); board.position.y = P7.y; g.add(board);
  for (const s of [-1, 1]) { const leg = new THREE.Mesh(new THREE.BoxGeometry(0.03, P7.y + P7.h / 2 + 0.2, 0.03), black()); leg.position.set(s * (P7.w / 2 + 0.03), (P7.y + P7.h / 2 + 0.2) / 2, -0.01); g.add(leg); }
  const banner = printed(P7.w + 0.08, 0.13, (x, w, h) => { const n = 26; for (let i = 0; i < n; i++) for (let j = 0; j < 2; j++) { x.fillStyle = (i + j) % 2 ? '#111' : '#f2f2ee'; x.fillRect((i / n) * w, j * h * 0.18, w / n + 1, h * 0.18); x.fillRect((i / n) * w, h * 0.82 + j * h * 0.09, w / n + 1, h * 0.09); }
    x.fillStyle = '#f2f2ee'; x.fillRect(0, h * 0.36, w, h * 0.46); txt(x, 'FINISH', w / 2, h * 0.6, { font: '900 300px Archivo', color: '#111317', track: 40, maxW: w * 0.6 }); });
  banner.position.set(0, P7.y + P7.h / 2 + 0.12, 0.02); g.add(banner);
  const head = printed(0.7, 0.04, (x, w, h) => { x.clearRect(0, 0, w, h); txt(x, 'BLOOD TESTED AT THE FINISH', w / 2, h / 2 + 2, { font: '700 64px "Geist Mono"', color: '#c9ccd2', track: 6, maxW: w * 0.95 }); }, { depthWrite: false });
  head.position.set(0, P7.y + P7.h / 2 - 0.05, 0.017); g.add(head);
  const bibs = [], bw = 0.068, bh = 0.052;
  const order = [...Array(100).keys()].sort((a, b) => hash(a * 7.31 + 3) - hash(b * 7.31 + 3)), red = new Set(order.slice(0, 13));
  for (let k = 0; k < 100; k++) { const i = k % 10, j = Math.floor(k / 10), num = 100 + Math.floor(hash(k * 2.7) * 9800);
    const mk = (bg, fg) => canvasTex(272, 208, (x, w, h) => { x.fillStyle = bg; x.fillRect(0, 0, w, h); x.fillStyle = 'rgba(0,0,0,0.15)'; for (const cx of [18, w - 18]) for (const cy of [16, h - 16]) { x.beginPath(); x.arc(cx, cy, 6, 0, 7); x.fill(); } txt(x, String(num), w / 2, h / 2 + 6, { font: '900 96px Archivo', color: fg }); });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(bw, bh), phys({ map: mk('#ecebe6', '#1a1b1f'), roughness: 0.7 }));
    m.position.set(-0.36 + i * 0.08, P7.y + 0.3 - j * 0.066, 0.016); g.add(m);
    bibs.push({ m, red: red.has(k), rank: red.has(k) ? order.indexOf(k) : -1, redMap: red.has(k) ? mk('#c8322c', '#fff') : null });
  }
  // the scale on the floor in front
  const sc = new THREE.Group(); sc.position.set(0, 0, 0.42); g.add(sc);
  const plat = new THREE.Mesh(new RoundedBoxGeometry(0.32, 0.05, 0.3, 4, 0.02), phys({ color: 0xe8e6e1, roughness: 0.35, clearcoat: 0.6 })); plat.position.y = 0.025; sc.add(plat);
  const win = new THREE.Mesh(new THREE.CircleGeometry(0.06, 48), phys({ color: 0x0e0f12, roughness: 0.2, clearcoat: 1 })); win.rotation.x = -Math.PI / 2; win.position.set(0, 0.0505, 0.07); sc.add(win);
  const dial = new THREE.Mesh(new THREE.CircleGeometry(0.056, 48), new THREE.MeshBasicMaterial({ map: canvasTex(512, 512, (x, w) => { x.fillStyle = '#f4f2ec'; x.beginPath(); x.arc(w / 2, w / 2, w / 2, 0, 7); x.fill();
    for (let k = 0; k <= 40; k++) { const a = -Math.PI * 0.8 + (k / 40) * Math.PI * 1.6, r0 = k % 5 ? 0.38 : 0.33; x.strokeStyle = '#26272b'; x.lineWidth = k % 5 ? 3 : 6; x.beginPath(); x.moveTo(w / 2 + Math.sin(a) * w * r0, w / 2 - Math.cos(a) * w * r0); x.lineTo(w / 2 + Math.sin(a) * w * 0.43, w / 2 - Math.cos(a) * w * 0.43); x.stroke(); }
    txt(x, '+', w * 0.78, w * 0.66, { font: '800 70px Archivo', color: '#c8322c' }); }) }));
  dial.rotation.x = -Math.PI / 2; dial.position.set(0, 0.0508, 0.07); sc.add(dial);
  const needle = new THREE.Group(); needle.position.set(0, 0.052, 0.07); sc.add(needle);
  const nb = new THREE.Mesh(new THREE.BoxGeometry(0.003, 0.0008, 0.05), new THREE.MeshBasicMaterial({ color: 0xc8322c })); nb.position.z = -0.022; needle.add(nb);
  shadows(g); g.traverse((o) => o.layers.enable(1));
  return { g, bibs, needle };
}

// ------------------------------------------------------------------ the last glass, on its own table (it becomes the logo)
function makeLast(scene) {
  const g = new THREE.Group(); g.position.set(P8.x, 0, P8.z); scene.add(g);
  const top = new THREE.Mesh(new THREE.CylinderGeometry(P8.r, P8.r, 0.022, 64), woodM()); top.position.y = P8.top - 0.011; g.add(top);
  const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.024, P8.top - 0.022, 20), black()); leg.position.y = (P8.top - 0.022) / 2; g.add(leg);
  const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.14, 0.02, 48), black()); foot.position.y = 0.01; g.add(foot);
  const G = makeGlass(0.86); G.g.position.set(0, P8.top, 0); g.add(G.g);
  const logo = makeLogoRing(LOGO_R); logo.g.rotation.x = -Math.PI / 2; logo.g.position.set(0, P8.top + GLASS.h + 0.0012, 0); g.add(logo.g);
  shadows(g); g.traverse((o) => o.layers.enable(1));
  return { g, G, logo };
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
  const scene = S.scene; S.r.localClippingEnabled = true;
  S.fog.near = 4; S.fog.far = 13;
  S.table.scale.set(4, 4, 1); S.tableMat.clearcoat = 0.1; S.tableMat.specularIntensity = 0.3;
  for (const m of [S.tableMat.map, S.tableMat.roughnessMap]) if (m) { m.wrapS = m.wrapT = THREE.RepeatWrapping; m.repeat.multiplyScalar(4); }
  const meshes = await loadAnatomy(skeletonKind());
  const R = W.rig = buildRig(meshes);
  W.body = new THREE.Group(); scene.add(W.body); W.body.add(R.root);
  for (const m of meshes) { m.castShadow = true; m.receiveShadow = true; m.layers.enable(1); }
  W.meshes = meshes;
  W.ground = Math.min(R.legs.Right.ground, R.legs.Left.ground);
  W.body.position.set(0, -W.ground, -R.P0.z);
  const at = R.seg.Atlas;
  // the jaw on its own hinge, so it can bite
  W.body.updateMatrixWorld(true);
  W.jawG = new THREE.Group(); W.jawG.position.copy(new THREE.Vector3(0, 1.668, -0.003)).sub(at.pivot); at.g.add(W.jawG); at.g.updateMatrixWorld(true);
  const lowerTeeth = meshes.filter((m) => /lower .*tooth|lower .*incisor/i.test(m.userData.name));
  for (const m of meshes) if (/^mandible$|lower .*tooth/i.test(m.userData.name)) W.jawG.attach(m);
  // the mouth: just in front of the lower front teeth (rest frame), and the jaw's lowest point
  { const vs = []; for (const m of lowerTeeth.length ? lowerTeeth : [R.byName.get('Mandible')]) for (const v of worldVerts(m, 2)) vs.push(v);
    let zmax = -9; for (const v of vs) zmax = Math.max(zmax, v.z); const front = avgV(vs.filter((v) => v.z > zmax - 0.004));
    W.mouthRest = front.clone().add(new THREE.Vector3(0, 0.002, 0.006));
    const mv = worldVerts(R.byName.get('Mandible'), 2); let ymin = 9; for (const v of mv) ymin = Math.min(ymin, v.y); W.jawLowRest = ymin; }
  // hands; the glass in the left, the apple in the right
  W.wristL = makeWrist(R, 'Left'); W.wristR = makeWrist(R, 'Right');
  W.handL = rigHand(R, 'Left', W.wristL); W.handR = rigHand(R, 'Right', W.wristR); W.handL.wr = W.wristL; W.handR.wr = W.wristR;
  W.glass = makeGlass(0.86); W.glass.g.matrixAutoUpdate = false; scene.add(W.glass.g);
  { const H = W.handL, up = H.across.clone().negate(), q = new THREE.Quaternion().setFromUnitVectors(Y, up); W.glass.hm = new THREE.Matrix4().compose(H.handle.clone().addScaledVector(up, -GRIP), q, new THREE.Vector3(1, 1, 1)); }
  W.apple = makeApple(); W.apple.g.matrixAutoUpdate = false; scene.add(W.apple.g);
  { const H = W.handR; W.apple.hm = new THREE.Matrix4().compose(H.handle.clone().addScaledVector(H.n, 0.012), new THREE.Quaternion(), new THREE.Vector3(1, 1, 1)); }
  W.chunk = new THREE.Mesh(new THREE.IcosahedronGeometry(0.011, 1), phys({ color: 0xf1e2b8, roughness: 0.5 })); W.chunk.scale.set(1.3, 0.8, 1); W.chunk.visible = false; scene.add(W.chunk); W.chunk.layers.enable(1);
  // ---- the stance, and where a vertical line falls clear through it (the stream's path)
  poseBody(-1, true); W.body.updateMatrixWorld(true);
  { const rc = new THREE.Raycaster(), down = new THREE.Vector3(0, -1, 0), solid = meshes.filter((m) => !/hyoid|cartilage/i.test(m.userData.name)), yTop = W.jawLowW - 0.01;
    rc.far = yTop - 0.3; const clear = [];
    for (let z = 0.0; z <= 0.12; z += 0.002) { let ok = true;
      for (const [dx, dz] of [[0, 0], [0.006, 0], [-0.006, 0], [0, 0.003], [0, -0.003]]) { rc.set(new THREE.Vector3(dx, yTop, z + dz), down); if (rc.intersectObjects(solid, false).length) { ok = false; break; } }
      clear.push([z, ok]); }
    let best = null, run = null; for (const [z, ok] of clear) { if (ok) { if (!run) run = [z, z]; else run[1] = z; if (!best || run[1] - run[0] > best[1] - best[0]) best = [...run]; } else run = null; }
    W.lineZ = best ? (best[0] + best[1]) / 2 : 0.06; W.lineRun = best; }
  // ---- the set
  W.bucket = makeBucket(scene); W.bucket.g.position.set(0, 0, W.lineZ);
  // the factory stamp: on the bucket, where a maker marks a pail
  { const bd = W.bucket.body; W.stampSpot = stampSpot(bd, { from: [0, 0.165, 0.3], dir: [0, 0, -1], spread: 0.004 });
    if (W.stampSpot) W.stamp = stamp(bd, { canvas: stampCanvas(['HUMAN FACTORY', 'SETTINGS'], '', { frame: false }), center: W.stampSpot.center, normal: W.stampSpot.normal, up: [0, 1, 0], width: 0.085, depth: 0.03, opacity: 0.55 }); }
  W.stream = makeStream(scene);
  W.side = makeSideTable(scene); W.drawers = makeDrawers(scene); W.kit = makeKitchen(scene); W.tubes = makeTubes(scene); W.meal = makeMeal(scene); W.cyl = makeCylinder(scene); W.mara = makeMarathon(scene); W.last = makeLast(scene);
  // ---- the arm poses, solved once: the glass at the lips (two tilts), the glass down by its side; the apple at the mouth, the apple down
  W.poses = solvePoses();
  // ---- light
  W.key = spot(scene, { color: 0xdfe6ff, pos: new THREE.Vector3(1.6, 3.0, 2.2), target: new THREE.Vector3(0, 0.9, 0.1), angle: 0.5, penumbra: 0.8, shadow: true, size: cfg.shadow ?? 1024 }); W.key.shadow.camera.far = 8;
  W.rim = spot(scene, { color: 0xa9c4ff, pos: new THREE.Vector3(-1.2, 2.4, -1.4), target: new THREE.Vector3(0, 1.0, 0), angle: 0.5, penumbra: 0.9 });
  W.fill = spot(scene, { color: 0xc8d6ff, pos: new THREE.Vector3(-1.8, 1.3, 2.0), target: new THREE.Vector3(0, 0.8, 0.2), angle: 0.6, penumbra: 1 });
  W.bucketLight = spot(scene, { color: 0xeef3ff, pos: new THREE.Vector3(0.5, 1.4, 1.4), target: new THREE.Vector3(0, 0.2, W.lineZ), angle: 0.22, penumbra: 0.8 });
  const sp = (x, z, y, tx, ty, tz, a = 0.3) => spot(scene, { color: 0xfff1d8, pos: new THREE.Vector3(x, y, z), target: new THREE.Vector3(tx, ty, tz), angle: a, penumbra: 0.7 });
  W.l1 = sp(P1.x + 0.2, 1.3, 2.3, P1.x, P1.top + 0.05, P1.z, 0.24); W.l2 = sp(P2.x + 0.2, 1.3, 2.4, P2.x, P2.top + 0.12, P2.z + 0.1, 0.22);
  W.l3 = sp(P3.x + 0.25, 1.4, 2.4, P3.x, P3.top + 0.1, P3.z, 0.3); W.l4 = sp(P4.x + 0.2, 1.3, 2.4, P4.x, P4.top + 0.18, P4.z, 0.28);
  W.l5 = sp(P5.x + 0.2, 1.3, 2.3, P5.x, P5.top + 0.08, P5.z - 0.05, 0.3); W.l6 = sp(P6.x + 0.25, 1.3, 2.4, P6.x, P6.top + 0.2, P6.z, 0.26);
  W.l7 = sp(P7.x + 0.3, 1.9, 2.6, P7.x, P7.y, P7.z, 0.32); W.l7b = sp(P7.x - 0.3, 1.2, 2.0, P7.x, 0.05, P7.z + 0.42, 0.18); W.l8 = sp(P8.x + 0.25, 1.2, 2.3, P8.x, P8.top + 0.06, P8.z, 0.22);
  return { stamp: W.stampSpot, lineZ: W.lineZ, run: W.lineRun, jawLow: W.jawLowW, errs: Object.fromEntries(Object.entries(W.poses).map(([k, v]) => [k, v.err && +v.err.toFixed(4)])) };
}

// ------------------------------------------------------------------ the body: feet apart; it drinks (left hand), bites (right hand)
const HEAD = { drinkUp: 0.15, drinkHold: 1.95, drinkDown: 2.7 };   // the drink: lips from the start, the glass tips up, then down
const BITE = { up0: 23.9, up1: 24.75, open: 24.95, shut: 25.2, down0: 25.75, down1: 26.7 };
function tiltAt(t) { return lerp(1.15, 1.85, s5(0, HEAD.drinkHold, t)); }                    // the glass's tip from upright (rad)
function headAt(t) { return -0.45 * s5(-0.5, 0.6, t) * (1 - s5(HEAD.drinkHold, HEAD.drinkDown + 0.3, t)) - 0.1 * pulse(t, BITE.up0, BITE.down1, 0.5); }
function poseBody(t, solving = false) {
  const R = W.rig, br = 0.5 - 0.5 * Math.cos((t / 4.3) * Math.PI * 2);
  R.pelvis.position.copy(R.P0).add(new THREE.Vector3(0, -0.014, 0)); R.pelvis.rotation.set(0.02, 0, 0);
  const hd = solving ? 0 : headAt(t);
  bendSpine(R.seg, { lum: -0.04, tho: 0.06 + 0.008 * br, cer: hd + 0.04 });
  W.body.updateMatrixWorld(true);
  for (const Side of ['Right', 'Left']) { const G = R.legs[Side];
    const tgt = new THREE.Vector3(G.s * 0.205, G.A.y - W.ground, G.A.z - R.P0.z + 0.01);
    legIK(R, Side, tgt, new THREE.Quaternion().setFromAxisAngle(Y, -G.s * 0.12), Z); }
  if (W.poses && !solving) {
    const P = W.poses, d = s5(-1.2, -0.2, t) * (1 - s5(HEAD.drinkHold, HEAD.drinkDown, t)), tip = s5(0, HEAD.drinkHold, t);
    const pl = mixArm(P.glassDown, mixArm(P.lips1, P.lips2, tip), d); poseArm(R.arms.Left, pl); setWrist(W.wristL, pl); W.handL.curl(0.55);
    const b = s5(BITE.up0, BITE.up1, t) * (1 - s5(BITE.down0, BITE.down1, t));
    const pr = mixArm(P.appleDown, P.appleUp, b); poseArm(R.arms.Right, pr); setWrist(W.wristR, pr); W.handR.curl(0.6);
  } else { const p0 = { dir: [0.1, -1, 0.1], twist: 0.2, elbow: 0.3 }; poseArm(R.arms.Left, p0); poseArm(R.arms.Right, p0); if (W.wristL) { setWrist(W.wristL, p0); setWrist(W.wristR, p0); } }
  if (W.jawG) W.jawG.rotation.x = solving ? 0 : 0.32 * (ss(BITE.open - 0.12, BITE.open, t) * (1 - ss(BITE.shut - 0.03, BITE.shut + 0.06, t))) + 0.06 * d01(t);
  W.body.updateMatrixWorld(true);
  // what the hands carry
  W.glass.g.matrix.multiplyMatrices(W.wristL.g.matrixWorld, W.glass.hm); W.glass.g.matrixWorldNeedsUpdate = true; W.glass.g.updateMatrixWorld(true);
  W.apple.g.matrix.multiplyMatrices(W.wristR.g.matrixWorld, W.apple.hm); W.apple.g.matrixWorldNeedsUpdate = true; W.apple.g.updateMatrixWorld(true);
  const jl = new THREE.Vector3(0, W.jawLowRest, 0); W.jawLowW = jl.sub(R.pivots.get(W.jawG.parent)).applyMatrix4(W.jawG.parent.matrixWorld).y;
}
const d01 = (t) => s5(0.0, 0.4, t) * (1 - s5(HEAD.drinkHold, HEAD.drinkDown, t));   // the jaw slightly open while it drinks
function mouthW() { const R = W.rig; return W.mouthRest.clone().sub(R.pivots.get(W.jawG.parent)).applyMatrix4(W.jawG.parent.matrixWorld); }
function solvePoses() {
  const R = W.rig, out = {}, HL = W.handL, HR = W.handR;
  const glassAims = (H, up, palm) => [{ v: H.across, to: up.clone().negate(), w: 0.3 }, { v: H.n, to: palm, w: 0.01 }];   // the glass's axis is the hand's across
  // the glass at the lips: its rim's near edge on the lower teeth, tipped toward the face
  for (const [k, tilt, hd] of [['lips1', 1.15, -0.45 * s5(-0.5, 0.6, 0.0)], ['lips2', 1.85, -0.45]]) {
    bendSpine(R.seg, { lum: -0.04, tho: 0.06, cer: hd + 0.04 }); R.root.updateMatrixWorld(true); W.body.updateMatrixWorld(true);
    const m = mouthW(), u = new THREE.Vector3(0, Math.cos(tilt), -Math.sin(tilt)), v = new THREE.Vector3(0, -Math.sin(tilt), -Math.cos(tilt));
    const rimC = m.clone().addScaledVector(v, -GLASS.r), c = rimC.clone().addScaledVector(u, -(GLASS.h - GRIP));   // the grip, GRIP above the glass's base
    out[k] = solveHand(R, 'Left', HL, c, { dir: [0.3, 0.2, 0.9], twist: 0.4, elbow: 2.2 }, glassAims(HL, u, new THREE.Vector3(-0.7, 0, -0.7).normalize()));
  }
  bendSpine(R.seg, { lum: -0.04, tho: 0.06, cer: 0.04 }); R.root.updateMatrixWorld(true); W.body.updateMatrixWorld(true);
  // the glass down by its side, upright
  { const sh = new THREE.Vector3(); R.arms.Left.arm.getWorldPosition(sh); const c = sh.clone().add(new THREE.Vector3(-0.02, -0.42, 0.27));
    out.glassDown = solveHand(R, 'Left', HL, c, { dir: [0.05, -1, 0.2], twist: 0.3, elbow: 1.5 }, glassAims(HL, Y, new THREE.Vector3(-1, 0, 0))); }
  // the apple at the mouth, the apple down by its side
  { bendSpine(R.seg, { lum: -0.04, tho: 0.06, cer: -0.06 }); R.root.updateMatrixWorld(true); W.body.updateMatrixWorld(true);
    const m = mouthW(), c = m.clone().add(new THREE.Vector3(-0.006, -0.012, 0.045)), palm = new THREE.Vector3(0.2, 0.55, -0.8).normalize();
    out.appleUp = solveHand(R, 'Right', HR, c, { dir: [0.3, 0.1, 0.9], twist: -0.4, elbow: 2.2 }, [{ v: HR.n, to: palm, w: 0.06 }]);
    bendSpine(R.seg, { lum: -0.04, tho: 0.06, cer: 0.04 }); R.root.updateMatrixWorld(true); W.body.updateMatrixWorld(true); }
  { const sh = new THREE.Vector3(); R.arms.Right.arm.getWorldPosition(sh); const c = sh.clone().add(new THREE.Vector3(-0.08, -0.6, 0.1)), palm = new THREE.Vector3(1, 0.3, 0).normalize();
    out.appleDown = solveHand(R, 'Right', HR, c, { dir: [0.1, -1, 0.1], twist: 0.2, elbow: 0.4 }, [{ v: HR.n, to: palm, w: 0.06 }]); }
  return out;
}

// ------------------------------------------------------------------ the camera: one path, no cuts
let CAM = null;
function buildCam() {
  const B = V3(0, 0.26, W.lineZ);
  return camTrack([
    { t: -3.0, p: V3(-0.55, 1.75, 1.12), l: V3(-0.01, 1.66, 0.1), fov: 34 },
    { t: 0.0, p: V3(-0.54, 1.74, 1.1), l: V3(-0.01, 1.65, 0.1), fov: 34, tens: 0.5 },                     // the face, the glass, from its right front
    { t: 0.8, p: V3(-0.52, 1.32, 1.18), l: V3(0.0, 1.02, 0.07), fov: 34 },                                // down with the water, inside the ribs
    { t: 1.55, p: V3(-0.44, 0.72, 1.42), l: V3(0.0, 0.4, 0.06), fov: 34, stop: true },                     // into the bucket, already part full
    { t: 2.3, p: V3(-0.4, 0.74, 1.4), l: V3(0.0, 0.39, 0.06), fov: 34, stop: true },
    { t: 3.05, p: V3(P1.x + 0.06, 1.22, 1.12), l: V3(P1.x - 0.02, P1.top + 0.05, P1.z), fov: 32, stop: true },   // eight glasses (one gone); the coffee, its note
    { t: 4.9, p: V3(P1.x + 0.04, 1.2, 1.06), l: V3(P1.x - 0.02, P1.top + 0.05, P1.z + 0.02), fov: 32, stop: true },
    { t: 5.95, p: V3(P2.x + 0.04, 1.34, 1.02), l: V3(P2.x, P2.top + 0.15, P2.z + 0.1), fov: 32, stop: true },    // the drawers
    { t: 8.6, p: V3(P2.x + 0.02, 1.36, 0.92), l: V3(P2.x, P2.top + 0.15, P2.z + 0.12), fov: 32, stop: true },
    { t: 9.45, p: V3(P2.x + 0.08, 1.44, 0.66), l: V3(P2.x + 0.0825, P2.top + 0.12, P2.z + 0.24), fov: 32, stop: true },  // into the open drawer: nothing
    { t: 10.3, p: V3(P2.x + 0.08, 1.45, 0.64), l: V3(P2.x + 0.0825, P2.top + 0.12, P2.z + 0.25), fov: 32, stop: true },
    { t: 11.4, p: V3(P3.x + 0.02, 1.34, 1.62), l: V3(P3.x, P3.top + 0.08, P3.z), fov: 34, stop: true },        // the jugs
    { t: 19.9, p: V3(P3.x + 0.0, 1.32, 1.52), l: V3(P3.x, P3.top + 0.08, P3.z + 0.02), fov: 34, stop: true },
    { t: 20.9, p: V3(P3.x - 0.01, 1.2, 1.02), l: V3(P3.x - 0.01, P3.top + 0.17, P3.z - 0.06), fov: 32, stop: true },   // the fifth from food
    { t: 23.7, p: V3(P3.x - 0.01, 1.2, 0.98), l: V3(P3.x - 0.01, P3.top + 0.17, P3.z - 0.06), fov: 32, stop: true },
    { t: 24.6, p: V3(0.36, 1.74, 0.72), l: V3(-0.02, 1.66, 0.08), fov: 32, stop: true },                     // the bite, from its left front
    { t: 25.3, p: V3(0.37, 1.72, 0.74), l: V3(-0.02, 1.62, 0.08), fov: 32 },
    { t: 25.95, p: V3(0.16, 0.66, 1.25), l: V3(0.0, 0.34, 0.04), fov: 34, stop: true },                     // down with it, into the bucket
    { t: 26.55, p: V3(0.17, 0.68, 1.24), l: V3(0.0, 0.33, 0.04), fov: 34, stop: true },
    { t: 26.98, p: V3(0.4, 0.94, 1.02), l: V3(0.5, P1.top + 0.02, P1.z + 0.06), fov: 32 },
    { t: 27.4, p: V3(P1.x - 0.02, 1.02, 0.78), l: V3(P1.x - 0.03, P1.top + 0.03, P1.z + 0.14), fov: 30, stop: true },   // the note, corrected
    { t: 28.6, p: V3(P1.x - 0.02, 1.02, 0.76), l: V3(P1.x - 0.03, P1.top + 0.03, P1.z + 0.14), fov: 30, stop: true },
    { t: 29.5, p: V3(P4.x + 0.02, 1.34, 1.5), l: V3(P4.x, P4.top + 0.14, P4.z), fov: 34, stop: true },          // the tubes
    { t: 36.0, p: V3(P4.x + 0.0, 1.32, 1.42), l: V3(P4.x, P4.top + 0.14, P4.z), fov: 34, stop: true },
    { t: 37.2, p: V3(P5.x + 0.02, 1.2, 1.0), l: V3(P5.x, P5.top + 0.1, P5.z - 0.04), fov: 34, stop: true },     // a meal
    { t: 41.2, p: V3(P5.x + 0.0, 1.18, 0.96), l: V3(P5.x, P5.top + 0.1, P5.z - 0.04), fov: 34, stop: true },
    { t: 42.3, p: V3(P5.x + 0.04, 1.08, 0.58), l: V3(P5.x + 0.02, P5.top + 0.2, P5.z - 0.13), fov: 32, stop: true },   // the colour card
    { t: 45.6, p: V3(P5.x + 0.04, 1.08, 0.56), l: V3(P5.x + 0.02, P5.top + 0.2, P5.z - 0.13), fov: 32, stop: true },
    { t: 46.15, p: V3(P6.x - 0.4, 1.24, 1.12), l: V3(P6.x - 0.12, P6.top + 0.14, P6.z), fov: 34 },
    { t: 46.6, p: V3(P6.x - 0.06, 1.3, 1.26), l: V3(P6.x - 0.06, P6.top + 0.18, P6.z), fov: 34, stop: true },    // more, with reasons
    { t: 52.4, p: V3(P6.x - 0.06, 1.3, 1.2), l: V3(P6.x - 0.06, P6.top + 0.18, P6.z), fov: 34, stop: true },
    { t: 53.4, p: V3(P6.x + 0.03, 1.48, 0.72), l: V3(P6.x, P6.top + 0.41, P6.z), fov: 32, stop: true },          // too much: over the top
    { t: 54.6, p: V3(P6.x + 0.03, 1.48, 0.7), l: V3(P6.x, P6.top + 0.41, P6.z), fov: 32, stop: true },
    { t: 55.9, p: V3(P7.x + 0.02, 1.62, P7.z + 2.4), l: V3(P7.x, 1.6, P7.z), fov: 36, stop: true },           // the marathon: the banner, a hundred bibs
    { t: 60.6, p: V3(P7.x + 0.02, 1.6, P7.z + 2.3), l: V3(P7.x, 1.58, P7.z), fov: 36, stop: true },
    { t: 61.8, p: V3(P7.x + 0.05, 0.74, 1.05), l: V3(P7.x, 0.06, P7.z + 0.42), fov: 34, stop: true },           // the scale
    { t: 64.6, p: V3(P7.x + 0.05, 0.73, 1.02), l: V3(P7.x, 0.06, P7.z + 0.42), fov: 34, stop: true },
    { t: 65.9, p: V3(P8.x + 0.02, 1.12, 0.92), l: V3(P8.x, P8.top + 0.07, P8.z), fov: 32, stop: true },          // one glass
    { t: 71.6, p: V3(P8.x + 0.02, 1.1, 0.84), l: V3(P8.x, P8.top + 0.07, P8.z), fov: 32, stop: true },
    { t: 72.7, p: V3(P8.x + 0.01, P8.top + GLASS.h + 0.42, P8.z + 0.12), l: V3(P8.x, P8.top + GLASS.h, P8.z), fov: 30 },
    { t: T.logo, p: V3(P8.x, P8.top + GLASS.h + 0.32, P8.z + 0.004), l: V3(P8.x, P8.top + GLASS.h, P8.z), fov: 30, stop: true },   // straight down on the glass: the logo
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
W.lineHits = (x, z) => { const rc = new THREE.Raycaster(new THREE.Vector3(x, W.jawLowW - 0.01, z), new THREE.Vector3(0, -1, 0)); rc.far = 1.4;
  return rc.intersectObjects(W.meshes, false).slice(0, 4).map((h) => [h.object.userData.name, +h.point.y.toFixed(3)]); };
W.prepare = () => { if (!CAM) CAM = buildCam(); };
W.dbgAt = (t) => { poseBody(t); const f = (v) => v.toArray().map((x) => +x.toFixed(3)), H = W.handL, hw = H.handle.clone().applyMatrix4(W.wristL.g.matrixWorld);
  const gb = new THREE.Vector3().setFromMatrixPosition(W.glass.g.matrixWorld), up = new THREE.Vector3(0, 1, 0).transformDirection(W.glass.g.matrixWorld);
  const wr = new THREE.Vector3().setFromMatrixPosition(W.wristL.g.matrixWorld), el = new THREE.Vector3().setFromMatrixPosition(W.rig.arms.Left.elbow.matrixWorld);
  return { handle: f(hw), glassBase: f(gb), up: f(up), mouth: f(mouthW()), wrist: f(wr), elbow: f(el), pose: W.poses.lips1 }; };
function focusAt(S, t, P) { return Math.hypot(P.p[0] - P.l[0], P.p[1] - P.l[1], P.p[2] - P.l[2]); }

// ------------------------------------------------------------------ the water's moves: the drink falls through it; the bite too
const POUR = { on: 0.3, off: 2.25 };          // water leaves the mouth from here to here
const G9 = 9.81;
function streamAt(t) {   // the column: its head falls from the jaw; its tail follows when the pour stops
  const top = W.jawLowW - 0.004, surf = W.bucket.level + 0.004;
  if (t < POUR.on) return null;
  const yHead = Math.max(surf, top - 0.5 * G9 * (t - POUR.on) ** 2), yTail = t < POUR.off ? top : Math.max(surf, top - 0.5 * G9 * (t - POUR.off) ** 2);
  if (yTail <= surf + 0.001) return null;
  return { yTop: yTail, yBot: yHead, hits: yHead <= surf + 0.001 };
}
function splashes(B, t, x, z) {   // ripples and drops while the stream hits; one burst for the bite
  const hitOn = POUR.on + Math.sqrt(2 * (W.jawLowW - B.level) / G9), hitOff = POUR.off + Math.sqrt(2 * (W.jawLowW - B.level) / G9);
  const chunkT = BITE.shut + 0.2 + Math.sqrt(2 * (W.jawLowW - B.level) / G9);
  const events = []; for (let s = hitOn; s < hitOff; s += 0.22) events.push([s, 0.6]); events.push([chunkT, 1.0]);
  B.rips.forEach((m, i) => { let best = null; for (const [s, g] of events) { const u = (t - s) / 0.7; if (u >= 0 && u < 1 && (i % 3 === Math.round(s * 9) % 3 || g > 0.9)) if (!best || s > best[0]) best = [s, g, u]; }
    if (!best) { m.material.opacity = 0; return; } const [s, g, u] = best, r = 0.008 + 0.075 * Math.sqrt(u) * (0.7 + 0.3 * (i % 2));
    m.scale.setScalar(r); m.position.set(x - B.g.position.x, B.level + 0.0015, z - B.g.position.z); m.material.opacity = 0.35 * g * (1 - u) * (1 - u); });
  B.drops.forEach((d, i) => { let vis = false;
    for (const [s, g] of events) { const s2 = s + (i % 4) * 0.05, u = t - s2; if (u >= 0 && u < 0.32) { const a = hash(i * 3.7 + s2 * 11) * Math.PI * 2, sp = (0.25 + 0.35 * hash(i * 1.3 + s2)) * g, vy = (0.7 + 0.6 * hash(i * 5.1 + s2)) * g;
        d.position.set(Math.cos(a) * sp * u + (x - B.g.position.x), B.level + vy * u - 0.5 * G9 * u * u, Math.sin(a) * sp * u + (z - B.g.position.z)); vis = d.position.y > B.level; } }
    d.visible = vis; });
}

// ------------------------------------------------------------------ one moment of the film
function update(S, t) {
  const scene = S.scene, endDark = ss(T.factory - 0.5, T.logo - 0.3, t);
  poseBody(t);
  // ---- the glass it drinks from: fuller at the start, empty by the end of the pour
  W.glass.fill = lerp(0.62, 0.0, s5(POUR.on - 0.1, POUR.off, t)); levelGlass(W.glass);
  // ---- the bucket's level: a little higher after the drink, and after the bite
  const B = W.bucket; B.level = 0.125 + 0.006 * s5(POUR.on + 0.5, POUR.off + 0.6, t) + 0.0008 * ss(26.0, 26.3, t);
  B.surf.scale.setScalar(radAt(B.level) - 0.002); B.surf.position.y = B.level;
  const st = streamAt(t); if (st) setStream(W.stream, 0, W.lineZ, st.yTop, st.yBot, t, 1); else W.stream.m.visible = false;
  splashes(B, t, 0, W.lineZ);
  // ---- the apple: bitten when the jaw shuts; the piece drops through, into the bucket
  if (!W.bitten && t >= BITE.shut) { const inv = W.apple.g.matrixWorld.clone().invert(), m = mouthW(); const ac = new THREE.Vector3().setFromMatrixPosition(W.apple.g.matrixWorld); biteApple(W.apple, m.sub(ac).transformDirection(inv)); W.bitten = true; }
  if (W.bitten && t < BITE.shut) { W.apple.m.geometry = W.apple.geo; W.bitten = false; }
  { const t0 = BITE.shut + 0.2, u = t - t0, y = W.jawLowW - 0.5 * G9 * u * u; W.chunk.visible = u > 0 && y > B.level + 0.003;
    W.chunk.position.set(0.002, y, W.lineZ + 0.002); W.chunk.rotation.set(u * 9, u * 5, u * 3); }
  // ---- the tray glasses stay level; the drawer; the note
  for (const G of W.side.glasses) { G.g.updateMatrixWorld(true); levelGlass(G); }
  { const k = s5(T.looking - 0.1, T.looking + 0.8, t); W.drawers.open.position.z = P2.d / 2 + 0.2 * k; }
  { const k = s5(T.counts2 - 0.25, T.counts2 + 0.2, t); W.side.strike.scale.x = Math.max(0.001, k); }
  // ---- the jugs: 2.0 L and 2.5 L; the drinks and food light; the fifth from food
  { const K = W.kit, fw = s5(T.two - 0.2, T.women + 0.3, t), fm = s5(T.twoHalf - 0.2, T.men + 0.3, t), fo = s5(T.supplied - 0.4, T.twenty + 0.5, t);
    setJug(K.women, 2000 * fw, 0.2, fo); setJug(K.men, 2500 * fm, 0.2, fo);
    const lit = [T.every - 0.05, T.every + 0.12, T.every + 0.29, T.drink + 0.05, T.inFood + 0.2];
    K.items.forEach((it, i) => { const k = pulse(t, lit[i], 20.6, 0.3); it.position.y = P3.top + 0.012 * outBack(clamp01((t - lit[i]) / 0.35), 2.5) * (t < 20.6 ? 1 : 1 - ss(20.6, 21.0, t)); void k; });
    for (const G of [K.waterG, K.milk]) { G.g.updateMatrixWorld(true); levelGlass(G); } }
  // ---- the tubes: water and coffee alike; tea and cola alike; milk more
  { const lv = [s5(T.hydrated - 0.2, T.asWater + 0.2, t) * 0.6, s5(T.hydrated - 0.2, T.asWater + 0.2, t) * 0.6, s5(T.tea - 0.15, T.tea + 0.45, t) * 0.6, s5(T.cola - 0.15, T.cola + 0.45, t) * 0.6, s5(T.milk, T.moreIn + 0.3, t) * 0.86];
    W.tubes.out.forEach((o, i) => { const h = Math.max(0.0005, TUBE_H(lv[i]) * (lv[i] > 0.001 ? 1 : 0)); o.liq.scale.y = h; o.liq.position.y = h / 2; o.liq.visible = lv[i] > 0.001; });
    W.tubes.line.position.y = P4.top + 0.02 + TUBE_H(0.6); W.tubes.line.material.opacity = 0.75 * pulse(t, T.asWater, 36.6, 0.4); }
  // ---- the colour card
  { const k = s5(T.pale - 0.1, T.yellow + 0.2, t); W.meal.ring.material.opacity = k; W.meal.tick.material.opacity = s5(T.yellow, T.yellow + 0.35, t); }
  // ---- the cylinder: a notch for each reason; then too much, over the top
  { const C = W.cyl, reasons = [T.heat, T.long, T.ill, T.pregnant], up = reasons.reduce((a, r) => a + 0.075 * s5(r - 0.05, r + 0.45, t), 0), over = s5(T.overdoing - 0.2, T.dangerous + 0.6, t);
    const frac = Math.min(1, 0.5 + up + 0.4 * over), h = Math.max(0.001, frac * CYL.h); C.water.scale.y = h; C.water.position.y = P6.top + 0.015 + h / 2;
    C.tags.forEach((m, i) => { m.material.opacity = s5(reasons[i] - 0.1, reasons[i] + 0.25, t) * (1 - ss(55.0, 55.6, t)); });
    const spill = clamp01((0.5 + up + 0.4 * over - 1.0) / 0.08), sp = spill;
    C.sheet.material.opacity = 0.25 * spill; C.sheet.scale.y = CYL.h * spill; C.sheet.position.y = P6.top + 0.015 + CYL.h - CYL.h * spill / 2;
    C.dome.material.opacity = 0.7 * clamp01(spill * 3); C.dome.position.y = P6.top + 0.015 + CYL.h - 0.002;
    const top = P6.top + 0.015 + CYL.h + 0.004, run = ss(0, 1, spill);
    C.runs.forEach((R2, i) => { const a = [-0.55, 0.05, 0.6][i], d = clamp01(spill * 1.6 - i * 0.25), yb = lerp(top, P6.top + 0.002, d);
      setStream(R2, P6.x + Math.sin(a) * (CYL.r + 0.003), P6.z + Math.cos(a) * (CYL.r + 0.003), top, yb, t + i, 0.55 * run); });
    C.pool.material.opacity = 0.6 * ss(T.dangerous - 0.2, T.dangerous + 0.6, t) * spill; C.pool.scale.setScalar(0.05 + 0.07 * ss(T.dangerous - 0.2, T.dangerous + 1.4, t)); void sp; }
  // ---- the marathon: thirteen of a hundred bibs turn red; the scale's needle swings up
  { const M = W.mara, k0 = T.thirteen - 0.1; M.bibs.forEach((b) => { if (!b.red) return; const on = t > k0 + b.rank * 0.045; const want = on ? b.redMap : null;
      if (on && b.m.material.map !== b.redMap) { b.base = b.base || b.m.material.map; b.m.material.map = b.redMap; b.m.material.needsUpdate = true; }
      if (!on && b.base && b.m.material.map !== b.base) { b.m.material.map = b.base; b.m.material.needsUpdate = true; } void want; });
    M.needle.rotation.y = -(-0.6 + 1.0 * s5(T.gaining - 0.1, T.weight + 0.5, t)) + 0.02 * Math.sin(t * 9) * pulse(t, T.gaining, T.race, 0.3); }
  // ---- the last glass: the logo on its rim
  { const L = W.last; L.G.g.updateMatrixWorld(true); levelGlass(L.G);
    const lk = s5(T.back + 0.3, T.logo - 0.25, t); L.logo.set({ weight: lk, white: lk, hours: 0, hand: ss(T.logo - 0.4, T.logo - 0.15, t), handScale: outBack(clamp01((t - (T.logo - 0.4)) / 0.35), 1.8) }); }
  // ---- light
  const fig = 1 - endDark;
  W.key.intensity = 11 * fig; W.rim.intensity = 4 * fig; W.fill.intensity = 1.0 * fig;
  W.bucketLight.intensity = 3.5 * fig;
  for (const L of [W.l1, W.l2, W.l3, W.l4, W.l5, W.l6, W.l7, W.l7b]) L.intensity = 8 * fig;
  W.l8.intensity = 8 * (1 - 0.6 * endDark);
  S.tableMat.color.setScalar(0.3 * (1 - endDark * 0.9)); scene.environmentIntensity = 0.12 * (1 - endDark * 0.7); S.reflAmt = 0.5 * (1 - endDark);
}

// ------------------------------------------------------------------ the words on screen
const CAPS = [
  { t0: 0.35, t1: 1.3, top: 300, size: 100, html: '<em>Water.</em>' },
  { t0: 1.5, t1: 4.9, top: 292, size: 78, html: 'Eight glasses a day, and<br><em>coffee doesn&rsquo;t count</em>' },
  { t0: 5.17, t1: 8.6, top: 292, size: 76, html: 'A review went looking<br>for the study behind<br>that rule' },
  { t0: 8.94, t1: 10.4, top: 300, size: 92, html: 'It found <em>none.</em>' },
  { t0: 10.75, t1: 16.4, top: 292, size: 72, html: 'Europe&rsquo;s food safety<br>experts say <em>2 litres</em> a day<br>for women, <em>2.5</em> for men' },
  { t0: 16.63, t1: 19.9, top: 292, size: 76, html: 'That counts every drink,<br>and the <em>water in food</em>' },
  { t0: 20.5, t1: 24.3, top: 292, size: 74, html: 'In US data, food supplied<br><em>about 20%</em>' },
  { t0: 24.66, t1: 26.6, top: 300, size: 86, html: 'You eat some<br>of your <em>water.</em>' },
  { t0: 27.04, t1: 28.4, top: 300, size: 96, html: 'Coffee <em>counts.</em>' },
  { t0: 28.62, t1: 32.0, top: 292, size: 80, html: 'In trials, it hydrated<br>as well as <em>water</em>' },
  { t0: 32.26, t1: 34.25, top: 300, size: 86, html: 'So did tea and cola.' },
  { t0: 34.4, t1: 36.3, top: 300, size: 90, html: 'Milk kept <em>more in.</em>' },
  { t0: 36.54, t1: 41.3, top: 292, size: 72, html: 'Most healthy people<br>get enough by drinking<br>when thirsty, and<br><em>with meals</em>' },
  { t0: 41.74, t1: 45.6, top: 292, size: 74, html: 'The NHS check: pee that&rsquo;s<br>a <em>clear pale yellow</em>' },
  { t0: 46.14, t1: 52.2, top: 292, size: 70, html: 'You may need more in heat,<br>during long exercise,<br>when ill, pregnant<br>or breastfeeding' },
  { t0: 52.7, t1: 54.9, top: 300, size: 86, html: 'But overdoing it<br>is <em>dangerous.</em>' },
  { t0: 55.21, t1: 61.1, top: 292, size: 70, html: 'At one marathon, <em>13%</em> of<br>runners tested at the finish<br>had low blood sodium' },
  { t0: 61.33, t1: 64.8, top: 292, size: 76, html: 'linked to <em>gaining weight</em><br>during the race' },
  { t0: 65.45, t1: 67.8, top: 292, size: 84, html: 'Drinking far too much<br>can kill.' },
  { t0: 67.96, t1: 71.3, top: 292, size: 76, html: 'If you&rsquo;re ill, ask your<br>doctor how much to drink.' },
  { t0: 72.0, t1: 99, top: 360, size: 96, html: 'Back to<br><em>factory settings.</em>' },
];
const OVL = {};
function overlayInit(S) {
  const O = S.O, tag = (cls, txt2, size, bsize) => { const e = O.tag(cls, txt2); e.style.fontSize = size + 'px'; const b = e.querySelector('b'); if (b && bsize) b.style.fontSize = bsize + 'px'; return e; };
  OVL.m = tag('tag', 'Boston Marathon, 488 runners tested at the finish<b>13% had low blood sodium</b>', 22, 34);
  OVL.food = tag('tag', 'Water from food<b>about 20%</b>', 22, 38);
}
function overlay(S, t) {
  place(S, OVL.m, new THREE.Vector3(P7.x, P7.y - P7.h / 2 + 0.06, P7.z + 0.02), -250, 0, pulse(t, T.thirteen + 0.3, 61.0));
  place(S, OVL.food, new THREE.Vector3(P3.x - 0.005, P3.top + 0.01 + jugH(2000) * 0.9, P3.z - 0.07), -120, -10, pulse(t, T.supplied + 0.15, 24.0, 0.4));
  const c = new THREE.Vector3(P8.x, P8.top + GLASS.h + 0.0012, P8.z);
  logoEnd(S, t, { t0: T.logo, center: c, edge: c.clone().add(new THREE.Vector3(0, 0, LOGO_R)) });
}

makeFilm({
  T, caps: CAPS, subs: [], build, update, pose: camPose, overlay, overlayInit, focus: focusAt,
  stage: { bg: 0x07080a, reflSize: 7, env: 0.12, far: 30 },
  aperture: [[0, 0.004], [3.0, 0.003], [11.4, 0.003], [24.6, 0.004], [29.5, 0.003], [42.3, 0.004], [55.9, 0.003], [65.9, 0.004], [72.7, 0.003]],
  bloom: [[0, 0.5], [72, 0.55]],
});

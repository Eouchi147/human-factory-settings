// Human Factory Settings · Film 16 "How much water do you need?" (new direction, 7 Oct 2026) · one continuous shot, 9:16.
// A ring of stations round a dark room; the camera goes once round it. In a pram, swaddled, a giant water bottle in a knitted
// bonnet (the newborn); the lights come up on the skeleton beside it, its hand on the handle. It forces down a glass of water
// and the water falls straight through it, into a bucket between its feet (the camera follows the water down, under the
// deep shade behind the words). A tray of eight glasses, one gone. A card drawer, "8 glasses a day: the science", slides open:
// empty. A gauge on a stand: THIRST, its water falling to DRINK. A meal with a glass. Two jugs fill to Europe's figures,
// 2 litres and 2.5; every drink and the food hop up; a sticky note slapped on the coffee, DOESN'T COUNT, is struck out. Two
// tubes, water and coffee, fill alike. A colour card: clear pale yellow. A cylinder rises with heat, long exercise, illness,
// pregnancy, then overflows. A marathon board: 13 of 100 bibs turn red; a scale's needle swings up. One glass on its own
// table, which seen from above becomes the logo. The factory stamp is on the sternum.
import { THREE, ss, s5, lerp, clamp01, hash, camTrack, phys, shadows, spot, RoundedBoxGeometry, glowSprite,
  loadAnatomy, V3, place, logoEnd, makeFilm, outBack, stamp, stampCanvas, stampSpot, noiseTex } from '../kit.js';
import { buildRig, skeletonKind, bendSpine, poseArm, legIK, worldVerts, avgV } from '../rig.js';
import { makeCup, makeLogoRing } from '../props.js';

//@HANDS@

// ------------------------------------------------------------------ timing, from the voice guide (word starts)
const T = {
  end: 78.04, logo: 75.52,
  you: 0.35, carry: 0.8, giant: 1.24, bottle: 1.86, newborn: 3.33, forcing: 3.54, down: 4.33, eight: 4.79, glasses: 5.13, day: 5.97, because: 6.05, someone: 6.68, so: 7.33,
  lets: 8.19, check: 8.71,
  review: 10.11, looking: 11.09, science: 11.59, eight2: 12.49, water2: 13.36, found: 14.85, none: 15.4,
  your: 16.39, built: 17.44, gauge: 18.15, called: 18.54, thirst: 18.85, most: 19.72, enough: 21.17, drinking: 21.78, thirsty: 22.48, meals: 23.53,
  europe: 24.82, authority: 26.04, two: 27.09, litres: 27.37, women: 28.67, two2: 29.29, half: 30.03, men: 30.17, counting: 30.51, every: 31.05, drink: 31.37, water3: 32.17, inFood: 32.59,
  coffee: 34.13, tea: 34.94, count: 35.1, trial: 36.12, four: 36.44, cups: 36.71, hydrated: 38.14, regular: 39.05, men2: 40.64, asWell: 41.43, water4: 41.81,
  check2: 43.11, pee: 43.77, clear: 44.61, pale: 44.81, yellow: 45.26, drinkMore: 45.89, heat: 46.81, long: 47.69, exercise: 47.98, ill: 49.81, pregnant: 50.04, breastfeeding: 51.06,
  but: 52.6, more: 52.99, isnt: 53.3, better: 53.6, marathon: 54.2, thirteen: 54.99, runners: 56.22, finish: 57.47, salt: 58.73, linked: 59.88, gained: 62.01, weight: 62.51,
  drinking2: 63.32, deadly: 65.06,
  so2: 66.23, thirst2: 67.17, doctor: 67.96, follow: 70.06, advice: 70.57, video: 71.89,
  final: 73.25, factory: 74.46, settings: 74.83,
};

// ------------------------------------------------------------------ the set: a ring of stations (metres, floor at y = 0), each facing the ring's centre.
// Station 0 is the skeleton (at the origin, facing +z, toward the centre); the rest follow round the ring in the order the film visits them.
const W = {}; window.HFS_W = W;
const X = new THREE.Vector3(1, 0, 0), Y = new THREE.Vector3(0, 1, 0), Z = new THREE.Vector3(0, 0, 1);
const RING = { cz: 2.2, r: 2.2, n: 11 };
const SK = 0, ST_TRAY = 1, ST_DRAW = 2, ST_GAUGE = 3, ST_MEAL = 4, ST_JUGS = 5, ST_TUBES = 6, ST_CARD = 7, ST_CYL = 8, ST_MARA = 9, ST_LAST = 10;
const ringTheta = (k) => (k / RING.n) * Math.PI * 2;
function ringPos(k) { const a = ringTheta(k); return new THREE.Vector3(RING.r * Math.sin(a), 0, RING.cz - RING.r * Math.cos(a)); }
function RW(k, p) { const a = ringTheta(k), c = Math.cos(a), s = Math.sin(a), o = ringPos(k); return [o.x + p[0] * c - p[2] * s, p[1], o.z + p[0] * s + p[2] * c]; }   // a point in station k's frame, in the world
function onRing(g, k) { g.position.copy(ringPos(k)); g.rotation.y = -ringTheta(k); }
const TRAY = { r: 0.25, top: 0.8 };
const DRAW = { top: 0.92, w: 0.34, h: 0.26, d: 0.3 };
const COUNTER = { w: 0.92, d: 0.44, top: 0.86 };
const TUBEC = { w: 0.4, d: 0.32, top: 0.86 };
const MEALT = { w: 0.56, d: 0.4, top: 0.74 };
const CYLP = { top: 0.9 };
const MARA = { z: -0.05, y: 1.3, w: 0.9, h: 0.88 }, MARA_S = 0.72;
const LASTT = { r: 0.2, top: 0.78 };
const PRAM = { x: -0.49, z: 0.83 };   // to its right and a little ahead: the handle bar just in front of its right hip
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
// big clear vessels (the jugs, the tubes): a dark body colour, so the station lamps do not turn the glass milky grey; it reads by its edges
// (its own copy of the room's reflections, so its envMapIntensity counts: three uses the scene's intensity for materials without one)
const clearM = (op = 0.14) => new THREE.MeshPhysicalMaterial({ color: 0x3a4048, roughness: 0.05, metalness: 0, transparent: true, opacity: op, clearcoat: 1, clearcoatRoughness: 0.03, side: THREE.DoubleSide, depthWrite: false, envMap: W.env || null, envMapIntensity: 2.6 });
const glassM = () => new THREE.MeshPhysicalMaterial({ color: 0xeef4ff, roughness: 0.03, metalness: 0, transparent: true, opacity: 0.06, clearcoat: 1, clearcoatRoughness: 0.02, side: THREE.DoubleSide, depthWrite: false, envMapIntensity: 0.9 });
function label(w, h, draw, opts = {}) {   // a flat card with canvas print
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: canvasTex(Math.round(w * 4000), Math.round(h * 4000), draw), transparent: true, depthWrite: false, ...opts }));
}
function printed(w, h, draw, opts = {}) {   // a lit card (takes the light)
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), phys({ map: canvasTex(Math.round(w * 4000), Math.round(h * 4000), draw), roughness: 0.6, transparent: true, ...opts }));
}
const finish = (g) => { shadows(g); g.traverse((o) => o.layers.enable(1)); return g; };

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
  const smp = []; for (let k = 0; k < 900; k++) { const a = hash(k * 1.7) * Math.PI * 2, rr = Math.sqrt(hash(k * 3.1 + 2)), y = hash(k * 5.3 + 7);
    const rad = lerp(r * 0.84, r * 0.955, y); smp.push(new THREE.Vector3(Math.cos(a) * rr * rad, 0.009 + y * wh, Math.sin(a) * rr * rad)); }
  g.traverse((o) => o.layers.enable(1));
  return { g, water, wm, fill, smp, ys: new Float32Array(smp.length) };
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
  for (let j = 0; j <= NY; j++) { const u = j / NY, y = lerp(yTop, yBot, u), fall = Math.max(0, yTop - y), rr = (0.004 / Math.sqrt(1 + fall * 1.8)) * on;
    const wob = y < 1.0 && y > 0.85 ? 0.3 : 1, wx = (0.0003 * Math.sin(y * 31 - t * 21) + 0.00015 * Math.sin(y * 77 + t * 13)) * wob, wz = 0.0003 * Math.cos(y * 27 - t * 17) * wob;
    for (let i = 0; i <= NR; i++) { const a = (i / NR) * Math.PI * 2, k = (j * (NR + 1) + i) * 3; p[k] = x + wx + Math.cos(a) * rr; p[k + 1] = y; p[k + 2] = z + wz + Math.sin(a) * rr; } }
  S2.geo.attributes.position.needsUpdate = true; S2.geo.computeVertexNormals();
}

// ------------------------------------------------------------------ the pram, and in it the newborn: a giant water bottle, swaddled, in a knitted bonnet
function knitTex(base, stripe) {   // knitted: rows of little vees, with a stripe
  return canvasTex(256, 256, (x, w, h) => { x.fillStyle = base; x.fillRect(0, 0, w, h);
    for (let j = 0; j < 16; j++) for (let i = 0; i < 16; i++) { x.strokeStyle = (j % 6 === 3) ? stripe : 'rgba(0,0,0,0.12)'; x.lineWidth = (j % 6 === 3) ? 6 : 2; x.beginPath(); x.moveTo(i * 16, j * 16); x.lineTo(i * 16 + 8, j * 16 + 12); x.lineTo(i * 16 + 16, j * 16); x.stroke(); } });
}
function makePram(scene) {
  const g = new THREE.Group(); g.position.set(PRAM.x, 0, PRAM.z); scene.add(g);
  const navy = phys({ color: 0x23304d, roughness: 0.55, clearcoat: 0.3, side: THREE.DoubleSide }), lining = phys({ color: 0xe8e2d4, roughness: 0.85 }), chrome = phys({ color: 0xc9cdd3, metalness: 1, roughness: 0.22 }), tyre = phys({ color: 0x141518, roughness: 0.7 });
  const BW = 0.36, BL = 0.74, BH = 0.22, B0 = 0.5;   // the bassinet: width, length, depth, bottom height
  const panel = (w, h, d, x, y, z, m = navy) => { const p = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, Math.min(0.006, w / 2.1, h / 2.1, d / 2.1)), m); p.position.set(x, y, z); g.add(p); return p; };
  panel(BW, 0.02, BL, 0, B0 + 0.01, 0);
  for (const s of [-1, 1]) panel(0.018, BH, BL, s * (BW / 2 - 0.009), B0 + BH / 2, 0);
  panel(BW, BH, 0.018, 0, B0 + BH / 2, -BL / 2 + 0.009); panel(BW, BH, 0.018, 0, B0 + BH / 2, BL / 2 - 0.009);
  panel(BW - 0.04, 0.012, BL - 0.04, 0, B0 + 0.026, 0, lining);
  const trimM = phys({ color: 0xd9dce1, roughness: 0.4 });   // a soft rim round the top edge
  for (const s of [-1, 1]) { const r1 = new THREE.Mesh(new RoundedBoxGeometry(0.026, 0.016, BL + 0.012, 3, 0.007), trimM); r1.position.set(s * (BW / 2 - 0.004), B0 + BH, 0); g.add(r1);
    const r2 = new THREE.Mesh(new RoundedBoxGeometry(BW + 0.012, 0.016, 0.026, 3, 0.007), trimM); r2.position.set(0, B0 + BH, s * (BL / 2 - 0.004)); g.add(r2); }
  // the hood, at the back over the head end
  const hood = new THREE.Mesh(new THREE.SphereGeometry(0.2, 48, 20, Math.PI, Math.PI, 0, Math.PI / 2), navy); hood.scale.set(BW / 0.4, 0.8, 0.75); hood.position.set(0, B0 + BH, -BL / 2 + 0.15); g.add(hood);   // folded half back, behind the head
  // the wheels, the chassis, the handle
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    const wg = new THREE.Group(); wg.position.set(sx * (BW / 2 + 0.03), 0.1, sz * (BL / 2 - 0.1)); g.add(wg);
    const tire = new THREE.Mesh(new THREE.TorusGeometry(0.088, 0.012, 14, 48), tyre); tire.rotation.y = Math.PI / 2; wg.add(tire);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.03, 24), chrome); hub.rotation.z = Math.PI / 2; wg.add(hub);
    for (let k = 0; k < 8; k++) { const sp = new THREE.Mesh(new THREE.CylinderGeometry(0.0022, 0.0022, 0.16, 6), chrome); sp.rotation.x = (k / 8) * Math.PI; wg.add(sp); }
    const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, B0 - 0.1, 12), chrome); strut.position.set(sx * (BW / 2 + 0.03), 0.1 + (B0 - 0.1) / 2, sz * (BL / 2 - 0.1)); g.add(strut);
  }
  for (const s of [-1, 1]) { const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, BL - 0.2, 12), chrome); rail.rotation.x = Math.PI / 2; rail.position.set(s * (BW / 2 + 0.03), 0.22, 0); g.add(rail); }
  const HB = { y: 0.95, z: -BL / 2 - 0.24 }; W.pramHandle = { y: HB.y, z: HB.z, w: BW + 0.06 };
  for (const s of [-1, 1]) { const a = new THREE.Vector3(s * (BW / 2 + 0.01), B0 + 0.06, -BL / 2 + 0.03), b = new THREE.Vector3(s * (BW / 2 + 0.03), HB.y, HB.z), d = b.clone().sub(a);
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, d.length(), 12), chrome); tube.position.copy(a).add(b).multiplyScalar(0.5); tube.quaternion.setFromUnitVectors(Y, d.normalize()); g.add(tube); }
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, BW + 0.06, 24), phys({ color: 0x1b1c20, roughness: 0.75 })); bar.rotation.z = Math.PI / 2; bar.position.set(0, HB.y, HB.z); g.add(bar);
  // the newborn: a giant bottle, lying with its cap under the hood; a blanket to the shoulders; a bonnet with a bobble
  const baby = new THREE.Group(); baby.position.set(0, B0 + 0.032 + 0.2, -0.02); baby.rotation.x = 0.6; g.add(baby);   // sitting up against the hood, like a baby propped on a pillow
  const pet = new THREE.MeshPhysicalMaterial({ color: 0xb9d6f3, roughness: 0.08, transparent: true, opacity: 0.82, clearcoat: 1, side: THREE.DoubleSide });   // water in clear plastic: read as one blue-white body
  const prof = [[0.0001, -0.26], [0.052, -0.26], [0.06, -0.25], [0.062, -0.2], [0.058, -0.17], [0.062, -0.14], [0.062, 0.1], [0.055, 0.15], [0.03, 0.2], [0.021, 0.215], [0.021, 0.23], [0.0001, 0.23]];
  const bot = new THREE.Mesh(new THREE.LatheGeometry(prof.map(([x, y]) => new THREE.Vector2(x, y)), 64), pet); bot.rotation.x = -Math.PI / 2; bot.renderOrder = 3; baby.add(bot);   // its cap end toward -z (the hood)
  const labelBand = new THREE.Mesh(new THREE.CylinderGeometry(0.0625, 0.0625, 0.09, 64, 1, true), phys({ color: 0x2f6fbf, roughness: 0.4, side: THREE.DoubleSide })); labelBand.rotation.x = Math.PI / 2; labelBand.position.z = 0.02; baby.add(labelBand);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.026, 32), phys({ color: 0x2f6fbf, roughness: 0.35 })); cap.rotation.x = Math.PI / 2; cap.position.z = -0.235; baby.add(cap);
  const wool = phys({ color: 0xf3e9c9, roughness: 0.95, map: knitTex('#f2e6c2', '#9cc3e6') });
  const bonnet = new THREE.Mesh(new THREE.SphereGeometry(0.052, 40, 20, 0, Math.PI * 2, 0, Math.PI * 0.62), wool); bonnet.rotation.x = -Math.PI / 2; bonnet.position.z = -0.215; baby.add(bonnet);
  const brim = new THREE.Mesh(new THREE.TorusGeometry(0.044, 0.008, 12, 40), wool); brim.position.z = -0.2; baby.add(brim);
  const bobble = new THREE.Mesh(new THREE.SphereGeometry(0.02, 20, 14), phys({ color: 0x9cc3e6, roughness: 1, map: knitTex('#9cc3e6', '#f2e6c2') })); bobble.position.z = -0.272; baby.add(bobble);
  const blanket = new THREE.Mesh(new RoundedBoxGeometry(0.21, 0.17, 0.25, 4, 0.06), phys({ color: 0x7fa6cc, roughness: 0.95, map: knitTex('#7ea4c9', '#e9dfbf') })); blanket.position.set(0, 0.004, 0.15); baby.add(blanket);   // swaddled to the waist
  // a dummy: the newborn's
  const dummy = new THREE.Group(); dummy.position.set(0, 0.062, -0.12); baby.add(dummy);
  const shield = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.007, 40), phys({ color: 0x9cc3e6, roughness: 0.3, clearcoat: 0.8 })); shield.scale.z = 0.72; dummy.add(shield);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.009, 20, 12), phys({ color: 0xf3f1ea, roughness: 0.3 })); knob.position.y = 0.006; dummy.add(knob);
  const loop = new THREE.Mesh(new THREE.TorusGeometry(0.018, 0.0035, 10, 32), phys({ color: 0xf3f1ea, roughness: 0.3 })); loop.position.y = 0.016; loop.rotation.x = 0.35; dummy.add(loop);
  finish(g);
  return { g, baby, BW, BL, B0, BH };
}

// ------------------------------------------------------------------ the tray of eight (one gone)
function makeTray(scene) {
  const g = new THREE.Group(); onRing(g, ST_TRAY); scene.add(g);
  const wood = woodM(), top = new THREE.Mesh(new THREE.CylinderGeometry(TRAY.r, TRAY.r, 0.025, 72), wood); top.position.y = TRAY.top - 0.0125; g.add(top);
  const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.028, TRAY.top - 0.025, 20), black()); leg.position.y = (TRAY.top - 0.025) / 2; g.add(leg);
  const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.17, 0.02, 48), black()); foot.position.y = 0.01; g.add(foot);
  const tray = new THREE.Mesh(new RoundedBoxGeometry(0.34, 0.012, 0.17, 3, 0.005), phys({ color: 0x2b2d31, metalness: 0.8, roughness: 0.35 })); tray.position.set(0, TRAY.top + 0.006, 0); g.add(tray);
  const glasses = [];
  for (let k = 0; k < 8; k++) { const i = k % 4, j = Math.floor(k / 4); if (k === 3) continue;   // the empty place: the glass it drinks
    const G = makeGlass(0.82); G.g.position.set(-0.12 + i * 0.08, TRAY.top + 0.012, -0.04 + j * 0.08); g.add(G.g); glasses.push(G); }
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.029, 0.033, 48), new THREE.MeshBasicMaterial({ color: 0x8e96a3, transparent: true, opacity: 0.25, depthWrite: false })); ring.rotation.x = -Math.PI / 2; ring.position.set(-0.12 + 3 * 0.08, TRAY.top + 0.0125, -0.04); g.add(ring);
  shadows(g); g.traverse((o) => o.layers.enable(1));
  return { g, glasses };
}

// ------------------------------------------------------------------ the card drawers: one labelled "8 glasses a day: the science"
function makeDrawers(scene) {
  const g = new THREE.Group(); onRing(g, ST_DRAW); scene.add(g);
  const wood = woodM(), dark = phys({ color: 0xcfc6b4, roughness: 0.75 }), brass = phys({ color: 0xb58f55, metalness: 1, roughness: 0.3 });
  const stand = new THREE.Mesh(new RoundedBoxGeometry(0.3, DRAW.top, 0.26, 3, 0.008), black()); stand.position.y = DRAW.top / 2; g.add(stand);
  const cab = new THREE.Mesh(new RoundedBoxGeometry(DRAW.w, DRAW.h, DRAW.d, 3, 0.006), wood); cab.position.y = DRAW.top + DRAW.h / 2; g.add(cab);
  const cw = (DRAW.w - 0.03) / 2, ch = (DRAW.h - 0.03) / 2;
  let open = null;
  for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) {
    const d = new THREE.Group(); d.position.set(-DRAW.w / 2 + 0.01 + cw / 2 + i * (cw + 0.01), DRAW.top + DRAW.h - 0.01 - ch / 2 - j * (ch + 0.01), DRAW.d / 2); g.add(d);
    const face = new THREE.Mesh(new RoundedBoxGeometry(cw, ch, 0.014, 2, 0.003), wood); face.position.z = 0.007; d.add(face);
    const holder = new THREE.Mesh(new THREE.BoxGeometry(0.118, 0.042, 0.002), brass); holder.position.set(0, 0.02, 0.0145); d.add(holder);
    const pull = new THREE.Mesh(new THREE.TorusGeometry(0.009, 0.0022, 8, 24, Math.PI), brass); pull.position.set(0, -0.015, 0.016); pull.rotation.z = Math.PI; d.add(pull);
    const isIt = j === 0 && i === 1;
    const card = printed(0.108, 0.034, (x, w, h) => { x.fillStyle = '#efe9dc'; x.fillRect(0, 0, w, h); if (isIt) { txt(x, '8 GLASSES A DAY', w / 2, h * 0.34, { font: '700 46px "Geist Mono"', color: '#22242a', maxW: w * 0.9 }); txt(x, 'THE SCIENCE', w / 2, h * 0.74, { font: '800 46px "Geist Mono"', color: '#22242a', maxW: w * 0.9 }); }
      else { x.fillStyle = 'rgba(30,30,34,0.35)'; x.fillRect(w * 0.15, h * 0.42, w * 0.7, h * 0.16); } });
    card.position.set(0, 0.02, 0.0158); d.add(card);
    if (isIt) {   // the drawer itself: a tray behind the face, empty
      const box = new THREE.Group(); box.position.z = -0.0005; d.add(box);
      const bt = new THREE.Mesh(new THREE.BoxGeometry(cw - 0.012, 0.004, DRAW.d - 0.03), dark); bt.position.set(0, -ch / 2 + 0.008, -(DRAW.d - 0.03) / 2); box.add(bt);
      for (const s of [-1, 1]) { const sd = new THREE.Mesh(new THREE.BoxGeometry(0.004, ch - 0.02, DRAW.d - 0.03), dark); sd.position.set(s * (cw / 2 - 0.008), 0, -(DRAW.d - 0.03) / 2); box.add(sd); }
      const bk = new THREE.Mesh(new THREE.BoxGeometry(cw - 0.012, ch - 0.02, 0.004), dark); bk.position.set(0, 0, -(DRAW.d - 0.03)); box.add(bk);
      const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.0025, 0.0025, DRAW.d - 0.04, 12), brass); rod.rotation.x = Math.PI / 2; rod.position.set(0, -ch / 2 + 0.02, -(DRAW.d - 0.03) / 2); box.add(rod);
      const hole = new THREE.Mesh(new THREE.PlaneGeometry(cw - 0.004, ch - 0.004), new THREE.MeshBasicMaterial({ color: 0x050505 })); hole.position.copy(d.position).setZ(DRAW.d / 2 - 0.002); g.add(hole);
      open = d;
    }
  }
  shadows(g); g.traverse((o) => o.layers.enable(1));
  return { g, open };
}

// ------------------------------------------------------------------ the thirst gauge: a sight glass on a plate, its water falling to DRINK
function makeThirst(scene) {
  const g = new THREE.Group(); onRing(g, ST_GAUGE); scene.add(g);
  const ped = new THREE.Mesh(new RoundedBoxGeometry(0.26, 0.9, 0.22, 3, 0.01), black()); ped.position.y = 0.45; g.add(ped);
  const plate = new THREE.Mesh(new RoundedBoxGeometry(0.2, 0.6, 0.022, 3, 0.008), phys({ color: 0x1d2a3f, roughness: 0.5, clearcoat: 0.4 })); plate.position.set(0, 0.9 + 0.31, -0.05); g.add(plate);
  const brass = phys({ color: 0xb8925a, metalness: 1, roughness: 0.28 });
  const G0 = 0.9 + 0.08, GH = 0.44;   // the tube's bottom and height
  for (const y of [G0 - 0.02, G0 + GH + 0.02]) { const f = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.04, 32), brass); f.position.set(0, y, 0.01); g.add(f);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.02, 0.06), brass); arm.position.set(0, y, -0.02); g.add(arm); }
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, GH, 40, 1, true), glassM()); tube.material.opacity = 0.1; tube.position.set(0, G0 + GH / 2, 0.01); tube.renderOrder = 3; g.add(tube);
  const water = new THREE.Mesh(new THREE.CylinderGeometry(0.0195, 0.0195, 1, 40), new THREE.MeshStandardMaterial({ color: 0x8fbcf2, transparent: true, opacity: 0.6, roughness: 0.05, depthWrite: false, envMapIntensity: 1.4 })); water.renderOrder = 2; g.add(water);
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.014, 24, 16), phys({ color: 0xc8322c, roughness: 0.35, clearcoat: 0.6 })); g.add(ball);
  const head = printed(0.17, 0.06, (x, w, h) => { x.clearRect(0, 0, w, h); txt(x, 'THIRST', w / 2, h / 2 + 4, { font: '900 150px Archivo', color: '#eef0f3', track: 18, maxW: w * 0.92 }); }, { depthWrite: false });
  head.position.set(0, G0 + GH + 0.085, -0.038); g.add(head);
  const mark = (s, y, col) => { const m = printed(0.07, 0.022, (x, w, h) => { x.clearRect(0, 0, w, h); x.fillStyle = col; x.fillRect(0, h * 0.42, w * 0.18, h * 0.16); txt(x, s, w * 0.24, h / 2 + 2, { font: '800 60px "Geist Mono"', color: col, align: 'left', track: 4, maxW: w * 0.74 }); }, { depthWrite: false });
    m.position.set(0.055, G0 + GH * y, -0.038); g.add(m); return m; };
  mark('FINE', 0.82, '#cfe0f2'); const dk = mark('DRINK', 0.22, '#f2c6c2');
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.011, 20, 14), new THREE.MeshStandardMaterial({ color: 0x3a1010, emissive: 0xff3b2e, emissiveIntensity: 0, roughness: 0.3 })); lamp.position.set(-0.06, G0 + GH * 0.22, -0.03); g.add(lamp);
  finish(g); tube.castShadow = false; water.castShadow = false;
  return { g, water, ball, lamp, G0, GH, dk };
}

// ------------------------------------------------------------------ the meal: a plate of food, a glass of water
function makeMeal(scene) {
  const g = new THREE.Group(); onRing(g, ST_MEAL); scene.add(g);
  const top = new THREE.Mesh(new RoundedBoxGeometry(MEALT.w, 0.03, MEALT.d, 3, 0.008), woodM()); top.position.y = MEALT.top - 0.015; g.add(top);
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.012, MEALT.top - 0.03, 12), black()); leg.position.set(sx * (MEALT.w / 2 - 0.04), (MEALT.top - 0.03) / 2, sz * (MEALT.d / 2 - 0.04)); g.add(leg); }
  const cer = phys({ color: 0xeeeae2, roughness: 0.3, clearcoat: 0.5, side: THREE.DoubleSide });
  const plate = new THREE.Mesh(new THREE.LatheGeometry([[0.0001, 0.001], [0.08, 0.001], [0.11, 0.012], [0.125, 0.018], [0.123, 0.02], [0.105, 0.015], [0.078, 0.006], [0.0001, 0.006]].map(([x, y]) => new THREE.Vector2(x, y)), 72), cer);
  plate.position.set(-0.04, MEALT.top, 0.03); g.add(plate);
  // the food: rice, a piece of salmon, green beans
  const rice = new THREE.Mesh(new THREE.SphereGeometry(0.045, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), phys({ color: 0xf2efe6, roughness: 0.9, roughnessMap: noiseTex(9, 128, 0.7, 1, 40) })); rice.scale.set(1, 0.55, 0.85); rice.position.set(-0.075, MEALT.top + 0.006, 0.0); g.add(rice);
  const fish = new THREE.Mesh(new RoundedBoxGeometry(0.075, 0.022, 0.045, 3, 0.009), phys({ color: 0xe08a5a, roughness: 0.6, clearcoat: 0.3 })); fish.position.set(0.0, MEALT.top + 0.017, 0.045); fish.rotation.y = 0.4; g.add(fish);
  for (let k = 0; k < 7; k++) { const bean = new THREE.Mesh(new THREE.CylinderGeometry(0.0035, 0.0035, 0.06, 8), phys({ color: 0x4f8a2e, roughness: 0.6 })); bean.rotation.set(Math.PI / 2, 0, 0.9 + k * 0.08); bean.position.set(-0.03 + k * 0.006, MEALT.top + 0.01 + (k % 2) * 0.004, 0.085 - k * 0.004); g.add(bean); }
  const steel = phys({ color: 0xd2d5da, metalness: 1, roughness: 0.25 });
  const fork = new THREE.Mesh(new RoundedBoxGeometry(0.012, 0.004, 0.17, 2, 0.0015), steel); fork.position.set(-0.19, MEALT.top + 0.002, 0.03); g.add(fork);
  const knife = new THREE.Mesh(new RoundedBoxGeometry(0.014, 0.004, 0.19, 2, 0.0015), steel); knife.position.set(0.11, MEALT.top + 0.002, 0.03); g.add(knife);
  const gl = makeGlass(0.8); gl.g.position.set(0.17, MEALT.top, -0.08); g.add(gl.g);
  shadows(g); g.traverse((o) => o.layers.enable(1));
  return { g, gl };
}

// ------------------------------------------------------------------ the counter: two jugs (women 2.0 L, men 2.5 L); in front, every drink and the food; the coffee's note
const JUG = { r: 0.065, h: 0.24 }, JUGX = [-0.29, -0.06];
const jugH = (mL) => (mL / 1e6) / (Math.PI * JUG.r * JUG.r * 0.93);   // the height of so many millilitres in a jug
function makeJug(lab) {
  const g = new THREE.Group(), { r, h } = JUG;
  const wall = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.04, r, h, 64, 1, true), clearM()); wall.position.y = h / 2 + 0.01; wall.renderOrder = 3; g.add(wall);
  const baseM = clearM(0.12); baseM.envMapIntensity = 0.5; baseM.roughness = 0.25; baseM.clearcoat = 0.3;   // a quiet base: the lamp straight above must not make it glow
  const base = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.01, 64), baseM); base.position.y = 0.005; base.renderOrder = 3; g.add(base);
  const lip = new THREE.Mesh(new THREE.TorusGeometry(r * 1.04, 0.0018, 8, 64), clearM(0.4)); lip.rotation.x = Math.PI / 2; lip.position.y = h + 0.01; lip.renderOrder = 3; g.add(lip);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.007, 12, 48, Math.PI), clearM(0.22)); handle.position.set(r * 1.02, h * 0.55, 0); handle.rotation.z = -Math.PI / 2; handle.renderOrder = 3; g.add(handle);
  const marks = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.045, r * 1.005, h, 64, 1, true, -0.55, 1.1), new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, map: canvasTex(512, 1024, (x, w, H) => {
    x.clearRect(0, 0, w, H); x.fillStyle = 'rgba(235,240,248,0.85)';
    for (let L = 0.5; L <= 2.5; L += 0.5) { const y = H - (jugH(L * 1000) / h) * H; const big = L % 1 === 0; x.fillRect(w * 0.5 - (big ? 70 : 40), y - 3, big ? 140 : 80, 6); if (big) txt(x, `${L} L`, w * 0.5 + 120, y, { font: '700 44px "Geist Mono"', color: 'rgba(235,240,248,0.9)' }); }
  }) })); marks.position.y = h / 2 + 0.01; marks.renderOrder = 4; g.add(marks);
  const wm = new THREE.MeshStandardMaterial({ color: 0x6aa6ee, emissive: 0x0e1c30, transparent: true, opacity: 0.62, roughness: 0.05, depthWrite: false, envMapIntensity: 1.4 });
  const water = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.97, r * 0.95, 1, 64), wm); water.renderOrder = 2; g.add(water);
  const plaque = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.05, r * 1.05, 0.032, 64, 1, true, -0.62, 1.24), new THREE.MeshBasicMaterial({ transparent: true, map: canvasTex(1024, 160, (x, w, H) => {
    x.clearRect(0, 0, w, H); x.fillStyle = 'rgba(14,15,18,0.92)'; x.beginPath(); x.roundRect(w * 0.04, 8, w * 0.92, H - 16, 40); x.fill(); txt(x, lab, w / 2, H / 2 + 4, { font: '800 92px Archivo', color: '#eceef1', track: 6, maxW: w * 0.82 }); }) }));
  plaque.position.y = h - 0.014; plaque.renderOrder = 5; g.add(plaque);
  g.traverse((o) => o.layers.enable(1));
  return { g, water, wm };
}
function setJug(J, litres) { const H = Math.max(0.0005, jugH(litres * 1000)); J.water.scale.y = H; J.water.position.y = 0.01 + H / 2; J.water.visible = litres > 0.005; }
function makeMug(liquid, tea = false) {
  const g = new THREE.Group(), cer = phys({ color: tea ? 0xf3efe7 : 0x23252a, roughness: 0.3, clearcoat: 0.5, side: THREE.DoubleSide });
  const P = (tea ? [[0.0001, 0.001], [0.026, 0.001], [0.03, 0.006], [0.042, 0.05], [0.0435, 0.053], [0.0415, 0.052], [0.029, 0.009], [0.0001, 0.008]] : [[0.0001, 0.001], [0.034, 0.001], [0.036, 0.006], [0.038, 0.09], [0.0395, 0.093], [0.0365, 0.091], [0.0345, 0.008], [0.0001, 0.008]]).map(([x, y]) => new THREE.Vector2(x, y));
  g.add(new THREE.Mesh(new THREE.LatheGeometry(P, 64), cer));
  const hd = new THREE.Mesh(new THREE.TorusGeometry(tea ? 0.014 : 0.022, 0.004, 10, 32, Math.PI * 1.3), cer); hd.position.set(tea ? 0.045 : 0.04, tea ? 0.03 : 0.05, 0); hd.rotation.z = -Math.PI * 0.65; g.add(hd);
  const top = new THREE.Mesh(new THREE.CircleGeometry(tea ? 0.039 : 0.0355, 48), phys({ color: liquid, roughness: 0.32, clearcoat: 0.25, clearcoatRoughness: 0.35 })); top.rotation.x = -Math.PI / 2; top.position.y = tea ? 0.045 : 0.082; g.add(top);
  if (tea) { const sau = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.008, 48), cer); sau.position.y = -0.003; g.add(sau); g.position.y = 0.007; }
  shadows(g); g.traverse((o) => o.layers.enable(1)); return g;
}
function makeApple() {
  const pts = []; for (let k = 0; k <= 24; k++) { const a = (k / 24) * Math.PI, r = 0.036 * Math.sin(a) * (1 + 0.1 * Math.sin(a * 2)) * (1 - 0.12 * Math.max(0, Math.cos(a))), y = -0.034 * Math.cos(a) * (1 - 0.15 * Math.exp(-((a - Math.PI) ** 2) * 6));
    pts.push(new THREE.Vector2(Math.max(0.0005, r), y)); }
  const geo = new THREE.LatheGeometry(pts, 48); geo.computeVertexNormals();
  const col = new Float32Array(geo.attributes.position.count * 3), P = geo.attributes.position;
  for (let i = 0; i < P.count; i++) { const v = new THREE.Vector3().fromBufferAttribute(P, i), k = clamp01(0.5 + 0.5 * Math.sin(Math.atan2(v.z, v.x) * 1 + 0.6) * 0.8 + v.y * 6);
    const c = new THREE.Color(0x8c1a16).lerp(new THREE.Color(0xc79a2c), 0.35 * (1 - k)); col.set([c.r, c.g, c.b], i * 3); }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const g = new THREE.Group(), m = new THREE.Mesh(geo, phys({ vertexColors: true, roughness: 0.35, clearcoat: 0.6, clearcoatRoughness: 0.25 })); g.add(m);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.0016, 0.002, 0.014, 8), phys({ color: 0x3b2716, roughness: 0.8 })); stem.position.y = 0.034; stem.rotation.z = 0.2; g.add(stem);
  shadows(g); g.traverse((o) => o.layers.enable(1)); return { g, m, geo };
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
function makeKitchen(scene) {
  const g = new THREE.Group(); onRing(g, ST_JUGS); scene.add(g);
  const top = new THREE.Mesh(new RoundedBoxGeometry(COUNTER.w, 0.035, COUNTER.d, 3, 0.008), woodM()); top.position.y = COUNTER.top - 0.0175; g.add(top);
  const body = new THREE.Mesh(new RoundedBoxGeometry(COUNTER.w - 0.04, COUNTER.top - 0.035, COUNTER.d - 0.04, 3, 0.01), black()); body.position.y = (COUNTER.top - 0.035) / 2; g.add(body);
  shadows(g); g.traverse((o) => o.layers.enable(1));
  const women = makeJug('WOMEN · 2.0 L'), men = makeJug('MEN · 2.5 L');
  women.g.position.set(JUGX[0], COUNTER.top, -0.09); men.g.position.set(JUGX[1], COUNTER.top, -0.09); g.add(women.g, men.g);   // both to the left: nothing tall behind the coffee
  // every drink, and the food: they hop up as they are counted
  const items = [];
  const waterG = makeGlass(0.8); waterG.g.position.set(-0.27, COUNTER.top, 0.11); waterG.g.scale.setScalar(0.8); g.add(waterG.g); items.push(waterG.g);
  const milk = makeGlass(0.8, { color: 0xf3f1ea, opacity: 0.92 }); milk.g.position.set(-0.16, COUNTER.top, 0.11); milk.g.scale.setScalar(0.8); g.add(milk.g); items.push(milk.g);
  const tea = makeMug(0x7a3e12, true); tea.position.set(-0.035, COUNTER.top, 0.12); tea.rotation.y = -0.3; g.add(tea); items.push(tea);
  const mug = makeMug(0x2a1a10); mug.position.set(0.1, COUNTER.top, 0.12); mug.rotation.y = -0.5; g.add(mug); items.push(mug);
  const bowl = makeBowl(); bowl.position.set(0.255, COUNTER.top, 0.1); g.add(bowl); items.push(bowl);
  // the note on the coffee: a yellow sticky note round the mug's side, DOESN'T COUNT; it arrives late, and DOESN'T gets struck out.
  // It is a piece of a cylinder just outside the mug, so it never cuts into it, even while it slides on
  const note = new THREE.Group(); note.position.set(NOTE.x, COUNTER.top + NOTE.y, NOTE.z); note.visible = false; g.add(note);
  const paperM = phys({ map: canvasTex(512, 512, (x, w, h) => { x.fillStyle = '#f2d75b'; x.fillRect(0, 0, w, h); x.fillStyle = 'rgba(0,0,0,0.07)'; x.fillRect(0, 0, w, h * 0.13);
    txt(x, 'DOESN’T', w / 2, h * 0.43, { font: '800 104px Archivo', color: '#1d1e22', maxW: w * 0.84 }); txt(x, 'COUNT', w / 2, h * 0.7, { font: '800 104px Archivo', color: '#1d1e22', maxW: w * 0.84 }); }), roughness: 0.65, transparent: true, opacity: 0 });
  const paper = new THREE.Mesh(new THREE.CylinderGeometry(NOTE.r, NOTE.r, NOTE.h, 32, 1, true, NOTE.th - NOTE.a / 2, NOTE.a), paperM); note.add(paper);
  const strikeG = new THREE.CylinderGeometry(NOTE.r + 0.0005, NOTE.r + 0.0005, 0.0048, 24, 1, true, NOTE.th - NOTE.a * 0.41, NOTE.a * 0.82); strikeG.setDrawRange(0, 0);
  const strike = new THREE.Mesh(strikeG, new THREE.MeshBasicMaterial({ color: 0xc8322c })); strike.position.y = NOTE.h * (0.5 - 0.43); note.add(strike);
  shadows(note); note.traverse((o) => o.layers.enable(1));
  return { g, women, men, items, waterG, milk, note, paperM, strikeG };
}

// ------------------------------------------------------------------ two tubes: four coffees a day, four waters a day; kept alike
const TUBES = [['WATER', 0x6aa6ee, 0.6], ['COFFEE', 0x3a2414, 0.96]];
function makeTubes(scene) {
  const g = new THREE.Group(); onRing(g, ST_TUBES); scene.add(g);
  const top = new THREE.Mesh(new RoundedBoxGeometry(TUBEC.w, 0.035, TUBEC.d, 3, 0.008), woodM()); top.position.y = TUBEC.top - 0.0175; g.add(top);
  const body = new THREE.Mesh(new RoundedBoxGeometry(TUBEC.w - 0.04, TUBEC.top - 0.035, TUBEC.d - 0.04, 3, 0.01), black()); body.position.y = (TUBEC.top - 0.035) / 2; g.add(body);
  const rack = new THREE.Mesh(new RoundedBoxGeometry(0.26, 0.02, 0.09, 3, 0.005), black()); rack.position.set(0, TUBEC.top + 0.01, 0); g.add(rack);
  const out = [];
  TUBES.forEach(([lab, col, op], i) => {
    const x = -0.06 + i * 0.12, tube = new THREE.Group(); tube.position.set(x, TUBEC.top + 0.02, 0); g.add(tube);
    const wall = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.27, 40, 1, true), clearM()); wall.position.y = 0.135; wall.renderOrder = 3; tube.add(wall);
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.03, 32, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), clearM()); cap.renderOrder = 3; tube.add(cap);
    const lip = new THREE.Mesh(new THREE.TorusGeometry(0.0302, 0.0015, 8, 48), clearM(0.4)); lip.rotation.x = Math.PI / 2; lip.position.y = 0.27; lip.renderOrder = 3; tube.add(lip);
    const liq = new THREE.Mesh(new THREE.CylinderGeometry(0.0285, 0.0285, 1, 40), new THREE.MeshStandardMaterial({ color: col, transparent: true, opacity: op, roughness: 0.06, depthWrite: false, envMapIntensity: 1.3 }));
    liq.renderOrder = 2; tube.add(liq);
    const tag = printed(0.1, 0.024, (x2, w, h) => { x2.fillStyle = '#e9e5dc'; x2.fillRect(0, 0, w, h); txt(x2, lab, w / 2, h / 2 + 2, { font: '700 52px "Geist Mono"', color: '#16181c', track: 4, maxW: w * 0.88 }); });
    tag.position.set(x, TUBEC.top + 0.01, 0.047); g.add(tag);
    tube.traverse((o) => o.layers.enable(1));
    out.push({ tube, liq });
  });
  const line = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.0018), new THREE.MeshBasicMaterial({ color: 0xffd9a8, transparent: true, opacity: 0, depthWrite: false })); line.position.set(0, TUBEC.top + 0.02, 0.034); g.add(line);
  shadows(g); g.traverse((o) => o.layers.enable(1));
  return { g, out, line };
}
const TUBE_H = (k) => 0.03 + 0.22 * k;   // liquid height for a level k

// ------------------------------------------------------------------ the colour card on a stand: clear pale yellow
function makeCard(scene) {
  const g = new THREE.Group(); onRing(g, ST_CARD); scene.add(g);
  const ped = new THREE.Mesh(new RoundedBoxGeometry(0.24, 0.86, 0.2, 3, 0.01), black()); ped.position.y = 0.43; g.add(ped);
  const card = new THREE.Group(); card.position.set(0, 0.86, 0.0); card.rotation.x = -0.2; g.add(card);
  const CH = ['#fbf6d8', '#f6ea9b', '#ecd25a', '#d9a72c', '#b8791c'];
  const face = printed(0.14, 0.3, (x, w, h) => { x.fillStyle = '#f4f2ec'; x.fillRect(0, 0, w, h);
    txt(x, 'CHECK YOUR PEE', w / 2, h * 0.065, { font: '800 40px Archivo', color: '#16181c', track: 3, maxW: w * 0.86 });
    CH.forEach((c, i) => { const y0 = h * 0.13 + i * h * 0.165; x.fillStyle = c; x.fillRect(w * 0.08, y0, w * 0.84, h * 0.14); });
    txt(x, 'CLEAR PALE YELLOW', w * 0.5, h * 0.13 + 1 * h * 0.165 + h * 0.07, { font: '700 30px "Geist Mono"', color: '#5b4a12', track: 2, maxW: w * 0.7 }); });
  face.position.y = 0.165; card.add(face);
  const easel = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.32, 0.012), black()); easel.position.set(0, 0.14, -0.05); easel.rotation.x = -0.35; card.add(easel);
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.06, 0.066, 64), new THREE.MeshBasicMaterial({ color: 0xff6a2b, transparent: true, opacity: 0, depthWrite: false })); ring.scale.set(1.12, 0.42, 1);
  ring.position.set(0, 0.165 + 0.3 * (0.5 - (0.13 + 0.165 + 0.07)), 0.001); card.add(ring);
  const tick = label(0.03, 0.03, (x, w, h) => { x.clearRect(0, 0, w, h); x.strokeStyle = '#ff6a2b'; x.lineWidth = 16; x.lineCap = 'round'; x.lineJoin = 'round'; x.beginPath(); x.moveTo(w * 0.15, h * 0.55); x.lineTo(w * 0.42, h * 0.8); x.lineTo(w * 0.88, h * 0.2); x.stroke(); });
  tick.position.set(0.085, ring.position.y, 0.002); tick.material.opacity = 0; card.add(tick);
  shadows(g); g.traverse((o) => o.layers.enable(1));
  return { g, ring, tick };
}

// ------------------------------------------------------------------ the cylinder that rises with each reason, then overflows
const CYL = { r: 0.042, h: 0.42 };
function makeCylinder(scene) {
  const g = new THREE.Group(); onRing(g, ST_CYL); scene.add(g);
  const ped = new THREE.Mesh(new RoundedBoxGeometry(0.28, CYLP.top, 0.28, 3, 0.01), black()); ped.position.y = CYLP.top / 2; g.add(ped);
  const wall = new THREE.Mesh(new THREE.CylinderGeometry(CYL.r, CYL.r, CYL.h, 48, 1, true), glassM()); wall.position.y = CYLP.top + 0.015 + CYL.h / 2; wall.renderOrder = 3; g.add(wall);
  const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.075, 0.015, 6), glassM()); foot.position.y = CYLP.top + 0.0075; foot.renderOrder = 3; g.add(foot);
  const marks = new THREE.Mesh(new THREE.CylinderGeometry(CYL.r * 1.004, CYL.r * 1.004, CYL.h, 48, 1, true, -0.5, 1.0), new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, map: canvasTex(256, 1024, (x, w, H) => {
    x.clearRect(0, 0, w, H); x.fillStyle = 'rgba(235,240,248,0.8)'; for (let k = 1; k < 20; k++) { const y = H - (k / 20) * H; x.fillRect(w * 0.5 - (k % 5 ? 20 : 40), y - 2, k % 5 ? 40 : 80, 4); } }) }));
  marks.position.y = wall.position.y; marks.rotation.y = Math.PI / 2; marks.renderOrder = 4; g.add(marks);
  const wm = new THREE.MeshStandardMaterial({ color: 0x8fbcf2, transparent: true, opacity: 0.55, roughness: 0.04, depthWrite: false, envMapIntensity: 1.4 });
  const water = new THREE.Mesh(new THREE.CylinderGeometry(CYL.r * 0.96, CYL.r * 0.96, 1, 48), wm); water.renderOrder = 2; g.add(water);
  const sheet = new THREE.Mesh(new THREE.CylinderGeometry(CYL.r * 1.03, CYL.r * 1.03, 1, 48, 1, true, -1.1, 2.2), new THREE.MeshStandardMaterial({ color: 0xbfdcff, transparent: true, opacity: 0, roughness: 0.04, depthWrite: false, emissive: 0x18283a, side: THREE.DoubleSide }));
  sheet.renderOrder = 4; g.add(sheet);
  const pool = new THREE.Mesh(new THREE.CircleGeometry(1, 64), new THREE.MeshStandardMaterial({ color: 0x8fb6e6, transparent: true, opacity: 0, roughness: 0.03, depthWrite: false, envMapIntensity: 2 }));
  pool.rotation.x = -Math.PI / 2; pool.position.y = CYLP.top + 0.0012; g.add(pool);
  const tags = ['+ HEAT', '+ LONG EXERCISE', '+ ILLNESS', '+ PREGNANT OR BREASTFEEDING'].map((s, i) => {
    const m = printed(0.18, 0.031, (x, w, h) => { x.fillStyle = '#16171a'; x.beginPath(); x.roundRect(0, 0, w, h, 30); x.fill(); txt(x, s, w * 0.06, h / 2 + 2, { font: '700 60px "Geist Mono"', color: '#eceef1', align: 'left', track: 3, maxW: w * 0.88 }); }, { depthWrite: false });
    m.position.set(-0.155, CYLP.top + 0.08 + i * 0.048, 0.03); m.rotation.y = 0.15; m.material.opacity = 0; g.add(m); return m; });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(CYL.r * 0.99, 48, 12, 0, Math.PI * 2, 0, 0.5), new THREE.MeshStandardMaterial({ color: 0x9cc6f6, transparent: true, opacity: 0, roughness: 0.03, depthWrite: false, envMapIntensity: 1.6 }));
  dome.scale.set(1, 0.28, 1); g.add(dome);
  shadows(ped); g.traverse((o) => o.layers.enable(1));
  const runs = [-0.55, 0.05, 0.6].map(() => makeStream(scene));
  return { g, water, sheet, pool, tags, dome, runs };
}

// ------------------------------------------------------------------ the marathon board: a finish banner, 100 bibs; 13 turn red. A scale on the floor
function makeMarathon(scene) {
  const g = new THREE.Group(); onRing(g, ST_MARA); g.scale.setScalar(MARA_S); scene.add(g);   // smaller than life, so a portrait frame holds it
  const board = new THREE.Mesh(new RoundedBoxGeometry(MARA.w, MARA.h, 0.03, 3, 0.008), phys({ color: 0x1b1c20, roughness: 0.6 })); board.position.set(0, MARA.y, MARA.z); g.add(board);
  for (const s of [-1, 1]) { const leg = new THREE.Mesh(new THREE.BoxGeometry(0.03, MARA.y + MARA.h / 2 + 0.2, 0.03), black()); leg.position.set(s * (MARA.w / 2 + 0.03), (MARA.y + MARA.h / 2 + 0.2) / 2, MARA.z - 0.01); g.add(leg); }
  const banner = printed(MARA.w + 0.08, 0.13, (x, w, h) => { const n = 26; for (let i = 0; i < n; i++) for (let j = 0; j < 2; j++) { x.fillStyle = (i + j) % 2 ? '#111' : '#f2f2ee'; x.fillRect((i / n) * w, j * h * 0.18, w / n + 1, h * 0.18); x.fillRect((i / n) * w, h * 0.82 + j * h * 0.09, w / n + 1, h * 0.09); }
    x.fillStyle = '#f2f2ee'; x.fillRect(0, h * 0.36, w, h * 0.46); txt(x, 'FINISH', w / 2, h * 0.6, { font: '900 300px Archivo', color: '#111317', track: 40, maxW: w * 0.6 }); });
  banner.position.set(0, MARA.y + MARA.h / 2 + 0.12, MARA.z + 0.02); g.add(banner);
  const head = printed(0.7, 0.04, (x, w, h) => { x.clearRect(0, 0, w, h); txt(x, 'BLOOD TESTED AT THE FINISH', w / 2, h / 2 + 2, { font: '700 64px "Geist Mono"', color: '#c9ccd2', track: 6, maxW: w * 0.95 }); }, { depthWrite: false });
  head.position.set(0, MARA.y + MARA.h / 2 - 0.05, MARA.z + 0.017); g.add(head);
  const bibs = [], bw = 0.068, bh = 0.052;
  const order = [...Array(100).keys()].sort((a, b) => hash(a * 7.31 + 3) - hash(b * 7.31 + 3)), red = new Set(order.slice(0, 13));
  for (let k = 0; k < 100; k++) { const i = k % 10, j = Math.floor(k / 10), num = 100 + Math.floor(hash(k * 2.7) * 9800);
    const mk = (bg, fg) => canvasTex(272, 208, (x, w, h) => { x.fillStyle = bg; x.fillRect(0, 0, w, h); x.fillStyle = 'rgba(0,0,0,0.15)'; for (const cx of [18, w - 18]) for (const cy of [16, h - 16]) { x.beginPath(); x.arc(cx, cy, 6, 0, 7); x.fill(); } txt(x, String(num), w / 2, h / 2 + 6, { font: '900 96px Archivo', color: fg }); });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(bw, bh), phys({ map: mk('#ecebe6', '#1a1b1f'), roughness: 0.7 }));
    m.position.set(-0.36 + i * 0.08, MARA.y + 0.3 - j * 0.066, MARA.z + 0.016); g.add(m);
    bibs.push({ m, red: red.has(k), rank: red.has(k) ? order.indexOf(k) : -1, redMap: red.has(k) ? mk('#c8322c', '#fff') : null });
  }
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
  const g = new THREE.Group(); onRing(g, ST_LAST); scene.add(g);
  const top = new THREE.Mesh(new THREE.CylinderGeometry(LASTT.r, LASTT.r, 0.022, 64), woodM()); top.position.y = LASTT.top - 0.011; g.add(top);
  const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.024, LASTT.top - 0.022, 20), black()); leg.position.y = (LASTT.top - 0.022) / 2; g.add(leg);
  const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.14, 0.02, 48), black()); foot.position.y = 0.01; g.add(foot);
  const G = makeGlass(0.86); G.g.position.set(0, LASTT.top, 0); g.add(G.g);
  const logo = makeLogoRing(LOGO_R); logo.g.rotation.x = -Math.PI / 2; logo.g.position.set(0, LASTT.top + GLASS.h + 0.0012, 0); g.add(logo.g);
  shadows(g); g.traverse((o) => o.layers.enable(1));
  return { g, G, logo };
}

// ------------------------------------------------------------------ build
async function build(S, cfg) {
  const scene = S.scene; S.r.localClippingEnabled = true; W.env = scene.environment;
  S.fog.near = 4; S.fog.far = 13;
  S.table.scale.set(2, 2, 1); S.tableMat.clearcoat = 0.1; S.tableMat.specularIntensity = 0.3;
  for (const m of [S.tableMat.map, S.tableMat.roughnessMap]) if (m) { m.wrapS = m.wrapT = THREE.RepeatWrapping; m.repeat.multiplyScalar(2); }
  const meshes = await loadAnatomy(skeletonKind());
  const R = W.rig = buildRig(meshes);
  W.body = new THREE.Group(); scene.add(W.body); W.body.add(R.root);
  for (const m of meshes) { m.castShadow = true; m.receiveShadow = true; m.layers.enable(1); }
  W.meshes = meshes; W.bones = meshes.filter((m) => ['bone', 'tooth', 'cartilage'].includes(m.userData.tissue));
  W.ground = Math.min(R.legs.Right.ground, R.legs.Left.ground);
  W.body.position.set(0, -W.ground, -R.P0.z);
  const at = R.seg.Atlas;
  W.body.updateMatrixWorld(true);
  W.jawG = new THREE.Group(); W.jawG.position.copy(new THREE.Vector3(0, 1.668, -0.003)).sub(at.pivot); at.g.add(W.jawG); at.g.updateMatrixWorld(true);
  const lowerTeeth = meshes.filter((m) => /lower .*tooth|lower .*incisor/i.test(m.userData.name));
  for (const m of meshes) if (/^mandible$|lower .*tooth/i.test(m.userData.name)) W.jawG.attach(m);
  { const vs = []; for (const m of lowerTeeth.length ? lowerTeeth : [R.byName.get('Mandible')]) for (const v of worldVerts(m, 2)) vs.push(v);
    let zmax = -9; for (const v of vs) zmax = Math.max(zmax, v.z); const front = avgV(vs.filter((v) => v.z > zmax - 0.004));
    W.mouthRest = front.clone().add(new THREE.Vector3(0, 0.002, 0.006));
    const mv = worldVerts(R.byName.get('Mandible'), 2); let ymin = 9; for (const v of mv) ymin = Math.min(ymin, v.y); W.jawLowRest = ymin; }
  // hands: the glass in the left; the right on the pram's handle
  W.wristL = makeWrist(R, 'Left'); W.wristR = makeWrist(R, 'Right', { pronate: true });
  W.handL = rigHand(R, 'Left', W.wristL); W.handR = rigHand(R, 'Right', W.wristR); W.handL.wr = W.wristL; W.handR.wr = W.wristR;
  W.glass = makeGlass(0.86); W.glass.g.matrixAutoUpdate = false; scene.add(W.glass.g);
  { const H = W.handL, up = H.across.clone().negate(), q = new THREE.Quaternion().setFromUnitVectors(Y, up); W.glass.hm = new THREE.Matrix4().compose(H.handle.clone().addScaledVector(up, -GRIP), q, new THREE.Vector3(1, 1, 1)); }
  // ---- the stance, and where a vertical line falls clear through it (the stream's path)
  poseBody(-9, true); W.body.updateMatrixWorld(true);
  { const rc = new THREE.Raycaster(), down = new THREE.Vector3(0, -1, 0), solid = meshes.filter((m) => !/hyoid|cartilage/i.test(m.userData.name)), yTop = W.jawLowW - 0.01;
    rc.far = yTop - 0.3; const clear = [];
    for (let z = 0.0; z <= 0.12; z += 0.002) { let ok = true;
      for (const [dx, dz] of [[0, 0], [0.006, 0], [-0.006, 0], [0, 0.003], [0, -0.003]]) { rc.set(new THREE.Vector3(dx, yTop, z + dz), down); if (rc.intersectObjects(solid, false).length) { ok = false; break; } }
      clear.push([z, ok]); }
    let best = null, run = null; for (const [z, ok] of clear) { if (ok) { if (!run) run = [z, z]; else run[1] = z; if (!best || run[1] - run[0] > best[1] - best[0]) best = [...run]; } else run = null; }
    W.lineZ = best ? (best[0] + best[1]) / 2 : 0.06; W.lineRun = best; }
  // ---- the set
  W.bucket = makeBucket(scene); W.bucket.g.position.set(0, 0, W.lineZ);
  { const st = R.byName.get('Body of sternum'); st.material = st.material.clone();
    W.stampSpot = stampSpot(st, { from: [0, 0.006, 0.12], dir: [0, 0, -1], spread: 0.004 });
    if (W.stampSpot) W.stamp = stamp(st, { canvas: stampCanvas(['HUMAN FACTORY', 'SETTINGS'], '', { frame: false }), center: W.stampSpot.center, normal: W.stampSpot.normal, up: [0, 1, 0], width: 0.04, depth: 0.03, opacity: 0.6 }); }
  W.stream = makeStream(scene);
  W.pram = makePram(scene); W.tray = makeTray(scene); W.drawers = makeDrawers(scene); W.thirst = makeThirst(scene); W.meal = makeMeal(scene); W.kit = makeKitchen(scene);
  W.tubes = makeTubes(scene); W.card = makeCard(scene); W.cyl = makeCylinder(scene); W.mara = makeMarathon(scene); W.last = makeLast(scene);
  scene.updateMatrixWorld(true);
  // ---- the arm poses, solved once: the glass at the lips (two tilts), the glass down by its side; the right hand on the pram
  W.poses = solvePoses();
  // ---- light
  W.key = spot(scene, { color: 0xdfe6ff, pos: new THREE.Vector3(0.9, 3.0, 2.4), target: new THREE.Vector3(-0.2, 0.9, 0.2), angle: 0.5, penumbra: 0.8, shadow: true, size: cfg.shadow ?? 1024 }); W.key.shadow.camera.far = 8;
  W.rim = spot(scene, { color: 0xa9c4ff, pos: new THREE.Vector3(-1.2, 2.4, -1.4), target: new THREE.Vector3(0, 1.0, 0), angle: 0.5, penumbra: 0.9 });
  W.fill = spot(scene, { color: 0xc8d6ff, pos: new THREE.Vector3(-1.6, 1.3, 2.0), target: new THREE.Vector3(-0.2, 0.8, 0.3), angle: 0.6, penumbra: 1 });
  W.bucketLight = spot(scene, { color: 0xeef3ff, pos: new THREE.Vector3(0.5, 1.4, 1.4), target: new THREE.Vector3(0, 0.2, W.lineZ), angle: 0.22, penumbra: 0.8 });
  // one soft spot per station, from inside the ring, above and in front
  const sp = (k, tgt, a = 0.28, h = 2.3, d = 1.3) => { const p = RW(k, [0.2, h, d]), q = RW(k, tgt); return spot(scene, { color: 0xfff1d8, pos: new THREE.Vector3(...p), target: new THREE.Vector3(...q), angle: a, penumbra: 0.7 }); };
  W.lights = {
    [ST_TRAY]: sp(ST_TRAY, [0, TRAY.top + 0.05, 0], 0.24), [ST_DRAW]: sp(ST_DRAW, [0, DRAW.top + 0.12, 0.1], 0.22), [ST_GAUGE]: sp(ST_GAUGE, [0, 1.2, 0], 0.26),
    [ST_MEAL]: sp(ST_MEAL, [0, MEALT.top + 0.06, 0], 0.26), [ST_JUGS]: sp(ST_JUGS, [0, COUNTER.top + 0.1, 0], 0.3), [ST_TUBES]: sp(ST_TUBES, [0, TUBEC.top + 0.14, 0], 0.26),
    [ST_CARD]: sp(ST_CARD, [0, 1.0, 0], 0.24), [ST_CYL]: sp(ST_CYL, [0, CYLP.top + 0.2, 0], 0.26), [ST_MARA]: sp(ST_MARA, [0, MARA.y * MARA_S, MARA.z * MARA_S], 0.3, 2.4, 1.9), [ST_LAST]: sp(ST_LAST, [0, LASTT.top + 0.06, 0], 0.22),
  };
  W.maraFloor = spot(scene, { color: 0xfff1d8, pos: new THREE.Vector3(...RW(ST_MARA, [-0.3, 1.2, 1.4])), target: new THREE.Vector3(...RW(ST_MARA, [0, 0.04, 0.42 * MARA_S])), angle: 0.16, penumbra: 0.7 });
  W.pramLight = spot(scene, { color: 0xfff1d8, pos: new THREE.Vector3(PRAM.x - 0.3, 2.2, PRAM.z + 1.3), target: new THREE.Vector3(PRAM.x, 0.65, PRAM.z), angle: 0.26, penumbra: 0.7 });
  W.auditSolids = [['pram', W.pram.g], ['bucket', W.bucket.g], ['tray', W.tray.g], ['last', W.last.g]];
  W.darkMats = []; { const seen = new Set(); for (const root of [...meshes, W.glass.g, W.bucket.g]) root.traverse((o) => { if (!o.isMesh) return; for (const m of [].concat(o.material)) if (m && !seen.has(m) && 'envMapIntensity' in m) { seen.add(m);
    const own = !!m.envMap; if (!own) { m.envMap = scene.environment; m.needsUpdate = true; } W.darkMats.push([m, own ? m.envMapIntensity : -1]); } }); }   // -1: follows the scene's intensity
  W.timing = { drink: [HEAD.up0, HEAD.up1, HEAD.down0, HEAD.down1], pour: [POUR.on, POUR.off], drawer: [T.looking - 0.1, T.looking + 0.8], gaugeFall: [T.built, T.thirst + 0.1], lamp: T.thirst,
    jugW: [T.two - 0.2, T.women + 0.3], jugM: [T.two2 - 0.2, T.men + 0.3], hop: HOPS, strike: [T.count - 0.25, T.count + 0.2], tubes: [T.hydrated - 0.2, T.water4 + 0.2], ring: [T.pale - 0.1, T.yellow + 0.2],
    reasons: [T.heat, T.long, T.ill, T.pregnant], over: [T.more - 0.2, T.better + 0.6], bibs: T.thirteen - 0.1, needle: [T.gained - 0.1, T.weight + 0.5], logo: T.logo, lightsUp: LIGHTS_UP, noteIn: NOTE_IN };
  return { stamp: W.stampSpot, lineZ: W.lineZ, run: W.lineRun, jawLow: W.jawLowW, errs: Object.fromEntries(Object.entries(W.poses).map(([k, v]) => [k, v.err && +v.err.toFixed(4)])) };
}

// ------------------------------------------------------------------ the body: feet apart; the right hand on the pram; it forces down a glass (left hand)
const LIGHTS_UP = 2.1;   // until here only the pram is lit; the skeleton beside it is in the dark
const HEAD = { up0: 2.9, up1: 3.55, down0: 5.85, down1: 6.5 };   // the glass rises to the lips, tips up while it pours, comes down
const POUR = { on: 3.75, off: 5.75 };                                   // water leaves the mouth from here to here
const HOPS = [T.every - 0.05, T.every + 0.15, T.every + 0.32, T.drink + 0.08, T.inFood + 0.12];
const NOTE_IN = 33.62;   // the note is slapped on the coffee as the camera comes to it
const NOTE = { x: 0.1, y: 0.047, z: 0.12, r: 0.0385, h: 0.058, a: 1.5, th: -0.15 };   // round the mug (its axis at x, z; its side is 0.037 out here); th: where it faces
function tiltAt(t) { return lerp(1.15, 1.85, s5(HEAD.up1, HEAD.down0, t)); }
function headAt(t) { const d = s5(HEAD.up0, HEAD.up1, t) * (1 - s5(HEAD.down0, HEAD.down1 + 0.3, t)); return -0.45 * d * s5(HEAD.up0, HEAD.up1 + 0.6, t); }
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
    const P = W.poses, d = s5(HEAD.up0, HEAD.up1, t) * (1 - s5(HEAD.down0, HEAD.down1, t)), tip = s5(HEAD.up1, HEAD.down0, t);
    const pl = mixArm(P.glassDown, mixArm(P.lips1, P.lips2, tip), d); poseArm(R.arms.Left, pl); setWrist(W.wristL, pl); W.handL.curl(0.55);
    poseArm(R.arms.Right, P.pram); setWrist(W.wristR, P.pram); W.handR.curl(0, P.pramGrip.per, P.pramGrip.tk);
  } else { const p0 = { dir: [0.1, -1, 0.1], twist: 0.2, elbow: 0.3 }; poseArm(R.arms.Left, p0); poseArm(R.arms.Right, p0); if (W.wristL) { setWrist(W.wristL, p0); setWrist(W.wristR, p0); } }
  if (W.jawG) W.jawG.rotation.x = solving ? 0 : 0.06 * d01(t);
  W.body.updateMatrixWorld(true);
  W.glass.g.matrix.multiplyMatrices(W.wristL.g.matrixWorld, W.glass.hm); W.glass.g.matrixWorldNeedsUpdate = true; W.glass.g.updateMatrixWorld(true);
  const jl = new THREE.Vector3(0, W.jawLowRest, 0); W.jawLowW = jl.sub(R.pivots.get(W.jawG.parent)).applyMatrix4(W.jawG.parent.matrixWorld).y;
}
const d01 = (t) => s5(HEAD.up1 - 0.2, HEAD.up1 + 0.2, t) * (1 - s5(HEAD.down0, HEAD.down1, t));   // the jaw slightly open while it drinks
function mouthW() { const R = W.rig; return W.mouthRest.clone().sub(R.pivots.get(W.jawG.parent)).applyMatrix4(W.jawG.parent.matrixWorld); }
function barSDF(p) {   // the pram's handle bar (a capsule along x), for the fingers to close on
  const P = W.pram, c = new THREE.Vector3(0, W.pramHandle.y, W.pramHandle.z).applyMatrix4(P.g.matrixWorld), hw = W.pramHandle.w / 2;
  const q = p.clone().sub(c); const x = Math.max(-hw, Math.min(hw, q.x)); return Math.hypot(q.x - x, q.y, q.z) - 0.014;
}
function solvePoses() {
  const R = W.rig, out = {}, HL = W.handL, HR = W.handR;
  const glassAims = (H, up, palm) => [{ v: H.across, to: up.clone().negate(), w: 0.3 }, { v: H.n, to: palm, w: 0.01 }];   // the glass's axis is the hand's across
  for (const [k, tilt, hd] of [['lips1', 1.15, -0.45 * 0.6], ['lips2', 1.85, -0.45]]) {
    bendSpine(R.seg, { lum: -0.04, tho: 0.06, cer: hd + 0.04 }); R.root.updateMatrixWorld(true); W.body.updateMatrixWorld(true);
    const m = mouthW(), u = new THREE.Vector3(0, Math.cos(tilt), -Math.sin(tilt)), v = new THREE.Vector3(0, -Math.sin(tilt), -Math.cos(tilt));
    const rimC = m.clone().addScaledVector(v, -GLASS.r), c = rimC.clone().addScaledVector(u, -(GLASS.h - GRIP));
    out[k] = solveHand(R, 'Left', HL, c, { dir: [0.3, 0.2, 0.9], twist: 0.4, elbow: 2.2 }, glassAims(HL, u, new THREE.Vector3(-0.7, 0, -0.7).normalize()));
  }
  bendSpine(R.seg, { lum: -0.04, tho: 0.06, cer: 0.04 }); R.root.updateMatrixWorld(true); W.body.updateMatrixWorld(true);
  { const sh = new THREE.Vector3(); R.arms.Left.arm.getWorldPosition(sh); const c = sh.clone().add(new THREE.Vector3(-0.02, -0.42, 0.27));
    out.glassDown = solveHand(R, 'Left', HL, c, { dir: [0.05, -1, 0.2], twist: 0.3, elbow: 1.5 }, glassAims(HL, Y, new THREE.Vector3(-1, 0, 0))); }
  // the right hand round the pram's bar, palm down, fingers wrapping forward over it
  { W.pram.g.updateMatrixWorld(true); const bar = new THREE.Vector3(0.11, W.pramHandle.y, W.pramHandle.z).applyMatrix4(W.pram.g.matrixWorld);
    const at = bar.clone().add(new THREE.Vector3(0, 0.004, 0));   // the grip's centre on the bar's axis: the fingers close round it
    const aims = [{ v: HR.n, to: new THREE.Vector3(0, -1, 0), w: 0.35 }, { v: HR.fdir, to: new THREE.Vector3(0.2, -0.25, 1).normalize(), w: 0.25 }];
    out.pram = null;   // the forearm turned palm down: try a few pronations, keep the best
    for (const pro of [1.4, 1.8, 2.2, 2.6, 3.0]) { const r = solveHand(R, 'Right', HR, at, { dir: [-0.3, -0.75, 0.45], twist: 0.2, elbow: 0.9, pro }, aims, null, [{ dir: [-0.3, -0.75, 0.45], twist: 0.2, elbow: 0.9, pro }, { dir: [-0.2, -0.85, 0.3], twist: 0.6, elbow: 0.6, pro }, { dir: [-0.4, -0.6, 0.6], twist: -0.3, elbow: 1.2, pro }]);
      if (!out.pram || r.err < out.pram.err) out.pram = r; }
    poseArm(R.arms.Right, out.pram); setWrist(W.wristR, out.pram); R.arms.Right.girdle.updateMatrixWorld(true); HR.curl(0);
    out.pramGrip = HR.fit(barSDF, { need: 0.003, kmin: -0.25, kmax: 1.2, tmin: -1.4 }); }   // from open (the thumb swung clear) to the first touch
  return out;
}

// ------------------------------------------------------------------ the camera: one path, no cuts (views fitted per station; see W.views)
let CAM = null;
function view(k, p, l, fov = 30) { return { p: RW(k, p), l: RW(k, l), fov }; }
const LG = LASTT.top + GLASS.h;   // the last glass's rim
W.views = {   // fitted (tools/fit16.py): station frames have +z toward the ring's centre; the skeleton's station is the world frame
  bonnet: { p: [0.276, 2.131, 1.493], l: [-0.555, 0.805, 0.684], fov: 30 },     // the newborn in its pram, from above, the skeleton out of the words
  reveal: { p: [0.484, 2.097, 4.528], l: [-0.327, 1.477, 0.305], fov: 36 },     // the whole picture: skeleton, pram, bucket, its head under the words
  drink: { p: [-0.62, 2.02, 1.119], l: [0.004, 1.721, -0.054], fov: 30 },
  bucket: { p: [0.0, 0.815, 1.052], l: [0.0, 0.28, 0.033], fov: 30 },          // the shins either side of the words, not behind them
  tray: view(ST_TRAY, [0.47, 1.862, 1.293], [0.002, 0.924, -0.048]),
  draw: view(ST_DRAW, [-0.274, 1.688, 1.842], [0.042, 1.136, 0.103]),   // the label kept left of the buttons, shut and open
  drawIn: view(ST_DRAW, [0.646, 1.76, 1.205], [0.071, 1.161, 0.203]),
  gauge: view(ST_GAUGE, [0.181, 2.083, 2.078], [0.007, 1.38, -0.056]),
  meal: view(ST_MEAL, [-0.291, 1.851, 1.011], [0.005, 0.823, -0.045]),
  jugs: view(ST_JUGS, [-0.82, 1.939, 1.293], [-0.138, 1.057, -0.122]),   // the jugs (both to the left of the counter), from the side we arrive on
  drinksA: view(ST_JUGS, [0.0, 1.417, 1.44], [-0.14, 1.034, 0.047]),   // the men's jug kept in the frame, so its print never crosses the buttons
  drinksB: view(ST_JUGS, [0.636, 1.919, 1.609], [0.133, 1.033, 0.003]),
  note: view(ST_JUGS, [0.066, 1.054, 0.577], [0.1, 0.943, 0.142]),   // low and square on the note; the jugs out of the frame to the left
  tubes: view(ST_TUBES, [0.0, 1.772, 1.182], [0.008, 1.07, -0.031]),
  card: view(ST_CARD, [0.0, 1.741, 1.074], [0.002, 1.079, -0.07]),
  cyl: view(ST_CYL, [-0.095, 1.873, 1.96], [-0.07, 1.216, -0.037]),
  over: view(ST_CYL, [0.8, 1.251, 1.735], [-0.008, 1.242, 0.011]),
  mara: view(ST_MARA, [0.263, 2.236, 2.973], [0.054, 1.166, -0.092]),
  scale: view(ST_MARA, [-0.092, 1.206, 0.823], [0.017, 0.045, 0.244]),
  last: view(ST_LAST, [0.225, 2.18, 1.276], [-0.006, 0.848, -0.061]),
  logoIn: view(ST_LAST, [0, LG + 0.42, 0.12], [0, LG, 0]),
  logo: view(ST_LAST, [0, LG + 0.32, 0.004], [0, LG, 0]),
};
function buildCam() {
  const V = W.views, toward = (p, l, k) => p.map((v, i) => l[i] + (v - l[i]) * k);
  const key = (t, v, k = 1, extra = {}) => ({ t, p: V3(...toward(v.p, v.l, k)), l: V3(...v.l), fov: v.fov, stop: true, ...extra });
  return camTrack([
    { t: -3.0, p: V3(...toward(V.bonnet.p, V.bonnet.l, 1.06)), l: V3(...V.bonnet.l), fov: V.bonnet.fov },
    { t: 0.0, p: V3(...toward(V.bonnet.p, V.bonnet.l, 1.03)), l: V3(...V.bonnet.l), fov: V.bonnet.fov, tens: 0.4 },
    key(0.55, V.bonnet),
    key(2.6, V.reveal),
    key(3.55, V.drink),
    key(4.6, V.drink, 0.98),
    key(5.4, V.bucket),
    key(6.2, V.bucket, 0.98),
    key(6.85, V.tray), key(9.35, V.tray, 0.95),
    key(10.1, V.draw), key(13.6, V.draw, 0.95), key(14.3, V.drawIn), key(16.0, V.drawIn, 0.97),
    key(16.65, V.gauge), key(19.45, V.gauge, 0.96),
    key(20.05, V.meal), key(24.35, V.meal, 0.95),
    key(24.95, V.jugs), key(30.4, V.jugs, 0.96), key(30.95, V.drinksA), key(31.55, V.drinksA, 0.98), key(32.45, V.drinksB), key(33.5, V.drinksB, 0.98), key(34.05, V.note), key(35.75, V.note, 0.97),
    key(36.35, V.tubes), key(42.5, V.tubes, 0.95),
    key(43.15, V.card), key(45.7, V.card, 0.96),
    key(46.35, V.cyl), key(52.45, V.cyl, 0.96), key(53.05, V.over), key(54.0, V.over, 0.98),
    key(54.75, V.mara), key(59.7, V.mara, 0.96), key(60.35, V.scale), key(65.55, V.scale, 0.95),
    key(66.25, V.last), key(72.4, V.last, 0.94),
    key(73.4, V.logoIn, 1, { stop: false }),
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

// ------------------------------------------------------------------ the water's moves: the drink falls through it
const G9 = 9.81;
function streamAt(t) {   // the column: its head falls from the jaw; its tail follows when the pour stops
  const top = W.jawLowW - 0.004, surf = W.bucket.level + 0.004;
  if (t < POUR.on) return null;
  const yHead = Math.max(surf, top - 0.5 * G9 * (t - POUR.on) ** 2), yTail = t < POUR.off ? top : Math.max(surf, top - 0.5 * G9 * (t - POUR.off) ** 2);
  if (yTail <= surf + 0.001) return null;
  return { yTop: yTail, yBot: yHead };
}
function splashes(B, t, x, z) {   // ripples and drops while the stream hits
  const fallT = Math.sqrt(2 * Math.max(0.05, W.jawLowW - B.level) / G9), hitOn = POUR.on + fallT, hitOff = POUR.off + fallT;
  const events = []; for (let s = hitOn; s < hitOff; s += 0.22) events.push([s, 0.6]);
  B.rips.forEach((m, i) => { let best = null; for (const [s, g] of events) { const u = (t - s) / 0.7; if (u >= 0 && u < 1 && i % 3 === Math.round(s * 9) % 3) if (!best || s > best[0]) best = [s, g, u]; }
    if (!best) { m.material.opacity = 0; return; } const [, g, u] = best, r = 0.008 + 0.075 * Math.sqrt(u) * (0.7 + 0.3 * (i % 2));
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
  // ---- the newborn breathes (a slow rise of the blanket); the glass it drinks from empties during the pour
  W.pram.baby.position.y = W.pram.B0 + 0.032 + 0.2 + 0.002 * Math.sin(t * 1.6);
  W.glass.fill = lerp(0.66, 0.0, s5(POUR.on - 0.1, POUR.off, t)); levelGlass(W.glass);
  const B = W.bucket; B.level = 0.125 + 0.006 * s5(POUR.on + 0.5, POUR.off + 0.6, t);
  B.surf.scale.setScalar(radAt(B.level) - 0.002); B.surf.position.y = B.level;
  const st = streamAt(t); if (st) setStream(W.stream, 0, W.lineZ, st.yTop, st.yBot, t, 1); else W.stream.m.visible = false;
  splashes(B, t, 0, W.lineZ);
  // ---- the tray's glasses stay level; the drawer slides open
  for (const G of W.tray.glasses) { G.g.updateMatrixWorld(true); levelGlass(G); }
  { const k = s5(T.looking - 0.1, T.looking + 0.8, t); W.drawers.open.position.z = DRAW.d / 2 + 0.2 * k; }
  // ---- the thirst gauge: its water falls to DRINK; the lamp lights
  { const Tg = W.thirst, lv = lerp(0.84, 0.2, s5(T.built, T.thirst + 0.1, t)) + 0.006 * Math.sin(t * 3.1), h = Math.max(0.002, lv * Tg.GH);
    Tg.water.scale.y = h; Tg.water.position.set(0, Tg.G0 + h / 2, 0.01); Tg.ball.position.set(0, Tg.G0 + h + 0.004, 0.01);
    Tg.lamp.material.emissiveIntensity = 3.5 * ss(T.thirst - 0.05, T.thirst + 0.15, t) * (0.75 + 0.25 * Math.sin(t * 9)); }
  // ---- the meal's glass; the jugs: 2.0 L and 2.5 L; every drink and the food hop up; the note struck out
  W.meal.gl.g.updateMatrixWorld(true); levelGlass(W.meal.gl);
  { const K = W.kit, fw = s5(T.two - 0.2, T.women + 0.3, t), fm = s5(T.two2 - 0.2, T.men + 0.3, t);
    setJug(K.women, 2.0 * fw); setJug(K.men, 2.5 * fm);
    K.items.forEach((it, i) => { const u = clamp01((t - HOPS[i]) / 0.42); it.position.y = COUNTER.top + 0.03 * Math.sin(Math.PI * u) * (u < 1 ? 1 : 0); });
    for (const G of [K.waterG, K.milk]) { G.g.updateMatrixWorld(true); levelGlass(G); }
    const nk = clamp01((t - NOTE_IN) / 0.3), off = 0.035 * (1 - nk) ** 3;   // slides in along its normal and settles on the mug
    K.note.visible = nk > 0; K.note.position.set(NOTE.x + Math.sin(NOTE.th) * off, COUNTER.top + NOTE.y, NOTE.z + Math.cos(NOTE.th) * off); K.paperM.opacity = clamp01((t - NOTE_IN) / 0.08);
    K.strikeG.setDrawRange(0, 6 * Math.round(24 * s5(T.count - 0.25, T.count + 0.2, t))); }
  // ---- the tubes: four coffees and four waters, kept alike
  { const k = s5(T.hydrated - 0.2, T.water4 + 0.2, t) * 0.6; W.tubes.out.forEach((o) => { const h = Math.max(0.0005, TUBE_H(k)); o.liq.scale.y = h; o.liq.position.y = h / 2; o.liq.visible = k > 0.001; });
    W.tubes.line.position.y = TUBEC.top + 0.02 + TUBE_H(0.6); W.tubes.line.material.opacity = 0.8 * pulse(t, T.asWell - 0.1, 43.0, 0.4); }
  // ---- the colour card
  { const k = s5(T.pale - 0.1, T.yellow + 0.2, t); W.card.ring.material.opacity = k; W.card.tick.material.opacity = s5(T.yellow, T.yellow + 0.35, t); }
  // ---- the cylinder: a notch for each reason; then too much, over the top
  { const C = W.cyl, reasons = [T.heat, T.long, T.ill, T.pregnant], up = reasons.reduce((a, r) => a + 0.075 * s5(r - 0.05, r + 0.45, t), 0), over = s5(T.more - 0.2, T.better + 0.6, t);
    const cylB = ringPos(ST_CYL), frac = Math.min(1, 0.5 + up + 0.4 * over), h = Math.max(0.001, frac * CYL.h); C.water.scale.y = h; C.water.position.y = CYLP.top + 0.015 + h / 2;
    C.tags.forEach((m, i) => { m.material.opacity = s5(reasons[i] - 0.1, reasons[i] + 0.25, t) * (1 - ss(54.2, 54.8, t)); });
    const spill = clamp01((0.5 + up + 0.4 * over - 1.0) / 0.08);
    C.sheet.material.opacity = 0.25 * spill; C.sheet.scale.y = CYL.h * spill; C.sheet.position.y = CYLP.top + 0.015 + CYL.h - CYL.h * spill / 2;
    C.dome.material.opacity = 0.7 * clamp01(spill * 3); C.dome.position.y = CYLP.top + 0.015 + CYL.h - 0.002;
    const top = CYLP.top + 0.015 + CYL.h + 0.004, run = ss(0, 1, spill);
    C.runs.forEach((R2, i) => { const a = [-0.55, 0.05, 0.6][i], d = clamp01(spill * 1.6 - i * 0.25), yb = lerp(top, CYLP.top + 0.002, d), lp = RW(ST_CYL, [Math.sin(a) * (CYL.r + 0.003), 0, Math.cos(a) * (CYL.r + 0.003)]);
      setStream(R2, lp[0], lp[2], top, yb, t + i, 0.55 * run); });
    C.pool.material.opacity = 0.6 * ss(T.better - 0.2, T.better + 0.6, t) * spill; C.pool.scale.setScalar(0.05 + 0.07 * ss(T.better - 0.2, T.better + 1.4, t)); void cylB; }
  // ---- the marathon: thirteen of a hundred bibs turn red; the scale's needle swings up
  { const M = W.mara, k0 = T.thirteen - 0.1; M.bibs.forEach((b) => { if (!b.red) return; const on = t > k0 + b.rank * 0.045;
      if (on && b.m.material.map !== b.redMap) { b.base = b.base || b.m.material.map; b.m.material.map = b.redMap; b.m.material.needsUpdate = true; }
      if (!on && b.base && b.m.material.map !== b.base) { b.m.material.map = b.base; b.m.material.needsUpdate = true; } });
    M.needle.rotation.y = -(-0.6 + 1.0 * s5(T.gained - 0.1, T.weight + 0.5, t)) + 0.02 * Math.sin(t * 9) * pulse(t, T.gained, 65.5, 0.3); }
  // ---- the last glass: the logo on its rim
  { const L = W.last; L.G.g.updateMatrixWorld(true); levelGlass(L.G);
    const lk = s5(T.final + 0.3, T.logo - 0.25, t); L.logo.set({ weight: lk, white: lk, hours: 0, hand: ss(T.logo - 0.4, T.logo - 0.15, t), handScale: outBack(clamp01((t - (T.logo - 0.4)) / 0.35), 1.8) }); }
  // ---- light
  const fig = 1 - endDark;
  const lit = ss(LIGHTS_UP, LIGHTS_UP + 0.3, t), away = ss(6.7, 7.2, t);
  W.key.intensity = 11 * fig * lit * (1 - 0.7 * away); W.rim.intensity = 4 * fig * lit * (1 - 0.7 * away); W.fill.intensity = 1.0 * fig * lit;
  W.bucketLight.intensity = 3.5 * fig * lit * (1 - away); W.pramLight.intensity = (3 + 3.5 * (1 - lit)) * fig * (1 - 0.8 * ss(3.2, 3.8, t));
  for (const [k, L] of Object.entries(W.lights)) L.intensity = (+k === ST_LAST ? 8 * (1 - 0.6 * endDark) : 8 * fig);
  W.maraFloor.intensity = 8 * fig;
  S.tableMat.color.setScalar(0.3 * (1 - endDark * 0.9)); scene.environmentIntensity = 0.12 * (1 - endDark * 0.7); S.reflAmt = 0.5 * (1 - endDark);
  for (const [m, e] of W.darkMats) m.envMapIntensity = (e < 0 ? scene.environmentIntensity : e) * lit;
}

// ------------------------------------------------------------------ the words on screen
const CAPS = [
  { t0: T.you, t1: 3.45, top: 292, size: 82, html: 'You carry a giant<br>water bottle everywhere<br>like a <em>newborn</em>,' },
  { t0: T.forcing, t1: 7.85, top: 292, size: 84, html: 'forcing down<br><em>eight glasses a day</em><br>because someone<br>said so.' },
  { t0: T.lets, t1: 9.75, top: 300, size: 92, html: 'Let’s <em>check</em> that.' },
  { t0: T.review, t1: 15.95, top: 292, size: 78, html: 'A review went looking<br>for the science behind<br>eight glasses of water<br>a day, and it found <em>none</em>.' },
  { t0: T.your, t1: 19.55, top: 292, size: 84, html: 'Your body was built<br>with a water gauge<br>called <em>thirst</em>,' },
  { t0: T.most, t1: 24.4, top: 292, size: 78, html: 'and most healthy people<br>get enough by drinking<br>when thirsty and<br><em>with meals</em>.' },
  { t0: T.europe, t1: 30.4, top: 292, size: 78, html: 'Europe’s food safety<br>authority says about<br><em>2 litres</em> a day for women<br>and <em>2.5</em> for men,' },
  { t0: T.counting, t1: 33.75, top: 292, size: 84, html: 'counting every drink<br>and the <em>water in food</em>.' },
  { t0: T.coffee, t1: 36.0, top: 300, size: 90, html: 'Coffee and tea<br><em>count too</em>:' },
  { t0: T.trial, t1: 42.6, top: 292, size: 76, html: 'in a trial, 4 cups of<br>coffee a day hydrated<br>regular coffee-drinking<br>men <em>as well as water</em>.' },
  { t0: T.check2, t1: 45.65, top: 292, size: 82, html: 'Check your pee:<br>aim for <em>clear pale yellow</em>,' },
  { t0: T.drinkMore, t1: 52.2, top: 292, size: 72, html: 'and drink more in the heat,<br>during long exercise,<br>or when you’re ill, pregnant<br>or breastfeeding.' },
  { t0: T.but, t1: 54.1, top: 300, size: 88, html: 'But more isn’t <em>better</em>:' },
  { t0: T.marathon, t1: 59.8, top: 292, size: 74, html: 'at one marathon, <em>13%</em> of<br>runners tested at the finish<br>had too little salt<br>in their blood,' },
  { t0: T.linked, t1: 63.15, top: 292, size: 84, html: 'linked to drinking<br>so much they<br><em>gained weight</em>.' },
  { t0: T.drinking2, t1: 65.95, top: 292, size: 86, html: 'Drinking far too much<br>can be <em>deadly</em>.' },
  { t0: T.so2, t1: 72.65, top: 292, size: 76, html: 'So drink to <em>thirst</em>, and if<br>your doctor has told you<br>otherwise, follow their<br>advice, not this video.' },
  { t0: T.final, t1: 99, top: 360, size: 92, html: 'Let’s get you back to<br><em>factory settings.</em>' },
];
function overlayInit(S) {}
function overlay(S, t) {
  const c = new THREE.Vector3(...RW(ST_LAST, [0, LASTT.top + GLASS.h + 0.0012, 0]));
  logoEnd(S, t, { t0: T.logo, center: c, edge: c.clone().add(new THREE.Vector3(LOGO_R, 0, 0)) });
}

makeFilm({
  T, caps: CAPS, subs: [], build, update, pose: camPose, overlay, overlayInit, focus: focusAt,
  stage: { bg: 0x07080a, reflSize: 7, env: 0.12, far: 30 },
  aperture: [[0, 0.004], [2.6, 0.002], [3.55, 0.003], [6.85, 0.003], [16.65, 0.003], [24.95, 0.003], [36.35, 0.003], [46.35, 0.003], [54.75, 0.003], [66.25, 0.004], [73.4, 0.003]],
  bloom: [[0, 0.5], [72, 0.55]],
  shade: [[4.45, 6.6]],   // down with the water: the skeleton rises behind the words, under the deep scrim
  dark: [[0, LIGHTS_UP]],   // the skeleton unlit (only its pram is lit) until the lights come up
  fast: [[6.2, 6.85, 2], [9.35, 10.15, 2], [16.0, 16.7, 2], [19.45, 20.1, 2], [24.35, 25.0, 2], [35.75, 36.4, 2], [42.5, 43.2, 2], [45.7, 46.4, 2], [54.0, 54.8, 2], [59.7, 60.35, 2], [65.55, 66.3, 2]],
});

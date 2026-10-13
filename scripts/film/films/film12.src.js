// Human Factory Settings · Film 12 "Cold remedies" (new direction, 7 Oct 2026) · one continuous shot, 9:16.
// A skeleton in a red beanie sits on a stool beside a pyramid of vitamin C tubes; coins stack up next to it (a small
// fortune). It sneezes anyway, and a sticky note with a question mark slaps onto its forehead. A plinth rises with two
// weeks of days: most people feel better within one to two weeks. Two jars, VITAMIN C and PLACEBO, fill with used tissues
// at the same rate; a fizzy tablet dissolves in a glass. An orange drops onto the table and knocks the whole pyramid off
// it (the gag). A balance: hot water with lemon and honey against cough syrup, level. Never honey under one. A bowl of
// hot water under a towel gets a RETIRED stamp: no strong evidence, and it scalds. When to see a doctor: a thermometer
// rises. A dial of days, 7 to 14 marked, becomes the logo. The factory stamp is on the breastbone.
import { THREE, ORANGE, ss, s5, lerp, clamp01, hash, keys, camTrack, phys, glowMat, glowSprite, shadows, spot, RoundedBoxGeometry,
  loadAnatomy, V3, place, logoEnd, makeFilm, outBack, stamp, stampCanvas, stampSpot, noiseTex, softSprite } from '../kit.js';
import { buildRig, skeletonKind, legIK, bendSpine, poseArm, worldVerts, avgV, clearArms } from '../rig.js';
import { makeLogoRing } from '../props.js';
import { ConvexHull } from 'three/addons/math/ConvexHull.js';

//@HANDS@

// ------------------------------------------------------------------ timing, from the voice guide (word starts)
const T = {
  end: 80.87, logo: 78.35,
  every: 0.35, small: 1.87, fortune: 2.12, on: 2.66, tablets: 3.68,
  catch: 4.47, cold: 5.16, anyway: 5.29, and: 5.98, wonder: 6.31, wrong: 7.30, lets: 8.27, sort: 8.79, out: 9.12,
  your: 10.28, built: 11.33, own: 12.52, most: 13.34, start: 14.15, feel: 14.69, better: 14.95, within: 15.28, one: 15.74, two: 16.0, weeks: 16.25,
  daily: 17.45, didnt: 18.67, stop: 18.91, ordinary: 19.3, catching: 20.53, colds: 21.16, trials: 21.78,
  and3: 22.5, starting: 22.64, once: 23.52, ill: 24.04, made: 24.23, no: 24.67, consistent: 24.96, difference: 25.69,
  so: 26.93, eat: 27.47, orange: 27.85, skip: 28.41, fizzy: 28.67, tablets2: 29.03,
  heres: 30.55, holds: 31.31, up: 31.62,
  hot: 32.3, water: 32.79, lemon: 33.3, honey: 33.91, work: 34.36, about: 34.64, well: 35.26, cough: 35.93, syrup: 36.11,
  but: 36.39, never: 36.71, honey2: 37.29, baby: 37.92, under: 38.22, one2: 38.72,
  and5: 39.75, retire: 40.19, bowl: 40.7, towel: 42.04, theres: 42.38, strong: 43.41, evidence: 43.77, helps: 44.47,
  and6: 44.89, every2: 45.34, scalds: 46.27, especially: 47.3, children: 48.55,
  see: 49.88, doctor: 50.54, worse: 51.31, youre: 51.67, short: 51.93, breath: 52.54, chest: 53.42, pain: 53.77,
  or: 53.91, high: 54.53, temperature: 54.71, over: 56.19, days: 56.99, cough2: 57.49, weeks2: 58.79, cold3: 59.5, ten: 60.61, days2: 60.75,
  go: 61.86, sooner: 62.37, very: 62.92, high2: 63.18, longterm: 64.25, weak: 65.66, child: 67.74, about2: 69.07,
  if: 70.05, struggling: 70.67, swallow: 72.0, drooling: 73.07, get: 73.57, emergency: 73.82, help: 74.67,
  final: 76.09, factory: 77.3, settings: 77.67,
};

// ------------------------------------------------------------------ the set (metres; the skeleton faces +z; +x is its left)
const W = {}; window.HFS_W = W;
const SEAT = 0.47;                                                     // the stool's top
const SIDE = new THREE.Vector3(0.62, 0.62, 0.08);                      // the table at its left (the camera's right): vitamin C, coins; later the thermometer, the dial
const LEFT = new THREE.Vector3(-0.62, 0.62, 0.1);                      // the table at its right: the balance
// the low plinth in front of the skeleton, facing it and the camera: the days, the jars, the bowl
const PLINTH = { x: 0.0, z: 1.15, ry: 0, w: 0.45, d: 0.4, top: 0.36 };
const PL = (x, y, z) => new THREE.Vector3(PLINTH.x + x * Math.cos(PLINTH.ry) + z * Math.sin(PLINTH.ry), y, PLINTH.z - x * Math.sin(PLINTH.ry) + z * Math.cos(PLINTH.ry));
const RISE = [9.35, 10.35], SINK = [49.35, 50.35], RISE2 = [75.2, 76.1];
const plinthUp = (t) => s5(RISE[0], RISE[1], t) * (1 - s5(SINK[0], SINK[1], t)) + s5(RISE2[0], RISE2[1], t);
const pDyAt = (t) => -(PLINTH.top + 0.02) * (1 - plinthUp(t));
const DIAL = new THREE.Vector3(0, PLINTH.top, 0.02), DIAL_R = 0.062, LOGO_R = 0.048;                   // in the plinth's frame: it rises with it at the end
const THERMO = new THREE.Vector3(0.5, SIDE.y, -0.055);
const TUBE_R = 0.0135, TUBE_L = 0.105, PYR = { x: 0.69, z: 0.02 }, ORANGE_R = 0.0375;
const SNEEZE = T.cold + 0.03, STRIKE = T.skip;
const X = new THREE.Vector3(1, 0, 0), Y = new THREE.Vector3(0, 1, 0), Z = new THREE.Vector3(0, 0, 1);
const pulse = (t, a, b, r = 0.35) => ss(a, a + r, t) * (1 - ss(b - r, b, t));
// a thing that falls h metres and lands at t1, then bounces a little
const drop = (t, t1, h, b = 0.03) => { const tf = Math.sqrt((2 * h) / 9.81); if (t < t1 - tf) return h; if (t < t1) { const u = t1 - t; return 4.905 * u * u; } const u = t - t1; return b * h * Math.exp(-u * 9) * Math.abs(Math.sin(u * 22)); };
function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h, c);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.userData.canvas = c; return t;
}
function txt(x, s, px, py, { font = '800 100px Archivo', color = '#fff', align = 'center', track = 0, base = 'middle' } = {}) {
  x.font = font; x.letterSpacing = `${track}px`; x.fillStyle = color; x.textAlign = align; x.textBaseline = base; x.fillText(s, px, py);
}
const blackMat = () => phys({ color: 0x0d0e10, roughness: 0.32, clearcoat: 0.6, clearcoatRoughness: 0.25 });
function glassMat(color, { alpha = 0.1, rim = 0.55, pow = 2.0 } = {}) {
  return new THREE.ShaderMaterial({
    uniforms: { uC: { value: new THREE.Color(color) }, uA: { value: alpha }, uR: { value: rim }, uP: { value: pow }, uO: { value: 1 } },
    vertexShader: 'varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }',
    fragmentShader: 'uniform vec3 uC; uniform float uA, uR, uP, uO; varying vec3 vN; varying vec3 vV; void main(){ float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), uP); gl_FragColor = vec4(uC * (0.7 + 0.8 * f), (uA + uR * f) * uO); }',
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
  });
}
const lathe = (pts, n = 96) => new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), n);
const finish = (g) => { shadows(g); g.traverse((o) => o.layers.enable(1)); return g; };
// steam: soft sprites that rise, swell and fade, on a loop
let STEAM_TEX = null;
function makeSteam(parent, n, { r = 0.03, rise = 0.16, size = 0.05, life = 2.4, opacity = 0.16, arc = Math.PI * 2, at = 0, ring = 0 } = {}) {
  if (!STEAM_TEX) STEAM_TEX = softSprite();
  const ps = [];
  for (let i = 0; i < n; i++) {
    const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: STEAM_TEX, transparent: true, depthWrite: false, opacity: 0, color: 0xeef2f6 }));
    m.userData = { a: at + (hash(i * 3.7 + n) - 0.5) * arc, rr: ring + Math.sqrt(hash(i * 5.1 + n)) * r, ph: hash(i * 7.9 + n), sw: 0.5 + hash(i * 9.3 + n) };
    m.renderOrder = 7; m.visible = false; parent.add(m); ps.push(m);
  }
  return { ps, rise, size, life, opacity };
}
function setSteam(St, t, amt, y0 = 0) {
  for (const m of St.ps) {
    const d = m.userData, u = (((t / St.life + d.ph) % 1) + 1) % 1; m.visible = amt > 0.003; if (!m.visible) continue;
    m.position.set(Math.sin(d.a) * d.rr + 0.012 * Math.sin(t * 1.3 * d.sw + d.a) * u, y0 + St.rise * u, Math.cos(d.a) * d.rr + 0.01 * Math.cos(t * 1.1 * d.sw + d.a) * u);
    m.scale.setScalar(St.size * (0.5 + 1.2 * u)); m.material.opacity = St.opacity * amt * Math.pow(Math.sin(Math.PI * u), 1.5);
  }
}

// ------------------------------------------------------------------ the furniture
function makeStool(scene) {
  const g = new THREE.Group(); scene.add(g); const black = blackMat();
  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.035, 96), black); top.position.y = SEAT - 0.0175; g.add(top);
  for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2 + 0.5, leg = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.011, SEAT - 0.03, 20), black);
    leg.position.set(Math.cos(a) * 0.12, (SEAT - 0.03) / 2, Math.sin(a) * 0.12); leg.rotation.set(Math.sin(a) * 0.08, 0, -Math.cos(a) * 0.08); g.add(leg); }
  return finish(g);
}
function makeSideTable(scene, at, w = 0.34, d = 0.34) {
  const g = new THREE.Group(); g.position.set(at.x, 0, at.z); scene.add(g); const black = blackMat();
  const top = new THREE.Mesh(new RoundedBoxGeometry(w, 0.03, d, 4, 0.008), black); top.position.y = at.y - 0.015; g.add(top);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, at.y - 0.03, 32), black); stem.position.y = (at.y - 0.03) / 2; g.add(stem);
  const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.14, 0.02, 64), black); foot.position.y = 0.01; g.add(foot);
  return finish(g);
}

// ------------------------------------------------------------------ the beanie: a knitted hat fitted to the skull, 6 mm off the bone
function knitTex(base, seed) {
  return canvasTex(256, 256, (x, w, h) => {
    x.fillStyle = base; x.fillRect(0, 0, w, h);
    const cols = 8, rows = 8, cw = w / cols, rh = h / rows;
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const cx = (i + 0.5) * cw, cy = (j + 0.5) * rh, k = 0.85 + 0.3 * hash(i * 13.1 + j * 7.7 + seed);
      for (const s of [-1, 1]) {
        x.save(); x.translate(cx + s * cw * 0.2, cy); x.rotate(s * 0.55);
        const gr = x.createLinearGradient(0, -rh * 0.5, 0, rh * 0.5); gr.addColorStop(0, `rgba(255,255,255,${0.2 * k})`); gr.addColorStop(0.6, 'rgba(255,255,255,0.02)'); gr.addColorStop(1, 'rgba(0,0,0,0.35)');
        x.fillStyle = gr; x.beginPath(); x.ellipse(0, 0, cw * 0.2, rh * 0.62, 0, 0, Math.PI * 2); x.fill(); x.restore();
      }
      x.strokeStyle = 'rgba(0,0,0,0.28)'; x.lineWidth = 2; x.beginPath(); x.moveTo(cx, cy - rh * 0.5); x.lineTo(cx, cy + rh * 0.5); x.stroke();
    }
  });
}
function makeBeanie(R) {
  const head = R.seg.Atlas, vault = /^(frontal bone|left parietal bone|right parietal bone|occipital bone|left temporal bone|right temporal bone)$/i;
  const pts = []; for (const m of W.bones) if (vault.test(m.userData.name)) pts.push(...worldVerts(m, 2));
  const hull = new ConvexHull().setFromPoints(pts), faces = hull.faces.map((f) => ({ n: f.normal.clone(), w: f.constant }));
  const bb = new THREE.Box3().setFromPoints(pts), c = bb.getCenter(new THREE.Vector3());
  const exitR = (d) => { let m = 9; for (const f of faces) { const nd = f.n.dot(d); if (nd <= 1e-6) continue; const tt = (f.w - f.n.dot(c)) / nd; if (tt < m) m = tt; } return m; };
  const dirOf = (th, ph) => new THREE.Vector3(Math.sin(th) * Math.sin(ph), Math.cos(th), Math.sin(th) * Math.cos(ph));
  // the brim: a plane, high over the forehead (room for a note under it), lower over the back of the head
  const fb = R.byName.get('Frontal bone'), yF = fb.userData.home.y + 0.032, yB = yF - 0.05, zF = bb.max.z, zB = bb.min.z;
  const yCut = (z) => yB + ((yF - yB) * (z - zB)) / (zF - zB);
  const NA = 120, NS = 30, GROW = 0.006, CUFF = 0.008;
  const thB = [];
  for (let j = 0; j < NA; j++) { const ph = (j / NA) * Math.PI * 2; let lo = 0.15, hi = 2.7;
    for (let k = 0; k < 40; k++) { const m = (lo + hi) / 2, d = dirOf(m, ph), p = c.clone().addScaledVector(d, exitR(d) + GROW); if (p.y > yCut(p.z)) lo = m; else hi = m; }
    thB.push((lo + hi) / 2); }
  // the raw radius on a grid, then smoothed (never inside the raw one): a soft, convex hat
  const Rg = []; for (let i = 0; i <= NS; i++) { const row = []; for (let j = 0; j < NA; j++) row.push(exitR(dirOf(Math.max(1e-3, (i / NS) * thB[j]), (j / NA) * Math.PI * 2))); Rg.push(row); }
  const Rs = Rg.map((r) => r.slice());
  for (let pass = 0; pass < 6; pass++) { const Q = Rs.map((r) => r.slice());
    for (let i = 1; i < NS; i++) for (let j = 0; j < NA; j++) Q[i][j] = (Rs[i][j] * 4 + Rs[i][(j + 1) % NA] + Rs[i][(j + NA - 1) % NA] + Rs[i + 1][j] + Rs[i - 1][j]) / 8;
    for (let i = 0; i <= NS; i++) for (let j = 0; j < NA; j++) Rs[i][j] = Math.max(Q[i][j], Rg[i][j]); }
  const crown = (s) => 0.012 * (1 - s) * (1 - s);
  const P = (s, j, off) => { const i = s * NS, i0 = Math.min(NS - 1, Math.floor(i)), f = i - i0, r = lerp(Rs[i0][j], Rs[i0 + 1][j], f);
    return c.clone().addScaledVector(dirOf(Math.max(1e-3, s * thB[j]), (j / NA) * Math.PI * 2), r + GROW + off + crown(s)); };
  const rows = [];
  for (let i = 0; i <= NS; i++) rows.push((j) => P(i / NS, j, 0));                                   // the crown down to the brim
  const SC = 0.74;                                                                                     // the cuff, folded up over the lower quarter
  for (let k = 1; k <= 6; k++) { const a = (k / 7) * Math.PI;                                          // the rolled edge
    rows.push((j) => { const pin = P(1, j, 0), pout = P(1, j, CUFF), n = pout.clone().sub(pin).normalize(), dn = P(1, j, 0).sub(P(0.97, j, 0)).normalize();
      return pin.clone().add(pout).multiplyScalar(0.5).addScaledVector(n, -Math.cos(a) * CUFF / 2).addScaledVector(dn, Math.sin(a) * 0.004); }); }
  for (let i = 0; i <= 8; i++) { const s = 1 - (i / 8) * (1 - SC); rows.push((j) => P(s, j, CUFF)); }
  rows.push((j) => P(SC - 0.01, j, CUFF * 0.45)); rows.push((j) => P(SC - 0.025, j, 0.0012));
  const pos = [], uv = [], idx = []; let vacc = 0, prev = null;
  rows.forEach((f, ri) => { const ring = []; for (let j = 0; j <= NA; j++) ring.push(f(j % NA));
    if (prev) { let d = 0; for (let j = 0; j < NA; j += 8) d += ring[j].distanceTo(prev[j]); vacc += d / Math.ceil(NA / 8); }
    ring.forEach((p, j) => { pos.push(p.x, p.y, p.z); uv.push((j / NA) * 14, vacc / 0.05); }); prev = ring; });
  for (let r = 0; r < rows.length - 1; r++) for (let j = 0; j < NA; j++) { const a = r * (NA + 1) + j, b = a + 1, c2 = a + NA + 1, d = c2 + 1; idx.push(a, c2, b, b, c2, d); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx); geo.computeVertexNormals();
  const tex = knitTex('#9a2f36', 3); tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  const bump = knitTex('#808080', 3); bump.wrapS = bump.wrapT = THREE.RepeatWrapping; bump.colorSpace = THREE.NoColorSpace;
  const mat = new THREE.MeshPhysicalMaterial({ map: tex, bumpMap: bump, bumpScale: 1.2, roughness: 0.92, sheen: 0.7, sheenRoughness: 0.6, sheenColor: new THREE.Color(0xe08a8f), side: THREE.DoubleSide });
  const hat = new THREE.Mesh(geo, mat); hat.position.copy(head.pivot).negate(); hat.castShadow = true; hat.receiveShadow = true; hat.layers.enable(1); head.g.add(hat);
  // the pompom, on the crown
  const pg = new THREE.IcosahedronGeometry(0.024, 5), pp = pg.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < pp.count; i++) { v.fromBufferAttribute(pp, i); const n = v.clone().normalize(); const f = 1 + 0.1 * Math.sin(n.x * 41 + n.y * 13) * Math.sin(n.y * 37 + n.z * 11) + 0.07 * Math.sin(n.z * 53 + n.x * 29); v.copy(n).multiplyScalar(0.024 * f); pp.setXYZ(i, v.x, v.y, v.z); }
  pg.computeVertexNormals();
  const pom = new THREE.Mesh(pg, new THREE.MeshPhysicalMaterial({ color: 0xece6da, roughness: 1, sheen: 1, sheenColor: new THREE.Color(0xffffff), sheenRoughness: 0.8 }));
  const top = P(0, 0, 0); pom.position.copy(top).add(new THREE.Vector3(0, 0.017, 0)).sub(head.pivot); pom.castShadow = true; pom.layers.enable(1); head.g.add(pom);
  return { hat, pom, top, yF };
}

// ------------------------------------------------------------------ small props
// a sticky note: a yellow square, a little curved, stuck to the skull
function makeNote(text, tilt, S2 = 0.054) {
  const tex = canvasTex(512, 512, (x, w, h) => {
    x.fillStyle = '#f1dc69'; x.fillRect(0, 0, w, h);
    const gr = x.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(120,90,0,0.10)'); gr.addColorStop(0.16, 'rgba(120,90,0,0)'); gr.addColorStop(1, 'rgba(255,255,255,0.05)'); x.fillStyle = gr; x.fillRect(0, 0, w, h);
    x.save(); x.translate(w / 2, h / 2 + 18); x.rotate(tilt); txt(x, text, 0, 0, { font: '800 340px Archivo', color: '#1b1c1f' }); x.restore(); });
  const geo = new THREE.PlaneGeometry(S2, S2, 16, 16), P = geo.attributes.position;
  for (let i = 0; i < P.count; i++) { const x = P.getX(i), y = P.getY(i); P.setZ(i, -(x * x) / (2 * 0.07) - (y * y) / (2 * 0.11) + (y < -0.012 ? 0.06 * (y + 0.012) * (y + 0.012) * 40 : 0)); }
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, new THREE.MeshPhysicalMaterial({ map: tex, roughness: 0.85, side: THREE.DoubleSide, transparent: true }));
  m.castShadow = true; m.layers.enable(1); m.renderOrder = 2; return m;
}
// the sneeze: a spray of fine droplets
function makePuff(scene) {
  const N = 120, im = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.0021, 1), new THREE.MeshBasicMaterial({ color: 0xdfe8f1, transparent: true, opacity: 0.55, depthWrite: false }), N);
  im.frustumCulled = false; im.visible = false; im.renderOrder = 8; scene.add(im);
  const P = []; for (let i = 0; i < N; i++) { const a = hash(i * 1.13) * Math.PI * 2, r = Math.sqrt(hash(i * 2.71)) * 0.36;
    P.push({ d: new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r * 0.75, 1).normalize(), v: 1.1 + 1.9 * hash(i * 3.3), t: 0.1 * hash(i * 4.4), s: 0.6 + 0.9 * hash(i * 5.5) }); }
  return { im, P, N };
}
// coins: three little stacks, a small fortune
const STACKS = [[0.505, 0.2], [0.543, 0.163], [0.58, 0.207]];
const COIN_T = [...Array(18).keys()].map((i) => +(0.45 + i * 0.125).toFixed(3));                   // a small fortune, piling up from the first word
function makeCoins(scene) {
  const gold = phys({ color: 0xc9a54a, metalness: 1, roughness: 0.3, clearcoat: 0.3 }), geo = new THREE.CylinderGeometry(0.012, 0.012, 0.0022, 48);
  const rim = new THREE.TorusGeometry(0.0115, 0.0006, 6, 48); const coins = [];
  for (let i = 0; i < 18; i++) { const s = i % 3, k = Math.floor(i / 3), [x, z] = STACKS[s];
    const g = new THREE.Group(); const m = new THREE.Mesh(geo, gold); g.add(m);
    for (const sy of [-1, 1]) { const r = new THREE.Mesh(rim, gold); r.rotation.x = Math.PI / 2; r.position.y = sy * 0.0011; g.add(r); }
    g.userData = { x: x + (hash(i * 7.1) - 0.5) * 0.0025, z: z + (hash(i * 3.9) - 0.5) * 0.0025, y: SIDE.y + 0.0011 + k * 0.0022, ry: hash(i * 5.3) * 6.28, t: COIN_T[i] };
    g.visible = false; scene.add(finish(g)); coins.push(g); }
  return coins;
}
// a tube of fizzy vitamin C tablets, lying along z: the bottom toward the front, the white cap at the back
function makeTube(labelTex) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(TUBE_R, TUBE_R, TUBE_L * 0.86, 40), new THREE.MeshPhysicalMaterial({ map: labelTex, roughness: 0.35, clearcoat: 0.7, clearcoatRoughness: 0.2 }));
  body.rotation.x = Math.PI / 2; body.position.z = TUBE_L * 0.07; g.add(body);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(TUBE_R * 1.05, TUBE_R * 1.05, TUBE_L * 0.14, 40), phys({ color: 0xf1f1ee, roughness: 0.45, clearcoat: 0.4 }));
  cap.rotation.x = Math.PI / 2; cap.position.z = -TUBE_L * 0.43; g.add(cap);
  return finish(g);
}
function makeTubes(scene) {
  const lab = canvasTex(256, 512, (x, w, h) => {
    x.fillStyle = '#e9c13b'; x.fillRect(0, 0, w, h);
    for (const u of [0.25, 0.75]) { x.save(); x.translate(w * u, h / 2); x.rotate(-Math.PI / 2);
      x.fillStyle = '#fff6d8'; x.fillRect(-h * 0.36, -w * 0.13, h * 0.72, w * 0.26);
      txt(x, 'VITAMIN C', 0, 2, { font: '800 52px Archivo', color: '#7a5a00', track: 3 }); x.restore(); }
  });
  const tubes = []; let order = 0;
  for (let row = 0; row < 5; row++) for (let i = 0; i < 5 - row; i++) {
    const sp = 2 * TUBE_R + 0.0004, g = makeTube(lab);
    const p0 = new THREE.Vector3(PYR.x + (i - (4 - row) / 2) * sp, SIDE.y + TUBE_R + row * sp * Math.sin(Math.PI / 3), PYR.z);
    g.position.copy(p0); g.userData = { p0, row, order: order++, path: null }; scene.add(g); tubes.push(g);
  }
  return tubes;
}
// the strike: each tube flies off the table and comes to rest on the floor, none on top of another (simulated once)
function simTubes() {
  const dt = 1 / 240, done = [], onTable = (x, z) => Math.abs(x - SIDE.x) < 0.168 && Math.abs(z - SIDE.z) < 0.168;
  const segDist = (a, b) => {                                   // two tubes lying on the floor: the closest their axes come (2D)
    const P = (q) => [[q[0] - Math.sin(q[3]) * TUBE_L / 2, q[2] - Math.cos(q[3]) * TUBE_L / 2], [q[0] + Math.sin(q[3]) * TUBE_L / 2, q[2] + Math.cos(q[3]) * TUBE_L / 2]];
    const [a0, a1] = P(a), [b0, b1] = P(b);
    const ptSeg = (p, s0, s1) => { const dx = s1[0] - s0[0], dz = s1[1] - s0[1], u = clamp01(((p[0] - s0[0]) * dx + (p[1] - s0[1]) * dz) / (dx * dx + dz * dz)); return Math.hypot(p[0] - s0[0] - u * dx, p[1] - s0[1] - u * dz); };
    const cross = (o, a2, b2) => (a2[0] - o[0]) * (b2[1] - o[1]) - (a2[1] - o[1]) * (b2[0] - o[0]);
    if (cross(a0, a1, b0) * cross(a0, a1, b1) < 0 && cross(b0, b1, a0) * cross(b0, b1, a1) < 0) return 0;
    return Math.min(ptSeg(a0, b0, b1), ptSeg(a1, b0, b1), ptSeg(b0, a0, a1), ptSeg(b1, a0, a1)); };
  for (const tb of W.tubes) {
    const { p0, row, order } = tb.userData; let ok = null;
    for (let attempt = 0; attempt < 60 && !ok; attempt++) {
      const h = (k) => hash(order * 17.3 + attempt * 101.7 + k * 7.1);
      const t0 = STRIKE + (order ? 0.004 * order + 0.008 * h(1) : 0);
      const p = p0.clone(), v = new THREE.Vector3(0.75 + 0.6 * h(2), 0.2 + 0.45 * h(3) + 0.12 * row, (h(4) - 0.5) * 0.8);
      let yaw = 0, roll = 0, yawV = (h(5) - 0.5) * 18, rollV = (h(6) - 0.5) * 26, still = 0; const path = [];
      for (let k = 0; k < 240 * 3; k++) {
        path.push([p.x, p.y, p.z, yaw, roll]);
        v.y -= 9.81 * dt; p.addScaledVector(v, dt); yaw += yawV * dt; roll += rollV * dt;
        const ax = [Math.sin(yaw), Math.cos(yaw)], perp = v.x * ax[1] - v.z * ax[0];
        if (onTable(p.x, p.z) && p.y < SIDE.y + TUBE_R && p.y > SIDE.y - 0.05) { p.y = SIDE.y + TUBE_R; v.y = Math.max(0, v.y); v.x *= Math.exp(-2.2 * dt); v.z *= Math.exp(-2.2 * dt); yawV *= Math.exp(-5 * dt); rollV = perp / TUBE_R; }
        if (p.y < TUBE_R) { p.y = TUBE_R; if (v.y < -0.45) { v.y = -v.y * 0.22; v.x *= 0.72; v.z *= 0.72; yawV *= 0.5; } else v.y = 0; }
        if (p.y <= TUBE_R + 1e-5 && v.y === 0) { v.x *= Math.exp(-5.5 * dt); v.z *= Math.exp(-5.5 * dt); yawV *= Math.exp(-8 * dt); rollV = perp / TUBE_R; }
        if (p.y <= TUBE_R + 1e-5 && Math.hypot(v.x, v.z) < 0.004 && Math.abs(yawV) < 0.03) { if (++still > 4) break; }
      }
      const end = path[path.length - 1];
      const clear = done.every((q) => segDist(end, q.end) > 2 * TUBE_R + 0.006) && Math.hypot(end[0] - SIDE.x, end[2] - SIDE.z) > 0.2 && end[0] < 1.55 && end[0] > 0.82;
      if (clear || attempt === 59) ok = { t0, path, end };
    }
    tb.userData.path = ok; done.push(ok);
  }
}
function tubeAt(tb, t, q = new THREE.Quaternion()) {
  const P = tb.userData.path, p0 = tb.userData.p0;
  if (!P || t <= P.t0) { tb.position.copy(p0); tb.quaternion.identity(); return; }
  const f = (t - P.t0) * 240, i = Math.min(P.path.length - 1, Math.floor(f)), j = Math.min(P.path.length - 1, i + 1), u = Math.min(1, f - i), a = P.path[i], b = P.path[j];
  tb.position.set(lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u));
  tb.rotation.set(0, lerp(a[3], b[3], u), lerp(a[4], b[4], u), 'YXZ');
}
function makeOrange(scene) {
  const g = new THREE.Group(); scene.add(g);
  const bump = noiseTex(11, 256, 0.0, 1.0, 22); bump.colorSpace = THREE.NoColorSpace;
  const fruit = new THREE.Mesh(new THREE.SphereGeometry(ORANGE_R, 64, 48), phys({ color: 0xe9871f, roughness: 0.5, clearcoat: 0.35, clearcoatRoughness: 0.45, bumpMap: bump, bumpScale: 0.9 }));
  fruit.scale.y = 0.96; g.add(fruit);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.0028, 0.0042, 0.004, 12), phys({ color: 0x55602e, roughness: 0.7 })); stem.position.y = ORANGE_R * 0.96; g.add(stem);
  g.visible = false; return finish(g);
}
// where the orange is: dropped onto the table, a hop, a roll into the pyramid, then a slow roll on
const O_X = { land: 0.49, hit: 0.588, rest: 0.628, restZ: -0.06 };
function orangeAt(t) {
  const yb = SIDE.y + ORANGE_R * 0.96; let x;
  if (t < T.orange) { const u = (t - (T.orange - 0.3)) / 0.3; x = lerp(O_X.land - 0.03, O_X.land, clamp01(u)); }
  else if (t < STRIKE) x = lerp(O_X.land, O_X.hit, Math.pow((t - T.orange) / (STRIKE - T.orange), 1.1));
  else x = O_X.hit + (O_X.rest - O_X.hit) * (1 - Math.exp(-(t - STRIKE) * 3.2));
  const z = t < STRIKE ? PYR.z : PYR.z + (O_X.restZ - PYR.z) * (1 - Math.exp(-(t - STRIKE) * 3.2));
  const y = yb + drop(t, T.orange, 0.42, 0.035);
  return { x, y, z, vis: t > T.orange - 0.34 };
}

// ------------------------------------------------------------------ the plinth and what rises out of it
const ILL = [...Array(14).keys()].map((i) => +(13.55 + i * 0.065).toFixed(3));                    // the days of a cold, one by one
const BETTER = [...Array(8).keys()].map((i) => +(T.feel - 0.05 + i * 0.16).toFixed(3));          // day 7 to 14: feeling better
const DROPS = [...Array(14).keys()].map((i) => +(18.75 + i * 0.22).toFixed(3));                  // tissues, one jar then the other
const TAB = T.starting + 0.12;                                                                     // the tablet goes into the glass
const STAMP_HIT = T.retire;
const UPDN = { cal: [-9, -8, 16.8, 17.15], jars: [16.98, 17.45, 26.6, 27.1], bowl: [38.9, 39.5, 99, 99] };
const upOf = (k, t) => s5(UPDN[k][0], UPDN[k][1], t) * (1 - s5(UPDN[k][2], UPDN[k][3], t));
function makePlinth(scene) {
  const g = new THREE.Group(); g.position.set(PLINTH.x, 0, PLINTH.z); g.rotation.y = PLINTH.ry; scene.add(g);
  const box = new THREE.Mesh(new RoundedBoxGeometry(PLINTH.w, PLINTH.top, PLINTH.d, 5, 0.012), blackMat()); box.position.y = PLINTH.top / 2; g.add(box);
  finish(g); return { g, box };
}
// the days: two weeks on a board that leans back toward the camera
function makeCalendar(parent) {
  const g = new THREE.Group(); g.rotation.y = Math.PI / 2; parent.add(g);                         // facing +x: seen from that side, against the dark
  const Wd = 0.4, Hd = 0.2;
  const stand = new THREE.Group(); stand.position.set(0, PLINTH.top, 0.06); stand.rotation.x = -0.5; g.add(stand);
  const back = new THREE.Mesh(new RoundedBoxGeometry(Wd, Hd, 0.012, 3, 0.004), blackMat()); back.position.set(0, Hd / 2, -0.0062); stand.add(back);
  const leg = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.16, 0.008), blackMat()); leg.position.set(0, 0.07, -0.07); leg.rotation.x = 0.95; g.add(leg); leg.position.y += PLINTH.top;
  const head = canvasTex(1024, 96, (x, w, h) => { x.fillStyle = '#121316'; x.fillRect(0, 0, w, h); txt(x, 'DAYS', w / 2, h / 2 + 3, { font: '600 56px "Geist Mono"', color: '#a9acb3', track: 22 }); });
  const hdr = new THREE.Mesh(new THREE.PlaneGeometry(Wd - 0.03, (Wd - 0.03) * 96 / 1024), new THREE.MeshBasicMaterial({ map: head })); hdr.position.set(0, Hd - 0.026, 0.0004); stand.add(hdr);
  const check = canvasTex(128, 128, (x, w, h) => { x.clearRect(0, 0, w, h); x.strokeStyle = '#17181b'; x.lineWidth = 15; x.lineCap = 'round'; x.lineJoin = 'round'; x.beginPath(); x.moveTo(24, 66); x.lineTo(52, 94); x.lineTo(104, 34); x.stroke(); });
  const tileGeo = new RoundedBoxGeometry(0.046, 0.046, 0.005, 2, 0.004), tiles = [];
  for (let i = 0; i < 14; i++) {
    const tex = canvasTex(256, 256, (x, w, h) => { x.fillStyle = '#ffffff'; x.fillRect(0, 0, w, h); txt(x, String(i + 1), w / 2, h / 2 + 8, { font: '800 140px Archivo', color: '#1b1c1f' }); });
    const mat = new THREE.MeshPhysicalMaterial({ map: tex, color: 0x2b2d32, roughness: 0.5, clearcoat: 0.3 });
    const m = new THREE.Mesh(tileGeo, mat), col = i % 7, row = Math.floor(i / 7);
    m.position.set(-0.156 + col * 0.052, Hd - 0.083 - row * 0.058, 0.0026); stand.add(m);
    const ck = new THREE.Mesh(new THREE.PlaneGeometry(0.024, 0.024), new THREE.MeshBasicMaterial({ map: check, transparent: true, opacity: 0, depthWrite: false }));
    ck.position.set(m.position.x + 0.0115, m.position.y - 0.0115, 0.0056); ck.renderOrder = 3; stand.add(ck);
    tiles.push({ m, mat, ck });
  }
  finish(g); return { g, tiles };
}
// two jars of used tissues, and a glass with a fizzy tablet
function tissueGeo(seed) {
  const g = new THREE.IcosahedronGeometry(0.019, 3), P = g.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < P.count; i++) { v.fromBufferAttribute(P, i); const n = v.clone().normalize();
    const f = 1 + 0.2 * Math.sin(n.x * 9 + seed) * Math.sin(n.y * 11 + seed * 2) * Math.sin(n.z * 8 + seed * 3) + 0.09 * Math.sin(n.x * 23 + n.y * 17 + seed) + 0.05 * Math.sin(n.z * 31 + n.y * 7);
    v.copy(n).multiplyScalar(0.019 * f); P.setXYZ(i, v.x, v.y, v.z); }
  g.computeVertexNormals(); return g;
}
const JAR = { r: 0.042, h: 0.13, x: 0.088, z: -0.04 };                     // in the plinth's frame: the two jars sit at x = -0.088 and +0.088
function makeJars(parent) {
  const g = new THREE.Group(); g.rotation.y = Math.PI / 2; parent.add(g); const jars = [];
  const paper = new THREE.MeshPhysicalMaterial({ color: 0xf1f0eb, roughness: 0.92, sheen: 0.4, sheenColor: new THREE.Color(0xffffff) });
  const geos = [tissueGeo(1.3), tissueGeo(4.1), tissueGeo(7.7)];
  ['VITAMIN C', 'PLACEBO'].forEach((label, k) => {
    const jg = new THREE.Group(); jg.position.set(k ? JAR.x : -JAR.x, PLINTH.top, JAR.z); g.add(jg);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(JAR.r, JAR.r, 0.006, 64), glassMat(0xe4ecf5, { alpha: 0.12, rim: 0.3 })); base.position.y = 0.003; jg.add(base);
    const glass = new THREE.Mesh(lathe([[JAR.r, 0], [JAR.r + 0.001, 0.004], [JAR.r + 0.001, JAR.h - 0.012], [JAR.r - 0.004, JAR.h - 0.004], [JAR.r - 0.005, JAR.h]], 72), glassMat(0xe4ecf5, { alpha: 0.05, rim: 0.42, pow: 2.5 }));
    glass.renderOrder = 6; jg.add(glass);
    const lab = canvasTex(512, 112, (x, w, h) => { x.fillStyle = '#16171a'; x.fillRect(0, 0, w, h); txt(x, label, w / 2, h / 2 + 4, { font: '800 60px Archivo', color: '#eceef1', track: 5 }); });
    const lm = new THREE.Mesh(new THREE.CylinderGeometry(JAR.r + 0.0015, JAR.r + 0.0015, 0.024, 48, 1, true, -0.78, 1.56), new THREE.MeshPhysicalMaterial({ map: lab, roughness: 0.55, side: THREE.DoubleSide }));
    lm.position.y = 0.022; lm.renderOrder = 7; jg.add(lm);
    const tissues = [];
    for (let i = 0; i < 7; i++) { const layer = Math.floor(i / 3), a = (i % 3) * (Math.PI * 2 / 3) + layer * 1.05 + k * 0.4, rr = layer === 2 ? 0.004 : 0.0175;
      const m = new THREE.Mesh(geos[(i + k) % 3], paper); m.userData = { rest: new THREE.Vector3(Math.cos(a) * rr, 0.006 + 0.0185 + layer * 0.027, Math.sin(a) * rr), rot: new THREE.Euler(hash(i * 3 + k) * 6, hash(i * 5 + k) * 6, 0), t: DROPS[i * 2 + k] };
      m.visible = false; m.castShadow = true; jg.add(m); tissues.push(m); }
    jars.push({ jg, tissues });
  });
  // the glass, in front of the jars
  const gl = new THREE.Group(); gl.position.set(0, PLINTH.top, 0.1); g.add(gl);
  const tum = new THREE.Mesh(lathe([[0.0001, 0], [0.028, 0], [0.03, 0.004], [0.032, 0.095], [0.0305, 0.095], [0.0285, 0.006], [0.0001, 0.006]], 72), glassMat(0xe9f0f6, { alpha: 0.06, rim: 0.45, pow: 2.4 })); tum.renderOrder = 6; gl.add(tum);
  const water = new THREE.Mesh(new THREE.CylinderGeometry(0.0292, 0.0282, 0.064, 48), new THREE.MeshPhysicalMaterial({ color: 0xd9e6ef, roughness: 0.08, transparent: true, opacity: 0.32, depthWrite: false })); water.position.y = 0.006 + 0.032; water.renderOrder = 5; gl.add(water);
  const foam = new THREE.Mesh(new THREE.CircleGeometry(0.029, 48), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false })); foam.rotation.x = -Math.PI / 2; foam.position.y = 0.0705; foam.renderOrder = 6; gl.add(foam);
  const tab = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.0045, 32), phys({ color: 0xf4f2ea, roughness: 0.8 })); tab.visible = false; gl.add(tab);
  const NB = 70, bub = new THREE.InstancedMesh(new THREE.SphereGeometry(0.0013, 8, 6), new THREE.MeshBasicMaterial({ color: 0xf8fbff, transparent: true, opacity: 0.85, depthWrite: false }), NB);
  bub.frustumCulled = false; bub.renderOrder = 7; gl.add(bub);
  const ripple = new THREE.Mesh(new THREE.RingGeometry(0.004, 0.006, 40), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false })); ripple.rotation.x = -Math.PI / 2; ripple.position.y = 0.0707; gl.add(ripple);
  finish(g); bub.castShadow = false; water.castShadow = false; foam.castShadow = false; ripple.castShadow = false; tum.castShadow = false;
  return { g, jars, gl, water, foam, tab, bub, NB, ripple };
}
// the bowl of hot water under a towel; the stamp that retires it
const RIM = { r: 0.123, y: 0.077 };
function towelGeo() {
  const N = 56, S = 0.29, geo = new THREE.PlaneGeometry(S, S, N, N), P = geo.attributes.position, hang0 = RIM.y + 0.002;
  for (let i = 0; i < P.count; i++) {
    const xf = P.getX(i), zf = -P.getY(i), rho = Math.hypot(xf, zf), ph = Math.atan2(zf, xf);
    let x, y, z;
    if (rho <= RIM.r) { y = RIM.y + 0.0025 - 0.004 * (1 - (rho / RIM.r) ** 2); x = xf; z = zf; }
    else { const s = rho - RIM.r, hang = Math.min(s, hang0 - 0.003), fold = (0.006 * Math.sin(5 * ph + 1.3) + 0.0035 * Math.sin(9 * ph + 0.4)) * Math.min(1, s / 0.05);
      const rh = RIM.r + 0.0045 + 0.12 * hang + fold, flat = Math.max(0, s - hang);
      const r = rh + flat; y = flat > 0 ? 0.0028 : hang0 - hang;
      x = Math.cos(ph) * r; z = Math.sin(ph) * r; }
    P.setXYZ(i, x, y, z);
  }
  geo.computeVertexNormals(); return geo;
}
function makeBowl(parent) {
  const g = new THREE.Group(); g.rotation.y = -0.87; parent.add(g);                               // the stamp reads from the front-left camera
  const inner = new THREE.Group(); inner.position.set(0, PLINTH.top, 0); g.add(inner);
  const cer = phys({ color: 0xf1ede6, roughness: 0.3, clearcoat: 0.55, clearcoatRoughness: 0.18, side: THREE.DoubleSide });
  const bowl = new THREE.Mesh(lathe([[0.0001, 0], [0.058, 0], [0.064, 0.004], [0.1, 0.038], [0.119, 0.068], [RIM.r, RIM.y - 0.002], [RIM.r - 0.003, RIM.y], [0.116, 0.07], [0.097, 0.044], [0.058, 0.011], [0.0001, 0.009]], 128), cer); inner.add(bowl);
  const water = new THREE.Mesh(new THREE.CircleGeometry(0.108, 64), phys({ color: 0x9fb4c2, roughness: 0.05, clearcoat: 1, transparent: true, opacity: 0.7 })); water.rotation.x = -Math.PI / 2; water.position.y = 0.055; inner.add(water);
  const tt = canvasTex(512, 512, (x, w, h) => { x.fillStyle = '#dde4ea'; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 9000; i++) { const px = hash(i * 1.7) * w, py = hash(i * 2.3) * h, v = 190 + Math.floor(hash(i * 3.1) * 60); x.fillStyle = `rgba(${v},${v + 4},${v + 10},0.5)`; x.fillRect(px, py, 2, 2); }
    x.fillStyle = '#3c5a7a'; for (const y0 of [0.08, 0.86]) x.fillRect(0, h * y0, w, h * 0.05); });
  const towel = new THREE.Mesh(towelGeo(), new THREE.MeshPhysicalMaterial({ map: tt, roughness: 0.95, sheen: 0.8, sheenColor: new THREE.Color(0xffffff), sheenRoughness: 0.7, side: THREE.DoubleSide }));
  inner.add(towel);
  const U = stamp(towel, { canvas: stampCanvas(['RETIRED'], '', { frame: true }), center: [0, RIM.y - 0.006, 0], normal: [0, 1, 0], up: [0, 0, -1], width: 0.19, depth: 0.06, ink: 0xb02a2f, opacity: 0, rough: 0.7 });
  // the rubber stamp
  const st = new THREE.Group(); inner.add(st);
  const block = new THREE.Mesh(new RoundedBoxGeometry(0.2, 0.026, 0.085, 3, 0.004), phys({ color: 0x6b4428, roughness: 0.6, clearcoat: 0.2 })); block.position.y = 0.013 + 0.005; st.add(block);
  const rubber = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.005, 0.075), phys({ color: 0x8e2127, roughness: 0.7 })); rubber.position.y = 0.0025; st.add(rubber);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.016, 0.07, 32), phys({ color: 0x6b4428, roughness: 0.55, clearcoat: 0.3 })); neck.position.y = 0.031 + 0.035; st.add(neck);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.03, 40, 28), phys({ color: 0x1b1c1f, roughness: 0.35, clearcoat: 0.6 })); knob.scale.y = 0.8; knob.position.y = 0.1 + 0.02; st.add(knob);
  st.visible = false;
  const steam = makeSteam(inner, 20, { r: 0.015, ring: RIM.r + 0.012, rise: 0.24, size: 0.085, life: 2.4, opacity: 0.26, arc: 2.6, at: 0 });
  finish(g); water.castShadow = false;
  return { g, inner, towel, U, st, steam };
}

// ------------------------------------------------------------------ the balance: hot water with lemon and honey against cough syrup
const BAL = { arm: 0.16, top: 0.27, hang: 0.17 };
const MUG_T = T.water - 0.02, LEMON_T = T.lemon + 0.12, DIP_T = T.honey + 0.1;
const BEAM = [[-99, 0.2], [MUG_T, 0.1], [LEMON_T, 0.05], [DIP_T, 0.0]];             // the beam's tilt after each landing (+: the mug's side up)
function beamAngle(t) { let th = BEAM[0][1]; for (let i = 1; i < BEAM.length; i++) { const [ti, v] = BEAM[i]; if (t < ti) break; const u = t - ti; th += (v - BEAM[i - 1][1]) * (1 - Math.exp(-3.2 * u) * Math.cos(7.5 * u)); } return th; }
function makeBalance(scene) {
  const g = new THREE.Group(); g.position.copy(LEFT); scene.add(g);
  const alu = phys({ color: 0xcdcac4, metalness: 1, roughness: 0.3, clearcoat: 0.4 }), dark = blackMat();
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.062, 0.018, 64), dark); base.position.y = 0.009; g.add(base);
  const col = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.01, BAL.top - 0.018, 32), alu); col.position.y = 0.018 + (BAL.top - 0.018) / 2; g.add(col);
  const fin = new THREE.Mesh(new THREE.SphereGeometry(0.011, 24, 16), alu); fin.position.y = BAL.top + 0.012; g.add(fin);
  const beam = new THREE.Group(); beam.position.y = BAL.top; g.add(beam);
  const bar = new THREE.Mesh(new RoundedBoxGeometry(2 * BAL.arm + 0.02, 0.009, 0.012, 2, 0.003), alu); beam.add(bar);
  const pans = [];
  for (const s of [-1, 1]) {
    const hg = new THREE.Group(); hg.position.x = s * BAL.arm; beam.add(hg);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.006, 0.0018, 12, 24), alu); ring.position.y = -0.004; hg.add(ring);
    const yoke = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V(-0.078, -BAL.hang + 0.004, 0), V(-0.078, -0.07, 0), V(-0.05, -0.022, 0), V(0, -0.01, 0), V(0.05, -0.022, 0), V(0.078, -0.07, 0), V(0.078, -BAL.hang + 0.004, 0)]), 64, 0.0016, 8), alu);
    hg.add(yoke);
    const pan = new THREE.Mesh(lathe([[0.0001, 0], [0.068, 0], [0.078, 0.008], [0.08, 0.01], [0.0775, 0.0105], [0.067, 0.003], [0.0001, 0.003]], 96), phys({ color: 0x77756f, metalness: 0.55, roughness: 0.55, clearcoat: 0.1 })); pan.position.y = -BAL.hang - 0.003; hg.add(pan);
    pans.push({ hg, pan, s });
  }
  // the cough syrup, on the left pan
  const syr = new THREE.Group(); pans[0].hg.add(syr); syr.position.y = -BAL.hang;
  const amber = phys({ color: 0x4e1d0c, roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.05 });
  syr.add(new THREE.Mesh(lathe([[0.0001, 0], [0.024, 0], [0.026, 0.004], [0.026, 0.09], [0.022, 0.104], [0.011, 0.112], [0.011, 0.124], [0.0001, 0.124]], 64), amber));
  const capm = new THREE.Mesh(new THREE.CylinderGeometry(0.0125, 0.0125, 0.024, 40), phys({ color: 0xf0f0ec, roughness: 0.5 })); capm.position.y = 0.124 + 0.012; syr.add(capm);
  const sl = canvasTex(512, 256, (x, w, h) => { x.fillStyle = '#f2efe6'; x.fillRect(0, 0, w, h); x.fillStyle = '#1d3d63'; x.fillRect(0, 0, w, h * 0.18); x.fillRect(0, h * 0.82, w, h * 0.18);
    txt(x, 'COUGH', w / 2, h * 0.38, { font: '800 74px Archivo', color: '#1b1c1f', track: 4 }); txt(x, 'SYRUP', w / 2, h * 0.64, { font: '800 74px Archivo', color: '#1b1c1f', track: 4 }); });
  const lab = new THREE.Mesh(new THREE.CylinderGeometry(0.0263, 0.0263, 0.05, 48, 1, true, -1.1, 2.2), new THREE.MeshPhysicalMaterial({ map: sl, roughness: 0.55, side: THREE.DoubleSide })); lab.position.y = 0.045; syr.add(lab);
  // the mug of hot water with lemon and honey, dropped onto the right pan
  const mug = new THREE.Group(); g.add(mug);
  const cer = phys({ color: 0xf1ede6, roughness: 0.3, clearcoat: 0.55, clearcoatRoughness: 0.18, side: THREE.DoubleSide });
  mug.add(new THREE.Mesh(lathe([[0.0001, 0], [0.034, 0], [0.036, 0.003], [0.039, 0.085], [0.0352, 0.085], [0.0335, 0.008], [0.0001, 0.007]], 72), cer));
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.02, 0.0055, 20, 48, Math.PI * 1.15), cer); handle.position.set(0.0385, 0.045, 0); handle.rotation.z = -Math.PI * 0.575; mug.add(handle);
  const drink = new THREE.Mesh(new THREE.CircleGeometry(0.0345, 48), phys({ color: 0xd9b45e, roughness: 0.05, clearcoat: 1, transparent: true, opacity: 0.9 })); drink.rotation.x = -Math.PI / 2; drink.position.y = 0.07; mug.add(drink);
  const lt = canvasTex(256, 256, (x, w, h) => { x.fillStyle = '#d9c34a'; x.beginPath(); x.arc(w / 2, h / 2, w / 2, 0, Math.PI * 2); x.fill(); x.fillStyle = '#f3e7a6'; x.beginPath(); x.arc(w / 2, h / 2, w * 0.43, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#e8cf5c'; for (let i = 0; i < 9; i++) { const a0 = (i / 9) * Math.PI * 2 + 0.06, a1 = ((i + 1) / 9) * Math.PI * 2 - 0.06; x.beginPath(); x.moveTo(w / 2, h / 2); x.arc(w / 2, h / 2, w * 0.4, a0, a1); x.closePath(); x.fill(); } });
  const lemon = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.0045, 40), new THREE.MeshPhysicalMaterial({ map: lt, roughness: 0.4, clearcoat: 0.5 })); mug.add(lemon);
  const dip = new THREE.Group(); mug.add(dip);
  const wood = phys({ color: 0xb98a55, roughness: 0.55, clearcoat: 0.3 }), honeyM = phys({ color: 0xc9861b, roughness: 0.15, clearcoat: 1, transmission: 0, emissive: new THREE.Color(0x5a3200), emissiveIntensity: 0.15 });
  const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.0028, 0.0032, 0.13, 16), wood); stick.position.y = 0.03 + 0.065; dip.add(stick);
  const headD = new THREE.Mesh(lathe([[0.0001, 0], [0.006, 0.001], [0.0095, 0.004], [0.0075, 0.008], [0.0095, 0.012], [0.0075, 0.016], [0.0095, 0.02], [0.0075, 0.024], [0.009, 0.028], [0.004, 0.032], [0.003, 0.034]], 40), honeyM); dip.add(headD);
  const steam = makeSteam(mug, 8, { r: 0.022, rise: 0.12, size: 0.04, life: 2.2, opacity: 0.13 });
  finish(g); drink.castShadow = false;
  return { g, beam, pans, syr, mug, lemon, dip, steam };
}
const DIP_A = new THREE.Vector3(-0.017, 0.012, 0.004), DIP_D = new THREE.Vector3(0.55, 0.835, 0).normalize();   // the dipper's foot in the mug, and its lean on the rim

// ------------------------------------------------------------------ the thermometer: no numbers; a high band and a very high band
const TH = { y0: 0.045, h: 0.235, high: 0.62, vhigh: 0.82 };
function makeThermo(scene) {
  const g = new THREE.Group(); g.position.copy(THERMO); g.rotation.y = 0.35; scene.add(g);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.033, 0.012, 48), blackMat()); base.position.y = 0.006; g.add(base);
  const PH = 0.3, PW = 0.056;
  const yPx = (s, h) => h * (1 - (TH.y0 + s * TH.h - 0.012) / PH);
  const tex = canvasTex(320, 1712, (x, w, h) => {
    x.fillStyle = '#efede7'; x.fillRect(0, 0, w, h);
    x.fillStyle = '#e1b43c'; x.fillRect(w * 0.08, yPx(TH.vhigh, h), w * 0.2, yPx(TH.high, h) - yPx(TH.vhigh, h));
    x.fillStyle = '#c4323a'; x.fillRect(w * 0.08, yPx(1.0, h), w * 0.2, yPx(TH.vhigh, h) - yPx(1.0, h));
    x.strokeStyle = '#55585f'; for (let i = 0; i <= 40; i++) { const y = yPx(i / 40, h), big = i % 5 === 0; x.lineWidth = big ? 5 : 3; x.beginPath(); x.moveTo(w * 0.64, y); x.lineTo(w * (big ? 0.86 : 0.76), y); x.stroke(); }
  });
  const plate = new THREE.Mesh(new RoundedBoxGeometry(PW, PH, 0.008, 3, 0.006), new THREE.MeshPhysicalMaterial({ map: tex, roughness: 0.4, clearcoat: 0.5 })); plate.position.set(0, 0.012 + PH / 2, -0.004); g.add(plate);
  const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.0055, 0.0055, TH.h + 0.012, 24), glassMat(0xeef3f8, { alpha: 0.14, rim: 0.5 })); glass.position.set(0, TH.y0 + TH.h / 2, 0.0065); glass.renderOrder = 6; g.add(glass);
  const red = phys({ color: 0xcf2a31, roughness: 0.2, clearcoat: 1, emissive: new THREE.Color(0xcf2a31), emissiveIntensity: 0.3 });
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.0098, 32, 24), red); bulb.position.set(0, TH.y0 - 0.006, 0.0065); g.add(bulb);
  const col = new THREE.Mesh(new THREE.CylinderGeometry(0.0029, 0.0029, 1, 16), red); col.position.set(0, TH.y0, 0.0065); g.add(col);
  finish(g); glass.castShadow = false; g.visible = false;
  return { g, col, red };
}
const LEVEL = [[-9, 0.4], [T.high, 0.4], [T.high + 0.8, 0.72], [T.very, 0.72], [T.high2 + 0.5, 0.93]];

// ------------------------------------------------------------------ the dial: days, 0 to 14 over 270 degrees; 7 to 14 in orange
const ANG = (v) => ((-135 + (270 / 14) * v) * Math.PI) / 180;
function makeDial(parent) {
  const g = new THREE.Group(); g.position.copy(DIAL); parent.add(g);
  const dark = phys({ color: 0x121316, roughness: 0.38, clearcoat: 0.6, clearcoatRoughness: 0.25 }), alu = phys({ color: 0xcdcac4, metalness: 1, roughness: 0.3, clearcoat: 0.4 });
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(DIAL_R + 0.01, DIAL_R + 0.013, 0.012, 128), dark); plate.position.y = 0.006; g.add(plate);
  const bezel = new THREE.Mesh(new THREE.TorusGeometry(DIAL_R + 0.003, 0.003, 20, 160), alu); bezel.rotation.x = Math.PI / 2; bezel.position.y = 0.0125; g.add(bezel);
  const tex = canvasTex(1024, 1024, (x, w) => { const R = w / 2; x.fillStyle = '#0b0c0e'; x.fillRect(0, 0, w, w);
    for (let v = 0; v <= 14; v++) { const a = ANG(v), big = v % 7 === 0, r0 = R * (big ? 0.77 : 0.83), r1 = R * 0.9; x.strokeStyle = big ? '#e7e9ec' : '#8d9097'; x.lineWidth = big ? 7 : 3.5; x.beginPath(); x.moveTo(R + Math.sin(a) * r0, R - Math.cos(a) * r0); x.lineTo(R + Math.sin(a) * r1, R - Math.cos(a) * r1); x.stroke();
      if (big) txt(x, String(v), R + Math.sin(a) * R * 0.62, R - Math.cos(a) * R * 0.62, { font: '600 76px Archivo', color: '#e7e9ec' }); }
    txt(x, 'DAYS', R, R * 1.45, { font: '500 42px "Geist Mono"', color: '#9a9da4', track: 10 }); });
  const faceMat = new THREE.MeshPhysicalMaterial({ map: tex, roughness: 0.42, clearcoat: 0.5, emissive: new THREE.Color(0xffffff), emissiveMap: tex, emissiveIntensity: 0.08, transparent: true });
  const face = new THREE.Mesh(new THREE.CircleGeometry(DIAL_R, 128), faceMat); face.rotation.x = -Math.PI / 2; face.position.y = 0.0122; face.renderOrder = 1; g.add(face);
  const flat = new THREE.Group(); flat.rotation.x = -Math.PI / 2; flat.position.y = 0.0128; g.add(flat);
  const setM = new THREE.Mesh(new THREE.RingGeometry(DIAL_R * 0.905, DIAL_R * 0.965, 64, 1, Math.PI / 2 - ANG(14), ANG(14) - ANG(7)), new THREE.MeshBasicMaterial({ color: ORANGE.clone().multiplyScalar(1.6), transparent: true, opacity: 0, depthWrite: false })); setM.renderOrder = 2; flat.add(setM);
  const n = new THREE.Group(); n.position.y = 0.0135; g.add(n);
  const nmat = new THREE.MeshPhysicalMaterial({ color: 0xf2f3f5, roughness: 0.35, clearcoat: 0.6, emissive: new THREE.Color(0xffffff), emissiveIntensity: 0.25, transparent: true });
  const bar = new THREE.Mesh(new THREE.BoxGeometry(0.002, 0.0009, DIAL_R * 0.86), nmat); bar.position.z = -DIAL_R * 0.43 + 0.007; bar.renderOrder = 3; n.add(bar);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.0045, 0.0045, 0.002, 40), nmat); hub.renderOrder = 3; n.add(hub);
  const logo = makeLogoRing(LOGO_R); logo.g.rotation.x = -Math.PI / 2; logo.g.position.y = 0.0142; logo.g.traverse((o) => { o.renderOrder = 4; }); g.add(logo.g);
  finish(g); face.castShadow = false; g.visible = false;
  return { g, faceMat, setM, n, nmat, logo };
}
const V = (x, y, z) => new THREE.Vector3(x, y, z);

// ------------------------------------------------------------------ build
const NOTE = { text: '?', at: [0, -0.008], rot: 0.08, slap: T.wrong, peel: T.sort };
const CERV = ['Seventh cervical vertebra', 'Sixth cervical vertebra', 'Fifth cervical vertebra', 'Fourth cervical vertebra', 'Third cervical vertebra', 'Axis', 'Atlas'];
async function build(S, cfg) {
  const scene = S.scene;
  S.fog.near = 4; S.fog.far = 14;
  S.table.scale.set(3, 3, 1); S.tableMat.clearcoat = 0.1; S.tableMat.specularIntensity = 0.3;
  for (const m of [S.tableMat.map, S.tableMat.roughnessMap]) if (m) { m.wrapS = m.wrapT = THREE.RepeatWrapping; m.repeat.multiplyScalar(3); }
  const meshes = await loadAnatomy(skeletonKind());
  const R = W.rig = buildRig(meshes, {});
  W.body = new THREE.Group(); scene.add(W.body); R.root.position.copy(R.P0).negate(); W.body.add(R.root);
  for (const m of meshes) { m.castShadow = true; m.receiveShadow = true; m.layers.enable(1); }
  W.bones = meshes.filter((m) => ['bone', 'tooth', 'cartilage'].includes(m.userData.tissue));
  W.hand = {}; for (const Side of ['Right', 'Left']) { const Wr = makeWrist(R, Side); W.hand[Side] = rigHand(R, Side, Wr); W.hand[Side].wr = Wr; }
  // ---- the factory stamp: on the front of the breastbone, across it
  { const st = R.byName.get('Body of sternum'); st.material = st.material.clone();
    W.stampSpot = stampSpot(st, { from: [0, 0.006, 0.12], dir: [0, 0, -1], spread: 0.004 });
    if (W.stampSpot) W.stamp = stamp(st, { canvas: stampCanvas(['HUMAN FACTORY', 'SETTINGS'], '', { frame: false }), center: W.stampSpot.center, normal: W.stampSpot.normal, up: [0, 1, 0], width: 0.04, depth: 0.03, opacity: 0.6 }); }
  // ---- the beanie, and the sticky note under it
  W.beanie = makeBeanie(R);
  { const fb = R.byName.get('Frontal bone'), N = NOTE;
    const sp = stampSpot(fb, { from: [N.at[0], N.at[1], 0.15], dir: [0, 0, -1], spread: 0.006 }) || { center: [N.at[0], N.at[1], 0.05], normal: [0, 0, 1] };
    const m = makeNote(N.text, N.rot * 0.4), nrm = new THREE.Vector3(...sp.normal), up = new THREE.Vector3(0, 1, 0).sub(nrm.clone().multiplyScalar(nrm.y)).normalize();
    const q = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3().crossVectors(up, nrm), up, nrm)).multiply(new THREE.Quaternion().setFromAxisAngle(Z, N.rot));
    const home = new THREE.Vector3(...sp.center).addScaledVector(nrm, 0.0015);
    m.position.copy(home); m.quaternion.copy(q); m.visible = false; fb.add(m);
    W.note = { m, home, q, nrm, N }; }
  // ---- the chest: a red glow behind the breastbone (chest pain)
  { const T7 = R.seg['Seventh thoracic vertebra'], st = R.byName.get('Body of sternum'), c = st.userData.home.clone().lerp(T7.pivot, 0.45).add(new THREE.Vector3(0.012, -0.01, 0));
    W.chestG = new THREE.Group(); W.chestG.position.copy(c).sub(T7.pivot); T7.g.add(W.chestG);
    W.chestLight = new THREE.PointLight(0xff3b30, 0, 0.32, 2); W.chestG.add(W.chestLight);
    W.chestGlow = glowSprite(new THREE.Color(0xff4436), 0.16); W.chestGlow.material.opacity = 0; W.chestG.add(W.chestGlow); }
  // ---- seated on the stool
  W.stool = makeStool(scene);
  const hipB = new THREE.Box3(); for (const m of meshes) if (/hip bone/i.test(m.userData.name)) for (const v of worldVerts(m, 3)) hipB.expandByPoint(v);
  W.sitP = new THREE.Vector3(0, SEAT + 0.001 + (R.P0.y - hipB.min.y), -0.02);
  // ---- the set
  W.sideG = makeSideTable(scene, SIDE); W.leftG = makeSideTable(scene, LEFT, 0.32, 0.32);
  W.coins = makeCoins(scene); W.tubes = makeTubes(scene); simTubes(); W.orange = makeOrange(scene);
  W.plinth = makePlinth(scene); W.cal = makeCalendar(W.plinth.g); W.jars = makeJars(W.plinth.g); W.bowl = makeBowl(W.plinth.g);
  W.bal = makeBalance(scene); W.thermo = makeThermo(scene); W.dial = makeDial(W.plinth.g); W.puff = makePuff(scene);
  // ---- the sneeze: where it comes from and which way it goes (the head as it is at that moment)
  { poseBody(SNEEZE + 0.02); W.body.updateMatrixWorld(true);
    const mx = W.bones.filter((m) => /maxilla/i.test(m.userData.name)); let best = null; const v = new THREE.Vector3();
    for (const m of mx) { const P = m.geometry.attributes.position; for (let i = 0; i < P.count; i += 2) { v.fromBufferAttribute(P, i).applyMatrix4(m.matrixWorld); if (Math.abs(v.x) < 0.012 && (!best || v.z > best.z)) best = v.clone(); } }
    const q = R.seg.Atlas.g.getWorldQuaternion(new THREE.Quaternion());
    W.puffFrom = best.clone().add(new THREE.Vector3(0, 0.0, 0.012).applyQuaternion(q)); W.puffQ = q.clone().multiply(new THREE.Quaternion().setFromAxisAngle(X, 0.22)); }
  // ---- light
  W.key = spot(scene, { color: 0xffe9d2, pos: new THREE.Vector3(-1.4, 2.6, 1.8), target: new THREE.Vector3(0, 0.9, 0.1), angle: 0.42, penumbra: 0.8, shadow: true, size: cfg.shadow ?? 1024 });
  W.key.shadow.camera.far = 7;
  W.rim = spot(scene, { color: 0xa9c4ff, pos: new THREE.Vector3(1.2, 2.2, -1.8), target: new THREE.Vector3(0, 1.0, 0), angle: 0.5, penumbra: 0.9 });
  W.fill = spot(scene, { color: 0xc8d6ff, pos: new THREE.Vector3(1.8, 1.2, 1.4), target: new THREE.Vector3(0, 0.9, 0), angle: 0.55, penumbra: 1 });
  W.plinthLight = spot(scene, { color: 0xfff1d8, pos: PL(0.25, 1.95, 1.0), target: PL(0, PLINTH.top + 0.08, 0), angle: 0.3, penumbra: 0.75 });
  W.sideLight = spot(scene, { color: 0xffe9d2, pos: new THREE.Vector3(1.3, 1.6, 0.9), target: SIDE.clone().add(new THREE.Vector3(0, 0.05, 0)), angle: 0.3, penumbra: 0.8 });
  W.leftLight = spot(scene, { color: 0xffe9d2, pos: new THREE.Vector3(-0.15, 2.0, 1.1), target: LEFT.clone().add(new THREE.Vector3(0, 0.15, 0)), angle: 0.3, penumbra: 0.8 });
  W.faceLight = spot(scene, { color: 0xfff1e2, pos: new THREE.Vector3(0.5, 1.6, 1.2), target: new THREE.Vector3(0, 1.3, 0.05), angle: 0.22, penumbra: 0.8 });
  W.floorLight = spot(scene, { color: 0xffe9d2, pos: new THREE.Vector3(1.6, 1.5, 1.0), target: new THREE.Vector3(1.1, 0, 0.1), angle: 0.32, penumbra: 0.9 });
  W.auditSolids = [['stool', W.stool], ['hat', W.beanie.hat], ['pompom', W.beanie.pom], ['plinth', W.plinth.g, { floor: false }], ['balance', W.bal.g], ['thermometer', W.thermo.g], ['orange', W.orange],
    ...W.tubes.map((tb, i) => ['tube ' + i, tb]), ...W.coins.map((c, i) => ['coin ' + i, c])];
  W.timing = {
    coins: COIN_T, sneeze: SNEEZE, ah: [4.62, SNEEZE - 0.03], slap: NOTE.slap, peel: NOTE.peel, rise: RISE, sink: SINK, rise2: RISE2, ill: ILL, better: BETTER, calDown: [UPDN.cal[2], UPDN.cal[3]],
    jarsUp: [UPDN.jars[0], UPDN.jars[1]], jarsDown: [UPDN.jars[2], UPDN.jars[3]], drops: DROPS, tab: TAB, fizz: [TAB + 0.1, 25.6],
    orangeLand: T.orange, orangeRoll: [T.orange + 0.2, STRIKE], strike: STRIKE, tubeLand: W.tubes.map((tb) => tubeLandings(tb)).flat().sort((a, b) => a - b),
    tubeTable: W.tubes.map((tb) => tb.userData.path.t0),
    mug: MUG_T, lemon: LEMON_T, dip: DIP_T, level: [T.about, T.well + 0.3], bowlUp: [UPDN.bowl[0], UPDN.bowl[1]], stamp: STAMP_HIT, stampDown: STAMP_HIT - 0.3, stampUp: [STAMP_HIT + 0.15, STAMP_HIT + 0.6],
    steamBowl: [39.2, 49.0], scald: T.scalds, slump: [50.7, 51.7], sob: [51.6, 54.3], chest: [T.chest - 0.1, 54.6], thermoUp: [T.high, T.high + 0.8], thermoUp2: [T.very, T.high2 + 0.5], sitUp: [75.0, 76.0],
    dialUp: T.final - 0.3, needle: [T.final + 0.2, T.settings - 0.1], arc: T.settings, logo: T.logo,
  };
  return { stamp: W.stampSpot, sitP: W.sitP.toArray(), puff: W.puffFrom && W.puffFrom.toArray().map((v) => +v.toFixed(3)), tubesEnd: W.tubes.map((tb) => tb.userData.path.end.map((v) => +v.toFixed(3))) };
}
function tubeLandings(tb) {                              // when a tube hits the floor (for the sound): the steps where it stops falling
  const P = tb.userData.path, out = []; if (!P) return out;
  for (let i = 2; i < P.path.length; i++) { const a = P.path[i - 2][1], b = P.path[i - 1][1], c = P.path[i][1]; if (b <= TUBE_R + 1e-4 && a > b + 1e-5 && c >= b) out.push(+(P.t0 + (i - 1) / 240).toFixed(3)); }
  return out.slice(0, 2);
}

// ------------------------------------------------------------------ the body over time
const ARM_REST = { dir: [0.15, -0.92, 0.4], twist: 0.8, elbow: 1.0 };   // hands resting on the belly
const HEAD_TURN = [[-9, 0.32], [4.1, 0.32], [4.6, 0], [27.25, 0], [27.75, 0.42], [29.9, 0.42], [30.6, -0.4], [39.0, -0.4], [39.6, 0], [54.1, 0], [54.8, 0.2], [61.5, 0.2], [62.3, 0]];
const HEAD_NOD = [[-9, 0.12], [4.1, 0.12], [4.55, 0], [9.6, 0], [10.3, 0.15], [26.8, 0.15], [27.4, 0.08], [30.0, 0.08], [30.6, 0.1], [39.0, 0.1], [39.6, 0.17], [49.2, 0.17], [49.8, 0.02]];
const HEAD_TILT = [[-9, 0], [6.3, 0], [6.95, 0.16], [9.3, 0.16], [9.95, 0]];
function sneezeAt(t) {
  const ah = s5(4.62, 5.1, t) * (1 - s5(SNEEZE - 0.06, SNEEZE + 0.03, t));
  const choo = s5(SNEEZE - 0.06, SNEEZE + 0.08, t) * (1 - s5(SNEEZE + 0.2, SNEEZE + 0.95, t));
  return { nod: -0.22 * ah + 0.42 * choo, tho: -0.04 * ah + 0.13 * choo, sh: 0.045 * ah };
}
const _qa = new THREE.Quaternion();
function poseBody(t) {
  const R = W.rig, sn = sneezeAt(t), sl = s5(50.7, 51.7, t) * (1 - s5(75.0, 76.0, t)), sb = pulse(t, 51.6, 54.3, 0.4);
  const br = 0.5 + 0.5 * Math.sin((t / 4.2) * Math.PI * 2), fast = 0.5 + 0.5 * Math.sin((t / 1.05) * Math.PI * 2);
  bendSpine(R.seg, { lum: -0.05 + 0.05 * sl, tho: 0.06 + sn.tho + 0.15 * sl });
  const turn = keys(HEAD_TURN, t), nod = 0.05 + keys(HEAD_NOD, t) + sn.nod + 0.12 * sl, tilt = keys(HEAD_TILT, t);
  for (const nm of CERV) { const s = R.seg[nm]; if (!s) continue; s.g.rotation.x += nod / 7; s.g.rotation.y += turn / 7; s.g.rotation.z += tilt / 7; }
  for (const Side of ['Right', 'Left']) { poseArm(R.arms[Side], ARM_REST); setWrist(W.hand[Side].wr, { wf: 0.15 }); W.hand[Side].curl(0.22); }
  const sh = 0.02 * br * (1 - sb) + 0.045 * fast * sb + sn.sh;
  R.arms.Right.girdle.rotation.z += -sh; R.arms.Left.girdle.rotation.z += sh;
  clearArms(R);
  W.body.quaternion.identity(); W.body.position.copy(W.sitP); W.body.updateMatrixWorld(true);
  for (const Side of ['Right', 'Left']) {
    const G = R.legs[Side]; _qa.setFromAxisAngle(X, -Math.PI / 2); G.hip.quaternion.copy(_qa);
    const tgt = new THREE.Vector3(W.sitP.x + G.s * 0.13, G.A.y - G.ground + 0.002, W.sitP.z + 0.44);
    legIK(R, Side, tgt, new THREE.Quaternion(), Z);
  }
  W.body.updateMatrixWorld(true);
  return { sl, sb };
}

// ------------------------------------------------------------------ the camera: one path, no cuts
let CAM = null;
function buildCam() {
  const D = DIAL_W();
  return camTrack([
    { t: -3.0, p: V3(0.54, 1.0, 1.25), l: V3(0.62, 0.741, 0.074), fov: 30 },
    { t: 0.0, p: V3(0.53, 0.975, 1.16), l: V3(0.622, 0.741, 0.074), fov: 30, tens: 0.3 },              // the table: a pyramid of vitamin C, coins piling up
    { t: 3.3, p: V3(0.535, 0.952, 1.04), l: V3(0.625, 0.738, 0.07), fov: 30, stop: true },
    { t: 4.15, p: V3(0.472, 1.224, 1.364), l: V3(-0.034, 1.366, 0.112), fov: 30, stop: true },          // the head: the sneeze, the note
    { t: 9.55, p: V3(0.462, 1.222, 1.344), l: V3(-0.034, 1.366, 0.112), fov: 30, stop: true },
    { t: 10.55, p: V3(0.254, 1.046, 2.393), l: V3(0.005, 1.296, 0.028), fov: 30, stop: true },          // built to beat a cold: from a little below
    { t: 12.3, p: V3(0.236, 1.05, 2.32), l: V3(0.005, 1.296, 0.028), fov: 30, stop: true },
    { t: 13.5, p: V3(1.32, 1.342, 1.15), l: V3(-0.036, 0.528, 1.15), fov: 30, stop: true },             // the days, from the side, against the dark
    { t: 16.8, p: V3(1.29, 1.33, 1.15), l: V3(-0.036, 0.528, 1.15), fov: 30, stop: true },
    { t: 17.55, p: V3(0.978, 0.866, 1.15), l: V3(0.005, 0.473, 1.15), fov: 30, stop: true },             // the jars, the glass
    { t: 26.45, p: V3(0.96, 0.86, 1.15), l: V3(0.005, 0.473, 1.15), fov: 30, stop: true },
    { t: 27.35, p: V3(0.736, 1.218, 1.27), l: V3(0.629, 0.747, 0.046), fov: 30, stop: true },           // the strike
    { t: 29.9, p: V3(0.74, 1.2, 1.25), l: V3(0.629, 0.747, 0.046), fov: 30, stop: true },
    { t: 30.95, p: V3(-0.4, 1.36, 2.35), l: V3(-0.1, 1.15, 0.05), fov: 30 },                               // past the skeleton
    { t: 32.15, p: V3(-1.721, 1.547, 1.538), l: V3(-0.58, 0.872, 0.077), fov: 30, stop: true },          // the balance
    { t: 39.0, p: V3(-1.7, 1.54, 1.52), l: V3(-0.58, 0.872, 0.077), fov: 30, stop: true },
    { t: 39.85, p: V3(-0.621, 1.671, 1.681), l: V3(0.054, 0.459, 1.115), fov: 30, stop: true },         // the bowl, from the front-left
    { t: 49.1, p: V3(-0.6, 1.65, 1.65), l: V3(0.054, 0.459, 1.115), fov: 30, stop: true },
    { t: 49.95, p: V3(0.288, 2.049, 2.026), l: V3(0.006, 1.274, 0.026), fov: 30, stop: true },          // getting worse: from above
    { t: 53.75, p: V3(0.28, 2.03, 2.0), l: V3(0.006, 1.274, 0.026), fov: 30, stop: true },
    { t: 54.85, p: V3(0.931, 1.527, 1.16), l: V3(0.558, 0.837, -0.142), fov: 30, stop: true },          // the thermometer
    { t: 63.8, p: V3(0.92, 1.52, 1.14), l: V3(0.558, 0.837, -0.142), fov: 30, stop: true },
    { t: 65.3, p: V3(2.252, 1.103, 3.99), l: V3(0.054, 1.103, 0.184), fov: 34, stop: true },            // wide, then slowly closer
    { t: 68.0, p: V3(1.8, 1.4, 3.0), l: V3(0.03, 1.15, 0.12), fov: 32 },
    { t: 70.5, p: V3(1.067, 1.942, 1.522), l: V3(0.003, 1.303, 0.003), fov: 30, stop: true },           // the head and the neck
    { t: 75.3, p: V3(1.05, 1.93, 1.5), l: V3(0.003, 1.303, 0.003), fov: 30, stop: true },
    { t: 76.45, p: V3(D.x + 0.17, D.y + 0.62, D.z + 0.24), l: V3(D.x, D.y, D.z), fov: 30 },              // the dial, up out of the plinth
    { t: T.logo, p: V3(D.x, D.y + 0.706, D.z + 0.005), l: V3(D.x, D.y, D.z), fov: 30, stop: true },      // straight down on the dial: the logo
  ]);
}
function camPose(S, t) {
  const v = S.cfg.view; if (v && typeof v === 'object') return v;
  if (!CAM) CAM = buildCam();
  if (t <= T.logo) { const P = CAM(t), k = s5(75.4, 76.3, t); if (k <= 0) return P;                // the end: the dial stays centred on the way in
    const c = DIAL_W().toArray(); return { ...P, l: P.l.map((v, i) => lerp(v, c[i], k)) }; }
  const Q = CAM(T.logo), k = ss(T.logo, T.end, t); return { p: [Q.p[0], lerp(Q.p[1], Q.p[1] - 0.04, k), Q.p[2]], l: Q.l, fov: 30 };
}
const DIAL_W = () => PL(DIAL.x, PLINTH.top + 0.0142, DIAL.z);                                              // the dial's face once the plinth is up
function focusAt(S, t, P) { return Math.hypot(P.p[0] - P.l[0], P.p[1] - P.l[1], P.p[2] - P.l[2]); }

// ------------------------------------------------------------------ one moment of the film
const _v = new THREE.Vector3(), _w = new THREE.Vector3(), _q = new THREE.Quaternion(), _m4 = new THREE.Matrix4(), _s3 = new THREE.Vector3();
function update(S, t) {
  const scene = S.scene, endDark = ss(T.final + 0.3, T.logo - 0.3, t);
  const o = poseBody(t);
  // ---- the note: slapped onto the forehead on "wrong"; peeled off after "let's sort it out", it flutters away
  { const { m, home, q, nrm, N } = W.note, a = (t - N.slap) / 0.16;
    if (t < N.slap - 0.16 || t > N.peel + 1.1) m.visible = false;
    else { m.visible = true;
      if (t < N.slap) { const u = clamp01(1 + a); m.position.copy(home).addScaledVector(nrm, 0.25 * (1 - u) * (1 - u)); m.quaternion.copy(q); m.material.opacity = u; m.scale.setScalar(1); }
      else if (t < N.peel) { const bnc = Math.exp(-(t - N.slap) * 22) * Math.sin((t - N.slap) * 60) * 0.06; m.position.copy(home); m.quaternion.copy(q); m.scale.set(1 + bnc, 1 - bnc, 1); m.material.opacity = 1; }
      else { const u = (t - N.peel) / 1.1, f = s5(0, 1, u);
        m.position.copy(home).addScaledVector(nrm, 0.01 + 0.2 * f).add(_v.set(0.03 * Math.sin(u * 7 + 0.7), -0.16 * u * u, 0));
        m.quaternion.copy(q).multiply(_q.setFromAxisAngle(X, -1.1 * f)).multiply(_q.setFromAxisAngle(Z, 0.6 * Math.sin(u * 5 + 0.4)));
        m.material.opacity = 1 - ss(0.45, 1, u); m.scale.setScalar(1); } } }
  // ---- the sneeze: fine droplets, forward and a little down, slowing in the air
  { const Pf = W.puff, u0 = t - SNEEZE; Pf.im.visible = u0 > 0 && u0 < 1.6;
    if (Pf.im.visible) { Pf.P.forEach((p, i) => { const u = u0 - p.t; let sc = 0;
        if (u > 0) { const d = _v.copy(p.d).applyQuaternion(W.puffQ), k = 3.2, s = (p.v * (1 - Math.exp(-k * u))) / k;
          _w.copy(W.puffFrom).addScaledVector(d, s); _w.y -= 0.12 * u * u; sc = p.s * (1 - ss(0.6, 1.45, u)) * (1 + 0.8 * u); }
        _m4.compose(sc > 0 ? _w : _v.set(0, -5, 0), _q.identity(), _s3.setScalar(Math.max(0.001, sc))); Pf.im.setMatrixAt(i, _m4); });
      Pf.im.instanceMatrix.needsUpdate = true; Pf.im.material.opacity = 0.55 * (1 - ss(0.9, 1.6, u0)); } }
  // ---- the coins: a small fortune, stacked one by one
  for (const c of W.coins) { const d = c.userData; c.visible = t > d.t - 0.31; c.position.set(d.x, d.y + drop(t, d.t, 0.45, 0.004), d.z); c.rotation.set(0.15 * Math.exp(-Math.max(0, t - d.t) * 10) * Math.sin(Math.max(0, t - d.t) * 40), d.ry, 0); }
  // ---- the pyramid, the orange, the strike
  for (const tb of W.tubes) tubeAt(tb, t);
  { const O = orangeAt(t); W.orange.visible = O.vis; W.orange.position.set(O.x, O.y, O.z); W.orange.rotation.set((O.z - PYR.z) / ORANGE_R, 0, -(O.x - (O_X.land - 0.03)) / ORANGE_R); }
  // ---- the plinth: the days, then the jars, then the bowl
  const pDy = pDyAt(t), pUp = plinthUp(t);
  W.plinth.g.position.y = pDy; W.plinth.g.visible = pUp > 0.001;
  { const C = W.cal, up = upOf('cal', t); C.g.visible = up > 0.001; C.g.position.y = -0.23 * (1 - up);
    C.tiles.forEach((tl, i) => { const ill = ss(ILL[i] - 0.06, ILL[i] + 0.06, t), bi = i - 6, bet = bi >= 0 ? ss(BETTER[bi] - 0.06, BETTER[bi] + 0.08, t) : 0;
      tl.mat.color.setRGB(lerp(lerp(0.13, 0.3, ill), 1, bet), lerp(lerp(0.14, 0.35, ill), 1, bet), lerp(lerp(0.16, 0.46, ill), 1, bet));
      tl.mat.emissive.setScalar(0.06 * bet); tl.m.position.z = 0.0026 + 0.003 * Math.sin(Math.PI * clamp01((t - ILL[i] + 0.06) / 0.18)); tl.ck.material.opacity = bet; }); }
  { const J = W.jars, up = upOf('jars', t); J.g.visible = up > 0.001; J.g.position.y = -0.15 * (1 - up);
    if (J.g.visible) {
      J.jars.forEach((jr) => jr.tissues.forEach((m) => { const d = m.userData; m.visible = t > d.t - 0.34; if (!m.visible) return; const h = drop(t, d.t, 0.55, 0.02);
        m.position.copy(d.rest); m.position.y += h; m.rotation.copy(d.rot); m.rotation.x += 2.5 * h; }));
      const fz = pulse(t, TAB + 0.1, 25.6, 0.3), yTab = t < TAB ? 0.0703 + drop(t, TAB, 0.3, 0) : Math.max(0.0083, 0.0703 - 0.12 * (t - TAB));
      J.tab.visible = t > TAB - 0.26 && t < 25.6; J.tab.position.set(0.003, yTab, -0.002); J.tab.rotation.set(0.3 * Math.exp(-Math.max(0, t - TAB) * 3), 0, 0.2);
      J.tab.scale.setScalar(Math.max(0.05, 1 - 0.85 * s5(TAB + 0.2, 25.4, t)));
      J.water.material.color.setRGB(lerp(0.85, 0.96, ss(TAB, TAB + 1.5, t)), lerp(0.9, 0.88, ss(TAB, TAB + 1.5, t)), lerp(0.94, 0.58, ss(TAB, TAB + 1.5, t)));
      J.foam.material.opacity = 0.45 * fz; const ru = (t - TAB) / 0.6; J.ripple.material.opacity = ru > 0 && ru < 1 ? 0.6 * (1 - ru) : 0; J.ripple.scale.setScalar(1 + 3.5 * clamp01(ru));
      for (let i = 0; i < J.NB; i++) { const sp = 0.05 + 0.05 * hash(i * 2.1), ph = hash(i * 3.7), a = hash(i * 5.3) * 6.28, rr = 0.004 + 0.02 * Math.sqrt(hash(i * 7.9)), u = ((t * sp) / 0.06 + ph) % 1;
        const vis = fz > 0.01; _m4.compose(_v.set(Math.cos(a) * rr * (0.4 + 0.6 * u), 0.008 + u * 0.06, Math.sin(a) * rr * (0.4 + 0.6 * u)), _q.identity(), _s3.setScalar(vis ? Math.max(0.001, fz * (0.6 + 0.8 * u)) : 0.001)); J.bub.setMatrixAt(i, _m4); }
      J.bub.instanceMatrix.needsUpdate = true; J.bub.visible = fz > 0.01; } }
  { const B = W.bowl, up = upOf('bowl', t); B.g.visible = up > 0.001 && t < 50.5; B.g.position.y = -0.2 * (1 - up);
    const h = t < STAMP_HIT ? drop(t, STAMP_HIT, 0.45, 0) : t < STAMP_HIT + 0.15 ? 0 : 0.45 * s5(STAMP_HIT + 0.15, STAMP_HIT + 0.65, t);
    B.st.visible = t > STAMP_HIT - 0.32 && t < STAMP_HIT + 0.66; B.st.position.set(0, RIM.y + 0.0008 + h, 0); B.st.scale.y = t > STAMP_HIT && t < STAMP_HIT + 0.15 ? 0.97 : 1;
    B.U.uStampO.value = t > STAMP_HIT ? 0.88 : 0;
    setSteam(B.steam, t, B.g.visible ? (0.7 + 0.6 * pulse(t, T.scalds - 0.3, 48.4, 0.5)) * (1 - ss(48.6, 49.3, t)) : 0, RIM.y - 0.01); }
  // ---- the balance: the mug lands, then the lemon, then the honey; level at "about as well"
  { const Bl = W.bal, th = beamAngle(t); Bl.beam.rotation.z = th; for (const p of Bl.pans) p.hg.rotation.z = -th;
    const panTop = (s) => _v.set(s * BAL.arm * Math.cos(th), BAL.top + s * BAL.arm * Math.sin(th) - BAL.hang, 0);
    const pr = panTop(1).clone(); Bl.mug.visible = t > MUG_T - 0.3; Bl.mug.position.set(pr.x, pr.y + drop(t, MUG_T, 0.4, 0.02), 0);
    const lh = t < LEMON_T ? drop(t, LEMON_T, 0.3, 0) : 0.0015 * Math.exp(-(t - LEMON_T) * 3) * Math.sin((t - LEMON_T) * 14);
    Bl.lemon.visible = t > LEMON_T - 0.26; Bl.lemon.position.set(-0.004, 0.071 + lh, 0.006); Bl.lemon.rotation.set(0.05 * Math.sin(t * 1.3), 0, 0.04);
    const dh = t < DIP_T ? drop(t, DIP_T, 0.3, 0) / DIP_D.y : 0; Bl.dip.visible = t > DIP_T - 0.26;
    Bl.dip.position.copy(DIP_A).addScaledVector(DIP_D, dh); Bl.dip.quaternion.setFromUnitVectors(Y, DIP_D);
    setSteam(Bl.steam, t, Bl.mug.visible ? 1 - ss(39.0, 39.8, t) : 0, 0.072); }
  // ---- the thermometer
  { const Th = W.thermo, s = keys(LEVEL, t); Th.g.visible = t > 33.0; Th.col.scale.y = Math.max(0.001, s * TH.h); Th.col.position.y = TH.y0 + (s * TH.h) / 2;
    Th.red.emissiveIntensity = 0.3 + 0.5 * pulse(t, T.very, 69.6, 0.5); }
  // ---- the chest: short of breath, chest pain
  { const k = pulse(t, T.chest - 0.15, 54.8, 0.3), beat = 0.6 + 0.4 * Math.sin(t * 7.5); W.chestLight.intensity = 0.25 * k * beat; W.chestGlow.material.opacity = 0.75 * k * beat; W.chestGlow.visible = k > 0.002; }
  // ---- the dial rises at the end: days; 7 to 14 in orange; the logo
  { const D = W.dial, up = s5(T.final - 0.3, T.final + 0.4, t); D.g.position.y = DIAL.y - 0.03 * (1 - up); D.g.visible = up > 0.001;
    const v = lerp(0, 14, s5(T.final + 0.2, T.settings - 0.1, t)); D.n.rotation.y = -ANG(v); D.nmat.opacity = 1 - ss(T.logo - 0.6, T.logo - 0.2, t);
    D.setM.material.opacity = ss(T.settings - 0.2, T.settings + 0.3, t) * (1 - ss(T.logo - 0.6, T.logo - 0.2, t)); D.faceMat.opacity = 1 - 0.85 * ss(T.settings, T.logo - 0.2, t);
    const logoK = s5(T.final + 0.4, T.logo - 0.25, t); D.logo.set({ weight: logoK, white: logoK, hours: 0, hand: ss(T.logo - 0.4, T.logo - 0.15, t), handScale: outBack(clamp01((t - (T.logo - 0.4)) / 0.35), 1.8) }); }
  // ---- light
  const fig = 1 - endDark;
  W.key.intensity = 16 * fig; W.rim.intensity = 3.0 * fig; W.fill.intensity = 1.0 * fig;
  W.plinthLight.intensity = 6 * pUp * fig; W.sideLight.intensity = 3.2 * fig; W.leftLight.intensity = 2.0 * fig;
  W.faceLight.intensity = 2.2 * (pulse(t, -1, 10.2, 0.6) + pulse(t, 49.6, 54.3, 0.5) + pulse(t, 69.8, 76.0, 0.6)) * fig;
  W.floorLight.intensity = 2.0 * ss(STRIKE, STRIKE + 0.4, t) * fig;
  S.tableMat.color.setScalar(0.35 * (1 - endDark * 0.9)); scene.environmentIntensity = 0.12 * (1 - endDark); S.reflAmt = 0.6 * (1 - endDark);
}

// ------------------------------------------------------------------ the words on screen
const CAPS = [
  { t0: T.every, t1: 4.4, top: 292, size: 82, html: 'Every winter, you spend<br>a <em>small fortune</em><br>on vitamin C tablets,' },
  { t0: T.catch, t1: 7.95, top: 292, size: 86, html: 'catch a <em>cold</em> anyway,<br>and wonder<br>what went <em>wrong</em>.' },
  { t0: T.lets, t1: 9.95, top: 300, size: 92, html: 'Let’s <em>sort it out</em>.' },
  { t0: T.your, t1: 13.2, top: 292, size: 86, html: 'Your body was built<br>to beat a cold<br><em>on its own</em>,' },
  { t0: T.most, t1: 16.9, top: 292, size: 86, html: 'and most people<br>start to feel better<br>within <em>1 to 2 weeks</em>.' },
  { t0: T.daily, t1: 22.4, top: 292, size: 82, html: 'Daily vitamin C<br><em>didn’t stop</em> ordinary<br>people catching colds<br>in trials,' },
  { t0: T.and3, t1: 26.65, top: 292, size: 84, html: 'and starting it<br>once you’re ill made<br><em>no consistent</em><br><em>difference</em>.' },
  { t0: T.so, t1: 30.3, top: 292, size: 88, html: 'So eat the <em>orange</em><br>and skip the<br>fizzy tablets.' },
  { t0: T.heres, t1: 32.15, top: 300, size: 92, html: 'Here’s what<br><em>holds up</em>.' },
  { t0: T.hot, t1: 36.3, top: 292, size: 82, html: 'Hot water with lemon<br>and honey can work<br><em>about as well</em><br>as cough syrup,' },
  { t0: T.but, t1: 39.45, top: 292, size: 86, html: 'but <em>never</em> give honey<br>to a baby under one.' },
  { t0: T.and5, t1: 42.3, top: 292, size: 88, html: 'And <em>retire</em> the bowl<br>of hot water<br>under a towel:' },
  { t0: T.theres, t1: 44.85, top: 292, size: 88, html: 'there’s <em>no strong</em><br><em>evidence</em> it helps,' },
  { t0: T.and6, t1: 49.5, top: 292, size: 84, html: 'and every winter<br>it <em>scalds</em> people,<br>especially<br>young children.' },
  { t0: T.see, t1: 51.6, top: 292, size: 86, html: 'See a <em>doctor</em><br>if you’re getting worse,' },
  { t0: T.youre, t1: 53.85, top: 292, size: 86, html: 'you’re short of breath<br>or have <em>chest pain</em>,' },
  { t0: T.or, t1: 57.42, top: 292, size: 86, html: 'or a high temperature<br>lasts over <em>3 days</em>,' },
  { t0: T.cough2, t1: 61.55, top: 292, size: 86, html: 'a cough over <em>3 weeks</em>,<br>or the cold<br>over <em>10 days</em>.' },
  { t0: T.go, t1: 65.55, top: 292, size: 80, html: 'Go <em>sooner</em> with<br>a very high temperature,<br>a long-term condition,' },
  { t0: T.weak, t1: 69.85, top: 292, size: 80, html: 'a weak immune system,<br>or a child<br>you’re worried about.' },
  { t0: T.if, t1: 73.5, top: 292, size: 82, html: 'If you’re struggling<br>to breathe, or can’t<br>swallow or are drooling,' },
  { t0: T.get, t1: 75.6, top: 300, size: 92, html: 'get <em>emergency help</em>.' },
  { t0: T.final, t1: 99, top: 360, size: 92, html: 'Let’s get you back to<br><em>factory settings.</em>' },
];
const OVL = {};
function overlayInit(S) {
  const O = S.O, tag = (cls, txt2, size, bsize) => { const e = O.tag(cls, txt2); e.style.fontSize = size + 'px'; const b = e.querySelector('b'); if (b && bsize) b.style.fontSize = bsize + 'px'; return e; };
  OVL.honey = tag('tag', 'Under 1 year<b>no honey</b>', 22, 40);
  OVL.evid = tag('tag', 'Evidence it helps<b>not strong</b>', 22, 40);
  OVL.scald = tag('tag', 'Scalds<b>especially young children</b>', 22, 34);
  OVL.temp = tag('tag', 'Temperature<b>over 3 days</b>', 22, 36);
  OVL.cough = tag('tag', 'Cough<b>over 3 weeks</b>', 22, 36);
  OVL.coldt = tag('tag', 'Cold<b>over 10 days</b>', 22, 36);
  OVL.vhigh = tag('tag', 'Very high<b>go sooner</b>', 22, 36);
}
function overlay(S, t) {
  const Bl = W.bal; Bl.mug.updateWorldMatrix(true, false);
  place(S, OVL.honey, Bl.mug.localToWorld(_v.set(0, 0.085, 0)), -120, -250, pulse(t, T.never, 39.0));
  const bw = PL(0, PLINTH.top + pDyAt(t) + 0.08, 0);
  place(S, OVL.evid, bw, -448, -414, pulse(t, T.theres + 0.1, 44.8));
  place(S, OVL.scald, bw, -448, -414, pulse(t, T.every2, 49.1));
  const th = W.thermo.g; th.updateWorldMatrix(true, false);
  place(S, OVL.temp, th.localToWorld(_v.set(0.04, 0.3, 0)), 30, -40, pulse(t, T.over - 0.1, 61.4));
  place(S, OVL.cough, th.localToWorld(_v.set(0.04, 0.3, 0)), 30, 60, pulse(t, T.cough2 + 0.25, 61.4));
  place(S, OVL.coldt, th.localToWorld(_v.set(0.04, 0.3, 0)), 30, 160, pulse(t, T.cold3 + 0.15, 61.4));
  place(S, OVL.vhigh, th.localToWorld(_v.set(0.04, TH.y0 + 0.93 * TH.h, 0)), 30, -40, pulse(t, T.very, 66.0));
  const c = DIAL_W();
  logoEnd(S, t, { t0: T.logo, center: c, edge: c.clone().add(new THREE.Vector3(0, 0, LOGO_R)) });
}

makeFilm({
  T, caps: CAPS, subs: [], build, update, pose: camPose, overlay, overlayInit, focus: focusAt,
  stage: { bg: 0x07080a, reflSize: 6, env: 0.12, far: 30 },
  aperture: [[0, 0.003], [4.35, 0.003], [10.55, 0.002], [13.5, 0.002], [17.55, 0.003], [27.35, 0.003], [32.15, 0.002], [39.85, 0.002], [49.95, 0.002], [54.85, 0.003], [65.3, 0.0015], [70.5, 0.002], [76.4, 0.003]],
  bloom: [[0, 0.45], [76, 0.55]],
  fast: [[3.2, 4.25, 2], [9.45, 10.65, 2], [12.2, 13.6, 2], [16.7, 17.65, 2], [26.35, 27.45, 2], [29.8, 32.25, 2], [38.9, 39.95, 2], [49.0, 50.05, 2], [53.65, 54.95, 2], [63.7, 65.4, 2], [68.0, 70.6, 2], [75.2, 76.5, 2]],
});

// Human Factory Settings · Film 13 "Lower back pain" (new direction, 7 Oct 2026) · one continuous shot, 9:16.
// A skeleton lies in bed under a white sheet with two black eyes on it, a candle burning by the bed: a Victorian ghost.
// Its lower back glows. "Let's get you up": the sheet flies off, the skeleton springs upright on the end of the bed and
// hops down. A gold trophy, No. 1 cause of disability worldwide, and confetti (the gag). A light box: ten case films, nine
// stamped NON-SPECIFIC; disc scans of people with no back pain, a hundred at 20 and a hundred at 80, the worn discs going
// dark (37, then 96). Grey hair for the spine: grey tufts sprout from its lumbar discs. Built to move: it bends, leans,
// twists and marches on the spot. A name card on the mattress, PHYSIOTHERAPIST, flips over: MATTRESS. The warnings,
// plainly; the nerves of the lower back and both legs. A disc model on a pedestal, seen from above, becomes the logo.
// The factory stamp is on the back of the sacrum.
import { THREE, ss, s5, lerp, clamp01, hash, keys, camTrack, phys, glowMat, glowSprite, shadows, spot, RoundedBoxGeometry,
  loadAnatomy, V3, place, logoEnd, makeFilm, outBack, stamp, stampCanvas, stampSpot, noiseTex } from '../kit.js';
import { buildRig, skeletonKind, legIK, bendSpine, poseArm, worldVerts, avgV, clearArms, standApply, ARM0 } from '../rig.js';
import { makeLogoRing } from '../props.js';

//@HANDS@

// ------------------------------------------------------------------ timing, from the voice guide (word starts)
const T = {
  end: 80.29, logo: 77.77,
  your: 0.35, back: 0.79, hurts: 1.01, spend: 1.67, weekend: 1.99, bed: 2.54, like: 3.03, victorian: 3.61, ghost: 4.19,
  lets: 5.26, get: 5.78, you: 5.94, up: 6.14,
  lower: 7.19, number: 8.56, one: 8.78, cause: 9.03, disability: 9.68, earth: 10.88, yet: 11.16, nine: 11.78, ten: 13.0, doctors: 13.38, cant: 14.25, disease: 15.53, damage: 16.24,
  worn: 17.76, discs: 18.23, scan: 18.96, normal: 19.36, over: 19.85, third: 20.58, painfree: 21.1, twenty: 21.64, have: 22.75, and: 23.33, almost: 23.83, every: 24.36, eighty: 25.41,
  its: 26.94, grey: 27.29, hair: 27.64, spine: 28.17,
  your2: 29.39, built: 30.3, move: 30.67, pain: 31.23, eases: 32.33, weeks: 33.31, so: 33.7, stay: 34.08, active: 34.37, carry: 35.32,
  your3: 36.33, mattress: 36.77, not: 37.41, physio: 37.75,
  see: 39.67, doctor: 40.33, better: 41.05, stops: 42.53, daily: 43.25, its2: 44.05, worse: 44.45, night: 45.01, lose: 45.7, weight: 46.12, theres: 47.39, lump: 47.93, worried: 49.37,
  get2: 50.96, urgent: 51.62, hot: 52.92, or2: 54.64, sudden: 55.84, severe: 56.49, worse2: 57.69, fast: 58.22,
  and2: 59.09, emergency: 59.71, pain2: 60.63, both: 63.4, legs: 63.76, numbness2: 64.19, bladder: 67.09, changed: 69.31, chest: 71.22, serious: 73.08, accident: 73.74,
  final: 75.51, factory: 76.72, settings: 77.09,
};

// ------------------------------------------------------------------ the set (metres, floor at y = 0): the skeleton ends up standing at the origin, facing +z
const W = {}; window.HFS_W = W;
const X = new THREE.Vector3(1, 0, 0), Y = new THREE.Vector3(0, 1, 0), Z = new THREE.Vector3(0, 0, 1);
const BED = { x0: -0.45, x1: 0.45, z0: -2.45, z1: -0.45, top: 0.5, base: 0.3 };       // behind it, the head end at -z
const NIGHT = new THREE.Vector3(-0.8, 0, -2.12), NIGHT_H = 0.62;                       // the nightstand and its candle, at the head of the bed
const TROPHY = new THREE.Vector3(-1.15, 0, -0.2), PLINTH_H = 0.92;
const LB = { x: 1.2, z: 0.5, y: 1.1, w: 0.98, h: 1.08, ry: -0.75 };                   // the light box, front-left of it (the camera's right), turned toward the front
const PED = new THREE.Vector3(-0.62, 0, 0.75), PED_H = 0.9, LOGO_R = 0.034;             // the disc model, up out of the floor at the end
const CARD = new THREE.Vector3(0.24, BED.top, BED.z1 - 0.16);                           // the name card on the mattress
const SHEET_OFF = [5.38, 5.95], FLIP = [5.86, 6.62], HOP = [6.62, 6.62], SQUASH = [6.62, 7.0];
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
const blackMat = () => phys({ color: 0x0d0e10, roughness: 0.32, clearcoat: 0.6, clearcoatRoughness: 0.25 });
const lathe = (pts, n = 96) => new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), n);
const finish = (g) => { shadows(g); g.traverse((o) => o.layers.enable(1)); return g; };

// ------------------------------------------------------------------ the bed, the nightstand and its candle
function makeBed(scene) {
  const g = new THREE.Group(); scene.add(g);
  const cx = (BED.x0 + BED.x1) / 2, cz = (BED.z0 + BED.z1) / 2, bw = BED.x1 - BED.x0, bl = BED.z1 - BED.z0;
  const wood = phys({ color: 0x2a1c14, roughness: 0.42, clearcoat: 0.5, clearcoatRoughness: 0.3 });
  const fabric = (c, s = 0.6) => phys({ color: c, roughness: 0.92, sheen: s, sheenColor: new THREE.Color(0xc9d2e2), sheenRoughness: 0.6, roughnessMap: noiseTex(5, 256, 0.82, 1.0, 40) });
  const frame = new THREE.Mesh(new RoundedBoxGeometry(bw + 0.06, 0.18, bl + 0.06, 4, 0.012), wood); frame.position.set(cx, 0.2, cz); g.add(frame);
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.018, 0.12, 20), wood); leg.position.set(cx + sx * (bw / 2 - 0.02), 0.06, cz + sz * (bl / 2 - 0.02)); g.add(leg); }
  // a Victorian headboard: an arched panel between two turned posts
  const hb = new THREE.Shape(); hb.moveTo(-bw / 2, 0); hb.lineTo(bw / 2, 0); hb.lineTo(bw / 2, 0.62); hb.quadraticCurveTo(0, 0.86, -bw / 2, 0.62); hb.closePath();
  const head = new THREE.Mesh(new THREE.ExtrudeGeometry(hb, { depth: 0.04, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.008, bevelSegments: 3, curveSegments: 48 }), wood); head.position.set(cx, 0.28, BED.z0 - 0.07); g.add(head);
  for (const s of [-1, 1]) { const post = new THREE.Mesh(lathe([[0.0001, 0], [0.032, 0], [0.032, 0.7], [0.026, 0.74], [0.036, 0.8], [0.024, 0.86], [0.03, 0.9], [0.0001, 0.93]], 48), wood); post.position.set(cx + s * (bw / 2 + 0.035), 0.12, BED.z0 - 0.05); g.add(post); }
  // the mattress: dark ticking, so the white sheet and then the bones stand out against it
  const tick = canvasTex(512, 512, (x, w, h) => { x.fillStyle = '#272d38'; x.fillRect(0, 0, w, h);
    for (let i = 0; i < w; i += 32) { x.fillStyle = 'rgba(150,165,192,0.18)'; x.fillRect(i, 0, 7, h); x.fillStyle = 'rgba(150,165,192,0.08)'; x.fillRect(i + 15, 0, 2, h); } });
  tick.wrapS = tick.wrapT = THREE.RepeatWrapping; tick.repeat.set(2, 3);
  const mm = phys({ map: tick, roughness: 0.9, sheen: 0.5, sheenColor: new THREE.Color(0x8c9ab4), sheenRoughness: 0.6 });
  const mat = new THREE.Mesh(new RoundedBoxGeometry(bw, BED.top - BED.base, bl, 4, 0.03), mm); mat.position.set(cx, (BED.top + BED.base) / 2, cz); g.add(mat);
  return finish(g);
}
function makePillow(scene, top, cz) {   // flat on top where the skull rests (top: the height it must stay under)
  const pg = new THREE.SphereGeometry(1, 96, 48), P = pg.attributes.position, sp = (u, e) => Math.sign(u) * Math.pow(Math.abs(u), e);
  const h = Math.max(0.012, top - BED.top);
  for (let i = 0; i < P.count; i++) { const x = sp(P.getX(i), 0.3) * 0.3, y = sp(P.getY(i), 0.7) * h / 2, z = sp(P.getZ(i), 0.3) * 0.17; P.setXYZ(i, x, y, z); }
  pg.computeVertexNormals();
  const m = new THREE.Mesh(pg, phys({ color: 0xf1efe9, roughness: 0.9, sheen: 0.5, sheenColor: new THREE.Color(0xffffff) })); m.position.set(0, BED.top + h / 2, cz); scene.add(m);
  return finish(m);
}
function makeNightstand(scene) {
  const g = new THREE.Group(); g.position.copy(NIGHT); scene.add(g);
  const wood = phys({ color: 0x2a1c14, roughness: 0.42, clearcoat: 0.5, clearcoatRoughness: 0.3 });
  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.03, 64), wood); top.position.y = NIGHT_H - 0.015; g.add(top);
  const stem = new THREE.Mesh(lathe([[0.0001, 0], [0.12, 0], [0.12, 0.02], [0.03, 0.06], [0.025, 0.3], [0.04, 0.34], [0.025, 0.4], [0.03, NIGHT_H - 0.03], [0.0001, NIGHT_H - 0.03]], 48), wood); g.add(stem);
  const brass = phys({ color: 0xb98f45, metalness: 1, roughness: 0.3, clearcoat: 0.3 });
  const holder = new THREE.Mesh(lathe([[0.0001, 0], [0.055, 0], [0.058, 0.006], [0.05, 0.012], [0.012, 0.02], [0.009, 0.06], [0.02, 0.07], [0.018, 0.078], [0.0001, 0.078]], 64), brass); holder.position.y = NIGHT_H; g.add(holder);
  const wax = phys({ color: 0xeee4cf, roughness: 0.55, sheen: 0.4, sheenColor: new THREE.Color(0xfff2d6) });
  const candle = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.0125, 0.13, 32), wax); candle.position.y = NIGHT_H + 0.078 + 0.065; g.add(candle);
  const wick = new THREE.Mesh(new THREE.CylinderGeometry(0.0009, 0.0009, 0.01, 8), phys({ color: 0x1a1612, roughness: 0.9 })); wick.position.y = NIGHT_H + 0.078 + 0.135; g.add(wick);
  const fy = NIGHT_H + 0.078 + 0.15;
  const glow = glowSprite(new THREE.Color(0xffb15a), 0.12); glow.position.y = fy; g.add(glow);
  const core = glowSprite(new THREE.Color(0xfff1c8), 0.03); core.position.y = fy - 0.002; core.scale.set(0.018, 0.04, 1); g.add(core);
  const light = new THREE.PointLight(0xffb46a, 0, 3.2, 2); light.position.y = fy + 0.02; g.add(light);
  finish(g); glow.castShadow = false; core.castShadow = false;
  return { g, glow, core, light, fy };
}

// ------------------------------------------------------------------ the sheet: draped over the lying skeleton (a field of heights a little above every bone), two black eyes on it
function makeSheet(scene, eyes) {
  const x0 = BED.x0 - 0.005, x1 = BED.x1 + 0.005, z0 = BED.z0 + 0.03, z1 = BED.z1 + 0.005, cell = 0.01;
  const nx = Math.round((x1 - x0) / cell) + 1, nz = Math.round((z1 - z0) / cell) + 1, N = nx * nz;
  const H = new Float32Array(N).fill(BED.top), v = new THREE.Vector3();
  for (const m of W.bones) { m.updateMatrixWorld(true); const P = m.geometry.attributes.position;
    for (let i = 0; i < P.count; i += 2) { v.fromBufferAttribute(P, i).applyMatrix4(m.matrixWorld); const ix = Math.round((v.x - x0) / cell), iz = Math.round((v.z - z0) / cell);
      if (ix >= 0 && iz >= 0 && ix < nx && iz < nz && v.y > H[iz * nx + ix]) H[iz * nx + ix] = v.y; } }
  const dil = (A, r) => { const B = new Float32Array(N), C = new Float32Array(N);
    for (let z = 0; z < nz; z++) for (let x = 0; x < nx; x++) { let m = -9; for (let k = -r; k <= r; k++) { const xx = x + k; if (xx >= 0 && xx < nx) m = Math.max(m, A[z * nx + xx]); } B[z * nx + x] = m; }
    for (let z = 0; z < nz; z++) for (let x = 0; x < nx; x++) { let m = -9; for (let k = -r; k <= r; k++) { const zz = z + k; if (zz >= 0 && zz < nz) m = Math.max(m, B[zz * nx + x]); } C[z * nx + x] = m; }
    return C; };
  const hard = dil(H, 2); for (let i = 0; i < N; i++) hard[i] = hard[i] > BED.top + 0.001 ? hard[i] + 0.009 : BED.top + 0.004;
  const K = 0.6, RAD = 26, base = BED.top + 0.004; let soft = new Float32Array(N).fill(base);
  for (let z = 0; z < nz; z++) for (let x = 0; x < nx; x++) { const hq = hard[z * nx + x]; if (hq <= base + 0.001) continue;
    for (let dz = -RAD; dz <= RAD; dz++) { const zz = z + dz; if (zz < 0 || zz >= nz) continue;
      for (let dx = -RAD; dx <= RAD; dx++) { const xx = x + dx; if (xx < 0 || xx >= nx) continue; const c = hq - K * Math.hypot(dx, dz) * cell, k = zz * nx + xx; if (c > soft[k]) soft[k] = c; } } }
  for (let i = 0; i < N; i++) soft[i] += 0.0025 * Math.sin((i % nx) * 0.9 + Math.floor(i / nx) * 0.31) * Math.sin(Math.floor(i / nx) * 0.47) * Math.min(1, (soft[i] - base) / 0.05);
  for (let pass = 0; pass < 4; pass++) { const Q = soft.slice();
    for (let z = 1; z < nz - 1; z++) for (let x = 1; x < nx - 1; x++) { const i = z * nx + x; Q[i] = (soft[i] * 4 + soft[i - 1] + soft[i + 1] + soft[i - nx] + soft[i + nx]) / 8; }
    for (let i = 0; i < N; i++) soft[i] = Math.max(Q[i], hard[i]); }
  // the geometry: the top, then a hem hanging down the sides of the mattress
  const S = 7, hang = 0.15, mx = nx + 2 * S, mz = nz + 2 * S, pos = new Float32Array(mx * mz * 3), uv = new Float32Array(mx * mz * 2), idx = [];
  for (let j = 0; j < mz; j++) for (let i = 0; i < mx; i++) {
    const ci = Math.min(nx - 1, Math.max(0, i - S)), cj = Math.min(nz - 1, Math.max(0, j - S)), oi = i - S - ci, oj = j - S - cj, out = Math.max(Math.abs(oi), Math.abs(oj));
    let x = x0 + ci * cell, z = z0 + cj * cell, y = soft[cj * nx + ci];
    if (out > 0) { const k = out / S, d = Math.hypot(oi, oj) || 1, fold = 0.006 * Math.sin(x * 37 + z * 23);
      x += (oi / d) * (0.008 + fold); z += (oj / d) * (0.008 + fold); y = BED.top + 0.004 - hang * k * (j < S ? 0.0 : 1); if (j < S) { z = z0 - 0.004; y = BED.top + 0.004 - 0.02 * k; } }
    const p = (j * mx + i) * 3; pos[p] = x; pos[p + 1] = y; pos[p + 2] = z;
    uv[(j * mx + i) * 2] = (x - x0) / (x1 - x0); uv[(j * mx + i) * 2 + 1] = 1 - (z - z0) / (z1 - z0);
  }
  for (let j = 0; j < mz - 1; j++) for (let i = 0; i < mx - 1; i++) { const a = j * mx + i, b = a + 1, c = a + mx, d = c + 1; idx.push(a, c, b, b, c, d); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); geo.setIndex(idx); geo.computeVertexNormals();
  const tex = canvasTex(1024, 2048, (x, w, h) => {
    x.fillStyle = '#f3f1ec'; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 26000; i++) { const px = hash(i * 1.3) * w, py = hash(i * 2.9) * h, c = 225 + Math.floor(hash(i * 4.1) * 30); x.fillStyle = `rgba(${c},${c - 2},${c - 6},0.35)`; x.fillRect(px, py, 2, 1); }
    const ec = eyes.reduce((a, e) => a + e.x, 0) / eyes.length;
    for (const e of eyes) { const ex = ec + Math.sign(e.x - ec) * 0.034, u = (ex - x0) / (x1 - x0), vv = (e.z - z0) / (z1 - z0); x.fillStyle = '#121214'; x.beginPath(); x.ellipse(u * w, vv * h, (0.018 / (x1 - x0)) * w, (0.028 / (z1 - z0)) * h, 0, 0, Math.PI * 2); x.fill(); }
  });
  const mat = new THREE.MeshPhysicalMaterial({ map: tex, roughness: 0.86, sheen: 0.6, sheenColor: new THREE.Color(0xffffff), sheenRoughness: 0.5, side: THREE.DoubleSide, transparent: true });
  // flying off: the body's shape relaxes out of the cloth, the hem swings out flat, waves run through it, the trailing side droops
  const U = { uFly: { value: 0 }, uFlat: { value: 0 }, uT: { value: 0 } }, f = (v) => v.toFixed(4);
  const TOP = BED.top + 0.004, X0 = x0 - 0.001, X1 = x1 + 0.001, Z0 = z0 - 0.001, Z1 = z1 + 0.001;
  mat.onBeforeCompile = (sh) => { Object.assign(sh.uniforms, U);
    sh.vertexShader = `uniform float uFly; uniform float uFlat; uniform float uT;
      float sheetW(vec2 p) { return 0.08 * sin(p.x * 6.0 + uT * 14.0) + 0.06 * sin(p.y * 3.2 - uT * 10.0 + p.x * 2.0); }
      vec2 sheetWd(vec2 p) { float c1 = cos(p.x * 6.0 + uT * 14.0), c2 = cos(p.y * 3.2 - uT * 10.0 + p.x * 2.0); return vec2(0.48 * c1 + 0.12 * c2, 0.192 * c2); }
      vec2 sheetOut(vec3 p) { vec2 o = vec2(p.x < ${f(X0)} ? -1.0 : (p.x > ${f(X1)} ? 1.0 : 0.0), p.z > ${f(Z1)} ? 1.0 : (p.z < ${f(Z0)} ? -1.0 : 0.0)); float l = length(o); return l > 0.0 ? o / l : o; }
      ` + sh.vertexShader
      .replace('#include <beginnormal_vertex>', `#include <beginnormal_vertex>
      { vec2 g = uFly * sheetWd(position.xz); objectNormal = normalize(mix(objectNormal, vec3(0.0, 1.0, 0.0), 0.75 * uFlat) + vec3(-g.x, 0.0, -g.y)); }`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
      { float d = max(0.0, ${f(TOP)} - transformed.y); transformed.xz += sheetOut(transformed) * d * uFlat;
        transformed.y = mix(transformed.y, ${f(TOP)} + 0.35 * (transformed.y - ${f(TOP)}), uFlat);
        transformed.y += uFly * sheetW(transformed.xz) - uFly * 0.14 * (${f(X1)} - transformed.x) / ${f(X1 - X0)}; }`); };
  mat.customProgramCacheKey = () => 'hfs-sheet2';
  const C = new THREE.Vector3((x0 + x1) / 2, TOP, (z0 + z1) / 2);
  const sheet = new THREE.Mesh(geo, mat); sheet.userData.U = U; sheet.position.copy(C).negate();   // the group turns about the sheet's own centre
  const g = new THREE.Group(); g.position.copy(C); g.add(sheet); scene.add(g); finish(g);
  return { g, sheet, H: soft, x0, z0, nx, nz, cell, C };
}
function sheetAt(Sh, x, z) { const ix = Math.round((x - Sh.x0) / Sh.cell), iz = Math.round((z - Sh.z0) / Sh.cell); return Sh.H[Math.min(Sh.nz - 1, Math.max(0, iz)) * Sh.nx + Math.min(Sh.nx - 1, Math.max(0, ix))]; }

// ------------------------------------------------------------------ the trophy (the gag), and its confetti
function makeTrophy(scene) {
  const g = new THREE.Group(); g.position.copy(TROPHY); scene.add(g);
  const stone = phys({ color: 0x1b1c20, roughness: 0.5, clearcoat: 0.3 });
  const plinth = new THREE.Mesh(new RoundedBoxGeometry(0.34, PLINTH_H, 0.34, 4, 0.008), stone); plinth.position.y = PLINTH_H / 2; g.add(plinth);
  const gold = new THREE.MeshPhysicalMaterial({ color: 0xd8b25a, metalness: 1, roughness: 0.22, clearcoat: 0.4 });
  const prof = [[0, 0], [0.052, 0], [0.052, 0.012], [0.04, 0.016], [0.034, 0.02], [0.012, 0.03], [0.009, 0.06], [0.011, 0.075], [0.03, 0.09], [0.05, 0.12], [0.06, 0.16], [0.064, 0.2], [0.058, 0.2], [0.054, 0.165], [0.044, 0.125], [0.02, 0.1], [0, 0.098]];
  const cup = new THREE.Mesh(lathe(prof), gold); cup.position.y = PLINTH_H + 0.075; g.add(cup);
  for (const s of [-1, 1]) { const h = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.0055, 16, 48, Math.PI * 1.15), gold); h.position.set(s * 0.066, PLINTH_H + 0.075 + 0.155, 0); h.rotation.z = s > 0 ? -Math.PI * 0.62 : Math.PI * 1.62; g.add(h); }
  const base = new THREE.Mesh(new RoundedBoxGeometry(0.2, 0.075, 0.17, 3, 0.004), phys({ color: 0x0c0c0e, roughness: 0.3, clearcoat: 0.6 })); base.position.y = PLINTH_H + 0.0375; g.add(base);
  const plate = canvasTex(512, 230, (x, w, h) => { const gr = x.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#e9cf8a'); gr.addColorStop(0.5, '#c79f4a'); gr.addColorStop(1, '#e4c57a'); x.fillStyle = gr; x.fillRect(0, 0, w, h);
    x.strokeStyle = 'rgba(70,50,10,0.55)'; x.lineWidth = 6; x.strokeRect(10, 10, w - 20, h - 20);
    txt(x, 'No. 1', w / 2, 74, { font: '800 84px Archivo', color: '#4a3510', track: 2 });
    txt(x, 'CAUSE OF DISABILITY', w / 2, 146, { font: '800 46px Archivo', color: '#3d2b0b', track: 4, maxW: w * 0.9 });
    txt(x, 'WORLDWIDE', w / 2, 196, { font: '700 36px "Geist Mono"', color: '#3d2b0b', track: 8 }); });
  const pm = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 0.0674), new THREE.MeshPhysicalMaterial({ map: plate, metalness: 0.5, roughness: 0.4 })); pm.position.set(0, PLINTH_H + 0.0375, 0.0852); g.add(pm);
  g.rotation.y = 0.55;   // the plate toward the camera
  return finish(g);
}
const CONF_T = T.one + 0.02, NCONF = 90;
function makeConfetti(scene) {
  const im = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.013, 0.021), new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, metalness: 0.35, roughness: 0.45 }), NCONF);
  const cols = [0xf2f0ea, 0xd8b25a, 0xc9ccd2, 0xa9bedf, 0xe8d9a8].map((c) => new THREE.Color(c));
  const P = [];
  for (let i = 0; i < NCONF; i++) { im.setColorAt(i, cols[i % cols.length]);
    const a = hash(i * 3.1) * Math.PI * 2, sp = 0.35 + 0.55 * hash(i * 5.7);
    P.push({ v: new THREE.Vector3(Math.cos(a) * sp, 1.6 + 1.3 * hash(i * 7.3), Math.sin(a) * sp), t: 0.08 * hash(i * 9.1), spin: new THREE.Vector3(hash(i * 1.9) - 0.5, hash(i * 2.7) - 0.5, hash(i * 3.3) - 0.5).multiplyScalar(26), ph: hash(i * 4.4) * 6.28 }); }
  im.instanceColor.needsUpdate = true; im.frustumCulled = false; im.visible = false; im.castShadow = true; scene.add(im);
  return { im, P, from: TROPHY.clone().add(new THREE.Vector3(0, PLINTH_H + 0.3, 0)) };
}
const _m4 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _v = new THREE.Vector3(), _w = new THREE.Vector3(), _s3 = new THREE.Vector3();
function setConfetti(C, t) {
  const u0 = t - CONF_T; C.im.visible = u0 > 0 && u0 < 3.4; if (!C.im.visible) return;
  const k = 5.5, g = 9.81;
  C.P.forEach((p, i) => { const u = Math.max(0, u0 - p.t);
    const fx = (p.v.x * (1 - Math.exp(-k * u))) / k, fz = (p.v.z * (1 - Math.exp(-k * u))) / k, fy = ((p.v.y + g / k) * (1 - Math.exp(-k * u))) / k - (g / k) * u;
    let x = C.from.x + fx + 0.03 * Math.sin(u * 5 + p.ph), y = C.from.y + fy, z = C.from.z + fz + 0.03 * Math.cos(u * 4.3 + p.ph);
    const onPlinth = Math.abs(x - TROPHY.x) < 0.17 && Math.abs(z - TROPHY.z) < 0.17, gy = onPlinth ? PLINTH_H + 0.001 : 0.001;
    let rest = false; if (y < gy) { y = gy; rest = true; }
    _e.set(rest ? -Math.PI / 2 : p.spin.x * u, rest ? 0 : p.spin.y * u, rest ? p.ph : p.spin.z * u); _q.setFromEuler(_e);
    _m4.compose(_v.set(x, y, z), _q, _s3.setScalar(u0 > p.t ? 1 : 0.001)); C.im.setMatrixAt(i, _m4); });
  C.im.instanceMatrix.needsUpdate = true;
}

// ------------------------------------------------------------------ the light box and its slides (built in its own frame: +x right, +y up, facing +z)
const IDX_A_SKIP = 6;   // the one case film that is not stamped
function spineFilm(k) {   // a lumbar spine seen from the side, as on an X-ray
  return (x, w, h) => {
    x.fillStyle = '#0b0d10'; x.fillRect(0, 0, w, h);
    const g = x.createRadialGradient(w * 0.5, h * 0.5, 4, w * 0.5, h * 0.5, w * 0.8); g.addColorStop(0, 'rgba(70,80,95,0.35)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h);
    const n = 5, top = h * 0.12, bh = (h * 0.62) / n, j = (i) => 0.02 * Math.sin(k * 3.1 + i * 1.7);
    for (let i = 0; i < n; i++) { const y = top + i * bh * 1.2, cx = w * (0.44 + 0.06 * Math.sin((i / (n - 1)) * Math.PI) + j(i));
      x.fillStyle = 'rgba(214,220,228,0.86)'; x.beginPath(); x.roundRect(cx - w * 0.15, y, w * 0.3, bh * 0.92, 6); x.fill();
      x.fillStyle = 'rgba(190,196,206,0.55)'; x.beginPath(); x.roundRect(cx + w * 0.15, y + bh * 0.2, w * 0.14, bh * 0.5, 5); x.fill();
      if (i < n - 1) { x.fillStyle = 'rgba(150,175,205,0.75)'; x.beginPath(); x.ellipse(cx, y + bh * 1.06, w * 0.14, bh * 0.12, 0, 0, Math.PI * 2); x.fill(); } }
    x.fillStyle = 'rgba(214,220,228,0.7)'; x.beginPath(); x.moveTo(w * 0.32, h * 0.86); x.lineTo(w * 0.62, h * 0.84); x.lineTo(w * 0.52, h * 0.97); x.closePath(); x.fill();
  };
}
function stampTex(word, { w = 600, h = 170, color = '#c2312b', size = 92 } = {}) {
  return canvasTex(w, h, (x) => { x.clearRect(0, 0, w, h); x.strokeStyle = color; x.lineWidth = 10; x.beginPath(); x.roundRect(10, 10, w - 20, h - 20, 18); x.stroke();
    txt(x, word, w / 2, h / 2 + 4, { font: `900 ${size}px Archivo`, color, track: 6, maxW: w * 0.86 });
    x.globalCompositeOperation = 'destination-out'; for (let i = 0; i < 900; i++) { x.fillStyle = `rgba(0,0,0,${0.15 + 0.5 * hash(i * 7.3)})`; x.fillRect(hash(i) * w, hash(i * 3.1) * h, 1 + 3 * hash(i * 1.7), 1 + 2 * hash(i * 2.3)); } });
}
const STAMPS_T = [...Array(9).keys()].map((i) => +(T.doctors + 0.05 + i * 0.3).toFixed(3));
const GRID = [{ t0: T.over + 0.1, dur: 1.2 }, { t0: T.almost, dur: 1.4 }];
function makeLightbox(scene) {
  const g = new THREE.Group(); g.position.set(LB.x, 0, LB.z); g.rotation.y = LB.ry; scene.add(g);
  const frameM = phys({ color: 0x15161a, roughness: 0.45, clearcoat: 0.3 });
  const frame = new THREE.Mesh(new RoundedBoxGeometry(LB.w + 0.06, LB.h + 0.06, 0.05, 4, 0.01), frameM); frame.position.set(0, LB.y, -0.026); g.add(frame);
  for (const s of [-1, 1]) { const lh = LB.y - LB.h / 2 - 0.005; const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, lh, 16), frameM); leg.position.set(s * 0.36, 0.015 + lh / 2, -0.03); g.add(leg);
    const foot = new THREE.Mesh(new RoundedBoxGeometry(0.06, 0.02, 0.36, 2, 0.006), frameM); foot.position.set(s * 0.36, 0.01, -0.03); g.add(foot); }
  const glass = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xeef2f8), toneMapped: true });
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(LB.w, LB.h), glass); panel.position.set(0, LB.y, 0.0005); g.add(panel);
  const Zs = 0.002, plane = (w, h, tex, x, y, ro = 2) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0, depthWrite: false })); m.position.set(x, y, Zs); m.renderOrder = ro; g.add(m); return m; };
  const title = (s, y) => plane(0.86, 0.066, canvasTex(1720, 132, (x, w, h) => { x.clearRect(0, 0, w, h); txt(x, s, w / 2, h / 2 + 2, { font: '700 86px "Geist Mono"', color: '#2a2d33', track: 8, maxW: w * 0.98 }); }), 0, y);
  const A = { title: title('LOW BACK PAIN · 10 CASES', 1.545), films: [], stamps: [] };
  for (let k = 0; k < 10; k++) { const i = k % 5, j = Math.floor(k / 5), x = -0.36 + i * 0.18, y = 1.27 - j * 0.42;
    A.films.push(plane(0.15, 0.36, canvasTex(200, 480, spineFilm(k)), x, y));
    const st = plane(0.17, 0.048, stampTex('NON-SPECIFIC', { size: 84 }), x, y - 0.02, 3); st.rotation.z = 0.32 + 0.06 * (hash(k) - 0.5); st.position.z += 0.0004; A.stamps.push(st); }
  const B = { title: title('NO BACK PAIN · DISC SCANS', 1.545), grids: [], labs: [], note: null };
  const icon = (dark) => canvasTex(96, 132, (x, w, h) => { x.clearRect(0, 0, w, h); x.fillStyle = 'rgba(28,30,36,0.9)'; x.beginPath(); x.roundRect(10, 6, w - 20, 44, 10); x.fill(); x.beginPath(); x.roundRect(10, h - 50, w - 20, 44, 10); x.fill();
    x.fillStyle = dark ? '#0a0b0d' : '#7fb2e6'; x.beginPath(); x.ellipse(w / 2, h / 2, w / 2 - 12, 13, 0, 0, Math.PI * 2); x.fill(); if (dark) { x.strokeStyle = '#c2312b'; x.lineWidth = 5; x.stroke(); } });
  const icoOk = icon(false), icoDark = icon(true);
  [[-0.215, 'AGE 20', 37], [0.215, 'AGE 80', 96]].forEach(([cx, lab, n], gi) => {
    const icons = []; for (let k = 0; k < 100; k++) { const i = k % 10, j = Math.floor(k / 10), x = cx - 0.171 + i * 0.038, y = 1.29 - j * 0.069; icons.push({ m: plane(0.033, 0.0454, icoOk, x, y), k }); }
    const order = [...Array(100).keys()].sort((a, b) => hash(a * 13.7 + gi * 101) - hash(b * 13.7 + gi * 101));
    B.grids.push({ icons, order: order.slice(0, n), n, gi, lit: -1 });
    B.labs.push(plane(0.36, 0.11, canvasTex(720, 220, (x, w, h) => { x.clearRect(0, 0, w, h); txt(x, lab, w / 2, 52, { font: '600 54px "Geist Mono"', color: '#4a4f58', track: 10 }); txt(x, n + '%', w / 2, 152, { font: '900 112px Archivo', color: '#16181c', track: 2 }); }), cx, 1.395, 3));
  });
  B.icoDark = icoDark; B.icoOk = icoOk;
  B.note = plane(0.6, 0.026, canvasTex(1200, 52, (x, w, h) => { x.clearRect(0, 0, w, h); txt(x, '33 STUDIES · 3,110 PEOPLE', w / 2, h / 2 + 1, { font: '600 34px "Geist Mono"', color: '#6a6f78', track: 8 }); }), 0, 1.488);
  g.traverse((o) => o.layers.enable(1)); frame.castShadow = true;
  return { g, glass, panel, A, B };
}

// ------------------------------------------------------------------ the name card on the mattress; the disc model; grey hair for the spine
function makeCard(scene) {
  const g = new THREE.Group(); g.position.copy(CARD); scene.add(g);
  const black = blackMat(); const stand = new THREE.Mesh(new RoundedBoxGeometry(0.13, 0.012, 0.035, 2, 0.004), black); stand.position.y = 0.006; g.add(stand);
  const flip = new THREE.Group(); flip.position.y = 0.012; g.add(flip);
  const face = (word, small) => canvasTex(768, 400, (x, w, h) => { x.fillStyle = '#f4f2ec'; x.fillRect(0, 0, w, h); x.fillStyle = '#1d3d63'; x.fillRect(0, 0, w, 92);
    txt(x, small, w / 2, 48, { font: '700 46px "Geist Mono"', color: '#f4f2ec', track: 12 }); txt(x, word, w / 2, 250, { font: '800 92px Archivo', color: '#16181c', track: 2, maxW: w * 0.9 }); });
  const W2 = 0.12, H2 = 0.0625;
  const front = new THREE.Mesh(new THREE.PlaneGeometry(W2, H2), new THREE.MeshPhysicalMaterial({ map: face('PHYSIOTHERAPIST', 'HELLO, I AM YOUR'), roughness: 0.6 })); front.position.set(0, H2 / 2, 0.0012); flip.add(front);
  const back = new THREE.Mesh(new THREE.PlaneGeometry(W2, H2), new THREE.MeshPhysicalMaterial({ map: face('MATTRESS', 'ACTUALLY, I AM A'), roughness: 0.6 })); back.position.set(0, H2 / 2, -0.0012); back.rotation.y = Math.PI; flip.add(back);
  const core = new THREE.Mesh(new THREE.BoxGeometry(W2, H2, 0.002), black); core.position.y = H2 / 2; flip.add(core);
  g.rotation.y = 0.35;   // toward the camera that sees it
  return { g: finish(g), flip };
}
function makeDisc(scene) {   // a model of a lumbar disc on a stand: the layered ring outside, the soft centre; its top becomes the logo
  const g = new THREE.Group(); g.position.copy(PED); scene.add(g);
  const stone = phys({ color: 0x1b1c20, roughness: 0.5, clearcoat: 0.3 });
  const ped = new THREE.Mesh(new RoundedBoxGeometry(0.26, PED_H, 0.26, 4, 0.008), stone); ped.position.y = PED_H / 2; g.add(ped);
  const sh = new THREE.Shape(); const N = 72;
  for (let i = 0; i <= N; i++) { const a = (i / N) * Math.PI * 2, r = 0.062 * (1 - 0.18 * Math.max(0, Math.cos(a - Math.PI / 2)) ** 3), x = Math.cos(a) * r * 1.22, y = Math.sin(a) * r; i ? sh.lineTo(x, y) : sh.moveTo(x, y); }
  const H = 0.03, geo = new THREE.ExtrudeGeometry(sh, { depth: H, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 4, curveSegments: 72 });
  geo.rotateX(-Math.PI / 2); geo.translate(0, PED_H + 0.004, 0);
  const top = canvasTex(1024, 1024, (x, w) => { x.fillStyle = '#a3abb7'; x.fillRect(0, 0, w, w); for (let k = 0; k < 16; k++) { x.strokeStyle = k % 2 ? 'rgba(120,130,145,0.35)' : 'rgba(250,252,255,0.4)'; x.lineWidth = 9; x.beginPath(); x.ellipse(w / 2, w / 2, w * (0.46 - k * 0.017), w * (0.46 - k * 0.017) * 0.82, 0, 0, Math.PI * 2); x.stroke(); }
    const gr = x.createRadialGradient(w / 2, w / 2, 10, w / 2, w / 2, w * 0.2); gr.addColorStop(0, '#9fb3c9'); gr.addColorStop(1, 'rgba(159,179,201,0)'); x.fillStyle = gr; x.beginPath(); x.ellipse(w / 2, w / 2, w * 0.2, w * 0.17, 0, 0, Math.PI * 2); x.fill(); });
  const P = geo.attributes.position, uv = geo.attributes.uv; for (let i = 0; i < P.count; i++) uv.setXY(i, 0.5 + P.getX(i) / (0.062 * 1.22 * 2 * 1.04), 0.5 - P.getZ(i) / (0.062 * 2 * 1.04));
  const disc = new THREE.Mesh(geo, new THREE.MeshPhysicalMaterial({ map: top, roughness: 0.42, clearcoat: 0.6, clearcoatRoughness: 0.3, sheen: 0.3 })); g.add(disc);
  const logo = makeLogoRing(LOGO_R); logo.g.rotation.x = -Math.PI / 2; logo.g.position.y = PED_H + 0.004 + H + 0.0045; g.add(logo.g);
  finish(g); g.visible = false;
  return { g, logo, topY: PED_H + 0.004 + H + 0.0045 };
}
const HAIR = [T.grey - 0.05, T.hair + 0.25], HAIR_OFF = [29.0, 29.4];
function makeTufts(R) {   // grey hair: a tuft out of the front and sides of each lumbar disc, rooted just outside it
  const discs = W.bones.filter((m) => /intervertebral dis[ck]/i.test(m.userData.name)).map((m) => { m.updateMatrixWorld(true); const b = new THREE.Box3().setFromObject(m); return { m, c: b.getCenter(new THREE.Vector3()), b }; });
  discs.sort((a, b) => a.c.y - b.c.y);
  const lum = discs.slice(0, 5), strands = [], mat = new THREE.MeshPhysicalMaterial({ color: 0xcfcdc6, roughness: 0.55, sheen: 0.8, sheenColor: new THREE.Color(0xffffff) }), v = new THREE.Vector3();
  const boxes = W.bones.map((m) => ({ m, b: new THREE.Box3().setFromObject(m) })), ray = new THREE.Raycaster(), dir = new THREE.Vector3(0.3, 0.2, 1).normalize();
  const inside = (p) => { for (const { m, b } of boxes) { if (!b.containsPoint(p)) continue; const sd = m.material.side; m.material.side = THREE.DoubleSide; ray.set(p, dir); const n = ray.intersectObject(m, false).length; m.material.side = sd; if (n % 2 === 1) return true; } return false; };
  lum.forEach((D, di) => {
    const P = D.m.geometry.attributes.position, pts = [];
    for (let i = 0; i < P.count; i++) { v.fromBufferAttribute(P, i).applyMatrix4(D.m.matrixWorld); const o = v.clone().sub(D.c); o.y = 0; const r = o.length(); if (r < 1e-4) continue; o.multiplyScalar(1 / r);
      if (o.z > 0.15 && Math.abs(v.y - D.c.y) < 0.004) pts.push({ p: v.clone(), o }); }
    // each strand is kept only if no point along it is inside a bone (the vertebrae above and below flare past the disc)
    for (let s = 0, tries = 0; s < 13 && pts.length && tries < 80; tries++) {
      const k = tries * 1.37 + s * 7.9, q = pts[Math.floor(hash(di * 31.7 + k) * pts.length)], up = 0.003 * (hash(k * 3.3 + di) - 0.5), dn = 0.004 + 0.007 * hash(k * 5.1 + di), side = new THREE.Vector3(-q.o.z, 0, q.o.x).multiplyScalar(0.004 * (hash(k * 9.7 + di) - 0.5));
      const a = q.p.clone().addScaledVector(q.o, 0.0012), b = a.clone().addScaledVector(q.o, 0.012).add(new THREE.Vector3(0, up, 0)), c = a.clone().addScaledVector(q.o, 0.023).add(side).add(new THREE.Vector3(0, up - dn * 0.5, 0)), d = a.clone().addScaledVector(q.o, 0.032).add(side.clone().multiplyScalar(2)).add(new THREE.Vector3(0, up - dn, 0));
      const curveW = new THREE.CatmullRomCurve3([a, b, c, d]); let bad = false;
      for (let i = 1; i <= 16 && !bad; i++) { const pt = curveW.getPoint(i / 16); for (const off of [[0, 0.0016, 0], [0, -0.0016, 0], [0, 0, 0]]) if (inside(pt.clone().add(new THREE.Vector3(...off)))) { bad = true; break; } }
      if (bad) continue;
      const loc = [a, b, c, d].map((p) => D.m.parent.worldToLocal(p.clone()));
      const geo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(loc), 16, 0.0007, 5, false);
      const m = new THREE.Mesh(geo, mat); m.visible = false; m.userData.n = geo.index.count; D.m.parent.add(m); strands.push(m); s++; }
  });
  return strands;
}

// ------------------------------------------------------------------ the nerves of the lower back: roots down the canal, then down both legs (the standing pose)
function nervePaths() {
  const R = W.rig, s = R.seg, wp = (grp, p) => p.clone().sub(R.pivots.get(grp)).applyMatrix4(grp.matrixWorld), out = [];
  const canal = ['First lumbar vertebra', 'Second lumbar vertebra', 'Third lumbar vertebra', 'Fourth lumbar vertebra', 'Fifth lumbar vertebra'].map((n) => s[n]).filter(Boolean);
  const sacH = R.byName.get('Sacrum').userData.home;
  for (const Side of ['Right', 'Left']) {
    const G = R.legs[Side], sg = G.s;
    for (let r = 0; r < 3; r++) {
      const dx = sg * (0.002 + r * 0.0028), pts = [];
      for (const c of canal) pts.push(wp(c.g, c.pivot.clone().add(new THREE.Vector3(dx, 0, -0.012))));
      pts.push(wp(R.pelvis, sacH.clone().add(new THREE.Vector3(sg * (0.012 + r * 0.006), 0.03 - r * 0.012, -0.012))));
      pts.push(wp(R.pelvis, sacH.clone().add(new THREE.Vector3(sg * (0.045 + r * 0.004), -0.03 - r * 0.004, -0.02))));
      pts.push(wp(R.pelvis, G.H.clone().add(new THREE.Vector3(sg * -0.03, 0.04, -0.075 + r * 0.002))));
      const th = (k, dz) => wp(G.hip, G.H.clone().lerp(G.K, k).add(new THREE.Vector3(sg * -0.012, 0, dz)));
      pts.push(th(0.18, -0.065), th(0.45, -0.055), th(0.75, -0.05), th(0.95, -0.045));
      const sh = (k, dz) => wp(G.knee, G.K.clone().lerp(G.A, k).add(new THREE.Vector3(sg * -0.004, 0, dz)));
      pts.push(sh(0.12, -0.04), sh(0.5, -0.032), sh(0.88, -0.02), wp(G.ankle, G.A.clone().add(new THREE.Vector3(sg * -0.02, -0.03, 0.01))));
      out.push(pts);
    }
  }
  return out;
}

// ------------------------------------------------------------------ the body: lying, springing up, standing
const Q_LIE = new THREE.Quaternion();   // set in build: lying on the back, tilted so the head and the heels both rest on the mattress
let LIE_DELTA = 0;
const ARM_HANG = { dir: [0.06, -1, 0.02], twist: 0.15, elbow: 0.12 };
function poseRest() {   // standing straight, arms hanging, hands relaxed (in the body's own frame)
  const R = W.rig; standApply(R, { tho: 0.03 }, ARM_HANG, ARM_HANG);
  for (const Side of ['Right', 'Left']) { setWrist(W.hand[Side].wr, { wf: 0.1 }); W.hand[Side].curl(0.25); }
  clearArms(R);
}
// moving: bends, leans and twists (built to move); then marching on the spot (carry on)
const MOVE = [[29.9, 0, 0, 0], [30.45, 0.42, 0, 0], [31.1, -0.12, 0, 0], [31.6, 0, 0.28, 0], [32.15, 0, -0.28, 0], [32.65, 0, 0, 0.42], [33.2, 0, 0, -0.42], [33.7, 0, 0, 0]];
function moveAt(t) {
  if (t <= MOVE[0][0] || t >= MOVE[MOVE.length - 1][0]) return [0, 0, 0];
  for (let i = 0; i < MOVE.length - 1; i++) if (t < MOVE[i + 1][0]) { const k = s5(MOVE[i][0], MOVE[i + 1][0], t); return [1, 2, 3].map((j) => lerp(MOVE[i][j], MOVE[i + 1][j], k)); }
  return [0, 0, 0];
}
const MARCH = { t0: 33.85, t1: 36.15, step: 0.55 };
function marchLift(t, side) {   // the foot's height (m): right foot first, alternating
  if (t < MARCH.t0 || t > MARCH.t1) return 0;
  const u = (t - MARCH.t0) / MARCH.step, n = Math.floor(u), f = u - n, mine = (n % 2 === 0) === (side === 'Right');
  return mine ? 0.11 * Math.sin(Math.PI * f) ** 1.5 * ss(MARCH.t0, MARCH.t0 + 0.2, t) * (1 - ss(MARCH.t1 - 0.25, MARCH.t1, t)) : 0;
}
function poseStand(t) {
  const R = W.rig, br = 0.5 - 0.5 * Math.cos((t / 4.4) * Math.PI * 2), [fl, sd, tw] = moveAt(t);
  const sq = SQUASH ? Math.sin(Math.PI * clamp01((t - SQUASH[0]) / (SQUASH[1] - SQUASH[0]))) : 0;
  standApply(R, { lum: 0.6 * fl, tho: 0.03 + 0.4 * fl + 0.008 * br, cer: 0.2 * fl, side: sd, twist: tw }, ARM_HANG, ARM_HANG);
  // the arms keep hanging under the shoulders as the trunk bends and leans
  const a = 0.85 * fl, sa = 0.75 * sd;
  for (const Side of ['Right', 'Left']) { const A = R.arms[Side], s = Side === 'Right' ? -1 : 1;
    poseArm(A, { dir: [ARM_HANG.dir[0] - s * Math.sin(sa) * 0.9, -Math.cos(a) * Math.cos(sa), ARM_HANG.dir[2] + Math.sin(a)], twist: ARM_HANG.twist, elbow: ARM_HANG.elbow + 0.15 * fl });
    setWrist(W.hand[Side].wr, { wf: 0.1 }); W.hand[Side].curl(0.25); }
  R.arms.Right.girdle.rotation.z += -0.012 * br; R.arms.Left.girdle.rotation.z += 0.012 * br;
  clearArms(R);
  W.body.quaternion.identity(); W.body.position.copy(W.standP); W.body.updateMatrixWorld(true);
  R.pelvis.position.y -= 0.035 * sq;
  R.pelvis.updateMatrixWorld(true);
  for (const Side of ['Right', 'Left']) { const lift = marchLift(t, Side), tg = W.ankleW[Side].clone(); tg.y += lift; tg.z += 0.35 * lift;
    legIK(R, Side, tg, new THREE.Quaternion().setFromAxisAngle(X, -1.2 * lift)); }
  W.body.updateMatrixWorld(true);
}
function poseAt(t) {
  const R = W.rig;
  if (t >= HOP[1]) { poseStand(t); return; }
  poseRest();
  if (t < FLIP[0]) { W.body.quaternion.copy(Q_LIE); W.body.position.copy(W.lieP); }
  else { const u = clamp01((t - FLIP[0]) / (FLIP[1] - FLIP[0])), q = new THREE.Quaternion().setFromAxisAngle(X, (Math.PI / 2 - LIE_DELTA) * s5(0.08, 0.96, u));
    const a = W.pivot, b = W.heelEnd, P = new THREE.Vector3(lerp(a.x, b.x, u), lerp(a.y, b.y, s5(0.4, 1, u)) + 0.2 * Math.sin(Math.PI * Math.min(1, u / 0.8)) * (1 - s5(0.8, 1, u)), lerp(a.z, b.z, s5(0, 0.6, u)));
    W.body.quaternion.copy(q).multiply(Q_LIE); W.body.position.copy(W.lieP).sub(W.pivot).applyQuaternion(q).add(P); }
  W.body.updateMatrixWorld(true);
}

// ------------------------------------------------------------------ build
async function build(S, cfg) {
  const scene = S.scene;
  S.fog.near = 5; S.fog.far = 16;
  S.table.scale.set(4, 4, 1); S.tableMat.clearcoat = 0.1; S.tableMat.specularIntensity = 0.3;
  for (const m of [S.tableMat.map, S.tableMat.roughnessMap]) if (m) { m.wrapS = m.wrapT = THREE.RepeatWrapping; m.repeat.multiplyScalar(4); }
  const meshes = await loadAnatomy(skeletonKind());
  const R = W.rig = buildRig(meshes);
  W.body = new THREE.Group(); scene.add(W.body); W.body.add(R.root);
  for (const m of meshes) { m.castShadow = true; m.receiveShadow = true; m.layers.enable(1); }
  W.bones = meshes.filter((m) => ['bone', 'tooth', 'cartilage'].includes(m.userData.tissue));
  W.hand = {}; for (const Side of ['Right', 'Left']) { const Wr = makeWrist(R, Side); W.hand[Side] = rigHand(R, Side, Wr); W.hand[Side].wr = Wr; }
  // the factory stamp: on the back of the sacrum
  { const sc = R.byName.get('Sacrum'); sc.material = sc.material.clone();
    W.stampSpot = stampSpot(sc, { from: [0, 0.03, -0.2], dir: [0, 0, 1], spread: 0.004 });
    if (W.stampSpot) W.stamp = stamp(sc, { canvas: stampCanvas(['HUMAN FACTORY', 'SETTINGS'], '', { frame: false }), center: W.stampSpot.center, normal: W.stampSpot.normal, up: [0, 1, 0], width: 0.032, depth: 0.025, opacity: 0.6 }); }
  // ---- standing at the origin: where the body goes, where the feet are
  const gmin = Math.min(R.legs.Right.ground, R.legs.Left.ground);
  W.standP = new THREE.Vector3(0, 0.001 - gmin, -R.P0.z);
  poseRest(); W.body.quaternion.identity(); W.body.position.copy(W.standP); W.body.updateMatrixWorld(true);
  W.ankleW = {}; for (const Side of ['Right', 'Left']) { const G = R.legs[Side]; W.ankleW[Side] = G.A.clone().applyMatrix4(W.body.matrixWorld); }
  W.tufts = makeTufts(R);
  W.nerveMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xd9e6ff).multiplyScalar(1.3), transparent: true, opacity: 0, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending });
  W.nerveU = { uT: { value: 0 } };   // bright pulses running down the nerves: the tingling
  W.nerveMat.onBeforeCompile = (sh) => { sh.uniforms.uT = W.nerveU.uT;
    sh.vertexShader = 'attribute vec2 nu; varying vec2 vNu;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n  vNu = nu;');
    sh.fragmentShader = 'uniform float uT; varying vec2 vNu;\n' + sh.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\n  { float p = fract(vNu.x * 3.0 - uT * 0.7); float band = exp(-pow((p - 0.5) / 0.06, 2.0)); diffuseColor.rgb *= 0.45 + 1.7 * band; }'); };
  W.nerveMat.customProgramCacheKey = () => 'hfs-nerve';
  W.nerves = new THREE.Group(); scene.add(W.nerves);
  for (const pts of nervePaths()) { const geo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, 'centripetal'), 200, 0.003, 8); geo.setAttribute('nu', geo.attributes.uv.clone());
    const m = new THREE.Mesh(geo, W.nerveMat); m.frustumCulled = false; m.renderOrder = 8; W.nerves.add(m); }
  { const L4 = R.seg['Fourth lumbar vertebra']; W.backW = L4.pivot.clone().sub(L4.pivot).applyMatrix4(L4.g.matrixWorld); }
  // ---- lying in bed: on the back, tilted so the heels rest on the mattress as the head does; centred across it, the head near the head end
  const bb = new THREE.Box3(), v = new THREE.Vector3(), heelRe = /calcaneus/i;
  const lowGap = (d) => { Q_LIE.setFromAxisAngle(X, -Math.PI / 2 + d); W.body.quaternion.copy(Q_LIE); W.body.position.set(0, 0, 0); W.body.updateMatrixWorld(true);
    let all = 9, heelLow = 9; for (const m of W.bones) { const P = m.geometry.attributes.position, hl = heelRe.test(m.userData.name); for (let i = 0; i < P.count; i += 3) { v.fromBufferAttribute(P, i).applyMatrix4(m.matrixWorld); all = Math.min(all, v.y); if (hl) heelLow = Math.min(heelLow, v.y); } }
    return heelLow - all; };
  { let lo = 0, hi = 0.12; for (let i = 0; i < 18; i++) { const mid = (lo + hi) / 2; if (lowGap(mid) > 0.0015) lo = mid; else hi = mid; } LIE_DELTA = hi; lowGap(LIE_DELTA); }
  bb.makeEmpty(); for (const m of W.bones) { m.updateMatrixWorld(true); const P = m.geometry.attributes.position; for (let i = 0; i < P.count; i += 3) bb.expandByPoint(v.fromBufferAttribute(P, i).applyMatrix4(m.matrixWorld)); }
  W.lieP = new THREE.Vector3(-(bb.min.x + bb.max.x) / 2, BED.top + 0.002 - bb.min.y, BED.z0 + 0.15 - bb.min.z);
  W.body.position.copy(W.lieP); W.body.updateMatrixWorld(true);
  const fb = new THREE.Box3(), skull = new THREE.Box3(), heel = new THREE.Box3();
  for (const m of W.bones) { const n = m.userData.name; if (/calcaneus|talus|metatarsal|phalanx of (left|right) (big|second|third|fourth|little) toe|cuboid|navicular|cuneiform/i.test(n)) fb.expandByObject(m);
    if (/calcaneus/i.test(n)) heel.expandByObject(m); if (m.parent === R.seg.Atlas.g || /occipital|parietal|frontal bone/i.test(n)) skull.expandByObject(m); }
  W.pivot = new THREE.Vector3(0, heel.min.y, fb.max.z);
  W.upP = W.lieP.clone().sub(W.pivot).applyQuaternion(new THREE.Quaternion().setFromAxisAngle(X, Math.PI / 2 - LIE_DELTA)).add(W.pivot);
  W.heelEnd = W.pivot.clone().add(W.standP).sub(W.upP);   // where the heels come down, so the spring ends exactly in the standing pose
  W.skullLow = skull.min.y;
  // the eyes: the two deepest points of the face seen from the front (the orbits), in the lying pose
  const eyes = [];
  { const ray = new THREE.Raycaster(), head = W.bones.filter((m) => m.parent === R.seg.Atlas.g && !/mandible|tooth/i.test(m.userData.name)), cxS = (skull.min.x + skull.max.x) / 2;
    const nasal = new THREE.Box3(); for (const m of W.bones) if (/nasal bone/i.test(m.userData.name)) nasal.expandByObject(m);
    const hits = { L: [], R: [] };
    for (let dx = 0.012; dx <= 0.05; dx += 0.003) for (let dz = -0.03; dz <= 0.035; dz += 0.003) for (const sgn of [-1, 1]) {
      const o = new THREE.Vector3(cxS + sgn * dx, BED.top + 0.6, nasal.min.z + dz); ray.set(o, new THREE.Vector3(0, -1, 0)); const h = ray.intersectObjects(head, false)[0]; if (!h) continue;
      hits[sgn < 0 ? 'R' : 'L'].push(h.point.clone()); }
    for (const k of ['L', 'R']) { const H = hits[k].sort((a, b) => a.y - b.y), q = H.slice(0, Math.max(1, Math.floor(H.length / 4))); if (q.length) eyes.push(avgV(q)); } }
  W.eyes = eyes;
  W.sheet = makeSheet(scene, eyes);
  // ---- the set
  { const pz = (skull.min.z + skull.max.z) / 2 + 0.01; let low = 9; for (const m of W.bones) { const P = m.geometry.attributes.position; for (let i = 0; i < P.count; i += 2) { v.fromBufferAttribute(P, i).applyMatrix4(m.matrixWorld); if (Math.abs(v.x) < 0.31 && Math.abs(v.z - pz) < 0.18) low = Math.min(low, v.y); } }
    W.pillowTop = low - 0.004; W.bed = makeBed(scene); W.pillow = W.pillowTop - BED.top > 0.012 ? makePillow(scene, W.pillowTop, pz) : null; }
  W.night = makeNightstand(scene); W.trophy = makeTrophy(scene); W.conf = makeConfetti(scene); W.lb = makeLightbox(scene); W.card = makeCard(scene); W.disc = makeDisc(scene);
  // the ache: a slow red glow on the lower back
  W.ache = glowSprite(new THREE.Color(0xd8423a), 0.2); W.ache.material.depthTest = false; W.ache.renderOrder = 9; scene.add(W.ache);
  // ---- light
  W.key = spot(scene, { color: 0xe6ecff, pos: new THREE.Vector3(-1.6, 3.2, 2.0), target: new THREE.Vector3(0, 0.85, -0.2), angle: 0.55, penumbra: 0.6, shadow: true, size: cfg.shadow ?? 1024 }); W.key.shadow.camera.far = 9;
  W.rim = spot(scene, { color: 0x9fb6ff, pos: new THREE.Vector3(1.4, 2.3, -2.6), target: new THREE.Vector3(0, 1.0, -0.4), angle: 0.5, penumbra: 0.9 });
  W.fill = spot(scene, { color: 0xc8d6ff, pos: new THREE.Vector3(2.2, 1.6, 2.4), target: new THREE.Vector3(0, 0.9, 0), angle: 0.6, penumbra: 1 });
  W.moon = spot(scene, { color: 0x9db4ff, pos: new THREE.Vector3(2.1, 1.55, -1.15), target: new THREE.Vector3(-0.1, BED.top + 0.05, -1.5), angle: 0.55, penumbra: 0.8, shadow: true, size: 1024 }); W.moon.shadow.camera.far = 6;
  W.trophyLight = spot(scene, { color: 0xfff1d6, pos: new THREE.Vector3(TROPHY.x + 0.3, 2.7, TROPHY.z + 0.6), target: new THREE.Vector3(TROPHY.x, PLINTH_H + 0.12, TROPHY.z), angle: 0.17, penumbra: 0.5 });
  W.lbLight = new THREE.PointLight(0xeef2f8, 0, 3.5, 2); W.lbLight.position.copy(new THREE.Vector3(0, LB.y, 0.45).applyAxisAngle(Y, LB.ry).add(new THREE.Vector3(LB.x, 0, LB.z))); scene.add(W.lbLight);
  W.cardLight = spot(scene, { color: 0xfff1e0, pos: new THREE.Vector3(1.0, 1.6, 0.6), target: CARD.clone().add(new THREE.Vector3(0, 0.04, 0)), angle: 0.18, penumbra: 0.7 });
  W.discLight = spot(scene, { color: 0xfff1d6, pos: new THREE.Vector3(PED.x + 0.3, 2.4, PED.z + 0.3), target: new THREE.Vector3(PED.x, PED_H, PED.z), angle: 0.2, penumbra: 0.6 });
  W.hairLight = spot(scene, { color: 0xfff4e6, pos: W.backW.clone().add(new THREE.Vector3(0.35, -0.2, 1.3)), target: W.backW.clone().add(new THREE.Vector3(0, -0.08, 0)), angle: 0.095, penumbra: 0.6 });   // a pool of light on the lumbar spine
  W.auditSolids = [['bed', W.bed], ...(W.pillow ? [['pillow', W.pillow]] : []), ['sheet', W.sheet.g], ['nightstand', W.night.g], ['trophy', W.trophy], ['light box', W.lb.g], ['card', W.card.g], ['disc', W.disc.g, { floor: false }],
    ...W.tufts.map((m, i) => ['hair ' + i, m])];
  W.timing = { sheetOff: SHEET_OFF, flip: FLIP, hop: HOP, land: HOP[1], squash: SQUASH, confetti: CONF_T, stamps: STAMPS_T, grids: GRID.map((g) => [g.t0, g.t0 + g.dur]),
    films: [T.yet - 0.1, T.nine + 0.2], scans: [T.worn + 0.15, T.discs + 0.5], hair: HAIR, hairOff: HAIR_OFF, move: MOVE.map((m) => m[0]),
    march: [...Array(Math.floor((MARCH.t1 - MARCH.t0) / MARCH.step) + 1).keys()].map((i) => +(MARCH.t0 + (i + 0.5) * MARCH.step).toFixed(3)).filter((x) => x < MARCH.t1),
    card: [T.not - 0.05, T.not + 0.35], nerves: [T.emergency - 0.3, 74.3], pedUp: [74.2, 75.2], logo: T.logo };
  return { stamp: W.stampSpot, lieP: W.lieP.toArray().map((x) => +x.toFixed(3)), pivot: W.pivot.toArray().map((x) => +x.toFixed(3)), upP: W.upP.toArray().map((x) => +x.toFixed(3)),
    skullLow: +W.skullLow.toFixed(3), delta: +LIE_DELTA.toFixed(4), pillowTop: +W.pillowTop.toFixed(3), eyes: eyes.map((e) => e.toArray().map((x) => +x.toFixed(3))), tufts: W.tufts.length, standP: W.standP.toArray().map((x) => +x.toFixed(3)) };
}

// ------------------------------------------------------------------ the camera: one path, no cuts
let CAM = null;
function buildCam() {
  const Bk = W.backW, Pd = PED, Dt = W.disc.topY;
  const orbit = (p, l, a) => { const dx = p[0] - l[0], dz = p[2] - l[2], c = Math.cos(a), s = Math.sin(a); return [l[0] + dx * c + dz * s, p[1], l[2] - dx * s + dz * c]; };
  const toward = (p, l, k) => p.map((v, i) => l[i] + (v - l[i]) * k);
  const sph = (l, d, az, el) => { const a = az * Math.PI / 180, e = el * Math.PI / 180; return [l[0] + d * Math.cos(e) * Math.sin(a), l[1] + d * Math.sin(e), l[2] + d * Math.cos(e) * Math.cos(a)]; };
  const OL = [-0.25, 0.7, -1.95];                                                            // the ghost in bed, from the foot end: the eyes, the ache, the candle
  const BODY = { p: [0.325, 2.931, 4.681], l: [-0.004, 1.398, -0.027] };                  // the whole body, from the front
  const SPRING = { l: [-0.004, 1.478, -0.027] }; SPRING.p = toward(BODY.p, BODY.l, 1.1).map((v, i) => v + SPRING.l[i] - BODY.l[i]);   // up! a little wider, so the hop stays under the words
  const TRO = { p: [0.391, 2.402, 1.325], l: [-1.161, 1.25, -0.228] };                    // the trophy, its plate well above the bottom fifth
  const LBX = { p: [-1.075, 2.415, 3.028], l: [1.262, 1.289, 0.469] };                    // the light box, its words clear of the button column
  const HAIRV = { p: [0.12, 1.08, 0.62], l: [Bk.x, Bk.y + 0.02, Bk.z] };                  // grey hair on the spine
  const MOV = { p: orbit(BODY.p, BODY.l, -0.6), l: BODY.l };                               // built to move: three quarters from the front-left
  const CARDV = { p: [0.78, 1.25, 0.5], l: [0.24, 0.57, -0.61] };                         // the name card on the mattress, from the front-right, clear of the body
  const WARN = { p: [0.256, 2.554, 2.913], l: [-0.003, 1.588, -0.049] };                  // the upper body, from the front
  return camTrack([
    { t: -3.0, p: V3(...sph(OL, 3.7, 2, 40)), l: V3(...OL), fov: 31 },
    { t: 0.0, p: V3(...sph(OL, 3.6, 2, 40)), l: V3(...OL), fov: 31, tens: 0.3 },
    { t: 5.0, p: V3(...sph(OL, 3.35, 2, 40)), l: V3(...OL), fov: 31, stop: true },
    { t: 5.45, p: V3(...SPRING.p), l: V3(...SPRING.l), fov: 34, stop: true },
    { t: 7.0, p: V3(...toward(SPRING.p, SPRING.l, 0.985)), l: V3(...SPRING.l), fov: 34, stop: true },
    { t: 7.75, p: V3(...TRO.p), l: V3(...TRO.l), fov: 30, stop: true },
    { t: 10.95, p: V3(...toward(TRO.p, TRO.l, 0.96)), l: V3(...TRO.l), fov: 30, stop: true },
    { t: 11.7, p: V3(...LBX.p), l: V3(...LBX.l), fov: 34, stop: true },
    { t: 26.8, p: V3(...toward(LBX.p, LBX.l, 0.95)), l: V3(...LBX.l), fov: 34, stop: true },
    { t: 27.35, p: V3(...HAIRV.p), l: V3(...HAIRV.l), fov: 30, stop: true },
    { t: 29.2, p: V3(...toward(HAIRV.p, HAIRV.l, 0.97)), l: V3(...HAIRV.l), fov: 30, stop: true },
    { t: 29.55, p: V3(-0.9, 2.6, 2.4), l: V3(-0.01, 1.45, 0.0), fov: 32 },                                    // back and up, the head kept under the words
    { t: 29.9, p: V3(...MOV.p), l: V3(...MOV.l), fov: 34, stop: true },
    { t: 36.0, p: V3(...toward(orbit(MOV.p, MOV.l, 0.12), MOV.l, 0.96)), l: V3(...MOV.l), fov: 34, stop: true },
    { t: 36.4, p: V3(1.15, 1.75, 1.95), l: V3(0.5, 0.9, -0.2), fov: 31 },                                      // round the body's left, not across it
    { t: 36.75, p: V3(...CARDV.p), l: V3(...CARDV.l), fov: 28, stop: true },
    { t: 39.25, p: V3(...toward(CARDV.p, CARDV.l, 0.95)), l: V3(...CARDV.l), fov: 28, stop: true },
    { t: 39.7, p: V3(1.25, 2.75, 2.25), l: V3(0.3, 1.25, -0.2), fov: 31 },                                     // up first, so the head stays under the words
    { t: 40.2, p: V3(...orbit(WARN.p, WARN.l, 0.25)), l: V3(...WARN.l), fov: 32, stop: true },
    { t: 58.6, p: V3(...orbit(WARN.p, WARN.l, -0.05)), l: V3(...WARN.l), fov: 32, stop: true },
    { t: 60.0, p: V3(...orbit(BODY.p, BODY.l, -0.05)), l: V3(...BODY.l), fov: 34, stop: true },
    { t: 73.9, p: V3(...orbit(BODY.p, BODY.l, -0.2)), l: V3(...BODY.l), fov: 34, stop: true },
    { t: 75.3, p: V3(Pd.x + 0.3, Dt + 0.82, Pd.z + 0.5), l: V3(Pd.x, Dt, Pd.z), fov: 30 },
    { t: T.logo, p: V3(Pd.x, Dt + 0.5, Pd.z + 0.004), l: V3(Pd.x, Dt, Pd.z), fov: 30, stop: true },      // straight down on the disc: the logo
  ]);
}
function camPose(S, t) {
  const v = S.cfg.view; if (v && typeof v === 'object') return v;
  if (!CAM) CAM = buildCam();
  if (t <= T.logo) return CAM(t);
  const Q = CAM(T.logo), k = ss(T.logo, T.end, t); return { p: [Q.p[0], lerp(Q.p[1], Q.p[1] - 0.025, k), Q.p[2]], l: Q.l, fov: 30 };
}
function focusAt(S, t, P) { return Math.hypot(P.p[0] - P.l[0], P.p[1] - P.l[1], P.p[2] - P.l[2]); }

// ------------------------------------------------------------------ one moment of the film
function update(S, t) {
  const scene = S.scene, endDark = ss(T.factory - 0.5, T.logo - 0.3, t), R = W.rig;
  poseAt(t);
  // ---- the sheet: over the ghost until "let's get you up", then it flies off
  { const Sh = W.sheet, u = clamp01((t - SHEET_OFF[0]) / (SHEET_OFF[1] - SHEET_OFF[0]));
    Sh.g.visible = u < 1; Sh.g.position.set(Sh.C.x + 1.5 * u * u, Sh.C.y + 0.85 * (1 - (1 - u) * (1 - u)), Sh.C.z + 0.3 * u); Sh.g.rotation.set(-0.25 * u, 0.15 * u, 0.5 * u * u);
    const U = Sh.sheet.userData.U; Sh.sheet.material.opacity = 1 - ss(0.62, 1, u); U.uFly.value = s5(0, 0.5, u); U.uFlat.value = s5(0, 0.35, u); U.uT.value = t; }
  // ---- the ache: on the lower back while it hurts (through the sheet, in bed)
  { const L4 = R.seg['Fourth lumbar vertebra'], p = L4.pivot.clone().add(new THREE.Vector3(0, -0.01, -0.03)).sub(L4.pivot).applyMatrix4(L4.g.matrixWorld);
    if (t < SHEET_OFF[0]) p.y = sheetAt(W.sheet, p.x, p.z) + 0.015;
    const a = pulse(t, T.back - 0.2, 4.6, 0.4) * (0.55 + 0.45 * Math.sin(t * 2.6) ** 2);
    W.ache.position.copy(p); W.ache.material.opacity = a; W.ache.visible = a > 0.01; }
  // ---- the candle
  { const N = W.night, f = 0.85 + 0.1 * Math.sin(t * 13.1) + 0.06 * Math.sin(t * 29.7 + 1) + 0.04 * Math.sin(t * 47.3 + 2);
    N.glow.scale.setScalar(0.12 * f); N.core.scale.set(0.018 * (0.9 + 0.1 * f), 0.04 * f, 1); N.light.intensity = 0.9 * f * (1 - endDark); }
  // ---- the trophy's confetti
  setConfetti(W.conf, t);
  // ---- the light box: ten case films, nine stamped; then the disc scans
  { const L = W.lb, on = ss(10.9, 11.7, t) * (1 - ss(27.0, 27.6, t));
    L.glass.color.setScalar(0.012 + 0.988 * on); W.lbLight.intensity = 1.2 * on;
    const sA = s5(T.yet - 0.1, T.yet + 0.5, t) * (1 - s5(17.1, 17.5, t)), sB = s5(17.3, 17.8, t) * (1 - s5(26.9, 27.3, t));
    L.A.title.material.opacity = sA; L.A.films.forEach((m, k) => { m.material.opacity = sA * s5(T.yet + k * 0.05, T.yet + 0.5 + k * 0.05, t); });
    let n = 0; L.A.stamps.forEach((m, k) => { if (k === IDX_A_SKIP) { m.material.opacity = 0; return; } const at = STAMPS_T[n++]; const s = s5(at, at + 0.08, t); m.material.opacity = sA * s; m.scale.setScalar(1 + 0.35 * (1 - s)); });
    L.B.title.material.opacity = sB; L.B.note.material.opacity = sB * s5(T.scan, T.scan + 0.5, t);
    for (const G of L.B.grids) { const g = GRID[G.gi], lit = Math.floor(G.n * clamp01((t - g.t0) / g.dur));
      G.icons.forEach(({ m, k }) => { m.material.opacity = sB * s5(T.worn + 0.15 + (k % 10) * 0.03 + G.gi * 0.2, T.worn + 0.65 + (k % 10) * 0.03 + G.gi * 0.2, t); });
      if (lit !== G.lit) { G.lit = lit; const dark = new Set(G.order.slice(0, Math.max(0, lit))); G.icons.forEach(({ m, k }) => { const want = dark.has(k) ? L.B.icoDark : L.B.icoOk; if (m.material.map !== want) { m.material.map = want; m.material.needsUpdate = true; } }); }
      L.B.labs[G.gi].material.opacity = sB * s5(g.t0 + g.dur - 0.2, g.t0 + g.dur + 0.2, t); } }
  // ---- grey hair: tufts grow out of the lumbar discs, then go
  { const k = s5(HAIR[0], HAIR[1], t), off = s5(HAIR_OFF[0], HAIR_OFF[1], t);
    W.tufts.forEach((m, i) => { const g = clamp01(k * 1.25 - (i % 13) * 0.02) * (1 - off); m.visible = g > 0.01; m.geometry.setDrawRange(0, Math.max(6, Math.floor(m.userData.n * g / 30) * 30)); }); }
  // ---- the name card: PHYSIOTHERAPIST, flipped over: MATTRESS
  { const f = s5(T.not - 0.05, T.not + 0.35, t), bounce = t > T.not + 0.35 ? 0.08 * Math.exp(-(t - T.not - 0.35) * 8) * Math.sin((t - T.not - 0.35) * 30) : 0;
    const gone = s5(39.4, 39.85, t); W.card.g.scale.setScalar(Math.max(1e-3, 1 - gone));   // once the camera whips away it goes: no words left low in the frame
    W.card.flip.rotation.y = Math.PI * f + bounce; W.card.g.visible = t > 15 && gone < 0.999; }
  // ---- the nerves: lit, plainly, for the emergency signs
  { const a = s5(T.emergency - 0.3, T.emergency + 0.8, t) * (1 - s5(73.9, 74.5, t)); W.nerveMat.opacity = 0.75 * a; W.nerveU.uT.value = t; W.nerves.visible = a > 0.005 && t > HOP[1]; }
  // ---- the disc model: up out of the floor; the logo
  { const D = W.disc, up = s5(74.2, 75.2, t); D.g.visible = up > 0.001; D.g.position.y = -(PED_H + 0.1) * (1 - up);
    const lk = s5(T.final + 0.4, T.logo - 0.25, t); D.logo.set({ weight: lk, white: lk, hours: 0, hand: ss(T.logo - 0.4, T.logo - 0.15, t), handScale: outBack(clamp01((t - (T.logo - 0.4)) / 0.35), 1.8) }); }
  // ---- light
  const fig = 1 - endDark, night = 1 - ss(6.2, 7.4, t);
  const hairK = pulse(t, 27.0, 29.45, 0.35), dim = 1 - 0.97 * hairK;   // the grey hair close-up: only the lumbar spine lit, the ribs above in the dark behind the words
  W.key.intensity = (2.2 + 11.8 * (1 - night)) * fig * dim; W.rim.intensity = 4 * fig * dim; W.fill.intensity = (0.5 + 0.8 * (1 - night)) * fig * dim; W.moon.intensity = 9 * night * fig;
  W.hairLight.intensity = 3.5 * hairK;
  W.trophyLight.intensity = 22 * fig * pulse(t, 6.9, 11.6, 0.6); W.cardLight.intensity = 5 * pulse(t, 36.2, 39.6, 0.4) * fig;
  W.discLight.intensity = 4.5 * fig * ss(74.4, 75.4, t);
  S.tableMat.color.setScalar(0.32 * (1 - endDark * 0.9)); scene.environmentIntensity = 0.12 * (1 - endDark) * (1 - 0.85 * hairK); S.reflAmt = 0.5 * (1 - endDark);
}

// ------------------------------------------------------------------ the words on screen
const CAPS = [
  { t0: T.your, t1: 2.95, top: 292, size: 86, html: 'Your back hurts,<br>so you spend<br>the <em>weekend in bed</em>' },
  { t0: T.like, t1: 5.05, top: 300, size: 92, html: 'like a<br><em>Victorian ghost</em>.' },
  { t0: T.lets, t1: 6.95, top: 300, size: 92, html: 'Let’s <em>get you up</em>.' },
  { t0: T.lower, t1: 11.05, top: 292, size: 82, html: 'Lower back pain is<br>the <em>number one</em> cause<br>of disability on Earth,' },
  { t0: T.yet, t1: 17.2, top: 292, size: 82, html: 'yet about <em>9 times in 10</em>,<br>doctors can’t pin it<br>on any disease<br>or damage.' },
  { t0: T.worn, t1: 19.8, top: 292, size: 86, html: 'Worn discs on a scan<br>are <em>normal</em>:' },
  { t0: T.over, t1: 23.25, top: 292, size: 84, html: 'over a third of<br>pain-free <em>20-year-olds</em><br>have them,' },
  { t0: T.and, t1: 26.8, top: 292, size: 86, html: 'and almost every<br>pain-free <em>80-year-old</em>.' },
  { t0: T.its, t1: 29.2, top: 300, size: 92, html: 'It’s <em>grey hair</em><br>for your spine.' },
  { t0: T.your2, t1: 33.6, top: 292, size: 82, html: 'Your back was built<br>to <em>move</em>, and the pain<br>usually eases<br>in a few weeks,' },
  { t0: T.so, t1: 36.2, top: 300, size: 92, html: 'so <em>stay active</em><br>and carry on.' },
  { t0: T.your3, t1: 39.4, top: 292, size: 86, html: 'Your mattress is not<br>a <em>physiotherapist</em>.' },
  { t0: T.see, t1: 43.95, top: 292, size: 82, html: 'See a <em>doctor</em> if it’s<br>not better in<br>a few weeks, it stops<br>your daily life,' },
  { t0: T.its2, t1: 47.3, top: 292, size: 86, html: 'it’s worse at night,<br>you lose weight<br>without trying,' },
  { t0: T.theres, t1: 50.6, top: 292, size: 86, html: 'there’s a lump<br>or swelling,<br>or you’re worried.' },
  { t0: T.get2, t1: 54.55, top: 292, size: 84, html: 'Get an <em>urgent</em><br>appointment if you feel<br>hot, shivery or unwell,' },
  { t0: T.or2, t1: 58.95, top: 292, size: 84, html: 'or the pain is sudden<br>and severe, or getting<br>worse fast.' },
  { t0: T.and2, t1: 64.1, top: 292, size: 80, html: 'And get <em>emergency help</em><br>for pain, tingling,<br>numbness or weakness<br>in both legs,' },
  { t0: T.numbness2, t1: 69.2, top: 292, size: 82, html: 'numbness around<br>your genitals or bottom,<br>bladder or bowel<br>changes,' },
  { t0: T.changed, t1: 74.5, top: 292, size: 82, html: 'changed feeling<br>during sex, chest pain,<br>or pain after<br>a serious accident.' },
  { t0: T.final, t1: 99, top: 360, size: 92, html: 'Let’s get you back to<br><em>factory settings.</em>' },
];
function overlayInit(S) {}
function overlay(S, t) {
  const c = new THREE.Vector3(PED.x, W.disc.topY, PED.z);
  logoEnd(S, t, { t0: T.logo, center: c, edge: c.clone().add(new THREE.Vector3(0, 0, LOGO_R)) });
}

makeFilm({
  T, caps: CAPS, subs: [], build, update, pose: camPose, overlay, overlayInit, focus: focusAt,
  stage: { bg: 0x07080a, reflSize: 8, env: 0.12, far: 30 },
  aperture: [[0, 0.003], [7.75, 0.003], [11.7, 0.002], [27.35, 0.003], [29.9, 0.002], [36.75, 0.003], [40.3, 0.002], [60.0, 0.002], [75.2, 0.003]],
  bloom: [[0, 0.45], [75, 0.55]],
  fast: [[5.0, 6.75, 2], [6.9, 7.85, 2], [10.9, 11.8, 2], [26.7, 27.45, 2], [29.1, 30.0, 2], [35.9, 36.85, 2], [39.2, 40.4, 2], [58.6, 60.1, 2], [73.8, 75.3, 2]],
});

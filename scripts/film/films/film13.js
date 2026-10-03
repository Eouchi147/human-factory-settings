// Human Factory Settings · Film 13 "Why does my lower back hurt?" · one continuous shot, 9:16.
// A skeleton stands bent a little, a hand on its lower back, which glows. Beside it, on a plinth under a spotlight, a gold
// trophy: "No. 1 cause of disability, worldwide" (the gag). A light box: ten case films, nine stamped NON-SPECIFIC; disc
// scans of people with no back pain, a hundred aged 20 and a hundred aged 80, the worn discs going dark (37, then 96);
// stamped NORMAL AGEING, NOT DISEASE; pain falling from 52 to 23 in six weeks, and 73% back within a year. On a mat, the
// skeleton does the dead bug, a core stability exercise: 29 trials, no better than other exercise. Stay active: it walks
// past an empty bed. The warnings, plain: the nerve roots of the lower back, down both legs. A disc model on a stand, seen
// from above, becomes the logo. The factory stamp is on the back of the sacrum.
import { THREE, ss, s5, lerp, clamp01, hash, camTrack, phys, shadows, spot, RoundedBoxGeometry, glowSprite,
  loadAnatomy, V3, place, logoEnd, makeFilm, outBack, stamp, stampCanvas, stampSpot, noiseTex } from '../kit.js';
import { buildRig, skeletonKind, bendSpine, poseArm, legIK, walkAt, ARM0 } from '../rig.js';
import { makeLogoRing } from '../props.js';

// ------------------------------------------------------------------ timing, from the voice guide (word starts)
const T = {
  end: 77.3,
  lower: 0.35, world: 2.15, leading: 3.03, disability: 3.93,                                            // "Lower back pain. The world's leading cause of disability."
  most: 5.31, once: 7.03, nine: 8.85, ten: 9.70, cant: 9.99, disease: 11.60, damage: 12.52,
  disc: 14.11, scan: 16.12, t37: 18.19, twenty: 20.14, eighty: 22.13, t96: 22.48,
  verdict: 26.18, normal: 26.63, not: 27.85,
  eases: 30.87, weeks: 32.07, comes: 34.23,
  core: 35.44, review: 38.48, t29: 39.06, noBetter: 40.13, other: 42.51,
  nhs: 44.86, stay: 46.30, carry: 47.47, dont: 49.09, bed: 49.76,
  notEasing: 51.76, seeDoc: 57.93, pain: 59.72, legs: 62.84, emergency: 70.32,
  back: 73.09, factory: 73.95, settings: 74.25, logo: 74.95,
};

// ------------------------------------------------------------------ the set (metres, floor at y = 0)
const W = {}; window.HFS_W = W;
const X = new THREE.Vector3(1, 0, 0), Y = new THREE.Vector3(0, 1, 0), Z = new THREE.Vector3(0, 0, 1);
const TROPHY = new THREE.Vector3(-0.58, 0, 0.32), PLINTH_H = 0.92;
const LB = { x: 0.35, z: 3.0, y: 1.1, w: 0.98, h: 1.08 };          // the light box, ahead of the skeleton: faces -z; its content is 0.9 wide, from y 0.6 to 1.6
const MAT = { x: -1.5, z: 1.6, len: 1.83, wid: 0.61, h: 0.006 };   // the mat, along x
const BED = { x0: -1.48, x1: -0.58, z0: -3.05, z1: -1.05, top: 0.5, base: 0.3 };   // the bed along z, the head at -z
const WALK = { ax: -0.32, az: -2.55, t0: 45.0, t1: 50.9 };          // the walk: from here to the origin
const PED = new THREE.Vector3(0.75, 0, 0.55), PED_H = 0.9, LOGO_R = 0.034;
const SWAP1 = 20.0, SWAP2 = 44.85;                                   // when the skeleton moves, out of sight: to the mat; to the walk
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

// ------------------------------------------------------------------ the trophy (the gag): gold, on a plinth, under its own light
function makeTrophy(scene) {
  const g = new THREE.Group(); g.position.copy(TROPHY); scene.add(g);
  const stone = phys({ color: 0x1b1c20, roughness: 0.5, clearcoat: 0.3 });
  const plinth = new THREE.Mesh(new RoundedBoxGeometry(0.34, PLINTH_H, 0.34, 4, 0.008), stone); plinth.position.y = PLINTH_H / 2; g.add(plinth);
  const gold = new THREE.MeshPhysicalMaterial({ color: 0xd8b25a, metalness: 1, roughness: 0.22, clearcoat: 0.4 });
  const prof = [[0, 0], [0.052, 0], [0.052, 0.012], [0.04, 0.016], [0.034, 0.02], [0.012, 0.03], [0.009, 0.06], [0.011, 0.075], [0.03, 0.09], [0.05, 0.12], [0.06, 0.16], [0.064, 0.2], [0.058, 0.2], [0.054, 0.165], [0.044, 0.125], [0.02, 0.1], [0, 0.098]].map(([r, y]) => new THREE.Vector2(r, y));
  const cup = new THREE.Mesh(new THREE.LatheGeometry(prof, 96), gold); cup.position.y = PLINTH_H + 0.075; g.add(cup);
  for (const s of [-1, 1]) {   // the handles
    const h = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.0055, 16, 48, Math.PI * 1.15), gold); h.position.set(s * 0.066, PLINTH_H + 0.075 + 0.155, 0); h.rotation.z = s > 0 ? -Math.PI * 0.62 : Math.PI * 1.62; g.add(h);
  }
  const base = new THREE.Mesh(new RoundedBoxGeometry(0.2, 0.075, 0.17, 3, 0.004), phys({ color: 0x0c0c0e, roughness: 0.3, clearcoat: 0.6 })); base.position.y = PLINTH_H + 0.0375; g.add(base);
  const plate = canvasTex(512, 230, (x, w, h) => { const gr = x.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#e9cf8a'); gr.addColorStop(0.5, '#c79f4a'); gr.addColorStop(1, '#e4c57a'); x.fillStyle = gr; x.fillRect(0, 0, w, h);
    x.strokeStyle = 'rgba(70,50,10,0.55)'; x.lineWidth = 6; x.strokeRect(10, 10, w - 20, h - 20);
    txt(x, 'No. 1', w / 2, 74, { font: '800 84px Archivo', color: '#4a3510', track: 2 });
    txt(x, 'CAUSE OF DISABILITY', w / 2, 146, { font: '800 46px Archivo', color: '#3d2b0b', track: 4, maxW: w * 0.9 });
    txt(x, 'WORLDWIDE', w / 2, 196, { font: '700 36px "Geist Mono"', color: '#3d2b0b', track: 8 }); });
  const pm = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 0.0674), new THREE.MeshPhysicalMaterial({ map: plate, metalness: 0.5, roughness: 0.4 })); pm.position.set(0, PLINTH_H + 0.0375, 0.0852); g.add(pm);
  g.rotation.y = Math.PI - 0.45;   // the plate turns toward the camera
  shadows(g); g.traverse((o) => o.layers.enable(1));
  return { g };
}

// ------------------------------------------------------------------ the light box and its four slides (built in its own frame: +x right, +y up, facing +z)
const IDX_A_SKIP = 6;   // the one case film that is not stamped
function spineFilm(dark, k) {   // a lumbar spine seen from the side, as on an X-ray (dark = a worn, dark disc on the scan)
  return (x, w, h) => {
    x.fillStyle = '#0b0d10'; x.fillRect(0, 0, w, h);
    const g = x.createRadialGradient(w * 0.5, h * 0.5, 4, w * 0.5, h * 0.5, w * 0.8); g.addColorStop(0, 'rgba(70,80,95,0.35)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h);
    const n = 5, top = h * 0.12, bh = (h * 0.62) / n, j = (i) => 0.02 * Math.sin(k * 3.1 + i * 1.7);
    for (let i = 0; i < n; i++) {   // vertebral bodies, a gentle curve, discs between
      const y = top + i * bh * 1.2, cx = w * (0.44 + 0.06 * Math.sin((i / (n - 1)) * Math.PI) + j(i));
      x.fillStyle = 'rgba(214,220,228,0.86)'; x.beginPath(); x.roundRect(cx - w * 0.15, y, w * 0.3, bh * 0.92, 6); x.fill();
      x.fillStyle = 'rgba(190,196,206,0.55)'; x.beginPath(); x.roundRect(cx + w * 0.15, y + bh * 0.2, w * 0.14, bh * 0.5, 5); x.fill();   // the arch and the spine behind
      if (i < n - 1) { const dk = dark && i === (k % 2 ? 3 : 2); x.fillStyle = dk ? 'rgba(18,20,24,1)' : 'rgba(150,175,205,0.75)'; x.beginPath(); x.ellipse(cx, y + bh * 1.06, w * 0.14, bh * 0.12, 0, 0, Math.PI * 2); x.fill(); }
    }
    x.fillStyle = 'rgba(214,220,228,0.7)'; x.beginPath(); x.moveTo(w * 0.32, h * 0.86); x.lineTo(w * 0.62, h * 0.84); x.lineTo(w * 0.52, h * 0.97); x.closePath(); x.fill();   // the sacrum
  };
}
function stampTex(word, { w = 600, h = 170, color = '#c2312b', size = 92 } = {}) {
  return canvasTex(w, h, (x) => { x.clearRect(0, 0, w, h); x.strokeStyle = color; x.lineWidth = 10; x.beginPath(); x.roundRect(10, 10, w - 20, h - 20, 18); x.stroke();
    txt(x, word, w / 2, h / 2 + 4, { font: `900 ${size}px Archivo`, color, track: 6, maxW: w * 0.86 });
    x.globalCompositeOperation = 'destination-out'; for (let i = 0; i < 900; i++) { x.fillStyle = `rgba(0,0,0,${0.15 + 0.5 * hash(i * 7.3)})`; x.fillRect(hash(i) * w, hash(i * 3.1) * h, 1 + 3 * hash(i * 1.7), 1 + 2 * hash(i * 2.3)); } });
}
function makeLightbox(scene) {
  const g = new THREE.Group(); g.position.set(LB.x, 0, LB.z); g.rotation.y = Math.PI; scene.add(g);   // local +z -> world -z
  const frameM = phys({ color: 0x15161a, roughness: 0.45, clearcoat: 0.3 });
  const frame = new THREE.Mesh(new RoundedBoxGeometry(LB.w + 0.06, LB.h + 0.06, 0.05, 4, 0.01), frameM); frame.position.set(0, LB.y, -0.026); g.add(frame);
  for (const s of [-1, 1]) { const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, LB.y - LB.h / 2 + 0.02, 16), frameM); leg.position.set(s * 0.36, (LB.y - LB.h / 2) / 2, -0.03); g.add(leg); const foot = new THREE.Mesh(new RoundedBoxGeometry(0.06, 0.02, 0.36, 2, 0.006), frameM); foot.position.set(s * 0.36, 0.01, -0.03); g.add(foot); }
  const glass = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xeef2f8), toneMapped: true });
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(LB.w, LB.h), glass); panel.position.set(0, LB.y, 0.0005); g.add(panel);
  const Zs = 0.002, plane = (w, h, tex, x, y, o = {}) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0, depthWrite: false, ...o })); m.position.set(x, y, Zs); g.add(m); return m; };
  const title = (s, y) => plane(0.86, 0.066, canvasTex(1720, 132, (x, w, h) => { x.clearRect(0, 0, w, h); txt(x, s, w / 2, h / 2 + 2, { font: '700 86px "Geist Mono"', color: '#2a2d33', track: 8, maxW: w * 0.98 }); }), 0, y);
  // slide A: ten case films, nine stamped
  const A = { title: title('LOW BACK PAIN · 10 CASES', 1.53), films: [], stamps: [] };
  for (let k = 0; k < 10; k++) { const i = k % 5, j = Math.floor(k / 5), x = -0.36 + i * 0.18, y = 1.27 - j * 0.42;
    A.films.push(plane(0.15, 0.36, canvasTex(200, 480, spineFilm(false, k)), x, y));
    const st = plane(0.17, 0.048, stampTex('NON-SPECIFIC', { size: 84 }), x, y - 0.02); st.rotation.z = 0.32 + 0.06 * (hash(k) - 0.5); st.position.z += 0.0004; A.stamps.push(st); }
  // slide B: disc scans of people with no back pain: a hundred at 20, a hundred at 80
  const B = { title: title('NO BACK PAIN · DISC SCANS', 1.53), grids: [], labs: [], note: null };
  const icon = (dark) => canvasTex(96, 132, (x, w, h) => { x.clearRect(0, 0, w, h); x.fillStyle = 'rgba(28,30,36,0.9)'; x.beginPath(); x.roundRect(10, 6, w - 20, 44, 10); x.fill(); x.beginPath(); x.roundRect(10, h - 50, w - 20, 44, 10); x.fill();
    x.fillStyle = dark ? '#0a0b0d' : '#7fb2e6'; x.beginPath(); x.ellipse(w / 2, h / 2, w / 2 - 12, 13, 0, 0, Math.PI * 2); x.fill(); if (dark) { x.strokeStyle = '#c2312b'; x.lineWidth = 5; x.stroke(); } });
  const icoOk = icon(false), icoDark = icon(true), icoDark2 = icoDark;
  [[-0.215, 'AGE 20', 37], [0.215, 'AGE 80', 96]].forEach(([cx, lab, n], gi) => {
    const icons = [];
    for (let k = 0; k < 100; k++) { const i = k % 10, j = Math.floor(k / 10), x = cx - 0.171 + i * 0.038, y = 1.395 - j * 0.069;
      const m = plane(0.033, 0.0454, icoOk, x, y); icons.push({ m, k }); }
    // which ones show a worn disc: spread through the grid, the same each time
    const order = [...Array(100).keys()].sort((a, b) => hash(a * 13.7 + gi * 101) - hash(b * 13.7 + gi * 101));
    const dark = new Set(order.slice(0, n));
    B.grids.push({ icons, dark, order: order.slice(0, n), n, gi });
    B.labs.push(plane(0.36, 0.11, canvasTex(720, 220, (x, w, h) => { x.clearRect(0, 0, w, h); txt(x, lab, w / 2, 52, { font: '600 54px "Geist Mono"', color: '#4a4f58', track: 10 }); txt(x, n + '%', w / 2, 152, { font: '900 112px Archivo', color: '#16181c', track: 2 }); }), cx, 0.6 + 0.04));
  });
  B.icoDark = [icoDark, icoDark2]; B.icoOk = icoOk;
  B.note = plane(0.6, 0.026, canvasTex(1200, 52, (x, w, h) => { x.clearRect(0, 0, w, h); txt(x, '33 STUDIES · 3,110 PEOPLE', w / 2, h / 2 + 1, { font: '600 34px "Geist Mono"', color: '#6a6f78', track: 8 }); }), 0, 0.565);
  // slide C: the verdict, stamped over the scans
  const C = { normal: plane(0.62, 0.15, stampTex('NORMAL AGEING', { w: 900, h: 220, size: 120 }), 0, 1.16), not: plane(0.5, 0.13, stampTex('NOT DISEASE', { w: 760, h: 200, size: 116 }), 0.04, 0.9) };
  C.normal.rotation.z = 0.12; C.not.rotation.z = -0.08; C.normal.position.z += 0.001; C.not.position.z += 0.0012;
  // slide D: pain, out of 100: 52 at the start, 23 at six weeks; and 73% back within a year
  const D = { title: title('PAIN, OUT OF 100', 1.53) };
  D.axes = plane(0.8, 0.62, canvasTex(1600, 1240, (x, w, h) => { x.clearRect(0, 0, w, h); x.strokeStyle = '#2a2d33'; x.lineWidth = 5;
    const X0 = 150, Y0 = 1080, X1 = 1520, Y1 = 80; x.beginPath(); x.moveTo(X0, Y1); x.lineTo(X0, Y0); x.lineTo(X1, Y0); x.stroke();
    for (const v of [0, 50, 100]) { const y = Y0 - (v / 100) * (Y0 - Y1); x.strokeStyle = 'rgba(42,45,51,0.18)'; x.lineWidth = 3; x.beginPath(); x.moveTo(X0, y); x.lineTo(X1, y); x.stroke(); txt(x, String(v), X0 - 24, y, { font: '600 64px "Geist Mono"', color: '#4a4f58', align: 'right' }); }
    for (let wk = 0; wk <= 6; wk++) { const xx = X0 + (wk / 6) * (X1 - X0 - 80); txt(x, String(wk), xx, Y0 + 70, { font: '600 64px "Geist Mono"', color: '#4a4f58' }); }
    txt(x, 'WEEKS', (X0 + X1) / 2, Y0 + 150, { font: '600 60px "Geist Mono"', color: '#4a4f58', track: 10 }); }), 0, 1.06);
  D.line = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial({ color: 0xc2312b, transparent: true, opacity: 0, depthWrite: false })); D.line.position.z = Zs + 0.0006; g.add(D.line);
  const ax = (wk) => -0.4 + (150 + (wk / 6) * (1520 - 150 - 80)) / 1600 * 0.8, ay = (v) => 1.06 + 0.31 - (1080 - (v / 100) * 1000) / 1240 * 0.62;
  D.p0 = new THREE.Vector2(ax(0), ay(52)); D.p1 = new THREE.Vector2(ax(6), ay(23));
  D.dot0 = plane(0.022, 0.022, null, D.p0.x, D.p0.y, { color: 0xc2312b }); D.dot1 = plane(0.022, 0.022, null, D.p1.x, D.p1.y, { color: 0xc2312b });
  D.dot0.geometry = new THREE.CircleGeometry(0.011, 32); D.dot1.geometry = new THREE.CircleGeometry(0.011, 32);
  D.lab0 = plane(0.16, 0.066, canvasTex(240, 100, (x, w, h) => { x.clearRect(0, 0, w, h); txt(x, '52', w / 2, h / 2, { font: '900 80px Archivo', color: '#c2312b' }); }), D.p0.x + 0.07, D.p0.y + 0.03);
  D.lab1 = plane(0.16, 0.066, canvasTex(240, 100, (x, w, h) => { x.clearRect(0, 0, w, h); txt(x, '23', w / 2, h / 2, { font: '900 80px Archivo', color: '#c2312b' }); }), D.p1.x - 0.02, D.p1.y + 0.05);
  D.again = plane(0.6, 0.145, canvasTex(1240, 300, (x, w, h) => { x.clearRect(0, 0, w, h); x.fillStyle = '#16181c'; x.beginPath(); x.roundRect(0, 0, w, h, 30); x.fill();
    txt(x, '73%', 190, h / 2 + 4, { font: '900 130px Archivo', color: '#eef2f8' }); txt(x, 'HAD IT AGAIN', 760, 112, { font: '800 64px Archivo', color: '#eef2f8', track: 3 }); txt(x, 'WITHIN A YEAR', 760, 196, { font: '800 64px Archivo', color: '#eef2f8', track: 3 }); }), 0, 0.68);
  g.traverse((o) => o.layers.enable(1)); frame.castShadow = true;
  return { g, glass, panel, A, B, C, D };
}
function lineStrip(D, k) {   // the line from 52 to 23, drawn as far as k
  const p = D.p0.clone().lerp(D.p1, k), d = p.clone().sub(D.p0), L = Math.max(1e-5, d.length()), n = new THREE.Vector2(-d.y, d.x).divideScalar(L).multiplyScalar(0.0045);
  const pts = [D.p0.x + n.x, D.p0.y + n.y, 0, D.p0.x - n.x, D.p0.y - n.y, 0, p.x + n.x, p.y + n.y, 0, p.x - n.x, p.y - n.y, 0];
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3)); geo.setIndex([0, 1, 2, 1, 3, 2]);
  D.line.geometry.dispose(); D.line.geometry = geo;
}

// ------------------------------------------------------------------ the mat, the bed (empty, the cover thrown back), the disc model
function makeMat(scene) {
  const m = new THREE.Mesh(new RoundedBoxGeometry(MAT.len, MAT.h, MAT.wid, 2, 0.003), phys({ color: 0x1d3a3c, roughness: 0.8, roughnessMap: noiseTex(4, 256, 0.75, 1.0, 30) }));
  m.position.set(MAT.x, MAT.h / 2, MAT.z); m.receiveShadow = true; m.layers.enable(1); scene.add(m); return m;
}
function makeBed(scene) {
  const g = new THREE.Group(); scene.add(g);
  const cx = (BED.x0 + BED.x1) / 2, cz = (BED.z0 + BED.z1) / 2, bw = BED.x1 - BED.x0, bl = BED.z1 - BED.z0;
  const lacquer = phys({ color: 0x0c0d0f, roughness: 0.34, clearcoat: 0.6, clearcoatRoughness: 0.25 });
  const fabric = (c) => phys({ color: c, roughness: 0.92, sheen: 0.6, sheenColor: new THREE.Color(0x8a93a6), sheenRoughness: 0.6, roughnessMap: noiseTex(5, 256, 0.82, 1.0, 40) });
  const frame = new THREE.Mesh(new RoundedBoxGeometry(bw + 0.05, 0.16, bl + 0.05, 4, 0.012), lacquer); frame.position.set(cx, 0.142, cz); g.add(frame);
  const head = new THREE.Mesh(new RoundedBoxGeometry(bw + 0.08, 0.86, 0.07, 5, 0.025), fabric(0x262a31)); head.position.set(cx, 0.53, BED.z0 - 0.06); g.add(head);
  const mat = new THREE.Mesh(new RoundedBoxGeometry(bw, BED.top - BED.base, bl, 4, 0.03), fabric(0x30343c)); mat.position.set(cx, (BED.top + BED.base) / 2, cz); g.add(mat);
  // the pillow, with a dent
  const pg = new THREE.SphereGeometry(1, 96, 48), P = pg.attributes.position, sp = (u, e) => Math.sign(u) * Math.pow(Math.abs(u), e);
  for (let i = 0; i < P.count; i++) { const x = sp(P.getX(i), 0.32) * 0.3, y = sp(P.getY(i), 0.75) * 0.06, z = sp(P.getZ(i), 0.32) * 0.19; const dent = y > 0 ? 0.035 * Math.exp(-(x * x + (z - 0.02) * (z - 0.02)) / 0.006) : 0; P.setXYZ(i, x, y - dent, z); }
  pg.computeVertexNormals(); const pil = new THREE.Mesh(pg, fabric(0x3a3f48)); pil.position.set(cx, BED.top + 0.05, BED.z0 + 0.22); g.add(pil);
  // the cover, thrown back over the foot of the bed: a quilt folded on itself
  const cw = bw + 0.12, cl = 1.25, seg = 120, cg = new THREE.PlaneGeometry(cw, cl, 40, seg), C = cg.attributes.position;
  for (let i = 0; i < C.count; i++) { const x = C.getX(i), v = (C.getY(i) + cl / 2) / cl;   // v along the quilt
    const fold = 0.62, r = 0.055; let y, z;
    if (v < fold) { z = BED.z1 - 0.04 - v * cl * 0.98; y = BED.top + 0.02 + 0.012 * Math.sin(x * 13 + v * 9); }   // lying flat toward the head
    else { const a = Math.min(Math.PI, (v - fold) * cl / r); z = BED.z1 - 0.04 - fold * cl * 0.98 + Math.sin(a) * r; y = BED.top + 0.02 + r - Math.cos(a) * r; if ((v - fold) * cl > Math.PI * r) { const rest = (v - fold) * cl - Math.PI * r; z = BED.z1 - 0.04 - fold * cl * 0.98 + rest; y = BED.top + 0.02 + 2 * r + 0.01 * Math.sin(x * 11 + rest * 20); } }
    const edge = Math.abs(x) > bw / 2 ? (Math.abs(x) - bw / 2) * 1.6 : 0;   // over the sides, it drops
    C.setXYZ(i, cx + x, y - edge, z); }
  cg.computeVertexNormals();
  const cover = new THREE.Mesh(cg, phys({ color: 0x4a4f5a, roughness: 0.9, sheen: 0.7, sheenColor: new THREE.Color(0xa5adc0), sheenRoughness: 0.6, side: THREE.DoubleSide })); g.add(cover);
  shadows(g); g.traverse((o) => o.layers.enable(1));
  return g;
}
function makeDisc(scene) {   // a model of a lumbar disc on a stand: the layered ring outside, the soft centre; its top becomes the logo
  const g = new THREE.Group(); g.position.copy(PED); scene.add(g);
  const stone = phys({ color: 0x1b1c20, roughness: 0.5, clearcoat: 0.3 });
  const ped = new THREE.Mesh(new RoundedBoxGeometry(0.26, PED_H, 0.26, 4, 0.008), stone); ped.position.y = PED_H / 2; g.add(ped);
  const sh = new THREE.Shape(); const N = 72;
  for (let i = 0; i <= N; i++) { const a = (i / N) * Math.PI * 2, r = 0.062 * (1 - 0.18 * Math.max(0, Math.cos(a - Math.PI / 2)) ** 3), x = Math.cos(a) * r * 1.22, y = Math.sin(a) * r; i ? sh.lineTo(x, y) : sh.moveTo(x, y); }
  const H = 0.03, geo = new THREE.ExtrudeGeometry(sh, { depth: H, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 4, curveSegments: 72 });
  geo.rotateX(-Math.PI / 2); geo.translate(0, PED_H + 0.004, 0);
  const top = canvasTex(1024, 1024, (x, w) => { x.fillStyle = '#a3abb7'; x.fillRect(0, 0, w, w); for (let k = 0; k < 16; k++) { x.strokeStyle = k % 2 ? 'rgba(120,130,145,0.35)' : 'rgba(250,252,255,0.4)'; x.lineWidth = 9; x.beginPath(); x.ellipse(w / 2, w / 2, w * (0.46 - k * 0.017) * 1.0, w * (0.46 - k * 0.017) * 0.82, 0, 0, Math.PI * 2); x.stroke(); }
    const gr = x.createRadialGradient(w / 2, w / 2, 10, w / 2, w / 2, w * 0.2); gr.addColorStop(0, '#9fb3c9'); gr.addColorStop(1, 'rgba(159,179,201,0)'); x.fillStyle = gr; x.beginPath(); x.ellipse(w / 2, w / 2, w * 0.2, w * 0.17, 0, 0, Math.PI * 2); x.fill(); });
  // map the top texture by x and z
  const P = geo.attributes.position, uv = geo.attributes.uv; for (let i = 0; i < P.count; i++) uv.setXY(i, 0.5 + P.getX(i) / (0.062 * 1.22 * 2 * 1.04), 0.5 - P.getZ(i) / (0.062 * 2 * 1.04));
  const disc = new THREE.Mesh(geo, new THREE.MeshPhysicalMaterial({ map: top, roughness: 0.42, clearcoat: 0.6, clearcoatRoughness: 0.3, sheen: 0.3 })); g.add(disc);
  const logo = makeLogoRing(LOGO_R); logo.g.rotation.x = -Math.PI / 2; logo.g.position.y = PED_H + 0.004 + H + 0.0045; g.add(logo.g);
  shadows(g); g.traverse((o) => o.layers.enable(1));
  return { g, logo, topY: PED_H + 0.004 + H + 0.0045 };
}

// ------------------------------------------------------------------ the nerves of the lower back: roots down the canal, then down both legs (in the rig, standing)
function nervePaths() {
  const R = W.rig, s = R.seg, wp = (grp, p) => p.clone().sub(R.pivots.get(grp)).applyMatrix4(grp.matrixWorld), out = [];
  const canal = ['First lumbar vertebra', 'Second lumbar vertebra', 'Third lumbar vertebra', 'Fourth lumbar vertebra', 'Fifth lumbar vertebra'].map((n) => s[n]).filter(Boolean);
  const sac = R.byName.get('Sacrum'), sacH = sac.userData.home;
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

// ------------------------------------------------------------------ build
let SOLVED = null;
async function build(S, cfg) {
  const scene = S.scene;
  S.fog.near = 5; S.fog.far = 16;
  S.table.scale.set(4, 4, 1); S.tableMat.clearcoat = 0.1; S.tableMat.specularIntensity = 0.3;
  for (const m of [S.tableMat.map, S.tableMat.roughnessMap]) if (m) { m.wrapS = m.wrapT = THREE.RepeatWrapping; m.repeat.multiplyScalar(4); }
  const meshes = await loadAnatomy(skeletonKind());
  const R = W.rig = buildRig(meshes);
  W.body = new THREE.Group(); scene.add(W.body); W.body.add(R.root);
  for (const m of meshes) { m.castShadow = true; m.receiveShadow = true; m.layers.enable(1); }
  W.meshes = meshes;
  // the factory stamp: on the back of the sacrum
  { const sc = R.byName.get('Sacrum'); sc.material = sc.material.clone();
    W.stampSpot = stampSpot(sc, { from: [0, 0.03, -0.2], dir: [0, 0, 1], spread: 0.004 });
    if (W.stampSpot) W.stamp = stamp(sc, { canvas: stampCanvas(['HUMAN FACTORY', 'SETTINGS'], '', { frame: false }), center: W.stampSpot.center, normal: W.stampSpot.normal, up: [0, 1, 0], width: 0.032, depth: 0.025, opacity: 0.6 }); }
  // the glow of the sore lower back
  W.ache = glowSprite(new THREE.Color(0xd8423a), 0.16); W.ache.material.depthTest = false; W.ache.renderOrder = 9; scene.add(W.ache);
  // ---- the set
  W.trophy = makeTrophy(scene); W.lb = makeLightbox(scene); W.mat = makeMat(scene); W.bed = makeBed(scene); W.disc = makeDisc(scene);
  // ---- the nerves (made once, from the standing pose at the end of the walk)
  { const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xd9e6ff).multiplyScalar(1.3), transparent: true, opacity: 0, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending });
    W.nerveMat = mat; W.nerves = new THREE.Group(); scene.add(W.nerves); W.nerves.renderOrder = 8; }
  // the hand on the lower back, solved once
  poseBent(0); W.body.updateMatrixWorld(true);
  SOLVED = solveHandOnBack();
  // ---- light
  W.key = spot(scene, { color: 0xdfe6ff, pos: new THREE.Vector3(-1.6, 3.2, -1.4), target: new THREE.Vector3(0, 0.8, 0), angle: 0.55, penumbra: 0.6, shadow: true, size: cfg.shadow ?? 1024 }); W.key.shadow.camera.far = 8;
  W.rim = spot(scene, { color: 0x9fb6ff, pos: new THREE.Vector3(1.2, 2.2, 2.4), target: new THREE.Vector3(0, 1.0, 0), angle: 0.5, penumbra: 0.9 });
  W.fill = spot(scene, { color: 0xc8d6ff, pos: new THREE.Vector3(2.0, 1.6, -2.2), target: new THREE.Vector3(0, 0.9, -0.5), angle: 0.7, penumbra: 1 });
  W.trophyLight = spot(scene, { color: 0xfff1d6, pos: new THREE.Vector3(TROPHY.x + 0.2, 2.6, TROPHY.z + 0.25), target: new THREE.Vector3(TROPHY.x, PLINTH_H + 0.12, TROPHY.z), angle: 0.16, penumbra: 0.5 });
  W.matLight = spot(scene, { color: 0xe4ebff, pos: new THREE.Vector3(MAT.x + 0.4, 2.8, MAT.z + 0.4), target: new THREE.Vector3(MAT.x, 0, MAT.z), angle: 0.45, penumbra: 0.7, shadow: true, size: 1024 }); W.matLight.shadow.camera.far = 4;
  W.bedLight = spot(scene, { color: 0xb8c8ff, pos: new THREE.Vector3(-2.6, 2.6, -1.2), target: new THREE.Vector3(-1.0, 0.4, -2.0), angle: 0.5, penumbra: 0.6 });
  W.discLight = spot(scene, { color: 0xfff1d6, pos: new THREE.Vector3(PED.x + 0.3, 2.4, PED.z + 0.3), target: new THREE.Vector3(PED.x, PED_H, PED.z), angle: 0.2, penumbra: 0.6 });
  W.lbLight = new THREE.PointLight(0xeef2f8, 0, 3.5, 2); W.lbLight.position.set(LB.x, LB.y, LB.z - 0.4); scene.add(W.lbLight);
  return { stamp: W.stampSpot, hand: SOLVED && SOLVED.err };
}

// ------------------------------------------------------------------ the body, in three places: bent at the start; the dead bug on the mat; the walk and the stand
const ARM_HANG_L = { dir: [0.08, -1, 0.14], twist: 0.2, elbow: 0.25 };
function poseBent(t) {   // standing at the origin, bent a little, the right hand on the lower back; it breathes, it shifts
  const R = W.rig, br = 0.5 - 0.5 * Math.cos((t / 4.2) * Math.PI * 2);
  W.body.quaternion.identity(); W.body.position.set(0, 0, -R.P0.z);
  R.pelvis.position.copy(R.P0); R.pelvis.rotation.set(0.05, 0, 0);
  bendSpine(R.seg, { lum: 0.2 + 0.01 * br, tho: 0.14, cer: -0.12, side: 0.02 });
  for (const Side of ['Right', 'Left']) { const G = R.legs[Side]; G.hip.quaternion.setFromAxisAngle(X, -0.05); G.knee.quaternion.setFromAxisAngle(X, 0.1); G.ankle.quaternion.setFromAxisAngle(X, -0.05); }
  poseArm(R.arms.Left, ARM_HANG_L);
  if (SOLVED) poseArm(R.arms.Right, SOLVED); else poseArm(R.arms.Right, { dir: [0.4, -0.6, -0.6], twist: 0.8, elbow: 1.6 });
}
function solveHandOnBack() {
  const R = W.rig, A = R.arms.Right, L4 = R.seg['Fourth lumbar vertebra'];
  R.root.updateMatrixWorld(true);
  const hand = L4.pivot.clone().add(new THREE.Vector3(-0.045, 0.01, -0.066)).sub(L4.pivot).applyMatrix4(L4.g.matrixWorld);   // just right of the spine, behind it
  const h = new THREE.Vector3(), e = new THREE.Vector3();
  const err = (p) => { poseArm(A, p); A.girdle.updateMatrixWorld(true); A.mc.getWorldPosition(h); A.elbow.getWorldPosition(e); return h.distanceTo(hand) + 0.4 * Math.max(0, e.z - hand.z + 0.02); };
  let best = { dir: [0.45, -0.7, -0.55], twist: 0.9, elbow: 1.5, retract: 0, elevate: 0 }, bestE = err(best);
  for (const st of [0.25, 0.12, 0.06, 0.03, 0.015, 0.007, 0.003]) for (let it = 0; it < 40; it++) {
    let improved = false;
    for (const key of ['d0', 'd1', 'd2', 'twist', 'elbow']) for (const sg of [-1, 1]) {
      const c = { ...best, dir: [...best.dir] }; if (key[0] === 'd') c.dir[+key[1]] += sg * st; else c[key] += sg * st * 2;
      c.elbow = Math.min(2.6, Math.max(0, c.elbow)); const E = err(c); if (E < bestE) { bestE = E; best = c; improved = true; } }
    if (!improved) break; }
  return { ...best, err: bestE };
}
// the dead bug: lying on the back along x, the head toward +x; arms to the ceiling, hips and knees at right angles;
// one arm reaches back over the head while the other side's leg straightens toward the floor, slowly, side by side
const qDB = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(Z, X, Y));   // standing x -> +z, y -> +x, z -> +y
const DB = { t0: SWAP1, reps: [[35.9, 'R'], [38.6, 'L'], [41.3, 'R']], rep: 2.5 };
function dbAmt(t, side) { let a = 0; for (const [t0, s] of DB.reps) if (s === side) a = Math.max(a, s5(t0, t0 + 0.9, t) * (1 - s5(t0 + 1.5, t0 + DB.rep, t))); return a; }
function setLimb(G, thighDir, kneeBend) {   // thigh direction in the pelvis frame; the shank bent back by kneeBend (radians) toward -thigh's "down"
  const restT = G.K.clone().sub(G.H).normalize(); G.hip.quaternion.setFromUnitVectors(restT, thighDir.clone().normalize());
  G.knee.quaternion.setFromAxisAngle(X, kneeBend); G.ankle.quaternion.setFromAxisAngle(X, -0.25);
}
function poseDeadBug(t) {
  const R = W.rig, aR = dbAmt(t, 'R'), aL = dbAmt(t, 'L');   // R: right arm + left leg; L: left arm + right leg
  R.pelvis.position.copy(R.P0); R.pelvis.rotation.set(0, 0, 0);
  bendSpine(R.seg, { lum: 0.04, tho: 0.02, cer: 0.18 });
  const up = new THREE.Vector3(0, 0, 1), arm = (a) => ({ dir: [0.05, Math.sin(a * 1.35), Math.cos(a * 1.35)], twist: 0.1, elbow: 0.12, retract: 0, elevate: 0 });
  poseArm(R.arms.Right, arm(aR)); poseArm(R.arms.Left, arm(aL));
  for (const [Side, a] of [['Left', aR], ['Right', aL]]) {   // tabletop (thigh up, shin level) to straight and low
    const G = R.legs[Side], ang = lerp(0, 1.25, a), thigh = new THREE.Vector3(0, -Math.sin(ang), Math.cos(ang));
    setLimb(G, thigh, lerp(1.57, 0.08, a));
  }
  W.body.quaternion.copy(qDB); W.body.position.copy(W.dbP); W.body.updateMatrixWorld(true);
  void up;
}
// the walk: from (ax, az) to the origin, then standing (feet together, the leading heel planted)
const STRIDE = 1.12;
function easeDist(t, t0, t1, d, ramp) { const Tt = t1 - t0, v = d / (Tt - ramp), u = clamp01((t - t0) / Tt) * Tt; if (u < ramp) return (v * u * u) / (2 * ramp); if (u > Tt - ramp) { const r = Tt - u; return d - (v * r * r) / (2 * ramp); } return v * (u - ramp / 2); }
let WK = null;
function walkSetup() {
  const R = W.rig, dx = -WALK.ax, dz = -WALK.az, D = Math.hypot(dx, dz), yaw = Math.atan2(dx, dz);
  const S_STOP = 0.25 * STRIDE, HS = D - 0.06;                    // the right heel ends a little short of the origin; the pelvis comes over it
  const Z0 = HS - 0.27 - R.P0.z;
  const s0 = S_STOP - (D - 0.15);
  WK = { yaw, D, S_STOP, HS, Z0, s0, dist: S_STOP - s0, start: new THREE.Vector3(WALK.ax, 0, WALK.az) };
}
function standPose(hsz) {
  const R = W.rig, out = { feet: {} }, zp = hsz + (R.P0.z - R.legs.Right.heel.z);
  out.pelvis = new THREE.Vector3(R.P0.x, R.P0.y - 0.004, zp); out.pelvisRot = new THREE.Euler(0, 0, 0);
  for (const Side of ['Right', 'Left']) { const G = R.legs[Side], q = new THREE.Quaternion(); out.feet[Side] = { ankle: G.A.clone().sub(G.heel).add(new THREE.Vector3(G.heel.x, G.heel.y, hsz)), q }; }
  out.armR = ARM0; out.armL = ARM0; out.twist = 0; return out;
}
function poseWalk(t) {
  const R = W.rig; if (!WK) walkSetup();
  const s = WK.s0 + easeDist(t, WALK.t0, WALK.t1, WK.dist, 1.0), w = walkAt(R, s, { stride: STRIDE, z0: WK.Z0 });
  const k = ss(WALK.t1 - 0.75, WALK.t1 + 0.05, t);
  if (k > 0) { const st = standPose(WK.HS); w.pelvis.lerp(st.pelvis, k); w.pelvisRot.set(lerp(w.pelvisRot.x, 0, k), lerp(w.pelvisRot.y, 0, k), lerp(w.pelvisRot.z, 0, k));
    for (const Side of ['Right', 'Left']) { const a = w.feet[Side], b = st.feet[Side], lift = a.stance ? 0 : 0.035 * Math.sin(Math.PI * k); a.ankle.lerp(b.ankle, k); a.ankle.y += lift; a.q.slerp(b.q, k); }
    const mix = (x, y) => ({ dir: x.dir.map((v, i) => lerp(v, y.dir[i], k)), twist: lerp(x.twist || 0, 0, k), elbow: lerp(x.elbow, y.elbow, k), retract: 0, elevate: 0 });
    w.armR = mix(w.armR, ARM0); w.armL = mix(w.armL, ARM0); w.twist *= 1 - k; }
  // the walk's own frame: its +z along the walk, its start at (ax, az)
  W.body.quaternion.setFromAxisAngle(Y, WK.yaw); W.body.position.copy(WK.start).sub(new THREE.Vector3(0, 0, WK.Z0 + R.P0.z + WK.s0).applyAxisAngle(Y, WK.yaw)).add(new THREE.Vector3(0, 0, 0));
  W.body.updateMatrixWorld(true);
  R.pelvis.position.copy(w.pelvis); R.pelvis.rotation.copy(w.pelvisRot);
  bendSpine(R.seg, { tho: 0.04, twist: w.twist });
  poseArm(R.arms.Right, w.armR); poseArm(R.arms.Left, w.armL);
  for (const Side of ['Right', 'Left']) legIK(R, Side, w.feet[Side].ankle.clone().applyMatrix4(W.body.matrixWorld), new THREE.Quaternion().setFromAxisAngle(Y, WK.yaw).multiply(w.feet[Side].q));
  W.body.updateMatrixWorld(true);
}
function poseAt(t) {
  if (t < SWAP1) poseBent(t);
  else if (t < SWAP2) poseDeadBug(t);
  else poseWalk(t);
  W.rig.root.updateMatrixWorld(true);
}

// ------------------------------------------------------------------ the camera: one path, no cuts
let CAM = null;
function buildCam() {
  const B = W.backW, Lz = LB.z - 2.5, Ly = 1.24, Dm = W.dbC, E = W.endBack, Pd = PED, Dt = W.disc.topY, Wp = W.walkP;
  return camTrack([
    { t: -3.0, p: V3(B.x + 0.22, B.y + 0.1, B.z - 0.46), l: V3(B.x, B.y - 0.02, B.z), fov: 30 },
    { t: 0.0, p: V3(B.x + 0.21, B.y + 0.1, B.z - 0.44), l: V3(B.x, B.y - 0.02, B.z), fov: 30, tens: 0.5 },          // the sore lower back, a hand on it
    { t: 2.1, p: V3(B.x + 0.3, B.y + 0.14, B.z - 0.62), l: V3(B.x - 0.02, B.y - 0.02, B.z), fov: 30, tens: 0.5 },
    { t: 5.0, p: V3(0.55, 1.3, -1.5), l: V3(-0.3, 0.98, 0.2), fov: 30, tens: 0.4 },                                // the skeleton and its trophy
    { t: 7.6, p: V3(0.62, 1.32, -1.36), l: V3(-0.3, 1.0, 0.2), fov: 30, stop: true },
    { t: 8.3, p: V3(0.95, 1.32, -0.2), l: V3(0.55, 1.2, 1.6), fov: 36, tens: 0.5 },
    { t: 9.3, p: V3(LB.x, Ly, Lz), l: V3(LB.x, Ly - 0.003, LB.z), fov: 40, stop: true },                           // the light box
    { t: 34.9, p: V3(LB.x + 0.02, Ly, Lz + 0.06), l: V3(LB.x, Ly - 0.003, LB.z), fov: 40, stop: true },
    { t: 36.3, p: V3(Dm.x - 1.45, 1.3, Dm.z + 1.2), l: V3(Dm.x - 0.1, 0.32, Dm.z), fov: 32, stop: true },              // the dead bug, from beyond its feet
    { t: 43.9, p: V3(Dm.x - 1.4, 1.27, Dm.z + 1.15), l: V3(Dm.x - 0.1, 0.32, Dm.z), fov: 32, stop: true },
    { t: 45.7, p: V3(Wp[45.0].x + 2.9, 1.42, Wp[45.0].z + 0.5), l: V3(Wp[45.0].x - 0.2, 0.86, Wp[45.0].z + 0.35), fov: 32, tens: 0.4 },   // the walk, past the empty bed
    { t: 48.4, p: V3(Wp[47.8].x + 2.9, 1.42, Wp[47.8].z + 0.5), l: V3(Wp[47.8].x - 0.2, 0.88, Wp[47.8].z + 0.35), fov: 32, tens: 0.4 },
    { t: 51.4, p: V3(E.x + 0.45, E.y + 0.08, E.z - 1.25), l: V3(E.x, E.y - 0.2, E.z), fov: 32, stop: true },        // the warnings, from behind: the low back and both legs
    { t: 72.3, p: V3(E.x + 0.42, E.y + 0.06, E.z - 1.18), l: V3(E.x, E.y - 0.2, E.z), fov: 32, stop: true },
    { t: 72.95, p: V3(1.0, 1.35, -0.5), l: V3(PED.x, PED_H + 0.05, PED.z), fov: 30 },
    { t: 73.6, p: V3(Pd.x + 0.12, Dt + 0.3, Pd.z - 0.5), l: V3(Pd.x, Dt - 0.03, Pd.z), fov: 30 },
    { t: T.logo, p: V3(Pd.x, Dt + 0.3, Pd.z + 0.004), l: V3(Pd.x, Dt, Pd.z), fov: 30, stop: true },                 // straight down on the disc: the logo
  ]);
}
function camPose(S, t) {
  const v = S.cfg.view; if (v && typeof v === 'object') return v;
  if (!CAM) CAM = buildCam();
  if (t <= T.logo) return CAM(t);
  const Q = CAM(T.logo), k = ss(T.logo, T.end, t); return { p: [Q.p[0], lerp(Q.p[1], Q.p[1] - 0.025, k), Q.p[2]], l: Q.l, fov: 30 };
}
W.camAt = (t) => camPose({ cfg: {} }, t);
function focusAt(S, t, P) { return Math.hypot(P.p[0] - P.l[0], P.p[1] - P.l[1], P.p[2] - P.l[2]); }

// ------------------------------------------------------------------ one moment of the film
let READY = false;
function prepare() {   // world points the camera needs, from the poses
  const R = W.rig, L4 = R.seg['Fourth lumbar vertebra'];
  poseBent(0); R.root.updateMatrixWorld(true); W.backW = L4.pivot.clone().sub(L4.pivot).applyMatrix4(L4.g.matrixWorld);
  // the dead bug's place: the back flat on the mat (lowest point of the trunk on the mat's top)
  W.dbP = new THREE.Vector3(0, 0, 0); poseDeadBug(DB.t0); const b = new THREE.Box3();
  for (const m of W.meshes) if (/vertebra|sacrum|occipital|scapula|rib|parietal/i.test(m.userData.name)) b.expandByObject(m);
  const c = b.getCenter(new THREE.Vector3());
  W.dbP.set(MAT.x - c.x, MAT.h + 0.004 - b.min.y, MAT.z - c.z); poseDeadBug(DB.t0); W.dbC = new THREE.Vector3(MAT.x, 0, MAT.z);
  // the end of the walk: the lower back, and the nerves made from that pose
  poseWalk(WALK.t1 + 1); R.root.updateMatrixWorld(true); W.endBack = L4.pivot.clone().sub(L4.pivot).applyMatrix4(L4.g.matrixWorld);
  for (const pts of nervePaths()) { const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, 'centripetal'), 160, 0.0011, 6), W.nerveMat); m.frustumCulled = false; m.renderOrder = 8; W.nerves.add(m); }
  W.walkP = {}; for (const tt of [45.0, 46.4, 47.8, 49.2, 50.6, 51.6]) { poseWalk(tt); R.root.updateMatrixWorld(true); W.walkP[tt] = R.pelvis.getWorldPosition(new THREE.Vector3()); }
  READY = true;
}
W.prepare = () => { if (!READY) prepare(); };
function update(S, t) {
  if (!READY) prepare();
  const scene = S.scene, endDark = ss(T.factory - 0.5, T.logo - 0.3, t), R = W.rig;
  poseAt(t);
  // ---- the ache: a slow red glow on the lower back while it hurts (at the start)
  { const L4 = R.seg['Fourth lumbar vertebra'], p = L4.pivot.clone().add(new THREE.Vector3(0, -0.01, -0.03)).sub(L4.pivot).applyMatrix4(L4.g.matrixWorld);
    const a = (t < SWAP1 ? 1 : 0) * (1 - ss(6.5, 8.0, t)) * (0.55 + 0.45 * Math.sin(t * 2.6) ** 2);
    W.ache.position.copy(p); W.ache.material.opacity = a; W.ache.visible = a > 0.01; }
  // ---- the light box
  { const L = W.lb, on = ss(7.4, 8.4, t) * (1 - ss(35.2, 36.4, t));
    L.glass.color.setScalar(0.08 + 0.92 * on); W.lbLight.intensity = 1.2 * on;
    const sA = s5(7.6, 8.3, t) * (1 - s5(13.7, 14.2, t)), sB = s5(14.0, 14.6, t) * (1 - s5(29.0, 29.5, t)), sD = s5(29.2, 29.8, t) * (1 - s5(35.0, 35.8, t));
    L.A.title.material.opacity = sA; L.A.films.forEach((m, k) => { m.material.opacity = sA * s5(7.7 + k * 0.05, 8.2 + k * 0.05, t); });
    let n = 0; L.A.stamps.forEach((m, k) => { if (k === IDX_A_SKIP) { m.material.opacity = 0; return; } const at = T.nine + 0.2 + n * 0.42; n++; const s = s5(at, at + 0.08, t); m.material.opacity = sA * s; m.scale.setScalar(1 + 0.35 * (1 - s)); });
    L.B.title.material.opacity = sB; L.B.note.material.opacity = sB * s5(T.scan, T.scan + 0.5, t);
    for (const G of L.B.grids) { const tStart = G.gi === 0 ? T.t37 - 0.2 : T.t96 - 0.4, dur = G.gi === 0 ? 1.1 : 1.3;
      const lit = Math.floor(G.n * clamp01((t - tStart) / dur));
      G.icons.forEach(({ m, k }) => { m.material.opacity = sB * s5(T.scan - 0.4 + (k % 10) * 0.03 + G.gi * 0.2, T.scan + 0.1 + (k % 10) * 0.03 + G.gi * 0.2, t); });
      const darkNow = new Set(G.order.slice(0, lit)); G.icons.forEach(({ m, k }) => { const want = darkNow.has(k) ? L.B.icoDark[k % 2] : L.B.icoOk; if (m.material.map !== want) { m.material.map = want; m.material.needsUpdate = true; } });
      L.B.labs[G.gi].material.opacity = sB * s5(tStart + dur - 0.2, tStart + dur + 0.2, t); }
    { const c1 = s5(T.normal - 0.05, T.normal + 0.05, t), c2 = s5(T.not - 0.05, T.not + 0.05, t), fade = 1 - s5(29.0, 29.5, t);
      L.C.normal.material.opacity = c1 * fade; L.C.normal.scale.setScalar(1 + 0.3 * (1 - c1)); L.C.not.material.opacity = c2 * fade; L.C.not.scale.setScalar(1 + 0.3 * (1 - c2)); }
    { const D = L.D, k = s5(T.eases - 0.3, T.weeks + 0.3, t); D.title.material.opacity = sD; D.axes.material.opacity = sD;
      lineStrip(D, Math.max(0.001, k)); D.line.material.opacity = sD * (k > 0.002 ? 1 : 0); D.dot0.material.opacity = sD * s5(T.eases - 0.4, T.eases - 0.2, t); D.dot1.material.opacity = sD * s5(T.weeks + 0.2, T.weeks + 0.4, t);
      D.lab0.material.opacity = sD * s5(T.eases - 0.4, T.eases - 0.1, t); D.lab1.material.opacity = sD * s5(T.weeks + 0.2, T.weeks + 0.5, t);
      D.again.material.opacity = sD * s5(T.comes - 0.3, T.comes + 0.1, t); } }
  // ---- the nerves: lit, plainly, for the warnings
  { const a = s5(51.3, 52.6, t) * (1 - s5(72.6, 73.4, t)); W.nerveMat.opacity = 0.32 * a; W.nerves.visible = a > 0.005 && t > SWAP2; }
  // ---- the disc: the logo
  { const lk = s5(T.back + 0.4, T.logo - 0.25, t); W.disc.logo.set({ weight: lk, white: lk, hours: 0, hand: ss(T.logo - 0.4, T.logo - 0.15, t), handScale: outBack(clamp01((t - (T.logo - 0.4)) / 0.35), 1.8) }); }
  // ---- light
  const fig = 1 - endDark;
  W.key.intensity = 14 * fig; W.rim.intensity = 4 * fig; W.fill.intensity = 1.2 * fig;
  W.trophyLight.intensity = 22 * fig * (0.3 + 0.7 * ss(2.0, 3.0, t)); W.matLight.intensity = 9 * fig * ss(34.5, 35.8, t) * (1 - ss(45.0, 46.5, t));
  W.bedLight.intensity = 10 * fig; W.discLight.intensity = 4.5 * fig * ss(72.0, 73.5, t);
  S.tableMat.color.setScalar(0.32 * (1 - endDark * 0.9)); scene.environmentIntensity = 0.12 * (1 - endDark); S.reflAmt = 0.5 * (1 - endDark);
}

// ------------------------------------------------------------------ the words on screen
const CAPS = [
  { t0: 0.35, t1: 1.95, top: 300, size: 100, html: 'Lower <em>back pain.</em>' },
  { t0: 2.15, t1: 4.95, top: 292, size: 80, html: 'The world&rsquo;s leading<br>cause of <em>disability</em>' },
  { t0: 5.31, t1: 7.75, top: 292, size: 80, html: 'Most people get it<br><em>at least once</em>' },
  { t0: 7.99, t1: 13.6, top: 292, size: 72, html: 'About <em>9 cases in 10</em> can&rsquo;t<br>be pinned on any<br>disease or damage' },
  { t0: 14.11, t1: 15.9, top: 300, size: 92, html: 'Disc <em>degeneration?</em>' },
  { t0: 16.12, t1: 24.7, top: 292, size: 70, html: 'Scan people with<br>no back pain: <em>37%</em> of<br>20-year-olds show it.<br>At 80, <em>96%</em>' },
  { t0: 25.2, t1: 29.0, top: 292, size: 78, html: 'The authors&rsquo; verdict:<br><em>normal ageing.</em><br>Not disease.' },
  { t0: 29.54, t1: 32.9, top: 292, size: 78, html: 'Back pain usually eases<br>within <em>a few weeks</em>' },
  { t0: 33.12, t1: 34.95, top: 300, size: 88, html: 'And it often<br><em>comes back</em>' },
  { t0: 35.44, t1: 37.75, top: 300, size: 88, html: 'Core stability<br><em>exercises?</em>' },
  { t0: 37.98, t1: 44.35, top: 292, size: 70, html: 'A review of <em>29 trials:</em><br>no better in the long run<br>than other exercise' },
  { t0: 44.86, t1: 51.25, top: 292, size: 70, html: 'The NHS says: <em>stay active,</em><br>carry on with your day, and<br>don&rsquo;t stay in bed for long' },
  { t0: 51.76, t1: 57.7, top: 292, size: 70, html: 'Not easing after<br>a few weeks, worse at<br>night, or losing weight<br>without trying?' },
  { t0: 57.93, t1: 59.4, top: 300, size: 90, html: '<em>See a doctor.</em>' },
  { t0: 59.72, t1: 70.1, top: 292, size: 62, html: 'Pain, tingling, weakness or<br>numbness in both legs, lost<br>feeling around your genitals<br>or anus, or changes in<br>peeing or pooing?' },
  { t0: 70.32, t1: 72.4, top: 300, size: 88, html: 'Get <em>emergency help</em> now.' },
  { t0: 73.09, t1: 99, top: 360, size: 96, html: 'Back to<br><em>factory settings.</em>' },
];
const OVL = {};
function overlayInit(S) {
  const O = S.O, tag = (cls, txt2, size, bsize) => { const e = O.tag(cls, txt2); e.style.fontSize = size + 'px'; const b = e.querySelector('b'); if (b && bsize) b.style.fontSize = bsize + 'px'; return e; };
  OVL.db = tag('tag', 'Core stability exercise<b>the dead bug</b>', 22, 36);
}
function overlay(S, t) {
  place(S, OVL.db, W.dbC.clone().add(new THREE.Vector3(-0.55, 0.62, 0)), -120, 0, pulse(t, T.core + 0.4, T.review + 2.2));
  const c = new THREE.Vector3(PED.x, W.disc.topY, PED.z);
  logoEnd(S, t, { t0: T.logo, center: c, edge: c.clone().add(new THREE.Vector3(0, 0, LOGO_R)) });
}

makeFilm({
  T, caps: CAPS, subs: [], build, update, pose: camPose, overlay, overlayInit, focus: focusAt,
  stage: { bg: 0x07080a, reflSize: 8, env: 0.12, far: 30 },
  aperture: [[0, 0.004], [7.6, 0.003], [9.0, 0.002], [36.3, 0.004], [45.6, 0.003], [51.2, 0.004], [73.9, 0.003]],
  bloom: [[0, 0.45], [73, 0.55]],
});

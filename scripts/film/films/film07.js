// Human Factory Settings · Film 7 "Does mewing work?" · one continuous shot, 9:16.
// A head and neck, cut down the middle, on a black plinth. From the side it is a whole skull; the camera goes round the
// face to the cut: the tongue presses flat to the roof of the mouth. A placard reads A THEORY, by one orthodontist; the
// byline is deleted and a hashtag takes its place (the gag). No independent studies. Pressure on the teeth: they loosen,
// the bite shifts. The mouth at rest: lips closed, air through the nose, the tongue tip behind the front teeth, teeth
// slightly apart (three dials). Throat exercises against sleep apnoea; one held position is not that programme. Mouth
// breathing and longer faces: a link. Big tonsils and adenoids narrow a child's airway: see a doctor. Logo on a dial.
import { THREE, ORANGE, ss, s5, lerp, clamp01, hash, camTrack, phys, glowMat, shadows, spot, RoundedBoxGeometry,
  tissueMat, V3, place, logoEnd, makeFilm, outBack, stamp, labelCanvas, stampSpot, noiseTex, glowSprite } from '../kit.js';
import { makeLogoRing } from '../props.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { toCreasedNormals } from 'three/addons/utils/BufferGeometryUtils.js';

// ------------------------------------------------------------------ timing, from the voice guide (word starts)
const T = {
  end: 81.4,
  q0: 0.35, press: 1.59, tongue: 2.58, flat: 2.88, roof: 3.64, mouth: 4.34, wait: 5.30, sharper: 6.07, jaw: 6.59,        // "Mewing. Press your whole tongue flat against the roof of your mouth, and wait for a sharper jaw."
  started: 8.21, theory: 10.16, internet: 11.45, removed: 12.17, orthodontist: 12.79,                                   // "It started as one orthodontist's theory. The internet removed the orthodontist."
  proof: 14.48, reshapes: 15.26, face: 15.94, britain: 16.66, found: 18.26, no: 18.56, studies: 19.32,                // "Proof it reshapes a face? Britain's orthodontists found no independent studies."
  america: 20.92, agree: 22.70, warn: 23.54, pressure: 24.93, loosen: 25.76, teeth: 26.14, shift: 26.98, bite: 27.42,   // "America's orthodontists agree, and warn that long-term pressure can loosen teeth and shift your bite."
  normal: 28.61, rest: 29.90, lips: 30.19, closed: 30.99, breathing: 31.56, nose: 32.74, tip: 33.36, behind: 34.27,
  top: 35.36, bottom: 36.17, teeth2: 37.19,                                                                             // "A normal mouth at rest: lips closed, breathing through your nose, tongue tip resting behind your top or bottom front teeth."
  and: 38.48, slightly: 39.51, apart: 39.80, mewing2: 40.76, close: 42.09, them: 42.36,                                // "And your teeth slightly apart. Mewing tells you to close them."
  mouth3: 43.42, exercises: 44.60, real: 46.15, small: 48.32, set: 49.16, programme: 49.27, cut: 50.67, apnoea: 51.21, adults: 52.31,   // "Mouth and throat exercises do have a real use. In small trials, a set programme of them cut sleep apnoea events in adults."
  holding: 53.80, position: 55.00, not: 55.78, programme2: 56.17,                                                      // "Holding one tongue position is not that programme."
  children: 57.96, breathe: 59.39, longer: 61.70, faces: 62.29, link: 63.59, proof2: 64.63,                           // "Children who always breathe through their mouth do tend to have longer faces. A link, not proof."
  child: 66.52, snores: 66.94, pauses: 67.41, gasps: 68.35, often: 69.13, mouth5: 70.68, see: 71.17, doctor: 71.74,
  big: 72.94, tonsils: 73.52, adenoids: 74.42, cause: 75.65,                                                            // "If your child snores with pauses or gasps, or often breathes through the mouth, see a doctor. Big tonsils or adenoids are a common cause."
  final: 77.28, settings: 78.44, logo: 79.14,                                                                           // "Back to factory settings."
};

// ------------------------------------------------------------------ the set (metres; the head faces +z; +x is its left, where the cut face looks)
const W = {}; window.HFS_W = W;
const HEAD = new THREE.Vector3(0, 0.62, 0);                       // between the jaw joints, at the midline
const PL = { x0: -0.22, x1: 0.32, z0: -0.28, z1: 0.42, top: 0.36 };  // the plinth
const DS = 0.55;                                                   // the dials, at 55% of the size in films 4 to 6
const DIALS = [-0.14, 0.0, 0.14].map((z) => new THREE.Vector3(0.17, PL.top, z));
const LOGO_R = 0.072 * DS;
const CARD = new THREE.Vector3(0.035, PL.top, 0.3), CARD_RY = 0.75;
const hl = (x, y, z) => new THREE.Vector3(x, y, z);               // a point in the head's own frame
const toW = (v) => v.clone().add(HEAD);

// ------------------------------------------------------------------ materials
const MATS = {};
function mat(key) {
  if (MATS[key]) return MATS[key];
  const m = {
    bone: () => tissueMat('bone', { side: THREE.DoubleSide }),
    tooth: () => tissueMat('tooth'),
    gum: () => tissueMat('muscle', { color: new THREE.Color(0xd99089), roughness: 0.42, clearcoat: 0.4 }),
    tongue: () => tissueMat('muscle', { color: new THREE.Color(0xd7847c), roughness: 0.42, clearcoat: 0.4, sheenColor: new THREE.Color(0xffc2b8) }),
    muscle: () => tissueMat('muscle'),
    wall: () => tissueMat('muscle', { color: new THREE.Color(0x8e4840), roughness: 0.55, sheen: 0.4, sheenColor: new THREE.Color(0xd9a39a) }),
    cartilage: () => tissueMat('cartilage', { color: new THREE.Color(0xdcd8cc) }),
    disc: () => tissueMat('cartilage', { color: new THREE.Color(0xd9dccf) }),
    lip: () => tissueMat('muscle', { color: new THREE.Color(0xc76a62), roughness: 0.4, clearcoat: 0.45 }),
    tonsil: () => tissueMat('muscle', { color: new THREE.Color(0xd77f78), roughness: 0.5, clearcoat: 0.3, sheenColor: new THREE.Color(0xffc4b8) }),
  }[key]();
  return (MATS[key] = m);
}
function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h, c);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.userData.canvas = c; return t;
}
function txt(x, s, px, py, { font = '800 100px Archivo', color = '#fff', align = 'center', track = 0, base = 'middle' } = {}) {
  x.font = font; x.letterSpacing = `${track}px`; x.fillStyle = color; x.textAlign = align; x.textBaseline = base; x.fillText(s, px, py);
}

// ------------------------------------------------------------------ a soft part we bend on the CPU: morph targets, then a share of the jaw's turn
function softPart(mesh, { crease = Math.PI / 4.5 } = {}) {
  const work = mesh.geometry.index ? mesh.geometry : mesh.geometry;   // indexed (the GLB keeps indices)
  const base = Float32Array.from(work.attributes.position.array);
  const sp = { mesh, work, base, morphs: [], follow: null, crease, key: '' };
  const g0 = toCreasedNormals(work, crease); mesh.geometry = g0; sp.out = g0;
  return sp;
}
function addMorph(sp, fn) { const n = sp.base.length / 3, d = new Float32Array(n * 3), v = new THREE.Vector3(); for (let i = 0; i < n; i++) { v.fromArray(sp.base, i * 3); const r = fn(v, i); if (r) { d[i * 3] = r.x; d[i * 3 + 1] = r.y; d[i * 3 + 2] = r.z; } } sp.morphs.push(d); return sp.morphs.length - 1; }
const _q = new THREE.Quaternion(), _v = new THREE.Vector3(), X = new THREE.Vector3(1, 0, 0);
function poseSoft(sp, w, jaw) {
  const key = w.map((x) => x.toFixed(4)).join(',') + '|' + jaw.toFixed(5); if (key === sp.key) return; sp.key = key;
  const P = sp.work.attributes.position.array, B = sp.base, n = B.length / 3;
  for (let i = 0; i < n * 3; i++) P[i] = B[i];
  w.forEach((k, m) => { if (Math.abs(k) < 1e-5) return; const D = sp.morphs[m]; for (let i = 0; i < n * 3; i++) P[i] += D[i] * k; });
  if (sp.follow && Math.abs(jaw) > 1e-6) for (let i = 0; i < n; i++) { const f = sp.follow[i]; if (f <= 0) continue; _v.fromArray(P, i * 3); _q.setFromAxisAngle(X, jaw * f); _v.applyQuaternion(_q); _v.toArray(P, i * 3); }
  sp.work.attributes.position.needsUpdate = true;
  const g = toCreasedNormals(sp.work, sp.crease);
  sp.out.attributes.position.array.set(g.attributes.position.array); sp.out.attributes.normal.array.set(g.attributes.normal.array);
  sp.out.attributes.position.needsUpdate = true; sp.out.attributes.normal.needsUpdate = true; sp.out.computeBoundingSphere(); g.dispose();
}

// ------------------------------------------------------------------ the plinth and the stand
function makePlinth(scene) {
  const g = new THREE.Group();
  const black = phys({ color: 0x0d0e10, roughness: 0.32, clearcoat: 0.5, clearcoatRoughness: 0.25 });
  const box = new THREE.Mesh(new RoundedBoxGeometry(PL.x1 - PL.x0, PL.top, PL.z1 - PL.z0, 5, 0.012), black);
  box.position.set((PL.x0 + PL.x1) / 2, PL.top / 2, (PL.z0 + PL.z1) / 2); g.add(box);
  const steel = phys({ color: 0xb8bcc2, metalness: 1, roughness: 0.25, clearcoat: 0.3 });
  const rodTop = HEAD.y - 0.142, rod = new THREE.Mesh(new THREE.CylinderGeometry(0.0055, 0.0055, rodTop - PL.top, 32), steel);
  rod.position.set(-0.013, (rodTop + PL.top) / 2, -0.035); g.add(rod);
  const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.034, 0.008, 64), steel); foot.position.set(-0.013, PL.top + 0.004, -0.035); g.add(foot);
  shadows(g); g.traverse((o) => o.layers.enable(1)); scene.add(g);
  return g;
}

// ------------------------------------------------------------------ the placard: A THEORY, by one orthodontist. The byline goes; a hashtag arrives.
function makeCard(scene) {
  const g = new THREE.Group(), w = 0.13, h = 0.085;
  const tex = canvasTex(1300, 850, () => {}), c = tex.userData.canvas;
  const face = new THREE.Mesh(new THREE.PlaneGeometry(w, h), phys({ map: tex, roughness: 0.7 })); face.position.y = h / 2 + 0.004;
  const back = new THREE.Mesh(new THREE.BoxGeometry(w + 0.004, h + 0.004, 0.003), phys({ color: 0x1a1b1e, roughness: 0.5 })); back.position.set(0, h / 2 + 0.004, -0.0022);
  const pivot = new THREE.Group(); pivot.rotation.x = -0.16; pivot.add(face, back); g.add(pivot);
  const leg = new THREE.Mesh(new THREE.BoxGeometry(0.01, h * 0.9, 0.003), phys({ color: 0x1a1b1e })); leg.position.set(0, h * 0.42, -0.03); leg.rotation.x = 0.4; g.add(leg);
  g.position.copy(CARD); g.rotation.y = CARD_RY; shadows(g); g.traverse((o) => o.layers.enable(1)); scene.add(g);
  return { g, tex, c, key: '' };
}
function drawCard(C, del, tag) {   // del: 0..1 the byline is selected and deleted; tag: 0..1 the hashtag arrives
  const key = del.toFixed(3) + '|' + tag.toFixed(3); if (key === C.key) return; C.key = key;
  const x = C.c.getContext('2d'), w = C.c.width, h = C.c.height;
  x.fillStyle = '#f2efe8'; x.fillRect(0, 0, w, h);
  x.strokeStyle = '#1b1b1d'; x.lineWidth = 5; x.strokeRect(46, 46, w - 92, h - 92);
  txt(x, 'MOUTH POSTURE', w / 2, 150, { font: '500 44px "Geist Mono"', color: '#55524c', track: 10 });
  txt(x, 'A THEORY', w / 2, 330, { font: '800 190px Archivo', color: '#151517', track: 6 });
  // the byline, selected (a pale blue highlight sweeping right), then gone
  const by = 'by one orthodontist', y0 = 560;
  x.font = 'italic 400 88px "Instrument Serif", Georgia, serif'; const bw = x.measureText(by).width, bx = w / 2 - bw / 2;
  const sel = clamp01(del / 0.55), gone = ss(0.62, 0.8, del);
  if (gone < 1) {
    x.globalAlpha = 1 - gone;
    if (sel > 0) { x.fillStyle = '#9cc3ff'; x.fillRect(bx - 10, y0 - 62, (bw + 20) * sel, 116); }
    txt(x, by, w / 2, y0, { font: 'italic 400 88px "Instrument Serif", Georgia, serif', color: '#2a2928' });
    x.globalAlpha = 1;
  }
  if (gone > 0.99 && del < 1.01) { const blink = Math.floor(del * 40) % 2; if (blink && tag < 0.05) { x.fillStyle = '#151517'; x.fillRect(w / 2 - 3, y0 - 50, 6, 100); } }
  if (tag > 0.001) {   // a hashtag pill, as a social app draws it
    const k = outBack(tag, 2.2), pw = 520 * k, ph = 118 * k;
    x.save(); x.translate(w / 2, y0); x.fillStyle = '#151517';
    const r = ph / 2; x.beginPath(); x.moveTo(-pw / 2 + r, -ph / 2); x.arcTo(pw / 2, -ph / 2, pw / 2, ph / 2, r); x.arcTo(pw / 2, ph / 2, -pw / 2, ph / 2, r); x.arcTo(-pw / 2, ph / 2, -pw / 2, -ph / 2, r); x.arcTo(-pw / 2, -ph / 2, pw / 2, -ph / 2, r); x.fill();
    if (k > 0.6) txt(x, '#mewing', 0, 4, { font: `700 ${Math.round(72 * k)}px Archivo`, color: '#f2efe8' });
    x.restore();
    const tr = ss(0.45, 1, tag); if (tr > 0) { x.globalAlpha = tr; txt(x, 'TRENDING ↗', w / 2, 700, { font: '500 40px "Geist Mono"', color: '#55524c', track: 8 }); x.globalAlpha = 1; }
  }
  C.tex.needsUpdate = true;
}

// ------------------------------------------------------------------ dials (as in films 4 to 6, smaller, with words at the two ends of their scale)
function buildDials(scene, words) {
  const out = [];
  const alu = phys({ color: 0xcdcac4, metalness: 1, roughness: 0.3, clearcoat: 0.4, clearcoatRoughness: 0.3 }), dark = phys({ color: 0x141518, roughness: 0.4, clearcoat: 0.6 });
  words.forEach(([lo, hi], i) => {
    const g = new THREE.Group(), s = new THREE.Group(), knob = new THREE.Group(); g.add(s); s.scale.setScalar(DS); s.add(knob);
    const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.004, 96), dark); plate.position.y = 0.002; s.add(plate);
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.092, 0.097, 0.06, 128), alu); body.position.y = 0.034; knob.add(body);
    const face = new THREE.Mesh(new THREE.CylinderGeometry(0.086, 0.086, 0.002, 128), phys({ color: 0x9a9893, metalness: 1, roughness: 0.38, clearcoat: 0.5, clearcoatRoughness: 0.3 })); face.position.y = 0.065; knob.add(face);
    const ind = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.002, 0.05), glowMat(ORANGE)); ind.position.set(0, 0.0665, -0.05); knob.add(ind);
    const tickMat = new THREE.MeshBasicMaterial({ color: 0x8a8d93 });
    for (let k = 0; k <= 20; k++) { const a = -Math.PI * 0.75 + (k / 20) * Math.PI * 1.5, big = k % 5 === 0, len = big ? 0.022 : 0.012; const tk = new THREE.Mesh(new THREE.BoxGeometry(big ? 0.003 : 0.002, 0.001, len), tickMat); const r = 0.112 + len / 2; tk.position.set(Math.sin(a) * r, 0.0045, -Math.cos(a) * r); tk.rotation.y = -a; s.add(tk); }
    // the two words, printed on the plate beyond each end of the scale
    const tex = canvasTex(1024, 1024, (x, w) => { x.clearRect(0, 0, w, w);
      const put = (s2, a) => { const r = 0.143 / 0.16 * (w / 2) * 1.0, px = w / 2 + Math.sin(a) * r, py = w / 2 - Math.cos(a) * r; x.save(); x.translate(px, py); x.rotate(a + (Math.cos(a) < 0 ? Math.PI : 0)); txt(x, s2, 0, 0, { font: '600 46px "Geist Mono"', color: '#b9bcc3', track: 6 }); x.restore(); };
      put(lo, -Math.PI * 0.75 - 0.32); put(hi, Math.PI * 0.75 + 0.32); });
    const words3 = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.32), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
    words3.rotation.x = -Math.PI / 2; words3.position.y = 0.0042; s.add(words3);
    const setMat = glowMat(ORANGE); setMat.transparent = true; setMat.opacity = 0; const set = new THREE.Mesh(new THREE.BoxGeometry(0.005, 0.0015, 0.03), setMat); s.add(set);
    g.rotation.y = Math.PI / 2;   // twelve o'clock points away from the cut face's camera (and up in the last, top-down shot)
    g.position.copy(DIALS[i]); shadows(g); g.traverse((o) => o.layers.enable(1)); scene.add(g);
    out.push({ g, s, knob, set, setMat, words: words3.material, angle: (v) => -Math.PI * 0.75 + v * Math.PI * 1.5 });
  });
  return out;
}

// ------------------------------------------------------------------ points of air: through the nose (or the mouth), down to the windpipe
const PATH_NOSE = [[-0.008, -0.027, 0.113], [-0.009, -0.026, 0.092], [-0.01, -0.029, 0.066], [-0.01, -0.03, 0.036], [-0.008, -0.025, 0.009], [-0.006, -0.02, -0.004],
  [-0.005, -0.04, -0.007], [-0.005, -0.062, -0.003], [-0.004, -0.082, 0.006], [-0.004, -0.103, 0.004], [-0.005, -0.13, 0.0], [-0.005, -0.2, -0.004]];
const PATH_MOUTH = [[-0.008, -0.054, 0.104], [-0.008, -0.05, 0.084], [-0.008, -0.043, 0.055], [-0.007, -0.045, 0.024], [-0.005, -0.052, 0.002], [-0.005, -0.062, -0.003],
  [-0.004, -0.082, 0.006], [-0.004, -0.103, 0.004], [-0.005, -0.13, 0.0], [-0.005, -0.2, -0.004]];
const NAIR = 160;
const R_NOSE = [0.0028, 0.003, 0.003, 0.0032, 0.004, 0.0052, 0.0058, 0.0052, 0.0042, 0.0026, 0.0058, 0.0062];
const R_MOUTH = [0.004, 0.0045, 0.0042, 0.0045, 0.005, 0.0052, 0.0042, 0.0026, 0.0058, 0.0062];
function makeTube(curve, radii, nA = 150, nR = 22) {
  const pos = new Float32Array(nA * nR * 3), idx = [];
  for (let i = 0; i < nA - 1; i++) for (let j = 0; j < nR; j++) { const a = i * nR + j, b = i * nR + ((j + 1) % nR), c = (i + 1) * nR + ((j + 1) % nR), d = (i + 1) * nR + j; idx.push(a, b, c, a, c, d); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(idx);
  const fr = curve.computeFrenetFrames(nA - 1, false), P = [], K = [];
  for (let i = 0; i < nA; i++) { const u = i / (nA - 1); P.push(curve.getPointAt(u)); K.push(curve.getUtoTmapping(u) * (radii.length - 1)); }
  const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: new THREE.Color(0x8fc6ff), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false }));
  m.renderOrder = 8; m.frustumCulled = false; m.visible = false;
  return { m, P, K, N: fr.normals, B: fr.binormals, nA, nR, radii };
}
function poseTube(tb, rf) {   // rf(k) = a factor on the width at control point k (fractional)
  const A = tb.m.geometry.attributes.position.array;
  for (let i = 0; i < tb.nA; i++) { const k = tb.K[i], k0 = Math.floor(k), k1 = Math.min(tb.radii.length - 1, k0 + 1), r = lerp(tb.radii[k0], tb.radii[k1], k - k0) * rf(k), p = tb.P[i], n = tb.N[i], b = tb.B[i];
    for (let j = 0; j < tb.nR; j++) { const a = (j / tb.nR) * Math.PI * 2, c = Math.cos(a) * r, s2 = Math.sin(a) * r, o = (i * tb.nR + j) * 3; A[o] = p.x + c * n.x + s2 * b.x; A[o + 1] = p.y + c * n.y + s2 * b.y; A[o + 2] = p.z + c * n.z + s2 * b.z; } }
  tb.m.geometry.attributes.position.needsUpdate = true;
}
function makeAir(scene) {
  const m = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 10, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xbfe0ff).multiplyScalar(1.5), transparent: true, opacity: 0.85, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, fog: false }), NAIR);
  m.frustumCulled = false; m.renderOrder = 9; m.visible = false; W.head.add(m);
  const mk = (P) => new THREE.CatmullRomCurve3(P.map((p) => new THREE.Vector3(...p)), false, 'centripetal');
  const nose = mk(PATH_NOSE), mouth = mk(PATH_MOUTH), tn = makeTube(nose, R_NOSE), tm = makeTube(mouth, R_MOUTH);
  W.head.add(tn.m, tm.m);
  return { m, nose, mouth, tn, tm };
}

// ------------------------------------------------------------------ build
async function build(S, cfg) {
  const scene = S.scene;
  S.fog.near = 3; S.fog.far = 12;
  S.table.scale.set(3, 3, 1); S.tableMat.clearcoat = 0.06; S.tableMat.specularIntensity = 0.3;
  for (const m of [S.tableMat.map, S.tableMat.roughnessMap]) if (m) { m.wrapS = m.wrapT = THREE.RepeatWrapping; m.repeat.multiplyScalar(3); }
  // ---- the specimen
  const gltf = await new GLTFLoader().loadAsync('models/head7.glb');
  W.head = new THREE.Group(); W.head.position.copy(HEAD); scene.add(W.head);
  W.jaw = new THREE.Group(); W.head.add(W.jaw);
  W.parts = {}; W.byName = {};
  const meshes = []; gltf.scene.traverse((o) => { if (o.isMesh) meshes.push(o); });
  for (const o of meshes) {
    const [g, m, nm] = o.name.replace(/_/g, ' ').split('|');
    if (!o.geometry.attributes.normal) o.geometry.computeVertexNormals();
    o.material = mat(m); o.castShadow = o.receiveShadow = true; o.layers.enable(1); o.userData = { g, m, nm };
    (W.parts[g] ||= []).push(o); W.byName[nm] = o;
    o.removeFromParent();
    if (g === 'jaw' || (g === 'floor' && !/stylohyoid|digastric/i.test(nm))) W.jaw.add(o); else W.head.add(o);
    if (/right half/.test(nm) && g !== 'tongue' && g !== 'lip') o.geometry = toCreasedNormals(o.geometry, Math.PI / 4.5);
  }
  // ---- the tongue: rest (as the source has it), pressed flat to the palate, tip up, tip down, pulled back (apnoea), two exercise moves
  const tongue = W.byName['Tongue (right half)'], lip = W.byName['Lip (right half)'];
  W.tongue = softPart(tongue, { crease: Math.PI / 3.5 });
  // the palate's underside, measured by rays from below
  const palate = ['Right maxilla', 'Right palatine bone', 'Gingiva of upper jaw (right half)', 'Right upper central secondary incisor tooth', 'Right upper lateral secondary incisor tooth'].map((n) => W.byName[n]).filter(Boolean);
  const softP = ['Uvular muscle (right half)', 'Right tensor veli palatini', 'Right levator veli palatini'].map((n) => W.byName[n]).filter(Boolean);
  const rc = new THREE.Raycaster(), PX = [-0.02, 0.0], PZ = [0.0, 0.095], NX = 11, NZ = 40, pal = new Float32Array(NX * NZ).fill(NaN);
  W.head.updateMatrixWorld(true);
  for (let i = 0; i < NX; i++) for (let j = 0; j < NZ; j++) {
    const x = lerp(PX[0], PX[1], i / (NX - 1)) - 0.0008, z = lerp(PZ[0], PZ[1], j / (NZ - 1));
    rc.set(toW(hl(x, -0.07, z)), new THREE.Vector3(0, 1, 0)); rc.far = 0.1;
    const hits = rc.intersectObjects([...palate, ...softP], false); if (hits.length) pal[i * NZ + j] = hits[0].point.y - HEAD.y;
  }
  const palAt = (x, z) => { const fi = clamp01((x - PX[0]) / (PX[1] - PX[0])) * (NX - 1), fj = clamp01((z - PZ[0]) / (PZ[1] - PZ[0])) * (NZ - 1); const i = Math.round(fi), j = Math.round(fj); let v = pal[i * NZ + j];
    if (Number.isNaN(v)) { for (let r = 1; r < 6 && Number.isNaN(v); r++) for (let di = -r; di <= r; di++) for (let dj = -r; dj <= r; dj++) { const ii = i + di, jj = j + dj; if (ii >= 0 && ii < NX && jj >= 0 && jj < NZ && !Number.isNaN(pal[ii * NZ + jj])) { v = pal[ii * NZ + jj]; } } }
    return v; };
  W.palAt = palAt;
  // the tongue's own top and bottom over a grid, so each vertex knows where in its column it sits
  const TB = new THREE.Box3().setFromBufferAttribute(new THREE.BufferAttribute(W.tongue.base, 3)); W.tongueBox = TB;
  const colKey = (x, z) => `${Math.round(x / 0.003)},${Math.round(z / 0.003)}`, top = new Map(), bot = new Map();
  for (let i = 0; i < W.tongue.base.length; i += 3) { const x = W.tongue.base[i], y = W.tongue.base[i + 1], z = W.tongue.base[i + 2], k = colKey(x, z); top.set(k, Math.max(top.get(k) ?? -1, y)); bot.set(k, Math.min(bot.get(k) ?? 1, y)); }
  const colTop = (x, z) => top.get(colKey(x, z)), colBot = (x, z) => bot.get(colKey(x, z));
  const zTip = TB.max.z, zBack = TB.min.z;
  W.M = {};
  W.M.press = addMorph(W.tongue, (v) => { const p = palAt(v.x, v.z), tp = colTop(v.x, v.z), bt = colBot(v.x, v.z); if (p === undefined || Number.isNaN(p) || tp === undefined) return null;
    const lift = Math.max(0, p - 0.0012 - tp) * ss(zBack + 0.004, zBack + 0.02, v.z), f = clamp01((v.y - bt) / Math.max(0.002, tp - bt)); return new THREE.Vector3(0, lift * lerp(0.25, 1, f * f), lift * 0.06 * f); });
  W.M.tipUp = addMorph(W.tongue, (v) => { const wF = ss(zTip - 0.034, zTip - 0.006, v.z), p = palAt(v.x, Math.min(v.z, 0.08)), tp = colTop(v.x, v.z), bt = colBot(v.x, v.z); if (!wF || p === undefined || Number.isNaN(p) || tp === undefined) return null;
    const f = clamp01((v.y - bt) / Math.max(0.002, tp - bt)); return new THREE.Vector3(0, Math.max(0, p - 0.001 - tp) * wF * lerp(0.6, 1, f), -0.003 * wF * f); });
  W.M.tipDown = addMorph(W.tongue, (v) => { const wF = ss(zTip - 0.024, zTip - 0.002, v.z); return wF ? new THREE.Vector3(0, -0.0055 * wF, -0.002 * wF) : null; });
  W.M.back = addMorph(W.tongue, (v) => { const wB = 1 - ss(zBack + 0.014, zBack + 0.04, v.z); return wB ? new THREE.Vector3(0, -0.002 * wB, -0.0105 * wB) : null; });
  W.M.forward = addMorph(W.tongue, (v) => { const wF = ss(zBack + 0.01, zTip, v.z); return new THREE.Vector3(0, 0.001 * wF, 0.007 * wF); });
  W.tongue.follow = Float32Array.from({ length: W.tongue.base.length / 3 }, (_, i) => lerp(0.35, 0.9, ss(zBack, zTip, W.tongue.base[i * 3 + 2])) * (1 - 0.4 * ss(-0.05, -0.042, W.tongue.base[i * 3 + 1])));
  // the lips: the lower lip goes with the jaw
  W.lip = softPart(lip, { crease: Math.PI });
  const ULY = -0.0525;   // where the lips meet
  W.lip.follow = Float32Array.from({ length: W.lip.base.length / 3 }, (_, i) => 1 - ss(ULY - 0.003, ULY + 0.002, W.lip.base[i * 3 + 1]));
  W.M.lipPart = addMorph(W.lip, (v) => { const lower = 1 - ss(ULY - 0.002, ULY + 0.002, v.y); return new THREE.Vector3(0, (lower ? -0.0035 : 0.0012) * (lower || 1), 0.0006); });
  // ---- the upper front teeth can wobble about their roots
  W.wobble = [];
  for (const nm of ['Right upper central secondary incisor tooth', 'Right upper lateral secondary incisor tooth']) {
    const t = W.byName[nm]; t.geometry.computeBoundingBox(); const bb = t.geometry.boundingBox, root = new THREE.Vector3((bb.min.x + bb.max.x) / 2, bb.max.y - 0.002, (bb.min.z + bb.max.z) / 2);
    const piv = new THREE.Group(); piv.position.copy(root); W.head.add(piv); t.removeFromParent(); t.position.sub(root); piv.add(t); W.wobble.push(piv);
  }
  // ---- the soft palate can sag back (apnoea)
  W.soft = new THREE.Group(); W.soft.position.set(-0.002, -0.012, 0.02); W.head.add(W.soft);
  for (const o of W.parts.soft) { o.removeFromParent(); o.position.sub(W.soft.position); W.soft.add(o); }
  // ---- tonsils and adenoids (the source has neither): soft lumps, drawn, at their usual places
  W.lumps = [];
  for (const [c, r, nm] of [[[-0.006, -0.046, 0.012], [0.004, 0.0075, 0.0045], 'tonsil'], [[-0.003, -0.021, -0.008], [0.0055, 0.005, 0.0055], 'adenoid']]) {
    const geo = new THREE.SphereGeometry(1, 48, 32), P = geo.attributes.position;
    for (let i = 0; i < P.count; i++) { const x = P.getX(i), y = P.getY(i), z = P.getZ(i), n = 1 + 0.06 * Math.sin(x * 9 + y * 13) * Math.sin(z * 11 - y * 7) + 0.03 * Math.sin(x * 23 + z * 19); P.setXYZ(i, Math.min(x * n, 0.02), y * n, z * n); }
    geo.computeVertexNormals(); const m = new THREE.Mesh(geo, mat('tonsil')); m.position.set(...c); m.userData.r = r; m.scale.set(...r); m.castShadow = true; m.layers.enable(1); W.head.add(m); W.lumps.push(m);
  }
  W.glowTop = glowSprite(new THREE.Color(0xffffff), 0.012); W.glowTop.position.set(0.002, -0.0385, 0.0735); W.glowBot = glowSprite(new THREE.Color(0xffffff), 0.012); W.glowBot.position.set(0.002, -0.066, 0.07);
  for (const g of [W.glowTop, W.glowBot]) { g.material.opacity = 0; g.renderOrder = 10; g.material.depthTest = false; W.head.add(g); }
  // ---- the factory stamp: on the cut face of the chin
  { const md = W.byName['Mandible (right half)']; md.material = mat('bone').clone();
    W.stampSpot = stampSpot(md, { from: [0.05, -0.074, 0.074], dir: [-1, 0, 0], spread: 0.002 });
    if (W.stampSpot) W.stamp = stamp(md, { canvas: labelCanvas('HUMAN FACTORY SETTINGS'), center: W.stampSpot.center, normal: [1, 0, 0], up: [0, 0, 1], width: 0.026, depth: 0.01, opacity: 0.62 }); }
  // ---- the set
  makePlinth(scene);
  W.card = makeCard(scene);
  W.dials = buildDials(scene, [['OPEN', 'CLOSED'], ['MOUTH', 'NOSE'], ['SHUT', 'APART']]);
  W.logoRing = makeLogoRing(LOGO_R); W.logoRing.g.rotation.x = -Math.PI / 2; W.logoRing.g.position.y = (0.0665 + 0.0012) * DS; W.dials[1].g.add(W.logoRing.g);
  W.air = makeAir(scene);
  // ---- the sharper jaw that never arrives: a dashed outline just outside the real one
  { const md = W.byName['Mandible (right half)'], P = md.geometry.attributes.position, pts = [];
    for (let i = 0; i < P.count; i++) pts.push(new THREE.Vector2(P.getZ(i), P.getY(i)));
    const hull = convex(pts), lowBack = hull.filter((p) => p.y < -0.004 && !(p.x > 0.06 && p.y > -0.06));
    const ord = lowBack.sort((a, b) => Math.atan2(a.y + 0.03, a.x - 0.03) - Math.atan2(b.y + 0.03, b.x - 0.03));
    const sharp = ord.map((p) => { const ang = ss(0.0, 0.03, -p.y - 0.05) * (1 - ss(0.02, 0.05, p.x)); return new THREE.Vector3(0.003, p.y - 0.006 * ang, p.x - 0.006 * ang); });
    const geo = new THREE.BufferGeometry().setFromPoints(new THREE.CatmullRomCurve3(sharp).getPoints(160));
    W.jawLine = new THREE.Line(geo, new THREE.LineDashedMaterial({ color: 0xeceef1, dashSize: 0.004, gapSize: 0.003, transparent: true, opacity: 0, depthTest: false, fog: false }));
    W.jawLine.computeLineDistances(); W.jawLine.renderOrder = 9; W.head.add(W.jawLine); }
  // ---- the face's height, chin to the top of the nose, and a longer one
  { const mk = (c) => new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: c, transparent: true, opacity: 0, depthTest: false, fog: false }));
    W.faceA = mk(0xeceef1); W.faceB = mk(0xeceef1); for (const l of [W.faceA, W.faceB]) { l.renderOrder = 9; W.head.add(l); } }
  // ---- light
  W.key = spot(scene, { color: 0xffe9d2, pos: new THREE.Vector3(1.3, 1.9, 1.3), target: HEAD.clone().add(new THREE.Vector3(0, -0.06, 0.03)), angle: 0.32, penumbra: 0.8, shadow: true, size: cfg.shadow ?? 1024 });
  W.key.shadow.camera.far = 6;
  W.rim = spot(scene, { color: 0xa9c4ff, pos: new THREE.Vector3(-1.3, 1.5, -1.5), target: HEAD.clone(), angle: 0.45, penumbra: 0.9 });
  W.fill = spot(scene, { color: 0xc8d6ff, pos: new THREE.Vector3(1.6, 0.55, -0.3), target: HEAD.clone(), angle: 0.5, penumbra: 1 });
  W.side = spot(scene, { color: 0xfff0e2, pos: new THREE.Vector3(-1.5, 1.2, 0.9), target: HEAD.clone(), angle: 0.4, penumbra: 0.9 });
  W.dialLight = spot(scene, { color: 0xffe9d2, pos: new THREE.Vector3(1.0, 1.3, 0.5), target: new THREE.Vector3(0.17, PL.top, 0), angle: 0.36, penumbra: 0.8 });
  W.cardLight = spot(scene, { color: 0xfff1d8, pos: new THREE.Vector3(0.8, 1.0, 1.0), target: CARD.clone().add(new THREE.Vector3(0, 0.04, 0)), angle: 0.2, penumbra: 0.6 });
  return { stamp: W.stampSpot, parts: Object.fromEntries(Object.entries(W.parts).map(([k, v]) => [k, v.length])), tongueBox: [TB.min.toArray(), TB.max.toArray()], palNaN: [...pal].filter((v) => Number.isNaN(v)).length };
}
function convex(P) { P = P.slice().sort((a, b) => a.x - b.x || a.y - b.y); const cr = (o, a, b) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x); const lo = [], up = [];
  for (const p of P) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
  for (let i = P.length - 1; i >= 0; i--) { const p = P[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
  up.pop(); lo.pop(); return lo.concat(up); }

// ------------------------------------------------------------------ the mouth over time
const pulse = (t, a, b) => ss(a, a + 0.35, t) * (1 - ss(b - 0.35, b, t));
function mouthAt(t) {
  const o = { press: 0, tipUp: 0, tipDown: 0, back: 0, forward: 0, jaw: 0, lip: 0, mouthAir: 0, noseAir: 0, lumps: 0, freeze: 0 };
  // mewing: pressed flat from "press" until the mouth at rest
  o.press = s5(T.tongue - 0.2, T.mouth, t) * (1 - s5(T.normal, T.rest + 0.3, t)) + s5(T.holding - 0.1, T.position, t) * (1 - s5(T.programme2 + 0.6, T.children - 0.2, t));
  // the long-term pressure: the tongue pushes forward against the teeth
  o.forward = 0.55 * (ss(T.pressure - 0.4, T.pressure + 0.2, t) * (1 - ss(T.bite + 0.3, T.normal + 0.4, t))) * (0.75 + 0.25 * Math.sin(t * 9));
  // at rest: the tip up behind the top teeth, then behind the bottom ones
  o.tipUp = s5(T.tip - 0.1, T.behind + 0.2, t) * (1 - s5(T.bottom - 0.2, T.bottom + 0.4, t)) + s5(T.final - 0.2, T.settings, t);
  o.tipDown = s5(T.bottom - 0.2, T.bottom + 0.4, t) * (1 - s5(T.and, T.slightly, t));
  // teeth slightly apart from "apart"; closed at "close them", then apart again
  const apart = s5(T.slightly - 0.3, T.apart + 0.2, t);
  const shut = ss(T.close - 0.12, T.close + 0.05, t) * (1 - ss(T.them + 0.5, T.them + 1.0, t));
  o.jaw = 0.022 * apart * (1 - shut);
  // a bite that shifts: the jaw slides forward a little and turns
  o.bite = s5(T.shift - 0.1, T.bite + 0.2, t) * (1 - s5(T.normal - 0.4, T.normal + 0.3, t));
  // apnoea: the tongue's root and the soft palate fall back; before the programme often, after it seldom
  const ev = apnoeaAt(t); o.back = ev; o.soft = ev;
  // the programme: three moves
  const P0 = T.set - 0.2, ex = (k) => pulse(t, P0 + k * 0.62, P0 + k * 0.62 + 0.58);
  o.forward += 0.7 * ex(0); o.press += 0.9 * ex(1) * (1 - o.press); o.back += 0.8 * ex(2);
  // mouth breathing: lips apart, jaw down
  const mb = s5(T.breathe - 0.5, T.breathe + 0.4, t) * (1 - s5(T.proof2 + 0.2, T.child - 0.3, t)) + s5(T.often, T.mouth5 + 0.3, t) * (1 - s5(T.cause, T.cause + 0.8, t));
  o.jaw += 0.085 * mb; o.lip = mb; o.mouthAir = mb;
  // air through the nose: at rest, and at the end
  o.noseAir = s5(T.breathing - 0.3, T.breathing + 0.4, t) * (1 - ss(T.mouth3 - 0.3, T.mouth3 + 0.3, t)) + ss(T.mouth3, T.mouth3 + 0.5, t) * (1 - mb) * (1 - ss(T.final + 0.6, T.logo - 0.4, t));
  // tonsils and adenoids: big for the child's lines, back to normal at the end
  o.lumps = s5(T.child - 0.3, T.snores + 0.5, t) * (1 - s5(T.final - 0.4, T.final + 0.8, t));
  return o;
}
const EVENTS0 = [44.0, 45.15, 46.35, 47.4, 48.55], EVENTS1 = [51.2, 52.6];
function apnoeaAt(t) { let v = 0; for (const e of [...EVENTS0, ...EVENTS1]) v = Math.max(v, ss(e - 0.25, e + 0.05, t) * (1 - ss(e + 0.55, e + 0.85, t))); return v; }

// ------------------------------------------------------------------ the camera: one path, no cuts
let CAM = null;
const MOUTH = [-0.006, HEAD.y - 0.052, 0.058], TIPV = [-0.004, HEAD.y - 0.054, 0.077], THROAT = [-0.005, HEAD.y - 0.06, 0.004];
function buildCam() {
  const D = DIALS[1];
  return camTrack([
    { t: -3.0, p: V3(-0.8, 0.68, 0.2), l: V3(0, 0.6, 0.0), fov: 28 },
    { t: 0.0, p: V3(-0.77, 0.675, 0.24), l: V3(0, 0.6, 0.01), fov: 28 },                                    // a skull, from its right side
    { t: 1.4, p: V3(-0.7, 0.665, 0.36), l: V3(0, 0.6, 0.02), fov: 28 },
    { t: 2.6, p: V3(-0.1, 0.63, 0.68), l: V3(0, 0.59, 0.04), fov: 26 },                                     // round the face
    { t: 3.9, p: V3(0.6, 0.57, 0.12), l: V3(0, 0.565, 0.045), fov: 22 },                                    // to the cut: the tongue on the roof of the mouth
    { t: 5.2, p: V3(0.6, 0.567, 0.12), l: V3(0, 0.565, 0.045), fov: 22, tens: 0.4 },
    { t: 6.6, p: V3(0.76, 0.57, 0.15), l: V3(0, 0.55, 0.035), fov: 24 },                                    // back a little: the jaw
    { t: 8.3, p: V3(0.44, 0.47, 0.75), l: V3(0.035, 0.405, 0.29), fov: 26 },                                // down to the placard
    { t: 11.0, p: V3(0.43, 0.468, 0.735), l: V3(0.035, 0.405, 0.29), fov: 26, tens: 0.4 },
    { t: 12.3, p: V3(0.385, 0.458, 0.655), l: V3(0.035, 0.405, 0.29), fov: 26 },                            // closer: the byline goes
    { t: 14.3, p: V3(0.378, 0.457, 0.648), l: V3(0.035, 0.405, 0.29), fov: 26, tens: 0.3 },                  // hold: #mewing, trending
    { t: 15.6, p: V3(0.95, 0.6, 0.18), l: V3(0, 0.595, 0.02), fov: 26 },                                    // the whole head: a face reshaped?
    { t: 19.8, p: V3(0.96, 0.6, 0.2), l: V3(0, 0.595, 0.02), fov: 26, tens: 0.3 },
    { t: 21.4, p: V3(0.44, 0.566, 0.15), l: V3(-0.004, 0.566, 0.076), fov: 20 },                            // the front teeth
    { t: 27.8, p: V3(0.445, 0.566, 0.16), l: V3(-0.004, 0.566, 0.076), fov: 20, tens: 0.25 },
    { t: 29.6, p: V3(0.95, 0.62, 0.3), l: V3(0.06, 0.49, 0.0), fov: 28 },                                   // back: the mouth at rest, and three dials
    { t: 32.9, p: V3(0.96, 0.625, 0.31), l: V3(0.06, 0.49, 0.0), fov: 28, tens: 0.3 },
    { t: 34.0, p: V3(0.44, 0.565, 0.14), l: V3(-0.004, 0.562, 0.072), fov: 20 },                            // the tongue tip
    { t: 39.6, p: V3(0.44, 0.564, 0.145), l: V3(-0.004, 0.562, 0.072), fov: 20, tens: 0.25 },
    { t: 40.7, p: V3(0.95, 0.62, 0.3), l: V3(0.06, 0.49, 0.0), fov: 28 },                                   // the third dial
    { t: 42.9, p: V3(0.96, 0.625, 0.31), l: V3(0.06, 0.49, 0.0), fov: 28, tens: 0.3 },
    { t: 44.4, p: V3(0.56, 0.552, 0.05), l: V3(-0.005, 0.552, 0.012), fov: 22 },                            // the throat, at night
    { t: 52.9, p: V3(0.565, 0.552, 0.055), l: V3(-0.005, 0.552, 0.012), fov: 22, tens: 0.25 },
    { t: 54.2, p: V3(0.6, 0.567, 0.12), l: V3(0, 0.565, 0.045), fov: 22 },                                  // one held position
    { t: 57.1, p: V3(0.6, 0.567, 0.125), l: V3(0, 0.565, 0.045), fov: 22, tens: 0.3 },
    { t: 58.6, p: V3(0.8, 0.58, 0.22), l: V3(0, 0.575, 0.06), fov: 24 },                                    // the face: breathing through the mouth
    { t: 65.0, p: V3(0.805, 0.58, 0.225), l: V3(0, 0.575, 0.06), fov: 24, tens: 0.3 },
    { t: 66.6, p: V3(0.56, 0.555, 0.05), l: V3(-0.005, 0.555, 0.01), fov: 22 },                             // a child's airway: tonsils, adenoids
    { t: 76.4, p: V3(0.565, 0.555, 0.055), l: V3(-0.005, 0.555, 0.01), fov: 22, tens: 0.25 },
    { t: 77.8, p: V3(0.62, 0.8, 0.1), l: V3(D.x, PL.top + 0.02, D.z), fov: 28 },
    { t: T.logo, p: V3(D.x + 0.005, PL.top + 0.56, D.z), l: V3(D.x, PL.top + 0.0665 * DS, D.z), fov: 30, stop: true },   // straight down on the middle dial: the logo
  ]);
}
function camPose(S, t) {
  const v = S.cfg.view; if (v && typeof v === 'object') return v;
  if (!CAM) CAM = buildCam();
  if (t <= T.logo) return CAM(t);
  const P = CAM(T.logo), k = ss(T.logo, T.end, t);
  return { p: [P.p[0], lerp(P.p[1], P.p[1] - 0.05, k), P.p[2]], l: P.l, fov: 30 };
}
function focusAt(S, t, P) { return Math.hypot(P.p[0] - P.l[0], P.p[1] - P.l[1], P.p[2] - P.l[2]); }

// ------------------------------------------------------------------ one moment of the film
const _m4 = new THREE.Matrix4(), _s = new THREE.Vector3(), _qi = new THREE.Quaternion();
function update(S, t) {
  const scene = S.scene, o = mouthAt(t), endDark = ss(T.final + 0.3, T.logo - 0.3, t);
  // ---- the jaw (and what rides it)
  W.jaw.rotation.x = o.jaw; W.jaw.position.set(0, 0, 0.0018 * o.bite); W.jaw.rotation.y = 0.012 * o.bite;
  poseSoft(W.tongue, [o.press, o.tipUp, o.tipDown, o.back, o.forward], o.jaw);
  poseSoft(W.lip, [o.lip], o.jaw);
  // ---- loose teeth
  const wob = ss(T.loosen - 0.2, T.loosen + 0.2, t) * (1 - ss(T.normal - 0.6, T.normal, t));
  W.wobble.forEach((p, i) => { p.rotation.x = wob * 0.035 * Math.sin(t * 23 + i * 1.7) * (0.6 + 0.4 * Math.sin(t * 3.1 + i)); p.rotation.z = wob * 0.012 * Math.sin(t * 17 + i); });
  // ---- the soft palate sags back in each apnoea event
  W.soft.rotation.x = -0.18 * o.soft; W.soft.position.z = 0.02 - 0.003 * o.soft;
  // ---- tonsils and adenoids
  W.lumps.forEach((m, i) => { const k = 1 + (i === 0 ? 0.9 : 1.1) * o.lumps; m.scale.set(m.userData.r[0] * k, m.userData.r[1] * k, m.userData.r[2] * k); m.visible = true; });
  // ---- the air
  { const A = W.air, nose = o.noseAir * (1 - apnoeaAt(t) * 0.9), mouth = o.mouthAir; A.m.visible = nose > 0.01 || mouth > 0.01;
    if (A.m.visible) { const blocked = o.lumps * (T.pauses < t && t < T.gasps + 0.6 ? 0.85 : 0.35);
      for (let i = 0; i < NAIR; i++) { const viaMouth = i < NAIR * 0.5 ? 0 : 1, a = viaMouth ? mouth : nose, ph = hash(i * 1.37), sp = 0.16 + 0.05 * hash(i * 2.1);
        let u = (t * sp * (1 - blocked * 0.8) + ph) % 1; const c = viaMouth ? A.mouth : A.nose, p = c.getPointAt(u);
        p.x += (hash(i * 3.3) - 0.5) * 0.004; p.y += (hash(i * 5.1) - 0.5) * 0.003; p.z += (hash(i * 7.7) - 0.5) * 0.003;
        const fade = ss(0, 0.06, u) * (1 - ss(0.85, 1, u)) * a; _s.setScalar(Math.max(1e-5, 0.0011 * fade)); _m4.compose(p, _qi, _s); A.m.setMatrixAt(i, _m4); }
      A.m.instanceMatrix.needsUpdate = true; } }
  // ---- the airway, shown when it matters: its width narrows in apnoea, and with big tonsils and adenoids
  { const A = W.air, ev = apnoeaAt(t), L = o.lumps, vis = Math.max(o.noseAir, o.mouthAir) * (ss(T.breathing - 0.4, T.breathing + 0.3, t)), nose = 1 - o.mouthAir;
    A.tn.m.visible = vis * nose > 0.01; A.tm.m.visible = vis * o.mouthAir > 0.01;
    const quiet = 1 - 0.65 * pulse(t, T.top - 0.6, T.them + 0.8); A.tn.m.material.opacity = 0.2 * vis * nose * quiet; A.tm.m.material.opacity = 0.2 * vis * o.mouthAir;
    const rf = (k) => (1 - 0.93 * ev * Math.exp(-((k - 6.4) ** 2) / 0.8)) * (1 - 0.55 * L * Math.exp(-((k - 5.2) ** 2) / 0.5) - 0.5 * L * Math.exp(-((k - 6.6) ** 2) / 0.6));
    if (A.tn.m.visible) poseTube(A.tn, rf); if (A.tm.m.visible) poseTube(A.tm, (k) => (1 - 0.5 * L * Math.exp(-((k - 4.6) ** 2) / 0.6))); }
  W.glowTop.material.opacity = 0.9 * pulse(t, T.top - 0.1, T.bottom - 0.05) + 0.6 * pulse(t, T.final + 0.3, T.logo - 0.3);
  W.glowBot.material.opacity = 0.9 * pulse(t, T.bottom + 0.2, T.teeth2 + 0.9);
  // ---- the sharper jaw that never arrives
  W.jawLine.material.opacity = 0.8 * (pulse(t, T.sharper - 0.1, T.started) + pulse(t, T.reshapes - 0.1, T.studies + 0.4));
  W.jawLine.material.dashSize = 0.004; W.jawLine.visible = W.jawLine.material.opacity > 0.01;
  // ---- the face's height, and a longer one (linked, in children)
  { const fa = pulse(t, T.longer - 0.4, T.proof2 + 0.9), fb = fa * ss(T.faces - 0.2, T.faces + 0.5, t);
    const chin = hl(0.004, -0.0915, 0.132), top = hl(0.004, 0.03, 0.132), down = 0.007 * fb;
    W.faceA.geometry.setFromPoints([top, chin, chin.clone().add(new THREE.Vector3(0, 0, -0.006)), chin, top, top.clone().add(new THREE.Vector3(0, 0, -0.006))]);
    W.faceB.geometry.setFromPoints([chin.clone().add(new THREE.Vector3(0, -down, 0.009)), chin.clone().add(new THREE.Vector3(0, -down, 0.003))]);
    W.faceA.material.opacity = 0.85 * fa; W.faceB.material.opacity = 0.85 * fb; W.faceA.visible = fa > 0.01; W.faceB.visible = fb > 0.01; }
  // ---- the placard
  drawCard(W.card, clamp01((t - (T.removed - 0.1)) / 0.95), ss(T.orthodontist + 0.25, T.orthodontist + 0.75, t));
  // ---- the dials rise at "a normal mouth at rest", and are set: lips closed, nose, teeth apart
  W.dials.forEach((d, i) => {
    const t0 = T.normal - 0.2 + i * 0.15, up = s5(t0, t0 + 0.8, t); d.g.position.y = PL.top + lerp(-0.045, 0, up); d.g.visible = up > 0.001;
    const ts = [T.closed - 0.3, T.nose - 0.3, T.apart + 0.3][i], k = s5(ts, ts + 0.6, t);
    let v = lerp(0, 1, k); if (i === 2) { const push = ss(T.close - 0.14, T.close + 0.04, t), back = clamp01((t - (T.them + 0.3)) / 0.5); v = lerp(v, 0.12, push * (1 - outBack(back, 2.6))); }
    if (i === 1) v = lerp(v, 0.5, s5(T.final + 0.2, T.logo - 0.3, t));
    d.knob.rotation.y = -d.angle(v);
    d.setMat.opacity = ss(ts + 0.4, ts + 0.7, t) * (1 - endDark); d.words.opacity = 1 - ss(T.final, T.logo - 0.5, t);
    const a = d.angle(1), r = 0.147; d.set.position.set(Math.sin(a) * r, 0.0048, -Math.cos(a) * r); d.set.rotation.y = -a;
  });
  { const logoK = s5(T.final + 0.4, T.logo - 0.25, t); W.logoRing.set({ weight: logoK, white: logoK, hours: 0, hand: ss(T.logo - 0.4, T.logo - 0.15, t), handScale: outBack(clamp01((t - (T.logo - 0.4)) / 0.35), 1.8) }); }
  // ---- light: day, then night for the sleep lines, then day
  const night = ss(T.mouth3 - 0.6, T.mouth3 + 0.4, t) * (1 - ss(T.holding - 0.4, T.holding + 0.4, t)) * 0.7 + ss(T.child - 0.8, T.child, t) * (1 - ss(T.final - 0.4, T.final + 0.4, t)) * 0.45;
  const fig = 1 - endDark;
  W.key.intensity = 4.6 * fig * (1 - 0.55 * night); W.rim.intensity = (2.0 + 2.2 * night) * fig; W.fill.intensity = 1.0 * fig; W.side.intensity = 2.6 * (1 - ss(1.6, 3.2, t)) * fig;
  W.dialLight.intensity = 3.0 * ss(T.normal - 0.4, T.normal + 0.6, t) * (1 - 0.6 * endDark);
  W.cardLight.intensity = 4.0 * ss(6.8, 8.0, t) * (1 - ss(14.0, 15.2, t));
  S.tableMat.color.setScalar(0.35 * (1 - endDark * 0.9)); scene.environmentIntensity = 0.12 * (1 - endDark); S.reflAmt = 0.8 * (1 - endDark);
}

// ------------------------------------------------------------------ the words on screen
const CAPS = [
  { t0: 0.35, t1: 1.5, top: 300, size: 110, html: '<em>Mewing</em>' },
  { t0: 1.59, t1: 5.2, top: 292, size: 84, html: 'Press your whole tongue<br>to the <em>roof of your mouth</em>' },
  { t0: 5.30, t1: 7.6, top: 292, size: 88, html: 'and wait for<br>a <em>sharper jaw</em>' },
  { t0: 7.89, t1: 11.0, top: 300, size: 88, html: 'One <em>orthodontist’s</em> theory' },
  { t0: 11.13, t1: 14.0, top: 292, size: 84, html: 'The internet removed<br>the <em>orthodontist</em>' },
  { t0: 14.48, t1: 16.5, top: 300, size: 92, html: 'Proof it <em>reshapes a face?</em>' },
  { t0: 16.66, t1: 20.4, top: 292, size: 80, html: 'UK orthodontists:<br><em>no independent studies</em>' },
  { t0: 20.92, t1: 23.9, top: 300, size: 92, html: 'US orthodontists <em>agree</em>' },
  { t0: 24.04, t1: 28.1, top: 292, size: 80, html: 'Long-term pressure can<br><em>loosen teeth, shift your bite</em>' },
  { t0: 28.61, t1: 30.1, top: 300, size: 88, html: 'A mouth <em>at rest:</em>' },
  { t0: 30.19, t1: 31.45, top: 300, size: 96, html: 'Lips <em>closed</em>' },
  { t0: 31.56, t1: 33.1, top: 292, size: 88, html: 'Breathing through<br>your <em>nose</em>' },
  { t0: 33.18, t1: 38.2, top: 292, size: 80, html: 'Tongue tip behind your<br><em>top or bottom</em> front teeth' },
  { t0: 38.48, t1: 40.6, top: 300, size: 92, html: 'Teeth <em>slightly apart</em>' },
  { t0: 40.76, t1: 43.0, top: 300, size: 88, html: 'Mewing says: <em>close them</em>' },
  { t0: 43.42, t1: 47.4, top: 292, size: 80, html: 'Mouth and throat exercises<br>have a <em>real use</em>' },
  { t0: 47.69, t1: 53.4, top: 292, size: 76, html: 'Small trials: a set programme<br>cut <em>sleep apnoea</em> events' },
  { t0: 53.80, t1: 57.5, top: 292, size: 80, html: 'One tongue position<br>is <em>not</em> that programme' },
  { t0: 57.96, t1: 63.4, top: 292, size: 76, html: 'Children who mouth-breathe<br>tend to have <em>longer faces</em>' },
  { t0: 63.59, t1: 65.4, top: 300, size: 96, html: 'A link, <em>not proof</em>' },
  { t0: 65.8, t1: 71.0, top: 292, size: 76, html: 'Snoring with pauses or gasps?<br>Often <em>breathing through the mouth?</em>' },
  { t0: 71.17, t1: 72.8, top: 300, size: 96, html: 'See a <em>doctor</em>' },
  { t0: 72.94, t1: 76.6, top: 292, size: 84, html: 'A common cause: big<br><em>tonsils</em> or <em>adenoids</em>' },
  { t0: 77.28, t1: 99, top: 360, size: 96, html: 'Back to<br><em>factory settings.</em>' },
];
const OVL = {};
function overlayInit(S) {
  const O = S.O, tag = (cls, txt2, size) => { const e = O.tag(cls, txt2); e.style.fontSize = size + 'px'; return e; };
  OVL.zero = tag('tag', 'Independent studies<b>0</b>', 26); OVL.zero.querySelector('b').style.fontSize = '84px';
  OVL.loose = tag('tag', 'Loose teeth', 26); OVL.bite = tag('tag', 'Shifted bite', 26);
  OVL.tip = tag('tag', 'Tongue tip', 26);
  OVL.gap = tag('tag', 'Slightly apart', 26);
  OVL.dial = [tag('tag', 'Lips<b>closed</b>', 26), tag('tag', 'Breathing<b>nose</b>', 26), tag('tag', 'Teeth<b>slightly apart</b>', 26)];
  for (const e of OVL.dial) e.querySelector('b').style.fontSize = '44px';
  OVL.events = tag('tag', 'Sleep apnoea events<b>about 10 fewer an hour</b>', 24); OVL.events.querySelector('b').style.fontSize = '40px';
  OVL.prog = tag('tag', 'A set programme<b>1 · 2 · 3</b>', 26); OVL.prog.querySelector('b').style.fontSize = '48px';
  OVL.one = tag('tag', 'One position<b>held</b>', 26); OVL.one.querySelector('b').style.fontSize = '44px';
  OVL.face = tag('tag', 'Face height', 24); OVL.link = tag('tag', 'Longer in children<b>a link</b>', 24); OVL.link.querySelector('b').style.fontSize = '40px';
  OVL.tonsil = tag('tag', 'Tonsil', 26); OVL.adenoid = tag('tag', 'Adenoids', 26);
}
function overlay(S, t) {
  const H = (x, y, z) => toW(hl(x, y, z));
  place(S, OVL.zero, H(0.004, -0.095, 0.02), 40, 20, pulse(t, T.no - 0.1, T.america + 0.2));
  place(S, OVL.loose, H(0.002, -0.04, 0.09), 50, -70, pulse(t, T.loosen, T.normal - 0.3));
  place(S, OVL.bite, H(0.002, -0.07, 0.085), 50, 40, pulse(t, T.shift, T.normal - 0.3));
  place(S, OVL.tip, H(0.0, -0.05, 0.079), 60, -90, pulse(t, T.tip, T.teeth2 + 0.6));
  place(S, OVL.gap, H(0.0, -0.056, 0.088), 70, 30, pulse(t, T.slightly - 0.1, T.mewing2));
  W.dials.forEach((d, i) => { const ts = [T.closed - 0.3, T.nose - 0.3, T.apart + 0.3][i], e = OVL.dial[i];
    place(S, e, d.g.position.clone().add(new THREE.Vector3(0.11, 0, 0)), -(e.offsetWidth || 160) / 2, 6, ss(ts + 0.3, ts + 0.7, t) * (1 - ss(T.mouth3 - 0.6, T.mouth3, t))); });
  place(S, OVL.prog, H(0.004, -0.02, 0.06), 40, -60, pulse(t, T.set - 0.2, T.cut + 0.4) + pulse(t, T.holding, T.programme2 + 0.8) * 0.45);
  place(S, OVL.events, H(0.004, -0.11, 0.02), 40, 10, pulse(t, T.cut - 0.1, T.holding - 0.2));
  place(S, OVL.one, H(0.004, -0.035, 0.04), -260, -40, pulse(t, T.position - 0.3, T.children - 0.3));
  place(S, OVL.face, H(0.004, -0.03, 0.125), 30, -20, pulse(t, T.longer - 0.4, T.proof2 + 0.9));
  place(S, OVL.link, H(0.004, -0.1, 0.11), 30, 10, pulse(t, T.faces, T.proof2 + 0.9));
  place(S, OVL.tonsil, toW(W.lumps[0].position.clone()), 60, 30, pulse(t, T.tonsils - 0.2, T.final - 0.2));
  place(S, OVL.adenoid, toW(W.lumps[1].position.clone()), 60, -60, pulse(t, T.adenoids - 0.2, T.final - 0.2));
  const d = W.dials[1], c = d.g.position.clone().add(new THREE.Vector3(0, (0.0665 + 0.0012) * DS, 0));
  logoEnd(S, t, { t0: T.logo, center: c, edge: c.clone().add(new THREE.Vector3(0, 0, LOGO_R)) });
}

makeFilm({
  T, caps: CAPS, subs: [], build, update, pose: camPose, overlay, overlayInit, focus: focusAt,
  stage: { bg: 0x07080a, reflSize: 6, env: 0.12, far: 30 },
  aperture: [[0, 0.003], [3.9, 0.004], [8.3, 0.003], [12.3, 0.004], [14.3, 0.004], [15.6, 0.002], [21.4, 0.004], [29.6, 0.002], [34, 0.004], [40.7, 0.002], [44.4, 0.004], [58.6, 0.002], [66.6, 0.004], [77.8, 0.003]],
  bloom: [[0, 0.42], [44, 0.5], [53, 0.45], [66, 0.5], [77, 0.55]],
  fast: [[1.6, 3.6, 2], [12.0, 13.0, 2], [25.5, 28.0, 2]],
});

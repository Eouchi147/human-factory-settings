// Human Factory Settings · Film 10 "Should you walk after eating?" (new direction, 7 Oct 2026) · one continuous shot, 9:16.
// A skeleton slumps on a sofa after dinner while a glowing line, its blood sugar, rises off the plate and hangs over it all
// evening. "Let's get you off that sofa": the seat cushion springs up on a coil and launches it to its feet. "Not to lie on
// the sofa like a python digesting a goat": on the other cushion a plush python lies with a lump the shape of a goat,
// two little horns poking up (the gag). On the coffee table, the study: breakfast, lunch, dinner; one 30-minute block of
// walking splits into three 10-minute blocks, one after each meal; two glowing hills over the table show the rise after
// meals 12% smaller and after dinner 22% smaller. A pull-along toy dog rolls up, the leash hops into the skeleton's hand,
// and it walks off down a dark street, past lamps and a lit shop. The plates stack themselves into dirty dishes that wait.
// Insulin and other diabetes medicine: the line dips below "too low"; ask your doctor. A dial set to 10 minutes becomes
// the logo.
import { THREE, ORANGE, ss, s5, lerp, clamp01, hash, camTrack, phys, glowMat, shadows, spot, RoundedBoxGeometry,
  loadAnatomy, V3, place, logoEnd, makeFilm, outBack, stamp, stampCanvas, stampSpot } from '../kit.js';
import { buildRig, skeletonKind, legIK, bendSpine, poseArm, walkAt, ARM0, worldVerts, avgV, clearArms } from '../rig.js';
import { makeLogoRing } from '../props.js';

//@HANDS@

// ------------------------------------------------------------------ timing, from the voice guide (word starts)
const T = {
  end: 73.16, logo: 70.64,
  you: 0.35, dinner: 1.54, table: 1.77, sofa: 2.41, and: 2.97, blood: 3.65, sugar: 4.0, whole: 4.83, evening: 4.88, itself: 5.97,
  lets: 6.95, get: 7.47, off: 7.83, sofa2: 8.07,
  your2: 9.46, built: 10.51, walk: 10.78, not: 11.06, lie: 11.57, after: 12.7, dinner2: 13.15, like: 13.47, python: 13.95, digesting: 14.32, goat: 15.27,
  in: 16.48, study: 17.09, fortyone: 17.46, diabetes: 18.99, everyone: 19.81, walked: 20.62, thirty: 20.77, day: 22.2, either: 22.25, one: 23.24, go: 23.42,
  or: 23.82, ten: 24.48, after2: 25.12, each: 25.59, meal: 26.24,
  with: 27.44, same: 28.06, walking: 28.89, meals: 29.78, rise: 30.71, eating: 32.68, about: 33.0, twelve: 33.43, smaller: 34.43,
  and2: 35.01, dinner3: 35.76, twentytwo: 36.11, smaller2: 37.66, it: 38.77, same2: 39.52, better: 40.27, timing: 40.57,
  these: 41.92, short: 42.68, call: 43.47, good: 44.15, habit: 44.33, not2: 44.75, cure: 45.17,
  so: 46.35, especially: 47.91, dinner4: 48.54, walk3: 48.97, ten2: 49.84, around: 50.6, block: 51.27, shop: 52.18, dog: 53.09,
  the: 54.18, dishes: 54.48, wait: 55.15, they: 55.45, always: 55.8, do: 56.23,
  if: 57.27, insulin: 58.04, another: 58.78, medicine: 60.02, drop: 62.53, low: 63.25, ask: 63.44, doctor: 64.17, extra: 64.81, fits: 65.97, doses: 66.73,
  final: 68.38, factory: 69.59, settings: 69.96,
};

// ------------------------------------------------------------------ the set (metres; the skeleton faces +z; +x is its left)
const W = {}; window.HFS_W = W;
const SEAT = 0.43;                                                     // the top of the sofa's seat cushions
const SOFA = { x0: -1.05, x1: 1.05, z0: -0.8, z1: 0.0 };              // the sofa faces +z; its seat's front edge is at z 0
const CUSH = [{ x: -0.5 }, { x: 0.5 }];                               // two seat cushions: the skeleton's (it springs), the python's
const CT = { x: 0.6, z: 0.78, w: 0.46, d: 0.92, top: 0.4 };           // the coffee table, long side along z: the day runs from far (breakfast) to near (dinner)
const STAND = new THREE.Vector3(-0.5, 0, 0.45);                       // where the skeleton lands (its pelvis over this point)
const DOG0 = new THREE.Vector3(-1.2, 0, 0.62);                        // the toy dog, waiting by the sofa
const X = new THREE.Vector3(1, 0, 0), Y = new THREE.Vector3(0, 1, 0), Z = new THREE.Vector3(0, 0, 1);
const pulse = (t, a, b, r = 0.35) => ss(a, a + r, t) * (1 - ss(b - r, b, t));
function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h, c);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
function txt(x, s, px, py, { font = '800 100px Archivo', color = '#fff', align = 'center', track = 0, base = 'middle' } = {}) {
  x.font = font; x.letterSpacing = `${track}px`; x.fillStyle = color; x.textAlign = align; x.textBaseline = base; x.fillText(s, px, py);
}
const black = () => phys({ color: 0x0d0e10, roughness: 0.32, clearcoat: 0.6, clearcoatRoughness: 0.25 });
const fabric = (c) => new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.95, sheen: 1, sheenRoughness: 0.7, sheenColor: new THREE.Color(c).multiplyScalar(1.6) });

// ------------------------------------------------------------------ the sofa: a frame, two arms, two back cushions, two seat cushions
function makeSofa(scene) {
  const g = new THREE.Group(); scene.add(g);
  const cloth = fabric(0x2b2f36), dark = fabric(0x22262c);
  const box = (w, h, d, r, m, x, y, z) => { const b = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 4, r), m); b.position.set(x, y, z); g.add(b); return b; };
  box(2.1, 0.2, 0.8, 0.03, dark, 0, 0.2, -0.4);                                           // the base
  box(2.1, 0.62, 0.16, 0.05, dark, 0, 0.51, -0.72);                                        // the back
  for (const s of [-1, 1]) box(0.15, 0.34, 0.8, 0.05, dark, s * 0.975, 0.45, -0.4);         // the arms
  const backs = CUSH.map((c) => { const b = box(0.94, 0.4, 0.17, 0.06, cloth, c.x, 0.52, -0.56); b.rotation.x = -0.18; return b; });
  for (const s of [-1, 1]) for (const zz of [-0.72, -0.08]) { const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.016, 0.1, 16), phys({ color: 0x15100c, roughness: 0.4 })); leg.position.set(s * 0.98, 0.05, zz); g.add(leg); }
  // the seat cushions; the skeleton's sits on a coil spring that, for now, is squashed flat out of sight
  const seats = CUSH.map((c, i) => { const p = new THREE.Group(); p.position.set(c.x, 0.3, -0.36); g.add(p);
    const m = new THREE.Mesh(new RoundedBoxGeometry(0.94, 0.13, 0.66, 5, 0.05), cloth); m.position.y = 0.065; p.add(m); return { p, m }; });
  const coilPts = []; for (let i = 0; i <= 160; i++) { const a = (i / 160) * Math.PI * 2 * 6; coilPts.push(new THREE.Vector3(Math.cos(a) * 0.09, i / 160, Math.sin(a) * 0.09)); }
  const coil = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(coilPts), 400, 0.008, 10), phys({ color: 0xb9bcc2, metalness: 1, roughness: 0.3 }));
  coil.position.set(CUSH[0].x, 0.3, -0.36); coil.scale.y = 0.001; coil.visible = false; g.add(coil);
  shadows(g); g.traverse((o) => o.layers.enable(1));
  return { g, seats, backs, coil };
}
// ------------------------------------------------------------------ the coffee table, and what stands on it
function makeTable(scene) {
  const g = new THREE.Group(); g.position.set(CT.x, 0, CT.z); scene.add(g);
  const top = new THREE.Mesh(new RoundedBoxGeometry(CT.w, 0.035, CT.d, 4, 0.01), phys({ color: 0x111215, roughness: 0.62, clearcoat: 0.15, clearcoatRoughness: 0.5 })); top.position.y = CT.top - 0.0175; g.add(top);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const leg = new THREE.Mesh(new THREE.BoxGeometry(0.03, CT.top - 0.035, 0.03), black()); leg.position.set(sx * (CT.w / 2 - 0.04), (CT.top - 0.035) / 2, sz * (CT.d / 2 - 0.04)); g.add(leg); }
  shadows(g); g.traverse((o) => o.layers.enable(1));
  return { g, top };
}
const PLATE_R = 0.105;
function makePlate() {
  const prof = [[0, 0], [0.07, 0], [0.075, 0.004], [0.085, 0.008], [PLATE_R - 0.004, 0.018], [PLATE_R, 0.02], [PLATE_R - 0.003, 0.021], [0.082, 0.011], [0.072, 0.007], [0, 0.007]].map(([r, y]) => new THREE.Vector2(r, y));
  const m = new THREE.Mesh(new THREE.LatheGeometry(prof, 96), phys({ color: 0xf2f1ec, roughness: 0.22, clearcoat: 0.8, clearcoatRoughness: 0.1, side: THREE.DoubleSide }));
  // crumbs and a smear: it has been eaten from
  const g = new THREE.Group(); g.add(m); let s = 3; const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const crumbM = phys({ color: 0x8a6a45, roughness: 0.8 });
  for (let i = 0; i < 9; i++) { const c = new THREE.Mesh(new THREE.IcosahedronGeometry(0.0035 + rnd() * 0.003, 0), crumbM); const a = rnd() * 6.28, r = rnd() * 0.06; c.position.set(Math.cos(a) * r, 0.0095, Math.sin(a) * r); g.add(c); }
  const smear = new THREE.Mesh(new THREE.CircleGeometry(0.03, 24), new THREE.MeshPhysicalMaterial({ color: 0x9b5a3a, roughness: 0.5, transparent: true, opacity: 0.55 })); smear.rotation.x = -Math.PI / 2; smear.scale.set(1.4, 0.6, 1); smear.position.set(0.02, 0.0075, 0.015); g.add(smear);
  shadows(g); m.castShadow = true; g.traverse((o) => o.layers.enable(1));
  return g;
}
// a block of walking: a white slab, 10 minutes long (three of them make the 30)
const SLAB = { l: 0.1, h: 0.022, w: 0.075 };
function makeSlab(n = 1) {
  const m = new THREE.Mesh(new RoundedBoxGeometry(SLAB.w, SLAB.h, SLAB.l * n, 3, 0.006), new THREE.MeshPhysicalMaterial({ color: 0xeceef1, roughness: 0.4, clearcoat: 0.4, emissive: new THREE.Color(0xeceef1), emissiveIntensity: 0.15 }));
  m.castShadow = true; m.layers.enable(1); return m;
}
// ------------------------------------------------------------------ the plush python, with a goat inside
function makePython(scene) {
  const g = new THREE.Group(); scene.add(g);
  // its path: the head on the sofa's right arm, down onto the cushion, an S across it, the tail over the front edge
  const P = [[0.985, 0.623, -0.52], [0.93, 0.6, -0.42], [0.84, 0.47, -0.32], [0.7, 0.434, -0.2], [0.52, 0.434, -0.14], [0.36, 0.434, -0.22], [0.22, 0.434, -0.36], [0.12, 0.434, -0.3], [0.16, 0.434, -0.12], [0.24, 0.43, 0.0], [0.28, 0.33, 0.05]].map((p) => new THREE.Vector3(p[0], p[1], p[2] + 0.06));
  const curve = new THREE.CatmullRomCurve3(P), N = 260, R = 18;
  const radius = (u) => { const lump = Math.exp(-((u - 0.42) ** 2) / (2 * 0.06 ** 2)); return (0.047 + 0.012 * Math.sin(Math.PI * Math.min(1, u * 1.4))) * (1 - 0.75 * ss(0.78, 1, u)) + 0.085 * lump; };
  const pos = [], uv = [], idx = [], frames = curve.computeFrenetFrames(N, false);
  for (let i = 0; i <= N; i++) { const u = i / N, c = curve.getPointAt(u), r = radius(u), nn = frames.normals[i], bb = frames.binormals[i];
    for (let j = 0; j <= R; j++) { const a = (j / R) * Math.PI * 2, d = nn.clone().multiplyScalar(Math.cos(a)).addScaledVector(bb, Math.sin(a));
      const flat = d.y < 0 ? 0.55 : 1;   // a soft toy: it slumps flat where it lies (the curve runs along what it lies on)
      pos.push(c.x + d.x * r, c.y + d.y * r * flat + r * 0.56, c.z + d.z * r); uv.push(u * 6, j / R); } }
  for (let i = 0; i < N; i++) for (let j = 0; j < R; j++) { const a = i * (R + 1) + j, b = a + R + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx); geo.computeVertexNormals();
  const tex = canvasTex(512, 256, (x, w, h) => { x.fillStyle = '#8c7b4c'; x.fillRect(0, 0, w, h); let s = 11; const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 26; i++) { x.fillStyle = i % 3 ? '#4b3b22' : '#5c4a2a'; x.beginPath(); x.ellipse(rnd() * w, h * (0.15 + rnd() * 0.5), 18 + rnd() * 26, 10 + rnd() * 14, rnd(), 0, 6.28); x.fill(); }
    const gr = x.createLinearGradient(0, 0, 0, h); gr.addColorStop(0.62, 'rgba(230,214,170,0)'); gr.addColorStop(0.8, 'rgba(230,214,170,0.9)'); x.fillStyle = gr; x.fillRect(0, 0, w, h); });
  tex.wrapS = THREE.RepeatWrapping;
  const plush = new THREE.MeshPhysicalMaterial({ map: tex, roughness: 1, sheen: 1, sheenRoughness: 0.6, sheenColor: new THREE.Color(0xd8c99a) });
  const body = new THREE.Mesh(geo, plush); g.add(body);
  // the head: a soft wedge at the first point, resting on the arm, eyes half shut
  const hp = curve.getPointAt(0), hd = curve.getTangentAt(0).negate();
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.075, 32, 20), plush); head.scale.set(0.95, 0.62, 1.3); head.position.copy(hp).addScaledVector(hd, 0.035); head.position.y += 0.037;
  head.lookAt(head.position.clone().add(hd)); g.add(head);
  const eyeM = phys({ color: 0x0b0b0c, roughness: 0.15, clearcoat: 1 }), lidM = plush;
  for (const s of [-1, 1]) { const side = new THREE.Vector3().crossVectors(hd, Y).normalize().multiplyScalar(s);
    const e = new THREE.Mesh(new THREE.SphereGeometry(0.011, 16, 12), eyeM); e.position.copy(head.position).addScaledVector(side, 0.046).addScaledVector(hd, 0.04); e.position.y += 0.024; g.add(e);
    const lid = new THREE.Mesh(new THREE.SphereGeometry(0.0122, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), lidM); lid.position.copy(e.position); lid.rotation.x = 0.35; g.add(lid); }   // contented: lids half down
  // the goat: two little horns poking up out of the lump
  const lu = 0.445, lc = curve.getPointAt(lu), lr = radius(lu), horns = new THREE.Group(); horns.position.set(lc.x, lc.y + lr * 1.56 - 0.012, lc.z); horns.userData.y0 = horns.position.y; g.add(horns);
  const hornM = phys({ color: 0xd2c8b2, roughness: 0.5, clearcoat: 0.3 });
  // goat horns: straight up out of the lump, the tips curling back toward the python's tail (it swallowed the goat head first), ridged, tapering
  for (const s of [-1, 1]) { const pts = []; for (let i = 0; i <= 16; i++) { const k = i / 16; pts.push(new THREE.Vector3(s * (0.018 + 0.022 * k), -0.012 + 0.092 * Math.sin(k * 1.35), 0.04 * k * k * k)); }
    const c = new THREE.CatmullRomCurve3(pts), g2 = new THREE.TubeGeometry(c, 48, 0.0115, 14), P2 = g2.attributes.position;
    for (let i = 0; i <= 48; i++) { const k = i / 48, sc = (1 - 0.72 * k) * (1 + 0.07 * Math.sin(k * 70)), cc = c.getPointAt(k); for (let j = 0; j <= 14; j++) { const vi = i * 15 + j; const v = new THREE.Vector3().fromBufferAttribute(P2, vi).sub(cc).multiplyScalar(sc).add(cc); P2.setXYZ(vi, v.x, v.y, v.z); } }
    g2.computeVertexNormals(); horns.add(new THREE.Mesh(g2, hornM)); }
  horns.lookAt(horns.position.clone().add(new THREE.Vector3(0.342, 0, -0.94)));   // the pair side by side as the camera sees it (a V, not one stick), the tips curling away
  shadows(g); g.traverse((o) => o.layers.enable(1));
  return { g, body, head, horns, lumpAt: lc, curve, plush, hornM, sheen0: plush.sheenColor.clone(), horn0: hornM.color.clone() };
}
// ------------------------------------------------------------------ the toy dog: wood, on wheels, with a red-brown leash
function makeDog(scene) {
  const g = new THREE.Group(); scene.add(g);
  const wood = phys({ color: 0xd9b98a, roughness: 0.55, clearcoat: 0.35 }), dark = phys({ color: 0x3a2a1c, roughness: 0.5 }), eyeM = phys({ color: 0x0b0b0c, roughness: 0.2, clearcoat: 1 });
  const b = (w, h, d, m, x, y, z, r = 0.01) => { const k = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, r), m); k.position.set(x, y, z); g.add(k); return k; };
  b(0.1, 0.08, 0.2, wood, 0, 0.11, 0, 0.025);                                   // body (it faces +z)
  const head = b(0.085, 0.08, 0.09, wood, 0, 0.175, 0.11, 0.022);
  b(0.05, 0.035, 0.05, wood, 0, 0.16, 0.165, 0.012);                             // snout
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.012, 16, 12), dark); nose.position.set(0, 0.17, 0.192); g.add(nose);
  for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.0075, 12, 10), eyeM); e.position.set(s * 0.025, 0.195, 0.153); g.add(e); }
  const ears = [-1, 1].map((s) => { const p = new THREE.Group(); p.position.set(s * 0.045, 0.205, 0.1); g.add(p); const e = new THREE.Mesh(new RoundedBoxGeometry(0.012, 0.06, 0.035, 2, 0.005), dark); e.position.y = -0.026; p.add(e); return p; });
  const tail = new THREE.Group(); tail.position.set(0, 0.135, -0.1); g.add(tail);
  { const pts = []; for (let i = 0; i <= 30; i++) { const k = i / 30, a = k * Math.PI * 2 * 4; pts.push(new THREE.Vector3(Math.cos(a) * 0.008, k * 0.055, -k * 0.02 + Math.sin(a) * 0.008)); }   // a spring tail
    tail.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 90, 0.0025, 6), phys({ color: 0x9a9ca0, metalness: 1, roughness: 0.35 })));
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.01, 12, 10), wood); knob.position.set(0, 0.06, -0.022); tail.add(knob); }
  const wheels = []; for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.018, 28), dark); w.rotation.z = Math.PI / 2; const p = new THREE.Group(); p.position.set(sx * 0.062, 0.035, sz * 0.065); p.add(w); g.add(p); wheels.push(p); }
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.006, 8, 24), phys({ color: 0x7a2c22, roughness: 0.5 })); collar.position.set(0, 0.15, 0.07); collar.rotation.x = Math.PI / 2 - 0.4; g.add(collar);
  shadows(g); g.traverse((o) => o.layers.enable(1));
  return { g, head, ears, tail, wheels, ring: new THREE.Vector3(0, 0.15, 0.1) };
}
// ------------------------------------------------------------------ the street: lamps and a lit shop, along the walk
const LAMPS = [{ x: -1.6, z: 2.6 }, { x: -1.6, z: 4.1 }], LH = 3.4;     // tall enough that the bulbs stay above the frame (the captions live up there)
const SHOPP = { x: -1.8, z: 5.2 };
const KC = { x: -1.45, z: 7.2, w: 0.6, d: 1.4, top: 0.9 };                // the kitchen counter, further along: the dishes wait there
function makeStreet(scene) {
  const g = new THREE.Group(); scene.add(g); const lights = [];
  const pole = phys({ color: 0x15171a, roughness: 0.35, metalness: 0.6 });
  for (const L of LAMPS) { const s = Math.sign(L.x) || 1, p = new THREE.Group(); p.position.set(L.x, 0, L.z); g.add(p);
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.045, LH, 20), pole); post.position.y = LH / 2; p.add(post);
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.45, 12), pole); arm.rotation.z = Math.PI / 2; arm.position.set(-s * 0.2, LH - 0.05, 0); p.add(arm);   // (the arm reaches toward the path)
    const hood = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.13, 0.09, 28, 1, true), phys({ color: 0x15171a, roughness: 0.4, side: THREE.DoubleSide })); hood.position.set(-s * 0.42, LH - 0.1, 0); p.add(hood);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.035, 16, 12), glowMat(new THREE.Color(0xffe2b0).multiplyScalar(2.2))); bulb.position.set(-s * 0.42, LH - 0.14, 0); p.add(bulb);
    const sp = spot(scene, { color: 0xffd9a0, pos: new THREE.Vector3(L.x - s * 0.42, LH - 0.15, L.z), target: new THREE.Vector3(L.x - s * 0.42, 0, L.z), angle: 0.5, penumbra: 0.85 }); lights.push(sp); }
  // the shop: a front with a lit window, a door, a striped awning and its name
  const shop = new THREE.Group(); shop.position.set(SHOPP.x, 0, SHOPP.z); shop.rotation.y = Math.PI / 2; g.add(shop);   // its front faces +x, the street
  const wall = new THREE.Mesh(new RoundedBoxGeometry(1.5, 2.3, 0.12, 3, 0.01), phys({ color: 0x1d2024, roughness: 0.7 })); wall.position.set(0, 1.15, -0.06); shop.add(wall);
  const win = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.75), new THREE.MeshBasicMaterial({ map: canvasTex(512, 480, (x, w, h) => {
    // a warm, dim window (a white skeleton walks past it and has to read against it), the shop's name on the glass
    const gr = x.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#b38d5c'); gr.addColorStop(1, '#8a653b'); x.fillStyle = gr; x.fillRect(0, 0, w, h);
    x.fillStyle = 'rgba(50,30,12,0.5)'; for (let i = 0; i < 3; i++) x.fillRect(0, h * (0.4 + i * 0.22), w, 8);                          // shelves
    let s = 5; const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let r = 0; r < 3; r++) for (let i = 0; i < 9; i++) { x.fillStyle = ['#6f4526', '#55391f', '#8c6a40', '#6a2c20'][Math.floor(rnd() * 4)]; const bw = 22 + rnd() * 18, bh = 30 + rnd() * 34; x.fillRect(20 + i * 54, h * (0.4 + r * 0.22) - bh, bw, bh); }
    txt(x, 'SHOP', w / 2, h * 0.13, { font: '700 74px "Geist Mono"', color: '#2b1b0d', track: 26 }); }) }));
  win.position.set(-0.22, 1.1, 0.002); shop.add(win);
  const door = new THREE.Mesh(new THREE.PlaneGeometry(0.36, 1.25), new THREE.MeshBasicMaterial({ color: 0x3d2a18 })); door.position.set(0.47, 0.625, 0.002); shop.add(door);
  const doorGlow = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.5), new THREE.MeshBasicMaterial({ color: 0xf5cf93 })); doorGlow.position.set(0.47, 0.95, 0.003); shop.add(doorGlow);
  // a low awning in muted stripes, kept under the captions
  const awnTex = canvasTex(512, 64, (x, w, h) => { for (let i = 0; i < 12; i++) { x.fillStyle = i % 2 ? '#a9a090' : '#4f2621'; x.fillRect(i * w / 12, 0, w / 12, h); } });
  const awn = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.4), new THREE.MeshStandardMaterial({ map: awnTex, roughness: 0.8, side: THREE.DoubleSide })); awn.position.set(0, 1.62, 0.18); awn.rotation.x = 0.95; shop.add(awn);
  const shopLight = spot(scene, { color: 0xffd9a0, pos: new THREE.Vector3(SHOPP.x + 0.3, 1.2, SHOPP.z + 0.2), target: new THREE.Vector3(SHOPP.x + 1.6, 0, SHOPP.z + 0.2), angle: 0.9, penumbra: 1 }); lights.push(shopLight);
  // the kitchen counter: a dark block with a pale top, and a small light over it
  const kc = new THREE.Group(); kc.position.set(KC.x, 0, KC.z); g.add(kc);
  const body = new THREE.Mesh(new RoundedBoxGeometry(KC.w, KC.top - 0.04, KC.d, 3, 0.01), phys({ color: 0x15171a, roughness: 0.6 })); body.position.y = (KC.top - 0.04) / 2; kc.add(body);
  const kTop = new THREE.Mesh(new RoundedBoxGeometry(KC.w + 0.04, 0.04, KC.d + 0.04, 3, 0.008), phys({ color: 0x2a2c30, roughness: 0.5, clearcoat: 0.2 })); kTop.position.y = KC.top - 0.02; kc.add(kTop);
  const kLight = spot(scene, { color: 0xfff1d8, pos: new THREE.Vector3(KC.x + 1.2, 2.2, KC.z + 0.4), target: new THREE.Vector3(KC.x, KC.top, KC.z), angle: 0.35, penumbra: 0.8 }); lights.push(kLight);
  shadows(g); win.castShadow = false; g.traverse((o) => o.layers.enable(1));
  return { g, lights, kc };
}
// ------------------------------------------------------------------ the medicine: a box and a pen (no brand), on the table later
function makeMedicine(scene) {
  const g = new THREE.Group(); scene.add(g);
  const box = new THREE.Mesh(new RoundedBoxGeometry(0.1, 0.16, 0.05, 3, 0.004), new THREE.MeshPhysicalMaterial({ map: canvasTex(320, 512, (x, w, h) => {
    x.fillStyle = '#f1f2ef'; x.fillRect(0, 0, w, h); x.fillStyle = '#3b5fc2'; x.fillRect(0, h * 0.7, w, h * 0.07);
    txt(x, 'YOUR', 26, h * 0.3, { font: '600 46px "Geist Mono"', color: '#1d1e22', align: 'left', track: 6 }); txt(x, 'MEDICINE', 26, h * 0.42, { font: '600 46px "Geist Mono"', color: '#1d1e22', align: 'left', track: 6 }); }), roughness: 0.6 }));
  box.rotation.y = 0.2; box.position.set(0, 0.08, 0); g.add(box);   // standing up, its label to the front
  const pen = new THREE.Group(); pen.position.set(0.1, 0.0092, 0.05); pen.rotation.set(0, 0.45, Math.PI / 2); g.add(pen);
  const penBody = new THREE.Mesh(new THREE.CylinderGeometry(0.0085, 0.0085, 0.13, 24), phys({ color: 0xd9dadd, roughness: 0.35, clearcoat: 0.5 })); pen.add(penBody);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.0092, 0.0092, 0.045, 24), phys({ color: 0x3b5fc2, roughness: 0.4, clearcoat: 0.5 })); cap.position.y = 0.085; pen.add(cap);
  const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.0065, 0.0065, 0.016, 20), phys({ color: 0x2a2c31, roughness: 0.5 })); knob.position.y = -0.072; pen.add(knob);
  const win = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.018, 0.009), new THREE.MeshBasicMaterial({ color: 0x0b0c0e })); win.position.set(0.0084, -0.04, 0); pen.add(win);
  shadows(g); g.traverse((o) => o.layers.enable(1)); g.visible = false;
  return { g, box, pen };
}
// ------------------------------------------------------------------ the dial: minutes of walking after dinner, 0 to 20; the setting, 10, in orange
const DIAL_R = 0.062, LOGO_R = 0.048;
const ANG = (v) => ((-135 + 13.5 * v) * Math.PI) / 180;
function makeDial(scene, at) {
  const g = new THREE.Group(); g.position.copy(at); scene.add(g);
  const dark = phys({ color: 0x121316, roughness: 0.38, clearcoat: 0.6, clearcoatRoughness: 0.25 }), alu = phys({ color: 0xcdcac4, metalness: 1, roughness: 0.3, clearcoat: 0.4 });
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(DIAL_R + 0.01, DIAL_R + 0.013, 0.012, 128), dark); plate.position.y = 0.006; g.add(plate);
  const bezel = new THREE.Mesh(new THREE.TorusGeometry(DIAL_R + 0.003, 0.003, 20, 160), alu); bezel.rotation.x = Math.PI / 2; bezel.position.y = 0.0125; g.add(bezel);
  const tex = canvasTex(1024, 1024, (x, w) => { const R = w / 2; x.fillStyle = '#0b0c0e'; x.fillRect(0, 0, w, w);
    for (let v = 0; v <= 20; v++) { const a = ANG(v), big = v % 5 === 0, r0 = R * (big ? 0.76 : 0.83), r1 = R * 0.9; x.strokeStyle = big ? '#e7e9ec' : '#8d9097'; x.lineWidth = big ? 7 : 3.5; x.beginPath(); x.moveTo(R + Math.sin(a) * r0, R - Math.cos(a) * r0); x.lineTo(R + Math.sin(a) * r1, R - Math.cos(a) * r1); x.stroke();
      if (v % 5 === 0) txt(x, String(v), R + Math.sin(a) * R * 0.62, R - Math.cos(a) * R * 0.62, { font: '600 74px Archivo', color: '#e7e9ec' }); }
    txt(x, 'MINUTES', R, R * 1.4, { font: '500 40px "Geist Mono"', color: '#9a9da4', track: 9 }); txt(x, 'AFTER DINNER', R, R * 1.52, { font: '500 30px "Geist Mono"', color: '#6d7077', track: 7 }); });
  const faceMat = new THREE.MeshPhysicalMaterial({ map: tex, roughness: 0.42, clearcoat: 0.5, emissive: new THREE.Color(0xffffff), emissiveMap: tex, emissiveIntensity: 0.08, transparent: true });
  const face = new THREE.Mesh(new THREE.CircleGeometry(DIAL_R, 128), faceMat); face.rotation.x = -Math.PI / 2; face.position.y = 0.0122; face.renderOrder = 1; g.add(face);
  const flat = new THREE.Group(); flat.rotation.x = -Math.PI / 2; flat.position.y = 0.0128; g.add(flat);
  const setM = new THREE.Mesh(new THREE.RingGeometry(DIAL_R * 0.905, DIAL_R * 0.965, 64, 1, Math.PI / 2 - ANG(10), ANG(10) - ANG(0)), new THREE.MeshBasicMaterial({ color: ORANGE.clone().multiplyScalar(1.6), transparent: true, opacity: 0, depthWrite: false })); setM.renderOrder = 2; flat.add(setM);
  const n = new THREE.Group(); n.position.y = 0.0135; g.add(n);
  const nmat = new THREE.MeshPhysicalMaterial({ color: 0xf2f3f5, roughness: 0.35, clearcoat: 0.6, emissive: new THREE.Color(0xffffff), emissiveIntensity: 0.25, transparent: true });
  const bar = new THREE.Mesh(new THREE.BoxGeometry(0.002, 0.0009, DIAL_R * 0.86), nmat); bar.position.z = -DIAL_R * 0.43 + 0.007; bar.renderOrder = 3; n.add(bar);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.0045, 0.0045, 0.002, 40), nmat); hub.renderOrder = 3; n.add(hub);
  const logo = makeLogoRing(LOGO_R); logo.g.rotation.x = -Math.PI / 2; logo.g.position.y = 0.0142; logo.g.traverse((o) => { o.renderOrder = 4; }); g.add(logo.g);
  shadows(g); face.castShadow = false; g.traverse((o) => o.layers.enable(1)); g.visible = false;
  return { g, faceMat, setM, n, nmat, logo };
}
// ------------------------------------------------------------------ the blood-sugar line: one glowing line that changes shape over the film
// A: over the sofa, rising off the evening meal and coming down only slowly, over the evening. B: over the coffee table, the
// rise after eating as one hill, beside a faint copy at the height it had with one 30-minute walk: 12% smaller after meals,
// then 22% smaller after dinner. C: over the table, a dip below a dashed "too low" line. All three face +z.
const LINE_N = 140;
const GA = { x0: -0.82, x1: -0.18, y: 1.18, z: -0.62, h: 0.16 };                                // A, in the air behind the skeleton's head (the launch goes forward, away from it)
const GB = { x0: CT.x - 0.15, x1: CT.x + 0.15, y: 0.88, z: CT.z - 0.32, h: 0.15 };              // B, high over the far end of the table, against the dark
const GC = { z0: KC.z + 0.17, z1: KC.z - 0.17, y: 1.36, x: KC.x - 0.05, low: 1.26 };             // C: over the counter, facing +x (u runs toward -z: left to right on screen)
function shapeA(u, t) { const k = ss(T.dinner - 0.2, T.itself, t);                         // how far it has drawn
  const v = Math.min(u, k), rise = s5(0.1, 0.32, v) * (1 - 0.55 * s5(0.45, 1.0, v));
  return new THREE.Vector3(lerp(GA.x0, GA.x1, v), GA.y + GA.h * (0.08 + 0.92 * rise), GA.z); }
const hillG = (v) => Math.exp(-((v - 0.35) ** 2) / (2 * (v < 0.35 ? 0.11 : 0.22) ** 2)), hill = (v) => hillG(v) - lerp(hillG(0), hillG(1), v);   // a quick rise, a slower fall
function shapeB(u, f) { return new THREE.Vector3(lerp(GB.x0, GB.x1, u), GB.y + GB.h * Math.max(0, hill(u)) * f, GB.z); }
const fB = (t) => 1 - 0.12 * s5(T.twelve, T.smaller + 0.3, t) - 0.10 * s5(T.twentytwo, T.smaller2 + 0.3, t);   // 100%, then 88% after meals, then 78% after dinner
function shapeC(u, t) { const d = s5(T.drop - 0.3, T.low + 0.2, t) * (1 - s5(T.ask + 0.3, T.doctor + 0.3, t));
  const bump = Math.exp(-((u - 0.55) ** 2) / (2 * 0.12 ** 2));
  return new THREE.Vector3(GC.x, GC.y - 0.15 * bump * d, lerp(GC.z0, GC.z1, u)); }
function makeLine(scene, { r = 0.0045, color = 0xf4f6fa, gain = 1.8, opacity = 1 } = {}) {
  const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(gain), transparent: true, opacity, depthWrite: false });
  const m = new THREE.Mesh(new THREE.BufferGeometry(), mat); m.renderOrder = 6; m.layers.enable(1); m.frustumCulled = false; scene.add(m);
  return { m, r, set(pts, o) { m.geometry.dispose(); if (o < 0.002 || pts.length < 2) { m.visible = false; m.geometry = new THREE.BufferGeometry(); return; }
    m.visible = true; mat.opacity = opacity * o; m.geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), pts.length * 2, this.r, 10); } };
}
function makeDashes(scene, z0, z1, y, x) {
  const g = new THREE.Group(); scene.add(g); const mat = new THREE.MeshBasicMaterial({ color: 0xc3c6cc, transparent: true, opacity: 0, depthWrite: false });
  for (let z = Math.min(z0, z1); z < Math.max(z0, z1); z += 0.03) { const d = new THREE.Mesh(new THREE.BoxGeometry(0.003, 0.003, 0.016), mat); d.position.set(x, y, z + 0.008); g.add(d); }
  g.layers.enable(1); return { g, mat };
}

// ------------------------------------------------------------------ build
async function build(S, cfg) {
  const scene = S.scene;
  S.fog.near = 6.5; S.fog.far = 17;
  S.table.scale.set(3, 3, 1); S.table.position.z = 4; S.tableMat.clearcoat = 0.1; S.tableMat.specularIntensity = 0.3;
  for (const m of [S.tableMat.map, S.tableMat.roughnessMap]) if (m) { m.wrapS = m.wrapT = THREE.RepeatWrapping; m.repeat.multiplyScalar(3); }
  const meshes = await loadAnatomy(skeletonKind());
  const R = W.rig = buildRig(meshes);
  W.body = new THREE.Group(); scene.add(W.body); R.root.position.copy(R.P0).negate(); W.body.add(R.root);
  for (const m of meshes) { m.castShadow = true; m.receiveShadow = true; m.layers.enable(1); }
  W.bones = meshes.filter((m) => ['bone', 'tooth', 'cartilage'].includes(m.userData.tissue));
  W.hand = {}; for (const Side of ['Right', 'Left']) { const Wr = makeWrist(R, Side); W.hand[Side] = rigHand(R, Side, Wr); W.hand[Side].wr = Wr; }
  // the leash's grip: the right hand closes on a cord through its natural grip point, running across the palm
  { const H = W.hand.Right, eg = H.eg, c = H.handle.clone(), ax = H.across.clone(), q = new THREE.Vector3();
    const sdf = (p) => { q.copy(p); eg.worldToLocal(q); const d = q.sub(c), along = d.dot(ax); return d.addScaledVector(ax, -along).length() - 0.0055; };
    R.root.updateMatrixWorld(true); W.leashGrip = H.fit(sdf, { need: 0.0015, kmax: 1.25 }); H.curl(0.2); }
  // ---- the factory stamp: on the front of the breastbone
  { const st = R.byName.get('Body of sternum'); st.material = st.material.clone();
    W.stampSpot = stampSpot(st, { from: [0, 0.006, 0.12], dir: [0, 0, -1], spread: 0.004 });
    if (W.stampSpot) W.stamp = stamp(st, { canvas: stampCanvas(['HUMAN FACTORY', 'SETTINGS'], '', { frame: false }), center: W.stampSpot.center, normal: W.stampSpot.normal, up: [0, 1, 0], width: 0.04, depth: 0.03, opacity: 0.6 }); }
  // ---- seated: the hips on the cushion, leaning back into the sofa
  const hipB = new THREE.Box3(); for (const m of meshes) if (/hip bone/i.test(m.userData.name)) for (const v of worldVerts(m, 3)) hipB.expandByPoint(v);
  W.hipDrop = R.P0.y - hipB.min.y;
  W.sitP = new THREE.Vector3(CUSH[0].x, SEAT + 0.008 + W.hipDrop, -0.27);                          // the sitting bones rest on the cushion (leaning back takes the hips 6 mm lower)
  W.standP = new THREE.Vector3(STAND.x, R.P0.y, STAND.z);
  W.heelZ = { Right: R.legs.Right.heel.z, Left: R.legs.Left.heel.z };
  // ---- the set
  W.sofa = makeSofa(scene); W.table = makeTable(scene); W.python = makePython(scene); W.dog = makeDog(scene); W.street = makeStreet(scene);
  W.med = makeMedicine(scene); W.med.g.position.set(KC.x + 0.08, KC.top, KC.z + 0.32); W.med.g.rotation.y = Math.PI / 2;
  W.dial = makeDial(scene, new THREE.Vector3(KC.x + 0.1, KC.top, KC.z - 0.32));
  W.dishes = [0, 1, 2].map((i) => { const p = makePlate(); p.position.set(KC.x + 0.05, KC.top + i * 0.016, KC.z + 0.02); p.rotation.y = 0.5 * i; scene.add(p); return p; });
  W.plates = [0, 1, 2].map(() => { const p = makePlate(); scene.add(p); return p; });
  W.slab30 = makeSlab(3); scene.add(W.slab30); W.slabs = [0, 1, 2].map(() => { const s = makeSlab(1); scene.add(s); return s; });
  W.line = makeLine(scene); W.ghost = makeLine(scene, { r: 0.0026, color: 0x9a9ea6, gain: 1.0, opacity: 0.75 });
  W.baseB = makeLine(scene, { r: 0.0016, color: 0x8d9097, gain: 1.0, opacity: 0.7 });
  W.dashes = makeDashes(scene, GC.z0, GC.z1, GC.low, GC.x);
  W.leash = makeLine(scene, { r: 0.0042, color: 0x6e2a22, gain: 1, opacity: 1 }); W.leash.m.material = new THREE.MeshPhysicalMaterial({ color: 0x6e2a22, roughness: 0.6 }); W.leash.m.renderOrder = 0; W.leash.m.castShadow = true;
  // ---- light
  W.key = spot(scene, { color: 0xffe9d2, pos: new THREE.Vector3(-1.6, 2.7, 2.0), target: new THREE.Vector3(-0.2, 0.7, 0.0), angle: 0.5, penumbra: 0.8, shadow: true, size: cfg.shadow ?? 1024 });
  W.key.shadow.camera.far = 8;
  W.rim = spot(scene, { color: 0xa9c4ff, pos: new THREE.Vector3(1.2, 2.3, -1.9), target: new THREE.Vector3(0, 0.8, 0), angle: 0.55, penumbra: 0.9 });
  W.fill = spot(scene, { color: 0xc8d6ff, pos: new THREE.Vector3(1.9, 1.3, 1.6), target: new THREE.Vector3(0, 0.7, 0), angle: 0.6, penumbra: 1 });
  W.tableLight = spot(scene, { color: 0xfff1d8, pos: new THREE.Vector3(CT.x + 0.6, 2.0, CT.z + 0.9), target: new THREE.Vector3(CT.x, CT.top, CT.z), angle: 0.32, penumbra: 0.75 });
  W.pyLight = spot(scene, { color: 0xffe9d2, pos: new THREE.Vector3(0.2, 1.7, 1.2), target: new THREE.Vector3(0.55, 0.5, -0.3), angle: 0.35, penumbra: 0.8 });
  W.auditSolids = [['sofa', W.sofa.g], ['coffee table', W.table.g, { floor: false }], ['python', W.python.g], ['dog', W.dog.g], ['street', W.street.g], ['medicine', W.med.g], ['dial', W.dial.g],
    ['plates', W.plates[0]], ['plate 2', W.plates[1]], ['plate 3', W.plates[2]], ['dishes', W.dishes[0]]];
  // what the sound needs, in the picture's own times (exported as timing10.json)
  const steps = []; { let prev = sAt(WALK.t0); for (let t = WALK.t0; t <= WALK.t1; t += 0.002) { const s2 = sAt(t); if (Math.floor(s2 / (WALK.stride / 2)) > Math.floor(prev / (WALK.stride / 2))) steps.push(+t.toFixed(3)); prev = s2; } }
  const passAt = (z) => { for (let t = WALK.t0; t <= WALK.t1; t += 0.01) if ((W.standP.z + (W.heelZ.Right - 0.27 - R.P0.z) + sAt(t)) >= z) return +t.toFixed(2); return null; };
  W.timing = { launch: LAUNCH, spring: [LAUNCH[0], LAUNCH[0] + 0.12], touch: +T_TOUCH.toFixed(3), python: T.python, goat: T.goat, wiggle: [T.goat - 0.25, T.goat + 1.0],
    drawA: [T.dinner - 0.2, T.itself], platesIn: [T.in + 0.2, T.in + 0.9], slabUp: [T.thirty - 0.3, T.thirty + 0.3], split: [T.or + 0.3, T.ten + 1.0], morph: [26.6, 27.9], ghost: [28.0, 28.8],
    shrink1: [T.twelve, T.smaller + 0.3], shrink2: [T.twentytwo, T.smaller2 + 0.3], pulse: [T.same2 - 0.1, T.timing + 0.8], graphOut: [38.6, 39.3],
    platesSink: [44.7, 45.3], tableSink: [45.4, 46.4], lamps: [45.5, 47.5], dogRoll: DOGROLL, leashHop: LEASHHOP, walk: [WALK.t0, WALK.t1], steps,
    shopDoor: passAt(SHOPP.z - 0.47), shopWin: passAt(SHOPP.z + 0.22), counter: passAt(KC.z), wag: [T.dog - 0.2, T.dog + 1.4], kLight: [52.0, 54.0], camStop: [54.0, 54.8], push: [54.8, 56.6], street: [56.0, 57.5],
    medUp: [T.insulin - 0.6, T.insulin + 0.1], lineC: [T.drop - 1.2, T.doses + 0.6], dip: [T.drop - 0.3, T.low + 0.2], undip: [T.ask + 0.3, T.doctor + 0.3],
    dialUp: [T.final - 0.6, T.final + 0.3], needle: [T.final + 0.2, T.settings - 0.1], logo: T.logo };
  return { stamp: W.stampSpot, sitP: W.sitP.toArray().map((v) => +v.toFixed(3)), grip: W.leashGrip, P0: R.P0.toArray().map((v) => +v.toFixed(3)) };
}

// ------------------------------------------------------------------ the body over time: seated, launched, standing, walking
const LAUNCH = [7.88, 8.62];                                           // the cushion springs at "off"; the feet land
const T_TOUCH = LAUNCH[0] + (LAUNCH[1] - LAUNCH[0]) / 1.1;             // the feet touch down: the knees give, taking the fall's speed, then come back up
const landDip = (t) => { const u = t - T_TOUCH; return u > 0 ? -1.36 * u * Math.exp(-u / 0.07) : 0; };
const DOGROLL = [46.0, 46.9], LEASHHOP = [46.55, 47.1];                // the toy dog rolls up; the leash's handle hops into the hand
const WALK = { t0: 47.2, t1: 62.0, d: 14.3, ramp: 1.1, stride: 1.2 };
const STACK = [49.0, 51.5];                                            // the plates stack themselves into dirty dishes (nobody is looking)
const ARM_REST = { dir: [0.12, -0.97, 0.12], twist: 0.6, elbow: 1.25 };   // seated, leaning back: hands in the lap
const ARM_FLAIL = { dir: [0.86, 0.4, 0.3], twist: 0.2, elbow: 0.55 };    // launched: arms flung out to the sides (not up into the words)
const ARM_TAKE = { dir: [0.4, -0.9, -0.08], twist: 0.2, elbow: 0.35 };   // the right hand goes out to the side, down toward the dog, for the leash
const _q = new THREE.Quaternion(), _v = new THREE.Vector3(), _v2 = new THREE.Vector3();
function easeDist(t, t0, t1, d, ramp) {
  const TT = t1 - t0, v = d / (TT - ramp), u = clamp01((t - t0) / TT) * TT;
  if (u < ramp) return (v * u * u) / (2 * ramp);
  if (u > TT - ramp) { const r = TT - u; return d - (v * r * r) / (2 * ramp); }
  return v * (u - ramp / 2);
}
let Z0 = 0;                                                            // set once the rig exists: the right heel strikes where it stood
const S0 = () => 0.25 * WALK.stride;                                   // the walk starts with the right foot flat under the body, the left swinging past it
const sAt = (t) => S0() + easeDist(t, WALK.t0, WALK.t1, WALK.d, WALK.ramp);
function feetStand() {                                                 // both feet flat where the skeleton stands, in the rig's frame
  const R = W.rig, out = {};
  for (const Side of ['Right', 'Left']) out[Side] = { ankle: R.legs[Side].A.clone(), q: new THREE.Quaternion() };
  return out;
}
function poseBody(t) {
  const R = W.rig, launch = clamp01((t - LAUNCH[0]) / (LAUNCH[1] - LAUNCH[0])), seated = t < LAUNCH[0];
  const breath = Math.sin(t * 1.3) * 0.5 + 0.5;
  for (const Side of ['Right', 'Left']) setWrist(W.hand[Side].wr, { wf: 0.12 });
  if (seated || launch < 1) {
    // ---- seated, then launched: the body flies on an arc from the cushion to its feet, turning upright
    const a = s5(0, 1, launch), up = Math.sin(Math.PI * Math.min(1, launch * 1.1)) * 0.32, spring = springLift(t);
    R.pelvis.position.copy(R.P0); R.pelvis.rotation.set(0, 0, 0);
    const p = W.sitP.clone().lerp(W.standP, a); p.y += up + spring * (1 - a) + landDip(t);
    W.body.position.copy(p); W.body.rotation.set(-0.22 * (1 - s5(0, 0.45, launch)) + 0.12 * Math.sin(Math.PI * launch), 0, 0);
    bendSpine(R.seg, { lum: -0.04 * (1 - a), tho: (0.1 - 0.03 * breath) * (1 - a) + (0.04 + 0.01 * breath) * a, cer: 0.12 * (1 - a) + 0.02 * a });
    const fl = Math.sin(Math.PI * clamp01(launch * 1.25));
    for (const Side of ['Right', 'Left']) {
      const m1 = mixArm(ARM_REST, ARM_FLAIL, fl), m2 = a > 0.75 ? mixArm(m1, ARM0, s5(0.75, 1, a)) : m1; poseArm(R.arms[Side], m2); W.hand[Side].curl(lerp(0.25 + 0.3 * (1 - fl), 0.2, s5(0.6, 1, launch))); }
    W.body.updateMatrixWorld(true);
    for (const Side of ['Right', 'Left']) { const G = R.legs[Side];
      const seatT = new THREE.Vector3(W.sitP.x + G.s * 0.12, G.A.y - G.ground + 0.002, 0.14);                                // seated: feet on the floor in front
      const standT = new THREE.Vector3(W.standP.x + (G.A.x - R.P0.x), G.A.y, W.standP.z + (G.A.z - R.P0.z));
      const tgt = seatT.clone().lerp(standT, ss(0.0, 0.9, launch)); tgt.y += 0.3 * Math.sin(Math.PI * clamp01(launch / 0.9));   // the feet leave the floor at once and tuck (the thighs clear the cushion's front)
      legIK(R, Side, tgt, new THREE.Quaternion().setFromAxisAngle(X, -0.4 * Math.sin(Math.PI * clamp01(launch / 0.9))), Z); }
    clearArms(R); W.body.updateMatrixWorld(true);
    return { mode: 'seat', a };
  }
  // ---- standing, then walking
  W.body.position.copy(W.standP); W.body.rotation.set(0, 0, 0);
  const s = sAt(t), w = walkAt(R, s, { stride: WALK.stride, z0: Z0 });
  const k = 1 - ss(WALK.t0 - 0.1, WALK.t0 + 0.55, t);                                                       // 1: standing; 0: walking
  if (k > 0) { const st = feetStand(); const sp = R.P0.clone(); sp.y += landDip(t) - 0.006 * breath;
    w.pelvis.lerp(sp, k); w.pelvisRot.set(lerp(w.pelvisRot.x, 0, k), lerp(w.pelvisRot.y, 0, k), lerp(w.pelvisRot.z, 0, k));
    for (const Side of ['Right', 'Left']) { const a = w.feet[Side], b = st[Side], lift = a.stance ? 0 : 0.03 * Math.sin(Math.PI * k);
      a.ankle.lerp(b.ankle, k); a.ankle.y += lift; a.q.slerp(b.q, k); }
    w.armR = mixArm(w.armR, ARM0, k); w.armL = mixArm(w.armL, ARM0, k); w.twist *= 1 - k; }
  R.pelvis.position.copy(w.pelvis); R.pelvis.rotation.copy(w.pelvisRot);
  bendSpine(R.seg, { tho: 0.04 + 0.01 * breath, twist: w.twist, cer: 0.02 });
  // the right hand takes the leash, then swings with the walk holding it
  const take = pulse(t, LEASHHOP[0] - 0.3, WALK.t0 + 0.6, 0.35), hold = ss(LEASHHOP[1] - 0.12, LEASHHOP[1] + 0.05, t);
  let aR = { ...w.armR, wf: 0.1 }; if (take > 0) aR = mixArm(aR, ARM_TAKE, take * k);
  poseArm(R.arms.Right, aR); poseArm(R.arms.Left, { ...w.armL });
  const G = W.leashGrip; if (hold > 0 && G) gripCurl(W.hand.Right, G, hold, 0.2); else W.hand.Right.curl(0.2);
  W.hand.Left.curl(0.2);
  clearArms(R);
  W.body.updateMatrixWorld(true);
  const off = _v.set(W.standP.x - R.P0.x, 0, W.standP.z - R.P0.z);                                     // the gait is worked out in the rig's frame; the body stands elsewhere
  for (const Side of ['Right', 'Left']) legIK(R, Side, w.feet[Side].ankle.clone().add(off), w.feet[Side].q);
  R.root.updateMatrixWorld(true);
  return { mode: 'walk', s, k };
}
// the left cushion: it springs up on its coil at "off", flings the skeleton, then bounces down and settles
function springLift(t) { const u = t - LAUNCH[0]; if (u < 0) return 0; if (u < 0.12) return 0.22 * s5(0, 0.12, u); return 0.22 * Math.exp(-(u - 0.12) * 3.2) * Math.cos((u - 0.12) * 11); }

// ------------------------------------------------------------------ the camera: one path, no cuts
let CAM = null;
function buildCam() {
  const D = W.dial.g.position;
  return camTrack([
    { t: -3.0, p: V3(-0.6, 1.1, 2.35), l: V3(-0.5, 1.05, -0.2), fov: 30 },
    { t: 0.6, p: V3(-0.66, 1.1, 2.75), l: V3(-0.52, 1.09, -0.2), fov: 30, tens: 0.3 },        // slumped on the sofa, the line rising over it
    { t: 6.6, p: V3(-1.07, 1.1, 2.92), l: V3(-0.523, 1.096, -0.2), fov: 30, tens: 0.3 },
    { t: 6.95, p: V3(-1.075, 1.1, 2.93), l: V3(-0.52, 1.1, -0.19), fov: 30, stop: true },
    // "let's get you off that sofa": the camera pulls back and up, so the launch happens in the frame, under the words
    { t: 8.25, p: V3(-1.195, 2.478, 4.415), l: V3(-0.477, 1.371, 0.344), fov: 38, stop: true },   // on its feet, the whole of it
    { t: 12.2, p: V3(-1.18, 2.46, 4.39), l: V3(-0.48, 1.37, 0.35), fov: 38, stop: true },
    { t: 13.9, p: V3(-0.044, 1.456, 1.669), l: V3(0.671, 0.695, -0.296), fov: 30, stop: true },  // the python and its goat
    { t: 16.2, p: V3(-0.03, 1.44, 1.64), l: V3(0.671, 0.695, -0.296), fov: 30, stop: true },
    // the day on the coffee table: labels, plates and walking blocks all inside the safe area (left of the button column)
    { t: 17.4, p: V3(0.716, 1.668, 2.53), l: V3(0.562, 0.472, 0.763), fov: 30, stop: true },
    { t: 27.0, p: V3(0.713, 1.655, 2.51), l: V3(0.562, 0.472, 0.763), fov: 30, stop: true },
    { t: 28.2, p: V3(0.171, 1.257, 1.68), l: V3(0.616, 0.981, 0.458), fov: 30, stop: true },      // the rise after eating
    { t: 38.5, p: V3(0.18, 1.25, 1.665), l: V3(0.616, 0.981, 0.458), fov: 30, stop: true },
    { t: 39.6, p: V3(0.716, 1.668, 2.53), l: V3(0.562, 0.472, 0.763), fov: 30, stop: true },      // same walk, better timing
    { t: 44.2, p: V3(0.713, 1.655, 2.51), l: V3(0.562, 0.472, 0.763), fov: 30, stop: true },
    // from the side, far enough that the whole skeleton fits between the captions and the bottom fifth: the dog wants a walk
    { t: 45.6, p: V3(4.6, 1.3, 0.66), l: V3(-0.6, 1.17, 0.42), fov: 40, stop: true },
    { t: 46.8, p: V3(4.6, 1.3, 0.69), l: V3(-0.6, 1.17, 0.44), fov: 40, stop: true },
    // (47.0 to 54.8: tracking alongside the walk, see camPose; it slows to a stop at the counter and the walker walks on)
    { t: 54.8, p: V3(4.6, 1.3, 7.45), l: V3(-1.45, 0.98, 7.2), fov: 40, stop: true },               // the dishes will wait
    { t: 56.6, p: V3(0.992, 1.85, 7.929), l: V3(-1.438, 1.223, 7.278), fov: 30, stop: true },       // they always do; then the medicine, too low
    { t: 67.4, p: V3(0.96, 1.84, 7.915), l: V3(-1.438, 1.223, 7.278), fov: 30, stop: true },
    { t: 68.9, p: V3(-0.893, 1.541, 7.047), l: V3(-1.372, 0.933, 6.873), fov: 30 },                 // the dial
    { t: T.logo, p: V3(D.x, D.y + 0.72, D.z + 0.005), l: V3(D.x, D.y + 0.0142, D.z), fov: 30, stop: true },   // straight down on the dial: the logo
  ]);
}
const pzAt = (t) => (W.standP ? W.standP.z : 0.45) + Z0 + sAt(t);                 // the pelvis's z on the walk
const TRACK = [47.0, 48.0, 54.0, 54.8];                                // in, held, out (the camera slows to a stop; the walker walks on)
const trackZ = (t) => pzAt(t) - 0.35 * ss(47.6, 49.0, t);             // between the walker and the dog that follows it
function trackPose(t) { const z = trackZ(t); return { p: [4.6, 1.3, z + 0.25], l: [-0.5, 1.17, z], fov: 40 }; }
const trackW = (t) => ss(TRACK[0], TRACK[1], t) * (1 - ss(TRACK[2], TRACK[3], t));
function camPose(S, t) {
  const v = S.cfg.view; if (v && typeof v === 'object') return v;
  if (!CAM) CAM = buildCam();
  const w = trackW(t);
  if (w > 0) { const A = CAM(t), B = trackPose(t), m = (a, b) => a.map((x, i) => lerp(x, b[i], w)); return { p: m(A.p, B.p), l: m(A.l, B.l), fov: lerp(A.fov ?? 30, B.fov, w) }; }
  if (t <= T.logo) return CAM(t);
  const Q = CAM(T.logo), k = ss(T.logo, T.end, t); return { p: [Q.p[0], lerp(Q.p[1], Q.p[1] - 0.04, k), Q.p[2]], l: Q.l, fov: 30 };
}
function focusAt(S, t, P) {   // on the walk, focus on the skeleton itself, not on where the camera points
  const d = Math.hypot(P.p[0] - P.l[0], P.p[1] - P.l[1], P.p[2] - P.l[2]); if (t < 46.0 || t > 54.8 || !W.rig) return d;
  W.rig.pelvis.getWorldPosition(_v2); const k = ss(46.0, 46.6, t) * (1 - ss(54.0, 54.8, t)); return lerp(d, Math.hypot(P.p[0] - _v2.x, P.p[1] - _v2.y, P.p[2] - _v2.z), k); }

// ------------------------------------------------------------------ one moment of the film
const PLATE_AT = [-0.3, 0.0, 0.3];                                     // along the table (z, from its centre): breakfast, lunch, dinner
const PLATE_X = CT.x - 0.06, SLAB_X = CT.x + 0.135;                   // the plates down the middle, the walking blocks beside them
function update(S, t) {
  const scene = S.scene, endDark = ss(T.final + 0.3, T.logo - 0.3, t);
  if (Z0 === 0 && W.rig) Z0 = W.heelZ.Right - 0.27 - W.rig.P0.z;     // the right heel's first strike is where it stands
  const o = poseBody(t);
  // ---- the sofa's spring
  { const sl = springLift(t), C = W.sofa.seats[0]; C.p.position.y = 0.3 + Math.max(0, sl); C.p.rotation.x = 0.06 * Math.sin((t - LAUNCH[0]) * 9) * Math.exp(-Math.max(0, t - LAUNCH[0] - 0.12) * 3.5) * (t > LAUNCH[0] ? 1 : 0);
    W.sofa.coil.visible = sl > 0.004; W.sofa.coil.scale.y = Math.max(0.001, sl + 0.0); W.sofa.coil.position.y = 0.3; }
  // ---- the python breathes slowly; its lump shifts a little (digesting); it goes dim while the coffee table is the subject
  { const P = W.python, dim = 1 - 0.7 * ss(16.8, 17.6, t) * (1 - ss(44.3, 45.2, t));
    P.plush.color.setScalar(dim); P.plush.sheenColor.copy(P.sheen0).multiplyScalar(dim); P.hornM.color.copy(P.horn0).multiplyScalar(dim); P.horns.position.y = P.horns.userData.y0 + 0.003 * Math.sin(t * 0.9);
    const wig = pulse(t, T.goat - 0.25, T.goat + 1.0, 0.2); P.horns.rotation.z = 0.25 * Math.sin(t * 22) * wig; }
  // ---- the plates: the dinner plate is there from the start; breakfast and lunch slide in for the study; later they stack themselves
  { const inK = s5(T.in + 0.2, T.in + 0.9, t), st = 0, away = s5(44.7, 45.3, t);
    W.plates.forEach((p, i) => { const home = new THREE.Vector3(PLATE_X, CT.top, CT.z + PLATE_AT[i]);
      const from = i === 2 ? home.clone() : new THREE.Vector3(CT.x - 0.5, CT.top, CT.z + PLATE_AT[i]);
      const pos = i === 2 ? home.clone() : from.clone().lerp(home, inK); pos.y += i === 2 ? 0 : -0.002 * (1 - inK);
      const stackAt = new THREE.Vector3(PLATE_X + 0.03, CT.top + (2 - i) * 0.016, CT.z + 0.3);                   // a stack at the near end: dinner at the bottom
      const sk = i === 2 ? st : s5(STACK[0] + 0.3 * (2 - i), STACK[1] - 0.2 * i, t);
      p.position.copy(pos.lerp(stackAt, sk)); p.position.y += 0.05 * Math.sin(Math.PI * sk); p.rotation.set(0.06 * Math.sin(Math.PI * sk), 0.4 * i, 0);
      p.position.y -= 0.03 * away; p.visible = (i === 2 || inK > 0.001) && away < 0.999; }); }
  // ---- the walking: one 30-minute block, then three 10-minute blocks, one after each meal
  { const tdrop = s5(45.4, 46.4, t); W.table.g.position.y = -(CT.top + 0.02) * tdrop; W.table.g.visible = tdrop < 0.999; }
  { const up = s5(T.thirty - 0.3, T.thirty + 0.3, t) * (1 - s5(T.or + 0.25, T.or + 0.3, t)), split = s5(T.or + 0.3, T.ten + 1.0, t), gone = 1 - s5(44.7, 45.3, t);
    W.slab30.position.set(SLAB_X, CT.top + SLAB.h / 2 - 0.03 * (1 - up), CT.z); W.slab30.visible = up > 0.002;
    const pul = pulse(t, T.same2 - 0.1, T.timing + 0.8, 0.25) * (0.5 + 0.5 * Math.sin((t - T.same2) * 9));
    W.slabs.forEach((m, i) => { const a = new THREE.Vector3(SLAB_X, CT.top + SLAB.h / 2, CT.z + (i - 1) * SLAB.l), b = new THREE.Vector3(SLAB_X, CT.top + SLAB.h / 2, CT.z + PLATE_AT[i] + 0.06);
      m.position.copy(a.lerp(b, s5(0.15 * i, 0.7 + 0.15 * i, split))); m.position.y -= 0.03 * (1 - gone); m.visible = split > 0.001 && gone > 0.002;
      m.material.emissiveIntensity = 0.15 + 0.5 * pul; }); }
  // ---- the blood-sugar line
  { const A = pulse(t, T.dinner - 0.3, 26.9, 0.5), mv = s5(26.6, 27.9, t), B = ss(26.6, 27.6, t) * (1 - ss(38.6, 39.3, t)), C = pulse(t, T.drop - 1.2, T.doses + 0.6, 0.5);
    const line = (f) => [...Array(LINE_N + 1).keys()].map((i) => f(i / LINE_N));
    if (C > 0.002) W.line.set(line((u) => shapeC(u, t)), C);
    else if (t < 27.9) W.line.set(line((u) => shapeA(u, t).lerp(shapeB(u, 1), mv)), Math.max(A, B));
    else W.line.set(line((u) => shapeB(u, fB(t))), B);
    const g = ss(28.0, 28.8, t) * (1 - ss(38.6, 39.3, t));
    W.ghost.set(line((u) => shapeB(u, 1).add(_v.set(0, 0, -0.004))), g);
    W.baseB.set([shapeB(-0.03, 0).add(_v.set(0, 0, -0.004)), shapeB(1.03, 0).add(_v2.set(0, 0, -0.004))], g);
    W.dashes.mat.opacity = 0.8 * C; }
  // ---- the toy dog: it waits by the sofa, rolls up beside the skeleton, then follows on its leash
  { const D = W.dog, R = W.rig; R.pelvis.getWorldPosition(_v);
    const side = new THREE.Vector3(STAND.x - 0.42, 0, STAND.z - 0.12), roll = s5(DOGROLL[0], DOGROLL[1], t);
    let pos = DOG0.clone().lerp(side, roll), yaw = lerp(Math.PI / 2 * 0.6, 0, roll);
    if (t > WALK.t0) { const z = Math.max(side.z, _v.z - 0.85), wob = ss(WALK.t0, WALK.t0 + 0.8, t); pos.set(_v.x - 0.42 + 0.02 * Math.sin(t * 5) * wob, 0, z); yaw = 0.05 * Math.sin(t * 2.3) * wob; }
    D.g.position.copy(pos); D.g.rotation.y = yaw;
    const dist = pos.z + pos.x * 0.3; D.wheels.forEach((w) => { w.rotation.x = dist / 0.035; });
    const wag = pulse(t, T.dog - 0.2, T.dog + 1.4, 0.2), happy = 0.25 + 0.75 * wag;
    D.tail.rotation.z = Math.sin(t * 16) * 0.45 * happy; D.ears.forEach((e, i) => { e.rotation.x = 0.25 * Math.sin(t * 9 + i) * happy * (t > DOGROLL[0] ? 1 : 0.2); });
    // the leash: from the collar to the hand (or, before the hop, lying on the floor in front of the dog)
    const ring = D.g.localToWorld(D.ring.clone()), H = W.hand.Right, hand = H.eg.localToWorld(H.handle.clone());
    const restEnd = DOG0.clone().add(new THREE.Vector3(0.18, 0.006, 0.12)), hop = s5(LEASHHOP[0], LEASHHOP[1], t);
    const end = t < LEASHHOP[0] ? restEnd : restEnd.clone().lerp(hand, hop); end.y += 0.25 * Math.sin(Math.PI * hop) * (t < LEASHHOP[1] ? 1 : 0);
    const mid = ring.clone().lerp(end, 0.5); const sag = t < LEASHHOP[0] ? 0 : 0.12 * (0.6 + 0.4 * Math.sin(t * 3.1)); mid.y = Math.max(0.006, mid.y - sag);
    const pts = []; for (let i = 0; i <= 24; i++) { const u = i / 24; pts.push(new THREE.Vector3().copy(ring).multiplyScalar((1 - u) * (1 - u)).addScaledVector(mid, 2 * u * (1 - u)).addScaledVector(end, u * u)); }
    if (t < LEASHHOP[0]) for (const p of pts) p.y = Math.max(p.y, 0.006);
    W.leash.set(pts, 1); }
  // ---- the medicine, the dial
  { const up = s5(T.insulin - 0.6, T.insulin + 0.1, t); W.med.g.visible = up > 0.001; W.med.g.position.y = KC.top - 0.17 * (1 - up); }
  { const D = W.dial, up = s5(T.final - 0.6, T.final + 0.3, t); D.g.position.y = KC.top - 0.03 * (1 - up); D.g.visible = up > 0.001;
    const v = lerp(0, 10, s5(T.final + 0.2, T.settings - 0.1, t)); D.n.rotation.y = -ANG(v); D.nmat.opacity = 1 - ss(T.logo - 0.6, T.logo - 0.2, t);
    D.setM.material.opacity = ss(T.settings - 0.2, T.settings + 0.3, t) * (1 - ss(T.logo - 0.6, T.logo - 0.2, t)); D.faceMat.opacity = 1 - 0.85 * ss(T.settings, T.logo - 0.2, t);
    const logoK = s5(T.final + 0.4, T.logo - 0.25, t); D.logo.set({ weight: logoK, white: logoK, hours: 0, hand: ss(T.logo - 0.4, T.logo - 0.15, t), handScale: outBack(clamp01((t - (T.logo - 0.4)) / 0.35), 1.8) }); }
  // ---- light
  const fig = 1 - endDark, street = ss(45.5, 47.5, t) * (1 - ss(56.0, 57.5, t));
  const onTable = ss(16.6, 17.6, t) * (1 - ss(44.4, 45.4, t)) + ss(54.6, 55.4, t) * (1 - ss(67.6, 68.6, t));
  const graph = ss(27.4, 28.3, t) * (1 - ss(38.5, 39.4, t));                                        // the rise after eating, over the dark
  W.key.intensity = 16 * fig * (1 - 0.88 * onTable) * (1 - 0.7 * graph); W.rim.intensity = 3.0 * fig * (1 - 0.7 * onTable) * (1 - 0.7 * graph); W.fill.intensity = 1.0 * fig * (1 - 0.5 * onTable) * (1 - 0.6 * graph);
  W.tableLight.intensity = (2.2 + 1.6 * ss(16.0, 17.2, t)) * fig; W.pyLight.intensity = 3.5 * pulse(t, 12.0, 16.8, 0.6) * fig;
  W.street.lights.forEach((L, i) => { const last = i === W.street.lights.length - 1; L.intensity = last ? 5 * ss(52.0, 54.0, t) * fig : (i < LAMPS.length ? 15 : 9) * (0.25 + 0.75 * street) * fig; });
  S.tableMat.color.setScalar(0.32 * (1 - endDark * 0.9)); scene.environmentIntensity = 0.12 * (1 - endDark); S.reflAmt = 0.6 * (1 - endDark);
}

// ------------------------------------------------------------------ the words on screen
const CAPS = [
  { t0: T.you, t1: 2.9, top: 292, size: 82, html: 'You go straight from the<br>dinner table to the <em>sofa</em>,' },
  { t0: T.and, t1: 6.8, top: 292, size: 86, html: 'and your blood sugar<br>gets the <em>whole evening</em><br>to itself.' },
  { t0: T.lets, t1: 9.2, top: 300, size: 92, html: 'Let’s get you<br><em>off that sofa</em>.' },
  { t0: T.your2, t1: 11.0, top: 300, size: 92, html: 'Your body was built<br>to <em>walk</em>,' },
  { t0: T.not, t1: 16.2, top: 292, size: 84, html: 'not to lie on the sofa<br>after dinner like a <em>python</em><br><em>digesting a goat</em>.' },
  { t0: T.in, t1: 19.7, top: 292, size: 86, html: 'In a study of <em>41 adults</em><br>with type 2 diabetes,' },
  { t0: T.everyone, t1: 22.2, top: 300, size: 92, html: 'everyone walked<br><em>30 minutes a day</em>,' },
  { t0: T.either, t1: 27.2, top: 292, size: 86, html: 'either <em>in one go</em><br>or as <em>10 minutes</em><br>after each main meal.' },
  { t0: T.with, t1: 32.2, top: 280, size: 82, html: 'With the <em>same 30 minutes</em>,<br>walking after meals<br>made the rise in their<br>blood sugar' },
  { t0: T.eating - 0.4, t1: 34.9, top: 300, size: 92, html: 'after eating about<br><em>12% smaller</em>,' },
  { t0: T.and2, t1: 38.6, top: 300, size: 92, html: 'and after dinner,<br><em>22% smaller</em>.' },
  { t0: T.it, t1: 41.7, top: 300, size: 92, html: 'It was the same walk,<br>with <em>better timing</em>.' },
  { t0: T.these, t1: 46.1, top: 292, size: 86, html: 'These are <em>short studies</em>,<br>so call it a good habit,<br>not a <em>cure</em>.' },
  { t0: T.so, t1: 50.45, top: 292, size: 78, html: 'So after your main meals,<br>especially <em>dinner</em>, walk<br>for about <em>10 minutes</em>:' },
  { t0: T.around, t1: 54.0, top: 292, size: 86, html: 'around the block,<br>to the shop,<br>or <em>with the dog</em>.' },
  { t0: T.the, t1: 57.0, top: 300, size: 92, html: 'The dishes will <em>wait</em>.<br>They always do.' },
  { t0: T.if, t1: 60.6, top: 292, size: 86, html: 'If you take <em>insulin</em><br>or another diabetes<br>medicine' },
  { t0: 60.69, t1: 63.4, top: 292, size: 82, html: 'that can make your<br>blood sugar drop <em>too low</em>,' },
  { t0: T.ask, t1: 68.1, top: 292, size: 86, html: 'ask your <em>doctor</em><br>how extra walking<br>fits with your doses.' },
  { t0: T.final, t1: 99, top: 360, size: 92, html: 'Let’s get you back to<br><em>factory settings.</em>' },
];
const OVL = {};
function overlayInit(S) {
  const O = S.O, tag = (cls, txt2, size, bsize) => { const e = O.tag(cls, txt2); e.style.fontSize = size + 'px'; const b = e.querySelector('b'); if (b && bsize) b.style.fontSize = bsize + 'px'; return e; };
  OVL.sugar = tag('tag', 'Blood sugar<b>after dinner</b>', 22, 38);
  OVL.meals = ['Breakfast', 'Lunch', 'Dinner'].map((s) => tag('tag', s, 26));
  OVL.h1 = tag('tag', 'After meals<b>12% smaller</b>', 22, 40); OVL.h2 = tag('tag', 'After dinner<b>22% smaller</b>', 22, 40);
  OVL.low = tag('tag', 'Too low', 22);
}
function overlay(S, t) {
  const pl = (k) => new THREE.Vector3(PLATE_X, CT.top, CT.z + PLATE_AT[k]);
  place(S, OVL.sugar, shapeA(0.1, 99), -46, 30, pulse(t, T.blood - 0.2, 6.6));
  OVL.meals.forEach((e, k) => place(S, e, pl(k).add(_v.set(-PLATE_R - 0.01, 0, 0)), -150, -14, pulse(t, T.in + 0.6, T.with - 0.2)));
  place(S, OVL.h1, shapeB(0.66, 1), 10, -150, pulse(t, T.twelve - 0.2, T.and2 + 0.1));
  place(S, OVL.h2, shapeB(0.66, 1), 10, -150, pulse(t, T.twentytwo - 0.2, T.it - 0.2));
  place(S, OVL.low, new THREE.Vector3(GC.x, GC.low, GC.z0), -10, 10, pulse(t, T.drop - 0.4, T.doctor + 0.4));
  const c = W.dial.g.position.clone(); c.y = KC.top + 0.0142;
  logoEnd(S, t, { t0: T.logo, center: c, edge: c.clone().add(new THREE.Vector3(0, 0, LOGO_R)) });
}

makeFilm({
  T, caps: CAPS, subs: [], build, update, pose: camPose, overlay, overlayInit, focus: focusAt,
  // the camera rides with the walker: blur relative to it (the weight is held for the whole frame, so the ramps add no false motion)
  carrier: (S, t) => [0, 0, trackW(Math.round(t * 24) / 24) * trackZ(t)],
  stage: { bg: 0x07080a, reflSize: 16, env: 0.12, far: 40 },
  aperture: [[0, 0.003], [6.95, 0.0025], [8.25, 0.0015], [13.9, 0.003], [17.4, 0.0025], [28.2, 0.003], [45.6, 0.0012], [54.8, 0.0015], [56.6, 0.0028], [68.9, 0.003]],
  bloom: [[0, 0.45], [68, 0.55]],
  fast: [[6.9, 8.4, 2], [12.1, 14.0, 2], [16.1, 17.5, 2], [26.9, 28.3, 2], [38.4, 39.7, 2], [44.1, 45.7, 2], [46.8, 48.2, 2], [53.9, 56.7, 2], [67.3, 69.0, 2]],
});

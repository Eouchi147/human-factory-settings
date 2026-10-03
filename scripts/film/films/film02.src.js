// Human Factory Settings · Film 2 "How do I fix my posture?" (new direction, 3 Oct 2026) · one continuous shot, 9:16.
// On the wall, a cross-stitch in an embroidery hoop: SIT UP STRAIGHT, love Mum. A skeleton slumps in an office chair at a
// desk, scrolling. On "sit up straight" it snaps upright like a soldier; on "she was guessing" it melts back. Its spine
// lights up and it runs through a run of positions, then freezes into one perfect pose and turns to stone. The case file on
// the desk, THE SLOUCH: a rubber stamp slams NO EVIDENCE, then ALIBI CONFIRMED. Two lower-back curves, with and without
// back pain, slide together and match. Text neck: it looks down at the phone, a protractor measures the neck while the
// NECK PAIN gauge on the desk doesn't move. The warnings, plain, the camera slow. Then the plan: the phone goes down, chin
// tucks and shoulder squeezes, the wall clock jumps an hour, it stands up, stretches and sits back in a new position.
// The hoop becomes the logo. The factory stamp is on the back of the left shoulder blade.
import { THREE, ORANGE, AMBER, ss, s5, lerp, clamp01, hash, camTrack, phys, glowMat, shadows, spot, RoundedBoxGeometry,
  loadAnatomy, V3, place, logoEnd, makeFilm, outBack, stamp, stampCanvas, stampSpot, noiseTex, TIME, keys } from '../kit.js';
import { buildRig, skeletonKind, legIK, bendSpine, poseArm, worldVerts, avgV } from '../rig.js';
import { makeClock, makePhone, makeLamp, makeLogoRing, tickAngle } from '../props.js';

//@HANDS@

// ------------------------------------------------------------------ timing, from the voice guide (word starts)
const T = {
  end: 68.4, logo: 65.9,
  your: 0.35, mum: 0.79, told: 1.04, sit: 1.64, up: 1.69, straight: 1.91,
  with: 2.79, respect: 3.69, she: 4.04, guessing: 4.42,
  your2: 5.64, spine: 6.08, built: 6.69, move: 6.99, bend: 7.27, change: 7.92, position: 8.32, all: 9.01, not: 9.59, freeze: 10.18, perfect: 11.07, pose: 11.82,
  and1: 13.1, no: 13.8, solid: 13.99, evidence: 14.24, slouching: 14.93, causes: 15.4, back: 16.0, so: 16.49, slouch2: 17.49, alibi: 18.35,
  people: 19.76, with2: 20.29, dont: 21.03, different: 21.88, lower: 22.33, curve: 23.01,
  and2: 24.37, looking: 24.81, phone: 25.65, neck: 26.36, killer: 26.58, made: 27.18, because: 28.32, measured: 29.75, using: 30.7, phones: 31.38, neck2: 32.01, angle: 32.22, didnt: 32.63, predict: 33.05, neckpain: 33.73,
  if1: 35.1, legs: 38.98, numb2: 39.34, genitals: 40.64, or3: 42.05, bladder: 43.57, thats: 45.11, posture2: 45.7, emergency: 46.68, same: 48.65, chest: 50.43, or4: 51.12, accident: 52.64,
  for7: 54.23, everyone: 54.77, strengthen: 55.31, neckback: 55.86, upper: 56.33, getup: 57.1, once: 57.89, hour: 58.56, keep: 59.13, moving: 59.32, because2: 59.86, best: 60.51, next: 62.0,
  final: 63.64, factory: 64.85, settings: 65.22,
};

// ------------------------------------------------------------------ the set (metres). The skeleton faces -x, the desk in front of it, the back wall at -z.
const W = {}; window.HFS_W = W;
const SEAT = { x: 0.07, y: 0.47, z: 0, w: 0.46, d: 0.46 };
const DESK = { x0: -0.97, x1: -0.37, z0: -0.66, z1: 0.62, top: 0.74 };
const WALL_Z = -0.8, SIDE_X = -1.04;
const HOOP = { x: -0.5, y: 1.36, z: WALL_Z + 0.022, r: 0.135 };
const CLOCKW = { x: 0.46, y: 1.5, z: WALL_Z + 0.004, s: 2.1 };
const FILE = { x: -0.67, z: -0.2, ry: Math.PI / 2 + 0.12 }, STAMPP = { x: -0.52, z: 0.02 };
const GAUGE = { x: -0.55, z: 0.24 }, CURVE_OFF = 0.09;
const LAMPP = new THREE.Vector3(-0.86, DESK.top, -0.55);
const PHONE_DOWN = { p: new THREE.Vector3(-0.45, DESK.top + 0.001, 0.13), ry: -0.25 };
const X = new THREE.Vector3(1, 0, 0), Y = new THREE.Vector3(0, 1, 0), Z = new THREE.Vector3(0, 0, 1);
const FWD = new THREE.Vector3(-1, 0, 0);
const pulse = (t, a, b, r = 0.3) => ss(a, a + r, t) * (1 - ss(b - r, b, t));
// a mesh's vertices where they are now (posed), in the world
function posedVerts(m, step = 1) { m.updateMatrixWorld(true); const P = m.geometry.attributes.position, out = []; for (let i = 0; i < P.count; i += step) out.push(new THREE.Vector3().fromBufferAttribute(P, i).applyMatrix4(m.matrixWorld)); return out; }

function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h, c);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.userData.canvas = c; return t;
}
function txt(x, s, px, py, { font = '800 100px Archivo', color = '#fff', align = 'center', track = 0, base = 'middle', maxW } = {}) {
  x.font = font; x.letterSpacing = `${track}px`; x.fillStyle = color; x.textAlign = align; x.textBaseline = base;
  if (maxW) x.fillText(s, px, py, maxW); else x.fillText(s, px, py);
}
function stampTex(word, { w = 600, h = 170, color = '#c2312b', size = 92 } = {}) {
  return canvasTex(w, h, (x) => { x.clearRect(0, 0, w, h); x.strokeStyle = color; x.lineWidth = 10; x.beginPath(); x.roundRect(10, 10, w - 20, h - 20, 18); x.stroke();
    txt(x, word, w / 2, h / 2 + 4, { font: `900 ${size}px Archivo`, color, track: 6, maxW: w * 0.86 });
    x.globalCompositeOperation = 'destination-out'; for (let i = 0; i < 900; i++) { x.fillStyle = `rgba(0,0,0,${0.15 + 0.5 * hash(i * 7.3)})`; x.fillRect(hash(i) * w, hash(i * 3.1) * h, 1 + 3 * hash(i * 1.7), 1 + 2 * hash(i * 2.3)); } });
}

// ------------------------------------------------------------------ the room: floor, back wall, side wall behind the desk
function makeRoom(scene) {
  const plaster = (c) => phys({ color: c, roughness: 0.93, roughnessMap: noiseTex(11, 256, 0.85, 1.0, 26) });
  const back = new THREE.Mesh(new THREE.PlaneGeometry(6, 3.2), plaster(0x1d1f24)); back.position.set(0, 1.6, WALL_Z); back.receiveShadow = true; scene.add(back);
  const side = new THREE.Mesh(new THREE.PlaneGeometry(4, 3.2), plaster(0x1a1c21)); side.position.set(SIDE_X, 1.6, 0.6); side.rotation.y = Math.PI / 2; side.receiveShadow = true; scene.add(side);
  const skirt = new THREE.Mesh(new THREE.BoxGeometry(6, 0.08, 0.012), phys({ color: 0x121317, roughness: 0.6 })); skirt.position.set(0, 0.04, WALL_Z + 0.006); skirt.receiveShadow = true; scene.add(skirt);
}

// ------------------------------------------------------------------ the desk
function makeDesk(scene) {
  const g = new THREE.Group(); scene.add(g);
  const oak = phys({ color: 0x3a2a1c, roughness: 0.5, clearcoat: 0.35, clearcoatRoughness: 0.35, roughnessMap: noiseTex(4, 256, 0.8, 1.0, 22) });
  const steel = phys({ color: 0x15161a, roughness: 0.42, metalness: 0.6, clearcoat: 0.3 });
  const w = DESK.x1 - DESK.x0, d = DESK.z1 - DESK.z0, cx = (DESK.x0 + DESK.x1) / 2, cz = (DESK.z0 + DESK.z1) / 2;
  const top = new THREE.Mesh(new RoundedBoxGeometry(w, 0.032, d, 4, 0.006), oak); top.position.set(cx, DESK.top - 0.016, cz); g.add(top);
  for (const z of [DESK.z0 + 0.05, DESK.z1 - 0.05]) {
    const leg = new THREE.Mesh(new RoundedBoxGeometry(w - 0.08, 0.035, 0.035, 2, 0.006), steel); leg.position.set(cx, 0.0175, z); g.add(leg);
    for (const x of [DESK.x0 + 0.06, DESK.x1 - 0.06]) { const p = new THREE.Mesh(new RoundedBoxGeometry(0.035, DESK.top - 0.032, 0.035, 2, 0.006), steel); p.position.set(x, (DESK.top - 0.032) / 2, z); g.add(p); }
  }
  const bar = new THREE.Mesh(new RoundedBoxGeometry(0.025, 0.05, d - 0.1, 2, 0.006), steel); bar.position.set(DESK.x0 + 0.06, DESK.top - 0.06, cz); g.add(bar);
  shadows(g); g.traverse((o) => o.layers.enable(1));
  return g;
}

// ------------------------------------------------------------------ the office chair: five-star base, gas lift, seat, backrest that reclines
function makeChair(scene) {
  const g = new THREE.Group(); g.position.set(SEAT.x, 0, SEAT.z); scene.add(g);
  const black = phys({ color: 0x111215, roughness: 0.45, clearcoat: 0.4 }), chrome = new THREE.MeshPhysicalMaterial({ color: 0x9a9da3, metalness: 1, roughness: 0.25 });
  const fabric = phys({ color: 0x2b2f37, roughness: 0.95, sheen: 0.6, sheenColor: new THREE.Color(0x7c8496), sheenRoughness: 0.6, roughnessMap: noiseTex(9, 256, 0.82, 1.0, 40) });
  for (let k = 0; k < 5; k++) {
    const a = (k / 5) * Math.PI * 2 + 0.3, arm = new THREE.Mesh(new RoundedBoxGeometry(0.3, 0.03, 0.045, 2, 0.01), black);
    arm.position.set(Math.cos(a) * 0.15, 0.085, Math.sin(a) * 0.15); arm.rotation.y = -a; g.add(arm);
    const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.022, 0.012, 10, 20), black); wheel.position.set(Math.cos(a) * 0.29, 0.034, Math.sin(a) * 0.29); wheel.rotation.y = -a + Math.PI / 2; g.add(wheel);
  }
  const lift = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.026, SEAT.y - 0.16, 24), chrome); lift.position.y = 0.085 + (SEAT.y - 0.16) / 2; g.add(lift);
  const seat = new THREE.Mesh(new RoundedBoxGeometry(SEAT.d, 0.075, SEAT.w, 5, 0.03), fabric); seat.position.y = SEAT.y - 0.0375; g.add(seat);
  const pan = new THREE.Mesh(new RoundedBoxGeometry(SEAT.d - 0.04, 0.02, SEAT.w - 0.04, 2, 0.006), black); pan.position.y = SEAT.y - 0.085; g.add(pan);
  const back = new THREE.Group(); back.position.set(SEAT.d / 2 - 0.02, SEAT.y - 0.06, 0); g.add(back);   // the hinge, at the back of the seat
  const spine = new THREE.Mesh(new RoundedBoxGeometry(0.03, 0.26, 0.06, 2, 0.01), black); spine.position.set(0.035, 0.12, 0); back.add(spine);
  const rest = new THREE.Mesh(new RoundedBoxGeometry(0.06, 0.5, 0.44, 5, 0.03), fabric); rest.position.set(0.05, 0.47, 0); back.add(rest);
  shadows(g); g.traverse((o) => o.layers.enable(1));
  return { g, back };
}

// ------------------------------------------------------------------ the cross-stitch in its hoop: SIT UP STRAIGHT, love Mum (stitched from a pixel font)
function stitchCanvas() {
  const S = 1024, c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d');
  x.fillStyle = '#c9bc9f'; x.fillRect(0, 0, S, S);   // linen
  for (let i = 0; i < S; i += 4) { x.fillStyle = `rgba(90,70,40,${0.05 + 0.04 * hash(i * 0.37)})`; x.fillRect(i, 0, 1, S); x.fillRect(0, i, S, 1); }
  const grid = (lines, cell, y0, color, font) => {   // render the words small, read the pixels back, stitch an X for each one
    const m = document.createElement('canvas'), cols = Math.floor(S * 0.78 / cell), rows = lines.length * 11; m.width = cols; m.height = rows; const q = m.getContext('2d');
    q.fillStyle = '#000'; q.fillRect(0, 0, cols, rows); q.fillStyle = '#fff'; q.textAlign = 'center'; q.textBaseline = 'middle'; q.font = font;
    lines.forEach((l, i) => q.fillText(l, cols / 2, i * 11 + 5.5));
    const d = q.getImageData(0, 0, cols, rows).data, x0 = (S - cols * cell) / 2;
    x.strokeStyle = color; x.lineWidth = cell * 0.24; x.lineCap = 'round';
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) if (d[(j * cols + i) * 4] > 110) {
      const px = x0 + i * cell, py = y0 + j * cell, e = cell * 0.18;
      x.beginPath(); x.moveTo(px + e, py + e); x.lineTo(px + cell - e, py + cell - e); x.moveTo(px + cell - e, py + e); x.lineTo(px + e, py + cell - e); x.stroke();
    }
    return y0 + rows * cell;
  };
  let y = grid(['SIT UP', 'STRAIGHT'], 15, 250, '#b2241f', 'bold 10px monospace');
  // a small stitched heart, and "love, Mum" in a finer thread
  x.strokeStyle = '#b2241f'; x.lineWidth = 3.4;
  const heart = [[0, 1, 1, 0, 1, 1, 0], [1, 1, 1, 1, 1, 1, 1], [1, 1, 1, 1, 1, 1, 1], [0, 1, 1, 1, 1, 1, 0], [0, 0, 1, 1, 1, 0, 0], [0, 0, 0, 1, 0, 0, 0]];
  heart.forEach((r, j) => r.forEach((on, i) => { if (!on) return; const px = S / 2 - 3.5 * 13 + i * 13, py = y + 40 + j * 13, e = 2.4; x.beginPath(); x.moveTo(px + e, py + e); x.lineTo(px + 13 - e, py + 13 - e); x.moveTo(px + 13 - e, py + e); x.lineTo(px + e, py + 13 - e); x.stroke(); }));
  txt(x, 'love, Mum', S / 2, y + 170, { font: 'italic 400 76px "Instrument Serif"', color: '#5a4636' });
  // a border of running stitches
  x.setLineDash([16, 12]); x.strokeStyle = '#3f6b55'; x.lineWidth = 5; x.beginPath(); x.arc(S / 2, S / 2, S * 0.43, 0, Math.PI * 2); x.stroke(); x.setLineDash([]);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
function makeHoop(scene) {
  const g = new THREE.Group(); g.position.set(HOOP.x, HOOP.y, HOOP.z); scene.add(g);
  const wood = phys({ color: 0x9a7448, roughness: 0.55, clearcoat: 0.3, roughnessMap: noiseTex(7, 256, 0.8, 1.0, 14) });
  const outer = new THREE.Mesh(new THREE.TorusGeometry(HOOP.r + 0.008, 0.0075, 18, 160), wood); outer.position.z = 0.007; g.add(outer);
  const inner = new THREE.Mesh(new THREE.TorusGeometry(HOOP.r - 0.004, 0.0055, 14, 160), wood); inner.position.z = 0.003; g.add(inner);
  const clasp = new THREE.Mesh(new RoundedBoxGeometry(0.03, 0.022, 0.016, 2, 0.004), wood); clasp.position.set(0, HOOP.r + 0.014, 0.007); g.add(clasp);
  const screw = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.05, 16), new THREE.MeshPhysicalMaterial({ color: 0xc9a65a, metalness: 1, roughness: 0.3 }));
  screw.rotation.x = Math.PI / 2; screw.position.set(0, HOOP.r + 0.014, 0.012); g.add(screw);
  const clothMat = phys({ map: stitchCanvas(), roughness: 0.92, sheen: 0.4, sheenColor: new THREE.Color(0xfff2d8) });
  const cloth = new THREE.Mesh(new THREE.CircleGeometry(HOOP.r, 128), clothMat); cloth.position.z = 0.004; g.add(cloth);
  const nail = new THREE.Mesh(new THREE.CylinderGeometry(0.0025, 0.0025, 0.03, 12), new THREE.MeshPhysicalMaterial({ color: 0x888b90, metalness: 1, roughness: 0.4 }));
  nail.rotation.x = Math.PI / 2; nail.position.set(0, HOOP.r + 0.05, -0.005); g.add(nail);
  shadows(g); cloth.castShadow = false;
  const logo = makeLogoRing(HOOP.r - 0.012); logo.g.position.z = 0.0065; g.add(logo.g);
  return { g, clothMat, logo };
}

// ------------------------------------------------------------------ the case file, the ink pad and the rubber stamp
function makeCase(scene) {
  // a portrait folder, its top toward the back of the desk (-x), so it reads upright from over the skeleton's shoulder
  const g = new THREE.Group(); g.position.set(FILE.x, DESK.top, FILE.z); g.rotation.y = FILE.ry; scene.add(g);
  const cover = canvasTex(768, 1024, (x, w, h) => {
    x.fillStyle = '#c9a66b'; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 600; i++) { x.fillStyle = `rgba(60,40,10,${0.03 + 0.05 * hash(i * 1.9)})`; x.fillRect(hash(i) * w, hash(i * 2.7) * h, 2 + 4 * hash(i * 3.1), 1 + 2 * hash(i * 5.3)); }
    x.fillStyle = '#efe6d2'; x.fillRect(64, 70, w - 128, 180); x.strokeStyle = '#3a2d1c'; x.lineWidth = 4; x.strokeRect(64, 70, w - 128, 180);
    txt(x, 'CASE FILE', w / 2, 118, { font: '600 40px "Geist Mono"', color: '#5a4630', track: 12 });
    txt(x, 'THE SLOUCH', w / 2, 196, { font: '900 84px Archivo', color: '#231a10', track: 4, maxW: w - 170 });
    // a photo, paper-clipped: a slouched spine, drawn as on an X-ray
    x.save(); x.translate(w * 0.3, 470); x.rotate(-0.05); x.fillStyle = '#f4f1ea'; x.fillRect(-115, -145, 230, 290); x.fillStyle = '#16181c'; x.fillRect(-100, -130, 200, 240);
    x.strokeStyle = '#d9dde6'; x.lineWidth = 9; x.lineCap = 'round'; x.beginPath(); x.moveTo(30, 95); x.bezierCurveTo(60, 35, 40, -40, -20, -85); x.stroke();
    x.beginPath(); x.arc(-34, -97, 21, 0, Math.PI * 2); x.stroke(); x.restore();
    x.strokeStyle = '#8b8f97'; x.lineWidth = 6; x.beginPath(); x.roundRect(w * 0.3 - 20, 300, 40, 90, 18); x.stroke();
    x.fillStyle = 'rgba(40,30,15,0.65)'; for (let i = 0; i < 6; i++) x.fillRect(w * 0.56, 360 + i * 44, 270 - 40 * (i % 3), 12);
  });
  const fw = 0.23, fd = 0.31;
  const back = new THREE.Mesh(new RoundedBoxGeometry(fw, 0.004, fd, 2, 0.0015), phys({ color: 0xbf9a5c, roughness: 0.8 })); back.position.y = 0.002; g.add(back);
  const paper = new THREE.Mesh(new THREE.BoxGeometry(fw - 0.012, 0.003, fd - 0.02), phys({ color: 0xf0ebe0, roughness: 0.9 })); paper.position.set(0.003, 0.0055, 0.004); paper.rotation.y = -0.03; g.add(paper);
  const front = new THREE.Mesh(new THREE.PlaneGeometry(fw, fd), phys({ map: cover, roughness: 0.78 })); front.rotation.x = -Math.PI / 2; front.position.y = 0.0075; g.add(front);
  const tab = new THREE.Mesh(new RoundedBoxGeometry(0.08, 0.003, 0.03, 2, 0.001), phys({ color: 0xc9a66b, roughness: 0.8 })); tab.position.set(0.05, 0.006, -fd / 2 - 0.012); g.add(tab);
  const mk = (word, color, wpx, x, z, rot, size) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(wpx, wpx * 170 / 600), new THREE.MeshBasicMaterial({ map: stampTex(word, { color, size }), transparent: true, opacity: 0, depthWrite: false }));
    m.rotation.x = -Math.PI / 2; m.rotation.z = rot; m.position.set(x, 0.0082, z); m.renderOrder = 5; g.add(m); return m; };
  const P1 = { x: 0.0, z: 0.05, rot: 0.1 }, P2 = { x: 0.0, z: 0.106, rot: -0.08 };
  const s1 = mk('NO EVIDENCE', '#c2312b', 0.17, P1.x, P1.z, P1.rot, 84), s2 = mk('ALIBI CONFIRMED', '#1f7a4c', 0.19, P2.x, P2.z, P2.rot, 70);
  shadows(g); front.castShadow = false;
  // the ink pad and the rubber stamp
  const pad = new THREE.Group(); pad.position.set(STAMPP.x, DESK.top, STAMPP.z); pad.rotation.y = FILE.ry; scene.add(pad);
  const tin = new THREE.Mesh(new RoundedBoxGeometry(0.1, 0.014, 0.065, 3, 0.004), phys({ color: 0x1b1d22, roughness: 0.35, metalness: 0.5 })); tin.position.y = 0.007; pad.add(tin);
  const ink = new THREE.Mesh(new THREE.BoxGeometry(0.086, 0.002, 0.052), phys({ color: 0x5a1512, roughness: 0.6 })); ink.position.y = 0.0145; pad.add(ink);
  shadows(pad);
  const st = new THREE.Group(); scene.add(st);
  const woodM = phys({ color: 0x6b4a2c, roughness: 0.5, clearcoat: 0.4 });
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.02, 24, 16), woodM); knob.position.y = 0.088; st.add(knob);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.011, 0.06, 20), woodM); stem.position.y = 0.055; st.add(stem);
  const blk = new THREE.Mesh(new RoundedBoxGeometry(0.075, 0.022, 0.03, 2, 0.004), woodM); blk.position.y = 0.017; st.add(blk);
  const rub = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.006, 0.026), phys({ color: 0x7a1d18, roughness: 0.7 })); rub.position.y = 0.003; st.add(rub);
  shadows(st);
  // the stamp's path: off the pad, over the first spot, SLAM, back to the pad; again for the second
  g.updateMatrixWorld(true);
  const sp1 = g.localToWorld(new THREE.Vector3(P1.x, 0, P1.z)), sp2 = g.localToWorld(new THREE.Vector3(P2.x, 0, P2.z));
  const home = new THREE.Vector3(STAMPP.x, DESK.top + 0.0155, STAMPP.z), down = DESK.top + 0.009;
  const at = (p, h) => new THREE.Vector3(p.x, down + h, p.z), up = (p, h) => p.clone().add(new THREE.Vector3(0, h, 0));
  const y0 = FILE.ry, a1 = T.evidence - 0.05, a2 = T.alibi + 0.05;
  const K = [[-9, home, y0]];
  for (const [a, sp, rot] of [[a1, sp1, P1.rot], [a2, sp2, P2.rot]]) K.push(
    [a - 1.2, home, y0], [a - 1.0, up(home, 0.05), y0], [a - 0.45, at(sp, 0.12), y0 + rot], [a - 0.13, at(sp, 0.15), y0 + rot],
    [a, at(sp, 0), y0 + rot, 'in'], [a + 0.14, at(sp, 0), y0 + rot], [a + 0.45, at(sp, 0.1), y0 + rot], [a + 1.0, up(home, 0.04), y0], [a + 1.25, home, y0]);
  return { g, s1, s2, st, K, a1, a2 };
}
function stampAt(C, t) {
  const K = C.K; let i = 0; while (i + 1 < K.length && K[i + 1][0] <= t) i++;
  if (i + 1 >= K.length) return { p: K[i][1], yaw: K[i][2], h: 0 };
  const [t0, p0, y0] = K[i], [t1, p1, y1, ez] = K[i + 1], u = clamp01((t - t0) / (t1 - t0)), e = ez === 'in' ? u * u * u : s5(0, 1, u);
  const p = p0.clone().lerp(p1, e); return { p, yaw: lerp(y0, y1, e), h: Math.max(0, p.y - DESK.top - 0.016) };
}

// ------------------------------------------------------------------ the NECK PAIN gauge: a round dial on a small stand, its needle at almost nothing
function makeGauge(scene) {
  const g = new THREE.Group(); g.position.set(GAUGE.x, DESK.top, GAUGE.z); g.rotation.y = 0.18; scene.add(g);
  const black = phys({ color: 0x141519, roughness: 0.35, clearcoat: 0.6 });
  const foot = new THREE.Mesh(new RoundedBoxGeometry(0.11, 0.016, 0.07, 3, 0.005), black); foot.position.y = 0.008; g.add(foot);
  const head = new THREE.Group(); head.position.set(0, 0.105, 0); head.rotation.x = -0.18; g.add(head);
  const can = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.03, 96), black); can.rotation.x = Math.PI / 2; head.add(can);
  const strut = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.06, 0.02), black); strut.position.set(0, -0.06, -0.005); head.add(strut);
  const face = canvasTex(512, 512, (x, w) => {
    x.fillStyle = '#f2efe8'; x.beginPath(); x.arc(w / 2, w / 2, w / 2, 0, Math.PI * 2); x.fill();
    const c = w / 2, R = w * 0.4;
    for (let k = 0; k <= 10; k++) { const a = Math.PI * (0.75 + 1.5 * (k / 10)); x.strokeStyle = k >= 7 ? '#c2312b' : '#26282d'; x.lineWidth = k % 5 === 0 ? 7 : 4;
      x.beginPath(); x.moveTo(c + Math.cos(a) * R, c + Math.sin(a) * R); x.lineTo(c + Math.cos(a) * (R - (k % 5 === 0 ? 34 : 20)), c + Math.sin(a) * (R - (k % 5 === 0 ? 34 : 20))); x.stroke();
      if (k % 5 === 0) txt(x, String(k), c + Math.cos(a) * (R - 62), c + Math.sin(a) * (R - 62), { font: '700 40px Archivo', color: '#26282d' }); }
    txt(x, 'NECK PAIN', c, c + 110, { font: '600 34px "Geist Mono"', color: '#26282d', track: 6 });
  });
  const dial = new THREE.Mesh(new THREE.CircleGeometry(0.068, 96), phys({ map: face, roughness: 0.5 })); dial.position.z = 0.0152; head.add(dial);
  const needle = new THREE.Group(); needle.position.z = 0.017; head.add(needle);
  const bar = new THREE.Mesh(new THREE.BoxGeometry(0.0035, 0.055, 0.0012), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xc2312b) })); bar.position.y = 0.024; needle.add(bar);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.004, 24), black); hub.rotation.x = Math.PI / 2; hub.position.z = 0.002; needle.add(hub);
  const glass = new THREE.Mesh(new THREE.CircleGeometry(0.071, 96), phys({ color: 0x000000, roughness: 0.08, transparent: true, opacity: 0.18, depthWrite: false })); glass.position.z = 0.0175; head.add(glass);
  shadows(g); glass.castShadow = false;
  return { g, head, needle, value: (v) => -(Math.PI * (0.75 + 1.5 * v) - Math.PI * 1.5) };   // 0..1 -> needle angle about z (0 = straight up at 0.5)
}

// ------------------------------------------------------------------ the phone's feed (as in film 1)
const FEED_H = [520, 430, 610, 380, 560, 470], FEED_SUM = FEED_H.reduce((a, b) => a + b, 0);
const HUES = ['#e2795a', '#5aa0e2', '#c9a14a', '#7cc48a', '#b07ad9', '#e25a8c'];
function drawFeed(P, scroll) {
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
      const g = x.createLinearGradient(0, y + 110, 0, y + hh - 70); g.addColorStop(0, HUES[k % 6]); g.addColorStop(1, '#1b1e27');
      x.fillStyle = g; x.beginPath(); x.roundRect(40, y + 110, w - 80, hh - 190, 18); x.fill();
      x.fillStyle = '#2f3440'; x.fillRect(40, y + hh - 62, 300, 14);
    }
    y += hh; k++;
  }
  x.fillStyle = '#0c0e13'; x.fillRect(0, 0, w, 88);
  txt(x, '10:58', 58, 50, { font: '600 36px Archivo', color: '#eceef1', align: 'left' });
  P.feedTex.needsUpdate = true;
}

// ------------------------------------------------------------------ the protractor beside the neck (built later, at the neck's place)
function makeProtractor(scene, at, r) {
  const g = new THREE.Group(); g.position.copy(at); scene.add(g);
  const tex = canvasTex(1024, 1024, (x, w) => {
    x.clearRect(0, 0, w, w); const c = w / 2, R = w * 0.47;
    x.fillStyle = 'rgba(200,225,255,0.16)'; x.beginPath(); x.moveTo(c, c); x.arc(c, c, R, -Math.PI / 2, -Math.PI / 2 - Math.PI * 2 / 3, true); x.closePath(); x.fill();
    x.strokeStyle = 'rgba(235,242,255,0.9)'; x.lineWidth = 5; x.beginPath(); x.arc(c, c, R, -Math.PI / 2, -Math.PI / 2 - Math.PI * 2 / 3, true); x.stroke();
    for (let d = 0; d <= 120; d += 5) { const a = -Math.PI / 2 - (d * Math.PI) / 180, l = d % 15 === 0 ? 46 : 22; x.lineWidth = d % 15 === 0 ? 5 : 3;
      x.beginPath(); x.moveTo(c + Math.cos(a) * R, c + Math.sin(a) * R); x.lineTo(c + Math.cos(a) * (R - l), c + Math.sin(a) * (R - l)); x.stroke();
      if (d % 15 === 0 && d <= 60) txt(x, `${d}°`, c + Math.cos(a) * (R - 88), c + Math.sin(a) * (R - 88), { font: '600 40px "Geist Mono"', color: 'rgba(235,242,255,0.95)' }); }
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(2 * r / 0.94, 2 * r / 0.94), new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }));
  m.renderOrder = 8; g.add(m);
  const armMat = new THREE.MeshBasicMaterial({ color: ORANGE.clone().multiplyScalar(1.6), transparent: true, opacity: 0, depthWrite: false, toneMapped: false });
  const arm = new THREE.Group(); g.add(arm);
  const bar = new THREE.Mesh(new THREE.PlaneGeometry(0.0035, r * 1.02), armMat); bar.position.y = r * 0.51; arm.add(bar); bar.renderOrder = 9;
  const dot = new THREE.Mesh(new THREE.CircleGeometry(0.006, 24), armMat); dot.renderOrder = 9; g.add(dot);
  return { g, m, arm, armMat };
}

// ------------------------------------------------------------------ build
async function build(S, cfg) {
  const scene = S.scene;
  S.fog.near = 3.5; S.fog.far = 12;
  S.table.scale.set(3, 3, 1); S.tableMat.clearcoat = 0.15; S.tableMat.specularIntensity = 0.35;
  for (const m of [S.tableMat.map, S.tableMat.roughnessMap]) if (m) { m.wrapS = m.wrapT = THREE.RepeatWrapping; m.repeat.multiplyScalar(3); }
  // ---- the skeleton, rigged; the body group's origin is the hips' centre; it faces -x
  const meshes = await loadAnatomy(skeletonKind());
  const R = W.rig = buildRig(meshes);
  W.body = new THREE.Group(); scene.add(W.body); R.root.position.copy(R.P0).negate(); W.body.add(R.root);
  W.qBody = new THREE.Quaternion().setFromAxisAngle(Y, -Math.PI / 2);
  for (const m of meshes) { m.castShadow = true; m.receiveShadow = true; m.layers.enable(1); }
  W.meshes = meshes;
  W.spineMeshes = meshes.filter((m) => /vertebra|^axis$|^atlas$|sacrum|coccyx/i.test(m.userData.name));
  for (const m of W.spineMeshes) { m.material = m.material.clone(); m.material.emissive = new THREE.Color(ORANGE); m.material.emissiveIntensity = 0; }
  W.wristL = makeWrist(R, 'Left'); W.wristR = makeWrist(R, 'Right');
  W.handL = rigHand(R, 'Left', W.wristL); W.handR = rigHand(R, 'Right', W.wristR); W.handL.wr = W.wristL; W.handR.wr = W.wristR;
  // ---- the factory stamp: on the back of the left shoulder blade
  { const sc = R.byName.get('Left scapula'); if (sc) { sc.material = sc.material.clone();
      W.stampSpot = stampSpot(sc, { from: [0.0, 0.03, -0.12], dir: [0, 0, 1], spread: 0.004 });
      if (W.stampSpot) W.stamp = stamp(sc, { canvas: stampCanvas(['HUMAN FACTORY', 'SETTINGS'], '', { frame: false }), center: W.stampSpot.center, normal: W.stampSpot.normal, up: [0, 1, 0], width: 0.045, depth: 0.03, opacity: 0.6 }); } }
  W.mats = [...new Set(meshes.map((m) => m.material))]; W.col0 = W.mats.map((m) => m.color.clone()); W.rough0 = W.mats.map((m) => m.roughness ?? 0.5);
  W.sheen0 = W.mats.map((m) => m.sheen ?? 0); W.coat0 = W.mats.map((m) => m.clearcoat ?? 0);
  // ---- the set
  makeRoom(scene); makeDesk(scene); W.chair = makeChair(scene); W.hoop = makeHoop(scene); W.case = makeCase(scene); W.gauge = makeGauge(scene);
  W.clock = makeClock(); W.clock.g.position.set(CLOCKW.x, CLOCKW.y - W.clock.R * CLOCKW.s, CLOCKW.z); W.clock.g.scale.setScalar(CLOCKW.s); scene.add(W.clock.g);
  W.clock.body.rotation.x = 0; W.clock.g.traverse((o) => o.layers.enable(1));
  W.lamp = makeLamp(); W.lamp.g.position.copy(LAMPP); scene.add(W.lamp.g);
  W.lampLight = new THREE.PointLight(0xffc98a, 0, 2.6, 2); W.lampLight.position.copy(LAMPP).add(new THREE.Vector3(0, 0.27, 0)); scene.add(W.lampLight);
  W.phone = makePhone(); scene.add(W.phone.g); W.phone.g.traverse((o) => o.layers.enable(1));
  W.phone.feed = document.createElement('canvas'); W.phone.feed.width = 590; W.phone.feed.height = 1220;
  W.phone.feedTex = new THREE.CanvasTexture(W.phone.feed); W.phone.feedTex.colorSpace = THREE.SRGBColorSpace; W.phone.feedTex.anisotropy = 8;
  W.phone.screenMat.map = W.phone.feedTex; W.phone.screenMat.needsUpdate = true; drawFeed(W.phone, 0);
  // ---- sitting: where the hips sit on the seat, how high the ankles stand
  { const hipB = new THREE.Box3(); for (const m of meshes) if (/hip bone/i.test(m.userData.name)) for (const v of worldVerts(m, 3)) hipB.expandByPoint(v);
    W.ischOff = R.P0.y - hipB.min.y;
    const G = R.legs.Right; W.ankleH = G.A.y - G.ground; W.legLen = R.P0.y; }
  W.hipX = SEAT.x + 0.05; W.hipY = SEAT.y - 0.016 + W.ischOff;
  // ---- the phone in both hands, solved once in the slouch
  applyPose(PO.slouch, 0, true);
  { R.root.updateMatrixWorld(true);
    const st = avgV(posedVerts(R.byName.get('Body of sternum'), 2)), eyes = avgV(posedVerts(R.byName.get('Frontal bone'), 3)).add(new THREE.Vector3(-0.05, -0.03, 0));
    const at = st.clone().add(new THREE.Vector3(-0.27, -0.13, 0));
    const n = eyes.clone().sub(at).normalize(), top = FWD.clone().addScaledVector(n, -FWD.dot(n)).normalize();
    const zl = top.clone().negate(), xl = new THREE.Vector3().crossVectors(n, zl).normalize();   // phone local axes in the world: +y = n (the screen), -z = top
    const M = new THREE.Matrix4().makeBasis(xl, n, zl); const q = new THREE.Quaternion().setFromRotationMatrix(M);
    const ph = W.phone.g; ph.position.copy(at).addScaledVector(n, -0.004); ph.quaternion.copy(q); ph.updateMatrixWorld(true);
    const half = 0.0358 + 0.004, sideR = xl.z < 0 ? xl.clone() : xl.clone().negate();   // the skeleton's right is -z
    const gripR = at.clone().addScaledVector(sideR, half).addScaledVector(n, -0.012), gripL = at.clone().addScaledVector(sideR, -half).addScaledVector(n, -0.012);
    W.holdR = solveHand(R, 'Right', W.handR, gripR, { dir: [0.2, -0.5, 0.8], twist: 0.6, elbow: 1.7 }, [{ v: W.handR.n, to: sideR.clone().negate(), w: 0.3 }, { v: W.handR.fdir, to: top, w: 0.2 }]);
    W.holdL = solveHand(R, 'Left', W.handL, gripL, { dir: [0.2, -0.5, 0.8], twist: 0.6, elbow: 1.7 }, [{ v: W.handL.n, to: sideR.clone(), w: 0.3 }, { v: W.handL.fdir, to: top, w: 0.2 }]);
    poseArm(R.arms.Right, W.holdR); setWrist(W.wristR, W.holdR); poseArm(R.arms.Left, W.holdL); setWrist(W.wristL, W.holdL); W.handR.curl(0.5); W.handL.curl(0.5);
    R.root.updateMatrixWorld(true);
    W.wristR.g.attach(ph);                         // from here on the phone rides in the right hand
    W.phoneLocal = { p: ph.position.clone(), q: ph.quaternion.clone() };
    W.holdInfo = { at: at.toArray().map((v) => +v.toFixed(3)), R: W.holdR.dbg, L: W.holdL.dbg }; }
  // ---- hands resting on the thighs: solved once sitting up (the exercises) and once sitting back (the new position)
  { const solveRest = (name) => {
      const o = { ...PO[name], rest: 0 }; applyPose(o, 0, true); R.root.updateMatrixWorld(true); const out = {}, dbg = {};
      for (const Side of ['Right', 'Left']) {
        const fv = posedVerts(R.byName.get(`${Side} femur`), 2); let x0 = 9, x1 = -9; for (const v of fv) { x0 = Math.min(x0, v.x); x1 = Math.max(x1, v.x); }
        const xm = lerp(x0, x1, 0.42), band = fv.filter((v) => Math.abs(v.x - xm) < 0.03); let top = -9; for (const v of band) top = Math.max(top, v.y);
        const c = avgV(band); const target = new THREE.Vector3(xm, top + 0.026, c.z);
        const H = Side === 'Right' ? W.handR : W.handL; H.curl(0.2);
        out[Side] = solveHand(R, Side, H, target, { dir: [0.15, -0.8, 0.5], twist: 0.6, elbow: 1.1 }, [{ v: H.n, to: new THREE.Vector3(0, -1, 0), w: 0.4 }, { v: H.fdir, to: FWD.clone(), w: 0.25 }]);
        dbg[Side] = out[Side].dbg;
      }
      return { out, dbg }; };
    const a = solveRest('sq'), b = solveRest('relax'); W.restUp = a.out; W.restBack = b.out; W.restInfo = { up: a.dbg, back: b.dbg }; }
  // where the phone is let go (to put it on the desk): the pose at that moment, read now so any frame can be drawn alone
  { applyPose(poseAt(T.everyone + 0.28), T.everyone + 0.28, true); R.root.updateMatrixWorld(true);
    W.relP = new THREE.Vector3(); W.relQ = new THREE.Quaternion(); W.phone.g.getWorldPosition(W.relP); W.phone.g.getWorldQuaternion(W.relQ); }
  // ---- the two lower-back curves: the lumbar spine as it sits during "a different lower-back curve"
  applyPose(poseAt(T.different), T.different, true); R.root.updateMatrixWorld(true);
  { const names = ['Eleventh thoracic vertebra', 'Twelfth thoracic vertebra', 'First lumbar vertebra', 'Second lumbar vertebra', 'Third lumbar vertebra', 'Fourth lumbar vertebra', 'Fifth lumbar vertebra'];
    const pts = names.map((n) => { const m = R.byName.get(n); const vs = posedVerts(m, 2); let mx = -9; for (const v of vs) mx = Math.max(mx, v.x); return avgV(vs.filter((v) => v.x > mx - 0.012)); });   // the back of each vertebra (+x is the back)
    const sac = R.byName.get('Sacrum'); if (sac) { const vs = posedVerts(sac, 2); let my = -9; for (const v of vs) my = Math.max(my, v.y); const topPts = vs.filter((v) => v.y > my - 0.03); let mx = -9; for (const v of topPts) mx = Math.max(mx, v.x); pts.push(avgV(topPts.filter((v) => v.x > mx - 0.015))); }
    for (const p of pts) p.x += 0.03; pts.reverse();
    const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
    const mk = (col, k, r, ro) => { const geo = new THREE.TubeGeometry(curve, 120, r, 12, false), mat = new THREE.MeshBasicMaterial({ color: col.clone().multiplyScalar(k), transparent: true, opacity: 0, depthWrite: false, depthTest: false, toneMapped: false });
      const m = new THREE.Mesh(geo, mat); m.renderOrder = ro; scene.add(m); geo.setDrawRange(0, 0); return m; };
    // white: no back pain (thin, drawn on top); orange: with back pain (thicker), slides in from behind the back and lands on it
    W.curveA = mk(new THREE.Color(0xeceef1), 1.3, 0.0026, 9); W.curveB = mk(ORANGE, 1.7, 0.0048, 8); W.curveTop = pts[pts.length - 1].clone(); W.curveBot = pts[0].clone(); W.curveMid = curve.getPoint(0.5); }
  // ---- the protractor at the base of the neck, in the plane of the body, on the camera's side
  applyPose(poseAt(T.measured), T.measured, true); R.root.updateMatrixWorld(true);
  { const c7 = avgV(posedVerts(R.byName.get('Seventh cervical vertebra'), 2)); W.c7 = c7.clone();
    W.prot = makeProtractor(scene, new THREE.Vector3(c7.x, c7.y, c7.z + 0.115), 0.12); }
  applyPose(poseAt(0), 0, true);
  // ---- light: a soft window key from the camera side, a cool rim, the desk lamp, a fill
  W.key = spot(scene, { color: 0xdfe6ff, pos: new THREE.Vector3(1.1, 2.4, 2.0), target: new THREE.Vector3(-0.2, 0.8, -0.2), angle: 0.5, penumbra: 0.7, shadow: true, size: cfg.shadow ?? 1024 });
  W.key.shadow.camera.far = 7;
  W.rim = spot(scene, { color: 0x9fb6ff, pos: new THREE.Vector3(1.6, 1.9, -0.6), target: new THREE.Vector3(0.0, 0.9, 0.0), angle: 0.5, penumbra: 0.9 });
  W.fill = spot(scene, { color: 0xffe2c4, pos: new THREE.Vector3(-0.6, 1.5, 1.8), target: new THREE.Vector3(-0.1, 0.8, 0), angle: 0.6, penumbra: 1 });
  W.wash = spot(scene, { color: 0xffd9b0, pos: new THREE.Vector3(0.2, 2.3, 0.6), target: new THREE.Vector3(HOOP.x, HOOP.y, WALL_Z), angle: 0.35, penumbra: 0.9 });
  const r3 = (v) => v.toArray().map((x) => +x.toFixed(3));
  return { stamp: W.stampSpot, hold: W.holdInfo, rest: W.restInfo, ischOff: W.ischOff, hipY: W.hipY, ankleH: W.ankleH, c7: r3(W.c7), curveMid: r3(W.curveMid), curveBot: r3(W.curveBot) };
}

// ------------------------------------------------------------------ postures (sitting) and the arms
// tilt: pelvis, + forward; lum/tho/cer: + flexion; poke: chin forward; hx: hips forward (+ = toward the desk); fx: ankles forward of the hips;
// rec: the backrest reclines; rise: 0 sitting, 1 standing; arms: hold (phone), rest, squeeze, up
const P0S = { tilt: 0, lum: 0, tho: 0, cer: 0, poke: 0, side: 0, twist: 0, hx: 0, fx: 0.43, fz: 0, rec: 0, rise: 0, hold: 1, rest: 0, sq: 0, up: 0, tuck: 0, place: 0 };
const PO = {
  slouch: { ...P0S, tilt: -0.3, lum: 0.42, tho: 0.34, cer: 0.2, poke: 0.18, hx: 0.06, fx: 0.47 },
  upright: { ...P0S, tilt: 0.12, lum: -0.16, tho: -0.08, cer: -0.08, poke: -0.06, hx: -0.02, fx: 0.4 },
  lean: { ...P0S, tilt: -0.22, lum: 0.1, tho: -0.08, cer: 0.08, hx: 0.1, fx: 0.55, rec: 0.24 },
  fwd: { ...P0S, tilt: 0.26, lum: 0.3, tho: 0.3, cer: 0.24, poke: 0.12, hx: 0.0, fx: 0.33 },
  sideL: { ...P0S, tilt: -0.06, lum: 0.1, tho: 0.12, cer: 0.06, side: 0.3, twist: 0.14, fx: 0.44 },
  twistR: { ...P0S, tilt: -0.06, lum: 0.1, tho: 0.14, cer: 0.1, side: -0.1, twist: -0.5, fx: 0.42 },
  tuck: { ...P0S, tilt: 0.06, lum: 0.18, tho: 0.18, cer: 0.14, fx: 0.2, tuck: 1 },
  deep: { ...P0S, tilt: -0.5, lum: 0.55, tho: 0.36, cer: 0.24, poke: 0.22, hx: 0.16, fx: 0.55 },
  neutral: { ...P0S, tilt: -0.1, lum: 0.14, tho: 0.16, cer: 0.1, poke: 0.06, hx: 0.03, fx: 0.44 },
  look: { ...P0S, tilt: -0.14, lum: 0.2, tho: 0.22, cer: 0.1, poke: 0.04, hx: 0.04, fx: 0.45 },
  calm: { ...P0S, tilt: -0.08, lum: 0.1, tho: 0.12, cer: 0.06, poke: 0.04, hx: 0.03, fx: 0.44 },
  place: { ...P0S, tilt: 0.14, lum: 0.12, tho: 0.14, cer: 0.1, poke: 0.0, hx: 0.0, fx: 0.42, hold: 0, place: 1 },
  sq: { ...P0S, tilt: 0.06, lum: -0.04, tho: 0.0, cer: -0.04, poke: -0.04, hx: 0.0, fx: 0.42, hold: 0, rest: 1, sq: 1 },
  stand: { ...P0S, tilt: 0.0, lum: -0.02, tho: 0.02, cer: 0.0, hx: 0.0, fx: 0.0, hold: 0, rest: 1, rise: 1 },
  reach: { ...P0S, tilt: 0.0, lum: -0.1, tho: -0.06, cer: -0.1, hx: 0.0, fx: 0.0, hold: 0, up: 1, rise: 1 },
  relax: { ...P0S, tilt: -0.18, lum: 0.08, tho: 0.0, cer: 0.06, hx: 0.08, fx: 0.56, rec: 0.18, hold: 0, rest: 1 },
};
const mixP = (a, b, k) => { const o = {}; for (const key in P0S) o[key] = lerp(a[key] ?? 0, b[key] ?? 0, k); return o; };
// the run of postures: [time, posture, transition seconds, ease]
const SNAP = (u) => outBack(u, 2.4), MELT = (u) => s5(0, 1, u), EZ = (u) => s5(0, 1, u);
const SEQ = [
  [-9, 'slouch', 0.1, EZ],
  [T.up - 0.12, 'upright', 0.32, SNAP],                       // "sit up straight": the soldier
  [T.guessing - 0.05, 'slouch', 0.75, MELT],                  // "she was guessing": melts back
  [T.move - 0.15, 'lean', 0.32, SNAP], [T.bend - 0.1, 'fwd', 0.3, SNAP], [T.change - 0.1, 'sideL', 0.3, SNAP],
  [T.position + 0.1, 'twistR', 0.3, SNAP], [T.all - 0.05, 'tuck', 0.3, SNAP], [T.not - 0.05, 'deep', 0.3, SNAP],
  [T.freeze - 0.12, 'upright', 0.28, SNAP],                   // "freeze in one perfect pose"
  [T.and1 - 0.3, 'slouch', 0.8, MELT],
  [T.people - 0.2, 'neutral', 0.8, EZ],
  [T.looking - 0.2, 'look', 0.8, EZ],
  [T.if1 - 0.2, 'look', 0.1, EZ],
  [T.if1 + 0.4, 'calm', 1.6, EZ],                            // the warnings: still
  [T.everyone - 0.05, 'place', 0.45, EZ],
  [T.strengthen - 0.15, 'sq', 0.4, EZ],
  [T.getup + 0.05, 'stand', 1.1, EZ], [T.because2 - 0.1, 'relax', 1.3, EZ],
];
function basePose(t) {
  let i = 0; while (i + 1 < SEQ.length && SEQ[i + 1][0] <= t) i++;
  const [t0, name, dur, ease] = SEQ[i], prev = i > 0 ? basePose(t0 - 1e-4) : PO[name];
  return mixP(prev, PO[name], ease(clamp01((t - t0) / dur)));
}
function poseAt(t) {
  const o = basePose(t);
  // the neck: looking further down at the phone, step by step ("measured ... neck angle")
  const look = s5(T.looking - 0.1, T.phone + 0.4, t) * (1 - s5(T.if1 - 0.3, T.if1 + 1.0, t));
  const steps = s5(T.because, T.because + 0.5, t) * 0.33 + s5(T.measured, T.measured + 0.5, t) * 0.33 + s5(T.angle, T.angle + 0.5, t) * 0.34;
  o.cer += look * (0.12 + 0.36 * steps); o.poke += look * 0.06 * steps; o.tho += look * 0.04;
  // chin tucks, twice, during "strengthen your neck and upper back"
  const tk = pulse(t, T.strengthen + 0.02, T.strengthen + 0.44, 0.15) + pulse(t, T.strengthen + 0.47, T.upper - 0.1, 0.15);
  o.poke -= 0.32 * tk; o.cer -= 0.1 * tk;
  // the rows: forearms up, then the shoulder blades squeezed together, twice
  o.row = pulse(t, T.upper - 0.3, T.getup + 0.1, 0.2);
  o.sqk = pulse(t, T.upper - 0.12, T.upper + 0.3, 0.15) + pulse(t, T.upper + 0.32, T.getup - 0.05, 0.15);
  // standing: marching on the spot ("keep moving")
  o.march = pulse(t, T.hour + 0.05, T.because2 - 0.05, 0.25); o.mph = 2 * Math.PI * 1.3 * (t - T.hour - 0.05);
  // a breath, while still
  o.tho += 0.012 * Math.sin(t * 1.6);
  return o;
}
const ARM_REST = { dir: [0.18, -0.85, 0.5], twist: 0.7, elbow: 1.25, wf: 0.2 };          // hands resting on the thighs
const ARM_SQ = { dir: [0.14, -0.95, 0.12], twist: 0.6, elbow: 1.5, wf: 0 };              // elbows bent, forearms forward
const ARM_SQB = { dir: [0.2, -0.82, -0.5], twist: 0.6, elbow: 1.65, wf: 0 };            // the squeeze: elbows back, shoulder blades together
const ARM_UP = { dir: [0.18, 1, 0.08], twist: 0.4, elbow: 0.12, wf: 0 };                 // the stretch, overhead
const ARM_DOWN = { dir: [0.08, -1, 0.05], twist: 0.2, elbow: 0.12, wf: 0 };              // standing, hands by the sides
const ARM_PLACE = { dir: [0.12, -0.42, 0.9], twist: 0.6, elbow: 0.4, wf: 0.35 };          // reaching to put the phone on the desk
function restArm(o, Side) {   // hands resting on the thighs: solved for sitting up and for sitting back; standing, by the sides
  const up = (W.restUp && W.restUp[Side]) || ARM_REST, back = (W.restBack && W.restBack[Side]) || ARM_REST;
  const seated = mixArm(up, back, clamp01((o.rec || 0) / 0.18));
  if (!(o.rise > 0)) return seated;
  const sw = (o.march || 0) * Math.sin(o.mph || 0) * (Side === 'Right' ? 1 : -1);   // the arm swings with the opposite leg
  const down = { ...ARM_DOWN, dir: [ARM_DOWN.dir[0], ARM_DOWN.dir[1], ARM_DOWN.dir[2] + 0.38 * sw], elbow: ARM_DOWN.elbow + 0.25 * (o.march || 0) };
  return mixArm(seated, down, s5(0.15, 0.85, o.rise));
}
function armFor(o, Side) {
  const H = (Side === 'Right' ? W.holdR : W.holdL) || ARM_REST;
  let a = H;
  const w = (k) => clamp01(k);
  if (o.place > 0.001) a = mixArm(a, ARM_PLACE, w(o.place));
  if (o.rest > 0.001) a = mixArm(a, restArm(o, Side), w(o.rest));
  const row = clamp01(o.row || 0) * clamp01(o.sq || 0);
  if (row > 0.001) a = mixArm(a, mixArm(ARM_SQ, ARM_SQB, clamp01(o.sqk || 0)), row);
  if (o.up > 0.001) a = mixArm(a, ARM_UP, w(o.up));
  return { ...a, retract: (o.sqk || 0) * 0.28 * row, elevate: 0.08 * (o.up || 0) };
}
// pose the rig and place the body for posture o (at time t; quick = skip nothing, used at build too)
function applyPose(o, t, quick) {
  const R = W.rig;
  R.pelvis.position.copy(R.P0); R.pelvis.rotation.set(o.tilt, 0, 0);
  bendSpine(R.seg, { lum: o.lum, tho: o.tho, cer: o.cer, side: o.side, twist: o.twist, poke: o.poke });
  for (const Side of ['Right', 'Left']) { const a = armFor(o, Side); poseArm(R.arms[Side], a); setWrist(Side === 'Right' ? W.wristR : W.wristL, a); }
  const hold = clamp01(o.hold), cu = Math.min(0.85, 0.12 + 0.4 * hold + 0.15 * clamp01(o.rest) * (1 - o.rise) + 0.55 * clamp01(o.row || 0) * clamp01(o.sq || 0));
  W.handR.curl(cu); W.handL.curl(cu);
  // the hips: on the seat (forward by hx), or up over the feet when standing
  const seatX = W.hipX - o.hx, seatY = W.hipY + 0.035 * Math.abs(o.tilt);
  const footX = W.hipX - 0.43 - 0.02;   // where the feet stand when getting up
  const r = clamp01(o.rise), standX = footX + 0.06, standY = W.legLen - 0.012;
  const lift = Math.sin(Math.PI * r);   // leaning forward as the hips come up
  W.body.position.set(lerp(seatX, standX, s5(0, 1, r)) - 0.05 * lift, lerp(seatY, standY, s5(0.15, 1, r)), 0);
  if (r > 0) { R.pelvis.rotation.x += 0.55 * lift; bendSpine(R.seg, { lum: o.lum + 0.25 * lift, tho: o.tho + 0.15 * lift, cer: o.cer - 0.1 * lift, side: o.side, twist: o.twist, poke: o.poke }); }
  W.body.quaternion.copy(W.qBody);
  W.body.updateMatrixWorld(true);
  // the feet, flat on the floor (tucked back under the seat for "tuck")
  const fx = lerp(lerp(W.hipX - o.fx, W.hipX - 0.2, 0), footX, s5(0, 0.6, r));
  for (const Side of ['Right', 'Left']) {
    const zs = Side === 'Right' ? -1 : 1, tuckBack = (o.tuck || 0) * (Side === 'Right' ? 0.0 : 0.08);
    const lift = 0.15 * (o.march || 0) * Math.max(0, Math.sin(o.mph || 0) * (Side === 'Left' ? 1 : -1));
    const target = new THREE.Vector3(fx + tuckBack - 0.25 * lift, W.ankleH + 0.003 + lift + (o.tuck || 0) * (Side === 'Left' ? 0.05 : 0), zs * (0.11 + 0.015 * (1 - r)));
    const fq = W.qBody.clone(); if ((o.tuck || 0) > 0 && Side === 'Left') fq.multiply(new THREE.Quaternion().setFromAxisAngle(X, -0.6 * o.tuck));
    legIK(R, Side, target, fq, FWD);
  }
  W.body.updateMatrixWorld(true);
}

// ------------------------------------------------------------------ the wall clock: 10:58, then an hour goes by on "at least once an hour"
const H = 3600;
const CK = [[-5, 10 * H + 57 * 60], [T.once - 0.1, 10 * H + 58 * 60], [T.hour + 0.4, 11 * H + 58 * 60], [T.end, 11 * H + 59 * 60]];

// ------------------------------------------------------------------ the camera: one path, no cuts
let CAM = null;
function buildCam() {
  const hoop = new THREE.Vector3(HOOP.x, HOOP.y, HOOP.z);
  W.camLogo = { p: hoop.clone().add(new THREE.Vector3(0, 0, 1.18)), l: hoop.clone() };
  const fileC = new THREE.Vector3(FILE.x, DESK.top, FILE.z);
  const lum = W.curveMid.clone().add(new THREE.Vector3(0.01, 0.06, 0));                         // the curve a little left of centre, low in the frame
  const n1 = W.c7.clone().add(new THREE.Vector3(-0.08, 0.02, 0));                                // the neck and the protractor
  W.gauge.g.updateMatrixWorld(true); const gh = W.gauge.head.getWorldPosition(new THREE.Vector3());
  const n2 = new THREE.Vector3((gh.x - 0.08 + W.c7.x + 0.03) / 2, 1.0, (gh.z + W.c7.z) / 2);      // ... and the gauge on the desk, both in frame
  const A = (v, d) => v.clone().add(new THREE.Vector3(...d)).toArray();
  return camTrack([
    { t: -3, p: V3(HOOP.x + 0.02, HOOP.y + 0.06, HOOP.z + 0.92), l: V3(HOOP.x, HOOP.y + 0.08, HOOP.z), fov: 34 },
    { t: 0.6, p: V3(HOOP.x + 0.03, HOOP.y + 0.06, HOOP.z + 0.88), l: V3(HOOP.x, HOOP.y + 0.08, HOOP.z), fov: 34, tens: 0.3 },   // the hoop: SIT UP STRAIGHT
    { t: 1.5, p: V3(0.3, 1.26, 1.85), l: V3(-0.14, 1.08, -0.05), fov: 42, tens: 0.25 },                                                      // the room, side on: it snaps up
    { t: 4.9, p: V3(0.28, 1.26, 1.8), l: V3(-0.14, 1.06, -0.05), fov: 42, tens: 0.3 },
    { t: 6.2, p: V3(0.98, 1.32, 1.62), l: V3(-0.1, 1.06, -0.02), fov: 40, tens: 0.25 },                                                     // from behind, three quarters: the spine lights up, the run of positions, stone
    { t: 12.3, p: V3(0.95, 1.32, 1.57), l: V3(-0.1, 1.06, -0.02), fov: 40, tens: 0.3 },
    { t: 13.4, p: A(fileC, [0.38, 0.86, 0.04]), l: A(fileC, [-0.07, 0, 0]), fov: 32, tens: 0.25 },                                         // over the shoulder: the case file and the stamp
    { t: 19.1, p: A(fileC, [0.37, 0.85, 0.04]), l: A(fileC, [-0.07, 0, 0]), fov: 32, tens: 0.3 },
    { t: 19.65, p: V3(0.2, 1.4, 0.75), l: V3(-0.1, 0.9, -0.05), fov: 34 },
    { t: 20.2, p: A(lum, [0.1, 0.04, 0.88]), l: lum.toArray(), fov: 32, tens: 0.25 },                                                      // the lower back, side on: two curves
    { t: 23.9, p: A(lum, [0.1, 0.04, 0.86]), l: lum.toArray(), fov: 32, tens: 0.3 },
    { t: 25.0, p: A(n1, [0.02, 0.06, 1.3]), l: n1.toArray(), fov: 36, tens: 0.25 },                                                        // the neck, the protractor
    { t: 31.7, p: A(n1, [0.02, 0.06, 1.27]), l: n1.toArray(), fov: 36, tens: 0.3 },
    { t: 32.6, p: A(n2, [0.05, 0.1, 2.3]), l: n2.toArray(), fov: 34, tens: 0.25 },                                                         // ... and the NECK PAIN gauge, which doesn't move
    { t: 34.4, p: A(n2, [0.05, 0.1, 2.26]), l: n2.toArray(), fov: 34, tens: 0.3 },
    { t: 36.4, p: V3(0.75, 1.38, 1.65), l: V3(-0.08, 1.12, 0.0), fov: 38, tens: 0.25 },                                                      // the warnings: slow, plain
    { t: 52.8, p: V3(0.2, 1.36, 1.9), l: V3(-0.1, 1.12, 0.0), fov: 38, tens: 0.4 },
    { t: 54.6, p: V3(0.3, 1.3, 1.9), l: V3(-0.14, 1.12, -0.05), fov: 42, tens: 0.25 },                                                      // the plan: side on
    { t: 56.9, p: V3(0.3, 1.3, 1.92), l: V3(-0.14, 1.12, -0.05), fov: 42, tens: 0.4 },
    { t: 57.9, p: V3(0.02, 1.3, 3.5), l: V3(-0.04, 1.3, -0.1), fov: 44, tens: 0.25 },                                                        // standing, the clock, marching: wide
    { t: 59.7, p: V3(-0.04, 1.3, 3.45), l: V3(-0.1, 1.3, -0.1), fov: 44, tens: 0.4 },
    { t: 61.0, p: V3(0.3, 1.3, 1.95), l: V3(-0.14, 1.12, -0.05), fov: 42, tens: 0.25 },                                                     // sitting back, a new position
    { t: 62.4, p: V3(0.29, 1.3, 1.92), l: V3(-0.14, 1.12, -0.05), fov: 42, tens: 0.4 },
    { t: 64.5, p: W.camLogo.p.clone().add(new THREE.Vector3(0.06, 0.02, 0.35)).toArray(), l: W.camLogo.l.toArray(), fov: 30 },
    { t: T.logo, p: W.camLogo.p.toArray(), l: W.camLogo.l.toArray(), fov: 30, stop: true },
  ]);
}
function camPose(S, t) {
  const v = S.cfg.view; if (v && typeof v === 'object') return v;
  if (!CAM) CAM = buildCam();
  if (t <= T.logo) return CAM(t);
  const P = CAM(T.logo), k = ss(T.logo, T.end, t);
  return { p: [P.p[0], P.p[1], P.p[2] + 0.03 * k], l: P.l, fov: 30 };
}
function focusAt(S, t, P) { return Math.hypot(P.p[0] - P.l[0], P.p[1] - P.l[1], P.p[2] - P.l[2]); }

// ------------------------------------------------------------------ one moment of the film
const _v = new THREE.Vector3(), _q = new THREE.Quaternion(), STONE = new THREE.Color(0x4d504e);
function update(S, t) {
  const scene = S.scene, endDark = ss(T.final + 0.4, T.logo - 0.3, t);
  // ---- the body
  const o = poseAt(t); applyPose(o, t);
  // ---- the chair reclines with the lean, rolls back when he stands
  W.chair.back.rotation.z = -0.32 * clamp01(o.rec);
  W.chair.g.position.x = SEAT.x + 0.14 * s5(0, 1, clamp01(o.rise));
  // ---- the spine lights up while it moves; then the whole body goes to stone for the frozen pose
  { const glow = pulse(t, T.spine - 0.2, T.not, 0.35); for (const m of W.spineMeshes) m.material.emissiveIntensity = 0.55 * glow;
    const stone = pulse(t, T.freeze + 0.05, T.and1 - 0.35, 0.18);
    W.mats.forEach((m, i) => { m.color.copy(W.col0[i]).lerp(STONE, 0.94 * stone); m.roughness = lerp(W.rough0[i], 1.0, stone); if (W.sheen0[i] > 0) m.sheen = lerp(W.sheen0[i], 1e-4, stone); if (W.coat0[i] > 0) m.clearcoat = lerp(W.coat0[i], 1e-4, stone); }); }
  // ---- the phone: in the hands, scrolling; then put down on the desk
  { const P = W.phone, g = P.g, tr = T.everyone + 0.28;
    const flicks = [0.9, 3.3, 5.0, 13.0, 16.2, 21.2, 25.9, 27.6, 29.4, 31.0]; let sc = 0; for (const f of flicks) sc += 620 * s5(f, f + 0.32, t);
    drawFeed(P, sc);
    P.screenMat.color.setScalar(0.7 * (1 - ss(T.if1 - 0.2, T.if1 + 0.6, t)) * (1 - ss(tr + 0.4, tr + 0.9, t)) + 0.0);
    if (t < tr) { if (g.parent !== W.wristR.g) W.wristR.g.add(g); g.position.copy(W.phoneLocal.p); g.quaternion.copy(W.phoneLocal.q); }
    else {
      if (g.parent !== scene) scene.add(g);
      const u = s5(tr, tr + 0.5, t), dq = new THREE.Quaternion().setFromAxisAngle(Y, PHONE_DOWN.ry);
      g.position.lerpVectors(W.relP, PHONE_DOWN.p, u); g.position.y += 0.06 * Math.sin(Math.PI * u); g.quaternion.copy(W.relQ).slerp(dq, u);
    } }
  // ---- the case: the stamp slams NO EVIDENCE, then ALIBI CONFIRMED
  { const C = W.case, k = stampAt(C, t); C.st.position.copy(k.p); C.st.rotation.set(0, k.yaw, 0.6 * k.h);
    let sq = 0; for (const a of [C.a1, C.a2]) sq += Math.exp(-Math.max(0, t - a) * 16) * (t >= a && t < a + 0.4 ? 1 : 0);
    C.st.scale.set(1 + 0.08 * sq, 1 - 0.14 * sq, 1 + 0.08 * sq);
    for (const [m, a] of [[C.s1, C.a1], [C.s2, C.a2]]) { const s = ss(a, a + 0.05, t); m.material.opacity = 0.92 * s * (1 - ss(T.people - 0.5, T.people, t)); m.scale.setScalar(1 + 0.2 * (1 - s)); } }
  // ---- two lower-back curves: without back pain (white), with back pain (orange) slides in, and they match
  { const A = W.curveA, B = W.curveB, on = pulse(t, T.people - 0.1, T.looking - 0.1, 0.35);
    const drawA = s5(T.people, T.people + 0.9, t), slideB = s5(T.different - 0.2, T.curve + 0.2, t);
    A.geometry.setDrawRange(0, Math.floor(drawA * A.geometry.index.count / 3) * 3); A.material.opacity = 0.95 * on;
    B.geometry.setDrawRange(0, B.geometry.index.count); B.position.set(CURVE_OFF * (1 - slideB), 0, 0); B.material.opacity = 0.9 * on * ss(T.dont - 0.2, T.dont + 0.3, t); W.slideB = slideB; }
  // ---- the protractor: the neck's angle forward from upright; the gauge doesn't care
  { const Pr = W.prot, on = pulse(t, T.because - 0.3, T.if1 - 0.2, 0.35);
    Pr.m.material.opacity = 0.9 * on; Pr.armMat.opacity = on;
    const head = W.rig.seg.Atlas.g; head.getWorldQuaternion(_q); _v.set(0, 1, 0).applyQuaternion(_q);
    const ang = Math.atan2(-_v.x, _v.y);   // forward (toward -x) from upright
    Pr.arm.rotation.z = ang; W.neckAngle = ang; Pr.g.position.copy(W.rig.seg['Seventh cervical vertebra'].g.getWorldPosition(_v)).add(new THREE.Vector3(0, 0, 0.115)); }
  { const G = W.gauge, jit = 0.012 * Math.sin(t * 7.1) * Math.sin(t * 2.3); G.needle.rotation.z = G.value(0.12 + jit) ; }
  // ---- the wall clock
  { const s = keys(CK, t), C = W.clock, hrs = (s / H) % 12, spin = Math.abs(keys(CK, t + 0.02) - s) > 30;
    C.hands.h.rotation.z = -(hrs / 12) * Math.PI * 2; C.hands.m.rotation.z = -((s % H) / H) * Math.PI * 2; C.hands.s.rotation.z = spin ? -((s % 60) / 60) * Math.PI * 2 : -tickAngle(s % 60);
    C.arcMat.opacity = 0; C.arcGhostMat.opacity = 0; C.markMat.color.copy(ORANGE); }
  // ---- the hoop becomes the logo
  { const lk = s5(T.final + 0.5, T.logo - 0.25, t), Hp = W.hoop;
    Hp.clothMat.color.setScalar(lerp(1, 0.08, lk));
    Hp.logo.set({ weight: lk, white: lk, hours: 0, hand: ss(T.logo - 0.4, T.logo - 0.15, t), handScale: outBack(clamp01((t - (T.logo - 0.4)) / 0.35), 1.8) }); }
  // ---- light
  { const fig = 1 - endDark, warn = pulse(t, T.if1 - 0.3, T.everyone, 0.8);
    W.key.intensity = 30 * fig * (1 - 0.35 * warn); W.rim.intensity = 3.2 * fig; W.fill.intensity = 1.5 * fig; W.wash.intensity = 2.2 * (1 - 0.6 * endDark);
    const onCase = pulse(t, 12.9, 19.5, 0.5); W.lampLight.intensity = 1.6 * fig * (1 - 0.55 * onCase); W.lamp.shadeMat.emissiveIntensity = 0.9; W.lamp.bulbMat.color.setScalar(1.2);
    S.tableMat.color.setScalar(0.42 * (1 - endDark * 0.9)); scene.environmentIntensity = (0.22) * (1 - endDark); S.reflAmt = 0.4 * (1 - endDark);
    S.bg.setRGB(0.03, 0.032, 0.038); S.fog.color.copy(S.bg); }
}

// ------------------------------------------------------------------ the words on screen
const CAPS = [
  { t0: T.your, t1: 2.55, top: 300, size: 92, html: 'Your mum told you to<br><em>sit up straight.</em>' },
  { t0: T.with, t1: 5.2, top: 300, size: 92, html: 'With all due respect,<br>she was <em>guessing.</em>' },
  { t0: T.your2, t1: 9.45, top: 292, size: 84, html: 'Your spine was built to<br><em>move, bend</em> and change<br>position all day,' },
  { t0: T.not, t1: 12.6, top: 300, size: 88, html: 'not to <em>freeze</em> in one<br>perfect pose.' },
  { t0: T.and1, t1: 16.35, top: 292, size: 80, html: 'And there’s <em>no solid</em><br><em>evidence</em> that slouching<br>causes back pain,' },
  { t0: T.so, t1: 19.4, top: 300, size: 92, html: 'so your slouch<br>has an <em>alibi.</em>' },
  { t0: T.people, t1: 24.05, top: 292, size: 84, html: 'People with back pain<br>don’t even have<br>a <em>different</em><br>lower-back curve.' },
  { t0: T.and2, t1: 28.25, top: 292, size: 80, html: 'And looking down<br>at your phone isn’t<br>the <em>neck killer</em><br>it’s made out to be,' },
  { t0: T.because, t1: T.neck2 - 0.1, top: 292, size: 84, html: 'because when people<br>were measured while<br>using their phones,' },
  { t0: T.neck2, t1: 34.7, top: 300, size: 92, html: 'neck angle<br><em>didn’t predict</em><br>neck pain.' },
  { t0: T.if1, t1: T.numb2 - 0.1, top: 292, size: 76, html: 'If back pain comes with<br>pain, <em>numbness or</em><br><em>weakness in both legs</em>,' },
  { t0: T.numb2, t1: 41.95, top: 292, size: 84, html: 'numbness around your<br><em>genitals or bottom</em>,' },
  { t0: T.or3, t1: T.thats - 0.1, top: 292, size: 84, html: 'or changes in your<br><em>bladder or bowels</em>,' },
  { t0: T.thats, t1: 48.45, top: 292, size: 84, html: 'that’s not posture,<br>so get <em>emergency help.</em>' },
  { t0: T.same, t1: T.or4 - 0.1, top: 292, size: 84, html: 'The same goes for<br>back pain with<br><em>chest pain</em>,' },
  { t0: T.or4, t1: 53.7, top: 300, size: 92, html: 'or after a<br><em>serious accident.</em>' },
  { t0: T.for7, t1: 57.0, top: 292, size: 84, html: 'For everyone else,<br>strengthen your<br><em>neck and upper back</em>,' },
  { t0: T.getup, t1: 59.75, top: 292, size: 84, html: 'get up at least<br><em>once an hour</em>,<br>and keep moving,' },
  { t0: T.because2, t1: 63.3, top: 292, size: 88, html: 'because the best<br>posture is your<br><em>next one.</em>' },
  { t0: T.final, t1: 99, top: 360, size: 92, html: 'Let’s get you back to<br><em>factory settings.</em>' },
];
const OVL = {};
function overlayInit(S) {
  const O = S.O, tag = (cls, txt2, size, bsize) => { const e = O.tag(cls, txt2); e.style.fontSize = size + 'px'; const b = e.querySelector('b'); if (b && bsize) b.style.fontSize = bsize + 'px'; return e; };
  const pill = (e) => Object.assign(e.style, { background: 'rgba(8,9,11,.58)', padding: '12px 18px 14px', borderRadius: '16px', color: '#d4d7dc' });
  OVL.without = tag('tag', 'Lower back<b>no back pain</b>', 22, 38); pill(OVL.without);
  OVL.with = tag('tag', 'Lower back<b>with back pain</b>', 22, 38); pill(OVL.with); OVL.with.style.color = '#ff9a6e';
  OVL.same = tag('tag', 'Result<b>the same curve</b>', 22, 40); pill(OVL.same);
  OVL.angle = tag('tag', 'Neck angle<b>0°</b>', 22, 44); pill(OVL.angle);
  OVL.pain = tag('tag', 'Neck pain<b>no change</b>', 22, 40); pill(OVL.pain);
}
function overlay(S, t) {
  const top = W.curveTop.clone(), mid = W.curveMid.clone();
  const bot = W.curveBot.clone().add(new THREE.Vector3(0, -0.015, 0));
  place(S, OVL.without, bot.clone(), -135, 24, pulse(t, T.people + 0.4, T.different - 0.1, 0.3));
  place(S, OVL.with, bot.clone().add(new THREE.Vector3(CURVE_OFF * (1 - (W.slideB || 0)), 0, 0)), -135, 24, pulse(t, T.dont, T.curve + 0.1, 0.3));
  place(S, OVL.same, bot.clone(), -135, 24, pulse(t, T.curve + 0.15, T.looking - 0.2, 0.3));
  const deg = Math.max(0, Math.round((W.neckAngle || 0) * 180 / Math.PI / 5) * 5);
  const b = OVL.angle.querySelector('b'); if (b && b.textContent !== `${deg}°`) b.textContent = `${deg}°`;
  place(S, OVL.angle, W.prot.g.position.clone(), -330, 70, pulse(t, T.measured - 0.2, T.if1 - 0.3, 0.3));
  place(S, OVL.pain, W.gauge.head.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, 0.1, 0)), -40, -90, pulse(t, T.didnt - 0.2, T.if1 - 0.3, 0.3));
  const hc = new THREE.Vector3(HOOP.x, HOOP.y, HOOP.z + 0.0065), he = new THREE.Vector3(HOOP.x, HOOP.y + HOOP.r - 0.012, HOOP.z + 0.0065);
  logoEnd(S, t, { t0: T.logo, center: hc, edge: he });
}

makeFilm({
  T, caps: CAPS, subs: [], build, update, pose: camPose, overlay, overlayInit, focus: focusAt,
  stage: { bg: 0x08090b, reflSize: 6, env: 0.2, far: 30 },
  aperture: [[0, 0.003], [1.5, 0.004], [13.4, 0.003], [20.2, 0.003], [25, 0.003], [36.4, 0.003], [54.6, 0.003], [64.9, 0.003]],
  bloom: [[0, 0.45], [36, 0.42], [64, 0.55]],
  fast: [[1.5, 2.1, 3], [4.3, 5.2, 2], [6.7, 10.5, 3], [12.6, 14.6, 3], [17.2, 18.9, 3], [19.4, 20.3, 2], [21.6, 23.3, 2], [54.7, 61.6, 3]],
});

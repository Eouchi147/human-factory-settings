// Human Factory Settings · Film 15 "Can you detox dopamine?" · one continuous shot, 9:16.
// A skeleton sits on a stool in a dark room, all its fun locked away in front of it: a phone in a glass box, a cake under
// a padlocked dome. On the wall behind, a neon sign: DOPAMINE DETOX. A panel of gauges: wanting rises with dopamine,
// liking doesn't move; dopamine drops, liking still doesn't. A lamp, a drop of juice and a trace of spikes: dopamine
// cells fire at a surprise reward, then at the light that predicts it. A day off: the dopamine gauge holds. Under the
// neon, a small plaque: TITLE NOT TO BE TAKEN LITERALLY (the gag). The phone box's lid closes: stimulus control. Four
// weeks off one network, an hour a day back; the TV comes on, and the skeleton watches it alone, seen from behind. The
// dopamine gauge becomes the logo. The factory stamp is on the back of the skull.
import { THREE, ss, s5, lerp, clamp01, hash, camTrack, phys, shadows, spot, RoundedBoxGeometry, glowSprite,
  loadAnatomy, V3, place, logoEnd, makeFilm, outBack, stamp, stampCanvas, stampSpot, noiseTex } from '../kit.js';
import { buildRig, skeletonKind, bendSpine, poseArm, legIK, worldVerts } from '../rig.js';
import { makeLogoRing } from '../props.js';

// ------------------------------------------------------------------ timing, from the voice guide (word starts)
const T = {
  end: 79.7,
  detox: 0.35, ban: 2.39, fun: 3.31, reset: 3.80, pleasure: 4.82,                                   // "Dopamine detox. Ban all fun, and reset your brain's pleasure chemical."
  few: 6.80, causes: 10.31, pleasure2: 11.22, drives: 12.59, wanting: 13.23, liking: 13.94,
  parkinsons: 16.10, lose: 17.08, dopamine3: 18.31, still: 19.10, sweetness: 19.95, pleasant: 21.26,
  animal: 23.47, fire: 25.32, surprise: 26.13, reward: 26.92, switch: 27.90, predicts: 29.83,
  dayOff: 32.23, lower: 32.54, harvard: 34.14, no: 35.40,
  creator: 37.25, reducing: 38.60, name: 41.22, catchy: 42.13,
  behaviour: 43.79, phone: 45.62, harder: 46.89, notBad: 48.61, notNew: 49.91,
  trial: 52.69, weeks: 53.30, hour: 56.29, family: 58.66, tv: 60.31, alone: 60.84,
  wellbeing: 62.21, little: 63.64, afterwards: 64.35, t22: 66.71, less: 67.89,
  dont: 69.30, people: 70.37, exercise: 70.92, method: 72.90, never: 73.43,
  back: 75.55, factory: 76.41, settings: 76.71, logo: 77.4,
};

// ------------------------------------------------------------------ the set (metres, floor at y = 0); the skeleton sits at the origin, facing +z
const W = {}; window.HFS_W = W;
const X = new THREE.Vector3(1, 0, 0), Y = new THREE.Vector3(0, 1, 0), Z = new THREE.Vector3(0, 0, 1);
const SEAT = 0.46;
const LOW = { x: 0, z: 0.62, w: 0.7, d: 0.38, top: 0.42 };            // a low table in front: the locked fun
const NEON = { z: -1.05, y: 1.7 };                                       // the sign on the wall behind
const PANEL = { x: -1.05, z: 0.15, y: 1.25, rot: 0.6435 };              // the gauges, to the skeleton's right, turned toward the room
const RIG = { x: 1.0, z: 0.35, top: 0.78, rot: -0.6435 };               // the lamp, the dropper and the trace, to its left
const TV = { x: 0.0, z: 1.65, y: 0.75, rot: Math.PI };                     // the TV in front, facing the skeleton
const LOGO_R = 0.05;
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
const glass = (o = {}) => new THREE.MeshPhysicalMaterial({ color: 0xdfe8ff, roughness: 0.05, transmission: 0.9, thickness: 0.004, transparent: true, opacity: 0.35, clearcoat: 1, ...o });

// ------------------------------------------------------------------ the stool, the low table with the locked fun (a phone in a glass box, a cake under a padlocked dome)
function padlock(s = 1) {
  const g = new THREE.Group(), brass = phys({ color: 0xb08d57, metalness: 1, roughness: 0.3 });
  const body = new THREE.Mesh(new RoundedBoxGeometry(0.032 * s, 0.028 * s, 0.012 * s, 3, 0.004 * s), brass); g.add(body);
  const sh = new THREE.Mesh(new THREE.TorusGeometry(0.011 * s, 0.0028 * s, 12, 32, Math.PI), phys({ color: 0xbfc4cc, metalness: 1, roughness: 0.25 })); sh.position.y = 0.014 * s; g.add(sh);
  return g;
}
function makeRoom(scene) {
  const g = new THREE.Group(); scene.add(g);
  const st = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.035, 96), black()); st.position.y = SEAT - 0.0175; g.add(st);
  for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2 + 0.5, leg = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.011, SEAT - 0.03, 20), black());
    leg.position.set(Math.cos(a) * 0.12, (SEAT - 0.03) / 2, Math.sin(a) * 0.12); leg.rotation.set(Math.sin(a) * 0.08, 0, -Math.cos(a) * 0.08); g.add(leg); }
  const wood = phys({ color: 0x1a120d, roughness: 0.42, clearcoat: 0.5, roughnessMap: noiseTex(7, 256, 0.8, 1.0, 12) });
  const top = new THREE.Mesh(new RoundedBoxGeometry(LOW.w, 0.03, LOW.d, 4, 0.008), wood); top.position.set(LOW.x, LOW.top - 0.015, LOW.z); g.add(top);
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.013, LOW.top - 0.03, 16), wood); leg.position.set(LOW.x + x * (LOW.w / 2 - 0.05), (LOW.top - 0.03) / 2, LOW.z + z * (LOW.d / 2 - 0.05)); g.add(leg); }
  // the phone, face up, lit, in a glass box with a lid that closes later
  const box = new THREE.Group(); box.position.set(LOW.x - 0.17, LOW.top, LOW.z + 0.02); box.rotation.y = 0.2; g.add(box);
  const phone = new THREE.Mesh(new RoundedBoxGeometry(0.075, 0.009, 0.155, 3, 0.006), phys({ color: 0x0d0e11, roughness: 0.25, clearcoat: 0.8 })); phone.position.y = 0.0045 + 0.004; box.add(phone);
  const screenTex = canvasTex(300, 620, (x, w, h) => { const gr = x.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#2b3f73'); gr.addColorStop(1, '#5a2b6e'); x.fillStyle = gr; x.fillRect(0, 0, w, h);
    for (let k = 0; k < 6; k++) { x.fillStyle = 'rgba(255,255,255,0.85)'; x.beginPath(); x.roundRect(30 + (k % 3) * 85, 90 + Math.floor(k / 3) * 95, 60, 60, 16); x.fill(); }
    x.fillStyle = '#e04a4a'; x.beginPath(); x.arc(30 + 60 + 2, 92, 14, 0, Math.PI * 2); x.fill(); txt(x, '99+', 92, 93, { font: '800 14px Archivo', color: '#fff' }); });
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.068, 0.145), new THREE.MeshBasicMaterial({ map: screenTex })); scr.rotation.x = -Math.PI / 2; scr.position.y = 0.0136; box.add(scr);
  const walls = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.06, 0.19), glass()); walls.position.y = 0.03 + 0.004; box.add(walls);
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.115, 0.004, 0.195), black()); base.position.y = 0.002; box.add(base);
  const lidP = new THREE.Group(); lidP.position.set(0, 0.064, -0.095); box.add(lidP);   // hinged at the back
  const lid = new THREE.Mesh(new THREE.BoxGeometry(0.118, 0.006, 0.198), black()); lid.position.set(0, 0.003, 0.099); lidP.add(lid);
  const lk = padlock(1); lk.position.set(0, 0.03, 0.1); box.add(lk);
  const label = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.022), new THREE.MeshBasicMaterial({ map: canvasTex(600, 132, (x, w, h) => { x.fillStyle = '#e8e4da'; x.fillRect(0, 0, w, h); txt(x, 'STIMULUS CONTROL', w / 2, h / 2 + 2, { font: '800 52px Archivo', color: '#16181c', track: 4, maxW: w * 0.92 }); }), transparent: true, opacity: 0 }));
  label.position.set(0, 0.03, 0.0985); box.add(label);
  // the cake, under a padlocked glass dome
  const cake = new THREE.Group(); cake.position.set(LOW.x + 0.16, LOW.top, LOW.z - 0.02); g.add(cake);
  const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.012, 64), phys({ color: 0xd8d4cc, roughness: 0.3, clearcoat: 0.6 })); stand.position.y = 0.006; cake.add(stand);
  const sponge = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.05, 64, 1, false, 0.3, Math.PI * 2 - 0.6), [phys({ color: 0xc89b6a, roughness: 0.8 }), phys({ color: 0xf1e9dc, roughness: 0.6 }), phys({ color: 0xf1e9dc, roughness: 0.6 })]); sponge.position.y = 0.037; cake.add(sponge);
  const cherry = new THREE.Mesh(new THREE.SphereGeometry(0.008, 24, 16), phys({ color: 0x8a1420, roughness: 0.2, clearcoat: 1 })); cherry.position.set(0.02, 0.07, 0.01); cake.add(cherry);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.085, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2), glass()); dome.position.y = 0.012; cake.add(dome);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.009, 16, 12), glass({ opacity: 0.6 })); knob.position.y = 0.1; cake.add(knob);
  const lk2 = padlock(1); lk2.position.set(0, 0.03, 0.088); cake.add(lk2);
  shadows(g); g.traverse((o) => o.layers.enable(1)); walls.castShadow = false; dome.castShadow = false;
  return { g, lidP, label, scr };
}

// ------------------------------------------------------------------ the neon sign, and the plaque under it (the gag)
function makeNeon(scene) {
  const g = new THREE.Group(); g.position.set(0, NEON.y, NEON.z); scene.add(g);
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(6, 3.2), phys({ color: 0x0f1013, roughness: 0.9, roughnessMap: noiseTex(3, 256, 0.85, 1.0, 20) })); wall.position.set(0, -0.1, -0.02); g.add(wall);
  const sign = canvasTex(1200, 600, (x, w, h) => { x.clearRect(0, 0, w, h);
    const draw = (blur, a) => { x.save(); x.filter = blur ? `blur(${blur}px)` : 'none'; x.globalAlpha = a; x.strokeStyle = '#bfe9ff'; x.lineWidth = 12; x.lineJoin = 'round'; x.font = '800 200px Archivo'; x.letterSpacing = '10px'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.strokeText('DOPAMINE', w / 2, h * 0.3); x.strokeText('DETOX', w / 2, h * 0.72); x.restore(); };
    draw(26, 0.8); draw(10, 0.9); draw(0, 1); });
  const tube = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.4), new THREE.MeshBasicMaterial({ map: sign, transparent: true, depthWrite: false, color: new THREE.Color(1.6, 1.6, 1.6), blending: THREE.AdditiveBlending }));
  g.add(tube);
  const plaque = new THREE.Mesh(new RoundedBoxGeometry(0.34, 0.06, 0.008, 2, 0.003), new THREE.MeshPhysicalMaterial({ color: 0xc9b37a, metalness: 0.9, roughness: 0.3 }));
  plaque.position.set(0.0, -0.52, 0.004); g.add(plaque);
  const pt = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.05), new THREE.MeshBasicMaterial({ map: canvasTex(1280, 200, (x, w, h) => { x.clearRect(0, 0, w, h); txt(x, 'TITLE NOT TO BE', w / 2, 62, { font: '800 66px Archivo', color: '#2b2312', track: 6 }); txt(x, 'TAKEN LITERALLY', w / 2, 146, { font: '800 66px Archivo', color: '#2b2312', track: 6 }); }), transparent: true }));
  pt.position.set(0.0, -0.52, 0.0085); g.add(pt);
  g.traverse((o) => o.layers.enable(1)); plaque.castShadow = true;
  return { g, tube, plaque, pt };
}

// ------------------------------------------------------------------ the gauges: dopamine, wanting, liking; later well-being and app use (the dopamine gauge becomes the logo)
function gaugeFace(label, lo, hi) {
  return canvasTex(600, 600, (x, w) => { const c = w / 2; x.fillStyle = '#e6e2d8'; x.beginPath(); x.arc(c, c, c, 0, Math.PI * 2); x.fill();
    for (let i = 0; i <= 20; i++) { const a = -Math.PI * 0.75 + (i / 20) * Math.PI * 1.5, big = i % 5 === 0, r0 = c * (big ? 0.7 : 0.76), r1 = c * 0.84;
      x.strokeStyle = '#26272b'; x.lineWidth = big ? 9 : 4; x.beginPath(); x.moveTo(c + Math.sin(a) * r0, c - Math.cos(a) * r0); x.lineTo(c + Math.sin(a) * r1, c - Math.cos(a) * r1); x.stroke(); }
    txt(x, lo, c - c * 0.5, c + c * 0.62, { font: '700 40px "Geist Mono"', color: '#26272b' }); txt(x, hi, c + c * 0.5, c + c * 0.62, { font: '700 40px "Geist Mono"', color: '#26272b' });
    txt(x, label, c, c + c * 0.32, { font: '800 50px Archivo', color: '#16181c', track: 4, maxW: w * 0.7 }); });
}
function makeGauges(scene) {
  const g = new THREE.Group(); g.position.set(PANEL.x, 0, PANEL.z); g.rotation.y = PANEL.rot; scene.add(g);
  const board = new THREE.Mesh(new RoundedBoxGeometry(0.62, 1.0, 0.04, 4, 0.01), black()); board.position.set(0, PANEL.y, -0.02); g.add(board);
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.025, PANEL.y - 0.5, 20), black()); post.position.set(0, (PANEL.y - 0.5) / 2, -0.04); g.add(post);
  const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.02, 48), black()); foot.position.set(0, 0.01, -0.04); g.add(foot);
  const mk = (label, lo, hi, x, y, r) => { const G = new THREE.Group(); G.position.set(x, y, 0.002); g.add(G);
    const bezel = new THREE.Mesh(new THREE.TorusGeometry(r, r * 0.06, 16, 96), phys({ color: 0x8e9299, metalness: 1, roughness: 0.3 })); G.add(bezel);
    const face = new THREE.Mesh(new THREE.CircleGeometry(r, 96), new THREE.MeshPhysicalMaterial({ map: gaugeFace(label, lo, hi), roughness: 0.4, clearcoat: 0.6 })); face.position.z = 0.001; G.add(face);
    const needle = new THREE.Group(); needle.position.z = 0.004; G.add(needle);
    const bar = new THREE.Mesh(new THREE.BoxGeometry(r * 0.05, r * 0.82, 0.002), phys({ color: 0x1c1d21, roughness: 0.4 })); bar.position.y = r * 0.34; needle.add(bar);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.08, r * 0.08, 0.004, 24), phys({ color: 0x1c1d21, roughness: 0.4 })); hub.rotation.x = Math.PI / 2; needle.add(hub);
    return { G, face, needle, r }; };
  const dop = mk('DOPAMINE', 'LOW', 'HIGH', 0, PANEL.y + 0.25, 0.13);
  const want = mk('WANTING', 'LOW', 'HIGH', -0.145, PANEL.y - 0.08, 0.115), like = mk('LIKING', 'LOW', 'HIGH', 0.145, PANEL.y - 0.08, 0.115);
  const well = mk('WELL-BEING', 'LOW', 'HIGH', -0.145, PANEL.y - 0.08, 0.115), app = mk('APP USE', 'LESS', 'MORE', 0.145, PANEL.y - 0.08, 0.115);
  well.G.visible = app.G.visible = false;
  const logo = makeLogoRing(LOGO_R); logo.g.position.set(0, PANEL.y + 0.25, 0.0062); g.add(logo.g);
  shadows(g); g.traverse((o) => o.layers.enable(1));
  return { g, dop, want, like, well, app, logo };
}
const setNeedle = (G, v) => { G.needle.rotation.z = -(-Math.PI * 0.75 + clamp01(v) * Math.PI * 1.5); };   // v: 0 = far left, 1 = far right

// ------------------------------------------------------------------ the experiment: a lamp (the cue), a dropper (the reward), a trace of spikes
function makeRig(scene) {
  const g = new THREE.Group(); g.position.set(RIG.x, 0, RIG.z); g.rotation.y = RIG.rot; scene.add(g);
  const box = new THREE.Mesh(new RoundedBoxGeometry(0.62, RIG.top, 0.36, 5, 0.012), black()); box.position.y = RIG.top / 2; g.add(box);
  const lampM = new THREE.MeshStandardMaterial({ color: 0x2a2b2f, emissive: new THREE.Color(0xfff1d6), emissiveIntensity: 0, roughness: 0.4 });
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.03, 32, 16), lampM); lamp.position.set(-0.085, RIG.top + 0.12, 0.08); g.add(lamp);
  const lstem = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.09, 12), black()); lstem.position.set(-0.085, RIG.top + 0.045, 0.08); g.add(lstem);
  const lglow = glowSprite(new THREE.Color(0xfff1d6), 0.22); lglow.position.copy(lamp.position); lglow.material.opacity = 0; g.add(lglow);
  // the dropper over a small dish
  const dropper = new THREE.Group(); dropper.position.set(0.075, RIG.top + 0.2, 0.08); g.add(dropper);
  const tubeG = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.004, 0.09, 24), glass({ opacity: 0.5 })); dropper.add(tubeG);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.013, 24, 16), phys({ color: 0x2a2b2f, roughness: 0.6 })); bulb.position.y = 0.05; dropper.add(bulb);
  const dish = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.03, 0.01, 48), glass({ opacity: 0.6 })); dish.position.set(0.075, RIG.top + 0.005, 0.08); g.add(dish);
  const drop = new THREE.Mesh(new THREE.SphereGeometry(0.0055, 20, 14), new THREE.MeshPhysicalMaterial({ color: 0xf2b84a, roughness: 0.05, transmission: 0.6, thickness: 0.01, clearcoat: 1 })); drop.visible = false; g.add(drop);
  // the trace: a screen of spikes
  const c = document.createElement('canvas'); c.width = 900; c.height = 600; const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.27, 0.18), new THREE.MeshBasicMaterial({ map: tex })); scr.position.set(0.0, RIG.top + 0.42, -0.0865); g.add(scr);
  const mon = new THREE.Mesh(new RoundedBoxGeometry(0.29, 0.2, 0.025, 3, 0.006), black()); mon.position.set(0.0, RIG.top + 0.42, -0.1); g.add(mon);
  const mstem = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.32, 0.02), black()); mstem.position.set(0.0, RIG.top + 0.16, -0.1); g.add(mstem);
  shadows(g); g.traverse((o) => o.layers.enable(1));
  return { g, lampM, lglow, dropper, drop, dish, c, tex, scr, key: '' };
}
// the experiment's clock: trial 1 (before learning) at 24.6, the drop lands at 26.1: a burst; trial 2 (after) the lamp at 28.0: a burst, the drop at 29.5: nothing
const EXP = { d1: 26.1, lamp2: 28.05, d2: 29.55 };
function drawTrace(E, t) {
  const key = Math.round(t * 24); if (key === E.key) return; E.key = key;
  const x = E.c.getContext('2d'), w = E.c.width, h = E.c.height; x.fillStyle = '#07090c'; x.fillRect(0, 0, w, h);
  x.strokeStyle = 'rgba(160,190,230,0.18)'; x.lineWidth = 2; for (let k = 1; k < 6; k++) { x.beginPath(); x.moveTo((k / 6) * w, 0); x.lineTo((k / 6) * w, h); x.stroke(); }
  txt(x, 'DOPAMINE CELL', 24, 40, { font: '700 30px "Geist Mono"', color: '#8fa7c9', align: 'left', track: 4 });
  // two rows: before learning, after learning; each a 3-second window ending now (or frozen when its trial is done)
  const rows = [{ y: h * 0.42, t0: EXP.d1 - 2.0, cue: null, rew: EXP.d1, burstAt: EXP.d1, lab: 'SURPRISE REWARD' }, { y: h * 0.82, t0: EXP.lamp2 - 0.6, cue: EXP.lamp2, rew: EXP.d2, burstAt: EXP.lamp2, lab: 'LIGHT, THEN REWARD' }];
  rows.forEach((R, ri) => { const span = 3.0, tEnd = Math.min(t, R.t0 + span), vis = t > R.t0 - 0.1;
    if (!vis) return;
    txt(x, R.lab, 24, R.y - 92, { font: '700 26px "Geist Mono"', color: '#6f87a8', align: 'left', track: 3 });
    x.strokeStyle = 'rgba(160,190,230,0.35)'; x.beginPath(); x.moveTo(0, R.y); x.lineTo(w, R.y); x.stroke();
    const X = (tt) => ((tt - R.t0) / span) * w;
    if (R.cue && tEnd > R.cue) { x.fillStyle = 'rgba(255,241,214,0.25)'; x.fillRect(X(R.cue), R.y - 80, 10, 80); }
    if (tEnd > R.rew) { x.fillStyle = 'rgba(242,184,74,0.35)'; x.fillRect(X(R.rew), R.y - 80, 10, 80); }
    // spikes: a slow background, a burst after the event that carries the surprise
    for (let k = 0; k < 400; k++) { const st = R.t0 + (k / 400) * span; if (st > tEnd) break;
      const base = hash(k * 7.1 + ri * 13) < 0.05, burst = st > R.burstAt + 0.04 && st < R.burstAt + 0.24 && hash(k * 3.3 + ri) < 0.55;
      if (base || burst) { x.strokeStyle = '#dfeaff'; x.lineWidth = 3; x.beginPath(); x.moveTo(X(st), R.y); x.lineTo(X(st), R.y - (burst ? 60 : 34)); x.stroke(); } }
  });
  E.tex.needsUpdate = true;
}

// ------------------------------------------------------------------ the TV in front: it comes on for "and TV, alone"
function makeTV(scene) {
  const g = new THREE.Group(); g.position.set(TV.x, 0, TV.z); g.rotation.y = TV.rot; scene.add(g);
  const cab = new THREE.Mesh(new RoundedBoxGeometry(0.9, 0.42, 0.36, 4, 0.01), black()); cab.position.y = 0.21; g.add(cab);
  const set = new THREE.Mesh(new RoundedBoxGeometry(0.86, 0.5, 0.04, 3, 0.008), phys({ color: 0x0b0c0e, roughness: 0.3, clearcoat: 0.6 })); set.position.y = 0.42 + 0.06 + 0.25; g.add(set);
  const stand = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.06, 0.1), black()); stand.position.y = 0.45; g.add(stand);
  const sm = new THREE.MeshBasicMaterial({ color: new THREE.Color(0, 0, 0), map: canvasTex(640, 360, (x, w, h) => { const gr = x.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#9fb7e8'); gr.addColorStop(0.5, '#e7d8c6'); gr.addColorStop(1, '#6f86c9'); x.fillStyle = gr; x.fillRect(0, 0, w, h); x.fillStyle = 'rgba(20,24,40,0.55)'; x.fillRect(0, h * 0.62, w, h * 0.38); x.fillStyle = 'rgba(255,255,255,0.7)'; x.beginPath(); x.arc(w * 0.7, h * 0.32, 40, 0, Math.PI * 2); x.fill(); }) });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.82, 0.46), sm); screen.position.set(0, 0.42 + 0.06 + 0.25, 0.0205); g.add(screen);
  const light = new THREE.PointLight(0x9fc0ff, 0, 3.0, 2); light.position.set(0, 0.73, 0.35); g.add(light);
  shadows(g); g.traverse((o) => o.layers.enable(1));
  return { g, screen, sm, light };
}

// ------------------------------------------------------------------ build
let ARMS = null;
async function build(S, cfg) {
  const scene = S.scene;
  S.fog.near = 4; S.fog.far = 14;
  S.table.scale.set(3, 3, 1); S.tableMat.clearcoat = 0.1; S.tableMat.specularIntensity = 0.3;
  for (const m of [S.tableMat.map, S.tableMat.roughnessMap]) if (m) { m.wrapS = m.wrapT = THREE.RepeatWrapping; m.repeat.multiplyScalar(3); }
  const meshes = await loadAnatomy(skeletonKind());
  const R = W.rig = buildRig(meshes);
  W.body = new THREE.Group(); scene.add(W.body); R.root.position.copy(R.P0).negate(); W.body.add(R.root);
  for (const m of meshes) { m.castShadow = true; m.receiveShadow = true; m.layers.enable(1); }
  W.meshes = meshes;
  { const oc = R.byName.get('Occipital bone'); oc.material = oc.material.clone();   // the factory stamp: on the back of its head, seen in the TV shot
    W.stampSpot = stampSpot(oc, { from: [0, 0.03, -0.15], dir: [0, 0, 1], spread: 0.004 });
    if (W.stampSpot) W.stamp = stamp(oc, { canvas: stampCanvas(['HUMAN FACTORY', 'SETTINGS'], '', { frame: false }), center: W.stampSpot.center, normal: W.stampSpot.normal, up: [0, 1, 0], width: 0.042, depth: 0.03, opacity: 0.55 }); }
  const hipB = new THREE.Box3(); for (const m of meshes) if (/hip bone/i.test(m.userData.name)) for (const v of worldVerts(m, 3)) hipB.expandByPoint(v);
  W.sitP = new THREE.Vector3(0, SEAT - 0.012 + (R.P0.y - hipB.min.y), 0.02);
  // ---- the set
  W.room = makeRoom(scene); W.neon = makeNeon(scene); W.gauges = makeGauges(scene); W.exp = makeRig(scene); W.tv = makeTV(scene);
  poseBody(0); ARMS = solveArms();
  // ---- light
  W.key = spot(scene, { color: 0xdfe6ff, pos: new THREE.Vector3(1.4, 2.6, 1.6), target: new THREE.Vector3(0, 0.75, 0.2), angle: 0.45, penumbra: 0.8, shadow: true, size: cfg.shadow ?? 1024 }); W.key.shadow.camera.far = 7;
  W.rim = spot(scene, { color: 0xa9c4ff, pos: new THREE.Vector3(-1.0, 2.2, -0.9), target: new THREE.Vector3(0, 1.0, 0), angle: 0.5, penumbra: 0.9 });
  W.fill = spot(scene, { color: 0xc8d6ff, pos: new THREE.Vector3(-1.6, 1.3, 1.6), target: new THREE.Vector3(0, 0.8, 0.2), angle: 0.6, penumbra: 1 });
  W.neonLight = new THREE.PointLight(0xbfe9ff, 0, 2.6, 2); W.neonLight.position.set(0, NEON.y, NEON.z + 0.25); scene.add(W.neonLight);
  W.gaugeLight = spot(scene, { color: 0xfff1d8, pos: new THREE.Vector3(-0.2, 2.3, 1.0), target: new THREE.Vector3(PANEL.x, PANEL.y, PANEL.z), angle: 0.32, penumbra: 0.7 });
  W.rigLight = spot(scene, { color: 0xfff1d8, pos: new THREE.Vector3(0.4, 2.2, 1.1), target: new THREE.Vector3(RIG.x, RIG.top + 0.1, RIG.z), angle: 0.3, penumbra: 0.7 });
  W.tableLight = spot(scene, { color: 0xfff1d8, pos: new THREE.Vector3(0.3, 2.0, 1.2), target: new THREE.Vector3(LOW.x, LOW.top, LOW.z), angle: 0.25, penumbra: 0.7 });
  return { stamp: W.stampSpot, sitP: W.sitP.toArray(), arms: ARMS && [ARMS.Right.err, ARMS.Left.err] };
}

// ------------------------------------------------------------------ the body: seated, hands on its knees; it looks at whatever is lit
function solveArms() {
  const R = W.rig, out = {};
  for (const Side of ['Right', 'Left']) {
    const A = R.arms[Side], G = R.legs[Side]; R.root.updateMatrixWorld(true);
    const knee = G.K.clone().sub(R.pivots.get(G.knee)).applyMatrix4(G.knee.matrixWorld), hand = knee.clone().add(new THREE.Vector3(0, 0.035, -0.06)), h = new THREE.Vector3();
    const err = (p) => { poseArm(A, p); A.girdle.updateMatrixWorld(true); A.mc.getWorldPosition(h); return h.distanceTo(hand); };
    let best = { dir: [0.12, -0.8, 0.55], twist: 0.6, elbow: 0.9, retract: 0, elevate: 0 }, bestE = err(best);
    for (const st of [0.25, 0.12, 0.06, 0.03, 0.015, 0.007, 0.003]) for (let it = 0; it < 40; it++) {
      let improved = false;
      for (const key of ['d0', 'd1', 'd2', 'twist', 'elbow']) for (const sg of [-1, 1]) {
        const c = { ...best, dir: [...best.dir] }; if (key[0] === 'd') c.dir[+key[1]] += sg * st; else c[key] += sg * st * 2;
        c.elbow = Math.min(2.6, Math.max(0, c.elbow)); const E = err(c); if (E < bestE) { bestE = E; best = c; improved = true; } }
      if (!improved) break; }
    out[Side] = { ...best, err: bestE };
  }
  return out;
}
const _qa = new THREE.Quaternion();
function lookAt(t) {   // where the head turns: the table, the gauges (its right), the experiment (its left), the TV (ahead)
  const toGauge = pulse(t, 6.4, 22.4, 0.8) + pulse(t, 31.2, 35.8, 0.8) + pulse(t, 61.8, 68.8, 0.8), toRig = pulse(t, 22.6, 30.9, 0.8);
  const tv = ss(59.9, 60.7, t) * (1 - ss(74.8, 75.6, t));
  return { yaw: -0.55 * toGauge + 0.5 * toRig, pitch: 0.28 * (1 - Math.max(toGauge, toRig, tv)) + 0.05 * tv };
}
function poseBody(t) {
  const R = W.rig, br = 0.5 - 0.5 * Math.cos((t / 4.4) * Math.PI * 2), L = lookAt(t);
  bendSpine(R.seg, { lum: 0.1, tho: 0.18 + 0.01 * br, cer: L.pitch, twist: L.yaw * 0.6 });
  R.seg.Atlas.g.rotation.y += L.yaw * 0.5;
  if (ARMS) { poseArm(R.arms.Right, ARMS.Right); poseArm(R.arms.Left, ARMS.Left); } else { const a = { dir: [0.12, -0.8, 0.55], twist: 0.6, elbow: 0.9 }; poseArm(R.arms.Right, a); poseArm(R.arms.Left, a); }
  W.body.quaternion.identity(); W.body.position.copy(W.sitP); W.body.updateMatrixWorld(true);
  for (const Side of ['Right', 'Left']) {
    const G = R.legs[Side]; _qa.setFromAxisAngle(X, -Math.PI / 2); G.hip.quaternion.copy(_qa);
    const tgt = new THREE.Vector3(W.sitP.x + G.s * 0.14, G.A.y - G.ground + 0.002, W.sitP.z + 0.44);
    legIK(R, Side, tgt, new THREE.Quaternion(), Z);
  }
  W.body.updateMatrixWorld(true);
}

// ------------------------------------------------------------------ the camera: one path, no cuts
let CAM = null;
function gaugeView(d, h) { const n = new THREE.Vector3(Math.sin(PANEL.rot), 0, Math.cos(PANEL.rot)); return V3(PANEL.x + n.x * d, h, PANEL.z + n.z * d); }
function rigView(d, h) { const n = new THREE.Vector3(Math.sin(RIG.rot), 0, Math.cos(RIG.rot)); return V3(RIG.x + n.x * d, h, RIG.z + n.z * d); }
function buildCam() {
  const G = V3(PANEL.x, PANEL.y + 0.13, PANEL.z), Rg = V3(RIG.x, 1.15, RIG.z), Nn = V3(0.2, NEON.y - 0.12, NEON.z), Bx = new THREE.Vector3(LOW.x - 0.17, LOW.top + 0.03, LOW.z + 0.02), BxA = V3(Bx.x, Bx.y, Bx.z);
  const Gd = V3(PANEL.x, PANEL.y + 0.25, PANEL.z), n = new THREE.Vector3(Math.sin(PANEL.rot), 0, Math.cos(PANEL.rot)), dial = new THREE.Vector3(PANEL.x, PANEL.y + 0.25, PANEL.z).add(n.clone().multiplyScalar(0.006));
  W.dialW = dial;
  return camTrack([
    { t: -3.0, p: V3(1.3, 1.32, 2.6), l: V3(0.0, 0.95, 0.0), fov: 32 },
    { t: 0.0, p: V3(1.27, 1.31, 2.55), l: V3(0.0, 0.95, 0.0), fov: 32, tens: 0.5 },                  // the room: the skeleton, the locked fun, the neon
    { t: 5.6, p: V3(1.12, 1.27, 2.25), l: V3(0.0, 0.95, -0.05), fov: 32, stop: true },
    { t: 7.2, p: gaugeView(1.75, 1.32), l: G, fov: 32, stop: true },                                  // the gauges: wanting, liking
    { t: 22.0, p: gaugeView(1.68, 1.3), l: G, fov: 32, stop: true },
    { t: 23.6, p: rigView(1.33, 1.21), l: Rg, fov: 32, stop: true },                                   // the experiment
    { t: 30.8, p: rigView(1.29, 1.2), l: Rg, fov: 32, stop: true },
    { t: 32.0, p: gaugeView(1.75, 1.32), l: G, fov: 32, stop: true },                                  // a day off: the dopamine gauge holds
    { t: 35.9, p: gaugeView(1.7, 1.3), l: G, fov: 32, stop: true },
    { t: 37.3, p: V3(0.6, 1.62, 1.35), l: V3(0.0, NEON.y - 0.04, NEON.z), fov: 36, stop: true },          // the neon, and its plaque, under the captions (its head out of shot, left)
    { t: 40.95, p: V3(0.62, 1.6, 1.2), l: V3(0.0, NEON.y - 0.06, NEON.z), fov: 36, stop: true },
    { t: 41.75, p: V3(0.55, NEON.y - 0.52, -0.1), l: V3(0.0, NEON.y - 0.52, NEON.z), fov: 30, stop: true },  // down to the plaque, the sign just out of shot
    { t: 42.9, p: V3(0.53, NEON.y - 0.52, -0.13), l: V3(0.0, NEON.y - 0.52, NEON.z), fov: 30, stop: true },
    { t: 43.6, p: V3(0.45, 1.65, 0.45), l: V3(-0.12, 0.5, 0.6), fov: 34 },                               // up past its shoulder, down to the table
    { t: 44.4, p: V3(Bx.x + 0.35, Bx.y + 0.38, Bx.z + 0.5), l: BxA, fov: 32, stop: true },             // the phone box: the lid closes
    { t: 51.0, p: V3(Bx.x + 0.33, Bx.y + 0.36, Bx.z + 0.48), l: BxA, fov: 32, stop: true },
    { t: 51.9, p: V3(0.12, 1.66, 0.42), l: V3(0.0, 0.47, 0.72), fov: 36 },                               // up off the table, back over its head
    { t: 52.6, p: V3(0.1, 2.12, -0.5), l: V3(0.0, 0.56, 1.53), fov: 40, stop: true },                  // the back of its skull, small, before the TV: an hour a day; the TV comes on, alone
    { t: 61.6, p: V3(0.1, 2.28, -0.86), l: V3(0.0, 0.54, 1.53), fov: 40, stop: true },
    { t: 61.82, p: V3(0.09, 2.2, -0.66), l: V3(-0.1, 0.55, 0.7), fov: 38 },                            // down past its skull to the table
    { t: 62.08, p: V3(0.06, 2.02, -0.22), l: G, fov: 35 },                                              // over its head, to the gauges
    { t: 62.8, p: gaugeView(1.75, 1.32), l: G, fov: 32, stop: true },                                  // well-being, app use
    { t: 68.6, p: gaugeView(1.7, 1.3), l: G, fov: 32, stop: true },
    { t: 70.0, p: V3(1.35, 1.35, 2.7), l: V3(0.0, 0.85, 0.2), fov: 32, stop: true },                   // the room
    { t: 74.8, p: V3(1.3, 1.33, 2.62), l: V3(0.0, 0.85, 0.2), fov: 32, stop: true },
    { t: 76.3, p: V3(dial.x + n.x * 0.62, dial.y + 0.02, dial.z + n.z * 0.62), l: V3(dial.x, dial.y, dial.z), fov: 30 },
    { t: T.logo, p: V3(dial.x + n.x * 0.435, dial.y, dial.z + n.z * 0.435), l: V3(dial.x, dial.y, dial.z), fov: 30, stop: true },   // face on to the dopamine gauge: the logo
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
function focusAt(S, t, P) { return Math.hypot(P.p[0] - P.l[0], P.p[1] - P.l[1], P.p[2] - P.l[2]); }

// ------------------------------------------------------------------ one moment of the film
function update(S, t) {
  const scene = S.scene, endDark = ss(T.factory - 0.5, T.logo - 0.3, t);
  poseBody(t);
  // ---- the gauges
  { const Gs = W.gauges, wantUp = s5(T.drives - 0.2, T.wanting + 0.4, t) * (1 - s5(T.parkinsons - 0.6, T.parkinsons, t)), dropD = s5(T.lose - 0.1, T.dopamine3 + 0.4, t) * (1 - s5(23.0, 24.0, t));
    const jit = (k) => 0.008 * Math.sin(t * (5.1 + k) + k * 2.0);
    setNeedle(Gs.dop, 0.55 + 0.25 * wantUp - 0.38 * dropD + jit(1)); setNeedle(Gs.want, 0.35 + 0.5 * wantUp - 0.2 * dropD + jit(2)); setNeedle(Gs.like, 0.55 + jit(3));
    const swap = t > 61.6 && t < 74.0; Gs.want.G.visible = Gs.like.G.visible = !swap; Gs.well.G.visible = Gs.app.G.visible = swap;
    setNeedle(Gs.well, 0.5 + 0.06 * s5(T.wellbeing + 0.6, T.little + 0.4, t) + jit(4)); setNeedle(Gs.app, 0.62 - 0.14 * s5(T.t22 - 0.2, T.less + 0.3, t) + jit(5));
    const lk = s5(T.back + 0.3, T.logo - 0.25, t); Gs.logo.set({ weight: lk, white: lk, hours: 0, hand: ss(T.logo - 0.4, T.logo - 0.15, t), handScale: outBack(clamp01((t - (T.logo - 0.4)) / 0.35), 1.8) });
    Gs.dop.needle.visible = lk < 0.5; Gs.dop.face.material.opacity = 1; }
  // ---- the experiment: before learning, the drop surprises; after, the lamp predicts it
  { const E = W.exp, lampOn = pulse(t, EXP.lamp2 - 0.02, EXP.lamp2 + 0.9, 0.08);
    E.lampM.emissiveIntensity = 2.5 * lampOn; E.lglow.material.opacity = 0.8 * lampOn;
    let dv = false; for (const td of [EXP.d1, EXP.d2]) { const u = (t - (td - 0.35)) / 0.35; if (u > 0 && u < 1) { dv = true; E.drop.position.set(0.075, RIG.top + 0.155 - 0.14 * u * u, 0.08); } }
    E.drop.visible = dv; if (t > 23.0 && t < 31.5) drawTrace(E, t); }
  // ---- the phone box's lid closes; its label
  { const R2 = W.room, k = s5(T.phone - 0.2, T.harder + 0.2, t); R2.lidP.rotation.x = -1.6 * (1 - k); R2.label.material.opacity = s5(T.behaviour - 0.3, T.behaviour + 0.3, t); }
  // ---- the neon: on; its plaque is always there, small (the camera finds it on "catchy")
  { const N = W.neon, fl = 1 - 0.08 * (hash(Math.floor(t * 9)) > 0.93 ? 1 : 0); N.tube.material.color.setScalar(1.6 * fl * (1 - endDark)); W.neonLight.intensity = 0.9 * fl * (1 - endDark); }
  // ---- the TV comes on
  { const V = W.tv, on = ss(T.tv - 0.1, T.tv + 0.25, t) * (1 - ss(74.8, 75.6, t)), fl = 0.85 + 0.15 * Math.sin(t * 7.3) * Math.sin(t * 3.1);
    V.sm.color.setRGB(0.16 * on * fl, 0.2 * on * fl, 0.3 * on * fl); V.light.intensity = 1.4 * on * fl; }
  // ---- light
  const fig = 1 - endDark;
  W.key.intensity = 10 * fig * (1 - 0.55 * pulse(t, 60.2, 62.6, 0.5)); W.rim.intensity = 4 * fig * (1 - 0.6 * pulse(t, 60.2, 62.6, 0.5)); W.fill.intensity = 1.0 * fig;
  W.gaugeLight.intensity = 7 * fig; W.rigLight.intensity = 9 * fig; W.tableLight.intensity = 1.6 * fig;
  S.tableMat.color.setScalar(0.32 * (1 - endDark * 0.9)); scene.environmentIntensity = 0.12 * (1 - endDark); S.reflAmt = 0.5 * (1 - endDark);
}

// ------------------------------------------------------------------ the words on screen
const CAPS = [
  { t0: 0.35, t1: 2.15, top: 300, size: 96, html: 'Dopamine <em>detox.</em>' },
  { t0: 2.39, t1: 6.45, top: 292, size: 76, html: 'Ban all fun, and reset your<br>brain&rsquo;s <em>pleasure chemical</em>' },
  { t0: 6.8, t1: 12.05, top: 292, size: 72, html: 'Few brain scientists who<br>study reward say dopamine<br><em>causes pleasure</em>' },
  { t0: 12.27, t1: 14.8, top: 300, size: 86, html: 'It drives <em>wanting,</em><br>not liking' },
  { t0: 15.3, t1: 22.35, top: 292, size: 68, html: 'People with Parkinson&rsquo;s,<br>who lose much of their<br>dopamine, still find<br>sweetness <em>just as pleasant</em>' },
  { t0: 22.84, t1: 30.95, top: 292, size: 68, html: 'In animal studies, dopamine<br>cells fire at a <em>surprise reward,</em><br>then switch to firing at<br>what predicts it' },
  { t0: 31.46, t1: 33.9, top: 292, size: 78, html: 'Does a day off lower<br>your dopamine?' },
  { t0: 34.14, t1: 35.95, top: 300, size: 86, html: 'Harvard Health<br>says <em>no.</em>' },
  { t0: 36.42, t1: 40.7, top: 292, size: 74, html: 'Even its creator says<br>it isn&rsquo;t about<br><em>reducing dopamine</em>' },
  { t0: 40.9, t1: 42.9, top: 300, size: 86, html: 'The name was<br><em>just catchy.</em>' },
  { t0: 43.38, t1: 48.4, top: 292, size: 72, html: 'It&rsquo;s behaviour therapy: put<br>the phone away, or make it<br><em>harder to reach</em>' },
  { t0: 48.61, t1: 51.4, top: 292, size: 80, html: 'Not a bad idea.<br><em>Not a new one.</em>' },
  { t0: 51.89, t1: 57.35, top: 292, size: 70, html: 'In a big trial, four weeks off<br>one social network freed up<br><em>an hour a day</em>' },
  { t0: 57.58, t1: 61.7, top: 292, size: 76, html: 'More time with family<br>and friends. <em>And TV, alone.</em>' },
  { t0: 62.21, t1: 64.1, top: 300, size: 86, html: 'Well-being rose<br><em>a little.</em>' },
  { t0: 64.35, t1: 68.8, top: 292, size: 74, html: 'Afterwards, they reported<br>using the app <em>22% less</em>' },
  { t0: 69.3, t1: 72.35, top: 292, size: 76, html: 'Don&rsquo;t cut out people<br>or exercise for it.' },
  { t0: 72.58, t1: 74.8, top: 292, size: 80, html: 'The method never<br><em>asked you to.</em>' },
  { t0: 75.55, t1: 99, top: 360, size: 96, html: 'Back to<br><em>factory settings.</em>' },
];
const OVL = {};
function overlayInit(S) {
  const O = S.O, tag = (cls, txt2, size, bsize) => { const e = O.tag(cls, txt2); e.style.fontSize = size + 'px'; const b = e.querySelector('b'); if (b && bsize) b.style.fontSize = bsize + 'px'; return e; };
  OVL.trial = tag('tag', '2,743 users, 4 weeks off<b>60 minutes a day freed</b>', 22, 34);
  OVL.well = tag('tag', 'Well-being<b>up 0.09 standard deviations</b>', 22, 32);
}
function overlay(S, t) {
  place(S, OVL.trial, new THREE.Vector3(TV.x - 0.18, 0.36, TV.z), -150, -40, pulse(t, T.hour - 0.2, 57.4));
  place(S, OVL.well, new THREE.Vector3(PANEL.x, PANEL.y - 0.3, PANEL.z), -140, 0, pulse(t, T.little, 64.2));
  const c = W.dialW || new THREE.Vector3(PANEL.x, PANEL.y + 0.25, PANEL.z), n = new THREE.Vector3(Math.sin(PANEL.rot), 0, Math.cos(PANEL.rot));
  const edge = c.clone().add(new THREE.Vector3(0, LOGO_R, 0));
  logoEnd(S, t, { t0: T.logo, center: c, edge });
  void n;
}

makeFilm({
  T, caps: CAPS, subs: [], build, update, pose: camPose, overlay, overlayInit, focus: focusAt,
  stage: { bg: 0x07080a, reflSize: 6, env: 0.12, far: 30 },
  aperture: [[0, 0.004], [7.2, 0.003], [23.6, 0.003], [37.3, 0.004], [44.4, 0.004], [52.6, 0.003], [61.4, 0.004], [70.0, 0.003], [76.3, 0.003]],
  bloom: [[0, 0.5], [75, 0.55]],
});

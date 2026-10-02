// Human Factory Settings · Film 3 "Ten thousand steps a day. Who decided that?" · one continuous shot, 9:16.
// A skeleton walks with a 1965 pedometer clipped to its hip bone. Science turns the walk into a hill: steep to 7,000,
// then flat. The skeleton stops where the benefit stops; the 10,000 sign is just a slogan.
import { THREE, ORANGE, ss, s5, lerp, clamp01, hash, camTrack, phys, glowMat, shadows, spot, glowSprite,
  loadAnatomy, tissueMat, V3, vadd, place, logoEnd, makeFilm, outBack } from '../kit.js';
import { buildRig, skeletonKind, walkAt, legIK, bendSpine, poseArm, ARM0, worldVerts } from '../rig.js';

// ------------------------------------------------------------------ timing, from the voice guide (word starts)
const T = {
  end: 77.3,
  q0: 0.35, day: 1.91, who: 2.48,                     // "Ten thousand steps a day. Who decided that?"
  co: 4.85, y1965: 7.22,                              // "Probably a Japanese company, in nineteen sixty-five."
  sold: 9.36, name: 11.51, meter: 12.86,              // "It sold a pedometer whose name meant ten-thousand-steps meter."
  sci: 14.15, mkt: 16.79,                             // "The scientist who traced it called the name a marketing tool."
  meas: 18.58, s57: 20.62, devices: 23.74,            // "So scientists measured. Fifty-seven studies, with steps counted by devices, not by memory."
  comp: 26.6, two: 27.56, seven: 28.83, p47: 30.88, dying: 33.63,   // "Compared with two thousand ... seven thousand ... forty-seven percent ... dying early."
  dem: 35.66, dep: 38.57, falls: 41.28,               // "Dementia, ... Depression symptoms, ... Falls, ..."
  above: 43.38, small: 46.48,                         // "Above seven thousand, the extra benefit was small for most outcomes."
  women: 49.04, k75: 53.21,                           // "In a study of older women, the benefit leveled off around seven and a half thousand."
  slogan1: 55.39, slogan2: 58.13,                     // "Ten thousand was never the science. It was the slogan."
  link: 60.23, sick: 63.06,                           // "These studies show a link, not proof. Sick people walk less, too."
  aim: 65.7, far: 68.71, add: 70.43,                  // "So aim for about seven thousand a day. Far below that? Add a thousand at a time."
  final: 72.99, logo: 74.9,                           // "Back to factory settings."
};

// ------------------------------------------------------------------ the hill: steps a day along z, the benefit as height
const PER = 1.5;                       // metres of path per 1,000 steps a day; 2,000 steps sits at z = 0
const H = 0.94;                        // height at 7,000 steps: 47 percent lower risk, drawn at 2 m per 100 percent
const zOf = (k) => (k - 2) * PER;      // k = thousands of steps a day
const KC = 0.45, NORM = 1 - Math.exp(-5 * KC);
function hill(z) {                     // an illustrative curve through the two numbers the film states, steep then flat
  if (z <= -0.25) return 0;
  const x = Math.max(0, z / PER), y = (H * (1 - Math.exp(-KC * x))) / NORM;
  return y * ss(-0.25, 0.45, z);
}
const slopeOf = (z) => Math.atan2(hill(z + 0.02) - hill(z - 0.02), 0.04);
const Z_END = zOf(12.4);

// ------------------------------------------------------------------ the world
const W = {}; window.HFS_W = W;
const FLOOR = 0.4;                     // the walnut floor, darkened: the hill and the walker carry the light
const STRIDE = 7.9 / 7;                // seven strides from the foot of the hill to the top
const HS_STOP1 = -0.45, HS_STOP2 = HS_STOP1 + 7 * STRIDE;   // where the leading heel stands: before the hill, and at 7,000

function brainKind(p) {
  if (p.system !== 'nervous') return undefined;
  const cy = (p.bounds[0][1] + p.bounds[1][1]) / 2;
  if (cy < 1.45 || p.vertexCount < 400 || /nerve|optic|tentorium/i.test(p.name)) return null;
  return 'brain';
}

// the pedometer: chrome case, enamel dial 0 to 14 (thousand) over 270 degrees, so 7,000 points straight up; a rolling counter
function pedometerFace(c, count, logoK) {
  const x = c.getContext('2d'), S = c.width, R = S / 2;
  x.clearRect(0, 0, S, S);
  x.fillStyle = '#f3efe6'; x.beginPath(); x.arc(R, R, R, 0, Math.PI * 2); x.fill();
  // the scale
  for (let i = 0; i <= 28; i++) {
    const a = (-135 + (270 * i) / 28) * (Math.PI / 180), big = i % 2 === 0;
    const r0 = R * (big ? 0.72 : 0.77), r1 = R * 0.86;
    x.strokeStyle = '#1b1c1f'; x.lineWidth = big ? S * 0.012 : S * 0.006;
    x.beginPath(); x.moveTo(R + Math.sin(a) * r0, R - Math.cos(a) * r0); x.lineTo(R + Math.sin(a) * r1, R - Math.cos(a) * r1); x.stroke();
    if (big) { x.fillStyle = '#1b1c1f'; x.font = `600 ${S * 0.075}px Archivo`; x.textAlign = 'center'; x.textBaseline = 'middle';
      x.fillText(String(i / 2), R + Math.sin(a) * R * 0.6, R - Math.cos(a) * R * 0.6); }
  }
  x.fillStyle = '#1b1c1f'; x.font = `500 ${S * 0.1}px "Noto Serif CJK JP", serif`; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText('万歩計', R, R * 0.66);
  x.font = `500 ${S * 0.045}px "Geist Mono"`; x.fillStyle = '#55575c'; x.fillText('×1000', R, R * 0.83);
  x.fillText('1965', R, R * 1.62);
  // the counter window, its digits rolling like an odometer
  const ww = S * 0.42, wh = S * 0.12, wx = R - ww / 2, wy = R * 1.26 - wh / 2;
  x.fillStyle = '#121315'; x.fillRect(wx, wy, ww, wh);
  x.save(); x.beginPath(); x.rect(wx, wy, ww, wh); x.clip();
  x.font = `600 ${wh * 0.78}px "Geist Mono"`; x.fillStyle = '#f3efe6'; x.textBaseline = 'middle';
  const n = Math.max(0, count), whole = Math.floor(n), frac = n - whole, roll = s5(0.7, 1.0, frac);
  for (let d = 0; d < 5; d++) {
    const p = Math.pow(10, 4 - d), dig = Math.floor(whole / p) % 10;
    const turning = (whole % p) === p - 1 ? roll : 0;                       // a digit turns when everything right of it is about to roll over
    const cx = wx + ww * (0.1 + d * 0.2);
    x.textAlign = 'center'; for (const [v, off] of [[dig, -turning], [(dig + 1) % 10, 1 - turning]]) x.fillText(String(v), cx, wy + wh / 2 + off * wh);
  }
  x.restore();
  // the logo's face, for the end: black, a white ring, eleven ticks
  if (logoK > 0) {
    x.globalAlpha = logoK; x.fillStyle = '#060607'; x.beginPath(); x.arc(R, R, R, 0, Math.PI * 2); x.fill();
    const u = R / 21.2;   // the logo's ring, its stroke's outer edge on the rim of the face
    x.strokeStyle = '#eceef1'; x.lineWidth = 1.4 * u; x.beginPath(); x.arc(R, R, 20.5 * u, 0, Math.PI * 2); x.stroke();
    x.globalAlpha = logoK * 0.55; x.lineWidth = u; x.lineCap = 'round';
    for (let d = 30; d < 360; d += 30) { const a = (d * Math.PI) / 180; x.beginPath(); x.moveTo(R + Math.sin(a) * 15.2 * u, R - Math.cos(a) * 15.2 * u); x.lineTo(R + Math.sin(a) * 17.6 * u, R - Math.cos(a) * 17.6 * u); x.stroke(); }
    x.globalAlpha = 1;
  }
}

async function build(S, cfg) {
  const scene = S.scene;
  S.fog.near = 7; S.fog.far = 32;
  S.table.scale.set(5, 5, 1); S.table.position.z = 6; S.tableMat.clearcoat = 0.06; S.tableMat.specularIntensity = 0.3;
  for (const m of [S.tableMat.map, S.tableMat.roughnessMap]) if (m) { m.wrapS = m.wrapT = THREE.RepeatWrapping; m.repeat.multiplyScalar(5); }
  // ---- the skeleton, its brain
  const meshes = await loadAnatomy(skeletonKind(brainKind));
  W.rig = buildRig(meshes); scene.add(W.rig.root);
  for (const m of meshes) { m.castShadow = true; m.receiveShadow = true; m.layers.enable(1); }
  W.brain = meshes.filter((m) => m.userData.tissue === 'brain');
  for (const m of W.brain) { m.material.transparent = true; m.material.opacity = 0; m.visible = false; m.castShadow = false; m.material.emissive.set(0xffb27a); }
  W.skull = meshes.filter((m) => m.parent === W.rig.seg.Atlas.g && m.userData.tissue !== 'brain');
  for (const m of W.skull) m.material.transparent = true;
  W.hips = meshes.filter((m) => /hip bone|femur|sacrum/i.test(m.userData.name));
  // ---- the pedometer, clipped to the front of the right hip bone (the iliac spine), facing forward, clear of the swinging arm
  const hb = worldVerts(W.rig.byName.get('Right hip bone')); let top = -9; for (const v of hb) top = Math.max(top, v.y);
  const asis = hb.filter((v) => v.y > top - 0.09).reduce((a, v) => (v.z > a.z ? v : a)).clone();
  W.ped = new THREE.Group(); W.ped.position.copy(asis).sub(W.rig.P0).add(new THREE.Vector3(-0.004, -0.018, 0.016)); W.rig.pelvis.add(W.ped);
  const PR = 0.026, chrome = phys({ color: 0xd8dbe0, metalness: 1, roughness: 0.16, clearcoat: 0.6 });
  const caseM = new THREE.Mesh(new THREE.CylinderGeometry(PR, PR, 0.013, 96), chrome); caseM.rotation.x = Math.PI / 2; W.ped.add(caseM);
  const bezel = new THREE.Mesh(new THREE.TorusGeometry(PR - 0.0012, 0.0016, 16, 128), chrome); bezel.position.z = 0.0068; W.ped.add(bezel);
  W.faceCanvas = document.createElement('canvas'); W.faceCanvas.width = W.faceCanvas.height = 768;
  W.faceTex = new THREE.CanvasTexture(W.faceCanvas); W.faceTex.colorSpace = THREE.SRGBColorSpace; W.faceTex.anisotropy = 8;
  W.faceMat = new THREE.MeshPhysicalMaterial({ map: W.faceTex, roughness: 0.42, clearcoat: 0.3, emissive: new THREE.Color(0xffffff), emissiveMap: W.faceTex, emissiveIntensity: 0 });
  const face = new THREE.Mesh(new THREE.CircleGeometry(PR - 0.0026, 128), W.faceMat); face.position.z = 0.0068; W.ped.add(face);
  W.needleMat = phys({ color: 0x17181b, roughness: 0.4, emissive: ORANGE.clone(), emissiveIntensity: 0 });
  W.needle = new THREE.Group(); W.needle.position.z = 0.0074; W.ped.add(W.needle);
  const nd = new THREE.Mesh(new THREE.BoxGeometry(0.0007, 0.0185, 0.0006), W.needleMat); nd.position.y = 0.0075; W.needle.add(nd);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.0018, 0.0018, 0.0012, 32), W.needleMat); hub.rotation.x = Math.PI / 2; W.needle.add(hub);
  W.glass = new THREE.Mesh(new THREE.CircleGeometry(PR - 0.002, 96), phys({ color: 0x000000, roughness: 0.05, transparent: true, opacity: 0.16, depthWrite: false, specularIntensity: 0.6 }));
  W.glass.position.z = 0.0084; W.ped.add(W.glass);
  const clip = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.04, 0.003), chrome); clip.position.set(0, 0.012, -0.0095); W.ped.add(clip);
  shadows(W.ped); W.ped.traverse((o) => o.layers.enable(1));
  W.pedRest = W.ped.position.clone();
  // ---- the hill: a dark slab whose top is the curve, a white line along its edge, ticks every thousand steps
  const N = 300, zs = [], slab = new THREE.Shape();
  for (let i = 0; i <= N; i++) zs.push(-0.3 + (Z_END + 0.3) * (i / N));
  slab.moveTo(zs[0], 0); for (const z of zs) slab.lineTo(z, hill(z)); slab.lineTo(Z_END, 0); slab.closePath();
  const geo = new THREE.ExtrudeGeometry(slab, { depth: 0.9, bevelEnabled: false, steps: 1 }); geo.rotateY(-Math.PI / 2); geo.translate(0.45, 0, 0); // x from -0.45 to 0.45
  W.slabMat = phys({ color: 0x0b0c0e, roughness: 0.62, clearcoat: 0.25, clearcoatRoughness: 0.5 });
  W.slab = new THREE.Mesh(geo, W.slabMat); W.slab.receiveShadow = true; W.slab.castShadow = false; W.slab.layers.enable(1); scene.add(W.slab);
  const linePts = zs.map((z) => new THREE.Vector3(-0.452, hill(z) + 0.002, z));
  W.lineMat = new THREE.ShaderMaterial({
    uniforms: { uDraw: { value: 0 }, uDash: { value: 0 }, uC: { value: new THREE.Color(0xeceef1).multiplyScalar(1.6) }, uO: { value: 1 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'uniform float uDraw, uDash, uO; uniform vec3 uC; varying vec2 vUv; void main(){ if (vUv.x > uDraw) discard; float d = step(0.5, fract(vUv.x * 90.0)); if (uDash > 0.5 && d < 0.5) discard; gl_FragColor = vec4(uC, uO); }',
    transparent: true,
  });
  W.line = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(linePts), 900, 0.006, 8, false), W.lineMat); scene.add(W.line);
  W.tickMat = new THREE.MeshBasicMaterial({ color: 0xa8acb3, transparent: true, opacity: 0 });
  for (let k = 2; k <= 12; k++) { const t = new THREE.Mesh(new THREE.BoxGeometry(0.003, 0.05, 0.004), W.tickMat); t.position.set(-0.455, 0.025, zOf(k)); scene.add(t); }
  // ---- 57 studies: points of light that gather into the line
  W.dots = []; const st = new THREE.MeshBasicMaterial({ color: 0xeceef1 });
  for (let i = 0; i < 57; i++) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.012, 16, 12), st.clone()); m.material.transparent = true; scene.add(m);
    const k = i / 56, z = lerp(zOf(2), zOf(12), k);
    W.dots.push({ m, from: new THREE.Vector3(-1.4 + hash(i * 1.3) * 2.6, 0.4 + hash(i * 2.7) * 2.2, -1.5 + hash(i * 3.9) * 14), to: new THREE.Vector3(-0.452, hill(z) + 0.002, z), k });
  }
  // ---- the settings: 7,000 in orange, and the hill turned into stairs of a thousand
  W.markMat = glowMat(ORANGE); W.markMat.transparent = true; W.markMat.opacity = 0;
  W.mark = new THREE.Mesh(new THREE.BoxGeometry(0.94, 0.016, 0.05), W.markMat); W.mark.position.set(0, hill(zOf(7)) + 0.004, zOf(7)); scene.add(W.mark);
  W.stairs = [];
  for (let k = 2; k < 7; k++) {
    const z0 = zOf(k), z1 = zOf(k + 1), y1 = hill(z1);
    const mat = glowMat(ORANGE); mat.transparent = true; mat.opacity = 0;
    const tread = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.028, z1 - z0 + 0.028), mat); tread.position.set(-0.47, y1, (z0 + z1) / 2);
    const riser = new THREE.Mesh(new THREE.BoxGeometry(0.03, y1 - hill(z0), 0.028), mat); riser.position.set(-0.47, (y1 + hill(z0)) / 2, z0);
    scene.add(tread, riser); W.stairs.push(mat);
  }
  // ---- the 7,500 marker, and the slogan: a neon sign at 10,000 where the hill is already flat
  W.m75Mat = new THREE.MeshBasicMaterial({ color: 0xeceef1, transparent: true, opacity: 0 });
  const m75 = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.42, 0.004), W.m75Mat); m75.position.set(-0.455, hill(zOf(7.5)) + 0.21, zOf(7.5)); scene.add(m75);
  { const c = document.createElement('canvas'); c.width = 1024; c.height = 400; const x = c.getContext('2d');
    x.fillStyle = '#000'; x.fillRect(0, 0, 1024, 400);
    x.font = '700 300px "Noto Serif CJK JP", serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.shadowColor = '#ff3a5c'; x.shadowBlur = 40; x.fillStyle = '#ffd6de'; x.fillText('万歩計', 512, 210);
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
    W.neonMat = new THREE.MeshBasicMaterial({ map: tex, color: new THREE.Color(0, 0, 0), blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, fog: false });
    W.neon = new THREE.Mesh(new THREE.PlaneGeometry(0.74, 0.29), W.neonMat); W.neon.position.set(0.25, hill(zOf(10)) + 1.12, zOf(10)); W.neon.rotation.y = -Math.PI / 2; scene.add(W.neon);
    W.neonLight = new THREE.PointLight(0xff3a5c, 0, 3, 2); W.neonLight.position.copy(W.neon.position).add(new THREE.Vector3(-0.2, 0, 0)); scene.add(W.neonLight); }
  // ---- light: a museum spot that walks with the skeleton, a cold rim, the hill's own soft light
  W.key = spot(scene, { color: 0xffe9d2, pos: new THREE.Vector3(-1.8, 3.6, 0), target: new THREE.Vector3(0, 1, 0), angle: 0.5, penumbra: 0.85, shadow: true, size: cfg.shadow ?? 1024 });
  W.key.shadow.camera.far = 9;
  W.rim = spot(scene, { color: 0xa9c4ff, pos: new THREE.Vector3(1.8, 2.8, -2), target: new THREE.Vector3(0, 1.1, 0), angle: 0.55, penumbra: 0.9 });
  W.fill = spot(scene, { color: 0xc8d6ff, pos: new THREE.Vector3(-2.6, 1.0, 0), target: new THREE.Vector3(0, 0.9, 0), angle: 0.6, penumbra: 1 });
  W.hillLight = spot(scene, { color: 0xdfe6f5, pos: new THREE.Vector3(-4, 6, zOf(7)), target: new THREE.Vector3(0, 0.3, zOf(7)), angle: 0.9, penumbra: 1 });
  W.pedLight = new THREE.SpotLight(0xffe9d2, 0, 2.5, 0.2, 0.8, 2); scene.add(W.pedLight, W.pedLight.target);
  W.brainLight = new THREE.PointLight(0xffb27a, 0, 0.6, 2); W.rig.seg.Atlas.g.add(W.brainLight); W.brainLight.position.set(0, 0.08, 0.02);
  Z0 = HS_STOP1 - 0.27 - W.rig.P0.z;
  buildTracks();
  return { stride: STRIDE, P0: W.rig.P0.toArray(), asis: asis.toArray() };
}

// ------------------------------------------------------------------ the walk: walk, stop at the foot of the hill, climb, stop at 7,000
// the leading (right) heel is planted at HS when the walk stops; s is the distance walked, in the gait's own terms
let Z0 = 0;                            // the gait's origin (set once the rig exists): the right heel lands at HS_STOP1 + k * STRIDE
const S_STOP1 = 0.25 * STRIDE, S_STOP2 = S_STOP1 + 7 * STRIDE;
function easeDist(t, t0, t1, d, ramp) {   // distance covered between t0 and t1, constant speed with smooth start and stop
  const T = t1 - t0, v = d / (T - ramp), u = clamp01((t - t0) / T) * T;
  if (u < ramp) return (v * u * u) / (2 * ramp);
  if (u > T - ramp) { const r = T - u; return d - (v * r * r) / (2 * ramp); }
  return v * (u - ramp / 2);
}
const WALK1 = { t0: 0, t1: 19.0, d: 13.9, ramp: 1.4 }, WALK2 = { t0: 25.9, t1: 34.6, d: S_STOP2 - S_STOP1 };
function walk1(t) { // already walking when the film starts: constant speed, then a smooth stop
  const { t0, t1, d, ramp } = WALK1, v = d / (t1 - t0 - ramp / 2);
  if (t < t1 - ramp) return v * (t - t0);
  const r = Math.max(0, t1 - t); return d - (v * r * r) / (2 * ramp);
}
function sAt(t) {
  if (t < WALK2.t0) return S_STOP1 - WALK1.d + walk1(t);
  return S_STOP1 + easeDist(t, WALK2.t0, WALK2.t1, WALK2.d, 0.7);
}
// walking blends into standing (feet side by side, the leading foot stays planted) when a walk stops, and back when it starts
function standW(t) { return ss(WALK1.t1 - 0.75, WALK1.t1 + 0.05, t) * (1 - ss(WALK2.t0 - 0.05, WALK2.t0 + 0.55, t)) + ss(WALK2.t1 - 0.75, WALK2.t1 + 0.05, t); }
const gaitOpts = () => ({ stride: STRIDE, ground: hill, slope: slopeOf, z0: Z0 });
function standPose(hsz) { // both heels at hsz
  const R = W.rig, out = { feet: {} };
  const zp = hsz + (R.P0.z - R.legs.Right.heel.z);
  out.pelvis = new THREE.Vector3(R.P0.x, R.P0.y - 0.004 + hill(zp), zp); out.pelvisRot = new THREE.Euler(0, 0, 0);
  for (const Side of ['Right', 'Left']) {
    const G = R.legs[Side], beta = slopeOf(hsz);
    const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -beta);
    const P = new THREE.Vector3(G.heel.x, hill(hsz) + G.heel.y, hsz);
    out.feet[Side] = { ankle: G.A.clone().sub(G.heel).applyQuaternion(q).add(P), q };
  }
  out.armR = ARM0; out.armL = ARM0; out.twist = 0; return out;
}
const _a = new THREE.Vector3();
function bodyAt(t) {
  const R = W.rig, s = sAt(t), w = walkAt(R, s, gaitOpts());
  const k = standW(t);
  if (k > 0) {
    const st = standPose(t < WALK2.t0 - 0.5 ? HS_STOP1 : t < WALK2.t1 - 1.5 ? HS_STOP1 : HS_STOP2);
    w.pelvis.lerp(st.pelvis, k); w.pelvisRot.set(lerp(w.pelvisRot.x, 0, k), lerp(w.pelvisRot.y, 0, k), lerp(w.pelvisRot.z, 0, k));
    for (const Side of ['Right', 'Left']) {
      const a = w.feet[Side], b = st.feet[Side], lift = a.stance ? 0 : 0.035 * Math.sin(Math.PI * k);
      a.ankle.lerp(b.ankle, k); a.ankle.y += lift; a.q.slerp(b.q, k);
    }
    const mix = (x, y) => ({ dir: x.dir.map((v, i) => lerp(v, y.dir[i], k)), twist: lerp(x.twist || 0, 0, k), elbow: lerp(x.elbow, y.elbow, k), retract: 0, elevate: 0 });
    w.armR = mix(w.armR, ARM0); w.armL = mix(w.armL, ARM0); w.twist *= 1 - k;
  }
  return w;
}
function applyBody(t, extra = {}) {
  const R = W.rig, b = bodyAt(t);
  R.pelvis.position.copy(b.pelvis); R.pelvis.rotation.copy(b.pelvisRot);
  bendSpine(R.seg, { tho: 0.04 + 0.06 * ss(WALK2.t0, WALK2.t0 + 1, t) * (1 - ss(WALK2.t1 - 1, WALK2.t1, t)), ...extra, twist: (extra.twist || 0) + b.twist });
  poseArm(R.arms.Right, b.armR); poseArm(R.arms.Left, b.armL);
  for (const Side of ['Right', 'Left']) legIK(R, Side, b.feet[Side].ankle, b.feet[Side].q);
  R.root.updateMatrixWorld(true);
  return b;
}
const stepsAt = (t) => 9985.6 + (2 * sAt(t)) / STRIDE - (2 * sAt(T.day)) / STRIDE + 14.4;   // the counter reads 10,000 on "day"

// ------------------------------------------------------------------ the camera: one path, no cuts
let CAM;
const pedWorld = (t) => { applyBody(t); return W.ped.getWorldPosition(new THREE.Vector3()); };
function buildTracks() {
  // the pedometer's path while walking, smoothed (the camera rides along beside it; the hip's own bob stays in the picture)
  // the pedometer's path while walking, without the hip's bob: the camera rides ahead of it, the bob stays in the picture
  const pz = (t) => W.rig.P0.z + Z0 + sAt(t), R0 = W.pedRest, px = W.rig.P0.x + R0.x, py = W.rig.P0.y + R0.y - 0.03, dz0 = R0.z;
  const P = (t, dx, dy, dz, fov) => ({ t, p: V3(px + dx, py + dy, pz(t) + dz0 + dz), l: V3(px, py, pz(t) + dz0), fov });
  const z7 = zOf(7), y7 = hill(z7);
  // where he stands at the top (his head, his hips, the pedometer's face), measured on the standing pose
  applyBody(40); W.rig.root.updateMatrixWorld(true);
  const hd = W.rig.seg.Atlas.g.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, 0.08, 0.02)).toArray();
  const hp = W.rig.pelvis.getWorldPosition(new THREE.Vector3()).toArray();
  const ff = faceFrame(), fc = ff.c.toArray(), fn = ff.n.toArray();
  CAM = camTrack([
    P(-4.6, -0.05, 0.03, 0.36, 26),   // a key before the start, so the camera is already moving with the walker at t = 0
    P(0.0, -0.05, 0.03, 0.36, 26),
    P(4.6, -0.07, 0.05, 0.34, 26),
    P(9.2, -0.03, 0.02, 0.31, 24),
    P(12.6, -0.06, 0.05, 0.38, 26),
    { t: 15.4, p: V3(-0.9, 1.25, pz(15.4) + 3.6), l: V3(0, 1.0, pz(15.4)), fov: 34 },
    { t: 17.9, p: V3(-4.1, 1.15, pz(17.9) + 0.1), l: V3(-0.05, 1.05, pz(17.9) + 0.1), fov: 34 },
    { t: 20.1, p: V3(-1.4, 2.1, -3.9), l: V3(0, 0.9, 0.3), fov: 34 },       // round behind him, still on him
    { t: 21.8, p: V3(-0.55, 2.9, -4.5), l: V3(0, 0.45, zOf(6)), fov: 34 },  // then up: the hill ahead of him
    { t: 24.4, p: V3(-0.45, 2.6, -4.3), l: V3(0, 0.6, zOf(5.2)), fov: 34 },
    { t: 26.0, p: V3(-1.6, 2.1, -3.6), l: V3(0, 1.0, 0.4), fov: 34 },                        // he starts to climb: down to him, then to his side
    { t: 28.6, p: V3(-4.2, 1.25 + 0.25, pz(28.6) + 0.2), l: V3(0, 1.1 + 0.3, pz(28.6) + 0.5), fov: 34 },
    { t: 33.2, p: V3(-4.2, 1.2 + y7, pz(33.2) + 0.2), l: V3(0, 1.08 + y7, pz(33.2) + 0.2), fov: 34 },
    { t: 36.0, p: vadd(hd, [-1.6, 0.05, 0.0]), l: vadd(hd, [0, -0.03, 0.1]), fov: 30, stop: true },      // the head on the left third, the readouts on the right
    { t: 40.2, p: vadd(hd, [-1.66, 0.07, 0.03]), l: vadd(hd, [0, -0.04, 0.11]), fov: 30 },
    { t: 42.4, p: vadd(hp, [-2.3, 0.05, 0.2]), l: vadd(hp, [0, -0.12, 0.06]), fov: 32 },
    { t: 46.6, p: V3(-1.9, 1.75 + y7, zOf(10.5)), l: V3(0, 0.95 + y7, zOf(7.6)), fov: 34 },
    { t: 54.6, p: V3(-1.75, 1.7 + y7, zOf(10.2)), l: V3(0, 0.85 + y7, zOf(7.4)), fov: 34 },   // hold on him and the 7,500 mark
    { t: 55.7, p: V3(-3.1, 1.55 + y7, zOf(8.9)), l: V3(0.15, 1.12 + y7, zOf(10)), fov: 34, tens: 0.25 },   // whip to the sign as it buzzes on
    { t: 59.5, p: V3(-3.0, 1.6 + y7, zOf(9.0)), l: V3(0.15, 1.12 + y7, zOf(10)), fov: 34, tens: 0.4 },
    { t: 60.7, p: V3(-3.2, 2.6, 12.6), l: V3(0, 1.2, zOf(6.6)), fov: 34 },                   // turn to him as the sign dies: he stands at the top
    { t: 62.6, p: V3(-2.9, 3.2, 14.2), l: V3(0, 0.7, zOf(4.6)), fov: 34 },                  // from the top, looking back down the hill
    { t: 66.2, p: V3(-2.6, 3.0, 13.6), l: V3(0, 0.75, zOf(4.8)), fov: 34 },
    { t: 70.0, p: V3(-2.25, 2.75, 12.7), l: V3(0, 0.8, zOf(5.0)), fov: 34 },                // the stairs light up the hill toward him
    { t: 72.6, p: V3(-1.75, 2.45, 11.6), l: V3(0, 1.1, zOf(6)), fov: 34 },
    { t: 73.9, p: vadd(fc, [-0.3, 0.15, 1.25]), l: fc, fov: 31 },                             // straight in at his hip
    { t: T.logo, p: vadd(fc, fn.map((v) => v * 0.5)), l: fc, fov: 30, stop: true },          // into the pedometer's face: the logo lands here
  ]);
}
function camPose(S, t) {
  if (t <= T.logo) return CAM(t);
  // after the logo lands: the faintest drift in
  const f = faceFrame(), near = f.c.clone().addScaledVector(f.n, 0.48), P = CAM(T.logo);
  return { p: new THREE.Vector3().fromArray(P.p).lerp(near, ss(T.logo, T.end, t)).toArray(), l: f.c.toArray(), fov: 30 };
}
function pedFocus(S, t, P) {
  const d = new THREE.Vector3().fromArray(P.p).distanceTo(new THREE.Vector3().fromArray(P.l));
  const k = (1 - ss(12.6, 15.0, t)) + ss(73.4, 74.6, t);   // the opening close-ups, and the end
  if (k <= 0) return d;
  const f = faceFrame(), dir = S.cam.getWorldDirection(new THREE.Vector3());
  return lerp(d, f.c.clone().sub(S.cam.position).dot(dir), Math.min(1, k));
}
// the walker's own travel (no bob): motion blur is measured against it, so the camera riding along keeps him sharp
function carrier(S, t) { const z = W.rig.P0.z + Z0 + sAt(t); return [0, hill(z), z]; }
function faceFrame() { W.ped.updateWorldMatrix(true, false); return { c: new THREE.Vector3(0, 0, 0.0084).applyMatrix4(W.ped.matrixWorld), n: new THREE.Vector3(0, 0, 1).transformDirection(W.ped.matrixWorld).normalize() }; }

// ------------------------------------------------------------------ one moment of the film
let lastFace = '';
function update(S, t) {
  const scene = S.scene;
  // ---- the body
  const b = applyBody(t, { cer: -0.05 * ss(T.above - 0.5, T.above + 1, t) });
  // ---- light follows the walker
  const zc = b.pelvis.z, yc = b.pelvis.y;
  const figure = 1 - ss(T.final + 0.2, T.logo - 0.4, t);
  W.key.position.set(-1.8, yc + 2.7, zc + 1.1); W.key.target.position.set(0, yc + 0.05, zc);
  W.key.intensity = figure * lerp(1.2, 6.0, ss(T.sci - 0.6, T.sci + 1.4, t)) * (1 - 0.35 * ss(T.link - 0.3, T.link + 0.8, t) * (1 - ss(T.aim - 0.4, T.aim + 0.6, t)));
  W.rim.position.set(1.8, yc + 1.9, zc - 2.0); W.rim.target.position.set(0, yc + 0.2, zc); W.rim.intensity = figure * 2.4;
  W.fill.position.set(-2.6, yc + 0.1, zc); W.fill.target.position.set(0, yc, zc); W.fill.intensity = figure * 0.7;
  const pw = W.ped.getWorldPosition(new THREE.Vector3());
  W.pedLight.position.copy(pw).add(new THREE.Vector3(-0.35, 0.45, 0.7)); W.pedLight.target.position.copy(pw);
  W.pedLight.intensity = (1 - ss(T.sci, T.sci + 2, t)) * 3.0 + ss(T.final - 0.5, T.final + 0.8, t) * 2.0 * (1 - ss(T.logo - 0.2, T.logo + 0.6, t));
  W.hillLight.intensity = ss(T.meas, T.s57 + 3, t) * 0.5 * figure;
  const endDark = ss(T.final + 0.2, T.logo - 0.3, t);
  S.tableMat.color.setScalar(FLOOR * (1 - endDark * 0.95)); scene.environmentIntensity = 0.12 * (1 - endDark); S.reflAmt = 0.9 * (1 - endDark);
  W.slabMat.color.set(0x0b0c0e).multiplyScalar(1 - endDark);

  // ---- the pedometer: the needle reads the count, the counter rolls; at the end the needle goes to twelve and the face to the logo
  const count = stepsAt(t);
  const toSeven = s5(T.final + 0.3, T.logo - 0.25, t), logoK = s5(T.final + 0.4, T.logo - 0.2, t);
  const a = lerp((-135 + (270 * Math.min(14, count / 1000)) / 14) * (Math.PI / 180), 0, toSeven);
  W.needle.rotation.z = -a;
  W.needleMat.color.set(0x17181b).lerp(ORANGE, toSeven); W.needleMat.emissiveIntensity = toSeven * 1.2;
  const key = `${count.toFixed(3)}|${logoK.toFixed(3)}`;
  if (key !== lastFace) { pedometerFace(W.faceCanvas, count, logoK); W.faceTex.needsUpdate = true; lastFace = key; }
  W.faceMat.emissiveIntensity = 0.15 + 0.35 * logoK;
  const ding = Math.exp(-Math.max(0, t - T.day) * 3) * (t > T.day ? 1 : 0); W.faceMat.emissiveIntensity += ding * 0.5;

  // ---- the hill: 57 points of light gather into its line, ticks every thousand steps
  const gather = ss(T.s57 - 0.2, T.s57 + 3.2, t);
  for (const d of W.dots) {
    const on = ss(T.s57 - 0.3 + d.k * 0.8, T.s57 + 0.1 + d.k * 0.8, t), fly = s5(T.s57 + 0.6 + d.k * 0.9, T.s57 + 2.2 + d.k * 0.9, t);
    d.m.position.lerpVectors(d.from, d.to, fly); d.m.position.y += Math.sin(Math.PI * fly) * 0.35;
    d.m.material.opacity = on * (1 - ss(0.85, 1, fly)); d.m.visible = d.m.material.opacity > 0.01;
  }
  W.lineMat.uniforms.uDraw.value = gather > 0 ? clamp01((ss(T.s57 + 1.2, T.s57 + 4.0, t))) * 1.001 : 0;
  W.lineMat.uniforms.uDash.value = t > T.link + 0.4 && t < T.aim ? 1 : 0;
  W.lineMat.uniforms.uO.value = 1 - endDark;
  const rise = s5(T.s57 + 1.0, T.s57 + 4.2, t); W.slab.visible = rise > 0.001; W.slab.scale.y = Math.max(0.001, rise);
  W.tickMat.opacity = ss(T.s57 + 2, T.s57 + 3, t) * 0.7 * (1 - endDark);
  W.m75Mat.opacity = ss(T.k75 - 0.3, T.k75 + 0.3, t) * (1 - ss(T.slogan1 - 0.5, T.slogan1, t)) * 0.9;
  // ---- the slogan: a neon sign switches on at 10,000, flickers, and goes off
  const neon = ss(T.slogan1 - 0.6, T.slogan1 - 0.35, t) * (1 - ss(T.slogan2 + 1.2, T.slogan2 + 1.7, t));   // buzzes on just before "Ten", dies as the camera turns away
  const flick = t < T.slogan1 + 0.1 ? (hash(Math.floor(t * 30)) > 0.35 ? 1 : 0.15) : 1;
  W.neonMat.color.setScalar(neon * flick * 1.4); W.neonLight.intensity = neon * flick * 1.5; W.neon.visible = neon > 0.002;
  // ---- the settings: 7,000 in orange; the slope as stairs of a thousand, lit one by one
  W.markMat.opacity = ss(T.aim + 1.3, T.aim + 1.8, t) * (1 - endDark);
  W.stairs.forEach((m, i) => { m.opacity = ss(T.add + i * 0.28, T.add + 0.2 + i * 0.28, t) * (1 - endDark); });

  // ---- the readouts: the brain for dementia and mood, the hips for falls
  const br = ss(T.dem - 0.2, T.dem + 0.6, t) * (1 - ss(T.falls - 0.3, T.falls + 0.4, t));
  for (const m of W.brain) { m.visible = br > 0.002; m.material.opacity = br; m.material.emissiveIntensity = br * (0.2 + 0.14 * ss(T.dep, T.dep + 0.5, t)); }
  for (const m of W.skull) { m.material.opacity = 1 - 0.7 * br; m.material.depthWrite = br < 0.5; }
  W.brainLight.intensity = br * 0.25;
  const fl = ss(T.falls, T.falls + 0.5, t) * (1 - ss(T.above, T.above + 0.6, t));
  for (const m of W.hips) { m.material.emissive.set(0xffb27a); m.material.emissiveIntensity = fl * 0.22; }
}

// ------------------------------------------------------------------ the words on screen
const CAPS = [
  { t0: 0.35, t1: 2.35, top: 300, size: 104, html: '<em>10,000</em> steps a day.' },
  { t0: 2.48, t1: 4.6, top: 300, size: 104, html: 'Who decided <em>that?</em>' },
  { t0: 4.85, t1: 9.1, top: 292, size: 84, html: 'A Japanese pedometer,<br><em>1965</em>' },
  { t0: 9.36, t1: 13.95, top: 292, size: 84, html: '“<em>10,000</em>-steps meter”' },
  { t0: 14.15, t1: 18.3, top: 292, size: 92, html: '“A <em>marketing</em> tool.”' },
  { t0: 20.62, t1: 26.3, top: 292, size: 96, html: '57 studies.<br><em>Counted steps.</em>' },
  { t0: 28.83, t1: 35.2, top: 292, size: 80, html: '7,000 steps: <em>−47%</em><br>risk of dying early' },
  { t0: 43.38, t1: 48.8, top: 292, size: 84, html: 'Past 7,000:<br><em>small</em> extra benefit' },
  { t0: 49.04, t1: 54.9, top: 292, size: 84, html: 'Older women:<br>flat from <em>7,500</em>' },
  { t0: 55.39, t1: 59.95, top: 292, size: 92, html: 'Never the science.<br><em>The slogan.</em>' },
  { t0: 60.23, t1: 65.4, top: 292, size: 96, html: 'A link, <em>not proof.</em>' },
  { t0: 65.7, t1: 72.6, top: 292, size: 96, html: 'Aim for <em>7,000</em>' },
  { t0: 72.99, t1: 99, top: 360, size: 96, html: 'Back to<br><em>factory settings.</em>' },
];
const SUBS = [];
const OVL = {};
function overlayInit(S) {
  const O = S.O, tag = (cls, txt, size) => { const e = O.tag(cls, txt); e.style.fontSize = size + 'px'; return e; };
  OVL.k2 = tag('tag', '2,000 steps', 26); OVL.k7 = tag('tag', '7,000 steps', 26); OVL.k10 = tag('tag', '10,000', 24); OVL.k12 = tag('tag', '12,000', 24); OVL.k75 = tag('tag', '7,500', 24);
  OVL.dem = tag('tag', 'Dementia <b>−38%</b>', 30); OVL.dep = tag('tag', 'Depression<br>symptoms <b>−22%</b>', 30); OVL.falls = tag('tag', 'Falls <b>−28%</b>', 30);
  for (const e of [OVL.dem, OVL.dep, OVL.falls]) e.querySelector('b').style.fontSize = '64px';
  OVL.add = [3, 4, 5, 6, 7].map((k) => tag('tag o', `+1,000`, 22));
}
function placeRight(S, el, v, dy, o) {   // a readout set against the right margin, level with the point it describes
  place(S, el, v, 2000, dy, o);
}
function overlay(S, t) {
  const y = (k) => hill(zOf(k)), P = (x, yy, z) => new THREE.Vector3(x, yy, z);
  const hillOn = ss(T.s57 + 2.5, T.s57 + 3.3, t) * (1 - ss(T.final - 0.2, T.final + 0.4, t));
  place(S, OVL.k2, P(-0.46, -0.02, zOf(2)), -60, 18, hillOn * ss(T.two - 0.2, T.two + 0.3, t) * (1 - ss(T.dem - 0.5, T.dem, t)));
  place(S, OVL.k7, P(-0.46, y(7) - 0.02, zOf(7)), -40, 18, hillOn * ss(T.seven - 0.2, T.seven + 0.3, t) * (1 - ss(T.dem - 0.5, T.dem, t)) + ss(T.aim + 1.3, T.aim + 1.8, t) * (1 - ss(T.final - 0.4, T.final, t)));
  place(S, OVL.k75, P(-0.46, y(7.5) + 0.44, zOf(7.5)), -30, -40, ss(T.k75 - 0.3, T.k75 + 0.3, t) * (1 - ss(T.slogan1 - 0.5, T.slogan1, t)));
  place(S, OVL.k10, P(-0.46, y(10) - 0.02, zOf(10)), -36, 18, hillOn * ss(T.slogan1 - 0.4, T.slogan1, t) * (1 - ss(T.link - 0.3, T.link + 0.2, t)));
  place(S, OVL.k12, P(-0.46, y(12) - 0.02, zOf(12)), -36, 18, hillOn * ss(T.above + 0.5, T.above + 1.0, t) * (1 - ss(T.women - 0.3, T.women + 0.2, t)));
  const head = W.rig.seg.Atlas.g.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, 0.08, 0));
  placeRight(S, OVL.dem, head, -250, ss(T.dem, T.dem + 0.4, t) * (1 - ss(T.falls - 0.3, T.falls + 0.2, t)));
  placeRight(S, OVL.dep, head, 10, ss(T.dep, T.dep + 0.4, t) * (1 - ss(T.falls - 0.3, T.falls + 0.2, t)));
  const hipP = W.rig.pelvis.getWorldPosition(new THREE.Vector3());
  placeRight(S, OVL.falls, hipP, -120, ss(T.falls, T.falls + 0.4, t) * (1 - ss(T.above - 0.4, T.above + 0.2, t)));
  OVL.add.forEach((e, i) => { const k = 2.5 + i; place(S, e, P(-0.46, y(k + 0.5) + 0.06, zOf(k)), -30, -36, ss(T.add + i * 0.28, T.add + 0.2 + i * 0.28, t) * (1 - ss(T.final - 0.4, T.final, t))); });
  const f = faceFrame(); const edge = f.c.clone().add(new THREE.Vector3(0, (0.026 - 0.0026) * 20.5 / 21.2, 0));
  logoEnd(S, t, { t0: T.logo, center: f.c, edge });
}

makeFilm({
  T, caps: CAPS, subs: SUBS, build, update, pose: camPose, overlay, overlayInit, carrier, focus: pedFocus,
  stage: { bg: 0x07080a, reflSize: 40, env: 0.12, far: 40 },
  aperture: [[0, 0.009], [13.4, 0.008], [17.6, 0.0018], [21.2, 0.0012], [28.6, 0.0018], [36, 0.004], [43.4, 0.002], [62.6, 0.0006], [70, 0.0012], [74, 0.008], [76, 0.002]],
  bloom: [[0, 0.42], [20, 0.48], [55, 0.6], [60, 0.45], [65.7, 0.5], [74.9, 0.55]],
  fast: [],
});

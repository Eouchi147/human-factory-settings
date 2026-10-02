// Human Factory Settings · Film 1 "Always tired?" · one continuous shot, 63 s, 9:16.
// Every frame is a pure function of t (seconds), so it renders frame by frame, deterministically.
// Real anatomy: BodyParts3D 4.0 (c) The Database Center for Life Science, CC BY 4.0. Everything else is procedural.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { Reflector } from 'three/addons/objects/Reflector.js';

const H = window.HFS;
const ORANGE = new THREE.Color(0xff6a2b);
const AMBER = new THREE.Color(1.0, 0.5, 0.16);

// ------------------------------------------------------------------ timing, from the voice guide (line starts, ends and pauses)
export const T = {
  end: 63,
  alarm: 0.6, // the second hand reaches 7:00:00
  portal0: 4.5, portal1: 6.05, // the clock face opens onto the brain ("One: short sleep.")
  fill0: 6.1, fill1: 11.5, // "All day, ... adenosine builds up in your brain, and makes you sleepy."
  night: 12.35, // "Sleep clears it."
  woke: 15.05, // "Cut sleep short," the alarm stops the clearing
  drop0: 15.9, dropFall: 17.3, splash: 18.42, // the leftover gathers, drips, lands ("Two: late coffee.")
  hide0: 20.2, hide1: 23.6, // "Coffee doesn't clear that chemical. It hides it,"
  steam0: 23.85, // "and that cuts into your sleep."
  six: 26.35, eleven: 30.95, // "A coffee at six p.m.? About half of it is still in you at eleven."
  lamp: 33.45, phone: 35.05, roomLight: 36.5, body: 37.7, // "Three: late light. Bright light at night, even room light, tells your body clock it's still day,"
  shift0: 40.45, shift1: 42.45, // "so your sleep signal comes later."
  dialsUp: 44.35, dial1: 47.5, dial2: 49.5, dial3: 51.28, // "For a seven a.m. alarm: in bed by eleven, last coffee by two, lights low from eight."
  lampOff: 52.0, // lights out: the lamp clicks off before the night passes
  dawn0: 52.35, seven: 54.45, doctor: 54.62, // "Still tired with enough sleep? See a doctor. Low iron, or your thyroid, can cause it."
  final: 59.35, click: 60.5, logo: 61.15, // "Back to factory settings."
};

// ------------------------------------------------------------------ small maths
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const lerp = (a, b, t) => a + (b - a) * t;
const ss = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const s5 = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * t * (t * (t * 6 - 15) + 10); };
const outCubic = (t) => 1 - Math.pow(1 - clamp01(t), 3);
const outBack = (t, k = 1.7) => { t = clamp01(t); const c = k + 1; return 1 + c * Math.pow(t - 1, 3) + k * Math.pow(t - 1, 2); };
const hash = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const vnoise = (x) => { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return lerp(hash(i), hash(i + 1), u) * 2 - 1; };
function keys(k, t) { // [[t, v], ...], smooth between keys
  if (t <= k[0][0]) return k[0][1];
  for (let i = 0; i < k.length - 1; i++) if (t < k[i + 1][0]) return lerp(k[i][1], k[i + 1][1], s5(k[i][0], k[i + 1][0], t));
  return k[k.length - 1][1];
}
const _ca = new THREE.Color(), _cb = new THREE.Color();
function ckeys(k, t, out) { // [[t, 0xrrggbb], ...]
  if (t <= k[0][0]) return out.set(k[0][1]);
  for (let i = 0; i < k.length - 1; i++) if (t < k[i + 1][0]) { _ca.set(k[i][1]); _cb.set(k[i + 1][1]); return out.copy(_ca).lerp(_cb, s5(k[i][0], k[i + 1][0], t)); }
  return out.set(k[k.length - 1][1]);
}

// A camera path through keyframes {t, p, l, fov, stop}: Hermite curves with tangents from the neighbours (in time),
// so the camera never stops at a key unless told to: one continuous move.
function camTrack(K) {
  const n = K.length;
  const tang = (f) => K.map((k, i) => {
    if (k.stop || i === 0 || i === n - 1) return [0, 0, 0];
    const a = f(K[i - 1]), b = f(K[i + 1]), dt = K[i + 1].t - K[i - 1].t;
    return a.map((v, j) => ((b[j] - v) / dt) * (k.tens ?? 1));
  });
  const mp = tang((k) => k.p), ml = tang((k) => k.l);
  const herm = (i, s, h, f, m) => {
    const a = f(K[i]), b = f(K[i + 1]), s2 = s * s, s3 = s2 * s;
    const h00 = 2 * s3 - 3 * s2 + 1, h10 = s3 - 2 * s2 + s, h01 = -2 * s3 + 3 * s2, h11 = s3 - s2;
    return a.map((v, j) => h00 * v + h10 * h * m[i][j] + h01 * b[j] + h11 * h * m[i + 1][j]);
  };
  return (t) => {
    if (t <= K[0].t) return { p: K[0].p, l: K[0].l, fov: K[0].fov ?? 30 };
    if (t >= K[n - 1].t) return { p: K[n - 1].p, l: K[n - 1].l, fov: K[n - 1].fov ?? 30 };
    let i = 0; while (K[i + 1].t <= t) i++;
    const h = K[i + 1].t - K[i].t, s = (t - K[i].t) / h;
    return { p: herm(i, s, h, (k) => k.p, mp), l: herm(i, s, h, (k) => k.l, ml), fov: lerp(K[i].fov ?? 30, K[i + 1].fov ?? 30, s5(0, 1, s)) };
  };
}

// ------------------------------------------------------------------ materials and helpers
const phys = (o) => new THREE.MeshPhysicalMaterial({ metalness: 0, roughness: 0.5, ...o });
const glowMat = (c, o = 1) => new THREE.MeshBasicMaterial({ color: c.clone(), transparent: o < 1, opacity: o, depthWrite: o >= 1 });
function shadows(obj, cast = true, recv = true) { obj.traverse((m) => { if (m.isMesh) { m.castShadow = cast; m.receiveShadow = recv; } }); }
function noiseTex(seed = 1, size = 512, lo = 0.8, hi = 1.0, rep = 18) {
  const cv = document.createElement('canvas'); cv.width = cv.height = size;
  const ctx = cv.getContext('2d'); const img = ctx.createImageData(size, size);
  let s = seed; const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const blur = new Float32Array(size * size); for (let i = 0; i < blur.length; i++) blur[i] = rnd();
  for (let pass = 0; pass < 2; pass++) for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const i = y * size + x; blur[i] = (blur[i] * 2 + blur[y * size + ((x + 1) % size)] + blur[((y + 1) % size) * size + x]) / 4; }
  for (let i = 0; i < size * size; i++) { const v = Math.round(255 * (lo + (hi - lo) * blur[i])); img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v; img.data[i * 4 + 3] = 255; }
  ctx.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep, rep); return t;
}
// dark walnut: long grain along the table, a few darker streaks, a little figure
function woodTex(N) {
  const cv = document.createElement('canvas'); cv.width = cv.height = N; const x = cv.getContext('2d'); const im = x.createImageData(N, N);
  const n1 = (v) => vnoise(v), oct = (v) => n1(v) * 0.6 + n1(v * 2.3 + 11) * 0.3 + n1(v * 5.1 + 37) * 0.1;
  for (let j = 0; j < N; j++) {
    const row = oct(j * 0.045) * 0.5 + oct(j * 0.23 + 7) * 0.35;
    for (let i = 0; i < N; i++) {
      const u = i / N;
      const warp = oct(u * 3 + j * 0.002) * 6;
      const g = Math.sin((j + warp) * 0.42 + oct(u * 2 + 5) * 2) * 0.5 + 0.5;
      const streak = Math.pow(Math.max(0, oct((j + warp * 0.5) * 0.03 + u * 0.4 + 19)), 2) * 1.6;
      let v = 0.78 + row * 0.18 + g * 0.1 - streak * 0.35 + (hash(i * 7.13 + j * 3.77) - 0.5) * 0.05;
      v = Math.max(0.35, Math.min(1.15, v));
      const k = (j * N + i) * 4; im.data[k] = Math.round(42 * v); im.data[k + 1] = Math.round(31 * v); im.data[k + 2] = Math.round(24 * v); im.data[k + 3] = 255;
    }
  }
  x.putImageData(im, 0, 0); return new THREE.CanvasTexture(cv);
}
const REFL_SHADER = {
  name: 'TableReflection',
  uniforms: { color: { value: null }, tDiffuse: { value: null }, textureMatrix: { value: null }, uAmt: { value: 1 }, uBg: { value: new THREE.Color() } },
  vertexShader: `uniform mat4 textureMatrix; varying vec4 vUv; varying vec3 vW;
    void main(){ vUv = textureMatrix * vec4(position, 1.0); vW = (modelMatrix * vec4(position, 1.0)).xyz; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: `uniform sampler2D tDiffuse; uniform float uAmt; uniform vec3 uBg; varying vec4 vUv; varying vec3 vW;
    void main(){ vec2 uv = vUv.xy / vUv.w; vec3 c = vec3(0.0); float ws = 0.0;
      for (int i = -5; i <= 5; i++) { float w = exp(-float(i * i) / 10.0); c += texture2D(tDiffuse, uv + vec2(0.0, float(i) * 0.0042)).rgb * w; ws += w; }
      c = max(c / ws - uBg, 0.0);
      vec3 V = normalize(cameraPosition - vW); float F = 0.04 + 0.96 * pow(1.0 - clamp(V.y, 0.0, 1.0), 5.0);
      gl_FragColor = vec4(c * F * uAmt, 1.0); }`,
};
function softSprite() {
  const cv = document.createElement('canvas'); cv.width = cv.height = 128;
  const x = cv.getContext('2d'); const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.25, 'rgba(255,255,255,0.5)'); g.addColorStop(0.6, 'rgba(255,255,255,0.08)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(cv);
}
function glowSprite(color, scale) {
  const m = new THREE.SpriteMaterial({ map: SOFT, color: color.clone(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false });
  const s = new THREE.Sprite(m); s.scale.setScalar(scale); return s;
}
let SOFT;

// ------------------------------------------------------------------ the clock (the film's spine: it opens the film, keeps the time, and becomes the logo)
function makeClock() {
  const R = 0.05, D = 0.03;
  const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
  body.position.y = R + 0.001; body.rotation.x = -0.08;
  const shell = phys({ color: 0x17181b, roughness: 0.42, clearcoat: 0.5, clearcoatRoughness: 0.35, side: THREE.DoubleSide });
  const can = new THREE.Mesh(new THREE.CylinderGeometry(R, R, D, 128, 1, true), shell); can.rotation.x = Math.PI / 2; body.add(can);
  const back = new THREE.Mesh(new THREE.CircleGeometry(R, 128), shell); back.position.z = -D / 2; back.rotation.y = Math.PI; body.add(back);
  const lipMat = phys({ color: 0x0f1012, roughness: 0.3, clearcoat: 0.8, emissive: new THREE.Color(0xeceef1), emissiveIntensity: 0 });
  const lip = new THREE.Mesh(new THREE.TorusGeometry(R - 0.0022, 0.0022, 24, 160), lipMat); lip.position.z = D / 2; body.add(lip);
  const faceMat = phys({ color: 0xe8e4dc, roughness: 0.62, sheen: 0.2 });
  const face = new THREE.Mesh(new THREE.CircleGeometry(R - 0.0045, 128), faceMat); face.position.z = D / 2 - 0.0015; body.add(face);
  const majorMat = phys({ color: 0x1a1b1d, roughness: 0.5, emissive: new THREE.Color(0xeceef1), emissiveIntensity: 0 });
  const minorMat = phys({ color: 0x1a1b1d, roughness: 0.5, transparent: true });
  const topMat = majorMat.clone(); topMat.transparent = true;
  for (let k = 0; k < 60; k++) {
    const a = (k / 60) * Math.PI * 2, big = k % 5 === 0;
    const len = big ? 0.0075 : 0.0032, w = big ? 0.0016 : 0.0006;
    const tk = new THREE.Mesh(new THREE.BoxGeometry(w, len, 0.0004), k === 0 ? topMat : big ? majorMat : minorMat);
    const r = R - 0.0075 - len / 2;
    tk.position.set(Math.sin(a) * r, Math.cos(a) * r, D / 2 - 0.0012); tk.rotation.z = -a; body.add(tk);
  }
  const hand = (len, w, mat, z, tail = 0.006) => {
    const h = new THREE.Group();
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, len + tail, 0.0008), mat); m.position.y = (len - tail) / 2; h.add(m);
    h.position.z = z; body.add(h); return h;
  };
  const hourMat = phys({ color: 0x1a1b1d, roughness: 0.5, emissive: ORANGE.clone(), emissiveIntensity: 0, transparent: true });
  const minMat = phys({ color: 0x1a1b1d, roughness: 0.5, transparent: true });
  const secMat = phys({ color: 0x3a3c40, roughness: 0.4, transparent: true });
  const hh = hand(0.026, 0.0032, hourMat, D / 2 + 0.0002);
  const mh = hand(0.037, 0.0024, minMat, D / 2 + 0.001);
  const sh = hand(0.039, 0.0007, secMat, D / 2 + 0.0017, 0.01);
  const capMat = phys({ color: 0x111214, roughness: 0.3, clearcoat: 1, emissive: new THREE.Color(0xeceef1), emissiveIntensity: 0, transparent: true });
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.0026, 0.0026, 0.002, 32), capMat); cap.rotation.x = Math.PI / 2; cap.position.z = D / 2 + 0.0024; body.add(cap);
  // the alarm: the setting, an orange marker on the rim
  const marker = new THREE.Group(); marker.position.z = D / 2 - 0.0009; marker.rotation.z = -(7 / 12) * Math.PI * 2; body.add(marker); // set for 7 a.m.
  const markMat = glowMat(ORANGE); markMat.transparent = true;
  const tri = new THREE.Mesh(new THREE.CircleGeometry(0.0062, 3), markMat); tri.position.y = R - 0.0035; tri.rotation.z = Math.PI / 2 + Math.PI; marker.add(tri);
  // the logo's dot, for the very end
  const dotMat = glowMat(ORANGE); dotMat.transparent = true; dotMat.opacity = 0;
  const dot = new THREE.Mesh(new THREE.CircleGeometry(R * 0.151, 48), dotMat); dot.position.set(0, R * 0.7, D / 2 + 0.0004); body.add(dot);
  // the sleep signal: a stretch of the night drawn on the face
  const arcGhostMat = new THREE.MeshBasicMaterial({ color: 0x8d9097, transparent: true, opacity: 0 });
  const arcMat = glowMat(ORANGE); arcMat.transparent = true; arcMat.opacity = 0;
  const ghost = new THREE.Mesh(new THREE.BufferGeometry(), arcGhostMat), arc = new THREE.Mesh(new THREE.BufferGeometry(), arcMat);
  body.add(ghost, arc);
  const setArc = (mesh, from, to, rr, w) => {
    const key = [from, to, rr, w].map((v) => v.toFixed(4)).join();
    if (mesh.userData.key === key) return; mesh.userData.key = key;
    const a0 = (from / 12) * Math.PI * 2; let a1 = (to / 12) * Math.PI * 2; if (a1 <= a0) a1 += Math.PI * 2;
    const pts = []; for (let k = 0; k <= 64; k++) { const a = a0 + ((a1 - a0) * k) / 64; pts.push(new THREE.Vector3(Math.sin(a) * rr, Math.cos(a) * rr, D / 2 - 0.0007)); }
    mesh.geometry.dispose(); mesh.geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 96, w, 8, false);
  };
  const foot = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.006, 0.026), phys({ color: 0x121315, roughness: 0.5 }));
  foot.position.set(0, -R + 0.002, -0.002); body.add(foot);
  shadows(g);
  // the portal: a hole in the face that shows the other camera's view
  const holeMat = new THREE.ShaderMaterial({
    uniforms: { tB: { value: null }, uRes: { value: new THREE.Vector2(1, 1) }, uR: { value: 0 }, uEdge: { value: ORANGE.clone().multiplyScalar(3) } },
    vertexShader: 'varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `uniform sampler2D tB; uniform vec2 uRes; uniform float uR; uniform vec3 uEdge; varying vec2 vP;
      void main(){ float r = length(vP); if (r > uR) discard;
        vec3 c = texture2D(tB, gl_FragCoord.xy / uRes).rgb;
        float e = smoothstep(uR - 0.0016, uR, r); // a thin orange line at the opening's edge
        gl_FragColor = vec4(mix(c, uEdge, e * 0.85), 1.0); }`,
    depthWrite: true,
  });
  const hole = new THREE.Mesh(new THREE.CircleGeometry(R * 1.2, 128), holeMat); hole.position.z = D / 2 - 0.0002; hole.visible = false; body.add(hole);
  return { g, body, R, D, faceMat, lipMat, majorMat, minorMat, topMat, hourMat, minMat, secMat, capMat, markMat, marker, dot, dotMat, ghost, arc, setArc, arcMat, arcGhostMat, hole, holeMat, hands: { h: hh, m: mh, s: sh } };
}

// a quartz tick: the second hand jumps once a second, with a small overshoot
function tickAngle(sec) { const i = Math.floor(sec), f = sec - i; return (i - 1 + outBack(f / 0.13, 2.2)) / 60 * Math.PI * 2; }
function setClock(C, daySec, { tick = true, hourOverride, minOverride, secOverride } = {}) {
  const s = ((daySec % 86400) + 86400) % 86400;
  const hrs = s / 3600, mins = (s % 3600) / 60, secs = s % 60;
  const ha = hourOverride ?? ((hrs % 12) / 12) * Math.PI * 2, ma = minOverride ?? (mins / 60) * Math.PI * 2;
  const sa = secOverride ?? (tick ? tickAngle(secs) : (secs / 60) * Math.PI * 2);
  C.hands.h.rotation.z = -ha; C.hands.m.rotation.z = -ma; C.hands.s.rotation.z = -sa;
}

function makeCup() {
  const g = new THREE.Group();
  const ceramic = phys({ color: 0xf1ede6, roughness: 0.32, clearcoat: 0.55, clearcoatRoughness: 0.18, sheen: 0.2, side: THREE.DoubleSide });
  const P = (a) => a.map(([x, y]) => new THREE.Vector2(x, y));
  const cupProfile = P([[0.0001, 0.0005], [0.026, 0.0005], [0.029, 0.003], [0.031, 0.008], [0.0355, 0.04], [0.0395, 0.068], [0.0402, 0.0712], [0.0396, 0.0722], [0.0372, 0.07], [0.0335, 0.042], [0.029, 0.012], [0.0001, 0.0105]]);
  const c = new THREE.Mesh(new THREE.LatheGeometry(cupProfile, 160), ceramic); c.position.y = 0.0052; g.add(c);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.0165, 0.0042, 32, 96, Math.PI * 1.25), ceramic);
  handle.position.set(0.0405, 0.037 + 0.0052, 0); handle.rotation.z = -Math.PI * 0.625; g.add(handle);
  const saucerProfile = P([[0.0001, 0.001], [0.05, 0.001], [0.066, 0.006], [0.074, 0.0115], [0.0752, 0.0128], [0.0738, 0.0132], [0.064, 0.0085], [0.046, 0.0055], [0.0001, 0.0052]]);
  g.add(new THREE.Mesh(new THREE.LatheGeometry(saucerProfile, 160), ceramic));
  shadows(g);
  // the coffee: a polar grid we can ripple
  const NR = 30, NS = 112, RMAX = 0.0356;
  const pos = [0, 0, 0], rad = [0], idx = [];
  for (let i = 1; i <= NR; i++) for (let j = 0; j < NS; j++) { const r = (i / NR) * RMAX, a = (j / NS) * Math.PI * 2; pos.push(Math.cos(a) * r, 0, Math.sin(a) * r); rad.push(r); }
  for (let j = 0; j < NS; j++) idx.push(0, 1 + ((j + 1) % NS), 1 + j);
  for (let i = 1; i < NR; i++) for (let j = 0; j < NS; j++) {
    const a = 1 + (i - 1) * NS + j, b = 1 + (i - 1) * NS + ((j + 1) % NS), c2 = 1 + i * NS + j, d = 1 + i * NS + ((j + 1) % NS);
    idx.push(a, b, c2, b, d, c2);
  }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(idx); geo.computeVertexNormals();
  const coffeeMat = phys({ color: 0x1b100a, roughness: 0.06, clearcoat: 1, clearcoatRoughness: 0.03 });
  const GLOW = { uGlow: { value: 0 }, uTime: { value: 0 }, uC: { value: AMBER.clone() } };
  coffeeMat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, GLOW);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec2 vCP;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvCP = position.xz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec2 vCP; uniform float uGlow, uTime; uniform vec3 uC;')
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        float rr = length(vCP) / 0.0356;
        float swirl = 0.85 + 0.15 * sin(atan(vCP.y, vCP.x) * 3.0 + rr * 9.0 - uTime * 1.6);
        totalEmissiveRadiance += uC * uGlow * exp(-rr * rr * 4.5) * swirl;`);
  };
  coffeeMat.customProgramCacheKey = () => 'coffee';
  const coffee = new THREE.Mesh(geo, coffeeMat); coffee.position.y = 0.0632; coffee.receiveShadow = true; g.add(coffee);
  return { g, coffee, geo, rad, GLOW, surfaceY: 0.0632 };
}

// the caffeine line: steam that rises out of the cup, peaks, then halves every 5 hours (6 p.m. at the cup)
const GRAPH = { top: 0.255, base: 0.018, perHour: 0.098 };
function caffeineY(h) { return GRAPH.base + (GRAPH.top - GRAPH.base) * Math.pow(0.5, h / 5); }
function makeLine(cupPos) {
  const pts = [];
  const steam = [[0.0, 0.066], [0.0035, 0.088], [-0.005, 0.113], [0.004, 0.14], [-0.003, 0.168], [0.0035, 0.196], [-0.001, 0.222], [0.002, 0.24]];
  steam.forEach(([x, y]) => pts.push(new THREE.Vector3(cupPos.x + x, y, cupPos.z)));
  // the turn into the curve, then the decay, out to 1:30 a.m.
  for (let h = 0.18; h <= 6.6; h += 0.1) pts.push(new THREE.Vector3(cupPos.x + 0.012 + h * GRAPH.perHour, caffeineY(h), cupPos.z));
  const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal', 0.5);
  const mk = (radius, opacity, additive) => new THREE.Mesh(new THREE.TubeGeometry(curve, 1400, radius, 10, false), new THREE.ShaderMaterial({
    uniforms: { uP: { value: 0 }, uC: { value: ORANGE.clone() }, uO: { value: opacity }, uTail: { value: 0.83 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform float uP, uO, uTail; uniform vec3 uC; varying vec2 vUv;
      void main(){ float s = vUv.x; if (s > uP) discard;
        float head = exp(-(uP - s) * 90.0);
        float tail = 1.0 - smoothstep(uTail, 1.0, s); // the far end fades into the night
        gl_FragColor = vec4(uC * (1.2 + 3.0 * head), uO * tail); }`,
    transparent: true, depthWrite: !additive, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
  }));
  const line = mk(0.0012, 1, false), halo = mk(0.0034, 0.05, true);
  const head = glowSprite(ORANGE, 0.03);
  const g = new THREE.Group(); g.add(line, halo, head);
  // where things are, along the line (0..1)
  const L = curve.getLength(); const at = (x) => { // the first parameter, past the steam, where the line reaches x
    const p = new THREE.Vector3(); let top = 0;
    for (let i = 0; i <= 4000; i++) { const u = i / 4000; curve.getPointAt(u, p); if (p.y > top) top = p.y; if (p.y < top - 0.0005 && p.x >= x) return u; }
    return 1;
  };
  const peakU = at(cupPos.x + 0.004);
  const elevenX = cupPos.x + 0.012 + 5 * GRAPH.perHour;
  const elevenU = at(elevenX);
  const half = new THREE.Vector3(elevenX, caffeineY(5), cupPos.z);
  const dot = new THREE.Mesh(new THREE.SphereGeometry(0.0036, 24, 16), glowMat(ORANGE)); dot.position.copy(half); g.add(dot);
  const dash = new THREE.Group(); const dashMat = new THREE.MeshBasicMaterial({ color: 0x9a9da3, transparent: true, opacity: 0.9 });
  for (let y = 0.003; y < half.y - 0.007; y += 0.008) { const d = new THREE.Mesh(new THREE.BoxGeometry(0.0007, 0.0042, 0.0007), dashMat); d.position.set(half.x, y, half.z); dash.add(d); }
  g.add(dash);
  return { g, curve, line, halo, head, dot, dash, dashMat, peakU, elevenU, half, L };
}

function makeDial() {
  const g = new THREE.Group();
  const knobG = new THREE.Group(); g.add(knobG);
  const alu = new THREE.MeshPhysicalMaterial({ color: 0xcdcac4, metalness: 1, roughness: 0.34, clearcoat: 0.4, clearcoatRoughness: 0.3 });
  const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.0235, 0.0245, 0.0045, 128), phys({ color: 0x1b1c1f, roughness: 0.4, clearcoat: 0.6 }));
  skirt.position.y = 0.00225; g.add(skirt);
  const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.0195, 0.0205, 0.016, 128), alu); knob.position.y = 0.0045 + 0.008; knobG.add(knob);
  const knurl = new THREE.InstancedMesh(new THREE.BoxGeometry(0.0009, 0.0125, 0.0012), alu, 72); const M = new THREE.Matrix4(), Q = new THREE.Quaternion();
  for (let k = 0; k < 72; k++) { const a = (k / 72) * Math.PI * 2; M.compose(new THREE.Vector3(Math.cos(a) * 0.0203, 0.0045 + 0.0085, Math.sin(a) * 0.0203), Q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), -a), new THREE.Vector3(1, 1, 1)); knurl.setMatrixAt(k, M); }
  knobG.add(knurl);
  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.0178, 0.0178, 0.0008, 128), new THREE.MeshPhysicalMaterial({ color: 0xd8d5cf, metalness: 1, roughness: 0.22 }));
  top.position.y = 0.0205; knobG.add(top);
  const ind = new THREE.Mesh(new THREE.BoxGeometry(0.0022, 0.0006, 0.012), glowMat(ORANGE)); ind.position.set(0, 0.0211, -0.0095); knobG.add(ind);
  const tickMat = new THREE.MeshBasicMaterial({ color: 0x6f7278 });
  for (let k = 0; k <= 24; k++) {
    const a = -Math.PI * 0.75 + (k / 24) * Math.PI * 1.5, big = k % 6 === 0, len = big ? 0.0055 : 0.003;
    const t = new THREE.Mesh(new THREE.BoxGeometry(big ? 0.0009 : 0.0006, 0.0003, len), tickMat);
    const r = 0.029 + len / 2; t.position.set(Math.sin(a) * r, 0.0002, -Math.cos(a) * r); t.rotation.y = -a; g.add(t);
  }
  const setMat = glowMat(ORANGE); setMat.transparent = true; setMat.opacity = 0;
  const set = new THREE.Mesh(new THREE.BoxGeometry(0.0012, 0.0004, 0.007), setMat); g.add(set);
  shadows(g);
  return { g, knobG, set, setMat, angle: (v) => -Math.PI * 0.75 + v * Math.PI * 1.5 };
}

function makePhone(glassOpts = {}) {
  const g = new THREE.Group();
  const W = 0.0716, L = 0.1476, Th = 0.0078;
  const body = new THREE.Mesh(new RoundedBoxGeometry(W, Th, L, 6, 0.0085), phys({ color: 0x1a1c20, roughness: 0.3, metalness: 0.6, clearcoat: 0.8, clearcoatRoughness: 0.2 }));
  body.position.y = Th / 2; g.add(body);
  const cv = document.createElement('canvas'); cv.width = 590; cv.height = 1220;
  const x = cv.getContext('2d');
  const bg = x.createLinearGradient(0, 0, 0, 1220); bg.addColorStop(0, '#9fc2ff'); bg.addColorStop(0.55, '#5f86e8'); bg.addColorStop(1, '#2c3f8f');
  x.fillStyle = bg; x.fillRect(0, 0, 590, 1220);
  x.fillStyle = 'rgba(255,255,255,0.96)'; x.textAlign = 'center'; x.font = '300 200px Archivo'; x.fillText('11:47', 295, 420);
  x.font = '500 34px Archivo'; x.fillStyle = 'rgba(255,255,255,0.8)'; x.fillText('Thursday, October 1', 295, 200);
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const screenMat = new THREE.MeshBasicMaterial({ map: tex, color: new THREE.Color(0, 0, 0) });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(W - 0.004, L - 0.004), screenMat); screen.rotation.x = -Math.PI / 2; screen.position.y = Th + 0.0002; g.add(screen);
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(W - 0.003, L - 0.003), phys({ color: 0x000000, roughness: 0.3, specularIntensity: 0.25, transparent: true, opacity: 0.35, depthWrite: false, ...glassOpts }));
  glass.rotation.x = -Math.PI / 2; glass.position.y = Th + 0.0004; g.add(glass);
  shadows(g);
  return { g, screenMat };
}

function makeLamp() {
  const g = new THREE.Group();
  const brass = new THREE.MeshPhysicalMaterial({ color: 0xb08d57, metalness: 1, roughness: 0.35 });
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.06, 0.018, 64), brass); base.position.y = 0.009; g.add(base);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.0055, 0.0055, 0.26, 24), brass); stem.position.y = 0.148; g.add(stem);
  const shadeMat = new THREE.MeshStandardMaterial({ color: 0x9a8f80, emissive: new THREE.Color(0xffc27a), emissiveIntensity: 0, side: THREE.DoubleSide, roughness: 0.9 });
  const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.11, 0.14, 96, 1, true), shadeMat); shade.position.y = 0.3; g.add(shade);
  const bulbMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0, 0, 0) });
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.018, 24, 16), bulbMat); bulb.position.y = 0.27; g.add(bulb);
  shadows(g, true, true); shade.castShadow = false; bulb.castShadow = false;
  return { g, shadeMat, bulbMat };
}

// adenosine, as a warm haze that fills the brain from the bottom up, like a gauge
const FILL = { uLevel: { value: -1 }, uAmt: { value: 0 }, uLine: { value: 0 }, uTime: { value: 0 }, uFill: { value: new THREE.Color(1.0, 0.5, 0.17) } };
function fillable(mat) {
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, FILL);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vFW;')
      .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvFW = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vFW; uniform float uLevel, uAmt, uLine, uTime; uniform vec3 uFill;')
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        float wob = 0.0022 * sin(vFW.x * 95.0 + uTime * 1.7) + 0.0018 * sin(vFW.z * 120.0 - uTime * 2.1);
        float dl = uLevel + wob - vFW.y;
        float inside = smoothstep(-0.002, 0.016, dl);
        float cloud = 0.62 + 0.38 * sin(vFW.x * 150.0 + uTime * 0.8) * sin(vFW.y * 130.0 - uTime * 0.6) * sin(vFW.z * 140.0 + uTime * 0.5);
        float rim = 1.0 - abs(dot(normal, normalize(vViewPosition)));
        totalEmissiveRadiance += uFill * uAmt * inside * cloud * (0.12 + 0.55 * rim * rim);
        totalEmissiveRadiance += uFill * uLine * exp(-dl * dl / 0.0000045) * 1.6;`);
  };
  mat.customProgramCacheKey = () => 'brainfill';
  mat.needsUpdate = true;
}
function brainHaze(center, radii, n, seed) {
  let s = seed; const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const pos = new Float32Array(n * 3), size = new Float32Array(n), alpha = new Float32Array(n), ph = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    let x, y, z; do { x = rnd() * 2 - 1; y = rnd() * 2 - 1; z = rnd() * 2 - 1; } while (x * x + y * y + z * z > 1);
    pos[i * 3] = center.x + x * radii.x; pos[i * 3 + 1] = center.y + y * radii.y; pos[i * 3 + 2] = center.z + z * radii.z;
    const big = rnd() < 0.55;
    size[i] = big ? 30 + rnd() * 60 : 3 + rnd() * 4; alpha[i] = big ? 0.04 + rnd() * 0.06 : 0.14 + rnd() * 0.22; ph[i] = rnd() * 100;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('size', new THREE.BufferAttribute(size, 1));
  g.setAttribute('alpha', new THREE.BufferAttribute(alpha, 1)); g.setAttribute('ph', new THREE.BufferAttribute(ph, 1));
  const m = new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color(1.0, 0.6, 0.25) }, uScale: { value: 1 }, uLevel: FILL.uLevel, uAmt: { value: 0 }, uTime: FILL.uTime },
    vertexShader: `attribute float size; attribute float alpha; attribute float ph; varying float vA; uniform float uScale, uLevel, uAmt, uTime;
      void main(){ vec3 p = position + vec3(sin(uTime * 0.5 + ph) * 0.004, sin(uTime * 0.37 + ph * 1.7) * 0.003 + mod(uTime * 0.004 + ph * 0.01, 0.01), cos(uTime * 0.43 + ph * 2.3) * 0.004);
        vec4 wp = modelMatrix * vec4(p, 1.0); float below = smoothstep(-0.003, 0.02, uLevel - wp.y);
        vA = alpha * below * uAmt; vec4 mv = viewMatrix * wp; gl_PointSize = size * uScale * (0.35 / -mv.z); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform vec3 uColor; varying float vA; void main(){ vec2 d = gl_PointCoord - 0.5; float a = smoothstep(0.5, 0.0, length(d)); gl_FragColor = vec4(uColor * 1.4, a * a * vA); }`,
    transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending,
  });
  const p = new THREE.Points(g, m); p.renderOrder = 5; return p;
}
function motes(center, radii, n, seed, color, drift = [0, -0.01, 0], period = 4, big = false) {
  let s = seed; const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const pos = new Float32Array(n * 3), size = new Float32Array(n), ph = new Float32Array(n);
  for (let i = 0; i < n; i++) { pos[i * 3] = center.x + (rnd() * 2 - 1) * radii.x; pos[i * 3 + 1] = center.y + (rnd() * 2 - 1) * radii.y; pos[i * 3 + 2] = center.z + (rnd() * 2 - 1) * radii.z; size[i] = big ? 40 + rnd() * 70 : 2 + rnd() * 5; ph[i] = rnd() * 100; }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('size', new THREE.BufferAttribute(size, 1)); g.setAttribute('ph', new THREE.BufferAttribute(ph, 1));
  const m = new THREE.ShaderMaterial({
    uniforms: { uColor: { value: color.clone() }, uScale: { value: 1 }, uAmt: { value: 0 }, uTime: FILL.uTime, uBeamA: { value: new THREE.Vector3() }, uBeamD: { value: new THREE.Vector3(0, 0, 1) }, uBeamR: { value: 0.2 }, uDrift: { value: new THREE.Vector3(...drift) }, uPeriod: { value: period } },
    vertexShader: `attribute float size; attribute float ph; varying float vA; uniform float uScale, uAmt, uTime, uBeamR, uPeriod; uniform vec3 uBeamA, uBeamD, uDrift;
      void main(){ float life = mod(uTime + ph, uPeriod) / uPeriod;
        vec3 p = position + vec3(sin(uTime * 0.21 + ph) * 0.012, sin(uTime * 0.17 + ph * 1.3) * 0.01, cos(uTime * 0.19 + ph * 2.1) * 0.012) * (length(uDrift) > 0.015 ? 0.25 : 1.0) + uDrift * life * uPeriod;
        vec3 q = p - uBeamA; float along = dot(q, uBeamD); float off = length(q - uBeamD * along);
        float inBeam = smoothstep(uBeamR, uBeamR * 0.35, off);
        float tw = 0.55 + 0.45 * sin(uTime * 2.3 + ph * 7.0);
        vA = uAmt * inBeam * tw * sin(life * 3.14159); vec4 mv = modelViewMatrix * vec4(p, 1.0); gl_PointSize = size * uScale * (0.35 / -mv.z); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform vec3 uColor; varying float vA; void main(){ vec2 d = gl_PointCoord - 0.5; float a = smoothstep(0.5, 0.1, length(d)); gl_FragColor = vec4(uColor, a * a * vA); }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  return new THREE.Points(g, m);
}
// a soft shaft of light, for the morning sun
function beam(from, to, r0, r1) {
  const len = from.distanceTo(to);
  const geo = new THREE.CylinderGeometry(r0, r1, len, 64, 1, true); geo.translate(0, -len / 2, 0);
  const m = new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color(1.0, 0.78, 0.5) }, uAmt: { value: 0 }, uLen: { value: len } },
    vertexShader: `varying vec3 vN; varying vec3 vV; varying float vY; uniform float uLen;
      void main(){ vY = -position.y / uLen; vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform vec3 uColor; uniform float uAmt; varying vec3 vN; varying vec3 vV; varying float vY;
      void main(){ float f = pow(abs(dot(vN, vV)), 2.2); float along = smoothstep(0.0, 0.25, vY) * (1.0 - smoothstep(0.75, 1.0, vY));
        gl_FragColor = vec4(uColor, f * along * uAmt); }`,
    transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
  });
  const mesh = new THREE.Mesh(geo, m); mesh.position.copy(from);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), to.clone().sub(from).normalize());
  return mesh;
}

function spot(scene, { color = 0xffffff, pos, target, angle = 0.5, penumbra = 0.9, shadow = false, size = 1024, decay = 2, distance = 0 }) {
  const s = new THREE.SpotLight(color, 0, distance, angle, penumbra, decay);
  s.position.copy(pos); s.target.position.copy(target); scene.add(s, s.target);
  if (shadow) { s.castShadow = true; s.shadow.mapSize.set(size, size); s.shadow.bias = -0.00008; s.shadow.normalBias = 0.002; s.shadow.radius = 6; s.shadow.blurSamples = 12; s.shadow.camera.near = 0.05; s.shadow.camera.far = 4; }
  return s;
}

// camera motion blur: every pixel is smeared along the path the camera's move gives it during the shutter
// (depth from the depth-of-field pass; world points are reprojected with the camera at the shutter's start and end)
const MotionShader = {
  uniforms: { tDiffuse: { value: null }, tDepth: { value: null }, uProjInv: { value: new THREE.Matrix4() }, uCamWorld: { value: new THREE.Matrix4() },
    uVP0: { value: new THREE.Matrix4() }, uVP1: { value: new THREE.Matrix4() }, uRes: { value: new THREE.Vector2(1, 1) }, uMax: { value: 90 }, uOn: { value: 1 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `#include <packing>
    uniform sampler2D tDiffuse, tDepth; uniform mat4 uProjInv, uCamWorld, uVP0, uVP1; uniform vec2 uRes; uniform float uMax, uOn; varying vec2 vUv;
    void main(){
      float d = unpackRGBAToDepth(texture2D(tDepth, vUv));
      if (d < 0.5) d = 0.9999; // the empty background is cleared with its colour, not a depth: treat it as far away
      vec4 v = uProjInv * vec4(vUv * 2.0 - 1.0, d * 2.0 - 1.0, 1.0); v /= v.w;
      vec4 w = uCamWorld * v;
      vec4 a = uVP0 * w, b = uVP1 * w; a /= a.w; b /= b.w;
      vec2 dv = (b.xy - a.xy) * 0.5 * uOn;
      float len = length(dv * uRes); if (len > uMax) dv *= uMax / len;
      vec3 acc = vec3(0.0);
      for (int i = 0; i < 16; i++) { float f = (float(i) + 0.5) / 16.0 - 0.5; acc += texture2D(tDiffuse, vUv + dv * f).rgb; }
      gl_FragColor = vec4(acc / 16.0, 1.0);
    }`,
};

// ------------------------------------------------------------------ the world
const W = {};
const CUP = new THREE.Vector3(-0.25, 0, 0);
const CLOCK = new THREE.Vector3(0.46, 0, -0.05), CLOCK_RY = -0.3;
const PHONE = new THREE.Vector3(0.38, 0, 0.12), PHONE_RY = 0.24;
const LAMP = new THREE.Vector3(0.55, 0, -0.32);
const DIALS = [new THREE.Vector3(0.505, 0, 0.075), new THREE.Vector3(0.505, 0, 0.15), new THREE.Vector3(0.505, 0, 0.225)];
const DIAL_SET = [0.96, 0.6, 0.12], DIAL_START = [0.3, 0.88, 0.7];
const WINDOW = new THREE.Vector3(1.05, 0.5, -1.95);

export async function init(cfg) {
  const Wd = cfg.width, Hd = cfg.height;
  await document.fonts.load('300 200px Archivo'); await document.fonts.load('500 34px Archivo');
  await H.init({ width: Wd, height: Hd, pixelRatio: 1, fov: 30, ring: false, groups: ['brain'], camera: { pos: [0, 1, 1], target: [0, 1, 0] } });
  const r = H.renderer, scene = H.scene;
  r.shadowMap.enabled = !cfg.noShadow; r.shadowMap.type = cfg.vsm ? THREE.VSMShadowMap : THREE.PCFSoftShadowMap; r.shadowMap.autoUpdate = false;
  r.toneMappingExposure = 1.0;
  for (const l of Object.values(H.lights)) l.intensity = 0;
  scene.environmentIntensity = 0.12;
  SOFT = softSprite();
  W.cfg = cfg; W.size = new THREE.Vector2(Wd, Hd); W.res = Hd / 1920;
  scene.fog = new THREE.Fog(0x08090b, 0.95, 3.2); scene.background = new THREE.Color(0x08090b);
  W.bg = scene.background; W.fog = scene.fog;

  // the table: one long dark surface that everything stands on
  const wood = woodTex(1024); wood.colorSpace = THREE.SRGBColorSpace; wood.wrapS = wood.wrapT = THREE.RepeatWrapping; wood.repeat.set(26, 26); wood.anisotropy = 8;
  const tm = phys({ color: 0xffffff, map: wood, roughness: 0.55, roughnessMap: noiseTex(3, 512, 0.75, 1.0, 60), clearcoat: 0.4, clearcoatRoughness: 0.2 });
  const table = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), tm); table.rotation.x = -Math.PI / 2; table.receiveShadow = true; scene.add(table); W.tableMat = tm;

  W.refl = new Reflector(new THREE.PlaneGeometry(3, 3), { textureWidth: Math.round(Wd / 2), textureHeight: Math.round(Hd / 2), shader: REFL_SHADER, multisample: 0, clipBias: 0.0003 });
  W.refl.rotation.x = -Math.PI / 2; W.refl.position.y = 0.0004; W.refl.camera.layers.set(1);
  Object.assign(W.refl.material, { transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
  W.refl.renderOrder = 2; scene.add(W.refl); if (cfg.noRefl) W.refl.visible = false;
  // the brain, from real anatomy, hung in the dark above the cup, its brainstem pointing at the coffee
  const brain = H.groups.get('brain') || [];
  let tip = null; const v = new THREE.Vector3(); const box = new THREE.Box3();
  for (const m of brain) {
    const p = m.geometry.attributes.position;
    for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i).add(m.position); box.expandByPoint(v); if (!tip || v.y < tip.y) tip = v.clone(); }
    m.castShadow = false; m.receiveShadow = false; fillable(m.material);
    if (m.userData.tissue === 'gland') m.visible = false; // the pituitary hangs like a drop: not this film's subject
  }
  const TIP_Y = 0.39;
  H.root.position.set(CUP.x - tip.x, TIP_Y - tip.y, CUP.z - tip.z);
  box.translate(H.root.position); tip.add(H.root.position);
  W.brainBox = box; W.tip = tip; W.brainC = box.getCenter(new THREE.Vector3()); W.brainSize = box.getSize(new THREE.Vector3());
  W.haze = brainHaze(W.brainC.clone().add(new THREE.Vector3(0, 0.005, 0.004)), new THREE.Vector3(W.brainSize.x * 0.36, W.brainSize.y * 0.4, W.brainSize.z * 0.36), 1400, 11);
  W.haze.material.uniforms.uScale.value = 2.0 * W.res; scene.add(W.haze);
  W.brainMats = brain.map((m) => m.material); W.brainBase = W.brainMats.map((m) => m.color.clone());

  // the drop the leftover gathers into
  W.drop = new THREE.Mesh(new THREE.SphereGeometry(0.0052, 32, 24), phys({ color: 0xffa860, emissive: AMBER.clone(), emissiveIntensity: 1.6, roughness: 0.12, clearcoat: 1 }));
  W.drop.visible = false; scene.add(W.drop);
  W.dropGlow = glowSprite(AMBER, 0.05); W.dropGlow.visible = false; scene.add(W.dropGlow);

  // the cup, and the splash
  W.cup = makeCup(); W.cup.g.position.copy(CUP); W.cup.g.rotation.y = -0.6; scene.add(W.cup.g);
  W.crown = [];
  const crownMat = phys({ color: 0x1a0f08, roughness: 0.05, clearcoat: 1, emissive: AMBER.clone(), emissiveIntensity: 0.35 });
  for (let i = 0; i < 22; i++) {
    const d = new THREE.Mesh(new THREE.SphereGeometry(0.00045 + hash(i * 3.1) * 0.0006, 12, 8), crownMat); d.visible = false; scene.add(d);
    W.crown.push({ m: d, a: (i / 22) * Math.PI * 2 + hash(i) * 0.25, v: 0.05 + hash(i * 7.7) * 0.04, vy: 0.11 + hash(i * 1.3) * 0.08 });
  }
  W.jet = new THREE.Mesh(new THREE.CapsuleGeometry(0.0016, 0.01, 6, 16), crownMat); W.jet.visible = false; scene.add(W.jet);
  W.steam = motes(CUP.clone().add(new THREE.Vector3(0, 0.075, 0)), new THREE.Vector3(0.018, 0.01, 0.018), 90, 21, new THREE.Color(0.85, 0.88, 0.95), [0, 0.022, 0], 3.5, true);

  // the caffeine line
  W.line = makeLine(CUP.clone()); scene.add(W.line.g);

  // the nightstand: clock, phone, lamp, and the three settings under the table
  W.clock = makeClock(); W.clock.g.position.copy(CLOCK); W.clock.g.rotation.y = CLOCK_RY; scene.add(W.clock.g);
  W.phone = makePhone(cfg.glass); W.phone.g.position.copy(PHONE); W.phone.g.rotation.y = PHONE_RY; scene.add(W.phone.g);
  W.lamp = makeLamp(); W.lamp.g.position.copy(LAMP); scene.add(W.lamp.g);
  W.dials = DIALS.map((p) => { const d = makeDial(); d.g.position.copy(p); scene.add(d.g); return d; });

  for (const o of [W.line.g, W.cup.g, W.clock.g, W.phone.g, W.lamp.g, W.drop, ...W.dials.map((d) => d.g)]) o.traverse((m) => m.layers.enable(1));
  // light
  W.sun = spot(scene, { color: 0x9db4ff, pos: CLOCK.clone().add(new THREE.Vector3(0.75, 0.42, -0.85)), target: CLOCK.clone().add(new THREE.Vector3(-0.05, 0.04, 0.05)), angle: 0.34, shadow: true, size: cfg.shadow ?? 1024 });
  W.front = spot(scene, { color: 0xc8d6ff, pos: CLOCK.clone().add(new THREE.Vector3(-0.35, 0.45, 0.8)), target: CLOCK.clone().add(new THREE.Vector3(0, 0.05, 0)), angle: 0.42 });
  W.key = spot(scene, { color: 0xffe6c8, pos: CUP.clone().add(new THREE.Vector3(-0.42, 0.8, 0.36)), target: CUP.clone().add(new THREE.Vector3(0.03, 0.04, 0)), angle: 0.32, shadow: true, size: cfg.shadow ?? 1024 });
  W.cupRim = spot(scene, { color: 0x9fb8ff, pos: CUP.clone().add(new THREE.Vector3(0.55, 0.32, -0.6)), target: CUP.clone().add(new THREE.Vector3(0, 0.06, 0)), angle: 0.4 });
  W.bKey = spot(scene, { color: 0xffe6cc, pos: W.brainC.clone().add(new THREE.Vector3(0.45, 0.3, 0.6)), target: W.brainC.clone(), angle: 0.22, penumbra: 0.8, distance: 1.15 });
  W.bRim = spot(scene, { color: 0xa8c0ff, pos: W.brainC.clone().add(new THREE.Vector3(-0.55, 0.3, -0.6)), target: W.brainC.clone(), angle: 0.2, penumbra: 0.8, distance: 1.2 });
  W.bFill = spot(scene, { color: 0xffffff, pos: W.brainC.clone().add(new THREE.Vector3(-0.7, -0.05, 0.55)), target: W.brainC.clone(), angle: 0.2, penumbra: 1, distance: 1.2 });
  W.lampSpot = spot(scene, { color: 0xffc58a, pos: LAMP.clone().add(new THREE.Vector3(0, 0.255, 0)), target: new THREE.Vector3(0.43, 0, 0.0), angle: 0.78, penumbra: 1, shadow: true, size: cfg.shadow ?? 1024 });
  W.bulb = new THREE.PointLight(0xffc98a, 0, 1.2, 2); W.bulb.position.copy(LAMP).add(new THREE.Vector3(0, 0.29, 0)); scene.add(W.bulb);
  W.phoneGlow = new THREE.SpotLight(0x9fc0ff, 0, 0, 1.2, 1, 2); W.phoneGlow.position.copy(PHONE).add(new THREE.Vector3(0, 0.02, 0)); W.phoneGlow.target.position.copy(PHONE).add(new THREE.Vector3(-0.04, 0.6, 0.02)); scene.add(W.phoneGlow, W.phoneGlow.target);
  W.dialKey = spot(scene, { color: 0xfff0dc, pos: DIALS[1].clone().add(new THREE.Vector3(-0.3, 0.8, 0.05)), target: DIALS[1].clone(), angle: 0.28, penumbra: 1 });

  // the window, and the morning
  const wcv = document.createElement('canvas'); wcv.width = wcv.height = 256; const wx = wcv.getContext('2d'); const wg = wx.createRadialGradient(128, 128, 0, 128, 128, 128);
  wg.addColorStop(0, 'rgba(255,255,255,1)'); wg.addColorStop(0.35, 'rgba(255,255,255,0.45)'); wg.addColorStop(1, 'rgba(255,255,255,0)'); wx.fillStyle = wg; wx.fillRect(0, 0, 256, 256);
  W.winMat = new THREE.MeshBasicMaterial({ color: 0x000000, map: new THREE.CanvasTexture(wcv), transparent: true, depthWrite: false, fog: false, blending: THREE.AdditiveBlending });
  W.win = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.4), W.winMat); W.win.position.copy(WINDOW); W.win.lookAt(CLOCK.clone().add(new THREE.Vector3(-0.3, 0.2, 0.6))); scene.add(W.win);
  const bFrom = CLOCK.clone().add(new THREE.Vector3(0.75, 0.42, -0.85)), bTo = CLOCK.clone().add(new THREE.Vector3(-0.12, 0.0, 0.18));
  W.beam = beam(bFrom, bTo, 0.03, 0.2); scene.add(W.beam);
  W.dust = motes(CLOCK.clone().add(new THREE.Vector3(0.2, 0.2, -0.25)), new THREE.Vector3(0.4, 0.22, 0.4), 700, 5, new THREE.Color(1.0, 0.85, 0.62));
  W.dust.material.uniforms.uBeamA.value.copy(bFrom); W.dust.material.uniforms.uBeamD.value.copy(bTo.clone().sub(bFrom).normalize()); W.dust.material.uniforms.uBeamR.value = 0.14;
  W.dust.material.uniforms.uScale.value = 1.6 * W.res; scene.add(W.dust);
  W.steam.material.uniforms.uScale.value = 1.4 * W.res; W.steam.material.uniforms.uBeamA.value.copy(CUP).add(new THREE.Vector3(0, 0.05, 0)); W.steam.material.uniforms.uBeamD.value.set(0, 1, 0); W.steam.material.uniforms.uBeamR.value = 0.05; scene.add(W.steam);

  // cameras: the main one, and the one behind the portal
  W.cam = H.camera; W.cam.near = 0.005; W.cam.far = 12; W.cam.aspect = Wd / Hd; W.cam.updateProjectionMatrix();
  W.camB = new THREE.PerspectiveCamera(30, Wd / Hd, 0.005, 12);
  W.rtB = new THREE.WebGLRenderTarget(Wd, Hd, { type: THREE.HalfFloatType, samples: 4 });
  W.clock.holeMat.uniforms.tB.value = W.rtB.texture; W.clock.holeMat.uniforms.uRes.value.set(Wd, Hd);

  // post: depth of field, bloom, then the film look is added in 2D
  const composer = new EffectComposer(r); composer.setPixelRatio(1); composer.setSize(Wd, Hd);
  composer.addPass(new RenderPass(scene, W.cam));
  W.bokeh = new BokehPass(scene, W.cam, { focus: 0.6, aperture: 0.004, maxblur: 0.01 }); composer.addPass(W.bokeh);
  W.motion = new ShaderPass(MotionShader); W.motion.uniforms.tDepth.value = W.bokeh.renderTargetDepth.texture; W.motion.uniforms.uRes.value.set(Wd, Hd);
  W.motion.uniforms.uMax.value = 90 * (Hd / 1920); composer.addPass(W.motion);
  W.camM0 = new THREE.PerspectiveCamera(30, Wd / Hd, 0.005, 12); W.camM1 = new THREE.PerspectiveCamera(30, Wd / Hd, 0.005, 12);
  W.bloom = new UnrealBloomPass(new THREE.Vector2(Wd, Hd), 0.4, 0.6, 1.0); composer.addPass(W.bloom);
  composer.addPass(new OutputPass());
  composer.addPass(new SMAAPass(Wd, Hd));
  W.composer = composer;
  if (cfg.noBokeh) W.bokeh.enabled = false; if (cfg.noBloom) W.bloom.enabled = false; if (cfg.noSmaa) composer.passes[composer.passes.length - 1].enabled = false;
  buildTracks();
  // 2D output: average of sub-frames (motion blur), then grain and vignette
  W.out = document.getElementById('out'); W.out.width = Wd; W.out.height = Hd; W.ctx = W.out.getContext('2d');
  W.grain = []; for (let k = 0; k < 6; k++) { const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d'); const im = x.createImageData(256, 256); let sd = 7 + k * 101; for (let i = 0; i < 256 * 256; i++) { sd = (sd * 16807) % 2147483647; const vv = 128 + ((sd / 2147483647) - 0.5) * 120; im.data[i * 4] = im.data[i * 4 + 1] = im.data[i * 4 + 2] = vv; im.data[i * 4 + 3] = 255; } x.putImageData(im, 0, 0); W.grain.push(W.ctx.createPattern(c, 'repeat')); }
  const vg = W.ctx.createRadialGradient(Wd / 2, Hd * 0.46, Hd * 0.18, Wd / 2, Hd * 0.46, Hd * 0.72);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(0.55, 'rgba(0,0,0,0.12)'); vg.addColorStop(1, 'rgba(0,0,0,0.62)'); W.vig = vg;
  const sg = W.ctx.createLinearGradient(0, 0, 0, Hd * 0.5); sg.addColorStop(0, 'rgba(0,0,0,0.5)'); sg.addColorStop(0.45, 'rgba(0,0,0,0.3)'); sg.addColorStop(1, 'rgba(0,0,0,0)'); W.scrim = sg;
  buildOverlay(cfg);
  return { tip: tip.toArray(), brainC: W.brainC.toArray(), brainSize: W.brainSize.toArray(), line: W.line.L };
}

// ------------------------------------------------------------------ the camera: one path, no cuts
let CAM_A, CAM_B, CAM_F;
const V3 = (...a) => a;
function buildTracks() {
  const C = CLOCK, B = W.brainC, tip = W.tip, cupTop = new THREE.Vector3(CUP.x, 0.07, CUP.z);
  const face = clockFace();
  const n = face.n, c = face.c; // face normal and centre, world
  const cu = (up) => c.clone().add(new THREE.Vector3(0, up, 0)).toArray();
  const along = (d, up = 0, side = 0) => { const right = new THREE.Vector3().crossVectors(n, new THREE.Vector3(0, 1, 0)).normalize(); return c.clone().addScaledVector(n, d).addScaledVector(new THREE.Vector3(0, 1, 0), up).addScaledVector(right, side).toArray(); };
  // A: the opening, at the alarm, pushing into the clock face
  CAM_A = camTrack([
    { t: 0, p: V3(C.x - 0.15, 0.15, C.z + 0.76), l: V3(C.x - 0.035, 0.078, C.z), fov: 30 },
    { t: 3.2, p: V3(C.x - 0.12, 0.115, C.z + 0.53), l: V3(C.x - 0.014, 0.062, C.z) },
    { t: 4.6, p: along(0.2, 0.012, -0.03), l: c.toArray() },
    { t: 6.05, p: along(0.012, 0.0, 0.0), l: c.toArray(), fov: 34 },
  ]);
  // B: the brain, the drop, the coffee, the line, the night, the settings, the morning
  const bd = (dx, dy, dz) => V3(B.x + dx, B.y + dy, B.z + dz);
  CAM_B = camTrack([
    { t: 4.5, p: bd(0.3, 0.05, 1.22), l: bd(0, 0.036, 0), fov: 30 },
    { t: 6.05, p: bd(0.2, 0.046, 0.88), l: bd(0, 0.035, 0) },
    { t: 9.0, p: bd(0.07, 0.05, 0.8), l: bd(0, 0.034, 0) },
    { t: 12.3, p: bd(0.25, 0.05, 0.74), l: bd(0, 0.032, 0) },
    { t: 15.0, p: bd(0.37, 0.02, 0.6), l: bd(0, 0.02, 0) },
    { t: 16.9, p: V3(tip.x + 0.36, tip.y + 0.1, tip.z + 0.6), l: V3(tip.x, tip.y + 0.088, tip.z) },
    { t: 18.4, p: V3(CUP.x + 0.13, 0.3, CUP.z + 0.3), l: V3(CUP.x, 0.085, CUP.z) },
    { t: 21.5, p: V3(CUP.x + 0.05, 0.28, CUP.z + 0.3), l: V3(CUP.x, 0.088, CUP.z) },
    { t: 24.0, p: V3(CUP.x - 0.01, 0.2, CUP.z + 0.4), l: V3(CUP.x + 0.002, 0.11, CUP.z) },
    { t: 26.9, p: V3(CUP.x + 0.02, 0.2, CUP.z + 0.52), l: V3(CUP.x + 0.03, 0.19, CUP.z) },
    { t: 31.0, p: V3(0.235, 0.16, 0.52), l: V3(0.24, 0.12, 0) },
    { t: 33.5, p: V3(0.36, 0.17, 0.62), l: V3(0.44, 0.1, -0.08) },
    { t: 36.5, p: V3(0.38, 0.15, 0.53), l: V3(0.45, 0.085, -0.06) },
    { t: 39.4, p: along(0.46, 0.03, -0.02), l: cu(0.022) },
    { t: 42.6, p: along(0.37, 0.022, 0.0), l: cu(0.024) },
    { t: 44.6, p: along(0.5, 0.12, 0.05), l: V3(0.49, 0.05, 0.08) },
    { t: 46.4, p: V3(0.515, 0.53, 0.39), l: V3(0.548, 0.0, 0.112) },
    { t: 51.6, p: V3(0.517, 0.51, 0.38), l: V3(0.548, 0.0, 0.114) },
    { t: 54.6, p: V3(C.x - 0.13, 0.12, C.z + 0.62), l: V3(C.x - 0.01, 0.064, C.z) },
    { t: 58.6, p: V3(C.x - 0.1, 0.1, C.z + 0.5), l: V3(C.x - 0.005, 0.06, C.z) },
    { t: 61.2, p: along(0.9, 0.0, 0.0), l: along(0, 0.0, 0.0) },
    { t: 63, p: along(0.93, 0.0, 0.0), l: along(0, 0.0, 0.0) },
  ]);
}
function clockFace() {
  const body = W.clock.body; body.updateWorldMatrix(true, false);
  const c = new THREE.Vector3(0, 0, W.clock.D / 2).applyMatrix4(body.matrixWorld);
  const n = new THREE.Vector3(0, 0, 1).transformDirection(body.matrixWorld).normalize();
  return { c, n };
}
function aimCam(cam, k, t, shake = 1) {
  cam.position.fromArray(k.p); cam.lookAt(new THREE.Vector3().fromArray(k.l));
  // a steady, breathing hand: very small, very slow
  const a = 0.0011 * shake;
  cam.rotateX(vnoise(t * 0.31 + 3.1) * a); cam.rotateY(vnoise(t * 0.27 + 7.7) * a * 1.2); cam.rotateZ(vnoise(t * 0.19 + 1.9) * a * 0.6);
  cam.fov = k.fov; cam.updateProjectionMatrix(); cam.updateMatrixWorld(true);
}

// ------------------------------------------------------------------ one moment of the film
const TOD = (h, m = 0, s = 0) => h * 3600 + m * 60 + s;
function clockTime(t) { // the second hand keeps real seconds, even when the film is re-timed to a new voice
  const rt = W.realT ?? t, inv = W.tinv || ((x) => x);
  if (t < 8) return TOD(6, 59, 59.4) + rt;
  if (t < T.dawn0) return TOD(23, 47, 10) + (rt - inv(33));
  const a = TOD(23, 47, 10) + (inv(T.dawn0) - inv(33)), b = TOD(24 + 7, 0, 0);
  if (t < T.seven) return lerp(a, b, s5(T.dawn0, T.seven, t));
  return b + (rt - inv(T.seven));
}
function brainDay(t) { // the time of day in the brain's day, for the read-out
  if (t < T.night) return lerp(TOD(7), TOD(25), s5(T.fill0, T.night - 0.15, t));
  return lerp(TOD(25), TOD(31), s5(T.night + 0.1, T.woke, t));
}
function fmtTime(sec) { const s = ((sec % 86400) + 86400) % 86400; let h = Math.floor(s / 3600); const m = Math.floor((s % 3600) / 60 / 10) * 10; const pm = h >= 12; h = h % 12; if (h === 0) h = 12; return `${h}:${String(m).padStart(2, '0')} ${pm ? 'P.M.' : 'A.M.'}`; }

const tmpC = new THREE.Color();
function update(t) {
  const c = W.clock;
  FILL.uTime.value = t; W.cup.GLOW.uTime.value = t;
  // ---- the world's palette: dawn, the dark of the brain, evening, the lamp, morning, the end
  ckeys([[0, 0x0b111d], [4.6, 0x080a10], [6.2, 0x07080b], [12.4, 0x05070d], [16, 0x07080a], [19, 0x0b0907], [33.4, 0x0d0a08], [44, 0x0b0b0c], [52.4, 0x0b0b0c], [54.5, 0x1f160e], [59.4, 0x1c140d], [61, 0x040405]], t, W.bg);
  W.fog.color.copy(W.bg);
  W.reflAmt = keys([[0, 0.9], [59.4, 0.9], [60.6, 0.0]], t);
  W.fog.far = keys([[0, 3.2], [59.5, 3.2], [61.2, 1.6]], t);

  // ---- the clock, its alarm, and later its sleep signal
  const ct = clockTime(t);
  const back = s5(T.click - 0.55, T.click, t); // the end: every hand swings back to twelve
  setClock(c, ct, { tick: t < T.dawn0 || t > T.seven + 0.2 });
  if (back > 0) {
    const s = ((ct % 86400) + 86400) % 86400;
    const ha = ((s / 3600) % 12) / 12 * Math.PI * 2, ma = ((s % 3600) / 3600) * Math.PI * 2, sa = tickAngle(s % 60);
    const k = outBack(clamp01((t - (T.click - 0.55)) / 0.55), 1.4);
    c.hands.h.rotation.z = -lerp(ha, 0, k); c.hands.m.rotation.z = -lerp(ma, 0, k); c.hands.s.rotation.z = -lerp(sa, 0, k);
  }
  const ringing = t > T.alarm && t < 3.4 ? 1 : (t > T.seven && t < T.seven + 1.1 ? 0.5 : 0);
  c.g.position.copy(CLOCK); c.g.rotation.z = 0;
  if (ringing) { c.g.position.x += Math.sin(t * 190) * 0.00045 * ringing; c.g.rotation.z = Math.sin(t * 160) * 0.004 * ringing; }
  const flash = (t > T.alarm && t < 3.6 ? 0.5 + 0.5 * Math.cos((t - T.alarm) * Math.PI * 4) : 0) + (t > T.seven && t < T.seven + 1.2 ? 0.5 + 0.5 * Math.cos((t - T.seven) * Math.PI * 4) : 0);
  c.markMat.color.copy(ORANGE).multiplyScalar(1 + flash * 2.5 + ss(T.dialsUp, T.dialsUp + 1, t) * (1 - ss(T.dial1 - 0.2, T.dial1, t)) * 1.5);
  // the marker leaves at the end, the logo's dot arrives
  const endK = s5(T.final, T.click, t);
  c.markMat.opacity = 1 - ss(T.click - 0.6, T.click - 0.1, t);
  c.dotMat.opacity = ss(T.click - 0.15, T.click + 0.05, t); c.dot.scale.setScalar(Math.max(0.001, outBack(clamp01((t - T.click + 0.15) / 0.3), 2)));
  // sleep signal: where it should be (grey), and where late light pushes it (orange)
  const arcOn = ss(39.6, 40.4, t) * (1 - ss(T.dawn0 + 0.2, T.dawn0 + 1.2, t));
  const shift = ss(T.shift0, T.shift1, t) * (1 - s5(T.dial3 + 0.15, T.dial3 + 1.0, t));
  const sFrom = lerp(9.5, 11.1, shift), sTo = lerp(11.5, 13.1, shift);
  c.setArc(c.ghost, 9.5, 11.5, 0.0392, 0.0009); c.arcGhostMat.opacity = 0.55 * arcOn * ss(T.shift0, T.shift0 + 0.4, t);
  c.setArc(c.arc, sFrom, sTo, 0.0352, 0.0017); c.arcMat.opacity = arcOn; c.arcMat.color.copy(ORANGE).multiplyScalar(1.25);
  // the end: the face becomes the logo's dial
  c.faceMat.color.set(0xe8e4dc).lerp(tmpC.set(0x070708), endK);
  c.majorMat.color.set(0x1a1b1d).lerp(tmpC.set(0xeceef1), endK); c.majorMat.emissiveIntensity = endK * 0.55;
  c.topMat.color.copy(c.majorMat.color); c.topMat.emissiveIntensity = c.majorMat.emissiveIntensity; c.topMat.opacity = 1 - endK;
  c.minorMat.opacity = 1 - endK;
  c.lipMat.emissiveIntensity = endK * 0.42; c.lipMat.color.set(0x0f1012).lerp(tmpC.set(0xeceef1), endK);
  c.hourMat.color.set(0x1a1b1d).lerp(tmpC.set(0xff6a2b), endK); c.hourMat.emissiveIntensity = endK * 1.1;
  c.capMat.emissiveIntensity = endK * 0.5; c.capMat.color.set(0x111214).lerp(tmpC.set(0xeceef1), endK);
  // the portal opens in the face
  const open = s5(T.portal0, T.portal1 - 0.12, t);
  c.hole.visible = open > 0 && t < T.portal1;
  c.holeMat.uniforms.uR.value = open * c.R * 1.08;
  const early = t < 8 ? 1 - ss(T.portal0, T.portal0 + 0.6, t) : 1; // the hands melt away as the face opens
  const endFade = 1 - ss(T.click - 0.1, T.click + 0.25, t); // at the end only the hour hand stays, as the logo's hand
  const lapse = 1 - ss(T.dawn0, T.dawn0 + 0.2, t) * (1 - ss(T.seven - 0.15, T.seven + 0.1, t)); // no second hand in the time-lapse
  c.hourMat.opacity = early; c.minMat.opacity = early * endFade; c.secMat.opacity = early * endFade * lapse; c.capMat.opacity = early;

  // ---- light, act by act
  const dawn = 1 - ss(T.portal0, T.portal1, t);
  const morning = ss(T.dawn0 + 0.3, T.seven + 0.6, t) * (1 - ss(T.final + 0.2, T.click + 0.2, t));
  W.sun.intensity = dawn * 7 + morning * 15; ckeys([[0, 0x9db4ff], [52.3, 0x9db4ff], [53.6, 0xffbf7a]], t, W.sun.color);
  W.sun.shadow.autoUpdate = W.sun.intensity > 0.01;
  const lateFill = ss(T.lamp, T.lamp + 0.15, t) * (1 - ss(T.dawn0, T.dawn0 + 0.8, t));
  W.front.intensity = dawn * 1.6 + morning * 1.3 + lateFill * 0.55 + ss(T.final, T.click, t) * 2.4 * (1 - ss(T.logo, T.logo + 0.6, t)); ckeys([[0, 0xc8d6ff], [33, 0xc8d6ff], [33.5, 0xffd2a0], [52, 0xffd2a0], [53.6, 0xffe2c0], [59.4, 0xffe2c0], [60.4, 0xffffff]], t, W.front.color);
  W.winMat.color.set(0x3a55a0).multiplyScalar(dawn * 0.3); tmpC.set(0xc98446).multiplyScalar(morning * 0.48); W.winMat.color.add(tmpC);
  W.beam.material.uniforms.uAmt.value = morning * 0.11; W.dust.material.uniforms.uAmt.value = morning * 1.3;
  // the brain: lit like an exhibit; its light tells the time of day
  const bOn = ss(T.portal0, T.portal0 + 0.8, t) * (1 - ss(T.dropFall, T.splash, t));
  const day = ss(T.fill0, T.fill0 + 1, t) * (1 - ss(T.night, T.night + 0.7, t)), nightB = ss(T.night, T.night + 0.7, t) * (1 - ss(T.woke - 0.1, T.woke + 0.5, t));
  W.bKey.intensity = bOn * (1.25 + day * 0.85 - nightB * 0.95 + ss(T.woke - 0.1, T.woke + 0.3, t) * 0.35);
  ckeys([[6, 0xdfe8ff], [8, 0xfff2e2], [11, 0xffc890], [12.35, 0xffb070], [13, 0x6f86d8], [15.0, 0x6f86d8], [15.5, 0xe8eeff]], t, W.bKey.color);
  W.bRim.intensity = bOn * (2.6 + nightB * 1.2); ckeys([[6, 0xa8c0ff], [12.5, 0xa8c0ff], [13.2, 0x5b74e0], [15.2, 0x9fb6ff]], t, W.bRim.color);
  W.bFill.intensity = bOn * 0.22;
  // the cup: evening light, a warm key and a cool rim
  const cupOn = ss(T.dropFall - 0.2, T.splash, t) * (1 - ss(32.8, 35.5, t));
  W.key.intensity = cupOn * lerp(1.7, 2.8, ss(T.six, T.six + 2.5, t)); W.key.shadow.autoUpdate = W.key.intensity > 0.01;
  W.cupRim.intensity = cupOn * 1.8;
  // the lamp clicks on, the phone lights up; later, lights low, then off
  const lampK = (t > T.lamp ? (1 - Math.exp(-(t - T.lamp) * 30)) * (1 + 0.25 * Math.exp(-(t - T.lamp) * 9) * Math.sin((t - T.lamp) * 70)) : 0);
  const lampLevel = lampK * lerp(1, 0.28, ss(T.dial3, T.dial3 + 0.5, t)) * (1 - ss(T.lampOff, T.lampOff + 0.1, t));
  W.lampSpot.intensity = lampLevel * 1.25; W.lampSpot.shadow.autoUpdate = W.lampSpot.intensity > 0.01;
  W.bulb.intensity = lampLevel * 0.3;
  W.lamp.shadeMat.emissiveIntensity = lampLevel * 0.6; W.lamp.bulbMat.color.setRGB(1.6, 1.2, 0.8).multiplyScalar(lampLevel);
  const phoneK = ss(T.phone, T.phone + 0.18, t) * (1 - ss(T.dial1 - 0.05, T.dial1 + 0.25, t));
  W.phone.screenMat.color.setScalar(phoneK * 1.55); W.phoneGlow.intensity = phoneK * 1.1;
  // the dials: three settings rise out of the table, click into place, then sink away in the morning
  const dialsOn = [0, 1, 2].map((i) => s5(T.dialsUp + 0.15 + i * 0.18, T.dialsUp + 1.15 + i * 0.18, t) * (1 - s5(T.dawn0 + 0.5 + i * 0.12, T.dawn0 + 1.6 + i * 0.12, t)));
  W.dialKey.intensity = Math.max(...dialsOn) * 2.0;
  const setAt = [T.dial1, T.dial2, T.dial3];
  W.dials.forEach((d, i) => {
    d.g.position.y = -0.032 * (1 - dialsOn[i]); d.g.visible = dialsOn[i] > 0.001;
    const k = t < setAt[i] - 0.35 ? 0 : outBack(clamp01((t - setAt[i] + 0.35) / 0.42), 2.4);
    const v = lerp(DIAL_START[i], DIAL_SET[i], k);
    d.knobG.rotation.y = -d.angle(v);
    const a = d.angle(DIAL_SET[i]); d.set.position.set(Math.sin(a) * 0.0325, 0.0003, -Math.cos(a) * 0.0325); d.set.rotation.y = -a;
    d.setMat.opacity = ss(setAt[i] - 0.05, setAt[i] + 0.1, t);
  });

  // ---- adenosine: fills all day, sleep clears it, the alarm cuts the clearing short
  const bb = W.brainBox, hgt = bb.max.y - bb.min.y;
  let lv = keys([[T.fill0 - 0.5, 0.06], [T.fill1, 0.9], [T.night + 0.25, 0.92], [T.woke, 0.36], [T.drop0 + 0.1, 0.36], [T.dropFall, 0.0]], t);
  lv += Math.sin(t * 2.1) * 0.006 * ss(T.fill0, T.fill0 + 1, t);
  FILL.uLevel.value = bb.min.y + lv * hgt;
  const fillAmt = ss(T.portal0 + 0.3, T.fill0 + 0.4, t) * (1 - ss(T.dropFall - 0.1, T.dropFall + 0.3, t));
  FILL.uAmt.value = fillAmt * (0.95 + 0.25 * ss(T.woke, T.woke + 0.2, t) * (1 - ss(T.woke + 0.2, T.woke + 1.4, t)));
  FILL.uLine.value = fillAmt * 0.9;
  W.haze.material.uniforms.uAmt.value = fillAmt;
  // the brain dims a little while it fills (sleepy), and fades into the dark when we leave
  const sleepy = ss(T.fill0, T.fill1, t) * (1 - ss(T.night, T.woke, t)) * 0.18;
  W.brainMats.forEach((m, i) => m.color.copy(W.brainBase[i]).multiplyScalar(0.66 - sleepy));

  // ---- the drop: the leftover gathers at the brainstem, falls, and lands in the coffee
  const tip = W.tip, sY = W.cup.surfaceY + CUP.y;
  if (t > T.drop0 && t < T.splash) {
    W.drop.visible = W.dropGlow.visible = true;
    let y = tip.y - 0.002, sc = 1, sy = 1;
    if (t < T.dropFall) { const g = s5(T.drop0, T.dropFall, t); sc = Math.max(0.05, g); sy = 1 + 0.35 * g; y = tip.y - 0.0048 * g - 0.002; }
    else { const u = t - T.dropFall, dur = T.splash - T.dropFall, a = (2 * (tip.y - 0.007 - sY)) / (dur * dur); y = tip.y - 0.007 - 0.5 * a * u * u; const vel = a * u; sy = 1 + Math.min(1.6, vel * 2.2); sc = 1; }
    W.drop.position.set(tip.x, y, tip.z); W.drop.scale.set(sc / Math.sqrt(sy), sc * sy, sc / Math.sqrt(sy));
    W.dropGlow.position.copy(W.drop.position); W.dropGlow.material.opacity = 0.7 * sc;
  } else { W.drop.visible = W.dropGlow.visible = false; }
  // ---- the splash: a crown, a jet, rings; the amber glows under the coffee, then goes dark ("it hides it")
  const u = t - T.splash, gS = 0.6;
  W.crown.forEach((d) => {
    if (u > 0 && u < 1.4) {
      const y = sY + d.vy * u - 0.5 * gS * u * u;
      d.m.visible = y > sY - 0.001; const r = 0.004 + d.v * u;
      d.m.position.set(CUP.x + Math.cos(d.a) * r, Math.max(y, sY), CUP.z + Math.sin(d.a) * r);
    } else d.m.visible = false;
  });
  if (u > 0.18 && u < 1.1) { const k = Math.sin(clamp01((u - 0.18) / 0.92) * Math.PI); W.jet.visible = true; W.jet.scale.set(1, Math.max(0.05, k), 1); W.jet.position.set(CUP.x, sY + 0.007 * k, CUP.z); } else W.jet.visible = false;
  const rp = W.cup.geo.attributes.position;
  if (u > -0.1 && u < 4.5) {
    for (let i = 0; i < rp.count; i++) {
      const r = W.cup.rad[i]; let h = 0;
      if (u > 0) { const front = u * 0.045; const env = Math.exp(-u * 1.1) * ss(front + 0.004, front - 0.012, r) * Math.exp(-r * 30); h = 0.0014 * env * Math.sin(r * 420 - u * 26); }
      rp.setY(i, h);
    }
    rp.needsUpdate = true; W.cup.geo.computeVertexNormals();
  }
  W.cup.GLOW.uGlow.value = (u > 0 ? Math.min(1, u * 5) * lerp(1, 0.45, ss(T.splash + 0.2, T.hide0, t)) : 0) * (1 - ss(T.hide0 + 0.9, T.hide1, t)) * 0.75;
  W.steam.material.uniforms.uAmt.value = 0; W.steam.visible = false;

  // ---- the caffeine line: rises with the steam, peaks at 6 p.m., halves by 11 p.m.
  const L = W.line;
  const p = lineP(t);
  const lineOn = 1 - ss(T.body, T.body + 1.5, t);
  L.line.material.uniforms.uP.value = p; L.halo.material.uniforms.uP.value = p;
  L.line.material.uniforms.uO.value = lineOn; L.halo.material.uniforms.uO.value = 0.05 * lineOn;
  L.line.visible = L.halo.visible = p > 0.0005 && lineOn > 0.001;
  L.curve.getPointAt(Math.min(1, Math.max(0, p)), L.head.position); L.head.visible = p > 0.0005 && p < 0.995 && lineOn > 0.01; L.head.material.opacity = 0.9 * lineOn;
  const dotK = outBack(clamp01((t - T.eleven) / 0.35), 2.2); L.dot.visible = t > T.eleven && lineOn > 0.01; L.dot.scale.setScalar(Math.max(0.001, dotK * lineOn));
  const dashK = ss(T.eleven + 0.1, T.eleven + 0.8, t) * lineOn; L.dash.children.forEach((d, i, arr) => { d.visible = (1 - i / arr.length) < dashK * 1.02 && dashK > 0.01; });
  // the warm key walks along the table with the line, from the cup towards the nightstand
  { const hx = L.curve.getPointAt(Math.min(1, Math.max(0, p))).x; const fx = lerp(CUP.x, Math.min(hx, 0.3), ss(T.six - 0.3, T.six + 1.2, t));
    W.key.target.position.set(fx + 0.03, 0.04, 0); W.key.position.set(fx - 0.42, 0.8, 0.36); }

  // ---- the end: everything but the dial goes dark
  const endDark = ss(T.final + 0.2, T.click + 0.2, t);
  W.tableMat.color.setScalar(1 - endDark * 0.92);
  H.scene.environmentIntensity = 0.12 * (1 - endDark);
  W.front.angle = lerp(0.42, 0.075, endDark); W.front.penumbra = lerp(0.9, 0.5, endDark);
  { const f = clockFace(); W.front.target.position.lerpVectors(CLOCK.clone().add(new THREE.Vector3(0, 0.05, 0)), f.c, endDark); W.front.position.lerpVectors(CLOCK.clone().add(new THREE.Vector3(-0.35, 0.45, 0.8)), f.c.clone().addScaledVector(f.n, 0.95).add(new THREE.Vector3(0, 0.12, 0)), endDark); }
  W.bloom.strength = keys([[0, 0.35], [5, 0.45], [12, 0.5], [18.4, 0.42], [24, 0.5], [26, 0.6], [33.4, 0.45], [44, 0.4], [52, 0.45], [56, 0.5], [60, 0.5]], t);
}

function dropPos(t) {
  const tip = W.tip, sY = W.cup.surfaceY + CUP.y;
  if (t < T.dropFall) return new THREE.Vector3(tip.x, tip.y - 0.007, tip.z);
  const u = Math.min(t, T.splash) - T.dropFall, dur = T.splash - T.dropFall, a = (2 * (tip.y - 0.007 - sY)) / (dur * dur);
  return new THREE.Vector3(tip.x, tip.y - 0.007 - 0.5 * a * u * u, tip.z);
}
const lineP = (t) => { const L = W.line; return keys([[T.steam0, 0.0], [T.six + 0.6, L.peakU + 0.02], [T.eleven, L.elevenU], [T.lamp + 0.4, L.elevenU + 0.12], [T.phone + 0.8, 1.0]], t); };
// camera B, with the things it must keep in frame: the falling drop, then the head of the line
function camBAt(t) {
  const k = CAM_B(t);
  const wd = ss(T.dropFall - 0.25, T.dropFall + 0.1, t) * (1 - ss(T.splash + 0.05, T.splash + 0.7, t));
  if (wd > 0) { const d = dropPos(t); k.l = k.l.map((v, j) => lerp(v, d.getComponent(j), wd * 0.85)); }
  const p = lineP(t);
  const wh = ss(T.steam0 + 0.3, T.steam0 + 1.2, t) * (1 - ss(T.eleven + 0.3, T.eleven + 1.6, t));
  if (wh > 0 && p > 0.001) { const h = W.line.curve.getPointAt(Math.min(1, p)); k.l = k.l.map((v, j) => lerp(v, h.getComponent(j), wh * 0.55)); }
  return k;
}
// the camera for time t: before the portal it is camera A; behind the portal, camera B
function placeCameras(t) {
  const shake = 1;
  if (t < T.portal1) { aimCam(W.cam, CAM_A(t), t, shake); if (t > T.portal0 - 0.05) aimCam(W.camB, camBAt(t), t, shake); }
  else aimCam(W.cam, camBAt(t), t, shake);
  // focus follows what the camera looks at
  const k = t < T.portal1 ? CAM_A(t) : camBAt(t);
  const dist = new THREE.Vector3().fromArray(k.p).distanceTo(new THREE.Vector3().fromArray(k.l));
  const u = W.bokeh.uniforms; u.focus.value = dist;
  u.aperture.value = keys([[0, 0.006], [4.5, 0.007], [6, 0.004], [16, 0.004], [18.4, 0.006], [26, 0.005], [33.5, 0.004], [44, 0.0035], [52, 0.0045], [58, 0.005], [60, 0.002], [61, 0.0005]], t);
  u.maxblur.value = 0.012 * (W.size.y / 1920);
}

function composite(k, n, alpha) {
  const ctx = W.ctx;
  if (k === 0) { ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W.size.x, W.size.y); }
  ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = alpha; ctx.drawImage(H.renderer.domElement, 0, 0);
}

export function render(t, opts = {}) {
  const sub = opts.sub ?? 1, shutter = opts.shutter ?? 0.5, fps = opts.fps ?? 24;
  const r = H.renderer;
  for (let k = 0; k < sub; k++) {
    const tk = sub > 1 ? t + ((k + 0.5) / sub - 0.5) * (shutter / fps) : t;
    update(tk); placeCameras(tk); r.shadowMap.needsUpdate = true;
    if (W.cfg.lightScale) for (const [k, v] of Object.entries(W.cfg.lightScale)) if (W[k]) W[k].intensity *= v; // debugging: scale named lights
    { const half = (shutter / fps) / sub / 2, m = W.motion.uniforms;
      aimCam(W.camM0, poseAt(tk - half), tk - half); aimCam(W.camM1, poseAt(tk + half), tk + half);
      m.uVP0.value.multiplyMatrices(W.camM0.projectionMatrix, W.camM0.matrixWorldInverse);
      m.uVP1.value.multiplyMatrices(W.camM1.projectionMatrix, W.camM1.matrixWorldInverse);
      m.uProjInv.value.copy(W.cam.projectionMatrixInverse); m.uCamWorld.value.copy(W.cam.matrixWorld); m.uOn.value = (opts.noMotion || W.cfg.noMotion) ? 0 : 1; }
    W.refl.material.uniforms.uBg.value.copy(W.bg); W.refl.material.uniforms.uAmt.value = W.reflAmt;
    if (W.clock.hole.visible) {
      W.clock.hole.visible = false; r.setRenderTarget(W.rtB); r.clear(); r.render(H.scene, W.camB); r.setRenderTarget(null); W.clock.hole.visible = true;
    }
    W.composer.render();
    composite(k, sub, 1 / (k + 1));
  }
  // the film: a little grain, a soft vignette
  const ctx = W.ctx; ctx.globalAlpha = 1;
  // a soft dark scrim under the words at the top, only while there are words
  const words = Math.max(0, ...CAPS.map((c) => ss(c.t0 - 0.3, c.t0 + 0.2, t) * (1 - ss(c.t1 - 0.3, c.t1 + 0.3, t))));
  if (words > 0.001) { ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = words; ctx.fillStyle = W.scrim; ctx.fillRect(0, 0, W.size.x, W.size.y * 0.5); ctx.globalAlpha = 1; }
  ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = W.vig; ctx.fillRect(0, 0, W.size.x, W.size.y);
  ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = 0.16;
  const f = Math.round(t * 24), pat = W.grain[f % W.grain.length];
  ctx.save(); ctx.translate(-Math.floor(hash(f) * 256), -Math.floor(hash(f + 0.5) * 256)); ctx.fillStyle = pat; ctx.fillRect(0, 0, W.size.x + 256, W.size.y + 256); ctx.restore();
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  overlay(t);
  return true;
}

// ------------------------------------------------------------------ the words on screen
const CAPS = [
  { t0: 0.35, t1: 4.3, top: 292, size: 124, html: 'Always <em>tired?</em>' },
  { t0: 5.3, t1: 17.1, top: 238, size: 30, mono: true, html: '1' },
  { t0: 5.4, t1: 17.1, top: 292, size: 104, html: 'Short <em>sleep</em>' },
  { t0: 18.5, t1: 30.6, top: 238, size: 30, mono: true, html: '2' },
  { t0: 18.6, t1: 30.6, top: 292, size: 104, html: 'Late <em>coffee</em>' },
  { t0: 30.95, t1: 33.2, top: 292, size: 82, html: 'At 11 p.m., <em>half</em><br>is still there.' },
  { t0: 33.4, t1: 40.0, top: 238, size: 30, mono: true, html: '3' },
  { t0: 33.5, t1: 40.0, top: 292, size: 104, html: 'Late <em>light</em>' },
  { t0: 40.35, t1: 43.95, top: 292, size: 98, html: 'Sleep comes<br><em>later.</em>' },
  { t0: 44.35, t1: 52.2, top: 270, size: 80, html: 'For a 7 a.m. <em>alarm</em>' },
  { t0: 52.35, t1: 58.95, top: 280, size: 98, html: 'Still tired?' },
  { t0: 54.6, t1: 58.95, top: 392, size: 98, html: '<em>See a doctor.</em>' },
  { t0: 59.35, t1: 99, top: 360, size: 96, html: 'Back to<br><em>factory settings.</em>' },
];
const SUBS = [
  [0.35, 3.73, 'Always tired? Check these three things first.'],
  [4.35, 11.51, 'One: short sleep. All day, a chemical called adenosine builds up in your brain, and makes you sleepy.'],
  [12.35, 17.14, 'Sleep clears it. Cut sleep short, and some is left when you wake.'],
  [18.35, 25.56, "Two: late coffee. Coffee doesn't clear that chemical. It hides it, and that cuts into your sleep."],
  [26.35, 31.63, 'A coffee at 6 p.m.? About half of it is still in you at 11.'],
  [33.35, 39.66, "Three: late light. Bright light at night, even room light, tells your body clock it's still day,"],
  [40.35, 42.51, 'so your sleep signal comes later.'],
  [44.35, 51.71, 'For a 7 a.m. alarm: in bed by 11, last coffee by 2, lights low from 8.'],
  [52.35, 58.63, 'Still tired with enough sleep? See a doctor. Low iron, or your thyroid, can cause it.'],
  [59.35, 61.13, 'Back to factory settings.'],
];
const LOGO = '<svg viewBox="0 0 48 48" width="100%" height="100%"><circle cx="24" cy="24" r="20.5" fill="none" stroke="#ECEEF1" stroke-width="1.4"/>' +
  [30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((d) => { const a = (d * Math.PI) / 180; const x1 = 24 + Math.sin(a) * 15.2, y1 = 24 - Math.cos(a) * 15.2, x2 = 24 + Math.sin(a) * 17.6, y2 = 24 - Math.cos(a) * 17.6; return `<line x1="${x1.toFixed(2)}" y1="${y1.toFixed(2)}" x2="${x2.toFixed(2)}" y2="${y2.toFixed(2)}" stroke="#ECEEF1" stroke-width="1" stroke-linecap="round" opacity=".55"/>`; }).join('') +
  '<line x1="24" y1="24" x2="24" y2="14.2" stroke="#FF6A2B" stroke-width="2.2" stroke-linecap="round"/><circle cx="24" cy="9.6" r="3.1" fill="#FF6A2B"/><circle cx="24" cy="24" r="2" fill="#ECEEF1"/></svg>';
const OV = {};
function buildOverlay(cfg) {
  const ov = document.getElementById('ov'); ov.innerHTML = '';
  const wrap = document.createElement('div'); wrap.id = 'ovw'; wrap.style.cssText = `position:absolute;left:0;top:0;width:1080px;height:1920px;transform-origin:0 0;transform:scale(${innerWidth / 1080})`; ov.appendChild(wrap);
  OV.caps = CAPS.map((c) => {
    const el = document.createElement('div'); el.className = c.mono ? 'num' : 'cap'; el.style.top = c.top + 'px'; el.style.fontSize = c.size + 'px';
    // split into words, so each can arrive on its own
    const tmp = document.createElement('div'); tmp.innerHTML = c.html;
    const words = [];
    const walk = (node, into) => {
      for (const ch of [...node.childNodes]) {
        if (ch.nodeType === 3) { ch.textContent.split(/(\s+)/).forEach((w) => { if (!w) return; if (/^\s+$/.test(w)) { into.appendChild(document.createTextNode(' ')); return; } const s = document.createElement('span'); s.className = 'w'; s.textContent = w; into.appendChild(s); words.push(s); }); }
        else if (ch.nodeName === 'BR') into.appendChild(document.createElement('br'));
        else { const e = document.createElement(ch.nodeName); walk(ch, e); into.appendChild(e); }
      }
    };
    walk(tmp, el); wrap.appendChild(el);
    return { ...c, el, words };
  });
  const tag = (cls, html) => { const e = document.createElement('div'); e.className = cls; e.innerHTML = html; e.style.opacity = 0; wrap.appendChild(e); return e; };
  OV.time = tag('mark', ''); OV.time.style.cssText += ';left:0;right:0;text-align:center;top:420px;font-size:28px';
  OV.aden = tag('tag o', 'Adenosine'); OV.aden.style.fontSize = '26px';
  OV.six = tag('tag', '6 p.m.'); OV.six.style.fontSize = '28px';
  OV.eleven = tag('tag', '11 p.m.'); OV.eleven.style.fontSize = '28px';
  OV.dl = [['In bed by', '11 p.m.'], ['Last coffee', '2 p.m.'], ['Lights low from', '8 p.m.']].map(([a, b]) => { const e = tag('tag', `${a}<b>${b}</b>`); e.style.fontSize = '24px'; e.querySelector('b').style.fontSize = '50px'; return e; });
  OV.logo = tag('', LOGO); OV.logo.style.position = 'absolute';
  OV.brand = tag('', '<div style="font-family:Archivo;font-weight:640;font-size:58px;letter-spacing:-0.02em;color:#eceef1;font-stretch:106%;text-align:center">Human Factory Settings</div><div class="mark" style="position:static;font-size:26px;text-align:center;margin-top:22px">@humanfactorysettings</div>');
  OV.brand.style.cssText += ';position:absolute;left:0;right:0';
  if (cfg.guide) {
    OV.label = tag('', 'VOICE GUIDE · AI VOICE · NOT FOR POSTING'); OV.label.style.cssText = 'position:absolute;left:0;right:0;margin:0 auto;top:44px;width:fit-content;padding:9px 20px;border-radius:30px;border:1px solid rgba(236,238,241,.25);background:rgba(8,9,11,.6);font-family:Geist Mono,monospace;font-size:21px;letter-spacing:.14em;color:#c9ccd2;opacity:1';
    OV.sub = tag('', ''); OV.sub.style.cssText = 'position:absolute;left:54px;right:54px;bottom:96px;text-align:center;font-family:Archivo,sans-serif;font-weight:520;font-size:36px;line-height:1.3;color:#eceef1;opacity:1';
  }
}
function wordsIn(c, t) {
  const n = c.words.length;
  c.words.forEach((w, i) => {
    const a = clamp01((t - c.t0 - i * 0.075) / 0.6), e = s5(0, 1, a);
    const o = clamp01((t - (c.t1 - 0.5)) / 0.5), x = s5(0, 1, o);
    w.style.opacity = (e * (1 - x)).toFixed(3);
    w.style.filter = `blur(${((1 - e) * 12 + x * 10).toFixed(2)}px)`;
    w.style.transform = `translateY(${((1 - e) * 26 - x * 12).toFixed(1)}px)`;
  });
  c.el.style.visibility = t > c.t0 - 0.1 && t < c.t1 + 0.1 ? 'visible' : 'hidden';
}
const proj = (v) => { const p = v.clone().project(W.cam); return [((p.x + 1) / 2) * 1080, ((1 - p.y) / 2) * 1920, p.z]; };
function place(el, v, dx, dy, o) {
  const [x, y] = proj(v); const w = el.offsetWidth || 200;
  o *= ss(-20, 60, x) * (1 - ss(1020, 1100, x)) * ss(-20, 80, y) * (1 - ss(1850, 1940, y));
  const left = Math.min(1080 - 48 - w, Math.max(48, x + dx));
  el.style.left = left.toFixed(1) + 'px'; el.style.top = (y + dy).toFixed(1) + 'px'; el.style.opacity = o.toFixed(3); el.style.filter = `blur(${((1 - o) * 8).toFixed(2)}px)`;
}
function overlay(t) {
  for (const c of OV.caps) wordsIn(c, t);
  // the brain's day, as a read-out
  const tOn = ss(T.fill0 - 0.2, T.fill0 + 0.4, t) * (1 - ss(T.drop0 + 0.4, T.drop0 + 0.9, t));
  OV.time.style.opacity = tOn.toFixed(3); OV.time.textContent = fmtTime(brainDay(t)); OV.time.style.color = t > T.night && t < T.woke ? '#9fb2e6' : t >= T.woke ? '#ff8a50' : 'rgba(236,238,241,.6)';
  // labels pinned to things
  const lvl = FILL.uLevel.value, bb = W.brainBox;
  { const [xl] = proj(new THREE.Vector3(bb.min.x, W.brainC.y, W.brainC.z)); const w = OV.aden.offsetWidth || 200;
    place(OV.aden, new THREE.Vector3(bb.min.x, Math.min(lvl, bb.max.y - 0.03), W.brainC.z + 0.03), -w - 22, -16, ss(7.5, 8.1, t) * (1 - ss(11.8, 12.3, t))); }
  const pk = new THREE.Vector3(); W.line.curve.getPointAt(W.line.peakU, pk);
  place(OV.six, pk, -150, -60, ss(T.six + 0.2, T.six + 0.8, t) * (1 - ss(33.0, 33.6, t)));
  place(OV.eleven, W.line.half, 26, -66, ss(T.eleven + 0.05, T.eleven + 0.45, t) * (1 - ss(33.0, 33.6, t)));
  const setAt = [T.dial1, T.dial2, T.dial3];
  OV.dl.forEach((e, i) => place(e, DIALS[i].clone().add(new THREE.Vector3(0.036, 0.0, 0.0)), 6, -52, ss(setAt[i] - 0.25, setAt[i] + 0.2, t) * (1 - ss(T.dawn0, T.dawn0 + 0.5, t))));
  // the end: the 3D dial hands over to the logo, exactly where it stands
  const f = clockFace(); const [cx, cy] = proj(f.c);
  const edge = f.c.clone().add(new THREE.Vector3(0, W.clock.R - 0.0022, 0)); const [, ey] = proj(edge); const rad = Math.abs(cy - ey);
  const lo = ss(T.logo, T.logo + 0.5, t), size = (rad / 20.5) * 48;
  OV.logo.style.left = (cx - size / 2).toFixed(1) + 'px'; OV.logo.style.top = (cy - size / 2).toFixed(1) + 'px'; OV.logo.style.width = OV.logo.style.height = size.toFixed(1) + 'px';
  OV.logo.style.opacity = lo.toFixed(3);
  OV.brand.style.top = (cy + size / 2 + 70).toFixed(1) + 'px'; const bo = ss(T.logo + 0.35, T.logo + 1.0, t); OV.brand.style.opacity = bo.toFixed(3); OV.brand.style.filter = `blur(${((1 - bo) * 10).toFixed(2)}px)`;
  if (OV.sub) { const s = SUBS.find(([a, b]) => t >= a - 0.05 && t <= b + 0.35); OV.sub.textContent = s ? s[2] : ''; }
}
function poseAt(t) { return t < T.portal1 ? CAM_A(t) : camBAt(t); }
export function motion(t, fps = 24, shutter = 0.5) {
  const dt = shutter / fps, a = poseAt(t - dt / 2), b = poseAt(t + dt / 2);
  const pa = new THREE.Vector3().fromArray(a.p), pb = new THREE.Vector3().fromArray(b.p);
  const fa = new THREE.Vector3().fromArray(a.l).sub(pa), fb = new THREE.Vector3().fromArray(b.l).sub(pb);
  const dist = Math.max(0.02, (fa.length() + fb.length()) / 2);
  const ang = fa.normalize().angleTo(fb.normalize()) + pa.distanceTo(pb) / dist + Math.abs(a.fov - b.fov) * Math.PI / 180 * 0.5;
  return (ang / (a.fov * Math.PI / 180)) * 1920;
}
export function info() { return { T, tip: W.tip.toArray(), brainC: W.brainC.toArray() }; }
function debugPose(t, pt) { // where a world point lands on screen with the main camera at t, and with the shutter cameras
  update(t); placeCameras(t); const v = new THREE.Vector3(...pt);
  const a = v.clone().project(W.cam); aimCam(W.camM0, poseAt(t), t); const b = v.clone().project(W.camM0);
  return [a.x, a.y, b.x, b.y];
}
// a smooth, monotone time map through anchor pairs [[tNew, tOld], ...] (Fritsch-Carlson cubic), so a finished film
// can follow a new voice: every frame at new time t shows the film at tOld = map(t). Mirrors retime.py exactly.
function timeMap(R) {
  const n = R.length, x = R.map((r) => r[0]), y = R.map((r) => r[1]), d = [], m = new Array(n);
  for (let i = 0; i < n - 1; i++) d.push((y[i + 1] - y[i]) / (x[i + 1] - x[i]));
  m[0] = d[0]; m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) { m[i] = 0; m[i + 1] = 0; continue; }
    const a = m[i] / d[i], b = m[i + 1] / d[i], s = a * a + b * b;
    if (s > 9) { const k = 3 / Math.sqrt(s); m[i] = k * a * d[i]; m[i + 1] = k * b * d[i]; }
  }
  return (t) => {
    if (t <= x[0]) return y[0] + (t - x[0]) * m[0];
    if (t >= x[n - 1]) return y[n - 1] + (t - x[n - 1]) * m[n - 1];
    let i = 0; while (t > x[i + 1]) i++;
    const h = x[i + 1] - x[i], s = (t - x[i]) / h, s2 = s * s, s3 = s2 * s;
    return (2 * s3 - 3 * s2 + 1) * y[i] + (s3 - 2 * s2 + s) * h * m[i] + (-2 * s3 + 3 * s2) * y[i + 1] + (s3 - s2) * h * m[i + 1];
  };
}
let TMAP = (x) => x;
async function initR(cfg) {
  TMAP = cfg.retime ? timeMap(cfg.retime) : (x) => x;
  const info = await init(cfg);
  W.tinv = (u) => { let a = -5, b = 400; for (let i = 0; i < 60; i++) { const c = (a + b) / 2; if (TMAP(c) < u) a = c; else b = c; } return (a + b) / 2; };
  return info;
}
function renderR(t, opts = {}) { // the shutter is open for the same real time; in film time it is longer or shorter
  W.realT = t;
  const fps = opts.fps ?? 24, sh = opts.shutter ?? 0.5, a = TMAP(t - sh / fps / 2), b = TMAP(t + sh / fps / 2);
  return render(TMAP(t), { ...opts, shutter: Math.max(0.05, (b - a) * fps) });
}
H.film = { init: initR, render: renderR, info, motion: (t, f, sh) => motion(TMAP(t), f, sh), T, debugPose };

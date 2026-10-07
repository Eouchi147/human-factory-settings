// Human Factory Settings · the film kit: everything every film shares.
// One continuous shot per film; every frame is a pure function of t (seconds), rendered frame by frame.
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
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
export { THREE, RoundedBoxGeometry };

export const ORANGE = new THREE.Color(0xff6a2b);
export const AMBER = new THREE.Color(1.0, 0.5, 0.16);
export const COLD = new THREE.Color(0x9db4ff);
export const TIME = { value: 0 }; // shared clock uniform for shaders that drift
// ------------------------------------------------------------------ small maths
export const clamp01 = (x) => Math.min(1, Math.max(0, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const ss = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
export const s5 = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * t * (t * (t * 6 - 15) + 10); };
export const outCubic = (t) => 1 - Math.pow(1 - clamp01(t), 3);
export const outBack = (t, k = 1.7) => { t = clamp01(t); const c = k + 1; return 1 + c * Math.pow(t - 1, 3) + k * Math.pow(t - 1, 2); };
export const hash = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
export const vnoise = (x) => { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return lerp(hash(i), hash(i + 1), u) * 2 - 1; };
export function keys(k, t) { // [[t, v], ...], smooth between keys
  if (t <= k[0][0]) return k[0][1];
  for (let i = 0; i < k.length - 1; i++) if (t < k[i + 1][0]) return lerp(k[i][1], k[i + 1][1], s5(k[i][0], k[i + 1][0], t));
  return k[k.length - 1][1];
}
export const _ca = new THREE.Color(), _cb = new THREE.Color();
export function ckeys(k, t, out) { // [[t, 0xrrggbb], ...]
  if (t <= k[0][0]) return out.set(k[0][1]);
  for (let i = 0; i < k.length - 1; i++) if (t < k[i + 1][0]) { _ca.set(k[i][1]); _cb.set(k[i + 1][1]); return out.copy(_ca).lerp(_cb, s5(k[i][0], k[i + 1][0], t)); }
  return out.set(k[k.length - 1][1]);
}

// A camera path through keyframes {t, p, l, fov, stop}: Hermite curves with tangents from the neighbours (in time),
// so the camera never stops at a key unless told to: one continuous move.
export function camTrack(K) {
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
export const phys = (o) => new THREE.MeshPhysicalMaterial({ metalness: 0, roughness: 0.5, ...o });
export const glowMat = (c, o = 1) => new THREE.MeshBasicMaterial({ color: c.clone(), transparent: o < 1, opacity: o, depthWrite: o >= 1 });
export function shadows(obj, cast = true, recv = true) { obj.traverse((m) => { if (m.isMesh) { m.castShadow = cast; m.receiveShadow = recv; } }); }
export function noiseTex(seed = 1, size = 512, lo = 0.8, hi = 1.0, rep = 18) {
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
export function woodTex(N) {
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
export const REFL_SHADER = {
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
export function softSprite() {
  const cv = document.createElement('canvas'); cv.width = cv.height = 128;
  const x = cv.getContext('2d'); const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.25, 'rgba(255,255,255,0.5)'); g.addColorStop(0.6, 'rgba(255,255,255,0.08)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(cv);
}
export function glowSprite(color, scale) {
  const m = new THREE.SpriteMaterial({ map: SOFT, color: color.clone(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false });
  const s = new THREE.Sprite(m); s.scale.setScalar(scale); return s;
}
export let SOFT;
export function motes(center, radii, n, seed, color, drift = [0, -0.01, 0], period = 4, big = false) {
  let s = seed; const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const pos = new Float32Array(n * 3), size = new Float32Array(n), ph = new Float32Array(n);
  for (let i = 0; i < n; i++) { pos[i * 3] = center.x + (rnd() * 2 - 1) * radii.x; pos[i * 3 + 1] = center.y + (rnd() * 2 - 1) * radii.y; pos[i * 3 + 2] = center.z + (rnd() * 2 - 1) * radii.z; size[i] = big ? 40 + rnd() * 70 : 2 + rnd() * 5; ph[i] = rnd() * 100; }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('size', new THREE.BufferAttribute(size, 1)); g.setAttribute('ph', new THREE.BufferAttribute(ph, 1));
  const m = new THREE.ShaderMaterial({
    uniforms: { uColor: { value: color.clone() }, uScale: { value: 1 }, uAmt: { value: 0 }, uTime: TIME, uBeamA: { value: new THREE.Vector3() }, uBeamD: { value: new THREE.Vector3(0, 0, 1) }, uBeamR: { value: 0.2 }, uDrift: { value: new THREE.Vector3(...drift) }, uPeriod: { value: period } },
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
export function beam(from, to, r0, r1) {
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

export function spot(scene, { color = 0xffffff, pos, target, angle = 0.5, penumbra = 0.9, shadow = false, size = 1024, decay = 2, distance = 0 }) {
  const s = new THREE.SpotLight(color, 0, distance, angle, penumbra, decay);
  s.position.copy(pos); s.target.position.copy(target); scene.add(s, s.target);
  if (shadow) { s.castShadow = true; s.shadow.mapSize.set(size, size); s.shadow.bias = -0.00008; s.shadow.normalBias = 0.002; s.shadow.radius = 6; s.shadow.blurSamples = 12; s.shadow.camera.near = 0.05; s.shadow.camera.far = 4; }
  return s;
}

// camera motion blur: every pixel is smeared along the path the camera's move gives it during the shutter
// (depth from the depth-of-field pass; world points are reprojected with the camera at the shutter's start and end)
export const MotionShader = {
  uniforms: { tDiffuse: { value: null }, tDepth: { value: null }, uProjInv: { value: new THREE.Matrix4() }, uCamWorld: { value: new THREE.Matrix4() },
    uVP0: { value: new THREE.Matrix4() }, uVP1: { value: new THREE.Matrix4() }, uRes: { value: new THREE.Vector2(1, 1) }, uMax: { value: 90 }, uOn: { value: 1 },
    uNear: { value: 0.005 }, uFar: { value: 12 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `#include <packing>
    uniform sampler2D tDiffuse, tDepth; uniform mat4 uProjInv, uCamWorld, uVP0, uVP1; uniform vec2 uRes; uniform float uMax, uOn, uNear, uFar; varying vec2 vUv;
    float depthAt(vec2 uv) { float d = unpackRGBAToDepth(texture2D(tDepth, uv)); return d < 0.5 ? 0.9999 : d; }  // the empty background is cleared with its colour, not a depth: far away
    float lin(float d) { return uNear * uFar / (uFar - d * (uFar - uNear)); }
    void main(){
      float d = depthAt(vUv), z0 = lin(d);
      vec4 v = uProjInv * vec4(vUv * 2.0 - 1.0, d * 2.0 - 1.0, 1.0); v /= v.w;
      vec4 w = uCamWorld * v;
      vec4 a = uVP0 * w, b = uVP1 * w; a /= a.w; b /= b.w;
      vec2 dv = (b.xy - a.xy) * 0.5 * uOn;
      float len = length(dv * uRes); if (len > uMax) dv *= uMax / len;
      // gather along the path, but never smear something much nearer onto this pixel (a bone over the far background):
      // that is what made ghost copies of a subject the camera circles
      vec3 acc = vec3(0.0); float ws = 0.0;
      for (int i = 0; i < 16; i++) {
        float f = (float(i) + 0.5) / 16.0 - 0.5; vec2 uv = vUv + dv * f;
        float w = step(z0 * 0.85, lin(depthAt(uv)));
        acc += texture2D(tDiffuse, uv).rgb * w; ws += w;
      }
      gl_FragColor = vec4(ws > 0.5 ? acc / ws : texture2D(tDiffuse, vUv).rgb, 1.0);
    }`,
};

// ------------------------------------------------------------------ anatomy: BodyParts3D, from the site's atlas (metres, feet at y = 0, +x = left, +z = front)
export const TISSUE = {
  bone:      { color: 0xe4d9c2, roughness: 0.58, clearcoat: 0.18, clearcoatRoughness: 0.5, sheen: 0.25, sheenColor: 0xfff4e0 },
  tooth:     { color: 0xf2ede2, roughness: 0.3, clearcoat: 0.6, clearcoatRoughness: 0.2 },
  cartilage: { color: 0xcfd6cf, roughness: 0.4, clearcoat: 0.5, clearcoatRoughness: 0.3, sheen: 0.3, sheenColor: 0xeaf4ff },
  muscle:    { color: 0x9c3b34, roughness: 0.48, sheen: 0.7, sheenColor: 0xff9f8f, sheenRoughness: 0.45, clearcoat: 0.25 },
  heart:     { color: 0x97302b, roughness: 0.34, clearcoat: 0.55, clearcoatRoughness: 0.22, sheen: 0.5, sheenColor: 0xff8a7a },
  artery:    { color: 0xc92f28, roughness: 0.3, clearcoat: 0.6, clearcoatRoughness: 0.18 },
  vein:      { color: 0x35489a, roughness: 0.32, clearcoat: 0.55, clearcoatRoughness: 0.2 },
  nerve:     { color: 0xe8bd48, roughness: 0.4, clearcoat: 0.35, clearcoatRoughness: 0.3 },
  brain:     { color: 0xdfb7ad, roughness: 0.52, sheen: 0.8, sheenColor: 0xffd9d0, sheenRoughness: 0.55, clearcoat: 0.2 },
  airway:    { color: 0xe6bfb3, roughness: 0.42, clearcoat: 0.35, sheen: 0.4, sheenColor: 0xffe2d9 },
  gut:       { color: 0xd4906f, roughness: 0.4, clearcoat: 0.45, clearcoatRoughness: 0.22, sheen: 0.5, sheenColor: 0xffc9b1 },
  colon:     { color: 0xc98a6c, roughness: 0.42, clearcoat: 0.4, sheen: 0.4, sheenColor: 0xffc2aa },
  stomach:   { color: 0xd39283, roughness: 0.42, clearcoat: 0.45, sheen: 0.5, sheenColor: 0xffc8b8 },
  liver:     { color: 0x7b2a22, roughness: 0.36, clearcoat: 0.42, clearcoatRoughness: 0.26, sheen: 0.35, sheenColor: 0xff9a80 },
  kidney:    { color: 0x8a352c, roughness: 0.34, clearcoat: 0.55 },
  gland:     { color: 0xd49a44, roughness: 0.45, clearcoat: 0.3 },
};
export function tissueMat(key, extra = {}) {
  const t = TISSUE[key] || TISSUE.bone;
  return new THREE.MeshPhysicalMaterial({
    color: t.color, roughness: t.roughness, metalness: 0, clearcoat: t.clearcoat ?? 0, clearcoatRoughness: t.clearcoatRoughness ?? 0.3,
    sheen: t.sheen ?? 0, sheenColor: new THREE.Color(t.sheenColor ?? 0xffffff), sheenRoughness: t.sheenRoughness ?? 0.5,
    emissive: new THREE.Color(0xffe2c4), emissiveIntensity: 0, ...extra,
  });
}
// ------------------------------------------------------------------ the factory stamp: a discreet mark inked into one part
// Every film carries one, on a 3D part that stays on screen, so the mark cannot be cropped off a reposted copy. It is
// projected in the part's own space inside its shader: no extra geometry, nothing to z-fight, and it rides with the part
// through every move. (Museums write catalogue numbers on bones in ink; this is ours.)
export function stampCanvas(lines = ['HUMAN FACTORY', 'SETTINGS'], small = '', { w = 1024, h = 512, frame = true } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d');
  x.clearRect(0, 0, w, h); x.fillStyle = '#000'; x.strokeStyle = '#000'; x.textAlign = 'center'; x.textBaseline = 'middle';
  const pad = h * 0.07, inner = w - 4 * pad;
  if (frame) { x.lineWidth = h * 0.022; x.beginPath(); x.roundRect(pad, pad, w - 2 * pad, h - 2 * pad, h * 0.08); x.stroke(); }
  const n = lines.length + (small ? 0.75 : 0), lh = (h - 4 * pad) / n;
  const fontOf = (face, s) => (face === 'mono' ? `500 ${s}px "Geist Mono"` : `${face} ${s}px Archivo`);
  const fit = (txt, size, face, track) => {   // the largest size up to `size` at which the line fits inside the frame
    x.font = fontOf(face, size); x.letterSpacing = `${size * track}px`;
    const s = size * Math.min(1, inner / x.measureText(txt).width);
    x.font = fontOf(face, s); x.letterSpacing = `${s * track}px`;
  };
  lines.forEach((s, i) => { fit(s, lh * 0.8, '700', 0.06); x.fillText(s, w / 2, 2 * pad + lh * (i + 0.52)); });
  if (small) { fit(small, lh * 0.46, 'mono', 0.14); x.fillText(small, w / 2, 2 * pad + lh * (lines.length + 0.36)); }
  return c;
}
// one line of text that fills the canvas's width (for a long label): the canvas is as tall as the text needs
export function labelCanvas(text, { w = 2048, track = 0.08, weight = 700, fill = 0.94 } = {}) {
  const c = document.createElement('canvas'), x = c.getContext('2d');
  x.font = `${weight} 100px Archivo`; x.letterSpacing = `${100 * track}px`;
  const s = (100 * fill * w) / x.measureText(text).width;
  c.width = w; c.height = Math.round(s * 1.3);
  x.font = `${weight} ${s}px Archivo`; x.letterSpacing = `${s * track}px`; x.fillStyle = '#000'; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText(text, w / 2 + (s * track) / 2, c.height / 2 + s * 0.04);
  return c;
}
// center, normal and up in the mesh's own geometry space (metres). Returns the uniforms, so a film can fade the mark.
export function stamp(mesh, { canvas, center, normal, up = [0, 1, 0], width = 0.08, height, depth = 0.03, ink = 0x2e2a24, opacity = 0.5, rough = 0.85 }) {
  const n = new THREE.Vector3(...normal).normalize(), u0 = new THREE.Vector3(...up);
  const u = u0.sub(n.clone().multiplyScalar(u0.dot(n))).normalize(), r = new THREE.Vector3().crossVectors(u, n).normalize();
  const hh = height ?? (width * canvas.height) / canvas.width;
  const box = new THREE.Matrix4().makeBasis(r.multiplyScalar(width), u.multiplyScalar(hh), n.clone().multiplyScalar(depth)).setPosition(new THREE.Vector3(...center));
  const tex = new THREE.CanvasTexture(canvas); tex.anisotropy = 8;
  const U = { uStampM: { value: box.clone().invert() }, uStampTex: { value: tex }, uStampInk: { value: new THREE.Color(ink) }, uStampO: { value: opacity }, uStampDir: { value: n }, uStampRough: { value: rough } };
  const m = mesh.material; m.userData.stamp = U;
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = 'varying vec3 vStampP;\nvarying vec3 vStampN;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvStampP = position; vStampN = objectNormal;');
    sh.fragmentShader = 'uniform mat4 uStampM; uniform sampler2D uStampTex; uniform vec3 uStampInk; uniform float uStampO; uniform vec3 uStampDir; uniform float uStampRough;\nvarying vec3 vStampP;\nvarying vec3 vStampN;\n' +
      sh.fragmentShader
        .replace('#include <color_fragment>', '#include <color_fragment>\nfloat stampA = 0.0;\n{ vec4 q = uStampM * vec4(vStampP, 1.0); if (abs(q.x) < 0.5 && abs(q.y) < 0.5 && abs(q.z) < 0.5) stampA = texture2D(uStampTex, q.xy + 0.5).a * uStampO * smoothstep(0.1, 0.35, dot(normalize(vStampN), uStampDir)); }\ndiffuseColor.rgb = mix(diffuseColor.rgb, uStampInk, stampA);')
        .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = mix(roughnessFactor, uStampRough, stampA);');
  };
  m.customProgramCacheKey = () => 'hfs-stamp';
  m.needsUpdate = true;
  return U;
}
// where to put the stamp: shoot a ray at the part (geometry space) and take the surface it hits, its normal averaged
// over a small cross of rays so one coarse triangle does not tilt the mark
export function stampSpot(mesh, { from, dir, spread = 0.012 }) {
  const tmp = new THREE.Mesh(mesh.geometry, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide })); tmp.updateMatrixWorld(true);
  const rc = new THREE.Raycaster(), d = new THREE.Vector3(...dir).normalize(), a = Math.abs(d.y) > 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
  const u = new THREE.Vector3().crossVectors(d, a).normalize(), v = new THREE.Vector3().crossVectors(d, u), hits = [];
  for (const [i, j] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) {
    rc.set(new THREE.Vector3(...from).addScaledVector(u, i * spread).addScaledVector(v, j * spread), d);
    const h = rc.intersectObject(tmp, false)[0]; if (h) hits.push(h);
  }
  if (!hits.length) return null;
  const n = new THREE.Vector3(); for (const h of hits) { const f = h.face.normal.clone(); n.add(f.dot(d) > 0 ? f.negate() : f); }
  return { center: hits[0].point.toArray(), normal: n.normalize().toArray(), hits: hits.length };
}
// a label that runs along a long bone, like a part number printed on a tube: two rays at its two ends give the line of
// the surface; the text runs along that line with its top toward `top`
export function stampLine(mesh, { a, b, dir, top }) {
  const A = stampSpot(mesh, { from: a, dir, spread: 0.004 }), B = stampSpot(mesh, { from: b, dir, spread: 0.004 });
  if (!A || !B) return null;
  const pa = new THREE.Vector3(...A.center), pb = new THREE.Vector3(...B.center), r = pb.clone().sub(pa), len = r.length(); r.normalize();
  const n = new THREE.Vector3(...A.normal).add(new THREE.Vector3(...B.normal)); n.sub(r.clone().multiplyScalar(n.dot(r))).normalize();
  let u = new THREE.Vector3().crossVectors(n, r).normalize(); if (top && u.dot(new THREE.Vector3(...top)) < 0) { u.negate(); r.negate(); }
  return { center: pa.add(pb).multiplyScalar(0.5).toArray(), normal: n.toArray(), up: u.toArray(), length: len };
}

export const BODY_SCALE = 1.83 / 1.73; // BodyParts3D is 1.73 m; we show an adult 1.83 m tall
let ATLAS = null; const CHUNKS = new Map();
export async function loadAtlas(base = 'models') { if (!ATLAS) ATLAS = await (await fetch(base + '/atlas.json')).json(); return ATLAS; }
function chunkBuf(base, atlas, ci) {
  if (!CHUNKS.has(ci)) CHUNKS.set(ci, fetch(base + '/' + atlas.chunks[ci].url.split('/').pop()).then((r) => r.arrayBuffer()));
  return CHUNKS.get(ci);
}
// select(part) -> a tissue key, or null to skip. Meshes come back in world metres, each centred on its own middle
// (userData.home = that centre), so parts can be moved, turned and faded one by one.
export async function loadAnatomy(select, { base = 'models', scale = BODY_SCALE, shareMats = false } = {}) {
  const atlas = await loadAtlas(base);
  const chosen = []; atlas.parts.forEach((p) => { const k = select(p); if (k) chosen.push({ p, k }); });
  await Promise.all([...new Set(chosen.map((c) => c.p.chunk))].map((ci) => chunkBuf(base, atlas, ci)));
  const shared = new Map(); const out = [];
  for (const { p, k } of chosen) {
    const buf = await chunkBuf(base, atlas, p.chunk);
    const b = p.bounds; const c = new THREE.Vector3((b[0][0] + b[1][0]) / 2, (b[0][1] + b[1][1]) / 2, (b[0][2] + b[1][2]) / 2);
    const src = new Float32Array(buf, p.positions, p.vertexCount * 3); const pos = new Float32Array(src.length);
    for (let i = 0; i < src.length; i += 3) { pos[i] = (src[i] - c.x) * scale; pos[i + 1] = (src[i + 1] - c.y) * scale; pos[i + 2] = (src[i + 2] - c.z) * scale; }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('normal', new THREE.BufferAttribute(new Int16Array(buf, p.normals, p.vertexCount * 3), 3, true));
    g.setIndex(new THREE.BufferAttribute(new Uint32Array(buf, p.indices, p.indexCount), 1)); g.computeBoundingSphere();
    let m; if (shareMats) { if (!shared.has(k)) shared.set(k, tissueMat(k)); m = shared.get(k); } else m = tissueMat(k);
    const mesh = new THREE.Mesh(g, m); mesh.position.copy(c).multiplyScalar(scale);
    mesh.userData = { part: p, name: p.name, tissue: k, home: mesh.position.clone(), size: new THREE.Vector3(b[1][0] - b[0][0], b[1][1] - b[0][1], b[1][2] - b[0][2]).multiplyScalar(scale) };
    out.push(mesh);
  }
  return out;
}

// ------------------------------------------------------------------ the stage: renderer, the dark room, the table, post and the film look
export async function createStage(cfg, o = {}) {
  const Wd = cfg.width, Hd = cfg.height;
  await Promise.all(['620 100px Archivo', 'italic 400 100px "Instrument Serif"', '500 30px "Geist Mono"'].map((f) => document.fonts.load(f)));
  const r = new THREE.WebGLRenderer({ canvas: document.getElementById('c'), antialias: false, alpha: false, preserveDrawingBuffer: true });
  r.setPixelRatio(1); r.setSize(Wd, Hd, false);
  r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = o.exposure ?? 1.0; r.outputColorSpace = THREE.SRGBColorSpace;
  r.shadowMap.enabled = !cfg.noShadow; r.shadowMap.type = THREE.PCFSoftShadowMap; r.shadowMap.autoUpdate = false;
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(r); scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = o.env ?? 0.12;
  SOFT = softSprite();
  const S = { cfg, r, scene, size: new THREE.Vector2(Wd, Hd), res: Hd / 1920, reflAmt: o.reflAmt ?? 0.9 };
  S.bg = new THREE.Color(o.bg ?? 0x08090b); scene.background = S.bg;
  S.fog = new THREE.Fog(S.bg, o.fogNear ?? 0.95, o.fogFar ?? 3.2); scene.fog = S.fog;
  const tb = o.table === false ? null : (o.table || {});
  if (tb) {
    // one long dark walnut surface that everything stands on, with a soft reflection of what stands on it (layer 1)
    const wood = woodTex(1024); wood.colorSpace = THREE.SRGBColorSpace; wood.wrapS = wood.wrapT = THREE.RepeatWrapping; wood.repeat.set(26, 26); wood.anisotropy = 8;
    S.tableMat = phys({ color: 0xffffff, map: wood, roughness: 0.55, roughnessMap: noiseTex(3, 512, 0.75, 1.0, 60), clearcoat: 0.4, clearcoatRoughness: 0.2 });
    S.table = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), S.tableMat); S.table.rotation.x = -Math.PI / 2; S.table.receiveShadow = true; scene.add(S.table);
    if (tb.y) S.table.position.y = tb.y;
    if (!cfg.noRefl) {
      S.refl = new Reflector(new THREE.PlaneGeometry(o.reflSize ?? 3, o.reflSize ?? 3), { textureWidth: Math.round(Wd / 2), textureHeight: Math.round(Hd / 2), shader: REFL_SHADER, multisample: 0, clipBias: 0.0003 });
      S.refl.rotation.x = -Math.PI / 2; S.refl.position.y = (tb.y ?? 0) + 0.0004; S.refl.camera.layers.set(1);
      Object.assign(S.refl.material, { transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
      S.refl.renderOrder = 2; scene.add(S.refl);
      if (o.reflAt) { S.refl.position.x = o.reflAt[0]; S.refl.position.z = o.reflAt[1]; }
    }
  }
  S.cam = new THREE.PerspectiveCamera(30, Wd / Hd, o.near ?? 0.005, o.far ?? 12);
  S.camM0 = S.cam.clone(); S.camM1 = S.cam.clone();
  const composer = new EffectComposer(r); composer.setPixelRatio(1); composer.setSize(Wd, Hd);
  composer.addPass(new RenderPass(scene, S.cam));
  S.bokeh = new BokehPass(scene, S.cam, { focus: 0.6, aperture: 0.004, maxblur: 0.01 }); composer.addPass(S.bokeh);
  S.motion = new ShaderPass(MotionShader); S.motion.uniforms.tDepth.value = S.bokeh.renderTargetDepth.texture; S.motion.uniforms.uRes.value.set(Wd, Hd);
  S.motion.uniforms.uMax.value = 90 * S.res; composer.addPass(S.motion);
  S.bloom = new UnrealBloomPass(new THREE.Vector2(Wd, Hd), 0.45, 0.6, 1.0); composer.addPass(S.bloom);
  composer.addPass(new OutputPass());
  const smaa = new SMAAPass(Wd, Hd); composer.addPass(smaa);
  if (cfg.noBokeh) S.bokeh.enabled = false; if (cfg.noBloom) S.bloom.enabled = false; if (cfg.noSmaa) smaa.enabled = false;
  S.composer = composer;
  // 2D output: average of sub-frames, then the film look (scrim under the words, vignette, grain)
  S.out = document.getElementById('out'); S.out.width = Wd; S.out.height = Hd; S.ctx = S.out.getContext('2d');
  S.grain = [];
  for (let k = 0; k < 6; k++) {
    const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d'); const im = x.createImageData(256, 256); let sd = 7 + k * 101;
    for (let i = 0; i < 256 * 256; i++) { sd = (sd * 16807) % 2147483647; const vv = 128 + ((sd / 2147483647) - 0.5) * 120; im.data[i * 4] = im.data[i * 4 + 1] = im.data[i * 4 + 2] = vv; im.data[i * 4 + 3] = 255; }
    x.putImageData(im, 0, 0); S.grain.push(S.ctx.createPattern(c, 'repeat'));
  }
  const vg = S.ctx.createRadialGradient(Wd / 2, Hd * 0.46, Hd * 0.18, Wd / 2, Hd * 0.46, Hd * 0.72);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(0.55, 'rgba(0,0,0,0.12)'); vg.addColorStop(1, 'rgba(0,0,0,0.62)'); S.vig = vg;
  const sg = S.ctx.createLinearGradient(0, 0, 0, Hd * 0.5); sg.addColorStop(0, 'rgba(0,0,0,0.5)'); sg.addColorStop(0.45, 'rgba(0,0,0,0.3)'); sg.addColorStop(1, 'rgba(0,0,0,0)'); S.scrim = sg;
  // the shade: a deeper scrim for the moments a camera move must carry the skeleton up behind the words (F.shade windows)
  const sh = S.ctx.createLinearGradient(0, 0, 0, Hd * 0.48); sh.addColorStop(0, 'rgba(0,0,0,0.92)'); sh.addColorStop(0.76, 'rgba(0,0,0,0.88)'); sh.addColorStop(1, 'rgba(0,0,0,0)'); S.shade = sh;
  return S;
}

// the camera for a pose {p, l, fov}: a steady, breathing hand, very small and very slow
export function aimCam(cam, k, t, shake = 1) {
  cam.position.fromArray(k.p); cam.lookAt(new THREE.Vector3().fromArray(k.l));
  const a = 0.0011 * shake;
  cam.rotateX(vnoise(t * 0.31 + 3.1) * a); cam.rotateY(vnoise(t * 0.27 + 7.7) * a * 1.2); cam.rotateZ(vnoise(t * 0.19 + 1.9) * a * 0.6);
  cam.fov = k.fov ?? 30; cam.updateProjectionMatrix(); cam.updateMatrixWorld(true);
}
export const V3 = (...a) => a;
export const vadd = (a, b) => a.map((v, i) => v + b[i]);

// ------------------------------------------------------------------ the words on screen, the labels, the logo
export const LOGO = '<svg viewBox="0 0 48 48" width="100%" height="100%"><circle cx="24" cy="24" r="20.5" fill="none" stroke="#ECEEF1" stroke-width="1.4"/>' +
  [30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((d) => { const a = (d * Math.PI) / 180; const x1 = 24 + Math.sin(a) * 15.2, y1 = 24 - Math.cos(a) * 15.2, x2 = 24 + Math.sin(a) * 17.6, y2 = 24 - Math.cos(a) * 17.6; return `<line x1="${x1.toFixed(2)}" y1="${y1.toFixed(2)}" x2="${x2.toFixed(2)}" y2="${y2.toFixed(2)}" stroke="#ECEEF1" stroke-width="1" stroke-linecap="round" opacity=".55"/>`; }).join('') +
  '<line x1="24" y1="24" x2="24" y2="14.2" stroke="#FF6A2B" stroke-width="2.2" stroke-linecap="round"/><circle cx="24" cy="9.6" r="3.1" fill="#FF6A2B"/><circle cx="24" cy="24" r="2" fill="#ECEEF1"/></svg>';
export function buildOverlay(S, { caps = [], subs = [], guide = false } = {}) {
  const ov = document.getElementById('ov'); ov.innerHTML = '';
  const wrap = document.createElement('div'); wrap.id = 'ovw';
  wrap.style.cssText = `position:absolute;left:0;top:0;width:1080px;height:1920px;transform-origin:0 0;transform:scale(${innerWidth / 1080})`; ov.appendChild(wrap);
  const O = { wrap, subs };
  O.caps = caps.map((c) => {
    const el = document.createElement('div'); el.className = c.mono ? 'num' : 'cap'; el.style.top = c.top + 'px'; el.style.fontSize = c.size + 'px';
    const tmp = document.createElement('div'); tmp.innerHTML = c.html; const words = [];
    const walk = (node, into) => {
      for (const ch of [...node.childNodes]) {
        if (ch.nodeType === 3) ch.textContent.split(/(\s+)/).forEach((w) => { if (!w) return; if (/^\s+$/.test(w)) { into.appendChild(document.createTextNode(' ')); return; } const s = document.createElement('span'); s.className = 'w'; s.textContent = w; into.appendChild(s); words.push(s); });
        else if (ch.nodeName === 'BR') into.appendChild(document.createElement('br'));
        else { const e = document.createElement(ch.nodeName); walk(ch, e); into.appendChild(e); }
      }
    };
    walk(tmp, el); wrap.appendChild(el); return { ...c, el, words };
  });
  O.tag = (cls, html) => { const e = document.createElement('div'); e.className = cls; e.innerHTML = html; e.style.opacity = 0; wrap.appendChild(e); return e; };
  O.logo = O.tag('', LOGO); O.logo.style.position = 'absolute';
  O.brand = O.tag('', '<div style="font-family:Archivo;font-weight:640;font-size:58px;letter-spacing:-0.02em;color:#eceef1;font-stretch:106%;text-align:center">Human Factory Settings</div><div class="mark" style="position:static;font-size:26px;text-align:center;margin-top:22px">@humanfactorysettings</div>');
  O.brand.style.cssText += ';position:absolute;left:0;right:0';
  if (guide) {
    O.label = O.tag('', 'VOICE GUIDE · AI VOICE · NOT FOR POSTING');
    O.label.style.cssText = 'position:absolute;left:0;right:0;margin:0 auto;top:44px;width:fit-content;padding:9px 20px;border-radius:30px;border:1px solid rgba(236,238,241,.25);background:rgba(8,9,11,.6);font-family:Geist Mono,monospace;font-size:21px;letter-spacing:.14em;color:#c9ccd2;opacity:1';
    O.sub = O.tag('', ''); O.sub.style.cssText = 'position:absolute;left:54px;right:54px;bottom:96px;text-align:center;font-family:Archivo,sans-serif;font-weight:520;font-size:36px;line-height:1.3;color:#eceef1;opacity:1';
  }
  S.O = O; return O;
}
export function wordsIn(c, t) {
  c.words.forEach((w, i) => {
    const a = clamp01((t - c.t0 - i * 0.075) / 0.6), e = s5(0, 1, a);
    const o = clamp01((t - (c.t1 - 0.5)) / 0.5), x = s5(0, 1, o);
    w.style.opacity = (e * (1 - x)).toFixed(3);
    w.style.filter = `blur(${((1 - e) * 12 + x * 10).toFixed(2)}px)`;
    w.style.transform = `translateY(${((1 - e) * 26 - x * 12).toFixed(1)}px)`;
  });
  c.el.style.visibility = t > c.t0 - 0.1 && t < c.t1 + 0.1 ? 'visible' : 'hidden';
}
export function proj(S, v) { const p = v.clone().project(S.cam); return [((p.x + 1) / 2) * 1080, ((1 - p.y) / 2) * 1920, p.z]; }
export function place(S, el, v, dx, dy, o) {
  const [x, y] = proj(S, v); const w = el.offsetWidth || 200;
  o *= ss(-20, 60, x) * (1 - ss(1020, 1100, x)) * ss(-20, 80, y) * (1 - ss(1850, 1940, y));
  const left = Math.min(1080 - 48 - w, Math.max(48, x + dx));
  el.style.left = left.toFixed(1) + 'px'; el.style.top = (y + dy).toFixed(1) + 'px'; el.style.opacity = o.toFixed(3); el.style.filter = `blur(${((1 - o) * 8).toFixed(2)}px)`;
}
// the end: the logo lands exactly on the 3D dial (centre and an edge point of its face, in world space), the name fades in under it
export function logoEnd(S, t, { t0, center, edge }) {
  const O = S.O; const [cx, cy] = proj(S, center); const [ex, ey] = proj(S, edge); const rad = Math.hypot(cx - ex, cy - ey);
  const lo = ss(t0, t0 + 0.5, t), size = (rad / 20.5) * 48;
  O.logo.style.left = (cx - size / 2).toFixed(1) + 'px'; O.logo.style.top = (cy - size / 2).toFixed(1) + 'px';
  O.logo.style.width = O.logo.style.height = size.toFixed(1) + 'px'; O.logo.style.opacity = lo.toFixed(3);
  O.brand.style.top = (cy + size / 2 + 70).toFixed(1) + 'px';
  const bo = ss(t0 + 0.35, t0 + 1.0, t); O.brand.style.opacity = bo.toFixed(3); O.brand.style.filter = `blur(${((1 - bo) * 10).toFixed(2)}px)`;
}

// a smooth, monotone time map through anchor pairs [[tNew, tOld], ...] (Fritsch-Carlson cubic), so a finished film
// can follow a new voice: every frame at new time t shows the film at tOld = map(t). Mirrors retime.py exactly.
export function timeMap(R) {
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

// ------------------------------------------------------------------ a film: one continuous shot, from a definition
// F = { T, caps, subs, stage, build(S, cfg), update(S, t), pose(S, t) -> {p, l, fov}, focus?(S, t, pose), aperture?, bloom?, preRender?(S, t), overlay?(S, t) }
// how deep the shade is at time t: F.shade = [[t0, t1], ...], each fading in over its first 0.2 s and out over its last 0.2 s
export function shadeAt(F, t) { let k = 0; for (const [a, b] of F.shade || []) k = Math.max(k, ss(a, a + 0.2, t) * (1 - ss(b - 0.2, b, t))); return k; }
export function makeFilm(F) {
  let S;
  const dist = (P) => Math.hypot(P.p[0] - P.l[0], P.p[1] - P.l[1], P.p[2] - P.l[2]);
  async function init(cfg) {
    S = await createStage(cfg, F.stage || {});
    S.tmap = cfg.retime ? timeMap(cfg.retime) : (x) => x;
    const info = await F.build(S, cfg);
    buildOverlay(S, { caps: F.caps || [], subs: F.subs || [], guide: cfg.guide });
    if (F.overlayInit) F.overlayInit(S);
    return { T: F.T, fast: F.fast || [], ...(info || {}) };
  }
  function render(t, opts = {}) {
    const sub = opts.sub ?? 1, shutter = opts.shutter ?? 0.5, fps = opts.fps ?? 24, r = S.r, ctx = S.ctx;
    const M = S.tmap;
    for (let k = 0; k < sub; k++) {
      const tn = sub > 1 ? t + ((k + 0.5) / sub - 0.5) * (shutter / fps) : t, tk = M(tn);
      TIME.value = tk;
      F.update(S, tk);
      const P = F.pose(S, tk); aimCam(S.cam, P, tk, F.shake ?? 1);
      const u = S.bokeh.uniforms;
      u.focus.value = F.focus ? F.focus(S, tk, P) : dist(P);
      u.aperture.value = F.aperture ? keys(F.aperture, tk) : 0.004; u.maxblur.value = 0.012 * S.res;
      S.bloom.strength = F.bloom ? keys(F.bloom, tk) : 0.45;
      r.shadowMap.needsUpdate = true;
      { const half = (shutter / fps) / sub / 2, m = S.motion.uniforms, ta = M(tn - half), tb = M(tn + half);
        let Pa = F.pose(S, ta), Pb = F.pose(S, tb);
        if (F.carrier) {   // the camera rides with something that moves (a walker): blur relative to it, so the rider stays sharp
          const c0 = F.carrier(S, tk), sh = (P, c) => { const d = c0.map((v, i) => v - c[i]); return { ...P, p: vadd(P.p, d), l: vadd(P.l, d) }; };
          Pa = sh(Pa, F.carrier(S, ta)); Pb = sh(Pb, F.carrier(S, tb));
        }
        aimCam(S.camM0, Pa, ta, F.shake ?? 1); aimCam(S.camM1, Pb, tb, F.shake ?? 1);
        m.uVP0.value.multiplyMatrices(S.camM0.projectionMatrix, S.camM0.matrixWorldInverse);
        m.uVP1.value.multiplyMatrices(S.camM1.projectionMatrix, S.camM1.matrixWorldInverse);
        m.uProjInv.value.copy(S.cam.projectionMatrixInverse); m.uCamWorld.value.copy(S.cam.matrixWorld); m.uNear.value = S.cam.near; m.uFar.value = S.cam.far; m.uOn.value = (opts.noMotion || S.cfg.noMotion) ? 0 : 1; }
      if (S.refl) { S.refl.material.uniforms.uBg.value.copy(S.bg); S.refl.material.uniforms.uAmt.value = S.reflAmt; }
      if (F.preRender) F.preRender(S, tk);
      S.composer.render();
      if (k === 0) { ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; ctx.fillStyle = '#000'; ctx.fillRect(0, 0, S.size.x, S.size.y); }
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1 / (k + 1); ctx.drawImage(r.domElement, 0, 0);
    }
    ctx.globalAlpha = 1;
    const tf = M(t);
    const words = Math.max(0, ...(F.caps || []).filter((c) => !c.noScrim).map((c) => ss(c.t0 - 0.3, c.t0 + 0.2, tf) * (1 - ss(c.t1 - 0.3, c.t1 + 0.3, tf))));
    if (words > 0.001) { ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = words; ctx.fillStyle = S.scrim; ctx.fillRect(0, 0, S.size.x, S.size.y * 0.5); ctx.globalAlpha = 1; }
    const shd = shadeAt(F, tf) * words;
    if (shd > 0.001) { ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = shd; ctx.fillStyle = S.shade; ctx.fillRect(0, 0, S.size.x, S.size.y * 0.48); ctx.globalAlpha = 1; }
    ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = S.vig; ctx.fillRect(0, 0, S.size.x, S.size.y);
    ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = 0.16;
    const f = Math.round(t * 24), pat = S.grain[f % S.grain.length];
    ctx.save(); ctx.translate(-Math.floor(hash(f) * 256), -Math.floor(hash(f + 0.5) * 256)); ctx.fillStyle = pat; ctx.fillRect(0, 0, S.size.x + 256, S.size.y + 256); ctx.restore();
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    for (const c of S.O.caps) wordsIn(c, tf);
    if (F.overlay) F.overlay(S, tf);
    if (S.O.sub) { const s = S.O.subs.find(([a, b]) => tf >= a - 0.05 && tf <= b + 0.35); S.O.sub.textContent = s ? s[2] : ''; }
    return true;
  }
  function motion(t, fps = 24, shutter = 0.5) {
    const dt = shutter / fps, a = F.pose(S, S.tmap(t - dt / 2)), b = F.pose(S, S.tmap(t + dt / 2));
    const pa = new THREE.Vector3().fromArray(a.p), pb = new THREE.Vector3().fromArray(b.p);
    const fa = new THREE.Vector3().fromArray(a.l).sub(pa), fb = new THREE.Vector3().fromArray(b.l).sub(pb);
    const d = Math.max(0.02, (fa.length() + fb.length()) / 2);
    const ang = fa.normalize().angleTo(fb.normalize()) + pa.distanceTo(pb) / d + Math.abs((a.fov ?? 30) - (b.fov ?? 30)) * Math.PI / 180 * 0.5;
    return (ang / ((a.fov ?? 30) * Math.PI / 180)) * 1920;
  }
  const api = { init, render, motion, info: () => ({ T: F.T }), T: F.T, debug: () => S, film: F };
  window.HFS = window.HFS || {}; window.HFS.film = api;
  return api;
}

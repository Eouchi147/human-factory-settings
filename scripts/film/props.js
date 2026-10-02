// Human Factory Settings · props shared by the films: the clock (it ends every film as the logo), cup, phone, lamp, dials.
import { THREE, RoundedBoxGeometry, ORANGE, AMBER, phys, glowMat, shadows, outBack, lerp } from './kit.js';
// ------------------------------------------------------------------ the clock (the film's spine: it opens the film, keeps the time, and becomes the logo)
export function makeClock() {
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
export function tickAngle(sec) { const i = Math.floor(sec), f = sec - i; return (i - 1 + outBack(f / 0.13, 2.2)) / 60 * Math.PI * 2; }
export function setClock(C, daySec, { tick = true, hourOverride, minOverride, secOverride } = {}) {
  const s = ((daySec % 86400) + 86400) % 86400;
  const hrs = s / 3600, mins = (s % 3600) / 60, secs = s % 60;
  const ha = hourOverride ?? ((hrs % 12) / 12) * Math.PI * 2, ma = minOverride ?? (mins / 60) * Math.PI * 2;
  const sa = secOverride ?? (tick ? tickAngle(secs) : (secs / 60) * Math.PI * 2);
  C.hands.h.rotation.z = -ha; C.hands.m.rotation.z = -ma; C.hands.s.rotation.z = -sa;
}

export function makeCup() {
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


export function makeDial() {
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

export function makePhone(glassOpts = {}) {
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

export function makeLamp() {
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


// a dial drawn like the logo: rim, ticks, the hand and its dot at twelve, a centre dot. Flat in the XY plane, twelve at +y, facing +z.
// weight 0 = a fine hour ring (twelve ticks), 1 = the logo's own line weights, so it lands exactly under the 2D logo (logoEnd).
// hours: an orange arc inside the rim, starting at `from` o'clock and running clockwise.
export function makeLogoRing(R) {
  const g = new THREE.Group(), u = R / 20.5;
  const WHITE = new THREE.Color(0xeceef1).multiplyScalar(1.35), OR = ORANGE.clone(); // bright enough to read as the logo's white after tone mapping
  const mk = (c) => new THREE.MeshBasicMaterial({ color: c.clone(), transparent: true, opacity: 0, depthWrite: false, fog: false, side: THREE.DoubleSide });
  const white = mk(WHITE), tick = mk(WHITE), top = mk(WHITE), arcMat = mk(OR), handMat = mk(OR), cen = mk(WHITE);
  const rim = new THREE.Mesh(new THREE.BufferGeometry(), white); g.add(rim);
  const ticks = []; for (let k = 0; k < 12; k++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), k === 0 ? top : tick); g.add(m); ticks.push(m); }
  const arc = new THREE.Mesh(new THREE.BufferGeometry(), arcMat); arc.position.z = 0.0005; g.add(arc);
  const hand = new THREE.Group(); hand.position.z = 0.0006; g.add(hand);
  const bar = new THREE.Mesh(new THREE.PlaneGeometry(2.2 * u, 9.8 * u), handMat); bar.position.y = 4.9 * u; hand.add(bar);
  const capTop = new THREE.Mesh(new THREE.CircleGeometry(1.1 * u, 48), handMat); capTop.position.y = 9.8 * u; hand.add(capTop);
  const dot = new THREE.Mesh(new THREE.CircleGeometry(3.1 * u, 64), handMat); dot.position.set(0, 14.4 * u, 0.0006); g.add(dot);
  const center = new THREE.Mesh(new THREE.CircleGeometry(2 * u, 48), cen); center.position.z = 0.0009; g.add(center);
  let key = '';
  function set({ weight = 0, white: w = 1, hours = 0, arcOpacity = 1, hand: h = 0, handScale = 1, from = 9 }) {
    const rw = lerp(0.0065, 1.4 * u, weight), tw = lerp(0.006, 1 * u, weight);
    const k = rw.toFixed(5) + '|' + hours.toFixed(4);
    if (k !== key) {
      key = k;
      rim.geometry.dispose(); rim.geometry = new THREE.RingGeometry(R - rw / 2, R + rw / 2, 256);
      const a0 = (from / 12) * Math.PI * 2, a1 = ((from + Math.max(0.001, hours)) / 12) * Math.PI * 2;
      arc.geometry.dispose(); arc.geometry = new THREE.RingGeometry(R * 0.885, R * 0.93, 128, 1, Math.PI / 2 - a1, a1 - a0);
    }
    ticks.forEach((m, i) => {
      const a = (i / 12) * Math.PI * 2, big = i % 3 === 0, full = 3.4 * u, len = lerp(big ? full : full * 0.6, full, weight), rm = 16.4 * u + (full - len) / 2;
      m.position.set(Math.sin(a) * rm, Math.cos(a) * rm, 0.0002); m.rotation.z = -a; m.scale.set(tw, len, 1);
    });
    white.opacity = w; tick.opacity = w * lerp(0.85, 0.55, weight); top.opacity = w * lerp(0.85, 0, weight) * (1 - h);
    arcMat.opacity = hours > 0.001 ? arcOpacity : 0;
    handMat.opacity = h; hand.scale.setScalar(Math.max(0.001, handScale)); dot.scale.setScalar(Math.max(0.001, handScale));
    cen.opacity = h * w;
  }
  return { g, set };
}

/* The live 3D body on the home page.
   Real anatomy: BodyParts3D 4.0 (c) The Database Center for Life Science, CC BY 4.0, simplified for the web
   and scaled to 1.83 m.
   On load the body builds itself (bones, then organs, then blood vessels and nerves) while the camera rises
   from the feet; then it turns slowly, the heart beats and the lungs breathe. People can drag it round, tap a
   part, or pick a setting. A setting dims everything except the parts it acts on and changes how the body
   behaves: night light and a slow heart for sleep, a racing heart for exercise, signals firing down the
   nerves for stress. */
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { GROUPS_OF, type Part } from "./parts";

export type { Part } from "./parts";
/** How the body behaves while a setting is picked. Everything eases in, nothing jumps. */
export type Mood = {
  bpm?: number; // heart rate (default 64)
  breaths?: number; // breaths a minute (default 14)
  night?: number; // 0..1: cool, dim light
  warm?: number; // 0..1: warm light
  signals?: number; // signals a second running down the nerves from the brain (default 0)
};
export type Focus = { groups: string[]; mood?: Mood } | null;
const CALM: Required<Mood> = { bpm: 64, breaths: 14, night: 0, warm: 0, signals: 0 };
/** The reference body is 1.73 m in BodyParts3D; we show it as an adult 1.83 m tall. */
export const SCALE = 1.83 / 1.73;
const S = SCALE;

const PART_OF: Record<string, Part> = Object.fromEntries(
  (Object.entries(GROUPS_OF) as [Part, string[]][]).flatMap(([p, gs]) => gs.map((g) => [g, p] as const)),
) as Record<string, Part>;

type T = { color: number; roughness: number; clearcoat?: number; clearcoatRoughness?: number; sheen?: number; sheenColor?: number; sheenRoughness?: number; opacity?: number };
const TISSUE: Record<string, T> = {
  bone: { color: 0xe4d9c2, roughness: 0.58, clearcoat: 0.18, clearcoatRoughness: 0.5, sheen: 0.25, sheenColor: 0xfff4e0 },
  tooth: { color: 0xf2ede2, roughness: 0.3, clearcoat: 0.6, clearcoatRoughness: 0.2 },
  cartilage: { color: 0xcfd6cf, roughness: 0.4, clearcoat: 0.5, clearcoatRoughness: 0.3, sheen: 0.3, sheenColor: 0xeaf4ff },
  heart: { color: 0x97302b, roughness: 0.34, clearcoat: 0.55, clearcoatRoughness: 0.22, sheen: 0.5, sheenColor: 0xff8a7a },
  valve: { color: 0xe9d6c6, roughness: 0.4, clearcoat: 0.4 },
  artery: { color: 0xc92f28, roughness: 0.3, clearcoat: 0.6, clearcoatRoughness: 0.18 },
  vein: { color: 0x35489a, roughness: 0.32, clearcoat: 0.55, clearcoatRoughness: 0.2 },
  nerve: { color: 0xe8bd48, roughness: 0.4, clearcoat: 0.35, clearcoatRoughness: 0.3 },
  brain: { color: 0xdfb7ad, roughness: 0.52, sheen: 0.8, sheenColor: 0xffd9d0, sheenRoughness: 0.55, clearcoat: 0.2 },
  deepbrain: { color: 0xc98f86, roughness: 0.5, sheen: 0.6, sheenColor: 0xffc9bd },
  white: { color: 0xece2d6, roughness: 0.6, sheen: 0.4, sheenColor: 0xffffff },
  airway: { color: 0xe6bfb3, roughness: 0.42, clearcoat: 0.35, sheen: 0.4, sheenColor: 0xffe2d9 },
  gut: { color: 0xd4906f, roughness: 0.4, clearcoat: 0.45, clearcoatRoughness: 0.22, sheen: 0.5, sheenColor: 0xffc9b1 },
  colon: { color: 0xc98a6c, roughness: 0.42, clearcoat: 0.4, sheen: 0.4, sheenColor: 0xffc2aa },
  stomach: { color: 0xd39283, roughness: 0.42, clearcoat: 0.45, sheen: 0.5, sheenColor: 0xffc8b8 },
  liver: { color: 0x7b2a22, roughness: 0.36, clearcoat: 0.42, clearcoatRoughness: 0.26, sheen: 0.35, sheenColor: 0xff9a80 },
  pancreas: { color: 0xe0b684, roughness: 0.55, sheen: 0.4, sheenColor: 0xfff0d0 },
  gall: { color: 0x55773f, roughness: 0.28, clearcoat: 0.7 },
  duct: { color: 0x6c8c4f, roughness: 0.35, clearcoat: 0.5 },
  kidney: { color: 0x8a352c, roughness: 0.34, clearcoat: 0.55 },
  bladder: { color: 0xd9bb98, roughness: 0.45, clearcoat: 0.35 },
  gland: { color: 0xd49a44, roughness: 0.45, clearcoat: 0.3 },
  spleen: { color: 0x672838, roughness: 0.36, clearcoat: 0.5 },
  diaphragm: { color: 0xa0453c, roughness: 0.46, sheen: 0.6, sheenColor: 0xff9f8f, clearcoat: 0.25, opacity: 0.8 },
};

// when each group arrives (seconds after the model is ready). Calm on purpose: one layer at a time,
// bones, then organs, then the blood vessels growing out of the heart and the nerves out of the brain.
const INTRO: Record<string, [number, number, "rise" | "grow" | "shrink" | "fade"]> = {
  legs: [0.2, 1.7, "rise"],
  spine: [0.4, 1.9, "rise"],
  ribs: [0.6, 2.1, "rise"],
  arms: [0.7, 2.2, "rise"],
  skull: [0.9, 2.4, "rise"],
  teeth: [1.0, 2.4, "fade"],
  heart: [1.9, 3.0, "rise"],
  airways: [2.0, 3.5, "grow"],
  brain: [2.2, 3.4, "rise"],
  liver: [2.3, 3.4, "rise"],
  stomach: [2.4, 3.5, "rise"],
  gut: [2.5, 3.6, "rise"],
  kidneys: [2.6, 3.6, "rise"],
  diaphragm: [2.7, 3.7, "fade"],
  arteries: [3.4, 5.2, "grow"],
  veins: [3.8, 5.6, "shrink"],
  nerves: [4.3, 6.0, "grow"],
};
export const INTRO_END = 6.2;

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const outQuint = (t: number) => 1 - Math.pow(1 - t, 5);
const inOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const inOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;

/** One heartbeat as a shape over a cycle (0..1): a strong squeeze, then a smaller one. */
function beat(ph: number) {
  const x = ph - Math.floor(ph);
  return Math.exp(-Math.pow((x - 0.085) / 0.048, 2)) + 0.55 * Math.exp(-Math.pow((x - 0.32) / 0.053, 2));
}

type Reveal = { uOrigin: { value: THREE.Vector3 }; uReveal: { value: number }; uMode: { value: number }; uFront: { value: number }; uGlow: { value: THREE.Color }; uPulseR: { value: number }; uPulseW: { value: number } };

function makeRevealable(mat: THREE.MeshStandardMaterial, key: string, glow: [number, number, number]) {
  const u: Reveal = {
    uOrigin: { value: new THREE.Vector3() }, uReveal: { value: 10 }, uMode: { value: 1 }, uFront: { value: 0.035 },
    uGlow: { value: new THREE.Color(...glow) }, uPulseR: { value: -1 }, uPulseW: { value: 0.05 },
  };
  mat.userData.reveal = u;
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, u);
    sh.vertexShader = sh.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vRWorld;")
      .replace("#include <worldpos_vertex>", "#include <worldpos_vertex>\nvRWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;");
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vRWorld;\nuniform vec3 uOrigin; uniform float uReveal; uniform float uMode; uniform float uFront; uniform vec3 uGlow; uniform float uPulseR; uniform float uPulseW;")
      .replace(
        "#include <clipping_planes_fragment>",
        `#include <clipping_planes_fragment>
        float rd = distance(vRWorld, uOrigin);
        float edge = uMode > 0.0 ? (uReveal - rd) : (rd - uReveal);
        if (edge < 0.0) discard;`,
      )
      .replace(
        "#include <emissivemap_fragment>",
        `#include <emissivemap_fragment>
        float fr = 1.0 - smoothstep(0.0, uFront, edge);
        totalEmissiveRadiance += uGlow * fr * 2.2;
        if (uPulseR > 0.0) { float pz = 1.0 - smoothstep(0.0, uPulseW, abs(rd - uPulseR)); totalEmissiveRadiance += uGlow * pz * 0.9; }`,
      );
  };
  mat.customProgramCacheKey = () => "reveal-" + key;
}

type GroupRec = {
  name: string;
  pivot: THREE.Group;
  meshes: THREE.Mesh[];
  mats: THREE.MeshStandardMaterial[];
  center: THREE.Vector3;
  box: THREE.Box3;
  reveal?: { origin: THREE.Vector3; maxR: number };
  dim: number; // current dim amount 0..1
  dimTarget: number;
};

export type HeroApi = {
  setFocus: (f: Focus) => void;
  replay: () => void;
  dispose: () => void;
};

export async function createHero(
  canvas: HTMLCanvasElement,
  opts: { url: string; onReady?: () => void; onPick?: (p: Part | null) => void; onIntroDone?: () => void; reduced?: boolean; lite?: boolean },
): Promise<HeroApi> {
  const lite = !!opts.lite;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, lite ? 1.5 : 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.45;
  const KEY_DAY = new THREE.Color(0xfff0dd), KEY_NIGHT = new THREE.Color(0x8ea6ff), KEY_WARM = new THREE.Color(0xffc9a0);
  const key = new THREE.DirectionalLight(0xfff0dd, 2.6);
  key.position.set(-1.8, 3.0, 2.6);
  const rim = new THREE.DirectionalLight(0xa9c8ff, 3.2);
  rim.position.set(2.4, 2.2, -2.8);
  const rim2 = new THREE.DirectionalLight(0xffd2b0, 1.4);
  rim2.position.set(-2.6, 1.2, -2.2);
  scene.add(key, rim, rim2, new THREE.HemisphereLight(0xfff8f0, 0x1a1714, 0.5));

  const camera = new THREE.PerspectiveCamera(26, 1, 0.01, 60);

  // floor ring, as in the films
  const ring = new THREE.Group();
  const circ = (r: number, seg = 192) => {
    const pts: THREE.Vector3[] = [];
    for (let k = 0; k <= seg; k++) {
      const a = (k / seg) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r));
    }
    return new THREE.BufferGeometry().setFromPoints(pts);
  };
  const lm = (o: number) => new THREE.LineBasicMaterial({ color: 0xeceef1, transparent: true, opacity: o, depthWrite: false });
  ring.add(new THREE.Line(circ(0.62 * S), lm(0.3)), new THREE.Line(circ(0.66 * S), lm(0.12)));
  ring.position.y = 0.0005;
  scene.add(ring);

  // load the model
  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);
  const gltf = await loader.loadAsync(opts.url);
  const root = new THREE.Group();
  scene.add(root);

  const groups = new Map<string, GroupRec>();
  const meshes: THREE.Mesh[] = [];
  const REVEAL_GLOW: Record<string, [number, number, number]> = { arteries: [1.05, 0.45, 0.35], veins: [0.5, 0.65, 1.0], nerves: [1.0, 0.86, 0.45], airways: [1.0, 0.92, 0.88] };
  gltf.scene.updateMatrixWorld(true);
  gltf.scene.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh) return;
    const [g, tissue] = (m.name || o.parent?.name || "").split("__");
    const t = TISSUE[tissue] || TISSUE.bone;
    const mat = lite
      ? new THREE.MeshStandardMaterial({ color: t.color, roughness: t.roughness, metalness: 0 })
      : new THREE.MeshPhysicalMaterial({
          color: t.color, roughness: t.roughness, metalness: 0, clearcoat: t.clearcoat ?? 0, clearcoatRoughness: t.clearcoatRoughness ?? 0.3,
          sheen: t.sheen ?? 0, sheenColor: new THREE.Color(t.sheenColor ?? 0xffffff), sheenRoughness: t.sheenRoughness ?? 0.5,
        });
    mat.emissive = new THREE.Color(0xffe2c4);
    mat.emissiveIntensity = 0;
    mat.opacity = t.opacity ?? 1;
    mat.transparent = (t.opacity ?? 1) < 1;
    mat.userData.baseOpacity = t.opacity ?? 1;
    if (REVEAL_GLOW[g]) makeRevealable(mat, g + tissue + (lite ? "l" : "p"), REVEAL_GLOW[g]);
    const geo = m.geometry as THREE.BufferGeometry;
    // quantised attributes (int16 positions, int8 normals) become plain floats, then the node transform
    // that undoes the quantisation is baked in, so every mesh lives in real metres
    for (const name of ["position", "normal"]) {
      const a = geo.getAttribute(name) as THREE.BufferAttribute | undefined;
      if (!a || a.array instanceof Float32Array) continue;
      const f = new Float32Array(a.count * 3);
      for (let i = 0; i < a.count; i++) {
        f[i * 3] = a.getX(i);
        f[i * 3 + 1] = a.getY(i);
        f[i * 3 + 2] = a.getZ(i);
      }
      geo.setAttribute(name, new THREE.BufferAttribute(f, 3));
    }
    geo.applyMatrix4(m.matrixWorld);
    geo.scale(S, S, S);
    geo.computeBoundingBox();
    geo.computeBoundingSphere();
    const mesh = new THREE.Mesh(geo, mat);
    mesh.userData.group = g;
    meshes.push(mesh);
    if (!groups.has(g)) groups.set(g, { name: g, pivot: new THREE.Group(), meshes: [], mats: [], center: new THREE.Vector3(), box: new THREE.Box3(), dim: 0, dimTarget: 0 });
    const rec = groups.get(g)!;
    rec.meshes.push(mesh);
    rec.mats.push(mat);
    rec.box.union(geo.boundingBox!);
  });
  for (const rec of groups.values()) {
    rec.box.getCenter(rec.center);
    rec.pivot.position.copy(rec.center);
    for (const m of rec.meshes) {
      m.position.copy(rec.center).multiplyScalar(-1);
      rec.pivot.add(m);
    }
    root.add(rec.pivot);
  }
  // origins for the growing trees
  const heart = groups.get("heart"), brain = groups.get("brain"), air = groups.get("airways");
  const setReveal = (g: string, origin: THREE.Vector3, maxR: number, mode: number) => {
    const rec = groups.get(g);
    if (!rec) return;
    rec.reveal = { origin, maxR };
    rec.mats.forEach((m) => {
      const u = m.userData.reveal as Reveal | undefined;
      if (!u) return;
      u.uOrigin.value.copy(origin);
      u.uMode.value = mode;
    });
  };
  if (heart) {
    setReveal("arteries", heart.center.clone().add(new THREE.Vector3(0, 0.04 * S, 0)), 1.62 * S, 1);
    setReveal("veins", heart.center.clone(), 1.7 * S, -1);
  }
  if (brain) setReveal("nerves", brain.center.clone().add(new THREE.Vector3(0, -0.02 * S, 0)), 1.85 * S, 1);
  if (air) setReveal("airways", new THREE.Vector3(air.center.x, air.box.max.y, air.center.z), 0.42 * S, 1);

  // ------------------------------------------------------------------ camera
  // phones show the stage nearly square, under a header: give the head more room above it
  const narrow = canvas.clientWidth / Math.max(1, canvas.clientHeight) < 1.25;
  const FULL = narrow
    ? { theta: -16, radius: 4.95 * S, camY: 1.12 * S, targetY: 1.05 * S, targetX: 0, fov: 26 }
    : { theta: -16, radius: 4.8 * S, camY: 1.06 * S, targetY: 0.97 * S, targetX: 0, fov: 26 };
  const START = { theta: -40, radius: 1.9 * S, camY: 0.32 * S, targetY: 0.12 * S, targetX: 0, fov: 26 };
  let cam = { ...START };
  let camFrom = { ...START };
  let camTo = { ...FULL };
  let camT0 = 0, camDur = 1;
  const applyCam = () => {
    const th = (cam.theta * Math.PI) / 180;
    camera.position.set(cam.targetX + Math.sin(th) * cam.radius, cam.camY, Math.cos(th) * cam.radius);
    camera.fov = cam.fov;
    camera.updateProjectionMatrix();
    camera.lookAt(cam.targetX, cam.targetY, 0);
  };

  // ------------------------------------------------------------------ interaction
  let spin = 0; // extra rotation from dragging, radians
  let spinVel = 0;
  let lastInput = -1e9;
  let dragging = false, downX = 0, downY = 0, lastX = 0, moved = false;
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const onDown = (e: PointerEvent) => {
    dragging = true;
    moved = false;
    downX = lastX = e.clientX;
    downY = e.clientY;
    spinVel = 0;
    lastInput = performance.now();
  };
  const onMove = (e: PointerEvent) => {
    if (!dragging) return;
    const dx = e.clientX - lastX;
    lastX = e.clientX;
    if (Math.abs(e.clientX - downX) > 6 || Math.abs(e.clientY - downY) > 6) moved = true;
    const d = (dx / Math.max(1, canvas.clientWidth)) * Math.PI * 2.2;
    spin += d;
    spinVel = d;
    lastInput = performance.now();
  };
  const onUp = (e: PointerEvent) => {
    if (!dragging) return;
    dragging = false;
    lastInput = performance.now();
    if (moved) return;
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hits = ray.intersectObjects(meshes.filter((m) => m.visible && (m.material as THREE.Material).opacity > 0.5), false);
    const g = hits[0]?.object.userData.group as string | undefined;
    opts.onPick?.(g ? PART_OF[g] ?? null : null);
  };
  canvas.addEventListener("pointerdown", onDown);
  window.addEventListener("pointermove", onMove);
  window.addEventListener("pointerup", onUp);
  window.addEventListener("pointercancel", onUp);

  // ------------------------------------------------------------------ focus: dim everything but a setting's parts
  let focus: Focus = null;
  const mood = { ...CALM };
  let moodTo = { ...CALM };
  let beatPh = 0, breathPh = 0, sigPh = 0;
  const fitFocus = (f: Focus) => {
    if (!f || !f.groups.length) return { ...FULL };
    const box = new THREE.Box3();
    f.groups.forEach((g) => {
      const rec = groups.get(g);
      if (rec) box.union(rec.box);
    });
    if (box.isEmpty()) return { ...FULL };
    const c = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const aspect = canvas.clientWidth / Math.max(1, canvas.clientHeight);
    const half = Math.max(size.y / 2, size.x / 2 / aspect) * 1.5;
    const radius = Math.max(0.9 * S, Math.min(4.6 * S, half / Math.tan(((FULL.fov / 2) * Math.PI) / 180)));
    return { theta: FULL.theta, radius, camY: c.y + radius * 0.06, targetY: c.y, targetX: 0, fov: FULL.fov };
  };
  const setFocus = (f: Focus) => {
    focus = f;
    moodTo = { ...CALM, ...(f?.mood ?? {}) };
    const on = new Set(f?.groups ?? []);
    for (const rec of groups.values()) rec.dimTarget = f && on.size && !on.has(rec.name) ? 1 : 0;
    camFrom = { ...cam };
    camTo = fitFocus(f);
    camT0 = clock;
    camDur = 1.3;
  };

  // ------------------------------------------------------------------ the loop
  let clock = 0;
  let introStart = opts.reduced ? -100 : 0; // reduced motion: start fully built
  let introDone = false;
  if (opts.reduced) {
    cam = { ...FULL };
    camFrom = { ...FULL };
    camTo = { ...FULL };
  } else {
    camFrom = { ...START };
    camTo = { ...FULL };
    camT0 = 0.2;
    camDur = INTRO_END - 0.2;
  }

  const size = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  const ro = new ResizeObserver(size);
  ro.observe(canvas);
  size();

  let visible = true;
  const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { threshold: 0.01 });
  io.observe(canvas);

  let raf = 0;
  let last = performance.now();
  // slow device? after the first second and a half of frames, drop to plain resolution
  const samples: number[] = [];
  let tuned = false;
  const frame = (now: number) => {
    raf = requestAnimationFrame(frame);
    const raw = now - last;
    const dt = Math.min(0.05, raw / 1000);
    last = now;
    if (!visible || document.hidden) return;
    if (!tuned) {
      samples.push(raw);
      if (samples.length >= 90) {
        tuned = true;
        const med = samples.sort((x, y) => x - y)[45];
        if (med > 40 && renderer.getPixelRatio() > 1) {
          renderer.setPixelRatio(1);
          size();
        }
      }
    }
    clock += dt;
    const t = clock - introStart;

    // intro: every group arrives in its own way
    for (const rec of groups.values()) {
      const spec = INTRO[rec.name] ?? [0, 0.6, "fade"];
      const [t0, t1, style] = spec;
      const u = clamp01((t - t0) / (t1 - t0));
      const e = outQuint(u);
      const show = t >= t0;
      rec.pivot.visible = show;
      rec.pivot.position.copy(rec.center);
      rec.pivot.scale.set(1, 1, 1);
      if (style === "rise") rec.pivot.position.y -= 0.045 * S * (1 - e);
      const fade = style === "grow" || style === "shrink" ? 1 : clamp01(u / 0.75);
      // dimming for focus
      rec.dim += (rec.dimTarget - rec.dim) * Math.min(1, dt * 5);
      for (const m of rec.mats) {
        const base = (m.userData.baseOpacity as number) ?? 1;
        const op = base * fade * (1 - 0.88 * rec.dim);
        m.opacity = op;
        m.transparent = op < 0.999;
        m.depthWrite = op > 0.6;
        m.emissiveIntensity = focus && focus.groups.length && rec.dimTarget === 0 ? 0.06 + 0.04 * Math.sin(clock * 3) : 0;
        const r = m.userData.reveal as Reveal | undefined;
        if (r && rec.reveal) {
          if (style === "grow" || style === "shrink") {
            const ee = inOutSine(u);
            r.uReveal.value = u >= 1 ? (style === "shrink" ? -10 : 10) : style === "shrink" ? rec.reveal.maxR * (1 - ee) : rec.reveal.maxR * ee;
          } else r.uReveal.value = 10;
          r.uPulseR.value = -1;
        }
      }
    }
    // mood: ease towards the picked setting's heart rate, breathing and light
    const km = Math.min(1, dt * 0.9);
    (Object.keys(mood) as (keyof Mood)[]).forEach((k) => (mood[k] += (moodTo[k] - mood[k]) * km));
    beatPh += (dt * mood.bpm) / 60;
    breathPh += (dt * mood.breaths) / 60;
    sigPh += dt * Math.max(0.25, mood.signals);
    key.color.copy(KEY_DAY).lerp(KEY_NIGHT, mood.night).lerp(KEY_WARM, mood.warm * (1 - mood.night));
    key.intensity = 2.6 - 1.55 * mood.night + 0.3 * mood.warm;
    rim.intensity = 3.2 + 0.6 * mood.night;
    rim2.intensity = 1.4 * (1 - 0.7 * mood.night) + 0.8 * mood.warm;
    scene.environmentIntensity = 0.45 - 0.27 * mood.night;

    // the heart beats once it is whole; each beat sends a pulse down the arteries; the airways breathe
    const hr = groups.get("heart");
    if (hr && t > 3.0) hr.pivot.scale.setScalar(1 + (0.03 + 0.012 * clamp01((mood.bpm - 64) / 60)) * beat(beatPh));
    const art = groups.get("arteries");
    if (art && t > 5.3) {
      const r = (beatPh - Math.floor(beatPh)) * 5.6 * S;
      art.mats.forEach((m) => {
        const u = m.userData.reveal as Reveal | undefined;
        if (u) u.uPulseR.value = r;
      });
    }
    const nv = groups.get("nerves");
    if (nv && t > 6.1) {
      const on = mood.signals > 0.05;
      const r = (sigPh - Math.floor(sigPh)) * 2.1 * S;
      nv.mats.forEach((m) => {
        const u = m.userData.reveal as Reveal | undefined;
        if (!u) return;
        u.uPulseR.value = on ? r : -1;
        u.uPulseW.value = 0.07;
      });
    }
    if (air && t > 3.6) {
      const br = 0.5 - 0.5 * Math.cos(2 * Math.PI * breathPh);
      air.pivot.scale.setScalar(1 + (0.018 + 0.014 * clamp01((mood.breaths - 14) / 12)) * br);
    }
    if (!introDone && t > INTRO_END) {
      introDone = true;
      opts.onIntroDone?.();
    }

    // turning: slow on its own after the intro, and whatever people drag
    const idle = performance.now() - lastInput > 4000;
    if (!dragging) {
      spin += spinVel;
      spinVel *= 0.92;
      if (idle && introDone && !opts.reduced) spin += dt * 0.1;
    }
    root.rotation.y = spin;

    // camera
    const k = clamp01((clock - camT0) / camDur);
    const e = inOutCubic(k);
    cam = {
      theta: camFrom.theta + (camTo.theta - camFrom.theta) * e,
      radius: camFrom.radius + (camTo.radius - camFrom.radius) * e,
      camY: camFrom.camY + (camTo.camY - camFrom.camY) * e,
      targetY: camFrom.targetY + (camTo.targetY - camFrom.targetY) * e,
      targetX: camFrom.targetX + (camTo.targetX - camFrom.targetX) * e,
      fov: camFrom.fov + (camTo.fov - camFrom.fov) * e,
    };
    applyCam();
    renderer.render(scene, camera);
  };
  applyCam();
  renderer.render(scene, camera);
  opts.onReady?.();
  raf = requestAnimationFrame(frame);

  return {
    setFocus,
    replay: () => {
      introStart = clock;
      introDone = false;
      camFrom = { ...START };
      camTo = focus ? fitFocus(focus) : { ...FULL };
      camT0 = clock + 0.2;
      camDur = INTRO_END - 0.2;
    },
    dispose: () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      canvas.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      meshes.forEach((m) => {
        m.geometry.dispose();
        (m.material as THREE.Material).dispose();
      });
      pmrem.dispose();
      renderer.dispose();
    },
  };
}

/* The moving body: a real skeleton and its muscles that move the way a body does.
   Real anatomy: BodyParts3D 4.0 (c) The Database Center for Life Science, CC BY 4.0, rigged and skinned by
   scripts/motion (joint centres measured on the bones; every muscle tied to the bones it lies along).
   How it moves: lib/motion/joints.ts (published ranges of motion, the way a movement spreads over the spine's levels,
   the shoulder blade's rhythm, the knee's screw-home and the kneecap). Shown 1.83 m tall. */
import * as THREE from "three";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { solve, moveAt, MOVES, HOME_VIEW, neutral, restValue, type Pose, type Rig, type Solved, type View } from "./motion/joints";

export const SCALE = 1.83 / 1.73;
const DEG = Math.PI / 180;

type Manifest = {
  q: { bits: number; min: [number, number, number]; span: [number, number, number] };
  vertices: number;
  indices: number;
  streams: { pos: [number, number]; attr: [number, number]; idx: [number, number] };
  parts: [string, string, string, string, number, number, number, number][]; // name, tissue, cluster, side, v0, vn, i0, in
};
type RigFile = Rig & { joints: { id: string; parent: string | null; pivot: [number, number, number] }[] };

export type MotionOptions = {
  base: string; // folder with rig.json, bones.*, muscles.*
  lite?: boolean;
  reduced?: boolean;
  onReady?: () => void;
  onPick?: (p: { name: string; kind: "bone" | "muscle" } | null) => void;
  onPose?: (pose: Pose, info: Record<string, number>) => void;
  onError?: (e: unknown) => void;
};
export type MotionApi = {
  /** the pose the body eases to (the advanced sliders) */
  setPose: (p: Pose) => void;
  /** play one of the easy moves (null stops and eases back to the pose) */
  play: (id: string | null) => void;
  setSpeed: (k: number) => void;
  /** 0: bones only, 1: the deep muscles too, 2: every muscle */
  setLayer: (n: 0 | 1 | 2) => void;
  select: (name: string | null) => void;
  resetView: () => void;
  setInsets: (i: { top: number; right: number; bottom: number; left: number }) => void;
  setPaused: (p: boolean) => void;
  dispose: () => void;
};

// muscles you would see first on a body (the rest are "deep")
const SURFACE = /deltoid|latissimus|masseter|temporalis|pectoralis major|trapezius|external oblique|serratus anterior|gluteus maximus|tensor fasciae|sartorius|rectus femoris|vastus (lateralis|medialis)|gracilis|adductor longus|biceps femoris|semitendinosus|gastrocnemius|soleus|tibialis anterior|extensor digitorum longus|fibularis longus|biceps brachii|triceps|brachioradialis|flexor carpi|palmaris longus|extensor carpi|extensor digitorum$|^(right|left) extensor digitorum|sternocleidomastoid|occipitofrontalis|temporalis|masseter|orbicularis|zygomaticus|depressor|levator labii|nasalis|infraspinatus|teres major|platysma|splenius capitis|iliotibial|calcaneal tendon/i;
const TONE: Record<string, number> = { bone: 0xe8dfcc, tooth: 0xf3efe6, cartilage: 0xc9d6dc };

function decode(m: Manifest, bin: Uint8Array) {
  const n = m.vertices;
  const posQ = new Uint8Array(n * 8), attr = new Uint8Array(n * 16), idx = new Uint8Array(m.indices * 4);
  MeshoptDecoder.decodeVertexBuffer(posQ, n, 8, bin.subarray(m.streams.pos[0], m.streams.pos[0] + m.streams.pos[1]));
  MeshoptDecoder.decodeVertexBuffer(attr, n, 16, bin.subarray(m.streams.attr[0], m.streams.attr[0] + m.streams.attr[1]));
  MeshoptDecoder.decodeIndexBuffer(idx, m.indices, 4, bin.subarray(m.streams.idx[0], m.streams.idx[0] + m.streams.idx[1]));
  const q16 = new Uint16Array(posQ.buffer), Q = (1 << m.q.bits) - 1;
  const pos = new Float32Array(n * 3), skinIndex = new Uint16Array(n * 4), skinWeight = new Float32Array(n * 4);
  const fiber = new Float32Array(n * 3), tendon = new Float32Array(n), part = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    for (let k = 0; k < 3; k++) pos[i * 3 + k] = m.q.min[k] + (q16[i * 4 + k] / Q) * m.q.span[k];
    for (let k = 0; k < 4; k++) { skinIndex[i * 4 + k] = attr[i * 16 + k]; skinWeight[i * 4 + k] = attr[i * 16 + 4 + k] / 255; }
    for (let k = 0; k < 3; k++) { const b = attr[i * 16 + 8 + k]; fiber[i * 3 + k] = (b > 127 ? b - 256 : b) / 127; }
    tendon[i] = attr[i * 16 + 11] / 255;
    part[i] = attr[i * 16 + 12] | (attr[i * 16 + 13] << 8);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("skinIndex", new THREE.Uint16BufferAttribute(skinIndex, 4));
  g.setAttribute("skinWeight", new THREE.BufferAttribute(skinWeight, 4));
  g.setAttribute("fiber", new THREE.BufferAttribute(fiber, 3));
  g.setAttribute("tendon", new THREE.BufferAttribute(tendon, 1));
  g.setAttribute("part", new THREE.BufferAttribute(part, 1));
  g.setIndex(new THREE.BufferAttribute(new Uint32Array(idx.buffer), 1));
  g.computeVertexNormals();
  return g;
}

/** Muscle fibres: fine streaks along each muscle's long axis (its fibre direction, carried through the skinning) that
    break up the colour and the light, and white glossy tendon toward the thin ends. Also used for the layer and the pick. */
function muscleShader(m: THREE.MeshPhysicalMaterial | THREE.MeshStandardMaterial, U: Record<string, THREE.IUniform>) {
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = "attribute vec3 fiber;\nattribute float tendon;\nattribute float part;\nvarying vec3 vFib;\nvarying vec3 vObj;\nvarying float vTendon;\nvarying float vPart;\n" +
      sh.vertexShader.replace("#include <skinning_vertex>", `#include <skinning_vertex>
        vec3 fib = fiber;
        #ifdef USE_SKINNING
          fib = (skinMatrix * vec4(fib, 0.0)).xyz;
        #endif
        vFib = fib; vObj = transformed; vTendon = tendon; vPart = part;`);
    sh.fragmentShader = `uniform float uSel; uniform float uShow; uniform vec3 uTendon; uniform float uFibre;
      varying vec3 vFib; varying vec3 vObj; varying float vTendon; varying float vPart;
      float h31(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
      float vnoise(vec3 p) { vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
        return mix(mix(mix(h31(i), h31(i + vec3(1,0,0)), f.x), mix(h31(i + vec3(0,1,0)), h31(i + vec3(1,1,0)), f.x), f.y),
                   mix(mix(h31(i + vec3(0,0,1)), h31(i + vec3(1,0,1)), f.x), mix(h31(i + vec3(0,1,1)), h31(i + vec3(1,1,1)), f.x), f.y), f.z); }
      float fibres(vec3 p, vec3 f) {
        vec3 u = normalize(cross(f, abs(f.y) < 0.9 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0))), w = cross(f, u);
        vec3 q = vec3(dot(p, u) * 900.0, dot(p, w) * 900.0, dot(p, f) * 40.0);
        return 0.6 * vnoise(q) + 0.4 * vnoise(q * vec3(2.3, 2.3, 1.7) + 7.0);
      }
      ` + sh.fragmentShader
        .replace("void main() {", "void main() {\n  float fib = uFibre > 0.5 ? fibres(vObj, normalize(vFib + vec3(1e-5))) : 0.5;")
        .replace("#include <color_fragment>", `#include <color_fragment>
          float tnd = smoothstep(0.35, 0.8, vTendon);
          diffuseColor.rgb *= mix(0.78 + 0.42 * fib, 1.0, tnd);
          diffuseColor.rgb = mix(diffuseColor.rgb, uTendon, tnd);
          if (abs(vPart - uSel) < 0.5) diffuseColor.rgb = mix(diffuseColor.rgb, vec3(1.0, 0.62, 0.35), 0.35);`)
        .replace("#include <roughnessmap_fragment>", `#include <roughnessmap_fragment>
          roughnessFactor = mix(roughnessFactor * (0.85 + 0.3 * fib), 0.28, tnd);`)
        .replace("#include <normal_fragment_maps>", `#include <normal_fragment_maps>
          { // the streaks as a fine bump, from the screen-space change of the pattern
            vec2 dh = vec2(dFdx(fib), dFdy(fib)) * 0.9 * (1.0 - tnd);
            vec3 vSigmaX = normalize(dFdx(-vViewPosition)), vSigmaY = normalize(dFdy(-vViewPosition));
            vec3 R1 = cross(vSigmaY, normal), R2 = cross(normal, vSigmaX);
            float fDet = dot(vSigmaX, R1) * faceDirection;
            vec3 vGrad = sign(fDet) * (dh.x * R1 + dh.y * R2);
            normal = normalize(abs(fDet) * normal - vGrad);
          }`);
  };
  m.customProgramCacheKey = () => "hfs-muscle";
}
function boneShader(m: THREE.MeshPhysicalMaterial | THREE.MeshStandardMaterial, U: Record<string, THREE.IUniform>) {
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = "attribute float part;\nvarying float vPart;\nvarying vec3 vObj;\n" + sh.vertexShader.replace("#include <skinning_vertex>", "#include <skinning_vertex>\nvPart = part; vObj = transformed;");
    sh.fragmentShader = "uniform float uSel;\nvarying float vPart;\nvarying vec3 vObj;\nfloat h31(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }\n" + sh.fragmentShader
      .replace("#include <color_fragment>", `#include <color_fragment>
        diffuseColor.rgb *= 0.94 + 0.06 * h31(floor(vObj * 2600.0));
        if (abs(vPart - uSel) < 0.5) diffuseColor.rgb = mix(diffuseColor.rgb, vec3(1.0, 0.62, 0.35), 0.35);`);
  };
  m.customProgramCacheKey = () => "hfs-bone";
}

export async function createMotion(canvas: HTMLCanvasElement, opts: MotionOptions): Promise<MotionApi> {
  const lite = !!opts.lite;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, lite ? 1.5 : 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.45;
  const camera = new THREE.PerspectiveCamera(26, 1, 0.01, 60);
  scene.add(camera);
  const key = new THREE.DirectionalLight(0xfff0dd, 2.6); key.position.set(-1.6, 2.2, 2.4);
  const rim = new THREE.DirectionalLight(0xa9c8ff, 2.4); rim.position.set(2.6, 1.6, -2.8);
  const rim2 = new THREE.DirectionalLight(0xffd2b0, 1.1); rim2.position.set(-2.8, 0.6, -2.2);
  const fill = new THREE.DirectionalLight(0xffffff, 0.35); fill.position.set(0.4, -0.6, 2);
  camera.add(key, rim, rim2, fill, key.target, rim.target, rim2.target, fill.target);
  scene.add(new THREE.HemisphereLight(0xfff8f0, 0x1a1714, 0.4));

  // ------------------------------------------------------------------ the model
  const get = (f: string) => fetch(`${opts.base}/${f}`).then((r) => { if (!r.ok) throw new Error(`${f} ${r.status}`); return f.endsWith(".json") ? r.json() : r.arrayBuffer(); });
  const [rig, mb, bb, mm, mbin] = await Promise.all([get("rig.json"), get("bones.json"), get("bones.bin"), get("muscles.json"), get("muscles.bin"), MeshoptDecoder.ready]) as [RigFile, Manifest, ArrayBuffer, Manifest, ArrayBuffer, unknown];
  const body = new THREE.Group(); body.scale.setScalar(SCALE); scene.add(body);
  // the skeleton: one bone per joint, at its measured centre; at rest every bone is unturned (the model's frame)
  const bones = new Map<string, THREE.Bone>();
  for (const j of rig.joints) {
    const b = new THREE.Bone(); b.name = j.id;
    const pp = j.parent ? rig.joints.find((k) => k.id === j.parent)!.pivot : [0, 0, 0];
    b.position.set(j.pivot[0] - pp[0], j.pivot[1] - pp[1], j.pivot[2] - pp[2]);
    bones.set(j.id, b);
    if (j.parent) bones.get(j.parent)!.add(b); else body.add(b);
  }
  const order = rig.joints.map((j) => bones.get(j.id)!);
  body.updateMatrixWorld(true);
  const skeleton = new THREE.Skeleton(order);
  const U = { uSel: { value: -1 }, uShow: { value: 2 }, uTendon: { value: new THREE.Color(0xeee6da) }, uFibre: { value: 1 } };
  const Ub = { uSel: { value: -1 } };
  const PHYS_ONLY = ["clearcoat", "clearcoatRoughness", "sheen", "sheenColor", "sheenRoughness"];
  const mk = (o: THREE.MeshPhysicalMaterialParameters) => {
    if (!lite) return new THREE.MeshPhysicalMaterial(o);
    const so = Object.fromEntries(Object.entries(o).filter(([k]) => !PHYS_ONLY.includes(k)));
    return new THREE.MeshStandardMaterial(so as THREE.MeshStandardMaterialParameters);
  };
  // bones: ivory, teeth whiter, cartilage pale blue-grey
  const boneGeo = decode(mb, new Uint8Array(bb));
  { const col = new Float32Array(boneGeo.attributes.position.count * 3), c = new THREE.Color();
    for (const p of mb.parts) { c.setHex(TONE[p[1]] ?? TONE.bone).convertSRGBToLinear(); for (let i = p[4]; i < p[4] + p[5]; i++) c.toArray(col, i * 3); }
    boneGeo.setAttribute("color", new THREE.BufferAttribute(col, 3)); }
  const boneMat = mk({ vertexColors: true, roughness: 0.55, clearcoat: 0.18, clearcoatRoughness: 0.5, sheen: 0.25, sheenColor: new THREE.Color(0xfff1dc) });
  boneShader(boneMat, Ub);
  const boneMesh = new THREE.SkinnedMesh(boneGeo, boneMat);
  // muscles: deep red with fibres; the deep ones hide when only the surface is wanted
  const musGeo = decode(mm, new Uint8Array(mbin));
  const layer = new Float32Array(musGeo.attributes.position.count);
  mm.parts.forEach((p) => { if (SURFACE.test(p[0])) for (let i = p[4]; i < p[4] + p[5]; i++) layer[i] = 1; });
  musGeo.setAttribute("layer", new THREE.BufferAttribute(layer, 1));
  const musMat = mk({ color: 0x9c3b34, roughness: 0.46, clearcoat: 0.22, clearcoatRoughness: 0.38, sheen: 0.7, sheenColor: new THREE.Color(0xff9f8f), sheenRoughness: 0.45 });
  muscleShader(musMat, U);
  { // the layer: a muscle draws only if its layer is shown
    const prev = musMat.onBeforeCompile;
    musMat.onBeforeCompile = (sh, r) => {
      prev.call(musMat, sh, r);
      sh.vertexShader = "attribute float layer;\nvarying float vLayer;\n" + sh.vertexShader.replace("#include <skinning_vertex>", "#include <skinning_vertex>\nvLayer = layer;");
      sh.fragmentShader = "varying float vLayer;\n" + sh.fragmentShader.replace("void main() {", "void main() {\n  if (uShow < 0.5 || (uShow < 1.5 && vLayer > 0.5)) discard;");
    };
  }
  const musMesh = new THREE.SkinnedMesh(musGeo, musMat);
  for (const m of [boneMesh, musMesh]) { body.add(m); m.frustumCulled = false; }
  { // a soft shadow where the feet stand: the floor the body balances on
    const c = document.createElement("canvas"); c.width = c.height = 128;
    const g = c.getContext("2d")!, gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, "rgba(0,0,0,0.62)"); gr.addColorStop(0.45, "rgba(0,0,0,0.32)"); gr.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
    const sh = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.46), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false }));
    sh.rotation.x = -Math.PI / 2; sh.position.set(0, (rig.floor ?? 0) - 0.002, 0.0); sh.renderOrder = -1;
    body.add(sh);
  }
  body.updateMatrixWorld(true);
  for (const m of [boneMesh, musMesh]) m.bind(skeleton); // bind at rest, in the body's frame (its scale included)
  const names = { bone: mb.parts.map((p) => p[0]), muscle: mm.parts.map((p) => p[0]) };

  // ------------------------------------------------------------------ the pose: eased toward its target; a move overrides it
  let target: Pose = neutral(), now: Pose = neutral(), playing: string | null = null, speed = 1, tMove = 0;
  const moveOut: Pose = {};
  const solved: Solved = { q: new Map(), info: {}, root: new THREE.Vector3() };
  const P0 = new THREE.Vector3(...rig.joints[0].pivot);
  const apply = (p: Pose) => {
    solve(rig, p, solved);
    for (const [id, q] of solved.q) bones.get(id)?.quaternion.copy(q);
    bones.get("pelvis")!.position.copy(P0).add(solved.root);
  };

  // ------------------------------------------------------------------ camera: drag to turn, pinch or wheel to zoom
  const insets = { top: 0, right: 0, bottom: 0, left: 0 };
  const view = { yaw: HOME_VIEW.turn * DEG, pitch: HOME_VIEW.tilt * DEG, dist: HOME_VIEW.dist, fit: 1, target: new THREE.Vector3(...HOME_VIEW.at).multiplyScalar(SCALE) };
  const goal = { yaw: view.yaw, pitch: view.pitch, dist: view.dist, target: view.target.clone(), w: HOME_VIEW.w ?? 0.9, base: HOME_VIEW.dist, fit: 1 };
  const focus = (v: View) => { goal.yaw = v.turn * DEG; goal.pitch = v.tilt * DEG; goal.dist = v.dist; goal.base = v.dist; goal.target.set(...v.at).multiplyScalar(SCALE); goal.w = v.w ?? 0.9; };
  // the views are framed for a wide screen whose free area is most of its height; where the controls take more of the
  // screen, or it is narrow, the camera steps back so the same subject fits what is left
  const T2 = 2 * Math.tan((camera.fov / 2) * DEG);
  const fitFor = (dist: number) => {
    const w = canvas.clientWidth || 1, h = canvas.clientHeight || 1;
    const fw = Math.max(80, w - insets.left - insets.right), fh = Math.max(80, h - insets.top - insets.bottom);
    return Math.max(1, (0.86 * h) / fh, (goal.w * SCALE) / (T2 * (fw / h) * dist));
  };
  const applyCamera = () => {
    const w = canvas.clientWidth || 1, h = canvas.clientHeight || 1;
    const t = view.target, d = view.dist * view.fit;
    camera.position.set(t.x + Math.sin(view.yaw) * Math.cos(view.pitch) * d, t.y + Math.sin(view.pitch) * d, t.z + Math.cos(view.yaw) * Math.cos(view.pitch) * d);
    camera.lookAt(t);
    const fx = insets.left + (w - insets.left - insets.right) / 2, fy = insets.top + (h - insets.top - insets.bottom) / 2;
    camera.setViewOffset(w, h, w / 2 - fx, h / 2 - fy, w, h);
    camera.updateProjectionMatrix();
  };
  let drag: { x: number; y: number; id: number; moved: number } | null = null;
  const pts = new Map<number, { x: number; y: number }>();
  let pinch0 = 0;
  const onDown = (e: PointerEvent) => {
    canvas.setPointerCapture(e.pointerId); pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pts.size === 1) drag = { x: e.clientX, y: e.clientY, id: e.pointerId, moved: 0 };
    if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch0 = Math.hypot(a.x - b.x, a.y - b.y); drag = null; }
  };
  const onMove = (e: PointerEvent) => {
    if (!pts.has(e.pointerId)) return;
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pts.size === 2) { const [a, b] = [...pts.values()], d = Math.hypot(a.x - b.x, a.y - b.y); if (pinch0 > 0) goal.dist = Math.max(0.5, Math.min(9, goal.dist * (pinch0 / d))); pinch0 = d; return; }
    if (!drag || drag.id !== e.pointerId) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag.x = e.clientX; drag.y = e.clientY; drag.moved += Math.abs(dx) + Math.abs(dy);
    goal.yaw -= dx * 0.008; goal.pitch = Math.max(-0.6, Math.min(1.1, goal.pitch + dy * 0.005));
  };
  const ray = new THREE.Raycaster();
  const onUp = (e: PointerEvent) => {
    const wasTap = drag && drag.id === e.pointerId && drag.moved < 6;
    pts.delete(e.pointerId); if (drag?.id === e.pointerId) drag = null;
    if (!wasTap) return;
    const r = canvas.getBoundingClientRect();
    ray.setFromCamera(new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), camera);
    const meshes = U.uShow.value > 0.5 ? [musMesh, boneMesh] : [boneMesh];
    const hit = ray.intersectObjects(meshes, false).find((h) => {
      if (h.object !== musMesh || !h.face) return true;
      const l = (musGeo.attributes.layer as THREE.BufferAttribute).getX(h.face.a);
      return U.uShow.value > 1.5 || l < 0.5;
    });
    if (!hit || !hit.face) { pick(null); return; }
    const g = (hit.object as THREE.SkinnedMesh).geometry, pi = Math.round((g.attributes.part as THREE.BufferAttribute).getX(hit.face.a));
    pick(hit.object === musMesh ? { kind: "muscle", i: pi } : { kind: "bone", i: pi });
  };
  const onWheel = (e: WheelEvent) => { if (!e.ctrlKey && !document.fullscreenElement && !canvas.closest("[data-immersive]")) return; e.preventDefault(); goal.dist = Math.max(0.5, Math.min(9, goal.dist * Math.exp(e.deltaY * 0.0012))); };
  canvas.addEventListener("pointerdown", onDown); canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerup", onUp); canvas.addEventListener("pointercancel", onUp); canvas.addEventListener("wheel", onWheel, { passive: false });
  const pick = (p: { kind: "bone" | "muscle"; i: number } | null) => {
    U.uSel.value = p?.kind === "muscle" ? p.i : -1; Ub.uSel.value = p?.kind === "bone" ? p.i : -1;
    opts.onPick?.(p ? { name: names[p.kind][p.i], kind: p.kind } : null);
  };

  // ------------------------------------------------------------------ the loop
  let raf = 0, last = performance.now(), paused = false, disposed = false;
  const resize = () => { const w = canvas.clientWidth, h = canvas.clientHeight; if (w && h && (canvas.width !== Math.round(w * renderer.getPixelRatio()) || canvas.height !== Math.round(h * renderer.getPixelRatio()))) { renderer.setSize(w, h, false); camera.aspect = w / h; } };
  const frame = () => {
    raf = requestAnimationFrame(frame);
    if (paused) return;
    const t = performance.now(), dt = Math.min(0.25, (t - last) / 1000); last = t;
    const k = 1 - Math.exp(-dt / 0.12);
    if (playing) {
      tMove += dt * speed;
      moveAt(MOVES.find((m) => m.id === playing)!, tMove, moveOut);
      const full = { ...target, ...moveOut };
      for (const id of new Set([...Object.keys(now), ...Object.keys(full)])) now[id] = (now[id] ?? restValue(id)) + ((full[id] ?? restValue(id)) - (now[id] ?? restValue(id))) * (opts.reduced ? 1 : Math.min(1, k * 2.5));
    } else for (const id of new Set([...Object.keys(now), ...Object.keys(target)])) now[id] = (now[id] ?? restValue(id)) + ((target[id] ?? restValue(id)) - (now[id] ?? restValue(id))) * (opts.reduced ? 1 : k);
    apply(now);
    opts.onPose?.(now, solved.info);
    const kc = 1 - Math.exp(-dt / 0.18);
    goal.fit = fitFor(goal.base); // fixed for the view, so pinching to zoom still goes all the way in
    view.yaw += (goal.yaw - view.yaw) * kc; view.pitch += (goal.pitch - view.pitch) * kc; view.dist += (goal.dist - view.dist) * kc; view.fit += (goal.fit - view.fit) * kc; view.target.lerp(goal.target, kc);
    resize(); applyCamera();
    renderer.render(scene, camera);
  };
  apply(now); resize(); applyCamera();
  // a handle for tests and screenshots: set a pose and a view at once, without easing
  (canvas as unknown as { __motion: unknown }).__motion = {
    bones, solved, now: () => now, playing: () => playing, skeleton,
    snap: (p: Pose, v?: View) => { playing = null; target = { ...neutral(), ...p }; now = { ...target }; apply(now); if (v) { focus(v); goal.fit = fitFor(goal.base); view.yaw = goal.yaw; view.pitch = goal.pitch; view.dist = goal.dist; view.fit = goal.fit; view.target.copy(goal.target); } },
    moves: MOVES,
  };
  frame();
  opts.onReady?.();

  return {
    setPose: (p) => { target = { ...neutral(), ...p }; },
    play: (id) => { playing = id; tMove = 0; const m = id ? MOVES.find((x) => x.id === id) : null; focus(m?.view ?? HOME_VIEW); },
    setSpeed: (s) => { speed = s; },
    setLayer: (n) => { U.uShow.value = n; musMesh.visible = n > 0; },
    select: (name) => { if (!name) return pick(null); let i = names.muscle.indexOf(name); if (i >= 0) return pick({ kind: "muscle", i }); i = names.bone.indexOf(name); if (i >= 0) pick({ kind: "bone", i }); },
    resetView: () => focus(HOME_VIEW),
    setInsets: (i) => Object.assign(insets, i),
    setPaused: (p) => { paused = p; last = performance.now(); },
    dispose: () => {
      if (disposed) return; disposed = true; cancelAnimationFrame(raf);
      canvas.removeEventListener("pointerdown", onDown); canvas.removeEventListener("pointermove", onMove); canvas.removeEventListener("pointerup", onUp); canvas.removeEventListener("pointercancel", onUp); canvas.removeEventListener("wheel", onWheel);
      boneGeo.dispose(); musGeo.dispose(); boneMat.dispose(); musMat.dispose(); pmrem.dispose(); renderer.dispose();
    },
  };
}

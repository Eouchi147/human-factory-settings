/* The 3D body explorer: every system of the body, in colour, taken apart in slow motion.
   Real anatomy: BodyParts3D 4.0 (c) The Database Center for Life Science, CC BY 4.0, simplified for the web and
   scaled to an adult 1.83 m tall. What each system shows and says lives in lib/anatomy.ts.

   How it works: the model arrives as hundreds of pieces (each bone, each muscle, each liver segment). Pieces of one
   system and one surface type share a BatchedMesh, so the whole body draws in a few calls while every piece can still
   move on its own. Coming apart is one number, 0 to 1, that eases slowly towards wherever it is sent (the slider, or
   the film-like play), and each part starts at its own moment, so the system opens in a gentle cascade. */
import * as THREE from "three";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { Line2 } from "three/examples/jsm/lines/Line2.js";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry.js";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { BODY_AXES, SYSTEMS3D, WHOLE_BODY, type PartSpec, type SystemId, type SystemSpec, type Vec3 } from "./anatomy";

/** The reference body is 1.73 m in BodyParts3D; we show it as an adult 1.83 m tall. */
export const SCALE = 1.83 / 1.73;
const S = SCALE;

type Manifest = {
  q: { bits: number; min: Vec3; span: Vec3 };
  vertices: number;
  streams: { pos: [number, number]; idx: [number, number] };
  systems: string[];
  clusters: string[];
  materials: string[];
  tones: string[];
  pieces: number[][];
};

type Batch = {
  system: SystemId;
  material: string;
  mesh: THREE.BatchedMesh;
  solid: THREE.MeshStandardMaterial;
  look: Look;
  next: Look;
  alpha: number;
  pieces: Piece[];
};
type Look = "solid" | "dim" | "xray" | "hidden";

type Piece = {
  system: SystemId;
  part: string;
  tone: string;
  side: number;
  center: THREE.Vector3;
  box: THREE.Box3;
  batch: Batch;
  inst: number;
  full: THREE.Vector3; // offset when fully apart
  delay: number; // when it starts moving, 0..1
  off: THREE.Vector3; // offset now
  color: THREE.Color; // colour in its own system's view
  natural: THREE.Color; // colour in the whole-body view
  dup: boolean; // drawn by another system too (hidden in the whole-body view)
  beat: "heart" | "air" | null;
  onlyPicked: boolean; // drawn only while its part is picked
  anchor: THREE.Vector3; // a point on its front surface
  tris: number;
  pos: Float32Array | null; // kept only until its part's number has a place
};

type PartRec = {
  id: string;
  spec: PartSpec;
  pieces: Piece[];
  center: THREE.Vector3;
  anchor: THREE.Vector3; // a point on its surface, for its number on screen
  anchorPiece: Piece | null; // null for a drawn line
  dim: number;
  dimTo: number;
  drawn: Drawn | null;
};

/** A line drawn over the body (the foot's arches, the textbook posture line), with dots on it. */
type Drawn = { line: Line2; mat: LineMaterial; dots: THREE.Points | null; dotMat: THREE.PointsMaterial | null; box: THREE.Box3; alpha: number };

type SysRec = {
  spec: SystemSpec;
  parts: Map<string, PartRec>;
  batches: Batch[];
  pieces: Piece[];
  box0: THREE.Box3; // together
  box1: THREE.Box3; // apart
  window: number; // how long each piece takes to move, as a share of the explode
  covered: Set<Piece> | null; // pieces of its context that this view draws itself (worked out once both are loaded)
};

export type Insets = { top: number; right: number; bottom: number; left: number };

export type ExplorerOptions = {
  base: string; // folder with core.json, core.bin, muscles.json, muscles.bin
  lite?: boolean;
  reduced?: boolean;
  immersive?: boolean; // full screen: vertical drag tilts, pinch and wheel zoom
  onReady?: () => void;
  onLoading?: (busy: boolean) => void;
  onPick?: (p: { system: SystemId; part: string | null } | null) => void;
  onTour?: (part: string | null) => void;
  onPlaying?: (playing: boolean) => void;
  onExplode?: (v: number) => void;
  onError?: () => void;
};

export type ExplorerApi = {
  setSystem: (id: SystemId | null) => Promise<void>;
  select: (part: string | null) => void;
  /** show only the picked part (and hide the rest of the body), or everything again */
  isolate: (on: boolean) => void;
  zoomBy: (factor: number) => void;
  setExplode: (v: number) => void;
  play: () => void;
  stop: () => void;
  setInsets: (i: Insets) => void;
  bindLabels: (el: HTMLElement | null) => void;
  resetView: () => void;
  setPaused: (p: boolean) => void;
  /** jump to the end of every running animation (used by tests and screenshots) */
  snap: () => void;
  dispose: () => void;
};

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const inOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const inOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;
const damp = (dt: number, tau: number) => 1 - Math.exp(-dt / Math.max(1e-4, tau));
const DEG = Math.PI / 180;

/** One heartbeat as a shape over a cycle (0..1): a strong squeeze, then a smaller one. */
function beat(ph: number) {
  const x = ph - Math.floor(ph);
  return Math.exp(-Math.pow((x - 0.085) / 0.048, 2)) + 0.55 * Math.exp(-Math.pow((x - 0.32) / 0.053, 2));
}

// how each kind of surface looks; colour comes from each piece
type Surf = { roughness: number; clearcoat?: number; clearcoatRoughness?: number; sheen?: number; sheenColor?: number; sheenRoughness?: number; opacity?: number };
const SURF: Record<string, Surf> = {
  bone: { roughness: 0.56, clearcoat: 0.16, clearcoatRoughness: 0.5, sheen: 0.25, sheenColor: 0xfff1dc },
  cart: { roughness: 0.34, clearcoat: 0.55, clearcoatRoughness: 0.25, sheen: 0.3, sheenColor: 0xeaf6ff },
  muscle: { roughness: 0.48, clearcoat: 0.18, clearcoatRoughness: 0.4, sheen: 0.7, sheenColor: 0xff9f8f, sheenRoughness: 0.45 },
  organ: { roughness: 0.36, clearcoat: 0.45, clearcoatRoughness: 0.22, sheen: 0.4, sheenColor: 0xffd2c4 },
  vessel: { roughness: 0.3, clearcoat: 0.6, clearcoatRoughness: 0.18 },
  brain: { roughness: 0.5, clearcoat: 0.18, clearcoatRoughness: 0.4, sheen: 0.75, sheenColor: 0xffe6de, sheenRoughness: 0.5 },
  // the clear front of the eye and its lens: you see the iris and the pupil through them
  glass: { roughness: 0.04, clearcoat: 1, clearcoatRoughness: 0.03, opacity: 0.26 },
  // the fat of the breast: soft and half see-through, so the milk glands show inside
  fat: { roughness: 0.42, clearcoat: 0.35, clearcoatRoughness: 0.3, sheen: 0.5, sheenColor: 0xfff0d0, opacity: 0.45 },
  // fascia drawn in (the thigh's sleeve, the sole's band): a thin silvery film you see the muscles through
  fascia: { roughness: 0.22, clearcoat: 0.9, clearcoatRoughness: 0.12, sheen: 0.8, sheenColor: 0xeef5ff, sheenRoughness: 0.3, opacity: 0.52 },
  // dense fascia (the IT band): white and glossy, like a tendon
  band: { roughness: 0.28, clearcoat: 0.7, clearcoatRoughness: 0.18, sheen: 0.6, sheenColor: 0xf6fbff },
};

/** A soft round dot, for the landmarks on a drawn line. */
function dotTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d")!;
  g.beginPath();
  g.arc(32, 32, 27, 0, Math.PI * 2);
  g.fillStyle = "rgba(12,14,18,0.92)";
  g.fill();
  g.beginPath();
  g.arc(32, 32, 17, 0, Math.PI * 2);
  g.fillStyle = "#ffffff";
  g.fill();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// colours in the whole-body view, where the brain is shown as it looks, not colour-coded by lobe
const NATURAL: Record<string, string> = {
  "nervous/frontal": "#e2b6ac", "nervous/parietal": "#e2b6ac", "nervous/temporal": "#e2b6ac", "nervous/occipital": "#e2b6ac",
  "nervous/cerebellum": "#d9a79d", "nervous/brainstem": "#cf968c", "nervous/deep": "#cf968c", "nervous/white": "#ece2d6",
  "nervous/ventricles": "#cfe4ea",
};

function makeXray(tint: number) {
  const u = { uTint: { value: new THREE.Color(tint) }, uAlpha: { value: 1 } };
  // screen blend: adds light over the dark background like an x-ray, but barely brightens a solid organ
  // behind it, so bone in front of an organ never washes it out to white
  const m = new THREE.MeshLambertMaterial({ color: 0x000000, transparent: true, depthWrite: false });
  m.blending = THREE.CustomBlending;
  m.blendEquation = THREE.AddEquation;
  m.blendSrc = THREE.OneMinusDstColorFactor;
  m.blendDst = THREE.OneFactor;
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, u);
    sh.fragmentShader = sh.fragmentShader.replace("#include <common>", "#include <common>\nuniform vec3 uTint;\nuniform float uAlpha;").replace(
      "#include <opaque_fragment>",
      `#include <opaque_fragment>
      float fr = 1.0 - abs(dot(normalize(normal), normalize(vViewPosition)));
      float g = 0.02 + 0.46 * pow(fr, 3.0);
      gl_FragColor = vec4(uTint * g * uAlpha, 1.0);`,
    );
  };
  m.customProgramCacheKey = () => "hfs-xray";
  return { m, u };
}

/** Nearest point on a polyline. */
function nearestOnLine(p: THREE.Vector3, line: THREE.Vector3[], out: THREE.Vector3) {
  let best = Infinity;
  const seg = new THREE.Line3();
  const q = new THREE.Vector3();
  for (let i = 0; i < line.length - 1; i++) {
    seg.set(line[i], line[i + 1]);
    seg.closestPointToPoint(p, true, q);
    const d = q.distanceToSquared(p);
    if (d < best) {
      best = d;
      out.copy(q);
    }
  }
  return best;
}

export async function createExplorer(canvas: HTMLCanvasElement, opts: ExplorerOptions): Promise<ExplorerApi> {
  const lite = !!opts.lite;
  const reduced = !!opts.reduced;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, lite ? 1.5 : 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.02;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.5;
  const camera = new THREE.PerspectiveCamera(26, 1, 0.01, 60);
  scene.add(camera);
  // the light travels with the camera, so every side of the body is lit the same way as you turn it
  const key = new THREE.DirectionalLight(0xfff0dd, 2.5);
  key.position.set(-1.6, 2.2, 2.4);
  const rim = new THREE.DirectionalLight(0xa9c8ff, 2.6);
  rim.position.set(2.6, 1.6, -2.8);
  const rim2 = new THREE.DirectionalLight(0xffd2b0, 1.2);
  rim2.position.set(-2.8, 0.6, -2.2);
  const fill = new THREE.DirectionalLight(0xffffff, 0.35);
  fill.position.set(0.4, -0.6, 2);
  camera.add(key, rim, rim2, fill, key.target, rim.target, rim2.target, fill.target);
  scene.add(new THREE.HemisphereLight(0xfff8f0, 0x1a1714, 0.45));

  // floor rings, as in the films
  const ring = new THREE.Group();
  const circ = (r: number, seg = 192) => {
    const pts: THREE.Vector3[] = [];
    for (let k = 0; k <= seg; k++) {
      const a = (k / seg) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r));
    }
    return new THREE.BufferGeometry().setFromPoints(pts);
  };
  const ringMats = [0.28, 0.11].map((o) => new THREE.LineBasicMaterial({ color: 0xeceef1, transparent: true, opacity: o, depthWrite: false }));
  ring.add(new THREE.Line(circ(0.62 * S), ringMats[0]), new THREE.Line(circ(0.66 * S), ringMats[1]));
  ring.position.y = 0.0005;
  scene.add(ring);

  const xrays = new Map<Batch, ReturnType<typeof makeXray>>();
  const xrayOf = (b: Batch) => {
    let x = xrays.get(b);
    if (!x) {
      x = makeXray(0x9db6dc);
      xrays.set(b, x);
    }
    return x;
  };
  // lines drawn over the body: always on top (they are a diagram over the anatomy), widths in screen pixels
  const drawnAll: Drawn[] = [];
  const drawnParts: { sys: SystemId; rec: PartRec }[] = [];
  let dotTex: THREE.Texture | null = null;
  const makeDrawn = (ps: PartSpec): Drawn => {
    const pts = ps.path!.map(([x, y, z]) => new THREE.Vector3(x * S, y * S, z * S));
    const curve = pts.length > 2 ? new THREE.CatmullRomCurve3(pts, false, "centripetal").getPoints(72) : pts;
    const geo = new LineGeometry();
    geo.setPositions(curve.flatMap((p) => [p.x, p.y, p.z]));
    const mat = new LineMaterial({ color: new THREE.Color(ps.color), linewidth: 3, transparent: true, opacity: 0, depthTest: false, depthWrite: false });
    mat.resolution.set(canvas.clientWidth || 1, canvas.clientHeight || 1);
    const line = new Line2(geo, mat);
    line.computeLineDistances();
    line.renderOrder = 20;
    line.visible = false;
    line.frustumCulled = false;
    scene.add(line);
    let dots: THREE.Points | null = null, dotMat: THREE.PointsMaterial | null = null;
    if (ps.dots?.length) {
      dotTex ??= dotTexture();
      const g = new THREE.BufferGeometry().setFromPoints(ps.dots.map(([x, y, z]) => new THREE.Vector3(x * S, y * S, z * S)));
      dotMat = new THREE.PointsMaterial({ color: new THREE.Color(ps.color), size: 13 * renderer.getPixelRatio(), sizeAttenuation: false, map: dotTex, transparent: true, opacity: 0, depthTest: false, depthWrite: false });
      dots = new THREE.Points(g, dotMat);
      dots.renderOrder = 21;
      dots.visible = false;
      dots.frustumCulled = false;
      scene.add(dots);
    }
    const box = new THREE.Box3().setFromPoints(pts);
    const d: Drawn = { line, mat, dots, dotMat, box, alpha: 0 };
    drawnAll.push(d);
    return d;
  };
  const systems = new Map<SystemId, SysRec>();
  const batches: Batch[] = [];
  const loaded = new Set<string>();
  const loading = new Map<string, Promise<void>>();
  let disposed = false;

  // ------------------------------------------------------------------ loading
  const loadFile = (file: SystemSpec["file"]) => {
    if (loaded.has(file)) return Promise.resolve();
    const running = loading.get(file);
    if (running) return running;
    const job = (async () => {
      const [m, bin] = await Promise.all([
        fetch(`${opts.base}/${file}.json`).then((r) => {
          if (!r.ok) throw new Error(`model ${file} ${r.status}`);
          return r.json() as Promise<Manifest>;
        }),
        fetch(`${opts.base}/${file}.bin`).then((r) => {
          if (!r.ok) throw new Error(`model ${file} ${r.status}`);
          return r.arrayBuffer();
        }),
        MeshoptDecoder.ready,
      ]);
      if (disposed) return;
      build(m, new Uint8Array(bin));
      loaded.add(file);
    })();
    loading.set(file, job);
    return job;
  };

  const build = (m: Manifest, bin: Uint8Array) => {
    const n = m.vertices;
    const posQ = new Uint8Array(n * 8);
    MeshoptDecoder.decodeVertexBuffer(posQ, n, 8, bin.subarray(m.streams.pos[0], m.streams.pos[0] + m.streams.pos[1]));
    const Q = new Uint16Array(posQ.buffer);
    const qmax = 2 ** m.q.bits - 1;
    const k0 = m.q.min.map((x) => x * S);
    const k1 = m.q.span.map((x) => (x * S) / qmax);

    type Raw = { sys: SystemId; part: string; mat: string; tone: string; side: number; geo: THREE.BufferGeometry; center: THREE.Vector3; box: THREE.Box3; tris: number; anchor: THREE.Vector3; pos: Float32Array };
    const raws: Raw[] = [];
    let vbase = 0;
    for (const row of m.pieces) {
      const [si, ci, mi, ti, side, v, i, io, il] = row;
      const sys = m.systems[si] as SystemId;
      const part = m.clusters[ci].split("/")[1];
      const pos = new Float32Array(v * 3);
      for (let j = 0; j < v; j++) {
        const q = (vbase + j) * 4;
        pos[j * 3] = k0[0] + Q[q] * k1[0];
        pos[j * 3 + 1] = k0[1] + Q[q + 1] * k1[1];
        pos[j * 3 + 2] = k0[2] + Q[q + 2] * k1[2];
      }
      vbase += v;
      const idx8 = new Uint8Array(i * 2);
      MeshoptDecoder.decodeIndexBuffer(idx8, i, 2, bin.subarray(m.streams.idx[0] + io, m.streams.idx[0] + io + il));
      const idx = new Uint16Array(idx8.buffer);
      // smooth normals, weighted by triangle area
      const nrm = new Float32Array(v * 3);
      for (let t = 0; t < i; t += 3) {
        const a = idx[t] * 3, b = idx[t + 1] * 3, c = idx[t + 2] * 3;
        const ux = pos[b] - pos[a], uy = pos[b + 1] - pos[a + 1], uz = pos[b + 2] - pos[a + 2];
        const wx = pos[c] - pos[a], wy = pos[c + 1] - pos[a + 1], wz = pos[c + 2] - pos[a + 2];
        const nx = uy * wz - uz * wy, ny = uz * wx - ux * wz, nz = ux * wy - uy * wx;
        nrm[a] += nx; nrm[a + 1] += ny; nrm[a + 2] += nz;
        nrm[b] += nx; nrm[b + 1] += ny; nrm[b + 2] += nz;
        nrm[c] += nx; nrm[c + 1] += ny; nrm[c + 2] += nz;
      }
      for (let j = 0; j < v * 3; j += 3) {
        const l = Math.hypot(nrm[j], nrm[j + 1], nrm[j + 2]) || 1;
        nrm[j] /= l;
        nrm[j + 1] /= l;
        nrm[j + 2] /= l;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      geo.setAttribute("normal", new THREE.BufferAttribute(nrm, 3));
      geo.setIndex(new THREE.BufferAttribute(idx, 1));
      geo.computeBoundingBox();
      geo.computeBoundingSphere();
      const box = geo.boundingBox!.clone();
      // a point on the front of the piece near its middle: where its number sits
      const c = box.getCenter(new THREE.Vector3());
      const want = new THREE.Vector3(c.x, c.y, box.max.z);
      let best = Infinity, bi = 0;
      for (let j = 0; j < v; j++) {
        const dx = pos[j * 3] - want.x, dy = pos[j * 3 + 1] - want.y, dz = pos[j * 3 + 2] - want.z;
        const d = dx * dx + dy * dy + dz * dz * 0.5;
        if (d < best) {
          best = d;
          bi = j;
        }
      }
      raws.push({ sys, part, mat: m.materials[mi], tone: m.tones[ti], side, geo, center: c, box, tris: i / 3, anchor: new THREE.Vector3(pos[bi * 3], pos[bi * 3 + 1], pos[bi * 3 + 2]), pos });
    }

    // one batch per system and surface
    const groups = new Map<string, Raw[]>();
    for (const r of raws) {
      const k = `${r.sys}|${r.mat}`;
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k)!.push(r);
    }
    for (const [k, list] of groups) {
      const [sys, mat] = k.split("|") as [SystemId, string];
      const surf = SURF[mat] ?? SURF.organ;
      const solid = lite
        ? new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: surf.roughness, metalness: 0 })
        : new THREE.MeshPhysicalMaterial({
            color: 0xffffff, roughness: surf.roughness, metalness: 0, clearcoat: surf.clearcoat ?? 0, clearcoatRoughness: surf.clearcoatRoughness ?? 0.3,
            sheen: surf.sheen ?? 0, sheenColor: new THREE.Color(surf.sheenColor ?? 0xffffff), sheenRoughness: surf.sheenRoughness ?? 0.5,
          });
      if (SYSTEMS3D.find((x) => x.id === sys)?.doubleSided) solid.side = THREE.DoubleSide;
      // see-through surfaces stay see-through at every step of a fade, and never hide what is behind them
      solid.userData.base = surf.opacity ?? 1;
      if (solid.userData.base < 1) {
        solid.transparent = true;
        solid.depthWrite = false;
        solid.opacity = 0;
      }
      let vc = 0, ic = 0;
      for (const r of list) {
        vc += r.geo.getAttribute("position").count;
        ic += r.geo.getIndex()!.count;
      }
      const mesh = new THREE.BatchedMesh(list.length, vc, ic, solid);
      mesh.frustumCulled = false;
      mesh.visible = false;
      const b: Batch = { system: sys, material: mat, mesh, solid, look: "hidden", next: "hidden", alpha: 0, pieces: [] };
      const ident = new THREE.Matrix4();
      for (const r of list) {
        const gid = mesh.addGeometry(r.geo);
        const inst = mesh.addInstance(gid);
        mesh.setMatrixAt(inst, ident);
        const p: Piece = {
          system: sys, part: r.part, tone: r.tone, side: r.side, center: r.center, box: r.box, batch: b, inst, full: new THREE.Vector3(), delay: 0,
          off: new THREE.Vector3(), color: new THREE.Color(1, 1, 1), natural: new THREE.Color(1, 1, 1), dup: false,
          beat: sys === "cardio" && ["atria", "ventricles", "valves", "coronary"].includes(r.part) ? "heart" : sys === "breathing" && /lung|windpipe/.test(r.part) ? "air" : null,
          onlyPicked: false,
          anchor: r.anchor,
          tris: r.tris,
          pos: r.pos,
        };
        b.pieces.push(p);
        r.geo.dispose();
      }
      scene.add(mesh);
      batches.push(b);
    }
    // systems, parts and where every piece goes when the system comes apart
    for (const spec of SYSTEMS3D) {
      const sysBatches = batches.filter((b) => b.system === spec.id);
      if (!sysBatches.length || systems.has(spec.id)) continue;
      const pieces = sysBatches.flatMap((b) => b.pieces);
      const parts = new Map<string, PartRec>();
      for (const ps of spec.parts) {
        const mine = pieces.filter((p) => p.part === ps.id);
        if (!mine.length) continue;
        const box = new THREE.Box3();
        mine.forEach((p) => box.union(p.box));
        // its number sits on the front of the part, near its middle; for a pair, on the side facing you
        const c = box.getCenter(new THREE.Vector3());
        const paired = mine.some((p) => p.side === -1) && mine.some((p) => p.side === 1);
        const prefer = spec.parts.indexOf(ps) % 2 === 0 ? -1 : 1;
        const pool = paired ? mine.filter((p) => p.side === prefer) : mine;
        const pbox = new THREE.Box3();
        pool.forEach((p) => pbox.union(p.box));
        const pc = pbox.getCenter(new THREE.Vector3());
        const sz = pbox.getSize(new THREE.Vector3()).max(new THREE.Vector3(0.02, 0.02, 0.02));
        let best = -Infinity;
        let anchorPiece = pool[0];
        const anchor = pool[0].anchor.clone();
        for (const p of pool) {
          const pos = p.pos;
          if (!pos) continue;
          const stepV = pos.length > 30000 ? 9 : 3;
          for (let j = 0; j < pos.length; j += stepV) {
            const score = (pos[j + 2] - pc.z) / sz.z - (0.9 * Math.abs(pos[j] - pc.x)) / sz.x - (0.9 * Math.abs(pos[j + 1] - pc.y)) / sz.y;
            if (score > best) {
              best = score;
              anchorPiece = p;
              anchor.set(pos[j], pos[j + 1], pos[j + 2]);
            }
          }
        }
        parts.set(ps.id, { id: ps.id, spec: ps, pieces: mine, center: c, anchor, anchorPiece, dim: 0, dimTo: 0, drawn: null });
      }
      // lines drawn over the body: no pieces of their own, a fat line (and dots) in the part's colour
      for (const ps of spec.parts) {
        if (!ps.path || ps.path.length < 2) continue;
        const d = makeDrawn(ps);
        const k = Math.floor((ps.path.length - 1) / 2);
        const anchor = new THREE.Vector3(...ps.path[k]).multiplyScalar(S).lerp(new THREE.Vector3(...ps.path[k + 1]).multiplyScalar(S), ps.path.length % 2 ? 0 : 0.5);
        const rec: PartRec = { id: ps.id, spec: ps, pieces: [], center: d.box.getCenter(new THREE.Vector3()), anchor, anchorPiece: null, dim: 0, dimTo: 0, drawn: d };
        parts.set(ps.id, rec);
        drawnParts.push({ sys: spec.id, rec });
      }
      plan(spec, parts, pieces);
      const box0 = new THREE.Box3(), box1 = new THREE.Box3();
      const tmp = new THREE.Box3();
      // what the camera frames: the whole system, or only the parts it names (the breasts sit far above the pelvis)
      const framed = spec.frame?.parts ? pieces.filter((p) => spec.frame!.parts!.includes(p.part)) : pieces;
      for (const p of framed) {
        box0.union(p.box);
        tmp.copy(p.box).translate(p.full);
        box1.union(tmp);
      }
      // a drawn line is framed too (the posture line runs from the floor to above the head)
      for (const rec of parts.values()) {
        if (!rec.drawn || (spec.frame?.parts && !spec.frame.parts.includes(rec.id))) continue;
        box0.union(rec.drawn.box);
        box1.union(rec.drawn.box);
      }
      const maxDelay = pieces.reduce((a, p) => Math.max(a, p.delay), 0);
      systems.set(spec.id, { spec, parts, batches: sysBatches, pieces, box0, box1, window: Math.max(0.42, 1 - maxDelay), covered: null });
    }
    for (const b of batches) for (const p of b.pieces) p.pos = null;
    // pieces drawn twice (the pancreas and hypothalamus also belong to the hormone glands)
    const end = systems.get("endocrine");
    if (end) for (const p of end.pieces) if (p.part === "pancreas" || p.part === "hypothalamus") p.dup = true;
    applyLooks(true);
  };

  /** Colours and the explode plan for one system. */
  const plan = (spec: SystemSpec, parts: Map<string, PartRec>, pieces: Piece[]) => {
    const c = new THREE.Color();
    const sideCenter = new Map<string, THREE.Vector3>();
    for (const rec of parts.values()) {
      for (const sd of [-1, 0, 1]) {
        const mine = rec.pieces.filter((p) => p.side === sd);
        if (!mine.length) continue;
        const b = new THREE.Box3();
        mine.forEach((p) => b.union(p.box));
        sideCenter.set(`${rec.id}|${sd}`, b.getCenter(new THREE.Vector3()));
      }
    }
    // muscles lift off the bones, along the line from the nearest limb or trunk axis
    const axes: THREE.Vector3[][] = [];
    if (spec.float) {
      for (const line of BODY_AXES) {
        axes.push(line.map(([x, y, z]) => new THREE.Vector3(x * S, y * S, z * S)));
        if (line[0][0] !== 0) axes.push(line.map(([x, y, z]) => new THREE.Vector3(-x * S, y * S, z * S)));
      }
    }
    const top = 1.75 * S;
    for (const rec of parts.values()) {
      const ps = rec.spec;
      // every organ moves as one piece; only a pair (two kidneys) may part
      const groups = new Map<string, Piece[]>();
      for (const p of rec.pieces) {
        const k = spec.float && ps.label !== false ? `side${p.side}` : spec.float ? `piece${groups.size}` : "all";
        if (!groups.has(k)) groups.set(k, []);
        groups.get(k)!.push(p);
      }
      for (const group of groups.values()) {
        const gb = new THREE.Box3();
        group.forEach((p) => gb.union(p.box));
        const gc = gb.getCenter(new THREE.Vector3());
        let floatDir: THREE.Vector3 | null = null;
        if (spec.float) {
          // muscles lift straight off the bone they sit on, a whole group together
          const q = new THREE.Vector3();
          let best = Infinity, bestQ = new THREE.Vector3();
          for (const line of axes) {
            const d = nearestOnLine(gc, line, q);
            if (d < best) {
              best = d;
              bestQ = q.clone();
            }
          }
          floatDir = gc.clone().sub(bestQ);
          if (floatDir.lengthSq() < 1e-8) floatDir.set(0, 0, 1);
          floatDir.normalize();
        }
        for (const p of group) {
          p.onlyPicked = !!ps.onlyPicked;
          p.color.set(ps.tones?.[p.tone] ?? ps.color);
          p.natural.set(NATURAL[`${spec.id}/${ps.id}`] ?? (ps.tones?.[p.tone] ?? ps.color));
          if (floatDir) {
            p.full.copy(floatDir).multiplyScalar(spec.float! * (ps.float ?? 1) * S);
            p.delay = clamp01(1 - gc.y / top) * 0.4;
            continue;
          }
          const move = ps.move ?? [0, 0, 0];
          const sign = p.side !== 0 ? p.side : Math.sign(p.center.x - rec.center.x) || 1;
          p.full.set(move[0] * (ps.mirror ? sign : 1), move[1], move[2]).multiplyScalar(S);
          if (ps.spread) {
            const sp = typeof ps.spread === "number" ? [ps.spread, ps.spread, ps.spread] : ps.spread;
            const from = (ps.perSide && sideCenter.get(`${rec.id}|${p.side}`)) || rec.center;
            const d = p.center.clone().sub(from);
            p.full.x += d.x * sp[0];
            p.full.y += d.y * sp[1];
            p.full.z += d.z * sp[2];
          }
          p.delay = ps.at ?? 0;
        }
      }
    }
    // anything without a legend part keeps its own colour
    for (const p of pieces) if (!parts.has(p.part)) p.color.copy(c.set("#9a9a9a"));
  };

  // ------------------------------------------------------------------ what is on screen
  let current: SystemId | null = null;
  let selected: string | null = null;
  let isolated = false;
  const lookFor = (b: Batch): Look => {
    if (current === null) return WHOLE_BODY.includes(b.system) ? "solid" : "hidden";
    if (b.system === current) return "solid";
    if (isolated) return "hidden";
    const spec = systems.get(current)?.spec;
    const ctx = spec?.context ?? "none";
    if (b.system === (spec?.contextSystem ?? "skeleton")) return ctx === "xray" ? "xray" : ctx === "bones" ? "dim" : "hidden";
    return "hidden";
  };
  let colorsDirty = true;
  const applyLooks = (instant = false) => {
    for (const b of batches) {
      const want = lookFor(b);
      if (want === b.next && want === b.look) continue;
      b.next = want;
      if (instant || b.look === "hidden" || b.alpha <= 0.001) {
        b.look = want;
        setMaterial(b);
      }
    }
    // whole body: no duplicates, natural colours; one system: its legend colours; alone: just the picked part
    const rec = current ? systems.get(current) ?? null : null;
    const ctxId = rec ? rec.spec.contextSystem ?? "skeleton" : null;
    const hide = rec?.spec.hideContext ?? [];
    const covered = rec ? coveredOf(rec) : null;
    for (const b of batches)
      for (const p of b.pieces) {
        let v = !(current === null && p.dup) && (!p.onlyPicked || p.part === selected);
        if (isolated && selected && b.system === current) v = p.part === selected;
        // a close-up view leaves out the context it draws itself (the spine in the posture view), or that would stand in the way
        if (rec && b.system === ctxId && b.system !== current && (hide.includes(p.part) || covered?.has(p))) v = false;
        b.mesh.setVisibleAt(p.inst, v);
      }
    colorsDirty = true;
  };
  /** The pieces of a view's context that the view draws itself, found by matching their boxes (within 4 mm). */
  const coveredOf = (rec: SysRec) => {
    if (rec.covered) return rec.covered;
    const ctx = systems.get(rec.spec.contextSystem ?? "skeleton");
    if (!ctx || ctx === rec) return null;
    const tol = 0.004 * S;
    const near = (a: THREE.Box3, b: THREE.Box3) =>
      Math.abs(a.min.x - b.min.x) < tol && Math.abs(a.min.y - b.min.y) < tol && Math.abs(a.min.z - b.min.z) < tol &&
      Math.abs(a.max.x - b.max.x) < tol && Math.abs(a.max.y - b.max.y) < tol && Math.abs(a.max.z - b.max.z) < tol;
    const set = new Set<Piece>();
    for (const q of ctx.pieces) if (rec.pieces.some((p) => near(p.box, q.box))) set.add(q);
    rec.covered = set;
    return set;
  };
  const setMaterial = (b: Batch) => {
    b.mesh.material = b.look === "xray" ? xrayOf(b).m : b.solid;
    b.mesh.visible = b.look !== "hidden";
  };

  // ------------------------------------------------------------------ camera
  const insets: Insets = { top: 0, right: 0, bottom: 0, left: 0 };
  const view = { yaw: -18 * DEG, pitch: 4 * DEG, dist: 6, target: new THREE.Vector3(0, 0.95 * S, 0) };
  const goal = { yaw: view.yaw, pitch: view.pitch, dist: view.dist, target: view.target.clone() };
  let userYaw = 0, userPitch = 0, userZoom = 1;
  const userPan = new THREE.Vector2(); // metres, across and up the screen
  // a flick keeps gliding and slows down, as on a map; a double tap or a button eases to a new view
  const vel = { yaw: 0, pitch: 0, zoom: 0, panX: 0, panY: 0 };
  const glide = { on: false, yaw: 0, pitch: 0, zoom: 1, panX: 0, panY: 0 };
  const pitchMin = () => -40 * DEG - view.pitch, pitchMax = () => 62 * DEG - view.pitch;
  const easeView = (to: { yaw?: number; pitch?: number; zoom?: number; panX?: number; panY?: number }) => {
    glide.on = true;
    glide.yaw = to.yaw ?? userYaw;
    glide.pitch = to.pitch ?? userPitch;
    glide.zoom = to.zoom ?? userZoom;
    glide.panX = to.panX ?? userPan.x;
    glide.panY = to.panY ?? userPan.y;
  };
  const aim = new THREE.Vector3(); // where the camera looks, after panning
  let tau = 0.55; // how quickly the camera settles (seconds)
  let spin = 0; // the whole body turns slowly until someone touches it
  let touched = false;
  const clampZoom = (z: number) => Math.max(0.12, Math.min(3, z));
  const wholeBox = new THREE.Box3(new THREE.Vector3(-0.34 * S, 0, -0.15 * S), new THREE.Vector3(0.34 * S, 1.73 * S, 0.15 * S));
  const sizeNow = () => ({ w: canvas.clientWidth || 1, h: canvas.clientHeight || 1 });
  const fitBox = (box: THREE.Box3, yaw: number, pitch: number, minDist = 0.35 * S) => {
    const { w, h } = sizeNow();
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const cw = Math.abs(size.x * Math.cos(yaw)) + Math.abs(size.z * Math.sin(yaw));
    const depth = Math.abs(size.x * Math.sin(yaw)) + Math.abs(size.z * Math.cos(yaw));
    const ch = size.y * Math.cos(pitch) + depth * Math.sin(Math.abs(pitch));
    const freeW = Math.max(80, w - insets.left - insets.right);
    const freeH = Math.max(80, h - insets.top - insets.bottom);
    const t = Math.tan((camera.fov / 2) * DEG);
    const tanV = t * (freeH / h);
    const tanH = t * (freeW / h);
    const dist = Math.max(ch / 2 / tanV, cw / 2 / tanH) * 1.12 + depth / 2;
    return { dist: Math.max(minDist, dist), target: center };
  };
  const frameNow = () => {
    let box: THREE.Box3;
    let yaw = -18 * DEG, pitch = 4 * DEG;
    const sys = current ? systems.get(current) : null;
    if (sys) {
      yaw = sys.spec.view.turn * DEG;
      pitch = sys.spec.view.tilt * DEG;
      const part = selected ? sys.parts.get(selected) : null;
      if (part) {
        box = new THREE.Box3();
        const tmp = new THREE.Box3();
        part.pieces.forEach((p) => box.union(tmp.copy(p.box).translate(p.off)));
        if (part.drawn) box.union(part.drawn.box);
        // a picked part keeps some of the system around it; a part shown on its own fills the free space
        const s = box.getSize(new THREE.Vector3());
        const m = Math.max(s.x, s.y, s.z);
        const pad = isolated ? Math.max(0, 0.035 * S - m) / 2 + m * 0.03 : Math.max(0, 0.16 * S - m) / 2 + m * 0.18;
        box.expandByVector(new THREE.Vector3(1, 1, 1).multiplyScalar(pad));
        if (isolated && part.spec.view) {
          yaw = part.spec.view.turn * DEG;
          pitch = part.spec.view.tilt * DEG;
        }
      } else {
        box = sys.box0.clone().union(lerpBox(sys.box0, sys.box1, explode));
        if (sys.spec.frame?.y) {
          const [y0, y1] = sys.spec.frame.y;
          const grow = (sys.box1.max.y - sys.box0.max.y) * explode;
          box.min.y = Math.max(box.min.y, y0 * S - grow * 0.4);
          box.max.y = Math.min(box.max.y, y1 * S + grow);
        }
      }
    } else {
      box = wholeBox.clone();
    }
    // a small gland shown on its own may come close; otherwise the camera stays outside the body
    const f = fitBox(box, yaw, pitch, isolated && selected ? 0.12 * S : 0.35 * S);
    goal.yaw = yaw;
    goal.pitch = pitch;
    goal.dist = f.dist;
    goal.target.copy(f.target);
  };
  const lerpBox = (a: THREE.Box3, b: THREE.Box3, t: number) =>
    new THREE.Box3(a.min.clone().lerp(b.min, t), a.max.clone().lerp(b.max, t));
  const applyCamera = () => {
    const { w, h } = sizeNow();
    const yaw = view.yaw + userYaw + spin;
    const pitch = Math.max(-35 * DEG, Math.min(65 * DEG, view.pitch + userPitch));
    const d = view.dist * userZoom;
    aim.set(view.target.x + Math.cos(yaw) * userPan.x, view.target.y + userPan.y, view.target.z - Math.sin(yaw) * userPan.x);
    camera.position.set(aim.x + Math.sin(yaw) * Math.cos(pitch) * d, aim.y + Math.sin(pitch) * d, aim.z + Math.cos(yaw) * Math.cos(pitch) * d);
    camera.lookAt(aim);
    // keep the body centred in the part of the screen the controls leave free
    const fx = insets.left + (w - insets.left - insets.right) / 2;
    const fy = insets.top + (h - insets.top - insets.bottom) / 2;
    camera.setViewOffset(w, h, w / 2 - fx, h / 2 - fy, w, h);
    camera.updateProjectionMatrix();
  };

  // ------------------------------------------------------------------ coming apart
  let explode = 0; // now
  let explodeTo = 0; // where it is heading
  const FOLLOW = 0.06; // the slider: follow the finger at once
  let explodeTau = FOLLOW; // lag behind the target (seconds); long only for the automatic, slow-motion moves
  let offsetsDirty = true;
  const progressOf = (sys: SysRec, p: Piece, e: number) => inOutCubic(clamp01((e - p.delay) / sys.window));
  const tmpM = new THREE.Matrix4();
  const tmpS = new THREE.Vector3();
  const tmpQ = new THREE.Quaternion();
  let beatPh = 0, breathPh = 0;
  const heartCenter = new THREE.Vector3(0.02 * S, 1.3 * S, 0.02 * S);
  const lungCenter = new THREE.Vector3(0, 1.36 * S, 0);
  const updateMatrices = (all: boolean) => {
    const sys = current ? systems.get(current) : null;
    const hb = 1 + 0.028 * beat(beatPh);
    const br = 1 + 0.016 * (0.5 - 0.5 * Math.cos(2 * Math.PI * breathPh));
    for (const b of batches) {
      if (b.look === "hidden" && b.next === "hidden") continue;
      const mine = sys && b.system === sys.spec.id ? sys : null;
      for (const p of b.pieces) {
        if (!all && !p.beat) continue;
        if (mine) p.off.copy(p.full).multiplyScalar(progressOf(mine, p, explode));
        else if (b.next !== "hidden") p.off.set(0, 0, 0); // a system fading out keeps its place

        if (p.beat && !reduced) {
          const k = p.beat === "heart" ? hb : br;
          const c = p.beat === "heart" ? heartCenter : lungCenter;
          // scale about the organ's centre, then move it
          tmpS.setScalar(k);
          tmpM.compose(new THREE.Vector3(c.x * (1 - k) + p.off.x, c.y * (1 - k) + p.off.y, c.z * (1 - k) + p.off.z), tmpQ, tmpS);
        } else {
          tmpM.makeTranslation(p.off.x, p.off.y, p.off.z);
        }
        b.mesh.setMatrixAt(p.inst, tmpM);
      }
    }
  };
  const updateColors = () => {
    const sys = current ? systems.get(current) : null;
    const c = new THREE.Color();
    for (const b of batches) {
      if (b.look === "hidden" && b.next === "hidden") continue;
      for (const p of b.pieces) {
        if (current === null) c.copy(p.natural);
        else if (sys && b.system === sys.spec.id) {
          const rec = sys.parts.get(p.part);
          const dim = rec ? rec.dim : 0;
          c.copy(p.color).multiplyScalar(1 - 0.74 * dim);
        } else c.copy(p.color).multiplyScalar(0.5); // bones behind the muscles
        b.mesh.setColorAt(p.inst, c);
      }
    }
  };

  // ------------------------------------------------------------------ labels: each part's name beside the body, a line to the part
  type Label = {
    key: string; sys: SystemId; part: string; at: THREE.Vector3 | null;
    tag: HTMLElement; pin: HTMLElement | null; line: SVGLineElement | null; w: number; h: number;
    side?: "l" | "r"; y?: number; // where it was drawn last: names glide to their new place instead of jumping
  };
  let labelsEl: HTMLElement | null = null;
  let labels: Label[] = [];
  const bindLabels = (el: HTMLElement | null) => {
    labelsEl = el;
    labels = [];
    if (!el) return;
    for (const tag of Array.from(el.querySelectorAll<HTMLElement>("[data-tag]"))) {
      const key = tag.dataset.tag!;
      const [sys, part] = (tag.dataset.anchor ?? "").split("/");
      const at = tag.dataset.at ? new THREE.Vector3(...(tag.dataset.at.split(",").map((x) => Number(x) * S) as [number, number, number])) : null;
      labels.push({
        key, sys: sys as SystemId, part, at, tag,
        pin: el.querySelector<HTMLElement>(`[data-pin="${key}"]`), line: el.querySelector<SVGLineElement>(`[data-line="${key}"]`),
        w: tag.offsetWidth, h: tag.offsetHeight,
      });
    }
  };
  const labelAlpha = (id: SystemId) => {
    if (current !== null && id !== current) return 0;
    const bs = systems.get(id)?.batches ?? [];
    if (!bs.length) return 0;
    let a = 1;
    for (const b of bs) a = Math.min(a, b.look === "hidden" ? 0 : b.alpha);
    return a;
  };
  const v3 = new THREE.Vector3();
  const ZERO = new THREE.Vector3();
  const camDir = new THREE.Vector3();
  const corner = new THREE.Vector3();
  type Placed = { L: Label; ax: number; ay: number; y: number; op: number };
  const hideLabel = (L: Label) => {
    L.y = undefined;
    L.tag.style.opacity = "0";
    L.tag.style.pointerEvents = "none";
    if (L.pin) L.pin.style.opacity = "0";
    if (L.line) L.line.style.opacity = "0";
  };
  let labelT = 0;
  const updateLabels = () => {
    if (!labelsEl || !labels.length) return;
    const now = performance.now();
    const follow = labelT ? 1 - Math.exp(-(now - labelT) / 1000 / 0.07) : 1;
    labelT = now;
    const { w: W, h: H } = sizeNow();
    camera.getWorldDirection(camDir);
    // how wide the visible body is on screen: the names go just outside it
    const sys = current ? systems.get(current) : null;
    let box = sys ? lerpBox(sys.box0, sys.box1, explode).union(sys.box0) : wholeBox;
    const alone = isolated && selected ? sys?.parts.get(selected) : null;
    if (alone) {
      // shown on its own, the name sits just beside the part
      box = new THREE.Box3();
      const tmp = new THREE.Box3();
      alone.pieces.forEach((p) => box.union(tmp.copy(p.box).translate(p.off)));
    }
    let minX = Infinity, maxX = -Infinity;
    for (let i = 0; i < 8; i++) {
      corner.set(i & 1 ? box.max.x : box.min.x, i & 2 ? box.max.y : box.min.y, i & 4 ? box.max.z : box.min.z).project(camera);
      const x = ((corner.x + 1) / 2) * W;
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
    }
    v3.copy(aim).project(camera);
    const cx = ((v3.x + 1) / 2) * W;
    const top = insets.top + 4, bottom = H - insets.bottom - 4;
    const left: Placed[] = [], right: Placed[] = [];
    for (const L of labels) {
      const rec = systems.get(L.sys)?.parts.get(L.part);
      const alpha = labelAlpha(L.sys);
      // a drawn line's name goes with its line (it fades while the system is apart)
      const lineA = rec?.drawn ? rec.drawn.alpha / Math.max(0.01, sysAlpha) : 1;
      if ((!rec && !L.at) || alpha < 0.05 || lineA < 0.15 || ((isolated || rec?.spec.onlyPicked) && L.part !== selected)) {
        hideLabel(L);
        continue;
      }
      const point = L.at ?? v3.copy(rec!.anchor).add(rec!.anchorPiece?.off ?? ZERO);
      corner.copy(point).project(camera);
      const ax = ((corner.x + 1) / 2) * W, ay = ((1 - corner.y) / 2) * H;
      if (corner.z > 1 || ax < -20 || ax > W + 20 || ay < top - 30 || ay > bottom + 30) {
        hideLabel(L);
        continue;
      }
      if (!L.w) {
        L.w = L.tag.offsetWidth;
        L.h = L.tag.offsetHeight;
      }
      const c = L.at ?? v3.copy(rec!.center).add(rec!.anchorPiece?.off ?? ZERO);
      const behind = !rec?.drawn && corner.copy(c).sub(aim).dot(camDir) > 0.03 * S;
      const op = alpha * Math.min(1, lineA) * (behind ? 0.45 : 1) * (selected && current && L.part !== selected ? 0.38 : 1);
      // a name changes sides only once its part is clearly across the middle, so turning the body does not flick it
      const goLeft = L.side === "l" ? ax < cx + 28 : L.side === "r" ? ax < cx - 28 : ax < cx;
      (goLeft ? left : right).push({ L, ax, ay, y: ay - L.h / 2, op });
    }
    // each column holds what fits; extra names move to the other side, nearest the middle first
    const room = Math.max(0, bottom - top);
    const fits = (list: Placed[], g: number) => list.reduce((a, p) => a + p.L.h, 0) + g * Math.max(0, list.length - 1) <= room;
    const balance = (from: Placed[], to: Placed[], fromLeft: boolean) => {
      while (!fits(from, 4) && fits([...to, from[0]], 4) && from.length > to.length) {
        from.sort((a, b) => (fromLeft ? b.ax - a.ax : a.ax - b.ax));
        to.push(from.shift()!);
      }
    };
    balance(left, right, true);
    balance(right, left, false);
    const shown: Placed[] = [];
    const stack = (list: Placed[]) => {
      // still too many: the faint names (far side, or not picked) give way first
      while (list.length && !fits(list, 1)) {
        let worst = 0;
        for (let i = 1; i < list.length; i++) if (list[i].op < list[worst].op) worst = i;
        hideLabel(list[worst].L);
        list.splice(worst, 1);
      }
      const total = list.reduce((a, p) => a + p.L.h, 0);
      const g = list.length > 1 ? Math.max(1, Math.min(5, (room - total) / (list.length - 1))) : 0;
      list.sort((a, b) => a.ay - b.ay);
      for (let i = 0; i < list.length; i++) {
        const prev = list[i - 1];
        list[i].y = Math.max(list[i].y, top, prev ? prev.y + prev.L.h + g : -Infinity);
      }
      for (let i = list.length - 1; i >= 0; i--) {
        const next = list[i + 1];
        list[i].y = Math.max(top, Math.min(list[i].y, bottom - list[i].L.h, next ? next.y - list[i].L.h - g : Infinity));
      }
      shown.push(...list);
    };
    stack(left);
    stack(right);
    const margin = 8;
    const maxWL = left.reduce((m, p) => Math.max(m, p.L.w), 0);
    const maxWR = right.reduce((m, p) => Math.max(m, p.L.w), 0);
    // names stay in the free part of the screen (on a wide screen the panel covers the right side)
    const leftEdge = Math.min(Math.max(insets.left + margin + maxWL, minX - 16), cx - 20); // the right edge of the names on the left
    const rightEdge = Math.max(Math.min(W - insets.right - margin - maxWR, maxX + 16), cx + 20); // the left edge of the names on the right
    for (const [list, isLeft] of [[left, true], [right, false]] as const) {
      for (const p of list) {
        const side = isLeft ? "l" : "r";
        // glide to the new height; a name that just appeared or changed sides goes straight there
        if (p.L.y !== undefined && p.L.side === side) p.y = p.L.y + (p.y - p.L.y) * follow;
        p.L.y = p.y;
        p.L.side = side;
        const x = isLeft ? leftEdge - p.L.w : rightEdge;
        p.L.tag.style.transform = `translate3d(${x.toFixed(1)}px, ${p.y.toFixed(1)}px, 0)`;
        p.L.tag.style.opacity = p.op.toFixed(2);
        p.L.tag.style.pointerEvents = p.op > 0.3 ? "auto" : "none";
        p.L.tag.dataset.side = isLeft ? "l" : "r";
        if (p.L.pin) {
          p.L.pin.style.transform = `translate3d(${p.ax.toFixed(1)}px, ${p.ay.toFixed(1)}px, 0)`;
          p.L.pin.style.opacity = p.op.toFixed(2);
        }
        if (p.L.line) {
          p.L.line.setAttribute("x1", p.ax.toFixed(1));
          p.L.line.setAttribute("y1", p.ay.toFixed(1));
          p.L.line.setAttribute("x2", (isLeft ? leftEdge : rightEdge).toFixed(1));
          p.L.line.setAttribute("y2", (p.y + p.L.h / 2).toFixed(1));
          p.L.line.style.opacity = (p.op * 0.75).toFixed(2);
        }
      }
    }
  };
  let sysAlpha = 0;
  let ringA = 1; // the floor rings fade rather than blink
  const drawnTarget = (id: SystemId, rec: PartRec) => {
    if (id !== current || isolated) return 0;
    const apart = Math.min(1, Math.max(0, (explode - 0.03) / 0.27));
    return sysAlpha * (1 - apart * apart * (3 - 2 * apart)) * (selected && selected !== rec.id ? 0.3 : 1);
  };
  const showDrawn = (rec: PartRec) => {
    const d = rec.drawn!;
    d.line.visible = d.alpha > 0.004;
    d.mat.opacity = d.alpha;
    d.mat.linewidth = selected === rec.id ? 5.5 : 3.4;
    if (d.dots && d.dotMat) {
      d.dots.visible = d.line.visible;
      d.dotMat.opacity = d.alpha;
    }
  };

  // ------------------------------------------------------------------ play: come apart slowly, then visit each part
  type Step = { t: number; run: () => void };
  let seq: { steps: Step[]; t0: number; i: number } | null = null;
  let clock = 0;
  const startSeq = (steps: Step[]) => {
    seq = { steps, t0: clock, i: 0 };
  };
  const stop = () => {
    if (!seq) return;
    seq = null;
    explodeTau = FOLLOW;
    tau = 0.55;
    opts.onPlaying?.(false);
    opts.onTour?.(null);
  };
  const play = () => {
    const sys = current ? systems.get(current) : null;
    if (!sys) return;
    stop();
    const all = sys.spec.parts.filter((p) => p.label !== false && sys.parts.has(p.id)).map((p) => p.id);
    // drawn lines (the arches) are visited first, while everything is together; then it comes apart
    const lines = all.filter((id) => sys.parts.get(id)!.drawn);
    const order = all.filter((id) => !sys.parts.get(id)!.drawn);
    const steps: Step[] = [];
    let t = 0;
    if (explode > 0.08) {
      steps.push({ t, run: () => { explodeTau = 0.5; explodeTo = 0; selectPart(null); frameNow(); } });
      t += reduced ? 0.4 : 1.8;
    }
    for (const id of lines) {
      steps.push({ t, run: () => { tau = reduced ? 0.25 : 1.35; selectPart(id); opts.onTour?.(id); } });
      t += reduced ? 2.6 : 3.8;
    }
    steps.push({ t, run: () => { explodeTau = reduced ? 0.3 : 1.25; explodeTo = 1; selectPart(null); opts.onTour?.(null); tau = 1.6; } });
    t += reduced ? 1.2 : 5.6;
    for (const id of order) {
      steps.push({ t, run: () => { tau = reduced ? 0.25 : 1.35; selectPart(id); opts.onTour?.(id); } });
      t += reduced ? 2.6 : 3.8;
    }
    steps.push({ t, run: () => { selectPart(null); opts.onTour?.(null); tau = 1.4; } });
    steps.push({ t: t + 1.6, run: () => { seq = null; tau = 0.55; explodeTau = FOLLOW; opts.onPlaying?.(false); } });
    startSeq(steps);
    opts.onPlaying?.(true);
  };

  // ------------------------------------------------------------------ selection
  // shown on its own, a part comes back together (both halves of a pair, in their real shape); "show everything"
  // puts the system back the way it was
  let explodeBefore = 0;
  const setIsolated = (on: boolean) => {
    if (on === isolated) return;
    isolated = on;
    if (seq) {
      // a tour or the first slow-motion move would pull the part apart again
      seq = null;
      tau = 0.55;
      opts.onPlaying?.(false);
    }
    explodeTau = reduced ? 0.15 : 0.55;
    if (on) {
      explodeBefore = explodeTo;
      explodeTo = 0;
    } else explodeTo = explodeBefore;
    applyLooks();
  };
  // a part with a best angle turns to it when it is shown on its own
  const easeToPart = () => {
    const pv = isolated && selected && current ? systems.get(current)?.parts.get(selected)?.spec.view : null;
    easeView(pv ? { yaw: 0, pitch: 0, zoom: 1, panX: 0, panY: 0 } : { zoom: 1, panX: 0, panY: 0 });
    frameNow();
  };
  /** keepView: letting go of a part (a tap beside the body) leaves the view where it is, as on a map */
  const selectPart = (id: string | null, keepView = false) => {
    const sys = current ? systems.get(current) : null;
    selected = sys && id && sys.parts.has(id) ? id : null;
    if (sys) for (const rec of sys.parts.values()) rec.dimTo = selected && rec.id !== selected ? 1 : 0;
    // a drawn line (an arch of the foot) only fits the bones put together: picking one brings them back together
    if (selected && sys?.parts.get(selected)?.drawn && explodeTo > 0.05 && !seq) {
      explodeTau = reduced ? 0.15 : 0.6;
      explodeTo = 0;
    }
    const wasAlone = isolated;
    if (!selected && isolated) setIsolated(false);
    else applyLooks(); // shows the part alone, or one that is drawn only while picked
    if (selected || !keepView || wasAlone) easeToPart();
  };

  // ------------------------------------------------------------------ input, map style
  // one finger turns the body and a flick keeps it turning; two fingers pinch to zoom where they are, twist to turn
  // and drag to move it; a double tap zooms in on that spot, a two-finger tap zooms back out; a tap picks a part
  const pointers = new Map<number, { x: number; y: number; x0: number; y0: number; t0: number }>();
  let moved = false, lastTap = 0, lastTapX = 0, lastTapY = 0, lastMoveT = 0, second = false;
  let pinch0 = 0, zoom0 = 1, midX = 0, midY = 0, angle0 = 0, twist = 0, twisting = false, twoDownT = 0, twoMoved = false;
  let lastInput = -1e9;
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const immersive = !!opts.immersive;
  const two = () => {
    const [a, b] = [...pointers.values()];
    return { d: Math.hypot(a.x - b.x, a.y - b.y), mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2, ang: Math.atan2(b.y - a.y, b.x - a.x) };
  };
  const metresPerPixel = () => (2 * Math.tan((camera.fov / 2) * DEG) * view.dist * userZoom) / sizeNow().h;
  const clampPan = () => {
    userPan.x = Math.max(-0.9 * S, Math.min(0.9 * S, userPan.x));
    userPan.y = Math.max(-0.9 * S, Math.min(0.9 * S, userPan.y));
  };
  // where the body's centre lands on screen (the middle of the free area), in page pixels
  const screenCentre = () => {
    const r = canvas.getBoundingClientRect();
    const { w, h } = sizeNow();
    return { x: r.left + insets.left + (w - insets.left - insets.right) / 2, y: r.top + insets.top + (h - insets.top - insets.bottom) / 2 };
  };
  /** zoom by f (below 1 = closer) keeping the point under (px, py) where it is */
  const zoomAbout = (f: number, px: number, py: number, into?: typeof glide) => {
    const z0 = into ? into.zoom : userZoom;
    const z1 = clampZoom(z0 * f);
    const k = 1 - z1 / z0;
    const c = screenCentre();
    const mpp = metresPerPixel() * (into ? z0 / userZoom : 1);
    if (into) {
      into.panX += (px - c.x) * mpp * k;
      into.panY -= (py - c.y) * mpp * k;
      into.zoom = z1;
    } else {
      userPan.x += (px - c.x) * mpp * k;
      userPan.y -= (py - c.y) * mpp * k;
      userZoom = z1;
      clampPan();
    }
  };
  const pick = (clientX: number, clientY: number) => {
    const r = canvas.getBoundingClientRect();
    ndc.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const targets = batches.filter((b) => b.mesh.visible && b.look === "solid" && b.alpha > 0.5).map((b) => b.mesh);
    const hit = ray.intersectObjects(targets, false)[0] as (THREE.Intersection & { batchId?: number }) | undefined;
    if (!hit || hit.batchId === undefined) return null;
    const b = batches.find((x) => x.mesh === hit.object);
    const p = b?.pieces.find((q) => q.inst === hit.batchId);
    if (!b || !p) return null;
    const rec = systems.get(b.system)?.parts.get(p.part);
    return { system: b.system, part: rec && rec.spec.label !== false ? rec.id : null };
  };
  const track = (key: "yaw" | "pitch" | "zoom" | "panX" | "panY", delta: number, dt: number) => {
    const inst = delta / Math.max(1 / 240, dt);
    const a = 1 - Math.exp(-dt / 0.045);
    vel[key] += (inst - vel[key]) * a;
  };
  const onDown = (e: PointerEvent) => {
    if (e.pointerType === "mouse" && e.button !== 0 && e.button !== 1 && e.button !== 2) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY, t0: e.timeStamp });
    glide.on = false;
    vel.yaw = vel.pitch = vel.zoom = vel.panX = vel.panY = 0;
    if (pointers.size === 1) {
      moved = false;
      // a second tap that lands soon after the first one, near it, makes a double tap
      second = performance.now() - lastTap < 300 && Math.hypot(e.clientX - lastTapX, e.clientY - lastTapY) < 40;
    }
    if (pointers.size === 2) {
      const t = two();
      pinch0 = t.d;
      zoom0 = userZoom;
      midX = t.mx;
      midY = t.my;
      angle0 = t.ang;
      twist = 0;
      twisting = false;
      twoDownT = e.timeStamp;
      twoMoved = false;
      moved = true;
    }
    lastMoveT = e.timeStamp;
    lastInput = performance.now();
    touched = true;
    stop();
  };
  const onMove = (e: PointerEvent) => {
    const p = pointers.get(e.pointerId);
    if (!p) return;
    const dx = e.clientX - p.x, dy = e.clientY - p.y;
    p.x = e.clientX;
    p.y = e.clientY;
    const dt = Math.max(1 / 240, (e.timeStamp - lastMoveT) / 1000);
    lastMoveT = e.timeStamp;
    if (Math.hypot(e.clientX - p.x0, e.clientY - p.y0) > 7) moved = true;
    if (pointers.size >= 2) {
      const t = two();
      if (Math.abs(t.d - pinch0) > 6 || Math.hypot(t.mx - midX, t.my - midY) > 6) twoMoved = true;
      // pinch: zoom about the point between the fingers
      if (pinch0 > 0) {
        const before = userZoom;
        const want = clampZoom((zoom0 * pinch0) / Math.max(1, t.d));
        zoomAbout(want / before, t.mx, t.my);
        track("zoom", Math.log(userZoom / before), dt);
      }
      // drag: move it with the fingers
      const mpp = metresPerPixel();
      const px = -(t.mx - midX) * mpp, py = (t.my - midY) * mpp;
      userPan.x += px;
      userPan.y += py;
      clampPan();
      track("panX", px, dt);
      track("panY", py, dt);
      midX = t.mx;
      midY = t.my;
      // twist: turn it, once the fingers have clearly rotated
      let da = t.ang - angle0;
      if (da > Math.PI) da -= 2 * Math.PI;
      if (da < -Math.PI) da += 2 * Math.PI;
      angle0 = t.ang;
      twist += da;
      if (!twisting && Math.abs(twist) > 8 * DEG) twisting = true;
      if (twisting) {
        userYaw -= da;
        track("yaw", -da, dt);
        twoMoved = true;
      }
    } else if (e.pointerType === "mouse" && (e.shiftKey || (e.buttons & 6) !== 0)) {
      const mpp = metresPerPixel();
      userPan.x -= dx * mpp;
      userPan.y += dy * mpp;
      clampPan();
      track("panX", -dx * mpp, dt);
      track("panY", dy * mpp, dt);
    } else {
      const { w } = sizeNow();
      const k = (Math.PI / Math.max(320, Math.min(w, 900))) * 1.2; // a full screen's drag is a bit more than half a turn
      const dYaw = -dx * k;
      const p0 = userPitch;
      userYaw += dYaw;
      userPitch = Math.max(pitchMin(), Math.min(pitchMax(), userPitch + dy * k * 0.75));
      track("yaw", dYaw, dt);
      track("pitch", userPitch - p0, dt);
    }
    lastInput = performance.now();
  };
  const onUp = (e: PointerEvent) => {
    const p = pointers.get(e.pointerId);
    if (!p) return;
    const wasTwo = pointers.size === 2;
    pointers.delete(e.pointerId);
    lastInput = performance.now();
    // a flick that was still moving keeps gliding; one that had stopped does not
    if (e.timeStamp - lastMoveT > 70) vel.yaw = vel.pitch = vel.zoom = vel.panX = vel.panY = 0;
    if (wasTwo) {
      pinch0 = 0;
      // a quick two-finger tap zooms back out
      if (!twoMoved && e.timeStamp - twoDownT < 300) {
        const c = screenCentre();
        easeView({});
        zoomAbout(1.9, c.x, c.y, glide);
      }
      const rest = [...pointers.values()][0];
      if (rest) {
        rest.x0 = rest.x;
        rest.y0 = rest.y;
      }
      return;
    }
    if (moved || pointers.size) return;
    // a tap
    const dbl = second;
    second = false;
    lastTap = dbl ? 0 : performance.now();
    lastTapX = e.clientX;
    lastTapY = e.clientY;
    if (dbl) {
      easeView({});
      zoomAbout(0.5, e.clientX, e.clientY, glide);
      return;
    }
    opts.onPick?.(pick(e.clientX, e.clientY));
  };
  const onWheel = (e: WheelEvent) => {
    // full screen, the wheel zooms; on the page it scrolls the page, except a trackpad pinch (ctrl + wheel)
    if (!immersive && !e.ctrlKey) return;
    e.preventDefault();
    glide.on = false;
    zoomAbout(Math.exp(e.deltaY * (e.ctrlKey ? 0.01 : 0.0015)), e.clientX, e.clientY);
    lastInput = performance.now();
    touched = true;
  };
  const onMenu = (e: Event) => e.preventDefault();
  canvas.addEventListener("pointerdown", onDown);
  window.addEventListener("pointermove", onMove);
  window.addEventListener("pointerup", onUp);
  window.addEventListener("pointercancel", onUp);
  canvas.addEventListener("wheel", onWheel, { passive: false });
  canvas.addEventListener("contextmenu", onMenu);
  const onLost = (e: Event) => {
    e.preventDefault();
    opts.onError?.();
  };
  canvas.addEventListener("webglcontextlost", onLost);

  const resetView = () => {
    vel.yaw = vel.pitch = vel.zoom = vel.panX = vel.panY = 0;
    // turn back by the shortest way
    const turns = Math.round(userYaw / (2 * Math.PI));
    userYaw -= turns * 2 * Math.PI;
    easeView({ yaw: 0, pitch: 0, zoom: 1, panX: 0, panY: 0 });
    frameNow();
  };

  // ------------------------------------------------------------------ sizing and visibility
  const size = () => {
    const { w, h } = sizeNow();
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    for (const d of drawnAll) {
      d.mat.resolution.set(w, h);
      if (d.dotMat) d.dotMat.size = 13 * renderer.getPixelRatio();
    }
    frameNow();
  };
  const ro = new ResizeObserver(size);
  ro.observe(canvas);
  let visible = true;
  const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { threshold: 0.01 });
  io.observe(canvas);
  let paused = false;

  // ------------------------------------------------------------------ the loop
  let raf = 0;
  let last = performance.now();
  const samples: number[] = [];
  let tuned = false;
  let lastExplodeSent = -1;
  const frame = (now: number) => {
    raf = requestAnimationFrame(frame);
    const raw = now - last;
    const dt = Math.min(0.05, raw / 1000);
    last = now;
    if (!visible || document.hidden || paused) return;
    if (!tuned) {
      samples.push(raw);
      if (samples.length >= 90) {
        tuned = true;
        const med = samples.sort((x, y) => x - y)[45];
        if (med > 26 && renderer.getPixelRatio() > 1) {
          renderer.setPixelRatio(1);
          size();
        }
      }
    }
    clock += dt;

    // the film-like play
    if (seq) {
      const t = clock - seq.t0;
      while (seq && seq.i < seq.steps.length && t >= seq.steps[seq.i].t) {
        const s = seq.steps[seq.i];
        seq.i++;
        s.run();
      }
    }

    // fades between systems: out first, then the new look in
    let anyFade = false;
    for (const b of batches) {
      if (b.look !== b.next) {
        b.alpha = Math.max(0, b.alpha - dt / 0.35);
        if (b.alpha <= 0) {
          b.look = b.next;
          setMaterial(b);
          offsetsDirty = true;
        }
        anyFade = true;
      } else {
        const to = b.look === "hidden" ? 0 : 1;
        if (b.alpha !== to) {
          b.alpha = to > b.alpha ? Math.min(1, b.alpha + dt / 0.7) : Math.max(0, b.alpha - dt / 0.35);
          anyFade = true;
          if (b.alpha <= 0 && b.look === "hidden") b.mesh.visible = false;
        }
      }
      if (b.look === "xray") {
        xrayOf(b).u.uAlpha.value = b.alpha * 0.9;
      } else {
        const base: number = b.solid.userData.base ?? 1;
        const a = b.alpha * base;
        b.solid.opacity = a;
        const tr = a < 0.999;
        if (b.solid.transparent !== tr) {
          b.solid.transparent = tr;
          b.solid.needsUpdate = true;
        }
        b.solid.depthWrite = base >= 1 && b.alpha > 0.5;
      }
    }
    const sysB = current ? systems.get(current)?.batches ?? [] : [];
    sysAlpha = current ? (sysB.length ? Math.min(...sysB.map((b) => (b.look === "solid" ? b.alpha : 0))) : 0) : 0;
    if (anyFade) colorsDirty = true;

    // coming apart, in slow motion
    const before = explode;
    explode += (explodeTo - explode) * damp(dt, explodeTau);
    if (Math.abs(explodeTo - explode) < 1e-4) explode = explodeTo;
    if (explode !== before) {
      offsetsDirty = true;
      if (!selected || isolated) frameNow();
    }
    if (opts.onExplode && Math.abs(explode - lastExplodeSent) > 0.002) {
      lastExplodeSent = explode;
      opts.onExplode(explode);
    }
    const ringTo = current === null ? 1 : !isolated && (current === "skeleton" || current === "muscles" || current === "cardio") ? 1 - explode : 0;
    ringA += (ringTo - ringA) * damp(dt, 0.25);
    ringMats[0].opacity = 0.28 * ringA;
    ringMats[1].opacity = 0.11 * ringA;
    ring.visible = ringA > 0.01;
    beatPh += (dt * 64) / 60;
    breathPh += (dt * 14) / 60;
    updateMatrices(offsetsDirty);
    offsetsDirty = false;

    // dimming everything but the picked part
    const sys = current ? systems.get(current) : null;
    if (sys) {
      for (const rec of sys.parts.values()) {
        if (rec.dim !== rec.dimTo) {
          rec.dim += (rec.dimTo - rec.dim) * damp(dt, 0.28);
          if (Math.abs(rec.dim - rec.dimTo) < 0.004) rec.dim = rec.dimTo;
          colorsDirty = true;
        }
      }
    }
    if (colorsDirty) {
      updateColors();
      colorsDirty = false;
    }
    // lines drawn over the body: shown in their own view, faded as it comes apart, dim when another part is picked
    for (const { sys: id, rec } of drawnParts) {
      const d = rec.drawn!;
      const to = drawnTarget(id, rec);
      d.alpha += (to - d.alpha) * damp(dt, 0.2);
      if (Math.abs(to - d.alpha) < 0.003) d.alpha = to;
      showDrawn(rec);
    }

    // the hand-made view: momentum after a flick, eased moves after a double tap or a button
    if (!pointers.size) {
      const fr = (k: number) => Math.exp(-dt * k);
      if (Math.abs(vel.yaw) > 1e-4 || Math.abs(vel.pitch) > 1e-4) {
        userYaw += vel.yaw * dt;
        userPitch = Math.max(pitchMin(), Math.min(pitchMax(), userPitch + vel.pitch * dt));
        vel.yaw *= fr(3.2);
        vel.pitch *= fr(4.5);
      }
      if (Math.abs(vel.panX) > 1e-5 || Math.abs(vel.panY) > 1e-5) {
        userPan.x += vel.panX * dt;
        userPan.y += vel.panY * dt;
        clampPan();
        vel.panX *= fr(5);
        vel.panY *= fr(5);
      }
      if (Math.abs(vel.zoom) > 1e-4) {
        userZoom = clampZoom(userZoom * Math.exp(vel.zoom * dt));
        vel.zoom *= fr(7);
      }
    }
    if (glide.on) {
      const g = damp(dt, 0.16);
      userYaw += (glide.yaw - userYaw) * g;
      userPitch += (glide.pitch - userPitch) * g;
      userZoom += (glide.zoom - userZoom) * g;
      userPan.x += (glide.panX - userPan.x) * g;
      userPan.y += (glide.panY - userPan.y) * g;
      if (Math.abs(glide.yaw - userYaw) + Math.abs(glide.pitch - userPitch) + Math.abs(glide.zoom - userZoom) + Math.abs(glide.panX - userPan.x) + Math.abs(glide.panY - userPan.y) < 1e-4)
        glide.on = false;
    }
    // camera: glide to its goal; the whole body turns slowly until someone touches it
    const k = damp(dt, tau);
    view.yaw += (goal.yaw - view.yaw) * k;
    view.pitch += (goal.pitch - view.pitch) * k;
    view.dist += (goal.dist - view.dist) * k;
    view.target.lerp(goal.target, k);
    if (!reduced && !touched && current === null) spin += dt * 0.12;
    applyCamera();
    renderer.render(scene, camera);
    updateLabels();
  };

  // ------------------------------------------------------------------ public
  const setSystem = async (id: SystemId | null) => {
    stop();
    const spec = id ? SYSTEMS3D.find((s) => s.id === id) : null;
    if (spec && !loaded.has(spec.file)) {
      opts.onLoading?.(true);
      try {
        await loadFile(spec.file);
      } finally {
        opts.onLoading?.(false);
      }
      if (disposed) return;
    }
    current = id;
    selected = null;
    explode = 0;
    explodeTo = 0;
    offsetsDirty = true;
    userZoom = 1;
    userPitch = 0;
    userYaw = 0;
    userPan.set(0, 0);
    vel.yaw = vel.pitch = vel.zoom = vel.panX = vel.panY = 0;
    glide.on = false;
    spin = 0;
    isolated = false;
    applyLooks();
    const sys = id ? systems.get(id) : null;
    if (sys) for (const rec of sys.parts.values()) rec.dim = rec.dimTo = 0;
    tau = 0.7;
    frameNow();
    // a system comes apart on its own once, in slow motion; then the slider is yours (a close-up view of a whole,
    // like the foot's arches, stays together until you pull it apart)
    if (sys && sys.spec.autoApart !== false) {
      startSeq([
        { t: reduced ? 0 : 0.5, run: () => { explodeTau = reduced ? 0.2 : 0.85; explodeTo = 1; } },
        { t: reduced ? 0.8 : 3.6, run: () => { seq = null; explodeTau = FOLLOW; tau = 0.55; } },
      ]);
    }
  };

  // first view: the whole body
  try {
    await loadFile("core");
  } catch (e) {
    renderer.dispose();
    throw e;
  }
  current = null;
  applyLooks(true);
  for (const b of batches) b.alpha = 0;
  size();
  view.yaw = goal.yaw + 30 * DEG;
  view.dist = goal.dist * 1.15;
  view.target.copy(goal.target);
  tau = 0.8;
  applyCamera();
  renderer.render(scene, camera);
  opts.onReady?.();
  raf = requestAnimationFrame(frame);

  const api: ExplorerApi = {
    setSystem,
    select: (id) => {
      stop();
      selectPart(id, id === null);
    },
    isolate: (on) => {
      const drawn = !!(selected && current && systems.get(current)?.parts.get(selected)?.drawn);
      setIsolated(on && !!selected && !drawn);
      easeToPart();
    },
    zoomBy: (f) => {
      const c = screenCentre();
      if (!glide.on) easeView({});
      zoomAbout(f, c.x, c.y, glide);
      touched = true;
    },
    setExplode: (v) => {
      if (seq) stop();
      explodeTau = FOLLOW;
      explodeTo = clamp01(v);
    },
    play,
    stop,
    setInsets: (i) => {
      Object.assign(insets, i);
      frameNow();
    },
    bindLabels,
    resetView,
    setPaused: (p) => {
      paused = p;
      last = performance.now();
    },
    snap: () => {
      while (seq && seq.i < seq.steps.length) seq.steps[seq.i++].run();
      seq = null;
      explode = explodeTo;
      offsetsDirty = true;
      for (const b of batches) {
        if (b.look !== b.next) {
          b.look = b.next;
          setMaterial(b);
        }
        b.alpha = b.look === "hidden" ? 0 : 1;
      }
      const sys = current ? systems.get(current) : null;
      if (sys) for (const rec of sys.parts.values()) rec.dim = rec.dimTo;
      sysAlpha = current ? 1 : 0;
      for (const { sys: id, rec } of drawnParts) {
        rec.drawn!.alpha = drawnTarget(id, rec);
        showDrawn(rec);
      }
      colorsDirty = true;
      updateMatrices(true);
      frameNow();
      view.yaw = goal.yaw;
      view.pitch = goal.pitch;
      view.dist = goal.dist;
      view.target.copy(goal.target);
    },
    dispose: () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      canvas.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      canvas.removeEventListener("wheel", onWheel);
      canvas.removeEventListener("contextmenu", onMenu);
      canvas.removeEventListener("webglcontextlost", onLost);
      for (const b of batches) {
        b.mesh.dispose();
        b.solid.dispose();
      }
      for (const x of xrays.values()) x.m.dispose();
      for (const d of drawnAll) {
        d.line.geometry.dispose();
        d.mat.dispose();
        d.dots?.geometry.dispose();
        d.dotMat?.dispose();
      }
      dotTex?.dispose();
      ringMats.forEach((m) => m.dispose());
      ring.children.forEach((l) => (l as THREE.Line).geometry.dispose());
      pmrem.dispose();
      renderer.dispose();
    },
  };
  (canvas as HTMLCanvasElement & { __explorer?: ExplorerApi }).__explorer = api;
  return api;
}

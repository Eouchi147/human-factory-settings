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
  anchorPiece: Piece;
  dim: number;
  dimTo: number;
};

type SysRec = {
  spec: SystemSpec;
  parts: Map<string, PartRec>;
  batches: Batch[];
  pieces: Piece[];
  box0: THREE.Box3; // together
  box1: THREE.Box3; // apart
  window: number; // how long each piece takes to move, as a share of the explode
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
const SURF: Record<string, { roughness: number; clearcoat?: number; clearcoatRoughness?: number; sheen?: number; sheenColor?: number; sheenRoughness?: number }> = {
  bone: { roughness: 0.56, clearcoat: 0.16, clearcoatRoughness: 0.5, sheen: 0.25, sheenColor: 0xfff1dc },
  cart: { roughness: 0.34, clearcoat: 0.55, clearcoatRoughness: 0.25, sheen: 0.3, sheenColor: 0xeaf6ff },
  muscle: { roughness: 0.48, clearcoat: 0.18, clearcoatRoughness: 0.4, sheen: 0.7, sheenColor: 0xff9f8f, sheenRoughness: 0.45 },
  organ: { roughness: 0.36, clearcoat: 0.45, clearcoatRoughness: 0.22, sheen: 0.4, sheenColor: 0xffd2c4 },
  vessel: { roughness: 0.3, clearcoat: 0.6, clearcoatRoughness: 0.18 },
  brain: { roughness: 0.5, clearcoat: 0.18, clearcoatRoughness: 0.4, sheen: 0.75, sheenColor: 0xffe6de, sheenRoughness: 0.5 },
};

// colours in the whole-body view, where the brain is shown as it looks, not colour-coded by lobe
const NATURAL: Record<string, string> = {
  "nervous/frontal": "#e2b6ac", "nervous/parietal": "#e2b6ac", "nervous/temporal": "#e2b6ac", "nervous/occipital": "#e2b6ac",
  "nervous/cerebellum": "#d9a79d", "nervous/brainstem": "#cf968c", "nervous/deep": "#cf968c", "nervous/white": "#ece2d6",
  "nervous/ventricles": "#cfe4ea",
};

function makeXray(tint: number) {
  const u = { uTint: { value: new THREE.Color(tint) }, uAlpha: { value: 1 } };
  const m = new THREE.MeshLambertMaterial({ color: 0x000000, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
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

  const xray = makeXray(0x9db6dc);
  const systems = new Map<SystemId, SysRec>();
  const batches: Batch[] = [];
  const loaded = new Set<string>();
  const loading = new Map<string, Promise<void>>();
  let disposed = false;

  // ------------------------------------------------------------------ loading
  const loadFile = (file: "core" | "muscles") => {
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
        const pool = paired ? mine.filter((p) => p.side === -1) : mine;
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
        parts.set(ps.id, { id: ps.id, spec: ps, pieces: mine, center: c, anchor, anchorPiece, dim: 0, dimTo: 0 });
      }
      plan(spec, parts, pieces);
      const box0 = new THREE.Box3(), box1 = new THREE.Box3();
      const tmp = new THREE.Box3();
      for (const p of pieces) {
        box0.union(p.box);
        tmp.copy(p.box).translate(p.full);
        box1.union(tmp);
      }
      const maxDelay = pieces.reduce((a, p) => Math.max(a, p.delay), 0);
      systems.set(spec.id, { spec, parts, batches: sysBatches, pieces, box0, box1, window: Math.max(0.42, 1 - maxDelay) });
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
      // pieces of a part start one after another, top first, so spines and gut loops open in a cascade
      const order = [...rec.pieces].sort((a, b) => b.center.y - a.center.y);
      order.forEach((p, k) => {
        const rank = order.length > 1 ? k / (order.length - 1) : 0;
        p.color.set(ps.tones?.[p.tone] ?? ps.color);
        p.natural.set(NATURAL[`${spec.id}/${ps.id}`] ?? (ps.tones?.[p.tone] ?? ps.color));
        if (spec.float) {
          const q = new THREE.Vector3();
          let best = Infinity, bestQ = new THREE.Vector3();
          for (const line of axes) {
            const d = nearestOnLine(p.center, line, q);
            if (d < best) {
              best = d;
              bestQ = q.clone();
            }
          }
          const dir = p.center.clone().sub(bestQ);
          if (dir.lengthSq() < 1e-8) dir.set(0, 0, 1);
          dir.normalize();
          p.full.copy(dir).multiplyScalar(spec.float * (ps.float ?? 1) * S);
          p.delay = clamp01(1 - p.center.y / top) * 0.4;
          return;
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
        p.delay = (ps.at ?? 0) + rank * 0.06;
      });
    }
    // anything without a legend part keeps its own colour
    for (const p of pieces) if (!parts.has(p.part)) p.color.copy(c.set("#9a9a9a"));
  };

  // ------------------------------------------------------------------ what is on screen
  let current: SystemId | null = null;
  let selected: string | null = null;
  const lookFor = (b: Batch): Look => {
    if (current === null) return WHOLE_BODY.includes(b.system) ? "solid" : "hidden";
    if (b.system === current) return "solid";
    const ctx = systems.get(current)?.spec.context ?? "none";
    if (b.system === "skeleton") return ctx === "xray" ? "xray" : ctx === "bones" ? "dim" : "hidden";
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
    // whole body: no duplicates, natural colours; one system: its legend colours
    for (const b of batches) for (const p of b.pieces) b.mesh.setVisibleAt(p.inst, !(current === null && p.dup));
    colorsDirty = true;
  };
  const setMaterial = (b: Batch) => {
    b.mesh.material = b.look === "xray" ? xray.m : b.solid;
    b.mesh.visible = b.look !== "hidden";
  };

  // ------------------------------------------------------------------ camera
  const insets: Insets = { top: 0, right: 0, bottom: 0, left: 0 };
  const view = { yaw: -18 * DEG, pitch: 4 * DEG, dist: 6, target: new THREE.Vector3(0, 0.95 * S, 0) };
  const goal = { yaw: view.yaw, pitch: view.pitch, dist: view.dist, target: view.target.clone() };
  let userYaw = 0, userPitch = 0, userZoom = 1;
  let tau = 1.1; // how slowly the camera settles (seconds)
  let sway = 0;
  const sizeNow = () => ({ w: canvas.clientWidth || 1, h: canvas.clientHeight || 1 });
  const fitBox = (box: THREE.Box3, yaw: number, pitch: number) => {
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
    return { dist: Math.max(0.35 * S, dist), target: center };
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
        // a part never fills the whole screen: keep some of the system around it
        const s = box.getSize(new THREE.Vector3());
        const m = Math.max(s.x, s.y, s.z);
        box.expandByVector(new THREE.Vector3(1, 1, 1).multiplyScalar(Math.max(0, 0.16 * S - m) / 2 + m * 0.18));
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
      box = new THREE.Box3(new THREE.Vector3(-0.34 * S, 0, -0.15 * S), new THREE.Vector3(0.34 * S, 1.73 * S, 0.15 * S));
    }
    const f = fitBox(box, yaw, pitch);
    goal.yaw = yaw;
    goal.pitch = pitch;
    goal.dist = f.dist;
    goal.target.copy(f.target);
  };
  const lerpBox = (a: THREE.Box3, b: THREE.Box3, t: number) =>
    new THREE.Box3(a.min.clone().lerp(b.min, t), a.max.clone().lerp(b.max, t));
  const applyCamera = () => {
    const { w, h } = sizeNow();
    const yaw = view.yaw + userYaw + sway;
    const pitch = Math.max(-25 * DEG, Math.min(50 * DEG, view.pitch + userPitch));
    const d = view.dist * userZoom;
    camera.position.set(
      view.target.x + Math.sin(yaw) * Math.cos(pitch) * d,
      view.target.y + Math.sin(pitch) * d,
      view.target.z + Math.cos(yaw) * Math.cos(pitch) * d,
    );
    camera.lookAt(view.target);
    // keep the body centred in the part of the screen the controls leave free
    const fx = insets.left + (w - insets.left - insets.right) / 2;
    const fy = insets.top + (h - insets.top - insets.bottom) / 2;
    camera.setViewOffset(w, h, w / 2 - fx, h / 2 - fy, w, h);
    camera.updateProjectionMatrix();
  };

  // ------------------------------------------------------------------ coming apart
  let explode = 0; // now
  let explodeTo = 0; // where it is heading
  let explodeTau = 0.55; // slow-motion lag behind the target (seconds)
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

  // ------------------------------------------------------------------ labels
  let labelsEl: HTMLElement | null = null;
  let labelNodes: { el: HTMLElement; part: string }[] = [];
  const bindLabels = (el: HTMLElement | null) => {
    labelsEl = el;
    labelNodes = el ? Array.from(el.querySelectorAll<HTMLElement>("[data-part]")).map((n) => ({ el: n, part: n.dataset.part! })) : [];
  };
  const v3 = new THREE.Vector3();
  const camDir = new THREE.Vector3();
  const updateLabels = () => {
    if (!labelsEl) return;
    const sys = current ? systems.get(current) : null;
    const { w, h } = sizeNow();
    camera.getWorldDirection(camDir);
    for (const n of labelNodes) {
      const rec = sys?.parts.get(n.part);
      if (!rec || !sys) {
        n.el.style.opacity = "0";
        continue;
      }
      v3.copy(rec.anchor).add(rec.anchorPiece.off).project(camera);
      const x = ((v3.x + 1) / 2) * w;
      const y = ((1 - v3.y) / 2) * h;
      // numbers on the far side of the body fade back
      const toward = rec.center.clone().add(rec.anchorPiece.off).sub(view.target).dot(camDir);
      const behind = toward > 0.03 * S;
      const shown = sysAlpha > 0.6 && v3.z < 1 && x > -40 && x < w + 40 && y > -40 && y < h + 40;
      n.el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      n.el.style.opacity = shown ? (behind ? "0.32" : "1") : "0";
      n.el.dataset.behind = behind ? "1" : "0";
    }
  };
  let sysAlpha = 0;

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
    explodeTau = 0.55;
    tau = 1.1;
    opts.onPlaying?.(false);
    opts.onTour?.(null);
  };
  const play = () => {
    const sys = current ? systems.get(current) : null;
    if (!sys) return;
    stop();
    const order = sys.spec.parts.filter((p) => p.label !== false && sys.parts.has(p.id)).map((p) => p.id);
    const steps: Step[] = [];
    let t = 0;
    if (explode > 0.08) {
      steps.push({ t, run: () => { explodeTau = 0.5; explodeTo = 0; selectPart(null); frameNow(); } });
      t += reduced ? 0.4 : 1.8;
    }
    steps.push({ t, run: () => { explodeTau = reduced ? 0.3 : 1.25; explodeTo = 1; selectPart(null); tau = 1.6; } });
    t += reduced ? 1.2 : 5.6;
    for (const id of order) {
      steps.push({ t, run: () => { tau = reduced ? 0.25 : 1.35; selectPart(id); opts.onTour?.(id); } });
      t += reduced ? 2.6 : 3.8;
    }
    steps.push({ t, run: () => { selectPart(null); opts.onTour?.(null); tau = 1.4; } });
    steps.push({ t: t + 1.6, run: () => { seq = null; tau = 1.1; explodeTau = 0.55; opts.onPlaying?.(false); } });
    startSeq(steps);
    opts.onPlaying?.(true);
  };

  // ------------------------------------------------------------------ selection
  const selectPart = (id: string | null) => {
    const sys = current ? systems.get(current) : null;
    selected = sys && id && sys.parts.has(id) ? id : null;
    if (sys) for (const rec of sys.parts.values()) rec.dimTo = selected && rec.id !== selected ? 1 : 0;
    frameNow();
  };

  // ------------------------------------------------------------------ input
  const pointers = new Map<number, { x: number; y: number }>();
  let downX = 0, downY = 0, moved = false, lastTap = 0, pinch0 = 0, zoom0 = 1;
  let lastInput = -1e9;
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const immersive = !!opts.immersive;
  const onDown = (e: PointerEvent) => {
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 1) {
      downX = e.clientX;
      downY = e.clientY;
      moved = false;
    } else if (pointers.size === 2 && immersive) {
      const [a, b] = [...pointers.values()];
      pinch0 = Math.hypot(a.x - b.x, a.y - b.y);
      zoom0 = userZoom;
      moved = true;
    }
    lastInput = performance.now();
    stop();
  };
  const onMove = (e: PointerEvent) => {
    const p = pointers.get(e.pointerId);
    if (!p) return;
    const dx = e.clientX - p.x, dy = e.clientY - p.y;
    p.x = e.clientX;
    p.y = e.clientY;
    if (Math.abs(e.clientX - downX) > 6 || Math.abs(e.clientY - downY) > 6) moved = true;
    if (pointers.size === 2 && immersive) {
      const [a, b] = [...pointers.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinch0 > 0) userZoom = Math.max(0.45, Math.min(1.8, (zoom0 * pinch0) / Math.max(1, d)));
    } else if (pointers.size === 1) {
      const { w } = sizeNow();
      userYaw -= (dx / Math.max(320, w)) * Math.PI * 1.6;
      if (immersive || e.pointerType === "mouse") userPitch = Math.max(-30 * DEG, Math.min(45 * DEG, userPitch + (dy / 500) * Math.PI * 0.6));
    }
    lastInput = performance.now();
  };
  const onUp = (e: PointerEvent) => {
    if (!pointers.has(e.pointerId)) return;
    pointers.delete(e.pointerId);
    lastInput = performance.now();
    if (moved || pointers.size) return;
    const now = performance.now();
    if (now - lastTap < 320) {
      resetView();
      lastTap = 0;
      return;
    }
    lastTap = now;
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const targets = batches.filter((b) => b.mesh.visible && b.look === "solid" && b.alpha > 0.5).map((b) => b.mesh);
    const hits = ray.intersectObjects(targets, false);
    const hit = hits[0] as (THREE.Intersection & { batchId?: number }) | undefined;
    if (!hit || hit.batchId === undefined) {
      opts.onPick?.(null);
      return;
    }
    const b = batches.find((x) => x.mesh === hit.object);
    const p = b?.pieces.find((q) => q.inst === hit.batchId);
    if (!b || !p) return opts.onPick?.(null);
    const sys = systems.get(b.system);
    const rec = sys?.parts.get(p.part);
    opts.onPick?.({ system: b.system, part: rec && rec.spec.label !== false ? rec.id : null });
  };
  const onWheel = (e: WheelEvent) => {
    if (!immersive) return;
    e.preventDefault();
    userZoom = Math.max(0.45, Math.min(1.8, userZoom * Math.exp(e.deltaY * 0.0012)));
    lastInput = performance.now();
  };
  canvas.addEventListener("pointerdown", onDown);
  window.addEventListener("pointermove", onMove);
  window.addEventListener("pointerup", onUp);
  window.addEventListener("pointercancel", onUp);
  canvas.addEventListener("wheel", onWheel, { passive: false });
  const onLost = (e: Event) => {
    e.preventDefault();
    opts.onError?.();
  };
  canvas.addEventListener("webglcontextlost", onLost);

  const resetView = () => {
    userYaw = 0;
    userPitch = 0;
    userZoom = 1;
    frameNow();
  };

  // ------------------------------------------------------------------ sizing and visibility
  const size = () => {
    const { w, h } = sizeNow();
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
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
        if (med > 40 && renderer.getPixelRatio() > 1) {
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
        xray.u.uAlpha.value = b.alpha * 0.9;
      } else {
        const a = b.alpha;
        b.solid.opacity = a;
        const tr = a < 0.999;
        if (b.solid.transparent !== tr) {
          b.solid.transparent = tr;
          b.solid.needsUpdate = true;
        }
        b.solid.depthWrite = a > 0.5;
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
      if (!selected) frameNow();
    }
    if (opts.onExplode && Math.abs(explode - lastExplodeSent) > 0.002) {
      lastExplodeSent = explode;
      opts.onExplode(explode);
    }
    const ringTo = current === null ? 1 : current === "skeleton" || current === "muscles" || current === "cardio" ? 1 - explode : 0;
    ringMats[0].opacity = 0.28 * ringTo;
    ringMats[1].opacity = 0.11 * ringTo;
    ring.visible = ringTo > 0.01;
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

    // camera: glide, plus a slow sway when nobody is touching it
    const idle = performance.now() - lastInput > 5000;
    const k = damp(dt, tau);
    view.yaw += (goal.yaw - view.yaw) * k;
    view.pitch += (goal.pitch - view.pitch) * k;
    view.dist += (goal.dist - view.dist) * k;
    view.target.lerp(goal.target, k);
    if (!reduced && idle && !pointers.size) {
      if (current === null) sway += dt * 0.12;
      else sway += (Math.sin(clock * ((2 * Math.PI) / 22)) * 10 * DEG - sway) * damp(dt, 2.5);
    }
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
    sway = 0;
    applyLooks();
    const sys = id ? systems.get(id) : null;
    if (sys) for (const rec of sys.parts.values()) rec.dim = rec.dimTo = 0;
    tau = 1.25;
    frameNow();
    // a system opens on its own, slowly; the slider takes over from there
    if (sys) {
      startSeq([
        { t: reduced ? 0 : 1.1, run: () => { explodeTau = reduced ? 0.25 : 1.15; explodeTo = 1; } },
        { t: reduced ? 1 : 5.4, run: () => { seq = null; explodeTau = 0.55; } },
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
  view.yaw = goal.yaw + 40 * DEG;
  view.dist = goal.dist * 1.25;
  view.target.copy(goal.target);
  tau = 1.6;
  applyCamera();
  renderer.render(scene, camera);
  opts.onReady?.();
  raf = requestAnimationFrame(frame);

  const api: ExplorerApi = {
    setSystem,
    select: (id) => {
      stop();
      selectPart(id);
    },
    setExplode: (v) => {
      if (seq) stop();
      explodeTau = 0.55;
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
      colorsDirty = true;
      updateMatrices(true);
      frameNow();
      view.yaw = goal.yaw;
      view.pitch = goal.pitch;
      view.dist = goal.dist;
      view.target.copy(goal.target);
      sway = 0;
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
      canvas.removeEventListener("webglcontextlost", onLost);
      for (const b of batches) {
        b.mesh.dispose();
        b.solid.dispose();
      }
      xray.m.dispose();
      ringMats.forEach((m) => m.dispose());
      ring.children.forEach((l) => (l as THREE.Line).geometry.dispose());
      pmrem.dispose();
      renderer.dispose();
    },
  };
  (canvas as HTMLCanvasElement & { __explorer?: ExplorerApi }).__explorer = api;
  return api;
}

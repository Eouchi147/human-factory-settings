// Simplify, quantise and compress the moving body for the browser (meshoptimizer), keeping each vertex's joints,
// weights, fibre direction and tendon factor through the simplification.
// in : <dir>/motion.raw.bin + motion.parts.json + rig.json   (from build_motion.py)
// out: <dest>/bones.{bin,json}, <dest>/muscles.{bin,json}, <dest>/rig.json
// Per vertex: position (uint16 x4, 14-bit grid over the file) and a 16-byte stream: joints (4 x uint8), weights
// (4 x uint8, summing to 255), fibre direction (3 x int8) + tendon (uint8), part index (uint16) + 2 spare bytes.
// Indices are 32-bit (each file is one merged mesh). Normals are rebuilt in the browser.
import fs from "node:fs";
import path from "node:path";
import { MeshoptEncoder as E, MeshoptSimplifier as M } from "meshoptimizer";

const [, , dir, dest] = process.argv;
const BITS = 14, QMAX = 2 ** BITS - 1;
await Promise.all([E.ready, M.ready]);
const ERR = { bones: 0.00022, cartilage: 0.00025, tooth: 0.0002, muscles: 0.00035, other: 0.0008 };

const meta = JSON.parse(fs.readFileSync(path.join(dir, "motion.parts.json"), "utf8")).parts;
const raw = fs.readFileSync(path.join(dir, "motion.raw.bin"));
const buf = raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength);
let off = 0;
const take = (Ctor, n) => { const a = new Ctor(buf, off, n).slice(); off += n * Ctor.BYTES_PER_ELEMENT; return a; };
const parts = meta.map((m) => {
  const V = take(Float32Array, m.v * 3), I = take(Uint32Array, m.i), Jt = take(Uint8Array, m.v * 4), W = take(Float32Array, m.v * 4);
  const D = take(Float32Array, m.v * 3), T = take(Float32Array, m.v);
  return { ...m, V, I, J: Jt, W, D, T };
});
if (off !== raw.byteLength) throw new Error(`size mismatch ${off} ${raw.byteLength}`);

let trisIn = 0, trisOut = 0;
for (const p of parts) {
  trisIn += p.i / 3;
  // hand-built sheets are smooth, so a plain error bound would leave them a few large triangles that bend badly: keep them fine
  const err = p.file === "bones" ? ERR[p.tissue === "bone" ? "bones" : p.tissue] : p.cluster === "other" ? ERR.other : p.cluster === "handmade" ? 0.00012 : ERR.muscles;
  let [S] = M.simplify(p.I, p.V, 3, 0, err, ["ErrorAbsolute"]);
  if (p.file === "muscles" && p.cluster === "other" && S.length > 0.55 * p.I.length) {   // loose-triangle muscles: allow a little more error
    const target = Math.max(36, Math.floor((p.I.length * 0.45) / 3) * 3);
    const [L] = M.simplify(p.I, p.V, 3, target, 0.002, ["ErrorAbsolute"]);
    if (L.length >= 36) S = L;
  }
  const I = S.length >= 36 ? S : p.I.slice();
  const [map, n] = M.compactMesh(I);
  const V = new Float32Array(n * 3), Jn = new Uint8Array(n * 4), Wn = new Float32Array(n * 4), Dn = new Float32Array(n * 3), Tn = new Float32Array(n);
  for (let o = 0; o < map.length; o++) {
    const k = map[o]; if (k === 0xffffffff) continue;
    V.set(p.V.subarray(o * 3, o * 3 + 3), k * 3); Jn.set(p.J.subarray(o * 4, o * 4 + 4), k * 4); Wn.set(p.W.subarray(o * 4, o * 4 + 4), k * 4);
    Dn.set(p.D.subarray(o * 3, o * 3 + 3), k * 3); Tn[k] = p.T[o];
  }
  // vertex cache and fetch order (better drawing and better compression)
  const [remap, unique] = E.reorderMesh(I, true, false);
  const re = (src, w, Ctor) => { const o = new Ctor(unique * w); for (let i = 0; i < n; i++) { const j = remap[i]; if (j !== 0xffffffff) for (let k = 0; k < w; k++) o[j * w + k] = src[i * w + k]; } return o; };
  Object.assign(p, { V: re(V, 3, Float32Array), J: re(Jn, 4, Uint8Array), W: re(Wn, 4, Float32Array), D: re(Dn, 3, Float32Array), T: re(Tn, 1, Float32Array), I, v: unique, i: I.length });
  trisOut += p.i / 3;
}
console.log("triangles", trisIn, "->", trisOut);

function write(file) {
  const ps = parts.filter((p) => p.file === file);
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  for (const p of ps) for (let i = 0; i < p.V.length; i += 3) for (let k = 0; k < 3; k++) { min[k] = Math.min(min[k], p.V[i + k]); max[k] = Math.max(max[k], p.V[i + k]); }
  const span = max.map((x, k) => x - min[k]);
  const nv = ps.reduce((a, p) => a + p.v, 0), ni = ps.reduce((a, p) => a + p.i, 0);
  const pos = new Uint16Array(nv * 4), attr = new Uint8Array(nv * 16), idx = new Uint32Array(ni);
  const table = [];
  let v0 = 0, i0 = 0;
  ps.forEach((p, pi) => {
    for (let i = 0; i < p.v; i++) {
      const g = v0 + i;
      for (let k = 0; k < 3; k++) pos[g * 4 + k] = Math.round(((p.V[i * 3 + k] - min[k]) / span[k]) * QMAX);
      // weights to bytes that sum to 255
      const w = [0, 1, 2, 3].map((k) => Math.max(0, p.W[i * 4 + k])), s = w.reduce((a, b) => a + b, 0) || 1;
      const q = w.map((x) => Math.round((x / s) * 255)); q[0] += 255 - q.reduce((a, b) => a + b, 0);
      for (let k = 0; k < 4; k++) { attr[g * 16 + k] = p.J[i * 4 + k]; attr[g * 16 + 4 + k] = Math.max(0, Math.min(255, q[k])); }
      for (let k = 0; k < 3; k++) attr[g * 16 + 8 + k] = (Math.round(Math.max(-1, Math.min(1, p.D[i * 3 + k])) * 127) + 256) & 255;
      attr[g * 16 + 11] = Math.round(Math.max(0, Math.min(1, p.T[i])) * 255);
      attr[g * 16 + 12] = pi & 255; attr[g * 16 + 13] = pi >> 8;
    }
    for (let k = 0; k < p.i; k++) idx[i0 + k] = p.I[k] + v0;
    table.push([p.name, p.tissue, p.cluster, p.side, v0, p.v, i0, p.i]);
    v0 += p.v; i0 += p.i;
  });
  const posE = E.encodeVertexBuffer(new Uint8Array(pos.buffer), nv, 8);
  const attrE = E.encodeVertexBuffer(attr, nv, 16);
  const idxE = E.encodeIndexBuffer(new Uint8Array(idx.buffer), ni, 4);
  const pad = (n) => (4 - (n % 4)) % 4;
  const chunks = [posE, new Uint8Array(pad(posE.length)), attrE, new Uint8Array(pad(attrE.length)), idxE];
  const bin = new Uint8Array(chunks.reduce((a, c) => a + c.length, 0)); let at = 0; for (const c of chunks) { bin.set(c, at); at += c.length; }
  const s0 = 0, s1 = posE.length + pad(posE.length), s2 = s1 + attrE.length + pad(attrE.length);
  const manifest = {
    v: 1, source: "BodyParts3D 4.0, (c) The Database Center for Life Science, CC BY 4.0. Rigged, skinned and simplified for the web by Human Factory Settings.",
    units: "metres, y up, x toward the body's left, z toward the front; reference body 1.73 m",
    q: { bits: BITS, min: min.map((x) => +x.toFixed(6)), span: span.map((x) => +x.toFixed(6)) },
    vertices: nv, indices: ni, streams: { pos: [s0, posE.length], attr: [s1, attrE.length], idx: [s2, idxE.length] },
    parts: table,
  };
  fs.mkdirSync(dest, { recursive: true });
  fs.writeFileSync(path.join(dest, `${file}.bin`), bin);
  fs.writeFileSync(path.join(dest, `${file}.json`), JSON.stringify(manifest));
  console.log(file, "parts", ps.length, "vertices", nv, "triangles", ni / 3, "bin", bin.length);
}
write("bones");
write("muscles");
fs.copyFileSync(path.join(dir, "rig.json"), path.join(dest, "rig.json"));

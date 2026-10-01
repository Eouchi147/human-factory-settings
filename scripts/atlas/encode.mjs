// Quantise and compress the explorer model with meshoptimizer (vertex codec v0, which three's decoder reads).
// in : out/<file>.raw.bin + out/<file>.pieces.json   (from build_atlas.py)
// out: <dest>/<file>.bin + <dest>/<file>.json
import fs from "node:fs";
import path from "node:path";
import { MeshoptEncoder as E } from "meshoptimizer";

const [, , file, dest, bitsArg] = process.argv;
const BITS = Number(bitsArg || 14);
const QMAX = 2 ** BITS - 1;
await E.ready;
const rows = JSON.parse(fs.readFileSync(`out/${file}.pieces.json`, "utf8"));
const raw = fs.readFileSync(`out/${file}.raw.bin`);
const buf = raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength);

// read pieces back
let off = 0;
const pieces = rows.map((r) => {
  const V = new Float32Array(buf, off, r.v * 3).slice();
  off += r.v * 12;
  const N = new Float32Array(buf, off, r.v * 3).slice();
  off += r.v * 12;
  const I = new Uint32Array(buf, off, r.i).slice();
  off += r.i * 4;
  return { ...r, V, N, I };
});
if (off !== raw.byteLength) throw new Error("size mismatch");

// one quantisation grid for the whole file: 16 bits per axis
const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
for (const p of pieces) for (let i = 0; i < p.V.length; i += 3) for (let k = 0; k < 3; k++) {
  min[k] = Math.min(min[k], p.V[i + k]);
  max[k] = Math.max(max[k], p.V[i + k]);
}
const span = max.map((x, k) => x - min[k]);

const lists = { systems: [], clusters: [], materials: [], tones: [] };
const idx = (list, v) => {
  let i = lists[list].indexOf(v);
  if (i < 0) {
    lists[list].push(v);
    i = lists[list].length - 1;
  }
  return i;
};

let total = 0;
const posChunks = [], nrmChunks = [], idxChunks = [];
const out = [];
let idxOff = 0;
for (const p of pieces) {
  // vertex cache and fetch order: better rendering and better compression
  const [remap, unique] = E.reorderMesh(p.I, true, false);
  const n = unique;
  const pos = new Uint16Array(n * 4);
  for (let i = 0; i < p.v; i++) {
    const j = remap[i];
    if (j === 0xffffffff) continue;
    for (let k = 0; k < 3; k++) {
      pos[j * 4 + k] = Math.round(((p.V[i * 3 + k] - min[k]) / span[k]) * QMAX);
    }
  }
  const I16 = new Uint16Array(p.I.length);
  for (let i = 0; i < p.I.length; i++) I16[i] = p.I[i]; // reorderMesh rewrote p.I in place
  const ie = E.encodeIndexBuffer(new Uint8Array(I16.buffer), I16.length, 2);
  posChunks.push(new Uint8Array(pos.buffer));
  idxChunks.push(ie);
  out.push([idx("systems", p.system), idx("clusters", `${p.system}/${p.cluster}`), idx("materials", p.material), idx("tones", p.tone), p.side, n, p.I.length, idxOff, ie.length]);
  idxOff += ie.length;
  total += n;
}
const cat = (arr) => {
  const len = arr.reduce((a, b) => a + b.length, 0);
  const o = new Uint8Array(len);
  let at = 0;
  for (const a of arr) {
    o.set(a, at);
    at += a.length;
  }
  return o;
};
const posE = E.encodeVertexBufferLevel(cat(posChunks), total, 8, 2, 0);
const idxE = cat(idxChunks);
const pad4 = (n) => (4 - (n % 4)) % 4;
const parts = [posE, new Uint8Array(pad4(posE.length)), idxE];
const bin = cat(parts);
const posOff = 0, idxBase = posE.length + pad4(posE.length);

const manifest = {
  v: 1,
  source: "BodyParts3D 4.0, (c) The Database Center for Life Science, CC BY 4.0. Simplified for the web by Human Factory Settings.",
  units: "metres, y up, x towards the body's left, z towards the front; reference body 1.73 m",
  q: { bits: BITS, min: min.map((x) => +x.toFixed(6)), span: span.map((x) => +x.toFixed(6)) },
  vertices: total,
  streams: { pos: [posOff, posE.length], idx: [idxBase, idxE.length] },
  ...lists,
  pieces: out,
};
fs.mkdirSync(dest, { recursive: true });
fs.writeFileSync(path.join(dest, `${file}.bin`), bin);
fs.writeFileSync(path.join(dest, `${file}.json`), JSON.stringify(manifest));
console.log(file, "vertices", total, "bin", bin.length, "json", JSON.stringify(manifest).length);

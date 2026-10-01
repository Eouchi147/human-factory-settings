// Simplify, quantise and compress the explorer model with meshoptimizer.
// in : out/<file>.raw.bin + out/<file>.pieces.json   (from build_atlas.py, run with ATLAS_RAW=1)
// out: <dest>/<file>.bin + <dest>/<file>.json
// Simplification stops at a fixed error in metres, not at a fixed share of triangles, so a small part like the
// eye keeps as much detail as it needs up close and a big one like the arteries is not crushed.
// Vertex codec v0, which three's MeshoptDecoder reads. Normals are rebuilt in the browser.
import fs from "node:fs";
import path from "node:path";
import { MeshoptEncoder as E, MeshoptSimplifier as M } from "meshoptimizer";

const [, , file, dest, bitsArg] = process.argv;
const BITS = Number(bitsArg || 13);
const QMAX = 2 ** BITS - 1;
await Promise.all([E.ready, M.ready]);

// how far (metres, reference body) a simplified surface may stray from the original
const ERR = {
  default: 0.0005,
  "skeleton": 0.0005,
  "skeleton/spine": 0.0007,
  "skeleton/skull": 0.0006,
  "muscles": 0.0008,
  "muscles/other": 0.0013,
  "nervous": 0.00035,
  "nervous/eyes": 0.00018,
  "nervous/facenerves": 0.00018,
  "nervous/white": 0.0006,
  "nervous/deep": 0.00045,
  "cardio": 0.0003,
  "cardio/arteries": 0.00085,
  "cardio/veins": 0.00085,
  "breathing": 0.0003,
  "breathing/voicebox": 0.0003,
  "breathing/nose": 0.00025,
  "breathing/throat": 0.0005,
  "breathing/diaphragm": 0.0006,
  "digestion": 0.00035,
  "digestion/largegut": 0.0005,
  "digestion/gallbladder": 0.00025,
  "digestion/mouth": 0.00025,
  "urinary": 0.00025,
  "endocrine": 0.00015,
  "immune": 0.0002,
  "reproM": 0.00015,
  "reproF": 0.00015,
  "reproF/breasts": 0.0003,
  "reproF/ligaments": 0.00025,
  "pelvisF": 0.0008,
  "feet": 0.00022,
  "feet/sole": 0.0003,
  "feet/slings": 0.0005,
  "feet/shin": 0.0008,
  "posture": 0.0005,
  "mouth": 0.0002,
  "mouth/lips": 0.0003,
  "mouth/throat": 0.0003,
  "fascia": 0.0006,
  "fascia/sleeve": 0.0009,
  "fascia/itband": 0.0005,
};
const errOf = (s, c) => ERR[`${s}/${c}`] ?? ERR[s] ?? ERR.default;

const rows = JSON.parse(fs.readFileSync(`out/${file}.pieces.json`, "utf8"));
const raw = fs.readFileSync(`out/${file}.raw.bin`);
const buf = raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength);

let off = 0;
const pieces = rows.map((r) => {
  const V = new Float32Array(buf, off, r.v * 3).slice();
  off += r.v * 12;
  off += r.v * 12; // normals from the raw file are not used
  const I = new Uint32Array(buf, off, r.i).slice();
  off += r.i * 4;
  return { ...r, V, I };
});
if (off !== raw.byteLength) throw new Error("size mismatch");

const report = {};
let trisIn = 0, trisOut = 0;
for (const p of pieces) {
  // weld vertices that sit at the same place (the source splits them along seams), so edges can collapse
  const remap = M.generatePositionRemap(p.V, 3);
  let I = new Uint32Array(p.I.length);
  for (let i = 0; i < I.length; i++) I[i] = remap[p.I[i]];
  trisIn += I.length / 3;
  let [S] = M.simplify(I, p.V, 3, 0, errOf(p.system, p.cluster), ["ErrorAbsolute"]);
  // the unnamed muscles arrive as loose triangles the careful simplifier cannot join; thin them regardless
  if (p.system === "muscles" && p.cluster === "other" && S.length > 0.5 * I.length) {
    const target = Math.max(36, Math.floor((I.length * 0.45) / 3) * 3);
    const [L] = M.simplifySloppy(I, p.V, 3, null, target, 0.02); // error relative to the piece size
    if (L.length >= 36) S = L;
  }
  if (S.length >= 36) I = S;
  // keep only the vertices still used (compactMesh renumbers the indices in place and returns old -> new)
  const I2 = I.slice();
  const [map, n] = M.compactMesh(I2);
  const V2 = new Float32Array(n * 3);
  for (let old = 0; old < map.length; old++) {
    const nw = map[old];
    if (nw === 0xffffffff) continue;
    V2[nw * 3] = p.V[old * 3];
    V2[nw * 3 + 1] = p.V[old * 3 + 1];
    V2[nw * 3 + 2] = p.V[old * 3 + 2];
  }
  if (n > 65535) throw new Error(`piece too big for 16-bit indices: ${p.name} ${n}`);
  p.V = V2;
  p.I = I2;
  p.v = n;
  p.i = I2.length;
  trisOut += p.i / 3;
  const k = `${p.system}/${p.cluster}`;
  report[k] = (report[k] ?? 0) + p.i / 3;
}

// one quantisation grid for the whole file
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
const posChunks = [], idxChunks = [];
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
    for (let k = 0; k < 3; k++) pos[j * 4 + k] = Math.round(((p.V[i * 3 + k] - min[k]) / span[k]) * QMAX);
  }
  const I16 = new Uint16Array(p.I.length);
  for (let i = 0; i < p.I.length; i++) I16[i] = p.I[i];
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
const bin = cat([posE, new Uint8Array(pad4(posE.length)), idxE]);
const idxBase = posE.length + pad4(posE.length);

const manifest = {
  v: 2,
  source: file === "female"
    ? "Human Reference Atlas, 3D Reference Organ Set for Female v1.5, Kristen Browne and Heidi Schlehlein (HuBMAP), CC BY 4.0, https://doi.org/10.48539/HBM352.BTSQ.586. Simplified for the web by Human Factory Settings."
    : file === "focus"
      ? "BodyParts3D 4.0, (c) The Database Center for Life Science, CC BY 4.0. Simplified for the web by Human Factory Settings, who also drew in the two shapes marked (drawn): the plantar fascia and the thigh's fascia sleeve, which BodyParts3D does not have."
      : "BodyParts3D 4.0, (c) The Database Center for Life Science, CC BY 4.0. Simplified for the web by Human Factory Settings.",
  units: file === "female"
    ? "metres, y up, x towards the body's left, z towards the front; her own size divided by 1.83 / 1.73, which the explorer multiplies back"
    : "metres, y up, x towards the body's left, z towards the front; reference body 1.73 m",
  q: { bits: BITS, min: min.map((x) => +x.toFixed(6)), span: span.map((x) => +x.toFixed(6)) },
  vertices: total,
  streams: { pos: [0, posE.length], idx: [idxBase, idxE.length] },
  ...lists,
  pieces: out,
};
fs.mkdirSync(dest, { recursive: true });
fs.writeFileSync(path.join(dest, `${file}.bin`), bin);
fs.writeFileSync(path.join(dest, `${file}.json`), JSON.stringify(manifest));
console.log(file, "triangles", trisIn, "->", trisOut, "vertices", total, "bin", bin.length);
console.log(JSON.stringify(Object.fromEntries(Object.entries(report).map(([k, v]) => [k, Math.round(v)]))));

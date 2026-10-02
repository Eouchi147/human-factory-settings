// Human Factory Settings · soft parts: tissue that bends with the skeleton rig (muscle that spans a joint, a layer of fat),
// built in the standing frame (metres, feet at y = 0, +z = front) and skinned to the rig's groups every frame.
import { THREE, lerp, clamp01, ss, hash } from './kit.js';

const _m = new THREE.Matrix4(), _a = new THREE.Vector3(), _b = new THREE.Vector3(), _na = new THREE.Vector3(), _nb = new THREE.Vector3();

// geo: positions and normals in the standing frame. bind(p, n) -> [groupA, groupB, w] (w = how much of B).
// Returns the mesh (in world space, identity transform) and update(), to call after the rig has posed (matrixWorld current).
// morph: optional second shape (same vertices), blended in by update(k) before skinning (k = 0: geo, 1: morph)
export function skinned(geo, bind, rig, material, { morph = null } = {}) {
  const pos = geo.attributes.position, nor = geo.attributes.normal, n = pos.count;
  const mp = morph && morph.attributes.position, d = morph ? new Float32Array(n * 3) : null;
  const mn = morph && morph.attributes.normal, dn = mn && nor ? new Float32Array(n * 3) : null;
  if (mp) for (let i = 0; i < n * 3; i++) d[i] = mp.array[i] - pos.array[i];
  if (dn) for (let i = 0; i < n * 3; i++) dn[i] = mn.array[i] - nor.array[i];
  const groups = [], gi = new Map(), A = new Uint16Array(n), B = new Uint16Array(n), Wt = new Float32Array(n);
  const la = new Float32Array(n * 3), lb = new Float32Array(n * 3), rn = new Float32Array(n * 3);
  const idx = (g) => { if (!gi.has(g)) { gi.set(g, groups.length); groups.push(g); } return gi.get(g); };
  const p = new THREE.Vector3(), q = new THREE.Vector3();
  for (let i = 0; i < n; i++) {
    p.fromBufferAttribute(pos, i); if (nor) q.fromBufferAttribute(nor, i);
    const [ga, gb, w] = bind(p, q);
    A[i] = idx(ga); B[i] = idx(gb); Wt[i] = w;
    const pa = rig.pivots.get(ga), pb = rig.pivots.get(gb);
    la[i * 3] = p.x - pa.x; la[i * 3 + 1] = p.y - pa.y; la[i * 3 + 2] = p.z - pa.z;
    lb[i * 3] = p.x - pb.x; lb[i * 3 + 1] = p.y - pb.y; lb[i * 3 + 2] = p.z - pb.z;
    rn[i * 3] = q.x; rn[i * 3 + 1] = q.y; rn[i * 3 + 2] = q.z;
  }
  const out = geo.clone();
  out.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
  out.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
  out.setAttribute('rest', new THREE.BufferAttribute(new Float32Array(pos.array), 3));   // the standing-frame position, for shaders
  const mesh = new THREE.Mesh(out, material); mesh.frustumCulled = false;
  const M = groups.map(() => new Float32Array(16));
  function update(mk = 0) {
    groups.forEach((g, k) => M[k].set(g.matrixWorld.elements));
    const P = out.attributes.position.array, N = out.attributes.normal.array, R = out.attributes.rest.array;
    for (let i = 0; i < n; i++) {
      const a = M[A[i]], b = M[B[i]], w = Wt[i], j = i * 3;
      let x = la[j], y = la[j + 1], z = la[j + 2], u = lb[j], v = lb[j + 1], s = lb[j + 2];
      let nx = rn[j], ny = rn[j + 1], nz = rn[j + 2];
      if (dn && mk !== 0) { nx += dn[j] * mk; ny += dn[j + 1] * mk; nz += dn[j + 2] * mk; }
      if (d && mk !== 0) { const ex = d[j] * mk, ey = d[j + 1] * mk, ez = d[j + 2] * mk; x += ex; y += ey; z += ez; u += ex; v += ey; s += ez; R[j] = pos.array[j] + ex; R[j + 1] = pos.array[j + 1] + ey; R[j + 2] = pos.array[j + 2] + ez; }
      const ax = a[0] * x + a[4] * y + a[8] * z + a[12], ay = a[1] * x + a[5] * y + a[9] * z + a[13], az = a[2] * x + a[6] * y + a[10] * z + a[14];
      if (w <= 0) { P[j] = ax; P[j + 1] = ay; P[j + 2] = az; N[j] = a[0] * nx + a[4] * ny + a[8] * nz; N[j + 1] = a[1] * nx + a[5] * ny + a[9] * nz; N[j + 2] = a[2] * nx + a[6] * ny + a[10] * nz; continue; }
      const bx = b[0] * u + b[4] * v + b[8] * s + b[12], by = b[1] * u + b[5] * v + b[9] * s + b[13], bz = b[2] * u + b[6] * v + b[10] * s + b[14];
      P[j] = ax + (bx - ax) * w; P[j + 1] = ay + (by - ay) * w; P[j + 2] = az + (bz - az) * w;
      const n1x = a[0] * nx + a[4] * ny + a[8] * nz, n1y = a[1] * nx + a[5] * ny + a[9] * nz, n1z = a[2] * nx + a[6] * ny + a[10] * nz;
      const n2x = b[0] * nx + b[4] * ny + b[8] * nz, n2y = b[1] * nx + b[5] * ny + b[9] * nz, n2z = b[2] * nx + b[6] * ny + b[10] * nz;
      let mx = n1x + (n2x - n1x) * w, my = n1y + (n2y - n1y) * w, mz = n1z + (n2z - n1z) * w; const l = Math.hypot(mx, my, mz) || 1;
      N[j] = mx / l; N[j + 1] = my / l; N[j + 2] = mz / l;
    }
    out.attributes.position.needsUpdate = true; out.attributes.normal.needsUpdate = true; if (d) out.attributes.rest.needsUpdate = true;
  }
  return { mesh, update, geo: out };
}

// the trunk: below the fifth lumbar vertebra the pelvis carries the tissue; up the lumbar spine it follows each vertebra
// in turn; from the first lumbar vertebra it blends into the ribcage (which rides on the seventh thoracic vertebra)
export function spineBinder(rig, { top = 1.26 } = {}) {
  const S = rig.seg, names = ['Fifth lumbar vertebra', 'Fourth lumbar vertebra', 'Third lumbar vertebra', 'Second lumbar vertebra', 'First lumbar vertebra'];
  const nodes = [{ g: rig.pelvis, y: 1.0 }, ...names.map((n) => ({ g: S[n].g, y: S[n].pivot.y })), { g: S['Seventh thoracic vertebra'].g, y: top }];
  return (p) => {
    if (p.y <= nodes[0].y) return [nodes[0].g, nodes[0].g, 0];
    for (let i = 0; i < nodes.length - 1; i++) if (p.y < nodes[i + 1].y) { const w = (p.y - nodes[i].y) / (nodes[i + 1].y - nodes[i].y); return [nodes[i].g, nodes[i + 1].g, ss(0, 1, w)]; }
    const g = nodes[nodes.length - 1].g; return [g, g, 0];
  };
}

// an arm: the shoulder girdle at the top, the upper arm, the forearm below the elbow (the arm hangs down in the standing frame)
export function armBinder(rig, Side) {
  const A = rig.arms[Side];
  return (p) => {
    if (p.y > A.SH.y - 0.02) return [A.girdle, A.arm, ss(A.SH.y + 0.03, A.SH.y - 0.02, p.y)];
    return [A.arm, A.elbow, ss(A.EL.y + 0.035, A.EL.y - 0.02, p.y)];
  };
}

// a height field of a surface seen from the front: z(x, y) = the frontmost point of the given meshes (standing frame)
export function frontField(pointSets, { x0, x1, y0, y1, step = 0.005, smooth = 2 }) {
  const nx = Math.round((x1 - x0) / step) + 1, ny = Math.round((y1 - y0) / step) + 1, Z = new Float32Array(nx * ny).fill(-9);
  for (const pts of pointSets) for (const v of pts) {
    const i = Math.round((v.x - x0) / step), j = Math.round((v.y - y0) / step);
    if (i < 0 || j < 0 || i >= nx || j >= ny) continue; const k = j * nx + i; if (v.z > Z[k]) Z[k] = v.z;
  }
  // fill holes from the nearest filled cells along the row, then smooth
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const k = j * nx + i; if (Z[k] > -9) continue; let best = -9, bd = 99; for (let d = 1; d < nx; d++) { for (const ii of [i - d, i + d]) if (ii >= 0 && ii < nx && Z[j * nx + ii] > -9 && d < bd) { bd = d; best = Z[j * nx + ii]; } if (bd < 99) break; } Z[k] = best; }
  for (let r = 0; r < smooth; r++) { const C = Z.slice(); for (let j = 1; j < ny - 1; j++) for (let i = 1; i < nx - 1; i++) { let s = 0; for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) s += C[(j + dj) * nx + i + di]; Z[j * nx + i] = s / 9; } }
  return (x, y) => {
    const fx = clamp01((x - x0) / (x1 - x0)) * (nx - 1), fy = clamp01((y - y0) / (y1 - y0)) * (ny - 1);
    const i = Math.min(nx - 2, Math.floor(fx)), j = Math.min(ny - 2, Math.floor(fy)), u = fx - i, v = fy - j;
    return lerp(lerp(Z[j * nx + i], Z[j * nx + i + 1], u), lerp(Z[(j + 1) * nx + i], Z[(j + 1) * nx + i + 1], u), v);
  };
}

// radial extent around a vertical axis (x = 0, z = zc): r(y, a) = the outermost point of the given meshes at that
// height and angle (a = 0 at the front, + toward the body's left)
export function radialField(pointSets, { y0, y1, zc = 0, ny = 64, na = 120, amax = Math.PI, smooth = 2 }) {
  const R = new Float32Array(ny * na).fill(-1);
  for (const pts of pointSets) for (const v of pts) {
    const j = Math.round(((v.y - y0) / (y1 - y0)) * (ny - 1)); if (j < 0 || j >= ny) continue;
    const a = Math.atan2(v.x, v.z - zc), i = Math.round(((a + amax) / (2 * amax)) * (na - 1)); if (i < 0 || i >= na) continue;
    const r = Math.hypot(v.x, v.z - zc), k = j * na + i; if (r > R[k]) R[k] = r;
  }
  for (let j = 0; j < ny; j++) for (let i = 0; i < na; i++) { const k = j * na + i; if (R[k] >= 0) continue; let best = -1; for (let d = 1; d < Math.max(na, ny) && best < 0; d++) for (const [jj, ii] of [[j, i - d], [j, i + d], [j - d, i], [j + d, i]]) if (jj >= 0 && jj < ny && ii >= 0 && ii < na && R[jj * na + ii] >= 0) { best = R[jj * na + ii]; break; } R[k] = Math.max(0, best); }
  for (let r = 0; r < smooth; r++) { const C = R.slice(); for (let j = 1; j < ny - 1; j++) for (let i = 1; i < na - 1; i++) { let s = 0, mx = 0; for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) { s += C[(j + dj) * na + i + di]; mx = Math.max(mx, C[(j + dj) * na + i + di]); } R[j * na + i] = 0.5 * s / 9 + 0.5 * mx; } }
  return (y, a) => {
    const fy = clamp01((y - y0) / (y1 - y0)) * (ny - 1), fa = clamp01((a + amax) / (2 * amax)) * (na - 1);
    const j = Math.min(ny - 2, Math.floor(fy)), i = Math.min(na - 2, Math.floor(fa)), u = fa - i, v = fy - j;
    return lerp(lerp(R[j * na + i], R[j * na + i + 1], u), lerp(R[(j + 1) * na + i], R[(j + 1) * na + i + 1], u), v);
  };
}

// a grid surface from f(u, v) -> [x, y, z] (u across, v along), with uv; computes normals
export function gridGeo(f, nu, nv, flip = false) {
  const P = new Float32Array((nu + 1) * (nv + 1) * 3), UV = new Float32Array((nu + 1) * (nv + 1) * 2), I = [];
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) { const k = j * (nu + 1) + i, p = f(i / nu, j / nv); P[k * 3] = p[0]; P[k * 3 + 1] = p[1]; P[k * 3 + 2] = p[2]; UV[k * 2] = i / nu; UV[k * 2 + 1] = j / nv; }
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1; if (flip) I.push(a, b, c, b, d, c); else I.push(a, c, b, b, c, d); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.BufferAttribute(UV, 2)); g.setIndex(I); g.computeVertexNormals();
  return g;
}

// fat: golden lobules (a Voronoi pattern: soft cells with thin, slightly darker walls)
export function lobuleTex(seed = 3, size = 512, n = 9) {
  const c = document.createElement('canvas'); c.width = c.height = size; const x = c.getContext('2d'), im = x.createImageData(size, size);
  // one jittered point per cell of an n x n grid that wraps, so the texture tiles
  const P = (i, j) => { const ii = ((i % n) + n) % n, jj = ((j % n) + n) % n, h = hash(seed * 131 + ii * 17.3 + jj * 71.9); return [(i + 0.15 + 0.7 * h) / n, (j + 0.15 + 0.7 * hash(h * 913 + 7)) / n]; };
  for (let py = 0; py < size; py++) for (let px = 0; px < size; px++) {
    const u = px / size, v = py / size, ci = Math.floor(u * n), cj = Math.floor(v * n); let d1 = 9, d2 = 9;
    for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) { const [qx, qy] = P(ci + di, cj + dj), d = (qx - u) ** 2 + (qy - v) ** 2; if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) d2 = d; }
    const e = (Math.sqrt(d2) - Math.sqrt(d1)) * n, wall = 1 - ss(0.0, 0.16, e), dome = 1 - ss(0, 0.62, Math.sqrt(d1) * n);
    const val = 255 * (0.8 + 0.12 * dome * (1 - wall) + 0.08 * wall), k = (py * size + px) * 4;
    im.data[k] = im.data[k + 1] = im.data[k + 2] = Math.max(0, Math.min(255, val)); im.data[k + 3] = 255;
  }
  x.putImageData(im, 0, 0);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; return t;
}
export const FAT = 0xf1cf78;
export function fatMat(tex, o = {}) {
  return new THREE.MeshPhysicalMaterial({
    color: FAT, roughness: 0.36, metalness: 0, clearcoat: 0.55, clearcoatRoughness: 0.2, sheen: 0.5, sheenColor: new THREE.Color(0xfff6d6), sheenRoughness: 0.35,
    map: tex, bumpMap: tex, bumpScale: 0.22, emissive: new THREE.Color(0xffc45a), emissiveIntensity: 0.04, transparent: true, opacity: 0.8, depthWrite: false, ...o,
  });
}

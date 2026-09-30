/*
 * Liquid glass maps, computed in the browser for the exact size of each glass element.
 *
 * A glass slab with a rounded-rectangle outline and a convex bezel. For each pixel inside the
 * bezel we refract a straight-down view ray through the curved top surface (Snell's law, IOR 1.5)
 * and record how far sideways it travels before reaching the backdrop. That offset becomes an SVG
 * feDisplacementMap image (R = x, G = y, 128 = no shift). A second image holds the specular rim,
 * lit from the upper left. Ported from our canvas generator; technique references:
 * OverShifted/LiquidGlass (MIT, squircle-SDF refraction idea) and archisvaze/liquid-glass (studied only).
 */

export type GlassMaps = { w: number; h: number; map: string; spec: string; scale: number };

function sdRoundRect(px: number, py: number, hw: number, hh: number, r: number) {
  const qx = Math.abs(px) - (hw - r);
  const qy = Math.abs(py) - (hh - r);
  const ox = Math.max(qx, 0);
  const oy = Math.max(qy, 0);
  return Math.hypot(ox, oy) + Math.min(Math.max(qx, qy), 0) - r;
}

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);

export function supportsLiquidGlass(): boolean {
  if (typeof navigator === "undefined" || typeof window === "undefined") return false;
  const ua = navigator.userAgent;
  // SVG filters inside backdrop-filter render only in Chromium. iOS browsers are all WebKit.
  if (!/Chrome\//.test(ua) || /CriOS|FxiOS|EdgiOS/.test(ua)) return false;
  if (window.matchMedia?.("(prefers-reduced-transparency: reduce)").matches) return false;
  return true;
}

const cache = new Map<string, GlassMaps>();

export function buildGlassMaps(
  w: number,
  h: number,
  radius: number,
  bezel = 18,
  thickness = 16,
  ior = 1.5,
  light: [number, number] = [-0.55, -0.83],
  specPower = 2.2,
  ss = 2,
): GlassMaps {
  const key = [w, h, radius, bezel, thickness].join("x");
  const hit = cache.get(key);
  if (hit) return hit;

  const r = Math.min(radius, w / 2, h / 2);
  const W = Math.round(w * ss);
  const H = Math.round(h * ss);
  const b = Math.max(1, Math.min(bezel, r, w / 2 - 1, h / 2 - 1));
  const k = 3;
  const e = 0.5;
  const ln = Math.hypot(light[0], light[1]);
  const lx = light[0] / ln;
  const ly = light[1] / ln;

  const dx = new Float32Array(W * H);
  const dy = new Float32Array(W * H);
  const inside = new Uint8Array(W * H);
  const spec = new Float32Array(W * H);
  let M = 0;

  for (let j = 0; j < H; j++) {
    const py = (j + 0.5) / ss - h / 2;
    for (let i = 0; i < W; i++) {
      const px = (i + 0.5) / ss - w / 2;
      const idx = j * W + i;
      const s = -sdRoundRect(px, py, w / 2, h / 2, r);
      if (s <= 0) continue;
      inside[idx] = 1;
      const gx = sdRoundRect(px + e, py, w / 2, h / 2, r) - sdRoundRect(px - e, py, w / 2, h / 2, r);
      const gy = sdRoundRect(px, py + e, w / 2, h / 2, r) - sdRoundRect(px, py - e, w / 2, h / 2, r);
      const gl = Math.hypot(gx, gy) + 1e-9;
      const nxIn = -gx / gl;
      const nyIn = -gy / gl;
      const u = clamp(s / b, 0, 1);
      const hgt = Math.pow(1 - Math.pow(1 - u, k), 1 / k);
      let dhdu = Math.pow(1 - Math.pow(1 - u, k), 1 / k - 1) * Math.pow(1 - u, k - 1);
      if (!Number.isFinite(dhdu)) dhdu = 60;
      const slope = clamp(dhdu * (thickness / b), 0, 60);
      const ti = Math.atan(slope);
      const tt = Math.asin(clamp(Math.sin(ti) / ior, -1, 1));
      const off = u < 1 ? thickness * (0.35 + 0.65 * hgt) * Math.tan(ti - tt) : 0;
      // sample from further out at the rim: the edge bends the world into the glass
      const ddx = -nxIn * off;
      const ddy = -nyIn * off;
      dx[idx] = ddx;
      dy[idx] = ddy;
      if (Math.abs(ddx) > M) M = Math.abs(ddx);
      if (Math.abs(ddy) > M) M = Math.abs(ddy);
      const dot = -nxIn * lx + -nyIn * ly;
      const facing = Math.pow(Math.max(dot, 0), specPower);
      const counter = Math.pow(Math.max(-dot, 0), 3) * 0.35;
      const rim = Math.pow(clamp(1 - s / (b * 0.55), 0, 1), 1.6);
      const hair = clamp(1 - Math.abs(s - 0.9) / 1.1, 0, 1) * 0.45;
      spec[idx] = clamp((facing + counter) * rim + hair, 0, 1);
    }
  }
  if (M === 0) M = 1;

  const big = (fill: (data: Uint8ClampedArray) => void) => {
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    const ctx = c.getContext("2d")!;
    const img = ctx.createImageData(W, H);
    fill(img.data);
    ctx.putImageData(img, 0, 0);
    const out = document.createElement("canvas");
    out.width = Math.round(w);
    out.height = Math.round(h);
    const octx = out.getContext("2d")!;
    octx.imageSmoothingEnabled = true;
    octx.imageSmoothingQuality = "high";
    octx.drawImage(c, 0, 0, out.width, out.height);
    return out.toDataURL("image/png");
  };

  const map = big((d) => {
    for (let n = 0; n < W * H; n++) {
      const o = n * 4;
      d[o] = clamp(Math.round(128 + (dx[n] / M) * 127), 0, 255);
      d[o + 1] = clamp(Math.round(128 + (dy[n] / M) * 127), 0, 255);
      d[o + 2] = 128;
      d[o + 3] = inside[n] ? 255 : 0;
    }
  });
  const specUrl = big((d) => {
    for (let n = 0; n < W * H; n++) {
      const o = n * 4;
      d[o] = 255;
      d[o + 1] = 255;
      d[o + 2] = 255;
      d[o + 3] = inside[n] ? Math.round(spec[n] * 255) : 0;
    }
  });

  const result = { w: Math.round(w), h: Math.round(h), map, spec: specUrl, scale: Math.round(2 * M * 100) / 100 };
  if (cache.size > 24) cache.clear();
  cache.set(key, result);
  return result;
}

"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import type { Callout, Dim, Pt } from "@/lib/systems";
import { BLUR } from "@/lib/blur";

export type HeightRuler = { head: Pt; foot: Pt; x: number; meters: number; label: string; sub: string };

type Props = {
  src: string;
  alt: string;
  w: number;
  h: number;
  fit?: "cover" | "contain";
  focus?: [number, number]; // object-position as fractions
  priority?: boolean;
  sizes?: string;
  dims?: Dim[];
  callouts?: Callout[];
  ruler?: HeightRuler;
  labelWidth?: number;
  inset?: number;
  className?: string;
  style?: CSSProperties;
  imgClassName?: string;
  children?: ReactNode;
};

/**
 * A render of the reference body with measured overlays. Anatomical points are stored in image
 * pixels and mapped through the same cover or contain transform the image uses, so every leader
 * lands on its part at any screen size.
 */
export function MeasuredFigure({
  src,
  alt,
  w,
  h,
  fit = "contain",
  focus = [0.5, 0.5],
  priority,
  sizes = "100vw",
  dims = [],
  callouts = [],
  ruler,
  labelWidth = 170,
  inset = 12,
  className = "",
  style,
  imgClassName = "",
  children,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<{ cw: number; ch: number } | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setBox({ cw: el.clientWidth, ch: el.clientHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  let overlay: ReactNode = null;
  if (box && box.cw > 0 && box.ch > 0) {
    const { cw, ch } = box;
    const s = fit === "cover" ? Math.max(cw / w, ch / h) : Math.min(cw / w, ch / h);
    const ox = (cw - w * s) * focus[0];
    const oy = (ch - h * s) * focus[1];
    const X = (p: Pt) => ox + p[0] * s;
    const Y = (p: Pt) => oy + p[1] * s;
    const k = Math.min(1.2, Math.max(0.45, s / 0.5)); // offsets were designed at half scale
    const lines: ReactNode[] = [];
    const labels: ReactNode[] = [];

    dims.forEach((d, i) => {
      if (d.hideBelow && cw < d.hideBelow) return;
      const x1 = X(d.a), y1 = Y(d.a), x2 = X(d.b), y2 = Y(d.b);
      const dx = x2 - x1, dy = y2 - y1;
      const n = Math.hypot(dx, dy) || 1;
      const t = 7;
      const nx = (-dy / n) * t, ny = (dx / n) * t;
      const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
      lines.push(
        <g key={`d${i}`} className="mf-dim">
          <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#FF7A3D" strokeWidth="1.4" pathLength={1} className="mf-draw" />
          <line x1={x1 - nx} y1={y1 - ny} x2={x1 + nx} y2={y1 + ny} stroke="#FF7A3D" strokeWidth="1.4" />
          <line x1={x2 - nx} y1={y2 - ny} x2={x2 + nx} y2={y2 + ny} stroke="#FF7A3D" strokeWidth="1.4" />
          <circle cx={mx} cy={my} r="2.6" fill="#FF7A3D" />
        </g>,
      );
      if (d.label) {
        const off = d.off ?? [12, -10];
        let lx = mx + off[0] * k;
        const ly = my + off[1] * k;
        const estW = Math.max(d.label.length * 8.6, (d.sub?.length ?? 0) * 7.9) + 22;
        lx = Math.min(Math.max(lx, inset), cw - inset - estW);
        labels.push(
          <div key={`dl${i}`} className="co-label a-in a-d2" style={{ left: lx, top: ly, transform: `translate(${d.anchor === "end" ? "-100%" : "0"}, -50%)` }}>
            <span className="cm">{d.label}</span>
            {d.sub ? <span className="cap" style={{ color: "rgba(236,238,241,.62)" }}>{d.sub}</span> : null}
          </div>,
        );
      }
    });

    if (ruler) {
      const top = Y(ruler.head), bottom = Y(ruler.foot);
      const x = ox + ruler.x * s;
      const ticks: ReactNode[] = [];
      const steps = Math.floor(ruler.meters * 10 + 1e-6);
      for (let i = 0; i <= steps; i++) {
        const yy = bottom + ((top - bottom) * (i * 0.1)) / ruler.meters;
        ticks.push(<line key={i} x1={x} y1={yy} x2={x + (i % 5 === 0 ? 12 : 6)} y2={yy} stroke="rgba(236,238,241,.55)" strokeWidth="1" />);
      }
      lines.push(
        <g key="ruler">
          <line x1={x} y1={bottom} x2={x} y2={top} stroke="rgba(236,238,241,.75)" strokeWidth="1.2" pathLength={1} className="mf-draw" />
          {ticks}
          <circle cx={x} cy={top} r="3" fill="#FF6A2B" />
        </g>,
      );
      labels.push(
        <div key="rl" className="co-label a-in a-d3" style={{ left: x + 20, top: top + 6 }}>
          <span className="cm">{ruler.label}</span>
          <span className="cap">{ruler.sub}</span>
        </div>,
      );
    }

    callouts.forEach((c, i) => {
      if (c.hideBelow && cw < c.hideBelow) return;
      const ax = X(c.at), ay = Y(c.at);
      const top = oy + c.y * s;
      const ey = top + 15;
      let ex: number, elbow: number, left: number;
      const lw = Math.min(labelWidth, cw * 0.38);
      if (c.side === "left") {
        const right = c.x !== undefined ? ox + c.x * s : inset + lw;
        left = right - lw;
        ex = right + 6;
        elbow = ex + 16;
      } else {
        left = c.x !== undefined ? ox + c.x * s : cw - inset - lw;
        ex = left - 6;
        elbow = ex - 16;
      }
      lines.push(
        <g key={`c${i}`}>
          <polyline points={`${ax},${ay} ${elbow},${ey} ${ex},${ey}`} fill="none" stroke="rgba(236,238,241,.78)" strokeWidth="1" pathLength={1} className="mf-draw" />
          <circle cx={ax} cy={ay} r="2.8" fill="#ECEEF1" />
          <circle cx={ax} cy={ay} r="7.5" fill="none" stroke="rgba(236,238,241,.55)" strokeWidth="1" />
        </g>,
      );
      labels.push(
        <div
          key={`cl${i}`}
          className="co-label a-in a-d3"
          style={{ left, top, width: lw, whiteSpace: "normal", alignItems: c.side === "left" ? "flex-end" : "flex-start", textAlign: c.side === "left" ? "right" : "left" }}
        >
          <span className="ck">{c.kicker}</span>
          <span className="cv" dangerouslySetInnerHTML={{ __html: c.value }} />
        </div>,
      );
    });

    overlay = (
      <>
        <svg className="mf-svg" width={cw} height={ch} viewBox={`0 0 ${cw} ${ch}`} aria-hidden="true" style={{ position: "absolute", inset: 0, overflow: "visible", pointerEvents: "none" }}>
          {lines}
        </svg>
        {labels}
      </>
    );
  }

  return (
    <div ref={ref} className={`mf ${className}`} style={style}>
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes={sizes}
        placeholder={BLUR[src] ? "blur" : "empty"}
        blurDataURL={BLUR[src]}
        className={imgClassName}
        style={{ objectFit: fit, objectPosition: `${focus[0] * 100}% ${focus[1] * 100}%` }}
      />
      {children}
      {overlay}
    </div>
  );
}

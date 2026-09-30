"use client";

import { createElement, useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { buildGlassMaps, supportsLiquidGlass, type GlassMaps } from "@/lib/lg";

type Props = {
  as?: "div" | "nav" | "header" | "a" | "aside" | "section";
  radius: number;
  bezel?: number;
  thickness?: number;
  blur?: number;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
  href?: string;
  "aria-label"?: string;
};

/**
 * A surface made of the liquid glass material. Chromium bends the page behind it through a
 * refraction map computed for its exact size; other browsers show the frosted fallback.
 * Keep box-shadows off this element (they shift the filter); use <GlassShadow> beside it.
 */
export function Glass({ as = "div", radius, bezel = 18, thickness = 24, blur = 1.2, className = "", style, children, ...rest }: Props) {
  const ref = useRef<HTMLElement | null>(null);
  const raw = useId();
  const fid = "lg" + raw.replace(/[^a-zA-Z0-9_-]/g, "");
  const [maps, setMaps] = useState<GlassMaps | null>(null);

  useEffect(() => {
    if (!supportsLiquidGlass()) return;
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const update = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const w = Math.round(el.offsetWidth);
        const h = Math.round(el.offsetHeight);
        if (w < 8 || h < 8) return;
        setMaps((prev) => (prev && prev.w === w && prev.h === h ? prev : buildGlassMaps(w, h, radius, bezel, thickness)));
      });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      ro.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [radius, bezel, thickness]);

  const glassStyle: CSSProperties = {
    borderRadius: radius,
    ...style,
    ...(maps ? { backdropFilter: `url(#${fid})`, WebkitBackdropFilter: `url(#${fid})` } : {}),
  };

  return (
    <>
      {maps ? (
        <svg width="0" height="0" aria-hidden="true" focusable="false" style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}>
          <filter id={fid} x="0%" y="0%" width="100%" height="100%" colorInterpolationFilters="sRGB">
            <feGaussianBlur in="SourceGraphic" stdDeviation={blur} result="b" />
            <feImage href={maps.map} x="0" y="0" width={maps.w} height={maps.h} preserveAspectRatio="none" result="m" />
            <feDisplacementMap in="b" in2="m" scale={maps.scale} xChannelSelector="R" yChannelSelector="G" result="r" />
            <feColorMatrix in="r" type="saturate" values="1.6" result="c" />
            <feImage href={maps.spec} x="0" y="0" width={maps.w} height={maps.h} preserveAspectRatio="none" result="sp" />
            <feBlend in="sp" in2="c" mode="screen" />
          </filter>
        </svg>
      ) : null}
      {createElement(
        as,
        {
          ref: (node: HTMLElement | null) => {
            ref.current = node;
          },
          className: `glass ${maps ? "lg-live" : ""} ${className}`.trim(),
          style: glassStyle,
          ...rest,
        },
        children,
      )}
    </>
  );
}

export function GlassShadow({ radius, style }: { radius: number; style?: CSSProperties }) {
  return <div className="lg-shadow" aria-hidden="true" style={{ borderRadius: radius, ...style }} />;
}

"use client";

import { createContext, useCallback, useContext, useEffect, useId, useState, type ReactNode } from "react";
import { MotionConfig, motion } from "motion/react";

export type Depth = 0 | 1 | 2;
const NAMES = ["Simple", "Detailed", "Expert"] as const;
const KEY = "hfs-depth-v2";

type Ctx = { depth: Depth; setDepth: (d: Depth) => void };
const DepthCtx = createContext<Ctx>({ depth: 0, setDepth: () => {} });

/** One setting for the whole site: Simple (a 12-year-old follows it), Detailed (more of the how), Expert (the technical terms and numbers). Simple is the default. */
export function DepthProvider({ children }: { children: ReactNode }) {
  const [depth, setD] = useState<Depth>(0);
  useEffect(() => {
    try {
      const v = window.localStorage.getItem(KEY);
      if (v === "0" || v === "1" || v === "2") setD(Number(v) as Depth);
    } catch {
      /* storage can be unavailable; the default is fine */
    }
  }, []);
  const setDepth = useCallback((d: Depth) => {
    setD(d);
    try {
      window.localStorage.setItem(KEY, String(d));
    } catch {
      /* ignore */
    }
  }, []);
  // This provider wraps every page, so it also tells Motion to honour "reduce motion": movement stops, fades stay.
  return (
    <DepthCtx.Provider value={{ depth, setDepth }}>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </DepthCtx.Provider>
  );
}

export function useDepth() {
  return useContext(DepthCtx);
}

export function DepthSwitch({ label = "Read it", size = "md", showLabel = true }: { label?: string; size?: "sm" | "md"; showLabel?: boolean }) {
  const { depth, setDepth } = useDepth();
  const group = useId();
  const seg = (
    <div className="seg" role="radiogroup" aria-label={label} style={size === "sm" ? { transform: "scale(.94)", transformOrigin: "right center" } : undefined}>
      {NAMES.map((n, i) => (
        <button key={n} type="button" role="radio" aria-checked={depth === i} className={depth === i ? "on" : ""} onClick={() => setDepth(i as Depth)}>
          {depth === i ? <motion.span layoutId={`pill-${group}`} className="pill" transition={{ type: "spring", stiffness: 520, damping: 38 }} /> : null}
          <span style={{ position: "relative" }}>{n}</span>
        </button>
      ))}
    </div>
  );
  if (!showLabel) return seg;
  return (
    <div className="depth-switch">
      <span className="cap" aria-hidden="true">
        {label}
      </span>
      {seg}
    </div>
  );
}

/** Renders the text for the current depth, with a soft cross-fade. */
export function DepthText({ simple, clear, expert, className = "", as = "p" }: { simple: ReactNode; clear: ReactNode; expert: ReactNode; className?: string; as?: "p" | "div" }) {
  const { depth } = useDepth();
  const content = depth === 0 ? simple : depth === 1 ? clear : expert;
  const Tag = as === "p" ? motion.p : motion.div;
  return (
    <Tag key={depth} className={className} initial={{ opacity: 0, y: 4, filter: "blur(4px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}>
      {content}
    </Tag>
  );
}

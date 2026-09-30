"use client";

import { createContext, useCallback, useContext, useEffect, useId, useState, type ReactNode } from "react";
import { motion } from "motion/react";

export type Depth = 0 | 1 | 2;
const NAMES = ["Simple", "Clear", "Expert"] as const;
const KEY = "hfs-depth";

type Ctx = { depth: Depth; setDepth: (d: Depth) => void };
const DepthCtx = createContext<Ctx>({ depth: 1, setDepth: () => {} });

/** One switch for the whole site: Simple for a 12-year-old, Clear for adults, Expert for clinicians. */
export function DepthProvider({ children }: { children: ReactNode }) {
  const [depth, setD] = useState<Depth>(1);
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
  return <DepthCtx.Provider value={{ depth, setDepth }}>{children}</DepthCtx.Provider>;
}

export function useDepth() {
  return useContext(DepthCtx);
}

export function DepthSwitch({ label = "Depth", size = "md" }: { label?: string; size?: "sm" | "md" }) {
  const { depth, setDepth } = useDepth();
  const group = useId();
  return (
    <div className="seg" role="radiogroup" aria-label={label} style={size === "sm" ? { transform: "scale(.94)", transformOrigin: "right center" } : undefined}>
      {NAMES.map((n, i) => (
        <button key={n} type="button" role="radio" aria-checked={depth === i} className={depth === i ? "on" : ""} onClick={() => setDepth(i as Depth)}>
          {depth === i ? <motion.span layoutId={`pill-${group}`} className="pill" transition={{ type: "spring", stiffness: 520, damping: 38 }} /> : null}
          <span style={{ position: "relative" }}>{n}</span>
        </button>
      ))}
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

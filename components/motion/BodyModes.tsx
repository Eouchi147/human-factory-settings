"use client";

import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { BodyExplorerLazy } from "../explorer/BodyExplorerLazy";
import s from "./modes.module.css";

const MotionExplorer = dynamic(() => import("./MotionExplorer").then((m) => m.MotionExplorer), {
  ssr: false,
  loading: () => <div style={{ height: "calc(100svh - var(--header-h) - 92px)", minHeight: 620 }} />,
});

type Tab = "systems" | "motion";

function Inner() {
  const sp = useSearchParams();
  const [tab, setTab] = useState<Tab>(sp.get("mode") === "move" ? "motion" : "systems");
  const go = (t: Tab) => {
    setTab(t);
    const u = new URL(window.location.href);
    if (t === "motion") { u.searchParams.set("mode", "move"); u.searchParams.delete("system"); } else u.searchParams.delete("mode");
    window.history.replaceState(null, "", u.toString());
  };
  return (
    <div className={s.wrap}>
      <div className={s.tabs} role="tablist" aria-label="Ways to explore">
        {(
          [
            ["systems", "Systems"],
            ["motion", "In motion"],
          ] as [Tab, string][]
        ).map(([t, label]) => (
          <button key={t} role="tab" type="button" id={`tab-${t}`} aria-selected={tab === t} aria-controls={`panel-${t}`} className={`${s.tab} ${tab === t ? s.on : ""}`} onClick={() => go(t)}>
            {label}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
        {tab === "systems" ? <BodyExplorerLazy /> : <MotionExplorer variant="page" />}
      </div>
    </div>
  );
}

/** The body page's 3D: every system (the explorer) or the body in motion (joints that move within real ranges).
    /body?mode=move opens on the motion. */
export function BodyModes() {
  return (
    <Suspense fallback={<div style={{ height: "calc(100svh - var(--header-h) - 92px)", minHeight: 600 }} />}>
      <Inner />
    </Suspense>
  );
}

"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import type { HeroApi } from "@/lib/hero3d";
import type { Part } from "@/lib/parts";

export type Body3DState = "loading" | "ready" | "failed";

/** Loads the live 3D body into a canvas (three.js is fetched only when this runs) and hands back its controls. */
export function useBody3D(canvas: RefObject<HTMLCanvasElement | null>, onPick?: (p: Part) => void) {
  const api = useRef<HeroApi | null>(null);
  const pick = useRef(onPick);
  const [state, setState] = useState<Body3DState>("loading");
  const [built, setBuilt] = useState(false);

  useEffect(() => {
    pick.current = onPick;
  }, [onPick]);

  useEffect(() => {
    let dead = false;
    const el = canvas.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const lite = window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 900;
    (async () => {
      try {
        const test = document.createElement("canvas");
        if (!(test.getContext("webgl2") || test.getContext("webgl"))) throw new Error("no webgl");
        const { createHero } = await import("@/lib/hero3d");
        if (dead) return;
        const h = await createHero(el, {
          url: "/model/body.glb",
          reduced,
          lite,
          onReady: () => !dead && setState("ready"),
          onIntroDone: () => !dead && setBuilt(true),
          onPick: (p) => {
            if (!dead && p) pick.current?.(p);
          },
        });
        if (dead) {
          h.dispose();
          return;
        }
        api.current = h;
        if (reduced) setBuilt(true);
      } catch {
        if (!dead) setState("failed");
      }
    })();
    return () => {
      dead = true;
      api.current?.dispose();
      api.current = null;
    };
  }, [canvas]);

  return { api, state, built };
}

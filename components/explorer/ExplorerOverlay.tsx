"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion } from "motion/react";
import type { SystemId } from "@/lib/anatomy";

const BodyExplorer = dynamic(() => import("./BodyExplorer").then((m) => m.BodyExplorer), { ssr: false });

/** The explorer over the whole screen. The phone's back button closes it, and the page underneath stays put. */
export function ExplorerOverlay({ system, onClose }: { system: SystemId | null; onClose: () => void }) {
  const pushed = useRef(false);
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const html = document.documentElement;
    const prev = html.style.overflow;
    html.style.overflow = "hidden";
    window.history.pushState({ hfsExplore: 1 }, "");
    pushed.current = true;
    const onPop = () => {
      pushed.current = false;
      closeRef.current();
    };
    window.addEventListener("popstate", onPop);
    return () => {
      html.style.overflow = prev;
      window.removeEventListener("popstate", onPop);
    };
  }, []);

  const close = useCallback(() => {
    if (pushed.current) window.history.back(); // popstate closes it
    else closeRef.current();
  }, []);

  return createPortal(
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label="Your body in 3D"
      initial={{ opacity: 0, scale: 0.985 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      style={{ position: "fixed", inset: 0, zIndex: 90 }}
    >
      <BodyExplorer variant="overlay" initial={system} onClose={close} />
    </motion.div>,
    document.body,
  );
}

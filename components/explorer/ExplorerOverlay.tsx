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

  // keyboard: focus moves into the dialog, Tab stays inside it, and focus goes back where it was on close
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const before = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const raf = requestAnimationFrame(() => box.current?.focus({ preventScroll: true }));
    const onKey = (e: KeyboardEvent) => {
      const el = box.current;
      if (e.key !== "Tab" || !el) return;
      const items = [...el.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])')].filter(
        (n) => n.getClientRects().length > 0,
      );
      if (!items.length) return;
      const first = items[0], last = items[items.length - 1], at = document.activeElement;
      if (e.shiftKey && (at === first || at === el || !el.contains(at))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (at === last || !el.contains(at))) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", onKey);
      before?.focus({ preventScroll: true });
    };
  }, []);

  return createPortal(
    <motion.div
      ref={box}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label="Your body in 3D"
      initial={{ opacity: 0, scale: 0.985 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      style={{ position: "fixed", inset: 0, zIndex: 90, outline: "none" }}
    >
      <BodyExplorer variant="overlay" initial={system} onClose={close} />
    </motion.div>,
    document.body,
  );
}

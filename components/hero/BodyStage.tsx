"use client";

import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import s from "./bodystage.module.css";
import h from "./hero.module.css";
import { GROUPS_OF, PARTS, PART_ORDER, type Part } from "@/lib/parts";
import { Icon } from "../Icons";
import { useBody3D } from "./useBody3D";

/** The body page's explorer: the same live 3D body as the home page, with every part one tap away. */
export function BodyStage() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [part, setPart] = useState<Part | null>(null);
  const focus = useCallback((p: Part | null) => {
    setPart(p);
    api.current?.setFocus(p ? { groups: GROUPS_OF[p] } : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const { api, state, built } = useBody3D(canvas, focus);

  return (
    <div className={s.wrap}>
      <div className={s.stage}>
        <canvas ref={canvas} className={`${h.canvas} ${state === "ready" ? h.on : ""}`} aria-label="A 3D human body. Drag to turn it, tap a part to learn what it does." />
        {state === "loading" ? (
          <div className={h.loading} aria-hidden="true">
            <span className={h.spinner} />
            <span>Building your body</span>
          </div>
        ) : null}
        {state === "failed" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className={h.fallback} src="/img/home_phone.jpg" alt="A 3D human body: skeleton, organs, arteries and veins" />
        ) : null}
        {state === "ready" ? (
          <div className={`${h.hint} ${built ? h.hintOn : ""}`}>
            <Icon name="rotate" size={14} />
            Drag to spin. Tap a part.
            <button type="button" onClick={() => api.current?.replay()} className={h.replay} aria-label="Build it again">
              <Icon name="redo" size={14} />
            </button>
          </div>
        ) : null}
      </div>
      <div className={s.side}>
        <div className={s.chips} role="group" aria-label="Pick a part">
          {PART_ORDER.map((p) => (
            <button key={p} type="button" className={`${h.chip} ${part === p ? h.chipOn : ""}`} aria-pressed={part === p} onClick={() => focus(part === p ? null : p)}>
              {PARTS[p].name}
            </button>
          ))}
        </div>
        <div className={s.slot} aria-live="polite">
          <AnimatePresence mode="wait">
            {part ? (
              <motion.div
                key={part}
                className={`glass ${h.card}`}
                initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -6, filter: "blur(4px)" }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              >
                <button type="button" className={h.close} onClick={() => focus(null)} aria-label="Close">
                  <Icon name="close" size={14} />
                </button>
                <span className={h.cardKick}>{PARTS[part].name}</span>
                <p className={h.cardFact}>{PARTS[part].line}</p>
                <Link href={PARTS[part].href} className="btn btn-signal btn-sm" style={{ alignSelf: "flex-start" }}>
                  See how it works
                  <Icon name="arrow" size={15} />
                </Link>
              </motion.div>
            ) : (
              <motion.p key="none" className={s.none} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                Tap any part of the body, or pick one above.
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

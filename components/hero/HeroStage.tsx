"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import s from "./hero.module.css";
import { AREAS, type Area } from "@/lib/areas";
import { GROUPS_OF, PARTS, type Part } from "@/lib/parts";
import { Icon } from "../Icons";
import { useBody3D } from "./useBody3D";
import { ExplorerOverlay } from "../explorer/ExplorerOverlay";
import { SYSTEM_FOR_PART, type SystemId } from "@/lib/anatomy";

type Sel = { kind: "area"; area: Area } | { kind: "part"; part: Part } | null;

/** The home page's opening: a live 3D body that builds itself, turns, and reacts to whatever you pick. */
export function HeroStage() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [sel, setSel] = useState<Sel>(null);
  const onPick = useCallback((p: Part) => {
    setSel({ kind: "part", part: p });
    api.current?.setFocus({ groups: GROUPS_OF[p] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const { api, state, built } = useBody3D(canvas, onPick);
  const [explore, setExplore] = useState<{ system: SystemId | null } | null>(null);
  // the home page's body rests while the explorer covers it
  useEffect(() => {
    api.current?.setPaused(!!explore);
  }, [explore, api]);

  const pickArea = (a: Area) => {
    if (sel?.kind === "area" && sel.area.slug === a.slug) {
      setSel(null);
      api.current?.setFocus(null);
      return;
    }
    setSel({ kind: "area", area: a });
    api.current?.setFocus({ groups: a.focus, mood: a.mood });
  };
  const clear = () => {
    setSel(null);
    api.current?.setFocus(null);
  };

  return (
    <section className={s.hero} aria-label="Introduction">
      <div className={s.stage} data-mood={sel?.kind === "area" ? sel.area.slug : undefined}>
        <canvas ref={canvas} className={`${s.canvas} ${state === "ready" ? s.on : ""}`} aria-label="A 3D human body. Drag to turn it, tap a part to learn what it does." />
        {state === "loading" ? (
          <div className={s.loading} aria-hidden="true">
            <span className={s.spinner} />
            <span>Building your body</span>
          </div>
        ) : null}
        {state === "failed" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className={s.fallback} src="/img/home_phone.jpg" alt="A 3D human body: skeleton, organs, arteries and veins" />
        ) : null}
        {state === "ready" || state === "failed" ? (
          <div className={`${s.hint} ${built || state === "failed" ? s.hintOn : ""}`}>
            {state === "ready" ? (
              <span className={s.hintText}>
                <Icon name="rotate" size={14} />
                Drag to spin
              </span>
            ) : null}
            <button type="button" className={s.explore} onClick={() => setExplore({ system: null })}>
              <Icon name="layers" size={15} />
              Explore in 3D
            </button>
          </div>
        ) : null}
      </div>

      <div className={s.copy}>
        <div className="kick a-in">Health, made simple</div>
        <h1 className="h-display a-in a-d1">
          <span className="l1">You came with</span>
          <span className="l2">factory settings.</span>
        </h1>
        <div className={`${s.slot} a-in a-d2`} aria-live="polite">
          <AnimatePresence mode="wait" initial={false}>
            {sel ? (
              <motion.div
                key={sel.kind === "area" ? sel.area.slug : sel.part}
                className={`glass ${s.card}`}
                initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -6, filter: "blur(4px)" }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              >
                <button type="button" className={s.close} onClick={clear} aria-label="Close">
                  <Icon name="close" size={14} />
                </button>
                {sel.kind === "area" ? (
                  <>
                    <span className={s.cardKick}>{sel.area.name}</span>
                    <p className={s.cardFact}>{sel.area.fact}</p>
                    <Link href={`/${sel.area.slug}`} className="btn btn-signal btn-sm" style={{ alignSelf: "flex-start" }}>
                      Start here
                      <Icon name="arrow" size={15} />
                    </Link>
                  </>
                ) : (
                  <>
                    <span className={s.cardKick}>{PARTS[sel.part].name}</span>
                    <p className={s.cardFact}>{PARTS[sel.part].line}</p>
                    <div className="row-wrap gap-8">
                      <button type="button" className="btn btn-signal btn-sm" onClick={() => setExplore({ system: SYSTEM_FOR_PART[sel.part] ?? null })}>
                        <Icon name="layers" size={15} />
                        Take it apart in 3D
                      </button>
                      <Link href={PARTS[sel.part].href} className="btn btn-ghost btn-sm">
                        How it works
                        <Icon name="arrow" size={15} />
                      </Link>
                    </div>
                  </>
                )}
              </motion.div>
            ) : (
              <motion.p key="sub" className={s.sub} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
                Your body runs on a few settings: sleep, food, movement, posture, stress, focus and people. Pick one to see what it does inside you.
              </motion.p>
            )}
          </AnimatePresence>
        </div>
        <div className={`${s.chips} a-in a-d3`} role="group" aria-label="What do you want to fix?">
          {AREAS.map((a) => {
            const on = sel?.kind === "area" && sel.area.slug === a.slug;
            return (
              <button key={a.slug} type="button" className={`${s.chip} ${on ? s.chipOn : ""}`} aria-pressed={on} onClick={() => pickArea(a)}>
                <Icon name={a.icon} size={16} />
                {a.chip}
              </button>
            );
          })}
        </div>
        <a href="#fix" className={`${s.start} a-in a-d3`}>
          Or see everything people ask us
          <Icon name="arrow" size={15} />
        </a>
      </div>
      <AnimatePresence>{explore ? <ExplorerOverlay key="explore" system={explore.system} onClose={() => setExplore(null)} /> : null}</AnimatePresence>
    </section>
  );
}

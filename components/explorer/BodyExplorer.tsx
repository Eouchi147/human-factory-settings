"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { AnimatePresence, motion } from "motion/react";
import s from "./explorer.module.css";
import { SYSTEMS3D, SYSTEM_ORDER, systemById, type SystemId } from "@/lib/anatomy";
import type { ExplorerApi } from "@/lib/explorer3d";
import { Icon } from "../Icons";

type Props = {
  variant: "page" | "overlay";
  initial?: SystemId | null;
  onClose?: () => void;
};

const EASE = [0.16, 1, 0.3, 1] as const;

/** Every system of the body in 3D: pick one, and it comes apart slowly, numbered, with a plain line for each part. */
export function BodyExplorer({ variant, initial = null, onClose }: Props) {
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const labels = useRef<HTMLDivElement>(null);
  const top = useRef<HTMLElement>(null);
  const sheet = useRef<HTMLDivElement>(null);
  const slider = useRef<HTMLInputElement>(null);
  const sliding = useRef(false);
  const api = useRef<ExplorerApi | null>(null);
  const sysRef = useRef<SystemId | null>(initial);
  const [state, setState] = useState<"loading" | "ready" | "failed">("loading");
  const [busy, setBusy] = useState(false);
  const [system, setSystemState] = useState<SystemId | null>(initial);
  const [part, setPart] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const spec = system ? systemById(system) ?? null : null;
  const legend = spec ? spec.parts.filter((p) => p.label !== false) : [];
  const partIndex = part ? legend.findIndex((p) => p.id === part) : -1;
  const partSpec = partIndex >= 0 ? legend[partIndex] : null;

  const chooseSystem = useCallback((id: SystemId | null) => {
    sysRef.current = id;
    setSystemState(id);
    setPart(null);
    setPlaying(false);
    if (slider.current) {
      slider.current.value = "0";
      slider.current.style.setProperty("--p", "0");
    }
    void api.current?.setSystem(id);
  }, []);

  const choosePart = useCallback((id: string | null) => {
    setPart(id);
    api.current?.select(id);
  }, []);

  const chooseSystemRef = useRef(chooseSystem); // stable: chooseSystem never changes

  // keep the body in the part of the screen the controls leave free
  const measure = useCallback(() => {
    const st = stage.current?.getBoundingClientRect();
    const sh = sheet.current?.getBoundingClientRect();
    const tb = top.current?.getBoundingClientRect();
    if (!st || !sh || !tb || !api.current) return;
    const wide = st.width >= 980;
    api.current.setInsets(
      wide
        ? { top: Math.max(0, tb.bottom - st.top) + 4, right: Math.max(0, st.right - sh.left) + 12, bottom: 24, left: 24 }
        : { top: Math.max(0, tb.bottom - st.top) + 6, right: 0, bottom: Math.max(0, st.bottom - sh.top) + 10, left: 0 },
    );
  }, []);

  // the 3D scene, loaded only in the browser and only when this mounts
  useEffect(() => {
    let dead = false;
    const el = canvas.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    (async () => {
      try {
        const test = document.createElement("canvas");
        if (!test.getContext("webgl2")) throw new Error("no webgl2");
        const { createExplorer } = await import("@/lib/explorer3d");
        if (dead) return;
        const x = await createExplorer(el, {
          base: "/model/atlas",
          lite: coarse || window.innerWidth < 900,
          reduced,
          immersive: variant === "overlay",
          onLoading: (b) => !dead && setBusy(b),
          onPick: (p) => {
            if (dead) return;
            if (!p) {
              if (sysRef.current) {
                setPart(null);
                api.current?.select(null);
              }
              return;
            }
            if (p.system !== sysRef.current) {
              // tapping the body in the whole view opens that system
              if (sysRef.current === null) chooseSystemRef.current(p.system);
              return;
            }
            setPart(p.part);
            api.current?.select(p.part);
          },
          onTour: (id) => !dead && setPart(id),
          onPlaying: (v) => !dead && setPlaying(v),
          onExplode: (v) => {
            const sl = slider.current;
            if (!sl || sliding.current) return;
            sl.value = String(Math.round(v * 1000));
            sl.style.setProperty("--p", v.toFixed(3));
          },
          onError: () => !dead && setState("failed"),
        });
        if (dead) {
          x.dispose();
          return;
        }
        api.current = x;
        x.bindLabels(labels.current);
        measure();
        setState("ready");
        if (sysRef.current) void x.setSystem(sysRef.current);
      } catch {
        if (!dead) setState("failed");
      }
    })();
    return () => {
      dead = true;
      api.current?.dispose();
      api.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // the numbers on the body follow the parts; rebind them when the system changes
  useEffect(() => {
    api.current?.bindLabels(labels.current);
  }, [system, state]);

  useEffect(() => {
    const ro = new ResizeObserver(() => measure());
    if (sheet.current) ro.observe(sheet.current);
    if (stage.current) ro.observe(stage.current);
    if (top.current) ro.observe(top.current);
    return () => ro.disconnect();
  }, [measure]);

  // keyboard: step through the parts, Escape closes the full-screen view
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && variant === "overlay") onClose?.();
      if (!spec || (e.target as HTMLElement)?.tagName === "INPUT") return;
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        if (variant !== "overlay" && !stage.current?.contains(document.activeElement)) return;
        const n = legend.length;
        const i = partIndex < 0 ? (e.key === "ArrowRight" ? 0 : n - 1) : (partIndex + (e.key === "ArrowRight" ? 1 : n - 1)) % n;
        choosePart(legend[i].id);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [variant, onClose, spec, legend, partIndex, choosePart]);

  const step = (d: number) => {
    if (!legend.length) return;
    const n = legend.length;
    const i = partIndex < 0 ? (d > 0 ? 0 : n - 1) : (partIndex + d + n) % n;
    choosePart(legend[i].id);
  };

  const togglePlay = () => {
    if (!api.current || !spec) return;
    if (playing) {
      api.current.stop();
      setPlaying(false);
    } else {
      setPart(null);
      api.current.play();
    }
  };

  const accent = spec?.color ?? "#e6dac1";
  return (
    <div className={`${s.root} ${variant === "overlay" ? s.overlay : s.page}`} style={{ "--accent": accent } as CSSProperties} data-system={system ?? "body"}>
      <div ref={stage} className={s.stage}>
        <div className={s.glow} aria-hidden="true" />
        <canvas
          ref={canvas}
          className={`${s.canvas} ${state === "ready" ? s.on : ""}`}
          aria-label={spec ? `${spec.name} in 3D. Drag to turn it, tap a part to read about it.` : "Your whole body in 3D. Drag to turn it, tap a system to open it."}
        />
        <div ref={labels} className={s.labels} data-many={legend.length > 8 ? "1" : "0"}>
          {spec
            ? legend.map((p, i) => (
                <button
                  key={`${spec.id}-${p.id}`}
                  type="button"
                  data-part={p.id}
                  className={`${s.dot} ${part === p.id ? s.dotOn : ""}`}
                  style={{ "--c": p.color } as CSSProperties}
                  onClick={() => choosePart(part === p.id ? null : p.id)}
                  aria-label={`${i + 1}: ${p.name}`}
                >
                  <span className={s.num}>{i + 1}</span>
                  <span className={s.tag}>{p.name}</span>
                </button>
              ))
            : null}
        </div>
        <div className={s.vignette} aria-hidden="true" />

        <header ref={top} className={s.top}>
          <div className={s.titles}>
            <span className={s.kick}>The body in 3D</span>
            <AnimatePresence mode="wait" initial={false}>
              <motion.h2
                key={system ?? "body"}
                className={s.title}
                initial={{ opacity: 0, y: 8, filter: "blur(6px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -4, filter: "blur(4px)" }}
                transition={{ duration: 0.5, ease: EASE }}
              >
                {spec ? spec.name : "Your whole body"}
              </motion.h2>
            </AnimatePresence>
            <span className={s.formal}>{spec ? `${spec.formal} · ${legend.length} parts` : "Every system, in colour"}</span>
          </div>
          {variant === "overlay" ? (
            <button type="button" className={s.close} onClick={onClose} aria-label="Close the 3D body">
              <Icon name="close" size={18} />
            </button>
          ) : null}
        </header>

        {state === "loading" ? (
          <div className={s.loading} aria-hidden="true">
            <span className={s.spinner} />
            <span>Building your body</span>
          </div>
        ) : null}
        {busy ? <div className={s.busy}>Loading the muscles</div> : null}
        {state === "failed" ? (
          <div className={s.failed}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/img/home_phone.jpg" alt="The 3D body: skeleton, organs, arteries and veins" />
            <p>Your browser can&apos;t show the 3D body. Try a recent Chrome, Safari or Firefox.</p>
          </div>
        ) : null}
      </div>

      <div ref={sheet} className={s.sheet}>
        <div className={s.card} aria-live="polite">
          <AnimatePresence mode="wait" initial={false}>
            {spec && partSpec ? (
              <motion.div
                key={`${spec.id}-${partSpec.id}`}
                className={s.cardIn}
                initial={{ opacity: 0, y: 8, filter: "blur(5px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -4, filter: "blur(4px)" }}
                transition={{ duration: 0.35, ease: EASE }}
              >
                <div className={s.cardHead}>
                  <span className={s.cardNum} style={{ "--c": partSpec.color } as CSSProperties}>
                    {partIndex + 1}
                  </span>
                  <span className={s.cardName}>{partSpec.name}</span>
                  <span className={s.cardSteps}>
                    <button type="button" onClick={() => step(-1)} aria-label="Previous part">
                      <Icon name="back" size={16} />
                    </button>
                    <button type="button" onClick={() => step(1)} aria-label="Next part">
                      <Icon name="back" size={16} style={{ transform: "scaleX(-1)" }} />
                    </button>
                  </span>
                </div>
                <p className={s.cardLine}>{partSpec.line}</p>
                {partSpec.href ?? spec.href ? (
                  <Link href={(partSpec.href ?? spec.href)!} className={s.cardLink}>
                    How it works <Icon name="arrow" size={14} />
                  </Link>
                ) : null}
              </motion.div>
            ) : (
              <motion.div
                key={spec ? spec.id : "body"}
                className={s.cardIn}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.35, ease: EASE }}
              >
                <p className={s.cardLine}>{spec ? spec.line : "Pick a system below, or tap the body, to see it come apart."}</p>
                {spec?.note ? <p className={s.note}>{spec.note}</p> : null}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {spec ? (
          <div className={s.controls}>
            <button type="button" className={`${s.play} ${playing ? s.playOn : ""}`} onClick={togglePlay} aria-label={playing ? "Pause the tour" : "Play the tour"}>
              <Icon name={playing ? "pause" : "play"} size={18} />
            </button>
            <label className={s.scrub}>
              <span className={s.scrubEnds} aria-hidden="true">
                <span>Together</span>
                <span>Apart</span>
              </span>
              <input
                ref={slider}
                type="range"
                min={0}
                max={1000}
                defaultValue={0}
                aria-label="Take it apart"
                onPointerDown={() => (sliding.current = true)}
                onPointerUp={() => (sliding.current = false)}
                onPointerCancel={() => (sliding.current = false)}
                onBlur={() => (sliding.current = false)}
                onInput={(e) => {
                  const v = Number((e.target as HTMLInputElement).value) / 1000;
                  (e.target as HTMLInputElement).style.setProperty("--p", v.toFixed(3));
                  setPlaying(false);
                  api.current?.setExplode(v);
                }}
              />
            </label>
            <button type="button" className={s.reset} onClick={() => api.current?.resetView()} aria-label="Reset the view">
              <Icon name="rotate" size={16} />
            </button>
          </div>
        ) : null}

        {spec ? (
          <div className={s.legend} role="group" aria-label={`Parts of the ${spec.name.toLowerCase()}`}>
            {legend.map((p, i) => (
              <button
                key={`${spec.id}-${p.id}`}
                type="button"
                className={`${s.item} ${part === p.id ? s.itemOn : ""}`}
                style={{ "--c": p.color } as CSSProperties}
                aria-pressed={part === p.id}
                onClick={() => choosePart(part === p.id ? null : p.id)}
              >
                <span className={s.itemNum}>{i + 1}</span>
                {p.name}
              </button>
            ))}
          </div>
        ) : null}

        <div className={s.systems} role="group" aria-label="Pick a system">
          <button type="button" className={`${s.sys} ${system === null ? s.sysOn : ""}`} aria-pressed={system === null} onClick={() => chooseSystem(null)}>
            <span className={s.sysDot} style={{ background: "conic-gradient(#e6dac1 0 25%, #d8392f 0 50%, #e39a63 0 75%, #ebc54e 0)" }} />
            Whole body
          </button>
          {SYSTEM_ORDER.map((id) => {
            const x = SYSTEMS3D.find((q) => q.id === id)!;
            return (
              <button key={id} type="button" className={`${s.sys} ${system === id ? s.sysOn : ""}`} aria-pressed={system === id} onClick={() => chooseSystem(id)}>
                <span className={s.sysDot} style={{ background: x.color2 ? `linear-gradient(90deg, ${x.color} 50%, ${x.color2} 50%)` : x.color }} />
                {x.name}
              </button>
            );
          })}
        </div>
        <a className={s.credit} href="https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html" target="_blank" rel="noopener noreferrer">
          3D anatomy: BodyParts3D, CC BY 4.0, simplified and scaled to 1.83 m
        </a>
      </div>
    </div>
  );
}

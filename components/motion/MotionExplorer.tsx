"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import s from "./motion.module.css";
import { CONTROLS, CONTROL, MOVES, REGIONS, neutral, type Pose } from "@/lib/motion/joints";
import { SOURCES } from "@/lib/motion/sources";
import type { MotionApi } from "@/lib/motion3d";
import { Icon } from "../Icons";

type Mode = "easy" | "advanced";
type Layer = 0 | 1 | 2;
const SPEEDS = [
  { id: "slow", label: "Slow", k: 0.5 },
  { id: "medium", label: "Medium", k: 1 },
  { id: "fast", label: "Fast", k: 1.7 },
] as const;
const LAYERS: { n: Layer; label: string }[] = [
  { n: 0, label: "Bones" },
  { n: 1, label: "Deep muscles" },
  { n: 2, label: "All muscles" },
];
const fmt = (v: number, unit?: string) => `${Math.round(v)}${unit === "mm" ? " mm" : "°"}`;
const other = (id: string) => (/^(sh|el|fa|wr|hp|kn|an)R\./.test(id) ? id.replace(/^(\w\w)R\./, "$1L.") : /^(sh|el|fa|wr|hp|kn|an)L\./.test(id) ? id.replace(/^(\w\w)L\./, "$1R.") : null);

/** The body in motion: a real skeleton and its muscles, moved within the ranges measured in real people.
    Easy: one-tap movements. Advanced: every joint, in degrees, with its limits and where they come from. */
export function MotionExplorer({ variant = "page" }: { variant?: "page" | "overlay" }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const top = useRef<HTMLDivElement>(null);
  const api = useRef<MotionApi | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "failed">("loading");
  const [mode, setMode] = useState<Mode>("easy");
  const [layer, setLayer] = useState<Layer>(1);
  const [move, setMove] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<(typeof SPEEDS)[number]["id"]>("medium");
  const [pose, setPoseState] = useState<Pose>(neutral);
  const [picked, setPicked] = useState<{ name: string; kind: "bone" | "muscle" } | null>(null);
  const [link, setLink] = useState(true);
  const [open, setOpen] = useState<string>(REGIONS[0]);
  const [swing, setSwing] = useState<string | null>(null); // the control whose play button is on
  const [poseA, setPoseA] = useState<Pose | null>(null);
  const [poseB, setPoseB] = useState<Pose | null>(null);
  const [morph, setMorph] = useState(0);
  const [showSrc, setShowSrc] = useState(false);
  const speedK = SPEEDS.find((x) => x.id === speed)!.k;

  // the scene, in the browser only
  useEffect(() => {
    let dead = false;
    const el = canvas.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    (async () => {
      try {
        if (!document.createElement("canvas").getContext("webgl2")) throw new Error("no webgl2");
        const { createMotion } = await import("@/lib/motion3d");
        if (dead) return;
        const x = await createMotion(el, {
          base: "/model/motion",
          lite: coarse || window.innerWidth < 900,
          reduced,
          onPick: (p) => !dead && setPicked(p),
          onError: () => !dead && setState("failed"),
        });
        if (dead) return x.dispose();
        api.current = x;
        x.setLayer(1);
        setState("ready");
      } catch {
        if (!dead) setState("failed");
      }
    })();
    return () => {
      dead = true;
      api.current?.dispose();
      api.current = null;
    };
  }, []);

  // keep the body in the space the controls leave free
  useEffect(() => {
    const m = () => {
      const st = stage.current?.getBoundingClientRect(), pn = panel.current?.getBoundingClientRect(), tb = top.current?.getBoundingClientRect();
      if (!st || !pn || !tb || !api.current) return;
      const wide = st.width >= 980;
      api.current.setInsets(wide ? { top: tb.bottom - st.top, right: st.right - pn.left + 12, bottom: 20, left: 20 } : { top: tb.bottom - st.top, right: 0, bottom: st.bottom - pn.top + 8, left: 0 });
    };
    m();
    const ro = new ResizeObserver(m);
    if (stage.current) ro.observe(stage.current);
    if (panel.current) ro.observe(panel.current);
    return () => ro.disconnect();
  }, [state, mode, open]);

  useEffect(() => api.current?.setSpeed(speedK), [speedK, state]);
  useEffect(() => api.current?.setLayer(layer), [layer, state]);
  useEffect(() => api.current?.setPose(pose), [pose, state]);

  // easy: one move plays at a time, looping
  const playMove = useCallback((id: string | null) => {
    setMove(id);
    setPlaying(!!id);
    setSwing(null);
    api.current?.play(id);
  }, []);
  const toggle = () => {
    if (playing) { setPlaying(false); api.current?.play(null); }
    else { const id = move ?? MOVES[0].id; setMove(id); setPlaying(true); api.current?.play(id); }
  };

  // advanced: set one control (and its other side when linked)
  const setControl = useCallback((id: string, v: number) => {
    setPoseState((p) => {
      const n = { ...p, [id]: v };
      const o = other(id);
      if (link && o) n[o] = v;
      return n;
    });
  }, [link]);

  // advanced: a play button swings its control between its usual range, smoothly, until stopped
  useEffect(() => {
    if (!swing) return;
    const c = CONTROL.get(swing)!;
    const [a, b] = c.play ?? [c.min, c.max];
    const t0 = performance.now();
    let raf = 0;
    const tick = () => {
      const t = ((performance.now() - t0) / 1000) * speedK, k = (1 - Math.cos(t * 1.6)) / 2;
      setControl(swing, a + (b - a) * k);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [swing, speedK, setControl]);

  // pose A to pose B
  useEffect(() => {
    if (!poseA || !poseB) return;
    const n: Pose = {};
    for (const c of CONTROLS) n[c.id] = (poseA[c.id] ?? 0) * (1 - morph) + (poseB[c.id] ?? 0) * morph;
    setPoseState(n);
  }, [morph, poseA, poseB]);

  const switchMode = (m: Mode) => {
    setMode(m);
    if (m === "advanced") { setPlaying(false); setMove(null); api.current?.play(null); }
    else setSwing(null);
  };
  const resetAll = () => { setSwing(null); setPoseState(neutral()); setMorph(0); };
  const regionControls = useMemo(() => REGIONS.map((r) => ({ r, cs: CONTROLS.filter((c) => c.region === r) })), []);
  const cur = move ? MOVES.find((m) => m.id === move) : null;
  const usedSources = useMemo(() => [...new Set([...CONTROLS.flatMap((c) => c.src.split(/,\s*/)), "SH7", "SH10", "SH11", "SH13", "SH14", "SH16", "KN8", "KN10", "BM1"])].filter((k) => SOURCES[k]).sort(), []);

  return (
    <div className={`${s.root} ${variant === "page" ? s.page : s.overlay}`}>
      <div ref={stage} className={s.stage}>
        <canvas ref={canvas} className={`${s.canvas} ${state === "ready" ? s.on : ""}`} aria-label="A 3D skeleton with its muscles. Drag to turn it; tap a part to name it." />
        <div className={s.vignette} />
        {state === "loading" && (
          <div className={s.loading} role="status">
            <span className={s.spinner} /> Loading the body
          </div>
        )}
        {state === "failed" && (
          <div className={s.failed} role="status">
            <p>This device could not show the 3D body (it needs WebGL 2). The pages below explain each part with pictures.</p>
          </div>
        )}

        <div ref={top} className={s.top}>
          <div className={s.titles}>
            <span className={s.kick}>Your body in motion</span>
            <div className={s.seg} role="group" aria-label="How much control">
              {(["easy", "advanced"] as Mode[]).map((m) => (
                <button key={m} type="button" className={`${s.segBtn} ${mode === m ? s.segOn : ""}`} aria-pressed={mode === m} onClick={() => switchMode(m)}>
                  {m === "easy" ? "Easy" : "Advanced"}
                </button>
              ))}
            </div>
          </div>
          <div className={s.seg} role="group" aria-label="What to show">
            {LAYERS.map((l) => (
              <button key={l.n} type="button" className={`${s.segBtn} ${layer === l.n ? s.segOn : ""}`} aria-pressed={layer === l.n} onClick={() => setLayer(l.n)}>
                {l.label}
              </button>
            ))}
          </div>
        </div>

        <div ref={panel} className={`${s.panel} ${mode === "advanced" ? s.panelAdv : ""}`}>
          {picked && (
            <div className={s.card} aria-live="polite">
              <span className={s.cardDot} data-kind={picked.kind} />
              <span className={s.cardName}>{picked.name}</span>
              <span className={s.cardKind}>{picked.kind === "bone" ? "Bone" : "Muscle"}</span>
              <button type="button" className={s.iconBtn} aria-label="Clear" onClick={() => { setPicked(null); api.current?.select(null); }}>
                <Icon name="close" size={14} />
              </button>
            </div>
          )}

          {mode === "easy" ? (
            <div className={s.easy}>
              <div className={s.moves} role="group" aria-label="Movements">
                {MOVES.map((m) => (
                  <button key={m.id} type="button" className={`${s.chip} ${move === m.id && playing ? s.chipOn : ""}`} aria-pressed={move === m.id && playing} onClick={() => playMove(move === m.id && playing ? null : m.id)}>
                    {m.label}
                  </button>
                ))}
              </div>
              <p className={s.note}>{cur?.note ?? (playing ? " " : "Pick a movement. Every joint moves within the range measured in real people.")}</p>
              <div className={s.row}>
                <button type="button" className={`${s.play} ${playing ? s.playOn : ""}`} aria-label={playing ? "Pause" : "Play"} onClick={toggle}>
                  <Icon name={playing ? "pause" : "play"} size={18} />
                </button>
                <div className={s.seg} role="group" aria-label="Speed">
                  {SPEEDS.map((x) => (
                    <button key={x.id} type="button" className={`${s.segBtn} ${speed === x.id ? s.segOn : ""}`} aria-pressed={speed === x.id} onClick={() => setSpeed(x.id)}>
                      {x.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className={s.adv}>
              <div className={s.advHead}>
                <label className={s.linkBox}>
                  <input type="checkbox" checked={link} onChange={(e) => setLink(e.target.checked)} /> Move both sides together
                </label>
                <button type="button" className={s.textBtn} onClick={resetAll}>Reset all</button>
              </div>
              <div className={s.regions}>
                {regionControls.filter(({ r }) => !(link && r.startsWith("Left "))).map(({ r, cs }) => (
                  <section key={r} className={s.region}>
                    <button type="button" className={s.regionHead} aria-expanded={open === r} onClick={() => setOpen(open === r ? "" : r)}>
                      <span>{link ? r.replace(/^Right (\w)/, (_, c: string) => c.toUpperCase()) : r}</span>
                      <Icon name={open === r ? "minus" : "plus"} size={14} />
                    </button>
                    {open === r && (
                      <div className={s.controls}>
                        {cs.map((c) => {
                          const v = pose[c.id] ?? 0, label = `${c.label}: ${fmt(v, c.unit)}`;
                          return (
                            <div key={c.id} className={s.ctl}>
                              <div className={s.ctlTop}>
                                <span className={s.ctlName}>{c.label}</span>
                                <span className={s.ctlVal}>{fmt(v, c.unit)}</span>
                                <button type="button" className={`${s.iconBtn} ${swing === c.id ? s.iconOn : ""}`} aria-label={`${swing === c.id ? "Stop" : "Play"} ${c.label}`} onClick={() => setSwing(swing === c.id ? null : c.id)}>
                                  <Icon name={swing === c.id ? "pause" : "play"} size={12} />
                                </button>
                              </div>
                              <input
                                type="range"
                                className={s.range}
                                min={c.min}
                                max={c.max}
                                step={0.5}
                                value={v}
                                aria-label={c.label}
                                aria-valuetext={label}
                                style={{ ["--p" as string]: `${((v - c.min) / (c.max - c.min)) * 100}%`, ["--z" as string]: `${((0 - c.min) / (c.max - c.min)) * 100}%` }}
                                onChange={(e) => { setSwing(null); setControl(c.id, Number(e.target.value)); }}
                              />
                              <div className={s.ends}>
                                <span>{c.neg} {fmt(c.min, c.unit)}</span>
                                <span>{fmt(c.max, c.unit)} {c.pos}</span>
                              </div>
                              {c.note && <p className={s.ctlNote}>{c.note}</p>}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </section>
                ))}
              </div>
              <div className={s.ab}>
                <button type="button" className={s.textBtn} onClick={() => setPoseA({ ...pose })}>{poseA ? "Pose A set" : "Set pose A"}</button>
                <input type="range" className={s.range} min={0} max={1} step={0.01} value={morph} disabled={!poseA || !poseB} aria-label="From pose A to pose B" style={{ ["--p" as string]: `${morph * 100}%`, ["--z" as string]: "0%" }} onChange={(e) => setMorph(Number(e.target.value))} />
                <button type="button" className={s.textBtn} onClick={() => setPoseB({ ...pose })}>{poseB ? "Pose B set" : "Set pose B"}</button>
              </div>
              <button type="button" className={s.srcToggle} aria-expanded={showSrc} onClick={() => setShowSrc(!showSrc)}>
                Where the limits come from
              </button>
              {showSrc && (
                <ul className={s.sources}>
                  {usedSources.map((k) => (
                    <li key={k}>
                      <span className={s.srcId}>{k}</span> {SOURCES[k].study}.{" "}
                      {SOURCES[k].url && (
                        <a href={SOURCES[k].url} target="_blank" rel="noreferrer">
                          Source
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

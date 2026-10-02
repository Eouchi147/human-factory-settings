"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Icon } from "../Icons";

const ease = [0.16, 1, 0.3, 1] as const;
const NEED = 10; // steady intervals before we call it a reading

const median = (a: number[]) => {
  const s = [...a].sort((x, y) => x - y);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const fmt = (n: number) => Math.round(n).toLocaleString("en-US");

function HeartGlyph({ beat }: { beat: number }) {
  return (
    <motion.svg
      key={beat}
      width="88"
      height="80"
      viewBox="0 0 24 22"
      aria-hidden="true"
      initial={{ scale: beat ? 1.16 : 1 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 520, damping: 14 }}
    >
      <path
        d="M12 21s-7.8-4.9-10.3-9.4C-0.2 8.1 1.4 3.6 5.3 2.7c2.4-.6 4.6.6 5.9 2.6.4.6 1.2.6 1.6 0 1.3-2 3.5-3.2 5.9-2.6 3.9.9 5.5 5.4 3.6 8.9C19.8 16.1 12 21 12 21z"
        fill="#FF6A2B"
      />
      <path d="M5.2 6.1c.9-.9 2.3-1.1 3.3-.5" stroke="rgba(255,255,255,.55)" strokeWidth="1.1" strokeLinecap="round" fill="none" />
    </motion.svg>
  );
}

function Verdict({ bpm }: { bpm: number }) {
  const lo = 40, hi = 130;
  const x = (v: number) => `${((Math.min(hi, Math.max(lo, v)) - lo) / (hi - lo)) * 100}%`;
  const band = bpm < 60 ? "low" : bpm > 100 ? "high" : "ok";
  return (
    <div className="stack gap-12">
      <div className="tool-range" aria-hidden="true">
        <span className="tool-range-zone" style={{ left: x(60), width: `calc(${x(100)} - ${x(60)})` }} />
        <span className="tool-range-mark" style={{ left: x(bpm) }} />
        <span className="tool-range-tick" style={{ left: x(60) }}>
          60
        </span>
        <span className="tool-range-tick" style={{ left: x(100) }}>
          100
        </span>
      </div>
      <p className="tool-text">
        {band === "ok" && <>That&apos;s inside the normal resting range for adults: 60 to 100 beats a minute.</>}
        {band === "low" && (
          <>
            That&apos;s below 60. Very fit athletes can rest close to 40. If you&apos;re not a trained athlete and your resting rate is often below 60, talk with a
            health professional.
          </>
        )}
        {band === "high" && (
          <>
            That&apos;s above 100. Did you just move, climb stairs or have coffee? Sit still for 5 minutes and try again. If your resting rate is regularly above
            100, talk with a health professional.
          </>
        )}
      </p>
      <p className="tool-small">
        At this pace your heart beats about <b>{fmt(bpm * 60 * 24)}</b> times a day. It&apos;s especially important to see a health professional if you also faint,
        feel dizzy or are short of breath.
      </p>
    </div>
  );
}

export function PulseCheck() {
  const [mode, setMode] = useState<"tap" | "count">("tap");
  const [taps, setTaps] = useState<number[]>([]);
  const [beat, setBeat] = useState(0);
  // counting mode
  const [left, setLeft] = useState<number | null>(null);
  const [counted, setCounted] = useState(18);
  const [countDone, setCountDone] = useState(false);
  const timer = useRef<number | null>(null);

  const tap = useCallback(() => {
    const now = performance.now();
    setBeat((b) => b + 1);
    setTaps((prev) => {
      if (prev.length && now - prev[prev.length - 1] > 3000) return [now];
      return [...prev, now].slice(-(NEED + 6));
    });
  }, []);

  const intervals = taps
    .slice(1)
    .map((t, i) => t - taps[i])
    .filter((d) => d > 300 && d < 2000);
  const recent = intervals.slice(-NEED);
  const live = recent.length >= 4 ? Math.round(60000 / median(recent)) : null;
  const done = recent.length >= NEED;

  const startCount = () => {
    setCountDone(false);
    setLeft(15);
    if (timer.current) window.clearInterval(timer.current);
    const t0 = performance.now();
    timer.current = window.setInterval(() => {
      const l = 15 - (performance.now() - t0) / 1000;
      if (l <= 0) {
        if (timer.current) window.clearInterval(timer.current);
        setLeft(0);
        setCountDone(true);
      } else setLeft(l);
    }, 100);
  };
  useEffect(() => () => {
    if (timer.current) window.clearInterval(timer.current);
  }, []);

  const reset = () => {
    setTaps([]);
    setLeft(null);
    setCountDone(false);
  };

  return (
    <div className="tool glass">
      <div className="tool-head">
        <span className="kick" style={{ fontSize: 10.5 }}>
          Try it
        </span>
        <h2 className="tool-title">Check your pulse</h2>
        <p className="tool-text">
          Sit still for a minute. Put your index and middle fingers on the inside of your wrist, just below your thumb, until you feel the beat.
        </p>
        <div className="seg" role="radiogroup" aria-label="How to measure" style={{ alignSelf: "flex-start" }}>
          {(
            [
              ["tap", "Tap along"],
              ["count", "Count for 15 s"],
            ] as const
          ).map(([k, l]) => (
            <button
              key={k}
              type="button"
              role="radio"
              aria-checked={mode === k}
              className={mode === k ? "on" : ""}
              onClick={() => {
                setMode(k);
                reset();
              }}
            >
              {mode === k ? <span className="pill" /> : null}
              <span style={{ position: "relative" }}>{l}</span>
            </button>
          ))}
        </div>
      </div>

      {mode === "tap" ? (
        <div className="stack gap-16">
          <button
            type="button"
            className="tool-tap"
            aria-label="Tap with each heartbeat"
            onPointerDown={(e) => {
              e.preventDefault();
              tap();
            }}
            onKeyDown={(e) => {
              if (e.key === " " || e.key === "Enter") {
                e.preventDefault();
                tap();
              }
            }}
          >
            <HeartGlyph beat={beat} />
            <span className="tool-tap-label">{taps.length ? "Tap with each beat" : "Tap here with each beat"}</span>
          </button>
          <div className="tool-progress" aria-hidden="true">
            {Array.from({ length: NEED }, (_, i) => (
              <i key={i} className={i < recent.length ? "on" : ""} />
            ))}
          </div>
          <div aria-live="polite" className="stack gap-12">
            <AnimatePresence mode="wait">
              {live ? (
                <motion.div key={done ? "done" : "live"} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4, ease }}>
                  <div className="tool-big">
                    {live} <span>beats a minute</span>
                  </div>
                  {done ? <Verdict bpm={live} /> : <p className="tool-small">Keep going: {NEED - recent.length} more taps for a steady reading.</p>}
                </motion.div>
              ) : (
                <motion.p key="wait" className="tool-small" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  Your number appears after a few taps. Nothing is stored or sent.
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>
      ) : (
        <div className="stack gap-16">
          {/* read aloud only when the timer starts and when it ends, not every second while people count */}
          <p className="visually-hidden" aria-live="polite">
            {countDone ? "Time is up. How many beats did you count?" : left !== null ? "Timer started: count every beat for 15 seconds." : ""}
          </p>
          {left === null ? (
            <button type="button" className="btn btn-signal" style={{ alignSelf: "flex-start" }} onClick={startCount}>
              <Icon name="clock" size={16} />
              Start the 15-second timer
            </button>
          ) : !countDone ? (
            <div className="tool-big">
              {Math.ceil(left)} <span>seconds left: count every beat</span>
            </div>
          ) : (
            <div className="stack gap-12">
              <label className="tool-small" htmlFor="pulse-count">
                How many beats did you count?
              </label>
              <div className="row-wrap gap-10">
                <button type="button" className="icon-btn" aria-label="One fewer" onClick={() => setCounted((c) => Math.max(5, c - 1))}>
                  −
                </button>
                <input
                  id="pulse-count"
                  className="tool-input"
                  inputMode="numeric"
                  value={counted}
                  onChange={(e) => {
                    const n = parseInt(e.target.value.replace(/\D/g, ""), 10);
                    if (!Number.isNaN(n)) setCounted(Math.min(60, n));
                  }}
                />
                <button type="button" className="icon-btn" aria-label="One more" onClick={() => setCounted((c) => Math.min(60, c + 1))}>
                  +
                </button>
                <span className="tool-small">beats in 15 seconds, times 4</span>
              </div>
              {counted >= 5 ? (
                <>
                  <div className="tool-big">
                    {counted * 4} <span>beats a minute</span>
                  </div>
                  <Verdict bpm={counted * 4} />
                </>
              ) : null}
            </div>
          )}
        </div>
      )}

      <div className="tool-foot">
        <span className="tool-small">
          For adults and children over 10, at rest. Younger children&apos;s hearts beat faster. Sources:{" "}
          <a href="https://www.mayoclinic.org/healthy-lifestyle/fitness/expert-answers/heart-rate/faq-20057979" target="_blank" rel="noopener noreferrer">
            Mayo Clinic
          </a>
          ,{" "}
          <a href="https://medlineplus.gov/ency/article/003399.htm" target="_blank" rel="noopener noreferrer">
            MedlinePlus
          </a>
          .
        </span>
        {taps.length || left !== null ? (
          <button type="button" className="btn btn-ghost btn-sm" onClick={reset} style={{ marginLeft: "auto" }}>
            <Icon name="redo" size={15} />
            Start again
          </button>
        ) : null}
      </div>
    </div>
  );
}

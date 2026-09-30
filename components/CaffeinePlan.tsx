"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { ClockRing } from "./SleepViz";

const BEDS = [21.5, 22, 22.5, 23, 23.5, 24];
const fmt = (h: number) => `${String(Math.floor(h % 24)).padStart(2, "0")}:${h % 1 ? "30" : "00"}`;
const KEY = "hfs-plan-caffeine";

export function CaffeinePlan({ dialClass, bedsClass }: { dialClass: string; bedsClass: string }) {
  const [bed, setBed] = useState(23);
  const [done, setDone] = useState<boolean[]>([false, false, false, false, false]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) {
        const v = JSON.parse(raw);
        if (typeof v.bed === "number" && BEDS.includes(v.bed)) setBed(v.bed);
        if (Array.isArray(v.done) && v.done.length === 5) setDone(v.done.map(Boolean));
      }
    } catch {
      /* per-device convenience only */
    }
  }, []);

  const save = (b: number, d: boolean[]) => {
    try {
      window.localStorage.setItem(KEY, JSON.stringify({ bed: b, done: d }));
    } catch {
      /* ignore */
    }
  };

  const cutoff = bed - 6;
  const steps = [
    { t: "Set your cutoff: 6 hours before bed", d: `Bed at ${fmt(bed)} means your last caffeine by ${fmt(cutoff)}.` },
    { t: "Find the hidden caffeine", d: "Tea, cola, energy drinks, pre-workout, chocolate, some pain relievers." },
    { t: "Swap the afternoon cup", d: "Decaf, herbal tea, water, or a 10-minute walk outside." },
    { t: "Track 7 nights", d: "How long you take to fall asleep, and how rested you feel on waking." },
    { t: "Keep it, or move it earlier", d: "Still sleeping badly after a week? Try 8 hours." },
  ];
  const count = done.filter(Boolean).length;

  return (
    <>
      <div className={`card ${dialClass}`}>
        <div className="kick">Your caffeine-free window</div>
        <ClockRing from={cutoff} to={bed} size={260} />
        <div className="stack gap-8" style={{ alignItems: "center" }}>
          <span className="cap">When do you go to bed?</span>
          <div className={bedsClass} role="radiogroup" aria-label="Bedtime">
            {BEDS.map((b) => (
              <button
                key={b}
                type="button"
                role="radio"
                aria-checked={bed === b}
                className={`chip ${bed === b ? "on" : ""}`}
                onClick={() => {
                  setBed(b);
                  save(b, done);
                }}
              >
                {fmt(b)}
              </button>
            ))}
          </div>
        </div>
        <p style={{ margin: 0, textAlign: "center", fontSize: 15, color: "var(--ink2)" }}>
          Last caffeine by <b style={{ color: "var(--ink)" }}>{fmt(cutoff)}</b>.
        </p>
      </div>

      <div className="glass" style={{ borderRadius: 22, padding: "6px 18px" }}>
        <div className="cap" style={{ padding: "12px 0 6px", display: "flex", justifyContent: "space-between" }}>
          <span>Your plan</span>
          <span style={{ color: "var(--ink)" }}>
            {count} of 5 done
          </span>
        </div>
        {steps.map((s, k) => (
          <button
            key={s.t}
            type="button"
            role="checkbox"
            aria-checked={done[k]}
            className={`step ${done[k] ? "on" : ""}`}
            onClick={() => {
              const n = done.slice();
              n[k] = !n[k];
              setDone(n);
              save(bed, n);
            }}
          >
            <span className="box" aria-hidden="true">
              <motion.svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" initial={false} animate={{ scale: done[k] ? 1 : 0.4, opacity: done[k] ? 1 : 0 }} transition={{ type: "spring", stiffness: 600, damping: 28 }}>
                <path d="M5 12.5l4.5 4.5L19 7.5" />
              </motion.svg>
            </span>
            <span style={{ display: "flex", flexDirection: "column" }}>
              <span className="st">{s.t}</span>
              <span className="sd">{s.d}</span>
            </span>
          </button>
        ))}
        <p className="cap" style={{ margin: "4px 0 14px", textTransform: "none", letterSpacing: ".02em" }}>
          Your ticks stay on this device only.
        </p>
      </div>
    </>
  );
}

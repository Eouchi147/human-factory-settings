"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "motion/react";
import { Icon } from "../Icons";
import { clock12 } from "@/lib/time";

const WAKES = [5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9];

/** The film's three settings, set for your alarm: in bed 8 hours before it, last coffee 9 hours before bed, lights low 3 hours before bed. */
export function TonightPlan() {
  const [wake, setWake] = useState(7);
  const [done, setDone] = useState([false, false, false]);
  const bed = wake - 8 + 24; // 7 hours of sleep, plus up to 30 minutes to fall asleep and 20 awake (National Sleep Foundation)
  const cutoff = bed - 9; // Gardiner et al. 2023: a regular coffee at least 8.8 hours before bed
  const lights = bed - 3; // Brown et al. 2022: low light for at least 3 hours before bed
  const steps = [
    { t: `In bed by ${clock12(bed)}`, d: "8 hours before your alarm: time to fall asleep and still sleep 7 hours or more." },
    { t: `Last coffee by ${clock12(cutoff)}`, d: "9 hours before bed. A review of 24 studies found a regular coffee any later can cut into your sleep." },
    { t: `Lights low from ${clock12(lights)}`, d: "3 hours before bed. Even ordinary room light in the evening delays the hormone that makes you sleepy." },
  ];
  return (
    <div className="tool glass">
      <div className="tool-head">
        <span className="kick" style={{ fontSize: 10.5 }}>
          Your plan for tonight
        </span>
        <label className="tool-text" htmlFor="tp-wake">
          What time does your alarm go off?
        </label>
        <div className="row-wrap gap-8" role="radiogroup" aria-label="Alarm time" id="tp-wake">
          {WAKES.map((w) => (
            <button key={w} type="button" role="radio" aria-checked={wake === w} className={`chip ${wake === w ? "on" : ""}`} onClick={() => setWake(w)}>
              {clock12(w)}
            </button>
          ))}
        </div>
      </div>
      <div>
        {steps.map((s, k) => (
          <button
            key={k}
            type="button"
            role="checkbox"
            aria-checked={done[k]}
            className={`step ${done[k] ? "on" : ""}`}
            onClick={() => setDone(done.map((v, i) => (i === k ? !v : v)))}
          >
            <span className="box" aria-hidden="true">
              <motion.svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" initial={false} animate={{ scale: done[k] ? 1 : 0.4, opacity: done[k] ? 1 : 0 }}>
                <path d="M5 12.5l4.5 4.5L19 7.5" />
              </motion.svg>
            </span>
            <span style={{ display: "flex", flexDirection: "column" }}>
              <span className="st" style={{ fontSize: 16.5 }}>
                {s.t}
              </span>
              <span className="sd" style={{ fontSize: 14.5 }}>
                {s.d}
              </span>
            </span>
          </button>
        ))}
      </div>
      <Link href="/tools#caffeine" className="explorer-more">
        See how much caffeine is still in you at bedtime
        <Icon name="arrow" size={15} />
      </Link>
    </div>
  );
}

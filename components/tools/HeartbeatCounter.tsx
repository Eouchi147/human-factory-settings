"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import { Icon } from "../Icons";

const BPM = 75; // the pace OpenStax uses for its day, year and lifetime figures
const PER_YEAR = BPM * 60 * 24 * 365.25;

function words(n: number) {
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)} billion`;
  if (n >= 1e6) return `${Math.round(n / 1e6)} million`;
  return Math.round(n).toLocaleString("en-US");
}

/** "How many times has your heart beaten?" Age in, an estimate out, then a live count that keeps going. */
export function HeartbeatCounter() {
  const [age, setAge] = useState(30);
  const base = useMemo(() => age * PER_YEAR, [age]);
  const [extra, setExtra] = useState(0);
  const [pulse, setPulse] = useState(0);
  const t0 = useRef(0);

  useEffect(() => {
    t0.current = performance.now();
    setExtra(0);
    const id = window.setInterval(() => {
      const beats = Math.floor(((performance.now() - t0.current) / 60000) * BPM);
      setExtra((e) => {
        if (beats !== e) setPulse((p) => p + 1);
        return beats;
      });
    }, 100);
    return () => window.clearInterval(id);
  }, [age]);

  return (
    <div className="tool glass">
      <div className="tool-head">
        <span className="kick" style={{ fontSize: 10.5 }}>
          Try it
        </span>
        <h2 className="tool-title">How many times has your heart beaten?</h2>
        <label className="tool-text" htmlFor="hb-age">
          Your age: <b style={{ color: "var(--ink)" }}>{age}</b>
        </label>
        <input id="hb-age" className="tool-slider" type="range" min={1} max={100} value={age} onChange={(e) => setAge(Number(e.target.value))} />
      </div>
      {/* only the total is announced; the running count below changes every beat */}
      <div className="stack gap-8">
        <div className="tool-big" aria-live="polite">
          about {words(base)} <span>times</span>
        </div>
        <div className="row-wrap gap-10" style={{ color: "var(--ink2)" }}>
          <motion.span
            key={pulse}
            initial={{ scale: 1.25 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 14 }}
            style={{ display: "inline-flex", color: "var(--signal-ink)" }}
            aria-hidden="true"
          >
            <Icon name="dot" size={14} />
          </motion.span>
          <span className="tool-small" style={{ margin: 0 }}>
            And counting: <b style={{ color: "var(--ink)" }}>{extra}</b> more since you opened this.
          </span>
        </div>
      </div>
      <p className="tool-small">
        Worked out at {BPM} beats a minute, the pace textbooks use: about 108,000 beats a day and nearly 3 billion in a 75-year life. Babies and young children have
        faster hearts, so your real total is probably a little higher.
      </p>
      <div className="tool-foot">
        <span className="tool-small">
          Source:{" "}
          <a href="https://openstax.org/books/anatomy-and-physiology-2e/pages/19-1-heart-anatomy" target="_blank" rel="noopener noreferrer">
            OpenStax Anatomy and Physiology, 19.1
          </a>
          .
        </span>
      </div>
    </div>
  );
}

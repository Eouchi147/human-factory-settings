"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "motion/react";
import { Icon } from "../Icons";

/** A short plan to tick off: each step says what to do and why, in one line each. */
export function Plan({ title, steps, more }: { title: string; steps: { t: string; d: string }[]; more?: { href: string; label: string } }) {
  const [done, setDone] = useState(() => steps.map(() => false));
  return (
    <div className="tool glass">
      <div className="tool-head">
        <span className="kick" style={{ fontSize: 10.5 }}>
          {title}
        </span>
      </div>
      <div>
        {steps.map((s, k) => (
          <button
            key={s.t}
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
      {more ? (
        <Link href={more.href} className="explorer-more">
          {more.label}
          <Icon name="arrow" size={15} />
        </Link>
      ) : null}
    </div>
  );
}

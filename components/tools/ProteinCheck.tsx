"use client";

import { useState } from "react";

type Who = "adult" | "active" | "older";
const WHO: { k: Who; label: string; lo: number; hi: number; note: string }[] = [
  { k: "adult", label: "Healthy adult", lo: 0.83, hi: 0.83, note: "Europe's reference intake covers nearly all healthy adults." },
  { k: "active", label: "Training or losing weight", lo: 1.2, hi: 1.6, note: "People who train or are losing weight do better on 1.2 to 1.6 g per kg, spread over the day." },
  { k: "older", label: "Over 65", lo: 1.0, hi: 1.2, note: "At least 1.0 to 1.2 g per kg; 1.2 or more if you're active." },
];

/** Daily protein from body weight, using the numbers in the supplements guide. */
export function ProteinCheck() {
  const [unit, setUnit] = useState<"kg" | "lb">("kg");
  const [w, setW] = useState(70);
  const [who, setWho] = useState<Who>("active");
  const kg = unit === "kg" ? w : w * 0.4536;
  const g = WHO.find((x) => x.k === who)!;
  const lo = Math.round(kg * g.lo);
  const hi = Math.round(kg * g.hi);
  const meals = Math.max(2, Math.min(5, Math.round(hi / 27)));

  const switchUnit = (u: "kg" | "lb") => {
    if (u === unit) return;
    setW(Math.round(u === "lb" ? w / 0.4536 : w * 0.4536));
    setUnit(u);
  };

  return (
    <div className="tool glass">
      <div className="tool-head">
        <span className="kick" style={{ fontSize: 10.5 }}>
          Try it
        </span>
        <h3 className="tool-title">How much protein do you need a day?</h3>
        <div className="row-wrap gap-8">
          {WHO.map((x) => (
            <button key={x.k} type="button" className={`chip ${who === x.k ? "on" : ""}`} aria-pressed={who === x.k} onClick={() => setWho(x.k)}>
              {x.label}
            </button>
          ))}
        </div>
        <div className="seg" role="radiogroup" aria-label="Unit" style={{ alignSelf: "flex-start" }}>
          {(["kg", "lb"] as const).map((u) => (
            <button key={u} type="button" role="radio" aria-checked={unit === u} className={unit === u ? "on" : ""} onClick={() => switchUnit(u)}>
              {unit === u ? <span className="pill" /> : null}
              <span style={{ position: "relative" }}>{u === "kg" ? "Kilograms" : "Pounds"}</span>
            </button>
          ))}
        </div>
        <label className="tool-text" htmlFor="pc-w">
          Your weight: <b style={{ color: "var(--ink)" }}>{w} {unit}</b>
        </label>
        <input id="pc-w" className="tool-slider" type="range" min={unit === "kg" ? 40 : 88} max={unit === "kg" ? 160 : 353} value={w} onChange={(e) => setW(Number(e.target.value))} />
      </div>
      <div className="stack gap-8" aria-live="polite">
        <div className="tool-big">
          {lo === hi ? `about ${lo} g` : `${lo} to ${hi} g`} <span>of protein a day</span>
        </div>
        <p className="tool-text">{g.note}</p>
        <p className="tool-small">
          Spread it out: about 25 to 30 g per meal, so roughly <b>{meals} meals</b> with a good protein food. Food does the job; powder is only a convenience.
        </p>
      </div>
      <div className="tool-foot">
        <span className="tool-small">
          Sources:{" "}
          <a href="https://www.efsa.europa.eu/sites/default/files/2017_09_DRVs_summary_report.pdf" target="_blank" rel="noopener noreferrer">
            EFSA
          </a>
          ,{" "}
          <a href="https://cdn.realfood.gov/DGA.pdf" target="_blank" rel="noopener noreferrer">
            US Dietary Guidelines 2025 to 2030
          </a>
          ,{" "}
          <a href="https://doi.org/10.1016/j.jamda.2013.05.021" target="_blank" rel="noopener noreferrer">
            PROT-AGE
          </a>
          ,{" "}
          <a href="https://doi.org/10.3945/ajcn.114.084038" target="_blank" rel="noopener noreferrer">
            Leidy 2015
          </a>
          . If you have kidney disease, your doctor sets your target.
        </span>
      </div>
    </div>
  );
}

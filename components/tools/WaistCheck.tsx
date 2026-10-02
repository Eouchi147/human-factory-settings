"use client";

import { useState } from "react";

/** NICE NG246 waist-to-height bands for adults with a BMI under 35. The ratio has no units, so any unit works. */
export function WaistCheck() {
  const [unit, setUnit] = useState<"cm" | "in">("cm");
  const [height, setHeight] = useState(175);
  const [waist, setWaist] = useState(84);
  const ratio = height > 0 ? waist / height : 0;
  const r = Math.round(ratio * 100) / 100;
  const band = r < 0.4 ? "under" : r < 0.5 ? "healthy" : r < 0.6 ? "increased" : "high";
  const lo = 0.3, hi = 0.8;
  const x = (v: number) => `${((Math.min(hi, Math.max(lo, v)) - lo) / (hi - lo)) * 100}%`;

  const switchUnit = (u: "cm" | "in") => {
    if (u === unit) return;
    const f = u === "in" ? 1 / 2.54 : 2.54;
    setHeight(Math.round(height * f));
    setWaist(Math.round(waist * f));
    setUnit(u);
  };

  return (
    <div className="tool glass">
      <div className="tool-head">
        <span className="kick" style={{ fontSize: 10.5 }}>
          Try it
        </span>
        <h2 className="tool-title">Is your waist less than half your height?</h2>
        <p className="tool-text">
          Wrap a tape around your middle, halfway between your lowest rib and the top of your hip (just above your belly button). Breathe out normally, then measure.
          Use the same unit for both numbers.
        </p>
        <div className="seg" role="radiogroup" aria-label="Unit" style={{ alignSelf: "flex-start" }}>
          {(["cm", "in"] as const).map((u) => (
            <button key={u} type="button" role="radio" aria-checked={unit === u} className={unit === u ? "on" : ""} onClick={() => switchUnit(u)}>
              {unit === u ? <span className="pill" /> : null}
              <span style={{ position: "relative" }}>{u === "cm" ? "Centimetres" : "Inches"}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="stack gap-12">
        <label className="tool-text" htmlFor="wc-h">
          Height: <b style={{ color: "var(--ink)" }}>{height} {unit}</b>
        </label>
        <input id="wc-h" className="tool-slider" type="range" min={unit === "cm" ? 120 : 47} max={unit === "cm" ? 220 : 87} value={height} onChange={(e) => setHeight(Number(e.target.value))} />
        <label className="tool-text" htmlFor="wc-w">
          Waist: <b style={{ color: "var(--ink)" }}>{waist} {unit}</b>
        </label>
        <input id="wc-w" className="tool-slider" type="range" min={unit === "cm" ? 50 : 20} max={unit === "cm" ? 160 : 63} value={waist} onChange={(e) => setWaist(Number(e.target.value))} />
      </div>
      <div className="stack gap-10" aria-live="polite">
        <div className="tool-big">
          {r.toFixed(2)} <span>waist ÷ height</span>
        </div>
        <div className="tool-range" aria-hidden="true">
          <span className="tool-range-zone" style={{ left: x(0.4), width: `calc(${x(0.5)} - ${x(0.4)})` }} />
          <span className="tool-range-mark" style={{ left: x(r) }} />
          <span className="tool-range-tick" style={{ left: x(0.4) }}>
            0.4
          </span>
          <span className="tool-range-tick" style={{ left: x(0.5) }}>
            0.5
          </span>
          <span className="tool-range-tick" style={{ left: x(0.6) }}>
            0.6
          </span>
        </div>
        <p className="tool-text">
          {band === "healthy" && <>Healthy range (0.4 to 0.49). Your waist is less than half your height.</>}
          {band === "increased" && <>Increased health risk (0.5 to 0.59). Aim to bring your waist under half your height.</>}
          {band === "high" && <>High health risk (0.6 or more). This is worth talking about with a doctor or nurse.</>}
          {band === "under" && <>Under 0.4. NICE&apos;s healthy range starts at 0.4; if you worry you may be underweight, talk with a doctor.</>}
        </p>
      </div>
      <div className="tool-foot">
        <span className="tool-small">
          For adults with a BMI under 35. A quick check, not a diagnosis. Source:{" "}
          <a href="https://www.nice.org.uk/guidance/NG246/chapter/Identifying-and-assessing-overweight-obesity-and-central-adiposity" target="_blank" rel="noopener noreferrer">
            NICE NG246
          </a>
          .
        </span>
      </div>
    </div>
  );
}

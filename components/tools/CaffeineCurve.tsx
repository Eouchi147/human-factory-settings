"use client";

import { clock12 } from "@/lib/time";

import { useEffect, useMemo, useState } from "react";
import { Icon } from "../Icons";

/* Typical caffeine per serving, from EFSA's caffeine topic page. */
export const DRINKS = [
  { id: "filter", name: "Filter coffee", serving: "200 ml cup", mg: 90 },
  { id: "espresso", name: "Espresso", serving: "60 ml", mg: 80 },
  { id: "tea", name: "Black tea", serving: "220 ml cup", mg: 50 },
  { id: "cola", name: "Cola", serving: "355 ml can", mg: 40 },
  { id: "energy", name: "Energy drink", serving: "250 ml can", mg: 80 },
  { id: "dark", name: "Dark chocolate", serving: "50 g bar", mg: 25 },
  { id: "milk", name: "Milk chocolate", serving: "50 g bar", mg: 10 },
] as const;
type DrinkId = (typeof DRINKS)[number]["id"];
type Item = { key: number; id: DrinkId; at: number };

const START = 6; // the chart runs from 06:00 to 06:00 the next morning
const TIMES = Array.from({ length: 36 }, (_, i) => 6 + i * 0.5); // 06:00 to 23:30
const hhmm = (h: number) => clock12(h);
const byId = (id: DrinkId) => DRINKS.find((d) => d.id === id)!;

/** Caffeine still in the body at hour t (a simple model: absorbed over 45 minutes, cleared with the chosen half-life). */
function amountAt(items: Item[], t: number, half: number) {
  let sum = 0;
  for (const it of items) {
    const dt = t - it.at;
    if (dt <= 0) continue;
    sum += byId(it.id).mg * Math.min(1, dt / 0.75) * Math.pow(0.5, dt / half);
  }
  return sum;
}

function useNarrow() {
  const [n, setN] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 600px)");
    const on = () => setN(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return n;
}

const BEDS = [21.5, 22, 22.5, 23, 23.5, 24];

export function CaffeineCurve({ bed: bedProp }: { bed?: number }) {
  const narrow = useNarrow();
  const [bedOwn, setBedOwn] = useState(23);
  const bed = bedProp ?? bedOwn;
  const [items, setItems] = useState<Item[]>([
    { key: 1, id: "filter", at: 8 },
    { key: 2, id: "filter", at: 13 },
    { key: 3, id: "tea", at: 16 },
  ]);
  const [half, setHalf] = useState(5);
  const [nextKey, setNextKey] = useState(4);

  const add = (id: DrinkId) => {
    const last = items.reduce((m, i) => Math.max(m, i.at), 6);
    const at = Math.min(22, items.length ? last + 2 : 8);
    setItems([...items, { key: nextKey, id, at }].sort((a, b) => a.at - b.at));
    setNextKey(nextKey + 1);
  };
  const setTime = (key: number, at: number) => setItems(items.map((i) => (i.key === key ? { ...i, at } : i)).sort((a, b) => a.at - b.at));
  const remove = (key: number) => setItems(items.filter((i) => i.key !== key));

  const atBed = Math.round(amountAt(items, bed, half));
  const total = items.reduce((s, i) => s + byId(i.id).mg, 0);
  const cutoff = bed - 9; // Gardiner et al. 2023: a regular coffee at least 8.8 hours before bed
  const late = items.filter((i) => i.at > cutoff);

  // chart geometry
  const W = narrow ? 360 : 640, H = narrow ? 240 : 250, L = narrow ? 32 : 42, R = narrow ? 8 : 14, T = 16, B = 30;
  const fs = narrow ? 10.5 : 10;
  const peak = useMemo(() => {
    let m = 0;
    for (let t = START; t <= START + 24; t += 1 / 6) m = Math.max(m, amountAt(items, t, half));
    return m;
  }, [items, half]);
  const yMax = Math.max(150, Math.ceil((peak * 1.15) / 50) * 50);
  const X = (t: number) => L + ((t - START) / 24) * (W - L - R);
  const Y = (mg: number) => T + (1 - mg / yMax) * (H - T - B);
  const pts: string[] = [];
  for (let t = START; t <= START + 24.001; t += 1 / 6) pts.push(`${X(t).toFixed(1)},${Y(amountAt(items, t, half)).toFixed(1)}`);
  const area = `${X(START)},${Y(0)} ${pts.join(" ")} ${X(START + 24)},${Y(0)}`;

  return (
    <div className="tool glass" style={{ gap: 18 }}>
      <div className="tool-head">
        <span className="kick" style={{ fontSize: 10.5 }}>
          Try it
        </span>
        <h3 className="tool-title">How much caffeine is still in you at bedtime?</h3>
        <p className="tool-text">Add what you drink in a normal day and when. The curve shows how much caffeine is in your body, hour by hour.</p>
      </div>

      {bedProp === undefined ? (
        <div className="stack gap-8">
          <span className="tool-text">When do you go to bed?</span>
          <div className="row-wrap gap-8" role="radiogroup" aria-label="Bedtime">
            {BEDS.map((b) => (
              <button key={b} type="button" role="radio" aria-checked={bed === b} className={`chip ${bed === b ? "on" : ""}`} onClick={() => setBedOwn(b)}>
                {hhmm(b)}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="tool-drinks" role="group" aria-label="Add a drink">
        {DRINKS.map((d) => (
          <button key={d.id} type="button" className="chip" onClick={() => add(d.id)}>
            <Icon name="cup" size={15} />
            {d.name}
            <span style={{ color: "var(--ink3)", fontWeight: 500 }}>{d.mg} mg</span>
          </button>
        ))}
      </div>

      {items.length ? (
        <ul className="tool-list">
          {items.map((i) => {
            const d = byId(i.id);
            return (
              <li key={i.key}>
                <span className="tool-list-name">
                  {d.name}
                  <span>
                    {d.serving}, about {d.mg} mg
                  </span>
                </span>
                <select aria-label={`Time for ${d.name}`} className="tool-select" value={i.at} onChange={(e) => setTime(i.key, Number(e.target.value))}>
                  {TIMES.map((t) => (
                    <option key={t} value={t}>
                      {hhmm(t)}
                    </option>
                  ))}
                </select>
                <button type="button" className="icon-btn" aria-label={`Remove ${d.name}`} onClick={() => remove(i.key)} style={{ width: 36, height: 36 }}>
                  <Icon name="close" size={14} />
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="tool-small">Tap a drink above to add it.</p>
      )}

      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`Caffeine in your body across the day. At bedtime, ${hhmm(bed)}, about ${atBed} milligrams.`}>
        {[0, 50, 100, 150, 200, 250, 300, 350, 400].filter((v) => v <= yMax).map((v) => (
          <g key={v}>
            <line x1={L} x2={W - R} y1={Y(v)} y2={Y(v)} stroke="rgba(236,238,241,.07)" />
            <text x={L - 8} y={Y(v) + 3.5} textAnchor="end" fontSize={fs} fill="rgba(236,238,241,.5)" fontFamily="var(--font-mono)">
              {v}
            </text>
          </g>
        ))}
        <text x={L - 8} y={T - 4} textAnchor="end" fontSize={fs - 0.5} fill="rgba(236,238,241,.5)" fontFamily="var(--font-mono)">
          mg
        </text>
        {(narrow ? [6, 12, 18, 24, 30] : [6, 9, 12, 15, 18, 21, 24, 27, 30]).map((t) => (
          <text key={t} x={X(t)} y={H - 10} textAnchor="middle" fontSize={fs} fill="rgba(236,238,241,.5)" fontFamily="var(--font-mono)">
            {hhmm(t)}
          </text>
        ))}
        <rect x={X(cutoff)} y={T} width={Math.max(0, X(bed) - X(cutoff))} height={H - T - B} fill="rgba(181,156,240,.06)" />
        <line x1={L} x2={W - R} y1={Y(100)} y2={Y(100)} stroke="rgba(255,122,61,.55)" strokeDasharray="4 5" />
        <text x={W - R} y={Y(100) - 6} textAnchor="end" fontSize={fs} fill="rgba(255,122,61,.9)" fontFamily="var(--font-mono)">
          100 mg
        </text>
        <polygon points={area} fill="rgba(255,106,43,.14)" />
        <polyline points={pts.join(" ")} fill="none" stroke="#FF6A2B" strokeWidth="2.4" strokeLinejoin="round" />
        <line x1={X(bed)} x2={X(bed)} y1={T} y2={H - B} stroke="#ECEEF1" strokeDasharray="2 4" />
        <circle cx={X(bed)} cy={Y(atBed)} r="5" fill="#ECEEF1" />
        <text x={X(bed) + 8} y={T + 12} fontSize={fs + 0.5} fontWeight="600" fill="#ECEEF1" fontFamily="var(--font-mono)">
          BED {hhmm(bed)}
        </text>
        <text x={X(cutoff) + 6} y={H - B - 8} fontSize={fs - 0.5} fill="#C9B6F5" fontFamily="var(--font-mono)">
          last 9 h
        </text>
      </svg>

      <div className="stack gap-8" aria-live="polite">
        <div className="tool-big">
          about {atBed} mg <span>still in you at {hhmm(bed)}</span>
        </div>
        <p className="tool-text">
          {atBed >= 100 ? (
            <>
              That&apos;s over 100 mg. Europe&apos;s food safety agency (EFSA) says 100 mg close to bedtime can affect sleep in some adults.
              {late.length ? <> Moving your last drink before {hhmm(cutoff)} would help most.</> : null}
            </>
          ) : atBed >= 40 ? (
            <>
              Under 100 mg, the amount EFSA says can affect sleep in some adults, but not zero.
              {late.length ? <> Anything after {hhmm(cutoff)} is the first thing to move.</> : null}
            </>
          ) : (
            <>Very little left by bedtime. If you still sleep badly, caffeine is probably not the main reason.</>
          )}
        </p>
        <p className="tool-small">
          Today&apos;s total: <b style={{ color: "var(--ink)" }}>{total} mg</b>. EFSA: up to 400 mg a day is fine for healthy adults, but 200 mg a day in pregnancy.
        </p>
      </div>

      <div className="stack gap-8">
        <label className="tool-text" htmlFor="cc-half">
          How fast your body clears caffeine: half is gone after <b style={{ color: "var(--ink)" }}>{half.toFixed(1)} hours</b>
        </label>
        <input id="cc-half" className="tool-slider" type="range" min={1.5} max={9.5} step={0.5} value={half} onChange={(e) => setHalf(Number(e.target.value))} />
        <div className="tool-scale">
          <span>Fast: 1.5 h</span>
          <span>Average: 5 h</span>
          <span>Slow: 9.5 h</span>
        </div>
        <p className="tool-small">It varies a lot between people. Smoking speeds it up; the contraceptive pill can double it.</p>
      </div>

      <div className="tool-foot">
        <span className="tool-small">
          A simple model: real amounts vary with the brew and the cup. Sources:{" "}
          <a href="https://www.efsa.europa.eu/en/topics/topic/caffeine" target="_blank" rel="noopener noreferrer">
            EFSA
          </a>{" "}
          (amounts, limits),{" "}
          <a href="https://www.ncbi.nlm.nih.gov/books/NBK223808/" target="_blank" rel="noopener noreferrer">
            Institute of Medicine 2001
          </a>{" "}
          (how fast it clears).
        </span>
      </div>
    </div>
  );
}

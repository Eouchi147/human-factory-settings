/* Drawings for the sleep story and the caffeine plan. Pure SVG, measured in their own units. */

import { clock12 } from "@/lib/time";

const MONO = "var(--font-geist-mono), ui-monospace, monospace";
const SANS = "var(--font-archivo), system-ui, sans-serif";

/** 24-hour dial, 00 at the top. The orange arc is the caffeine-free window before bed. */
export function ClockRing({ from, to, size = 220, center, sub = "CAFFEINE-FREE", labels }: { from: number; to: number; size?: number; center?: string; sub?: string; labels?: [string, string] }) {
  const cx = 110, cy = 104, r = 66;
  const rr = r * 1.1;
  const pt = (h: number, rad: number) => {
    const a = ((h * 15 - 90) * Math.PI) / 180;
    // rounded, so the server and the browser print the same numbers (no hydration mismatch)
    return [+(cx + rad * Math.cos(a)).toFixed(2), +(cy + rad * Math.sin(a)).toFixed(2)];
  };
  const ticks = [];
  for (let k = 0; k < 24; k++) {
    const [x1, y1] = pt(k, r * (k % 6 === 0 ? 0.8 : 0.87));
    const [x2, y2] = pt(k, r * 0.93);
    ticks.push(<line key={k} x1={x1} y1={y1} x2={x2} y2={y2} stroke={`rgba(236,238,241,${k % 6 === 0 ? 0.6 : 0.25})`} strokeWidth="1.2" />);
  }
  const sweep = (((to - from) % 24) + 24) % 24;
  const centre = center ?? `${Math.round(sweep * 10) / 10} h`;
  const [ax, ay] = pt(from, rr);
  const [bx, by] = pt(to, rr);
  const large = sweep * 15 > 180 ? 1 : 0;
  const [l0x, l0y] = pt(from, rr + 20);
  const [l1x, l1y] = pt(to, rr + 20);
  const [lab0, lab1] = labels ?? [clock12(from), clock12(to)];
  return (
    <svg width={size} height={(size * 212) / 220} viewBox="0 0 220 212" role="img" aria-label={`A 24-hour dial with a ${centre} window from ${lab0} to ${lab1}`}>
      <circle cx={cx} cy={cy} r={r} fill="rgba(18,21,26,.6)" stroke="rgba(236,238,241,.18)" strokeWidth="1" />
      {ticks}
      <path d={`M${ax},${ay} A${rr},${rr} 0 ${large} 1 ${bx},${by}`} fill="none" stroke="#FF6A2B" strokeWidth="5" strokeLinecap="round" />
      {[0, 12].map((h) => {
        const [x, y] = pt(h, r * 0.64);
        return (
          <text key={h} x={x} y={y + 3.5} textAnchor="middle" fontFamily={MONO} fontSize="9.5" fill="rgba(236,238,241,.5)">
            {h === 0 ? "midnight" : "noon"}
          </text>
        );
      })}
      <text x={l0x} y={l0y + 4} textAnchor="middle" fontFamily={MONO} fontSize="11" fontWeight="600" fill="#ECEEF1">
        {lab0}
      </text>
      <text x={l1x} y={l1y + 4} textAnchor="middle" fontFamily={MONO} fontSize="11" fontWeight="600" fill="#ECEEF1">
        {lab1}
      </text>
      <text x={cx} y={cy + 4} textAnchor="middle" fontFamily={SANS} fontSize="28" fontWeight="650" fill="#ECEEF1">
        {centre}
      </text>
      <text x={cx} y={cy + 20} textAnchor="middle" fontFamily={MONO} fontSize="8" letterSpacing=".9" fill="#FF7A3D">
        {sub}
      </text>
    </svg>
  );
}

/** Share of a caffeine dose left in the blood over the next 14 hours, for half-lives of 1.5, 5 and 9.5 hours. */
export function HalfLifeChart({ start = 17, bed = 23 }: { start?: number; bed?: number }) {
  const W = 520, H = 300, L = 46, R = 18, T = 26, B = 42;
  const hours = 14;
  const X = (t: number) => L + (t / hours) * (W - L - R);
  const Y = (p: number) => T + (1 - p / 100) * (H - T - B);
  const curve = (half: number) => {
    const pts = [];
    for (let i = 0; i <= 140; i++) {
      const t = (i / 140) * hours;
      pts.push(`${X(t).toFixed(1)},${Y(100 * Math.pow(0.5, t / half)).toFixed(1)}`);
    }
    return pts.join(" ");
  };
  const tb = bed - start;
  const at = (half: number) => Math.round(100 * Math.pow(0.5, tb / half));
  const band = [];
  for (let i = 0; i <= 140; i++) {
    const t = (i / 140) * hours;
    band.push(`${X(t).toFixed(1)},${Y(100 * Math.pow(0.5, t / 9.5)).toFixed(1)}`);
  }
  for (let i = 140; i >= 0; i--) {
    const t = (i / 140) * hours;
    band.push(`${X(t).toFixed(1)},${Y(100 * Math.pow(0.5, t / 1.5)).toFixed(1)}`);
  }
  const hh = (t: number) => clock12(start + t);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`Caffeine left in the blood after a ${hh(0)} dose: about ${at(5)} percent at ${hh(tb)} for the average half-life of 5 hours, between ${at(1.5)} and ${at(9.5)} percent across the normal range`}>
      {[0, 25, 50, 75, 100].map((p) => (
        <g key={p}>
          <line x1={L} x2={W - R} y1={Y(p)} y2={Y(p)} stroke="rgba(236,238,241,.08)" />
          <text x={L - 8} y={Y(p) + 3.5} textAnchor="end" fontFamily={MONO} fontSize="10" fill="rgba(236,238,241,.5)">
            {p}%
          </text>
        </g>
      ))}
      {[0, 2, 4, 6, 8, 10, 12, 14].map((t) => (
        <text key={t} x={X(t)} y={H - B + 18} textAnchor="middle" fontFamily={MONO} fontSize="10" fill="rgba(236,238,241,.5)">
          {hh(t)}
        </text>
      ))}
      <polygon points={band.join(" ")} fill="rgba(255,106,43,.1)" />
      <polyline points={curve(1.5)} fill="none" stroke="rgba(255,122,61,.45)" strokeWidth="1.2" strokeDasharray="3 4" />
      <polyline points={curve(9.5)} fill="none" stroke="rgba(255,122,61,.45)" strokeWidth="1.2" strokeDasharray="3 4" />
      <polyline points={curve(5)} fill="none" stroke="#FF6A2B" strokeWidth="2.4" strokeLinejoin="round" />
      <line x1={X(tb)} x2={X(tb)} y1={T - 6} y2={H - B} stroke="#ECEEF1" strokeWidth="1.2" strokeDasharray="2 4" />
      <text x={X(tb) + 6} y={T + 4} fontFamily={MONO} fontSize="10.5" fontWeight="600" fill="#ECEEF1">
        BED {hh(tb)}
      </text>
      <circle cx={X(tb)} cy={Y(at(5))} r="4.5" fill="#FF6A2B" />
      <text x={X(tb) + 10} y={Y(at(5)) + 4} fontFamily={SANS} fontSize="14" fontWeight="650" fill="#ECEEF1">
        {at(5)}% still there
      </text>
      <text x={X(9.6)} y={Y(100 * Math.pow(0.5, 9.6 / 9.5)) - 8} fontFamily={MONO} fontSize="9.5" fill="rgba(255,122,61,.8)">
        slow body
      </text>
      <text x={X(2.4) + 4} y={Y(100 * Math.pow(0.5, 2.4 / 1.5)) + 14} fontFamily={MONO} fontSize="9.5" fill="rgba(255,122,61,.8)">
        fast body
      </text>
      <text x={X(0.3)} y={T - 8} fontFamily={MONO} fontSize="9.5" fill="rgba(236,238,241,.6)">
        CAFFEINE STILL IN YOU
      </text>
    </svg>
  );
}

/** Schematic of the two processes: sleep pressure builds while awake and drains in sleep. Not data. */
export function PressureSketch() {
  const W = 520, H = 250, L = 20, R = 20, T = 30, B = 44;
  const X = (h: number) => L + (h / 48) * (W - L - R);
  const Y = (p: number) => T + (1 - p) * (H - T - B);
  const pts: string[] = [];
  let p = 0.12;
  for (let i = 0; i <= 480; i++) {
    const h = (i / 480) * 48;
    const tod = (h + 7) % 24; // start at 07:00, wake 16 h, sleep 8 h
    const awake = tod >= 7 && tod < 23;
    const dt = 48 / 480;
    p = awake ? 1 - (1 - p) * Math.exp(-dt / 18.2) : p * Math.exp(-dt / 4.2);
    pts.push(`${X(h).toFixed(1)},${Y(p).toFixed(1)}`);
  }
  const nights = [
    [16, 24],
    [40, 48],
  ];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="A simple drawing, not real data: sleepiness builds through the day while you are awake and drains away while you sleep, two days shown">
      {nights.map(([a, b]) => (
        <rect key={a} x={X(a)} y={T - 10} width={X(b) - X(a)} height={H - T - B + 10} fill="rgba(181,156,240,.08)" />
      ))}
      <line x1={L} x2={W - R} y1={H - B} y2={H - B} stroke="rgba(236,238,241,.18)" />
      <polyline points={pts.join(" ")} fill="none" stroke="#B59CF0" strokeWidth="2.4" strokeLinejoin="round" />
      {[0, 16, 24, 40, 48].map((h) => (
        <text key={h} x={X(h)} y={H - B + 18} textAnchor="middle" fontFamily={MONO} fontSize="10" fill="rgba(236,238,241,.5)">
          {clock12((h + 7) % 24)}
        </text>
      ))}
      <text x={X(8)} y={T + 2} textAnchor="middle" fontFamily={MONO} fontSize="9.5" fill="rgba(236,238,241,.6)">
        AWAKE · SLEEPINESS BUILDS
      </text>
      <text x={X(20)} y={T + 2} textAnchor="middle" fontFamily={MONO} fontSize="9.5" fill="#C9B6F5">
        ASLEEP
      </text>
      <text x={L} y={H - 8} fontFamily={MONO} fontSize="9" fill="rgba(236,238,241,.55)">
        A SIMPLE DRAWING, NOT REAL DATA
      </text>
    </svg>
  );
}

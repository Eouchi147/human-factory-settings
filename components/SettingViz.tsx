import { ElementGlyph } from "./Icons";

const MONO = "var(--font-geist-mono), ui-monospace, monospace";
const KINDS: ("fire" | "air" | "water" | "earth")[] = ["fire", "air", "water", "earth"]; // clockwise from top-right

/** The Default Dial at large size: twelve positions (four temperaments × three styles), the pointer on yours. */
export function Dial({ size = 140, active }: { size?: number; active: number }) {
  const c = 70, r = 64;
  const P = (deg: number, rad: number) => [c + rad * Math.cos((deg * Math.PI) / 180), c + rad * Math.sin((deg * Math.PI) / 180)];
  const ang = (k: number) => k * 30 - 90 + 15;
  const ticks = [];
  for (let k = 0; k < 12; k++) {
    const on = k === active;
    const [x1, y1] = P(ang(k), r * 0.86);
    const [x2, y2] = P(ang(k), r * 0.95);
    ticks.push(<line key={k} x1={x1} y1={y1} x2={x2} y2={y2} stroke={on ? "#FF6A2B" : "rgba(236,238,241,.45)"} strokeWidth={on ? 2.6 : 1.3} strokeLinecap="round" />);
  }
  const glyphs = KINDS.map((kind, q) => {
    const [gx, gy] = P(q * 90 - 45, r * 0.62);
    return (
      <g key={kind} transform={`translate(${gx - 9} ${gy - 9})`}>
        <ElementGlyph kind={kind} size={18} color="rgba(236,238,241,.7)" stroke={1.5} />
      </g>
    );
  });
  const spokes = [0, 90, 180, 270].map((d) => {
    const [x1, y1] = P(d - 90, r * 0.2);
    const [x2, y2] = P(d - 90, r * 0.8);
    return <line key={d} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(236,238,241,.12)" strokeWidth="1" />;
  });
  const [hx, hy] = P(ang(active), r * 0.62);
  const [dx, dy] = P(ang(active), r * 0.72);
  return (
    <svg width={size} height={size} viewBox="0 0 140 140" role="img" aria-label="Your position on the twelve-position dial">
      <circle cx={c} cy={c} r={r} fill="rgba(18,21,26,.55)" stroke="rgba(236,238,241,.2)" strokeWidth="1.2" />
      {spokes}
      {ticks}
      {glyphs}
      <line x1={c} y1={c} x2={hx} y2={hy} stroke="#FF6A2B" strokeWidth="3.2" strokeLinecap="round" />
      <circle cx={dx} cy={dy} r="6.5" fill="#FF6A2B" />
      <circle cx={c} cy={c} r="4" fill="#ECEEF1" />
    </svg>
  );
}

/** Your position on two measured traits, with an honest ring of uncertainty. */
export function TraitMap({ e, n }: { e: number; n: number }) {
  const W = 360, H = 220, pad = 22;
  const X = (v: number) => pad + (v / 100) * (W - 2 * pad);
  const Y = (v: number) => pad + (1 - v / 100) * (H - 2 * pad);
  const px = X(e), py = Y(n);
  const rx = (10 / 100) * (W - 2 * pad), ry = (10 / 100) * (H - 2 * pad);
  const quads: [string, "fire" | "air" | "water" | "earth", number, number][] = [
    ["MELANCHOLIC", "earth", 58, 42],
    ["CHOLERIC", "fire", W - 110, 42],
    ["PHLEGMATIC", "water", 58, H - 30],
    ["SANGUINE", "air", W - 110, H - 30],
  ];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`Your position: outgoing score ${e} of 100, sensitivity score ${n} of 100`}>
      <defs>
        <radialGradient id="ug" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#FF6A2B" stopOpacity=".35" />
          <stop offset="1" stopColor="#FF6A2B" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x=".5" y=".5" width={W - 1} height={H - 1} rx="14" fill="rgba(18,21,26,.55)" stroke="rgba(236,238,241,.14)" />
      <line x1={W / 2} y1={26} x2={W / 2} y2={H - 24} stroke="rgba(236,238,241,.14)" />
      <line x1={12} y1={H / 2} x2={W - 12} y2={H / 2} stroke="rgba(236,238,241,.14)" />
      <text x={W / 2} y={17} textAnchor="middle" fontFamily={MONO} fontSize="8.5" letterSpacing="1.2" fill="rgba(236,238,241,.72)">
        MORE SENSITIVE ↑
      </text>
      <text x={W / 2} y={H - 9} textAnchor="middle" fontFamily={MONO} fontSize="8.5" letterSpacing="1.2" fill="rgba(236,238,241,.72)">
        MORE STEADY ↓
      </text>
      <text x={16} y={H / 2 + 14} fontFamily={MONO} fontSize="8.5" letterSpacing="1.2" fill="rgba(236,238,241,.72)">
        ← RESERVED
      </text>
      <text x={W - 16} y={H / 2 + 14} textAnchor="end" fontFamily={MONO} fontSize="8.5" letterSpacing="1.2" fill="rgba(236,238,241,.72)">
        OUTGOING →
      </text>
      {quads.map(([name, kind, x, y]) => (
        <g key={name} opacity=".8">
          <g transform={`translate(${x - 38} ${y - 11})`}>
            <ElementGlyph kind={kind} size={14} color="rgba(236,238,241,.55)" stroke={1.4} />
          </g>
          <text x={x - 20} y={y} fontFamily={MONO} fontSize="9.5" letterSpacing="1" fill="rgba(236,238,241,.55)">
            {name}
          </text>
        </g>
      ))}
      <ellipse cx={px} cy={py} rx={rx * 1.5} ry={ry * 1.5} fill="url(#ug)" />
      <ellipse cx={px} cy={py} rx={rx} ry={ry} fill="none" stroke="#FF6A2B" strokeDasharray="3 4" strokeWidth="1.2" />
      <circle cx={px} cy={py} r="5.5" fill="#FF6A2B" />
      <circle cx={px} cy={py} r="11" fill="none" stroke="#FF6A2B" strokeWidth="1" opacity=".6" />
    </svg>
  );
}

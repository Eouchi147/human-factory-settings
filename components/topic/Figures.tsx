/* Small figures for the question pages: a few big numbers, or a handful of bars, in the site's own type.
   Every number comes from the page's own sources. No client code. */
import s from "./figures.module.css";

type Tone = "signal" | "ink" | "dim";

/** One to three big numbers, each with what it means, and where it comes from. */
export function StatFigure({ stats, source }: { stats: { value: string; label: string; tone?: Tone }[]; source: string }) {
  return (
    <figure className={s.fig}>
      <div className={s.stats}>
        {stats.map((x) => (
          <div key={x.value + x.label} className={s.stat}>
            <span className={`${s.value} ${x.tone === "ink" ? s.ink : x.tone === "dim" ? s.dim : s.signal}`}>{x.value}</span>
            <span className={s.label}>{x.label}</span>
          </div>
        ))}
      </div>
      <figcaption className={s.source}>{source}</figcaption>
    </figure>
  );
}

/** Upright bars on one scale: each with its value on top and its name underneath. */
export function BarsFigure({ bars, title, source, max }: { bars: { name: string; value: number; shown: string; tone?: Tone }[]; title: string; source: string; max?: number }) {
  const W = 240, H = 176, B = 34, T = 26;
  const top = max ?? Math.max(...bars.map((b) => b.value));
  const n = bars.length;
  const slot = W / n;
  const bw = Math.min(46, slot * 0.56);
  return (
    <figure className={s.fig}>
      <span className={s.title}>{title}</span>
      <svg viewBox={`0 0 ${W} ${H}`} className={s.svg} role="img" aria-label={`${title}: ${bars.map((b) => `${b.name} ${b.shown}`).join(", ")}`}>
        <line x1="0" y1={H - B + 0.5} x2={W} y2={H - B + 0.5} stroke="rgba(236,238,241,.18)" />
        {bars.map((b, i) => {
          const h = Math.max(2, ((H - B - T) * b.value) / top);
          const x = slot * i + (slot - bw) / 2;
          const y = H - B - h;
          const fill = b.tone === "ink" ? "#ECEEF1" : b.tone === "dim" ? "rgba(236,238,241,.32)" : "#FF6A2B";
          return (
            <g key={b.name}>
              <rect x={x} y={y} width={bw} height={h} rx="5" fill={fill} />
              <text x={x + bw / 2} y={y - 8} textAnchor="middle" className={s.barValue}>
                {b.shown}
              </text>
              <text x={x + bw / 2} y={H - B + 18} textAnchor="middle" className={s.barName}>
                {b.name}
              </text>
            </g>
          );
        })}
      </svg>
      <figcaption className={s.source}>{source}</figcaption>
    </figure>
  );
}

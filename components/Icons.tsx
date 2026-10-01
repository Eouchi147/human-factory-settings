import type { CSSProperties } from "react";

const PATHS: Record<string, string> = {
  explore: '<path d="M12 3.5 20 8v8l-8 4.5L4 16V8z"/><path d="M4 8l8 4.5L20 8"/><path d="M12 12.5V20.5"/>',
  restore: '<path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3"/><path d="M4.5 4.5v3.4h3.4"/><path d="M12 8.2V12l2.6 1.8"/>',
  you: '<circle cx="12" cy="12" r="8.5"/><path d="M12 12V6.2"/><circle cx="12" cy="4.9" r=".2"/>',
  search: '<circle cx="10.8" cy="10.8" r="6.3"/><path d="M15.4 15.4 20 20"/>',
  back: '<path d="M14.5 5.5 8 12l6.5 6.5"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  plus: '<path d="M12 5.5v13M5.5 12h13"/>',
  minus: '<path d="M5.5 12h13"/>',
  arrow: '<path d="M5 12h14"/><path d="M13 6l6 6-6 6"/>',
  play: '<path d="M8 5.5v13l10.5-6.5z"/>',
  pause: '<path d="M8 5.5v13M16 5.5v13"/>',
  mic: '<rect x="9" y="3.5" width="6" height="11" rx="3"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0"/><path d="M12 18v2.5"/>',
  redo: '<path d="M19 12a7 7 0 1 1-2-4.9"/><path d="M19.5 4.5v4h-4"/>',
  share: '<path d="M12 15V4"/><path d="M7.5 8.5 12 4l4.5 4.5"/><path d="M5 13v6.5h14V13"/>',
  check: '<path d="M5 12.5 10 17 19 7.5"/>',
  book: '<path d="M4.5 5.5A2.5 2.5 0 0 1 7 3h12.5v15H7a2.5 2.5 0 0 0-2.5 2.5z"/><path d="M4.5 20.5V5.5"/>',
  dial: '<circle cx="12" cy="12" r="8.5"/><path d="M12 12V6.5"/>',
  film: '<rect x="3.5" y="5" width="17" height="14" rx="2.5"/><path d="M8 5v14M16 5v14M3.5 9.5H8M3.5 14.5H8M16 9.5h4.5M16 14.5h4.5"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3.2 2"/>',
  moon: '<path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10z"/>',
  layers: '<path d="M12 4 21 8.5 12 13 3 8.5z"/><path d="M3 12.5 12 17l9-4.5"/><path d="M3 16.5 12 21l9-4.5"/>',
  external: '<path d="M14 4.5h5.5V10"/><path d="M19.5 4.5 11 13"/><path d="M18 14v5.5H4.5V6H10"/>',
  menu: '<path d="M4 8h16M4 16h16"/>',
  flag: '<path d="M5.5 21V4"/><path d="M5.5 4.5h11l-2.2 3.8 2.2 3.8h-11"/>',
  ruler: '<path d="M3 16.5 16.5 3l4.5 4.5L7.5 21z"/><path d="M7 12.5l2 2M10 9.5l2.8 2.8M13 6.5l2 2"/>',
  sound: '<path d="M4.5 9.5h3l4-3.5v12l-4-3.5h-3z"/><path d="M15.5 9a4.5 4.5 0 0 1 0 6"/><path d="M18 6.5a8 8 0 0 1 0 11"/>',
  mute: '<path d="M4.5 9.5h3l4-3.5v12l-4-3.5h-3z"/><path d="M16 9.5l5 5M21 9.5l-5 5"/>',
  dot: '<circle cx="12" cy="12" r="6" fill="currentColor" stroke="none"/>',
  heart: '<path d="M12 20s-7-4.4-9.2-8.5C1.2 8.4 2.6 4.6 6 3.8c2.1-.5 4 .5 5.2 2.3.4.5 1.1.5 1.5 0C13.9 4.3 15.9 3.3 18 3.8c3.4.8 4.8 4.6 3.2 7.7C19 15.6 12 20 12 20z"/>',
  drop: '<path d="M12 3.5s-6 6.6-6 11a6 6 0 0 0 12 0c0-4.4-6-11-6-11z"/>',
  cup: '<path d="M5 8.5h11v6a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5z"/><path d="M16 10h1.5a2.5 2.5 0 0 1 0 5H16"/><path d="M8.5 3.5c0 1 1 1.5 1 2.5M12 3.5c0 1 1 1.5 1 2.5"/>',
  rotate: '<path d="M20 12a8 8 0 1 1-2.3-5.6"/><path d="M20.5 4.5v4h-4"/>',
  tape: '<rect x="3.5" y="7.5" width="17" height="9" rx="2"/><path d="M7 7.5v3M10.5 7.5v4.5M14 7.5v3M17.5 7.5v4.5"/>',
  puzzle: '<path d="M9 4.5h3a1.5 1.5 0 0 1 3 0h3.5V8a1.5 1.5 0 0 1 0 3v3.5H15a1.5 1.5 0 0 0-3 0H8.5V11a1.5 1.5 0 0 0 0-3V4.5z"/><path d="M8.5 14.5v5h10v-5"/>',
};

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 22, stroke = 1.6, style, className }: { name: IconName; size?: number; stroke?: number; style?: CSSProperties; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      style={style}
      className={className}
      dangerouslySetInnerHTML={{ __html: PATHS[name] }}
    />
  );
}

/** The Default Dial: a ring, eleven ticks, and a figure standing at twelve o'clock. */
export function Logo({ size = 28, ink = "#ECEEF1", sig = "#FF6A2B", pointer = 0 }: { size?: number; ink?: string; sig?: string; pointer?: number }) {
  const ticks = [];
  for (let k = 1; k < 12; k++) {
    const a = ((k * 30 - 90) * Math.PI) / 180;
    ticks.push(
      <line
        key={k}
        x1={(24 + 15.2 * Math.cos(a)).toFixed(2)}
        y1={(24 + 15.2 * Math.sin(a)).toFixed(2)}
        x2={(24 + 17.6 * Math.cos(a)).toFixed(2)}
        y2={(24 + 17.6 * Math.sin(a)).toFixed(2)}
        stroke={ink}
        strokeWidth="1.3"
        strokeLinecap="round"
        opacity=".55"
      />,
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <circle cx="24" cy="24" r="20.5" fill="none" stroke={ink} strokeWidth="1.8" />
      {ticks}
      <g transform={`rotate(${pointer} 24 24)`}>
        <line x1="24" y1="24" x2="24" y2="14.2" stroke={sig} strokeWidth="2.6" strokeLinecap="round" />
        <circle cx="24" cy="9.6" r="3.1" fill={sig} />
        <circle cx="24" cy="24" r="2.2" fill={ink} />
      </g>
    </svg>
  );
}

/** Alchemical element glyphs for the four temperaments (public-domain symbols). */
export function ElementGlyph({ kind, size = 20, color = "currentColor", stroke = 1.6 }: { kind: "fire" | "air" | "water" | "earth"; size?: number; color?: string; stroke?: number }) {
  const up = "M12 4 20.5 19H3.5Z";
  const down = "M12 20 3.5 5h17Z";
  const d = kind === "fire" || kind === "air" ? up : down;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinejoin="round" strokeLinecap="round" aria-hidden="true" focusable="false">
      <path d={d} />
      {kind === "air" ? <path d="M6.4 14h11.2" /> : null}
      {kind === "earth" ? <path d="M6.4 10h11.2" /> : null}
    </svg>
  );
}

import { Icon } from "./Icons";

export type Level = 4 | 3 | 2 | 1 | 0 | -1;

export const LEVEL_NAMES: Record<number, string> = {
  4: "Strong evidence",
  3: "Good evidence",
  2: "Some evidence",
  1: "Early evidence",
  0: "Tradition, not tested",
  [-1]: "No evidence of benefit",
};

/** Maps the words our guides use in their Evidence columns to a level on the meter. */
export function levelFromWord(word: string): Level | null {
  const w = word.trim().toLowerCase();
  if (w.startsWith("strong")) return 4;
  if (w.startsWith("good")) return 3;
  if (w.startsWith("some")) return 2;
  if (w.startsWith("early")) return 1;
  if (w.startsWith("tradition")) return 0;
  if (w.startsWith("no evidence") || w.startsWith("harm signal") || w.startsWith("not a scientific")) return -1;
  return null;
}

export function Ev({ level, text }: { level: Level; text?: string }) {
  const cls = level === 0 ? "ev ev-t" : level === -1 ? "ev ev-x" : `ev ev-${level}`;
  return (
    <span className={cls} title={LEVEL_NAMES[level]}>
      <span className="bars" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
      </span>
      <span>{text ?? LEVEL_NAMES[level]}</span>
    </span>
  );
}

export function Measured({ text = "Measured on the reference body" }: { text?: string }) {
  return (
    <span className="ms">
      <Icon name="ruler" size={14} stroke={1.7} />
      <span>{text}</span>
    </span>
  );
}

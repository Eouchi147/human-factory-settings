/* "Find your setting". Eight public-domain Mini-IPIP items (Donnellan et al. 2006, via the International
   Personality Item Pool) measure two traits; three questions of our own suggest a communication style.
   Everything is scored in the browser. Nothing is stored or sent. */

export type TraitItem = { q: string; key: "E" | "N"; reverse: boolean };

export const TRAIT_ITEMS: TraitItem[] = [
  { q: "I am the life of the party.", key: "E", reverse: false },
  { q: "I have frequent mood swings.", key: "N", reverse: false },
  { q: "I don't talk a lot.", key: "E", reverse: true },
  { q: "I am relaxed most of the time.", key: "N", reverse: true },
  { q: "I talk to a lot of different people at parties.", key: "E", reverse: false },
  { q: "I get upset easily.", key: "N", reverse: false },
  { q: "I keep in the background.", key: "E", reverse: true },
  { q: "I seldom feel blue.", key: "N", reverse: true },
];

export const SCALE = ["Very inaccurate", "Moderately inaccurate", "Neither accurate nor inaccurate", "Moderately accurate", "Very accurate"];

export type StyleKey = "planner" | "connector" | "listener";

export const STYLE_ITEMS: { q: string; options: { label: string; style: StyleKey }[] }[] = [
  {
    q: "A friend asks you to help plan a weekend away. You…",
    options: [
      { label: "Make a schedule and book it", style: "planner" },
      { label: "Call a few people and keep it loose", style: "connector" },
      { label: "Ask what they want first, then help quietly", style: "listener" },
    ],
  },
  {
    q: "In a meeting, you usually…",
    options: [
      { label: "Keep to the agenda and the facts", style: "planner" },
      { label: "Get people talking and jump between ideas", style: "connector" },
      { label: "Listen, then say one considered thing", style: "listener" },
    ],
  },
  {
    q: "Plans change at the last minute. You…",
    options: [
      { label: "Feel thrown: you liked the plan", style: "planner" },
      { label: "Roll with it: there is always another way", style: "connector" },
      { label: "Go along to keep the peace, then think it over", style: "listener" },
    ],
  },
];

export type TempKey = "choleric" | "sanguine" | "phlegmatic" | "melancholic";

export const TEMPERAMENTS: Record<TempKey, { name: string; element: "fire" | "air" | "water" | "earth"; e: string; n: string; line: string; quadrant: number }> = {
  choleric: { name: "Choleric", element: "fire", e: "outgoing", n: "sensitive", line: "Outgoing and quick to react. Driven, direct, feels pressure strongly.", quadrant: 0 },
  sanguine: { name: "Sanguine", element: "air", e: "outgoing", n: "steady", line: "Outgoing and steady. Energised by people, bounces back fast.", quadrant: 1 },
  phlegmatic: { name: "Phlegmatic", element: "water", e: "reserved", n: "steady", line: "Reserved and steady. Calm, patient, hard to rattle.", quadrant: 2 },
  melancholic: { name: "Melancholic", element: "earth", e: "reserved", n: "sensitive", line: "Reserved and sensitive. Deep, careful, notices what others miss.", quadrant: 3 },
};

export const STYLES: Record<StyleKey, { name: string; line: string; index: number }> = {
  planner: { name: "Planner", line: "Plans ahead, one thing at a time, facts first.", index: 0 },
  connector: { name: "Connector", line: "People first, many things at once, flexible with time.", index: 1 },
  listener: { name: "Listener", line: "Listens first, keeps harmony, thinks before speaking.", index: 2 },
};

/** From the weight guide's "In your style" table (evidence for these framings: Early). */
export const STYLE_TIPS: Record<TempKey, { fits: string; watch: string }> = {
  choleric: { fits: "A clear target, a weekly scoreboard, a challenge with a date.", watch: "All-or-nothing after one bad day." },
  sanguine: { fits: "Doing it with others: walking partners, classes, shared meals planned ahead.", watch: "Social eating and drinking that nobody counts." },
  melancholic: { fits: "A written plan, tracking, a calm routine.", watch: "Harsh self-talk after a slip; progress is a trend, not a day." },
  phlegmatic: { fits: "Defaults that remove decisions: the same breakfast, the same walk, groceries on a list.", watch: "Drift when routines break, on holidays and moves." },
};

/** 0 to 100 for one trait: mean of its items on the 1 to 5 scale, reverse-keyed where marked. */
export function traitScore(answers: number[], key: "E" | "N"): number {
  let sum = 0;
  let n = 0;
  TRAIT_ITEMS.forEach((it, i) => {
    if (it.key !== key || answers[i] === undefined) return;
    sum += it.reverse ? 6 - answers[i] : answers[i];
    n++;
  });
  if (!n) return 50;
  return Math.round(((sum / n - 1) / 4) * 100);
}

export function temperamentOf(e: number, n: number): TempKey {
  if (e >= 50) return n >= 50 ? "choleric" : "sanguine";
  return n >= 50 ? "melancholic" : "phlegmatic";
}

export function styleOf(picks: StyleKey[]): StyleKey {
  const c: Record<StyleKey, number> = { planner: 0, connector: 0, listener: 0 };
  picks.forEach((p) => c[p]++);
  const best = (Object.keys(c) as StyleKey[]).sort((a, b) => c[b] - c[a]);
  if (c[best[0]] === 1) return picks[1] ?? best[0]; // a three-way split: the meeting question decides
  return best[0];
}

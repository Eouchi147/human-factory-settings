import type { Level } from "@/components/Evidence";

export type Station = {
  id: string;
  title: string;
  serif: string;
  visual: "pressure" | "clock" | "molecules" | "halflife" | "stat" | "cutoff";
  simple: string;
  clear: string;
  expert: string;
  ev: Level;
  evText?: string;
  source: { label: string; href?: string }[];
};

export const STATIONS: Station[] = [
  {
    id: "pressure",
    title: "All day, a pressure to sleep",
    serif: "builds up.",
    visual: "pressure",
    simple: "The longer you are awake, the more a sleepy chemical called adenosine builds up in your brain. Sleep clears it away.",
    clear:
      "While you are awake, adenosine collects in the brain and slowly raises the pressure to sleep. Sleep drains it, which is why a full night leaves you refreshed and a short one does not.",
    expert:
      "Homeostatic sleep pressure (Process S in the two-process model) rises with time awake and dissipates during sleep. Extracellular adenosine, a by-product of energy use, is one of its best-studied signals.",
    ev: 3,
    source: [
      { label: "Borbély 1982, a two-process model of sleep regulation", href: "https://pubmed.ncbi.nlm.nih.gov/7185792/" },
      { label: "Porkka-Heiskanen et al. 1997, Science", href: "https://doi.org/10.1126/science.276.5316.1265" },
    ],
  },
  {
    id: "clock",
    title: "A clock in your brain",
    serif: "sets the timing.",
    visual: "clock",
    simple: "A tiny clock in your brain, reset by daylight every morning, decides when you feel awake and when you feel sleepy.",
    clear:
      "A master clock in the brain runs on a cycle of about 24 hours and is reset each day, mostly by light. In the evening it lets the hormone melatonin rise, one of the signals that night has come.",
    expert:
      "The suprachiasmatic nucleus drives circadian alertness (Process C) and is entrained chiefly by light through the retina. The evening rise of melatonin in dim light marks the biological night.",
    ev: 4,
    source: [{ label: "NIH NIGMS, circadian rhythms", href: "https://www.nigms.nih.gov/education/fact-sheets/Pages/circadian-rhythms.aspx" }],
  },
  {
    id: "caffeine",
    title: "Caffeine is shaped almost like",
    serif: "the sleep signal.",
    visual: "molecules",
    simple:
      "Caffeine looks a lot like adenosine, so it sits in adenosine's docking spots and blocks the sleepy message. You still have the pressure; you just stop feeling it.",
    clear:
      "Adenosine acts on receptors that push you toward sleep. Caffeine blocks those receptors without switching them on. That is the main way it keeps you alert.",
    expert:
      "An adenosine receptor antagonist (mainly A1 and A2A), the main mechanism at everyday doses. About 99% is absorbed within 45 minutes of drinking it.",
    ev: 4,
    source: [{ label: "Institute of Medicine 2001, pharmacology of caffeine", href: "https://www.ncbi.nlm.nih.gov/books/NBK223808/" }],
  },
  {
    id: "halflife",
    title: "Hours later,",
    serif: "much of it is still there.",
    visual: "halflife",
    simple: "Your body clears caffeine slowly. Five hours after a coffee, about half of it is still working.",
    clear:
      "On average it takes about 5 hours to clear half of the caffeine you drink, but that ranges from 1.5 to 9.5 hours between people. A coffee at 17:00 can still be more than a third there at 23:00.",
    expert:
      "Mean plasma half-life about 5 h (range 1.5 to 9.5 h), cleared mainly by the liver enzyme CYP1A2; clearance is faster in smokers and slower in pregnancy and with oral contraceptives.",
    ev: 4,
    source: [{ label: "Institute of Medicine 2001, pharmacology of caffeine", href: "https://www.ncbi.nlm.nih.gov/books/NBK223808/" }],
  },
  {
    id: "sleep",
    title: "Six hours before bed,",
    serif: "it still cost an hour.",
    visual: "stat",
    simple: "In a sleep study, people who took caffeine even 6 hours before bed slept more than an hour less than usual.",
    clear:
      "In a small sleep study, 400 mg of caffeine taken 0, 3 or 6 hours before bed all disturbed sleep. Even at 6 hours it cut measured sleep by more than an hour.",
    expert:
      "Drake et al. 2013: 400 mg at 0, 3 and 6 h before habitual bedtime versus placebo, measured at home; at 6 h, total sleep time still fell by more than 1 h. Small sample (12 adults), so the size of the effect is uncertain.",
    ev: 2,
    source: [{ label: "Drake et al. 2013, Journal of Clinical Sleep Medicine", href: "https://doi.org/10.5664/jcsm.3170" }],
  },
  {
    id: "cutoff",
    title: "So set a cutoff:",
    serif: "six hours before bed.",
    visual: "cutoff",
    simple: "Have your last caffeine 6 hours before bed. If you still sleep badly after a week, try 8.",
    clear:
      "Count back 6 hours from your bedtime and make that your last caffeine, including tea, cola, energy drinks and chocolate. Europe's food safety agency notes that even 100 mg near bedtime can disturb sleep.",
    expert:
      "A 6 h cutoff follows the Drake data and the mean half-life; slow metabolisers may need 8 h or more. EFSA: up to 400 mg a day is safe for healthy adults, and 100 mg close to bedtime can affect sleep.",
    ev: 2,
    source: [
      { label: "Drake et al. 2013", href: "https://doi.org/10.5664/jcsm.3170" },
      { label: "EFSA, caffeine", href: "https://www.efsa.europa.eu/en/topics/topic/caffeine" },
    ],
  },
];

/* The eight things people come to fix, in the order search demand and prevalence put them
   (research/search-demand.md in the Health project). Each area lights up its parts on the 3D body. */
import type { IconName } from "@/components/Icons";
import type { Mood } from "@/lib/hero3d";

export type Question = { q: string; slug?: string; hook?: string };
export type Area = {
  slug: string;
  name: string;
  chip: string;
  icon: IconName;
  focus: string[]; // model groups the 3D body keeps lit
  mood?: Mood; // how the 3D body behaves while this area is picked
  fact: string; // one line a complete beginner remembers
  source: { label: string; href: string };
  intro: string;
  questions: Question[];
  start?: { label: string; href: string }[]; // pages that already exist for this area
};

export const AREAS: Area[] = [
  {
    slug: "sleep-energy",
    name: "Sleep & energy",
    chip: "Sleep better",
    icon: "moon",
    focus: ["brain"],
    mood: { night: 1, bpm: 54, breaths: 10 },
    fact: "Adults need 7 or more hours of sleep a night. About 1 in 3 get less.",
    source: { label: "CDC and America's Health Rankings", href: "https://americashealthrankings.org/explore/measures/sleep" },
    intro: "Why you're tired, how to fall asleep, and what actually changes how rested you feel.",
    questions: [
      { q: "Why am I always tired?", slug: "why-am-i-always-tired", hook: "Short sleep, late coffee, late light: check these first." },
      { q: "How can I fall asleep faster?", slug: "how-to-fall-asleep-faster", hook: "Normal is 10 to 20 minutes. What's been measured to help." },
      { q: "Does magnesium help you sleep?" },
      { q: "Is mouth taping safe?", slug: "is-mouth-taping-safe", hook: "Not with a blocked nose. And no evidence for the jawline." },
      { q: "Why do I wake up at 3 a.m.?" },
    ],
    start: [
      { label: "Your 7-day sleep and caffeine plan", href: "/feel-better/sleep-and-caffeine" },
      { label: "The science: why you wake up tired", href: "/stories/why-you-wake-up-tired" },
    ],
  },
  {
    slug: "weight-food",
    name: "Weight & food",
    chip: "Lose weight",
    icon: "restore",
    focus: ["stomach", "gut", "liver"],
    fact: "Crunches don't burn belly fat. Your body loses fat all over, not where you exercise.",
    source: { label: "Spot reduction review, Human Movement 2022", href: "https://doi.org/10.5114/HM.2022.110373" },
    intro: "What really moves your weight, what to eat, and which trends are worth your time.",
    questions: [
      { q: "How do I lose belly fat?", slug: "how-to-lose-belly-fat", hook: "Not with crunches. What works instead." },
      { q: "Does intermittent fasting work?", slug: "does-intermittent-fasting-work", hook: "About as well as a diet, because it is one." },
      { q: "Do weight-loss injections work, and what happens when you stop?" },
      { q: "How much protein do I need a day?", slug: "how-much-protein-do-i-need", hook: "The number, and how to spread it out." },
      { q: "How much water do you need?", slug: "how-much-water-do-you-need", hook: "About 2 to 2.5 litres, food and coffee included. Thirst is a good guide." },
      { q: "How can I improve my gut health?" },
    ],
    start: [
      { label: "Weight: the full guide", href: "/guides/weight" },
      { label: "Supplements: the full guide", href: "/guides/supplements" },
      { label: "Is your waist under half your height?", href: "/tools#waist" },
    ],
  },
  {
    slug: "fitness-strength",
    name: "Fitness & strength",
    chip: "Get fit",
    icon: "explore",
    focus: ["legs", "spine", "ribs", "arms", "skull", "heart", "arteries"],
    mood: { bpm: 128, breaths: 26 },
    fact: "Adults need at least 150 minutes of brisk movement a week, plus muscle work on 2 days or more.",
    source: { label: "WHO, physical activity", href: "https://www.who.int/news-room/fact-sheets/detail/physical-activity" },
    intro: "How to start from zero, build muscle, and move more without living in a gym.",
    questions: [
      { q: "How do I build muscle?", slug: "how-do-i-build-muscle", hook: "Hard sets, twice a week. Light or heavy, the effort builds the size." },
      { q: "How many steps a day do you really need?", slug: "how-many-steps-a-day", hook: "About 7,000. 10,000 was a pedometer's name." },
      { q: "What does creatine do?", slug: "what-does-creatine-do", hook: "With lifting, about a kilo more lean mass. Without it, 0.03 kg." },
      { q: "How do I start running?" },
      { q: "What's the best workout for a complete beginner?" },
    ],
    start: [
      { label: "Moving more: from the weight guide", href: "/guides/weight#moving" },
      { label: "Check your pulse", href: "/tools#pulse" },
    ],
  },
  {
    slug: "posture-looks",
    name: "Posture & looks",
    chip: "Look better",
    icon: "spine",
    focus: ["spine", "skull", "legs"],
    fact: "41 reviews of the evidence found no proof that posture causes back pain. Moving often is what helps.",
    source: { label: "Swain et al. 2020, Journal of Biomechanics", href: "https://research.monash.edu/en/publications/no-consensus-on-causality-of-spine-postures-or-physical-exposure-/" },
    intro: "How you were built to stand, walk, breathe and rest your mouth, and the plain habits that make you look and feel better.",
    questions: [
      { q: "How do I fix my posture?", slug: "how-to-fix-my-posture", hook: "There is no perfect posture. Move often and get stronger." },
      { q: "How can I look better, naturally?", slug: "how-to-look-better-naturally", hook: "Sleep, sunscreen, no smoking, more plants." },
      { q: "Does mewing work?", slug: "does-mewing-work", hook: "No trial shows it reshapes your face. What does help." },
      { q: "Are barefoot shoes good for your feet?", slug: "are-barefoot-shoes-good-for-your-feet", hook: "They can build strength, if you switch slowly." },
      { q: "What is fascia, and does foam rolling work?", slug: "what-is-fascia", hook: "A small, short boost. It doesn't break anything up." },
    ],
  },
  {
    slug: "stress-mood",
    name: "Stress & mood",
    chip: "Stress less",
    icon: "clock",
    focus: ["brain", "heart", "nerves"],
    mood: { bpm: 100, breaths: 22, signals: 1.8 },
    fact: "Five minutes a day of breathing with long breaths out lifted mood more than mindfulness meditation, in a Stanford study.",
    source: { label: "Balban et al. 2023, Cell Reports Medicine", href: "https://doi.org/10.1016/j.xcrm.2022.100895" },
    intro: "What stress and anxiety do inside your body, and the fastest ways to calm it down.",
    questions: [
      { q: "What does anxiety feel like in your body?" },
      { q: "How do I stop overthinking?" },
      { q: "Can breathing calm you down?", slug: "breathing-to-calm-down", hook: "A little. Five minutes a day lifted mood in one trial." },
      { q: "What do cold showers really do?", slug: "what-do-cold-showers-really-do", hook: "Fewer days off sick, not fewer days ill. No proof of a boost." },
      { q: "What does cortisol actually do?" },
      { q: "Am I burnt out?" },
    ],
  },
  {
    slug: "habits-focus",
    name: "Habits & focus",
    chip: "Focus",
    icon: "dial",
    focus: ["brain", "nerves"],
    mood: { signals: 0.7 },
    fact: "Switching off mobile internet on phones for 2 weeks improved attention and mood in a study of 467 people.",
    source: { label: "PNAS Nexus 2025, via PsyPost", href: "https://www.psypost.org/want-better-focus-and-a-happier-mind-this-simple-smartphone-change-could-be-the-answer" },
    intro: "Why your phone wins, how habits really form, and how to get your attention back.",
    questions: [
      { q: "Does a dopamine detox work?", slug: "does-a-dopamine-detox-work", hook: "A day off doesn't lower dopamine. The useful part: put the phone away." },
      { q: "How do I stop procrastinating?" },
      { q: "How do I stop checking my phone?" },
      { q: "How do I build a habit that sticks?" },
      { q: "How can I focus better?" },
    ],
  },
  {
    slug: "connection-purpose",
    name: "Connection & purpose",
    chip: "Feel happier",
    icon: "heart",
    focus: ["heart", "brain"],
    mood: { warm: 1, bpm: 60 },
    fact: "About 1 in 6 people worldwide are lonely. The WHO links loneliness to about 871,000 deaths a year.",
    source: { label: "World Health Organization, 2025", href: "https://who.int/news/item/30-06-2025-social-connection-linked-to-improved-heath-and-reduced-risk-of-early-death" },
    intro: "Friends, meaning, gratitude and calm: the settings people forget, and why they matter for your body too.",
    questions: [
      { q: "How do I make friends as an adult?" },
      { q: "Does a gratitude journal work?" },
      { q: "How do I start meditating?" },
      { q: "How can I be happier?" },
      { q: "How do I find my purpose?" },
    ],
  },
  {
    slug: "aches-health",
    name: "Aches & health",
    chip: "Ease aches",
    icon: "you",
    focus: ["spine"],
    fact: "Low back pain is the world's leading cause of disability.",
    source: { label: "World Health Organization", href: "https://www.who.int/news-room/fact-sheets/detail/low-back-pain" },
    intro: "Back pain, headaches, your gut, your heart and your hormones, explained simply.",
    questions: [
      { q: "Why does my lower back hurt?", slug: "why-does-my-lower-back-hurt", hook: "In about 9 cases in 10, no single cause. It usually eases within weeks." },
      { q: "What type of headache do I have?" },
      { q: "How can I lower my cholesterol?" },
      { q: "What causes high blood pressure?" },
      { q: "What happens in perimenopause?" },
    ],
    start: [
      { label: "Your body in 3D", href: "/body" },
      { label: "Your heart", href: "/body/heart" },
      { label: "Your liver", href: "/body/liver" },
    ],
  },
];

export const byArea = (slug: string) => AREAS.find((a) => a.slug === slug);

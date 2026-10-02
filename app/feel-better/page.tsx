import type { Metadata } from "next";
import Link from "next/link";
import s from "./feel-better.module.css";
import { Icon, type IconName } from "@/components/Icons";
import { Reveal } from "@/components/Reveal";

export const metadata: Metadata = {
  title: "Feel better",
  description: "Small plans and clear guides built on the best evidence we have, with how sure the science is and when to see a doctor instead.",
};

type Setting = { icon: IconName; name: string; line: string; status: "ready" | "guide" | "soon"; links: { href: string; label: string }[] };

const SETTINGS: Setting[] = [
  {
    icon: "moon",
    name: "Sleep",
    line: "Coffee, light and timing: the things that decide how rested you wake up.",
    status: "ready",
    links: [
      { href: "/feel-better/sleep-and-caffeine", label: "Protect your sleep from caffeine: a 7-day plan" },
      { href: "/stories/why-you-wake-up-tired", label: "Why you wake up tired: the story" },
    ],
  },
  {
    icon: "layers",
    name: "Food",
    line: "What your body needs from food, and the few supplements that really help specific people.",
    status: "guide",
    links: [{ href: "/guides/supplements", label: "Do you need supplements?" }],
  },
  {
    icon: "restore",
    name: "Weight",
    line: "What really moves your weight and keeps it there, from diets to medicines.",
    status: "guide",
    links: [{ href: "/guides/weight", label: "How to lose weight and keep it off" }],
  },
  {
    icon: "explore",
    name: "Movement",
    line: "Strength to keep your muscle, walking every day, and less sitting in between.",
    status: "guide",
    links: [{ href: "/guides/weight#moving", label: "Moving more: what it does and doesn't do" }],
  },
  { icon: "clock", name: "Stress", line: "How your stress response is built to switch on and off, and what keeps it stuck on.", status: "soon", links: [] },
  { icon: "you", name: "Light and people", line: "Daylight that sets your body clock, and the company your body was built for.", status: "soon", links: [] },
];

const STATUS = { ready: "7-day plan", guide: "Full guide", soon: "Coming soon" } as const;

export default function RestorePage() {
  return (
    <div className="page-top">
      <div className="wrap stack gap-32">
        <header className="stack gap-12" style={{ maxWidth: 780 }}>
          <div className="kick a-in">Feel better</div>
          <h1 className="h1 a-in a-d1">
            Feel better, <span className="serif">one small step at a time.</span>
          </h1>
          <p className="lede a-in a-d2">
            Plans and guides built on the best evidence we have. Each one shows how sure the science is, and tells you when it&apos;s time to see a doctor instead.
          </p>
        </header>
        <div className={s.grid}>
          {SETTINGS.map((x, i) => (
            <Reveal key={x.name} delay={(i % 3) * 0.05}>
              <div className={`card ${s.item} ${x.status === "soon" ? s.dim : ""}`} style={{ height: "100%" }}>
                <div className={s.itemTop}>
                  <span className={s.icon}>
                    <Icon name={x.icon} size={20} />
                  </span>
                  <span className="tag" style={x.status === "ready" ? { color: "var(--signal-ink)", borderColor: "rgba(255,122,61,.45)" } : undefined}>
                    {STATUS[x.status]}
                  </span>
                </div>
                <h2 className="h3">{x.name}</h2>
                <p style={{ margin: 0, fontSize: 14.5, color: "var(--ink2)", lineHeight: 1.5 }}>{x.line}</p>
                {x.links.length ? (
                  <div className={s.links}>
                    {x.links.map((l) => (
                      <Link key={l.href} href={l.href}>
                        <span>{l.label}</span>
                        <Icon name="arrow" size={16} />
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="cap" style={{ margin: "auto 0 0", textTransform: "none", letterSpacing: ".02em" }}>
                    Being written and checked now.
                  </p>
                )}
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import s from "./restore.module.css";
import { Icon, type IconName } from "@/components/Icons";
import { Ev } from "@/components/Evidence";
import { Reveal } from "@/components/Reveal";

export const metadata: Metadata = {
  title: "Restore",
  description: "Settings that modern life changed, and the step-by-step plans and guides to restore them, every step graded.",
};

type Setting = { icon: IconName; name: string; line: string; status: "ready" | "guide" | "soon"; links: { href: string; label: string }[] };

const SETTINGS: Setting[] = [
  {
    icon: "moon",
    name: "Sleep",
    line: "Caffeine, light and timing: the settings that decide how rested you wake up.",
    status: "ready",
    links: [
      { href: "/restore/sleep-and-caffeine", label: "Plan · Protect your sleep from caffeine" },
      { href: "/stories/why-you-wake-up-tired", label: "Story · Why you wake up tired" },
    ],
  },
  {
    icon: "layers",
    name: "Food",
    line: "What the body needs from food, and the few supplements with real evidence for specific people.",
    status: "guide",
    links: [{ href: "/guides/supplements", label: "Guide · Supplements and nutrition" }],
  },
  {
    icon: "restore",
    name: "Weight",
    line: "What actually moves body weight and keeps it there, from diets head to head to medicines.",
    status: "guide",
    links: [{ href: "/guides/weight", label: "Guide · Weight management" }],
  },
  {
    icon: "explore",
    name: "Movement",
    line: "Strength to keep muscle, walking every day, less sitting between. The numbers behind each.",
    status: "guide",
    links: [{ href: "/guides/weight#moving", label: "Guide section · Moving" }],
  },
  { icon: "clock", name: "Stress", line: "How the stress response is built to switch on and off, and what keeps it stuck on.", status: "soon", links: [] },
  { icon: "you", name: "Light and people", line: "Daylight that sets the clock, and the company the body was built for.", status: "soon", links: [] },
];

const STATUS = { ready: "Plan ready", guide: "Deep guide", soon: "In the works" } as const;

export default function RestorePage() {
  return (
    <div className="page-top">
      <div className="wrap stack gap-32">
        <header className="stack gap-12" style={{ maxWidth: 780 }}>
          <div className="kick a-in">Restore</div>
          <h1 className="h1 a-in a-d1">
            Restore what drifted, <span className="serif">step by step.</span>
          </h1>
          <p className="lede a-in a-d2">
            Each setting links the science to a plan you can follow for 7 to 30 days. Every step carries its evidence, and every plan says when to see a doctor
            instead.
          </p>
          <div className="row-wrap gap-8 a-in a-d3">
            <Ev level={4} text="Strong" />
            <Ev level={3} text="Good" />
            <Ev level={2} text="Some" />
            <Ev level={1} text="Early" />
          </div>
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
                <div className="h3">{x.name}</div>
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
                    Being written and sourced now.
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

import Link from "next/link";
import { Logo } from "./Icons";

const COLS = [
  {
    title: "Your body",
    links: [
      ["Your body in 3D", "/body"],
      ["Your heart", "/body/heart"],
      ["Your liver", "/body/liver"],
      ["Why you wake up tired", "/stories/why-you-wake-up-tired"],
    ],
  },
  {
    title: "Feel better",
    links: [
      ["All topics", "/#fix"],
      ["Sleep and caffeine: 7-day plan", "/feel-better/sleep-and-caffeine"],
      ["Weight: the full guide", "/guides/weight"],
      ["Supplements: the full guide", "/guides/supplements"],
    ],
  },
  {
    title: "More",
    links: [
      ["Watch", "/watch"],
      ["Personality quiz", "/quiz"],
      ["How we check facts", "/how-we-check"],
      ["Words explained", "/how-we-check#words"],
    ],
  },
  {
    title: "About",
    links: [
      ["Credits", "/how-we-check#credits"],
      ["Privacy", "/privacy"],
      ["Terms", "/terms"],
    ],
  },
] as const;

export function Footer() {
  return (
    <footer className="footer">
      <div className="wrap">
        <div style={{ display: "grid", gap: 32, gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))" }}>
          <div className="stack gap-12" style={{ minWidth: 220 }}>
            <Link href="/" className="brand" aria-label="Human Factory Settings, home">
              <Logo size={28} />
              <span className="word">Human Factory Settings</span>
            </Link>
            <p style={{ margin: 0, maxWidth: 300, lineHeight: 1.55 }}>
              How your body works, in plain words, with every fact checked. Free. For learning: it does not replace your doctor.
            </p>
          </div>
          {COLS.map((c) => (
            <nav key={c.title} aria-label={c.title} className="stack gap-8">
              <span className="cap">{c.title}</span>
              {c.links.map(([label, href]) => (
                <Link key={href} href={href}>
                  {label}
                </Link>
              ))}
            </nav>
          ))}
        </div>
        <hr className="hair" style={{ margin: "36px 0 18px" }} />
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 24px", justifyContent: "space-between", fontSize: 12.5, lineHeight: 1.6 }}>
          <span>
            3D body model: BodyParts3D, © The Database Center for Life Science, licensed under CC Attribution 4.0 International, simplified and scaled to 1.83 m. Pictures and films made from it by Human
            Factory Settings.
          </span>
          <span style={{ fontSize: 12.5 }}>Preview: not public yet</span>
        </div>
      </div>
    </footer>
  );
}

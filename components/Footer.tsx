import Link from "next/link";
import { Logo } from "./Icons";

const COLS = [
  {
    title: "Explore",
    links: [
      ["Six systems", "/explore"],
      ["Heart", "/explore/heart"],
      ["Liver", "/explore/liver"],
      ["Why you wake up tired", "/stories/why-you-wake-up-tired"],
    ],
  },
  {
    title: "Restore",
    links: [
      ["All settings", "/restore"],
      ["Sleep and caffeine", "/restore/sleep-and-caffeine"],
      ["Weight management guide", "/guides/weight"],
      ["Supplements and nutrition guide", "/guides/supplements"],
    ],
  },
  {
    title: "You and films",
    links: [
      ["Find your setting", "/you"],
      ["Fig. 01, How you were built", "/films/fig-01"],
      ["Film grammar", "/films#grammar"],
    ],
  },
  {
    title: "Library",
    links: [
      ["How we grade evidence", "/library#evidence"],
      ["A to Z", "/library#a-to-z"],
      ["Credits and licences", "/library#credits"],
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
              A free, measured reference to how the human body and mind were built. General education, not personal medical advice.
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
            Reference body: BodyParts3D, © The Database Center for Life Science, licensed under CC Attribution 4.0 International. Rendered and measured by Human Factory Settings.
          </span>
          <span className="mono" style={{ fontSize: 11 }}>
            Preview build · not indexed · v0.1
          </span>
        </div>
      </div>
    </footer>
  );
}

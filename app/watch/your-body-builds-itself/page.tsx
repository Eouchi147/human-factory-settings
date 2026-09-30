import type { Metadata } from "next";
import Link from "next/link";
import s from "../watch.module.css";
import { FilmPlayer } from "@/components/FilmPlayer";
import { Icon } from "@/components/Icons";

export const metadata: Metadata = {
  title: "Watch your body build itself",
  description: "In 18 seconds, a 3D human body puts itself together, every part landing where it really sits in you. Tap any part to jump to it.",
};

const LEARN: { href: string; t: string }[] = [
  { href: "/body/skeleton", t: "Your skeleton" },
  { href: "/body/heart", t: "Your heart" },
  { href: "/body/lungs", t: "Your lungs" },
  { href: "/body/liver", t: "Your liver" },
  { href: "/body/digestion", t: "Your gut" },
  { href: "/body/kidneys", t: "Your kidneys" },
  { href: "/body/brain", t: "Your brain" },
  { href: "/body/heart-and-vessels", t: "Your blood vessels" },
];

export default function FilmPage() {
  return (
    <div className="page-top">
      <div className="wrap stack gap-32">
        <nav className="cap" aria-label="Breadcrumb" style={{ display: "flex", gap: 8 }}>
          <Link href="/watch" style={{ color: "var(--ink3)", textDecoration: "none" }}>
            Watch
          </Link>
          <span aria-hidden="true">/</span>
          <span>Your body builds itself</span>
        </nav>
        <h1 className="h1 only-mobile" style={{ marginBottom: -12 }}>
          Your body <span className="serif">builds itself.</span>
        </h1>
        <div className={s.player}>
          <FilmPlayer
            videoClass={s.video}
            sideClass={s.side}
            sheetClass={`cue-sheet ${s.sheet}`}
            header={
              <>
                <h1 className="h1 only-desktop">
                  Your body <span className="serif">builds itself.</span>
                </h1>
                <p className="lede">
                  In 18 seconds, a 3D human body puts itself together. Every bone, organ and blood vessel lands where it really sits in you: the bones first, then the
                  organs, then the blood vessels that connect them.
                </p>
                <p className={s.note}>
                  Look closely at the end: the heart beats, each beat sends a wave down the arteries, and the lungs breathe. No sound yet: a version with a voice
                  explaining each part is on the way.
                </p>
              </>
            }
          />
        </div>

        <section className="stack gap-16" aria-labelledby="learn">
          <h2 id="learn" className="h2">
            Want to know more <span className="serif">about a part?</span>
          </h2>
          <div className={s.learn}>
            {LEARN.map((l) => (
              <Link key={l.href} href={l.href} className={s.learnLink}>
                <span>{l.t}</span>
                <Icon name="arrow" size={16} />
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

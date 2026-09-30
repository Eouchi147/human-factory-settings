import type { Metadata } from "next";
import Link from "next/link";
import s from "./films.module.css";
import { FilmLoop } from "@/components/FilmLoop";
import { FILM, RULES } from "@/lib/film";
import { Icon } from "@/components/Icons";
import { Reveal } from "@/components/Reveal";

export const metadata: Metadata = {
  title: "Films",
  description: "One shot, no cuts: every film is one continuous camera move over one measured body.",
};

export default function FilmsPage() {
  return (
    <div className="page-top">
      <div className="wrap stack gap-32">
        <header className="stack gap-12" style={{ maxWidth: 820 }}>
          <div className="kick a-in">Films</div>
          <h1 className="h1 a-in a-d1">
            One shot. No cuts. <span className="serif">Every part points to the next.</span>
          </h1>
          <p className="lede a-in a-d2">
            Every film is one continuous camera move over one measured body. Nothing is filmed and nothing is generated: each frame is rendered from real anatomy,
            60 times a second. Every film has a twin here on the site, with the sources and all three depths.
          </p>
        </header>

        <div className="grid-2" style={{ alignItems: "stretch" }}>
          <Link href="/films/fig-01" className="card" style={{ display: "grid", gridTemplateColumns: "150px minmax(0,1fr)", gap: 18, padding: 14, alignItems: "center" }}>
            <div style={{ borderRadius: 16, overflow: "hidden", aspectRatio: "9 / 16", background: "#07080a", border: "1px solid var(--edge)" }}>
              <FilmLoop src={FILM.src} poster={FILM.poster} label="Fig. 01 preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <div className="stack gap-10">
              <span className="kick">Fig. 01 · Short · 18 s</span>
              <span className="h3">How you were built</span>
              <span style={{ fontSize: 14.5, color: "var(--ink3)" }}>The reference body assembles itself, bottom first, in one unbroken shot.</span>
              <span className="row-wrap gap-8" style={{ color: "var(--signal-ink)", fontWeight: 600, fontSize: 14 }}>
                <Icon name="play" size={16} />
                Watch with the cue sheet
              </span>
            </div>
          </Link>
          <div className="card card-pad stack gap-10" style={{ justifyContent: "center" }}>
            <span className="kick">Fig. 01 · Long-form · voiced</span>
            <span className="h3">The same shot, slowed for the voice</span>
            <span style={{ fontSize: 14.5, color: "var(--ink3)" }}>
              Eleven lines, each landing with the part it names. Recording in December; the first long-form episode follows.
            </span>
            <span className="tag" style={{ alignSelf: "flex-start" }}>
              In production
            </span>
          </div>
        </div>

        <section id="grammar" className="stack gap-16" style={{ scrollMarginTop: 110 }}>
          <div className="kick">Film grammar · the house rules</div>
          <div className={s.rules}>
            {RULES.map((r, i) => (
              <Reveal key={r.t} delay={(i % 3) * 0.05}>
                <div className={`glass ${s.rule}`} style={{ height: "100%" }}>
                  <span className="mono" style={{ fontSize: 12, fontWeight: 600, color: "var(--signal-ink)" }}>
                    0{i + 1}
                  </span>
                  <span className="x108" style={{ fontSize: 18, fontWeight: 650, letterSpacing: "-.01em" }}>
                    {r.t}
                  </span>
                  <span style={{ fontSize: 14, lineHeight: 1.5, color: "var(--ink2)" }}>{r.d}</span>
                </div>
              </Reveal>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

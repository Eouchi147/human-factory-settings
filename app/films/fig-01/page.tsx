import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import s from "../films.module.css";
import { FilmPlayer } from "@/components/FilmPlayer";
import { VoiceLine } from "@/components/VoiceLine";
import { BOARD, STATS } from "@/lib/film";

export const metadata: Metadata = {
  title: "Fig. 01, How you were built",
  description: "The reference body assembles itself in one unbroken 18-second shot, with the cue sheet that times every part.",
};

export default function Fig01Page() {
  return (
    <div className="page-top">
      <div className="wrap stack gap-32">
        <div className={s.player}>
          <FilmPlayer
            videoClass={s.video}
            sideClass={s.side}
            sheetClass={`cue-sheet ${s.sheet}`}
            header={
              <>
                <div className="kick">Fig. 01 · Film</div>
                <h1 className="h1">
                  How you were built <span className="serif">in one unbroken shot.</span>
                </h1>
                <p className="lede">
                  Every frame is drawn from the measured reference body; nothing is filmed or generated. The skeleton lands bottom first, the organs slide into their
                  true places, then the vessels grow out from the heart, in one camera move with no cuts.
                </p>
                <div className={s.stats}>
                  {STATS.map(([v, k]) => (
                    <div key={k} className={s.stat}>
                      <b>{v}</b>
                      <span className="cap">{k}</span>
                    </div>
                  ))}
                </div>
                <div className="row-wrap gap-8">
                  <span className="cap" style={{ marginRight: 4 }}>
                    In the film
                  </span>
                  <span className="ms">Heart 64 a minute</span>
                  <span className="ms">Breath 14 a minute</span>
                  <span className="ms">Pulse wave about 6 m/s</span>
                </div>
              </>
            }
          />
        </div>
        <p className="cap" style={{ margin: "-12px 0 0", textTransform: "none", letterSpacing: ".02em" }}>
          Preview render, 720 × 1280, silent. The full-size cut with glass labels and sound is in production.
        </p>

        <section className="stack gap-16" aria-labelledby="board">
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
            <h2 id="board" className="h2">
              Storyboard <span className="serif">frame by frame.</span>
            </h2>
            <span className="cap">The short has no voice: labels carry the facts, sound carries the rhythm</span>
          </div>
          <div className={s.board}>
            {BOARD.map((f) => (
              <figure key={f.tc} className={s.frame}>
                <div className={s.frameImg}>
                  <Image src={f.img} alt={`Film frame at ${f.tc}: ${f.on}`} fill sizes="(min-width: 1200px) 12vw, (min-width: 760px) 25vw, 50vw" style={{ objectFit: "cover" }} />
                </div>
                <span className="mono" style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)" }}>
                  {f.tc}
                </span>
                <span style={{ fontSize: 13, lineHeight: 1.4, color: "var(--ink2)" }}>{f.on}</span>
                <span className="stack" style={{ gap: 2 }}>
                  <span className="cap" style={{ fontSize: 9.5 }}>
                    Sound
                  </span>
                  <span style={{ fontSize: 12.5, lineHeight: 1.35, color: "var(--ink3)" }}>{f.sound}</span>
                </span>
                <span className={`stack ${s.vo}`} style={{ gap: 2 }}>
                  <span className="cap" style={{ fontSize: 9.5 }}>
                    Long-form voice · line {f.line}
                  </span>
                  <span style={{ fontSize: 13, lineHeight: 1.4, color: "var(--ink)" }}>
                    <VoiceLine text={f.vo} />
                  </span>
                </span>
              </figure>
            ))}
          </div>
        </section>

        <div className="card card-pad" style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <div className="stack gap-6" style={{ maxWidth: 720 }}>
            <span className="kick">Long-form, 16:9</span>
            <span style={{ fontSize: 15.5, color: "var(--ink2)", lineHeight: 1.55 }}>
              The same single shot at about a quarter of the speed, so the voice has room: eleven lines, each timed to the part it names.
            </span>
          </div>
          <Link href="/films#grammar" className="btn btn-ghost btn-sm">
            The film grammar
          </Link>
        </div>
      </div>
    </div>
  );
}

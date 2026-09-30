import type { Metadata } from "next";
import Link from "next/link";
import s from "./watch.module.css";
import { FilmLoop } from "@/components/FilmLoop";
import { FILM } from "@/lib/film";
import { Icon } from "@/components/Icons";

export const metadata: Metadata = {
  title: "Watch",
  description: "Short films that show how your body is built, made from a detailed 3D model of human anatomy.",
};

export default function WatchPage() {
  return (
    <div className="page-top">
      <div className="wrap stack gap-32">
        <header className="stack gap-12" style={{ maxWidth: 820 }}>
          <h1 className="h1 a-in">
            Watch how you <span className="serif">are built.</span>
          </h1>
          <p className="lede a-in a-d1">
            Short films made from a detailed 3D model of the human body. Every part is in true proportion and in its real place, so you see how you actually fit
            together.
          </p>
        </header>

        <div className="grid-2" style={{ alignItems: "stretch" }}>
          <Link href="/watch/your-body-builds-itself" className={`card ${s.filmCard}`}>
            <div className={s.filmThumb}>
              <FilmLoop src={FILM.src} poster={FILM.poster} label="Preview: a 3D body puts itself together" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <div className="stack gap-10">
              <span className="kick" style={{ fontSize: 10.5 }}>
                18 seconds
              </span>
              <span className="h3">Your body builds itself</span>
              <span style={{ fontSize: 15, lineHeight: 1.5, color: "var(--ink2)" }}>Bones, organs, then blood vessels, each one landing where it sits in you.</span>
              <span className="row-wrap gap-8" style={{ color: "var(--signal-ink)", fontWeight: 650, fontSize: 14.5 }}>
                <Icon name="play" size={16} />
                Watch
              </span>
            </div>
          </Link>
          <div className="card card-pad stack gap-10" style={{ justifyContent: "center" }}>
            <span className="tag" style={{ alignSelf: "flex-start" }}>
              Coming soon
            </span>
            <span className="h3">The same film, with a voice</span>
            <span style={{ fontSize: 15, lineHeight: 1.5, color: "var(--ink2)" }}>
              Slowed down, with a narrator explaining each part as it lands: what it is, what it does, and one fact to remember.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import s from "./watch.module.css";
import { Icon } from "@/components/Icons";

export const metadata: Metadata = {
  title: "Watch",
  description: "Short films that answer what people ask about their health, one question at a time, with real 3D anatomy and plain words.",
};

export default function WatchPage() {
  return (
    <div className="page-top">
      <div className="wrap stack gap-32">
        <header className="stack gap-12" style={{ maxWidth: 820 }}>
          <h1 className="h1 a-in">
            Watch it, <span className="serif">don&apos;t read it.</span>
          </h1>
          <p className="lede a-in a-d1">
            Each film answers one question people ask, as a short story: a moment you know, what happens inside you, and the one change that sets it back. Short
            films for your feed, longer documentaries for the whole story.
          </p>
        </header>

        <section className={`card ${s.next}`} aria-labelledby="film1">
          <div className={s.nextText}>
            <span className={s.soon}>Film 1 · coming 20 October</span>
            <h2 id="film1" className="h2">
              Why am I always <span className="serif">tired?</span>
            </h2>
            <p className="lede" style={{ margin: 0 }}>
              Three things to check first: short sleep, late coffee and late light. About one minute, in ten calm shots.
            </p>
            <div className="row-wrap gap-10">
              <Link className="btn btn-signal" href="/sleep-energy/why-am-i-always-tired">
                Read the answer now
                <Icon name="arrow" size={16} />
              </Link>
            </div>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className={s.board} src="/img/film1_storyboard.jpg" alt="Film 1 in eight preview stills: an alarm clock at 7 a.m., the brain filling with the sleepy chemical, the caffeine curve from a coffee cup, a lamp and phone at 11:47 p.m., the sleep signal arriving later, three dials, the clock in warm morning light, the logo dial" width={2000} height={2207} loading="lazy" />
        </section>

        <section className="card card-pad stack gap-10" aria-labelledby="doc1" style={{ maxWidth: 820 }}>
          <span className={s.soon}>Documentary 1 · after film 1</span>
          <h2 id="doc1" className="h3">
            Sleep, the setting that runs the others
          </h2>
          <p style={{ margin: 0, fontSize: 15.5, lineHeight: 1.55, color: "var(--ink2)" }}>
            About 12 minutes, in three chapters: why you&apos;re always tired, how to fall asleep faster, and why you wake up at 3 a.m.
          </p>
        </section>
      </div>
    </div>
  );
}

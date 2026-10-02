import Link from "next/link";
import s from "./home.module.css";
import { HeroStage } from "@/components/hero/HeroStage";
import { Icon, type IconName } from "@/components/Icons";
import { Reveal } from "@/components/Reveal";
import { AREAS } from "@/lib/areas";

const TOOLS: { href: string; icon: IconName; t: string; d: string }[] = [
  { href: "/tools#pulse", icon: "heart", t: "Check your pulse", d: "Tap along with your heartbeat. Get your number in 10 seconds." },
  { href: "/tools#caffeine", icon: "cup", t: "Caffeine at bedtime", d: "Add your coffees and see how much is still in you at night." },
  { href: "/tools#waist", icon: "tape", t: "Waist and height", d: "Is your waist less than half your height? A quick check doctors use." },
  { href: "/quiz", icon: "dial", t: "Your personality type", d: "Eleven questions. You land on a map, not in a box." },
];

export default function Home() {
  return (
    <>
      <HeroStage />

      <section className="section" aria-labelledby="mission-h">
        <div className="wrap">
          <Reveal>
            <div className={s.mission}>
              <h2 id="mission-h" className="h2">
                One body. <span className="serif">A short time.</span>
              </h2>
              <p className="lede">
                You were handed one body, and not much time with it. It came with factory settings: how you sleep, eat, move, stand, breathe and connect. Modern
                life moves them. We show you how each one works, what moved it, and the plain change that sets it back. No miracle fixes: only what the evidence
                supports.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      <section id="fix" className="section" style={{ scrollMarginTop: 70 }} aria-labelledby="fix-h">
        <div className="wrap stack gap-32">
          <Reveal>
            <div className="stack gap-12" style={{ maxWidth: 720 }}>
              <h2 id="fix-h" className="h2">
                What do you want <span className="serif">to fix?</span>
              </h2>
              <p className="lede">The questions people ask most, answered simply. Start anywhere.</p>
            </div>
          </Reveal>
          <div className={s.areas}>
            {AREAS.map((a, i) => (
              <Reveal key={a.slug} delay={(i % 3) * 0.05}>
                <div className={`card ${s.area}`}>
                  <Link href={`/${a.slug}`} className={s.areaHead}>
                    <span className={s.areaIcon}>
                      <Icon name={a.icon} size={20} />
                    </span>
                    <span className={s.areaName}>{a.name}</span>
                    <Icon name="arrow" size={16} />
                  </Link>
                  <ul className={s.areaQs}>
                    {a.questions.slice(0, 3).map((q) => (
                      <li key={q.q}>
                        {q.slug ? (
                          <Link href={`/${a.slug}/${q.slug}`}>{q.q}</Link>
                        ) : (
                          <Link href={`/${a.slug}`} className={s.soon}>
                            {q.q}
                          </Link>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }} aria-labelledby="watch-h">
        <div className="wrap">
          <div className={s.filmGrid}>
            <Reveal>
              <Link href="/watch" className={s.phoneFrame} aria-label="Film 1, Why am I always tired? Coming 20 October">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/img/film1_still.jpg" alt="Film 1: an alarm clock at 7 a.m. in cold light, under the words Always tired?" width={1080} height={1920} loading="lazy" />
                <span className={s.soonChip}>Film 1 · 20 October</span>
              </Link>
            </Reveal>
            <Reveal delay={0.08}>
              <div className="stack gap-20">
                <h2 id="watch-h" className="h2">
                  Watch it, <span className="serif">don&apos;t read it.</span>
                </h2>
                <p className="lede">
                  One question at a time, as a short story: what happens inside you, and the one change that fixes it. Short films for your feed, longer deep dives for
                  when you want the whole story.
                </p>
                <div className="row-wrap gap-10">
                  <Link className="btn" href="/watch">
                    <Icon name="play" size={16} />
                    See film 1
                  </Link>
                  <Link className="btn btn-ghost" href="/sleep-energy/why-am-i-always-tired">
                    Read the answer now
                  </Link>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }} aria-labelledby="tools-h">
        <div className="wrap stack gap-24">
          <Reveal>
            <h2 id="tools-h" className="h2">
              Try it <span className="serif">on yourself.</span>
            </h2>
          </Reveal>
          <div className={s.tools}>
            {TOOLS.map((x, i) => (
              <Reveal key={x.href} delay={(i % 4) * 0.05}>
                <Link href={x.href} className={`card ${s.tool}`}>
                  <span className={s.toolIcon}>
                    <Icon name={x.icon} size={22} />
                  </span>
                  <span className="stack gap-6" style={{ minWidth: 0 }}>
                    <span className={s.toolTitle}>{x.t}</span>
                    <span className={s.toolText}>{x.d}</span>
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

import Link from "next/link";
import Image from "next/image";
import s from "./home.module.css";
import { MeasuredFigure } from "@/components/MeasuredFigure";
import { Ev, Measured } from "@/components/Evidence";
import { Icon } from "@/components/Icons";
import { Reveal } from "@/components/Reveal";
import { FilmLoop } from "@/components/FilmLoop";
import { FILM, STATS } from "@/lib/film";
import { SYSTEMS } from "@/lib/systems";
import { ADENOSINE_SVG, CAFFEINE_SVG } from "@/lib/molecules";

const DOORS = [
  { icon: "explore" as const, t: "Explore the factory", d: "Every system, measured on one real body", href: "/explore" },
  { icon: "restore" as const, t: "Restore a setting", d: "Step-by-step fixes, every step graded", href: "/restore" },
  { icon: "dial" as const, t: "Find your setting", d: "Your position on two measured traits", href: "/you" },
];

const METER = [
  { el: <Ev level={4} text="Strong" />, d: "Many good studies agree. Unlikely to change." },
  { el: <Ev level={3} text="Good" />, d: "Solid studies, with a little room to move." },
  { el: <Ev level={2} text="Some" />, d: "Promising, but limited or mixed studies." },
  { el: <Ev level={1} text="Early" />, d: "First studies or small trials. Could easily change." },
  { el: <Ev level={0} text="Tradition, not tested" />, d: "An old idea shown for context, never as science." },
  { el: <Measured text="Measured" />, d: "A number we measured ourselves on the reference body." },
];

export default function Home() {
  return (
    <>
      <section className={s.hero} aria-label="Introduction">
        <div className={`${s.desk} only-desktop`}>
          <MeasuredFigure
            className={s.deskFig}
            src="/img/home_desktop.jpg"
            alt="Full adult reference body standing on a measured turntable: skeleton, organs, arteries and veins"
            w={2880}
            h={1800}
            fit="cover"
            focus={[0.62, 0.5]}
            priority
            sizes="100vw"
            ruler={{ head: [1848.1, 241.3], foot: [1846.8, 1638], x: 2188.1, meters: 1.73, label: "1.73 m", sub: "Height · measured" }}
            callouts={[
              { at: [1871.9, 585.4], x: 2272, y: 500, side: "right", kicker: "Heart", value: "12.5 cm long axis" },
              { at: [1899.6, 634.6], x: 2272, y: 660, side: "right", kicker: "Ribs", value: "12 pairs" },
              { at: [1827.6, 680.1], x: 2272, y: 820, side: "right", kicker: "Liver", value: "22.8 cm across" },
            ]}
            dims={[{ a: [1887.5, 1276.8], b: [1915.5, 907.1], label: "46.7 cm", sub: "Femur · measured", off: [86, 40] }]}
            labelWidth={176}
          />
          <div className={s.deskShade} />
          <div className={s.deskFoot} />
          <div className={s.deskCopy}>
            <div className="kick a-in">Fig. 01 · Measured on a reference body</div>
            <h1 className="h-display a-in a-d1">
              <span className="l1">You came with</span>
              <span className="l2">factory settings.</span>
            </h1>
            <p className="a-in a-d2">
              Your body and mind were built to run a certain way. Modern life quietly changed many of the settings. See how you work, measured on a real
              reference body, and restore what drifted, step by step.
            </p>
            <div className="row-wrap gap-12 a-in a-d3">
              <Link className="btn" href="/you">
                Find your setting
              </Link>
              <Link className="btn btn-ghost" href="/films/fig-01">
                <Icon name="play" size={16} />
                Watch Fig. 01, How you were built
              </Link>
            </div>
            <div className="row-wrap gap-8 a-in a-d4" style={{ marginTop: 4 }}>
              <span className="cap" style={{ marginRight: 4 }}>
                Every claim is graded
              </span>
              <Ev level={4} text="Strong" />
              <Ev level={3} text="Good" />
              <Ev level={2} text="Some" />
              <Ev level={1} text="Early" />
            </div>
          </div>
          <div className={`cap ${s.credit}`}>Reference body: BodyParts3D, CC BY 4.0 · adult male</div>
        </div>

        <div className={`${s.phone} only-mobile`}>
          <MeasuredFigure
            className={s.phoneFig}
            src="/img/home_phone.jpg"
            alt="Real anatomy of an adult reference body: skeleton, organs, arteries and veins, seen from the front left"
            w={780}
            h={1688}
            fit="cover"
            focus={[0.5, 0.2]}
            priority
            sizes="100vw"
            dims={[{ a: [421.9, 690.2], b: [397.1, 609] }]}
            callouts={[
              { at: [420.5, 638.6], x: 536, y: 412, side: "right", kicker: "Heart", value: "12.5 cm<br>long axis" },
              { at: [370.9, 726], x: 212, y: 636, side: "left", kicker: "Liver", value: "22.8 cm<br>across" },
            ]}
            labelWidth={104}
          />
          <div className={s.phoneScrim} />
          <div className={s.phoneCopy}>
            <div className="kick">Fig. 01 · Measured on a reference body</div>
            <h1 className="h-display" style={{ lineHeight: 1 }}>
              <span className="l1" style={{ fontSize: 34 }}>
                You came with
              </span>
              <span className="l2" style={{ fontSize: 45 }}>
                factory settings.
              </span>
            </h1>
            <p>Modern life changed many of them. See how you are built, measured on a real reference body, and restore what drifted.</p>
            <div className="row-wrap gap-10" style={{ marginTop: 4 }}>
              <Link className="btn" href="/you">
                Find your setting
              </Link>
              <Link className="btn btn-ghost" href="/films/fig-01">
                <Icon name="play" size={16} />
                Watch Fig. 01
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="section-tight">
        <div className="wrap">
          <div className={s.doors}>
            {DOORS.map((d, i) => (
              <Reveal key={d.href} delay={i * 0.06}>
                <Link href={d.href} className={`card ${s.door}`}>
                  <span className={s.doorIcon}>
                    <Icon name={d.icon} size={20} />
                  </span>
                  <span className="stack gap-6">
                    <span style={{ fontSize: 17, fontWeight: 650, color: "var(--ink)" }}>{d.t}</span>
                    <span style={{ fontSize: 14, color: "var(--ink3)" }}>{d.d}</span>
                  </span>
                  <span style={{ marginTop: "auto", color: "var(--signal-ink)" }}>
                    <Icon name="arrow" size={18} />
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className={s.filmGrid}>
            <Reveal>
              <div className={s.phoneFrame}>
                <FilmLoop src={FILM.src} poster={FILM.poster} label="Fig. 01, How you were built: the reference body assembles itself in one continuous shot" />
              </div>
            </Reveal>
            <Reveal delay={0.08}>
              <div className="stack gap-20">
                <div className="kick">Fig. 01 · Film</div>
                <h2 className="h2">
                  How you were built <span className="serif">in one unbroken shot.</span>
                </h2>
                <p className="lede">
                  Every film is one continuous camera move over one measured body. Nothing is filmed and nothing is generated: each frame is rendered from real
                  anatomy, 60 times a second, and each part starts moving before the last one lands.
                </p>
                <div className={s.stats}>
                  {STATS.map(([v, k]) => (
                    <div key={k} className={s.stat}>
                      <b>{v}</b>
                      <span className="cap">{k}</span>
                    </div>
                  ))}
                </div>
                <div className="row-wrap gap-10">
                  <Link className="btn" href="/films/fig-01">
                    <Icon name="play" size={16} />
                    Open the film and its cue sheet
                  </Link>
                  <Link className="btn btn-ghost" href="/films#grammar">
                    The film grammar
                  </Link>
                </div>
                <p className="cap" style={{ margin: 0, textTransform: "none", letterSpacing: ".02em" }}>
                  Preview render, 720 × 1280, silent. The full-size cut with sound comes next.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="wrap stack gap-32">
          <Reveal>
            <div className="stack gap-12" style={{ maxWidth: 760 }}>
              <div className="kick">Explore</div>
              <h2 className="h2">
                Six systems, <span className="serif">one body.</span>
              </h2>
              <p className="lede">Every system is measured on the same reference body, so every number on this site fits with every other.</p>
            </div>
          </Reveal>
          <div className={s.sysGrid}>
            {SYSTEMS.filter((x) => x.inExplore).map((x, i) => (
              <Reveal key={x.slug} delay={(i % 3) * 0.06}>
                <Link href={`/explore/${x.slug}`} className={`card ${s.sysCard}`}>
                  <div className={s.sysImg}>
                    <Image src={x.img} alt={x.alt} fill sizes="(min-width: 900px) 33vw, 50vw" style={{ objectFit: "cover" }} />
                    <div className={s.sysBody}>
                      <div className="kick" style={{ fontSize: 10 }}>
                        {x.group}
                      </div>
                      <div style={{ fontSize: 18, fontWeight: 650, color: "var(--ink)", marginTop: 4 }}>{x.name}</div>
                      <div className="mono" style={{ fontSize: 12, color: "var(--ink2)", marginTop: 4 }}>
                        {x.cardRows[0][0]} · <span style={{ color: "var(--ink)" }}>{x.cardRows[0][1]}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className={s.story}>
            <Reveal>
              <div className={s.mols}>
                <figure className={`glass ${s.mol}`}>
                  <div dangerouslySetInnerHTML={{ __html: ADENOSINE_SVG }} />
                  <figcaption className="stack gap-6">
                    <span className="cap" style={{ color: "var(--violet-ink)" }}>
                      Adenosine
                    </span>
                    <span style={{ fontSize: 13.5, color: "var(--ink2)" }}>The sleep signal</span>
                  </figcaption>
                </figure>
                <figure className={`glass ${s.mol}`}>
                  <div dangerouslySetInnerHTML={{ __html: CAFFEINE_SVG }} />
                  <figcaption className="stack gap-6">
                    <span className="cap" style={{ color: "var(--signal-ink)" }}>
                      Caffeine
                    </span>
                    <span style={{ fontSize: 13.5, color: "var(--ink2)" }}>Same double ring</span>
                  </figcaption>
                </figure>
              </div>
            </Reveal>
            <Reveal delay={0.08}>
              <div className="stack gap-16">
                <div className="kick">Story · Why you wake up tired</div>
                <h2 className="h2">
                  Caffeine is shaped almost like the <span className="serif">sleep signal.</span>
                </h2>
                <p className="lede">
                  Adenosine builds up while you are awake and pushes you toward sleep. Caffeine fits the same docking spots and blocks them without switching them on.
                  That is the main way it keeps you alert, and why a late cup still costs you sleep.
                </p>
                <div className="row-wrap gap-10">
                  <Ev level={4} />
                  <span className="cap" style={{ textTransform: "none", letterSpacing: ".02em" }}>
                    Institute of Medicine, 2001
                  </span>
                </div>
                <div className="row-wrap gap-10">
                  <Link className="btn" href="/stories/why-you-wake-up-tired">
                    Read the story
                  </Link>
                  <Link className="btn btn-ghost" href="/restore/sleep-and-caffeine">
                    Protect your sleep
                  </Link>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="wrap stack gap-24">
          <Reveal>
            <div className="stack gap-12" style={{ maxWidth: 760 }}>
              <div className="kick">Deep guides</div>
              <h2 className="h2">
                Weight, food and supplements, <span className="serif">graded.</span>
              </h2>
            </div>
          </Reveal>
          <div className="grid-2">
            <Reveal>
              <Link href="/guides/weight" className="card card-pad" style={{ minHeight: 220, display: "flex", flexDirection: "column", gap: 12 }}>
                <span className="kick">Guide · Weight management</span>
                <span className="h3">What actually moves body weight, and keeps it there.</span>
                <span style={{ color: "var(--ink3)", fontSize: 14.5 }}>
                  Diets head to head, protein, strength, sleep, medicines and surgery, and the myths, each with its evidence.
                </span>
                <span className="row-wrap gap-8" style={{ marginTop: "auto" }}>
                  <Ev level={4} text="Strong" />
                  <Ev level={3} text="Good" />
                  <Ev level={2} text="Some" />
                </span>
              </Link>
            </Reveal>
            <Reveal delay={0.06}>
              <Link href="/guides/supplements" className="card card-pad" style={{ minHeight: 220, display: "flex", flexDirection: "column", gap: 12 }}>
                <span className="kick">Guide · Supplements and nutrition</span>
                <span className="h3">Food does almost all the work. A few pills help specific people.</span>
                <span style={{ color: "var(--ink3)", fontSize: 14.5 }}>
                  What the body needs, the supplements with real evidence, the ones most people do not need, and the ones that do harm.
                </span>
                <span className="row-wrap gap-8" style={{ marginTop: "auto" }}>
                  <Ev level={4} text="Strong" />
                  <Ev level={1} text="Early" />
                  <Ev level={-1} text="No benefit" />
                </span>
              </Link>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="wrap stack gap-24">
          <Reveal>
            <div className="stack gap-12" style={{ maxWidth: 760 }}>
              <div className="kick">How we grade</div>
              <h2 className="h2">
                Strong, good, some, early. <span className="serif">Every claim.</span>
              </h2>
              <p className="lede">
                Adapted from GRADE, the system medicine uses to rate evidence. Old ideas are labelled as tradition, and numbers we measured ourselves are marked
                as measured.
              </p>
            </div>
          </Reveal>
          <div className={s.meter}>
            {METER.map((m, i) => (
              <Reveal key={i} delay={(i % 3) * 0.05}>
                <div className={s.meterItem}>
                  <span>{m.el}</span>
                  <span style={{ fontSize: 14.5, color: "var(--ink2)" }}>{m.d}</span>
                </div>
              </Reveal>
            ))}
          </div>
          <div>
            <Link href="/library#evidence" className="btn btn-ghost btn-sm">
              How we grade evidence
              <Icon name="arrow" size={16} />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

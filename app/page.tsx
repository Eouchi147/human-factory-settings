import Link from "next/link";
import Image from "next/image";
import s from "./home.module.css";
import { MeasuredFigure } from "@/components/MeasuredFigure";
import { Ev, Measured } from "@/components/Evidence";
import { Icon } from "@/components/Icons";
import { Reveal } from "@/components/Reveal";
import { FilmLoop } from "@/components/FilmLoop";
import { DepthSwitch, DepthText } from "@/components/Depth";
import { Dial } from "@/components/SettingViz";
import { FILM } from "@/lib/film";
import { bySlug } from "@/lib/systems";
import { ADENOSINE_SVG, CAFFEINE_SVG } from "@/lib/molecules";
import { BLUR } from "@/lib/blur";

type Q = { href: string; topic: string; q: string; d: string; img?: string; pos?: string; visual?: "molecules" | "dial" };

/* The questions people actually ask. Each one opens a short story or guide. */
const QUESTIONS: Q[] = [
  {
    href: "/stories/why-you-wake-up-tired",
    topic: "Sleep",
    q: "Why do I wake up tired?",
    d: "A chemical builds up all day to make you sleepy. Coffee hides the feeling. It doesn't take the chemical away.",
    visual: "molecules",
  },
  { href: "/body/heart", topic: "Heart", q: "What does my heart actually do?", d: "It's two pumps in one, about the size of your fist, and it never takes a break.", img: "/img/heart.jpg", pos: "50% 42%" },
  { href: "/guides/supplements", topic: "Food", q: "Do I need supplements?", d: "Food does almost all the work. A few pills help specific people. Some do harm.", img: "/img/sys_digestion.jpg", pos: "50% 40%" },
  { href: "/guides/weight", topic: "Weight", q: "How do I lose weight and keep it off?", d: "What really works, what doesn't, and why your body pushes back.", img: "/img/home_phone.jpg", pos: "50% 34%" },
  { href: "/body/lungs", topic: "Lungs", q: "How does the air I breathe get into my blood?", d: "Through a tree of tubes that splits again and again, down to tiny air bubbles.", img: "/img/sys_lungs.jpg", pos: "50% 30%" },
  { href: "/quiz", topic: "Personality", q: "What's my personality type?", d: "Eleven quick questions. You land on a map, not in a box.", visual: "dial" },
];

const MORE: { href: string; q: string }[] = [
  { href: "/body/skeleton", q: "What holds me up?" },
  { href: "/body/heart-and-vessels", q: "How does blood reach every part of me?" },
  { href: "/body/digestion", q: "Where does my food go?" },
  { href: "/body/brain", q: "How does my brain run everything?" },
  { href: "/body/kidneys", q: "What do my kidneys do all day?" },
  { href: "/body/liver", q: "Why is my liver built like a puzzle?" },
];

const METER = [
  { el: <Ev level={4} text="Strong evidence" />, d: "Many good studies agree. Very unlikely to change." },
  { el: <Ev level={3} text="Good evidence" />, d: "Solid studies agree, with a little room to move." },
  { el: <Ev level={2} text="Some evidence" />, d: "Promising, but the studies are small or mixed." },
  { el: <Ev level={1} text="Early evidence" />, d: "First studies only. It could easily change." },
  { el: <Ev level={0} text="Old idea, not tested" />, d: "An old belief, shown so you know where it comes from. Never as science." },
  { el: <Measured text="Measured on our 3D body" />, d: "A size we measured ourselves on the 3D body you see on this site." },
];

function QuestionVisual({ q }: { q: Q }) {
  if (q.visual === "molecules")
    return (
      <div className={s.qMols} aria-hidden="true">
        <div dangerouslySetInnerHTML={{ __html: ADENOSINE_SVG }} />
        <div dangerouslySetInnerHTML={{ __html: CAFFEINE_SVG }} />
      </div>
    );
  if (q.visual === "dial")
    return (
      <div className={s.qDial} aria-hidden="true">
        <Dial size={150} active={4} />
      </div>
    );
  return <Image src={q.img!} alt="" fill sizes="(min-width: 1000px) 33vw, (min-width: 640px) 50vw, 100vw" placeholder="blur" blurDataURL={BLUR[q.img!]} style={{ objectFit: "cover", objectPosition: q.pos ?? "50% 50%" }} />;
}

export default function Home() {
  const heart = bySlug("heart")!;
  return (
    <>
      <section className={s.hero} aria-label="Introduction">
        <div className={`${s.desk} only-desktop`}>
          <MeasuredFigure
            className={s.deskFig}
            src="/img/home_desktop.jpg"
            alt="A 3D human body standing: skeleton, organs, arteries and veins"
            w={2880}
            h={1800}
            fit="cover"
            focus={[0.62, 0.22]}
            priority
            sizes="100vw"
            ruler={{ head: [1848.1, 241.3], foot: [1846.8, 1638], x: 2188.1, meters: 1.73, label: "1.73 m", sub: "Height" }}
            callouts={[
              { at: [1871.9, 585.4], x: 2272, y: 500, side: "right", kicker: "Heart", value: "About the size of your fist" },
              { at: [1899.6, 634.6], x: 2272, y: 660, side: "right", kicker: "Ribs", value: "12 pairs, around heart and lungs" },
              { at: [1827.6, 680.1], x: 2272, y: 820, side: "right", kicker: "Liver", value: "About 1.4 kg" },
            ]}
            dims={[{ a: [1887.5, 1276.8], b: [1915.5, 907.1], label: "46.7 cm", sub: "Thigh bone, the longest", off: [86, 40] }]}
            labelWidth={196}
          />
          <div className={s.deskShade} />
          <div className={s.deskFoot} />
          <div className={s.deskCopy}>
            <div className="kick a-in">How your body works, made simple</div>
            <h1 className="h-display a-in a-d1">
              <span className="l1">You came with</span>
              <span className="l2">factory settings.</span>
            </h1>
            <p className="a-in a-d2">
              Your body was built to run a certain way. Modern life quietly changed some of the settings. See how you work, in plain words and real 3D pictures, and
              learn how to reset what drifted.
            </p>
            <div className="row-wrap gap-12 a-in a-d3">
              <a className="btn" href="#questions">
                Start with a question
              </a>
              <Link className="btn btn-ghost" href="/watch/your-body-builds-itself">
                <Icon name="play" size={16} />
                Watch your body build itself
              </Link>
            </div>
            <p className={`a-in a-d4 ${s.trustLine}`}>Free. Every fact checked and linked to its source.</p>
          </div>
        </div>

        <div className={`${s.phone} only-mobile`}>
          <MeasuredFigure
            className={s.phoneFig}
            src="/img/home_phone.jpg"
            alt="A 3D human body seen from the front: skeleton, organs, arteries and veins"
            w={780}
            h={1688}
            fit="cover"
            focus={[0.5, 0.2]}
            priority
            sizes="100vw"
            callouts={[
              { at: [420.5, 638.6], x: 536, y: 412, side: "right", kicker: "Heart", value: "Size of<br>your fist" },
              { at: [370.9, 726], x: 212, y: 636, side: "left", kicker: "Liver", value: "About<br>1.4 kg" },
            ]}
            labelWidth={104}
          />
          <div className={s.phoneScrim} />
          <div className={s.phoneCopy}>
            <div className="kick">How your body works, made simple</div>
            <h1 className="h-display" style={{ lineHeight: 1 }}>
              <span className="l1" style={{ fontSize: 34 }}>
                You came with
              </span>
              <span className="l2" style={{ fontSize: 45 }}>
                factory settings.
              </span>
            </h1>
            <p>Modern life changed some of them. See how you work, in plain words and real 3D pictures, and reset what drifted.</p>
            <div className="row-wrap gap-10" style={{ marginTop: 4 }}>
              <a className="btn" href="#questions">
                Start with a question
              </a>
              <Link className="btn btn-ghost" href="/watch/your-body-builds-itself">
                <Icon name="play" size={16} />
                Watch
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section id="questions" className="section-tight" style={{ scrollMarginTop: 70 }}>
        <div className="wrap stack gap-32">
          <Reveal>
            <div className="stack gap-12" style={{ maxWidth: 760 }}>
              <h2 className="h2">
                Start with a <span className="serif">question.</span>
              </h2>
              <p className="lede">Each answer is a short story with pictures, in plain words. The science and the sources are right there if you want them.</p>
            </div>
          </Reveal>
          <div className={s.qGrid}>
            {QUESTIONS.map((q, i) => (
              <Reveal key={q.href} delay={(i % 3) * 0.06}>
                <Link href={q.href} className={`card ${s.qCard}`}>
                  <div className={s.qImg}>
                    <QuestionVisual q={q} />
                  </div>
                  <div className={s.qBody}>
                    <span className="kick" style={{ fontSize: 10.5 }}>
                      {q.topic}
                    </span>
                    <span className={s.qTitle}>{q.q}</span>
                    <span className={s.qText}>{q.d}</span>
                    <span className={s.qGo}>
                      {q.href === "/quiz" ? "Take the quiz" : q.href.startsWith("/guides") ? "Read the guide" : "Find out"}
                      <Icon name="arrow" size={16} />
                    </span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
          <Reveal>
            <div className={s.more}>
              <span className="cap">More questions about your body</span>
              <div className={s.moreList}>
                {MORE.map((m) => (
                  <Link key={m.href} href={m.href} className={s.moreLink}>
                    <span>{m.q}</span>
                    <Icon name="arrow" size={16} />
                  </Link>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className={s.filmGrid}>
            <Reveal>
              <div className={s.phoneFrame}>
                <FilmLoop src={FILM.src} poster={FILM.poster} label="A 3D body puts itself together: bones, then organs, then blood vessels" />
              </div>
            </Reveal>
            <Reveal delay={0.08}>
              <div className="stack gap-20">
                <div className="kick">Watch</div>
                <h2 className="h2">
                  Watch your body <span className="serif">build itself.</span>
                </h2>
                <p className="lede">
                  In 18 seconds, a 3D human body puts itself together, every part landing where it really sits in you: the bones first, then the heart, lungs, gut
                  and brain, then the blood vessels. Once the heart is in place, it starts to beat.
                </p>
                <div className="row-wrap gap-10">
                  <Link className="btn" href="/watch/your-body-builds-itself">
                    <Icon name="play" size={16} />
                    Watch it with labels
                  </Link>
                </div>
                <p className={s.note}>No sound yet. A version with a voice explaining each part is on the way.</p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className={s.trust}>
            <Reveal>
              <div className="stack gap-16">
                <h2 className="h2">
                  Simple words. <span className="serif">Serious science.</span>
                </h2>
                <p className="lede">
                  Every page starts in plain words a 12-year-old can follow, and is checked so an expert can trust it. Every fact links to its source, and every claim
                  shows how sure science is about it:
                </p>
                <div className={s.meter}>
                  {METER.map((m, i) => (
                    <div key={i} className={s.meterItem}>
                      <span>{m.el}</span>
                      <span>{m.d}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <Link href="/how-we-check" className="btn btn-ghost btn-sm">
                    How we check facts
                    <Icon name="arrow" size={16} />
                  </Link>
                </div>
              </div>
            </Reveal>
            <Reveal delay={0.08}>
              <div className={`glass ${s.demo}`}>
                <span className="kick" style={{ fontSize: 10.5 }}>
                  Try it: one fact, three ways
                </span>
                <DepthSwitch />
                <DepthText className={s.demoText} simple={heart.simple} clear={heart.clear} expert={heart.expert} />
                <p className={s.note} style={{ margin: 0 }}>
                  Pick Simple, Detailed or Expert once, and every page on the site follows. The facts stay the same; only the words change.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <Reveal>
            <Link href="/feel-better/sleep-and-caffeine" className={`card ${s.week}`}>
              <span className={s.weekIcon}>
                <Icon name="moon" size={22} />
              </span>
              <span className="stack gap-8" style={{ flex: 1, minWidth: 0 }}>
                <span className="kick" style={{ fontSize: 10.5 }}>
                  Try this week
                </span>
                <span className="h3">Protect your sleep from caffeine.</span>
                <span className={s.qText}>Pick your bedtime. We&apos;ll show you when to have your last coffee, tea or cola, plus 5 small steps for the next 7 days.</span>
              </span>
              <span className={s.weekGo}>
                Start
                <Icon name="arrow" size={16} />
              </span>
            </Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}

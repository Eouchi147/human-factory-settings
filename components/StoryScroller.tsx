"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { Station } from "@/lib/story";
import { Ev } from "./Evidence";
import { DepthSwitch, DepthText } from "./Depth";
import { ClockRing, HalfLifeChart, PressureSketch } from "./SleepViz";
import { ADENOSINE_SVG, CAFFEINE_SVG } from "@/lib/molecules";
import { Icon } from "./Icons";

function Visual({ kind }: { kind: Station["visual"] }) {
  if (kind === "pressure")
    return (
      <div className="stack gap-12" style={{ width: "100%" }}>
        <div style={{ position: "relative", aspectRatio: "78 / 60", borderRadius: 20, overflow: "hidden" }}>
          <Image src="/img/sys_brain.jpg" alt="The brain of the reference body, side view" fill sizes="(min-width: 980px) 40vw, 90vw" style={{ objectFit: "cover", objectPosition: "50% 45%" }} />
        </div>
        <PressureSketch />
      </div>
    );
  if (kind === "clock")
    return (
      <div className="stack gap-12" style={{ alignItems: "center", width: "100%" }}>
        <ClockRing from={21} to={7} size={300} center="Night" sub="MELATONIN RISES" labels={["21:00", "07:00"]} />
        <p className="cap" style={{ margin: 0, textAlign: "center", textTransform: "none", letterSpacing: ".02em" }}>
          Schematic: the evening melatonin rise, for someone who sleeps from 23:00 to 07:00.
        </p>
      </div>
    );
  if (kind === "molecules")
    return (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12, width: "100%" }}>
        {[
          { svg: ADENOSINE_SVG, name: "Adenosine", sub: "The sleep signal", color: "var(--violet-ink)" },
          { svg: CAFFEINE_SVG, name: "Caffeine", sub: "Same double ring", color: "var(--signal-ink)" },
        ].map((m) => (
          <figure key={m.name} className="glass" style={{ margin: 0, borderRadius: 20, padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
            <div dangerouslySetInnerHTML={{ __html: m.svg }} />
            <figcaption className="stack gap-6">
              <span className="cap" style={{ color: m.color }}>
                {m.name}
              </span>
              <span style={{ fontSize: 13.5, color: "var(--ink2)" }}>{m.sub}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    );
  if (kind === "halflife")
    return (
      <div className="glass" style={{ borderRadius: 22, padding: "16px 12px 10px", width: "100%" }}>
        <HalfLifeChart />
        <p className="cap" style={{ margin: "6px 8px 4px", textTransform: "none", letterSpacing: ".02em", lineHeight: 1.5 }}>
          Arithmetic on the published half-life: the solid line is the average of 5 hours, the band the normal range of 1.5 to 9.5 hours.
        </p>
      </div>
    );
  if (kind === "stat")
    return (
      <div className="glass" style={{ borderRadius: 24, padding: 28, width: "100%", display: "flex", flexDirection: "column", gap: 18 }}>
        <div className="kick">Drake et al. 2013 · 400 mg</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10 }}>
          {["0 h", "3 h", "6 h"].map((t) => (
            <div key={t} style={{ border: "1px solid var(--edge)", borderRadius: 16, padding: "14px 12px", background: "rgba(18,21,26,.5)" }}>
              <div className="mono" style={{ fontSize: 22, fontWeight: 600, color: t === "6 h" ? "var(--signal-ink)" : "var(--ink)" }}>
                {t}
              </div>
              <div className="cap">before bed</div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 26, fontWeight: 650, lineHeight: 1.2, letterSpacing: "-.01em" }} className="x108">
          All three disturbed sleep. At 6 hours, still <span className="sig">more than an hour</span> less of it.
        </div>
      </div>
    );
  return (
    <div className="stack gap-16" style={{ alignItems: "center", width: "100%" }}>
      <ClockRing from={17} to={23} size={300} />
      <Link href="/restore/sleep-and-caffeine" className="btn btn-signal">
        Make it your plan
        <Icon name="arrow" size={16} />
      </Link>
    </div>
  );
}

export function StoryScroller({ stations }: { stations: Station[] }) {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const i = Number((e.target as HTMLElement).dataset.i);
            setActive(i);
          }
        });
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    refs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <div className="story-grid">
      <div className="story-visual only-desktop" aria-hidden="true">
        <div className="story-rail">
          {stations.map((st, i) => (
            <span key={st.id} className={i <= active ? "on" : ""} />
          ))}
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={stations[active].visual}
            initial={{ opacity: 0, y: 14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            style={{ width: "100%", display: "flex", justifyContent: "center" }}
          >
            <Visual kind={stations[active].visual} />
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="story-text">
        <div className="story-depth">
          <span className="cap">Read it at your depth</span>
          <DepthSwitch />
        </div>
        {stations.map((st, i) => (
          <section
            key={st.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            data-i={i}
            className={`story-station ${i === active ? "is-on" : ""}`}
            aria-labelledby={`st-${st.id}`}
          >
            <span className="cap">
              Station {i + 1} of {stations.length}
            </span>
            <h2 id={`st-${st.id}`} className="h2">
              {st.title} <span className="serif">{st.serif}</span>
            </h2>
            <div className="only-mobile" style={{ margin: "6px 0 4px" }}>
              <Visual kind={st.visual} />
            </div>
            <DepthText className="body-l story-p" simple={st.simple} clear={st.clear} expert={st.expert} />
            <div className="row-wrap gap-10">
              <Ev level={st.ev} text={st.evText} />
              <span className="cap" style={{ textTransform: "none", letterSpacing: ".02em" }}>
                {st.source.map((s, k) => (
                  <span key={s.label}>
                    {k > 0 ? " · " : null}
                    {s.href ? (
                      <a href={s.href} target="_blank" rel="noopener noreferrer">
                        {s.label}
                      </a>
                    ) : (
                      s.label
                    )}
                  </span>
                ))}
              </span>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

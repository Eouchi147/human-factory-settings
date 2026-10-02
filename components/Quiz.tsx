"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  SCALE,
  STYLE_ITEMS,
  STYLE_TIPS,
  STYLES,
  TEMPERAMENTS,
  TRAIT_ITEMS,
  styleOf,
  temperamentOf,
  traitScore,
  type StyleKey,
} from "@/lib/quiz";
import { Dial, TraitMap } from "./SettingViz";
import { Ev } from "./Evidence";
import { Icon } from "./Icons";

const TOTAL = TRAIT_ITEMS.length + STYLE_ITEMS.length;
const ease = [0.16, 1, 0.3, 1] as const;

/** The button you pressed leaves the page, so focus moves to what replaced it: keyboard and screen reader users keep their place. */
function focusIfLost(el: HTMLElement | null) {
  if (el && (!document.activeElement || document.activeElement === document.body)) el.focus({ preventScroll: true });
}

export function Quiz() {
  const [started, setStarted] = useState(false);
  const [answers, setAnswers] = useState<number[]>([]);
  const [styles, setStyles] = useState<StyleKey[]>([]);
  const step = answers.length + styles.length;
  const done = step >= TOTAL;

  const result = useMemo(() => {
    if (!done) return null;
    const e = traitScore(answers, "E");
    const n = traitScore(answers, "N");
    const t = temperamentOf(e, n);
    const s = styleOf(styles);
    return { e, n, t, s, index: TEMPERAMENTS[t].quadrant * 3 + STYLES[s].index };
  }, [done, answers, styles]);

  useEffect(() => {
    if (done) window.scrollTo({ top: 0, behavior: "smooth" });
  }, [done]);

  const back = () => {
    if (styles.length) setStyles(styles.slice(0, -1));
    else if (answers.length) setAnswers(answers.slice(0, -1));
    else setStarted(false);
  };
  const restart = () => {
    setAnswers([]);
    setStyles([]);
    setStarted(true);
  };

  if (!started) {
    return (
      <div className="quiz-intro stack gap-20">
        <div className="kick">Personality quiz · 11 questions · about 2 minutes</div>
        <h1 className="h1">
          What&apos;s your <span className="serif">personality type?</span>
        </h1>
        <p className="lede">
          Eight questions come from real psychology research. They measure two things science measures well: how outgoing you are, and how strongly you react to
          stress. Three fun questions add how you like to talk and plan. You land on a map, not in a box. The old type names, like &quot;sanguine&quot;, are there for
          fun, not as science.
        </p>
        <div className="row-wrap gap-8">
          <Ev level={4} text="Two well-studied traits" />
          <Ev level={0} text="Old type names: not science" />
          <Ev level={1} text="Talk style: early evidence" />
        </div>
        <div className="row-wrap gap-12">
          <button type="button" className="btn btn-signal" onClick={() => setStarted(true)}>
            Start
            <Icon name="arrow" size={16} />
          </button>
          <span className="cap" style={{ textTransform: "none", letterSpacing: ".02em" }}>
            Scored on your device. Nothing is stored or sent.
          </span>
        </div>
      </div>
    );
  }

  if (done && result) return <Result r={result} restart={restart} />;

  const isStyle = answers.length >= TRAIT_ITEMS.length;
  const q = isStyle ? STYLE_ITEMS[styles.length].q : TRAIT_ITEMS[answers.length].q;
  const pct = Math.round((step / TOTAL) * 100);

  return (
    <div className="quiz-run">
      <h1 className="visually-hidden">Personality quiz</h1>
      <div className="quiz-top">
        <button type="button" className="icon-btn" aria-label="Back" onClick={back}>
          <Icon name="back" size={18} />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span className="cap">
              Question {step + 1} of {TOTAL}
            </span>
            <span className="cap" style={{ color: "var(--signal-ink)" }}>
              {pct}%
            </span>
          </div>
          <div style={{ height: 3, borderRadius: 3, background: "rgba(236,238,241,.12)", marginTop: 10, overflow: "hidden" }}>
            <motion.div style={{ height: 3, background: "var(--signal)" }} initial={false} animate={{ width: `${pct}%` }} transition={{ duration: 0.5, ease }} />
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          className="stack gap-24"
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.35, ease }}
          style={{ marginTop: 36 }}
        >
          <div className="kick">{isStyle ? "Which sounds most like you?" : "How well does this describe you?"}</div>
          <h2 ref={focusIfLost} tabIndex={-1} className="h1 balance" style={{ fontSize: "clamp(28px, 4vw, 44px)" }}>
            {q}
          </h2>
          <div role="group" aria-label="Answer" className="stack gap-10">
            {isStyle
              ? STYLE_ITEMS[styles.length].options.map((o) => (
                  <button key={o.label} type="button" className="glass quiz-opt" onClick={() => setStyles([...styles, o.style])}>
                    <span>{o.label}</span>
                    <Icon name="arrow" size={16} />
                  </button>
                ))
              : SCALE.map((label, k) => (
                  <button key={label} type="button" className="glass quiz-opt" onClick={() => setAnswers([...answers, k + 1])}>
                    <span>{label}</span>
                    <span aria-hidden="true" style={{ display: "inline-flex", gap: 3 }}>
                      {Array.from({ length: 5 }, (_, i) => (
                        <i key={i} style={{ width: 6, height: 6, borderRadius: 6, background: i <= k ? "var(--signal)" : "rgba(236,238,241,.18)" }} />
                      ))}
                    </span>
                  </button>
                ))}
          </div>
        </motion.div>
      </AnimatePresence>
      <p className="cap" style={{ marginTop: 28, textTransform: "none", letterSpacing: ".02em", lineHeight: 1.6 }}>
        {isStyle
          ? "Our own questions, not a scientific test. Just for fun."
          : "Questions from a free research questionnaire (the Mini-IPIP). Scored on your phone or computer. Nothing is stored."}
      </p>
    </div>
  );
}

function Result({ r, restart }: { r: { e: number; n: number; t: keyof typeof TEMPERAMENTS; s: StyleKey; index: number }; restart: () => void }) {
  const T = TEMPERAMENTS[r.t];
  const S = STYLES[r.s];
  const tip = STYLE_TIPS[r.t];
  const share = async () => {
    const text = `My factory setting: ${T.name} ${S.name}. Outgoing ${r.e}/100, sensitivity ${r.n}/100.`;
    try {
      if (navigator.share) await navigator.share({ title: "Human Factory Settings", text, url: window.location.origin + "/quiz" });
      else await navigator.clipboard.writeText(`${text} ${window.location.origin}/quiz`);
    } catch {
      /* the viewer cancelled */
    }
  };
  return (
    <motion.div className="quiz-result" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease }}>
      <h1 className="visually-hidden">Personality quiz</h1>
      <div className="quiz-result-grid">
        <div className="stack gap-20">
          <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
            <Dial size={132} active={r.index} />
            <div className="stack gap-6">
              <div className="kick">Your type</div>
              <h2 ref={focusIfLost} tabIndex={-1} className="x108" style={{ margin: 0, fontSize: 34, fontWeight: 650, letterSpacing: "-.02em", lineHeight: 1.02 }}>
                {T.name}
                <br />
                <span className="serif" style={{ fontSize: 36, color: "var(--signal-ink)" }}>
                  {S.name}
                </span>
              </h2>
            </div>
          </div>
          <p className="lede" style={{ margin: 0 }}>
            {T.line} As a communicator: {S.line.charAt(0).toLowerCase() + S.line.slice(1)} A position on a spectrum, not a box.
          </p>
          <div style={{ maxWidth: 520 }}>
            <TraitMap e={r.e} n={r.n} />
          </div>
          <div className="row-wrap gap-16 mono" style={{ fontSize: 13 }}>
            <span>
              Outgoing <b style={{ color: "var(--ink)" }}>{r.e}</b>/100
            </span>
            <span>
              Sensitivity <b style={{ color: "var(--ink)" }}>{r.n}</b>/100
            </span>
          </div>
          <p className="cap" style={{ margin: 0, textTransform: "none", letterSpacing: ".02em", lineHeight: 1.6 }}>
            The lines mark the middle of each scale. Four questions per trait is a short test, so the dashed ring shows roughly how far off your score could be,
            about 10 points either way. Near a line? You could belong on either side.
          </p>
        </div>

        <div className="stack gap-14">
          <div className="glass" style={{ borderRadius: 22, padding: "14px 18px" }}>
            <div className="kick" style={{ fontSize: 10, marginBottom: 6 }}>
              Is this science?
            </div>
            {[
              ["The two traits it measures", <Ev key="a" level={4} />],
              ["Your score from 8 questions", <Ev key="b" level={3} />],
              ["The four old type names", <Ev key="c" level={0} text="Old idea" />],
              ["Your talk style", <Ev key="d" level={1} />],
            ].map(([k, v], i) => (
              <div key={i} className="spec-row" style={{ padding: "10px 0", borderTop: i ? undefined : 0 }}>
                <span style={{ fontSize: 14, color: "var(--ink2)" }}>{k}</span>
                {v}
              </div>
            ))}
            <p style={{ margin: "8px 0 4px", fontSize: 13, lineHeight: 1.5, color: "var(--ink3)" }}>
              The names are 2,000-year-old nicknames. We place them on two traits that modern psychology measures well, and never by nationality.
            </p>
          </div>

          <div className="card card-pad stack gap-10">
            <div className="row-wrap gap-10" style={{ justifyContent: "space-between" }}>
              <span className="kick" style={{ fontSize: 10 }}>
                In your style · weight and habits
              </span>
              <Ev level={1} />
            </div>
            <div style={{ fontSize: 15, color: "var(--ink)" }}>
              <b>What tends to work for you:</b> {tip.fits}
            </div>
            <div style={{ fontSize: 15, color: "var(--ink2)" }}>
              <b style={{ color: "var(--ink)" }}>Watch for:</b> {tip.watch}
            </div>
            <p style={{ margin: 0, fontSize: 13, color: "var(--ink3)" }}>
              The plan is the same for everyone; only how you frame it changes. <Link href="/guides/weight#in-your-style">From the weight guide</Link>.
            </p>
          </div>

          <div className="row-wrap gap-10">
            <button type="button" className="btn" onClick={share}>
              <Icon name="share" size={16} />
              Share
            </button>
            <button type="button" className="btn btn-ghost" onClick={restart}>
              <Icon name="redo" size={16} />
              Retake
            </button>
          </div>
          <p className="cap" style={{ margin: 0, textTransform: "none", letterSpacing: ".02em" }}>
            Scored on your device. Nothing was stored or sent. Leaving this page clears it.
          </p>
        </div>
      </div>
    </motion.div>
  );
}

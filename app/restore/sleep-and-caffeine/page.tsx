import type { Metadata } from "next";
import Link from "next/link";
import s from "../restore.module.css";
import { CaffeinePlan } from "@/components/CaffeinePlan";
import { Ev } from "@/components/Evidence";
import { Icon } from "@/components/Icons";

export const metadata: Metadata = {
  title: "Protect your sleep from caffeine",
  description: "A 7-day, 5-step plan: set a caffeine cutoff 6 hours before bed, find the hidden caffeine, and track what changes.",
};

export default function CaffeinePlanPage() {
  return (
    <div className="page-top">
      <div className="wrap">
        <header className="stack gap-12" style={{ maxWidth: 820, marginBottom: 32 }}>
          <nav className="cap" aria-label="Breadcrumb" style={{ display: "flex", gap: 8 }}>
            <Link href="/restore" style={{ color: "var(--ink3)", textDecoration: "none" }}>
              Restore
            </Link>
            <span aria-hidden="true">/</span>
            <span>Sleep</span>
          </nav>
          <h1 className="h1 a-in">
            Protect your sleep <span className="serif">from caffeine.</span>
          </h1>
          <div className="row-wrap gap-10 a-in a-d1">
            <span className="cap">7 days · 5 steps</span>
            <Ev level={2} />
          </div>
          <p className="lede a-in a-d2">
            Caffeine blocks the signal that makes you sleepy, and half of a cup is often still working 5 hours later. Pick your bedtime, set the cutoff, and check off
            each step as you go.
          </p>
        </header>

        <div className={s.plan}>
          <CaffeinePlan dialClass={s.dialCard} bedsClass={s.beds} />
        </div>

        <div className={s.twin} style={{ marginTop: 28 }}>
          <div className={`glass ${s.note}`}>
            <div className="kick" style={{ fontSize: 10 }}>
              Why 6 hours
            </div>
            <p style={{ margin: "8px 0 0", fontSize: 14.5, lineHeight: 1.5, color: "var(--ink2)" }}>
              In one small trial, 400 mg of caffeine taken 6 hours before bed still cut measured sleep by more than an hour (
              <a href="https://doi.org/10.5664/jcsm.3170" target="_blank" rel="noopener noreferrer">
                Drake et al. 2013
              </a>
              ). The average half-life is about 5 hours, ranging from 1.5 to 9.5 (
              <a href="https://www.ncbi.nlm.nih.gov/books/NBK223808/" target="_blank" rel="noopener noreferrer">
                Institute of Medicine 2001
              </a>
              ).
            </p>
          </div>
          <div className={`glass ${s.note}`} style={{ borderColor: "rgba(255,122,61,.35)" }}>
            <div className="kick" style={{ fontSize: 10 }}>
              See a doctor if
            </div>
            <p style={{ margin: "8px 0 0", fontSize: 14.5, lineHeight: 1.5, color: "var(--ink2)" }}>
              You snore loudly, someone notices you stop breathing in your sleep, or you feel very sleepy during the day even after a full night. These can be signs of
              sleep apnoea, which needs a doctor, not a cutoff.
            </p>
          </div>
        </div>

        <Link href="/stories/why-you-wake-up-tired" className="card card-pad" style={{ marginTop: 16, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <span className="stack gap-6">
            <span className="kick" style={{ fontSize: 10 }}>
              The science behind the plan
            </span>
            <span className="h3">Why you wake up tired, in six stations</span>
          </span>
          <Icon name="arrow" size={20} />
        </Link>
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import s from "../feel-better.module.css";
import { SleepTools } from "@/components/tools/SleepTools";
import { Ev } from "@/components/Evidence";
import { Icon } from "@/components/Icons";

export const metadata: Metadata = {
  title: "Protect your sleep from caffeine",
  description: "Pick your bedtime, get your caffeine cutoff, and see how much caffeine is still in you at night. Five small steps for seven days.",
};

export default function CaffeinePlanPage() {
  return (
    <div className="page-top">
      <div className="wrap">
        <header className="stack gap-12" style={{ maxWidth: 820, marginBottom: 32 }}>
          <nav className="cap" aria-label="Breadcrumb" style={{ display: "flex", gap: 8 }}>
            <Link href="/feel-better" style={{ color: "var(--ink3)", textDecoration: "none" }}>
              Feel better
            </Link>
            <span aria-hidden="true">/</span>
            <span>Sleep</span>
          </nav>
          <h1 className="h1 a-in">
            Protect your sleep <span className="serif">from caffeine.</span>
          </h1>
          <div className="row-wrap gap-10 a-in a-d1">
            <span className="cap">7 days · 5 small steps</span>
            <Ev level={2} text="Some evidence" />
          </div>
          <p className="lede a-in a-d2">
            Caffeine blocks the signal that makes you feel sleepy, and on average your body clears only half of it in about 5 hours. Pick your bedtime to get your cutoff, tick
            off the steps, then see how much caffeine is still in you at night.
          </p>
        </header>

        <SleepTools planClass={s.plan} dialClass={s.dialCard} bedsClass={s.beds} />

        <div className={s.twin} style={{ marginTop: 28 }}>
          <div className={`glass ${s.note}`}>
            <div className="kick" style={{ fontSize: 10 }}>
              Why 9 hours
            </div>
            <p style={{ margin: "8px 0 0", fontSize: 14.5, lineHeight: 1.5, color: "var(--ink2)" }}>
              A review of 24 studies worked out that a regular coffee should be drunk at least 8.8 hours before bed so it doesn&apos;t cut into sleep (
              <a href="https://doi.org/10.1016/j.smrv.2023.101764" target="_blank" rel="noopener noreferrer">
                Gardiner and colleagues, 2023
              </a>
              ). In one small study, a big dose (400 mg) taken 6 hours before bed still cut sleep by more than an hour (
              <a href="https://doi.org/10.5664/jcsm.3170" target="_blank" rel="noopener noreferrer">
                Drake and colleagues, 2013
              </a>
              ). On average the body clears half of it in about 5 hours, but that ranges from 1.5 to 9.5 hours between people (
              <a href="https://www.ncbi.nlm.nih.gov/books/NBK223808/" target="_blank" rel="noopener noreferrer">
                Institute of Medicine, 2001
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
              The science behind it
            </span>
            <span className="h3">Why you wake up tired, in six short steps</span>
          </span>
          <Icon name="arrow" size={20} />
        </Link>
      </div>
    </div>
  );
}

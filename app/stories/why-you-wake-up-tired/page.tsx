import type { Metadata } from "next";
import Link from "next/link";
import { StoryScroller } from "@/components/StoryScroller";
import { STATIONS } from "@/lib/story";
import { Icon } from "@/components/Icons";

export const metadata: Metadata = {
  title: "Why you wake up tired",
  description: "Six stations, from the sleep signal that builds all day to the cup that blocks it, each graded by the strength of its evidence.",
};

export default function StoryPage() {
  return (
    <div className="page-top">
      <div className="wrap">
        <header className="stack gap-12" style={{ maxWidth: 820, marginBottom: 28 }}>
          <div className="kick a-in">Story · Sleep</div>
          <h1 className="h1 a-in a-d1">
            Why you wake up <span className="serif">tired.</span>
          </h1>
          <p className="lede a-in a-d2">
            Six stations, from the signal that builds sleepiness all day to the cup that hides it. Every station carries its evidence and its source, and each one
            reads at three depths.
          </p>
        </header>
        <StoryScroller stations={STATIONS} />
        <div className="card card-pad" style={{ marginTop: 40, display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <div className="stack gap-6">
            <span className="kick">Restore · Sleep</span>
            <span className="h3">Protect your sleep from caffeine: a 7-day plan, 5 steps.</span>
          </div>
          <Link href="/restore/sleep-and-caffeine" className="btn">
            Start the plan
            <Icon name="arrow" size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}

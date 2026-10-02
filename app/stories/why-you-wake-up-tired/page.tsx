import type { Metadata } from "next";
import Link from "next/link";
import { StoryScroller } from "@/components/StoryScroller";
import { STATIONS } from "@/lib/story";
import { Icon } from "@/components/Icons";

export const metadata: Metadata = {
  title: "Why you wake up tired",
  description: "Six short steps, from the chemical that makes you sleepy all day to the coffee that hides it. Plain words, with the science and sources underneath.",
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
            Six short steps, from the chemical that makes you sleepy all day to the coffee that hides it. Each step shows where the science comes from.
          </p>
        </header>
        <StoryScroller stations={STATIONS} />
        <div className="card card-pad" style={{ marginTop: 40, display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <div className="stack gap-6">
            <span className="kick">Try it this week</span>
            <span className="h3">Protect your sleep from caffeine: 5 small steps for 7 days.</span>
          </div>
          <Link href="/feel-better/sleep-and-caffeine" className="btn">
            Start the plan
            <Icon name="arrow" size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}

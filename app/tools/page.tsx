import type { Metadata } from "next";
import Link from "next/link";
import { PulseCheck } from "@/components/tools/PulseCheck";
import { HeartbeatCounter } from "@/components/tools/HeartbeatCounter";
import { CaffeineCurve } from "@/components/tools/CaffeineCurve";
import { WaistCheck } from "@/components/tools/WaistCheck";
import { ProteinCheck } from "@/components/tools/ProteinCheck";
import { Icon } from "@/components/Icons";

export const metadata: Metadata = {
  title: "Tools",
  description: "Check your pulse, see how much caffeine is still in you at bedtime, check your waist and your protein. Nothing you enter is stored or sent.",
};

export default function ToolsPage() {
  return (
    <div className="page-top">
      <div className="wrap stack gap-32">
        <header className="stack gap-12" style={{ maxWidth: 760 }}>
          <h1 className="h1 a-in">
            Try it <span className="serif">on yourself.</span>
          </h1>
          <p className="lede a-in a-d1">Small tools that use your own body and your own day. Nothing you enter is stored or sent.</p>
        </header>
        <div className="tools-2">
          <section id="pulse" style={{ scrollMarginTop: 90 }}>
            <PulseCheck />
          </section>
          <section id="heartbeats" style={{ scrollMarginTop: 90 }}>
            <HeartbeatCounter />
          </section>
        </div>
        <section id="caffeine" style={{ scrollMarginTop: 90 }}>
          <CaffeineCurve />
        </section>
        <div className="tools-2">
          <section id="waist" style={{ scrollMarginTop: 90 }}>
            <WaistCheck />
          </section>
          <section id="protein" style={{ scrollMarginTop: 90 }}>
            <ProteinCheck />
          </section>
        </div>
        <Link href="/quiz" className="card card-pad" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <span className="stack gap-6">
            <span className="h3">What&apos;s your personality type?</span>
            <span style={{ color: "var(--ink2)", fontSize: 15 }}>Eleven quick questions. You land on a map, not in a box.</span>
          </span>
          <Icon name="arrow" size={20} />
        </Link>
      </div>
    </div>
  );
}

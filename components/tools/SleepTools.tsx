"use client";

import { useEffect, useState } from "react";
import { CaffeinePlan, loadPlan, savePlan } from "../CaffeinePlan";
import { CaffeineCurve } from "./CaffeineCurve";

/** The sleep page's tools share one bedtime: the plan sets it, the caffeine curve uses it. */
export function SleepTools({ planClass, dialClass, bedsClass }: { planClass: string; dialClass: string; bedsClass: string }) {
  const [bed, setBed] = useState(23);
  useEffect(() => {
    const v = loadPlan();
    if (v.bed) setBed(v.bed);
  }, []);
  const onBed = (b: number) => {
    setBed(b);
    savePlan(b, loadPlan().done ?? [false, false, false, false, false]);
  };
  return (
    <>
      <div className={planClass}>
        <CaffeinePlan dialClass={dialClass} bedsClass={bedsClass} bed={bed} onBed={onBed} />
      </div>
      <div style={{ marginTop: 20 }}>
        <CaffeineCurve bed={bed} />
      </div>
    </>
  );
}

"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { MeasuredFigure } from "./MeasuredFigure";
import type { Callout, Dim } from "@/lib/systems";

type Props = {
  img: string;
  imgW: number;
  imgH: number;
  alt: string;
  alt2?: { img: string; alt: string; label: string; baseLabel: string };
  dims?: Dim[];
  callouts?: Callout[];
  className?: string;
  toggleClassName?: string;
};

export function SpecFigure({ img, imgW, imgH, alt, alt2, dims, callouts, className = "", toggleClassName = "" }: Props) {
  const [apart, setApart] = useState(false);
  const showAlt = alt2 && apart;
  return (
    <div style={{ position: "relative" }}>
      {alt2 ? (
        <div className={`seg ${toggleClassName}`} role="radiogroup" aria-label="View">
          {[alt2.baseLabel, alt2.label].map((label, i) => {
            const on = (i === 1) === apart;
            return (
              <button key={label} type="button" role="radio" aria-checked={on} className={on ? "on" : ""} onClick={() => setApart(i === 1)}>
                {on ? <motion.span layoutId="spec-toggle" className="pill" transition={{ type: "spring", stiffness: 520, damping: 38 }} /> : null}
                <span style={{ position: "relative" }}>{label}</span>
              </button>
            );
          })}
        </div>
      ) : null}
      <MeasuredFigure
        key={showAlt ? "b" : "a"}
        className={className}
        style={{ aspectRatio: `${imgW} / ${imgH}` }}
        src={showAlt ? alt2!.img : img}
        alt={showAlt ? alt2!.alt : alt}
        w={imgW}
        h={imgH}
        fit="contain"
        sizes="(min-width: 980px) 52vw, 100vw"
        priority
        dims={showAlt ? [] : dims}
        callouts={showAlt ? [] : callouts}
        labelWidth={176}
      />
    </div>
  );
}

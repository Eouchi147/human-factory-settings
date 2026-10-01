"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

/**
 * Content rises and sharpens into place as it scrolls into view. The blur is cleared when the
 * animation ends, so glass surfaces inside keep seeing the page behind them.
 * With reduced motion it simply appears. The server and the first client render stay identical either way
 * (a different element there would leave the server's hidden style in place, and the content invisible).
 */
export function Reveal({ children, delay = 0, className, as = "div" }: { children: ReactNode; delay?: number; className?: string; as?: "div" | "section" | "li" | "article" }) {
  const reduce = useReducedMotion();
  const Tag = motion[as];
  return (
    <Tag
      className={className}
      initial={{ opacity: 0, y: 18, filter: "blur(8px)" }}
      {...(reduce
        ? { animate: { opacity: 1, y: 0, filter: "none" }, transition: { duration: 0 } }
        : {
            whileInView: { opacity: 1, y: 0, filter: "blur(0px)", transitionEnd: { filter: "none" } },
            viewport: { once: true, margin: "0px 0px -10% 0px" },
            transition: { duration: 0.9, delay, ease: [0.16, 1, 0.3, 1] },
          })}
    >
      {children}
    </Tag>
  );
}

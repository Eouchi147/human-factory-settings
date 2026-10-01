"use client";

import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { FOCUS_ORDER, SYSTEM_ORDER, type SystemId } from "@/lib/anatomy";

const BodyExplorer = dynamic(() => import("./BodyExplorer").then((m) => m.BodyExplorer), {
  ssr: false,
  loading: () => <div style={{ height: "calc(100svh - var(--header-h) - 92px)", minHeight: 600 }} />,
});

// friendlier names for links: /body?system=reproductive (female first, as in the switch), female, male, spine, tongue
const ALIAS: Record<string, SystemId> = { reproductive: "reproF", female: "reproF", male: "reproM", spine: "posture", foot: "feet", tongue: "mouth" };

function Inner() {
  const q = useSearchParams().get("system") ?? "";
  const id = ALIAS[q] ?? q;
  const initial = SYSTEM_ORDER.includes(id as SystemId) || FOCUS_ORDER.includes(id as SystemId) ? (id as SystemId) : null;
  return <BodyExplorer variant="page" initial={initial} />;
}

/** The explorer on the body page. /body?system=digestion opens straight on that system. */
export function BodyExplorerLazy() {
  return (
    <Suspense fallback={<div style={{ height: "calc(100svh - var(--header-h) - 92px)", minHeight: 600 }} />}>
      <Inner />
    </Suspense>
  );
}

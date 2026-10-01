"use client";

import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { systemById, type SystemId } from "@/lib/anatomy";

const BodyExplorer = dynamic(() => import("./BodyExplorer").then((m) => m.BodyExplorer), {
  ssr: false,
  loading: () => <div style={{ height: "calc(100svh - var(--header-h) - 92px)", minHeight: 600 }} />,
});

function Inner() {
  const q = useSearchParams().get("system");
  const initial = q && systemById(q) ? (q as SystemId) : null;
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

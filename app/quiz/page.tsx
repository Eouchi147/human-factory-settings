import type { Metadata } from "next";
import { Quiz } from "@/components/Quiz";

export const metadata: Metadata = {
  title: "Personality quiz",
  description: "Eleven quick questions, scored on your device: where you land on two traits science measures well, plus a fun look at how you like to talk and plan.",
};

export default function YouPage() {
  return (
    <div className="page-top">
      <div className="wrap" style={{ minHeight: "70svh" }}>
        <Quiz />
      </div>
    </div>
  );
}

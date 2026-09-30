import type { Metadata } from "next";
import { Quiz } from "@/components/Quiz";

export const metadata: Metadata = {
  title: "Find your setting",
  description: "Eleven questions, scored on your device: your position on two well-measured traits, the old temperament names as tradition, and a communication style.",
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

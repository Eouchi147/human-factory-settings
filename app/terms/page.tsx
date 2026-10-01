import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms", description: "General education, not personal medical advice. How you may use what is on this site." };

const ROWS: [string, string][] = [
  ["Education, not advice", "Everything here is general education about how the body and mind work. It is not personal medical advice and does not replace a doctor, pharmacist or other licensed professional who knows your situation."],
  ["In an emergency", "Call your local emergency number: 15 or 112 in France, 911 in Canada and the United States."],
  ["Before you change anything", "Talk to a doctor before changing diet, weight, exercise or supplements if you have a health condition, take regular medicines, are pregnant or breastfeeding, or are under 18."],
  ["No diagnosis", "Nothing on this site diagnoses or screens for any condition, including the quiz, which describes personality traits only."],
  ["Evidence can change", "Every claim carries the strength of its evidence and the date it was checked. Science moves; we update pages as it does."],
  ["Using our work", "Text, design and films are © Human Factory Settings. The 3D pictures are made from BodyParts3D, © The Database Center for Life Science, CC BY 4.0; any reuse of a render must credit BodyParts3D."],
  ["Preview", "This is a preview build, not yet public. Pages, numbers and features may change before launch."],
];

export default function TermsPage() {
  return (
    <div className="page-top">
      <div className="wrap-narrow stack gap-24">
        <div className="kick">Terms</div>
        <h1 className="h1">
          Education, <span className="serif">not advice.</span>
        </h1>
        <div className="card" style={{ padding: "4px 20px" }}>
          {ROWS.map(([k, v]) => (
            <div key={k} className="dl-row">
              <span style={{ fontWeight: 650 }}>{k}</span>
              <span style={{ fontSize: 15, lineHeight: 1.55, color: "var(--ink2)" }}>{v}</span>
            </div>
          ))}
        </div>
        <p className="cap" style={{ margin: 0, textTransform: "none", letterSpacing: ".02em" }}>
          Last updated 30 September 2026.
        </p>
      </div>
    </div>
  );
}

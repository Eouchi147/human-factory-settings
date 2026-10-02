import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy", description: "What this site collects: nothing about you. How the quiz, local settings and hosting work." };

const ROWS: [string, string][] = [
  ["Accounts, cookies, ads, trackers", "None. This site has no sign-up, sets no cookies, shows no ads and runs no analytics or tracking scripts."],
  ["The quiz", "Scored in your browser. Your answers and your result are never stored or sent anywhere, and leaving the page clears them."],
  ["Settings kept on your device", "Your reading depth (Simple, Detailed or Expert) and the ticks on a 7-day plan are saved in your browser's local storage, on your device only. Clearing this site's data in your browser removes them."],
  ["Fonts and media", "Fonts, images and films are served from this site. Nothing is loaded from font services or video platforms."],
  ["Hosting", "The site is hosted by Vercel. Like any web host, it processes technical data such as IP addresses in its logs to deliver and protect the site."],
  ["Links to sources", "Source links open other websites, whose own privacy policies apply."],
  ["Contact", "Contact details for privacy questions will be published here before the public launch."],
];

export default function PrivacyPage() {
  return (
    <div className="page-top">
      <div className="wrap-narrow stack gap-24">
        <div className="kick">Privacy</div>
        <h1 className="h1">
          We collect <span className="serif">nothing about you.</span>
        </h1>
        <p className="lede">This is a preview build. The summary below describes exactly what the site does today; it will be replaced by a full policy before launch.</p>
        <div className="card" style={{ padding: "4px 20px" }}>
          {ROWS.map(([k, v]) => (
            <div key={k} className="dl-row">
              <span style={{ fontWeight: 650 }}>{k}</span>
              <span style={{ fontSize: 15, lineHeight: 1.55, color: "var(--ink2)" }}>{v}</span>
            </div>
          ))}
        </div>
        <p className="cap" style={{ margin: 0, textTransform: "none", letterSpacing: ".02em" }}>
          Last updated 30 September 2026. Vercel&apos;s policy: <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer">vercel.com/legal/privacy-policy</a>.
        </p>
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { Ev, Measured } from "@/components/Evidence";

export const metadata: Metadata = {
  title: "How we check facts",
  description: "How sure the science is behind each claim, what the words mean, who checks the work, who pays for it, and every source.",
};

const METER = [
  { chip: <Ev level={4} text="Strong evidence" />, grade: "GRADE high", d: "Many well-run studies agree. We are very confident the true effect is close to what we say, and new research is unlikely to change it." },
  { chip: <Ev level={3} text="Good evidence" />, grade: "GRADE moderate", d: "Solid studies point the same way. The true effect is probably close, but it could turn out noticeably different." },
  { chip: <Ev level={2} text="Some evidence" />, grade: "GRADE low", d: "Limited, small or mixed studies. The true effect may be quite different from what they suggest." },
  { chip: <Ev level={1} text="Early evidence" />, grade: "GRADE very low", d: "First studies, small trials or careful reasoning. Treat it as a lead, not a finding." },
  { chip: <Ev level={0} text="Old idea, not tested" />, grade: "Not graded", d: "An old belief, such as the four temperaments, shown so you know where it comes from and never presented as science." },
  { chip: <Ev level={-1} text="No proof it works" />, grade: "Myths", d: "Tested and found not to work, or never tested despite the marketing." },
  { chip: <Measured text="Measured on our 3D body" />, grade: "Our own measurement", d: "A size we measured ourselves on the 3D body you see on this site, such as the heart's 12.5\u00a0cm length." },
];

const AZ: { t: string; d: string; href?: string }[] = [
  { t: "Adenosine", d: "A molecule that builds up in the brain while you are awake and pushes you toward sleep.", href: "/stories/why-you-wake-up-tired" },
  { t: "Alveoli", d: "The tiny air sacs at the ends of the airway tree, where oxygen passes into the blood.", href: "/body/lungs" },
  { t: "Aorta", d: "The main artery, carrying blood out of the left side of the heart to the body.", href: "/body/heart" },
  { t: "BMI", d: "Body mass index: weight in kilograms divided by height in metres squared. A quick screen, not a diagnosis.", href: "/guides/weight#measuring-what-matters" },
  { t: "Circadian rhythm", d: "The body's roughly 24-hour cycle, run by a clock in the brain and reset mainly by light.", href: "/stories/why-you-wake-up-tired" },
  { t: "Couinaud segments", d: "The eight pieces surgeons divide the liver into, each with its own blood supply and bile drain.", href: "/body/liver" },
  { t: "Creatine", d: "A compound stored in muscle; as a supplement, 3 to 5 g a day helps strength training.", href: "/guides/supplements" },
  { t: "Extraversion", d: "How outgoing and energised by people you tend to be. One of the two traits the quiz measures.", href: "/quiz" },
  { t: "Femur", d: "The thigh bone, the longest bone in the body: 46.7\u00a0cm on our 3D body.", href: "/body/skeleton" },
  { t: "GRADE", d: "The system medicine uses to rate how certain a body of evidence is. Our meter is adapted from it.", href: "#evidence" },
  { t: "Half-life", d: "The time the body takes to clear half of a substance. For caffeine, about 5 hours on average.", href: "/stories/why-you-wake-up-tired" },
  { t: "Melatonin", d: "A hormone that rises in the evening in dim light, one of the body's signals that night has come.", href: "/stories/why-you-wake-up-tired" },
  { t: "Mini-IPIP", d: "A short, free personality questionnaire used by researchers. The quiz uses its 8 questions on being outgoing and on reacting to stress.", href: "/quiz" },
  { t: "Nephron", d: "One of the million or so tiny filtering units in each kidney.", href: "/body/kidneys" },
  { t: "Neuroticism", d: "How strongly you tend to react to stress and worry. Shown on the site as sensitivity.", href: "/quiz" },
  { t: "Portal vein", d: "The vein that brings blood from the gut to the liver, about three quarters of its supply.", href: "/body/liver" },
  { t: "3D body", d: "The one adult 3D body, from BodyParts3D, that every picture, film and measurement on this site comes from.", href: "#credits" },
  { t: "Temperament", d: "Four old personality types (sanguine, choleric, melancholic, phlegmatic): tradition, placed on two measured traits.", href: "/quiz" },
  { t: "Ultra-processed food", d: "Industrial food made mostly from extracted or modified ingredients. Linked to eating more.", href: "/guides/weight#sleep-sitting-and-the-food-around-you" },
  { t: "Vertebra", d: "One of the bones of the spine. There are 24 above the sacrum: 7 in the neck, 12 in the chest, 5 in the lower back.", href: "/body/skeleton" },
  { t: "Waist-to-height ratio", d: "Waist divided by height. NICE guidance puts the healthy range at 0.4 to 0.49: keep your waist under half your height.", href: "/guides/weight#checks" },
];

const CREDITS: { t: string; d: string; href?: string }[] = [
  {
    t: "3D body model",
    d: "BodyParts3D, © The Database Center for Life Science, licensed under CC Attribution 4.0 International. We simplified it for the web and scaled it to an adult 1.83 m tall. Pictures, films and measurements made from it by Human Factory Settings.",
    href: "https://lifesciencedb.jp/bp3d/",
  },
  { t: "Quiz questions", d: "Mini-IPIP items (Donnellan et al. 2006) from the International Personality Item Pool, placed in the public domain.", href: "https://ipip.ori.org/newPermission.htm" },
  { t: "Typefaces", d: "Archivo, Instrument Serif and Geist Mono, under the SIL Open Font License." },
  { t: "Animation", d: "Motion (motion.dev), MIT licence. The films are rendered with three.js (MIT)." },
  { t: "Liquid glass", d: "Our own refraction maps; the squircle refraction idea comes from OverShifted/LiquidGlass (MIT).", href: "https://github.com/OverShifted/LiquidGlass" },
];

const SOURCES: { t: string; href: string }[] = [
  { t: "OpenStax, Anatomy and Physiology 2e", href: "https://openstax.org/details/books/anatomy-and-physiology-2e" },
  { t: "Institute of Medicine 2001, pharmacology of caffeine", href: "https://www.ncbi.nlm.nih.gov/books/NBK223808/" },
  { t: "Drake et al. 2013, caffeine 0, 3 or 6 hours before bed", href: "https://doi.org/10.5664/jcsm.3170" },
  { t: "Gardiner et al. 2023, caffeine and sleep: a review of 24 studies", href: "https://doi.org/10.1016/j.smrv.2023.101764" },
  { t: "Borbély 1982, a two-process model of sleep regulation", href: "https://pubmed.ncbi.nlm.nih.gov/7185792/" },
  { t: "Porkka-Heiskanen et al. 1997, adenosine and sleepiness", href: "https://doi.org/10.1126/science.276.5316.1265" },
  { t: "Azevedo et al. 2009, neuron numbers in the human brain", href: "https://doi.org/10.1002/cne.21974" },
  { t: "Raichle and Gusnard 2002, the brain's energy budget", href: "https://doi.org/10.1073/pnas.172399499" },
  { t: "Ochs et al. 2004, the number of alveoli in the human lung", href: "https://doi.org/10.1164/rccm.200308-1107OC" },
  { t: "Donnellan et al. 2006, the Mini-IPIP scales", href: "https://doi.org/10.1037/1040-3590.18.2.192" },
  { t: "GRADE handbook", href: "https://gdt.gradepro.org/app/handbook/handbook.html" },
  { t: "Mayo Clinic, normal resting heart rate and how to check your pulse", href: "https://www.mayoclinic.org/healthy-lifestyle/fitness/expert-answers/heart-rate/faq-20057979" },
  { t: "MedlinePlus, pulse: normal ranges by age", href: "https://medlineplus.gov/ency/article/003399.htm" },
  { t: "EFSA, caffeine: amounts in drinks and safe limits", href: "https://www.efsa.europa.eu/en/topics/topic/caffeine" },
  { t: "NICE NG246, waist-to-height ratio", href: "https://www.nice.org.uk/guidance/NG246/chapter/Identifying-and-assessing-overweight-obesity-and-central-adiposity" },
  { t: "StatPearls, the portal venous system", href: "https://www.ncbi.nlm.nih.gov/books/NBK554589/" },
  { t: "Mayo Clinic, living liver donation and regrowth", href: "https://newsnetwork.mayoclinic.org/discussion/mayo-clinic-q-and-a-living-liver-donation/" },
];

export default function LibraryPage() {
  return (
    <div className="page-top">
      <div className="wrap-narrow stack gap-32">
        <header className="stack gap-12">
          <div className="kick a-in">How we check facts</div>
          <h1 className="h1 a-in a-d1">
            Simple words, <span className="serif">checked science.</span>
          </h1>
          <p className="lede a-in a-d2">
            Every claim on this site is checked against its source and labelled with how sure science is about it. Here&apos;s how that works, what the words mean, who
            checks the work and who pays for it.
          </p>
          <nav className="row-wrap gap-8 a-in a-d3" aria-label="Library sections">
            {[
              ["#evidence", "How sure is it?"],
              ["#words", "Words explained"],
              ["#reviewers", "Who checks, who pays"],
              ["#credits", "Credits"],
              ["#sources", "Sources"],
            ].map(([h, l]) => (
              <a key={h} href={h} className="chip">
                {l}
              </a>
            ))}
          </nav>
        </header>

        <section id="evidence" className="stack gap-16" style={{ scrollMarginTop: 110 }}>
          <h2 className="h2">
            How sure is <span className="serif">the science?</span>
          </h2>
          <p className="body-l" style={{ margin: 0 }}>
            Every claim on the site carries one label. The four levels are based on{" "}
            <a href="https://gdt.gradepro.org/app/handbook/handbook.html" target="_blank" rel="noopener noreferrer">
              GRADE
            </a>
            , the system doctors and health agencies use to rate how sure the evidence is. A label tells you how sure we can be, not how big the effect is.
          </p>
          <div className="card" style={{ padding: "4px 20px" }}>
            {METER.map((m, i) => (
              <div key={i} className="dl-row">
                <div className="stack gap-6">
                  <span>{m.chip}</span>
                  <span className="cap">{m.grade}</span>
                </div>
                <span style={{ fontSize: 15, lineHeight: 1.55, color: "var(--ink2)" }}>{m.d}</span>
              </div>
            ))}
          </div>
          <p style={{ margin: 0, fontSize: 14.5, color: "var(--ink3)" }}>
            Every page also reads at three levels: Simple (a 12-year-old follows it), Detailed, and Expert (for doctors and researchers). The facts and the labels stay
            the same at every level.
          </p>
        </section>

        <section id="words" className="stack gap-16" style={{ scrollMarginTop: 110 }}>
          <h2 className="h2">
            Words <span className="serif">explained.</span>
          </h2>
          <dl className="card" style={{ margin: 0, padding: "4px 20px" }}>
            {AZ.map((a, i) => (
              <div key={a.t} className="dl-row">
                <dt style={{ fontWeight: 650, color: "var(--ink)" }}>{a.href ? <Link href={a.href} style={{ color: "var(--ink)" }}>{a.t}</Link> : a.t}</dt>
                <dd style={{ margin: 0, fontSize: 15, lineHeight: 1.55, color: "var(--ink2)" }}>{a.d}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section id="reviewers" className="stack gap-16" style={{ scrollMarginTop: 110 }}>
          <h2 className="h2">
            Who checks, <span className="serif">who pays.</span>
          </h2>
          <div className="grid-2">
            <div className="card card-pad stack gap-8">
              <span className="kick" style={{ fontSize: 10 }}>
                Who checks
              </span>
              <span style={{ fontSize: 15, lineHeight: 1.55, color: "var(--ink2)" }}>
                A licensed health professional will review every health page and script before it goes public. That reviewer is being appointed now; until then, the
                health guides are marked as drafts.
              </span>
            </div>
            <div className="card card-pad stack gap-8">
              <span className="kick" style={{ fontSize: 10 }}>
                Who pays
              </span>
              <span style={{ fontSize: 15, lineHeight: 1.55, color: "var(--ink2)" }}>
                Nobody but us, so far. No sponsors, no affiliate links and no product placement in health content, ever. If sponsors come later, they stay out of health
                pages and every paid post is labelled.
              </span>
            </div>
          </div>
        </section>

        <section id="credits" className="stack gap-16" style={{ scrollMarginTop: 110 }}>
          <h2 className="h2">
            <span className="serif">Credits.</span>
          </h2>
          <div className="card" style={{ padding: "4px 20px" }}>
            {CREDITS.map((c, i) => (
              <div key={c.t} className="dl-row">
                <span style={{ fontWeight: 650 }}>{c.t}</span>
                <span style={{ fontSize: 15, lineHeight: 1.55, color: "var(--ink2)" }}>
                  {c.d}{" "}
                  {c.href ? (
                    <a href={c.href} target="_blank" rel="noopener noreferrer">
                      Source
                    </a>
                  ) : null}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section id="sources" className="stack gap-16" style={{ scrollMarginTop: 110 }}>
          <h2 className="h2">
            Main <span className="serif">sources.</span>
          </h2>
          <p style={{ margin: 0, fontSize: 15, color: "var(--ink3)" }}>
            Each page lists its own sources where the claim is made. The two deep guides carry their full reference lists.
          </p>
          <ul className="card" style={{ listStyle: "none", margin: 0, padding: "4px 20px" }}>
            {SOURCES.map((x, i) => (
              <li key={x.href} style={{ padding: "12px 0", borderTop: i ? "1px solid var(--line)" : 0 }}>
                <a href={x.href} target="_blank" rel="noopener noreferrer">
                  {x.t}
                </a>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

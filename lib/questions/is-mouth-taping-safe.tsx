import Image from "next/image";
import Link from "next/link";
import s from "@/components/topic/topic.module.css";
import { Plan } from "@/components/topic/Plan";
import { Icon } from "@/components/Icons";
import { BLUR } from "@/lib/blur";

export const meta = {
  area: "sleep-energy",
  slug: "is-mouth-taping-safe",
  title: "Is mouth taping safe?",
  description:
    "Not with a blocked nose: the tape shuts your only other way to breathe. A 2025 review of 10 studies, 213 people, found the data don't support it as a treatment. There's no scientific evidence it sharpens your jaw.",
  minutes: 4,
  updated: "3 October 2026",
};

const SOURCES: { t: string; href: string }[] = [
  { t: "Rhee et al. 2025, mouth taping: safety and efficacy, a review of 10 studies (PLOS One)", href: "https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0323643" },
  { t: "Lee et al. 2022, mouth taping in mouth breathers with mild sleep apnoea (Healthcare)", href: "https://www.mdpi.com/2227-9032/10/9/1755" },
  { t: "Huang and Young 2015, porous oral patches in mild sleep apnoea: a pilot study (Otolaryngology, Head and Neck Surgery)", href: "https://doi.org/10.1177/0194599814559383" },
  { t: "Fitzpatrick et al. 2003, nasal or oral breathing and upper airway resistance in sleep (European Respiratory Journal)", href: "https://publications.ersnet.org/content/erj/22/5/827" },
  { t: "American Academy of Sleep Medicine, survey on sleep trends (2023)", href: "https://aasm.org/viral-tiktok-trends-are-not-the-answer-for-better-sleep/" },
  { t: "American Academy of Sleep Medicine, sleep prioritization survey (2024)", href: "https://aasm.org/wp-content/uploads/2024/07/sleep-prioritization-survey-2024-social-media-trends.pdf" },
  { t: "American Academy of Sleep Medicine, social media sleep trends survey (2025)", href: "https://aasm.org/scrolling-for-sleep-the-social-media-trends-impacting-americans-sleep-habits/" },
  { t: "Cleveland Clinic, is mouth tape safe to use while sleeping? (2025)", href: "https://health.clevelandclinic.org/mouth-taping" },
  { t: "Sleep Foundation, mouth taping for sleep (2026)", href: "https://www.sleepfoundation.org/sleep-hygiene/mouth-taping-for-sleep" },
  { t: "The Canadian Press, no evidence mouth taping is effective (2025)", href: "https://www.cp24.com/news/canada/2025/05/21/no-evidence-mouth-taping-is-effective-and-could-be-harmful-for-some-new-study-says" },
  { t: "NHS, sleep apnoea", href: "https://www.nhs.uk/conditions/sleep-apnoea/" },
];

const MYTHS: { q: string; v: string; a: string }[] = [
  {
    q: "It gives you a sharper jawline.",
    v: "No evidence",
    a: "The Sleep Foundation: there is no scientific evidence that mouth taping directly improves the jawline.",
  },
  {
    q: "It treats sleep apnoea.",
    v: "Not supported",
    a: "The 2025 review's authors found the data don't support it as a treatment. Untreated sleep apnoea needs a doctor, not tape.",
  },
  {
    q: "It's only tape, so it's fine for anyone.",
    v: "Not true",
    a: "Cleveland Clinic says never to use it with a blocked or congested nose, chronic allergies, a sinus infection, enlarged tonsils, a deviated septum or heart problems.",
  },
];

export function Body() {
  return (
    <>
      <p className={s.answer}>
        Not with a blocked nose: tape your mouth over it and you&apos;ve shut <em>your only other way to breathe.</em> For everyone else, it&apos;s
        unproven: a 2025 review of 10 studies found the data don&apos;t support it as a treatment.
      </p>
      <p className={s.meta}>
        {meta.minutes} minute read · Checked against its sources on {meta.updated}
      </p>
      <p className={s.setting}>
        <span>Factory setting</span>Breathing through your nose in sleep. The airway resists less, and is less prone to apnoea, than through your mouth.
      </p>

      <h2 className={s.sectionH}>
        Three things <span className="serif">to know.</span>
      </h2>

      <div className={s.suspect}>
        <div>
          <span className={s.num}>1</span>
          <h3 className={s.suspectH}>Lots of people have tried it.</h3>
          <p className={s.suspectP}>
            In three yearly US polls, from 2023 to 2025, <b>5 to 12% of adults</b> said they&apos;d tried mouth taping. The promise: better sleep, less
            snoring, even a sharper jaw.
          </p>
        </div>
        <div className={s.visual}>
          <Image src="/img/mouthtape_taped.jpg" alt="A skeleton asleep on its back, a strip of white tape across its teeth" width={900} height={900} sizes="260px" placeholder="blur" blurDataURL={BLUR["/img/mouthtape_taped.jpg"]} style={{ objectFit: "cover", aspectRatio: "1 / 1" }} />
        </div>
      </div>

      <div className={s.suspect}>
        <div>
          <span className={s.num}>2</span>
          <h3 className={s.suspectH}>The evidence is thin.</h3>
          <p className={s.suspectP}>
            A 2025 review found 10 studies, 213 people in total. Two showed the main sleep apnoea score improving, both in mild cases, and{" "}
            <b>neither had a comparison group.</b>
          </p>
        </div>
        <div className={s.visual}>
          <Image src="/img/mouthtape_review.jpg" alt="Ten study cards on a dark board, two of them lit and stamped mild" width={900} height={900} sizes="260px" placeholder="blur" blurDataURL={BLUR["/img/mouthtape_review.jpg"]} style={{ objectFit: "cover", aspectRatio: "1 / 1" }} />
        </div>
      </div>

      <div className={s.suspect}>
        <div>
          <span className={s.num}>3</span>
          <h3 className={s.suspectH}>A blocked nose makes it risky.</h3>
          <p className={s.suspectP}>
            People breathe through the mouth for a reason, often a blocked nose. The review lists suffocation among the risks of taping when the nose is
            blocked. Tape the mouth then, and <b>you&apos;ve shut the other way too.</b>
          </p>
        </div>
        <div className={s.visual}>
          <Image src="/img/mouthtape_airway.jpg" alt="A skeleton's head in profile, the airway drawn in light: the nose blocked in red, the taped mouth shut" width={900} height={900} sizes="260px" placeholder="blur" blurDataURL={BLUR["/img/mouthtape_airway.jpg"]} style={{ objectFit: "cover", aspectRatio: "1 / 1" }} />
        </div>
      </div>

      <h2 className={s.sectionH}>
        Myths, <span className="serif">checked.</span>
      </h2>
      <ul className={s.myths}>
        {MYTHS.map((m) => (
          <li key={m.q} className={s.myth}>
            <span className={s.mythQ}>
              &ldquo;{m.q}&rdquo; <span className={s.verdict}>{m.v}</span>
            </span>
            <p className={s.mythA}>{m.a}</p>
          </li>
        ))}
      </ul>

      <h2 className={s.sectionH}>
        Before you tape, <span className="serif">check this.</span>
      </h2>
      <Plan
        title="Four checks"
        steps={[
          { t: "Is your nose often blocked?", d: "Then don't tape. See a doctor about the nose instead." },
          { t: "Do you stop breathing, gasp or snort in your sleep?", d: "Those are signs of sleep apnoea. See a GP, and don't tape." },
          { t: "Tired all day, every day?", d: "That's another reason to see a GP first." },
          { t: "Taping for your jaw?", d: "There's no scientific evidence it changes your jawline." },
        ]}
      />

      <div className={s.doctor}>
        <h3>When it&apos;s time to see a doctor</h3>
        <p>
          The NHS says to see a GP if your breathing stops and starts while you sleep, if you make gasping, snorting or choking noises in your sleep,
          or if you always feel very tired during the day.
        </p>
      </div>

      <details className={s.science}>
        <summary>
          The science, if you want it <span>{SOURCES.length} sources</span>
        </summary>
        <p>
          The American Academy of Sleep Medicine&apos;s online surveys of about 2,000 US adults each found 12% had tried mouth taping in 2023, 5% in
          2024 and 7% in 2025.
        </p>
        <p>
          Rhee and colleagues (PLOS One, 2025) found 10 studies that met their criteria, with 213 patients in total. Two showed a statistically
          significant improvement in established markers of sleep apnoea: Lee and colleagues (2022; 20 patients, retrospective, no control group;
          median apnoea-hypopnoea index 8.3 to 4.7 events an hour) and Huang and Young (2015; 30 patients, 12.0 to 7.8; no control group). Both were in
          mild sleep apnoea. The review lists risks including asphyxiation when the nose is obstructed, and concludes that the existing data do not
          support mouth taping as a sound clinical intervention for the general population with sleep-disordered breathing. Its senior author put it
          plainly: tape the mouth when the airway is already blocked behind it and &ldquo;you&apos;ve now blocked off basically half of your
          airway.&rdquo;
        </p>
        <p>
          In a sleep lab study of 12 healthy adults, upper airway resistance and the tendency to obstructive sleep apnoea were significantly lower
          breathing through the nose than through the mouth (Fitzpatrick and colleagues, 2003). The Sleep Foundation finds no scientific evidence that
          mouth taping directly improves the jawline.
        </p>
        <ol>
          {SOURCES.map((x) => (
            <li key={x.href}>
              <a href={x.href} target="_blank" rel="noopener noreferrer">
                {x.t}
              </a>
            </li>
          ))}
        </ol>
      </details>

      <div className={s.next}>
        <Link href="/body/lungs" className={`card ${s.nextCard}`}>
          <span className={s.nextK}>See it</span>
          <span className={s.nextT}>Your lungs, in 3D</span>
        </Link>
        <Link href="/sleep-energy/how-to-fall-asleep-faster" className={`card ${s.nextCard}`}>
          <span className={s.nextK}>Next question</span>
          <span className={s.nextT}>
            How can I fall asleep faster? <Icon name="arrow" size={15} style={{ display: "inline", verticalAlign: "-2px" }} />
          </span>
        </Link>
      </div>
    </>
  );
}

import Image from "next/image";
import Link from "next/link";
import s from "@/components/topic/topic.module.css";
import { Plan } from "@/components/topic/Plan";
import { Icon } from "@/components/Icons";
import { BLUR } from "@/lib/blur";

export const meta = {
  area: "aches-health",
  slug: "why-does-my-lower-back-hurt",
  title: "Why does my lower back hurt?",
  description:
    "Usually, no single cause can be found: about 9 cases in 10 are non-specific. Worn discs show up on the scans of plenty of people with no pain. It usually eases within a few weeks, and it often comes back. Stay active.",
  minutes: 4,
  updated: "3 October 2026",
};

const SOURCES: { t: string; href: string }[] = [
  { t: "World Health Organization, low back pain (fact sheet, 2023)", href: "https://www.who.int/news-room/fact-sheets/detail/low-back-pain" },
  { t: "Brinjikji et al. 2015, spine scans of people with no back pain: 33 studies (American Journal of Neuroradiology)", href: "https://pmc.ncbi.nlm.nih.gov/articles/PMC4464797/" },
  { t: "NHS, back pain", href: "https://www.nhs.uk/conditions/back-pain/" },
  { t: "Menezes Costa et al. 2012, how acute and persistent low back pain unfold: 33 cohorts (CMAJ)", href: "https://www.cmaj.ca/content/184/11/E613" },
  { t: "Qaseem et al. 2017, American College of Physicians guideline on low back pain (Annals of Internal Medicine)", href: "https://europepmc.org/article/MED/28192789" },
  { t: "Pengel et al. 2003, the prognosis of acute low back pain (BMJ)", href: "https://www.bmj.com/content/327/7410/323" },
  { t: "Smith, Littlewood and May 2014, stabilisation exercises for low back pain: 29 studies (BMC Musculoskeletal Disorders)", href: "https://europepmc.org/article/MED/25488399" },
];

const MYTHS: { q: string; v: string; a: string }[] = [
  {
    q: "Disc wear on a scan explains the pain.",
    v: "Not necessarily",
    a: "Scans of people with no back pain show disc wear in 37% at age 20 and 96% at 80. The study's authors call it normal ageing.",
  },
  {
    q: "Core stability exercises are the fix.",
    v: "No better",
    a: "Across 29 studies, they did no better than other forms of exercise in the long run.",
  },
  {
    q: "Rest in bed until it passes.",
    v: "Not advised",
    a: "The NHS says to stay active, carry on with your daily activities, and not stay in bed for long periods.",
  },
];

export function Body() {
  return (
    <>
      <p className={s.answer}>
        Usually, no one can say. About <em>9 cases in 10</em> can&apos;t be pinned on any disease or damage. Lower back pain usually eases within a few
        weeks, and it often comes back.
      </p>
      <p className={s.meta}>
        {meta.minutes} minute read · Checked against its sources on {meta.updated}
      </p>
      <p className={s.setting}>
        <span>Factory setting</span>Discs that change with age. In people with no back pain, scans show disc wear in 37% at 20 and 96% at 80.
      </p>

      <h2 className={s.sectionH}>
        Three things <span className="serif">to know.</span>
      </h2>

      <div className={s.suspect}>
        <div>
          <span className={s.num}>1</span>
          <h3 className={s.suspectH}>Most back pain has no single cause.</h3>
          <p className={s.suspectP}>
            The World Health Organization calls about 90% of cases <b>non-specific:</b> the pain can&apos;t be confidently put down to a disease or to
            damage. It&apos;s the leading cause of disability in the world, and most people get it at least once.
          </p>
        </div>
        <div className={s.visual}>
          <Image src="/img/back_cases.jpg" alt="Ten X-ray films of a lower spine on a light box, nine of them stamped non-specific" width={900} height={900} sizes="260px" placeholder="blur" blurDataURL={BLUR["/img/back_cases.jpg"]} style={{ objectFit: "cover", aspectRatio: "1 / 1" }} />
        </div>
      </div>

      <div className={s.suspect}>
        <div>
          <span className={s.num}>2</span>
          <h3 className={s.suspectH}>Worn discs are normal.</h3>
          <p className={s.suspectP}>
            Across 33 studies of people with no back pain, scans showed disc degeneration in 37% of 20-year-olds and 96% of 80-year-olds. The authors:{" "}
            <b>normal ageing,</b> not disease.
          </p>
        </div>
        <div className={s.visual}>
          <Image src="/img/back_scans.jpg" alt="Two grids of a hundred small disc scans, aged 20 and aged 80, the worn discs dark: 37% and 96%" width={900} height={900} sizes="260px" placeholder="blur" blurDataURL={BLUR["/img/back_scans.jpg"]} style={{ objectFit: "cover", aspectRatio: "1 / 1" }} />
        </div>
      </div>

      <div className={s.suspect}>
        <div>
          <span className={s.num}>3</span>
          <h3 className={s.suspectH}>It usually eases, and often returns.</h3>
          <p className={s.suspectP}>
            In studies that followed people with new back pain, average pain fell from 52 out of 100 to 23 within six weeks. In another review,{" "}
            <b>73% had it again</b> within a year.
          </p>
        </div>
        <div className={s.visual}>
          <Image src="/img/back_pain.jpg" alt="A line falling from 52 to 23 over six weeks, and a label: 73% had it again within a year" width={900} height={900} sizes="260px" placeholder="blur" blurDataURL={BLUR["/img/back_pain.jpg"]} style={{ objectFit: "cover", aspectRatio: "1 / 1" }} />
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
        Today, <span className="serif">try this.</span>
      </h2>
      <Plan
        title="What the NHS advises"
        steps={[
          { t: "Stay active.", d: "Try to carry on with your daily activities." },
          { t: "Don't stay in bed for long.", d: "Long periods in bed are on the NHS's list of things not to do." },
          { t: "Any exercise you'll keep doing.", d: "Core stability work did no better than other exercise in the long run." },
          { t: "Give it a few weeks.", d: "It usually improves within a few weeks." },
        ]}
      />

      <div className={s.doctor}>
        <h3>When it&apos;s time to see a doctor</h3>
        <p>
          The NHS says to see a GP if it doesn&apos;t improve after a few weeks of treating it at home, if it doesn&apos;t improve with rest or is worse
          at night, or if you&apos;ve lost weight without trying. Call 999 or go to A&amp;E if you have pain, tingling, weakness or numbness in both
          legs, a loss of feeling around your genitals or anus, or changes in your bladder or bowels.
        </p>
      </div>

      <details className={s.science}>
        <summary>
          The science, if you want it <span>{SOURCES.length} sources</span>
        </summary>
        <p>
          The World Health Organization (2023) calls low back pain the single leading cause of disability worldwide; most people get it at least once,
          and about 90% of cases are non-specific, meaning the pain can&apos;t be confidently accounted for by another diagnosis such as an underlying
          disease or tissue damage.
        </p>
        <p>
          Brinjikji and colleagues (2015) pooled 33 studies with 3,110 people who had no symptoms. Their model estimated disc degeneration in 37% at age
          20 and 96% at age 80, and they suggest such findings be considered normal age-related changes rather than disease.
        </p>
        <p>
          Menezes Costa and colleagues (CMAJ, 2012) pooled 33 cohorts with 11,166 people: in acute pain, mean pain out of 100 fell from 52 at the start
          to 23 at six weeks. The American College of Physicians (2017) notes that most people with acute or subacute low back pain improve over time
          regardless of treatment. Pengel and colleagues (BMJ, 2003) found that 73% had at least one recurrence within 12 months. Smith and colleagues
          (2014) pooled 29 studies: stabilisation exercises were no more effective than any other form of active exercise in the long term.
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
        <Link href="/body/skeleton" className={`card ${s.nextCard}`}>
          <span className={s.nextK}>See it</span>
          <span className={s.nextT}>Your skeleton, in 3D</span>
        </Link>
        <Link href="/posture-looks/how-to-fix-my-posture" className={`card ${s.nextCard}`}>
          <span className={s.nextK}>Next question</span>
          <span className={s.nextT}>
            How do I fix my posture? <Icon name="arrow" size={15} style={{ display: "inline", verticalAlign: "-2px" }} />
          </span>
        </Link>
      </div>
    </>
  );
}

import Image from "next/image";
import Link from "next/link";
import s from "@/components/topic/topic.module.css";
import { StatFigure } from "@/components/topic/Figures";
import { Plan } from "@/components/topic/Plan";
import { Icon } from "@/components/Icons";
import { BLUR } from "@/lib/blur";

export const meta = {
  area: "fitness-strength",
  slug: "how-many-steps-a-day",
  title: "How many steps a day do you really need?",
  description:
    "About 7,000. In 57 studies that counted steps with devices, 7,000 a day went with a 47% lower risk of dying early than 2,000, and the extra benefit above 7,000 was small. Where 10,000 came from, and how to build up.",
  minutes: 4,
  updated: "3 October 2026",
};

const SOURCES: { t: string; href: string }[] = [
  { t: "Ding et al. 2025, daily steps and health outcomes in adults: 57 studies (Lancet Public Health)", href: "https://www.cancer.fr/professionnels-de-sante/veille/nota-bene-cancer/bulletin-n-654-du-28-juillet-2025/daily-steps-and-health-outcomes-in-adults-a-systematic-review-and-dose-response-meta-analysis" },
  { t: "University of Sydney, rethink the 10,000-a-day step goal (2025)", href: "https://sydney.edu.au/content/corporate/news-opinion/news/2025/07/24/rethink-the-10000-a-day-step-goal-study-suggests.html" },
  { t: "Harvard Gazette, for older women, 7,500 steps a day lowers mortality (2019)", href: "https://news.harvard.edu/gazette/story/2019/06/for-older-women-just-7500-steps-a-day-lowers-mortality" },
  { t: "Harvard Health Publishing, 10,000 steps a day, or fewer? (2019)", href: "https://www.health.harvard.edu/blog/10000-steps-a-day-or-fewer-2019071117305" },
  { t: "Evidence Decoded, 7,000 steps and the question of cause (2025)", href: "https://evidencedecoded.substack.com/p/7000-steps-causality-and-the-interpretation" },
  { t: "WHO guidelines on physical activity and sedentary behaviour (2020)", href: "https://www.ncbi.nlm.nih.gov/books/NBK566048/" },
];

const MYTHS: { q: string; v: string; a: string }[] = [
  {
    q: "You need 10,000 steps a day.",
    v: "Not supported",
    a: "The number most likely comes from the name of a pedometer sold in Japan in 1965. When scientists measured, most of the benefit came by about 7,000 a day.",
  },
  {
    q: "If you can't reach 10,000, there's no point.",
    v: "Not supported",
    a: "The biggest differences are at the low end. Compared with 2,000 steps a day, 7,000 went with a 47% lower risk of dying early.",
  },
  {
    q: "Walking more is proven to make you live longer.",
    v: "Not proven",
    a: "These studies follow people over time and find a link, not proof. Part of the link runs the other way: people who are ill walk less.",
  },
];

export function Body() {
  return (
    <>
      <p className={s.answer}>
        About <em>7,000 a day.</em> In 57 studies that counted steps with devices, 7,000 steps went with a 47% lower risk of dying early than 2,000, and above
        7,000 the extra benefit was small for most outcomes. 10,000 was a pedometer&apos;s name.
      </p>
      <p className={s.meta}>
        {meta.minutes} minute read · Checked against its sources on {meta.updated}
      </p>
      <p className={s.setting}>
        <span>Factory setting</span>About 7,000 steps a day. Far below that? Add about a thousand a day at a time.
      </p>

      <h2 className={s.sectionH}>
        Three things <span className="serif">to know.</span>
      </h2>

      <div className={s.suspect}>
        <div>
          <span className={s.num}>1</span>
          <h3 className={s.suspectH}>10,000 was a slogan, not a finding.</h3>
          <p className={s.suspectP}>
            The number most likely traces back to a pedometer sold in Japan in 1965, the manpo-kei: the name means &ldquo;10,000-steps meter&rdquo;. I-Min Lee, the
            Harvard epidemiologist who traced it, said <b>the name was a marketing tool.</b>
          </p>
        </div>
        <div className={s.visual}>
          <Image src="/img/steps_pedometer.jpg" alt="A 1960s-style pedometer clipped to the hip bone of a walking skeleton" width={900} height={900} sizes="260px" placeholder="blur" blurDataURL={BLUR["/img/steps_pedometer.jpg"]} style={{ objectFit: "cover", aspectRatio: "1 / 1" }} />
        </div>
      </div>

      <div className={s.suspect}>
        <div>
          <span className={s.num}>2</span>
          <h3 className={s.suspectH}>7,000 is where most of the benefit is.</h3>
          <p className={s.suspectP}>
            A 2025 review pooled 57 studies in which devices, not memories, counted the steps. Compared with 2,000 steps a day, 7,000 went with a lower risk of
            dying early, of dementia, of depression symptoms and of falls.
          </p>
        </div>
        <div className={s.visual}>
          <StatFigure
            stats={[
              { value: "−47%", label: "risk of dying early, 7,000 against 2,000 steps a day", tone: "ink" },
              { value: "−38%", label: "dementia", tone: "ink" },
              { value: "−28%", label: "falls", tone: "ink" },
            ]}
            source="Ding et al. 2025, 57 studies"
          />
        </div>
      </div>

      <div className={s.suspect}>
        <div>
          <span className={s.num}>3</span>
          <h3 className={s.suspectH}>Past 7,000, the gains flatten.</h3>
          <p className={s.suspectP}>
            Above 7,000 steps, the extra benefit was small for most outcomes. In a study of 16,741 older women (average age 72), the benefit levelled off around
            <b> 7,500 steps.</b> Past that point, each extra thousand bought less.
          </p>
        </div>
        <div className={s.visual}>
          <Image src="/img/steps_hill.jpg" alt="A skeleton walking up a slope that rises steeply, then flattens out" width={900} height={900} sizes="260px" placeholder="blur" blurDataURL={BLUR["/img/steps_hill.jpg"]} style={{ objectFit: "cover", aspectRatio: "1 / 1" }} />
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
        This week, <span className="serif">try this.</span>
      </h2>
      <Plan
        title="Your steps"
        steps={[
          { t: "Find your usual number.", d: "Most phones and watches count steps: look at a normal week." },
          { t: "Far below 7,000? Add a thousand.", d: "About a thousand more steps a day, then another when that feels normal." },
          { t: "Aim for about 7,000 a day.", d: "That's where the studies found most of the benefit." },
          { t: "Add strength twice a week.", d: "The WHO adds muscle-strengthening work on 2 or more days, beside 150 minutes or more of moderate activity." },
        ]}
        more={{ href: "/body?mode=move", label: "See the body move in 3D" }}
      />

      <details className={s.science}>
        <summary>
          The science, if you want it <span>{SOURCES.length} sources</span>
        </summary>
        <p>
          Ding and colleagues (Lancet Public Health, 2025) pooled 57 studies of adults whose daily steps were measured by devices. Against 2,000 steps a day,
          7,000 went with hazard ratios of 0.53 for death from any cause, 0.62 for dementia, 0.78 for depressive symptoms and 0.72 for falls. Above 7,000, the
          extra benefits were modest for most outcomes, the lead author said.
        </p>
        <p>
          In 2019, I-Min Lee&apos;s team followed 16,741 women with an average age of 72 (JAMA Internal Medicine): the lower risk of dying levelled off around
          7,500 steps a day. Lee traced the 10,000 figure to the 1965 manpo-kei pedometer and called its name a marketing tool.
        </p>
        <p>
          All of these are observational studies. They show a link, not cause, and people who are already ill take fewer steps, which inflates the gap.
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
        <Link href="/body?mode=move" className={`card ${s.nextCard}`}>
          <span className={s.nextK}>See it</span>
          <span className={s.nextT}>The body in motion, in 3D</span>
        </Link>
        <Link href="/weight-food/how-to-lose-belly-fat" className={`card ${s.nextCard}`}>
          <span className={s.nextK}>Next question</span>
          <span className={s.nextT}>
            Can crunches burn belly fat? <Icon name="arrow" size={15} style={{ display: "inline", verticalAlign: "-2px" }} />
          </span>
        </Link>
      </div>
    </>
  );
}

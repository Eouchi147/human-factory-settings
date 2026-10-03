import Image from "next/image";
import Link from "next/link";
import s from "@/components/topic/topic.module.css";
import { StatFigure } from "@/components/topic/Figures";
import { Plan } from "@/components/topic/Plan";
import { Icon } from "@/components/Icons";
import { BLUR } from "@/lib/blur";

export const meta = {
  area: "weight-food",
  slug: "how-much-protein-do-i-need",
  title: "How much protein do I need a day?",
  description:
    "At least about 0.8 g for every kilo you weigh: about 58 g a day at 70 kg. Lifting weights? Up to about 1.6 g per kilo; past that, the gains stopped in 49 trials. Spread it over your meals.",
  minutes: 4,
  updated: "3 October 2026",
};

const SOURCES: { t: string; href: string }[] = [
  { t: "EFSA, dietary reference values for nutrients, summary report (2017)", href: "https://www.efsa.europa.eu/sites/default/files/2017_09_DRVs_summary_report.pdf" },
  { t: "Dietary Guidelines for Americans, 2025 to 2030", href: "https://cdn.realfood.gov/DGA.pdf" },
  { t: "Morton et al. 2018, protein supplements and resistance training: 49 trials (British Journal of Sports Medicine)", href: "https://openrepository.aut.ac.nz/items/8dea98a4-4e37-4c60-be43-4b6ece0bd9a5" },
  { t: "Leidy et al. 2015, the role of protein in weight loss and maintenance (American Journal of Clinical Nutrition)", href: "https://doi.org/10.3945/ajcn.114.084038" },
  { t: "NIDDK, healthy eating for adults with chronic kidney disease", href: "https://www.niddk.nih.gov/health-information/kidney-disease/chronic-kidney-disease-ckd/eating-nutrition" },
];

const MYTHS: { q: string; v: string; a: string }[] = [
  {
    q: "More protein, more muscle.",
    v: "Not supported",
    a: "In 49 trials of people lifting weights, the gains stopped at about 1.6 g of protein per kilo a day. Past that, you're buying more protein, not more muscle.",
  },
  {
    q: "Extra protein builds the body on the label.",
    v: "Not supported",
    a: "With weight training, extra protein added about 300 g of lean mass on average. It helps. A little.",
  },
  {
    q: "Everyone needs 1.6 g per kilo.",
    v: "Not quite",
    a: "Europe's food safety experts set about 0.83 g per kilo for adults. The new American guidelines go higher, 1.2 to 1.6. The 1.6 ceiling comes from trials of people who lift.",
  },
];

export function Body() {
  return (
    <>
      <p className={s.answer}>
        At least about <em>0.8 g for every kilo you weigh,</em> each day: about 58 g at 70 kg. If you lift weights, up to about 1.6 g per kilo; past that, the
        gains stopped. Spread it over your meals.
      </p>
      <p className={s.meta}>
        {meta.minutes} minute read · Checked against its sources on {meta.updated}
      </p>
      <p className={s.setting}>
        <span>Factory setting</span>At least 0.8 g of protein per kilo a day, 25 to 30 g at each meal. Training? Up to 1.6 g per kilo.
      </p>

      <h2 className={s.sectionH}>
        Three things <span className="serif">to know.</span>
      </h2>

      <div className={s.suspect}>
        <div>
          <span className={s.num}>1</span>
          <h3 className={s.suspectH}>You need less than the supplement aisle hopes.</h3>
          <p className={s.suspectP}>
            Europe&apos;s food safety experts (EFSA) set the reference intake at about <b>0.83 g per kilo of body weight a day</b> for adults. The new Dietary
            Guidelines for Americans go higher: 1.2 to 1.6 g per kilo.
          </p>
        </div>
        <div className={s.visual}>
          <StatFigure
            stats={[
              { value: "0.83 g", label: "per kilo you weigh, each day (EFSA)", tone: "ink" },
              { value: "58 g", label: "a day, for someone who weighs 70 kg", tone: "ink" },
            ]}
            source="EFSA 2017"
          />
        </div>
      </div>

      <div className={s.suspect}>
        <div>
          <span className={s.num}>2</span>
          <h3 className={s.suspectH}>Lifting? Extra protein helps, a little.</h3>
          <p className={s.suspectP}>
            Across 49 trials and 1,863 people doing weight training, extra protein added about <b>300 g of lean mass</b> on average. Above about 1.6 g per kilo a
            day, the gains stopped.
          </p>
        </div>
        <div className={s.visual}>
          <Image src="/img/protein_scale.jpg" alt="A kitchen scale reading 300 grams beside a tub of muscle-gain powder" width={900} height={900} sizes="260px" placeholder="blur" blurDataURL={BLUR["/img/protein_scale.jpg"]} style={{ objectFit: "cover", aspectRatio: "1 / 1" }} />
        </div>
      </div>

      <div className={s.suspect}>
        <div>
          <span className={s.num}>3</span>
          <h3 className={s.suspectH}>Spread it over your meals.</h3>
          <p className={s.suspectP}>
            A review in the American Journal of Clinical Nutrition suggests at least about <b>25 to 30 g of protein at each meal.</b> Three meals like that reach
            the European reference for most adults.
          </p>
        </div>
        <div className={s.visual}>
          <Image src="/img/protein_bowls.jpg" alt="Four bowls, each holding the same small pile of protein cubes" width={900} height={900} sizes="260px" placeholder="blur" blurDataURL={BLUR["/img/protein_bowls.jpg"]} style={{ objectFit: "cover", aspectRatio: "1 / 1" }} />
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
        title="Your protein"
        steps={[
          { t: "Work out your number.", d: "Your weight in kilos times 0.8: that's your floor in grams a day." },
          { t: "Spread it out.", d: "About 25 to 30 g at each meal, rather than most of it at dinner." },
          { t: "Lifting? Go up to 1.6.", d: "Past 1.6 g per kilo, the trials found no extra gain." },
          { t: "Kidney disease? Ask first.", d: "Your doctor or dietitian sets your protein, not a video." },
        ]}
        more={{ href: "/guides/supplements", label: "Supplements: the full guide" }}
      />

      <div className={s.doctor}>
        <h3>When it&apos;s time to see a doctor</h3>
        <p>
          If you have kidney disease, work out how much protein to eat with your doctor or a dietitian. The US National Institute of Diabetes and Digestive and
          Kidney Diseases advises finding the right balance of protein with a dietitian or health care professional.
        </p>
      </div>

      <details className={s.science}>
        <summary>
          The science, if you want it <span>{SOURCES.length} sources</span>
        </summary>
        <p>
          EFSA&apos;s population reference intake for protein is 0.83 g per kilo of body weight a day for adults. The Dietary Guidelines for Americans 2025 to
          2030 recommend 1.2 to 1.6 g per kilo a day.
        </p>
        <p>
          Morton and colleagues (British Journal of Sports Medicine, 2018) pooled 49 trials with 1,863 people: protein supplements during resistance training
          raised gains in lean mass a little, and intakes beyond about 1.62 g per kilo a day brought no further gains. Leidy and colleagues (2015) suggest at
          least about 25 to 30 g of protein per meal.
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
        <Link href="/guides/supplements" className={`card ${s.nextCard}`}>
          <span className={s.nextK}>Read more</span>
          <span className={s.nextT}>Supplements: the full guide</span>
        </Link>
        <Link href="/weight-food/how-to-lose-belly-fat" className={`card ${s.nextCard}`}>
          <span className={s.nextK}>Next question</span>
          <span className={s.nextT}>
            How do I lose belly fat? <Icon name="arrow" size={15} style={{ display: "inline", verticalAlign: "-2px" }} />
          </span>
        </Link>
      </div>
    </>
  );
}

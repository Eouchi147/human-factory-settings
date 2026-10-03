import Image from "next/image";
import Link from "next/link";
import s from "@/components/topic/topic.module.css";
import { Plan } from "@/components/topic/Plan";
import { Icon } from "@/components/Icons";
import { BLUR } from "@/lib/blur";

export const meta = {
  area: "weight-food",
  slug: "how-much-water-do-you-need",
  title: "How much water do you need?",
  description:
    "Europe's experts set 2 litres a day for women and 2.5 for men, counting every drink and the water in food. Coffee and tea count. Most healthy people get enough by drinking when thirsty, and with meals. Far too much can be dangerous.",
  minutes: 4,
  updated: "3 October 2026",
};

const SOURCES: { t: string; href: string }[] = [
  { t: "Valtin 2002, is there scientific evidence for 8 x 8? (American Journal of Physiology)", href: "https://europepmc.org/article/MED/12376390" },
  { t: "EFSA 2010, scientific opinion on dietary reference values for water (EFSA Journal)", href: "https://air.unimi.it/handle/2434/156017" },
  { t: "National Academies 2004, dietary reference intakes for water: summary", href: "https://www.nationalacademies.org/read/10925/chapter/2" },
  { t: "National Academies 2004, news release on the water report", href: "https://www.nationalacademies.org/news/report-sets-dietary-intake-levels-for-water-salt-and-potassium-to-maintain-health-and-reduce-chronic-disease-risk" },
  { t: "Killer, Blannin and Jeukendrup 2014, moderate coffee and hydration (PLOS ONE)", href: "https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0084154" },
  { t: "Maughan et al. 2016, a beverage hydration index (American Journal of Clinical Nutrition)", href: "https://doi.org/10.3945/ajcn.115.114769" },
  { t: "NHS, water, drinks and hydration", href: "https://www.nhs.uk/live-well/eat-well/food-guidelines-and-food-labels/water-drinks-nutrition/" },
  { t: "Almond et al. 2005, hyponatremia among runners in the Boston Marathon (New England Journal of Medicine)", href: "https://doi.org/10.1056/NEJMoa043901" },
];

const MYTHS: { q: string; v: string; a: string }[] = [
  {
    q: "Coffee dehydrates you.",
    v: "Not in moderation",
    a: "In a trial of 50 men who drink coffee, four 200 ml cups a day hydrated as well as water.",
  },
  {
    q: "Only water counts.",
    v: "No",
    a: "The NHS counts water, lower-fat milk and lower-sugar drinks, including tea and coffee.",
  },
  {
    q: "You can't drink too much water.",
    v: "You can",
    a: "The US National Academies warn that drinking water in excessive amounts can be life-threatening.",
  },
];

export function Body() {
  return (
    <>
      <p className={s.answer}>
        About <em>2 to 2.5 litres a day</em> in all, counting every drink and the water in your food. Most healthy people get there by drinking when
        thirsty, and with meals.
      </p>
      <p className={s.meta}>
        {meta.minutes} minute read · Checked against its sources on {meta.updated}
      </p>
      <p className={s.setting}>
        <span>Factory setting</span>Thirst. For most healthy people, drinking when thirsty and with meals keeps them hydrated.
      </p>

      <h2 className={s.sectionH}>
        Three things <span className="serif">to know.</span>
      </h2>

      <div className={s.suspect}>
        <div>
          <span className={s.num}>1</span>
          <h3 className={s.suspectH}>Eight glasses a day has no study behind it.</h3>
          <p className={s.suspectP}>
            A 2002 review went looking for where &ldquo;eight 8-ounce glasses a day&rdquo; came from. It found <b>no scientific studies</b> in support.
          </p>
        </div>
        <div className={s.visual}>
          <Image src="/img/water_drawer.jpg" alt="An open card drawer labelled 8 glasses a day, the study, with nothing in it" width={900} height={900} sizes="260px" placeholder="blur" blurDataURL={BLUR["/img/water_drawer.jpg"]} style={{ objectFit: "cover", aspectRatio: "1 / 1" }} />
        </div>
      </div>

      <div className={s.suspect}>
        <div>
          <span className={s.num}>2</span>
          <h3 className={s.suspectH}>Food and coffee count.</h3>
          <p className={s.suspectP}>
            Europe&apos;s food safety experts set 2.0 litres a day for women and 2.5 for men, from all drinks and food. In US data, about{" "}
            <b>20% came from food.</b> In trials, coffee hydrated as well as water. So did tea and cola.
          </p>
        </div>
        <div className={s.visual}>
          <Image src="/img/water_jugs.jpg" alt="Two measuring jugs, women 2.0 litres and men 2.5 litres, the top fifth of each from food" width={900} height={900} sizes="260px" placeholder="blur" blurDataURL={BLUR["/img/water_jugs.jpg"]} style={{ objectFit: "cover", aspectRatio: "1 / 1" }} />
        </div>
      </div>

      <div className={s.suspect}>
        <div>
          <span className={s.num}>3</span>
          <h3 className={s.suspectH}>Far too much is dangerous.</h3>
          <p className={s.suspectP}>
            At the Boston Marathon, <b>13% of runners</b> tested at the finish had low blood sodium. It was linked to gaining weight during the race.
          </p>
        </div>
        <div className={s.visual}>
          <Image src="/img/water_marathon.jpg" alt="A finish banner over a board of a hundred race bibs, thirteen of them red" width={900} height={900} sizes="260px" placeholder="blur" blurDataURL={BLUR["/img/water_marathon.jpg"]} style={{ objectFit: "cover", aspectRatio: "1 / 1" }} />
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
        title="The NHS check"
        steps={[
          { t: "Drink when you're thirsty.", d: "And with meals. For most healthy people, that's enough." },
          { t: "Check the colour.", d: "Aim for pee that's a clear pale yellow." },
          { t: "Count tea, coffee and milk.", d: "Water, lower-fat milk and lower-sugar drinks all count." },
          { t: "Drink more when you need to.", d: "In heat, when active for long periods, when ill, pregnant or breastfeeding." },
        ]}
      />

      <div className={s.doctor}>
        <h3>When to be careful</h3>
        <p>
          The US National Academies warn that drinking water in excessive amounts can be life-threatening, and at one marathon, low blood sodium was
          linked to weight gained during the race. If you&apos;re ill, ask your doctor how much to drink.
        </p>
      </div>

      <details className={s.science}>
        <summary>
          The science, if you want it <span>{SOURCES.length} sources</span>
        </summary>
        <p>
          Valtin (2002) looked for the origin of the advice to drink at least eight 8-ounce glasses of water a day, with caffeinated drinks not
          counting, and found no scientific studies in support of it. He notes that large intakes are called for in special circumstances, such as
          vigorous work and exercise in hot climates.
        </p>
        <p>
          The European Food Safety Authority (2010) set adequate intakes of total water of 2.0 litres a day for women and 2.5 for men, including
          drinking water, beverages of all kinds and the moisture in food, at moderate temperatures and activity. The US National Academies (2004)
          report that about 80% of total water comes from drinks, including caffeinated ones, and 20% from food, and that most healthy people meet
          their needs by letting thirst be their guide.
        </p>
        <p>
          Killer and colleagues (2014) gave 50 male coffee drinkers four 200 ml cups of coffee or water a day for three days: coffee provided similar
          hydrating qualities. Maughan and colleagues (2016) tested 13 drinks in 72 men, a litre at a time: four hours later, urine output after cola,
          tea, coffee and several others did not differ from water, and it was lower after milk, so more was kept in. Almond and colleagues (2005)
          tested 488 runners at the finish of the Boston Marathon: 13% had low blood sodium, which was associated with weight gain during the race.
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
        <Link href="/body/kidneys" className={`card ${s.nextCard}`}>
          <span className={s.nextK}>See it</span>
          <span className={s.nextT}>Your kidneys, in 3D</span>
        </Link>
        <Link href="/weight-food/how-much-protein-do-i-need" className={`card ${s.nextCard}`}>
          <span className={s.nextK}>Next question</span>
          <span className={s.nextT}>
            How much protein do I need a day? <Icon name="arrow" size={15} style={{ display: "inline", verticalAlign: "-2px" }} />
          </span>
        </Link>
      </div>
    </>
  );
}

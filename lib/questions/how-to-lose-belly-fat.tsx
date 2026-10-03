import Image from "next/image";
import Link from "next/link";
import s from "@/components/topic/topic.module.css";
import { Plan } from "@/components/topic/Plan";
import { Icon } from "@/components/Icons";
import { BLUR } from "@/lib/blur";

export const meta = {
  area: "weight-food",
  slug: "how-to-lose-belly-fat",
  title: "How do I lose belly fat?",
  description:
    "Not with crunches: training a muscle doesn't burn the fat on top of it. What works is strength training, which cut body fat in 58 studies, including the deep fat around your organs, and eating a little less than you use.",
  minutes: 4,
  updated: "3 October 2026",
};

const SOURCES: { t: string; href: string }[] = [
  { t: "Spot reduction: systematic review and meta-analysis, 13 studies (Human Movement, 2022)", href: "https://doi.org/10.5114/HM.2022.110373" },
  { t: "Vispute et al. 2011, the effect of abdominal exercise on abdominal fat (6 weeks)", href: "https://doi.org/10.1519/JSC.0b013e3181fb4a46" },
  { t: "Kostek et al. 2007, fat under the skin after training one arm for 12 weeks", href: "https://stars.library.ucf.edu/scopus2000/6502" },
  { t: "Wewege et al. 2022, resistance training and body fat: 58 studies (Sports Medicine)", href: "https://digital.library.adelaide.edu.au/items/630d3501-d4b8-48a6-bd74-32d8cc5124f0" },
  { t: "NHS, understanding calories", href: "https://www.nhs.uk/live-well/healthy-weight/managing-your-weight/understanding-calories/" },
  { t: "WHO guidelines on physical activity and sedentary behaviour (2020)", href: "https://www.ncbi.nlm.nih.gov/books/NBK566048/" },
];

const MYTHS: { q: string; v: string; a: string }[] = [
  {
    q: "Crunches burn belly fat.",
    v: "Not supported",
    a: "In a six-week trial, ab exercises alone didn't shrink the waist or the fat on the belly. They do make the muscle underneath stronger.",
  },
  {
    q: "You can choose where you lose fat.",
    v: "Not supported",
    a: "Across 13 studies and more than 1,100 people, training one part of the body didn't shrink the fat in that spot. Your body decides where the fat comes from.",
  },
  {
    q: "Weights build muscle; only cardio burns fat.",
    v: "Not supported",
    a: "In 58 studies, strength training on its own cut body fat, including the deep fat around the organs.",
  },
];

export function Body() {
  return (
    <>
      <p className={s.answer}>
        Not with crunches. <em>A muscle doesn&apos;t burn the fat sitting on top of it.</em> What works: strength training, which cut body fat in 58 studies,
        including the deep fat around your organs, and eating and drinking a little less than you use.
      </p>
      <p className={s.meta}>
        {meta.minutes} minute read · Checked against its sources on {meta.updated}
      </p>
      <p className={s.setting}>
        <span>Factory setting</span>Strength work twice a week, at least 150 minutes of moderate movement a week, and a little less food and drink than you use.
      </p>

      <h2 className={s.sectionH}>
        Three things <span className="serif">to know.</span>
      </h2>

      <div className={s.suspect}>
        <div>
          <span className={s.num}>1</span>
          <h3 className={s.suspectH}>Crunches build the muscle, not the fat loss.</h3>
          <p className={s.suspectP}>
            In a six-week trial, 24 adults did ab exercises. Their waists and their belly fat <b>didn&apos;t shrink.</b> You get strong
            abs, under the same fat.
          </p>
        </div>
        <div className={s.visual}>
          <Image src="/img/bellyfat_crunch.jpg" alt="A skeleton doing a crunch, with a layer of belly fat over its abdominal muscles" width={900} height={900} sizes="260px" placeholder="blur" blurDataURL={BLUR["/img/bellyfat_crunch.jpg"]} style={{ objectFit: "cover", aspectRatio: "1 / 1" }} />
        </div>
      </div>

      <div className={s.suspect}>
        <div>
          <span className={s.num}>2</span>
          <h3 className={s.suspectH}>No exercise burns fat in one spot.</h3>
          <p className={s.suspectP}>
            Across 13 studies and 1,158 people aged 14 to 71, training one body part didn&apos;t shrink the fat there. In one trial, people trained only one arm for 12
            weeks: on the scans, <b>no difference</b> between the fat on the two arms.
          </p>
        </div>
        <div className={s.visual}>
          <Image src="/img/bellyfat_arms.jpg" alt="Two arm scans side by side: the trained arm and the untrained arm carry the same fat" width={900} height={900} sizes="260px" placeholder="blur" blurDataURL={BLUR["/img/bellyfat_arms.jpg"]} style={{ objectFit: "cover", aspectRatio: "1 / 1" }} />
        </div>
      </div>

      <div className={s.suspect}>
        <div>
          <span className={s.num}>3</span>
          <h3 className={s.suspectH}>Strength training cuts fat, the deep kind too.</h3>
          <p className={s.suspectP}>
            In 58 studies, strength training cut body fat, including the fat packed around your organs. To lose fat anywhere, eat and drink a little less than you
            use: <b>your body burns its stored fat,</b> and it picks where.
          </p>
        </div>
        <div className={s.visual}>
          <Image src="/img/bellyfat_deep.jpg" alt="The organs of the belly, with deep fat packed around them" width={900} height={900} sizes="260px" placeholder="blur" blurDataURL={BLUR["/img/bellyfat_deep.jpg"]} style={{ objectFit: "cover", aspectRatio: "1 / 1" }} />
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
        title="Losing fat, anywhere"
        steps={[
          { t: "Lift twice a week.", d: "Any muscle-strengthening work on 2 or more days, as the WHO advises." },
          { t: "Move 150 minutes a week, or more.", d: "Moderate movement: brisk walking counts." },
          { t: "Eat and drink a little less than you use.", d: "That's when your body draws on its stored fat, as the NHS explains." },
          { t: "Measure your waist, not your crunches.", d: "Your waist tells you whether the fat is going." },
        ]}
        more={{ href: "/guides/weight", label: "Weight: the full guide" }}
      />

      <details className={s.science}>
        <summary>
          The science, if you want it <span>{SOURCES.length} sources</span>
        </summary>
        <p>
          A 2022 systematic review and meta-analysis in Human Movement pooled 13 studies with 1,158 people aged 14 to 71 and found no localised fat loss from
          training a body part. In Vispute and colleagues&apos; trial (2011), 24 adults did abdominal exercise for six weeks: abdominal fat and waist size
          didn&apos;t change. Kostek and colleagues (2007) had 104 people train one arm for 12 weeks; MRI found no difference in the fat under the
          skin between the trained and untrained arms.
        </p>
        <p>
          Wewege and colleagues (Sports Medicine, 2022) pooled 58 studies of healthy adults: resistance training reduced body fat percentage, fat mass and
          visceral fat. The WHO recommends 150 to 300 minutes of moderate activity a week for adults, and muscle strengthening on 2 or more days.
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
        <Link href="/tools#waist" className={`card ${s.nextCard}`}>
          <span className={s.nextK}>Check it</span>
          <span className={s.nextT}>Is your waist under half your height?</span>
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

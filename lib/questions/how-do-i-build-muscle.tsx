import Image from "next/image";
import Link from "next/link";
import s from "@/components/topic/topic.module.css";
import { Plan } from "@/components/topic/Plan";
import { Icon } from "@/components/Icons";
import { BLUR } from "@/lib/blur";

export const meta = {
  area: "fitness-strength",
  slug: "how-do-i-build-muscle",
  title: "How do I build muscle?",
  description:
    "Hard sets, at least twice a week, and more of them over time. With every set taken to the last possible rep, light and heavy loads built similar size; heavy built more maximal strength. It works at 90.",
  minutes: 4,
  updated: "3 October 2026",
};

const SOURCES: { t: string; href: string }[] = [
  { t: "Schoenfeld et al. 2017, low- vs high-load training, 21 studies (Journal of Strength and Conditioning Research)", href: "https://doi.org/10.1519/JSC.0000000000002200" },
  { t: "Schoenfeld, Ogborn and Krieger 2016, weekly training volume and muscle growth, 15 studies (Journal of Sports Sciences)", href: "https://doi.org/10.1080/02640414.2016.1210197" },
  { t: "Schoenfeld, Grgić and Krieger 2018, training frequency and muscle growth, 25 studies (Journal of Sports Sciences)", href: "https://doi.org/10.1080/02640414.2018.1555906" },
  { t: "Lamon et al. 2021, one night without sleep and muscle protein building (Physiological Reports)", href: "https://doi.org/10.14814/phy2.14660" },
  { t: "Morton et al. 2018, protein supplements and training, 49 studies (British Journal of Sports Medicine)", href: "https://doi.org/10.1136/bjsports-2017-097608" },
  { t: "Fiatarone et al. 1990, strength training in people aged about 90 (JAMA)", href: "https://doi.org/10.1001/jama.1990.03440220053029" },
  { t: "Peterson, Sen and Gordon 2010, resistance exercise and lean mass after 50 (Medicine & Science in Sports & Exercise)", href: "https://doi.org/10.1249/MSS.0b013e3181eb6265" },
  { t: "WHO Europe, everyday actions for better health: WHO recommendations", href: "https://www.who.int/europe/news-room/fact-sheets/item/everyday-actions-for-better-health-who-recommendations" },
];

const MYTHS: { q: string; v: string; a: string }[] = [
  {
    q: "Heavy weights bulk you up, light ones tone.",
    v: "Not for size",
    a: "Across 21 studies with every set taken to the last possible rep, light and heavy loads built similar muscle. Heavy built more maximal strength.",
  },
  {
    q: "The more protein, the more muscle.",
    v: "Up to a point",
    a: "Across 49 studies, extra protein added about 0.3 kg of fat-free mass. Above about 1.6 grams per kilo a day, there was no further gain.",
  },
  {
    q: "You're too old to build muscle.",
    v: "No",
    a: "In a small study, frail volunteers aged about 90 grew their thigh muscle 9% in 8 weeks of strength training.",
  },
];

export function Body() {
  return (
    <>
      <p className={s.answer}>
        Make your sets hard, <em>at least twice a week,</em> and add more of them over time. Light or heavy, the effort is what builds the size.
      </p>
      <p className={s.meta}>
        {meta.minutes} minute read · Checked against its sources on {meta.updated}
      </p>
      <p className={s.setting}>
        <span>Factory setting</span>Muscle answers hard work at any age. Age slows it. It doesn&apos;t stop it.
      </p>

      <h2 className={s.sectionH}>
        Three things <span className="serif">to know.</span>
      </h2>

      <div className={s.suspect}>
        <div>
          <span className={s.num}>1</span>
          <h3 className={s.suspectH}>Light and heavy both build size.</h3>
          <p className={s.suspectP}>
            In 21 studies, with every set taken to the last possible rep, light and heavy loads built <b>similar muscle.</b> Heavy loads won on
            maximal strength.
          </p>
        </div>
        <div className={s.visual}>
          <Image src="/img/muscle_loads.jpg" alt="Two muscle cross-sections the same size, one trained light, one heavy; the heavy strength bar is taller" width={900} height={900} sizes="260px" placeholder="blur" blurDataURL={BLUR["/img/muscle_loads.jpg"]} style={{ objectFit: "cover", aspectRatio: "1 / 1" }} />
        </div>
      </div>

      <div className={s.suspect}>
        <div>
          <span className={s.num}>2</span>
          <h3 className={s.suspectH}>Count your sets, not your sessions.</h3>
          <p className={s.suspectP}>
            Across 15 studies, more weekly sets per muscle went with <b>more growth,</b> in the range tested. With the weekly sets kept equal,
            how often you trained made no real difference across 25 studies.
          </p>
        </div>
        <div className={s.visual}>
          <Image src="/img/muscle_sets.jpg" alt="A chalkboard of weekly sets per muscle: under 5, 5 to 9, 10 or more, each with a bigger muscle section" width={900} height={900} sizes="260px" placeholder="blur" blurDataURL={BLUR["/img/muscle_sets.jpg"]} style={{ objectFit: "cover", aspectRatio: "1 / 1" }} />
        </div>
      </div>

      <div className={s.suspect}>
        <div>
          <span className={s.num}>3</span>
          <h3 className={s.suspectH}>It works at 90.</h3>
          <p className={s.suspectP}>
            In a small study, 10 frail volunteers aged about 90 trained hard for 8 weeks. Their thigh muscle grew <b>9%.</b> In a review of 49
            studies of people over 50, resistance exercise added lean mass, a little less with older age.
          </p>
        </div>
        <div className={s.visual}>
          <Image src="/img/muscle_ninety.jpg" alt="A skeleton on a leg-extension bench, a walking stick beside it, a thigh muscle section on a stand" width={900} height={900} sizes="260px" placeholder="blur" blurDataURL={BLUR["/img/muscle_ninety.jpg"]} style={{ objectFit: "cover", aspectRatio: "1 / 1" }} />
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
        title="The WHO minimum, and what the studies add"
        steps={[
          { t: "Do strength work twice a week.", d: "The WHO minimum for adults: muscle-strengthening activities at least 2 times a week." },
          { t: "Make each set hard.", d: "In the studies where light and heavy loads matched, every set went to the last possible rep." },
          { t: "Add sets over time.", d: "More weekly sets per muscle went with more growth, in the range the studies tested." },
          { t: "Sleep, and eat your protein.", d: "One sleepless night cut muscle protein building by 18% in a small trial. Extra protein helped, up to about 1.6 g per kilo a day." },
        ]}
      />

      <div className={s.doctor}>
        <h3>Over 65?</h3>
        <p>
          The WHO recommends the same as for other adults, with added focus on balance and strength training to prevent falls.
        </p>
      </div>

      <details className={s.science}>
        <summary>
          The science, if you want it <span>{SOURCES.length} sources</span>
        </summary>
        <p>
          Schoenfeld and colleagues (2017) pooled 21 studies lasting at least 6 weeks in which all sets were performed to momentary muscular
          failure. One-repetition maximum strength gains favoured high loads; muscle growth was similar across a spectrum of loads.
        </p>
        <p>
          Schoenfeld, Ogborn and Krieger (2016) pooled 34 treatment groups from 15 studies and found a graded dose-response: more weekly
          sets, more growth. Comparing bands of under 5, 5 to 9 and 10 or more sets per muscle showed only a trend (P = 0.074). Schoenfeld,
          Grgić and Krieger (2018) pooled 25 studies: with volume equated, training a muscle more or less often made no significant or
          meaningful difference to growth.
        </p>
        <p>
          Lamon and colleagues (2021) kept 13 healthy young adults awake for one night in a randomised cross-over trial: muscle protein
          synthesis the next afternoon was 18% lower. Morton and colleagues (2018) pooled 49 studies with 1,863 people: protein supplements
          added about 0.3 kg of fat-free mass, with no further gains above about 1.62 g per kilo a day.
        </p>
        <p>
          Fiatarone and colleagues (1990) gave 10 frail, institutionalised volunteers aged about 90 eight weeks of high-intensity training:
          mid-thigh muscle area rose 9.0%, and strength 174% in the 9 who finished; the abstract describes no control group. Peterson, Sen
          and Gordon (2010) pooled 49 studies of 1,328 adults aged 50 and over: resistance exercise added 1.1 kg of lean mass on average,
          slightly less with older age. The WHO recommends muscle-strengthening activities at least 2 times a week for adults, and for
          those over 65 the same, with added focus on functional balance and strength training to prevent falls.
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
          <span className={s.nextT}>Your body in motion, in 3D</span>
        </Link>
        <Link href="/fitness-strength/what-does-creatine-do" className={`card ${s.nextCard}`}>
          <span className={s.nextK}>Next question</span>
          <span className={s.nextT}>
            What does creatine do? <Icon name="arrow" size={15} style={{ display: "inline", verticalAlign: "-2px" }} />
          </span>
        </Link>
      </div>
    </>
  );
}

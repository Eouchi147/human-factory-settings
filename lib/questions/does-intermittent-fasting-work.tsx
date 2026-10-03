import Image from "next/image";
import Link from "next/link";
import s from "@/components/topic/topic.module.css";
import { Plan } from "@/components/topic/Plan";
import { Icon } from "@/components/Icons";
import { BLUR } from "@/lib/blur";

export const meta = {
  area: "weight-food",
  slug: "does-intermittent-fasting-work",
  title: "Does intermittent fasting work?",
  description:
    "About as well as a diet, because it is one. In trials, eating within a time window didn't beat three meals a day or plain calorie cutting. Across 99 trials, every style beat eating freely. Not for pregnancy or a history of eating disorders.",
  minutes: 4,
  updated: "3 October 2026",
};

const SOURCES: { t: string; href: string }[] = [
  { t: "Lowe et al. 2020, time-restricted eating and weight loss: the TREAT trial (JAMA Internal Medicine)", href: "https://pmc.ncbi.nlm.nih.gov/articles/PMC7522780/" },
  { t: "Liu et al. 2022, calorie restriction with or without time-restricted eating (New England Journal of Medicine)", href: "https://doi.org/10.1056/NEJMoa2114833" },
  { t: "Semnani-Azad et al. 2025, intermittent fasting strategies: 99 trials (BMJ)", href: "https://doi.org/10.1136/bmj-2024-082007" },
  { t: "Garegnani et al. 2026, intermittent fasting for adults with overweight or obesity (Cochrane review)", href: "https://doi.org/10.1002/14651858.CD015610.pub2" },
  { t: "American Heart Association newsroom, 8-hour time-restricted eating and cardiovascular death (2024, a conference abstract)", href: "https://newsroom.heart.org/news/8-hour-time-restricted-eating-linked-to-a-91-higher-risk-of-cardiovascular-death" },
  { t: "Science Media Centre, expert reaction to that abstract (2024)", href: "https://www.sciencemediacentre.org/expert-reaction-to-conference-abstract-about-time-restricted-eating-and-cardiovascular-death/" },
  { t: "NHS London (MyHealth London), intermittent fasting", href: "https://www.myhealthlondon.nhs.uk/be-healthier/lose-weight/which-diet-is-right-for-me/intermittent-fasting/" },
];

const MYTHS: { q: string; v: string; a: string }[] = [
  {
    q: "The window burns fat on its own.",
    v: "Not supported",
    a: "In a 12-week trial, eating only from noon to 8 pm did no better than three meals a day. The calories people ate were no different either.",
  },
  {
    q: "An 8-hour eating window raises your risk of dying of heart disease by 91%.",
    v: "Not shown",
    a: "That came from a conference abstract, not peer reviewed, built on two days of eating that people recalled from memory. A link, not proof.",
  },
  {
    q: "Fasting beats any other diet.",
    v: "Mostly a tie",
    a: "Across 99 trials, every style of fasting beat eating freely. Against ordinary calorie cutting, only alternate-day fasting showed a small edge.",
  },
];

export function Body() {
  return (
    <>
      <p className={s.answer}>
        About as well as a diet, <em>because it is one.</em> In trials, eating only within a time window didn&apos;t beat three meals a day, or plain
        calorie cutting.
      </p>
      <p className={s.meta}>
        {meta.minutes} minute read · Checked against its sources on {meta.updated}
      </p>
      <p className={s.setting}>
        <span>Factory setting</span>Eating through the day. In a 12-week trial, three meals a day did as well as an 8-hour eating window.
      </p>

      <h2 className={s.sectionH}>
        Three things <span className="serif">to know.</span>
      </h2>

      <div className={s.suspect}>
        <div>
          <span className={s.num}>1</span>
          <h3 className={s.suspectH}>The clock alone didn&apos;t beat three meals.</h3>
          <p className={s.suspectP}>
            In a 12-week trial of 116 adults, people ate only from noon to 8 pm, with no calorie target. They did <b>no better</b> than people eating
            three meals a day, and ate no fewer calories.
          </p>
        </div>
        <div className={s.visual}>
          <Image src="/img/if_clock.jpg" alt="A plate that is a clock, a fork and a knife for hands, the eating window lit from noon to eight" width={900} height={900} sizes="260px" placeholder="blur" blurDataURL={BLUR["/img/if_clock.jpg"]} style={{ objectFit: "cover", aspectRatio: "1 / 1" }} />
        </div>
      </div>

      <div className={s.suspect}>
        <div>
          <span className={s.num}>2</span>
          <h3 className={s.suspectH}>Same calories, same result.</h3>
          <p className={s.suspectP}>
            In a year-long trial of 139 adults, both groups had the same calorie limit, and one also ate only from 8 am to 4 pm. The difference in weight
            was <b>not significant.</b>
          </p>
        </div>
        <div className={s.visual}>
          <Image src="/img/if_balance.jpg" alt="A beam balance, level: an eating window with a calorie limit against the calorie limit alone" width={900} height={900} sizes="260px" placeholder="blur" blurDataURL={BLUR["/img/if_balance.jpg"]} style={{ objectFit: "cover", aspectRatio: "1 / 1" }} />
        </div>
      </div>

      <div className={s.suspect}>
        <div>
          <span className={s.num}>3</span>
          <h3 className={s.suspectH}>The 91% heart scare was thin.</h3>
          <p className={s.suspectP}>
            It came from a conference abstract that wasn&apos;t peer reviewed. Eating times came from <b>two days, recalled from memory.</b> It found a
            link, not proof.
          </p>
        </div>
        <div className={s.visual}>
          <Image src="/img/if_paper.jpg" alt="A newspaper headline about the 91% risk, stamped conference abstract, not peer reviewed, and a link, not proof" width={900} height={900} sizes="260px" placeholder="blur" blurDataURL={BLUR["/img/if_paper.jpg"]} style={{ objectFit: "cover", aspectRatio: "1 / 1" }} />
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
        Before you try it, <span className="serif">check this.</span>
      </h2>
      <Plan
        title="Four checks"
        steps={[
          { t: "Pregnant or breastfeeding?", d: "The NHS says not to try intermittent fasting." },
          { t: "A history of eating disorders?", d: "Don't try it, and don't delay or skip meals." },
          { t: "Diabetes?", d: "Don't delay or skip meals." },
          { t: "On medication?", d: "Tell your GP practice team before you change how you eat." },
        ]}
      />

      <div className={s.doctor}>
        <h3>Who should not try it</h3>
        <p>
          NHS London says people with a history of eating disorders such as anorexia or bulimia, and pregnant or breastfeeding women, should not try
          intermittent fasting; never delay or skip meals if you&apos;re pregnant, have had or are prone to eating disorders, or have diabetes; and if
          you&apos;re on medication, tell your GP practice team when you change your diet.
        </p>
      </div>

      <details className={s.science}>
        <summary>
          The science, if you want it <span>{SOURCES.length} sources</span>
        </summary>
        <p>
          Lowe and colleagues (TREAT, JAMA Internal Medicine, 2020) randomised 116 adults with overweight or obesity for 12 weeks: eating freely from
          noon to 8 pm and nothing else, or three structured meals a day. The difference in weight between groups was 0.26 kg (95% CI &minus;1.30 to
          0.78; P = .63), with no difference in estimated energy intake.
        </p>
        <p>
          Liu and colleagues (NEJM, 2022) gave 139 adults with obesity the same calorie-restricted diet for 12 months; one group also ate only between 8
          am and 4 pm. The net difference was &minus;1.8 kg (95% CI &minus;4.0 to 0.4; P = 0.11), not significant. A network meta-analysis of 99
          trials with 6,582 adults (BMJ, 2025) found every intermittent fasting strategy reduced weight compared with eating freely; against continuous
          calorie restriction, only alternate-day fasting showed a benefit (&minus;1.29 kg). A Cochrane review (2026, 22 trials, 1,995 people) found
          little difference against regular dietary advice, over up to 12 months.
        </p>
        <p>
          The 91% figure comes from a 2024 conference abstract of about 20,000 US adults, based on two 24-hour dietary recalls; the American Heart
          Association notes such abstracts are not peer reviewed, and experts pointed out that an observational study can&apos;t show cause.
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
        <Link href="/body/digestion" className={`card ${s.nextCard}`}>
          <span className={s.nextK}>See it</span>
          <span className={s.nextT}>Your digestion, in 3D</span>
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

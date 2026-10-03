import Image from "next/image";
import Link from "next/link";
import s from "@/components/topic/topic.module.css";
import { Plan } from "@/components/topic/Plan";
import { Icon } from "@/components/Icons";
import { BLUR } from "@/lib/blur";

export const meta = {
  area: "stress-mood",
  slug: "breathing-to-calm-down",
  title: "Can breathing calm you down?",
  description:
    "A little. Across 12 trials, breathing exercises cut stress by a small to medium amount. In one month-long trial, five minutes a day of sighing on purpose lifted mood more than meditation. Skip hard, fast drills.",
  minutes: 4,
  updated: "3 October 2026",
};

const SOURCES: { t: string; href: string }[] = [
  { t: "Fincham et al. 2023, breathwork and stress: 12 randomised trials (Scientific Reports)", href: "https://www.nature.com/articles/s41598-022-27247-y" },
  { t: "Balban et al. 2023, brief structured breathing practices and mood (Cell Reports Medicine)", href: "https://doi.org/10.1016/j.xcrm.2022.100895" },
  { t: "Birdee et al. 2023, slow breathing and a longer out-breath: a 12-week trial (Complementary Therapies in Medicine)", href: "https://doi.org/10.1016/j.ctim.2023.102937" },
  { t: "Lehrer and Gevirtz 2014, heart rate variability biofeedback (Frontiers in Psychology)", href: "https://www.frontiersin.org/articles/10.3389/fpsyg.2014.00756/full" },
  { t: "Li et al. 2016, the brain circuit for sighing (Nature)", href: "https://www.nature.com/articles/nature16964" },
  { t: "Severs, Vlemincx and Ramirez 2022, the psychophysiology of the sigh (Biological Psychology)", href: "https://research.vu.nl/en/publications/the-psychophysiology-of-the-sigh-i-the-sigh-from-the-physiologica/" },
  { t: "UCLA Health, where the sighing reflex starts (2016)", href: "https://www.uclahealth.org/news/release/ucla-and-stanford-researchers-pinpoint-origin-of-sighing-reflex-in-the-brain" },
  { t: "Cleveland Clinic, vital signs", href: "https://my.clevelandclinic.org/health/articles/10881-vital-signs" },
  { t: "MedlinePlus, hyperventilation", href: "https://medlineplus.gov/ency/article/003071.htm" },
  { t: "CDC, drowning and dangerous underwater breath-holding, New York State (MMWR, 2015)", href: "https://www.cdc.gov/mmwr/preview/mmwrhtml/mm6419a3.htm" },
  { t: "NHS, stress", href: "https://www.nhs.uk/mental-health/feelings-symptoms-behaviours/feelings-and-symptoms/stress/" },
];

const MYTHS: { q: string; v: string; a: string }[] = [
  {
    q: "The secret is a longer breath out.",
    v: "Not supported",
    a: "In a 12-week trial of 100 healthy adults, breathing out for longer than you breathe in didn't cut stress more than equal breaths.",
  },
  {
    q: "Breathwork cures stress.",
    v: "Overstated",
    a: "Across 12 trials, the effect was small to medium. The review's authors warned that the hype has run ahead of the evidence.",
  },
  {
    q: "Fast, hard breathing drills are harmless.",
    v: "Not true",
    a: "Breathing too fast drops the carbon dioxide in your blood, which can make you light-headed and dizzy. Before swimming underwater, it can make you pass out.",
  },
];

export function Body() {
  return (
    <>
      <p className={s.answer}>
        A little, yes. Across 12 trials, breathing exercises cut stress by <em>a small to medium amount.</em> In one trial, five minutes a day of sighing
        on purpose, two breaths in and one long breath out, lifted mood more than meditation did.
      </p>
      <p className={s.meta}>
        {meta.minutes} minute read · Checked against its sources on {meta.updated}
      </p>
      <p className={s.setting}>
        <span>Factory setting</span>About 12 to 18 breaths a minute at rest, and a sigh every few minutes, without trying.
      </p>

      <h2 className={s.sectionH}>
        Three things <span className="serif">to know.</span>
      </h2>

      <div className={s.suspect}>
        <div>
          <span className={s.num}>1</span>
          <h3 className={s.suspectH}>Your heart already follows your breath.</h3>
          <p className={s.suspectP}>
            Breathe in and your heart rate rises a little; breathe out and it falls. It&apos;s called respiratory sinus arrhythmia, and it&apos;s{" "}
            <b>built in.</b> Slow breathing works with it.
          </p>
        </div>
        <div className={s.visual}>
          <Image src="/img/breath_heart.jpg" alt="A skeleton's chest seen from the front: glass lungs around the airways and the heart between them" width={900} height={900} sizes="260px" placeholder="blur" blurDataURL={BLUR["/img/breath_heart.jpg"]} style={{ objectFit: "cover", aspectRatio: "1 / 1" }} />
        </div>
      </div>

      <div className={s.suspect}>
        <div>
          <span className={s.num}>2</span>
          <h3 className={s.suspectH}>You already sigh every few minutes.</h3>
          <p className={s.suspectP}>
            A sigh is a second breath taken on top of the first. Your body does it on its own, every few minutes, to <b>reopen tiny air sacs</b> in your
            lungs that fold shut.
          </p>
        </div>
        <div className={s.visual}>
          <Image src="/img/breath_sacs.jpg" alt="A cluster of air sacs at the end of a small airway, shown a hundred times life size under a bell jar" width={900} height={900} sizes="260px" placeholder="blur" blurDataURL={BLUR["/img/breath_sacs.jpg"]} style={{ objectFit: "cover", aspectRatio: "1 / 1" }} />
        </div>
      </div>

      <div className={s.suspect}>
        <div>
          <span className={s.num}>3</span>
          <h3 className={s.suspectH}>Sighing on purpose lifted mood, a little.</h3>
          <p className={s.suspectP}>
            In a Stanford trial, 108 people, mostly students, did five minutes a day of breathing or meditation for a month. Cyclic sighing lifted good mood
            more than meditation; anxiety fell about the same. <b>There was no do-nothing group</b> to compare with.
          </p>
        </div>
        <div className={s.visual}>
          <Image src="/img/breath_trial.jpg" alt="The trial's groups as rows of white dots on a black plinth, and an empty fifth place labelled do nothing, 0 people" width={900} height={900} sizes="260px" placeholder="blur" blurDataURL={BLUR["/img/breath_trial.jpg"]} style={{ objectFit: "cover", aspectRatio: "1 / 1" }} />
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
        title="Cyclic sighing, as in the trial"
        steps={[
          { t: "Breathe in slowly through your nose.", d: "When your lungs feel full, breathe in once more, to fill them." },
          { t: "Then one long breath out, through your mouth.", d: "Slowly, until it's all out. Through your nose is fine too." },
          { t: "Keep going for five minutes.", d: "The trial did it once a day, for a month." },
          { t: "Skip fast, hard drills.", d: "Never do them in or near water." },
        ]}
      />

      <div className={s.doctor}>
        <h3>When it&apos;s time to see a doctor</h3>
        <p>
          The NHS says to see a GP if you&apos;re struggling to cope with stress, or if the things you&apos;re trying yourself aren&apos;t helping.
        </p>
      </div>

      <details className={s.science}>
        <summary>
          The science, if you want it <span>{SOURCES.length} sources</span>
        </summary>
        <p>
          Fincham and colleagues (Scientific Reports, 2023) pooled 12 randomised trials with 785 adults: breathwork lowered self-reported stress by an
          effect size of g = &minus;0.35 (95% CI &minus;0.55 to &minus;0.14), which they call small to medium.
        </p>
        <p>
          Balban and colleagues (Cell Reports Medicine, 2023) randomised 108 people, most from an undergraduate psychology class at Stanford, to five
          minutes a day for 28 days of cyclic sighing, box breathing, fast breathing with breath holds, or mindfulness meditation. Cyclic sighing raised
          positive mood more than meditation; anxiety and negative mood fell with no difference between the groups. No group went without a practice.
          Birdee and colleagues (2023) randomised 100 healthy adults for 12 weeks and found that the ratio of breath in to breath out made no significant
          difference to stress.
        </p>
        <p>
          Heart rate rises on the in-breath and falls on the out-breath: respiratory sinus arrhythmia (Lehrer and Gevirtz, 2014). Sighs happen on their own
          every few minutes to reinflate the lungs&apos; air sacs (Li and colleagues, Nature, 2016) and help keep them from collapsing (Severs and
          colleagues, 2022). Breathing too fast lowers the carbon dioxide in the blood, the cause of the light-headedness and dizziness (MedlinePlus), and a
          CDC report links hyperventilating and holding the breath before swimming underwater to swimmers losing consciousness.
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

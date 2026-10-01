import Image from "next/image";
import Link from "next/link";
import s from "@/components/topic/topic.module.css";
import { ClockRing, HalfLifeChart } from "@/components/SleepViz";
import { TonightPlan } from "@/components/topic/TonightPlan";
import { Icon } from "@/components/Icons";
import { BLUR } from "@/lib/blur";

export const meta = {
  area: "sleep-energy",
  slug: "why-am-i-always-tired",
  title: "Why am I always tired?",
  description: "Three things to check first: short sleep, late coffee and late light. What each does inside you, your plan for tonight, and when to see a doctor.",
  minutes: 3,
  updated: "30 September 2026",
};

const SOURCES: { t: string; href: string }[] = [
  { t: "America's Health Rankings (CDC data): adults sleeping under 7 hours", href: "https://americashealthrankings.org/explore/measures/sleep" },
  { t: "Reichert, Deboer and Landolt 2022, adenosine, caffeine and sleep-wake regulation", href: "https://doi.org/10.1111/jsr.13597" },
  { t: "Porkka-Heiskanen et al. 1997, adenosine and sleepiness (in cats)", href: "https://doi.org/10.1126/science.276.5316.1265" },
  { t: "Institute of Medicine 2001, how the body handles caffeine", href: "https://www.ncbi.nlm.nih.gov/books/NBK223808/" },
  { t: "Gardiner et al. 2023, review of 24 studies on caffeine and sleep", href: "https://doi.org/10.1016/j.smrv.2023.101764" },
  { t: "Drake et al. 2013, caffeine 0, 3 or 6 hours before bed", href: "https://doi.org/10.5664/jcsm.3170" },
  { t: "Gooley et al. 2011, room light before bedtime and melatonin", href: "https://pmc.ncbi.nlm.nih.gov/articles/PMC3047226/" },
  { t: "Chang et al. 2015, reading on light-emitting screens before bed", href: "https://www.psu.edu/news/research/story/light-emitting-e-readers-detrimentally-shift-circadian-clock" },
  { t: "Brown et al. 2022, expert recommendations for evening light", href: "https://journals.plos.org/plosbiology/article?id=10.1371/journal.pbio.3001571" },
  { t: "National Sleep Foundation, signs of good sleep (Ohayon et al. 2017)", href: "https://sleepreviewmag.com/sleep-health/prevailing-attitudes/good-quality-sleep-national-sleep-foundation-provides-guidance/" },
  { t: "MedlinePlus, fatigue: causes and when to see a doctor", href: "https://medlineplus.gov/ency/article/003088.htm" },
];

export function Body() {
  return (
    <>
      <p className={s.answer}>
        Check three things first: <em>short sleep, late coffee and late light.</em> You can fix all three tonight. Still tired after that? See a doctor.
      </p>
      <p className={s.meta}>
        {meta.minutes} minute read · Checked against its sources on {meta.updated}
      </p>

      <h2 className={s.sectionH}>
        Three things <span className="serif">to check.</span>
      </h2>

      <div className={s.suspect}>
        <div>
          <span className={s.num}>1</span>
          <h3 className={s.suspectH}>Short sleep.</h3>
          <p className={s.suspectP}>
            Adults need <b>7 hours or more</b> a night, and about 1 in 3 get less. All day, a chemical called adenosine builds up in your brain and makes you sleepy.
            Sleep is what clears it, so a short night leaves some of it behind.
          </p>
        </div>
        <div className={s.visual}>
          <Image src="/img/sys_brain.jpg" alt="The brain, where the chemical that makes you sleepy builds up" width={780} height={1000} sizes="260px" placeholder="blur" blurDataURL={BLUR["/img/sys_brain.jpg"]} style={{ objectFit: "cover", aspectRatio: "1 / 1" }} />
        </div>
      </div>

      <div className={s.suspect}>
        <div>
          <span className={s.num}>2</span>
          <h3 className={s.suspectH}>Late coffee.</h3>
          <p className={s.suspectP}>
            Coffee doesn&apos;t clear that sleepy chemical; it hides it. Your body gets rid of only <b>half the caffeine in about 5 hours</b>, so a 6 p.m. coffee is
            still half there at 11. A review of 24 studies found a regular coffee should come at least 9 hours before bed so it doesn&apos;t cut into your sleep.
          </p>
        </div>
        <div className={s.visual}>
          <HalfLifeChart start={18} bed={23} />
        </div>
      </div>

      <div className={s.suspect}>
        <div>
          <span className={s.num}>3</span>
          <h3 className={s.suspectH}>Late light.</h3>
          <p className={s.suspectP}>
            A clock in your brain decides when you feel sleepy, and it runs mostly on <b>light and dark</b>. In the evening it releases melatonin, the hormone that
            tells your body it&apos;s night. Bright light late at night, even ordinary room light, delays it.
          </p>
        </div>
        <div className={s.visual}>
          <ClockRing from={21} to={7} size={230} center="Night" sub="MELATONIN RISES" labels={["9 p.m.", "7 a.m."]} />
        </div>
      </div>

      <h2 className={s.sectionH}>
        Tonight, <span className="serif">try this.</span>
      </h2>
      <TonightPlan />

      <div className={s.doctor}>
        <h3>When it&apos;s time to see a doctor</h3>
        <p>
          See a doctor if you&apos;re still tired after fixing your sleep, coffee and evening light. Tiredness can come from things like low iron (anaemia), thyroid
          problems, sleep apnoea or depression, which are all treatable.
        </p>
        <p>
          Loud snoring, or someone seeing you stop breathing in your sleep, can be a sign of sleep apnoea. Get help straight away if you feel confused or dizzy, or
          have thoughts of harming yourself.
        </p>
      </div>

      <details className={s.science}>
        <summary>
          The science, if you want it <span>{SOURCES.length} sources</span>
        </summary>
        <p>
          Sleepiness is driven by two systems. Sleep pressure rises the longer you&apos;re awake and drains while you sleep; adenosine, a by-product of your brain&apos;s
          energy use, is one of its best-studied signals. A master clock in the brain times the other system to roughly 24 hours, driven mainly by light and dark.
        </p>
        <p>
          Caffeine blocks adenosine&apos;s receptors without switching them on. Its half-life averages about 5 hours but ranges from 1.5 to 9.5 hours between people. A
          2023 review of 24 studies found caffeine cut total sleep by about 45 minutes on average, and worked out that a regular coffee (107 mg) should be drunk at
          least 8.8 hours before bed to avoid that. In one small study, 400 mg (about four cups) taken even 6 hours before bed cut sleep by more than an hour.
        </p>
        <p>
          Ordinary room light in the 8 hours before bed delayed the start of melatonin in 99% of people and shortened it by about 90 minutes. Reading on a
          light-emitting tablet before bed delayed the body clock and made falling asleep about 10 minutes slower than reading a printed book. Expert
          recommendations say to keep evening light low for at least 3 hours before bed.
        </p>
        <p>
          The plan gives you 8 hours in bed because good sleep means falling asleep within 30 minutes and spending no more than 20 minutes awake in the night, which
          still leaves 7 hours of sleep.
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
        <Link href="/tools#caffeine" className={`card ${s.nextCard}`}>
          <span className={s.nextK}>Try it</span>
          <span className={s.nextT}>How much caffeine is still in you at bedtime?</span>
        </Link>
        <Link href="/stories/why-you-wake-up-tired" className={`card ${s.nextCard}`}>
          <span className={s.nextK}>Go deeper</span>
          <span className={s.nextT}>
            The full story, step by step <Icon name="arrow" size={15} style={{ display: "inline", verticalAlign: "-2px" }} />
          </span>
        </Link>
      </div>
    </>
  );
}

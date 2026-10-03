import Image from "next/image";
import Link from "next/link";
import s from "@/components/topic/topic.module.css";
import { StatFigure } from "@/components/topic/Figures";
import { Plan } from "@/components/topic/Plan";
import { Icon } from "@/components/Icons";
import { BLUR } from "@/lib/blur";

export const meta = {
  area: "sleep-energy",
  slug: "how-to-fall-asleep-faster",
  title: "How can I fall asleep faster?",
  description:
    "Normal is about 10 to 20 minutes. What's been measured: caffeine adds about 9 minutes, a warm bath 1 to 2 hours before bed helps, trying hard backfires, and getting up after 20 minutes awake is part of the best-tested treatment.",
  minutes: 5,
  updated: "3 October 2026",
};

const SOURCES: { t: string; href: string }[] = [
  { t: "Cleveland Clinic, how long should it take you to fall asleep? (2026)", href: "https://newsroom.clevelandclinic.org/2026/06/22/how-long-should-it-take-you-to-fall-asleep" },
  { t: "Gardiner et al. 2023, the effect of caffeine on sleep: 24 studies (Sleep Medicine Reviews)", href: "https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=DOI:10.1016/j.smrv.2023.101764&format=json&resultType=core" },
  { t: "NHS, insomnia", href: "https://www.nhs.uk/conditions/insomnia/" },
  { t: "Haghayegh et al. 2019, a warm shower or bath before bed: 17 studies (Sleep Medicine Reviews)", href: "https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=DOI:10.1016/j.smrv.2019.04.008&format=json&resultType=core" },
  { t: "Ansfield, Wegner and Bowser 1996, ironic effects of sleep urgency (Behaviour Research and Therapy)", href: "https://dtg.sites.fas.harvard.edu/DANWEGNER/pub/Ansfield,%20Wegner,%20&%20Bowser%201996.pdf" },
  { t: "American Academy of Sleep Medicine, healthy sleep habits", href: "https://sleepeducation.org/healthy-sleep/healthy-sleep-habits/" },
  { t: "Trauer et al. 2015, CBT for chronic insomnia: 20 trials (Annals of Internal Medicine)", href: "https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=DOI:10.7326/M14-2841&format=json&resultType=core" },
  { t: "Edinger et al. 2021, AASM guideline on behavioural treatments for chronic insomnia", href: "https://pmc.ncbi.nlm.nih.gov/articles/PMC7853203/" },
  { t: "American Academy of Sleep Medicine, insomnia", href: "https://sleepeducation.org/sleep-disorders/insomnia/" },
  { t: "Ebrahim et al. 2013, alcohol and sleep (Alcoholism: Clinical and Experimental Research)", href: "https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=DOI:10.1111/acer.12006&format=json&resultType=core" },
  { t: "The New Daily, the claim behind the two-minute \"military method\" (2023)", href: "https://www.thenewdaily.com.au/life/2023/07/08/want-to-fall-asleep-in-two-minutes" },
];

const MYTHS: { q: string; v: string; a: string }[] = [
  {
    q: "Falling asleep the second your head hits the pillow is a good sign.",
    v: "Not supported",
    a: "Normal is about 10 to 20 minutes. A sleep medicine specialist at the Cleveland Clinic says dropping off within a minute may mean you're short on sleep.",
  },
  {
    q: "The \"military method\" puts you to sleep in two minutes.",
    v: "Not supported",
    a: "No trial has tested it. The 96% success figure is its inventor's own claim. Relaxing your body is a real part of insomnia treatment, but not a two-minute switch.",
  },
  {
    q: "A drink before bed helps you sleep.",
    v: "Half true",
    a: "Alcohol does help people fall asleep faster, at every dose studied. Then it disrupts the second half of the night.",
  },
];

export function Body() {
  return (
    <>
      <p className={s.answer}>
        Normal is about <em>10 to 20 minutes.</em> What&apos;s been measured to help: no caffeine late in the day, a warm bath or shower 1 to 2 hours before bed,
        not forcing it, and getting up if you&apos;re still awake after 20 minutes.
      </p>
      <p className={s.meta}>
        {meta.minutes} minute read · Checked against its sources on {meta.updated}
      </p>
      <p className={s.setting}>
        <span>Factory setting</span>About 10 to 20 minutes from lights out to asleep.
      </p>

      <h2 className={s.sectionH}>
        Three things <span className="serif">to know.</span>
      </h2>

      <div className={s.suspect}>
        <div>
          <span className={s.num}>1</span>
          <h3 className={s.suspectH}>Caffeine costs you twice.</h3>
          <p className={s.suspectP}>
            Across 24 studies, caffeine added about 9 minutes to falling asleep and cut about <b>45 minutes of sleep.</b> For a regular cup of coffee, the review
            put the cut-off at about 8.8 hours before bed. The NHS says to stop 6 hours before.
          </p>
        </div>
        <div className={s.visual}>
          <StatFigure
            stats={[
              { value: "+9 min", label: "to fall asleep", tone: "ink" },
              { value: "−45 min", label: "of sleep", tone: "ink" },
            ]}
            source="Gardiner et al. 2023, 24 studies"
          />
        </div>
      </div>

      <div className={s.suspect}>
        <div>
          <span className={s.num}>2</span>
          <h3 className={s.suspectH}>Trying hard can backfire.</h3>
          <p className={s.suspectP}>
            Students told to fall asleep as fast as they could, with marches playing, reported 34 minutes. Those who didn&apos;t try: 22. With calm music, trying
            worked. <b>A busy head plus effort</b> is what goes wrong.
          </p>
        </div>
        <div className={s.visual}>
          <Image src="/img/sleep_bed.jpg" alt="A skeleton lying awake in bed at night, seen from above, the bedside clock and a timer beside it" width={900} height={900} sizes="260px" placeholder="blur" blurDataURL={BLUR["/img/sleep_bed.jpg"]} style={{ objectFit: "cover", aspectRatio: "1 / 1" }} />
        </div>
      </div>

      <div className={s.suspect}>
        <div>
          <span className={s.num}>3</span>
          <h3 className={s.suspectH}>If you can&apos;t sleep, get up.</h3>
          <p className={s.suspectP}>
            Sleep doctors advise: not asleep after 20 minutes, get out of bed, do something quiet away from screens, and go back when you&apos;re sleepy. It&apos;s
            part of CBT for insomnia, the first-line treatment, which made people with insomnia fall asleep <b>about 19 minutes faster</b> across 20 trials.
          </p>
        </div>
        <div className={s.visual}>
          <Image src="/img/sleep_read.jpg" alt="A skeleton sitting on the edge of its bed, reading a book by a dim lamp" width={900} height={900} sizes="260px" placeholder="blur" blurDataURL={BLUR["/img/sleep_read.jpg"]} style={{ objectFit: "cover", aspectRatio: "1 / 1" }} />
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
        Tonight, <span className="serif">try this.</span>
      </h2>
      <Plan
        title="Falling asleep"
        steps={[
          { t: "Last coffee 6 to 9 hours before bed.", d: "The NHS says 6; one review's estimate for a regular cup is 8.8." },
          { t: "A warm bath or shower, 1 to 2 hours before bed.", d: "Even 10 minutes, in water at 40 to 42.5 °C, shortened the time to fall asleep in studies." },
          { t: "Don't force it.", d: "Lie back and let sleep come. Effort plus a busy head made it slower." },
          { t: "Still awake after 20 minutes? Get up.", d: "Something quiet, dim and away from screens. Back to bed when you're sleepy." },
        ]}
        more={{ href: "/feel-better/sleep-and-caffeine", label: "Your 7-day sleep and caffeine plan" }}
      />

      <div className={s.doctor}>
        <h3>When it&apos;s time to see a doctor</h3>
        <p>
          Taking more than 30 minutes to fall asleep, at least three nights a week, for at least three months? That may be chronic insomnia. The NHS says to see a
          GP if changing your sleeping habits hasn&apos;t helped, if you&apos;ve had trouble sleeping for months, or if it&apos;s affecting your daily life in a
          way that makes it hard to cope.
        </p>
      </div>

      <details className={s.science}>
        <summary>
          The science, if you want it <span>{SOURCES.length} sources</span>
        </summary>
        <p>
          Gardiner and colleagues (2023) pooled 24 studies of healthy adults: caffeine lengthened sleep onset by 9.1 minutes and shortened total sleep by 45.3
          minutes. Their model suggests a standard coffee (107 mg per 250 ml) be drunk at least 8.8 hours before bed; dose matters, and the NHS advice is 6 hours.
        </p>
        <p>
          Haghayegh and colleagues (2019) reviewed 17 studies of warm baths or showers at 40 to 42.5 °C: taken 1 to 2 hours before bed, even for 10 minutes,
          they shortened the time to fall asleep. In Ansfield, Wegner and Bowser&apos;s 1996 experiment, normal sleepers who tried to fall asleep quickly while
          listening to Sousa marches reported 34.4 minutes against 21.8 for those not trying; with calm music, trying helped (15.6 against 29.3). The times were
          self-reported.
        </p>
        <p>
          The AASM&apos;s public advice is to get out of bed after 20 minutes awake; its 2021 guideline gives CBT for insomnia, which includes stimulus control,
          its strongest recommendation. In Trauer and colleagues&apos; review of 20 trials (1,162 people with chronic insomnia), CBT shortened the time to fall
          asleep by 19 minutes on average. Chronic insomnia means trouble at least three nights a week for at least three months; insomnia also involves daytime
          symptoms.
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
        <Link href="/feel-better/sleep-and-caffeine" className={`card ${s.nextCard}`}>
          <span className={s.nextK}>Try it</span>
          <span className={s.nextT}>Your 7-day sleep and caffeine plan</span>
        </Link>
        <Link href="/sleep-energy/why-am-i-always-tired" className={`card ${s.nextCard}`}>
          <span className={s.nextK}>Next question</span>
          <span className={s.nextT}>
            Why am I always tired? <Icon name="arrow" size={15} style={{ display: "inline", verticalAlign: "-2px" }} />
          </span>
        </Link>
      </div>
    </>
  );
}

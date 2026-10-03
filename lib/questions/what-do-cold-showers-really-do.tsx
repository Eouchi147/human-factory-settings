import Image from "next/image";
import Link from "next/link";
import s from "@/components/topic/topic.module.css";
import { Plan } from "@/components/topic/Plan";
import { Icon } from "@/components/Icons";
import { BLUR } from "@/lib/blur";

export const meta = {
  area: "stress-mood",
  slug: "what-do-cold-showers-really-do",
  title: "What do cold showers really do?",
  description:
    "In the biggest trial, people who ended their shower cold reported 29% fewer days off sick, but no fewer days feeling ill. Reviews found no proof of an immune boost or a better mood. Cold shock is real: with a heart condition, ask your doctor first.",
  minutes: 4,
  updated: "3 October 2026",
};

const SOURCES: { t: string; href: string }[] = [
  { t: "Buijze et al. 2016, the effect of cold showering on health and work: a randomised trial (PLOS ONE)", href: "https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0161749" },
  { t: "Cain et al. 2025, cold-water immersion and health and wellbeing: a review of 11 trials (PLOS ONE)", href: "https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0317615" },
  { t: "Roberts et al. 2015, cold water after strength training and muscle adaptation (Journal of Physiology, repository copy)", href: "https://nih.brage.unit.no/nih-xmlui/handle/11250/2402781?show=full" },
  { t: "Piñero et al. 2024, cold water after training and muscle growth: a review of 8 studies (European Journal of Sport Science)", href: "https://rgu-repository.worktribe.com/output/2173897" },
  { t: "Yoneshiro et al. 2013, recruited brown fat in humans (Journal of Clinical Investigation, PDF)", href: "https://www.jci.org/articles/view/67803/files/pdf" },
  { t: "RNLI, the dangers of cold water shock", href: "https://rnli.org/safety/know-the-risks/cold-water-shock" },
  { t: "Cleveland Clinic 2026, are cold plunge ice baths good for you?", href: "https://health.clevelandclinic.org/what-to-know-about-cold-plunges" },
  { t: "British Heart Foundation 2023, cold water swimming: is it bad for your heart?", href: "https://www.bhf.org.uk/informationsupport/heart-matters-magazine/activity/cold-water-swimming" },
];

const MYTHS: { q: string; v: string; a: string }[] = [
  {
    q: "Cold showers boost your immune system.",
    v: "No proof",
    a: "A 2025 review of 11 trials found no measurable effect on immune function. The one shower trial counted days off sick, self-reported.",
  },
  {
    q: "Cold showers burn fat.",
    v: "Not shown",
    a: "In one small trial, 12 young men lost about 0.7 kg of fat in 6 weeks, after 2 hours at 17 °C every day. Not a shower.",
  },
  {
    q: "An ice bath after the gym helps you grow.",
    v: "The opposite",
    a: "In trials, sitting in cold water straight after training may blunt muscle growth.",
  },
];

export function Body() {
  return (
    <>
      <p className={s.answer}>
        Less than claimed. In the biggest trial, <em>fewer days off sick, but no fewer days ill.</em> No proof of an immune boost or a
        better mood.
      </p>
      <p className={s.meta}>
        {meta.minutes} minute read · Checked against its sources on {meta.updated}
      </p>
      <p className={s.setting}>
        <span>Factory setting</span>Cold water sets off cold shock: a gasp, fast breathing, a harder-working heart. The first effects pass in
        less than a minute.
      </p>

      <h2 className={s.sectionH}>
        Three things <span className="serif">to know.</span>
      </h2>

      <div className={s.suspect}>
        <div>
          <span className={s.num}>1</span>
          <h3 className={s.suspectH}>Fewer days off sick. Not fewer days ill.</h3>
          <p className={s.suspectP}>
            3,018 Dutch adults ended their usual shower with 30 to 90 seconds of cold, every day for a month. They reported <b>29% fewer</b>{" "}
            days off sick than people showering normally, but no fewer days feeling ill. 64% kept it up.
          </p>
        </div>
        <div className={s.visual}>
          <Image src="/img/cold_sick.jpg" alt="Bars of tiles: days off sick, the cold row shorter; days feeling ill, both rows the same" width={900} height={900} sizes="260px" placeholder="blur" blurDataURL={BLUR["/img/cold_sick.jpg"]} style={{ objectFit: "cover", aspectRatio: "1 / 1" }} />
        </div>
      </div>

      <div className={s.suspect}>
        <div>
          <span className={s.num}>2</span>
          <h3 className={s.suspectH}>No proof of a boost, or a better mood.</h3>
          <p className={s.suspectP}>
            A 2025 review of 11 trials, 10 of them in cold baths, found <b>no proof</b> of an effect on immunity or mood, and inflammation went
            up in the short term.
          </p>
        </div>
        <div className={s.visual}>
          <Image src="/img/cold_noproof.jpg" alt="Two cards, immune boost and better mood, both stamped no proof, over eleven little tubs" width={900} height={900} sizes="260px" placeholder="blur" blurDataURL={BLUR["/img/cold_noproof.jpg"]} style={{ objectFit: "cover", aspectRatio: "1 / 1" }} />
        </div>
      </div>

      <div className={s.suspect}>
        <div>
          <span className={s.num}>3</span>
          <h3 className={s.suspectH}>Straight after lifting, it may cost you muscle.</h3>
          <p className={s.suspectP}>
            In a 12-week trial, men who sat in cold water after each session gained less strength and muscle than men who did an active
            cool-down. A review of 8 studies points the same way, <b>with caution:</b> their quality was fair to poor.
          </p>
        </div>
        <div className={s.visual}>
          <Image src="/img/cold_lift.jpg" alt="Two muscle sections after training: rest grew more than ice bath" width={900} height={900} sizes="260px" placeholder="blur" blurDataURL={BLUR["/img/cold_lift.jpg"]} style={{ objectFit: "cover", aspectRatio: "1 / 1" }} />
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
        If you like it, <span className="serif">here&apos;s how the trial did it.</span>
      </h2>
      <Plan
        title="The Dutch trial's shower"
        steps={[
          { t: "Shower as usual.", d: "As warm and as long as you like." },
          { t: "End with 30 to 90 seconds of cold.", d: "The coldest water the tap gives. The trial did it every day for 30 days." },
          { t: "Not straight after lifting.", d: "If you're training for muscle, cold water right after a session may blunt the gains." },
        ]}
      />

      <div className={s.doctor}>
        <h3>When to be careful</h3>
        <p>
          Cold water can trigger cold shock: an involuntary gasp, breathing up to ten times faster, and a harder-working heart. The RNLI
          warns that cold water shock can cause heart attacks, even in the relatively young and healthy. If you have a heart condition, ask
          your doctor first.
        </p>
      </div>

      <details className={s.science}>
        <summary>
          The science, if you want it <span>{SOURCES.length} sources</span>
        </summary>
        <p>
          Buijze and colleagues (2016) randomised 3,018 adults in the Netherlands, aged 18 to 65, to end a warm shower with 30, 60 or 90
          seconds of the coldest available water every day for 30 days, or to shower as usual. The cold groups reported 29% less sickness
          absence (incidence rate ratio 0.71), but there was no significant effect on illness days. 91% wanted to continue and 64% did. All
          outcomes were self-reported, and the authors note that a placebo effect cannot be ruled out.
        </p>
        <p>
          Cain and colleagues (2025) reviewed 11 randomised trials with 3,177 healthy adults (10 in baths, 1 in showers, water at 7 to 15
          °C): no significant effect on immune function immediately or 1 hour after, inflammation up immediately and 1 hour after, and
          inconclusive evidence on immunity and mood.
        </p>
        <p>
          Roberts and colleagues (2015): 21 active men trained twice a week for 12 weeks with 10 minutes of cold water or an active cool-down
          after each session; strength and muscle mass increased more with the active cool-down, and type II fibre size grew 17% only in that
          group. Piñero and colleagues (2024) pooled 8 studies: cold water straight after training may attenuate muscle growth, with fair to
          poor quality evidence.
        </p>
        <p>
          Yoneshiro and colleagues (2013) exposed 12 young men to cold at 17 °C, in light clothing, for 2 hours every day for 6 weeks: body fat
          fell by 0.70 kg, against 0.03 kg gained in 10 controls. The RNLI describes cold water shock: an involuntary gasp, breathing that can
          rise as much as tenfold, a heart working harder; it can cause heart attacks, even in the relatively young and healthy, and the
          initial effects pass in less than a minute. The British Heart Foundation and Cleveland Clinic advise talking to a doctor first if
          you have a heart condition.
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
        <Link href="/body/heart" className={`card ${s.nextCard}`}>
          <span className={s.nextK}>See it</span>
          <span className={s.nextT}>Your heart, in 3D</span>
        </Link>
        <Link href="/stress-mood/breathing-to-calm-down" className={`card ${s.nextCard}`}>
          <span className={s.nextK}>Next question</span>
          <span className={s.nextT}>
            Can breathing calm you down? <Icon name="arrow" size={15} style={{ display: "inline", verticalAlign: "-2px" }} />
          </span>
        </Link>
      </div>
    </>
  );
}

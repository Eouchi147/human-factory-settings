import Image from "next/image";
import Link from "next/link";
import s from "@/components/topic/topic.module.css";
import { StatFigure } from "@/components/topic/Figures";
import { Plan } from "@/components/topic/Plan";
import { Icon } from "@/components/Icons";
import { BLUR } from "@/lib/blur";

export const meta = {
  area: "posture-looks",
  slug: "how-to-fix-my-posture",
  title: "How do I fix my posture?",
  description:
    "There is no one perfect posture, and none has been shown to prevent back pain. What the evidence supports: move often, strengthen your neck and upper back, and set up your screen for comfort.",
  minutes: 4,
  updated: "1 October 2026",
};

const SOURCES: { t: string; href: string }[] = [
  { t: "OpenStax Anatomy and Physiology 2e, the vertebral column and its curves", href: "https://openstax.org/books/anatomy-and-physiology-2e/pages/7-3-the-vertebral-column" },
  { t: "Czaprowski et al. 2018, the reference line and the spine's curves", href: "https://link.springer.com/article/10.1186/s13013-018-0151-5" },
  { t: "Barra-López 2024, the standard posture is a myth (scoping review)", href: "https://medicaljournalssweden.se/jrm/article/view/41899" },
  { t: "Swain et al. 2020, 41 reviews on posture, physical work and back pain", href: "https://research.monash.edu/en/publications/no-consensus-on-causality-of-spine-postures-or-physical-exposure-/" },
  { t: "Laird et al. 2014, how people with and without back pain stand and move", href: "https://link.springer.com/article/10.1186/1471-2474-15-229" },
  { t: "De Carvalho et al. 2020, sitting and back pain right afterwards", href: "https://research.polyu.edu.hk/en/publications/association-of-exposures-to-seated-postures-with-immediate-increa/" },
  { t: "Mahmoud et al. 2019, forward head posture and neck pain (15 studies)", href: "https://link.springer.com/article/10.1007/s12178-019-09594-y" },
  { t: "WHO 2023, low back pain fact sheet", href: "https://www.who.int/news-room/fact-sheets/detail/low-back-pain" },
  { t: "NHS physiotherapy leaflet adapted from Slater et al. 2019, posture reframed", href: "https://www.southtees.nhs.uk/wp-content/uploads/2024/11/Posture-Reformed-A5-4pp-V2.pdf" },
  { t: "Korakakis et al. 2019, what 544 physiotherapists call the best posture", href: "https://pure.ul.ie/en/publications/physiotherapist-perceptions-of-optimal-sitting-and-standing-postu/" },
  { t: "NPR 2014, the 60-pound text neck figure and where it came from", href: "https://www.npr.org/sections/thetwo-way/2014/11/20/365473750/keep-your-head-up-text-neck-can-take-a-toll-on-the-spine" },
  { t: "Correia et al. 2021, measured text neck and neck pain in 582 adults", href: "https://www.unisuam.edu.br/wp-content/uploads/2021/11/artigo_prova_de_conhecimentos_2022-1.pdf" },
  { t: "Damasceno et al. 2018, text neck and neck pain in 150 young adults", href: "https://link.springer.com/article/10.1007/s00586-017-5444-5" },
  { t: "Xing et al. 2026, exercise for forward head posture (10 trials)", href: "https://www.dovepress.com/therapeutic-exercise-for-forward-head-posture-in-neck-pain-patients-a--peer-reviewed-fulltext-article-JPR" },
  { t: "Waongenngarm et al. 2018, breaks at work and pain", href: "https://search.pedro.org.au/search-results/record-detail/52797" },
  { t: "UK Health and Safety Executive, breaks and screen set-up", href: "https://www.hse.gov.uk/msd/dse/work-routine.htm" },
  { t: "Shrestha et al. 2018 (Cochrane), sit-stand desks and sitting time", href: "https://www.cochranelibrary.com/cdsr/doi/10.1002/14651858.CD010912.pub5/abstract/en" },
  { t: "Parry et al. 2019 (Cochrane), standing at work and aches", href: "https://www.cochrane.org/CD012487/OCCHEALTH_workplace-interventions-increase-standing-or-walking-decreasing-musculoskeletal-symptoms-sedentary" },
  { t: "Cole et al. 2013, a posture brace tested in the lab", href: "https://search.pedro.org.au/search-results/record-detail/34928" },
  { t: "Chartered Society of Physiotherapy, 10 things you need to know about your back", href: "https://www.csp.org.uk/publications/10-things-you-need-know-about-your-back" },
  { t: "NHS, back pain: when to get help", href: "https://www.nhs.uk/conditions/back-pain/" },
  { t: "MedlinePlus, neck pain: when to get help", href: "https://medlineplus.gov/ency/article/003025.htm" },
];

const MYTHS: { q: string; v: string; a: string }[] = [
  {
    q: "There is one correct posture, and you have to hold it.",
    v: "Not supported",
    a: "Physiotherapists don't agree on what it would be, and the textbook ideal doesn't match real, healthy bodies. NHS physiotherapists say it's safe to sit and stand in whatever positions feel comfortable. Changing position is what helps.",
  },
  {
    q: "Slouching damages your spine.",
    v: "Not supported",
    a: "41 reviews of the evidence found no agreement that posture causes back pain, and the World Health Organization's list of back pain risk factors doesn't include it. Sitting still for a long time can make your back ache for a while; moving eases it.",
  },
  {
    q: "Looking at your phone puts 60 pounds on your neck.",
    v: "A computer model",
    a: "That number comes from a computer model, not from measuring people. When researchers measured the neck angle of 732 people using their phones, the angle didn't predict neck pain.",
  },
  {
    q: "A posture corrector will fix it.",
    v: "Weak",
    a: "In one small lab trial, a brace pulled the shoulders back only while it was worn. No study has shown that it lasts or eases pain. Exercise has better evidence.",
  },
  {
    q: "A standing desk will fix your back.",
    v: "Not shown",
    a: "Sit-stand desks cut sitting by about 100 minutes a workday, but they haven't been shown to reduce aches or pain (low-quality evidence).",
  },
];

export function Body() {
  return (
    <>
      <p className={s.answer}>
        Stop hunting for one perfect posture: <em>none has been shown to prevent back pain.</em> Your spine is built to move. Change position often, train the
        muscles that hold you up, and set up your screen so you&apos;re comfortable.
      </p>
      <p className={s.meta}>
        {meta.minutes} minute read · Checked against its sources on {meta.updated}
      </p>
      <p className={s.setting}>
        <span>Factory setting</span>A spine shaped like a gentle S, built to move. From the side, it curves in at the neck, out at the upper back and in at the lower
        back. It&apos;s strong, it bends, and it&apos;s made to change position all day.
      </p>

      <h2 className={s.sectionH}>
        Three things <span className="serif">to know.</span>
      </h2>

      <div className={s.suspect}>
        <div>
          <span className={s.num}>1</span>
          <h3 className={s.suspectH}>The textbook line is a reference, not a rule.</h3>
          <p className={s.suspectP}>
            Anatomy books draw a line from your ear through your shoulder, hip, knee and ankle. A 2024 review traced that ideal to a <b>19th-century model</b> of a
            body standing without using its muscles. Judged against it, many healthy people look &ldquo;wrong&rdquo;, especially older people.
          </p>
        </div>
        <div className={s.visual}>
          <Link href="/body?system=posture" aria-label="See the spine's curves in 3D">
            <Image src="/img/posture_line.jpg" alt="A skeleton seen from the side, with the textbook line and the spine's curves at the neck, upper back and lower back" width={900} height={900} sizes="260px" placeholder="blur" blurDataURL={BLUR["/img/posture_line.jpg"]} style={{ objectFit: "cover", aspectRatio: "1 / 1" }} />
          </Link>
        </div>
      </div>

      <div className={s.suspect}>
        <div>
          <span className={s.num}>2</span>
          <h3 className={s.suspectH}>No posture has been proven to cause back pain.</h3>
          <p className={s.suspectP}>
            <b>41 reviews</b> of the evidence found no agreement that posture, sitting or bending causes back pain. People with back pain have the same lower-back
            curve as people without it. What differs is how they move: less, and more slowly.
          </p>
        </div>
        <div className={s.visual}>
          <StatFigure
            stats={[
              { value: "41", label: "reviews of the evidence, and no agreement that posture causes back pain" },
              { value: "8", label: "studies found the same lower-back curve in people with and without back pain", tone: "ink" },
            ]}
            source="Swain et al. 2020 · Laird et al. 2014"
          />
        </div>
      </div>

      <div className={s.suspect}>
        <div>
          <span className={s.num}>3</span>
          <h3 className={s.suspectH}>Moving and getting stronger help.</h3>
          <p className={s.suspectP}>
            In 10 trials with 550 people, neck and upper-back exercises moved the head back about <b>3.4 degrees</b> and eased neck pain. Breaks where you get up and
            change position help with pain and discomfort, and they don&apos;t cost you work.
          </p>
        </div>
        <div className={s.visual}>
          <StatFigure
            stats={[
              { value: "3.4°", label: "how far exercise moved the head back, on average, in 10 trials" },
              { value: "Every hour", label: "a 5 to 10 minute break beats 20 minutes every 2 hours", tone: "ink" },
            ]}
            source="Xing et al. 2026 · UK Health and Safety Executive"
          />
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
        Starting today, <span className="serif">try this.</span>
      </h2>
      <Plan
        title="Your posture plan"
        steps={[
          { t: "Change position often.", d: "Get up at least once an hour. Short breaks often beat long breaks rarely." },
          { t: "Strengthen your neck and upper back.", d: "Give it 8 weeks or more: in trials, longer programmes did better." },
          { t: "Set up your screen for comfort.", d: "Top of the screen at eye level, about an arm's length away. Keyboard just below elbow height." },
          { t: "Don't fear bending or lifting.", d: "Your back is stronger than you may think, and it's made to move." },
        ]}
        more={{ href: "/body?system=posture", label: "See your spine's curves in 3D" }}
      />

      <div className={s.doctor}>
        <h3>When it&apos;s time to see a doctor</h3>
        <p>
          Get emergency help if back pain comes with tingling, weakness or numbness in both legs, loss of feeling around your genitals or bottom, changes in your
          bladder or bowels, or chest pain, or if it started after a serious accident.
        </p>
        <p>
          See a doctor if back or neck pain doesn&apos;t improve after a few weeks of looking after it at home, wakes you at night, or comes with weight loss you
          can&apos;t explain or a lump. Get help right away for a fever and headache with a neck so stiff you can&apos;t touch your chin to your chest.
        </p>
      </div>

      <details className={s.science}>
        <summary>
          The science, if you want it <span>{SOURCES.length} sources</span>
        </summary>
        <p>
          The reference line runs from the ear hole through the tip of the shoulder and the lower-back bones, then just behind the hip and just in front of the knee,
          to the ankle. A 2024 scoping review found it matches an early 19th-century model built on &ldquo;the unrealistic objective of maintaining static bipedal
          standing without muscular support&rdquo;, and that using it may give many false positives, particularly in older people.
        </p>
        <p>
          An umbrella review screened 4,285 publications and included 41 systematic reviews from 1990 to 2018. It found both positive and null links between back
          pain and posture, sitting, standing, bending and twisting, and concluded there is no consensus on whether they cause it. A review of 43 studies found no
          difference in the lower-back curve (8 studies) or standing pelvic tilt (3 studies) between people with and without back pain; those with pain moved less,
          more slowly and with less sense of position. Sitting for a long time does make backs ache more in the short term, but that doesn&apos;t show it causes
          episodes of back pain. The WHO lists low physical activity, smoking, obesity and heavy physical stress at work as risk factors; posture isn&apos;t on the
          list.
        </p>
        <p>
          Adults with neck pain tend to hold their head further forward than adults without it, but teenagers don&apos;t show that link, and these studies took one
          snapshot in time, so they can&apos;t show which came first. The famous loads on the neck (27 pounds at 15 degrees up to 60 pounds at 60 degrees) came from a
          computer model of the spine. When the neck angle of people using phones was measured, in 150 young adults and in 582 adults, it wasn&apos;t linked to
          neck pain.
        </p>
        <p>
          In 10 randomised trials with 550 people, exercise improved head position by about 3.38 degrees and reduced neck pain, with low to moderate certainty;
          programmes of 8 weeks or more tended to do better. A review of trials found moderate-quality evidence that active breaks with a change of posture help
          with pain and discomfort, and no harm to productivity. Sit-stand desks cut workplace sitting by about 100 minutes a day in the short term, but limited
          evidence doesn&apos;t show they reduce aches. Screen and desk set-up advice is sensible for comfort, but hasn&apos;t been shown to prevent neck problems.
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
        <Link href="/body?system=posture" className={`card ${s.nextCard}`}>
          <span className={s.nextK}>See it</span>
          <span className={s.nextT}>Your spine&apos;s curves, in 3D</span>
        </Link>
        <Link href="/posture-looks/what-is-fascia" className={`card ${s.nextCard}`}>
          <span className={s.nextK}>Next question</span>
          <span className={s.nextT}>
            What is fascia, and does foam rolling work? <Icon name="arrow" size={15} style={{ display: "inline", verticalAlign: "-2px" }} />
          </span>
        </Link>
      </div>
    </>
  );
}

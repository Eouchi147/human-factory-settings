import Image from "next/image";
import Link from "next/link";
import s from "@/components/topic/topic.module.css";
import { BarsFigure } from "@/components/topic/Figures";
import { Plan } from "@/components/topic/Plan";
import { Icon } from "@/components/Icons";
import { BLUR } from "@/lib/blur";

export const meta = {
  area: "posture-looks",
  slug: "are-barefoot-shoes-good-for-your-feet",
  title: "Are barefoot shoes good for your feet?",
  description:
    "They can make your feet stronger if you switch slowly. Flat feet are usually normal, and arch supports ease pain without reshaping the foot. What the trials show, and when to see a doctor.",
  minutes: 4,
  updated: "1 October 2026",
};

const SOURCES: { t: string; href: string }[] = [
  { t: "StatPearls, the joints and muscles of the foot", href: "https://www.ncbi.nlm.nih.gov/books/NBK536941/" },
  { t: "StatPearls, the arches of the foot", href: "https://www.statpearls.com/point-of-care/149120" },
  { t: "Bolgla and Malone 2004, the windlass mechanism", href: "https://pmc.ncbi.nlm.nih.gov/articles/PMC385265" },
  { t: "NHS, flat feet", href: "https://www.nhs.uk/conditions/flat-feet/" },
  { t: "Pfeiffer et al. 2006, flat feet in 835 preschool children", href: "https://pubmed.ncbi.nlm.nih.gov/16882817/" },
  { t: "American Academy of Orthopaedic Surgeons, flexible flatfoot in children", href: "https://www.orthoinfo.org/diseases--conditions/flexible-flatfoot-in-children" },
  { t: "Rao and Joseph 1992, shoes and flat feet in 2,300 children", href: "https://pubmed.ncbi.nlm.nih.gov/1624509/" },
  { t: "Wenger et al. 1989, corrective shoes and inserts in 129 children", href: "https://pubmed.ncbi.nlm.nih.gov/2663868/" },
  { t: "Ridge et al. 2019, walking in minimalist shoes and foot strength", href: "https://scholarsarchive.byu.edu/cgi/viewcontent.cgi?article=4119&context=facpub" },
  { t: "Taddei et al. 2020, foot training and running injuries", href: "https://search.pedro.org.au/search-results/record-detail/62997" },
  { t: "Ridge et al. 2013, bone stress after switching to minimalist running shoes", href: "https://search.pedro.org.au/search-results/record-detail/53028" },
  { t: "Hoang et al. 2021, insoles and exercise for adult flat feet (10 trials)", href: "https://www.mdpi.com/1660-4601/18/15/8063" },
  { t: "Whittaker et al. 2018, insoles for heel pain (19 trials)", href: "https://bjsm.bmj.com/content/52/5/322" },
  { t: "Neal et al. 2014, foot posture and injury (21 studies)", href: "https://link.springer.com/article/10.1186/s13047-014-0055-4" },
  { t: "Koc et al. 2023, heel pain clinical practice guideline", href: "https://www.orthopt.org/uploads/content_files/files/Heel_Pain_Plantar_Fasciitis_revision_2023_1_.pdf" },
  { t: "Trojian and Tucker 2019, plantar fasciitis (American Family Physician)", href: "https://www.aafp.org/pubs/afp/issues/2019/0615/p744.html" },
  { t: "NHS, heel pain", href: "https://www.nhs.uk/conditions/heel-pain/" },
  { t: "Royal Orthopaedic Hospital (NHS), adult acquired flat foot", href: "https://roh.nhs.uk/services-information/foot-and-ankle/adult-acquired-flat-foot-posterior-tibial-tendon-dysfunction" },
];

const MYTHS: { q: string; v: string; a: string }[] = [
  {
    q: "Flat feet need fixing.",
    v: "Not supported",
    a: "Flexible flat feet are common and usually harmless. The NHS says you don't need to do anything if they aren't causing problems.",
  },
  {
    q: "Children need special shoes to build their arches.",
    v: "Not supported",
    a: "In a trial of 129 children, 3 years of corrective shoes or inserts made no difference: every group improved with age, including the children who got nothing.",
  },
  {
    q: "Arch supports reshape your feet.",
    v: "Not supported",
    a: "Across 10 trials, insoles and exercise eased pain but didn't realign the foot. For heel pain, insoles helped a little, and custom-made ones did no better than ready-made.",
  },
  {
    q: "Barefoot shoes are a quick, risk-free fix.",
    v: "Not supported",
    a: "The trial that worked built up slowly over 8 weeks. Of 19 runners who switched to toe shoes over 10 weeks, 10 showed bone stress on a scan.",
  },
  {
    q: "Plantar fasciitis is inflammation, so rest it.",
    v: "Mostly not",
    a: "Doctors also call it plantar fasciopathy, because it's mostly not inflammation. The best-supported treatments are active: stretching the calf and the sole, hands-on therapy, taping and night splints.",
  },
];

export function Body() {
  return (
    <>
      <p className={s.answer}>
        They can be: in a trial, walking in flat, flexible shoes made foot muscles <em>41% stronger in 8 weeks.</em> Switch slowly, though. And if your feet are
        flat, that&apos;s usually normal: arch supports ease pain, but they don&apos;t reshape your foot.
      </p>
      <p className={s.meta}>
        {meta.minutes} minute read · Checked against its sources on {meta.updated}
      </p>
      <p className={s.setting}>
        <span>Factory setting</span>Three arches on 26 bones. A tall arch on the inside, a low one on the outside and one across the front, held up by straps
        underneath and by muscles that work like slings.
      </p>

      <h2 className={s.sectionH}>
        Three things <span className="serif">to know.</span>
      </h2>

      <div className={s.suspect}>
        <div>
          <span className={s.num}>1</span>
          <h3 className={s.suspectH}>Your arches are a machine.</h3>
          <p className={s.suspectP}>
            Each foot has <b>26 bones</b>, about 30 joints and more than 100 muscles, tendons and ligaments. When your big toe bends as you push off, the band under
            your foot winds round the toe joint like a rope round a winch, and lifts the arch into a stiff lever.
          </p>
        </div>
        <div className={s.visual}>
          <Link href="/body?system=feet" aria-label="See the foot's arches in 3D">
            <Image src="/img/feet_arches.jpg" alt="The bones of the foot seen from the inside, with its arches drawn as lines" width={900} height={900} sizes="260px" placeholder="blur" blurDataURL={BLUR["/img/feet_arches.jpg"]} style={{ objectFit: "cover", aspectRatio: "1 / 1" }} />
          </Link>
        </div>
      </div>

      <div className={s.suspect}>
        <div>
          <span className={s.num}>2</span>
          <h3 className={s.suspectH}>Flat feet are usually normal.</h3>
          <p className={s.suspectP}>
            Among 835 children aged 3 to 6, <b>44%</b> had flexible flat feet, and fewer than 1% had a real problem. Arches usually grow in between the ages of 3
            and 10. Children who wore shoes early had flatter feet than barefoot children, a link that doesn&apos;t prove shoes are the cause.
          </p>
        </div>
        <div className={s.visual}>
          <BarsFigure
            title="Children with flat feet"
            bars={[
              { name: "Age 3", value: 54, shown: "54%" },
              { name: "Age 6", value: 24, shown: "24%", tone: "ink" },
            ]}
            max={60}
            source="Pfeiffer et al. 2006, 835 children"
          />
        </div>
      </div>

      <div className={s.suspect}>
        <div>
          <span className={s.num}>3</span>
          <h3 className={s.suspectH}>Feet get stronger with use, slowly.</h3>
          <p className={s.suspectP}>
            In 57 runners, 8 weeks of walking in minimalist shoes made their feet <b>41% stronger</b>, and foot exercises worked just as well (the gap between the
            two was too small to count). In another trial, runners
            who skipped 8 weeks of foot training were 2.42 times as likely to get hurt over the next year.
          </p>
        </div>
        <div className={s.visual}>
          <BarsFigure
            title="Foot strength after 8 weeks"
            bars={[
              { name: "Usual shoes", value: 5, shown: "+5%", tone: "dim" },
              { name: "Minimal shoes", value: 41, shown: "+41%" },
              { name: "Exercises", value: 58, shown: "+58%", tone: "ink" },
            ]}
            max={60}
            source="Ridge et al. 2019, 57 runners"
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
        If you switch, <span className="serif">do it like this.</span>
      </h2>
      <Plan
        title="Your feet plan"
        steps={[
          { t: "Build up over 8 weeks.", d: "The trial that worked: 2,500 steps a day in minimal shoes for 2 weeks, then 5,000, then 7,000." },
          { t: "Train the small muscles.", d: "Foot exercises 5 days a week worked just as well as the shoes, and they cost nothing." },
          { t: "Stretch your calf and the sole of your foot.", d: "For heel pain, stretching is one of the best-supported treatments in the 2023 guideline." },
          { t: "Leave painless flat feet alone.", d: "If they don't hurt or hold you back, there's nothing to fix." },
        ]}
        more={{ href: "/body?system=feet", label: "See the foot's arches in 3D" }}
      />

      <div className={s.doctor}>
        <h3>When it&apos;s time to see a doctor</h3>
        <p>
          See a doctor if your feet are painful, stiff, weak or numb, if you often injure your feet or ankles or have trouble walking or keeping your balance, if
          only one foot has gone flat, or if you didn&apos;t have flat feet before. An arch that sinks
          on one side, with pain and swelling inside the ankle or trouble rising onto your toes, should be checked early.
        </p>
        <p>
          For heel pain, see a doctor if it hasn&apos;t improved after 2 weeks of home care, if you have tingling or numbness, or if you have diabetes. Get urgent
          help after an injury if you heard a snap, can&apos;t walk or stand on tiptoe, or your foot looks out of shape.
        </p>
      </div>

      <details className={s.science}>
        <summary>
          The science, if you want it <span>{SOURCES.length} sources</span>
        </summary>
        <p>
          The inner arch runs over the heel bone, talus, navicular, the three cuneiforms and the first three metatarsals; the outer arch over the heel bone, cuboid
          and the fourth and fifth metatarsals; the transverse arch across the metatarsals. Standing still, ligaments and the plantar fascia hold the arches;
          moving, muscles from the leg and the 10 groups of small muscles in the sole lift and steady them. Bending the big toe up winds the plantar fascia round
          the head of the first metatarsal, which shortens the foot and raises the inner arch: the windlass mechanism, first described in 1954.
        </p>
        <p>
          In 835 children aged 3 to 6, 44% had flexible flat feet (54% at age 3, 24% at age 6) and under 1% had a pathological flat foot; the authors judged over
          90% of the treatments they saw unnecessary. In 2,300 children, flat feet were found in 8.6% of those who wore shoes and 2.8% of those who didn&apos;t. A
          randomised trial of 129 children found that 3 years of corrective shoes, heel cups or moulded inserts changed nothing compared with no treatment. A review
          of 21 studies found a pronated foot only slightly raised the risk of shin pain, with no link to most other injuries.
        </p>
        <p>
          In a randomised trial, 8 weeks of walking in minimalist shoes, built up from 2,500 to 7,000 steps a day, raised foot strength by 41% and muscle size by 7%;
          foot exercises raised them by 58% and 11%, and the control group by about 5% and 0%. The strength gains of the two trained groups were not significantly
          different from each other. In 118 runners, those who did not do an 8-week foot and ankle
          programme were 2.42 times as likely to have a running injury within 12 months. In 36 runners, 10 of 19 who moved to toe shoes over 10 weeks showed bone
          marrow swelling on MRI.
        </p>
        <p>
          A network analysis of 10 trials in adult flat feet found exercise and insoles both eased pain, but neither changed how far the arch drops. For heel pain,
          19 trials found insoles helped a little in the medium term, with custom insoles no better than ready-made ones, and the 2023 guideline advises against
          using them alone for short-term pain. With proper treatment, 80% of people with plantar fasciitis improve within 12 months.
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
        <Link href="/body?system=feet" className={`card ${s.nextCard}`}>
          <span className={s.nextK}>See it</span>
          <span className={s.nextT}>The foot&apos;s three arches, in 3D</span>
        </Link>
        <Link href="/posture-looks/does-mewing-work" className={`card ${s.nextCard}`}>
          <span className={s.nextK}>Next question</span>
          <span className={s.nextT}>
            Does mewing work? <Icon name="arrow" size={15} style={{ display: "inline", verticalAlign: "-2px" }} />
          </span>
        </Link>
      </div>
    </>
  );
}

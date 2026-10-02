import Image from "next/image";
import Link from "next/link";
import s from "@/components/topic/topic.module.css";
import { BarsFigure, StatFigure } from "@/components/topic/Figures";
import { Plan } from "@/components/topic/Plan";
import { Icon } from "@/components/Icons";
import { BLUR } from "@/lib/blur";

export const meta = {
  area: "posture-looks",
  slug: "what-is-fascia",
  title: "What is fascia, and does foam rolling work?",
  description:
    "Fascia is the web of tissue that wraps every muscle, organ and bone. Foam rolling gives you a small, short boost in flexibility, about the same as stretching. It doesn't break anything up.",
  minutes: 4,
  updated: "1 October 2026",
};

const SOURCES: { t: string; href: string }[] = [
  { t: "Fascia Research Society, what counts as a fascia and the fascial system", href: "https://fasciaresearchsociety.org/science-research/fascia-nomenclature" },
  { t: "OpenStax Anatomy and Physiology 2e, the three wraps of every muscle", href: "https://openstax.org/books/anatomy-and-physiology-2e/pages/10-2-skeletal-muscle" },
  { t: "Stecco et al. 2011, the layers and thickness of deep fascia", href: "https://oajournals.fupress.net/index.php/ijae/article/download/1101/1099/1029" },
  { t: "Falvey et al. 2010, the IT band is part of the thigh's fascia", href: "https://research.monash.edu/en/publications/iliotibial-band-syndrome-an-examination-of-the-evidence-behind-a-/" },
  { t: "Suarez-Rodriguez et al. 2022, the nerves in fascia (review of 23 studies)", href: "https://doaj.org/article/c7fcb02e2ebe41a48b58409c9d2967af" },
  { t: "Langevin et al. 2009, back fascia in people with long-lasting back pain", href: "https://doaj.org/article/7a6cc17bef3f4dd8b1b3179cb946fc5d" },
  { t: "Langevin et al. 2011, how well back fascia slides in back pain", href: "https://link.springer.com/article/10.1186/1471-2474-12-203" },
  { t: "Wiewelhove et al. 2019, foam rolling and performance (21 studies)", href: "https://www.frontiersin.org/articles/10.3389/fphys.2019.00376/full" },
  { t: "Wilke et al. 2020, foam rolling and range of motion (26 trials)", href: "https://link.springer.com/article/10.1007/s40279-019-01205-7" },
  { t: "Nakamura et al. 2021, how long the effect of rolling lasts", href: "https://jssm.org/jssm-20-62.xml-Fulltext" },
  { t: "Konrad et al. 2022, rolling for weeks and range of motion", href: "https://link.springer.com/article/10.1007/s40279-022-01699-8" },
  { t: "Behm and Wilke 2019, what rolling actually does", href: "https://www.bisp-surf.de/Record/PU202002000917" },
  { t: "Chaudhry et al. 2008, the force it would take to change dense fascia", href: "https://www.degruyterbrill.com/document/doi/10.7556/jaoa.2008.108.8.379/html" },
  { t: "Miller et al. 2005, collagen building after exercise", href: "https://rke.abertay.ac.uk/en/publications/coordinated-collagen-and-muscle-protein-synthesis-in-human-patell/" },
  { t: "Zügel et al. 2018, British Journal of Sports Medicine consensus on fascia", href: "https://researchonline.ljmu.ac.uk/9080/3/Fascial%20tissue%20research%20in%20sports%20medicine%20from%20molecules%20to%20tissue%20adaptation%2C%20injury%20and%20diagnostics..pdf" },
  { t: "Wiltshire et al. 2010, massage and lactic acid", href: "https://api.openalex.org/works/doi:10.1249/MSS.0b013e3181c9214f" },
  { t: "Cleveland Clinic, cellulite", href: "https://my.clevelandclinic.org/health/diseases/17694-cellulite" },
  { t: "CDC, necrotizing fasciitis", href: "https://www.cdc.gov/group-a-strep/about/necrotizing-fasciitis.html" },
  { t: "Cleveland Clinic, compartment syndrome", href: "https://my.clevelandclinic.org/health/diseases/15315-compartment-syndrome" },
];

const MYTHS: { q: string; v: string; a: string }[] = [
  {
    q: "Foam rolling breaks up knots and adhesions in your fascia.",
    v: "Not supported",
    a: "Dense fascia is far too tough. A model worked out that squashing the thigh's fascia by just 1% would take a push of about 925 kg. Rolling works mostly through your nerves, which is why the gains fade so fast.",
  },
  {
    q: "Rolling or massage flushes out toxins or lactic acid.",
    v: "Not supported",
    a: "In a lab test, massage after hard exercise actually slowed blood flow and the clearing of lactate from the muscle, compared with resting.",
  },
  {
    q: "Fascia stores trauma and emotions.",
    v: "No evidence",
    a: "We couldn't find a study that measured stored memories in fascia. What is true: fascia has many nerve endings, including pain sensors, so it can hurt, and pain is affected by stress and mood.",
  },
  {
    q: "Fascia blasting gets rid of cellulite.",
    v: "Not supported",
    a: "The only study was written by the device's inventor and her company. Cleveland Clinic says there's no evidence that rollers or massage tools improve cellulite in the long run. Cellulite is normal: 80 to 90% of women have it.",
  },
];

export function Body() {
  return (
    <>
      <p className={s.answer}>
        Fascia is the web of tissue that wraps and connects every muscle, organ and bone. Foam rolling gives you <em>a small, short boost in flexibility</em>,
        about the same as stretching. It doesn&apos;t break anything up. Lasting change comes from moving and loading your body, over weeks, not minutes.
      </p>
      <p className={s.meta}>
        {meta.minutes} minute read · Checked against its sources on {meta.updated}
      </p>
      <p className={s.setting}>
        <span>Factory setting</span>Layers that slide. Your muscles sit in sleeves of fascia, with a slippery layer between them so they can glide as you
        move.
      </p>

      <h2 className={s.sectionH}>
        Three things <span className="serif">to know.</span>
      </h2>

      <div className={s.suspect}>
        <div>
          <span className={s.num}>1</span>
          <h3 className={s.suspectH}>It wraps everything, three times over.</h3>
          <p className={s.suspectP}>
            Every muscle is wrapped as a whole, then in bundles, then fibre by fibre. Those wraps carry the pull of the muscle to the tendon and the bone. Around
            your thigh, the fascia is a sleeve about <b>1 mm thick</b>; its thick outer strip is the IT band.
          </p>
        </div>
        <div className={s.visual}>
          <Link href="/body?system=fascia" aria-label="See the thigh's fascia in 3D">
            <Image src="/img/fascia_sleeve.jpg" alt="The thigh wrapped in its sleeve of fascia, with the IT band running down the outside" width={900} height={900} sizes="260px" placeholder="blur" blurDataURL={BLUR["/img/fascia_sleeve.jpg"]} style={{ objectFit: "cover", aspectRatio: "1 / 1" }} />
          </Link>
        </div>
      </div>

      <div className={s.suspect}>
        <div>
          <span className={s.num}>2</span>
          <h3 className={s.suspectH}>It can hurt, and it can stiffen.</h3>
          <p className={s.suspectP}>
            Fascia is full of nerve endings, including pain sensors. In people with long-lasting low back pain, the fascia was about <b>25% thicker</b> and slid
            about <b>20% less</b>. Those studies are snapshots, so they can&apos;t tell which came first: the pain, moving less, or the stiff fascia.
          </p>
        </div>
        <div className={s.visual}>
          <StatFigure
            stats={[
              { value: "25%", label: "thicker fascia in the lower back of people with long-lasting back pain" },
              { value: "20%", label: "less sliding between the layers when they bend", tone: "ink" },
            ]}
            source="Langevin et al. 2009 and 2011"
          />
        </div>
      </div>

      <div className={s.suspect}>
        <div>
          <span className={s.num}>3</span>
          <h3 className={s.suspectH}>Rolling helps a little, for a little while.</h3>
          <p className={s.suspectP}>
            Before exercise, rolling made people about <b>4% more flexible</b>, no better than stretching, and in one trial the gain was gone within 30 minutes.
            After exercise, it eased soreness a little. It did almost nothing for strength or jumping.
          </p>
        </div>
        <div className={s.visual}>
          <BarsFigure
            title="Rolling before exercise, change"
            bars={[
              { name: "Flexibility", value: 4.0, shown: "+4.0%" },
              { name: "Strength", value: 1.8, shown: "+1.8%", tone: "dim" },
              { name: "Sprint", value: 0.7, shown: "+0.7%", tone: "dim" },
            ]}
            max={5}
            source="Wiewelhove et al. 2019, 21 studies"
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
        If you roll, <span className="serif">do it like this.</span>
      </h2>
      <Plan
        title="Your fascia plan"
        steps={[
          { t: "Roll as a warm-up, not a fix.", d: "A few rounds of 30 seconds per muscle before you move. Expect a short boost, not a change." },
          { t: "Stretch if you'd rather.", d: "For flexibility, stretching did just as well as rolling." },
          { t: "Load it to change it.", d: "Training makes your connective tissue build new collagen for about 3 days, and tendons get stronger within weeks of regular loading." },
          { t: "Keep moving through the day.", d: "In animal studies, weeks of restricted movement made the layers of fascia slide less." },
        ]}
        more={{ href: "/body?system=fascia", label: "See the thigh's fascia in 3D" }}
      />

      <div className={s.doctor}>
        <h3>When it&apos;s time to see a doctor</h3>
        <p>
          Get emergency help for red, warm or swollen skin that spreads quickly, with fever and pain beyond the red area, especially after an injury or surgery: it
          can be necrotizing fasciitis, an infection of the fascia that spreads fast.
        </p>
        <p>
          Get emergency help, too, for a muscle that bulges or swells with severe pain when you stretch it, or numbness or tingling, often after an injury: it can be
          compartment syndrome, where swelling inside the fascia squeezes the muscle. See a doctor for pain that doesn&apos;t ease after a few weeks.
        </p>
      </div>

      <details className={s.science}>
        <summary>
          The science, if you want it <span>{SOURCES.length} sources</span>
        </summary>
        <p>
          Fascia researchers define the fascial system as one continuous web of soft, collagen-containing tissue that surrounds, weaves between and passes through
          all organs, muscles, bones and nerves. Deep fascia of the limbs is made of two or three thin layers whose fibres cross at about 78 degrees, separated by a
          loose layer rich in hyaluronic acid that lets them glide; the fascia of the thigh averages 944 µm thick. A review of 23 studies found fascia is supplied
          mostly with position sensors and pain sensors, and that damaged fascia has more pain sensors.
        </p>
        <p>
          In 107 people, the tissue around the back muscles was about 25% thicker in those with long-lasting low back pain; in 121 people, the back fascia layers
          slid about 20% less during bending in those with back pain. Both were single snapshots. In pigs, injury combined with 8 weeks of restricted movement cut
          sliding by 52%, and restricted movement alone also reduced it.
        </p>
        <p>
          Across 21 studies, rolling before exercise improved flexibility by 4.0% and sprints by 0.7%, with no real effect on jumping or strength; after exercise,
          it eased muscle pain a little. Across 26 trials, one session clearly increased range of motion, but no more than stretching. In a trial of 45 people the
          gain was back to baseline 30 minutes later, and muscle stiffness didn&apos;t change. Experts who reviewed the mechanisms concluded the evidence
          doesn&apos;t support &ldquo;releasing&rdquo; fascia, and that the name &ldquo;self-myofascial release&rdquo; is misleading: rolling works mainly through
          the nervous system.
        </p>
        <p>
          After exercise, tendons and the connective tissue inside muscles build new collagen, peaking at about 24 hours and staying raised for about 3 days.
          Tendons stiffen with regular loading and weaken with rest, within weeks. A model of manual therapy found that changing dense fascia by 1% would need a
          force of about 925 kg on the thigh and 852 kg on the sole of the foot.
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
        <Link href="/body?system=fascia" className={`card ${s.nextCard}`}>
          <span className={s.nextK}>See it</span>
          <span className={s.nextT}>The thigh&apos;s fascia, layer by layer, in 3D</span>
        </Link>
        <Link href="/posture-looks/are-barefoot-shoes-good-for-your-feet" className={`card ${s.nextCard}`}>
          <span className={s.nextK}>Next question</span>
          <span className={s.nextT}>
            Are barefoot shoes good for your feet? <Icon name="arrow" size={15} style={{ display: "inline", verticalAlign: "-2px" }} />
          </span>
        </Link>
      </div>
    </>
  );
}

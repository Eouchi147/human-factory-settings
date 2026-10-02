import Image from "next/image";
import Link from "next/link";
import s from "@/components/topic/topic.module.css";
import { StatFigure } from "@/components/topic/Figures";
import { Plan } from "@/components/topic/Plan";
import { Icon } from "@/components/Icons";
import { BLUR } from "@/lib/blur";

export const meta = {
  area: "posture-looks",
  slug: "does-mewing-work",
  title: "Does mewing work?",
  description:
    "No trial shows that mewing reshapes an adult's jaw or face. What is worth doing: a relaxed resting mouth, nose breathing, and getting snoring checked. What the evidence says, and the risks.",
  minutes: 4,
  updated: "1 October 2026",
};

const SOURCES: { t: string; href: string }[] = [
  { t: "British Orthodontic Society, statement on claims about orthodontics (2024)", href: "https://bos.org.uk/news/claims-about-orthodontics/" },
  { t: "American Association of Orthodontists, the risks of mewing (2024)", href: "https://aaoinfo.org/wp-content/uploads/2025/01/Risks-of-Mewing.pdf" },
  { t: "American Association of Orthodontists, is mewing bad for you? (2025)", href: "https://aaoinfo.org/whats-trending/is-mewing-bad-for-you" },
  { t: "Cleveland Clinic, what is mewing? (2025)", href: "https://health.clevelandclinic.org/what-is-mewing" },
  { t: "American Speech-Language-Hearing Association, the typical resting mouth", href: "https://www.asha.org/practice-portal/clinical-topics/orofacial-myofunctional-disorders/" },
  { t: "NHS, temporomandibular disorder (jaw joint problems)", href: "https://www.nhs.uk/conditions/temporomandibular-disorder-tmd/" },
  { t: "Camacho et al. 2015, mouth and throat exercises for sleep apnoea", href: "https://pubmed.ncbi.nlm.nih.gov/25348130/" },
  { t: "Rueda et al. 2020 (Cochrane), mouth and throat exercises for sleep apnoea", href: "https://merit.url.edu/en/publications/myofunctional-therapy-oropharyngeal-exercises-for-obstructive-sle-8/" },
  { t: "Saba et al. 2024, randomised trials of myofunctional therapy for sleep apnoea", href: "https://researchdiscovery.drexel.edu/esploro/outputs/journalArticle/Orofacial-Myofunctional-Therapy-for-Obstructive-Sleep/991022202115404721" },
  { t: "Zheng et al. 2020, face shape in children who breathe through the mouth", href: "https://spandidos-publications.com/10.3892/etm.2020.8611" },
  { t: "Zhao et al. 2021, mouth breathing and facial development in 1,358 children", href: "https://link.springer.com/article/10.1186/s12903-021-01458-7" },
  { t: "Cleveland Clinic, mouth breathing", href: "https://my.clevelandclinic.org/health/diseases/22734-mouth-breathing" },
  { t: "NHS Healthier Together, snoring and sleep apnoea in children", href: "https://www.healthiertogether.nhs.uk/child-under-12-years/obstructive-sleep-apnoea-osa" },
  { t: "NHS, snoring", href: "https://www.nhs.uk/symptoms/snoring/" },
  { t: "Cleveland Clinic, the hyoid bone", href: "https://my.clevelandclinic.org/health/body/hyoid-bone" },
  { t: "Mew v General Dental Council [2026] EWHC 1116 (Admin)", href: "https://caselaw.nationalarchives.gov.uk/ewhc/admin/2026/1116" },
];

const MYTHS: { q: string; v: string; a: string }[] = [
  {
    q: "Mewing gives you a sharper jawline.",
    v: "Not supported",
    a: "No controlled trial shows it. Orthodontists in the UK and the US say there's no scientific evidence that holding your tongue or teeth in a position reshapes your face.",
  },
  {
    q: "Keep your teeth together all day.",
    v: "Not supported",
    a: "At rest, your teeth should be slightly apart. The NHS says that apart from when you're eating, your teeth should be apart; clenching can strain your jaw.",
  },
  {
    q: "Mewing fixes sleep apnoea.",
    v: "Not supported",
    a: "What helps is different: a structured programme of mouth and throat exercises, run by a trained therapist. In adults it cut breathing pauses by about 10 an hour. It's an add-on, or an option when a breathing machine isn't tolerated.",
  },
  {
    q: "Breathing through your mouth as a child gives you a long face.",
    v: "Not proven",
    a: "Children who mouth-breathe do tend to have longer faces and jaws set further back, but every study is a snapshot, so it can't show cause. The useful step is to get a child who snores or always mouth-breathes checked.",
  },
  {
    q: "It's free, so it can't hurt.",
    v: "Not risk-free",
    a: "Orthodontists warn that constant pressure can loosen or wear teeth, shift your bite, strain your jaw joint and change your speech. These warnings are expert opinion, but there's no proven benefit to weigh against them.",
  },
];

export function Body() {
  return (
    <>
      <p className={s.answer}>
        No trial shows that mewing <em>reshapes an adult&apos;s jaw or face.</em> What is worth doing: a relaxed resting mouth, with lips closed, breathing through
        your nose and teeth slightly apart. And if you snore, get it checked: real mouth and throat exercises can help sleep apnoea.
      </p>
      <p className={s.meta}>
        {meta.minutes} minute read · Checked against its sources on {meta.updated}
      </p>
      <p className={s.setting}>
        <span>Factory setting</span>A quiet mouth. At rest: lips closed, breathing through your nose, teeth slightly apart, and the tip of your tongue resting
        near the front of the roof of your mouth.
      </p>

      <h2 className={s.sectionH}>
        Three things <span className="serif">to know.</span>
      </h2>

      <div className={s.suspect}>
        <div>
          <span className={s.num}>1</span>
          <h3 className={s.suspectH}>There&apos;s no evidence it reshapes your face.</h3>
          <p className={s.suspectP}>
            Mewing means pressing your whole tongue flat against the roof of your mouth to sharpen your jawline. The British Orthodontic Society says there are
            <b> no independent studies</b> to support changing your face that way, and the American Association of Orthodontists agrees.
          </p>
        </div>
        <div className={s.visual}>
          <Link href="/body?system=mouth" aria-label="See the mouth at rest in 3D">
            <Image src="/img/mouth_rest.jpg" alt="The tongue, palate and airway seen from the side, cut down the middle, at rest" width={900} height={900} sizes="260px" placeholder="blur" blurDataURL={BLUR["/img/mouth_rest.jpg"]} style={{ objectFit: "cover", aspectRatio: "1 / 1" }} />
          </Link>
        </div>
      </div>

      <div className={s.suspect}>
        <div>
          <span className={s.num}>2</span>
          <h3 className={s.suspectH}>How you breathe at rest matters.</h3>
          <p className={s.suspectP}>
            Your nose moistens and cleans the air you breathe. Children who breathe through the mouth tend to have longer faces, but that&apos;s a link, not proof
            of cause. The usual reason a child mouth-breathes is <b>big tonsils or adenoids</b>, which a doctor can check.
          </p>
        </div>
        <div className={s.visual}>
          <StatFigure
            stats={[
              { value: "1 in 10", label: "children snore" },
              { value: "3 in 100", label: "children have sleep apnoea, often from big tonsils or adenoids", tone: "ink" },
            ]}
            source="NHS Healthier Together"
          />
        </div>
      </div>

      <div className={s.suspect}>
        <div>
          <span className={s.num}>3</span>
          <h3 className={s.suspectH}>Real mouth exercises help sleep apnoea.</h3>
          <p className={s.suspectP}>
            In 7 randomised trials with 310 people, a programme of mouth and throat exercises cut breathing pauses in adults by about <b>10 an hour</b> and eased
            daytime sleepiness. It&apos;s run by trained therapists, and it isn&apos;t the same as holding your tongue up all day. In children it hasn&apos;t
            worked well, mostly because few kept it up.
          </p>
        </div>
        <div className={s.visual}>
          <StatFigure
            stats={[
              { value: "10", label: "fewer breathing pauses an hour, on average, in adults with sleep apnoea" },
              { value: "7 trials", label: "with 310 people, all testing exercises run by a therapist", tone: "ink" },
            ]}
            source="Saba et al. 2024"
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
        At rest, <span className="serif">try this.</span>
      </h2>
      <Plan
        title="Your resting mouth"
        steps={[
          { t: "Lips closed, breathe through your nose.", d: "That's the normal resting position, as speech and language therapists describe it." },
          { t: "Let your teeth rest apart.", d: "They touch when you eat. At rest, clenching only strains your jaw." },
          { t: "Let your tongue rest lightly.", d: "Its tip near the front of the roof of your mouth. No pushing, no holding." },
          { t: "If you snore, get it checked.", d: "Especially if you're sleepy in the day, or someone sees you stop breathing." },
        ]}
        more={{ href: "/body?system=mouth", label: "See the mouth at rest in 3D" }}
      />

      <div className={s.doctor}>
        <h3>When it&apos;s time to see a doctor</h3>
        <p>
          See a doctor if snoring is affecting your life, if you feel sleepy during the day, or if your breathing stops and starts or you gasp in your sleep. See a
          doctor about a child who snores loudly with pauses in breathing, breathes through the mouth all the time, or struggles to concentrate; a video of them
          asleep helps.
        </p>
        <p>
          See a dentist or doctor for jaw pain, painful clicking or a jaw that locks, and get help straight away if you can&apos;t eat or drink. American
          orthodontists recommend a child&apos;s first orthodontic check-up by age 7.
        </p>
      </div>

      <details className={s.science}>
        <summary>
          The science, if you want it <span>{SOURCES.length} sources</span>
        </summary>
        <p>
          Mewing comes from &ldquo;orthotropics&rdquo;, a theory developed by the British orthodontist John Mew that crooked teeth and narrow faces come mostly from
          how we hold our mouths rather than from our genes. It was simplified and spread online by his son, Mike Mew. Critics noted the absence of controlled
          clinical trials. In November 2024, a UK General Dental Council committee found misconduct, including over the orthotropic treatment of two children and
          misleading claims in a video, and erased Mike Mew from the dentists&apos; register; in May 2026 the High Court dismissed his appeal.
        </p>
        <p>
          The typical resting mouth, as described by the American Speech-Language-Hearing Association, has the lips closed, nasal breathing, the teeth slightly
          apart, and the tongue tip resting against the front of the hard palate, at the lower front teeth, or on the gum behind them. Mewing differs: it asks you
          to close your teeth and press the whole tongue flat.
        </p>
        <p>
          A Cochrane review of 9 trials (347 people) found that, compared with sham exercises, myofunctional therapy probably reduces daytime sleepiness, with low
          to moderate certainty. The newest analysis of 7 randomised trials (310 people) found the apnoea-hypopnoea index fell by about 10.2 events an hour in
          adults; in children, fewer than half kept up the exercises and breathing didn&apos;t improve.
        </p>
        <p>
          Two meta-analyses found that children who mouth-breathe have, on average, both jaws set slightly further back and a longer lower face. All the studies
          compared groups at one moment, so they can&apos;t show that mouth breathing caused the difference. The tongue sits on the hyoid, the only bone in your
          body that doesn&apos;t connect to another bone.
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
        <Link href="/body?system=mouth" className={`card ${s.nextCard}`}>
          <span className={s.nextK}>See it</span>
          <span className={s.nextT}>The tongue, palate and airway at rest, in 3D</span>
        </Link>
        <Link href="/posture-looks/how-to-look-better-naturally" className={`card ${s.nextCard}`}>
          <span className={s.nextK}>Next question</span>
          <span className={s.nextT}>
            How can I look better, naturally? <Icon name="arrow" size={15} style={{ display: "inline", verticalAlign: "-2px" }} />
          </span>
        </Link>
      </div>
    </>
  );
}

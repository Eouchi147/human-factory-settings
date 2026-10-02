import Link from "next/link";
import s from "@/components/topic/topic.module.css";
import { BarsFigure, StatFigure } from "@/components/topic/Figures";
import { Plan } from "@/components/topic/Plan";
import { Icon } from "@/components/Icons";

export const meta = {
  area: "posture-looks",
  slug: "how-to-look-better-naturally",
  title: "How can I look better, naturally?",
  description:
    "The habits with the best evidence are plain ones: enough sleep, sunscreen every day, no smoking, more fruit and vegetables, and regular movement. What each does, the myths, and what to skip.",
  minutes: 4,
  updated: "1 October 2026",
};

const SOURCES: { t: string; href: string }[] = [
  { t: "Axelsson et al. 2010, beauty sleep (BMJ)", href: "https://www.bmj.com/content/341/bmj.c6614" },
  { t: "Sundelin et al. 2013, what tiredness looks like in a face", href: "https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=EXT_ID:23997369%20AND%20SRC:MED&resultType=core&format=json" },
  { t: "CDC, how much sleep you need", href: "https://www.cdc.gov/sleep/about/index.html" },
  { t: "Hughes et al. 2013, daily sunscreen and skin ageing (903 adults, 4.5 years)", href: "https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=EXT_ID:23732711%20AND%20SRC:MED&resultType=core&format=json" },
  { t: "American Academy of Dermatology, how to use sunscreen", href: "https://www.aad.org/media/stats-sunscreen" },
  { t: "American Academy of Dermatology, how to reduce premature skin ageing", href: "https://www.aad.org/public/everyday-care/skin-care-secrets/anti-aging/reduce-premature-aging-skin" },
  { t: "Guyuron et al. 2009, facial ageing in 186 pairs of identical twins (Plastic and Reconstructive Surgery)", href: "https://www.sciencedaily.com/releases/2009/02/090203110511.htm" },
  { t: "American Society of Plastic Surgeons, twins who smoke look older (2013)", href: "https://www.plasticsurgery.org/news/press-releases/face-it-twins-who-smoke-look-older-says-study-in-plastic-and-reconstructive-surgery" },
  { t: "Whitehead et al. 2012, fruit, vegetables and skin colour", href: "https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0032988" },
  { t: "Lefevre and Perrett 2015, fruit over sunbed", href: "https://research-portal.st-andrews.ac.uk/en/publications/fruit-over-sunbed-carotenoid-skin-coloration-is-found-more-attrac/" },
  { t: "Campbell and Hausenblas 2009, exercise and body image (57 programmes)", href: "https://www.sciencedaily.com/releases/2009/10/091008123235.htm" },
  { t: "Elkjaer et al. 2022, posture and how people feel and act (73 studies)", href: "https://www.psychologicalscience.org/journals/perspectives/1745691620919358/" },
  { t: "Ranehill et al. 2015, power posing and hormones in 200 people", href: "https://www.zne.uzh.ch/dam/jcr:e5fc4c3c-d50e-4aa9-96ab-4389e426d20d/Psychological%20Science-2015-Ranehill-0956797614553946.pdf" },
  { t: "Akdeniz et al. 2018, drinking water and skin hydration", href: "https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=EXT_ID:29392767%20AND%20SRC:MED&resultType=core&format=json" },
  { t: "NutraIngredients 2025, a meta-analysis of collagen supplements for skin", href: "https://nutraingredients.com/Article/2025/08/26/industry-reacts-to-meta-analysis-concluding-collagen-supplements-show-no-proven-benefit-for-skin-aging" },
  { t: "American Association of Orthodontists, the risks of mewing", href: "https://aaoinfo.org/wp-content/uploads/2025/01/Risks-of-Mewing.pdf" },
  { t: "American Academy of Dermatology, face washing 101", href: "https://www.aad.org/public/everyday-care/skin-care-basics/care/face-washing-101" },
  { t: "NHS, acne", href: "https://www.nhs.uk/conditions/acne/" },
];

const MYTHS: { q: string; v: string; a: string; href?: string }[] = [
  {
    q: "Drink lots of water and your skin will glow.",
    v: "Weak",
    a: "Only 6 studies have tested it. Extra water may slightly hydrate the outer layer of skin, mostly in people who drank little before. Drink for thirst and health, not as a skin treatment.",
  },
  {
    q: "Collagen powder turns back skin ageing.",
    v: "Weak",
    a: "A 2025 analysis of 23 trials found that the positive results came from the weaker studies; the high-quality trials found no effect.",
  },
  {
    q: "Mewing gives you a sharper jawline.",
    v: "Not supported",
    a: "American orthodontists say there's no scientific evidence for it, and that the risks outweigh any unproven benefit.",
    href: "/posture-looks/does-mewing-work",
  },
  {
    q: "Power poses boost your hormones.",
    v: "Not supported",
    a: "In 200 people, power poses didn't change testosterone or cortisol. Across 73 studies, what matters is not slumping: wide poses added almost nothing.",
  },
  {
    q: "A tan is a healthy glow.",
    v: "Not supported",
    a: "Dermatologists say every tan ages your skin early, from the sun or a sunbed. And when the amount of colour was matched, people found a fruit-and-vegetable glow more attractive than a tan.",
  },
];

export function Body() {
  return (
    <>
      <p className={s.answer}>
        The habits with the best evidence are plain ones: <em>sleep enough, wear sunscreen every day, don&apos;t smoke,</em> eat more fruit and vegetables, and
        move often. None of them is a hack, and every one of them shows, in your face and in how you feel.
      </p>
      <p className={s.meta}>
        {meta.minutes} minute read · Checked against its sources on {meta.updated}
      </p>
      <p className={s.setting}>
        <span>Factory setting</span>Your face shows how you live. Identical twins share the same genes, yet the twin who smoked longer looked older, and a single
        short night shows in your eyes and skin the next day.
      </p>

      <h2 className={s.sectionH}>
        Three things <span className="serif">to know.</span>
      </h2>

      <div className={s.suspect}>
        <div>
          <span className={s.num}>1</span>
          <h3 className={s.suspectH}>Sleep shows in your face.</h3>
          <p className={s.suspectP}>
            After a short night and a long day awake, strangers rated the same faces <b>19% more tired</b> and 6% less healthy, with droopier eyelids, darker
            circles and paler skin. Adults need 7 hours or more a night.
          </p>
        </div>
        <div className={s.visual}>
          <BarsFigure
            title="After a short night, faces rated"
            bars={[
              { name: "More tired", value: 19, shown: "+19%" },
              { name: "Less healthy", value: 6, shown: "6%", tone: "ink" },
              { name: "Less attractive", value: 4, shown: "4%", tone: "dim" },
            ]}
            max={22}
            source="Axelsson et al. 2010, BMJ"
          />
        </div>
      </div>

      <div className={s.suspect}>
        <div>
          <span className={s.num}>2</span>
          <h3 className={s.suspectH}>Sun and smoke age skin fastest.</h3>
          <p className={s.suspectP}>
            In a 4.5-year trial of 903 adults, daily sunscreen meant <b>24% less skin ageing</b> than using it now and then. In 186 pairs of identical twins, each
            10 years of smoking added 2.5 years to how old a face looked.
          </p>
        </div>
        <div className={s.visual}>
          <StatFigure
            stats={[
              { value: "24%", label: "less skin ageing with sunscreen every day, over 4.5 years" },
              { value: "2.5 years", label: "older-looking, for every 10 years of smoking, in identical twins", tone: "ink" },
            ]}
            source="Hughes et al. 2013 · Guyuron et al. 2009"
          />
        </div>
      </div>

      <div className={s.suspect}>
        <div>
          <span className={s.num}>3</span>
          <h3 className={s.suspectH}>Your colour comes from your plate.</h3>
          <p className={s.suspectP}>
            When people ate about <b>3 more portions</b> of fruit and vegetables a day, others saw a healthier skin colour within 6 weeks, from plant pigments, not
            a tan. And when the amount of colour was the same, people found that glow more attractive than a tan.
          </p>
        </div>
        <div className={s.visual}>
          <StatFigure
            stats={[
              { value: "2.91", label: "extra portions a day before skin looked healthier" },
              { value: "6 weeks", label: "for the change to show", tone: "ink" },
            ]}
            source="Whitehead et al. 2012"
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
            <p className={s.mythA}>
              {m.a}
              {m.href ? (
                <>
                  {" "}
                  <Link href={m.href}>Read the full answer.</Link>
                </>
              ) : null}
            </p>
          </li>
        ))}
      </ul>

      <h2 className={s.sectionH}>
        Starting today, <span className="serif">try this.</span>
      </h2>
      <Plan
        title="Your looks plan"
        steps={[
          { t: "Sleep 7 hours or more.", d: "It's free, and it shows in your eyes and skin the very next day." },
          { t: "Sunscreen every morning.", d: "Broad-spectrum, SPF 30 or higher, at least a teaspoon for your face, cloudy days too." },
          { t: "Add 3 portions of fruit and vegetables a day.", d: "That's about what it took for skin to look healthier within 6 weeks." },
          { t: "Move often, and don't slump.", d: "People felt better about their bodies with regular exercise; how often mattered more than how hard." },
          { t: "If you smoke, get help to stop.", d: "In twins, every 10 years of smoking added 2.5 years to how old a face looked." },
        ]}
        more={{ href: "/posture-looks/how-to-fix-my-posture", label: "Next: how to fix your posture" }}
      />

      <div className={s.doctor}>
        <h3>When it&apos;s time to see a doctor</h3>
        <p>
          See a doctor about acne if treating it yourself isn&apos;t working, if you have lots of spots or they&apos;re deep, painful or scarring, or if it&apos;s
          affecting how you feel. Wash gently twice a day, don&apos;t scrub, and stop any product that stings or burns.
        </p>
        <p>Anyone can get skin cancer, whatever their skin tone. Sunscreen and shade are for every skin.</p>
      </div>

      <details className={s.science}>
        <summary>
          The science, if you want it <span>{SOURCES.length} sources</span>
        </summary>
        <p>
          In a Stockholm sleep lab, 23 adults were photographed after a normal night and after a 5-hour night followed by 31 hours awake. 65 raters judged the
          tired faces 6% less healthy, 4% less attractive and 19% more tired. A follow-up study found hanging eyelids, redder and more swollen eyes, darker
          circles, paler skin and droopier mouth corners.
        </p>
        <p>
          In a randomised community trial in Australia, 903 adults under 55 used sunscreen every day or when they chose to; after 4.5 years, skin ageing was 24%
          less in the daily group, graded by assessors who didn&apos;t know the groups. Beta-carotene pills had no effect. In 186 pairs of identical twins, each
          10 years of smoking added 2.5 years to how old a face looked; in a second twin study, even 5 more years of smoking showed as eye bags, lip lines and
          sagging jowls.
        </p>
        <p>
          In 35 people tracked over 6 weeks, eating more fruit and vegetables turned skin slightly more golden from carotenoid pigments; others saw a healthier
          colour after 2.91 extra portions a day and a more attractive one after 3.30. In colour-matched face photos, the carotenoid glow was preferred over a tan.
          These studies were small, from one research group, and mostly used white faces.
        </p>
        <p>
          Across 73 studies, a hunched, closed posture made people feel and act worse than a neutral one (g = 0.45), while wide &ldquo;power poses&rdquo; added
          almost nothing (g = 0.06); in a retest with 200 people, power poses didn&apos;t change testosterone, cortisol or risk-taking. In 57 exercise programmes,
          people felt better about their bodies than those who didn&apos;t exercise, even without big fitness gains.
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
        <Link href="/posture-looks/how-to-fix-my-posture" className={`card ${s.nextCard}`}>
          <span className={s.nextK}>Next question</span>
          <span className={s.nextT}>How do I fix my posture?</span>
        </Link>
        <Link href="/posture-looks/does-mewing-work" className={`card ${s.nextCard}`}>
          <span className={s.nextK}>Also asked</span>
          <span className={s.nextT}>
            Does mewing work? <Icon name="arrow" size={15} style={{ display: "inline", verticalAlign: "-2px" }} />
          </span>
        </Link>
      </div>
    </>
  );
}

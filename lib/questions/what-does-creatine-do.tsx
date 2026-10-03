import Image from "next/image";
import Link from "next/link";
import s from "@/components/topic/topic.module.css";
import { Plan } from "@/components/topic/Plan";
import { Icon } from "@/components/Icons";
import { BLUR } from "@/lib/blur";

export const meta = {
  area: "fitness-strength",
  slug: "what-does-creatine-do",
  title: "What does creatine do?",
  description:
    "It refuels short, hard efforts. In trials, lifting while taking it added about 1.1 kg more lean mass than lifting alone; without exercise, 0.03 kg. It isn't a steroid, and the first kilos on the scale are mostly water.",
  minutes: 4,
  updated: "3 October 2026",
};

const SOURCES: { t: string; href: string }[] = [
  { t: "Antonio et al. 2021, common questions and misconceptions about creatine (Journal of the International Society of Sports Nutrition)", href: "https://pmc.ncbi.nlm.nih.gov/articles/PMC7871530/" },
  { t: "NIH Office of Dietary Supplements, supplements for exercise and athletic performance (for consumers)", href: "https://ods.od.nih.gov/factsheets/ExerciseAndAthleticPerformance-Consumer/" },
  { t: "NIH Office of Dietary Supplements, supplements for exercise and athletic performance (for health professionals)", href: "https://ods.od.nih.gov/factsheets/ExerciseAndAthleticPerformance-HealthProfessional/" },
  { t: "Kreider et al. 2017, ISSN position stand on creatine (Journal of the International Society of Sports Nutrition)", href: "https://pmc.ncbi.nlm.nih.gov/articles/PMC5469049/" },
  { t: "Maughan et al. 2018, IOC consensus statement on dietary supplements (British Journal of Sports Medicine)", href: "https://pmc.ncbi.nlm.nih.gov/articles/PMC5867441/" },
  { t: "Delpino et al. 2022, creatine and lean mass: 35 studies (Nutrition)", href: "https://doi.org/10.1016/j.nut.2022.111791" },
  { t: "Chilibeck et al. 2017, creatine and resistance training in older adults: 22 studies (Open Access Journal of Sports Medicine)", href: "https://www.dovepress.com/effect-of-creatine-supplementation-during-resistance-training-on-lean--peer-reviewed-fulltext-article-OAJSM" },
  { t: "Prokopidis et al. 2023, creatine and memory: a meta-analysis of trials (Nutrition Reviews)", href: "https://pmc.ncbi.nlm.nih.gov/articles/PMC9999677/" },
  { t: "Xu et al. 2024, creatine and cognitive function in adults: 16 trials (Frontiers in Nutrition)", href: "https://www.frontiersin.org/journals/nutrition/articles/10.3389/fnut.2024.1424972/full" },
  { t: "Smith et al. 2025, a creatine pilot study in Alzheimer's disease (Alzheimer's & Dementia: Translational Research)", href: "https://doi.org/10.1002/trc2.70101" },
  { t: "van der Merwe et al. 2009, creatine and the DHT to testosterone ratio in rugby players (Clinical Journal of Sport Medicine)", href: "https://doi.org/10.1097/JSM.0b013e3181b8b52f" },
  { t: "Lak et al. 2025, does creatine cause hair loss? A 12-week randomised trial (Journal of the International Society of Sports Nutrition)", href: "https://pmc.ncbi.nlm.nih.gov/articles/PMC12020143/" },
  { t: "NutraIngredients, are creatine gummies a viable delivery format? (2025, lab tests not peer reviewed)", href: "https://www.nutraingredients.com/Article/2025/07/08/are-creatine-gummies-a-viable-delivery-format/" },
  { t: "SupplySide Supplement Journal, NOW tests creatine gummies (2024, lab tests not peer reviewed)", href: "https://supplysidesj.com/supplement-regulations/now-tests-creatine-gummies-finding-almost-half-to-be-severely-understrength-" },
  { t: "American Kidney Fund, creatine: essential cautions for the kidney community (2026)", href: "https://www.kidneyfund.org/article/creatine-scoop-essential-cautions-kidney-community" },
  { t: "Royal Devon University Healthcare NHS Trust, protein advice for people with kidney disease (2025)", href: "https://www.royaldevon.nhs.uk/media/1ypo1pnl/protein-advice-for-people-with-kidney-disease-rd-25-787-001.pdf" },
];

const MYTHS: { q: string; v: string; a: string }[] = [
  {
    q: "Creatine makes your hair fall out.",
    v: "Not supported",
    a: "The scare comes from one 2009 study of 20 rugby players. It measured a hormone, DHT, and never measured hair. A 12-week trial that did measure hair found no difference from a placebo.",
  },
  {
    q: "Creatine protects against dementia.",
    v: "No proof",
    a: "In trials, memory improved a little in healthy people. There is no clinical evidence yet that creatine treats Alzheimer's disease.",
  },
  {
    q: "Gummies are an easy way to take it.",
    v: "Hit and miss",
    a: "In two lab tests, close to half the brands had almost no creatine in them: 5 of 9 in one, 5 of 12 in the other. Neither test was peer reviewed.",
  },
];

export function Body() {
  return (
    <>
      <p className={s.answer}>
        It refuels short, hard efforts. In trials, lifting while taking it added <em>a little over a kilo</em> more lean mass than lifting alone.
        Taken without exercise: 0.03 kg. It isn&apos;t a steroid.
      </p>
      <p className={s.meta}>
        {meta.minutes} minute read · Checked against its sources on {meta.updated}
      </p>
      <p className={s.setting}>
        <span>Factory setting</span>Your body makes about 1 gram of creatine a day, and keeps about 95% of it in your muscles.
      </p>

      <h2 className={s.sectionH}>
        Three things <span className="serif">to know.</span>
      </h2>

      <div className={s.suspect}>
        <div>
          <span className={s.num}>1</span>
          <h3 className={s.suspectH}>It isn&apos;t a steroid. Your body makes it.</h3>
          <p className={s.suspectP}>
            Creatine has a completely different chemical structure from anabolic steroids. Your muscles use it to <b>refuel short, hard efforts</b>; its
            effects show most in tasks under 30 seconds. Supplements top up the store by 20 to 40%.
          </p>
        </div>
        <div className={s.visual}>
          <Image src="/img/creatine_store.jpg" alt="A skeleton's muscles in red, dotted with points of light: the creatine stored inside them" width={900} height={900} sizes="260px" placeholder="blur" blurDataURL={BLUR["/img/creatine_store.jpg"]} style={{ objectFit: "cover", aspectRatio: "1 / 1" }} />
        </div>
      </div>

      <div className={s.suspect}>
        <div>
          <span className={s.num}>2</span>
          <h3 className={s.suspectH}>It works with lifting, not instead of it.</h3>
          <p className={s.suspectP}>
            Across 35 studies, people who lifted while taking creatine gained 1.1 kg more lean mass than people who only lifted. Without exercise, the
            difference was <b>0.03 kg</b>. It doesn&apos;t do the workout for you.
          </p>
        </div>
        <div className={s.visual}>
          <Image src="/img/creatine_balance.jpg" alt="A balance tipped by a red block on one pan, a tub of creatine on the shelf behind" width={900} height={900} sizes="260px" placeholder="blur" blurDataURL={BLUR["/img/creatine_balance.jpg"]} style={{ objectFit: "cover", aspectRatio: "1 / 1" }} />
        </div>
      </div>

      <div className={s.suspect}>
        <div>
          <span className={s.num}>3</span>
          <h3 className={s.suspectH}>The first kilos are mostly water.</h3>
          <p className={s.suspectP}>
            In the first weeks, the scale can go up 1 to 2 kg. That&apos;s <b>mainly water.</b>
          </p>
        </div>
        <div className={s.visual}>
          <Image src="/img/creatine_scale.jpg" alt="A skeleton's feet on a bathroom scale that reads plus two" width={900} height={900} sizes="260px" placeholder="blur" blurDataURL={BLUR["/img/creatine_scale.jpg"]} style={{ objectFit: "cover", aspectRatio: "1 / 1" }} />
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
        If you take it, <span className="serif">as in the studies.</span>
      </h2>
      <Plan
        title="Creatine, the way trials used it"
        steps={[
          { t: "Lift.", d: "In trials, it added muscle alongside resistance training, not without it." },
          { t: "3 to 5 grams a day.", d: "Studies often start with about 20 g a day, in four portions, for 5 to 7 days, then 3 to 5 g a day." },
          { t: "Expect the scale to move.", d: "Up 1 to 2 kg in the first weeks, mostly water." },
          { t: "Tell your doctor you take it.", d: "Before any routine blood test: it can raise your creatinine reading." },
        ]}
      />

      <div className={s.doctor}>
        <h3>When it&apos;s time to see a doctor</h3>
        <p>
          Kidney problems, diabetes, high blood pressure or heart disease? The American Kidney Fund says to talk to your doctor before taking any
          supplement. An NHS trust advises people with kidney disease not to take creatine.
        </p>
      </div>

      <details className={s.science}>
        <summary>
          The science, if you want it <span>{SOURCES.length} sources</span>
        </summary>
        <p>
          Your body makes about 1 g of creatine a day (NIH Office of Dietary Supplements), and skeletal muscle holds about 95% of it. Supplements raise
          muscle creatine and phosphocreatine by 20 to 40%; phosphocreatine is used to remake ATP, the muscle&apos;s fuel (ISSN position stand, 2017).
          The IOC consensus (2018) found the effects most pronounced in tasks under 30 seconds, and a likely 1 to 2 kg rise in body mass after
          loading, mainly from water retention. Creatine is not an anabolic steroid: its chemical structure is completely different (Antonio and
          colleagues, 2021).
        </p>
        <p>
          Delpino and colleagues (Nutrition, 2022) pooled 35 studies with 1,192 people: with resistance training, creatine added 1.10 kg of lean mass
          (95% CI 0.56 to 1.65); without exercise, 0.03 kg (95% CI &minus;0.65 to 0.70). In older adults who lifted, 22 studies with 721 people found +1.37 kg of lean
          tissue (95% CI 0.97 to 1.76; Chilibeck and colleagues, 2017). For memory, two meta-analyses found small gains in healthy people (Prokopidis 2023: SMD 0.29, 95% CI 0.04
          to 0.53, &ldquo;interpreted with caution&rdquo;; Xu 2024: 16 trials, 492 people, SMD 0.31, 95% CI 0.18 to 0.44, and no effect on overall
          cognitive function). A 2025 pilot in Alzheimer&apos;s disease, with 20 patients and no comparison group, notes there is no clinical evidence of
          its effects in the disease yet.
        </p>
        <p>
          The hair claim traces to van der Merwe and colleagues (2009): 20 rugby players, DHT up 56% after loading, hair not measured. Lak and colleagues
          (2025) gave 5 g a day for 12 weeks and analysed 38 men: no significant differences in DHT, the DHT to testosterone ratio, or hair growth
          against placebo. Creatine can raise serum creatinine on blood tests (American Kidney Fund); in one review, 12 studies showed no rise, 8 a rise
          within the normal range and 2 a rise above normal limits (Antonio and colleagues, 2021). The gummy tests were run for a fitness influencer
          (2025, 5 of 9 brands under 2% of the claimed creatine) and by the manufacturer NOW (2024, 5 of 12 brands with little to no creatine); neither
          was peer reviewed.
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
        <Link href="/body/kidneys" className={`card ${s.nextCard}`}>
          <span className={s.nextK}>See it</span>
          <span className={s.nextT}>Your kidneys, in 3D</span>
        </Link>
        <Link href="/weight-food/how-much-protein-do-i-need" className={`card ${s.nextCard}`}>
          <span className={s.nextK}>Next question</span>
          <span className={s.nextT}>
            How much protein do I need a day? <Icon name="arrow" size={15} style={{ display: "inline", verticalAlign: "-2px" }} />
          </span>
        </Link>
      </div>
    </>
  );
}

import Image from "next/image";
import Link from "next/link";
import s from "@/components/topic/topic.module.css";
import { Plan } from "@/components/topic/Plan";
import { Icon } from "@/components/Icons";
import { BLUR } from "@/lib/blur";

export const meta = {
  area: "habits-focus",
  slug: "does-a-dopamine-detox-work",
  title: "Does a dopamine detox work?",
  description:
    "Not as the name says. A day off doesn't lower your dopamine, and dopamine drives wanting more than liking. Its creator calls it behaviour therapy: put the phone away, or make it harder to reach. Don't cut out people or exercise for it.",
  minutes: 4,
  updated: "3 October 2026",
};

const SOURCES: { t: string; href: string }[] = [
  { t: "Harvard Health Blog, dopamine fasting: misunderstanding science spawns a maladaptive fad (2020)", href: "https://www.health.harvard.edu/blog/dopamine-fasting-misunderstanding-science-spawns-a-maladaptive-fad-2020022618917" },
  { t: "Sepah 2019, the definitive guide to dopamine fasting 2.0 (a copy of the original post)", href: "https://readmedium.com/dopamine-fasting-2-0-the-hot-silicon-valley-trend-7c4dc3ba2213" },
  { t: "Berridge and Kringelbach 2015, pleasure systems in the brain (Neuron)", href: "https://pmc.ncbi.nlm.nih.gov/articles/PMC4425246/" },
  { t: "Schultz, Dayan and Montague 1997, a neural substrate of prediction and reward (Science, PDF copy)", href: "https://web.math.princeton.edu/~sswang/fundamental-readings-for-Wang-lab-members/schultz_montague97_science.pdf" },
  { t: "Allcott et al. 2020, the welfare effects of social media (American Economic Review, PDF copy)", href: "https://www.gwern.net/doc/sociology/technology/2020-allcott.pdf" },
];

const MYTHS: { q: string; v: string; a: string }[] = [
  {
    q: "Dopamine is the pleasure chemical.",
    v: "Not how researchers put it",
    a: "Few scientists who study dopamine and reward now say in print that it causes pleasure. It drives wanting.",
  },
  {
    q: "A day without fun resets your dopamine.",
    v: "Not shown",
    a: "Harvard Health: dopamine rises with rewards, but it doesn't fall when you avoid exciting things, so a fast doesn't lower it.",
  },
  {
    q: "You have to give up all pleasure.",
    v: "Not even its creator says so",
    a: "His guide lists what it isn't: avoiding all pleasure, or not talking, socialising or exercising.",
  },
];

export function Body() {
  return (
    <>
      <p className={s.answer}>
        Not as the name says. <em>A day off doesn&apos;t lower your dopamine.</em> What can help is the part that&apos;s behaviour therapy: put the
        phone away, or make it harder to reach.
      </p>
      <p className={s.meta}>
        {meta.minutes} minute read · Checked against its sources on {meta.updated}
      </p>
      <p className={s.setting}>
        <span>Factory setting</span>Dopamine rises with rewards, and with what predicts them. It doesn&apos;t drain when you avoid them.
      </p>

      <h2 className={s.sectionH}>
        Three things <span className="serif">to know.</span>
      </h2>

      <div className={s.suspect}>
        <div>
          <span className={s.num}>1</span>
          <h3 className={s.suspectH}>Dopamine drives wanting, not liking.</h3>
          <p className={s.suspectP}>
            Raising it increased the <b>wanting</b> of a sweet taste, not the liking. People with Parkinson&apos;s, who lose much of their dopamine,
            still rate sweetness as pleasant as anyone does.
          </p>
        </div>
        <div className={s.visual}>
          <Image src="/img/dopa_gauges.jpg" alt="Three gauges: dopamine and wanting high, liking where it was" width={900} height={900} sizes="260px" placeholder="blur" blurDataURL={BLUR["/img/dopa_gauges.jpg"]} style={{ objectFit: "cover", aspectRatio: "1 / 1" }} />
        </div>
      </div>

      <div className={s.suspect}>
        <div>
          <span className={s.num}>2</span>
          <h3 className={s.suspectH}>A day off doesn&apos;t lower it.</h3>
          <p className={s.suspectP}>
            Harvard Health says dopamine doesn&apos;t fall when you avoid exciting things. Even the method&apos;s creator says it isn&apos;t about
            reducing dopamine: the name made <b>a catchy title.</b>
          </p>
        </div>
        <div className={s.visual}>
          <Image src="/img/dopa_sign.jpg" alt="A brass plaque on a dark wall, under a neon sign: title not to be taken literally" width={900} height={900} sizes="260px" placeholder="blur" blurDataURL={BLUR["/img/dopa_sign.jpg"]} style={{ objectFit: "cover", aspectRatio: "1 / 1" }} />
        </div>
      </div>

      <div className={s.suspect}>
        <div>
          <span className={s.num}>3</span>
          <h3 className={s.suspectH}>A break from one app helped a little.</h3>
          <p className={s.suspectP}>
            In a trial of 2,743 users, four weeks off Facebook freed up <b>an hour a day</b> for those who stopped, spent on things like family,
            friends and TV alone. Well-being rose slightly. Afterwards, they reported using the app 22% less.
          </p>
        </div>
        <div className={s.visual}>
          <Image src="/img/dopa_tv.jpg" alt="Seen from behind, a skeleton watches a television alone" width={900} height={900} sizes="260px" placeholder="blur" blurDataURL={BLUR["/img/dopa_tv.jpg"]} style={{ objectFit: "cover", aspectRatio: "1 / 1" }} />
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
        What the method <span className="serif">actually asks.</span>
      </h2>
      <Plan
        title="Four steps from its own guide"
        steps={[
          { t: "Pick one habit.", d: "It targets specific behaviours that are a problem for you, not all pleasure." },
          { t: "Put the phone away.", d: "Or make it harder to reach. The technique is called stimulus control." },
          { t: "Keep the good things.", d: "It encourages healthy habits that fit your values, like seeing people and exercising." },
          { t: "Expect a small change.", d: "In the big trial, well-being rose a little, and the time came back." },
        ]}
      />

      <div className={s.doctor}>
        <h3>Don&apos;t cut out the good things</h3>
        <p>
          Harvard Health warns that dopamine fasters deprive themselves of healthy things for no reason, based on faulty science and a misread
          title. The method&apos;s own guide says it isn&apos;t about avoiding talking, socialising or exercise.
        </p>
      </div>

      <details className={s.science}>
        <summary>
          The science, if you want it <span>{SOURCES.length} sources</span>
        </summary>
        <p>
          Berridge and Kringelbach (Neuron, 2015) review the evidence that dopamine is needed for the incentive value of rewards, &ldquo;wanting&rdquo;,
          but not for their hedonic impact, &ldquo;liking&rdquo;: raising dopamine increased wanting for sweetness without raising liking, and people
          with Parkinson&apos;s disease with extensive dopamine loss still gave normal liking ratings to a sweet taste. They note that relatively few
          neuroscientists who study dopamine in reward now assert in print that dopamine causes pleasure.
        </p>
        <p>
          Schultz, Dayan and Montague (Science, 1997) describe dopamine neurons in primates that fire a short burst after an unexpected reward; after
          training, the reward itself no longer does this, and the light that predicts it does.
        </p>
        <p>
          Harvard Health (2020) notes that dopamine doesn&apos;t decrease when you avoid overstimulating activities, so a &ldquo;fast&rdquo; doesn&apos;t
          lower it, and that its creator, psychiatrist Cameron Sepah, meant a method based on cognitive behavioural therapy. Sepah&apos;s guide lists
          what it is not, including reducing dopamine and avoiding all pleasure, and names stimulus control: put the phone away or make it harder to
          access. Allcott and colleagues (American Economic Review, 2020) recruited 2,743 users; deactivating Facebook for four weeks freed up 60
          minutes a day for the average person who did it, increased offline activities such as watching TV alone and socialising with family and
          friends, and improved an index of subjective well-being by 0.09 standard deviations. Afterwards, that group&apos;s reported use of the
          Facebook app was about 22% lower.
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
        <Link href="/body/brain" className={`card ${s.nextCard}`}>
          <span className={s.nextK}>See it</span>
          <span className={s.nextT}>Your brain, in 3D</span>
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

/* The body, part by part. Every "Measured" value was measured on our 3D body (rendered from
   BodyParts3D, CC BY 4.0, scaled to 1.83 m tall). Textbook values carry their source and an evidence level. */

import type { Level } from "@/components/Evidence";

export type Pt = [number, number];

export type SpecRow = { k: string; v: string; ev?: Level; evText?: string; measured?: boolean; calc?: string };

/** A leader from an anatomical point to a label. y is in image pixels; x (optional) is the label edge in image pixels,
    otherwise the label hugs the figure's left or right edge. */
export type Callout = { at: Pt; y: number; x?: number; side: "left" | "right"; kicker: string; value: string; hideBelow?: number };
export type Dim = { a: Pt; b: Pt; label?: string; sub?: string; off?: [number, number]; anchor?: "start" | "end"; hideBelow?: number };

export type SystemPage = {
  slug: string;
  name: string;
  tagline: string; // serif line under the name
  group: string; // breadcrumb group
  img: string;
  imgW: number;
  imgH: number;
  alt: string;
  alt2?: { img: string; alt: string; label: string; baseLabel: string };
  card: string; // one line for the Explore grid
  cardRows: [string, string][];
  simple: string;
  clear: string;
  expert: string;
  rows: SpecRow[];
  sources: { label: string; href?: string }[];
  callouts?: Callout[];
  dims?: Dim[];
  related?: { href: string; kicker: string; title: string }[];
  inExplore: boolean;
};

const OPENSTAX = "https://openstax.org/details/books/anatomy-and-physiology-2e";

export const SYSTEMS: SystemPage[] = [
  {
    slug: "skeleton",
    name: "Skeleton",
    tagline: "the frame that holds you up",
    group: "Frame",
    img: "/img/sys_skeleton.jpg",
    imgW: 780,
    imgH: 1000,
    alt: "The skeleton of the 3D body, from the skull to the feet",
    card: "The frame. It holds you up, protects your organs, and makes blood cells in its marrow.",
    cardRows: [
      ["Height of our 3D body", "1.83 m"],
      ["Thigh bone, the longest", "49.4 cm"],
    ],
    simple:
      "Your skeleton is the frame that holds you up. It protects your brain, heart and lungs, and the soft marrow inside some bones makes new blood cells every day.",
    clear:
      "An adult skeleton has 206 bones, joined at joints so muscles can move them. Bone is living tissue: it stores calcium, rebuilds itself all the time, and the red marrow in bones like the hips, ribs and spine makes blood cells.",
    expert:
      "206 bones in the adult: 80 in the axial skeleton and 126 in the appendicular skeleton. In adults, blood cells are made mainly in the red marrow of the axial skeleton and the ends of the long bones; bone is remodelled continuously by osteoclasts and osteoblasts.",
    rows: [
      { k: "Bones in an adult", v: "206", ev: 4 },
      { k: "Height of our 3D body", v: "1.83 m", measured: true },
      { k: "Thigh bone (femur), the longest", v: "49.4 cm on our 3D body", measured: true },
      { k: "Spine bones above the pelvis", v: "24: 7 in the neck, 12 in the chest, 5 in the lower back", ev: 4 },
      { k: "Ribs", v: "12 pairs", ev: 4 },
      { k: "Bones in each foot", v: "26", ev: 4 },
    ],
    sources: [{ label: "OpenStax Anatomy and Physiology 2e, chapters 6 to 8", href: OPENSTAX }],
    related: [],
    inExplore: true,
  },
  {
    slug: "heart-and-vessels",
    name: "Heart and vessels",
    tagline: "one pump, one closed loop",
    group: "Pump and pipes",
    img: "/img/sys_vessels.jpg",
    imgW: 780,
    imgH: 1000,
    alt: "The heart, arteries and veins of the 3D body",
    card: "A pump and a closed loop of pipes that reaches every living cell.",
    cardRows: [
      ["Heart length", "13.2 cm"],
      ["Resting heartbeat, adult", "60 to 100 a minute"],
    ],
    simple:
      "A pump and a closed loop of pipes. Arteries carry blood away from your heart, veins bring it back, and tiny capillaries in between reach almost every cell you have.",
    clear:
      "Two circuits share one heart. The right side pumps blood through the lungs to pick up oxygen; the left side pumps it around the body. Arteries carry blood out under pressure, and veins bring it back, helped by one-way valves and the squeeze of your muscles.",
    expert:
      "Pulmonary and systemic circulations in series. Blood leaves through elastic and muscular arteries, exchanges across capillaries, and returns through venules and veins, which act as the main reservoir: at rest the systemic veins hold about 64 percent of the blood volume.",
    rows: [
      { k: "Heart length on our 3D body", v: "13.2 cm", measured: true },
      { k: "Resting heartbeat, adult", v: "60 to 100 beats a minute", ev: 4 },
      { k: "Share of your blood sitting in your veins at rest", v: "about 64%", ev: 4 },
      { k: "Chambers and valves", v: "4 and 4", ev: 4 },
    ],
    sources: [
      { label: "OpenStax Anatomy and Physiology 2e, 19.1 and 20.1", href: OPENSTAX },
      { label: "Mayo Clinic, normal resting heart rate", href: "https://www.mayoclinic.org/healthy-lifestyle/fitness/expert-answers/heart-rate/faq-20057979" },
    ],
    related: [
      { href: "/body/heart", kicker: "Close-up", title: "Your heart, part by part" },
    ],
    inExplore: true,
  },
  {
    slug: "lungs",
    name: "Lungs",
    tagline: "an airway tree that splits and splits",
    group: "Air",
    img: "/img/sys_lungs.jpg",
    imgW: 780,
    imgH: 1000,
    alt: "The airway tree of the 3D body: the windpipe and its branches",
    card: "An airway tree that splits again and again, ending in tiny air sacs.",
    cardRows: [
      ["Windpipe length", "11.6 cm"],
      ["Airway tree width", "25.3 cm"],
    ],
    simple:
      "Air goes down one tube, your windpipe. It splits in two, then keeps splitting into smaller and smaller tubes, and they end in tiny air sacs where oxygen slips into your blood.",
    clear:
      "The windpipe (trachea) divides into two main bronchi, then into ever finer airways. At the ends sit hundreds of millions of alveoli, thin air sacs wrapped in capillaries, where oxygen enters the blood and carbon dioxide leaves it.",
    expert:
      "A conducting zone from the trachea to the terminal bronchioles, then a respiratory zone of respiratory bronchioles, alveolar ducts and alveoli, across about 23 generations of branching. Stereology puts the adult mean at about 480 million alveoli.",
    rows: [
      { k: "Windpipe length on our 3D body", v: "11.6 cm", measured: true },
      { k: "Airway tree width on our 3D body", v: "25.3 cm", measured: true },
      { k: "Times the airways split in two", v: "about 23", ev: 3, evText: "Good evidence" },
      { k: "Tiny air sacs (alveoli), adult", v: "about 480 million", ev: 3, evText: "Good evidence" },
    ],
    sources: [
      { label: "OpenStax Anatomy and Physiology 2e, 22.1 and 22.2", href: OPENSTAX },
      { label: "Weibel, Morphometry of the Human Lung, 1963 (airway generations)" },
      { label: "Ochs et al. 2004, the number of alveoli in the human lung", href: "https://doi.org/10.1164/rccm.200308-1107OC" },
    ],
    related: [],
    inExplore: true,
  },
  {
    slug: "digestion",
    name: "Digestion",
    tagline: "where food becomes you",
    group: "Fuel",
    img: "/img/sys_digestion.jpg",
    imgW: 780,
    imgH: 1000,
    alt: "The digestive organs of the 3D body: liver, stomach and intestines",
    card: "Where food becomes fuel and building blocks for every cell.",
    cardRows: [
      ["Liver width", "24.1 cm"],
      ["Stomach length", "15.8 cm"],
    ],
    simple:
      "Food travels one long tube from your mouth to your bowel. On the way it is ground up, soaked in acid and juices, and broken into pieces small enough to pass into your blood.",
    clear:
      "The stomach churns food with acid, the small intestine absorbs most nutrients through its folded lining, and the large intestine takes back water. The liver and pancreas add bile and enzymes that break down fats, proteins and sugars.",
    expert:
      "Mechanical and chemical digestion along the alimentary canal. Most absorption happens in the small intestine (duodenum, jejunum, ileum), whose circular folds, villi and microvilli multiply the surface area; bile emulsifies fats and pancreatic enzymes digest carbohydrates, proteins and lipids.",
    rows: [
      { k: "Liver width on our 3D body", v: "24.1 cm", measured: true },
      { k: "Stomach length on our 3D body", v: "15.8 cm", measured: true },
      { k: "Small intestine length, living adult", v: "about 3 m", ev: 4 },
      { k: "Liver weight, typical adult", v: "about 1.4 kg", ev: 4 },
    ],
    sources: [{ label: "OpenStax Anatomy and Physiology 2e, 23.1 to 23.6", href: OPENSTAX }],
    related: [
      { href: "/body/liver", kicker: "Close-up", title: "Your liver, built like a puzzle" },
      { href: "/guides/supplements", kicker: "Guide", title: "Do you need supplements?" },
    ],
    inExplore: true,
  },
  {
    slug: "brain",
    name: "Brain",
    tagline: "the control room",
    group: "Control",
    img: "/img/sys_brain.jpg",
    imgW: 780,
    imgH: 1000,
    alt: "The brain of the 3D body, seen from the side, with its folds, the cerebellum at the back and the brainstem",
    card: "The control room. It senses, decides, remembers and runs everything else.",
    cardRows: [
      ["Brain, front to back", "18.4 cm"],
      ["Nerve cells", "about 86 billion"],
    ],
    simple:
      "Your brain is the control room. It takes in what your senses report, decides what to do, stores memories, and keeps your heart and breathing going without you having to think about it.",
    clear:
      "About 86 billion nerve cells talk to each other through trillions of connections. The folded outer layer, the cortex, handles thinking, language and movement; deeper parts run sleep, hunger and emotion; the brainstem keeps you breathing.",
    expert:
      "About 86 billion neurons in the adult human brain, most of them in the cerebellum (about 69 billion) rather than the cerebral cortex (about 16 billion). At about 2 percent of body weight, the brain uses about 20 percent of the body's resting oxygen.",
    rows: [
      { k: "Brain, front to back, on our 3D body", v: "18.4 cm", measured: true },
      { k: "Nerve cells (neurons), adult", v: "about 86 billion", ev: 3, evText: "Good evidence" },
      { k: "Of those, in the cerebellum at the back", v: "about 69 billion", ev: 3, evText: "Good evidence" },
      { k: "Share of the body's oxygen, at rest", v: "about 20%, for 2% of your weight", ev: 3, evText: "Good evidence" },
    ],
    sources: [
      { label: "Azevedo et al. 2009, equal numbers of neuronal and nonneuronal cells", href: "https://doi.org/10.1002/cne.21974" },
      { label: "Raichle and Gusnard 2002, appraising the brain's energy budget", href: "https://doi.org/10.1073/pnas.172399499" },
    ],
    dims: [{ a: [240.6, 483.7], b: [579.7, 450.5], label: "18.4 cm", sub: "Front to back", off: [0, -64] }],
    related: [{ href: "/stories/why-you-wake-up-tired", kicker: "Story", title: "Why you wake up tired" }],
    inExplore: true,
  },
  {
    slug: "kidneys",
    name: "Kidneys",
    tagline: "two filters, always on",
    group: "Filters",
    img: "/img/sys_kidneys.jpg",
    imgW: 780,
    imgH: 1000,
    alt: "The two kidneys of the 3D body with their blood vessels",
    card: "Two filters that clean your blood and balance water and salt.",
    cardRows: [
      ["Left kidney, length", "11.4 cm"],
      ["Right kidney, length", "11.2 cm"],
    ],
    simple:
      "Two bean-shaped filters behind your belly. All day they clean your blood, keep what you need, and send the rest out as urine.",
    clear:
      "Each kidney holds about a million tiny filters called nephrons. Together they filter about 150 to 180 litres of fluid from your blood every day, then return about 99% of it, leaving only 1 to 2 litres of urine.",
    expert:
      "Glomerular filtration of about 180 L a day in men and 150 L a day in women, of which about 99 percent is reabsorbed along the tubules, leaving 1 to 2 L of urine. Each kidney holds on the order of a million nephrons; the left usually sits a little higher than the right.",
    rows: [
      { k: "Left kidney length on our 3D body", v: "11.4 cm", measured: true },
      { k: "Right kidney length on our 3D body", v: "11.2 cm", measured: true },
      { k: "Fluid filtered from the blood a day", v: "about 150 to 180 litres", ev: 4 },
      { k: "How much of it goes back into the blood", v: "about 99%", ev: 4 },
    ],
    sources: [{ label: "OpenStax Anatomy and Physiology 2e, 25.5", href: "https://openstax.org/books/anatomy-and-physiology-2e/pages/25-5-physiology-of-urine-formation" }],
    related: [],
    inExplore: true,
  },
  {
    slug: "heart",
    name: "Heart",
    tagline: "the pump that never stops",
    group: "Pump and pipes",
    img: "/img/heart.jpg",
    imgW: 1600,
    imgH: 1800,
    alt: "The heart of the 3D body with the arteries that feed it and the big vessels at its top",
    card: "Two pumps side by side, four chambers, four valves.",
    cardRows: [
      ["Length", "13.2 cm"],
      ["Beats in a day", "about 100,000"],
    ],
    simple:
      "Your heart is a pump about the size of your fist. It squeezes blood out to your whole body, then relaxes and fills again, around 100,000 times a day.",
    clear:
      "It is two pumps side by side. The right side sends blood to the lungs to pick up oxygen. The left side pushes it out to the body. Four valves keep the flow moving one way.",
    expert:
      "Four chambers (right and left atria, right and left ventricles) and four valves (tricuspid, pulmonary, mitral, aortic). The left and right coronary arteries arise from the aortic root and supply the myocardium.",
    rows: [
      { k: "Length on our 3D body", v: "13.2 cm", measured: true },
      { k: "Size, typical adult", v: "about 12 × 8 × 6 cm", ev: 4 },
      { k: "Weight, typical adult", v: "300 to 350 g men · 250 to 300 g women", ev: 4 },
      { k: "Resting heartbeat, adult", v: "60 to 100 beats a minute", ev: 4 },
      { k: "Beats in a day", v: "about 108,000 at 75 a minute", ev: 4 },
      { k: "Chambers and valves", v: "4 and 4", ev: 4 },
    ],
    sources: [
      { label: "OpenStax Anatomy and Physiology 2e, 19.1 (size, weight, beats a day)", href: "https://openstax.org/books/anatomy-and-physiology-2e/pages/19-1-heart-anatomy" },
      { label: "Mayo Clinic (resting rate)", href: "https://www.mayoclinic.org/healthy-lifestyle/fitness/expert-answers/heart-rate/faq-20057979" },
    ],
    dims: [{ a: [974.5, 1364.1], b: [722.6, 559.6], label: "13.2 cm", sub: "Length", off: [150, 150] }],
    callouts: [
      { at: [717.4, 471.6], y: 300, side: "left", kicker: "Aorta", value: "Main artery out of the heart" },
      { at: [597.8, 529.3], y: 536, side: "left", kicker: "Superior vena cava", value: "Blood back from the upper body", hideBelow: 620 },
      { at: [728.4, 997], y: 940, side: "left", kicker: "Right coronary artery", value: "Feeds the heart muscle itself", hideBelow: 620 },
      { at: [603, 1531.6], y: 1484, side: "left", kicker: "Inferior vena cava", value: "Blood back from the lower body", hideBelow: 620 },
      { at: [926.1, 649.1], y: 472, side: "right", kicker: "Pulmonary trunk", value: "Sends blood to the lungs" },
      { at: [884.6, 758.8], y: 704, side: "right", kicker: "Left coronary artery", value: "Feeds the heart muscle itself", hideBelow: 620 },
    ],
    related: [
      { href: "/body/heart-and-vessels", kicker: "The bigger picture", title: "How blood reaches every part of you" },
    ],
    inExplore: false,
  },
  {
    slug: "liver",
    name: "Liver",
    tagline: "a puzzle of segments",
    group: "Fuel",
    img: "/img/liver_whole.jpg",
    imgW: 1000,
    imgH: 1000,
    alt: "The liver of the 3D body, in one piece",
    alt2: { img: "/img/liver_exploded.jpg", alt: "The liver of the 3D body, pulled apart into its eight pieces", label: "Pulled apart", baseLabel: "Whole" },
    card: "Built from segments that fit together like a puzzle.",
    cardRows: [
      ["Width", "24.1 cm"],
      ["Pieces", "8"],
    ],
    simple:
      "Your liver is built from segments that fit together like a puzzle. Each one has its own blood supply and its own drain for bile, which is why a surgeon can remove some and the rest keeps working.",
    clear:
      "Surgeons divide the liver into eight functional segments. Each has its own branch of the portal vein, hepatic artery and bile duct, so segments can be removed while the rest carries on. What is left grows back: after a living donor gives up to 70% of their liver, it regrows to nearly full size in about three to four weeks.",
    expert:
      "The Couinaud classification defines eight segments by the branching of the hepatic and portal veins. Each has independent vascular inflow, outflow and biliary drainage, the basis of segmental resection. About three quarters of hepatic blood flow arrives through the portal vein.",
    rows: [
      { k: "Width on our 3D body", v: "24.1 cm", measured: true },
      { k: "Pieces (segments)", v: "8", ev: 4 },
      { k: "Where its blood comes from", v: "about 3/4 from the gut, 1/4 from the heart", ev: 4 },
      { k: "Typical adult weight", v: "about 1.4 kg", ev: 4 },
    ],
    sources: [
      { label: "OpenStax Anatomy and Physiology 2e, 23.6", href: OPENSTAX },
      { label: "Couinaud classification of liver segments (standard surgical anatomy)" },
      { label: "StatPearls, the portal venous system (blood supply)", href: "https://www.ncbi.nlm.nih.gov/books/NBK554589/" },
      { label: "Mayo Clinic, living liver donation (regrowth)", href: "https://newsnetwork.mayoclinic.org/discussion/mayo-clinic-q-and-a-living-liver-donation/" },
    ],
    dims: [{ a: [229.4, 579.2], b: [839.3, 366], label: "24.1 cm", sub: "Width", off: [-40, -110] }],
    related: [
      { href: "/body/digestion", kicker: "The bigger picture", title: "Where your food goes" },
    ],
    inExplore: false,
  },
];

export const bySlug = (slug: string) => SYSTEMS.find((s) => s.slug === slug);

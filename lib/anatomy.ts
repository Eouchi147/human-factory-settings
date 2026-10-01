/* The body, system by system: what the 3D explorer shows and says. Kept free of three.js so pages can import it.
   Geometry: BodyParts3D 4.0, (c) The Database Center for Life Science, CC BY 4.0 (the male reference body); the
   female organs and her pelvis: Human Reference Atlas, 3D Reference Organ Set for Female v1.5, Kristen Browne and
   Heidi Schlehlein (HuBMAP), CC BY 4.0. Both simplified for the web (public/model/atlas, built by scripts/atlas). Numbers in the lines below come from lib/systems.ts and lib/parts.ts,
   where each one carries its source; every other line describes what a part does, in plain words.

   Explode moves are in metres on the reference body (1.73 m tall; the engine scales them with the body to 1.83 m).
   x points to the body's left (your right when you face it), y up, z to the front. */

export type SystemId =
  | "skeleton" | "muscles" | "nervous" | "cardio" | "breathing" | "digestion" | "urinary" | "endocrine" | "immune"
  | "reproF" | "reproM"
  /** the female pelvis and spine, shown only as the x-ray behind the female organs */
  | "pelvisF";

export type Vec3 = [number, number, number];

export type PartSpec = {
  id: string; // the part's name in the model (public/model/atlas/*.json, "system/id")
  name: string;
  /** a shorter name for the label beside the body */
  short?: string;
  line: string;
  color: string;
  /** colours for pieces inside the part that differ from it (teeth in the skull, valves in the heart) */
  tones?: Record<string, string>;
  /** where the whole part travels when the system comes apart */
  move?: Vec3;
  /** move.x points outwards for each side (pairs move apart) */
  mirror?: boolean;
  /** how far its pieces drift apart, as a share of their distance from the part's centre (per axis allowed) */
  spread?: number | Vec3;
  /** spread from each side's own centre (left and right halves come apart on their own) */
  perSide?: boolean;
  /** when it starts moving, 0 to 1 through the explode */
  at?: number;
  href?: string;
  /** false: no number and no legend entry (the unnamed rest of a system) */
  label?: boolean;
  /** muscles only: how far this group lifts off, as a share of the system's float */
  float?: number;
  /** drawn only while it is picked (the breasts, far above the pelvis the female view frames) */
  onlyPicked?: boolean;
  /** the angle that explains it best when it is shown on its own (same units as the system's view) */
  view?: { turn: number; tilt: number };
};

export type SystemSpec = {
  id: SystemId;
  name: string;
  formal: string;
  line: string;
  color: string;
  color2?: string; // second colour of the chip dot (arteries and veins)
  file: "core" | "muscles" | "female";
  parts: PartSpec[];
  /** how the skeleton shows behind this system: an x-ray outline, dimmed bones, or nothing */
  context: "xray" | "bones" | "none";
  /** whose bones make that x-ray (default: the skeleton; the female organs sit in her own pelvis) */
  contextSystem?: SystemId;
  /** never offered on its own (a context for another system) */
  hidden?: boolean;
  /** draw both faces of every surface: its meshes are open where one part meets the next (the cervix and the uterus) */
  doubleSided?: boolean;
  /** where its 3D data comes from, when it is not BodyParts3D (shown in the credit line) */
  credit?: { text: string; href: string };
  /** what the camera frames, metres on the reference body (default: the whole system) */
  frame?: { y?: [number, number]; parts?: string[] };
  /** camera angle: turn (degrees, negative = from the body's right) and height above the target (degrees) */
  view: { turn: number; tilt: number };
  /** muscles lift off the bones: how far, in metres */
  float?: number;
  note?: string;
  href?: string;
};

const S = {
  bone: "#e6dac1",
  tooth: "#f4efe4",
  cart: "#c9dbd6",
};

export const SYSTEMS3D: SystemSpec[] = [
  {
    id: "skeleton",
    name: "Skeleton",
    formal: "Skeletal system",
    line: "206 bones hold you up, protect your organs and make new blood cells.",
    color: S.bone,
    file: "core",
    context: "none",
    view: { turn: -22, tilt: 4 },
    href: "/body/skeleton",
    parts: [
      { id: "skull", name: "Skull", line: "Protects your brain. The lower jaw is the only part of it that moves.", color: "#ecdfc6", tones: { tooth: S.tooth }, move: [0, 0.17, 0.02], at: 0 },
      { id: "shoulders", name: "Shoulders", line: "Your collarbones and shoulder blades join your arms to your trunk.", color: "#e3d3b4", move: [0.11, 0.1, 0], mirror: true, at: 0.06 },
      { id: "ribcage", name: "Ribcage", line: "12 pairs of ribs and your breastbone guard your heart and lungs.", color: "#eadcc3", tones: { cart: S.cart }, move: [0, 0.05, 0.14], at: 0.1 },
      { id: "spine", name: "Spine", line: "24 bones above the pelvis, stacked on soft discs, with the spinal cord running inside.", color: "#e0cfae", tones: { disc: "#bcd6d6" }, move: [0, 0, -0.16], at: 0.16 },
      { id: "arms", name: "Arms and hands", short: "Arms, hands", line: "Each hand has 8 wrist bones, 5 in the palm and 14 in the fingers.", color: "#e8dbc0", move: [0.24, 0, 0], mirror: true, at: 0.2 },
      { id: "pelvis", name: "Pelvis", line: "A ring of bone that carries the weight of your upper body to your legs.", color: "#dccaa6", move: [0, -0.11, -0.02], at: 0.26 },
      { id: "legs", name: "Legs and feet", short: "Legs, feet", line: "Your thigh bone is the longest bone you have. Each foot has 26 bones.", color: "#e5d7bb", move: [0.06, -0.22, 0], mirror: true, at: 0.3 },
    ],
  },
  {
    id: "muscles",
    name: "Muscles",
    formal: "Muscular system",
    line: "Muscles move you by pulling on your bones. They can only pull, so they work in pairs.",
    color: "#c9473c",
    file: "muscles",
    context: "bones",
    view: { turn: -24, tilt: 4 },
    float: 0.05,
    note: "Not in our 3D data yet: the abs, the big back muscles and the muscles of the face.",
    parts: [
      { id: "neck", name: "Neck", line: "Turns and tilts your head.", color: "#c4453b" },
      { id: "shoulders", name: "Shoulders", line: "Lift your arm out to the side.", color: "#c94a3e" },
      { id: "chest", name: "Chest", line: "Pulls your arm forward and across your body.", color: "#c2423a" },
      { id: "upperback", name: "Upper back", line: "Moves and steadies your shoulder blades.", color: "#bf4339" },
      { id: "biceps", name: "Biceps", line: "Bends your elbow and turns your palm up.", color: "#cc4b40" },
      { id: "triceps", name: "Triceps", line: "Straighten your elbow.", color: "#c3463c" },
      { id: "forearms", name: "Forearms", line: "Bend and straighten your wrist and fingers.", color: "#c0453b" },
      { id: "sides", name: "Sides", line: "Twist and bend your trunk, and hold your shoulder blades against your ribs.", color: "#c6483d" },
      { id: "glutes", name: "Buttocks", line: "Straighten your hip when you stand up, climb or run.", color: "#c2443a" },
      { id: "quads", name: "Front of the thigh", short: "Thigh, front", line: "Straightens your knee.", color: "#ca4a3f" },
      { id: "hamstrings", name: "Back of the thigh", short: "Thigh, back", line: "Bends your knee and straightens your hip.", color: "#c0443a" },
      { id: "shins", name: "Shins", line: "Lift your foot so your toes clear the ground.", color: "#c8483e" },
      { id: "calves", name: "Calves", line: "Lift your heel so you can walk, run and jump.", color: "#c4463c", tones: { tendon: "#eadcc6" } },
      { id: "other", name: "Other muscles", line: "", color: "#8f2f28", tones: { tendon: "#e2d2bb" }, label: false, float: 0.1 },
    ],
  },
  {
    id: "nervous",
    name: "Brain and nerves",
    formal: "Nervous system",
    line: "About 86 billion nerve cells. At rest your brain uses about 20% of your body's oxygen.",
    color: "#ebc54e",
    file: "core",
    context: "xray",
    view: { turn: -34, tilt: 8 },
    href: "/body/brain",
    note: "Our 3D data has the brain, the eyes and the nerves around them, not the spinal cord or the body's nerves.",
    parts: [
      { id: "frontal", name: "Frontal lobe", line: "Plans, decides, and starts your movements.", color: "#6f9fdb", move: [0.03, 0.03, 0.08], mirror: true, at: 0 },
      { id: "parietal", name: "Parietal lobe", line: "Feels touch and keeps track of where your body is.", color: "#e3be4f", move: [0.035, 0.07, -0.03], mirror: true, at: 0.05 },
      { id: "temporal", name: "Temporal lobe", line: "Hearing, understanding words, and memory.", color: "#69b98f", move: [0.08, -0.02, 0.01], mirror: true, at: 0.1 },
      { id: "occipital", name: "Occipital lobe", line: "Vision: it makes sense of what your eyes send.", color: "#de7e73", move: [0.03, 0.01, -0.08], mirror: true, at: 0.15 },
      { id: "cerebellum", name: "Cerebellum", line: "Fine-tunes movement and balance. It holds about 69 billion nerve cells.", color: "#b98ad8", move: [0, -0.05, -0.08], at: 0.2 },
      { id: "brainstem", name: "Brainstem", line: "Keeps you breathing and your heart beating, and links your brain to your spinal cord.", color: "#e59e5c", move: [0, -0.08, -0.01], at: 0.25 },
      { id: "white", name: "White matter", line: "Bundles of wiring that connect one part of your brain to another.", color: "#efe6da", move: [0.02, 0.015, 0], mirror: true, at: 0.3 },
      { id: "deep", name: "Deep brain", line: "Relays signals, stores memories and handles emotions.", color: "#ebc3b7", at: 0.3 },
      { id: "ventricles", name: "Ventricles", line: "Spaces filled with the fluid that cushions your brain.", color: "#7fd0e6", move: [0, 0.03, 0], at: 0.34 },
      { id: "eyes", name: "Eyes and optic nerves", short: "Eyes", line: "The optic nerves carry what your eyes see to the back of your brain.", color: "#f1ece4", tones: { eye: "#ebe4d8", lens: "#dcecf7", iris: "#6e5a44", choroid: "#4a2422", nerve: "#f2cf58" }, move: [0, -0.01, 0.1], at: 0.08, view: { turn: -32, tilt: 30 } },
      { id: "facenerves", name: "Nerves around the eyes", short: "Eye nerves", line: "Move your eyes and carry feeling from your eyes and forehead.", color: "#f2cf58", move: [0, 0.01, 0.06], at: 0.12, view: { turn: -50, tilt: 24 } },
    ],
  },
  {
    id: "cardio",
    name: "Heart and vessels",
    formal: "Cardiovascular system",
    line: "A pump about the size of your fist. It beats about 100,000 times a day.",
    color: "#d8392f",
    color2: "#3b57b6",
    file: "core",
    context: "xray",
    view: { turn: -14, tilt: 4 },
    href: "/body/heart-and-vessels",
    parts: [
      { id: "atria", name: "Upper chambers", line: "The atria collect the blood coming back to your heart.", color: "#b8382f", move: [0, 0.09, 0], at: 0, href: "/body/heart" },
      { id: "ventricles", name: "Lower chambers", line: "The ventricles pump blood out: the right side to your lungs, the left side to your body.", color: "#a52f29", tones: { papillary: "#cf6a5c" }, move: [0, -0.08, 0], at: 0.04, href: "/body/heart" },
      { id: "valves", name: "Valves", line: "Four one-way doors that keep your blood moving forward.", color: "#ead8c2", move: [0, 0.01, 0.03], at: 0.08, href: "/body/heart" },
      { id: "coronary", name: "Heart's own vessels", short: "Heart vessels", line: "The coronary arteries feed the heart muscle itself.", color: "#e0473a", tones: { vein: "#4a66c4" }, move: [0.12, -0.02, 0.02], at: 0.12, href: "/body/heart" },
      { id: "aorta", name: "Aorta", line: "Your main artery. It carries blood from the left side of your heart to your body.", color: "#e6493d", move: [-0.36, 0, 0], at: 0.22 },
      { id: "arteries", name: "Arteries", line: "Carry blood away from your heart.", color: "#d0342a", move: [-0.36, 0, 0], at: 0.22 },
      { id: "venacava", name: "Big veins", line: "The two venae cavae bring blood back into the right side of your heart.", color: "#4c69cc", move: [0.36, 0, 0], at: 0.26 },
      { id: "veins", name: "Veins", line: "Bring blood back to your heart. At rest they hold about 64% of your blood.", color: "#3a55b4", move: [0.36, 0, 0], at: 0.26 },
    ],
  },
  {
    id: "breathing",
    name: "Breathing",
    formal: "Respiratory system",
    line: "Air goes down a tree of tubes that ends in about 480 million tiny air sacs.",
    color: "#f0a7a3",
    file: "core",
    context: "xray",
    view: { turn: -20, tilt: 4 },
    href: "/body/lungs",
    note: "The lungs are shown as their airway trees.",
    parts: [
      { id: "nose", name: "Nose", line: "Warms, moistens and filters the air you breathe in.", color: "#e8b6a8", tones: { cart: "#d9e5e0" }, move: [0, 0.08, 0.04], at: 0 },
      { id: "throat", name: "Throat", line: "Carries air to your windpipe and food to your food pipe.", color: "#d98c82", move: [-0.08, 0.05, -0.02], at: 0.05 },
      { id: "voicebox", name: "Voice box", line: "Holds your vocal cords. A flap, the epiglottis, covers it when you swallow.", color: "#e3b3a8", tones: { cart: "#d4e2dc" }, move: [0.08, 0.02, 0.04], at: 0.1 },
      { id: "windpipe", name: "Windpipe", line: "A tube held open by rings of cartilage.", color: "#ecc6bb", move: [0, 0, 0.02], at: 0.15 },
      { id: "rightlung", name: "Right lung", line: "Shown as its airway tree, which branches into its three lobes.", color: "#f0a99f", move: [-0.1, 0, 0], at: 0.2 },
      { id: "leftlung", name: "Left lung", line: "Shown as its airway tree. It has two lobes, leaving room for your heart.", color: "#e89cb0", move: [0.1, 0, 0], at: 0.24 },
      { id: "diaphragm", name: "Diaphragm", line: "Your main breathing muscle. It pulls down to draw air in.", color: "#b84d42", move: [0, -0.14, 0], at: 0.3 },
    ],
  },
  {
    id: "digestion",
    name: "Digestion",
    formal: "Digestive system",
    line: "About 3 metres of small intestine take in most of what you eat.",
    color: "#e39a63",
    file: "core",
    context: "xray",
    view: { turn: -18, tilt: 4 },
    href: "/body/digestion",
    parts: [
      { id: "mouth", name: "Tongue and saliva glands", short: "Tongue, glands", line: "Saliva starts breaking down starch while your tongue moves food to swallow.", color: "#cf6e6e", tones: { gland: "#e7b988" }, move: [0, 0.07, 0.02], at: 0 },
      { id: "esophagus", name: "Food pipe", line: "Squeezes food down to your stomach in waves.", color: "#d9897b", move: [0, 0.04, 0], at: 0.04 },
      { id: "stomach", name: "Stomach", line: "Mixes food with acid, then lets it out a little at a time.", color: "#e79c86", move: [0.16, 0.07, 0.02], at: 0.08 },
      { id: "liver", name: "Liver", line: "About 1.4 kg, in 8 segments. It processes what you absorb from food.", color: "#8e352a", move: [-0.17, 0.08, 0.02], at: 0.12, href: "/body/liver" },
      { id: "gallbladder", name: "Gallbladder and bile ducts", short: "Gallbladder", line: "Store bile from the liver and squeeze it into your gut to help digest fat.", color: "#5f9147", move: [-0.15, -0.09, 0.06], at: 0.16 },
      { id: "pancreas", name: "Pancreas", line: "Makes digestive juices, and insulin to control your blood sugar.", color: "#e8c277", tones: { duct: "#d9b26a" }, move: [0.15, -0.06, 0.05], at: 0.2 },
      { id: "smallgut", name: "Small intestine", line: "Where most of your food is digested and taken in.", color: "#eba58c", move: [0, -0.17, 0.04], at: 0.24 },
      { id: "largegut", name: "Large intestine", line: "Takes back water and holds what's left until you go.", color: "#c99062", move: [0, -0.07, -0.03], at: 0.28 },
    ],
  },
  {
    id: "urinary",
    name: "Kidneys and bladder",
    formal: "Urinary system",
    line: "Two filters that clean 150 to 180 litres of fluid from your blood every day.",
    color: "#d4b05a",
    file: "core",
    context: "xray",
    view: { turn: -14, tilt: 4 },
    href: "/body/kidneys",
    parts: [
      { id: "kidneys", name: "Kidneys", line: "Filter your blood. About 99% of what they filter goes back into it.", color: "#9e3c33", move: [0, 0.05, 0], spread: [1.0, 0, 0], at: 0 },
      { id: "ureters", name: "Ureters", line: "Two thin tubes that carry urine down to your bladder.", color: "#e5c88e", spread: [0.45, 0, 0], at: 0.1 },
      { id: "bladder", name: "Bladder", line: "Stores urine until you go.", color: "#e2be7e", move: [0, -0.08, 0.02], at: 0.2 },
    ],
  },
  {
    id: "endocrine",
    name: "Hormones",
    formal: "Endocrine system",
    line: "Glands that send chemical messages, called hormones, through your blood.",
    color: "#c98be0",
    file: "core",
    context: "xray",
    view: { turn: -20, tilt: 4 },
    note: "Not in our 3D data yet: the thyroid and parathyroid glands.",
    parts: [
      { id: "hypothalamus", name: "Hypothalamus", line: "Part of your brain that runs your hormones through the pituitary.", color: "#e9a3b5", move: [-0.05, 0.03, 0], at: 0 },
      { id: "pituitary", name: "Pituitary gland", short: "Pituitary", line: "Pea-sized, under your brain. It tells other glands what to do.", color: "#e8b04a", move: [0.05, -0.03, 0.02], at: 0.06 },
      { id: "pineal", name: "Pineal gland", short: "Pineal", line: "Releases melatonin when it gets dark.", color: "#a6c96f", move: [0, 0.06, -0.03], at: 0.12 },
      { id: "adrenals", name: "Adrenal glands", short: "Adrenals", line: "Sit on your kidneys and release adrenaline and cortisol.", color: "#e58c3a", move: [0, 0.05, 0], spread: [0.8, 0, 0], at: 0.18 },
      { id: "pancreas", name: "Pancreas", line: "Releases insulin and glucagon to keep your blood sugar steady.", color: "#e8c277", move: [0, -0.06, 0.04], at: 0.24 },
    ],
  },
  {
    id: "immune",
    name: "Immune organs",
    formal: "Lymphatic system",
    line: "Organs that train and store the white blood cells that fight infection.",
    color: "#6cc08b",
    file: "core",
    context: "xray",
    view: { turn: -20, tilt: 4 },
    note: "Not in our 3D data yet: lymph nodes, lymph vessels and tonsils.",
    parts: [
      { id: "thymus", name: "Thymus", line: "Trains white blood cells called T cells. It shrinks after puberty.", color: "#e3a9c0", move: [0, 0.06, 0.03], at: 0 },
      { id: "spleen", name: "Spleen", line: "Filters your blood and recycles old red blood cells.", color: "#7d3352", move: [0.11, 0, 0], at: 0.12 },
    ],
  },
  {
    id: "reproF",
    name: "Reproductive organs",
    formal: "Female reproductive system",
    line: "Makes eggs and the hormones of the monthly cycle, and can carry a pregnancy.",
    color: "#d76a7a",
    file: "female",
    context: "xray",
    contextSystem: "pelvisF",
    doubleSided: true,
    // the camera keeps to her pelvis; the breasts are framed when picked
    frame: { parts: ["ovaries", "tubes", "uterus", "cervix", "vagina", "ligaments"] },
    view: { turn: -26, tilt: 10 },
    note: "From a second 3D dataset, the Human Reference Atlas female set, in her own pelvis. Not in it yet: the vulva (the outer genitals).",
    credit: {
      text: "3D anatomy: Human Reference Atlas female organ set v1.5, Kristen Browne and Heidi Schlehlein (HuBMAP), CC BY 4.0, simplified",
      href: "https://doi.org/10.48539/HBM352.BTSQ.586",
    },
    parts: [
      { id: "ovaries", name: "Ovaries", line: "Hold your eggs and make the hormones estrogen and progesterone.", color: "#ecb8a6", move: [0.05, 0.02, 0.02], mirror: true, at: 0 },
      { id: "tubes", name: "Fallopian tubes", short: "Tubes", line: "Catch each egg an ovary releases. This is usually where sperm meets the egg.", color: "#f0a0ae", move: [0.03, 0.035, 0.03], mirror: true, at: 0.06 },
      { id: "uterus", name: "Uterus", line: "A muscular organ where a pregnancy grows. Its lining sheds each month as a period.", color: "#d76a7a", move: [0, 0.03, 0.05], at: 0.12 },
      { id: "cervix", name: "Cervix", line: "The neck of the uterus, opening into the vagina.", color: "#c25a6a", move: [0, -0.015, -0.02], at: 0.18 },
      { id: "vagina", name: "Vagina", line: "The muscular canal from the cervix to the outside of the body.", color: "#e3909b", move: [0, -0.06, -0.02], at: 0.24 },
      { id: "ligaments", name: "Ligaments", line: "Bands and thin sheets that hold the uterus, tubes and ovaries in place.", color: "#eadbd0", tones: { sheet: "#f2e4dc" }, move: [0, 0.01, -0.07], at: 0.3 },
      { id: "breasts", name: "Breasts", line: "Milk glands and the ducts that lead from them to the nipple, set in fat.", color: "#f0c4ae", tones: { lobe: "#efb9a6", duct: "#e29a86", fat: "#f6dfa0", areola: "#b97a6c", sheet: "#f2e4dc" }, move: [0.04, 0.03, 0], mirror: true, at: 0.3, onlyPicked: true, view: { turn: -24, tilt: 4 } },
    ],
  },
  {
    id: "reproM",
    name: "Reproductive organs",
    formal: "Male reproductive system",
    line: "Makes sperm and the hormone testosterone, and delivers sperm.",
    color: "#c8786a",
    file: "core",
    context: "xray",
    frame: { y: [0.72, 0.96] },
    view: { turn: -40, tilt: 6 },
    note: "Not in our 3D data yet: the sperm ducts (vas deferens) and the scrotum.",
    parts: [
      { id: "testes", name: "Testes", line: "Make sperm and the hormone testosterone.", color: "#ebb3a3", move: [0.03, -0.05, 0.03], mirror: true, at: 0 },
      { id: "epididymis", name: "Epididymis", line: "A coiled tube on each testis where sperm mature and are stored.", color: "#d98e7e", move: [0.05, -0.03, 0.045], mirror: true, at: 0.06 },
      { id: "seminal", name: "Seminal vesicles", short: "Seminal vesicles", line: "Make fluid that feeds sperm and becomes part of semen.", color: "#e3c07c", move: [0.04, 0.05, -0.045], mirror: true, at: 0.12 },
      { id: "prostate", name: "Prostate", line: "A walnut-sized gland under the bladder. It adds fluid to semen and wraps around the urethra.", color: "#c8786a", move: [0, -0.02, -0.06], at: 0.18 },
      { id: "penis", name: "Penis", line: "Spongy tissue that fills with blood for an erection. The urethra runs through it.", color: "#dc8f80", tones: { glans: "#c9707a", spongiosum: "#e6a595" }, move: [0, -0.01, 0.07], at: 0.24 },
      { id: "urethra", name: "Urethra", line: "Carries urine, and semen, out of the body.", color: "#ead39c", at: 0.3 },
    ],
  },
  {
    id: "pelvisF",
    name: "Pelvis",
    formal: "Female pelvis",
    line: "",
    color: "#e6dac1",
    file: "female",
    context: "none",
    hidden: true,
    view: { turn: -26, tilt: 10 },
    parts: [{ id: "bones", name: "Bones", line: "", color: "#e6dac1", label: false }],
  },
];

/** Which system each tappable part of the home page's body opens in the explorer. */
export const SYSTEM_FOR_PART: Record<string, SystemId> = {
  skeleton: "skeleton", heart: "cardio", vessels: "cardio", lungs: "breathing", liver: "digestion", stomach: "digestion", gut: "digestion",
  kidneys: "urinary", brain: "nervous", nerves: "nervous",
};

export const SYSTEM_ORDER: SystemId[] = ["skeleton", "muscles", "nervous", "cardio", "breathing", "digestion", "urinary", "endocrine", "immune", "reproF", "reproM"];
/** female and male share one button, with a switch between them */
export const REPRO: SystemId[] = ["reproF", "reproM"];
export const systemById = (id: string) => SYSTEMS3D.find((s) => s.id === id);

/** The whole body at rest: every system but the muscles, which would hide everything else. */
export const WHOLE_BODY: SystemId[] = ["skeleton", "nervous", "cardio", "breathing", "digestion", "urinary", "endocrine", "immune"];

/** Names on the whole body: tap one to open its system. Points are on the body (metres, reference body). */
export const WHOLE_LABELS: { key: string; name: string; system: SystemId; at: Vec3; color: string }[] = [
  { key: "brain", name: "Brain", system: "nervous", at: [0, 1.67, 0.05], color: "#ebc54e" },
  { key: "lungs", name: "Lungs", system: "breathing", at: [-0.075, 1.33, 0.05], color: "#f0a7a3" },
  { key: "heart", name: "Heart", system: "cardio", at: [0.025, 1.3, 0.065], color: "#d8392f" },
  { key: "liver", name: "Liver", system: "digestion", at: [-0.065, 1.19, 0.08], color: "#c06a4a" },
  { key: "stomach", name: "Stomach", system: "digestion", at: [0.06, 1.18, 0.09], color: "#e79c86" },
  { key: "gut", name: "Intestines", system: "digestion", at: [0, 1.01, 0.08], color: "#eba58c" },
  { key: "kidneys", name: "Kidneys", system: "urinary", at: [0.065, 1.11, -0.01], color: "#d4b05a" },
  { key: "vessels", name: "Blood vessels", system: "cardio", at: [0.085, 0.7, 0.025], color: "#3b57b6" },
  { key: "bones", name: "Skeleton", system: "skeleton", at: [-0.075, 0.46, 0.02], color: "#e6dac1" },
];

/** Lines through the limbs and trunk that muscles lift away from (metres, reference body, left side; the right side mirrors x). */
export const BODY_AXES: Vec3[][] = [
  [[0, 0.92, 0], [0, 1.46, 0]], // trunk
  [[0, 1.46, -0.01], [0, 1.72, 0]], // neck and head
  [[0.17, 1.4, -0.023], [0.215, 1.115, -0.03], [0.25, 0.89, 0.015], [0.265, 0.79, 0.035]], // arm: shoulder, elbow, wrist, hand
  [[0.085, 0.9, -0.02], [0.073, 0.45, -0.02], [0.068, 0.07, -0.025], [0.11, 0.02, 0.08]], // leg: hip, knee, ankle, toes
];

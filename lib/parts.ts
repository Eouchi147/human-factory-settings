/* The parts of the 3D body people can tap, in plain words. Kept free of three.js so pages can import it cheaply.
   Facts match lib/systems.ts, where each one carries its source. */

export type Part = "skeleton" | "heart" | "lungs" | "liver" | "stomach" | "gut" | "kidneys" | "brain" | "vessels" | "nerves";

/** Which groups of the 3D model make up each part (see public/model/body.glb). */
export const GROUPS_OF: Record<Part, string[]> = {
  skeleton: ["legs", "spine", "ribs", "arms", "skull", "teeth"],
  heart: ["heart"],
  lungs: ["airways", "diaphragm"],
  liver: ["liver"],
  stomach: ["stomach"],
  gut: ["gut"],
  kidneys: ["kidneys"],
  brain: ["brain"],
  vessels: ["arteries", "veins"],
  nerves: ["nerves"],
};

export const PARTS: Record<Part, { name: string; line: string; href: string }> = {
  brain: { name: "Brain", line: "About 86 billion nerve cells. At rest it uses about 20% of your body's oxygen.", href: "/body/brain" },
  heart: { name: "Heart", line: "A pump about the size of your fist. It beats about 100,000 times a day.", href: "/body/heart" },
  lungs: { name: "Lungs", line: "Air goes down a tree of tubes that ends in about 480 million tiny air sacs.", href: "/body/lungs" },
  liver: { name: "Liver", line: "About 1.4 kg. It processes what you absorb from food, and it can grow back after surgery.", href: "/body/liver" },
  stomach: { name: "Stomach", line: "It mixes food with acid, then lets it out into your intestines a little at a time.", href: "/body/digestion" },
  gut: { name: "Intestines", line: "About 3 metres of small intestine take in most of what you eat.", href: "/body/digestion" },
  kidneys: { name: "Kidneys", line: "Two filters that clean 150 to 180 litres of fluid from your blood every day.", href: "/body/kidneys" },
  skeleton: { name: "Skeleton", line: "206 bones hold you up, protect your organs and make new blood cells.", href: "/body/skeleton" },
  vessels: { name: "Blood vessels", line: "Arteries carry blood out from your heart. Veins bring it back.", href: "/body/heart-and-vessels" },
  nerves: { name: "Nerves", line: "They carry messages between your brain and the rest of your body.", href: "/body/brain" },
};

/** The order parts appear in as chips on the body page. */
export const PART_ORDER: Part[] = ["skeleton", "heart", "vessels", "lungs", "brain", "nerves", "liver", "stomach", "gut", "kidneys"];

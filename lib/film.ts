/* "Your body builds itself": the first short film. Timings match the renderer (r3d/assembly.js). */

export const FILM = {
  src: "/film/fig01.mp4",
  poster: "/img/poster_fig01.jpg",
  length: 18,
  width: 720,
  height: 1280,
};

/** The parts in the order they land, with a plain line for each. t0 and t1 are seconds into the film. */
export const CUES: { n: string; t0: number; t1: number; d: string }[] = [
  { n: "Feet and legs", t0: 0.5, t1: 2.0, d: "The frame starts from the ground up." },
  { n: "Spine", t0: 1.7, t1: 3.2, d: "Bones stacked one on top of another." },
  { n: "Ribs", t0: 2.9, t1: 4.2, d: "12 pairs close around your chest." },
  { n: "Arms", t0: 3.6, t1: 5.0, d: "They hang from the shoulders." },
  { n: "Heart", t0: 5.0, t1: 5.9, d: "The pump, behind your breastbone." },
  { n: "Airways", t0: 5.4, t1: 6.6, d: "Tubes for air, branching into the lungs." },
  { n: "Liver", t0: 5.9, t1: 7.2, d: "It arrives piece by piece, like a puzzle." },
  { n: "Stomach", t0: 6.6, t1: 7.5, d: "Where food is churned with acid." },
  { n: "Gut", t0: 7.0, t1: 8.8, d: "Laid out in the order food travels." },
  { n: "Kidneys", t0: 8.2, t1: 9.0, d: "Two filters that clean your blood." },
  { n: "Brain", t0: 8.8, t1: 10.3, d: "The control room." },
  { n: "Skull", t0: 9.9, t1: 11.3, d: "It closes over the brain to protect it." },
  { n: "Teeth", t0: 10.9, t1: 11.6, d: "Where digestion starts." },
  { n: "Arteries", t0: 11.4, t1: 13.2, d: "They carry blood out from the heart." },
  { n: "Veins", t0: 12.2, t1: 14.0, d: "They bring blood back to it." },
  { n: "Nerves", t0: 13.4, t1: 14.6, d: "They carry messages to and from the brain." },
  { n: "All together", t0: 15.8, t1: 18.0, d: "Every part in its place. The heart beats and the lungs breathe." },
];

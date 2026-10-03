/* Every question page that exists. Each one exports its meta and its body. */
import * as tired from "./why-am-i-always-tired";
import * as posture from "./how-to-fix-my-posture";
import * as looks from "./how-to-look-better-naturally";
import * as mewing from "./does-mewing-work";
import * as feet from "./are-barefoot-shoes-good-for-your-feet";
import * as fascia from "./what-is-fascia";
import * as steps from "./how-many-steps-a-day";
import * as bellyfat from "./how-to-lose-belly-fat";
import * as protein from "./how-much-protein-do-i-need";
import * as fallAsleep from "./how-to-fall-asleep-faster";

export const QUESTIONS = [tired, posture, looks, mewing, feet, fascia, steps, bellyfat, protein, fallAsleep];
export const questionFor = (area: string, slug: string) => QUESTIONS.find((q) => q.meta.area === area && q.meta.slug === slug);

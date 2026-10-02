/* Every question page that exists. Each one exports its meta and its body. */
import * as tired from "./why-am-i-always-tired";
import * as posture from "./how-to-fix-my-posture";
import * as looks from "./how-to-look-better-naturally";
import * as mewing from "./does-mewing-work";
import * as feet from "./are-barefoot-shoes-good-for-your-feet";
import * as fascia from "./what-is-fascia";

export const QUESTIONS = [tired, posture, looks, mewing, feet, fascia];
export const questionFor = (area: string, slug: string) => QUESTIONS.find((q) => q.meta.area === area && q.meta.slug === slug);

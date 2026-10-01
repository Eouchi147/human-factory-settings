/* Every question page that exists. Each one exports its meta and its body. */
import * as tired from "./why-am-i-always-tired";

export const QUESTIONS = [tired];
export const questionFor = (area: string, slug: string) => QUESTIONS.find((q) => q.meta.area === area && q.meta.slug === slug);

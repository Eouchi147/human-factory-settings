/* Production notes for the films: storyboard, voice lines and house rules.
   Internal only. Nothing in this file is shown on the public site. */

/** Storyboard: frame, timecode, on screen, sound, long-form voice line (booth numbering). ‖ marks a pause. */
export const BOARD: { img: string; tc: string; on: string; sound: string; line: string; vo: string }[] = [
  { img: "/img/sb_1.jpg", tc: "00:01.2", on: "Feet and legs drop into place, bottom first.", sound: "Soft clicks, small bones to large.", line: "1", vo: "Before anything else, ‖ you need a frame." },
  { img: "/img/sb_2.jpg", tc: "00:03.4", on: "The spine stacks; the ribs swing shut around it.", sound: "A rising run of taps.", line: "4", vo: "Each vertebra stacks ‖ on the one below, ‖ **twenty-four** of them." },
  { img: "/img/sb_3.jpg", tc: "00:05.5", on: "The heart slides in behind the breastbone.", sound: "The first heartbeat, 64 a minute.", line: "6", vo: "Then the pump: ‖ four chambers, ‖ four valves." },
  { img: "/img/sb_4.jpg", tc: "00:06.8", on: "The liver lands piece by piece.", sound: "Puzzle-piece clicks.", line: "7", vo: "The liver arrives in **segments**, ‖ each with its own blood supply." },
  { img: "/img/sb_5.jpg", tc: "00:08.4", on: "The gut is laid in the order food travels.", sound: "One long slide.", line: "8", vo: "The gut is laid ‖ in the order food travels." },
  { img: "/img/sb_6.jpg", tc: "00:10.2", on: "The brain assembles, then the skull closes over it.", sound: "A low hush.", line: "9", vo: "About **eighty-six billion** neurons ‖ settle in." },
  { img: "/img/sb_7.jpg", tc: "00:12.6", on: "Arteries grow out from the heart; veins follow back.", sound: "The pulse wave, once a beat.", line: "10", vo: "Arteries carry blood out. ‖ Veins bring it back." },
  { img: "/img/sb_8.jpg", tc: "00:16.8", on: "The whole body, measured at 1.73 m. The title.", sound: "A swell, then quiet.", line: "11", vo: "You came with ‖ **factory settings.**" },
];

export const RULES: { t: string; d: string }[] = [
  { t: "One camera, one path", d: "The camera glides on a single smooth curve. It never cuts and never stops dead." },
  { t: "Dominoes, not slides", d: "Each part starts moving before the last one lands, so the eye is always carried to the next." },
  { t: "Real parts, true places", d: "Every piece is a measured part of one reference body, landing where it really sits." },
  { t: "One claim on screen", d: "A label appears only while its part is in view, with its number, and leaves before the next." },
  { t: "The body keeps living", d: "Once in place the heart beats 64 times a minute and the lungs breathe 14 times a minute." },
  { t: "The word lands with the part", d: "In long-form, each line is timed so its key word arrives as its part settles, never before." },
];

export const STATS: [string, string][] = [
  ["18 s", "one shot"],
  ["60", "frames a second"],
  ["0", "cuts"],
  ["16", "systems, in order"],
];

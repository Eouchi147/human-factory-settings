# Human Factory Settings

A free, measured reference to how the human body and mind were built. Every render comes from one
adult reference body (BodyParts3D, CC BY 4.0), every claim carries the strength of its evidence, and
every page reads at three depths: Simple, Clear and Expert.

This is the v0 preview. It is deployed on Vercel and kept out of search engines (`noindex`) until launch.

## Stack

- Next.js (App Router), React, TypeScript, static generation for every page
- Motion for springs, scroll reveals and layout animation
- Our own liquid glass material: refraction maps computed in the browser for each glass surface
  (Chromium), frosted glass elsewhere
- Self-hosted fonts: Archivo, Instrument Serif, Geist Mono (SIL Open Font License)

## Map

| Route | What it is |
| --- | --- |
| `/` | Home: the measured reference body, the three doors, the film, the evidence meter |
| `/explore`, `/explore/[slug]` | Six systems and the heart and liver spec sheets, with measured overlays |
| `/stories/why-you-wake-up-tired` | Scroll story in six stations |
| `/restore`, `/restore/sleep-and-caffeine` | Settings to restore and the 7-day caffeine plan |
| `/you` | The quiz: two measured traits, the temperament names as tradition, a communication style |
| `/films`, `/films/fig-01` | The films and the Fig. 01 player with its cue sheet |
| `/guides/weight`, `/guides/supplements` | The two deep guides, rendered from `content/guides/*.md` |
| `/library` | How we grade evidence, A to Z, reviewers and funding, credits, sources |

## Run it

```bash
npm install
npm run dev
```

## Content rules

- No em or en dashes in copy.
- Numbers measured on the reference body are marked "Measured"; everything else carries an evidence level and a source.
- The health guides stay marked as drafts until a licensed reviewer signs them off.
- Credit line: BodyParts3D, © The Database Center for Life Science, licensed under CC Attribution 4.0 International. Rendered and measured by Human Factory Settings.

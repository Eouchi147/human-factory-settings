# Human Factory Settings: the film pipeline, for any agent

Read this whole file before you touch anything. It is the process Claude has run for Sam since 3 October 2026, step for
step, with the same gates. Where this file and your habits disagree, this file wins. Where this file is silent, ask Sam.

## 0. Rules that never bend

1. **Never push `main`.** Every push to main redeploys the public site. Work on `films-new-direction-1-3`.
   Results come back on their own branches (`check-out/*`, `render-out/*`). Never force-push.
2. **No purchases, no accounts, no secrets typed by you, no paid services.** Everything here is free (the repo is
   public, so GitHub Actions minutes are free). If something needs money or a login, stop and ask Sam.
3. **Do not work around errors from GitHub's API** (403 and the like). Use `git push` and `git fetch` only, through
   `scripts/film/agent/hfs.py`.
4. **Heavy work runs on GitHub's machines, never on Sam's computer.** Rendering, the checks, the voice: all of it goes
   through `hfs.py` branches. Locally you only edit files, run `git`, and run `hfs.py`.
5. **Nothing reaches Sam unless every gate says PASS and you have looked at the contact sheet yourself.**
   A run that "succeeded" can still be broken: on 7 October three films came back "success" at 0.1 to 0.4 seconds long.
   `verdict.txt` exists to catch that. Trust the verdict and your eyes, never the word "success".
6. **Sam is often overwhelmed.** Hand him very few, very small actions. Results first, numbers not process, no jargon.
   Ask him when you are unsure about anything that matters; never guess on content, health claims or anything public.
7. **No em dashes and no en dashes** anywhere Sam or a viewer will read them (scripts, captions, pages, messages).
   Use commas, colons or full stops.
8. **Truth first.** Every number in a film comes from a source you opened and quoted. If you cannot open the source,
   the number does not go in. Nothing illegal or against platform rules; flag anything in a grey area to Sam.

## 1. What the project is

36 vertical health Shorts (1080 x 1920, 24 fps, about 80 s, one continuous 3D shot with no cuts, a BodyParts3D skeleton
in a dark studio), three a week from 20 Oct 2026 to 9 Jan 2027. Each film has a page on the site. Sam records the final
voice himself; the AI voice is only a guide for timing. The list, dates and stages are in `scripts/film/agent/STATUS.md`
(keep it current: it is the tracker you own).

**The direction (Sam, 3 Oct):** natural, traditional, basic care that brings the body back to its factory settings:
movement, structure, posture, gait, fascia, stretching, breathing, real food over empty calories, natural supplements
and old remedies that hold up, nourishment and behaviour, the effects of bad habits. The message under every film:
a good life goes through a healthy life.

**The narrator:** savage, direct and funny. Calls out the viewer's habits (never the viewer's body). Every line a full,
clear sentence. Life, not studies: at most one number per beat, sources live on the page. Natural, basic care, never a
replacement for medical care.

**Shape of every script:** hook (the habit, called out) · the factory setting (how the body is built to work) · what the
habit costs · the way back (concrete, doable) · a plain warning with the red flags of the health service you cite,
when the topic needs one · sign-off, always exactly: "Let's get you back to factory settings."

**Guardrails:**
- "Proven by time" is not proof. A traditional practice goes in only when the evidence holds up. Some old remedies harm.
- Evidence words: "linked to" for observational studies, "in trials" for trials, "no proof" when evidence is missing,
  "a link, not proof" where it matters.
- No AI "doctor" character. No real or AI-made people, no skin, no gore, no stock footage.
- Platforms: no YouTube ads on videos teaching unproven remedies for medical conditions; TikTok keeps unproven
  minor-illness remedies off For You. EU, French, Canadian and US health-claim rules bite once a film is sponsored or
  sells something: none of ours do. Flag to Sam before any brand, product name or affiliate appears.
- Trademarks: no brand names or logos in the picture (film 3 lost a sign because the name was a registered mark).

**Design language:** night-first; one signal orange `#FF6A2B`, for settings only; fonts Archivo, Instrument Serif,
Geist Mono (already in the kit). Every film ends on the logo dial (`logoEnd`), and carries:
- **one factory stamp:** "HUMAN FACTORY SETTINGS" inked into one 3D part that stays on screen, discreet but readable
  on pause in one close view (`stamp`, `stampSpot` in `kit.js`);
- **one visual gag:** true, and never near a warning line.

## 2. Where things are

| What | Where |
| --- | --- |
| Scripts (one per film) | `content/films/NN-slug.json` (format: copy `18-cold-showers.json`) |
| Film code | `scripts/film/films/filmNN.src.js` (with a `//@HANDS@` line) built into `filmNN.js` |
| Engine, props, rig, hands | `scripts/film/kit.js`, `props.js`, `rig.js`, `hands_block.js`, `soft.js` |
| Sound | `scripts/film/sound_filmNN.py` (model: `sound_film18.py`), kit `sfx.py` |
| Timing table the sound reads | `scripts/film/timingNN.json` (exported by the film as `window.HFS_W.timing`) |
| Voice guides | `scripts/film/voice/NN-slug-voice-guide.wav` and `NN-slug-report.json` (word times) |
| Checks | `audit_film.py`, `jump_check.py`, `tags_check.py`, `caps_clear.py`, `check_caps.py`, `pgerr.py` |
| The pipeline's commands | `scripts/film/agent/hfs.py` (this kit) |
| Kit history, every trick so far | `scripts/film/README.md` (read it once, all of it) |
| Tracker | `scripts/film/agent/STATUS.md` |

## 3. The commands

All from inside the repo, on `films-new-direction-1-3`, after committing your changes (branches are built from HEAD).

```
python3 scripts/film/agent/hfs.py voice NN          # AI voice guide, word times, recording script  (~10 min)
python3 scripts/film/agent/hfs.py check NN          # every check on the picture + contact sheet     (~30-60 min)
python3 scripts/film/agent/hfs.py render NN         # the film, on a free render/batch-K branch      (~60-100 min)
python3 scripts/film/agent/hfs.py status            # what is rendering, what is back, PASS or FAIL
python3 scripts/film/agent/hfs.py fetch voice|check|render NN   # download a result into out/, print its verdict
python3 scripts/film/agent/hfs.py deliver NN --to "/Users/sam/Desktop/Projects/Health /Human Factory Settings"
```

Notes: the Health folder's name ends with a space (`Health `). `deliver` refuses a render that is not PASS.
Up to four films render at once (`render/batch-1` to `-4`); `render` picks a free one, or say `--batch K`.
A run that has not come back after 2 hours: push it again (`hfs.py render NN --batch K`, same batch).

## 4. One film, start to finish

Do the steps in order. Do not start a step until the one before has passed.

### Step 1. Research and script
1. Find the best evidence: systematic reviews, large trials, national health services (NHS, CDC, Health Canada,
   WHO, ameli.fr). Open every page you take a fact from. Prefer sources from the last ten years.
2. Write `content/films/NN-slug.json`: same keys as film 18 (`n`, `slug`, `question`, `area`, `page`, `posts`,
   `lines`, `sources`, `speed: 1.0`, `voice_style: "savage"`, `frame`). Each line: `say` (one or two full sentences),
   `src` (source keys), optional `gap` (pause after, seconds). `sources`: each key maps to the full citation AND the
   exact sentences you relied on, quoted from the source.
3. Length: the voice must end around 75 to 78 s (the film runs about 2.5 s more for the logo). Roughly 190 to 210
   words. TikTok pays only above one minute.
4. Self-check before moving on: every number traceable to a quote; the warning line names real red flags from a
   health service; the hook calls out a habit; the gag idea is true; no dashes; the sign-off is exact.
5. Sam wants as few decisions as possible, so do not ask him to approve each script. Ask him first only when a script
   touches medicines, pregnancy, children, a remedy that can harm, or anything you are unsure is true. The film stays
   "Writing" in STATUS.md until its voice guide is done.

### Step 2. Voice guide
`hfs.py voice NN`, wait, `hfs.py fetch voice NN`. Check `verdict.txt` is PASS and the guide ends 75 to 78 s
(`voice.log` prints the duration). Copy `NN-slug-voice-guide.wav` and `NN-slug-report.json` from
`out/check-out_filmNN-voice/` into `scripts/film/voice/` and commit them. The same result holds Sam's recording
script (`.rtf`) and the guide as audio (`.m4a`): `hfs.py deliver NN --to ...` puts them in his folders 1 and 2.
Set STATUS to "Ready to record".
Build the picture only from the guide `hfs.py voice` made for that film: a guide made again can shift words by about
0.1 s, so never mix two guides for one film.

### Step 3. Picture
Write `scripts/film/films/filmNN.src.js`. Start from the newest film (18), not from an old one: copy its structure
(T table, the set, `build`, the body, the camera, `update`, CAPS, `makeFilm`). `T` holds the start of every word you
key to, from the report's word times; `T.end` = the voice's end + about 2.7 s; `T.logo` about 2.5 s before the end.
Build: `python3 -c "s=open('scripts/film/films/filmNN.src.js').read(); open('scripts/film/films/filmNN.js','w').write(s.replace('//@HANDS@', open('scripts/film/hands_block.js').read()))"`

Standards for the picture (each one was a fix on a past film):
- **Posture (from film 18 on):** the skeleton stands like an athlete: upright, shoulders back, arms relaxed, palms
  facing the body, never palm up: `makeWrist(R, Side, { pronate: true })` and a `STAND_ARM` with `pro` about 1.45.
- **Walking:** a proper gait with `walkAt` from `rig.js` (feet planted, heel to toe, hips over the stance foot).
- **Hands:** use `solveHand` / `solveHugArm` and `H.fit(sdf)` so fingers stop just off what they hold. Never let
  fingers close before the thing they close on is there. Keep hands and forearms about 12 mm off ribs, pelvis and the
  other arm (film 18's `solveHug` shows how to add a clearance cost to the solver).
- **Captions:** the skeleton never sits behind the words. Captions sit at `top` 268 to 300 px, size 74 to 92, at most
  four lines. If a camera move must pass behind them, declare a `shade` window (the deep scrim) for exactly that move.
- **Printed words in the scene** (labels, screens, signs) stay out of the bottom fifth of the frame and out of the
  right-hand button column (x above 85%).
- **Portrait framing:** keep the subject's top below about 33% of the frame height; stack stations vertically.
- **No sliver of the skeleton cut by the frame edge** in a held shot: reframe (move the camera across, narrow the fov).
- **Motion:** nothing may jump between frames. Rhythmic motion (typing, chattering, tapping) uses smooth curves
  (cosines), at most about 3 strokes a second, eased in and out over 0.3 to 0.4 s.
- Export the timing table the sound needs: `W.timing = {...}` at the end of the film.

### Step 4. Sound
Write `scripts/film/sound_filmNN.py` modelled on `sound_film18.py`: every cue from `timingNN.json` (write that file
from your `W.timing` values), rhythms computed from the same formulas the picture uses (so clicks land on frames),
a pad per section, whooshes on the camera moves, `m.logo_end` at the logo, `m.finish(...)`. Run it locally only if
you have Python with numpy, scipy and soundfile; the render runs it anyway and `sound.log` must start with `ok`.

### Step 5. Checks (the gate before rendering)
Commit, then `hfs.py check NN`, wait, `hfs.py fetch check NN`. Every line of `verdict.txt` must be `ok`:
- collisions (audit_film): 0 problems. Nothing through bone, prop or floor; nothing inside the head.
- pops (jump_check): 0. No bone or prop moving far more in one frame than in the frames either side.
- printed words (tags_check): 0 stretches.
- bones behind captions (caps_clear): 0 stretches.
- caption lines (check_caps): 0 problems.
- page errors (pgerr): none.
Then **open `sheet.png` and look at all 24 stills.** Check: posture as above; captions readable and clear; the gag
reads; the stamp is there; framing clean; nothing odd (a floating prop, a hand through a table, an empty frame).
Any FAIL or anything odd: fix (section 5), commit, check again. Loop until all `ok` and the sheet is clean.

### Step 6. Render
Commit, `hfs.py render NN`, wait (`hfs.py status`), then `hfs.py fetch render NN`. Gates in `verdict.txt`: run status
success; every frame rendered (missing 0); sound ok; two cuts; each cut's length within 1 s of `T.end`; the checks again.
**Look at the contact sheet of the finished cut.** Then play the start, a middle and the end of the "for your voice" cut
if you can.

### Step 7. Deliver
`hfs.py deliver NN --to "/Users/sam/Desktop/Projects/Health /Human Factory Settings"` copies:
"Film NN, music and effects (for your voice).mp4" into **4 Films waiting for your voice** and
"Film NN voice guide (AI voice, not for posting).mp4" into **2 Voice guides (not for posting)**.
Never into **5 Ready to post** (that is after Sam's voice is mixed in). Check the files are there and play.
Set STATUS to "Picture done". Tell Sam in one or two lines.

## 5. Fixes that worked (use these before inventing new ones)

| Problem the checks reported | Fix that passed |
| --- | --- |
| Bone behind a caption on a held shot | caption `top` 268 and size 74 to 78, or wrap to three lines; move the camera |
| Bone behind a caption during a camera move | a `shade` window over exactly that move |
| Printed words in the bottom fifth | lower the camera and its look point a few cm (moves the scene up), or narrow the fov |
| Fingers popping while typing | smooth cosine strokes at about 2.6 to 3.5 per second, eased in and out over 0.4 s |
| Hands through ribs or the other arm (a hug) | clearance cost in the arm solver; arms fold in one after the other; fingers close only once the target is under them |
| Hip bones into a seat | sit point = seat top + `W.sitDrop` + 3 mm |
| A prop through the floor | its legs or base end at y = 0 |
| A frame missing on GitHub | nothing to fix in the film: render again, the farm re-renders dropped frames |

## 6. When something breaks
- A check log says "no result line": the check crashed or timed out. Read its last lines in `out/`, fix, re-check.
- `hfs.py` refuses because of uncommitted changes: commit them (it builds branches from HEAD on purpose).
- Two failed renders of the same film in a row with no change: stop and tell Sam what you saw.
- Anything about money, accounts, publishing, posting, or main: stop and ask Sam.

## 7. What you hand Sam, and when
- After a script that needs his eye (step 1.5): its question, the line in doubt, and a yes/no question (one message).
- After delivery: "Film NN is in folder 4 (and its guide in folder 2). All checks passed." Nothing else.
- Recording deadlines are in STATUS.md: remind him once, a week before each batch is due, with the folder to open.

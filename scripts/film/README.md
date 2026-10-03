# Films: how they are made

Every film is one continuous 3D shot, about 60 to 70 seconds, 1080 x 1920 at 24 frames a second.
Every frame is a pure function of time, so any stretch of a film can be re-rendered on its own.

## The kit (shared by every film)
- `kit.js`: the film engine. Shared maths (easing, keyframes, one camera path with no cuts), materials, lights,
  the real anatomy loader (`loadAnatomy(select)`: BodyParts3D, each part centred on itself so it can move and fade),
  the stage (renderer, the dark room, the walnut table and its reflection, depth of field, bloom, camera motion blur,
  grain, vignette), the words on screen (word-by-word captions, tags placed on 3D points), the logo end
  (`logoEnd`: the 2D logo lands exactly on a 3D dial) and `makeFilm(F)`, which turns a film definition into a renderable film.
- `props.js`: objects that recur: the clock, the cup, the dials, the phone, the lamp, and `makeLogoRing`
  (a dial drawn exactly like the logo, so any scene can end on it).
- `film.html?f=filmNN`: the page a film renders in (fonts, overlay layer).
- `films/filmNN.js`: one film = its timeline `T` (word starts from the voice guide), its world, its camera path,
  what happens at each moment, and its words on screen.
- `film_render.py`: renders frames with Playwright and software WebGL (Mesa llvmpipe through ANGLE by default;
  `FILM_GL=swiftshader` for the old path). `--film filmNN` picks the film. `--blur` adds sub-frames where things move
  fast on their own (each film lists those stretches in `fast`); the camera's own motion is blurred in the page.
- `sfx.py`: the sound kit: pads, plucks, bells, pulses, ticks, whooshes, thuds, clinks, the series' logo chord,
  the voice ducking, and the two stems. `sound_filmNN.py` places one film's cues.
- `assemble_film.py N frames snd`: the high-quality master (kept), the clean cut for Sam's voice (HEVC, sized to send)
  and the voice guide cut (label, subtitles, AI voice).
- `voice/guide_film.py`: the AI voice guide from `content/films/NN-slug.json` (Kokoro-82M, Apache 2.0, via kokoro-onnx),
  with line and sentence timings. `voice/word_times.py` adds word start times, so picture beats can land on words.

Film 1 (`film1.js`, `index_film.html`, `sound_film1.py`, `assemble_final.py`) was made before the kit and keeps its own files.

## Inputs not in this repo
- The web anatomy model: `public/models` of github.com/Eouchi147/human-atlas (served next to the page as `models/`).
- three.js 0.170 (`node_modules/three`), @fontsource Archivo, Geist Mono and Instrument Serif (`fontmods/`).
- The Kokoro model files `kokoro-v1.0.onnx` and `voices-v1.0.bin` (kokoro-onnx GitHub releases).

## Run (film 2)
```
python3 voice/guide_film.py ../../content/films/02-posture.json guides
python3 voice/word_times.py ../../content/films/02-posture.json guides/02-posture-report.json
python3 film_render.py frames2 --film film02 --w 1080 --h 1920 --fps 24 --t0 0 --t1 69.6 --blur --shadow 2048
python3 sound_film02.py guides/02-posture-voice-guide.wav guides/02-posture-report.json snd02
python3 assemble_film.py 2 frames2 snd02
```

## Added on 2 October
- `rig.js`: a skeleton rig built on the real anatomy (spine, arms, legs with foot IK on any ground) and a walk cycle
  (`walkAt`), so a skeleton can walk, climb and stand. Film 3 walks up a hill; films 6, 21 and 33 will reuse it.
- **Re-timing** (`retime.py`, `build_retime.py`, `retime/filmNN.json`): when the words change, the picture follows
  the new voice instead of being rebuilt. Anchors pair a moment in the new voice with the same moment in the film;
  a monotone curve through them maps every frame (`--retime` in `film_render.py`), and the sound places its cues
  through the inverse curve. Films 1 and 2 were re-timed to the narrator's new lines this way.
- **Motion blur that follows the subject**: a film can declare `carrier(S, t)` (what the camera rides with, like a
  walker); blur is then measured against it, so the subject stays sharp while the world moves. The blur also never
  smears a near object onto the far background (no more ghost copies on fast orbits).
- `films/film03.js` (10,000 steps), `sound_film03.py`: the footsteps and the pedometer's clicks come from the same
  walk the picture uses.
- `render_film.sh <film> <outdir> <t1> <port> [retime json]`: a full render in two halves; resumable.

## Every new film, from film 3 on
- **One factory stamp.** "HUMAN FACTORY SETTINGS" is inked into one 3D part that stays on screen, so the mark cannot
  be cropped off a reposted copy (`stamp`, `stampSpot`, `stampLine`, `labelCanvas`, `stampCanvas` in `kit.js`). It is
  projected inside the part's own shader: no extra geometry, and it moves with the part. Keep it discreet (ink at about
  60%, letters well under a centimetre on a bone) but readable on pause in at least one close or side view. Film 3:
  along the outer face of the right thigh bone.
- **One visual gag.** True, and never near a warning line. Film 3 (3 October version): a "10,000" card dangles from a
  rod on the skeleton's own headband, like a carrot before a donkey; on "slogan" it spins round to SLOGAN, and on
  "doesn't need ten thousand steps" the whole contraption falls off. (The first film 3 used the 万歩計 neon sign; 万歩計 is
  a registered trademark of Yamasa Tokei Keiki, so the new dial says TEN-THOUSAND-STEPS METER in English instead.)

## 3 October: the new direction (films 1 to 3 rebuilt)
Natural, basic care that returns the body to its factory settings; a narrator who calls the viewer out, savage and
funny, in full sentences. Films 1 to 3 were rebuilt as `films/film01.src.js`, `film02.src.js` and `film03.src.js`
(with the `//@HANDS@` line; build the `.js` as below), with new sound scripts.
- `probe_views.py FILM OUT '[[t, view|null], ...]'`: quick 360 x 640 frames and a contact sheet. `EXPR='<js>'` prints a
  page expression after each frame (camera, bone positions). A film's `pose` returns `S.cfg.view` when one is set.
- `solveHand(..., aims, extra)`: `extra(A)` adds a posture cost; film 3 uses it so the phone call keeps the elbow down
  and in front instead of out to the side.
- Camera holds: a key's `tens` (0.25 to 0.4) on the first key of a hold stops the path overshooting. For a walker,
  store the keys relative to him (film 3's `CAM`: each key minus his position at that time, added back per frame),
  so a hold holds on him and the tension does not leave him walking into the lens.
- Close-ups that lock onto a moving part (film 3's dial) read the part's offset once per frame, at the posed time, so
  the shutter's two ends agree and the motion blur does not smear it.
- Films 13 to 18 were rewritten on 3 October (15 is now "Why do I get hangry?"; dopamine detox moved to
  `content/films/later/`). Their pictures will be rebuilt for the new scripts; the table below describes the old ones.


## Films 4 to 8, and what each added
- **Film 4** (belly fat): `soft.js`, soft tissue skinned to the rig: muscle that spans a joint and a layer of fat, built
  in the standing frame and bent with the bones every frame (`skinned`, `spineBinder`, `armBinder`, fat fields).
- **Film 5** (protein): props built for one film (an end-cap of "PROTEIN" packs, cream cubes counted out, kitchen scales).
- **Film 6** (barefoot shoes): shoes lofted from point slices (`loft` in `films/film06.js`) and skinned to the foot, with
  the toes as their own group, so a walking skeleton wears them; a walking pad whose display counts the trial's weeks.
- **Film 7** (mewing): a specimen that is not the whole skeleton. `head7/build_head7.py` cuts BodyParts3D's head and
  neck down the midline, keeps the right half, closes the cut faces and writes `models/head7.glb` (one node per part,
  named `group|material|name`) and `models/head7.json` (landmarks). Run it once before rendering film 7
  (it needs `scripts/atlas` and the BodyParts3D source). The tongue and lips are bent on the CPU with morph targets.
- **Film 8** (falling asleep): a skeleton in bed. The rig lies down, sits up on the bed's edge, reads and lies back
  (`poseRig` and `placeBody` in `films/film08.js`); the mattress and pillow take the body's imprint, measured from the
  bones in each pose. A sleep timer on the bedside table (0 to 45 minutes) carries the numbers and becomes the logo.

## Rendering one film, from film 4 on
```
python3 film_render.py frames8 --film film08 --w 1080 --h 1920 --fps 24 --t0 0 --t1 81.3 --blur --shadow 2048
python3 sound_film08.py guides/08-fall-asleep-voice-guide.wav guides/08-fall-asleep-report.json snd08
python3 assemble_film.py 8 frames8 snd08
```
`render_film.sh film08 frames8 81.3 8895` does the first line in two halves at once (resumable).

Stamps and gags since: film 7, the stamp on the cut face of the chin, the gag a placard whose byline ("by one
orthodontist") is deleted for a trending hashtag; film 8, the stamp across the breastbone, the gag one foot keeping
time to the march on the headphones while the skeleton tries hard to fall asleep.

## Films 9 to 18: stamps and gags
| Film | Gag | Stamp |
| --- | --- | --- |
| 9, the calming breath | the do-nothing group's place in the trial, empty | breastbone |
| 10, foam rolling | the word RELEASE peels off the roller and falls on the mat | front of the breastbone |
| 11, creatine | the hair-loss scare: the skeleton combs its bald skull | down the front of the left shin bone |
| 12, mouth taping | before and after photo frames stand up: identical | left temple |
| 13, lower back | a gold trophy: "No. 1 cause of disability, worldwide" | back of the sacrum |
| 14, intermittent fasting | the plate clock's brand reads DIET | breastbone |
| 15, dopamine detox | a plaque under the neon: TITLE NOT TO BE TAKEN LITERALLY | back of the skull |
| 16, water | the water it drinks falls through it, into a bucket | the bucket |
| 17, building muscle | a double-biceps flex where nothing bulges | cast into the weight plate |
| 18, cold showers | the jaw chatters, with nothing to shiver | the stock tank |

## Since film 16
- `hands_block.js`: a wrist and a hand that can hold (wrist joint, finger curls, `solveHand` to put a grip on a point
  with the forearm and palm turned toward given directions). Films 17 and 18 are written as `films/filmNN.src.js` with a
  `//@HANDS@` line; `films/filmNN.js` is that file with the block pasted in (the page loads the `.js`):
  `python3 -c "s=open('films/film18.src.js').read(); open('films/film18.js','w').write(s.replace('//@HANDS@', open('hands_block.js').read()))"`
- Film 18 adds a jaw on its own hinge that chatters (`W.jawG`), and `solveHugArm`, a hand solver that keeps the upper
  arm hanging, for arms crossed over the chest.
- Portrait framing rule: keep the subject's top below about 33% of the frame height, under a four-line caption, and
  lay out stations for 9:16 (stack things vertically; a 2 m wide layout needs the camera 3.5 m away).
- `stills_clean.py FILM 't1,t2' OUTDIR`: full frames with no words on screen, for the site's pages (then
  `page_images.py` crops the squares).

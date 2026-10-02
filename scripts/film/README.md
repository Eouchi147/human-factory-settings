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

# Films: how they are made

Film 1, "Always tired?": one continuous 3D shot, 63 seconds, 1080 x 1920 at 24 frames a second.
Every frame is a pure function of time, so any stretch of the film can be re-rendered on its own.

## Parts
- `film1.js`: the whole film. The world (table, clock, cup, lamp, phone, dials, the brain), the timeline `T`
  (taken from the voice guide's line timings), one camera path with no cuts, lighting per act, the words on screen,
  and the film look (depth of field, bloom, camera motion blur, grain, vignette).
- `scene.js`: loads the real anatomy (BodyParts3D 4.0, (c) The Database Center for Life Science, CC BY 4.0).
- `index_film.html`: the page the frames are rendered in (fonts, words on screen).
- `film_render.py`: renders frames with Playwright and software WebGL. `--blur` adds sub-frames where things move
  on their own (the time-lapse hands, the dials' clicks, the hands swinging home); the camera's own motion is
  blurred in the page on every frame.
- `sound_film1.py`: the score and sound effects, all synthesised (no samples, no licence), ducked under the voice.
- `assemble_final.py`: two cuts from the same frames: music and effects only (for Sam's voice), and the voice guide
  (AI voice, labelled "not for posting", subtitles).
- `voice/`: the AI voice guides (Kokoro-82M, Apache 2.0, via kokoro-onnx) and their line timings.

## Inputs not in this repo
- The web anatomy model: `public/models` of github.com/Eouchi147/human-atlas (served next to the page as `models/`).
- three.js 0.170 (`node_modules/three`), @fontsource Archivo, Geist Mono and Instrument Serif (`fontmods/`).
- The Kokoro model files `kokoro-v1.0.onnx` and `voices-v1.0.bin` (kokoro-onnx GitHub releases).

## Run
```
python3 film_render.py frames --w 1080 --h 1920 --rw 720 --rh 1280 --fps 24 --t0 0 --t1 63 --blur
python3 sound_film1.py voice-guide.wav voice/film1-report.json snd
python3 assemble_final.py
```

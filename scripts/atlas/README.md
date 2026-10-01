# The explorer's 3D model

Builds `public/model/atlas/core.{json,bin}` and `muscles.{json,bin}` from BodyParts3D 4.0
((c) The Database Center for Life Science, CC BY 4.0), as prepared by the human-atlas project.

1. `classify.py` sorts each of the 2,234 meshes into a body system and a legend part (left out: skin and hair,
   reproductive organs, the urethra, membranes and tiny pieces).
2. `python3 build_atlas.py out` simplifies each piece, merges the ones that never move apart, and writes raw data.
   Set `ATLAS_SRC` to the folder with `atlas.json` and `body-*.bin`. Needs numpy and fast_simplification.
3. `node encode.mjs core ../../public/model/atlas 13` and `node encode.mjs muscles ../../public/model/atlas 13`
   quantise positions to 13 bits and compress with meshoptimizer (vertex codec v0, read by three's decoder).
   Needs `npm i meshoptimizer`. Normals are rebuilt in the browser.

What each system shows and says (names, colours, legend lines, how parts move apart) lives in `lib/anatomy.ts`.

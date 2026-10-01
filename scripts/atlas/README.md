# The explorer's 3D model

Builds `public/model/atlas/core.{json,bin}` and `muscles.{json,bin}` from BodyParts3D 4.0
((c) The Database Center for Life Science, CC BY 4.0), as prepared by the human-atlas project, and
`female.{json,bin}` from the Human Reference Atlas 3D Reference Organ Set for Female v1.5 (Kristen Browne and
Heidi Schlehlein, HuBMAP, 2023, CC BY 4.0, https://doi.org/10.48539/HBM352.BTSQ.586): her reproductive organs,
breasts, and the pelvis and spine shown as an x-ray behind them. The human-atlas project dropped its female set;
get it from its history: `git show d72b4f6:public/models/atlas-female.json` and `female-0.bin` to `female-9.bin`
(github.com/Eouchi147/human-atlas, a full clone), into one folder, and point `ATLAS_SRC_F` at it.

1. `classify.py` sorts each mesh into a body system and a legend part (left out: skin and hair, membranes and
   tiny pieces).
2. `ATLAS_RAW=1 ATLAS_SRC_F=<female folder> python3 build_atlas.py out` leaves out the source's duplicate copies of a mesh, rounds coarse meshes
   with Loop subdivision (so the bladder or a femur stays smooth up close), merges the pieces that never move apart,
   and writes raw data. Set `ATLAS_SRC` to the folder with `atlas.json` and `body-*.bin`. Needs numpy, trimesh and
   fast_simplification (the last one only without `ATLAS_RAW=1`).
3. `node encode.mjs core ../../public/model/atlas 13`, then the same for `muscles` and `female`,
   simplify each piece down to a fixed error in metres (its table is at the top of the file: small parts like the
   eye keep their detail), quantise positions to 13 bits and compress with meshoptimizer (vertex codec v0, read by
   three's decoder). Needs `npm i meshoptimizer`. Normals are rebuilt in the browser.

`focus.{json,bin}` holds the close-up views (`node encode.mjs focus ...`), built by `focus.py` from the same
BodyParts3D meshes when `build_atlas.py` runs (skip it with `ATLAS_FOCUS=0`):
- feet: the right foot's bones, small muscles, the lower ends of the three leg muscles that sling its arches and the long
  plantar ligament; the plantar fascia is not in the data, so it is drawn in (a thin fan under the sole muscles)
- posture: the spine in four regions (the explorer hides the skeleton's own copy and draws the textbook plumb line)
- mouth: the mouth and throat cut down the middle, right half kept, cut faces closed (trimesh, watertight meshes)
- fascia: the right thigh's muscles, IT band and femur, and the fascia sleeve the data lacks, drawn a few millimetres
  outside the muscles (voxel envelope) and split in eight strips that open like petals
Shapes that are drawn in are named "(drawn)" in the pieces and on screen. `landmarks.py` measures the points for the
lines the explorer draws (the foot's three arches, the posture line's landmarks); its output is copied into
`lib/anatomy.ts`. `source.py` reads meshes from the human-atlas files for both.

What each system shows and says (names, colours, legend lines, how parts move apart) lives in `lib/anatomy.ts`.

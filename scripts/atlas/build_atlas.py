"""Build the systems model for the 3D explorer.

Sources: BodyParts3D 4.0, (c) The Database Center for Life Science, CC BY 4.0, as prepared by the human-atlas
project (2,234 meshes); and for the female organs, the Human Reference Atlas 3D Reference Organ Set for Female v1.5
(Kristen Browne and Heidi Schlehlein, HuBMAP, CC BY 4.0), as prepared by the same project (ATLAS_SRC_F). Every mesh
is sorted into a system and a legend part (classify.py), simplified, and either kept as its own piece (so it can
move on its own in the exploded view) or merged with the rest of its part. Output, per file (core = everything but
muscles and the female set; muscles = the muscles; female = the female organs and the pelvis behind them):
  <out>/<file>.raw.bin   positions as float32, normals as float32, indices as uint32, piece after piece
  <out>/<file>.pieces.json   one row per piece: system, part, material, tone, side, counts
The Node step (encode.mjs) quantises and compresses these with meshoptimizer.
"""
import json, os, sys
from collections import defaultdict
import numpy as np
import fast_simplification as fsimp
import trimesh
import re
from classify import classify, classify_female, side as side_of

# the BodyParts3D meshes as prepared by the human-atlas project (atlas.json + body-*.bin)
MODELS = os.environ.get("ATLAS_SRC", "/home/claude/eouchi147/human-atlas/public/models")
OUT = sys.argv[1] if len(sys.argv) > 1 else "out"
os.makedirs(OUT, exist_ok=True)

A = json.load(open(os.path.join(MODELS, "atlas.json")))
chunks = {}


def chunk(ci):
    if ci not in chunks:
        chunks[ci] = open(os.path.join(MODELS, A["chunks"][ci]["url"].split("/")[-1]), "rb").read()
    return chunks[ci]


# how much detail each part keeps (fraction of triangles), the smallest piece worth drawing (bounding-box
# diagonal in metres), and whether its pieces are merged into one (they then move together)
DEFAULT = {"keep": 0.3, "min": 0.0, "merge": False}
SPEC = {
    ("skeleton", "skull"): {"keep": 0.22}, ("skeleton", "spine"): {"keep": 0.16}, ("skeleton", "ribcage"): {"keep": 0.22},
    ("skeleton", "arms"): {"keep": 0.34}, ("skeleton", "legs"): {"keep": 0.3}, ("skeleton", "pelvis"): {"keep": 0.4},
    ("skeleton", "shoulders"): {"keep": 0.3},
    ("muscles", "other"): {"keep": 0.16, "min": 0.012}, ("muscles", "sides"): {"keep": 0.1}, ("muscles", "forearms"): {"keep": 0.22},
    ("muscles", "chest"): {"keep": 0.3}, ("muscles", "upperback"): {"keep": 0.3},
    ("nervous", "frontal"): {"keep": 0.3}, ("nervous", "parietal"): {"keep": 0.3}, ("nervous", "temporal"): {"keep": 0.34},
    ("nervous", "occipital"): {"keep": 0.36}, ("nervous", "cerebellum"): {"keep": 0.4}, ("nervous", "brainstem"): {"keep": 0.3, "merge": True},
    ("nervous", "deep"): {"keep": 0.22}, ("nervous", "white"): {"keep": 0.2}, ("nervous", "ventricles"): {"keep": 0.25, "merge": True},
    ("nervous", "eyes"): {"keep": 0.08, "merge": True}, ("nervous", "facenerves"): {"keep": 0.2, "merge": True}, ("nervous", "spinalcord"): {"keep": 1.0},
    ("cardio", "atria"): {"keep": 0.6}, ("cardio", "ventricles"): {"keep": 0.5}, ("cardio", "valves"): {"keep": 0.35},
    ("cardio", "arteries"): {"keep": 0.13, "min": 0.03, "merge": True}, ("cardio", "veins"): {"keep": 0.13, "min": 0.03, "merge": True},
    ("cardio", "aorta"): {"keep": 0.6, "merge": True}, ("cardio", "venacava"): {"keep": 0.8, "merge": True},
    ("cardio", "coronary"): {"keep": 0.25, "min": 0.012, "merge": True},
    ("breathing", "nose"): {"keep": 0.5, "merge": True}, ("breathing", "throat"): {"keep": 0.12, "merge": True},
    ("breathing", "voicebox"): {"keep": 0.12}, ("breathing", "windpipe"): {"keep": 0.8},
    ("breathing", "rightlung"): {"keep": 0.45, "min": 0.01}, ("breathing", "leftlung"): {"keep": 0.45, "min": 0.01},
    ("breathing", "diaphragm"): {"keep": 0.3},
    ("digestion", "mouth"): {"keep": 0.8}, ("digestion", "esophagus"): {"keep": 1.0}, ("digestion", "stomach"): {"keep": 1.0},
    ("digestion", "liver"): {"keep": 0.42}, ("digestion", "gallbladder"): {"keep": 0.45, "merge": True}, ("digestion", "pancreas"): {"keep": 0.7},
    ("digestion", "smallgut"): {"keep": 0.6}, ("digestion", "largegut"): {"keep": 0.4},
    ("urinary", "kidneys"): {"keep": 1.0}, ("urinary", "ureters"): {"keep": 1.0}, ("urinary", "bladder"): {"keep": 1.0},
    ("endocrine", "hypothalamus"): {"keep": 0.8, "merge": True}, ("endocrine", "pituitary"): {"keep": 1.0}, ("endocrine", "pineal"): {"keep": 1.0},
    ("endocrine", "adrenals"): {"keep": 0.8}, ("endocrine", "pancreas"): {"keep": 0.7},
    ("immune", "thymus"): {"keep": 1.0}, ("immune", "spleen"): {"keep": 1.0},
    # pairs keep left and right apart when merged ("pair"), so the two sides can part
    ("reproF", "tubes"): {"merge": True, "pair": True}, ("reproF", "ligaments"): {"merge": True, "pair": True},
    ("reproF", "breasts"): {"merge": True, "pair": True}, ("reproF", "uterus"): {"merge": True},
    ("reproF", "cervix"): {"merge": True}, ("pelvisF", "bones"): {"merge": True}, ("pelvisF", "organs"): {"merge": True},
}
FILE_OF = lambda system: "muscles" if system == "muscles" else "female" if system in ("reproF", "pelvisF") else "core"

# the female set as prepared by the human-atlas project (atlas-female.json + female-*.bin, from its git history:
# commit d72b4f6 of github.com/Eouchi147/human-atlas); not set: the female organs are left out of the build
FEMALE = os.environ.get("ATLAS_SRC_F")
# the explorer scales every model by this to show the male body 1.83 m tall; the female set is divided by it first,
# so she keeps her own true size (her reference body is 1.67 m)
SCALE = 1.83 / 1.73


def spec(s, c):
    d = dict(DEFAULT)
    d.update(SPEC.get((s, c), {}))
    return d


def load(p, get=None):
    buf = (get or chunk)(p["chunk"])
    V = np.frombuffer(buf, dtype=np.float32, count=p["vertexCount"] * 3, offset=p["positions"]).reshape(-1, 3).astype(np.float64)
    F = np.frombuffer(buf, dtype=np.uint32, count=p["indexCount"], offset=p["indices"]).reshape(-1, 3).astype(np.int64)
    return V, F


RAW = os.environ.get("ATLAS_RAW") == "1"  # leave simplification to encode.mjs (error-based, keeps small parts detailed)


def simplify(V, F, keep):
    if RAW or len(F) <= 160 or keep >= 0.98:
        return V, F
    try:
        V2, F2 = fsimp.simplify(V.astype(np.float32), F.astype(np.int32), target_reduction=1 - keep, agg=6)
        if len(F2) >= 16:
            return V2.astype(np.float64), F2.astype(np.int64)
    except Exception as e:
        print("simplify failed", e)
    return V, F


# coarse source meshes (long edges: the bladder, the long bones, the big muscles) are rounded with Loop subdivision
# before the error-based simplification in encode.mjs, so they stay smooth up close. Vessels, nerves and the unnamed
# muscles keep their own shape (thin tubes, or context only).
NO_SUBDIV = {("cardio", "arteries"), ("cardio", "veins"), ("muscles", "other"), ("nervous", "facenerves"), ("pelvisF", "bones")}


def smooth(V, F, s, c):
    if (s, c) in NO_SUBDIV or os.environ.get("ATLAS_SUBDIV", "1") != "1" or len(F) < 8:
        return V, F
    med = float(np.median(np.linalg.norm(V[F[:, 1]] - V[F[:, 0]], axis=1)))
    it = 2 if med > 0.008 else 1 if med > 0.0035 else 0
    if not it:
        return V, F
    m = trimesh.Trimesh(V, F, process=True)  # joins the copies of a vertex along the source's seams
    try:
        v2, f2 = trimesh.remesh.subdivide_loop(m.vertices, m.faces, iterations=it)
    except ValueError:
        SMOOTH_SKIPPED.append(f"{s}/{c}")  # an edge shared by three faces: Loop's rules do not apply
        return V, F
    return np.asarray(v2, dtype=np.float64), np.asarray(f2, dtype=np.int64)


SMOOTH_SKIPPED = []


def weld(V, F, eps=1e-6):
    """Drop unused vertices."""
    used = np.unique(F)
    remap = -np.ones(len(V), dtype=np.int64)
    remap[used] = np.arange(len(used))
    return V[used], remap[F]


def normals(V, F):
    n = np.zeros_like(V)
    fn = np.cross(V[F[:, 1]] - V[F[:, 0]], V[F[:, 2]] - V[F[:, 0]])
    for k in range(3):
        np.add.at(n, F[:, k], fn)
    l = np.linalg.norm(n, axis=1, keepdims=True)
    l[l == 0] = 1
    return n / l


# the source has a few meshes twice (two versions of the same structure, or an exact copy); drawn together they
# flicker where their surfaces cross, so the copy with fewer vertices is left out
def _dups():
    by = defaultdict(list)
    for p in A["parts"]:
        r = classify(p, None)
        if r and r[0][1] != "smallgut":  # the gut's short segments overlap without being copies
            by[(p["name"], tuple(r[0][:2]))].append(p)
    skip = set()
    for v in by.values():
        for i in range(len(v)):
            for j in range(i + 1, len(v)):
                a, b = np.array(v[i]["bounds"]), np.array(v[j]["bounds"])
                inter = np.clip(np.minimum(a[1], b[1]) - np.maximum(a[0], b[0]), 0, None)
                if (inter / np.maximum(np.maximum(a[1] - a[0], b[1] - b[0]), 1e-6)).min() > 0.8:
                    skip.add(v[j]["id"] if v[i]["vertexCount"] >= v[j]["vertexCount"] else v[i]["id"])
    return skip


SKIP = _dups()
print("copies left out", len(SKIP))

pieces = defaultdict(list)  # file -> list of piece dicts (with arrays)
merged = defaultdict(list)  # (file, system, cluster, material, tone, side) -> list of (V, F)
stats = defaultdict(lambda: [0, 0, 0])
def add(p, assignments, get=None, sd=None, scale=1.0):
    for (s, c, mat, tone) in assignments:
        sp = spec(s, c)
        b = np.array(p["bounds"])
        if float(np.linalg.norm(b[1] - b[0])) < sp["min"]:
            continue
        V, F = load(p, get)
        V = V / scale
        V, F = smooth(V, F, s, c) if RAW else (V, F)
        V, F = simplify(V, F, sp["keep"])
        V, F = weld(V, F)
        side = side_of(p["name"]) if sd is None else sd
        stats[(s, c)][0] += 1
        stats[(s, c)][1] += len(F)
        if sp["merge"]:
            # merged parts keep left and right apart only when the part is a pair (eyes); vessels become one piece per tone
            key_side = side if c in ("eyes",) or sp.get("pair") else 0
            merged[(FILE_OF(s), s, c, mat, tone, key_side)].append((V, F))
        else:
            pieces[FILE_OF(s)].append({"system": s, "cluster": c, "material": mat, "tone": tone, "side": side, "name": p["name"], "V": V, "F": F})


for p in A["parts"]:
    if p["id"] not in SKIP:
        add(p, classify(p, None))


def side_f(p):
    """The female set names some pairs without a side ("mammary lobe"); its ids carry it (..._L, ..._right_...)."""
    sd = side_of(p["name"])
    if sd:
        return sd
    i = p["id"].lower()
    if re.search(r"(_l$|_l_|left_)", i):
        return 1
    if re.search(r"(_r$|_r_|right_)", i):
        return -1
    return 0


def solid(groups, h=0.0004, close=4):
    """One closed, smooth organ from the open shells the source splits it into: mark every surface in a fine grid
    (h metres), close the small gaps between shells (close voxels), fill the inside, trace its outer surface
    (marching cubes) and smooth away the steps. The shape is the data's own outline; nothing is drawn in."""
    from scipy import ndimage
    from skimage import measure
    Vall = np.concatenate([V for V, F in groups])
    lo = Vall.min(0) - (close + 3) * h
    dims = np.ceil((Vall.max(0) + (close + 3) * h - lo) / h).astype(int) + 1
    occ = np.zeros(dims, dtype=bool)
    for V, F in groups:
        v2, f2 = trimesh.remesh.subdivide_to_size(V, F, max_edge=h * 0.5)
        idx = np.floor((v2 - lo) / h).astype(int)
        occ[idx[:, 0], idx[:, 1], idx[:, 2]] = True
    ball = ndimage.generate_binary_structure(3, 1)
    occ = ndimage.binary_dilation(occ, ball, iterations=close)
    occ = ndimage.binary_fill_holes(occ)
    occ = ndimage.binary_erosion(occ, ball, iterations=close)
    verts, faces, _, _ = measure.marching_cubes(occ.astype(np.float32), level=0.5, spacing=(h, h, h))
    m = trimesh.Trimesh(verts + lo, faces, process=True)
    m = max(m.split(only_watertight=False), key=lambda x: len(x.faces))  # the organ, not stray specks
    trimesh.smoothing.filter_taubin(m, lamb=0.5, nu=-0.53, iterations=30)
    return m


def centre(groups, name):
    return np.concatenate([V for (n, V, F) in groups if n == name]).mean(0)


if FEMALE:
    FA = json.load(open(os.path.join(FEMALE, "atlas-female.json")))
    fchunks = {}

    def fchunk(ci):
        if ci not in fchunks:
            fchunks[ci] = open(os.path.join(FEMALE, FA["chunks"][ci]["url"].split("/")[-1]), "rb").read()
        return fchunks[ci]

    shells = defaultdict(list)  # organ -> [(source name, V, F)], rebuilt as closed organs below
    for p in FA["parts"]:
        got = classify_female(p)
        keep = [g for g in got if g[2] != "solid"]
        for (s_, c, mat, tone) in got:
            if mat == "solid":
                V, F = load(p, fchunk)
                shells[c].append((tone, V.astype(np.float64), F))
        add(p, keep, get=fchunk, sd=side_f(p), scale=SCALE)

    def put(c, tone, m):
        V = np.asarray(m.vertices, dtype=np.float64) / SCALE
        F = np.asarray(m.faces, dtype=np.int64)
        V, F = weld(V, F)
        stats[("reproF", c)][0] += 1
        stats[("reproF", c)][1] += len(F)
        pieces["female"].append({"system": "reproF", "cluster": c, "material": "organ", "tone": tone, "side": 0, "name": f"{c} (rebuilt closed)", "V": V, "F": F})

    if shells["uterus+cervix"]:
        g = shells["uterus+cervix"]
        u = solid([(V, F) for (_, V, F) in g])
        # cut where the cervix begins (the internal os), across the uterus's own axis (cervix to fundus)
        axis = centre(g, "fundus of uterus") - centre(g, "external cervical os")
        axis /= np.linalg.norm(axis)
        o = centre(g, "internal cervical os")
        top = trimesh.intersections.slice_mesh_plane(u, axis, o, cap=True)
        low = trimesh.intersections.slice_mesh_plane(u, -axis, o, cap=True)
        put("uterus", "uterus", top)
        put("cervix", "cervix", low)
    if shells["vagina"]:
        put("vagina", "vagina", solid([(V, F) for (_, V, F) in shells["vagina"]]))

for (f, s, c, mat, tone, sd), parts in merged.items():
    Vs, Fs, base = [], [], 0
    for V, F in parts:
        Vs.append(V)
        Fs.append(F + base)
        base += len(V)
    pieces[f].append({"system": s, "cluster": c, "material": mat, "tone": tone, "side": sd, "name": f"{c} ({len(parts)} merged)", "V": np.concatenate(Vs), "F": np.concatenate(Fs)})

for f, plist in pieces.items():
    # stable order: by system, then part, then position top to bottom (so cascades read naturally)
    plist.sort(key=lambda q: (q["system"], q["cluster"], -float(q["V"][:, 1].mean())))
    raw = open(os.path.join(OUT, f + ".raw.bin"), "wb")
    rows = []
    tris = 0
    for q in plist:
        V, F = q["V"], q["F"]
        N = normals(V, F)
        if len(V) > 65535 and not RAW:
            raise SystemExit(f"piece too big for 16-bit indices: {q['name']} {len(V)}")
        raw.write(V.astype(np.float32).tobytes())
        raw.write(N.astype(np.float32).tobytes())
        raw.write(F.astype(np.uint32).ravel().tobytes())
        rows.append({"system": q["system"], "cluster": q["cluster"], "material": q["material"], "tone": q["tone"], "side": q["side"], "name": q["name"],
                     "v": int(len(V)), "i": int(F.size)})
        tris += len(F)
    raw.close()
    json.dump(rows, open(os.path.join(OUT, f + ".pieces.json"), "w"))
    print(f, "pieces", len(rows), "triangles", tris)

if SMOOTH_SKIPPED:
    from collections import Counter
    print("not smoothed (non-manifold):", dict(Counter(SMOOTH_SKIPPED)))

summary = defaultdict(lambda: [0, 0])
for (s, c), (n, t, _) in stats.items():
    summary[s][0] += n
    summary[s][1] += t
print(json.dumps({k: v for k, v in sorted(summary.items())}))

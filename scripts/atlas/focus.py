"""Close-up views for the explorer (file "focus"), built from the same BodyParts3D meshes as the rest of the model.

  feet     the right foot: its bones, its small muscles, the lower ends of the three leg muscles that sling its
           arches, and the long plantar ligament; the plantar fascia is not in the data, so it is drawn in as a thin fan
           from heel to toes
  posture  the spine in four regions, for the side view with the textbook plumb line (drawn by the explorer)
  mouth    the mouth and throat cut down the middle: the right half is kept and the cut faces are closed
  fascia   the right thigh's muscles and its IT band (in the data), wrapped in the fascia sleeve the data lacks,
           drawn as a surface just outside the muscles and split in eight strips that open like petals

Every piece is a dict like build_atlas's: system, cluster (the legend part), material, tone, side, name, V, F.
Drawn shapes (the plantar fascia, the thigh sleeve) are marked "(drawn)" in their names; lib/anatomy.ts says so on screen.
"""
import numpy as np
import trimesh
from source import find, load

ORD = ["First", "Second", "Third", "Fourth", "Fifth", "Sixth", "Seventh", "Eighth", "Ninth", "Tenth", "Eleventh", "Twelfth"]
MIDLINE = -0.0006  # x of the body's midline (the tongue, jaw and hyoid are symmetric about it)


def get(name, want_right=False):
    """A mesh by exact name. want_right: of the copies with this name, the one on the body's right (x < 0)."""
    got = find(name)
    if not got:
        raise KeyError(name)
    if want_right:
        got = sorted(got, key=lambda p: (p["bounds"][0][0] + p["bounds"][1][0]))
    return load(got[0])


def all_named(name):
    return [load(p) for p in find(name)]


def on_right(V):
    return float(V[:, 0].mean()) < 0


def tm(V, F):
    return trimesh.Trimesh(V, F, process=True)


def below(V, F, y):
    """Keep what lies below a height (the lower end of a leg bone or muscle: the ankle and the tendons into the foot)."""
    m = tm(V, F)
    out = trimesh.intersections.slice_mesh_plane(m, np.array([0, -1.0, 0]), np.array([0, y, 0]), cap=m.is_watertight)
    return np.asarray(out.vertices, dtype=np.float64), np.asarray(out.faces, dtype=np.int64)


def cut_right(V, F, x0=MIDLINE):
    """Keep the body's right half (x <= x0) and close the cut, as in a midline section."""
    m = tm(V, F)
    out = trimesh.intersections.slice_mesh_plane(m, np.array([-1.0, 0, 0]), np.array([x0, 0, 0]), cap=m.is_watertight)
    return np.asarray(out.vertices, dtype=np.float64), np.asarray(out.faces, dtype=np.int64)


def closed(V, F, h=0.0003, close=3):
    """A closed surface for a mesh made of loose shells (the lips), from a voxel fill (as build_atlas.solid)."""
    from scipy import ndimage
    from skimage import measure
    lo = V.min(0) - (close + 3) * h
    dims = np.ceil((V.max(0) + (close + 3) * h - lo) / h).astype(int) + 1
    occ = np.zeros(dims, dtype=bool)
    v2, f2 = trimesh.remesh.subdivide_to_size(V, F, max_edge=h * 0.5)
    idx = np.floor((v2 - lo) / h).astype(int)
    occ[idx[:, 0], idx[:, 1], idx[:, 2]] = True
    ball = ndimage.generate_binary_structure(3, 1)
    occ = ndimage.binary_dilation(occ, ball, iterations=close)
    occ = ndimage.binary_fill_holes(occ)
    occ = ndimage.binary_erosion(occ, ball, iterations=close)
    verts, faces, _, _ = measure.marching_cubes(occ.astype(np.float32), level=0.5, spacing=(h, h, h))
    m = trimesh.Trimesh(verts + lo, faces, process=True)
    trimesh.smoothing.filter_taubin(m, lamb=0.5, nu=-0.53, iterations=20)
    return np.asarray(m.vertices), np.asarray(m.faces, dtype=np.int64)


def loop(V, F, times):
    """Round a coarse mesh (the tongue's source mesh has 4.7 mm edges) with Loop subdivision."""
    if times <= 0:
        return V, F
    m = tm(V, F)
    try:
        v2, f2 = trimesh.remesh.subdivide_loop(m.vertices, m.faces, iterations=times)
        return np.asarray(v2, dtype=np.float64), np.asarray(f2, dtype=np.int64)
    except ValueError:
        return V, F


# ------------------------------------------------------------------ feet
TARSALS = ["Right talus", "Right calcaneus", "Navicular bone of right foot", "Right cuboid bone", "Right medial cuneiform bone",
           "Right intermediate cuneiform bone", "Right lateral cuneiform bone"]
METATARSALS = [f"Right {o.lower()} metatarsal bone" for o in ORD[:5]]
TOES = (["Proximal phalanx of right big toe", "Distal phalanx of right big toe"]
        + [f"{k} phalanx of right {t} toe" for t in ("second", "third", "fourth", "little") for k in ("Proximal", "Middle", "Distal")])
SOLE = ["Right abductor hallucis", "Right flexor digitorum brevis", "Abductor digiti minimi of right foot", "Right flexor accessorius",
        "First lumbrical of right foot", "Second lumbrical of right foot", "Third lumbrical of right foot", "Fourth lumbrical of right foot",
        "Medial head of right flexor hallucis brevis", "Lateral head of right flexor hallucis brevis", "Oblique head of right adductor hallucis",
        "Transverse head of right adductor hallucis", "Flexor digiti minimi brevis of right foot", "Opponens digiti minimi of right foot",
        "First plantar interosseous of right foot", "Second plantar interosseous of right foot", "Third plantar interosseous of right foot",
        "Right extensor hallucis brevis"]
SLINGS = ["Right tibialis posterior", "Right fibularis longus", "Right tibialis anterior"]


def plantar_fascia(sole_meshes, heads):
    """The plantar fascia, drawn: a thin fan under the small sole muscles, from the heel's underside to the five
    metatarsal heads, hugging the muscles from below. Not in the data, so it is marked as drawn on screen."""
    from scipy.spatial import cKDTree
    pts = np.concatenate([V for V, F in sole_meshes])
    tree = cKDTree(pts[:, [0, 2]])
    heel_c = np.array([-0.0645, -0.046])  # (x, z): just in front of the heel's underside (medial tubercle at z -0.052)
    heel_w = 0.0085  # half-width of the band at the heel
    nu, nv = 28, 9
    grid = np.zeros((nu, nv, 3))
    for i in range(nu):
        u = i / (nu - 1)
        for j in range(nv):
            v = j / (nv - 1)
            a = np.array([heel_c[0] + (v - 0.5) * 2 * heel_w * 1.0, heel_c[1]])  # heel edge, across the foot (x)
            k = v * 4
            k0 = int(min(3, np.floor(k)))
            t = k - k0
            b = heads[k0] * (1 - t) + heads[k0 + 1] * t  # far edge: along the line of the five heads
            xz = a * (1 - u) + np.array([b[0], b[2]]) * u
            near = tree.query_ball_point(xz, r=0.007)
            if near:
                y = float(pts[near, 1].min()) - 0.0012
            else:
                y = float(b[1]) - 0.0015
            grid[i, j] = [xz[0], y, xz[1]]
    # smooth the height across the sheet so it reads as one band, not a crumpled sheet
    from scipy.ndimage import uniform_filter
    grid[:, :, 1] = uniform_filter(grid[:, :, 1], size=3, mode="nearest")
    top = grid.reshape(-1, 3)
    bot = top - np.array([0, 0.0015, 0])
    V = np.concatenate([top, bot])
    n = nu * nv
    F = []
    for i in range(nu - 1):
        for j in range(nv - 1):
            a, b, c, d = i * nv + j, i * nv + j + 1, (i + 1) * nv + j, (i + 1) * nv + j + 1
            F += [[a, c, b], [b, c, d], [a + n, b + n, c + n], [b + n, d + n, c + n]]
    # close the four edges
    ring = [(i, 0) for i in range(nu)] + [(nu - 1, j) for j in range(1, nv)] + [(i, nv - 1) for i in range(nu - 2, -1, -1)] + [(0, j) for j in range(nv - 2, 0, -1)]
    for k in range(len(ring)):
        i0, j0 = ring[k]
        i1, j1 = ring[(k + 1) % len(ring)]
        a, b = i0 * nv + j0, i1 * nv + j1
        F += [[a, b, a + n], [b, b + n, a + n]]
    m = trimesh.Trimesh(V, np.array(F), process=True)
    m.fix_normals()
    return np.asarray(m.vertices), np.asarray(m.faces, dtype=np.int64)


def feet(out):
    for nm in TARSALS:
        out.append(("feet", "tarsals", "bone", "bone", nm, *get(nm)))
    for nm in METATARSALS:
        out.append(("feet", "metatarsals", "bone", "bone", nm, *get(nm)))
    for nm in TOES:
        out.append(("feet", "toes", "bone", "bone", nm, *get(nm)))
    for V, F in all_named("Sesamoid bone of right foot"):
        out.append(("feet", "toes", "bone", "bone", "Sesamoid bone of right foot", V, F))
    sole = []
    for nm in SOLE:
        try:
            V, F = get(nm)
        except KeyError:
            print("focus: not in the data:", nm)
            continue
        sole.append((V, F))
        out.append(("feet", "sole", "muscle", "muscle", nm, V, F))
    # the leg's part in this view stops above the ankle: the slings' tendons, as they come down into the foot
    for nm in SLINGS:
        out.append(("feet", "slings", "muscle", "sling", nm + " (lower end)", *below(*get(nm), 0.17)))
    out.append(("feet", "ligament", "organ", "ligament", "Right long plantar ligament", *get("Right long plantar ligament")))
    heads = []
    for nm in METATARSALS:
        V, F = get(nm)
        head = V[V[:, 2] > V[:, 2].max() - 0.012]
        heads.append(head[head[:, 1] < head[:, 1].min() + 0.003].mean(0))
    V, F = plantar_fascia(sole[:4], np.array(heads))  # the four big sole muscles it lies under
    out.append(("feet", "fascia", "fascia", "fascia", "Plantar fascia (drawn)", V, F))


# ------------------------------------------------------------------ posture: the spine in its four regions
def posture(out):
    neck = ["Atlas", "Axis"] + [f"{o} cervical vertebra" for o in ORD[2:7]]
    neck_d = ["Intervertebral disk of axis"] + [f"Intervertebral disk of {o.lower()} cervical vertebra" for o in ORD[2:7]]
    upper = [f"{o} thoracic vertebra" for o in ORD[:12]]
    upper_d = [f"Intervertebral disk of {o.lower()} thoracic vertebra" for o in ORD[:11]]
    lower = [f"{o} lumbar vertebra" for o in ORD[:5]]
    lower_d = ["Intervertebral disk"] + [f"Intervertebral disk of {o.lower()} lumbar vertebra" for o in ORD[:5]]
    for c, bones, discs in (("neck", neck, neck_d), ("upper", upper, upper_d), ("lower", lower, lower_d)):
        for nm in bones:
            out.append(("posture", c, "bone", "bone", nm, *get(nm)))
        for nm in discs:
            out.append(("posture", c, "cart", "disc", nm, *get(nm)))
    out.append(("posture", "sacrum", "bone", "bone", "Sacrum", *get("Sacrum")))


# ------------------------------------------------------------------ mouth: cut down the middle, right half kept
def mouth(out):
    def half(nm, c, mat, tone, sub=0, shells=False):
        V, F = get(nm)
        if shells:
            V, F = closed(V, F)
        V, F = loop(V, F, sub)
        V, F = cut_right(V, F)
        out.append(("mouth", c, mat, tone, nm + " (right half)", V, F))

    def right(nm, c, mat, tone):
        V, F = get(nm, want_right=True)
        if not on_right(V):
            raise ValueError(nm)
        out.append(("mouth", c, mat, tone, nm, V, F))

    half("Tongue", "tongue", "organ", "tongue", sub=2)
    for nm in ("Right genioglossus", "Right hyoglossus"):
        right(nm, "tonguemuscles", "muscle", "muscle")
    for nm in ("Right mylohyoid", "Right geniohyoid", "Right stylohyoid"):
        right(nm, "floor", "muscle", "muscle")
    for V, F in all_named("Right digastric"):
        if on_right(V):
            out.append(("mouth", "floor", "muscle", "muscle", "Right digastric", V, F))
    half("Hyoid bone", "hyoid", "bone", "bone")
    right("Right maxilla", "upper", "bone", "bone")
    right("Right palatine bone", "upper", "bone", "bone")
    for jaw, c in (("upper", "upper"), ("lower", "lower")):
        for t in ("central secondary incisor", "lateral secondary incisor", "secondary canine", "first secondary premolar",
                  "second secondary premolar", "first secondary molar", "second secondary molar"):
            right(f"Right {jaw} {t} tooth", c, "bone", "tooth")
    half("Mandible", "lower", "bone", "bone")
    for nm in ("Right levator veli palatini", "Right tensor veli palatini"):
        right(nm, "soft", "muscle", "muscle")
    half("Uvular muscle", "soft", "muscle", "muscle")
    # the throat's wall: the source names its two middle constrictors the wrong way round, so each is taken by position
    for nm in ("superior pharyngeal constrictor", "middle pharyngeal constrictor", "inferior pharyngeal constrictor", "palatopharyngeus",
               "salpingopharyngeus", "stylopharyngeus"):
        cands = [load(p) for p in find("Right " + nm) + find("Left " + nm)]
        V, F = min(cands, key=lambda vf: vf[0][:, 0].mean())
        out.append(("mouth", "throat", "organ", "throat", nm + " (right)", V, F))
    half("Epiglottis", "throat", "cart", "cart")
    for nm in ("Right inferior nasal concha", "Right nasal bone", "Right lateral nasal cartilage"):
        right(nm, "nose", "bone" if "bone" in nm else "organ", "bone" if "bone" in nm else "nose")
    half("Lip", "lips", "organ", "lip", shells=True)


# ------------------------------------------------------------------ fascia: the right thigh, wrapped
QUADS = ["Right rectus femoris", "Right vastus lateralis", "Right vastus medialis", "Right vastus intermedius"]
HAMS = ["Long head of right biceps femoris", "Short head of right biceps femoris", "Right semitendinosus", "Right semimembranosus"]
INNER = ["Right adductor longus", "Right adductor brevis", "Right adductor magnus", "Right adductor minimus", "Right gracilis", "Right pectineus"]


def sleeve(meshes, y0, y1, gap=0.0024, h=0.0016, close=7):
    """The thigh's deep fascia (fascia lata), drawn: one smooth surface a few millimetres outside the muscles, made
    from a voxel fill of them (gaps between muscles bridged), open at the hip and the knee."""
    from scipy import ndimage
    from skimage import measure
    Vall = np.concatenate([V for V, F in meshes])
    pad = (close + 6) * h
    lo = Vall.min(0) - pad
    dims = np.ceil((Vall.max(0) + pad - lo) / h).astype(int) + 1
    occ = np.zeros(dims, dtype=bool)
    for V, F in meshes:
        v2, f2 = trimesh.remesh.subdivide_to_size(V, F, max_edge=h * 0.5)
        idx = np.floor((v2 - lo) / h).astype(int)
        occ[idx[:, 0], idx[:, 1], idx[:, 2]] = True
    ball = ndimage.generate_binary_structure(3, 1)
    occ = ndimage.binary_dilation(occ, ball, iterations=close)
    occ = ndimage.binary_fill_holes(occ)
    occ = ndimage.binary_erosion(occ, ball, iterations=close)
    occ = ndimage.binary_dilation(occ, ball, iterations=max(1, int(round(gap / h))))
    verts, faces, _, _ = measure.marching_cubes(occ.astype(np.float32), level=0.5, spacing=(h, h, h))
    m = trimesh.Trimesh(verts + lo, faces, process=True)
    m = max(m.split(only_watertight=False), key=lambda x: len(x.faces))
    trimesh.smoothing.filter_taubin(m, lamb=0.5, nu=-0.53, iterations=40)
    m = trimesh.intersections.slice_mesh_plane(m, np.array([0, 1.0, 0]), np.array([0, y0, 0]), cap=False)
    m = trimesh.intersections.slice_mesh_plane(m, np.array([0, -1.0, 0]), np.array([0, y1, 0]), cap=False)
    return m


def petals(m, n=8):
    """Split the sleeve into n strips around the thigh's own axis, so it can open like petals."""
    V = np.asarray(m.vertices)
    F = np.asarray(m.faces)
    ys = V[:, 1]
    top = V[ys > ys.max() - 0.02].mean(0)
    bot = V[ys < ys.min() + 0.02].mean(0)
    axis = (top - bot) / np.linalg.norm(top - bot)
    c = V[F].mean(1)
    rel = c - bot
    rel -= np.outer(rel @ axis, axis)
    ref = np.array([1.0, 0, 0]) - axis * axis[0]
    ref /= np.linalg.norm(ref)
    ref2 = np.cross(axis, ref)
    ang = np.arctan2(rel @ ref2, rel @ ref)
    k = np.floor((ang + np.pi) / (2 * np.pi) * n).astype(int) % n
    parts = []
    for i in range(n):
        sel = F[k == i]
        if len(sel) == 0:
            continue
        used = np.unique(sel)
        remap = -np.ones(len(V), dtype=np.int64)
        remap[used] = np.arange(len(used))
        parts.append((V[used].astype(np.float64), remap[sel]))
    return parts


def fascia(out):
    muscles = []
    for group, tone in ((QUADS, "front"), (HAMS, "back"), (INNER, "inner"), (["Right sartorius"], "strap")):
        for nm in group:
            V, F = get(nm)
            muscles.append((V, F))
            out.append(("fascia", "muscles", "muscle", tone, nm, V, F))
    tfl = get("Right tensor fasciae latae")
    out.append(("fascia", "tfl", "muscle", "muscle", "Right tensor fasciae latae", *tfl))
    itb = get("Right iliotibial tract")
    out.append(("fascia", "itband", "band", "band", "Right iliotibial tract", *itb))
    out.append(("fascia", "bone", "bone", "bone", "Right femur", *get("Right femur")))
    m = sleeve(muscles + [itb], y0=0.47, y1=0.905)
    for i, (V, F) in enumerate(petals(m)):
        out.append(("fascia", "sleeve", "fascia", "fascia", f"Fascia lata (drawn), strip {i + 1}", V, F))


def build(smooth=None):
    """All focus pieces, as build_atlas piece dicts. smooth(V, F, system, cluster) rounds coarse meshes."""
    raw = []
    feet(raw)
    posture(raw)
    mouth(raw)
    fascia(raw)
    pieces = []
    for (s, c, mat, tone, name, V, F) in raw:
        if smooth and "(drawn)" not in name and "(right half)" not in name and "(lower end)" not in name:
            V, F = smooth(V, F, s, c)
        used = np.unique(F)
        remap = -np.ones(len(V), dtype=np.int64)
        remap[used] = np.arange(len(used))
        V, F = V[used], remap[F]
        side = -1 if float(V[:, 0].mean()) < -0.004 else 0
        pieces.append({"system": s, "cluster": c, "material": mat, "tone": tone, "side": side, "name": name, "V": V, "F": F})
    return pieces


if __name__ == "__main__":
    import collections
    ps = build()
    cnt = collections.Counter((p["system"], p["cluster"]) for p in ps)
    for k, v in sorted(cnt.items()):
        tris = sum(len(p["F"]) for p in ps if (p["system"], p["cluster"]) == k)
        print(k, v, "pieces", tris, "tris")

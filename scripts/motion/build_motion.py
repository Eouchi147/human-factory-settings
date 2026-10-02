"""The moving body: bones and muscles from BodyParts3D 4.0 ((c) The Database Center for Life Science, CC BY 4.0), with a
rig of real joints and the data the browser needs to move them.

Every bone part rides on one joint (a vertebra, the head, a shoulder blade, a forearm bone...); the discs and the rib
cartilages bend between the two joints they join. Every muscle vertex is tied to the two joints whose bones lie
nearest it, smoothed over the muscle, so a muscle stretches and bends with the bones it spans. Each muscle also gets the
direction of its fibres (its long axis) and a tendon factor (thin and near an end), for the browser's shading.

Joint centres come from the bones themselves: the disc centres for the spine, sphere fits for the femoral and humeral
heads, the ends of the bones for the knee, ankle, elbow, wrist and the clavicle's two joints.

Run:  python3 build_motion.py out   (then: node encode_motion.mjs out ../../public/model/motion)
Units: metres, y up, x toward the body's left, z toward the front; reference body 1.73 m (the browser scales to 1.83 m)."""
import json, os, re, sys
from collections import defaultdict
import numpy as np
from scipy.spatial import cKDTree
import scipy.sparse as sp

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "atlas"))
from source import A, load  # noqa: E402
from classify import classify  # noqa: E402
import trimesh  # noqa: E402

OUT = sys.argv[1] if len(sys.argv) > 1 else "out"
os.makedirs(OUT, exist_ok=True)


def ss(a, b, x):
    u = np.clip((x - a) / (b - a), 0, 1)
    return u * u * (3 - 2 * u)


def side_of(n):
    return "R" if re.search(r"\bright\b", n, re.I) else "L" if re.search(r"\bleft\b", n, re.I) else ""


# ------------------------------------------------------------------ the parts we keep
def dups():
    """The source has a few meshes twice; keep the larger copy."""
    by = defaultdict(list)
    for p in A["parts"]:
        r = classify(p, None)
        if r and r[0][0] in ("skeleton", "muscles"):
            by[p["name"]].append(p)
    skip = set()
    for v in by.values():
        for i in range(len(v)):
            for j in range(i + 1, len(v)):
                a, b = np.array(v[i]["bounds"]), np.array(v[j]["bounds"])
                inter = np.clip(np.minimum(a[1], b[1]) - np.maximum(a[0], b[0]), 0, None)
                if (inter / np.maximum(np.maximum(a[1] - a[0], b[1] - b[0]), 1e-6)).min() > 0.8:
                    skip.add(v[j]["id"] if v[i]["vertexCount"] >= v[j]["vertexCount"] else v[i]["id"])
    return skip


EYE_MUSCLE = re.compile(r"(superior|inferior|lateral|medial) rectus$|(superior|inferior) oblique$|levator palpebrae", re.I)
SKIP = dups()
bones, muscles = [], []
for p in A["parts"]:
    if p["id"] in SKIP:
        continue
    r = classify(p, None)
    if not r:
        continue
    s, c, mat, tone = r[0]
    if s == "skeleton":
        bones.append((p, c, tone))
    elif s == "muscles" and not EYE_MUSCLE.search(p["name"]):
        muscles.append((p, c, tone))
print("bones", len(bones), "muscles", len(muscles))

MESH = {}


def mesh(p):
    if p["id"] not in MESH:
        MESH[p["id"]] = load(p)
    return MESH[p["id"]]


def verts(name):
    for p, c, t in bones:
        if p["name"].lower() == name.lower():
            return mesh(p)[0]
    raise KeyError(name)


# ------------------------------------------------------------------ the joints, from the bones
def sphere_fit(P):
    M = np.c_[2 * P, np.ones(len(P))]
    c, *_ = np.linalg.lstsq(M, (P ** 2).sum(1), rcond=None)
    return c[:3]


ORD = ["first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth", "ninth", "tenth", "eleventh", "twelfth"]
SPINE = [("L5", "Fifth lumbar vertebra"), ("L4", "Fourth lumbar vertebra"), ("L3", "Third lumbar vertebra"), ("L2", "Second lumbar vertebra"), ("L1", "First lumbar vertebra")]
SPINE += [(f"T{12 - k}", f"{ORD[11 - k].capitalize()} thoracic vertebra") for k in range(12)]
SPINE += [(f"C{7 - k}", f"{ORD[6 - k].capitalize()} cervical vertebra") for k in range(5)]   # C7 .. C3
SPINE += [("C2", "Axis"), ("C1", "Atlas")]
DISC_OF = {n: f"Intervertebral disk of {n[0].lower() + n[1:]}" for _, n in SPINE}
DISC_OF["Axis"] = "Intervertebral disk of axis"
DISC_OF["Twelfth thoracic vertebra"] = "Intervertebral disk"     # the source names the T12/L1 disc without its vertebra

J = []          # joints: dict(id, parent, pivot)
JI = {}


def joint(jid, parent, pivot):
    JI[jid] = len(J)
    J.append({"id": jid, "parent": parent, "pivot": [round(float(x), 5) for x in pivot]})


fem = {s: verts(f"{n} femur") for s, n in (("R", "Right"), ("L", "Left"))}
heads = {}
for s, V in fem.items():
    top = V[:, 1].max()
    up = V[V[:, 1] > top - 0.057]
    mx = np.abs(up[:, 0]).min()
    heads[s] = sphere_fit(up[np.abs(up[:, 0]) < mx + 0.033])
P0 = (heads["R"] + heads["L"]) / 2
joint("pelvis", None, P0)
parent = "pelvis"
for jid, name in SPINE:
    if jid == "C1":
        ax = verts("Axis")   # the atlas turns on the dens of the axis: its tip, a few millimetres down
        tip = ax[ax[:, 1] > ax[:, 1].max() - 0.006]
        piv = tip.mean(0) - np.array([0, 0.007, 0])
    else:
        piv = verts(DISC_OF[name]).mean(0)
    joint(jid, parent, piv)
    parent = jid
at = verts("Atlas")   # the head nods on the atlas's two upper facets
tp = at[at[:, 1] > at[:, 1].max() - 0.006]
fac = tp[(np.abs(tp[:, 0]) > 0.008) & (np.abs(tp[:, 0]) < 0.03)]
joint("head", "C1", np.array([0.0, fac[:, 1].mean(), fac[:, 2].mean()]))
mand = verts("Mandible")
cond = mand[mand[:, 1] > mand[:, 1].max() - 0.01]
joint("jaw", "head", np.array([0.0, cond[:, 1].mean(), cond[:, 2].mean()]))
STERN = "T3"    # the sternum (and the clavicles that hinge on it) rides with the third thoracic vertebra
for s, Side in (("R", "Right"), ("L", "Left")):
    cl = verts(f"{Side} clavicle")
    ax_ = np.abs(cl[:, 0])
    sc = cl[ax_ < ax_.min() + 0.012].mean(0)
    ac = cl[ax_ > ax_.max() - 0.012].mean(0)
    joint(f"clav{s}", STERN, sc)
    joint(f"scap{s}", f"clav{s}", ac)
    hu = verts(f"{Side} humerus")
    top = hu[:, 1].max()
    up = hu[hu[:, 1] > top - 0.045]
    mx = np.abs(up[:, 0]).min()
    shc = sphere_fit(up[np.abs(up[:, 0]) < mx + 0.028])
    joint(f"hum{s}", f"scap{s}", shc)
    bot = hu[:, 1].min()
    el = hu[hu[:, 1] < bot + 0.028].mean(0)
    el[1] = bot + 0.012
    joint(f"ulna{s}", f"hum{s}", el)
    ra = verts(f"{Side} radius")
    rh = ra[ra[:, 1] > ra[:, 1].max() - 0.012].mean(0)
    joint(f"rad{s}", f"ulna{s}", rh)
    joint(f"hand{s}", f"rad{s}", verts(f"{Side} capitate").mean(0))
def head_of(name, toward):
    """The centre of a long bone's rounded far end (a metatarsal's or metacarpal's head): a sphere fit to its last 12 mm."""
    V = verts(name)
    cap = V[V[:, 2] > V[:, 2].max() - 0.012] if toward == "z" else V[V[:, 1] < V[:, 1].min() + 0.012]
    c = sphere_fit(cap) if len(cap) >= 12 else cap.mean(0)
    if np.linalg.norm(c - cap.mean(0)) > 0.015:   # an unstable fit (a flat cap): the cap's middle, a few millimetres in
        c = cap.mean(0) - (np.array([0, 0, 0.006]) if toward == "z" else np.array([0, -0.006, 0]))
    return c


for s, Side in (("R", "Right"), ("L", "Left")):
    joint(f"fem{s}", "pelvis", heads[s])
    V = fem[s]
    lo = V[V[:, 1] < V[:, 1].min() + 0.05]
    sg = 1 if s == "L" else -1
    K = (lo[np.argmin(lo[:, 0] * sg)] + lo[np.argmax(lo[:, 0] * sg)]) / 2   # the knee bends about the line through the femur's epicondyles
    joint(f"tib{s}", f"fem{s}", K)
    joint(f"pat{s}", f"fem{s}", K)
    tib, fib = verts(f"{Side} tibia"), verts(f"{Side} fibula")
    Aj = (tib[tib[:, 1].argmin()] + fib[fib[:, 1].argmin()]) / 2   # the ankle's axis runs just below the tips of the malleoli
    joint(f"foot{s}", f"tib{s}", Aj)
    joint(f"toes{s}", f"foot{s}", (head_of(f"{Side} first metatarsal bone", "z") + head_of(f"{Side} fifth metatarsal bone", "z")) / 2)
# a few measured points the browser uses (axes for the forearm's turn, the ankle, the knee)
LAND = {}
for s, Side in (("R", "Right"), ("L", "Left")):
    ul = verts(f"{Side} ulna")
    LAND[f"ulnarHead{s}"] = ul[ul[:, 1] < ul[:, 1].min() + 0.012].mean(0)
    tib, fib = verts(f"{Side} tibia"), verts(f"{Side} fibula")
    LAND[f"medMall{s}"] = tib[tib[:, 1].argmin()]
    LAND[f"latMall{s}"] = fib[fib[:, 1].argmin()]
    fm = fem[s]
    lo = fm[fm[:, 1] < fm[:, 1].min() + 0.05]
    LAND[f"medEpi{s}"] = lo[np.argmin(lo[:, 0] * (1 if s == "L" else -1))]   # the femur's widest points near the knee
    LAND[f"latEpi{s}"] = lo[np.argmax(lo[:, 0] * (1 if s == "L" else -1))]
    hu = verts(f"{Side} humerus")
    lo = hu[hu[:, 1] < hu[:, 1].min() + 0.05]
    LAND[f"medEpiH{s}"] = lo[np.argmin(lo[:, 0] * (1 if s == "L" else -1))]
    LAND[f"latEpiH{s}"] = lo[np.argmax(lo[:, 0] * (1 if s == "L" else -1))]
    sc = verts(f"{Side} scapula")
    LAND[f"scapInf{s}"] = sc[sc[:, 1].argmin()]
    LAND[f"mcp2{s}"] = head_of(f"{Side} second metacarpal bone", "y")
    LAND[f"mcp5{s}"] = head_of(f"{Side} fifth metacarpal bone", "y")
    LAND[f"mth1{s}"] = head_of(f"{Side} first metatarsal bone", "z")
    LAND[f"mth5{s}"] = head_of(f"{Side} fifth metatarsal bone", "z")
    ca = verts(f"{Side} calcaneus")
    LAND[f"heel{s}"] = ca[ca[:, 1].argmin()]
    bt = verts(f"Distal phalanx of {Side.lower()} big toe")
    LAND[f"toeTip{s}"] = bt[bt[:, 2].argmax()]
FLOOR = float(min(verts(f"{Side} calcaneus")[:, 1].min() for Side in ("Right", "Left")))

# the shoulder blade's own axes (as the ISB defines them): the normal to its flat body, pointing forward, and the line
# across it toward the body's left; upward rotation turns about the first, tilting about the second
AXES = {}
for s, Side in (("R", "Right"), ("L", "Left")):
    sc = verts(f"{Side} scapula")
    w_, v_ = np.linalg.eigh(np.cov((sc - sc.mean(0)).T))
    nrm = v_[:, 0] * (1 if v_[2, 0] > 0 else -1)
    zx = np.array([1.0, 0, 0]) - nrm * nrm[0]
    AXES[f"scapN{s}"] = nrm
    AXES[f"scapZ{s}"] = zx / np.linalg.norm(zx)
print("joints", len(J))


# ------------------------------------------------------------------ which joint carries each bone
VJ = {name: jid for jid, name in SPINE}


def bone_joint(n):
    """A joint id, or ('blend', a, b, kind) for parts that bend between two joints."""
    nl = n.lower()
    s = side_of(n)
    if n in VJ:
        return VJ[n]
    m = re.match(r"intervertebral disk(?: of (.*))?$", nl)
    if m:
        above = "Twelfth thoracic vertebra" if not m.group(1) else next(nm for _, nm in SPINE if nm.lower() == m.group(1))
        ja = VJ[above]
        return ("blend", ja, J[JI[ja]]["parent"], "disc")
    if re.search(r"sacrum|coccyx|hip bone", nl):
        return "pelvis"
    m = re.match(r"(right|left) (\w+) rib$", nl)
    if m:
        return f"T{ORD.index(m.group(2)) + 1}"
    m = re.match(r"(right|left) (\w+) costal cartilage$", nl)
    if m:
        return ("blend", f"T{ORD.index(m.group(2)) + 1}", STERN, "cartilage")
    if re.search(r"sternum|manubrium|xiphoid", nl):
        return STERN
    if "clavicle" in nl:
        return f"clav{s}"
    if "scapula" in nl:
        return f"scap{s}"
    if "humerus" in nl:
        return f"hum{s}"
    if re.search(r"\bulna\b", nl):
        return f"ulna{s}"
    if "radius" in nl:
        return f"rad{s}"
    if re.search(r"capitate|lunate|scaphoid|hamate|trapez|pisiform|triquetr|metacarpal|finger|thumb|of (right|left) hand", nl):
        return f"hand{s}"
    if "femur" in nl:
        return f"fem{s}"
    if "patella" in nl:
        return f"pat{s}"
    if re.search(r"tibia|fibula", nl):
        return f"tib{s}"
    if re.search(r"phalanx of (right|left) .*toe", nl):
        return f"toes{s}"
    if re.search(r"talus|calcane|navicular|cuboid|cuneiform bone|metatarsal|toe|of (right|left) foot", nl):
        return f"foot{s}"
    if "mandible" in nl or re.search(r"lower .*tooth", nl):
        return "jaw"
    if "hyoid" in nl:
        return "C3"
    return "head"


def bone_class(n):
    """What kind of bone a part is, for tying muscles only to the bones they attach to or lie along."""
    nl = n.lower()
    j = bone_joint(n)
    if isinstance(j, tuple):
        if j[3] == "cartilage":
            return "rib"
        j = j[1]
    if "hyoid" in nl:
        return "hyoid"
    if j in ("head", "jaw"):
        return j
    if j == "pelvis":
        return "sac" if re.search(r"sacrum|coccyx", nl) else "hip"
    if re.match(r"(right|left) \w+ rib$", nl):
        return "rib"
    if re.search(r"sternum|manubrium|xiphoid", nl):
        return "stern"
    for k in ("clav", "scap", "hum", "ulna", "rad", "hand", "fem", "pat", "tib", "foot", "toes"):
        if j.startswith(k):
            return k
    return {"C": "cv", "T": "tv", "L": "lv"}[j[0]]


# Which bones each muscle may ride: the ones it attaches to and the ones it lies along (first match wins). Without this,
# the nearest bone wins, and a muscle on the shoulder blade that happens to lie closer to a rib stays with the ribs
# while the shoulder blade turns. Attachments as in standard anatomy texts (origin and insertion).
RULES = [
    (r"trapezius", "head cv tv clav scap"),
    (r"latissimus", "tv lv sac hip rib"),   # and its arm bone, by its own rule (handmade.py)
    (r"levator scapulae", "cv scap"),
    (r"rhomboid", "cv tv scap"),
    (r"serratus anterior|pectoralis minor", "rib scap"),
    (r"subclavius", "rib clav"),
    (r"pectoralis major", "clav stern rib hum"),
    (r"deltoid", "clav scap hum"),
    (r"supraspinatus|infraspinatus|teres m|subscapularis|coracobrachialis", "scap hum"),
    (r"biceps brachii", "scap hum rad ulna"),
    (r"long head of .*triceps", "scap hum ulna"),
    (r"triceps|brachialis|anconeus", "hum ulna"),
    (r"brachioradialis|pronator teres|supinator", "hum ulna rad"),
    (r"pronator quadratus", "ulna rad"),
    (r"abductor pollicis longus|extensor pollicis|extensor indicis|flexor pollicis longus|flexor digitorum profundus", "ulna rad hand"),
    (r"of (right|left) hand|pollicis brevis|opponens pollicis|adductor pollicis", "hand"),
    (r"flexor carpi|palmaris longus|flexor digitorum superficialis|extensor carpi|extensor digiti minimi|extensor digitorum$", "hum ulna rad hand"),
    (r"of (right|left) foot|hallucis brevis|adductor hallucis|abductor hallucis|flexor digitorum brevis|flexor accessorius|extensor digitorum brevis", "foot toes"),
    (r"tibialis|fibularis|peroneus|extensor digitorum longus|extensor hallucis longus|flexor digitorum longus|flexor hallucis longus", "tib foot toes"),
    (r"soleus|calcaneal tendon", "tib foot"),
    (r"gastrocnemius|plantaris", "fem tib foot"),
    (r"popliteus|short head of .*biceps femoris", "fem tib"),
    (r"vastus", "fem pat tib"),
    (r"rectus femoris", "hip fem pat tib"),
    (r"sartorius|gracilis|semitendinosus|semimembranosus|biceps femoris|iliotibial|tensor fasciae", "hip fem tib"),
    (r"adductor (longus|brevis|magnus|minimus)|pectineus|iliacus", "hip fem"),
    (r"gluteus|piriformis|gemellus|obturator|quadratus femoris", "hip sac fem"),
    (r"psoas", "tv lv hip fem"),
    (r"coccygeus|puborectalis|levator ani", "hip sac"),
    (r"external oblique", "rib hip lv tv"),
    (r"intercostal|transversus thoracis", "rib stern tv"),
    (r"levatores costarum|serratus posterior|iliocostalis cervicis", "cv tv lv rib"),
    (r"iliocostalis|longissimus thoracis", "tv lv rib sac hip"),
    (r"lumbar|lumborum", "tv lv sac"),
    (r"longissimus capitis|semispinalis capitis|splenius capitis", "head cv tv"),
    (r"cervic|longus colli", "cv tv"),
    (r"spinalis|interspinalis thoracis|thoracic rotator|semispinalis thoracis", "cv tv lv"),
    (r"obliquus capitis|rectus capitis|longus capitis", "head cv"),
    (r"scalenus", "cv rib"),
    (r"sternocleidomastoid", "head stern clav"),
    (r"platysma", "jaw cv clav stern"),
    (r"omohyoid", "hyoid scap clav"),
    (r"sternohyoid|sternothyroid|thyrohyoid", "hyoid stern clav cv"),
    (r"digastric|stylohyoid|mylohyoid|geniohyoid|hyoglossus|genioglossus", "jaw head hyoid"),
    (r"veli palatini|uvular|masseter|temporalis", "head"),   # the jaw muscles ride the skull, and the jaw by their own rule
]


def muscle_bones(n):
    nl = n.lower()
    for pat, cls in RULES:
        if re.search(pat, nl):
            return cls.split()
    return None


# ------------------------------------------------------------------ smoothing coarse meshes (as the explorer's model does)
def smooth(V, F, subdiv=True):
    m = trimesh.Trimesh(V, F, process=True)   # joins the copies of a vertex along the source's seams
    V, F = np.asarray(m.vertices, dtype=np.float64), np.asarray(m.faces, dtype=np.int64)
    if len(F) < 8 or not subdiv:
        return V, F
    med = float(np.median(np.linalg.norm(V[F[:, 1]] - V[F[:, 0]], axis=1)))
    it = 2 if med > 0.008 else 1 if med > 0.0035 else 0
    if not it:
        return V, F
    try:
        v2, f2 = trimesh.remesh.subdivide_loop(m.vertices, m.faces, iterations=it)
    except ValueError:
        return np.asarray(m.vertices), np.asarray(m.faces)
    return np.asarray(v2, dtype=np.float64), np.asarray(f2, dtype=np.int64)


def adjacency(F, n):
    e = np.vstack([F[:, [0, 1]], F[:, [1, 2]], F[:, [2, 0]]])
    e = np.vstack([e, e[:, ::-1]])
    M = sp.coo_matrix((np.ones(len(e)), (e[:, 0], e[:, 1])), shape=(n, n)).tocsr()
    M.data[:] = 1
    d = np.asarray(M.sum(1)).ravel()
    d[d == 0] = 1
    return sp.diags(1 / d) @ M


# ------------------------------------------------------------------ bones: geometry, joints and weights
out_parts, blobs = [], []
bone_pts, bone_lab, bone_cls, bone_side = [], [], [], []


def emit(name, file, tissue, cluster, V, F, Jw, Ww, D=None, T=None):
    n = len(V)
    if D is None:
        D = np.zeros((n, 3))
    if T is None:
        T = np.zeros(n)
    out_parts.append({"name": name, "file": file, "tissue": tissue, "cluster": cluster, "side": side_of(name), "v": n, "i": int(F.size)})
    blobs.extend([V.astype(np.float32).tobytes(), F.astype(np.uint32).tobytes(), Jw.astype(np.uint8).tobytes(), Ww.astype(np.float32).tobytes(),
                  D.astype(np.float32).tobytes(), T.astype(np.float32).tobytes()])


for p, cluster, tone in bones:
    V, F = mesh(p)
    V, F = smooth(V, F)
    n = len(V)
    Jw = np.zeros((n, 4), np.uint8)
    Ww = np.zeros((n, 4), np.float32)
    b = bone_joint(p["name"])
    if isinstance(b, tuple):
        _, ja, jb, kind = b
        if kind == "disc":   # the top half rides with the vertebra above, the bottom half with the one below
            c = V[:, 1].mean()
            h = max(1e-4, (V[:, 1].max() - V[:, 1].min()) / 2)
            w = ss(-0.8, 0.8, (V[:, 1] - c) / h)   # 1 at the top
            wa = w
        else:                # cartilage: the outer end with its rib, the inner end with the sternum
            ax_ = np.abs(V[:, 0])
            wa = ss(ax_.min(), ax_.max(), ax_)
        Jw[:, 0], Jw[:, 1] = JI[ja], JI[jb]
        Ww[:, 0], Ww[:, 1] = wa, 1 - wa
        lab = np.where(wa > 0.5, JI[ja], JI[jb])
    else:
        Jw[:, 0] = JI[b]
        Ww[:, 0] = 1
        lab = np.full(n, JI[b])
    tissue = "tooth" if "tooth" in p["name"].lower() else "cartilage" if re.search(r"cartilage|intervertebral", p["name"], re.I) else "bone"
    emit(p["name"], "bones", tissue, cluster, V, F, Jw, Ww)
    k = max(1, n // 1500)
    bone_pts.append(V[::k])
    bone_lab.append(lab[::k])
    bone_cls.append(np.full(len(V[::k]), bone_class(p["name"])))
    bone_side.append(np.full(len(V[::k]), side_of(p["name"])))
bone_pts = np.vstack(bone_pts)
bone_lab = np.concatenate(bone_lab)
bone_cls = np.concatenate(bone_cls)
bone_side = np.concatenate(bone_side)
print("bone samples", len(bone_pts), "classes", sorted(set(bone_cls)))
TREES = {}


def bone_tree(cls, side):
    """A search tree over the bones a muscle may ride (its own side and the midline)."""
    key = (tuple(sorted(cls)) if cls else None, side if cls else "")
    if key not in TREES:
        m = np.ones(len(bone_pts), bool) if not cls else np.isin(bone_cls, cls)
        if cls and side:
            m &= (bone_side == side) | (bone_side == "")
        TREES[key] = (cKDTree(bone_pts[m]), bone_lab[m])
    return TREES[key]

# ------------------------------------------------------------------ muscles the source lacks, built over what is there
from handmade import Envelope, latissimus, masseter, temporalis  # noqa: E402
ARM = re.compile(r"trapezius|humerus|radius|\bulna\b|capitate|lunate|scaphoid|hamate|trapez|pisiform|triquetr|metacarpal|finger|thumb|deltoid|biceps brachii|triceps|brachialis|coracobrachialis|brachioradialis|anconeus|pronator|supinator|carpi|palmaris|digitorum (superficialis|profundus)|pollicis|indicis|digiti minimi of|extensor digitorum$|of (right|left) hand", re.I)
trunk = [mesh(p)[0] for p, c, t in bones + muscles if not ARM.search(p["name"]) and mesh(p)[0][:, 1].max() > 0.84]
trunk = np.vstack(trunk)
ENV = Envelope(trunk[(trunk[:, 1] > 0.8) & (trunk[:, 1] < 1.5)])
for s, Side in (("R", "Right"), ("L", "Left")):
    Vh, Fh, Dh, Th, Wh = latissimus(s, verts, ENV)
    muscles.append(({"id": f"hand-lat-{s}", "name": f"{Side} latissimus dorsi", "handmade": (Vh, Fh, Dh, Th), "insert": (f"hum{s}", Wh)}, "handmade", "muscle"))
print("hand-built: latissimus dorsi", len(Vh), "vertices each")
head_pts = np.vstack([mesh(p)[0] for p, c, t in bones if re.search(r"maxilla|zygomatic|temporal bone|sphenoid|tooth", p["name"], re.I)])
for s, Side in (("R", "Right"), ("L", "Left")):
    Vh, Fh, Dh, Th, Wh = masseter(s, verts, head_pts)
    muscles.append(({"id": f"hand-mas-{s}", "name": f"{Side} masseter", "handmade": (Vh, Fh, Dh, Th), "insert": ("jaw", Wh)}, "handmade", "muscle"))
    Vh, Fh, Dh, Th, Wh = temporalis(s, verts, head_pts)
    muscles.append(({"id": f"hand-tem-{s}", "name": f"{Side} temporalis", "handmade": (Vh, Fh, Dh, Th), "insert": ("jaw", Wh)}, "handmade", "muscle"))
print("hand-built: masseter and temporalis")

# ------------------------------------------------------------------ muscles: nearest-bone weights, smoothed; fibres; tendons
NJ = len(J)
def fix_side(name, V):
    """The source names a few parts with the wrong side (its "Right flexor pollicis brevis" sits in the left hand): trust
    where the part is (x toward the body's left), and swap the word."""
    s0, cx = side_of(name), float(V[:, 0].mean())
    s1 = "R" if cx < -0.02 else "L" if cx > 0.02 else s0
    if s0 and s1 != s0:
        print("  side fixed by position:", name)
        name = re.sub(r"\b(right|left)\b", lambda m: {"right": "left", "left": "right", "Right": "Left", "Left": "Right"}[m.group(1)], name, count=1, flags=re.I)
    return name


for p, cluster, tone in muscles:
    hm = p.get("handmade")
    if hm:
        V, F = hm[0], hm[1]
    else:
        V, F = mesh(p)
        p = {**p, "name": fix_side(p["name"], V)}
        V, F = smooth(V, F, subdiv=cluster != "other")   # the unnamed muscles keep their own (loose) shape, as in the explorer
    n = len(V)
    cls = muscle_bones(p["name"])
    if cls is None:
        print("  no attachment rule (nearest bone):", p["name"])
    tree, labs = bone_tree(cls, side_of(p["name"]))
    d, ix = tree.query(V, k=24)
    lab = labs[ix]                                       # (n, 24) joint of each nearby bone point
    cand = np.unique(lab)
    # for each candidate joint, the distance to its nearest bone point among the 24
    D = np.full((n, len(cand)), np.inf)
    for ci, j in enumerate(cand):
        m = lab == j
        D[:, ci] = np.where(m, d, np.inf).min(1)
    S = 1.0 / (np.minimum(D, 1.0) ** 4 + 1e-12)
    S[~np.isfinite(D)] = 0
    top2 = np.argsort(-S, axis=1)[:, :2]
    Wd = np.zeros_like(S)
    rows = np.arange(n)
    for k in range(top2.shape[1]):
        Wd[rows, top2[:, k]] = S[rows, top2[:, k]]
    Wd /= Wd.sum(1, keepdims=True) + 1e-12
    # smooth over the muscle's own surface, so neighbours agree (no tears where the nearest bone changes)
    Adj = adjacency(F, n)
    for _ in range(14):
        Wd = 0.5 * Wd + 0.5 * (Adj @ Wd)
    order = np.argsort(-Wd, axis=1)[:, :4]
    if order.shape[1] < 4:
        order = np.hstack([order, np.repeat(order[:, :1], 4 - order.shape[1], 1)])
    Jw = cand[order].astype(np.uint8)
    Ww = Wd[rows[:, None], order]
    Ww[:, 1:][order[:, 1:] == order[:, :1]] = 0
    Ww[Ww < 0.02] = 0
    Ww /= Ww.sum(1, keepdims=True) + 1e-12
    if p.get("insert"):   # a hand-built muscle: the part near its insertion rides that bone, the rest what it lies on
        jid, share = p["insert"]
        Ww[:, :3] /= Ww[:, :3].sum(1, keepdims=True) + 1e-12
        Ww[:, :3] *= (1 - share)[:, None]
        Ww[:, 3] = share
        Jw[:, 3] = JI[jid]
    Jw[Ww == 0] = Jw[:, :1].repeat(4, 1)[Ww == 0]
    # fibres: the muscle's long axis; tendons: thin and near an end (or the whole part, when the source calls it a tendon)
    c = V.mean(0)
    w_, vec = np.linalg.eigh(np.cov((V - c).T))
    ax = vec[:, -1]
    t = (V - c) @ ax
    tn = (t - t.min()) / max(1e-6, t.max() - t.min())
    r = np.linalg.norm((V - c) - np.outer(t, ax), axis=1)
    mid = (tn > 0.33) & (tn < 0.67)
    rmax = np.percentile(r[mid], 90) if mid.sum() > 10 else r.max()
    T = ss(0.5, 0.22, r / max(1e-6, rmax)) * ss(0.28, 0.06, np.minimum(tn, 1 - tn))
    if tone == "tendon":
        T[:] = 1
    Dr = np.tile(ax, (n, 1))
    if hm:   # a hand-built muscle knows its own fibres and tendons
        Dr, T = hm[2], hm[3]
    emit(p["name"], "muscles", "tendon" if tone == "tendon" else "muscle", cluster, V, F, Jw, Ww, Dr, T)

# ------------------------------------------------------------------ where the body's mass is (for balance)
# Segment masses and centres of mass: Dumas, Cheze and Verriest 2007, "Adjustments to McConville et al. and Young et al.
# body segment inertial parameters", J Biomech 40:543-553, male values as tabulated in Kinetics Toolkit
# (github.com/felixchenier/kineticstoolkit, data/anthropometrics_dumas_2007.csv). Each: mass (fraction of the body),
# then the centre of mass as fractions of the segment's length, forward (X) and along the segment toward its upper end (Y),
# from the segment's origin.
DUMAS = {"headneck": (0.067, -0.062, 0.555), "thorax": (0.333, -0.036, -0.42), "arm": (0.024, 0.017, -0.452),
         "forearm": (0.017, 0.010, -0.417), "hand": (0.006, 0.082, -0.839), "pelvis": (0.142, 0.028, -0.28),
         "thigh": (0.123, -0.041, -0.429), "leg": (0.045, -0.048, -0.41), "foot": (0.012, 0.382, -0.151)}
PV = {j["id"]: np.array(j["pivot"]) for j in J}
skull = np.vstack([mesh(p)[0] for p, c, t in bones if bone_joint(p["name"]) == "head"])
LAND["vertex"] = skull[skull[:, 1].argmax()]
MASSES = []


def seg(name, joint_id, origin, upper, lower, fwd=None, frac=None, share=1.0):
    """A segment's centre of mass, given its origin and the line it runs along (lower to upper end)."""
    m, rx, ry = DUMAS[name]
    L = np.linalg.norm(upper - lower)
    if fwd is None:
        Y = (upper - lower) / L
        X = np.array([0, 0, 1.0]) - Y * Y[2]
        X /= np.linalg.norm(X)
    else:   # the foot: X along the foot, Y square to it, upward
        X = fwd / np.linalg.norm(fwd)
        Y = np.array([0, 1.0, 0]) - X * X[1]
        Y /= np.linalg.norm(Y)
    c = origin + L * (rx * X + (ry if frac is None else frac) * Y)
    MASSES.append({"seg": name, "joint": joint_id, "pos": [round(float(x), 5) for x in c], "m": round(m * share, 5)})


def level_at(y):
    """The spine joint whose vertebra holds height y (each spine joint sits at the disc under its vertebra)."""
    best = "pelvis"
    for jid, _ in SPINE:
        if PV[jid][1] <= y:
            best = jid
    return best


C7, L5 = PV["C7"], PV["L5"]
seg("headneck", "head", C7, LAND["vertex"], C7)
for f in (0.14, 0.42, 0.70):   # the trunk bends, so its mass rides three levels (the same centre at rest: 42% down)
    y = (C7 + (L5 - C7) * f)[1]
    seg("thorax", level_at(y), C7, C7, L5, frac=-f, share=1 / 3)
PH = np.array([0.0, PV["pelvis"][1], PV["pelvis"][2]])
seg("pelvis", "pelvis", L5, L5, PH)
for s in ("R", "L"):
    EL = (LAND[f"medEpiH{s}"] + LAND[f"latEpiH{s}"]) / 2
    WR = PV[f"hand{s}"]
    MC = (LAND[f"mcp2{s}"] + LAND[f"mcp5{s}"]) / 2
    seg("arm", f"hum{s}", PV[f"hum{s}"], PV[f"hum{s}"], EL)
    seg("forearm", f"ulna{s}", EL, EL, WR)
    seg("hand", f"hand{s}", WR, WR, MC)
    KJ, AJ = PV[f"tib{s}"], PV[f"foot{s}"]
    MT = (LAND[f"mth1{s}"] + LAND[f"mth5{s}"]) / 2
    seg("thigh", f"fem{s}", PV[f"fem{s}"], PV[f"fem{s}"], KJ)
    seg("leg", f"tib{s}", KJ, KJ, AJ)
    seg("foot", f"foot{s}", AJ, AJ + (MT - AJ), AJ, fwd=MT - AJ)
tot = sum(x["m"] for x in MASSES)
com = sum(np.array(x["pos"]) * x["m"] for x in MASSES) / tot
print("mass fractions", round(tot, 3), "centre of mass at rest", np.round(com, 4), "floor", round(FLOOR, 4))

with open(os.path.join(OUT, "motion.raw.bin"), "wb") as f:
    for b in blobs:
        f.write(b)
json.dump({"parts": out_parts}, open(os.path.join(OUT, "motion.parts.json"), "w"))
rig = {
    "source": "Joint centres measured on BodyParts3D 4.0 bones ((c) The Database Center for Life Science, CC BY 4.0) by Human Factory Settings.",
    "units": "metres, y up, x toward the body's left, z toward the front; reference body 1.73 m",
    "joints": J,
    "landmarks": {k: [round(float(x), 5) for x in v] for k, v in LAND.items()},
    "axes": {k: [round(float(x), 5) for x in v] for k, v in AXES.items()},
    "floor": round(FLOOR, 5),
    "masses": MASSES,
    "massSource": "Dumas, Cheze and Verriest 2007, J Biomech 40:543-553 (male), via Kinetics Toolkit's data table",
}
json.dump(rig, open(os.path.join(OUT, "rig.json"), "w"), indent=1)
print("parts", len(out_parts), "vertices", sum(p["v"] for p in out_parts), "triangles", sum(p["i"] for p in out_parts) // 3)

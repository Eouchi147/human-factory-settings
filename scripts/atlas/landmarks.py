"""Points for the lines the explorer draws (lib/anatomy.ts, metres on the reference body), measured on the bones:
the three arches of the right foot, and the heights of the landmarks on the textbook posture line."""
import numpy as np
from source import mesh


def bottom(V, frac=0.003):
    return V[V[:, 1] < V[:, 1].min() + frac].mean(0)


def band(V, z, w=0.004):
    """The underside of a bone at a given depth (z) along the foot."""
    sel = V[np.abs(V[:, 2] - z) < w]
    return bottom(sel, 0.002)


def r(p):
    return [round(float(x), 4) for x in p]


C, _ = mesh("Right calcaneus")
N, _ = mesh("Navicular bone of right foot")
MC, _ = mesh("Right medial cuneiform bone")
CU, _ = mesh("Right cuboid bone")
M = [mesh(f"Right {o} metatarsal bone")[0] for o in ("first", "second", "third", "fourth", "fifth")]
cmid = (C[:, 0].min() + C[:, 0].max()) / 2
med, lat = C[C[:, 0] > cmid], C[C[:, 0] < cmid]
heel_in, heel_out = bottom(med), bottom(lat)
# under the inner side of the heel bone, where it rises towards the talus
sust = band(med, -0.024)


def head(V):
    h = V[V[:, 2] > V[:, 2].max() - 0.012]
    return bottom(h)


def base(V):
    b = V[V[:, 2] < V[:, 2].min() + 0.01]
    return bottom(b)


def mid(V):
    z = (V[:, 2].min() + V[:, 2].max()) / 2
    return band(V, z)


inner = [heel_in, sust, bottom(N, 0.004), bottom(MC, 0.004), mid(M[0]), head(M[0])]
outer = [heel_out, bottom(CU, 0.004), base(M[4]), mid(M[4]), head(M[4])]
cross = [base(m) for m in M]
print("inner", [r(p) for p in inner])
print("outer", [r(p) for p in outer])
print("cross", [r(p) for p in cross])

# posture: heights of the landmarks the textbook line passes, and where the line stands (from the side)
T, _ = mesh("Right temporal bone")
mast = bottom(T, 0.004)
S, _ = mesh("Right scapula")
acro = S[S[:, 0] < S[:, 0].min() + 0.006].mean(0)
Fe, _ = mesh("Right femur")
up = Fe[Fe[:, 1] > Fe[:, 1].max() - 0.10]
troch = up[up[:, 0] < up[:, 0].min() + 0.004].mean(0)
lo = Fe[Fe[:, 1] < Fe[:, 1].min() + 0.06]
epic = lo[lo[:, 0] < lo[:, 0].min() + 0.004].mean(0)
Fi, _ = mesh("Right fibula")
mall = Fi[Fi[:, 1] < Fi[:, 1].min() + 0.02]
mall = mall[mall[:, 0] < mall[:, 0].min() + 0.003].mean(0)
marks = {"ear (mastoid)": mast, "shoulder tip": acro, "hip (greater trochanter)": troch, "knee (lateral epicondyle)": epic, "ankle (lateral malleolus)": mall}
for k, v in marks.items():
    print(f"{k:28s} {r(v)}")
z = float(np.mean([v[2] for v in marks.values()]))
print("line z (mean of the five)", round(z, 4))

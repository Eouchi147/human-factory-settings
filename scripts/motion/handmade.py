"""Muscles the source does not have, built here from the bones they attach to and the tissue they lie on.

BodyParts3D 4.0 has no latissimus dorsi (and no masseter or temporalis). Each one here is a sheet laid over what is already
there, between attachments measured on the source's own bones (as standard anatomy texts give them):
  latissimus dorsi: from the spines of T7 to L5, the sacrum (through the thoracolumbar fascia) and the back of the iliac
  crest, to the floor of the humerus's intertubercular groove; its fibres twist, so the lowest insert highest.
  masseter: from the lower edge of the zygomatic arch to the outer face of the mandible's ramus and angle.
  temporalis: from the temporal fossa, fanning down under the zygomatic arch to the mandible's coronoid process.
Each returns vertices, triangles, a fibre direction and a tendon factor per vertex (metres, the build's frame)."""
import numpy as np


def _grid_mesh(outer, inner):
    """Close two (nu, nv, 3) grids (the two faces of a sheet) into one watertight triangle mesh."""
    nu, nv, _ = outer.shape
    V = np.vstack([outer.reshape(-1, 3), inner.reshape(-1, 3)])
    o = lambda i, j: i * nv + j
    n0 = nu * nv
    F = []
    for i in range(nu - 1):
        for j in range(nv - 1):
            a, b, c, d = o(i, j), o(i + 1, j), o(i + 1, j + 1), o(i, j + 1)
            F += [(a, b, c), (a, c, d), (n0 + a, n0 + c, n0 + b), (n0 + a, n0 + d, n0 + c)]
    for i in range(nu - 1):   # the edges along v = 0 and v = 1
        for j in (0, nv - 1):
            a, b = o(i, j), o(i + 1, j)
            q = [(a, n0 + a, n0 + b), (a, n0 + b, b)]
            F += q if j == 0 else [(x, z, y) for x, y, z in q]
    for j in range(nv - 1):   # along u = 0 and u = 1
        for i in (0, nu - 1):
            a, b = o(i, j), o(i, j + 1)
            q = [(a, b, n0 + b), (a, n0 + b, n0 + a)]
            F += q if i == 0 else [(x, z, y) for x, y, z in q]
    return V, np.array(F, dtype=np.int64)


def _normals(P):
    du = np.gradient(P, axis=0)
    dv = np.gradient(P, axis=1)
    n = np.cross(du, dv)
    return n / (np.linalg.norm(n, axis=2, keepdims=True) + 1e-12)


def _smooth_grid(P, it, keep_edges=True, lam=0.5):
    P = P.copy()
    for _ in range(it):
        Q = P.copy()
        Q[1:-1, 1:-1] = P[1:-1, 1:-1] * (1 - lam) + lam * 0.25 * (P[:-2, 1:-1] + P[2:, 1:-1] + P[1:-1, :-2] + P[1:-1, 2:])
        if not keep_edges:
            Q[0, 1:-1] = P[0, 1:-1] * (1 - lam) + lam * 0.5 * (P[0, :-2] + P[0, 2:])
            Q[-1, 1:-1] = P[-1, 1:-1] * (1 - lam) + lam * 0.5 * (P[-1, :-2] + P[-1, 2:])
        P = Q
    return P


class Envelope:
    """The outer surface of the trunk as a radius for each direction around a vertical axis and each height."""

    def __init__(self, pts, y0=0.84, y1=1.47, dy=0.008, dth=3.0):
        self.y0, self.dy, self.dth = y0, dy, dth
        ny = int((y1 - y0) / dy) + 1
        nth = int(360 / dth)
        # the axis: at each height, halfway between the back and the front of the trunk's middle
        zc = np.zeros(ny)
        for k in range(ny):
            y = y0 + k * dy
            m = (np.abs(pts[:, 1] - y) < dy * 1.5) & (np.abs(pts[:, 0]) < 0.06)
            zc[k] = (pts[m, 2].min() + pts[m, 2].max()) / 2 if m.sum() > 20 else np.nan
        idx = np.arange(ny)
        ok = ~np.isnan(zc)
        zc = np.interp(idx, idx[ok], zc[ok])
        self.zc = np.convolve(np.pad(zc, 3, mode="edge"), np.ones(7) / 7, mode="valid")
        ky = np.clip(((pts[:, 1] - y0) / dy).round().astype(int), 0, ny - 1)
        dx, dz = pts[:, 0], pts[:, 2] - self.zc[ky]
        th = (np.degrees(np.arctan2(dx, dz)) + 360) % 360       # 0 = forward, 90 = the body's left, 180 = back
        r = np.hypot(dx, dz)
        kt = (th / dth).astype(int) % nth
        R = np.zeros((ny, nth))
        np.maximum.at(R, (ky, kt), r)
        # fill empty bins around each ring, then smooth a little
        for k in range(ny):
            row = R[k]
            if (row > 0).sum() > 3:
                good = np.where(row > 0)[0]
                R[k] = np.interp(np.arange(nth), np.r_[good - nth, good, good + nth], np.r_[row[good], row[good], row[good]])
        from scipy.ndimage import gaussian_filter
        self.R = gaussian_filter(R, sigma=(1.0, 1.2), mode=("nearest", "wrap"))
        self.ny, self.nth = ny, nth

    def axis(self, y):
        k = np.clip((np.asarray(y) - self.y0) / self.dy, 0, self.ny - 1)
        return np.interp(k, np.arange(self.ny), self.zc)

    def radius(self, th, y):
        k = np.clip((np.asarray(y) - self.y0) / self.dy, 0, self.ny - 1.001)
        t = (np.asarray(th) % 360) / self.dth
        k0, t0 = np.floor(k).astype(int), np.floor(t).astype(int)
        fk, ft = k - k0, t - t0
        t1 = (t0 + 1) % self.nth
        t0 = t0 % self.nth
        R = self.R
        return (R[k0, t0] * (1 - fk) * (1 - ft) + R[k0 + 1, t0] * fk * (1 - ft) + R[k0, t1] * (1 - fk) * ft + R[k0 + 1, t1] * fk * ft)

    def push_out(self, P, gap):
        """Move points that are inside the trunk (or closer than gap) out to its surface plus gap, along their direction from
        the axis. Returns the points and how far out of the surface each was (negative: inside)."""
        P = P.copy()
        zc = self.axis(P[..., 1])
        dx, dz = P[..., 0], P[..., 2] - zc
        th = (np.degrees(np.arctan2(dx, dz)) + 360) % 360
        r = np.hypot(dx, dz)
        R = self.radius(th, P[..., 1])
        r2 = np.maximum(r, R + gap)
        s = r2 / np.maximum(r, 1e-6)
        P[..., 0] = dx * s
        P[..., 2] = zc + dz * s
        return P, r - R


def _resample(poly, n):
    poly = np.asarray(poly, float)
    d = np.r_[0, np.cumsum(np.linalg.norm(np.diff(poly, axis=0), axis=1))]
    t = np.linspace(0, d[-1], n)
    return np.stack([np.interp(t, d, poly[:, k]) for k in range(3)], 1)


def _chaikin(poly, it=3):
    P = np.asarray(poly, float)
    for _ in range(it):
        Q = [P[0]]
        for a, b in zip(P[:-1], P[1:]):
            Q += [0.75 * a + 0.25 * b, 0.25 * a + 0.75 * b]
        Q.append(P[-1])
        P = np.array(Q)
    return P


def latissimus(side, verts, env, nu=44, nv=64):
    """side: "R" or "L"; verts(name) gives a bone's vertices; env: the trunk Envelope (arms left out)."""
    sg = -1 if side == "R" else 1
    Side = "Right" if side == "R" else "Left"
    tip = lambda n: verts(n)[verts(n)[:, 2].argmin()]
    ords = ["Seventh", "Eighth", "Ninth", "Tenth", "Eleventh", "Twelfth"]
    origin = [tip(f"{o} thoracic vertebra") for o in ords]
    origin += [tip(f"{o} lumbar vertebra") for o in ["First", "Second", "Third", "Fourth", "Fifth"]]
    sac = verts("Sacrum")
    for y in (0.975, 0.945):   # the median sacral crest
        band = sac[np.abs(sac[:, 1] - y) < 0.006]
        origin.append(band[band[:, 2].argmin()])
    # the back of the iliac crest: from the posterior superior iliac spine out along the crest's top edge
    hb = verts(f"{Side} hip bone")
    crest = hb[hb[:, 1] > hb[:, 1].max() - 0.045]
    post = crest[crest[:, 2] < np.percentile(crest[:, 2], 30)]
    psis = post[post[:, 2].argmin()]
    for f in (0.0, 0.5, 1.0):   # along the top of the crest's back third
        zf = psis[2] + f * 0.045
        band = crest[np.abs(crest[:, 2] - zf) < 0.006]
        origin.append(band[band[:, 1].argmax()] if len(band) else psis)
    origin = np.array(origin)
    origin[:, 0] = np.where(np.abs(origin[:, 0]) < 0.004, 0.004 * sg, origin[:, 0])   # each side starts just off the midline
    O = _resample(_chaikin(origin, 2), nu)
    # the insertion: the floor of the intertubercular groove, from 5 to 8 cm below the top of the humerus
    hu = verts(f"{Side} humerus")
    top = hu[:, 1].max()
    ins = []
    for d in np.linspace(0.08, 0.05, nu):
        band = hu[np.abs(hu[:, 1] - (top - d)) < 0.004]
        a = band[band[:, 2].argmax()]
        ins.append(a + np.array([-sg * 0.004, 0, -0.003]))   # a few millimetres in from the front of the bone (the groove's floor)
    I = np.array(ins)   # u = 0 (the fibres from T7) insert lowest, u = 1 (from the iliac crest) highest: the twist
    # the fibres: straight from origin to insertion, then laid over the back and side of the trunk
    v = np.linspace(0, 1, nv)
    P = O[:, None, :] * (1 - v[None, :, None]) + I[:, None, :] * v[None, :, None]
    # the lower fibres climb almost straight up the side before turning in to the arm: bow the path out and down a little
    u = np.linspace(0, 1, nu)
    bow = (np.sin(np.pi * v)[None, :] * (0.02 + 0.05 * u[:, None]))
    P[..., 0] += sg * bow
    for it in range(6):
        P, _ = env.push_out(P, 0.003)
        P = _smooth_grid(P, 4, lam=0.4)
    P, depth = env.push_out(P, 0.003)
    # thickness: a thin aponeurosis where it starts over the lower back (the thoracolumbar fascia, as wide as the muscles
    # along the spine, about 7 cm each side; short tendons only at the thoracic spines), a belly of 5 to 8 mm, thick at the
    # free lower border (the back of the armpit), a flat tendon at the arm
    ax_ = np.abs(P[..., 0])
    xa = 0.012 + 0.058 * np.clip((1.18 - P[..., 1]) / 0.08, 0, 1)
    apo = 1 - np.clip((ax_ - (xa - 0.012)) / 0.02, 0, 1)
    apo = apo * apo * (3 - 2 * apo)
    belly = 0.0055 + 0.006 * np.clip((u[:, None] - 0.55) / 0.45, 0, 1) * np.sin(np.pi * np.clip(v[None, :] * 1.15, 0, 1))
    tend = np.clip((v[None, :] - 0.9) / 0.08, 0, 1)
    t = belly * (1 - apo) + 0.0012 * apo
    t = t * (1 - tend) + 0.0022 * tend
    # the tendon narrows: pull the sheet together toward its middle fibre near the arm
    mid = P[nu // 2][None, :, :]
    narrow = np.clip((v - 0.8) / 0.2, 0, 1)[None, :, None] * 0.55
    P = P * (1 - narrow) + mid * narrow
    N = _normals(P)
    # the normal must point away from the trunk
    zc = env.axis(P[..., 1])
    outward = np.stack([P[..., 0], np.zeros_like(zc), P[..., 2] - zc], -1)
    flip = np.sign((N * outward).sum(-1, keepdims=True))
    N = N * np.where(flip == 0, 1, flip)
    outer = P + N * t[..., None]
    inner = P - N * 0.0003
    Vv, F = _grid_mesh(outer, inner)
    raw = np.cross(np.gradient(P, axis=0), np.gradient(P, axis=1))
    if (raw * outward).sum() < 0:   # the faces were wound for du x dv pointing out; it points in, so turn them over
        F = F[:, [0, 2, 1]]
    D = np.gradient(P, axis=1)
    D = D / (np.linalg.norm(D, axis=2, keepdims=True) + 1e-12)
    D = np.vstack([D.reshape(-1, 3), D.reshape(-1, 3)])
    T = np.clip(apo + tend, 0, 1)
    T = np.r_[T.reshape(-1), T.reshape(-1)]
    # how much of each point rides the arm bone rather than the trunk: only the part near the arm (the back of the armpit
    # and the tendon); the rest stays on the chest wall it lies on
    ins = np.clip((v - 0.72) / 0.25, 0, 1)
    ins = ins * ins * (3 - 2 * ins)
    W = np.tile(ins[None, :], (nu, 1))
    W = np.r_[W.reshape(-1), W.reshape(-1)]
    return Vv, F, D, T, W


class SideField:
    """How far out (to one side) the tissue reaches, for each height and depth: a height field seen from that side."""

    def __init__(self, pts, side, y0, y1, z0, z1, d=0.002, fill_down_from=None):
        self.sg = -1 if side == "R" else 1
        self.y0, self.z0, self.d = y0, z0, d
        ny, nz = int((y1 - y0) / d) + 1, int((z1 - z0) / d) + 1
        lat = pts[:, 0] * self.sg
        m = (lat > 0.005) & (pts[:, 1] >= y0) & (pts[:, 1] <= y1) & (pts[:, 2] >= z0) & (pts[:, 2] <= z1)
        ky = ((pts[m, 1] - y0) / d).astype(int).clip(0, ny - 1)
        kz = ((pts[m, 2] - z0) / d).astype(int).clip(0, nz - 1)
        H = np.full((ny, nz), np.nan)
        H0 = np.zeros((ny, nz))
        np.maximum.at(H0, (ky, kz), lat[m])
        H[H0 > 0] = H0[H0 > 0]
        if fill_down_from is not None:   # below a height, carry the wall down (the temporalis passes inside the zygomatic arch)
            k0 = int((fill_down_from - y0) / d)
            for kz_ in range(nz):
                col = H[k0:k0 + 6, kz_]
                v = np.nanmax(col) if np.isfinite(col).any() else np.nan
                H[:k0, kz_] = np.where(np.isfinite(H[:k0, kz_]), np.minimum(H[:k0, kz_], v if np.isfinite(v) else 1), v)
        # fill holes from neighbours, then smooth
        from scipy.ndimage import gaussian_filter, distance_transform_edt
        bad = ~np.isfinite(H)
        if bad.any():
            idx = distance_transform_edt(bad, return_distances=False, return_indices=True)
            H = H[tuple(idx)]
        self.H = gaussian_filter(H, 1.5)
        self.ny, self.nz = ny, nz

    def lateral(self, y, z):
        ky = np.clip((np.asarray(y) - self.y0) / self.d, 0, self.ny - 1.001)
        kz = np.clip((np.asarray(z) - self.z0) / self.d, 0, self.nz - 1.001)
        a, b = np.floor(ky).astype(int), np.floor(kz).astype(int)
        fy, fz = ky - a, kz - b
        H = self.H
        return H[a, b] * (1 - fy) * (1 - fz) + H[a + 1, b] * fy * (1 - fz) + H[a, b + 1] * (1 - fy) * fz + H[a + 1, b + 1] * fy * fz


def side_sheet(O, I, field, thick, tendon, share, gap=0.0008, nv=36, bow=None, smooth=3):
    """A muscle lying on the side of the head: fibres from O(u) to I(u) (each (nu, 3)), laid on the field (and never
    inside it), thickness thick(u, v) outward. Returns vertices, triangles, fibre directions, tendon factor, the share of
    each vertex that rides the insertion's bone."""
    nu = len(O)
    u = np.linspace(0, 1, nu)[:, None]
    v = np.linspace(0, 1, nv)[None, :]
    P = O[:, None, :] * (1 - v[..., None]) + I[:, None, :] * v[..., None]
    if bow is not None:
        P = P + bow(u, v)
    sg = field.sg
    for _ in range(3):
        surf = field.lateral(P[..., 1], P[..., 2]) + gap
        P[..., 0] = sg * np.maximum(P[..., 0] * sg, surf)
        P = _smooth_grid(P, smooth, lam=0.35)
    surf = field.lateral(P[..., 1], P[..., 2]) + gap
    P[..., 0] = sg * np.maximum(P[..., 0] * sg, surf)
    N = _normals(P)
    N = N * np.sign((N[..., 0] * sg).mean())
    t = thick(u, v)
    outer, inner = P + N * t[..., None], P - N * 0.0002
    Vv, F = _grid_mesh(outer, inner)
    raw = np.cross(np.gradient(P, axis=0), np.gradient(P, axis=1))
    if (raw[..., 0] * sg).sum() < 0:
        F = F[:, [0, 2, 1]]
    D = np.gradient(P, axis=1)
    D = D / (np.linalg.norm(D, axis=2, keepdims=True) + 1e-12)
    D = np.vstack([D.reshape(-1, 3)] * 2)
    T = np.broadcast_to(tendon(u, v), (nu, nv)).reshape(-1)
    W = np.broadcast_to(share(u, v), (nu, nv)).reshape(-1)
    return Vv, F, D, np.r_[T, T], np.r_[W, W]


def _sm(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def masseter(side, verts, pts):
    """From the lower edge of the zygomatic arch down to the outer face of the ramus and the angle of the mandible."""
    sg = -1 if side == "R" else 1
    Side = "Right" if side == "R" else "Left"
    arch = np.vstack([verts(f"{Side} zygomatic bone"), verts(f"{Side} temporal bone")])
    md = verts("Mandible")
    md = md[md[:, 0] * sg > 0.015]
    O = []
    for z in np.linspace(0.044, 0.002, 14):   # the arch's lower edge, front to back
        b = arch[np.abs(arch[:, 2] - z) < 0.003]
        b = b[b[:, 0] * sg > (b[:, 0] * sg).max() - 0.006]
        O.append(b[b[:, 1].argmin()])
    O = _resample(_chaikin(np.array(O), 2), 22)
    # the insertion: along the lower border of the ramus from in front of the angle to the angle, then up its back edge
    zmin = md[:, 2].min()
    lowb = []
    for z in np.linspace(zmin + 0.034, zmin + 0.008, 10):
        b = md[np.abs(md[:, 2] - z) < 0.003]
        lowb.append(b[b[:, 1].argmin()] + np.array([0, 0.004, 0]))
    back = []
    for y in np.linspace(lowb[-1][1] + 0.006, lowb[-1][1] + 0.024, 5):
        b = md[np.abs(md[:, 1] - y) < 0.003]
        back.append(b[b[:, 2].argmin()] + np.array([0, 0, 0.004]))
    I = _resample(_chaikin(np.array(lowb + back), 2), 22)
    field = SideField(np.vstack([pts, md]), side, I[:, 1].min() - 0.02, O[:, 1].max() + 0.02, zmin - 0.02, O[:, 2].max() + 0.02)
    thick = lambda u, v: 0.0025 + 0.0085 * np.sin(np.pi * np.clip(v * 1.05, 0, 1)) ** 0.7 * (0.55 + 0.45 * np.sin(np.pi * u))
    tendon = lambda u, v: np.clip(1 - v / 0.12, 0, 1) * 0.9 + np.clip((v - 0.92) / 0.08, 0, 1) * 0.6
    share = lambda u, v: _sm(0.05, 0.95, v)
    return side_sheet(O, I, field, thick, tendon, share, nv=30)


def temporalis(side, verts, pts):
    """A fan from the temporal fossa, passing inside the zygomatic arch, to the coronoid process of the mandible."""
    sg = -1 if side == "R" else 1
    Side = "Right" if side == "R" else "Left"
    md = verts("Mandible")
    md = md[md[:, 0] * sg > 0.015]
    zmin = md[:, 2].min()
    ant = md[(md[:, 2] > zmin + 0.02) & (md[:, 2] < zmin + 0.05)]
    cor = ant[ant[:, 1].argmax()]   # the tip of the coronoid process
    wall = np.vstack([verts(f"{Side} temporal bone"), verts(f"{Side} parietal bone"), verts("Frontal bone"), verts("Sphenoid bone")])
    wall = wall[wall[:, 0] * sg > 0.02]
    arch_top = 1.636   # the zygomatic arch's top edge here; below it the muscle runs inside the arch
    # the temporal line: an arc over the fossa, from the frontal bone's zygomatic process round to the supramastoid crest
    cy, cz, ry, rz = arch_top + 0.004, cor[2] - 0.016, 0.062, 0.064
    ang = np.linspace(np.radians(12), np.radians(178), 30)
    O = np.stack([np.zeros_like(ang), cy + ry * np.sin(ang) * 0.85, cz + rz * np.cos(ang)], 1)
    O[:, 1] -= 0.006 * np.cos(ang) ** 2
    # the insertion: round the coronoid process, from its front edge over the tip to its back edge
    I = []
    for a in np.linspace(0, 1, 30):
        I.append(cor + np.array([0, -0.010 * abs(a - 0.45) * 2, -0.012 * (a - 0.35)]))
    I = np.array(I)
    I[:, 0] = cor[0] + sg * 0.002
    field = SideField(wall, side, cor[1] - 0.02, O[:, 1].max() + 0.012, O[:, 2].min() - 0.012, O[:, 2].max() + 0.012, fill_down_from=arch_top + 0.004)
    O[:, 0] = sg * (field.lateral(O[:, 1], O[:, 2]) + 0.0008)
    thick = lambda u, v: 0.002 + 0.007 * np.sin(np.pi * np.clip(v * 1.2, 0, 1)) ** 0.6 * (0.5 + 0.5 * np.sin(np.pi * u)) * (1 - 0.6 * _sm(0.7, 1.0, v))
    tendon = lambda u, v: _sm(0.62, 0.85, v) + 0 * u
    share = lambda u, v: _sm(0.55, 0.95, v) + 0 * u
    return side_sheet(O, I, field, thick, tendon, share, nv=40, smooth=4)

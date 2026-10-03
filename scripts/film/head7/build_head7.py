"""Film 7's specimen: the head and neck cut down the middle, right half kept, cut faces closed (BodyParts3D, CC BY 4.0).
Writes ../models/head7.glb (one node per part, named "<group>|<material>|<name>") and ../models/head7.json (landmarks).
Coordinates: BodyParts3D metres scaled to a 1.83 m adult (as the films' kit), then moved so the origin sits between the
jaw joints at the midline. +x is the body's left (the cut face looks along +x), +y up, +z forward."""
import sys, json, os
import numpy as np, trimesh
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'atlas'))   # scripts/atlas
from source import find, load
from focus import closed, loop, MIDLINE

HERE = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(HERE, '..', 'models')
SCALE = 1.83 / 1.73

def get(name, side=None):
    ps = find(name)
    if not ps: raise KeyError(name)
    if side == 'right': ps = sorted(ps, key=lambda p: p['bounds'][0][0] + p['bounds'][1][0])
    return load(ps[0])

def cut(V, F, cap=True):
    m = trimesh.Trimesh(V, F, process=True)
    out = trimesh.intersections.slice_mesh_plane(m, np.array([-1.0, 0, 0]), np.array([MIDLINE, 0, 0]), cap=cap and m.is_watertight)
    return np.asarray(out.vertices), np.asarray(out.faces, dtype=np.int64), bool(cap and m.is_watertight)

pieces = []   # (group, material, name, V, F)
def half(nm, group, mat, sub=0, shells=False, h=0.0003):
    V, F = get(nm)
    if shells:
        V, F = closed(V, F, h=h)
        if h >= 0.0005 and len(F) > 16000:   # a coarse voxel shell is dense: bring it back to about the source's density
            import fast_simplification
            V, F = fast_simplification.simplify(V.astype(np.float32), F.astype(np.int32), target_reduction=1 - 14000 / len(F))
            V, F = V.astype(np.float64), F.astype(np.int64)
    V, F = loop(V, F, sub)
    V, F, capped = cut(V, F)
    if not capped: print('  not capped:', nm)
    pieces.append((group, mat, nm + ' (right half)', V, F))
def right(nm, group, mat, sub=0):
    V, F = get(nm, 'right')
    if V[:, 0].mean() > 0: raise ValueError('not right: ' + nm)
    V, F = loop(V, F, sub)
    pieces.append((group, mat, nm, V, F))

# ---- the skull (does not move)
for nm in ('Frontal bone', 'Sphenoid bone', 'Ethmoid', 'Vomer'): half(nm, 'skull', 'bone')
half('Occipital bone', 'skull', 'bone', shells=True, h=0.0006)
for nm in ('Right parietal bone', 'Right temporal bone', 'Right maxilla', 'Right palatine bone', 'Right zygomatic bone', 'Right nasal bone',
           'Right lacrimal bone', 'Right inferior nasal concha'): right(nm, 'skull', 'bone')
TEETH = ('central secondary incisor', 'lateral secondary incisor', 'secondary canine', 'first secondary premolar', 'second secondary premolar',
         'first secondary molar', 'second secondary molar')
for t in TEETH: right(f'Right upper {t} tooth', 'skull', 'tooth')
half('Gingiva of upper jaw', 'skull', 'gum')
# ---- the lower jaw (turns at the jaw joints)
half('Mandible', 'jaw', 'bone')
for t in TEETH: right(f'Right lower {t} tooth', 'jaw', 'tooth')
half('Gingiva of lower jaw', 'jaw', 'gum')
# ---- soft parts
half('Tongue', 'tongue', 'tongue', sub=2)
for nm in ('Right genioglossus', 'Right hyoglossus', 'Right mylohyoid', 'Right geniohyoid', 'Right stylohyoid'): right(nm, 'floor', 'muscle', sub=1)
for V, F in [load(p) for p in find('Right digastric')]:
    if V[:, 0].mean() < 0: pieces.append(('floor', 'muscle', 'Right digastric', V, F))
half('Hyoid bone', 'hyoid', 'bone')
for nm in ('Right levator veli palatini', 'Right tensor veli palatini'): right(nm, 'soft', 'muscle', sub=1)
half('Uvular muscle', 'soft', 'muscle', sub=1)
for nm in ('superior pharyngeal constrictor', 'middle pharyngeal constrictor', 'inferior pharyngeal constrictor', 'palatopharyngeus',
           'salpingopharyngeus', 'stylopharyngeus'):   # the source swaps the two middle constrictors: take each by position
    cands = [load(p) for p in find('Right ' + nm) + find('Left ' + nm)]
    V, F = min(cands, key=lambda vf: vf[0][:, 0].mean())
    pieces.append(('throat', 'wall', nm + ' (right)', V, F))
half('Epiglottis', 'throat', 'cartilage'); half('Thyroid cartilage', 'throat', 'cartilage'); half('Cricoid cartilage', 'throat', 'cartilage')
right('Right arytenoid cartilage', 'throat', 'cartilage'); half('Trachea', 'throat', 'cartilage')
half('Septal nasal cartilage', 'nose', 'cartilage'); right('Right lateral nasal cartilage', 'nose', 'cartilage'); right('Right major alar cartilage', 'nose', 'cartilage')
half('Lip', 'lip', 'lip', shells=True)
for nm in ('Atlas', 'Axis', 'Third cervical vertebra', 'Fourth cervical vertebra', 'Fifth cervical vertebra', 'Sixth cervical vertebra', 'Seventh cervical vertebra'):
    half(nm, 'spine', 'bone')
for nm in ('Intervertebral disk of axis', 'Intervertebral disk of third cervical vertebra', 'Intervertebral disk of fourth cervical vertebra',
           'Intervertebral disk of fifth cervical vertebra', 'Intervertebral disk of sixth cervical vertebra', 'Intervertebral disk of seventh cervical vertebra'):
    try: half(nm, 'spine', 'disc')
    except KeyError: print('  missing', nm)

# ---- landmarks (source frame), then the film frame
mand = [p for p in pieces if p[2].startswith('Mandible')][0][3]
Vm, Fm = get('Mandible')
def condyle(sign):
    s = Vm[(Vm[:, 0] * sign > 0.03) & (Vm[:, 2] < 0.012)]
    top = s[s[:, 1] > np.percentile(s[:, 1], 96)]
    return top.mean(0)
cR, cL = condyle(-1), condyle(1)
O = np.array([MIDLINE, (cR[1] + cL[1]) / 2, (cR[2] + cL[2]) / 2])   # between the jaw joints, at the midline
def film(v): return (np.asarray(v) - O) * SCALE
inc = get('Right upper central secondary incisor tooth')[0]; linc = get('Right lower central secondary incisor tooth')[0]
pal = get('Right maxilla')[0]
L = {
    'scale': SCALE, 'origin_src': O.tolist(),
    'condyleR': film(cR).tolist(), 'condyleL': film(cL).tolist(),
    'upperIncisorEdge': film(inc[np.argmin(inc[:, 1])]).tolist(), 'upperIncisorBack': film(inc[np.argmin(inc[:, 2] + 2 * (inc[:, 1] - inc[:, 1].min()))]).tolist(),
    'lowerIncisorEdge': film(linc[np.argmax(linc[:, 1])]).tolist(),
    'chin': film(Vm[np.argmin(Vm[:, 1] - 0.3 * Vm[:, 2])]).tolist(),
}
scene = trimesh.Scene()
bb = []
for g, mat, nm, V, F in pieces:
    m = trimesh.Trimesh(film(V), F, process=True); m.merge_vertices(); trimesh.repair.fix_normals(m)
    scene.add_geometry(m, node_name=f'{g}|{mat}|{nm}', geom_name=f'{g}|{mat}|{nm}')
    bb.append((nm, m.bounds.round(4).tolist(), len(m.vertices)))
os.makedirs(OUT, exist_ok=True)
open(os.path.join(OUT, 'head7.glb'), 'wb').write(trimesh.exchange.gltf.export_glb(scene))
json.dump({**L, 'parts': bb}, open(os.path.join(OUT, 'head7.json'), 'w'), indent=1)
print(len(pieces), 'pieces', sum(b[2] for b in bb), 'vertices'); print(json.dumps({k: v for k, v in L.items()}, indent=0)[:900])

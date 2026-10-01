"""Read meshes from the BodyParts3D set as prepared by the human-atlas project (atlas.json + body-*.bin)."""
import json, os
import numpy as np

MODELS = os.environ.get("ATLAS_SRC", "/home/claude/eouchi147/human-atlas/public/models")
A = json.load(open(os.path.join(MODELS, "atlas.json")))
_chunks = {}


def chunk(ci):
    if ci not in _chunks:
        _chunks[ci] = open(os.path.join(MODELS, A["chunks"][ci]["url"].split("/")[-1]), "rb").read()
    return _chunks[ci]


def load(p, get=None):
    buf = (get or chunk)(p["chunk"])
    V = np.frombuffer(buf, dtype=np.float32, count=p["vertexCount"] * 3, offset=p["positions"]).reshape(-1, 3).astype(np.float64)
    F = np.frombuffer(buf, dtype=np.uint32, count=p["indexCount"], offset=p["indices"]).reshape(-1, 3).astype(np.int64)
    return V, F


def find(name, exact=True):
    """Every mesh with this name (the source has a few exact copies: the larger one comes first)."""
    n = name.lower()
    got = [p for p in A["parts"] if (p["name"].lower() == n if exact else n in p["name"].lower())]
    return sorted(got, key=lambda p: -p["vertexCount"])


def mesh(name):
    """One mesh by its exact name (the larger copy when the source has two)."""
    got = find(name)
    if not got:
        raise KeyError(name)
    return load(got[0])

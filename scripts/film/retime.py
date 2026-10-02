"""Re-time a finished film to a new voice. A film's own timeline T (old) is mapped to the new voice's word times through a
smooth, monotone curve (Fritsch-Carlson cubic, identical to kit.js timeMap). The renderer shows, at new time t, the film at
map(t); the sound script places every cue at the new time of its old event (inverse map)."""
import json, bisect
import numpy as np

def timemap(R):
    x = [r[0] for r in R]; y = [r[1] for r in R]; n = len(x)
    d = [(y[i + 1] - y[i]) / (x[i + 1] - x[i]) for i in range(n - 1)]
    m = [0.0] * n; m[0] = d[0]; m[n - 1] = d[n - 2]
    for i in range(1, n - 1): m[i] = 0.0 if d[i - 1] * d[i] <= 0 else (d[i - 1] + d[i]) / 2
    for i in range(n - 1):
        if d[i] == 0: m[i] = 0.0; m[i + 1] = 0.0; continue
        a, b = m[i] / d[i], m[i + 1] / d[i]; s = a * a + b * b
        if s > 9: k = 3 / s ** 0.5; m[i] = k * a * d[i]; m[i + 1] = k * b * d[i]
    def f(t):
        if t <= x[0]: return y[0] + (t - x[0]) * m[0]
        if t >= x[n - 1]: return y[n - 1] + (t - x[n - 1]) * m[n - 1]
        i = 0
        while t > x[i + 1]: i += 1
        h = x[i + 1] - x[i]; s = (t - x[i]) / h; s2 = s * s; s3 = s2 * s
        return (2 * s3 - 3 * s2 + 1) * y[i] + (s3 - 2 * s2 + s) * h * m[i] + (-2 * s3 + 3 * s2) * y[i + 1] + (s3 - s2) * h * m[i + 1]
    return f

def inverse(f, lo=-5.0, hi=400.0):
    def g(u):
        a, b = lo, hi
        for _ in range(80):
            c = (a + b) / 2
            if f(c) < u: a = c
            else: b = c
        return (a + b) / 2
    return g

def anchors(old, new, extra=()):
    """old, new: {key: time}; pairs every key both have, plus extra (tNew, tOld) pairs; checks both run forward."""
    R = sorted([(new[k], old[k]) for k in old if k in new] + list(extra))
    for (a0, b0), (a1, b1) in zip(R, R[1:]):
        assert a1 > a0 and b1 > b0, f'anchors out of order: {(a0, b0)} {(a1, b1)}'
    return [[round(a, 3), round(b, 3)] for a, b in R]

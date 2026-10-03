"""Film 13 "Why does my lower back hurt?": score and sound design, timed to films/film13.js (the same ache, stamps, scans,
dead bug, walk and disc). Usage: python3 sound_film13.py <voice guide wav> <voice report json> <out dir>"""
import sys, math
import numpy as np
from sfx import Mix, SR, ss, env, bp, lp, hp, note

VOICE, REPORT, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
T = dict(end=77.3, lower=0.35, world=2.15, leading=3.03, disability=3.93, most=5.31, once=7.03, nine=8.85, ten=9.70, cant=9.99,
         disease=11.60, damage=12.52, disc=14.11, scan=16.12, t37=18.19, twenty=20.14, eighty=22.13, t96=22.48, verdict=26.18,
         normal=26.63, not_=27.85, eases=30.87, weeks=32.07, comes=34.23, core=35.44, review=38.48, t29=39.06, noBetter=40.13,
         other=42.51, nhs=44.86, stay=46.30, carry=47.47, dont=49.09, bed=49.76, notEasing=51.76, seeDoc=57.93, pain=59.72,
         legs=62.84, emergency=70.32, back=73.09, factory=73.95, settings=74.25, logo=74.95)
m = Mix(T['end'], seed=20261013)
rng = np.random.default_rng(1313)
def s5(a, b, x):
    u = np.clip((np.asarray(x, dtype=float) - a) / (b - a), 0, 1); return u * u * u * (u * (u * 6 - 15) + 10)

# ---------------------------------------------------------------- the ache: a dull throb with the red glow (the picture's 0.55 + 0.45 sin(2.6 t)^2)
tt = m.t(0, 8.2); n = len(tt)
glow = (0.55 + 0.45 * np.sin(tt * 2.6) ** 2) * (1 - ss(6.5, 8.0, tt)) * ss(0.0, 0.6, tt)
throb = lp(np.sin(2 * np.pi * 55 * tt) + 0.6 * np.sin(2 * np.pi * 110 * tt) + 0.3 * m.noise(n) * 0.2, 300)
m.add('X', throb * glow ** 2 * 0.028, 0, -0.05)
# the trophy, lit: one bright ting of gilt metal
m.bell(2.55, 96, 0.012, 0.35, 1.6, buf='X'); m.bell(2.56, 103, 0.006, 0.35, 1.2, buf='X')

# ---------------------------------------------------------------- past the skeleton to the light box; it flickers on
m.whoosh(7.5, 1.6, 250, 1800, 0.022, 0.2)
m.tick(7.45, 0.03, 0.15, hi=2400, lo=700); m.tick(7.62, 0.02, 0.15, hi=2600, lo=800)
tt2 = m.t(7.5, 35.6); hum = (np.sin(2 * np.pi * 100 * tt2) + 0.4 * np.sin(2 * np.pi * 200 * tt2)) * ss(7.5, 8.4, tt2) * (1 - ss(35.0, 35.6, tt2))
m.add('X', lp(hum, 400) * 0.0022, 7.5, 0.15)
for k in range(10): m.rustle(7.7 + k * 0.05, 7.82 + k * 0.05, 0.004, 0.1)          # the films go up
# nine stamps: NON-SPECIFIC
for n_ in range(9):
    at = T['nine'] + 0.2 + n_ * 0.42
    m.thud(at, 120, 0.032, 0.12 + 0.02 * (n_ % 3), 0.05); m.tick(at + 0.004, 0.014, 0.12, hi=1500, lo=450)

# ---------------------------------------------------------------- the scans: two hundred appear; the worn discs go dark, tick by tick
m.tick(13.95, 0.02, 0.1, hi=2200, lo=900)                                              # the slide changes
m.shimmer(T['scan'] - 0.3, (84, 89, 93), 0.008, 0.1, 0.6, 1.8)
for gi, (n_, t0, dur) in enumerate([(37, T['t37'] - 0.2, 1.1), (96, T['t96'] - 0.4, 1.3)]):
    for k in range(n_): m.tick(t0 + dur * (k + 0.5) / n_, 0.004 + 0.002 * (k % 5 == 0), -0.2 + 0.4 * gi, hi=4200, lo=2200)
# the verdict: stamped twice
for at in (T['normal'], T['not_']):
    m.thud(at, 90, 0.05, 0.0, 0.07); m.tick(at + 0.006, 0.02, 0.0, hi=1300, lo=400)

# ---------------------------------------------------------------- pain falls from 52 to 23; and comes back
m.tick(29.2, 0.02, 0.1, hi=2200, lo=900)
m.tone_line(T['eases'] - 0.3, T['weeks'] + 0.6, 74, gain=0.009, pan=0.1, glide=lambda t: -6 * ss(T['eases'] - 0.3, T['weeks'] + 0.3, t))
m.tock(T['comes'] + 0.05, 0.03, 0.1, f=330); m.thud(T['comes'] + 0.08, 140, 0.02, 0.1, 0.05)
m.tick(35.1, 0.03, 0.15, hi=2000, lo=600)                                              # the light box goes off
m.whoosh(35.2, 1.2, 300, 1600, 0.02, -0.2)

# ---------------------------------------------------------------- the dead bug: arm and leg reach out, slowly, and come back (soft on the mat)
for t0 in (35.9, 38.6, 41.3):
    m.swish(t0 + 0.05, 0.9, 0.012, -0.2, 900); m.swish(t0 + 1.55, 0.9, 0.01, -0.2, 800)
    m.rustle(t0 + 0.2, t0 + 0.7, 0.004, -0.25)

# ---------------------------------------------------------------- the walk: bare bone heels on a hard floor, past the bed
STRIDE = 1.12; D = math.hypot(0.32, 2.55); S_STOP = 0.25 * STRIDE; s0 = S_STOP - (D - 0.15); dist = S_STOP - s0
def ease(t, t0=45.0, t1=50.9, d=dist, ramp=1.0):
    Tt = t1 - t0; v = d / (Tt - ramp); u = min(max((t - t0) / Tt, 0), 1) * Tt
    if u < ramp: return v * u * u / (2 * ramp)
    if u > Tt - ramp: r = Tt - u; return d - v * r * r / (2 * ramp)
    return v * (u - ramp / 2)
ts = np.arange(44.9, 51.2, 0.002); sv = np.array([s0 + ease(t) for t in ts])
for side, off in (('R', 0.0), ('L', 0.5)):
    ph = sv / STRIDE - off; k = np.floor(ph)
    for i in np.where(np.diff(k) > 0)[0]:
        at = float(ts[i + 1]); pan = 0.12 if side == 'R' else -0.12
        m.tock(at, 0.03, pan, f=560 + 40 * rng.random()); m.thud(at + 0.005, 160, 0.012, pan, 0.03)
m.tock(51.0, 0.022, -0.1, f=600)                                                       # the feet come together

# ---------------------------------------------------------------- the warnings, plain: the nerves light, a faint cold hum while they show
m.shimmer(51.4, (79, 84, 88), 0.006, 0.0, 0.9, 2.0)
tt3 = m.t(51.3, 72.9); e3 = ss(51.3, 52.6, tt3) * (1 - ss(72.3, 72.9, tt3))
m.add('X', bp(m.noise(len(tt3)), 2400, 6000) * e3 * 0.0012, 51.3, 0.0)

# ---------------------------------------------------------------- the end: the disc, the logo
m.whoosh(72.6, 1.2, 200, 1300, 0.02, 0.2)
m.whoosh(T['settings'] - 0.2, T['logo'] - T['settings'] + 0.2, 220, 2600, 0.04, 0.0)
m.logo_end(T['logo'] - 0.15, T['logo'])

# ---------------------------------------------------------------- the score
m.pad([38, 50, 57, 62], 0.0, 7.6, 0.5, 900)                          # the sore back; the trophy
m.pad([41, 53, 57, 60], 7.6, 14.0, 0.5, 1000)                        # nine in ten
m.pad([43, 55, 58, 62], 14.0, 29.2, 0.5, 1100)                       # the scans; normal ageing
m.pad([40, 52, 55, 59], 29.2, 35.4, 0.5, 1000)                       # it eases; it comes back
m.pad([45, 57, 60, 64], 35.4, 44.9, 0.5, 1300)                       # the dead bug
m.pad([43, 55, 59, 62, 67], 44.9, 51.4, 0.5, 1400)                   # stay active
m.pad([38, 50, 53, 57], 51.4, 72.6, 0.5, 850)                        # the warnings
m.pad([41, 53, 60, 65, 69, 72], 72.6, T['end'], 1.0, 2400, rel=0.2)
m.pulse(16.4, 25.0, 92, [67, 70, 74, 70], 0.008, 1300, lvl=lambda t: float(ss(16.4, 17.2, t)) * (1 - float(ss(24.2, 25.0, t))))
m.room(0.005)
m.finish(REPORT, VOICE, OUT, 'film13')

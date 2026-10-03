"""Film 16 "How much water do you need?": score and sound design, timed to films/film16.js (the drink that falls through,
the drawer, the jugs, the bite, the note, the tubes, the card, the cylinder, the bibs, the scale).
Usage: python3 sound_film16.py <voice guide wav> <voice report json> <out dir>"""
import sys
import numpy as np
from sfx import Mix, SR, ss, env, bp, lp, hp, note

VOICE, REPORT, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
T = dict(end=76.15, water=0.35, eight=1.50, coffee=3.27, looking=6.39, none=9.79, two=12.90, women=14.13, twoHalf=14.58, men=15.87,
         every=17.55, drink=17.83, inFood=18.52, twenty=23.11, eat=25.17, counts2=27.79, hydrated=29.71, asWater=31.18, tea=33.08,
         cola=33.56, milk=34.40, moreIn=35.35, meals=40.44, pale=44.06, yellow=44.82, heat=47.55, long=48.34, ill=49.84, pregnant=50.10,
         overdoing=53.17, dangerous=54.29, thirteen=56.52, gaining=62.34, weight=62.89, race=64.07, back=72.00, factory=72.86,
         settings=73.16, logo=73.85)
POUR = (0.3, 2.25); BITE_SHUT = 25.2; G = 9.81
JAW, LEVEL = 1.56, 0.126                       # where the water leaves the jaw; the bucket's surface
FALL = np.sqrt(2 * (JAW - LEVEL) / G)
m = Mix(T['end'], seed=20261016)
rng = np.random.default_rng(1616)
def s5(a, b, x):
    u = np.clip((np.asarray(x, dtype=float) - a) / (b - a), 0, 1); return u * u * u * (u * (u * 6 - 15) + 10)
def pulse(t, a, b, r=0.35): return ss(a, a + r, t) * (1 - ss(b - r, b, t))

def stream_into(a, b, gain=0.03, pan=0.0, lo=500, hi=5000, bub=1.0):   # water falling into water: hiss, bubbles, a low churn
    tt = m.t(a, b); n = len(tt); e = ss(a, a + 0.05, tt) * (1 - ss(b - 0.25, b, tt))
    hiss = bp(m.noise(n), lo, hi) * (0.7 + 0.3 * np.sin(2 * np.pi * 7.3 * tt) * np.sin(2 * np.pi * 3.1 * tt))
    churn = lp(m.noise(n), 260) * 2.5
    m.add('X', (hiss + churn) * e * gain, a, pan)
    k = a
    while k < b - 0.05:   # bubbles: short rising sines
        f0 = rng.uniform(500, 1400) * bub; d = rng.uniform(0.02, 0.05); nn = int(d * SR); x = np.arange(nn) / SR
        m.add('X', np.sin(2 * np.pi * np.cumsum(f0 * (1 + 1.5 * x / d)) / SR) * env(nn, 0.002, d * 0.5) * gain * rng.uniform(0.3, 0.8), k, pan + rng.uniform(-0.1, 0.1))
        k += rng.uniform(0.03, 0.11)
def plop(at, gain=0.05, pan=0.0, f=420):
    nn = int(0.16 * SR); x = np.arange(nn) / SR
    m.add('X', np.sin(2 * np.pi * np.cumsum(f * (1 + 1.4 * (1 - np.exp(-x / 0.03)))) / SR) * env(nn, 0.002, 0.05) * gain, at, pan)
    m.add('X', bp(m.noise(int(0.12 * SR)), 1200, 7000) * env(int(0.12 * SR), 0.001, 0.03) * gain * 0.5, at + 0.005, pan)
def drip(at, gain=0.02, pan=0.0): plop(at, gain, pan, f=rng.uniform(800, 1300))
def svf_bp(x, fc, q=6.0):   # a band-pass whose centre moves sample by sample (a state-variable filter)
    low = band = 0.0; out = np.empty(len(x)); f = 2 * np.sin(np.pi * np.asarray(fc) / SR)
    for i in range(len(x)):
        high = x[i] - low - band / q; band += f[i] * high; low += f[i] * band; out[i] = band
    return out
def fill(a, b, gain=0.02, pan=0.0, f0=280, f1=980):   # a pour into a vessel: the hollow note rises as it fills
    tt = m.t(a, b); n = len(tt); u = np.clip((tt - a) / (b - a), 0, 1); fc = f0 + (f1 - f0) * u ** 1.2
    src = bp(m.noise(n), 300, 6000); out = svf_bp(src, fc, 7.0)
    e = ss(a, a + 0.06, tt) * (1 - ss(b - 0.12, b, tt))
    m.add('X', (out * 0.5 + 0.25 * src) * e * gain, a, pan)
def scribble(a, d, gain=0.012, pan=0.0):   # a felt marker on paper
    tt = m.t(a, a + d); n = len(tt); s = bp(m.noise(n), 1800, 7000) * (0.6 + 0.4 * np.abs(np.sin(2 * np.pi * 9 * tt))) * np.sin(np.pi * np.clip((tt - a) / d, 0, 1)) ** 0.6
    m.add('X', s * gain, a, pan)

# ---------------------------------------------------------------- the drink: it falls through, into the bucket
m.tick(0.05, 0.012, -0.1, hi=4200, lo=2600)                                   # the rim on its teeth
hitOn, hitOff = POUR[0] + FALL, POUR[1] + FALL
stream_into(hitOn, hitOff + 0.05, 0.03, 0.0)
plop(hitOn, 0.03)
for k, at in enumerate([hitOff + 0.15, hitOff + 0.45, hitOff + 0.9]): drip(at, 0.012 - 0.003 * k, 0.05)
# ---------------------------------------------------------------- the note; the drawer, empty
m.add('X', bp(m.noise(int(0.04 * SR)), 900, 3000) * env(int(0.04 * SR), 0.001, 0.015) * 0.008, 3.1, 0.2)    # paper, in passing
tt = m.t(T['looking'] - 0.12, T['looking'] + 0.85); m.add('X', bp(m.noise(len(tt)), 140, 900) * np.sin(np.pi * np.clip((tt - tt[0]) / 0.97, 0, 1)) ** 1.5 * 0.03, tt[0], -0.25)
m.thud(T['looking'] + 0.8, 150, 0.03, -0.25, 0.05); m.tick(T['looking'] + 0.805, 0.01, -0.25, hi=1600, lo=500)
# ---------------------------------------------------------------- the jugs fill; drinks and food hop; the fifth from food
fill(T['two'] - 0.2, T['women'] + 0.3, 0.018, -0.15, 260, 880)
fill(T['twoHalf'] - 0.2, T['men'] + 0.3, 0.018, 0.12, 240, 900)
for k, at in enumerate([T['every'] - 0.05, T['every'] + 0.12, T['every'] + 0.29, T['drink'] + 0.05, T['inFood'] + 0.2]):
    m.clink(at + 0.06, 0.006, -0.3 + 0.15 * k, f=2200 + 260 * k) if k < 4 else m.thud(at + 0.08, 210, 0.012, 0.3, 0.05)
m.shimmer(T['twenty'] - 0.05, (79, 84, 88), 0.004, -0.1, 0.5, 1.4)
# ---------------------------------------------------------------- the bite; the piece drops through, into the bucket
bt = BITE_SHUT
for k in range(5): m.add('X', bp(m.noise(int(0.035 * SR)), 1500, 9000) * env(int(0.035 * SR), 0.0008, 0.008) * 0.035 * (1 - 0.15 * k), bt - 0.01 + k * 0.022, 0.05)
m.add('X', lp(m.noise(int(0.08 * SR)), 600) * env(int(0.08 * SR), 0.002, 0.03) * 0.05, bt, 0.05)
chunkT = bt + 0.2 + FALL
m.whoosh(bt + 0.25, 0.5, 600, 2400, 0.006, 0.0)
plop(chunkT, 0.05, 0.0, f=330); drip(chunkT + 0.22, 0.012)
# ---------------------------------------------------------------- the note, corrected
scribble(T['counts2'] - 0.25, 0.45, 0.014, 0.1)
# ---------------------------------------------------------------- the tubes fill: water and coffee alike, tea and cola alike, milk more
fill(T['hydrated'] - 0.2, T['asWater'] + 0.2, 0.01, -0.25, 500, 1300); fill(T['hydrated'] - 0.15, T['asWater'] + 0.2, 0.009, -0.1, 520, 1320)
fill(T['tea'] - 0.15, T['tea'] + 0.45, 0.01, 0.0, 540, 1300); fill(T['cola'] - 0.15, T['cola'] + 0.45, 0.01, 0.12, 530, 1310)
fill(T['milk'], T['moreIn'] + 0.3, 0.011, 0.25, 480, 1500)
# ---------------------------------------------------------------- a meal; the colour card is ringed, ticked
m.clink(T['meals'] + 0.1, 0.006, 0.1, f=3100); m.clink(T['meals'] + 0.22, 0.004, 0.12, f=3600)
scribble(T['pale'] - 0.1, 0.9, 0.012, 0.05); scribble(T['yellow'], 0.3, 0.014, 0.2)
# ---------------------------------------------------------------- the cylinder: a pour for each reason; then over the top
for at in (T['heat'], T['long'], T['ill'], T['pregnant']):
    fill(at - 0.05, at + 0.45, 0.012, -0.05, 700, 900); m.tick(at + 0.02, 0.006, -0.3, hi=2600, lo=1200)
fill(T['overdoing'] - 0.2, T['dangerous'] + 0.4, 0.016, 0.0, 900, 1500)
stream_into(T['dangerous'] - 0.1, 55.6, 0.012, 0.0, 900, 6000, bub=1.4)                  # the spill, running down, pooling
for k in range(6): drip(T['dangerous'] + 0.3 + k * 0.17 + rng.uniform(0, 0.08), 0.008)
# ---------------------------------------------------------------- the bibs turn; the scale's needle swings up
for r in range(13): m.tick(T['thirteen'] - 0.1 + r * 0.045, 0.01, rng.uniform(-0.4, 0.4), hi=3000, lo=1400)
tt = m.t(T['gaining'] - 0.1, T['weight'] + 0.55); u = np.clip((tt - tt[0]) / (tt[-1] - tt[0]), 0, 1)
m.add('X', bp(m.noise(len(tt)), 300, 1600) * (0.5 + 0.5 * np.sin(2 * np.pi * 37 * tt)) * np.sin(np.pi * u) ** 2 * 0.01, tt[0], 0.1)
m.thud(T['gaining'] - 0.15, 90, 0.02, 0.1, 0.08)
# ---------------------------------------------------------------- the camera's moves
for a, b, g, pan in [(2.3, 3.05, 0.016, 0.3), (4.9, 5.95, 0.02, -0.35), (10.3, 11.4, 0.014, -0.3), (23.7, 24.6, 0.024, 0.4), (25.3, 25.95, 0.012, 0.0),
                     (26.55, 27.4, 0.016, 0.3), (28.6, 29.5, 0.016, 0.3), (36.0, 37.2, 0.014, 0.3), (41.2, 42.3, 0.01, 0.0), (45.6, 46.6, 0.014, 0.3),
                     (52.4, 53.4, 0.01, 0.0), (54.6, 55.9, 0.02, 0.35), (60.6, 61.8, 0.012, 0.0), (64.6, 65.9, 0.016, 0.3)]:
    m.whoosh(a + 0.05, b - a, 250, 1800, g, pan)
m.whoosh(71.6, 1.2, 220, 1500, 0.014, 0.0)
m.whoosh(T['settings'] - 0.2, T['logo'] - T['settings'] + 0.2, 220, 2600, 0.04, 0.0)
m.logo_end(T['logo'] - 0.15, T['logo'])
# ---------------------------------------------------------------- the score
m.pad([43, 55, 59, 62], 0.0, 5.2, 0.5, 1100)                         # water; eight glasses
m.pad([41, 53, 56, 60], 5.2, 10.6, 0.5, 950)                         # the study: none
m.pad([45, 57, 60, 64], 10.6, 24.5, 0.5, 1150)                       # 2 litres, 2.5; a fifth from food
m.pad([43, 55, 59, 62, 67], 24.5, 27.0, 0.5, 1250)                   # you eat some of your water
m.pad([48, 55, 60, 64], 27.0, 36.4, 0.5, 1300)                       # coffee counts; tea, cola; milk
m.pad([45, 57, 60, 64], 36.4, 46.0, 0.5, 1150)                       # thirst, meals; the NHS check
m.pad([41, 53, 57, 60], 46.0, 52.6, 0.5, 1000)                       # you may need more
m.pad([38, 50, 53, 57], 52.6, 65.2, 0.5, 900)                        # overdoing it; the marathon
m.pad([38, 50, 53, 57], 65.2, 71.8, 0.45, 820)                       # the warnings
m.pad([41, 53, 60, 65, 69, 72], 71.8, T['end'], 1.0, 2400, rel=0.2)
m.pulse(29.3, 36.2, 92, [67, 71, 74, 71], 0.007, 1300, lvl=lambda t: float(ss(29.3, 30.0, t)) * (1 - float(ss(35.6, 36.2, t))))
m.room(0.005)
m.finish(REPORT, VOICE, OUT, 'film16')

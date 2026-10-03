"""Film 18 "What do cold showers really do?": score and sound design, timed to films/film18.js (the shower and the chattering
jaw, the tiles of one shower and a month, the bars of sick days, a hundred tiles, NO PROOF stamped twice, two sections after
training, the fat on the scale, two hours on the clock and a day count to 42, the plunge: a gasp, breathing, a pulse; the dial).
Usage: python3 sound_film18.py <voice guide wav> <voice report json> <out dir>"""
import sys, math
import numpy as np
from sfx import Mix, SR, ss, env, bp, lp, hp, note

VOICE, REPORT, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
T = dict(end=78.48, showers=1.04, supposedly=2.01, ended=8.03, thirty=9.53, every=11.75, normal=15.49, noFewer=21.21, t91=23.51, t64=26.55,
         review=31.99, no=35.57, proof=35.77, training=42.35, growth=44.19, zero=48.33, with2=52.37, two=52.95, inCold=53.78, aDay=54.66, day2=55.16,
         breathing=59.52, gasp=59.15, ten=60.63, harder=62.05, heart=63.06, shock2=64.41, healthy=69.15, back=74.33, factory=75.19, settings=75.49, logo=76.18)
SWAP1, SWAP2 = 10.0, 55.3
m = Mix(T['end'], seed=20261128)
rng = np.random.default_rng(1818)
def jhash(n): s = math.sin(n * 127.1 + 311.7) * 43758.5453; return s - math.floor(s)   # the film's hash, so clicks match the jaw
def sm(a, b, x): return float(ss(a, b, x))

# ---------------------------------------------------------------- the shower: spray on the tray, warm then cold; it stays on, heard from further off
t = m.t(0.0, 16.0); far = 1 - 0.55 * np.array([sm(5.6, 6.8, x) for x in t[::4800]]).repeat(4800)[:len(t)]
gone = 1 - np.array([sm(14.1, 15.3, x) for x in t[::4800]]).repeat(4800)[:len(t)]
cold = np.array([sm(T['showers'] - 0.1, T['showers'] + 0.5, x) for x in t[::4800]]).repeat(4800)[:len(t)]
spray = bp(m.noise(len(t)), 1800, 9000) * (0.7 + 0.3 * lp(np.abs(m.noise(len(t))), 30) * 2)
spray_c = bp(m.noise(len(t)), 2600, 12000)
drum = bp(m.noise(len(t)), 180, 900) * (0.5 + 0.5 * lp(np.abs(m.noise(len(t))), 12) * 3)
m.add('X', ((spray * (1 - cold) + spray_c * cold * 1.1) * 0.012 + drum * 0.008) * far * gone * np.clip(t / 0.4, 0, 1), 0.0, -0.15)
steam = hp(m.noise(int(3.2 * SR)), 5000) * np.linspace(1, 0, int(3.2 * SR)) ** 2 * 0.004; m.add('X', steam, 0.0, -0.3)
# the mixer turned to cold
m.clink(T['showers'] - 0.12, 0.05, 0.35, f=2300); m.swish(T['showers'] - 0.1, 0.35, 0.02, 0.35, f=2600)
# the jaw: a click each time the teeth meet (the film's chatter: ~7.3 a second, uneven)
def chatter_on(x):
    if x < SWAP1: return sm(T['showers'] + 0.4, T['showers'] + 0.7, x) * (1 - 0.7 * sm(5.8, 6.8, x))
    if x < SWAP2: return sm(T['with2'] - 0.4, T['with2'], x) * (1 - 0.6 * sm(54.4, 54.9, x)) * (0.0 if x < 52.4 else 1.0)
    return 0.0
x = 0.0; dt = 1 / 4800.0; prev = None
while x < SWAP2:
    ph = x * 7.3 + 0.3 * math.sin(x * 2.1); f = ph - math.floor(ph)
    if prev is not None and prev < 0.4 <= f:
        g = chatter_on(x)
        if g > 0.02:
            kick = 0.6 + 0.4 * jhash(math.floor(ph)); n = int(0.05 * SR); xx = np.arange(n) / SR; fr = rng.uniform(2600, 3600)
            click = (np.sin(2 * np.pi * fr * xx) * 0.5 + bp(m.noise(n), 1500, 7000)) * env(n, 0.0004, 0.006) + np.sin(2 * np.pi * 420 * xx) * env(n, 0.0008, 0.012) * 0.4
            m.add('X', click * 0.028 * g * kick, x, -0.12 if x < SWAP1 else 0.0)
    prev = f; x += dt
# ---------------------------------------------------------------- the panel: one shower in six tiles; a month in thirty
def tile(at, f, gain=0.012, pan=0.0):   # a ceramic tile, tapped
    n = int(0.25 * SR); xx = np.arange(n) / SR
    s = sum(np.sin(2 * np.pi * f * r * xx) * np.exp(-xx / d) * w for r, d, w in [(1, 0.05, 1), (2.7, 0.025, 0.5), (5.1, 0.012, 0.3)]) + bp(m.noise(n), 1500, 8000) * env(n, 0.0004, 0.004) * 0.6
    m.add('X', s * gain, at, pan)
for k in range(5): tile(T['ended'] + k * 0.18 + 0.05, 620 + 25 * k, 0.012, -0.25 + 0.1 * k)
tile(T['thirty'] + 0.02, 1320, 0.016, 0.3); m.shimmer(T['thirty'] + 0.05, (88, 95), 0.012, 0.3, 0.4, 1.2)
for k in range(30): tile(T['every'] + k * 0.055 + 0.04, 900 + 18 * k, 0.006, -0.35 + 0.7 * ((k % 6) / 5))
# ---------------------------------------------------------------- sick days: bars, tile by tile
for bi in range(4):
    full = [10, 7.1, 10, 10][bi]
    for k in range(10):
        if full - k <= 0: break
        a = (T['normal'] + 0.2 if bi < 2 else T['noFewer']) + k * (0.17 if bi < 2 else 0.09) + (bi % 2) * (0.06 if bi < 2 else 0.04)
        tile(a + 0.03, (700 if bi % 2 == 0 else 1100) + 30 * k, 0.007 * (0.5 if full - k < 1 else 1), -0.3 + 0.06 * k)
# ---------------------------------------------------------------- a hundred: 91 turn blue; 27 go back
for i in range(91): tile(T['t91'] - 0.05 + i * 0.008 + 0.06, 1000 + 7 * i, 0.0035, -0.4 + 0.8 * ((i % 10) / 9))
for j, i in enumerate(range(90, 63, -1)): tile(T['t64'] + (90 - i) * 0.02 + 0.08, 900 - 6 * j, 0.0028, -0.4 + 0.8 * ((i % 10) / 9))
# ---------------------------------------------------------------- eleven little tubs; NO PROOF, twice
for k in range(11): m.clink(T['review'] + k * 0.13 + 0.06, 0.012, -0.35 + 0.07 * k, f=2600 + 60 * k)
for at, pan in [(T['no'] - 0.05, -0.2), (T['proof'] + 0.25, 0.2)]:
    m.thud(at + 0.02, 85, 0.06, pan, 0.08); n = int(0.12 * SR); m.add('X', bp(m.noise(n), 400, 4000) * env(n, 0.0005, 0.02) * 0.05, at + 0.02, pan)
# ---------------------------------------------------------------- after training: two sections grow, one less; a little ice
def swell(a, b, gain=0.01, pan=0.0, f0=110, f1=160):
    tt = m.t(a, b); u = np.clip((tt - a) / (b - a), 0, 1); f = f0 + (f1 - f0) * u
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.3 * lp(m.noise(len(tt)), 400); m.add('X', s * np.sin(np.pi * u) ** 1.5 * gain, a, pan)
swell(T['training'] - 0.1, T['growth'] + 0.6, 0.012, -0.2, 100, 160); swell(T['training'] - 0.1, T['growth'] + 0.6, 0.008, 0.2, 100, 118)
for k in range(3): m.clink(40.6 + k * 0.17, 0.008, 0.3, f=3300 + 300 * k)
# ---------------------------------------------------------------- the fat lands on the scale; the scale reads it
land = T['zero'] - 0.2 + math.sqrt(2 * 0.4 / 9.81)
m.thud(land, 70, 0.08, -0.25, 0.12); n = int(0.2 * SR); m.add('X', lp(m.noise(n), 900) * env(n, 0.001, 0.03) * 0.05, land, -0.25)
m.beep(land + 0.42, 1760.0, 0.09, 0.03, -0.25)
# ---------------------------------------------------------------- two hours on the clock: ticks that race and settle; the days run to 42
a, b = T['two'], T['inCold'] + 0.6; x = a
while x < b:
    u = (x - a) / (b - a); rate = 4 + 26 * math.sin(math.pi * u); m.tick(x, 0.03 * (0.5 + 0.5 * math.sin(math.pi * u)), 0.3, hi=2400, lo=900); x += 1 / rate
prev = 1
for i in range(400):
    x = T['aDay'] - 0.05 + i * 0.0025; d = 1 + round(41 * sm(T['aDay'] - 0.05, T['day2'] + 0.25, x))
    if d != prev: m.tick(x, 0.018, 0.2, hi=3000, lo=1400); prev = d
# ---------------------------------------------------------------- the plunge: water, ice; a gasp; breathing that races; a pulse that runs
t = m.t(56.0, 74.6); lap = lp(m.noise(len(t)), 500) * (0.5 + 0.5 * np.sin(2 * np.pi * 0.35 * t)) * 0.012 + bp(m.noise(len(t)), 2000, 6000) * 0.0015
fade = np.clip((t - 56.0) / 0.6, 0, 1) * np.clip((74.6 - t) / 0.8, 0, 1); m.add('X', lap * fade, 56.0, 0.0)
for k in range(9): m.clink(56.6 + k * 1.9 + rng.uniform(0, 0.8), 0.006, rng.uniform(-0.4, 0.4), f=rng.uniform(3200, 4200))
n = int(0.45 * SR); xx = np.arange(n) / SR; g = np.sin(np.pi * np.clip(xx / 0.45, 0, 1)) ** 0.6 * np.exp(-xx / 0.3)
m.add('X', bp(m.noise(n), 900, 5000) * g * 0.05, T['gasp'] - 0.04, 0.0)
def rate_int(t, base, peak, t0, t1, t2, t3):
    N = 2000; a = 0.0; dt = (t - a) / N; ph = 0.0
    for i in range(N):
        tt = a + (i + 0.5) * dt; ph += (base + (peak - base) * sm(t0, t1, tt) * (1 - sm(t2, t3, tt))) * dt
    return ph
def events(base, peak, t0, t1, t2, t3, a, b, step=0.004):
    out = []; ph0 = rate_int(a, base, peak, t0, t1, t2, t3); x = a
    while x < b:
        r = base + (peak - base) * sm(t0, t1, x) * (1 - sm(t2, t3, x)); ph1 = ph0 + r * step
        if math.floor(ph1) > math.floor(ph0): out.append(x)
        ph0 = ph1; x += step
    return out
BR = (0.25, 2.5, T['breathing'] - 0.1, T['ten'] + 0.3, T['heart'] + 1.0, T['shock2'] + 3.0)
for at in events(*BR, T['breathing'], 64.6):
    r = BR[0] + (BR[1] - BR[0]) * sm(BR[2], BR[3], at) * (1 - sm(BR[4], BR[5], at)); per = 1 / r; n = int(per * SR); xx = np.arange(n) / SR; u = xx / per
    s = bp(m.noise(n), 700, 4200) * (np.sin(np.pi * np.clip(u / 0.45, 0, 1)) ** 1.5 * (u < 0.45) + 0.55 * np.sin(np.pi * np.clip((u - 0.5) / 0.45, 0, 1)) ** 1.5 * (u >= 0.5))
    m.add('X', s * 0.016 * (1 - sm(63.9, 64.6, at)), at, 0.1)
HB = (1.15, 2.6, T['harder'] - 0.2, T['heart'] + 0.2, T['shock2'] + 1.0, T['healthy'])
for at in events(*HB, 59.6, 64.6):
    g = (1 - sm(63.8, 64.6, at)); m.heartbeat(at, 0.07 * g, 0.25)
    if 60.2 < at < 63.8: m.beep(at + 0.03, 1568.0, 0.06, 0.012, 0.35)
# ---------------------------------------------------------------- the dial goes back to the middle
m.clink(T['back'] + 0.35, 0.03, -0.2, f=2100); m.swish(T['back'] + 0.2, 0.5, 0.015, -0.2, f=1800)
# ---------------------------------------------------------------- the camera's moves
for a, b, g, pan in [(5.6, 6.8, 0.014, 0.3), (14.15, 15.2, 0.016, 0.3), (22.85, 23.75, 0.016, 0.3), (28.5, 29.5, 0.016, 0.3), (37.4, 38.4, 0.016, 0.3),
                     (45.1, 46.1, 0.016, 0.3), (51.95, 52.75, 0.014, -0.2), (54.4, 54.9, 0.012, 0.25), (55.35, 56.3, 0.018, 0.3), (59.45, 60.15, 0.014, 0.3),
                     (63.75, 64.55, 0.014, -0.3)]:
    m.whoosh(a + 0.05, b - a, 250, 1800, g, pan)
m.whoosh(73.5, 1.4, 220, 1500, 0.016, -0.2)
m.whoosh(T['settings'] - 0.2, T['logo'] - T['settings'] + 0.2, 220, 2600, 0.04, 0.0)
m.logo_end(T['logo'] - 0.15, T['logo'])
# ---------------------------------------------------------------- the score
m.pad([38, 50, 57, 62], 0.0, 5.9, 0.5, 1000)                         # the shower
m.pad([41, 53, 57, 60], 5.9, 14.2, 0.5, 1100)                        # the trial: one shower, a month
m.pad([43, 55, 58, 62], 14.2, 22.9, 0.5, 1150)                       # sick days
m.pad([45, 57, 60, 64], 22.9, 28.6, 0.5, 1200)                       # a hundred
m.pad([40, 52, 55, 59], 28.6, 37.4, 0.5, 1000)                       # no proof
m.pad([38, 50, 53, 57], 37.4, 45.1, 0.5, 950)                        # lifting
m.pad([43, 55, 59, 62], 45.1, 55.6, 0.5, 1150)                       # fat, the cold, a day
m.pad([37, 49, 52, 56], 55.6, 64.4, 0.5, 900)                        # cold shock
m.drone(56.0, 64.6, 37, 0.02, 420)
m.pad([41, 53, 56, 60], 64.4, 74.2, 0.38, 900)                       # the warning, plain
m.pad([41, 53, 60, 65, 69, 72], 74.2, T['end'], 1.0, 2400, rel=0.2)
m.pulse(14.6, 28.3, 92, [64, 67, 71, 67], 0.006, 1300, lvl=lambda x: sm(14.6, 15.4, x) * (1 - sm(27.5, 28.3, x)))
m.pulse(46.2, 55.2, 84, [62, 67, 69, 67], 0.005, 1200, lvl=lambda x: sm(46.2, 47.0, x) * (1 - sm(54.4, 55.2, x)))
m.room(0.005)
m.finish(REPORT, VOICE, OUT, 'film18')

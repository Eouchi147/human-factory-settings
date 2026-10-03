"""Film 17 "How do I build muscle?": score and sound design, timed to films/film17.js (the flex, the rack, light against
heavy, the week, the sets, the splits, the bricks, the chart, the leg extensions, the balance, the plate).
Usage: python3 sound_film17.py <voice guide wav> <voice report json> <out dir>"""
import sys
import numpy as np
from sfx import Mix, SR, ss, env, bp, lp, hp, note

VOICE, REPORT, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
T = dict(end=78.86, building=0.35, heavy=1.89, every=7.20, built=12.08, size=12.99, heavyWon=14.17, strength=15.78, twice=19.61,
         more=24.81, equal=33.97, noReal=34.95, cut=45.52, little=52.75, kilo=55.72, nine=61.60, eightWeeks=62.59, back=74.71,
         factory=75.57, settings=75.87, logo=76.56)
m = Mix(T['end'], seed=20261017)
rng = np.random.default_rng(1717)
def clatter(at, n=6, gain=0.01, pan=0.0, span=0.25):   # bones knocking lightly
    for k in range(n):
        a = at + rng.uniform(0, span); nn = int(0.03 * SR); f = rng.uniform(1800, 3400)
        x = np.arange(nn) / SR; m.add('X', (np.sin(2 * np.pi * f * x) * 0.6 + bp(m.noise(nn), 1500, 6000)) * env(nn, 0.0008, 0.008) * gain * rng.uniform(0.5, 1), a, pan + rng.uniform(-0.2, 0.2))
def swell(a, b, gain=0.01, pan=0.0, f0=110, f1=160):   # something filling out
    tt = m.t(a, b); u = np.clip((tt - a) / (b - a), 0, 1); f = f0 + (f1 - f0) * u
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.3 * lp(m.noise(len(tt)), 400)
    m.add('X', s * np.sin(np.pi * u) ** 1.5 * gain, a, pan)
def rise(a, b, gain=0.008, pan=0.0, f0=400, f1=900):   # a meter climbing
    tt = m.t(a, b); u = np.clip((tt - a) / (b - a), 0, 1); f = f0 + (f1 - f0) * u ** 0.7
    m.add('X', (np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.5 + 0.5 * bp(m.noise(len(tt)), 900, 3000)) * np.sin(np.pi * u) ** 0.8 * gain, a, pan)
def scribble(a, d, gain=0.012, pan=0.0):
    tt = m.t(a, a + d); s = bp(m.noise(len(tt)), 1800, 7000) * (0.6 + 0.4 * np.abs(np.sin(2 * np.pi * 9 * tt))) * np.sin(np.pi * np.clip((tt - a) / d, 0, 1)) ** 0.6
    m.add('X', s * gain, a, pan)
def clank(at, gain=0.03, pan=0.0, f=180):   # iron on iron
    nn = int(0.5 * SR); x = np.arange(nn) / SR
    ring = sum(np.sin(2 * np.pi * f * r * x) * np.exp(-x / d) for r, d in [(1, 0.18), (2.76, 0.09), (5.4, 0.05)])
    m.add('X', (ring * 0.5 + bp(m.noise(nn), 800, 6000) * np.exp(-x / 0.01)) * gain, at, pan)

# ---------------------------------------------------------------- the flex: bones rise, knock, hold
clatter(T['building'] - 0.05, 8, 0.009, 0.0, 0.5)
for at in (0.95, 1.4, 1.85, 2.3, 2.75, 3.2): clatter(at, 2, 0.004, 0.0, 0.06)   # the little pump
clatter(3.65, 6, 0.007, 0.0, 0.6)                                                     # arms down
# ---------------------------------------------------------------- the rack
m.clink(3.05, 0.008, 0.3, f=1900); m.clink(4.35, 0.006, 0.35, f=2600)
# ---------------------------------------------------------------- light against heavy: both grow alike; heavy wins on strength
swell(T['built'] - 0.2, T['size'] + 0.4, 0.012, -0.12, 100, 150); swell(T['built'] - 0.15, T['size'] + 0.45, 0.012, 0.12, 100, 150)
rise(T['heavyWon'] - 0.1, T['strength'] + 0.1, 0.006, -0.1, 420, 700); rise(T['heavyWon'] - 0.1, T['strength'] + 0.3, 0.007, 0.1, 420, 980)
m.tick(T['strength'] + 0.32, 0.01, 0.1, hi=2800, lo=1400)
# ---------------------------------------------------------------- the week: two ticks
scribble(T['twice'] - 0.1, 0.3, 0.014, -0.1); scribble(T['twice'] + 0.15, 0.3, 0.014, 0.15)
# ---------------------------------------------------------------- the sets: three sections, one after another
for i in range(3): m.thud(T['more'] + i * 0.75 + 0.1, 140 + 30 * i, 0.016, -0.3 + 0.3 * i, 0.06); swell(T['more'] + i * 0.75, T['more'] + i * 0.75 + 0.7, 0.006, -0.3 + 0.3 * i)
# ---------------------------------------------------------------- the splits: equal
m.bell(T['noReal'] + 0.05, 84, 0.012, 0.0, 0.8, buf='X')
# ---------------------------------------------------------------- the bricks: laid one by one; the sleepless row runs out
for r, n in enumerate([10, 9]):                                   # two towers, brick on brick; the right one stops short
    for k in range(n):
        at = T['cut'] - 0.4 + k * 0.33 + 0.25; clank(at, 0.006, -0.15 if r == 0 else 0.15, f=420 + 40 * r + 6 * k)
# ---------------------------------------------------------------- protein: the line, drawn, and going flat
scribble(T['little'] - 0.1, T['kilo'] - T['little'] + 0.4, 0.008, 0.1)
# ---------------------------------------------------------------- the leg extensions: the stack rises and lands, rep after rep; the thigh grows 9%
t0, per = 56.8, 3.4
for k in range(int((64.6 - t0) / per) + 1):
    a = t0 + k * per
    tt = m.t(a, a + 1.2); u = (tt - a) / 1.2; m.add('X', bp(m.noise(len(tt)), 300, 1400) * (0.5 + 0.5 * np.sin(2 * np.pi * 31 * tt)) * np.sin(np.pi * u) ** 2 * 0.008, a, 0.25)
    if a + 3.1 < 64.6: clank(a + 3.12, 0.014, 0.25, f=160)
swell(T['nine'] - 0.2, T['eightWeeks'] + 0.4, 0.012, -0.2, 90, 125)
# ---------------------------------------------------------------- balance: a little creak as it holds
tt = m.t(68.3, 73.6); m.add('X', bp(m.noise(len(tt)), 500, 1800) * (0.5 + 0.5 * np.sin(2 * np.pi * 0.6 * tt)) ** 4 * 0.004, 68.3, 0.2)
# ---------------------------------------------------------------- the camera's moves
for a, b, g, pan in [(1.85, 2.75, 0.018, 0.3), (4.9, 5.9, 0.016, 0.3), (16.3, 17.4, 0.016, 0.3), (20.8, 22.0, 0.016, 0.3), (30.3, 31.4, 0.016, 0.3),
                     (40.9, 42.2, 0.018, 0.3), (50.4, 51.5, 0.016, 0.3), (56.9, 58.1, 0.018, 0.3), (63.25, 64.25, 0.016, -0.3), (66.9, 68.1, 0.018, 0.2)]:
    m.whoosh(a + 0.05, b - a, 250, 1800, g, pan)
m.whoosh(73.9, 1.3, 220, 1500, 0.016, 0.2)
m.whoosh(T['settings'] - 0.2, T['logo'] - T['settings'] + 0.2, 220, 2600, 0.04, 0.0)
m.logo_end(T['logo'] - 0.15, T['logo'])
# ---------------------------------------------------------------- the score
m.pad([40, 52, 55, 59], 0.0, 5.3, 0.5, 1000)                         # the flex; GROW and TONE
m.pad([43, 55, 59, 62], 5.3, 16.8, 0.5, 1150)                        # light against heavy
m.pad([45, 57, 60, 64], 16.8, 30.6, 0.5, 1200)                       # twice a week; count your sets
m.pad([41, 53, 57, 60], 30.6, 41.4, 0.5, 1050)                       # how often: equal
m.pad([38, 50, 53, 57], 41.4, 50.7, 0.5, 900)                        # sleep
m.pad([43, 55, 59, 62], 50.7, 57.3, 0.5, 1150)                       # protein
m.pad([45, 57, 60, 64, 67], 57.3, 67.5, 0.5, 1250)                   # ninety, and growing
m.pad([41, 53, 57, 60], 67.5, 74.2, 0.45, 950)                       # balance, falls
m.pad([41, 53, 60, 65, 69, 72], 74.2, T['end'], 1.0, 2400, rel=0.2)
m.pulse(5.6, 16.0, 96, [64, 67, 71, 67], 0.007, 1300, lvl=lambda t: float(ss(5.6, 6.4, t)) * (1 - float(ss(15.2, 16.0, t))))
m.pulse(57.6, 66.8, 88, [62, 67, 69, 67], 0.006, 1200, lvl=lambda t: float(ss(57.6, 58.4, t)) * (1 - float(ss(66.0, 66.8, t))))
m.room(0.005)
m.finish(REPORT, VOICE, OUT, 'film17')

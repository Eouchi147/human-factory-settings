"""Film 9 "The breath that calms you down" (new direction, 7 Oct 2026): score and sound design, timed to films/film09.js.
Sticky notes slapped on the skull and peeled off; the breathing itself, from the lung volume the picture draws (fast and
hoarse in the panic, slow after, the body's own sigh, the sigh on purpose, the hard drill); every heartbeat the picture
draws; the chart recorder; the air sacs reopening one by one; the plinth rising and sinking; the columns; twelve trials
dropping into a bar; the wand that sparks, fizzles and falls over; the dial and the logo: from the timing table the
picture exports (timing09.json, window.HFS_W.timing).
Usage: python3 sound_film09.py <voice guide wav> <voice report json> <out dir>"""
import sys, json, os
import numpy as np
from sfx import Mix, SR, ss, env, bp, lp, hp, note

VOICE, REPORT, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
T = dict(end=79.73, logo=77.21, better=6.77, your3=17.23, so=26.12, in3=31.65, lifted=36.39, more=37.45, across=39.67,
         its=45.86, do=49.07, skip=50.99, dizzy=54.80, and3=55.59, final=74.95, settings=76.53)
HERE = os.path.dirname(os.path.abspath(__file__))
TM = json.load(open(os.path.join(HERE, 'timing09.json')))
m = Mix(T['end'], seed=20261009)
rng = np.random.default_rng(99)
def s5(a, b, x):
    u = np.clip((np.asarray(x, float) - a) / (b - a), 0, 1); return u * u * u * (u * (u * 6 - 15) + 10)
def band(t, a, b, r=0.5): return ss(a - r, a, t) * (1 - ss(b, b + r, t))   # 1 inside [a, b], soft edges
m.room(0.004)

# ---------------------------------------------------------------- the breathing: air in and out at the rate the lungs fill and empty
tt = np.arange(m.N) / SR
vol = np.interp(tt, np.arange(len(TM['breath'])) * TM['breathDt'], TM['breath'])
flow = lp(np.gradient(vol, 1 / SR), 18)                                        # lung volume a second (+ in, - out)
fin, fout = np.sqrt(np.clip(flow, 0, None)), np.sqrt(np.clip(-flow, 0, None))
# how close we are to the face and chest: the opening, the chest, the body's own sigh (under the jar), the sigh on purpose, the drill
near = 0.4 + 0.6 * np.maximum.reduce([band(tt, 0, 7.4), band(tt, 8.6, 11.8), 0.7 * band(tt, 20.8, 25.0), band(tt, 26.3, 31.6), band(tt, 49.8, 55.6)])
hoarse = band(tt, 0.3, 5.6, 0.3) + band(tt, 51.0, 54.9, 0.3)                   # panic and drill: rougher, throatier
air_in = bp(m.noise(m.N), 700, 4200) * (1 - 0.4 * hoarse) + bp(m.noise(m.N), 300, 1200) * 0.8 * hoarse
air_out = bp(m.noise(m.N), 350, 2200)
m.add('X', (air_in * fin + air_out * fout * 0.75) * near * 0.010, 0, 0.0)

# ---------------------------------------------------------------- the heart: every beat the picture draws, felt more than heard
for bt in TM['beats']:
    g = 0.012 + 0.03 * float(band(bt, 8.6, 16.8)) + 0.015 * float(band(bt, 0.3, 6.0) + band(bt, 50.5, 56.0))
    m.heartbeat(bt, g, 0.0)

# ---------------------------------------------------------------- the chart recorder: a small motor, the pen on the paper, a jump at every beat
tr = m.t(0, T['logo'])
rec_near = 0.12 + 0.88 * band(tr, 12.9, 16.7, 0.5) + 0.2 * band(tr, 57.5, 74.2, 1.0)
motor = np.sin(2 * np.pi * 100 * tr) * 0.5 + np.sin(2 * np.pi * 200 * tr) * 0.2 + bp(m.noise(len(tr)), 150, 420) * 0.3
pen = hp(m.noise(len(tr)), 4200) * (0.55 + 0.45 * np.abs(lp(m.noise(len(tr)), 7) * 5).clip(0, 1))
m.add('X', (motor * 0.0016 + pen * 0.0011) * rec_near, 0, 0.35)
for bt in TM['beats']:
    k = 0.12 + 0.88 * float(band(bt, 12.9, 16.7, 0.5))
    if k > 0.3: m.tick(bt + 0.01, 0.007 * k, 0.35, hi=5200, lo=2600)

# ---------------------------------------------------------------- the sticky notes: each flies in and slaps on; at "a better way" each peels off and flutters away
pans = [0.0, 0.15, -0.15]
for at, pan in zip(TM['slaps'], pans):
    m.swish(at - 0.17, 0.18, 0.016, pan, 2400)
    n = int(0.3 * SR); x = np.arange(n) / SR
    slap = bp(m.noise(n), 700, 6500) * env(n, 0.0005, 0.022) + np.sin(2 * np.pi * 165 * x) * env(n, 0.001, 0.045) * 0.7
    m.add('X', slap * 0.075, at, pan)
    m.add('X', bp(m.noise(int(0.09 * SR)), 2500, 8000) * env(int(0.09 * SR), 0.002, 0.03) * 0.01, at + 0.05, pan)   # the paper settles
for at, pan in zip(TM['peels'], pans):
    for k in range(20): m.tick(at + k * 0.006 + rng.uniform(0, 0.004), 0.0045 * rng.uniform(0.5, 1.0), pan, hi=rng.uniform(3000, 6200), lo=1500)   # the glue lets go
    m.swish(at + 0.06, 0.8, 0.012, pan, 1700); m.rustle(at + 0.25, at + 1.05, 0.006, pan)
m.whoosh(6.3, 1.7, 220, 1300, 0.009, 0.0)                                       # relief: a better way

# ---------------------------------------------------------------- the air sacs: they reopen one after another, each a soft round pop
for i, at in enumerate(TM['sacPops']):
    n = int(0.14 * SR); x = np.arange(n) / SR; f = 520 * 2 ** (rng.uniform(-3, 4) / 12)
    pop = np.sin(2 * np.pi * np.cumsum(f * (1 + 0.9 * np.exp(-x / 0.012))) / SR) * env(n, 0.002, 0.035) + bp(m.noise(n), 800, 3000) * env(n, 0.0008, 0.006) * 0.4
    m.add('X', pop * 0.016, at, -0.35 + 0.05 * (i % 4))

# ---------------------------------------------------------------- the plinth rises out of the floor, and later sinks back
def lift(t0, t1, up=True):
    tl = m.t(t0, t1 + 0.05); n = len(tl); u = np.clip((tl - t0) / (t1 - t0), 0, 1)
    f = 52 + 22 * (u if up else 1 - u)
    hum = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.6 + np.sin(2 * np.pi * np.cumsum(2 * f) / SR) * 0.25
    m.add('X', (hum + lp(m.noise(n), 170) * 0.9) * np.sin(np.pi * u) ** 0.7 * 0.011, t0, 0.05)
    m.thud(t1, 72, 0.022, 0.05, 0.08)
lift(*TM['rise']); lift(*TM['sink'], up=False)

# ---------------------------------------------------------------- the study: two columns rise (the taller one sounds higher); the scale; twelve trials drop into a bar
m.whoosh(T['lifted'] - 0.05, 1.3, 200, 900, 0.007, -0.1)
m.pluck(T['more'] + 0.18, 76, 0.03, -0.2, 0.7); m.pluck(T['more'] + 0.22, 71, 0.024, 0.2, 0.7)
m.whoosh(T['across'], 0.5, 900, 300, 0.005, 0.0, up=False)                     # they go
m.shimmer(TM['ruler'], (84, 91, 96), 0.007, 0.1, 0.4, 1.4)                       # the scale appears
for i, at in enumerate(TM['dotsIn']): m.pluck(at, [72, 74, 76, 79, 81, 84, 86, 88, 91, 93, 96, 98][i], 0.011, -0.3 + 0.05 * i, 0.22, 5200)
for i, at in enumerate(TM['dotsLand']): m.tick(at, 0.011, 0.05, hi=2600 + 40 * i, lo=900)
B0, B1 = TM['bar']; m.tone_line(B0, B1 + 0.3, 67, 0.006, 0.05, glide=lambda t: 4 * s5(B0, B1, t))

# ---------------------------------------------------------------- the wand: up it comes, sparks, a fizzle, and it falls over
W0, W1 = TM['wandUp']; m.whoosh(W0 - 0.05, W1 - W0 + 0.25, 300, 1600, 0.009, -0.1)
S0, S1 = TM['sparks']; m.shimmer(S0, (96, 100, 103), 0.018, -0.1, 0.45, 1.3); m.rain(S0, S1, 16, 0.007, (94, 108), seed=9)
m.whoosh(S1 - 0.1, 0.45, 2600, 380, 0.008, -0.1, up=False)                     # the fizzle
m.pluck(S1 + 0.02, 67, 0.016, -0.1, 0.3); m.pluck(S1 + 0.2, 62, 0.016, -0.1, 0.45)   # a sad little "oh"
F0, F1 = TM['fall']; m.swish(F0, F1 - F0 + 0.05, 0.008, 0.1, 2000)
for k, g in enumerate([0.045, 0.016, 0.007]): m.tock(F1 + k * np.pi / 25, g, 0.15, f=930 + 30 * k)   # the stick lands and bounces
m.whoosh(49.3, 0.5, 700, 200, 0.004, -0.1, up=False)

# ---------------------------------------------------------------- the drill: the room sways after it
td = m.t(53.0, 57.6); wob = ss(53.0, T['dizzy'], td) * (1 - ss(56.0, 57.4, td))
for nn, d in [(62, 0.0), (62.35, 1.3)]:
    f = note(nn) * 2 ** (0.5 * np.sin(2 * np.pi * 0.7 * td + d) * wob / 12)
    ph = 2 * np.pi * np.cumsum(f) / SR
    m.add('M', lp(np.sin(ph) + 0.3 * np.sin(2 * ph), 1500) * wob * 0.008, 53.0, -0.2 if d else 0.2)

# ---------------------------------------------------------------- the dial: up it comes, the needle to five, the logo
D0 = TM['dialUp']; m.whoosh(D0 - 0.05, 0.9, 200, 900, 0.011, 0.3); m.clink(D0 + 0.85, 0.014, 0.3, 2200)
N0, N1 = TM['needle']; xs = np.linspace(N0, N1, 800); vs = 5 * s5(N0, N1, xs)
for k in range(1, 6): m.tick(float(xs[np.argmax(vs >= k)]), 0.016 * (1.3 if k == 5 else 1.0), 0.3, hi=3300, lo=1500)

# ---------------------------------------------------------------- the score
m.pad([50, 56, 61, 63], 0.0, 6.2, 0.4, 900)                                     # chased: tense, close
m.pulse(0.5, 5.6, 132, [62, 62, 63, 62], 0.008, 1200, lvl=lambda t: float(ss(0.5, 1.2, t) * (1 - ss(5.0, 5.6, t))))
m.pad([43, 55, 59, 62, 66], 6.2, 17.0, 0.55, 1200)                              # a better way; the brake
m.pad([45, 57, 60, 64], 17.0, 26.0, 0.5, 1100)                                  # the body's own sigh
m.pad([41, 53, 57, 60, 64], 26.0, 31.6, 0.55, 1300)                             # the sigh on purpose
m.pad([43, 55, 59, 62], 31.6, 45.8, 0.5, 1200)                                  # the study
m.pulse(32.2, 45.4, 96, [67, 71, 74, 71], 0.006, 1500, lvl=lambda t: float(ss(32.2, 33.4, t) * (1 - ss(44.6, 45.4, t))))
m.pad([48, 55, 60, 64], 45.8, 49.2, 0.5, 1400)                                  # the wand
m.pad([50, 57, 62, 65], 49.2, 57.2, 0.5, 1000)                                  # the drill
m.pulse(51.0, 54.9, 120, [62, 65, 62, 64], 0.007, 1100, lvl=lambda t: float(ss(51.0, 51.6, t) * (1 - ss(54.3, 54.9, t))))
m.pad([41, 53, 57, 60], 57.2, 66.2, 0.5, 900)                                   # calm; see a doctor
m.pad([43, 55, 58, 62], 66.2, 74.6, 0.5, 900)                                   # get help now
m.pad([41, 53, 60, 65, 69, 72], 74.6, T['end'], 1.0, 2400, rel=0.2)
m.whoosh(T['final'] - 0.1, T['logo'] - T['final'], 220, 2600, 0.05, 0.0)
m.logo_end(T['logo'] - 0.15, T['logo'])
m.finish(REPORT, VOICE, OUT, 'film09')

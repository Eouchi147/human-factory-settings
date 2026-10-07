"""Film 13 "Lower back pain" (new direction, 7 Oct 2026): score and sound design, timed to films/film13.js.
A ghost in bed by candlelight, its lower back throbbing, a music box; the sheet whipped off, the skeleton springing up out of
bed and landing; a trophy and its confetti; a light box clicking on, ten case films, nine stamps; disc scans counted out, 37
then 96; grey hair sprouting from the discs; bends, leans, twists and a march on the spot; a name card flipped over; the
nerves tingling; the disc model up out of the floor; the logo. Every time comes from the timing table the picture exports
(timing13.json, window.HFS_W.timing).
Usage: python3 sound_film13.py <voice guide wav> <voice report json> <out dir>"""
import sys, json, os
import numpy as np
from sfx import Mix, SR, ss, env, bp, lp, hp, note

VOICE, REPORT, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
T = dict(end=80.29, logo=77.77, your=0.35, back=0.79, like=3.03, victorian=3.61, ghost=4.19, lets=5.26, lower=7.19, one=8.78,
         yet=11.16, nine=11.78, doctors=13.38, worn=17.76, scan=18.96, its=26.94, grey=27.29, your2=29.39, so=33.7, your3=36.33,
         not_=37.41, see=39.67, get2=50.96, and2=59.09, emergency=59.71, final=75.51, settings=77.09)
HERE = os.path.dirname(os.path.abspath(__file__))
TM = json.load(open(os.path.join(HERE, 'timing13.json')))
m = Mix(T['end'], seed=20261013)
rng = np.random.default_rng(1313)
def s5(a, b, x):
    u = np.clip((np.asarray(x, dtype=float) - a) / (b - a), 0, 1); return u * u * u * (u * (u * 6 - 15) + 10)
m.room(0.005)
def one(at, sig, gain, pan=0.0): m.add('X', sig * gain, at, pan)
def lift(t0, t1, up=True, g=0.012, pan=0.0):                     # something rising out of the floor
    tl = m.t(t0, t1 + 0.05); nn = len(tl); u = np.clip((tl - t0) / (t1 - t0), 0, 1)
    f = 52 + 22 * (u if up else 1 - u)
    hum = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.6 + np.sin(2 * np.pi * np.cumsum(2 * f) / SR) * 0.25
    m.add('X', (hum + lp(m.noise(nn), 170) * 0.9) * np.sin(np.pi * u) ** 0.7 * g, t0, pan)
    if up: m.thud(t1, 72, 0.02, pan, 0.08)

# ---------------------------------------------------------------- the bedroom at night: the candle; the ache throbbing; a music box; the ghost's note
tc = m.t(0.0, 7.6); nc = len(tc); fade = 1 - ss(6.2, 7.4, tc)
cr = np.zeros(nc); idx = rng.integers(0, nc, 70); cr[idx] = rng.uniform(-1, 1, 70)
one(0.0, lp(hp(m.noise(nc), 1500), 5000) * 0.0011 * fade + bp(cr, 1500, 7000) * 0.3 * fade, 1.0, -0.35)   # the candle, on the left
for k in range(8):                                                                       # the ache: its glow's own beat, low and soft
    at = (np.pi / 2 + k * np.pi) / 2.6
    if 0.55 < at < 4.4:
        n = int(0.6 * SR); x = np.arange(n) / SR; w = np.sin(np.pi * x / 0.6) ** 2
        one(at - 0.3, np.sin(2 * np.pi * 52 * x) * w + 0.3 * np.sin(2 * np.pi * 104 * x) * w ** 1.5, 0.028, 0.0)
for at, nn in [(0.3, 76), (0.72, 79), (1.14, 81), (1.56, 79), (1.98, 76), (2.4, 72), (2.95, 74), (3.37, 76), (4.3, 69)]:
    m.bell(at, nn, 0.011, 0.15, 0.55)                                                    # a music box
V0 = T['victorian']; m.tone_line(V0, V0 + 1.55, 74, 0.011, 0.1, glide=lambda t: 3 * np.sin(np.pi * np.clip((t - V0) / 1.55, 0, 1)) + 0.3 * np.sin(2 * np.pi * 5.5 * t))   # wooo

# ---------------------------------------------------------------- let's get you up: the pull back; the sheet whipped off; a spring; the landing
m.whoosh(4.95, 0.6, 250, 1700, 0.016, 0.0)
S0, S1 = TM['sheetOff']
m.swish(S0 - 0.03, S1 - S0 + 0.2, 0.03, 0.25, 900); m.rustle(S0, S1 + 0.3, 0.012, 0.35)
k = int(0.25 * SR); one(S0, bp(m.noise(k), 300, 2500) * env(k, 0.002, 0.03), 0.04, 0.2)
F0, F1 = TM['flip']
tb = m.t(F0, F0 + 0.95); x = tb - F0
f = 170 * (1 + 0.9 * (1 - np.exp(-x / 0.12))) * (1 + 0.18 * np.sin(2 * np.pi * 14 * x) * np.exp(-x / 0.35))
one(F0, np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x / 0.33) * np.minimum(1, x / 0.005), 0.034, 0.0)     # boing
m.swish(F0 + 0.1, F1 - F0, 0.012, 0.0, 1200)
LD = TM['land']
m.thud(LD, 68, 0.06, 0.0, 0.1); m.tock(LD + 0.005, 0.03, 0.0, f=300)
for j in range(6): m.tick(LD + 0.01 + j * 0.012 + rng.uniform(0, 0.006), 0.012 * rng.uniform(0.5, 1), rng.uniform(-0.3, 0.3), hi=rng.uniform(1800, 3600), lo=900)   # the bones rattle
m.pluck(LD + 0.15, 72, 0.014, 0.0, 0.3); m.pluck(LD + 0.3, 79, 0.012, 0.0, 0.35)   # ta-da

# ---------------------------------------------------------------- the trophy: a party popper, confetti, a fanfare
m.whoosh(6.9, 0.9, 260, 1600, 0.016, -0.2)
C = TM['confetti']
k = int(0.3 * SR); x = np.arange(k) / SR
one(C - 0.01, bp(m.noise(k), 800, 7000) * env(k, 0.0006, 0.012) + np.sin(2 * np.pi * 180 * x) * env(k, 0.001, 0.03) * 0.6, 0.06, -0.2)
m.rustle(C + 0.05, C + 2.9, 0.01, -0.2); m.rain(C + 0.1, C + 2.6, 50, 0.004, pitch=(96, 108), seed=13)
for dt, nn in [(0.0, 67), (0.12, 72), (0.24, 76), (0.42, 79)]: m.pluck(C + 0.05 + dt, nn, 0.016, -0.1, 0.5)
m.shimmer(C + 0.5, (84, 88, 91), 0.006, -0.2, 0.6, 1.6)

# ---------------------------------------------------------------- the light box: on with a click and a hum; ten case films; nine stamps
m.whoosh(10.85, 0.95, 240, 1500, 0.016, 0.2)
m.tock(10.95, 0.03, 0.3, f=1400); m.tick(10.96, 0.02, 0.3, hi=3000, lo=1200)
th = m.t(10.95, 27.7); hum = (np.sin(2 * np.pi * 120 * th) + 0.4 * np.sin(2 * np.pi * 240 * th)) * ss(10.95, 11.7, th) * (1 - ss(27.0, 27.6, th))
one(10.95, lp(hum, 600), 0.0018, 0.3)
for j in range(10): m.swish(T['yet'] + j * 0.05, 0.22, 0.0022, 0.3, 2600)
for at in TM['stamps']:
    m.thud(at, 90, 0.03, 0.3, 0.06); k = int(0.2 * SR); one(at, bp(m.noise(k), 400, 3500) * env(k, 0.001, 0.015), 0.035, 0.3)
m.swish(17.1, 0.6, 0.006, 0.3, 1800)                                                     # the films off, the scans on
m.shimmer(TM['scans'][0], (86, 91, 95), 0.005, 0.3, 0.5, 1.4)
for gi, (g0, g1) in enumerate(TM['grids']):                                             # the worn discs counted out; then the share
    n = (37, 96)[gi]
    for kk in range(1, n + 1): m.tick(g0 + (g1 - g0) * kk / n, 0.005, 0.3, hi=1800 + 6 * kk, lo=800)
    m.pluck(g1 + 0.02, (69, 72)[gi], 0.014, 0.3, 0.4); m.pluck(g1 + 0.14, (76, 79)[gi], 0.012, 0.3, 0.45)

# ---------------------------------------------------------------- grey hair: the light box off; tufts sprouting from the discs; gone again
m.whoosh(26.75, 0.75, 240, 1500, 0.016, 0.0)
m.tock(27.05, 0.02, 0.3, f=1300)
H0, H1 = TM['hair']
th2 = m.t(H0, H1 + 0.1); u = np.clip((th2 - H0) / (H1 - H0), 0, 1)
one(H0, bp(m.noise(len(th2)), 3000, 9000) * u * (1 - ss(H1 - 0.05, H1 + 0.1, th2)), 0.006, 0.0)
m.rain(H0, H1, 22, 0.004, pitch=(98, 110), seed=27)
m.pluck(H1 + 0.05, 74, 0.012, 0.0, 0.5); m.pluck(H1 + 0.2, 71, 0.011, 0.0, 0.6)
HO0, HO1 = TM['hairOff']; m.swish(HO0, HO1 - HO0 + 0.1, 0.006, 0.0, 3000)

# ---------------------------------------------------------------- built to move: each bend, lean and twist lands with a little clack; then the march
m.whoosh(29.15, 0.8, 240, 1500, 0.016, 0.0)
mv = TM['move']
for j in range(1, len(mv)):
    a, b = mv[j - 1], mv[j]; pan = (-0.2, 0.2)[j % 2]
    m.swish(a + 0.05, b - a, 0.006, pan, 1100)
    m.tock(b - 0.04, 0.012, pan, f=(600, 700, 800, 900, 1000, 900, 700)[j - 1])
    m.pluck(b - 0.04, (67, 71, 74, 72, 76, 74, 72)[j - 1], 0.01, 0.0, 0.3)
for at in TM['march']: m.tock(at + 0.275, 0.02, 0.0, f=260); m.thud(at + 0.275, 80, 0.012, 0.0, 0.05)
m.pulse(33.85, 36.2, 109, [60, 64, 67, 64], 0.007, 1500, lvl=lambda t: float(ss(33.85, 34.1, t)) * (1 - float(ss(35.9, 36.2, t))))

# ---------------------------------------------------------------- the name card: flipped over, a wry drop
m.whoosh(35.95, 0.85, 240, 1500, 0.016, 0.2)
C0, C1 = TM['card']
m.swish(C0, C1 - C0 + 0.05, 0.008, 0.3, 2000); m.tock(C1, 0.016, 0.3, f=1100); m.tick(C1 + 0.003, 0.008, 0.3, hi=3000, lo=1500)
m.pluck(C1 + 0.12, 64, 0.012, 0.3, 0.4); m.pluck(C1 + 0.3, 60, 0.012, 0.3, 0.6)

# ---------------------------------------------------------------- the warnings; the nerves of both legs, tingling
m.whoosh(39.2, 1.0, 240, 1400, 0.014, 0.1)
m.whoosh(58.55, 1.5, 200, 1100, 0.01, 0.0, up=False)
N0, N1 = TM['nerves']
tn = m.t(N0, N1 + 0.5); ne = ss(N0, N0 + 1.0, tn) * (1 - ss(N1 - 0.6, N1 + 0.4, tn)); am = 0.55 + 0.45 * np.sin(2 * np.pi * 2.1 * tn) ** 2
one(N0, hp(m.noise(len(tn)), 5000) * ne * am * 0.0025, 1.0, 0.0)
m.rain(N0 + 0.3, N1 - 0.5, 160, 0.0025, pitch=(100, 112), seed=59)
m.shimmer(N0 + 0.1, (88, 93, 100), 0.008, 0.0, 0.8, 2.0)

# ---------------------------------------------------------------- the end: the disc model up out of the floor; its top becomes the logo
m.whoosh(73.85, 1.5, 220, 1400, 0.014, -0.2)
lift(*TM['pedUp'], g=0.012, pan=-0.2)
m.whoosh(T['settings'] - 0.2, T['logo'] - T['settings'] + 0.2, 220, 2600, 0.04, 0.0)
m.logo_end(T['logo'] - 0.15, T['logo'])

# ---------------------------------------------------------------- the score
m.pad([45, 52, 57, 60], 0.0, 5.3, 0.5, 900)                          # a ghost in bed
m.pad([48, 55, 60, 64, 67], 5.3, 7.2, 0.5, 1500)                     # up!
m.pad([48, 55, 60, 64], 7.2, 11.0, 0.5, 1300)                        # the number one cause of disability
m.pad([45, 52, 57, 60], 11.0, 17.3, 0.5, 1000)                       # nine in ten: nothing to pin it on
m.pad([43, 50, 55, 59, 62], 17.3, 27.0, 0.5, 1100)                   # worn discs are normal
m.pad([41, 53, 57, 60, 64], 27.0, 29.4, 0.5, 1100)                   # grey hair for your spine
m.pad([48, 55, 60, 64], 29.4, 36.2, 0.5, 1400)                       # built to move; carry on
m.pad([50, 57, 62, 65], 36.2, 39.6, 0.5, 1100)                       # your mattress is not a physiotherapist
m.pad([40, 52, 55, 59], 39.6, 50.9, 0.5, 900)                        # see a doctor
m.pad([38, 50, 57, 62], 50.9, 59.0, 0.5, 900)                        # an urgent appointment
m.pad([43, 55, 58, 62], 59.0, 74.6, 0.5, 900)                        # emergency help
m.pad([45, 57, 64, 69, 72, 76], 74.6, T['end'], 1.0, 2400, rel=0.2)
m.finish(REPORT, VOICE, OUT, 'film13')

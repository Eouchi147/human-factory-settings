"""Film 14 "Intermittent fasting" (new direction, 7 Oct 2026): score and sound design, timed to films/film14.js.
A clock ticking toward noon and fingers drumming on a table; a pizza box flying open, a jaw dropping, the clock striking
twelve, a shop sign spun round to OPEN with its bell; the window drawn on the plate; the box shut and gone; the hours flying
round; a toggle switch, FAT BURNING, clicked on in a sparkle, and a plug plugged into nothing; weights dropped on a balance,
the beam swinging and settling; the hands to ten past ten; a fridge sucked open at midnight, its hum and its light; three
plates set down; the logo. Every time comes from the timing table the picture exports (timing14.json, window.HFS_W.timing).
Usage: python3 sound_film14.py <voice guide wav> <voice report json> <out dir>"""
import sys, json, os
import numpy as np
from sfx import Mix, SR, ss, env, bp, lp, hp, note

VOICE, REPORT, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
T = dict(end=79.21, logo=76.69, you=0.35, pizza=4.35, noon=5.12, open=7.23, lets=8.1, your=10.48, food=12.6, but=13.02, magic=15.83, switch=17.2,
         trial=19.27, same=26.93, same2=33.34, window3=36.66, ninetynine=41.28, tie=47.64, clock=48.91, one=50.61, so=52.87, raid=57.29,
         fridge=57.87, midnight=58.5, three2=59.44, dont=62.2, final=74.43, factory=75.64, settings=76.01)
HERE = os.path.dirname(os.path.abspath(__file__))
TM = json.load(open(os.path.join(HERE, 'timing14.json')))
m = Mix(T['end'], seed=20261014)
rng = np.random.default_rng(1414)
def s5(a, b, x):
    u = np.clip((np.asarray(x, dtype=float) - a) / (b - a), 0, 1); return u * u * u * (u * (u * 6 - 15) + 10)
m.room(0.005)
def one(at, sig, gain, pan=0.0): m.add('X', sig * gain, at, pan)
def creak(t0, dur, g, pan):                                        # the balance's pivot as the beam swings
    tl = m.t(t0, t0 + dur); u = np.clip((tl - t0) / dur, 0, 1)
    s = bp(m.noise(len(tl)), 1100, 3200) * (0.5 + 0.5 * np.sin(2 * np.pi * np.cumsum(30 + 20 * u) / SR)) * np.exp(-u * 3)
    m.add('X', s * g, t0, pan)
def card(at, g, pan, lo=180):                                      # cardboard: a soft, papery thump
    k = int(0.35 * SR); x = np.arange(k) / SR
    one(at, lp(m.noise(k), 900) * env(k, 0.002, 0.03) + np.sin(2 * np.pi * lo * x) * env(k, 0.002, 0.05) * 0.6, g, pan)

# ---------------------------------------------------------------- waiting for noon: the plate-clock ticks; the right hand drums its fingers on the table
for k in range(1, 5): m.tick(k * 1.0 + 0.1, 0.012, -0.05, hi=2200, lo=900)
D0, D1 = TM['drum']
for c in range(0, 12):
    for i in range(4):                                             # each finger lands at the end of its lift (little finger first)
        at = (c + 0.7 + (3 - i) * 0.12) / 1.6
        g = float(ss(D0, D0 + 0.3, at) * (1 - ss(D1 - 0.3, D1, at)))
        if g > 0.05: m.tock(at, 0.012 * g, -0.3, f=950 + 60 * i)

# ---------------------------------------------------------------- noon: the box flies open, the jaw drops, the clock strikes twelve, the sign spins to OPEN
m.whoosh(3.05, 0.7, 260, 1700, 0.014, 0.2)
B0, B1 = TM['boxOpen']
m.swish(B0, B1 - B0 + 0.1, 0.012, 0.35, 900); card(B1 - 0.02, 0.05, 0.35, 150); card(B1 + 0.12, 0.015, 0.35, 170)
m.shimmer(B1 + 0.05, (84, 88, 91), 0.006, 0.35, 0.5, 1.2)                                   # ta-da: a whole pizza
J0 = TM['jaw'][0]; m.tock(J0 + 0.06, 0.018, 0.1, f=420)                                      # the jaw drops, bone on bone
m.bell(T['noon'], 69, 0.018, 0.0, 1.4, buf='X'); m.bell(T['noon'] + 0.02, 81, 0.008, 0.0, 1.0, buf='X')
m.whoosh(6.2, 0.65, 260, 1600, 0.014, -0.2)
F0, F1 = TM['flip']
m.swish(F0, F1 - F0, 0.01, -0.3, 1800)
for j, (dt, f) in enumerate([(0.02, 4200), (0.09, 5100), (0.16, 4600), (0.25, 5400), (0.36, 4800)]): m.clink(F1 - 0.2 + dt, 0.01 / (1 + 0.3 * j), -0.3, f=f)   # the shop bell

# ---------------------------------------------------------------- the window drawn on the plate; the box shut and slid off the table
m.whoosh(7.95, 0.75, 250, 1500, 0.014, 0.0)
W0, W1 = TM['window']; m.tone_line(W0, W1 + 0.6, 76, 0.007, 0.0, glide=lambda t: 5 * s5(W0, W1, t))
S0, S1 = TM['boxShut']; card(S1, 0.03, 0.4, 160)
G0, G1 = TM['boxGone']; m.swish(G0, G1 - G0, 0.008, 0.5, 700); card(G1 - 0.1, 0.035, 0.6, 120)

# ---------------------------------------------------------------- the hours fly round: ticks racing, then slowing
m.whoosh(10.25, 0.85, 240, 1500, 0.014, 0.0)
H0, H1 = TM['hours']; tt = np.linspace(H0, H1, 20000); turns = 36 * s5(H0, H1, tt)
for kk in range(1, 36 * 4):                                                                  # a tick every quarter hour, as the fork goes round
    at = float(np.interp(kk / 4, turns, tt)); m.tick(at, 0.005, 0.0, hi=2600, lo=1200)
m.whoosh(H0, H1 - H0, 400, 2400, 0.008, 0.0)

# ---------------------------------------------------------------- the switch: clicked on in a sparkle; nothing happens; its plug, plugged into nothing
m.whoosh(13.3, 0.8, 240, 1500, 0.014, -0.3)
MG = TM['magic']
k = int(0.2 * SR); x = np.arange(k) / SR
one(MG + 0.06, bp(m.noise(k), 1500, 9000) * env(k, 0.0004, 0.006) + np.sin(2 * np.pi * 1300 * x) * env(k, 0.0005, 0.012) * 0.5, 0.05, -0.3)   # the toggle's click
m.shimmer(MG + 0.08, (88, 92, 95), 0.012, -0.3, 0.45, 1.5); m.rain(MG + 0.1, MG + 0.9, 30, 0.006, pitch=(96, 110), seed=15)
m.pluck(MG + 0.95, 67, 0.012, -0.2, 0.5); m.pluck(MG + 1.25, 63, 0.012, -0.2, 0.7)                  # ... and nothing
C0, C1 = TM['cable']; m.whoosh(C0, C1 - C0, 300, 1200, 0.012, -0.3, up=False)
m.pluck(C1 - 0.1, 60, 0.012, -0.3, 0.4); m.pluck(C1 + 0.08, 55, 0.012, -0.3, 0.7)                  # the plug: plugged into nothing

# ---------------------------------------------------------------- the balance: weights dropped on the pans, lifted off; the beam swings and settles
m.whoosh(18.3, 0.9, 240, 1500, 0.016, 0.3)
for kind, pan, land, off in TM['weights']:
    p = -0.1 if pan == 0 else 0.5
    small = kind == 'win8'
    m.swish(land - 0.33, 0.33, 0.006, p, 1400)
    m.clink(land, 0.03 if not small else 0.014, p, f=1700 if not small else 2600); m.thud(land, 130, 0.02 if not small else 0.006, p, 0.05)
    if not small: creak(land + 0.03, 1.2, 0.006, 0.2)
    if off < 90: m.swish(off - 0.05, 0.6, 0.008, p, 1800)
m.pluck(TM['weights'][1][2] + 0.7, 69, 0.012, 0.2, 0.45); m.pluck(TM['weights'][1][2] + 0.85, 69, 0.011, 0.2, 0.5)   # level: the same note twice
m.pluck(TM['weights'][4][2] + 0.45, 72, 0.01, -0.1, 0.4); m.pluck(TM['weights'][4][2] + 0.6, 72, 0.009, -0.1, 0.4)      # the window weighs nothing
m.pluck(TM['weights'][7][2] + 0.75, 64, 0.012, 0.3, 0.45); m.pluck(TM['weights'][7][2] + 0.9, 64, 0.011, 0.3, 0.5)     # a tie
for at in (T['trial'] + 0.1, 30.95, T['ninetynine'] + 0.05): m.tick(at, 0.007, 0.3, hi=2400, lo=1000)                # the tags

# ---------------------------------------------------------------- the plate: the hands to ten past ten, the brand; then midnight and the fridge
m.whoosh(47.95, 0.8, 240, 1500, 0.014, -0.1)
tr = m.t(T['clock'] - 0.35, T['clock'] + 0.45); one(T['clock'] - 0.35, bp(m.noise(len(tr)), 1800, 5000) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 38 * (tr - tr[0])))) * np.sin(np.pi * np.clip((tr - tr[0]) / 0.8, 0, 1)), 0.006, 0.0)   # a winder's whirr
B0 = TM['brand'][0]; m.shimmer(B0 + 0.15, (86, 90, 93), 0.007, 0.0, 0.5, 1.3)
m.whoosh(56.45, 0.85, 240, 1500, 0.014, -0.4)
tr = m.t(T['raid'] - 0.2, T['midnight']); one(T['raid'] - 0.2, bp(m.noise(len(tr)), 1800, 5000) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 38 * (tr - tr[0])))) * np.sin(np.pi * np.clip((tr - tr[0]) / (tr[-1] - tr[0]), 0, 1)), 0.005, 0.0)
FR0, FR1 = TM['fridge']
k = int(0.3 * SR); x = np.arange(k) / SR
one(FR0 + 0.05, lp(m.noise(k), 500) * env(k, 0.001, 0.05) + np.sin(2 * np.pi * 95 * x) * env(k, 0.002, 0.06) * 0.6, 0.045, -0.5)   # the seal lets go
m.swish(FR0 + 0.05, FR1 - FR0 + 0.2, 0.012, -0.5, 700)
th = m.t(FR0, 61.6); one(FR0, lp(np.sin(2 * np.pi * 55 * th) + 0.5 * np.sin(2 * np.pi * 110 * th) + lp(m.noise(len(th)), 140) * 0.6, 400) * ss(FR0, FR0 + 0.3, th) * (1 - ss(61.0, 61.6, th)), 0.006, -0.5)   # its hum
m.pad([72, 76, 79, 84], FR0 + 0.05, 59.2, 0.25, 2600, att=0.25, rel=0.9)                        # the light: a little heavenly chord
card(61.65, 0.02, -0.5, 110)                                                                    # the door swings shut, off screen

# ---------------------------------------------------------------- three proper meals set down
m.whoosh(58.85, 0.65, 260, 1500, 0.014, 0.2)
for j, at in enumerate(TM['meals']):
    m.swish(at - 0.27, 0.27, 0.005, (0.4, 0.0, -0.4)[j], 1600); m.clink(at, 0.022, (0.4, 0.0, -0.4)[j], f=(2300, 2100, 2500)[j]); m.thud(at, 160, 0.012, (0.4, 0.0, -0.4)[j], 0.04)
m.pluck(TM['meals'][2] + 0.25, 72, 0.012, 0.0, 0.5); m.pluck(TM['meals'][2] + 0.4, 76, 0.011, 0.0, 0.55); m.pluck(TM['meals'][2] + 0.55, 79, 0.01, 0.0, 0.7)

# ---------------------------------------------------------------- the end
m.whoosh(73.6, 1.35, 220, 1400, 0.012, 0.0)
m.whoosh(T['settings'] - 0.2, T['logo'] - T['settings'] + 0.2, 220, 2600, 0.04, 0.0)
m.logo_end(T['logo'] - 0.15, T['logo'])

# ---------------------------------------------------------------- the score
m.pad([45, 57, 60, 64], 0.0, 5.1, 0.5, 1000)                         # waiting for noon
m.pulse(0.4, 4.9, 96, [57, 60, 64, 60], 0.006, 1300, lvl=lambda t: float(ss(0.4, 1.0, t)) * (1 - float(ss(4.5, 4.9, t))))
m.pad([48, 55, 60, 64, 67], 5.1, 10.4, 0.5, 1500)                    # noon: pizza
m.pad([43, 55, 59, 62], 10.4, 18.6, 0.5, 1000)                       # built to go hours; no magic switch
m.pad([45, 52, 57, 60, 64], 18.6, 30.6, 0.5, 1100)                   # one trial
m.pad([41, 53, 57, 60], 30.6, 40.5, 0.5, 1000)                       # a year-long trial
m.pad([43, 50, 55, 59], 40.5, 48.6, 0.5, 1100)                       # ninety-nine trials
m.pad([48, 55, 60, 64], 48.6, 56.4, 0.5, 1200)                       # one way to eat less; use it
m.pad([40, 52, 55, 59], 56.4, 62.0, 0.5, 900)                        # midnight; three proper meals
m.pad([38, 50, 57, 62], 62.0, 74.4, 0.5, 900)                        # the warnings
m.pad([45, 57, 64, 69, 72, 76], 74.4, T['end'], 1.0, 2400, rel=0.2)
m.finish(REPORT, VOICE, OUT, 'film14')

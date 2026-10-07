"""Film 10 "Should you walk after eating?" (new direction, 7 Oct 2026): score and sound design, timed to films/film10.js.
The evening line drawing itself over the sofa; the seat cushion's coil spring that launches the skeleton (a proper boing),
the flight and the landing; the plush python's slow gurgle and, at "goat", a muffled bleat from inside it; the study on the
coffee table (plates, the 30-minute block that splits into three), the hill that shrinks twice; things sinking away; the
street lamps humming on; the wooden toy dog rolling up, the leash hopping into the hand, the walk (bony footsteps, the dog's
wheels, a little shop bell); the dishes waiting; the medicine; the line dipping below "too low"; the dial and the logo.
Every time comes from the timing table the picture exports (timing10.json, window.HFS_W.timing).
Usage: python3 sound_film10.py <voice guide wav> <voice report json> <out dir>"""
import sys, json, os
import numpy as np
from sfx import Mix, SR, ss, env, bp, lp, hp, note

VOICE, REPORT, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
T = dict(end=73.16, logo=70.64, dinner=1.54, lets=6.95, your2=9.46, not_=11.06, python=13.95, goat=15.27, in_=16.48, thirty=20.77,
         with_=27.44, same2=39.52, these=41.92, so=46.35, around=50.6, the=54.18, if_=57.27, ask=63.44, final=68.38, settings=69.96)
HERE = os.path.dirname(os.path.abspath(__file__))
TM = json.load(open(os.path.join(HERE, 'timing10.json')))
m = Mix(T['end'], seed=20261010)
rng = np.random.default_rng(1010)
def s5(a, b, x):
    u = np.clip((np.asarray(x, float) - a) / (b - a), 0, 1); return u * u * u * (u * (u * 6 - 15) + 10)
def band(t, a, b, r=0.5): return ss(a - r, a, t) * (1 - ss(b, b + r, t))   # 1 inside [a, b], soft edges
m.room(0.004)

# ---------------------------------------------------------------- the evening line: it draws itself up off the dinner and hangs there
A0, A1 = TM['drawA']
m.tone_line(A0, 6.9, 69, 0.006, -0.2, glide=lambda t: 5 * s5(A0, A0 + 1.3, t) - 2 * s5(A0 + 2.0, A1, t))
m.shimmer(A0 + 0.1, (88, 93, 100), 0.004, -0.25, 0.5, 1.2)
m.tick(3.45, 0.008, -0.3, hi=3600, lo=1800)                                      # the "blood sugar" tag

# ---------------------------------------------------------------- the spring: the cushion jumps up on its coil and launches the skeleton
L0, L1 = TM['launch']; touch = TM['touch']
m.clink(L0 - 0.02, 0.01, -0.3, 1800)                                             # the catch lets go
n = int(1.6 * SR); x = np.arange(n) / SR
f = 150 * (1 + 1.6 * np.exp(-x / 0.05)) * (1 + 0.16 * np.sin(2 * np.pi * 11 * x) * np.exp(-x / 0.45))   # sproing: a fast sweep, then the coil wobbles
ph = 2 * np.pi * np.cumsum(f) / SR
boing = (np.sin(ph) + 0.35 * np.sin(2 * ph) + 0.12 * np.sin(3.01 * ph)) * env(n, 0.002, 0.42)
m.add('X', lp(boing, 2600) * 0.05, L0, -0.25)
m.add('X', bp(m.noise(int(0.12 * SR)), 1200, 6000) * env(int(0.12 * SR), 0.001, 0.03) * 0.02, L0, -0.25)   # fabric whump
m.whoosh(L0 + 0.05, L1 - L0, 260, 1900, 0.022, 0.0)                              # the flight
for k, (dt, g) in enumerate([(0.0, 0.03), (0.035, 0.018), (0.06, 0.012), (0.09, 0.008)]):   # the landing: two feet, and the bones settling
    m.tock(touch + dt, g, (-0.12, 0.12, -0.05, 0.05)[k], f=(700, 760, 980, 1150)[k])
m.thud(touch, 60, 0.03, 0.0, 0.12)
tw = m.t(L0 + 0.12, L0 + 2.6); u = tw - (L0 + 0.12)                              # the empty cushion bounces on its coil and settles
wob = np.sin(2 * np.pi * np.cumsum(220 * (1 + 0.05 * np.cos(11 * u))) / SR) * np.exp(-u * 3.2) * np.abs(np.cos(11 * u)) ** 0.5
m.add('X', lp(wob, 1500) * 0.006, L0 + 0.12, -0.3)

# ---------------------------------------------------------------- the python: a slow, contented gurgle; at "goat" the horns wiggle and something inside says meh
tp = m.t(12.6, 16.9)
gurgle = lp(m.noise(len(tp)), 120) * (0.5 + 0.5 * np.sin(2 * np.pi * 0.6 * tp)) * 6
m.add('X', gurgle * band(tp, 13.2, 16.3, 0.5) * 0.004, 12.6, 0.3)
for at in (13.55, 14.7, 15.9):                                                   # little digestive bubbles
    nb = int(0.25 * SR); xb = np.arange(nb) / SR
    bub = np.sin(2 * np.pi * np.cumsum(140 * (1 + 0.8 * xb / 0.25)) / SR) * env(nb, 0.01, 0.07)
    m.add('X', lp(bub, 700) * 0.008, at, 0.3)
W0, W1 = TM['wiggle']
for k in range(9): m.tick(W0 + 0.05 + k * 0.07, 0.004, 0.3, hi=2600, lo=1300)   # the horns rattle
nb = int(0.75 * SR); xb = np.arange(nb) / SR                                      # the bleat: a vowel with a goat's tremolo, muffled by a python
f0 = 330 * (1 + 0.06 * np.sin(2 * np.pi * 7.5 * xb)) * (1 - 0.08 * xb)
saw = sum(np.sin(2 * np.pi * np.cumsum(f0 * h) / SR) / h for h in range(1, 9))
voc = bp(saw, 550, 900) * 1.0 + bp(saw, 1000, 1500) * 0.5
m.add('X', lp(voc, 900) * env(nb, 0.04, 0.3) * (1 - np.exp(-xb / 0.03)) * 0.02, T['goat'] + 0.32, 0.3)

# ---------------------------------------------------------------- the study: plates slide in, a 30-minute block rises, and splits into three
P0, P1 = TM['platesIn']
for k, at in enumerate((P0, P0 + 0.15)): m.swish(at, P1 - P0, 0.006, 0.2, 1100); m.clink(P1 + 0.02 + 0.1 * k, 0.006, 0.2, 2600 + 300 * k)
S0, S1 = TM['slabUp']; m.whoosh(S0, S1 - S0 + 0.2, 300, 1200, 0.006, 0.25); m.tick(S1, 0.01, 0.25, hi=2400, lo=900)
SP0, SP1 = TM['split']
for k, nn in enumerate((76, 79, 83)): m.pluck(SP0 + 0.25 + k * 0.32, nn, 0.016, 0.15 + 0.08 * k, 0.4)   # one, two, three blocks of ten

# ---------------------------------------------------------------- the hill: the line moves over the table and rises; then it shrinks, twice
M0, M1 = TM['morph']; m.whoosh(M0, M1 - M0, 500, 1800, 0.008, 0.0)
m.shimmer(TM['ghost'][0], (86, 91, 98), 0.004, -0.15, 0.5, 1.2)
Q0 = M1 - 0.2; Q1 = TM['graphOut'][1]
m.tone_line(Q0, Q1, 64, 0.005, 0.0, glide=lambda t: 7 * s5(Q0, Q0 + 0.9, t) - 1.5 * s5(*TM['shrink1'], t) - 1.5 * s5(*TM['shrink2'], t))
for sh, tag in ((TM['shrink1'], 33.25), (TM['shrink2'], 35.95)):
    m.whoosh(sh[0], sh[1] - sh[0], 1400, 450, 0.006, 0.1, up=False); m.tick(tag + 0.2, 0.008, 0.25, hi=3400, lo=1600)
G0, G1 = TM['pulse']
for k in range(3): m.pluck(T['same2'] + 0.09 + k * (2 * np.pi / 9), 81, 0.012, 0.15 + 0.1 * k, 0.35)   # the same three blocks, pulsing
m.whoosh(TM['graphOut'][0], 0.7, 1500, 500, 0.004, 0.0, up=False)

# ---------------------------------------------------------------- the table empties and sinks; the street lamps hum on
m.swish(TM['platesSink'][0], 0.6, 0.006, 0.2, 900); m.thud(TM['platesSink'][1], 90, 0.008, 0.2, 0.08)
def sink(t0, t1, pan):
    tl = m.t(t0, t1 + 0.05); u = np.clip((tl - t0) / (t1 - t0), 0, 1); f = 70 - 22 * u
    hum = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.6 + np.sin(2 * np.pi * np.cumsum(2 * f) / SR) * 0.25
    m.add('X', (hum + lp(m.noise(len(tl)), 160) * 0.9) * np.sin(np.pi * u) ** 0.7 * 0.012, t0, pan)
    m.thud(t1, 55, 0.02, pan, 0.1)
sink(*TM['tableSink'], 0.3)
LA0, LA1 = TM['lamps']; tl = m.t(LA0, 57.6)
buzz = (np.sin(2 * np.pi * 100 * tl) + 0.4 * np.sin(2 * np.pi * 200 * tl) + 0.15 * np.sin(2 * np.pi * 300 * tl)) * ss(LA0, LA1, tl) * (1 - ss(*TM['street'], tl))
m.add('X', lp(buzz, 900) * 0.0018, LA0, -0.35)
for k, at in enumerate((LA0 + 0.1, LA0 + 0.75)): m.tick(at, 0.006, -0.4 + 0.15 * k, hi=1500, lo=600)   # the lamps click on, one after the other

# ---------------------------------------------------------------- the toy dog: it rolls up, the leash hops into the hand, and off they go
def wheels(t0, t1, speed, gain, pan):   # wooden wheels on a hard floor: a soft rumble, little clicks as the grain goes round
    tw = m.t(t0, t1); sp = speed(tw)
    rum = lp(m.noise(len(tw)), 260) * sp * 3
    m.add('X', rum * gain, t0, pan)
    rot = np.cumsum(sp) / SR * 9.0; idx = np.nonzero(np.diff(np.floor(rot)))[0]
    for i in idx[::2]: m.tick(t0 + i / SR, gain * 1.4 * float(sp[i]), pan, hi=2200, lo=900)
D0, D1 = TM['dogRoll']
wheels(D0, D1 + 0.15, lambda t: np.sin(np.pi * np.clip((t - D0) / (D1 - D0), 0, 1)), 0.01, -0.3)
for k, g in enumerate((0.006, 0.004, 0.002)): m.tick(D1 + 0.03 + k * 0.09, g, -0.3, hi=3000, lo=1500)   # the spring tail wobbles as it stops
H0, H1 = TM['leashHop']; m.swish(H0, H1 - H0, 0.008, -0.2, 1600); m.tick(H1, 0.012, -0.15, hi=1700, lo=700)   # the leash flies up and is caught
WK0, WK1 = TM['walk']
wheels(WK0 + 0.3, WK1 - 5.0, lambda t: ss(WK0 + 0.3, WK0 + 1.4, t) * (1 - ss(55.0, 56.6, t)) * 0.9, 0.007, -0.25)
for k, at in enumerate(TM['steps']):                                            # bony footsteps: heel, then the ball of the foot
    far = 1 - 0.8 * ss(54.6, 56.4, at)                                             # the camera stops at the counter; the walker walks on
    pan = (-0.08 if k % 2 else 0.08) - 0.5 * ss(54.0, 56.0, at)
    m.tock(at, 0.016 * far * rng.uniform(0.85, 1.1), pan, f=rng.uniform(820, 980))
    m.tock(at + 0.1, 0.007 * far, pan, f=rng.uniform(1150, 1350))
m.bell(TM['shopDoor'] + 0.05, 93, 0.007, -0.3, 0.8, buf='X')                      # a shop's door bell as it walks past
W0, W1 = TM['wag']
for k in range(12): m.tick(W0 + 0.1 + k * 0.11, 0.004, -0.25, hi=3600, lo=2000)   # the spring tail wags, "with the dog"
ts = m.t(LA0, 57.8)                                                             # the street: far traffic, a little air
amb = lp(m.noise(len(ts)), 380) * 1.2 + bp(m.noise(len(ts)), 900, 2600) * 0.15 * (0.5 + 0.5 * np.sin(2 * np.pi * 0.07 * ts))
m.add('X', amb * ss(LA0, LA1 + 0.5, ts) * (1 - ss(TM['street'][0], TM['street'][1] + 0.3, ts)) * 0.0035, LA0, 0.0)

# ---------------------------------------------------------------- the dishes wait (a plate settles on the stack); the medicine comes up
m.clink(TM['counter'] + 0.6, 0.006, -0.1, 2400); m.clink(TM['counter'] + 0.72, 0.003, -0.1, 3100)
K0, K1 = TM['push']; m.whoosh(K0, K1 - K0, 300, 1500, 0.01, 0.0)
MU0, MU1 = TM['medUp']; m.whoosh(MU0, MU1 - MU0 + 0.1, 250, 1000, 0.007, -0.15); m.tick(MU1, 0.012, -0.15, hi=1900, lo=700)

# ---------------------------------------------------------------- too low: the line dips under the dashes, then comes back up
C0, C1 = TM['lineC']; DP0, DP1 = TM['dip']; UP0, UP1 = TM['undip']
m.tone_line(C0, C1, 69, 0.005, 0.1, glide=lambda t: -9 * s5(DP0, DP1, t) * (1 - s5(UP0, UP1, t)))
n = int(0.5 * SR); x = np.arange(n) / SR                                          # a soft, low "bonk" as it crosses the line
m.add('X', lp(np.sin(2 * np.pi * 196 * x) + 0.4 * np.sin(2 * np.pi * 392 * x), 900) * env(n, 0.003, 0.22) * 0.014, DP1 - 0.25, 0.1)
m.tick(DP1 - 0.2, 0.008, 0.15, hi=3000, lo=1500)                                 # the "too low" tag

# ---------------------------------------------------------------- the dial: up it comes, the needle to ten minutes, the logo
DU0, DU1 = TM['dialUp']; m.whoosh(DU0 - 0.05, DU1 - DU0 + 0.2, 200, 900, 0.011, 0.25); m.clink(DU1 - 0.05, 0.014, 0.25, 2200)
N0, N1 = TM['needle']; xs = np.linspace(N0, N1, 900); vs = 10 * s5(N0, N1, xs)
for k in range(1, 11): m.tick(float(xs[np.argmax(vs >= k)]), 0.013 * (1.3 if k == 10 else 1.0), 0.25, hi=3300, lo=1500)

# ---------------------------------------------------------------- the score
m.pad([41, 53, 57, 60, 64], 0.0, 7.0, 0.42, 800)                                 # slumped: heavy, warm, a bit too comfortable
m.pad([45, 57, 61, 64, 69], 7.4, 11.2, 0.5, 1500)                                # off that sofa
m.pulse(9.4, 11.0, 112, [69, 73, 76, 73], 0.006, 1600, lvl=lambda t: float(ss(9.4, 9.8, t) * (1 - ss(10.6, 11.0, t))))
m.pad([38, 50, 57, 60, 65], 11.2, 16.4, 0.45, 700)                               # a python digesting a goat: low and lazy
m.pad([45, 57, 60, 64], 16.4, 27.4, 0.5, 1200)                                   # the study
m.pulse(16.8, 27.0, 92, [69, 72, 76, 72], 0.005, 1500, lvl=lambda t: float(ss(16.8, 17.8, t) * (1 - ss(26.2, 27.0, t))))
m.pad([43, 55, 59, 62], 27.4, 41.8, 0.5, 1200)                                   # the rise after eating
m.pad([45, 57, 62, 64, 69], 41.8, 46.3, 0.5, 1300)                               # same walk, better timing; a habit, not a cure
m.pad([43, 55, 59, 62, 67], 46.3, 56.8, 0.5, 1500)                               # the walk
m.pulse(48.0, 56.4, 104.6, [67, 71, 74, 71, 69, 72, 76, 72], 0.006, 1700, lvl=lambda t: float(ss(48.0, 49.0, t) * (1 - ss(55.4, 56.4, t))))
m.pad([41, 53, 57, 60, 64], 56.8, 68.3, 0.5, 900)                                # the dishes; the medicine; ask your doctor
m.pad([41, 53, 60, 65, 69, 72], 68.3, T['end'], 1.0, 2400, rel=0.2)
m.whoosh(T['final'] - 0.1, T['logo'] - T['final'], 220, 2600, 0.05, 0.0)
m.logo_end(T['logo'] - 0.15, T['logo'])
m.finish(REPORT, VOICE, OUT, 'film10')

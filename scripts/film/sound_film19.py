"""Film 19 "Can you get up off the floor without your hands?" (new direction): score and sound design, timed to films/film19.js.
On the floor: a hand slaps down, a knee drops, the sofa creaks as he hauls himself up and wobbles. The clean move is
nearly silent, just cloth and breath of motion. The scored test: the board's paddle flips down with a wooden clack for
the hand, again for the knee; the points come back with rising plucks and three bars swelling up. The chair ladder:
a creak and a seat pat for every stand, less wood as the hands do less, a clean quiet stand on nothing. Calf raises on
a soft heel tick. One slow trip down to the floor and back, all swish and one soft landing. The warning sign ticks its
rows. The logo.
Every time comes from the timing table the picture exports (timing19.json, window.HFS_W.timing) or from the film's words.
Usage: python3 sound_film19.py <voice guide wav> <voice report json> <out dir>"""
import sys, json, os, math
import numpy as np
from sfx import Mix, SR, ss, env, bp, lp, hp, note

VOICE, REPORT, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
T = dict(end=77.15, logo=74.65, you=0.35, hand1=4.56, knee1=4.91, prayer=6.19, haveNot=8.24, body=13.54, sit2=14.93, strength=18.23, flexibility=19.86, researchers=22.19, sat3=26.24, rose=27.73, every=29.36, cost=30.53, linked4=32.75, each=36.23, extra=36.68, point5=37.15, twentyOne=38.15, so6=41.72, win=42.3, seatFirst=44.76, oneHand=45.73, fingertip=47.02, nothing=47.94, train=49.36, twice=50.34, chairStands=50.96, calf=51.94, slow=53.14, trips=53.58, floor7=54.76, back7=55.4, plain=56.59, hip8=60.0, cannot=61.36, call=62.23, keepWarm=64.51, doctor=69.86, final=72.3)
HERE = os.path.dirname(os.path.abspath(__file__))
TM = json.load(open(os.path.join(HERE, 'timing19.json')))
m = Mix(T['end'], seed=20261201)
rng = np.random.default_rng(1919)
def sm(a, b, x): return float(ss(a, b, x))
def s5(a, b, x):
    u = min(1.0, max(0.0, (x - a) / (b - a))); return u * u * u * (u * (u * 6 - 15) + 10)
def one(at, sig, gain, pan=0.0): m.add('X', sig * gain, at, pan)
def paper(at, gain=0.012, pan=0.0):
    n = int(0.06 * SR); one(at, bp(m.noise(n), 1200, 6500) * env(n, 0.0008, 0.016), gain, pan)
def slap(at, gain=0.05, pan=0.0):   # a palm hitting the floor
    m.thud(at, 95, gain * 0.8, pan, 0.07); n = int(0.09 * SR); one(at, bp(m.noise(n), 700, 4200) * env(n, 0.0005, 0.02), gain, pan)
def clack(at, gain=0.03, pan=0.15):   # the score paddle flipping
    m.clink(at, gain, pan, f=1900); paper(at + 0.02, gain * 0.7, pan); m.tock(at + 0.03, gain * 0.8, pan, f=640)
def creak(at, d=0.45, gain=0.006, pan=0.1):   # wood and joints under effort
    tt = m.t(at, at + d); u = np.clip((tt - at) / d, 0, 1)
    one(at, bp(m.noise(len(tt)), 500, 2200) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * (34 + 18 * u) * (tt - at)))) * np.sin(np.pi * u) ** 1.5, gain, pan)
def scribble(a, d, gain=0.012, pan=0.0):
    tt = m.t(a, a + d); s = bp(m.noise(len(tt)), 1800, 7000) * (0.6 + 0.4 * np.abs(np.sin(2 * np.pi * 9 * tt))) * np.sin(np.pi * np.clip((tt - a) / d, 0, 1)) ** 0.6
    m.add('X', s * gain, a, pan)
def swell(a, b, gain=0.01, pan=0.0, f0=100, f1=150):
    tt = m.t(a, b); u = np.clip((tt - a) / (b - a), 0, 1); f = f0 + (f1 - f0) * u
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.3 * lp(m.noise(len(tt)), 400); m.add('X', s * np.sin(np.pi * u) ** 1.5 * gain, a, pan)
m.room(0.005)

# ---------------------------------------------------------------- the hook: hand, knee, the sofa, the wobble
slap(TM['handDown'], 0.055, -0.1)
m.thud(TM['kneeDown'], 80, 0.035, 0.0, 0.09)
creak(TM['sofaGrab'], 0.6, 0.009, -0.25); m.rustle(TM['sofaGrab'] + 0.05, TM['sofaGrab'] + 0.75, 0.014, -0.25)
creak(TM['upFirst'], 0.9, 0.007, 0.0); m.swish(TM['upFirst'], 0.8, 0.012, 0.0, f=1200)
for k in range(3): m.tick(T['haveNot'] + 0.35 + k * 0.24, 0.006 * (1 - k * 0.3), 0.05, hi=1800, lo=700)   # the wobble settling, foot to foot
# ---------------------------------------------------------------- the clean move: quiet swishes, one soft landing each way
D0, D1 = TM['descend1']; m.swish(D0, D1 - D0, 0.009, 0.0, f=1000); m.thud(D1 + 0.05, 65, 0.028, 0.0, 0.12)
R0, R1 = TM['rise1']; m.swish(R0, R1 - R0, 0.009, 0.0, f=1100); creak(R0 + 0.2, 0.5, 0.004, 0.0)
# ---------------------------------------------------------------- the scored test: two clacks down, the points won back
slap(TM['handDown2'] + 0.35, 0.045, -0.05)
for at in TM['flips']: clack(at, 0.032, 0.2)
for k, at in enumerate(TM['scoreUp']): clack(at, 0.026, 0.2); m.pluck(at + 0.06, 64 + 5 * k, 0.009, 0.15, 0.5)
for k, a in enumerate(TM['bars']): swell(a, a + 0.55, 0.008 + 0.002 * k, 0.1, 95 + 15 * k, 140 + 20 * k)
m.shimmer(T['twentyOne'] + 0.1, (88, 95), 0.008, 0.2, 0.4, 1.2)
# ---------------------------------------------------------------- the chair ladder: a creak for every stand, quieter as the hands do less
for i, at in enumerate(TM['stands']):
    creak(at - 0.85, 0.6, 0.008 * (1 - 0.14 * i), 0.2); m.thud(at - 0.02, 120, 0.008 * (1 - 0.12 * i), 0.2, 0.05)
    if i < 4: paper(at + 0.35, 0.006, 0.2)
for at in TM['ticks']: m.tick(at + 0.05, 0.014, 0.25, hi=2600, lo=1200)
m.pluck(TM['train'] + 0.05, 67, 0.009, 0.1, 0.6)
# calf raises: a soft heel tick at the top of each rise
C0, PER, NC = TM['calf']
for k in range(int(NC)): m.tick(C0 + k * PER + 0.62, 0.012, 0.1, hi=2200, lo=900)
# one slow trip down to the floor and back
TR0, TR1 = TM['trip']; m.swish(TR0, 1.7, 0.008, 0.0, f=900); m.thud(T['floor7'] + 0.72, 62, 0.03, 0.0, 0.14); m.swish(TR1 - 1.15, 1.1, 0.008, 0.0, f=1000); creak(TR1 - 1.0, 0.7, 0.005, 0.0)
# ---------------------------------------------------------------- the warning sign
SI, SO = TM['sign']; m.swish(SI, 0.35, 0.012, -0.2, 1500); paper(SI + 0.2, 0.012, -0.2)
for k, at in enumerate(TM['checks']): scribble(at, 0.22, 0.012, -0.25 + 0.06 * k)
m.pluck(TM['doctor'] + 0.05, 62, 0.01, -0.1, 0.6); m.pluck(TM['doctor'] + 0.2, 67, 0.009, -0.1, 0.8)
m.swish(SO, 0.35, 0.009, -0.2, 1300)
# ---------------------------------------------------------------- the camera's moves; the logo
for a, b in TM['moves']:
    if a > T['final']: continue
    m.whoosh(a + 0.05, b - a, 250, 1700, 0.013 if b - a < 0.9 else 0.017, 0.2)
m.whoosh(T['final'] + 0.1, T['logo'] - T['final'], 220, 2400, 0.03, 0.0)
m.logo_end(T['logo'] - 0.15, T['logo'])
# ---------------------------------------------------------------- the score: one pad per line of the script
m.pad([38, 50, 57, 62], 0.0, T['body'], 0.45, 1000)              # the hook: the floor, the sofa
m.pad([41, 53, 57, 60], T['body'], T['researchers'], 0.5, 1100)  # the factory setting: one piece
m.pad([43, 55, 58, 62], T['researchers'], T['every'], 0.5, 1150) # the test, scored
m.pad([40, 52, 55, 59], T['every'], T['each'], 0.5, 950)         # what it costs
m.pad([43, 55, 59, 64], T['each'], T['so6'], 0.5, 1200)          # every point back
m.pad([38, 50, 53, 57], T['so6'], T['train'], 0.5, 1000)         # the chair ladder
m.pad([41, 53, 57, 60], T['train'], T['plain'], 0.5, 1100)       # training
m.pad([37, 49, 52, 56], T['plain'], T['final'], 0.38, 900)       # the warning, plain
m.pad([41, 53, 60, 65, 69, 72], T['final'], T['end'], 1.0, 2400, rel=0.2)
m.finish(REPORT, VOICE, OUT, 'film19')

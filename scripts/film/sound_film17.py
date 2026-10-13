"""Film 17 "How do I build muscle?" (new direction, 7 Oct 2026): score and sound design, timed to films/film17.js.
A tiny dumbbell curled (a thin little ting at each top) and a phone flicked between sets; ARM SIZE drawn flat for three
years, then the line shoots up; two dumbbells lifted at "push"; two sections swelling alike; two ticks on a week; three
sections popping onto a chalkboard; a protein line drawn and going flat; bricks laid in two towers, the sleepless one
stopping short; leg extensions, the weight stack rising and landing; a thigh section swelling 9%; a neck that creaks round
to ask what your excuse is; three cards; a rep counted; two small plates clinked onto a bar; a balance held; the logo.
Every time comes from the timing table the picture exports (timing17.json, window.HFS_W.timing).
Usage: python3 sound_film17.py <voice guide wav> <voice report json> <out dir>"""
import sys, json, os
import numpy as np
from sfx import Mix, SR, ss, env, bp, lp, hp, note

VOICE, REPORT, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
T = dict(end=79.49, logo=76.97, you=0.35, tiny=1.58, scrolling=3.14, nothing=6.1, grows=6.76, lets=8.05, growing=8.93, your=10.13,
         similar=16.36, the=21.17, twice=24.74, more=26.59, protein=29.85, little=31.04, kilo=33.72, sleep=36.51, cut=39.55, eighteen=42.68,
         never=45.4, nine=50.63, so=52.98, excuse=53.88, pick=55.06, squats=56.51, pushups=56.99, rows=57.78, rep2=59.16, weight=59.76,
         over=63.19, balance=64.3, falls=66.68, doctor=72.37, final=74.7, factory=75.91, settings=76.28)
HERE = os.path.dirname(os.path.abspath(__file__))
TM = json.load(open(os.path.join(HERE, 'timing17.json')))
m = Mix(T['end'], seed=20261017)
rng = np.random.default_rng(1717)
def s5(a, b, x):
    u = np.clip((np.asarray(x, dtype=float) - a) / (b - a), 0, 1); return u * u * u * (u * (u * 6 - 15) + 10)
def one(at, sig, gain, pan=0.0): m.add('X', sig * gain, at, pan)
m.room(0.005)

def swell(a, b, gain=0.01, pan=0.0, f0=110, f1=160):   # something filling out
    tt = m.t(a, b); u = np.clip((tt - a) / (b - a), 0, 1); f = f0 + (f1 - f0) * u
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.3 * lp(m.noise(len(tt)), 400)
    m.add('X', s * np.sin(np.pi * u) ** 1.5 * gain, a, pan)
def rise(a, b, gain=0.008, pan=0.0, f0=400, f1=900):   # a line climbing
    tt = m.t(a, b); u = np.clip((tt - a) / (b - a), 0, 1); f = f0 + (f1 - f0) * u ** 0.7
    m.add('X', (np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.5 + 0.5 * bp(m.noise(len(tt)), 900, 3000)) * np.sin(np.pi * u) ** 0.8 * gain, a, pan)
def scribble(a, d, gain=0.012, pan=0.0):   # a felt marker on paper (or chalk)
    tt = m.t(a, a + d); s = bp(m.noise(len(tt)), 1800, 7000) * (0.6 + 0.4 * np.abs(np.sin(2 * np.pi * 9 * tt))) * np.sin(np.pi * np.clip((tt - a) / d, 0, 1)) ** 0.6
    m.add('X', s * gain, a, pan)
def clank(at, gain=0.03, pan=0.0, f=180):   # iron on iron
    nn = int(0.5 * SR); x = np.arange(nn) / SR
    ring = sum(np.sin(2 * np.pi * f * r * x) * np.exp(-x / d) for r, d in [(1, 0.18), (2.76, 0.09), (5.4, 0.05)])
    m.add('X', (ring * 0.5 + bp(m.noise(nn), 800, 6000) * np.exp(-x / 0.01)) * gain, at, pan)
def ting(at, gain=0.006, pan=0.0, f=3800):   # a thin little ring (the tiny dumbbell)
    nn = int(0.6 * SR); x = np.arange(nn) / SR
    one(at, (np.sin(2 * np.pi * f * x) + 0.4 * np.sin(2 * np.pi * f * 2.4 * x) * np.exp(-x * 12)) * np.exp(-x * 7) * env(nn, 0.0006, 0.6), gain, pan)
def flick(at, gain=0.012, pan=0.0):   # a thumb across glass
    nn = int(0.12 * SR); x = np.arange(nn) / SR; one(at, bp(m.noise(nn), 2500, 9000) * np.sin(np.pi * np.clip(x / 0.12, 0, 1)) ** 2, gain, pan)
def paper(at, gain=0.012, pan=0.0):   # a card turned up
    nn = int(0.06 * SR); one(at, bp(m.noise(nn), 1200, 6500) * env(nn, 0.0008, 0.016), gain, pan)
def creak(at, d=0.5, gain=0.006, pan=0.0):   # bone turning on bone
    tt = m.t(at, at + d); u = np.clip((tt - at) / d, 0, 1)
    one(at, bp(m.noise(len(tt)), 600, 2400) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * (38 + 20 * u) * (tt - at)))) * np.sin(np.pi * u) ** 1.5, gain, pan)

# ---------------------------------------------------------------- the tiny dumbbell curled; the phone flicked between sets
for c in TM['curls']: m.swish(c + 0.05, 0.35, 0.004, -0.25, 1500); ting(c + 0.4, 0.005, -0.25, 4200)
for s in TM['scroll']: flick(s + 0.04, 0.01, 0.2)
m.beep(TM['scroll'][2] + 0.25, f=1568.0, d=0.04, g=0.003, pan=0.2)          # a like, in passing
# ---------------------------------------------------------------- ARM SIZE: three years drawn flat; then it shoots up
C0, C1 = TM['chart']; m.tone_line(C0 + 2.0, C1, 64, 0.003, 0.2)             # the flat line (a flat tone while the camera is there)
scribble(C0 + 2.0, C1 - C0 - 2.0, 0.006, 0.2)
U0, U1 = TM['up']; rise(U0, U1 + 0.1, 0.012, 0.2, 300, 1400); m.pluck(U1, 76, 0.012, 0.2, 0.6); m.pluck(U1 + 0.12, 83, 0.01, 0.2, 0.8)
# ---------------------------------------------------------------- light and heavy: both lifted at "push"; both sections swell alike
P = TM['push']; m.thud(P - 0.03, 120, 0.016, -0.1, 0.06); clank(P + 0.42, 0.01, 0.1, 210); ting(P + 0.4, 0.004, -0.2, 4000)
G0, G1 = TM['grow']; swell(G0, G1 + 0.3, 0.012, -0.15, 100, 140); swell(G0 + 0.02, G1 + 0.3, 0.012, 0.15, 101, 141)
m.pluck(G1 - 0.05, 72, 0.01, 0.0, 0.6)
# ---------------------------------------------------------------- the week: twice ticked; the board: three sections, one after another
for k, at in enumerate(TM['ticks']): scribble(at, 0.22, 0.014, -0.15 + 0.3 * k)
for k, at in enumerate(TM['secs']): m.pluck(at + 0.05, [67, 71, 74][k], 0.011, 0.15, 0.5); swell(at, at + 0.55, 0.006, 0.15, 90 + 12 * k, 120 + 12 * k)
# ---------------------------------------------------------------- protein: the line drawn, and going flat
L0, L1 = TM['line']; scribble(L0, L1 - L0, 0.008, 0.1); m.tone_line(L0 + 1.5, L1 + 0.6, 69, 0.003, 0.1, glide=lambda t: 5 * s5(L0, L0 + 1.8, t))
# ---------------------------------------------------------------- the bricks: two towers; the sleepless one stops short
B0, BP = TM['bricks']
for r, n in enumerate([10, 9]):
    for k in range(n):
        at = B0 + k * BP + 0.25; clank(at, 0.006, -0.15 if r == 0 else 0.15, f=420 + 40 * r + 6 * k)
m.pluck(B0 + 9 * BP + 0.5, 60, 0.01, 0.15, 0.5); m.pluck(B0 + 9 * BP + 0.7, 55, 0.01, 0.15, 0.9)   # 18% short: the little fall
# ---------------------------------------------------------------- leg extensions: the stack rises and lands, rep after rep; the thigh swells 9%
E0, EP = TM['ext']; TU0, TU1 = TM['turn']
for k in range(6):
    a = E0 + k * EP
    if a > 56.8: break
    tt = m.t(a, a + 1.2); u = (tt - a) / 1.2; one(a, bp(m.noise(len(tt)), 300, 1400) * (0.5 + 0.5 * np.sin(2 * np.pi * 31 * tt)) * np.sin(np.pi * u) ** 2, 0.008, 0.25)
    if a + 3.1 < TU0 or a + 3.1 > TU1 + 0.5: clank(a + 3.12, 0.009, 0.25, f=160)
N0, N1 = TM['nine']; swell(N0, N1 + 0.3, 0.012, -0.2, 90, 125)
creak(TU0 + 0.05, 0.5, 0.007, 0.1); creak(TU1 - 0.45, 0.45, 0.005, 0.1)                       # "so what's your excuse?": the head turns to us, and back
# ---------------------------------------------------------------- big moves: three cards; a rep more; two small plates onto the bar
for k, at in enumerate(TM['cards']): paper(at + 0.05, 0.012, -0.2 + 0.2 * k); m.pluck(at + 0.08, [64, 67, 71][k], 0.007, -0.2 + 0.2 * k, 0.4)
m.beep(TM['rep'] + 0.02, f=1046.5, d=0.07, g=0.008, pan=0.0)
Q0, Q1 = TM['plate']; m.swish(Q0, Q1 - Q0, 0.006, 0.0, 1300); clank(Q1 - 0.02, 0.012, -0.3, 520); clank(Q1, 0.012, 0.3, 540)
# ---------------------------------------------------------------- balance: a held note, a little creak as it holds
m.tone_line(T['balance'] - 0.2, 72.8, 67, 0.0025, 0.0, glide=lambda t: 0.25 * np.sin(2 * np.pi * 0.5 * t))
tt = m.t(64.6, 72.6); one(64.6, bp(m.noise(len(tt)), 500, 1800) * (0.5 + 0.5 * np.sin(2 * np.pi * 0.6 * tt)) ** 4, 0.004, 0.2)
# ---------------------------------------------------------------- the camera's moves
for a, b, g, pan in [(4.85, 5.6, 0.014, 0.3), (9.6, 10.35, 0.018, 0.3), (20.4, 21.15, 0.018, 0.3), (25.3, 26.0, 0.016, 0.3), (29.2, 29.95, 0.018, 0.3),
                     (35.4, 36.2, 0.018, 0.3), (44.0, 44.85, 0.02, 0.3), (50.2, 50.9, 0.014, -0.2), (52.6, 53.3, 0.014, 0.2), (54.4, 55.15, 0.018, 0.3),
                     (61.9, 62.7, 0.018, 0.3), (73.9, 75.2, 0.016, 0.3)]:
    m.whoosh(a + 0.05, b - a, 250, 1800, g, pan)
m.whoosh(T['settings'] - 0.2, T['logo'] - T['settings'] + 0.2, 220, 2600, 0.04, 0.0)
m.logo_end(T['logo'] - 0.15, T['logo'])
# ---------------------------------------------------------------- the score
m.pad([45, 52, 57, 60], 0.0, 7.9, 0.45, 1000)                        # three years of tiny dumbbells
m.pad([48, 55, 60, 64, 67], 7.9, 10.0, 0.5, 1500)                    # let's get you growing
m.pad([45, 57, 60, 64], 10.0, 20.6, 0.5, 1200)                       # built to grow; light and heavy alike
m.pad([48, 55, 60, 64], 20.6, 29.4, 0.5, 1300)                       # twice a week; more sets
m.pad([43, 55, 59, 62], 29.4, 44.4, 0.5, 1100)                       # protein; sleep
m.pad([45, 52, 57, 60, 64], 44.4, 54.6, 0.5, 1250)                   # never too late
m.pad([48, 55, 60, 64, 67], 54.6, 62.4, 0.5, 1400)                   # big moves; a rep, a little weight
m.pad([41, 53, 57, 60], 62.4, T['final'], 0.45, 950)                 # balance; your doctor
m.pad([41, 53, 60, 65, 69, 72], T['final'], T['end'], 1.0, 2400, rel=0.2)
m.pulse(10.4, 20.2, 96, [64, 67, 71, 67], 0.005, 1300, lvl=lambda t: float(ss(10.4, 11.0, t)) * (1 - float(ss(19.6, 20.2, t))))
m.finish(REPORT, VOICE, OUT, 'film17')

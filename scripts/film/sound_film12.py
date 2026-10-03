"""Film 12 "Is mouth taping safe?": score and sound design, timed to films/film12.js (the same breath, peel, specks and frames).
Usage: python3 sound_film12.py <voice guide wav> <voice report json> <out dir>"""
import sys
import numpy as np
from sfx import Mix, SR, ss, env, bp, lp, hp, note

VOICE, REPORT, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
T = dict(end=69.3, people=0.35, tape=1.20, shut=2.21, night=2.43, purpose=3.29, three=5.73, polls=6.73, five=7.14, twelve=7.97,
         percent=8.52, adults=9.06, tried=10.04, promise=11.84, better=12.47, sleep=13.02, less=13.32, snoring=13.73, even=14.27,
         sharper=14.93, jaw=15.34, review=18.07, ten=18.73, studies=19.07, two=19.58, hundred=19.96, people2=21.42, total=22.09,
         showed=23.97, main=24.34, score=25.29, improving=25.63, both=26.87, mild=27.73, neither=28.55, comparison=29.72, group=30.47,
         verdict=32.61, data=33.63, support=34.04, treatment=35.31, nose=37.39, better2=38.11, airway=38.41, sleep2=39.01, but=39.90,
         mouth=41.53, reason=42.02, blocked=43.63, nose2=44.00, tape2=45.33, over=46.41, blocked2=46.96, shut2=48.33, only=48.73,
         other=49.28, breathe=50.10, jawline=51.40, noEvidence=52.71, evidence=53.83, snoringP=55.30, pauses=56.27, gasping=56.74,
         tired=58.18, often=60.53, blocked3=61.09, dont=62.44, tape3=63.10, see=63.45, doctor=63.84, back=65.16, factory=66.02,
         settings=66.32, logo=67.02)
m = Mix(T['end'], seed=20261012)
rng = np.random.default_rng(1212)
def s5(a, b, x):
    u = np.clip((np.asarray(x, dtype=float) - a) / (b - a), 0, 1); return u * u * u * (u * (u * 6 - 15) + 10)
def pulse_(x, a, b, r=0.35): return ss(a, a + r, x) * (1 - ss(b - r, b, x))

# ---------------------------------------------------------------- the breath (the picture's breathAt: a 4.6 s cycle), in and out
tt = m.t(0, T['end']); n = len(tt); w = 2 * np.pi / 4.6
ph = np.sin(w * tt); inh = ph > 0; amt = np.abs(ph) ** 1.6                       # flow: strongest mid-breath; inhale while the chest rises
near = 0.35 + 0.65 * np.clip(pulse_(tt, -1, 5.2, 0.6) + pulse_(tt, 36.9, 51.2, 0.6) + pulse_(tt, 56.0, 65.0, 0.6), 0, 1)
block = s5(T['blocked'] - 0.2, T['nose2'] + 0.3, tt) * (1 - s5(51.2, 52.0, tt))   # the nose blocks; the demonstration ends with the shot
mouthB = s5(41.5, 42.1, tt) * (1 - s5(44.75, 45.15, tt))                          # breathing through the mouth while the tape is off
lastB = s5(63.35, 63.7, tt) * (1 - s5(64.6, 65.6, tt))                            # the tape off for good: one open breath
fade = 1 - ss(T['back'] - 0.3, T['logo'], tt)
noseL = near * (1 - block) * (1 - 0.7 * mouthB) * (1 - lastB) * fade
nz = m.noise(n)
nose = bp(nz, 900, 4200) * (0.75 + 0.25 * inh) + 0.35 * hp(nz, 4500) * inh
m.add('X', nose * amt * noseL * 0.016, 0, 0.05)
mouthL = np.clip(mouthB + lastB, 0, 1) * near * fade
mz = m.noise(n); mouth_ = lp(bp(mz, 220, 2400), 1800) * (0.8 + 0.2 * inh)
m.add('X', mouth_ * amt * mouthL * 0.03, 0, 0.0)

# ---------------------------------------------------------------- the tape: a crinkle on "on purpose"; peeled, put back, peeled for good
def crackle(t0, dur, gain, pan=0.2, dens=90, hi=1700):
    t3 = m.t(t0, t0 + dur); k3 = (t3 - t0) / dur
    c = hp(m.noise(len(t3)), hi) * (np.abs(lp(m.noise(len(t3)), dens) * 7).clip(0, 1) ** 2) * np.sin(np.pi * np.clip(k3, 0, 1)) ** 0.5
    m.add('X', c * gain, t0, pan)
crackle(T['purpose'] - 0.05, 0.35, 0.012, 0.1, 60)
crackle(39.95, 1.45, 0.045, 0.25); m.snip(41.4, 0.025, 0.25); m.swish(41.45, 0.5, 0.012, 0.3, 2400)
m.swish(44.75, 0.4, 0.012, 0.3, 2200); crackle(45.13, 0.55, 0.025, 0.25, 60, 1400)
m.thud(45.66, 180, 0.012, 0.25, 0.03)                                             # pressed down
crackle(T['dont'] + 0.05, 0.86, 0.045, 0.25); m.snip(63.28, 0.025, 0.25); m.swish(63.32, 0.45, 0.012, 0.3, 2400)

# ---------------------------------------------------------------- the polls: each dot that lights, a small tick; the year and the share
for p, nlit in enumerate([12, 5, 7]):
    for k in range(nlit): m.tick(T['polls'] + p * 0.4 + k * 0.03 + 0.15, 0.007, -0.25 + 0.12 * p, hi=3800 + 120 * p, lo=1900)
    m.pluck(T['five'] + p * 0.25, [76, 79, 81][p], 0.008, -0.25 + 0.12 * p, 0.35, bright=3000)

# ---------------------------------------------------------------- the box: three promises, three bright little chimes (a sales jingle that never finishes)
for at, nn in [(T['better'], 84), (T['less'], 88), (T['even'], 91)]: m.pluck(at + 0.02, nn, 0.012, 0.3, 0.5, bright=5200)

# ---------------------------------------------------------------- the review: ten cards; two glow; MILD stamped twice; no comparison; the verdict
for k in range(10):
    at = T['ten'] - 0.2 + k * 0.06 + 0.1; nb = int(0.09 * SR)
    m.add('X', bp(m.noise(nb), 1400, 6500) * env(nb, 0.004, 0.04) * 0.012, at, -0.2 + 0.08 * (k % 5))
m.shimmer(T['showed'] - 0.05, (84, 88, 91), 0.008, 0.2, 0.7, 2.0)
m.tone_line(T['showed'], T['main'] + 1.0, 62, gain=0.006, pan=-0.2, glide=lambda t: -2 * ss(T['showed'], T['main'] + 0.6, t))   # the rest go dim
for i, at in enumerate([T['mild'] - 0.05, T['mild'] + 0.14]):
    m.thud(at, 150, 0.03, -0.1 + 0.3 * i, 0.05); m.tick(at + 0.005, 0.012, -0.1 + 0.3 * i, hi=1500, lo=500)
m.tock(T['neither'] + 0.05, 0.03, 0.0, f=300)
m.thud(T['data'] - 0.1, 110, 0.04, 0.0, 0.08); m.tick(T['data'] - 0.095, 0.02, 0.0, hi=1300, lo=420)

# ---------------------------------------------------------------- the airway: the plug lands; both doors shut; the air stops
m.whoosh(36.6, 0.9, 300, 1800, 0.012, 0.1)
m.thud(T['blocked'] + 0.15, 95, 0.03, 0.15, 0.06); m.add('X', lp(m.noise(int(0.12 * SR)), 500) * env(int(0.12 * SR), 0.004, 0.05) * 0.02, T['blocked'] + 0.15, 0.15)
m.drone(T['shut2'] - 0.2, 51.3, 38, 0.02, 300)
m.tone_line(T['shut2'], T['breathe'] + 0.9, 69, gain=0.006, pan=0.0, glide=lambda t: -1.5 * ss(T['shut2'], T['breathe'] + 0.6, t))

# ---------------------------------------------------------------- before and after: two frames stand up, clack, clack
for i in range(2):
    at = T['jawline'] + 0.05 + i * 0.22
    m.swish(at - 0.55, 0.5, 0.01, 0.25 + 0.1 * i, 1500); m.tock(at, 0.03, 0.25 + 0.1 * i, f=760 + 60 * i)

# ---------------------------------------------------------------- the end: the roll, the logo
m.whoosh(T['back'] - 0.6, 0.9, 200, 1300, 0.018, 0.2)
m.whoosh(T['settings'] - 0.2, T['logo'] - T['settings'] + 0.2, 220, 2600, 0.04, 0.0)
m.logo_end(T['logo'] - 0.15, T['logo'])

# ---------------------------------------------------------------- the score: pads by section, a soft count under the review
m.pad([38, 50, 57, 62], 0.0, 5.4, 0.5, 900)                          # taped shut, on purpose
m.pad([41, 53, 57, 60], 5.4, 16.4, 0.5, 1100)                        # the polls; the promise
m.pad([43, 55, 58, 62], 16.4, 36.6, 0.5, 1000)                       # the review; the verdict
m.pad([40, 52, 55, 59], 36.6, 51.2, 0.5, 900)                        # the airway
m.pad([45, 57, 60, 64], 51.2, 55.2, 0.5, 1300)                       # jawline?
m.pad([38, 50, 53, 57], 55.2, 65.0, 0.5, 850)                        # see a doctor
m.pad([41, 53, 60, 65, 69, 72], 65.0, T['end'], 1.0, 2400, rel=0.2)
m.pulse(17.6, 31.2, 88, [67, 70, 74, 70], 0.009, 1300, lvl=lambda t: float(ss(17.6, 18.4, t)) * (1 - float(ss(30.4, 31.2, t))))
m.room(0.005)
m.finish(REPORT, VOICE, OUT, 'film12')

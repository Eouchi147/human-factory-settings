"""Film 11 "What does creatine do?": score and sound design, timed to films/film11.js (the same curl, balance, comb and scan).
Usage: python3 sound_film11.py <voice guide wav> <voice report json> <out dir>"""
import sys
import numpy as np
from sfx import Mix, SR, ss, env, bp, lp, hp, note

VOICE, REPORT, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
T = dict(end=79.5, creatine=0.35, not_=1.77, steroid=2.49, makes=3.70, gram=4.70, about=6.42, ninety=7.11, where=9.42,
         refuels=10.00, short=10.90, supplements=13.13, top=14.01, twenty=15.28, percent=16.20, trials=18.12, added=19.73,
         kilo=21.33, alone=24.09, take=25.60, zero=27.49, three=29.25, kilos=29.57, doesnt=31.11, first=34.26, up=35.89,
         two=36.56, mostly=37.59, water=38.22, memory=40.06, small=40.61, gain=40.83, no=42.49, proof=43.08, dementia=44.56,
         hair=46.40, never=50.28, trial=53.48, gummies=56.35, lab=58.42, creatinine=64.69, blood=65.51, kidney=69.04,
         back=75.38, settings=76.54, logo=77.24)
m = Mix(T['end'], seed=20261011)
rng = np.random.default_rng(1111)
def s5(a, b, x):
    u = np.clip((np.asarray(x, dtype=float) - a) / (b - a), 0, 1); return u * u * u * (u * (u * 6 - 15) + 10)

# ---------------------------------------------------------------- creatine: the molecule rises out of the scoop; a steroid's rings
m.rustle(T['creatine'] - 0.3, T['creatine'] + 0.6, 0.012, 0.25)
m.shimmer(T['creatine'] + 0.1, (84, 88, 91), 0.012, 0.2, 0.6, 2.2)
m.tick(T['steroid'] - 0.1, 0.018, 0.4, hi=2400, lo=900)
# the kitchen scale: a gram registers
m.beep(T['gram'] + 0.05, 2093.0, 0.06, 0.035, 0.3)

# ---------------------------------------------------------------- the muscles appear, lit from inside: a faint glitter while they show
m.whoosh(T['about'] - 0.4, 1.2, 250, 1600, 0.018, 0.0)
tt = m.t(6.3, 39.6); n = len(tt)
glit = hp(m.noise(n), 6000) * (np.abs(lp(m.noise(n), 6) * 8).clip(0, 1) ** 3) * ss(6.3, 7.4, tt) * (1 - ss(38.8, 39.6, tt))
m.add('X', glit * 0.006, 6.3, 0.0)
# one short, hard curl: the effort, the store spent and refilled
CURL0 = 10.0
m.swish(CURL0 - 0.05, 0.6, 0.03, 0.15, 700); m.thud(CURL0 + 0.55, 70, 0.025, 0.15, 0.08); m.swish(CURL0 + 0.67, 0.75, 0.02, 0.15, 600)
m.tone_line(CURL0 + 0.1, CURL0 + 1.4, 72, gain=0.008, pan=0.15, glide=lambda t: -5 * ss(CURL0 + 0.1, CURL0 + 1.1, t))
m.tone_line(CURL0 + 1.4, CURL0 + 3.1, 67, gain=0.007, pan=0.15, glide=lambda t: 5 * ss(CURL0 + 1.4, CURL0 + 3.0, t))
# supplements: the gauge rises 20 to 40%
m.tone_line(T['top'], T['percent'] + 0.8, 64, gain=0.01, pan=-0.3, glide=lambda t: 4 * ss(T['top'], T['percent'] + 0.4, t))
m.pluck(T['twenty'] + 0.05, 76, 0.012, -0.3, 0.4); m.pluck(T['percent'] - 0.3, 79, 0.012, -0.3, 0.4)

# ---------------------------------------------------------------- the balance: 1.1 kg of lean mass; then 30 g
m.thud(T['added'] + 0.35, 95, 0.04, 0.3, 0.1); m.clink(T['added'] + 0.4, 0.02, 0.3, f=1800)
tt2 = m.t(T['added'] + 0.4, T['added'] + 1.6); creak = bp(m.noise(len(tt2)), 900, 2600) * (0.5 + 0.5 * np.sin(2 * np.pi * 23 * tt2)) * np.sin(np.pi * np.clip((tt2 - tt2[0]) / 1.2, 0, 1)) ** 2
m.add('X', creak * 0.006, T['added'] + 0.4, 0.3)
m.tick(T['three'] + 0.15, 0.02, 0.3, hi=3200, lo=1400)                                     # 30 g lands; the beam hardly moves

# ---------------------------------------------------------------- the scale: +1, +2; mostly water
m.beep(T['up'] + 0.05, 1760.0, 0.05, 0.03, -0.1); m.beep(36.38, 1760.0, 0.05, 0.03, -0.1)
for k in range(9): m.pluck(T['mostly'] + k * 0.12 + rng.uniform(0, 0.04), int(rng.integers(74, 86)), 0.006, rng.uniform(-0.3, 0.3), 0.15, bright=2600)   # water: soft drips

# ---------------------------------------------------------------- memory: a little light; dementia: nothing
m.tone_line(T['small'] - 0.1, T['no'] + 0.4, 74, gain=0.008, pan=0.0, glide=lambda t: 1.5 * ss(T['small'], T['gain'] + 0.4, t))
m.tone_line(T['no'], T['dementia'] + 1.0, 74, gain=0.006, pan=0.0, glide=lambda t: 1.5 - 4 * ss(T['no'], T['dementia'] + 0.6, t))

# ---------------------------------------------------------------- the hair-loss scare: the skeleton combs its bald skull (dry, scratchy)
m.swish(47.15, 1.1, 0.03, -0.3, 900)
for st in [48.6, 49.35, 50.1, 50.85, 51.6]:
    tt3 = m.t(st, st + 0.52); u = (tt3 - st) / 0.52
    teeth = (np.sin(2 * np.pi * np.cumsum(np.full(len(tt3), 260.0)) / SR) > 0.93).astype(float)
    scr = bp(m.noise(len(tt3)), 2200, 7000) * (0.4 + 0.6 * teeth) * np.sin(np.pi * np.clip(u, 0, 1)) ** 0.7
    m.add('X', scr * 0.03, st, -0.25)
m.swish(52.4, 1.0, 0.025, -0.3, 800); m.tick(53.35, 0.02, -0.3, hi=1800, lo=500)

# ---------------------------------------------------------------- gummies: a rattle; the scan: a bright tick where there is creatine, a dull tock where there isn't
for k in range(6): m.tick(T['gummies'] + 0.1 + k * 0.07 + rng.uniform(0, 0.03), 0.012, -0.5, hi=2600 + 300 * rng.random(), lo=900)
SCAN0, SCAN_D = 58.22, 1.75
m.scan(SCAN0, SCAN_D, 0.012, -0.4)
FAIL = [[1, 3, 4, 6, 8], [0, 2, 5, 7, 9]]
for row, nj in enumerate([9, 12]):
    for i in range(nj):
        at = SCAN0 + SCAN_D * (i + 0.5) / nj + 0.02
        if i in FAIL[row]: m.tock(at, 0.022, -0.45, f=260)
        else: m.tick(at, 0.012, -0.45, hi=3600, lo=1800)

# ---------------------------------------------------------------- the blood tube; the kidneys (plain)
m.clink(T['creatinine'] - 0.2, 0.02, 0.35, f=3200)
m.drone(T['kidney'] - 0.4, 74.6, 41, 0.025, 380)

# ---------------------------------------------------------------- the end: the dial rises, turns to 1 g; the logo
m.whoosh(T['back'] - 0.7, 0.9, 200, 1300, 0.02, 0.3); m.thud(T['back'] + 0.25, 110, 0.03, 0.3, 0.07)
for k in range(1, 6): m.tick(T['back'] + (T['settings'] - T['back']) * float(s5(0, 1, k / 5)) * 0.98, 0.02, 0.3, hi=3300, lo=1500)
m.whoosh(T['settings'] - 0.2, T['logo'] - T['settings'] + 0.2, 220, 2600, 0.04, 0.0)
m.logo_end(T['logo'] - 0.15, T['logo'])

# ---------------------------------------------------------------- the score
m.pad([43, 55, 59, 62], 0.0, 6.2, 0.5, 1100)                         # creatine; not a steroid; a gram a day
m.pad([45, 57, 60, 64], 6.2, 17.2, 0.5, 1200)                        # the muscles; a hard effort; topped up
m.pad([41, 53, 57, 60], 17.2, 33.4, 0.5, 1000)                       # the balance: a kilo; 30 g
m.pad([43, 55, 58, 62], 33.4, 45.8, 0.5, 1000)                       # water; memory; no proof
m.pad([45, 57, 60, 64], 45.8, 63.4, 0.5, 1150)                       # the comb; the gummies
m.pad([38, 50, 57, 62], 63.4, 75.0, 0.5, 900)                        # tell your doctor
m.pad([43, 55, 62, 67, 71, 74], 75.0, T['end'], 1.0, 2400, rel=0.2)
m.pulse(13.0, 24.4, 96, [67, 71, 74, 71], 0.011, 1400, lvl=lambda t: float(ss(13.0, 13.8, t)) * (1 - float(ss(23.6, 24.4, t))))
m.room(0.005)
m.finish(REPORT, VOICE, OUT, 'film11')

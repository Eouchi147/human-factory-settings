"""Film 4 "Crunches won't touch your belly fat": score and sound design, timed to films/film04.js.
The crunches, the presses and the dials' clicks come from the same timing tables the picture uses.
Usage: python3 sound_film04.py <voice guide wav> <voice report json> <out dir>"""
import sys
import numpy as np
from sfx import Mix, SR, ss, env, bp, lp

VOICE, REPORT, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
T = dict(end=72.0, q0=0.35, crunches=1.04, bellyfat=1.96, strong=2.96, abs=4.05, under=4.86, same=5.71, muscle=7.39, burn=8.67,
         top=9.76, trial=11.35, sixweek=12.10, alone=14.36, shrink=15.16, waist=15.74, bfat=16.65, across=18.29, thirteen=19.11,
         eleven=20.49, training=22.05, part=22.79, spot=25.64, another=27.09, onearm=29.14, twelve=30.08, scans=31.43, nodiff=32.57,
         twoarms=33.89, myth=35.19, mythw=36.81, excellent=37.15, marketing=37.66, what=39.72, strength=41.30, s58=42.99,
         fiftyeight=43.62, cut=44.78, deep=46.91, organs=48.23, lose=49.80, anywhere=50.97, eat=51.36, less=52.84, use=53.73,
         burns=54.82, stored=56.27, picks=57.32, where=58.14, dont=58.37, lift=59.71, twice=60.54, move=61.76, hundred=63.05,
         minutes=63.84, eatless=65.11, little=66.09, final=67.89, settings=69.05, logo=69.75)
m = Mix(T['end'], seed=20261004)
s5 = lambda a, b, x: float(np.clip((x - a) / (b - a), 0, 1)) ** 3 * (float(np.clip((x - a) / (b - a), 0, 1)) * (float(np.clip((x - a) / (b - a), 0, 1)) * 6 - 15) + 10)

# ---------------------------------------------------------------- the crunches, exactly as the picture does them
RATE = [(0, 0.62), (12.6, 0.62), (13.6, 2.2), (15.6, 2.2), (16.6, 0.62), (17.2, 0.62), (17.9, 0)]
def rate(t):
    i = 0
    while i < len(RATE) - 2 and RATE[i + 1][0] <= t: i += 1
    (a, x), (b, y) = RATE[i], RATE[i + 1]
    return x + (y - x) * s5(a, b, t)
dt = 0.001; ts = np.arange(0, T['end'], dt); reps = np.empty_like(ts); s = 0.22
for i, t in enumerate(ts): reps[i] = s; s += rate(t) * dt
def crossings(arr, frac):   # times where the fractional part of arr passes frac (going up)
    out = []
    for i in range(1, len(arr)):
        a, b = arr[i - 1] - frac, arr[i] - frac
        if np.floor(b) > np.floor(a): out.append(ts[i])
    return out
lifts, lands = crossings(reps, 0.0), crossings(reps, 0.86)
for at in lifts:
    fast = 13.4 < at < 15.8
    m.swish(at + 0.02, 0.32 if not fast else 0.2, 0.026 if not fast else 0.016, -0.1, 900)   # the shoulders come up off the mat
for at in lands:
    fast = 13.4 < at < 15.8
    m.thud(at + 0.04, 70, 0.05 if not fast else 0.03, -0.1, 0.12)                              # and back down
# ---------------------------------------------------------------- the tape: wraps on with a zip, a click; six weeks of ticks; comes off
m.whoosh(T['trial'], 1.1, 900, 5200, 0.05, 0.15)
m.add('X', bp(m.noise(int(1.1 * SR)), 2500, 7000) * env(int(1.1 * SR), 0.08, 0.3) * 0.02, T['trial'], 0.15)
m.tick(T['trial'] + 1.12, 0.09, 0.15, hi=3600, lo=1500)
i0 = int(T['sixweek'] / dt); D = reps[int(16.4 / dt)] - reps[i0]
weeks = [ts[i0 + int(np.argmax(reps[i0:] - reps[i0] >= k * D / 5))] for k in range(1, 6)]
for k, at in enumerate(weeks): m.tick(at, 0.06 + 0.01 * k, 0.3, hi=2600, lo=1100)
m.tock(T['shrink'] + 0.05, 0.08, -0.15, f=430)                       # no change
m.tock(T['bfat'] + 0.05, 0.08, 0.15, f=430)                          # still none
m.whoosh(17.1, 0.8, 4800, 900, 0.04, 0.15, up=False)                 # the tape unwinds
# ---------------------------------------------------------------- thirteen studies, 1,158 people; the target locks on, finds nothing
for k in range(13): m.pluck(T['thirteen'] + 0.08 * k + 0.02, [74, 77, 79, 81][k % 4], 0.03, -0.45 + 0.07 * k, 0.4)
m.rain(T['eleven'] - 0.05, T['eleven'] + 1.2, 60, 0.02, pitch=(88, 100), seed=1158)
def lock(at, pan=0.0):
    m.beep(at, 1568.0, 0.05, 0.07, pan); m.beep(at + 0.09, 2093.0, 0.07, 0.08, pan)
def fail(at, pan=0.0):
    for k in range(3): m.beep(at + k * 0.125, 523.0 - 40 * k, 0.06, 0.06, pan)
lock(T['training'] + 0.25); fail(24.3)
lock(T['picks'] + 0.3, 0.1); fail(T['dont'] - 0.05, 0.1)
# ---------------------------------------------------------------- one arm, twelve weeks: the weight appears in the hand, the presses
m.shimmer(27.2, notes=(84, 91, 96), gain=0.025, pan=0.35, decay=0.4, dur=0.8)
m.thud(27.4, 90, 0.08, 0.35, 0.15)
RL = [(27.95, 0.9), (28.6, 0.9), (29.4, 2.6), (30.0, 2.6), (30.55, 1.2)]
def rateL(t):
    i = 0
    while i < len(RL) - 2 and RL[i + 1][0] <= t: i += 1
    (a, x), (b, y) = RL[i], RL[i + 1]
    return x + (y - x) * s5(a, b, t)
pl, sp = [], 0.0
for t in np.arange(27.95, 30.55, dt): pl.append(sp); sp += rateL(t) * dt
pl = np.array(pl); tl = np.arange(27.95, 30.55, dt)[:len(pl)]; total = np.floor(pl[-1])
for i in range(1, len(pl)):
    if pl[i] <= total and np.floor(pl[i] - 0.45) > np.floor(pl[i - 1] - 0.45):
        m.swish(tl[i] - 0.2, 0.25, 0.02, 0.35, 1100); m.clink(tl[i] + 0.02, 0.03, 0.35, 3200)
m.thud(31.3, 80, 0.07, 0.35, 0.18)                                    # put down
for k in range(3):                                                    # the second round, both arms
    at = 41.3 + (k + 0.45) / 0.62
    m.swish(at - 0.25, 0.3, 0.022, 0.0, 1100); m.clink(at + 0.02, 0.035, -0.25, 3000); m.clink(at + 0.03, 0.035, 0.25, 3300)
m.shimmer(40.6, notes=(84, 91, 96), gain=0.022, pan=0.0, decay=0.4, dur=0.8); m.thud(40.8, 90, 0.08, 0.0, 0.15)
m.thud(46.95, 80, 0.07, 0.0, 0.18)
# ---------------------------------------------------------------- the scans: a ring runs down each arm; two identical pictures, two identical notes
m.scan(T['scans'] - 0.05, 1.05, 0.045, 0.0)
m.bell(T['nodiff'] + 0.02, 79, 0.045, -0.35, 1.0); m.bell(T['nodiff'] + 0.2, 79, 0.045, 0.35, 1.0)
# ---------------------------------------------------------------- the box: a shop light clunks on over it, hums, clunks off
on, off = T['myth'] + 0.05, 39.4
m.thud(on, 140, 0.08, -0.3, 0.06); m.tick(on, 0.12, -0.3, hi=4200, lo=900)
tt = m.t(on, off + 1.0)
hum = (np.sin(2 * np.pi * 120 * tt) + 0.45 * np.sin(2 * np.pi * 240 * tt) + 0.2 * np.sign(np.sin(2 * np.pi * 120 * tt))) * ss(on, on + 0.08, tt) * (1 - ss(off, off + 1.0, tt))
flick = np.where((tt < on + 0.45) & (np.sin(tt * 170) > 0.4), 0.25, 1.0)
m.add('X', lp(hum * flick, 1600) * 0.018, on, -0.3)
m.tick(off, 0.09, -0.3, hi=3800, lo=800)
# ---------------------------------------------------------------- fifty-eight studies; fat cut, the deep fat too
m.rain(T['fiftyeight'] - 0.1, T['fiftyeight'] + 1.3, 58, 0.025, pitch=(84, 98), seed=58)
m.tone_line(T['cut'], T['cut'] + 1.9, 69, 0.035, 0.0, glide=lambda t: -5 * ss(T['cut'], T['cut'] + 1.8, t))
m.drone(T['deep'] - 0.2, T['organs'] + 1.4, 45, 0.035, 420)
m.tone_line(T['deep'] + 0.3, T['organs'] + 1.0, 62, 0.025, 0.1, glide=lambda t: -4 * ss(T['deep'] + 0.3, T['organs'] + 0.8, t))
# ---------------------------------------------------------------- eat a little less than you use: the bar shortens
m.pluck(T['eat'] + 0.05, 76, 0.035, -0.2, 0.6); m.pluck(T['less'] + 0.05, 74, 0.035, -0.2, 0.5); m.pluck(T['less'] + 0.3, 72, 0.03, -0.2, 0.6)
# ---------------------------------------------------------------- stored fat leaves and burns; the body picks where
m.shimmer(T['burns'] + 0.1, notes=(88, 93, 98), gain=0.03, pan=-0.2, decay=0.6, dur=2.6)
m.rain(T['burns'] + 0.3, T['picks'] + 1.2, 90, 0.016, pitch=(90, 104), seed=1100)
# ---------------------------------------------------------------- the dials rise and are set, with detents; the last becomes the logo
for i in range(3):
    m.whoosh(59.4 + i * 0.18, 0.8, 200, 1400, 0.03, -0.35 + 0.35 * i)
    m.thud(60.25 + i * 0.18, 110, 0.04, -0.35 + 0.35 * i, 0.08)
for i, (ts_, v) in enumerate([(T['twice'], 0.4), (T['hundred'] + 0.2, 0.5), (T['little'], 0.43)]):
    n = int(round(v * 16))
    for k in range(n): m.tick(ts_ - 0.1 + 0.6 * s5(0, 1, (k + 0.5) / n) , 0.045, -0.35 + 0.35 * i, hi=3000, lo=1300)
    m.tick(ts_ + 0.5, 0.07, -0.35 + 0.35 * i, hi=2200, lo=900)
for k in range(5): m.tick(T['final'] + 0.4 + k * 0.28, 0.04, 0.35, hi=2800, lo=1200)   # the last dial turns to twelve
# ---------------------------------------------------------------- the score
m.pad([38, 50, 57, 62], 0.0, 4.8, 0.6, 900)                        # crunches for belly fat?
m.pad([38, 50, 53, 57], 4.8, 11.3, 0.7, 800)                       # same fat
m.pulse(11.3, 18.0, 100, [50, 57, 53, 57], 0.03, 1100, lvl=lambda t: float(ss(11.3, 12.4, t)) * (1 - float(ss(17.0, 18.0, t))))
m.pad([38, 50, 55, 58], 11.3, 18.3, 0.65, 900)                     # six weeks
m.pad([41, 53, 57, 60], 18.3, 27.0, 0.75, 1200)                    # the studies
m.pad([36, 48, 55, 60], 27.0, 35.1, 0.75, 1100)                    # one arm
m.pad([41, 53, 56, 60], 35.1, 39.7, 0.7, 1000)                     # a myth, well marketed
m.pad([43, 55, 59, 62, 67], 39.7, 49.8, 0.9, 1900)                 # what works
m.pulse(41.2, 49.6, 92, [55, 59, 62, 59, 67, 62, 59, 62], 0.035, 1700, lvl=lambda t: float(ss(41.2, 42.4, t)) * (1 - float(ss(48.8, 49.6, t))))
m.pad([41, 53, 57, 60, 64], 49.8, 59.6, 0.8, 1500)                 # fat goes where it goes
m.pad([43, 55, 59, 62, 66], 59.6, 67.8, 0.95, 2100)                # the settings
m.pad([43, 55, 62, 66, 69, 71], 67.8, T['end'], 1.05, 2500, rel=0.2)
m.whoosh(T['final'] - 0.1, T['logo'] - T['final'], 220, 2600, 0.05, 0.0)
m.logo_end(T['logo'] - 0.15, T['logo'])
m.room()
m.finish(REPORT, VOICE, OUT, 'film04')
print('lifts', len(lifts), 'lands', len(lands), 'weeks', [round(x, 2) for x in weeks])

"""Film 4 "Can crunches burn belly fat?" (new direction, 3 Oct 2026): score and sound design, timed to films/film04.js.
The crunches, the presses, the week count and the dials' clicks come from the same timing tables the picture uses.
Usage: python3 sound_film04.py <voice guide wav> <voice report json> <out dir>"""
import sys
import numpy as np
from sfx import Mix, SR, ss, env, bp, lp

VOICE, REPORT, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
# word starts, as in films/film04.src.js ("not" and "or" renamed)
T = dict(end=63.3, logo=60.75,
         you=0.35, crunches=1.06, belly=1.93, and1=2.42, hate=3.13, but=4.53, just=5.0, strong=5.66, abs=6.17, under=6.66, same=7.15,
         muscle=9.17, burn=9.81, fat=10.16, top=10.98,
         when=12.19, trained=13.02, onearm=13.65, twelve=14.49, weeks=14.82, scans=15.05, showed=15.72, lost=16.67, nomore=17.14, lazy=18.22,
         burning=19.84, chosen=21.04, spot=21.44, myth=22.3, excellent=22.73, marketing=23.32,
         body=25.47, stored=26.43, fuel=26.68, and2=26.97, shrink=28.2, eat=29.01, little=29.94, less=30.09, use=30.88,
         it=31.98, decides=32.73, where=33.27, not_=34.32, you2=34.65,
         what=36.07, help=36.81, fullbody=37.17, strength=37.66, which=38.42, trims=38.98, deep=40.83, packed=41.7, organs=42.9,
         so=44.31, lift=44.85, twice=45.36, eat2=45.95, little2=46.49, do=47.12, hundred=47.98, minutes=49.11, walking=50.18, week2=51.55,
         thats=52.49, twenty=53.34, day=54.04, or_=54.13, episode=54.66, show=55.75, seen=56.8, twice2=57.01,
         final=58.49, factory=59.7, settings=60.07)
ARMT = dict(down0=11.3, down1=12.3, grabL=12.75, liftL=12.95, repsL0=13.5, repsL1=14.95, putL=15.5, remote0=12.2, remote1=35.9,
            grabR=36.5, lift2=36.7, reps20=37.3, reps21=41.8, put2=42.5)
m = Mix(T['end'], seed=20261006)
def s5(a, b, x):
    u = float(np.clip((x - a) / (b - a), 0, 1)); return u * u * u * (u * (u * 6 - 15) + 10)

dt = 0.001
def table(rates, t0, t1, s0=0.0):   # the integral of a piecewise smootherstep rate table, as the picture builds it
    def rate(t):
        i = 0
        while i < len(rates) - 2 and rates[i + 1][0] <= t: i += 1
        (a, x), (b, y) = rates[i], rates[i + 1]
        return x + (y - x) * s5(a, b, t)
    ts = np.arange(t0, t1, dt); arr = np.empty_like(ts); s = s0
    for i, t in enumerate(ts): arr[i] = s; s += rate(t) * dt
    return ts, arr
def crossings(ts, arr, frac, cap=None):   # times where the fractional part of arr passes frac (going up)
    out = []
    for i in range(1, len(arr)):
        if cap is not None and arr[i] > cap: break
        if np.floor(arr[i] - frac) > np.floor(arr[i - 1] - frac): out.append(float(ts[i]))
    return out

# ---------------------------------------------------------------- the crunches, exactly as the picture does them
ts, reps = table([(0, 0.62), (10.47, 0.62), (11.17, 0)], 0, T['end'], 0.22)
lifts, lands = crossings(ts, reps, 0.0), crossings(ts, reps, 0.86)
for at in lifts: m.swish(at + 0.02, 0.32, 0.026, -0.1, 900)            # the shoulders come up off the mat
for at in lands: m.thud(at + 0.04, 70, 0.045, -0.1, 0.12)              # and back down, the head on the hands
m.shimmer(T['strong'] + 0.4, notes=(84, 89, 96), gain=0.026, pan=0.0, decay=0.5, dur=1.4)   # the six-pack comes in under the gold
# ---------------------------------------------------------------- the arms come down to the mat; the remote appears in the right fist
m.swish(ARMT['down0'] + 0.1, 0.8, 0.03, 0.0, 700)
m.thud(ARMT['down1'] - 0.05, 85, 0.05, -0.25, 0.1); m.thud(ARMT['down1'] - 0.02, 85, 0.05, 0.25, 0.1)
m.tick(ARMT['remote0'] + 0.12, 0.08, -0.35, hi=3400, lo=1400); m.beep(ARMT['remote0'] + 0.16, 2637.0, 0.03, 0.025, -0.35)
# ---------------------------------------------------------------- one arm, twelve weeks: the weight appears in the left fist, the presses
m.shimmer(ARMT['liftL'] - 0.1, notes=(84, 91, 96), gain=0.025, pan=0.35, decay=0.4, dur=0.8)   # it appears in the closed fist
m.thud(ARMT['liftL'] + 0.05, 90, 0.06, 0.35, 0.15)
tl, pl = table([(13.5, 0.9), (13.9, 1.4), (14.2, 2.8), (14.65, 2.8), (14.95, 1.2)], ARMT['repsL0'], ARMT['repsL1'])
totalL = np.floor(pl[-1])
pressL = crossings(tl, pl, 0.45, cap=totalL)
for at in pressL: m.swish(at - 0.2, 0.25, 0.02, 0.35, 1100); m.clink(at + 0.02, 0.03, 0.35, 3200)
weeks = [ARMT['repsL0'] + (ARMT['repsL1'] - ARMT['repsL0']) * k / 12 for k in range(1, 12)]   # "Week 2" to "Week 12"
for k, at in enumerate(weeks): m.tick(at, 0.045 + 0.003 * k, 0.3, hi=2600, lo=1100)
m.thud(ARMT['putL'] - 0.05, 80, 0.07, 0.35, 0.18)                       # put down
# ---------------------------------------------------------------- the scans: a ring runs down each arm; two identical pictures, two identical notes
m.scan(T['scans'] - 0.1, 1.1, 0.045, 0.0)
m.bell(T['lost'] + 0.02, 79, 0.045, -0.35, 1.0); m.bell(T['lost'] + 0.2, 79, 0.045, 0.35, 1.0)
m.beep(T['lazy'] + 0.15, 1318.5, 0.05, 0.03, -0.35)                     # the remote's light blinks once on "the lazy one"
# ---------------------------------------------------------------- one chosen spot: the target locks on, nothing happens
def lock(at, pan=0.0):
    m.whoosh(at - 0.15, 0.5, 2400, 600, 0.025, pan, up=False); m.beep(at + 0.3, 1568.0, 0.05, 0.07, pan); m.beep(at + 0.39, 2093.0, 0.07, 0.08, pan)
def fail(at, pan=0.0):
    for k in range(3): m.beep(at + k * 0.125, 523.0 - 40 * k, 0.06, 0.06, pan)
lock(T['chosen'] - 0.15); fail(21.95)
# ---------------------------------------------------------------- the box on the floor: a shop light clunks on over it, hums, goes out
on, off = T['myth'] + 0.05, 24.95
m.thud(on, 140, 0.08, -0.3, 0.06); m.tick(on, 0.12, -0.3, hi=4200, lo=900)
tt = m.t(on, off + 0.8)
hum = (np.sin(2 * np.pi * 120 * tt) + 0.45 * np.sin(2 * np.pi * 240 * tt) + 0.2 * np.sign(np.sin(2 * np.pi * 120 * tt))) * ss(on, on + 0.08, tt) * (1 - ss(off, off + 0.7, tt))
flick = np.where((tt < on + 0.45) & (np.sin(tt * 170) > 0.4), 0.25, 1.0)
m.add('X', lp(hum * flick, 1600) * 0.018, on, -0.3)
m.tick(off, 0.09, -0.3, hi=3800, lo=800)
# ---------------------------------------------------------------- stored fuel: the motes leave the fat and burn; the bars, a little less in than out
m.shimmer(T['shrink'] + 0.1, notes=(88, 93, 98), gain=0.03, pan=-0.2, decay=0.6, dur=2.6)
m.rain(T['shrink'] + 0.1, T['use'] + 0.4, 90, 0.016, pitch=(90, 104), seed=1100)
m.pluck(T['eat'] + 0.05, 76, 0.035, -0.2, 0.6); m.pluck(T['less'] + 0.05, 74, 0.035, -0.2, 0.5); m.pluck(T['less'] + 0.3, 72, 0.03, -0.2, 0.6)
# ---------------------------------------------------------------- it decides where: the target again, nothing; the arms' fat goes first
lock(T['decides'] - 0.1, 0.1); fail(T['not_'] - 0.05, 0.1)
m.shimmer(T['decides'] + 0.3, notes=(86, 91, 95), gain=0.02, pan=0.3, decay=0.5, dur=1.2)
m.tick(ARMT['remote1'] - 0.2, 0.06, -0.35, hi=3000, lo=1200)            # the remote goes
# ---------------------------------------------------------------- full-body strength training: both arms press
m.shimmer(ARMT['lift2'] - 0.1, notes=(84, 91, 96), gain=0.022, pan=0.0, decay=0.4, dur=0.8); m.thud(ARMT['lift2'] + 0.05, 90, 0.07, 0.0, 0.15)
RATE2 = 3 / (ARMT['reps21'] - ARMT['reps20'])                           # three presses, the last one down as the arms go back
press2 = [ARMT['reps20'] + (k + 0.45) / RATE2 for k in range(3)]
for at in press2: m.swish(at - 0.25, 0.3, 0.022, 0.0, 1100); m.clink(at + 0.02, 0.035, -0.25, 3000); m.clink(at + 0.03, 0.035, 0.25, 3300)
m.thud(ARMT['put2'] - 0.05, 80, 0.07, 0.0, 0.18)
# ---------------------------------------------------------------- it trims the fat, then into the belly: the deep fat round the organs
m.tone_line(T['trims'], T['trims'] + 1.9, 69, 0.035, 0.0, glide=lambda t: -5 * ss(T['trims'], T['trims'] + 1.8, t))
m.whoosh(39.85, 1.2, 1800, 260, 0.045, 0.0, up=False)                 # the wall goes clear: in
m.drone(40.2, 43.6, 45, 0.035, 420)
m.tone_line(T['deep'] + 0.3, T['organs'] + 0.6, 62, 0.025, 0.1, glide=lambda t: -4 * ss(T['deep'] + 0.3, T['organs'] + 0.4, t))
m.whoosh(43.15, 1.0, 260, 1800, 0.04, 0.0)                              # and out
# ---------------------------------------------------------------- the dials rise and are set, with detents
for i in range(3):
    m.whoosh(43.9 + i * 0.18, 0.8, 200, 1400, 0.03, -0.35 + 0.35 * i)
    m.thud(44.8 + i * 0.18, 110, 0.04, -0.35 + 0.35 * i, 0.08)
for i, (ts_, v) in enumerate([(T['twice'], 0.4), (T['little2'], 0.43), (T['hundred'] + 0.2, 0.5)]):
    n = int(round(v * 16))
    for k in range(n): m.tick(ts_ - 0.1 + 0.6 * s5(0, 1, (k + 0.5) / n), 0.045, -0.35 + 0.35 * i, hi=3000, lo=1300)
    m.tick(ts_ + 0.5, 0.07, -0.35 + 0.35 * i, hi=2200, lo=900)
# ---------------------------------------------------------------- the TV rises beside the last dial and switches on: one episode, seen twice
m.whoosh(52.3, 0.9, 180, 1200, 0.03, 0.45); m.thud(53.05, 100, 0.05, 0.45, 0.1)
m.thud(T['or_'] - 0.05, 120, 0.06, 0.45, 0.08)
n = int(0.5 * SR); m.add('X', bp(m.noise(n), 1800, 7000) * env(n, 0.005, 0.35) * 0.02, T['or_'] - 0.04, 0.45)   # the screen's static as it comes on
m.pluck(T['seen'] + 0.05, 79, 0.03, 0.45, 0.5); m.pluck(T['twice2'] + 0.05, 83, 0.03, 0.45, 0.6)
m.whoosh(T['final'] - 0.2, 0.7, 1200, 180, 0.025, 0.45, up=False)      # and sinks away
# ---------------------------------------------------------------- the score
m.pad([38, 50, 57, 62], 0.0, 4.5, 0.6, 900)                           # crunches for belly fat?
m.pad([38, 50, 53, 57], 4.5, 12.1, 0.7, 800)                          # strong abs, same fat
m.pulse(0.3, 11.0, 100, [50, 57, 53, 57], 0.022, 1000, lvl=lambda t: float(ss(0.3, 1.4, t)) * (1 - float(ss(10.2, 11.0, t))))
m.pad([38, 50, 55, 58], 12.1, 19.8, 0.65, 900)                        # one arm, twelve weeks
m.pulse(13.4, 15.2, 132, [62, 65, 69, 65], 0.03, 1400, lvl=lambda t: float(ss(13.4, 13.7, t)) * (1 - float(ss(14.9, 15.2, t))))
m.pad([41, 53, 56, 60], 19.8, 25.4, 0.7, 1000)                        # a myth, well marketed
m.pad([41, 53, 57, 60], 25.4, 31.9, 0.75, 1200)                       # stored fuel
m.pad([38, 50, 53, 57], 31.9, 36.0, 0.7, 900)                         # it decides, not you
m.pad([43, 55, 59, 62, 67], 36.0, 44.2, 0.9, 1900)                    # what works
m.pulse(37.1, 41.9, 92, [55, 59, 62, 59, 67, 62, 59, 62], 0.035, 1700, lvl=lambda t: float(ss(37.1, 38.0, t)) * (1 - float(ss(41.2, 41.9, t))))
m.pad([41, 53, 57, 60, 64], 44.2, 52.4, 0.8, 1500)                    # the settings, dial by dial
m.pad([43, 55, 59, 62, 66], 52.4, 58.4, 0.95, 2100)                   # twenty minutes a day
m.pad([43, 55, 62, 66, 69, 71], 58.4, T['end'], 1.05, 2500, rel=0.2)
m.whoosh(T['final'] - 0.1, T['logo'] - T['final'], 220, 2600, 0.05, 0.0)
m.logo_end(T['logo'] - 0.15, T['logo'])
m.room()
m.finish(REPORT, VOICE, OUT, 'film04')
print('lifts', len(lifts), 'lands', len(lands), 'left presses', len(pressL), 'of', totalL, [round(x, 2) for x in pressL],
      'both', [round(x, 2) for x in press2], 'weeks', [round(x, 2) for x in weeks])

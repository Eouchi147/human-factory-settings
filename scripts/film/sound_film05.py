"""Film 5 "How much protein do you need?": score and sound design, timed to films/film05.js.
Every cube that lands, every dial click and the stop's two slams come from the same timing tables the picture uses
(timing05.json, exported from the page: window.HFS_W.timing).
Usage: python3 sound_film05.py <voice guide wav> <voice report json> <out dir>"""
import sys, json, os
import numpy as np
from sfx import Mix, SR, ss, env, bp, lp, hp, note

VOICE, REPORT, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
T = dict(end=70.4, q0=0.35, protein=1.20, need=2.01, less=2.73, aisle=4.07, hopes=4.49, europe=6.31, point=8.95, eight=9.35,
         every=10.66, kilo=11.25, weigh=11.85, day=12.50, someone=14.39, seventy=15.18, kilos=15.56, fiftyeight=16.89,
         american=19.94, higher=21.11, one2=21.51, two=22.68, one6=23.07, six=23.78, lift=26.33, help=28.27, alittle=29.08,
         in49=30.32, fortynine=30.95, three=33.04, lean=34.74, not_=36.17, body=37.24, label=37.82, above=39.44, one16=40.12,
         gains=42.33, stopped=43.00, spread=44.34, meals=45.55, tf=45.94, thirty=47.19, each=48.07, so=49.16, point8=50.31,
         training=51.56, one8=52.81, past=54.07, muscle=57.06, kidney=58.37, ask=60.00, doctor=60.82, notvideo=62.56,
         including=63.59, final=66.24, settings=67.40, logo=68.1)
TM = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'timing05.json')))
m = Mix(T['end'], seed=20261005)
def s5(a, b, x):
    u = float(np.clip((x - a) / (b - a), 0, 1)); return u * u * u * (u * (u * 6 - 15) + 10)
rng = np.random.default_rng(55)

# ---------------------------------------------------------------- the aisle: a shop light's hum while we are at the shelf
tt = m.t(0, 10.5)
hum = (np.sin(2 * np.pi * 120 * tt) + 0.45 * np.sin(2 * np.pi * 240 * tt) + 0.2 * np.sign(np.sin(2 * np.pi * 120 * tt))) * (0.35 + 0.65 * ss(0, 0.4, tt)) * (1 - ss(8.0, 10.5, tt))
m.add('X', lp(hum, 1500) * 0.012, 0.0, 0.35)
m.whoosh(2.9, 2.2, 1600, 380, 0.03, 0.2, up=False)                    # the pull back from the eggs
m.whoosh(5.4, 2.6, 900, 300, 0.02, -0.1, up=False)                    # and across to the skeleton

# ---------------------------------------------------------------- the bathroom scale: wakes with a beep, counts, locks with two, sleeps
m.beep(10.38, 2637.0, 0.06, 0.055, 0.15)
m.beep(15.5, 2093.0, 0.07, 0.06, 0.15); m.beep(15.833, 2093.0, 0.07, 0.06, 0.15)
m.beep(22.2, 1568.0, 0.05, 0.03, 0.15); m.beep(22.27, 1175.0, 0.06, 0.025, 0.15)
# the cubes: a soft powdery tick for each one that lands (58 with the count, then 26 and 28 more)
for i, at in enumerate(TM['land']):
    dense = i >= 58
    m.tick(at, (0.03 if dense else 0.042) * rng.uniform(0.75, 1.0), 0.28, hi=rng.uniform(1700, 2400), lo=rng.uniform(480, 640))
m.pluck(T['fiftyeight'] - 0.05, 72, 0.035, 0.25, 0.7)                 # the marks: 58, 84, 112
m.pluck(T['two'] + 0.15, 76, 0.03, 0.25, 0.6)
m.pluck(T['six'] + 0.25, 79, 0.03, 0.25, 0.6)

# ---------------------------------------------------------------- the curl: the weight appears in the hand; three reps
m.shimmer(25.55, notes=(84, 91, 96), gain=0.02, pan=0.3, decay=0.4, dur=0.8)
m.thud(25.75, 90, 0.06, 0.3, 0.14)
for r0 in (26.2, 28.4, 30.6):
    m.swish(r0 + 0.05, 0.85, 0.028, 0.35, 950)                         # up
    m.swish(r0 + 1.12, 1.0, 0.018, 0.35, 700)                          # and down, slower
m.pluck(T['alittle'] + 0.48, 88, 0.016, 0.3, 0.35)                     # "A little."
m.whoosh(32.95, 0.6, 2400, 900, 0.015, 0.35, up=False)                # the weight goes
# ---------------------------------------------------------------- forty-nine trials: points of light, one by one; they gather into a block
for i in range(49):
    at = 30.36 + i * 0.019 + 0.06; nn = 86 + 2 * (3 - i // 7) + (i % 7) * 0.5
    n = int(0.08 * SR); x = np.arange(n) / SR
    m.add('X', np.sin(2 * np.pi * note(nn) * x) * env(n, 0.001, 0.016) * 0.012, at, 0.1 + 0.05 * ((i % 7) - 3))
m.whoosh(31.45, 0.95, 2600, 500, 0.035, 0.15, up=False)
m.thud(32.2, 75, 0.06, 0.15, 0.16); m.shimmer(32.22, notes=(72, 79, 84), gain=0.015, pan=0.15, decay=0.5, dur=1.0)
m.thud(T['three'], 95, 0.09, 0.2, 0.1); m.tick(T['three'], 0.06, 0.2, hi=3200, lo=900)   # it lands on the kitchen scale
m.beep(T['three'] + 0.45, 3136.0, 0.08, 0.04, 0.2)                     # 300 g, and the scale beeps

# ---------------------------------------------------------------- past 1.6 g per kg: cubes land on the top and tumble off to the floor
m.whoosh(38.3, 1.6, 1800, 380, 0.03, 0.0, up=False)                    # down to the column
for k, t0 in enumerate(TM['over']):
    p = rng.uniform(0.0, 0.5)
    m.tick(t0 + 0.26, 0.04, p, hi=rng.uniform(2000, 2600), lo=600)       # on the top
    m.tick(t0 + 0.6, 0.05, p, hi=rng.uniform(1100, 1500), lo=rng.uniform(300, 420))   # on the floor
    m.tick(t0 + 0.66, 0.015, p, hi=1300, lo=350)
m.tock(T['stopped'] + 0.05, 0.09, 0.0, f=330)                          # the gains stopped

# ---------------------------------------------------------------- four bowls: every cube lands with a small ceramic click
for i, at in enumerate(TM['deal']):
    b = i % 4; pan = [-0.45, -0.3, -0.45, -0.3][b]
    m.clink(at, 0.012 * rng.uniform(0.7, 1.0), pan, rng.uniform(3300, 4300))
# ---------------------------------------------------------------- the dials: they rise; detents as they turn; the stop
def detents(t0, t1, v0, v1, pan, lo_tick=True):
    ts = np.linspace(t0, t1, 400); vs = np.array([v0 + (v1 - v0) * s5(t0, t1, x) for x in ts])
    for k in range(1, 21):
        thr = k / 20
        if not (min(v0, v1) < thr <= max(v0, v1) + 1e-9): continue
        j = int(np.argmax(vs >= thr - 1e-9)) if v1 > v0 else 0
        m.tick(ts[j], 0.045, pan, hi=3000, lo=1300)
    if lo_tick: m.tick(t1, 0.07, pan, hi=2200, lo=900)
for t0, pan in ((44.55, -0.35), (T['so'] - 0.55, 0.0), (T['so'] - 0.4, 0.35)):
    m.whoosh(t0 - 0.05, 0.8, 200, 1400, 0.03, pan); m.thud(t0 + 0.85, 110, 0.04, pan, 0.08)
detents(T['tf'] - 0.1, T['thirty'] + 0.3, 0, 0.55, -0.35)               # each meal: 25 to 30 g
detents(T['point8'] - 0.1, T['point8'] + 0.5, 0, 0.4, 0.0)             # every day: at least 0.8 g per kg
detents(T['one8'] - 0.25, T['one8'] + 0.45, 0, 0.8, 0.35)              # training: up to 1.6
m.clink(T['one8'] + 0.5, 0.03, 0.35, 2400)                              # the stop pin rises
for a, k in ((0.0, 1.0), (0.62, 0.6)):                                  # wound back and thrown at the stop, twice
    at = T['past'] + 0.1 + a
    m.swish(at, 0.3, 0.015 * k, 0.35, 1600)
    m.thud(at + 0.3, 170, 0.07 * k, 0.35, 0.05); m.clink(at + 0.3, 0.05 * k, 0.35, 1900); m.tick(at + 0.42, 0.03 * k, 0.35, hi=2600, lo=1000)

# ---------------------------------------------------------------- the kidneys: a low, warm swell
m.whoosh(57.4, 1.6, 400, 1800, 0.025, 0.0)
m.drone(58.0, 65.6, 45, 0.03, 380)
m.shimmer(58.3, notes=(69, 76, 81), gain=0.012, pan=-0.1, decay=1.2, dur=3.0)

# ---------------------------------------------------------------- the score
m.pad([41, 53, 57, 60], 0.0, 5.2, 0.6, 1000)                          # the aisle
m.pluck(T['hopes'] + 0.05, 77, 0.025, -0.2, 0.5); m.pluck(T['hopes'] + 0.3, 72, 0.02, -0.2, 0.6)
m.pad([38, 50, 57, 62], 5.2, 10.7, 0.7, 900)                          # Europe's experts
m.pad([41, 53, 57, 60], 10.7, 19.2, 0.65, 1000)                       # seventy kilos, fifty-eight grams
m.pulse(10.7, 18.8, 104, [53, 57, 60, 57], 0.026, 1100, lvl=lambda t: float(ss(10.7, 11.8, t)) * (1 - float(ss(17.8, 18.8, t))))
m.pad([43, 55, 58, 62], 19.2, 25.5, 0.7, 1100)                        # the American range
m.pad([36, 48, 55, 60], 25.5, 30.3, 0.75, 1200)                       # lift weights
m.pad([41, 53, 57, 64], 30.3, 36.1, 0.75, 1400)                       # forty-nine trials, 300 g
m.pad([38, 50, 53, 57], 36.1, 39.0, 0.7, 900)                         # the body on the label
m.pad([43, 55, 58, 62], 39.0, 44.3, 0.7, 1000)                        # the gains stopped
m.pad([41, 53, 60, 65], 44.3, 49.2, 0.8, 1600)                        # four bowls
m.pulse(44.4, 49.0, 96, [60, 65, 69, 65, 72, 69, 65, 69], 0.028, 1600, lvl=lambda t: float(ss(44.4, 45.4, t)) * (1 - float(ss(48.2, 49.0, t))))
m.pad([43, 55, 59, 62, 67], 49.2, 58.0, 0.9, 2000)                    # the settings
m.pad([38, 50, 57, 60], 58.0, 66.0, 0.7, 900)                         # kidneys
m.pad([41, 53, 60, 65, 69, 72], 66.0, T['end'], 1.0, 2400, rel=0.2)
detents(T['final'] + 0.2, T['logo'] - 0.3, 0.4, 0.5, 0.0, lo_tick=False)   # the first dial turns to twelve
m.whoosh(T['final'] - 0.1, T['logo'] - T['final'], 220, 2600, 0.05, 0.0)
m.logo_end(T['logo'] - 0.15, T['logo'])
m.room()
m.finish(REPORT, VOICE, OUT, 'film05')

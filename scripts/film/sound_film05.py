"""Film 5 "How much protein do you need?" (new direction, 6 Oct 2026): score and sound design, timed to films/film05.js.
Every sticker, every cube that lands, every rep, every dial click and the stop's two slams come from the timing tables
the picture uses (timing05.json, exported from the page: window.HFS_W.timing).
Usage: python3 sound_film05.py <voice guide wav> <voice report json> <out dir>"""
import sys, json, os
import numpy as np
from sfx import Mix, SR, ss, env, bp, lp, hp, note

VOICE, REPORT, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
# word starts, as in films/film05.src.js
T = dict(end=73.7, logo=71.16,
         youre=0.35, coffee=1.84, cereal=2.33, and1=2.99, pancakes=3.48, so=4.05, need=6.84,
         your=8.12, rebuilds=8.86, every=10.31, but=11.0, less=12.11, supplement=12.69, think=14.43,
         europe=15.54, point=17.99, eight=18.24, kilo=20.37, adult=23.35, seventy=25.04, kilos=25.49, fiftyeight=26.56,
         if2=28.78, lift=29.39, help=31.21, only=31.59, little=32.06, about2=32.42, three=33.0, hundred=33.34, lean=35.07, average=36.15,
         thats2=37.42, body2=38.53, label=39.02,
         and2=40.24, above=40.68, kilo2=42.53, gains=43.76, stopped=44.31,
         so2=45.54, point8=46.64, eight2=46.85, upto=48.42, one6=48.95, six2=49.64, and3=50.85, real=52.12, food=52.45,
         about3=52.98, tf=53.25, thirty=54.36, meal=55.95, past=56.76, muscle=60.26,
         if4=61.48, kidney=62.23, notvideo=65.06, thisone=67.3, final=68.9, settings=70.48)
HERE = os.path.dirname(os.path.abspath(__file__))
TM = json.load(open(os.path.join(HERE, 'timing05.json')))
REPS = TM['reps']; BLOCK_T0, THREE = TM['block']; KG0, KG1 = TM['kg']; SW0, SW1 = TM['sweep']
m = Mix(T['end'], seed=20261006)
def s5(a, b, x):
    u = float(np.clip((x - a) / (b - a), 0, 1)); return u * u * u * (u * (u * 6 - 15) + 10)
rng = np.random.default_rng(55)

def slap(at, gain=1.0, pan=0.0):   # a sticker slapped onto card: a dry smack and a little paper
    n = int(0.12 * SR); x = np.arange(n) / SR
    s = bp(m.noise(n), 900, 5200) * env(n, 0.0004, 0.018) + np.sin(2 * np.pi * 190 * x) * env(n, 0.001, 0.03) * 0.6
    m.add('X', s * 0.11 * gain, at, pan)
    m.tick(at + 0.012, 0.03 * gain, pan, hi=2600, lo=900)

# ---------------------------------------------------------------- the aisle: a shop light's hum while we are at the shelves
tt = m.t(0, 16.0)
hum = (np.sin(2 * np.pi * 120 * tt) + 0.45 * np.sin(2 * np.pi * 240 * tt) + 0.2 * np.sign(np.sin(2 * np.pi * 120 * tt))) * (0.35 + 0.65 * ss(0, 0.4, tt)) * (1 - ss(14.6, 16.0, tt)) * (1 - 0.5 * ss(7.0, 8.4, tt) * (1 - ss(10.8, 12.0, tt)))
m.add('X', lp(hum, 1500) * 0.011, 0.0, 0.35)
# the stickers: + PROTEIN on the coffee, the flakes, the pancake mix; then the eggs (NOW WITH PROTEIN!)
for at, pan, nn in zip(TM['packs'], (-0.2, 0.0, 0.2), (72, 76, 79)):
    slap(at + 0.06, 1.0, pan); m.pluck(at + 0.08, nn, 0.018, pan, 0.35)
slap(TM['eggs'], 1.35, 0.25)
m.pluck(TM['eggs'] + 0.04, 84, 0.026, 0.25, 0.4); m.pluck(TM['eggs'] + 0.2, 88, 0.022, 0.25, 0.5)
m.whoosh(3.55, 0.75, 500, 2200, 0.02, 0.2)                          # up to the eggs
m.whoosh(4.5, 2.6, 1600, 360, 0.028, 0.1, up=False)                 # back: the end-cap, the skeleton on its scale
# ---------------------------------------------------------------- the body rebuilds itself: a band of light runs down the arms' muscles
m.whoosh(8.25, 1.4, 1200, 400, 0.016, -0.1, up=False)               # in to the skeleton
m.whoosh(SW0, SW1 - SW0, 300, 2600, 0.03, 0.0)
m.shimmer(SW0 + 0.05, notes=(76, 83, 88), gain=0.012, pan=-0.25, decay=0.6, dur=1.4)
m.shimmer(SW1 - 0.1, notes=(72, 79, 84), gain=0.016, pan=0.2, decay=0.5, dur=1.2)
m.whoosh(11.0, 1.6, 600, 1800, 0.02, 0.25)                          # across to the tubs
m.whoosh(14.6, 2.0, 1800, 380, 0.028, 0.1, up=False)                # down to the scale

# ---------------------------------------------------------------- the bathroom scale: wakes with a beep, counts, locks with two, sleeps
m.beep(17.62, 2637.0, 0.06, 0.05, 0.15)
m.beep(25.35, 2093.0, 0.07, 0.055, 0.15); m.beep(25.683, 2093.0, 0.07, 0.055, 0.15)
m.beep(28.3, 1568.0, 0.05, 0.03, 0.15); m.beep(28.37, 1175.0, 0.06, 0.025, 0.15)
# the cubes: a soft powdery tick for each one that lands (58 with the count; later 54 more, poured)
for i, at in enumerate(TM['land']):
    dense = i >= 58
    m.tick(at, (0.028 if dense else 0.042) * rng.uniform(0.75, 1.0), 0.28, hi=rng.uniform(1700, 2400), lo=rng.uniform(480, 640))
m.pluck(T['fiftyeight'] - 0.05, 72, 0.035, 0.25, 0.7)               # the marks: 58, then 112
m.pluck(T['kilo2'], 79, 0.032, 0.25, 0.6)

# ---------------------------------------------------------------- the curl: the hand closes, the weight appears in it; three reps
m.whoosh(27.9, 1.4, 400, 2000, 0.024, 0.3)                          # up to the arm
m.swish(28.4, 0.7, 0.012, 0.35, 900)                                # the arm turns palm in
m.shimmer(29.12, notes=(84, 91, 96), gain=0.016, pan=0.3, decay=0.4, dur=0.8)
m.thud(29.3, 90, 0.05, 0.3, 0.14)
for r0 in REPS:
    m.swish(r0 + 0.05, 0.6, 0.026, 0.35, 950)                       # up
    m.swish(r0 + 0.76, 0.72, 0.017, 0.35, 700)                      # and down, slower
m.pluck(T['little'] + 0.25, 88, 0.016, 0.3, 0.35)                   # "only a little"
m.whoosh(31.6, 0.85, 1800, 700, 0.02, 0.2, up=False)                # across to the kitchen scale
# the 300 g block: it pops in over the scale, drops, lands; the scale counts and beeps
m.shimmer(BLOCK_T0, notes=(72, 79, 84), gain=0.015, pan=0.15, decay=0.5, dur=1.0)
m.thud(THREE, 95, 0.09, 0.2, 0.1); m.tick(THREE, 0.06, 0.2, hi=3200, lo=900)
m.beep(THREE + 0.47, 3136.0, 0.08, 0.04, 0.2)
m.whoosh(35.7, 1.6, 900, 400, 0.012, 0.25, up=False)                # beside the tub's arm
m.pluck(T['label'] + 0.35, 67, 0.02, 0.2, 0.6); m.pluck(T['label'] + 0.6, 64, 0.016, 0.2, 0.7)   # not quite the body on the label
m.whoosh(39.2, 1.4, 1800, 380, 0.028, 0.0, up=False)                # down to the column; the weight goes

# ---------------------------------------------------------------- past 1.6 g per kg: cubes land on the top and tumble off to the floor
for k, t0 in enumerate(TM['over']):
    p = rng.uniform(0.0, 0.5)
    m.tick(t0 + 0.26, 0.04, p, hi=rng.uniform(2000, 2600), lo=600)  # on the top
    m.tick(t0 + 0.6, 0.05, p, hi=rng.uniform(1100, 1500), lo=rng.uniform(300, 420))   # on the floor
    m.tick(t0 + 0.66, 0.015, p, hi=1300, lo=350)
m.tock(T['stopped'] + 0.05, 0.09, 0.0, f=330)                       # the gains stopped

# ---------------------------------------------------------------- the dials: they rise; detents as they turn; the stop
def detents(t0, t1, v0, v1, pan, lo_tick=True):
    ts = np.linspace(t0, t1, 400); vs = np.array([v0 + (v1 - v0) * s5(t0, t1, x) for x in ts])
    for k in range(1, 21):
        thr = k / 20
        if not (min(v0, v1) < thr <= max(v0, v1) + 1e-9): continue
        j = int(np.argmax(vs >= thr - 1e-9)) if v1 > v0 else 0
        m.tick(ts[j], 0.045, pan, hi=3000, lo=1300)
    if lo_tick: m.tick(t1, 0.07, pan, hi=2200, lo=900)
m.whoosh(44.6, 1.4, 1400, 400, 0.022, -0.1, up=False)               # out to the dials
for t0, pan in ((T['so2'] - 0.45, 0.0), (T['upto'] - 0.5, -0.35)):
    m.whoosh(t0 - 0.05, 0.8, 200, 1400, 0.03, pan); m.thud(t0 + 0.85, 110, 0.04, pan, 0.08)
detents(T['point8'] - 0.1, T['eight2'] + 0.45, 0, 0.4, 0.0)         # every day: at least 0.8 g per kg
m.whoosh(47.8, 0.95, 900, 500, 0.014, -0.25, up=False)              # across to the training dial
m.clink(T['upto'] + 0.1, 0.03, -0.35, 2400)                          # its stop pin rises
detents(T['one6'] - 0.2, T['six2'] + 0.3, 0, 0.8, -0.35)            # training: up to 1.6, against the stop
# ---------------------------------------------------------------- real food: the bowls rise, the food pops in, the grams go into it
m.whoosh(50.5, 1.0, 600, 1600, 0.018, -0.2)                         # up over the bowls
for b, at in enumerate(TM['bowls']):
    m.thud(at + 0.6, 140, 0.03, [-0.45, -0.3, -0.45, -0.3][b], 0.06)
for b, (at, nn) in enumerate(zip(TM['food'], (72, 76, 79, 84))):
    pan = [-0.45, -0.3, -0.45, -0.3][b]
    m.pluck(at + 0.05, nn, 0.03, pan, 0.45); m.tick(at + 0.05, 0.02, pan, hi=1800, lo=500)
for i, at in enumerate(TM['deal']):   # each cube sinks into the food: a soft, muffled pat
    b = i % 4; pan = [-0.45, -0.3, -0.45, -0.3][b]
    m.tick(at, 0.016 * rng.uniform(0.7, 1.0), pan, hi=rng.uniform(900, 1300), lo=rng.uniform(260, 380))
# past 1.6: wound back and thrown at the stop, twice
m.whoosh(56.1, 1.1, 1600, 500, 0.02, -0.2, up=False)
for a, k in ((0.0, 1.0), (0.62, 0.6)):
    at = T['past'] + 0.15 + a
    m.swish(at, 0.3, 0.015 * k, -0.35, 1600)
    m.thud(at + 0.3, 170, 0.07 * k, -0.35, 0.05); m.clink(at + 0.3, 0.05 * k, -0.35, 1900); m.tick(at + 0.42, 0.03 * k, -0.35, hi=2600, lo=1000)

# ---------------------------------------------------------------- the kidneys: a low, warm swell
m.whoosh(60.5, 1.6, 400, 1800, 0.025, 0.0)
m.drone(61.4, 68.6, 45, 0.03, 380)
m.shimmer(62.0, notes=(69, 76, 81), gain=0.012, pan=-0.1, decay=1.2, dur=3.0)

# ---------------------------------------------------------------- the score
m.pad([41, 53, 57, 60], 0.0, 7.4, 0.6, 1000)                        # the aisle
m.pad([38, 50, 57, 62], 7.4, 15.5, 0.65, 950)                       # the body rebuilds; the supplement aisle
m.pad([41, 53, 57, 60], 15.5, 24.3, 0.65, 1000)                     # point eight grams for every kilo
m.pulse(17.9, 25.4, 104, [53, 57, 60, 57], 0.024, 1100, lvl=lambda t: float(ss(17.9, 19.0, t)) * (1 - float(ss(24.6, 25.4, t))))
m.pad([43, 55, 58, 62], 24.3, 28.8, 0.7, 1100)                      # seventy kilos, fifty-eight grams
m.pad([36, 48, 55, 60], 28.8, 32.4, 0.75, 1200)                     # lift weights
m.pad([41, 53, 57, 64], 32.4, 37.4, 0.75, 1400)                     # 300 g
m.pad([38, 50, 53, 57], 37.4, 40.2, 0.7, 900)                       # the body on the label
m.pad([43, 55, 58, 62], 40.2, 45.5, 0.7, 1000)                      # above 1.6: the gains stopped
m.pad([43, 55, 59, 62, 67], 45.5, 50.8, 0.85, 1800)                 # the settings
m.pad([41, 53, 60, 65], 50.8, 56.7, 0.8, 1600)                      # real food, at each meal
m.pulse(52.9, 55.7, 96, [60, 65, 69, 65, 72, 69, 65, 69], 0.026, 1600, lvl=lambda t: float(ss(52.9, 53.5, t)) * (1 - float(ss(55.0, 55.7, t))))
m.pad([43, 55, 58, 62], 56.7, 61.4, 0.8, 1300)                      # past 1.6
m.pad([38, 50, 57, 60], 61.4, 68.9, 0.7, 900)                       # kidneys
m.pad([41, 53, 60, 65, 69, 72], 68.9, T['end'], 1.0, 2400, rel=0.2)
detents(T['final'] + 0.2, T['logo'] - 0.3, 0.4, 0.5, 0.0, lo_tick=False)   # the every-day dial turns to twelve
m.whoosh(T['final'] - 0.1, T['logo'] - T['final'], 220, 2600, 0.05, 0.0)
m.logo_end(T['logo'] - 0.15, T['logo'])
m.room()
m.finish(REPORT, VOICE, OUT, 'film05')

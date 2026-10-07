"""Film 7 "Is ultra-processed food bad for you?" (new direction, 6 Oct 2026): score and sound design, timed to films/film07.js.
Every pack that lands, the BLAMED stamp and its fall, the three drops into the pot, the jars and what they pour, the pawns,
the trays, the scale's count, the discs that come off, the board, the crate, the dials, the plinths, the medicine and the
plate come from the timing table the picture exports (timing07.json, window.HFS_W.timing).
Usage: python3 sound_film07.py <voice guide wav> <voice report json> <out dir>"""
import sys, json, os
import numpy as np
from sfx import Mix, SR, ss, env, bp, lp, hp, note

VOICE, REPORT, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
T = dict(end=79.42, logo=76.9, you=0.35, willpower=5.56, lets=6.78, grew=12.63, swam=12.98, walked=13.72, ultra=14.79,
         parts=17.74, additives=18.89, snacks=20.49, fizzy=21.17, drinks=21.54, twenty=24.13, two1=26.81, two2=29.82,
         five=36.32, gained=38.98, kilo=40.38, same3=43.38, lost=49.61, half=50.81, cook=55.16, exception=61.86,
         potato=63.4, potato2=64.82, hobby=66.59, medicine=68.55, better=70.78, final=74.64)
HERE = os.path.dirname(os.path.abspath(__file__))
TM = json.load(open(os.path.join(HERE, 'timing07.json')))
m = Mix(T['end'], seed=20261007)
rng = np.random.default_rng(77)
def s5(a, b, x):
    u = float(np.clip((x - a) / (b - a), 0, 1)); return u * u * u * (u * (u * 6 - 15) + 10)

def plop(at, gain=1.0, pan=0.0, f0=820, f1=260):   # something dropped into a stew: a falling bubble and a little splash
    n = int(0.16 * SR); x = np.arange(n) / SR
    f = f1 + (f0 - f1) * np.exp(-x / 0.025); ph = 2 * np.pi * np.cumsum(f) / SR
    s = np.sin(ph) * env(n, 0.001, 0.035) + bp(m.noise(n), 900, 4200) * env(n, 0.001, 0.02) * 0.5
    m.add('X', s * 0.05 * gain, at, pan)
def crinkle(at, dur=0.25, gain=1.0, pan=0.0):   # a foil or plastic pack: crisp ticks over a short hiss
    n = int(dur * SR); s = hp(m.noise(n), 2500) * env(n, 0.003, dur * 0.4) * 0.35
    k = rng.integers(0, n, 14); s[k] += rng.uniform(-1, 1, 14) * 0.9
    m.add('X', bp(s, 1800, 9000) * 0.06 * gain, at, pan)
def fizz(at, dur=0.9, gain=1.0, pan=0.0):   # a can: the tab's click, then the hiss of the gas
    m.tick(at, 0.06 * gain, pan, hi=4200, lo=1600)
    n = int(dur * SR); x = np.arange(n) / SR
    s = hp(m.noise(n), 3000) * np.exp(-x / (dur * 0.35)) * (0.6 + 0.4 * (rng.random(n) > 0.997))
    m.add('X', s * 0.045 * gain, at + 0.02, pan)
def detents(t0, t1, v0, v1, pan):
    ts = np.linspace(t0, t1, 400); vs = np.array([v0 + (v1 - v0) * s5(t0, t1, x) for x in ts])
    for k in range(1, 21):
        thr = k / 20
        if v1 > v0 and v0 < thr <= v1 + 1e-9: m.tick(ts[int(np.argmax(vs >= thr - 1e-9))], 0.042, pan, hi=3000, lo=1300)
        if v1 < v0 and v1 <= thr < v0: m.tick(ts[int(np.argmax(vs <= thr + 1e-9))], 0.035, pan, hi=3000, lo=1300)

# ---------------------------------------------------------------- the kitchen at night: a fridge hum, very low
tt = m.t(0, T['end'])
hum = (np.sin(2 * np.pi * 100 * tt) + 0.5 * np.sin(2 * np.pi * 200 * tt)) * (0.35 + 0.65 * ss(0, 0.6, tt)) * (1 - ss(T['final'], T['logo'], tt))
m.add('X', lp(hum, 900) * 0.004, 0.0, -0.3)

# ---------------------------------------------------------------- breakfast from a box, lunch from a wrapper, dinner from a bag
m.thud(TM['box'] + 0.06, 140, 0.05, -0.25, 0.06); m.tick(TM['box'] + 0.065, 0.03, -0.25, hi=1500, lo=500)
crinkle(TM['bar'] + 0.02, 0.22, 1.0, 0.0); m.tick(TM['bar'] + 0.06, 0.02, 0.0, hi=2600, lo=900)
m.thud(TM['bag'] + 0.06, 110, 0.05, 0.25, 0.07); m.rustle(TM['bag'] + 0.04, TM['bag'] + 0.4, 0.03, 0.25)
m.whoosh(4.45, 0.9, 400, 1800, 0.022, 0.0)                                       # up to the meter
m.thud(TM['stamp'], 95, 0.12, 0.0, 0.08); m.tock(TM['stamp'] + 0.004, 0.08, 0.0, f=240); m.tick(TM['stamp'] + 0.006, 0.05, 0.0, hi=1200, lo=300)   # BLAMED
m.whoosh(6.55, 1.0, 1800, 500, 0.02, 0.0, up=False)                              # back down to the food
m.swish(TM['sinkA'] + 0.05, 0.6, 0.014, 0.0, 700)

# ---------------------------------------------------------------- the pot: up through the counter; a carrot, a fish, a drumstick
m.whoosh(TM['pot'][0] - 0.05, 0.6, 200, 1000, 0.018, 0.1); m.thud(TM['pot'][0] + 0.42, 80, 0.06, 0.1, 0.1); m.clink(TM['pot'][0] + 0.43, 0.02, 0.1, 1800)
for i, t1 in enumerate(TM['drops']):
    m.swish(t1 - 0.3, 0.35, 0.012, [-0.1, 0.1, 0.0][i], 1600)
    plop(t1, [1.0, 1.15, 0.95][i], [-0.1, 0.1, 0.0][i], [900, 760, 680][i], [300, 240, 220][i])
for k in range(36):                                                              # it simmers
    at = TM['drops'][0] + 0.3 + k * 0.26 + rng.uniform(-0.08, 0.08)
    if at < TM['pot'][1] - 0.2: plop(at, 0.16 + 0.1 * rng.random(), rng.uniform(-0.2, 0.2), 1400 + 400 * rng.random(), 500)
m.swish(TM['pot'][1] + 0.05, 0.5, 0.012, 0.1, 600)

# ---------------------------------------------------------------- the factory: five jars, lids up, the parts pour into a packet and a can
for j in range(5):
    t0 = TM['jars'][0] + j * 0.08
    m.whoosh(t0 - 0.02, 0.5, 300, 1400, 0.008, -0.3 + j * 0.15); m.clink(t0 + 0.48, 0.022, -0.3 + j * 0.15, 2400 + 200 * j)
for j, t0 in enumerate(TM['parts']):
    pan = -0.3 + j * 0.15
    m.tick(t0 - 0.2, 0.025, pan, hi=3200, lo=1400)                               # the lid lifts
    n = int(0.9 * SR); x = np.arange(n) / SR                                      # the stream: a granular hiss that travels
    grain = bp(m.noise(n), 2500 + 600 * j, 9000) * np.exp(-((x - 0.4) ** 2) / 0.05) * (rng.random(n) > 0.6)
    m.add('X', grain * 0.03, t0, pan)
m.shimmer(TM['parts'][4] + 0.1, notes=(84, 91, 96), gain=0.012, pan=0.3, decay=0.4, dur=1.0)   # the additives, in colours
crinkle(TM['packet'] + 0.05, 0.3, 1.2, 0.0); m.thud(TM['packet'] + 0.08, 160, 0.03, 0.0, 0.05)
fizz(TM['can'] + 0.12, 0.9, 1.0, 0.25)
m.swish(TM['jars'][1] + 0.05, 0.5, 0.012, 0.2, 600)

# ---------------------------------------------------------------- the hospital study: twenty pawns, two trays, second helpings
for i in range(20):
    at = TM['pawns'] + i * 0.03 + 0.12; m.tick(at, 0.02 * rng.uniform(0.7, 1.0), -0.3 + (i % 5) * 0.15, hi=2200 + 60 * (i % 5), lo=900)
for i, t0 in enumerate(TM['trays']):
    m.thud(t0 + 0.2, 150, 0.04, [-0.15, 0.15][i], 0.05); m.tick(t0 + 0.205, 0.03, [-0.15, 0.15][i], hi=1800, lo=600)
for t0 in TM['more']:
    crinkle(t0 + 0.08, 0.22, 0.9, -0.15); m.tick(t0 + 0.1, 0.02, -0.15, hi=2400, lo=800)
m.pluck(T['five'] + 0.05, 74, 0.026, -0.15, 0.6)

# ---------------------------------------------------------------- the scale: down to it, it counts up 0.9 kg
m.whoosh(38.55, 1.0, 1600, 300, 0.024, -0.2, up=False)
m.beep(38.95, 2093.0, 0.05, 0.03, -0.2)
KG0, KG1 = TM['kg']
for k in range(1, 10):                                                          # 70.1 ... 70.9: one tick per 0.1 kg
    lo, hi = KG0, KG1
    for _ in range(30):
        mid = (lo + hi) / 2
        if 0.9 * s5(KG0, KG1, mid) < k * 0.1: lo = mid
        else: hi = mid
    m.tick(hi, 0.022, -0.2, hi=2600, lo=1200)
m.beep(KG1 + 0.05, 2637.0, 0.06, 0.03, -0.2); m.beep(KG1 + 0.17, 2637.0, 0.06, 0.03, -0.2)

# ---------------------------------------------------------------- same people, same willpower: the stamp comes off
m.whoosh(41.2, 1.25, 300, 1600, 0.02, 0.0); m.whoosh(42.45, 0.9, 600, 1800, 0.016, 0.0)
n = int(0.22 * SR); x = np.arange(n) / SR
rip = bp(m.noise(n), 1500, 7000) * env(n, 0.002, 0.05) * (1 + 0.8 * np.sin(2 * np.pi * 70 * x))
m.add('X', rip * 0.05, TM['peel'], 0.0); m.rustle(TM['peel'] + 0.1, TM['peel'] + 0.75, 0.02, 0.1)
m.pluck(TM['peel'] + 0.05, 79, 0.028, 0.0, 0.7); m.pluck(TM['peel'] + 0.3, 84, 0.02, 0.0, 0.8)

# ---------------------------------------------------------------- the newer trial: two stacks rise; discs come off (2, then 1)
for i in range(2):
    t0 = TM['stacks'] + i * 0.1; m.whoosh(t0 - 0.02, 0.5, 250, 1200, 0.014, [-0.2, 0.2][i]); m.clink(t0 + 0.48, 0.03, [-0.2, 0.2][i], 1400)
for i, t0 in enumerate(TM['off']):
    pan = [-0.2, -0.2, 0.2][i]; m.clink(t0 + 0.02, 0.04, pan, 2100 + 150 * i); m.whoosh(t0 + 0.04, 0.6, 600, 2400, 0.016, pan)
m.pluck(T['half'] + 0.1, 72, 0.028, 0.2, 0.7)

# ---------------------------------------------------------------- real food on a board; the packet, the can and the sausages into the crate
m.tock(54.95, 0.05, 0.0, f=300)
for i, t0 in enumerate(TM['board']):
    m.thud(t0 + 0.1, [120, 140, 160, 170, 180][i], 0.03, -0.1 + i * 0.05, 0.05); m.tick(t0 + 0.105, 0.012, -0.1 + i * 0.05, hi=1800, lo=500)
m.tock(TM['dials'][1] + 0.5, 0.05, 0.25, f=260)                                   # the crate
for i, t0 in enumerate(TM['slide']):
    m.swish(t0 - 0.05, 0.5, 0.016, 0.2, 900); m.thud(t0 + 0.5, [130, 150, 110][i], 0.05, 0.25, 0.06); m.tock(t0 + 0.505, 0.03, 0.25, f=320)
    if i == 0: crinkle(t0 + 0.5, 0.2, 0.7, 0.25)
    if i == 1: m.clink(t0 + 0.505, 0.02, 0.25, 2800)
m.tock(TM['crate'], 0.06, 0.25, f=220)
for i, (t0, ts, v1) in enumerate(zip(TM['dials'], TM['sets'], (0.85, 0.15))):
    pan = [-0.25, 0.3][i]
    m.whoosh(t0 - 0.05, 0.8, 200, 1200, 0.018, pan); m.thud(t0 + 0.78, 105, 0.03, pan, 0.08)
    detents(ts - 0.05, ts + 0.55, 0.5, v1, pan); m.tick(ts + 0.55, 0.05, pan, hi=2200, lo=900); m.clink(ts + 0.35, 0.02, pan, 2600)

# ---------------------------------------------------------------- FOOD and HOBBY
m.whoosh(TM['plinths'] - 0.05, 0.6, 200, 900, 0.016, 0.1); m.thud(TM['plinths'] + 0.5, 90, 0.04, 0.1, 0.1)
m.shimmer(TM['plinths'] + 0.35, notes=(76, 83, 88), gain=0.01, pan=0.1, decay=0.5, dur=1.2)   # the museum lights
m.thud(TM['museum'][0] + 0.18, 120, 0.04, 0.0, 0.06)                                         # a potato
crinkle(TM['museum'][1] + 0.18, 0.25, 0.9, 0.2)                                              # the crisps
n = int(0.4 * SR); x = np.arange(n) / SR; f = 300 + 160 * np.sin(2 * np.pi * 9 * x) * np.exp(-x / 0.15)
m.add('X', np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.005, 0.12) * 0.02, TM['hobby'], 0.2)   # a little wobble: hobby
m.swish(67.35, 0.5, 0.012, 0.1, 600)

# ---------------------------------------------------------------- medicine, and a plate of real food beside it (not instead)
for k in range(4): m.tick(TM['pills'] + 0.1 + k * 0.035, 0.018, -0.1, hi=3400, lo=1500)
n = int(0.6 * SR); m.add('X', bp(m.noise(n), 600, 3000) * env(n, 0.05, 0.25) * 0.012, TM['plate'], 0.15)
m.clink(TM['plate'] + 0.6, 0.02, 0.15, 3100)

# ---------------------------------------------------------------- the score
m.pad([38, 50, 57, 62], 0.0, 4.6, 0.6, 1000)                       # boxes, wrappers, bags
m.pad([41, 53, 57, 60], 4.6, 9.2, 0.65, 1000)                      # blame / look at the food
m.pluck(T['willpower'] + 0.2, 69, 0.022, 0.0, 0.7)
m.pad([43, 55, 58, 62, 67], 9.2, 14.7, 0.75, 1500)                 # meals from things that grew, swam, walked
m.pad([36, 48, 51, 55], 14.7, 22.6, 0.7, 1000)                     # factories
m.pad([41, 53, 57, 60, 65], 22.6, 34.2, 0.75, 1300)                # the study
m.pulse(24.2, 33.6, 104, [57, 60, 64, 60], 0.018, 1200, lvl=lambda t: float(ss(24.2, 25.0, t)) * (1 - float(ss(32.9, 33.6, t))))
m.pad([38, 50, 53, 57], 34.2, 41.4, 0.7, 1000)                     # they ate more, and gained
m.pad([43, 55, 58, 62], 41.4, 44.9, 0.7, 1200)                     # same people, same willpower
m.pad([41, 53, 60, 65], 44.9, 54.5, 0.7, 1300)                     # the newer trial
m.pad([41, 53, 57, 60, 65], 54.5, 62.9, 0.85, 1900)                # cook from food; the exception
m.pulse(54.8, 62.5, 96, [60, 65, 69, 65, 72, 69, 65, 69], 0.022, 1600, lvl=lambda t: float(ss(54.8, 55.6, t)) * (1 - float(ss(61.8, 62.5, t))))
m.pad([43, 55, 58, 62, 67], 62.9, 67.6, 0.7, 1500)                 # a potato is food
m.pluck(T['hobby'] + 0.25, 79, 0.024, 0.2, 0.6)
m.pad([38, 50, 57, 60], 67.6, 74.5, 0.7, 900)                      # medicine
m.pad([41, 53, 60, 65, 69, 72], 74.5, T['end'], 1.0, 2400, rel=0.2)
detents(T['final'] + 0.2, T['logo'] - 0.3, 0.15, 0.5, 0.0)          # the last dial turns back to twelve
m.whoosh(T['final'] - 0.1, T['logo'] - T['final'], 220, 2600, 0.05, 0.0)
m.logo_end(T['logo'] - 0.15, T['logo'])
m.room()
m.finish(REPORT, VOICE, OUT, 'film07')

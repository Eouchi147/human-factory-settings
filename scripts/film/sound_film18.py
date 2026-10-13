"""Film 18 "What do cold showers really do?" (new direction, 7 Oct 2026): score and sound design, timed to films/film18.js.
A warm shower; the mixer goes to cold and the skeleton screams, hugs itself and chatters (a click each time the teeth meet,
on the film's own chatter); the podcast on the shelf; one shower in six tiles, a month in thirty; four bars of days off
sick and days feeling ill; a thermometer on every day, then the meetings drop in; eleven little tubs and NO PROOF stamped
twice; two sections after training, one growing less; the fat landing on the scale, six weeks of days, two hours on the
clock, 17 degrees; the chatter again on the stool; the plunge: a gasp, breathing and a pulse that race and settle (on the
film's own phases); the checklist ticked line by line; the chiller's dial back to the middle; the logo.
Every time comes from the timing table the picture exports (timing18.json, window.HFS_W.timing) or from the film's words.
Usage: python3 sound_film18.py <voice guide wav> <voice report json> <out dir>"""
import sys, json, os, math
import numpy as np
from sfx import Mix, SR, ss, env, bp, lp, hp, note

VOICE, REPORT, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
T = dict(end=80.72, logo=78.2, you=0.35, scream=0.8, shower=1.75, because=2.69, fix=5.17, whole=5.56, lets=6.79, in1=8.9, ended=10.8,
         thirty=12.17, everyDay=14.53, they=16.8, reported=17.24, no=20.2, still=23.06, more=24.67, eleven=27.16, proof=30.22,
         immunity=32.08, mood=33.13, if1=34.43, training=37.37, growth=40.82, and6=42.19, seven=46.09, six=47.98, weeks=48.34,
         two=49.12, aDay=49.99, seventeen=50.43, hope=53.37, plunging=55.38, gasp=57.55, racing=58.23, heart=58.61, even=62.31,
         people2=64.51, so=65.55, heartQ=66.61, talk=72.16, final=75.94, back=76.82, factory=77.15, settings=77.52)
HERE = os.path.dirname(os.path.abspath(__file__))
TM = json.load(open(os.path.join(HERE, 'timing18.json')))
SWAP1, SWAP2 = TM['swap']
CHATTER2 = TM['chatter'][1]
m = Mix(T['end'], seed=20261018)
rng = np.random.default_rng(1818)
def sm(a, b, x): return float(ss(a, b, x))
def s5(a, b, x):
    u = min(1.0, max(0.0, (x - a) / (b - a))); return u * u * u * (u * (u * 6 - 15) + 10)
def one(at, sig, gain, pan=0.0): m.add('X', sig * gain, at, pan)
def jhash(n): s = math.sin(n * 127.1 + 311.7) * 43758.5453; return s - math.floor(s)   # the film's hash, so the clicks match the jaw
m.room(0.005)

def tile(at, f, gain=0.012, pan=0.0):   # a ceramic tile, tapped
    n = int(0.25 * SR); xx = np.arange(n) / SR
    s = sum(np.sin(2 * np.pi * f * r * xx) * np.exp(-xx / d) * w for r, d, w in [(1, 0.05, 1), (2.7, 0.025, 0.5), (5.1, 0.012, 0.3)]) + bp(m.noise(n), 1500, 8000) * env(n, 0.0004, 0.004) * 0.6
    one(at, s, gain, pan)
def pop(at, gain=0.008, pan=0.0, f=900):   # something small springing up
    n = int(0.09 * SR); xx = np.arange(n) / SR; fr = f * (1 + 0.6 * np.exp(-xx / 0.02))
    one(at, np.sin(2 * np.pi * np.cumsum(fr) / SR) * env(n, 0.0008, 0.03), gain, pan)
def paper(at, gain=0.012, pan=0.0):   # a card, a block of paper
    n = int(0.06 * SR); one(at, bp(m.noise(n), 1200, 6500) * env(n, 0.0008, 0.016), gain, pan)
def stamp(at, pan=0.0):   # a rubber stamp hitting card
    m.thud(at, 85, 0.05, pan, 0.08); n = int(0.12 * SR); one(at, bp(m.noise(n), 400, 4000) * env(n, 0.0005, 0.02), 0.045, pan)
def swell(a, b, gain=0.01, pan=0.0, f0=110, f1=160):   # something filling out
    tt = m.t(a, b); u = np.clip((tt - a) / (b - a), 0, 1); f = f0 + (f1 - f0) * u
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.3 * lp(m.noise(len(tt)), 400); m.add('X', s * np.sin(np.pi * u) ** 1.5 * gain, a, pan)
def scribble(a, d, gain=0.012, pan=0.0):   # a marker ticking a box
    tt = m.t(a, a + d); s = bp(m.noise(len(tt)), 1800, 7000) * (0.6 + 0.4 * np.abs(np.sin(2 * np.pi * 9 * tt))) * np.sin(np.pi * np.clip((tt - a) / d, 0, 1)) ** 0.6
    m.add('X', s * gain, a, pan)
def creak(at, d=0.5, gain=0.006, pan=0.0):   # bone turning on bone
    tt = m.t(at, at + d); u = np.clip((tt - at) / d, 0, 1)
    one(at, bp(m.noise(len(tt)), 600, 2400) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * (38 + 20 * u) * (tt - at)))) * np.sin(np.pi * u) ** 1.5, gain, pan)

# ---------------------------------------------------------------- the shower: warm spray, then cold; heard from further off as the camera leaves
t = m.t(0.0, 16.0); step = 480
def curve(fn): return np.repeat(np.array([fn(x) for x in t[::step]]), step)[:len(t)]
far = curve(lambda x: 1 - 0.5 * sm(6.5, 8.3, x)); gone = curve(lambda x: 1 - sm(14.2, 14.9, x)); cold = curve(lambda x: s5(TM['cold'], TM['cold'] + 0.4, x))
spray = bp(m.noise(len(t)), 1800, 9000) * (0.7 + 0.6 * lp(np.abs(m.noise(len(t))), 30))
spray_c = bp(m.noise(len(t)), 2600, 12000)
drum = bp(m.noise(len(t)), 180, 900) * (0.5 + 1.5 * lp(np.abs(m.noise(len(t))), 12))
m.add('X', ((spray * (1 - cold) + spray_c * cold * 1.1) * 0.012 + drum * 0.008) * far * gone * np.clip(t / 0.4, 0, 1), 0.0, -0.15)
n = int(3.0 * SR); m.add('X', hp(m.noise(n), 5000) * np.linspace(1, 0, n) ** 2 * 0.004, 0.0, -0.3)   # steam, thinning
m.clink(TM['cold'] + 0.08, 0.045, 0.2, f=2300); m.swish(TM['cold'], 0.35, 0.018, 0.2, f=2600)   # the mixer to cold
# the scream: a breathy wail through a bony throat, up then down (under the voice)
S0, S1 = TM['scream']; tt = m.t(S0, S1); u = np.clip((tt - S0) / (S1 - S0), 0, 1)
f0 = 520 + 380 * np.sin(np.pi * np.clip(u * 1.4, 0, 1)) ** 0.7 - 120 * u
src = np.sign(np.sin(2 * np.pi * np.cumsum(f0 * (1 + 0.012 * np.sin(2 * np.pi * 6.5 * tt))) / SR)) * 0.4 + m.noise(len(tt)) * 0.6
voc = bp(src, 650, 1250) + 0.7 * bp(src, 1900, 2900) + 0.25 * bp(src, 3200, 4200)
one(S0, voc * np.clip(u / 0.04, 0, 1) * (1 - u) ** 0.8, 0.02, -0.1)
# the hug: each arm clacking into place, a creak as it holds on
for k, at in enumerate(TM['hug']): m.thud(at, 140, 0.011, -0.15 + 0.1 * k, 0.05); m.clink(at + 0.02, 0.007, -0.15 + 0.1 * k, f=1700 - 150 * k)   # the right arm on, then the left
creak(TM['hug'][1] + 0.05, 0.5, 0.004, -0.1)
# the podcast on the shelf: a small chime as each promise lights up
for at in TM['pod']: m.shimmer(at + 0.02, (88, 95), 0.008, 0.3, 0.35, 0.9)
# the jaw: a click each time the teeth meet (the film's chatter, about 7.3 a second, uneven)
def chatter_on(x):
    if x < SWAP1: return sm(T['shower'] + 0.45, T['shower'] + 0.75, x) * (1 - 0.6 * sm(6.5, 8.3, x))
    if x < SWAP2: return sm(CHATTER2 - 0.3, CHATTER2, x)
    return 0.0
x, dt, prev = 0.0, 1 / 4800.0, None
while x < SWAP2:
    ph = x * 7.3 + 0.3 * math.sin(x * 2.1); f = ph - math.floor(ph)
    if prev is not None and prev < 0.4 <= f:   # the jaw shuts as f passes 0.4
        g = chatter_on(x)
        if g > 0.02:
            kick = 0.6 + 0.4 * jhash(math.floor(ph)); nn = int(0.05 * SR); xx = np.arange(nn) / SR; fr = rng.uniform(2600, 3600)
            click = (np.sin(2 * np.pi * fr * xx) * 0.5 + bp(m.noise(nn), 1500, 7000)) * env(nn, 0.0004, 0.006) + np.sin(2 * np.pi * 420 * xx) * env(nn, 0.0008, 0.012) * 0.4
            m.add('X', click * 0.026 * g * kick, x, -0.12 if x < SWAP1 else 0.1)
    prev = f; x += dt
# ---------------------------------------------------------------- the panel: one shower in six tiles (five warm, one cold); a month in thirty
for k in range(5): tile(TM['row'] + k * 0.18 + 0.05, 620 + 25 * k, 0.011, 0.15 + 0.03 * k)
tile(TM['coldTile'] + 0.02, 1320, 0.015, 0.3); m.shimmer(TM['coldTile'] + 0.05, (88, 95), 0.011, 0.3, 0.4, 1.2)
for k in range(30): tile(TM['month'] + k * 0.055 + 0.04, 900 + 18 * k, 0.0055, -0.3 + 0.6 * ((k % 6) / 5))
# ---------------------------------------------------------------- days off sick and days feeling ill: four bars, tile by tile; the cold row of days off sick stops short
for bi, full in enumerate([10, 7.1, 10, 10]):
    for k in range(10):
        if full - k <= 0: break
        a = (TM['sick'] if bi < 2 else TM['ill']) + k * (0.12 if bi < 2 else 0.09) + (bi % 2) * (0.06 if bi < 2 else 0.04)
        tile(a + 0.03, (700 if bi % 2 == 0 else 1100) + 30 * k, 0.0065 * (0.5 if full - k < 1 else 1), -0.25 + 0.05 * k)
m.pluck(TM['sick'] + 0.06 + 7 * 0.12 + 0.3, 60, 0.008, 0.2, 0.5)                    # 30% short
# ---------------------------------------------------------------- the week: a thermometer on every day; then the meetings drop in
for i in range(5): pop(TM['therms'] + i * 0.09 + 0.06, 0.007, -0.3 + 0.15 * i, 1400 + 60 * i)
for j in range(17): paper(TM['meet'] + j * 0.045 + 0.05, 0.007, -0.3 + 0.6 * (j / 16))
m.pluck(TM['meet'] + 17 * 0.045 + 0.2, 72, 0.008, 0.0, 0.5)
# ---------------------------------------------------------------- eleven little tubs (ten baths, one shower); NO PROOF stamped twice
for k in range(11): m.clink(TM['tubs'] + k * 0.1 + 0.08, 0.009, -0.35 + 0.07 * k, f=2600 + 60 * k)
for at, pan in zip(TM['stamps'], (-0.15, 0.15)): stamp(at + 0.01, pan)
# ---------------------------------------------------------------- after training: two sections grow; the one with the ice bath grows less
G0, G1 = TM['grow']; swell(G0, G1, 0.012, -0.2, 100, 160); swell(G0, G1, 0.008, 0.2, 100, 112)
for k in range(3): m.clink(G0 + 0.4 + k * 0.17, 0.006, 0.25, f=3300 + 300 * k)       # ice in the bath
# ---------------------------------------------------------------- the fat lands on the scale and it reads 700 g; six weeks of days; two hours; 17 degrees
land = TM['fat']; m.thud(land, 70, 0.06, -0.2, 0.12); n = int(0.2 * SR); one(land, lp(m.noise(n), 900) * env(n, 0.001, 0.03), 0.04, -0.2)
m.beep(land + 0.38, 1760.0, 0.08, 0.02, -0.2)
D0, D1 = TM['days']; prev = 1
for i in range(1200):
    x = D0 - 0.05 + i * 0.002
    if x > D1 + 0.1: break
    d = 1 + round(41 * s5(D0, D1, x))
    if d != prev: m.tick(x, 0.012, 0.2, hi=3000, lo=1400); prev = d
C0, C1 = TM['clock']; x = C0
while x < C1:
    u = (x - C0) / (C1 - C0); rate = 4 + 22 * math.sin(math.pi * u); m.tick(x, 0.022 * (0.5 + 0.5 * math.sin(math.pi * u)), 0.3, hi=2400, lo=900); x += 1 / rate
m.shimmer(TM['temp'] + 0.05, (84, 91, 96), 0.01, 0.2, 0.5, 1.4)                      # 17 degrees: cold light
# ---------------------------------------------------------------- the plunge: water and ice; a gasp; breathing and a pulse that race and settle
t = m.t(54.6, 77.6); lap = lp(m.noise(len(t)), 500) * (0.5 + 0.5 * np.sin(2 * np.pi * 0.35 * t)) * 0.011 + bp(m.noise(len(t)), 2000, 6000) * 0.0013
m.add('X', lap * np.clip((t - 54.6) / 1.0, 0, 1) * np.clip((77.6 - t) / 1.2, 0, 1), 54.6, 0.0)
for k in range(8): m.clink(56.2 + k * 2.3 + rng.uniform(0, 0.8), 0.005, rng.uniform(-0.4, 0.4), f=rng.uniform(3200, 4200))
n = int(0.45 * SR); xx = np.arange(n) / SR; one(TM['gasp'] - 0.04, bp(m.noise(n), 900, 5000) * np.sin(np.pi * np.clip(xx / 0.45, 0, 1)) ** 0.6 * np.exp(-xx / 0.3), 0.05)
def phase(tv, base, peak, t0, t1, t2, t3):   # the film's rateInt: midpoint rule from 0 with 120 steps, so beats land where the picture's do
    N = 120; dt = tv / N; tt = (np.arange(N) + 0.5) * dt
    r = base + (peak - base) * np.array([sm(t0, t1, q) * (1 - sm(t2, t3, q)) for q in tt]); return float(np.sum(r) * dt)
def crossings(par, a, b, step=0.01):
    out, p0, x = [], phase(a, *par), a
    while x < b:
        p1 = phase(x + step, *par)
        if math.floor(p1) > math.floor(p0): out.append(x + step * (math.floor(p1) - p0) / max(1e-9, p1 - p0))
        p0, x = p1, x + step
    return out
BR, BT = TM['breath'], TM['beat']
for at in crossings(BR, 56.0, 66.0):
    r = BR[0] + (BR[1] - BR[0]) * sm(BR[2], BR[3], at) * (1 - sm(BR[4], BR[5], at)); per = 1 / r; n = int(per * SR); xx = np.arange(n) / SR; u = xx / per
    s = bp(m.noise(n), 700, 4200) * (np.sin(np.pi * np.clip(u / 0.45, 0, 1)) ** 1.5 * (u < 0.45) + 0.55 * np.sin(np.pi * np.clip((u - 0.5) / 0.45, 0, 1)) ** 1.5 * (u >= 0.5))
    m.add('X', s * 0.013 * (1 - sm(64.6, 65.6, at)), at, 0.1)
for at in crossings(BT, 57.0, 66.0):
    g = 1 - sm(64.8, 65.8, at); m.heartbeat(at, 0.06 * g, 0.25)
    if TM['gasp'] < at < 63.8: m.beep(at + 0.03, 1568.0, 0.05, 0.01, 0.35)
# ---------------------------------------------------------------- the checklist springs up, ticks each line as it is said, then the doctor
SI, SO = TM['sign']; m.swish(SI, 0.35, 0.012, -0.1, 1600); paper(SI + 0.2, 0.012, -0.1)
for k, at in enumerate(TM['checks']): scribble(at, 0.22, 0.012, -0.15 + 0.07 * k)
m.pluck(TM['doctor'] + 0.05, 67, 0.01, 0.0, 0.6); m.pluck(TM['doctor'] + 0.2, 72, 0.009, 0.0, 0.8)
m.swish(SO, 0.35, 0.01, -0.1, 1400)
# ---------------------------------------------------------------- the chiller's dial goes back to the middle; the logo
m.clink(TM['knob'] + 0.35, 0.025, -0.2, f=2100); m.swish(TM['knob'] + 0.15, 0.5, 0.012, -0.2, f=1800)
# ---------------------------------------------------------------- the camera's moves
for a, b in TM['moves']:
    if a > 74: continue
    m.whoosh(a + 0.05, b - a, 250, 1800, 0.014 if b - a < 0.9 else 0.018, 0.3 if a < 52 else -0.2)
m.whoosh(74.6, 1.4, 220, 1500, 0.014, -0.2)
m.whoosh(T['settings'] - 0.2, T['logo'] - T['settings'] + 0.2, 220, 2600, 0.04, 0.0)
m.logo_end(T['logo'] - 0.15, T['logo'])
# ---------------------------------------------------------------- the score
m.pad([38, 50, 57, 62], 0.0, 6.5, 0.45, 1000)                        # the shower, the scream, the podcast
m.pad([41, 53, 57, 60], 6.5, 16.3, 0.5, 1100)                        # let's see; the trial: one shower, a month
m.pad([43, 55, 58, 62], 16.3, 25.85, 0.5, 1150)                      # sick days; more meetings
m.pad([40, 52, 55, 59], 25.85, 34.0, 0.5, 1000)                      # eleven trials, no proof
m.pad([38, 50, 53, 57], 34.0, 41.6, 0.5, 950)                        # lifting, and the ice bath
m.pad([43, 55, 59, 62], 41.6, 54.45, 0.5, 1150)                      # fat loss: small; the cold; shorter showers
m.pad([37, 49, 52, 56], 54.45, 64.85, 0.5, 900)                      # cold shock
m.drone(55.0, 65.0, 37, 0.018, 420)
m.pad([41, 53, 56, 60], 64.85, T['final'], 0.38, 900)                # the warning, plain
m.pad([41, 53, 60, 65, 69, 72], T['final'], T['end'], 1.0, 2400, rel=0.2)
m.pulse(16.3, 25.9, 92, [64, 67, 71, 67], 0.005, 1300, lvl=lambda x: sm(16.3, 17.0, x) * (1 - sm(25.2, 25.9, x)))
m.pulse(47.4, 54.4, 84, [62, 67, 69, 67], 0.005, 1200, lvl=lambda x: sm(47.4, 48.1, x) * (1 - sm(53.7, 54.4, x)))
m.finish(REPORT, VOICE, OUT, 'film18')

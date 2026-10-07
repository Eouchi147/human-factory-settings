"""Film 16 "How much water do you need?" (new direction, 7 Oct 2026): score and sound design, timed to films/film16.js.
A music box over the newborn (a water bottle in a bonnet, in its pram); the stage lights coming up on the skeleton beside
it; the glass on its teeth, the gulps, the water falling straight through it into a steel bucket; a glass set down on a tray
of eight; a card drawer slid open on nothing; a thirst gauge draining to DRINK and its lamp; cutlery; two jugs filling to
2 litres and 2.5; every drink and the fruit bowl hopping; a sticky note slapped on the coffee and struck out; two tubes
filling alike; a colour card ringed and ticked; a cylinder topped up for each reason, then over the top; thirteen bibs turning;
a scale's needle swinging up; the last glass; the logo. Every time comes from the timing table the picture exports
(timing16.json, window.HFS_W.timing). Usage: python3 sound_film16.py <voice guide wav> <voice report json> <out dir>"""
import sys, json, os
import numpy as np
from sfx import Mix, SR, ss, env, bp, lp, hp, note

VOICE, REPORT, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
T = dict(end=78.04, logo=75.52, you=0.35, newborn=3.33, forcing=3.54, lets=8.19, check=8.71, review=10.11, none=15.4, your=16.39,
         thirst=18.85, most=19.72, meals=23.53, europe=24.82, counting=30.51, coffee=34.13, count=35.1, trial=36.12, asWell=41.43,
         check2=43.11, pale=44.81, yellow=45.26, drinkMore=45.89, but=52.6, better=53.6, marathon=54.2, thirteen=54.99, linked=59.88,
         gained=62.01, weight=62.51, drinking2=63.32, deadly=65.06, so2=66.23, final=73.25, factory=74.46, settings=74.83)
HERE = os.path.dirname(os.path.abspath(__file__))
TM = json.load(open(os.path.join(HERE, 'timing16.json')))
G = 9.81
JAW, LEVEL = 1.56, 0.125                     # where the water leaves the jaw; the bucket's surface
FALL = float(np.sqrt(2 * (JAW - LEVEL) / G))  # about 0.54 s from the jaw to the bucket
m = Mix(T['end'], seed=20261016)
rng = np.random.default_rng(1616)
def s5(a, b, x):
    u = np.clip((np.asarray(x, dtype=float) - a) / (b - a), 0, 1); return u * u * u * (u * (u * 6 - 15) + 10)
def one(at, sig, gain, pan=0.0): m.add('X', sig * gain, at, pan)
m.room(0.005)

def stream_into(a, b, gain=0.03, pan=0.0, lo=500, hi=5000, bub=1.0, metal=0.0):   # water falling into water: hiss, bubbles, a churn
    tt = m.t(a, b); n = len(tt); e = ss(a, a + 0.05, tt) * (1 - ss(b - 0.25, b, tt))
    hiss = bp(m.noise(n), lo, hi) * (0.7 + 0.3 * np.sin(2 * np.pi * 7.3 * tt) * np.sin(2 * np.pi * 3.1 * tt))
    churn = lp(m.noise(n), 260) * 2.5
    ring = (bp(m.noise(n), 2300, 2500, 1) * 3 + bp(m.noise(n), 3550, 3750, 1) * 2) * metal   # the steel answering
    m.add('X', (hiss + churn + ring) * e * gain, a, pan)
    k = a
    while k < b - 0.05:   # bubbles: short rising sines
        f0 = rng.uniform(500, 1400) * bub; d = rng.uniform(0.02, 0.05); nn = int(d * SR); x = np.arange(nn) / SR
        m.add('X', np.sin(2 * np.pi * np.cumsum(f0 * (1 + 1.5 * x / d)) / SR) * env(nn, 0.002, d * 0.5) * gain * rng.uniform(0.3, 0.8), k, pan + rng.uniform(-0.1, 0.1))
        k += rng.uniform(0.03, 0.11)
def plop(at, gain=0.05, pan=0.0, f=420):
    nn = int(0.16 * SR); x = np.arange(nn) / SR
    m.add('X', np.sin(2 * np.pi * np.cumsum(f * (1 + 1.4 * (1 - np.exp(-x / 0.03)))) / SR) * env(nn, 0.002, 0.05) * gain, at, pan)
    m.add('X', bp(m.noise(int(0.12 * SR)), 1200, 7000) * env(int(0.12 * SR), 0.001, 0.03) * gain * 0.5, at + 0.005, pan)
def drip(at, gain=0.02, pan=0.0): plop(at, gain, pan, f=rng.uniform(800, 1300))
def gulp(at, gain=0.03, pan=0.0):           # a swallow that goes nowhere: a low wet knock and a falling bubble
    nn = int(0.14 * SR); x = np.arange(nn) / SR
    m.add('X', np.sin(2 * np.pi * np.cumsum(260 * (1 - 0.45 * (1 - np.exp(-x / 0.04)))) / SR) * env(nn, 0.004, 0.045) * gain, at, pan)
    m.add('X', lp(m.noise(int(0.06 * SR)), 900) * env(int(0.06 * SR), 0.002, 0.02) * gain * 0.6, at, pan)
def svf_bp(x, fc, q=6.0):   # a band-pass whose centre moves sample by sample (a state-variable filter)
    low = band = 0.0; out = np.empty(len(x)); f = 2 * np.sin(np.pi * np.asarray(fc) / SR)
    for i in range(len(x)):
        high = x[i] - low - band / q; band += f[i] * high; low += f[i] * band; out[i] = band
    return out
def fill(a, b, gain=0.02, pan=0.0, f0=280, f1=980):   # a pour into a vessel: the hollow note rises as it fills (falls if f1 < f0)
    tt = m.t(a, b); n = len(tt); u = np.clip((tt - a) / (b - a), 0, 1); fc = f0 + (f1 - f0) * u ** 1.2
    src = bp(m.noise(n), 300, 6000); out = svf_bp(src, fc, 7.0)
    e = ss(a, a + 0.06, tt) * (1 - ss(b - 0.12, b, tt))
    m.add('X', (out * 0.5 + 0.25 * src) * e * gain, a, pan)
def scribble(a, d, gain=0.012, pan=0.0):   # a felt marker on paper
    tt = m.t(a, a + d); n = len(tt); s = bp(m.noise(n), 1800, 7000) * (0.6 + 0.4 * np.abs(np.sin(2 * np.pi * 9 * tt))) * np.sin(np.pi * np.clip((tt - a) / d, 0, 1)) ** 0.6
    m.add('X', s * gain, a, pan)
def slide(a, d, gain=0.03, pan=0.0, lo=140, hi=900):   # wood sliding on wood
    tt = m.t(a, a + d); m.add('X', bp(m.noise(len(tt)), lo, hi) * np.sin(np.pi * np.clip((tt - a) / d, 0, 1)) ** 1.5 * gain, a, pan)
def ting(at, gain=0.008, pan=0.0, f=3300):   # glass on glass
    nn = int(0.9 * SR); x = np.arange(nn) / SR
    s = (np.sin(2 * np.pi * f * x) + 0.5 * np.sin(2 * np.pi * f * 2.76 * x) * np.exp(-x * 9)) * np.exp(-x * 4.5) * env(nn, 0.0008, 0.9)
    one(at, s, gain, pan)
def paper(at, gain=0.03, pan=0.0):        # a sticky note slapped on
    nn = int(0.07 * SR); one(at, bp(m.noise(nn), 900, 5200) * env(nn, 0.0008, 0.018) + lp(m.noise(nn), 400) * env(nn, 0.001, 0.02) * 0.8, gain, pan)
def flip(at, gain=0.008, pan=0.0):        # a card turned over
    nn = int(0.05 * SR); one(at, bp(m.noise(nn), 1500, 6500) * env(nn, 0.0006, 0.012), gain, pan)

# ---------------------------------------------------------------- the newborn: a music box; then the lights come up on its parent
for k, (dt, nn) in enumerate([(0.15, 79), (0.5, 76), (0.85, 72), (1.2, 76), (1.55, 74), (1.9, 71)]):
    m.bell(dt, nn, 0.007, -0.25, 1.4, buf='X'); m.bell(dt + 0.004, nn + 12, 0.0018, -0.25, 0.7, buf='X')
L = TM['lightsUp']
m.thud(L + 0.01, 62, 0.03, 0.0, 0.18); m.clink(L, 0.012, 0.1, f=900); m.clink(L + 0.006, 0.006, 0.1, f=1700)   # the big switch
tt = m.t(L, L + 2.4); one(L, (np.sin(2 * np.pi * 100 * tt) + 0.4 * np.sin(2 * np.pi * 200 * tt)) * ss(L, L + 0.3, tt) * (1 - ss(L + 1.2, L + 2.4, tt)), 0.0022, 0.0)   # the lamps' hum
m.pluck(L + 0.3, 67, 0.01, 0.1, 0.6); m.pluck(L + 0.45, 72, 0.01, 0.1, 0.8)        # ta-da, quietly

# ---------------------------------------------------------------- the drink: the glass up to its teeth, gulps, and it all falls through into the bucket
D0, D1, D2, D3 = TM['drink']; P0, P1 = TM['pour']
m.swish(D0, D1 - D0, 0.01, 0.15, 1300)
ting(D1 - 0.02, 0.006, 0.1, 3900); m.tick(D1 - 0.015, 0.006, 0.1, hi=4200, lo=2600)        # the rim on its teeth
for k, at in enumerate(np.arange(P0 + 0.12, P1 - 0.1, 0.38)): gulp(float(at), 0.03 * (0.85 + 0.3 * rng.random()), 0.05)
hitOn, hitOff = P0 + FALL, P1 + FALL
stream_into(hitOn, hitOff + 0.05, 0.028, 0.0, metal=0.35)
plop(hitOn, 0.03); m.clink(hitOn + 0.004, 0.006, 0.0, f=2400)
for k, at in enumerate([hitOff + 0.15, hitOff + 0.45, hitOff + 0.9]): drip(at, 0.012 - 0.003 * k, 0.05)
m.swish(D2, D3 - D2, 0.006, 0.15, 1100)

# ---------------------------------------------------------------- the tray of eight, one place empty; the drawer slides open on nothing
ting(7.25, 0.005, -0.2, 3500); ting(7.4, 0.0035, -0.25, 3100)
A0, A1 = TM['drawer']
slide(A0, A1 - A0 + 0.05, 0.03, -0.2); m.thud(A1, 150, 0.025, -0.2, 0.05); m.tick(A1 + 0.004, 0.009, -0.2, hi=1600, lo=500)
m.pluck(T['none'] + 0.05, 60, 0.012, -0.1, 0.5); m.pluck(T['none'] + 0.3, 55, 0.012, -0.1, 0.9)   # none: the empty drawer's little fall

# ---------------------------------------------------------------- the thirst gauge: the water drains to DRINK; its lamp comes on
G0, G1 = TM['gaugeFall']
m.tone_line(G0, G1, 72, 0.004, 0.1, glide=lambda t: -9 * s5(G0, G1, t))
fill(G0, G1, 0.006, 0.1, 1200, 380)
Lp = TM['lamp']; m.beep(Lp + 0.02, f=660.0, d=0.14, g=0.008, pan=0.1)
tb = m.t(Lp, Lp + 0.65); one(Lp, bp(m.noise(len(tb)), 90, 400) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 50 * tb))) * ss(Lp, Lp + 0.05, tb) * (1 - ss(Lp + 0.4, Lp + 0.65, tb)), 0.003, 0.1)

# ---------------------------------------------------------------- with meals: a fork on a plate
m.clink(T['meals'] + 0.1, 0.006, 0.1, f=3100); m.clink(T['meals'] + 0.22, 0.004, 0.12, f=3600)

# ---------------------------------------------------------------- two jugs fill, to 2 litres and to 2.5; every drink hops up, and the fruit bowl
W0, W1 = TM['jugW']; M0, M1 = TM['jugM']
fill(W0, W1, 0.018, -0.15, 260, 880); fill(M0, M1, 0.018, 0.12, 240, 900)
m.pluck(W1 - 0.05, 72, 0.008, -0.15, 0.4); m.pluck(M1 - 0.05, 74, 0.008, 0.12, 0.4)
H = TM['hop']
ting(H[0] + 0.2, 0.005, -0.3, 3600)                                   # the water glass
ting(H[1] + 0.2, 0.004, -0.15, 3200)                                  # the milk
m.clink(H[2] + 0.2, 0.006, 0.0, f=2100); m.tock(H[2] + 0.21, 0.006, 0.0, f=700)   # the tea cup on its saucer
m.tock(H[3] + 0.2, 0.01, 0.15, f=480)                                 # the mug
m.thud(H[4] + 0.2, 210, 0.012, 0.3, 0.05); m.tock(H[4] + 0.23, 0.005, 0.3, f=600)  # the fruit bowl

# ---------------------------------------------------------------- the note slapped on the coffee: DOESN'T COUNT; struck out
N = TM['noteIn']; m.swish(N - 0.18, 0.2, 0.006, 0.1, 1700); paper(N + 0.06, 0.02, 0.1)
S0, S1 = TM['strike']; scribble(S0, S1 - S0 + 0.05, 0.016, 0.1)
m.pluck(S1 + 0.08, 67, 0.01, 0.1, 0.5); m.pluck(S1 + 0.2, 71, 0.01, 0.1, 0.7)

# ---------------------------------------------------------------- two tubes, water and coffee, fill alike; the line across them
U0, U1 = TM['tubes']
fill(U0, U1, 0.01, -0.15, 500, 1300); fill(U0 + 0.05, U1, 0.009, 0.15, 520, 1320)
m.shimmer(T['asWell'] - 0.05, (79, 84, 88), 0.004, 0.0, 0.5, 1.4)

# ---------------------------------------------------------------- the colour card: clear pale yellow ringed, ticked
R0, R1 = TM['ring']; scribble(R0, R1 - R0, 0.012, 0.05); scribble(T['yellow'] + 0.02, 0.3, 0.014, 0.2)
m.pluck(T['yellow'] + 0.4, 76, 0.009, 0.1, 0.6)

# ---------------------------------------------------------------- the cylinder: a notch for each reason; then over the top
for at in TM['reasons']:
    fill(at - 0.05, at + 0.45, 0.011, -0.05, 700, 900); m.tick(at + 0.02, 0.006, -0.3, hi=2600, lo=1200)
O0, O1 = TM['over']
fill(O0, O1, 0.016, 0.0, 900, 1500)
stream_into(T['better'] - 0.05, 54.6, 0.011, 0.0, 900, 6000, bub=1.4)    # the spill, running down, pooling (the camera leaves at 54)
for k in range(4): drip(T['better'] + 0.25 + k * 0.17 + rng.uniform(0, 0.08), 0.007)

# ---------------------------------------------------------------- the marathon: thirteen bibs turn red; a scale's needle swings up; deadly
B = TM['bibs']
for r in range(13): flip(B + r * 0.045, 0.009, float(rng.uniform(-0.4, 0.4))); m.tick(B + r * 0.045 + 0.01, 0.004, 0.0, hi=3000, lo=1400)
E0, E1 = TM['needle']
tt = m.t(E0, E1); u = np.clip((tt - tt[0]) / (tt[-1] - tt[0]), 0, 1)
one(E0, bp(m.noise(len(tt)), 300, 1600) * (0.5 + 0.5 * np.sin(2 * np.pi * 37 * tt)) * np.sin(np.pi * u) ** 2, 0.01, 0.1)   # the spring
m.thud(E0 - 0.05, 90, 0.02, 0.1, 0.08)
m.drone(T['deadly'] - 0.1, T['so2'] - 0.2, 38, 0.008, 380)                                                                 # deadly: a low weight

# ---------------------------------------------------------------- the camera's moves
for a, b, g, pan in [(0.55, 2.6, 0.006, 0.0), (2.6, 3.55, 0.008, 0.1), (4.6, 5.4, 0.012, 0.0), (6.2, 6.85, 0.02, 0.35), (9.35, 10.1, 0.018, 0.3),
                     (13.6, 14.3, 0.01, 0.2), (16.0, 16.65, 0.018, 0.3), (19.45, 20.05, 0.018, 0.3), (24.35, 24.95, 0.018, 0.3),
                     (30.4, 30.95, 0.008, 0.1), (31.55, 32.45, 0.008, 0.2), (33.5, 34.05, 0.01, 0.15), (35.75, 36.35, 0.018, 0.3),
                     (42.5, 43.15, 0.018, 0.3), (45.7, 46.35, 0.018, 0.3), (52.45, 53.05, 0.008, 0.0), (54.0, 54.75, 0.02, 0.35),
                     (59.7, 60.35, 0.016, 0.0), (65.55, 66.25, 0.018, 0.3)]:
    m.whoosh(a + 0.05, b - a, 250, 1800, g, pan)
m.whoosh(72.4, 1.1, 220, 1500, 0.012, 0.0)
m.whoosh(T['settings'] - 0.2, T['logo'] - T['settings'] + 0.2, 220, 2600, 0.04, 0.0)
m.logo_end(T['logo'] - 0.15, T['logo'])

# ---------------------------------------------------------------- the score
m.pad([48, 55, 60, 64], 0.0, 3.5, 0.45, 1300)                        # the newborn; the parent
m.pad([43, 55, 59, 62], 3.5, 9.8, 0.5, 1100)                         # forcing down eight glasses; let's check
m.pad([41, 53, 56, 60], 9.8, 16.2, 0.5, 950)                         # the review: none
m.pad([45, 57, 60, 64], 16.2, 24.6, 0.5, 1150)                       # thirst; meals
m.pad([48, 55, 60, 64, 67], 24.6, 33.9, 0.5, 1300)                   # 2 litres, 2.5; every drink, and food
m.pad([45, 52, 57, 60, 64], 33.9, 42.8, 0.5, 1250)                   # coffee and tea count
m.pad([45, 57, 60, 64], 42.8, 52.4, 0.5, 1150)                       # check your pee; drink more when
m.pad([38, 50, 53, 57], 52.4, 65.8, 0.5, 900)                        # more isn't better; the marathon
m.pad([41, 53, 57, 60], 65.8, T['final'], 0.45, 900)                 # drink to thirst; your doctor
m.pad([41, 53, 60, 65, 69, 72], T['final'], T['end'], 1.0, 2400, rel=0.2)
m.pulse(26.6, 33.6, 92, [67, 71, 74, 71], 0.006, 1300, lvl=lambda t: float(ss(26.6, 27.3, t)) * (1 - float(ss(33.0, 33.6, t))))
m.finish(REPORT, VOICE, OUT, 'film16')

"""Film 6 "Are barefoot shoes good for your feet?" (new direction, 6 Oct 2026): score and sound design, timed to films/film06.js.
The lid, both walks (the steps come from the same gait phase the picture uses), the shoes coming off and going back on, the
heel raises, the toe shoes and the scan all come from the timing table the picture exports (timing06.json, window.HFS_W.timing);
the bones, arches, dots and dials from the same formulas as the picture.
Usage: python3 sound_film06.py <voice guide wav> <voice report json> <out dir>"""
import sys, json, os
import numpy as np
from sfx import Mix, SR, ss, env, bp, lp, hp, note

VOICE, REPORT, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
# word starts, as in films/film06.src.js
T = dict(end=77.05, logo=74.53,
         youre=0.35, buying=1.45, barefoot=1.66, which=2.36, paying=3.08, money=3.63, wearing=5.04, noshoes=5.75,
         lets=6.73, need=8.19, your=9.64, built=10.48, twentysix=10.91, bones=11.43, each=11.86, three=12.09, arches=12.54,
         and1=13.2, small=13.39, muscles=13.82, up=16.37, like=17.25, stronger=18.56, work=19.99,
         when2=21.16, walked=22.0, their=24.44, forty=26.41, stronger2=27.43, and2=28.17, exercises=29.13, free=31.71,
         runners2=32.79, kept=35.97, even=36.7, fewer=37.59, injuries=38.19, year=39.9,
         but=40.92, overnight=41.88, when3=42.82, toe=44.44, ten=45.29, more=45.93, half=46.75, bone=47.38, stress=47.77, scans=48.8,
         plan=50.43, walk=52.41, notrun=54.62, building=55.35, two=56.72, five=59.02, seven=60.32,
         if_=61.78, doctor=69.69, shop=70.7, final=72.27, settings=73.85)
HERE = os.path.dirname(os.path.abspath(__file__))
TM = json.load(open(os.path.join(HERE, 'timing06.json')))
LID0, LID1 = TM['lid']; WALKS = TM['walks']; OFF, ON = TM['shoesOff'], TM['shoesOn']; REPS = TM['reps']
TOE0, TOE1 = TM['toe']; SCAN = TM['scan']; SLAM = TM['slam']
m = Mix(T['end'], seed=20261006)
rng = np.random.default_rng(66)
def s5(a, b, x):
    u = float(np.clip((x - a) / (b - a), 0, 1)); return u * u * u * (u * (u * 6 - 15) + 10)

# ---------------------------------------------------------------- the walks, exactly as in the picture (walkDist, summed)
STRIDE, RAMP = 1.08, 0.9
def walk_dist(Wk, t):
    D = Wk['v'] * (Wk['t1'] - Wk['t0'] - RAMP)
    if t <= Wk['t0']: return 0.0
    if t >= Wk['t1']: return D
    u = t - Wk['t0']; TT = Wk['t1'] - Wk['t0']
    if u < RAMP: return Wk['v'] * u * u / (2 * RAMP)
    if u > TT - RAMP: r = TT - u; return D - Wk['v'] * r * r / (2 * RAMP)
    return Wk['v'] * (u - RAMP / 2)
def walkS(t): return sum(walk_dist(Wk, t) for Wk in WALKS)
def speed(t, h=0.005): return (walkS(t + h) - walkS(t - h)) / (2 * h)
def walking(t, Wk):   # 1 while he walks, 0 standing: the same blend the picture uses
    return s5(Wk['t0'] - 0.05, Wk['t0'] + 0.7, t) * (1 - s5(Wk['t1'] - 0.75, Wk['t1'] + 0.05, t))
strikes = []   # (time, side, gain): a heel lands when that foot's gait phase comes round to zero
for Wk in WALKS:
    prev = {'R': None, 'L': None}
    for t in np.arange(Wk['t0'] - 0.1, Wk['t1'] + 0.3, 0.001):
        sp = walkS(t) + 0.25 * STRIDE
        for side, off in (('R', 0.0), ('L', 0.5)):
            k = int(np.floor(sp / STRIDE - off))
            if prev[side] is not None and k > prev[side]:
                g = walking(float(t), Wk)
                if g > 0.15: strikes.append((float(t), side, g))
            prev[side] = k

# ---------------------------------------------------------------- the box: a lamp's hum, the lid lifted off, tissue, nothing
tt = m.t(0, 8.4)
hum = (np.sin(2 * np.pi * 120 * tt) + 0.4 * np.sin(2 * np.pi * 240 * tt)) * (0.35 + 0.65 * ss(0, 0.5, tt)) * (1 - ss(6.6, 8.4, tt))
m.add('X', lp(hum, 1200) * 0.008, 0.0, 0.3)
m.rustle(LID0 + 0.02, LID0 + 0.5, 0.035, 0.25)                        # card sliding on card as the lid comes up
m.swish(LID0 + 0.3, 0.7, 0.02, 0.3, 900)
m.rustle(LID0 + 0.55, LID1 + 0.05, 0.022, 0.1)                       # tissue paper
m.thud(LID1, 120, 0.035, 0.35, 0.07); m.tick(LID1 + 0.02, 0.03, 0.35, hi=1600, lo=420)   # the lid stood on its edge behind the box
m.tock(LID1 + 0.2, 0.07, 0.0, f=210)                                  # and inside: nothing
m.whoosh(6.25, 1.2, 1500, 320, 0.03, -0.2, up=False)                  # up and over to the shoes on the pad

# ---------------------------------------------------------------- the shoes go clear; 26 bones, heel to toes; three arches; small muscles
m.scan(T['built'] - 0.25, 0.9, 0.018, 0.1); m.shimmer(T['built'] - 0.05, notes=(81, 88, 93), gain=0.012, pan=0.1, decay=0.5, dur=1.4)
for i in range(26):
    at = T['twentysix'] - 0.05 + i * 0.034
    m.tick(at, 0.026 * rng.uniform(0.8, 1.0), -0.35 + i * 0.028, hi=1500 + i * 55, lo=520 + i * 18)
for i, nn in enumerate((76, 79, 83)):                                 # each arch draws itself (inner, outer, across)
    t0 = T['three'] + 0.05 + i * 0.22
    m.tone_line(t0, t0 + 1.1, nn, gain=0.011, pan=[0.2, -0.2, 0.0][i], glide=lambda t, t0=t0: 2 * np.clip((t - t0) / 0.7, 0, 1))
m.whoosh(T['small'] - 0.1, 1.5, 300, 1400, 0.018, 0.0)
m.drone(T['small'], 20.8, 45, 0.022, 380)                             # the muscles: low and warm
for k in range(5):                                                    # they work: one soft squeeze per pulse of light
    at = T['like'] + (np.pi / 2 + 2 * np.pi * k) / 7.5
    if at < 20.5: m.thud(at, 62, 0.035, 0.0, 0.14); m.swish(at - 0.12, 0.4, 0.008, 0.0, 600)

# ---------------------------------------------------------------- the walking pad: the display wakes, the motor, the belt, his steps
def pad_run(t0, t1, v):   # the motor whines up with the belt's speed; the belt hisses under the feet
    tt = m.t(t0, t1); sp = np.clip(np.array([speed(x) for x in tt]) / v, 0, 1.2)
    f = 95 + 75 * sp; ph = 2 * np.pi * np.cumsum(f) / SR
    motor = (np.sin(ph) + 0.35 * np.sin(2.7 * ph) + 0.15 * np.sign(np.sin(ph))) * (0.25 + 0.75 * sp) * ss(t0, t0 + 0.4, tt) * (1 - ss(t1 - 0.7, t1, tt))
    m.add('X', lp(motor, 1800) * 0.009, t0, 0.0)
    belt = bp(m.noise(len(tt)), 300, 2400) * sp * (0.8 + 0.2 * np.sin(2 * np.pi * 9 * tt)) * (1 - ss(t1 - 0.7, t1, tt))
    m.add('X', belt * 0.005, t0, 0.0)
W1, W2 = WALKS
m.beep(20.45, 2093.0, 0.05, 0.03, 0.0); m.beep(20.53, 2637.0, 0.06, 0.03, 0.0)   # the display wakes
for k in range(1, 8): m.beep(21.0 + 0.75 * k, 2637.0, 0.035, 0.018, 0.0)          # WEEK 2 ... WEEK 8
pad_run(W1['t0'] - 0.3, W1['t1'] + 0.4, W1['v'])
for t0, side, g in strikes:
    pan = -0.12 if side == 'R' else 0.12
    m.thud(t0, 72, 0.05 * g, pan, 0.12); m.tick(t0 + 0.004, 0.018 * g, pan, hi=1100, lo=260)
    n = int(0.09 * SR); m.add('X', bp(m.noise(n), 250, 1500) * env(n, 0.002, 0.03) * 0.012 * g, t0 + 0.11, pan)   # the roll to the toes
m.pluck(T['forty'] + 0.05, 77, 0.03, 0.2, 0.6)

# ---------------------------------------------------------------- off with the shoes; heel raises, barefoot
m.whoosh(OFF + 0.05, 0.8, 2200, 600, 0.018, 0.0, up=False); m.shimmer(OFF + 0.1, notes=(84, 79, 76), gain=0.01, pan=0.0, decay=0.35, dur=1.0)
for r0 in REPS:
    m.swish(r0 + 0.02, 0.6, 0.014, -0.2, 800)                          # up onto the toes
    m.thud(r0 + 1.58, 85, 0.04, -0.2, 0.08); m.tick(r0 + 1.59, 0.016, -0.2, hi=1300, lo=300)   # and the heels back down
m.pluck(T['free'] + 0.05, 81, 0.03, 0.2, 0.6)

# ---------------------------------------------------------------- 118 runners: two blocks of light; the untrained hurt more
for i in range(118):
    at = T['runners2'] + 0.6 + i * 0.006 + 0.06; grp = i >= 57; j = i - 57 if grp else i
    nn = (86 if not grp else 79) + (j % 8) * 0.5 - (j // 8) * 0.4
    n = int(0.07 * SR); x = np.arange(n) / SR
    m.add('X', np.sin(2 * np.pi * note(nn) * x) * env(n, 0.001, 0.014) * 0.007, at, -0.35 + 0.1 * ((j % 8) - 3.5) / 3.5)
m.pluck(T['fewer'] + 0.1, 62, 0.03, -0.3, 0.8); m.pluck(T['fewer'] + 0.35, 65, 0.022, -0.3, 0.8)
m.tock(T['but'] + 0.04, 0.08, 0.0, f=250)

# ---------------------------------------------------------------- toe shoes, ten weeks; 10 of 19 go red; the scan
m.swish(TOE0 + 0.05, 0.5, 0.02, 0.0, 1200); m.shimmer(T['toe'], notes=(76, 83, 88), gain=0.012, pan=0.0, decay=0.4, dur=1.2)
for k in range(19):
    at = T['toe'] + k * 0.025 + 0.05; n = int(0.07 * SR); x = np.arange(n) / SR
    m.add('X', np.sin(2 * np.pi * note(84 + k * 0.3) * x) * env(n, 0.001, 0.016) * 0.012, at, -0.5 + k / 18)
for k in range(10):
    at = T['more'] + 0.3 + k * 0.06 + 0.15; n = int(0.12 * SR); x = np.arange(n) / SR
    m.add('X', (np.sin(2 * np.pi * 740 * x) + 0.5 * np.sin(2 * np.pi * 554 * x)) * env(n, 0.002, 0.03) * 0.012, at, -0.5 + k / 18)
for k in range(int((T['scans'] + 0.6 - (SCAN - 0.1)) * 6.2)):        # the scanner: knocking, as MRI machines do
    at = SCAN - 0.1 + k / 6.2; n = int(0.07 * SR); x = np.arange(n) / SR
    knock = np.sign(np.sin(2 * np.pi * 330 * x)) * env(n, 0.001, 0.02) * (1.0 if k % 4 else 1.4)
    m.add('X', lp(knock, 2500) * 0.01 * min(1, k / 3), at, 0.1)
m.scan(SCAN - 0.05, 1.7, 0.016, -0.1)

# ---------------------------------------------------------------- the second walk: shoes back on, "walking, not running"
m.swish(ON + 0.05, 0.5, 0.016, 0.0, 1000); m.shimmer(ON + 0.1, notes=(76, 81, 84), gain=0.01, pan=0.0, decay=0.35, dur=1.0)
m.beep(50.5, 2093.0, 0.05, 0.028, 0.0); m.beep(50.6, 2349.0, 0.06, 0.028, 0.0)
pad_run(W2['t0'] - 0.3, W2['t1'] + 0.4, W2['v'])

# ---------------------------------------------------------------- three dials: they rise, they are set (2,500 / 5,000 / 7,000 of 10,000)
for i, pan in enumerate((-0.35, 0.0, 0.35)):
    t0 = 55.0 + i * 0.18
    m.whoosh(t0 - 0.05, 0.9, 200, 1300, 0.024, pan); m.thud(t0 + 0.88, 105, 0.035, pan, 0.08)
def detents(t0, t1, v0, v1, pan):
    ts = np.linspace(t0, t1, 400); vs = np.array([v0 + (v1 - v0) * s5(t0, t1, x) for x in ts])
    for k in range(1, 21):
        thr = k / 20
        if v1 > v0 and v0 < thr <= v1 + 1e-9: m.tick(ts[int(np.argmax(vs >= thr - 1e-9))], 0.042, pan, hi=3000, lo=1300)
        if v1 < v0 and v1 <= thr < v0: m.tick(ts[int(np.argmax(vs <= thr + 1e-9))], 0.035, pan, hi=3000, lo=1300)
for key, v, pan in (('two', 0.25, -0.35), ('five', 0.5, 0.0), ('seven', 0.7, 0.35)):
    ts = T[key]; detents(ts - 0.1, ts + 0.55, 0.0, v, pan)
    m.tick(ts + 0.55, 0.06, pan, hi=2200, lo=900); m.clink(ts + 0.32, 0.025, pan, 2600)   # the setting marked

# ---------------------------------------------------------------- see a doctor, not a shoe shop: the lid slams on the empty box
m.swish(SLAM - 0.75, 0.7, 0.02, 0.35, 900)
m.thud(SLAM, 92, 0.13, 0.35, 0.16); m.tick(SLAM + 0.002, 0.09, 0.35, hi=2600, lo=480); m.tock(SLAM + 0.01, 0.06, 0.35, f=190)
m.rustle(SLAM + 0.02, SLAM + 0.35, 0.015, 0.35)

# ---------------------------------------------------------------- the score
m.pad([38, 50, 57, 62], 0.0, 6.7, 0.6, 1000)                          # the box
m.pluck(LID1 + 0.3, 74, 0.022, -0.2, 0.6); m.pluck(LID1 + 0.54, 69, 0.018, -0.2, 0.7)
m.pad([41, 53, 57, 60], 6.7, 9.6, 0.65, 1000)                         # let's see if your feet need them
m.pad([43, 55, 58, 62], 9.6, 13.2, 0.7, 1200)                         # 26 bones, three arches
m.pad([46, 58, 62, 65], 13.2, 17.2, 0.7, 1200)                        # small muscles
m.pad([41, 53, 57, 60, 65], 17.2, 21.1, 0.75, 1300)                   # they get stronger when they work
m.pad([38, 50, 57, 62], 21.1, 28.1, 0.75, 1400)                       # eight weeks of walking
m.pulse(21.6, 27.4, 125, [57, 62, 65, 62], 0.022, 1300, lvl=lambda t: float(ss(21.6, 22.5, t)) * (1 - float(ss(26.6, 27.4, t))))
m.pad([43, 55, 58, 62, 67], 28.1, 32.7, 0.75, 1500)                   # foot exercises, for free
m.pad([41, 53, 60, 65], 32.7, 40.9, 0.7, 1300)                        # 118 runners
m.pad([38, 50, 53, 57], 40.9, 42.8, 0.65, 900)                        # but don't switch overnight
m.pad([36, 48, 51, 55], 42.8, 50.3, 0.7, 1000)                        # toe shoes, the scan
m.pad([41, 53, 57, 60, 65], 50.3, 61.7, 0.85, 1900)                   # walk, not run; build up slowly
m.pulse(55.5, 61.4, 96, [60, 65, 69, 65, 72, 69, 65, 69], 0.024, 1600, lvl=lambda t: float(ss(55.5, 56.4, t)) * (1 - float(ss(60.7, 61.4, t))))
m.pad([38, 50, 57, 60], 61.7, 71.9, 0.7, 900)                         # see a doctor
m.pad([41, 53, 60, 65, 69, 72], 71.9, T['end'], 1.0, 2400, rel=0.2)
detents(T['final'] + 0.2, T['logo'] - 0.3, 0.7, 0.5, 0.0)             # the last dial turns back to twelve
m.whoosh(T['final'] - 0.1, T['logo'] - T['final'], 220, 2600, 0.05, 0.0)
m.logo_end(T['logo'] - 0.15, T['logo'])
m.room()
m.finish(REPORT, VOICE, OUT, 'film06')

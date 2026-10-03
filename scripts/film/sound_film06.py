"""Film 6 "Are barefoot shoes good for your feet?": score and sound design, timed to films/film06.js.
The steps on the belt come from the same walk the picture uses (walkS and the gait phase); the bones, dots, dials and
the lid from the same timings.
Usage: python3 sound_film06.py <voice guide wav> <voice report json> <out dir>"""
import sys
import numpy as np
from sfx import Mix, SR, ss, env, bp, lp, hp, note

VOICE, REPORT, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
T = dict(end=72.3, q0=0.35, designed=2.01, feel=2.91, noshoes=3.51, dothey=4.93, work=5.63, each=7.24, twentysix=8.39, bones=8.83,
         three=9.50, arches=9.75, small=10.94, muscles=11.64, hold=13.28, up=13.78, like=14.87, stronger=16.42, work2=17.47,
         trial=19.41, eight=19.75, walking=20.47, flat=21.24, made=22.95, fortyone=24.27, stronger2=25.70, exercises=27.76,
         more=29.21, fiftyeight=29.46, nonew=31.61, required=32.74, another=34.75, runners=35.00, training=37.05, fewer=37.67,
         injuries=38.61, year=40.45, but=41.54, overnight=42.69, toe=45.01, tenweeks=45.88, ten=46.48, nineteen=47.43,
         bone=48.37, mri=49.43, ten2=51.08, still=52.02, fast=52.59, worked=54.80, slowly=55.58, two=56.05, five=58.87,
         seven=60.65, feet=61.97, numb=64.04, see=64.80, doctor=65.52, shop=66.20, final=68.19, settings=69.35, logo=70.05)
m = Mix(T['end'], seed=20261006)
rng = np.random.default_rng(66)
def s5(a, b, x):
    u = float(np.clip((x - a) / (b - a), 0, 1)); return u * u * u * (u * (u * 6 - 15) + 10)

# ---------------------------------------------------------------- the walk, exactly as in the picture
STRIDE, WALK0, WALK1 = 1.08, 18.62, 26.35
def walkS(t):
    ramp, v = 0.9, 1.12; D = v * (WALK1 - WALK0 - ramp)
    if t <= WALK0: return 0.0
    if t >= WALK1: return D
    u = t - WALK0; TT = WALK1 - WALK0
    if u < ramp: return v * u * u / (2 * ramp)
    if u > TT - ramp: r = TT - u; return D - v * r * r / (2 * ramp)
    return v * (u - ramp / 2)
def speed(t, h=0.005): return (walkS(t + h) - walkS(t - h)) / (2 * h)
strikes = []   # (time, side): a heel lands when the gait phase of that foot comes round to zero
prev = {'R': None, 'L': None}
for t in np.arange(WALK0, WALK1 + 0.001, 0.001):
    sp = walkS(t) + 0.25 * STRIDE
    for side, off in (('R', 0.0), ('L', 0.5)):
        k = int(np.floor(sp / STRIDE - off))
        if prev[side] is not None and k > prev[side]: strikes.append((float(t), side))
        prev[side] = k
strikes = [(t, s) for t, s in strikes if 19.0 < t < 26.2]

# ---------------------------------------------------------------- the box: a lamp's hum, the lid lifted off, tissue, nothing
tt = m.t(0, 6.5)
hum = (np.sin(2 * np.pi * 120 * tt) + 0.4 * np.sin(2 * np.pi * 240 * tt)) * (0.35 + 0.65 * ss(0, 0.5, tt)) * (1 - ss(4.6, 6.5, tt))
m.add('X', lp(hum, 1200) * 0.008, 0.0, 0.3)
m.rustle(2.42, 2.95, 0.035, 0.25)                                     # card sliding on card as the lid comes up
m.swish(2.75, 0.7, 0.02, 0.3, 900)
m.rustle(3.0, 3.7, 0.022, 0.1)                                        # tissue paper
m.thud(3.5, 120, 0.035, 0.35, 0.07); m.tick(3.52, 0.03, 0.35, hi=1600, lo=420)   # the lid set down, on its edge
m.tock(3.68, 0.07, 0.0, f=210)                                        # and inside: nothing
m.whoosh(4.4, 1.2, 1500, 320, 0.03, -0.2, up=False)                   # across to the shoes on the pad

# ---------------------------------------------------------------- the shoes go clear; 26 bones, heel to toes; three arches; small muscles
m.scan(6.95, 0.9, 0.018, 0.1); m.shimmer(7.2, notes=(81, 88, 93), gain=0.012, pan=0.1, decay=0.5, dur=1.4)
for i in range(26):
    at = T['twentysix'] - 0.05 + i * 0.034
    m.tick(at, 0.026 * rng.uniform(0.8, 1.0), -0.35 + i * 0.028, hi=1500 + i * 55, lo=520 + i * 18)
for i, nn in enumerate((76, 79, 83)):
    t0 = T['three'] + 0.1 + i * 0.3
    m.tone_line(t0, t0 + 1.1, nn, gain=0.011, pan=[0.2, -0.2, 0.0][i], glide=lambda t, t0=t0: 2 * np.clip((t - t0) / 0.7, 0, 1))
m.whoosh(10.85, 1.5, 300, 1400, 0.018, 0.0)
m.drone(10.9, 18.4, 45, 0.022, 380)                                   # the muscles: low and warm
for k in range(5):                                                    # they work: one soft squeeze per pulse of light
    at = T['like'] + (np.pi / 2 + 2 * np.pi * k) / 7.5
    if at < 18.0: m.thud(at, 62, 0.035, 0.0, 0.14); m.swish(at - 0.12, 0.4, 0.008, 0.0, 600)

# ---------------------------------------------------------------- the walking pad: the display wakes, the motor, the belt, his steps
m.beep(18.35, 2093.0, 0.05, 0.03, 0.0); m.beep(18.43, 2637.0, 0.06, 0.03, 0.0)
for k in range(1, 8): m.beep(18.9 + k * 0.875, 2637.0, 0.035, 0.018, 0.0)   # WEEK 2 ... WEEK 8
tt = m.t(18.2, 27.2); sp = np.array([speed(x) for x in tt]) / 1.12
f = 95 + 75 * sp; ph = 2 * np.pi * np.cumsum(f) / SR
motor = (np.sin(ph) + 0.35 * np.sin(2.7 * ph) + 0.15 * np.sign(np.sin(ph))) * (0.25 + 0.75 * sp) * ss(18.2, 18.6, tt) * (1 - ss(26.3, 27.0, tt))
m.add('X', lp(motor, 1800) * 0.009, 18.2, 0.0)
belt = bp(m.noise(len(tt)), 300, 2400) * sp * (0.8 + 0.2 * np.sin(2 * np.pi * 9 * tt)) * (1 - ss(26.3, 27.0, tt))
m.add('X', belt * 0.005, 18.2, 0.0)
for t0, side in strikes:
    g = 0.55 + 0.45 * ss(19.0, 19.8, t0); pan = -0.12 if side == 'R' else 0.12
    m.thud(t0, 72, 0.05 * g, pan, 0.12); m.tick(t0 + 0.004, 0.018 * g, pan, hi=1100, lo=260)
    n = int(0.09 * SR); m.add('X', bp(m.noise(n), 250, 1500) * env(n, 0.002, 0.03) * 0.012 * g, t0 + 0.11, pan)   # the roll to the toes
m.pluck(T['fortyone'] + 0.05, 77, 0.03, 0.2, 0.6)

# ---------------------------------------------------------------- off with the shoes; heel raises, barefoot
m.whoosh(26.85, 0.8, 2200, 600, 0.018, 0.0, up=False); m.shimmer(26.9, notes=(84, 79, 76), gain=0.01, pan=0.0, decay=0.35, dur=1.0)
for r0 in (27.7, 29.45, 31.2):
    m.swish(r0 + 0.02, 0.6, 0.014, -0.2, 800)                          # up onto the toes
    m.thud(r0 + 1.58, 85, 0.04, -0.2, 0.08); m.tick(r0 + 1.59, 0.016, -0.2, hi=1300, lo=300)   # and the heels back down
m.pluck(T['fiftyeight'] + 0.05, 81, 0.03, 0.2, 0.6)
m.tock(T['required'] + 0.35, 0.05, 0.0, f=300)

# ---------------------------------------------------------------- 118 runners: two blocks of light; the untrained hurt more
for i in range(118):
    at = T['runners'] - 0.2 + i * 0.006 + 0.06; grp = i >= 57; j = i - 57 if grp else i
    nn = (86 if not grp else 79) + (j % 8) * 0.5 - (j // 8) * 0.4
    n = int(0.07 * SR); x = np.arange(n) / SR
    m.add('X', np.sin(2 * np.pi * note(nn) * x) * env(n, 0.001, 0.014) * 0.007, at, -0.35 + 0.1 * ((j % 8) - 3.5) / 3.5)
m.pluck(T['fewer'] + 0.1, 62, 0.03, -0.3, 0.8); m.pluck(T['fewer'] + 0.35, 65, 0.022, -0.3, 0.8)
m.tock(T['but'] + 0.04, 0.08, 0.0, f=250)

# ---------------------------------------------------------------- toe shoes, ten weeks; 10 of 19; the MRI
m.beep(44.75, 2093.0, 0.05, 0.025, 0.0)
for k in range(1, 10): m.beep(T['tenweeks'] - 0.25 + k * 0.145, 2637.0, 0.03, 0.015, 0.0)   # WEEK 2 ... WEEK 10, fast
m.swish(44.95, 0.5, 0.02, 0.0, 1200); m.shimmer(45.0, notes=(76, 83, 88), gain=0.012, pan=0.0, decay=0.4, dur=1.2)
for k in range(19):
    at = T['toe'] + k * 0.025 + 0.05; n = int(0.07 * SR); x = np.arange(n) / SR
    m.add('X', np.sin(2 * np.pi * note(84 + k * 0.3) * x) * env(n, 0.001, 0.016) * 0.012, at, -0.5 + k / 18)
for k in range(10):                                                    # ten of them go red
    at = T['ten'] + k * 0.06 + 0.15; n = int(0.12 * SR); x = np.arange(n) / SR
    m.add('X', (np.sin(2 * np.pi * 740 * x) + 0.5 * np.sin(2 * np.pi * 554 * x)) * env(n, 0.002, 0.03) * 0.012, at, -0.5 + k / 18)
for k in range(int((T['mri'] + 0.9 - (T['bone'] - 0.1)) * 6.2)):    # the scanner: knocking, as MRI machines do
    at = T['bone'] - 0.1 + k / 6.2; n = int(0.07 * SR); x = np.arange(n) / SR
    knock = np.sign(np.sin(2 * np.pi * 330 * x)) * env(n, 0.001, 0.02) * (1.0 if k % 4 else 1.4)
    m.add('X', lp(knock, 2500) * 0.01 * min(1, k / 3), at, 0.1)
m.scan(T['bone'] - 0.05, 1.9, 0.016, -0.1)
m.beep(T['ten2'], 2637.0, 0.05, 0.02, 0.0); m.beep(T['ten2'] + 0.2, 2637.0, 0.05, 0.02, 0.0)
m.whoosh(52.4, 0.9, 1800, 500, 0.016, 0.0, up=False)

# ---------------------------------------------------------------- three dials: they rise, they are set
for i, pan in enumerate((-0.35, 0.0, 0.35)):
    t0 = T['worked'] + i * 0.18
    m.whoosh(t0 - 0.05, 0.9, 200, 1300, 0.024, pan); m.thud(t0 + 0.88, 105, 0.035, pan, 0.08)
def detents(t0, t1, v0, v1, pan):
    ts = np.linspace(t0, t1, 400); vs = np.array([v0 + (v1 - v0) * s5(t0, t1, x) for x in ts])
    for k in range(1, 21):
        thr = k / 20
        if v1 > v0 and v0 < thr <= v1 + 1e-9: m.tick(ts[int(np.argmax(vs >= thr - 1e-9))], 0.042, pan, hi=3000, lo=1300)
        if v1 < v0 and v1 <= thr < v0: m.tick(ts[int(np.argmax(vs <= thr + 1e-9))], 0.035, pan, hi=3000, lo=1300)
for i, (key, v, pan) in enumerate((('two', 0.25, -0.35), ('five', 0.5, 0.0), ('seven', 0.7, 0.35))):
    ts = T[key]; detents(ts - 0.1, ts + 0.55, 0.0, v, pan)
    m.tick(ts + 0.55, 0.06, pan, hi=2200, lo=900); m.clink(ts + 0.32, 0.025, pan, 2600)   # the setting marked
# ---------------------------------------------------------------- see a doctor, not a shoe shop: the lid slams on the empty box
m.swish(T['shop'] - 0.75, 0.7, 0.02, 0.35, 900)
m.thud(T['shop'], 92, 0.13, 0.35, 0.16); m.tick(T['shop'] + 0.002, 0.09, 0.35, hi=2600, lo=480); m.tock(T['shop'] + 0.01, 0.06, 0.35, f=190)
m.rustle(T['shop'] + 0.02, T['shop'] + 0.35, 0.015, 0.35)

# ---------------------------------------------------------------- the score
m.pad([38, 50, 57, 62], 0.0, 4.9, 0.6, 1000)                          # the box
m.pluck(T['noshoes'] + 0.18, 74, 0.022, -0.2, 0.6); m.pluck(T['noshoes'] + 0.42, 69, 0.018, -0.2, 0.7)
m.pad([41, 53, 57, 60], 4.9, 7.2, 0.65, 1000)                         # do they work?
m.pad([43, 55, 58, 62], 7.2, 10.9, 0.7, 1200)                         # 26 bones, three arches
m.pad([46, 58, 62, 65], 10.9, 14.8, 0.7, 1200)                        # small muscles
m.pad([41, 53, 57, 60, 65], 14.8, 18.6, 0.75, 1300)                   # they get stronger when they work
m.pad([38, 50, 57, 62], 18.6, 26.6, 0.75, 1400)                       # eight weeks of walking
m.pulse(19.3, 26.0, 125, [57, 62, 65, 62], 0.022, 1300, lvl=lambda t: float(ss(19.3, 20.2, t)) * (1 - float(ss(25.2, 26.0, t))))
m.pad([43, 55, 58, 62, 67], 26.6, 34.0, 0.75, 1500)                   # foot exercises; no new shoes
m.pad([41, 53, 60, 65], 34.0, 41.5, 0.7, 1300)                        # 118 runners
m.pad([38, 50, 53, 57], 41.5, 44.7, 0.65, 900)                        # but don't switch overnight
m.pad([36, 48, 51, 55], 44.7, 53.6, 0.7, 1000)                        # toe shoes, the MRI
m.pad([41, 53, 57, 60, 65], 53.6, 61.9, 0.85, 1900)                   # build up slowly
m.pulse(55.9, 61.6, 96, [60, 65, 69, 65, 72, 69, 65, 69], 0.024, 1600, lvl=lambda t: float(ss(55.9, 56.8, t)) * (1 - float(ss(60.9, 61.6, t))))
m.pad([38, 50, 57, 60], 61.9, 67.6, 0.7, 900)                         # see a doctor
m.pad([41, 53, 60, 65, 69, 72], 67.6, T['end'], 1.0, 2400, rel=0.2)
detents(T['final'] + 0.2, T['logo'] - 0.3, 0.7, 0.5, 0.0)             # the last dial turns back to twelve
m.whoosh(T['final'] - 0.1, T['logo'] - T['final'], 220, 2600, 0.05, 0.0)
m.logo_end(T['logo'] - 0.15, T['logo'])
m.room()
m.finish(REPORT, VOICE, OUT, 'film06')
